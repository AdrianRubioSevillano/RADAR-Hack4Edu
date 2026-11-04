# Matemáticas del motor

Este documento cubre lo implementado hasta la Fase 4B: modelo DINA, prior, actualización bayesiana exacta, consultas, entropías, selección adaptativa, registro de respuestas, diagnóstico de clase y priorización de intervenciones. La simulación y los benchmarks aún no existen.

Los parámetros no están calibrados con datos reales. Este motor no demuestra precisión diagnóstica ni eficacia educativa.

## Codificación de los estados

El orden de codificación está fijado en `SKILL_ORDER`:

```
OPS, NEG, FRA, JER, ALG, ECU
```

Es independiente del orden topológico `OPS, FRA, NEG, JER, ALG, ECU`. Nunca se infiere del recorrido de un objeto ni de un grafo.

Para un índice entero `m` de 0 a 63, la competencia en la posición `k` está dominada si el bit `k` de `m` vale 1. `OPS` es el bit menos significativo.

| Índice | Competencias dominadas |
|---|---|
| 0 | ninguna |
| 1 | OPS |
| 2 | NEG |
| 4 | FRA |
| 8 | JER |
| 16 | ALG |
| 32 | ECU |
| 5 | OPS, FRA |
| 63 | todas |

`JointDistribution` es un array de 64 números, y su índice sigue esta codificación. `DiagnosticState.skillOrder` guarda el orden de forma explícita.

## Modelo DINA

`R_q` es la unión de la competencia principal y las secundarias. No se añaden ancestros.

- `η_q(α) = 1` si `α` domina todas las competencias de `R_q`; si no, 0.
- `P(Y_q = 1 | α) = 1 − s_q` si `η_q(α) = 1`, y `g_q` si `η_q(α) = 0`.
- `P(Y_q = 0 | α) = s_q` si `η_q(α) = 1`, y `1 − g_q` si `η_q(α) = 0`.

El fallo usa `s_q` directamente: calcular `1 − (1 − s_q)` perdería precisión con valores pequeños.

`slip` y `guess` deben ser finitos y cumplir `0 < g_q < 1 − s_q < 1`, evaluado en doble precisión. Lo que no lo cumple se rechaza. No se recorta ningún valor.

`R_q` es una hipótesis de modelado no validada: DINA supone que no dominar cualquiera de las competencias requeridas reduce la probabilidad de acierto a `g_q`. Puede fallar si existen estrategias alternativas.

## Prior

**Independiente, por defecto.** `π(α) = Π_k p0_k^{α_k} · (1 − p0_k)^{1 − α_k}`, con `p0_k = 0.5` por defecto (SUPUESTO). Se admiten valores finitos en `[0, 1]`, incluidos 0 y 1 exactos, sin recortarlos.

**Compatible con prerrequisitos, desactivado por defecto.** Multiplica por `ε` cada estado incompatible y renormaliza.

- Un estado es incompatible si domina alguna competencia sin dominar uno de sus prerrequisitos. Con el grafo de §2.1 hay 55 estados incompatibles y 9 compatibles. Usar prerrequisitos directos o todos los ancestros da el mismo conjunto de estados.
- `ε` se aplica una sola vez por estado, aunque tenga varias violaciones.
- `ε` es finito en `(0, 1]` (SUPUESTO configurable). No tiene valor por defecto: hay que indicarlo al activar la opción.
- `ε = 1` equivale al prior independiente.
- Activarlo exige `knowledgeGraph`. Si se pasa un grafo, debe contener exactamente las seis competencias, en cualquier orden. Sus aristas no se comparan con las de §2.1.

## Actualización

`π'(α) ∝ π(α) · P(Y_q = r_q | α)`, renormalizando en cada paso.

Al ser exacta sobre la conjunta, una pregunta multicompetencia no cuenta dos veces la evidencia. La actualización también introduce correlación entre competencias, así que la conjunta no es el producto de sus marginales.

### Casos calculados a mano

Prior uniforme, `s = 0.1` y `g = 0.25`.

**Una competencia.**

- Tras un acierto: `0.5·0.9 / (0.5·0.9 + 0.5·0.25) = 18/23`.
- Tras un fallo: `0.5·0.1 / (0.5·0.1 + 0.5·0.75) = 2/17`.
- Las competencias no consultadas siguen en 0.5.

**Dos competencias, tras un acierto.** `P(acierto) = 0.25·0.9 + 0.75·0.25 = 0.4125`.

