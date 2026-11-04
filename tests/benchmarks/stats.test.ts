import { describe, expect, it } from 'vitest';
import { BenchmarkError, comparePairedSeeds, summarizeSeedValues } from '../../src/benchmarks/index.ts';
import type {
  BenchmarkErrorCode,
  PairedComparisonConfig,
  SeedObservation,
  SeedSeriesConfig,
} from '../../src/benchmarks/index.ts';
import { bootstrapMeans, percentile } from '../../src/benchmarks/stats.ts';
import { deepFreeze } from '../engine/support/bank.ts';
import { expectClose, serializedCopy } from '../engine/support/inference.ts';

const SERIES: SeedSeriesConfig = { seriesId: 'mae/B', bootstrapSeed: 11 };
const COMPARE: PairedComparisonConfig = { seriesId: 'mae/B-A', bootstrapSeed: 11, direction: 'lowerIsBetter' };

function series(values: readonly (number | null)[], firstSeed = 1): readonly SeedObservation[] {
  return values.map((value, index) => ({ seed: firstSeed + index, value }));
}

function expectBenchmarkError(action: () => unknown, code: BenchmarkErrorCode): void {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(BenchmarkError);
  expect(caught).toMatchObject({ name: 'BenchmarkError', code });
}

describe('resumen por semilla', () => {
  it('media y desviación muestral conocidas', () => {
    const summary = summarizeSeedValues(series([2, 4, 4, 4, 5, 5, 7, 9]), SERIES);

    expect(summary.mean).toBe(5);
    expectClose(summary.standardDeviation ?? Number.NaN, Math.sqrt(32 / 7));
    expect(summary.totalCount).toBe(8);
    expect(summary.validCount).toBe(8);
    expect(summary.excludedSeeds).toEqual([]);
    expect(summary.warnings).toEqual([]);
  });

  it('usa el divisor n - 1', () => {
    expect(summarizeSeedValues(series([1, 3]), SERIES).standardDeviation).toBeCloseTo(Math.SQRT2, 14);
  });

  it('valores constantes: desviación 0 e intervalo en el valor', () => {
    const summary = summarizeSeedValues(series([0.25, 0.25, 0.25, 0.25]), SERIES);

    expect(summary.mean).toBe(0.25);
    expect(summary.standardDeviation).toBe(0);
    expect(summary.confidenceInterval).toEqual({ lower: 0.25, upper: 0.25 });
  });

  it('sin observaciones: todo null, sin convertirlo en 0', () => {
    const summary = summarizeSeedValues([], SERIES);

    expect(summary).toMatchObject({ totalCount: 0, validCount: 0, mean: null, standardDeviation: null, confidenceInterval: null });
    expect(summary.warnings.map((item) => item.code)).toEqual(['NO_VALID_VALUES']);
  });

  it('solo null: exclusiones identificadas y estadísticas null', () => {
    const summary = summarizeSeedValues(series([null, null]), SERIES);

    expect(summary).toMatchObject({ totalCount: 2, validCount: 0, mean: null, standardDeviation: null, confidenceInterval: null });
    expect(summary.excludedSeeds).toEqual([1, 2]);
  });

  it('un solo valor: media, desviación null e intervalo degenerado con aviso', () => {
    const summary = summarizeSeedValues(series([0.7, null]), SERIES);

    expect(summary.mean).toBe(0.7);
    expect(summary.standardDeviation).toBeNull();
    expect(summary.confidenceInterval).toEqual({ lower: 0.7, upper: 0.7 });
    expect(summary.warnings.map((item) => item.code)).toEqual(['SINGLE_VALID_VALUE']);
    expect(summary.warnings[0]?.message).toContain('no informa sobre la variabilidad');
  });

  it('un null no cuenta como 0', () => {
    const summary = summarizeSeedValues(series([1, null, 3]), SERIES);

    expect(summary.mean).toBe(2);
    expect(summary.validCount).toBe(2);
    expect(summary.excludedSeeds).toEqual([2]);
    expect(summary.bootstrap.resampleSize).toBe(2);
  });

  it('un valor 0 es un valor válido', () => {
    expect(summarizeSeedValues(series([0, 0]), SERIES)).toMatchObject({ validCount: 2, mean: 0 });
  });

  it('permutar las semillas no cambia el resultado', () => {
    const ordered = series([0.1, 0.5, null, 0.9, 0.2]);

    expect(summarizeSeedValues([...ordered].reverse(), SERIES)).toEqual(summarizeSeedValues(ordered, SERIES));
  });

  it('declara configuración y procedencia', () => {
    const { bootstrap } = summarizeSeedValues(series([1, 2, null]), { ...SERIES, resamples: 50 });

    expect(bootstrap).toEqual({
      method: 'percentile',
      statistic: 'mean',
      unit: 'seed',
      generator: { algorithm: 'mulberry32', version: 1 },
      bootstrapSeed: 11,
      seriesId: 'mae/B',
      streamLabel: 'bootstrap/["mae/B"]',
      resamples: 50,
      resampleSize: 2,
      confidenceLevel: 0.95,
      lowerQuantile: 0.025,
      upperQuantile: 0.975,
    });
  });

  it('usa 2000 remuestreos por defecto', () => {
    expect(summarizeSeedValues(series([1, 2]), SERIES).bootstrap.resamples).toBe(2000);
  });
});

