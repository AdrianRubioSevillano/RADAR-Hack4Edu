import { describe, expect, it } from "vitest";
import { comprobarGeneradores } from "./arnes.ts";
import { flujo } from "../../src/core/rng.ts";
import { GENERADORES, TEXTOS_LEE3, TEXTOS_LEE4 } from "../../src/content/generadores/lee34.ts";
import { FAMILIAS } from "../../src/content/generadores/lee34/familias.ts";
import type { TextoEscrito } from "../../src/content/plantillas.ts";
import { SUBHABILIDADES, TEMAS } from "../../src/content/temario.ts";
import type { Dificultad, Pregunta } from "../../src/content/tipos.ts";

const IDS = SUBHABILIDADES.filter((s) => /^LEE[34]-/.test(s.id)).map((s) => s.id);
const TEXTOS = [...TEXTOS_LEE3, ...TEXTOS_LEE4];
const PREGUNTAS = TEXTOS.flatMap((t) => t.preguntas);

comprobarGeneradores("LEE 3.º y 4.º", GENERADORES, IDS);

function palabras(t: TextoEscrito): number {
  return t.texto.trim().split(/\s+/).filter((w) => !/^\d+\.$/.test(w)).length; // sin contar «1.», «2.»...
}

function muestras(id: string, d: Dificultad): Pregunta[] {
  const g = GENERADORES[id]?.[0];
  if (g === undefined) throw new Error(`Sin generador: ${id}`);
  return Array.from({ length: 400 }, (_, i) => g(flujo(i, "lee34"), d));
}

describe("textos de LEE 3.º y 4.º", () => {
  it("son 21 subhabilidades", () => {
    expect(IDS).toHaveLength(21);
  });

  it("los ids de los textos son únicos", () => {
    const ids = TEXTOS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("respetan la longitud del curso", () => {
    for (const t of TEXTOS_LEE3) {
      expect(palabras(t), t.id).toBeGreaterThanOrEqual(60);
      expect(palabras(t), t.id).toBeLessThanOrEqual(80);
    }
    for (const t of TEXTOS_LEE4) {
      expect(palabras(t), t.id).toBeGreaterThanOrEqual(80);
      expect(palabras(t), t.id).toBeLessThanOrEqual(110);
    }
  });

  it("cada tema tiene al menos 3 textos", () => {
    for (const tema of TEMAS.filter((t) => t.bloque === "LEE" && (t.curso === 3 || t.curso === 4))) {
      const propios = TEXTOS.filter((t) => t.id.startsWith(`${tema.id}-`));
      expect(propios.length, tema.id).toBeGreaterThanOrEqual(3);
    }
  });

  it("cada pregunta pertenece al tema de su texto", () => {
    for (const t of TEXTOS) {
      for (const p of t.preguntas) expect(t.id.startsWith(p.sub.slice(0, 7)), `${t.id} ${p.sub}`).toBe(true);
    }
  });

  it("LEE3-T3 tiene al menos 20 preguntas distintas", () => {
    expect(PREGUNTAS.filter((p) => p.sub === "LEE3-T3-a").length).toBeGreaterThanOrEqual(20);
    const vistas = new Set(([1, 2, 3] as const).flatMap((d) => muestras("LEE3-T3-a", d).map((p) => p.plantilla)));
    expect(vistas.size).toBeGreaterThanOrEqual(20);
  });

  it("en los textos del tema de idea principal no hay título que dé la respuesta", () => {
    for (const t of TEXTOS.filter((x) => /^LEE3-T2|^LEE4-T1/.test(x.id))) expect(t.titulo, t.id).toBeUndefined();
  });

  it("usa solo variables de nombre válidas", () => {
    for (const t of TEXTOS) {
      const todo = JSON.stringify(t);
      for (const m of todo.matchAll(/\{([^{}"]*)\}/g)) expect(m[1], t.id).toMatch(/^[FMN][123]$/);
    }
  });

  it("no usa regionalismos, vosotros ni dinero con divisa", () => {
    const prohibido = /\b(cog(er|e|ió|iendo)|vosotros|vuestr[oa]s?|nevera|ordenador|móvil|euros?|dólar(es)?|zumo|patatas?)\b/i;
    for (const t of TEXTOS) expect(JSON.stringify(t), t.id).not.toMatch(prohibido);
  });

  it("la respuesta correcta no se delata por ser la opción más larga", () => {
    const masLarga = PREGUNTAS.filter((p) => p.distractores.every((d) => p.correcta.length > d.length)).length;
    expect(masLarga / PREGUNTAS.length).toBeLessThan(0.5);
  });

  it("las tres dificultades cambian de verdad: más opciones al subir", () => {
    const media = (d: Dificultad) => {
      const lista = PREGUNTAS.filter((p) => p.dificultad === d);
      return lista.reduce((s, p) => s + p.distractores.length, 0) / lista.length;
    };
    expect(media(1)).toBeLessThan(media(2));
  });
});

describe("familias de palabras", () => {
  it("cada familia tiene 3 miembros y 3 falsos amigos sin repetir", () => {
    for (const f of FAMILIAS) {
      const todas = [...f.miembros, ...f.falsos].map((p) => p.palabra);
      expect(f.miembros.length, f.base).toBeGreaterThanOrEqual(3);
      expect(f.falsos.length, f.base).toBeGreaterThanOrEqual(3);
      expect(new Set(todas).size, f.base).toBe(todas.length);
    }
  });

  it("la dificultad 3 pregunta por el intruso", () => {
    for (const p of muestras("LEE3-T1-b", 3)) expect(p.enunciado).toContain("NO");
  });
});
