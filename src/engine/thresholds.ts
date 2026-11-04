// Tolerancia de clasificación (§2.5). Un valor a esta distancia o menos de un
// umbral se considera igual a él, solo para clasificar. Sin ella decidiría el
// redondeo: una competencia sin evidencia vale 0.5 = tau, pero en coma flotante
// puede quedar en 0.4999999999999997. No es incertidumbre estadística y no
// cambia ninguna probabilidad.
const CLASSIFICATION_TOLERANCE = 1e-12;

export function isBelowThreshold(value: number, threshold: number): boolean {
  return value < threshold - CLASSIFICATION_TOLERANCE;
}

export function isAboveThreshold(value: number, threshold: number): boolean {
  return value > threshold + CLASSIFICATION_TOLERANCE;
}

export function isStrictlyBetween(value: number, lower: number, upper: number): boolean {
  return isAboveThreshold(value, lower) && isBelowThreshold(value, upper);
}
