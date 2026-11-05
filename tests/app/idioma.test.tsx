import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { IdiomaProvider } from "../../src/components/IdiomaProvider.tsx";
import { AvisoContenido } from "../../src/components/SelectorIdioma.tsx";
import { SUBHABILIDADES, TEMAS } from "../../src/content/temario.ts";
import { TESTS } from "../../src/content/tests.ts";
import { DICCIONARIOS, IDIOMAS, crearT, esClave, traducir, type Idioma } from "../../src/i18n/index.ts";
import { nombreHabilidad, nombreSub, nombreTema, nombreTest } from "../../src/i18n/nombres.ts";
import { Acerca } from "../../src/screens/Acerca.tsx";
import { Inicio } from "../../src/screens/Inicio.tsx";
import type { KeyValueStorage } from "../../src/services/almacen.ts";
import { CLAVE_IDIOMA, cargarIdioma, guardarIdioma } from "../../src/services/idioma.ts";
import { idiomaDeLectura, mathToSpeech, speak, vozDe, type SpeechPort } from "../../src/services/speech.ts";

const claves = (i: Idioma) => Object.keys(DICCIONARIOS[i]).sort();
const marcas = (texto: string) => [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

function almacen(inicial: Record<string, string> = {}): KeyValueStorage {
  const datos = new Map(Object.entries(inicial));
  return {
    getItem: (k) => datos.get(k) ?? null,
    setItem: (k, v) => void datos.set(k, v),
    removeItem: (k) => void datos.delete(k),
  };
}

function puerto(voces: readonly { lang: string; localService: boolean }[]): SpeechPort {
  return { speak: () => undefined, cancel: () => undefined, getVoices: () => voces as unknown as SpeechSynthesisVoice[] };
}

describe("diccionarios", () => {
  it("los tres tienen exactamente las mismas claves", () => {
    expect(claves("fr")).toEqual(claves("es"));
    expect(claves("gn")).toEqual(claves("es"));
  });

  it("ningún valor está vacío", () => {
    for (const i of IDIOMAS) for (const [clave, valor] of Object.entries(DICCIONARIOS[i])) expect(valor.trim(), `${i}: ${clave}`).not.toBe("");
  });

  it("las variables {x} son las mismas en todos los idiomas", () => {
    for (const clave of Object.keys(DICCIONARIOS.es)) {
      if (!esClave(clave)) throw new Error(clave);
      for (const i of IDIOMAS) expect(marcas(DICCIONARIOS[i][clave]), `${i}: ${clave}`).toEqual(marcas(DICCIONARIOS.es[clave]));
    }
  });

  it("cada tema, subhabilidad y test tiene nombre, y en español coincide con el temario", () => {
    const es = crearT("es");
    for (const tema of TEMAS) expect(nombreTema(es, tema.id)).toBe(tema.nombre);
    for (const sub of SUBHABILIDADES) expect(nombreSub(es, sub.id)).toBe(sub.nombre);
    for (const test of TESTS) {
      expect(nombreTest(es, test)).toBe(test.nombre);
      for (const h of test.habilidades) expect(nombreHabilidad(es, h.id)).toBe(h.nombre);
    }
  });

  it("t() rellena las variables", () => {
    expect(traducir("fr", "test.progreso", { actual: 2, total: 10 })).toBe("Question 2 sur 10");
    expect(traducir("es", "nivel.3")).toBe("Ciclo III");
    expect(traducir("fr", "nivel.3")).toBe("Cycle III");
  });
});

describe("idioma guardado", () => {
  it("por defecto, español", () => {
    expect(cargarIdioma(almacen())).toBe("es");
    expect(cargarIdioma(null)).toBe("es");
  });

  it("se guarda y se recupera", () => {
    const a = almacen();
    guardarIdioma(a, "gn");
    expect(a.getItem(CLAVE_IDIOMA)).toBe("gn");
    expect(cargarIdioma(a)).toBe("gn");
  });

  it("un valor desconocido vuelve al español", () => {
    expect(cargarIdioma(almacen({ [CLAVE_IDIOMA]: "klingon" }))).toBe("es");
  });
});

describe("voz", () => {
  const voces = [{ lang: "es-ES", localService: true }, { lang: "fr-FR", localService: true }, { lang: "en-US", localService: true }];

  it("elige una voz del idioma elegido", () => {
    expect(vozDe("fr", puerto(voces))?.lang).toBe("fr-FR");
    expect(vozDe("es", puerto(voces))?.lang).toBe("es-ES");
  });

  it("sin voz de ese idioma no hay voz (y el botón se oculta)", () => {
    expect(vozDe("gn", puerto(voces))).toBeNull();
    expect(vozDe("fr", puerto([{ lang: "fr-FR", localService: false }]))).toBeNull();
    expect(vozDe("gn", null)).toBeNull();
  });

  it("las preguntas, aún en español, se leen en español; en guaraní no se leen", () => {
    expect(idiomaDeLectura("es")).toBe("es");
    expect(idiomaDeLectura("fr")).toBe("es");
    expect(idiomaDeLectura("gn")).toBeNull();
  });

  it("con la interfaz en francés, la lectura usa voz y palabras en español", () => {
    class Lectura { lang = ""; voice: unknown = null; rate = 1; onerror = null; text: string; constructor(text: string) { this.text = text; } }
    vi.stubGlobal("SpeechSynthesisUtterance", Lectura);
    const dichas: Lectura[] = [];
    const port: SpeechPort = { ...puerto(voces), speak: (u) => void dichas.push(u as unknown as Lectura) };
    speak("3 + 4", "es", crearT("fr"), () => undefined, port);
    vi.unstubAllGlobals();
    expect(dichas[0]).toMatchObject({ lang: "es-ES", text: "3 más 4" });
  });

  it("sin motor de voz, el aviso sale en el idioma elegido", () => {
    expect(speak("hola", "fr", crearT("fr"), () => undefined, null)).toEqual({ status: "unavailable", message: traducir("fr", "voz.noDisponible") });
  });

  it("los signos se leen en el idioma elegido", () => {
    expect(mathToSpeech("3 + 4 = 7")).toBe("3 más 4 igual a 7");
    expect(mathToSpeech("3 + 4 = 7", crearT("fr"))).toBe("3 plus 4 égale 7");
  });
});

describe("pantallas", () => {
  const pinta = (idioma: Idioma, hijo: ReactNode) => renderToStaticMarkup(<IdiomaProvider inicial={idioma}>{hijo}</IdiomaProvider>);
  const AVISO_ES = "Traducción pendiente de revisión por hablantes nativos";

  it("la portada ofrece los tres idiomas y cambia de texto", () => {
    const fr = pinta("fr", <Inicio />);
    expect(fr).toContain("Je suis élève");
    expect(fr).not.toContain("Soy alumno");
    for (const nombre of ["Español", "Français", "Avañe&#x27;ẽ"]) expect(fr).toContain(nombre);
  });

  it("el aviso de revisión sale en portada y Acerca solo en guaraní, en las dos lenguas", () => {
    for (const pantalla of [<Inicio key="i" />, <Acerca key="a" />]) {
      expect(pinta("gn", pantalla)).toContain(AVISO_ES);
      expect(pinta("es", pantalla)).not.toContain(AVISO_ES);
      expect(pinta("fr", pantalla)).not.toContain(AVISO_ES);
    }
    expect(pinta("gn", <Inicio />)).toContain("guaraníme");
  });

  it("el aviso de contenido en español solo sale fuera del español", () => {
    expect(pinta("es", <AvisoContenido />)).toBe("");
    expect(pinta("fr", <AvisoContenido />)).toContain("Contenu disponible en espagnol pour l&#x27;instant");
    expect(pinta("gn", <AvisoContenido />)).toContain("karaiñe");
  });
});
