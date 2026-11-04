import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_GRAPH,
  RADAR_QUESTION_BANK,
  createInitialDiagnosticState,
  marginals,
  selectNextQuestion,
  submitAnswer,
} from '../../src/engine/index.ts';
import type {
  AnswerError,
  AnswerErrorCode,
  AnswerRecord,
  AnswerValue,
  DiagnosticState,
  Question,
  QuestionBank,
  Result,
} from '../../src/engine/index.ts';
import { bankOf, choiceQuestion, deepFreeze, numericQuestion } from './support/bank.ts';
import { q } from './support/exact.ts';
import { exactPosterior, expectClose, serializedCopy } from './support/inference.ts';

const CHOICE = choiceQuestion('C1', ['OPS']);
const FRACTION = numericQuestion('N1', ['NEG'], '3/4');
const INTEGER = numericQuestion('N2', ['FRA'], '5/1');
const ZERO = numericQuestion('N3', ['JER'], '0/1');
const BANK = bankOf(CHOICE, FRACTION, INTEGER, ZERO);

const initial = createInitialDiagnosticState('S01');

function ok(result: Result<DiagnosticState, AnswerError>): DiagnosticState {
  if (!result.ok) throw new Error(`Respuesta rechazada: ${result.error.code}`);
  return result.value;
}

function expectRejected(
  result: Result<DiagnosticState, AnswerError>,
  code: AnswerErrorCode,
  questionId: string | null,
): void {
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.error).toMatchObject({ code, questionId });
  expect(result.error.message).not.toBe('');
}

function answered(id: string, answer: AnswerValue, state = initial, bank = BANK): DiagnosticState {
  return ok(submitAnswer(state, id, answer, bank));
}

describe('opción múltiple', () => {
  it('corrige por id de opción', () => {
    const correct = answered('C1', 'c');
    const wrong = answered('C1', 'a');

    expect(correct.responses).toEqual([{ questionId: 'C1', answer: 'c', normalizedAnswer: 'c', isCorrect: true }]);
    expect(wrong.responses).toEqual([{ questionId: 'C1', answer: 'a', normalizedAnswer: 'a', isCorrect: false }]);
  });

  it('no corrige por texto ni por posición', () => {
    for (const answer of ['Tres', '2', '3', 'C', ' c', 'c ']) {
      expectRejected(submitAnswer(initial, 'C1', answer, BANK), 'UNKNOWN_OPTION', 'C1');
    }
  });

  it('no depende de la posición de la opción correcta', () => {
    const reversed = choiceQuestion('C1', ['OPS'], { options: [...CHOICE.options].reverse() });

    expect(answered('C1', 'c', initial, bankOf(reversed)).responses[0]?.isCorrect).toBe(true);
  });
});

describe('respuesta numérica', () => {
  it.each([
    ['3/4'],
    ['6/8'],
    ['-3/-4'],
    ['+3/4'],
    ['  3/4  '],
    ['75/100'],
  ])('acepta %j como equivalente a 3/4', (answer) => {
    const [record] = answered('N1', answer).responses;

    expect(record).toEqual({ questionId: 'N1', answer, normalizedAnswer: '3/4', isCorrect: true });
  });

  it.each([['5'], ['+5'], ['5/1'], ['10/2'], ['-5/-1']])('acepta %j como el entero cinco', (answer) => {
    expect(answered('N2', answer).responses[0]?.isCorrect).toBe(true);
  });

  it.each([['0'], ['-0'], ['0/5'], ['0/-5']])('acepta %j como cero', (answer) => {
    const [record] = answered('N3', answer).responses;

    expect(record?.normalizedAnswer).toBe('0/1');
    expect(record?.isCorrect).toBe(true);
  });

  it('una respuesta bien formada pero errónea cuenta como fallo', () => {
    const [record] = answered('N1', '-3/4').responses;

    expect(record).toEqual({ questionId: 'N1', answer: '-3/4', normalizedAnswer: '-3/4', isCorrect: false });
  });

  it.each([['1.5'], ['1 / 2'], ['abc'], [''], ['1e3'], ['1+2'], ['0,75']])(
    'un formato inválido no cuenta como fallo: %j',
    (answer) => {
      expectRejected(submitAnswer(initial, 'N1', answer, BANK), 'INVALID_NUMERIC_FORMAT', 'N1');
    },
  );

  it.each([['3/0'], ['0/0'], ['-1/0']])('rechaza el denominador cero: %s', (answer) => {
    expectRejected(submitAnswer(initial, 'N1', answer, BANK), 'ZERO_DENOMINATOR', 'N1');
  });
});

