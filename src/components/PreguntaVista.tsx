import { useEffect, useRef, useState } from "react";
import { esCorrecta, textoParaEscuchar, textoRespuesta } from "../content/respuestas.ts";
import type { Pregunta } from "../content/tipos.ts";
import type { Clave } from "../i18n/index.ts";
import type { Presentacion } from "../services/perfiles.ts";
import { LARGO_RESPUESTA, enterEsDelControl, teclaRespuesta } from "../services/tecladoRespuesta.ts";
import { Icon, Mascot } from "./art.tsx";
import { useIdioma } from "./IdiomaProvider.tsx";
import { Ilustracion, LenguaImagen } from "./Ilustracion.tsx";
import { ReadAloud } from "./ReadAloud.tsx";
import { TecladoNumerico } from "./TecladoNumerico.tsx";

const ALEGRES: readonly Clave[] = ["bien.1", "bien.2", "bien.3", "bien.4", "bien.5"];
const AMABLES: readonly Clave[] = ["casi.1", "casi.2", "casi.3", "casi.4"];

function frase(lista: readonly Clave[], semilla: string): Clave {
  const suma = [...semilla].reduce((n, c) => n + c.charCodeAt(0), 0);
  return lista[suma % lista.length] as Clave;
}

function Respuesta({ acierto, pregunta, presentacion, onSiguiente }: { acierto: boolean; pregunta: Pregunta; presentacion: Presentacion; onSiguiente: () => void }) {
  const { t } = useIdioma();
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titulo.current?.focus();
    titulo.current?.scrollIntoView({ block: "nearest" });
  }, []);
  return (
    <section className={`respuesta ${acierto ? "respuesta-bien" : "respuesta-casi"}`} aria-live="polite">
      {!presentacion.sinExtras && <Mascot mood={acierto ? "cheer" : "try"} size={92} />}
      {acierto && !presentacion.sinExtras && (
        <span className="chispas" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={22} />)}
        </span>
      )}
      <div className="respuesta-texto">
        <h2 ref={titulo} tabIndex={-1}>
          <span className="respuesta-icono"><Icon name={acierto ? "check" : "hint"} size={28} /></span>
          {t(frase(acierto ? ALEGRES : AMABLES, pregunta.id))}
        </h2>
        {!acierto && <p className="respuesta-correcta">{t("pregunta.laRespuesta")} <strong lang={pregunta.idioma ?? "es"}>{textoRespuesta(pregunta)}</strong></p>}
        <p lang={pregunta.idioma ?? "es"}>{pregunta.explicacion}</p>
        <button type="button" className="boton boton-principal boton-grande" onClick={onSiguiente}>
          {t("pregunta.siguiente")} <Icon name="arrow" size={26} />
        </button>
      </div>
    </section>
  );
}

function RespuestaNumerica({ pregunta, onResponder }: { pregunta: Pregunta; onResponder: (valor: string) => void }) {
  const { t } = useIdioma();
  const [valor, setValor] = useState("");
  const extras = [...(pregunta.respuestaCorrecta.includes(",") ? [","] : []), ...(pregunta.respuestaCorrecta.includes("/") ? ["/"] : [])];
  const extrasClave = extras.join("");

  // El teclado físico funciona esté donde esté el foco, como en el PIN.
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter" && enterEsDelControl(e.target instanceof Element ? e.target : null)) return;
      const accion = teclaRespuesta(valor, e.key, [...extrasClave]);
      if (accion === null) return;
      e.preventDefault();
      if (accion.tipo === "enviar") onResponder(valor);
      else setValor(accion.valor);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [valor, extrasClave, onResponder]);

  return (
    <form
      className="numero"
      onSubmit={(evento) => {
        evento.preventDefault();
        if (valor.trim() !== "") onResponder(valor);
      }}
    >
      <label className="sr-only" htmlFor="respuesta-numero">{t("pregunta.tuRespuesta")}</label>
      <input
        id="respuesta-numero"
        className="numero-caja"
        value={valor}
        inputMode="none"
        autoComplete="off"
        maxLength={LARGO_RESPUESTA}
        placeholder="?"
        onChange={(evento) => setValor(evento.target.value.replace(/[^\d,./]/g, ""))}
      />
      <TecladoNumerico etiqueta={t("pregunta.teclado")} extras={extras} onTecla={(t) => setValor((v) => (v.length < LARGO_RESPUESTA ? v + t : v))} onBorrar={() => setValor((v) => v.slice(0, -1))} />
      <button type="submit" className="boton boton-principal boton-grande" disabled={valor.trim() === ""}>{t("pregunta.comprobar")}</button>
    </form>
  );
}

