// Tipos del simulador. La verdad simulada vive solo aquí: no pasa a src/engine
// ni a tipos compartidos (§2.7).
import type {
  DiagnosticState,
  EffectivePriorConfig,
  InterventionPlan,
  KnowledgeGraph,
  MasteryVector,
  PriorConfig,
  QuestionBank,
  QuestionId,
  SkillId,
} from '../engine/index.ts';

export type SimulationErrorCode =
  | 'INVALID_SEED'
  | 'INVALID_STREAM_LABEL'
  | 'INVALID_STUDENT_COUNT'
  | 'INVALID_SIMULATION_CONFIG'
  | 'INVALID_SYNTHETIC_CLASS'
  | 'INVALID_OCCASION'
  | 'INVALID_ID_LIST'
  | 'INVALID_UNIFORM_TABLE'
  | 'INCOMPATIBLE_SEED'
  | 'UNKNOWN_STUDENT'
  | 'MISSING_UNIFORM'
  | 'INVALID_QUESTION'
  | 'INVALID_REAL_PARAMETERS'
  | 'INVALID_INTERVENTION_PLAN'
  | 'INVALID_INTERVENTION_CONFIG'
  | 'INVALID_POST_INTERVENTION_INPUT'
  | 'INVALID_POST_INTERVENTION_CONFIG'
  | 'INCONSISTENT_PRETEST'
  | 'PRIOR_MISMATCH'
  | 'POSTTEST_FAILED';

// Devuelve el siguiente uniforme en [0, 1) y avanza su propio estado.
export type UniformStream = () => number;

export interface GeneratorInfo {
  readonly algorithm: 'mulberry32';
  // Cambia si cambia cualquier resultado para una misma configuración y semilla.
  readonly version: number;
}

// Perfil de demo: no es un grupo educativo validado ni una estimación observada.
export interface SyntheticGroupConfig {
  readonly id: string;
  // Probabilidad base de dominio de las seis competencias.
  readonly masteryProbabilities: Readonly<Record<SkillId, number>>;
}

export interface SimulationConfig {
  // Al menos uno. El alumno de índice i va al grupo i mod nº de grupos.
  readonly groups?: readonly SyntheticGroupConfig[];
  // Factor en [0, 1] si falta al menos un ancestro.
  readonly prerequisiteFactor?: number;
}

export interface EffectiveSimulationConfig {
  readonly groups: readonly SyntheticGroupConfig[];
  readonly prerequisiteFactor: number;
}

export interface SyntheticStudent {
  readonly studentId: string;
  readonly displayName: string;
  // Verdad privada: grupo generador.
  readonly groupId: string;
  // Verdad privada: α en el orden de `skillOrder`.
  readonly trueMastery: MasteryVector;
}

export interface SyntheticClass {
  readonly generator: GeneratorInfo;
  readonly seed: number;
  readonly studentCount: number;
  readonly config: EffectiveSimulationConfig;
  // Orden explícito de codificación de `trueMastery`, igual a SKILL_ORDER.
  readonly skillOrder: readonly SkillId[];
  readonly students: readonly SyntheticStudent[];
}

// Lo único que puede salir hacia diagnóstico, selección o interfaz.
export interface ObservableStudent {
  readonly studentId: string;
  readonly displayName: string;
}

export interface ResponseUniformEntry {
  readonly studentId: string;
  readonly questionId: string;
  // Acierto si es menor que P(Y_q = 1 | α actual).
  readonly correctness: number;
  // Elige el distractor en opción múltiple.
  readonly distractor: number;
}

// Tabla privada: no pasa al diagnóstico. Guarda uniformes, no resultados.
export interface ResponseUniformTable {
  readonly generator: GeneratorInfo;
  readonly seed: number;
  readonly occasion: string;
  // Ordenados y sin repetir.
  readonly studentIds: readonly string[];
  readonly questionIds: readonly string[];
  // Producto de ambas listas: por alumno y, dentro de cada uno, por pregunta.
  readonly entries: readonly ResponseUniformEntry[];
}

// Slip y guess reales, que pueden diferir de los que asume el motor.
export interface RealItemParameters {
  readonly slip: number;
  readonly guess: number;
}

