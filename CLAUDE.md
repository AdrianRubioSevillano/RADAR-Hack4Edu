# CLAUDE.md — RADAR · Motor algorítmico (Hack4Edu 2026)

Este archivo es la especificación que manda. Si un prompt contradice este archivo, para y pregunta.

## 0. Contexto y reparto

- Equipo de tres estudiantes de 4.º de Ingeniería Informática (UPSA). Hackatón Hack4Edu 2026.
- RADAR: plataforma de diagnóstico y optimización del aprendizaje colectivo.
- **Tu ámbito (motor algorítmico):** `src/engine/`, `src/simulation/`, `src/benchmarks/`, `docs/engine/`, `scripts/` (solo scripts del motor).
- **Fuera de tu ámbito (no tocar):** pantallas y componentes React, estilos, `src/shared/types.ts`, configuración de Vite salvo lo mínimo para Vitest (y avisando).
- Si necesitas un cambio en `src/shared/types.ts`: **no lo hagas**. Escribe la propuesta en `docs/engine/PROPUESTA_TIPOS.md` (diff exacto + motivo) y avisa en tu respuesta.
- Si `src/shared/types.ts` no existe todavía: define los tipos del motor en `src/engine/types.ts`, expórtalos desde `src/engine/index.ts` y deja en `docs/engine/PROPUESTA_TIPOS.md` lo que debería pasar a ser compartido.

## 1. Reglas de trabajo (obligatorias)

1. TypeScript con `strict: true`. Prohibido `any` (usa `unknown` y estrecha). Sin `// @ts-ignore`.
2. Funciones puras: ninguna función pública muta su entrada. Devuelve estado nuevo.
3. **Prohibido `Math.random()`** en `src/engine`, `src/simulation` y `src/benchmarks`. Toda aleatoriedad usa el PRNG con semilla de `src/simulation/rng.ts` (p. ej. mulberry32). Un test lo comprueba con búsqueda en el código.
4. Sin llamadas a APIs externas ni a modelos de IA. Sin backend.
5. Dependencias: ninguna salvo `vitest` (y `typescript`). Si crees que una librería matemática aporta valor, propónla antes de instalarla.
6. **Ejecuta los tests de verdad** (`npx vitest run`) antes de decir que algo funciona. Pega el resumen real de la salida. Si no puedes ejecutarlos, dilo.
7. **Ningún número de resultados se escribe a mano.** Los resultados de benchmark se generan con script y se guardan en `docs/engine/RESULTADOS_BENCHMARK.md` + JSON.
8. Todo parámetro que no esté calibrado con datos reales se marca en código y documentación como **SUPUESTO**.
9. Trabajo incremental: una fase por sesión (§7), commit al final de cada fase con mensaje claro. No avances de fase sin que los tests de la fase pasen.
10. Si una decisión matemática no está fijada aquí, **pregunta** en vez de inventarla.

## 2. Decisiones matemáticas fijadas

### 2.1 Grafo de competencias (DAG, definido por criterio experto, NO aprendido de datos)

| id | nombre | prerrequisitos |
|---|---|---|
| `OPS` | Operaciones básicas | — |
| `NEG` | Números negativos | OPS |
| `FRA` | Fracciones | OPS |
| `JER` | Jerarquía de operaciones | OPS, NEG |
| `ALG` | Simplificación algebraica | NEG, FRA, JER |
| `ECU` | Ecuaciones de primer grado | ALG |

- Cada nodo: `id`, `name`, `description`, `prerequisites`, y en el estado: dominio estimado, incertidumbre, `questionIds`.
- Funciones: validación de aciclicidad (Kahn), orden topológico, `ancestors(id)`, `descendants(id)`.
- Las aristas expresan una **hipótesis pedagógica** de dependencia, no causalidad demostrada. La co‑ocurrencia de errores entre competencias no se usa para crear ni justificar aristas.

### 2.2 Modelo de respuesta: DINA (binario, conjuntivo)

