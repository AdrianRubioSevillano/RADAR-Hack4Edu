# Decisiones de RADAR v2

Decisiones tomadas durante la construcción de v2 que CLAUDE.md no fija del todo. Lo marcado como SUPUESTO no está calibrado con datos reales.

## Proceso

- **Borrado de v1 en la Etapa 3, no en la 1.** `src/engine`, `src/simulation` y `src/benchmarks` los importa toda la app de v1. Borrarlos en la Etapa 1 rompería la build hasta la Etapa 3, y la regla es que cada commit funcione. Se borran junto con las pantallas viejas. El resultado final es el mismo.
- **`docs/PROMPT_UNICO.md`** se conserva: estaba sin seguimiento en `RADAR_V2/` y quitar la carpeta lo habría perdido sin remedio.
- **`docs/engine`, `docs/app` y `docs/capturas`** se quedan como documentación histórica de v1. CLAUDE.md §2 deja el benchmark y las matemáticas en `docs/`. No describen v2.

## Motor

- **ε = 0,1** (SUPUESTO): peso de los estados incompatibles con el orden de prerrequisitos. Se aplica una vez por estado. Las habilidades forman una cadena, así que un estado es compatible si lo dominado es un prefijo.
- **p0 = 0,5** (SUPUESTO): probabilidad a priori de dominar cada habilidad, antes de aplicar ε.
- **Mínimo de 2 preguntas por habilidad también en los tests de tema.** CLAUDE.md solo lo exige en los mezclados, pero con menos de 2 respuestas el semáforo queda en 🟡 por definición, así que sin esto un test de 10 preguntas podría no decir nada de una subhabilidad.
- **Transición de aprendizaje en el mini-test** (SUPUESTO, 0,5). El modelo DINA no tiene tiempo: sin esto, un alumno muy en 🔴 no podría salir nunca con 3 aciertos, aunque haya aprendido. Al terminar la práctica, cada estado sin esa habilidad pasa a tenerla con probabilidad 0,5, y después las 3 respuestas actualizan la conjunta. Con 3 aciertos sale del 🔴; con 3 fallos, no.
- **Generación del paquete:** primero ejercicios nuevos de otra plantilla, después nuevos, y solo en último extremo repetidos.
