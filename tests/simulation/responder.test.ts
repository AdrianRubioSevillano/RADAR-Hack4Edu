import { describe, expect, it } from 'vitest';
import {
  InferenceError,
  KNOWLEDGE_GRAPH,
  RADAR_QUESTION_BANK,
  createInitialDiagnosticState,
  fixedQuestionOrder,
  selectNextQuestion,
  submitAnswer,
} from '../../src/engine/index.ts';
import type { DiagnosticState, InferenceErrorCode, Question } from '../../src/engine/index.ts';
import {
  SimulationError,
  createResponseUniforms,
  createSyntheticClass,
  observableStudents,
  simulateResponse,
} from '../../src/simulation/index.ts';
import type {
  RealItemParameters,
  ResponseUniformTable,
  SimulationErrorCode,
  SyntheticClass,
} from '../../src/simulation/index.ts';
import { bankOf, choiceQuestion, deepFreeze, numericQuestion } from '../engine/support/bank.ts';
import { ORDER, serializedCopy } from '../engine/support/inference.ts';

const SEED = 42;
const ALL = [1, 1, 1, 1, 1, 1] as const;
const NONE = [0, 0, 0, 0, 0, 0] as const;

// slip 0.1 y guess 0.25: P(acierto) = 0.9 dominando R_q y 0.25 si no.
const CHOICE = choiceQuestion('Q1', ['OPS', 'NEG']);
const NUMERIC = numericQuestion('Q2', ['OPS'], '5/1');

function classWith(...masteries: readonly (readonly (0 | 1)[])[]): SyntheticClass {
  const base = createSyntheticClass(SEED, masteries.length, KNOWLEDGE_GRAPH);
  return {
    ...base,
    students: base.students.map((student, index) => ({ ...student, trueMastery: masteries[index] ?? [] })),
  };
}

// Tabla escrita a mano para fijar los uniformes de un caso.
function tableWith(correctness: number, distractor = 0, questionId = 'Q1'): ResponseUniformTable {
  return {
    generator: { algorithm: 'mulberry32', version: 1 },
    seed: SEED,
    occasion: 'pretest',
    studentIds: ['S01'],
    questionIds: [questionId],
    entries: [{ studentId: 'S01', questionId, correctness, distractor }],
  };
}

