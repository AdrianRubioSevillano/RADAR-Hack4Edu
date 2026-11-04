# API del motor

Exportaciones actuales de `src/engine/index.ts`, hasta la Fase 4A. Las funciones no mutan sus entradas y sus resultados son serializables como JSON.

Aún no existe `rankInterventions`.

## Diagnóstico de clase

```ts
getClassDiagnostic(studentStates: readonly DiagnosticState[], knowledgeGraph: KnowledgeGraph, config?: ClassDiagnosticConfig): ClassDiagnostic
```

```ts
interface ClassDiagnosticConfig {
  readonly tau?: number;               // 0.5 por defecto
  readonly lowerUncertainty?: number;  // 0.3 por defecto
  readonly upperUncertainty?: number;  // 0.7 por defecto
}

interface ClassDiagnostic {
  readonly config: EffectiveClassDiagnosticConfig;
  readonly studentCount: number;
  readonly studentsWithResponses: number;
  readonly totalResponseCount: number;
  readonly evidenceStatus: ClassEvidenceStatus;  // 'emptyClass' | 'priorsOnly' | 'mixed' | 'allWithResponses'
  readonly insufficientData: boolean;
  readonly warnings: readonly ClassWarning[];    // { code, message }
  readonly disclaimer: string;
  readonly skills: readonly SkillClassSummary[];       // en el orden de SKILL_ORDER
  readonly students: readonly StudentClassSummary[];   // por id lexicográfico
}

interface SkillClassSummary {
  readonly skill: SkillId;
  readonly meanMastery: number | null;
  readonly expectedReinforcementCount: number;
  readonly belowTauCount: number;
  readonly uncertainCount: number;
  readonly meanEntropy: number | null;
  readonly meanPrerequisiteProbability: number | null;
}

interface StudentClassSummary {
  readonly studentId: string;
  readonly responseCount: number;
  readonly skills: readonly StudentSkillSummary[];  // skill, masteryProbability, entropy, prerequisiteProbability
}
```

- Los campos `number | null` valen `null` solo con la clase vacía.
- `expectedReinforcementCount` es una estimación, no un recuento de alumnos observados con dificultad.
- `belowTauCount` y `uncertainCount` usan una tolerancia de `1e-12` alrededor de los umbrales. Están detallados en `MATEMATICAS.md`.
- `allWithResponses` no significa que todas las competencias estén medidas.
- La firma no recibe banco: se valida la forma del historial, no si una pregunta existe ni si la corrección es coherente.
- El grafo debe contener exactamente las seis competencias.

## Selección y respuestas

```ts
selectNextQuestion(state: DiagnosticState, questionBank: QuestionBank): QuestionSelection | null
submitAnswer(state: DiagnosticState, questionId: QuestionId, answer: AnswerValue, questionBank: QuestionBank): Result<DiagnosticState, AnswerError>
fixedQuestionOrder(questionBank: QuestionBank, knowledgeGraph: KnowledgeGraph): readonly QuestionId[]
```

```ts
interface QuestionSelection {
  readonly question: Question;
  readonly candidates: readonly CandidateExplanation[];  // todas, ordenadas por id
}

interface CandidateExplanation {
  readonly questionId: QuestionId;
  readonly correctProbability: number;
  readonly incorrectProbability: number;
  readonly eig: number;  // bits
  readonly posteriorIfCorrect: JointDistribution;
  readonly posteriorIfIncorrect: JointDistribution;
  readonly marginalsIfCorrect: Readonly<Record<SkillId, number>>;
  readonly marginalsIfIncorrect: Readonly<Record<SkillId, number>>;
  readonly expectedEntropyReduction: Readonly<Record<SkillId, number>>;  // bits
}
```

- `selectNextQuestion` devuelve `null` con el banco vacío o agotado. Un estado o banco inválidos lanzan un error tipado, nunca `null`.
- `QuestionSelection.question` es la pregunta completa, incluida `correctAnswer`. Si se manda a un cliente de alumno, hay que quitar los campos que no deba ver.
- `AnswerValue` es una cadena: `id` de opción en opción múltiple y entrada racional textual en respuesta numérica.
- `submitAnswer` no genera marcas de tiempo ni ids: el motor es determinista.
- `fixedQuestionOrder` valida el banco contra el grafo recibido. Con un banco vacío devuelve `[]`.

`submitAnswer` devuelve `AnswerError` en lugar de lanzar. Solo convierte los errores tipados del motor: cualquier otro fallo es inesperado y se propaga.

```ts
interface AnswerError {
  readonly code: AnswerErrorCode;
  readonly message: string;
  readonly questionId: QuestionId | null;
  readonly causeCode: InferenceErrorCode | QuestionBankErrorCode | KnowledgeGraphErrorCode | null;
}
```

| `code` | Causa |
|---|---|
| `INVALID_BANK` | El banco no tiene la forma esperada o no pasa la validación. |
| `INVALID_STATE` | El estado no es válido. `causeCode` indica el motivo, como `INVALID_HISTORY`. |
| `UNKNOWN_QUESTION` | La pregunta no está en el banco. |
| `REPEATED_QUESTION` | La pregunta ya está respondida. |
| `INVALID_ANSWER_TYPE` | La respuesta no es una cadena. |
| `UNKNOWN_OPTION` | La opción no existe en esa pregunta. |
| `INVALID_NUMERIC_FORMAT` | La entrada no cumple la gramática de §4. |
| `ZERO_DENOMINATOR` | La fracción tiene denominador cero. |
| `INFERENCE_FAILED` | La actualización no se pudo normalizar. `causeCode` indica el motivo. |

