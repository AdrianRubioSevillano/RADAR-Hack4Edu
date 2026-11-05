import { useEffect, useRef, useState } from "react";
import { esCorrecta, textoParaEscuchar, textoRespuesta } from "../content/respuestas.ts";
import type { Pregunta } from "../content/tipos.ts";
import type { Presentacion } from "../services/perfiles.ts";
import { Icon, Mascot } from "./art.tsx";
import { Ilustracion } from "./Ilustracion.tsx";
import { ReadAloud } from "./ReadAloud.tsx";
import { TecladoNumerico } from "./TecladoNumerico.tsx";

const ALEGRES = ["¡Muy bien!", "¡Genial!", "¡Lo has conseguido!", "¡Eso es!", "¡Qué bien lo has hecho!"];
const AMABLES = ["Casi. Vamos a verlo.", "No pasa nada. Mira.", "Buen intento. Fíjate.", "Se aprende probando. Mira."];

function frase(lista: readonly string[], semilla: string): string {
  const suma = [...semilla].reduce((n, c) => n + c.charCodeAt(0), 0);
  return lista[suma % lista.length] as string;
}

function Respuesta({ acierto, pregunta, presentacion, textoSiguiente, onSiguiente }: { acierto: boolean; pregunta: Pregunta; presentacion: Presentacion; textoSiguiente: string; onSiguiente: () => void }) {
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
          {frase(acierto ? ALEGRES : AMABLES, pregunta.id)}
        </h2>
        {!acierto && <p className="respuesta-correcta">La respuesta es: <strong>{textoRespuesta(pregunta)}</strong></p>}
        <p>{pregunta.explicacion}</p>
        <button type="button" className="boton boton-principal boton-grande" onClick={onSiguiente}>
          {textoSiguiente} <Icon name="arrow" size={26} />
        </button>
      </div>
    </section>
  );
}

function RespuestaNumerica({ pregunta, onResponder }: { pregunta: Pregunta; onResponder: (valor: string) => void }) {
  const [valor, setValor] = useState("");
  const extras = [...(pregunta.respuestaCorrecta.includes(",") ? [","] : []), ...(pregunta.respuestaCorrecta.includes("/") ? ["/"] : [])];
  return (
    <form
      className="numero"
      onSubmit={(evento) => {
        evento.preventDefault();
        if (valor.trim() !== "") onResponder(valor);
      }}
    >
      <label className="sr-only" htmlFor="respuesta-numero">Tu respuesta</label>
      <input
        id="respuesta-numero"
        className="numero-caja"
        value={valor}
        inputMode="none"
        autoComplete="off"
        maxLength={12}
        placeholder="?"
        onChange={(evento) => setValor(evento.target.value.replace(/[^\d,./]/g, ""))}
      />
      <TecladoNumerico etiqueta="Teclado de números" extras={extras} onTecla={(t) => setValor((v) => (v.length < 12 ? v + t : v))} onBorrar={() => setValor((v) => v.slice(0, -1))} />
      <button type="submit" className="boton boton-principal boton-grande" disabled={valor.trim() === ""}>Comprobar</button>
    </form>
  );
}

export function PreguntaVista({ pregunta, presentacion, pistaDisponible = false, textoSiguiente = "Siguiente", onContinuar }: { pregunta: Pregunta; presentacion: Presentacion; pistaDisponible?: boolean; textoSiguiente?: string; onContinuar: (acierto: boolean) => void }) {
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [pista, setPista] = useState(false);
  const acierto = respuesta === null ? null : esCorrecta(pregunta, respuesta);
  const enunciado = presentacion.enunciadoFacil ? pregunta.enunciadoFacil : pregunta.enunciado;
  const conLectura = pregunta.texto !== undefined;

  return (
    <div className={`pregunta ${conLectura ? "pregunta-lectura" : ""}`}>
      <div className="pregunta-datos">
        {conLectura && (
          <article className="lectura">
            {pregunta.titulo !== undefined && <h2>{pregunta.titulo}</h2>}
            <p>{pregunta.texto}</p>
          </article>
        )}
        {pregunta.imagen !== undefined && <Ilustracion imagen={pregunta.imagen} />}
      </div>
      <div className="pregunta-accion">
        <h2 className="enunciado">{enunciado}</h2>
        {presentacion.escuchar && <ReadAloud text={textoParaEscuchar(pregunta, presentacion.enunciadoFacil)} />}
        {pistaDisponible && acierto === null && (
          pista ? (
            <p className="pista" role="status"><Icon name="hint" /> {pregunta.pista}</p>
          ) : (
            <button type="button" className="boton boton-suave" onClick={() => setPista(true)}><Icon name="hint" /> Necesito una pista</button>
          )
        )}
        {pregunta.formato === "numero" ? (
          acierto === null ? (
            <RespuestaNumerica pregunta={pregunta} onResponder={setRespuesta} />
          ) : (
            <p className="numero-eco">Tu respuesta: <strong>{respuesta}</strong></p>
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
                    <span className={pregunta.formato === "imagen" ? "sr-only" : "opcion-texto"}>{o.texto}</span>
                    {acierto !== null && correcta && <span className="opcion-marca"><Icon name="check" /><span className="sr-only">Respuesta correcta</span></span>}
                    {acierto !== null && elegida && !correcta && <span className="opcion-marca"><Icon name="close" /><span className="sr-only">Tu respuesta</span></span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {acierto !== null && <Respuesta acierto={acierto} pregunta={pregunta} presentacion={presentacion} textoSiguiente={textoSiguiente} onSiguiente={() => onContinuar(acierto)} />}
      </div>
    </div>
  );
}
