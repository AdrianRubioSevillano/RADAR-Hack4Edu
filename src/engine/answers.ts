import { assertValidEffectivePriorConfig, assertValidJoint, updatePosterior } from './bayes.ts';
import { InferenceError, SKILL_ORDER } from './dina.ts';
import { KNOWLEDGE_GRAPH, KnowledgeGraphError } from './graph.ts';
import { QuestionBankError, validateQuestionBank } from './questionBank.ts';
import { normalizeRational } from './rational.ts';
import type {
  AnswerError,
  AnswerErrorCode,
  AnswerRecord,
  AnswerValue,
  DiagnosticState,
  Question,
  QuestionBank,
  QuestionId,
  Result,
} from './types.ts';

interface Evaluation {
  readonly normalizedAnswer: AnswerRecord['normalizedAnswer'];
  readonly isCorrect: boolean;
}

function evaluateAnswer(question: Question, answer: AnswerValue): Result<Evaluation, AnswerErrorCode> {
  if (question.format === 'multipleChoice') {
    if (!question.options.some((option) => option.id === answer)) {
      return { ok: false, error: 'UNKNOWN_OPTION' };
    }
    return { ok: true, value: { normalizedAnswer: answer, isCorrect: answer === question.correctAnswer } };
  }

  const normalized = normalizeRational(answer);
  if (!normalized.ok) {
    return { ok: false, error: normalized.error === 'ZERO_DENOMINATOR' ? 'ZERO_DENOMINATOR' : 'INVALID_NUMERIC_FORMAT' };
  }
  return { ok: true, value: { normalizedAnswer: normalized.value, isCorrect: normalized.value === question.correctAnswer } };
}

// El banco se valida contra las seis competencias conocidas por el motor.
export function assertValidBank(bank: QuestionBank): void {
  if (
    typeof bank !== 'object' ||
    bank === null ||
    !Array.isArray(bank.questions) ||
    !bank.questions.every((question: unknown) => typeof question === 'object' && question !== null)
  ) {
    throw new InferenceError('INVALID_BANK', 'El banco no tiene la forma esperada');
  }
  validateQuestionBank(bank, KNOWLEDGE_GRAPH);
}

function assertValidHistory(state: DiagnosticState, bank: QuestionBank): void {
  if (!Array.isArray(state.responses)) {
    throw new InferenceError('INVALID_HISTORY', 'responses debe ser una lista');
  }

  const seen = new Set<QuestionId>();
  for (const record of state.responses as readonly unknown[]) {
    const { questionId, answer, normalizedAnswer, isCorrect } = (record ?? {}) as Partial<AnswerRecord>;
    const question = bank.questions.find((candidate) => candidate.id === questionId);
    if (question === undefined || questionId === undefined) {
      throw new InferenceError('INVALID_HISTORY', `El historial cita una pregunta desconocida: ${String(questionId)}`);
    }
    if (seen.has(questionId)) {
      throw new InferenceError('INVALID_HISTORY', `El historial repite la pregunta ${questionId}`);
    }
    seen.add(questionId);

    const evaluation = typeof answer === 'string' ? evaluateAnswer(question, answer) : null;
    if (
      evaluation === null ||
      !evaluation.ok ||
      evaluation.value.normalizedAnswer !== normalizedAnswer ||
      evaluation.value.isCorrect !== isCorrect
    ) {
      throw new InferenceError('INVALID_HISTORY', `El registro de ${questionId} no es coherente con el banco`);
    }
  }
}

// Valida el estado antes de consumirlo. No reconstruye el posterior ni lo compara
// con el prior: tras observar respuestas debe poder cambiar.
export function assertValidDiagnosticState(state: DiagnosticState, bank: QuestionBank): void {
  if (typeof state !== 'object' || state === null || typeof state.studentId !== 'string' || state.studentId.trim() === '') {
    throw new InferenceError('INVALID_STATE', 'El estado no tiene la forma esperada');
  }
  const { skillOrder } = state;
  if (
    !Array.isArray(skillOrder) ||
    skillOrder.length !== SKILL_ORDER.length ||
    !SKILL_ORDER.every((skill, position) => skillOrder[position] === skill)
  ) {
    throw new InferenceError('INVALID_STATE', 'skillOrder no coincide con el orden de codificación');
  }
  assertValidJoint(state.joint);
  assertValidEffectivePriorConfig(state.priorConfig);
  assertValidHistory(state, bank);
}

function failure(code: AnswerErrorCode, message: string, questionId: QuestionId | null): Result<never, AnswerError> {
  return { ok: false, error: { code, message, questionId, causeCode: null } };
}

// Convierte en AnswerError solo los errores tipados del motor. Cualquier otro
// fallo es inesperado y se propaga.
function guarded<T>(code: AnswerErrorCode, questionId: QuestionId | null, action: () => T): Result<T, AnswerError> {
  try {
    return { ok: true, value: action() };
  } catch (error) {
    if (
      error instanceof InferenceError ||
      error instanceof QuestionBankError ||
      error instanceof KnowledgeGraphError
    ) {
      return { ok: false, error: { code, message: error.message, questionId, causeCode: error.code } };
    }
    throw error;
  }
}

export function submitAnswer(
  state: DiagnosticState,
  questionId: QuestionId,
  answer: AnswerValue,
  questionBank: QuestionBank,
): Result<DiagnosticState, AnswerError> {
  const validBank = guarded('INVALID_BANK', questionId, () => assertValidBank(questionBank));
  if (!validBank.ok) return validBank;
  const validState = guarded('INVALID_STATE', questionId, () => assertValidDiagnosticState(state, questionBank));
  if (!validState.ok) return validState;

  const question = questionBank.questions.find((candidate) => candidate.id === questionId);
  if (question === undefined) {
    return failure('UNKNOWN_QUESTION', `Pregunta desconocida: ${String(questionId)}`, questionId);
  }
  if (state.responses.some((record) => record.questionId === questionId)) {
    return failure('REPEATED_QUESTION', `La pregunta ${questionId} ya está respondida`, questionId);
  }
  if (typeof answer !== 'string') {
    return failure('INVALID_ANSWER_TYPE', 'La respuesta debe ser una cadena', questionId);
  }

  const evaluation = evaluateAnswer(question, answer);
  if (!evaluation.ok) {
    return failure(evaluation.error, `Respuesta no admitida para ${questionId}: ${answer}`, questionId);
  }

  const { normalizedAnswer, isCorrect } = evaluation.value;
  const joint = guarded('INFERENCE_FAILED', questionId, () => updatePosterior(state.joint, question, isCorrect));
  if (!joint.ok) return joint;

  const record: AnswerRecord = { questionId, answer, normalizedAnswer, isCorrect };
  return { ok: true, value: { ...state, joint: joint.value, responses: [...state.responses, record] } };
}