- Dominar ambas: `0.225 / 0.4125 = 6/11`.
- Cada marginal: `(0.225 + 0.0625) / 0.4125 = 23/33`.
- El producto de marginales daría `(23/33)²`, que no es `6/11`.

## Consultas

- `P(dominar S) = Σ_{α ⊇ S} π(α) / Σ_α π(α)`, para un conjunto explícito `S`. Se calcula desde la conjunta, no multiplicando marginales.
- El conjunto vacío tiene probabilidad 1.
- La marginal de `k` es esa misma consulta con `S = {k}`.

Dividir entre la masa total evita que el redondeo dé valores mayores que 1. No es un recorte: las sumas se acumulan en el mismo orden, así que el numerador no puede superar al denominador.

## Entropías

Ambas están en bits, con `0·log(0) = 0`.

- `H_b(p) = −p·log2(p) − (1 − p)·log2(1 − p)`.
- `H(π) = −Σ_α p(α)·log2(p(α))`, con `p(α) = π(α) / Σ_β π(β)`.

La entropía conjunta usa las masas normalizadas por la masa total. Sin esa división, una distribución aceptada que suma `1 + 5e-10` daría entropías fuera de `[0, 6]`, como `-7.2e-10` en una masa puntual. El resultado no se recorta a ese intervalo.

## Selección activa

`selectNextQuestion` evalúa todas las preguntas no respondidas. Las distribuciones aceptadas se interpretan normalizadas, igual que en las consultas.

**Probabilidades de respuesta.** `P(acierto)` y `P(fallo)` se acumulan por separado con las probabilidades del modelo, y cada una se divide entre la suma de ambas. `P(fallo)` nunca se obtiene restando a 1, porque perdería precisión con valores pequeños.

**EIG exacta (§2.4), en bits.** `EIG(q) = I(α; Y_q) = H_b(P(Y_q = 1)) − Σ_α p(α) · H_b(P(Y_q = 1 | α))`.

Cada entropía binaria se calcula sobre la menor de sus dos probabilidades complementarias. `H_b` es simétrica, y así se pierde menos precisión cuando una está muy cerca de 1, aunque no se elimina el error. Por ejemplo, con `s = 1e-12` y la referencia `s·log2(1/s) + s/ln(2)`, el error relativo medido fue `2.13e-5` partiendo de `1 - s` y `7.73e-7` partiendo de `s`. Son resultados de ese caso concreto, no garantías generales de precisión.

**Residuos negativos.** La EIG no puede ser negativa. Un valor entre `-1e-12` y 0 se convierte en 0 como corrección numérica. Un valor más negativo o no finito lanza `INVALID_EIG`: no se oculta con un recorte general.

**Explicación de cada candidata.** Incluye `P(acierto)`, `P(fallo)`, la EIG, los dos posteriores hipotéticos y sus marginales. Si una rama no puede normalizarse, se lanza `INVALID_NORMALIZATION`: no se inventa una distribución.

**Reducción esperada de entropía por competencia.** `H_b(p_k) − P(acierto)·H_b(p_k | acierto) − P(fallo)·H_b(p_k | fallo)`, en bits.

- Es la reducción esperada. En una rama concreta la entropía puede aumentar: con `p_k = 0.1`, un acierto acerca la marginal a 0.5.
- Las reducciones de varias competencias no son aditivas y no suman la EIG. Ninguna supera la EIG, salvo redondeo.
- A diferencia de la EIG, no se corrigen sus residuos de redondeo.

**Elección.** Se toma el máximo global de EIG y, entre las candidatas a distancia absoluta `≤ 1e-12` de ese máximo, el menor `id` lexicográfico. Comparar siempre con el máximo evita los empates encadenados. El resultado no depende del orden del banco.

**Sin parada.** No hay criterio de parada por confianza, presupuesto o EIG baja. Una candidata con EIG cero sigue siendo elegible. Sin candidatas se devuelve `null`.

## Registro de respuestas

`submitAnswer` corrige la respuesta, actualiza la conjunta una sola vez con `updatePosterior` y añade un registro.

- En opción múltiple se compara el `id` de opción, de forma exacta.
- En respuesta numérica se normaliza con `normalizeRational`, y se comparan racionales canónicos.
- Un formato inválido, una opción inexistente o una pregunta repetida devuelven un error y dejan el estado como estaba. No cuentan como respuesta incorrecta.

