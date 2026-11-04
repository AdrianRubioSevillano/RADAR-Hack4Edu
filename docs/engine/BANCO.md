# Banco de preguntas RADAR

Banco incluido en `src/engine/questionBank.ts` como `RADAR_QUESTION_BANK`: 30 preguntas, cinco por competencia principal, 18 de opción múltiple y 12 numéricas. 8 son multicompetencia.

El nivel previsto es 1.º–2.º ESO, **pendiente de revisión docente**. El banco no tiene validación curricular ni pedagógica, y no se ha comprobado su precisión diagnóstica.

## Preguntas

La columna Solución da el id y el texto de la opción correcta, o la respuesta canónica si la pregunta es numérica.

| ID | Enunciado | Principal | Secundarias | Formato | Dif. | Solución | slip | guess |
|---|---|---|---|---|---|---|---|---|
| OPS-01 | Calcula: 47 + 38. | OPS | — | Opción múltiple | 1 | c: `85` | 0.05 | 0.25 |
| OPS-02 | Calcula: 9·8. | OPS | — | Numérica | 1 | `72/1` | 0.05 | 0.02 |
| OPS-03 | Calcula: 304 - 178. | OPS | — | Opción múltiple | 2 | d: `126` | 0.10 | 0.25 |
| OPS-04 | Se reparten 144 cromos a partes iguales entre 6 amigos. ¿Cuántos cromos recibe cada uno? | OPS | — | Numérica | 2 | `24/1` | 0.10 | 0.02 |
| OPS-05 | Una caja tiene 24 filas con 15 lápices en cada fila. ¿Cuántos lápices hay en 3 cajas? | OPS | — | Opción múltiple | 3 | b: `1080` | 0.20 | 0.25 |
| NEG-01 | Calcula: -5 + 8. | NEG | — | Opción múltiple | 1 | a: `3` | 0.05 | 0.25 |
| NEG-02 | Calcula: (-3)·(-4). | NEG | — | Numérica | 1 | `12/1` | 0.05 | 0.02 |
| NEG-03 | Calcula: 4 - (-6). | NEG | — | Opción múltiple | 2 | c: `10` | 0.10 | 0.25 |
| NEG-04 | Un termómetro marca -4 °C por la mañana. Al mediodía la temperatura ha subido 9 °C. ¿Qué temperatura marca, en °C? | NEG | — | Numérica | 2 | `5/1` | 0.10 | 0.02 |
| NEG-05 | Calcula: (-2)·(-3)·(-4). | NEG | — | Opción múltiple | 3 | d: `-24` | 0.20 | 0.30 |
| FRA-01 | Simplifica la fracción 18/24 hasta hacerla irreducible. | FRA | — | Opción múltiple | 1 | b: `3/4` | 0.05 | 0.25 |
| FRA-02 | Calcula: 2/3 · 9/4. | FRA | — | Numérica | 2 | `3/2` | 0.10 | 0.02 |
| FRA-03 | Calcula: 1/2 + 1/3. | FRA | — | Opción múltiple | 2 | a: `5/6` | 0.10 | 0.25 |
| FRA-04 | Calcula: 1/4 - 5/6. | FRA | NEG | Numérica | 3 | `-7/12` | 0.20 | 0.02 |
| FRA-05 | Calcula: 3/4 : 5/8. | FRA | — | Opción múltiple | 3 | d: `6/5` | 0.20 | 0.25 |
| JER-01 | Calcula: 7 + 3·2. | JER | — | Opción múltiple | 1 | c: `13` | 0.05 | 0.25 |
| JER-02 | Calcula: 20 - 12 : 4. | JER | — | Numérica | 1 | `17/1` | 0.05 | 0.02 |
| JER-03 | Calcula: 2·(5 + 3) - 4. | JER | — | Opción múltiple | 2 | a: `12` | 0.10 | 0.25 |
| JER-04 | Calcula: -2 + 3·(-4). | JER | NEG | Numérica | 2 | `-14/1` | 0.10 | 0.02 |
| JER-05 | Calcula: 1/2 + 1/3 · 3/4. | JER | FRA | Opción múltiple | 3 | b: `3/4` | 0.20 | 0.25 |
| ALG-01 | Simplifica: 3x + 2x. | ALG | — | Opción múltiple | 1 | a: `5x` | 0.05 | 0.25 |
| ALG-02 | Simplifica 4x + 3 - x + 2 y escribe el coeficiente de x del resultado. | ALG | — | Numérica | 1 | `3/1` | 0.05 | 0.05 |
| ALG-03 | Simplifica: 2(x + 3) + x. | ALG | — | Opción múltiple | 2 | b: `3x + 6` | 0.10 | 0.25 |
| ALG-04 | Simplifica: 3x - (x - 4). | ALG | NEG | Opción múltiple | 2 | d: `2x + 4` | 0.10 | 0.25 |
| ALG-05 | Simplifica x/2 + x/3 y escribe el coeficiente de x del resultado. | ALG | FRA | Numérica | 3 | `5/6` | 0.20 | 0.02 |
| ECU-01 | Resuelve: 2x + 3 = 11. | ECU | — | Opción múltiple | 1 | c: `4` | 0.05 | 0.25 |
| ECU-02 | Resuelve: 3x - 4 = 17. | ECU | — | Numérica | 1 | `7/1` | 0.05 | 0.02 |
| ECU-03 | Resuelve: 3(x - 2) = 12. | ECU | ALG | Opción múltiple | 2 | a: `6` | 0.10 | 0.25 |
| ECU-04 | Resuelve: 5x + 3 = 2x - 9. | ECU | NEG | Numérica | 2 | `-4/1` | 0.10 | 0.02 |
| ECU-05 | Resuelve: x/2 + 1/3 = 5/6. | ECU | FRA | Opción múltiple | 3 | d: `1` | 0.20 | 0.25 |

