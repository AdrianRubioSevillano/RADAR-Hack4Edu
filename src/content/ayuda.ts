// Herramientas para escribir generadores. Sin Math.random: todo usa el rng recibido.
import { hashTexto, type Rng } from "../core/rng.ts";
import type { Dificultad, Imagen, ObjetoId, Opcion, Pregunta } from "./tipos.ts";

export class ContenidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContenidoError";
  }
}

// ---------- Azar ----------
export function entero(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function elegir<T>(rng: Rng, lista: readonly T[]): T {
  const valor = lista[Math.floor(rng() * lista.length)];
  if (valor === undefined) throw new ContenidoError("Lista vacía");
  return valor;
}

export function barajar<T>(rng: Rng, lista: readonly T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = copia[i] as T;
    copia[i] = copia[j] as T;
    copia[j] = a;
  }
  return copia;
}

export function muestra<T>(rng: Rng, lista: readonly T[], n: number): T[] {
  if (n > lista.length) throw new ContenidoError("Muestra mayor que la lista");
  return barajar(rng, lista).slice(0, n);
}

// ---------- Nombres y objetos neutros ----------
export const NOMBRES_F = ["Amina", "Carla", "Elena", "Gabriela", "Imani", "Keiko", "Lucía", "Nadia", "Paula", "Rosa", "Uma", "Valeria", "Yara", "Zoe", "Ana", "Mei", "Sara", "Laila", "Noa", "Tala"] as const;
export const NOMBRES_M = ["Bruno", "Diego", "Farid", "Hugo", "Jorge", "Kofi", "Luis", "Malik", "Omar", "Pedro", "Samuel", "Tomás", "Wei", "Yusuf", "Adán", "Ravi", "Iván", "Teo", "Nico", "Sami"] as const;
export const NOMBRES = [...NOMBRES_F, ...NOMBRES_M] as const;

export function nombre(rng: Rng): string {
  return elegir(rng, NOMBRES);
}

export function nombres(rng: Rng, n: number): string[] {
  return muestra(rng, NOMBRES, n);
}

export interface Contable {
  readonly id: ObjetoId;
  readonly singular: string;
  readonly plural: string;
  readonly genero: "m" | "f";
}

export const CONTABLES: readonly Contable[] = [
  { id: "manzana", singular: "manzana", plural: "manzanas", genero: "f" },
  { id: "pera", singular: "pera", plural: "peras", genero: "f" },
  { id: "naranja", singular: "naranja", plural: "naranjas", genero: "f" },
  { id: "lapiz", singular: "lápiz", plural: "lápices", genero: "m" },
  { id: "libro", singular: "libro", plural: "libros", genero: "m" },
  { id: "cuaderno", singular: "cuaderno", plural: "cuadernos", genero: "m" },
  { id: "pelota", singular: "pelota", plural: "pelotas", genero: "f" },
  { id: "flor", singular: "flor", plural: "flores", genero: "f" },
  { id: "estrella", singular: "estrella", plural: "estrellas", genero: "f" },
  { id: "pez", singular: "pez", plural: "peces", genero: "m" },
  { id: "pajaro", singular: "pájaro", plural: "pájaros", genero: "m" },
  { id: "mariposa", singular: "mariposa", plural: "mariposas", genero: "f" },
  { id: "vaso", singular: "vaso", plural: "vasos", genero: "m" },
  { id: "botella", singular: "botella", plural: "botellas", genero: "f" },
  { id: "huevo", singular: "huevo", plural: "huevos", genero: "m" },
  { id: "caja", singular: "caja", plural: "cajas", genero: "f" },
];

export function contable(rng: Rng): Contable {
  return elegir(rng, CONTABLES);
}

// "1 manzana", "3 manzanas".
export function cantidad(n: number, objeto: Contable): string {
  return `${n} ${n === 1 ? objeto.singular : objeto.plural}`;
}

// "1 moneda", "12 monedas". El dinero siempre va en monedas genéricas.
export function monedas(n: number | string): string {
  return `${String(n)} ${n === 1 || n === "1" ? "moneda" : "monedas"}`;
}

// ---------- Números ----------
// Decimales con coma: 3.5 -> "3,5". Corrige el ruido de coma flotante.
export function decimal(valor: number, decimales?: number): string {
  const redondeado = Number(valor.toFixed(decimales ?? 6));
  const texto = decimales === undefined ? String(redondeado) : redondeado.toFixed(decimales);
  return texto.replace(".", ",");
}

