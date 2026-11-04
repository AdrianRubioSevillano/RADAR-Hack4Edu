import { describe, expect, it } from 'vitest';
import { RADAR_QUESTION_BANK } from '../../src/engine/index.ts';
import type { MultipleChoiceQuestion, Question, QuestionId } from '../../src/engine/index.ts';
import {
  add,
  coefficientOf,
  div,
  minus,
  mul,
  parsePoly,
  plus,
  q,
  samePoly,
  scale,
  show,
  solveLinear,
  sub,
  term,
} from './support/exact.ts';
import type { Exact, Poly } from './support/exact.ts';

// Cada ítem se recalcula aquí a partir de los datos de su enunciado, sin mirar
// correctAnswer. `sources` ata el cálculo al texto real del enunciado.
interface ValueOracle {
  readonly kind: 'value';
  readonly sources: readonly string[];
  readonly compute: () => Exact;
}

interface ExpressionOracle {
  readonly kind: 'expression';
  readonly sources: readonly string[];
  readonly compute: () => Poly;
}

type Oracle = ValueOracle | ExpressionOracle;

const value = (sources: readonly string[], compute: () => Exact): ValueOracle => ({ kind: 'value', sources, compute });
const expression = (sources: readonly string[], compute: () => Poly): ExpressionOracle => ({
  kind: 'expression',
  sources,
  compute,
});

const x = term(q(1), 'x');
const constant = (n: number, d = 1): Poly => term(q(n, d));
const times = (coefficient: number, poly: Poly): Poly => scale(poly, q(coefficient));

const ORACLES: Readonly<Record<QuestionId, Oracle>> = {
  'OPS-01': value(['47 + 38'], () => add(q(47), q(38))),
  'OPS-02': value(['9·8'], () => mul(q(9), q(8))),
  'OPS-03': value(['304 - 178'], () => sub(q(304), q(178))),
  'OPS-04': value(['144 cromos', '6 amigos'], () => div(q(144), q(6))),
  'OPS-05': value(['24 filas', '15 lápices', '3 cajas'], () => mul(mul(q(24), q(15)), q(3))),

  'NEG-01': value(['-5 + 8'], () => add(q(-5), q(8))),
  'NEG-02': value(['(-3)·(-4)'], () => mul(q(-3), q(-4))),
  'NEG-03': value(['4 - (-6)'], () => sub(q(4), q(-6))),
  'NEG-04': value(['-4 °C', 'subido 9 °C'], () => add(q(-4), q(9))),
  'NEG-05': value(['(-2)·(-3)·(-4)'], () => mul(mul(q(-2), q(-3)), q(-4))),

  'FRA-01': value(['18/24'], () => q(18, 24)),
  'FRA-02': value(['2/3 · 9/4'], () => mul(q(2, 3), q(9, 4))),
  'FRA-03': value(['1/2 + 1/3'], () => add(q(1, 2), q(1, 3))),
  'FRA-04': value(['1/4 - 5/6'], () => sub(q(1, 4), q(5, 6))),
  'FRA-05': value(['3/4 : 5/8'], () => div(q(3, 4), q(5, 8))),

  'JER-01': value(['7 + 3·2'], () => add(q(7), mul(q(3), q(2)))),
  'JER-02': value(['20 - 12 : 4'], () => sub(q(20), div(q(12), q(4)))),
  'JER-03': value(['2·(5 + 3) - 4'], () => sub(mul(q(2), add(q(5), q(3))), q(4))),
  'JER-04': value(['-2 + 3·(-4)'], () => add(q(-2), mul(q(3), q(-4)))),
  'JER-05': value(['1/2 + 1/3 · 3/4'], () => add(q(1, 2), mul(q(1, 3), q(3, 4)))),

  'ALG-01': expression(['3x + 2x'], () => plus(times(3, x), times(2, x))),
  'ALG-02': value(['4x + 3 - x + 2'], () =>
    coefficientOf(plus(times(4, x), constant(3), times(-1, x), constant(2)), 'x'),
  ),
  'ALG-03': expression(['2(x + 3) + x'], () => plus(times(2, plus(x, constant(3))), x)),
  'ALG-04': expression(['3x - (x - 4)'], () => minus(times(3, x), minus(x, constant(4)))),
  'ALG-05': value(['x/2 + x/3'], () => coefficientOf(plus(scale(x, q(1, 2)), scale(x, q(1, 3))), 'x')),

  'ECU-01': value(['2x + 3 = 11'], () => solveLinear(plus(times(2, x), constant(3)), constant(11))),
  'ECU-02': value(['3x - 4 = 17'], () => solveLinear(minus(times(3, x), constant(4)), constant(17))),
  'ECU-03': value(['3(x - 2) = 12'], () => solveLinear(times(3, minus(x, constant(2))), constant(12))),
  'ECU-04': value(['5x + 3 = 2x - 9'], () =>
    solveLinear(plus(times(5, x), constant(3)), minus(times(2, x), constant(9))),
  ),
  'ECU-05': value(['x/2 + 1/3 = 5/6'], () =>
    solveLinear(plus(scale(x, q(1, 2)), constant(1, 3)), constant(5, 6)),
  ),
};

