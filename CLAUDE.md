# CLAUDE.md — RADAR v2 (Hack4Edu 2026 · ProFuturo)

Especificación que manda. Sustituye a la versión anterior (ESO / ecuaciones). Si un prompt contradice este archivo, para y pregunta.

## 1. Qué es RADAR (una frase)

**RADAR detecta qué parte de cada tema le cuesta a cada alumno de primaria y le da ejercicios para esa parte. Funciona sin internet y se adapta a alumnos con dislexia, TDAH, baja visión o discapacidad auditiva.**

Contexto: escuelas de entornos vulnerables (Latinoamérica, África, Asia) como las de ProFuturo. Tablets o portátiles sencillos, a menudo sin conexión, docentes con poco tiempo y aulas grandes.

## 2. Principio de diseño: simple

La profesora asesora pidió quitar la "información basura". Reglas:
- **3 pantallas principales:** Alumno (hacer test y practicar), Profesor (ver la clase) y Ajustes del profesor (alumnos, perfiles de accesibilidad, PIN).
- **El docente nunca ve** probabilidades, bits, priors, planes A/B ni avisos técnicos. Ve un **semáforo**:
  - 🟢 **Lo domina**: P ≥ 0.7.
  - 🟡 **Aún no está claro**: entre 0.3 y 0.7, o menos de 2 respuestas de esa subhabilidad.
  - 🔴 **Necesita refuerzo**: P ≤ 0.3.
  Los umbrales son configurables y se marcan como SUPUESTO.
- Un texto que no ayuda a decidir algo en 3 segundos, sobra.
- El benchmark y los detalles matemáticos se quedan en el código y en `docs/`, **no en la interfaz**.

## 3. Contenido

- Temario completo en `docs/TEMARIO.md`: 6 cursos × 3 bloques (NUM, LEE y PEN) × 5 temas, cada tema con 2–3 subhabilidades. Inglés queda fuera.
- **Fábricas de preguntas:** cada subhabilidad tiene uno o más generadores `(rng, dificultad) => Pregunta`. Con una semilla dan siempre la misma pregunta, y con otra semilla, una distinta.
  - NUM: la respuesta correcta **se calcula en código**, nunca se escribe a mano.
  - LEE: textos cortos escritos para RADAR (originales, nunca copiados) y plantillas con variables (nombres, objetos, lugares). Cada texto lleva sus preguntas.
  - PEN: plantillas de situaciones con una única respuesta defendible.
- **Formatos:** opción múltiple (3–4 opciones), número a escribir, o tocar la imagen correcta. Imágenes en **SVG propio y simple** (manzana, moneda, lápiz, figuras…), dibujado en código, sin recursos externos.
- **Neutralidad cultural:** nombres diversos y neutros; dinero en "monedas" genéricas (sin divisa de un país); sin religión ni comida específica de una cultura; situaciones de entornos rurales y urbanos.
- **Cada pregunta incluye:** `id`, `subhabilidad`, `dificultad (1–3)`, `enunciado`, `enunciadoFacil` (frases cortas, para dislexia), `imagen?`, `opciones?`, `respuestaCorrecta`, `pista` y `explicacion` (una o dos frases, lenguaje de niño). Además `slip` y `guess` como SUPUESTO; `guess` = 1/nº de opciones, o 0.05 si es respuesta abierta.
- **Calidad:** ninguna pregunta ambigua. Si en PEN dos respuestas son defendibles, la plantilla se descarta.

## 4. Tests

- **Test de tema:** 10 preguntas sobre sus subhabilidades.
- **Test de repaso:** temas 1–3 del bloque, 12 preguntas.
- **Test final:** temas 1–5 del bloque, 15 preguntas.
- **Selección adaptativa:** el motor elige cada pregunta de un banco de candidatas (unas 30 por test, generadas con semilla) por ganancia de información esperada. No repite preguntas y desempata siempre igual. En los tests mezclados se garantiza un mínimo de 2 preguntas por tema.

## 5. Motor (se reutiliza lo que ya existe)

- **Se mantiene:** DINA, Bayes exacto sobre la conjunta, EIG, PRNG con semilla, funciones puras y tests.
- **Se generaliza de 6 competencias fijas a K habilidades por test:**
  - en un test de tema, K = subhabilidades del tema (2–3, como mucho 8 estados);
  - en un test mezclado, K = temas del test (3–5, como mucho 32 estados).
- **Prior compatible con prerrequisitos activado por defecto.** Dentro de un tema, las subhabilidades están en orden (a → b → c); en un mezclado, los temas también (T1 → T2…). El factor ε es un SUPUESTO. Esto arregla lo que salió en la prueba manual: que todos los alumnos reciban las mismas 5 primeras preguntas, y el resultado "domina jerarquía pero no negativos".
- **Resultado por alumno y test:** semáforo por subhabilidad (o por tema en los mezclados) y lista de subhabilidades 🔴.
- **Refuerzo** (lo que el usuario llama "el cerebro"): no se guardan todas las combinaciones. Por cada subhabilidad 🔴 se genera un **paquete de práctica**: 6 ejercicios de fácil a difícil, con pista y explicación. Al acabarlo, un **mini-test de 3 preguntas** actualiza el semáforo.
- **Recomendación al profesor:** "Mañana explica primero **X**", donde X es la subhabilidad con más 🔴 **entre los alumnos que han hecho el test**. Los alumnos sin respuestas **no cuentan nunca**. Empate: la subhabilidad anterior en el orden del tema. Se acompaña de **grupos**: alumnos agrupados por la subhabilidad que más necesitan.

