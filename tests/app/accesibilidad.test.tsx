import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClaseProvider } from "../../src/components/ClaseProvider.tsx";
import { PreguntaVista } from "../../src/components/PreguntaVista.tsx";
import type { Pregunta } from "../../src/content/tipos.ts";
import { crearDemo } from "../../src/services/demo.ts";
import { PRESENTACION_BASE, atributosDe, pausaTras, presentacionDe } from "../../src/services/perfiles.ts";
import { pintar, pintarElemento, texto } from "./apoyo.tsx";

const pregunta: Pregunta = {
  id: "NUM2-T3-c:prueba",
  subhabilidad: "NUM2-T3-c",
  dificultad: 1,
  formato: "opcion",
  enunciado: "Si pagas con 10 monedas algo que cuesta 7, ¿cuántas monedas te devuelven?",
  enunciadoFacil: "Pagas 10. Cuesta 7. ¿Cuánto te devuelven?",
  opciones: [{ id: "a", texto: "3" }, { id: "b", texto: "7" }, { id: "c", texto: "17" }],
  respuestaCorrecta: "a",
  pista: "Quita el precio a lo que has pagado.",
  explicacion: "10 menos 7 son 3.",
  slip: 0.08,
  guess: 1 / 3,
};

function vista(ayudas: Parameters<typeof presentacionDe>[0], curso: 2 | 5 = 5): string {
  vi.stubGlobal("localStorage", undefined);
  return pintarElemento(<ClaseProvider><PreguntaVista pregunta={pregunta} presentacion={presentacionDe(ayudas, curso)} onContinuar={() => undefined} /></ClaseProvider>);
}

// Un puerto de voz falso con una voz local en español.
function conVoz() {
  vi.stubGlobal("speechSynthesis", { getVoices: () => [{ lang: "es-ES", localService: true }], speak: () => undefined, cancel: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined });
  vi.stubGlobal("SpeechSynthesisUtterance", function Utterance() { return {}; });
}

beforeEach(() => vi.unstubAllGlobals());

describe("perfiles", () => {
  it("con dislexia se muestra enunciadoFacil y, sin perfil, el enunciado normal", () => {
    expect(texto(vista(["dislexia"]))).toContain(pregunta.enunciadoFacil);
    expect(texto(vista(["dislexia"]))).not.toContain(pregunta.enunciado);
    expect(texto(vista([]))).toContain("Si pagas con 10 monedas");
  });

  it("las opciones son las mismas en todos los perfiles: solo cambia la presentación", () => {
    for (const ayudas of [[], ["dislexia"], ["tdah"], ["bajaVision"], ["auditiva"]] as const) {
      const html = texto(vista(ayudas));
      for (const o of pregunta.opciones ?? []) expect(html).toContain(o.texto);
    }
  });

  it("dislexia y baja visión tienen voz; también 1.º y 2.º; auditiva sola no", () => {
    expect(presentacionDe(["dislexia"], 5).escuchar).toBe(true);
    expect(presentacionDe(["bajaVision"], 5).escuchar).toBe(true);
    expect(presentacionDe([], 2).escuchar).toBe(true);
    expect(presentacionDe([], 5).escuchar).toBe(false);
    expect(presentacionDe(["auditiva"], 2).escuchar).toBe(false);
    expect(presentacionDe(["auditiva", "dislexia"], 2).escuchar).toBe(true);
  });

  it("el botón Escuchar aparece con voz y se oculta sin voz, sin errores", () => {
    expect(texto(vista(["dislexia"]))).not.toContain("Escuchar");
    conVoz();
    expect(texto(pintarElemento(<ClaseProvider><PreguntaVista pregunta={pregunta} presentacion={presentacionDe(["dislexia"], 5)} onContinuar={() => undefined} /></ClaseProvider>))).toContain("Escuchar");
  });

  it("baja visión: letra al 150 % y alto contraste; se pueden combinar", () => {
    expect(atributosDe(presentacionDe(["bajaVision"], 3))).toMatchObject({ "data-letra": "muyGrande", "data-contraste": "alto" });
    const combinado = presentacionDe(["dislexia", "bajaVision", "tdah"], 3);
    expect(combinado).toMatchObject({ enunciadoFacil: true, letra: "muyGrande", barraProgreso: true, pausas: true, altoContraste: true });
    expect(atributosDe(PRESENTACION_BASE)).toMatchObject({ "data-letra": "normal", "data-contraste": "normal" });
  });

  it("TDAH: pausa cada 5 y dos partes si el test es largo; sin perfil, ninguna", () => {
    const p = presentacionDe(["tdah"], 3);
    expect([1, 4, 5, 6, 9, 10].map((n) => pausaTras(n, 10, p))).toEqual([null, null, "descanso", null, null, null]);
    expect(pausaTras(6, 12, p)).toBe("parte");
    expect(pausaTras(5, 12, p)).toBe("descanso");
    expect(pausaTras(8, 15, p)).toBe("parte");
    expect(pausaTras(5, 10, PRESENTACION_BASE)).toBeNull();
  });

  it("auditiva: ningún feedback depende del audio", () => {
    expect(vista(["auditiva"])).not.toMatch(/<audio|<video/);
    expect(presentacionDe(["auditiva"], 5).escuchar).toBe(false);
  });
});

describe("ningún texto técnico visible", () => {
  const PROHIBIDO = /probabilidad|bits?\b|prior|posterior|entrop[ií]a|EIG|DINA|bayes|slip|guess|\b0[.,]\d{2,}\b|\d+\s*%/i;
  const demo = crearDemo();
  const amina = demo.alumnos.find((a) => a.nombre === "Amina")?.id as string;

  it.each(["#/", "#/alumno", `#/alumno/${amina}`, "#/alumno/A01", "#/acerca"])("%s", (hash) => {
    expect(texto(pintar(hash, demo))).not.toMatch(PROHIBIDO);
  });

  it.each(["#/profesor", "#/profesor/ajustes", "#/profesor/alumno/A02"])("%s (profesor)", (hash) => {
    expect(texto(pintar(hash, demo, true))).not.toMatch(PROHIBIDO);
  });
});

describe("semáforo sin depender del color", () => {
  it("cada estado lleva texto accesible en la cuadrícula", () => {
    const html = pintar("#/profesor", crearDemo(), true);
    expect(html).toContain("Necesita refuerzo");
    expect(html).toContain("Lo domina");
    expect(html).toContain('class="sr-only"');
  });
});
