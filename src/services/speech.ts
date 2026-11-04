// Lectura en voz alta opcional. La aplicación funciona igual sin ella.

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
export function mathToSpeech(text: string): string {
  return text
    .replace(/(\d+)\/(\d+)/g, "$1 partido por $2")
    .replace(/·/g, " por ")
    .replace(/\s:\s/g, " entre ")
    .replace(/\(-(\d)/g, "(menos $1")
    .replace(/(^|[\s(=])-(\d|x)/g, "$1menos $2")
    .replace(/\s-\s/g, " menos ")
    .replace(/\s\+\s/g, " más ")
    .replace(/\s=\s/g, " igual a ")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type SpeechOutcome =
  | { readonly status: "started" }
  | { readonly status: "unavailable"; readonly message: string };

const UNAVAILABLE =
  "La lectura en voz alta no está disponible en este navegador. El texto sigue visible en pantalla.";

export function speak(
  text: string,
  onFailure: (message: string) => void,
  port: SpeechPort | null = speechPort(),
): SpeechOutcome {
  if (port === null) return { status: "unavailable", message: UNAVAILABLE };
  try {
    port.cancel();
    const utterance = new SpeechSynthesisUtterance(mathToSpeech(text));
    utterance.lang = "es-ES";
    utterance.onerror = (event) => {
      // Cancelar una lectura en curso no es un fallo.
      if (event.error !== "canceled" && event.error !== "interrupted")
        onFailure(
          "No se ha podido leer en voz alta. El texto sigue visible en pantalla.",
        );
    };
    port.speak(utterance);
    return { status: "started" };
  } catch {
    return { status: "unavailable", message: UNAVAILABLE };
  }
}

export function stopSpeaking(port: SpeechPort | null = speechPort()): void {
  try {
    port?.cancel();
  } catch {
    // Sin voz no hay nada que detener.
  }
}
