import { assertValidBank, assertValidDiagnosticState } from '../engine/answers.ts';
import { assertInferenceGraph } from '../engine/bayes.ts';
import {
  SKILL_ORDER,
  ancestors,
  correctProbability,
  createInitialDiagnosticState,
  fixedQuestionOrder,
  requiredSkills,
  submitAnswer,
} from '../engine/index.ts';
import type {
  DiagnosticState,
  EffectivePriorConfig,
  InterventionPlan,
  KnowledgeGraph,
  MasteryVector,
  PriorConfig,
  Question,
  QuestionBank,
  QuestionId,
  SkillId,
} from '../engine/index.ts';
import { aggregateReport, studentReport } from './postInterventionReport.ts';
import { createResponseUniforms, simulateResponse } from './responder.ts';
import { GENERATOR, STREAMS, SimulationError, assertValidSeed, createStream } from './rng.ts';
import { assertValidClass, isBlank, isInUnit } from './syntheticClass.ts';
import type {
  EffectivePostInterventionConfig,
  EffectiveSyntheticInterventionConfig,
  PostInterventionConfig,
  PostInterventionInput,
  PostInterventionReport,
  RealItemParameters,
  ResponseUniformTable,
  SimulatedMasteryChange,
  SyntheticAssignment,
  SyntheticClass,
  SyntheticInterventionConfig,
  SyntheticInterventionResult,
  SyntheticStudent,
} from './types.ts';

// Valores por defecto: SUPUESTOS no calibrados (§2.8).
const DEFAULT_IMPROVEMENT_PROBABILITY = 0.35;
const DEFAULT_PREREQUISITE_IMPROVEMENT_FACTOR = 0.5;
const DEFAULT_CONTROL_FRACTION = 0;

const INTERVENTION_ID_PREFIX = 'reinforce-';

// Tolerancia numérica del recuento de controles: 100·0.29 da 28.999999999999996 en
// coma flotante. No es incertidumbre estadística.
const CONTROL_COUNT_TOLERANCE = 1e-12;

// Diferencia de redondeo admitida entre totalMinutes y la suma de las duraciones.
const TOTAL_MINUTES_TOLERANCE = 1e-9;

const DISCLAIMER =
  'Son cambios del estado real simulado, con parámetros SUPUESTOS no calibrados: no son aprendizaje observado ni demuestran eficacia educativa. ' +
  'postClass no se regenera desde la semilla de población: reconstruirlo requiere también el plan, el estado anterior y la semilla y configuración de intervención.';

const ASSUMPTIONS: readonly string[] = [
  'improvementProbability y prerequisiteImprovementFactor son SUPUESTOS no calibrados.',
  'Solo se simulan mejoras directas: sin cascada dentro del plan y sin pérdida de dominio.',
];

function configError(message: string): SimulationError {
  return new SimulationError('INVALID_INTERVENTION_CONFIG', message);
}

function planError(message: string): SimulationError {
  return new SimulationError('INVALID_INTERVENTION_PLAN', message);
}