**Validación del estado.** Antes de usarlo se comprueban `skillOrder`, la distribución, `priorConfig` y el historial. El historial debe tener ids únicos, y cada registro debe ser coherente con el banco.

No se reconstruye el posterior ni se compara con el prior: tras observar respuestas debe poder cambiar. `priorConfig` es procedencia, no una comprobación del posterior.

## Orden fijo

`fixedQuestionOrder` da el orden del método A (§2.9): rondas por competencia principal en orden topológico. Dentro de cada competencia, dificultad 2, 1, 3 y después `id`. Cada ronda toma el siguiente ítem disponible de cada competencia.

## Diagnóstico de clase

`getClassDiagnostic` agrega las estimaciones existentes. No añade ninguna inferencia. Todos los estados recibidos participan, incluidos los que solo contienen el prior.

**Por competencia,** con `p_ik` la marginal del alumno `i` y `n` el número de alumnos:

- Media de dominio: `Σ_i p_ik / n`.
- Número esperado que necesita refuerzo: `Σ_i (1 − p_ik)`. Es una estimación del modelo, no un recuento de alumnos observados con dificultad.
- Número bajo `τ`, número con estimación incierta y entropía binaria media.
- Preparación media: media de `P(dominar todos los ancestros)`.

**Preparación por alumno.** Es la probabilidad conjunta de dominar todos los ancestros, calculada desde su distribución con `masteryProbability`. Sin ancestros vale 1. No se multiplican marginales: dos conjuntas con iguales marginales pueden dar preparaciones distintas si tienen distinta dependencia.

**Umbrales.** Por defecto `τ = 0.5`, `lowerUncertainty = 0.3` y `upperUncertainty = 0.7`. Son configurables, finitos en `[0, 1]`, con `lowerUncertainty < upperUncertainty`. El resultado incluye los valores efectivos.

Las comparaciones son estrictas, con una tolerancia de `1e-12` que trata como situado en el umbral a un valor muy próximo:

- Bajo `τ`: `p < τ − 1e-12`.
- Incierta: `lowerUncertainty + 1e-12 < p < upperUncertainty − 1e-12`.

Sin esa tolerancia decidiría el redondeo. Una competencia sin evidencia vale matemáticamente 0.5, igual que `τ`, pero en coma flotante puede quedar en `0.4999999999999997`. En una medida puntual con el banco real, 901 de 2064 casos quedaban por debajo de 0.5 solo por redondeo, con una desviación máxima de `1.1e-15`. Son resultados de ese caso concreto, no un límite general del error.

La tolerancia no es configurable. Es la tolerancia de clasificación de `CLAUDE.md` §2.5, implementada en `src/engine/thresholds.ts`. Un valor a esa distancia de un umbral se considera igual a él solo para clasificar: no cambia probabilidades, medias, posteriores ni entropías, y no es incertidumbre estadística.

**Cobertura.** `evidenceStatus` vale `emptyClass`, `priorsOnly`, `mixed` o `allWithResponses`. Se avisa cuando las estimaciones de algún alumno proceden únicamente del prior.

`allWithResponses` no significa que todas las competencias estén medidas. Un alumno con una respuesta de `OPS` conserva el prior en las competencias no relacionadas. Sin banco, el diagnóstico no puede saber qué competencias tocó cada respuesta. Por eso `totalResponseCount` no indica cuántas competencias se han medido.

**Clase vacía.** Recuentos y sumas valen 0. Medias, entropías medias y preparación valen `null`. Hay seis competencias en `skills`, `students` está vacío, `insufficientData` es `true` y hay un aviso. No se evalúa `0/0` ni se lanza un error.

**Validación sin banco.** La firma no recibe banco, así que se comprueba la forma del historial, no si una pregunta existe ni si la corrección es coherente. No se reconstruye el posterior ni se compara con el prior.

Los umbrales y el número esperado de refuerzo no son diagnósticos confirmados.

## Priorización de intervenciones

`rankInterventions` aplica §2.6 sobre un diagnóstico de clase. Es una **heurística de priorización**, no una estimación de efecto causal ni una mejora educativa demostrada. Prioriza competencias: no genera actividades ni afirma que las duraciones sean eficaces.

**Componentes,** con `D = Σ_j imp_j`:

- `n_k = Σ_i (1 − p_ik) / n`, a partir de `expectedReinforcementCount`.
- `relevancia_k = Σ_{j ∈ desc(k)} imp_j / D`; 0 si `D = 0`.
- `preparacion_k`: `meanPrerequisiteProbability`. Vale 1 sin ancestros.
- `confianza_k = 1 − meanEntropy`.
- `prioridad_k = imp_k`.

