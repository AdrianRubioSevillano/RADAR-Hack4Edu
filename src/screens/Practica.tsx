import { useMemo, useState } from "react";
import { Icon, Mascot } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { PreguntaVista } from "../components/PreguntaVista.tsx";
import { Titulo } from "../components/ui.tsx";
import type { Pregunta } from "../content/tipos.ts";
import { ejerciciosDe, marcarEjercicioHecho, miniTestDe, nombreSubhabilidad, registrarMiniTest } from "../services/clase.ts";
import type { Presentacion } from "../services/perfiles.ts";
import { enlace } from "../services/rutas.ts";
import { Progreso } from "./TestPantalla.tsx";

type Fase = "practica" | "reto" | "mini" | "superado" | "otraVez";

export function Practica({ alumnoId, testId, subId, presentacion }: { alumnoId: string; testId: string; subId: string; presentacion: Presentacion }) {
  const { clase, actualizar } = useClase();
  const refuerzo = clase.intentos[alumnoId]?.[testId]?.refuerzos[subId];
  const volver = enlace("alumno", alumnoId);
  const [fase, setFase] = useState<Fase>(() => (refuerzo !== undefined && refuerzo.hechos >= 6 ? "reto" : "practica"));
  const [mini, setMini] = useState<readonly { readonly pregunta: Pregunta; readonly acierto: boolean }[]>([]);
  const ronda = refuerzo?.ronda;
  const ejercicios = useMemo(() => (ronda === undefined ? [] : ejerciciosDe(clase, alumnoId, testId, subId)), [ronda, alumnoId, testId, subId]); // eslint-disable-line
  const reto = useMemo(() => (ronda === undefined ? [] : miniTestDe(clase, alumnoId, testId, subId)), [ronda, alumnoId, testId, subId]); // eslint-disable-line

  if (refuerzo === undefined) {
    return (
      <div className="hoja">
        <Titulo>Estos ejercicios no están disponibles.</Titulo>
        <a className="boton boton-principal" href={volver}>Volver</a>
      </div>
    );
  }
  const { nombre } = nombreSubhabilidad(subId);

  if (fase === "superado" || fase === "otraVez") {
    const bien = fase === "superado";
    return (
      <div className="hoja hoja-centrada">
        {!presentacion.sinExtras && <Mascot mood={bien ? "cheer" : "hello"} size={150} />}
        <Titulo>{bien ? "¡Lo has conseguido!" : "Vas mejorando"}</Titulo>
        <p className="texto-grande">{bien ? `Ya sabes más de: ${nombre}.` : "Cada vez que practicas aprendes más. Otro día hacemos más ejercicios."}</p>
        <a className="boton boton-principal boton-grande" href={volver}>Volver a mis tests</a>
      </div>
    );
  }

  if (fase === "reto") {
    return (
      <div className="hoja hoja-centrada">
        {!presentacion.sinExtras && <Mascot mood="cheer" size={150} />}
        <Titulo>¡Ejercicios terminados!</Titulo>
        <p className="texto-grande">Ahora, un reto de 3 preguntas.</p>
        <button type="button" className="boton boton-principal boton-grande" onClick={() => setFase("mini")}>Empezar el reto <Icon name="arrow" size={26} /></button>
      </div>
    );
  }

  const enMini = fase === "mini";
  const lista = enMini ? reto : ejercicios;
  const indice = enMini ? mini.length : refuerzo.hechos;
  const pregunta = lista[indice];
  if (pregunta === undefined) return <div className="hoja"><Titulo>Preparando…</Titulo></div>;

  return (
    <div className="tarea">
      <header className="tarea-cabecera">
        <h1 id="titulo" tabIndex={-1} className="tarea-titulo">{enMini ? "Reto" : "Practicamos"}: {nombre}</h1>
        <Progreso actual={indice + 1} total={lista.length} barra={presentacion.barraProgreso} />
        <a className="tarea-salir" href={volver}><Icon name="close" /> Salir</a>
      </header>
      <PreguntaVista
        key={`${fase}-${pregunta.id}`}
        pregunta={pregunta}
        presentacion={presentacion}
        pistaDisponible={!enMini}
        onContinuar={(acierto) => {
          window.scrollTo(0, 0);
          if (!enMini) {
            actualizar((c) => marcarEjercicioHecho(c, alumnoId, testId, subId));
            if (indice + 1 >= lista.length) setFase("reto");
            return;
          }
          const respuestas = [...mini, { pregunta, acierto }];
          setMini(respuestas);
          if (respuestas.length >= reto.length) {
            const salida = registrarMiniTest(clase, alumnoId, testId, subId, respuestas);
            actualizar(() => salida.clase);
            setFase(salida.superado ? "superado" : "otraVez");
          }
        }}
      />
    </div>
  );
}
