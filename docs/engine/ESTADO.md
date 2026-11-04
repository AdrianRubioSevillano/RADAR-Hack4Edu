# Estado del motor RADAR

Traspaso al cerrar la Fase 4B. Rama `motor`, trabajo local sin push. `CLAUDE.md` es la especificación que manda.

## Implementado

- **Fase 1:** grafo, banco de 30 preguntas, racionales exactos y validación.
- **Fase 2:** DINA, prior, posterior exacto y entropías.
- **Fase 3:** EIG, selección explicable, `submitAnswer` y `fixedQuestionOrder`.
- **Fase 4A:** `getClassDiagnostic`.
- **Fase 4B:** `rankInterventions`: ranking y plan exacto con presupuesto.

**Verificación:** typecheck limpio y 751 tests pasando con Node 26. Prueban que el código cumple `CLAUDE.md`, no calibración ni eficacia educativa.

## Decisiones y limitaciones vigentes

- `slip`, `guess`, `R_q`, pesos, duraciones e importancias son SUPUESTOS no calibrados. El banco no tiene revisión docente.
- `R_q` es una hipótesis de modelado no validada.
- Tolerancia de clasificación de `1e-12` en los umbrales: `src/engine/thresholds.ts`.
- Tiempos en minutos con resolución de un segundo, convertidos a segundos enteros.
- `priorConfig` es procedencia: no se compara el posterior con el prior.
- `priorsOnly`: ranking hipotético y plan vacío.
- `allWithResponses` no significa que todas las competencias estén medidas.
- `rankInterventions` solo comprueba que `students` sea una lista de longitud `studentCount`. Ranking y plan salen de `skills`.
- `coverage` mide descendientes del grafo ponderados por importancia y necesidad, **no alumnos atendidos**.
- `validateQuestionBank` no detecta opciones algebraicas equivalentes con textos distintos.

## Próximo trabajo

**Fase 4C, todavía sin implementar:**

- Necesidades pendientes por alumno.
- Comparación de planes.
- Validar el detalle por alumno y su coherencia con los agregados.

**Después:**

- Fase 5: simulación reproducible.
- Fase 6: evaluación postintervención.
- Fase 7: benchmarks e informes.

## Reglas para continuar

- El frontend se desarrolla en paralelo en otro ordenador: no modificar sus directorios.
- No presentar las heurísticas como mejoras educativas demostradas ni afirmar exclusividad mundial.
- Una fase por sesión; anunciar los comandos de git; sin push salvo petición.
