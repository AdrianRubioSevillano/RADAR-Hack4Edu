// Desarrollo de un test adaptativo sobre K habilidades. Funciones puras: cada paso
// devuelve un estado nuevo. Las preguntas candidatas las aporta quien llama.
import { actualizar, aplicarPractica, crearPrior, marginales, type OpcionesPrior } from "./bayes.ts";
import { assertK } from "./dina.ts";
import { colorSemaforo, UMBRALES, type Umbrales } from "./semaforo.ts";
import { mejorItem } from "./seleccion.ts";
import { MotorError, type Color, type Conjunta, type Item } from "./tipos.ts";

// Número de preguntas por tipo de test (CLAUDE.md §4).
export const PREGUNTAS_TEMA = 10;
export const PREGUNTAS_REPASO = 12;
export const PREGUNTAS_FINAL = 15;
// Mínimo garantizado por habilidad: también por debajo no hay semáforo fiable.
export const MINIMO_POR_HABILIDAD = 2;

export interface RespuestaRegistrada {
  readonly itemId: string;
  readonly requiere: readonly number[];
  readonly acierto: boolean;
}

export interface EstadoTest {
  readonly k: number;
  readonly totalPreguntas: number;
  readonly minimoPorHabilidad: number;
  readonly conjunta: Conjunta;
  readonly respuestas: readonly RespuestaRegistrada[];
}

export interface ConfigTest {
  readonly k: number;
  readonly totalPreguntas: number;
  readonly minimoPorHabilidad?: number;
  readonly prior?: OpcionesPrior;
}

export function iniciarTest(config: ConfigTest): EstadoTest {
  assertK(config.k);
  if (!Number.isInteger(config.totalPreguntas) || config.totalPreguntas < 1) {
    throw new MotorError("TEST_INVALIDO", "El test necesita al menos una pregunta");
  }
  return {
    k: config.k,
    totalPreguntas: config.totalPreguntas,
    minimoPorHabilidad: config.minimoPorHabilidad ?? MINIMO_POR_HABILIDAD,
    conjunta: crearPrior(config.k, config.prior),
    respuestas: [],
  };
}

function respuestasDe(estado: EstadoTest, habilidad: number): readonly RespuestaRegistrada[] {
  return estado.respuestas.filter((r) => r.requiere.includes(habilidad));
}

export function testTerminado(estado: EstadoTest): boolean {
  return estado.respuestas.length >= estado.totalPreguntas;
}

// Escalera por habilidad: empieza en fácil, sube con cada acierto y baja con cada
// fallo. Sin ella la EIG preferiría siempre las fáciles, que tienen menos slip.
export function dificultadObjetivo(estado: EstadoTest, habilidad: number): 1 | 2 | 3 {
  const nivel = respuestasDe(estado, habilidad).reduce((n, r) => Math.min(3, Math.max(1, n + (r.acierto ? 1 : -1))), 1);
  return nivel as 1 | 2 | 3;
}

// Por cada habilidad deja solo los items de la dificultad más cercana a su objetivo.
function filtrarPorEscalera<T extends Item>(estado: EstadoTest, items: readonly T[]): readonly T[] {
  const distancia = (item: T): number => {
    const habilidad = item.requiere[0] ?? 0;
    return item.dificultad === undefined ? 0 : Math.abs(item.dificultad - dificultadObjetivo(estado, habilidad));
  };
  const mejor = new Map<number, number>();
  for (const item of items) {
    const habilidad = item.requiere[0] ?? 0;
    mejor.set(habilidad, Math.min(mejor.get(habilidad) ?? Infinity, distancia(item)));
  }
  return items.filter((item) => distancia(item) === mejor.get(item.requiere[0] ?? 0));
}

// La EIG decide qué habilidad explorar entre las no respondidas, con la dificultad que
// marca la escalera. Si las preguntas restantes apenas alcanzan para cumplir el mínimo
// por habilidad, se restringe a las habilidades que lo necesitan.
export function siguienteItem<T extends Item>(estado: EstadoTest, candidatos: readonly T[]): T | null {
  if (testTerminado(estado)) return null;
  const respondidas = new Set(estado.respuestas.map((r) => r.itemId));
  const libres = candidatos.filter((item) => !respondidas.has(item.id));
  const deficit = new Map<number, number>();
  for (let h = 0; h < estado.k; h += 1) {
    const falta = estado.minimoPorHabilidad - respuestasDe(estado, h).length;
    if (falta > 0 && libres.some((item) => item.requiere.includes(h))) deficit.set(h, falta);
  }
  const pendientes = [...deficit.values()].reduce((suma, falta) => suma + falta, 0);
  const restantes = estado.totalPreguntas - estado.respuestas.length;
  const permitidos = restantes <= pendientes ? libres.filter((item) => item.requiere.some((h) => deficit.has(h))) : libres;
  return mejorItem(estado.conjunta, filtrarPorEscalera(estado, permitidos));
}

export function responder(estado: EstadoTest, item: Item, acierto: boolean): EstadoTest {
  if (estado.respuestas.some((r) => r.itemId === item.id)) {
    throw new MotorError("PREGUNTA_REPETIDA", `Pregunta ya respondida: ${item.id}`);
  }
  return {
    ...estado,
    conjunta: actualizar(estado.conjunta, item, acierto),
    respuestas: [...estado.respuestas, { itemId: item.id, requiere: item.requiere, acierto }],
  };
}

export interface ResultadoHabilidad {
  readonly habilidad: number;
  readonly p: number;
  readonly respuestas: number;
  readonly aciertos: number;
  readonly color: Color;
}

export function resultado(estado: EstadoTest, umbrales: Umbrales = UMBRALES): readonly ResultadoHabilidad[] {
  return marginales(estado.conjunta).map((p, habilidad) => {
    const propias = respuestasDe(estado, habilidad);
    return {
      habilidad,
      p,
      respuestas: propias.length,
      aciertos: propias.filter((r) => r.acierto).length,
      color: colorSemaforo(p, propias.length, umbrales),
    };
  });
}

// Tras el paquete de práctica se aplica la transición de aprendizaje a la habilidad
// y después las respuestas del mini-test actualizan el mismo estado.
export function aplicarMiniTest(estado: EstadoTest, habilidad: number, respuestas: readonly { readonly item: Item; readonly acierto: boolean }[]): EstadoTest {
  const inicial: EstadoTest = { ...estado, conjunta: aplicarPractica(estado.conjunta, habilidad) };
  return respuestas.reduce(
    (actual, { item, acierto }) => ({
      ...actual,
      conjunta: actualizar(actual.conjunta, item, acierto),
      respuestas: [...actual.respuestas, { itemId: item.id, requiere: item.requiere, acierto }],
    }),
    inicial,
  );
}
