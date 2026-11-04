# Propuesta de tipos compartidos

`src/shared/types.ts` no existe todavía. Mientras tanto, estos tipos viven en `src/engine/types.ts` y se exportan desde `src/engine/index.ts`.

Esta propuesta cubre lo implementado hasta la Fase 4B: grafo, banco de preguntas, inferencia, selección, respuestas, diagnóstico de clase e intervenciones. Los tipos de fases posteriores se añadirán cuando existan.

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
  readonly meanMastery: number | null;
  readonly expectedReinforcementCount: number;
  readonly belowTauCount: number;
  readonly uncertainCount: number;
  readonly meanEntropy: number | null;
  readonly meanPrerequisiteProbability: number | null;
}

export interface StudentSkillSummary {
  readonly skill: SkillId;
  readonly masteryProbability: number;
  readonly entropy: number;
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
  readonly totalResponseCount: number;
  readonly evidenceStatus: ClassEvidenceStatus;
  readonly insufficientData: boolean;
  readonly warnings: readonly ClassWarning[];
  readonly disclaimer: string;
  readonly skills: readonly SkillClassSummary[];
  readonly students: readonly StudentClassSummary[];
}

export interface InterventionWeights {
  readonly preparation: number;
  readonly confidence: number;
  readonly priority: number;
  readonly relevance: number;
}

export interface InterventionConfig {
  readonly weights?: Partial<InterventionWeights>;
  readonly lambda?: number;
  readonly referenceMinutes?: number;
  readonly durations?: Readonly<Record<SkillId, number>>;
  readonly importance?: Readonly<Record<SkillId, number>>;
  readonly lowPreparationThreshold?: number;
  readonly lowConfidenceThreshold?: number;
}

export interface EffectiveInterventionConfig {
  readonly weights: InterventionWeights;
  readonly lambda: number;
  readonly referenceMinutes: number;
  readonly durations: Readonly<Record<SkillId, number>>;
  readonly importance: Readonly<Record<SkillId, number>>;
  readonly lowPreparationThreshold: number;
  readonly lowConfidenceThreshold: number;
}

export interface InterventionComponents {
  readonly need: number;
  readonly relevance: number;
  readonly preparation: number;
  readonly confidence: number;
  readonly priority: number;
}

export interface InterventionContributions {
  readonly preparation: number;
  readonly confidence: number;
  readonly priority: number;
  readonly coverage: number;
}

export interface InterventionScore {
  readonly id: string;
  readonly skill: SkillId;
  readonly title: string;
  readonly durationMinutes: number;
  readonly durationSeconds: number;
  readonly components: InterventionComponents;
  readonly contributions: InterventionContributions;
  readonly benefit: number;
  readonly cost: number;
  readonly netValue: number;
  readonly valuePerMinute: number;
}

export interface InterventionPlanItem {
  readonly id: string;
  readonly skill: SkillId;
  readonly title: string;
  readonly durationMinutes: number;
}

export interface InterventionPlan {
  readonly interventions: readonly InterventionPlanItem[];
  readonly totalMinutes: number;
  readonly coverage: number;
  readonly benefit: number;
  readonly cost: number;
  readonly netValue: number;
}

export type InterventionRankingBasis = 'noStudents' | 'hypotheticalPriorsOnly' | 'withResponses';

export type InterventionWarningCode = 'NO_STUDENTS' | 'COLLECT_RESPONSES' | 'LOW_PREPARATION' | 'LOW_CONFIDENCE';

export interface InterventionWarning {
  readonly code: InterventionWarningCode;
  readonly message: string;
  readonly skill: SkillId | null;
  readonly ancestor: SkillId | null;
}

export interface InterventionEvidence {
  readonly status: ClassEvidenceStatus;
  readonly studentCount: number;
  readonly studentsWithResponses: number;
  readonly totalResponseCount: number;
  readonly proportionWithoutResponses: number | null;
  readonly warnings: readonly ClassWarning[];
}

export interface InterventionRanking {
  readonly config: EffectiveInterventionConfig;
  readonly availableMinutes: number;
  readonly basis: InterventionRankingBasis;
  readonly evidence: InterventionEvidence;
  readonly ranking: readonly InterventionScore[];
  readonly plan: InterventionPlan;
  readonly warnings: readonly InterventionWarning[];
  readonly assumptions: readonly string[];
  readonly disclaimer: string;
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
| `ClassDiagnostic` y sus tipos asociados | Es la salida que la interfaz muestra al docente. |
| `InterventionConfig` | La interfaz puede dejar al docente ajustar duraciones e importancias. |
| `InterventionRanking` y sus tipos asociados | La interfaz muestra el ranking, el plan y sus avisos. |

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
- `InterventionRanking.basis` indica si el ranking es hipotético. La interfaz no debería presentar `hypotheticalPriorsOnly` como una recomendación respaldada por observaciones.
- Los campos `number | null` de `SkillClassSummary` obligan a la interfaz a tratar la clase vacía. La interfaz debería mostrar `warnings` y `disclaimer` junto a las cifras.
- `AnswerError.causeCode` hace que `AnswerError` dependa de `InferenceErrorCode`, `QuestionBankErrorCode` y `KnowledgeGraphErrorCode`, así que esos tres tipos también pasarían a ser compartidos.
- `PriorConfig.compatibility` acepta `null` para que `EffectivePriorConfig` sea también una configuración válida.

## Tipos que se quedan en el motor

`RationalErrorCode`, `KnowledgeGraphError`, `QuestionBankError` e `InferenceError` no necesitan ser compartidos. Las tres clases de error no pueden vivir en un archivo solo de tipos.

`MasteryVector` y `DinaQuestion` son tipos internos del modelo, que la interfaz no necesita.
