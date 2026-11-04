import { describe, expect, it } from "vitest";
import { recomendar, type EstadoAlumno } from "../../src/core/recomendacion.ts";
import { PATRON_MINITEST, PATRON_PAQUETE, crearSerie, type NivelDificultad } from "../../src/core/refuerzo.ts";
import type { Rng } from "../../src/core/rng.ts";
import { colorSemaforo } from "../../src/core/semaforo.ts";
import { MotorError, type Color } from "../../src/core/tipos.ts";

describe("semáforo", () => {
  it("aplica los umbrales 0.7 y 0.3 y el mínimo de respuestas", () => {
    expect(colorSemaforo(0.7, 2)).toBe("verde");
    expect(colorSemaforo(0.69, 2)).toBe("amarillo");
    expect(colorSemaforo(0.31, 2)).toBe("amarillo");
    expect(colorSemaforo(0.3, 2)).toBe("rojo");
    expect(colorSemaforo(0.95, 1)).toBe("amarillo");
    expect(colorSemaforo(0.01, 0)).toBe("amarillo");
    expect(() => colorSemaforo(Number.NaN, 3)).toThrow(MotorError);
  });

  it("admite umbrales configurados", () => {
    expect(colorSemaforo(0.6, 1, { verde: 0.5, rojo: 0.2, minimoRespuestas: 1 })).toBe("verde");
  });
});

const sub = (subhabilidad: string, orden: number, color: Color, p = color === "rojo" ? 0.1 : 0.8) => ({ subhabilidad, orden, p, color });

describe("recomendación", () => {
  // Caso construido a mano: 3 alumnos con respuestas y 2 sin ellas.
  const alumnos: EstadoAlumno[] = [
    { alumnoId: "A", respuestas: 10, subhabilidades: [sub("x", 0, "verde"), sub("y", 1, "rojo", 0.2), sub("z", 2, "rojo", 0.1)] },
    { alumnoId: "B", respuestas: 10, subhabilidades: [sub("x", 0, "rojo"), sub("y", 1, "rojo"), sub("z", 2, "verde")] },
    { alumnoId: "C", respuestas: 10, subhabilidades: [sub("x", 0, "verde"), sub("y", 1, "verde"), sub("z", 2, "verde")] },
    { alumnoId: "D", respuestas: 0, subhabilidades: [sub("x", 0, "rojo"), sub("y", 1, "rojo"), sub("z", 2, "rojo")] },
    { alumnoId: "E", respuestas: 0, subhabilidades: [] },
  ];

  it("elige la subhabilidad con más rojos y los alumnos sin respuestas no cuentan nunca", () => {
    const r = recomendar(alumnos);
    expect(r.subhabilidad).toBe("y");
    expect(r.rojos).toBe(2);
    expect(r.evaluados).toBe(3);
    expect(r.sinRespuestas).toEqual(["D", "E"]);
    expect(r.grupos.flatMap((g) => g.alumnos)).not.toContain("D");
  });

  it("agrupa a cada alumno por la subhabilidad que más necesita", () => {
    const r = recomendar(alumnos);
    expect(r.grupos).toEqual([
      { subhabilidad: "x", alumnos: ["B"] },
      { subhabilidad: "z", alumnos: ["A"] },
    ]);
    expect(r.sinRojos).toEqual(["C"]);
  });

  it("en empate gana la subhabilidad anterior en el orden del tema", () => {
    const r = recomendar([{ alumnoId: "A", respuestas: 5, subhabilidades: [sub("b", 1, "rojo"), sub("a", 0, "rojo")] }]);
    expect(r.subhabilidad).toBe("a");
  });

  it("sin rojos no recomienda, y sin alumnos tampoco falla", () => {
    expect(recomendar([{ alumnoId: "A", respuestas: 5, subhabilidades: [sub("a", 0, "verde")] }]).subhabilidad).toBeNull();
    expect(recomendar([]).subhabilidad).toBeNull();
  });
});

describe("refuerzo", () => {
  let n = 0;
  const generar = (rng: Rng, d: NivelDificultad) => ({ id: `q${d}-${Math.floor(rng() * 50)}`, dificultad: d });

  it("paquete de 6 de fácil a difícil, sin repetir y sin los ya vistos", () => {
    const vistos = [{ id: "q1-0", dificultad: 1 as const }];
    const paquete = crearSerie(generar, 11, PATRON_PAQUETE, vistos);
    expect(paquete.map((e) => e.dificultad)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(new Set(paquete.map((e) => e.id)).size).toBe(6);
    expect(paquete.map((e) => e.id)).not.toContain("q1-0");
    expect(crearSerie(generar, 11, PATRON_PAQUETE, vistos)).toEqual(paquete);
    n += paquete.length;
    expect(n).toBe(6);
  });

  it("mini-test de 3, evita plantillas ya usadas si puede", () => {
    const conPlantilla = (rng: Rng, d: NivelDificultad) => {
      const i = Math.floor(rng() * 8);
      return { id: `p${d}-${i}`, dificultad: d, plantilla: `t${i}` };
    };
    const serie = crearSerie(conPlantilla, 3, PATRON_MINITEST, [{ id: "z", dificultad: 1, plantilla: "t0" }]);
    expect(serie).toHaveLength(3);
    expect(new Set(serie.map((e) => e.plantilla)).size).toBe(3);
    expect(serie.map((e) => e.plantilla)).not.toContain("t0");
  });
});
