import { describe, expect, it } from 'vitest';
import { InferenceError, KNOWLEDGE_GRAPH, KnowledgeGraphError } from '../../src/engine/index.ts';
import type { KnowledgeGraph } from '../../src/engine/index.ts';
import {
  STREAMS,
  SimulationError,
  createStream,
  createSyntheticClass,
  observableStudents,
} from '../../src/simulation/index.ts';
import type {
  SimulationConfig,
  SimulationErrorCode,
  SyntheticClass,
  SyntheticGroupConfig,
  SyntheticStudent,
} from '../../src/simulation/index.ts';
import { deepFreeze } from '../engine/support/bank.ts';
import { ORDER, serializedCopy } from '../engine/support/inference.ts';

// Orden topológico escrito a mano (§2.1).
const TOPOLOGICAL = ['OPS', 'FRA', 'NEG', 'JER', 'ALG', 'ECU'];

function probabilities(value: number, overrides: Readonly<Record<string, number>> = {}): Readonly<Record<string, number>> {
  return { ...Object.fromEntries(ORDER.map((skill) => [skill, value])), ...overrides };
}

function singleGroup(value: number, overrides?: Readonly<Record<string, number>>): readonly SyntheticGroupConfig[] {
  return [{ id: 'unico', masteryProbabilities: probabilities(value, overrides) }];
}

function mastered(student: SyntheticStudent | undefined, skill: string): boolean {
  return student?.trueMastery[ORDER.indexOf(skill)] === 1;
}

