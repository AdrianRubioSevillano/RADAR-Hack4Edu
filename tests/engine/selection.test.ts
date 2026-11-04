import { describe, expect, it } from 'vitest';
import {
  QuestionBankError,
  RADAR_QUESTION_BANK,
  createInitialDiagnosticState,
  selectNextQuestion,
  submitAnswer,
} from '../../src/engine/index.ts';
import type {
  CandidateExplanation,
  DiagnosticState,
  JointDistribution,
  Question,
  QuestionBank,
  QuestionSelection,
} from '../../src/engine/index.ts';
import { bestCandidateId, checkedEig, pairEntropy } from '../../src/engine/selection.ts';
import { bankOf, choiceQuestion, deepFreeze, numericQuestion } from './support/bank.ts';
import { q } from './support/exact.ts';
import {
  ORDER,
  binaryBits,
  expectClose,
  expectInferenceError,
  marginalOf,
  referenceEvidence,
  serializedCopy,
} from './support/inference.ts';

const initial = createInitialDiagnosticState('S01');

function stateWith(joint: JointDistribution): DiagnosticState {
  return { ...initial, joint };
}

function pointMass(index: number): JointDistribution {
  return Array.from({ length: 64 }, (_, position) => (position === index ? 1 : 0));
}

function selection(state: DiagnosticState, bank: QuestionBank): QuestionSelection {
  const result = selectNextQuestion(state, bank);
  if (result === null) throw new Error('Se esperaba una selección');
  return result;
}

function candidate(result: QuestionSelection, id: string): CandidateExplanation {
  const found = result.candidates.find((item) => item.questionId === id);
  if (found === undefined) throw new Error(`Falta la candidata ${id}`);
  return found;
}

function explain(joint: JointDistribution, question: Question): CandidateExplanation {
  return candidate(selection(stateWith(joint), bankOf(question)), question.id);
}

// Conjunta con correlación entre OPS, NEG y ALG, sin forma de producto.
const CORRELATED: JointDistribution = (() => {
  const weights = Array.from({ length: 64 }, (_, index) => 1 + ((index * 7) % 11) + (index === 19 ? 40 : 0));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => weight / total);
})();

describe('EIG frente a la formulación independiente', () => {
  it.each([
    ['una competencia, prior uniforme', initial.joint, ['OPS']],
    ['dos competencias, prior uniforme', initial.joint, ['OPS', 'NEG']],
    ['tres competencias, prior uniforme', initial.joint, ['NEG', 'ALG', 'ECU']],
    ['una competencia, conjunta correlacionada', CORRELATED, ['ALG']],
    ['varias competencias, conjunta correlacionada', CORRELATED, ['OPS', 'NEG', 'ALG']],
  ])('%s', (_, joint, required) => {
    const question = choiceQuestion('Q1', required, { slip: 0.15, guess: 0.3 });
    const expected = referenceEvidence(joint, required, 0.15, 0.3);
    const result = explain(joint, question);

    expectClose(result.eig, expected.eig);
    expectClose(result.correctProbability, expected.correctProbability);
    expectClose(result.incorrectProbability, expected.incorrectProbability);
    expect(result.eig).toBeGreaterThan(0);
  });

  it('coincide con la expresión cerrada de una competencia', () => {
    // H_b(23/40) - (H_b(0.1) + H_b(0.25)) / 2
    const expected = binaryBits(23 / 40) - (binaryBits(0.1) + binaryBits(0.25)) / 2;

    expectClose(explain(initial.joint, choiceQuestion('Q1', ['OPS'])).eig, expected);
  });

  it('una pregunta multicompetencia no informa sobre un estado ya conocido', () => {
    const known = explain(pointMass(63), choiceQuestion('Q1', ['OPS', 'NEG']));

    expect(known.eig).toBe(0);
  });

  it('sigue coincidiendo tras observar respuestas', () => {
    const bank = bankOf(choiceQuestion('Q1', ['OPS']), choiceQuestion('Q2', ['OPS', 'NEG']));
    const answered = submitAnswer(initial, 'Q1', 'c', bank);
    expect(answered.ok).toBe(true);
    if (!answered.ok) return;

    const expected = referenceEvidence(answered.value.joint, ['OPS', 'NEG'], 0.1, 0.25);
    expectClose(candidate(selection(answered.value, bank), 'Q2').eig, expected.eig);
  });
});

