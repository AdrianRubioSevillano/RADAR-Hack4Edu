import { describe, expect, it } from 'vitest';
import { isCanonicalRational, normalizeRational } from '../../src/engine/index.ts';

describe('normalizeRational', () => {
  it.each([
    ['5', '5/1'],
    ['+5', '5/1'],
    ['-5', '-5/1'],
    ['1/2', '1/2'],
    ['3/6', '1/2'],
    ['18/12', '3/2'],
    ['-3/6', '-1/2'],
    ['3/-6', '-1/2'],
    ['-3/-6', '1/2'],
    ['+3/+6', '1/2'],
    ['007', '7/1'],
    ['10/5', '2/1'],
  ])('normaliza %s a %s', (input, expected) => {
    expect(normalizeRational(input)).toEqual({ ok: true, value: expected });
  });

  it.each([['0'], ['-0'], ['+0'], ['0/7'], ['0/-7'], ['-0/3']])('el cero %s es 0/1', (input) => {
    expect(normalizeRational(input)).toEqual({ ok: true, value: '0/1' });
  });

  it.each([['  1/2  '], ['\t1/2\n'], [' 1/2']])('recorta los espacios exteriores de %j', (input) => {
    expect(normalizeRational(input)).toEqual({ ok: true, value: '1/2' });
  });

  it.each([['1/0'], ['0/0'], ['-5/0'], ['5/-0']])('rechaza el denominador cero en %s', (input) => {
    expect(normalizeRational(input)).toEqual({ ok: false, error: 'ZERO_DENOMINATOR' });
  });

  it.each([
    [''],
    ['   '],
    ['1 / 2'],
    ['1/ 2'],
    ['1 /2'],
    ['- 5'],
    ['1.5'],
    ['1,5'],
    ['.5'],
    ['1e3'],
    ['1E3'],
    ['0x10'],
    ['1+2'],
    ['2*3'],
    ['(1/2)'],
    ['1/2/3'],
    ['/2'],
    ['1/'],
    ['--1'],
    ['+-1'],
    ['abc'],
    ['٣'],
    ['Infinity'],
    ['NaN'],
  ])('rechaza el formato %j', (input) => {
    expect(normalizeRational(input)).toEqual({ ok: false, error: 'INVALID_FORMAT' });
  });

  it('trata enteros mayores que Number.MAX_SAFE_INTEGER sin perder precisión', () => {
    expect(normalizeRational('90071992547409930/10')).toEqual({ ok: true, value: '9007199254740993/1' });
  });

  it('devuelve solo cadenas, serializables como JSON', () => {
    const normalized = normalizeRational('3/6');

    expect(JSON.parse(JSON.stringify(normalized))).toEqual(normalized);
  });
});

describe('isCanonicalRational', () => {
  it.each([['5/1'], ['0/1'], ['-7/12'], ['1/2']])('acepta %s', (value) => {
    expect(isCanonicalRational(value)).toBe(true);
  });

  it.each([['5'], ['+5/1'], ['2/4'], ['1/-2'], ['-0/1'], ['0/2'], [' 1/2'], ['1/0'], ['abc']])(
    'rechaza %j',
    (value) => {
      expect(isCanonicalRational(value)).toBe(false);
    },
  );
});
