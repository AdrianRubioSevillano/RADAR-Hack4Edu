import { QUINTO_A } from "./num56/curso5a.ts";
import { QUINTO_B } from "./num56/curso5b.ts";
import { SEXTO_A } from "./num56/curso6a.ts";
import { SEXTO_B } from "./num56/curso6b.ts";
import type { MapaGeneradores } from "../tipos.ts";

export const GENERADORES: MapaGeneradores = { ...QUINTO_A, ...QUINTO_B, ...SEXTO_A, ...SEXTO_B };
