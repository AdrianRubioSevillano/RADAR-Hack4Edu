# API del motor

Exportaciones actuales de `src/engine/index.ts`, hasta la Fase 4C. Las funciones no mutan sus entradas y sus resultados son serializables como JSON.

## Intervenciones

```ts
rankInterventions(classDiagnostic: ClassDiagnostic, knowledgeGraph: KnowledgeGraph, availableMinutes: number, config?: InterventionConfig): InterventionRanking
```

```ts
interface InterventionConfig {
  readonly weights?: Partial<InterventionWeights>;  // preparation, confidence, priority, relevance
  readonly lambda?: number;
  readonly referenceMinutes?: number;  // t_ref
  readonly durations?: Readonly<Record<SkillId, number>>;
  readonly importance?: Readonly<Record<SkillId, number>>;
  readonly lowPreparationThreshold?: number;
  readonly lowConfidenceThreshold?: number;
}

interface InterventionRanking {
  readonly config: EffectiveInterventionConfig;
  readonly availableMinutes: number;
  readonly basis: InterventionRankingBasis;  // 'noStudents' | 'hypotheticalPriorsOnly' | 'withResponses'
  readonly evidence: InterventionEvidence;
  readonly ranking: readonly InterventionScore[];
  readonly plan: InterventionPlan;
  readonly warnings: readonly InterventionWarning[];
  readonly assumptions: readonly string[];
  readonly disclaimer: string;
}

interface InterventionScore {
  readonly id: string;  // reinforce-OPS, reinforce-NEG, ...
  readonly skill: SkillId;
  readonly title: string;
  readonly durationMinutes: number;
  readonly durationSeconds: number;
  readonly components: InterventionComponents;        // need, relevance, preparation, confidence, priority
  readonly contributions: InterventionContributions;  // preparation, confidence, priority, coverage
  readonly benefit: number;
  readonly cost: number;
  readonly netValue: number;
  readonly valuePerMinute: number;
}

interface InterventionPlan {
  readonly interventions: readonly InterventionPlanItem[];  // id, skill, title, durationMinutes; por id
  readonly totalMinutes: number;
  readonly coverage: number;
  readonly benefit: number;
  readonly cost: number;
  readonly netValue: number;
}

interface InterventionEvidence {
  readonly status: ClassEvidenceStatus;
  readonly studentCount: number;
  readonly studentsWithResponses: number;
  readonly totalResponseCount: number;
  readonly proportionWithoutResponses: number | null;
  readonly warnings: readonly ClassWarning[];
}

interface InterventionWarning {
  readonly code: InterventionWarningCode;  // 'NO_STUDENTS' | 'COLLECT_RESPONSES' | 'LOW_PREPARATION' | 'LOW_CONFIDENCE'
  readonly message: string;
  readonly skill: SkillId | null;
  readonly ancestor: SkillId | null;
}
```

- Los valores por defecto son SUPUESTOS no calibrados: pesos 0.30, 0.20, 0.30 y 0.20, `lambda` 0.10, `referenceMinutes` 30, duraciones de 15 minutos, importancias de 1 y umbrales bajos de 0.5.
- `weights` puede indicar solo algunos pesos, pero los cuatro efectivos deben sumar 1.
- **Tiempo:** duraciones y `availableMinutes` están en minutos, con resolución de un segundo. Internamente se convierten a segundos enteros. `0.1` minutos son 6 segundos y `7.5` son 450, pero `0.01` son 0.6 segundos y se rechaza. Se admite un error de conversión de hasta `1e-9` segundos.
- Las duraciones deben ser de al menos un segundo, y su suma debe ser representable. El presupuesto puede ser 0.
- `plan.totalMinutes` es la suma en segundos dividida entre 60.
- Un cálculo no representable, como un coste infinito con un `lambda` enorme, lanza `NON_FINITE_VALUE`. Nunca se devuelve `Infinity` ni `NaN`.
- Con `priorsOnly`, `ranking` es un cálculo hipotético, `plan` queda vacío y hay un aviso `COLLECT_RESPONSES`.
- Con la clase vacía, `ranking` y `plan` quedan vacíos y hay un aviso `NO_STUDENTS`. No es un fallo.
- Los títulos salen del nombre de la competencia en el grafo.
- Esta función solo prioriza. Las actividades se seleccionarán desde servicios de aplicación.

Fórmulas y reglas detalladas en `MATEMATICAS.md`.

## Comparación de planes

```ts
compareInterventionPlans(classDiagnostic: ClassDiagnostic, knowledgeGraph: KnowledgeGraph, availableMinutes: number, config?: InterventionConfig): InterventionPlanComparison
```

