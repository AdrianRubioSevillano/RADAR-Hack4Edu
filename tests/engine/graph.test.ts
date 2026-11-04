import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_GRAPH,
  KnowledgeGraphError,
  ancestors,
  descendants,
  topologicalOrder,
  validateKnowledgeGraph,
} from '../../src/engine/index.ts';
import type {
  KnowledgeGraph,
  KnowledgeGraphErrorCode,
  SkillId,
  SkillNode,
} from '../../src/engine/index.ts';

const EXPECTED_ORDER = ['OPS', 'FRA', 'NEG', 'JER', 'ALG', 'ECU'];

function node(id: SkillId, prerequisites: readonly SkillId[] = []): SkillNode {
  return { id, name: id, description: id, prerequisites };
}

function graphOf(...nodes: readonly SkillNode[]): KnowledgeGraph {
  return { nodes };
}

function frozenGraph(graph: KnowledgeGraph): KnowledgeGraph {
  const nodes = graph.nodes.map((item) =>
    Object.freeze({ ...item, prerequisites: Object.freeze([...item.prerequisites]) }),
  );
  return Object.freeze({ nodes: Object.freeze(nodes) });
}

function permutations<T>(items: readonly T[]): readonly (readonly T[])[] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [item, ...rest]),
  );
}

function withPrerequisites(graph: KnowledgeGraph, id: SkillId, prerequisites: readonly SkillId[]): KnowledgeGraph {
  return {
    nodes: graph.nodes.map((item) => (item.id === id ? { ...item, prerequisites } : item)),
  };
}

function expectGraphError(action: () => unknown, code: KnowledgeGraphErrorCode): void {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(KnowledgeGraphError);
  expect(caught).toMatchObject({ name: 'KnowledgeGraphError', code });
}

describe('grafo de competencias de §2.1', () => {
  it('tiene los seis ids y las dependencias exactas', () => {
    const dependencies = Object.fromEntries(
      KNOWLEDGE_GRAPH.nodes.map((item) => [item.id, item.prerequisites]),
    );

    expect(KNOWLEDGE_GRAPH.nodes).toHaveLength(6);
    expect(dependencies).toEqual({
      OPS: [],
      NEG: ['OPS'],
      FRA: ['OPS'],
      JER: ['OPS', 'NEG'],
      ALG: ['NEG', 'FRA', 'JER'],
      ECU: ['ALG'],
    });
  });

  it('solo contiene propiedades estáticas, con nombre y descripción', () => {
    for (const item of KNOWLEDGE_GRAPH.nodes) {
      expect(Object.keys(item).sort()).toEqual(['description', 'id', 'name', 'prerequisites']);
      expect(item.name).not.toBe('');
      expect(item.description).not.toBe('');
    }
  });

  it('es válido y está congelado', () => {
    expect(() => validateKnowledgeGraph(KNOWLEDGE_GRAPH)).not.toThrow();
    expect(Object.isFrozen(KNOWLEDGE_GRAPH)).toBe(true);
    expect(Object.isFrozen(KNOWLEDGE_GRAPH.nodes)).toBe(true);
    for (const item of KNOWLEDGE_GRAPH.nodes) {
      expect(Object.isFrozen(item)).toBe(true);
      expect(Object.isFrozen(item.prerequisites)).toBe(true);
    }
  });
});

describe('topologicalOrder', () => {
  it('devuelve el orden esperado', () => {
    expect(topologicalOrder(KNOWLEDGE_GRAPH)).toEqual(EXPECTED_ORDER);
  });

  it('no depende del orden de los nodos de entrada', () => {
    for (const nodes of permutations(KNOWLEDGE_GRAPH.nodes)) {
      expect(topologicalOrder({ nodes })).toEqual(EXPECTED_ORDER);
    }
  });

  it('no depende del orden de las listas de prerrequisitos', () => {
    const alg = KNOWLEDGE_GRAPH.nodes.find((item) => item.id === 'ALG');
    expect(alg).toBeDefined();
    for (const prerequisites of permutations(alg?.prerequisites ?? [])) {
      expect(topologicalOrder(withPrerequisites(KNOWLEDGE_GRAPH, 'ALG', prerequisites))).toEqual(EXPECTED_ORDER);
    }
    const reversed = KNOWLEDGE_GRAPH.nodes.map((item) => ({
      ...item,
      prerequisites: [...item.prerequisites].reverse(),
    }));
    expect(topologicalOrder({ nodes: reversed })).toEqual(EXPECTED_ORDER);
  });

  it('elige entre todos los disponibles, incluidos los recién liberados', () => {
    const graph = graphOf(node('B'), node('C'), node('A', ['B']));

    expect(topologicalOrder(graph)).toEqual(['B', 'A', 'C']);
  });

  it('compara ids sin depender de la configuración regional', () => {
    expect(topologicalOrder(graphOf(node('a'), node('B'), node('Z')))).toEqual(['B', 'Z', 'a']);
  });

  it('acepta el grafo vacío', () => {
    const empty = graphOf();

    expect(() => validateKnowledgeGraph(empty)).not.toThrow();
    expect(topologicalOrder(empty)).toEqual([]);
  });
});

