// Tipos provisionales del motor. Solo lo implementado hasta ahora; lo que debería
// pasar a ser compartido se propone en docs/engine/PROPUESTA_TIPOS.md.

export type SkillId = string;

// Propiedades estáticas de una competencia. Las estimaciones diagnósticas
// (dominio, incertidumbre) pertenecen al estado del alumno, no al grafo.
export interface SkillNode {
  readonly id: SkillId;
  readonly name: string;
  readonly description: string;
  readonly prerequisites: readonly SkillId[];
}

export interface KnowledgeGraph {
  readonly nodes: readonly SkillNode[];
}

export type KnowledgeGraphErrorCode =
  | 'DUPLICATE_SKILL_ID'
  | 'UNKNOWN_PREREQUISITE'
  | 'DUPLICATE_PREREQUISITE'
  | 'SELF_REFERENCE'
  | 'CYCLE'
  | 'UNKNOWN_SKILL';

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

// Cadena `numerador/denominador`: fracción reducida y denominador positivo.
export type CanonicalRational = string;

export type RationalErrorCode = 'INVALID_FORMAT' | 'ZERO_DENOMINATOR';

export type QuestionId = string;
export type OptionId = string;

// Ordinal; no es una calibración psicométrica.
export type Difficulty = 1 | 2 | 3;

export interface QuestionOption {
  readonly id: OptionId;
  readonly text: string;
  // Valor racional si la opción representa un número; null si no lo representa.
  readonly value: CanonicalRational | null;
  // Error identificable que lleva a este distractor; null en la opción correcta.
  readonly misconception: string | null;
}

interface QuestionBase {
  readonly id: QuestionId;
  readonly statement: string;
  readonly primarySkill: SkillId;
  readonly secondarySkills: readonly SkillId[];
  readonly difficulty: Difficulty;
  readonly slip: number;
  readonly guess: number;
  readonly explanation: string;
  readonly assumptionNote: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  readonly format: 'multipleChoice';
  readonly options: readonly QuestionOption[];
  readonly correctAnswer: OptionId;
}

export interface NumericQuestion extends QuestionBase {
  readonly format: 'numeric';
  readonly correctAnswer: CanonicalRational;
}

export type Question = MultipleChoiceQuestion | NumericQuestion;

export interface QuestionBank {
  readonly questions: readonly Question[];
}

export type QuestionBankErrorCode =
  | 'INVALID_QUESTION_ID'
  | 'DUPLICATE_QUESTION_ID'
  | 'UNKNOWN_SKILL'
  | 'DUPLICATE_SECONDARY_SKILL'
  | 'SECONDARY_REPEATS_PRIMARY'
  | 'INVALID_DIFFICULTY'
  | 'INVALID_PARAMETERS'
  | 'EMPTY_TEXT'
  | 'UNKNOWN_FORMAT'
  | 'INVALID_OPTION_COUNT'
  | 'INVALID_OPTION_ID'
  | 'DUPLICATE_OPTION_ID'
  | 'INVALID_OPTION_VALUE'
  | 'OPTION_VALUE_MISMATCH'
  | 'DUPLICATE_OPTION'
  | 'INVALID_MISCONCEPTION'
  | 'UNKNOWN_CORRECT_OPTION'
  | 'NON_CANONICAL_ANSWER'
  | 'UNEXPECTED_OPTIONS';
