import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { iniciarTest, responder, resultado, siguienteItem, testTerminado } from "../../src/core/test.ts";
import { flujo } from "../../src/core/rng.ts";
import { bancoDeTest, generadoresDe, itemDe, miniTest, paqueteDePractica } from "../../src/content/bancos.ts";
import { GENERADORES } from "../../src/content/generadores/index.ts";
import { esCorrecta, leerNumero, textoRespuesta } from "../../src/content/respuestas.ts";
import { CURSOS, NOMBRE_NIVEL, SUBHABILIDADES, TEMAS } from "../../src/content/temario.ts";
import { TESTS, testPorId, testsDe } from "../../src/content/tests.ts";
import type { Pregunta } from "../../src/content/tipos.ts";

describe("temario", () => {
  it("6 cursos × 3 bloques × 5 temas, con los ids estables de docs/TEMARIO.md", () => {
    expect(TEMAS).toHaveLength(90);
    expect(new Set(TEMAS.map((t) => t.id)).size).toBe(90);
    expect(new Set(SUBHABILIDADES.map((s) => s.id)).size).toBe(SUBHABILIDADES.length);
    expect(SUBHABILIDADES.find((s) => s.id === "NUM2-T3-c")?.nombre).toBe("Cambio sencillo");
    const texto = readFileSync("docs/TEMARIO.md", "utf8");
    for (const t of TEMAS) expect(texto).toContain(t.nombre);
    for (const s of SUBHABILIDADES) expect(texto.toLowerCase()).toContain(s.nombre.toLowerCase());
  });

  it("los niveles visibles son Ciclo I a Ciclo VI", () => {
    expect(CURSOS.map((c) => NOMBRE_NIVEL[c])).toEqual(["Ciclo I", "Ciclo II", "Ciclo III", "Ciclo IV", "Ciclo V", "Ciclo VI"]);
  });

  it("cada subhabilidad del temario tiene al menos un generador, y no sobra ninguno", () => {
    for (const s of SUBHABILIDADES) expect(generadoresDe(s.id).length, s.id).toBeGreaterThan(0);
    expect(Object.keys(GENERADORES).sort()).toEqual(SUBHABILIDADES.map((s) => s.id).sort());
  });
});

describe("los 126 tests", () => {
  it("son 21 por curso: 15 de tema y 6 mezclados", () => {
    expect(TESTS).toHaveLength(126);
    for (const curso of [1, 2, 3, 4, 5, 6] as const) {
      const lista = testsDe(curso);
      expect(lista).toHaveLength(21);
      expect(lista.filter((t) => t.tipo === "tema")).toHaveLength(15);
    }
    expect(testPorId("NUM2-REPASO")?.habilidades).toHaveLength(3);
    expect(testPorId("PEN6-FINAL")?.habilidades).toHaveLength(5);
  });

  it.each(TESTS.map((t) => [t.id]))("%s se monta con sus preguntas sin repetir y cumple el mínimo", (id) => {
    const test = testPorId(id);
    if (test === undefined) throw new Error("sin test");
    for (const semilla of [1, 77]) {
      const banco = bancoDeTest(test, semilla);
      expect(banco.length).toBeGreaterThanOrEqual(test.preguntas);
      const items = banco.map((p) => itemDe(test, p));
      for (const item of items) expect(item.requiere[0]).toBeGreaterThanOrEqual(0);
      let estado = iniciarTest({ k: test.habilidades.length, totalPreguntas: test.preguntas });
      const rng = flujo(semilla, "respuestas");
      const vistas: string[] = [];
      while (!testTerminado(estado)) {
        const item = siguienteItem(estado, items);
        if (item === null) throw new Error(`Faltan preguntas en ${id}`);
        vistas.push(item.id);
        estado = responder(estado, item, rng() < 0.6);
      }
      expect(vistas).toHaveLength(test.preguntas);
      expect(new Set(vistas).size).toBe(test.preguntas);
      for (const r of resultado(estado)) expect(r.respuestas, id).toBeGreaterThanOrEqual(2);
    }
  });

  it("la misma semilla da el mismo banco y otra da otro", () => {
    const test = testPorId("NUM2-T3");
    if (test === undefined) throw new Error("sin test");
    expect(bancoDeTest(test, 5)).toEqual(bancoDeTest(test, 5));
    expect(bancoDeTest(test, 5).map((p) => p.id)).not.toEqual(bancoDeTest(test, 6).map((p) => p.id));
  });
});

describe("refuerzo con contenido real", () => {
  it.each(SUBHABILIDADES.map((s) => [s.id]))("%s: paquete de fácil a difícil, solo de esa subhabilidad, y mini-test nuevo", (id) => {
    const paquete = paqueteDePractica(id, 9);
    expect(paquete.map((p) => p.dificultad)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(paquete.every((p) => p.subhabilidad === id)).toBe(true);
    expect(new Set(paquete.map((p) => p.id)).size).toBe(6);
    const mini = miniTest(id, 10, paquete);
    expect(mini).toHaveLength(3);
    expect(mini.every((p) => p.subhabilidad === id)).toBe(true);
    expect(mini.some((p) => paquete.some((q) => q.id === p.id))).toBe(false);
  });
});

describe("respuestas", () => {
  const numero = (respuestaCorrecta: string): Pregunta => ({ id: "x:1", subhabilidad: "x", dificultad: 1, formato: "numero", enunciado: "", enunciadoFacil: "", respuestaCorrecta, pista: "", explicacion: "", slip: 0.1, guess: 0.05 });

  it("compara números exactos: enteros, decimales con coma o punto y fracciones equivalentes", () => {
    expect(esCorrecta(numero("3,5"), "3,50")).toBe(true);
    expect(esCorrecta(numero("3,5"), "3.5")).toBe(true);
    expect(esCorrecta(numero("3/4"), "6/8")).toBe(true);
    expect(esCorrecta(numero("45"), " 45 ")).toBe(true);
    expect(esCorrecta(numero("45"), "46")).toBe(false);
    expect(esCorrecta(numero("45"), "cuarenta")).toBe(false);
    expect(leerNumero("3/0")).toBeNull();
  });

  it("la respuesta mostrada es la opción correcta", () => {
    const p: Pregunta = { ...numero("b"), formato: "opcion", opciones: [{ id: "a", texto: "uno" }, { id: "b", texto: "dos" }, { id: "c", texto: "tres" }] };
    expect(textoRespuesta(p)).toBe("dos");
    expect(esCorrecta(p, "b")).toBe(true);
    expect(esCorrecta(p, "a")).toBe(false);
  });
});
