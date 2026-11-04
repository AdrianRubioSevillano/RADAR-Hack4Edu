// Vista de los informes ya generados. No ejecuta el benchmark y no modifica ninguna
// cifra: solo las reordena. `import type` evita cargar el código del experimento.
import type {
  BenchmarkMetric,
  BenchmarkResults,
  BenchmarkScenarioId,
  PairedComparison,
  QuestionBudget,
} from "../benchmarks/index.ts";

export const SCENARIO_LABELS: Readonly<Record<BenchmarkScenarioId, string>> = {
  wellSpecified: "Bien especificado",
  misspecified: "Mala especificación",
  homogeneous: "Población homogénea",
};

export const METRICS: readonly {
  readonly id: BenchmarkMetric;
  readonly label: string;
}[] = [
  { id: "mae", label: "MAE" },
  { id: "brier", label: "Brier" },
  { id: "logLoss", label: "Log-loss" },
  { id: "precision", label: "Precisión" },
  { id: "recall", label: "Recall" },
  { id: "f1", label: "F1" },
  { id: "accuracy", label: "Exactitud" },
];

export type IntervalPosition =
  | "favorsB"
  | "favorsA"
  | "includesZero"
  | "unavailable";

export const POSITION_LABELS: Readonly<Record<IntervalPosition, string>> = {
  favorsB: "IC favorece a B",
  favorsA: "IC favorece a A",
  includesZero: "IC incluye 0",
  unavailable: "Sin intervalo",
};

// Misma regla descriptiva que report.ts; un test la contrasta con el informe .md.
export function intervalPosition(comparison: PairedComparison): IntervalPosition {
  const interval = comparison.differences.confidenceInterval;
  if (interval === null || comparison.pairCount < 2) return "unavailable";
  if (interval.lower <= 0 && interval.upper >= 0) return "includesZero";
  const isLower = interval.upper < 0;
  return isLower === (comparison.direction === "lowerIsBetter")
    ? "favorsB"
    : "favorsA";
}

export function budgetLabel(budget: QuestionBudget): string {
  return budget === "all" ? "todas" : String(budget);
}

export interface ComparisonRow {
  readonly metric: BenchmarkMetric;
  readonly label: string;
  readonly direction: PairedComparison["direction"];
  readonly mean: number | null;
  readonly lower: number | null;
  readonly upper: number | null;
  readonly position: IntervalPosition;
  readonly improved: number;
  readonly tied: number;
  readonly worsened: number;
  readonly pairs: number;
  readonly excluded: number;
}

export interface MethodRow {
  readonly method: string;
  readonly effectiveBudget: number;
  readonly metrics: readonly {
    readonly metric: BenchmarkMetric;
    readonly mean: number | null;
    readonly lower: number | null;
    readonly upper: number | null;
    readonly validCount: number;
  }[];
}

export interface BudgetView {
  readonly budget: QuestionBudget;
  readonly label: string;
  readonly methods: readonly MethodRow[];
  readonly comparisons: readonly ComparisonRow[];
  readonly tally: Readonly<Record<IntervalPosition, number>> & {
    readonly improved: number;
    readonly tied: number;
    readonly worsened: number;
  };
}

export interface ScenarioView {
  readonly id: BenchmarkScenarioId;
  readonly label: string;
  readonly description: string;
  readonly replicasChecked: number;
  readonly maxPosteriorDifference: number;
  readonly budgets: readonly BudgetView[];
  // Presupuestos donde MAE favorece a B y alguna métrica de clasificación no.
  readonly divergences: readonly {
    readonly budget: string;
    readonly metrics: readonly string[];
  }[];
  // Comparaciones cuyo intervalo favorece a A: se listan, no se esconden.
  readonly losses: readonly { readonly budget: string; readonly metric: string }[];
}

const CLASSIFICATION: readonly BenchmarkMetric[] = [
  "precision",
  "recall",
  "f1",
  "accuracy",
];

export function buildBenchmarkView(results: BenchmarkResults) {
  const scenarios = results.scenarios.map((scenario): ScenarioView => {
    const budgets = results.config.budgets.map((budget): BudgetView => {
      const comparisons = METRICS.flatMap(({ id, label }): ComparisonRow[] => {
        const found = scenario.comparisons.find(
          (c) => c.requestedBudget === budget && c.metric === id,
        );
        if (found === undefined) return [];
        const { comparison } = found;
        const interval = comparison.differences.confidenceInterval;
        return [
          {
            metric: id,
            label,
            direction: comparison.direction,
            mean: comparison.differences.mean,
            lower: interval?.lower ?? null,
            upper: interval?.upper ?? null,
            position: intervalPosition(comparison),
            improved: comparison.improvedCount,
            tied: comparison.tiedCount,
            worsened: comparison.worsenedCount,
            pairs: comparison.pairCount,
            excluded: comparison.excludedPairs.length,
          },
        ];
      });
      const count = (position: IntervalPosition) =>
        comparisons.filter((row) => row.position === position).length;
      const sum = (pick: (row: ComparisonRow) => number) =>
        comparisons.reduce((total, row) => total + pick(row), 0);
      return {
        budget,
        label: budgetLabel(budget),
        methods: scenario.summaries
          .filter((summary) => summary.requestedBudget === budget)
          .map((summary) => ({
            method: summary.method,
            effectiveBudget: summary.effectiveBudget,
            metrics: METRICS.map(({ id }) => {
              const metric = summary.metrics[id];
              return {
                metric: id,
                mean: metric.mean,
                lower: metric.confidenceInterval?.lower ?? null,
                upper: metric.confidenceInterval?.upper ?? null,
                validCount: metric.validCount,
              };
            }),
          })),
        comparisons,
        tally: {
          favorsB: count("favorsB"),
          favorsA: count("favorsA"),
          includesZero: count("includesZero"),
          unavailable: count("unavailable"),
          improved: sum((row) => row.improved),
          tied: sum((row) => row.tied),
          worsened: sum((row) => row.worsened),
        },
      };
    });
    return {
      id: scenario.definition.id,
      label: SCENARIO_LABELS[scenario.definition.id],
      description: scenario.definition.description,
      replicasChecked: scenario.allBudgetCheck.replicasChecked,
      maxPosteriorDifference: scenario.allBudgetCheck.maxPosteriorDifference,
      budgets,
      divergences: budgets.flatMap((budget) => {
        const mae = budget.comparisons.find((row) => row.metric === "mae");
        if (mae?.position !== "favorsB") return [];
        const metrics = budget.comparisons
          .filter(
            (row) =>
              CLASSIFICATION.includes(row.metric) && row.position !== "favorsB",
          )
          .map((row) => `${row.label} (${POSITION_LABELS[row.position]})`);
        return metrics.length === 0 ? [] : [{ budget: budget.label, metrics }];
      }),
      losses: budgets.flatMap((budget) =>
        budget.comparisons
          .filter((row) => row.position === "favorsA")
          .map((row) => ({ budget: budget.label, metric: row.label })),
      ),
    };
  });
  return {
    provenance: {
      isFullExperiment: results.kind === "full",
      kind: results.kind,
      benchmarkVersion: results.benchmarkVersion,
      generator: results.config.generator,
      baseSeed: results.config.baseSeed,
      bootstrapSeed: results.bootstrapSeed,
      replicas: results.replicaSeeds.length,
      studentsPerReplica: results.config.studentCount,
      resamples: results.config.resamples,
      methods: results.config.methods,
      disclaimer: results.disclaimer,
    },
    scenarios,
  };
}

export type BenchmarkView = ReturnType<typeof buildBenchmarkView>;