## Inferencia

```ts
SKILL_ORDER: readonly SkillId[]
STATE_COUNT: number

masteryFromStateIndex(index: number): MasteryVector
stateIndexFromMastery(alpha: MasteryVector): number
requiredSkills(question: DinaQuestion): readonly SkillId[]
correctProbability(alpha: MasteryVector, required: readonly SkillId[], slip: number, guess: number): number

createPriorDistribution(config?: PriorConfig, knowledgeGraph?: KnowledgeGraph): JointDistribution
createInitialDiagnosticState(studentId: string, config?: PriorConfig, knowledgeGraph?: KnowledgeGraph): DiagnosticState
updatePosterior(joint: JointDistribution, question: DinaQuestion, isCorrect: boolean): JointDistribution

marginals(joint: JointDistribution): Readonly<Record<SkillId, number>>
masteryProbability(joint: JointDistribution, skills: readonly SkillId[]): number

binaryEntropy(probability: number): number
jointEntropy(joint: JointDistribution): number
```

- `correctProbability` es la función pura DINA de §2.7. Solo recibe `α`, requisitos y slip/guess.
- `updatePosterior` es de bajo nivel: recibe la evidencia ya decidida. No corrige respuestas de alumnos ni gestiona el historial. Eso corresponde a `submitAnswer`.
- `marginals`, `masteryProbability` y `jointEntropy` interpretan normalizada una distribución aceptada que sume 1 solo dentro de la tolerancia, sin modificarla.

## Estado diagnóstico

```ts
interface DiagnosticState {
  readonly studentId: string;
  readonly skillOrder: readonly SkillId[];
  readonly joint: JointDistribution;
  readonly priorConfig: EffectivePriorConfig;
  readonly responses: readonly AnswerRecord[];
}

interface AnswerRecord {
  readonly questionId: QuestionId;
  readonly answer: AnswerValue;  // tal como se recibió
  readonly normalizedAnswer: OptionId | CanonicalRational;
  readonly isCorrect: boolean;
}
```

`priorConfig` es una copia de la configuración efectiva: las seis marginales y `compatibility`, con `null` si está desactivada. Se puede pasar de nuevo a `createInitialDiagnosticState` para reproducir el mismo prior. Sirve como procedencia, no para comprobar el posterior. No contiene verdad simulada.

`responses` empieza vacío y `submitAnswer` añade un registro por respuesta válida. El dominio y la incertidumbre de §2.1 no se guardan: se obtienen de `joint` con `marginals` y `binaryEntropy`.

## Errores

Las funciones de inferencia lanzan `InferenceError`, con un `code`:

| `code` | Causa |
|---|---|
| `INVALID_STATE_INDEX` | El índice no es un entero de 0 a 63. |
| `INVALID_MASTERY` | `α` no es un vector binario de seis posiciones. |
| `UNKNOWN_SKILL` | La competencia no está en `SKILL_ORDER`. |
| `INVALID_SKILL_SET` | El conjunto no es una lista, repite una competencia o es un `R_q` vacío. |
| `INVALID_PARAMETERS` | `slip` y `guess` incumplen `0 < g < 1 − s < 1`. |
| `INVALID_QUESTION` | La pregunta no tiene la forma esperada. |
| `INVALID_EVIDENCE` | La evidencia no es un booleano. |
| `INVALID_DISTRIBUTION` | La distribución tiene otra longitud, un valor no finito o negativo, o no suma 1. |
| `INVALID_NORMALIZATION` | La masa total no es finita o es menor que `1e-300`. |
| `INVALID_PRIOR` | Una marginal o `epsilon` están fuera de su rango. |
| `MISSING_GRAPH` | El prior compatible está activado sin `knowledgeGraph`. |
| `INVALID_GRAPH` | El grafo no contiene exactamente las seis competencias. |
| `INVALID_STUDENT_ID` | `studentId` está vacío. |
| `INVALID_PROBABILITY` | `binaryEntropy` recibe un valor fuera de `[0, 1]`. |
| `INVALID_BANK` | El banco no tiene la forma esperada. |
| `INVALID_STATE` | El estado no tiene la forma esperada o `skillOrder` no coincide con `SKILL_ORDER`. |
| `INVALID_HISTORY` | `responses` no es una lista, repite una pregunta o tiene un registro incoherente con el banco. |
| `INVALID_EIG` | La EIG no es finita o es menor que `-1e-12`. |
| `INVALID_CLASS_CONFIG` | Un umbral está fuera de `[0, 1]` o `lowerUncertainty` no es menor que `upperUncertainty`. |
| `DUPLICATE_STUDENT` | Dos estados tienen el mismo `studentId`. |

Un grafo con estructura inválida lanza `KnowledgeGraphError`, como en `validateKnowledgeGraph`. En `selectNextQuestion`, un banco que no pasa la validación lanza `QuestionBankError`.

## Grafo, banco y racionales

```ts
KNOWLEDGE_GRAPH: KnowledgeGraph
validateKnowledgeGraph(graph: KnowledgeGraph): void
topologicalOrder(graph: KnowledgeGraph): readonly SkillId[]
ancestors(graph: KnowledgeGraph, id: SkillId): readonly SkillId[]
descendants(graph: KnowledgeGraph, id: SkillId): readonly SkillId[]

RADAR_QUESTION_BANK: QuestionBank
validateQuestionBank(bank: QuestionBank, graph: KnowledgeGraph): void

normalizeRational(input: string): Result<CanonicalRational, RationalErrorCode>
isCanonicalRational(value: string): boolean
```

Los detalles están en `GRAFO.md` y `BANCO.md`.
