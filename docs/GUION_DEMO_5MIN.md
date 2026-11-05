# Guion de la demo: 5 minutos

**Antes de empezar.** `npm run build && npm run preview`, y abre la app en una tablet o a pantalla completa. Crea el PIN 1234 y, en Ajustes, pulsa **Restablecer demo**: las preguntas de abajo salen iguales cada vez si Amina responde exactamente así. Sal de la cuenta de profesor. Comprueba que suena **Escuchar**: necesita una voz en español instalada en el dispositivo.

La demo es 2.º de primaria: 20 alumnos simulados con 3 temas hechos y 3 alumnos sin empezar. Datos ficticios.

## Minuto 0:00 · El problema (inicio)

- **Toca:** nada. Deja la portada en pantalla.
- **Di:** «En un aula de 40 niños, sin internet, el docente sabe que alguien no entiende el tema, pero no qué parte ni quién. RADAR detecta qué parte de cada tema le cuesta a cada alumno y le da ejercicios para esa parte. Funciona sin conexión y se adapta a alumnos con dislexia, TDAH, baja visión o discapacidad auditiva».

## Minuto 0:45 · Lo que ve el docente

- **Toca:** *Soy profesor* → PIN 1234.
- **Di:** «Una sola pantalla. Sin porcentajes ni gráficos: una decisión. *Mañana explica primero: Cambio sencillo*, porque lo necesitan 15 de los 20 alumnos que han hecho tests. Debajo, los grupos ya hechos, y el semáforo de toda la clase».
- **Toca:** baja hasta la cuadrícula. **Di:** «Verde, lo domina. Amarillo, aún no está claro. Rojo, necesita refuerzo. No depende solo del color: cada estado tiene su símbolo».
- **Toca:** *Salir*.

## Minuto 1:30 · Amina, una alumna con dislexia

- **Toca:** *Soy alumno* → **Amina** → **Dinero**.
- **Di:** «El docente activó para Amina la ayuda de dislexia: no guardamos el diagnóstico, solo la ayuda. Misma pregunta, frases más cortas, letra más grande».
- **Toca:** **Escuchar** en la primera pregunta y deja que suene.
- **Di:** «Voz del propio dispositivo, sin internet».

Responde en este orden (las 3 marcadas son los fallos a propósito):

| N.º | Pregunta | Responde |
|---|---|---|
| 1 | Suma las monedas | 20 |
| 2 | El precio es 11, ¿qué moneda falta? | Una moneda de 1 |
| 3 | **Pagas con 10, te devuelven 5, ¿cuánto cuesta la taza?** | **Falla: cualquiera que no sea 5** |
| 4 | El gorro cuesta 10, monedas de 2 | 5 |
| 5 | **Pagas con 10, te devuelven 2, ¿cuánto cuesta la mochila?** | **Falla: cualquiera que no sea 8** |
| 6 | **Pagas con 10, te devuelven 3, ¿cuánto cuesta el libro?** | **Falla: cualquiera que no sea 7** |
| 7 | Suma las monedas | 30 |
| 8–10 | ¿Qué pasa al pagar? | Tienes lo justo |

- **Di tras la pregunta 3:** «El fallo no se castiga: explica por qué. Y fíjense: RADAR acaba de cambiar la siguiente pregunta. Elige la que más información da sobre esta niña, y por eso insiste justo donde hay duda».
- **Al terminar, di:** «No hay nota. Amina recibe un mensaje de ánimo y sus ejercicios».

## Minuto 3:00 · El fallo se convierte en rojo

- **Toca:** *No soy yo* → inicio → *Soy profesor* → PIN 1234.
- **Di:** «Ahora son 16 de 21. Los alumnos que no han hecho el test no cuentan».
- **Toca:** baja hasta **Amina** en la cuadrícula. **Di:** «Domina contar monedas y pagar, y tiene el rojo solo en cambio sencillo. Esa precisión es lo que no da una nota de 6 sobre 10».
- **Toca:** *Salir*.

## Minuto 3:40 · La práctica lo arregla

- **Toca:** *Soy alumno* → **Amina** → **Cambio sencillo** (en *Tus ejercicios para practicar*).
- **Di:** «No son ejercicios genéricos: 6 solo de esa parte, de fácil a difícil, con pista».
- **Toca:** *Necesito una pista* en el primero. Resuelve los 6:

| N.º | Ejercicio | Responde |
|---|---|---|
| 1 | El libro cuesta 2, pagas con 10 | Las monedas de 5, 2 y 1 |
| 2 | La pelota cuesta 4, pagas con 10 | 6 |
| 3 | Pagas con 50, te devuelven 25 | 25 |
| 4 | El cuaderno cuesta 30, pagas con 50 | 20 |
| 5 | El paraguas cuesta 19, pagas con dos de 20 | Las monedas de 20 y 1 |
| 6 | La mochila cuesta 16, pagas con dos de 20 | Las monedas de 20, 2 y 2 |

- **Toca:** *Empezar el reto*. Responde:

| N.º | Reto | Responde |
|---|---|---|
| 1 | El lápiz cuesta 5, pagas con 10 | La moneda de 5 |
| 2 | Compras la pelota, pagas con 50 | 41 |
| 3 | Compras el gorro y el libro, pagas con 50 | 32 |

- **Di:** «¡Lo ha conseguido!».

## Minuto 4:30 · Se cierra el círculo

- **Toca:** *Volver a mis tests* → *No soy yo* → inicio → *Soy profesor* → PIN 1234.
- **Di:** «Amina ya no está en rojo: el contador vuelve a 15. El docente no ha corregido nada a mano».
- **Si queda tiempo:** abre **Omar** como alumno para enseñar la baja visión: letra al 150 % y alto contraste.

## Cierre (15 segundos)

«Corre en una tablet sencilla, sin internet ni servidor, con 126 tests de primaria en números, lectura y pensamiento. Es honesto: los parámetros aún no se han calibrado con alumnos reales, y ese es nuestro siguiente paso».

## Si algo falla

- **No suena Escuchar:** el botón se oculta si no hay voz. Sigue: la pregunta en lectura fácil se ve igual.
- **Sale otra pregunta:** alguna respuesta se ha desviado. Ajustes → *Restablecer demo*, o sigue fallando solo las de "te devuelven".
