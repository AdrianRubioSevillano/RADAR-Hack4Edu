// Título de la pestaña: sale de la ruta y de los datos, no de lo que haya pintado en ese momento.
import { testPorId } from "../content/tests.ts";
import { IDIOMA_DEFECTO, crearT, type Traductor } from "../i18n/index.ts";
import { nombreTest } from "../i18n/nombres.ts";
import { alumnoPorId, type Clase } from "./clase.ts";
import type { Ruta } from "./rutas.ts";

const MARCA = "RADAR";
const conMarca = (texto: string | undefined) => (texto === undefined ? MARCA : `${texto} · ${MARCA}`);

export function tituloPestana(ruta: Ruta, clase: Clase, t: Traductor = crearT(IDIOMA_DEFECTO)): string {
  switch (ruta.nombre) {
    case "inicio":
      return MARCA;
    case "acerca":
      return t("inicio.acerca");
    case "alumnos":
      return conMarca(t("alumno.quien"));
    case "alumno":
    case "detalle":
      return conMarca(alumnoPorId(clase, ruta.alumnoId)?.nombre);
    case "test": {
      const test = testPorId(ruta.testId);
      const intento = clase.intentos[ruta.alumnoId]?.[ruta.testId];
      if (test === undefined) return MARCA;
      if (intento === undefined || intento.terminado) return conMarca(nombreTest(t, test));
      return `${t("test.pregunta", { n: intento.estado.respuestas.length + 1 })} · ${nombreTest(t, test)}`;
    }
    case "practica":
      return conMarca(t("test.practicar"));
    case "pin":
      return conMarca(t(clase.pinHash === null ? "pin.creaCorto" : "pin.escribe"));
    case "profesor":
      return conMarca(t("nav.miClase"));
    case "ajustes":
      return conMarca(t("nav.ajustes"));
  }
}