export function PreguntaVista({ pregunta, presentacion, pistaDisponible = false, onContinuar }: { pregunta: Pregunta; presentacion: Presentacion; pistaDisponible?: boolean; onContinuar: (acierto: boolean) => void }) {
  const { t } = useIdioma();
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [pista, setPista] = useState(false);
  const acierto = respuesta === null ? null : esCorrecta(pregunta, respuesta);
  const enunciado = presentacion.enunciadoFacil ? pregunta.enunciadoFacil : pregunta.enunciado;
  const conLectura = pregunta.texto !== undefined;
  const lengua = pregunta.idioma ?? "es";

  return (
    <LenguaImagen.Provider value={lengua}>
    <div className={`pregunta ${conLectura ? "pregunta-lectura" : ""}`}>
      <div className="pregunta-datos" lang={lengua}>
        {conLectura && (
          <article className="lectura">
            {pregunta.titulo !== undefined && <h2>{pregunta.titulo}</h2>}
            <p>{pregunta.texto}</p>
          </article>
        )}
        {pregunta.imagen !== undefined && <Ilustracion imagen={pregunta.imagen} />}
      </div>
      <div className="pregunta-accion">
        <h2 className="enunciado" lang={lengua}>{enunciado}</h2>
        {presentacion.escuchar && <ReadAloud text={textoParaEscuchar(pregunta, presentacion.enunciadoFacil)} idioma={lengua} />}
        {pistaDisponible && acierto === null && (
          pista ? (
            <p className="pista" role="status" lang={lengua}><Icon name="hint" /> {pregunta.pista}</p>
          ) : (
            <button type="button" className="boton boton-suave" onClick={() => setPista(true)}><Icon name="hint" /> {t("pregunta.pista")}</button>
          )
        )}
        {pregunta.formato === "numero" ? (
          acierto === null ? (
            <RespuestaNumerica pregunta={pregunta} onResponder={setRespuesta} />
          ) : (
            <p className="numero-eco">{t("pregunta.tuRespuestaEco")} <strong>{respuesta}</strong></p>
          )
        ) : (
          <ul className={`opciones opciones-${pregunta.formato}`}>
            {(pregunta.opciones ?? []).map((o) => {
              const elegida = o.id === respuesta;
              const correcta = o.id === pregunta.respuestaCorrecta;
              const marca = acierto === null ? "" : correcta ? "opcion-correcta" : elegida ? "opcion-fallada" : "opcion-apagada";
              return (
                <li key={o.id}>
                  <button type="button" className={`opcion ${marca}`} disabled={acierto !== null} onClick={() => setRespuesta(o.id)}>
                    {o.imagen !== undefined && <Ilustracion imagen={o.imagen} decorativa tamano="opcion" />}
                    <span lang={lengua} className={pregunta.formato === "imagen" ? "sr-only" : "opcion-texto"}>{o.texto}</span>
                    {acierto !== null && correcta && <span className="opcion-marca"><Icon name="check" /><span className="sr-only">{t("pregunta.correcta")}</span></span>}
                    {acierto !== null && elegida && !correcta && <span className="opcion-marca"><Icon name="close" /><span className="sr-only">{t("pregunta.tuRespuesta")}</span></span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {acierto !== null && <Respuesta acierto={acierto} pregunta={pregunta} presentacion={presentacion} onSiguiente={() => onContinuar(acierto)} />}
      </div>
    </div>
    </LenguaImagen.Provider>
  );
}
