import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
  loadPreferences,
  normalizePreferences,
  preferenceAttributes,
  savePreferences,
} from "../../src/services/preferences.ts";
import { mathToSpeech, speak, type SpeechPort } from "../../src/services/speech.ts";
import { memoryStorage } from "./support.ts";

describe("preferencias", () => {
  it("guarda y recupera, y descarta valores desconocidos", () => {
    const storage = memoryStorage();
    const value = { ...DEFAULT_PREFERENCES, textSize: "xlarge" as const, onePerScreen: true };
    savePreferences(storage, value);
    expect(loadPreferences(storage)).toEqual(value);
    expect(normalizePreferences({ textSize: "enorme", contrast: "high", legibleFont: "sí" })).toEqual({
      ...DEFAULT_PREFERENCES,
      contrast: "high",
    });
    expect(loadPreferences(memoryStorage({ [PREFERENCES_KEY]: "{roto" }))).toEqual(DEFAULT_PREFERENCES);
    expect(loadPreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it("se traduce en atributos para los estilos", () => {
    expect(preferenceAttributes({ ...DEFAULT_PREFERENCES, contrast: "high", legibleFont: true })).toMatchObject({
      "data-contrast": "high",
      "data-font": "legible",
    });
  });

  it("no usa etiquetas diagnósticas", () => {
    expect(JSON.stringify(DEFAULT_PREFERENCES)).not.toMatch(/tdah|dislexia/i);
  });
});

describe("lectura en voz alta", () => {
  it("lee la notación matemática sin cambiar su contenido", () => {
    expect(mathToSpeech("Calcula: 4 - (-6).")).toBe("Calcula: 4 menos menos 6 .");
    expect(mathToSpeech("Calcula: 9·8.")).toBe("Calcula: 9 por 8.");
    expect(mathToSpeech("Calcula: 3/4 : 5/8.")).toBe("Calcula: 3 partido por 4 entre 5 partido por 8.");
    expect(mathToSpeech("Resuelve: 2x + 3 = 11.")).toBe("Resuelve: 2x más 3 igual a 11.");
    expect(mathToSpeech("Calcula: -5 + 8.")).toBe("Calcula: menos 5 más 8.");
  });

  it("ofrece alternativa si no hay voz", () => {
    const outcome = speak("Hola", () => undefined, null);
    expect(outcome.status).toBe("unavailable");
  });

  it("avisa si el navegador falla al hablar", () => {
    const failing: SpeechPort = {
      speak: () => {
        throw new Error("sin voz");
      },
      cancel: () => undefined,
      getVoices: () => [],
    };
    vi.stubGlobal("SpeechSynthesisUtterance", class { lang = ""; onerror = null; });
    expect(speak("Hola", () => undefined, failing).status).toBe("unavailable");
    vi.unstubAllGlobals();
  });
});
