import { correctProbability, isCanonicalRational, requiredSkills } from '../engine/index.ts';
import type { AnswerValue, MultipleChoiceQuestion, Question } from '../engine/index.ts';
import { GENERATOR, STREAMS, SimulationError, assertValidSeed, createStream } from './rng.ts';
import { assertValidClass, isBlank, isCurrentGenerator } from './syntheticClass.ts';
import type { RealItemParameters, ResponseUniformEntry, ResponseUniformTable, SyntheticClass } from './types.ts';

// SUPUESTO simplificado (§2.7): no reproduce errores reales ni concepciones equivocadas.
const NUMERIC_WRONG_ANSWER = '0/1';
const NUMERIC_WRONG_ANSWER_IF_ZERO_IS_CORRECT = '1/1';

function sortedIds(ids: readonly string[], label: string): readonly string[] {
  if (!Array.isArray(ids) || ids.some(isBlank)) {
    throw new SimulationError('INVALID_ID_LIST', `${label} debe ser una lista de ids no vacíos`);
  }
  // Sin comparador: orden por unidades de código, independiente de la configuración regional.
  const sorted = [...ids].sort();
  if (new Set(sorted).size !== sorted.length) {
    throw new SimulationError('INVALID_ID_LIST', `${label} repite un id`);
  }
  return sorted;
}

// JSON escapa los ids: ('a/b', 'c') y ('a', 'b/c') no comparten etiqueta. El
// primer valor del flujo decide acierto o fallo y el segundo, el distractor.
function entryOf(seed: number, occasion: string, studentId: string, questionId: string): ResponseUniformEntry {
  const stream = createStream(seed, `${STREAMS.responses}/${JSON.stringify([occasion, studentId, questionId])}`);
  const correctness = stream();
  return { studentId, questionId, correctness, distractor: stream() };
}

export function createResponseUniforms(
  seed: number,
  studentIds: readonly string[],
  questionIds: readonly string[],
  occasion: string,
): ResponseUniformTable {
  assertValidSeed(seed);
  if (isBlank(occasion)) {
    throw new SimulationError('INVALID_OCCASION', 'La ocasión de medida debe ser un texto no vacío');
  }
  const students = sortedIds(studentIds, 'studentIds');
  const questions = sortedIds(questionIds, 'questionIds');

  return {
    generator: { ...GENERATOR },
    seed: seed >>> 0,
    occasion,
    studentIds: students,
    questionIds: questions,
    entries: students.flatMap((studentId) =>
      questions.map((questionId) => entryOf(seed, occasion, studentId, questionId)),
    ),
  };
}

function isUniform(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 1;
}

function isStrictlyAscending(ids: readonly string[]): boolean {
  return ids.every((id, position) => !isBlank(id) && (position === 0 || (ids[position - 1] ?? '') < id));
}

function tableError(message: string): SimulationError {
  return new SimulationError('INVALID_UNIFORM_TABLE', message);
}

// Las entradas deben ser exactamente el producto ordenado de ambas listas: con
// eso quedan comprobadas en una pasada la cobertura y las claves únicas.
function assertValidTable(table: ResponseUniformTable): void {
  if (typeof table !== 'object' || table === null) {
    throw tableError('La tabla no tiene la forma esperada');
  }
  const { generator, seed, occasion, studentIds, questionIds, entries } = table;
  assertValidSeed(seed);
  if (!isCurrentGenerator(generator)) {
    throw tableError('La tabla procede de otro generador');
  }
  if (isBlank(occasion)) {
    throw tableError('La tabla no tiene ocasión de medida');
  }
  if (!Array.isArray(studentIds) || !Array.isArray(questionIds) || !Array.isArray(entries)) {
    throw tableError('La tabla no tiene la forma esperada');
  }
  if (!isStrictlyAscending(studentIds) || !isStrictlyAscending(questionIds)) {
    throw tableError('Los ids de la tabla deben estar ordenados y sin repetir');
  }
  if (entries.length !== studentIds.length * questionIds.length) {
    throw tableError('Las entradas no cubren exactamente los alumnos y preguntas declarados');
  }

  (entries as readonly (ResponseUniformEntry | null)[]).forEach((entry, position) => {
    const studentId = studentIds[Math.floor(position / questionIds.length)];
    const questionId = questionIds[position % questionIds.length];
    if (entry === null || typeof entry !== 'object' || entry.studentId !== studentId || entry.questionId !== questionId) {
      throw tableError('Las entradas repiten una clave o no siguen el orden declarado');
    }
    if (!isUniform(entry.correctness) || !isUniform(entry.distractor)) {
      throw tableError(`Uniforme fuera de [0, 1) en (${entry.studentId}, ${entry.questionId})`);
    }
  });
}

