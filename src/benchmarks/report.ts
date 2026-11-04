import type {
  BenchmarkMetric,
  BenchmarkResults,
  BenchmarkScenarioResult,
  ConfidenceInterval,
  MetricComparison,
  PairedComparison,
  QuestionBudget,
  SeedSeriesSummary,
} from './types.ts';

const METRIC_LABELS: readonly (readonly [BenchmarkMetric, string])[] = [
  ['mae', 'MAE'],
  ['brier', 'Brier'],
  ['logLoss', 'Log-loss'],
  ['precision', 'Precisión'],
  ['recall', 'Recall'],
  ['f1', 'F1'],
  ['accuracy', 'Exactitud'],
];

const SCENARIO_TITLES: Readonly<Record<string, string>> = {
  wellSpecified: 'Bien especificado',
  misspecified: 'Mala especificación',
  homogeneous: 'Población homogénea',
};

const NOT_AVAILABLE = 'n/d';

function number(value: number | null): string {
  return value === null ? NOT_AVAILABLE : value.toFixed(4);
}

function signed(value: number | null): string {
  if (value === null) return NOT_AVAILABLE;
  return `${value >= 0 ? '+' : ''}${value.toFixed(4)}`;
}

function interval(value: ConfidenceInterval | null): string {
  return value === null ? NOT_AVAILABLE : `[${signed(value.lower)}, ${signed(value.upper)}]`;
}

function budgetLabel(budget: QuestionBudget): string {
  return budget === 'all' ? 'todas' : String(budget);
}

function table(header: readonly string[], rows: readonly (readonly string[])[]): string {
  const line = (cells: readonly string[]): string => `| ${cells.join(' | ')} |`;
  return [line(header), line(header.map(() => '---')), ...rows.map(line)].join('\n');
}

function meanCell(summary: SeedSeriesSummary): string {
  const missing = summary.totalCount - summary.validCount;
  const mean = number(summary.mean);
  return missing === 0 ? mean : `${mean} (${summary.validCount}/${summary.totalCount})`;
}

function labelOf(metric: BenchmarkMetric): string {
  return METRIC_LABELS.find(([key]) => key === metric)?.[1] ?? metric;
}

type IntervalVerdict = 'favorsB' | 'favorsA' | 'includesZero' | 'unavailable';

// Solo describe la posición del intervalo: no es un contraste ni una conclusión.
function verdictOf(comparison: PairedComparison): IntervalVerdict {
  const { confidenceInterval } = comparison.differences;
  if (confidenceInterval === null || comparison.pairCount < 2) return 'unavailable';
  const { lower, upper } = confidenceInterval;
  if (lower <= 0 && upper >= 0) return 'includesZero';
  const isLower = upper < 0;
  return isLower === (comparison.direction === 'lowerIsBetter') ? 'favorsB' : 'favorsA';
}

function countVerdict(comparisons: readonly MetricComparison[], verdict: IntervalVerdict): number {
  return comparisons.filter((item) => verdictOf(item.comparison) === verdict).length;
}

function overviewRows(scenario: BenchmarkScenarioResult, budgets: readonly QuestionBudget[]): readonly (readonly string[])[] {
  return budgets.map((budget) => {
    const comparisons = scenario.comparisons.filter((item) => item.requestedBudget === budget);
    const sum = (valueOf: (comparison: PairedComparison) => number): number =>
      comparisons.reduce((total, item) => total + valueOf(item.comparison), 0);
    return [
      SCENARIO_TITLES[scenario.definition.id] ?? scenario.definition.id,
      budgetLabel(budget),
      String(countVerdict(comparisons, 'favorsB')),
      String(countVerdict(comparisons, 'favorsA')),
      String(countVerdict(comparisons, 'includesZero')),
      String(countVerdict(comparisons, 'unavailable')),
      String(sum((comparison) => comparison.improvedCount)),
      String(sum((comparison) => comparison.tiedCount)),
      String(sum((comparison) => comparison.worsenedCount)),
    ];
  });
}

