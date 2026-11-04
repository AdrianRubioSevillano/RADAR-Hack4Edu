# Integración con React

Cómo usar el motor desde la aplicación. Las firmas completas están en `API.md` y las reglas matemáticas, en `MATEMATICAS.md`. Antes de mostrar resultados a nadie, lee `LIMITACIONES.md`.

El motor es TypeScript puro: no tiene backend, no llama a servicios externos y sus resultados son serializables como JSON. Sus funciones no mutan las entradas y devuelven estado nuevo, así que encajan con `useState` o `useReducer`.

Los bloques de código forman un único ejemplo, en orden. Las rutas suponen un archivo en `src/<carpeta>/`; ajústalas a la estructura de la aplicación.

## Qué es cada parte

| Parte | Módulo | Para qué sirve | Usa datos de |
|---|---|---|---|
| Diagnóstico | `src/engine` | Estimar qué domina cada alumno y elegir la siguiente pregunta | Alumnos reales o demo |
| Priorización | `src/engine` | Ordenar competencias y comparar planes para la clase | Diagnóstico de clase |
| Simulación | `src/simulation` | Generar alumnos sintéticos, sus respuestas y una intervención simulada | Solo demo y benchmarks |
| Benchmark | `src/benchmarks` | Medir la recuperación de estados sintéticos | Solo simulación |

Son tres cosas distintas, y la interfaz no debe mezclarlas:

- **Diagnóstico:** estima un estado. No enseña ni cambia lo que sabe el alumno.
- **Práctica:** actividades para aprender. **El motor no las genera.** Las elige y las presenta la aplicación.
- **Intervención simulada:** un cambio inventado en el conocimiento de alumnos sintéticos. No es aprendizaje observado y no debe aparecer como resultado de una clase real.

Un plan de `rankInterventions` dice qué competencias priorizar, no que se hayan aprendido.

## Flujo del alumno

### Inicializar

```ts
import {
  InferenceError,
  KNOWLEDGE_GRAPH,
  KnowledgeGraphError,
  QuestionBankError,
  RADAR_QUESTION_BANK,
  compareInterventionPlans,
  createInitialDiagnosticState,
  getClassDiagnostic,
  marginals,
  rankInterventions,
  selectNextQuestion,
  submitAnswer,
} from '../engine/index.ts';
import type { DiagnosticState, Question } from '../engine/index.ts';

const initialState: DiagnosticState = createInitialDiagnosticState('alumno-01');
```

```ts
createInitialDiagnosticState(studentId: string, config?: PriorConfig, knowledgeGraph?: KnowledgeGraph): DiagnosticState
```

Conserva `DiagnosticState` entero, por ejemplo en `localStorage`. No lo reconstruyas campo a campo: el motor valida sus campos. No interpretes los índices de `joint`: usa `marginals(state.joint)`.

### Pedir la siguiente pregunta

`selectNextQuestion` devuelve la pregunta con mayor ganancia de información esperada, o `null` si no quedan preguntas. Es síncrona y rápida para una sola selección.

La pregunta incluye la solución, así que hay que proyectarla antes de mostrarla:

```ts
type OptionView = { readonly id: string; readonly text: string };

type QuestionView =
  | { readonly id: string; readonly statement: string; readonly format: 'multipleChoice'; readonly options: readonly OptionView[] }
  | { readonly id: string; readonly statement: string; readonly format: 'numeric' };

function toQuestionView(question: Question): QuestionView {
  const { id, statement } = question;
  if (question.format === 'multipleChoice') {
    return {
      id,
      statement,
      format: 'multipleChoice',
      options: question.options.map((option) => ({ id: option.id, text: option.text })),
    };
  }
  return { id, statement, format: 'numeric' };
}

function nextQuestionView(state: DiagnosticState): QuestionView | null {
  const selection = selectNextQuestion(state, RADAR_QUESTION_BANK);
  return selection === null ? null : toQuestionView(selection.question);
}
```

**Campos que no deben verse antes de responder:**

