import { describe, expect, it } from "vitest";
import { actualizar, aplicarPractica, crearPrior, esCompatible, marginales } from "../../src/core/bayes.ts";
import { numeroEstados } from "../../src/core/dina.ts";
import { entropiaBinaria, entropiaConjunta } from "../../src/core/entropia.ts";
import { crearRng, flujo } from "../../src/core/rng.ts";
import { eig, mejorItem } from "../../src/core/seleccion.ts";
import { aplicarMiniTest, iniciarTest, responder, resultado, siguienteItem, testTerminado } from "../../src/core/test.ts";
import { MotorError, type Item } from "../../src/core/tipos.ts";

const item = (id: string, habilidad: number, slip = 0.1, guess = 0.2): Item => ({ id, requiere: [habilidad], slip, guess });

function banco(k: number, porHabilidad = 10): Item[] {
  return Array.from({ length: k }, (_, h) => Array.from({ length: porHabilidad }, (_, i) => item(`h${h}-q${String(i).padStart(2, "0")}`, h))).flat();
}

describe("rng", () => {
  it("misma semilla, misma secuencia; flujos distintos no se alteran entre sí", () => {
    const a = crearRng(7);
    const b = crearRng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(flujo(7, "x")()).not.toBe(flujo(7, "y")());
    expect(flujo(7, "x").semilla).toBe(7);
  });
});

describe("Bayes con K variable", () => {
  it("caso calculado a mano con K = 2", () => {
    const prior = crearPrior(2, { epsilon: 1 });
    expect(prior).toEqual([0.25, 0.25, 0.25, 0.25]);
    // Acierto en la habilidad 0 con s = 0.1, g = 0.2: pesos .05, .225, .05, .225; total .55.
    const posterior = actualizar(prior, item("q", 0), true);
    expect(posterior[0]).toBeCloseTo(0.05 / 0.55, 12);
    expect(posterior[1]).toBeCloseTo(0.225 / 0.55, 12);
    const [p0, p1] = marginales(posterior);
    expect(p0).toBeCloseTo(0.45 / 0.55, 12);
    expect(p1).toBeCloseTo(0.5, 12);
  });

  it("caso calculado a mano con K = 3 y prior de prerrequisitos", () => {
    // Compatibles 000, 001, 011, 111 con peso 1; el resto con ε = 0.1: total 4.4.
    const prior = crearPrior(3, { epsilon: 0.1 });
    expect(prior[0b011]).toBeCloseTo(1 / 4.4, 12);
    expect(prior[0b101]).toBeCloseTo(0.1 / 4.4, 12);
    const [a, b, c] = marginales(prior);
    expect(a).toBeCloseTo(3.1 / 4.4, 12);
    expect(b).toBeCloseTo(2.2 / 4.4, 12);
    expect(c).toBeCloseTo(1.3 / 4.4, 12);
  });

  it("K admitidos: 1 a 8; la conjunta suma 1 y no muta", () => {
    for (const k of [1, 2, 3, 5, 8]) {
      const prior = crearPrior(k);
      expect(prior).toHaveLength(numeroEstados(k));
      const copia = [...prior];
      const posterior = actualizar(prior, item("q", k - 1), false);
      expect(prior).toEqual(copia);
      expect(posterior.reduce((s, m) => s + m, 0)).toBeCloseTo(1, 12);
    }
    expect(() => crearPrior(9)).toThrow(MotorError);
    expect(() => crearPrior(0)).toThrow(MotorError);
  });

  it("rechaza parámetros inválidos con error tipado", () => {
    const prior = crearPrior(2);
    expect(() => actualizar(prior, item("q", 0, 0.6, 0.5), true)).toThrow(MotorError);
    expect(() => actualizar(prior, item("q", 5), true)).toThrow(MotorError);
    expect(() => crearPrior(2, { epsilon: 0 })).toThrow(MotorError);
  });

  it("una pregunta multihabilidad exige todas (DINA conjuntivo)", () => {
    const prior = crearPrior(2, { epsilon: 1 });
    const q: Item = { id: "q", requiere: [0, 1], slip: 0.1, guess: 0.2 };
    const posterior = actualizar(prior, q, true);
    expect(posterior[0b11]).toBeCloseTo(0.225 / (0.05 * 3 + 0.225), 12);
  });

  it("esCompatible reconoce los prefijos de la cadena", () => {
    expect([0, 1, 3, 7].every(esCompatible)).toBe(true);
    expect([2, 4, 5, 6].some(esCompatible)).toBe(false);
  });

  it("la práctica mueve masa hacia dominar, exactamente", () => {
    const prior = crearPrior(1, { p0: 0.2, epsilon: 1 });
    const [p] = marginales(aplicarPractica(prior, 0, 0.5));
    expect(p).toBeCloseTo(0.2 + 0.8 * 0.5, 12);
  });
});

