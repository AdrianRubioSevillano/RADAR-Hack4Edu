# CLAUDE.md — RADAR · Motor algorítmico (Hack4Edu 2026)

Este archivo es la especificación que manda. Si un prompt contradice este archivo, para y pregunta.

## 0. Contexto y reparto

- Equipo de tres estudiantes de 4.º de Ingeniería Informática (UPSA). Hackatón Hack4Edu 2026.
- RADAR: plataforma de diagnóstico y optimización del aprendizaje colectivo.
- **Tu ámbito (motor algorítmico):** `src/engine/`, `src/simulation/`, `src/benchmarks/`, `docs/engine/`, `scripts/` (solo scripts del motor).
- **Fuera de tu ámbito (no tocar):** pantallas y componentes React, estilos, `src/shared/types.ts`, configuración de Vite salvo lo mínimo para Vitest (y avisando). La configuración mínima de TypeScript y Vitest de la Fase 1 sigue §8.
- Si necesitas un cambio en `src/shared/types.ts`: **no lo hagas**. Escribe la propuesta en `docs/engine/PROPUESTA_TIPOS.md` (diff exacto + motivo) y avisa en tu respuesta.
- Si `src/shared/types.ts` no existe todavía: define los tipos del motor en `src/engine/types.ts`, expórtalos desde `src/engine/index.ts` y deja en `docs/engine/PROPUESTA_TIPOS.md` lo que debería pasar a ser compartido.

### Actualización de ámbito: frontend e integración

Autorizado por el equipo el 4 de noviembre de 2026. Prevalece sobre las restricciones anteriores de esta sección y de la regla 5, solo para la aplicación:

- Se pueden modificar pantallas, componentes, estilos y configuración de Vite (`src/*.tsx`, `src/components`, `src/screens`, `src/services`, `tests/app`, `docs/app`).
- Se admiten las dependencias de la aplicación: React, React Flow, Recharts, Tailwind, las fuentes y `axe-core` como desarrollo.
- **Sigue vigente sin cambios:** todas las reglas matemáticas de §2, y las reglas de §1 aplicadas a `src/engine`, `src/simulation` y `src/benchmarks`. `src/engine`, `src/simulation` y `src/benchmarks` no se modifican salvo incompatibilidad demostrada y documentada.

## 1. Reglas de trabajo (obligatorias)

1. TypeScript con `strict: true`. Prohibido `any` (usa `unknown` y estrecha). Sin `// @ts-ignore`.
2. Funciones puras: ninguna función pública muta su entrada. Devuelve estado nuevo.
3. **Prohibido `Math.random()`** en `src/engine`, `src/simulation` y `src/benchmarks`. Toda aleatoriedad usa el PRNG con semilla de `src/simulation/rng.ts` (p. ej. mulberry32). Un test lo comprueba con búsqueda en el código.
4. Sin llamadas a APIs externas ni a modelos de IA. Sin backend.
5. Dependencias: solo las de desarrollo `vitest`, `typescript` y `@types/node`. Si crees que una librería matemática aporta valor, propónla antes de instalarla.
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
- Orden topológico determinista: Kahn, eligiendo en cada paso el menor `id` lexicográfico entre todos los nodos disponibles. Resultado: `OPS, FRA, NEG, JER, ALG, ECU`.
- `ancestors` y `descendants` devuelven ids únicos en ese orden topológico.
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
- **Prior por defecto:** producto de marginales independientes `p0_k` (configurables; por defecto 0.5; se admiten valores finitos en `[0,1]`, incluidos 0 y 1 exactos). Opción desactivada por defecto: prior “compatible con prerrequisitos”, que multiplica por `ε` los estados incompatibles (los que dominan una competencia sin dominar sus prerrequisitos) y renormaliza. `ε` es finito en `(0,1]` (SUPUESTO configurable) y se aplica una sola vez por estado, aunque tenga varias violaciones; `ε = 1` equivale al prior independiente. Activarla exige pasar `knowledgeGraph`.
- **Actualización:** `π'(α) ∝ π(α) · P(Y_q = r_q | α)`, renormalizando. Al ser exacta sobre la conjunta, una pregunta multicompetencia no cuenta dos veces la evidencia.
- Marginal: `P(dominio_k) = Σ_α π(α)·α_k`.
- Incertidumbre: entropía binaria de cada marginal `H_b(p_k)` en bits, y entropía de la conjunta `H(π)`.
- Estabilidad numérica: sin acotación global, las probabilidades válidas no se modifican. `0·log 0 = 0`, renormalizar tras cada paso; ante una normalización inválida o una masa total por debajo de `1e-300`, lanzar error tipado (no devolver NaN). El clipping de log‑loss (§2.9) nunca se aplica al posterior.

### 2.4 Selección activa: ganancia de información esperada (EIG)

- `EIG(q) = I(α; Y_q) = H_b(P(Y_q = 1)) − Σ_α π(α) · H_b(P(Y_q = 1 | α))`, con `P(Y_q = 1) = Σ_α π(α)·P(Y_q = 1 | α)`. Cálculo exacto, en bits.
- Candidatas: preguntas no respondidas (nunca se repite una pregunta).
- Selección determinista: se toma el máximo global de EIG y, entre las preguntas a distancia absoluta `≤ 1e-12` de ese máximo, la de menor `id` lexicográfico.
- Explicación inspeccionable para cada candidata: `P(Y_q = 1)`, `EIG`, marginales esperadas si acierta / si falla, y la reducción esperada de la entropía de cada competencia.
- Sin preguntas disponibles → devuelve `null` (no lanza).

### 2.5 Diagnóstico de clase

Por competencia: media de `P(dominio)`, nº esperado que necesita refuerzo `Σ_i (1 − p_ik)`, nº con `p_ik < τ` (τ = 0.5 configurable), nº con estimación incierta (`0.3 < p < 0.7`, configurable), entropía media.
Por alumno y competencia: `P(prerrequisitos dominados)`, probabilidad conjunta de dominar **todos los ancestros** de la competencia, calculada **exactamente desde su conjunta**; vale 1 si no tiene ancestros.

