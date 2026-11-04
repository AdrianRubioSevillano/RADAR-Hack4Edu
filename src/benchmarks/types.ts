// Tipos de evaluación. Comparan estimaciones con la verdad simulada: no pasan al
// motor ni a tipos compartidos.
import type { SkillId } from '../engine/index.ts';
import type { GeneratorInfo } from '../simulation/index.ts';

export type BenchmarkErrorCode =
  | 'INVALID_METRICS_CONFIG'
  | 'INCONSISTENT_STUDENTS'
  | 'INVALID_OBSERVATIONS'
  | 'INVALID_STATS_CONFIG'
  | 'NON_FINITE_STATISTIC';

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

// Valor de una métrica en una réplica. null: no definido en esa semilla.
export interface SeedObservation {
  // Entero uint32.
  readonly seed: number;
  readonly value: number | null;
}

export interface SeedSeriesConfig {
  // Identifica el flujo de remuestreo: añadir otras series no cambia esta.
  readonly seriesId: string;
  // Entero uint32.
  readonly bootstrapSeed: number;
  // Entero positivo; 2000 por defecto: SUPUESTO.
  readonly resamples?: number;
}

export interface ConfidenceInterval {
  readonly lower: number;
  readonly upper: number;
}

export interface BootstrapProvenance {
  readonly method: 'percentile';
  readonly statistic: 'mean';
  readonly unit: 'seed';
  readonly generator: GeneratorInfo;
  readonly bootstrapSeed: number;
  readonly seriesId: string;
  readonly streamLabel: string;
  readonly resamples: number;
  // Observaciones de cada remuestra.
  readonly resampleSize: number;
  readonly confidenceLevel: number;
  readonly lowerQuantile: number;
  readonly upperQuantile: number;
}

export type SeedStatisticsWarningCode = 'NO_VALID_VALUES' | 'SINGLE_VALID_VALUE';

export interface SeedStatisticsWarning {
  readonly code: SeedStatisticsWarningCode;
  readonly message: string;
}

export interface SeedSeriesSummary {
  readonly totalCount: number;
  readonly validCount: number;
  // Con valor null, ordenadas.
  readonly excludedSeeds: readonly number[];
  // null sin valores válidos.
  readonly mean: number | null;
  // Divisor n - 1. null con menos de dos valores válidos.
  readonly standardDeviation: number | null;
  // Percentil de medias bootstrap. Degenerado con un solo valor; null sin valores.
  readonly confidenceInterval: ConfidenceInterval | null;
  readonly bootstrap: BootstrapProvenance;
  readonly warnings: readonly SeedStatisticsWarning[];
}

export type ImprovementDirection = 'lowerIsBetter' | 'higherIsBetter';

export interface PairedComparisonConfig extends SeedSeriesConfig {
  readonly direction: ImprovementDirection;
  // Distancia a 0 de B - A que cuenta como empate; 1e-12 por defecto. Solo clasifica.
  readonly tieTolerance?: number;
}

export type PairExclusionReason = 'missingInA' | 'missingInB' | 'nullInA' | 'nullInB' | 'nullInBoth';

export interface ExcludedPair {
  readonly seed: number;
  readonly reason: PairExclusionReason;
}

export interface PairedDifference {
  readonly seed: number;
  readonly a: number;
  readonly b: number;
  // b - a.
  readonly difference: number;
}

export interface PairedComparison {
  readonly direction: ImprovementDirection;
  readonly tieTolerance: number;
  readonly pairCount: number;
  // Ordenadas por semilla.
  readonly pairs: readonly PairedDifference[];
  readonly excludedPairs: readonly ExcludedPair[];
  // Resumen de las diferencias B - A.
  readonly differences: SeedSeriesSummary;
  readonly improvedCount: number;
  readonly tiedCount: number;
  readonly worsenedCount: number;
  readonly disclaimer: string;
}
