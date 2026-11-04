import { describe, expect, it } from 'vitest';
import { BenchmarkError, computeDiagnosticMetrics } from '../../src/benchmarks/index.ts';
import type { BenchmarkErrorCode, DiagnosticMetrics, DiagnosticMetricsConfig, MetricSummary } from '../../src/benchmarks/index.ts';
import {
  InferenceError,
  KNOWLEDGE_GRAPH,
  RADAR_QUESTION_BANK,
  createInitialDiagnosticState,
  fixedQuestionOrder,
  submitAnswer,
} from '../../src/engine/index.ts';
import type { AnswerRecord, DiagnosticState } from '../../src/engine/index.ts';
import {
  SimulationError,
  createResponseUniforms,
  createSyntheticClass,
  simulateResponse,
} from '../../src/simulation/index.ts';
import type { SyntheticClass } from '../../src/simulation/index.ts';
import { deepFreeze } from '../engine/support/bank.ts';
import { ORDER, expectClose, serializedCopy } from '../engine/support/inference.ts';

type Bits = readonly (0 | 1)[];

// -ln(1e-12), redondeado: el valor máximo de la log-loss por par.
const MAX_LOG_LOSS = 27.631021115928547;

function classWith(masteries: readonly Bits[]): SyntheticClass {
  const base = createSyntheticClass(42, masteries.length, KNOWLEDGE_GRAPH);
  return { ...base, students: base.students.map((student, index) => ({ ...student, trueMastery: masteries[index] ?? [] })) };
}

// Conjunta producto con las marginales indicadas.
function stateOf(studentId: string, probabilities: readonly number[]): DiagnosticState {
  const marginals = Object.fromEntries(ORDER.map((skill, position) => [skill, probabilities[position] ?? Number.NaN]));
  return createInitialDiagnosticState(studentId, { marginals });
}

function uniform(probability: number): readonly number[] {
  return ORDER.map(() => probability);
}

function evaluate(
  probabilities: readonly (readonly number[])[],
  masteries: readonly Bits[],
  config?: DiagnosticMetricsConfig,
): DiagnosticMetrics {
  const syntheticClass = classWith(masteries);
  const states = syntheticClass.students.map((student, index) => stateOf(student.studentId, probabilities[index] ?? []));
  return computeDiagnosticMetrics(states, syntheticClass, config);
}

function record(questionId: string): AnswerRecord {
  return { questionId, answer: 'a', normalizedAnswer: 'a', isCorrect: true };
}

function expectBenchmarkError(action: () => unknown, code: BenchmarkErrorCode): void {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(BenchmarkError);
  expect(caught).toMatchObject({ name: 'BenchmarkError', code });
}

function counts(summary: MetricSummary): readonly number[] {
  const { truePositives, falsePositives, trueNegatives, falseNegatives } = summary.confusion;
  return [truePositives, falsePositives, trueNegatives, falseNegatives];
}

