# API del motor

Exportaciones actuales de `src/engine/index.ts`, hasta la Fase 4C, de `src/simulation/index.ts`, hasta la Fase 6B, y de `src/benchmarks/index.ts`, hasta la Fase 7D. Las funciones no mutan sus entradas y sus resultados son serializables como JSON.

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

## Simulación

`src/simulation/index.ts`. Solo para demo y benchmarks: `src/engine` no lo importa.

```ts
createSyntheticClass(seed: number, studentCount: number, knowledgeGraph: KnowledgeGraph, config?: SimulationConfig): SyntheticClass
observableStudents(syntheticClass: SyntheticClass): readonly ObservableStudent[]

createResponseUniforms(seed: number, studentIds: readonly string[], questionIds: readonly string[], occasion: string): ResponseUniformTable
simulateResponse(syntheticClass: SyntheticClass, studentId: string, question: Question, uniforms: ResponseUniformTable, realParameters?: RealItemParameters): AnswerValue

applySyntheticIntervention(classState: SyntheticClass, intervention: InterventionPlan, knowledgeGraph: KnowledgeGraph, seed: number, config?: SyntheticInterventionConfig): SyntheticInterventionResult
simulatePostIntervention(input: PostInterventionInput): PostInterventionReport

mulberry32(seed: number): UniformStream
deriveStreamSeed(seed: number, label: string): number
createStream(seed: number, label: string): UniformStream
```

