import { assertInferenceGraph } from './bayes.ts';
import { InferenceError, SKILL_ORDER } from './dina.ts';
import { ancestors, descendants } from './graph.ts';
import { isBelowThreshold } from './thresholds.ts';
import type {
  ClassDiagnostic,
  EffectiveInterventionConfig,
  InterventionConfig,
  InterventionEvidence,
  InterventionPlan,
  InterventionRanking,
  InterventionRankingBasis,
  InterventionScore,
  InterventionWarning,
  InterventionWeights,
  KnowledgeGraph,
  SkillClassSummary,
  SkillId,
} from './types.ts';

// Valores por defecto: SUPUESTOS no calibrados (§2.6).
const DEFAULT_WEIGHTS: InterventionWeights = { preparation: 0.3, confidence: 0.2, priority: 0.3, relevance: 0.2 };
const DEFAULT_LAMBDA = 0.1;
const DEFAULT_REFERENCE_MINUTES = 30;
const DEFAULT_DURATION_MINUTES = 15;
const DEFAULT_IMPORTANCE = 1;
const DEFAULT_LOW_THRESHOLD = 0.5;

const WEIGHT_SUM_TOLERANCE = 1e-9;

// Distancia al máximo global dentro de la cual dos valores están empatados (§2.6).
const VALUE_TIE_TOLERANCE = 1e-12;

// Desviación de redondeo admitida en una magnitud derivada de [0, 1]. Solo se
// aplica a estas magnitudes, nunca al posterior.
const DERIVED_RANGE_TOLERANCE = 1e-12;

// Coherencia entre la media de dominio y la necesidad de un mismo diagnóstico.
const NEED_CONSISTENCY_TOLERANCE = 1e-9;

const DISCLAIMER =
  'Heurística de priorización: no es una estimación de efecto causal ni una mejora educativa demostrada. ' +
  'Prioriza competencias; no genera actividades ni afirma que las duraciones sean eficaces.';

const ASSUMPTIONS: readonly string[] = [
  'Pesos, lambda y t_ref son SUPUESTOS no calibrados.',
  'Las duraciones y las importancias son SUPUESTOS no calibrados.',
  'Los umbrales de preparación y confianza bajas son SUPUESTOS configurables.',
];

const NO_STUDENTS_MESSAGE = 'No hay alumnos para calcular recomendaciones';
const COLLECT_RESPONSES_MESSAGE =
  'Ningún alumno tiene respuestas: el ranking es un cálculo hipotético basado solo en priors. Hay que recoger respuestas antes de planificar.';

function emptyPlan(): InterventionPlan {
  return { interventions: [], totalMinutes: 0, coverage: 0, benefit: 0, cost: 0, netValue: 0 };
}

function compareIds(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

function interventionId(skill: SkillId): string {
  return `reinforce-${skill}`;
}

function assertInUnit(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new InferenceError('INVALID_INTERVENTION_CONFIG', `${label} debe ser finito en [0, 1]`);
  }
}

function perSkill(
  given: Readonly<Record<SkillId, number>> | undefined,
  fallback: number,
  assertValid: (value: number, label: string) => void,
): Readonly<Record<SkillId, number>> {
  const values = given ?? {};
  for (const skill of Object.keys(values)) {
    if (!SKILL_ORDER.includes(skill)) {
      throw new InferenceError('INVALID_INTERVENTION_CONFIG', `Competencia desconocida: ${skill}`);
    }
  }
  return Object.fromEntries(
    SKILL_ORDER.map((skill) => {
      const value = values[skill] ?? fallback;
      assertValid(value, skill);
      return [skill, value];
    }),
  );
}

function assertPositive(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new InferenceError('INVALID_INTERVENTION_CONFIG', `${label} debe ser finito y mayor que 0`);
  }
}

