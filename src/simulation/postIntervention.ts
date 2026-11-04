import { assertInferenceGraph } from '../engine/bayes.ts';
import { SKILL_ORDER, ancestors } from '../engine/index.ts';
import type { InterventionPlan, KnowledgeGraph, MasteryVector, SkillId } from '../engine/index.ts';
import { GENERATOR, STREAMS, SimulationError, assertValidSeed, createStream } from './rng.ts';
import { assertValidClass, isBlank, isInUnit } from './syntheticClass.ts';
import type {
  EffectiveSyntheticInterventionConfig,
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

function assignmentOf(studentIds: readonly string[], seed: number, controlFraction: number): SyntheticAssignment {
  const ranked = studentIds
    .map((studentId) => ({ studentId, value: firstUniform(seed, ['control', studentId]) }))
    .sort((a, b) => a.value - b.value || compareText(a.studentId, b.studentId))
    .map((item) => item.studentId);
  const controlCount = Math.floor(studentIds.length * controlFraction);
  const control = new Set(ranked.slice(0, controlCount));

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
