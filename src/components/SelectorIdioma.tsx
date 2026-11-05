import type { Pregunta } from "../content/tipos.ts";
import { IDIOMAS, NOMBRE_IDIOMA, esIdioma, traducir } from "../i18n/index.ts";
import { useIdioma } from "./IdiomaProvider.tsx";

// Portada: los tres idiomas a la vista.
export function SelectorIdioma() {
  const { idioma, t, cambiarIdioma } = useIdioma();
  return (
    <div className="selector-idioma" role="group" aria-label={t("idioma.etiqueta")}>
      {IDIOMAS.map((i) => (
        <button key={i} type="button" lang={i} aria-pressed={i === idioma} onClick={() => cambiarIdioma(i)}>{NOMBRE_IDIOMA[i]}</button>
      ))}
    </div>
  );
}

// Barras del alumno y del profesor: ocupa poco y cabe en una tablet.
export function SelectorIdiomaCompacto() {
  const { idioma, t, cambiarIdioma } = useIdioma();
  return (
    <label className="idioma-compacto">
      <span className="sr-only">{t("idioma.etiqueta")}</span>
      <select value={idioma} onChange={(e) => { if (esIdioma(e.target.value)) cambiarIdioma(e.target.value); }}>
        {IDIOMAS.map((i) => <option key={i} value={i} lang={i}>{NOMBRE_IDIOMA[i]}</option>)}
      </select>
    </label>
  );
}

// Aviso en guaraní y en español mientras no lo revisen hablantes nativos.
export function AvisoRevision() {
  const { idioma, t } = useIdioma();
  if (idioma !== "gn") return null;
  return (
    <p className="aviso-revision" role="note">
      <span>{t("aviso.revision")}</span>
      <span lang="es">{traducir("es", "aviso.revision")}</span>
    </p>
  );
}

// La pregunta que se ve sigue en español: se avisa sin robarle sitio.
export function AvisoContenido({ pregunta }: { pregunta: Pick<Pregunta, "idioma"> }) {
  const { idioma, t } = useIdioma();
  return idioma === "es" || pregunta.idioma === "fr" ? null : <p className="aviso-contenido">{t("aviso.contenido")}</p>;
}
