// Tipos del simulador. La verdad simulada vive solo aquí: no pasa a src/engine
// ni a tipos compartidos (§2.7).
import type { MasteryVector, SkillId } from '../engine/index.ts';

export type SimulationErrorCode =
  | 'INVALID_SEED'
  | 'INVALID_STREAM_LABEL'
  | 'INVALID_STUDENT_COUNT'
  | 'INVALID_SIMULATION_CONFIG'
  | 'INVALID_SYNTHETIC_CLASS'
  | 'INVALID_OCCASION'
  | 'INVALID_ID_LIST'
  | 'INVALID_UNIFORM_TABLE'
  | 'INCOMPATIBLE_SEED'
  | 'UNKNOWN_STUDENT'
  | 'MISSING_UNIFORM'
  | 'INVALID_QUESTION'
  | 'INVALID_REAL_PARAMETERS'
  | 'INVALID_INTERVENTION_PLAN'
  | 'INVALID_INTERVENTION_CONFIG';

// Devuelve el siguiente uniforme en [0, 1) y avanza su propio estado.
export type UniformStream = () => number;

export interface GeneratorInfo {
  readonly algorithm: 'mulberry32';
  // Cambia si cambia cualquier resultado para una misma configuración y semilla.
  readonly version: number;
}

// Perfil de demo: no es un grupo educativo validado ni una estimación observada.
export interface SyntheticGroupConfig {
  readonly id: string;
  // Probabilidad base de dominio de las seis competencias.
  readonly masteryProbabilities: Readonly<Record<SkillId, number>>;
}

export interface SimulationConfig {
  // Al menos uno. El alumno de índice i va al grupo i mod nº de grupos.
  readonly groups?: readonly SyntheticGroupConfig[];
  // Factor en [0, 1] si falta al menos un ancestro.
  readonly prerequisiteFactor?: number;
}

export interface EffectiveSimulationConfig {
  readonly groups: readonly SyntheticGroupConfig[];
  readonly prerequisiteFactor: number;
}

export interface SyntheticStudent {
  readonly studentId: string;
  readonly displayName: string;
  // Verdad privada: grupo generador.
  readonly groupId: string;
  // Verdad privada: α en el orden de `skillOrder`.
  readonly trueMastery: MasteryVector;
}

export interface SyntheticClass {
  readonly generator: GeneratorInfo;
  readonly seed: number;
  readonly studentCount: number;
  readonly config: EffectiveSimulationConfig;
  // Orden explícito de codificación de `trueMastery`, igual a SKILL_ORDER.
  readonly skillOrder: readonly SkillId[];
  readonly students: readonly SyntheticStudent[];
}

// Lo único que puede salir hacia diagnóstico, selección o interfaz.
export interface ObservableStudent {
  readonly studentId: string;
  readonly displayName: string;
}

export interface ResponseUniformEntry {
  readonly studentId: string;
  readonly questionId: string;
  // Acierto si es menor que P(Y_q = 1 | α actual).
  readonly correctness: number;
  // Elige el distractor en opción múltiple.
  readonly distractor: number;
}

// Tabla privada: no pasa al diagnóstico. Guarda uniformes, no resultados.
export interface ResponseUniformTable {
  readonly generator: GeneratorInfo;
  readonly seed: number;
  readonly occasion: string;
  // Ordenados y sin repetir.
  readonly studentIds: readonly string[];
  readonly questionIds: readonly string[];
  // Producto de ambas listas: por alumno y, dentro de cada uno, por pregunta.
  readonly entries: readonly ResponseUniformEntry[];
}

// Slip y guess reales, que pueden diferir de los que asume el motor.
export interface RealItemParameters {
  readonly slip: number;
  readonly guess: number;
}

export interface SyntheticInterventionConfig {
  // p_mejora en [0, 1]: SUPUESTO; 0.35 por defecto.
  readonly improvementProbability?: number;
  // Factor en [0, 1] si falta al menos un ancestro: SUPUESTO; 0.5 por defecto.
  readonly prerequisiteImprovementFactor?: number;
  // Fracción de alumnos en control, en [0, 1]; 0 por defecto.
  readonly controlFraction?: number;
}

export type EffectiveSyntheticInterventionConfig = Required<SyntheticInterventionConfig>;

export interface SyntheticAssignment {
  // Ordenados por id.
  readonly treatedStudentIds: readonly string[];
  readonly controlStudentIds: readonly string[];
  readonly treatmentIsEmpty: boolean;
  readonly controlIsEmpty: boolean;
}

// Cambio de α en la simulación: no es una observación ni aprendizaje observado.
export interface SimulatedMasteryChange {
  readonly studentId: string;
  readonly skill: SkillId;
  // Probabilidad usada, tras aplicar el factor si faltaba algún ancestro.
  readonly appliedProbability: number;
}

// Con el estado anterior, basta para reproducir postClass.
export interface SyntheticInterventionProvenance {
  readonly generator: GeneratorInfo;
  readonly populationSeed: number;
  readonly interventionSeed: number;
  readonly config: EffectiveSyntheticInterventionConfig;
  // Competencias del plan, en el orden de SKILL_ORDER.
  readonly intervenedSkills: readonly SkillId[];
}

export interface SyntheticInterventionResult {
  // Alumnos por id. Contiene verdad simulada.
  readonly postClass: SyntheticClass;
  readonly assignment: SyntheticAssignment;
  // Por alumno y, dentro de cada uno, en el orden de SKILL_ORDER.
  readonly simulatedChanges: readonly SimulatedMasteryChange[];
  readonly provenance: SyntheticInterventionProvenance;
  readonly assumptions: readonly string[];
  readonly disclaimer: string;
}
