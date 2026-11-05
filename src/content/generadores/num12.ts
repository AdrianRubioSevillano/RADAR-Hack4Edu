import type { MapaGeneradores } from "../tipos.ts";
import { CURSO1 } from "./num12/curso1.ts";
import { CURSO2 } from "./num12/curso2.ts";

export const GENERADORES: MapaGeneradores = { ...CURSO1, ...CURSO2 };