- Estado oculto de un alumno: `α ∈ {0,1}^6` (domina / no domina cada competencia). Solo hay **64 estados posibles**.
- Notación: `R_q` es el conjunto de competencias requeridas, `Y_q` la respuesta aleatoria (1 = acierto, 0 = fallo) y `r_q` la respuesta observada.
- Cada pregunta `q` tiene un conjunto requerido `R_q` = competencia principal ∪ secundarias (solo las que la pregunta realmente exige).
- `η_q(α) = 1` si α domina todas las competencias de `R_q`; si no, 0.
- `P(Y_q = 1 | α) = 1 − s_q` si `η_q(α) = 1`; `g_q` si `η_q(α) = 0`.
  - `s_q` (slip): error pese a dominar. `g_q` (guess): acierto sin dominar.
  - Restricción validada: `s_q` y `g_q` finitos y `0 < g_q < 1 − s_q < 1`. Lo que no la cumple se rechaza con error tipado; las entradas inválidas no se corrigen silenciosamente.
  - Valores por defecto SUPUESTOS: en opción múltiple, `g_q ≈ 1/nºopciones` ajustado al alza si hay distractores débiles; en respuesta numérica, `g_q` explícito por pregunta; `s_q ∈ [0.05, 0.20]` según dificultad. Documentados como no calibrados.

### 2.3 Inferencia bayesiana EXACTA sobre la conjunta

- Por alumno se guarda la distribución conjunta `π(α)` sobre los 64 estados (array de 64 floats que suma 1).
- **Prior por defecto:** producto de marginales independientes `p0_k` (configurables; por defecto 0.5; se admiten valores finitos en `[0,1]`, incluidos 0 y 1 exactos). Opción desactivada por defecto: prior “compatible con prerrequisitos” que multiplica por `ε` (SUPUESTO) los estados que dominan una competencia sin dominar sus prerrequisitos; activarla exige pasar `knowledgeGraph`.
- **Actualización:** `π'(α) ∝ π(α) · P(Y_q = r_q | α)`, renormalizando. Al ser exacta sobre la conjunta, una pregunta multicompetencia no cuenta dos veces la evidencia.
- Marginal: `P(dominio_k) = Σ_α π(α)·α_k`.
- Incertidumbre: entropía binaria de cada marginal `H_b(p_k)` en bits, y entropía de la conjunta `H(π)`.
- Estabilidad numérica: sin acotación global, las probabilidades válidas no se modifican. `0·log 0 = 0`, renormalizar tras cada paso; ante una normalización inválida o una masa total por debajo de `1e-300`, lanzar error tipado (no devolver NaN). El clipping de log‑loss (§2.9) nunca se aplica al posterior.

### 2.4 Selección activa: ganancia de información esperada (EIG)

- `EIG(q) = I(α; Y_q) = H_b(P(Y_q = 1)) − Σ_α π(α) · H_b(P(Y_q = 1 | α))`, con `P(Y_q = 1) = Σ_α π(α)·P(Y_q = 1 | α)`. Cálculo exacto.
- Candidatas: preguntas no respondidas (nunca se repite una pregunta).
- Desempate determinista: mayor EIG; si `|ΔEIG| < 1e-12`, menor `id` en orden lexicográfico.
- Explicación inspeccionable para cada candidata: `P(Y_q = 1)`, `EIG`, marginales esperadas si acierta / si falla, y la reducción esperada de la entropía de cada competencia.
- Sin preguntas disponibles → devuelve `null` (no lanza).

### 2.5 Diagnóstico de clase

Por competencia: media de `P(dominio)`, nº esperado que necesita refuerzo `Σ_i (1 − p_ik)`, nº con `p_ik < τ` (τ = 0.5 configurable), nº con estimación incierta (`0.3 < p < 0.7`, configurable), entropía media.
Por alumno y competencia: `P(prerrequisitos dominados)`, probabilidad conjunta de dominar **todos los ancestros** de la competencia, calculada **exactamente desde su conjunta**; vale 1 si no tiene ancestros.

### 2.6 Recomendación de intervenciones (parte principal)

Una intervención por competencia `k`, con duración `d_k` (minutos, SUPUESTO configurable) e importancia `imp_k ∈ [0,1]` (configurable).

Sea `D = Σ_j imp_j`, suma de todas las importancias. Componentes normalizados a [0,1] para cada `k`:
- `n_k = necesidad_k = Σ_i (1 − p_ik) / n`
- `relevancia_k = Σ_{j ∈ desc(k)} imp_j / D`; 0 si `D = 0` (cuánto aprendizaje posterior depende de k)
- `preparacion_k = media_i P(dominar todos los ancestros de k)`; 1 si `k` no tiene ancestros
- `confianza_k = 1 − media_i H_b(p_ik)`
- `prioridad_k = imp_k`

Valor de un subconjunto `S` de intervenciones:

