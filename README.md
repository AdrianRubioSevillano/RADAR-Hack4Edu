# RADAR

Diagnóstico adaptativo y planificación para matemáticas de 1.º–2.º de ESO. Pensado para docentes, con una vista de alumno preparada. Proyecto para Hack4Edu 2026.

Se ejecuta entero en el navegador: sin servidor, cuentas ni servicios de IA. Todos los alumnos de la demo son ficticios. Es un prototipo experimental sin validación educativa: lee [las limitaciones](docs/app/LIMITACIONES.md) antes de sacar conclusiones.

> **Esta rama es la propuesta visual de Claude** (`frontend/claude-alternativa`), para compararla con la de Codex. Comparten motor, servicios y datos. Dirección de diseño en [DISENO.md](docs/app/DISENO.md) y capturas en [docs/capturas](docs/capturas).

## Puesta en marcha

Comprobado con Node 26.0.0 y npm 11.12.1. No se afirma compatibilidad con otras versiones: `npm run bench` y los scripts de Chrome ejecutan TypeScript directamente con Node.

```bash
npm ci
```

```bash
npm run dev
```

Abre la dirección que indique Vite, normalmente http://127.0.0.1:5173.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run typecheck` | Tipos del motor y de la aplicación |
| `npm test` | Tests del motor y de la aplicación |
| `npm run build` | Tipos y build de producción en `dist/` |
| `npm run preview` | Sirve `dist/` |
| `npm run e2e` | Prueba extremo a extremo en Chrome (necesita `npx vite preview --host 127.0.0.1 --port 4173`) |
| `npm run capturas` | Regenera `docs/capturas` y la auditoría axe (mismo requisito) |
| `npm run bench` | Repite el experimento completo: unos 145 s. No hace falta si el motor no cambia |

`npm run e2e` y `npm run capturas` buscan Google Chrome en la ruta de macOS.

## Qué incluye

- **Mi clase:** 30 alumnos ficticios con semilla fija, respuestas simuladas por el motor real y reinicio.
- **Radar:** diagnóstico colectivo, con cada alumno situado por su mayor necesidad medida.
- **Planes:** presupuesto de tiempo, ranking y comparación del plan colectivo con el que minimiza la mayor necesidad estimada pendiente.
- **Actividades y Práctica:** actividades para lo priorizado y ejercicios individuales según lo que el plan deja pendiente, separados del diagnóstico.
- **Evidencia:** los informes reales del benchmark, con sus empates y pérdidas.
- **Accesibilidad:** tamaño, espaciado, contraste, presentación legible, una pregunta por pantalla, menos distracciones, teclado y lectura en voz alta.

## Documentación

- [Guion de demo](docs/app/GUION_DEMO.md)
- [Arquitectura e integración](docs/app/ARQUITECTURA.md)
- [Diseño](docs/app/DISENO.md)
- [Verificación](docs/app/VERIFICACION.md)
- [Limitaciones de la aplicación](docs/app/LIMITACIONES.md)
- [Motor: estado, API y matemáticas](docs/engine/ESTADO.md)

## Despliegue

`npm run build` genera un sitio estático en `dist/`, con rutas relativas y navegación por `#`, que funciona en la raíz o en una subcarpeta. No se ha desplegado.

## Licencia

El repositorio no tiene licencia: es una decisión pendiente del equipo. Fredoka y Atkinson Hyperlegible Next tienen licencia OFL-1.1.
