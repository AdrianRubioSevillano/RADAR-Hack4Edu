import { MotorError, type Color } from "./tipos.ts";

export interface Umbrales {
  readonly verde: number;
  readonly rojo: number;
  readonly minimoRespuestas: number;
}

// SUPUESTO: umbrales configurables, no calibrados con datos reales (CLAUDE.md §2).
export const UMBRALES: Umbrales = { verde: 0.7, rojo: 0.3, minimoRespuestas: 2 };

export function colorSemaforo(p: number, respuestas: number, umbrales: Umbrales = UMBRALES): Color {
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new MotorError("PROBABILIDAD_INVALIDA", `Probabilidad inválida: ${String(p)}`);
  if (respuestas < umbrales.minimoRespuestas) return "amarillo";
  if (p >= umbrales.verde) return "verde";
  if (p <= umbrales.rojo) return "rojo";
  return "amarillo";
}
