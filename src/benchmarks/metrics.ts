import { assertValidStateStructure } from '../engine/answers.ts';
import { SKILL_ORDER, marginals } from '../engine/index.ts';
import type { DiagnosticState, SkillId } from '../engine/index.ts';
import { isBelowThreshold } from '../engine/thresholds.ts';
import type { SyntheticClass, SyntheticStudent } from '../simulation/index.ts';
import { assertValidClass } from '../simulation/syntheticClass.ts';
import type {
  BenchmarkErrorCode,
  DiagnosticMetrics,
  DiagnosticMetricsConfig,
  DifficultyConfusion,
  EffectiveDiagnosticMetricsConfig,
  MetricDefinitions,
  MetricSummary,
} from './types.ts';

export class BenchmarkError extends Error {
  readonly code: BenchmarkErrorCode;

  constructor(code: BenchmarkErrorCode, message: string) {
    super(message);
    this.name = 'BenchmarkError';
    this.code = code;
  }
}

const DEFAULT_TAU = 0.5;

// ε_clip: SUPUESTO, exclusivo de log-loss (§2.9). Nunca se aplica al posterior.
const LOG_LOSS_CLIP = 1e-12;

const DEFINITIONS: MetricDefinitions = {
  mae: 'Media de |p - α| sobre los pares alumno-competencia.',
  brier: 'Media de (p - α)^2, en su forma binaria: sin multiplicar por dos.',
  logLoss: 'Media de -[α·ln(p\') + (1-α)·ln(1-p\')], en nats, con p\' limitado a [1e-12, 1-1e-12] solo en esta métrica.',
  difficulty: 'Clase positiva: α = 0. Se predice dificultad si p < τ, con la tolerancia de clasificación de 1e-12.',
  aggregation: 'Cada agregado sale de sus pares y recuentos: F1 no es la media de los F1 individuales.',
};

const DISCLAIMER =
  'Métricas frente a un estado real simulado, con datos sintéticos y parámetros no calibrados: ' +
  'miden la recuperación de ese estado en esta simulación, no la calidad del diagnóstico con alumnos reales.';

function effectiveConfig(config: DiagnosticMetricsConfig): EffectiveDiagnosticMetricsConfig {
  if (typeof config !== 'object' || config === null) {
    throw new BenchmarkError('INVALID_METRICS_CONFIG', 'La configuración no tiene la forma esperada');
  }
  const { tau = DEFAULT_TAU } = config;
  if (typeof tau !== 'number' || !Number.isFinite(tau) || tau < 0 || tau > 1) {
    throw new BenchmarkError('INVALID_METRICS_CONFIG', 'tau debe ser finito en [0, 1]');
  }
  return { tau };
}