function effectiveConfig(config: InterventionConfig): EffectiveInterventionConfig {
  const weights = { ...DEFAULT_WEIGHTS, ...config.weights };
  const { preparation, confidence, priority, relevance } = weights;
  const values = [preparation, confidence, priority, relevance];
  if (values.some((weight) => typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0)) {
    throw new InferenceError('INVALID_INTERVENTION_CONFIG', 'Los pesos deben ser finitos y no negativos');
  }
  if (Math.abs(values.reduce((sum, weight) => sum + weight, 0) - 1) > WEIGHT_SUM_TOLERANCE) {
    throw new InferenceError('INVALID_INTERVENTION_CONFIG', 'Los pesos deben sumar 1');
  }

  const {
    lambda = DEFAULT_LAMBDA,
    referenceMinutes = DEFAULT_REFERENCE_MINUTES,
    lowPreparationThreshold = DEFAULT_LOW_THRESHOLD,
    lowConfidenceThreshold = DEFAULT_LOW_THRESHOLD,
  } = config;
  if (typeof lambda !== 'number' || !Number.isFinite(lambda) || lambda < 0) {
    throw new InferenceError('INVALID_INTERVENTION_CONFIG', 'lambda debe ser finito y no negativo');
  }
  assertPositive(referenceMinutes, 't_ref');
  assertInUnit(lowPreparationThreshold, 'El umbral de preparación baja');
  assertInUnit(lowConfidenceThreshold, 'El umbral de confianza baja');

  return {
    weights: { preparation, confidence, priority, relevance },
    lambda,
    referenceMinutes,
    durations: perSkill(config.durations, DEFAULT_DURATION_MINUTES, assertPositive),
    importance: perSkill(config.importance, DEFAULT_IMPORTANCE, assertInUnit),
    lowPreparationThreshold,
    lowConfidenceThreshold,
  };
}

function diagnosticError(message: string): InferenceError {
  return new InferenceError('INVALID_DIAGNOSTIC', message);
}

function isCount(value: unknown, maximum: number): boolean {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= maximum;
}

function expectedStatus(studentCount: number, studentsWithResponses: number): ClassDiagnostic['evidenceStatus'] {
  if (studentCount === 0) return 'emptyClass';
  if (studentsWithResponses === 0) return 'priorsOnly';
  return studentsWithResponses === studentCount ? 'allWithResponses' : 'mixed';
}

function assertCoherentCounts(diagnostic: ClassDiagnostic): void {
  const { studentCount, studentsWithResponses, totalResponseCount } = diagnostic;
  if (!isCount(studentCount, Number.MAX_SAFE_INTEGER) || !isCount(studentsWithResponses, studentCount)) {
    throw diagnosticError('Los recuentos de alumnos no son coherentes');
  }
  if (!isCount(totalResponseCount, Number.MAX_SAFE_INTEGER) || totalResponseCount < studentsWithResponses) {
    throw diagnosticError('El total de respuestas no es coherente');
  }
  if (studentsWithResponses === 0 && totalResponseCount !== 0) {
    throw diagnosticError('Hay respuestas sin alumnos que las hayan dado');
  }
  if (!Array.isArray(diagnostic.students) || diagnostic.students.length !== studentCount) {
    throw diagnosticError('La lista de alumnos no coincide con studentCount');
  }
  if (diagnostic.evidenceStatus !== expectedStatus(studentCount, studentsWithResponses)) {
    throw diagnosticError('evidenceStatus no coincide con los recuentos');
  }
  if (diagnostic.insufficientData !== (studentCount === 0)) {
    throw diagnosticError('insufficientData no coincide con studentCount');
  }
  if (!Array.isArray(diagnostic.warnings)) {
    throw diagnosticError('warnings debe ser una lista');
  }
}

// Comprueba y ajusta una magnitud derivada de [0, 1]: solo absorbe el redondeo.
function derivedUnit(value: number, label: string): number {
  if (!Number.isFinite(value) || value < -DERIVED_RANGE_TOLERANCE || value > 1 + DERIVED_RANGE_TOLERANCE) {
    throw diagnosticError(`${label} está fuera de [0, 1]: ${value}`);
  }
  return Math.min(1, Math.max(0, value));
}

