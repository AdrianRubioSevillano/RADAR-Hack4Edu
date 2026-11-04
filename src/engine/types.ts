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

// Vector α de seis posiciones en el orden de SKILL_ORDER.
export type MasteryVector = readonly (0 | 1)[];

// Distribución conjunta π(α): 64 masas. El índice m codifica el estado: la
// competencia en la posición k de SKILL_ORDER está dominada si el bit k de m vale 1.
export type JointDistribution = readonly number[];

export type DinaQuestion = Pick<Question, 'primarySkill' | 'secondarySkills' | 'slip' | 'guess'>;

export interface CompatiblePriorConfig {
  readonly epsilon: number;
}

export interface PriorConfig {
  // Marginales p0_k; las competencias que falten usan 0.5.
  readonly marginals?: Readonly<Record<SkillId, number>>;
  // Prior compatible con prerrequisitos; desactivado si falta o es null.
  readonly compatibility?: CompatiblePriorConfig | null;
}

export interface EffectivePriorConfig {
  readonly marginals: Readonly<Record<SkillId, number>>;
  readonly compatibility: CompatiblePriorConfig | null;
}

// id de opción en opción múltiple; entrada racional textual en respuesta numérica.
export type AnswerValue = string;

export interface AnswerRecord {
  readonly questionId: QuestionId;
  // Respuesta tal como se recibió.
  readonly answer: AnswerValue;
  // id de opción, o racional canónico en respuesta numérica.
  readonly normalizedAnswer: OptionId | CanonicalRational;
  readonly isCorrect: boolean;
}

export interface DiagnosticState {
  readonly studentId: string;
  // Orden explícito de codificación de `joint`, igual a SKILL_ORDER.
  readonly skillOrder: readonly SkillId[];
  readonly joint: JointDistribution;
  // Copia de la configuración efectiva: procedencia del prior, no una
  // comprobación del posterior, que cambia al observar respuestas.
  readonly priorConfig: EffectivePriorConfig;
  readonly responses: readonly AnswerRecord[];
}

export type AnswerErrorCode =
  | 'INVALID_BANK'
  | 'INVALID_STATE'
  | 'UNKNOWN_QUESTION'
  | 'REPEATED_QUESTION'
  | 'INVALID_ANSWER_TYPE'
  | 'UNKNOWN_OPTION'
  | 'INVALID_NUMERIC_FORMAT'
  | 'ZERO_DENOMINATOR'
  | 'INFERENCE_FAILED';

export interface AnswerError {
  readonly code: AnswerErrorCode;
  readonly message: string;
  readonly questionId: QuestionId | null;
  // Código del error interno que lo originó, si lo hay.
  readonly causeCode: InferenceErrorCode | QuestionBankErrorCode | KnowledgeGraphErrorCode | null;
}

export interface CandidateExplanation {
  readonly questionId: QuestionId;
  readonly correctProbability: number;
  readonly incorrectProbability: number;
  // Ganancia de información esperada, en bits.
  readonly eig: number;
  readonly posteriorIfCorrect: JointDistribution;
  readonly posteriorIfIncorrect: JointDistribution;
  readonly marginalsIfCorrect: Readonly<Record<SkillId, number>>;
  readonly marginalsIfIncorrect: Readonly<Record<SkillId, number>>;
  // H_b(p_k) - P(acierto)·H_b(p_k|acierto) - P(fallo)·H_b(p_k|fallo), en bits.
  readonly expectedEntropyReduction: Readonly<Record<SkillId, number>>;
}

export interface QuestionSelection {
  readonly question: Question;
  // Todas las candidatas, ordenadas por id.
  readonly candidates: readonly CandidateExplanation[];
}

export interface ClassDiagnosticConfig {
  readonly tau?: number;
  readonly lowerUncertainty?: number;
  readonly upperUncertainty?: number;
}

export type EffectiveClassDiagnosticConfig = Required<ClassDiagnosticConfig>;

export type ClassEvidenceStatus = 'emptyClass' | 'priorsOnly' | 'mixed' | 'allWithResponses';

export type ClassWarningCode = 'INSUFFICIENT_DATA' | 'PRIOR_ONLY_ESTIMATES';

export interface ClassWarning {
  readonly code: ClassWarningCode;
  readonly message: string;
}

export interface SkillClassSummary {
  readonly skill: SkillId;
  // null si la clase está vacía.
  readonly meanMastery: number | null;
  // Σ_i (1 - p_ik): estimación del modelo, no alumnos observados con dificultad.
  readonly expectedReinforcementCount: number;
  // Alumnos con p_ik < tau. Un valor a 1e-12 o menos de un umbral cuenta como
  // situado en él, para que el redondeo no decida el recuento.
  readonly belowTauCount: number;
  // Alumnos con lowerUncertainty < p_ik < upperUncertainty, con la misma tolerancia.
  readonly uncertainCount: number;
  // null si la clase está vacía.
  readonly meanEntropy: number | null;
  // Media de P(dominar todos los ancestros); null si la clase está vacía.
  readonly meanPrerequisiteProbability: number | null;
}

export interface StudentSkillSummary {
  readonly skill: SkillId;
  readonly masteryProbability: number;
  readonly entropy: number;
  // P(dominar todos los ancestros), desde la conjunta del alumno; 1 si no tiene ancestros.
  readonly prerequisiteProbability: number;
}

export interface StudentClassSummary {
  readonly studentId: string;
  readonly responseCount: number;
  readonly skills: readonly StudentSkillSummary[];
}

export interface ClassDiagnostic {
  readonly config: EffectiveClassDiagnosticConfig;
  readonly studentCount: number;
  readonly studentsWithResponses: number;
  // Respuestas registradas; no es el número de competencias medidas.
  readonly totalResponseCount: number;
  readonly evidenceStatus: ClassEvidenceStatus;
  readonly insufficientData: boolean;
  readonly warnings: readonly ClassWarning[];
  readonly disclaimer: string;
  // En el orden de SKILL_ORDER.
  readonly skills: readonly SkillClassSummary[];
  // Por id lexicográfico.
  readonly students: readonly StudentClassSummary[];
}

export type InferenceErrorCode =
  | 'INVALID_STATE_INDEX'
  | 'INVALID_MASTERY'
  | 'UNKNOWN_SKILL'
  | 'INVALID_SKILL_SET'
  | 'INVALID_PARAMETERS'
  | 'INVALID_QUESTION'
  | 'INVALID_EVIDENCE'
  | 'INVALID_DISTRIBUTION'
  | 'INVALID_NORMALIZATION'
  | 'INVALID_PRIOR'
  | 'MISSING_GRAPH'
  | 'INVALID_GRAPH'
  | 'INVALID_STUDENT_ID'
  | 'INVALID_PROBABILITY'
  | 'INVALID_BANK'
  | 'INVALID_STATE'
  | 'INVALID_HISTORY'
  | 'INVALID_EIG'
  | 'INVALID_CLASS_CONFIG'
  | 'DUPLICATE_STUDENT';