```ts
interface SimulationConfig {
  readonly groups?: readonly SyntheticGroupConfig[];  // al menos uno
  readonly prerequisiteFactor?: number;               // en [0, 1]; 0.5 por defecto
}

interface SyntheticGroupConfig {
  readonly id: string;
  readonly masteryProbabilities: Readonly<Record<SkillId, number>>;  // las seis competencias
}

interface SyntheticClass {
  readonly generator: GeneratorInfo;  // { algorithm: 'mulberry32', version: 1 }
  readonly seed: number;
  readonly studentCount: number;
  readonly config: EffectiveSimulationConfig;
  readonly skillOrder: readonly SkillId[];
  readonly students: readonly SyntheticStudent[];
}

interface SyntheticStudent {
  readonly studentId: string;
  readonly displayName: string;
  readonly groupId: string;           // verdad privada
  readonly trueMastery: MasteryVector;  // verdad privada, en el orden de skillOrder
}

interface ObservableStudent {
  readonly studentId: string;
  readonly displayName: string;
}

interface ResponseUniformTable {
  readonly generator: GeneratorInfo;
  readonly seed: number;
  readonly occasion: string;
  readonly studentIds: readonly string[];   // ordenados y sin repetir
  readonly questionIds: readonly string[];  // ordenados y sin repetir
  readonly entries: readonly ResponseUniformEntry[];  // producto de ambas listas, por alumno y pregunta
}

interface ResponseUniformEntry {
  readonly studentId: string;
  readonly questionId: string;
  readonly correctness: number;  // en [0, 1): acierto si es menor que P(Y_q = 1 | α)
  readonly distractor: number;   // en [0, 1): elige el distractor
}

interface RealItemParameters {
  readonly slip: number;
  readonly guess: number;
}

interface SyntheticInterventionConfig {
  readonly improvementProbability?: number;         // en [0, 1]; 0.35 por defecto
  readonly prerequisiteImprovementFactor?: number;  // en [0, 1]; 0.5 por defecto
  readonly controlFraction?: number;                // en [0, 1]; 0 por defecto
}

interface SyntheticInterventionResult {
  readonly postClass: SyntheticClass;  // verdad simulada; alumnos por id
  readonly assignment: SyntheticAssignment;
  readonly simulatedChanges: readonly SimulatedMasteryChange[];
  readonly provenance: SyntheticInterventionProvenance;
  readonly assumptions: readonly string[];
  readonly disclaimer: string;
}

interface SyntheticAssignment {
  readonly treatedStudentIds: readonly string[];  // por id
  readonly controlStudentIds: readonly string[];  // por id
  readonly treatmentIsEmpty: boolean;
  readonly controlIsEmpty: boolean;
}

interface SimulatedMasteryChange {
  readonly studentId: string;
  readonly skill: SkillId;
  readonly appliedProbability: number;
}

interface SyntheticInterventionProvenance {
  readonly generator: GeneratorInfo;
  readonly populationSeed: number;
  readonly interventionSeed: number;
  readonly config: EffectiveSyntheticInterventionConfig;
  readonly intervenedSkills: readonly SkillId[];  // en el orden de SKILL_ORDER
}

interface PostInterventionInput {
  readonly classState: SyntheticClass;
  readonly intervention: InterventionPlan;
  readonly seed: number;  // intervención y control; las respuestas usan la de población
  readonly pretestStates: readonly DiagnosticState[];
  readonly questionBank: QuestionBank;
  readonly knowledgeGraph: KnowledgeGraph;
  readonly priorConfig: PriorConfig;
  readonly config: PostInterventionConfig;
}

interface PostInterventionConfig extends SyntheticInterventionConfig {
  readonly questionBudgetPerStudent: number;      // entero positivo, obligatorio
  readonly assessmentSkills?: readonly SkillId[];  // por defecto, las seis
  readonly realParametersByQuestion?: Readonly<Record<QuestionId, RealItemParameters>>;
}

interface PostInterventionReport {
  readonly students: readonly StudentPostInterventionReport[];  // por id
  readonly groups: Readonly<Record<'treatment' | 'control', GroupPostInterventionReport>>;
  readonly differenceInDifferences: DifferenceInDifferences;  // observed, estimated, simulatedTruth, label
  readonly coverage: EvaluationCoverage;
  readonly postStates: readonly DiagnosticState[];  // solo alumnos con alguna pregunta de postest
  readonly postClass: SyntheticClass;               // verdad simulada
  readonly assignment: SyntheticAssignment;
  readonly simulatedChanges: readonly SimulatedMasteryChange[];
  readonly provenance: PostInterventionProvenance;  // la de 6A, más responseSeed y occasion
  readonly config: EffectivePostInterventionConfig;
  readonly priorConfig: EffectivePriorConfig;
  readonly warnings: readonly PostInterventionWarning[];  // code, message, studentIds
  readonly assumptions: readonly string[];
  readonly disclaimer: string;
}

interface StudentPostInterventionReport {
  readonly studentId: string;
  readonly group: 'treatment' | 'control';
  readonly coverage: StudentEvaluationCoverage;  // pretestQuestionIds, posttestQuestionIds, requestedBudget, effectiveBudget
  readonly observed: ObservedOutcome;            // pretest, posttest ({ correct, questions, proportion }), change, label
  readonly estimated: EstimatedOutcome;          // pretestMeanMastery, pretestBasedOnPriorOnly, posttestMeanMastery, change, label
  readonly simulatedTruth: SimulatedTruthOutcome;  // before, after, change, label
}

interface GroupPostInterventionReport {
  readonly group: 'treatment' | 'control';
  readonly studentIds: readonly string[];
  readonly isEmpty: boolean;
  readonly coverage: EvaluationCoverage;
  readonly observed: PairedMetric;
  readonly estimated: PairedMetric;
  readonly simulatedTruth: PairedMetric;
}

interface PairedMetric {
  readonly pairs: number;
  readonly excluded: number;
  readonly excludedStudentIds: readonly string[];
  readonly meanPretest: number | null;
  readonly meanPosttest: number | null;
  readonly meanChange: number | null;  // media de cambios individuales
  readonly label: string;
}

interface EvaluationCoverage {
  readonly requestedBudgetPerStudent: number;
  readonly pretest: EvaluationComposition;   // questionCount, questionsByPrimarySkill
  readonly posttest: EvaluationComposition;
  readonly meanEffectiveBudget: number | null;
  readonly studentsWithoutPosttest: readonly string[];
  readonly studentsWithReducedPosttest: readonly string[];
}
```

