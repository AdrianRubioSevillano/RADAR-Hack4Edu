// Aritmética racional y cálculo simbólico lineal para los tests. No importa nada
// de src/: las respuestas del banco se comprueban de forma independiente.

export interface Exact {
  readonly n: bigint;
  readonly d: bigint;
}

function gcd(a: bigint, b: bigint): bigint {
  return b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b);
}

export function q(numerator: number | bigint, denominator: number | bigint = 1): Exact {
  const n = BigInt(numerator);
  const d = BigInt(denominator);
  if (d === 0n) throw new Error('Denominador cero en un test');
  const divisor = gcd(n, d) * (d < 0n ? -1n : 1n);
  return { n: n / divisor, d: d / divisor };
}

export const add = (a: Exact, b: Exact): Exact => q(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Exact, b: Exact): Exact => q(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Exact, b: Exact): Exact => q(a.n * b.n, a.d * b.d);
export const div = (a: Exact, b: Exact): Exact => q(a.n * b.d, a.d * b.n);
export const show = (value: Exact): string => `${value.n}/${value.d}`;

// Polinomio como mapa de monomio a coeficiente; '1' es el término independiente.
export type Poly = ReadonlyMap<string, Exact>;

function normalized(entries: Iterable<readonly [string, Exact]>): Poly {
  const result = new Map<string, Exact>();
  for (const [monomial, coefficient] of entries) {
    const total = add(result.get(monomial) ?? q(0), coefficient);
    if (total.n === 0n) {
      result.delete(monomial);
    } else {
      result.set(monomial, total);
    }
  }
  return result;
}

export const term = (coefficient: Exact, monomial = '1'): Poly => normalized([[monomial, coefficient]]);
export const scale = (poly: Poly, factor: Exact): Poly =>
  normalized([...poly].map(([monomial, coefficient]) => [monomial, mul(coefficient, factor)] as const));
export const plus = (...polys: readonly Poly[]): Poly => normalized(polys.flatMap((poly) => [...poly]));
export const minus = (a: Poly, b: Poly): Poly => plus(a, scale(b, q(-1)));
export const coefficientOf = (poly: Poly, monomial: string): Exact => poly.get(monomial) ?? q(0);

// Igualdad coeficiente a coeficiente: demuestra equivalencia para todo valor de x.
export function samePoly(a: Poly, b: Poly): boolean {
  return minus(a, b).size === 0;
}

// Analizador limitado a las opciones del banco: suma de términos como 3x, 5x², -4 o x.
export function parsePoly(text: string): Poly {
  const compact = text.replaceAll(' ', '');
  const terms: (readonly [string, Exact])[] = [];
  let position = 0;
  while (position < compact.length) {
    const match = /^([+-]?)(\d*)([a-z]²?)?/.exec(compact.slice(position));
    const [matched = '', sign = '', digits = '', monomial = '1'] = match ?? [];
    if (digits === '' && monomial === '1') {
      throw new Error(`Término no reconocido en: ${text}`);
    }
    const magnitude = q(digits === '' ? 1 : BigInt(digits));
    terms.push([monomial, sign === '-' ? mul(magnitude, q(-1)) : magnitude]);
    position += matched.length;
  }
  return normalized(terms);
}

// Resuelve simbólicamente left = right, lineal en x, con coeficiente de x no nulo.
export function solveLinear(left: Poly, right: Poly): Exact {
  const difference = minus(left, right);
  const a = coefficientOf(difference, 'x');
  if (a.n === 0n || [...difference.keys()].some((monomial) => monomial !== 'x' && monomial !== '1')) {
    throw new Error('La ecuación no es lineal con solución única');
  }
  return div(mul(coefficientOf(difference, '1'), q(-1)), a);
}
