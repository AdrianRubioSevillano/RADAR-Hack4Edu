// Tipos provisionales del motor. Solo lo implementado hasta ahora; lo que debería
// pasar a ser compartido se propone en docs/engine/PROPUESTA_TIPOS.md.

export type SkillId = string;

// Propiedades estáticas de una competencia. Las estimaciones diagnósticas
// (dominio, incertidumbre) pertenecen al estado del alumno, no al grafo.
export interface SkillNode {
  readonly id: SkillId;
  readonly name: string;
  readonly description: string;
  readonly prerequisites: readonly SkillId[];
}

export interface KnowledgeGraph {
  readonly nodes: readonly SkillNode[];
}

export type KnowledgeGraphErrorCode =
  | 'DUPLICATE_SKILL_ID'
  | 'UNKNOWN_PREREQUISITE'
  | 'DUPLICATE_PREREQUISITE'
  | 'SELF_REFERENCE'
  | 'CYCLE'
  | 'UNKNOWN_SKILL';
