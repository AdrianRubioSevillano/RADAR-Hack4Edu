import { useEffect, useState } from "react";
import { speak, stopSpeaking } from "../services/speech.ts";
import { Icon } from "./art.tsx";
import { usePreferences } from "./RadarProvider.tsx";

// Control opcional. Si la voz falla, el texto sigue en pantalla y se explica.
export function ReadAloud({ text }: { text: string }) {
  const { preferences } = usePreferences();
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    setMessage(null);
    return () => stopSpeaking();
  }, [text]);
  if (!preferences.readAloud) return null;
  return (
    <div className="read-aloud">
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          setMessage(null);
          const outcome = speak(text, setMessage);
          if (outcome.status === "unavailable") setMessage(outcome.message);
        }}
      >
        <Icon name="sound" /> Leer en voz alta
      </button>
      <button type="button" className="link" onClick={() => stopSpeaking()}>Detener</button>
      {message !== null && <p role="status">{message}</p>}
    </div>
  );
}
