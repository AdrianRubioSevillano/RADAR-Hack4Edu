import { describe, expect, it } from 'vitest';
import {
  InferenceError,
  KNOWLEDGE_GRAPH,
  RADAR_QUESTION_BANK,
  createInitialDiagnosticState,
  fixedQuestionOrder,
  marginals,
  submitAnswer,
} from '../../src/engine/index.ts';
import type {
  DiagnosticState,
  InferenceErrorCode,
  InterventionPlan,
  PriorConfig,
  Question,
  QuestionBank,
} from '../../src/engine/index.ts';
import {
  SimulationError,
  createResponseUniforms,
  createSyntheticClass,
  simulatePostIntervention,
  simulateResponse,
} from '../../src/simulation/index.ts';
import type {
  PostInterventionConfig,
  PostInterventionInput,
  PostInterventionReport,
  SimulationErrorCode,
  StudentPostInterventionReport,
  SyntheticClass,
} from '../../src/simulation/index.ts';
import { pairedMetric } from '../../src/simulation/postInterventionReport.ts';
import { bankOf, choiceQuestion, deepFreeze } from '../engine/support/bank.ts';
import { toNumber } from '../engine/support/exact.ts';
import { ORDER, exactMastery, exactPosterior, expectClose, serializedCopy } from '../engine/support/inference.ts';

type Bits = readonly (0 | 1)[];

const POPULATION_SEED = 42;
const INTERVENTION_SEED = 7;
const BANK = RADAR_QUESTION_BANK;
const FIXED = fixedQuestionOrder(BANK, KNOWLEDGE_GRAPH);
const NONE: Bits = [0, 0, 0, 0, 0, 0];

function planOf(skills: readonly string[]): InterventionPlan {
  return {
    interventions: skills.map((skill) => ({ id: `reinforce-${skill}`, skill, title: `Reforzar ${skill}`, durationMinutes: 15 })),
    totalMinutes: 15 * skills.length,
    coverage: 0,
    benefit: 0,
    cost: 0,
    netValue: 0,
  };
}

function classOf(count: number): SyntheticClass {
  return createSyntheticClass(POPULATION_SEED, count, KNOWLEDGE_GRAPH);
}

function classWith(masteries: readonly Bits[]): SyntheticClass {
  const base = classOf(masteries.length);
  return { ...base, students: base.students.map((student, index) => ({ ...student, trueMastery: masteries[index] ?? [] })) };
}

function questionOf(bank: QuestionBank, id: string): Question {
  const question = bank.questions.find((item) => item.id === id);
  if (question === undefined) throw new Error(`Falta ${id}`);
  return question;
}