| Campo | Motivo |
|---|---|
| `correctAnswer` | Es la solución. |
| `explanation` | La explica. |
| `options[].misconception` | Revela qué opciones son erróneas; `null` delata la correcta. |
| `options[].value` | Valor interno de la opción; se muestra `text`. |
| `slip`, `guess`, `assumptionNote` | Parámetros del modelo, no contenido para el alumno. |
| `QuestionSelection.candidates` | Posteriores y explicación de la selección, solo para inspección. |

Ocultarlos en la interfaz no es seguridad: sin backend, el banco completo viaja al navegador y cualquiera puede leerlo. Sirve para una demo, no para un examen con consecuencias.

### Registrar una respuesta

`submitAnswer` no lanza por una respuesta mal escrita: devuelve un `Result`. Si falla, el estado sigue siendo el anterior.

```ts
function registerAnswer(state: DiagnosticState, questionId: string, answer: string): DiagnosticState | string {
  const result = submitAnswer(state, questionId, answer, RADAR_QUESTION_BANK);
  if (result.ok) {
    return result.value;
  }
  switch (result.error.code) {
    case 'INVALID_NUMERIC_FORMAT':
      return 'Escribe un entero o una fracción, por ejemplo 5 o 3/4.';
    case 'ZERO_DENOMINATOR':
      return 'El denominador no puede ser 0.';
    default:
      return result.error.message;
  }
}
```

- En opción múltiple, `answer` es el id de la opción.
- En numérica, admite enteros y fracciones equivalentes: `10/2` y `5` valen lo mismo. Se rechazan decimales, expresiones y espacios interiores.
- `REPEATED_QUESTION`: esa pregunta ya está respondida. No se repiten preguntas.
- `isCorrect` y `normalizedAnswer` quedan en `state.responses`. Tras responder ya se puede mostrar `explanation`.

### Leer la estimación

```ts
function estimatedMastery(state: DiagnosticState): Readonly<Record<string, number>> {
  return marginals(state.joint);
}
```

Son probabilidades de un modelo con parámetros no calibrados. Preséntalas como estimación, no como una nota ni como un diagnóstico confirmado.

## Flujo del docente

### Diagnóstico colectivo

```ts
function classOverview(states: readonly DiagnosticState[], availableMinutes: number) {
  const diagnostic = getClassDiagnostic(states, KNOWLEDGE_GRAPH);
  const ranking = rankInterventions(diagnostic, KNOWLEDGE_GRAPH, availableMinutes);
  const comparison = compareInterventionPlans(diagnostic, KNOWLEDGE_GRAPH, availableMinutes);
  return { diagnostic, ranking, comparison };
}
```

```ts
getClassDiagnostic(studentStates: readonly DiagnosticState[], knowledgeGraph: KnowledgeGraph, config?: ClassDiagnosticConfig): ClassDiagnostic
rankInterventions(classDiagnostic: ClassDiagnostic, knowledgeGraph: KnowledgeGraph, availableMinutes: number, config?: InterventionConfig): InterventionRanking
compareInterventionPlans(classDiagnostic: ClassDiagnostic, knowledgeGraph: KnowledgeGraph, availableMinutes: number, config?: InterventionConfig): InterventionPlanComparison
```

Muestra siempre `warnings` y `disclaimer` junto a las cifras.

### Ranking y comparación de planes

- `ranking.ranking`: competencias ordenadas por valor neto, con sus componentes para explicar el orden.
- `ranking.plan`: subconjunto exacto que cabe en `availableMinutes`. No es un prefijo del ranking.
- `comparison.collectivePlan`: el plan anterior, con su análisis de necesidad pendiente.
- `comparison.pendingNeedPlan`: plan que reduce la mayor necesidad estimada pendiente de un alumno.
- `comparison.plansCoincide`: si son el mismo plan, no fuerces una diferencia.

`availableMinutes` tiene resolución de un segundo: `0.1` son 6 segundos, pero `0.01` lanza `INVALID_BUDGET`.

**Textos a evitar.** No uses “necesidades resueltas” ni “alumnos beneficiados”: `scheduled` es necesidad estimada programada, no aprendida. `coverage` mide descendientes del grafo, no alumnos atendidos. Ninguno de los dos planes es “el mejor” ni “el más justo”: son heurísticas distintas.

