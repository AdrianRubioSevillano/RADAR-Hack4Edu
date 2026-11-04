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
3. **Prohibido `Math.random()`** en `src/engine` y `src/simulation`. Toda aleatoriedad pasa por `src/simulation/rng.ts` (PRNG con semilla, p. ej. mulberry32). Un test lo comprueba con búsqueda en el código.
4. Sin llamadas a APIs externas ni a modelos de IA. Sin backend.
5. Dependencias: ninguna salvo `vitest` (y `typescript`). Si crees que una librería matemática aporta valor, propónla antes de instalarla.
6. **Ejecuta los tests de verdad** (`npx vitest run`) antes de decir que algo funciona. Pega el resumen real de la salida. Si no puedes ejecutarlos, dilo.
7. **Ningún número de resultados se escribe a mano.** Los resultados de benchmark se generan con script y se guardan en `docs/engine/RESULTADOS_BENCHMARK.md` + JSON.
8. Todo parámetro que no esté calibrado con datos reales se marca en código y documentación como **SUPUESTO**.
9. Trabajo incremental: una fase por sesión, commit al final de cada fase con mensaje claro. No avances de fase sin que los tests de la fase pasen.
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
- Cada pregunta `q` tiene un conjunto requerido `R_q` = competencia principal ∪ secundarias (solo las que la pregunta realmente exige).
- `η_q(α) = 1` si α domina todas las competencias de `R_q`; si no, 0.
- `P(acierto | α) = 1 − s_q` si `η_q(α) = 1`; `g_q` si `η_q(α) = 0`.
  - `s_q` (slip): error pese a dominar. `g_q` (guess): acierto sin dominar.
  - Restricción validada: `0 < g_q < 1 − s_q < 1`.
  - Valores por defecto SUPUESTOS: `g_q ≈ 1/nºopciones` ajustado al alza si hay distractores débiles; `s_q ∈ [0.05, 0.20]` según dificultad. Documentados como no calibrados.

### 2.3 Inferencia bayesiana EXACTA sobre la conjunta

- Por alumno se guarda la distribución conjunta `π(α)` sobre los 64 estados (array de 64 floats que suma 1).
- **Prior por defecto:** producto de marginales independientes `p0_k` (configurables; por defecto 0.5). Opción desactivada por defecto: prior “compatible con prerrequisitos” que multiplica por `ε` (SUPUESTO) los estados que dominan una competencia sin dominar sus prerrequisitos.
- **Actualización:** `π'(α) ∝ π(α) · P(r | α)`, renormalizando. Al ser exacta sobre la conjunta, una pregunta multicompetencia no cuenta dos veces la evidencia.
- Marginal: `P(dominio_k) = Σ_α π(α)·α_k`.
- Incertidumbre: entropía binaria de cada marginal `H_b(p_k)` en bits, y entropía de la conjunta `H(π)`.
- Estabilidad numérica: parámetros acotados a `[1e-6, 1 − 1e-6]`, `0·log 0 = 0`, renormalizar tras cada paso; si la masa total cae por debajo de `1e-300` lanzar error tipado (no devolver NaN).

### 2.4 Selección activa: ganancia de información esperada (EIG)

- `EIG(q) = I(α; R_q) = H_b(P(acierto)) − Σ_α π(α) · H_b(P(acierto | α))`, con `P(acierto) = Σ_α π(α)·P(acierto|α)`. Cálculo exacto.
- Candidatas: preguntas no respondidas (nunca se repite una pregunta).
- Desempate determinista: mayor EIG; si `|ΔEIG| < 1e-12`, menor `id` en orden lexicográfico.
- Explicación inspeccionable para cada candidata: `P(acierto)`, `EIG`, marginales esperadas si acierta / si falla, y la reducción esperada de la entropía de cada competencia.
- Sin preguntas disponibles → devuelve `null` (no lanza).

### 2.5 Diagnóstico de clase

Por competencia: media de `P(dominio)`, nº esperado que necesita refuerzo `Σ_i (1 − p_ik)`, nº con `p_ik < τ` (τ = 0.5 configurable), nº con estimación incierta (`0.3 < p < 0.7`, configurable), entropía media.
Por alumno y competencia: `P(prerrequisitos dominados)` calculada **exactamente desde su conjunta**.

