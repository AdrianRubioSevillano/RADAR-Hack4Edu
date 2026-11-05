# Arquitectura e integración

## Capas

```text
src/engine        Motor: DINA, posterior exacto, EIG, planes. Sin cambios.
src/simulation    Clase sintética y respuestas. Solo la importa demoClass.ts.
src/benchmarks    Experimento. La aplicación solo importa sus tipos.
src/services      Coordinación tipada y sin React.
src/components    Piezas visuales y estado de React.
src/screens       Pantallas: presentan lo que devuelven los servicios.
```

Los componentes no implementan matemáticas: un test comprueba que no llaman al motor.

## Servicios

| Servicio | Responsabilidad |
|---|---|
| `engine.ts` | Único punto de entrada al motor |
| `demoClass.ts` | Frontera con la simulación. La clase sintética y sus uniformes viven en un cierre léxico: salen ids, nombres y respuestas |
| `session.ts` | Estado serializable y sus transiciones puras |
| `diagnostic.ts` | Proyección de preguntas sin soluciones y registro de respuestas |
| `teacher.ts` | Diagnóstico de clase, ranking, comparación y textos deterministas |
| `radarView.ts` | Datos del radar: reordena valores del motor, sin inferencia nueva |
| `practice.ts`, `practiceBank.ts` | Selección y corrección de la práctica; 36 plantillas |
| `collective.ts` | Actividades para las competencias de un plan |
| `benchmarkLoader.ts`, `benchmarkView.ts` | Carga bajo demanda y vista de los informes |
| `persistence.ts`, `preferences.ts`, `speech.ts` | Almacenamiento local, preferencias y voz |

## Decisiones de integración

- **Historia:** el frontend no tenía commits. Se registró tal cual en `feature/frontend` (`6420927`) y se unió con merge. La exportación original tiene SHA-256 `4a0d9fc9…e3b3`.
- **Motor único:** `vendor/engine-phase3` se retiró; `src/services/engine.ts` reexporta `src/engine`.
- **Gestor único:** npm. Se conservaron las versiones del motor de `typescript`, `vitest` y `@types/node`, y las del frontend para el resto.
- **Tipos:** dos proyectos. `tsconfig.engine.json` para el motor y `tsconfig.json` para la aplicación, con el mismo rigor.
- **Benchmark:** `?url` publica los informes como archivos, sin copiarlos ni incluirlos en el paquete JS. Se descargan al entrar en Evidencia. Nada ejecuta `runBenchmark`.

## Flujo de datos

1. `RadarProvider` carga la sesión, o crea una desde la semilla 42.
2. Las acciones aplican funciones puras de `session.ts` y se guardan en `localStorage`.
3. El diagnóstico y los planes se derivan de la sesión. No se guardan.
4. La simulación avanza alumno a alumno, cediendo el hilo entre ellos, con progreso y cancelación.

## Datos guardados

Solo la sesión observable y las preferencias: `radar.session.v1` y `radar.preferences.v1`. Lo guardado se valida contra la semilla, la clase y el motor; si no es válido se descarta entero y se avisa. La clase vacía de prueba no se guarda.

`trueMastery`, `groupId` y los uniformes nunca entran en el estado, la sesión ni el almacenamiento. Los tests lo comprueban. Los avatares se derivan del número de lista con periodos que no son múltiplos de 3, para no delatar el grupo generador.

## Práctica

- Se priorizan las competencias que el plan activo deja pendientes, de mayor a menor. Lo programado solo completa la lista. Por eso la práctica cambia al cambiar de plan.
- Primero se repasan preguntas falladas y después plantillas, de fácil a difícil.
- Las preguntas que el alumno no ha visto se reservan: usarlas contaminaría el diagnóstico.
- Solo se eligen competencias con evidencia.
- Umbral de necesidad 0,3 y 4 ejercicios por tanda: SUPUESTOS de la aplicación.
- Nada de esto llama a `submitAnswer` ni toca `DiagnosticState`.

## Cambios en el motor

Ninguno. `git diff` frente a `motor` está vacío en `src/engine`, `src/simulation` y `src/benchmarks`.