```
b_k          = n_k · (w_prep·preparacion_k + w_conf·confianza_k + w_prio·imp_k)
cobertura(S) = Σ_j [ imp_j · max({ n_k : k ∈ S, j ∈ desc(k) } ∪ {0}) ] / D      (0 si D = 0)
beneficio(S) = Σ_{k ∈ S} b_k + w_rel·cobertura(S)
coste(S)     = λ · Σ_{k ∈ S} d_k / t_ref
valor(S)     = beneficio(S) − coste(S)
```

- `valor_k = valor({k})`. La cobertura de un conjunto se calcula directamente; no es la suma de las relevancias individuales.
- Valores por defecto SUPUESTOS y configurables: `w_prep = 0.30`, `w_conf = 0.20`, `w_prio = 0.30`, `w_rel = 0.20`, `λ = 0.10`, `t_ref = 30` minutos.
- Validación: pesos finitos, no negativos y con suma 1 (`|Σ w − 1| ≤ 1e-9`, tolerancia SUPUESTO); `λ` finito y `≥ 0`; `t_ref` y duraciones finitos y `> 0`; presupuesto `T` finito y `≥ 0`.
- La salida incluye cada componente, su peso, el beneficio, el coste, el valor neto y `valor_k / d_k`.

Avisos explicables (no ocultos en la puntuación):
- Si `preparacion_k` es menor que el umbral de preparación baja (0.5, SUPUESTO configurable, independiente del umbral diagnóstico τ): “conviene reforzar antes el prerrequisito X”, donde X es el ancestro de `k` con menor dominio medio; desempate por `id`.
- Si `confianza_k` es menor que el umbral de confianza baja (0.5, SUPUESTO configurable): “la estimación es incierta; considerar más evaluación antes de intervenir”.

Plan con presupuesto de tiempo `T`:
- Selección discreta de un subconjunto `S` con `Σ d_k ≤ T` que maximiza `valor(S)`. El plan vacío es válido, con `valor(∅) = 0`.
- Con 6 intervenciones hay 64 subconjuntos, incluido el vacío: **enumeración exacta** de los que respetan el presupuesto.
- Desempate con tolerancia absoluta `1e-12` respecto al máximo: entre los subconjuntos empatados, menor duración total y después la lista ordenada de ids.
- El coste permite descartar incorporaciones que no compensan el tiempo. No obliga a dejar presupuesto sin usar: puede agotarse si compensa.
- Todo esto es una **heurística de priorización**, no una estimación de efecto causal ni una mejora educativa demostrada. Debe decirlo la documentación y el campo `disclaimer` de la salida.

### 2.7 Simulador (solo para benchmarks y demo)

- PRNG con semilla. Igual configuración, versión y semilla ⇒ mismos resultados deterministas. Los tiempos y metadatos variables se guardan aparte y se excluyen de las comprobaciones de igualdad.
- Flujos aleatorios separados para población, respuestas, orden aleatorio, intervención y bootstrap. Cambiar el orden de ejecución de los métodos no altera los datos asignados a cada uno.
- Clase por defecto de 30 alumnos con ids ficticios (`S01`…`S30`), en 2–3 grupos con probabilidades de dominio distintas (SUPUESTO). Al generar el estado real, si un prerrequisito no se domina, la probabilidad de dominar la competencia baja (factor SUPUESTO). Documentar que esto se parece a la estructura del grafo y que el prior del motor, por defecto, NO la usa.
- Respuestas generadas con el mismo modelo DINA y los **parámetros reales del simulador**, que pueden diferir de los que asume el motor (escenario de mala especificación).
- El estado real `α` vive solo en `src/simulation` y no se pasa a funciones de `src/engine`, con una única excepción: las funciones puras del modelo DINA (p. ej. `P(Y_q = 1 | α)`), que `src/simulation` puede usar para generar respuestas. Esas funciones no guardan estado ni actualizan estimaciones. Un test lo comprueba (las funciones del motor no reciben objetos con `trueMastery`).
- Números aleatorios comunes: se pre‑muestrea un uniforme `u` por (alumno, pregunta, ocasión de medida). Acierto si `u < P(Y_q = 1 | α actual)`.
  - Los métodos comparten los uniformes del pre‑test dentro de cada escenario y réplica, de modo que ven la misma respuesta si hacen la misma pregunta.
  - El post‑test usa otra ocasión, con uniformes independientes del pre‑test y compartidos entre comparaciones equivalentes.

### 2.8 Evaluación posterior a la intervención

