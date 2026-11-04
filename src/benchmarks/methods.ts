import { assertValidBank } from '../engine/answers.ts';
import { assertInferenceGraph } from '../engine/bayes.ts';
import {
  SKILL_ORDER,
  correctProbability,
  createInitialDiagnosticState,
  fixedQuestionOrder,
  requiredSkills,
  selectNextQuestion,
  submitAnswer,
} from '../engine/index.ts';
import type { DiagnosticState, Question, QuestionBank, QuestionId } from '../engine/index.ts';
import { GENERATOR, STREAMS, createStream, simulateResponse } from '../simulation/index.ts';
import type { RealItemParameters, ResponseUniformTable, SyntheticClass, UniformStream } from '../simulation/index.ts';
import { assertValidClass } from '../simulation/syntheticClass.ts';
import { BenchmarkError, computeDiagnosticMetrics, effectiveMetricsConfig } from './metrics.ts';
import { isUint32 } from './stats.ts';
import type {
  DiagnosticMethod,
  DiagnosticMethodInput,
  DiagnosticMethodRun,
  DiagnosticMethodTiming,
  MethodBudgetResult,
  MethodStep,
  QuestionBudget,
} from './types.ts';

const PRETEST_OCCASION = 'pretest';

const TIMING_DEFINITION =
  'preparationMs: fixedQuestionOrder (A) y las permutaciones (C); 0 en B. ' +
  'selectionMs: obtener cada pregunta: selectNextQuestion en B, leer el orden en A y C. ' +
  'No incluye simular respuestas, registrarlas ni calcular métricas.';

const TIMING_DISCLAIMER =
  'Tiempos de una ejecución en esta máquina, variables entre ejecuciones: no son una comparación definitiva de rendimiento.';

function inputError(message: string): BenchmarkError {
  return new BenchmarkError('INVALID_METHOD_INPUT', message);
}

function isMethod(value: unknown): value is DiagnosticMethod {
  return value === 'A' || value === 'B' || value === 'C';
}

// Orden canónico: números ascendentes y después 'all'.
function canonicalBudgets(budgets: readonly QuestionBudget[]): readonly QuestionBudget[] {
  if (!Array.isArray(budgets) || budgets.length === 0) {
    throw inputError('budgets debe ser una lista no vacía');
  }
  if (!budgets.every((budget: unknown) => budget === 'all' || (Number.isSafeInteger(budget) && (budget as number) > 0))) {
    throw inputError('Cada presupuesto debe ser un entero positivo o "all"');
  }
  if (new Set(budgets).size !== budgets.length) {
    throw inputError('Los presupuestos no pueden repetirse');
  }
  const numeric = budgets.filter((budget) => budget !== 'all').sort((a, b) => a - b);
  return budgets.includes('all') ? [...numeric, 'all'] : numeric;
}

function effectiveBudget(budget: QuestionBudget, bankSize: number): number {
  return budget === 'all' ? bankSize : Math.min(budget, bankSize);
}

function tableError(message: string): BenchmarkError {
  return new BenchmarkError('INVALID_RESPONSE_TABLE', message);
}

// La forma detallada y los uniformes los valida simulateResponse en cada consulta.
function assertCompatibleTable(table: ResponseUniformTable, syntheticClass: SyntheticClass, bank: QuestionBank): void {
  if (typeof table !== 'object' || table === null || !Array.isArray(table.studentIds) || !Array.isArray(table.questionIds)) {
    throw tableError('La tabla de uniformes no tiene la forma esperada');
  }
  if (table.occasion !== PRETEST_OCCASION) {
    throw tableError(`La tabla debe ser de la ocasión ${PRETEST_OCCASION}`);
  }
  if (table.seed !== syntheticClass.seed) {
    throw tableError('La tabla y la clase tienen semillas distintas');
  }
  if (!syntheticClass.students.every((student) => table.studentIds.includes(student.studentId))) {
    throw tableError('La tabla no cubre a todos los alumnos');
  }
  if (!bank.questions.every((question) => table.questionIds.includes(question.id))) {
    throw tableError('La tabla no cubre todas las preguntas');
  }
}

function realParametersError(message: string): BenchmarkError {
  return new BenchmarkError('INVALID_REAL_PARAMETERS', message);
}