describe('prior puntual', () => {
  it.each([
    ['domina', 63, 0.9, 0.1],
    ['no domina', 0, 0.25, 0.75],
  ])('%s: EIG cero con probabilidades conocidas', (_, index, correct, incorrect) => {
    const result = explain(pointMass(index), choiceQuestion('Q1', ['OPS']));

    expect(result.eig).toBe(0);
    expect(result.correctProbability).toBe(correct);
    expect(result.incorrectProbability).toBe(incorrect);
    expect(result.posteriorIfCorrect).toEqual(pointMass(index));
    expect(result.posteriorIfIncorrect).toEqual(pointMass(index));
  });

  it('una candidata con EIG cero sigue siendo elegible', () => {
    const bank = bankOf(choiceQuestion('Q2', ['ALG']), choiceQuestion('Q1', ['OPS']));
    const result = selection(stateWith(pointMass(0)), bank);

    expect(result.question.id).toBe('Q1');
    expect(result.candidates.map((item) => item.eig)).toEqual([0, 0]);
  });
});

describe('posteriores y marginales hipotéticos', () => {
  it('una competencia: 18/23 tras acierto y 2/17 tras fallo', () => {
    const result = explain(initial.joint, choiceQuestion('Q1', ['ALG']));

    expectClose(result.marginalsIfCorrect.ALG, q(18, 23));
    expectClose(result.marginalsIfIncorrect.ALG, q(2, 17));
    expectClose(result.marginalsIfCorrect.OPS, 0.5);
    expectClose(result.marginalsIfIncorrect.ECU, 0.5);
    expectClose(result.correctProbability, q(23, 40));
    expectClose(result.incorrectProbability, q(17, 40));
  });

  it('dos competencias: 23/33 tras acierto y 17/47 tras fallo', () => {
    const result = explain(initial.joint, choiceQuestion('Q1', ['OPS', 'NEG']));

    expectClose(result.marginalsIfCorrect.OPS, q(23, 33));
    expectClose(result.marginalsIfCorrect.NEG, q(23, 33));
    expectClose(result.marginalsIfIncorrect.OPS, q(17, 47));
    expectClose(result.correctProbability, 0.4125);
  });

  it('coinciden estado a estado con la formulación independiente', () => {
    const required = ['OPS', 'ALG'];
    const expected = referenceEvidence(CORRELATED, required, 0.1, 0.25);
    const result = explain(CORRELATED, choiceQuestion('Q1', required));

    result.posteriorIfCorrect.forEach((mass, index) => {
      expectClose(mass, expected.posteriorIfCorrect[index] ?? Number.NaN);
    });
    result.posteriorIfIncorrect.forEach((mass, index) => {
      expectClose(mass, expected.posteriorIfIncorrect[index] ?? Number.NaN);
    });
    for (const skill of ORDER) {
      expectClose(result.marginalsIfCorrect[skill], marginalOf(expected.posteriorIfCorrect, skill));
      expectClose(result.marginalsIfIncorrect[skill], marginalOf(expected.posteriorIfIncorrect, skill));
    }
  });

  it('la media ponderada de los posteriores recupera la conjunta', () => {
    const result = explain(CORRELATED, choiceQuestion('Q1', ['NEG', 'JER']));

    CORRELATED.forEach((mass, index) => {
      const recovered =
        result.correctProbability * (result.posteriorIfCorrect[index] ?? Number.NaN) +
        result.incorrectProbability * (result.posteriorIfIncorrect[index] ?? Number.NaN);
      expectClose(recovered, mass);
    });
  });

  it('calcula P(fallo) sin restar a 1', () => {
    const result = explain(pointMass(63), choiceQuestion('Q1', ['OPS'], { slip: 1e-12 }));

    expect(Math.abs(result.incorrectProbability - 1e-12) / 1e-12).toBeLessThan(1e-12);
    expectClose(result.correctProbability + result.incorrectProbability, 1);
  });

  it('no altera la distribución del estado', () => {
    const state = deepFreeze({ ...stateWith([...CORRELATED]) });

    selectNextQuestion(state, bankOf(choiceQuestion('Q1', ['ALG'])));

    expect(state.joint).toEqual(CORRELATED);
  });
});