function assertCoherentSkill(summary: SkillClassSummary, studentCount: number): void {
  const { skill, belowTauCount, uncertainCount, expectedReinforcementCount } = summary;
  if (!isCount(belowTauCount, studentCount) || !isCount(uncertainCount, studentCount)) {
    throw diagnosticError(`Recuentos incoherentes en ${skill}`);
  }
  const means = [summary.meanMastery, summary.meanEntropy, summary.meanPrerequisiteProbability];

  if (studentCount === 0) {
    if (expectedReinforcementCount !== 0 || means.some((mean) => mean !== null)) {
      throw diagnosticError(`Una clase vacía debe tener sumas a 0 y medias a null en ${skill}`);
    }
    return;
  }

  if (means.some((mean) => typeof mean !== 'number') || typeof expectedReinforcementCount !== 'number') {
    throw diagnosticError(`Faltan magnitudes en ${skill}`);
  }
  const need = derivedUnit(expectedReinforcementCount / studentCount, `La necesidad de ${skill}`);
  const mastery = derivedUnit(summary.meanMastery ?? Number.NaN, `El dominio medio de ${skill}`);
  derivedUnit(summary.meanEntropy ?? Number.NaN, `La entropía media de ${skill}`);
  derivedUnit(summary.meanPrerequisiteProbability ?? Number.NaN, `La preparación de ${skill}`);
  if (Math.abs(mastery + need - 1) > NEED_CONSISTENCY_TOLERANCE) {
    throw diagnosticError(`El dominio medio y la necesidad de ${skill} no son coherentes`);
  }
}

// El diagnóstico es una entrada serializable: no se da por válido.
function skillSummaries(diagnostic: ClassDiagnostic): ReadonlyMap<SkillId, SkillClassSummary> {
  if (typeof diagnostic !== 'object' || diagnostic === null || !Array.isArray(diagnostic.skills)) {
    throw diagnosticError('El diagnóstico no tiene la forma esperada');
  }
  assertCoherentCounts(diagnostic);

  const summaries = new Map<SkillId, SkillClassSummary>();
  for (const summary of diagnostic.skills) {
    if (typeof summary !== 'object' || summary === null || !SKILL_ORDER.includes(summary.skill)) {
      throw diagnosticError('El diagnóstico cita una competencia desconocida');
    }
    if (summaries.has(summary.skill)) {
      throw diagnosticError(`Competencia repetida: ${summary.skill}`);
    }
    assertCoherentSkill(summary, diagnostic.studentCount);
    summaries.set(summary.skill, summary);
  }
  if (summaries.size !== SKILL_ORDER.length) {
    throw diagnosticError('El diagnóstico debe incluir las seis competencias');
  }
  return summaries;
}

// Una competencia sin ancestros tiene preparación 1 (§2.6).
function assertRootsFullyPrepared(summaries: ReadonlyMap<SkillId, SkillClassSummary>, graph: KnowledgeGraph): void {
  for (const skill of SKILL_ORDER) {
    const preparation = summaries.get(skill)?.meanPrerequisiteProbability;
    if (ancestors(graph, skill).length === 0 && preparation !== 1) {
      throw diagnosticError(`${skill} no tiene ancestros y su preparación debe ser 1`);
    }
  }
}

interface SkillMetrics {
  readonly need: number;
  readonly preparation: number;
  readonly confidence: number;
  readonly mastery: number;
}

interface Model {
  readonly config: EffectiveInterventionConfig;
  readonly metrics: ReadonlyMap<SkillId, SkillMetrics>;
  readonly descendantsOf: ReadonlyMap<SkillId, readonly SkillId[]>;
  readonly totalImportance: number;
}

function metricsOf(summary: SkillClassSummary, studentCount: number): SkillMetrics {
  return {
    need: derivedUnit(summary.expectedReinforcementCount / studentCount, 'La necesidad'),
    preparation: derivedUnit(summary.meanPrerequisiteProbability ?? Number.NaN, 'La preparación'),
    confidence: derivedUnit(1 - (summary.meanEntropy ?? Number.NaN), 'La confianza'),
    mastery: derivedUnit(summary.meanMastery ?? Number.NaN, 'El dominio medio'),
  };
}

