# Limitaciones del motor

Qué está comprobado, qué no y cómo leer los resultados. Las cifras están en `RESULTADOS_BENCHMARK.md`, generado por script: este documento no las repite.

## Cinco afirmaciones distintas

| Afirmación | Estado | Base |
|---|---|---|
| El código cumple `CLAUDE.md` | Comprobado por tests | Tests automáticos y typecheck |
| El diagnóstico recupera estados sintéticos | Medido en simulación | Benchmark de 30 semillas |
| El diagnóstico adaptativo supera al orden fijo con alumnos reales | **No evaluado** | Sin datos reales |
| La comparación de planes y las intervenciones ayudan | **No evaluado** | El benchmark no las mide |
| RADAR mejora el aprendizaje | **No demostrado** | Sin estudio educativo |

### Corrección del código

Los tests prueban que las funciones cumplen la especificación: cálculos a mano, valores de referencia independientes, validación, reproducibilidad e inmutabilidad. No prueban que la especificación sea la adecuada para un aula. Un modelo incorrecto puede estar perfectamente implementado.

### Recuperación de estados sintéticos

El benchmark mide cuánto se parecen las estimaciones del motor a un estado real **simulado**, generado con el mismo modelo DINA. Responde a “¿recupera el motor estados generados por su propio tipo de modelo?”, no a “¿diagnostica bien a un alumno?”.

### Validez educativa

No demostrada. No hay datos de alumnos reales, ni calibración de parámetros, ni revisión docente del banco, ni estudio de que usar RADAR mejore el aprendizaje. No se afirma eficacia educativa ni originalidad mundial.

### Diagnóstico adaptativo: lo que el benchmark evalúa

Compara A (orden fijo), B (adaptativo) y C (aleatorio) con presupuestos de preguntas, en tres escenarios. Solo evalúa la **selección de preguntas y la estimación resultante**.

En dos de los tres escenarios los datos se generan con los parámetros que asume el motor, lo que favorece por construcción a una selección basada en ese modelo. La mala especificación ensayada es una única alternativa (`slip = 0.25`, `guess = 0.20` en todos los ítems), no un análisis de sensibilidad. No se ha ensayado una estructura de competencias incorrecta, `R_q` erróneos ni respuestas que no sigan DINA.

El informe solo compara B con A. C es un control de cordura, sin comparación emparejada.

### Planes e intervenciones: lo que el benchmark no valida

**El benchmark no ejecuta `rankInterventions`, `compareInterventionPlans` ni `simulatePostIntervention`.** Sus resultados no dicen nada sobre:

- Si el ranking prioriza bien.
- Si un plan es mejor que otro.
- Si el plan por necesidad pendiente es más equitativo.
- Si una intervención funciona.

Ranking y planes son heurísticas con pesos SUPUESTOS. Sus tests prueban que calculan lo especificado, no que recomienden bien. La intervención simulada usa un modelo de transición inventado: lo que muestra se sigue de sus parámetros, no de datos.

## Cómo leer los resultados

**Mejor MAE no implica más aciertos de clasificación.** MAE mide la distancia de las probabilidades; precisión, recall, F1 y exactitud miden decisiones tras un umbral. Pueden ir en direcciones distintas. En la mala especificación ensayada ocurre: con 6 preguntas el MAE favorece a B, mientras los intervalos de precisión, recall, F1 y exactitud incluyen cero; con 9, el MAE favorece a B y el recall favorece a A.

**Un intervalo que incluye cero no demuestra equivalencia.** Solo indica que estos datos no separan a los métodos con este análisis. Mostrar equivalencia exigiría fijar antes un margen y evaluarlo.

**Un intervalo que excluye cero no garantiza superioridad.** Es un percentil bootstrap entre semillas, sin corrección por multiplicidad, sobre métricas correlacionadas entre sí. Refleja la variabilidad entre semillas bajo SUPUESTOS fijos, no la incertidumbre sobre esos SUPUESTOS, y suele quedarse corto con pocas semillas. La clasificación del informe es descriptiva.

**B empeora la log-loss bajo la mala especificación ensayada.** El intervalo favorece a A con 4, 6, 9 y 12 preguntas, y Brier también con 4 y 6. Es un resultado desfavorable y debe mostrarse junto a los demás.

**Eso no demuestra exceso de confianza.** La log-loss penaliza mucho las probabilidades extremas equivocadas, lo que es compatible con varias explicaciones. Afirmar exceso de confianza o falta de calibración exigiría una evaluación específica, como curvas de fiabilidad, que no se ha hecho. Tampoco se afirma que el motor esté calibrado en ningún escenario.

