import { useEffect, useRef } from "react";
import { speechPort } from "../services/speech.ts";
import type { Preferences } from "../services/preferences.ts";
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
    <fieldset>
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name={name}
            checked={preferences[name] === option.value}
            onChange={() =>
              update({ [name]: option.value } as Partial<Preferences>)
            }
          />
          {option.label}
        </label>
      ))}
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
  help?: string;
}) {
  const { preferences, update } = usePreferences();
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={preferences[name]}
        onChange={(event) => update({ [name]: event.target.checked })}
      />
      <span>
        {label}
        {help !== undefined && <small>{help}</small>}
      </span>
    </label>
  );
}

export function PreferencesPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
    <dialog ref={dialog} className="preferences" onClose={onClose} aria-labelledby="preferences-title">
      <div className="section-heading">
        <h2 id="preferences-title" tabIndex={-1}>Preferencias de lectura y uso</h2>
        <button type="button" className="secondary" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <p>
        Disponibles para cualquier persona. Cambian la presentación, no el
        contenido matemático. No son un diagnóstico ni un tratamiento.
      </p>
      <Choice
        name="textSize"
        legend="Tamaño del texto"
        options={[
          { value: "normal", label: "Normal" },
          { value: "large", label: "Grande" },
          { value: "xlarge", label: "Muy grande" },
        ]}
      />
      <Choice
        name="spacing"
        legend="Espaciado del texto"
        options={[
          { value: "normal", label: "Normal" },
          { value: "wide", label: "Amplio" },
        ]}
      />
      <Choice
        name="contrast"
        legend="Contraste"
        options={[
          { value: "standard", label: "Estándar" },
          { value: "high", label: "Alto" },
        ]}
      />
      <fieldset>
        <legend>Presentación</legend>
        <Toggle name="legibleFont" label="Tipografía legible" help="Letra más abierta, sin cursivas." />
        <Toggle name="onePerScreen" label="Una pregunta por pantalla" help="Oculta los paneles laterales durante el diagnóstico y la práctica." />
        <Toggle name="reduceDistractions" label="Reducir distracciones" help="Quita animaciones y elementos decorativos." />
        <Toggle
          name="readAloud"
          label="Lectura en voz alta"
          help={
            hasSpeech
              ? "Añade un botón para leer cada pregunta."
              : "Este navegador no la ofrece: el texto sigue en pantalla."
          }
        />
      </fieldset>
      <button type="button" className="text-button" onClick={reset}>
        Restablecer preferencias
      </button>
    </dialog>
  );
}
