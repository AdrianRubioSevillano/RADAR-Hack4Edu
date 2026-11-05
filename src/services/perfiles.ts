// Perfiles de accesibilidad (CLAUDE.md §6). Se guardan solo las ayudas activas, nunca
// un diagnóstico. Las preguntas son las mismas: cambia la presentación.
import type { Curso } from "../content/tipos.ts";
import type { Ayuda } from "./clase.ts";

export interface Presentacion {
  readonly enunciadoFacil: boolean;
  readonly escuchar: boolean;
  readonly letra: "normal" | "grande" | "muyGrande";
  readonly altoContraste: boolean;
  readonly sinExtras: boolean;
  readonly barraProgreso: boolean;
  readonly pausas: boolean;
}

export const PRESENTACION_BASE: Presentacion = {
  enunciadoFacil: false,
  escuchar: false,
  letra: "normal",
  altoContraste: false,
  sinExtras: false,
  barraProgreso: false,
  pausas: false,
};

// En 1.º y 2.º muchos niños aún no leen con soltura: la voz está para todos, salvo que
// el perfil auditivo sea el único motivo del alumno.
export function presentacionDe(ayudas: readonly Ayuda[], curso: Curso): Presentacion {
  const tiene = (a: Ayuda) => ayudas.includes(a);
  const pideVoz = tiene("dislexia") || tiene("bajaVision");
  return {
    enunciadoFacil: tiene("dislexia"),
    escuchar: pideVoz || (curso <= 2 && !tiene("auditiva")),
    letra: tiene("bajaVision") ? "muyGrande" : tiene("dislexia") ? "grande" : "normal",
    altoContraste: tiene("bajaVision"),
    sinExtras: tiene("tdah"),
    barraProgreso: tiene("tdah"),
    pausas: tiene("tdah"),
  };
}

export function atributosDe(p: Presentacion): Readonly<Record<string, string>> {
  return {
    "data-letra": p.letra,
    "data-contraste": p.altoContraste ? "alto" : "normal",
    "data-sinextras": p.sinExtras ? "si" : "no",
  };
}

export type Pausa = "descanso" | "parte" | null;

// TDAH: bloques de 5 con pausa opcional, y test en 2 partes si es largo (más de 10).
export function pausaTras(respondidas: number, total: number, p: Presentacion): Pausa {
  if (!p.pausas || respondidas === 0 || respondidas >= total) return null;
  if (total > 10 && respondidas === Math.ceil(total / 2)) return "parte";
  return respondidas % 5 === 0 ? "descanso" : null;
}

