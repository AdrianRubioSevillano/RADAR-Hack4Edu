// Utilidades comunes del bloque PEN de 3.º y 4.º.
import type { Rng } from "../../../core/rng.ts";
import { ContenidoError, elegir, pregunta, type BorradorPregunta } from "../../ayuda.ts";
import type { Situacion } from "../../plantillas.ts";
import type { Dificultad, Generador } from "../../tipos.ts";

export type Contenido = Omit<BorradorPregunta, "subhabilidad" | "dificultad" | "plantilla">;

export interface Plantilla {
  readonly clave: string;
  readonly dificultades: readonly Dificultad[];
  readonly crear: (rng: Rng, d: Dificultad) => Contenido;
}

export const TODAS: readonly Dificultad[] = [1, 2, 3];

// Elige una plantilla de esa dificultad. La clave de plantilla agrupa preguntas casi iguales.
export function generadorDePlantillas(sub: string, plantillas: readonly Plantilla[]): Generador {
  return (rng, dificultad) => {
    const candidatas = plantillas.filter((p) => p.dificultades.includes(dificultad));
    if (candidatas.length === 0) throw new ContenidoError(`Sin plantillas de dificultad ${dificultad} en ${sub}`);
    const elegida = elegir(rng, candidatas);
    return pregunta(rng, { ...elegida.crear(rng, dificultad), subhabilidad: sub, dificultad, plantilla: `${sub}/${elegida.clave}/${dificultad}` });
  };
}

// Reintenta hasta encontrar un caso válido: así la unicidad se comprueba, no se supone.
export function buscar<T>(crear: () => T | null, intentos = 20000): T {
  for (let i = 0; i < intentos; i += 1) {
    const valor = crear();
    if (valor !== null) return valor;
  }
  throw new ContenidoError("No se encontró un caso válido");
}

export function en<T>(lista: readonly T[], i: number): T {
  const valor = lista[i];
  if (valor === undefined) throw new ContenidoError(`Índice fuera de la lista: ${i}`);
  return valor;
}

export function mayus(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "a, b y c".
export function enumerar(partes: readonly string[]): string {
  if (partes.length < 2) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${en(partes, partes.length - 1)}`;
}

export function minutos(n: number): string {
  return `${n} ${n === 1 ? "minuto" : "minutos"}`;
}

export function semanas(n: number): string {
  return `${n} ${n === 1 ? "semana" : "semanas"}`;
}

// 510 -> "8:30".
export function hora(total: number): string {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

// Escritura compacta de situaciones: d dificultad, e enunciado, f enunciado fácil,
// c correcta, x distractores, p pista, ex explicación.
export interface SituacionCorta {
  readonly d: Dificultad;
  readonly e: string;
  readonly f: string;
  readonly c: string;
  readonly x: readonly string[];
  readonly p: string;
  readonly ex: string;
}

export function situaciones(sub: string, lista: readonly SituacionCorta[]): Situacion[] {
  return lista.map((s, i) => ({
    id: `${sub}-s${i + 1}`,
    sub,
    dificultad: s.d,
    enunciado: s.e,
    enunciadoFacil: s.f,
    correcta: s.c,
    distractores: s.x,
    pista: s.p,
    explicacion: s.ex,
  }));
}
