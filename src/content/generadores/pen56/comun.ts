// Utilidades compartidas por los generadores PEN de 5.º y 6.º.
import { ContenidoError, elegir } from "../../ayuda.ts";
import type { Dificultad, Generador, Imagen } from "../../tipos.ts";

export function en<T>(lista: readonly T[], i: number): T {
  const valor = lista[i];
  if (valor === undefined) throw new ContenidoError(`Índice fuera de rango: ${i}`);
  return valor;
}

export function capital(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "y" pasa a "e" ante sonido i; "o" pasa a "u" ante sonido o.
function nexo(conjuncion: "y" | "o", siguiente: string): string {
  const inicio = siguiente.toLowerCase();
  if (conjuncion === "y") return /^(i|í|hi)/.test(inicio) && !/^hie/.test(inicio) ? "e" : "y";
  return /^(o|ó|ho)/.test(inicio) ? "u" : "o";
}

export function unir(lista: readonly string[], conjuncion: "y" | "o" = "y"): string {
  if (lista.length < 2) return lista.join("");
  const ultimo = en(lista, lista.length - 1);
  return `${lista.slice(0, -1).join(", ")} ${nexo(conjuncion, ultimo)} ${ultimo}`;
}

export function permutaciones<T>(lista: readonly T[]): T[][] {
  if (lista.length <= 1) return [[...lista]];
  return lista.flatMap((x, i) => permutaciones([...lista.slice(0, i), ...lista.slice(i + 1)]).map((resto) => [x, ...resto]));
}

// Elige un generador según la dificultad pedida.
export function porDificultad(tabla: Readonly<Record<Dificultad, readonly Generador[]>>): Generador {
  return (rng, dificultad) => elegir(rng, tabla[dificultad])(rng, dificultad);
}

export function cartelPistas(lineas: readonly string[], titulo = "Pistas"): Imagen {
  return { tipo: "cartel", estilo: "nota", titulo, lineas };
}

// Repite el sorteo hasta que `crear` devuelve un valor. El azar sigue siendo el del rng.
export function reintentar<T>(crear: () => T | null, intentos = 2000): T {
  for (let i = 0; i < intentos; i += 1) {
    const valor = crear();
    if (valor !== null) return valor;
  }
  throw new ContenidoError("No se encontró un caso válido");
}

export function mcd(a: number, b: number): number {
  return b === 0 ? a : mcd(b, a % b);
}
