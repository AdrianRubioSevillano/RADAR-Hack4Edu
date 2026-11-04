import { describe, expect, it } from "vitest";
import { createDemoClass } from "../../src/services/demoClass.ts";
import { diagnosticView } from "../../src/services/diagnostic.ts";
import { RADAR_QUESTION_BANK } from "../../src/services/engine.ts";
import {
  clearSession,
  loadSession,
  saveSession,
  SESSION_KEY,
} from "../../src/services/persistence.ts";
import {
  createSession,
  recordManualAnswer,
  resetStudent,
  simulateStep,
  simulateStudentUpTo,
  stateOf,
  updatePractice,
} from "../../src/services/session.ts";
import { handle, memoryStorage, simulatedSession } from "./support.ts";

const FORBIDDEN = /trueMastery|groupId|uniform|realParameters|postClass/i;

describe("clase simulada", () => {
  it("crea 30 alumnos ficticios con semilla fija y resultados reproducibles", () => {
    expect(handle.seed).toBe(42);
    expect(handle.students).toHaveLength(30);
    expect(handle.students[0]).toEqual({
      studentId: "S01",
      displayName: "Alumno ficticio 01",
    });
    expect(simulatedSession(6, 5)).toEqual(simulatedSession(6, 5));
  });

  it("no expone verdad simulada ni en el manejador ni en la sesión", () => {
    const session = simulatedSession(6, 5);
    expect(JSON.stringify(handle)).not.toMatch(FORBIDDEN);
    expect(JSON.stringify(session)).not.toMatch(FORBIDDEN);
    expect(Object.keys(handle.students[0] ?? {}).sort()).toEqual([
      "displayName",
      "studentId",
    ]);
  });

  it("registra el origen de las respuestas y no borra las manuales al simular", () => {
    let session = createSession(handle);
    const state = stateOf(session, "S01");
    const q = diagnosticView(state).question!;
    const bankItem = RADAR_QUESTION_BANK.questions.find((i) => i.id === q.id)!;
    const manual = recordManualAnswer(session, "S01", q.id, bankItem.correctAnswer);
    expect(manual.ok).toBe(true);
    if (!manual.ok) return;
    session = simulateStudentUpTo(manual.value, handle, "S01", 3);
    expect(session.origins.S01).toEqual({ manual: 1, simulated: 2 });
    expect(stateOf(session, "S01").responses[0]?.questionId).toBe(q.id);
  });

  it("un error de respuesta deja la sesión intacta", () => {
    const session = createSession(handle);
    const q = diagnosticView(stateOf(session, "S01")).question!;
    const result = recordManualAnswer(session, "S01", q.id, "no vale");
    expect(result.ok).toBe(false);
    expect(stateOf(session, "S01").responses).toHaveLength(0);
    const inactive = recordManualAnswer(session, "S01", "NEG-05-X", "1");
    expect(inactive.ok).toBe(false);
    if (!inactive.ok) expect(inactive.error.code).toBe("INACTIVE_QUESTION");
  });

  it("agota el banco sin error y sin repetir preguntas", () => {
    const session = simulateStudentUpTo(createSession(handle), handle, "S02", 99);
    const state = stateOf(session, "S02");
    expect(state.responses).toHaveLength(30);
    expect(new Set(state.responses.map((r) => r.questionId)).size).toBe(30);
    expect(diagnosticView(state).question).toBeNull();
    expect(simulateStep(session, handle, "S02")).toBe(session);
  });

  it("no presenta el prior como evidencia", () => {
    const session = simulateStudentUpTo(createSession(handle), handle, "S03", 1);
    const empty = diagnosticView(stateOf(session, "S01"));
    expect(empty.hasEvidence).toBe(false);
    expect(empty.skills.every((s) => !s.hasEvidence)).toBe(true);
    const one = diagnosticView(stateOf(session, "S03"));
    expect(one.hasEvidence).toBe(true);
    expect(one.skills.filter((s) => s.hasEvidence).length).toBeLessThan(6);
    for (const skill of one.skills.filter((s) => !s.hasEvidence))
      expect(skill.probability).toBeCloseTo(0.5, 12);
  });

  it("reinicia un alumno sin afectar a los demás", () => {
    const session = updatePractice(simulatedSession(4, 3), "S01", "P-OPS-1", (r) => ({
      ...r,
      attempts: 1,
    }));
    const reset = resetStudent(session, "S01");
    expect(stateOf(reset, "S01").responses).toHaveLength(0);
    expect(reset.practice.S01).toBeUndefined();
    expect(reset.origins.S01).toEqual({ manual: 0, simulated: 0 });
    expect(stateOf(reset, "S02")).toEqual(stateOf(session, "S02"));
  });

  it("admite la clase vacía", () => {
    const empty = createDemoClass(42, 0);
    const session = createSession(empty);
    expect(session.students).toEqual([]);
    expect(session.activeStudentId).toBeNull();
  });
});

describe("persistencia local", () => {
  it("restaura exactamente lo guardado, sin datos latentes", () => {
    const storage = memoryStorage();
    const session = simulatedSession(5, 4);
    expect(saveSession(storage, session)).toBe(true);
    expect(storage.data.get(SESSION_KEY)).not.toMatch(FORBIDDEN);
    const loaded = loadSession(storage, handle);
    expect(loaded).toEqual({ status: "restored", session });
  });

  it("descarta datos corruptos en lugar de repararlos", () => {
    const corrupt = (text: string) =>
      loadSession(memoryStorage({ [SESSION_KEY]: text }), handle).status;
    expect(corrupt("{no json")).toBe("discarded");
    expect(corrupt("[]")).toBe("discarded");
    const session = simulatedSession(3, 2);
    expect(corrupt(JSON.stringify({ ...session, seed: 7 }))).toBe("discarded");
    expect(corrupt(JSON.stringify({ ...session, version: 99 }))).toBe("discarded");
    const state = stateOf(session, "S01");
    const broken = {
      ...session,
      states: { ...session.states, S01: { ...state, joint: [1, 2, 3] } },
    };
    expect(corrupt(JSON.stringify(broken))).toBe("discarded");
    const unknown = {
      ...session,
      states: {
        ...session.states,
        S01: {
          ...state,
          responses: [{ ...state.responses[0], questionId: "NOPE" }],
        },
      },
    };
    expect(corrupt(JSON.stringify(unknown))).toBe("discarded");
  });

  it("funciona sin almacenamiento y al fallar la escritura", () => {
    const session = createSession(handle);
    expect(loadSession(null, handle)).toEqual({ status: "empty" });
    expect(saveSession(null, session)).toBe(false);
    const failing = {
      ...memoryStorage(),
      setItem: () => {
        throw new Error("cuota");
      },
    };
    expect(saveSession(failing, session)).toBe(false);
  });

  it("borra lo guardado al reiniciar", () => {
    const storage = memoryStorage();
    saveSession(storage, createSession(handle));
    clearSession(storage);
    expect(loadSession(storage, handle)).toEqual({ status: "empty" });
  });
});