- `seed` es un entero uint32, incluido 0. `studentCount` es un entero seguro no negativo, y la clase vacía es válida.
- `SyntheticClass` contiene verdad simulada: no debe pasarse a inicialización diagnóstica, selección, posterior ni recomendaciones. Hacia fuera solo sale `observableStudents`.
- Los grupos por defecto `G1`, `G2` y `G3` son SUPUESTOS de demo, no grupos educativos validados ni estimaciones observadas.
- `UniformStream` es la única pieza con estado: cada flujo guarda el suyo y avanza al llamarlo. No hay estado global.
- `STREAMS` nombra los flujos de §2.7 y `GENERATOR` declara algoritmo y versión.
- `ResponseUniformTable` es privada: se prepara antes de ejecutar los métodos diagnósticos y no pasa al diagnóstico. Guarda uniformes, no resultados, de modo que un cambio de `α` puede cambiar la respuesta con el mismo `u`.
- `occasion` es texto libre, como `pretest` o `posttest`. No debe contener el nombre de un método: todos los métodos comparten la tabla de una ocasión.
- La tabla puede cubrir un subconjunto. Un par fuera de ella lanza `MISSING_UNIFORM`. Debe ser el producto ordenado de `studentIds` y `questionIds`; si no, se rechaza.
- `simulateResponse` devuelve solo un `AnswerValue`, válido para `submitAnswer`. Por defecto usa `slip` y `guess` del ítem; `realParameters` los sustituye sin modificar el banco.
- No regenera la verdad para validar la clase: una `α` distinta de la generada se acepta.
- Cada llamada valida la clase y la tabla enteras, con coste proporcional a su tamaño.
- `applySyntheticIntervention` cambia el conocimiento **simulado**: no genera postest ni diagnósticos. `simulatedChanges` no es una observación ni aprendizaje observado.
- Del plan solo usa las competencias. `benefit`, `netValue` y demás valores se comprueban como forma, pero no intervienen.
- Número de controles: con `x = studentCount · controlFraction`, `round(x)` si `|x − round(x)| ≤ 1e-12` y `floor(x)` en otro caso. Así, 100 alumnos con `0.29` dan 29 controles y con `0.28999`, 28. Es una tolerancia numérica, no incertidumbre estadística.
- `seed` es la semilla de intervención, independiente de la de población. `postClass.seed` conserva la de población.
- Reconstruir `postClass` requiere el plan, el estado anterior y la semilla y configuración de intervención: `createSyntheticClass` con `postClass.seed` devuelve el estado anterior, no este.
- `postClass.students` va ordenado por id en unidades de código, así que `S100` queda detrás de `S10`.
- La misma tabla de uniformes vale para `postClass`: el mismo `u` puede dar otra respuesta con la nueva `α`.
- `simulatePostIntervention` separa tres capas: `observed`, `estimated` y `simulatedTruth`. Nunca las combina, y `null` no se convierte en 0.
- `observed` es un cambio descriptivo no equiparado, porque pre y post usan ítems distintos. `estimated` no es aprendizaje confirmado. `simulatedTruth` solo es conocible en esta simulación.
- `postStates` no incluye a los alumnos sin preguntas nuevas: el prior no se presenta como resultado de un postest. Sus resultados de postest son `null`.
- Las preguntas del postest se fijan antes de aplicar el plan, con `fixedQuestionOrder`, sin EIG. No dependen del plan ni de tratamiento o control.
- `seed` no se usa para las respuestas: los uniformes del postest usan `classState.seed` y la ocasión `posttest`. La tabla no forma parte del informe.
- `priorConfig` debe coincidir con el prior efectivo de cada pretest, tras normalizarlo. No se compara el posterior con el prior.
- `realParametersByQuestion` solo afecta al respondedor: el diagnóstico sigue usando los parámetros del banco.
- Esta función es el único punto de `src/simulation` que llama a `createInitialDiagnosticState` y `submitAnswer`, con id, prior y respuestas observables.
- Avisos: `NO_STUDENTS`, `EMPTY_TREATMENT`, `EMPTY_CONTROL`, `NO_POSTTEST_QUESTIONS`, `REDUCED_POSTTEST`, `PRIOR_ONLY_PRETEST` y `UNEQUAL_COVERAGE`.