- `simulatePostIntervention`: cada alumno del grupo tratado con `α_k = 0` pasa a `α_k = 1` con probabilidad `p_mejora` (SUPUESTO), reducida por un factor si no domina los prerrequisitos.
- Opción de grupo de control aleatorio (semilla) sin intervención.
- Post‑test con preguntas de `k` no usadas en el pre‑test cuando haya suficientes, en una ocasión de medida distinta (§2.7).
- La salida separa SIEMPRE: (a) cambio en resultados observados, (b) cambio en estimaciones del motor, (c) efecto real simulado (solo conocible en simulación), (d) nota de que en alumnos reales una comparación antes/después no demuestra causalidad; con control aleatorio se muestra la diferencia en diferencias como estimación en simulación.

### 2.9 Benchmark

- Métodos: **A** fijo (orden de preguntas decidido de antemano y mismo para todos los alumnos: rondas por competencia principal en orden topológico; dentro de cada competencia, dificultad 2, 1, 3 y después `id`; cada pregunta aparece una sola vez), **B** adaptativo EIG, **C** aleatorio con semilla (control de cordura).
- Mismo presupuesto de preguntas para todos. Presupuestos: 4, 6, 9, 12 y “todas”.
- Métricas por alumno y competencia vs estado real: MAE, Brier, log‑loss (clipping `ε = 1e-12`, SUPUESTO, exclusivo de esta métrica); detección de “dificultad” (`α_k = 0`, clase positiva) con umbral τ: precisión, exhaustividad (recall), F1, exactitud; preguntas usadas; tiempo de cálculo por selección (ms).
- La detección agrega los pares alumno‑competencia dentro de cada semilla:
  - Precisión `= TP/(TP+FP)`, `null` si `TP+FP = 0`.
  - Recall `= TP/(TP+FN)`, `null` si `TP+FN = 0`.
  - F1 `= 2TP/(2TP+FP+FN)`, `null` solo si su denominador es 0.
  - Exactitud: `null` si no hay observaciones.
- ≥ 30 semillas; cada semilla es una réplica. Media, desviación típica muestral, IC 95 % percentil y diferencia **emparejada** B − A por semilla, con nº de semillas donde B es peor.
  - IC por bootstrap con semilla y 2000 remuestreos (SUPUESTO) sobre semillas completas, no sobre pares alumno‑competencia independientes.
  - Se informa de cuántos valores válidos hay; `null` no se convierte en 0. Las comparaciones emparejadas usan solo parejas válidas.
  - Desviación típica `null` con menos de dos semillas válidas. Media, IC y diferencias sin datos válidos: `null` con indicación explícita.
- Escenarios: (1) bien especificado; (2) mala especificación (slip/guess reales distintos de los asumidos); (3) presupuesto = todas las preguntas; (4) clase homogénea. Se reporta todo, también donde B empata o pierde.
- Escenario 3: mismos prior, banco y respuestas comunes, sin parada anticipada; todos los métodos consumen todas las preguntas. Se comparan posteriores y métricas deterministas con tolerancia absoluta `1e-9`, excluyendo los tiempos.
- Salida: `docs/engine/RESULTADOS_BENCHMARK.md` y `.json`, generados por `npm run bench`, con la semilla base y la configuración. Tiempos y metadatos variables van separados de los resultados deterministas.

## 3. API pública por módulo

Firmas orientativas; ajustar a `src/shared/types.ts` si existe, sin modificar ese archivo (§0).

Separación de módulos: `src/engine` no importa `src/simulation` ni `src/benchmarks`. `src/simulation` puede reutilizar funciones puras DINA de `src/engine`, también con el estado real (§2.7).

```ts
// src/engine/index.ts
createInitialDiagnosticState(studentId: string, config?: PriorConfig, knowledgeGraph?: KnowledgeGraph): DiagnosticState
selectNextQuestion(state: DiagnosticState, questionBank: QuestionBank): QuestionSelection | null
submitAnswer(state: DiagnosticState, questionId: string, answer: AnswerValue, questionBank: QuestionBank): Result<DiagnosticState, AnswerError>
getClassDiagnostic(studentStates: DiagnosticState[], knowledgeGraph: KnowledgeGraph, config?: ClassDiagnosticConfig): ClassDiagnostic
rankInterventions(classDiagnostic: ClassDiagnostic, knowledgeGraph: KnowledgeGraph, availableMinutes: number, config?: InterventionConfig): InterventionRanking

// src/simulation/index.ts
createSyntheticClass(seed: number, studentCount: number, config?: SimulationConfig): SyntheticClass
simulatePostIntervention(classState: SyntheticClass, intervention: InterventionPlan, seed: number, config?: PostInterventionConfig): PostInterventionReport

// src/benchmarks/index.ts
runBenchmark(config: BenchmarkConfig): BenchmarkReport
```