describe('percentiles', () => {
  it.each<[number, number]>([
    [0, 1],
    [0.25, 1.75],
    [0.5, 2.5],
    [0.975, 3.925],
    [1, 4],
  ])('q = %d interpola en (m - 1)·q', (quantile, expected) => {
    expectClose(percentile([1, 2, 3, 4], quantile), expected);
  });

  it('con 41 valores, 2.5 % cae justo en la posición 1', () => {
    const values = Array.from({ length: 41 }, (_, index) => index * 10);

    expectClose(percentile(values, 0.025), 10);
    expectClose(percentile(values, 0.975), 390);
  });

  it('un solo valor', () => {
    expect(percentile([5], 0.975)).toBe(5);
  });
});

describe('bootstrap reproducible', () => {
  const values = [0.5, 0.9, 0.2];
  const unordered: readonly SeedObservation[] = [
    { seed: 3, value: 0.2 },
    { seed: 1, value: 0.5 },
    { seed: 2, value: 0.9 },
  ];

  it('coincide con una réplica independiente en Python', () => {
    expect(bootstrapMeans(values, { seriesId: 'mae/B', bootstrapSeed: 11, resamples: 6 })).toEqual([
      0.6666666666666666, 0.5333333333333333, 0.43333333333333335, 0.3, 0.39999999999999997, 0.20000000000000004,
    ]);
  });

  it('el intervalo coincide con la réplica, con 6 y 2000 remuestreos', () => {
    expect(summarizeSeedValues(unordered, { ...SERIES, resamples: 6 }).confidenceInterval).toEqual({
      lower: 0.21250000000000002,
      upper: 0.6499999999999999,
    });
    expect(summarizeSeedValues(unordered, SERIES).confidenceInterval).toEqual({ lower: 0.20000000000000004, upper: 0.9 });
  });

  it('cada remuestra es una media de n semillas completas', () => {
    // Con tres valores, toda media es (i·0.5 + j·0.9 + k·0.2)/3 con i + j + k = 3.
    const allowed: number[] = [];
    for (let i = 0; i <= 3; i += 1) {
      for (let j = 0; j <= 3 - i; j += 1) {
        allowed.push((i * 0.5 + j * 0.9 + (3 - i - j) * 0.2) / 3);
      }
    }

    for (const mean of bootstrapMeans(values, { seriesId: 'x', bootstrapSeed: 1, resamples: 200 })) {
      expect(allowed.some((value) => Math.abs(value - mean) < 1e-12)).toBe(true);
    }
  });

  it('las mismas entradas repiten exactamente el resultado', () => {
    expect(JSON.stringify(summarizeSeedValues(unordered, SERIES))).toBe(JSON.stringify(summarizeSeedValues(unordered, SERIES)));
  });

  it('otra semilla de bootstrap u otra serie cambian el remuestreo', () => {
    const base = bootstrapMeans(values, { seriesId: 'a', bootstrapSeed: 1, resamples: 50 });

    expect(bootstrapMeans(values, { seriesId: 'a', bootstrapSeed: 2, resamples: 50 })).not.toEqual(base);
    expect(bootstrapMeans(values, { seriesId: 'b', bootstrapSeed: 1, resamples: 50 })).not.toEqual(base);
  });

  it('añadir otra serie no cambia la anterior', () => {
    const alone = summarizeSeedValues(unordered, SERIES);
    summarizeSeedValues(series([0.3, 0.8, 0.1]), { ...SERIES, seriesId: 'brier/B' });
    comparePairedSeeds(unordered, unordered, COMPARE);

    expect(summarizeSeedValues(unordered, SERIES)).toEqual(alone);
  });

  it('más remuestreos conservan los primeros', () => {
    const few = bootstrapMeans(values, { seriesId: 'x', bootstrapSeed: 1, resamples: 20 });
    const many = bootstrapMeans(values, { seriesId: 'x', bootstrapSeed: 1, resamples: 40 });

    expect(many.slice(0, 20)).toEqual(few);
  });

  it('las etiquetas no son ambiguas', () => {
    expect(summarizeSeedValues(series([1]), { ...SERIES, seriesId: 'a"]' }).bootstrap.streamLabel).toBe('bootstrap/["a\\"]"]');
  });
});