| `SimulationError.code` | Causa |
|---|---|
| `INVALID_SEED` | La semilla no es un entero uint32. |
| `INVALID_STREAM_LABEL` | La etiqueta del flujo no es un texto no vacío. |
| `INVALID_STUDENT_COUNT` | El tamaño no es un entero seguro no negativo. |
| `INVALID_SIMULATION_CONFIG` | Grupos, ids, probabilidades o factor inválidos. |
| `INVALID_SYNTHETIC_CLASS` | La clase no tiene la forma esperada, otro generador u orden de competencias, alumnos repetidos o una `α` no binaria. |
| `INVALID_OCCASION` | La ocasión no es un texto no vacío. |
| `INVALID_ID_LIST` | La lista de ids no es una lista, repite un id o tiene un id vacío. |
| `INVALID_UNIFORM_TABLE` | La tabla no tiene la forma esperada, repite o desordena claves, no cubre lo declarado o tiene uniformes fuera de `[0, 1)`. |
| `INCOMPATIBLE_SEED` | La tabla y la clase tienen semillas distintas. |
| `UNKNOWN_STUDENT` | El alumno no está en la clase. |
| `MISSING_UNIFORM` | La tabla no cubre el par (alumno, pregunta). |
| `INVALID_QUESTION` | Formato desconocido, opciones inválidas, sin distractores o respuesta numérica no canónica. |
| `INVALID_REAL_PARAMETERS` | `realParameters` no es un objeto, o `realParametersByQuestion` cita preguntas desconocidas o valores que no son objetos. |
| `INVALID_INTERVENTION_PLAN` | El plan no tiene la forma esperada, repite o desconoce una competencia, un id no corresponde a su competencia o `totalMinutes` no coincide con las duraciones. |
| `INVALID_INTERVENTION_CONFIG` | Probabilidad, factor o fracción de control fuera de `[0, 1]`. |
| `INVALID_POST_INTERVENTION_INPUT` | La entrada no es un objeto o falta `priorConfig`. |
| `INVALID_POST_INTERVENTION_CONFIG` | `questionBudgetPerStudent` no es un entero positivo o `assessmentSkills` está vacía, repite o cita competencias desconocidas. |
| `INCONSISTENT_PRETEST` | Los estados de pretest no corresponden exactamente a los alumnos de la clase. |
| `PRIOR_MISMATCH` | `priorConfig` no coincide con el prior efectivo de algún pretest. |
| `POSTTEST_FAILED` | `submitAnswer` rechaza una respuesta sintética. |

Un grafo sin las seis competencias lanza `InferenceError` con `INVALID_GRAPH`. Un grafo con estructura inválida lanza `KnowledgeGraphError`. `slip` y `guess`, del ítem o reales, que incumplan la restricción DINA lanzan `InferenceError` con `INVALID_PARAMETERS`, y un `R_q` inválido, sus códigos habituales. En `simulatePostIntervention`, estados, historiales, banco y prior inválidos lanzan los errores del motor (`INVALID_STATE`, `INVALID_HISTORY`, `INVALID_BANK`, `INVALID_PRIOR`).

## Métricas de evaluación

`src/benchmarks/index.ts`. Comparan estimaciones con la verdad simulada: solo sirven en simulación.

```ts
computeDiagnosticMetrics(states: readonly DiagnosticState[], syntheticClass: SyntheticClass, config?: DiagnosticMetricsConfig): DiagnosticMetrics
```

```ts
interface DiagnosticMetricsConfig {
  readonly tau?: number;  // en [0, 1]; 0.5 por defecto
}

interface DiagnosticMetrics {
  readonly config: EffectiveDiagnosticMetricsConfig;
  readonly studentCount: number;
  readonly pairCount: number;
  readonly overall: MetricSummary;
  readonly students: readonly StudentDiagnosticMetrics[];  // MetricSummary con studentId y questionsUsed; por id
  readonly skills: readonly SkillDiagnosticMetrics[];      // MetricSummary con skill; en el orden de SKILL_ORDER
  readonly questionsUsed: QuestionUsage;                   // total, mean
  readonly definitions: MetricDefinitions;
  readonly disclaimer: string;
}

interface MetricSummary {
  readonly pairCount: number;
  readonly mae: number | null;
  readonly brier: number | null;
  readonly logLoss: number | null;  // en nats
  readonly confusion: DifficultyConfusion;  // truePositives, falsePositives, trueNegatives, falseNegatives
  readonly precision: number | null;
  readonly recall: number | null;
  readonly f1: number | null;
  readonly accuracy: number | null;
}
```