describe('reducción esperada de entropía por competencia', () => {
  it('con una competencia coincide con la EIG y es nula en las demás', () => {
    const result = explain(initial.joint, choiceQuestion('Q1', ['ALG']));

    expectClose(result.expectedEntropyReduction.ALG, result.eig);
    for (const skill of ORDER.filter((item) => item !== 'ALG')) {
      expectClose(result.expectedEntropyReduction[skill], 0);
    }
  });

  it('con dos competencias coincide con el cálculo a mano', () => {
    const result = explain(initial.joint, choiceQuestion('Q1', ['OPS', 'NEG']));
    const expected = 1 - 0.4125 * binaryBits(23 / 33) - 0.5875 * binaryBits(17 / 47);

    expectClose(result.expectedEntropyReduction.OPS, expected);
    expectClose(result.expectedEntropyReduction.NEG, expected);
  });

  it('no cuenta dos veces la evidencia: ninguna competencia supera la EIG', () => {
    for (const required of [['OPS', 'NEG'], ['NEG', 'ALG', 'ECU']]) {
      const result = explain(CORRELATED, choiceQuestion('Q1', required));

      for (const skill of ORDER) {
        expect(result.expectedEntropyReduction[skill]).toBeLessThanOrEqual(result.eig + 1e-12);
      }
    }
  });

  it('una rama puede aumentar la entropía aunque la reducción esperada sea positiva', () => {
    const state = createInitialDiagnosticState('S01', { marginals: { OPS: 0.1 } });
    const result = candidate(selection(state, bankOf(choiceQuestion('Q1', ['OPS']))), 'Q1');
    const branchReduction = binaryBits(0.1) - binaryBits(result.marginalsIfCorrect.OPS ?? Number.NaN);

    expect(branchReduction).toBeLessThan(0);
    expect(result.expectedEntropyReduction.OPS).toBeGreaterThan(0);
  });
});

describe('candidatas', () => {
  it('incluye todas las no respondidas, ordenadas por id', () => {
    const bank = bankOf(choiceQuestion('Q3', ['ALG']), choiceQuestion('Q1', ['OPS']), numericQuestion('Q2', ['NEG'], '1/2'));

    expect(selection(initial, bank).candidates.map((item) => item.questionId)).toEqual(['Q1', 'Q2', 'Q3']);
  });

  it('excluye las respondidas', () => {
    const bank = bankOf(choiceQuestion('Q1', ['OPS']), choiceQuestion('Q2', ['NEG']));
    const answered = submitAnswer(initial, 'Q1', 'c', bank);
    expect(answered.ok).toBe(true);
    if (!answered.ok) return;

    const result = selection(answered.value, bank);
    expect(result.candidates.map((item) => item.questionId)).toEqual(['Q2']);
    expect(result.question.id).toBe('Q2');
  });

  it('elige la pregunta de mayor EIG', () => {
    const bank = bankOf(
      choiceQuestion('Q1', ['OPS'], { guess: 0.45 }),
      choiceQuestion('Q2', ['OPS'], { guess: 0.05, slip: 0.05 }),
      choiceQuestion('Q3', ['OPS', 'NEG', 'FRA']),
    );

    expect(selection(initial, bank).question.id).toBe('Q2');
  });

  it('devuelve la pregunta completa del banco', () => {
    const bank = bankOf(choiceQuestion('Q1', ['OPS']));

    expect(selection(initial, bank).question).toBe(bank.questions[0]);
  });
});

