// Preferencias de presentación, disponibles para cualquier alumno. No diagnostican
// nada ni son un tratamiento: solo cambian cómo se ve y se usa la aplicación.
import type { KeyValueStorage } from "./persistence.ts";

export const PREFERENCES_KEY = "radar.preferences.v1";

export interface Preferences {
  readonly textSize: "normal" | "large" | "xlarge";
  readonly spacing: "normal" | "wide";
  readonly contrast: "standard" | "high";
  readonly legibleFont: boolean;
  readonly onePerScreen: boolean;
  readonly reduceDistractions: boolean;
  readonly readAloud: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  textSize: "normal",
  spacing: "normal",
  contrast: "standard",
  legibleFont: false,
  onePerScreen: false,
  reduceDistractions: false,
  readAloud: false,
};

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.find((item) => item === value) ?? fallback;
}

export function normalizePreferences(value: unknown): Preferences {
  const source =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const flag = (key: keyof Preferences) => source[key] === true;
  return {
    textSize: oneOf(
      source.textSize,
      ["normal", "large", "xlarge"] as const,
      "normal",
    ),
    spacing: oneOf(source.spacing, ["normal", "wide"] as const, "normal"),
    contrast: oneOf(source.contrast, ["standard", "high"] as const, "standard"),
    legibleFont: flag("legibleFont"),
    onePerScreen: flag("onePerScreen"),
    reduceDistractions: flag("reduceDistractions"),
    readAloud: flag("readAloud"),
  };
}

export function loadPreferences(storage: KeyValueStorage | null): Preferences {
  try {
    const text = storage?.getItem(PREFERENCES_KEY) ?? null;
    return text === null
      ? DEFAULT_PREFERENCES
      : normalizePreferences(JSON.parse(text));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(
  storage: KeyValueStorage | null,
  preferences: Preferences,
): void {
  try {
    storage?.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Sin almacenamiento, las preferencias duran esta sesión.
  }
}

// Atributos del elemento raíz que usan los estilos.
export function preferenceAttributes(
  preferences: Preferences,
): Readonly<Record<string, string>> {
  return {
    "data-text": preferences.textSize,
    "data-spacing": preferences.spacing,
    "data-contrast": preferences.contrast,
    "data-font": preferences.legibleFont ? "legible" : "default",
    "data-focus": preferences.reduceDistractions ? "on" : "off",
  };
}
