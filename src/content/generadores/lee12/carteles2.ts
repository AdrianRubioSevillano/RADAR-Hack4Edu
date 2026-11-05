// 2.º de primaria: carteles, horarios y etiquetas. Los datos para responder están en el dibujo.
import { monedas } from "../../ayuda.ts";
import type { Situacion } from "../../plantillas.ts";
import type { Dificultad, Imagen } from "../../tipos.ts";

type Texto = string;

// Una pregunta sobre un cartel: [dificultad, enunciado, fácil, correcta, distractores, pista, explicación].
type Fila = readonly [Dificultad, Texto, Texto, Texto, readonly [Texto, Texto], Texto, Texto];

function serie(sub: string, id: string, imagen: Imagen, filas: readonly Fila[]): readonly Situacion[] {
  return filas.map(([dificultad, enunciado, enunciadoFacil, correcta, distractores, pista, explicacion], i): Situacion => ({
    id: `${sub}/${id}/${i}`, sub, dificultad, enunciado, enunciadoFacil, correcta, distractores, pista, explicacion, imagen,
  }));
}

function aviso(titulo: string, ...lineas: readonly string[]): Imagen {
  return { tipo: "cartel", estilo: "aviso", titulo, lineas };
}

function horario(titulo: string, ...lineas: readonly string[]): Imagen {
  return { tipo: "cartel", estilo: "horario", titulo, lineas };
}

function etiqueta(titulo: string, ...lineas: readonly string[]): Imagen {
  return { tipo: "cartel", estilo: "etiqueta", titulo, lineas };
}

export const CARTEL = "LEE2-T5-a";
export const HORARIO = "LEE2-T5-b";
export const ETIQUETA = "LEE2-T5-c";

const P_LEE = "Lee el cartel línea a línea.";

