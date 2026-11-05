import { describe, expect, it } from "vitest";
import { flujo } from "../../src/core/rng.ts";
import { GENERADORES } from "../../src/content/generadores/lee12.ts";
import { CARTELES, ETIQUETAS, HORARIOS } from "../../src/content/generadores/lee12/carteles2.ts";
import { PALABRAS } from "../../src/content/generadores/lee12/base.ts";
import { DATOS_CURSO1 } from "../../src/content/generadores/lee12/curso1.ts";
import { TEXTOS_CUENTO, TEXTOS_VERDAD } from "../../src/content/generadores/lee12/textos1.ts";
import { TEXTOS_BUSCAR, TEXTOS_ORDEN } from "../../src/content/generadores/lee12/textos2.ts";
import { SUBHABILIDADES } from "../../src/content/temario.ts";
import type { Dificultad, Imagen, Pregunta } from "../../src/content/tipos.ts";
import { OBJETOS } from "../../src/content/tipos.ts";
import { comprobarGeneradores } from "./arnes.ts";

const IDS = SUBHABILIDADES.map((s) => s.id).filter((id) => id.startsWith("LEE1-") || id.startsWith("LEE2-"));
const DIFICULTADES: readonly Dificultad[] = [1, 2, 3];
const SEMILLAS = Array.from({ length: 80 }, (_, i) => i * 104729 + 7);

comprobarGeneradores("LEE 1.º y 2.º", GENERADORES, IDS);

function todas(): Pregunta[] {
  return IDS.flatMap((id) =>
    (GENERADORES[id] ?? []).flatMap((g) =>
      DIFICULTADES.flatMap((d) => SEMILLAS.map((s) => g(flujo(s, `lee12/${id}`), d))),
    ),
  );
}

function objetosDe(imagen: Imagen | undefined): readonly string[] {
  if (imagen === undefined) return [];
  if (imagen.tipo === "objeto") return [imagen.objeto];
  if (imagen.tipo === "objetos") return imagen.grupos.map((g) => g.objeto);
  return [];
}

function frases(texto: string): number {
  return texto.split(/[.!?]+\s*/).filter((f) => f.trim() !== "").length;
}

function palabras(texto: string): number {
  return texto.trim().split(/\s+/).length;
}

describe("LEE 1.º y 2.º: reglas propias", () => {
  const preguntas = todas();

  it("cubre las 25 subhabilidades", () => {
    expect(IDS).toHaveLength(25);
  });

  it("LEE2-T3-a tiene al menos 20 preguntas distintas", () => {
    const distintas = new Set(preguntas.filter((p) => p.subhabilidad === "LEE2-T3-a").map((p) => p.plantilla));
    expect(distintas.size).toBeGreaterThanOrEqual(20);
  });

  it("todos los dibujos usados existen", () => {
    for (const p of preguntas) {
      for (const objeto of [...objetosDe(p.imagen), ...(p.opciones ?? []).flatMap((o) => objetosDe(o.imagen))]) {
        expect(OBJETOS).toContain(objeto);
      }
    }
  });

  it("sin regionalismos ni palabras a evitar", () => {
    const vetadas = /\b(coger|cogió|coche|zumo|patata|móvil|ordenador|nevera|vosotros|tenéis|culo|puta|puto|pito|caca)\b/i;
    for (const p of preguntas) {
      const campos = [p.enunciado, p.enunciadoFacil, p.pista, p.explicacion, p.texto ?? "", ...(p.opciones ?? []).map((o) => o.texto)];
      for (const campo of campos) expect(campo, p.id).not.toMatch(vetadas);
    }
  });

  it("sin variables por sustituir en imágenes ni textos", () => {
    for (const p of preguntas) {
      expect(`${p.texto ?? ""} ${JSON.stringify(p.imagen ?? null)}`, p.id).not.toMatch(/\{[FMN]\d\}/);
    }
  });

  it("la pista no contiene la respuesta en las preguntas sobre textos", () => {
    for (const p of preguntas) {
      if (p.texto === undefined || p.formato !== "opcion") continue;
      const correcta = (p.opciones ?? []).find((o) => o.id === p.respuestaCorrecta)?.texto ?? "";
      if (correcta.length > 12) expect(p.pista.toLowerCase(), p.id).not.toContain(correcta.toLowerCase());
    }
  });

  it("las palabras dibujables son objetos reales y se parten bien", () => {
    for (const w of PALABRAS) {
      expect(OBJETOS).toContain(w.id);
      expect(w.silabas.join("")).toBe(w.texto);
    }
  });

  it("cada hueco de «completar la palabra» forma la palabra del dibujo", () => {
    for (const d of DIFICULTADES) {
      for (const [id, patron, letra, distractores] of DATOS_CURSO1.HUECOS[d]) {
        const palabra = PALABRAS.find((w) => w.id === id)?.texto;
        expect(patron.replace(/_+/, letra)).toBe(palabra);
        expect(distractores).not.toContain(letra);
      }
    }
  });

  it("los huecos no forman palabras malsonantes", () => {
    const malsonantes = new Set(["puto", "puta", "pito", "poto", "pija", "caca", "culo", "pedo", "teta", "misa"]);
    for (const d of DIFICULTADES) {
      for (const [, patron, , distractores] of DATOS_CURSO1.HUECOS[d]) {
        for (const x of distractores) expect(malsonantes.has(patron.replace(/_+/, x))).toBe(false);
      }
    }
  });

  it("los textos de 1.º tienen una o dos frases", () => {
    for (const t of [...TEXTOS_CUENTO, ...TEXTOS_VERDAD]) expect(frases(t.texto), t.id).toBeLessThanOrEqual(2);
  });

  it("los textos de 2.º tienen de dos a cuatro frases y de 30 a 50 palabras", () => {
    for (const t of [...TEXTOS_BUSCAR, ...TEXTOS_ORDEN]) {
      expect(frases(t.texto), t.id).toBeGreaterThanOrEqual(2);
      expect(frases(t.texto), t.id).toBeLessThanOrEqual(4);
      expect(palabras(t.texto), t.id).toBeGreaterThanOrEqual(30);
      expect(palabras(t.texto), t.id).toBeLessThanOrEqual(50);
    }
  });

  it("hay al menos tres textos, carteles u horarios distintos por tema", () => {
    expect(TEXTOS_CUENTO.length).toBeGreaterThanOrEqual(3);
    expect(TEXTOS_BUSCAR.length).toBeGreaterThanOrEqual(3);
    expect(TEXTOS_ORDEN.length).toBeGreaterThanOrEqual(3);
    for (const lista of [CARTELES, HORARIOS, ETIQUETAS]) {
      expect(new Set(lista.map((s) => JSON.stringify(s.imagen))).size).toBeGreaterThanOrEqual(3);
    }
  });

  it("las preguntas sobre carteles siempre llevan la imagen con los datos", () => {
    for (const p of preguntas) {
      if (p.subhabilidad.startsWith("LEE2-T5")) expect(p.imagen, p.id).toBeDefined();
    }
  });
});
