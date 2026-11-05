// PEN de 5.º y 6.º: situaciones escritas y problemas calculados en código.
import { generadorDeSituaciones } from "../plantillas.ts";
import type { Generador, MapaGeneradores } from "../tipos.ts";
import { GENERADOR_AHORRO, GENERADOR_COMPARAR, GENERADOR_PLAZOS, GENERADOR_PRIORIDAD, GENERADORES_LIMITE } from "./pen56/dinero.ts";
import { GENERADORES_LOGICA } from "./pen56/logica.ts";
import { GENERADOR_PROBABLE, GENERADOR_RIESGO } from "./pen56/probabilidad.ts";
import { GENERADOR_PASOS, GENERADOR_RECURSOS, GENERADOR_TIEMPO } from "./pen56/proyectos.ts";
import { SITUACIONES_5 } from "./pen56/situaciones5.ts";
import { SITUACIONES_6 } from "./pen56/situaciones6.ts";

const SITUACIONES = [...SITUACIONES_5, ...SITUACIONES_6];
const escrito = (sub: string): Generador => generadorDeSituaciones(sub, SITUACIONES);

export const GENERADORES_CALCULADOS: MapaGeneradores = {
  "PEN5-T1-a": GENERADORES_LOGICA["PEN5-T1-a"],
  "PEN5-T1-b": GENERADORES_LOGICA["PEN5-T1-b"],
  "PEN5-T2-a": [GENERADORES_LIMITE],
  "PEN5-T2-b": [GENERADOR_PRIORIDAD],
  "PEN6-T1-b": [GENERADOR_RECURSOS],
  "PEN6-T1-c": [GENERADOR_TIEMPO],
  "PEN6-T2-a": [GENERADOR_PLAZOS],
  "PEN6-T2-b": [GENERADOR_COMPARAR],
  "PEN6-T2-c": [GENERADOR_AHORRO],
  "PEN6-T3-a": [GENERADOR_PROBABLE],
  "PEN6-T3-b": [GENERADOR_RIESGO],
};

export const GENERADORES: MapaGeneradores = {
  ...GENERADORES_CALCULADOS,
  "PEN5-T2-b": [GENERADOR_PRIORIDAD, escrito("PEN5-T2-b")],
  "PEN5-T3-a": [escrito("PEN5-T3-a")],
  "PEN5-T3-b": [escrito("PEN5-T3-b")],
  "PEN5-T4-a": [escrito("PEN5-T4-a")],
  "PEN5-T4-b": [escrito("PEN5-T4-b")],
  "PEN5-T5-a": [escrito("PEN5-T5-a")],
  "PEN5-T5-b": [escrito("PEN5-T5-b")],
  "PEN6-T1-a": [GENERADOR_PASOS],
  "PEN6-T3-b": [GENERADOR_RIESGO, escrito("PEN6-T3-b")],
  "PEN6-T4-a": [escrito("PEN6-T4-a")],
  "PEN6-T4-b": [escrito("PEN6-T4-b")],
  "PEN6-T5-a": [escrito("PEN6-T5-a")],
  "PEN6-T5-b": [escrito("PEN6-T5-b")],
  "PEN6-T5-c": [escrito("PEN6-T5-c")],
};