### 2.6 Recomendación de intervenciones (parte principal)

Una intervención por competencia `k`, con duración `d_k` (minutos, SUPUESTO configurable) e importancia `imp_k ∈ [0,1]` (configurable).

Componentes normalizados a [0,1] para cada `k`:
- `necesidad_k = Σ_i (1 − p_ik) / n`
- `relevancia_k = Σ_{j ∈ desc(k)} imp_j / Σ_{j ≠ k} imp_j` (cuánto aprendizaje posterior depende de k)
- `preparacion_k = media_i P(prerrequisitos de k dominados)`
- `confianza_k = 1 − media_i H_b(p_ik)`
- `prioridad_k = imp_k`

`valor_k = w_nec·necesidad + w_rel·relevancia + w_prep·preparacion + w_conf·confianza + w_prio·prioridad`.
Pesos explícitos en un objeto de configuración con valores por defecto documentados como SUPUESTO. La salida incluye cada componente, su peso y su aportación, más `valor_k / d_k`.

Avisos explicables (no ocultos en la puntuación):
- Si `preparacion_k < τ`: “conviene reforzar antes el prerrequisito X”.
- Si `confianza_k` es baja: “la estimación es incierta; considerar más evaluación antes de intervenir”.

Plan con presupuesto de tiempo `T`:
- Selección discreta de un subconjunto `S` con `Σ d_k ≤ T` que maximiza `valor(S)`.
- Para evitar contar dos veces el solapamiento: la parte de relevancia de `S` se calcula sobre la **unión** de descendientes de las competencias de S (cada descendiente cuenta una vez); el resto de componentes es aditivo por competencia (cada competencia aparece una sola vez).
- Con 6 intervenciones hay 64 subconjuntos: **enumeración exacta**. Desempate: menor duración total, luego orden de ids.
- Esto es una **heurística de priorización**, no una estimación de efecto causal. Debe decirlo la documentación y el campo `disclaimer` de la salida.

### 2.7 Simulador (solo para benchmarks y demo)

- PRNG con semilla. Misma semilla ⇒ resultados idénticos bit a bit.
- Clase por defecto de 30 alumnos con ids ficticios (`S01`…`S30`), en 2–3 grupos con probabilidades de dominio distintas (SUPUESTO). Al generar el estado real, si un prerrequisito no se domina, la probabilidad de dominar la competencia baja (factor SUPUESTO). Documentar que esto se parece a la estructura del grafo y que el prior del motor, por defecto, NO la usa.
- Respuestas generadas con el mismo modelo DINA y los **parámetros reales del simulador**, que pueden diferir de los que asume el motor (escenario de mala especificación).
- El estado real `α` vive solo en `src/simulation` y nunca se pasa a funciones de `src/engine`. Un test lo comprueba (las funciones del motor no reciben objetos con `trueMastery`).
- Números aleatorios comunes: para cada (alumno, pregunta) se pre‑muestrea el resultado una vez, de modo que todos los métodos comparados ven la misma respuesta si hacen la misma pregunta.

### 2.8 Evaluación posterior a la intervención

- `simulatePostIntervention`: cada alumno del grupo tratado con `α_k = 0` pasa a `α_k = 1` con probabilidad `p_mejora` (SUPUESTO), reducida por un factor si no domina los prerrequisitos.
- Opción de grupo de control aleatorio (semilla) sin intervención.
- Post‑test con preguntas de `k` no usadas en el pre‑test cuando haya suficientes.
- La salida separa SIEMPRE: (a) cambio en resultados observados, (b) cambio en estimaciones del motor, (c) efecto real simulado (solo conocible en simulación), (d) nota de que en alumnos reales una comparación antes/después no demuestra causalidad; con control aleatorio se muestra la diferencia en diferencias como estimación en simulación.

### 2.9 Benchmark

