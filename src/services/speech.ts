// Lectura en voz alta opcional. La aplicación funciona igual sin ella.
import { IDIOMA_DEFECTO, crearT, type Idioma, type Traductor } from "../i18n/index.ts";

export interface SpeechPort {
  speak(utterance: SpeechSynthesisUtterance): void;
  cancel(): void;
  getVoices(): SpeechSynthesisVoice[];
}

export function speechPort(): SpeechPort | null {
  const synthesis = globalThis.speechSynthesis;
  return synthesis !== undefined &&
    typeof globalThis.SpeechSynthesisUtterance === "function"
    ? synthesis
    : null;
}

// Convierte la notación del banco en texto que un sintetizador lee bien. El
// contenido matemático no cambia. Orden: fracciones y paréntesis antes que signos.
export function mathToSpeech(text: string, t: Traductor = crearT(IDIOMA_DEFECTO)): string {
  const menos = t("voz.menos");
  return text
    .replace(/(\d+)\/(\d+)/g, `$1 ${t("voz.fraccion")} $2`)
    .replace(/·/g, ` ${t("voz.por")} `)
    .replace(/\s:\s/g, ` ${t("voz.entre")} `)
    .replace(/\(-(\d)/g, `(${menos} $1`)
    .replace(/(^|[\s(=])-(\d|x)/g, `$1${menos} $2`)
    .replace(/\s-\s/g, ` ${menos} `)
    .replace(/\s\+\s/g, ` ${t("voz.mas")} `)
    .replace(/\s=\s/g, ` ${t("voz.igual")} `)
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Voz local del idioma en que está escrito el texto, no el de la interfaz. Sin internet no
// sirven las voces remotas, y una voz de otro idioma leería mal: entonces no hay botón.
export function vozDe(idioma: Idioma, port: SpeechPort | null = speechPort()): SpeechSynthesisVoice | null {
  try {
    const voces = port?.getVoices() ?? [];
    return voces.find((v) => v.lang.toLowerCase().startsWith(idioma) && v.localService) ?? null;
  } catch {
    return null;
  }
}

export type SpeechOutcome =
  | { readonly status: "started" }
  | { readonly status: "unavailable"; readonly message: string };

export function speak(
  text: string,
  idioma: Idioma,
  t: Traductor,
  onFailure: (message: string) => void,
  port: SpeechPort | null = speechPort(),
): SpeechOutcome {
  if (port === null) return { status: "unavailable", message: t("voz.noDisponible") };
  try {
    port.cancel();
    const utterance = new SpeechSynthesisUtterance(mathToSpeech(text, crearT(idioma)));
    const voz = vozDe(idioma, port);
    utterance.lang = voz?.lang ?? idioma;
    if (voz !== null) utterance.voice = voz;
    utterance.rate = 0.92;
    utterance.onerror = (event) => {
      // Cancelar una lectura en curso no es un fallo.
      if (event.error !== "canceled" && event.error !== "interrupted")
        onFailure(t("voz.fallo"));
    };
    port.speak(utterance);
    return { status: "started" };
  } catch {
    return { status: "unavailable", message: t("voz.noDisponible") };
  }
}

export function stopSpeaking(port: SpeechPort | null = speechPort()): void {
  try {
    port?.cancel();
  } catch {
    // Sin voz no hay nada que detener.
  }
}