export interface SyntheticInterventionConfig {
  // p_mejora en [0, 1]: SUPUESTO; 0.35 por defecto.
  readonly improvementProbability?: number;
  // Factor en [0, 1] si falta al menos un ancestro: SUPUESTO; 0.5 por defecto.
  readonly prerequisiteImprovementFactor?: number;
  // Fracción de alumnos en control, en [0, 1]; 0 por defecto.
  readonly controlFraction?: number;
}

export type EffectiveSyntheticInterventionConfig = Required<SyntheticInterventionConfig>;

export interface SyntheticAssignment {
  // Ordenados por id.
  readonly treatedStudentIds: readonly string[];
  readonly controlStudentIds: readonly string[];
  readonly treatmentIsEmpty: boolean;
  readonly controlIsEmpty: boolean;
}

// Cambio de α en la simulación: no es una observación ni aprendizaje observado.
export interface SimulatedMasteryChange {
  readonly studentId: string;
  readonly skill: SkillId;
  // Probabilidad usada, tras aplicar el factor si faltaba algún ancestro.
  readonly appliedProbability: number;
}

// Con el estado anterior, basta para reproducir postClass.
export interface SyntheticInterventionProvenance {
  readonly generator: GeneratorInfo;
  readonly populationSeed: number;
  readonly interventionSeed: number;
  readonly config: EffectiveSyntheticInterventionConfig;
  // Competencias del plan, en el orden de SKILL_ORDER.
  readonly intervenedSkills: readonly SkillId[];
}

export interface SyntheticInterventionResult {
  // Alumnos por id. Contiene verdad simulada.
  readonly postClass: SyntheticClass;
  readonly assignment: SyntheticAssignment;
  // Por alumno y, dentro de cada uno, en el orden de SKILL_ORDER.
  readonly simulatedChanges: readonly SimulatedMasteryChange[];
  readonly provenance: SyntheticInterventionProvenance;
  readonly assumptions: readonly string[];
  readonly disclaimer: string;
}

export interface PostInterventionConfig extends SyntheticInterventionConfig {
  // Entero positivo.
  readonly questionBudgetPerStudent: number;
  // Por defecto, las seis competencias.
  readonly assessmentSkills?: readonly SkillId[];
  // Solo afectan al respondedor, nunca al motor.
  readonly realParametersByQuestion?: Readonly<Record<QuestionId, RealItemParameters>>;
}

export interface EffectivePostInterventionConfig extends EffectiveSyntheticInterventionConfig {
  readonly questionBudgetPerStudent: number;
  // En el orden de SKILL_ORDER.
  readonly assessmentSkills: readonly SkillId[];
  // Con las claves en el orden del banco.
  readonly realParametersByQuestion: Readonly<Record<QuestionId, RealItemParameters>>;
}

export interface PostInterventionInput {
  readonly classState: SyntheticClass;
  readonly intervention: InterventionPlan;
  // Semilla de intervención y control. Las respuestas usan la de población.
  readonly seed: number;
  readonly pretestStates: readonly DiagnosticState[];
  readonly questionBank: QuestionBank;
  readonly knowledgeGraph: KnowledgeGraph;
  readonly priorConfig: PriorConfig;
  readonly config: PostInterventionConfig;
}

export type TreatmentGroup = 'treatment' | 'control';

export interface ObservedPeriod {
  readonly correct: number;
  readonly questions: number;
  // null si no hubo preguntas en el periodo.
  readonly proportion: number | null;
}

export interface ObservedOutcome {
  readonly pretest: ObservedPeriod;
  readonly posttest: ObservedPeriod;
  // Solo con ambas proporciones. Pre y post usan ítems distintos.
  readonly change: number | null;
  readonly label: string;
}

export interface EstimatedOutcome {
  readonly pretestMeanMastery: number;
  // El pretest no tenía ninguna respuesta: su valor es el prior.
  readonly pretestBasedOnPriorOnly: boolean;
  // null si no hubo preguntas nuevas.
  readonly posttestMeanMastery: number | null;
  readonly change: number | null;
  readonly label: string;
}