## Casos que la interfaz debe tratar

| Caso | Qué devuelve el motor | Qué mostrar |
|---|---|---|
| Banco agotado para un alumno | `selectNextQuestion` devuelve `null` | Fin del diagnóstico. No es un error. |
| Clase vacía | `insufficientData: true`, medias `null`, ranking y plan vacíos, aviso `NO_STUDENTS` | “No hay alumnos”. Nunca 0 %. |
| Ningún alumno con respuestas | `evidenceStatus: 'priorsOnly'`, `basis: 'hypotheticalPriorsOnly'`, plan vacío, aviso `COLLECT_RESPONSES` | Pedir respuestas. El ranking es hipotético: no lo presentes como recomendación. |
| Algunos alumnos solo con prior | `evidenceStatus: 'mixed'`, `basedOnPriorOnly` por alumno en la comparación | Mantener visibles los avisos y la proporción sin respuestas. |
| Todas las importancias a 0 | Índices normalizados `null`, aviso `ZERO_TOTAL_IMPORTANCE` | No afirmar que no hay necesidad: `need` se conserva. |
| Valor `null` | Métrica no definida | “No disponible”. Nunca 0. |

Un alumno sin respuestas tiene un estado válido: su estimación es el prior, 0.5 por defecto en cada competencia. Eso significa que no hay evidencia, no que domine la mitad. `allWithResponses` tampoco garantiza que todas las competencias estén medidas.

Con `null`, usa comprobaciones explícitas: `value === null`, no `value || 0`, que convierte un 0 válido y un `null` en lo mismo.

## Errores

`submitAnswer` devuelve `Result<DiagnosticState, AnswerError>`. Las demás funciones lanzan errores tipados ante entradas inválidas. Esos errores indican un fallo de integración o datos corruptos, no un error del alumno.

```ts
function describeEngineError(error: unknown): string {
  if (error instanceof InferenceError) return `Datos inválidos (${error.code}): ${error.message}`;
  if (error instanceof QuestionBankError) return `Banco inválido (${error.code}): ${error.message}`;
  if (error instanceof KnowledgeGraphError) return `Grafo inválido (${error.code}): ${error.message}`;
  throw error;
}
```

Atrápalos en el borde de la operación, por ejemplo con un `try/catch` en el manejador o un `ErrorBoundary`. No los sustituyas por valores de reserva. La lista de códigos está en `API.md`.

## Qué recibe el motor

**Puede recibir:** ids de alumno, `DiagnosticState`, respuestas observables, el banco, el grafo y configuraciones.

**Debe quedar fuera:** `SyntheticClass`, `trueMastery`, `groupId`, `ResponseUniformTable`, `realParametersByQuestion` y `postClass`. Las funciones de diagnóstico, selección y recomendación nunca reciben esos datos.

En una demo con alumnos sintéticos, la frontera es esta:

```ts
import { createResponseUniforms, createSyntheticClass, observableStudents, simulateResponse } from '../simulation/index.ts';

const demoClass = createSyntheticClass(42, 30, KNOWLEDGE_GRAPH);
const demoStudents = observableStudents(demoClass);
const demoUniforms = createResponseUniforms(
  demoClass.seed,
  demoStudents.map((student) => student.studentId),
  RADAR_QUESTION_BANK.questions.map((question) => question.id),
  'pretest',
);

function demoStep(state: DiagnosticState): DiagnosticState | null {
  const selection = selectNextQuestion(state, RADAR_QUESTION_BANK);
  if (selection === null) {
    return null;
  }
  const answer = simulateResponse(demoClass, state.studentId, selection.question, demoUniforms);
  const result = submitAnswer(state, selection.question.id, answer, RADAR_QUESTION_BANK);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
}
```

- La interfaz y el diagnóstico usan `demoStudents`, que solo tiene `studentId` y `displayName`.
- `demoClass` y `demoUniforms` se quedan en la capa de demo. No van al estado de los componentes de alumno ni de docente.
- `simulateResponse` es lo único que toca la verdad, y devuelve solo una cadena.
- Los ids y nombres son ficticios. El id permite deducir el grupo generador con la regla `i mod G`: no lo uses para analizar resultados.
- Si una pantalla muestra la verdad simulada para explicar la demo, debe decir que solo existe en la simulación.

