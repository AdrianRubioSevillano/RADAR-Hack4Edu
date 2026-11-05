// El idioma es del dispositivo, no de la clase: «Restablecer demo» no lo cambia.
import { IDIOMA_DEFECTO, esIdioma, type Idioma } from "../i18n/index.ts";
import type { KeyValueStorage } from "./almacen.ts";

export const CLAVE_IDIOMA = "radar.v2.idioma";

export function cargarIdioma(almacen: KeyValueStorage | null): Idioma {
  try {
    const guardado = almacen?.getItem(CLAVE_IDIOMA);
    return esIdioma(guardado) ? guardado : IDIOMA_DEFECTO;
  } catch {
    return IDIOMA_DEFECTO;
  }
}

export function guardarIdioma(almacen: KeyValueStorage | null, idioma: Idioma): void {
  try {
    almacen?.setItem(CLAVE_IDIOMA, idioma);
  } catch {
    // Sin almacenamiento, el idioma dura esta sesión.
  }
}
