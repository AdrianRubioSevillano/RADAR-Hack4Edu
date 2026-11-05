import { useEffect, useState } from "react";
import { speak, speechPort, stopSpeaking, vozEspanol } from "../services/speech.ts";
import { Icon } from "./art.tsx";

// Las voces llegan después de cargar la página: hay que escuchar `voiceschanged`.
export function useVozDisponible(): boolean {
  const [disponible, setDisponible] = useState(() => vozEspanol() !== null);
  useEffect(() => {
    const synth = speechPort() as SpeechSynthesis | null;
    if (synth === null || typeof synth.addEventListener !== "function") return undefined;
    const revisar = () => setDisponible(vozEspanol() !== null);
    revisar();
    synth.addEventListener("voiceschanged", revisar);
    return () => synth.removeEventListener("voiceschanged", revisar);
  }, []);
  return disponible;
}

// Si la voz no está disponible en el dispositivo, el botón no aparece.
export function ReadAloud({ text, etiqueta = "Escuchar" }: { text: string; etiqueta?: string }) {
  const disponible = useVozDisponible();
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
          const salida = speak(text, setFallo);
          if (salida.status === "unavailable") setFallo(salida.message);
        }}
      >
        <Icon name="sound" size={26} /> {etiqueta}
      </button>
      {fallo !== null && <p role="status">{fallo}</p>}
    </div>
  );
}
