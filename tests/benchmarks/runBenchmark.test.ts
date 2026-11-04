import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  JSON_FILE,
  MARKDOWN_FILE,
  TIMING_FILE,
  deterministicJson,
  differingFiles,
  writeBenchmarkFiles,
} from '../../scripts/bench.ts';
import {
  BenchmarkError,
  DEFAULT_BENCHMARK_BASE_SEED,
  comparePairedSeeds,
  renderBenchmarkMarkdown,
  runBenchmark,
  runDiagnosticMethod,
  summarizeSeedValues,
} from '../../src/benchmarks/index.ts';
import type {
  BenchmarkConfig,
  BenchmarkMetric,
  BenchmarkScenarioId,
  BenchmarkScenarioResult,
  DiagnosticMethod,
  DiagnosticMethodRun,
  QuestionBudget,
  ReplicaMethodResult,
  SeedObservation,
} from '../../src/benchmarks/index.ts';
import { allBudgetDifference, replicaSeedsOf } from '../../src/benchmarks/runBenchmark.ts';
import { KNOWLEDGE_GRAPH, RADAR_QUESTION_BANK } from '../../src/engine/index.ts';
import { createResponseUniforms, createSyntheticClass } from '../../src/simulation/index.ts';
import { ORDER, serializedCopy } from '../engine/support/inference.ts';

// Ejecución de prueba: no es un resultado experimental.
const SMALL: BenchmarkConfig = { seedCount: 3, studentCount: 4, resamples: 40, budgets: [4, 'all'] };
const METRICS: readonly BenchmarkMetric[] = ['mae', 'brier', 'logLoss', 'precision', 'recall', 'f1', 'accuracy'];
const REPORT = runBenchmark(SMALL);
const RESULTS = REPORT.results;

function scenarioOf(id: BenchmarkScenarioId): BenchmarkScenarioResult {
  const found = RESULTS.scenarios.find((scenario) => scenario.definition.id === id);
  if (found === undefined) throw new Error(`Falta ${id}`);
  return found;
}

