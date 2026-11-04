import { assertInferenceGraph } from '../engine/bayes.ts';
import { SKILL_ORDER, ancestors, topologicalOrder } from '../engine/index.ts';
import type { KnowledgeGraph, MasteryVector, SkillId } from '../engine/index.ts';
import { GENERATOR, STREAMS, SimulationError, assertValidSeed, createStream } from './rng.ts';
import type {
  EffectiveSimulationConfig,
  ObservableStudent,
  SimulationConfig,
  SyntheticClass,
  SyntheticGroupConfig,
  SyntheticStudent,
} from './types.ts';

// Valores por defecto: SUPUESTOS de demo, no calibrados ni observados (§2.7).
const DEFAULT_GROUP_PROBABILITIES: readonly (readonly [string, number])[] = [
  ['G1', 0.85],
  ['G2', 0.6],
  ['G3', 0.35],
];
const DEFAULT_PREREQUISITE_FACTOR = 0.5;

function configError(message: string): SimulationError {
  return new SimulationError('INVALID_SIMULATION_CONFIG', message);
}

function isInUnit(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function defaultGroups(): readonly SyntheticGroupConfig[] {
  return DEFAULT_GROUP_PROBABILITIES.map(([id, probability]) => ({
    id,
    masteryProbabilities: Object.fromEntries(SKILL_ORDER.map((skill) => [skill, probability])),
  }));
}

function effectiveProbabilities(group: SyntheticGroupConfig): Readonly<Record<SkillId, number>> {
  const given: unknown = group.masteryProbabilities;
  if (typeof given !== 'object' || given === null) {
    throw configError(`El grupo ${group.id} no tiene probabilidades`);
  }
  const unknownSkill = Object.keys(given).find((skill) => !SKILL_ORDER.includes(skill));
  if (unknownSkill !== undefined) {
    throw configError(`El grupo ${group.id} cita una competencia desconocida: ${unknownSkill}`);
  }
  return Object.fromEntries(
    SKILL_ORDER.map((skill) => {
      const probability = Object.hasOwn(given, skill) ? group.masteryProbabilities[skill] : undefined;
      if (!isInUnit(probability)) {
        throw configError(`El grupo ${group.id} necesita una probabilidad finita en [0, 1] para ${skill}`);
      }
      return [skill, probability];
    }),
  );
}

function effectiveGroups(groups: readonly SyntheticGroupConfig[]): readonly SyntheticGroupConfig[] {
  if (!Array.isArray(groups) || groups.length === 0) {
    throw configError('Debe haber al menos un grupo');
  }
  const ids = new Set<string>();
  return groups.map((group: SyntheticGroupConfig) => {
    if (typeof group !== 'object' || group === null || typeof group.id !== 'string' || group.id.trim() === '') {
      throw configError('Cada grupo necesita un id');
    }
    if (ids.has(group.id)) {
      throw configError(`Grupo repetido: ${group.id}`);
    }
    ids.add(group.id);
    return { id: group.id, masteryProbabilities: effectiveProbabilities(group) };
  });
}

function effectiveConfig(config: SimulationConfig): EffectiveSimulationConfig {
  if (typeof config !== 'object' || config === null) {
    throw configError('La configuración no tiene la forma esperada');
  }
  const { groups, prerequisiteFactor = DEFAULT_PREREQUISITE_FACTOR } = config;
  if (!isInUnit(prerequisiteFactor)) {
    throw configError('El factor por prerrequisitos debe ser finito en [0, 1]');
  }
  return { groups: groups === undefined ? defaultGroups() : effectiveGroups(groups), prerequisiteFactor };
}

function paddedNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}

interface Generation {
  readonly seed: number;
  readonly config: EffectiveSimulationConfig;
  // Orden topológico determinista, con los ancestros de cada competencia.
  readonly order: readonly (readonly [SkillId, readonly SkillId[]])[];
}

// Se consume un uniforme por competencia aunque su probabilidad sea 0 o 1: cambiar
// una probabilidad no desplaza los uniformes de las demás.
function trueMasteryOf(studentId: string, group: SyntheticGroupConfig, generation: Generation): MasteryVector {
  const stream = createStream(generation.seed, `${STREAMS.population}/${studentId}`);
  const mastered = new Set<SkillId>();
  for (const [skill, related] of generation.order) {
    const uniform = stream();
    const base = group.masteryProbabilities[skill] ?? Number.NaN;
    const lacksAncestor = related.some((ancestor) => !mastered.has(ancestor));
    if (uniform < (lacksAncestor ? base * generation.config.prerequisiteFactor : base)) {
      mastered.add(skill);
    }
  }
  return SKILL_ORDER.map((skill) => (mastered.has(skill) ? 1 : 0));
}

function studentAt(index: number, generation: Generation): SyntheticStudent {
  const { groups } = generation.config;
  const group = groups[index % groups.length];
  if (group === undefined) {
    throw configError('Debe haber al menos un grupo');
  }
  const studentId = `S${paddedNumber(index)}`;
  return {
    studentId,
    displayName: `Alumno ficticio ${paddedNumber(index)}`,
    groupId: group.id,
    trueMastery: trueMasteryOf(studentId, group, generation),
  };
}

export function createSyntheticClass(
  seed: number,
  studentCount: number,
  knowledgeGraph: KnowledgeGraph,
  config: SimulationConfig = {},
): SyntheticClass {
  assertValidSeed(seed);
  if (!Number.isSafeInteger(studentCount) || studentCount < 0) {
    throw new SimulationError('INVALID_STUDENT_COUNT', `Número de alumnos inválido: ${String(studentCount)}`);
  }
  assertInferenceGraph(knowledgeGraph);
  const effective = effectiveConfig(config);

  const generation: Generation = {
    seed,
    config: effective,
    order: topologicalOrder(knowledgeGraph).map((skill) => [skill, ancestors(knowledgeGraph, skill)]),
  };
  const students = Array.from({ length: studentCount }, (_, index) => studentAt(index, generation));

  return {
    generator: { ...GENERATOR },
    seed: seed >>> 0,
    studentCount: students.length,
    config: effective,
    skillOrder: [...SKILL_ORDER],
    students,
  };
}

// Copia campo a campo: un dato latente nuevo no puede salir por omisión.
export function observableStudents(syntheticClass: SyntheticClass): readonly ObservableStudent[] {
  if (typeof syntheticClass !== 'object' || syntheticClass === null || !Array.isArray(syntheticClass.students)) {
    throw new SimulationError('INVALID_SYNTHETIC_CLASS', 'La clase sintética no tiene la forma esperada');
  }
  return syntheticClass.students.map((student: SyntheticStudent) => {
    if (typeof student !== 'object' || student === null) {
      throw new SimulationError('INVALID_SYNTHETIC_CLASS', 'La clase sintética contiene un alumno inválido');
    }
    return { studentId: student.studentId, displayName: student.displayName };
  });
}
