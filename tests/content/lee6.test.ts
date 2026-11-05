import { describe, expect, it } from "vitest";
import { flujo } from "../../src/core/rng.ts";
import { GENERADORES } from "../../src/content/generadores/lee6.ts";
import { TEXTOS_ARGUMENTOS } from "../../src/content/generadores/lee6/argumentos.ts";
import { TEXTOS_COMPARAR } from "../../src/content/generadores/lee6/comparar.ts";
import { TEXTOS_NORMAS, TEXTOS_PROSPECTOS } from "../../src/content/generadores/lee6/documentos.ts";
import { TEXTOS_PROPOSITO } from "../../src/content/generadores/lee6/proposito.ts";
import { TEXTOS_RUMORES } from "../../src/content/generadores/lee6/rumores.ts";
import type { TextoEscrito } from "../../src/content/plantillas.ts";
import { SUBHABILIDADES } from "../../src/content/temario.ts";
import type { Dificultad } from "../../src/content/tipos.ts";
import { comprobarGeneradores } from "./arnes.ts";
import { oraculoRecibos } from "./oraculos/lee6.ts";

const IDS = SUBHABILIDADES.filter((s) => s.id.startsWith("LEE6-")).map((s) => s.id);
const TODOS: readonly TextoEscrito[] = [...TEXTOS_COMPARAR, ...TEXTOS_PROPOSITO, ...TEXTOS_RUMORES, ...TEXTOS_ARGUMENTOS, ...TEXTOS_PROSPECTOS, ...TEXTOS_NORMAS];

comprobarGeneradores("LEE 6.º", GENERADORES, IDS, { "LEE6-T5-a": oraculoRecibos });

function palabras(t: TextoEscrito): number {
  const cartel = t.imagen?.tipo === "cartel" ? [t.imagen.titulo, ...t.imagen.lineas] : [];
  return [t.texto, ...cartel].join(" ").split(/\s+/).filter((x) => /[\p{L}\d]/u.test(x)).length;
}

describe("LEE 6.º · textos", () => {
  it.each(TODOS.map((t) => [t.id, t] as const))("%s mide entre 150 y 200 palabras", (_, t) => {
    expect(palabras(t)).toBeGreaterThanOrEqual(150);
    expect(palabras(t)).toBeLessThanOrEqual(200);
  });

  it("los ids de texto son únicos y cada tema tiene al menos 3 textos", () => {
    expect(new Set(TODOS.map((t) => t.id)).size).toBe(TODOS.length);
    for (const lista of [TEXTOS_COMPARAR, TEXTOS_PROPOSITO, TEXTOS_RUMORES, TEXTOS_ARGUMENTOS, TEXTOS_PROSPECTOS, TEXTOS_NORMAS]) {
      expect(lista.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("comparar dos textos lleva los dos rotulados y separados", () => {
    for (const t of TEXTOS_COMPARAR) {
      expect(t.texto).toMatch(/^Texto A: .+\n\n/);
      expect(t.texto).toMatch(/\n\nTexto B: .+\n\n/);
    }
  });

  it("LEE6-T2 tiene al menos 20 preguntas distintas", () => {
    const vistas = new Set<string>();
    const generador = GENERADORES["LEE6-T2-a"]?.[0];
    expect(generador).toBeDefined();
    for (const d of [1, 2, 3] as const satisfies readonly Dificultad[]) {
      for (let s = 0; s < 400; s += 1) {
        const p = generador?.(flujo(s, "t2"), d);
        if (p !== undefined) vistas.add(p.plantilla ?? p.id);
      }
    }
    expect(vistas.size).toBeGreaterThanOrEqual(20);
  });

  it("cada prospecto avisa de que el medicamento es inventado", () => {
    for (const t of TEXTOS_PROSPECTOS) {
      expect(t.imagen?.tipo).toBe("cartel");
      if (t.imagen?.tipo === "cartel") expect(t.imagen.lineas.join(" ")).toContain("Este medicamento no existe");
    }
  });

  it("ninguna pregunta tiene una opción repetida y todas llevan 2 o 3 distractores", () => {
    for (const t of TODOS) {
      for (const p of t.preguntas) {
        expect(p.distractores.length).toBeGreaterThanOrEqual(2);
        expect(p.distractores.length).toBeLessThanOrEqual(3);
        expect(new Set([p.correcta, ...p.distractores]).size).toBe(p.distractores.length + 1);
      }
    }
  });
});