- `submitAnswer` recibe el banco para conocer `R_q`, `s_q`, `g_q` y la respuesta correcta.
- `knowledgeGraph` es opcional en `createInitialDiagnosticState`, salvo si se activa el prior compatible con prerrequisitos, que lo exige.
- `rankInterventions` recibe `knowledgeGraph` de forma explícita; el grafo no se inserta dentro de `ClassDiagnostic`.

## 4. Banco de preguntas

- 30 preguntas (5 por competencia), nivel 1.º–2.º ESO. Formato cerrado: opción múltiple de 4 opciones con distractores basados en errores típicos, o respuesta numérica exacta (`correctAnswer` es un entero o una fracción irreducible).
- Campos: `id`, `statement`, `primarySkill`, `secondarySkills`, `options`, `correctAnswer`, `difficulty`, `slip`, `guess`, `explanation`, `assumptionNote`.
- `difficulty` es ordinal `1 | 2 | 3`; no es una calibración psicométrica.
- Respuesta numérica: `guess` explícito por pregunta (SUPUESTO no calibrado). Se aceptan enteros y fracciones equivalentes mediante aritmética racional exacta; se rechazan el denominador cero y los formatos no admitidos. Sin `eval` ni tolerancia flotante.
- Al menos 6 preguntas multicompetencia.
- Un test recalcula con aritmética de fracciones exacta la respuesta de cada pregunta que lo permita y comprueba que coincide; otro comprueba que no hay opciones duplicadas y que la correcta está entre ellas.

## 5. Estructura de carpetas

```
src/engine/       graph.ts, questionBank.ts, bayes.ts, entropy.ts, selection.ts,
                  classDiagnostic.ts, interventions.ts, types.ts, index.ts
src/simulation/   rng.ts, syntheticClass.ts, responder.ts, postIntervention.ts, index.ts
src/benchmarks/   methods.ts, metrics.ts, stats.ts, runBenchmark.ts, index.ts
tests/engine|simulation|benchmarks/  *.test.ts
docs/engine/      MATEMATICAS.md, API.md, INTEGRACION_REACT.md, LIMITACIONES.md,
                  RESULTADOS_BENCHMARK.md, PROPUESTA_TIPOS.md
scripts/          bench.ts
```

## 6. Tests obligatorios

Actualización bayesiana (caso calculado a mano), entropía e EIG (valores conocidos, EIG ≥ 0, EIG = 0 si la pregunta no informa), no repetición, reproducibilidad con semilla (excluyendo tiempos y metadatos variables), independencia del orden de ejecución de los métodos, validación de respuestas (id inexistente, repetida, opción inválida, denominador cero, formato no admitido, fracción equivalente aceptada), validación de `slip`/`guess` (no finitos o fuera de `0 < g < 1 − s < 1`, rechazados), validación de pesos, `λ`, `t_ref`, duraciones y presupuesto, integridad del grafo (acíclico, ids estables, detecta ciclo inyectado), ordenación de intervenciones, cobertura sin doble conteo, plan vacío, respeto del presupuesto de tiempo (incluido presupuesto 0), datos vacíos (clase vacía, banco vacío), `D = 0`, priors extremos (0, 1, 1e-12) sin NaN ni modificación, normalización inválida con error tipado, métricas `null` sin convertirlas en 0, escenario “todas” con tolerancia `1e-9`, ausencia de `Math.random` en `src/engine`, `src/simulation` y `src/benchmarks`, `src/engine` no importa `src/simulation` ni `src/benchmarks`, el motor no recibe el estado real salvo en las funciones puras DINA (§2.7).

## 7. Fases

Esta planificación se define aquí porque `PROMPTS_RADAR.md` no está disponible.

- **Fase 1:** grafo, banco de 30 preguntas, tipos provisionales y validación.
- **Fase 2:** DINA, prior, posterior exacto y entropías.
- **Fase 3:** EIG, selección explicable y registro de respuestas.
- **Fase 4:** diagnóstico de clase e intervenciones con optimización exacta.
- **Fase 5:** simulación reproducible y respuestas comunes.
- **Fase 6:** evaluación postintervención.
- **Fase 7:** benchmarks, informes y documentación de integración.

Una fase por sesión; si es grande, se divide en sesiones sin ampliar el alcance.
