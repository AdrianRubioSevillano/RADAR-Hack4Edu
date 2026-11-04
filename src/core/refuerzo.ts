// Paquete de práctica y mini-test: se generan al vuelo, no se guardan combinaciones.
import { flujo, type Rng } from "./rng.ts";

export type NivelDificultad = 1 | 2 | 3;

// 6 ejercicios de fácil a difícil, y mini-test de 3.
export const PATRON_PAQUETE: readonly NivelDificultad[] = [1, 1, 2, 2, 3, 3];
export const PATRON_MINITEST: readonly NivelDificultad[] = [1, 2, 3];

export interface EjercicioBase {
  readonly id: string;
  readonly dificultad: NivelDificultad;
  readonly plantilla?: string;
}

const INTENTOS = 60;

// Busca en tres pasos: primero algo nuevo y de otra plantilla, después algo nuevo, y
// en último extremo cualquiera. Nunca devuelve dos veces el mismo ejercicio si puede evitarlo.
function buscar<T extends EjercicioBase>(generar: (rng: Rng, d: NivelDificultad) => T, semilla: number, etiqueta: string, d: NivelDificultad, vistos: ReadonlySet<string>, plantillas: ReadonlySet<string>): T {
  let nuevo: T | null = null;
  let cualquiera: T | null = null;
  for (let intento = 0; intento < INTENTOS; intento += 1) {
    const ejercicio = generar(flujo(semilla, `${etiqueta}/${intento}`), d);
    cualquiera ??= ejercicio;
    if (vistos.has(ejercicio.id)) continue;
    nuevo ??= ejercicio;
    if (ejercicio.plantilla === undefined || !plantillas.has(ejercicio.plantilla)) return ejercicio;
  }
  return nuevo ?? (cualquiera as T);
}

export function crearSerie<T extends EjercicioBase>(
  generar: (rng: Rng, d: NivelDificultad) => T,
  semilla: number,
  patron: readonly NivelDificultad[],
  excluidos: readonly EjercicioBase[] = [],
): readonly T[] {
  const vistos = new Set(excluidos.map((e) => e.id));
  const plantillas = new Set(excluidos.flatMap((e) => (e.plantilla === undefined ? [] : [e.plantilla])));
  const salida: T[] = [];
  patron.forEach((d, indice) => {
    const ejercicio = buscar(generar, semilla, `serie/${indice}`, d, vistos, plantillas);
    salida.push(ejercicio);
    vistos.add(ejercicio.id);
    if (ejercicio.plantilla !== undefined) plantillas.add(ejercicio.plantilla);
  });
  return salida;
}
