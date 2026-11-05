// Bancos de preguntas: candidatas de un test, ejercicios de refuerzo y el puente
// entre una Pregunta y el Item que entiende el motor.
import { PATRON_MINITEST, PATRON_PAQUETE, crearSerie } from "../core/refuerzo.ts";
import { flujo, type Rng } from "../core/rng.ts";
import type { Item } from "../core/tipos.ts";
import { elegir } from "./ayuda.ts";
import { GENERADORES, GENERADORES_FR } from "./generadores/index.ts";
import { conLengua, type Lengua } from "./lengua.ts";
import type { DefinicionTest } from "./tests.ts";
import type { Dificultad, Generador, Imagen, Pregunta } from "./tipos.ts";

// Unas 30 candidatas por test (CLAUDE.md §4).
const OBJETIVO_BANCO = 30;
const INTENTOS_POR_HUECO = 30;
const DIFICULTADES: readonly Dificultad[] = [1, 2, 3];

export function generadoresDe(subId: string, lengua: Lengua = "es"): readonly Generador[] {
  return (lengua === "fr" ? GENERADORES_FR[subId] : undefined) ?? GENERADORES[subId] ?? [];
}

// Por ahora, en francés solo está el Ciclo II. Lo demás sigue en español.
export function lenguaDe(subId: string, idioma: string): Lengua {
  return idioma === "fr" && /^(NUM|LEE|PEN)2-/.test(subId) ? "fr" : "es";
}

// «de Amina» -> «d'Amina»: los nombres entran en la frase al generarla.
function elidir(texto: string): string {
  return texto.replace(/\b([DdJj])e (?=[AEIOUÉ][a-zéí])/g, "$1'").replace(/\b([Qq]u)e (?=[AEIOUÉ][a-zéí])/g, "$1'");
}

const imagenElidida = (imagen: Imagen): Imagen => JSON.parse(elidir(JSON.stringify(imagen))) as Imagen;

function enFrances(p: Pregunta): Pregunta {
  return {
    ...p,
    idioma: "fr",
    enunciado: elidir(p.enunciado),
    enunciadoFacil: elidir(p.enunciadoFacil),
    pista: elidir(p.pista),
    explicacion: elidir(p.explicacion),
    ...(p.texto === undefined ? {} : { texto: elidir(p.texto) }),
    ...(p.titulo === undefined ? {} : { titulo: elidir(p.titulo) }),
    ...(p.imagen === undefined ? {} : { imagen: imagenElidida(p.imagen) }),
    ...(p.opciones === undefined ? {} : { opciones: p.opciones.map((o) => ({ ...o, texto: elidir(o.texto), ...(o.imagen === undefined ? {} : { imagen: imagenElidida(o.imagen) }) })) }),
  };
}

// La lengua se pide con `idioma`; si la subhabilidad aún no está traducida, sale en español.
export function generarPregunta(subId: string, rng: Rng, dificultad: Dificultad, idioma: string = "es"): Pregunta {
  const lengua = lenguaDe(subId, idioma);
  const p = conLengua(lengua, () => elegir(rng, generadoresDe(subId, lengua))(rng, dificultad));
  return lengua === "fr" ? enFrances(p) : p;
}

export function subhabilidadDe(preguntaId: string): string {
  return preguntaId.split(":")[0] ?? preguntaId;
}

export function bancoDeTest(test: DefinicionTest, semilla: number, idioma: string = "es"): readonly Pregunta[] {
  const elegidas = new Map<string, Pregunta>();
  const plantillas = new Set<string>();
  const porHabilidad = Math.ceil(OBJETIVO_BANCO / test.habilidades.length);

  const anadir = (p: Pregunta, permitirPlantilla: boolean): boolean => {
    if (elegidas.has(p.id)) return false;
    if (!permitirPlantilla && p.plantilla !== undefined && plantillas.has(p.plantilla)) return false;
    elegidas.set(p.id, p);
    if (p.plantilla !== undefined) plantillas.add(p.plantilla);
    return true;
  };

  for (const habilidad of test.habilidades) {
    for (let hueco = 0; hueco < porHabilidad; hueco += 1) {
      const sub = habilidad.subhabilidades[hueco % habilidad.subhabilidades.length] as string;
      const dificultad = DIFICULTADES[Math.floor(hueco / habilidad.subhabilidades.length) % 3] as Dificultad;
      for (let intento = 0; intento < INTENTOS_POR_HUECO; intento += 1) {
        const rng = flujo(semilla, `banco/${test.id}/${sub}/${hueco}/${intento}`);
        if (anadir(generarPregunta(sub, rng, dificultad, idioma), false)) break;
      }
    }
  }

  // Si las plantillas no daban para tanto, se admiten variantes hasta cubrir el test.
  for (let intento = 0; elegidas.size < test.preguntas * 2 && intento < 400; intento += 1) {
    const habilidad = test.habilidades[intento % test.habilidades.length];
    const sub = habilidad?.subhabilidades[intento % (habilidad.subhabilidades.length)];
    if (sub !== undefined) {
      const dificultad = DIFICULTADES[intento % 3] as Dificultad;
      anadir(generarPregunta(sub, flujo(semilla, `banco/${test.id}/relleno/${intento}`), dificultad, idioma), true);
    }
  }
  return [...elegidas.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function indiceHabilidad(test: DefinicionTest, subId: string): number {
  return test.habilidades.findIndex((h) => h.subhabilidades.includes(subId));
}

export function itemDe(test: DefinicionTest, p: Pregunta): Item & { readonly pregunta: Pregunta } {
  return { id: p.id, requiere: [indiceHabilidad(test, p.subhabilidad)], slip: p.slip, guess: p.guess, dificultad: p.dificultad, pregunta: p };
}

function generarConSub(subId: string, idioma: string): (rng: Rng, d: Dificultad) => Pregunta {
  return (rng, d) => generarPregunta(subId, rng, d, idioma);
}

// 6 ejercicios de fácil a difícil, solo de esa subhabilidad, sin los ya vistos.
export function paqueteDePractica(subId: string, semilla: number, vistas: readonly Pregunta[] = [], idioma: string = "es"): readonly Pregunta[] {
  return crearSerie(generarConSub(subId, idioma), semilla, PATRON_PAQUETE, vistas);
}

export function miniTest(subId: string, semilla: number, vistas: readonly Pregunta[] = [], idioma: string = "es"): readonly Pregunta[] {
  return crearSerie(generarConSub(subId, idioma), semilla, PATRON_MINITEST, vistas);
}