**Valor de un subconjunto `S`.**

```
b_k          = n_k · (w_prep·preparacion_k + w_conf·confianza_k + w_prio·imp_k)
cobertura(S) = Σ_j [ imp_j · max({ n_k : k ∈ S, j ∈ desc(k) } ∪ {0}) ] / D      (0 si D = 0)
beneficio(S) = Σ_{k ∈ S} b_k + w_rel·cobertura(S)
coste(S)     = λ · Σ_{k ∈ S} d_k / t_ref
valor(S)     = beneficio(S) − coste(S)
```

La cobertura se calcula directamente sobre el conjunto: cada descendiente cuenta una vez, con la mayor necesidad de las competencias de `S` de las que depende. No es la suma de coberturas individuales.

**Valores por defecto, SUPUESTOS no calibrados.** `w_prep = 0.30`, `w_conf = 0.20`, `w_prio = 0.30`, `w_rel = 0.20`, `λ = 0.10`, `t_ref = 30`, `d_k = 15` e `imp_k = 1`. Los umbrales de preparación y confianza bajas valen 0.5.

**Ranking.** Por `valor_k = valor({k})` descendente. En cada iteración se añade todo el grupo a distancia `≤ 1e-12` del máximo actual, ordenado por duración e id, se elimina y se continúa. Incluye los valores no positivos. `valor_k / d_k` es solo informativo.

**Plan.** Enumeración exacta de los 64 subconjuntos, incluido el vacío, que cumplen `Σ d_k ≤ T`. Entre los subconjuntos a distancia `≤ 1e-12` del máximo global se elige la menor duración y después la lista de ids ordenada, comparada elemento a elemento. El plan no es un prefijo del ranking. El coste permite descartar incorporaciones que no compensan, y el presupuesto puede agotarse si compensa.

**Tiempo.** Duraciones y presupuesto se convierten a segundos enteros seguros antes de sumar, comparar con el presupuesto y desempatar por duración. Así, `0.1 + 0.2` minutos caben en `0.3`, porque son 6 + 12 segundos frente a 18. El coste sigue siendo `λ · Σ d_k / t_ref`, en minutos.

**Valores no representables.** Beneficio, coste y valor neto se comprueban antes de usarlos, y `rankWithTies` rechaza puntuaciones no finitas. Una operación no representable lanza `NON_FINITE_VALUE`. Solo se valoran los subconjuntos que caben en el presupuesto.

**Avisos.** Usan la tolerancia de clasificación y no alteran la puntuación.

- `LOW_PREPARATION`: indica el ancestro con menor dominio medio. Entre ancestros a distancia `≤ 1e-12` del mínimo, el menor id. Con priors uniformes, sin esa tolerancia decidiría el redondeo.
- `LOW_CONFIDENCE`: recomienda más evaluación antes de intervenir.

**Evidencia.**

| `evidenceStatus` | Ranking | Plan |
|---|---|---|
| `emptyClass` | Vacío | Vacío, con el aviso “No hay alumnos para calcular recomendaciones” |
| `priorsOnly` | Cálculo hipotético basado solo en priors | Vacío, con aviso de recoger respuestas |
| `mixed` | Calculado | Calculado, con los avisos y la proporción de alumnos sin respuestas |
| `allWithResponses` | Calculado | Calculado |

`allWithResponses` no significa que todas las competencias estén medidas.

**Validación del diagnóstico.** `ClassDiagnostic` es una entrada serializable y no se da por válida. Se comprueban las seis competencias, los rangos, los recuentos y su coherencia. Una competencia sin ancestros debe tener preparación 1. Fuera de la clase vacía, `null` se rechaza y no se sustituye por 0.

**Ajuste de magnitudes derivadas.** Una magnitud derivada de `[0, 1]`, como `confianza_k`, puede desviarse del intervalo por redondeo. Hasta `1e-12` se ajusta al extremo; más allá se lanza `INVALID_DIAGNOSTIC`. No autoriza ningún recorte del posterior.

## Comparación de planes y necesidad pendiente

`compareInterventionPlans` aplica §2.6.1. Compara el plan colectivo de `rankInterventions` (A) con un plan que reduce la mayor necesidad estimada pendiente de un alumno (B), y muestra qué queda pendiente por alumno y competencia. Es una heurística distinta de §2.6: no se afirma superioridad ni equidad educativa demostrada.

