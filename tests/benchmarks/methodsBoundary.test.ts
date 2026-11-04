import { afterEach, describe, expect, it, vi } from 'vitest';
import { BenchmarkError, runDiagnosticMethod } from '../../src/benchmarks/index.ts';
import type { DiagnosticMethod, DiagnosticMethodInput } from '../../src/benchmarks/index.ts';
import * as engine from '../../src/engine/index.ts';
import { KNOWLEDGE_GRAPH, RADAR_QUESTION_BANK } from '../../src/engine/index.ts';
import { createResponseUniforms, createSyntheticClass } from '../../src/simulation/index.ts';

vi.mock('../../src/engine/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/engine/index.ts')>();
  return {
    ...actual,
    createInitialDiagnosticState: vi.fn(actual.createInitialDiagnosticState),
    selectNextQuestion: vi.fn(actual.selectNextQuestion),
    submitAnswer: vi.fn(actual.submitAnswer),
  };
});

function inputOf(method: DiagnosticMethod): DiagnosticMethodInput {
  const syntheticClass = createSyntheticClass(42, 4, KNOWLEDGE_GRAPH);
  return {
    method,
    syntheticClass,
    questionBank: RADAR_QUESTION_BANK,
    knowledgeGraph: KNOWLEDGE_GRAPH,
    priorConfig: {},
    uniforms: createResponseUniforms(
      42,
      syntheticClass.students.map((student) => student.studentId),
      RADAR_QUESTION_BANK.questions.map((question) => question.id),
      'pretest',
    ),
    budgets: [3],
    randomOrderSeed: 9,
    realParametersByQuestion: { [RADAR_QUESTION_BANK.questions[0]?.id ?? '']: { slip: 0.123456, guess: 0.0123456 } },
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('frontera entre verdad simulada y diagnóstico', () => {
  it.each<DiagnosticMethod>(['A', 'B', 'C'])('%s: las llamadas diagnósticas solo reciben datos observables', (method) => {
    runDiagnosticMethod(inputOf(method));

    const initial = vi.mocked(engine.createInitialDiagnosticState).mock.calls;
    const answers = vi.mocked(engine.submitAnswer).mock.calls;
    const selections = vi.mocked(engine.selectNextQuestion).mock.calls;
    expect(initial.length).toBeGreaterThan(0);
    expect(answers).toHaveLength(4 * 3);
    expect(selections).toHaveLength(method === 'B' ? 4 * 3 : 0);

    // El banco es un argumento legítimo: lo que importa es lo que lo acompaña.
    const visible = JSON.stringify([
      initial,
      answers.map(([state, questionId, answer]) => [state, questionId, answer]),
      selections.map(([state]) => state),
    ]);
    for (const hidden of ['trueMastery', 'groupId', 'correctness', 'distractor', 'displayName', 'realParameters', '0.123456']) {
      expect(visible).not.toContain(hidden);
    }
    for (const [, questionId, answer] of answers) {
      expect(questionId).toBeTypeOf('string');
      expect(answer).toBeTypeOf('string');
    }
  });

  it('B selecciona sobre el estado actualizado', () => {
    runDiagnosticMethod(inputOf('B'));

    const sizes = vi.mocked(engine.selectNextQuestion).mock.calls.map(([state]) => state.responses.length);
    expect(sizes.slice(0, 3)).toEqual([0, 1, 2]);
  });

  it('un rechazo de submitAnswer se propaga, sin resultados de reserva', () => {
    vi.mocked(engine.submitAnswer).mockReturnValueOnce({
      ok: false,
      error: { code: 'INFERENCE_FAILED', message: 'fallo', questionId: 'Q', causeCode: null },
    });

    let caught: unknown;
    try {
      runDiagnosticMethod(inputOf('A'));
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(BenchmarkError);
    expect(caught).toMatchObject({ code: 'ANSWER_REJECTED' });
  });
});
