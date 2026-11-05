import { useEffect, useState } from "react";
import { Icon, Mascot } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { PreguntaVista } from "../components/PreguntaVista.tsx";
import { Titulo } from "../components/ui.tsx";
import { testPorId } from "../content/tests.ts";
import { alumnoPorId, empezarTest, practicasPendientes, preguntaActual, registrarRespuesta } from "../services/clase.ts";
import { pausaTras, type Pausa, type Presentacion } from "../services/perfiles.ts";
import { enlace } from "../services/rutas.ts";

export function Progreso({ actual, total, barra }: { actual: number; total: number; barra: boolean }) {
  return (
    <div className="progreso">
      <span>Pregunta {actual} de {total}</span>
      {barra && (
        <div className="progreso-barra" role="progressbar" aria-label="Progreso" aria-valuemin={0} aria-valuemax={total} aria-valuenow={actual - 1}>
          <span style={{ width: `${((actual - 1) / total) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

function PantallaPausa({ tipo, volver, onSeguir }: { tipo: Exclude<Pausa, null>; volver: string; onSeguir: () => void }) {
  return (
    <div className="hoja hoja-centrada">
      <span className="pausa-icono" aria-hidden="true"><Icon name="pause" size={56} /></span>
      <Titulo>{tipo === "parte" ? "Has acabado la primera parte" : "Puedes descansar un momento"}</Titulo>
      <p className="texto-grande">{tipo === "parte" ? "Puedes seguir ahora o volver más tarde. Tus respuestas están guardadas." : "Cuando quieras, seguimos."}</p>
      <button type="button" className="boton boton-principal boton-grande" onClick={onSeguir}>Seguir</button>
      {tipo === "parte" && <a className="enlace-suave" href={volver}>Seguir más tarde</a>}
    </div>
  );
}

export function TestPantalla({ alumnoId, testId, presentacion }: { alumnoId: string; testId: string; presentacion: Presentacion }) {
  const { clase, actualizar } = useClase();
  const [pausa, setPausa] = useState<Pausa>(null);
  const test = testPorId(testId);
  const alumno = alumnoPorId(clase, alumnoId);
  const intento = clase.intentos[alumnoId]?.[testId];
  const volver = enlace("alumno", alumnoId);

  useEffect(() => {
    if (test !== undefined && alumno !== undefined && intento === undefined) actualizar((c) => empezarTest(c, alumnoId, testId));
  }, [test, alumno, intento, actualizar, alumnoId, testId]);

  if (test === undefined || alumno === undefined) {
    return (
      <div className="hoja">
        <Titulo>Este test no está disponible.</Titulo>
        <a className="boton boton-principal" href={volver}>Volver</a>
      </div>
    );
  }
  if (intento === undefined) return <div className="hoja"><Titulo>Preparando…</Titulo></div>;

  if (intento.terminado) {
    const practicar = practicasPendientes(clase, alumnoId).filter((p) => p.testId === testId);
    const primera = practicar[0];
    return (
      <div className="hoja hoja-centrada">
        {!presentacion.sinExtras && <Mascot mood="cheer" size={150} />}
        <Titulo>¡Has terminado, {alumno.nombre}!</Titulo>
        <p className="texto-grande">{primera === undefined ? "Buen trabajo. Lo has hecho con mucho esfuerzo." : "Buen trabajo. Hemos preparado unos ejercicios solo para ti."}</p>
        {primera === undefined ? (
          <a className="boton boton-principal boton-grande" href={volver}>Volver a mis tests</a>
        ) : (
          <a className="boton boton-principal boton-grande" href={enlace("alumno", alumnoId, "practica", testId, primera.subhabilidad)}>Practicar <Icon name="arrow" size={26} /></a>
        )}
      </div>
    );
  }

  if (pausa !== null) return <PantallaPausa tipo={pausa} volver={volver} onSeguir={() => setPausa(null)} />;

  const pregunta = preguntaActual(clase, alumnoId, testId);
  if (pregunta === null) return <div className="hoja"><Titulo>Preparando…</Titulo></div>;
  const respondidas = intento.estado.respuestas.length;

  return (
    <div className="tarea">
      <header className="tarea-cabecera">
        <h1 id="titulo" tabIndex={-1} className="tarea-titulo">{test.nombre}</h1>
        <Progreso actual={respondidas + 1} total={test.preguntas} barra={presentacion.barraProgreso} />
        <a className="tarea-salir" href={volver}><Icon name="close" /> Salir</a>
      </header>
      <PreguntaVista
        key={pregunta.id}
        pregunta={pregunta}
        presentacion={presentacion}
        onContinuar={(acierto) => {
          actualizar((c) => registrarRespuesta(c, alumnoId, testId, pregunta, acierto));
          setPausa(pausaTras(respondidas + 1, test.preguntas, presentacion));
          window.scrollTo(0, 0);
        }}
      />
    </div>
  );
}
