# Propuesta de tipos compartidos

`src/shared/types.ts` no existe todavía. Mientras tanto, estos tipos viven en `src/engine/types.ts` y se exportan desde `src/engine/index.ts`.

Esta propuesta cubre lo implementado hasta la Fase 3: grafo, banco de preguntas, inferencia, selección y respuestas. Los tipos de fases posteriores se añadirán cuando existan.

## Tipos que deberían pasar a ser compartidos

```ts
export type SkillId = string;

export interface SkillNode {
  readonly id: SkillId;
  readonly name: string;
  readonly description: string;
  readonly prerequisites: readonly SkillId[];
}

export interface KnowledgeGraph {
  readonly nodes: readonly SkillNode[];
}

export type CanonicalRational = string;
export type QuestionId = string;
export type OptionId = string;
export type Difficulty = 1 | 2 | 3;

export interface QuestionOption {
  readonly id: OptionId;
  readonly text: string;
  readonly value: CanonicalRational | null;
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

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export type JointDistribution = readonly number[];

export interface CompatiblePriorConfig {
  readonly epsilon: number;
}

export interface PriorConfig {
  readonly marginals?: Readonly<Record<SkillId, number>>;
  readonly compatibility?: CompatiblePriorConfig | null;
}

export interface EffectivePriorConfig {
  readonly marginals: Readonly<Record<SkillId, number>>;
  readonly compatibility: CompatiblePriorConfig | null;
}

export type AnswerValue = string;

export interface AnswerRecord {
  readonly questionId: QuestionId;
  readonly answer: AnswerValue;
  readonly normalizedAnswer: OptionId | CanonicalRational;
  readonly isCorrect: boolean;
}

export interface DiagnosticState {
  readonly studentId: string;
  readonly skillOrder: readonly SkillId[];
  readonly joint: JointDistribution;
  readonly priorConfig: EffectivePriorConfig;
  readonly responses: readonly AnswerRecord[];
}

export interface CandidateExplanation {
  readonly questionId: QuestionId;
  readonly correctProbability: number;
  readonly incorrectProbability: number;
  readonly eig: number;
  readonly posteriorIfCorrect: JointDistribution;
  readonly posteriorIfIncorrect: JointDistribution;
  readonly marginalsIfCorrect: Readonly<Record<SkillId, number>>;
  readonly marginalsIfIncorrect: Readonly<Record<SkillId, number>>;
  readonly expectedEntropyReduction: Readonly<Record<SkillId, number>>;
}

export interface QuestionSelection {
  readonly question: Question;
  readonly candidates: readonly CandidateExplanation[];
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
  readonly causeCode: InferenceErrorCode | QuestionBankErrorCode | KnowledgeGraphErrorCode | null;
}
```

| Tipo | Motivo |
|---|---|
| `SkillId` | La interfaz necesita referirse a competencias con el mismo identificador que el motor. |
| `SkillNode` | Permite mostrar nombre, descripción y prerrequisitos sin importar código del motor. |
| `KnowledgeGraph` | Es el argumento explícito de las funciones del motor y la estructura que pintaría la interfaz. |
| `CanonicalRational` | Fija la cadena `numerador/denominador` que intercambian el banco y la interfaz. |
| `QuestionId`, `OptionId` | La interfaz los usa para mostrar preguntas y enviar respuestas. |
| `Difficulty` | La interfaz puede mostrarla. Es ordinal, no una calibración psicométrica. |
| `QuestionOption` | La interfaz necesita `id` y `text` para pintar las opciones. |
| `MultipleChoiceQuestion`, `NumericQuestion`, `Question` | La unión discriminada por `format` indica qué control pintar, sin campos opcionales ambiguos. |
| `QuestionBank` | Es el argumento explícito de las funciones del motor. |
| `Result` | Es el tipo de retorno de `submitAnswer` en §3 y de `normalizeRational`. |
| `JointDistribution` | Forma parte del estado, que la interfaz guarda y devuelve al motor. |
| `CompatiblePriorConfig`, `PriorConfig`, `EffectivePriorConfig` | La interfaz puede configurar el prior y conservar la copia efectiva. |
| `DiagnosticState` | Es el estado por alumno que la interfaz guarda entre llamadas. |
| `AnswerValue`, `AnswerRecord` | La interfaz envía respuestas y puede mostrar el historial. |
| `CandidateExplanation`, `QuestionSelection` | La interfaz muestra la pregunta elegida y puede explicar la elección. |
| `AnswerError`, `AnswerErrorCode` | La interfaz necesita distinguir un formato inválido de una respuesta incorrecta. |

## Decisiones que conviene revisar con el integrador

- `SkillId` es `string` para que las funciones admitan grafos genéricos, no solo el grafo RADAR. No es obligatorio para probar entradas inválidas, que también podrían construirse con conversiones de tipo en los tests. Una unión de los seis ids daría más comprobación en compilación, a cambio de atar los tipos al grafo RADAR.
- `SkillNode` solo contiene propiedades estáticas. El dominio estimado, la incertidumbre y los `questionIds` de §2.1 no van aquí: las estimaciones son del estado de cada alumno, y las preguntas se obtendrán del banco.
- `Question` usa `format` como discriminante, un campo que no aparece en la lista de §4. Las preguntas numéricas no tienen `options`.
- `QuestionOption` añade `value` y `misconception`, que tampoco aparecen en §4. Ambos usan `null` explícito en lugar de ser opcionales.
- `Question` incluye `correctAnswer`, `slip`, `guess` y `misconception`. Si la interfaz manda las preguntas a un cliente de alumno, puede convenir un tipo de presentación sin esos campos.
- Todos los tipos públicos son serializables como JSON. `BigInt` solo se usa dentro de `src/engine/rational.ts`.
- `JointDistribution` depende de la codificación de `docs/engine/MATEMATICAS.md`. La interfaz no debería interpretar sus índices: para eso están `marginals` y `masteryProbability`.
- La interfaz debe conservar `DiagnosticState` entero y no reconstruirlo campo a campo, porque el motor valida sus campos.
- `QuestionSelection.question` incluye `correctAnswer`, y cada candidata incluye dos posteriores de 64 valores. Es útil para inspeccionar, pero puede convenir un tipo de presentación más ligero.
- `AnswerError.causeCode` hace que `AnswerError` dependa de `InferenceErrorCode`, `QuestionBankErrorCode` y `KnowledgeGraphErrorCode`, así que esos tres tipos también pasarían a ser compartidos.
- `PriorConfig.compatibility` acepta `null` para que `EffectivePriorConfig` sea también una configuración válida.

## Tipos que se quedan en el motor

`RationalErrorCode`, `KnowledgeGraphError`, `QuestionBankError` e `InferenceError` no necesitan ser compartidos. Las tres clases de error no pueden vivir en un archivo solo de tipos.

`MasteryVector` y `DinaQuestion` son tipos internos del modelo, que la interfaz no necesita.