function needOf(model: Model, skill: SkillId): number {
  return model.metrics.get(skill)?.need ?? Number.NaN;
}

function importanceOf(model: Model, skill: SkillId): number {
  return model.config.importance[skill] ?? Number.NaN;
}

function durationOf(model: Model, skill: SkillId): number {
  return model.config.durations[skill] ?? Number.NaN;
}

function isDescendant(model: Model, descendant: SkillId, skill: SkillId): boolean {
  return model.descendantsOf.get(skill)?.includes(descendant) ?? false;
}

// cobertura(S): cada descendiente cuenta una vez, con la mayor necesidad de las
// competencias de S de las que depende.
function coverage(model: Model, skills: readonly SkillId[]): number {
  if (model.totalImportance === 0) {
    return 0;
  }
  const covered = SKILL_ORDER.reduce((sum, descendant) => {
    const needs = skills.filter((skill) => isDescendant(model, descendant, skill)).map((skill) => needOf(model, skill));
    return sum + importanceOf(model, descendant) * Math.max(0, ...needs);
  }, 0);
  return covered / model.totalImportance;
}

function skillBenefit(model: Model, skill: SkillId): number {
  const { weights } = model.config;
  const metrics = model.metrics.get(skill);
  if (metrics === undefined) return Number.NaN;
  return (
    metrics.need *
    (weights.preparation * metrics.preparation +
      weights.confidence * metrics.confidence +
      weights.priority * importanceOf(model, skill))
  );
}

function benefit(model: Model, skills: readonly SkillId[]): number {
  const direct = skills.reduce((sum, skill) => sum + skillBenefit(model, skill), 0);
  return direct + model.config.weights.relevance * coverage(model, skills);
}

function totalMinutes(model: Model, skills: readonly SkillId[]): number {
  return skills.reduce((sum, skill) => sum + durationOf(model, skill), 0);
}

function cost(model: Model, skills: readonly SkillId[]): number {
  return (model.config.lambda * totalMinutes(model, skills)) / model.config.referenceMinutes;
}

function scoreOf(model: Model, skill: SkillId, title: string): InterventionScore {
  const { weights } = model.config;
  const metrics = model.metrics.get(skill);
  if (metrics === undefined) {
    throw diagnosticError(`Faltan magnitudes en ${skill}`);
  }
  const importance = importanceOf(model, skill);
  const relevant = model.descendantsOf.get(skill) ?? [];
  const relevance =
    model.totalImportance === 0
      ? 0
      : relevant.reduce((sum, descendant) => sum + importanceOf(model, descendant), 0) / model.totalImportance;

  const benefitOfSkill = benefit(model, [skill]);
  const costOfSkill = cost(model, [skill]);
  const netValue = benefitOfSkill - costOfSkill;
  const durationMinutes = durationOf(model, skill);

  return {
    id: interventionId(skill),
    skill,
    title,
    durationMinutes,
    components: {
      need: metrics.need,
      relevance,
      preparation: metrics.preparation,
      confidence: metrics.confidence,
      priority: importance,
    },
    contributions: {
      preparation: metrics.need * weights.preparation * metrics.preparation,
      confidence: metrics.need * weights.confidence * metrics.confidence,
      priority: metrics.need * weights.priority * importance,
      coverage: weights.relevance * coverage(model, [skill]),
    },
    benefit: benefitOfSkill,
    cost: costOfSkill,
    netValue,
    valuePerMinute: netValue / durationMinutes,
  };
}

