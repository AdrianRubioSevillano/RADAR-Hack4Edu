import { describe, expect, it } from "vitest";
import {
  checkPracticeAnswer,
  revealPracticeSolution,
  selectPractice,
} from "../../src/services/practice.ts";
import { PRACTICE_TEMPLATES } from "../../src/services/practiceBank.ts";
import { orderedStates, stateOf, updatePractice } from "../../src/services/session.ts";
import type { PracticeRecord } from "../../src/services/session.ts";
import { analyzePlans, classDiagnosticOf } from "../../src/services/teacher.ts";
import { RADAR_QUESTION_BANK } from "../../src/services/engine.ts";
import { simulatedSession } from "./support.ts";

function needsOf(session: ReturnType<typeof simulatedSession>, plan: "collective" | "pendingNeed") {
  const analysis = analyzePlans(classDiagnosticOf(orderedStates(session)), 30);
  if (!analysis.ok) throw new Error(analysis.message);
  const compared =
    plan === "collective"
      ? analysis.comparison.collectivePlan
      : analysis.comparison.pendingNeedPlan;
  return { compared, students: compared.analysis.students };
}

const session = simulatedSession(12);

function firstReady() {
  const { students, compared } = needsOf(session, "collective");
  for (const need of students) {
    const state = stateOf(session, need.studentId);
    const selection = selectPractice(state, need, {});
    if (selection.status === "ready" && selection.exercises.length > 0)
      return { need, state, selection, compared };
  }
  throw new Error("Ningún alumno con práctica");
}

describe("selección de práctica", () => {
  it("pide diagnóstico antes de elegir nada para un alumno sin respuestas", () => {
    const partial = simulatedSession(6, 2);
    const { students } = needsOf(partial, "collective");
    const need = students.find((s) => s.studentId === "S05")!;
    const selection = selectPractice(stateOf(partial, "S05"), need, {});
    expect(selection.status).toBe("needsDiagnostic");
  });

  it("no tiene índice sin análisis", () => {
    expect(selectPractice(stateOf(session, "S01"), null, {}).status).toBe("unavailable");
  });

  it("prioriza lo que el plan deja pendiente, de mayor a menor", () => {
    const { selection, compared } = firstReady();
    if (selection.status !== "ready") throw new Error("estado");
    const pending = selection.targets.filter((t) => t.reason === "pendingAfterPlan");
    for (const target of pending)
      expect(compared.analysis.scheduledSkills).not.toContain(target.skill);
    for (let i = 1; i < pending.length; i++)
      expect(pending[i - 1]!.pending!).toBeGreaterThanOrEqual(pending[i]!.pending!);
    const firstScheduled = selection.targets.findIndex((t) => t.reason === "scheduledInPlan");
    if (firstScheduled !== -1) expect(firstScheduled).toBe(pending.length);
  });

  it("cambia con el plan activo: la práctica depende de la comparación", () => {
    const a = needsOf(session, "collective");
    const b = needsOf(session, "pendingNeed");
    expect(a.compared.analysis.scheduledSkills).not.toEqual(
      b.compared.analysis.scheduledSkills,
    );
    const differs = a.students.some((need, i) => {
      const state = stateOf(session, need.studentId);
      return (
        JSON.stringify(selectPractice(state, need, {})) !==
        JSON.stringify(selectPractice(state, b.students[i]!, {}))
      );
    });
    expect(differs).toBe(true);
  });

  it("no elige competencias sin evidencia y lo declara", () => {
    const small = simulatedSession(2);
    const { students } = needsOf(small, "collective");
    for (const need of students) {
      const selection = selectPractice(stateOf(small, need.studentId), need, {});
      if (selection.status !== "ready") continue;
      expect(selection.unmeasured.length).toBeGreaterThan(0);
      const unmeasured = selection.unmeasured.map((s) => s.id);
      for (const target of selection.targets)
        expect(unmeasured).not.toContain(target.skill);
    }
  });

  it("reserva las preguntas no vistas para el diagnóstico", () => {
    for (const need of needsOf(session, "collective").students) {
      const state = stateOf(session, need.studentId);
      const answered = new Set(state.responses.map((r) => r.questionId));
      const selection = selectPractice(state, need, {});
      if (selection.status !== "ready") continue;
      for (const exercise of selection.exercises) {
        if (exercise.source === "diagnosticRepeat")
          expect(answered.has(exercise.id)).toBe(true);
        else expect(exercise.id).toMatch(/^P-/);
      }
    }
  });

  it("no incluye soluciones en lo que se presenta", () => {
    const { selection } = firstReady();
    if (selection.status !== "ready") throw new Error("estado");
    for (const exercise of selection.exercises) {
      for (const key of ["correctAnswer", "answer", "explanation", "method", "check", "slip", "guess"])
        expect(exercise).not.toHaveProperty(key);
      for (const option of exercise.options)
        expect(Object.keys(option).sort()).toEqual(["id", "text"]);
    }
  });

  it("informa cuando no quedan ejercicios adecuados", () => {
    const { need, state, selection } = firstReady();
    if (selection.status !== "ready") throw new Error("estado");
    const solved: PracticeRecord = { attempts: 1, hintsUsed: 0, solved: true, revealed: false };
    const log: Record<string, PracticeRecord> = {};
    for (const template of PRACTICE_TEMPLATES) log[template.id] = solved;
    for (const question of RADAR_QUESTION_BANK.questions) log[question.id] = solved;
    const after = selectPractice(state, need, log);
    if (after.status !== "ready") throw new Error("estado");
    expect(after.exercises).toEqual([]);
    expect(after.shortage).toMatch(/Solo hay 0 de 4/);
  });

  it("es determinista", () => {
    const { need, state } = firstReady();
    expect(selectPractice(state, need, {})).toEqual(selectPractice(state, need, {}));
  });
});

