# RADAR v2 · Prompts para Claude Code

## Antes de empezar (5 minutos, a mano)
1. En la carpeta del proyecto, sustituye `CLAUDE.md` por el nuevo.
2. Crea la carpeta `docs/` si no existe y mete dentro `TEMARIO.md`.
3. Abre Claude Code en la carpeta y pega los prompts **en orden, uno por sesión**. Cuando termine una fase, cierra la sesión y abre otra para la siguiente.
4. Después de cada fase, pégame la respuesta de Claude Code y te digo si está bien y qué sigue.

## Plan hasta el viernes

| Cuándo | Fase | Qué |
|---|---|---|
| Miércoles noche | 0 | Revisión del código actual y plan (sin programar) |
| Jueves mañana | 1 | Modelo de contenido + generadores de NUM (6 cursos) |
| Jueves mediodía | 2 | Generadores de LEE y PEN |
| Jueves tarde | 3 | Motor generalizado + semáforo + refuerzo |
| Jueves noche | 4 | Pantalla de alumno + accesibilidad |
| Viernes mañana | 5 | Pantalla de profesor + PIN + borrar lo viejo |
| Viernes | 6 | Datos de demo, pruebas finales y guion |

**En paralelo con los compañeros:** cuando acabe la Fase 0 ya existen los tipos (el "contrato"). Desde ahí, un compañero puede hacer las pantallas (fases 4 y 5) mientras tú haces el contenido y el motor (fases 1–3), cada uno en su rama. Si trabajas solo, sigue el orden.

---

## Fase 0 — Revisión y plan (sin código)
```
Lee CLAUDE.md (versión 2, sustituye a la anterior) y docs/TEMARIO.md enteros. Después revisa el código actual del repositorio.

Responde SOLO con:
1. Qué partes actuales se reutilizan tal cual (motor, rng, tests…), cuáles se adaptan y cuáles se borran (sección 9 de CLAUDE.md). Lista de archivos en cada grupo.
2. Los tipos nuevos que propones (Pregunta, Generador, Subhabilidad, Tema, Test, ResultadoAlumno, Semaforo, PaqueteRefuerzo, PerfilAccesibilidad, Rol…) con sus campos. Este será el contrato con el frontend.
3. La estructura de carpetas final.
4. Riesgos para acabar antes del viernes y qué recortarías primero si no da tiempo.
5. Dudas sobre CLAUDE.md o TEMARIO.md.

No escribas código ni instales nada. Crea una rama nueva "radar-v2" desde la rama actual (dime antes el comando) y haz commit solo de CLAUDE.md y docs/TEMARIO.md: "docs: especificacion RADAR v2".
```

## Fase 1 — Contenido NUM (Números para la vida)
```
Fase 1 según CLAUDE.md, secciones 3 y 11, y docs/TEMARIO.md, bloque NUM.

1. Crea los tipos de contenido (los acordados en la Fase 0) y el registro del temario: cursos, bloques, temas y subhabilidades con ids estables.
2. Crea los componentes SVG simples de imágenes (manzana, moneda, lápiz, figuras, reloj…) en una carpeta propia. Sin recursos externos.
3. Implementa los generadores de TODAS las subhabilidades del bloque NUM, de 1.º a 6.º. La respuesta correcta se calcula en código. Dificultad 1–3. Los distractores salen de errores típicos (por ejemplo, olvidar llevarse una).
4. Cada pregunta con enunciado, enunciadoFacil, pista y explicación en lenguaje de niño, dinero en "monedas" genéricas y nombres neutros.
5. Script que genere docs/MUESTRA_NUM.md con 2 preguntas de ejemplo por subhabilidad (enunciado, opciones, respuesta, explicación), para que una persona lo revise.

Tests: los de generadores de la sección 11, solo para NUM.
Ejecuta los tests y pega el resumen real. Dime cuántos generadores hay por curso. Commit: "feat: generadores NUM".
```

## Fase 2 — Contenido LEE y PEN
```
Fase 2: igual que la Fase 1, pero para los bloques LEE (Leer y entender) y PEN (Pensar y decidir) de docs/TEMARIO.md.

- LEE: textos cortos ORIGINALES, adecuados a cada curso (1.º: 1–2 frases; 6.º: 150–200 palabras), con plantillas de variables cuando se pueda. Cada texto lleva varias preguntas. Al menos 3 textos distintos por tema.
- PEN: plantillas de situaciones cotidianas con una única respuesta defendible. Si dudas de que una situación tenga una sola respuesta clara, descártala.
- Neutralidad cultural (sección 3 de CLAUDE.md).
- Script para docs/MUESTRA_LEE.md y docs/MUESTRA_PEN.md (2 ejemplos por subhabilidad).

Tests de generadores para LEE y PEN, más el de cobertura: los 126 tests se pueden montar sin repetir preguntas.
Ejecuta los tests y pega el resumen real. Commit: "feat: generadores LEE y PEN".
```

