import { describe, expect, it } from 'vitest';
import { InferenceError, KNOWLEDGE_GRAPH, KnowledgeGraphError } from '../../src/engine/index.ts';
import type { InterventionPlan, KnowledgeGraph } from '../../src/engine/index.ts';
import {
  SimulationError,
  applySyntheticIntervention,
  createResponseUniforms,
  createStream,
  createSyntheticClass,
  simulateResponse,
} from '../../src/simulation/index.ts';
import type {
  SimulationErrorCode,
  SyntheticClass,
  SyntheticInterventionConfig,
  SyntheticInterventionResult,
  SyntheticStudent,
} from '../../src/simulation/index.ts';
import { choiceQuestion, deepFreeze } from '../engine/support/bank.ts';
import { ORDER, serializedCopy } from '../engine/support/inference.ts';

type Bits = readonly (0 | 1)[];

const SEED = 7;
const NONE: Bits = [0, 0, 0, 0, 0, 0];
const ALL_IMPROVE: SyntheticInterventionConfig = { improvementProbability: 1, prerequisiteImprovementFactor: 1 };

// Plan escrito a mano, sin funciones de producción.
function planOf(skills: readonly string[], overrides: Partial<InterventionPlan> = {}): InterventionPlan {
  return {
    interventions: skills.map((skill) => ({
      id: `reinforce-${skill}`,
      skill,
      title: `Reforzar ${skill}`,
      durationMinutes: 15,
    })),
    totalMinutes: 15 * skills.length,
    coverage: 0.3,
    benefit: 0.4,
    cost: 0.05,
    netValue: 0.35,
    ...overrides,
  };
}

function classWith(masteries: readonly Bits[], populationSeed = 42): SyntheticClass {
  const base = createSyntheticClass(populationSeed, masteries.length, KNOWLEDGE_GRAPH);
  return {
    ...base,
    students: base.students.map((student, index) => ({ ...student, trueMastery: masteries[index] ?? [] })),
  };
}

function repeated(mastery: Bits, count: number): SyntheticClass {
  return classWith(Array.from({ length: count }, () => mastery));
}

function apply(
  classState: SyntheticClass,
  skills: readonly string[],
  config?: SyntheticInterventionConfig,
  seed = SEED,
): SyntheticInterventionResult {
  return applySyntheticIntervention(classState, planOf(skills), KNOWLEDGE_GRAPH, seed, config);
}

function masteryOf(result: SyntheticInterventionResult, studentId: string): readonly number[] | undefined {
  return result.postClass.students.find((student) => student.studentId === studentId)?.trueMastery;
}

function bit(student: SyntheticStudent, skill: string): number | undefined {
  return student.trueMastery[ORDER.indexOf(skill)];
}

// Valores según la regla documentada de etiquetas.
function improvementUniform(studentId: string, skill: string, seed = SEED): number {
  return createStream(seed, `intervention/["improvement",${JSON.stringify(studentId)},${JSON.stringify(skill)}]`)();
}

function controlValue(studentId: string, seed = SEED): number {
  return createStream(seed, `intervention/["control",${JSON.stringify(studentId)}]`)();
}

function expectSimulationError(action: () => unknown, code: SimulationErrorCode): void {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(SimulationError);
  expect(caught).toMatchObject({ name: 'SimulationError', code });
}

describe('referencia independiente', () => {
  it('coincide con una réplica en Python', () => {
    const before = classWith([
      [1, 1, 1, 0, 0, 0],
      [1, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 1, 0],
      [1, 1, 0, 1, 0, 1],
      [0, 0, 0, 0, 0, 0],
    ]);
    const result = apply(before, ['NEG', 'JER', 'ALG', 'ECU'], { improvementProbability: 0.8, controlFraction: 0.34 });

    expect(result.assignment.controlStudentIds).toEqual(['S05', 'S06']);
    expect(result.postClass.students.map((student) => student.trueMastery)).toEqual([
      [1, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 1, 1],
      [1, 1, 0, 1, 0, 1],
      [0, 0, 0, 0, 0, 0],
    ]);
    expect(result.simulatedChanges).toEqual([
      { studentId: 'S01', skill: 'JER', appliedProbability: 0.8 },
      { studentId: 'S02', skill: 'ALG', appliedProbability: 0.8 },
      { studentId: 'S04', skill: 'ECU', appliedProbability: 0.4 },
    ]);
  });
});