- Métodos: **A** fijo (orden de preguntas decidido de antemano: ronda por competencias en orden topológico, dificultad media primero; mismo orden para todos los alumnos), **B** adaptativo EIG, **C** aleatorio con semilla (control de cordura).
- Mismo presupuesto de preguntas para todos. Presupuestos: 4, 6, 9, 12 y “todas”.
- Métricas por alumno y competencia vs estado real: MAE, Brier, log‑loss; detección de “dificultad” (`α_k = 0`) con umbral τ: precisión, exhaustividad (recall), F1, exactitud; preguntas usadas; tiempo de cálculo por selección (ms).
- ≥ 30 semillas. Media, desviación típica, IC 95 % (bootstrap con semilla) y diferencia **emparejada** B − A por semilla, con nº de semillas donde B es peor.
- Escenarios: (1) bien especificado; (2) mala especificación (slip/guess reales distintos de los asumidos); (3) presupuesto = todas las preguntas (los métodos deben converger); (4) clase homogénea. Se reporta todo, también donde B empata o pierde.
- Salida: `docs/engine/RESULTADOS_BENCHMARK.md` y `.json`, generados por `npm run bench`, con la semilla base y la configuración.

## 3. API pública (`src/engine/index.ts`)

Firmas orientativas; ajustar a `src/shared/types.ts` si existe.

```ts
createSyntheticClass(seed: number, studentCount: number, config?: SimulationConfig): SyntheticClass
createInitialDiagnosticState(studentId: string, config?: PriorConfig): DiagnosticState
selectNextQuestion(state: DiagnosticState, questionBank: QuestionBank): QuestionSelection | null
submitAnswer(state: DiagnosticState, questionId: string, answer: AnswerValue, questionBank: QuestionBank): Result<DiagnosticState, AnswerError>
getClassDiagnostic(studentStates: DiagnosticState[], knowledgeGraph: KnowledgeGraph, config?: ClassDiagnosticConfig): ClassDiagnostic
rankInterventions(classDiagnostic: ClassDiagnostic, availableMinutes: number, config?: InterventionConfig): InterventionRanking
runBenchmark(config: BenchmarkConfig): BenchmarkReport
simulatePostIntervention(classState: SyntheticClass, intervention: InterventionPlan, seed: number, config?: PostInterventionConfig): PostInterventionReport
```

`submitAnswer` necesita el banco para conocer `R_q`, `s_q`, `g_q` y la respuesta correcta; si el integrador prefiere la firma de 3 argumentos, el banco puede ir dentro del estado (decidirlo con él).

## 4. Banco de preguntas

- 30 preguntas (5 por competencia), nivel 1.º–2.º ESO. Formato cerrado: opción múltiple de 4 opciones con distractores basados en errores típicos, o respuesta numérica exacta (entero o fracción irreducible).
- Campos: `id`, `statement`, `primarySkill`, `secondarySkills`, `options`, `correctAnswer`, `difficulty`, `slip`, `guess`, `explanation`, `assumptionNote`.
- Al menos 6 preguntas multicompetencia.
- Un test recalcula con aritmética de fracciones exacta la respuesta de cada pregunta que lo permita y comprueba que coincide; otro comprueba que no hay opciones duplicadas y que la correcta está entre ellas.

## 5. Estructura de carpetas

```
src/engine/       graph.ts, questionBank.ts, bayes.ts, entropy.ts, selection.ts,
                  classDiagnostic.ts, interventions.ts, types.ts, index.ts
src/simulation/   rng.ts, syntheticClass.ts, responder.ts, postIntervention.ts
src/benchmarks/   methods.ts, metrics.ts, stats.ts, runBenchmark.ts
tests/engine|simulation|benchmarks/  *.test.ts
docs/engine/      MATEMATICAS.md, API.md, INTEGRACION_REACT.md, LIMITACIONES.md,
                  RESULTADOS_BENCHMARK.md, PROPUESTA_TIPOS.md
scripts/          bench.ts
```

## 6. Tests obligatorios

Actualización bayesiana (caso calculado a mano), entropía e EIG (valores conocidos, EIG ≥ 0, EIG = 0 si la pregunta no informa), no repetición, reproducibilidad con semilla, validación de respuestas (id inexistente, repetida, opción inválida), integridad del grafo (acíclico, ids estables, detecta ciclo inyectado), ordenación de intervenciones, respeto del presupuesto de tiempo (incluido presupuesto 0), datos vacíos (clase vacía, banco vacío), probabilidades extremas (0, 1, 1e-12) sin NaN, ausencia de `Math.random`, el motor no recibe el estado real.
