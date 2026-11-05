import { useEffect, useState } from "react";
import type { Idioma } from "../i18n/index.ts";
import { speak, speechPort, stopSpeaking, vozDe } from "../services/speech.ts";
import { Icon } from "./art.tsx";
import { useIdioma } from "./IdiomaProvider.tsx";

// Las voces llegan después de cargar la página: hay que escuchar `voiceschanged`.
export function useVozDisponible(idioma: Idioma): boolean {
  const [disponible, setDisponible] = useState(() => vozDe(idioma) !== null);
  useEffect(() => {
    const synth = speechPort() as SpeechSynthesis | null;
    if (synth === null || typeof synth.addEventListener !== "function") return undefined;
    const revisar = () => setDisponible(vozDe(idioma) !== null);
    revisar();
    synth.addEventListener("voiceschanged", revisar);
    return () => synth.removeEventListener("voiceschanged", revisar);
  }, [idioma]);
  return disponible;
}

// Si la voz no está disponible en el dispositivo, el botón no aparece.
export function ReadAloud({ text }: { text: string }) {
  const { idioma, t } = useIdioma();
  const disponible = useVozDisponible(idioma);
  const [fallo, setFallo] = useState<string | null>(null);
  useEffect(() => {
    setFallo(null);
    return () => stopSpeaking();
  }, [text]);
  if (!disponible) return null;
  return (
    <div className="escuchar">
      <button
        type="button"
        className="boton boton-voz"
        onClick={() => {
          setFallo(null);
          const salida = speak(text, idioma, t, setFallo);
          if (salida.status === "unavailable") setFallo(salida.message);
        }}
      >
        <Icon name="sound" size={26} /> {t("pregunta.escuchar")}
      </button>
      {fallo !== null && <p role="status">{fallo}</p>}
    </div>
  );
}