Tolerancia de clasificación: las clasificaciones y avisos por umbral de §2.5 y §2.6 y la detección de §2.9 usan una tolerancia absoluta de `1e-12`. Un valor a esa distancia o menos de un umbral se considera igual a él, exclusivamente para clasificar: `p < τ` se evalúa como `p < τ − 1e-12`. No cambia probabilidades, medias, posteriores ni entropías. No es incertidumbre estadística ni debe confundirse con las tolerancias de otros cálculos.

Clase vacía: `getClassDiagnostic([], ...)` no evalúa `0/0`. Devuelve `studentCount = 0`, sumas y contadores a 0, medias, proporciones, entropías medias y preparación agregada a `null`, y un indicador explícito de datos insuficientes. Los tipos afectados (esos campos como `number | null` y el indicador) se definen en `src/engine/types.ts` y se proponen en `docs/engine/PROPUESTA_TIPOS.md`, sin tocar `src/shared/types.ts`.

### 2.6 Recomendación de intervenciones (parte principal)

Una intervención por competencia `k`, con duración `d_k` (minutos, SUPUESTO configurable) e importancia `imp_k ∈ [0,1]` (configurable). Por defecto, `d_k = 15` e `imp_k = 1` para cada competencia, SUPUESTOS no calibrados.

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
- Validación: pesos finitos, no negativos y con suma 1 (`|Σ w − 1| ≤ 1e-9`, tolerancia numérica); `λ` finito y `≥ 0`; `t_ref` y duraciones finitos y `> 0`; presupuesto `T` finito y `≥ 0`.
- La salida incluye cada componente, su peso, el beneficio, el coste, el valor neto y `valor_k / d_k`.

Ranking por `valor_k` neto descendente; `valor_k / d_k` se muestra como información. Incluye los valores no positivos, que el plan puede excluir. En cada iteración:
1. Obtener el máximo entre las candidatas restantes.
2. Agrupar las que están a distancia absoluta `≤ 1e-12` de ese máximo.
3. Añadir al ranking todo el grupo, ordenado por menor duración y después `id`.
4. Eliminar ese grupo y continuar con las candidatas restantes.

No se selecciona un solo elemento para recalcular el grupo, ni se usan comparadores aproximados por pares.

Avisos explicables (no ocultos en la puntuación):
- Si `preparacion_k` es menor que el umbral de preparación baja (0.5, SUPUESTO configurable, independiente del umbral diagnóstico τ): “conviene reforzar antes el prerrequisito X”, donde X es el ancestro de `k` con menor dominio medio; desempate por `id`.
- Si `confianza_k` es menor que el umbral de confianza baja (0.5, SUPUESTO configurable): “la estimación es incierta; considerar más evaluación antes de intervenir”.
- Ambos avisos usan la tolerancia de clasificación de §2.5.

Plan con presupuesto de tiempo `T`:
- Selección discreta de un subconjunto `S` con `Σ d_k ≤ T` que maximiza `valor(S)`. El plan vacío es válido, con `valor(∅) = 0`.
- Con 6 intervenciones hay 64 subconjuntos, incluido el vacío: **enumeración exacta** de los que respetan el presupuesto. El plan no es un prefijo del ranking.
- Desempate respecto al máximo global: entre los subconjuntos a distancia absoluta `≤ 1e-12` de ese máximo, menor duración total y después la lista ordenada de ids.
- El coste permite descartar incorporaciones que no compensan el tiempo. No obliga a dejar presupuesto sin usar: puede agotarse si compensa.
- Tiempo (decisión temporal del MVP): la API pública usa minutos con resolución de un segundo. Duraciones y presupuesto se convierten a segundos enteros seguros antes de sumar, comparar con el presupuesto y desempatar por duración. Se acepta el redondeo de conversión solo si `minutos·60` está a `≤ 1e-9` de un entero; lo demás se rechaza con error tipado, sin redondear en silencio. Las duraciones convertidas son estrictamente positivas y el presupuesto puede ser 0. Las sumas en segundos no pueden desbordar. `totalMinutes` es la suma en segundos dividida entre 60.
- Clase vacía: ranking y plan vacíos; duración, beneficio, coste y valor neto a 0; aviso “No hay alumnos para calcular recomendaciones”. Es una salida válida sin evidencia, no un fallo.
- Solo priors (`evidenceStatus = priorsOnly`): el ranking puede mostrarse como cálculo hipotético basado solo en priors, pero el plan queda vacío con aviso de que hay que recoger respuestas. No se presentan recomendaciones respaldadas por observaciones cuando no existe ninguna. En `mixed` se mantienen explícitos los avisos y la proporción de alumnos sin respuestas.
- Todo esto es una **heurística de priorización**, no una estimación de efecto causal ni una mejora educativa demostrada. Debe decirlo la documentación y el campo `disclaimer` de la salida.

### 2.6.1 Comparación de planes y necesidad pendiente (Fase 4C)

Ampliación de §2.6: no la contradice ni la sustituye. `compareInterventionPlans` compara dos planes y muestra qué necesidades quedan pendientes por alumno y competencia:

- **Plan A:** el plan colectivo de `rankInterventions`, sin cambiar su criterio.
- **Plan B:** un plan que reduce la mayor necesidad estimada pendiente de un alumno.

Programar una competencia **no** significa que se haya aprendido ni que la intervención sea eficaz.

Para el alumno `i`, la competencia `k` y un conjunto `S` de competencias programadas, con `w_k` la importancia efectiva de §2.6 y `D = Σ_k w_k`:

```
n_ik           = 1 − masteryProbability_ik
baseline_i     = Σ_k (w_k · n_ik) / D
pending_i(S)   = Σ_{k ∉ S} (w_k · n_ik) / D
scheduled_i(S) = baseline_i − pending_i(S)
```