**Índices.** Con `w_k` la importancia efectiva, `D = Σ_k w_k` y `S` las competencias programadas:

```
n_ik           = 1 − masteryProbability_ik
baseline_i     = Σ_k (w_k · n_ik) / D
pending_i(S)   = Σ_{k ∉ S} (w_k · n_ik) / D
scheduled_i(S) = baseline_i − pending_i(S)
```

Son necesidad estimada según el modelo, no probabilidades de mejora. **Programar no significa aprender.** Solo se descuentan las competencias directamente programadas: programar `OPS` no reduce la necesidad de `NEG`, aunque `NEG` dependa de `OPS`. Tampoco tienen relación con `coverage` de §2.6, que mide descendientes del grafo.

**Ejemplo.** Un alumno con necesidades `OPS = 0.8`, `NEG = 0.5` y `ECU = 0.5`, e importancias 1, tiene `baseline = 1.8/6 = 0.3`. Con `S = {OPS}`, `pending = 1/6` y `scheduled = 0.8/6`.

**Plan B.** Se enumeran los mismos subconjuntos que en §2.6 y se conservan los que caben en el presupuesto, en segundos enteros. Después, en este orden:

1. Menor máximo de `pending_i` entre alumnos.
2. Menor media de `pending_i`.
3. Mayor valor neto de §2.6.
4. Menor duración.
5. Lista ordenada de ids.

En los tres primeros criterios se conservan las candidatas a distancia `≤ 1e-12` del mejor global de las que quedan; no se comparan por pares. El presupuesto limita el tiempo y el coste solo interviene en el tercer criterio, así que el plan B puede tener un valor neto negativo.

**Compromiso.** Con `ECU = 0.8` en un alumno y `OPS = 0.6` en otros dos, y tiempo para una sola competencia, A programa `OPS` y deja un máximo de `0.8/6` y una media de `0.8/18`. B programa `ECU` y deja un máximo de `0.6/6` y una media de `1.2/18`, con menor valor neto. Ninguno es mejor en todo. Los dos planes también pueden coincidir.

**Casos.**

| Caso | Plan A | Plan B | Índices |
|---|---|---|---|
| `D = 0` | El de §2.6 | Vacío, sin afirmar ausencia de necesidad | `null`, con aviso; `need` se conserva |
| `emptyClass` | Vacío | Vacío | Sin alumnos; agregados `null` |
| `priorsOnly` | Vacío | Vacío | Análisis hipotético: `pending = baseline` |
| `mixed` | El de §2.6 | Calculado con todos los alumnos | Avisos de estimaciones basadas solo en priors |
| `allWithResponses` | El de §2.6 | Calculado | Calculados |

**Validación del detalle.** Antes de usar `students` se aplica la validación de §2.6 y además:

- Umbrales de `config` válidos, ids no vacíos y únicos, `responseCount` entero no negativo y las seis competencias sin repetir.
- Probabilidad y preparación finitas en `[0, 1]`, y entropía en `[0, 1]` salvo redondeo.
- `|entropy − H_b(masteryProbability)| ≤ 1e-9`.
- La preparación de una competencia sin ancestros es 1. Con ancestros cumple las cotas de Fréchet, que valen para cualquier conjunta: `1 − Σ_a (1 − p_a) ≤ preparación ≤ min_a p_a`, con tolerancia `1e-9`.
- `studentsWithResponses` y `totalResponseCount` coinciden exactamente con el detalle.
- Cada resumen se recalcula con `summarizeSkill`. `belowTauCount` y `uncertainCount` coinciden exactamente; `meanMastery`, `meanEntropy`, `meanPrerequisiteProbability` y `expectedReinforcementCount / n` coinciden con tolerancia `1e-9`.

Esto detecta detalle manipulado o incoherente, **no prueba que el diagnóstico proceda de respuestas reales**: aquí no se reciben conjuntas y no se reconstruyen posteriores. Un diagnóstico falso pero coherente se acepta.

Los alumnos se ordenan por id antes de sumar y las competencias siguen `SKILL_ORDER`, de modo que el orden de entrada no cambia el resultado.

## Población sintética

Solo para demo y benchmarks (§2.7). Los perfiles son una configuración de demo, no grupos educativos validados ni estimaciones observadas.

**PRNG, versión 1.** mulberry32: estado de 32 bits, salida `entero uint32 / 2^32`, en `[0, 1)`. No es criptográfico.