function recorded(state: DiagnosticState, questionId: string, answer: string, bank: QuestionBank): DiagnosticState {
  const result = submitAnswer(state, questionId, answer, bank);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

// Pretest sintético con las primeras `count` preguntas del orden fijo.
function pretestOf(classState: SyntheticClass, count: number, prior: PriorConfig = {}): readonly DiagnosticState[] {
  const ids = FIXED.slice(0, count);
  const uniforms = createResponseUniforms(classState.seed, classState.students.map((student) => student.studentId), ids, 'pretest');
  return classState.students.map(({ studentId }) =>
    ids.reduce(
      (state, id) => recorded(state, id, simulateResponse(classState, studentId, questionOf(BANK, id), uniforms), BANK),
      createInitialDiagnosticState(studentId, prior, KNOWLEDGE_GRAPH),
    ),
  );
}

function inputOf(overrides: Partial<PostInterventionInput> & { readonly classState: SyntheticClass }): PostInterventionInput {
  return {
    intervention: planOf(['NEG', 'FRA']),
    seed: INTERVENTION_SEED,
    pretestStates: pretestOf(overrides.classState, 6),
    questionBank: BANK,
    knowledgeGraph: KNOWLEDGE_GRAPH,
    priorConfig: {},
    config: { questionBudgetPerStudent: 6, controlFraction: 0.5 },
    ...overrides,
  };
}

function studentOf(report: PostInterventionReport, id: string): StudentPostInterventionReport {
  const found = report.students.find((student) => student.studentId === id);
  if (found === undefined) throw new Error(`Falta ${id}`);
  return found;
}

function postQuestions(report: PostInterventionReport): Readonly<Record<string, readonly string[]>> {
  return Object.fromEntries(report.students.map((student) => [student.studentId, student.coverage.posttestQuestionIds]));
}

function codesOf(report: PostInterventionReport): readonly string[] {
  return report.warnings.map((item) => item.code);
}

function expectSimulationError(action: () => unknown, code: SimulationErrorCode): void {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(SimulationError);
  expect(caught).toMatchObject({ name: 'SimulationError', code });
}

function expectEngineError(action: () => unknown, code: InferenceErrorCode): void {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(InferenceError);
  expect(caught).toMatchObject({ code });
}

describe('flujo completo con el banco real', () => {
  const classState = classOf(12);
  const input = inputOf({ classState });
  const report = simulatePostIntervention(input);

  it('crea diagnósticos de postest con las preguntas fijadas', () => {
    expect(report.postStates).toHaveLength(12);
    for (const state of report.postStates) {
      expect(state.responses.map((item) => item.questionId)).toEqual(FIXED.slice(6, 12));
    }
    expect(report.provenance.occasion).toBe('posttest');
  });

  it('no continúa el posterior del pretest: parte del prior inicial', () => {
    for (const state of report.postStates) {
      const replay = state.responses.reduce(
        (current, item) => recorded(current, item.questionId, item.answer, BANK),
        createInitialDiagnosticState(state.studentId),
      );
      expect(state.joint).toEqual(replay.joint);
      expect(state.responses.some((item) => FIXED.slice(0, 6).includes(item.questionId))).toBe(false);
    }
  });

  it('genera las respuestas con postClass y la semilla de población', () => {
    const [state] = report.postStates;
    if (state === undefined) throw new Error('Falta el estado');
    const uniforms = createResponseUniforms(POPULATION_SEED, [state.studentId], FIXED.slice(6, 12), 'posttest');

    for (const item of state.responses) {
      expect(item.answer).toBe(simulateResponse(report.postClass, state.studentId, questionOf(BANK, item.questionId), uniforms));
    }
  });

  it('el pretest observado cuenta sus respuestas', () => {
    for (const state of input.pretestStates) {
      const { observed } = studentOf(report, state.studentId);
      expect(observed.pretest.questions).toBe(6);
      expect(observed.pretest.correct).toBe(state.responses.filter((item) => item.isCorrect).length);
      expect(observed.label).toBe('cambio descriptivo no equiparado');
    }
  });

  it('las marginales pre y post salen de sus estados', () => {
    for (const state of report.postStates) {
      const mean = (candidate: DiagnosticState): number => {
        const mastery = marginals(candidate.joint);
        return ORDER.reduce((sum, skill) => sum + (mastery[skill] ?? Number.NaN), 0) / 6;
      };
      const pretest = input.pretestStates.find((item) => item.studentId === state.studentId);
      const { estimated } = studentOf(report, state.studentId);
      expectClose(estimated.posttestMeanMastery ?? Number.NaN, mean(state));
      expectClose(estimated.pretestMeanMastery, pretest === undefined ? Number.NaN : mean(pretest));
      expect(estimated.pretestBasedOnPriorOnly).toBe(false);
    }
  });

  it('informa de composición y cobertura', () => {
    expect(report.coverage.requestedBudgetPerStudent).toBe(6);
    expect(report.coverage.meanEffectiveBudget).toBe(6);
    expect(report.coverage.pretest.questionCount).toBe(72);
    expect(report.coverage.posttest.questionCount).toBe(72);
    const perSkill = Object.values(report.coverage.posttest.questionsByPrimarySkill);
    expect(perSkill).toEqual([12, 12, 12, 12, 12, 12]);
  });

  it('separa los estados diagnósticos de la verdad y no expone uniformes', () => {
    expect(JSON.stringify(report.postStates)).not.toMatch(/trueMastery|groupId|correctness/);
    expect(JSON.stringify(report)).not.toMatch(/correctness|distractor/);
    expect(report.postClass.students[0]).toHaveProperty('trueMastery');
    expect(report.students[0]).not.toHaveProperty('trueMastery');
  });

  it('no afirma causalidad ni aprendizaje confirmado', () => {
    expect(report.disclaimer).toContain('no demuestra eficacia educativa');
    expect(report.disclaimer).toContain('no demuestra causalidad');
    expect(report.disclaimer).toContain('no es aprendizaje confirmado');
    expect(report.students[0]?.simulatedTruth.label).toBe('solo conocible en esta simulación, no observado');
    expect(report.differenceInDifferences.label).toContain('estimación en simulación');
  });
});

describe('selección del postest', () => {
  const classState = classOf(10);
  const pretestStates = pretestOf(classState, 6);
  const run = (intervention: InterventionPlan, config: Partial<PostInterventionConfig> = {}): PostInterventionReport =>
    simulatePostIntervention(
      inputOf({ classState, pretestStates, intervention, config: { questionBudgetPerStudent: 5, ...config } }),
    );

  it('es idéntica entre planes, plan vacío y tratamiento o control', () => {
    const reference = postQuestions(run(planOf(['OPS'])));

    expect(postQuestions(run(planOf(['ECU', 'ALG'])))).toEqual(reference);
    expect(postQuestions(run(planOf([])))).toEqual(reference);
    expect(postQuestions(run(planOf(['OPS']), { controlFraction: 0.5 }))).toEqual(reference);
    expect(postQuestions(run(planOf(['OPS']), { controlFraction: 1, improvementProbability: 1 }))).toEqual(reference);
  });

  it('sigue el orden fijo tras quitar las preguntas respondidas', () => {
    const [first] = classState.students;
    const answered = [FIXED[1] ?? '', FIXED[3] ?? ''];
    const state = answered.reduce(
      (current, id) => recorded(current, id, questionOf(BANK, id).correctAnswer, BANK),
      createInitialDiagnosticState(first?.studentId ?? ''),
    );
    const single = { ...classState, studentCount: 1, students: classState.students.slice(0, 1) };
    const report = simulatePostIntervention(
      inputOf({ classState: single, pretestStates: [state], config: { questionBudgetPerStudent: 4 } }),
    );

    expect(report.students[0]?.coverage.posttestQuestionIds).toEqual(FIXED.filter((id) => !answered.includes(id)).slice(0, 4));
  });

  it('solo incluye preguntas de assessmentSkills', () => {
    const report = run(planOf(['ECU']), { assessmentSkills: ['ECU'] });
    const ecu = FIXED.filter((id) => questionOf(BANK, id).primarySkill === 'ECU');

    expect(report.students[0]?.coverage.pretestQuestionIds).toEqual(ecu.slice(0, 1));
    expect(report.students[0]?.coverage.posttestQuestionIds).toEqual(ecu.slice(1, 5));
    expect(report.students[0]?.observed.pretest.questions).toBe(1);
    expect(report.coverage.posttest.questionsByPrimarySkill).toEqual({ ECU: 40 });
    expect(report.config.assessmentSkills).toEqual(['ECU']);
  });

  it('presupuesto insuficiente: usa las disponibles e informa', () => {
    const report = run(planOf(['OPS']), { questionBudgetPerStudent: 100 });

    for (const student of report.students) {
      expect(student.coverage.requestedBudget).toBe(100);
      expect(student.coverage.effectiveBudget).toBe(24);
    }
    expect(codesOf(report)).toContain('REDUCED_POSTTEST');
    expect(report.coverage.studentsWithReducedPosttest).toHaveLength(10);
  });
});

describe('banco agotado', () => {
  const classState = classOf(6);
  const report = simulatePostIntervention(
    inputOf({
      classState,
      pretestStates: pretestOf(classState, 30),
      intervention: planOf(['ECU']),
      config: { questionBudgetPerStudent: 5, controlFraction: 0.5, improvementProbability: 1, prerequisiteImprovementFactor: 1 },
    }),
  );

  it('no reutiliza ítems: resultados de postest null y aviso', () => {
    expect(report.postStates).toEqual([]);
    expect(codesOf(report)).toContain('NO_POSTTEST_QUESTIONS');
    expect(report.warnings.find((item) => item.code === 'NO_POSTTEST_QUESTIONS')?.message).toContain('todo el banco');
    for (const student of report.students) {
      expect(student.coverage.posttestQuestionIds).toEqual([]);
      expect(student.observed.posttest).toEqual({ correct: 0, questions: 0, proportion: null });
      expect(student.observed.change).toBeNull();
      expect(student.estimated.posttestMeanMastery).toBeNull();
      expect(student.estimated.change).toBeNull();
    }
  });

  it('el efecto real simulado sigue disponible', () => {
    expect(report.groups.treatment.simulatedTruth.pairs).toBe(3);
    expect(report.differenceInDifferences.simulatedTruth).not.toBeNull();
    expect(report.differenceInDifferences.observed).toBeNull();
    expect(report.differenceInDifferences.estimated).toBeNull();
    expect(report.groups.treatment.observed).toMatchObject({ pairs: 0, excluded: 3, meanChange: null, meanPretest: null });
  });
});

describe('prior', () => {
  const classState = classOf(3);

  it('conserva el prior efectivo y lo usa en el postest', () => {
    const prior = { marginals: { OPS: 0.7 }, compatibility: { epsilon: 0.2 } };
    const report = simulatePostIntervention(inputOf({ classState, pretestStates: pretestOf(classState, 3, prior), priorConfig: prior }));

    expect(report.priorConfig.marginals.OPS).toBe(0.7);
    expect(report.priorConfig.compatibility).toEqual({ epsilon: 0.2 });
    for (const state of report.postStates) {
      expect(state.priorConfig).toEqual(report.priorConfig);
    }
  });

  it('acepta formas equivalentes y un posterior distinto del prior', () => {
    const pretestStates = pretestOf(classState, 6);

    expect(() =>
      simulatePostIntervention(inputOf({ classState, pretestStates, priorConfig: { marginals: { OPS: 0.5 }, compatibility: null } })),
    ).not.toThrow();
  });

  it.each<[string, PriorConfig]>([
    ['otra marginal', { marginals: { OPS: 0.6 } }],
    ['prior compatible no usado', { compatibility: { epsilon: 0.5 } }],
  ])('rechaza %s', (_, priorConfig) => {
    expectSimulationError(() => simulatePostIntervention(inputOf({ classState, priorConfig })), 'PRIOR_MISMATCH');
  });

  it('rechaza otro epsilon', () => {
    const pretestStates = pretestOf(classState, 3, { compatibility: { epsilon: 0.2 } });

    expectSimulationError(
      () => simulatePostIntervention(inputOf({ classState, pretestStates, priorConfig: { compatibility: { epsilon: 0.3 } } })),
      'PRIOR_MISMATCH',
    );
  });

  it('rechaza un prior inválido', () => {
    expectEngineError(() => simulatePostIntervention(inputOf({ classState, priorConfig: { marginals: { OPS: 2 } } })), 'INVALID_PRIOR');
  });
});

describe('capas separadas', () => {
  it('las mejoras reales no se presentan como cambio observado o estimado', () => {
    const classState = classWith(Array.from({ length: 8 }, () => NONE));
    const report = simulatePostIntervention(
      inputOf({
        classState,
        intervention: planOf(['OPS']),
        config: { questionBudgetPerStudent: 6, improvementProbability: 1 },
      }),
    );

    expect(report.simulatedChanges).toHaveLength(8);
    for (const student of report.students) {
      expectClose(student.simulatedTruth.before, 0);
      expectClose(student.simulatedTruth.after, 1 / 6);
      expectClose(student.simulatedTruth.change, 1 / 6);
    }
    expect(report.students[0]?.observed).not.toHaveProperty('simulatedChanges');
    expect(report.groups.treatment.simulatedTruth.pairs).toBe(8);
  });

  it('plan vacío: efecto real cero, sin exigir variación observada cero', () => {
    const report = simulatePostIntervention(inputOf({ classState: classOf(20), intervention: planOf([]) }));

    expect(report.simulatedChanges).toEqual([]);
    expect(report.groups.treatment.simulatedTruth.meanChange).toBe(0);
    expect(report.groups.control.simulatedTruth.meanChange).toBe(0);
    expect(report.differenceInDifferences.simulatedTruth).toBe(0);
    expect(report.students.some((student) => student.observed.change !== 0)).toBe(true);
  });

  it('los alumnos de control responden igual bajo planes distintos', () => {
    const classState = classOf(12);
    const pretestStates = pretestOf(classState, 6);
    const run = (skills: readonly string[]): PostInterventionReport =>
      simulatePostIntervention(
        inputOf({ classState, pretestStates, intervention: planOf(skills), config: { questionBudgetPerStudent: 6, controlFraction: 0.5 } }),
      );
    const first = run(['OPS', 'NEG']);
    const second = run([]);

    expect(first.assignment).toEqual(second.assignment);
    for (const id of first.assignment.controlStudentIds) {
      const responsesOf = (report: PostInterventionReport): unknown =>
        report.postStates.find((state) => state.studentId === id)?.responses;
      expect(responsesOf(first)).toEqual(responsesOf(second));
    }
  });
});

describe('agregación calculada a mano', () => {
  // Cuatro preguntas de OPS; respuestas reales casi deterministas: dominar acierta.
  const bank = bankOf(...['Q1', 'Q2', 'Q3', 'Q4'].map((id) => choiceQuestion(id, ['OPS'])));
  const nearlyCertain = Object.fromEntries(['Q1', 'Q2', 'Q3', 'Q4'].map((id) => [id, { slip: 1e-9, guess: 1e-9 }]));
  const classState = classWith([NONE, NONE, NONE, NONE]);
  const config: PostInterventionConfig = {
    questionBudgetPerStudent: 2,
    assessmentSkills: ['OPS'],
    controlFraction: 0.5,
    improvementProbability: 1,
    realParametersByQuestion: nearlyCertain,
  };
  const assignment = simulatePostIntervention(
    inputOf({
      classState,
      questionBank: bank,
      intervention: planOf(['OPS']),
      pretestStates: classState.students.map((student) => createInitialDiagnosticState(student.studentId)),
      config,
    }),
  ).assignment;
  const [t1 = '', t2 = ''] = assignment.treatedStudentIds;
  const [c1 = '', c2 = ''] = assignment.controlStudentIds;

  function answered(id: string, answers: readonly (readonly [string, boolean])[]): DiagnosticState {
    return answers.reduce(
      (state, [questionId, isCorrect]) => recorded(state, questionId, isCorrect ? 'c' : 'a', bank),
      createInitialDiagnosticState(id),
    );
  }

  function run(states: readonly DiagnosticState[]): PostInterventionReport {
    return simulatePostIntervention(
      inputOf({ classState, questionBank: bank, intervention: planOf(['OPS']), pretestStates: states, config }),
    );
  }

  // Pre: t1 1/2, t2 0/2, c1 1/2, c2 2/2. Post: tratados 2/2, control 0/2.
  const report = run([
    answered(t1, [['Q1', true], ['Q2', false]]),
    answered(t2, [['Q1', false], ['Q2', false]]),
    answered(c1, [['Q1', true], ['Q2', false]]),
    answered(c2, [['Q1', true], ['Q2', true]]),
  ]);

  it('capa observada: media de cambios y diferencia en diferencias', () => {
    const { treatment, control } = report.groups;

    expect(treatment.observed).toMatchObject({ pairs: 2, excluded: 0, meanPretest: 0.25, meanPosttest: 1, meanChange: 0.75 });
    expect(control.observed).toMatchObject({ pairs: 2, excluded: 0, meanPretest: 0.75, meanPosttest: 0, meanChange: -0.75 });
    expect(report.differenceInDifferences.observed).toBe(1.5);
  });

  it('capa real: solo cambian los tratados', () => {
    expect(report.groups.treatment.simulatedTruth).toMatchObject({ meanPretest: 0, meanPosttest: 1, meanChange: 1 });
    expect(report.groups.control.simulatedTruth).toMatchObject({ meanPretest: 0, meanPosttest: 0, meanChange: 0 });
    expect(report.differenceInDifferences.simulatedTruth).toBe(1);
  });

  it('capa estimada: posteriores exactos con los parámetros del banco', () => {
    const evidenceOf = (pattern: readonly boolean[]): number =>
      toNumber(exactMastery(exactPosterior(pattern.map((correct) => ({ required: ['OPS'], correct }))), ['OPS']));
    const preT = (evidenceOf([true, false]) + evidenceOf([false, false])) / 2;
    const preC = (evidenceOf([true, false]) + evidenceOf([true, true])) / 2;
    const postT = evidenceOf([true, true]);
    const postC = evidenceOf([false, false]);

    expectClose(report.groups.treatment.estimated.meanChange ?? Number.NaN, postT - preT);
    expectClose(report.groups.control.estimated.meanChange ?? Number.NaN, postC - preC);
    expectClose(report.differenceInDifferences.estimated ?? Number.NaN, postT - preT - (postC - preC));
  });

  it('excluye al alumno sin postest y usa los mismos alumnos en pre y post', () => {
    const excluded = run([
      answered(t1, [['Q1', true], ['Q2', false]]),
      answered(t2, [['Q1', false], ['Q2', false], ['Q3', false], ['Q4', false]]),
      answered(c1, [['Q1', true], ['Q2', false]]),
      answered(c2, [['Q1', true], ['Q2', true]]),
    ]);
    const { observed, simulatedTruth } = excluded.groups.treatment;

    expect(observed).toMatchObject({ pairs: 1, excluded: 1, excludedStudentIds: [t2], meanPretest: 0.5, meanPosttest: 1, meanChange: 0.5 });
    expect(simulatedTruth.pairs).toBe(2);
    expect(excluded.differenceInDifferences.observed).toBe(1.25);
    expect(excluded.postStates.map((state) => state.studentId)).not.toContain(t2);
    expect(excluded.coverage.studentsWithoutPosttest).toEqual([t2]);
    expect(codesOf(excluded)).toContain('UNEQUAL_COVERAGE');
  });

  it('un pretest solo con prior: sin proporción ni cambio estimado', () => {
    const priorOnly = run([
      answered(t1, [['Q1', true], ['Q2', false]]),
      createInitialDiagnosticState(t2),
      answered(c1, [['Q1', true], ['Q2', false]]),
      answered(c2, [['Q1', true], ['Q2', true]]),
    ]);
    const student = studentOf(priorOnly, t2);

    expect(student.observed.pretest).toEqual({ correct: 0, questions: 0, proportion: null });
    expect(student.observed.change).toBeNull();
    expect(student.estimated.pretestBasedOnPriorOnly).toBe(true);
    expectClose(student.estimated.pretestMeanMastery, 0.5);
    expect(student.estimated.posttestMeanMastery).not.toBeNull();
    expect(student.estimated.change).toBeNull();
    expect(priorOnly.groups.treatment.estimated).toMatchObject({ pairs: 1, excludedStudentIds: [t2] });
    expect(codesOf(priorOnly)).toContain('PRIOR_ONLY_PRETEST');
  });

  it('una respuesta fuera del alcance basta para no ser solo prior', () => {
    const outside = bankOf(...bank.questions, choiceQuestion('Q5', ['NEG']));
    const state = recorded(createInitialDiagnosticState(t2), 'Q5', 'c', outside);
    const result = simulatePostIntervention(
      inputOf({
        classState,
        questionBank: outside,
        intervention: planOf(['OPS']),
        config,
        pretestStates: [
          answered(t1, [['Q1', true], ['Q2', false]]),
          state,
          answered(c1, [['Q1', true], ['Q2', false]]),
          answered(c2, [['Q1', true], ['Q2', true]]),
        ],
      }),
    );
    const student = studentOf(result, t2);

    expect(student.observed.pretest.questions).toBe(0);
    expect(student.observed.change).toBeNull();
    expect(student.estimated.pretestBasedOnPriorOnly).toBe(false);
    expect(student.estimated.change).not.toBeNull();
  });

  it('pairedMetric no convierte null en 0', () => {
    const metric = pairedMetric(
      [
        { studentId: 'a', pretest: 0.2, posttest: 0.6, change: 0.4 },
        { studentId: 'b', pretest: null, posttest: 0.9, change: null },
        { studentId: 'c', pretest: 0.8, posttest: null, change: null },
        { studentId: 'd', pretest: 0.4, posttest: 0.4, change: 0 },
      ],
      'x',
    );

    expect(metric.pairs).toBe(2);
    expect(metric.excludedStudentIds).toEqual(['b', 'c']);
    expectClose(metric.meanPretest ?? Number.NaN, 0.3);
    expectClose(metric.meanPosttest ?? Number.NaN, 0.5);
    expectClose(metric.meanChange ?? Number.NaN, 0.2);
  });

  it('pairedMetric sin parejas: todo null', () => {
    expect(pairedMetric([{ studentId: 'a', pretest: null, posttest: null, change: null }], 'x')).toEqual({
      pairs: 0,
      excluded: 1,
      excludedStudentIds: ['a'],
      meanPretest: null,
      meanPosttest: null,
      meanChange: null,
      label: 'x',
    });
  });
});

describe('grupos y clase vacíos', () => {
  it('control vacío: identificado, con métricas null', () => {
    const report = simulatePostIntervention(inputOf({ classState: classOf(5), config: { questionBudgetPerStudent: 3 } }));
    const { control } = report.groups;

    expect(control.isEmpty).toBe(true);
    expect(control.observed).toMatchObject({ pairs: 0, excluded: 0, meanChange: null });
    expect(control.simulatedTruth.meanChange).toBeNull();
    expect(control.coverage.meanEffectiveBudget).toBeNull();
    expect(report.differenceInDifferences).toMatchObject({ observed: null, estimated: null, simulatedTruth: null });
    expect(codesOf(report)).toContain('EMPTY_CONTROL');
    expect(serializedCopy(report)).toEqual(report);
  });

  it('tratamiento vacío: identificado, con métricas null', () => {
    const report = simulatePostIntervention(
      inputOf({ classState: classOf(5), config: { questionBudgetPerStudent: 3, controlFraction: 1 } }),
    );

    expect(report.groups.treatment.isEmpty).toBe(true);
    expect(report.groups.treatment.observed.meanChange).toBeNull();
    expect(report.differenceInDifferences.observed).toBeNull();
    expect(codesOf(report)).toContain('EMPTY_TREATMENT');
  });

  it('clase vacía: salida válida, sin NaN', () => {
    const classState = classOf(0);
    const report = simulatePostIntervention(inputOf({ classState, pretestStates: [] }));

    expect(report.students).toEqual([]);
    expect(report.postStates).toEqual([]);
    expect(report.coverage.meanEffectiveBudget).toBeNull();
    expect(report.groups.treatment.observed.meanChange).toBeNull();
    expect(report.differenceInDifferences).toMatchObject({ observed: null, estimated: null, simulatedTruth: null });
    expect(codesOf(report)).toEqual(['NO_STUDENTS']);
    expect(JSON.stringify(report)).not.toContain('NaN');
    expect(serializedCopy(report)).toEqual(report);
  });
});

describe('parámetros reales', () => {
  const classState = classWith(Array.from({ length: 6 }, () => NONE));
  const pretestStates = classState.students.map((student) => createInitialDiagnosticState(student.studentId));
  const ids = FIXED.slice(0, 4);
  const nearlyWrong = Object.fromEntries(ids.map((id) => [id, { slip: 0.5, guess: 1e-9 }]));
  const run = (realParametersByQuestion?: PostInterventionConfig['realParametersByQuestion']): PostInterventionReport =>
    simulatePostIntervention(
      inputOf({
        classState,
        pretestStates,
        intervention: planOf([]),
        config: { questionBudgetPerStudent: 4, ...(realParametersByQuestion === undefined ? {} : { realParametersByQuestion }) },
      }),
    );

  it('cambian las respuestas, no el motor ni el banco', () => {
    const before = JSON.stringify(BANK);
    const assumed = run();
    const real = run(nearlyWrong);

    expect(real.students.every((student) => student.observed.posttest.correct === 0)).toBe(true);
    expect(assumed.students.some((student) => student.observed.posttest.correct > 0)).toBe(true);
    expect(JSON.stringify(BANK)).toBe(before);
    for (const state of real.postStates) {
      const replay = state.responses.reduce(
        (current, item) => recorded(current, item.questionId, item.answer, BANK),
        createInitialDiagnosticState(state.studentId),
      );
      expect(state.joint).toEqual(replay.joint);
    }
  });

  it('conserva los parámetros efectivos en el orden del banco', () => {
    const reversed = Object.fromEntries(Object.entries(nearlyWrong).reverse());

    expect(JSON.stringify(run(reversed).config)).toBe(JSON.stringify(run(nearlyWrong).config));
    expect(Object.keys(run(nearlyWrong).config.realParametersByQuestion)).toHaveLength(4);
  });

  it.each<[string, unknown]>([
    ['que no son un objeto', 'x'],
    ['nulos', null],
    ['como lista', []],
    ['de una pregunta desconocida', { NADA: { slip: 0.1, guess: 0.2 } }],
    ['con un valor nulo', { [ids[0] ?? '']: null }],
  ])('rechaza parámetros %s', (_, parameters) => {
    expectSimulationError(
      () => run(parameters as PostInterventionConfig['realParametersByQuestion']),
      'INVALID_REAL_PARAMETERS',
    );
  });

  it('rechaza parámetros que incumplen DINA, aunque la pregunta no se use', () => {
    const unused = FIXED[29] ?? '';

    expectEngineError(() => run({ [unused]: { slip: 0.5, guess: 0.6 } }), 'INVALID_PARAMETERS');
  });
});

describe('semillas', () => {
  it('admite semillas de población e intervención distintas', () => {
    const report = simulatePostIntervention(inputOf({ classState: classOf(6), seed: 999 }));

    expect(report.provenance).toMatchObject({ populationSeed: POPULATION_SEED, interventionSeed: 999, responseSeed: POPULATION_SEED });
    expect(report.postClass.seed).toBe(POPULATION_SEED);
  });

  it('la semilla de intervención no cambia los uniformes de las respuestas', () => {
    const classState = classOf(8);
    const pretestStates = pretestOf(classState, 6);
    const run = (seed: number): PostInterventionReport =>
      simulatePostIntervention(inputOf({ classState, pretestStates, seed, intervention: planOf([]), config: { questionBudgetPerStudent: 6 } }));

    expect(run(1).postStates).toEqual(run(2).postStates);
  });
});

describe('reproducibilidad y permutaciones', () => {
  const classState = classOf(10);
  const pretestStates = pretestOf(classState, 6);
  const config = { questionBudgetPerStudent: 5, controlFraction: 0.4, assessmentSkills: ['OPS', 'NEG', 'ECU'] };
  const base = inputOf({ classState, pretestStates, config });

  it('las mismas entradas repiten exactamente el informe', () => {
    expect(JSON.stringify(simulatePostIntervention(base))).toBe(JSON.stringify(simulatePostIntervention(base)));
  });

  it('permutar alumnos, estados, competencias e intervenciones no cambia el informe', () => {
    const permuted = {
      ...base,
      classState: { ...classState, students: [...classState.students].reverse() },
      pretestStates: [...pretestStates].reverse(),
      intervention: { ...base.intervention, interventions: [...base.intervention.interventions].reverse() },
      config: { ...config, assessmentSkills: [...config.assessmentSkills].reverse() },
    };

    expect(simulatePostIntervention(permuted)).toEqual(simulatePostIntervention(base));
  });

  it('no muta entradas congeladas', () => {
    const frozen = deepFreeze(structuredClone({ ...base, questionBank: bankOf(...BANK.questions), knowledgeGraph: KNOWLEDGE_GRAPH }));

    expect(simulatePostIntervention(frozen)).toEqual(simulatePostIntervention(base));
  });

  it('no modifica los estados de pretest', () => {
    const copy = JSON.stringify(pretestStates);
    simulatePostIntervention(base);

    expect(JSON.stringify(pretestStates)).toBe(copy);
  });

  it('el informe sobrevive a JSON', () => {
    const report = simulatePostIntervention(base);

    expect(serializedCopy(report)).toEqual(report);
  });
});

describe('validación', () => {
  const classState = classOf(3);
  const pretestStates = pretestOf(classState, 3);
  const base = inputOf({ classState, pretestStates });
  const [first, second] = pretestStates as [DiagnosticState, DiagnosticState, DiagnosticState];
  const run = (change: Readonly<Record<string, unknown>>): unknown =>
    simulatePostIntervention({ ...base, ...change } as PostInterventionInput);

  it('rechaza una entrada nula', () => {
    expectSimulationError(() => simulatePostIntervention(null as unknown as PostInterventionInput), 'INVALID_POST_INTERVENTION_INPUT');
  });

  it('rechaza un priorConfig ausente', () => {
    expectSimulationError(() => run({ priorConfig: undefined }), 'INVALID_POST_INTERVENTION_INPUT');
  });

  it.each<[string, unknown]>([
    ['cero', 0],
    ['negativo', -1],
    ['decimal', 1.5],
    ['ausente', undefined],
    ['de texto', '3'],
    ['infinito', Number.POSITIVE_INFINITY],
  ])('rechaza un presupuesto %s', (_, questionBudgetPerStudent) => {
    expectSimulationError(() => run({ config: { questionBudgetPerStudent } }), 'INVALID_POST_INTERVENTION_CONFIG');
  });

  it.each<[string, unknown]>([
    ['vacías', []],
    ['repetidas', ['OPS', 'OPS']],
    ['desconocidas', ['XXX']],
    ['que no son una lista', 'OPS'],
  ])('rechaza assessmentSkills %s', (_, assessmentSkills) => {
    expectSimulationError(() => run({ config: { questionBudgetPerStudent: 3, assessmentSkills } }), 'INVALID_POST_INTERVENTION_CONFIG');
  });

  it('rechaza una configuración nula', () => {
    expectSimulationError(() => run({ config: null }), 'INVALID_POST_INTERVENTION_CONFIG');
  });

  it('propaga las validaciones de la intervención', () => {
    expectSimulationError(() => run({ config: { questionBudgetPerStudent: 3, controlFraction: 2 } }), 'INVALID_INTERVENTION_CONFIG');
    expectSimulationError(() => run({ intervention: { ...base.intervention, interventions: null } }), 'INVALID_INTERVENTION_PLAN');
    expectSimulationError(() => run({ seed: -1 }), 'INVALID_SEED');
    expectSimulationError(() => run({ classState: { ...classState, skillOrder: [] } }), 'INVALID_SYNTHETIC_CLASS');
  });

  it.each<[string, unknown]>([
    ['que no es una lista', 'x'],
    ['con un alumno de menos', [first, second]],
    ['con un alumno repetido', [first, first, second]],
    ['con un alumno ajeno', [first, second, createInitialDiagnosticState('S99')]],
  ])('rechaza un pretest %s', (_, states) => {
    expectSimulationError(() => run({ pretestStates: states }), 'INCONSISTENT_PRETEST');
  });

  it('rechaza un estado mal formado', () => {
    expectEngineError(() => run({ pretestStates: [null, first, second] }), 'INVALID_STATE');
  });

  it('rechaza un historial incoherente con el banco', () => {
    const [record] = first.responses;
    const altered = { ...first, responses: [{ ...record, isCorrect: !record?.isCorrect }, ...first.responses.slice(1)] };

    expectEngineError(() => run({ pretestStates: [altered, second, pretestStates[2]] }), 'INVALID_HISTORY');
  });

  it('rechaza un banco inválido', () => {
    expectEngineError(() => run({ questionBank: null }), 'INVALID_BANK');
  });

  it('rechaza un grafo sin las seis competencias', () => {
    expectEngineError(() => run({ knowledgeGraph: { nodes: [] } }), 'INVALID_GRAPH');
  });
});