function expectConfigError(config: unknown): void {
  let caught: unknown;
  try {
    runBenchmark(config as BenchmarkConfig);
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(BenchmarkError);
  expect(caught).toMatchObject({ code: 'INVALID_BENCHMARK_CONFIG' });
}

function resultIn(
  scenario: BenchmarkScenarioResult,
  seed: number,
  method: DiagnosticMethod,
  budget: QuestionBudget,
): ReplicaMethodResult | undefined {
  return scenario.replicas
    .find((replica) => replica.seed === seed)
    ?.results.find((item) => item.method === method && item.requestedBudget === budget);
}

function observations(
  scenario: BenchmarkScenarioResult,
  method: DiagnosticMethod,
  budget: QuestionBudget,
  metric: BenchmarkMetric,
): readonly SeedObservation[] {
  return scenario.replicas.map(({ seed }) => ({
    seed,
    value: resultIn(scenario, seed, method, budget)?.metrics[metric] ?? null,
  }));
}

describe('configuración', () => {
  it('declara la configuración efectiva', () => {
    expect(RESULTS.config).toMatchObject({
      baseSeed: 2026,
      studentCount: 4,
      seedCount: 3,
      budgets: [4, 'all'],
      methods: ['A', 'B', 'C'],
      resamples: 40,
      scenarios: ['wellSpecified', 'misspecified', 'homogeneous'],
      bankSize: 30,
      occasion: 'pretest',
      allBudgetTolerance: 1e-9,
      generator: { algorithm: 'mulberry32', version: 1 },
    });
    expect(RESULTS.config.priorConfig.marginals.OPS).toBe(0.5);
    expect(RESULTS.config.questionIds).toHaveLength(30);
    expect(DEFAULT_BENCHMARK_BASE_SEED).toBe(2026);
  });

  it('marca como prueba lo que no usa la configuración completa', () => {
    expect(RESULTS.kind).toBe('test');
  });

  it('establece un orden canónico', () => {
    const { config } = runBenchmark({
      ...SMALL,
      seedCount: 1,
      budgets: ['all', 4],
      methods: ['B', 'A'],
      scenarios: ['homogeneous', 'wellSpecified'],
    }).results;

    expect(config.budgets).toEqual([4, 'all']);
    expect(config.methods).toEqual(['A', 'B']);
    expect(config.scenarios).toEqual(['wellSpecified', 'homogeneous']);
  });

  it.each<[string, unknown]>([
    ['nula', null],
    ['con semilla base negativa', { baseSeed: -1 }],
    ['con semilla base fuera de uint32', { baseSeed: 2 ** 32 }],
    ['sin alumnos', { studentCount: 0 }],
    ['con alumnos decimales', { studentCount: 1.5 }],
    ['sin semillas', { seedCount: 0 }],
    ['con remuestreos 0', { resamples: 0 }],
    ['sin el presupuesto all', { budgets: [4, 6] }],
    ['sin A', { methods: ['B', 'C'] }],
    ['sin B', { methods: ['A', 'C'] }],
    ['con un método desconocido', { methods: ['A', 'B', 'D'] }],
    ['con métodos repetidos', { methods: ['A', 'B', 'B'] }],
    ['con métodos vacíos', { methods: [] }],
    ['con un escenario desconocido', { scenarios: ['otro'] }],
    ['con escenarios vacíos', { scenarios: [] }],
    ['con medición no booleana', { measureTiming: 'sí' }],
  ])('rechaza una configuración %s', (_, config) => {
    expectConfigError(config);
  });

  it('rechaza presupuestos inválidos', () => {
    expect(() => runBenchmark({ budgets: [0, 'all'] })).toThrow(BenchmarkError);
  });
});

describe('semillas', () => {
  it('coinciden con una réplica independiente en Python', () => {
    expect(RESULTS.replicaSeeds.slice(0, 2)).toEqual([2809651212, 3426085616]);
    expect(RESULTS.bootstrapSeed).toBe(3995981900);
    expect(scenarioOf('wellSpecified').replicas[0]?.randomOrderSeed).toBe(3597137868);
  });

  it('son únicas y las primeras no cambian al pedir más', () => {
    const many = replicaSeedsOf(2026, 500);

    expect(new Set(many).size).toBe(500);
    expect(many.slice(0, 3)).toEqual(RESULTS.replicaSeeds);
  });

  it('otra semilla base da otras semillas', () => {
    expect(replicaSeedsOf(1, 5)).not.toEqual(replicaSeedsOf(2, 5));
  });

  it('todos los escenarios usan las mismas semillas', () => {
    for (const scenario of RESULTS.scenarios) {
      expect(scenario.replicas.map((replica) => replica.seed)).toEqual(RESULTS.replicaSeeds);
    }
  });
});

describe('reproducibilidad y tiempos', () => {
  it('el bloque determinista se repite exactamente', () => {
    expect(JSON.stringify(runBenchmark(SMALL).results)).toBe(JSON.stringify(RESULTS));
  });

  it('sin medición no hay tiempos', () => {
    expect(REPORT.timing).toBeNull();
  });

  it('medir no cambia el bloque determinista y va aparte', () => {
    const measured = runBenchmark({ ...SMALL, seedCount: 1, scenarios: ['wellSpecified'], measureTiming: true });
    const plain = runBenchmark({ ...SMALL, seedCount: 1, scenarios: ['wellSpecified'] });

    expect(measured.results).toEqual(plain.results);
    expect(JSON.stringify(measured.results)).not.toMatch(/Ms"|timing|startedAt/);
    expect(measured.timing?.byScenarioAndMethod.map((row) => row.method)).toEqual(['A', 'B', 'C']);
    expect(measured.timing?.byScenarioAndMethod[1]).toMatchObject({ scenario: 'wellSpecified', method: 'B', selectionCount: 4 * 30 });
    expect(measured.timing?.disclaimer).toContain('no son una comparación definitiva');
  });

  it('sobrevive a JSON', () => {
    expect(serializedCopy(RESULTS)).toEqual(RESULTS);
  });

  it('no contiene verdad simulada, uniformes ni estados', () => {
    expect(JSON.stringify(RESULTS)).not.toMatch(/trueMastery|correctness|"joint"/);
  });
});

describe('agregación', () => {
  it('cada resumen se recalcula desde los resultados por réplica', () => {
    for (const scenario of RESULTS.scenarios) {
      for (const summary of scenario.summaries) {
        for (const metric of METRICS) {
          const series = observations(scenario, summary.method, summary.requestedBudget, metric);
          const { seriesId, bootstrapSeed, resamples } = summary.metrics[metric].bootstrap;

          expect(summarizeSeedValues(series, { seriesId, bootstrapSeed, resamples })).toEqual(summary.metrics[metric]);
        }
      }
    }
  });

  it('cada comparación se recalcula desde los resultados por réplica', () => {
    for (const scenario of RESULTS.scenarios) {
      for (const { requestedBudget, metric, comparison } of scenario.comparisons) {
        const { seriesId, bootstrapSeed, resamples } = comparison.differences.bootstrap;
        const recalculated = comparePairedSeeds(
          observations(scenario, 'A', requestedBudget, metric),
          observations(scenario, 'B', requestedBudget, metric),
          { seriesId, bootstrapSeed, resamples, direction: comparison.direction },
        );

        expect(recalculated).toEqual(comparison);
      }
    }
  });

  it('cubre todas las combinaciones', () => {
    for (const scenario of RESULTS.scenarios) {
      expect(scenario.summaries).toHaveLength(2 * 3);
      expect(scenario.comparisons).toHaveLength(2 * 7);
      expect(scenario.replicas[0]?.results).toHaveLength(3 * 2);
    }
  });

  it('declara la dirección de cada métrica', () => {
    const directions = Object.fromEntries(
      scenarioOf('wellSpecified').comparisons.slice(0, 7).map((item) => [item.metric, item.comparison.direction]),
    );

    expect(directions).toEqual({
      mae: 'lowerIsBetter',
      brier: 'lowerIsBetter',
      logLoss: 'lowerIsBetter',
      precision: 'higherIsBetter',
      recall: 'higherIsBetter',
      f1: 'higherIsBetter',
      accuracy: 'higherIsBetter',
    });
  });

  it('los ids de serie son únicos y estables', () => {
    const ids = RESULTS.scenarios.flatMap((scenario) => [
      ...scenario.summaries.flatMap((summary) => [
        summary.questionsUsed.bootstrap.seriesId,
        ...METRICS.map((metric) => summary.metrics[metric].bootstrap.seriesId),
      ]),
      ...scenario.comparisons.map((item) => item.comparison.differences.bootstrap.seriesId),
    ]);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('wellSpecified/budget=4/method=B/mae');
    expect(ids).toContain('misspecified/budget=all/B-A/f1');
  });

  it('añadir un método o un presupuesto no cambia las series existentes', () => {
    const small = runBenchmark({ ...SMALL, methods: ['A', 'B'], budgets: ['all'], scenarios: ['wellSpecified'] });
    const scenario = small.results.scenarios[0];
    const larger = RESULTS.scenarios[0];

    expect(scenario?.comparisons).toEqual(larger?.comparisons.filter((item) => item.requestedBudget === 'all'));
  });

  it('cuenta mejoras, empates y empeoramientos sin perder parejas', () => {
    for (const { comparison } of scenarioOf('misspecified').comparisons) {
      expect(comparison.improvedCount + comparison.tiedCount + comparison.worsenedCount).toBe(comparison.pairCount);
      expect(comparison.pairCount + comparison.excludedPairs.length).toBe(3);
    }
  });

  it('conserva los null sin convertirlos en 0', () => {
    const report = runBenchmark({ seedCount: 3, studentCount: 1, resamples: 10, budgets: ['all'], scenarios: ['wellSpecified'] });
    const [scenario] = report.results.scenarios;
    const summaries = scenario?.summaries.flatMap((summary) => METRICS.map((metric) => summary.metrics[metric])) ?? [];

    for (const summary of summaries) {
      expect(summary.validCount + summary.excludedSeeds.length).toBe(summary.totalCount);
    }
    for (const replica of scenario?.replicas ?? []) {
      for (const { metrics } of replica.results) {
        const { truePositives, falsePositives } = metrics.confusion;
        expect(metrics.precision === null).toBe(truePositives + falsePositives === 0);
      }
    }
  });

  it('informa de las preguntas usadas', () => {
    const summary = scenarioOf('wellSpecified').summaries.find((item) => item.requestedBudget === 4);

    expect(summary?.effectiveBudget).toBe(4);
    expect(summary?.questionsUsed.mean).toBe(4);
    const all = scenarioOf('wellSpecified').summaries.find((item) => item.requestedBudget === 'all');
    expect(all?.effectiveBudget).toBe(30);
    expect(all?.questionsUsed.mean).toBe(30);
  });
});

describe('escenarios', () => {
  it('declara cada definición', () => {
    expect(scenarioOf('wellSpecified').definition).toMatchObject({ population: null, realParameters: null });
    expect(scenarioOf('misspecified').definition).toMatchObject({ population: null, realParameters: { slip: 0.25, guess: 0.2 } });

    const { population, realParameters, description } = scenarioOf('homogeneous').definition;
    expect(realParameters).toBeNull();
    expect(population?.prerequisiteFactor).toBe(0.5);
    expect(population?.groups).toEqual([
      { id: 'homogeneous', masteryProbabilities: Object.fromEntries(ORDER.map((skill) => [skill, 0.6])) },
    ]);
    expect(description).toContain('no el mismo conocimiento');
  });

  it('la mala especificación cambia los resultados con las mismas semillas', () => {
    const well = scenarioOf('wellSpecified').replicas.map((replica) => replica.results);
    const wrong = scenarioOf('misspecified').replicas.map((replica) => replica.results);

    expect(wrong).not.toEqual(well);
  });

  it('el banco asumido no cambia', () => {
    const before = JSON.stringify(RADAR_QUESTION_BANK);
    runBenchmark({ ...SMALL, seedCount: 1, scenarios: ['misspecified'] });

    expect(JSON.stringify(RADAR_QUESTION_BANK)).toBe(before);
  });
});

describe('comprobación con todas las preguntas', () => {
  function runsFor(seed: number): readonly DiagnosticMethodRun[] {
    const syntheticClass = createSyntheticClass(seed, 3, KNOWLEDGE_GRAPH);
    const uniforms = createResponseUniforms(
      seed,
      syntheticClass.students.map((student) => student.studentId),
      RADAR_QUESTION_BANK.questions.map((question) => question.id),
      'pretest',
    );
    return (['A', 'B', 'C'] as const).map((method) =>
      runDiagnosticMethod({
        method,
        syntheticClass,
        questionBank: RADAR_QUESTION_BANK,
        knowledgeGraph: KNOWLEDGE_GRAPH,
        priorConfig: {},
        uniforms,
        budgets: ['all'],
        randomOrderSeed: 1,
      }),
    );
  }

  it('se supera en todos los escenarios', () => {
    for (const { allBudgetCheck } of RESULTS.scenarios) {
      expect(allBudgetCheck.passed).toBe(true);
      expect(allBudgetCheck.replicasChecked).toBe(3);
      expect(allBudgetCheck.tolerance).toBe(1e-9);
      expect(allBudgetCheck.maxPosteriorDifference).toBeLessThanOrEqual(1e-9);
      expect(allBudgetCheck.maxMetricDifference).toBeLessThanOrEqual(1e-9);
    }
  });

  it('un posterior distinto se comunica como error', () => {
    const [first, ...others] = runsFor(1);
    if (first === undefined) throw new Error('Falta el método');
    const [budget] = first.results.budgets;
    if (budget === undefined) throw new Error('Falta el presupuesto');
    const altered: DiagnosticMethodRun = {
      ...first,
      results: {
        ...first.results,
        budgets: [
          {
            ...budget,
            states: budget.states.map((state, index) =>
              index === 0 ? { ...state, joint: state.joint.map((mass, position) => (position === 0 ? mass + 1e-6 : mass)) } : state,
            ),
          },
        ],
      },
    };

    expect(() => allBudgetDifference([altered, ...others])).toThrow(BenchmarkError);
    expect(() => allBudgetDifference([altered, ...others])).toThrow(/difieren/);
  });

  it('una métrica distinta se comunica como error', () => {
    const [first, ...others] = runsFor(2);
    if (first === undefined) throw new Error('Falta el método');
    const [budget] = first.results.budgets;
    if (budget === undefined) throw new Error('Falta el presupuesto');
    const altered: DiagnosticMethodRun = {
      ...first,
      results: {
        ...first.results,
        budgets: [
          {
            ...budget,
            metrics: { ...budget.metrics, overall: { ...budget.metrics.overall, mae: (budget.metrics.overall.mae ?? 0) + 1e-6 } },
          },
        ],
      },
    };

    expect(() => allBudgetDifference([altered, ...others])).toThrow(BenchmarkError);
  });

  it('dos métodos correctos no dan error', () => {
    expect(allBudgetDifference(runsFor(3)).posterior).toBeLessThanOrEqual(1e-9);
  });
});

describe('informe', () => {
  const markdown = renderBenchmarkMarkdown(RESULTS);

  it('identifica las ejecuciones de prueba', () => {
    expect(markdown).toContain('EJECUCIÓN DE PRUEBA');
    expect(renderBenchmarkMarkdown({ ...RESULTS, kind: 'full' })).not.toContain('EJECUCIÓN DE PRUEBA');
  });

  it('explica reproducción, comparación y límites', () => {
    expect(markdown).toContain('npm run bench');
    expect(markdown).toContain('## Qué se compara');
    expect(markdown).toContain('recuperación de estados sintéticos');
    expect(markdown).toContain('No demuestra mejoras educativas ni eficacia con alumnos reales');
  });

  it('muestra empates y empeoramientos con sus cifras', () => {
    const { comparisons } = scenarioOf('wellSpecified');
    const [first] = comparisons;

    expect(markdown).toContain('B empeora');
    expect(markdown).toContain('Empate');
    expect(markdown).toContain(`| ${first?.comparison.improvedCount} | ${first?.comparison.tiedCount} | ${first?.comparison.worsenedCount} |`);
  });

  it('las cifras salen de los resultados', () => {
    const summary = scenarioOf('wellSpecified').summaries[0];

    expect(markdown).toContain((summary?.metrics.mae.mean ?? Number.NaN).toFixed(4));
  });

  it('no incluye tiempos', () => {
    expect(markdown).not.toMatch(/selectionMs|\bms\b/);
  });

  it('un valor null se muestra como no disponible, no como 0', () => {
    const [scenario] = RESULTS.scenarios;
    if (scenario === undefined) throw new Error('Falta el escenario');
    const [summary, ...rest] = scenario.summaries;
    if (summary === undefined) throw new Error('Falta el resumen');
    const emptied = {
      ...RESULTS,
      scenarios: [
        {
          ...scenario,
          summaries: [
            { ...summary, metrics: { ...summary.metrics, mae: { ...summary.metrics.mae, mean: null, confidenceInterval: null, validCount: 0 } } },
            ...rest,
          ],
        },
      ],
    };

    expect(renderBenchmarkMarkdown(emptied)).toContain('n/d (0/3)');
  });
});

describe('archivos del experimento', () => {
  const directory = mkdtempSync(join(tmpdir(), 'radar-bench-'));
  const report = runBenchmark({ ...SMALL, seedCount: 1, scenarios: ['wellSpecified'], measureTiming: true });
  const execution = {
    startedAt: 'inicio',
    finishedAt: 'fin',
    durationMs: 1,
    nodeVersion: 'v0',
    platform: 'prueba',
    arch: 'prueba',
  };
  writeBenchmarkFiles(directory, report, execution);

  afterAll(() => {
    rmSync(directory, { recursive: true });
  });

  it('separa resultados de tiempos y metadatos', () => {
    const deterministic = readFileSync(join(directory, JSON_FILE), 'utf8');
    const timing = JSON.parse(readFileSync(join(directory, TIMING_FILE), 'utf8')) as Record<string, unknown>;

    expect(deterministic).toBe(deterministicJson(report.results));
    expect(deterministic).not.toMatch(/startedAt|nodeVersion|selectionMs/);
    expect(readFileSync(join(directory, MARKDOWN_FILE), 'utf8')).not.toMatch(/startedAt|nodeVersion/);
    expect(timing.execution).toEqual(execution);
    expect(timing.note).toContain('no forman parte de los resultados deterministas');
    expect(timing).not.toHaveProperty('results');
  });

  it('la comprobación acepta lo mismo y detecta una alteración', () => {
    expect(differingFiles(directory, report.results)).toEqual([]);

    writeFileSync(join(directory, MARKDOWN_FILE), 'alterado');

    expect(differingFiles(directory, report.results)).toEqual([MARKDOWN_FILE]);
  });
});
