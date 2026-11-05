// Los 126 tests: por curso y bloque, 5 de tema, 1 de repaso (T1–T3) y 1 final (T1–T5).
import { PREGUNTAS_FINAL, PREGUNTAS_REPASO, PREGUNTAS_TEMA } from "../core/test.ts";
import { BLOQUES, CURSOS, temasDe } from "./temario.ts";
import type { Bloque, Curso, Tema } from "./tipos.ts";

export type TipoTest = "tema" | "repaso" | "final";

// En un test de tema las habilidades son las subhabilidades; en uno mezclado, los temas.
export interface HabilidadTest {
  readonly id: string;
  readonly nombre: string;
  readonly subhabilidades: readonly string[];
}

export interface DefinicionTest {
  readonly id: string;
  readonly tipo: TipoTest;
  readonly curso: Curso;
  readonly bloque: Bloque;
  readonly nombre: string;
  readonly preguntas: number;
  readonly habilidades: readonly HabilidadTest[];
}

function testDeTema(tema: Tema): DefinicionTest {
  return {
    id: tema.id,
    tipo: "tema",
    curso: tema.curso,
    bloque: tema.bloque,
    nombre: tema.nombre,
    preguntas: PREGUNTAS_TEMA,
    habilidades: tema.subhabilidades.map((s) => ({ id: s.id, nombre: s.nombre, subhabilidades: [s.id] })),
  };
}

function testMezclado(curso: Curso, bloque: Bloque, tipo: "repaso" | "final", temas: readonly Tema[]): DefinicionTest {
  return {
    id: `${bloque}${curso}-${tipo.toUpperCase()}`,
    tipo,
    curso,
    bloque,
    nombre: tipo === "repaso" ? "Repaso de los temas 1 a 3" : "Repaso final",
    preguntas: tipo === "repaso" ? PREGUNTAS_REPASO : PREGUNTAS_FINAL,
    habilidades: temas.map((t) => ({ id: t.id, nombre: t.nombre, subhabilidades: t.subhabilidades.map((s) => s.id) })),
  };
}

export const TESTS: readonly DefinicionTest[] = CURSOS.flatMap((curso) =>
  BLOQUES.flatMap((bloque) => {
    const temas = temasDe(curso, bloque);
    return [...temas.map(testDeTema), testMezclado(curso, bloque, "repaso", temas.slice(0, 3)), testMezclado(curso, bloque, "final", temas)];
  }),
);

const POR_ID = new Map(TESTS.map((t) => [t.id, t]));

export function testPorId(id: string): DefinicionTest | undefined {
  return POR_ID.get(id);
}

export function testsDe(curso: Curso): readonly DefinicionTest[] {
  return TESTS.filter((t) => t.curso === curso);
}