- Son índices de necesidad estimada según el modelo, no probabilidades de mejora.
- Solo cuentan las competencias directamente programadas. No se asume que sus descendientes estén resueltos.
- No se reutiliza ni se renombra `coverage` de §2.6, que tiene otro significado.
- No se muestran “necesidades resueltas” ni “alumnos beneficiados”.

Plan B: enumeración de los mismos 64 subconjuntos, con el presupuesto y los segundos enteros de §2.6. Se elige, en este orden:

1. Menor máximo de `pending_i` entre alumnos.
2. Menor media de `pending_i`.
3. Mayor valor neto de §2.6.
4. Menor duración.
5. Lista ordenada de ids.

- En los tres primeros criterios se filtra respecto al mejor global de las candidatas restantes, con tolerancia absoluta `1e-12`. No se usan comparadores aproximados por pares.
- Los dos planes pueden coincidir: no se fuerza una diferencia.
- Es una heurística distinta: el presupuesto limita el tiempo y el coste de §2.6 solo interviene en el tercer criterio. No se afirma superioridad ni equidad educativa demostrada.

Casos:

- `D = 0`: índices normalizados `null` con aviso de importancias nulas, plan B vacío sin afirmar ausencia de necesidad, y plan A con su comportamiento de §2.6.
- Clase vacía: planes vacíos, alumnos vacíos e índices agregados `null`.
- `priorsOnly`: ambos planes vacíos y análisis identificado como hipotético.
- `mixed`: se incluyen todos los alumnos y se conservan los avisos de estimaciones basadas solo en priors.

Salida: por alumno, `baseline`, `scheduled`, `pending` y desglose por competencia; por plan, media y máximo pendientes; además evidencia, configuración efectiva, avisos y `disclaimer`. No se generan ejercicios: estos resultados permitirán al servicio de aplicación elegir práctica individual después.

Validación antes de usar `students`:

- Ids únicos, `responseCount` y las seis competencias únicas.
- Probabilidades, entropías y preparación finitas en rango, y entropía coherente con la probabilidad.
- Totales, medias y recuentos reconciliados con el agregado dentro de tolerancias documentadas.
- El detalle manipulado o incoherente se rechaza con error tipado.
- No se intenta demostrar que el diagnóstico proceda de respuestas reales ni se reconstruyen posteriores: aquí no se reciben conjuntas.

Se reutilizan la validación, los tiempos y la evaluación de subconjuntos de §2.6 mediante helpers internos, sin duplicar fórmulas ni cambiar el comportamiento público de `rankInterventions`.

### 2.7 Simulador (solo para benchmarks y demo)

- PRNG con semilla. Igual configuración, versión y semilla ⇒ mismos resultados deterministas. Los tiempos y metadatos variables se guardan aparte y se excluyen de las comprobaciones de igualdad.
- Flujos aleatorios separados para población, respuestas, orden aleatorio, intervención y bootstrap. Cambiar el orden de ejecución de los métodos no altera los datos asignados a cada uno.
- Clase por defecto de 30 alumnos con ids ficticios (`S01`…`S30`), en 2–3 grupos con probabilidades de dominio distintas (SUPUESTO). El estado real se genera en orden topológico determinista. Si falta al menos un ancestro de la competencia, su probabilidad de dominio se reduce una sola vez con un factor configurable finito en `[0,1]` (SUPUESTO no calibrado); sin ancestros no hay reducción. Documentar que esto se parece a la estructura del grafo y que el prior del motor, por defecto, NO la usa.
- Decisiones de la Fase 5A (población sintética):
  - `seed` es un entero uint32, incluido 0; `studentCount` es un entero seguro no negativo, y la clase vacía es válida. Lo demás se rechaza con error tipado.
  - Ids `S01`, `S02`… `S99`, `S100`…: ampliar la clase no cambia los ids existentes.
  - Grupos por defecto (SUPUESTOS): tres, con probabilidad base de dominio 0.85, 0.60 y 0.35 en cada competencia. Son una configuración de demo, no grupos educativos validados ni estimaciones observadas.
  - Asignación equilibrada determinista: el alumno de índice `i` va al grupo `i mod nº de grupos`.
  - Grupos configurables: al menos uno, con ids únicos y probabilidades explícitas de las seis competencias.
  - Factor reductor por prerrequisitos: 0.5 por defecto, configurable en `[0,1]`, SUPUESTO. Se comprueban todos los ancestros, no solo los prerrequisitos directos, y se aplica una sola vez aunque falten varios.
  - PRNG mulberry32, sin dependencias, con algoritmo y versión documentados. Cada flujo se deriva de la semilla y de una etiqueta.
  - `SyntheticClass` puede contener la verdad privada, solo en tipos de `src/simulation`. Una proyección explícita de alumnos observables entrega únicamente ids y nombres ficticios: sin `α`, grupo generador, probabilidades reales ni otros datos latentes.
  - Se exigen las seis competencias. Sin `Math.random`, reloj, ids aleatorios ni estado global compartido.
- Respuestas generadas con el mismo modelo DINA y los **parámetros reales del simulador**, que pueden diferir de los que asume el motor (escenario de mala especificación).
- El estado real `α` vive solo en `src/simulation`. Única excepción: `src/simulation` puede pasarlo a funciones puras DINA de `src/engine` para calcular probabilidades de respuesta.
  - Esas funciones reciben solo `α`, requisitos y slip/guess. No reciben `SyntheticClass` ni estado global, y no mutan sus entradas.
  - Inicialización diagnóstica, posterior, selección, agregación y recomendaciones nunca reciben verdad simulada. Un test lo comprueba (esas funciones no reciben objetos con `trueMastery`).
  - Enumerar estados `α` hipotéticos dentro de la inferencia está permitido.
- Números aleatorios comunes: se pre‑muestrea un uniforme `u` por (alumno, pregunta, ocasión de medida). Acierto si `u < P(Y_q = 1 | α actual)`.
  - Los métodos comparten los uniformes del pre‑test dentro de cada escenario y réplica, de modo que ven la misma respuesta si hacen la misma pregunta.
  - El post‑test usa otra ocasión, con uniformes independientes del pre‑test y compartidos entre comparaciones equivalentes.
