Vas a construir RADAR v2 en una sola sesión larga. Trabaja por etapas, con commit al final de cada una, para que siempre quede una versión que funcione.

Archivos de partida (están en la carpeta RADAR_V2/ del repositorio): CLAUDE.md (especificación nueva, manda sobre cualquier otra cosa) y TEMARIO.md (90 temas de primaria). Léelos enteros antes de empezar.

## Reglas de esta sesión
- No preguntes en cada paso: decide según CLAUDE.md y apunta las decisiones en docs/DECISIONES_V2.md. Para solo si algo es imposible o contradictorio.
- Usa subagentes (Task) en paralelo para el contenido (generadores y textos por curso o bloque), para avanzar rápido y no llenar tu contexto. Revisa lo que te devuelvan antes de integrarlo.
- Ejecuta `npm test` y `npm run build` al final de cada etapa. Solo haz commit si pasan. Si una etapa no pasa en un tiempo razonable, recorta alcance (sección "Si no da tiempo") en vez de dejar el repositorio roto.
- Anuncia los comandos de git antes de ejecutarlos. Nunca hagas push.
- Respuesta final breve (ver "Entrega").

## Etapa 0 — Proteger la versión actual
1. Comprueba que estás en `frontend/claude-alternativa` sin cambios pendientes, aparte de la carpeta RADAR_V2/, que es nueva y no tiene seguimiento. Si hay otros cambios, para y avísame.
2. `git tag v1-eso` (la versión actual queda guardada tal cual).
3. `git checkout -b radar-v2`.
4. Mueve RADAR_V2/CLAUDE.md a la raíz (sustituye al actual) y RADAR_V2/TEMARIO.md a docs/TEMARIO.md. Quita la carpeta RADAR_V2/.
5. Commit: "docs: especificacion RADAR v2".

## Etapa 1 — Motor genérico (src/core/)
Según CLAUDE.md, secciones 5 y 9:
- Reescribe en src/core/ las matemáticas de DINA, Bayes exacto, entropía y EIG para K habilidades variables (K ≤ 8). Reutiliza la lógica probada de src/engine.
- rng con semilla en src/core/rng.ts.
- Prior compatible con prerrequisitos (orden de las habilidades), activado por defecto; ε como SUPUESTO.
- Montaje de test (tema 10, repaso 12, final 15; mínimo 2 por tema en los mezclados), selección por EIG sin repetir y con desempate determinista.
- Semáforo (umbrales 0.7 y 0.3, 🟡 si hay menos de 2 respuestas), paquete de refuerzo (6 ejercicios de fácil a difícil) y mini-test de 3 preguntas.
- Recomendación al profesor ("Mañana explica primero X" + grupos). Los alumnos sin respuestas NO cuentan.
- Borra src/engine, src/simulation, src/benchmarks, sus tests y scripts/bench.ts (siguen en v1-eso).
- Tests de la sección 11 que tocan al motor, incluido: tras fallar la primera pregunta, la segunda cambia respecto a acertarla.
Commit: "feat(core): motor generico, semaforo y refuerzo".

## Etapa 2 — Contenido (src/content/)
Según CLAUDE.md, sección 3, y docs/TEMARIO.md:
- Registro del temario con ids estables (6 cursos × NUM/LEE/PEN × 5 temas × subhabilidades).
- Imágenes SVG simples propias (manzana, moneda, lápiz, figuras, reloj, barras…). Reutiliza components/art.tsx si encaja.
- Generadores para TODAS las subhabilidades:
  - NUM: respuesta calculada en código y distractores de errores típicos.
  - LEE: textos ORIGINALES por curso (1.º: 1–2 frases; 6.º: 150–200 palabras), al menos 3 por tema, con sus preguntas.
  - PEN: situaciones con una única respuesta defendible.
