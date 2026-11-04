import { KNOWLEDGE_GRAPH, RADAR_QUESTION_BANK, SKILL_ORDER } from '../engine/index.ts';
import { GENERATOR, STREAMS, createResponseUniforms, createSyntheticClass, deriveStreamSeed } from '../simulation/index.ts';
import type { RealItemParameters, SyntheticClass } from '../simulation/index.ts';
import { BenchmarkError } from './metrics.ts';
import { canonicalBudgets, runDiagnosticMethod } from './methods.ts';
import { comparePairedSeeds, isUint32, summarizeSeedValues } from './stats.ts';
import type {
  AllBudgetCheck,
  BenchmarkConfig,
  BenchmarkMetric,
  BenchmarkReplica,
  BenchmarkReport,
  BenchmarkResults,
  BenchmarkScenarioDefinition,
  BenchmarkScenarioId,
  BenchmarkScenarioResult,
  BenchmarkTiming,
  DiagnosticMethod,
  DiagnosticMethodRun,
  DiagnosticMethodTiming,
  EffectiveBenchmarkConfig,
  ImprovementDirection,
  MethodBudgetResult,
  MethodBudgetSummary,
  MetricComparison,
  MetricSummary,
  QuestionBudget,
  ReplicaMethodResult,
  ScenarioMethodTiming,
  SeedObservation,
} from './types.ts';

// Fijada antes de ver resultados: no se cambia según quién gane.
export const DEFAULT_BENCHMARK_BASE_SEED = 2026;

const BENCHMARK_VERSION = 1;
const DEFAULT_STUDENT_COUNT = 30;
const DEFAULT_SEED_COUNT = 30;
const DEFAULT_BUDGETS: readonly QuestionBudget[] = [4, 6, 9, 12, 'all'];
const DEFAULT_METHODS: readonly DiagnosticMethod[] = ['A', 'B', 'C'];
const DEFAULT_RESAMPLES = 2000;
const DEFAULT_SCENARIOS: readonly BenchmarkScenarioId[] = ['wellSpecified', 'misspecified', 'homogeneous'];

const PRETEST_OCCASION = 'pretest';
const ALL_BUDGET_TOLERANCE = 1e-9;

// SUPUESTOS de los escenarios, no valores calibrados (§2.9).
const MISSPECIFIED_PARAMETERS: RealItemParameters = { slip: 0.25, guess: 0.2 };
const HOMOGENEOUS_PROBABILITY = 0.6;
const HOMOGENEOUS_FACTOR = 0.5;

const METRICS: readonly (readonly [BenchmarkMetric, ImprovementDirection])[] = [
  ['mae', 'lowerIsBetter'],
  ['brier', 'lowerIsBetter'],
  ['logLoss', 'lowerIsBetter'],
  ['precision', 'higherIsBetter'],
  ['recall', 'higherIsBetter'],
  ['f1', 'higherIsBetter'],
  ['accuracy', 'higherIsBetter'],
];

const DISCLAIMER =
  'Mide la recuperación de estados sintéticos bajo SUPUESTOS no calibrados: ' +
  'no demuestra mejoras educativas ni eficacia con alumnos reales.';

const TIMING_DEFINITION =
  'Suma, sobre las réplicas, de la preparación del orden y de la obtención de cada pregunta, según runDiagnosticMethod. ' +
  'No incluye simular, registrar ni agregar.';

const TIMING_DISCLAIMER =
  'Tiempos de una ejecución en esta máquina, variables entre ejecuciones: no son una comparación definitiva de rendimiento.';

function definitionOf(id: BenchmarkScenarioId): BenchmarkScenarioDefinition {
  if (id === 'misspecified') {
    return {
      id,
      description: 'Misma población y semillas que el escenario bien especificado; slip y guess reales distintos de los asumidos.',
      population: null,
      realParameters: MISSPECIFIED_PARAMETERS,
    };
  }
  if (id === 'homogeneous') {
    return {
      id,
      description: 'Un único grupo generador: misma distribución, no el mismo conocimiento en todos los alumnos.',
      population: {
        groups: [
          {
            id: 'homogeneous',
            masteryProbabilities: Object.fromEntries(SKILL_ORDER.map((skill) => [skill, HOMOGENEOUS_PROBABILITY])),
          },
        ],
        prerequisiteFactor: HOMOGENEOUS_FACTOR,
      },
      realParameters: null,
    };
  }
  return {
    id,
    description: 'Población por defecto; parámetros reales iguales a los del banco.',
    population: null,
    realParameters: null,
  };
}

