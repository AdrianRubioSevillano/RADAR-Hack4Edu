import { describe, expect, it } from "vitest";
import { marginals } from "../../src/services/engine.ts";
import { observedBySkill } from "../../src/services/diagnostic.ts";
import { percentBounded, originText } from "../../src/services/format.ts";
import { classHeadline, classRadarView, needRadius, polarPoint } from "../../src/services/radarView.ts";
import { createSession, orderedStates, stateOf } from "../../src/services/session.ts";
import { classDiagnosticOf, readableMessage } from "../../src/services/teacher.ts";
import { handle, simulatedSession } from "./support.ts";

const radarOf = (session: ReturnType<typeof simulatedSession>) => {
  const diagnostic = classDiagnosticOf(orderedStates(session));
  return { diagnostic, view: classRadarView(session, diagnostic) };
};

describe("radar de clase", () => {
  it("coloca a cada alumno con respuestas una sola vez", () => {
    const { view } = radarOf(simulatedSession(9));
    expect(view.blips).toHaveLength(30);
    expect(new Set(view.blips.map((b) => b.studentId)).size).toBe(30);
    expect(view.withoutEvidence).toEqual([]);
    expect(view.sectors).toHaveLength(6);
  });

  it("no dibuja el prior: un alumno sin respuestas queda fuera del radar", () => {
    const { view } = radarOf(simulatedSession(6, 10));
    expect(view.blips).toHaveLength(10);
    expect(view.withoutEvidence).toHaveLength(20);
    const empty = radarOf(createSession(handle));
    expect(empty.view.blips).toEqual([]);
    expect(classHeadline(empty.diagnostic)).toBeNull();
  });

  it("el sector es la mayor necesidad entre las competencias medidas", () => {
    const session = simulatedSession(3);
    const { view } = radarOf(session);
    for (const blip of view.blips) {
      const state = stateOf(session, blip.studentId);
      const observed = observedBySkill(state);
      const p = marginals(state.joint);
      const needs = Object.keys(observed)
        .filter((id) => (observed[id] ?? 0) > 0)
        .map((id) => [id, 1 - (p[id] ?? 0)] as const);
      expect(needs.map(([id]) => id)).toContain(blip.skill);
      expect(blip.need).toBeCloseTo(Math.max(...needs.map(([, n]) => n)), 12);
      expect(blip.meanNeed).toBeCloseTo(needs.reduce((t, [, n]) => t + n, 0) / needs.length, 12);
    }
  });

  it("cada punto cae dentro de su sector y del círculo", () => {
    const { view } = radarOf(simulatedSession(9));
    view.sectors.forEach((sector, index) => {
      for (const blip of sector.blips) {
        expect(blip.angle).toBeGreaterThan(index * 60);
        expect(blip.angle).toBeLessThan(index * 60 + 60);
        expect(Math.hypot(blip.x - 50, blip.y - 50)).toBeLessThanOrEqual(44);
      }
    });
    expect(needRadius(1)).toBeLessThanOrEqual(1);
    expect(polarPoint(0, 1)).toEqual({ x: 50, y: 6 });
  });

  it("es determinista y no muta la sesión", () => {
    const session = simulatedSession(4);
    const before = JSON.stringify(session);
    expect(radarOf(session).view).toEqual(radarOf(session).view);
    expect(JSON.stringify(session)).toBe(before);
  });

  it("el titular cita la competencia con menor dominio medio", () => {
    const { diagnostic } = radarOf(simulatedSession(9));
    const headline = classHeadline(diagnostic)!;
    const means = diagnostic.skills.map((s) => s.meanMastery ?? 1);
    expect(headline.meanMastery).toBe(Math.min(...means));
  });
});

describe("textos deterministas", () => {
  it("no aparenta certeza con estimaciones extremas", () => {
    expect(percentBounded(0.9996)).toBe("> 99 %");
    expect(percentBounded(0.0004)).toBe("< 1 %");
    expect(percentBounded(0.42)).toBe("42 %");
    expect(percentBounded(null)).toBe("No disponible");
  });

  it("concuerda en número y traduce los ids de competencia", () => {
    expect(originText(1, 2)).toBe("1 manual, 2 simuladas");
    expect(originText(0, 1)).toBe("0 manuales, 1 simulada");
    expect(readableMessage("ALG: conviene reforzar antes el prerrequisito FRA")).toBe(
      "Simplificación algebraica: conviene reforzar antes el prerrequisito Fracciones",
    );
  });
});
