// Bloque LEE de 1.º y 2.º de primaria. Generadores en lee12/.
import { generadorDeSituaciones, generadorDeTextos } from "../plantillas.ts";
import type { MapaGeneradores } from "../tipos.ts";
import { CARTEL, CARTELES, ETIQUETA, ETIQUETAS, HORARIO, HORARIOS } from "./lee12/carteles2.ts";
import { GENERADORES_CURSO1 } from "./lee12/curso1.ts";
import { GENERADORES_CURSO2 } from "./lee12/curso2.ts";
import { TEXTOS_CUENTO } from "./lee12/textos1.ts";
import { TEXTOS_BUSCAR, TEXTOS_ORDEN } from "./lee12/textos2.ts";

export const GENERADORES: MapaGeneradores = {
  ...GENERADORES_CURSO1,
  "LEE1-T5-a": [generadorDeTextos("LEE1-T5-a", TEXTOS_CUENTO)],
  "LEE1-T5-b": [generadorDeTextos("LEE1-T5-b", TEXTOS_CUENTO)],
  "LEE1-T5-c": [generadorDeTextos("LEE1-T5-c", TEXTOS_CUENTO)],
  ...GENERADORES_CURSO2,
  "LEE2-T3-a": [generadorDeTextos("LEE2-T3-a", TEXTOS_BUSCAR)],
  "LEE2-T4-a": [generadorDeTextos("LEE2-T4-a", TEXTOS_ORDEN)],
  "LEE2-T4-b": [generadorDeTextos("LEE2-T4-b", TEXTOS_ORDEN)],
  [CARTEL]: [generadorDeSituaciones(CARTEL, CARTELES)],
  [HORARIO]: [generadorDeSituaciones(HORARIO, HORARIOS)],
  [ETIQUETA]: [generadorDeSituaciones(ETIQUETA, ETIQUETAS)],
};
