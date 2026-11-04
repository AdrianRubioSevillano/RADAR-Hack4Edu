# Grafo de competencias y configuración

Este documento cubre el grafo y la configuración. Están implementados el grafo, el banco de preguntas (`BANCO.md`) y la inferencia bayesiana exacta DINA (`MATEMATICAS.md`). La selección adaptativa y las fases posteriores siguen pendientes.

## API

Exportada desde `src/engine/index.ts`:

| Elemento | Descripción |
|---|---|
| `KNOWLEDGE_GRAPH` | Grafo de §2.1, congelado. |
| `validateKnowledgeGraph(graph)` | Lanza `KnowledgeGraphError` si el grafo es inválido. |
| `topologicalOrder(graph)` | Orden de Kahn con el menor id entre todos los nodos disponibles. |
| `ancestors(graph, id)` | Ancestros únicos, en orden topológico, sin incluir `id`. |
| `descendants(graph, id)` | Descendientes únicos, en orden topológico, sin incluir `id`. |

Las funciones reciben el grafo de forma explícita y no usan estado global. Ninguna muta sus entradas, y todas validan el grafo antes de responder.

El orden del grafo real es `OPS, FRA, NEG, JER, ALG, ECU`. Los ids se comparan por unidades de código, sin depender de la configuración regional. Un grafo vacío es válido y su orden es vacío.

## Errores

`KnowledgeGraphError` tiene `code` y `skillIds`:

| `code` | Causa |
|---|---|
| `DUPLICATE_SKILL_ID` | Dos nodos con el mismo id. |
| `SELF_REFERENCE` | Un nodo es prerrequisito de sí mismo. |
| `DUPLICATE_PREREQUISITE` | Un nodo repite un prerrequisito. |
| `UNKNOWN_PREREQUISITE` | Un prerrequisito no existe en el grafo. |
| `CYCLE` | Hay un ciclo. `skillIds` lista los nodos pendientes, que pueden incluir descendientes del ciclo. |
| `UNKNOWN_SKILL` | Se consulta un id que no existe. |

## Alcance del modelo

Las aristas son una hipótesis pedagógica definida por criterio experto, no causalidad demostrada. No se aprenden de datos.

Los nodos solo contienen propiedades estáticas. Las estimaciones diagnósticas pertenecen al estado de cada alumno.

## Configuración

| Archivo | Función |
|---|---|
| `package.json` | Dependencias de desarrollo y scripts `test` y `typecheck`. |
| `tsconfig.engine.json` | TypeScript estricto para `src/engine`, `tests/engine` y `vitest.config.ts`. |
| `vitest.config.ts` | Tests en `tests/**/*.test.ts`, en entorno Node. |

`tsconfig.engine.json` activa `erasableSyntaxOnly`, que rechaza la sintaxis de TypeScript que necesita transformación: `enum`, parameter properties y `namespace` con código ejecutable. No rechaza cualquier `namespace`, porque uno que solo declara tipos sigue compilando. La prohibición del proyecto es la de §8 de `CLAUDE.md`, que va más allá de esta opción.

```bash
npm test
```
```bash
npm run typecheck
```

Vitest exige `vite` como dependencia *peer*, así que aparece en `package-lock.json`. El proyecto no declara Vite ni tiene `vite.config`.

Entorno comprobado: Node 26. No se afirma compatibilidad con otras versiones.