// En cada iteración añade todo el grupo a distancia ≤ 1e-12 del máximo actual,
// ordenado por duración e id, y continúa con las restantes (§2.6).
export function rankWithTies<T extends Pick<InterventionScore, 'id' | 'durationMinutes' | 'netValue'>>(
  scores: readonly T[],
): readonly T[] {
  const ranked: T[] = [];
  let remaining = [...scores];
  while (remaining.length > 0) {
    const best = Math.max(...remaining.map((score) => score.netValue));
    const isTied = (score: T): boolean => best - score.netValue <= VALUE_TIE_TOLERANCE;
    ranked.push(
      ...remaining
        .filter(isTied)
        .sort((a, b) => a.durationMinutes - b.durationMinutes || compareIds(a.id, b.id)),
    );
    remaining = remaining.filter((score) => !isTied(score));
  }
  return ranked;
}

function compareIdLists(a: readonly string[], b: readonly string[]): number {
  const shared = Math.min(a.length, b.length);
  for (let position = 0; position < shared; position += 1) {
    const order = compareIds(a[position] ?? '', b[position] ?? '');
    if (order !== 0) return order;
  }
  return a.length - b.length;
}

function allSubsets(): readonly (readonly SkillId[])[] {
  return Array.from({ length: 2 ** SKILL_ORDER.length }, (_, mask) =>
    SKILL_ORDER.filter((_skill, position) => (mask >> position) & 1),
  );
}

interface PlanCandidate {
  readonly skills: readonly SkillId[];
  readonly ids: readonly string[];
  readonly minutes: number;
  readonly value: number;
}

// Enumeración exacta de los 64 subconjuntos, incluido el vacío.
function bestSubset(model: Model, availableMinutes: number): readonly SkillId[] {
  const feasible: readonly PlanCandidate[] = allSubsets()
    .map((skills) => ({
      skills,
      ids: skills.map(interventionId).sort(compareIds),
      minutes: totalMinutes(model, skills),
      value: benefit(model, skills) - cost(model, skills),
    }))
    .filter((candidate) => candidate.minutes <= availableMinutes);

  const best = Math.max(...feasible.map((candidate) => candidate.value));
  const [selected] = feasible
    .filter((candidate) => best - candidate.value <= VALUE_TIE_TOLERANCE)
    .sort((a, b) => a.minutes - b.minutes || compareIdLists(a.ids, b.ids));
  return selected?.skills ?? [];
}

function planFor(model: Model, skills: readonly SkillId[], ranking: readonly InterventionScore[]): InterventionPlan {
  const benefitOfPlan = benefit(model, skills);
  const costOfPlan = cost(model, skills);
  return {
    interventions: ranking
      .filter((score) => skills.includes(score.skill))
      .map(({ id, skill, title, durationMinutes }) => ({ id, skill, title, durationMinutes }))
      .sort((a, b) => compareIds(a.id, b.id)),
    totalMinutes: totalMinutes(model, skills),
    coverage: coverage(model, skills),
    benefit: benefitOfPlan,
    cost: costOfPlan,
    netValue: benefitOfPlan - costOfPlan,
  };
}

// Ancestro con menor dominio medio. El empate usa la misma tolerancia que los
// demás empates: con priors uniformes, si no, decidiría el redondeo.
function weakestAncestor(model: Model, skill: SkillId, graph: KnowledgeGraph): SkillId | null {
  const related = ancestors(graph, skill);
  const masteryOf = (ancestor: SkillId): number => model.metrics.get(ancestor)?.mastery ?? Number.NaN;
  const lowest = Math.min(...related.map(masteryOf));
  const [weakest] = related.filter((ancestor) => masteryOf(ancestor) - lowest <= VALUE_TIE_TOLERANCE).sort(compareIds);
  return weakest ?? null;
}

