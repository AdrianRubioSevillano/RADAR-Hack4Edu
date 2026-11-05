// Generadores NUM de 3.º y 4.º de primaria.
import type { MapaGeneradores } from "../tipos.ts";
import { GENERADORES_3A } from "./num34/curso3a.ts";
import { GENERADORES_3B } from "./num34/curso3b.ts";
import { GENERADORES_4A } from "./num34/curso4a.ts";
import { GENERADORES_4B } from "./num34/curso4b.ts";

export const GENERADORES: MapaGeneradores = { ...GENERADORES_3A, ...GENERADORES_3B, ...GENERADORES_4A, ...GENERADORES_4B };
