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

  describe.each([[1 + 5e-10], [1 - 5e-10]])('con masas aceptadas escaladas por %d', (factor) => {
    const scaled = (joint: JointDistribution): JointDistribution => joint.map((mass) => mass * factor);

    it('una masa puntual tiene entropía 0', () => {
      expect(jointEntropy(scaled(distribution({ 0: 1 })))).toBe(0);
      expect(jointEntropy(scaled(distribution({ 37: 1 })))).toBe(0);
    });

    it('la uniforme tiene entropía 6', () => {
      expectClose(jointEntropy(scaled(Array.from({ length: 64 }, () => 1 / 64))), 6);
    });

    it('[0.5, 0.25, 0.25, 0, ...] tiene entropía 1.5', () => {
      expectClose(jointEntropy(scaled(distribution({ 0: 0.5, 1: 0.25, 2: 0.25 }))), 1.5);
    });

    it('conserva la entrada congelada', () => {
      const masses = scaled(distribution({ 0: 0.5, 1: 0.25, 2: 0.25 }));
      const joint = Object.freeze([...masses]);

      expectClose(jointEntropy(joint), 1.5);
      expect(joint).toEqual(masses);
    });
  });

  it.each([[1 + 2e-9], [1 - 2e-9]])('sigue rechazando una suma fuera de tolerancia: factor %d', (factor) => {
    const joint = distribution({ 0: 0.5, 1: 0.25, 2: 0.25 }).map((mass) => mass * factor);

    expectInferenceError(() => jointEntropy(joint), 'INVALID_DISTRIBUTION');
  });
});
