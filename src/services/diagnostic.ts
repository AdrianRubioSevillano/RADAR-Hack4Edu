import {
  createInitialDiagnosticState,
  selectNextQuestion,
  submitAnswer,
  marginals,
  binaryEntropy,
  requiredSkills,
  KNOWLEDGE_GRAPH,
  RADAR_QUESTION_BANK,
  type AnswerError,
  type DiagnosticState,
  type Question,
  type Result,
} from "./engine.ts";
import { describeAnswerError } from "./errors.ts";

// Proyección sin solución, explicación, parámetros del modelo ni distractores
// internos. Ocultarlos no es seguridad: el banco viaja al navegador.
export type PublicQuestion = {
  id: string;
  statement: string;
} & (
  | {
      format: "multipleChoice";
      options: readonly { id: string; text: string }[];
    }
  | { format: "numeric" }
);

export function startDiagnostic(studentId = "demo-manual") {
  return createInitialDiagnosticState(studentId);
}

function publicQuestion(q: Question): PublicQuestion {
  const base = { id: q.id, statement: q.statement };
  return q.format === "numeric"
    ? { ...base, format: q.format }
    : {
        ...base,
        format: q.format,
        options: q.options.map(({ id, text }) => ({ id, text })),
      };
}

const questionById = new Map(
  RADAR_QUESTION_BANK.questions.map((q) => [q.id, q] as const),
);

export function bankQuestion(id: string): Question | undefined {
  return questionById.get(id);
}

// Respuestas del alumno a preguntas que exigen cada competencia. Con cero, su
// marginal sigue siendo el prior: no hay evidencia, aunque exista un número.
export function observedBySkill(
  state: DiagnosticState,
): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const skill of KNOWLEDGE_GRAPH.nodes) counts[skill.id] = 0;
  for (const response of state.responses) {
    const question = questionById.get(response.questionId);
    if (question === undefined) continue;
    for (const skill of requiredSkills(question))
      counts[skill] = (counts[skill] ?? 0) + 1;
  }
  return counts;
}

export function diagnosticView(state: DiagnosticState) {
  const selection = selectNextQuestion(state, RADAR_QUESTION_BANK);
  const probabilities = marginals(state.joint);
  const observed = observedBySkill(state);
  const candidate = selection?.candidates.find(
    (c) => c.questionId === selection.question.id,
  );
  const last = state.responses.at(-1);
  const answered = last ? questionById.get(last.questionId) : undefined;
  return {
    question: selection ? publicQuestion(selection.question) : null,
    completed: state.responses.length,
    correct: state.responses.filter((r) => r.isCorrect).length,
    total: RADAR_QUESTION_BANK.questions.length,
    expectedInformation: candidate?.eig ?? null,
    hasEvidence: state.responses.length > 0,
    skills: KNOWLEDGE_GRAPH.nodes.map((skill) => {
      const probability = probabilities[skill.id];
      if (probability === undefined)
        throw new Error(`Falta la marginal de ${skill.id}`);
      const observedResponses = observed[skill.id] ?? 0;
      return {
        ...skill,
        probability,
        uncertainty: binaryEntropy(probability),
        observedResponses,
        hasEvidence: observedResponses > 0,
      };
    }),
    feedback:
      last && answered
        ? { correct: last.isCorrect, explanation: answered.explanation }
        : null,
  };
}

export type AnswerFailure = Pick<AnswerError, "message"> & {
  readonly code: AnswerError["code"] | "INACTIVE_QUESTION";
};

export function answerQuestion(
  state: DiagnosticState,
  questionId: string,
  answer: string,
): Result<DiagnosticState, AnswerFailure> {
  // El controlador solo admite la pregunta adaptativa actualmente presentada.
  if (
    selectNextQuestion(state, RADAR_QUESTION_BANK)?.question.id !== questionId
  )
    return {
      ok: false,
      error: {
        code: "INACTIVE_QUESTION",
        message: "Esta pregunta ya no está activa.",
      },
    };
  const result = submitAnswer(state, questionId, answer, RADAR_QUESTION_BANK);
  if (result.ok) return result;
  return {
    ok: false,
    error: { code: result.error.code, message: describeAnswerError(result.error) },
  };
}

export type DiagnosticView = ReturnType<typeof diagnosticView>;
