// Persistencia local de la clase. Si lo guardado no es válido se descarta entero.
import { VERSION_CLASE, type Clase } from "./clase.ts";

export const CLAVE_CLASE = "radar.v2.clase";

export type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function almacenDisponible(): KeyValueStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function esClase(valor: unknown): valor is Clase {
  if (typeof valor !== "object" || valor === null) return false;
  const c = valor as Partial<Clase>;
  return c.version === VERSION_CLASE && Array.isArray(c.alumnos) && Array.isArray(c.asignados) && typeof c.intentos === "object" && c.intentos !== null && typeof c.curso === "number";
}

export function cargarClase(almacen: KeyValueStorage | null): Clase | null {
  try {
    const texto = almacen?.getItem(CLAVE_CLASE) ?? null;
    if (texto === null) return null;
    const valor: unknown = JSON.parse(texto);
    return esClase(valor) ? valor : null;
  } catch {
    return null;
  }
}

export function guardarClase(almacen: KeyValueStorage | null, clase: Clase): void {
  try {
    almacen?.setItem(CLAVE_CLASE, JSON.stringify(clase));
  } catch {
    // Sin almacenamiento, los datos duran esta sesión.
  }
}