- Cada pregunta con enunciado, enunciadoFacil, pista, explicación en lenguaje de niño, slip y guess (SUPUESTO), nombres neutros y "monedas" genéricas.
- Los 126 tests (15 de tema + 6 mezclados por curso).
- Script `npm run muestras` que genere docs/MUESTRA_PREGUNTAS.md con 2 ejemplos por subhabilidad, para revisión humana.
- Tests de generadores y de cobertura (sección 11).
Reparte la escritura entre subagentes por bloque y curso. Antes de integrar, comprueba que no hay preguntas ambiguas ni respuestas mal calculadas.
Commit: "feat(content): temario y generadores de primaria".

## Etapa 3 — App: roles, alumno y profesor
Según CLAUDE.md, secciones 2, 6, 7 y 8:
- Inicio: "Soy alumno" / "Soy profesor". PIN de profesor de 4 dígitos (se crea la primera vez y se guarda con hash SHA-256). Sin PIN no se abre ninguna ruta de profesor.
- **Alumno:** elegir nombre → tests asignados → test (una pregunta por pantalla, imagen y botones grandes, feedback con explicación) → mensaje motivador sin nota → "Tus ejercicios para practicar" → práctica → mini-test.
- **Profesor, UNA pantalla "Mi clase":** arriba en grande "Mañana explica primero: X" con una frase de por qué; grupos de alumnos; cuadrícula alumnos × subhabilidades con 🟢🟡🔴; al tocar un alumno, su detalle.
- **Ajustes del profesor:** curso de la clase, alumnos, perfiles de accesibilidad de cada alumno (dislexia, TDAH, baja visión, auditiva; combinables) y asignación de tests.
- **Perfiles:** aplica la tabla de la sección 6, reutilizando services/preferences.ts, services/speech.ts y ReadAloud. No se guarda diagnóstico, solo las ayudas activas. Si no hay voz, el botón no aparece.
- Borra las pantallas antiguas y sus servicios (Planes, Benchmark, Actividades, Docente, Clase, mapa de conocimiento…). Ningún texto técnico visible: ni probabilidades, ni bits, ni "prior". Una sola nota honesta en "Acerca de".
- **Diseño:** limpio, para niños de 6 a 12 años y tablets, letra grande, colores suaves. Mantén el logo y las fuentes actuales.
- **Datos de demo:** clase de 2.º de primaria con 20 alumnos con resultados en 2–3 temas, más 3 alumnos vacíos para la demo en directo; dos alumnos con perfiles (dislexia y baja visión). Botón "Restablecer demo".
- Tests de roles, recomendación y accesibilidad (sección 11).
Commit: "feat(app): RADAR v2 alumno, profesor y accesibilidad".

## Etapa 4 — Verificación real y entrega
1. Arranca la app (npm run dev) y recorre de verdad, con el navegador:
   - profesor crea el PIN y asigna un test;
   - un alumno lo hace fallando a propósito una subhabilidad;
   - el profesor ve el 🔴 y la recomendación correcta;
   - el alumno hace su práctica y el mini-test, y el semáforo se actualiza.
   Repite con un alumno con perfil de dislexia y otro con baja visión.
2. Comprueba que no hace ninguna petición de red en ejecución (funciona offline). Si da tiempo, PWA instalable.
3. Revisa las pantallas a 1280 px y en una tablet (768 px): sin textos técnicos, botones grandes y nada cortado.
4. README breve: qué es RADAR, cómo ejecutarlo, temario, accesibilidad, limitaciones honestas (parámetros sin calibrar, PIN local, temario internacional y no oficial) y cómo volver a v1 (`git checkout v1-eso`).
5. `npm test` y `npm run build` finales.
Commit: "chore: demo RADAR v2".

## Si no da tiempo (recorta en este orden, de lo último a lo primero)
Imprescindible: flujo alumno → profesor completo y 2.º de primaria con los 3 bloques. Después: dislexia y baja visión → resto de cursos → TDAH y auditiva → PWA. Lo que quede fuera, en el README como "siguiente paso".

## Entrega (tu respuesta final, breve)
- Qué etapas están completas y sus commits.
- Salida REAL de `npm test` (resumen) y de `npm run build`.
- Cuántos generadores y tests hay por curso.
- Qué has comprobado a mano en el navegador y qué falló.
- Qué has recortado y por qué.
- Ruta de docs/MUESTRA_PREGUNTAS.md para que la revisemos.