function effectiveConfig(config: SyntheticInterventionConfig): EffectiveSyntheticInterventionConfig {
  if (typeof config !== 'object' || config === null) {
    throw configError('La configuración no tiene la forma esperada');
  }
  const {
    improvementProbability = DEFAULT_IMPROVEMENT_PROBABILITY,
    prerequisiteImprovementFactor = DEFAULT_PREREQUISITE_IMPROVEMENT_FACTOR,
    controlFraction = DEFAULT_CONTROL_FRACTION,
  } = config;
  if (![improvementProbability, prerequisiteImprovementFactor, controlFraction].every(isInUnit)) {
    throw configError('Probabilidad, factor y fracción de control deben ser finitos en [0, 1]');
  }
  return { improvementProbability, prerequisiteImprovementFactor, controlFraction };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// Del plan solo se usan sus competencias. Sus valores se comprueban como parte de
// la forma, pero ninguno interviene en la simulación.
function plannedSkills(plan: InterventionPlan): readonly SkillId[] {
  if (typeof plan !== 'object' || plan === null || !Array.isArray(plan.interventions)) {
    throw planError('El plan no tiene la forma esperada');
  }
  if (![plan.totalMinutes, plan.coverage, plan.benefit, plan.cost, plan.netValue].every(isFiniteNumber)) {
    throw planError('El plan tiene magnitudes no finitas');
  }

  const skills = new Set<SkillId>();
  let minutes = 0;
  for (const item of plan.interventions as readonly InterventionPlan['interventions'][number][]) {
    if (typeof item !== 'object' || item === null || !SKILL_ORDER.includes(item.skill)) {
      throw planError('El plan cita una competencia desconocida');
    }
    if (skills.has(item.skill)) {
      throw planError(`Competencia repetida: ${item.skill}`);
    }
    if (item.id !== `${INTERVENTION_ID_PREFIX}${item.skill}`) {
      throw planError(`El id ${String(item.id)} no corresponde a ${item.skill}`);
    }
    if (isBlank(item.title) || !isFiniteNumber(item.durationMinutes) || item.durationMinutes <= 0) {
      throw planError(`La intervención ${item.id} no tiene la forma esperada`);
    }
    skills.add(item.skill);
    minutes += item.durationMinutes;
  }
  if (Math.abs(minutes - plan.totalMinutes) > TOTAL_MINUTES_TOLERANCE) {
    throw planError('totalMinutes no coincide con las duraciones');
  }
  return SKILL_ORDER.filter((skill) => skills.has(skill));
}

function assertCopyableStudents(students: readonly SyntheticStudent[]): void {
  for (const { studentId, displayName, groupId } of students) {
    if (isBlank(displayName) || isBlank(groupId)) {
      throw new SimulationError('INVALID_SYNTHETIC_CLASS', `${studentId}: faltan su nombre o su grupo`);
    }
  }
}

// JSON escapa los ids. Las etiquetas no incluyen el plan ni el método.
function firstUniform(seed: number, key: readonly string[]): number {
  return createStream(seed, `${STREAMS.intervention}/${JSON.stringify(key)}`)();
}

function compareText(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

function controlCountOf(studentCount: number, controlFraction: number): number {
  const exact = studentCount * controlFraction;
  const nearest = Math.round(exact);
  return Math.abs(exact - nearest) <= CONTROL_COUNT_TOLERANCE ? nearest : Math.floor(exact);
}

function assignmentOf(studentIds: readonly string[], seed: number, controlFraction: number): SyntheticAssignment {
  const ranked = studentIds
    .map((studentId) => ({ studentId, value: firstUniform(seed, ['control', studentId]) }))
    .sort((a, b) => a.value - b.value || compareText(a.studentId, b.studentId))
    .map((item) => item.studentId);
  const control = new Set(ranked.slice(0, controlCountOf(studentIds.length, controlFraction)));

  const treatedStudentIds = studentIds.filter((studentId) => !control.has(studentId));
  const controlStudentIds = studentIds.filter((studentId) => control.has(studentId));
  return {
    treatedStudentIds,
    controlStudentIds,
    treatmentIsEmpty: treatedStudentIds.length === 0,
    controlIsEmpty: controlStudentIds.length === 0,
  };
}

interface Simulation {
  readonly seed: number;
  readonly config: EffectiveSyntheticInterventionConfig;
  // Competencias del plan con sus ancestros.
  readonly plan: readonly (readonly [SkillId, readonly SkillId[]])[];
}

function isMastered(alpha: MasteryVector, skill: SkillId): boolean {
  return alpha[SKILL_ORDER.indexOf(skill)] === 1;
}

// Todas las probabilidades salen del estado anterior al plan: una mejora de este
// mismo plan no prepara a otra competencia.
function changesOf(student: SyntheticStudent, simulation: Simulation): readonly SimulatedMasteryChange[] {
  const { improvementProbability, prerequisiteImprovementFactor } = simulation.config;
  const { studentId, trueMastery } = student;
  return simulation.plan.flatMap(([skill, related]) => {
    if (isMastered(trueMastery, skill)) {
      return [];
    }
    const lacksAncestor = related.some((ancestor) => !isMastered(trueMastery, ancestor));
    const appliedProbability = lacksAncestor ? improvementProbability * prerequisiteImprovementFactor : improvementProbability;
    const uniform = firstUniform(simulation.seed, ['improvement', studentId, skill]);
    return uniform < appliedProbability ? [{ studentId, skill, appliedProbability }] : [];
  });
}

function withChanges(student: SyntheticStudent, changes: readonly SimulatedMasteryChange[]): SyntheticStudent {
  const { studentId, displayName, groupId, trueMastery } = student;
  const improved = new Set(changes.map((change) => change.skill));
  return {
    studentId,
    displayName,
    groupId,
    trueMastery: SKILL_ORDER.map((skill) => (improved.has(skill) || isMastered(trueMastery, skill) ? 1 : 0)),
  };
}

export function applySyntheticIntervention(
  classState: SyntheticClass,
  intervention: InterventionPlan,
  knowledgeGraph: KnowledgeGraph,
  seed: number,
  config: SyntheticInterventionConfig = {},
): SyntheticInterventionResult {
  assertValidClass(classState);
  assertCopyableStudents(classState.students);
  assertInferenceGraph(knowledgeGraph);
  assertValidSeed(seed);
  const effective = effectiveConfig(config);
  const intervenedSkills = plannedSkills(intervention);

  const students = [...classState.students].sort((a, b) => compareText(a.studentId, b.studentId));
  const assignment = assignmentOf(
    students.map((student) => student.studentId),
    seed,
    effective.controlFraction,
  );
  const treated = new Set(assignment.treatedStudentIds);
  const simulation: Simulation = {
    seed,
    config: effective,
    plan: intervenedSkills.map((skill) => [skill, ancestors(knowledgeGraph, skill)]),
  };
  const outcomes = students.map((student) => {
    const changes = treated.has(student.studentId) ? changesOf(student, simulation) : [];
    return { student: withChanges(student, changes), changes };
  });

  return {
    postClass: {
      generator: { ...classState.generator },
      seed: classState.seed,
      studentCount: students.length,
      config: structuredClone(classState.config),
      skillOrder: [...SKILL_ORDER],
      students: outcomes.map((outcome) => outcome.student),
    },
    assignment,
    simulatedChanges: outcomes.flatMap((outcome) => outcome.changes),
    provenance: {
      generator: { ...GENERATOR },
      populationSeed: classState.seed,
      interventionSeed: seed >>> 0,
      config: effective,
      intervenedSkills,
    },
    assumptions: [...ASSUMPTIONS],
    disclaimer: DISCLAIMER,
  };
}

const POSTTEST_OCCASION = 'posttest';

const POST_INTERVENTION_DISCLAIMER =
  'Simulación con parámetros SUPUESTOS: no demuestra eficacia educativa. ' +
  'El cambio observado es descriptivo no equiparado, porque pre y post usan ítems distintos. ' +
  'El cambio estimado no es aprendizaje confirmado, y el cambio real simulado solo es conocible aquí. ' +
  'En alumnos reales, una comparación antes y después no demuestra causalidad; la diferencia en diferencias es una estimación en simulación.';

const POST_INTERVENTION_ASSUMPTIONS: readonly string[] = [
  ...ASSUMPTIONS,
  'Las respuestas siguen DINA por construcción, con parámetros no calibrados.',
  'El postest usa una selección fija, sin EIG, fijada antes de aplicar el plan.',
];

function postConfigError(message: string): SimulationError {
  return new SimulationError('INVALID_POST_INTERVENTION_CONFIG', message);
}

function effectiveSkills(given: readonly SkillId[] | undefined): readonly SkillId[] {
  if (given === undefined) {
    return [...SKILL_ORDER];
  }
  if (!Array.isArray(given) || given.length === 0 || new Set(given).size !== given.length) {
    throw postConfigError('assessmentSkills debe ser una lista no vacía y sin repetir');
  }
  if (!given.every((skill) => SKILL_ORDER.includes(skill))) {
    throw postConfigError('assessmentSkills cita una competencia desconocida');
  }
  return SKILL_ORDER.filter((skill) => given.includes(skill));
}

// correctProbability aplica la restricción DINA; el resultado no se usa.
function effectiveRealParameters(
  given: PostInterventionConfig['realParametersByQuestion'],
  bank: QuestionBank,
): Readonly<Record<QuestionId, RealItemParameters>> {
  if (given === undefined) {
    return {};
  }
  if (typeof given !== 'object' || given === null || Array.isArray(given)) {
    throw new SimulationError('INVALID_REAL_PARAMETERS', 'realParametersByQuestion debe asociar ids y parámetros');
  }
  const unknownId = Object.keys(given).find((id) => !bank.questions.some((question) => question.id === id));
  if (unknownId !== undefined) {
    throw new SimulationError('INVALID_REAL_PARAMETERS', `Pregunta desconocida en los parámetros reales: ${unknownId}`);
  }
  const noMastery = SKILL_ORDER.map(() => 0 as const);
  return Object.fromEntries(
    bank.questions.flatMap((question) => {
      if (!Object.hasOwn(given, question.id)) {
        return [];
      }
      const parameters = given[question.id];
      if (typeof parameters !== 'object' || parameters === null) {
        throw new SimulationError('INVALID_REAL_PARAMETERS', `Parámetros reales inválidos en ${question.id}`);
      }
      const { slip, guess } = parameters;
      correctProbability(noMastery, requiredSkills(question), slip, guess);
      return [[question.id, { slip, guess }]];
    }),
  );
}

function effectivePostConfig(config: PostInterventionConfig, bank: QuestionBank): EffectivePostInterventionConfig {
  if (typeof config !== 'object' || config === null) {
    throw postConfigError('La configuración no tiene la forma esperada');
  }
  const { questionBudgetPerStudent } = config;
  if (!Number.isSafeInteger(questionBudgetPerStudent) || questionBudgetPerStudent <= 0) {
    throw postConfigError('questionBudgetPerStudent debe ser un entero positivo');
  }
  return {
    ...effectiveConfig(config),
    questionBudgetPerStudent,
    assessmentSkills: effectiveSkills(config.assessmentSkills),
    realParametersByQuestion: effectiveRealParameters(config.realParametersByQuestion, bank),
  };
}

function pretestError(message: string): SimulationError {
  return new SimulationError('INCONSISTENT_PRETEST', message);
}

// Correspondencia exacta entre alumnos y estados, con cada historial válido.
function matchedPretests(
  students: readonly SyntheticStudent[],
  pretestStates: readonly DiagnosticState[],
  bank: QuestionBank,
): ReadonlyMap<string, DiagnosticState> {
  if (!Array.isArray(pretestStates)) {
    throw pretestError('pretestStates debe ser una lista');
  }
  const states = new Map<string, DiagnosticState>();
  for (const state of pretestStates as readonly DiagnosticState[]) {
    assertValidDiagnosticState(state, bank);
    if (states.has(state.studentId)) {
      throw pretestError(`Estado repetido: ${state.studentId}`);
    }
    states.set(state.studentId, state);
  }
  if (states.size !== students.length || !students.every((student) => states.has(student.studentId))) {
    throw pretestError('Los estados de pretest no corresponden exactamente a los alumnos de la clase');
  }
  return states;
}

function isSamePrior(a: EffectivePriorConfig, b: EffectivePriorConfig): boolean {
  return (
    SKILL_ORDER.every((skill) => a.marginals[skill] === b.marginals[skill]) &&
    a.compatibility?.epsilon === b.compatibility?.epsilon
  );
}

// Compara configuraciones de prior: el posterior debe poder diferir del prior.
function assertSamePrior(prior: EffectivePriorConfig, states: Iterable<DiagnosticState>): void {
  for (const state of states) {
    if (!isSamePrior(prior, state.priorConfig)) {
      throw new SimulationError('PRIOR_MISMATCH', `${state.studentId}: priorConfig no coincide con su pretest`);
    }
  }
}

// Solo depende del banco, del alcance y del historial: nunca del plan.
function posttestQuestions(
  state: DiagnosticState,
  order: readonly Question[],
  config: EffectivePostInterventionConfig,
): readonly Question[] {
  const answered = new Set(state.responses.map((record) => record.questionId));
  return order
    .filter((question) => config.assessmentSkills.includes(question.primarySkill) && !answered.has(question.id))
    .slice(0, config.questionBudgetPerStudent);
}

interface PosttestContext {
  readonly postClass: SyntheticClass;
  readonly uniforms: ResponseUniformTable;
  readonly bank: QuestionBank;
  readonly graph: KnowledgeGraph;
  readonly prior: PriorConfig;
  readonly config: EffectivePostInterventionConfig;
}

// La verdad se queda en el respondedor: el diagnóstico solo recibe id, prior y
// respuestas observables.
function runPosttest(studentId: string, questions: readonly Question[], context: PosttestContext): DiagnosticState | null {
  if (questions.length === 0) {
    return null;
  }
  const { postClass, uniforms, bank, graph, prior, config } = context;
  return questions.reduce((state, question) => {
    const real = Object.hasOwn(config.realParametersByQuestion, question.id)
      ? config.realParametersByQuestion[question.id]
      : undefined;
    const answer = simulateResponse(postClass, studentId, question, uniforms, real);
    const result = submitAnswer(state, question.id, answer, bank);
    if (!result.ok) {
      throw new SimulationError('POSTTEST_FAILED', `${studentId}, ${question.id}: ${result.error.message}`);
    }
    return result.value;
  }, createInitialDiagnosticState(studentId, prior, graph));
}

export function simulatePostIntervention(input: PostInterventionInput): PostInterventionReport {
  if (typeof input !== 'object' || input === null) {
    throw new SimulationError('INVALID_POST_INTERVENTION_INPUT', 'La entrada no tiene la forma esperada');
  }
  const { classState, intervention, seed, pretestStates, questionBank, knowledgeGraph, priorConfig, config } = input;
  if (typeof priorConfig !== 'object' || priorConfig === null) {
    throw new SimulationError('INVALID_POST_INTERVENTION_INPUT', 'priorConfig es obligatorio');
  }
  assertValidClass(classState);
  assertInferenceGraph(knowledgeGraph);
  assertValidBank(questionBank);
  const effective = effectivePostConfig(config, questionBank);
  const pretests = matchedPretests(classState.students, pretestStates, questionBank);
  const prior = createInitialDiagnosticState('prior', priorConfig, knowledgeGraph).priorConfig;
  assertSamePrior(prior, pretests.values());

  const questionsById = new Map(questionBank.questions.map((question) => [question.id, question]));
  const order = fixedQuestionOrder(questionBank, knowledgeGraph).flatMap((id) => questionsById.get(id) ?? []);
  const selections = new Map(
    [...pretests].map(([studentId, state]) => [studentId, posttestQuestions(state, order, effective)] as const),
  );

  const { improvementProbability, prerequisiteImprovementFactor, controlFraction } = effective;
  const intervened = applySyntheticIntervention(classState, intervention, knowledgeGraph, seed, {
    improvementProbability,
    prerequisiteImprovementFactor,
    controlFraction,
  });
  const { postClass, assignment } = intervened;

  const studentIds = postClass.students.map((student) => student.studentId);
  const selectedIds = [...new Set([...selections.values()].flatMap((questions) => questions.map((question) => question.id)))];
  const uniforms = createResponseUniforms(classState.seed, studentIds, selectedIds, POSTTEST_OCCASION);
  const context: PosttestContext = {
    postClass,
    uniforms,
    bank: questionBank,
    graph: knowledgeGraph,
    prior: priorConfig,
    config: effective,
  };

  const control = new Set(assignment.controlStudentIds);
  const before = new Map(classState.students.map((student) => [student.studentId, student.trueMastery]));
  const outcomes = postClass.students.map(({ studentId, trueMastery }) => {
    const pretest = pretests.get(studentId);
    const masteryBefore = before.get(studentId);
    if (pretest === undefined || masteryBefore === undefined) {
      throw pretestError(`Falta el estado anterior de ${studentId}`);
    }
    const questions = selections.get(studentId) ?? [];
    const posttest = runPosttest(studentId, questions, context);
    const report = studentReport({
      studentId,
      group: control.has(studentId) ? 'control' : 'treatment',
      pretest,
      posttest,
      posttestQuestionIds: questions.map((question) => question.id),
      masteryBefore,
      masteryAfter: trueMastery,
      questionsById,
      config: effective,
    });
    return { posttest, report };
  });
  const students = outcomes.map((outcome) => outcome.report);

  return {
    students,
    ...aggregateReport(students, questionsById, effective),
    postStates: outcomes.flatMap((outcome) => outcome.posttest ?? []),
    postClass,
    assignment,
    simulatedChanges: intervened.simulatedChanges,
    provenance: { ...intervened.provenance, responseSeed: classState.seed, occasion: POSTTEST_OCCASION },
    config: effective,
    priorConfig: prior,
    assumptions: [...POST_INTERVENTION_ASSUMPTIONS],
    disclaimer: POST_INTERVENTION_DISCLAIMER,
  };
}