- Decisiones de la Fase 5B (respuestas sintéticas):
  - Tabla privada y serializable de uniformes, preparada antes de ejecutar los métodos diagnósticos, estable por (semilla, ocasión, alumno, pregunta). El nombre del método no forma parte de la clave.
  - Cada par tiene un uniforme de acierto o fallo y otro, separado, para elegir distractor. Las etiquetas de flujo son estructuradas: los ids no se concatenan sin escape.
  - Ids ordenados de forma determinista, con duplicados rechazados y listas vacías admitidas. Añadir alumnos o preguntas, o permutar las entradas, no cambia los uniformes de los pares existentes. La tabla puede cubrir un subconjunto explícito.
  - Consultar o repetir una respuesta no consume aleatoriedad ni modifica la tabla. Se guardan uniformes, no resultados: un cambio futuro de `α` puede cambiar la respuesta con el mismo `u`.
  - `correctProbability` recibe solo `α`, requisitos y slip/guess. `realParameters` permite slip/guess reales distintos de los del ítem, con la misma restricción DINA y sin modificar banco ni motor.
  - Se devuelve exclusivamente un `AnswerValue`. Si acierta: id correcto o respuesta canónica. Si falla en opción múltiple: uno de los distractores, elegido con el segundo uniforme.
  - Si falla en numérica: `0/1`, o `1/1` si `0/1` es la correcta. Es un SUPUESTO simplificado: no reproduce errores reales ni concepciones equivocadas.
  - Son flujos pseudoaleatorios, no independencia estadística demostrada.
  - La validación no regenera la verdad, porque una intervención futura podrá cambiar `α` legítimamente, y el respondedor no llama a funciones de inferencia.

### 2.8 Evaluación posterior a la intervención

- `simulatePostIntervention`: cada alumno del grupo tratado con `α_k = 0` pasa a `α_k = 1` con probabilidad `p_mejora` (SUPUESTO). Si falta al menos un ancestro de `k`, esa probabilidad se reduce una sola vez con un factor configurable finito en `[0,1]` (SUPUESTO no calibrado); sin ancestros no hay reducción.
- Con varias competencias, las probabilidades de mejora se calculan desde el estado real anterior al plan y los cambios se aplican a la vez. No hay cascada instantánea entre competencias del mismo plan.
- Uniformes estables por alumno y competencia, independientes del orden de recorrido. En este simulador no se pierde dominio ya adquirido.
- Plan vacío: no cambia `α` real y el efecto real simulado es cero. Puede haber variación observada si existen preguntas disponibles.
- Opción de grupo de control aleatorio (semilla) sin intervención.
- Se conserva el diagnóstico de pre‑test. Para el post‑test se crea un diagnóstico separado desde el mismo prior inicial, sin pasar verdad real. No se continúa el posterior del pre‑test, porque el modelo diagnóstico no incorpora transiciones temporales.
- Alcance del post‑test: se fija antes de comparar planes y no depende de las competencias intervenidas. `assessmentSkills` (por defecto, las seis del grafo) y `questionBudgetPerStudent` (entero positivo, obligatorio) son iguales para tratamiento, control y planes comparados, incluido el plan vacío.
- Preguntas elegibles: `primarySkill` pertenece a `assessmentSkills` y la pregunta no se usó en el pre‑test de ese alumno. El post‑test es una ocasión de medida distinta (§2.7).
- Selección fija y determinista: orden del método A (§2.9), filtrando las elegibles y tomando hasta el presupuesto. No se usa EIG en el post‑test. Ese orden se define una sola vez en `fixedQuestionOrder` (§3).
- La elegibilidad por alumno y la selección se fijan desde su historial de pre‑test y se mantienen iguales entre las ramas de tratamiento y control, o entre planes, que partan de ese mismo alumno e historial.
  - Si hay menos preguntas que presupuesto, se usan las disponibles y se informa de la cobertura y del presupuesto solicitado y efectivo. No se reutilizan ni se inventan ítems.
  - Sin preguntas disponibles, los resultados observados y los cambios estimados correspondientes son `null`, con aviso. El efecto real simulado se informa por separado.
  - Tratamiento y control usan la misma política. Una cobertura desigual no se presenta como evidencia concluyente.
  - Se advierte de que usar todo el banco en el pre‑test impide un post‑test con ítems nuevos.
- Decisiones de la Fase 6A (intervención sintética):
  - `improvementProbability = 0.35` y `prerequisiteImprovementFactor = 0.5` por defecto, SUPUESTOS configurables en `[0,1]`.
  - `controlFraction = 0` por defecto, configurable en `[0,1]`. Número de controles: con `x = studentCount · controlFraction`, `round(x)` si `|x − round(x)| ≤ 1e-12` y `floor(x)` en otro caso. Es una tolerancia numérica sobre el recuento, no incertidumbre estadística, y el resultado queda entre 0 y `studentCount`. El control no recibe intervención; los grupos vacíos son posibles y se identifican.
  - La semilla de intervención es independiente de la de población.
  - Asignación: cada alumno recibe un valor estable de un flujo etiquetado de control; se ordena por ese valor, se desempata por id y los primeros son control. No depende del orden de entrada de los alumnos ni del plan.
  - Mejora: un uniforme estable por alumno y competencia, en un flujo separado, con etiquetas estructuradas que no incluyen el nombre del plan ni del método. Dos planes sobre la misma población y semilla comparten asignación y uniformes de las competencias comunes. No se consumen ni alteran las tablas de respuestas.
  - Las competencias seleccionadas son las del plan. `benefit`, `netValue` y demás valores del plan no se usan como probabilidades de mejora.
  - `postClass` conserva ids, grupos generadores, `skillOrder` y semilla de población. Reconstruirlo requiere también el plan, el estado anterior y la semilla y configuración de intervención: no basta con regenerar desde la semilla de población.
  - Los cambios reales simulados se informan aparte de cualquier observación y no se presentan como aprendizaje observado.
