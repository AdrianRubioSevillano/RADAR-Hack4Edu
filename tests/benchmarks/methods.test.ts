import { describe, expect, it } from 'vitest';
import { BenchmarkError, runDiagnosticMethod } from '../../src/benchmarks/index.ts';
import type {
  BenchmarkErrorCode,
  DiagnosticMethod,
  DiagnosticMethodInput,
  DiagnosticMethodRun,
  MethodBudgetResult,
  QuestionBudget,
} from '../../src/benchmarks/index.ts';
import {
  InferenceError,
  KNOWLEDGE_GRAPH,
  RADAR_QUESTION_BANK,
  createInitialDiagnosticState,
  fixedQuestionOrder,
  marginals,
  selectNextQuestion,
  submitAnswer,
} from '../../src/engine/index.ts';
import type { DiagnosticState, QuestionBank } from '../../src/engine/index.ts';
import {
  SimulationError,
  createResponseUniforms,
  createSyntheticClass,
  simulateResponse,
} from '../../src/simulation/index.ts';
import type { ResponseUniformTable, SyntheticClass } from '../../src/simulation/index.ts';
import { bankOf, choiceQuestion, deepFreeze } from '../engine/support/bank.ts';
import { serializedCopy } from '../engine/support/inference.ts';

const SEED = 42;
const BANK = RADAR_QUESTION_BANK;
const FIXED = fixedQuestionOrder(BANK, KNOWLEDGE_GRAPH);
const METHODS: readonly DiagnosticMethod[] = ['A', 'B', 'C'];

function idsOf(syntheticClass: SyntheticClass): readonly string[] {
  return syntheticClass.students.map((student) => student.studentId);
}

function tableOf(syntheticClass: SyntheticClass, bank: QuestionBank = BANK, occasion = 'pretest'): ResponseUniformTable {
  return createResponseUniforms(syntheticClass.seed, idsOf(syntheticClass), bank.questions.map((question) => question.id), occasion);
}

const CLASS = createSyntheticClass(SEED, 6, KNOWLEDGE_GRAPH);
const UNIFORMS = tableOf(CLASS);

function inputOf(method: DiagnosticMethod, overrides: Partial<DiagnosticMethodInput> = {}): DiagnosticMethodInput {
  return {
    method,
    syntheticClass: CLASS,
    questionBank: BANK,
    knowledgeGraph: KNOWLEDGE_GRAPH,
    priorConfig: {},
    uniforms: UNIFORMS,
    budgets: [4, 9],
    randomOrderSeed: 9,
    ...overrides,
  };
}

function run(method: DiagnosticMethod, overrides: Partial<DiagnosticMethodInput> = {}): DiagnosticMethodRun {
  return runDiagnosticMethod(inputOf(method, overrides));
}

function questionsOf(result: DiagnosticMethodRun, studentId: string): readonly string[] {
  return result.results.students.find((student) => student.studentId === studentId)?.steps.map((step) => step.questionId) ?? [];
}

function budgetOf(result: DiagnosticMethodRun, budget: QuestionBudget): MethodBudgetResult {
  const found = result.results.budgets.find((item) => item.requestedBudget === budget);
  if (found === undefined) throw new Error(`Falta ${budget}`);
  return found;
}