function entryOf(table: ResponseUniformTable, studentId: string, questionId: string): unknown {
  return table.entries.find((entry) => entry.studentId === studentId && entry.questionId === questionId);
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

describe('tabla de uniformes', () => {
  it('coincide con una réplica independiente en Python', () => {
    const table = createResponseUniforms(SEED, ['S01', 'S02'], ['OPS-1', 'Q1'], 'pretest');

    expect(entryOf(table, 'S01', 'Q1')).toEqual({
      studentId: 'S01',
      questionId: 'Q1',
      correctness: 0.5621008845046163,
      distractor: 0.6039130939170718,
    });
    expect(entryOf(table, 'S02', 'OPS-1')).toEqual({
      studentId: 'S02',
      questionId: 'OPS-1',
      correctness: 0.00877703889273107,
      distractor: 0.32699578534811735,
    });
  });

  it('las mismas entradas dan exactamente la misma tabla', () => {
    const create = (): ResponseUniformTable => createResponseUniforms(SEED, ['S01', 'S02'], ['Q1', 'Q2'], 'pretest');

    expect(JSON.stringify(create())).toBe(JSON.stringify(create()));
  });

  it('ordena los ids y declara procedencia', () => {
    const table = createResponseUniforms(SEED, ['S02', 'S01'], ['Q2', 'Q1'], 'pretest');

    expect(table.studentIds).toEqual(['S01', 'S02']);
    expect(table.questionIds).toEqual(['Q1', 'Q2']);
    expect(table.entries.map((entry) => `${entry.studentId}:${entry.questionId}`)).toEqual([
      'S01:Q1',
      'S01:Q2',
      'S02:Q1',
      'S02:Q2',
    ]);
    expect(table.generator).toEqual({ algorithm: 'mulberry32', version: 1 });
    expect(table.seed).toBe(SEED);
    expect(table.occasion).toBe('pretest');
  });

  it('permutar las entradas no cambia la tabla', () => {
    expect(createResponseUniforms(SEED, ['S02', 'S01', 'S03'], ['Q3', 'Q1', 'Q2'], 'pretest')).toEqual(
      createResponseUniforms(SEED, ['S01', 'S02', 'S03'], ['Q1', 'Q2', 'Q3'], 'pretest'),
    );
  });

  it('añadir alumnos o preguntas no cambia los pares existentes', () => {
    const small = createResponseUniforms(SEED, ['S02'], ['Q2'], 'pretest');
    const large = createResponseUniforms(SEED, ['S01', 'S02', 'S03'], ['Q1', 'Q2', 'Q3'], 'pretest');

    expect(entryOf(large, 'S02', 'Q2')).toEqual(small.entries[0]);
  });

  it('cambiar la ocasión cambia el flujo sin modificar el pretest', () => {
    const before = createResponseUniforms(SEED, ['S01'], ['Q1'], 'pretest');
    const posttest = createResponseUniforms(SEED, ['S01'], ['Q1'], 'posttest');
    const after = createResponseUniforms(SEED, ['S01'], ['Q1'], 'pretest');

    expect(posttest.entries[0]).toEqual({
      studentId: 'S01',
      questionId: 'Q1',
      correctness: 0.5329648454207927,
      distractor: 0.4332430006470531,
    });
    expect(after).toEqual(before);
  });

  it('otra semilla cambia los uniformes', () => {
    const uniforms = (seed: number): unknown => createResponseUniforms(seed, ['S01'], ['Q1'], 'pretest').entries;

    expect(uniforms(1)).not.toEqual(uniforms(2));
  });

  it('las etiquetas no son ambiguas', () => {
    const first = createResponseUniforms(SEED, ['a/b'], ['c'], 'o').entries[0];
    const second = createResponseUniforms(SEED, ['a'], ['b/c'], 'o').entries[0];
    const third = createResponseUniforms(SEED, ['a","b'], ['c'], 'o').entries[0];
    const fourth = createResponseUniforms(SEED, ['a'], ['b","c'], 'o').entries[0];
    const values = [first, second, third, fourth].map((entry) => entry?.correctness);

    expect(new Set(values).size).toBe(4);
  });

  it('el acierto y el distractor usan uniformes distintos', () => {
    const { entries } = createResponseUniforms(SEED, ['S01', 'S02'], ['Q1', 'Q2', 'Q3'], 'pretest');

    for (const entry of entries) {
      expect(entry.correctness).not.toBe(entry.distractor);
    }
  });

  it('todos los uniformes están en [0, 1)', () => {
    const ids = Array.from({ length: 30 }, (_, index) => `I${index}`);
    for (const { correctness, distractor } of createResponseUniforms(0, ids, ids, 'pretest').entries) {
      for (const value of [correctness, distractor]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    }
  });

  it('admite listas vacías', () => {
    expect(createResponseUniforms(SEED, [], ['Q1'], 'pretest').entries).toEqual([]);
    expect(createResponseUniforms(SEED, ['S01'], [], 'pretest').entries).toEqual([]);
    expect(createResponseUniforms(SEED, [], [], 'pretest').entries).toEqual([]);
  });

  it.each<[string, unknown, SimulationErrorCode]>([
    ['semilla negativa', -1, 'INVALID_SEED'],
    ['semilla decimal', 1.5, 'INVALID_SEED'],
    ['semilla fuera de uint32', 2 ** 32, 'INVALID_SEED'],
  ])('rechaza %s', (_, seed, code) => {
    expectSimulationError(() => createResponseUniforms(seed as number, ['S01'], ['Q1'], 'pretest'), code);
  });

  it.each<[string, unknown]>([
    ['vacía', ''],
    ['en blanco', '  '],
    ['nula', null],
    ['numérica', 1],
  ])('rechaza una ocasión %s', (_, occasion) => {
    expectSimulationError(() => createResponseUniforms(SEED, ['S01'], ['Q1'], occasion as string), 'INVALID_OCCASION');
  });

  it.each<[string, unknown]>([
    ['que no es una lista', 'S01'],
    ['con ids repetidos', ['S01', 'S01']],
    ['con un id vacío', ['']],
    ['con un id que no es texto', [1]],
  ])('rechaza una lista %s', (_, ids) => {
    const list = ids as readonly string[];

    expectSimulationError(() => createResponseUniforms(SEED, list, ['Q1'], 'pretest'), 'INVALID_ID_LIST');
    expectSimulationError(() => createResponseUniforms(SEED, ['S01'], list, 'pretest'), 'INVALID_ID_LIST');
  });
});

describe('modelo DINA', () => {
  // u frente a guess = 0.25 y 1 - slip = 0.9.
  it.each<[string, number, readonly (0 | 1)[], boolean]>([
    ['por debajo de guess, sin dominar', 0.1, NONE, true],
    ['por debajo de guess, dominando', 0.1, ALL, true],
    ['igual a guess, sin dominar', 0.25, NONE, false],
    ['entre guess y 1 - slip, sin dominar', 0.5, NONE, false],
    ['entre guess y 1 - slip, dominando', 0.5, ALL, true],
    ['igual a 1 - slip, dominando', 0.9, ALL, false],
    ['por encima de 1 - slip, sin dominar', 0.95, NONE, false],
    ['por encima de 1 - slip, dominando', 0.95, ALL, false],
  ])('u %s', (_, correctness, mastery, isCorrect) => {
    const answer = simulateResponse(classWith(mastery), 'S01', CHOICE, tableWith(correctness));

    expect(answer === 'c').toBe(isCorrect);
  });

  it('dominar solo parte de R_q cuenta como no dominar', () => {
    const answer = simulateResponse(classWith([1, 0, 1, 1, 1, 1]), 'S01', CHOICE, tableWith(0.5));

    expect(answer).not.toBe('c');
  });

  it('las competencias ajenas a R_q no influyen', () => {
    expect(simulateResponse(classWith([1, 1, 0, 0, 0, 0]), 'S01', CHOICE, tableWith(0.5))).toBe('c');
  });

  it('cambiar α con el mismo uniforme cambia la respuesta y no se regenera la verdad', () => {
    const table = tableWith(0.5);

    expect(simulateResponse(classWith(NONE), 'S01', CHOICE, table)).not.toBe('c');
    expect(simulateResponse(classWith(ALL), 'S01', CHOICE, table)).toBe('c');
  });

  it('con u por debajo de guess, perder α no cambia el acierto', () => {
    const table = tableWith(0.1);

    expect(simulateResponse(classWith(ALL), 'S01', CHOICE, table)).toBe(simulateResponse(classWith(NONE), 'S01', CHOICE, table));
  });

  it('repetir una consulta no consume aleatoriedad ni modifica la tabla', () => {
    const syntheticClass = classWith(ALL);
    const table = createResponseUniforms(SEED, ['S01'], ['Q1'], 'pretest');
    const copy = serializedCopy(table);
    const first = simulateResponse(syntheticClass, 'S01', CHOICE, table);

    for (let round = 0; round < 20; round += 1) {
      expect(simulateResponse(syntheticClass, 'S01', CHOICE, table)).toBe(first);
    }
    expect(serializedCopy(table)).toEqual(copy);
  });
});

describe('parámetros reales', () => {
  const real = { slip: 0.3, guess: 0.6 };

  it('sustituyen a los del ítem', () => {
    // u = 0.5: por debajo del guess real 0.6, por encima del asumido 0.25.
    expect(simulateResponse(classWith(NONE), 'S01', CHOICE, tableWith(0.5))).not.toBe('c');
    expect(simulateResponse(classWith(NONE), 'S01', CHOICE, tableWith(0.5), real)).toBe('c');

    // u = 0.8: por encima de 1 - slip real = 0.7, por debajo del asumido 0.9.
    expect(simulateResponse(classWith(ALL), 'S01', CHOICE, tableWith(0.8))).toBe('c');
    expect(simulateResponse(classWith(ALL), 'S01', CHOICE, tableWith(0.8), real)).not.toBe('c');
  });

  it('no alteran el ítem ni el banco', () => {
    const bank = deepFreeze(bankOf(choiceQuestion('Q1', ['OPS', 'NEG'])));
    const [question] = bank.questions;
    if (question === undefined) throw new Error('Falta la pregunta');

    simulateResponse(classWith(ALL), 'S01', question, tableWith(0.5), real);

    expect(question.slip).toBe(0.1);
    expect(question.guess).toBe(0.25);
  });

  it.each<[string, RealItemParameters]>([
    ['guess no menor que 1 - slip', { slip: 0.5, guess: 0.6 }],
    ['guess nulo', { slip: 0.1, guess: 0 }],
    ['slip nulo', { slip: 0, guess: 0.25 }],
    ['slip NaN', { slip: Number.NaN, guess: 0.25 }],
    ['guess infinito', { slip: 0.1, guess: Number.POSITIVE_INFINITY }],
    ['sin guess', { slip: 0.1 } as RealItemParameters],
  ])('rechaza %s con la restricción DINA', (_, parameters) => {
    expectEngineError(() => simulateResponse(classWith(ALL), 'S01', CHOICE, tableWith(0.5), parameters), 'INVALID_PARAMETERS');
  });

  it('rechaza realParameters sin la forma esperada', () => {
    const parameters = null as unknown as RealItemParameters;

    expectSimulationError(() => simulateResponse(classWith(ALL), 'S01', CHOICE, tableWith(0.5), parameters), 'INVALID_REAL_PARAMETERS');
  });

  it('valida los parámetros del ítem aunque haya parámetros reales', () => {
    const question = choiceQuestion('Q1', ['OPS'], { slip: 0.9, guess: 0.5 });

    expectEngineError(() => simulateResponse(classWith(ALL), 'S01', question, tableWith(0.5), real), 'INVALID_PARAMETERS');
  });
});

describe('respuesta observable', () => {
  it('acierto: id correcto o respuesta canónica', () => {
    expect(simulateResponse(classWith(ALL), 'S01', CHOICE, tableWith(0.5))).toBe('c');
    expect(simulateResponse(classWith(ALL), 'S01', NUMERIC, tableWith(0.5, 0, 'Q2'))).toBe('5/1');
  });

  it.each<[number, string]>([
    [0, 'a'],
    [0.33, 'a'],
    [0.34, 'b'],
    [0.66, 'b'],
    [0.67, 'd'],
    [1 - 2 ** -53, 'd'],
  ])('el uniforme %d elige el distractor %s', (distractor, expected) => {
    expect(simulateResponse(classWith(NONE), 'S01', CHOICE, tableWith(0.95, distractor))).toBe(expected);
  });

  it('el orden de las opciones no cambia el distractor', () => {
    const reversed = { ...CHOICE, options: [...CHOICE.options].reverse() };

    expect(simulateResponse(classWith(NONE), 'S01', reversed, tableWith(0.95, 0.4))).toBe('b');
  });

  it('el segundo uniforme no decide el acierto', () => {
    expect(simulateResponse(classWith(ALL), 'S01', CHOICE, tableWith(0.5, 0.99))).toBe('c');
  });

  it('numérica: falla con 0/1', () => {
    expect(simulateResponse(classWith(NONE), 'S01', NUMERIC, tableWith(0.95, 0, 'Q2'))).toBe('0/1');
  });

  it('numérica: falla con 1/1 si 0/1 es la correcta', () => {
    const zero = numericQuestion('Q2', ['OPS'], '0/1');

    expect(simulateResponse(classWith(NONE), 'S01', zero, tableWith(0.95, 0, 'Q2'))).toBe('1/1');
  });

  it.each(RADAR_QUESTION_BANK.questions.map((question) => [question.id, question] as const))(
    '%s: acierto y fallo son válidos, y el fallo es distinto del acierto',
    (id, question) => {
      const state = createInitialDiagnosticState('S01');

      const correct = simulateResponse(classWith(ALL), 'S01', question, tableWith(0, 0.5, id));
      const accepted = submitAnswer(state, id, correct, RADAR_QUESTION_BANK);
      expect(accepted.ok && accepted.value.responses[0]?.isCorrect).toBe(true);

      for (const distractor of [0, 0.5, 0.99]) {
        const wrong = simulateResponse(classWith(NONE), 'S01', question, tableWith(0.999, distractor, id));
        const rejected = submitAnswer(state, id, wrong, RADAR_QUESTION_BANK);
        expect(wrong).not.toBe(correct);
        expect(rejected.ok).toBe(true);
        expect(rejected.ok && rejected.value.responses[0]?.isCorrect).toBe(false);
      }
    },
  );

  it('devuelve solo una cadena', () => {
    expect(simulateResponse(classWith(ALL), 'S01', CHOICE, tableWith(0.5))).toBeTypeOf('string');
  });
});

describe('validación de simulateResponse', () => {
  const valid = classWith(ALL, NONE);
  const table = createResponseUniforms(SEED, ['S01', 'S02'], ['Q1'], 'pretest');
  const withStudent = (change: Readonly<Record<string, unknown>>): SyntheticClass =>
    ({
      ...valid,
      students: valid.students.map((student, index) => (index === 0 ? { ...student, ...change } : student)),
    }) as SyntheticClass;

  it('acepta una α cambiada que ya no coincide con la generada', () => {
    expect(() => simulateResponse(withStudent({ trueMastery: NONE }), 'S01', CHOICE, table)).not.toThrow();
  });

  it.each<[string, unknown]>([
    ['nula', null],
    ['sin alumnos', { ...valid, students: undefined }],
    ['con otro orden de competencias', { ...valid, skillOrder: [...ORDER].reverse() }],
    ['sin orden de competencias', { ...valid, skillOrder: undefined }],
    ['con otro generador', { ...valid, generator: { algorithm: 'mulberry32', version: 2 } }],
    ['sin generador', { ...valid, generator: undefined }],
    ['con studentCount incoherente', { ...valid, studentCount: 5 }],
    ['con un alumno nulo', { ...valid, students: [null, ...valid.students.slice(1)] }],
    ['con un alumno sin id', withStudent({ studentId: '' })],
    ['con un alumno repetido', withStudent({ studentId: 'S02' })],
    ['con α no binaria', withStudent({ trueMastery: [2, 0, 0, 0, 0, 0] })],
    ['con α de probabilidades', withStudent({ trueMastery: [0.5, 0, 0, 0, 0, 0] })],
    ['con α corta', withStudent({ trueMastery: [1, 1] })],
    ['sin α', withStudent({ trueMastery: undefined })],
  ])('rechaza una clase %s', (_, syntheticClass) => {
    expectSimulationError(() => simulateResponse(syntheticClass as SyntheticClass, 'S02', CHOICE, table), 'INVALID_SYNTHETIC_CLASS');
  });

  const [first, second] = table.entries as [ResponseUniformTable['entries'][number], ResponseUniformTable['entries'][number]];

  it.each<[string, unknown]>([
    ['nula', null],
    ['sin entradas', { ...table, entries: undefined }],
    ['con otro generador', { ...table, generator: { algorithm: 'otro', version: 1 } }],
    ['sin ocasión', { ...table, occasion: '' }],
    ['con ids sin ordenar', { ...table, studentIds: ['S02', 'S01'] }],
    ['con ids repetidos', { ...table, studentIds: ['S01', 'S01'], entries: [first, first] }],
    ['con una entrada de menos', { ...table, entries: [first] }],
    ['con una clave repetida', { ...table, entries: [first, first] }],
    ['con entradas desordenadas', { ...table, entries: [second, first] }],
    ['con una entrada nula', { ...table, entries: [first, null] }],
    ['con un uniforme igual a 1', { ...table, entries: [{ ...first, correctness: 1 }, second] }],
    ['con un uniforme negativo', { ...table, entries: [{ ...first, correctness: -0.1 }, second] }],
    ['con un uniforme NaN', { ...table, entries: [{ ...first, distractor: Number.NaN }, second] }],
    ['con un uniforme infinito', { ...table, entries: [{ ...first, distractor: Number.POSITIVE_INFINITY }, second] }],
    ['con un uniforme de texto', { ...table, entries: [{ ...first, correctness: '0.5' }, second] }],
    ['con un uniforme nulo', { ...table, entries: [{ ...first, distractor: null }, second] }],
  ])('rechaza una tabla %s', (_, uniforms) => {
    expectSimulationError(() => simulateResponse(valid, 'S01', CHOICE, uniforms as ResponseUniformTable), 'INVALID_UNIFORM_TABLE');
  });

  it('rechaza una semilla incompatible', () => {
    const other = createResponseUniforms(SEED + 1, ['S01'], ['Q1'], 'pretest');

    expectSimulationError(() => simulateResponse(valid, 'S01', CHOICE, other), 'INCOMPATIBLE_SEED');
  });

  it('rechaza una semilla inválida en la tabla', () => {
    expectSimulationError(() => simulateResponse(valid, 'S01', CHOICE, { ...table, seed: -1 }), 'INVALID_SEED');
  });

  it('rechaza un alumno que no está en la clase', () => {
    expectSimulationError(() => simulateResponse(valid, 'S99', CHOICE, table), 'UNKNOWN_STUDENT');
  });

  it('la tabla puede cubrir un subconjunto, y fuera de él no hay respuesta', () => {
    const partial = createResponseUniforms(SEED, ['S01'], ['Q1'], 'pretest');

    expect(() => simulateResponse(valid, 'S01', CHOICE, partial)).not.toThrow();
    expectSimulationError(() => simulateResponse(valid, 'S02', CHOICE, partial), 'MISSING_UNIFORM');
    expectSimulationError(() => simulateResponse(valid, 'S01', NUMERIC, partial), 'MISSING_UNIFORM');
  });

  it.each<[string, unknown]>([
    ['nula', null],
    ['sin id', { ...CHOICE, id: '' }],
    ['de formato desconocido', { ...CHOICE, format: 'abierta' }],
    ['sin opciones', { ...CHOICE, options: undefined }],
    ['con una opción nula', { ...CHOICE, options: [null, ...CHOICE.options.slice(1)] }],
    ['con la correcta fuera de las opciones', { ...CHOICE, correctAnswer: 'z' }],
    ['sin distractores', { ...CHOICE, options: CHOICE.options.filter((option) => option.id === 'c') }],
    ['numérica no canónica', { ...NUMERIC, id: 'Q1', correctAnswer: '10/2' }],
  ])('rechaza una pregunta %s', (_, question) => {
    expectSimulationError(() => simulateResponse(valid, 'S01', question as Question, table), 'INVALID_QUESTION');
  });

  it('rechaza slip y guess inválidos en el ítem', () => {
    expectEngineError(() => simulateResponse(valid, 'S01', { ...CHOICE, guess: 0 }, table), 'INVALID_PARAMETERS');
  });

  it('rechaza una competencia desconocida en el ítem', () => {
    expectEngineError(() => simulateResponse(valid, 'S01', { ...CHOICE, primarySkill: 'XXX' }, table), 'UNKNOWN_SKILL');
  });
});

describe('contrato de la salida', () => {
  it('no muta entradas congeladas', () => {
    const syntheticClass = deepFreeze(createSyntheticClass(SEED, 3, KNOWLEDGE_GRAPH));
    const ids = deepFreeze(['S02', 'S01']);
    const table = deepFreeze(createResponseUniforms(SEED, ids, deepFreeze(['Q1']), 'pretest'));
    const question = deepFreeze(choiceQuestion('Q1', ['OPS']));

    expect(simulateResponse(syntheticClass, 'S01', question, table, deepFreeze({ slip: 0.2, guess: 0.3 }))).toBeTypeOf('string');
    expect(ids).toEqual(['S02', 'S01']);
  });

  it('la tabla sobrevive a JSON y da las mismas respuestas', () => {
    const syntheticClass = createSyntheticClass(SEED, 3, KNOWLEDGE_GRAPH);
    const table = createResponseUniforms(SEED, ['S01'], ['Q1'], 'pretest');
    const copy = serializedCopy(table) as ResponseUniformTable;

    expect(copy).toEqual(table);
    expect(simulateResponse(serializedCopy(syntheticClass) as SyntheticClass, 'S01', CHOICE, copy)).toBe(
      simulateResponse(syntheticClass, 'S01', CHOICE, table),
    );
  });
});

describe('integración con el motor', () => {
  const bank = RADAR_QUESTION_BANK;
  const syntheticClass = createSyntheticClass(7, 6, KNOWLEDGE_GRAPH);
  const observable = observableStudents(syntheticClass);
  const studentIds = observable.map((student) => student.studentId);
  const questionIds = bank.questions.map((question) => question.id);
  const uniforms = createResponseUniforms(7, studentIds, questionIds, 'pretest');

  function questionOf(id: string): Question {
    const question = bank.questions.find((candidate) => candidate.id === id);
    if (question === undefined) throw new Error(`Falta ${id}`);
    return question;
  }

  function record(state: DiagnosticState, questionId: string): DiagnosticState {
    const answer = simulateResponse(syntheticClass, state.studentId, questionOf(questionId), uniforms);
    const result = submitAnswer(state, questionId, answer, bank);
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  }

  function run(studentId: string, order: readonly string[]): DiagnosticState {
    return order.reduce(record, createInitialDiagnosticState(studentId));
  }

  function answersOf(state: DiagnosticState): ReadonlyMap<string, string> {
    return new Map(state.responses.map((item) => [item.questionId, item.answer]));
  }

  const order = fixedQuestionOrder(bank, KNOWLEDGE_GRAPH);

  it('registra respuestas sintéticas desde alumnos observables', () => {
    for (const { studentId } of observable) {
      expect(run(studentId, order).responses).toHaveLength(bank.questions.length);
    }
  });

  it('dos órdenes dan las mismas respuestas por alumno y pregunta', () => {
    for (const { studentId } of observable) {
      const forward = answersOf(run(studentId, order));
      const backward = answersOf(run(studentId, [...order].reverse()));

      expect(Object.fromEntries(backward)).toEqual(Object.fromEntries(forward));
    }
  });

  it('un método adaptativo y uno fijo ven lo mismo en las preguntas comunes', () => {
    const [studentId = ''] = studentIds;
    let adaptive = createInitialDiagnosticState(studentId);
    for (let step = 0; step < 6; step += 1) {
      const selection = selectNextQuestion(adaptive, bank);
      if (selection === null) throw new Error('Sin preguntas');
      adaptive = record(adaptive, selection.question.id);
    }
    const fixed = answersOf(run(studentId, order));

    expect(adaptive.responses).toHaveLength(6);
    for (const { questionId, answer } of adaptive.responses) {
      expect(fixed.get(questionId)).toBe(answer);
    }
  });

  it('otro alumno en medio no altera las respuestas', () => {
    const [first = '', second = ''] = studentIds;
    const alone = answersOf(run(first, order));
    run(second, order);

    expect(Object.fromEntries(answersOf(run(first, order)))).toEqual(Object.fromEntries(alone));
  });

  it('la verdad y los uniformes no entran en el estado diagnóstico', () => {
    const [studentId = ''] = studentIds;
    const state = run(studentId, order.slice(0, 6));
    const text = JSON.stringify(state);

    expect(Object.keys(state).sort()).toEqual(['joint', 'priorConfig', 'responses', 'skillOrder', 'studentId']);
    for (const hidden of ['trueMastery', 'groupId', 'correctness', 'distractor', 'uniform', 'occasion']) {
      expect(text).not.toContain(hidden);
    }
    for (const response of state.responses) {
      expect(Object.keys(response).sort()).toEqual(['answer', 'isCorrect', 'normalizedAnswer', 'questionId']);
    }
  });

  it('no altera el banco', () => {
    const before = serializedCopy(bank);
    run(studentIds[0] ?? '', order);
    simulateResponse(syntheticClass, studentIds[0] ?? '', questionOf(order[0] ?? ''), uniforms, { slip: 0.3, guess: 0.4 });

    expect(serializedCopy(bank)).toEqual(before);
  });
});
