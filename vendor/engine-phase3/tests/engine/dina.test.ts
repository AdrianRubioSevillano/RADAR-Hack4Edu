import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_GRAPH,
  RADAR_QUESTION_BANK,
  SKILL_ORDER,
  STATE_COUNT,
  correctProbability,
  masteryFromStateIndex,
  requiredSkills,
  stateIndexFromMastery,
  topologicalOrder,
} from '../../src/engine/index.ts';
import type { DinaQuestion, MasteryVector } from '../../src/engine/index.ts';
import { expectInferenceError } from './support/inference.ts';

const ALL: MasteryVector = [1, 1, 1, 1, 1, 1];
const NONE: MasteryVector = [0, 0, 0, 0, 0, 0];

function bankQuestion(id: string): DinaQuestion {
  const question = RADAR_QUESTION_BANK.questions.find((candidate) => candidate.id === id);
  if (question === undefined) throw new Error(`No existe ${id}`);
  return question;
}

describe('convención de codificación', () => {
  it('fija el orden, distinto del orden topológico', () => {
    expect(SKILL_ORDER).toEqual(['OPS', 'NEG', 'FRA', 'JER', 'ALG', 'ECU']);
    expect(SKILL_ORDER).not.toEqual(topologicalOrder(KNOWLEDGE_GRAPH));
    expect(Object.isFrozen(SKILL_ORDER)).toBe(true);
    expect(STATE_COUNT).toBe(64);
  });

  it.each([
    [0, [0, 0, 0, 0, 0, 0]],
    [1, [1, 0, 0, 0, 0, 0]],
    [2, [0, 1, 0, 0, 0, 0]],
    [4, [0, 0, 1, 0, 0, 0]],
    [8, [0, 0, 0, 1, 0, 0]],
    [16, [0, 0, 0, 0, 1, 0]],
    [32, [0, 0, 0, 0, 0, 1]],
    [5, [1, 0, 1, 0, 0, 0]],
    [63, [1, 1, 1, 1, 1, 1]],
  ])('el índice %i codifica %j', (index, alpha) => {
    expect(masteryFromStateIndex(index)).toEqual(alpha);
    expect(stateIndexFromMastery(alpha as MasteryVector)).toBe(index);
  });

  it('es una biyección entre índices y vectores', () => {
    const vectors = Array.from({ length: 64 }, (_, index) => masteryFromStateIndex(index));

    expect(new Set(vectors.map((alpha) => alpha.join(''))).size).toBe(64);
    vectors.forEach((alpha, index) => {
      expect(stateIndexFromMastery(alpha)).toBe(index);
    });
  });

  it.each([[-1], [64], [1.5], [Number.NaN], [Number.POSITIVE_INFINITY]])('rechaza el índice %j', (index) => {
    expectInferenceError(() => masteryFromStateIndex(index), 'INVALID_STATE_INDEX');
  });
});

