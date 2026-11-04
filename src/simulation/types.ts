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
  | 'INVALID_REAL_PARAMETERS';

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
