// Tipos de evaluación. Comparan estimaciones con la verdad simulada: no pasan al
// motor ni a tipos compartidos.
import type {
  AnswerValue,
  DiagnosticState,
  EffectivePriorConfig,
  KnowledgeGraph,
  PriorConfig,
  QuestionBank,
  QuestionId,
  SkillId,
} from '../engine/index.ts';
import type { GeneratorInfo, RealItemParameters, ResponseUniformTable, SyntheticClass } from '../simulation/index.ts';

export type BenchmarkErrorCode =
  | 'INVALID_METRICS_CONFIG'
  | 'INCONSISTENT_STUDENTS'
  | 'INVALID_OBSERVATIONS'
  | 'INVALID_STATS_CONFIG'
  | 'NON_FINITE_STATISTIC'
  | 'INVALID_METHOD_INPUT'
  | 'INVALID_RESPONSE_TABLE'
  | 'INVALID_REAL_PARAMETERS'
  | 'ANSWER_REJECTED'
  | 'SELECTION_FAILED';

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

// A: orden fijo. B: adaptativo EIG. C: aleatorio con semilla, por alumno.
export type DiagnosticMethod = 'A' | 'B' | 'C';

// Entero positivo o todas las preguntas, sin parada anticipada.
export type QuestionBudget = number | 'all';

export interface DiagnosticMethodInput {
  readonly method: DiagnosticMethod;
  readonly syntheticClass: SyntheticClass;
  readonly questionBank: QuestionBank;
  readonly knowledgeGraph: KnowledgeGraph;
  readonly priorConfig: PriorConfig;
  // Compartida entre métodos: ocasión pretest, con todos los alumnos y preguntas.
  readonly uniforms: ResponseUniformTable;
  readonly budgets: readonly QuestionBudget[];
  // Entero uint32. Obligatoria aunque solo la use el método C.
  readonly randomOrderSeed: number;
  readonly measureTiming?: boolean;
  // Solo los recibe el respondedor: el motor conserva los del banco.
  readonly realParametersByQuestion?: Readonly<Record<QuestionId, RealItemParameters>>;
  readonly metricsConfig?: DiagnosticMetricsConfig;
}

export interface DiagnosticMethodConfig {
  // Orden canónico: números ascendentes y después 'all'.
  readonly budgets: readonly QuestionBudget[];
  readonly randomOrderSeed: number;
  readonly populationSeed: number;
  readonly occasion: string;
  readonly generator: GeneratorInfo;
  readonly bankSize: number;
  readonly priorConfig: EffectivePriorConfig;
  readonly metricsConfig: EffectiveDiagnosticMetricsConfig;
  // Con las claves en el orden del banco.
  readonly realParametersByQuestion: Readonly<Record<QuestionId, RealItemParameters>>;
}

export interface MethodStep {
  readonly questionId: QuestionId;
  readonly answer: AnswerValue;
  readonly isCorrect: boolean;
}

export interface MethodStudentTrajectory {
  readonly studentId: string;
  // Hasta el máximo presupuesto efectivo.
  readonly steps: readonly MethodStep[];
}

export interface MethodBudgetResult {
  readonly requestedBudget: QuestionBudget;
  // Preguntas usadas por alumno: como mucho, las del banco.
  readonly effectiveBudget: number;
  // Por id. Prefijo de la trayectoria de cada alumno.
  readonly states: readonly DiagnosticState[];
  readonly metrics: DiagnosticMetrics;
}

// Bloque determinista: sin fechas ni tiempos.
export interface DiagnosticMethodResults {
  readonly method: DiagnosticMethod;
  readonly config: DiagnosticMethodConfig;
  // Por id.
  readonly students: readonly MethodStudentTrajectory[];
  // En el orden canónico de los presupuestos.
  readonly budgets: readonly MethodBudgetResult[];
}

// Variable entre ejecuciones: nunca entra en comparaciones de igualdad.
export interface DiagnosticMethodTiming {
  // Orden fijo (A) o permutaciones (C). 0 en B, que no prepara un orden.
  readonly preparationMs: number;
  // Obtener cada pregunta: la selección EIG en B; leer el orden en A y C.
  readonly selectionMs: number;
  readonly selectionCount: number;
  // null sin selecciones.
  readonly meanSelectionMs: number | null;
  readonly definition: string;
  readonly disclaimer: string;
}

export interface DiagnosticMethodRun {
  readonly results: DiagnosticMethodResults;
  // null si no se pidió medir.
  readonly timing: DiagnosticMethodTiming | null;
}