- Concreciones de la Fase 6B (`simulatePostIntervention`):
  - `config` combina las opciones de la Fase 6A con `questionBudgetPerStudent`, `assessmentSkills` (lista no vacía, única y válida) y `realParametersByQuestion` opcional. Los parámetros reales solo afectan al respondedor, nunca al motor, y se validan sus ids y valores.
  - Flujo: validar la correspondencia exacta entre alumnos y `pretestStates`; validar estados e historiales contra el banco; normalizar `priorConfig` con la inicialización existente y comprobar que coincide con el prior efectivo de cada pre‑test, sin comparar posterior con prior.
  - Las preguntas del post‑test se fijan antes de aplicar el plan. La selección no depende del plan, de tratamiento o control ni de resultados posteriores.
  - La intervención reutiliza `applySyntheticIntervention`. Los uniformes del post‑test usan la semilla de población y la ocasión fija `posttest`; `seed` se reserva para intervención y control.
  - Las respuestas salen de `simulateResponse` sobre `postClass`, y cada alumno recibe un diagnóstico nuevo desde el mismo prior inicial, con `submitAnswer`. No se modifican `pretestStates`.
  - Sin preguntas nuevas, los resultados del post‑test y los cambios estimados son `null`, con aviso, y el alumno no aparece en `postStates`: el prior no se presenta como resultado. Clase y grupos vacíos dan `null`, sin NaN.
  - Capa observada: aciertos, preguntas y proporción pre y post. El pre usa las respuestas cuya competencia principal está en `assessmentSkills`. Sin preguntas en un periodo, proporción `null`; cambio solo con ambas proporciones, etiquetado “cambio descriptivo no equiparado”.
  - Capa estimada: media de marginales sobre `assessmentSkills`, antes y después. Se informa si el pre‑test solo tenía prior. Cambio `null` sin ninguna respuesta de pre‑test o sin post‑test. Las diferencias no se interpretan como aprendizaje confirmado.
  - Capa real simulada: media de `α` sobre `assessmentSkills`, antes y después, y su cambio. Disponible aunque no queden preguntas, con la etiqueta de que solo es conocible en esta simulación.
  - Agregación por grupo: solo alumnos con pareja válida para esa métrica. Media de cambios individuales, con número de parejas y exclusiones. Diferencia en diferencias = cambio medio de tratamiento − cambio medio de control, solo si ambos grupos tienen parejas válidas; si no, `null`. `null` nunca se convierte en 0.
  - La salida conserva por separado `postStates`, procedencia, configuración efectiva, asignación, avisos, composición y cobertura. Los campos de verdad simulada no se mezclan con los estados diagnósticos.
- Las diferencias brutas de aciertos entre pre‑test y post‑test con ítems distintos no son ganancias equivalentes. Se informa de la composición y la cobertura, y el cambio se etiqueta como descriptivo no equiparado. La simulación no demuestra eficacia educativa real.
- La salida separa SIEMPRE: (a) cambio en resultados observados, (b) cambio en estimaciones del motor, (c) efecto real simulado (solo conocible en simulación), (d) nota de que en alumnos reales una comparación antes/después no demuestra causalidad; con control aleatorio se muestra la diferencia en diferencias como estimación en simulación.

### 2.9 Benchmark

- Métodos: **A** fijo (orden de preguntas decidido de antemano y mismo para todos los alumnos: rondas por competencia principal en orden topológico; dentro de cada competencia, dificultad 2, 1, 3 y después `id`; cada pregunta aparece una sola vez), **B** adaptativo EIG, **C** aleatorio con semilla (control de cordura: permutación sin reemplazo por alumno, con flujo sembrado separado y estable; no un único orden para toda la clase; no altera los uniformes comunes de respuesta).
- Mismo presupuesto de preguntas para todos. Presupuestos: 4, 6, 9, 12 y “todas”.
- Métricas por alumno y competencia vs estado real: MAE, Brier, log‑loss (logaritmo natural, en nats; clipping `ε_clip = 1e-12`, SUPUESTO, exclusivo de esta evaluación); detección de “dificultad” (`α_k = 0`, clase positiva) con umbral τ y la tolerancia de clasificación de §2.5: precisión, exhaustividad (recall), F1, exactitud; preguntas usadas; tiempo de cálculo por selección (ms).
- La detección agrega los pares alumno‑competencia dentro de cada semilla:
  - Precisión `= TP/(TP+FP)`, `null` si `TP+FP = 0`.
  - Recall `= TP/(TP+FN)`, `null` si `TP+FN = 0`.
  - F1 `= 2TP/(2TP+FP+FN)`, `null` solo si su denominador es 0.
  - Exactitud: `null` si no hay observaciones.
- Concreciones de la Fase 7A (métricas): `computeDiagnosticMetrics(states, syntheticClass, config?): DiagnosticMetrics`, con `config.tau` finito en `[0,1]` y 0.5 por defecto.
  - Exige correspondencia exacta y sin duplicados entre estados y alumnos, y reutiliza los validadores de estados, conjuntas y clase. La verdad simulada solo se usa para evaluar: nunca se pasa a funciones diagnósticas.
  - `p` es la marginal normalizada del motor, sin otra inferencia. Por par: `|p − α|`; Brier binario `(p − α)²`, sin multiplicar por dos; log‑loss `−[α·ln p' + (1−α)·ln(1−p')]`, con `p'` limitado a `[1e-12, 1−1e-12]` solo para esta métrica. Las probabilidades originales no se modifican.
  - Clase positiva: `α = 0`. Predicción de dificultad: `isBelowThreshold(p, τ)`.
  - Las métricas globales se agregan desde los pares y los recuentos, sin promediar F1 individuales. Se devuelven además desgloses por alumno y competencia, TP, FP, TN y FN, número de alumnos y pares, preguntas usadas por alumno, total y media, configuración efectiva, definiciones y advertencia sobre datos sintéticos.
  - MAE, Brier, log‑loss y media de preguntas son `null` sin observaciones. Recuentos y total de preguntas son 0 con la clase vacía. `null` nunca se convierte en 0.
  - Los tiempos de selección se miden en el ejecutor, no aquí.
