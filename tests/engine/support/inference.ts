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