describe('desempate', () => {
  it('un empate exacto se resuelve por el menor id', () => {
    const bank = bankOf(choiceQuestion('Q2', ['OPS']), choiceQuestion('Q1', ['NEG']), choiceQuestion('Q3', ['FRA']));

    expect(selection(initial, bank).question.id).toBe('Q1');
  });

  it('dentro de la tolerancia gana el menor id aunque su EIG sea algo menor', () => {
    const bank = bankOf(choiceQuestion('Q2', ['OPS']), choiceQuestion('Q1', ['NEG'], { guess: 0.25 + 3e-13 }));
    const result = selection(initial, bank);
    const distance = candidate(result, 'Q2').eig - candidate(result, 'Q1').eig;

    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThanOrEqual(1e-12);
    expect(result.question.id).toBe('Q1');
  });

  it('fuera de la tolerancia gana la mayor EIG', () => {
    const bank = bankOf(choiceQuestion('Q2', ['OPS']), choiceQuestion('Q1', ['NEG'], { guess: 0.25 + 1e-9 }));

    expect(selection(initial, bank).question.id).toBe('Q2');
  });

  it('mide la distancia al máximo global, no entre pares: empate encadenado', () => {
    const chain = [
      { questionId: 'A', eig: 0.5 },
      { questionId: 'B', eig: 0.5 + 0.8e-12 },
      { questionId: 'C', eig: 0.5 + 1.6e-12 },
    ];

    expect(bestCandidateId(chain)).toBe('B');
    expect(bestCandidateId([...chain].reverse())).toBe('B');
  });

  it('incluye el límite de distancia exacta', () => {
    expect(
      bestCandidateId([
        { questionId: 'B', eig: 1e-12 },
        { questionId: 'A', eig: 0 },
      ]),
    ).toBe('A');
  });

  it('compara ids sin depender de la configuración regional', () => {
    expect(
      bestCandidateId([
        { questionId: 'a', eig: 0 },
        { questionId: 'Z', eig: 0 },
      ]),
    ).toBe('Z');
  });

  it('no hay mejor candidata en una lista vacía', () => {
    expect(bestCandidateId([])).toBeNull();
  });

  it('permutar el banco real conserva la selección y las candidatas', () => {
    const { questions } = RADAR_QUESTION_BANK;
    const expected = selection(initial, RADAR_QUESTION_BANK);
    const permuted = [
      [...questions].reverse(),
      [...questions.slice(11), ...questions.slice(0, 11)],
      [...questions].sort((a, b) => a.statement.localeCompare(b.statement)),
    ];

    for (const order of permuted) {
      const result = selection(initial, { questions: order });
      expect(result.question.id).toBe(expected.question.id);
      expect(result.candidates).toEqual(expected.candidates);
    }
  });
});

describe('distribuciones aceptadas dentro de la tolerancia', () => {
  it.each([[1 + 5e-10], [1 - 5e-10]])('conservan EIG y elección al escalar por %d', (factor) => {
    for (const joint of [initial.joint, CORRELATED]) {
      const expected = selection(stateWith(joint), RADAR_QUESTION_BANK);
      const scaled = selection(stateWith(joint.map((mass) => mass * factor)), RADAR_QUESTION_BANK);

      expect(scaled.question.id).toBe(expected.question.id);
      scaled.candidates.forEach((item, index) => {
        const reference = expected.candidates[index];
        expect(item.questionId).toBe(reference?.questionId);
        expectClose(item.eig, reference?.eig ?? Number.NaN);
        expectClose(item.correctProbability, reference?.correctProbability ?? Number.NaN);
      });
    }
  });

  it('una masa puntual escalada sigue teniendo EIG cero', () => {
    const scaled = pointMass(63).map((mass) => mass * (1 + 5e-10));

    expectClose(explain(scaled, choiceQuestion('Q1', ['OPS'])).eig, 0);
  });
});

describe('sin candidatas', () => {
  it('banco vacío: null', () => {
    expect(selectNextQuestion(initial, bankOf())).toBeNull();
  });

  it('banco agotado: null', () => {
    const bank = bankOf(choiceQuestion('Q1', ['OPS']));
    const answered = submitAnswer(initial, 'Q1', 'c', bank);
    expect(answered.ok).toBe(true);
    if (!answered.ok) return;

    expect(selectNextQuestion(answered.value, bank)).toBeNull();
  });
});

describe('pairEntropy', () => {
  it('pierde menos precisión cuando una probabilidad está muy cerca de 1', () => {
    // H_b(s) ≈ s·log2(1/s) + s/ln(2) para s muy pequeño. En este caso concreto, el
    // error relativo medido fue 2.13e-5 partiendo de 1 - s y 7.73e-7 partiendo de s.
    const small = 1e-12;
    const expected = small * Math.log2(1 / small) + small / Math.LN2;

    for (const entropy of [pairEntropy(1 - small, small), pairEntropy(small, 1 - small)]) {
      expect(Math.abs(entropy - expected) / expected).toBeLessThan(1e-5);
    }
  });
});

