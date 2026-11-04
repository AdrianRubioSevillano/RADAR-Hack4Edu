# Nota de revisión: Fase 3

Esta nota acompaña al ZIP y no forma parte del repositorio.

## Commit y entorno

- Rama `motor`, `HEAD` en `69334b2` (`docs: corregir ejemplo de precision numerica`).
- El código de la Fase 3 está en `096371f` (`feat(engine): seleccion adaptativa y registro de respuestas`). `69334b2` solo cambia una frase de `docs/engine/MATEMATICAS.md` y un comentario de `tests/engine/selection.test.ts`.
- Node 26.0.0 y npm 11.12.1.
- Dependencias de desarrollo instaladas: `typescript` 7.0.2, `vitest` 5.1.0 y `@types/node` 26.6.6. El ZIP incluye `package-lock.json`.
- Solo se ha comprobado con Node 26. No se afirma compatibilidad con otras versiones.

Para reproducir, en la carpeta extraída:

```bash
npm ci
```
```bash
npm run typecheck
```
```bash
npm test
```

## Última ejecución de typecheck y tests

**No es una ejecución nueva.** Es la salida obtenida justo antes del commit `096371f`. No se repitió para `69334b2`, porque solo cambia documentación y un comentario.

```text
$ npm run typecheck

> radar-hack4edu@0.0.0 typecheck
> tsc --project tsconfig.engine.json

exit: 0

$ npm test

> radar-hack4edu@0.0.0 test
> vitest run


 RUN  v5.1.0 /Users/administrador/Desktop/RADAR-Hack4Edu


 Test Files  11 passed (11)
      Tests  501 passed (501)
   Start at  13:50:40
   Duration  481ms (tests 44%, transform 34%, import 19%, worker 3%)

exit: 0
```

Estos resultados prueban que la selección y el registro cumplen las reglas de `CLAUDE.md`. No prueban calibración, precisión diagnóstica ni eficacia educativa.

## Caso numérico de los errores relativos

`MATEMATICAS.md` cita dos errores relativos: `2.13e-5` y `7.73e-7`. Son resultados de este caso concreto, no garantías generales de precisión.

**Entrada.** `s = 1e-12`, en doble precisión.

**Función medida.** `binaryEntropy(p) = t(p) + t(1 − p)`, con `t(x) = −x·log2(x)` y `t(0) = 0`. Son dos llamadas:

- Partiendo de `s`: `binaryEntropy(1e-12)`.
- Partiendo de `1 - s`: `binaryEntropy(1 - 1e-12)`.

**Referencia.** `ref = s·log2(1/s) + s/ln(2)`, evaluada en doble precisión con `s * Math.log2(1 / s) + s / Math.LN2`.

Es una aproximación de `H_b(s)` para `s` muy pequeño, no un valor exacto. Omite términos de orden `s²`, cuyo efecto relativo es del orden de `1e-12`, muy inferior a los errores medidos.

**Fórmula del error.** `error relativo = |H − ref| / ref`.

**Valores obtenidos.**

| Magnitud | Valor |
|---|---|
| `s` | `1e-12` |
| `1 - s` en doble precisión | `0.999999999999` |
| `1 - (1 - s)` en doble precisión | `9.999778782798785e-13` |
| `ref` | `4.130583217953731e-11` |
| `H` partiendo de `s` | `4.130580026464068e-11` |
| `H` partiendo de `1 - s` | `4.1304950338020633e-11` |
| Error relativo partiendo de `s` | `7.726486781471344e-7` |
| Error relativo partiendo de `1 - s` | `2.1349080024466537e-5` |

**Interpretación.** Partiendo de `1 - s`, la probabilidad pequeña se reconstruye como `1 - (1 - s)`, con un error relativo cercano a `2.2e-5`, y ese valor domina la entropía. Partiendo de `s`, ese término es exacto: solo queda el error de calcular `t(1 - s)`, que pesa mucho menos.

Por eso `pairEntropy` usa la menor de las dos probabilidades. Reduce la pérdida de precisión, pero no la elimina. El test asociado exige un error relativo menor que `1e-5`: la versión con `1 - s` lo incumple y la actual lo cumple.

**Corrección de la documentación.** Una versión anterior decía “cercano a `1e-4`”. Era una estimación mía, no una medida, y se corrigió en `69334b2`.

## Limitaciones de la Fase 3

**Numéricas**

- La reducción esperada por competencia no corrige sus residuos de redondeo, a diferencia de la EIG. Puede salir un valor mínimamente negativo.
- La tolerancia de empate de `1e-12` es absoluta. Dos candidatas casi empatadas se deciden por `id` aunque una sea algo mejor.
- Una rama hipotética con masa menor que `1e-300` hace fallar toda la selección con `INVALID_NORMALIZATION`, aunque el resto de candidatas sean válidas. Solo ocurre con parámetros extremos.

**Modelo**

- La EIG optimiza la información bajo el modelo supuesto. Sin parámetros calibrados, no demuestra que las preguntas elegidas sean mejores con alumnos reales.
- `R_q`, `slip` y `guess` siguen siendo SUPUESTOS no validados.
- No hay criterio de parada: la selección continúa hasta agotar el banco.

**Validación**

- El historial se comprueba contra el banco, no contra `joint`. Es lo acordado: no se reconstruye el posterior ni se compara con el prior. Un estado manipulado con un `joint` válido no se detecta.
- `priorConfig` es procedencia y no se compara con el posterior.
- `selectNextQuestion` valida el banco contra `KNOWLEDGE_GRAPH`. No admite un grafo distinto.
- `fixedQuestionOrder` lanza un `TypeError`, no un error tipado, si recibe un banco nulo.
- `validateQuestionBank` sigue sin detectar opciones algebraicas equivalentes con textos distintos.

**Integración y rendimiento**

- `QuestionSelection.question` incluye `correctAnswer`. Si se manda a un cliente de alumno, hay que quitarlo.
- Cada selección incluye dos posteriores de 64 valores por candidata.
- Una selección con 30 candidatas tardó 1.58 ms de media en una medida puntual de 200 llamadas, en esta máquina. Cada llamada revalida banco y estado. Hay que medirlo de nuevo en la Fase 7.
- `bestCandidateId`, `checkedEig` y `pairEntropy` se exportan desde `selection.ts` para los tests, pero no desde `index.ts`.
- En opción múltiple el `id` se compara de forma exacta, sin recortar espacios.

## Fuera de esta fase

No existen el diagnóstico de clase, las intervenciones, la simulación ni los benchmarks.