**Derivación de flujos.** Cada flujo se identifica con una etiqueta:

```
h0     = seed XOR 0x811c9dc5
h(j+1) = (h(j) XOR byte_j) · 0x01000193 mod 2^32     (FNV-1a sobre los bytes UTF-8 de la etiqueta)
semilla del flujo = fmix32(h_final)                  (finalizador de MurmurHash3)
```

Los flujos base son `population`, `responses`, `randomOrder`, `intervention` y `bootstrap`. Un flujo depende solo de la semilla y de su etiqueta, de modo que consumir uno no altera los demás. Para una etiqueta fija, semillas distintas dan semillas de flujo distintas.

Cualquier cambio de resultados para una misma configuración y semilla exige subir `GENERATOR.version`. Los tests fijan vectores de una réplica independiente.

**Generación.** El alumno de índice `i`, con `i` desde 0:

1. Recibe el id `S01`, `S02`… `S99`, `S100`… y el grupo `i mod G`.
2. Usa su propio flujo, `population/<id>`: ampliar la clase no cambia a los alumnos existentes.
3. Recorre las competencias en orden topológico, consumiendo un uniforme `u` por competencia, también si su probabilidad es 0 o 1.
4. Domina `k` si `u < p_k`, con:

```
p_k = base_gk · f   si falta al menos un ancestro de k en el estado ya generado
p_k = base_gk       en otro caso, y siempre si k no tiene ancestros
```

Se comprueban todos los ancestros, no solo los prerrequisitos directos, y `f` se aplica una sola vez aunque falten varios.

**Valores por defecto, SUPUESTOS no calibrados.** Tres grupos con `base = 0.85`, `0.60` y `0.35` en cada competencia, y `f = 0.5`.

**Relación con el motor.** Esta población se parece a la estructura del grafo, y el prior del motor, por defecto, **no** la usa: asume marginales independientes. Por eso el motor parte de un modelo distinto del que genera los datos.

**Límites.**

- `SyntheticClass` contiene la verdad. `observableStudents` solo entrega id y nombre ficticio.
- La asignación `i mod G` es pública: quien conozca la regla y `G` deduce el grupo a partir del id. El motor no usa los ids para inferir, pero un análisis de resultados por id no sería ciego al grupo.
- Todas las semillas recorren el mismo ciclo de `2^32` estados de mulberry32. Dos flujos podrían solaparse, y 32 bits no garantizan independencia estadística entre flujos.

## Respuestas sintéticas

Solo para demo y benchmarks (§2.7). Usan números aleatorios comunes: cada par (alumno, pregunta) de una ocasión tiene sus uniformes, preparados antes de ejecutar los métodos. Si dos métodos hacen la misma pregunta al mismo alumno, ven la misma respuesta.

**Uniformes.** Cada par tiene su propio flujo:

```
etiqueta = "responses/" + JSON.stringify([ocasión, alumno, pregunta])
u_acierto    = primer valor del flujo
u_distractor = segundo valor del flujo
```

JSON escapa los ids, así que `('a/b', 'c')` y `('a', 'b/c')` no comparten etiqueta. Un par depende solo de la semilla, la ocasión y sus ids: añadir alumnos o preguntas, permutar las entradas o consultar en otro orden no lo cambia. El nombre del método no forma parte de la clave. Pretest y postest usan ocasiones distintas y, por tanto, flujos distintos.

**Respuesta.** Con `(s, g)` los parámetros reales, por defecto los del ítem:

```
P = correctProbability(α actual, R_q, s, g)
acierta si u_acierto < P
```

Si acierta, devuelve el id correcto o la respuesta canónica. Si falla en opción múltiple, ordena los distractores por id y toma el de posición `⌊u_distractor · nº de distractores⌋`.

Si falla en numérica, devuelve `0/1`, o `1/1` si `0/1` es la correcta. Es un **SUPUESTO simplificado**: no reproduce errores reales ni concepciones equivocadas. No afecta a la inferencia, que solo usa acierto o fallo, pero una respuesta numérica sintética no sirve para estudiar errores.

**Mala especificación.** `realParameters` permite que los datos se generen con `s` y `g` distintos de los del banco, que son los que asume el motor. El motor no recibe los reales.

**Uniformes, no resultados.** La tabla no guarda aciertos. Si una intervención futura cambia `α`, el mismo `u` puede dar otra respuesta: con `s = 0.1` y `g = 0.25`, `u = 0.5` falla sin dominar `R_q` y acierta dominándolo. Si `u < g`, acierta en ambos casos.

