// LEE 3.º y 4.º. Los textos y sus preguntas están en lee34/; aquí se registran.
import { generadorDeTextos, type TextoEscrito } from "../plantillas.ts";
import type { Generador, MapaGeneradores } from "../tipos.ts";
import { TEXTOS_4_T1, TEXTOS_4_T2 } from "./lee34/cuarto12.ts";
import { TEXTOS_4_T3, TEXTOS_4_T4, TEXTOS_4_T5 } from "./lee34/cuarto345.ts";
import { familiaDePalabras } from "./lee34/familias.ts";
import { TEXTOS_3_T1, TEXTOS_3_T2 } from "./lee34/tercero12.ts";
import { TEXTOS_3_T3, TEXTOS_3_T4, TEXTOS_3_T5 } from "./lee34/tercero345.ts";

export const TEXTOS_LEE3: readonly TextoEscrito[] = [...TEXTOS_3_T1, ...TEXTOS_3_T2, ...TEXTOS_3_T3, ...TEXTOS_3_T4, ...TEXTOS_3_T5];
export const TEXTOS_LEE4: readonly TextoEscrito[] = [...TEXTOS_4_T1, ...TEXTOS_4_T2, ...TEXTOS_4_T3, ...TEXTOS_4_T4, ...TEXTOS_4_T5];

const TEXTOS = [...TEXTOS_LEE3, ...TEXTOS_LEE4];
const subs = [...new Set(TEXTOS.flatMap((t) => t.preguntas.map((p) => p.sub)))];

const deTextos: Record<string, readonly Generador[]> = Object.fromEntries(subs.map((sub) => [sub, [generadorDeTextos(sub, TEXTOS)]]));

export const GENERADORES: MapaGeneradores = { ...deTextos, "LEE3-T1-b": [familiaDePalabras] };