describe('actualización y registro', () => {
  it('un acierto actualiza una sola vez: marginal 18/23', () => {
    const state = answered('C1', 'c');

    expectClose(marginals(state.joint).OPS, q(18, 23));
    expect(state.responses).toHaveLength(1);
  });

  it('un fallo actualiza una sola vez: marginal 2/17', () => {
    const state = answered('N1', '1/2');

    expectClose(marginals(state.joint).NEG, q(2, 17));
    expect(state.responses).toHaveLength(1);
  });

  it('dos respuestas válidas producen dos actualizaciones, no más', () => {
    const first = answered('C1', 'c');
    const second = answered('N1', '1/2', first);
    const expected = exactPosterior([
      { required: ['OPS'], correct: true },
      { required: ['NEG'], correct: false },
    ]);

    expect(second.responses.map((record) => record.questionId)).toEqual(['C1', 'N1']);
    second.joint.forEach((mass, index) => {
      expectClose(mass, expected[index] ?? q(-1));
    });
  });

  it('usa R_q completo en preguntas multicompetencia', () => {
    const bank = bankOf(choiceQuestion('M1', ['OPS', 'NEG']));
    const result = marginals(answered('M1', 'c', initial, bank).joint);

    expectClose(result.OPS, q(23, 33));
    expectClose(result.NEG, q(23, 33));
  });

  it('conserva studentId, skillOrder y priorConfig', () => {
    const start = createInitialDiagnosticState('S07', { marginals: { OPS: 0.8 }, compatibility: { epsilon: 0.2 } }, KNOWLEDGE_GRAPH);
    const state = answered('C1', 'c', start);

    expect(state.studentId).toBe('S07');
    expect(state.skillOrder).toEqual(start.skillOrder);
    expect(state.priorConfig).toEqual(start.priorConfig);
    expect(state.joint).not.toEqual(start.joint);
  });

  it('devuelve un estado nuevo y no altera el anterior', () => {
    const state = deepFreeze(structuredClone(initial));
    const before = structuredClone(state);

    const next = answered('C1', 'c', state);

    expect(next).not.toBe(state);
    expect(state).toEqual(before);
    expect(next.responses).not.toBe(state.responses);
  });
});

describe('respuestas rechazadas', () => {
  const start = deepFreeze(answered('C1', 'c'));

  it.each<[string, string, AnswerValue, AnswerErrorCode]>([
    ['pregunta desconocida', 'X9', 'c', 'UNKNOWN_QUESTION'],
    ['pregunta repetida', 'C1', 'a', 'REPEATED_QUESTION'],
    ['denominador cero', 'N1', '1/0', 'ZERO_DENOMINATOR'],
    ['formato inválido', 'N1', 'abc', 'INVALID_NUMERIC_FORMAT'],
  ])('%s: sin actualización ni registro', (_, id, answer, code) => {
    const before = structuredClone(start);

    expectRejected(submitAnswer(start, id, answer, BANK), code, id);
    expect(start).toEqual(before);
  });

  it('una opción inexistente se rechaza sin actualizar', () => {
    expectRejected(submitAnswer(initial, 'C1', 'z', BANK), 'UNKNOWN_OPTION', 'C1');
    expect(initial.responses).toEqual([]);
  });

  it('el error de una respuesta no impide responder después', () => {
    expectRejected(submitAnswer(initial, 'N1', 'abc', BANK), 'INVALID_NUMERIC_FORMAT', 'N1');

    expect(answered('N1', '3/4').responses).toHaveLength(1);
  });

  it.each([[3], [null], [undefined], [true]])('rechaza una respuesta que no es cadena: %j', (answer) => {
    expectRejected(submitAnswer(initial, 'N1', answer as unknown as string, BANK), 'INVALID_ANSWER_TYPE', 'N1');
  });
});

describe('historial y estado inválidos', () => {
  const valid = answered('C1', 'c');
  const [record] = valid.responses as readonly [AnswerRecord];

  function expectInvalidHistory(responses: unknown): void {
    const state = { ...valid, responses } as DiagnosticState;
    const result = submitAnswer(state, 'N1', '3/4', BANK);

    expectRejected(result, 'INVALID_STATE', 'N1');
    if (!result.ok) expect(result.error.causeCode).toBe('INVALID_HISTORY');
  }

  it('rechaza un historial que no es una lista', () => {
    expectInvalidHistory('C1');
    expectInvalidHistory(undefined);
  });

  it('rechaza ids repetidos', () => {
    expectInvalidHistory([record, record]);
  });

  it('rechaza una pregunta desconocida y registros mal formados', () => {
    expectInvalidHistory([{ ...record, questionId: 'X9' }]);
    expectInvalidHistory([null]);
    expectInvalidHistory([{}]);
  });

  it('rechaza registros incoherentes con el banco', () => {
    expectInvalidHistory([{ ...record, isCorrect: false }]);
    expectInvalidHistory([{ ...record, isCorrect: 'true' }]);
    expectInvalidHistory([{ ...record, answer: 'z', normalizedAnswer: 'z' }]);
    expectInvalidHistory([{ ...record, normalizedAnswer: 'a' }]);
    expectInvalidHistory([{ questionId: 'N1', answer: '6/8', normalizedAnswer: '6/8', isCorrect: true }]);
    expectInvalidHistory([{ questionId: 'N1', answer: 'abc', normalizedAnswer: 'abc', isCorrect: false }]);
    expectInvalidHistory([{ ...record, answer: 3 }]);
  });

  it('no compara el posterior con el prior', () => {
    const elsewhere = { ...valid, joint: initial.joint };

    expect(() => answered('N1', '3/4', elsewhere)).not.toThrow();
  });

  it.each([
    ['skillOrder permutado', { skillOrder: ['NEG', 'OPS', 'FRA', 'JER', 'ALG', 'ECU'] }, 'INVALID_STATE'],
    ['skillOrder corto', { skillOrder: ['OPS'] }, 'INVALID_STATE'],
    ['skillOrder ausente', { skillOrder: undefined }, 'INVALID_STATE'],
    ['joint de otra longitud', { joint: [1] }, 'INVALID_DISTRIBUTION'],
    ['joint sin normalizar', { joint: initial.joint.map((mass) => mass * 2) }, 'INVALID_DISTRIBUTION'],
    ['studentId vacío', { studentId: ' ' }, 'INVALID_STATE'],
    ['priorConfig ausente', { priorConfig: undefined }, 'INVALID_PRIOR'],
    ['priorConfig incompleta', { priorConfig: { marginals: { OPS: 0.5 }, compatibility: null } }, 'INVALID_PRIOR'],
  ])('rechaza %s', (_, change, causeCode) => {
    const state = { ...valid, ...change } as DiagnosticState;
    const result = submitAnswer(state, 'N1', '3/4', BANK);

    expectRejected(result, 'INVALID_STATE', 'N1');
    if (!result.ok) expect(result.error.causeCode).toBe(causeCode);
  });

  it('rechaza un estado nulo', () => {
    expectRejected(submitAnswer(null as unknown as DiagnosticState, 'N1', '3/4', BANK), 'INVALID_STATE', 'N1');
  });
});