describe('comparación emparejada', () => {
  it('resume las diferencias B - A', () => {
    const result = comparePairedSeeds(series([0.5, 0.2, 0.7, 0.1]), series([0.6, 0.5, 0.5, 0.5]), {
      ...COMPARE,
      seriesId: 'brier/B-A',
      bootstrapSeed: 5,
    });

    expect(result.pairs.map((pair) => pair.seed)).toEqual([1, 2, 3, 4]);
    expect(result.pairCount).toBe(4);
    expectClose(result.pairs[0]?.difference ?? Number.NaN, 0.1);
    expectClose(result.differences.mean ?? Number.NaN, 0.15);
    // Diferencias 0.1, 0.3, -0.2 y 0.4: suma de cuadrados 0.21 respecto a la media.
    expectClose(result.differences.standardDeviation ?? Number.NaN, Math.sqrt(0.21 / 3));
    expect(result.differences.bootstrap.seriesId).toBe('brier/B-A');
  });

  it('coincide con el intervalo de una réplica independiente', () => {
    const differences = [0.1, 0.3, -0.2, 0.4];
    const a = series([0, 0, 0, 0]);
    const b = series(differences);
    const result = comparePairedSeeds(a, b, { ...COMPARE, seriesId: 'brier/B-A', bootstrapSeed: 5 });

    expect(result.differences.confidenceInterval).toEqual({ lower: -0.07500000000000002, upper: 0.35000000000000003 });
  });

  it('no resta medias de conjuntos distintos', () => {
    const a: readonly SeedObservation[] = [
      { seed: 1, value: 0.1 },
      { seed: 2, value: 0.2 },
      { seed: 3, value: 0.9 },
    ];
    const b: readonly SeedObservation[] = [
      { seed: 1, value: 0.2 },
      { seed: 2, value: null },
      { seed: 3, value: 1 },
      { seed: 4, value: 0 },
    ];
    const result = comparePairedSeeds(a, b, COMPARE);

    // Medias sin emparejar: 0.4 en A y 0.4 en B, diferencia 0. Emparejadas: 0.1.
    expectClose(result.differences.mean ?? Number.NaN, 0.1);
    expect(result.pairCount).toBe(2);
  });

  it('empareja por semilla, no por posición', () => {
    const a: readonly SeedObservation[] = [
      { seed: 2, value: 10 },
      { seed: 1, value: 1 },
    ];
    const b: readonly SeedObservation[] = [
      { seed: 1, value: 2 },
      { seed: 2, value: 20 },
    ];

    expect(comparePairedSeeds(a, b, COMPARE).pairs.map((pair) => pair.difference)).toEqual([1, 10]);
  });

  it('identifica cada exclusión con su motivo', () => {
    const a: readonly SeedObservation[] = [
      { seed: 1, value: 1 },
      { seed: 2, value: null },
      { seed: 3, value: 1 },
      { seed: 4, value: null },
      { seed: 5, value: 1 },
      { seed: 7, value: null },
    ];
    const b: readonly SeedObservation[] = [
      { seed: 1, value: 2 },
      { seed: 2, value: 1 },
      { seed: 3, value: null },
      { seed: 4, value: null },
      { seed: 6, value: 1 },
    ];

    expect(comparePairedSeeds(a, b, COMPARE).excludedPairs).toEqual([
      { seed: 2, reason: 'nullInA' },
      { seed: 3, reason: 'nullInB' },
      { seed: 4, reason: 'nullInBoth' },
      { seed: 5, reason: 'missingInB' },
      { seed: 6, reason: 'missingInA' },
      { seed: 7, reason: 'missingInB' },
    ]);
  });

  it('sin parejas válidas: estadísticas null', () => {
    const result = comparePairedSeeds(series([1, null]), series([null, 1]), COMPARE);

    expect(result.pairCount).toBe(0);
    expect(result.differences).toMatchObject({ mean: null, standardDeviation: null, confidenceInterval: null, validCount: 0 });
    expect(result.differences.warnings.map((item) => item.code)).toEqual(['NO_VALID_VALUES']);
    expect([result.improvedCount, result.tiedCount, result.worsenedCount]).toEqual([0, 0, 0]);
  });

  it('una pareja válida: intervalo degenerado con aviso', () => {
    const result = comparePairedSeeds(series([1, null]), series([3, 2]), COMPARE);

    expect(result.differences).toMatchObject({ mean: 2, standardDeviation: null, confidenceInterval: { lower: 2, upper: 2 } });
    expect(result.differences.warnings.map((item) => item.code)).toEqual(['SINGLE_VALID_VALUE']);
  });

  it('menor es mejor', () => {
    const result = comparePairedSeeds(series([0.5, 0.5, 0.5]), series([0.4, 0.5, 0.6]), COMPARE);

    expect([result.improvedCount, result.tiedCount, result.worsenedCount]).toEqual([1, 1, 1]);
    expect(result.direction).toBe('lowerIsBetter');
  });

  it('mayor es mejor', () => {
    const result = comparePairedSeeds(series([0.5, 0.5, 0.5, 0.5]), series([0.4, 0.5, 0.6, 0.7]), {
      ...COMPARE,
      direction: 'higherIsBetter',
    });

    expect([result.improvedCount, result.tiedCount, result.worsenedCount]).toEqual([2, 1, 1]);
  });

  it.each<[string, number, number | undefined, readonly number[]]>([
    ['dentro de la tolerancia por defecto', 5e-13, undefined, [0, 1, 0]],
    ['en la tolerancia exacta', 0.25, 0.25, [0, 1, 0]],
    ['fuera de la tolerancia por defecto', 2e-12, undefined, [0, 0, 1]],
    ['tolerancia 0 con diferencia mínima', 1e-15, 0, [0, 0, 1]],
    ['tolerancia configurada mayor', 0.01, 0.1, [0, 1, 0]],
  ])('empate %s', (_, difference, tieTolerance, expected) => {
    const config = tieTolerance === undefined ? COMPARE : { ...COMPARE, tieTolerance };
    const result = comparePairedSeeds(series([0]), series([difference]), config);

    expect([result.improvedCount, result.tiedCount, result.worsenedCount]).toEqual(expected);
  });

  it('la tolerancia solo clasifica: no cambia diferencias ni estadísticas', () => {
    const a = series([0, 0, 0]);
    const b = series([0.01, 0.02, 0.06]);
    const strict = comparePairedSeeds(a, b, { ...COMPARE, tieTolerance: 0 });
    const loose = comparePairedSeeds(a, b, { ...COMPARE, tieTolerance: 1 });

    expect(loose.pairs).toEqual(strict.pairs);
    expect(loose.differences).toEqual(strict.differences);
    expect(loose.tiedCount).toBe(3);
    expect(strict.tiedCount).toBe(0);
    expect(loose.tieTolerance).toBe(1);
  });

  it('usa 1e-12 por defecto y declara sus límites', () => {
    const result = comparePairedSeeds(series([0]), series([0]), COMPARE);

    expect(result.tieTolerance).toBe(1e-12);
    expect(result.disclaimer).toContain('no es prueba de eficacia educativa ni garantía de superioridad');
  });

  it('permutar las entradas no cambia el resultado', () => {
    const a = series([0.1, 0.4, null, 0.6]);
    const b = series([0.2, null, 0.3, 0.1, 0.9]);

    expect(comparePairedSeeds([...a].reverse(), [...b].reverse(), COMPARE)).toEqual(comparePairedSeeds(a, b, COMPARE));
  });

  it('se serializa sin perder nada', () => {
    const result = comparePairedSeeds(series([0.1, null]), series([0.2, 0.3, 0.4]), COMPARE);

    expect(serializedCopy(result)).toEqual(result);
  });
});

