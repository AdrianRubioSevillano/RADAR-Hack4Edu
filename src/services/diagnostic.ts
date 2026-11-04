import {
  createInitialDiagnosticState,
  selectNextQuestion,
  submitAnswer,
  marginals,
  binaryEntropy,
  KNOWLEDGE_GRAPH,
  RADAR_QUESTION_BANK,
  type DiagnosticState,
  type Question,
} from "./engine.ts";
export type PublicQuestion = {
  id: string;
  statement: string;
  primarySkill: string;
} & (
  | {
      format: "multipleChoice";
      options: readonly { id: string; text: string }[];
    }
  | { format: "numeric" }
);
export function startDiagnostic() {
  return createInitialDiagnosticState("demo-manual");
}
function publicQuestion(q: Question): PublicQuestion {
  const base = {
    id: q.id,
    statement: q.statement,
    primarySkill: q.primarySkill,
  };
  return q.format === "numeric"
    ? { ...base, format: q.format }
    : {
        ...base,
        format: q.format,
        options: q.options.map(({ id, text }) => ({ id, text })),
      };
}
export function diagnosticView(state: DiagnosticState) {
  const selection = selectNextQuestion(state, RADAR_QUESTION_BANK);
  const probabilities = marginals(state.joint);
  const candidate = selection?.candidates.find(
    (c) => c.questionId === selection.question.id,
  );
  const last = state.responses.at(-1);
  const answered = last
    ? RADAR_QUESTION_BANK.questions.find((q) => q.id === last.questionId)
    : undefined;
  return {
    question: selection ? publicQuestion(selection.question) : null,
    completed: state.responses.length,
    total: RADAR_QUESTION_BANK.questions.length,
    expectedInformation: candidate?.eig ?? null,
    skills: KNOWLEDGE_GRAPH.nodes.map((skill) => {
      const probability = probabilities[skill.id];
      if (probability === undefined)
        throw new Error(`Falta la marginal de ${skill.id}`);
      return {
        ...skill,
        probability,
        uncertainty: binaryEntropy(probability),
      };
    }),
    feedback:
      last && answered
        ? { correct: last.isCorrect, explanation: answered.explanation }
        : null,
  };
}
export function answerQuestion(
  state: DiagnosticState,
  questionId: string,
  answer: string,
) {
  // El controlador solo admite la pregunta adaptativa actualmente presentada.
  if (
    selectNextQuestion(state, RADAR_QUESTION_BANK)?.question.id !== questionId
  )
    return {
      ok: false as const,
      error: { message: "Esta pregunta ya no está activa." },
    };
  return submitAnswer(state, questionId, answer, RADAR_QUESTION_BANK);
}
export type DiagnosticView = ReturnType<typeof diagnosticView>;
