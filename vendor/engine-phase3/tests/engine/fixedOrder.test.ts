import { describe, expect, it } from 'vitest';
import { KNOWLEDGE_GRAPH, QuestionBankError, RADAR_QUESTION_BANK, fixedQuestionOrder } from '../../src/engine/index.ts';
import type { KnowledgeGraph } from '../../src/engine/index.ts';
import { bankOf, choiceQuestion, deepFreeze } from './support/bank.ts';

// Orden del banco real, escrito a mano a partir de las dificultades de BANCO.md.
const EXPECTED = [
  ['OPS-03', 'FRA-02', 'NEG-03', 'JER-03', 'ALG-03', 'ECU-03'],
  ['OPS-04', 'FRA-03', 'NEG-04', 'JER-04', 'ALG-04', 'ECU-04'],
  ['OPS-01', 'FRA-01', 'NEG-01', 'JER-01', 'ALG-01', 'ECU-01'],
  ['OPS-02', 'FRA-04', 'NEG-02', 'JER-02', 'ALG-02', 'ECU-02'],
  ['OPS-05', 'FRA-05', 'NEG-05', 'JER-05', 'ALG-05', 'ECU-05'],
].flat();

describe('fixedQuestionOrder', () => {
  it('sigue rondas por competencia en orden topológico con el banco real', () => {
    expect(fixedQuestionOrder(RADAR_QUESTION_BANK, KNOWLEDGE_GRAPH)).toEqual(EXPECTED);
  });

  it('contiene cada pregunta una sola vez', () => {
    const order = fixedQuestionOrder(RADAR_QUESTION_BANK, KNOWLEDGE_GRAPH);

    expect(new Set(order).size).toBe(order.length);
    expect([...order].sort()).toEqual(RADAR_QUESTION_BANK.questions.map((question) => question.id).sort());
  });

  it('ordena por dificultad 2, 1, 3 y después por id', () => {
    const bank = bankOf(
      choiceQuestion('Q5', ['OPS'], { difficulty: 3 }),
      choiceQuestion('Q4', ['OPS'], { difficulty: 1 }),
      choiceQuestion('Q3', ['OPS'], { difficulty: 2 }),
      choiceQuestion('Q2', ['OPS'], { difficulty: 1 }),
      choiceQuestion('Q1', ['OPS'], { difficulty: 3 }),
    );

    expect(fixedQuestionOrder(bank, KNOWLEDGE_GRAPH)).toEqual(['Q3', 'Q2', 'Q4', 'Q1', 'Q5']);
  });

  it('una ronda salta las competencias agotadas', () => {
    const bank = bankOf(
      choiceQuestion('E1', ['ECU']),
      choiceQuestion('O1', ['OPS']),
      choiceQuestion('O2', ['OPS']),
      choiceQuestion('O3', ['OPS']),
      choiceQuestion('F1', ['FRA']),
      choiceQuestion('F2', ['FRA']),
    );

    expect(fixedQuestionOrder(bank, KNOWLEDGE_GRAPH)).toEqual(['O1', 'F1', 'E1', 'O2', 'F2', 'O3']);
  });

  it('agrupa por competencia principal, no por las secundarias', () => {
    const bank = bankOf(choiceQuestion('Q1', ['ECU', 'OPS']), choiceQuestion('Q2', ['NEG']));

    expect(fixedQuestionOrder(bank, KNOWLEDGE_GRAPH)).toEqual(['Q2', 'Q1']);
  });

  it('no depende del orden del banco', () => {
    const { questions } = RADAR_QUESTION_BANK;
    const permuted = [[...questions].reverse(), [...questions.slice(7), ...questions.slice(0, 7)]];

    for (const order of permuted) {
      expect(fixedQuestionOrder({ questions: order }, KNOWLEDGE_GRAPH)).toEqual(EXPECTED);
    }
  });

  it('no depende del orden de los nodos del grafo', () => {
    const graph: KnowledgeGraph = { nodes: [...KNOWLEDGE_GRAPH.nodes].reverse() };

    expect(fixedQuestionOrder(RADAR_QUESTION_BANK, graph)).toEqual(EXPECTED);
  });

  it('un banco vacío da un orden vacío', () => {
    expect(fixedQuestionOrder(bankOf(), KNOWLEDGE_GRAPH)).toEqual([]);
  });

  it('funciona con entradas congeladas y no las altera', () => {
    const bank = deepFreeze(structuredClone(RADAR_QUESTION_BANK));
    const graph = deepFreeze(structuredClone(KNOWLEDGE_GRAPH));
    const ids = bank.questions.map((question) => question.id);

    expect(fixedQuestionOrder(bank, graph)).toEqual(EXPECTED);
    expect(bank.questions.map((question) => question.id)).toEqual(ids);
  });

  it('valida el banco contra el grafo recibido', () => {
    expect(() => fixedQuestionOrder(bankOf(choiceQuestion('Q1', ['OPS'])), { nodes: [] })).toThrow(QuestionBankError);
  });
});