## 6. Accesibilidad (perfiles que activa el profesor por alumno)

Las preguntas son **las mismas**. Cambia la presentación.

| Perfil | Qué cambia |
|---|---|
| Dislexia | Botón "Escuchar" (Web Speech API, voz local), `enunciadoFacil`, letra grande con más interlineado, sin cursivas ni mayúsculas seguidas |
| TDAH | Una pregunta por pantalla sin elementos extra, bloques de 5 con pausa opcional, barra de progreso, test dividido en 2 partes si es largo |
| Baja visión | Letra al 150 %, alto contraste, botones grandes, todo se puede escuchar |
| Discapacidad auditiva | Nada depende del sonido: aciertos y fallos con icono y texto |

- Se pueden combinar. **No se guarda el diagnóstico**, solo las ayudas activas.
- Si la voz no está disponible en el dispositivo, el botón se oculta (sin errores).

## 7. Roles

- Al iniciar: **"Soy alumno"** o **"Soy profesor"**.
- **Profesor:** PIN de 4 dígitos. La primera vez se crea; se guarda con hash (SHA-256 de Web Crypto) en localStorage.
- **Alumno:** elige su nombre de la lista de la clase y ve solo los tests asignados y su práctica.
- Las rutas de profesor no se abren sin PIN. Limitación conocida, que se documenta: sin servidor, la protección es local y no es seguridad fuerte.

## 8. Técnica

- React + Vite + TypeScript estricto. Sin backend. **Funciona offline**: PWA con service worker si da tiempo; como mínimo, cero peticiones de red en ejecución.
- Datos en localStorage: clase, alumnos, perfiles, asignaciones y resultados. Botón "Restablecer demo".
- **Datos de demo:** una clase de 2.º de primaria con 20 alumnos simulados (ids ficticios, nombres neutros) y resultados en 2–3 temas, más alumnos vacíos para hacer la prueba en directo.
- Sin `Math.random()` en motor ni contenido: todo pasa por `rng.ts`.
- Rendimiento: debe ir fluido en una tablet modesta. Nada de cálculos pesados en el render.

## 9. Versión anterior (v1, ESO) y qué se reutiliza

- **La v1 no se toca:** queda intacta en la etiqueta git `v1-eso` y en su rama de origen (`frontend/claude-alternativa`). Todo el trabajo de v2 va en la rama `radar-v2`. Si v2 no sale adelante, se vuelve a v1 con `git checkout v1-eso`.
- **En `radar-v2` se borra:** banco de ESO, motor de 6 competencias fijas (`src/engine` con SKILL_ORDER y STATE_COUNT=64), simulador, benchmark, pantallas Planes, Benchmark, Actividades, Docente y Clase, mapa de conocimiento y sus tests. Siguen disponibles en v1 por si el jurado pregunta por la validación.
- **Se reutiliza y adapta:**
  - las matemáticas de `dina.ts`, `bayes.ts`, `entropy.ts` y `selection.ts`, reescritas para K habilidades variables en `src/core/`;
  - `simulation/rng.ts`, que pasa a `src/core/rng.ts`;
  - `services/persistence.ts`, `services/speech.ts`, `services/preferences.ts`, `components/ReadAloud.tsx`, `components/ui.tsx`, `components/theme.ts`, `components/art.tsx`, fuentes y estilos, que encajan con los perfiles de accesibilidad.

## 10. Reglas de trabajo

1. TypeScript `strict`, sin `any` y sin `@ts-ignore`. Funciones puras en el motor.
2. **Ejecuta los tests de verdad** y pega el resumen real. No digas que algo funciona sin haberlo ejecutado.
3. Todo parámetro no calibrado se marca como **SUPUESTO**.
4. Commit al final de cada etapa, para que siempre quede una versión que funcione. No hagas push sin permiso y anuncia los comandos de git antes de ejecutarlos.
5. Respuestas breves: qué has hecho, salida real de los tests y dudas.
6. Si algo no está fijado aquí, pregunta.

## 11. Tests obligatorios

- **Generadores:**
  - misma semilla, misma pregunta;
  - la respuesta correcta es correcta (recalculada en NUM);
  - sin opciones duplicadas y con la correcta entre ellas;
  - 0 < guess < 1 − slip;
  - cada subhabilidad del TEMARIO tiene al menos un generador.
- **Cobertura:** los 126 tests se pueden montar con su número de preguntas sin repetir.
- **Motor:** Bayes con K variable (caso calculado a mano); EIG ≥ 0; el prior con prerrequisitos hace que las primeras preguntas cambien según las respuestas.
- **Semáforo y recomendación:** los alumnos sin respuestas no cuentan; caso construido a mano.
- **Refuerzo:** el paquete solo contiene la subhabilidad 🔴, ordenado por dificultad.
- **Roles:** sin PIN no se accede a las rutas del profesor.
- **Accesibilidad:** con el perfil de dislexia se muestra `enunciadoFacil`; con auditiva, ningún feedback depende del audio.
