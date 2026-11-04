import { SKILL_ORDER, marginals } from '../engine/index.ts';
import type { AnswerRecord, DiagnosticState, MasteryVector, Question, QuestionId, SkillId } from '../engine/index.ts';
import type {
  DifferenceInDifferences,
  EffectivePostInterventionConfig,
  EvaluationComposition,
  EvaluationCoverage,
  GroupPostInterventionReport,
  ObservedPeriod,
  PairedMetric,
  PostInterventionReport,
  PostInterventionWarning,
  StudentPostInterventionReport,
  TreatmentGroup,
} from './types.ts';

const OBSERVED_LABEL = 'cambio descriptivo no equiparado';
const ESTIMATED_LABEL = 'cambio estimado por el modelo, no aprendizaje confirmado';
const SIMULATED_TRUTH_LABEL = 'solo conocible en esta simulación, no observado';
const DIFFERENCE_LABEL = 'estimación en simulación; el cambio observado es descriptivo no equiparado';

function meanOf(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function requiredMean(skills: readonly SkillId[], valueOf: (skill: SkillId) => number): number {
  return meanOf(skills.map(valueOf)) ?? Number.NaN;
}

function changeBetween(before: number | null, after: number | null): number | null {
  return before === null || after === null ? null : after - before;
}

function observedPeriod(records: readonly AnswerRecord[]): ObservedPeriod {
  const correct = records.filter((record) => record.isCorrect).length;
  return { correct, questions: records.length, proportion: records.length === 0 ? null : correct / records.length };
}

function meanMastery(state: DiagnosticState, skills: readonly SkillId[]): number {
  const mastery = marginals(state.joint);
  return requiredMean(skills, (skill) => mastery[skill] ?? Number.NaN);
}

function meanAlpha(alpha: MasteryVector, skills: readonly SkillId[]): number {
  return requiredMean(skills, (skill) => alpha[SKILL_ORDER.indexOf(skill)] ?? Number.NaN);
}

export interface StudentReportInput {
  readonly studentId: string;
  readonly group: TreatmentGroup;
  readonly pretest: DiagnosticState;
  // null si no quedaban preguntas nuevas.
  readonly posttest: DiagnosticState | null;
  readonly posttestQuestionIds: readonly QuestionId[];
  readonly masteryBefore: MasteryVector;
  readonly masteryAfter: MasteryVector;
  readonly questionsById: ReadonlyMap<QuestionId, Question>;
  readonly config: EffectivePostInterventionConfig;
}

export function studentReport(input: StudentReportInput): StudentPostInterventionReport {
  const { studentId, group, pretest, posttest, posttestQuestionIds, questionsById, config } = input;
  const skills = config.assessmentSkills;
  const inScope = (record: AnswerRecord): boolean => skills.includes(questionsById.get(record.questionId)?.primarySkill ?? '');

  const pretestRecords = pretest.responses.filter(inScope);
  const observedPretest = observedPeriod(pretestRecords);
  const observedPosttest = observedPeriod(posttest?.responses ?? []);

  const basedOnPriorOnly = pretest.responses.length === 0;
  const pretestMeanMastery = meanMastery(pretest, skills);
  const posttestMeanMastery = posttest === null ? null : meanMastery(posttest, skills);

  const before = meanAlpha(input.masteryBefore, skills);
  const after = meanAlpha(input.masteryAfter, skills);

  return {
    studentId,
    group,
    coverage: {
      pretestQuestionIds: pretestRecords.map((record) => record.questionId),
      posttestQuestionIds,
      requestedBudget: config.questionBudgetPerStudent,
      effectiveBudget: posttestQuestionIds.length,
    },
    observed: {
      pretest: observedPretest,
      posttest: observedPosttest,
      change: changeBetween(observedPretest.proportion, observedPosttest.proportion),
      label: OBSERVED_LABEL,
    },
    estimated: {
      pretestMeanMastery,
      pretestBasedOnPriorOnly: basedOnPriorOnly,
      posttestMeanMastery,
      change: basedOnPriorOnly ? null : changeBetween(pretestMeanMastery, posttestMeanMastery),
      label: ESTIMATED_LABEL,
    },
    simulatedTruth: { before, after, change: after - before, label: SIMULATED_TRUTH_LABEL },
  };
}

interface PairRow {
  readonly studentId: string;
  readonly pretest: number | null;
  readonly posttest: number | null;
  readonly change: number | null;
}

// Solo alumnos con pareja válida: pre y post salen de los mismos alumnos, y un
// null nunca cuenta como 0.
export function pairedMetric(rows: readonly PairRow[], label: string): PairedMetric {
  const valid = rows.flatMap(({ pretest, posttest, change }) =>
    pretest === null || posttest === null || change === null ? [] : [{ pretest, posttest, change }],
  );
  const excludedStudentIds = rows.filter((row) => row.change === null).map((row) => row.studentId);
  return {
    pairs: valid.length,
    excluded: excludedStudentIds.length,
    excludedStudentIds,
    meanPretest: meanOf(valid.map((row) => row.pretest)),
    meanPosttest: meanOf(valid.map((row) => row.posttest)),
    meanChange: meanOf(valid.map((row) => row.change)),
    label,
  };
}

function compositionOf(
  questionIds: readonly QuestionId[],
  questionsById: ReadonlyMap<QuestionId, Question>,
  skills: readonly SkillId[],
): EvaluationComposition {
  const primary = questionIds.map((id) => questionsById.get(id)?.primarySkill);
  return {
    questionCount: questionIds.length,
    questionsByPrimarySkill: Object.fromEntries(
      skills.map((skill) => [skill, primary.filter((item) => item === skill).length]),
    ),
  };
}

function coverageOf(
  students: readonly StudentPostInterventionReport[],
  questionsById: ReadonlyMap<QuestionId, Question>,
  config: EffectivePostInterventionConfig,
): EvaluationCoverage {
  const skills = config.assessmentSkills;
  const requested = config.questionBudgetPerStudent;
  const budgets = students.map((student) => student.coverage.effectiveBudget);
  const idsWhere = (test: (budget: number) => boolean): readonly string[] =>
    students.filter((student) => test(student.coverage.effectiveBudget)).map((student) => student.studentId);
  return {
    requestedBudgetPerStudent: requested,
    pretest: compositionOf(students.flatMap((student) => student.coverage.pretestQuestionIds), questionsById, skills),
    posttest: compositionOf(students.flatMap((student) => student.coverage.posttestQuestionIds), questionsById, skills),
    meanEffectiveBudget: meanOf(budgets),
    studentsWithoutPosttest: idsWhere((budget) => budget === 0),
    studentsWithReducedPosttest: idsWhere((budget) => budget > 0 && budget < requested),
  };
}

function groupReport(
  group: TreatmentGroup,
  students: readonly StudentPostInterventionReport[],
  questionsById: ReadonlyMap<QuestionId, Question>,
  config: EffectivePostInterventionConfig,
): GroupPostInterventionReport {
  return {
    group,
    studentIds: students.map((student) => student.studentId),
    isEmpty: students.length === 0,
    coverage: coverageOf(students, questionsById, config),
    observed: pairedMetric(
      students.map(({ studentId, observed }) => ({
        studentId,
        pretest: observed.pretest.proportion,
        posttest: observed.posttest.proportion,
        change: observed.change,
      })),
      OBSERVED_LABEL,
    ),
    estimated: pairedMetric(
      students.map(({ studentId, estimated }) => ({
        studentId,
        pretest: estimated.pretestMeanMastery,
        posttest: estimated.posttestMeanMastery,
        change: estimated.change,
      })),
      ESTIMATED_LABEL,
    ),
    simulatedTruth: pairedMetric(
      students.map(({ studentId, simulatedTruth }) => ({
        studentId,
        pretest: simulatedTruth.before,
        posttest: simulatedTruth.after,
        change: simulatedTruth.change,
      })),
      SIMULATED_TRUTH_LABEL,
    ),
  };
}

function differenceOf(treatment: PairedMetric, control: PairedMetric): number | null {
  return treatment.meanChange === null || control.meanChange === null ? null : treatment.meanChange - control.meanChange;
}

// Por alumno y competencia, en enteros: sin redondeo que invente una diferencia.
function hasUnequalCoverage(treatment: GroupPostInterventionReport, control: GroupPostInterventionReport): boolean {
  const countOf = (group: GroupPostInterventionReport, skill: SkillId): number =>
    group.coverage.posttest.questionsByPrimarySkill[skill] ?? 0;
  return Object.keys(treatment.coverage.posttest.questionsByPrimarySkill).some(
    (skill) => countOf(treatment, skill) * control.studentIds.length !== countOf(control, skill) * treatment.studentIds.length,
  );
}

function warningsOf(
  students: readonly StudentPostInterventionReport[],
  groups: Readonly<Record<TreatmentGroup, GroupPostInterventionReport>>,
  coverage: EvaluationCoverage,
): readonly PostInterventionWarning[] {
  const { treatment, control } = groups;
  const withoutPosttest = coverage.studentsWithoutPosttest;
  const reduced = coverage.studentsWithReducedPosttest;
  const priorOnly = students.filter((student) => student.estimated.pretestBasedOnPriorOnly).map((student) => student.studentId);
  const warning = (
    active: boolean,
    code: PostInterventionWarning['code'],
    message: string,
    studentIds: readonly string[] = [],
  ): readonly PostInterventionWarning[] => (active ? [{ code, message, studentIds }] : []);

  if (students.length === 0) {
    return warning(true, 'NO_STUDENTS', 'No hay alumnos: los resultados no están definidos.');
  }
  return [
    ...warning(treatment.isEmpty, 'EMPTY_TREATMENT', 'El grupo de tratamiento está vacío: no hay diferencia en diferencias.'),
    ...warning(control.isEmpty, 'EMPTY_CONTROL', 'El grupo de control está vacío: no hay diferencia en diferencias.'),
    ...warning(
      withoutPosttest.length > 0,
      'NO_POSTTEST_QUESTIONS',
      'Hay alumnos sin preguntas nuevas: sus resultados de postest son null. Usar todo el banco en el pretest impide un postest con ítems nuevos.',
      withoutPosttest,
    ),
    ...warning(reduced.length > 0, 'REDUCED_POSTTEST', 'Hay alumnos con menos preguntas nuevas que el presupuesto.', reduced),
    ...warning(
      priorOnly.length > 0,
      'PRIOR_ONLY_PRETEST',
      'Hay alumnos sin respuestas de pretest: su estimación previa es el prior y su cambio estimado es null.',
      priorOnly,
    ),
    ...warning(
      !treatment.isEmpty && !control.isEmpty && hasUnequalCoverage(treatment, control),
      'UNEQUAL_COVERAGE',
      'Tratamiento y control tienen una cobertura de postest desigual: la comparación no es evidencia concluyente.',
    ),
  ];
}

type ReportAggregates = Pick<PostInterventionReport, 'groups' | 'differenceInDifferences' | 'coverage' | 'warnings'>;

export function aggregateReport(
  students: readonly StudentPostInterventionReport[],
  questionsById: ReadonlyMap<QuestionId, Question>,
  config: EffectivePostInterventionConfig,
): ReportAggregates {
  const of = (group: TreatmentGroup): GroupPostInterventionReport =>
    groupReport(group, students.filter((student) => student.group === group), questionsById, config);
  const groups = { treatment: of('treatment'), control: of('control') };
  const coverage = coverageOf(students, questionsById, config);
  const { treatment, control } = groups;
  const differenceInDifferences: DifferenceInDifferences = {
    observed: differenceOf(treatment.observed, control.observed),
    estimated: differenceOf(treatment.estimated, control.estimated),
    simulatedTruth: differenceOf(treatment.simulatedTruth, control.simulatedTruth),
    label: DIFFERENCE_LABEL,
  };
  return { groups, differenceInDifferences, coverage, warnings: warningsOf(students, groups, coverage) };
}
