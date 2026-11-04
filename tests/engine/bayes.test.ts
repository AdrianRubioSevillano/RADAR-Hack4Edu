import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_GRAPH,
  KnowledgeGraphError,
  SKILL_ORDER,
  createInitialDiagnosticState,
  createPriorDistribution,
  jointEntropy,
  marginals,
  masteryProbability,
  updatePosterior,
} from '../../src/engine/index.ts';
import type { DinaQuestion, JointDistribution, KnowledgeGraph, PriorConfig } from '../../src/engine/index.ts';
import { div, q, toNumber } from './support/exact.ts';
import {
  ORDER,
  exactMastery,
  exactPosterior,
  expectClose,
  expectInferenceError,
  masteredSkills,
  serializedCopy,
} from './support/inference.ts';
import type { Evidence } from './support/inference.ts';

const UNIFORM: JointDistribution = Array.from({ length: 64 }, () => 1 / 64);

// Los nueve estados que respetan el grafo de §2.1, escritos a mano.
const COMPATIBLE_STATES = [0, 1, 3, 5, 7, 11, 15, 31, 63];

function question(required: readonly string[], slip = 0.1, guess = 0.25): DinaQuestion {
  const [primarySkill = '', ...secondarySkills] = required;
  return { primarySkill, secondarySkills, slip, guess };
}

function applyEvidence(evidence: readonly Evidence[]): JointDistribution {
  return evidence.reduce<JointDistribution>(
    (joint, item) => updatePosterior(joint, question(item.required), item.correct),
    UNIFORM,
  );
}

function permutations<T>(items: readonly T[]): readonly (readonly T[])[] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [item, ...rest]),
  );
}

function pointMass(index: number): JointDistribution {
  return Array.from({ length: 64 }, (_, position) => (position === index ? 1 : 0));
}

describe('prior independiente', () => {
  it('es uniforme por defecto', () => {
    const joint = createPriorDistribution();

    expect(joint).toHaveLength(64);
    for (const mass of joint) {
      expect(mass).toBe(1 / 64);
    }
    expect(Object.values(marginals(joint))).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
    expect(jointEntropy(joint)).toBe(6);
  });

  it('multiplica marginales no uniformes', () => {
    const joint = createPriorDistribution({ marginals: { OPS: 0.8, ECU: 0.1 } });

    expectClose(joint[0], 0.2 * 0.9 * 0.5 ** 4);
    expectClose(joint[1], 0.8 * 0.9 * 0.5 ** 4);
    expectClose(joint[32], 0.2 * 0.1 * 0.5 ** 4);
    expectClose(joint[33], 0.8 * 0.1 * 0.5 ** 4);
    expectClose(joint.reduce((sum, mass) => sum + mass, 0), 1);

    const result = marginals(joint);
    expectClose(result.OPS, 0.8);
    expectClose(result.NEG, 0.5);
    expectClose(result.ECU, 0.1);
  });

  it('no depende del orden de las claves de la configuración', () => {
    const a = createPriorDistribution({ marginals: { OPS: 0.8, ECU: 0.1 } });
    const b = createPriorDistribution({ marginals: { ECU: 0.1, OPS: 0.8 } });

    expect(a).toEqual(b);
  });

  it('acepta 0 y 1 exactos sin recortarlos', () => {
    const allOnes = Object.fromEntries(ORDER.map((skill) => [skill, 1]));
    const allZeros = Object.fromEntries(ORDER.map((skill) => [skill, 0]));
    const mixed = createPriorDistribution({ marginals: { ...allZeros, OPS: 1, FRA: 1 } });

    expect(createPriorDistribution({ marginals: allOnes })).toEqual(pointMass(63));
    expect(createPriorDistribution({ marginals: allZeros })).toEqual(pointMass(0));
    expect(mixed).toEqual(pointMass(5));
    expect(jointEntropy(mixed)).toBe(0);
  });

  it('conserva una marginal extrema sin modificarla', () => {
    expectClose(marginals(createPriorDistribution({ marginals: { OPS: 1e-12 } })).OPS, 1e-12, 1e-20);
  });

  it.each([[Number.NaN], [Number.POSITIVE_INFINITY], [-0.1], [1.1], ['0.5']])('rechaza la marginal %j', (value) => {
    const config = { marginals: { OPS: value } } as unknown as PriorConfig;

    expectInferenceError(() => createPriorDistribution(config), 'INVALID_PRIOR');
  });

  it('rechaza una competencia desconocida', () => {
    expectInferenceError(() => createPriorDistribution({ marginals: { XXX: 0.5 } }), 'UNKNOWN_SKILL');
  });
});

