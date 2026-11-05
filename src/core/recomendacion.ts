// "Mañana explica primero X" y grupos de alumnos. Solo cuentan los alumnos con
// respuestas; un alumno sin respuestas nunca suma ni resta.
import type { Color } from "./tipos.ts";

export interface EstadoSubhabilidad {
  readonly subhabilidad: string;
  readonly orden: number; // posición en el temario: desempata hacia la anterior
  readonly p: number;
  readonly color: Color;
}

export interface EstadoAlumno {
  readonly alumnoId: string;
  readonly respuestas: number;
  readonly subhabilidades: readonly EstadoSubhabilidad[];
}

export interface GrupoAlumnos {
  readonly subhabilidad: string;
  readonly alumnos: readonly string[];
}

export interface Recomendacion {
  readonly subhabilidad: string | null;
  readonly rojos: number;
  readonly evaluados: number;
  readonly grupos: readonly GrupoAlumnos[];
  readonly sinRojos: readonly string[];
  readonly sinRespuestas: readonly string[];
}

function rojasDe(alumno: EstadoAlumno): readonly EstadoSubhabilidad[] {
  return alumno.subhabilidades.filter((s) => s.color === "rojo");
}

// La que más necesita: la de menor probabilidad y, si empatan, la anterior.
function masNecesaria(rojas: readonly EstadoSubhabilidad[]): EstadoSubhabilidad | undefined {
  return [...rojas].sort((a, b) => a.p - b.p || a.orden - b.orden)[0];
}

export function recomendar(alumnos: readonly EstadoAlumno[]): Recomendacion {
  const evaluados = alumnos.filter((a) => a.respuestas > 0);
  const conteo = new Map<string, { orden: number; rojos: number }>();
  for (const alumno of evaluados) {
    for (const { subhabilidad, orden } of rojasDe(alumno)) {
      const actual = conteo.get(subhabilidad);
      conteo.set(subhabilidad, { orden, rojos: (actual?.rojos ?? 0) + 1 });
    }
  }
  const primera = [...conteo.entries()].sort(([, a], [, b]) => b.rojos - a.rojos || a.orden - b.orden)[0];

  const grupos = new Map<string, { orden: number; alumnos: string[] }>();
  const sinRojos: string[] = [];
  for (const alumno of evaluados) {
    const necesaria = masNecesaria(rojasDe(alumno));
    if (necesaria === undefined) {
      sinRojos.push(alumno.alumnoId);
    } else {
      const grupo = grupos.get(necesaria.subhabilidad) ?? { orden: necesaria.orden, alumnos: [] };
      grupo.alumnos.push(alumno.alumnoId);
      grupos.set(necesaria.subhabilidad, grupo);
    }
  }

  return {
    subhabilidad: primera?.[0] ?? null,
    rojos: primera?.[1].rojos ?? 0,
    evaluados: evaluados.length,
    grupos: [...grupos.entries()]
      .sort(([, a], [, b]) => b.alumnos.length - a.alumnos.length || a.orden - b.orden)
      .map(([subhabilidad, grupo]) => ({ subhabilidad, alumnos: grupo.alumnos })),
    sinRojos,
    sinRespuestas: alumnos.filter((a) => a.respuestas === 0).map((a) => a.alumnoId),
  };
}