describe('reglas de mejora', () => {
  it('probabilidad 0: nada cambia', () => {
    const result = apply(repeated(NONE, 20), ['OPS'], { improvementProbability: 0 });

    expect(result.simulatedChanges).toEqual([]);
    expect(result.postClass.students.every((student) => bit(student, 'OPS') === 0)).toBe(true);
  });

  it('probabilidad 1: mejoran todos los tratados que no dominaban', () => {
    const result = apply(repeated(NONE, 20), ['OPS'], { improvementProbability: 1 });

    expect(result.simulatedChanges).toHaveLength(20);
    expect(result.postClass.students.every((student) => bit(student, 'OPS') === 1)).toBe(true);
  });

  it('usa la probabilidad por defecto de 0.35 con el uniforme de cada alumno', () => {
    const { postClass } = apply(repeated(NONE, 200), ['OPS']);

    for (const student of postClass.students) {
      expect(bit(student, 'OPS')).toBe(improvementUniform(student.studentId, 'OPS') < 0.35 ? 1 : 0);
    }
  });

  it('solo cambian las competencias seleccionadas', () => {
    const result = apply(repeated(NONE, 5), ['FRA', 'NEG'], ALL_IMPROVE);

    for (const student of result.postClass.students) {
      expect(student.trueMastery).toEqual([0, 1, 1, 0, 0, 0]);
    }
  });

  it('solo cambian los tratados', () => {
    const result = apply(repeated(NONE, 10), ['OPS'], { ...ALL_IMPROVE, controlFraction: 0.5 });

    for (const id of result.assignment.controlStudentIds) {
      expect(masteryOf(result, id)).toEqual(NONE);
    }
    for (const id of result.assignment.treatedStudentIds) {
      expect(masteryOf(result, id)).toEqual([1, 0, 0, 0, 0, 0]);
    }
    expect(result.simulatedChanges.map((change) => change.studentId)).toEqual(result.assignment.treatedStudentIds);
  });

  it('quien ya dominaba no aparece como cambio', () => {
    const result = apply(classWith([[1, 0, 0, 0, 0, 0], NONE]), ['OPS'], ALL_IMPROVE);

    expect(result.simulatedChanges.map((change) => change.studentId)).toEqual(['S02']);
  });

  it('no se pierde dominio', () => {
    const before = repeated([1, 0, 1, 0, 1, 0], 50);
    const result = apply(before, ['NEG', 'FRA', 'ALG', 'ECU'], { controlFraction: 0.2 });

    for (const student of result.postClass.students) {
      for (const skill of ['OPS', 'FRA', 'ALG']) {
        expect(bit(student, skill)).toBe(1);
      }
    }
  });

  it('factor 0: con un ancestro ausente no hay mejora; sin ancestros, sí', () => {
    const result = apply(repeated(NONE, 5), ['OPS', 'NEG'], { improvementProbability: 1, prerequisiteImprovementFactor: 0 });

    for (const student of result.postClass.students) {
      expect(student.trueMastery).toEqual([1, 0, 0, 0, 0, 0]);
    }
  });

  it('factor 1: los ancestros ausentes no reducen la probabilidad', () => {
    const result = apply(repeated(NONE, 5), ['ECU'], ALL_IMPROVE);

    expect(result.simulatedChanges).toHaveLength(5);
    expect(result.simulatedChanges[0]?.appliedProbability).toBe(1);
  });

  it('comprueba todos los ancestros, no solo los prerrequisitos directos', () => {
    // ALG, único prerrequisito directo de ECU, está dominada; falta OPS, que es ancestro.
    const before = repeated([0, 1, 1, 1, 1, 0], 5);
    const result = apply(before, ['ECU'], { improvementProbability: 1, prerequisiteImprovementFactor: 0 });

    expect(result.simulatedChanges).toEqual([]);
  });

  it('con todos los ancestros dominados no aplica el factor', () => {
    const before = repeated([1, 1, 1, 1, 1, 0], 5);
    const result = apply(before, ['ECU'], { improvementProbability: 1, prerequisiteImprovementFactor: 0 });

    expect(result.simulatedChanges).toHaveLength(5);
  });

  it('aplica el factor una sola vez aunque falten varios ancestros', () => {
    // A ALG le faltan OPS, NEG, FRA y JER: 0.8·0.5 = 0.4, no 0.8·0.5^4.
    const result = apply(repeated(NONE, 300), ['ALG'], { improvementProbability: 0.8, prerequisiteImprovementFactor: 0.5 });

    for (const student of result.postClass.students) {
      expect(bit(student, 'ALG')).toBe(improvementUniform(student.studentId, 'ALG') < 0.4 ? 1 : 0);
    }
    expect(result.simulatedChanges.every((change) => change.appliedProbability === 0.4)).toBe(true);
    const aboveTwice = result.simulatedChanges.filter((change) => improvementUniform(change.studentId, 'ALG') >= 0.2);
    expect(aboveTwice.length).toBeGreaterThan(0);
  });

  it('sin cascada: una mejora del plan no prepara a otra competencia del mismo plan', () => {
    // OPS mejora con seguridad, pero NEG se evalúa con OPS sin dominar.
    const result = apply(repeated(NONE, 5), ['OPS', 'NEG', 'JER'], { improvementProbability: 1, prerequisiteImprovementFactor: 0 });

    for (const student of result.postClass.students) {
      expect(student.trueMastery).toEqual([1, 0, 0, 0, 0, 0]);
    }
  });

  it('sin cascada: la probabilidad no depende de que el ancestro esté en el plan', () => {
    const config = { improvementProbability: 0.6 };
    const alone = apply(repeated(NONE, 100), ['NEG'], config);
    const withAncestor = apply(repeated(NONE, 100), ['OPS', 'NEG'], config);
    const negChanges = withAncestor.simulatedChanges.filter((change) => change.skill === 'NEG');

    expect(negChanges).toEqual(alone.simulatedChanges);
  });

  it('plan vacío: α no cambia y la asignación se mantiene', () => {
    const before = classWith([[1, 0, 1, 0, 1, 0], NONE, [1, 1, 1, 1, 1, 1], NONE]);
    const result = apply(before, [], { controlFraction: 0.5 });

    expect(result.postClass.students.map((student) => student.trueMastery)).toEqual(before.students.map((student) => student.trueMastery));
    expect(result.simulatedChanges).toEqual([]);
    expect(result.provenance.intervenedSkills).toEqual([]);
    expect(result.assignment).toEqual(apply(before, ['OPS'], { controlFraction: 0.5 }).assignment);
  });
});

