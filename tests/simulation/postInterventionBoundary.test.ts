import { describe, expect, it, vi } from 'vitest';
import * as engine from '../../src/engine/index.ts';
import { KNOWLEDGE_GRAPH, RADAR_QUESTION_BANK } from '../../src/engine/index.ts';
import { createSyntheticClass, simulatePostIntervention } from '../../src/simulation/index.ts';

vi.mock('../../src/engine/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/engine/index.ts')>();
  return {
    ...actual,
    createInitialDiagnosticState: vi.fn(actual.createInitialDiagnosticState),
    submitAnswer: vi.fn(actual.submitAnswer),
  };
});

describe('frontera entre verdad simulada y diagnóstico', () => {
  it('las llamadas diagnósticas reciben solo id, prior y respuestas observables', () => {
    const classState = createSyntheticClass(42, 6, KNOWLEDGE_GRAPH);
    const pretestStates = classState.students.map((student) => engine.createInitialDiagnosticState(student.studentId));
    vi.mocked(engine.createInitialDiagnosticState).mockClear();
    vi.mocked(engine.submitAnswer).mockClear();

    simulatePostIntervention({
      classState,
      intervention: {
        interventions: [{ id: 'reinforce-OPS', skill: 'OPS', title: 'Reforzar OPS', durationMinutes: 15 }],
        totalMinutes: 15,
        coverage: 0,
        benefit: 0,
        cost: 0,
        netValue: 0,
      },
      seed: 7,
      pretestStates,
      questionBank: RADAR_QUESTION_BANK,
      knowledgeGraph: KNOWLEDGE_GRAPH,
      priorConfig: {},
      config: { questionBudgetPerStudent: 3, controlFraction: 0.5 },
    });

    const initial = vi.mocked(engine.createInitialDiagnosticState).mock.calls;
    const answers = vi.mocked(engine.submitAnswer).mock.calls;
    expect(initial.length).toBeGreaterThan(0);
    expect(answers).toHaveLength(6 * 3);

    // El banco es un argumento legítimo: lo que importa es lo que acompaña a la respuesta.
    const answerArguments = answers.map(([state, questionId, answer]) => [state, questionId, answer]);
    for (const hidden of ['trueMastery', 'groupId', 'correctness', 'distractor', 'displayName']) {
      expect(JSON.stringify(initial)).not.toContain(hidden);
      expect(JSON.stringify(answerArguments)).not.toContain(hidden);
    }
    for (const [, questionId, answer] of answers) {
      expect(questionId).toBeTypeOf('string');
      expect(answer).toBeTypeOf('string');
    }
  });
});
