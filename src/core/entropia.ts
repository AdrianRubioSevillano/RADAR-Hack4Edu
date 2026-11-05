import { MotorError, type Conjunta } from "./tipos.ts";

// −p·log2(p), con 0·log(0) = 0.
function termino(p: number): number {
  return p === 0 ? 0 : -p * Math.log2(p);
}

export function entropiaBinaria(p: number): number {
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new MotorError("PROBABILIDAD_INVALIDA", `Probabilidad inválida: ${String(p)}`);
  return termino(p) + termino(1 - p);
}

export function entropiaConjunta(conjunta: Conjunta): number {
  return conjunta.reduce((suma, masa) => suma + termino(masa), 0);
}