describe('métricas por par', () => {
  it('predicciones perfectas', () => {
    const { overall } = evaluate([[1, 1, 1, 0, 0, 0]], [[1, 1, 1, 0, 0, 0]]);

    expect(overall.mae).toBe(0);
    expect(overall.brier).toBe(0);
    // Limitadas: -ln(1 - 1e-12) ≈ 1e-12.
    expectClose(overall.logLoss ?? Number.NaN, 1e-12, 1e-14);
    expect(counts(overall)).toEqual([3, 0, 3, 0]);
    expect([overall.precision, overall.recall, overall.f1, overall.accuracy]).toEqual([1, 1, 1, 1]);
  });

  it('predicciones equivocadas', () => {
    const { overall } = evaluate([[0, 0, 0, 1, 1, 1]], [[1, 1, 1, 0, 0, 0]]);

    expect(overall.mae).toBe(1);
    expect(overall.brier).toBe(1);
    expectClose(overall.logLoss ?? Number.NaN, MAX_LOG_LOSS, 1e-9);
    expect(counts(overall)).toEqual([0, 3, 0, 3]);
    expect([overall.precision, overall.recall, overall.f1, overall.accuracy]).toEqual([0, 0, 0, 0]);
  });

  it('probabilidad 0.5: valores conocidos y sin predecir dificultad', () => {
    const { overall } = evaluate([uniform(0.5)], [[1, 1, 1, 0, 0, 0]]);

    expect(overall.mae).toBe(0.5);
    expect(overall.brier).toBe(0.25);
    expectClose(overall.logLoss ?? Number.NaN, Math.LN2);
    expect(counts(overall)).toEqual([0, 0, 3, 3]);
    expect(overall.accuracy).toBe(0.5);
  });

  it('valores intermedios calculados a mano', () => {
    // Pares: (0.8, 1), (0.3, 0), (0.6, 0), y tres (1, 1).
    const { overall } = evaluate([[0.8, 0.3, 0.6, 1, 1, 1]], [[1, 0, 0, 1, 1, 1]]);

    expectClose(overall.mae ?? Number.NaN, (0.2 + 0.3 + 0.6) / 6);
    expectClose(overall.brier ?? Number.NaN, (0.04 + 0.09 + 0.36) / 6);
    expectClose(overall.logLoss ?? Number.NaN, (-Math.log(0.8) - Math.log(0.7) - Math.log(0.4) + 3e-12) / 6, 1e-10);
    expect(counts(overall)).toEqual([1, 0, 4, 1]);
    expect(overall.precision).toBe(1);
    expect(overall.recall).toBe(0.5);
    expectClose(overall.f1 ?? Number.NaN, 2 / 3);
    expectClose(overall.accuracy ?? Number.NaN, 5 / 6);
  });

  it('Brier no se multiplica por dos', () => {
    expect(evaluate([uniform(0)], [[1, 1, 1, 1, 1, 1]]).overall.brier).toBe(1);
  });
});

describe('clipping exclusivo de log-loss', () => {
  it('limita la log-loss, pero no MAE ni Brier', () => {
    // p = 1e-13 con α = 1: se limita a 1e-12 solo en la log-loss.
    const { overall } = evaluate([uniform(1e-13)], [[1, 1, 1, 1, 1, 1]]);

    expectClose(overall.logLoss ?? Number.NaN, MAX_LOG_LOSS, 1e-9);
    expectClose(overall.mae ?? Number.NaN, 1 - 1e-13, 1e-15);
    expect(overall.mae).toBeGreaterThan(1 - 1e-12);
  });

  it('una probabilidad dentro del rango no se limita', () => {
    const { overall } = evaluate([uniform(1e-6)], [[1, 1, 1, 1, 1, 1]]);

    expectClose(overall.logLoss ?? Number.NaN, -Math.log(1e-6), 1e-9);
  });

  it('nunca es infinita', () => {
    const { overall } = evaluate([uniform(1)], [[0, 0, 0, 0, 0, 0]]);

    expect(Number.isFinite(overall.logLoss)).toBe(true);
    expectClose(overall.logLoss ?? Number.NaN, MAX_LOG_LOSS, 1e-9);
  });

  it('los dos extremos penalizan lo mismo', () => {
    const atZero = evaluate([uniform(0)], [[1, 1, 1, 1, 1, 1]]).overall.logLoss;
    const atOne = evaluate([uniform(1)], [[0, 0, 0, 0, 0, 0]]).overall.logLoss;

    expect(atZero).toBe(atOne);
  });

  it('no modifica estados ni clase', () => {
    const syntheticClass = deepFreeze(classWith([[1, 1, 1, 1, 1, 1]]));
    const state = deepFreeze(stateOf('S01', uniform(1e-13)));
    const copy = JSON.stringify(state.joint);

    computeDiagnosticMetrics([state], syntheticClass);

    expect(JSON.stringify(state.joint)).toBe(copy);
  });
});

