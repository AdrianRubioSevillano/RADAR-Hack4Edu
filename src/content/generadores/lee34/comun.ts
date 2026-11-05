// Atajos para escribir los textos de LEE 3.º y 4.º sin repetir nombres de campo.
import type { PreguntaEscrita } from "../../plantillas.ts";
import type { Dificultad, Imagen, ObjetoId } from "../../tipos.ts";

export type Escritor = (
  dificultad: Dificultad,
  enunciado: string,
  enunciadoFacil: string,
  correcta: string,
  distractores: readonly string[],
  pista: string,
  explicacion: string,
) => PreguntaEscrita;

export function preguntasDe(sub: string): Escritor {
  return (dificultad, enunciado, enunciadoFacil, correcta, distractores, pista, explicacion) => ({
    sub, dificultad, enunciado, enunciadoFacil, correcta, distractores, pista, explicacion,
  });
}

export function dibujo(objeto: ObjetoId): Imagen {
  return { tipo: "objeto", objeto };
}