**Límites.** Son flujos pseudoaleatorios, no independencia estadística demostrada. La derivación tiene 32 bits, así que dos pares pueden recibir por azar la misma semilla de flujo, y con ella los mismos uniformes. Una tabla no se contrasta con su semilla: un uniforme alterado dentro de `[0, 1)` no se detecta.

## Intervención sintética

Solo para demo y benchmarks (§2.8). Cambia el estado real **simulado**: no es aprendizaje observado ni demuestra eficacia educativa.

**Asignación.** Con la semilla de intervención, cada alumno recibe el primer valor de su flujo `intervention/["control","<id>"]`. Se ordena por ese valor, se desempata por id y los primeros `c` son control, con `x = n · controlFraction`:

```
c = round(x)   si |x − round(x)| ≤ 1e-12
c = ⌊x⌋        en otro caso
```

La tolerancia es numérica, no incertidumbre estadística: `100 · 0.29` da `28.999999999999996` en coma flotante y debe contar 29, mientras que `100 · 0.28999` son 28 y `30 · 0.29` son 8. Como `x` está en `[0, n]`, `c` también. La asignación no depende del plan ni del orden de entrada, y una fracción menor da un subconjunto del control.

**Mejora.** Sea `α` el estado anterior al plan, `S` las competencias del plan, `p` la probabilidad de mejora y `f` el factor. Para cada alumno tratado y cada `k ∈ S` con `α_k = 0`:

```
p_ik = p · f   si falta en α al menos un ancestro de k
p_ik = p       en otro caso, y siempre si k no tiene ancestros
α'_k = 1 si u_ik < p_ik,  con u_ik el primer valor de intervention/["improvement","<id>","<k>"]
```

Todas las `p_ik` salen de `α` y los cambios se aplican a la vez: no hay cascada dentro del plan. Si `OPS` y `NEG` están en el plan y `α_OPS = 0`, `NEG` usa `p · f` aunque `OPS` mejore. Se comprueban todos los ancestros, `f` se aplica una sola vez y nunca se pierde dominio. Los alumnos de control y el plan vacío no cambian `α`.

**Valores por defecto, SUPUESTOS no calibrados.** `p = 0.35`, `f = 0.5` y `controlFraction = 0`.

**Comparación entre planes.** Las etiquetas no incluyen el plan ni el método. Dos planes sobre la misma población y semilla comparten asignación y `u_ik` en las competencias comunes, y como `p_ik` depende solo de `α`, también los mismos cambios en ellas.

**Reconstrucción.** `postClass` conserva la semilla de población, pero no se regenera con ella: hacen falta el plan, el estado anterior y la semilla y configuración de intervención.

**Límites.** Es un modelo de transición inventado, sin olvido ni mejora espontánea, en el que la intervención solo actúa sobre sus competencias directas. La asignación usa flujos pseudoaleatorios, no una aleatorización con independencia demostrada.

## Evaluación postintervención

`simulatePostIntervention` aplica §2.8. Solo existe en simulación: no demuestra eficacia educativa.

**Flujo.**

1. Valida la correspondencia entre alumnos y estados de pretest, y cada historial contra el banco.
2. Normaliza `priorConfig` y lo compara con el prior efectivo de cada pretest.
3. Fija las preguntas: orden fijo, competencia principal en `assessmentSkills`, sin las respondidas por ese alumno, hasta el presupuesto. Sin EIG.
4. Aplica la intervención sintética.
5. Crea los uniformes con la semilla de población y la ocasión `posttest`.
6. Genera respuestas sobre `postClass` y crea un diagnóstico nuevo por alumno, desde el mismo prior. No se continúa el posterior del pretest, porque el modelo no incorpora transiciones temporales.

La selección se hace antes de aplicar el plan y solo depende de banco, alcance, presupuesto e historial. Por eso coincide entre planes, tratamiento y control con el mismo historial. Los uniformes tampoco dependen del plan ni de la semilla de intervención: dos planes dan la misma respuesta salvo donde `α` difiere.

**Tres capas.** Para el alumno `i`, con `A` las competencias de `assessmentSkills`:

