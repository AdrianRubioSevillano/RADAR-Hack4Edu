// Herramientas compartidas por los generadores NUM de 5.º y 6.º.
// El dinero y los decimales se calculan en centésimas enteras: sin ruido de coma flotante.
import type { Rng } from "../../../core/rng.ts";
import { ContenidoError, distractoresNumericos, elegir, monedas, muestra, pregunta, type BorradorPregunta, type RespuestaBorrador } from "../../ayuda.ts";
import type { Dificultad, Generador } from "../../tipos.ts";

export type Cuerpo = Omit<BorradorPregunta, "subhabilidad" | "dificultad">;
export type Plantilla = (rng: Rng, d: Dificultad) => Cuerpo;

export function generadores(sub: string, plantillas: readonly Plantilla[]): readonly Generador[] {
  return plantillas.map((f) => (rng, dificultad) => pregunta(rng, { subhabilidad: sub, dificultad, ...f(rng, dificultad) }));
}

export function porNivel<T>(d: Dificultad, facil: T, media: T, dificil: T): T {
  return d === 1 ? facil : d === 2 ? media : dificil;
}

export function par<T>(rng: Rng, lista: readonly T[]): [T, T] {
  return muestra(rng, lista, 2) as [T, T];
}

export function trio<T>(rng: Rng, lista: readonly T[]): [T, T, T] {
  return muestra(rng, lista, 3) as [T, T, T];
}

export function cuarteto<T>(rng: Rng, lista: readonly T[]): [T, T, T, T] {
  return muestra(rng, lista, 4) as [T, T, T, T];
}

export function rango(desde: number, hasta: number, paso = 1): number[] {
  const salida: number[] = [];
  for (let v = desde; v <= hasta; v += paso) salida.push(v);
  return salida;
}

export function mcd(a: number, b: number): number {
  return b === 0 ? a : mcd(b, a % b);
}

export function mayus(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ---------- Decimales en centésimas ----------
function partes(c: number): { entera: number; resto: string } {
  if (!Number.isInteger(c) || c < 0) throw new ContenidoError(`Centésimas no válidas: ${c}`);
  return { entera: Math.floor(c / 100), resto: String(c % 100).padStart(2, "0") };
}

// 347 -> "3,47"; 350 -> "3,5"; 300 -> "3". Es la forma canónica de las respuestas.
export function conComa(c: number): string {
  const { entera, resto } = partes(c);
  const sinCeros = resto.replace(/0+$/, "");
  return sinCeros === "" ? String(entera) : `${entera},${sinCeros}`;
}

// 350 -> "3,50"; 300 -> "3,00".
export function dosCifras(c: number): string {
  const { entera, resto } = partes(c);
  return `${entera},${resto}`;
}

// Para cuentas de dinero: 350 -> "3,50"; 300 -> "3".
export function cifras(c: number): string {
  return c % 100 === 0 ? conComa(c) : dosCifras(c);
}

// 350 -> "3,50 monedas"; 300 -> "3 monedas"; 100 -> "1 moneda".
export function dinero(c: number): string {
  return c % 100 === 0 ? monedas(c / 100) : monedas(dosCifras(c));
}

// ---------- Respuestas ----------
export function numero(valor: string | number): RespuestaBorrador {
  return { tipo: "numero", valor };
}

export function opciones(correcta: string, distractores: readonly string[]): RespuestaBorrador {
  return { tipo: "opcion", correcta, distractores };
}

// Distractores positivos: los candidatos son errores típicos y el resto se rellena cerca.
export function errores(rng: Rng, correcta: number, candidatos: readonly number[], paso = 1, n = 3): number[] {
  const validos = candidatos.filter((v) => Number.isInteger(v) && v > 0);
  return distractoresNumericos(rng, correcta, validos, n + 1, paso).filter((v) => v > 0).slice(0, n);
}

export function opcionesNumero(rng: Rng, correcta: number, candidatos: readonly number[], texto: (n: number) => string = String, paso = 1): RespuestaBorrador {
  return opciones(texto(correcta), errores(rng, correcta, candidatos, paso).map(texto));
}

export function opcionesDinero(rng: Rng, correcta: number, candidatos: readonly number[], paso = 50): RespuestaBorrador {
  return opcionesNumero(rng, correcta, candidatos, dinero, paso);
}

// ---------- Objetos de la vida diaria ----------
export interface Articulo {
  readonly nombre: string;
  readonly un: string;
  readonly el: string;
  readonly plural: string;
  readonly genero: "m" | "f";
}

function articulo(genero: "m" | "f", nombre: string, plural: string): Articulo {
  return { nombre, un: `${genero === "m" ? "un" : "una"} ${nombre}`, el: `${genero === "m" ? "el" : "la"} ${nombre}`, plural, genero };
}

export const BARATOS: readonly Articulo[] = [
  articulo("m", "cuaderno", "cuadernos"),
  articulo("m", "lápiz", "lápices"),
  articulo("f", "regla", "reglas"),
  articulo("f", "goma de borrar", "gomas de borrar"),
  articulo("m", "bolígrafo", "bolígrafos"),
  articulo("m", "jabón", "jabones"),
  articulo("f", "taza", "tazas"),
  articulo("m", "vaso", "vasos"),
  articulo("f", "caja de colores", "cajas de colores"),
  articulo("f", "vela", "velas"),
];

export const CAROS: readonly Articulo[] = [
  articulo("f", "mochila", "mochilas"),
  articulo("m", "balón", "balones"),
  articulo("f", "camiseta", "camisetas"),
  articulo("f", "linterna", "linternas"),
  articulo("f", "manta", "mantas"),
  articulo("f", "radio", "radios"),
  articulo("m", "cubo", "cubos"),
  articulo("f", "cuerda", "cuerdas"),
  articulo("m", "pantalón", "pantalones"),
  articulo("f", "lámpara", "lámparas"),
];

export function articuloBarato(rng: Rng): Articulo {
  return elegir(rng, BARATOS);
}

export function articuloCaro(rng: Rng): Articulo {
  return elegir(rng, CAROS);
}

// ---------- Unidades de medida ----------
export interface Escala {
  readonly grande: string; // metros
  readonly pequena: string; // centímetros
  readonly g: string; // m
  readonly p: string; // cm
  readonly factor: number;
}

export const LONGITUD_M_CM: Escala = { grande: "metros", pequena: "centímetros", g: "m", p: "cm", factor: 100 };
export const LONGITUD_KM_M: Escala = { grande: "kilómetros", pequena: "metros", g: "km", p: "m", factor: 1000 };
export const MASA_KG_G: Escala = { grande: "kilogramos", pequena: "gramos", g: "kg", p: "g", factor: 1000 };
export const CAPACIDAD_L_ML: Escala = { grande: "litros", pequena: "mililitros", g: "l", p: "ml", factor: 1000 };

// Valor exacto de `cantidad` (entero, en la unidad pequeña) en la unidad grande, con coma.
export function enGrande(cantidad: number, e: Escala): string {
  const centesimas = (cantidad * 100) / e.factor;
  if (Number.isInteger(centesimas)) return conComa(centesimas);
  throw new ContenidoError(`Conversión sin dos decimales exactos: ${cantidad}`);
}

// ---------- Tiempo ----------
export function hora(minutos: number): string {
  return `${Math.floor(minutos / 60)}:${String(minutos % 60).padStart(2, "0")}`;
}

export function duracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