describe('umbral', () => {
  const allDifficulty: Bits = [0, 0, 0, 0, 0, 0];

  it.each<[string, number, number, boolean]>([
    ['en el umbral', 0.5, 0.5, false],
    ['a redondeo del umbral', 0.5 - 5e-13, 0.5, false],
    ['fuera de la tolerancia', 0.5 - 2e-12, 0.5, true],
    ['por encima', 0.6, 0.5, false],
    ['con otro tau', 0.6, 0.7, true],
    ['tau 0 nunca predice', 0, 0, false],
    ['tau 1 predice por debajo de 1', 0.99, 1, true],
    ['tau 1 no predice en 1', 1, 1, false],
  ])('%s', (_, probability, tau, predicted) => {
    const { overall, config } = evaluate([uniform(probability)], [allDifficulty], { tau });

    expect(config.tau).toBe(tau);
    expect(overall.confusion.truePositives).toBe(predicted ? 6 : 0);
    expect(overall.confusion.falseNegatives).toBe(predicted ? 0 : 6);
  });

  it('usa 0.5 por defecto', () => {
    expect(evaluate([uniform(0.5)], [allDifficulty]).config).toEqual({ tau: 0.5 });
  });
});

describe('denominadores nulos', () => {
  it('sin predicciones de dificultad ni dificultades: precisión, recall y F1 null', () => {
    const { overall } = evaluate([uniform(1)], [[1, 1, 1, 1, 1, 1]]);

    expect(counts(overall)).toEqual([0, 0, 6, 0]);
    expect(overall.precision).toBeNull();
    expect(overall.recall).toBeNull();
    expect(overall.f1).toBeNull();
    expect(overall.accuracy).toBe(1);
  });

  it('precisión null con dificultades no detectadas: F1 es 0', () => {
    const { overall } = evaluate([uniform(1)], [[0, 0, 0, 0, 0, 0]]);

    expect(counts(overall)).toEqual([0, 0, 0, 6]);
    expect(overall.precision).toBeNull();
    expect(overall.recall).toBe(0);
    expect(overall.f1).toBe(0);
    expect(overall.accuracy).toBe(0);
  });

  it('recall null con falsas alarmas: F1 es 0', () => {
    const { overall } = evaluate([uniform(0)], [[1, 1, 1, 1, 1, 1]]);

    expect(counts(overall)).toEqual([0, 6, 0, 0]);
    expect(overall.precision).toBe(0);
    expect(overall.recall).toBeNull();
    expect(overall.f1).toBe(0);
  });

  it('clase vacía: recuentos 0, métricas null y nunca 0', () => {
    const syntheticClass = createSyntheticClass(1, 0, KNOWLEDGE_GRAPH);
    const metrics = computeDiagnosticMetrics([], syntheticClass);
    const { overall } = metrics;

    expect(metrics.studentCount).toBe(0);
    expect(metrics.pairCount).toBe(0);
    expect(metrics.students).toEqual([]);
    expect(counts(overall)).toEqual([0, 0, 0, 0]);
    for (const value of [overall.mae, overall.brier, overall.logLoss, overall.precision, overall.recall, overall.f1, overall.accuracy]) {
      expect(value).toBeNull();
    }
    expect(metrics.questionsUsed).toEqual({ total: 0, mean: null });
    expect(metrics.skills.map((skill) => [skill.skill, skill.pairCount, skill.mae])).toEqual(ORDER.map((skill) => [skill, 0, null]));
    expect(serializedCopy(metrics)).toEqual(metrics);
  });
});

