// Comprobaciones comunes a todos los generadores (CLAUDE.md §11). Cada archivo de
// tests de contenido llama a comprobarGeneradores con su parte del temario.
import { describe, expect, it } from "vitest";
import { flujo } from "../../src/core/rng.ts";
import { SUBHABILIDADES } from "../../src/content/temario.ts";
import type { Dificultad, Generador, MapaGeneradores, Pregunta } from "../../src/content/tipos.ts";
import { OBJETOS } from "../../src/content/tipos.ts";

const DIFICULTADES: readonly Dificultad[] = [1, 2, 3];
const SEMILLAS = Array.from({ length: 60 }, (_, i) => i * 7919 + 13);
// Divisas de un país. "Peso" y "soles" no están: también son palabras normales.
const DIVISAS = /\b(euros?|d[óo]lar(es)?|bol[íi]vares|rupias?|yenes|libras esterlinas)\b|[€$]/i;

function generar(g: Generador, semilla: number, d: Dificultad, n = 0): Pregunta {
  return g(flujo(semilla, `prueba/${n}`), d);
}

export function comprobarPregunta(p: Pregunta, subId: string, d: Dificultad): void {
  expect(p.subhabilidad).toBe(subId);
  expect(p.dificultad).toBe(d);
  expect(p.id.startsWith(`${subId}:`)).toBe(true);
  for (const campo of [p.enunciado, p.enunciadoFacil, p.pista, p.explicacion]) {
    expect(campo.trim().length).toBeGreaterThan(3);
    expect(campo).not.toMatch(/undefined|NaN|\{[A-Z]\d\}|\[object/);
    expect(campo).not.toMatch(DIVISAS);
  }
  expect(p.guess).toBeGreaterThan(0);
  expect(p.guess).toBeLessThan(1 - p.slip);
  expect(p.slip).toBeGreaterThan(0);
  if (p.formato === "numero") {
    expect(p.opciones).toBeUndefined();
    expect(p.respuestaCorrecta).toMatch(/^\d+(,\d+)?(\/\d+)?$/);
    expect(p.guess).toBe(0.05);
  } else {
    const opciones = p.opciones ?? [];
    expect(opciones.length).toBeGreaterThanOrEqual(3);
    expect(opciones.length).toBeLessThanOrEqual(4);
    expect(p.guess).toBeCloseTo(1 / opciones.length, 10);
    const textos = opciones.map((o) => o.texto.trim().toLowerCase());
    expect(new Set(textos).size).toBe(textos.length);
    expect(opciones.map((o) => o.id)).toContain(p.respuestaCorrecta);
    for (const o of opciones) {
      expect(o.texto.trim().length).toBeGreaterThan(0);
      expect(o.texto).not.toMatch(/undefined|NaN|\{[A-Z]\d\}/);
      if (p.formato === "imagen") expect(o.imagen).toBeDefined();
    }
  }
  if (p.imagen?.tipo === "objeto") expect(OBJETOS).toContain(p.imagen.objeto);
}

// `ids`: subhabilidades que cubre este mapa. `minimoDistintas`: preguntas distintas
// por subhabilidad y dificultad. La app necesita al menos 12 por subhabilidad.
export function comprobarGeneradores(nombre: string, mapa: MapaGeneradores, ids: readonly string[], oraculos: Readonly<Record<string, (p: Pregunta) => string>> = {}): void {
  describe(nombre, () => {
    it("cubre exactamente sus subhabilidades del temario", () => {
      for (const id of ids) expect(SUBHABILIDADES.some((s) => s.id === id)).toBe(true);
      expect(Object.keys(mapa).sort()).toEqual([...ids].sort());
    });

    describe.each(ids.map((id) => [id]))("%s", (id) => {
      const generadores = mapa[id] ?? [];

      it("tiene generador, misma semilla da misma pregunta y otra semilla da otra", () => {
        expect(generadores.length).toBeGreaterThan(0);
        for (const g of generadores) {
          for (const d of DIFICULTADES) {
            expect(generar(g, 5, d)).toEqual(generar(g, 5, d));
            const distintas = new Set(SEMILLAS.map((s) => generar(g, s, d).id));
            expect(distintas.size).toBeGreaterThan(1);
          }
        }
      });

      it("las preguntas son válidas en las tres dificultades", () => {
        for (const g of generadores) {
          for (const d of DIFICULTADES) {
            for (const s of SEMILLAS) comprobarPregunta(generar(g, s, d), id, d);
          }
        }
      });

      it("da al menos 12 preguntas distintas y 4 por dificultad", () => {
        const total = new Set<string>();
        for (const d of DIFICULTADES) {
          const porDificultad = new Set<string>();
          for (const g of generadores) {
            for (const s of SEMILLAS) {
              const p = generar(g, s, d);
              porDificultad.add(p.plantilla ?? p.id);
              total.add(p.plantilla ?? p.id);
            }
          }
          expect(porDificultad.size).toBeGreaterThanOrEqual(4);
        }
        expect(total.size).toBeGreaterThanOrEqual(12);
      });

      const oraculo = oraculos[id];
      if (oraculo !== undefined) {
        it("el oráculo recalcula la respuesta correcta desde lo que ve el niño", () => {
          for (const g of generadores) {
            for (const d of DIFICULTADES) {
              for (const s of SEMILLAS) {
                const p = generar(g, s, d);
                const correcta = p.formato === "numero" ? p.respuestaCorrecta : (p.opciones ?? []).find((o) => o.id === p.respuestaCorrecta)?.texto;
                expect(oraculo(p), `${p.enunciado}`).toBe(correcta);
              }
            }
          }
        });
      }
    });
  });
}
