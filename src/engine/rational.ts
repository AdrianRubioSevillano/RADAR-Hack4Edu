import type { CanonicalRational, RationalErrorCode, Result } from './types.ts';

// Gramática de §4: entero con signo opcional o fracción de dos enteros con signo opcional.
const RATIONAL_PATTERN = /^[+-]?\d+(\/[+-]?\d+)?$/;

function greatestCommonDivisor(a: bigint, b: bigint): bigint {
  let [x, y] = [a < 0n ? -a : a, b < 0n ? -b : b];
  while (y !== 0n) {
    [x, y] = [y, x % y];
  }
  return x;
}

export function normalizeRational(input: string): Result<CanonicalRational, RationalErrorCode> {
  const text = input.trim();
  if (!RATIONAL_PATTERN.test(text)) {
    return { ok: false, error: 'INVALID_FORMAT' };
  }

  const [numeratorText = '', denominatorText = '1'] = text.split('/');
  const numerator = BigInt(numeratorText);
  const denominator = BigInt(denominatorText);
  if (denominator === 0n) {
    return { ok: false, error: 'ZERO_DENOMINATOR' };
  }

  const divisor = greatestCommonDivisor(numerator, denominator);
  const sign = denominator < 0n ? -1n : 1n;
  return { ok: true, value: `${(sign * numerator) / divisor}/${(sign * denominator) / divisor}` };
}

export function isCanonicalRational(value: string): boolean {
  const normalized = normalizeRational(value);
  return normalized.ok && normalized.value === value;
}