describe('prior compatible con prerrequisitos', () => {
  it('multiplica por epsilon una sola vez cada estado incompatible y renormaliza', () => {
    const epsilon = q(1, 10);
    const total = q(145, 10);
    const joint = createPriorDistribution({ compatibility: { epsilon: 0.1 } }, KNOWLEDGE_GRAPH);

    joint.forEach((mass, index) => {
      expectClose(mass, COMPATIBLE_STATES.includes(index) ? div(q(1), total) : div(epsilon, total));
    });
  });

  it('no aplica epsilon varias veces a un estado con varias violaciones', () => {
    const joint = createPriorDistribution({ compatibility: { epsilon: 0.1 } }, KNOWLEDGE_GRAPH);

    // Índice 40: JER y ECU sin sus prerrequisitos. Índice 32: solo ECU sin ALG.
    expect(masteredSkills(40)).toEqual(['JER', 'ECU']);
    expectClose(joint[40], joint[32] ?? Number.NaN);
  });

  it('con epsilon 1 equivale al prior independiente', () => {
    const config: PriorConfig = { marginals: { OPS: 0.8, ALG: 0.3 } };
    const independent = createPriorDistribution(config);
    const compatible = createPriorDistribution({ ...config, compatibility: { epsilon: 1 } }, KNOWLEDGE_GRAPH);

    compatible.forEach((mass, index) => {
      expectClose(mass, independent[index] ?? Number.NaN, 1e-15);
    });
  });

  it('no depende del orden de los nodos del grafo', () => {
    const reversed: KnowledgeGraph = { nodes: [...KNOWLEDGE_GRAPH.nodes].reverse() };
    const config: PriorConfig = { compatibility: { epsilon: 0.2 } };

    expect(createPriorDistribution(config, reversed)).toEqual(createPriorDistribution(config, KNOWLEDGE_GRAPH));
  });

  it('una compatibilidad null equivale a desactivarla', () => {
    expect(createPriorDistribution({ compatibility: null })).toEqual(createPriorDistribution());
  });

  it.each([[0], [-0.1], [1.1], [Number.NaN], [Number.POSITIVE_INFINITY], ['0.1']])('rechaza epsilon %j', (epsilon) => {
    const config = { compatibility: { epsilon } } as unknown as PriorConfig;

    expectInferenceError(() => createPriorDistribution(config, KNOWLEDGE_GRAPH), 'INVALID_PRIOR');
  });

  it('exige el grafo al activarlo', () => {
    expectInferenceError(() => createPriorDistribution({ compatibility: { epsilon: 0.1 } }), 'MISSING_GRAPH');
  });

  it('rechaza una masa no normalizable', () => {
    const allOnesButAlg = Object.fromEntries(ORDER.map((skill) => [skill, skill === 'ALG' ? 0 : 1]));

    expectInferenceError(
      () => createPriorDistribution({ marginals: allOnesButAlg, compatibility: { epsilon: 1e-301 } }, KNOWLEDGE_GRAPH),
      'INVALID_NORMALIZATION',
    );
  });

  it('exige un grafo con exactamente las seis competencias', () => {
    const extra = { id: 'XXX', name: 'X', description: 'X', prerequisites: [] };
    const without = { nodes: KNOWLEDGE_GRAPH.nodes.filter((node) => node.id !== 'ECU') };
    const renamed = { nodes: [...without.nodes, extra] };
    const config: PriorConfig = {};

    expectInferenceError(() => createPriorDistribution(config, without), 'INVALID_GRAPH');
    expectInferenceError(() => createPriorDistribution(config, renamed), 'INVALID_GRAPH');
    expectInferenceError(
      () => createPriorDistribution(config, { nodes: [...KNOWLEDGE_GRAPH.nodes, extra] }),
      'INVALID_GRAPH',
    );
    expectInferenceError(() => createPriorDistribution(config, { nodes: [] }), 'INVALID_GRAPH');
  });

  it('propaga el error de un grafo con estructura inválida', () => {
    const cyclic: KnowledgeGraph = {
      nodes: KNOWLEDGE_GRAPH.nodes.map((node) => (node.id === 'OPS' ? { ...node, prerequisites: ['ECU'] } : node)),
    };

    expect(() => createPriorDistribution({}, cyclic)).toThrow(KnowledgeGraphError);
  });
});

