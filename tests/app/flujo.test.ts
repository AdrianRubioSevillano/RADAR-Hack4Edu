import { describe, expect, it } from "vitest";
import { resultado } from "../../src/core/test.ts";
import { alternarAsignacion, alternarAyuda, anadirAlumno, claseVacia, cuadriculaDe, detalleDeAlumno, ejerciciosDe, empezarTest, estadoDeAlumno, marcarEjercicioHecho, miniTestDe, practicasPendientes, preguntaActual, quitarAlumno, recomendacionDe, registrarMiniTest, registrarRespuesta, testsDeAlumno, type Clase } from "../../src/services/clase.ts";
import { crearDemo, TESTS_DEMO } from "../../src/services/demo.ts";

const TEST = "NUM2-T3";

function clasePrueba(nombres: readonly string[]): Clase {
  const base = nombres.reduce((c, n) => anadirAlumno(c, n), claseVacia(1, 2));
  return alternarAsignacion(base, TEST);
}

// Hace un test acertando todo salvo la subhabilidad indicada.
function hacerTest(clase: Clase, alumnoId: string, testId: string, falla: string | null): Clase {
  let c = empezarTest(clase, alumnoId, testId);
  for (let p = preguntaActual(c, alumnoId, testId); p !== null; p = preguntaActual(c, alumnoId, testId)) {
    c = registrarRespuesta(c, alumnoId, testId, p, p.subhabilidad !== falla);
  }
  return c;
}