- ≥ 30 semillas; cada semilla es una réplica. Media, desviación típica muestral, IC 95 % percentil y diferencia **emparejada** B − A por semilla, con nº de semillas donde B es peor.
  - IC por bootstrap con semilla y 2000 remuestreos (SUPUESTO) sobre semillas completas, no sobre pares alumno‑competencia independientes.
  - Se informa de cuántos valores válidos hay; `null` no se convierte en 0. Las comparaciones emparejadas usan solo parejas válidas.
  - Desviación típica `null` con menos de dos semillas válidas. Media, IC y diferencias sin datos válidos: `null` con indicación explícita.
- Concreciones de la Fase 7B (estadística entre semillas):
  - Cada observación identifica su semilla y contiene un número finito o `null`. Se rechazan semillas duplicadas, NaN, Infinity y configuraciones inválidas. Se ordena por semilla: permutar la entrada no cambia el resultado.
  - Bootstrap de medias: 2000 remuestreos por defecto, entero positivo configurable, y semilla explícita. Usa `createStream` con `STREAMS.bootstrap` y una etiqueta con un identificador explícito de serie, de modo que añadir otras métricas no cambia las existentes. La unidad remuestreada es una semilla completa, y cada remuestra tiene `n` observaciones con reemplazo.
  - Percentiles 2.5 y 97.5 por interpolación lineal: posición `(m−1)·q` en los `m` valores ordenados.
  - Con un solo valor válido: media disponible, desviación `null` e intervalo degenerado, con advertencia de que no informa sobre variabilidad.
  - Comparación: se empareja por semilla, solo con semillas presentes en ambos métodos y con ambos valores válidos. Primero se calcula cada `B − A` y después se resumen esas diferencias; no se restan medias de conjuntos distintos. Se informa de las exclusiones con su motivo.
  - Se cuenta dónde B mejora, empata o empeora, con dirección de mejora explícita y tolerancia de empate configurable, `1e-12` por defecto. La tolerancia solo clasifica: no modifica diferencias ni estadísticas.
  - El intervalo no es prueba de eficacia educativa ni garantía de superioridad.
- Concreciones de la Fase 7C (ejecución de una réplica): `runDiagnosticMethod(input: DiagnosticMethodInput): DiagnosticMethodRun`.
  - La entrada recibe método, clase, banco, grafo, prior, tabla de uniformes, presupuestos, semilla del orden aleatorio y, opcionales, medición de tiempos, parámetros reales por pregunta y configuración de métricas. El ejecutor creará una sola clase y una sola tabla por réplica y las compartirá entre métodos.
  - A usa `fixedQuestionOrder`; B, `selectNextQuestion` en cada paso; C, Fisher–Yates por alumno sobre los ids ordenados, con `createStream`, `STREAMS.randomOrder` y una etiqueta con el id del alumno, sin presupuesto ni resultados.
  - Cada alumno sigue una única trayectoria hasta el máximo presupuesto: los menores son prefijos. `all` consume todas las preguntas, sin parada anticipada. Un presupuesto mayor que el banco usa las disponibles y distingue solicitado y efectivo.
  - Presupuestos: enteros positivos o `all`, sin duplicados, en orden canónico: números ascendentes y después `all`.
  - La tabla debe ser compatible con la clase, tener ocasión `pretest` y cubrir todos los alumnos y preguntas. Los parámetros reales solo los recibe `simulateResponse`. Un error de `submitAnswer` no se ignora.
  - Salida separada: resultados deterministas, sin fechas ni tiempos, y mediciones de tiempo, `null` si no se piden. Con tiempos, `performance.now` mide por separado la preparación del orden y la selección de cada pregunta; no son una comparación definitiva de rendimiento.
- Escenarios: (1) bien especificado; (2) mala especificación (slip/guess reales distintos de los asumidos); (3) presupuesto = todas las preguntas; (4) clase homogénea. Se reporta todo, también donde B empata o pierde.
- Escenario 3: mismos prior, banco y respuestas comunes, sin parada anticipada; todos los métodos consumen todas las preguntas. Se comparan posteriores y métricas deterministas con tolerancia absoluta `1e-9`, excluyendo los tiempos.
- Concreciones de la Fase 7D (experimento): `runBenchmark(config: BenchmarkConfig): BenchmarkReport`.
  - Por defecto: 30 alumnos, 30 semillas, presupuestos `[4, 6, 9, 12, "all"]`, métodos A, B y C, prior por defecto, 2000 remuestreos y semilla base 2026, fijada antes de ver resultados.
  - Semillas de réplica: `deriveStreamSeed(base, "benchmark/replica/<i>")`, saltando repetidas, de modo que son únicas y las primeras no cambian al pedir más. Son las mismas en todos los escenarios. Semilla del orden aleatorio: `deriveStreamSeed(réplica, "randomOrder")`. Semilla de bootstrap: `deriveStreamSeed(base, "bootstrap")`.
  - Por escenario y réplica se crea una sola clase y una sola tabla `pretest`, compartidas entre métodos, con banco asumido, prior y presupuestos idénticos. El método no forma parte de las etiquetas de población ni de respuestas.
  - Bien especificado (`wellSpecified`): población por defecto y parámetros reales iguales a los del banco.
  - Mala especificación (`misspecified`): misma población y semillas, con slip real 0.25 y guess real 0.20 en todos los ítems. SUPUESTOS, no valores calibrados. El banco asumido no cambia.
  - Población homogénea (`homogeneous`): un único grupo con probabilidad base 0.6 en cada competencia y factor 0.5. Significa misma distribución generadora, no que todos los alumnos tengan el mismo conocimiento.
  - Todas las preguntas: comprobación explícita a partir del presupuesto `all` de cada escenario, sin volver a ejecutar una réplica idéntica. Con tolerancia absoluta `1e-9` coinciden posteriores y métricas de los métodos; si falla se lanza un error. Por eso `all` es obligatorio.
  - Se guardan por réplica las métricas globales de cada método y presupuesto, suficientes para recalcular los resúmenes. Los estados no se guardan: ocuparían decenas de megabytes y se regeneran con la configuración.
  - Series: `<escenario>/budget=<b>/method=<m>/<métrica>` y `<escenario>/budget=<b>/B-A/<métrica>`. Menor es mejor en MAE, Brier y log‑loss; mayor es mejor en precisión, recall, F1 y exactitud.
  - Una ejecución que no usa la configuración por defecto se marca como prueba (`kind: "test"`). El informe experimental procede de `kind: "full"`.
  - `npm run bench` escribe además `docs/engine/RESULTADOS_BENCHMARK_TIEMPOS.json`, con tiempos y metadatos variables. `npm run bench -- --check` regenera el bloque determinista y lo compara, sin escribir. Las importaciones de Node y las escrituras viven en `scripts/bench.ts`.
