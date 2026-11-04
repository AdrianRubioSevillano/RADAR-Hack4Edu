// DINA para K habilidades variables. Un estado α es un índice 0 … 2^K − 1: el bit k
// indica si domina la habilidad k. Se reutiliza la lógica probada de v1 (engine/dina.ts).
import { MotorError, type Item } from "./tipos.ts";

export const K_MAXIMO = 8;

export function assertK(k: number): void {
  if (!Number.isInteger(k) || k < 1 || k > K_MAXIMO) {
    throw new MotorError("K_INVALIDO", `K debe ser un entero entre 1 y ${K_MAXIMO}: ${String(k)}`);
  }
}

export function numeroEstados(k: number): number {
  assertK(k);
  return 2 ** k;
}

export function assertItem(item: Item, k: number): void {
  const { slip, guess, requiere } = item;
  if (!Number.isFinite(slip) || !Number.isFinite(guess) || !(0 < guess && guess < 1 - slip && 1 - slip < 1)) {
    throw new MotorError("PARAMETROS_INVALIDOS", `slip y guess incumplen 0 < guess < 1 − slip < 1 en ${item.id}`);
  }
  if (requiere.length === 0 || requiere.some((h) => !Number.isInteger(h) || h < 0 || h >= k)) {
    throw new MotorError("REQUISITOS_INVALIDOS", `Habilidades requeridas inválidas en ${item.id}`);
  }
}

export function mascara(requiere: readonly number[]): number {
  return requiere.reduce((m, h) => m | (1 << h), 0);
}

// P(Y = r | α). El fallo usa slip directamente: 1 − (1 − slip) perdería precisión.
export function probabilidadRespuesta(estado: number, mask: number, slip: number, guess: number, acierto: boolean): number {
  const dominaTodas = (estado & mask) === mask;
  if (acierto) return dominaTodas ? 1 - slip : guess;
  return dominaTodas ? slip : 1 - guess;
}