describe("corrección de la práctica", () => {
  it("acepta fracciones equivalentes y rechaza formatos no válidos", () => {
    expect(checkPracticeAnswer("P-FRA-3", "2/4").status).toBe("correct");
    expect(checkPracticeAnswer("P-FRA-3", "1/3").status).toBe("incorrect");
    expect(checkPracticeAnswer("P-FRA-3", "0,5").status).toBe("invalid");
    expect(checkPracticeAnswer("P-FRA-3", "1/0").status).toBe("invalid");
  });

  it("corrige repeticiones de opción múltiple sin revelar la respuesta al fallar", () => {
    const question = RADAR_QUESTION_BANK.questions.find(
      (q) => q.format === "multipleChoice",
    )!;
    expect(checkPracticeAnswer(question.id, question.correctAnswer).status).toBe("correct");
    const wrong = question.format === "multipleChoice"
      ? question.options.find((o) => o.id !== question.correctAnswer)!.id
      : "";
    expect(checkPracticeAnswer(question.id, wrong)).toEqual({ status: "incorrect" });
    expect(checkPracticeAnswer(question.id, "").status).toBe("invalid");
  });

  it("revela la solución solo a petición", () => {
    expect(revealPracticeSolution("P-ECU-1").answerText).toBe("4");
    expect(revealPracticeSolution("OPS-02").answerText).toBe("72");
  });

  it("no modifica ningún diagnóstico: pistas, intentos y respuestas van aparte", () => {
    const before = JSON.stringify(session.states);
    let practised = session;
    for (let i = 0; i < 5; i++) {
      checkPracticeAnswer("P-OPS-1", "85");
      practised = updatePractice(practised, "S01", "P-OPS-1", (record) => ({
        ...record,
        attempts: record.attempts + 1,
        hintsUsed: record.hintsUsed + 1,
        solved: true,
      }));
    }
    expect(JSON.stringify(practised.states)).toBe(before);
    expect(practised.practice.S01?.["P-OPS-1"]?.attempts).toBe(5);
    expect(session.practice.S01).toBeUndefined();
  });
});
