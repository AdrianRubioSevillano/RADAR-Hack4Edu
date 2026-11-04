# Procedencia del motor

**Resuelto.** El motor provisional se sustituyó por el final en `7604c99`, y `vendor/engine-phase3` y pnpm se retiraron. El gestor único es npm. El resto de este documento se conserva como registro histórico; el snapshot sigue recuperable en `feature/frontend` (`6420927`).

---

# Motor provisional de Fase 3

El remoto main consultado el 4 de noviembre de 2026 solo contenía README (2aaacc43bc560fcbd185061e8ad3c0991edf8423).

La carpeta vendor/engine-phase3 es copia íntegra, sin modificaciones, del snapshot de revisión radar-revision-fase3. Se atribuye al commit estable local de Adrián 69334b2aa7ed96a9472a0738b906594a161dd982, rama motor, todavía sin publicar al importar. El ZIP no permite verificar por sí mismo el historial Git de ese commit.

SHA-256 del ZIP recibido: 5428cbaf55f008e7e5b4964fce7a146c80d31fbbb4e3b43e6dc5942b3a39916c.

ENGINE-MANIFEST.json registra hashes de todos los archivos copiados. No se usa la antigua base de Primaria/NÚCLEO. La implementación Fase 4A no está incluida.

## Reconciliación con la rama oficial

1. Conservar esta rama y revisar el diff del motor oficial cuando esté publicado.
2. Incorporar la historia real mediante el flujo de PR acordado por el equipo.
3. Cambiar únicamente src/services/engine.ts para reexportar src/engine/index.ts, si conserva las firmas.
4. Retirar vendor/engine-phase3 y su patrón de tests solo después de comparar fuentes y ejecutar las pruebas de integración, tipos y build con el motor oficial.
5. Mantener este documento como registro de la procedencia provisional.

No copiar estos contratos a shared ni modificar el motor desde el frontend. Los componentes reciben PublicQuestion sin clave de respuesta, explicación ni distractores internos; la explicación se expone después de contestar. Al ejecutarse el banco en el navegador, las claves no son un secreto frente a quien inspeccione el código: esta demo no es un examen seguro.

## Gestor de dependencias pendiente de unificación

El motor recibido usa npm y package-lock.json. El frontend usa pnpm 11.25.0 y pnpm-lock.yaml en la raíz. Son formatos distintos: no se deben fusionar ni tratar como intercambiables. El package-lock.json dentro de vendor/engine-phase3 pertenece al snapshot y permanece intacto; no se instala por separado para ejecutar este frontend.

Instalación reproducible del frontend, desde la raíz del checkout, con Node 22.12 o posterior y pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
```

Antes de la integración definitiva, el equipo debe acordar un solo gestor y regenerar un único lockfile raíz con ese gestor a partir del package.json integrado. Después se comprobará una instalación limpia, pruebas, tipos y build. Hasta entonces, pnpm-lock.yaml es el único lockfile activo de este checkout.
