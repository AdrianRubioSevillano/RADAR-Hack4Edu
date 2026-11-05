import { describe, expect, it } from "vitest";
import { flujo } from "../../src/core/rng.ts";
import { GENERADORES } from "../../src/content/generadores/pen34.ts";
import { TEMAS } from "../../src/content/temario.ts";
import type { Dificultad, Pregunta } from "../../src/content/tipos.ts";
import { comprobarGeneradores } from "./arnes.ts";
import { ORACULOS_PEN34, ORACULOS_PARCIALES_PEN34 } from "./oraculos/pen34.ts";

const IDS = TEMAS.filter((t) => t.bloque === "PEN" && (t.curso === 3 || t.curso === 4)).flatMap((t) => t.subhabilidades.map((s) => s.id));

comprobarGeneradores("PEN 3.º y 4.º", GENERADORES, IDS, ORACULOS_PEN34);

function muestras(id: string): Pregunta[] {
  const salida: Pregunta[] = [];
  for (const g of GENERADORES[id] ?? []) {
    for (const d of [1, 2, 3] as const satisfies readonly Dificultad[]) {
      for (let s = 0; s < 150; s += 1) salida.push(g(flujo(s * 104729 + 7, "pen34"), d));
    }
  }
  return salida;
}

describe("PEN 3.º y 4.º: calidad", () => {
  it.each(IDS.map((id) => [id]))("%s: el enunciado fácil conserva los números y la correcta no se delata", (id) => {
    let masLarga = 0;
    let conOpciones = 0;
    for (const p of muestras(id)) {
      const numeros = (t: string): string[] => t.match(/\d+(:\d+)?/g) ?? [];
      const faciles = new Set(numeros(p.enunciadoFacil));
      for (const n of numeros(p.enunciado)) expect(faciles.has(n), `${p.enunciado} || ${p.enunciadoFacil}`).toBe(true);
      expect(p.enunciadoFacil.length, p.enunciado).toBeLessThanOrEqual(p.enunciado.length + 60);
      if (p.opciones !== undefined && !p.opciones.some((o) => /^\d+$/.test(o.texto))) {
        conOpciones += 1;
        const correcta = p.opciones.find((o) => o.id === p.respuestaCorrecta);
        const otras = p.opciones.filter((o) => o !== correcta).map((o) => o.texto.length);
        if ((correcta?.texto.length ?? 0) > Math.max(...otras)) masLarga += 1;
      }
    }
    if (conOpciones > 0) expect(masLarga / conOpciones).toBeLessThan(0.6);
  });

  it("los decimales y las concordancias básicas son correctos", () => {
    for (const id of IDS) {
      for (const p of muestras(id)) {
        const textos = [p.enunciado, p.enunciadoFacil, p.pista, p.explicacion, ...(p.opciones ?? []).map((o) => o.texto)];
        for (const t of textos) {
          expect(t).not.toMatch(/\b1 monedas\b|\b1 minutos\b|\b1 semanas\b|\b([2-9]|\d\d) moneda\b|\b([2-9]|\d\d) minuto\b|\b([2-9]|\d\d) semana\b/);
          expect(t).not.toMatch(/\bvosotros\b|\bvais\b|\bpodréis\b|\{[A-Z]/);
        }
      }
    }
  });

  it.each(Object.keys(ORACULOS_PARCIALES_PEN34).map((id) => [id]))("%s: los casos calculados coinciden con el oráculo", (id) => {
    const oraculo = ORACULOS_PARCIALES_PEN34[id];
    let revisadas = 0;
    for (const p of muestras(id)) {
      const esperada = oraculo?.(p) ?? null;
      if (esperada === null) continue;
      revisadas += 1;
      const correcta = p.formato === "numero" ? p.respuestaCorrecta : p.opciones?.find((o) => o.id === p.respuestaCorrecta)?.texto;
      expect(esperada, p.enunciado).toBe(correcta);
    }
    expect(revisadas).toBeGreaterThan(50);
  });
});
