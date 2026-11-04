# RADAR

Prototipo de diagnóstico adaptativo de matemáticas de 1.º–2.º ESO. React, TypeScript, Vite, Tailwind, React Flow y Recharts. El motor se ejecuta en el navegador, sin servidor ni servicios de IA.

## Arranque

Node 22.12 o posterior y pnpm 11.25.0. Desde esta carpeta:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abrir la dirección que muestre Vite (habitualmente http://127.0.0.1:5173). El gestor de este checkout es pnpm 11.25.0 y el lockfile activo es pnpm-lock.yaml. El snapshot del motor conserva su package-lock.json de npm intacto; no se instala por separado. Antes de la integración definitiva se acordará un solo gestor con el equipo (ver docs/ENGINE-PROVENANCE.md).

```sh
pnpm test
pnpm build
pnpm preview
```

## Recorrido disponible

Iniciar diagnóstico → responder como alumno ficticio → siguiente pregunta adaptativa → estimaciones individuales y mapa. El reinicio borra las respuestas de la sesión. No hay persistencia: recargar también reinicia. Las entradas inválidas no modifican el diagnóstico. Se agota el banco tras 30 respuestas; no hay criterio de parada anticipado validado.

El servicio src/services/diagnostic.ts coordina selección, envío, marginales y entropía. React solo representa esos resultados. No se simulan alumnos ni se fabrican resultados colectivos, recomendaciones o benchmarks: quedan pendientes de sus módulos reales.

## Motor y colaboración

Checkout aislado en feature/frontend, sobre main 2aaacc4. Snapshot provisional íntegro en vendor/engine-phase3. Consultar docs/ENGINE-PROVENANCE.md antes de incorporar la rama motor real. src/engine, src/simulation y src/benchmarks corresponden a Adrián y no se han creado ni modificado aquí.

## Límites

Prior inicial de 0,5 por competencia, sin compatibilidad activada. Las probabilidades son estimaciones de un modelo experimental, no calificaciones. R_q, slip, guess y prerrequisitos son hipótesis sin calibración ni validación docente. No se deben interpretar como evidencia de mejora educativa real ni causalidad. El alumno de demostración es ficticio; las respuestas se introducen manualmente.

## Verificación del 4 de noviembre de 2026

503 pruebas pasadas (501 del snapshot + 2 de integración), TypeScript y build correctos. Prueba de navegador: inicio, respuesta numérica correcta, actualización del mapa, rechazo de texto inválido. Sin push ni merge.
