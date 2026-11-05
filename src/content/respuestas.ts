// Comprobar lo que responde el niño. Los números se comparan como fracciones exactas.
import type { Pregunta } from "./tipos.ts";

interface Fraccion {
  readonly n: bigint;
  readonly d: bigint;
}

// Admite "45", "3,5", "3.5" y "3/4", con espacios alrededor. Lo demás no es un número.
export function leerNumero(texto: string): Fraccion | null {
  const limpio = texto.trim().replace(".", ",");
  const entero = /^(\d+)$/.exec(limpio);
  if (entero !== null) return { n: BigInt(entero[1] as string), d: 1n };
  const decimal = /^(\d+),(\d+)$/.exec(limpio);
  if (decimal !== null) {
    const parte = decimal[2] as string;
    return { n: BigInt(`${decimal[1] as string}${parte}`), d: 10n ** BigInt(parte.length) };
  }
  const fraccion = /^(\d+)\/(\d+)$/.exec(limpio);
  if (fraccion !== null) {
    const d = BigInt(fraccion[2] as string);
    return d === 0n ? null : { n: BigInt(fraccion[1] as string), d };
  }
  return null;
}

export function esCorrecta(p: Pregunta, respuesta: string): boolean {
  if (p.formato !== "numero") return respuesta === p.respuestaCorrecta;
  const dada = leerNumero(respuesta);
  const correcta = leerNumero(p.respuestaCorrecta);
  return dada !== null && correcta !== null && dada.n * correcta.d === correcta.n * dada.d;
}

export function textoRespuesta(p: Pregunta): string {
  if (p.formato === "numero") return p.respuestaCorrecta;
  return p.opciones?.find((o) => o.id === p.respuestaCorrecta)?.texto ?? "";
}

// Lo que se lee en voz alta: la lectura, el enunciado y las opciones de texto. Las
// etiquetas de las opciones de imagen no se leen: dirían lo que hay que descubrir mirando.
export function textoParaEscuchar(p: Pregunta, facil: boolean): string {
  const opciones = p.formato !== "opcion" ? "" : (p.opciones?.map((o, i) => `Opción ${i + 1}: ${o.texto}.`).join(" ") ?? "");
  return [p.titulo, p.texto, facil ? p.enunciadoFacil : p.enunciado, opciones].filter((t) => t !== undefined && t !== "").join(". ");
}