describe('agregación', () => {
  // S1: TP 2, FP 1, TN 3 → F1 0.8. S2: FN 1, TN 5 → F1 0.
  const metrics = evaluate(
    [
      [0, 0, 0, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
    ],
    [
      [0, 0, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1],
    ],
  );

  it('F1 global sale de los recuentos, no de promediar F1', () => {
    expect(metrics.students.map((student) => student.f1)).toEqual([0.8, 0]);
    expect(counts(metrics.overall)).toEqual([2, 1, 8, 1]);
    expectClose(metrics.overall.f1 ?? Number.NaN, 2 / 3);
    expect(metrics.overall.f1).not.toBeCloseTo(0.4);
  });

  it('precisión global sale de los recuentos aunque un alumno tenga null', () => {
    expect(metrics.students.map((student) => student.precision)).toEqual([2 / 3, null]);
    expectClose(metrics.overall.precision ?? Number.NaN, 2 / 3);
  });

  it('un null individual no cuenta como 0', () => {
    const mixed = evaluate(
      [uniform(0), uniform(1)],
      [
        [0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
      ],
    );

    expect(mixed.students.map((student) => student.recall)).toEqual([1, null]);
    expect(mixed.overall.recall).toBe(1);
  });

  it('el desglose por competencia usa todos los alumnos', () => {
    const [ops, neg, fra] = metrics.skills;

    expect(ops).toMatchObject({ skill: 'OPS', pairCount: 2 });
    expect(ops === undefined ? [] : counts(ops)).toEqual([1, 0, 0, 1]);
    expect(neg === undefined ? [] : counts(neg)).toEqual([1, 0, 1, 0]);
    expect(fra === undefined ? [] : counts(fra)).toEqual([0, 1, 1, 0]);
  });

  describe('con una clase simulada', () => {
    const syntheticClass = createSyntheticClass(5, 12, KNOWLEDGE_GRAPH);
    const questionIds = fixedQuestionOrder(RADAR_QUESTION_BANK, KNOWLEDGE_GRAPH).slice(0, 9);
    const uniforms = createResponseUniforms(5, syntheticClass.students.map((student) => student.studentId), questionIds, 'pretest');
    const states = syntheticClass.students.map(({ studentId }) =>
      questionIds.reduce((state, id) => {
        const question = RADAR_QUESTION_BANK.questions.find((item) => item.id === id);
        if (question === undefined) throw new Error(`Falta ${id}`);
        const result = submitAnswer(state, id, simulateResponse(syntheticClass, studentId, question, uniforms), RADAR_QUESTION_BANK);
        if (!result.ok) throw new Error(result.error.message);
        return result.value;
      }, createInitialDiagnosticState(studentId)),
    );
    const real = computeDiagnosticMetrics(states, syntheticClass);

    it('los desgloses coinciden con los totales', () => {
      for (const breakdown of [real.students, real.skills]) {
        const summed = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

        expect(summed(breakdown.map((item) => item.pairCount))).toBe(real.pairCount);
        ([0, 1, 2, 3] as const).forEach((position) => {
          expect(summed(breakdown.map((item) => counts(item)[position] ?? Number.NaN))).toBe(counts(real.overall)[position]);
        });
        for (const metric of ['mae', 'brier', 'logLoss'] as const) {
          const weighted = summed(breakdown.map((item) => (item[metric] ?? Number.NaN) * item.pairCount)) / real.pairCount;
          expectClose(weighted, real.overall[metric] ?? Number.NaN);
        }
      }
    });

    it('cuenta pares y preguntas', () => {
      expect(real.studentCount).toBe(12);
      expect(real.pairCount).toBe(72);
      expect(real.questionsUsed).toEqual({ total: 108, mean: 9 });
      expect(real.students.every((student) => student.questionsUsed === 9)).toBe(true);
    });

    it('es reproducible', () => {
      expect(JSON.stringify(computeDiagnosticMetrics(states, syntheticClass))).toBe(JSON.stringify(real));
    });

    it('no depende del orden de entrada', () => {
      const reversedClass = { ...syntheticClass, students: [...syntheticClass.students].reverse() };

      expect(computeDiagnosticMetrics([...states].reverse(), reversedClass)).toEqual(real);
    });

    it('se serializa sin perder nada', () => {
      expect(serializedCopy(real)).toEqual(real);
    });
  });

  it('cuenta las preguntas de cada alumno', () => {
    const syntheticClass = classWith([
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
    ]);
    const states = [
      { ...stateOf('S01', uniform(0.5)), responses: [record('Q1'), record('Q2'), record('Q3')] },
      stateOf('S02', uniform(0.5)),
    ];
    const metrics2 = computeDiagnosticMetrics(states, syntheticClass);

    expect(metrics2.students.map((student) => student.questionsUsed)).toEqual([3, 0]);
    expect(metrics2.questionsUsed).toEqual({ total: 3, mean: 1.5 });
  });

  it('usa marginales normalizadas', () => {
    const syntheticClass = classWith([[1, 1, 1, 1, 1, 1]]);
    const state = stateOf('S01', uniform(0.5));
    const scaled = { ...state, joint: state.joint.map((mass) => mass * (1 + 5e-10)) };

    expect(computeDiagnosticMetrics([scaled], syntheticClass).overall.mae).toBeCloseTo(0.5, 14);
  });
});

describe('salida', () => {
  it('declara definiciones y advertencia sobre datos sintéticos', () => {
    const { definitions, disclaimer } = evaluate([uniform(0.5)], [[1, 1, 1, 1, 1, 1]]);

    expect(definitions.brier).toContain('sin multiplicar por dos');
    expect(definitions.logLoss).toContain('nats');
    expect(definitions.difficulty).toContain('α = 0');
    expect(definitions.aggregation).toContain('F1');
    expect(disclaimer).toContain('datos sintéticos');
    expect(disclaimer).toContain('no la calidad del diagnóstico con alumnos reales');
  });
});

describe('validación', () => {
  const syntheticClass = classWith([
    [1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0],
  ]);
  const first = stateOf('S01', uniform(0.5));
  const second = stateOf('S02', uniform(0.5));

  it.each<[string, unknown]>([
    ['que no son una lista', 'x'],
    ['con un alumno de menos', [first]],
    ['con un alumno de más', [first, second, stateOf('S03', uniform(0.5))]],
    ['con un alumno ajeno', [first, stateOf('S99', uniform(0.5))]],
    ['con un alumno repetido', [first, first]],
  ])('rechaza estados %s', (_, states) => {
    expectBenchmarkError(() => computeDiagnosticMetrics(states as readonly DiagnosticState[], syntheticClass), 'INCONSISTENT_STUDENTS');
  });

  it.each<[string, unknown, string]>([
    ['nulo', null, 'INVALID_STATE'],
    ['con otro orden de competencias', { ...second, skillOrder: [...ORDER].reverse() }, 'INVALID_STATE'],
    ['con una conjunta que no suma 1', { ...second, joint: second.joint.map((mass) => mass * 2) }, 'INVALID_DISTRIBUTION'],
    ['con una conjunta corta', { ...second, joint: [1] }, 'INVALID_DISTRIBUTION'],
    ['con masa negativa', { ...second, joint: second.joint.map((mass, index) => (index === 0 ? -mass : mass)) }, 'INVALID_DISTRIBUTION'],
    ['con un historial mal formado', { ...second, responses: [null] }, 'INVALID_HISTORY'],
  ])('rechaza un estado %s', (_, state, code) => {
    let caught: unknown;
    try {
      computeDiagnosticMetrics([first, state as DiagnosticState], syntheticClass);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(InferenceError);
    expect(caught).toMatchObject({ code });
  });

  it.each<[string, unknown]>([
    ['nula', null],
    ['con otro orden de competencias', { ...syntheticClass, skillOrder: [...ORDER].reverse() }],
    ['con α no binaria', { ...syntheticClass, students: syntheticClass.students.map((student) => ({ ...student, trueMastery: [2, 0, 0, 0, 0, 0] })) }],
    ['con α corta', { ...syntheticClass, students: syntheticClass.students.map((student) => ({ ...student, trueMastery: [1] })) }],
    ['con studentCount incoherente', { ...syntheticClass, studentCount: 9 }],
  ])('rechaza una clase %s', (_, value) => {
    let caught: unknown;
    try {
      computeDiagnosticMetrics([first, second], value as SyntheticClass);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(SimulationError);
    expect(caught).toMatchObject({ code: 'INVALID_SYNTHETIC_CLASS' });
  });

  it.each<[string, unknown]>([
    ['nula', null],
    ['que no es un objeto', 1],
    ['con tau negativo', { tau: -0.1 }],
    ['con tau mayor que 1', { tau: 1.1 }],
    ['con tau NaN', { tau: Number.NaN }],
    ['con tau infinito', { tau: Number.POSITIVE_INFINITY }],
    ['con tau nulo', { tau: null }],
    ['con tau de texto', { tau: '0.5' }],
  ])('rechaza una configuración %s', (_, config) => {
    expectBenchmarkError(() => computeDiagnosticMetrics([first, second], syntheticClass, config as DiagnosticMetricsConfig), 'INVALID_METRICS_CONFIG');
  });
});
