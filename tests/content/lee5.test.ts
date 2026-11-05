import { describe, expect, it } from "vitest";
import { comprobarGeneradores } from "./arnes.ts";
import { GENERADORES, TEXTOS_LEE5 } from "../../src/content/generadores/lee5.ts";
import { SUBHABILIDADES } from "../../src/content/temario.ts";

const IDS = SUBHABILIDADES.filter((s) => s.id.startsWith("LEE5-")).map((s) => s.id);
const TEXTOS = Object.values(TEXTOS_LEE5).flat();
const PREGUNTAS = TEXTOS.flatMap((t) => t.preguntas);

comprobarGeneradores("LEE 5.º", GENERADORES, IDS);

describe("LEE 5.º: textos", () => {
  it("cubre las 11 subhabilidades del curso", () => {
    expect(IDS).toHaveLength(11);
  });

  it("cada tema tiene al menos 4 textos y los ids no se repiten", () => {
    for (const textos of Object.values(TEXTOS_LEE5)) expect(textos.length).toBeGreaterThanOrEqual(4);
    expect(new Set(TEXTOS.map((t) => t.id)).size).toBe(TEXTOS.length);
  });

  it.each(TEXTOS.map((t) => [t.id, t.texto] as const))("%s tiene entre 110 y 150 palabras", (_, texto) => {
    const palabras = texto.trim().split(/\s+/).length;
    expect(palabras).toBeGreaterThanOrEqual(110);
    expect(palabras).toBeLessThanOrEqual(150);
  });

  it("cada texto da una pregunta por dificultad y subhabilidad", () => {
    for (const t of TEXTOS) {
      const claves = t.preguntas.map((q) => `${q.sub}/${q.dificultad}`);
      expect(new Set(claves).size).toBe(claves.length);
    }
  });

  it("no usa voseo, vosotros, regionalismos ni palabras prohibidas en ningún campo", () => {
    const prohibido = /\b(vosotr[oa]s|vuestr[oa]s?|coger|cogió|ordenador|nevera|móvil|celular|hucha|euros?|d[óo]lar(es)?|pesos?)\b/i;
    for (const t of TEXTOS) {
      const campos = [t.titulo ?? "", t.texto, JSON.stringify(t.imagen ?? null), ...t.preguntas.flatMap((q) => [q.enunciado, q.enunciadoFacil, q.correcta, ...q.distractores, q.pista, q.explicacion])];
      for (const campo of campos) expect(campo).not.toMatch(prohibido);
    }
  });

  it("la correcta no se delata por ser la opción más larga", () => {
    const masLarga = PREGUNTAS.filter((q) => q.distractores.every((d) => q.correcta.length > d.length)).length;
    expect(masLarga / PREGUNTAS.length).toBeLessThan(0.4);
  });

  it("solo usa variables de nombre con un formato válido", () => {
    for (const t of TEXTOS) {
      const todo = JSON.stringify(t);
      for (const m of todo.matchAll(/\{([^{}"]*)\}/g)) expect(m[1]).toMatch(/^[FMN][123]$/);
    }
  });
});