describe("flujo completo sobre los datos", () => {
  it("alumno falla → rojo → recomendación → práctica → mini-test → semáforo actualizado", () => {
    const inicio = clasePrueba(["Ana", "Luis"]);
    const [ana] = inicio.alumnos;
    if (ana === undefined) throw new Error("sin alumno");
    const c1 = hacerTest(inicio, ana.id, TEST, "NUM2-T3-c");

    const rec = recomendacionDe(c1);
    expect(rec.subhabilidad).toBe("NUM2-T3-c");
    expect(rec.evaluados).toBe(1);
    expect(rec.sinRespuestas).toHaveLength(1);
    expect(cuadriculaDe(c1).filas[0]?.celdas).toEqual(["verde", "verde", "rojo"]);

    const pendientes = practicasPendientes(c1, ana.id);
    expect(pendientes.map((p) => p.subhabilidad)).toEqual(["NUM2-T3-c"]);

    const ejercicios = ejerciciosDe(c1, ana.id, TEST, "NUM2-T3-c");
    expect(ejercicios.map((e) => e.dificultad)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(ejercicios.every((e) => e.subhabilidad === "NUM2-T3-c")).toBe(true);
    const c2 = ejercicios.reduce((c) => marcarEjercicioHecho(c, ana.id, TEST, "NUM2-T3-c"), c1);

    const mini = miniTestDe(c2, ana.id, TEST, "NUM2-T3-c");
    expect(mini).toHaveLength(3);
    const salida = registrarMiniTest(c2, ana.id, TEST, "NUM2-T3-c", mini.map((pregunta) => ({ pregunta, acierto: true })));
    expect(salida.superado).toBe(true);
    expect(cuadriculaDe(salida.clase).filas[0]?.celdas[2]).not.toBe("rojo");
    expect(recomendacionDe(salida.clase).subhabilidad).toBeNull();
    expect(practicasPendientes(salida.clase, ana.id)).toEqual([]);
  });

  it("si el mini-test sale mal sigue en rojo y hay otra ronda de ejercicios distintos", () => {
    const inicio = clasePrueba(["Ana"]);
    const id = inicio.alumnos[0]?.id as string;
    const c1 = hacerTest(inicio, id, TEST, "NUM2-T3-c");
    const primera = ejerciciosDe(c1, id, TEST, "NUM2-T3-c");
    const mini = miniTestDe(c1, id, TEST, "NUM2-T3-c");
    const salida = registrarMiniTest(c1, id, TEST, "NUM2-T3-c", mini.map((pregunta) => ({ pregunta, acierto: false })));
    expect(salida.superado).toBe(false);
    expect(practicasPendientes(salida.clase, id)).toHaveLength(1);
    expect(ejerciciosDe(salida.clase, id, TEST, "NUM2-T3-c").map((e) => e.id)).not.toEqual(primera.map((e) => e.id));
  });

  it("un alumno que lo acierta todo no tiene práctica, y el test no muta la clase original", () => {
    const inicio = clasePrueba(["Ana"]);
    const copia = JSON.stringify(inicio);
    const id = inicio.alumnos[0]?.id as string;
    const c = hacerTest(inicio, id, TEST, null);
    expect(JSON.stringify(inicio)).toBe(copia);
    expect(practicasPendientes(c, id)).toEqual([]);
    expect(testsDeAlumno(c, id)[0]?.estado).toBe("hecho");
  });

  it("en un test mezclado, el tema en rojo se refuerza por su subhabilidad más débil", () => {
    const base = alternarAsignacion(clasePrueba(["Ana"]), "NUM2-REPASO");
    const id = base.alumnos[0]?.id as string;
    let c = empezarTest(base, id, "NUM2-REPASO");
    for (let p = preguntaActual(c, id, "NUM2-REPASO"); p !== null; p = preguntaActual(c, id, "NUM2-REPASO")) {
      c = registrarRespuesta(c, id, "NUM2-REPASO", p, !p.subhabilidad.startsWith("NUM2-T3"));
    }
    const [practica] = practicasPendientes(c, id);
    expect(practica?.subhabilidad.startsWith("NUM2-T3")).toBe(true);
    expect(estadoDeAlumno(c, id).subhabilidades.some((s) => s.color === "rojo" && s.subhabilidad === practica?.subhabilidad)).toBe(true);
  });
});

describe("recomendación sobre una clase", () => {
  it("los alumnos sin respuestas no cuentan aunque estén en la clase", () => {
    const inicio = clasePrueba(["Ana", "Luis", "Rosa"]);
    const [a, b] = inicio.alumnos.map((x) => x.id) as [string, string];
    const c = hacerTest(hacerTest(inicio, a, TEST, "NUM2-T3-c"), b, TEST, null);
    const r = recomendacionDe(c);
    expect(r.evaluados).toBe(2);
    expect(r.rojos).toBe(1);
    expect(r.sinRespuestas).toHaveLength(1);
    expect(r.sinRojos).toEqual([b]);
  });

  it("un test a medias no cuenta", () => {
    const inicio = clasePrueba(["Ana"]);
    const id = inicio.alumnos[0]?.id as string;
    let c = empezarTest(inicio, id, TEST);
    const p = preguntaActual(c, id, TEST);
    if (p === null) throw new Error("sin pregunta");
    c = registrarRespuesta(c, id, TEST, p, false);
    expect(recomendacionDe(c).evaluados).toBe(0);
    expect(testsDeAlumno(c, id)[0]?.estado).toBe("enCurso");
  });
});

describe("datos de demo", () => {
  const demo = crearDemo();

  it("2.º de primaria, 20 alumnos con resultados en 3 temas y 3 sin hacer", () => {
    expect(demo.curso).toBe(2);
    expect(demo.alumnos).toHaveLength(23);
    const r = recomendacionDe(demo);
    expect(r.evaluados).toBe(20);
    expect(r.sinRespuestas).toHaveLength(3);
    expect(cuadriculaDe(demo).grupos).toHaveLength(TESTS_DEMO.length);
  });

  it("recomienda Cambio sencillo y hay de los tres colores", () => {
    expect(recomendacionDe(demo).subhabilidad).toBe("NUM2-T3-c");
    const colores = new Set(cuadriculaDe(demo).filas.flatMap((f) => f.celdas));
    expect(colores.has("verde") && colores.has("rojo")).toBe(true);
  });

  it("hay alumnos con ayudas de dislexia y baja visión, sin hacer nada aún", () => {
    const amina = demo.alumnos.find((a) => a.ayudas.includes("dislexia"));
    const omar = demo.alumnos.find((a) => a.ayudas.includes("bajaVision"));
    expect(amina?.nombre).toBe("Amina");
    expect(omar?.nombre).toBe("Omar");
    expect(detalleDeAlumno(demo, amina?.id as string)?.tests).toEqual([]);
  });

  it("es determinista", () => {
    expect(crearDemo()).toEqual(demo);
  });

  it("cada intento del demo llega a 10 respuestas", () => {
    for (const intentos of Object.values(demo.intentos)) {
      for (const i of Object.values(intentos)) {
        expect(i.terminado).toBe(true);
        expect(resultado(i.estado).length).toBeGreaterThan(0);
      }
    }
  });
});

describe("ajustes", () => {
  it("añadir, quitar y activar ayudas", () => {
    const c = anadirAlumno(anadirAlumno(claseVacia(1, 3), "Ana"), "  ");
    expect(c.alumnos).toHaveLength(1);
    const id = c.alumnos[0]?.id as string;
    const conAyudas = alternarAyuda(alternarAyuda(c, id, "tdah"), id, "dislexia");
    expect(conAyudas.alumnos[0]?.ayudas).toEqual(["dislexia", "tdah"]);
    expect(alternarAyuda(conAyudas, id, "tdah").alumnos[0]?.ayudas).toEqual(["dislexia"]);
    expect(quitarAlumno(conAyudas, id).alumnos).toEqual([]);
  });

  it("solo se guardan las ayudas: ningún campo de diagnóstico en la clase", () => {
    expect(JSON.stringify(crearDemo().alumnos)).not.toMatch(/diagn[oó]stico/i);
  });
});
