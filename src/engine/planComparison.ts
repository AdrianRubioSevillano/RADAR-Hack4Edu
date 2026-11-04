import { classThresholdProblem, summarizeSkill } from './classDiagnostic.ts';
import { SKILL_ORDER } from './dina.ts';
import { binaryEntropy } from './entropy.ts';
import { ancestors } from './graph.ts';
import {
  analyzeInterventions,
  compareIds,
  derivedUnit,
  diagnosticError,
  emptyPlan,
  feasibleCandidates,
  isCount,
  keepHighest,
  planFor,
  shortestThenIds,
  totalImportanceOf,
} from './interventions.ts';
import type { Model } from './interventions.ts';
import type {
  ClassDiagnostic,
  EffectiveInterventionConfig,
  InterventionConfig,
  InterventionPlanComparison,
  InterventionRanking,
  KnowledgeGraph,
  PlanComparisonWarning,
  PlanNeedAnalysis,
  SkillId,
  StudentClassSummary,
  StudentPendingNeed,
  StudentSkillSummary,
} from './types.ts';

// Coherencia del detalle por alumno: con la entropía de cada probabilidad, con
// las cotas de la preparación y, sobre medias, con el agregado.
const DETAIL_TOLERANCE = 1e-9;

const DISCLAIMER =
  'Los índices son necesidad estimada según el modelo, ponderada por importancia: no son probabilidades de mejora. ' +
  'Programar una competencia no significa que se haya aprendido ni que la intervención sea eficaz, y no se asume nada de sus descendientes. ' +
  'Ambos planes son heurísticas distintas: no se afirma superioridad ni equidad educativa demostrada.';

const ASSUMPTION =
  'La necesidad pendiente solo descuenta las competencias directamente programadas; el presupuesto limita el tiempo y el coste solo desempata.';

const ZERO_IMPORTANCE_MESSAGE =
  'Todas las importancias son 0: los índices normalizados no están definidos y el plan por necesidad pendiente queda vacío. No significa que no haya necesidad.';
const HYPOTHETICAL_MESSAGE =
  'Ningún alumno tiene respuestas: el análisis de necesidad pendiente es hipotético, basado solo en priors, y ambos planes quedan vacíos.';

function assertSkillRow(row: StudentSkillSummary, label: string): void {
  for (const probability of [row.masteryProbability, row.prerequisiteProbability]) {
    if (typeof probability !== 'number' || !Number.isFinite(probability) || probability < 0 || probability > 1) {
      throw diagnosticError(`${label}: probabilidad fuera de [0, 1]`);
    }
  }
  const entropy = derivedUnit(row.entropy, `${label}: la entropía`);
  if (Math.abs(entropy - binaryEntropy(row.masteryProbability)) > DETAIL_TOLERANCE) {
    throw diagnosticError(`${label}: la entropía no corresponde a la probabilidad`);
  }
}

function rowsOf(student: StudentClassSummary): ReadonlyMap<SkillId, StudentSkillSummary> {
  const { studentId, skills } = student;
  if (!Array.isArray(skills)) {
    throw diagnosticError(`${studentId}: faltan sus competencias`);
  }
  const rows = new Map<SkillId, StudentSkillSummary>();
  for (const row of skills) {
    if (typeof row !== 'object' || row === null || !SKILL_ORDER.includes(row.skill)) {
      throw diagnosticError(`${studentId}: cita una competencia desconocida`);
    }
    if (rows.has(row.skill)) {
      throw diagnosticError(`${studentId}: competencia repetida ${row.skill}`);
    }
    assertSkillRow(row, `${studentId}, ${row.skill}`);
    rows.set(row.skill, row);
  }
  if (rows.size !== SKILL_ORDER.length) {
    throw diagnosticError(`${studentId}: debe incluir las seis competencias`);
  }
  return rows;
}

// Sin la conjunta, la preparación solo puede contrastarse con lo que cumple
// cualquier distribución: las cotas de Fréchet de sus ancestros.
function assertPreparationBounds(
  studentId: string,
  rows: ReadonlyMap<SkillId, StudentSkillSummary>,
  graph: KnowledgeGraph,
): void {
  const probabilityOf = (skill: SkillId): number => rows.get(skill)?.masteryProbability ?? Number.NaN;
  for (const skill of SKILL_ORDER) {
    const preparation = rows.get(skill)?.prerequisiteProbability ?? Number.NaN;
    const related = ancestors(graph, skill).map(probabilityOf);
    const upper = Math.min(1, ...related);
    const lower = 1 - related.reduce((sum, probability) => sum + (1 - probability), 0);
    const isRootMismatch = related.length === 0 && preparation !== 1;
    if (isRootMismatch || preparation > upper + DETAIL_TOLERANCE || preparation < lower - DETAIL_TOLERANCE) {
      throw diagnosticError(`${studentId}, ${skill}: la preparación no es compatible con las probabilidades de sus ancestros`);
    }
  }
}

