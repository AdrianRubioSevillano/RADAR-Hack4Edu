import { describe, expect, it } from "vitest";
import {
  startDiagnostic,
  diagnosticView,
  answerQuestion,
} from "../src/services/diagnostic";
import { RADAR_QUESTION_BANK } from "../src/services/engine";
describe("recorrido manual integrado con el motor real", () => {
  it("recorre las 30 preguntas sin repetición y actualiza estimaciones", () => {
    let state = startDiagnostic();
    const initial = diagnosticView(state);
    const seen = new Set<string>();
    expect(initial.skills.every((s) => s.probability === 0.5)).toBe(true);
    for (let i = 0; i < 30; i++) {
      const view = diagnosticView(state);
      const q = view.question!;
      expect(q).not.toHaveProperty("correctAnswer");
      expect(q).not.toHaveProperty("explanation");
      expect(seen.has(q.id)).toBe(false);
      seen.add(q.id);
      if (q.format === "multipleChoice")
        expect(q.options.every((o) => !("misconception" in o))).toBe(true);
      const source = RADAR_QUESTION_BANK.questions.find(
        (item) => item.id === q.id,
      )!;
      const result = answerQuestion(state, q.id, source.correctAnswer);
      expect(result.ok).toBe(true);
      if (!result.ok) throw Error(result.error.message);
      state = result.value;
    }
    const final = diagnosticView(state);
    expect(final.question).toBeNull();
    expect(final.completed).toBe(30);
    expect(final.skills.some((s) => s.probability !== 0.5)).toBe(true);
    expect(final.feedback?.correct).toBe(true);
  });
  it("rechaza entradas inválidas sin perder estado y permite reiniciar", () => {
    const state = startDiagnostic();
    const q = diagnosticView(state).question!;
    expect(answerQuestion(state, q.id, "imposible").ok).toBe(false);
    expect(answerQuestion(state, "id-ajeno", "1").ok).toBe(false);
    expect(state.responses).toHaveLength(0);
    expect(startDiagnostic()).toEqual(state);
  });
});
