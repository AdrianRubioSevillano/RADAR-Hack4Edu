// Tipos del simulador. La verdad simulada vive solo aquí: no pasa a src/engine
// ni a tipos compartidos (§2.7).
import type { MasteryVector, SkillId } from '../engine/index.ts';

export type SimulationErrorCode =
  | 'INVALID_SEED'
  | 'INVALID_STREAM_LABEL'
  | 'INVALID_STUDENT_COUNT'
  | 'INVALID_SIMULATION_CONFIG'
  | 'INVALID_SYNTHETIC_CLASS';

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
