// Bloque PEN de 3.º y 4.º. Los datos y la lógica de cada tema están en ./pen34/.
import type { MapaGeneradores } from "../tipos.ts";
import { GENERADORES_AHORRO4 } from "./pen34/ahorro4.ts";
import { GENERADORES_COMPARAR3 } from "./pen34/comparar3.ts";
import { GENERADORES_CONVIVENCIA3 } from "./pen34/convivencia3.ts";
import { GENERADORES_DATOS4 } from "./pen34/datos4.ts";
import { GENERADORES_DEDUCCION4 } from "./pen34/deduccion4.ts";
import { GENERADORES_EQUIPO4 } from "./pen34/equipo4.ts";
import { GENERADORES_HORARIO3 } from "./pen34/horario3.ts";
import { GENERADORES_LOGICA3 } from "./pen34/logica3.ts";
import { GENERADORES_PROBLEMAS3 } from "./pen34/problemas3.ts";

export const GENERADORES: MapaGeneradores = {
  ...GENERADORES_LOGICA3,
  ...GENERADORES_PROBLEMAS3,
  ...GENERADORES_COMPARAR3,
  ...GENERADORES_HORARIO3,
  ...GENERADORES_CONVIVENCIA3,
  ...GENERADORES_DEDUCCION4,
  ...GENERADORES_AHORRO4,
  ...GENERADORES_DATOS4,
  ...GENERADORES_EQUIPO4,
};