describe('ancestors y descendants', () => {
  it.each([
    ['OPS', []],
    ['FRA', ['OPS']],
    ['NEG', ['OPS']],
    ['JER', ['OPS', 'NEG']],
    ['ALG', ['OPS', 'FRA', 'NEG', 'JER']],
    ['ECU', ['OPS', 'FRA', 'NEG', 'JER', 'ALG']],
  ])('ancestros de %s', (id, expected) => {
    expect(ancestors(KNOWLEDGE_GRAPH, id)).toEqual(expected);
  });

  it.each([
    ['OPS', ['FRA', 'NEG', 'JER', 'ALG', 'ECU']],
    ['FRA', ['ALG', 'ECU']],
    ['NEG', ['JER', 'ALG', 'ECU']],
    ['JER', ['ALG', 'ECU']],
    ['ALG', ['ECU']],
    ['ECU', []],
  ])('descendientes de %s', (id, expected) => {
    expect(descendants(KNOWLEDGE_GRAPH, id)).toEqual(expected);
  });

  it('no repite ids y respeta el orden topológico', () => {
    for (const id of EXPECTED_ORDER) {
      for (const related of [ancestors(KNOWLEDGE_GRAPH, id), descendants(KNOWLEDGE_GRAPH, id)]) {
        expect(new Set(related).size).toBe(related.length);
        expect(related).toEqual(EXPECTED_ORDER.filter((candidate) => related.includes(candidate)));
      }
    }
  });

  it('no incluye la competencia consultada', () => {
    for (const id of EXPECTED_ORDER) {
      expect(ancestors(KNOWLEDGE_GRAPH, id)).not.toContain(id);
      expect(descendants(KNOWLEDGE_GRAPH, id)).not.toContain(id);
    }
  });

  it('rechaza un id desconocido con error tipado', () => {
    expectGraphError(() => ancestors(KNOWLEDGE_GRAPH, 'XXX'), 'UNKNOWN_SKILL');
    expectGraphError(() => descendants(KNOWLEDGE_GRAPH, 'XXX'), 'UNKNOWN_SKILL');
    expectGraphError(() => ancestors(graphOf(), 'OPS'), 'UNKNOWN_SKILL');
  });
});

describe('validación del grafo', () => {
  it('rechaza ids duplicados', () => {
    expectGraphError(() => validateKnowledgeGraph(graphOf(node('A'), node('A'))), 'DUPLICATE_SKILL_ID');
  });

  it('rechaza referencias inexistentes', () => {
    expectGraphError(() => validateKnowledgeGraph(graphOf(node('A', ['X']))), 'UNKNOWN_PREREQUISITE');
  });

  it('rechaza prerrequisitos duplicados', () => {
    expectGraphError(
      () => validateKnowledgeGraph(graphOf(node('A'), node('B', ['A', 'A']))),
      'DUPLICATE_PREREQUISITE',
    );
  });

  it('rechaza autorreferencias', () => {
    expectGraphError(() => validateKnowledgeGraph(graphOf(node('A', ['A']))), 'SELF_REFERENCE');
  });

  it('detecta un ciclo inyectado en el grafo real', () => {
    const cyclic = withPrerequisites(KNOWLEDGE_GRAPH, 'OPS', ['ECU']);

    expectGraphError(() => validateKnowledgeGraph(cyclic), 'CYCLE');
    expectGraphError(() => topologicalOrder(cyclic), 'CYCLE');
    expectGraphError(() => ancestors(cyclic, 'ECU'), 'CYCLE');
    expectGraphError(() => descendants(cyclic, 'OPS'), 'CYCLE');
  });

  it('informa de las competencias implicadas en un ciclo', () => {
    const cyclic = graphOf(node('A', ['B']), node('B', ['A']), node('C'));

    expect(() => validateKnowledgeGraph(cyclic)).toThrow(
      expect.objectContaining({ code: 'CYCLE', skillIds: ['A', 'B'] }),
    );
  });
});

describe('ausencia de mutaciones', () => {
  it('funciona con entradas congeladas y no las altera', () => {
    const frozen = frozenGraph(KNOWLEDGE_GRAPH);
    const before = structuredClone(frozen);

    expect(topologicalOrder(frozen)).toEqual(EXPECTED_ORDER);
    expect(() => validateKnowledgeGraph(frozen)).not.toThrow();
    for (const id of EXPECTED_ORDER) {
      ancestors(frozen, id);
      descendants(frozen, id);
    }

    expect(frozen).toEqual(before);
  });

  it('devuelve listas nuevas en cada llamada', () => {
    expect(topologicalOrder(KNOWLEDGE_GRAPH)).not.toBe(topologicalOrder(KNOWLEDGE_GRAPH));
    expect(ancestors(KNOWLEDGE_GRAPH, 'ECU')).not.toBe(ancestors(KNOWLEDGE_GRAPH, 'ECU'));
  });
});
