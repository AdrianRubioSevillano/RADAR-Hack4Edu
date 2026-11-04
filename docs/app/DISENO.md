# Dirección de diseño: "Instrumento de juguete"

Propuesta visual de Claude, hecha sin partir de la composición del frontend de Codex. Misma funcionalidad y mismos datos, para poder comparar.

## La idea

Un radar de precisión construido como un juguete. La marca se llama RADAR y su logo es un radar: aquí el radar deja de ser un nombre y pasa a ser la interfaz.

- **Público principal:** docentes. La vista docente es densa y ordenada.
- **Toque infantil:** la mascota Radi, los avatares en pupitres y los botones que se hunden. Todo lo infantil se concentra en la vista de alumno y en los estados vacíos, para que el producto pueda abrirse a alumnos sin rehacerse.
- **Lo que debería recordarse:** ver la clase entera en una pantalla de radar, con un barrido que hace destellar a cada alumno al pasar.

## Sistema

| Pieza | Decisión | Motivo |
|---|---|---|
| Color | Azul marino `#002048`, azul `#0068C8`, cian `#48D0F8`, tomados de `LOGO.png` | Concordancia con la marca |
| Acento | Amarillo sol `#FFC629` | Complementario del azul; reservado a acción y selección |
| Letra de títulos | Fredoka | Sus formas redondas y gruesas recuerdan al logotipo |
| Letra de lectura | Atkinson Hyperlegible Next | Diseñada para distinguir bien cada carácter |
| Forma | Borde grueso, sombra sólida, tres radios distintos | Piezas físicas que se pulsan |
| Competencias | Símbolo, nombre y color fijos | La identidad nunca depende solo del color |

Las fuentes van en el paquete: la demo funciona sin conexión. Todos los colores pasan por variables, y el alto contraste solo las redefine.

La paleta de competencias y las de datos se comprobaron con el validador de la Skill de visualización, incluida la separación para daltonismo. El amarillo de `ALG` no llega a 3:1 sobre blanco, por lo que nunca va sin símbolo y nombre.

## Composición

| Zona | Frontend recibido | Esta propuesta |
|---|---|---|
| Navegación | Barra lateral fija | Barra superior, conmutador Docente/Alumno y pestañas inferiores en móvil |
| Clase | Tabla | Aula con pupitres y avatares; la tabla sigue disponible |
| Panel docente | Tarjetas y tablas | Radar con barrido, medidores y mapa de izquierda a derecha |
| Alumno | Dos columnas con pregunta y estimaciones | Pantalla propia a gran tamaño; las estimaciones, plegadas para docentes |
| Planes | Dos tarjetas y tabla | Bloques de tiempo y matriz de burbujas por alumno |
| Benchmark | Tablas y líneas | Mosaico de veredictos de los tres escenarios, y detalle debajo |

## Tres visualizaciones propias

**Radar de clase.** El sector es la competencia con mayor necesidad medida del alumno. La distancia al centro es su necesidad media medida. Se probó primero con la necesidad máxima, pero se saturaba y amontonaba a los alumnos en el borde. Con la media se distingue un hueco aislado de una dificultad amplia. Un alumno sin respuestas no se dibuja: su posición sería el prior.

**Matriz de pendientes.** Una fila por alumno y una columna por competencia. Las columnas del plan activo se resaltan y sus burbujas pasan a anillos: lo que sigue siendo burbuja es lo que queda pendiente. Cambiar de plan lo muestra al instante.

**Mosaico de veredictos.** Una casilla por métrica y presupuesto, en los tres escenarios, con la letra del método favorecido. Las pérdidas de B saltan a la vista: no se esconden en una tabla.

## Criterios de las Skills de diseño

Se aplicaron `frontend-design`, `dataviz` y la lista anti-patrones de `design-review`:

- Sin degradados violeta, rejillas de tres iconos, manchas decorativas, emojis ni bordes izquierdos de color.
- Radios variados y texto alineado a la izquierda.
- El fondo de anillos es el motivo del logo, no adorno genérico.

## Lenguaje

Los textos siguen las reglas del motor: "programada" nunca es "aprendida", ningún plan es "el mejor" y los extremos se muestran como "> 99 %" para no aparentar certeza.
