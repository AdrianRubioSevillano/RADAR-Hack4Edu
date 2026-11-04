import { describe, expect, it } from 'vitest';
import { GENERATOR, STREAMS, SimulationError, createStream, deriveStreamSeed, mulberry32 } from '../../src/simulation/index.ts';
import type { SimulationErrorCode, UniformStream } from '../../src/simulation/index.ts';

const MAX_SEED = 2 ** 32 - 1;

function take(stream: UniformStream, count: number): readonly number[] {
  return Array.from({ length: count }, () => stream());
}

function expectSimulationError(action: () => unknown, code: SimulationErrorCode): void {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(SimulationError);
  expect(caught).toMatchObject({ name: 'SimulationError', code });
}

describe('mulberry32', () => {
  // Vectores de una réplica independiente en Python.
  it.each<[number, readonly number[]]>([
    [0, [0.26642920868471265, 0.0003297457005828619, 0.2232720274478197, 0.1462021479383111]],
    [1, [0.6270739405881613, 0.002735721180215478, 0.5274470399599522, 0.9810509674716741]],
    [42, [0.6011037519201636, 0.44829055899754167, 0.8524657934904099, 0.6697340414393693]],
    [MAX_SEED, [0.8964226141106337, 0.189478256739676, 0.7156526781618595, 0.9440599093213677]],
  ])('semilla %d: coincide con la secuencia de referencia', (seed, expected) => {
    expect(take(mulberry32(seed), 4)).toEqual(expected);
  });

  it.each([0, 1, 42, MAX_SEED])('semilla %d: uniformes en [0, 1)', (seed) => {
    for (const value of take(mulberry32(seed), 20000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('la misma semilla repite la secuencia y otra la cambia', () => {
    expect(take(mulberry32(7), 100)).toEqual(take(mulberry32(7), 100));
    expect(take(mulberry32(7), 100)).not.toEqual(take(mulberry32(8), 100));
  });
});

describe('derivación de flujos', () => {
  // Valores de una réplica independiente en Python: fijan la versión del generador.
  it.each<[number, string, number]>([
    [0, 'population', 2178344859],
    [42, 'population', 3388097724],
    [42, 'responses', 1694569941],
    [42, 'population/S01', 232078098],
    [MAX_SEED, 'ñ/β', 3082640413],
  ])('semilla %d y etiqueta %s', (seed, label, expected) => {
    expect(deriveStreamSeed(seed, label)).toBe(expected);
  });

  it('declara algoritmo y versión', () => {
    expect(GENERATOR).toEqual({ algorithm: 'mulberry32', version: 1 });
  });

  it('los flujos de §2.7 tienen semillas distintas', () => {
    const labels = Object.values(STREAMS);

    expect(labels).toHaveLength(5);
    expect(new Set(labels.map((label) => deriveStreamSeed(42, label))).size).toBe(5);
  });

  it('para una etiqueta fija, semillas distintas dan flujos distintos', () => {
    const seeds = Array.from({ length: 5000 }, (_, seed) => deriveStreamSeed(seed, STREAMS.population));

    expect(new Set(seeds).size).toBe(5000);
  });

  it('el consumo de un flujo no altera otro', () => {
    const alone = take(createStream(9, STREAMS.responses), 50);

    const population = createStream(9, STREAMS.population);
    const responses = createStream(9, STREAMS.responses);
    const interleaved = Array.from({ length: 50 }, () => {
      take(population, 3);
      return responses();
    });

    expect(interleaved).toEqual(alone);
  });

  it('el orden de creación de los flujos no altera sus valores', () => {
    const labels = Object.values(STREAMS);
    const forward = new Map(labels.map((label) => [label, take(createStream(3, label), 10)]));
    const backward = new Map([...labels].reverse().map((label) => [label, take(createStream(3, label), 10)]));

    expect(Object.fromEntries(backward)).toEqual(Object.fromEntries(forward));
  });
});

describe('validación', () => {
  it.each<[string, unknown]>([
    ['negativa', -1],
    ['fuera de uint32', 2 ** 32],
    ['decimal', 1.5],
    ['NaN', Number.NaN],
    ['infinita', Number.POSITIVE_INFINITY],
    ['de texto', '1'],
    ['nula', null],
  ])('rechaza una semilla %s', (_, seed) => {
    expectSimulationError(() => mulberry32(seed as number), 'INVALID_SEED');
    expectSimulationError(() => deriveStreamSeed(seed as number, 'population'), 'INVALID_SEED');
    expectSimulationError(() => createStream(seed as number, 'population'), 'INVALID_SEED');
  });

  it.each<[string, unknown]>([
    ['vacía', ''],
    ['nula', null],
    ['numérica', 1],
  ])('rechaza una etiqueta %s', (_, label) => {
    expectSimulationError(() => deriveStreamSeed(1, label as string), 'INVALID_STREAM_LABEL');
  });

  it('acepta los extremos de uint32', () => {
    expect(() => createStream(0, 'x')).not.toThrow();
    expect(() => createStream(MAX_SEED, 'x')).not.toThrow();
  });
});
