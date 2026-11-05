# Guion de demo: unos cinco minutos

Preparación: `npm run dev`, navegador a pantalla completa y, en Mi clase, **Reiniciar la demo** con doble pulsación.

## 0:00 · El problema (30 s)

**Pantalla:** Mi clase.

> Un docente tiene 30 alumnos y poco tiempo. Necesita saber qué sabe cada uno sin un examen largo, y decidir qué trabajar. Todo lo que veréis es sintético, y lo avisamos en cada pantalla.

Señala los pupitres y la marca Datos sintéticos.

## 0:30 · Diagnóstico adaptativo (60 s)

**Pantalla:** abre un pupitre. Pasa a la vista de alumno.

> RADAR elige cada pregunta según la información que espera obtener. El alumno ve una sola cosa, en grande.

1. Responde una pregunta. Radi corrige y explica.
2. Abre **¿Por qué esta pregunta?** y enseña los bits esperados.
3. Abre **Para docentes** y enseña que lo no medido pone "Sin evidencia": no presentamos el punto de partida como un resultado.

## 1:30 · El radar de la clase (60 s)

**Pantalla:** Mi clase. Elige **Hasta 12** y pulsa **Simular respuestas**. Después, Radar.

> Cada punto es un alumno. El sector es su mayor necesidad medida. Cuanto más lejos del centro, mayor es su necesidad media.

Pulsa dos sectores y enseña la lista de alumnos.

## 2:30 · Dos planes para el mismo tiempo (75 s)

**Pantalla:** Planes. Esta es la parte central.

> ¿Qué hago con 30 minutos? El plan colectivo busca el mayor valor para la clase. El otro minimiza la mayor necesidad pendiente de un alumno.

1. Mueve el presupuesto y enseña cómo cambian los bloques. Con algún presupuesto los planes coinciden y se muestra: no forzamos ninguna diferencia.
2. Selecciona el plan por necesidad pendiente y mira cómo cambia la matriz.

> Un anillo significa programada, no aprendida. Y no decimos que un plan sea mejor ni más justo: son dos criterios, y decide el docente.

## 3:45 · Del plan a la práctica (45 s)

**Pantalla:** Actividades y después Práctica.

> El plan genera actividades para el grupo. Lo que queda pendiente se convierte en práctica individual para cada alumno.

Pide una pista y resalta que practicar no cambia el diagnóstico.

## 4:30 · Evidencia honesta y accesibilidad (30 s)

**Pantalla:** Evidencia.

> En datos sintéticos, la selección adaptativa suele ganar al orden fijo. Pero mirad el naranja: con parámetros mal especificados pierde en log-loss. Lo enseñamos. Y esto mide el diagnóstico: no prueba eficacia educativa.

Abre **Accesibilidad**, activa alto contraste y texto grande, y restablece.

## Si algo falla

- **Sin voz:** la demo no depende de ella.
- **Pantalla en blanco:** recarga. Los datos están guardados.
- **Datos raros:** Mi clase, Reiniciar la demo.

## Frases que no hay que decir

- "Demuestra que los alumnos aprenden."
- "Es el plan más justo."
- "La competencia ya está aprendida."
- "Empatar el intervalo significa que son iguales."
