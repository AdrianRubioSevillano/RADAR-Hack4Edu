# RADAR

RADAR detecta qué parte de cada tema le cuesta a cada alumno de primaria y le da ejercicios para esa parte. Funciona sin internet y se adapta a alumnos con dislexia, TDAH, baja visión o discapacidad auditiva.

Hecho para Hack4Edu 2026 (ProFuturo), pensando en escuelas con tablets sencillas, sin conexión y con aulas grandes.

Los niveles Ciclo I a VI corresponden a los seis años de educación primaria; se usan ciclos porque así se organiza la enseñanza en muchos países donde trabaja ProFuturo.

## Cómo ejecutarlo

Comprobado con Node 26.

```bash
npm install
```

```bash
npm run dev
```

Para probar la versión final, con modo sin conexión:

```bash
npm run build && npm run preview
```

Otros comandos: `npm test`, `npm run muestras` (genera `docs/MUESTRA_PREGUNTAS.md`), `npm run e2e` y `npm run capturas` (estos dos usan Chrome y `npm run preview`).

La demo trae una clase de Ciclo II con 20 alumnos simulados y 3 sin empezar. El recorrido para el jurado está en [docs/GUION_DEMO_5MIN.md](docs/GUION_DEMO_5MIN.md).

## Cómo funciona

- **Alumno:** elige su nombre, hace los tests asignados y recibe ejercicios de lo que necesita, sin notas.
- **Profesor:** con un PIN ve una sola pantalla: "Mañana explica primero…", grupos y semáforo por alumno.
- **Temario:** 6 niveles (Ciclo I a VI), 3 bloques (números, lectura, pensar y decidir), 90 temas, 221 subhabilidades y 126 tests, en [docs/TEMARIO.md](docs/TEMARIO.md). Las preguntas se generan con semilla.
- **Motor:** modelo DINA con inferencia bayesiana exacta y selección de la pregunta que más información aporta. En `src/core`, sin mostrarse nunca en la interfaz.

## Accesibilidad

El profesor activa las ayudas por alumno, y se pueden combinar. Solo se guardan las ayudas, nunca un diagnóstico. Las preguntas son las mismas: cambia la presentación.

| Ayuda | Qué cambia |
|---|---|
| Dislexia | Enunciado fácil, botón Escuchar, letra mayor y más interlineado |
| TDAH | Sin elementos extra, barra de progreso, pausas cada 5 preguntas, test en 2 partes si es largo |
| Baja visión | Letra al 150 %, alto contraste, botones grandes y Escuchar |
| Auditiva | Nada depende del sonido: siempre icono y texto |

## Limitaciones

- **Sin calibrar:** umbrales, slip, guess, ε y la transición de aprendizaje son supuestos, no medidas. No se ha probado con alumnos reales, ni demuestra mejora educativa.
- **PIN local:** sin servidor, protege de forma sencilla pero no es seguridad fuerte. Los datos solo están en ese dispositivo y se pierden si se borra el navegador.
- **Temario:** propuesta internacional basada en marcos de UNESCO-UIS y UNICEF, no el currículo oficial de ningún país.
- **Contenido:** solo en español. Pendiente de revisión por docentes; empieza por `docs/MUESTRA_PREGUNTAS.md`.
- **Voz:** depende de que el dispositivo tenga una voz en español. Si no, el botón se oculta.
- **Sin conexión:** la app debe abrirse una vez con red para quedar instalada.

Las decisiones de diseño están en [docs/DECISIONES_V2.md](docs/DECISIONES_V2.md).

## Volver a la versión anterior

La versión de ESO, con el simulador y el benchmark, sigue intacta:

```bash
git checkout v1-eso
```
