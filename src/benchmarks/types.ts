// Tipos de evaluación. Comparan estimaciones con la verdad simulada: no pasan al
// motor ni a tipos compartidos.
import type { SkillId } from '../engine/index.ts';

export type BenchmarkErrorCode = 'INVALID_METRICS_CONFIG' | 'INCONSISTENT_STUDENTS';

export interface DiagnosticMetricsConfig {
  // Umbral de detección de dificultad, en [0, 1]; 0.5 por defecto.
  readonly tau?: number;
}

export type EffectiveDiagnosticMetricsConfig = Required<DiagnosticMetricsConfig>;

// Clase positiva: dificultad, α = 0.
export interface DifficultyConfusion {
  readonly truePositives: number;
  readonly falsePositives: number;
  readonly trueNegatives: number;
  readonly falseNegatives: number;
}

// Agregado desde los pares alumno-competencia, nunca desde otras métricas.
export interface MetricSummary {
  readonly pairCount: number;
  // null sin observaciones.
  readonly mae: number | null;
  readonly brier: number | null;
  // En nats.
  readonly logLoss: number | null;
  readonly confusion: DifficultyConfusion;
  // null si TP + FP = 0.
  readonly precision: number | null;
  // null si TP + FN = 0.
  readonly recall: number | null;
  // null solo si 2TP + FP + FN = 0.
  readonly f1: number | null;
  // null sin observaciones.
  readonly accuracy: number | null;
}

export interface StudentDiagnosticMetrics extends MetricSummary {
  readonly studentId: string;
  readonly questionsUsed: number;
}

export interface SkillDiagnosticMetrics extends MetricSummary {
  readonly skill: SkillId;
}

export interface QuestionUsage {
  readonly total: number;
  // null sin alumnos.
  readonly mean: number | null;
}

export interface MetricDefinitions {
  readonly mae: string;
  readonly brier: string;
  readonly logLoss: string;
  readonly difficulty: string;
  readonly aggregation: string;
}

export interface DiagnosticMetrics {
  readonly config: EffectiveDiagnosticMetricsConfig;
  readonly studentCount: number;
  readonly pairCount: number;
  readonly overall: MetricSummary;
  // Por id.
  readonly students: readonly StudentDiagnosticMetrics[];
  // En el orden de SKILL_ORDER.
  readonly skills: readonly SkillDiagnosticMetrics[];
  readonly questionsUsed: QuestionUsage;
  readonly definitions: MetricDefinitions;
  readonly disclaimer: string;
}
