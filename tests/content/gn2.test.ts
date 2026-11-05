// NUM2 en guaraní: lógica y respuestas iguales que en español. LEE2 y PEN2 siguen en español.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { IdiomaProvider } from "../../src/components/IdiomaProvider.tsx";
import { AvisoContenido } from "../../src/components/SelectorIdioma.tsx";
import { flujo } from "../../src/core/rng.ts";
import { NOMBRES } from "../../src/content/ayuda.ts";
import { bancoDeTest, generarPregunta, lenguaDe, miniTest, paqueteDePractica } from "../../src/content/bancos.ts";
import { describirImagen } from "../../src/content/imagenes.ts";
import { textoRespuesta } from "../../src/content/respuestas.ts";
import { SUBHABILIDADES } from "../../src/content/temario.ts";
import { TESTS } from "../../src/content/tests.ts";
import type { Dificultad, Imagen, Pregunta } from "../../src/content/tipos.ts";
import { vozDe } from "../../src/services/speech.ts";

const subs = SUBHABILIDADES.filter((s) => s.id.startsWith("NUM2-")).map((s) => s.id);
const DIFICULTADES: readonly Dificultad[] = [1, 2, 3];
const SEMILLAS = 60;

// Solo español. "moneda", "decena", "unidad" y parecidas son préstamos admitidos: ver el glosario.
const ESPANOL = /[¿¡]|(?<!\p{L})(el|los|las|una|unos|hay|qué|cuánt\p{L}*|cuál|tiene|para|por|con|del|mira|toca|suma|cada|también|pero|que|de|en)(?!\p{L})|(?<!\p{L})(lunes|martes|enero|febrero|marzo|abril)(?!\p{L})/iu;
const FRANCES = /(?<!\p{L})(le|les|des|une|combien|pièces?|est|et|il|tu)(?!\p{L})/iu;

function textosDe(imagen: Imagen | undefined): readonly string[] {
  if (imagen === undefined) return [];
  if (imagen.tipo === "cartel") return [imagen.titulo, ...imagen.lineas];
  if (imagen.tipo === "tabla") return [imagen.titulo ?? "", ...imagen.cabeceras, ...imagen.filas.flat()];
  return [];
}

const textos = (p: Pregunta): readonly string[] => [
  p.enunciado, p.enunciadoFacil, p.pista, p.explicacion,
  ...(p.opciones ?? []).flatMap((o) => [o.texto, ...textosDe(o.imagen), o.imagen === undefined ? "" : describirImagen(o.imagen, "gn")]),
  ...textosDe(p.imagen),
  p.imagen === undefined ? "" : describirImagen(p.imagen, "gn"),
];

const sinNombres = (t: string): string => NOMBRES.reduce((r, n) => r.replaceAll(n, ""), t);

function cada(accion: (p: Pregunta) => void): void {
  for (const sub of subs) for (const d of DIFICULTADES) for (let n = 0; n < SEMILLAS; n += 1) accion(generarPregunta(sub, flujo(n, `gn/${sub}/${d}`), d, "gn"));
}

describe("NUM2 en guaraní", () => {
  it("solo NUM2 está en guaraní", () => {
    expect(subs).toHaveLength(15);
    for (const s of subs) expect(lenguaDe(s, "gn")).toBe("gn");
    expect(lenguaDe("LEE2-T1-a", "gn")).toBe("es");
    expect(lenguaDe("PEN2-T2-a", "gn")).toBe("es");
    expect(lenguaDe("NUM3-T1-a", "gn")).toBe("es");
    expect(generarPregunta("LEE2-T1-a", flujo(1, "x"), 1, "gn").idioma).toBeUndefined();
  });

  it("todas se generan y van marcadas en guaraní", () => {
    cada((p) => {
      expect(p.idioma).toBe("gn");
      for (const t of [p.enunciado, p.enunciadoFacil, p.pista, p.explicacion]) expect(t.trim()).not.toBe("");
    });
  });

  it("sin opciones duplicadas y con la correcta entre ellas", () => {
    cada((p) => {
      if (p.formato === "numero") return;
      const opciones = p.opciones ?? [];
      expect(new Set(opciones.map((o) => o.texto.toLowerCase())).size, p.id).toBe(opciones.length);
      expect(opciones.map((o) => o.id)).toContain(p.respuestaCorrecta);
      expect(textoRespuesta(p)).not.toBe("");
    });
  });

  it("sin texto en español ni en francés", () => {
    cada((p) => {
      for (const t of textos(p)) {
        expect(sinNombres(t), `${p.subhabilidad}: ${t}`).not.toMatch(ESPANOL);
        expect(sinNombres(t), `${p.subhabilidad}: ${t}`).not.toMatch(FRANCES);
        expect(t).not.toMatch(/undefined|NaN|\$\{/);
      }
    });
  });

  it("misma semilla, misma lógica y misma respuesta que en español", () => {
    for (const sub of subs) for (const d of DIFICULTADES) for (let n = 0; n < SEMILLAS; n += 1) {
      const es = generarPregunta(sub, flujo(n, `par/${sub}/${d}`), d, "es");
      const gn = generarPregunta(sub, flujo(n, `par/${sub}/${d}`), d, "gn");
      expect([gn.formato, gn.respuestaCorrecta, gn.dificultad, gn.opciones?.length]).toEqual([es.formato, es.respuestaCorrecta, es.dificultad, es.opciones?.length]);
    }
  });

  it("los tests de NUM2 se montan en guaraní sin repetir, y la práctica también sale en guaraní", () => {
    for (const test of TESTS.filter((t) => t.curso === 2 && t.bloque === "NUM")) {
      const banco = bancoDeTest(test, 2026, "gn");
      expect(new Set(banco.map((p) => p.id)).size).toBe(banco.length);
      expect(banco.length, test.id).toBeGreaterThanOrEqual(test.preguntas);
      expect(banco.every((p) => p.idioma === "gn")).toBe(true);
    }
    const paquete = paqueteDePractica("NUM2-T3-c", 7, [], "gn");
    expect(paquete.map((p) => p.dificultad)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(miniTest("NUM2-T3-c", 7, paquete, "gn").every((p) => p.idioma === "gn")).toBe(true);
  });

  it("sale el aviso de revisión con la pregunta en guaraní y, sin voz guaraní, no hay voz", () => {
    const html = renderToStaticMarkup(createElement(IdiomaProvider, { inicial: "gn", children: createElement(AvisoContenido, { pregunta: { idioma: "gn" } }) }));
    expect(html).toContain("Traducción pendiente de revisión por hablantes nativos");
    const port = { speak: () => undefined, cancel: () => undefined, getVoices: () => [{ lang: "es-ES", localService: true }] as unknown as SpeechSynthesisVoice[] };
    expect(vozDe("gn", port)).toBeNull();
  });
});
