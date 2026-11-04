import { GENERATOR, STREAMS, createStream } from '../simulation/index.ts';
import { BenchmarkError } from './metrics.ts';
import type {
  BootstrapProvenance,
  ConfidenceInterval,
  ExcludedPair,
  ImprovementDirection,
  PairExclusionReason,
  PairedComparison,
  PairedComparisonConfig,
  PairedDifference,
  SeedObservation,
  SeedSeriesConfig,
  SeedSeriesSummary,
  SeedStatisticsWarning,
} from './types.ts';

// 2000 remuestreos: SUPUESTO (§2.9).
const DEFAULT_RESAMPLES = 2000;
const CONFIDENCE_LEVEL = 0.95;
const LOWER_QUANTILE = 0.025;
const UPPER_QUANTILE = 0.975;

const DEFAULT_TIE_TOLERANCE = 1e-12;

const MAX_SEED = 0xffffffff;

const DISCLAIMER =
  'El intervalo describe la variabilidad entre semillas de esta simulación, con datos sintéticos: ' +
  'no es prueba de eficacia educativa ni garantía de superioridad.';

function configError(message: string): BenchmarkError {
  return new BenchmarkError('INVALID_STATS_CONFIG', message);
}

function observationError(message: string): BenchmarkError {
  return new BenchmarkError('INVALID_OBSERVATIONS', message);
}

function isUint32(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_SEED;
}

function finiteStatistic(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new BenchmarkError('NON_FINITE_STATISTIC', `${label} no es representable: ${value}`);
  }
  return value;
}

// Por semilla: el orden de entrada no decide ninguna suma ni el remuestreo.
function sortedObservations(observations: readonly SeedObservation[]): readonly SeedObservation[] {
  if (!Array.isArray(observations)) {
    throw observationError('Las observaciones deben ser una lista');
  }
  const seeds = new Set<number>();
  const normalized = (observations as readonly SeedObservation[]).map((observation) => {
    if (typeof observation !== 'object' || observation === null || !isUint32(observation.seed)) {
      throw observationError('Cada observación necesita una semilla uint32');
    }
    const { seed, value } = observation;
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) {
      throw observationError(`El valor de la semilla ${seed} debe ser finito o null`);
    }
    if (seeds.has(seed)) {
      throw observationError(`Semilla repetida: ${seed}`);
    }
    seeds.add(seed);
    return { seed: seed >>> 0, value };
  });
  return normalized.sort((a, b) => a.seed - b.seed);
}

interface EffectiveSeriesConfig {
  readonly seriesId: string;
  readonly bootstrapSeed: number;
  readonly resamples: number;
}

function effectiveSeriesConfig(config: SeedSeriesConfig): EffectiveSeriesConfig {
  if (typeof config !== 'object' || config === null) {
    throw configError('La configuración no tiene la forma esperada');
  }
  const { seriesId, bootstrapSeed, resamples = DEFAULT_RESAMPLES } = config;
  if (typeof seriesId !== 'string' || seriesId.trim() === '') {
    throw configError('seriesId debe ser un texto no vacío');
  }
  if (!isUint32(bootstrapSeed)) {
    throw configError('bootstrapSeed debe ser un entero uint32');
  }
  if (!Number.isSafeInteger(resamples) || resamples <= 0) {
    throw configError('resamples debe ser un entero positivo');
  }
  return { seriesId, bootstrapSeed: bootstrapSeed >>> 0, resamples };
}

function streamLabelOf(seriesId: string): string {
  return `${STREAMS.bootstrap}/${JSON.stringify([seriesId])}`;
}