- Exige que `states` corresponda exactamente a los alumnos de la clase, sin duplicados y en cualquier orden. El resultado no depende de ese orden.
- La verdad simulada no se pasa a ninguna función diagnóstica: a la inferencia solo llega `state.joint`.
- `null` indica que la métrica no está definida y nunca equivale a 0. Con la clase vacía, los recuentos y `questionsUsed.total` son 0, y las métricas y `questionsUsed.mean`, `null`. `skills` mantiene las seis competencias, con `pairCount` 0.
- `questionsUsed` cuenta el historial completo de cada estado.
- No mide tiempos: eso corresponde al ejecutor.

| `BenchmarkError.code` | Causa |
|---|---|
| `INVALID_METRICS_CONFIG` | La configuración no es un objeto o `tau` no es finito en `[0, 1]`. |
| `INCONSISTENT_STUDENTS` | `states` no es una lista, repite un alumno o no corresponde exactamente a la clase. |
| `INVALID_OBSERVATIONS` | Las observaciones no son una lista, repiten una semilla, o tienen una semilla que no es uint32 o un valor que no es finito ni `null`. |
| `INVALID_STATS_CONFIG` | `seriesId`, `bootstrapSeed`, `resamples`, `direction` o `tieTolerance` inválidos. |
| `NON_FINITE_STATISTIC` | Una diferencia, media, desviación o límite no es representable. Nunca se devuelve `Infinity` ni `NaN`. |
| `INVALID_METHOD_INPUT` | Entrada, método, `priorConfig`, `randomOrderSeed`, `measureTiming` o presupuestos inválidos. |
| `INVALID_RESPONSE_TABLE` | La tabla no tiene la forma esperada, no es de la ocasión `pretest`, tiene otra semilla o no cubre a todos los alumnos y preguntas. |
| `INVALID_REAL_PARAMETERS` | `realParametersByQuestion` cita preguntas desconocidas o valores que no son objetos. |
| `ANSWER_REJECTED` | `submitAnswer` rechaza una respuesta sintética. |
| `SELECTION_FAILED` | No hay pregunta para un paso que debería tenerla. |
| `INVALID_BENCHMARK_CONFIG` | Semilla base, tamaños, métodos, escenarios o medición inválidos, o presupuestos sin `all`. |
| `ALL_BUDGET_MISMATCH` | Con `all`, los posteriores o las métricas de los métodos difieren en más de `1e-9`. |

Un estado inválido lanza `InferenceError` (`INVALID_STATE`, `INVALID_DISTRIBUTION`, `INVALID_HISTORY`) y una clase inválida, `SimulationError` con `INVALID_SYNTHETIC_CLASS`. La validación de estados no comprueba el historial contra un banco, porque esta función no lo recibe.

## Estadística entre semillas

`src/benchmarks/index.ts`. Cada semilla es una réplica completa.

```ts
summarizeSeedValues(observations: readonly SeedObservation[], config: SeedSeriesConfig): SeedSeriesSummary
comparePairedSeeds(methodA: readonly SeedObservation[], methodB: readonly SeedObservation[], config: PairedComparisonConfig): PairedComparison
```

