import { expect } from 'vitest';
import { InferenceError } from '../../../src/engine/index.ts';
import type { InferenceErrorCode } from '../../../src/engine/index.ts';
import { add, div, mul, q, toNumber } from './exact.ts';
import type { Exact } from './exact.ts';

// Convención escrita a mano, sin importar SKILL_ORDER ni la codificación de producción.
export const ORDER = ['OPS', 'NEG', 'FRA', 'JER', 'ALG', 'ECU'];

export function masteredSkills(index: number): readonly string[] {
  return ORDER.filter((_, position) => Math.floor(index / 2 ** position) % 2 === 1);
}

export interface Evidence {
  readonly required: readonly string[];
  readonly correct: boolean;
}

const SLIP = q(1, 10);
const GUESS = q(1, 4);

function likelihood({ required, correct }: Evidence, index: number): Exact {
  const mastered = masteredSkills(index);
  const mastersAll = required.every((skill) => mastered.includes(skill));
  if (mastersAll) {
    return correct ? q(9, 10) : SLIP;
  }
  return correct ? GUESS : q(3, 4);
}

// Posterior por lotes con aritmética racional exacta, desde el prior uniforme.
export function exactPosterior(evidence: readonly Evidence[]): readonly Exact[] {
  const weights = Array.from({ length: 64 }, (_, index) =>
    evidence.reduce((weight, item) => mul(weight, likelihood(item, index)), q(1, 64)),
  );
  const total = weights.reduce(add, q(0));
  return weights.map((weight) => div(weight, total));
}

export function exactMastery(joint: readonly Exact[], skills: readonly string[]): Exact {
  return joint
    .filter((_, index) => skills.every((skill) => masteredSkills(index).includes(skill)))
    .reduce(add, q(0));
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

export function entropyBits(probabilities: readonly number[]): number {
  return sum(probabilities.filter((probability) => probability > 0).map((p) => -p * Math.log2(p)));
}

export function binaryBits(probability: number): number {
  return entropyBits([probability, 1 - probability]);
}

export function marginalOf(joint: readonly number[], skill: string): number {
  return sum(joint.filter((_, index) => masteredSkills(index).includes(skill)));
}

export interface ReferenceEvidence {
  readonly correctProbability: number;
  readonly incorrectProbability: number;
  readonly eig: number;
  readonly posteriorIfCorrect: readonly number[];
  readonly posteriorIfIncorrect: readonly number[];
}

// Formulación independiente: H(joint) - P(acierto)·H(joint|acierto) - P(fallo)·H(joint|fallo).
export function referenceEvidence(
  joint: readonly number[],
  required: readonly string[],
  slip: number,
  guess: number,
): ReferenceEvidence {
  const total = sum(joint);
  const prior = joint.map((mass) => mass / total);
  const mastersAll = (index: number): boolean => required.every((skill) => masteredSkills(index).includes(skill));

  const correctWeights = prior.map((mass, index) => mass * (mastersAll(index) ? 1 - slip : guess));
  const incorrectWeights = prior.map((mass, index) => mass * (mastersAll(index) ? slip : 1 - guess));
  const correctProbability = sum(correctWeights);
  const incorrectProbability = sum(incorrectWeights);
  const posteriorIfCorrect = correctWeights.map((weight) => weight / correctProbability);
  const posteriorIfIncorrect = incorrectWeights.map((weight) => weight / incorrectProbability);

  return {
    correctProbability,
    incorrectProbability,
    eig:
      entropyBits(prior) -
      correctProbability * entropyBits(posteriorIfCorrect) -
      incorrectProbability * entropyBits(posteriorIfIncorrect),
    posteriorIfCorrect,
    posteriorIfIncorrect,
  };
}

export function expectClose(actual: number | undefined, expected: Exact | number, tolerance = 1e-12): void {
  const value = typeof expected === 'number' ? expected : toNumber(expected);
  expect(actual).toBeDefined();
  expect(Math.abs((actual ?? Number.NaN) - value)).toBeLessThan(tolerance);
}

export function expectInferenceError(action: () => unknown, code: InferenceErrorCode): void {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(InferenceError);
  expect(caught).toMatchObject({ name: 'InferenceError', code });
}

export function serializedCopy<T>(value: T): unknown {
  return JSON.parse(JSON.stringify(value));
}