// Uniforme que el alumno consumió para una competencia, según la regla documentada.
function uniformOf(seed: number, studentId: string, skill: string): number {
  const stream = createStream(seed, `${STREAMS.population}/${studentId}`);
  const values = TOPOLOGICAL.map(() => stream());
  return values[TOPOLOGICAL.indexOf(skill)] ?? Number.NaN;
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

function create(studentCount: number, config?: SimulationConfig, seed = 42): SyntheticClass {
  return createSyntheticClass(seed, studentCount, KNOWLEDGE_GRAPH, config);
}

describe('reproducibilidad', () => {
  it('coincide con la clase de una réplica independiente en Python', () => {
    const { students } = create(6);

    expect(students.map((student) => student.trueMastery)).toEqual([
      [1, 1, 1, 0, 0, 0],
      [1, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 1, 0],
      [1, 1, 0, 1, 0, 1],
      [0, 0, 0, 0, 0, 0],
    ]);
  });

  it('la misma configuración y semilla dan exactamente el mismo resultado serializable', () => {
    expect(JSON.stringify(create(30))).toBe(JSON.stringify(create(30)));
  });

  it('otra semilla cambia la población', () => {
    expect(create(30, undefined, 1).students).not.toEqual(create(30, undefined, 2).students);
  });

  it('acepta las semillas extremas', () => {
    expect(create(1, undefined, 0).seed).toBe(0);
    expect(create(1, undefined, 2 ** 32 - 1).seed).toBe(2 ** 32 - 1);
  });

  it('declara generador, semilla, configuración y codificación', () => {
    const result = create(3);

    expect(result.generator).toEqual({ algorithm: 'mulberry32', version: 1 });
    expect(result.seed).toBe(42);
    expect(result.studentCount).toBe(3);
    expect(result.skillOrder).toEqual(ORDER);
    expect(result.config.prerequisiteFactor).toBe(0.5);
    expect(result.config.groups).toEqual([
      { id: 'G1', masteryProbabilities: probabilities(0.85) },
      { id: 'G2', masteryProbabilities: probabilities(0.6) },
      { id: 'G3', masteryProbabilities: probabilities(0.35) },
    ]);
  });

  it('ampliar la clase no cambia a los alumnos existentes', () => {
    expect(create(130).students.slice(0, 30)).toEqual(create(30).students);
  });

  it('cambiar una probabilidad no desplaza los uniformes de las demás competencias', () => {
    const groups = (ops: number): readonly SyntheticGroupConfig[] => singleGroup(0.5, { OPS: ops });
    const zero = create(50, { groups: groups(0), prerequisiteFactor: 1 });
    const one = create(50, { groups: groups(1), prerequisiteFactor: 1 });

    const withoutOps = (result: SyntheticClass): readonly (readonly number[])[] =>
      result.students.map((student) => student.trueMastery.slice(1));
    expect(withoutOps(zero)).toEqual(withoutOps(one));
  });

  it('permutar nodos y prerrequisitos no cambia el resultado', () => {
    const permuted: KnowledgeGraph = {
      nodes: [...KNOWLEDGE_GRAPH.nodes].reverse().map((node) => ({
        ...node,
        prerequisites: [...node.prerequisites].reverse(),
      })),
    };

    expect(createSyntheticClass(42, 40, permuted)).toEqual(create(40));
  });
});

describe('identificadores', () => {
  it('sigue S01, S99, S100 y no repite', () => {
    const ids = create(101).students.map((student) => student.studentId);

    expect(ids.slice(0, 3)).toEqual(['S01', 'S02', 'S03']);
    expect(ids[8]).toBe('S09');
    expect(ids[9]).toBe('S10');
    expect(ids[98]).toBe('S99');
    expect(ids[99]).toBe('S100');
    expect(ids[100]).toBe('S101');
    expect(new Set(ids).size).toBe(101);
  });

  it('un id no depende del tamaño de la clase', () => {
    expect(create(5).students.map((student) => student.studentId)).toEqual(['S01', 'S02', 'S03', 'S04', 'S05']);
    expect(create(120).students[4]?.studentId).toBe('S05');
  });

  it('la clase vacía es válida', () => {
    const result = create(0);

    expect(result.studentCount).toBe(0);
    expect(result.students).toEqual([]);
    expect(observableStudents(result)).toEqual([]);
  });
});

describe('asignación a grupos', () => {
  const countBy = (result: SyntheticClass): Readonly<Record<string, number>> =>
    result.students.reduce<Record<string, number>>(
      (counts, student) => ({ ...counts, [student.groupId]: (counts[student.groupId] ?? 0) + 1 }),
      {},
    );

  it('reparte por índice módulo el número de grupos', () => {
    expect(create(7).students.map((student) => student.groupId)).toEqual(['G1', 'G2', 'G3', 'G1', 'G2', 'G3', 'G1']);
  });

  it.each<[number, Readonly<Record<string, number>>]>([
    [30, { G1: 10, G2: 10, G3: 10 }],
    [31, { G1: 11, G2: 10, G3: 10 }],
    [32, { G1: 11, G2: 11, G3: 10 }],
    [2, { G1: 1, G2: 1 }],
  ])('%d alumnos quedan equilibrados', (count, expected) => {
    expect(countBy(create(count))).toEqual(expected);
  });

  it('respeta el orden y el número de los grupos configurados', () => {
    const groups = [
      { id: 'b', masteryProbabilities: probabilities(1) },
      { id: 'a', masteryProbabilities: probabilities(0) },
    ];
    const { students } = create(4, { groups });

    expect(students.map((student) => student.groupId)).toEqual(['b', 'a', 'b', 'a']);
    expect(students.map((student) => student.trueMastery)).toEqual([
      [1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0],
    ]);
  });

  it('admite un solo grupo', () => {
    expect(countBy(create(5, { groups: singleGroup(0.5) }))).toEqual({ unico: 5 });
  });
});

describe('probabilidades y factor por prerrequisitos', () => {
  it('probabilidad 1 con todos los ancestros: domina todo', () => {
    for (const student of create(20, { groups: singleGroup(1) }).students) {
      expect(student.trueMastery).toEqual([1, 1, 1, 1, 1, 1]);
    }
  });

  it('probabilidad 0: no domina nada', () => {
    for (const student of create(20, { groups: singleGroup(0) }).students) {
      expect(student.trueMastery).toEqual([0, 0, 0, 0, 0, 0]);
    }
  });

  it('factor 0: sin NEG no hay JER, ALG ni ECU, pero FRA no depende de NEG', () => {
    const config = { groups: singleGroup(1, { NEG: 0 }), prerequisiteFactor: 0 };

    for (const student of create(20, config).students) {
      expect(student.trueMastery).toEqual([1, 0, 1, 0, 0, 0]);
    }
  });

  it('factor 1: la ausencia de ancestros no reduce nada', () => {
    const config = { groups: singleGroup(1, { NEG: 0 }), prerequisiteFactor: 1 };

    for (const student of create(20, config).students) {
      expect(student.trueMastery).toEqual([1, 0, 1, 1, 1, 1]);
    }
  });

  it('sin ancestros no hay reducción, aunque el factor sea 0', () => {
    const { students } = create(200, { groups: singleGroup(0.5), prerequisiteFactor: 0 });

    for (const student of students) {
      expect(mastered(student, 'OPS')).toBe(uniformOf(42, student.studentId, 'OPS') < 0.5);
    }
    expect(students.some((student) => mastered(student, 'OPS'))).toBe(true);
    expect(students.some((student) => !mastered(student, 'OPS'))).toBe(true);
  });

  it('con todos los ancestros presentes se usa la probabilidad base', () => {
    const { students } = create(200, { groups: singleGroup(1, { NEG: 0.75 }), prerequisiteFactor: 0.5 });

    for (const student of students) {
      expect(mastered(student, 'NEG')).toBe(uniformOf(42, student.studentId, 'NEG') < 0.75);
    }
  });

  it('se aplica una sola vez aunque falten varios ancestros', () => {
    // Faltan OPS y NEG: JER vale 1·0.5, no 1·0.5·0.5.
    const { students } = create(200, { groups: singleGroup(1, { OPS: 0, NEG: 0 }), prerequisiteFactor: 0.5 });

    for (const student of students) {
      expect(mastered(student, 'JER')).toBe(uniformOf(42, student.studentId, 'JER') < 0.5);
    }
    const betweenOnceAndTwice = students.filter((student) => {
      const uniform = uniformOf(42, student.studentId, 'JER');
      return uniform >= 0.25 && uniform < 0.5;
    });
    expect(betweenOnceAndTwice.length).toBeGreaterThan(0);
  });

  it('comprueba todos los ancestros, no solo los prerrequisitos directos', () => {
    // ECU solo tiene ALG como prerrequisito directo, pero OPS es ancestro y siempre falta.
    const { students } = create(200, { groups: singleGroup(1, { OPS: 0 }), prerequisiteFactor: 0.5 });

    for (const student of students) {
      expect(mastered(student, 'ECU')).toBe(uniformOf(42, student.studentId, 'ECU') < 0.5);
    }
    expect(students.some((student) => mastered(student, 'ALG') && !mastered(student, 'ECU'))).toBe(true);
  });

  it('genera en orden topológico: usa el estado ya generado de los ancestros', () => {
    // NEG cae antes que JER en el orden; JER depende de su resultado.
    const { students } = create(200, { groups: singleGroup(1, { NEG: 0.5 }), prerequisiteFactor: 0 });

    for (const student of students) {
      expect(mastered(student, 'JER')).toBe(mastered(student, 'NEG'));
    }
  });
});

describe('validación', () => {
  it.each<[string, unknown]>([
    ['negativa', -1],
    ['fuera de uint32', 2 ** 32],
    ['decimal', 0.5],
    ['NaN', Number.NaN],
    ['de texto', '1'],
  ])('rechaza una semilla %s', (_, seed) => {
    expectSimulationError(() => createSyntheticClass(seed as number, 3, KNOWLEDGE_GRAPH), 'INVALID_SEED');
  });

  it.each<[string, unknown]>([
    ['negativo', -1],
    ['decimal', 1.5],
    ['NaN', Number.NaN],
    ['infinito', Number.POSITIVE_INFINITY],
    ['no seguro', 2 ** 53],
    ['de texto', '3'],
    ['nulo', null],
  ])('rechaza un tamaño %s', (_, count) => {
    expectSimulationError(() => createSyntheticClass(1, count as number, KNOWLEDGE_GRAPH), 'INVALID_STUDENT_COUNT');
  });

  const valid = { id: 'g', masteryProbabilities: probabilities(0.5) };
  const { OPS: _ops, ...withoutOps } = probabilities(0.5);

  it.each<[string, unknown]>([
    ['nula', null],
    ['que no es un objeto', 3],
    ['con grupos que no son una lista', { groups: 'g' }],
    ['sin grupos', { groups: [] }],
    ['con un grupo nulo', { groups: [null] }],
    ['con un grupo sin id', { groups: [{ ...valid, id: undefined }] }],
    ['con un id vacío', { groups: [{ ...valid, id: ' ' }] }],
    ['con un id repetido', { groups: [valid, valid] }],
    ['sin probabilidades', { groups: [{ id: 'g' }] }],
    ['con una competencia sin probabilidad', { groups: [{ id: 'g', masteryProbabilities: withoutOps }] }],
    ['con una competencia desconocida', { groups: [{ id: 'g', masteryProbabilities: probabilities(0.5, { XXX: 0.5 }) }] }],
    ['con una probabilidad negativa', { groups: singleGroup(0.5, { NEG: -0.1 }) }],
    ['con una probabilidad mayor que 1', { groups: singleGroup(0.5, { NEG: 1.1 }) }],
    ['con una probabilidad NaN', { groups: singleGroup(0.5, { NEG: Number.NaN }) }],
    ['con una probabilidad de texto', { groups: [{ id: 'g', masteryProbabilities: { ...probabilities(0.5), NEG: '0.5' } }] }],
    ['con un factor negativo', { prerequisiteFactor: -0.1 }],
    ['con un factor mayor que 1', { prerequisiteFactor: 1.1 }],
    ['con un factor NaN', { prerequisiteFactor: Number.NaN }],
    ['con un factor infinito', { prerequisiteFactor: Number.POSITIVE_INFINITY }],
    ['con un factor nulo', { prerequisiteFactor: null }],
  ])('rechaza una configuración %s', (_, config) => {
    expectSimulationError(
      () => createSyntheticClass(1, 3, KNOWLEDGE_GRAPH, config as SimulationConfig),
      'INVALID_SIMULATION_CONFIG',
    );
  });

  it('valida la configuración también con la clase vacía', () => {
    expectSimulationError(() => create(0, { prerequisiteFactor: 2 }), 'INVALID_SIMULATION_CONFIG');
  });

  it('acepta el factor en los extremos', () => {
    expect(create(1, { prerequisiteFactor: 0 }).config.prerequisiteFactor).toBe(0);
    expect(create(1, { prerequisiteFactor: 1 }).config.prerequisiteFactor).toBe(1);
  });

  it.each<[string, unknown]>([
    ['nulo', null],
    ['sin nodos', { nodes: [] }],
    ['con cinco competencias', { nodes: KNOWLEDGE_GRAPH.nodes.slice(0, 5) }],
    ['con otra competencia', { nodes: [...KNOWLEDGE_GRAPH.nodes.slice(0, 5), { ...KNOWLEDGE_GRAPH.nodes[5], id: 'XXX' }] }],
    ['con siete competencias', { nodes: [...KNOWLEDGE_GRAPH.nodes, { id: 'XXX', name: 'x', description: 'x', prerequisites: [] }] }],
  ])('rechaza un grafo %s', (_, graph) => {
    let caught: unknown;
    try {
      createSyntheticClass(1, 3, graph as KnowledgeGraph);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(InferenceError);
    expect(caught).toMatchObject({ code: 'INVALID_GRAPH' });
  });

  it('rechaza un grafo con un ciclo', () => {
    const graph: KnowledgeGraph = {
      nodes: KNOWLEDGE_GRAPH.nodes.map((node) => (node.id === 'OPS' ? { ...node, prerequisites: ['ECU'] } : node)),
    };

    expect(() => createSyntheticClass(1, 3, graph)).toThrow(KnowledgeGraphError);
  });
});

describe('proyección observable', () => {
  const source = create(12);

  it('entrega solo ids y nombres ficticios, en orden', () => {
    const observable = observableStudents(source);

    expect(observable).toHaveLength(12);
    expect(observable[0]).toEqual({ studentId: 'S01', displayName: 'Alumno ficticio 01' });
    expect(observable[11]).toEqual({ studentId: 'S12', displayName: 'Alumno ficticio 12' });
    for (const student of observable) {
      expect(Object.keys(student).sort()).toEqual(['displayName', 'studentId']);
    }
  });

  it('no contiene verdad, grupo ni probabilidades', () => {
    const text = JSON.stringify(observableStudents(source));

    for (const hidden of ['trueMastery', 'alpha', 'groupId', 'G1', 'G2', 'G3', 'masteryProbabilities', '0.85']) {
      expect(text).not.toContain(hidden);
    }
  });

  it('un dato latente nuevo no sale por omisión', () => {
    const extended = {
      ...source,
      students: source.students.map((student) => ({ ...student, latentTrait: 0.9 })),
    };

    expect(JSON.stringify(observableStudents(extended))).not.toContain('latentTrait');
  });

  it('el nombre no depende del grupo ni de la verdad', () => {
    const groups = singleGroup(0);

    expect(observableStudents(create(12, { groups }))).toEqual(observableStudents(source));
  });

  it.each<[string, unknown]>([
    ['nula', null],
    ['sin alumnos', {}],
    ['con un alumno nulo', { students: [null] }],
  ])('rechaza una clase %s', (_, value) => {
    expectSimulationError(() => observableStudents(value as SyntheticClass), 'INVALID_SYNTHETIC_CLASS');
  });
});

describe('contrato de la salida', () => {
  it('no muta entradas congeladas', () => {
    const graph = deepFreeze(structuredClone(KNOWLEDGE_GRAPH));
    const config = deepFreeze({ groups: singleGroup(0.5), prerequisiteFactor: 0.25 });
    const result = createSyntheticClass(5, 6, graph, config);

    expect(result.config).toEqual(config);
    expect(observableStudents(deepFreeze(result))).toHaveLength(6);
  });

  it('copia la configuración y no comparte estado entre llamadas', () => {
    const first = create(3);
    const expected = serializedCopy(create(3));

    (first.config.groups[0] as unknown as { id: string }).id = 'alterado';

    expect(serializedCopy(create(3))).toEqual(expected);
  });

  it('se serializa como JSON sin perder nada', () => {
    const result = create(30);

    expect(serializedCopy(result)).toEqual(result);
  });

  it('normaliza las claves de probabilidades al orden de las competencias', () => {
    const reversed = Object.fromEntries([...ORDER].reverse().map((skill) => [skill, 0.5]));
    const { config } = create(1, { groups: [{ id: 'g', masteryProbabilities: reversed }] });

    expect(Object.keys(config.groups[0]?.masteryProbabilities ?? {})).toEqual(ORDER);
  });
});
