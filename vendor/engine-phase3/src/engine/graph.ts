import type { KnowledgeGraph, KnowledgeGraphErrorCode, SkillId, SkillNode } from './types.ts';

export class KnowledgeGraphError extends Error {
  readonly code: KnowledgeGraphErrorCode;
  readonly skillIds: readonly SkillId[];

  constructor(code: KnowledgeGraphErrorCode, message: string, skillIds: readonly SkillId[]) {
    super(message);
    this.name = 'KnowledgeGraphError';
    this.code = code;
    this.skillIds = skillIds;
  }
}

function skill(
  id: SkillId,
  name: string,
  description: string,
  prerequisites: readonly SkillId[],
): SkillNode {
  return Object.freeze({ id, name, description, prerequisites: Object.freeze([...prerequisites]) });
}

// Las aristas son una hipótesis pedagógica definida por criterio experto (§2.1),
// no causalidad demostrada ni una estructura aprendida de datos.
export const KNOWLEDGE_GRAPH: KnowledgeGraph = Object.freeze({
  nodes: Object.freeze([
    skill('OPS', 'Operaciones básicas', 'Suma, resta, multiplicación y división de números naturales.', []),
    skill('NEG', 'Números negativos', 'Operaciones con números enteros y regla de los signos.', ['OPS']),
    skill('FRA', 'Fracciones', 'Simplificación y operaciones con fracciones.', ['OPS']),
    skill('JER', 'Jerarquía de operaciones', 'Orden de las operaciones y uso de paréntesis.', ['OPS', 'NEG']),
    skill('ALG', 'Simplificación algebraica', 'Reducción de términos semejantes y uso de la propiedad distributiva.', ['NEG', 'FRA', 'JER']),
    skill('ECU', 'Ecuaciones de primer grado', 'Resolución de ecuaciones lineales con una incógnita.', ['ALG']),
  ]),
});

// Comparación por unidades de código: no depende de la configuración regional.
function compareIds(a: SkillId, b: SkillId): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

function assertValidStructure(graph: KnowledgeGraph): void {
  const ids = new Set<SkillId>();
  for (const node of graph.nodes) {
    if (ids.has(node.id)) {
      throw new KnowledgeGraphError('DUPLICATE_SKILL_ID', `Competencia duplicada: ${node.id}`, [node.id]);
    }
    ids.add(node.id);
  }

  for (const node of graph.nodes) {
    const seen = new Set<SkillId>();
    for (const prerequisite of node.prerequisites) {
      if (prerequisite === node.id) {
        throw new KnowledgeGraphError('SELF_REFERENCE', `${node.id} se tiene a sí misma como prerrequisito`, [node.id]);
      }
      if (seen.has(prerequisite)) {
        throw new KnowledgeGraphError(
          'DUPLICATE_PREREQUISITE',
          `${node.id} repite el prerrequisito ${prerequisite}`,
          [node.id, prerequisite],
        );
      }
      if (!ids.has(prerequisite)) {
        throw new KnowledgeGraphError(
          'UNKNOWN_PREREQUISITE',
          `${node.id} tiene un prerrequisito inexistente: ${prerequisite}`,
          [node.id, prerequisite],
        );
      }
      seen.add(prerequisite);
    }
  }
}

// Kahn: en cada paso se toma el menor id entre todos los nodos disponibles.
function kahnOrder(graph: KnowledgeGraph): readonly SkillId[] {
  const pending = new Map(graph.nodes.map((node) => [node.id, new Set(node.prerequisites)]));
  const order: SkillId[] = [];

  while (pending.size > 0) {
    const available = [...pending]
      .filter(([, prerequisites]) => prerequisites.size === 0)
      .map(([id]) => id)
      .sort(compareIds);
    const next = available[0];
    if (next === undefined) {
      const blocked = [...pending.keys()].sort(compareIds);
      throw new KnowledgeGraphError('CYCLE', `Ciclo entre las competencias pendientes: ${blocked.join(', ')}`, blocked);
    }
    order.push(next);
    pending.delete(next);
    for (const prerequisites of pending.values()) {
      prerequisites.delete(next);
    }
  }

  return order;
}

export function topologicalOrder(graph: KnowledgeGraph): readonly SkillId[] {
  assertValidStructure(graph);
  return kahnOrder(graph);
}

export function validateKnowledgeGraph(graph: KnowledgeGraph): void {
  topologicalOrder(graph);
}

function findNode(graph: KnowledgeGraph, id: SkillId): SkillNode {
  const node = graph.nodes.find((candidate) => candidate.id === id);
  if (node === undefined) {
    throw new KnowledgeGraphError('UNKNOWN_SKILL', `Competencia inexistente: ${id}`, [id]);
  }
  return node;
}

function reachable(
  start: SkillNode,
  neighbours: (node: SkillNode) => readonly SkillNode[],
): ReadonlySet<SkillId> {
  const visited = new Set<SkillId>();
  const stack = [...neighbours(start)];
  for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
    if (!visited.has(node.id)) {
      visited.add(node.id);
      stack.push(...neighbours(node));
    }
  }
  return visited;
}

export function ancestors(graph: KnowledgeGraph, id: SkillId): readonly SkillId[] {
  const order = topologicalOrder(graph);
  const found = reachable(findNode(graph, id), (node) =>
    node.prerequisites.map((prerequisite) => findNode(graph, prerequisite)),
  );
  return order.filter((candidate) => found.has(candidate));
}

export function descendants(graph: KnowledgeGraph, id: SkillId): readonly SkillId[] {
  const order = topologicalOrder(graph);
  const found = reachable(findNode(graph, id), (node) =>
    graph.nodes.filter((candidate) => candidate.prerequisites.includes(node.id)),
  );
  return order.filter((candidate) => found.has(candidate));
}
