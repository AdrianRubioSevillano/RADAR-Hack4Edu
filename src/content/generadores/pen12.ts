// Bloque PEN de 1.º y 2.º: 21 subhabilidades.
import type { MapaGeneradores } from "../tipos.ts";
import { GENERADORES_CLASES } from "./pen12/clases.ts";
import { GENERADORES_PRIMERO } from "./pen12/primero.ts";
import { GENERADORES_SEGUNDO } from "./pen12/segundo.ts";
import { GENERADORES_SERIES } from "./pen12/series.ts";

export const GENERADORES: MapaGeneradores = {
  ...GENERADORES_SERIES,
  ...GENERADORES_CLASES,
  ...GENERADORES_PRIMERO,
  ...GENERADORES_SEGUNDO,
};