describe('entradas', () => {
  it('no muta entradas congeladas', () => {
    const a = deepFreeze(series([0.3, 0.1, null]).slice().reverse());
    const b = deepFreeze(series([0.2, 0.4]));
    const config = deepFreeze({ ...COMPARE });

    expect(summarizeSeedValues(a, deepFreeze({ ...SERIES })).validCount).toBe(2);
    expect(comparePairedSeeds(a, b, config).pairCount).toBe(2);
    expect(a.map((item) => item.seed)).toEqual([3, 2, 1]);
  });

  it.each<[string, unknown]>([
    ['que no son una lista', 'x'],
    ['con una observación nula', [null]],
    ['con una semilla negativa', [{ seed: -1, value: 1 }]],
    ['con una semilla decimal', [{ seed: 1.5, value: 1 }]],
    ['con una semilla fuera de uint32', [{ seed: 2 ** 32, value: 1 }]],
    ['con una semilla de texto', [{ seed: '1', value: 1 }]],
    ['con una semilla repetida', [{ seed: 1, value: 1 }, { seed: 1, value: 2 }]],
    ['con una semilla repetida y un null', [{ seed: 1, value: null }, { seed: 1, value: 2 }]],
    ['con NaN', [{ seed: 1, value: Number.NaN }]],
    ['con Infinity', [{ seed: 1, value: Number.POSITIVE_INFINITY }]],
    ['con -Infinity', [{ seed: 1, value: Number.NEGATIVE_INFINITY }]],
    ['con un valor de texto', [{ seed: 1, value: '1' }]],
    ['sin valor', [{ seed: 1 }]],
  ])('rechaza observaciones %s', (_, observations) => {
    const list = observations as readonly SeedObservation[];

    expectBenchmarkError(() => summarizeSeedValues(list, SERIES), 'INVALID_OBSERVATIONS');
    expectBenchmarkError(() => comparePairedSeeds(list, series([1]), COMPARE), 'INVALID_OBSERVATIONS');
    expectBenchmarkError(() => comparePairedSeeds(series([1]), list, COMPARE), 'INVALID_OBSERVATIONS');
  });

  it.each<[string, unknown]>([
    ['nula', null],
    ['sin serie', { bootstrapSeed: 1 }],
    ['con serie vacía', { seriesId: ' ', bootstrapSeed: 1 }],
    ['sin semilla', { seriesId: 'x' }],
    ['con semilla negativa', { seriesId: 'x', bootstrapSeed: -1 }],
    ['con semilla fuera de uint32', { seriesId: 'x', bootstrapSeed: 2 ** 32 }],
    ['con remuestreos 0', { seriesId: 'x', bootstrapSeed: 1, resamples: 0 }],
    ['con remuestreos decimales', { seriesId: 'x', bootstrapSeed: 1, resamples: 1.5 }],
    ['con remuestreos negativos', { seriesId: 'x', bootstrapSeed: 1, resamples: -5 }],
    ['con remuestreos NaN', { seriesId: 'x', bootstrapSeed: 1, resamples: Number.NaN }],
  ])('rechaza una configuración %s', (_, config) => {
    expectBenchmarkError(() => summarizeSeedValues(series([1]), config as SeedSeriesConfig), 'INVALID_STATS_CONFIG');
  });

  it.each<[string, unknown]>([
    ['sin dirección', { ...SERIES }],
    ['con otra dirección', { ...SERIES, direction: 'mejor' }],
    ['con tolerancia negativa', { ...COMPARE, tieTolerance: -1 }],
    ['con tolerancia NaN', { ...COMPARE, tieTolerance: Number.NaN }],
    ['con tolerancia infinita', { ...COMPARE, tieTolerance: Number.POSITIVE_INFINITY }],
  ])('rechaza una comparación %s', (_, config) => {
    expectBenchmarkError(() => comparePairedSeeds(series([1]), series([1]), config as PairedComparisonConfig), 'INVALID_STATS_CONFIG');
  });

  it('rechaza estadísticas no representables', () => {
    const huge = series([Number.MAX_VALUE, Number.MAX_VALUE]);

    expectBenchmarkError(() => summarizeSeedValues(huge, SERIES), 'NON_FINITE_STATISTIC');
    expectBenchmarkError(() => comparePairedSeeds(series([-Number.MAX_VALUE]), series([Number.MAX_VALUE]), COMPARE), 'NON_FINITE_STATISTIC');
  });
});