### Intervención simulada

`simulatePostIntervention` crea un postest sobre alumnos sintéticos. Es solo para demo:

```ts
simulatePostIntervention(input: PostInterventionInput): PostInterventionReport
```

El informe separa tres capas, y deben mostrarse separadas: `observed` (cambio descriptivo no equiparado), `estimated` (no es aprendizaje confirmado) y `simulatedTruth` (solo conocible en la simulación). Muestra `disclaimer` y `warnings`. Un informe es una sola réplica: no sirve para concluir qué plan es mejor. `postStates` omite a los alumnos sin preguntas nuevas.

## Benchmark precalculado

**No ejecutes `runBenchmark` en la aplicación.** El experimento completo tardó unos 145 segundos en la máquina medida (`RESULTADOS_BENCHMARK_TIEMPOS.json`). Es síncrono: en el render o en el hilo principal bloquearía la interfaz.

Para la demo, consume los informes ya generados:

| Archivo | Contenido | Uso |
|---|---|---|
| `docs/engine/RESULTADOS_BENCHMARK.json` | Bloque determinista: configuración, semillas, réplicas, resúmenes y comprobaciones | Datos de la pantalla |
| `docs/engine/RESULTADOS_BENCHMARK.md` | Informe legible con sus límites | Referencia y texto |
| `docs/engine/RESULTADOS_BENCHMARK_TIEMPOS.json` | Tiempos y metadatos variables | Procedencia. No comparar rendimiento. |

El JSON pesa casi 2 MB: cópialo a la carpeta de recursos públicos y cárgalo bajo demanda, sin incluirlo en el paquete principal. Para los tipos basta `import type`:

```ts
import type { BenchmarkMetric, BenchmarkResults, BenchmarkScenarioId, QuestionBudget } from '../benchmarks/index.ts';

function benchmarkProvenance(results: BenchmarkResults) {
  const { kind, benchmarkVersion, config, bootstrapSeed, replicaSeeds, disclaimer } = results;
  return {
    isFullExperiment: kind === 'full',
    benchmarkVersion,
    generator: config.generator,
    baseSeed: config.baseSeed,
    bootstrapSeed,
    replicas: replicaSeeds.length,
    studentsPerReplica: config.studentCount,
    resamples: config.resamples,
    disclaimer,
  };
}

function pairedDifference(
  results: BenchmarkResults,
  scenario: BenchmarkScenarioId,
  budget: QuestionBudget,
  metric: BenchmarkMetric,
) {
  const found = results.scenarios
    .find((item) => item.definition.id === scenario)
    ?.comparisons.find((item) => item.requestedBudget === budget && item.metric === metric);
  if (found === undefined) {
    return null;
  }
  const { comparison } = found;
  return {
    mean: comparison.differences.mean,
    interval: comparison.differences.confidenceInterval,
    direction: comparison.direction,
    improved: comparison.improvedCount,
    tied: comparison.tiedCount,
    worsened: comparison.worsenedCount,
    pairs: comparison.pairCount,
    excluded: comparison.excludedPairs.length,
  };
}
```

Al mostrar resultados:

- Comprueba `kind === 'full'`. Con `test`, no los presentes como experimento.
- Enseña los tres escenarios, incluidas las pérdidas y los empates. No elijas solo los favorables.
- Muestra la procedencia y `disclaimer`.
- `direction` indica si menor o mayor es mejor en cada métrica.
- Si cambia el banco, el grafo o el código del motor, los archivos dejan de corresponder: hay que regenerarlos con `npm run bench`, nunca editarlos.

Un cálculo interactivo futuro necesitaría ejecutarse fuera del hilo principal, por ejemplo en un Web Worker, con progreso y cancelación. Eso no existe todavía.

## Qué falta por integrar

El motor no incluye pantallas, persistencia, cuentas, práctica individual, actividades colectivas ni accesibilidad. Esas partes corresponden a la aplicación y no quedan terminadas por existir el motor. El detalle está en `LIMITACIONES.md`.
