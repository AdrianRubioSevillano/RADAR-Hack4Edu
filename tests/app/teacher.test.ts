import { describe, expect, it } from "vitest";
import { createDemoClass } from "../../src/services/demoClass.ts";
import {
  KNOWLEDGE_GRAPH,
  compareInterventionPlans,
  rankInterventions,
} from "../../src/services/engine.ts";
import { collectiveActivities } from "../../src/services/collective.ts";
import { createSession, orderedStates } from "../../src/services/session.ts";
import {
  analyzePlans,
  classDiagnosticOf,
  comparisonNarrative,
  evidenceLabel,
  parseMinutes,
  pendingRows,
  planSummary,
} from "../../src/services/teacher.ts";
import { handle, simulatedSession } from "./support.ts";

function analysis(session: ReturnType<typeof simulatedSession>, minutes = 30) {
  const diagnostic = classDiagnosticOf(orderedStates(session));
  const plans = analyzePlans(diagnostic, minutes);
  if (!plans.ok) throw new Error(plans.message);
  return { diagnostic, ...plans };
}

describe("vista docente", () => {
  it("usa exactamente los resultados del motor", () => {
    const session = simulatedSession(9);
    const { diagnostic, ranking, comparison } = analysis(session);
    expect(ranking).toEqual(rankInterventions(diagnostic, KNOWLEDGE_GRAPH, 30));
    expect(comparison).toEqual(
      compareInterventionPlans(diagnostic, KNOWLEDGE_GRAPH, 30),
    );
    expect(comparison.collectivePlan.plan).toEqual(ranking.plan);
  });

  it("clase vacía: sin 0 % ni planes", () => {
    const session = createSession(createDemoClass(42, 0));
    const { diagnostic, ranking, comparison } = analysis(session);
    expect(diagnostic.evidenceStatus).toBe("emptyClass");
    expect(evidenceLabel(diagnostic)).toBe("Clase vacía");
    expect(diagnostic.skills.every((s) => s.meanMastery === null)).toBe(true);
    expect(ranking.ranking).toEqual([]);
    expect(comparisonNarrative(comparison)).toMatch(/No hay alumnos/);
    expect(pendingRows(comparison, session.students, "collective")).toEqual([]);
  });

  it("solo priors: análisis hipotético y planes vacíos", () => {
    const session = createSession(handle);
    const { diagnostic, ranking, comparison } = analysis(session);
    expect(diagnostic.evidenceStatus).toBe("priorsOnly");
    expect(ranking.basis).toBe("hypotheticalPriorsOnly");
    expect(ranking.plan.interventions).toEqual([]);
    expect(comparison.pendingNeedPlan.plan.interventions).toEqual([]);
    expect(comparisonNarrative(comparison)).toMatch(/recoger evidencia/);
  });

  it("evidencia parcial: conserva a los alumnos sin respuestas", () => {
    const session = simulatedSession(6, 10);
    const { diagnostic, comparison } = analysis(session);
    expect(diagnostic.evidenceStatus).toBe("mixed");
    const rows = pendingRows(comparison, session.students, "collective");
    expect(rows).toHaveLength(30);
    expect(rows.filter((r) => r.basedOnPriorOnly)).toHaveLength(20);
  });

  it("ordena las necesidades pendientes y las separa por plan", () => {
    const session = simulatedSession(9);
    const { comparison } = analysis(session);
    const rows = pendingRows(comparison, session.students, "pendingNeed");
    for (let i = 1; i < rows.length; i++)
      expect(rows[i - 1]!.pendingNeed!).toBeGreaterThanOrEqual(rows[i]!.pendingNeed!);
    const summary = planSummary(comparison.pendingNeedPlan, session.students);
    expect(summary.maxPending).toBe(comparison.pendingNeedPlan.analysis.maxPending);
    expect(summary.highestPendingStudent).toMatch(/^Alumno ficticio/);
  });

  it("describe la coincidencia o la diferencia sin declarar un ganador", () => {
    const session = simulatedSession(9);
    let sawDifferent = false;
    let sawSame = false;
    for (const minutes of [0, 15, 30, 45, 60, 90]) {
      const { comparison } = analysis(session, minutes);
      const text = comparisonNarrative(comparison);
      expect(text).not.toMatch(/mejor plan|aprendid|resuelt|beneficiad/i);
      if (comparison.plansCoincide) {
        sawSame = true;
        expect(text).toMatch(/mismas competencias/);
      } else {
        sawDifferent = true;
        expect(text).toMatch(/ninguno se presenta como el mejor/);
      }
    }
    expect(sawSame).toBe(true);
    expect(sawDifferent).toBe(true);
  });

  it("convierte un presupuesto no representable en un mensaje, no en un fallo", () => {
    const diagnostic = classDiagnosticOf(orderedStates(simulatedSession(4, 3)));
    const result = analyzePlans(diagnostic, 0.01);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("INVALID_BUDGET");
    expect(parseMinutes("7,5")).toBe(7.5);
    expect(parseMinutes(" 30 ")).toBe(30);
    expect(parseMinutes("-1")).toBeNull();
    expect(parseMinutes("abc")).toBeNull();
    expect(parseMinutes("")).toBeNull();
  });

  it("prepara una actividad por competencia del plan, con su duración", () => {
    const { diagnostic, ranking } = analysis(simulatedSession(9), 45);
    const activities = collectiveActivities(ranking.plan, diagnostic, ranking);
    expect(activities.map((a) => a.skill)).toEqual(
      ranking.plan.interventions.map((i) => i.skill),
    );
    for (const activity of activities) {
      expect(activity.activity).not.toBeNull();
      expect(activity.exercises).toHaveLength(3);
      expect(activity.shortage).toBeNull();
      expect(activity.durationMinutes).toBe(15);
    }
  });

  it("no inventa actividades con un plan vacío", () => {
    const { diagnostic, ranking } = analysis(simulatedSession(9), 0);
    expect(collectiveActivities(ranking.plan, diagnostic, ranking)).toEqual([]);
  });
});
