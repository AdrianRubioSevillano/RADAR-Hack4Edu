// Título de la pestaña: sale de la ruta y de los datos, no de lo que haya pintado en ese momento.
import { testPorId } from "../content/tests.ts";
import { alumnoPorId, type Clase } from "./clase.ts";
import type { Ruta } from "./rutas.ts";

const MARCA = "RADAR";
const conMarca = (texto: string | undefined) => (texto === undefined ? MARCA : `${texto} · ${MARCA}`);

export function tituloPestana(ruta: Ruta, clase: Clase): string {
  switch (ruta.nombre) {
    case "inicio":
      return MARCA;
    case "acerca":
      return "Acerca de RADAR";
    case "alumnos":
      return conMarca("¿Quién eres?");
    case "alumno":
    case "detalle":
      return conMarca(alumnoPorId(clase, ruta.alumnoId)?.nombre);
    case "test": {
      const test = testPorId(ruta.testId);
      const intento = clase.intentos[ruta.alumnoId]?.[ruta.testId];
      if (test === undefined) return MARCA;
      if (intento === undefined || intento.terminado) return conMarca(test.nombre);
      return `Pregunta ${intento.estado.respuestas.length + 1} · ${test.nombre}`;
    }
    case "practica":
      return conMarca("Practicar");
    case "pin":
      return conMarca(clase.pinHash === null ? "Crea tu PIN" : "Escribe tu PIN");
    case "profesor":
      return conMarca("Mi clase");
    case "ajustes":
      return conMarca("Ajustes");
  }
}
