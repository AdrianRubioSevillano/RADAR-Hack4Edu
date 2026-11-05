// Contenido de Ciclo II en francés.
import { describe, expect, it } from "vitest";
import { flujo } from "../../src/core/rng.ts";
import { NOMBRES } from "../../src/content/ayuda.ts";
import { bancoDeTest, generarPregunta, lenguaDe, miniTest, paqueteDePractica } from "../../src/content/bancos.ts";
import { describirImagen } from "../../src/content/imagenes.ts";
import { textoParaEscuchar, textoRespuesta } from "../../src/content/respuestas.ts";
import { SUBHABILIDADES } from "../../src/content/temario.ts";
import { TESTS } from "../../src/content/tests.ts";
import type { Dificultad, Imagen, Pregunta } from "../../src/content/tipos.ts";
import { empezarTest, preguntaActual, claseVacia, anadirAlumno, alternarAsignacion } from "../../src/services/clase.ts";

const subs = SUBHABILIDADES.filter((s) => /^(NUM|LEE|PEN)2-/.test(s.id)).map((s) => s.id);
const DIFICULTADES: readonly Dificultad[] = [1, 2, 3];
const SEMILLAS = 60;

// Palabras y signos que solo son españoles. Los nombres propios se quitan antes.
const ESPANOL = /[¿¡ñ]|(?<!\p{L})(el|los|las|una|unos|hay|qué|cuánt\p{L}*|cuál|moneda\p{L}*|tiene|para|por|con|del|mira|toca|suma|cada|también|pero)(?!\p{L})/iu;

function textosDe(imagen: Imagen | undefined): readonly string[] {
  if (imagen === undefined) return [];
  if (imagen.tipo === "cartel") return [imagen.titulo, ...imagen.lineas];
  if (imagen.tipo === "tabla") return [imagen.titulo ?? "", ...imagen.cabeceras, ...imagen.filas.flat()];
  if (imagen.tipo === "tiras") return imagen.tiras.map((t) => t.etiqueta);
  return [];
}

function textos(p: Pregunta): readonly string[] {
  return [
    p.enunciado, p.enunciadoFacil, p.pista, p.explicacion, p.texto ?? "", p.titulo ?? "",
    ...(p.opciones ?? []).flatMap((o) => [o.texto, ...textosDe(o.imagen)]),
    ...textosDe(p.imagen),
    p.imagen === undefined ? "" : describirImagen(p.imagen, "fr"),
  ];
}

const sinNombres = (t: string): string => NOMBRES.reduce((r, n) => r.replaceAll(n, ""), t);

function cada(accion: (p: Pregunta, sub: string, semilla: number, d: Dificultad) => void): void {
  for (const sub of subs) for (const d of DIFICULTADES) for (let n = 0; n < SEMILLAS; n += 1) {
    accion(generarPregunta(sub, flujo(n, `fr/${sub}/${d}`), d, "fr"), sub, n, d);
  }
}

describe("Ciclo II en francés", () => {
  it("son todas las subhabilidades de Ciclo II", () => {
    expect(subs.length).toBeGreaterThanOrEqual(30);
    for (const s of subs) expect(lenguaDe(s, "fr")).toBe("fr");
    expect(lenguaDe("NUM3-T1-a", "fr")).toBe("es");
    expect(lenguaDe("NUM2-T1-a", "gn")).toBe("es");
  });

  it("todas se generan y van marcadas en francés", () => {
    cada((p) => {
      expect(p.idioma).toBe("fr");
      expect(p.enunciado.trim()).not.toBe("");
      expect(p.enunciadoFacil.trim()).not.toBe("");
      expect(p.pista.trim()).not.toBe("");
      expect(p.explicacion.trim()).not.toBe("");
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

  it("sin texto en español", () => {
    cada((p) => {
      for (const t of textos(p)) expect(sinNombres(t), `${p.subhabilidad}: ${t}`).not.toMatch(ESPANOL);
    });
  });

  it("sin variables sin rellenar", () => {
    cada((p) => {
      for (const t of textos(p)) expect(t, p.id).not.toMatch(/\{[A-Z]\d\}|undefined|NaN/);
    });
  });

  it("NUM: misma semilla, misma lógica y misma respuesta que en español", () => {
    for (const sub of subs.filter((s) => s.startsWith("NUM"))) for (const d of DIFICULTADES) for (let n = 0; n < SEMILLAS; n += 1) {
      const es = generarPregunta(sub, flujo(n, `par/${sub}/${d}`), d, "es");
      const fr = generarPregunta(sub, flujo(n, `par/${sub}/${d}`), d, "fr");
      expect([fr.formato, fr.respuestaCorrecta, fr.dificultad, fr.opciones?.length]).toEqual([es.formato, es.respuestaCorrecta, es.dificultad, es.opciones?.length]);
    }
  });

  it("en español nada cambia: sin idioma y con la misma salida", () => {
    const p = generarPregunta("NUM2-T3-a", flujo(1, "x"), 1);
    expect(p.idioma).toBeUndefined();
    expect(p).toEqual(generarPregunta("NUM2-T3-a", flujo(1, "x"), 1, "es"));
    expect(p.enunciado).toMatch(/moneda/i);
  });

  it("la elisión delante de nombres funciona", () => {
    const con = generarPregunta("LEE2-T3-a", flujo(3, "x"), 1, "fr");
    expect(con.idioma).toBe("fr");
    cada((p) => {
      for (const t of textos(p)) expect(t).not.toMatch(/\b[Dd]e (?=[AEIOU][a-zé])/);
    });
  });

  it("los 21 tests de Ciclo II se montan en francés sin repetir", () => {
    for (const test of TESTS.filter((t) => t.curso === 2)) {
      const banco = bancoDeTest(test, 2026, "fr");
      expect(new Set(banco.map((p) => p.id)).size).toBe(banco.length);
      expect(banco.length, test.id).toBeGreaterThanOrEqual(test.preguntas);
      expect(banco.every((p) => p.idioma === "fr")).toBe(true);
    }
  });

  it("la práctica y el reto salen en francés, solo de esa subhabilidad y de fácil a difícil", () => {
    const paquete = paqueteDePractica("NUM2-T3-c", 7, [], "fr");
    expect(paquete.map((p) => p.dificultad)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(paquete.every((p) => p.idioma === "fr" && p.subhabilidad === "NUM2-T3-c")).toBe(true);
    expect(miniTest("NUM2-T3-c", 7, paquete, "fr").every((p) => p.idioma === "fr")).toBe(true);
  });

  it("un test se queda en el idioma con el que empezó", () => {
    const base = alternarAsignacion(anadirAlumno(claseVacia(1, 2), "Ana"), "NUM2-T3");
    const alumno = base.alumnos[0]?.id ?? "";
    expect(preguntaActual(empezarTest(base, alumno, "NUM2-T3", "fr"), alumno, "NUM2-T3")?.idioma).toBe("fr");
    expect(preguntaActual(empezarTest(base, alumno, "NUM2-T3", "gn"), alumno, "NUM2-T3")?.idioma).toBeUndefined();
    expect(preguntaActual(empezarTest(base, alumno, "NUM2-T3"), alumno, "NUM2-T3")?.idioma).toBeUndefined();
  });

  it("lo que se escucha va en la lengua de la pregunta", () => {
    const p = generarPregunta("PEN2-T2-a", flujo(1, "x"), 1, "fr");
    expect(textoParaEscuchar(p, false)).toContain("Option 1");
    expect(textoParaEscuchar(generarPregunta("PEN2-T2-a", flujo(1, "x"), 1), false)).toContain("Opción 1");
  });
});