**Con todas las preguntas, B − A es cero por construcción.** Con las mismas respuestas, el orden no cambia el posterior. Esa comprobación verifica el código, no aporta evidencia a favor de ningún método.

**Las métricas agregan pares no independientes.** Los pares de un alumno comparten respuestas y conjunta. La unidad de análisis es la semilla.

**Resultados por alumno.** Una media por clase puede ocultar a quién se estima peor. El informe no desglosa por grupo.

**Los tiempos** son de una ejecución en una máquina: no son una comparación de rendimiento.

## Supuestos vigentes

Ninguno está calibrado con datos reales.

| Ámbito | Supuesto | Valor |
|---|---|---|
| Grafo | Aristas de prerrequisitos | Hipótesis pedagógica, no causalidad demostrada |
| Modelo | Estado binario y conjuntivo (DINA) | Domina o no domina; sin dominio parcial ni olvido |
| Modelo | Conocimiento fijo durante el diagnóstico | Sin aprendizaje entre preguntas |
| Banco | `R_q` de cada pregunta | Hipótesis no validada |
| Banco | `slip`, `guess` y `difficulty` | Sin calibración psicométrica |
| Banco | Contenido | Sin revisión docente |
| Prior | Marginales independientes | 0.5 por competencia |
| Prior | `ε` del prior compatible | Configurable, desactivado por defecto |
| Diagnóstico | `τ` y zona incierta | 0.5; entre 0.3 y 0.7 |
| Intervenciones | Pesos | 0.30, 0.20, 0.30 y 0.20 |
| Intervenciones | `λ`, `t_ref` | 0.10; 30 minutos |
| Intervenciones | Duración e importancia | 15 minutos; 1 |
| Intervenciones | Umbrales de preparación y confianza | 0.5 |
| Simulación | Grupos generadores | 0.85, 0.60 y 0.35; demo, no grupos validados |
| Simulación | Factor por prerrequisitos | 0.5 |
| Simulación | Error numérico | `0/1` o `1/1`; no reproduce errores reales |
| Simulación | Mejora y su factor | 0.35 y 0.5; sin olvido ni cascada |
| Benchmark | Mala especificación | `slip = 0.25`, `guess = 0.20` |
| Benchmark | Población homogénea | Base 0.6, factor 0.5 |
| Benchmark | Bootstrap y `ε_clip` | 2000 remuestreos; `1e-12` |

## Límites técnicos

- **Sin seguridad.** Sin backend, el banco con sus soluciones viaja al navegador. Ocultar campos en la interfaz no protege una evaluación.
- **Seis competencias fijas.** La inferencia exacta enumera 64 estados. El motor exige exactamente los seis identificadores de competencias de RADAR y un grafo de prerrequisitos válido; las aristas pueden variar.
- **Validación limitada.** Detecta incoherencias, no prueba que un diagnóstico proceda de respuestas reales. `validateQuestionBank` no detecta opciones algebraicas equivalentes con textos distintos.
- **Pseudoaleatoriedad.** mulberry32 no es criptográfico. Sus flujos comparten un ciclo de `2^32` estados, y las derivaciones de 32 bits pueden coincidir: no hay independencia estadística demostrada.
- **Grupo deducible.** En la simulación, el id y la regla `i mod G` revelan el grupo generador.
- **Coste.** `runBenchmark` y `simulateResponse` son síncronos. `simulateResponse` valida clase y tabla enteras en cada llamada. La selección EIG domina el tiempo del experimento.
- **Resultados ligados al código.** Los informes corresponden a este banco, grafo y motor. Si cambian, hay que regenerarlos.
- **Duplicación conocida.** La validación de parámetros reales está repetida en `methods.ts` y `postIntervention.ts`.

## Lo que corresponde a la aplicación

El motor existe, pero estas partes **no están completas por ello**:

- **Práctica individual.** El motor informa de necesidades pendientes; elegir y presentar ejercicios corresponde a la aplicación.
- **Actividades colectivas.** El motor prioriza competencias; no genera ni evalúa actividades.
- **Accesibilidad.** Depende de las pantallas y no se ha evaluado.
- **Pantallas y mensajes.** Deben mostrar avisos, `disclaimer` y `null` sin convertirlos en certezas.
- **Persistencia y privacidad.** Guardar estados y tratar datos de alumnos reales requiere decisiones propias.

## Qué haría falta para afirmar más

- Revisión docente del banco y de las aristas del grafo.
- Calibración de `slip` y `guess` con respuestas reales.
- Evaluación de calibración de las probabilidades.
- Análisis de sensibilidad con otras especificaciones erróneas, también de `R_q` y del grafo.
- Estudio con alumnos reales, con un diseño capaz de sostener conclusiones causales.
