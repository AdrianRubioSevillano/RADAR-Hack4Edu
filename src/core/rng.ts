// PRNG con semilla. Toda la aleatoriedad del motor y del contenido pasa por aquí.
// Algoritmo mulberry32 y derivación por etiqueta, heredados de v1 (simulation/rng.ts).

export class RngError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RngError";
  }
}

// `semilla` es la semilla raíz de la que se deriva el flujo: permite que todas las
// preguntas de un mismo test compartan, por ejemplo, los nombres de un texto.
export interface Rng {
  (): number;
  readonly semilla: number;
}

const MAX_SEED = 0xffffffff;
const UINT32_RANGE = 2 ** 32;
const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function assertValidSeed(seed: number): void {
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) {
    throw new RngError(`La semilla debe ser un entero uint32: ${String(seed)}`);
  }
}

function mulberry32(seed: number): () => number {
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

// FNV-1a de los bytes UTF-8 de la etiqueta, con la semilla en el valor inicial.
export function derivarSemilla(seed: number, label: string): number {
  assertValidSeed(seed);
  if (label === "") throw new RngError("La etiqueta del flujo no puede estar vacía");
  const hash = new TextEncoder()
    .encode(label)
    .reduce((current, byte) => Math.imul(current ^ byte, FNV_PRIME), seed ^ FNV_OFFSET);
  return finalize(hash);
}

export function crearRng(seed: number): Rng {
  assertValidSeed(seed);
  return Object.assign(mulberry32(seed), { semilla: seed });
}

// Flujo independiente: depende de la semilla y de la etiqueta, y conserva la raíz.
export function flujo(seed: number, label: string): Rng {
  return Object.assign(mulberry32(derivarSemilla(seed, label)), { semilla: seed });
}

// Hash estable de un texto, para ids y semillas.
export function hashTexto(texto: string): string {
  return derivarSemilla(0, texto === "" ? "vacio" : texto).toString(36);
}