- Salida: `docs/engine/RESULTADOS_BENCHMARK.md` y `.json`, generados por `npm run bench`, con la semilla base y la configuración. Tiempos y metadatos variables van separados de los resultados deterministas.

## 3. API pública por módulo

Firmas orientativas; ajustar a `src/shared/types.ts` si existe, sin modificar ese archivo (§0).

Separación de módulos: `src/engine` no importa `src/simulation` ni `src/benchmarks`. `src/simulation` puede reutilizar funciones puras DINA de `src/engine`, también con el estado real, en los términos de §2.7.

```ts
// src/engine/index.ts
createInitialDiagnosticState(studentId: string, config?: PriorConfig, knowledgeGraph?: KnowledgeGraph): DiagnosticState
selectNextQuestion(state: DiagnosticState, questionBank: QuestionBank): QuestionSelection | null
submitAnswer(state: DiagnosticState, questionId: string, answer: AnswerValue, questionBank: QuestionBank): Result<DiagnosticState, AnswerError>
getClassDiagnostic(studentStates: DiagnosticState[], knowledgeGraph: KnowledgeGraph, config?: ClassDiagnosticConfig): ClassDiagnostic
rankInterventions(classDiagnostic: ClassDiagnostic, knowledgeGraph: KnowledgeGraph, availableMinutes: number, config?: InterventionConfig): InterventionRanking
compareInterventionPlans(classDiagnostic: ClassDiagnostic, knowledgeGraph: KnowledgeGraph, availableMinutes: number, config?: InterventionConfig): InterventionPlanComparison
fixedQuestionOrder(questionBank: QuestionBank, knowledgeGraph: KnowledgeGraph): readonly string[]

// src/simulation/index.ts
createSyntheticClass(seed: number, studentCount: number, knowledgeGraph: KnowledgeGraph, config?: SimulationConfig): SyntheticClass
simulatePostIntervention(input: PostInterventionInput): PostInterventionReport

// src/benchmarks/index.ts
runBenchmark(config: BenchmarkConfig): BenchmarkReport
```

```ts
// Tipos asociados de src/simulation
interface PostInterventionConfig {
  questionBudgetPerStudent: number;       // entero positivo, obligatorio
  assessmentSkills?: readonly SkillId[];  // por defecto, las seis del grafo
  // más los parámetros de §2.8: p_mejora, factor reductor y grupo de control
}

interface PostInterventionInput {
  classState: SyntheticClass;
  intervention: InterventionPlan;
  seed: number;
  pretestStates: readonly DiagnosticState[];
  questionBank: QuestionBank;
  knowledgeGraph: KnowledgeGraph;
  priorConfig: PriorConfig;
  config: PostInterventionConfig;
}
```

- `submitAnswer` recibe el banco para conocer `R_q`, `s_q`, `g_q` y la respuesta correcta.
- `knowledgeGraph` es opcional en `createInitialDiagnosticState`, salvo si se activa el prior compatible con prerrequisitos, que lo exige.
- `rankInterventions` recibe `knowledgeGraph` de forma explícita, en segunda posición; el grafo no se inserta dentro de `ClassDiagnostic`.
- `fixedQuestionOrder` es el orden del método A (§2.9): función pura del banco y del grafo, en `src/engine/selection.ts`, compartida por `src/simulation` y `src/benchmarks`.
- `createSyntheticClass` recibe `knowledgeGraph` de forma obligatoria.
- `simulatePostIntervention` recibe un único objeto de entrada y no usa estado global para obtener estos datos.
  - Las preguntas usadas se obtienen del historial de `pretestStates`, sin otra lista que pueda contradecirlo.
  - `priorConfig` debe corresponder al prior inicial usado en esos diagnósticos.
  - Se valida la correspondencia de alumnos, ids y preguntas; las inconsistencias se rechazan con error tipado.

## 4. Banco de preguntas

- 30 preguntas (5 por competencia), nivel 1.º–2.º ESO. Formato cerrado: opción múltiple de 4 opciones con distractores basados en errores típicos, o respuesta numérica exacta (`correctAnswer` en forma canónica).
- Campos: `id`, `statement`, `primarySkill`, `secondarySkills`, `options`, `correctAnswer`, `difficulty`, `slip`, `guess`, `explanation`, `assumptionNote`.
- `difficulty` es ordinal `1 | 2 | 3`; no es una calibración psicométrica.
- Respuesta numérica: `guess` explícito por pregunta (SUPUESTO no calibrado). Gramática de la entrada textual:
  - Se recortan los espacios exteriores.
  - Se acepta un entero con signo opcional o una fracción de dos enteros con signo opcional.
  - Se rechazan espacios interiores, decimales, notación científica, expresiones y denominador cero.
  - Forma canónica: cadena `numerador/denominador`, fracción reducida por MCD y denominador positivo. El entero cinco es `5/1` y el cero, `0/1`.
  - Comparación racional exacta, sin `eval` ni tolerancia flotante; `BigInt` interno permitido.
  - Los datos públicos se serializan mediante cadenas, sin `BigInt` en JSON.
  - `correctAnswer` es canónica y la entrada del alumno admite enteros y fracciones equivalentes según esta gramática.
