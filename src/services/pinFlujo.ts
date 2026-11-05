// Flujo de la pantalla del PIN como función pura: crear, repetir o escribir.
import type { Clave } from "../i18n/index.ts";

export interface EstadoPin {
  readonly modo: "crear" | "escribir";
  readonly digitos: string;
  readonly primero: string | null; // PIN ya escrito una vez, al crearlo
  readonly mensaje: Clave | null;
}

export type EventoPin =
  | { readonly tipo: "digito"; readonly digito: string }
  | { readonly tipo: "borrar" }
  | { readonly tipo: "incorrecto" };

export type AccionPin = { readonly tipo: "guardar" | "comprobar"; readonly pin: string } | null;

export function estadoInicialPin(hayPin: boolean): EstadoPin {
  return { modo: hayPin ? "escribir" : "crear", digitos: "", primero: null, mensaje: null };
}

export function pasoPin(estado: EstadoPin, evento: EventoPin): { readonly estado: EstadoPin; readonly accion: AccionPin } {
  if (evento.tipo === "incorrecto") {
    return { estado: { ...estado, digitos: "", mensaje: "pin.incorrecto" }, accion: null };
  }
  if (evento.tipo === "borrar") {
    return { estado: { ...estado, digitos: estado.digitos.slice(0, -1) }, accion: null };
  }
  if (!/^\d$/.test(evento.digito) || estado.digitos.length >= 4) return { estado, accion: null };

  const digitos = estado.digitos + evento.digito;
  if (digitos.length < 4) return { estado: { ...estado, digitos, mensaje: null }, accion: null };
  if (estado.modo === "escribir") return { estado: { ...estado, digitos, mensaje: null }, accion: { tipo: "comprobar", pin: digitos } };
  if (estado.primero === null) return { estado: { ...estado, digitos: "", primero: digitos, mensaje: null }, accion: null };
  if (estado.primero === digitos) return { estado: { ...estado, digitos, mensaje: null }, accion: { tipo: "guardar", pin: digitos } };
  return { estado: { ...estado, digitos: "", primero: null, mensaje: "pin.noCoinciden" }, accion: null };
}

// Traduce una tecla física. Vale también el teclado numérico, que da el mismo `key`.
export function eventoDeTecla(tecla: string): EventoPin | null {
  if (/^\d$/.test(tecla)) return { tipo: "digito", digito: tecla };
  return tecla === "Backspace" ? { tipo: "borrar" } : null;
}