describe('updatePosterior con una competencia', () => {
  it('tras un acierto la marginal es 18/23', () => {
    expectClose(marginals(updatePosterior(UNIFORM, question(['ALG']), true)).ALG, q(18, 23));
  });

  it('tras un fallo la marginal es 2/17', () => {
    expectClose(marginals(updatePosterior(UNIFORM, question(['ALG']), false)).ALG, q(2, 17));
  });

  it.each([[true], [false]])('las competencias no consultadas siguen en 0.5 (acierto: %j)', (correct) => {
    const result = marginals(updatePosterior(UNIFORM, question(['ALG']), correct));

    for (const skill of ORDER.filter((item) => item !== 'ALG')) {
      expectClose(result[skill], 0.5);
    }
  });

  it('mantiene una distribución normalizada', () => {
    const joint = updatePosterior(UNIFORM, question(['NEG', 'ECU']), false);

    expectClose(joint.reduce((sum, mass) => sum + mass, 0), 1);
  });

  it('no pierde precisión con un slip muy pequeño', () => {
    const result = marginals(updatePosterior(UNIFORM, question(['OPS'], 1e-12, 0.25), false)).OPS ?? Number.NaN;
    const expected = 1e-12 / (0.75 + 1e-12);

    expect(Math.abs(result - expected) / expected).toBeLessThan(1e-12);
  });

  it('un prior determinista no cambia con la evidencia', () => {
    const joint = updatePosterior(pointMass(63), question(['ALG']), false);

    expect(joint).toEqual(pointMass(63));
    expect(Object.values(marginals(joint))).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it('los estados con masa cero siguen en cero', () => {
    const half: JointDistribution = UNIFORM.map((_, index) => (index % 2 === 0 ? 1 / 32 : 0));

    expect(marginals(updatePosterior(half, question(['OPS']), true)).OPS).toBe(0);
  });
});

describe('updatePosterior con una pregunta multicompetencia', () => {
  const required = ['OPS', 'NEG'];
  const joint = updatePosterior(UNIFORM, question(required), true);

  it('da 23/33 en cada marginal y 6/11 en la probabilidad de dominar ambas', () => {
    const result = marginals(joint);

    expectClose(result.OPS, q(23, 33));
    expectClose(result.NEG, q(23, 33));
    expectClose(masteryProbability(joint, required), q(6, 11));
  });

  it('no sustituye la conjunta por el producto de marginales', () => {
    const product = toNumber(q(23, 33)) ** 2;

    expect(Math.abs(masteryProbability(joint, required) - product)).toBeGreaterThan(0.05);
  });

  it('no duplica la evidencia actualizando cada competencia por separado', () => {
    const separated = toNumber(q(18, 23));

    expect(Math.abs((marginals(joint).OPS ?? 0) - separated)).toBeGreaterThan(0.05);
  });

  it('deja en 0.5 las competencias no requeridas', () => {
    expectClose(marginals(joint).ECU, 0.5);
  });

  it('coincide estado a estado con el cálculo exacto', () => {
    const expected = exactPosterior([{ required, correct: true }]);

    joint.forEach((mass, index) => {
      expectClose(mass, expected[index] ?? q(-1));
    });
  });
});

describe('actualizaciones sucesivas', () => {
  const evidence: readonly Evidence[] = [
    { required: ['OPS'], correct: true },
    { required: ['NEG', 'ALG'], correct: false },
    { required: ['FRA'], correct: true },
    { required: ['JER', 'FRA'], correct: true },
    { required: ['ECU', 'NEG', 'ALG'], correct: false },
  ];
  const expected = exactPosterior(evidence);

  it('coinciden con el cálculo exacto por lotes', () => {
    applyEvidence(evidence).forEach((mass, index) => {
      expectClose(mass, expected[index] ?? q(-1));
    });
  });

  it('no dependen del orden de la evidencia', () => {
    for (const order of permutations(evidence)) {
      applyEvidence(order).forEach((mass, index) => {
        expectClose(mass, expected[index] ?? q(-1));
      });
    }
  });

  it('sus consultas coinciden con las exactas', () => {
    const joint = applyEvidence(evidence);

    for (const skill of ORDER) {
      expectClose(marginals(joint)[skill], exactMastery(expected, [skill]));
    }
    expectClose(masteryProbability(joint, ['NEG', 'ALG', 'ECU']), exactMastery(expected, ['NEG', 'ALG', 'ECU']));
  });
});

describe('validación de updatePosterior', () => {
  const valid = question(['OPS']);

  it.each([
    ['63 masas', UNIFORM.slice(1)],
    ['65 masas', [...UNIFORM, 0]],
    ['vacía', []],
    ['un NaN', UNIFORM.map((mass, index) => (index === 3 ? Number.NaN : mass))],
    ['un Infinity', UNIFORM.map((mass, index) => (index === 3 ? Number.POSITIVE_INFINITY : mass))],
    ['una masa negativa', UNIFORM.map((mass, index) => (index === 0 ? -mass : mass))],
    ['masa cero', UNIFORM.map(() => 0)],
    ['suma 2', UNIFORM.map((mass) => mass * 2)],
    ['suma alejada de 1', UNIFORM.map((mass) => mass * (1 + 1e-6))],
    ['un texto', UNIFORM.map((mass, index) => (index === 0 ? String(mass) : mass))],
    ['huecos', new Array<number>(64)],
    ['otro tipo', 'uniforme'],
    ['null', null],
  ])('rechaza una distribución con %s', (_, joint) => {
    const invalid = joint as unknown as JointDistribution;

    expectInferenceError(() => updatePosterior(invalid, valid, true), 'INVALID_DISTRIBUTION');
    expectInferenceError(() => marginals(invalid), 'INVALID_DISTRIBUTION');
    expectInferenceError(() => masteryProbability(invalid, []), 'INVALID_DISTRIBUTION');
    expectInferenceError(() => jointEntropy(invalid), 'INVALID_DISTRIBUTION');
  });

  it('acepta una suma dentro de la tolerancia documentada', () => {
    const nearlyOne = UNIFORM.map((mass) => mass * (1 + 1e-10));

    expect(() => updatePosterior(nearlyOne, valid, true)).not.toThrow();
  });

  it('rechaza parámetros y competencias inválidos', () => {
    expectInferenceError(() => updatePosterior(UNIFORM, question(['OPS'], 0.5, 0.5), true), 'INVALID_PARAMETERS');
    expectInferenceError(() => updatePosterior(UNIFORM, question(['OPS'], Number.NaN), true), 'INVALID_PARAMETERS');
    expectInferenceError(() => updatePosterior(UNIFORM, question(['XXX']), true), 'UNKNOWN_SKILL');
    expectInferenceError(() => updatePosterior(UNIFORM, null as unknown as DinaQuestion, true), 'INVALID_QUESTION');
  });

  it.each([['true'], [1], [null], [undefined]])('rechaza la evidencia %j', (evidence) => {
    expectInferenceError(() => updatePosterior(UNIFORM, valid, evidence as unknown as boolean), 'INVALID_EVIDENCE');
  });

  it('lanza un error tipado si la masa total cae por debajo de 1e-300', () => {
    const tiny = question(['OPS'], 0.1, 1e-301);

    expectInferenceError(() => updatePosterior(pointMass(0), tiny, true), 'INVALID_NORMALIZATION');
  });
});

describe('consultas', () => {
  // Correlación perfecta: OPS y NEG se dominan juntas o no se dominan.
  const correlated: JointDistribution = UNIFORM.map((_, index) => (index === 0 || index === 3 ? 0.5 : 0));

  it('calculan la conjunta real en estados correlacionados', () => {
    const result = marginals(correlated);

    expect(result.OPS).toBe(0.5);
    expect(result.NEG).toBe(0.5);
    expect(masteryProbability(correlated, ['OPS', 'NEG'])).toBe(0.5);
    expect(masteryProbability(correlated, ['OPS', 'NEG'])).not.toBe((result.OPS ?? 0) * (result.NEG ?? 0));
  });

  it('calculan anticorrelación', () => {
    const opposite: JointDistribution = UNIFORM.map((_, index) => (index === 1 || index === 2 ? 0.5 : 0));

    expect(masteryProbability(opposite, ['OPS', 'NEG'])).toBe(0);
  });

  it('el conjunto vacío tiene probabilidad 1', () => {
    expect(masteryProbability(UNIFORM, [])).toBe(1);
    expect(masteryProbability(pointMass(0), [])).toBe(1);
  });

  it('no dependen del orden del conjunto', () => {
    expect(masteryProbability(correlated, ['NEG', 'OPS'])).toBe(masteryProbability(correlated, ['OPS', 'NEG']));
  });

  it('nunca superan 1 por redondeo', () => {
    const joint = applyEvidenceRepeatedly();

    for (const probability of Object.values(marginals(joint))) {
      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(1);
    }
  });

  it('rechazan conjuntos inválidos', () => {
    expectInferenceError(() => masteryProbability(UNIFORM, ['XXX']), 'UNKNOWN_SKILL');
    expectInferenceError(() => masteryProbability(UNIFORM, ['OPS', 'OPS']), 'INVALID_SKILL_SET');
  });

  it('devuelven las marginales de las seis competencias', () => {
    expect(Object.keys(marginals(UNIFORM)).sort()).toEqual([...ORDER].sort());
  });
});

function applyEvidenceRepeatedly(): JointDistribution {
  return Array.from({ length: 200 }).reduce<JointDistribution>(
    (joint) => updatePosterior(joint, question(['OPS']), true),
    UNIFORM,
  );
}

describe('createInitialDiagnosticState', () => {
  it('incluye solo los campos acordados, sin observaciones', () => {
    const state = createInitialDiagnosticState('S01');

    expect(Object.keys(state).sort()).toEqual(['joint', 'priorConfig', 'skillOrder', 'studentId']);
    expect(state.studentId).toBe('S01');
    expect(state.skillOrder).toEqual(ORDER);
    expect(state.joint).toEqual(UNIFORM);
  });

  it('guarda la configuración efectiva completa', () => {
    const state = createInitialDiagnosticState(
      'S01',
      { marginals: { OPS: 0.8 }, compatibility: { epsilon: 0.1 } },
      KNOWLEDGE_GRAPH,
    );

    expect(state.priorConfig).toEqual({
      marginals: { OPS: 0.8, NEG: 0.5, FRA: 0.5, JER: 0.5, ALG: 0.5, ECU: 0.5 },
      compatibility: { epsilon: 0.1 },
    });
    expect(createInitialDiagnosticState('S01').priorConfig.compatibility).toBeNull();
  });

  it('permite reproducir el mismo prior desde su copia serializada', () => {
    const state = createInitialDiagnosticState('S01', { marginals: { ALG: 0.3 }, compatibility: { epsilon: 0.2 } }, KNOWLEDGE_GRAPH);
    const copy = serializedCopy(state.priorConfig) as PriorConfig;

    expect(createInitialDiagnosticState('S02', copy, KNOWLEDGE_GRAPH).joint).toEqual(state.joint);
  });

  it('no comparte referencias con SKILL_ORDER ni con la configuración recibida', () => {
    const config: PriorConfig = { marginals: { OPS: 0.8 }, compatibility: { epsilon: 0.1 } };
    const state = createInitialDiagnosticState('S01', config, KNOWLEDGE_GRAPH);

    expect(state.skillOrder).not.toBe(SKILL_ORDER);
    expect(state.priorConfig.marginals).not.toBe(config.marginals);
    expect(state.priorConfig.compatibility).not.toBe(config.compatibility);
  });

  it('rechaza entradas inválidas', () => {
    expectInferenceError(() => createInitialDiagnosticState(''), 'INVALID_STUDENT_ID');
    expectInferenceError(() => createInitialDiagnosticState('   '), 'INVALID_STUDENT_ID');
    expectInferenceError(() => createInitialDiagnosticState('S01', { marginals: { OPS: 2 } }), 'INVALID_PRIOR');
    expectInferenceError(
      () => createInitialDiagnosticState('S01', { compatibility: { epsilon: 0.1 } }),
      'MISSING_GRAPH',
    );
  });
});

describe('pureza y serialización', () => {
  it('funciona con entradas congeladas y no las altera', () => {
    const joint = Object.freeze([...UNIFORM]);
    const frozenQuestion = Object.freeze({
      primarySkill: 'OPS',
      secondarySkills: Object.freeze(['NEG']),
      slip: 0.1,
      guess: 0.25,
    });
    const config = Object.freeze({
      marginals: Object.freeze({ OPS: 0.8 }),
      compatibility: Object.freeze({ epsilon: 0.1 }),
    });

    const updated = updatePosterior(joint, frozenQuestion, true);
    expect(updated).not.toBe(joint);
    expect(joint).toEqual(UNIFORM);
    expect(() => marginals(joint)).not.toThrow();
    expect(() => createInitialDiagnosticState('S01', config, KNOWLEDGE_GRAPH)).not.toThrow();
  });

  it('devuelve resultados serializables como JSON sin pérdidas', () => {
    const state = createInitialDiagnosticState('S01', { marginals: { OPS: 0.8 } });
    const joint = updatePosterior(state.joint, question(['OPS', 'NEG']), true);

    expect(serializedCopy(state)).toEqual(state);
    expect(serializedCopy(joint)).toEqual(joint);
    expect(serializedCopy(marginals(joint))).toEqual(marginals(joint));
  });
});