describe('asignación a control', () => {
  it('por defecto no hay control, y se identifica', () => {
    const { assignment } = apply(repeated(NONE, 4), ['OPS']);

    expect(assignment).toEqual({
      treatedStudentIds: ['S01', 'S02', 'S03', 'S04'],
      controlStudentIds: [],
      treatmentIsEmpty: false,
      controlIsEmpty: true,
    });
  });

  it('toma los primeros por su valor estable', () => {
    const before = repeated(NONE, 30);
    const expected = before.students
      .map((student) => student.studentId)
      .sort((a, b) => controlValue(a) - controlValue(b))
      .slice(0, 9)
      .sort();

    expect(apply(before, ['OPS'], { controlFraction: 0.3 }).assignment.controlStudentIds).toEqual(expected);
  });

  it.each<[number, number]>([
    [0, 0],
    [0.14, 0],
    [0.5, 3],
    [0.99, 6],
    [1, 7],
  ])('fracción %d con 7 alumnos: %d controles', (fraction, controls) => {
    const { assignment } = apply(repeated(NONE, 7), ['OPS'], { controlFraction: fraction });

    expect(assignment.controlStudentIds).toHaveLength(controls);
    expect(assignment.treatedStudentIds).toHaveLength(7 - controls);
    expect(new Set([...assignment.controlStudentIds, ...assignment.treatedStudentIds]).size).toBe(7);
  });

  it('fracción 1: tratamiento vacío, identificado y sin cambios', () => {
    const result = apply(repeated(NONE, 5), ['OPS'], { ...ALL_IMPROVE, controlFraction: 1 });

    expect(result.assignment.treatmentIsEmpty).toBe(true);
    expect(result.assignment.controlIsEmpty).toBe(false);
    expect(result.simulatedChanges).toEqual([]);
  });

  it('una fracción menor da un subconjunto del control', () => {
    const before = repeated(NONE, 30);
    const small = apply(before, [], { controlFraction: 0.2 }).assignment.controlStudentIds;
    const large = apply(before, [], { controlFraction: 0.5 }).assignment.controlStudentIds;

    expect(large).toEqual(expect.arrayContaining([...small]));
  });

  it('clase vacía: salida válida con ambos grupos vacíos', () => {
    const result = apply(createSyntheticClass(1, 0, KNOWLEDGE_GRAPH), ['OPS'], { controlFraction: 0.5 });

    expect(result.assignment).toEqual({
      treatedStudentIds: [],
      controlStudentIds: [],
      treatmentIsEmpty: true,
      controlIsEmpty: true,
    });
    expect(result.postClass.students).toEqual([]);
    expect(result.postClass.studentCount).toBe(0);
    expect(result.simulatedChanges).toEqual([]);
  });
});

