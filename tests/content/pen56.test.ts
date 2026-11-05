import { describe, expect, it } from "vitest";
import { comprobarGeneradores } from "./arnes.ts";
import { ORACULOS_PEN56 } from "./oraculos/pen56.ts";
import { flujo } from "../../src/core/rng.ts";
import { GENERADORES, GENERADORES_CALCULADOS } from "../../src/content/generadores/pen56.ts";
import { SITUACIONES_5 } from "../../src/content/generadores/pen56/situaciones5.ts";
import { SITUACIONES_6 } from "../../src/content/generadores/pen56/situaciones6.ts";
import { SUBHABILIDADES } from "../../src/content/temario.ts";
import type { Dificultad } from "../../src/content/tipos.ts";

const ids = SUBHABILIDADES.map((s) => s.id).filter((id) => /^PEN[56]-/.test(id));

comprobarGeneradores("PEN 5.º y 6.º", GENERADORES, ids);

describe("PEN 5.º y 6.º: comprobaciones propias", () => {
  it("son las 23 subhabilidades", () => {
    expect(ids).toHaveLength(23);
  });

  // El oráculo solo lee lo que ve el niño y resuelve por fuerza bruta o recalculando.
  describe.each(Object.keys(ORACULOS_PEN56).map((id) => [id]))("oráculo %s", (id) => {
    it("recalcula la respuesta y la solución es única", () => {
      const oraculo = ORACULOS_PEN56[id];
      if (oraculo === undefined) throw new Error(id);
      for (const g of GENERADORES_CALCULADOS[id] ?? []) {
        for (const d of [1, 2, 3] as const satisfies readonly Dificultad[]) {
          for (let s = 0; s < 150; s += 1) {
            const p = g(flujo(s * 104729 + 7, "oraculo"), d);
            const correcta = p.formato === "numero" ? p.respuestaCorrecta : p.opciones?.find((o) => o.id === p.respuestaCorrecta)?.texto;
            expect(oraculo(p), `${p.enunciado} ${JSON.stringify(p.imagen)}`).toBe(correcta);
          }
        }
      }
    });
  });

  it("en lo escrito, la correcta no es casi siempre la opción más larga", () => {
    const porSub = new Map<string, { total: number; larga: number }>();
    for (const s of [...SITUACIONES_5, ...SITUACIONES_6]) {
      const c = porSub.get(s.sub) ?? { total: 0, larga: 0 };
      c.total += 1;
      if (s.distractores.every((x) => x.length < s.correcta.length)) c.larga += 1;
      porSub.set(s.sub, c);
    }
    for (const [sub, c] of porSub) expect(c.larga / c.total, sub).toBeLessThanOrEqual(0.6);
  });
});