export const CARTELES: readonly Situacion[] = [
  ...serie(CARTEL, "suelo", aviso("CUIDADO", "Suelo mojado.", "Camina despacio."), [
    [1, "¿Cómo hay que caminar aquí?", "Lee el cartel. ¿Cómo caminas?", "Despacio", ["Muy rápido", "Con los ojos cerrados"], P_LEE, "El cartel dice «Camina despacio»."],
    [2, "Según el cartel, ¿por qué hay que tener cuidado?", "¿Por qué hay que tener cuidado?", "Porque el suelo está mojado", ["Porque hay un perro", "Porque el suelo está sucio"], P_LEE, "El cartel dice «Suelo mojado». Puedes resbalar."],
    [3, "Según el cartel, ¿qué NO debes hacer aquí?", "¿Qué NO debes hacer aquí?", "Correr", ["Caminar despacio", "Mirar dónde pisas"], "Piensa qué es lo contrario de lo que pide el cartel.", "El cartel pide caminar despacio porque el suelo está mojado. Si corres, puedes caerte."],
  ]),
  ...serie(CARTEL, "biblioteca", aviso("BIBLIOTECA", "Cerrada los lunes.", "Abre el martes a las 9."), [
    [1, "¿Qué día está cerrada la biblioteca?", "¿Qué día está cerrada?", "El lunes", ["El martes", "El viernes"], P_LEE, "El cartel dice «Cerrada los lunes»."],
    [2, "¿A qué hora abre la biblioteca el martes?", "¿A qué hora abre el martes?", "A las 9", ["A las 10", "A las 12"], "Busca la línea que habla del martes.", "El cartel dice «Abre el martes a las 9»."],
    [3, "{F1} quiere un libro y hoy es lunes. Según el cartel, ¿qué debe hacer?", "{F1} quiere un libro. Hoy es lunes. ¿Qué debe hacer?", "Volver el martes", ["Entrar hoy", "Entrar hoy a las 9"], "Mira qué dice el cartel sobre los lunes.", "Los lunes está cerrada. Abre el martes, así que {F1} debe volver ese día."],
  ]),
  ...serie(CARTEL, "gato", aviso("SE BUSCA UN GATO", "Es negro, con una mancha blanca.", "Si lo ves, avisa a {F1}.", "Vive en la casa azul."), [
    [1, "¿Qué animal se busca?", "¿Qué animal buscan?", "Un gato", ["Un perro", "Un pájaro"], "Lee el título del cartel.", "El título dice «Se busca un gato»."],
    [2, "¿Cómo es el animal que se busca?", "¿Cómo es el gato?", "Negro, con una mancha blanca", ["Blanco, con una mancha negra", "Todo negro"], "Busca la línea que dice su color.", "El cartel dice «Es negro, con una mancha blanca»."],
    [3, "Ves ese gato en la calle. Según el cartel, ¿qué debes hacer?", "Ves el gato. ¿Qué debes hacer?", "Avisar a {F1}", ["Llevarlo a la escuela", "Quedarte con él"], "Busca la línea que empieza por «Si lo ves».", "El cartel dice «Si lo ves, avisa a {F1}»."],
  ]),
  ...serie(CARTEL, "agua", aviso("CUIDADO CON ESTA AGUA", "No se puede beber.", "Agua para beber: pozo de la plaza."), [
    [1, "¿Se puede beber el agua que hay junto a este cartel?", "¿Se puede beber esta agua?", "No", ["Sí", "Solo por la mañana"], P_LEE, "El cartel dice «No se puede beber»."],
    [2, "¿Dónde hay agua para beber?", "¿Dónde hay agua buena?", "En el pozo de la plaza", ["Junto a este cartel", "En la escuela"], "Busca la línea que dice «Agua para beber».", "El cartel dice «Agua para beber: pozo de la plaza»."],
    [3, "{M1} tiene sed y está junto a este cartel. ¿Qué debe hacer?", "{M1} tiene sed. Está junto al cartel. ¿Qué debe hacer?", "Ir a beber al pozo de la plaza", ["Beber el agua de aquí", "Beber aquí solo un poco"], "Piensa qué agua es segura según el cartel.", "El agua de aquí no se puede beber, ni un poco. El agua segura está en el pozo de la plaza."],
  ]),
  ...serie(CARTEL, "salida", aviso("SALIDA DE LA CLASE", "El viernes vamos al río.", "Salimos a las 8.", "Trae agua y un gorro."), [
    [1, "¿Qué día es la salida?", "¿Qué día salen?", "El viernes", ["El lunes", "El sábado"], P_LEE, "El cartel dice «El viernes vamos al río»."],
    [2, "¿Qué hay que llevar a la salida?", "¿Qué hay que llevar?", "Agua y un gorro", ["Un libro y un lápiz", "Una pelota y un gorro"], "Busca la línea que empieza por «Trae».", "El cartel dice «Trae agua y un gorro»."],
    [3, "{N1} llegó a la escuela a las 9 ese viernes. ¿Qué pasó?", "{N1} llegó a las 9. ¿Qué pasó?", "Llegó después de la salida", ["Llegó justo a la hora", "Llegó antes de la hora"], "Compara las 9 con la hora de salida.", "La clase sale a las 8. Las 9 es más tarde, así que {N1} llegó después."],
  ]),
  ...serie(CARTEL, "huerto", aviso("HUERTO DE LA ESCUELA", "No pises las plantas.", "Camina por el sendero.", "Cierra la puerta al salir."), [
    [1, "¿Por dónde hay que caminar en el huerto?", "¿Por dónde caminas?", "Por el sendero", ["Por las plantas", "Por encima de la puerta"], P_LEE, "El cartel dice «Camina por el sendero»."],
    [2, "¿Qué debes hacer al salir del huerto?", "¿Qué haces al salir?", "Cerrar la puerta", ["Regar las plantas", "Abrir la puerta"], "Busca la línea que dice «al salir».", "El cartel dice «Cierra la puerta al salir»."],
    [3, "Según el cartel, ¿qué NO debes hacer en el huerto?", "¿Qué NO debes hacer?", "Pisar las plantas", ["Cerrar la puerta", "Caminar por el sendero"], "Busca la línea que empieza por «No».", "El cartel dice «No pises las plantas». Lo demás sí lo pide."],
  ]),
];

const P_HORARIO = "Busca en el horario el día o la línea de la que habla la pregunta.";

