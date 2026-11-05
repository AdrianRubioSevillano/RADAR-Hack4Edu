# Limitaciones de la aplicación

Complementa a [las limitaciones del motor](../engine/LIMITACIONES.md), que siguen vigentes.

## Sin demostrar

- **Eficacia educativa:** nada aquí demuestra que RADAR mejore el aprendizaje.
- **Planes y práctica:** son heurísticas. El benchmark evalúa el diagnóstico, no los planes, las actividades ni la práctica.
- **Equidad:** el plan por necesidad pendiente es otro criterio. No se afirma que sea más justo.
- **Originalidad:** no se afirma que sea una invención mundial.

## Contenido

- Sin revisión docente: banco, plantillas, pistas y actividades. La pantalla lo indica.
- Las respuestas de las 36 plantillas se verifican por cálculo, pero eso no valida su calidad didáctica.
- Los errores típicos proceden del banco: son hipótesis, no errores observados.
- Las pistas son por competencia, no por ejercicio.
- La duración de cada actividad es el supuesto de 15 minutos del motor, no una medida.
- El banco es para 1.º–2.º de ESO. Para alumnos más pequeños habría que hacer contenido nuevo.

## Accesibilidad

- `axe-core` no encontró incumplimientos, pero solo detecta una parte de los problemas. Dejó el contraste como "por revisar" donde hay fondos con trama o degradado.
- No se ha probado con lectores de pantalla reales ni con personas con discapacidad.
- La voz depende del navegador. En la prueba se ensayó su ausencia, no la calidad de lectura.
- El radar y el mapa son visuales. Sus alternativas son los sectores manejables con teclado, la lista y las tablas.
- Las opciones no son un tratamiento ni un diagnóstico.

## Técnicas

- **Sin seguridad:** el banco con sus soluciones viaja al navegador. Sirve para una demo, no para un examen.
- **Sin datos reales:** no debe introducirse información de alumnos reales. `localStorage` no está cifrado y no hay gestión de consentimiento.
- **Un navegador, un docente:** no hay sincronización ni cuentas.
- **Datos ligados al código:** si cambian banco, grafo o motor, hay que regenerar los informes con `npm run bench`.
- **Respuestas manuales y simuladas se mezclan** en un mismo alumno. El origen se muestra, pero el modelo las trata igual.
- `npm run e2e` y `npm run capturas` solo se han usado en macOS con Chrome.

## Pendiente de decisión

- Licencia del repositorio.
- Elegir entre esta propuesta y la de Codex.
- Destino de despliegue.
