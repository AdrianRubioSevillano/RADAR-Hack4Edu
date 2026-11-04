# Matemáticas del motor

Este documento cubre lo implementado hasta la Fase 2: modelo DINA, prior, actualización bayesiana exacta, consultas y entropías. La selección de preguntas, el diagnóstico de clase y las intervenciones aún no existen.

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

## Tolerancias y umbrales

| Valor | Uso |
|---|---|
| `1e-9` | Tolerancia numérica de `\|Σπ − 1\|` al aceptar una distribución. Fuera de ella se rechaza, no se corrige. |
| `1e-300` | Masa total mínima para renormalizar (§2.3). Por debajo, o si no es finita, se lanza `INVALID_NORMALIZATION`. |

Una distribución dentro de la tolerancia se acepta sin modificar. La actualización la renormaliza como cualquier otra, y las consultas y `jointEntropy` la interpretan normalizada. Nunca se muta la entrada ni se recortan probabilidades.

No hay clipping global: `0` y `1` se conservan, y un estado con masa cero sigue en cero tras cualquier evidencia.