| Capa | Pre | Post | Cambio |
|---|---|---|---|
| Observada | Aciertos / preguntas del pretest con competencia principal en `A` | Aciertos / preguntas del postest | Post − pre, si existen ambas proporciones |
| Estimada | `media_{k∈A} p_ik` del pretest | Igual en el diagnóstico de postest; `null` sin preguntas nuevas | Post − pre; `null` sin ninguna respuesta de pretest o sin postest |
| Real simulada | `media_{k∈A} α_ik` antes del plan | `media_{k∈A} α_ik` en `postClass` | Post − pre, siempre disponible |

El cambio observado es **descriptivo no equiparado**: pre y post usan ítems distintos, con otra composición y dificultad. El cambio estimado compara dos diagnósticos independientes y no es aprendizaje confirmado. Si el pretest no tenía respuestas, su estimación es el prior y el cambio no se calcula. Una respuesta fuera de `A` basta para que no sea solo prior, aunque la proporción observada sea `null`.

**Agregación.** Para cada grupo y capa se usan solo los alumnos con pareja válida en esa capa:

```
meanPretest, meanPosttest = medias sobre esos alumnos
meanChange                = media de sus cambios individuales
DiD                       = meanChange_tratamiento − meanChange_control
```

La diferencia en diferencias existe solo si ambos grupos tienen parejas válidas en esa capa. `null` nunca se convierte en 0. Las parejas válidas pueden diferir entre capas y entre grupos, y se informa de ellas y de las exclusiones.

**Ejemplo.** Tratamiento con proporciones pre `1/2` y `0`, y post `1` y `1`: cambios `+0.5` y `+1`, media `0.75`. Control con pre `1/2` y `1`, y post `0` y `0`: cambios `−0.5` y `−1`, media `−0.75`. La diferencia en diferencias es `1.5`, en una escala descriptiva no equiparada.

**Cobertura.** Se informa del presupuesto pedido y efectivo, de la composición por competencia principal y de los alumnos sin postest o con postest reducido. `UNEQUAL_COVERAGE` compara con enteros las preguntas de postest por alumno y competencia entre grupos: una cobertura desigual no es evidencia concluyente.

**Límites.** En alumnos reales, una comparación antes y después no demuestra causalidad. La diferencia en diferencias es una estimación dentro de esta simulación, y sus datos siguen DINA con parámetros no calibrados. La asignación al control es pseudoaleatoria y grupos pequeños dan comparaciones inestables. No hay intervalos de confianza: una sola réplica no permite extraer conclusiones.

## Tolerancias y umbrales

| Valor | Uso |
|---|---|
| `1e-9` | Tolerancia numérica de `\|Σπ − 1\|` al aceptar una distribución. Fuera de ella se rechaza, no se corrige. |
| `1e-300` | Masa total mínima para renormalizar (§2.3). Por debajo, o si no es finita, se lanza `INVALID_NORMALIZATION`. |
| `1e-12` | Distancia absoluta al máximo global de EIG para considerar un empate (§2.4). |
| `1e-12` | Residuo negativo de EIG que se convierte en 0. Por debajo se lanza `INVALID_EIG`. |
| `1e-12` | Tolerancia de clasificación: distancia a un umbral dentro de la cual el valor se considera igual a él (§2.5). |
| `1e-12` | Distancia al máximo global para los empates del ranking y del plan, y al mínimo para el ancestro más débil (§2.6). |
| `1e-12` | Desviación de una magnitud derivada de `[0, 1]` que se ajusta al extremo. |
| `1e-9` | Tolerancia de `\|Σ w − 1\|` en los pesos (§2.6). |
| `1e-9` | Tolerancia de `\|dominio medio + necesidad − 1\|` al validar un diagnóstico. |
| `1e-12` | Distancia al mejor global de las candidatas restantes en los tres primeros criterios del plan B (§2.6.1). |
| `1e-12` | Distancia de `n · controlFraction` a un entero dentro de la cual el recuento de controles usa ese entero (§2.8). |
| `1e-9` | Diferencia entre `totalMinutes` y la suma de duraciones al validar un plan en la intervención sintética (§2.8). |
| `1e-9` | Coherencia del detalle por alumno: entropía con probabilidad, cotas de la preparación y medias con el agregado (§2.6.1). |

Una distribución dentro de la tolerancia se acepta sin modificar. La actualización la renormaliza como cualquier otra, y las consultas y `jointEntropy` la interpretan normalizada. Nunca se muta la entrada ni se recortan probabilidades.

No hay clipping global: `0` y `1` se conservan, y un estado con masa cero sigue en cero tras cualquier evidencia.