// correctProbability aplica la restricción DINA; el resultado no se usa.
function effectiveRealParameters(
  given: DiagnosticMethodInput['realParametersByQuestion'],
  bank: QuestionBank,
): Readonly<Record<QuestionId, RealItemParameters>> {
  if (given === undefined) {
    return {};
  }
  if (typeof given !== 'object' || given === null || Array.isArray(given)) {
    throw realParametersError('realParametersByQuestion debe asociar ids y parámetros');
  }
  const unknownId = Object.keys(given).find((id) => !bank.questions.some((question) => question.id === id));
  if (unknownId !== undefined) {
    throw realParametersError(`Pregunta desconocida en los parámetros reales: ${unknownId}`);
  }
  const noMastery = SKILL_ORDER.map(() => 0 as const);
  return Object.fromEntries(
    bank.questions.flatMap((question) => {
      if (!Object.hasOwn(given, question.id)) {
        return [];
      }
      const parameters = given[question.id];
      if (typeof parameters !== 'object' || parameters === null) {
        throw realParametersError(`Parámetros reales inválidos en ${question.id}`);
      }
      const { slip, guess } = parameters;
      correctProbability(noMastery, requiredSkills(question), slip, guess);
      return [[question.id, { slip, guess }]];
    }),
  );
}

// Fisher–Yates sobre los ids ordenados: la permutación completa no depende del
// presupuesto ni de los resultados.
function randomOrderOf(studentId: string, questionIds: readonly QuestionId[], seed: number): readonly QuestionId[] {
  const stream: UniformStream = createStream(seed, `${STREAMS.randomOrder}/${JSON.stringify([studentId])}`);
  const order = [...questionIds].sort();
  for (let last = order.length - 1; last > 0; last -= 1) {
    const chosen = Math.min(Math.floor(stream() * (last + 1)), last);
    const held = order[last] as QuestionId;
    order[last] = order[chosen] as QuestionId;
    order[chosen] = held;
  }
  return order;
}

interface Timer {
  preparing<T>(action: () => T): T;
  selecting<T>(action: () => T): T;
  report(): DiagnosticMethodTiming | null;
}

function createTimer(enabled: boolean): Timer {
  let preparationMs = 0;
  let selectionMs = 0;
  let selectionCount = 0;

  const elapsed = <T>(action: () => T, add: (milliseconds: number) => void): T => {
    if (!enabled) {
      return action();
    }
    const start = performance.now();
    const value = action();
    add(performance.now() - start);
    return value;
  };

  return {
    preparing: (action) =>
      elapsed(action, (milliseconds) => {
        preparationMs += milliseconds;
      }),
    selecting: (action) =>
      elapsed(action, (milliseconds) => {
        selectionMs += milliseconds;
        selectionCount += 1;
      }),
    report: () =>
      enabled
        ? {
            preparationMs,
            selectionMs,
            selectionCount,
            meanSelectionMs: selectionCount === 0 ? null : selectionMs / selectionCount,
            definition: TIMING_DEFINITION,
            disclaimer: TIMING_DISCLAIMER,
          }
        : null,
  };
}

type NextQuestion = (state: DiagnosticState, step: number) => Question | undefined;

function fromOrder(order: readonly QuestionId[], questionsById: ReadonlyMap<QuestionId, Question>): NextQuestion {
  return (_state, step) => questionsById.get(order[step] ?? '');
}

interface Trajectory {
  readonly studentId: string;
  // history[k]: estado tras k preguntas.
  readonly history: readonly DiagnosticState[];
  readonly steps: readonly MethodStep[];
}

interface Execution {
  readonly input: DiagnosticMethodInput;
  readonly real: Readonly<Record<QuestionId, RealItemParameters>>;
  readonly stepCount: number;
  readonly timer: Timer;
}

// Una sola trayectoria por alumno. El diagnóstico y la selección solo ven el estado
// observable; clase, uniformes y parámetros reales se quedan en el respondedor.
function trajectoryOf(studentId: string, next: NextQuestion, execution: Execution): Trajectory {
  const { input, real, stepCount, timer } = execution;
  const { syntheticClass, questionBank, knowledgeGraph, priorConfig, uniforms } = input;
  let state = createInitialDiagnosticState(studentId, priorConfig, knowledgeGraph);
  const history = [state];
  const steps: MethodStep[] = [];

  for (let step = 0; step < stepCount; step += 1) {
    const current = state;
    const question = timer.selecting(() => next(current, step));
    if (question === undefined) {
      throw new BenchmarkError('SELECTION_FAILED', `${studentId}: no hay pregunta para el paso ${step}`);
    }
    const parameters = Object.hasOwn(real, question.id) ? real[question.id] : undefined;
    const answer = simulateResponse(syntheticClass, studentId, question, uniforms, parameters);
    const result = submitAnswer(current, question.id, answer, questionBank);
    if (!result.ok) {
      throw new BenchmarkError('ANSWER_REJECTED', `${studentId}, ${question.id}: ${result.error.message}`);
    }
    state = result.value;
    history.push(state);
    const isCorrect = state.responses.at(-1)?.isCorrect ?? false;
    steps.push({ questionId: question.id, answer, isCorrect });
  }
  return { studentId, history, steps };
}