// Solo conocible en esta simulación.
export interface SimulatedTruthOutcome {
  readonly before: number;
  readonly after: number;
  readonly change: number;
  readonly label: string;
}

export interface StudentEvaluationCoverage {
  // Respuestas del pretest con competencia principal en assessmentSkills.
  readonly pretestQuestionIds: readonly QuestionId[];
  // Fijadas antes de aplicar el plan.
  readonly posttestQuestionIds: readonly QuestionId[];
  readonly requestedBudget: number;
  readonly effectiveBudget: number;
}

export interface StudentPostInterventionReport {
  readonly studentId: string;
  readonly group: TreatmentGroup;
  readonly coverage: StudentEvaluationCoverage;
  readonly observed: ObservedOutcome;
  readonly estimated: EstimatedOutcome;
  readonly simulatedTruth: SimulatedTruthOutcome;
}

// Sobre los mismos alumnos, con pareja válida para esta métrica.
export interface PairedMetric {
  readonly pairs: number;
  readonly excluded: number;
  readonly excludedStudentIds: readonly string[];
  readonly meanPretest: number | null;
  readonly meanPosttest: number | null;
  // Media de los cambios individuales.
  readonly meanChange: number | null;
  readonly label: string;
}

export interface EvaluationComposition {
  readonly questionCount: number;
  // Competencias de assessmentSkills.
  readonly questionsByPrimarySkill: Readonly<Record<SkillId, number>>;
}

export interface EvaluationCoverage {
  readonly requestedBudgetPerStudent: number;
  readonly pretest: EvaluationComposition;
  readonly posttest: EvaluationComposition;
  // null sin alumnos.
  readonly meanEffectiveBudget: number | null;
  readonly studentsWithoutPosttest: readonly string[];
  // Con alguna pregunta, pero menos que el presupuesto.
  readonly studentsWithReducedPosttest: readonly string[];
}

export interface GroupPostInterventionReport {
  readonly group: TreatmentGroup;
  readonly studentIds: readonly string[];
  readonly isEmpty: boolean;
  readonly coverage: EvaluationCoverage;
  readonly observed: PairedMetric;
  readonly estimated: PairedMetric;
  readonly simulatedTruth: PairedMetric;
}

// Cambio medio de tratamiento menos cambio medio de control: estimación en
// simulación. null salvo que ambos grupos tengan parejas válidas.
export interface DifferenceInDifferences {
  readonly observed: number | null;
  readonly estimated: number | null;
  readonly simulatedTruth: number | null;
  readonly label: string;
}

export type PostInterventionWarningCode =
  | 'NO_STUDENTS'
  | 'EMPTY_TREATMENT'
  | 'EMPTY_CONTROL'
  | 'NO_POSTTEST_QUESTIONS'
  | 'REDUCED_POSTTEST'
  | 'PRIOR_ONLY_PRETEST'
  | 'UNEQUAL_COVERAGE';

export interface PostInterventionWarning {
  readonly code: PostInterventionWarningCode;
  readonly message: string;
  readonly studentIds: readonly string[];
}

export interface PostInterventionProvenance extends SyntheticInterventionProvenance {
  // Semilla de los uniformes del postest: la de población.
  readonly responseSeed: number;
  readonly occasion: string;
}

export interface PostInterventionReport {
  // Por id.
  readonly students: readonly StudentPostInterventionReport[];
  readonly groups: Readonly<Record<TreatmentGroup, GroupPostInterventionReport>>;
  readonly differenceInDifferences: DifferenceInDifferences;
  readonly coverage: EvaluationCoverage;
  // Diagnósticos nuevos, por id: solo alumnos con alguna pregunta de postest.
  readonly postStates: readonly DiagnosticState[];
  // Verdad simulada, separada de los estados diagnósticos.
  readonly postClass: SyntheticClass;
  readonly assignment: SyntheticAssignment;
  readonly simulatedChanges: readonly SimulatedMasteryChange[];
  readonly provenance: PostInterventionProvenance;
  readonly config: EffectivePostInterventionConfig;
  readonly priorConfig: EffectivePriorConfig;
  readonly warnings: readonly PostInterventionWarning[];
  readonly assumptions: readonly string[];
  readonly disclaimer: string;
}