function isClose(a: number | null, b: number | null): boolean {
  return a !== null && b !== null && Math.abs(a - b) <= DETAIL_TOLERANCE;
}

function assertReconciled(diagnostic: ClassDiagnostic, students: readonly StudentClassSummary[]): void {
  const withResponses = students.filter((student) => student.responseCount > 0).length;
  const responses = students.reduce((total, student) => total + student.responseCount, 0);
  if (withResponses !== diagnostic.studentsWithResponses || responses !== diagnostic.totalResponseCount) {
    throw diagnosticError('Las respuestas de los alumnos no coinciden con el agregado');
  }
  if (students.length === 0) {
    return;
  }

  for (const summary of diagnostic.skills) {
    const expected = summarizeSkill(summary.skill, students, diagnostic.config);
    const isCoherent =
      summary.belowTauCount === expected.belowTauCount &&
      summary.uncertainCount === expected.uncertainCount &&
      isClose(summary.meanMastery, expected.meanMastery) &&
      isClose(summary.meanEntropy, expected.meanEntropy) &&
      isClose(summary.meanPrerequisiteProbability, expected.meanPrerequisiteProbability) &&
      isClose(summary.expectedReinforcementCount / students.length, expected.expectedReinforcementCount / students.length);
    if (!isCoherent) {
      throw diagnosticError(`El detalle de los alumnos no coincide con el agregado de ${summary.skill}`);
    }
  }
}

// Alumnos validados, por id: el orden de entrada no decide ninguna suma.
function validatedStudents(diagnostic: ClassDiagnostic, graph: KnowledgeGraph): readonly StudentClassSummary[] {
  const { config } = diagnostic;
  const problem = typeof config === 'object' && config !== null ? classThresholdProblem(config) : 'Faltan los umbrales';
  if (problem !== null) {
    throw diagnosticError(problem);
  }

  const ids = new Set<string>();
  for (const student of diagnostic.students) {
    if (typeof student !== 'object' || student === null || typeof student.studentId !== 'string' || student.studentId.trim() === '') {
      throw diagnosticError('Hay un alumno sin id');
    }
    if (ids.has(student.studentId)) {
      throw diagnosticError(`Alumno duplicado: ${student.studentId}`);
    }
    ids.add(student.studentId);
    if (!isCount(student.responseCount, Number.MAX_SAFE_INTEGER)) {
      throw diagnosticError(`${student.studentId}: responseCount inválido`);
    }
    assertPreparationBounds(student.studentId, rowsOf(student), graph);
  }

  const students = [...diagnostic.students].sort((a, b) => compareIds(a.studentId, b.studentId));
  assertReconciled(diagnostic, students);
  return students;
}

interface Weighting {
  readonly importance: Readonly<Record<SkillId, number>>;
  // D = Σ_k w_k.
  readonly total: number;
}

function needOf(student: StudentClassSummary, skill: SkillId): number {
  const row = student.skills.find((item) => item.skill === skill);
  return 1 - (row?.masteryProbability ?? Number.NaN);
}

function weightOf(weighting: Weighting, skill: SkillId): number {
  return weighting.importance[skill] ?? Number.NaN;
}

function needIndex(student: StudentClassSummary, skills: readonly SkillId[], weighting: Weighting): number {
  const weighted = skills.reduce((sum, skill) => sum + weightOf(weighting, skill) * needOf(student, skill), 0);
  return weighted / weighting.total;
}

function pendingIndex(student: StudentClassSummary, scheduled: readonly SkillId[], weighting: Weighting): number {
  const unscheduled = SKILL_ORDER.filter((skill) => !scheduled.includes(skill));
  return needIndex(student, unscheduled, weighting);
}

