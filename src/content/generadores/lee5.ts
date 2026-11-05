// LEE 5.º: textos de 110–150 palabras, escritos para RADAR, con sus preguntas.
import { generadorDeTextos, type TextoEscrito } from "../plantillas.ts";
import type { MapaGeneradores } from "../tipos.ts";
import { TEXTOS_T1 } from "./lee5/t1.ts";
import { TEXTOS_T2 } from "./lee5/t2.ts";
import { TEXTOS_T3 } from "./lee5/t3.ts";
import { TEXTOS_T4 } from "./lee5/t4.ts";
import { TEXTOS_T5 } from "./lee5/t5.ts";

export const TEXTOS_LEE5: Readonly<Record<string, readonly TextoEscrito[]>> = {
  "LEE5-T1": TEXTOS_T1,
  "LEE5-T2": TEXTOS_T2,
  "LEE5-T3": TEXTOS_T3,
  "LEE5-T4": TEXTOS_T4,
  "LEE5-T5": TEXTOS_T5,
};

const SUBHABILIDADES_POR_TEMA: Readonly<Record<string, readonly string[]>> = {
  "LEE5-T1": ["a", "b"],
  "LEE5-T2": ["a", "b"],
  "LEE5-T3": ["a", "b"],
  "LEE5-T4": ["a", "b"],
  "LEE5-T5": ["a", "b", "c"],
};

export const GENERADORES: MapaGeneradores = Object.fromEntries(
  Object.entries(SUBHABILIDADES_POR_TEMA).flatMap(([tema, letras]) =>
    letras.map((letra) => {
      const id = `${tema}-${letra}`;
      return [id, [generadorDeTextos(id, TEXTOS_LEE5[tema] ?? [])]];
    }),
  ),
);