function uniformsOf(table: ResponseUniformTable, studentId: string, questionId: string): ResponseUniformEntry {
  const row = table.studentIds.indexOf(studentId);
  const column = table.questionIds.indexOf(questionId);
  const entry = row < 0 || column < 0 ? undefined : table.entries[row * table.questionIds.length + column];
  if (entry === undefined) {
    throw new SimulationError('MISSING_UNIFORM', `La tabla no cubre (${studentId}, ${questionId})`);
  }
  return entry;
}

function questionError(question: Question, message: string): SimulationError {
  return new SimulationError('INVALID_QUESTION', `${String(question.id)}: ${message}`);
}

// Ordenados por id: el orden de las opciones no cambia la elección.
function distractorIds(question: MultipleChoiceQuestion): readonly string[] {
  const { options, correctAnswer } = question;
  if (!Array.isArray(options) || options.some((option: unknown) => typeof option !== 'object' || option === null)) {
    throw questionError(question, 'las opciones no tienen la forma esperada');
  }
  if (!options.some((option) => option.id === correctAnswer)) {
    throw questionError(question, 'la opción correcta no está entre las opciones');
  }
  const distractors = options.map((option) => option.id).filter((id) => id !== correctAnswer);
  if (distractors.length === 0) {
    throw questionError(question, 'no tiene distractores');
  }
  return distractors.sort();
}

function wrongChoice(question: MultipleChoiceQuestion, uniform: number): AnswerValue {
  const distractors = distractorIds(question);
  const position = Math.min(Math.floor(uniform * distractors.length), distractors.length - 1);
  return distractors[position] ?? question.correctAnswer;
}

function observedAnswer(question: Question, isCorrect: boolean, distractorUniform: number): AnswerValue {
  if (question.format === 'multipleChoice') {
    return isCorrect ? question.correctAnswer : wrongChoice(question, distractorUniform);
  }
  if (isCorrect) {
    return question.correctAnswer;
  }
  return question.correctAnswer === NUMERIC_WRONG_ANSWER ? NUMERIC_WRONG_ANSWER_IF_ZERO_IS_CORRECT : NUMERIC_WRONG_ANSWER;
}

function assertValidFormat(question: Question): void {
  if (typeof question !== 'object' || question === null || isBlank(question.id)) {
    throw new SimulationError('INVALID_QUESTION', 'La pregunta no tiene la forma esperada');
  }
  if (question.format === 'multipleChoice') {
    distractorIds(question);
  } else if (question.format !== 'numeric') {
    throw questionError(question, 'formato desconocido');
  } else if (typeof question.correctAnswer !== 'string' || !isCanonicalRational(question.correctAnswer)) {
    throw questionError(question, 'la respuesta correcta no es canónica');
  }
}

export function simulateResponse(
  syntheticClass: SyntheticClass,
  studentId: string,
  question: Question,
  uniforms: ResponseUniformTable,
  realParameters?: RealItemParameters,
): AnswerValue {
  assertValidClass(syntheticClass);
  assertValidTable(uniforms);
  if (uniforms.seed !== syntheticClass.seed) {
    throw new SimulationError('INCOMPATIBLE_SEED', 'La tabla y la clase tienen semillas distintas');
  }
  assertValidFormat(question);
  if (realParameters !== undefined && (typeof realParameters !== 'object' || realParameters === null)) {
    throw new SimulationError('INVALID_REAL_PARAMETERS', 'realParameters debe indicar slip y guess');
  }
  const student = syntheticClass.students.find((candidate) => candidate.studentId === studentId);
  if (student === undefined) {
    throw new SimulationError('UNKNOWN_STUDENT', `Alumno desconocido: ${String(studentId)}`);
  }
  const { correctness, distractor } = uniformsOf(uniforms, studentId, question.id);

  // Excepción de §2.7: solo α, requisitos y slip/guess. El ítem se valida aunque
  // haya parámetros reales.
  const required = requiredSkills(question);
  const itemProbability = correctProbability(student.trueMastery, required, question.slip, question.guess);
  const probability =
    realParameters === undefined
      ? itemProbability
      : correctProbability(student.trueMastery, required, realParameters.slip, realParameters.guess);

  return observedAnswer(question, correctness < probability, distractor);
}
