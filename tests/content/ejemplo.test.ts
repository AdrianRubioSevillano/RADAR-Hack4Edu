import { comprobarGeneradores } from "./arnes.ts";
import { entero, pregunta, distractoresNumericos } from "../../src/content/ayuda.ts";
import type { Generador, MapaGeneradores } from "../../src/content/tipos.ts";

// Ejemplo del contrato: un generador calculado con su oráculo.
const sumarSinImagenes: Generador = (rng, dificultad) => {
  const tope = dificultad === 1 ? 10 : dificultad === 2 ? 15 : 20;
  const a = entero(rng, 1, tope - 1);
  const b = entero(rng, 1, tope - a);
  const correcta = a + b;
  return pregunta(rng, {
    subhabilidad: "NUM1-T3-b",
    dificultad,
    enunciado: `¿Cuánto es ${a} + ${b}?`,
    enunciadoFacil: `Suma ${a} y ${b}.`,
    respuesta: { tipo: "opcion", correcta: String(correcta), distractores: distractoresNumericos(rng, correcta, [correcta + 1, correcta - 1, a, b], 3).map(String) },
    pista: "Cuenta hacia delante desde el número más grande.",
    explicacion: `${a} más ${b} son ${correcta}.`,
  });
};
const mapa: MapaGeneradores = { "NUM1-T3-b": [sumarSinImagenes] };

comprobarGeneradores("ejemplo", mapa, ["NUM1-T3-b"], {
  "NUM1-T3-b": (p) => {
    const m = /(\d+) \+ (\d+)/.exec(p.enunciado);
    return String(Number(m?.[1]) + Number(m?.[2]));
  },
});