```ts
interface SeedObservation {
  readonly seed: number;          // entero uint32
  readonly value: number | null;  // finito o null
}

interface SeedSeriesConfig {
  readonly seriesId: string;       // identifica el flujo de remuestreo
  readonly bootstrapSeed: number;  // entero uint32
  readonly resamples?: number;     // entero positivo; 2000 por defecto
}

interface PairedComparisonConfig extends SeedSeriesConfig {
  readonly direction: 'lowerIsBetter' | 'higherIsBetter';
  readonly tieTolerance?: number;  // finita y no negativa; 1e-12 por defecto
}

interface SeedSeriesSummary {
  readonly totalCount: number;
  readonly validCount: number;
  readonly excludedSeeds: readonly number[];
  readonly mean: number | null;
  readonly standardDeviation: number | null;  // divisor n - 1
  readonly confidenceInterval: { readonly lower: number; readonly upper: number } | null;
  readonly bootstrap: BootstrapProvenance;
  readonly warnings: readonly SeedStatisticsWarning[];  // 'NO_VALID_VALUES' | 'SINGLE_VALID_VALUE'
}

interface PairedComparison {
  readonly direction: ImprovementDirection;
  readonly tieTolerance: number;
  readonly pairCount: number;
  readonly pairs: readonly PairedDifference[];       // seed, a, b, difference = b - a
  readonly excludedPairs: readonly ExcludedPair[];   // seed, reason
  readonly differences: SeedSeriesSummary;           // resumen de las diferencias B - A
  readonly improvedCount: number;
  readonly tiedCount: number;
  readonly worsenedCount: number;
  readonly disclaimer: string;
}
```

- `BootstrapProvenance` declara método, estadístico, unidad, generador, `bootstrapSeed`, `seriesId`, `streamLabel`, `resamples`, `resampleSize`, nivel y cuantiles.
- `seriesId` debe ser distinto para cada métrica, método y escenario, como `mae/B` o `mae/B-A`. Dos series con el mismo id y semilla comparten remuestreo.
- `reason` es `missingInA`, `missingInB`, `nullInA`, `nullInB` o `nullInBoth`. Si falta en un método, prevalece `missing…`.
- `improvedCount` depende de `direction`. `tieTolerance` solo clasifica.
- Un `null` nunca se convierte en 0. Sin valores válidos, media, desviación e intervalo son `null`.
- Con un solo valor, el intervalo es degenerado: no significa ausencia de variabilidad.
- El intervalo no es prueba de eficacia educativa ni garantía de superioridad.

## Ejecución de métodos

`src/benchmarks/index.ts`. Ejecuta un método sobre una réplica. No crea escenarios ni repite semillas.

```ts
runDiagnosticMethod(input: DiagnosticMethodInput): DiagnosticMethodRun
```

```ts
type DiagnosticMethod = 'A' | 'B' | 'C';  // fijo, adaptativo EIG, aleatorio con semilla
type QuestionBudget = number | 'all';     // entero positivo o todas las preguntas

interface DiagnosticMethodInput {
  readonly method: DiagnosticMethod;
  readonly syntheticClass: SyntheticClass;
  readonly questionBank: QuestionBank;
  readonly knowledgeGraph: KnowledgeGraph;
  readonly priorConfig: PriorConfig;
  readonly uniforms: ResponseUniformTable;  // ocasión pretest; todos los alumnos y preguntas
  readonly budgets: readonly QuestionBudget[];
  readonly randomOrderSeed: number;         // uint32; obligatoria aunque solo la use C
  readonly measureTiming?: boolean;
  readonly realParametersByQuestion?: Readonly<Record<QuestionId, RealItemParameters>>;
  readonly metricsConfig?: DiagnosticMetricsConfig;
}

interface DiagnosticMethodRun {
  readonly results: DiagnosticMethodResults;       // determinista
  readonly timing: DiagnosticMethodTiming | null;  // null si no se pide
}

interface DiagnosticMethodResults {
  readonly method: DiagnosticMethod;
  readonly config: DiagnosticMethodConfig;  // budgets, randomOrderSeed, populationSeed, occasion, generator, bankSize, priorConfig, metricsConfig, realParametersByQuestion
  readonly students: readonly MethodStudentTrajectory[];  // studentId, steps: questionId, answer, isCorrect
  readonly budgets: readonly MethodBudgetResult[];        // requestedBudget, effectiveBudget, states, metrics
}

interface DiagnosticMethodTiming {
  readonly preparationMs: number;
  readonly selectionMs: number;
  readonly selectionCount: number;
  readonly meanSelectionMs: number | null;
  readonly definition: string;
  readonly disclaimer: string;
}
```