function configError(message: string): BenchmarkError {
  return new BenchmarkError('INVALID_BENCHMARK_CONFIG', message);
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw configError(`${label} debe ser un entero positivo`);
  }
  return value;
}

// Lista sin repetir de valores conocidos, en el orden canónico de `known`.
function canonicalSubset<T>(given: readonly T[], known: readonly T[], label: string): readonly T[] {
  if (!Array.isArray(given) || given.length === 0 || new Set(given).size !== given.length) {
    throw configError(`${label} debe ser una lista no vacía y sin repetir`);
  }
  if (!given.every((item) => known.includes(item))) {
    throw configError(`${label} contiene un valor desconocido`);
  }
  return known.filter((item) => given.includes(item));
}

type ValidatedConfig = Omit<EffectiveBenchmarkConfig, 'priorConfig'> & Pick<Required<BenchmarkConfig>, 'measureTiming'>;

function validatedConfig(config: BenchmarkConfig): ValidatedConfig {
  if (typeof config !== 'object' || config === null) {
    throw configError('La configuración no tiene la forma esperada');
  }
  const { baseSeed = DEFAULT_BENCHMARK_BASE_SEED, budgets = DEFAULT_BUDGETS, measureTiming = false } = config;
  if (!isUint32(baseSeed)) {
    throw configError('baseSeed debe ser un entero uint32');
  }
  if (typeof measureTiming !== 'boolean') {
    throw configError('measureTiming debe ser un booleano');
  }
  const canonical = canonicalBudgets(budgets);
  if (!canonical.includes('all')) {
    throw configError('budgets debe incluir "all": la comprobación de todas las preguntas lo necesita');
  }
  const methods = canonicalSubset(config.methods ?? DEFAULT_METHODS, DEFAULT_METHODS, 'methods');
  if (!methods.includes('A') || !methods.includes('B')) {
    throw configError('methods debe incluir A y B: la comparación es B - A');
  }
  const { questions } = RADAR_QUESTION_BANK;
  return {
    baseSeed: baseSeed >>> 0,
    studentCount: positiveInteger(config.studentCount ?? DEFAULT_STUDENT_COUNT, 'studentCount'),
    seedCount: positiveInteger(config.seedCount ?? DEFAULT_SEED_COUNT, 'seedCount'),
    budgets: canonical,
    methods,
    resamples: positiveInteger(config.resamples ?? DEFAULT_RESAMPLES, 'resamples'),
    scenarios: canonicalSubset(config.scenarios ?? DEFAULT_SCENARIOS, DEFAULT_SCENARIOS, 'scenarios'),
    bankSize: questions.length,
    questionIds: questions.map((question) => question.id),
    occasion: PRETEST_OCCASION,
    allBudgetTolerance: ALL_BUDGET_TOLERANCE,
    generator: { ...GENERATOR },
    measureTiming,
  };
}

// Las primeras semillas no cambian al pedir más. Una repetida se salta.
export function replicaSeedsOf(baseSeed: number, count: number): readonly number[] {
  const seeds = new Set<number>();
  for (let index = 0; seeds.size < count; index += 1) {
    seeds.add(deriveStreamSeed(baseSeed, `benchmark/replica/${index}`));
  }
  return [...seeds];
}

function allBudgetOf(run: DiagnosticMethodRun): MethodBudgetResult {
  const found = run.results.budgets.find((item) => item.requestedBudget === 'all');
  if (found === undefined) {
    throw new BenchmarkError('ALL_BUDGET_MISMATCH', `Falta el presupuesto "all" en ${run.results.method}`);
  }
  return found;
}

