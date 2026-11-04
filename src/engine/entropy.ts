import { assertValidJoint } from './bayes.ts';
import { InferenceError } from './dina.ts';
import type { JointDistribution } from './types.ts';

// -p·log2(p), con 0·log(0) = 0.
function surprisalTerm(probability: number): number {
  return probability === 0 ? 0 : -probability * Math.log2(probability);
}

export function binaryEntropy(probability: number): number {
  if (typeof probability !== 'number' || !Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new InferenceError('INVALID_PROBABILITY', `Probabilidad inválida: ${probability}`);
  }
  return surprisalTerm(probability) + surprisalTerm(1 - probability);
}

// Las masas aceptadas pueden sumar 1 solo dentro de la tolerancia: se usa la
// probabilidad normalizada de cada estado, sin modificar la entrada.
export function jointEntropy(joint: JointDistribution): number {
  assertValidJoint(joint);
  const total = joint.reduce((sum, mass) => sum + mass, 0);
  return joint.reduce((entropy, mass) => entropy + surprisalTerm(mass / total), 0);
}
