// Generadores a partir de datos escritos: textos con sus preguntas (LEE) y
// situaciones (PEN). Variables: {F1} {F2} {F3} nombres femeninos; {M1} {M2} {M3}
// masculinos; {N1} {N2} {N3} nombres sin concordancia de género en la frase.
// Los nombres dependen de la semilla raíz y del texto: todas las preguntas sobre un
// mismo texto en un mismo test comparten nombres, y otra semilla da otros.
import { flujo, type Rng } from "../core/rng.ts";
import { ContenidoError, NOMBRES, NOMBRES_F, NOMBRES_M, elegir, muestra, pregunta, type RespuestaBorrador } from "./ayuda.ts";
import type { Dificultad, Generador, Imagen } from "./tipos.ts";

export interface PreguntaEscrita {
  readonly sub: string; // id completo: LEE3-T2-a
  readonly dificultad: Dificultad;
  readonly enunciado: string;
  readonly enunciadoFacil: string;
  readonly correcta: string;
  readonly distractores: readonly string[]; // 2 o 3
  readonly pista: string;
  readonly explicacion: string;
  readonly imagen?: Imagen;
}

export interface TextoEscrito {
  readonly id: string; // único: LEE3-T2-tx1
  readonly titulo?: string;
  readonly texto: string;
  readonly imagen?: Imagen;
  readonly preguntas: readonly PreguntaEscrita[];
}

// Una situación es una pregunta sin texto común: el enunciado se basta solo.
export type Situacion = Omit<PreguntaEscrita, "sub"> & { readonly id: string; readonly sub: string };

type Sustitucion = (texto: string) => string;

function sustitucion(rng: Rng, clave: string): Sustitucion {
  const r = flujo(rng.semilla, `nombres/${clave}`);
  const f: readonly string[] = muestra(r, NOMBRES_F, 3);
  const m: readonly string[] = muestra(r, NOMBRES_M, 3);
  const libres = NOMBRES.filter((x: string) => !f.includes(x) && !m.includes(x));
  const n: readonly string[] = muestra(r, libres, 3);
  const valores: Record<string, string> = {
    F1: f[0] ?? "", F2: f[1] ?? "", F3: f[2] ?? "",
    M1: m[0] ?? "", M2: m[1] ?? "", M3: m[2] ?? "",
    N1: n[0] ?? "", N2: n[1] ?? "", N3: n[2] ?? "",
  };
  return (texto) => texto.replace(/\{([FMN][123])\}/g, (_, clave2: string) => valores[clave2] ?? "");
}

function respuestaDe(p: PreguntaEscrita, s: Sustitucion): RespuestaBorrador {
  return { tipo: "opcion", correcta: s(p.correcta), distractores: p.distractores.map(s) };
}

function sustituirImagen(imagen: Imagen | undefined, s: Sustitucion): Imagen | undefined {
  if (imagen === undefined) return undefined;
  return JSON.parse(s(JSON.stringify(imagen))) as Imagen;
}

// Generador de una subhabilidad a partir de textos.
export function generadorDeTextos(subId: string, textos: readonly TextoEscrito[]): Generador {
  const items = textos.flatMap((texto) =>
    texto.preguntas.map((p, indice) => ({ texto, p, indice })).filter(({ p }) => p.sub === subId),
  );
  if (items.length === 0) throw new ContenidoError(`Sin preguntas para ${subId}`);
  return (rng, dificultad) => {
    const candidatos = items.filter(({ p }) => p.dificultad === dificultad);
    if (candidatos.length === 0) throw new ContenidoError(`Sin dificultad ${dificultad} en ${subId}`);
    const { texto, p, indice } = elegir(rng, candidatos);
    const s = sustitucion(rng, texto.id);
    const imagen = sustituirImagen(p.imagen ?? texto.imagen, s);
    return pregunta(rng, {
      subhabilidad: subId,
      dificultad,
      enunciado: s(p.enunciado),
      enunciadoFacil: s(p.enunciadoFacil),
      texto: s(texto.texto),
      ...(texto.titulo === undefined ? {} : { titulo: s(texto.titulo) }),
      ...(imagen === undefined ? {} : { imagen }),
      respuesta: respuestaDe(p, s),
      pista: s(p.pista),
      explicacion: s(p.explicacion),
      plantilla: `${texto.id}#${indice}`,
    });
  };
}

// Generador de una subhabilidad a partir de situaciones sueltas.
export function generadorDeSituaciones(subId: string, situaciones: readonly Situacion[]): Generador {
  const items = situaciones.filter((p) => p.sub === subId);
  if (items.length === 0) throw new ContenidoError(`Sin situaciones para ${subId}`);
  return (rng, dificultad) => {
    const candidatos = items.filter((p) => p.dificultad === dificultad);
    if (candidatos.length === 0) throw new ContenidoError(`Sin dificultad ${dificultad} en ${subId}`);
    const p = elegir(rng, candidatos);
    const s = sustitucion(rng, p.id);
    const imagen = sustituirImagen(p.imagen, s);
    return pregunta(rng, {
      subhabilidad: subId,
      dificultad,
      enunciado: s(p.enunciado),
      enunciadoFacil: s(p.enunciadoFacil),
      ...(imagen === undefined ? {} : { imagen }),
      respuesta: respuestaDe(p, s),
      pista: s(p.pista),
      explicacion: s(p.explicacion),
      plantilla: p.id,
    });
  };
}
