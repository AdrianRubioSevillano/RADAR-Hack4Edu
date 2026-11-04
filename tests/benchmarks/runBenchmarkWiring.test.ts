import { afterEach, describe, expect, it, vi } from 'vitest';
import { runBenchmark } from '../../src/benchmarks/index.ts';
import * as methods from '../../src/benchmarks/methods.ts';
import { RADAR_QUESTION_BANK } from '../../src/engine/index.ts';

vi.mock('../../src/benchmarks/methods.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/benchmarks/methods.ts')>();
  return { ...actual, runDiagnosticMethod: vi.fn(actual.runDiagnosticMethod) };
});

const CONFIG = { seedCount: 2, studentCount: 3, resamples: 10, budgets: [4, 'all'] } as const;

function callsIn(scenario: 'wellSpecified' | 'misspecified' | 'homogeneous') {
  vi.mocked(methods.runDiagnosticMethod).mockClear();
  runBenchmark({ ...CONFIG, scenarios: [scenario] });
  return vi.mocked(methods.runDiagnosticMethod).mock.calls.map(([input]) => input);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('coordinación de una réplica', () => {
  it('los métodos comparten una sola clase y una sola tabla por réplica', () => {
    const calls = callsIn('wellSpecified');
    const [a, b, c, nextA] = calls;

    expect(calls.map((input) => input.method)).toEqual(['A', 'B', 'C', 'A', 'B', 'C']);
    expect(b?.syntheticClass).toBe(a?.syntheticClass);
    expect(c?.syntheticClass).toBe(a?.syntheticClass);
    expect(b?.uniforms).toBe(a?.uniforms);
    expect(c?.uniforms).toBe(a?.uniforms);
    expect(nextA?.syntheticClass).not.toBe(a?.syntheticClass);
  });

  it('banco, prior, presupuestos y orden aleatorio son idénticos entre métodos', () => {
    const [a, b, c] = callsIn('wellSpecified');

    for (const other of [b, c]) {
      expect(other?.questionBank).toBe(RADAR_QUESTION_BANK);
      expect(other?.priorConfig).toEqual(a?.priorConfig);
      expect(other?.budgets).toEqual(a?.budgets);
      expect(other?.randomOrderSeed).toBe(a?.randomOrderSeed);
    }
  });

  it('la tabla es pretest, con la semilla de la réplica y todas las preguntas', () => {
    const [a] = callsIn('wellSpecified');

    expect(a?.uniforms.occasion).toBe('pretest');
    expect(a?.uniforms.seed).toBe(a?.syntheticClass.seed);
    expect(a?.uniforms.questionIds).toHaveLength(30);
    expect(a?.uniforms.studentIds).toHaveLength(3);
  });

  it('bien especificado: sin parámetros reales', () => {
    for (const input of callsIn('wellSpecified')) {
      expect(input).not.toHaveProperty('realParametersByQuestion');
    }
  });

  it('mala especificación: misma clase, parámetros reales para el respondedor y banco intacto', () => {
    const well = callsIn('wellSpecified');
    const wrong = callsIn('misspecified');

    wrong.forEach((input, index) => {
      expect(input.syntheticClass).toEqual(well[index]?.syntheticClass);
      expect(input.uniforms).toEqual(well[index]?.uniforms);
      expect(input.questionBank).toBe(RADAR_QUESTION_BANK);
      expect(Object.values(input.realParametersByQuestion ?? {})).toHaveLength(30);
      expect(new Set(Object.values(input.realParametersByQuestion ?? {}).map((item) => `${item.slip}/${item.guess}`))).toEqual(
        new Set(['0.25/0.2']),
      );
    });
    expect(RADAR_QUESTION_BANK.questions.some((question) => question.slip === 0.25 && question.guess === 0.2)).toBe(false);
  });

  it('homogénea: un único grupo, sin parámetros reales', () => {
    const [a] = callsIn('homogeneous');

    expect(new Set(a?.syntheticClass.students.map((student) => student.groupId))).toEqual(new Set(['homogeneous']));
    expect(a?.syntheticClass.config.groups).toHaveLength(1);
    expect(a?.syntheticClass.config.prerequisiteFactor).toBe(0.5);
    expect(a).not.toHaveProperty('realParametersByQuestion');
  });

  it('no compara métodos cuya respuesta dependa del método', () => {
    const [a, b] = callsIn('wellSpecified');

    expect(JSON.stringify(a?.uniforms)).toBe(JSON.stringify(b?.uniforms));
    expect(JSON.stringify(a?.uniforms)).not.toMatch(/"method"/);
  });
});
