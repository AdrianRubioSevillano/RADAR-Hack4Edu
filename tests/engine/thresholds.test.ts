import { describe, expect, it } from 'vitest';
import { isAboveThreshold, isBelowThreshold, isStrictlyBetween } from '../../src/engine/thresholds.ts';

describe('comparadores de clasificación', () => {
  it.each([
    [0.5, false],
    [0.5 - 5e-13, false],
    [0.4999999999999997, false],
    [0.5 - 2e-12, true],
    [0.4, true],
    [0.6, false],
  ])('isBelowThreshold(%d, 0.5)', (value, expected) => {
    expect(isBelowThreshold(value, 0.5)).toBe(expected);
  });

  it.each([
    [0.5, false],
    [0.5 + 5e-13, false],
    [0.5 + 2e-12, true],
    [0.6, true],
    [0.4, false],
  ])('isAboveThreshold(%d, 0.5)', (value, expected) => {
    expect(isAboveThreshold(value, 0.5)).toBe(expected);
  });

  it.each([
    [0.3, false],
    [0.7, false],
    [0.3 + 5e-13, false],
    [0.7 - 5e-13, false],
    [0.3 + 2e-12, true],
    [0.7 - 2e-12, true],
    [0.5, true],
    [0.2, false],
    [0.8, false],
  ])('isStrictlyBetween(%d, 0.3, 0.7)', (value, expected) => {
    expect(isStrictlyBetween(value, 0.3, 0.7)).toBe(expected);
  });
});