## Fase 3 — Motor generalizado, semáforo y refuerzo
```
Fase 3 según CLAUDE.md, sección 5.

1. Generaliza el motor de 6 competencias fijas a K habilidades por test (subhabilidades en un test de tema, temas en un test mezclado). Mantén Bayes exacto, DINA y EIG.
2. Activa por defecto el prior compatible con prerrequisitos (orden a→b→c dentro del tema, T1→T2… en los mezclados). ε es un SUPUESTO.
3. Montaje de tests: banco de unas 30 candidatas con semilla, 10, 12 o 15 preguntas según el tipo, y mínimo 2 por tema en los mezclados.
4. Semáforo por subhabilidad (umbrales 0.7 y 0.3 como SUPUESTO; 🟡 si hay menos de 2 respuestas).
5. Paquete de refuerzo (6 ejercicios de fácil a difícil) y mini-test de 3 preguntas que actualiza el semáforo.
6. Recomendación al profesor: "Mañana explica primero X" y grupos de alumnos. Los alumnos sin respuestas NO cuentan.
7. Borra el banco de preguntas de ESO y lo que dependa solo de él. El benchmark y el simulador se adaptan o se desactivan sin romper los tests.

Tests de la sección 11 para motor, semáforo, recomendación y refuerzo. Incluye uno que demuestre que, tras fallar la primera pregunta, la segunda cambia respecto a acertarla.
Ejecuta los tests y pega el resumen real. Commit: "feat: motor v2, semaforo y refuerzo".
```

## Fase 4 — Pantalla de alumno y accesibilidad
```
Fase 4 según CLAUDE.md, secciones 2, 6 y 7.

Pantalla de inicio: "Soy alumno" / "Soy profesor".

Flujo del alumno:
1. Elige su nombre de la lista (botones grandes).
2. Ve sus tests asignados (tarjetas grandes con el icono del bloque).
3. Hace el test: una pregunta por pantalla, imagen grande y botones grandes. Feedback inmediato con la explicación.
4. Al terminar: mensaje motivador (sin nota numérica) y "Tus ejercicios para practicar" con los paquetes de sus subhabilidades 🔴.
5. Práctica: los 6 ejercicios con pista y, al final, el mini-test.

Accesibilidad según la tabla de la sección 6, aplicada según el perfil del alumno: voz con Web Speech API (si no hay voz, el botón no aparece), enunciadoFacil, letra y contraste, bloques de 5 con pausa, feedback visual. Navegable con teclado y con etiquetas ARIA.

Diseño: limpio, colores suaves, letra grande, pensado para niños de 6 a 12 años y para tablets. NADA de probabilidades ni textos técnicos.
Pruebas: los tests de accesibilidad de la sección 11. Abre la app y comprueba el flujo completo con un alumno de cada perfil. Dime qué has comprobado.
Commit: "feat: pantalla alumno y accesibilidad".
```

## Fase 5 — Pantalla de profesor, PIN y limpieza
```
Fase 5 según CLAUDE.md, secciones 2, 5, 7 y 9.

1. PIN de profesor (crearlo la primera vez, guardado con hash SHA-256). Sin PIN no se abre ninguna ruta de profesor.
2. Pantalla "Mi clase", UNA sola pantalla:
   - arriba, en grande: "Mañana explica primero: X" y por qué en una frase ("8 de 20 alumnos lo necesitan");
   - grupos de alumnos por lo que necesitan;
   - cuadrícula alumnos × subhabilidades con el semáforo 🟢🟡🔴; al tocar un alumno, su detalle y su práctica.
3. Ajustes: curso de la clase, alumnos (añadir y quitar), perfil de accesibilidad de cada alumno (casillas) y asignar tests (por tema o mezclados).
4. Borra o oculta todo lo de la sección 9: planes A/B, bits, priors, mapas, avisos técnicos y textos repetidos. Una sola nota honesta en "Acerca de".
5. Ningún texto técnico visible para el profesor. Si un texto no le ayuda a decidir algo, quítalo.

Tests de roles y de la recomendación. Abre la app y recorre: profesor asigna un test → alumno lo hace → profesor ve el semáforo y la recomendación.
Commit: "feat: panel profesor, PIN y limpieza".
```

## Fase 6 — Demo y entrega
```
Fase 6:
1. Datos de demo (sección 8): clase de 2.º de primaria con 20 alumnos simulados con resultados en 2–3 temas, más 3 alumnos vacíos para la demo en directo. Dos alumnos con perfiles de accesibilidad (dislexia y baja visión). Botón "Restablecer demo".
2. Comprueba que funciona sin conexión: carga la app, corta la red y recórrela entera. Si da tiempo, conviértela en PWA instalable.
3. Revisa todas las pantallas buscando textos técnicos, botones pequeños o errores, y corrígelos.
4. README corto: qué es RADAR, cómo ejecutarlo, temario (enlace a docs/TEMARIO.md), accesibilidad, limitaciones honestas (parámetros no calibrados, PIN local, temario internacional y no oficial).
5. Ejecuta TODOS los tests y pega el resumen real.
Commit: "chore: demo final".
```

---

## Prompts de apoyo

**Cuando algo falla o se lía:**
```
Para. Resume en 5 líneas: qué intentabas, el error exacto (pégalo), qué has cambiado desde el último commit que funcionaba. No hagas más cambios hasta que te responda.
```

**Antes de cada commit:**
```
Revisa tu trabajo de esta fase contra CLAUDE.md: ¿parámetros sin marcar como SUPUESTO? ¿Textos técnicos visibles para el profesor o el alumno? ¿Algo dado por bueno sin ejecutarlo? ¿Preguntas ambiguas? Corrige lo que encuentres y dime qué has corregido.
```

**Si se acaba el tiempo (recorte por prioridad):**
```
Vamos justos de tiempo. Prioriza en este orden y deja el resto documentado como "siguiente paso":
1) flujo alumno→profesor completo con 2.º de primaria; 2) los 3 bloques de 2.º; 3) perfiles de dislexia y baja visión; 4) el resto de cursos; 5) TDAH y auditiva; 6) PWA.
```