function summaryTable(scenario: BenchmarkScenarioResult): string {
  return table(
    ['Presupuesto', 'Método', 'Preguntas/alumno', ...METRIC_LABELS.map(([, label]) => label)],
    scenario.summaries.map((summary) => [
      budgetLabel(summary.requestedBudget),
      summary.method,
      number(summary.questionsUsed.mean),
      ...METRIC_LABELS.map(([metric]) => meanCell(summary.metrics[metric])),
    ]),
  );
}

function intervalTable(scenario: BenchmarkScenarioResult): string {
  return table(
    ['Presupuesto', 'Método', ...METRIC_LABELS.map(([, label]) => label)],
    scenario.summaries.map((summary) => [
      budgetLabel(summary.requestedBudget),
      summary.method,
      ...METRIC_LABELS.map(([metric]) => interval(summary.metrics[metric].confidenceInterval)),
    ]),
  );
}

function comparisonTable(scenario: BenchmarkScenarioResult): string {
  return table(
    ['Presupuesto', 'Métrica', 'Mejor si', 'Parejas', 'Excluidas', 'Media B − A', 'Desv. típica', 'IC 95 %', 'B mejora', 'Empate', 'B empeora'],
    scenario.comparisons.map(({ requestedBudget, metric, comparison }) => [
      budgetLabel(requestedBudget),
      labelOf(metric),
      comparison.direction === 'lowerIsBetter' ? 'menor' : 'mayor',
      String(comparison.pairCount),
      String(comparison.excludedPairs.length),
      signed(comparison.differences.mean),
      number(comparison.differences.standardDeviation),
      interval(comparison.differences.confidenceInterval),
      String(comparison.improvedCount),
      String(comparison.tiedCount),
      String(comparison.worsenedCount),
    ]),
  );
}

function scenarioSection(scenario: BenchmarkScenarioResult): string {
  const { definition } = scenario;
  return [
    `## ${SCENARIO_TITLES[definition.id] ?? definition.id}`,
    definition.description,
    '### Media entre semillas',
    'Entre paréntesis, semillas válidas / totales si alguna métrica no estaba definida.',
    summaryTable(scenario),
    '### Intervalos del 95 % de cada media',
    intervalTable(scenario),
    '### Comparación emparejada B − A',
    comparisonTable(scenario),
  ].join('\n\n');
}

