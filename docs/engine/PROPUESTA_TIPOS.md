# Propuesta de tipos compartidos

`src/shared/types.ts` no existe todavía. Mientras tanto, estos tipos viven en `src/engine/types.ts` y se exportan desde `src/engine/index.ts`.

Esta propuesta cubre lo implementado hasta la Fase 1B: grafo y banco de preguntas. Los tipos de fases posteriores se añadirán cuando existan.

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

export type CanonicalRational = string;
export type QuestionId = string;
export type OptionId = string;
export type Difficulty = 1 | 2 | 3;

export interface QuestionOption {
  readonly id: OptionId;
  readonly text: string;
  readonly value: CanonicalRational | null;
  readonly misconception: string | null;
}

interface QuestionBase {
  readonly id: QuestionId;
  readonly statement: string;
  readonly primarySkill: SkillId;
  readonly secondarySkills: readonly SkillId[];
  readonly difficulty: Difficulty;
  readonly slip: number;
  readonly guess: number;
  readonly explanation: string;
  readonly assumptionNote: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  readonly format: 'multipleChoice';
  readonly options: readonly QuestionOption[];
  readonly correctAnswer: OptionId;
}

export interface NumericQuestion extends QuestionBase {
  readonly format: 'numeric';
  readonly correctAnswer: CanonicalRational;
}

export type Question = MultipleChoiceQuestion | NumericQuestion;

export interface QuestionBank {
  readonly questions: readonly Question[];
}

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

| Tipo | Motivo |
|---|---|
| `SkillId` | La interfaz necesita referirse a competencias con el mismo identificador que el motor. |
| `SkillNode` | Permite mostrar nombre, descripción y prerrequisitos sin importar código del motor. |
| `KnowledgeGraph` | Es el argumento explícito de las funciones del motor y la estructura que pintaría la interfaz. |
| `CanonicalRational` | Fija la cadena `numerador/denominador` que intercambian el banco y la interfaz. |
| `QuestionId`, `OptionId` | La interfaz los usa para mostrar preguntas y enviar respuestas. |
| `Difficulty` | La interfaz puede mostrarla. Es ordinal, no una calibración psicométrica. |
| `QuestionOption` | La interfaz necesita `id` y `text` para pintar las opciones. |
| `MultipleChoiceQuestion`, `NumericQuestion`, `Question` | La unión discriminada por `format` indica qué control pintar, sin campos opcionales ambiguos. |
| `QuestionBank` | Es el argumento explícito de las funciones del motor. |
| `Result` | Es el tipo de retorno de `submitAnswer` en §3 y de `normalizeRational`. |

## Decisiones que conviene revisar con el integrador

- `SkillId` es `string` para que las funciones admitan grafos genéricos, no solo el grafo RADAR. No es obligatorio para probar entradas inválidas, que también podrían construirse con conversiones de tipo en los tests. Una unión de los seis ids daría más comprobación en compilación, a cambio de atar los tipos al grafo RADAR.
- `SkillNode` solo contiene propiedades estáticas. El dominio estimado, la incertidumbre y los `questionIds` de §2.1 no van aquí: las estimaciones son del estado de cada alumno, y las preguntas se obtendrán del banco.
- `Question` usa `format` como discriminante, un campo que no aparece en la lista de §4. Las preguntas numéricas no tienen `options`.
- `QuestionOption` añade `value` y `misconception`, que tampoco aparecen en §4. Ambos usan `null` explícito en lugar de ser opcionales.
- `Question` incluye `correctAnswer`, `slip`, `guess` y `misconception`. Si la interfaz manda las preguntas a un cliente de alumno, puede convenir un tipo de presentación sin esos campos.
- Todos los tipos públicos son serializables como JSON. `BigInt` solo se usa dentro de `src/engine/rational.ts`.

## Tipos que se quedan en el motor

`KnowledgeGraphErrorCode`, `QuestionBankErrorCode`, `RationalErrorCode`, `KnowledgeGraphError` y `QuestionBankError` no necesitan ser compartidos salvo que la interfaz quiera distinguir códigos de error. Las dos clases de error no pueden vivir en un archivo solo de tipos.