function answersBy(result: DiagnosticMethodRun): ReadonlyMap<string, string> {
  return new Map(
    result.results.students.flatMap(({ studentId, steps }) =>
      steps.map((step) => [`${studentId}|${step.questionId}`, step.answer] as const),
    ),
  );
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

describe('método A', () => {
  it('coincide con fixedQuestionOrder para todos los alumnos', () => {
    const result = run('A');

    for (const id of idsOf(CLASS)) {
      expect(questionsOf(result, id)).toEqual(FIXED.slice(0, 9));
    }
  });
});

describe('método C', () => {
  const small = bankOf(...['Q3', 'Q1', 'Q6', 'Q2', 'Q5', 'Q4'].map((id) => choiceQuestion(id, ['OPS'])));
  const allOf = (overrides: Partial<DiagnosticMethodInput> = {}): DiagnosticMethodRun =>
    run('C', { questionBank: small, uniforms: tableOf(CLASS, small), budgets: ['all'], ...overrides });

  it('coincide con una réplica independiente en Python', () => {
    const result = allOf();

    expect(questionsOf(result, 'S01')).toEqual(['Q2', 'Q6', 'Q5', 'Q3', 'Q4', 'Q1']);
    expect(questionsOf(result, 'S02')).toEqual(['Q4', 'Q5', 'Q6', 'Q2', 'Q1', 'Q3']);
  });

  it('es reproducible', () => {
    expect(run('C')).toEqual(run('C'));
  });

  it('es una permutación sin reemplazo', () => {
    const result = run('C', { budgets: ['all'] });

    for (const id of idsOf(CLASS)) {
      expect([...questionsOf(result, id)].sort()).toEqual(BANK.questions.map((question) => question.id).sort());
    }
  });

  it('cada alumno tiene su orden, estable aunque cambie la clase o el presupuesto', () => {
    const large = createSyntheticClass(SEED, 12, KNOWLEDGE_GRAPH);
    const reference = run('C', { budgets: ['all'] });
    const other = run('C', { syntheticClass: large, uniforms: tableOf(large), budgets: [5, 'all'] });

    expect(questionsOf(reference, 'S01')).not.toEqual(questionsOf(reference, 'S02'));
    expect(questionsOf(other, 'S03')).toEqual(questionsOf(reference, 'S03'));
  });

  it('no depende del orden del banco', () => {
    const reversed = bankOf(...[...small.questions].reverse());

    expect(questionsOf(allOf({ questionBank: reversed }), 'S01')).toEqual(questionsOf(allOf(), 'S01'));
  });

  it('otra semilla cambia el orden', () => {
    expect(questionsOf(run('C', { randomOrderSeed: 1 }), 'S01')).not.toEqual(questionsOf(run('C', { randomOrderSeed: 2 }), 'S01'));
  });

  it('la semilla del orden no cambia la respuesta a cada pregunta', () => {
    const first = answersBy(run('C', { randomOrderSeed: 1, budgets: ['all'] }));
    const second = answersBy(run('C', { randomOrderSeed: 2, budgets: ['all'] }));

    expect(Object.fromEntries(second)).toEqual(Object.fromEntries(first));
  });
});

describe('método B', () => {
  it('coincide paso a paso con las funciones del motor', () => {
    const result = run('B');

    for (const { studentId } of CLASS.students) {
      let state: DiagnosticState = createInitialDiagnosticState(studentId);
      const expected: string[] = [];
      for (let step = 0; step < 9; step += 1) {
        const selection = selectNextQuestion(state, BANK);
        if (selection === null) throw new Error('Sin preguntas');
        const answer = simulateResponse(CLASS, studentId, selection.question, UNIFORMS);
        const recorded = submitAnswer(state, selection.question.id, answer, BANK);
        if (!recorded.ok) throw new Error(recorded.error.message);
        state = recorded.value;
        expected.push(selection.question.id);
      }

      expect(questionsOf(result, studentId)).toEqual(expected);
      expect(budgetOf(result, 9).states.find((item) => item.studentId === studentId)).toEqual(state);
    }
  });

  it('no repite preguntas', () => {
    for (const { steps } of run('B', { budgets: ['all'] }).results.students) {
      expect(new Set(steps.map((step) => step.questionId)).size).toBe(30);
    }
  });
});

describe.each(METHODS)('presupuestos con %s', (method) => {
  it('los menores son prefijos y no cambian al añadir otros', () => {
    const alone = run(method, { budgets: [4] });
    const extended = run(method, { budgets: [4, 9, 'all'] });

    expect(budgetOf(extended, 4)).toEqual(budgetOf(alone, 4));
    for (const student of extended.results.students) {
      const small = alone.results.students.find((item) => item.studentId === student.studentId);
      expect(student.steps.slice(0, 4)).toEqual(small?.steps);
    }
    for (const state of budgetOf(extended, 'all').states) {
      const short = budgetOf(extended, 4).states.find((item) => item.studentId === state.studentId);
      expect(state.responses.slice(0, 4)).toEqual(short?.responses);
    }
  });

  it('cada presupuesto usa sus preguntas y métricas', () => {
    const result = run(method);

    for (const budget of [4, 9]) {
      const item = budgetOf(result, budget);
      expect(item.effectiveBudget).toBe(budget);
      expect(item.states.every((state) => state.responses.length === budget)).toBe(true);
      expect(item.metrics.questionsUsed).toEqual({ total: 6 * budget, mean: budget });
      expect(item.metrics.pairCount).toBe(36);
    }
  });

  it('all consume todas las preguntas, sin parada anticipada', () => {
    const item = budgetOf(run(method, { budgets: ['all'] }), 'all');

    expect(item.effectiveBudget).toBe(30);
    expect(item.states.every((state) => state.responses.length === 30)).toBe(true);
  });

  it('un presupuesto mayor que el banco usa las disponibles y lo distingue', () => {
    const item = budgetOf(run(method, { budgets: [100] }), 100);

    expect(item.requestedBudget).toBe(100);
    expect(item.effectiveBudget).toBe(30);
    expect(new Set(item.states[0]?.responses.map((record) => record.questionId)).size).toBe(30);
  });
});

describe('presupuestos', () => {
  it('establece un orden canónico', () => {
    const result = run('A', { budgets: ['all', 9, 4] });

    expect(result.results.config.budgets).toEqual([4, 9, 'all']);
    expect(result.results.budgets.map((item) => item.requestedBudget)).toEqual([4, 9, 'all']);
  });

  it('permutar los presupuestos no cambia el resultado', () => {
    expect(run('B', { budgets: [9, 4] })).toEqual(run('B', { budgets: [4, 9] }));
  });

  it.each<[string, unknown]>([
    ['vacíos', []],
    ['que no son una lista', 4],
    ['con cero', [0]],
    ['negativos', [-1]],
    ['decimales', [1.5]],
    ['con NaN', [Number.NaN]],
    ['con otro texto', ['todas']],
    ['repetidos', [4, 4]],
    ['con all repetido', ['all', 'all']],
  ])('rechaza presupuestos %s', (_, budgets) => {
    expectBenchmarkError(() => run('A', { budgets: budgets as readonly QuestionBudget[] }), 'INVALID_METHOD_INPUT');
  });
});

describe('respuestas comunes', () => {
  it('los métodos ven la misma respuesta para el mismo alumno y pregunta', () => {
    const [a, b, c] = METHODS.map((method) => answersBy(run(method, { budgets: ['all'] })));

    expect(a?.size).toBe(180);
    expect(Object.fromEntries(b ?? [])).toEqual(Object.fromEntries(a ?? []));
    expect(Object.fromEntries(c ?? [])).toEqual(Object.fromEntries(a ?? []));
  });

  it('el orden de ejecución de los métodos no altera los resultados', () => {
    const first = METHODS.map((method) => run(method));
    const second = [...METHODS].reverse().map((method) => run(method)).reverse();

    expect(second).toEqual(first);
  });

  it('una tabla mayor no cambia las respuestas', () => {
    const wider = createResponseUniforms(SEED, [...idsOf(CLASS), 'S99'], [...BANK.questions.map((question) => question.id), 'EXTRA'], 'pretest');

    expect(run('A', { uniforms: wider }).results).toEqual(run('A').results);
  });
});

describe('escenario de todas las preguntas', () => {
  const runs = METHODS.map((method) => run(method, { budgets: ['all'] }));

  it('A, B y C terminan con posteriores iguales dentro de 1e-9', () => {
    const [reference] = runs;
    if (reference === undefined) throw new Error('Falta la referencia');
    const referenceStates = budgetOf(reference, 'all').states;

    for (const other of runs) {
      budgetOf(other, 'all').states.forEach((state, index) => {
        const expected = referenceStates[index]?.joint ?? [];
        state.joint.forEach((mass, position) => {
          expect(Math.abs(mass - (expected[position] ?? Number.NaN))).toBeLessThanOrEqual(1e-9);
        });
      });
    }
  });

  it('A, B y C terminan con métricas iguales dentro de 1e-9', () => {
    const [reference] = runs;
    if (reference === undefined) throw new Error('Falta la referencia');
    const base = budgetOf(reference, 'all').metrics.overall;

    for (const other of runs) {
      const { overall } = budgetOf(other, 'all').metrics;
      for (const metric of ['mae', 'brier', 'logLoss'] as const) {
        expect(Math.abs((overall[metric] ?? Number.NaN) - (base[metric] ?? Number.NaN))).toBeLessThanOrEqual(1e-9);
      }
      expect(overall.confusion).toEqual(base.confusion);
    }
  });
});

describe('parámetros reales', () => {
  const nearlyWrong = Object.fromEntries(BANK.questions.map((question) => [question.id, { slip: 0.5, guess: 1e-9 }]));
  const withoutMastery = {
    ...CLASS,
    students: CLASS.students.map((student) => ({ ...student, trueMastery: [0, 0, 0, 0, 0, 0] as const })),
  };

  it('cambian la simulación sin modificar los parámetros asumidos', () => {
    const before = JSON.stringify(BANK);
    const assumed = run('A', { syntheticClass: withoutMastery, budgets: ['all'] });
    const real = run('A', { syntheticClass: withoutMastery, budgets: ['all'], realParametersByQuestion: nearlyWrong });
    const correct = (result: DiagnosticMethodRun): number =>
      result.results.students.flatMap((student) => student.steps).filter((step) => step.isCorrect).length;

    expect(correct(assumed)).toBeGreaterThan(0);
    expect(correct(real)).toBe(0);
    expect(JSON.stringify(BANK)).toBe(before);

    // El posterior sigue usando los parámetros del banco.
    for (const state of budgetOf(real, 'all').states) {
      const replay = state.responses.reduce((current, record) => {
        const result = submitAnswer(current, record.questionId, record.answer, BANK);
        if (!result.ok) throw new Error(result.error.message);
        return result.value;
      }, createInitialDiagnosticState(state.studentId));
      expect(state.joint).toEqual(replay.joint);
    }
  });

  it('se declaran en la configuración, en el orden del banco', () => {
    const reversed = Object.fromEntries(Object.entries(nearlyWrong).reverse());

    expect(JSON.stringify(run('A', { realParametersByQuestion: reversed }).results.config)).toBe(
      JSON.stringify(run('A', { realParametersByQuestion: nearlyWrong }).results.config),
    );
  });

  it.each<[string, unknown]>([
    ['que no son un objeto', 'x'],
    ['nulos', null],
    ['como lista', []],
    ['de una pregunta desconocida', { NADA: { slip: 0.1, guess: 0.2 } }],
    ['con un valor nulo', { [FIXED[0] ?? '']: null }],
  ])('rechaza parámetros %s', (_, parameters) => {
    expectBenchmarkError(
      () => run('A', { realParametersByQuestion: parameters as DiagnosticMethodInput['realParametersByQuestion'] }),
      'INVALID_REAL_PARAMETERS',
    );
  });

  it('rechaza parámetros que incumplen DINA, aunque la pregunta no se use', () => {
    let caught: unknown;
    try {
      run('A', { budgets: [1], realParametersByQuestion: { [FIXED[29] ?? '']: { slip: 0.5, guess: 0.6 } } });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(InferenceError);
    expect(caught).toMatchObject({ code: 'INVALID_PARAMETERS' });
  });
});

describe('separación de tiempos', () => {
  it('sin medición, timing es null', () => {
    expect(run('A').timing).toBeNull();
    expect(run('A', { measureTiming: false }).timing).toBeNull();
  });

  it.each(METHODS)('%s: medir no cambia el bloque determinista', (method) => {
    const measured = run(method, { measureTiming: true });

    expect(measured.results).toEqual(run(method).results);
    expect(JSON.stringify(measured.results)).not.toMatch(/Ms"|timing|Date/);
    expect(measured.timing).toMatchObject({ selectionCount: 6 * 9 });
    expect(measured.timing?.selectionMs).toBeGreaterThanOrEqual(0);
    expect(measured.timing?.meanSelectionMs).toBeGreaterThanOrEqual(0);
    expect(measured.timing?.definition).toContain('selectNextQuestion');
    expect(measured.timing?.disclaimer).toContain('no son una comparación definitiva');
  });

  it('B no prepara un orden', () => {
    expect(run('B', { measureTiming: true }).timing?.preparationMs).toBe(0);
  });

  it('sin selecciones, la media es null', () => {
    const empty = createSyntheticClass(SEED, 0, KNOWLEDGE_GRAPH);

    expect(run('A', { syntheticClass: empty, uniforms: tableOf(empty), measureTiming: true }).timing?.meanSelectionMs).toBeNull();
  });
});

describe.each(METHODS)('casos límite con %s', (method) => {
  it('clase vacía: salida válida con métricas null', () => {
    const empty = createSyntheticClass(SEED, 0, KNOWLEDGE_GRAPH);
    const result = run(method, { syntheticClass: empty, uniforms: tableOf(empty) });

    expect(result.results.students).toEqual([]);
    expect(budgetOf(result, 4).states).toEqual([]);
    expect(budgetOf(result, 4).metrics.overall.mae).toBeNull();
    expect(budgetOf(result, 4).metrics.questionsUsed).toEqual({ total: 0, mean: null });
  });

  it('banco vacío: estados iniciales sin preguntas', () => {
    const bank = bankOf();
    const result = run(method, { questionBank: bank, uniforms: tableOf(CLASS, bank), budgets: [5, 'all'] });

    expect(result.results.config.bankSize).toBe(0);
    expect(result.results.budgets.map((item) => [item.requestedBudget, item.effectiveBudget])).toEqual([
      [5, 0],
      ['all', 0],
    ]);
    expect(budgetOf(result, 5).states).toHaveLength(6);
    expect(budgetOf(result, 5).metrics.questionsUsed).toEqual({ total: 0, mean: 0 });
  });

  it('permutar los alumnos no cambia los resultados deterministas', () => {
    const permuted = { ...CLASS, students: [...CLASS.students].reverse() };

    expect(run(method, { syntheticClass: permuted }).results).toEqual(run(method).results);
  });

  it('no muta entradas congeladas', () => {
    const syntheticClass = deepFreeze(createSyntheticClass(SEED, 3, KNOWLEDGE_GRAPH));
    const bank = deepFreeze(bankOf(...BANK.questions.map((question) => structuredClone(question))));
    const input = deepFreeze({
      ...inputOf(method),
      syntheticClass,
      questionBank: bank,
      knowledgeGraph: structuredClone(KNOWLEDGE_GRAPH),
      uniforms: tableOf(syntheticClass),
      budgets: ['all', 4],
    } as DiagnosticMethodInput);

    expect(runDiagnosticMethod(input).results.budgets).toHaveLength(2);
  });

  it('el resultado sobrevive a JSON y no contiene verdad ni uniformes', () => {
    const result = run(method);
    const text = JSON.stringify(result);

    expect(serializedCopy(result)).toEqual(result);
    expect(text).not.toMatch(/trueMastery|groupId|correctness/);
  });
});

describe('estimaciones', () => {
  it('usa el prior indicado y lo declara', () => {
    const priorConfig = { marginals: { OPS: 0.9 } };
    const result = run('A', { priorConfig, budgets: [1] });

    expect(result.results.config.priorConfig.marginals.OPS).toBe(0.9);
    expect(budgetOf(result, 1).states[0]?.priorConfig.marginals.OPS).toBe(0.9);
  });

  it('un presupuesto mayor cambia la estimación', () => {
    const result = run('A');
    const mastery = (budget: number): unknown => marginals(budgetOf(result, budget).states[0]?.joint ?? []);

    expect(mastery(4)).not.toEqual(mastery(9));
  });

  it('aplica la configuración de métricas', () => {
    expect(budgetOf(run('A', { metricsConfig: { tau: 0.3 } }), 4).metrics.config.tau).toBe(0.3);
  });
});

describe('validación', () => {
  it('rechaza una entrada nula', () => {
    expectBenchmarkError(() => runDiagnosticMethod(null as unknown as DiagnosticMethodInput), 'INVALID_METHOD_INPUT');
  });

  it.each<[string, Partial<Record<keyof DiagnosticMethodInput, unknown>>]>([
    ['método desconocido', { method: 'D' }],
    ['sin prior', { priorConfig: undefined }],
    ['semilla negativa', { randomOrderSeed: -1 }],
    ['semilla ausente', { randomOrderSeed: undefined }],
    ['semilla fuera de uint32', { randomOrderSeed: 2 ** 32 }],
    ['medición que no es booleana', { measureTiming: 'sí' }],
  ])('rechaza %s', (_, overrides) => {
    expectBenchmarkError(() => run('A', overrides as Partial<DiagnosticMethodInput>), 'INVALID_METHOD_INPUT');
  });

  it.each<[string, () => ResponseUniformTable]>([
    ['nula', () => null as unknown as ResponseUniformTable],
    ['de otra ocasión', () => tableOf(CLASS, BANK, 'posttest')],
    ['de otra semilla', () => createResponseUniforms(SEED + 1, idsOf(CLASS), BANK.questions.map((question) => question.id), 'pretest')],
    ['sin todos los alumnos', () => createResponseUniforms(SEED, ['S01'], BANK.questions.map((question) => question.id), 'pretest')],
    ['sin todas las preguntas', () => createResponseUniforms(SEED, idsOf(CLASS), FIXED.slice(0, 5), 'pretest')],
  ])('rechaza una tabla %s', (_, table) => {
    expectBenchmarkError(() => run('A', { uniforms: table() }), 'INVALID_RESPONSE_TABLE');
  });

  it('rechaza uniformes inválidos', () => {
    const [first, ...rest] = UNIFORMS.entries;
    const uniforms = { ...UNIFORMS, entries: [{ ...first, correctness: 1 }, ...rest] } as ResponseUniformTable;
    let caught: unknown;
    try {
      run('A', { uniforms });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(SimulationError);
    expect(caught).toMatchObject({ code: 'INVALID_UNIFORM_TABLE' });
  });

  it('rechaza una clase mal formada', () => {
    let caught: unknown;
    try {
      run('A', { syntheticClass: { ...CLASS, skillOrder: [] } });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(SimulationError);
    expect(caught).toMatchObject({ code: 'INVALID_SYNTHETIC_CLASS' });
  });

  it.each<[string, Partial<DiagnosticMethodInput>, string]>([
    ['un banco inválido', { questionBank: null as unknown as QuestionBank }, 'INVALID_BANK'],
    ['un grafo inválido', { knowledgeGraph: { nodes: [] } }, 'INVALID_GRAPH'],
    ['un prior inválido', { priorConfig: { marginals: { OPS: 2 } } }, 'INVALID_PRIOR'],
  ])('rechaza %s', (_, overrides, code) => {
    let caught: unknown;
    try {
      run('A', overrides);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(InferenceError);
    expect(caught).toMatchObject({ code });
  });

  it('rechaza un tau inválido antes de ejecutar', () => {
    expectBenchmarkError(() => run('A', { metricsConfig: { tau: 2 } }), 'INVALID_METRICS_CONFIG');
  });
});
