// Atajo para escribir las preguntas de LEE 5.º en una sola llamada.
import type { PreguntaEscrita } from "../../plantillas.ts";
import type { Dificultad } from "../../tipos.ts";

export function p(
  sub: string,
  dificultad: Dificultad,
  enunciado: string,
  enunciadoFacil: string,
  correcta: string,
  distractores: readonly string[],
  pista: string,
  explicacion: string,
): PreguntaEscrita {
  return { sub, dificultad, enunciado, enunciadoFacil, correcta, distractores, pista, explicacion };
}