describe("EIG", () => {
  it("valor conocido, EIG ≥ 0 y 0 si la pregunta no informa", () => {
    expect(entropiaBinaria(0.5)).toBe(1);
    expect(entropiaBinaria(0)).toBe(0);
    expect(entropiaConjunta([0.25, 0.25, 0.25, 0.25])).toBe(2);
    const prior = crearPrior(1, { epsilon: 1 });
    // P(Y=1) = .55; EIG = H(.55) − (H(.9) + H(.2)) / 2.
    const esperado = entropiaBinaria(0.55) - (entropiaBinaria(0.9) + entropiaBinaria(0.2)) / 2;
    expect(eig(prior, item("q", 0))).toBeCloseTo(esperado, 12);
    for (const q of banco(3, 2)) expect(eig(crearPrior(3), q)).toBeGreaterThanOrEqual(0);
    expect(eig([1, 0], item("q", 0))).toBeCloseTo(0, 12);
  });

  it("desempata por menor id entre las empatadas con el máximo global", () => {
    const candidatos = [item("z", 0), item("b", 0), item("c", 0)];
    expect(mejorItem(crearPrior(1), candidatos)?.id).toBe("b");
    expect(mejorItem(crearPrior(1), [])).toBeNull();
  });
});

describe("test adaptativo", () => {
  const candidatos = banco(3);

  it("tras fallar la primera pregunta, la segunda cambia respecto a acertarla", () => {
    const inicio = iniciarTest({ k: 3, totalPreguntas: 10 });
    const primera = siguienteItem(inicio, candidatos);
    if (primera === null) throw new Error("sin pregunta");
    const siFalla = siguienteItem(responder(inicio, primera, false), candidatos);
    const siAcierta = siguienteItem(responder(inicio, primera, true), candidatos);
    expect(siFalla?.id).not.toBe(siAcierta?.id);
    expect(siFalla?.requiere).not.toEqual(siAcierta?.requiere);
  });

  it("con el prior independiente las dos ramas serían la misma habilidad: el de prerrequisitos es el que las separa", () => {
    const inicio = iniciarTest({ k: 3, totalPreguntas: 10, prior: { epsilon: 1 } });
    const primera = siguienteItem(inicio, candidatos);
    if (primera === null) throw new Error("sin pregunta");
    const fallo = siguienteItem(responder(inicio, primera, false), candidatos);
    const acierto = siguienteItem(responder(inicio, primera, true), candidatos);
    expect(fallo?.requiere).toEqual(acierto?.requiere);
  });

  it("no repite preguntas, se detiene y es determinista", () => {
    const correr = (patron: (i: number) => boolean) => {
      let estado = iniciarTest({ k: 3, totalPreguntas: 10 });
      const ids: string[] = [];
      for (let i = 0; !testTerminado(estado); i += 1) {
        const q = siguienteItem(estado, candidatos);
        if (q === null) throw new Error("sin pregunta");
        ids.push(q.id);
        estado = responder(estado, q, patron(i));
      }
      return { ids, estado };
    };
    const { ids, estado } = correr((i) => i % 3 !== 0);
    expect(new Set(ids).size).toBe(10);
    expect(correr((i) => i % 3 !== 0).ids).toEqual(ids);
    expect(siguienteItem(estado, candidatos)).toBeNull();
    expect(() => responder(estado, candidatos.find((c) => c.id === ids[0]) as Item, true)).toThrow(MotorError);
  });

  it("garantiza el mínimo de 2 por habilidad incluso con EIG concentrada", () => {
    for (const k of [2, 3, 5]) {
      const lista = banco(k);
      let estado = iniciarTest({ k, totalPreguntas: 2 * k + 1 });
      while (!testTerminado(estado)) {
        const q = siguienteItem(estado, lista);
        if (q === null) throw new Error("sin pregunta");
        estado = responder(estado, q, false);
      }
      for (const r of resultado(estado)) expect(r.respuestas).toBeGreaterThanOrEqual(2);
    }
  });

  it("un alumno que falla solo la última habilidad queda en rojo solo ahí", () => {
    let estado = iniciarTest({ k: 3, totalPreguntas: 10 });
    while (!testTerminado(estado)) {
      const q = siguienteItem(estado, candidatos);
      if (q === null) throw new Error("sin pregunta");
      estado = responder(estado, q, q.requiere[0] !== 2);
    }
    expect(resultado(estado).map((r) => r.color)).toEqual(["verde", "verde", "rojo"]);
  });

  it("el mini-test con 3 aciertos saca del rojo, y con 3 fallos no", () => {
    let estado = iniciarTest({ k: 2, totalPreguntas: 8 });
    const lista = banco(2);
    while (!testTerminado(estado)) {
      const q = siguienteItem(estado, lista);
      if (q === null) throw new Error("sin pregunta");
      estado = responder(estado, q, q.requiere[0] === 0);
    }
    expect(resultado(estado)[1]?.color).toBe("rojo");
    const mini = (acierto: boolean) => [0, 1, 2].map((i) => ({ item: item(`m${i}`, 1), acierto }));
    expect(resultado(aplicarMiniTest(estado, 1, mini(true)))[1]?.color).toBe("verde");
    expect(resultado(aplicarMiniTest(estado, 1, mini(false)))[1]?.color).toBe("rojo");
  });
});
