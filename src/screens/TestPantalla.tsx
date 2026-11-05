import { useEffect, useState } from "react";
import { Icon, Mascot } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { useIdioma } from "../components/IdiomaProvider.tsx";
import { PreguntaVista } from "../components/PreguntaVista.tsx";
import { AvisoContenido } from "../components/SelectorIdioma.tsx";
import { Titulo } from "../components/ui.tsx";
import { testPorId } from "../content/tests.ts";
import { nombreTest } from "../i18n/nombres.ts";
import { alumnoPorId, empezarTest, practicasPendientes, preguntaActual, registrarRespuesta } from "../services/clase.ts";
import { pausaTras, type Pausa, type Presentacion } from "../services/perfiles.ts";
import { enlace } from "../services/rutas.ts";

export function Progreso({ actual, total, barra }: { actual: number; total: number; barra: boolean }) {
  const { t } = useIdioma();
  return (
    <div className="progreso">
      <span>{t("test.progreso", { actual, total })}</span>
      {barra && (
        <div className="progreso-barra" role="progressbar" aria-label={t("test.progresoAria")} aria-valuemin={0} aria-valuemax={total} aria-valuenow={actual - 1}>
          <span style={{ width: `${((actual - 1) / total) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

function PantallaPausa({ tipo, volver, onSeguir }: { tipo: Exclude<Pausa, null>; volver: string; onSeguir: () => void }) {
  const { t } = useIdioma();
  return (
    <div className="hoja hoja-centrada">
      <span className="pausa-icono" aria-hidden="true"><Icon name="pause" size={56} /></span>
      <Titulo>{t(tipo === "parte" ? "pausa.parte" : "pausa.descanso")}</Titulo>
      <p className="texto-grande">{t(tipo === "parte" ? "pausa.parteTexto" : "pausa.descansoTexto")}</p>
      <button type="button" className="boton boton-principal boton-grande" onClick={onSeguir}>{t("pausa.seguir")}</button>
      {tipo === "parte" && <a className="enlace-suave" href={volver}>{t("pausa.luego")}</a>}
    </div>
  );
}

export function TestPantalla({ alumnoId, testId, presentacion }: { alumnoId: string; testId: string; presentacion: Presentacion }) {
  const { clase, actualizar } = useClase();
  const { idioma, t } = useIdioma();
  const [pausa, setPausa] = useState<Pausa>(null);
  const test = testPorId(testId);
  const alumno = alumnoPorId(clase, alumnoId);
  const intento = clase.intentos[alumnoId]?.[testId];
  const volver = enlace("alumno", alumnoId);

  useEffect(() => {
    if (test !== undefined && alumno !== undefined && intento === undefined) actualizar((c) => empezarTest(c, alumnoId, testId, idioma));
  }, [test, alumno, intento, actualizar, alumnoId, testId, idioma]);

  if (test === undefined || alumno === undefined) {
    return (
      <div className="hoja">
        <Titulo>{t("test.noDisponible")}</Titulo>
        <a className="boton boton-principal" href={volver}>{t("nav.volver")}</a>
      </div>
    );
  }
  if (intento === undefined) return <div className="hoja"><Titulo>{t("app.preparando")}</Titulo></div>;

  if (intento.terminado) {
    const practicar = practicasPendientes(clase, alumnoId).filter((p) => p.testId === testId);
    const primera = practicar[0];
    return (
      <div className="hoja hoja-centrada">
        {!presentacion.sinExtras && <Mascot mood="cheer" size={150} />}
        <Titulo>{t("test.terminado", { nombre: alumno.nombre })}</Titulo>
        <p className="texto-grande">{t(primera === undefined ? "test.buenTrabajo" : "test.preparado")}</p>
        {primera === undefined ? (
          <a className="boton boton-principal boton-grande" href={volver}>{t("nav.volverTests")}</a>
        ) : (
          <a className="boton boton-principal boton-grande" href={enlace("alumno", alumnoId, "practica", testId, primera.subhabilidad)}>{t("test.practicar")} <Icon name="arrow" size={26} /></a>
        )}
      </div>
    );
  }

  if (pausa !== null) return <PantallaPausa tipo={pausa} volver={volver} onSeguir={() => setPausa(null)} />;

  const pregunta = preguntaActual(clase, alumnoId, testId);
  if (pregunta === null) return <div className="hoja"><Titulo>{t("app.preparando")}</Titulo></div>;
  const respondidas = intento.estado.respuestas.length;

  return (
    <div className="tarea">
      <header className="tarea-cabecera">
        <h1 id="titulo" tabIndex={-1} className="tarea-titulo">{nombreTest(t, test)}</h1>
        <Progreso actual={respondidas + 1} total={test.preguntas} barra={presentacion.barraProgreso} />
        <a className="tarea-salir" href={volver}><Icon name="close" /> {t("nav.salir")}</a>
      </header>
      {!presentacion.sinExtras && <AvisoContenido pregunta={pregunta} />}
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