export const HORARIOS: readonly Situacion[] = [
  ...serie(HORARIO, "autobus", horario("AUTOBÚS AL PUEBLO", "Primer autobús: 8 de la mañana", "Segundo autobús: 12 del mediodía", "Último autobús: 6 de la tarde"), [
    [1, "¿A qué hora sale el primer autobús?", "¿Cuándo sale el primero?", "A las 8 de la mañana", ["A las 12 del mediodía", "A las 6 de la tarde"], P_HORARIO, "El horario dice «Primer autobús: 8 de la mañana»."],
    [2, "¿A qué hora sale el último autobús?", "¿Cuándo sale el último?", "A las 6 de la tarde", ["A las 8 de la mañana", "A las 12 del mediodía"], P_HORARIO, "El horario dice «Último autobús: 6 de la tarde»."],
    [3, "{F1} llega a la parada a las 9 de la mañana. ¿Cuál es el próximo autobús?", "{F1} llega a las 9 de la mañana. ¿Cuál es el siguiente autobús?", "El de las 12 del mediodía", ["El de las 8 de la mañana", "El de las 6 de la tarde"], "El de las 8 ya se ha ido. Mira cuál viene después.", "A las 9 ya salió el autobús de las 8. El siguiente es el de las 12."],
  ]),
  ...serie(HORARIO, "clases", { tipo: "tabla", titulo: "Clases de la semana", cabeceras: ["Día", "Primera clase", "Segunda clase"], filas: [["Lunes", "Lectura", "Números"], ["Martes", "Números", "Dibujo"], ["Miércoles", "Lectura", "Huerto"], ["Jueves", "Música", "Números"], ["Viernes", "Deporte", "Lectura"]] }, [
    [1, "¿Cuál es la primera clase del lunes?", "Mira el lunes. ¿Qué clase va primero?", "Lectura", ["Números", "Música"], "Busca la fila del lunes.", "En la fila del lunes, la primera clase es Lectura."],
    [2, "¿Qué día hay clase de Huerto?", "¿Qué día hay Huerto?", "El miércoles", ["El lunes", "El viernes"], "Busca la palabra «Huerto» en la tabla y mira su fila.", "«Huerto» está en la fila del miércoles."],
    [3, "¿Cuántos días de la semana hay clase de Lectura?", "¿Cuántos días hay Lectura?", "3 días", ["2 días", "4 días"], "Busca «Lectura» en todas las filas y cuéntalas.", "Hay Lectura el lunes, el miércoles y el viernes: 3 días."],
  ]),
  ...serie(HORARIO, "biblioteca", horario("HORARIO DE LA BIBLIOTECA", "Lunes: de 9 a 12", "Miércoles: de 9 a 12", "Viernes: de 2 a 5", "Sábado y domingo: cerrada"), [
    [1, "¿A qué hora abre la biblioteca el lunes?", "¿Cuándo abre el lunes?", "A las 9", ["A las 12", "A las 2"], P_HORARIO, "El lunes abre de 9 a 12: abre a las 9."],
    [2, "¿A qué hora cierra la biblioteca el viernes?", "¿Cuándo cierra el viernes?", "A las 5", ["A las 2", "A las 12"], P_HORARIO, "El viernes abre de 2 a 5: cierra a las 5."],
    [3, "Es viernes y son las 10 de la mañana. ¿Está abierta la biblioteca?", "Es viernes. Son las 10 de la mañana. ¿Está abierta?", "No, el viernes abre a las 2", ["Sí, abre de 9 a 12", "Sí, cierra a las 5"], "Mira solo la línea del viernes.", "El horario de 9 a 12 es de otros días. El viernes abre a las 2."],
  ]),
  ...serie(HORARIO, "mercado", horario("MERCADO DEL PUEBLO", "Martes: de 8 a 1", "Jueves: de 8 a 1", "Sábado: de 8 a 12"), [
    [1, "¿A qué hora empieza el mercado el martes?", "¿Cuándo empieza el martes?", "A las 8", ["A la 1", "A las 12"], P_HORARIO, "El martes hay mercado de 8 a 1: empieza a las 8."],
    [2, "¿Cuántos días a la semana hay mercado?", "¿Cuántos días hay mercado?", "3 días", ["2 días", "7 días"], "Cuenta las líneas del horario.", "Hay mercado el martes, el jueves y el sábado: 3 días."],
    [3, "¿Qué día termina antes el mercado?", "¿Qué día acaba más pronto?", "El sábado", ["El martes", "El jueves"], "Compara la hora en que termina cada día.", "El sábado termina a las 12. El martes y el jueves terminan a la 1."],
  ]),
  ...serie(HORARIO, "turnos", { tipo: "tabla", titulo: "Tareas de la clase", cabeceras: ["Día", "Riega el huerto", "Barre la clase"], filas: [["Lunes", "{F1}", "{M1}"], ["Martes", "{M2}", "{F2}"], ["Miércoles", "{F3}", "{M3}"]] }, [
    [1, "¿Quién riega el huerto el lunes?", "Mira el lunes. ¿Quién riega?", "{F1}", ["{M1}", "{M2}"], "Busca la fila del lunes y la columna de regar.", "En la fila del lunes, quien riega el huerto es {F1}."],
    [2, "¿Qué día barre la clase {F2}?", "¿Qué día barre {F2}?", "El martes", ["El lunes", "El miércoles"], "Busca el nombre en la tabla y mira su fila.", "{F2} está en la fila del martes, en la columna de barrer."],
    [3, "¿Qué tarea tiene {M3}, y qué día?", "¿Qué hace {M3}? ¿Qué día?", "Barre la clase el miércoles", ["Riega el huerto el miércoles", "Barre la clase el martes"], "Mira la fila y también la columna.", "{M3} está en la fila del miércoles, en la columna «Barre la clase»."],
  ]),
  ...serie(HORARIO, "salud", horario("PUESTO DE SALUD", "De lunes a viernes: de 8 a 2", "Vacunas: solo los martes", "Sábado y domingo: cerrado"), [
    [1, "¿Qué día se ponen vacunas?", "¿Qué día hay vacunas?", "El martes", ["El lunes", "El sábado"], P_HORARIO, "El horario dice «Vacunas: solo los martes»."],
    [2, "¿A qué hora cierra el puesto de salud de lunes a viernes?", "¿Cuándo cierra?", "A las 2", ["A las 8", "A las 12"], P_HORARIO, "Abre de 8 a 2: cierra a las 2."],
    [3, "{F1} necesita una vacuna y hoy es jueves. ¿Qué debe hacer?", "{F1} necesita una vacuna. Hoy es jueves. ¿Qué debe hacer?", "Ir el martes", ["Ir hoy a las 8", "Ir el sábado"], "Busca la línea que habla de las vacunas.", "Las vacunas se ponen solo los martes, así que el jueves no puede ser."],
  ]),
];