function summaryDifference(a: MetricSummary, b: MetricSummary): number {
  const counts = (summary: MetricSummary): string => JSON.stringify(summary.confusion);
  if (a.pairCount !== b.pairCount || counts(a) !== counts(b)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(
    ...METRICS.map(([metric]) => {
      const first = a[metric];
      const second = b[metric];
      if (first === null || second === null) {
        return first === second ? 0 : Number.POSITIVE_INFINITY;
      }
      return Math.abs(first - second);
    }),
  );
}

interface AllBudgetDifference {
  readonly posterior: number;
  readonly metric: number;
}

function differenceBetween(reference: MethodBudgetResult, other: MethodBudgetResult): AllBudgetDifference {
  const posterior = reference.states.flatMap((state, index) => {
    const joint = other.states[index]?.joint ?? [];
    return state.joint.map((mass, position) => Math.abs(mass - (joint[position] ?? Number.POSITIVE_INFINITY)));
  });
  const { overall, students, skills } = reference.metrics;
  const metrics = [
    summaryDifference(overall, other.metrics.overall),
    ...students.map((item, index) => {
      const student = other.metrics.students[index];
      return student === undefined ? Number.POSITIVE_INFINITY : summaryDifference(item, student);
    }),
    ...skills.map((item, index) => {
      const skill = other.metrics.skills[index];
      return skill === undefined ? Number.POSITIVE_INFINITY : summaryDifference(item, skill);
    }),
  ];
  return {
    posterior: posterior.reduce((largest, value) => Math.max(largest, value), 0),
    metric: metrics.reduce((largest, value) => Math.max(largest, value), 0),
  };
}

// Con todas las preguntas, el orden no importa. Si no coinciden, es un error.
export function allBudgetDifference(runs: readonly DiagnosticMethodRun[]): AllBudgetDifference {
  const [reference, ...others] = runs.map(allBudgetOf);
  if (reference === undefined) {
    throw new BenchmarkError('ALL_BUDGET_MISMATCH', 'No hay métodos que comprobar');
  }
  const differences = others.map((other) => differenceBetween(reference, other));
  const difference = {
    posterior: differences.reduce((largest, item) => Math.max(largest, item.posterior), 0),
    metric: differences.reduce((largest, item) => Math.max(largest, item.metric), 0),
  };
  if (!(difference.posterior <= ALL_BUDGET_TOLERANCE) || !(difference.metric <= ALL_BUDGET_TOLERANCE)) {
    throw new BenchmarkError(
      'ALL_BUDGET_MISMATCH',
      `Con "all", los métodos difieren: posterior ${difference.posterior}, métricas ${difference.metric}`,
    );
  }
  return difference;
}

function replicaResults(run: DiagnosticMethodRun): readonly ReplicaMethodResult[] {
  return run.results.budgets.map(({ requestedBudget, effectiveBudget, metrics }) => ({
    method: run.results.method,
    requestedBudget,
    effectiveBudget,
    questionsUsed: metrics.questionsUsed,
    metrics: metrics.overall,
  }));
}

function resultOf(replica: BenchmarkReplica, method: DiagnosticMethod, budget: QuestionBudget): ReplicaMethodResult | undefined {
  return replica.results.find((item) => item.method === method && item.requestedBudget === budget);
}

function observationsOf(
  replicas: readonly BenchmarkReplica[],
  method: DiagnosticMethod,
  budget: QuestionBudget,
  valueOf: (result: ReplicaMethodResult) => number | null,
): readonly SeedObservation[] {
  return replicas.flatMap((replica) => {
    const result = resultOf(replica, method, budget);
    return result === undefined ? [] : [{ seed: replica.seed, value: valueOf(result) }];
  });
}

interface Aggregation {
  readonly scenario: BenchmarkScenarioId;
  readonly replicas: readonly BenchmarkReplica[];
  readonly bootstrapSeed: number;
  readonly resamples: number;
}

function seriesId(scenario: BenchmarkScenarioId, budget: QuestionBudget, subject: string, metric: string): string {
  return `${scenario}/budget=${budget}/${subject}/${metric}`;
}

function summaryOf(method: DiagnosticMethod, budget: QuestionBudget, aggregation: Aggregation): MethodBudgetSummary {
  const { scenario, replicas, bootstrapSeed, resamples } = aggregation;
  const subject = `method=${method}`;
  const config = (metric: string) => ({ seriesId: seriesId(scenario, budget, subject, metric), bootstrapSeed, resamples });
  const [first] = replicas;
  return {
    method,
    requestedBudget: budget,
    effectiveBudget: (first === undefined ? undefined : resultOf(first, method, budget))?.effectiveBudget ?? 0,
    questionsUsed: summarizeSeedValues(
      observationsOf(replicas, method, budget, (result) => result.questionsUsed.mean),
      config('questionsUsed'),
    ),
    metrics: Object.fromEntries(
      METRICS.map(([metric]) => [
        metric,
        summarizeSeedValues(observationsOf(replicas, method, budget, (result) => result.metrics[metric]), config(metric)),
      ]),
    ) as Readonly<Record<BenchmarkMetric, MethodBudgetSummary['metrics'][BenchmarkMetric]>>,
  };
}

function comparisonsOf(budget: QuestionBudget, aggregation: Aggregation): readonly MetricComparison[] {
  const { scenario, replicas, bootstrapSeed, resamples } = aggregation;
  return METRICS.map(([metric, direction]) => ({
    requestedBudget: budget,
    metric,
    comparison: comparePairedSeeds(
      observationsOf(replicas, 'A', budget, (result) => result.metrics[metric]),
      observationsOf(replicas, 'B', budget, (result) => result.metrics[metric]),
      { seriesId: seriesId(scenario, budget, 'B-A', metric), bootstrapSeed, resamples, direction },
    ),
  }));
}

function realParametersFor(definition: BenchmarkScenarioDefinition): Readonly<Record<string, RealItemParameters>> | undefined {
  const { realParameters } = definition;
  if (realParameters === null) {
    return undefined;
  }
  return Object.fromEntries(RADAR_QUESTION_BANK.questions.map((question) => [question.id, { ...realParameters }]));
}

interface ScenarioExecution {
  readonly config: ValidatedConfig;
  readonly priorConfig: BenchmarkConfig['priorConfig'];
  readonly replicaSeeds: readonly number[];
  readonly bootstrapSeed: number;
}

interface ReplicaOutcome {
  readonly replica: BenchmarkReplica;
  readonly runs: readonly DiagnosticMethodRun[];
  readonly difference: AllBudgetDifference;
}

// Una sola clase y una sola tabla por escenario y réplica, compartidas por los métodos.
function runReplica(definition: BenchmarkScenarioDefinition, seed: number, execution: ScenarioExecution): ReplicaOutcome {
  const { config, priorConfig } = execution;
  const population = definition.population ?? undefined;
  const syntheticClass: SyntheticClass = createSyntheticClass(seed, config.studentCount, KNOWLEDGE_GRAPH, population);
  const uniforms = createResponseUniforms(
    seed,
    syntheticClass.students.map((student) => student.studentId),
    config.questionIds,
    PRETEST_OCCASION,
  );
  const realParametersByQuestion = realParametersFor(definition);
  const randomOrderSeed = deriveStreamSeed(seed, STREAMS.randomOrder);

  const runs = config.methods.map((method) =>
    runDiagnosticMethod({
      method,
      syntheticClass,
      questionBank: RADAR_QUESTION_BANK,
      knowledgeGraph: KNOWLEDGE_GRAPH,
      priorConfig: priorConfig ?? {},
      uniforms,
      budgets: config.budgets,
      randomOrderSeed,
      measureTiming: config.measureTiming,
      ...(realParametersByQuestion === undefined ? {} : { realParametersByQuestion }),
    }),
  );
  return {
    replica: { seed, randomOrderSeed, results: runs.flatMap(replicaResults) },
    runs,
    difference: allBudgetDifference(runs),
  };
}

interface TimedRun {
  readonly method: DiagnosticMethod;
  readonly timing: DiagnosticMethodTiming | null;
}

function timingRow(scenario: BenchmarkScenarioId, method: DiagnosticMethod, runs: readonly TimedRun[]): ScenarioMethodTiming {
  const timings = runs.flatMap((run) => (run.method === method && run.timing !== null ? [run.timing] : []));
  const total = (valueOf: (timing: DiagnosticMethodTiming) => number): number =>
    timings.reduce((sum, timing) => sum + valueOf(timing), 0);
  const selectionMs = total((timing) => timing.selectionMs);
  const selectionCount = total((timing) => timing.selectionCount);
  return {
    scenario,
    method,
    preparationMs: total((timing) => timing.preparationMs),
    selectionMs,
    selectionCount,
    meanSelectionMs: selectionCount === 0 ? null : selectionMs / selectionCount,
  };
}

interface ScenarioOutcome {
  readonly result: BenchmarkScenarioResult;
  readonly priorConfig: DiagnosticMethodRun['results']['config']['priorConfig'] | null;
  readonly timing: readonly ScenarioMethodTiming[];
}

function runScenario(id: BenchmarkScenarioId, execution: ScenarioExecution): ScenarioOutcome {
  const { config, replicaSeeds, bootstrapSeed } = execution;
  const definition = definitionOf(id);
  // Los estados de cada réplica se descartan aquí: solo se conservan sus métricas y tiempos.
  const outcomes = replicaSeeds.map((seed) => {
    const { replica, runs, difference } = runReplica(definition, seed, execution);
    const timed: readonly TimedRun[] = runs.map((run) => ({ method: run.results.method, timing: run.timing }));
    return { replica, difference, timed, priorConfig: runs[0]?.results.config.priorConfig ?? null };
  });
  const replicas = outcomes.map((outcome) => outcome.replica);
  const aggregation: Aggregation = { scenario: id, replicas, bootstrapSeed, resamples: config.resamples };

  const allBudgetCheck: AllBudgetCheck = {
    passed: true,
    tolerance: ALL_BUDGET_TOLERANCE,
    replicasChecked: replicas.length,
    maxPosteriorDifference: outcomes.reduce((largest, item) => Math.max(largest, item.difference.posterior), 0),
    maxMetricDifference: outcomes.reduce((largest, item) => Math.max(largest, item.difference.metric), 0),
  };
  const timedRuns = outcomes.flatMap((outcome) => outcome.timed);
  return {
    result: {
      definition,
      replicas,
      summaries: config.budgets.flatMap((budget) => config.methods.map((method) => summaryOf(method, budget, aggregation))),
      comparisons: config.budgets.flatMap((budget) => comparisonsOf(budget, aggregation)),
      allBudgetCheck,
    },
    priorConfig: outcomes[0]?.priorConfig ?? null,
    timing: config.methods.map((method) => timingRow(id, method, timedRuns)),
  };
}

function isDefaultRun(config: ValidatedConfig, given: BenchmarkConfig): boolean {
  return (
    config.studentCount === DEFAULT_STUDENT_COUNT &&
    config.seedCount >= DEFAULT_SEED_COUNT &&
    config.resamples >= DEFAULT_RESAMPLES &&
    JSON.stringify(config.budgets) === JSON.stringify(DEFAULT_BUDGETS) &&
    config.methods.length === DEFAULT_METHODS.length &&
    config.scenarios.length === DEFAULT_SCENARIOS.length &&
    given.priorConfig === undefined
  );
}

export function runBenchmark(config: BenchmarkConfig = {}): BenchmarkReport {
  const validated = validatedConfig(config);
  const { measureTiming, ...effective } = validated;
  const replicaSeeds = replicaSeedsOf(validated.baseSeed, validated.seedCount);
  const bootstrapSeed = deriveStreamSeed(validated.baseSeed, STREAMS.bootstrap);
  const execution: ScenarioExecution = { config: validated, priorConfig: config.priorConfig, replicaSeeds, bootstrapSeed };

  const outcomes = validated.scenarios.map((id) => runScenario(id, execution));
  const priorConfig = outcomes[0]?.priorConfig;
  if (priorConfig === null || priorConfig === undefined) {
    throw configError('No se ha ejecutado ninguna réplica');
  }

  const results: BenchmarkResults = {
    benchmarkVersion: BENCHMARK_VERSION,
    kind: isDefaultRun(validated, config) ? 'full' : 'test',
    config: { ...effective, priorConfig },
    replicaSeeds,
    bootstrapSeed,
    scenarios: outcomes.map((outcome) => outcome.result),
    disclaimer: DISCLAIMER,
  };
  const timing: BenchmarkTiming | null = measureTiming
    ? {
        byScenarioAndMethod: outcomes.flatMap((outcome) => outcome.timing),
        definition: TIMING_DEFINITION,
        disclaimer: TIMING_DISCLAIMER,
      }
    : null;
  return { results, timing };
}