describe('reproducibilidad y estabilidad', () => {
  const before = createSyntheticClass(42, 40, KNOWLEDGE_GRAPH);
  const config = { controlFraction: 0.25 };

  it('la misma semilla y configuración repiten exactamente el resultado', () => {
    expect(JSON.stringify(apply(before, ['NEG', 'ALG'], config))).toBe(JSON.stringify(apply(before, ['NEG', 'ALG'], config)));
  });

  it('otra semilla de intervención cambia la asignación', () => {
    expect(apply(before, ['NEG'], config, 1).assignment).not.toEqual(apply(before, ['NEG'], config, 2).assignment);
  });

  it('la semilla de intervención es independiente de la de población', () => {
    const first = apply(createSyntheticClass(1, 30, KNOWLEDGE_GRAPH), [], config);
    const second = apply(createSyntheticClass(2, 30, KNOWLEDGE_GRAPH), [], config);

    expect(first.assignment).toEqual(second.assignment);
    expect(first.provenance.populationSeed).toBe(1);
    expect(second.provenance.populationSeed).toBe(2);
    expect(first.provenance.interventionSeed).toBe(SEED);
  });

  it('permutar los alumnos no cambia el resultado', () => {
    const permuted = { ...before, students: [...before.students].reverse() };

    expect(apply(permuted, ['NEG', 'ALG'], config)).toEqual(apply(before, ['NEG', 'ALG'], config));
  });

  it('permutar las intervenciones no cambia el resultado', () => {
    expect(apply(before, ['ALG', 'FRA', 'NEG'], config)).toEqual(apply(before, ['NEG', 'FRA', 'ALG'], config));
  });

  it('permutar nodos y prerrequisitos no cambia el resultado', () => {
    const graph: KnowledgeGraph = {
      nodes: [...KNOWLEDGE_GRAPH.nodes].reverse().map((node) => ({ ...node, prerequisites: [...node.prerequisites].reverse() })),
    };

    expect(applySyntheticIntervention(before, planOf(['ECU']), graph, SEED, config)).toEqual(apply(before, ['ECU'], config));
  });

  it('dos planes comparten asignación y uniformes en las competencias comunes', () => {
    const first = apply(before, ['NEG', 'FRA'], config);
    const second = apply(before, ['NEG', 'ALG', 'ECU'], config);
    const onNeg = (result: SyntheticInterventionResult): unknown => result.simulatedChanges.filter((change) => change.skill === 'NEG');

    expect(first.assignment).toEqual(second.assignment);
    expect(onNeg(first)).toEqual(onNeg(second));
    expect(onNeg(first)).not.toEqual([]);
  });

  it('los valores numéricos del plan no intervienen', () => {
    const other = planOf(['NEG'], { benefit: 0.99, netValue: -5, coverage: 0.9, cost: 3 });
    const longer = {
      ...planOf(['NEG']),
      interventions: planOf(['NEG']).interventions.map((item) => ({ ...item, durationMinutes: 40 })),
      totalMinutes: 40,
    };
    const reference = apply(before, ['NEG'], config);

    expect(applySyntheticIntervention(before, other, KNOWLEDGE_GRAPH, SEED, config)).toEqual(reference);
    expect(applySyntheticIntervention(before, longer, KNOWLEDGE_GRAPH, SEED, config)).toEqual(reference);
  });

  it('ordena los alumnos por id también con más de 99', () => {
    const large = createSyntheticClass(42, 101, KNOWLEDGE_GRAPH);
    const ids = apply(large, []).postClass.students.map((student) => student.studentId);

    expect(ids).toEqual(large.students.map((student) => student.studentId).sort());
  });
});