- Las respuestas de opción múltiple conservan ids de opción; la forma racional canónica no los sustituye.
- Al menos 6 preguntas multicompetencia.
- Un test recalcula con aritmética de fracciones exacta la respuesta de cada pregunta que lo permita y comprueba que coincide; otro comprueba que no hay opciones duplicadas (las opciones racionalmente equivalentes cuentan como duplicadas) y que la correcta está entre ellas.

## 5. Estructura de carpetas

```
src/engine/       graph.ts, questionBank.ts, bayes.ts, entropy.ts, selection.ts,
                  classDiagnostic.ts, interventions.ts, planComparison.ts, types.ts, index.ts
src/simulation/   rng.ts, syntheticClass.ts, responder.ts, postIntervention.ts, postInterventionReport.ts,
                  types.ts, index.ts
src/benchmarks/   methods.ts, metrics.ts, stats.ts, runBenchmark.ts, report.ts, types.ts, index.ts
tests/engine|simulation|benchmarks/  *.test.ts
docs/engine/      MATEMATICAS.md, API.md, INTEGRACION_REACT.md, LIMITACIONES.md,
                  RESULTADOS_BENCHMARK.md, PROPUESTA_TIPOS.md
scripts/          bench.ts
```

## 6. Tests obligatorios

Actualización bayesiana (caso calculado a mano), entropía e EIG (valores conocidos, EIG ≥ 0, EIG = 0 si la pregunta no informa, empates respecto al máximo global), prior compatible (`ε` válido e inválido, una sola aplicación por estado, `ε = 1` igual al independiente), no repetición, reproducibilidad con semilla (excluyendo tiempos y metadatos variables), independencia del orden de ejecución de los métodos, validación de respuestas (id inexistente, repetida, opción inválida, denominador cero, formato no admitido, fracción equivalente aceptada, forma canónica `numerador/denominador` con `5/1` y `0/1`, opciones racionalmente equivalentes, ids de opción sin cambios), validación de `slip`/`guess` (no finitos o fuera de `0 < g < 1 − s < 1`, rechazados), validación de pesos, `λ`, `t_ref`, duraciones y presupuesto, integridad del grafo (acíclico, ids estables, orden topológico determinista, `ancestors` y `descendants` únicos y en ese orden, detecta ciclo inyectado), ordenación de intervenciones (grupo empatado completo respecto al máximo, valores no positivos incluidos), cobertura sin doble conteo, plan vacío, plan distinto de un prefijo del ranking, respeto del presupuesto de tiempo (incluido presupuesto 0), comparación de planes (necesidad pendiente calculada a mano sin atribuirla a descendientes, planes que difieren y que coinciden, empates y permutación de entradas, `D = 0`, clase vacía, `priorsOnly`, `mixed`, detalle de alumnos inválido o incoherente con los agregados), datos vacíos (clase vacía en diagnóstico y recomendaciones sin `0/0`, banco vacío), `D = 0`, priors extremos (0, 1, 1e-12) sin NaN ni modificación, normalización inválida con error tipado, métricas `null` sin convertirlas en 0, log‑loss en nats con clipping solo en evaluación, permutación del método C por alumno sin alterar los uniformes comunes, escenario “todas” con tolerancia `1e-9`, reglas de postintervención (plan vacío, cambios simultáneos sin cascada, sin pérdida de dominio, reducción única por ancestros, diagnóstico de post‑test separado, sin reutilizar ítems, falta de preguntas con `null` y aviso, alcance independiente del plan, selección por `fixedQuestionOrder` sin EIG, misma selección entre ramas y planes con igual historial, `questionBudgetPerStudent` inválido rechazado, entradas inconsistentes de alumnos, ids o preguntas rechazadas, cambio etiquetado como descriptivo no equiparado), ausencia de `Math.random` en `src/engine`, `src/simulation` y `src/benchmarks`, `src/engine` no importa `src/simulation` ni `src/benchmarks`, el motor no recibe el estado real salvo en las funciones puras DINA, que no mutan sus entradas (§2.7).

## 7. Fases

Esta planificación se define aquí porque `PROMPTS_RADAR.md` no está disponible.

- **Fase 1:** grafo, banco de 30 preguntas, tipos provisionales y validación.
- **Fase 2:** DINA, prior, posterior exacto y entropías.
- **Fase 3:** EIG, selección explicable y registro de respuestas.
- **Fase 4:** diagnóstico de clase e intervenciones con optimización exacta.
- **Fase 4C:** comparación de planes y necesidades pendientes (§2.6.1).
- **Fase 5:** simulación reproducible y respuestas comunes.
- **Fase 6:** evaluación postintervención.
- **Fase 7:** benchmarks, informes y documentación de integración.

Una fase por sesión; si es grande, se divide en sesiones sin ampliar el alcance.

## 8. Infraestructura para la implementación

Decisiones para implementar; en la Fase 0 no se instala nada.

- Dependencias de desarrollo autorizadas: `vitest`, `typescript` y `@types/node` (regla 5).
- TypeScript `strict`, `target` ES2022, `allowImportingTsExtensions` y `noEmit`.
- Imports relativos TypeScript con extensión `.ts`.
- Sin `enum`, `namespace` ni parameter properties.
- `npm run bench` ejecuta `node scripts/bench.ts`.
- Entorno comprobado actual: Node 26. No se afirma compatibilidad no verificada.
- Typecheck separado: Node nativo no comprueba tipos.
- En Fase 1 se permite configuración mínima de TypeScript y Vitest si sigue faltando, sin crear Vite ni frontend.
- Si aparece configuración del integrador, se reutiliza y se proponen ajustes compatibles sin sobrescribirla.
