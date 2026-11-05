import { GENERADORES as lee12 } from "./lee12.ts";
import { GENERADORES_LEE2_FR } from "./lee12/fr2.ts";
import { GENERADORES as lee34 } from "./lee34.ts";
import { GENERADORES as lee5 } from "./lee5.ts";
import { GENERADORES as lee6 } from "./lee6.ts";
import { GENERADORES as num12 } from "./num12.ts";
import { GENERADORES as num34 } from "./num34.ts";
import { GENERADORES as num56 } from "./num56.ts";
import { GENERADORES as pen12 } from "./pen12.ts";
import { GENERADORES_PEN2_FR } from "./pen12/fr2.ts";
import { GENERADORES as pen34 } from "./pen34.ts";
import { GENERADORES as pen56 } from "./pen56.ts";
import type { MapaGeneradores } from "../tipos.ts";

export const GENERADORES: MapaGeneradores = {
  ...num12, ...num34, ...num56, ...lee12, ...lee34, ...lee5, ...lee6, ...pen12, ...pen34, ...pen56,
};

// Generadores con datos propios en francés. Los de NUM2 no están aquí: son los mismos
// que en español y eligen el texto con `tx`.
export const GENERADORES_FR: MapaGeneradores = { ...GENERADORES_LEE2_FR, ...GENERADORES_PEN2_FR };
