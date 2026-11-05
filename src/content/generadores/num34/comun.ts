// Herramientas comunes de los generadores NUM de 3.º y 4.º.
import type { Rng } from "../../../core/rng.ts";
import { CONTABLES, ContenidoError, distractoresNumericos, elegir, muestra, nombres, pregunta, type BorradorPregunta, type Contable, type RespuestaBorrador } from "../../ayuda.ts";
import type { Dificultad, Generador } from "../../tipos.ts";

export type Cuerpo = Omit<BorradorPregunta, "subhabilidad" | "dificultad">;

// Envuelve el cuerpo de una pregunta con su subhabilidad y su dificultad.
export function gen(sub: string, cuerpo: (rng: Rng, d: Dificultad) => Cuerpo): Generador {
  return (rng, dificultad) => pregunta(rng, { subhabilidad: sub, dificultad, ...cuerpo(rng, dificultad) });
}

// Números de cinco o más cifras con espacio duro: 45 302. Con cuatro cifras, sin espacio.
export function grande(n: number): string {
  const texto = String(n);
  return texto.length < 5 ? texto : texto.replace(/\B(?=(\d{3})+$)/g, " ");
}

export function num(valor: number | string): RespuestaBorrador {
  return { tipo: "numero", valor };
}

// Respuesta de opción múltiple con números; `candidatos` son errores típicos.
export function opc(rng: Rng, correcta: number, candidatos: readonly number[], paso = 1, formato: (n: number) => string = grande): RespuestaBorrador {
  const validos = candidatos.filter((c) => Number.isInteger(c) && c > 0);
  return { tipo: "opcion", correcta: formato(correcta), distractores: distractoresNumericos(rng, correcta, validos, 3, paso).map(formato) };
}

export function textos(correcta: string, distractores: readonly string[]): RespuestaBorrador {
  return { tipo: "opcion", correcta, distractores };
}

export function pl(n: number, uno: string, varios: string): string {
  return `${grande(n)} ${n === 1 ? uno : varios}`;
}

export function cuantos(c: Contable): string {
  return `${c.genero === "f" ? "Cuántas" : "Cuántos"} ${c.plural}`;
}

export function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function par<T>(rng: Rng, lista: readonly T[]): [T, T] {
  const [a, b] = muestra(rng, lista, 2);
  if (a === undefined || b === undefined) throw new ContenidoError("Faltan elementos");
  return [a, b];
}

export function trio<T>(rng: Rng, lista: readonly T[]): [T, T, T] {
  const [a, b, c] = muestra(rng, lista, 3);
  if (a === undefined || b === undefined || c === undefined) throw new ContenidoError("Faltan elementos");
  return [a, b, c];
}

export function dosNombres(rng: Rng): [string, string] {
  return par(rng, nombres(rng, 2));
}

export function tresNombres(rng: Rng): [string, string, string] {
  return trio(rng, nombres(rng, 3));
}

export function en<T>(lista: readonly T[], i: number): T {
  const valor = lista[i];
  if (valor === undefined) throw new ContenidoError(`Índice fuera de la lista: ${i}`);
  return valor;
}

export function contablePorId(id: string): Contable {
  const c = CONTABLES.find((x) => x.id === id);
  if (c === undefined) throw new ContenidoError(`Contable desconocido: ${id}`);
  return c;
}

// Cosas que tiene sentido vender, guardar o repartir en un problema.
export const MERCANCIAS: readonly Contable[] = ["manzana", "pera", "naranja", "lapiz", "libro", "cuaderno", "pelota", "flor", "vaso", "botella", "huevo"].map(contablePorId);

export function mercancia(rng: Rng): Contable {
  return elegir(rng, MERCANCIAS);
}

// Artículos de tienda con precio en monedas.
export interface Articulo {
  readonly uno: string; // "un cuaderno"
  readonly nombre: string; // "cuaderno"
  readonly plural: string; // "cuadernos"
  readonly genero: "m" | "f";
}

function articulo(nombre: string, plural: string, genero: "m" | "f"): Articulo {
  return { uno: `${genero === "f" ? "una" : "un"} ${nombre}`, nombre, plural, genero };
}

export const ARTICULOS: readonly Articulo[] = [
  articulo("cuaderno", "cuadernos", "m"), articulo("lápiz", "lápices", "m"), articulo("regla", "reglas", "f"),
  articulo("pelota", "pelotas", "f"), articulo("mochila", "mochilas", "f"), articulo("libro", "libros", "m"),
  articulo("vaso", "vasos", "m"), articulo("taza", "tazas", "f"), articulo("gorro", "gorros", "m"),
  articulo("jabón", "jabones", "m"), articulo("cepillo", "cepillos", "m"), articulo("botella", "botellas", "f"),
];

// Horas: siempre en minutos desde las 0:00 dentro del generador.
export function reloj(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

// "las 7:45", "la 1:05".
export function lasHoras(minutos: number): string {
  const h = Math.floor(minutos / 60);
  return `${h === 1 ? "la" : "las"} ${reloj(minutos)}`;
}

export function horasYMinutos(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pl(h, "hora", "horas")} y ${pl(m, "minuto", "minutos")}`;
}

export function mcd(a: number, b: number): number {
  return b === 0 ? a : mcd(b, a % b);
}

// Número en letras, de 1 a 100 000.
const HASTA_29 = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"] as const;
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"] as const;
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"] as const;

function menorQueMil(n: number): string {
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];
  if (c > 0) partes.push(en(CENTENAS, c));
  if (resto > 0 && resto < 30) partes.push(en(HASTA_29, resto));
  if (resto >= 30) {
    const u = resto % 10;
    partes.push(u === 0 ? en(DECENAS, Math.floor(resto / 10)) : `${en(DECENAS, Math.floor(resto / 10))} y ${en(HASTA_29, u)}`);
  }
  return partes.join(" ");
}

export function enLetras(n: number): string {
  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  if (miles === 0) return menorQueMil(resto);
  const delante = miles === 1 ? "" : `${menorQueMil(miles).replace(/veintiuno$/, "veintiún").replace(/uno$/, "un")} `;
  return `${delante}mil${resto === 0 ? "" : ` ${menorQueMil(resto)}`}`;
}
