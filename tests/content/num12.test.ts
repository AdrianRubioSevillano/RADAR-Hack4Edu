import { describe, expect, it } from "vitest";
import { flujo } from "../../src/core/rng.ts";
import { GENERADORES } from "../../src/content/generadores/num12.ts";
import { SUBHABILIDADES } from "../../src/content/temario.ts";
import type { Dificultad, Pregunta } from "../../src/content/tipos.ts";
import { comprobarGeneradores } from "./arnes.ts";
import { ORACULOS } from "./oraculos/num12.ts";

const IDS = SUBHABILIDADES.filter((s) => /^NUM[12]-/.test(s.id)).map((s) => s.id);

comprobarGeneradores("NUM 1.º y 2.º", GENERADORES, IDS, ORACULOS);

function muestras(id: string): Pregunta[] {
  const salida: Pregunta[] = [];
  for (const g of GENERADORES[id] ?? []) {
    for (const d of [1, 2, 3] as readonly Dificultad[]) {
      for (let s = 0; s < 120; s += 1) salida.push(g(flujo(s * 31 + 7, "num12"), d));
    }
  }
  return salida;
}

const OPERACION = /(\d+) ([+−]) (\d+)/;

describe("reglas propias de NUM 1.º y 2.º", () => {
  it("cada subhabilidad tiene un oráculo", () => {
    expect(Object.keys(ORACULOS).sort()).toEqual([...IDS].sort());
  });

  it("sin llevar no necesita llevar y llevando siempre lo necesita", () => {
    for (const [id, conLlevada] of [["NUM2-T2-a", false], ["NUM2-T2-b", true]] as const) {
      for (const p of muestras(id)) {
        const m = OPERACION.exec(p.enunciado);
        if (m === null || p.enunciado.includes("___")) continue;
        const [a, b] = [Number(m[1]), Number(m[3])];
        const llevada = m[2] === "+" ? (a % 10) + (b % 10) > 9 : a % 10 < b % 10;
        expect(llevada, p.enunciado).toBe(conLlevada);
      }
    }
  });

  it("los resultados y los grupos dibujados respetan el rango del curso", () => {
    for (const id of IDS) {
      const tope = id.startsWith("NUM1") ? 20 : 100;
      for (const p of muestras(id)) {
        const correcta = p.formato === "numero" ? p.respuestaCorrecta : ((p.opciones ?? []).find((o) => o.id === p.respuestaCorrecta)?.texto ?? "");
        if (/^\d+$/.test(correcta) && id !== "NUM2-T4-b") expect(Number(correcta), p.enunciado).toBeLessThanOrEqual(tope);
        if (p.imagen?.tipo === "objetos") expect(Math.max(...p.imagen.grupos.map((g) => g.cantidad)), p.enunciado).toBeLessThanOrEqual(20);
      }
    }
  });

  it("un cuadrado nunca comparte opciones con un rectángulo o un rombo", () => {
    for (const p of muestras("NUM1-T5-a")) {
      const textos = (p.opciones ?? []).map((o) => o.texto);
      if (textos.includes("Cuadrado")) {
        expect(textos).not.toContain("Rectángulo");
        expect(textos).not.toContain("Rombo");
      }
    }
  });

  it("el producto invertido nunca es un distractor", () => {
    for (const id of ["NUM2-T5-a", "NUM2-T5-c"]) {
      for (const p of muestras(id)) {
        const correcta = (p.opciones ?? []).find((o) => o.id === p.respuestaCorrecta)?.texto ?? "";
        const m = /^(\d+) × (\d+)$/.exec(correcta);
        if (m === null || m[1] === m[2]) continue;
        expect((p.opciones ?? []).map((o) => o.texto)).not.toContain(`${m[2]} × ${m[1]}`);
      }
    }
  });
});