const P_ETIQUETA = "Lee la etiqueta línea a línea.";

export const ETIQUETAS: readonly Situacion[] = [
  ...serie(ETIQUETA, "arroz", etiqueta("ARROZ", "Bolsa de 1 kilo", `Precio: ${monedas(5)}`, "Guardar en un lugar seco"), [
    [1, "¿Cuánto cuesta la bolsa de arroz?", "¿Cuánto cuesta el arroz?", monedas(5), [monedas(1), monedas(10)], P_ETIQUETA, `La etiqueta dice «Precio: ${monedas(5)}».`],
    [2, "¿Dónde hay que guardar el arroz?", "¿Dónde se guarda?", "En un lugar seco", ["En un lugar mojado", "Dentro del agua"], P_ETIQUETA, "La etiqueta dice «Guardar en un lugar seco»."],
    [3, `{F1} tiene ${monedas(3)}. ¿Puede comprar la bolsa de arroz?`, `{F1} tiene ${monedas(3)}. ¿Puede comprar el arroz?`, `No, le faltan ${monedas(2)}`, [`Sí, y le sobran ${monedas(2)}`, "Sí, tiene justo lo que cuesta"], "Compara lo que tiene con el precio.", `La bolsa cuesta ${monedas(5)} y {F1} tiene ${monedas(3)}: le faltan ${monedas(2)}.`],
  ]),
  ...serie(ETIQUETA, "jabon", etiqueta("JABÓN PARA LA ROPA", "No beber.", "Guardar lejos de los niños.", "Usar con agua."), [
    [1, "¿Para qué sirve este producto?", "¿Para qué sirve?", "Para lavar la ropa", ["Para beber", "Para lavar la fruta"], "Lee el título de la etiqueta.", "El título dice «Jabón para la ropa»."],
    [2, "¿Dónde hay que guardar este jabón?", "¿Dónde se guarda?", "Lejos de los niños", ["Junto a la comida", "En la cama"], P_ETIQUETA, "La etiqueta dice «Guardar lejos de los niños»."],
    [3, "Un niño pequeño quiere jugar con este jabón. ¿Qué debes hacer?", "Un niño pequeño quiere este jabón. ¿Qué haces?", "Avisar a un adulto", ["Dejarle jugar", "Dárselo para que lo abra"], "Piensa en lo que dice la etiqueta sobre los niños.", "La etiqueta dice que debe estar lejos de los niños. Por eso hay que avisar a un adulto."],
  ]),
  ...serie(ETIQUETA, "semillas", etiqueta("SEMILLAS DE TOMATE", "Sembrar en marzo", "Regar cada 2 días", "Tomates en 3 meses"), [
    [1, "¿De qué son estas semillas?", "¿Qué semillas son?", "De tomate", ["De flores", "De manzana"], "Lee el título de la etiqueta.", "El título dice «Semillas de tomate»."],
    [2, "¿En qué mes se siembran estas semillas?", "¿En qué mes se siembran?", "En marzo", ["En mayo", "En enero"], P_ETIQUETA, "La etiqueta dice «Sembrar en marzo»."],
    [3, "{M1} regó las semillas hoy. ¿Cuándo debe volver a regarlas?", "{M1} regó hoy. ¿Cuándo riega otra vez?", "Dentro de 2 días", ["Dentro de 3 meses", "Hoy otra vez"], "Busca la línea que habla de regar.", "La etiqueta dice «Regar cada 2 días»: toca regar otra vez dentro de 2 días."],
  ]),
  ...serie(ETIQUETA, "leche", etiqueta("LECHE", "1 litro", "Usar antes del 10 de mayo", "Guardar en un lugar fresco"), [
    [1, "¿Cuánta leche hay?", "¿Cuánta leche hay?", "1 litro", ["2 litros", "10 litros"], P_ETIQUETA, "La etiqueta dice «1 litro»."],
    [2, "¿Cuándo hay que usar la leche?", "¿Cuándo se usa la leche?", "Antes del 10 de mayo", ["Después del 10 de mayo", "Antes del 10 de junio"], "Busca la línea que empieza por «Usar».", "La etiqueta dice «Usar antes del 10 de mayo»."],
    [3, "Hoy es 15 de mayo. Según la etiqueta, ¿se puede usar esta leche?", "Hoy es 15 de mayo. ¿Se puede usar?", "No, ya pasó la fecha", ["Sí, todavía hay tiempo", "Sí, si se guarda en un lugar fresco"], "Compara el día de hoy con el de la etiqueta.", "Hay que usarla antes del 10 de mayo, y el 15 es más tarde."],
  ]),
  ...serie(ETIQUETA, "jarabe", etiqueta("JARABE PARA LA TOS", "Solo con ayuda de un adulto", "1 cucharada por la noche", "No tomar más de lo indicado"), [
    [1, "¿Para qué sirve este jarabe?", "¿Para qué sirve?", "Para la tos", ["Para el pelo", "Para la sed"], "Lee el título de la etiqueta.", "El título dice «Jarabe para la tos»."],
    [2, "¿Cuánto jarabe se toma y cuándo?", "¿Cuánto se toma? ¿Cuándo?", "1 cucharada por la noche", ["2 cucharadas por la noche", "1 cucharada por la mañana"], P_ETIQUETA, "La etiqueta dice «1 cucharada por la noche»."],
    [3, "{F1} tiene tos y no hay ningún adulto en casa. Según la etiqueta, ¿qué debe hacer?", "{F1} tiene tos. No hay adultos en casa. ¿Qué debe hacer?", "Esperar a un adulto", ["Tomar el jarabe sin ayuda", "Tomar dos cucharadas"], "Busca la línea que habla de un adulto.", "La etiqueta dice «Solo con ayuda de un adulto». {F1} debe esperar."],
  ]),
  ...serie(ETIQUETA, "cuaderno", etiqueta("CUADERNO", "50 hojas", "Con rayas", `Precio: ${monedas(8)}`), [
    [1, "¿Cuántas hojas tiene el cuaderno?", "¿Cuántas hojas tiene?", "50", ["8", "100"], P_ETIQUETA, "La etiqueta dice «50 hojas»."],
    [2, "¿Cómo son las hojas del cuaderno?", "¿Cómo son las hojas?", "Con rayas", ["Con cuadros", "Sin rayas"], P_ETIQUETA, "La etiqueta dice «Con rayas»."],
    [3, `{M1} paga el cuaderno con ${monedas(10)}. ¿Cuántas le devuelven?`, `{M1} paga con ${monedas(10)}. ¿Cuántas le devuelven?`, monedas(2), [monedas(8), monedas(10)], "Mira el precio y piensa cuánto sobra.", `El cuaderno cuesta ${monedas(8)}. De ${monedas(10)} sobran ${monedas(2)}.`],
  ]),
];