describe('checkedEig', () => {
  it.each([[-5e-13], [-1e-12], [-0], [0]])('convierte el residuo %d en 0', (raw) => {
    expect(checkedEig(raw)).toBe(0);
  });

  it('conserva los valores positivos', () => {
    expect(checkedEig(1e-13)).toBe(1e-13);
    expect(checkedEig(0.37)).toBe(0.37);
  });

  it.each([[-2e-12], [-1], [Number.NaN], [Number.POSITIVE_INFINITY], [Number.NEGATIVE_INFINITY]])(
    'rechaza %d con un error tipado',
    (raw) => {
      expectInferenceError(() => checkedEig(raw), 'INVALID_EIG');
    },
  );
});

describe('errores de entrada', () => {
  const bank = bankOf(choiceQuestion('Q1', ['OPS']));

  it('una rama hipotética no normalizable lanza un error tipado', () => {
    const tiny = bankOf(choiceQuestion('Q1', ['OPS'], { guess: 1e-301 }));

    expectInferenceError(() => selectNextQuestion(stateWith(pointMass(0)), tiny), 'INVALID_NORMALIZATION');
  });

  it.each([[null], ['banco'], [{}], [{ questions: 'x' }], [{ questions: [null] }]])('rechaza el banco %j', (invalid) => {
    expectInferenceError(() => selectNextQuestion(initial, invalid as unknown as QuestionBank), 'INVALID_BANK');
  });

  it('valida el banco contra las seis competencias', () => {
    expect(() => selectNextQuestion(initial, bankOf(choiceQuestion('Q1', ['XXX'])))).toThrow(QuestionBankError);
    expect(() => selectNextQuestion(initial, bankOf(choiceQuestion('Q1', ['OPS'], { slip: 0.9 })))).toThrow(
      QuestionBankError,
    );
  });

  it('rechaza un skillOrder alterado', () => {
    const swapped = ['NEG', 'OPS', 'FRA', 'JER', 'ALG', 'ECU'];

    expectInferenceError(() => selectNextQuestion({ ...initial, skillOrder: swapped }, bank), 'INVALID_STATE');
    expectInferenceError(() => selectNextQuestion({ ...initial, skillOrder: ORDER.slice(1) }, bank), 'INVALID_STATE');
  });

  it('rechaza una distribución inválida', () => {
    expectInferenceError(() => selectNextQuestion(stateWith([1]), bank), 'INVALID_DISTRIBUTION');
    expectInferenceError(
      () => selectNextQuestion(stateWith(initial.joint.map((mass) => mass * 2)), bank),
      'INVALID_DISTRIBUTION',
    );
  });

  it('rechaza un historial inválido', () => {
    const record = { questionId: 'Q9', answer: 'c', normalizedAnswer: 'c', isCorrect: true };

    expectInferenceError(() => selectNextQuestion({ ...initial, responses: [record] }, bank), 'INVALID_HISTORY');
  });

  it('un estado inválido se rechaza aunque el banco esté vacío', () => {
    expectInferenceError(() => selectNextQuestion(stateWith([1]), bankOf()), 'INVALID_DISTRIBUTION');
    expectInferenceError(() => selectNextQuestion(null as unknown as DiagnosticState, bankOf()), 'INVALID_STATE');
  });
});

describe('pureza y serialización', () => {
  it('funciona con entradas congeladas', () => {
    const state = deepFreeze(structuredClone(initial));
    const bank = deepFreeze(structuredClone(RADAR_QUESTION_BANK));

    expect(selection(state, bank).question.id).toBe(selection(initial, RADAR_QUESTION_BANK).question.id);
  });

  it('el resultado se serializa como JSON sin pérdidas', () => {
    const result = selection(initial, RADAR_QUESTION_BANK);

    expect(serializedCopy(result)).toEqual(result);
  });

  it('es determinista', () => {
    expect(selection(initial, RADAR_QUESTION_BANK)).toEqual(selection(initial, RADAR_QUESTION_BANK));
  });
});
