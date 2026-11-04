# API del motor

Exportaciones actuales de `src/engine/index.ts`, hasta la Fase 2. Las funciones no mutan sus entradas y sus resultados son serializables como JSON.

Aún no existen `selectNextQuestion`, `submitAnswer`, `getClassDiagnostic`, `rankInterventions` ni `fixedQuestionOrder`.

## Inferencia

```ts
SKILL_ORDER: readonly SkillId[]
STATE_COUNT: number

masteryFromStateIndex(index: number): MasteryVector
stateIndexFromMastery(alpha: MasteryVector): number
requiredSkills(question: DinaQuestion): readonly SkillId[]
correctProbability(alpha: MasteryVector, required: readonly SkillId[], slip: number, guess: number): number

createPriorDistribution(config?: PriorConfig, knowledgeGraph?: KnowledgeGraph): JointDistribution
createInitialDiagnosticState(studentId: string, config?: PriorConfig, knowledgeGraph?: KnowledgeGraph): DiagnosticState
updatePosterior(joint: JointDistribution, question: DinaQuestion, isCorrect: boolean): JointDistribution

marginals(joint: JointDistribution): Readonly<Record<SkillId, number>>
masteryProbability(joint: JointDistribution, skills: readonly SkillId[]): number

binaryEntropy(probability: number): number
jointEntropy(joint: JointDistribution): number
```

- `correctProbability` es la función pura DINA de §2.7. Solo recibe `α`, requisitos y slip/guess.
- `updatePosterior` es de bajo nivel: recibe la evidencia ya decidida. No corrige respuestas de alumnos ni gestiona el historial. Eso corresponde a `submitAnswer`, en la Fase 3.

## Estado diagnóstico

```ts
interface DiagnosticState {
  readonly studentId: string;
  readonly skillOrder: readonly SkillId[];
  readonly joint: JointDistribution;
  readonly priorConfig: EffectivePriorConfig;
}
```

`priorConfig` es una copia de la configuración efectiva: las seis marginales y `compatibility`, con `null` si está desactivada. Se puede pasar de nuevo a `createInitialDiagnosticState` para reproducir el mismo prior. No contiene verdad simulada.

El estado no guarda respuestas ni observaciones. La Fase 3 añadirá el historial como un campo nuevo, sin cambiar los actuales. El dominio y la incertidumbre de §2.1 no se guardan: se obtienen de `joint` con `marginals` y `binaryEntropy`.

## Errores

Las funciones de inferencia lanzan `InferenceError`, con un `code`:

| `code` | Causa |
|---|---|
| `INVALID_STATE_INDEX` | El índice no es un entero de 0 a 63. |
| `INVALID_MASTERY` | `α` no es un vector binario de seis posiciones. |
| `UNKNOWN_SKILL` | La competencia no está en `SKILL_ORDER`. |
| `INVALID_SKILL_SET` | El conjunto no es una lista, repite una competencia o es un `R_q` vacío. |
| `INVALID_PARAMETERS` | `slip` y `guess` incumplen `0 < g < 1 − s < 1`. |
| `INVALID_QUESTION` | La pregunta no tiene la forma esperada. |
| `INVALID_EVIDENCE` | La evidencia no es un booleano. |
| `INVALID_DISTRIBUTION` | La distribución tiene otra longitud, un valor no finito o negativo, o no suma 1. |
| `INVALID_NORMALIZATION` | La masa total no es finita o es menor que `1e-300`. |
| `INVALID_PRIOR` | Una marginal o `epsilon` están fuera de su rango. |
| `MISSING_GRAPH` | El prior compatible está activado sin `knowledgeGraph`. |
| `INVALID_GRAPH` | El grafo no contiene exactamente las seis competencias. |
| `INVALID_STUDENT_ID` | `studentId` está vacío. |
| `INVALID_PROBABILITY` | `binaryEntropy` recibe un valor fuera de `[0, 1]`. |

Un grafo con estructura inválida lanza `KnowledgeGraphError`, como en `validateKnowledgeGraph`.

## Grafo, banco y racionales

```ts
KNOWLEDGE_GRAPH: KnowledgeGraph
validateKnowledgeGraph(graph: KnowledgeGraph): void
topologicalOrder(graph: KnowledgeGraph): readonly SkillId[]
ancestors(graph: KnowledgeGraph, id: SkillId): readonly SkillId[]
descendants(graph: KnowledgeGraph, id: SkillId): readonly SkillId[]

RADAR_QUESTION_BANK: QuestionBank
validateQuestionBank(bank: QuestionBank, graph: KnowledgeGraph): void

normalizeRational(input: string): Result<CanonicalRational, RationalErrorCode>
isCanonicalRational(value: string): boolean
```

Los detalles están en `GRAFO.md` y `BANCO.md`.
