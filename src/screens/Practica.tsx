import { useMemo, useState } from "react";
import { Icon, Mascot } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { useIdioma } from "../components/IdiomaProvider.tsx";
import { PreguntaVista } from "../components/PreguntaVista.tsx";
import { AvisoContenido } from "../components/SelectorIdioma.tsx";
import { Titulo } from "../components/ui.tsx";
import type { Pregunta } from "../content/tipos.ts";
import { nombreSub } from "../i18n/nombres.ts";
import { ejerciciosDe, marcarEjercicioHecho, miniTestDe, registrarMiniTest } from "../services/clase.ts";
import type { Presentacion } from "../services/perfiles.ts";
import { enlace } from "../services/rutas.ts";
import { Progreso } from "./TestPantalla.tsx";

type Fase = "practica" | "reto" | "mini" | "superado" | "otraVez";

export function Practica({ alumnoId, testId, subId, presentacion }: { alumnoId: string; testId: string; subId: string; presentacion: Presentacion }) {
  const { clase, actualizar } = useClase();
  const { t } = useIdioma();
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
        <Titulo>{t("practica.noDisponible")}</Titulo>
        <a className="boton boton-principal" href={volver}>{t("nav.volver")}</a>
      </div>
    );
  }
  const nombre = nombreSub(t, subId);

  if (fase === "superado" || fase === "otraVez") {
    const bien = fase === "superado";
    return (
      <div className="hoja hoja-centrada">
        {!presentacion.sinExtras && <Mascot mood={bien ? "cheer" : "hello"} size={150} />}
        <Titulo>{t(bien ? "practica.conseguido" : "practica.mejorando")}</Titulo>
        <p className="texto-grande">{bien ? t("practica.sabesMas", { nombre }) : t("practica.otroDia")}</p>
        <a className="boton boton-principal boton-grande" href={volver}>{t("nav.volverTests")}</a>
      </div>
    );
  }

  if (fase === "reto") {
    return (
      <div className="hoja hoja-centrada">
        {!presentacion.sinExtras && <Mascot mood="cheer" size={150} />}
        <Titulo>{t("practica.terminados")}</Titulo>
        <p className="texto-grande">{t("practica.retoTexto")}</p>
        <button type="button" className="boton boton-principal boton-grande" onClick={() => setFase("mini")}>{t("practica.retoEmpezar")} <Icon name="arrow" size={26} /></button>
      </div>
    );
  }

  const enMini = fase === "mini";
  const lista = enMini ? reto : ejercicios;
  const indice = enMini ? mini.length : refuerzo.hechos;
  const pregunta = lista[indice];
  if (pregunta === undefined) return <div className="hoja"><Titulo>{t("app.preparando")}</Titulo></div>;

  return (
    <div className="tarea">
      <header className="tarea-cabecera">
        <h1 id="titulo" tabIndex={-1} className="tarea-titulo">{t(enMini ? "practica.reto" : "practica.practicamos", { nombre })}</h1>
        <Progreso actual={indice + 1} total={lista.length} barra={presentacion.barraProgreso} />
        <a className="tarea-salir" href={volver}><Icon name="close" /> {t("nav.salir")}</a>
      </header>
      {!presentacion.sinExtras && <AvisoContenido />}
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