describe('correctProbability', () => {
  it('da 1 - slip si domina todas las competencias requeridas', () => {
    expect(correctProbability(ALL, ['ALG'], 0.1, 0.25)).toBe(0.9);
    expect(correctProbability([0, 1, 0, 0, 1, 0], ['NEG', 'ALG'], 0.1, 0.25)).toBe(0.9);
  });

  it('da guess si no domina alguna competencia requerida', () => {
    expect(correctProbability(NONE, ['ALG'], 0.1, 0.25)).toBe(0.25);
    expect(correctProbability([0, 1, 0, 0, 0, 0], ['NEG', 'ALG'], 0.1, 0.25)).toBe(0.25);
    expect(correctProbability([0, 0, 0, 0, 1, 0], ['NEG', 'ALG'], 0.1, 0.25)).toBe(0.25);
  });

  it('no exige los ancestros de las competencias requeridas', () => {
    expect(correctProbability([0, 0, 0, 0, 0, 1], ['ECU'], 0.1, 0.25)).toBe(0.9);
  });

  it('no depende del orden de la lista de requisitos', () => {
    const alpha: MasteryVector = [0, 1, 0, 0, 1, 0];

    expect(correctProbability(alpha, ['ALG', 'NEG'], 0.1, 0.25)).toBe(correctProbability(alpha, ['NEG', 'ALG'], 0.1, 0.25));
  });

  it('no muta entradas congeladas', () => {
    const alpha = Object.freeze<MasteryVector>([1, 1, 0, 0, 0, 0]);
    const required = Object.freeze(['OPS', 'NEG']);

    expect(correctProbability(alpha, required, 0.1, 0.25)).toBe(0.9);
  });

  it.each([
    [[1, 1, 1, 1, 1]],
    [[1, 1, 1, 1, 1, 1, 1]],
    [[2, 0, 0, 0, 0, 0]],
    [[0.5, 0, 0, 0, 0, 0]],
    [[true, 0, 0, 0, 0, 0]],
    [[Number.NaN, 0, 0, 0, 0, 0]],
    ['111111'],
    [null],
  ])('rechaza el vector %j', (alpha) => {
    expectInferenceError(() => correctProbability(alpha as unknown as MasteryVector, ['OPS'], 0.1, 0.25), 'INVALID_MASTERY');
  });

  it('rechaza un vector con huecos', () => {
    const sparse = new Array<0 | 1>(6);

    expectInferenceError(() => stateIndexFromMastery(sparse), 'INVALID_MASTERY');
  });

  it('rechaza requisitos inválidos', () => {
    expectInferenceError(() => correctProbability(ALL, ['XXX'], 0.1, 0.25), 'UNKNOWN_SKILL');
    expectInferenceError(() => correctProbability(ALL, ['OPS', 'OPS'], 0.1, 0.25), 'INVALID_SKILL_SET');
    expectInferenceError(() => correctProbability(ALL, [], 0.1, 0.25), 'INVALID_SKILL_SET');
    expectInferenceError(() => correctProbability(ALL, 'OPS' as unknown as string[], 0.1, 0.25), 'INVALID_SKILL_SET');
  });

  it.each([
    [Number.NaN, 0.25],
    [0.1, Number.NaN],
    [Number.POSITIVE_INFINITY, 0.25],
    [0, 0.25],
    [-0.1, 0.25],
    [1, 0.25],
    [0.1, 0],
    [0.1, -0.1],
    [0.5, 0.5],
    [0.6, 0.5],
    [0.1, 1],
  ])('rechaza slip %j y guess %j', (slip, guess) => {
    expectInferenceError(() => correctProbability(ALL, ['OPS'], slip, guess), 'INVALID_PARAMETERS');
  });
});

describe('requiredSkills', () => {
  it('une principal y secundarias en el orden de codificación', () => {
    expect(requiredSkills(bankQuestion('ECU-04'))).toEqual(['NEG', 'ALG', 'ECU']);
    expect(requiredSkills(bankQuestion('JER-05'))).toEqual(['FRA', 'JER']);
  });

  it('no añade ancestros', () => {
    expect(requiredSkills(bankQuestion('ECU-01'))).toEqual(['ECU']);
    expect(requiredSkills(bankQuestion('ECU-03'))).toEqual(['ECU']);
  });

  it('funciona con todas las preguntas del banco', () => {
    for (const question of RADAR_QUESTION_BANK.questions) {
      expect(requiredSkills(question).length).toBe(1 + question.secondarySkills.length);
    }
  });

  it('rechaza competencias desconocidas y preguntas mal formadas', () => {
    const question: DinaQuestion = { primarySkill: 'OPS', secondarySkills: [], slip: 0.1, guess: 0.25 };

    expectInferenceError(() => requiredSkills({ ...question, primarySkill: 'XXX' }), 'UNKNOWN_SKILL');
    expectInferenceError(() => requiredSkills({ ...question, secondarySkills: ['XXX'] }), 'UNKNOWN_SKILL');
    expectInferenceError(() => requiredSkills(null as unknown as DinaQuestion), 'INVALID_QUESTION');
    expectInferenceError(
      () => requiredSkills({ primarySkill: 'OPS' } as unknown as DinaQuestion),
      'INVALID_QUESTION',
    );
  });
});
