import {
  InferenceError,
  SKILL_ORDER,
  STATE_COUNT,
  masteryFromStateIndex,
  requiredSkills,
  responseProbability,
  skillMask,
} from './dina.ts';
import { validateKnowledgeGraph } from './graph.ts';
import type {
  DiagnosticState,
  DinaQuestion,
  EffectivePriorConfig,
  JointDistribution,
  KnowledgeGraph,
  PriorConfig,
  SkillId,
} from './types.ts';

const DEFAULT_MARGINAL = 0.5;

// Tolerancia numérica de |Σπ - 1| al aceptar una distribución. No se corrige lo que la incumple.
const JOINT_SUM_TOLERANCE = 1e-9;

// Masa mínima para renormalizar (§2.3).
const MIN_TOTAL_MASS = 1e-300;

export function assertValidJoint(joint: JointDistribution): void {
  if (!Array.isArray(joint) || joint.length !== STATE_COUNT) {
    throw new InferenceError('INVALID_DISTRIBUTION', `La distribución debe tener ${STATE_COUNT} masas`);
  }
  let total = 0;
  for (let index = 0; index < STATE_COUNT; index += 1) {
    const mass: unknown = joint[index];
    if (typeof mass !== 'number' || !Number.isFinite(mass) || mass < 0) {
      throw new InferenceError('INVALID_DISTRIBUTION', `Masa inválida en el índice ${index}`);
    }
    total += mass;
  }
  if (Math.abs(total - 1) > JOINT_SUM_TOLERANCE) {
    throw new InferenceError('INVALID_DISTRIBUTION', `Las masas suman ${total}, no 1`);
  }
}

function normalized(weights: readonly number[]): JointDistribution {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (!Number.isFinite(total) || total < MIN_TOTAL_MASS) {
    throw new InferenceError('INVALID_NORMALIZATION', `Masa total no normalizable: ${total}`);
  }
  return weights.map((weight) => weight / total);
}

function effectivePriorConfig(config: PriorConfig): EffectivePriorConfig {
  const given = config.marginals ?? {};
  for (const [skill, probability] of Object.entries(given)) {
    skillMask([skill]);
    if (typeof probability !== 'number' || !Number.isFinite(probability) || probability < 0 || probability > 1) {
      throw new InferenceError('INVALID_PRIOR', `Marginal inválida para ${skill}`);
    }
  }

  const compatibility = config.compatibility ?? null;
  if (compatibility !== null) {
    const { epsilon } = compatibility;
    if (typeof epsilon !== 'number' || !Number.isFinite(epsilon) || epsilon <= 0 || epsilon > 1) {
      throw new InferenceError('INVALID_PRIOR', 'epsilon debe ser finito en (0, 1]');
    }
  }

  return {
    marginals: Object.fromEntries(SKILL_ORDER.map((skill) => [skill, given[skill] ?? DEFAULT_MARGINAL])),
    compatibility: compatibility === null ? null : { epsilon: compatibility.epsilon },
  };
}

export function assertValidEffectivePriorConfig(config: EffectivePriorConfig): void {
  if (typeof config !== 'object' || config === null || typeof config.marginals !== 'object' || config.marginals === null) {
    throw new InferenceError('INVALID_PRIOR', 'La configuración del prior no tiene la forma esperada');
  }
  effectivePriorConfig(config);
  if (!SKILL_ORDER.every((skill) => skill in config.marginals)) {
    throw new InferenceError('INVALID_PRIOR', 'La configuración efectiva debe incluir las seis marginales');
  }
}

function assertInferenceGraph(graph: KnowledgeGraph): void {
  validateKnowledgeGraph(graph);
  const ids = new Set(graph.nodes.map((node) => node.id));
  if (ids.size !== SKILL_ORDER.length || !SKILL_ORDER.every((skill) => ids.has(skill))) {
    throw new InferenceError('INVALID_GRAPH', 'El grafo debe contener exactamente las seis competencias');
  }
}

// Incompatible: domina alguna competencia sin dominar uno de sus prerrequisitos.
function isIncompatible(index: number, graph: KnowledgeGraph): boolean {
  const masters = (skill: SkillId): boolean => (index & skillMask([skill])) !== 0;
  return graph.nodes.some((node) => masters(node.id) && node.prerequisites.some((skill) => !masters(skill)));
}

function productMass(index: number, marginalsBySkill: EffectivePriorConfig['marginals']): number {
  const alpha = masteryFromStateIndex(index);
  return SKILL_ORDER.reduce((mass, skill, position) => {
    const probability = marginalsBySkill[skill] ?? DEFAULT_MARGINAL;
    return mass * (alpha[position] === 1 ? probability : 1 - probability);
  }, 1);
}

function priorFromEffective(config: EffectivePriorConfig, graph: KnowledgeGraph | undefined): JointDistribution {
  if (graph !== undefined) {
    assertInferenceGraph(graph);
  }

  const product = Array.from({ length: STATE_COUNT }, (_, index) => productMass(index, config.marginals));
  if (config.compatibility === null) {
    return product;
  }
  if (graph === undefined) {
    throw new InferenceError('MISSING_GRAPH', 'El prior compatible exige knowledgeGraph');
  }
  const { epsilon } = config.compatibility;
  return normalized(product.map((mass, index) => (isIncompatible(index, graph) ? mass * epsilon : mass)));
}

export function createPriorDistribution(config: PriorConfig = {}, knowledgeGraph?: KnowledgeGraph): JointDistribution {
  return priorFromEffective(effectivePriorConfig(config), knowledgeGraph);
}

export function createInitialDiagnosticState(
  studentId: string,
  config: PriorConfig = {},
  knowledgeGraph?: KnowledgeGraph,
): DiagnosticState {
  if (typeof studentId !== 'string' || studentId.trim() === '') {
    throw new InferenceError('INVALID_STUDENT_ID', 'studentId no puede estar vacío');
  }
  const priorConfig = effectivePriorConfig(config);
  return {
    studentId,
    skillOrder: [...SKILL_ORDER],
    joint: priorFromEffective(priorConfig, knowledgeGraph),
    priorConfig,
    responses: [],
  };
}

// π'(α) ∝ π(α)·P(Y_q = r_q | α). Función de bajo nivel: recibe la evidencia ya
// decidida y no gestiona respuestas de alumnos ni historial.
export function updatePosterior(
  joint: JointDistribution,
  question: DinaQuestion,
  isCorrect: boolean,
): JointDistribution {
  assertValidJoint(joint);
  const required = requiredSkills(question);
  if (typeof isCorrect !== 'boolean') {
    throw new InferenceError('INVALID_EVIDENCE', 'La evidencia debe ser acierto (true) o fallo (false)');
  }

  return normalized(
    joint.map(
      (mass, index) =>
        mass * responseProbability(masteryFromStateIndex(index), required, question.slip, question.guess, isCorrect),
    ),
  );
}

// P(dominar todas las competencias de `skills`), desde la conjunta. Se divide
// entre la masa total para que el redondeo no dé valores mayores que 1.
export function masteryProbability(joint: JointDistribution, skills: readonly SkillId[]): number {
  assertValidJoint(joint);
  const mask = skillMask(skills);
  if (mask === 0) {
    return 1;
  }

  let mastered = 0;
  let total = 0;
  joint.forEach((mass, index) => {
    total += mass;
    if ((index & mask) === mask) {
      mastered += mass;
    }
  });
  return mastered / total;
}

export function marginals(joint: JointDistribution): Readonly<Record<SkillId, number>> {
  return Object.fromEntries(SKILL_ORDER.map((skill) => [skill, masteryProbability(joint, [skill])]));
}