export function renderBenchmarkMarkdown(results: BenchmarkResults): string {
  const { config, scenarios, replicaSeeds, bootstrapSeed, kind } = results;
  const budgets = config.budgets.map(budgetLabel).join(', ');

  return `${[
    '# Resultados del benchmark',
    '> Archivo generado por `npm run bench`. No se edita a mano: ninguna cifra está escrita a mano.',
    ...(kind === 'full' ? [] : ['> **EJECUCIÓN DE PRUEBA:** no usa la configuración completa y no es un resultado experimental.']),
    `> ${results.disclaimer}`,
    '## Cómo reproducir',
    [
      '```bash',
      'npm run bench',
      '```',
      '',
      'Regenera este archivo, `RESULTADOS_BENCHMARK.json` y `RESULTADOS_BENCHMARK_TIEMPOS.json`. Para comprobar que el bloque determinista coincide, sin escribir nada:',
      '',
      '```bash',
      'npm run bench -- --check',
      '```',
    ].join('\n'),
    table(
      ['Parámetro', 'Valor'],
      [
        ['Versión del benchmark', String(results.benchmarkVersion)],
        ['Generador', `${config.generator.algorithm} v${config.generator.version}`],
        ['Semilla base', String(config.baseSeed)],
        ['Semilla de bootstrap', String(bootstrapSeed)],
        ['Semillas de réplica', String(replicaSeeds.length)],
        ['Alumnos por réplica', String(config.studentCount)],
        ['Preguntas en el banco', String(config.bankSize)],
        ['Presupuestos', budgets],
        ['Métodos', config.methods.join(', ')],
        ['Remuestreos', String(config.resamples)],
      ],
    ),
    'Las semillas de réplica, la configuración efectiva y los resultados de cada réplica están en `RESULTADOS_BENCHMARK.json`.',
    '## Qué se compara',
    [
      '- **A:** orden fijo, igual para todos los alumnos.',
      '- **B:** selección adaptativa por ganancia de información esperada.',
      '- **C:** orden aleatorio por alumno, como control de cordura.',
      '',
      'En cada escenario y réplica, los métodos comparten clase, respuestas comunes, banco asumido, prior y presupuestos. Solo difiere qué preguntas se hacen.',
      '',
      'Las métricas comparan las marginales del motor con el estado real simulado. MAE, Brier y log-loss son mejores cuanto menores; precisión, recall, F1 y exactitud, cuanto mayores, con la dificultad (`α = 0`) como clase positiva.',
      '',
      'Cada semilla es una réplica. Los intervalos son percentiles bootstrap sobre semillas completas. **B − A** se calcula por semilla, solo con parejas válidas.',
    ].join('\n'),
    '## Comprobación con todas las preguntas',
    `Con el presupuesto \`all\`, los métodos deben terminar con los mismos posteriores y métricas, con tolerancia absoluta ${config.allBudgetTolerance}. Si no coincidieran, la ejecución fallaría y este archivo no existiría.`,
    table(
      ['Escenario', 'Réplicas', 'Máx. diferencia de posterior', 'Máx. diferencia de métricas', 'Resultado'],
      scenarios.map((scenario) => [
        SCENARIO_TITLES[scenario.definition.id] ?? scenario.definition.id,
        String(scenario.allBudgetCheck.replicasChecked),
        scenario.allBudgetCheck.maxPosteriorDifference.toExponential(2),
        scenario.allBudgetCheck.maxMetricDifference.toExponential(2),
        'Superada',
      ]),
    ),
    '## Resumen de B − A',
    'Para las siete métricas de cada presupuesto: dónde cae el intervalo de B − A y cuántas comparaciones por semilla (semillas × métricas) mejoran, empatan o empeoran. La posición del intervalo es descriptiva: no es un contraste de hipótesis, no corrige por multiplicidad y no garantiza superioridad. Las métricas están correlacionadas entre sí.',
    table(
      ['Escenario', 'Presupuesto', 'IC favorece a B', 'IC favorece a A', 'IC incluye 0', 'Sin intervalo', 'B mejora', 'Empate', 'B empeora'],
      scenarios.flatMap((scenario) => overviewRows(scenario, config.budgets)),
    ),
    ...scenarios.map(scenarioSection),
    '## Qué no demuestra',
    [
      '- Mide la recuperación de estados sintéticos generados con DINA, bajo SUPUESTOS no calibrados. No demuestra mejoras educativas ni eficacia con alumnos reales.',
      '- En dos de los tres escenarios, los datos se generan con los parámetros que asume el motor: eso favorece por construcción a la selección por EIG. Los parámetros de mala especificación son una única alternativa, no un análisis de sensibilidad.',
      '- La población por defecto sigue la estructura del grafo, y el prior del motor no la usa.',
      '- El banco y sus parámetros no están calibrados ni revisados por docentes.',
      '- Los intervalos solo reflejan la variabilidad entre semillas bajo estos SUPUESTOS, suelen quedarse cortos con pocas semillas y no corrigen por multiplicidad.',
      '- Con el presupuesto `todas`, B − A es cero salvo redondeo por construcción: no aporta evidencia.',
      '- Los tiempos están en un archivo aparte y no son una comparación definitiva de rendimiento.',
    ].join('\n'),
  ].join('\n\n')}\n`;
}