- Una réplica crea una sola clase y una sola tabla, y las comparte entre métodos: así todos ven la misma respuesta para el mismo alumno y pregunta.
- `budgets` admite enteros positivos y `all`, sin duplicados. Se devuelven en orden canónico: números ascendentes y después `all`.
- Los presupuestos menores son prefijos de una única trayectoria: añadir presupuestos no cambia los anteriores.
- `all` consume todas las preguntas, sin parada anticipada. Un número mayor que el banco usa las disponibles: `requestedBudget` y `effectiveBudget` difieren.
- `realParametersByQuestion` solo llega a `simulateResponse`. El diagnóstico usa los parámetros del banco.
- `results` no contiene fechas ni tiempos, y medir no lo cambia. `results` sí contiene estados y métricas, pero no `trueMastery`, grupos ni uniformes.
- Los alumnos salen ordenados por id.
- `preparationMs` mide `fixedQuestionOrder` en A y las permutaciones en C; en B vale 0. `selectionMs` mide obtener cada pregunta: `selectNextQuestion` en B y leer el orden en A y C. No incluye simular, registrar ni calcular métricas. No son una comparación definitiva de rendimiento.
- Una clase, tabla, banco, grafo o prior inválidos lanzan los errores de sus módulos. Los uniformes se validan en cada consulta de `simulateResponse`.

## Experimento

`src/benchmarks/index.ts`. Sin módulos de Node: se puede usar en el navegador. Las escrituras están en `scripts/bench.ts`.

```ts
runBenchmark(config?: BenchmarkConfig): BenchmarkReport
renderBenchmarkMarkdown(results: BenchmarkResults): string
```

```ts
interface BenchmarkConfig {
  readonly baseSeed?: number;      // uint32; DEFAULT_BENCHMARK_BASE_SEED = 2026
  readonly studentCount?: number;  // 30
  readonly seedCount?: number;     // 30
  readonly budgets?: readonly QuestionBudget[];   // [4, 6, 9, 12, 'all']; debe incluir 'all'
  readonly methods?: readonly DiagnosticMethod[]; // A, B y C; debe incluir A y B
  readonly resamples?: number;     // 2000
  readonly priorConfig?: PriorConfig;
  readonly scenarios?: readonly BenchmarkScenarioId[];  // 'wellSpecified' | 'misspecified' | 'homogeneous'
  readonly measureTiming?: boolean;
}

interface BenchmarkReport {
  readonly results: BenchmarkResults;       // determinista
  readonly timing: BenchmarkTiming | null;  // null si no se pide
}

interface BenchmarkResults {
  readonly benchmarkVersion: number;
  readonly kind: 'full' | 'test';
  readonly config: EffectiveBenchmarkConfig;
  readonly replicaSeeds: readonly number[];
  readonly bootstrapSeed: number;
  readonly scenarios: readonly BenchmarkScenarioResult[];
  readonly disclaimer: string;
}

interface BenchmarkScenarioResult {
  readonly definition: BenchmarkScenarioDefinition;  // id, description, population, realParameters
  readonly replicas: readonly BenchmarkReplica[];    // seed, randomOrderSeed, results
  readonly summaries: readonly MethodBudgetSummary[];  // por presupuesto y método
  readonly comparisons: readonly MetricComparison[];   // B - A, por presupuesto y métrica
  readonly allBudgetCheck: AllBudgetCheck;
}
```

- `kind` es `test` si la ejecución no usa la configuración completa: esas ejecuciones no son resultados experimentales.
- `replicas` guarda las métricas globales de cada método y presupuesto, con las que se recalculan `summaries` y `comparisons`. No guarda estados ni trayectorias: se regeneran con la configuración.
- `allBudgetCheck` solo consta si se supera: si no, la ejecución lanza `ALL_BUDGET_MISMATCH`.
- `results` no contiene verdad simulada, uniformes, fechas ni tiempos.

**CLI.**

```bash
npm run bench
```

Escribe en `docs/engine/` tres archivos: `RESULTADOS_BENCHMARK.json` y `RESULTADOS_BENCHMARK.md`, deterministas, y `RESULTADOS_BENCHMARK_TIEMPOS.json`, con tiempos y metadatos variables.

```bash
npm run bench -- --check
```

Regenera el bloque determinista y lo compara byte a byte con los dos primeros archivos, sin escribir. Termina con error si difieren.