```ts
interface InterventionPlanComparison {
  readonly config: EffectiveInterventionConfig;
  readonly availableMinutes: number;
  readonly basis: InterventionRankingBasis;
  readonly evidence: InterventionEvidence;
  readonly collectivePlan: ComparedPlan;   // plan A: el de rankInterventions
  readonly pendingNeedPlan: ComparedPlan;  // plan B: menor máximo pendiente
  readonly plansCoincide: boolean;
  readonly warnings: readonly PlanComparisonWarning[];
  readonly assumptions: readonly string[];
  readonly disclaimer: string;
}

interface ComparedPlan {
  readonly plan: InterventionPlan;
  readonly analysis: PlanNeedAnalysis;
}

interface PlanNeedAnalysis {
  readonly scheduledSkills: readonly SkillId[];  // en el orden de SKILL_ORDER
  readonly students: readonly StudentPendingNeed[];  // por id
  readonly meanPending: number | null;
  readonly maxPending: number | null;
}

interface StudentPendingNeed {
  readonly studentId: string;
  readonly responseCount: number;
  readonly basedOnPriorOnly: boolean;
  readonly baseline: number | null;
  readonly scheduled: number | null;
  readonly pending: number | null;
  readonly skills: readonly StudentSkillNeed[];  // en el orden de SKILL_ORDER
}

interface StudentSkillNeed {
  readonly skill: SkillId;
  readonly need: number;        // n_ik = 1 - p_ik
  readonly importance: number;  // w_k
  readonly isScheduled: boolean;
  readonly baseline: number | null;   // w_k·n_ik/D
  readonly scheduled: number | null;  // baseline si está programada; si no, 0
  readonly pending: number | null;    // baseline si no está programada; si no, 0
}

interface PlanComparisonWarning {
  readonly code: PlanComparisonWarningCode;  // InterventionWarningCode | 'ZERO_TOTAL_IMPORTANCE' | 'HYPOTHETICAL_ANALYSIS' | 'PRIOR_ONLY_STUDENTS'
  readonly message: string;
  readonly skill: SkillId | null;
  readonly ancestor: SkillId | null;
}
```

- `baseline`, `scheduled` y `pending` son índices de necesidad estimada según el modelo, no probabilidades de mejora.
- **Programar una competencia no significa que se haya aprendido** ni que la intervención sea eficaz. Solo cuentan las competencias directamente programadas: no se asume nada de sus descendientes.
- El plan A es el `plan` de `rankInterventions`, sin cambios. `warnings` empieza por sus avisos.
- `plan.coverage`, `benefit`, `cost` y `netValue` son los de la Fase 4B para cada subconjunto. `coverage` no es necesidad atendida ni alumnos atendidos.
- Los dos planes pueden coincidir.
- Con la suma de importancias a 0, los índices son `null`, `need` se conserva y el plan B queda vacío, con el aviso `ZERO_TOTAL_IMPORTANCE`. El plan A no cambia.
- Con la clase vacía, planes y alumnos quedan vacíos y `meanPending` y `maxPending` son `null`.
- Con `priorsOnly`, ambos planes quedan vacíos y `basis` es `hypotheticalPriorsOnly`, con el aviso `HYPOTHETICAL_ANALYSIS`.
- Con `mixed` se incluyen todos los alumnos. `basedOnPriorOnly` los identifica, `evidence.warnings` conserva el aviso del diagnóstico y `PRIOR_ONLY_STUDENTS` da el recuento.
- A diferencia de `rankInterventions`, esta función exige el detalle por alumno: un diagnóstico sin él se rechaza con `INVALID_DIAGNOSTIC`.
- No genera ejercicios. Un servicio de aplicación podrá elegir después la práctica individual a partir de estos resultados.

Criterio del plan B y validación en `MATEMATICAS.md`.

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
| `INVALID_INTERVENTION_CONFIG` | Pesos, `lambda`, `t_ref`, duraciones, importancias o umbrales inválidos, o duraciones sin resolución de un segundo. |
| `INVALID_BUDGET` | El presupuesto no es finito, es negativo, no tiene resolución de un segundo o está fuera del rango seguro. |
| `NON_FINITE_VALUE` | Una magnitud calculada o una puntuación no son representables. |
| `INVALID_DIAGNOSTIC` | El diagnóstico tiene competencias, magnitudes, rangos o recuentos incoherentes, o su detalle por alumno no es válido o no concuerda con el agregado. |

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
