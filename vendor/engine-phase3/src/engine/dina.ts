import type { DinaQuestion, InferenceErrorCode, MasteryVector, SkillId } from './types.ts';

export class InferenceError extends Error {
  readonly code: InferenceErrorCode;

  constructor(code: InferenceErrorCode, message: string) {
    super(message);
    this.name = 'InferenceError';
    this.code = code;
  }
}

// Orden fijo de codificación de los 64 estados, independiente del orden
// topológico: la competencia en la posición k es el bit k del índice, y OPS es
// el bit menos significativo. Nunca se infiere de un objeto ni de un grafo.
export const SKILL_ORDER: readonly SkillId[] = Object.freeze(['OPS', 'NEG', 'FRA', 'JER', 'ALG', 'ECU']);

export const STATE_COUNT = 2 ** SKILL_ORDER.length;

function skillBit(skill: SkillId): number {
  const position = SKILL_ORDER.indexOf(skill);
  if (position < 0) {
    throw new InferenceError('UNKNOWN_SKILL', `Competencia desconocida: ${skill}`);
  }
  return 1 << position;
}

// Máscara de bits de un conjunto explícito de competencias.
export function skillMask(skills: readonly SkillId[]): number {
  if (!Array.isArray(skills)) {
    throw new InferenceError('INVALID_SKILL_SET', 'El conjunto de competencias debe ser una lista');
  }
  let mask = 0;
  for (const skill of skills) {
    const bit = skillBit(skill);
    if ((mask & bit) !== 0) {
      throw new InferenceError('INVALID_SKILL_SET', `Competencia repetida: ${skill}`);
    }
    mask |= bit;
  }
  return mask;
}

export function masteryFromStateIndex(index: number): MasteryVector {
  if (!Number.isInteger(index) || index < 0 || index >= STATE_COUNT) {
    throw new InferenceError('INVALID_STATE_INDEX', `Índice de estado inválido: ${index}`);
  }
  return SKILL_ORDER.map((_, position) => ((index >> position) & 1 ? 1 : 0));
}

export function stateIndexFromMastery(alpha: MasteryVector): number {
  if (!Array.isArray(alpha) || alpha.length !== SKILL_ORDER.length) {
    throw new InferenceError('INVALID_MASTERY', `α debe tener ${SKILL_ORDER.length} posiciones`);
  }
  let index = 0;
  for (let position = 0; position < SKILL_ORDER.length; position += 1) {
    const bit: unknown = alpha[position];
    if (bit !== 0 && bit !== 1) {
      throw new InferenceError('INVALID_MASTERY', 'α solo admite 0 y 1');
    }
    index += bit * 2 ** position;
  }
  return index;
}

function assertValidParameters(slip: number, guess: number): void {
  if (!Number.isFinite(slip) || !Number.isFinite(guess) || !(0 < guess && guess < 1 - slip && 1 - slip < 1)) {
    throw new InferenceError('INVALID_PARAMETERS', 'slip y guess incumplen 0 < guess < 1 - slip < 1');
  }
}

// R_q: competencia principal y secundarias, en el orden de SKILL_ORDER. No añade ancestros.
export function requiredSkills(question: DinaQuestion): readonly SkillId[] {
  if (typeof question !== 'object' || question === null || !Array.isArray(question.secondarySkills)) {
    throw new InferenceError('INVALID_QUESTION', 'La pregunta no tiene la forma esperada');
  }
  const required = new Set([question.primarySkill, ...question.secondarySkills]);
  skillMask([...required]);
  return SKILL_ORDER.filter((skill) => required.has(skill));
}

// P(Y_q = r_q | α). El fallo usa slip directamente: 1 - (1 - slip) perdería precisión.
export function responseProbability(
  alpha: MasteryVector,
  required: readonly SkillId[],
  slip: number,
  guess: number,
  isCorrect: boolean,
): number {
  const state = stateIndexFromMastery(alpha);
  const mask = skillMask(required);
  if (mask === 0) {
    throw new InferenceError('INVALID_SKILL_SET', 'R_q no puede estar vacío');
  }
  assertValidParameters(slip, guess);

  const mastersAll = (state & mask) === mask;
  if (isCorrect) {
    return mastersAll ? 1 - slip : guess;
  }
  return mastersAll ? slip : 1 - guess;
}

// Función pura DINA de §2.7: solo recibe α, requisitos y slip/guess.
export function correctProbability(
  alpha: MasteryVector,
  required: readonly SkillId[],
  slip: number,
  guess: number,
): number {
  return responseProbability(alpha, required, slip, guess, true);
}