function meanOf(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleDeviation(values: readonly number[], mean: number): number {
  const squares = values.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  return Math.sqrt(squares / (values.length - 1));
}

// Cada índice elige una semilla completa, con reemplazo. Un solo flujo por serie,
// consumido por remuestra y posición.
export function bootstrapMeans(values: readonly number[], config: EffectiveSeriesConfig): readonly number[] {
  const stream = createStream(config.bootstrapSeed, streamLabelOf(config.seriesId));
  const size = values.length;
  return Array.from({ length: config.resamples }, () => {
    let sum = 0;
    for (let drawn = 0; drawn < size; drawn += 1) {
      sum += values[Math.min(Math.floor(stream() * size), size - 1)] ?? Number.NaN;
    }
    return sum / size;
  });
}

// Interpolación lineal en la posición (m - 1)·q de los valores ordenados.
export function percentile(sorted: readonly number[], quantile: number): number {
  const position = (sorted.length - 1) * quantile;
  const below = Math.floor(position);
  const lower = sorted[below] ?? Number.NaN;
  const upper = sorted[Math.min(below + 1, sorted.length - 1)] ?? Number.NaN;
  return lower + (position - below) * (upper - lower);
}

function intervalOf(values: readonly number[], config: EffectiveSeriesConfig): ConfidenceInterval {
  const means = [...bootstrapMeans(values, config)].sort((a, b) => a - b);
  return {
    lower: finiteStatistic(percentile(means, LOWER_QUANTILE), 'El límite inferior'),
    upper: finiteStatistic(percentile(means, UPPER_QUANTILE), 'El límite superior'),
  };
}

function provenanceOf(config: EffectiveSeriesConfig, resampleSize: number): BootstrapProvenance {
  return {
    method: 'percentile',
    statistic: 'mean',
    unit: 'seed',
    generator: { ...GENERATOR },
    bootstrapSeed: config.bootstrapSeed,
    seriesId: config.seriesId,
    streamLabel: streamLabelOf(config.seriesId),
    resamples: config.resamples,
    resampleSize,
    confidenceLevel: CONFIDENCE_LEVEL,
    lowerQuantile: LOWER_QUANTILE,
    upperQuantile: UPPER_QUANTILE,
  };
}

function warningsFor(validCount: number): readonly SeedStatisticsWarning[] {
  if (validCount === 0) {
    return [{ code: 'NO_VALID_VALUES', message: 'No hay valores válidos: media, desviación e intervalo son null.' }];
  }
  if (validCount === 1) {
    return [
      {
        code: 'SINGLE_VALID_VALUE',
        message: 'Solo hay un valor válido: el intervalo es degenerado y no informa sobre la variabilidad.',
      },
    ];
  }
  return [];
}

function summaryOf(observations: readonly SeedObservation[], config: EffectiveSeriesConfig): SeedSeriesSummary {
  const values = observations.flatMap((observation) => (observation.value === null ? [] : [observation.value]));
  const hasValues = values.length > 0;
  const mean = hasValues ? finiteStatistic(meanOf(values), 'La media') : null;
  return {
    totalCount: observations.length,
    validCount: values.length,
    excludedSeeds: observations.filter((observation) => observation.value === null).map((observation) => observation.seed),
    mean,
    standardDeviation:
      mean === null || values.length < 2 ? null : finiteStatistic(sampleDeviation(values, mean), 'La desviación típica'),
    confidenceInterval: hasValues ? intervalOf(values, config) : null,
    bootstrap: provenanceOf(config, values.length),
    warnings: warningsFor(values.length),
  };
}

export function summarizeSeedValues(observations: readonly SeedObservation[], config: SeedSeriesConfig): SeedSeriesSummary {
  const effective = effectiveSeriesConfig(config);
  return summaryOf(sortedObservations(observations), effective);
}

function isDirection(value: unknown): value is ImprovementDirection {
  return value === 'lowerIsBetter' || value === 'higherIsBetter';
}

function exclusionReason(a: SeedObservation | undefined, b: SeedObservation | undefined): PairExclusionReason | null {
  if (a === undefined) return 'missingInA';
  if (b === undefined) return 'missingInB';
  if (a.value === null) return b.value === null ? 'nullInBoth' : 'nullInA';
  return b.value === null ? 'nullInB' : null;
}

interface Pairing {
  readonly pairs: readonly PairedDifference[];
  readonly excludedPairs: readonly ExcludedPair[];
}

function pairingOf(a: readonly SeedObservation[], b: readonly SeedObservation[]): Pairing {
  const byA = new Map(a.map((observation) => [observation.seed, observation]));
  const byB = new Map(b.map((observation) => [observation.seed, observation]));
  const seeds = [...new Set([...byA.keys(), ...byB.keys()])].sort((x, y) => x - y);

  const pairs: PairedDifference[] = [];
  const excludedPairs: ExcludedPair[] = [];
  for (const seed of seeds) {
    const fromA = byA.get(seed);
    const fromB = byB.get(seed);
    const reason = exclusionReason(fromA, fromB);
    if (reason !== null) {
      excludedPairs.push({ seed, reason });
    } else if (typeof fromA?.value === 'number' && typeof fromB?.value === 'number') {
      const difference = finiteStatistic(fromB.value - fromA.value, `La diferencia de la semilla ${seed}`);
      pairs.push({ seed, a: fromA.value, b: fromB.value, difference });
    }
  }
  return { pairs, excludedPairs };
}

export function comparePairedSeeds(
  methodA: readonly SeedObservation[],
  methodB: readonly SeedObservation[],
  config: PairedComparisonConfig,
): PairedComparison {
  const effective = effectiveSeriesConfig(config);
  const { direction, tieTolerance = DEFAULT_TIE_TOLERANCE } = config;
  if (!isDirection(direction)) {
    throw configError('direction debe ser lowerIsBetter o higherIsBetter');
  }
  if (typeof tieTolerance !== 'number' || !Number.isFinite(tieTolerance) || tieTolerance < 0) {
    throw configError('tieTolerance debe ser finita y no negativa');
  }

  const { pairs, excludedPairs } = pairingOf(sortedObservations(methodA), sortedObservations(methodB));
  const isTied = (pair: PairedDifference): boolean => Math.abs(pair.difference) <= tieTolerance;
  const isImproved = (pair: PairedDifference): boolean =>
    !isTied(pair) && (direction === 'lowerIsBetter' ? pair.difference < 0 : pair.difference > 0);
  const tiedCount = pairs.filter(isTied).length;
  const improvedCount = pairs.filter(isImproved).length;

  return {
    direction,
    tieTolerance,
    pairCount: pairs.length,
    pairs,
    excludedPairs,
    differences: summaryOf(
      pairs.map((pair) => ({ seed: pair.seed, value: pair.difference })),
      effective,
    ),
    improvedCount,
    tiedCount,
    worsenedCount: pairs.length - tiedCount - improvedCount,
    disclaimer: DISCLAIMER,
  };
}