describe('población y respuestas', () => {
  const question = choiceQuestion('Q1', ['OPS']);

  it('no altera la clase original ni la tabla de respuestas', () => {
    const before = repeated(NONE, 10);
    const table = createResponseUniforms(42, before.students.map((student) => student.studentId), ['Q1'], 'pretest');
    const classCopy = JSON.stringify(before);
    const tableCopy = JSON.stringify(table);

    apply(before, ['OPS'], ALL_IMPROVE);

    expect(JSON.stringify(before)).toBe(classCopy);
    expect(JSON.stringify(table)).toBe(tableCopy);
  });

  it('una tabla previa sirve para postClass y responde según la nueva α', () => {
    const before = repeated(NONE, 30);
    const table = createResponseUniforms(42, before.students.map((student) => student.studentId), ['Q1'], 'pretest');
    const { postClass } = apply(before, ['OPS'], ALL_IMPROVE);

    const answers = (classState: SyntheticClass): readonly string[] =>
      classState.students.map((student) => simulateResponse(classState, student.studentId, question, table));
    const pairs = table.entries.map((entry, index) => [entry.correctness, answers(before)[index], answers(postClass)[index]] as const);

    // guess 0.25, 1 - slip 0.9.
    for (const [uniform, previous, next] of pairs) {
      expect(previous === 'c').toBe(uniform < 0.25);
      expect(next === 'c').toBe(uniform < 0.9);
    }
    expect(pairs.some(([, previous, next]) => previous !== next)).toBe(true);
  });

  it('conserva ids, grupos, nombres, orden de competencias, semilla y configuración', () => {
    const before = createSyntheticClass(42, 9, KNOWLEDGE_GRAPH, { prerequisiteFactor: 0.25 });
    const { postClass } = apply(before, ['OPS', 'ALG'], ALL_IMPROVE);
    const identity = (classState: SyntheticClass): unknown =>
      classState.students.map(({ studentId, displayName, groupId }) => ({ studentId, displayName, groupId }));

    expect(identity(postClass)).toEqual(identity(before));
    expect(postClass.seed).toBe(42);
    expect(postClass.skillOrder).toEqual(ORDER);
    expect(postClass.generator).toEqual(before.generator);
    expect(postClass.config).toEqual(before.config);
    expect(postClass.studentCount).toBe(9);
  });

  it('regenerar desde la semilla de población no reproduce postClass', () => {
    const before = createSyntheticClass(42, 30, KNOWLEDGE_GRAPH);
    const { postClass } = apply(before, ['ECU', 'ALG'], ALL_IMPROVE);

    expect(postClass.students).not.toEqual(createSyntheticClass(postClass.seed, 30, KNOWLEDGE_GRAPH).students);
  });

  it('no copia datos ajenos de los alumnos', () => {
    const before = repeated(NONE, 2);
    const extended = { ...before, students: before.students.map((student) => ({ ...student, latentTrait: 1 })) };

    expect(JSON.stringify(apply(extended, []))).not.toContain('latentTrait');
  });
});

