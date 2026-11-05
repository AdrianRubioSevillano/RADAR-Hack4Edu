// Registro del temario con ids estables: {bloque}{curso}-T{n} y {tema}-{a|b|c}.
import { TEMARIO_DATOS } from "./temarioDatos.ts";
import type { Bloque, Curso, Subhabilidad, Tema } from "./tipos.ts";

const LETRAS = ["a", "b", "c"] as const;

export const BLOQUES: readonly Bloque[] = ["NUM", "LEE", "PEN"];
export const CURSOS: readonly Curso[] = [1, 2, 3, 4, 5, 6];
export const NOMBRE_NIVEL: Readonly<Record<Curso, string>> = { 1: "Ciclo I", 2: "Ciclo II", 3: "Ciclo III", 4: "Ciclo IV", 5: "Ciclo V", 6: "Ciclo VI" };
export const NOMBRE_BLOQUE: Readonly<Record<Bloque, string>> = {
  NUM: "Números para la vida",
  LEE: "Leer y entender",
  PEN: "Pensar y decidir",
};

function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export const TEMAS: readonly Tema[] = TEMARIO_DATOS.map((t) => {
  const id = `${t.bloque}${t.curso}-T${t.numero}`;
  return {
    id,
    bloque: t.bloque,
    curso: t.curso,
    numero: t.numero,
    nombre: t.nombre,
    subhabilidades: t.subhabilidades.map((nombre, orden) => ({
      id: `${id}-${LETRAS[orden] ?? "z"}`,
      tema: id,
      nombre: mayuscula(nombre),
      orden,
    })),
  };
});

export const SUBHABILIDADES: readonly Subhabilidad[] = TEMAS.flatMap((t) => t.subhabilidades);

const POR_TEMA = new Map(TEMAS.map((t) => [t.id, t]));
const POR_SUB = new Map(SUBHABILIDADES.map((s) => [s.id, s]));

export function temaPorId(id: string): Tema | undefined {
  return POR_TEMA.get(id);
}

export function subhabilidadPorId(id: string): Subhabilidad | undefined {
  return POR_SUB.get(id);
}

export function temasDe(curso: Curso, bloque: Bloque): readonly Tema[] {
  return TEMAS.filter((t) => t.curso === curso && t.bloque === bloque);
}