// Completa una lista de distractores numéricos: quita duplicados, la correcta y los
// negativos, y rellena con valores cercanos hasta tener `n`.
export function distractoresNumericos(rng: Rng, correcta: number, candidatos: readonly number[], n = 3, paso = 1): number[] {
  const salida: number[] = [];
  const anadir = (valor: number) => {
    if (valor !== correcta && valor >= 0 && !salida.includes(valor) && salida.length < n) salida.push(valor);
  };
  barajar(rng, candidatos).forEach(anadir);
  for (let d = 1; salida.length < n && d < 1000; d += 1) {
    const signos = rng() < 0.5 ? [d, -d] : [-d, d];
    signos.forEach((s) => anadir(correcta + s * paso));
  }
  return salida;
}

// ---------- Crear una pregunta ----------
export type RespuestaBorrador =
  | { readonly tipo: "numero"; readonly valor: string | number }
  | { readonly tipo: "opcion"; readonly correcta: string; readonly distractores: readonly string[] }
  | {
      readonly tipo: "imagen";
      readonly correcta: { readonly texto: string; readonly imagen: Imagen };
      readonly distractores: readonly { readonly texto: string; readonly imagen: Imagen }[];
    };

export interface BorradorPregunta {
  readonly subhabilidad: string;
  readonly dificultad: Dificultad;
  readonly enunciado: string;
  readonly enunciadoFacil: string;
  readonly texto?: string;
  readonly titulo?: string;
  readonly imagen?: Imagen;
  readonly respuesta: RespuestaBorrador;
  readonly pista: string;
  readonly explicacion: string;
  readonly plantilla?: string;
}

// SUPUESTO: parámetros no calibrados con datos reales. El slip crece con la dificultad.
export const SLIP_POR_DIFICULTAD: Readonly<Record<Dificultad, number>> = { 1: 0.08, 2: 0.12, 3: 0.16 };
// SUPUESTO: probabilidad de acertar por azar una respuesta abierta.
export const GUESS_ABIERTA = 0.05;

const IDS = ["a", "b", "c", "d"] as const;

function construirOpciones(rng: Rng, respuesta: Exclude<RespuestaBorrador, { tipo: "numero" }>): { opciones: Opcion[]; correcta: string } {
  const todas: { texto: string; imagen?: Imagen; ok: boolean }[] =
    respuesta.tipo === "opcion"
      ? [{ texto: respuesta.correcta, ok: true }, ...respuesta.distractores.map((texto) => ({ texto, ok: false }))]
      : [{ ...respuesta.correcta, ok: true }, ...respuesta.distractores.map((d) => ({ ...d, ok: false }))];
  if (todas.length < 3 || todas.length > 4) throw new ContenidoError(`Debe haber 3 o 4 opciones y hay ${todas.length}`);
  const textos = todas.map((o) => o.texto.trim().toLowerCase());
  if (new Set(textos).size !== textos.length) throw new ContenidoError(`Opciones duplicadas: ${textos.join(" | ")}`);
  const barajadas = barajar(rng, todas);
  const opciones = barajadas.map((o, i): Opcion => {
    const id = IDS[i] as string;
    return o.imagen === undefined ? { id, texto: o.texto } : { id, texto: o.texto, imagen: o.imagen };
  });
  const posicion = barajadas.findIndex((o) => o.ok);
  return { opciones, correcta: IDS[posicion] as string };
}

function huella(b: BorradorPregunta): string {
  const r = b.respuesta;
  const respuesta =
    r.tipo === "numero"
      ? String(r.valor)
      : r.tipo === "opcion"
        ? [r.correcta, ...[...r.distractores].sort()].join("|")
        : [r.correcta.texto, ...r.distractores.map((d) => d.texto).sort()].join("|");
  return [b.enunciado, b.texto ?? "", JSON.stringify(b.imagen ?? null), respuesta].join("§");
}

export function pregunta(rng: Rng, b: BorradorPregunta): Pregunta {
  const id = `${b.subhabilidad}:${hashTexto(huella(b))}`;
  const base = {
    id,
    subhabilidad: b.subhabilidad,
    dificultad: b.dificultad,
    enunciado: b.enunciado,
    enunciadoFacil: b.enunciadoFacil,
    pista: b.pista,
    explicacion: b.explicacion,
    slip: SLIP_POR_DIFICULTAD[b.dificultad],
    ...(b.texto === undefined ? {} : { texto: b.texto }),
    ...(b.titulo === undefined ? {} : { titulo: b.titulo }),
    ...(b.imagen === undefined ? {} : { imagen: b.imagen }),
    ...(b.plantilla === undefined ? {} : { plantilla: b.plantilla }),
  };
  if (b.respuesta.tipo === "numero") {
    return { ...base, formato: "numero", respuestaCorrecta: String(b.respuesta.valor), guess: GUESS_ABIERTA };
  }
  const { opciones, correcta } = construirOpciones(rng, b.respuesta);
  return { ...base, formato: b.respuesta.tipo, opciones, respuestaCorrecta: correcta, guess: 1 / opciones.length };
}
