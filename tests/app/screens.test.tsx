import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreferencesProvider, RadarProvider } from "../../src/components/RadarProvider.tsx";
import { RADAR_QUESTION_BANK, selectNextQuestion } from "../../src/services/engine.ts";
import { SESSION_KEY } from "../../src/services/persistence.ts";
import { selectPractice } from "../../src/services/practice.ts";
import { PRACTICE_TEMPLATES } from "../../src/services/practiceBank.ts";
import { orderedStates, stateOf, type ClassSession } from "../../src/services/session.ts";
import { analyzePlans, classDiagnosticOf } from "../../src/services/teacher.ts";
import { ActivitiesScreen } from "../../src/screens/ActivitiesScreen.tsx";
import { ClassScreen } from "../../src/screens/ClassScreen.tsx";
import { PlansScreen } from "../../src/screens/PlansScreen.tsx";
import { PracticeScreen } from "../../src/screens/PracticeScreen.tsx";
import { StudentDiagnosticScreen } from "../../src/screens/StudentDiagnosticScreen.tsx";
import { TeacherScreen } from "../../src/screens/TeacherScreen.tsx";
import { memoryStorage, simulatedSession } from "./support.ts";

function html(screen: React.ReactElement, session: ClassSession | null) {
  const storage = memoryStorage(session === null ? {} : { [SESSION_KEY]: JSON.stringify(session) });
  vi.stubGlobal("localStorage", storage);
  return renderToString(
    <PreferencesProvider>
      <RadarProvider>{screen}</RadarProvider>
    </PreferencesProvider>,
  );
}

const session = simulatedSession(9);
const text = (markup: string) => markup.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'");

beforeEach(() => vi.unstubAllGlobals());

describe("lo que se pinta", () => {
  it("el diagnóstico no filtra solución, explicación ni parámetros de la pregunta activa", () => {
    const state = stateOf(session, "S01");
    const question = selectNextQuestion(state, RADAR_QUESTION_BANK)!.question;
    const markup = html(<StudentDiagnosticScreen />, session);
    expect(text(markup)).toContain(question.statement);
    expect(markup).not.toContain(question.explanation);
    expect(markup).not.toContain(question.assumptionNote);
    if (question.format === "multipleChoice")
      for (const option of question.options)
        if (option.misconception !== null) expect(markup).not.toContain(option.misconception);
  });

  it("la práctica no filtra la respuesta ni el método del ejercicio activo", () => {
    const analysis = analyzePlans(classDiagnosticOf(orderedStates(session)), session.availableMinutes);
    if (!analysis.ok) throw new Error(analysis.message);
    const need = analysis.comparison.collectivePlan.analysis.students.find((s) => s.studentId === "S01")!;
    const selection = selectPractice(stateOf(session, "S01"), need, {});
    if (selection.status !== "ready" || selection.exercises[0] === undefined) throw new Error("sin ejercicio");
    const current = selection.exercises[0];
    const markup = html(<PracticeScreen />, session);
    expect(text(markup)).toContain(current.statement);
    const template = PRACTICE_TEMPLATES.find((t) => t.id === current.id);
    if (template !== undefined) expect(markup).not.toContain(template.method);
    else {
      const question = RADAR_QUESTION_BANK.questions.find((q) => q.id === current.id)!;
      expect(markup).not.toContain(question.explanation);
    }
  });

  it("muestra los datos sintéticos y no presenta el prior como resultado", () => {
    const empty = text(html(<TeacherScreen />, null));
    expect(empty).toContain("Aún no hay evidencia");
    expect(empty).not.toContain("50 %");
    expect(text(html(<ClassScreen />, null))).toContain("Todos los datos son sintéticos");
    expect(text(html(<StudentDiagnosticScreen />, null))).toContain("no hay evidencia");
  });

  it("el panel de planes muestra ambos planes y la nota de no aprendizaje", () => {
    const planes = text(html(<PlansScreen />, session));
    expect(planes).toContain("Plan colectivo");
    expect(planes).toContain("Plan por necesidad pendiente");
    expect(planes).toContain("Lo que queda pendiente");
    expect(planes).toMatch(/no significa/i);
    expect(planes).not.toMatch(/\bALG:/);
  });

  it("sin respuestas, los planes son hipotéticos y no hay actividades", () => {
    expect(text(html(<PlansScreen />, null))).toContain("Cálculo hipotético");
    expect(text(html(<ActivitiesScreen />, null))).toContain("El plan activo no tiene competencias");
    expect(text(html(<PracticeScreen />, null))).toContain("primero hace falta el diagnóstico");
  });

  it("declara que el contenido no tiene revisión docente", () => {
    expect(text(html(<ActivitiesScreen />, session))).toContain("sin revisión docente");
    expect(text(html(<PracticeScreen />, session))).toContain("sin revisión docente");
  });
});
