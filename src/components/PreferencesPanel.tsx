import { useEffect, useRef } from "react";
import { speechPort } from "../services/speech.ts";
import type { Preferences } from "../services/preferences.ts";
import { Icon } from "./art.tsx";
import { usePreferences } from "./RadarProvider.tsx";

function Choice<K extends "textSize" | "spacing" | "contrast">({
  name,
  legend,
  options,
}: {
  name: K;
  legend: string;
  options: readonly { value: Preferences[K]; label: string }[];
}) {
  const { preferences, update } = usePreferences();
  return (
    <fieldset className="segmented">
      <legend>{legend}</legend>
      <div>
        {options.map((option) => (
          <label key={option.value} className={preferences[name] === option.value ? "on" : ""}>
            <input
              type="radio"
              name={name}
              checked={preferences[name] === option.value}
              onChange={() => update({ [name]: option.value } as Partial<Preferences>)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Toggle({
  name,
  label,
  help,
}: {
  name: "legibleFont" | "onePerScreen" | "reduceDistractions" | "readAloud";
  label: string;
  help: string;
}) {
  const { preferences, update } = usePreferences();
  return (
    <label className="toggle">
      <input
        type="checkbox"
        role="switch"
        checked={preferences[name]}
        onChange={(event) => update({ [name]: event.target.checked })}
      />
      <span className="toggle-track" aria-hidden="true" />
      <span>
        {label}
        <small>{help}</small>
      </span>
    </label>
  );
}

export function PreferencesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { reset } = usePreferences();
  const hasSpeech = speechPort() !== null;
  useEffect(() => {
    const element = dialog.current;
    if (element === null) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  return (
    <dialog ref={dialog} className="drawer" onClose={onClose} aria-labelledby="preferences-title">
      <div className="drawer-head">
        <h2 id="preferences-title">Lectura y uso</h2>
        <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Cerrar preferencias">
          <Icon name="close" />
        </button>
      </div>
      <p>
        Para cualquier persona. Cambian la presentación, no el contenido
        matemático. No son un diagnóstico ni un tratamiento.
      </p>
      <div className="preview" aria-hidden="true">
        <span>Vista previa</span>
        <strong>Calcula: 3/4 + 1/8</strong>
      </div>
      <Choice name="textSize" legend="Tamaño del texto" options={[
        { value: "normal", label: "Normal" },
        { value: "large", label: "Grande" },
        { value: "xlarge", label: "Muy grande" },
      ]} />
      <Choice name="spacing" legend="Espaciado" options={[
        { value: "normal", label: "Normal" },
        { value: "wide", label: "Amplio" },
      ]} />
      <Choice name="contrast" legend="Contraste" options={[
        { value: "standard", label: "Estándar" },
        { value: "high", label: "Alto" },
      ]} />
      <div className="toggles">
        <Toggle name="legibleFont" label="Presentación legible" help="Una sola letra, muy clara, también en los títulos." />
        <Toggle name="onePerScreen" label="Una pregunta por pantalla" help="Solo la pregunta: sin paneles ni datos alrededor." />
        <Toggle name="reduceDistractions" label="Reducir distracciones" help="Sin animaciones, sin mascota y sin adornos." />
        <Toggle
          name="readAloud"
          label="Lectura en voz alta"
          help={hasSpeech ? "Añade un botón para escuchar cada pregunta." : "Este navegador no la ofrece: el texto sigue en pantalla."}
        />
      </div>
      <button type="button" className="link" onClick={reset}>Restablecer preferencias</button>
    </dialog>
  );
}