describe('validación', () => {
  const valid = repeated(NONE, 3);
  const plan = planOf(['OPS']);
  const run = (overrides: {
    classState?: unknown;
    intervention?: unknown;
    graph?: unknown;
    seed?: unknown;
    config?: unknown;
  }): SyntheticInterventionResult => {
    const { classState = valid, intervention = plan, graph = KNOWLEDGE_GRAPH, seed = SEED } = overrides;
    return applySyntheticIntervention(
      classState as SyntheticClass,
      intervention as InterventionPlan,
      graph as KnowledgeGraph,
      seed as number,
      overrides.config as SyntheticInterventionConfig,
    );
  };
  const withStudent = (change: Readonly<Record<string, unknown>>): unknown => ({
    ...valid,
    students: valid.students.map((student, index) => (index === 0 ? { ...student, ...change } : student)),
  });

  it('acepta una α que ya no coincide con la generada', () => {
    expect(() => run({ classState: withStudent({ trueMastery: [1, 1, 1, 1, 1, 1] }) })).not.toThrow();
  });

  it.each<[string, unknown]>([
    ['nula', null],
    ['sin alumnos', { ...valid, students: undefined }],
    ['con otro orden de competencias', { ...valid, skillOrder: [...ORDER].reverse() }],
    ['con otro generador', { ...valid, generator: { algorithm: 'mulberry32', version: 2 } }],
    ['con studentCount incoherente', { ...valid, studentCount: 9 }],
    ['con un alumno repetido', withStudent({ studentId: 'S02' })],
    ['con α no binaria', withStudent({ trueMastery: [2, 0, 0, 0, 0, 0] })],
    ['sin grupo', withStudent({ groupId: '' })],
    ['sin nombre', withStudent({ displayName: undefined })],
  ])('rechaza una clase %s', (_, classState) => {
    expectSimulationError(() => run({ classState }), 'INVALID_SYNTHETIC_CLASS');
  });

  it.each<[string, unknown]>([
    ['negativa', -1],
    ['fuera de uint32', 2 ** 32],
    ['decimal', 1.5],
    ['de texto', '7'],
  ])('rechaza una semilla %s', (_, seed) => {
    expectSimulationError(() => run({ seed }), 'INVALID_SEED');
  });

  it('acepta la semilla 0 y la máxima', () => {
    expect(run({ seed: 0 }).provenance.interventionSeed).toBe(0);
    expect(run({ seed: 2 ** 32 - 1 }).provenance.interventionSeed).toBe(2 ** 32 - 1);
  });

  it('rechaza un grafo sin las seis competencias', () => {
    let caught: unknown;
    try {
      run({ graph: { nodes: KNOWLEDGE_GRAPH.nodes.slice(0, 5) } });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(InferenceError);
    expect(caught).toMatchObject({ code: 'INVALID_GRAPH' });
  });

  it('rechaza un grafo con un ciclo', () => {
    const graph = { nodes: KNOWLEDGE_GRAPH.nodes.map((node) => (node.id === 'OPS' ? { ...node, prerequisites: ['ECU'] } : node)) };

    expect(() => run({ graph })).toThrow(KnowledgeGraphError);
  });

  it.each<[string, unknown]>([
    ['nula', null],
    ['que no es un objeto', 1],
    ['con probabilidad negativa', { improvementProbability: -0.1 }],
    ['con probabilidad mayor que 1', { improvementProbability: 1.1 }],
    ['con probabilidad NaN', { improvementProbability: Number.NaN }],
    ['con probabilidad nula', { improvementProbability: null }],
    ['con factor negativo', { prerequisiteImprovementFactor: -0.1 }],
    ['con factor infinito', { prerequisiteImprovementFactor: Number.POSITIVE_INFINITY }],
    ['con fracción mayor que 1', { controlFraction: 1.5 }],
    ['con fracción de texto', { controlFraction: '0.5' }],
  ])('rechaza una configuración %s', (_, config) => {
    expectSimulationError(() => run({ config }), 'INVALID_INTERVENTION_CONFIG');
  });

  const [item] = plan.interventions;

  it.each<[string, unknown]>([
    ['nulo', null],
    ['sin intervenciones', { ...plan, interventions: undefined }],
    ['con una intervención nula', { ...plan, interventions: [null] }],
    ['con una competencia desconocida', { ...plan, interventions: [{ ...item, skill: 'XXX', id: 'reinforce-XXX' }] }],
    ['con una competencia repetida', { ...plan, interventions: [item, item], totalMinutes: 30 }],
    ['con un id incoherente', { ...plan, interventions: [{ ...item, id: 'reinforce-NEG' }] }],
    ['sin título', { ...plan, interventions: [{ ...item, title: '' }] }],
    ['con duración nula', { ...plan, interventions: [{ ...item, durationMinutes: 0 }], totalMinutes: 0 }],
    ['con duración infinita', { ...plan, interventions: [{ ...item, durationMinutes: Number.POSITIVE_INFINITY }] }],
    ['con totalMinutes incoherente', { ...plan, totalMinutes: 20 }],
    ['con netValue NaN', { ...plan, netValue: Number.NaN }],
    ['sin benefit', { ...plan, benefit: undefined }],
  ])('rechaza un plan %s', (_, intervention) => {
    expectSimulationError(() => run({ intervention }), 'INVALID_INTERVENTION_PLAN');
  });
});

describe('contrato de la salida', () => {
  it('no muta entradas congeladas', () => {
    const classState = deepFreeze(createSyntheticClass(42, 6, KNOWLEDGE_GRAPH));
    const graph = deepFreeze(structuredClone(KNOWLEDGE_GRAPH));
    const plan = deepFreeze(planOf(['NEG', 'ECU']));
    const config = deepFreeze({ improvementProbability: 0.5, controlFraction: 0.5 });

    expect(applySyntheticIntervention(classState, plan, graph, SEED, config).postClass.students).toHaveLength(6);
  });

  it('el resultado no comparte estado con la entrada', () => {
    const before = createSyntheticClass(42, 3, KNOWLEDGE_GRAPH);
    const copy = JSON.stringify(before);
    const { postClass } = apply(before, []);

    (postClass.config as { prerequisiteFactor: number }).prerequisiteFactor = 0.9;
    (postClass.students[0]?.trueMastery as number[])[0] = 9;

    expect(JSON.stringify(before)).toBe(copy);
  });

  it('se serializa como JSON sin perder nada', () => {
    const result = apply(createSyntheticClass(42, 12, KNOWLEDGE_GRAPH), ['NEG'], { controlFraction: 0.25 });

    expect(serializedCopy(result)).toEqual(result);
  });

  it('declara procedencia, configuración efectiva y SUPUESTOS', () => {
    const { provenance, assumptions } = apply(repeated(NONE, 2), ['ECU', 'OPS']);

    expect(provenance).toEqual({
      generator: { algorithm: 'mulberry32', version: 1 },
      populationSeed: 42,
      interventionSeed: SEED,
      config: { improvementProbability: 0.35, prerequisiteImprovementFactor: 0.5, controlFraction: 0 },
      intervenedSkills: ['OPS', 'ECU'],
    });
    expect(assumptions.join(' ')).toContain('SUPUESTOS');
  });

  it('no presenta los cambios como aprendizaje observado', () => {
    const { disclaimer } = apply(repeated(NONE, 2), []);

    expect(disclaimer).toContain('no son aprendizaje observado');
    expect(disclaimer).toContain('ni demuestran eficacia educativa');
    expect(disclaimer).toContain('no se regenera desde la semilla de población');
  });
});