## Distractores

Cada distractor corresponde a un error identificable. La columna Valor da el racional canónico de la opción, si representa un número.

| ID | Opción | Texto | Valor | Error que lo produce |
|---|---|---|---|---|
| OPS-01 | a | `75` | `75/1` | Olvida la llevada de las unidades a las decenas. |
| OPS-01 | b | `715` | `715/1` | Escribe la suma de cada columna sin llevar: 4 + 3 y 7 + 8. |
| OPS-01 | d | `9` | `9/1` | Resta en lugar de sumar. |
| OPS-03 | a | `226` | `226/1` | Pide prestado a las centenas sin descontarlo después. |
| OPS-03 | b | `136` | `136/1` | Trata el cero de las decenas como 10 y no como 9 tras prestar. |
| OPS-03 | c | `274` | `274/1` | Resta en cada columna la cifra menor de la mayor. |
| OPS-05 | a | `432` | `432/1` | No desplaza el producto parcial de las decenas: 24·15 da 144. |
| OPS-05 | c | `360` | `360/1` | Calcula una sola caja y olvida multiplicar por 3. |
| OPS-05 | d | `42` | `42/1` | Suma los datos en lugar de multiplicarlos. |
| NEG-01 | b | `-3` | `-3/1` | Conserva el signo del primer número. |
| NEG-01 | c | `-13` | `-13/1` | Suma los valores absolutos y pone signo negativo. |
| NEG-01 | d | `13` | `13/1` | Ignora el signo y suma los valores absolutos. |
| NEG-03 | a | `-2` | `-2/1` | Trata - (-6) como - 6. |
| NEG-03 | b | `2` | `2/1` | Ignora los signos y calcula la diferencia de valores absolutos. |
| NEG-03 | d | `-10` | `-10/1` | Suma bien los valores absolutos y da signo negativo al resultado. |
| NEG-05 | a | `24` | `24/1` | Cree que el producto de números negativos siempre es positivo. |
| NEG-05 | b | `-9` | `-9/1` | Suma los factores en lugar de multiplicarlos. |
| NEG-05 | c | `9` | `9/1` | Suma los valores absolutos y descarta los signos. |
| FRA-01 | a | `9/24` | `3/8` | Divide solo el numerador entre 2. |
| FRA-01 | c | `12/18` | `2/3` | Resta 6 al numerador y al denominador en lugar de dividir. |
| FRA-01 | d | `4/3` | `4/3` | Invierte la fracción al simplificar. |
| FRA-03 | b | `2/5` | `2/5` | Suma numeradores entre sí y denominadores entre sí. |
| FRA-03 | c | `2/6` | `1/3` | Suma los numeradores y multiplica los denominadores sin ajustar. |
| FRA-03 | d | `1/6` | `1/6` | Multiplica las fracciones en lugar de sumarlas. |
| FRA-05 | a | `15/32` | `15/32` | Multiplica las fracciones sin invertir la segunda. |
| FRA-05 | b | `5/6` | `5/6` | Invierte la primera fracción en lugar de la segunda. |
| FRA-05 | c | `32/15` | `32/15` | Invierte las dos fracciones. |
| JER-01 | a | `20` | `20/1` | Opera de izquierda a derecha: (7 + 3)·2. |
| JER-01 | b | `12` | `12/1` | Suma todos los números. |
| JER-01 | d | `42` | `42/1` | Multiplica todos los números. |
| JER-03 | b | `9` | `9/1` | Ignora el paréntesis: 2·5 + 3 - 4. |
| JER-03 | c | `8` | `8/1` | Extiende el paréntesis hasta el final: 2·(5 + 3 - 4). |
| JER-03 | d | `16` | `16/1` | Omite la resta final. |
| JER-05 | a | `5/8` | `5/8` | Opera de izquierda a derecha: (1/2 + 1/3) · 3/4. |
| JER-05 | c | `3/10` | `3/10` | Opera de izquierda a derecha y suma numeradores y denominadores. |
| JER-05 | d | `1/4` | `1/4` | Hace la multiplicación y olvida sumar 1/2. |
| ALG-01 | b | `5x²` | — | Suma los coeficientes y también los exponentes. |
| ALG-01 | c | `6x` | — | Multiplica los coeficientes en lugar de sumarlos. |
| ALG-01 | d | `5` | `5/1` | Suma los coeficientes y elimina la x. |
| ALG-03 | a | `3x + 3` | — | Multiplica solo el primer término del paréntesis. |
| ALG-03 | c | `3x + 5` | — | Suma 2 + 3 en lugar de multiplicar 2·3. |
| ALG-03 | d | `9x` | — | Junta términos que no son semejantes. |
| ALG-04 | a | `2x - 4` | — | No cambia el signo del segundo término del paréntesis. |
| ALG-04 | b | `4x + 4` | — | No cambia el signo del primer término del paréntesis. |
| ALG-04 | c | `6x` | — | Junta términos que no son semejantes. |
| ECU-01 | a | `7` | `7/1` | Pasa el 3 sumando: 2x = 14. |
| ECU-01 | b | `8` | `8/1` | Resta 3 y olvida dividir entre 2. |
| ECU-01 | d | `14` | `14/1` | Pasa el 3 sumando y olvida dividir entre 2. |
| ECU-03 | b | `14/3` | `14/3` | Multiplica solo el primer término: 3x - 2 = 12. |
| ECU-03 | c | `2` | `2/1` | Pasa el 6 restando: 3x = 12 - 6. |
| ECU-03 | d | `18` | `18/1` | Llega a 3x = 18 y olvida dividir entre 3. |
| ECU-05 | a | `1/4` | `1/4` | Llega a x/2 = 1/2 y divide entre 2 en lugar de multiplicar. |
| ECU-05 | b | `7/3` | `7/3` | Pasa 1/3 sumando: x/2 = 7/6. |
| ECU-05 | c | `1/2` | `1/2` | Llega a x/2 = 1/2 y olvida despejar la x. |

