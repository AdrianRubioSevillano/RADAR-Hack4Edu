import { describe, expect, it } from "vitest";
import { comprobarGeneradores } from "./arnes.ts";
import { oraculoAgrupar, oraculoFaltan, oraculoFiguras, oraculoIgual, oraculoNumeros, oraculoPresupuesto } from "./oraculos/pen12.ts";
import { flujo } from "../../src/core/rng.ts";
import { GENERADORES } from "../../src/content/generadores/pen12.ts";
import { SUBHABILIDADES } from "../../src/content/temario.ts";
import type { Dificultad } from "../../src/content/tipos.ts";

const ids = SUBHABILIDADES.filter((s) => /^PEN[12]-/.test(s.id)).map((s) => s.id);

comprobarGeneradores("PEN 1.º y 2.º", GENERADORES, ids, {
  "PEN1-T1-a": oraculoFiguras,
  "PEN1-T1-b": oraculoFiguras,
  "PEN1-T2-b": oraculoAgrupar,
  "PEN1-T3-a": oraculoIgual,
  "PEN2-T1-a": oraculoNumeros,
  "PEN2-T1-b": oraculoFiguras,
  "PEN2-T3-b": oraculoPresupuesto,
  "PEN2-T4-b": oraculoFaltan,
});

describe("PEN 1.º y 2.º: contenido", () => {
  it("son las 21 subhabilidades del encargo", () => {
    expect(ids).toHaveLength(21);
  });

  it("cada subhabilidad da al menos 15 preguntas distintas, para montar un test sin repetir", () => {
    for (const id of ids) {
      const distintas = new Set<string>();
      for (const g of GENERADORES[id] ?? []) {
        for (const d of [1, 2, 3] as const satisfies readonly Dificultad[]) {
          for (let s = 0; s < 300; s += 1) {
            const p = g(flujo(s, "variedad"), d);
            distintas.add(p.plantilla ?? p.id);
          }
        }
      }
      expect(distintas.size, id).toBeGreaterThanOrEqual(15);
    }
  });

  it("no usa regionalismos que cambian de sentido entre países", () => {
    const prohibidas = /\b(coger|coges|cogen|grifo|zumo|vosotros|ordenador|móvil|pegatinas?)\b/i;
    for (const id of ids) {
      for (const g of GENERADORES[id] ?? []) {
        for (const d of [1, 2, 3] as const satisfies readonly Dificultad[]) {
          for (let s = 0; s < 120; s += 1) {
            const p = g(flujo(s, "lenguaje"), d);
            const textos = [p.enunciado, p.enunciadoFacil, p.pista, p.explicacion, ...(p.opciones ?? []).map((o) => o.texto)];
            for (const t of textos) expect(t).not.toMatch(prohibidas);
          }
        }
      }
    }
  });
});