function meanOf(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxOf(values: readonly number[]): number {
  return values.reduce((highest, value) => Math.max(highest, value));
}

function analyzeStudent(
  student: StudentClassSummary,
  scheduled: readonly SkillId[],
  weighting: Weighting,
): StudentPendingNeed {
  const isDefined = weighting.total > 0;
  const baseline = isDefined ? needIndex(student, SKILL_ORDER, weighting) : null;
  const pending = isDefined ? pendingIndex(student, scheduled, weighting) : null;
  return {
    studentId: student.studentId,
    responseCount: student.responseCount,
    basedOnPriorOnly: student.responseCount === 0,
    baseline,
    scheduled: baseline === null || pending === null ? null : baseline - pending,
    pending,
    skills: SKILL_ORDER.map((skill) => {
      const need = needOf(student, skill);
      const importance = weightOf(weighting, skill);
      const isScheduled = scheduled.includes(skill);
      const skillBaseline = isDefined ? (importance * need) / weighting.total : null;
      const zero = isDefined ? 0 : null;
      return {
        skill,
        need,
        importance,
        isScheduled,
        baseline: skillBaseline,
        scheduled: isScheduled ? skillBaseline : zero,
        pending: isScheduled ? zero : skillBaseline,
      };
    }),
  };
}

function analyzePlan(
  students: readonly StudentClassSummary[],
  scheduled: readonly SkillId[],
  weighting: Weighting,
): PlanNeedAnalysis {
  const analyzed = students.map((student) => analyzeStudent(student, scheduled, weighting));
  const pending = analyzed.flatMap((student) => (student.pending === null ? [] : [student.pending]));
  return {
    scheduledSkills: scheduled,
    students: analyzed,
    meanPending: pending.length === 0 ? null : meanOf(pending),
    maxPending: pending.length === 0 ? null : maxOf(pending),
  };
}

function keepLowest<T>(candidates: readonly T[], valueOf: (candidate: T) => number): readonly T[] {
  return keepHighest(candidates, (candidate) => -valueOf(candidate));
}

function pendingNeedSubset(
  model: Model,
  availableSeconds: number,
  students: readonly StudentClassSummary[],
  weighting: Weighting,
): readonly SkillId[] {
  const candidates = feasibleCandidates(model, availableSeconds).map((candidate) => {
    const pending = students.map((student) => pendingIndex(student, candidate.skills, weighting));
    return { ...candidate, maxPending: maxOf(pending), meanPending: meanOf(pending) };
  });
  const lowestMax = keepLowest(candidates, (candidate) => candidate.maxPending);
  const lowestMean = keepLowest(lowestMax, (candidate) => candidate.meanPending);
  return shortestThenIds(keepHighest(lowestMean, (candidate) => candidate.value));
}

function globalWarning(code: PlanComparisonWarning['code'], message: string): PlanComparisonWarning {
  return { code, message, skill: null, ancestor: null };
}

function comparisonWarnings(result: InterventionRanking, weighting: Weighting): readonly PlanComparisonWarning[] {
  const { status, studentCount, studentsWithResponses } = result.evidence;
  const withoutResponses = studentCount - studentsWithResponses;
  return [
    ...result.warnings,
    ...(weighting.total === 0 ? [globalWarning('ZERO_TOTAL_IMPORTANCE', ZERO_IMPORTANCE_MESSAGE)] : []),
    ...(status === 'priorsOnly' ? [globalWarning('HYPOTHETICAL_ANALYSIS', HYPOTHETICAL_MESSAGE)] : []),
    ...(status === 'mixed'
      ? [
          globalWarning(
            'PRIOR_ONLY_STUDENTS',
            `${withoutResponses} de ${studentCount} alumnos no tienen respuestas: su necesidad pendiente procede únicamente del prior.`,
          ),
        ]
      : []),
  ];
}

function weightingOf(config: EffectiveInterventionConfig): Weighting {
  return { importance: config.importance, total: totalImportanceOf(config) };
}

export function compareInterventionPlans(
  classDiagnostic: ClassDiagnostic,
  knowledgeGraph: KnowledgeGraph,
  availableMinutes: number,
  config: InterventionConfig = {},
): InterventionPlanComparison {
  const { result, model, availableSeconds } = analyzeInterventions(classDiagnostic, knowledgeGraph, availableMinutes, config);
  const students = validatedStudents(classDiagnostic, knowledgeGraph);
  const weighting = weightingOf(result.config);

  const collectiveSkills = SKILL_ORDER.filter((skill) => result.plan.interventions.some((item) => item.skill === skill));
  const canPlan = model !== null && result.basis === 'withResponses' && weighting.total > 0;
  const pendingNeedSkills = canPlan ? pendingNeedSubset(model, availableSeconds, students, weighting) : [];

  return {
    config: result.config,
    availableMinutes,
    basis: result.basis,
    evidence: result.evidence,
    collectivePlan: { plan: result.plan, analysis: analyzePlan(students, collectiveSkills, weighting) },
    pendingNeedPlan: {
      plan: canPlan ? planFor(model, pendingNeedSkills, result.ranking) : emptyPlan(),
      analysis: analyzePlan(students, pendingNeedSkills, weighting),
    },
    plansCoincide:
      collectiveSkills.length === pendingNeedSkills.length &&
      collectiveSkills.every((skill) => pendingNeedSkills.includes(skill)),
    warnings: comparisonWarnings(result, weighting),
    assumptions: [...result.assumptions, ASSUMPTION],
    disclaimer: DISCLAIMER,
  };
}
