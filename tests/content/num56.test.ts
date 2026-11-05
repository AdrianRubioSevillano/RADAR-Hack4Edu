import { describe, expect, it } from "vitest";
import { comprobarGeneradores } from "./arnes.ts";
import { ORACULOS } from "./oraculos/num56.ts";
import { flujo } from "../../src/core/rng.ts";
import { SUBHABILIDADES } from "../../src/content/temario.ts";
import { GENERADORES } from "../../src/content/generadores/num56.ts";
import type { Dificultad, Pregunta } from "../../src/content/tipos.ts";

const ids = SUBHABILIDADES.filter((s) => /^NUM[56]-/.test(s.id)).map((s) => s.id);
comprobarGeneradores("NUM 5.º y 6.º", GENERADORES, ids, ORACULOS);

function todas(): Pregunta[] {
  return ids.flatMap((id) =>
    (GENERADORES[id] ?? []).flatMap((g) =>
      ([1, 2, 3] as const satisfies readonly Dificultad[]).flatMap((d) => Array.from({ length: 40 }, (_, s) => g(flujo(s * 101 + 7, "calidad"), d))),
    ),
  );
}

describe("calidad de NUM 5.º y 6.º", () => {
  const preguntas = todas();
  const textos = (p: Pregunta) => [p.enunciado, p.enunciadoFacil, p.explicacion, ...(p.opciones ?? []).map((o) => o.texto)];

  it("hay un oráculo por subhabilidad", () => {
    expect(Object.keys(ORACULOS).sort()).toEqual([...ids].sort());
  });

  it("el enunciado fácil conserva todos los datos numéricos del enunciado", () => {
    for (const p of preguntas) {
      const datos = p.enunciado.match(/\d+(?:[,/:]\d+)*/g) ?? [];
      const facil = p.enunciadoFacil.match(/\d+(?:[,/:]\d+)*/g) ?? [];
      for (const dato of datos) expect(facil, p.enunciado).toContain(dato);
    }
  });

  it("no hay concordancias rotas ni punto decimal en los textos", () => {
    for (const p of preguntas) {
      for (const t of textos(p)) {
        expect(t, t).not.toMatch(/(^|[^\d,])1 monedas|\b0 monedas|\d\.\d|  /);
        expect(t, t).not.toMatch(/\b(los|un|el) (gallinas|plantas|personas|harina|sal)\b/);
        expect(t, t).not.toMatch(/Cuántos (horas|semanas|toneladas)|\b1 litros|se mezclan 1 /);
      }
    }
  });

  it("los números escritos no son negativos", () => {
    for (const p of preguntas) expect(p.respuestaCorrecta).not.toMatch(/^-/);
    for (const p of preguntas) for (const o of p.opciones ?? []) expect(o.texto, p.enunciado).not.toMatch(/^-|−\d/);
  });
});
