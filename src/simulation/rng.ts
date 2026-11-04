import type { GeneratorInfo, SimulationErrorCode, UniformStream } from './types.ts';

export class SimulationError extends Error {
  readonly code: SimulationErrorCode;

  constructor(code: SimulationErrorCode, message: string) {
    super(message);
    this.name = 'SimulationError';
    this.code = code;
  }
}

export const GENERATOR: GeneratorInfo = Object.freeze({ algorithm: 'mulberry32', version: 1 });

// Flujos separados de §2.7. Cada uno se subdivide con etiquetas como `population/S01`.
export const STREAMS = Object.freeze({
  population: 'population',
  responses: 'responses',
  randomOrder: 'randomOrder',
  intervention: 'intervention',
  bootstrap: 'bootstrap',
});

const MAX_SEED = 0xffffffff;
const UINT32_RANGE = 2 ** 32;

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export function assertValidSeed(seed: number): void {
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) {
    throw new SimulationError('INVALID_SEED', `La semilla debe ser un entero uint32: ${String(seed)}`);
  }
}

export function mulberry32(seed: number): UniformStream {
  assertValidSeed(seed);
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

// Finalizador de MurmurHash3: dispersa semillas y etiquetas parecidas.
function finalize(hash: number): number {
  let mixed = hash ^ (hash >>> 16);
  mixed = Math.imul(mixed, 0x85ebca6b);
  mixed ^= mixed >>> 13;
  mixed = Math.imul(mixed, 0xc2b2ae35);
  return (mixed ^ (mixed >>> 16)) >>> 0;
}

// FNV-1a de los bytes UTF-8 de la etiqueta, con la semilla mezclada en el valor
// inicial, y finalizador. Para una etiqueta fija, semillas distintas dan semillas
// de flujo distintas. Dos etiquetas pueden colisionar: son 32 bits.
export function deriveStreamSeed(seed: number, label: string): number {
  assertValidSeed(seed);
  if (typeof label !== 'string' || label === '') {
    throw new SimulationError('INVALID_STREAM_LABEL', 'La etiqueta del flujo debe ser un texto no vacío');
  }
  const hash = new TextEncoder()
    .encode(label)
    .reduce((current, byte) => Math.imul(current ^ byte, FNV_PRIME), seed ^ FNV_OFFSET);
  return finalize(hash);
}

// Cada flujo depende solo de la semilla y de su etiqueta: consumir otro flujo no
// lo altera.
export function createStream(seed: number, label: string): UniformStream {
  return mulberry32(deriveStreamSeed(seed, label));
}