function asMultipleChoice(question: Question): MultipleChoiceQuestion {
  if (question.format !== 'multipleChoice') {
    throw new Error(`${question.id} debería ser de opción múltiple`);
  }
  return question;
}

function assertValueAnswer(question: Question, expected: string): void {
  if (question.format === 'numeric') {
    expect(question.correctAnswer).toBe(expected);
    return;
  }
  const matching = question.options.filter((option) => option.value === expected);
  expect(matching.map((option) => option.id)).toEqual([question.correctAnswer]);
}

function assertExpressionAnswer(question: Question, expected: Poly): void {
  const { options, correctAnswer } = asMultipleChoice(question);
  const matching = options.filter((option) => samePoly(parsePoly(option.text), expected));
  expect(matching.map((option) => option.id)).toEqual([correctAnswer]);
}

describe('utilidades de cálculo de los tests', () => {
  it('distingue expresiones que coinciden en un valor de x pero no son equivalentes', () => {
    const a = parsePoly('2x + 4');
    const b = parsePoly('4x');

    expect(samePoly(a, b)).toBe(false);
    expect(samePoly(parsePoly('x + x + 4'), a)).toBe(true);
  });

  it('rechaza textos que no sabe analizar', () => {
    expect(() => parsePoly('2x * 3')).toThrow();
  });

  it('no resuelve ecuaciones sin solución única', () => {
    expect(() => solveLinear(x, x)).toThrow();
    expect(show(solveLinear(times(2, x), constant(3)))).toBe('3/2');
  });
});

describe('respuestas del banco RADAR calculadas de forma independiente', () => {
  it('hay un cálculo para cada pregunta', () => {
    const ids = RADAR_QUESTION_BANK.questions.map((question) => question.id).sort();

    expect(ids).toEqual(Object.keys(ORACLES).sort());
  });

  it.each(RADAR_QUESTION_BANK.questions.map((question) => [question.id, question] as const))(
    '%s',
    (id, question) => {
      const oracle = ORACLES[id];
      expect(oracle).toBeDefined();
      if (oracle === undefined) return;

      for (const source of oracle.sources) {
        expect(question.statement).toContain(source);
      }

      if (oracle.kind === 'value') {
        assertValueAnswer(question, show(oracle.compute()));
      } else {
        assertExpressionAnswer(question, oracle.compute());
      }
    },
  );

  it('los ítems algebraicos de opción múltiple tienen opciones no equivalentes entre sí', () => {
    for (const id of ['ALG-01', 'ALG-03', 'ALG-04']) {
      const question = RADAR_QUESTION_BANK.questions.find((candidate) => candidate.id === id);
      expect(question).toBeDefined();
      if (question === undefined) return;

      const polys = asMultipleChoice(question).options.map((option) => parsePoly(option.text));
      for (const [index, poly] of polys.entries()) {
        for (const other of polys.slice(index + 1)) {
          expect(samePoly(poly, other)).toBe(false);
        }
      }
    }
  });
});