function skillWarnings(model: Model, score: InterventionScore, graph: KnowledgeGraph): readonly InterventionWarning[] {
  const { lowPreparationThreshold, lowConfidenceThreshold } = model.config;
  const warnings: InterventionWarning[] = [];

  if (isBelowThreshold(score.components.preparation, lowPreparationThreshold)) {
    const ancestor = weakestAncestor(model, score.skill, graph);
    warnings.push({
      code: 'LOW_PREPARATION',
      message: `${score.skill}: conviene reforzar antes el prerrequisito ${ancestor ?? ''}`,
      skill: score.skill,
      ancestor,
    });
  }
  if (isBelowThreshold(score.components.confidence, lowConfidenceThreshold)) {
    warnings.push({
      code: 'LOW_CONFIDENCE',
      message: `${score.skill}: la estimación es incierta; considerar más evaluación antes de intervenir`,
      skill: score.skill,
      ancestor: null,
    });
  }
  return warnings;
}

function evidenceOf(diagnostic: ClassDiagnostic): InterventionEvidence {
  const { evidenceStatus, studentCount, studentsWithResponses, totalResponseCount, warnings } = diagnostic;
  return {
    status: evidenceStatus,
    studentCount,
    studentsWithResponses,
    totalResponseCount,
    proportionWithoutResponses: studentCount === 0 ? null : (studentCount - studentsWithResponses) / studentCount,
    warnings: [...warnings],
  };
}

function basisOf(diagnostic: ClassDiagnostic): InterventionRankingBasis {
  if (diagnostic.evidenceStatus === 'emptyClass') return 'noStudents';
  return diagnostic.evidenceStatus === 'priorsOnly' ? 'hypotheticalPriorsOnly' : 'withResponses';
}

export function rankInterventions(
  classDiagnostic: ClassDiagnostic,
  knowledgeGraph: KnowledgeGraph,
  availableMinutes: number,
  config: InterventionConfig = {},
): InterventionRanking {
  const effective = effectiveConfig(config);
  assertInferenceGraph(knowledgeGraph);
  if (typeof availableMinutes !== 'number' || !Number.isFinite(availableMinutes) || availableMinutes < 0) {
    throw new InferenceError('INVALID_BUDGET', 'El presupuesto debe ser finito y no negativo');
  }
  const summaries = skillSummaries(classDiagnostic);

  const common = {
    config: effective,
    availableMinutes,
    basis: basisOf(classDiagnostic),
    evidence: evidenceOf(classDiagnostic),
    assumptions: [...ASSUMPTIONS],
    disclaimer: DISCLAIMER,
  };

  if (classDiagnostic.studentCount === 0) {
    return {
      ...common,
      ranking: [],
      plan: emptyPlan(),
      warnings: [{ code: 'NO_STUDENTS', message: NO_STUDENTS_MESSAGE, skill: null, ancestor: null }],
    };
  }

  assertRootsFullyPrepared(summaries, knowledgeGraph);

  const model: Model = {
    config: effective,
    metrics: new Map(
      SKILL_ORDER.flatMap((skill) => {
        const summary = summaries.get(skill);
        return summary === undefined ? [] : [[skill, metricsOf(summary, classDiagnostic.studentCount)] as const];
      }),
    ),
    descendantsOf: new Map(SKILL_ORDER.map((skill) => [skill, descendants(knowledgeGraph, skill)])),
    totalImportance: SKILL_ORDER.reduce((sum, skill) => sum + (effective.importance[skill] ?? 0), 0),
  };

  const titleOf = (skill: SkillId): string =>
    `Reforzar ${knowledgeGraph.nodes.find((node) => node.id === skill)?.name ?? skill}`;
  const scores = SKILL_ORDER.map((skill) => scoreOf(model, skill, titleOf(skill)));
  const ranking = rankWithTies(scores);

  const priorsOnly = classDiagnostic.evidenceStatus === 'priorsOnly';
  const plan = priorsOnly ? emptyPlan() : planFor(model, bestSubset(model, availableMinutes), ranking);
  const collect: readonly InterventionWarning[] = priorsOnly
    ? [{ code: 'COLLECT_RESPONSES', message: COLLECT_RESPONSES_MESSAGE, skill: null, ancestor: null }]
    : [];

  return {
    ...common,
    ranking,
    plan,
    warnings: [...collect, ...scores.flatMap((score) => skillWarnings(model, score, knowledgeGraph))],
  };
}
