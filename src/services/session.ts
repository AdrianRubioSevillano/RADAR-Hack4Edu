// Estado serializable de la demo. Funciones puras: devuelven una sesión nueva.
// No contiene verdad simulada: solo lo que produciría una clase observable.
import { answerQuestion, startDiagnostic } from "./diagnostic.ts";
import type { AnswerFailure } from "./diagnostic.ts";
import {
  RADAR_QUESTION_BANK,
  submitAnswer,
  type DiagnosticState,
  type Result,
} from "./engine.ts";
import type { DemoClassHandle, DemoStudent } from "./demoClass.ts";
import { describeAnswerError } from "./errors.ts";

export const SESSION_VERSION = 1;
export const DEFAULT_MINUTES = 30;

export type ActivePlan = "collective" | "pendingNeed";

export interface ResponseOrigin {
  readonly manual: number;
  readonly simulated: number;
}

// Registro de práctica: nunca entra en DiagnosticState.
export interface PracticeRecord {
  readonly attempts: number;
  readonly hintsUsed: number;
  readonly solved: boolean;
  readonly revealed: boolean;
}

export interface ClassSession {
  readonly version: typeof SESSION_VERSION;
  readonly seed: number;
  readonly students: readonly DemoStudent[];
  readonly states: Readonly<Record<string, DiagnosticState>>;
  readonly origins: Readonly<Record<string, ResponseOrigin>>;
  readonly availableMinutes: number;
  readonly activePlan: ActivePlan;
  readonly activeStudentId: string | null;
  readonly practice: Readonly<
    Record<string, Readonly<Record<string, PracticeRecord>>>
  >;
}

export function createSession(handle: DemoClassHandle): ClassSession {
  const states: Record<string, DiagnosticState> = {};
  const origins: Record<string, ResponseOrigin> = {};
  for (const { studentId } of handle.students) {
    states[studentId] = startDiagnostic(studentId);
    origins[studentId] = { manual: 0, simulated: 0 };
  }
  return {
    version: SESSION_VERSION,
    seed: handle.seed,
    students: handle.students,
    states,
    origins,
    availableMinutes: DEFAULT_MINUTES,
    activePlan: "collective",
    activeStudentId: handle.students[0]?.studentId ?? null,
    practice: {},
  };
}

export function orderedStates(session: ClassSession): DiagnosticState[] {
  return session.students.flatMap(({ studentId }) => {
    const state = session.states[studentId];
    return state === undefined ? [] : [state];
  });
}

export function stateOf(
  session: ClassSession,
  studentId: string,
): DiagnosticState {
  const state = session.states[studentId];
  if (state === undefined) throw new Error(`Alumno desconocido: ${studentId}`);
  return state;
}

function withState(
  session: ClassSession,
  state: DiagnosticState,
  origin: keyof ResponseOrigin,
): ClassSession {
  const previous = session.origins[state.studentId] ?? {
    manual: 0,
    simulated: 0,
  };
  return {
    ...session,
    states: { ...session.states, [state.studentId]: state },
    origins: {
      ...session.origins,
      [state.studentId]: { ...previous, [origin]: previous[origin] + 1 },
    },
  };
}

export function recordManualAnswer(
  session: ClassSession,
  studentId: string,
  questionId: string,
  answer: string,
): Result<ClassSession, AnswerFailure> {
  const result = answerQuestion(stateOf(session, studentId), questionId, answer);
  if (!result.ok) return result;
  return { ok: true, value: withState(session, result.value, "manual") };
}

// Un paso simulado. Devuelve la misma sesión si el banco está agotado.
export function simulateStep(
  session: ClassSession,
  handle: DemoClassHandle,
  studentId: string,
): ClassSession {
  const state = stateOf(session, studentId);
  const next = handle.nextSimulatedAnswer(state);
  if (next === null) return session;
  const result = submitAnswer(
    state,
    next.questionId,
    next.answer,
    RADAR_QUESTION_BANK,
  );
  if (!result.ok) throw new Error(describeAnswerError(result.error));
  return withState(session, result.value, "simulated");
}

// Lleva a un alumno hasta `target` respuestas; no borra las que ya tenga.
export function simulateStudentUpTo(
  session: ClassSession,
  handle: DemoClassHandle,
  studentId: string,
  target: number,
): ClassSession {
  let current = session;
  while (stateOf(current, studentId).responses.length < target) {
    const next = simulateStep(current, handle, studentId);
    if (next === current) break;
    current = next;
  }
  return current;
}

export function resetStudent(
  session: ClassSession,
  studentId: string,
): ClassSession {
  stateOf(session, studentId);
  const { [studentId]: _removed, ...practice } = session.practice;
  return {
    ...session,
    states: { ...session.states, [studentId]: startDiagnostic(studentId) },
    origins: { ...session.origins, [studentId]: { manual: 0, simulated: 0 } },
    practice,
  };
}

export function selectStudent(
  session: ClassSession,
  studentId: string,
): ClassSession {
  stateOf(session, studentId);
  return { ...session, activeStudentId: studentId };
}

export function setAvailableMinutes(
  session: ClassSession,
  availableMinutes: number,
): ClassSession {
  return { ...session, availableMinutes };
}

export function setActivePlan(
  session: ClassSession,
  activePlan: ActivePlan,
): ClassSession {
  return { ...session, activePlan };
}

export function updatePractice(
  session: ClassSession,
  studentId: string,
  exerciseId: string,
  change: (record: PracticeRecord) => PracticeRecord,
): ClassSession {
  stateOf(session, studentId);
  const student = session.practice[studentId] ?? {};
  const record = student[exerciseId] ?? {
    attempts: 0,
    hintsUsed: 0,
    solved: false,
    revealed: false,
  };
  return {
    ...session,
    practice: {
      ...session.practice,
      [studentId]: { ...student, [exerciseId]: change(record) },
    },
  };
}
