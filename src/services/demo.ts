// Datos de demo: 2.º de primaria, 20 alumnos simulados con resultados en 3 temas y 3
// alumnos sin hacer nada, para probar en directo. Todo sale de una semilla fija.
import { flujo } from "../core/rng.ts";
import { claseVacia, empezarTest, preguntaActual, registrarRespuesta, type Alumno, type Ayuda, type Clase } from "./clase.ts";

export const SEMILLA_DEMO = 2026;

const CON_DATOS = ["Bruno", "Carla", "Diego", "Elena", "Farid", "Gabriela", "Hugo", "Imani", "Jorge", "Keiko", "Kofi", "Nadia", "Malik", "Paula", "Ravi", "Rosa", "Samuel", "Valeria", "Wei", "Zoe"];
const SIN_DATOS: readonly { readonly nombre: string; readonly ayudas: readonly Ayuda[] }[] = [
  { nombre: "Amina", ayudas: ["dislexia"] },
  { nombre: "Omar", ayudas: ["bajaVision"] },
  { nombre: "Lucía", ayudas: [] },
];

export const TESTS_DEMO = ["NUM2-T3", "NUM2-T2", "LEE2-T1"] as const;

// Lo que cada perfil simulado aún no domina. La verdad simulada solo decide las respuestas:
// el motor no la recibe, y por eso el resultado puede ser distinto.
const PERFILES: readonly (readonly string[])[] = [
  [],
  ["NUM2-T3-c"],
  ["NUM2-T3-c", "NUM2-T2-b"],
  ["NUM2-T3-b", "NUM2-T3-c", "NUM2-T2-b", "NUM2-T2-c"],
  ["NUM2-T3-c", "LEE2-T1-c"],
];

export function crearDemo(): Clase {
  const alumnos: Alumno[] = [
    ...CON_DATOS.map((nombre, i) => ({ id: `A${String(i + 1).padStart(2, "0")}`, nombre, avatar: i + 1, ayudas: [] })),
    ...SIN_DATOS.map(({ nombre, ayudas }, i) => ({ id: `A${String(CON_DATOS.length + i + 1).padStart(2, "0")}`, nombre, avatar: CON_DATOS.length + i + 1, ayudas })),
  ];
  const base: Clase = { ...claseVacia(SEMILLA_DEMO, 2), alumnos, asignados: [...TESTS_DEMO] };

  return CON_DATOS.reduce((clase, _, i) => {
    const alumno = alumnos[i] as Alumno;
    const faltan = new Set(PERFILES[i % PERFILES.length]);
    return TESTS_DEMO.reduce((actual, testId) => {
      const rng = flujo(SEMILLA_DEMO, `demo/${alumno.id}/${testId}`);
      let c = empezarTest(actual, alumno.id, testId);
      for (let p = preguntaActual(c, alumno.id, testId); p !== null; p = preguntaActual(c, alumno.id, testId)) {
        const domina = !faltan.has(p.subhabilidad);
        c = registrarRespuesta(c, alumno.id, testId, p, rng() < (domina ? 1 - p.slip : p.guess));
      }
      return c;
    }, clase);
  }, base);
}
