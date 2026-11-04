import { describe, expect, it } from 'vitest';
import { binaryEntropy, jointEntropy } from '../../src/engine/index.ts';
import type { JointDistribution } from '../../src/engine/index.ts';
import { expectClose, expectInferenceError } from './support/inference.ts';

function distribution(masses: Readonly<Record<number, number>>): JointDistribution {
  return Array.from({ length: 64 }, (_, index) => masses[index] ?? 0);
}

describe('binaryEntropy', () => {
  it('vale 1 bit en 0.5', () => {
    expect(binaryEntropy(0.5)).toBe(1);
  });

  it('vale 0 en los extremos, sin NaN', () => {
    expect(binaryEntropy(0)).toBe(0);
    expect(binaryEntropy(1)).toBe(0);
  });

  it('coincide con valores conocidos', () => {
    // H_b(1/4) = 2 - (3/4)·log2(3)
    expectClose(binaryEntropy(0.25), 0.8112781244591328);
    expectClose(binaryEntropy(0.1), 0.4689955935892812);
  });

  it('es simétrica', () => {
    expectClose(binaryEntropy(0.2), binaryEntropy(0.8));
  });

  it('es finita y pequeña cerca de los extremos', () => {
    const value = binaryEntropy(1e-12);

    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(1e-9);
  });

  it.each([[Number.NaN], [Number.POSITIVE_INFINITY], [-0.1], [1.1], ['0.5'], [null]])('rechaza %j', (value) => {
    expectInferenceError(() => binaryEntropy(value as unknown as number), 'INVALID_PROBABILITY');
  });
});

describe('jointEntropy', () => {
  it('vale 6 bits en la distribución uniforme', () => {
    expect(jointEntropy(Array.from({ length: 64 }, () => 1 / 64))).toBe(6);
  });

  it('vale 0 en una masa puntual, sin NaN por los ceros', () => {
    expect(jointEntropy(distribution({ 17: 1 }))).toBe(0);
  });

  it('coincide con valores conocidos', () => {
    expect(jointEntropy(distribution({ 0: 0.5, 63: 0.5 }))).toBe(1);
    expect(jointEntropy(distribution({ 0: 0.5, 1: 0.25, 2: 0.25 }))).toBe(1.5);
    expect(jointEntropy(distribution({ 0: 0.25, 1: 0.25, 2: 0.25, 3: 0.25 }))).toBe(2);
  });

  it('no altera entradas congeladas', () => {
    const joint = Object.freeze(distribution({ 0: 0.5, 63: 0.5 }));

    expect(jointEntropy(joint)).toBe(1);
  });
});
