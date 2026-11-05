// Bloque LEE de 6.º de primaria. Los datos están en lee6/.
import { generadorDeTextos, type TextoEscrito } from "../plantillas.ts";
import type { Generador, MapaGeneradores } from "../tipos.ts";
import { TEXTOS_ARGUMENTOS } from "./lee6/argumentos.ts";
import { TEXTOS_COMPARAR } from "./lee6/comparar.ts";
import { TEXTOS_NORMAS, TEXTOS_PROSPECTOS } from "./lee6/documentos.ts";
import { TEXTOS_PROPOSITO } from "./lee6/proposito.ts";
import { generadorRecibos } from "./lee6/recibos.ts";
import { TEXTOS_RUMORES } from "./lee6/rumores.ts";

function deTextos(sub: string, textos: readonly TextoEscrito[]): readonly Generador[] {
  return [generadorDeTextos(sub, textos)];
}

export const GENERADORES: MapaGeneradores = {
  "LEE6-T1-a": deTextos("LEE6-T1-a", TEXTOS_COMPARAR),
  "LEE6-T1-b": deTextos("LEE6-T1-b", TEXTOS_COMPARAR),
  "LEE6-T2-a": deTextos("LEE6-T2-a", TEXTOS_PROPOSITO),
  "LEE6-T3-a": deTextos("LEE6-T3-a", TEXTOS_RUMORES),
  "LEE6-T3-b": deTextos("LEE6-T3-b", TEXTOS_RUMORES),
  "LEE6-T4-a": deTextos("LEE6-T4-a", TEXTOS_ARGUMENTOS),
  "LEE6-T4-b": deTextos("LEE6-T4-b", TEXTOS_ARGUMENTOS),
  "LEE6-T5-a": [generadorRecibos],
  "LEE6-T5-b": deTextos("LEE6-T5-b", TEXTOS_PROSPECTOS),
  "LEE6-T5-c": deTextos("LEE6-T5-c", TEXTOS_NORMAS),
};