describe('errores del banco y de la inferencia', () => {
  it('un banco inválido da un error con su causa', () => {
    const result = submitAnswer(initial, 'C1', 'c', bankOf(choiceQuestion('C1', ['XXX'])));

    expectRejected(result, 'INVALID_BANK', 'C1');
    if (!result.ok) expect(result.error.causeCode).toBe('UNKNOWN_SKILL');
  });

  it('un banco mal formado da un error tipado', () => {
    expectRejected(submitAnswer(initial, 'C1', 'c', null as unknown as QuestionBank), 'INVALID_BANK', 'C1');
  });

  it('una actualización no normalizable da un error con su causa', () => {
    const bank = bankOf(choiceQuestion('C1', ['OPS'], { guess: 1e-301 }));
    const point = { ...initial, joint: initial.joint.map((_, index) => (index === 0 ? 1 : 0)) };
    const result = submitAnswer(point, 'C1', 'c', bank);

    expectRejected(result, 'INFERENCE_FAILED', 'C1');
    if (!result.ok) expect(result.error.causeCode).toBe('INVALID_NORMALIZATION');
  });

  it('no oculta fallos inesperados', () => {
    const hostile: Question = Object.defineProperty({ ...CHOICE }, 'slip', {
      enumerable: true,
      get() {
        throw new TypeError('fallo inesperado');
      },
    });

    expect(() => submitAnswer(initial, 'C1', 'c', bankOf(hostile))).toThrow(TypeError);
  });
});

describe('serialización', () => {
  it('el estado se serializa y sigue siendo utilizable', () => {
    const state = answered('N1', ' 6/8 ');
    const copy = serializedCopy(state) as DiagnosticState;

    expect(copy).toEqual(state);
    expect(answered('C1', 'c', copy).responses).toHaveLength(2);
  });

  it('el error se serializa', () => {
    const result = submitAnswer(initial, 'X9', 'c', BANK);

    expect(serializedCopy(result)).toEqual(result);
  });
});

describe('flujo con el banco real', () => {
  it('selecciona y responde hasta agotar el banco sin repetir', () => {
    let state = createInitialDiagnosticState('S01');
    const asked: string[] = [];

    for (let selected = selectNextQuestion(state, RADAR_QUESTION_BANK); selected !== null; ) {
      const { question } = selected;
      expect(asked).not.toContain(question.id);
      expect(selected.candidates).toHaveLength(30 - asked.length);
      asked.push(question.id);

      state = ok(submitAnswer(state, question.id, question.correctAnswer, RADAR_QUESTION_BANK));
      selected = selectNextQuestion(state, RADAR_QUESTION_BANK);
    }

    expect(asked).toHaveLength(30);
    expect(new Set(asked).size).toBe(30);
    expect(state.responses.every((record) => record.isCorrect)).toBe(true);
    expect(state.responses.map((record) => record.questionId)).toEqual(asked);
    for (const probability of Object.values(marginals(state.joint))) {
      expect(probability).toBeGreaterThan(0.9);
    }
  });

  it('una respuesta real cambia la siguiente selección posible', () => {
    const first = selectNextQuestion(initial, RADAR_QUESTION_BANK);
    expect(first).not.toBeNull();
    if (first === null) return;

    const next = ok(submitAnswer(initial, first.question.id, first.question.correctAnswer, RADAR_QUESTION_BANK));
    const second = selectNextQuestion(next, RADAR_QUESTION_BANK);

    expect(second?.question.id).not.toBe(first.question.id);
    expect(second?.candidates.map((item) => item.questionId)).not.toContain(first.question.id);
  });
});
