# Propuesta de tipos compartidos

`src/shared/types.ts` no existe todavía. Mientras tanto, estos tipos viven en `src/engine/types.ts` y se exportan desde `src/engine/index.ts`.

Esta propuesta cubre solo lo implementado en la Fase 1A. Los tipos de fases posteriores se añadirán cuando existan.

## Tipos que deberían pasar a ser compartidos

```ts
export type SkillId = string;

export interface SkillNode {
  readonly id: SkillId;
  readonly name: string;
  readonly description: string;
  readonly prerequisites: readonly SkillId[];
}

export interface KnowledgeGraph {
  readonly nodes: readonly SkillNode[];
}
```

| Tipo | Motivo |
|---|---|
| `SkillId` | La interfaz necesita referirse a competencias con el mismo identificador que el motor. |
| `SkillNode` | Permite mostrar nombre, descripción y prerrequisitos sin importar código del motor. |
| `KnowledgeGraph` | Es el argumento explícito de las funciones del motor y la estructura que pintaría la interfaz. |

## Decisiones que conviene revisar con el integrador

- `SkillId` es `string`, no una unión de los seis ids. La validación tiene que aceptar grafos arbitrarios, incluidos los inválidos, para poder rechazarlos.
- `SkillNode` solo contiene propiedades estáticas. El dominio estimado, la incertidumbre y los `questionIds` de §2.1 no van aquí: las estimaciones son del estado de cada alumno, y las preguntas se obtendrán del banco.

## Tipos que se quedan en el motor

`KnowledgeGraphErrorCode` y `KnowledgeGraphError` no necesitan ser compartidos salvo que la interfaz quiera distinguir códigos de error. `KnowledgeGraphError` es una clase, así que no puede vivir en un archivo solo de tipos.