## SUPUESTOS

Ninguno de estos valores está calibrado con datos reales.

| Elemento | SUPUESTO |
|---|---|
| `slip` | 0.05, 0.10 o 0.20 para dificultad 1, 2 o 3. |
| `guess` en opción múltiple | 0.25 por tener cuatro opciones. Sube a 0.30 en NEG-05, porque los distractores `9` y `-9` son débiles. |
| `guess` en respuesta numérica | 0.02, explícito por pregunta. Sube a 0.05 en ALG-02, porque el coeficiente es un entero pequeño. |
| `difficulty` | Ordinal `1 \| 2 \| 3`, asignado por criterio propio. No es una calibración psicométrica. |
| `secondarySkills` | Ver el criterio siguiente. |

### Criterio para las competencias secundarias

Una competencia es secundaria si un fallo en ella bastaría, por sí solo, para fallar el ítem. Los ancestros del grafo no se copian de forma automática.

Los cálculos elementales no cuentan como exigencia de `OPS`. Por ejemplo, `(-3)·(-4)` usa un producto de una cifra, pero su dificultad es la regla de los signos. Es una decisión de modelado que debe revisar un docente, porque `R_q` determina qué evidencia aporta cada respuesta.

Una competencia secundaria puede no ser ancestro de la principal. `FRA` es secundaria en JER-05 y no es ancestro de `JER`.

## Respuestas numéricas

`correctAnswer` se guarda en forma canónica `numerador/denominador`: fracción reducida y denominador positivo, con `5/1` para el entero cinco y `0/1` para el cero. La entrada del alumno admite enteros y fracciones equivalentes, según la gramática de §4 de `CLAUDE.md`.

La forma canónica no sustituye a los ids de opción: en opción múltiple, `correctAnswer` es un id. Si una opción representa un número, `value` guarda su racional canónico además del texto. Así se detectan opciones equivalentes con textos distintos, como `1/2` y `2/4`.

## Comprobaciones

- `validateQuestionBank(bank, graph)` hace la validación estructural de cualquier banco. Un banco vacío es válido. Las exigencias de 30 preguntas, cinco por competencia y seis multicompetencia se comprueban en los tests solo para el banco RADAR.
- `tests/engine/questionBank.math.test.ts` recalcula cada respuesta con aritmética racional exacta a partir de los datos del enunciado, sin mirar `correctAnswer`. En los ítems algebraicos compara coeficiente a coeficiente, lo que demuestra la equivalencia para todo valor de `x`.
- Los tests comprueban que cada distractor tiene un error descrito y que no coincide con la solución. No recalculan que el procedimiento descrito produzca exactamente ese valor.
