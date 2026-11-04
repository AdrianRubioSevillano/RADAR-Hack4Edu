# Verificación

Comprobaciones ejecutadas de verdad el 4 de noviembre de 2026 sobre esta rama, con Node 26.0.0, npm 11.12.1 y Google Chrome en macOS. Si cambia el código, hay que repetirlas.

| Comprobación | Comando | Resultado |
|---|---|---|
| Tipos | `npm run typecheck` | Código de salida 0 |
| Tests | `npm test` | 1669 superados en 39 archivos |
| Build | `npm run build` | Correcto |
| Chrome real | `npm run e2e` | 85 de 85 comprobaciones |
| Accesibilidad | `npm run capturas` | 0 incumplimientos en 22 combinaciones de pantalla y dispositivo |
| Dependencias | `npm audit --omit=dev` | 0 vulnerabilidades |

No se repitió `npm run bench`: el motor y sus datos no cambian. El diff frente a `motor` está vacío en `src/engine`, `src/simulation` y `src/benchmarks`.

## Tests

- 1555 del motor, sin cambios.
- 114 de la aplicación: sesión, persistencia, vista docente, práctica, plantillas, benchmark, preferencias, radar, fronteras y pantallas renderizadas.
- Las 36 plantillas se recalculan con un evaluador racional propio del test, sin código de `src/`.
- La vista del benchmark se contrasta con el JSON y con la tabla del informe `.md`, cifra a cifra.

## Chrome real

`scripts/e2e.ts` usa el build de producción. Detalle en [E2E.json](E2E.json). Cubre:

- **Sin respuestas:** el prior no se presenta como resultado y los planes son hipotéticos.
- **Simulación:** la interfaz sigue respondiendo durante el proceso.
- **Radar:** 30 alumnos, sectores con teclado y sin trampas de tabulador.
- **Planes:** presupuestos con planes iguales y distintos, cambio de plan activo y presupuestos no válidos.
- **Alumno:** recorrido solo con teclado, gestión del foco, entrada no válida y ausencia de la explicación antes de responder.
- **Práctica:** pistas y soluciones no cambian ningún diagnóstico.
- **Estados límite:** banco agotado, datos corruptos, clase vacía y reinicio.
- **Benchmark:** el informe solo se descarga al entrar.
- **Preferencias:** diálogo con teclado, retorno del foco, una pregunta por pantalla y ausencia de voz.
- **Adaptación:** 320, 390 y 768 px sin desbordamiento horizontal, controles de al menos 44 px, y texto muy grande con espaciado amplio.
- **Consola:** sin errores en toda la prueba.

La prueba encontró fallos reales que se corrigieron, como el desbordamiento en móvil causado por los textos solo para lectores de pantalla.

## Accesibilidad

`axe-core` con las reglas WCAG 2.0, 2.1 y 2.2 A y AA y buenas prácticas. Detalle en [AXE.json](AXE.json). Reglas superadas sumando todas las pantallas: 982.

Quedaron como "por revisar", porque la herramienta no puede decidirlas: `aria-prohibited-attr`, `color-contrast`. El contraste sobre fondos con trama no se ha medido de forma automática.

**No comprobado:** lectores de pantalla reales, usuarios reales, otros navegadores y dispositivos físicos. El móvil se emuló en Chrome.

## Capturas

En [docs/capturas](../capturas): escritorio de 1440 × 900 y móvil de 390 × 844. Generadas con datos reales del motor: 12 respuestas simuladas por alumno.
