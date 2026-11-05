import { describe, expect, it } from "vitest";
import { flujo } from "../../src/core/rng.ts";
import { GENERADORES } from "../../src/content/generadores/num34.ts";
import { SUBHABILIDADES } from "../../src/content/temario.ts";
import type { Dificultad, Pregunta } from "../../src/content/tipos.ts";
import { comprobarGeneradores } from "./arnes.ts";
import { ORACULOS } from "./oraculos/num34.ts";

const IDS = SUBHABILIDADES.filter((s) => /^NUM[34]-/.test(s.id)).map((s) => s.id);

comprobarGeneradores("NUM 3.º y 4.º", GENERADORES, IDS, ORACULOS);

function todas(): Pregunta[] {
  const salida: Pregunta[] = [];
  for (const id of IDS) {
    for (const g of GENERADORES[id] ?? []) {
      for (const d of [1, 2, 3] as Dificultad[]) {
        for (let s = 0; s < 80; s += 1) salida.push(g(flujo(s * 104729 + 7, "num34"), d));
      }
    }
  }
  return salida;
}

function numeros(t: string): string[] {
  return (t.replace(/(\d) (\d)/g, "$1$2").match(/\d+/g) ?? []);
}

function correcta(p: Pregunta): string {
  return p.formato === "numero" ? p.respuestaCorrecta : (p.opciones ?? []).find((o) => o.id === p.respuestaCorrecta)?.texto ?? "";
}

describe("calidad NUM 3.º y 4.º", () => {
  const preguntas = todas();

  it("cada oráculo también resuelve el enunciado fácil o este conserva sus números", () => {
    for (const p of preguntas) {
      const facil = numeros(p.enunciadoFacil);
      for (const n of numeros(p.enunciado)) expect(facil, `${p.enunciado} => ${p.enunciadoFacil}`).toContain(n);
    }
  });

  it("la pista no da la respuesta numérica", () => {
    for (const p of preguntas) {
      if (p.formato !== "numero" || p.respuestaCorrecta.includes("/")) continue;
      if (numeros(p.enunciado).includes(p.respuestaCorrecta)) continue;
      expect(numeros(p.pista), `${p.enunciado} => ${p.pista}`).not.toContain(p.respuestaCorrecta);
    }
  });

  it("la explicación contiene la respuesta numérica", () => {
    for (const p of preguntas) {
      const r = correcta(p);
      if (!/^\d[\d ]*$/.test(r)) continue;
      expect(numeros(p.explicacion), `${p.enunciado} => ${p.explicacion}`).toContain(r.replace(/ /g, ""));
    }
  });

  it("concuerda el número y no hay negativos ni puntos decimales", () => {
    for (const p of preguntas) {
      const textos = [p.enunciado, p.enunciadoFacil, p.pista, p.explicacion, ...(p.opciones ?? []).map((o) => o.texto)];
      for (const t of textos) {
        expect(t).not.toMatch(/(^|[^\d ])1 (monedas|horas|minutos|kilos|metros|cubitos|barras|placas|centenas|decenas)\b/);
        expect(t).not.toMatch(/(^|\D)[2-9] (moneda|hora|minuto|kilo|metro)\b/);
        expect(t).not.toMatch(/\d\.\d/);
        expect(t).not.toMatch(/(^|[\s(])-\d/);
      }
    }
  });

  it("las fracciones de las opciones no son equivalentes entre sí", () => {
    for (const p of preguntas) {
      const f = (p.opciones ?? []).map((o) => /^(\d+)\/(\d+)$/.exec(o.texto)).filter((m) => m !== null).map((m) => Number(m[1]) / Number(m[2]));
      expect(new Set(f).size, p.enunciado).toBe(f.length);
    }
  });
});