function selectorsFor(
  input: DiagnosticMethodInput,
  studentIds: readonly string[],
  timer: Timer,
): (studentId: string) => NextQuestion {
  const { method, questionBank, knowledgeGraph, randomOrderSeed } = input;
  const questionsById = new Map(questionBank.questions.map((question) => [question.id, question]));

  if (method === 'A') {
    const order = timer.preparing(() => fixedQuestionOrder(questionBank, knowledgeGraph));
    return () => fromOrder(order, questionsById);
  }
  if (method === 'B') {
    const adaptive: NextQuestion = (state) => selectNextQuestion(state, questionBank)?.question;
    return () => adaptive;
  }
  const ids = questionBank.questions.map((question) => question.id);
  const orders = new Map(
    studentIds.map((studentId) => [studentId, timer.preparing(() => randomOrderOf(studentId, ids, randomOrderSeed))]),
  );
  return (studentId) => fromOrder(orders.get(studentId) ?? [], questionsById);
}

function compareText(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

export function runDiagnosticMethod(input: DiagnosticMethodInput): DiagnosticMethodRun {
  if (typeof input !== 'object' || input === null) {
    throw inputError('La entrada no tiene la forma esperada');
  }
  const { method, syntheticClass, questionBank, knowledgeGraph, priorConfig, uniforms, randomOrderSeed } = input;
  const { measureTiming = false, metricsConfig = {} } = input;
  if (!isMethod(method)) {
    throw inputError('method debe ser A, B o C');
  }
  if (typeof priorConfig !== 'object' || priorConfig === null) {
    throw inputError('priorConfig es obligatorio');
  }
  if (!isUint32(randomOrderSeed)) {
    throw inputError('randomOrderSeed debe ser un entero uint32');
  }
  if (typeof measureTiming !== 'boolean') {
    throw inputError('measureTiming debe ser un booleano');
  }
  assertValidClass(syntheticClass);
  assertInferenceGraph(knowledgeGraph);
  assertValidBank(questionBank);
  const budgets = canonicalBudgets(input.budgets);
  assertCompatibleTable(uniforms, syntheticClass, questionBank);
  const real = effectiveRealParameters(input.realParametersByQuestion, questionBank);
  const effectiveMetrics = effectiveMetricsConfig(metricsConfig);
  const prior = createInitialDiagnosticState('prior', priorConfig, knowledgeGraph).priorConfig;

  const bankSize = questionBank.questions.length;
  const stepCount = Math.max(...budgets.map((budget) => effectiveBudget(budget, bankSize)));
  const studentIds = syntheticClass.students.map((student) => student.studentId).sort(compareText);
  const timer = createTimer(measureTiming);
  const selectorOf = selectorsFor(input, studentIds, timer);
  const execution: Execution = { input, real, stepCount, timer };
  const trajectories = studentIds.map((studentId) => trajectoryOf(studentId, selectorOf(studentId), execution));

  const budgetResults: readonly MethodBudgetResult[] = budgets.map((requestedBudget) => {
    const effective = effectiveBudget(requestedBudget, bankSize);
    const states = trajectories.flatMap((trajectory) => trajectory.history[effective] ?? []);
    return {
      requestedBudget,
      effectiveBudget: effective,
      states,
      metrics: computeDiagnosticMetrics(states, syntheticClass, effectiveMetrics),
    };
  });

  return {
    results: {
      method,
      config: {
        budgets,
        randomOrderSeed: randomOrderSeed >>> 0,
        populationSeed: syntheticClass.seed,
        occasion: PRETEST_OCCASION,
        generator: { ...GENERATOR },
        bankSize,
        priorConfig: prior,
        metricsConfig: effectiveMetrics,
        realParametersByQuestion: real,
      },
      students: trajectories.map(({ studentId, steps }) => ({ studentId, steps })),
      budgets: budgetResults,
    },
    timing: timer.report(),
  };
}