function compareText(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

// Correspondencia exacta: cada alumno de la clase tiene un único estado.
function matchedStates(states: readonly DiagnosticState[], syntheticClass: SyntheticClass): readonly DiagnosticState[] {
  if (!Array.isArray(states)) {
    throw new BenchmarkError('INCONSISTENT_STUDENTS', 'states debe ser una lista');
  }
  const ids = new Set<string>();
  for (const state of states as readonly DiagnosticState[]) {
    assertValidStateStructure(state);
    if (ids.has(state.studentId)) {
      throw new BenchmarkError('INCONSISTENT_STUDENTS', `Estado repetido: ${state.studentId}`);
    }
    ids.add(state.studentId);
  }
  const { students } = syntheticClass;
  if (ids.size !== students.length || !students.every((student) => ids.has(student.studentId))) {
    throw new BenchmarkError('INCONSISTENT_STUDENTS', 'Los estados no corresponden exactamente a los alumnos de la clase');
  }
  return [...states].sort((a, b) => compareText(a.studentId, b.studentId));
}

interface Pair {
  readonly studentId: string;
  readonly skill: SkillId;
  readonly absoluteError: number;
  readonly squaredError: number;
  readonly logLoss: number;
  readonly isDifficulty: boolean;
  readonly predictsDifficulty: boolean;
}

function clipped(probability: number): number {
  return Math.min(1 - LOG_LOSS_CLIP, Math.max(LOG_LOSS_CLIP, probability));
}

// 1 - p' se obtiene limitando 1 - p: es lo mismo, pero 1 - (1 - 1e-12) perdería
// precisión y los dos extremos no penalizarían igual.
function logLossOf(probability: number, alpha: number): number {
  return -(alpha * Math.log(clipped(probability)) + (1 - alpha) * Math.log(clipped(1 - probability)));
}

// La verdad se usa aquí, tras obtener la estimación: marginals solo recibe la conjunta.
function pairsOf(state: DiagnosticState, student: SyntheticStudent, tau: number): readonly Pair[] {
  const mastery = marginals(state.joint);
  return SKILL_ORDER.map((skill, position) => {
    const probability = mastery[skill] ?? Number.NaN;
    const alpha = student.trueMastery[position] ?? Number.NaN;
    const error = probability - alpha;
    return {
      studentId: state.studentId,
      skill,
      absoluteError: Math.abs(error),
      squaredError: error * error,
      logLoss: logLossOf(probability, alpha),
      isDifficulty: alpha === 0,
      predictsDifficulty: isBelowThreshold(probability, tau),
    };
  });
}

function meanOf(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function confusionOf(pairs: readonly Pair[]): DifficultyConfusion {
  const count = (isDifficulty: boolean, predictsDifficulty: boolean): number =>
    pairs.filter((pair) => pair.isDifficulty === isDifficulty && pair.predictsDifficulty === predictsDifficulty).length;
  return {
    truePositives: count(true, true),
    falsePositives: count(false, true),
    trueNegatives: count(false, false),
    falseNegatives: count(true, false),
  };
}

function summaryOf(pairs: readonly Pair[]): MetricSummary {
  const confusion = confusionOf(pairs);
  const { truePositives: tp, falsePositives: fp, trueNegatives: tn, falseNegatives: fn } = confusion;
  return {
    pairCount: pairs.length,
    mae: meanOf(pairs.map((pair) => pair.absoluteError)),
    brier: meanOf(pairs.map((pair) => pair.squaredError)),
    logLoss: meanOf(pairs.map((pair) => pair.logLoss)),
    confusion,
    precision: ratio(tp, tp + fp),
    recall: ratio(tp, tp + fn),
    f1: ratio(2 * tp, 2 * tp + fp + fn),
    accuracy: ratio(tp + tn, pairs.length),
  };
}

export function computeDiagnosticMetrics(
  states: readonly DiagnosticState[],
  syntheticClass: SyntheticClass,
  config: DiagnosticMetricsConfig = {},
): DiagnosticMetrics {
  const effective = effectiveConfig(config);
  assertValidClass(syntheticClass);
  const sorted = matchedStates(states, syntheticClass);

  const truth = new Map(syntheticClass.students.map((student) => [student.studentId, student]));
  const pairs = sorted.flatMap((state) => {
    const student = truth.get(state.studentId);
    return student === undefined ? [] : pairsOf(state, student, effective.tau);
  });
  const questions = sorted.map((state) => state.responses.length);

  return {
    config: effective,
    studentCount: sorted.length,
    pairCount: pairs.length,
    overall: summaryOf(pairs),
    students: sorted.map((state) => ({
      studentId: state.studentId,
      questionsUsed: state.responses.length,
      ...summaryOf(pairs.filter((pair) => pair.studentId === state.studentId)),
    })),
    skills: SKILL_ORDER.map((skill) => ({ skill, ...summaryOf(pairs.filter((pair) => pair.skill === skill)) })),
    questionsUsed: { total: questions.reduce((sum, count) => sum + count, 0), mean: meanOf(questions) },
    definitions: { ...DEFINITIONS },
    disclaimer: DISCLAIMER,
  };
}
