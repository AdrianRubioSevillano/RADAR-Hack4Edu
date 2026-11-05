// LEE 4.º, temas 3 (textos informativos), 4 (procedimientos) y 5 (hecho u opinión).
// En el tema 5 las opiniones se escriben sin atribuir ("Es la más bonita"): una frase
// como "Ana piensa que..." sería un hecho sobre Ana y la pregunta quedaría discutible.
import type { TextoEscrito } from "../../plantillas.ts";
import { preguntasDe } from "./comun.ts";

const localiza = preguntasDe("LEE4-T3-a");
const tabla = preguntasDe("LEE4-T3-b");
const orden = preguntasDe("LEE4-T4-a");
const material = preguntasDe("LEE4-T4-b");
const falta = preguntasDe("LEE4-T4-c");
const distingue = preguntasDe("LEE4-T5-a");
const justifica = preguntasDe("LEE4-T5-b");

const OPINION = "¿Cuál de estas frases es una opinión?";
const OPINION_FACIL = "Una opinión es lo que piensa alguien. ¿Qué frase es una opinión?";
const HECHO = "¿Cuál de estas frases es un hecho?";
const HECHO_FACIL = "Un hecho se puede comprobar. ¿Qué frase es un hecho?";
const PISTA_OPINION = "Pregúntate: ¿otra persona podría pensar distinto?";
const PISTA_HECHO = "Pregúntate: ¿se puede contar, medir o comprobar?";

export const TEXTOS_4_T3: readonly TextoEscrito[] = [
  {
    id: "LEE4-T3-tx1",
    titulo: "La Luna",
    texto:
      "La Luna es el único satélite natural de la Tierra. Está a unos 384 000 kilómetros de nosotros y tarda unos 27 días en dar una vuelta completa a nuestro planeta. No tiene luz propia: brilla porque refleja la luz del Sol. Tampoco tiene aire ni agua líquida, por eso en ella no hay seres vivos. En su superficie hay miles de cráteres, unos hoyos redondos que hicieron las rocas al chocar contra ella. En 1969, dos astronautas caminaron por primera vez sobre la Luna.",
    preguntas: [
      localiza(1, "¿Cuántos días tarda la Luna en dar una vuelta a la Tierra?", "La Luna da vueltas a la Tierra. ¿Cuántos días tarda en dar una?", "Unos 27 días", ["Unos 69 días", "Unos 384 días"], "Busca la palabra «días».", "El texto dice que tarda unos 27 días en dar una vuelta completa."),
      localiza(2, "¿Por qué brilla la Luna?", "La Luna brilla. ¿Por qué?", "Porque refleja la luz del Sol", ["Porque tiene luz propia", "Porque tiene miles de cráteres", "Porque está cerca de la Tierra"], "Busca la palabra «brilla».", "El texto dice que no tiene luz propia y que brilla porque refleja la luz del Sol."),
      localiza(3, "¿Qué dato NO da el texto?", "¿Qué dato NO está en el texto?", "Cuánto mide la Luna", ["A qué distancia está de la Tierra", "Qué hizo los cráteres", "Cuándo caminaron en ella por primera vez"], "Busca cada dato en el texto. Uno no está.", "El texto da la distancia, explica los cráteres y dice el año 1969, pero no cuánto mide la Luna."),
    ],
  },
  {
    id: "LEE4-T3-tx2",
    titulo: "La ballena azul",
    texto:
      "La ballena azul es el animal más grande que existe. Una adulta puede medir unos 30 metros, casi tanto como tres autobuses en fila. Se alimenta de kril, unos animales diminutos parecidos a los camarones, y en un día de verano puede comer más de tres mil kilos. Aunque vive en el mar, no es un pez: respira aire y sube a la superficie cada 10 o 20 minutos. Sus crías miden unos siete metros al nacer y toman la leche de su madre durante unos siete meses.",
    preguntas: [
      localiza(1, "¿Cuántos metros puede medir una ballena azul adulta?", "Una ballena azul es adulta. ¿Cuántos metros puede medir?", "Unos 30 metros", ["Unos 7 metros", "Unos 20 metros"], "Busca la palabra «adulta».", "El texto dice que una adulta puede medir unos 30 metros. Los 7 metros son de las crías."),
      localiza(2, "¿Cada cuánto tiempo sube a la superficie?", "La ballena sube a la superficie. ¿Cada cuánto tiempo?", "Cada 10 o 20 minutos", ["Cada siete meses", "Cada día de verano", "Cada siete minutos"], "Busca la palabra «superficie».", "El texto dice que sube a la superficie cada 10 o 20 minutos para respirar aire."),
      localiza(3, "En el texto aparece dos veces el número siete. ¿A qué se refieren esos dos datos?", "El número siete sale dos veces. ¿De qué hablan esos datos?", "A lo que mide la cría y a cuánto tiempo toma leche", ["A lo que mide la madre y a lo que come en un día", "A lo que come la cría y a cuánto tarda en subir", "A cuántas crías tiene y a cuántos meses vive"], "Busca la última frase y lee cada dato con la palabra que lo acompaña.", "Las crías miden unos siete metros y toman leche unos siete meses."),
    ],
  },
  {
    id: "LEE4-T3-tx3",
    titulo: "El agua de la Tierra",
    texto:
      "Casi tres cuartas partes de la Tierra están cubiertas de agua, pero la mayor parte está en los mares y es salada. Solo unas tres de cada cien gotas de agua son dulces, y muchas de esas gotas están congeladas en los polos. Una persona adulta necesita beber unos dos litros de agua al día. Un grifo que gotea puede perder unos treinta litros en un solo día. En muchos pueblos, las familias caminan más de una hora para llevar agua a casa.",
    preguntas: [
      localiza(1, "¿Cuántos litros de agua necesita beber al día una persona adulta?", "Una persona adulta bebe agua. ¿Cuántos litros necesita al día?", "Unos dos litros", ["Unos treinta litros", "Unos tres litros"], "Busca la palabra «beber».", "El texto dice que una persona adulta necesita beber unos dos litros al día."),
      localiza(2, "¿Dónde está gran parte del agua dulce, según el texto?", "Hay agua dulce en la Tierra. ¿Dónde está gran parte?", "Congelada en los polos", ["En los mares", "En los grifos de las casas", "En los pueblos"], "Busca la frase que habla del agua dulce.", "El texto dice que muchas de las gotas de agua dulce están congeladas en los polos."),
      localiza(3, "Según el texto, ¿cuántas gotas de cada cien NO son dulces?", "Tres gotas de cada cien son dulces. ¿Cuántas de cada cien NO son dulces?", "Unas 97", ["Unas 3", "Unas 30", "Unas 75"], "Encuentra el dato y réstalo de cien.", "Unas tres de cada cien son dulces. Las demás, unas 97, no lo son."),
    ],
  },
  {
    id: "LEE4-T3-tx4",
    titulo: "Visita la Laguna Verde",
    texto:
      "La Laguna Verde está a 15 kilómetros del pueblo y se puede llegar en autobús. Mide dos kilómetros de largo y, en su parte más honda, tiene 20 metros. Allí viven más de 40 tipos de aves. Los meses con más visitantes son julio y agosto. La entrada cuesta 3 monedas para los adultos y es gratis para los menores de 12 años. El sendero que rodea la laguna mide 5 kilómetros y se recorre en dos horas. Está prohibido bañarse y encender fuego.",
    preguntas: [
      localiza(1, "¿Qué dos cosas están prohibidas en la laguna?", "Hay dos cosas prohibidas. ¿Cuáles son?", "Bañarse y encender fuego", ["Pasear y mirar las aves", "Llegar en autobús y comer"], "Busca la palabra «prohibido».", "La última frase dice que está prohibido bañarse y encender fuego."),
      localiza(2, "¿Cuántos kilómetros mide el sendero que rodea la laguna?", "Un sendero rodea la laguna. ¿Cuántos kilómetros mide?", "5", ["15", "2", "20"], "Hay varios números. Busca el que va con la palabra «sendero».", "El sendero mide 5 kilómetros. Los 15 son la distancia al pueblo y los 2, el largo de la laguna."),
      localiza(3, "Una madre y su hija de 8 años entran en la laguna. ¿Cuántas monedas pagan en total?", "Entran una madre y su hija. La hija tiene 8 años. ¿Cuántas monedas pagan en total?", "3", ["6", "8", "0"], "Busca el precio para adultos y el precio para menores de 12 años.", "La madre paga 3 monedas. La hija tiene menos de 12 años y no paga. En total, 3 monedas."),
    ],
  },
  {
    id: "LEE4-T3-tx5",
    titulo: "El autobús del valle",
    imagen: { tipo: "tabla", titulo: "Horario del autobús", cabeceras: ["Sale de la aldea", "Pasa por el mercado", "Llega a la ciudad"], filas: [["7:00", "7:25", "8:10"], ["12:00", "12:25", "13:10"], ["16:30", "16:55", "17:40"]] },
    texto:
      "El autobús del valle une la aldea con la ciudad. Hace tres viajes al día, de lunes a sábado, y puedes ver sus horas en la tabla. Los domingos no hay servicio. Todos los viajes paran en el mercado. El viaje cuesta 2 monedas, y los alumnos de la escuela pagan la mitad. Si llevas bultos grandes, debes llegar a la parada diez minutos antes de la salida, para que el conductor pueda guardarlos con calma y el autobús salga a su hora.",
    preguntas: [
      tabla(1, "Mira la tabla. ¿A qué hora llega a la ciudad el autobús que sale de la aldea a las 12:00?", "Mira la tabla. Un autobús sale a las 12:00. ¿A qué hora llega a la ciudad?", "A las 13:10", ["A las 12:25", "A las 8:10"], "Busca la fila que empieza por 12:00 y sigue hasta la última columna.", "En la fila de las 12:00, la columna de la ciudad dice 13:10."),
      tabla(2, "{F1} sale de la aldea y debe estar en el mercado antes de las 13:00. ¿Cuál es el último autobús que le sirve?", "{F1} debe llegar al mercado antes de las 13:00. ¿Cuál es el último autobús que le sirve?", "El que sale a las 12:00", ["El que sale a las 7:00", "El que sale a las 16:30", "El que sale a las 13:10"], "Mira la columna del mercado y compara con las 13:00.", "El de las 12:00 pasa por el mercado a las 12:25. El siguiente llega a las 16:55, demasiado tarde."),
      tabla(3, "{M1} lleva un bulto grande y quiere tomar el autobús de la tarde. ¿A qué hora debe estar en la parada de la aldea?", "{M1} lleva un bulto grande. Quiere el autobús de la tarde. ¿A qué hora debe estar en la parada?", "A las 16:20", ["A las 16:30", "A las 16:40", "A las 16:55"], "Busca la salida en la tabla y lee en el texto qué hay que hacer con los bultos.", "El autobús de la tarde sale a las 16:30, y con bultos hay que llegar diez minutos antes: a las 16:20."),
    ],
  },
  {
    id: "LEE4-T3-tx6",
    titulo: "La cosecha del huerto",
    imagen: { tipo: "tabla", titulo: "Kilos recogidos", cabeceras: ["Verdura", "Marzo", "Abril", "Mayo"], filas: [["Tomates", "4", "9", "12"], ["Zanahorias", "10", "6", "3"], ["Cebollas", "5", "5", "7"]] },
    texto:
      "Los alumnos de 4.º cuidan el huerto de la escuela desde el año pasado. Cada mes pesan lo que recogen y lo apuntan en una tabla, para saber qué verduras dan más. Este año sembraron tomates, zanahorias y cebollas. En primavera hubo mucho sol, y a las verduras que más luz necesitan les fue muy bien. La escuela vende los tomates a las familias a 2 monedas el kilo. Con ese dinero se compran semillas y herramientas para el año que viene.",
    preguntas: [
      tabla(1, "Mira la tabla. ¿Cuántos kilos de zanahorias se recogieron en marzo?", "Mira la tabla. Busca las zanahorias y marzo. ¿Cuántos kilos hay?", "10", ["6", "4"], "Busca la fila de las zanahorias y la columna de marzo.", "En la fila de las zanahorias, la columna de marzo dice 10."),
      tabla(2, "¿Qué verdura recogieron cada mes en menor cantidad que el mes anterior?", "Una verdura bajó cada mes. ¿Cuál es?", "Las zanahorias", ["Los tomates", "Las cebollas", "Ninguna de las tres"], "Lee cada fila de izquierda a derecha.", "Las zanahorias bajan de 10 a 6 y de 6 a 3. Los tomates suben y las cebollas no bajan."),
      tabla(3, "¿Cuántas monedas ganó la escuela con los tomates de mayo, si los vendió todos?", "La escuela vendió todos los tomates de mayo. ¿Cuántas monedas ganó?", "24", ["12", "14", "18"], "Busca los kilos en la tabla y el precio en el texto.", "En mayo se recogieron 12 kilos, y cada kilo se vende a 2 monedas: 12 por 2 son 24."),
    ],
  },
  {
    id: "LEE4-T3-tx7",
    titulo: "¿Cómo llegamos a la escuela?",
    imagen: { tipo: "tabla", titulo: "Cómo llegan los alumnos", cabeceras: ["Clase", "A pie", "En bicicleta", "En autobús"], filas: [["3.º", "14", "3", "8"], ["4.º", "11", "6", "9"], ["5.º", "9", "10", "5"]] },
    texto:
      "Los alumnos de tres clases hicieron una encuesta para saber cómo llega cada uno a la escuela. Cada alumno marcó una sola respuesta: la forma en que viene casi todos los días. Después contaron las marcas y escribieron los resultados en una tabla. La directora quiere usar estos datos para decidir dónde poner un lugar para guardar bicicletas. Si en alguna clase van en bicicleta más alumnos que a pie, ese lugar se pondrá junto a la puerta de esa clase.",
    preguntas: [
      tabla(1, "Mira la tabla. ¿Cuántos alumnos de 4.º van en autobús?", "Mira la tabla. Busca 4.º y el autobús. ¿Cuántos alumnos hay?", "9", ["6", "11"], "Busca la fila de 4.º y la columna del autobús.", "En la fila de 4.º, la columna del autobús dice 9."),
      tabla(2, "¿Qué clase tiene más alumnos que van a pie?", "¿En qué clase van más alumnos a pie?", "3.º", ["4.º", "5.º", "Las tres tienen los mismos"], "Compara solo los números de la columna «A pie».", "En la columna «A pie» están 14, 11 y 9. El número mayor, 14, es de 3.º."),
      tabla(3, "¿Junto a la puerta de qué clase se pondrá el lugar para guardar bicicletas?", "Lee la última frase del texto. Mira la tabla. ¿Junto a qué clase estará el lugar para las bicicletas?", "Junto a la de 5.º", ["Junto a la de 3.º", "Junto a la de 4.º", "Junto a la de la directora"], "Lee la regla de la última frase y compruébala en cada fila.", "Solo en 5.º van más alumnos en bicicleta que a pie: 10 frente a 9."),
    ],
  },
  {
    id: "LEE4-T3-tx8",
    titulo: "Animales de la charca",
    imagen: { tipo: "tabla", titulo: "Animales vistos en la charca", cabeceras: ["Animal", "Lunes", "Miércoles", "Viernes"], filas: [["Ranas", "6", "8", "3"], ["Patos", "2", "0", "5"], ["Libélulas", "12", "15", "9"]] },
    texto:
      "Durante una semana, la clase de {F1} observó la charca que hay detrás de la escuela. Fueron tres días, siempre a las diez de la mañana, y se quedaron un cuarto de hora mirando en silencio. Cada vez contaron los animales que veían y anotaron los números en una tabla. El viernes fue el único día con lluvia. Ese día {F1} escribió en su cuaderno que los patos parecían disfrutar del agua que caía, mientras que los insectos casi no volaban.",
    preguntas: [
      tabla(1, "Mira la tabla. ¿Cuántas ranas vieron el miércoles?", "Mira la tabla. Busca las ranas y el miércoles. ¿Cuántas hay?", "8", ["6", "3"], "Busca la fila de las ranas y la columna del miércoles.", "En la fila de las ranas, la columna del miércoles dice 8."),
      tabla(2, "¿Qué día no vieron ningún pato?", "Un día no vieron patos. ¿Qué día fue?", "El miércoles", ["El lunes", "El viernes", "El martes"], "Busca el 0 en la fila de los patos.", "En la fila de los patos, el miércoles aparece un 0."),
      tabla(3, "¿Cuántas libélulas vieron el día que llovió?", "Busca qué día llovió. ¿Cuántas libélulas vieron ese día?", "9", ["15", "12", "3"], "El día de lluvia está en el texto. El número está en la tabla.", "El texto dice que llovió el viernes, y en la tabla el viernes hay 9 libélulas."),
    ],
  },
];

export const TEXTOS_4_T4: readonly TextoEscrito[] = [
  {
    id: "LEE4-T4-tx1",
    titulo: "Cómo arreglar una rueda pinchada",
    texto:
      "Materiales: un parche, pegamento para goma, una lija, un recipiente con agua y una bomba de aire.\nPasos:\n1. Saca de la rueda la cámara, que es el tubo de goma.\n2. Ínflala un poco y métela en el agua: donde salgan burbujas está el agujero.\n3. Seca la cámara y marca el agujero.\n4. Lija esa zona; si no, el parche no se pega.\n5. Pon pegamento y espera cinco minutos.\n6. Aprieta el parche con fuerza.\n7. Monta la rueda e ínflala.\nAl terminar, prueba la bicicleta con calma.",
    preguntas: [
      orden(1, "¿Cuál es el primer paso?", "¿Qué haces primero?", "Sacar la cámara de la rueda", ["Poner el pegamento", "Inflar la rueda"], "Mira el paso 1.", "El paso 1 dice que primero hay que sacar la cámara de la rueda."),
      orden(2, "¿Qué se hace justo después de lijar?", "Ya lijaste la zona. ¿Qué haces ahora?", "Poner pegamento", ["Marcar el agujero", "Apretar el parche", "Secar la cámara"], "Busca el paso de la lija y mira el siguiente.", "Lijar es el paso 4, y el paso 5 es poner pegamento."),
      orden(3, "¿Cuál de estos órdenes es correcto?", "¿Qué orden es correcto?", "Marcar el agujero, lijar, poner pegamento, poner el parche", ["Lijar, marcar el agujero, poner el parche, poner pegamento", "Poner pegamento, lijar, marcar el agujero, poner el parche", "Marcar el agujero, poner pegamento, lijar, poner el parche"], "Busca el número de cada paso y ordénalos de menor a mayor.", "Marcar es el paso 3, lijar el 4, el pegamento el 5 y apretar el parche el 6."),
      material(1, "¿Qué material sirve para encontrar el agujero?", "Buscas el agujero. ¿Qué material usas?", "El recipiente con agua", ["La lija", "El parche"], "Busca el paso de las burbujas.", "Al meter la cámara en el agua, salen burbujas por el agujero."),
      material(2, "¿Qué cosa NO aparece en la lista de materiales?", "¿Qué cosa NO está en la lista?", "Unas tijeras", ["Una lija", "Una bomba de aire", "Un parche"], "Compara cada opción con la lista del principio.", "La lista nombra parche, pegamento, lija, agua y bomba. Las tijeras no están."),
      material(3, "¿Qué material se usa en dos pasos distintos?", "Un material se usa dos veces. ¿Cuál es?", "La bomba de aire", ["La lija", "El parche", "El pegamento"], "Busca dónde se infla algo.", "La bomba se usa en el paso 2, para inflar un poco la cámara, y en el paso 7, para inflar la rueda."),
      falta(1, "¿Qué pasa si no lijas la zona del agujero?", "No lijas la zona. ¿Qué pasa?", "El parche no se pega", ["La rueda se infla sola", "Salen más burbujas"], "Lee el paso 4 hasta el final.", "El paso 4 lo dice: si no lijas, el parche no se pega."),
      falta(2, "Si no metes la cámara en el agua, ¿qué problema tendrás?", "No metes la cámara en el agua. ¿Qué problema tienes?", "No sabrás dónde está el agujero", ["No podrás sacar la rueda", "La lija no servirá para nada", "El pegamento se secará antes"], "Piensa para qué sirve el agua en el paso 2.", "Las burbujas en el agua muestran el agujero. Sin agua, no ves dónde está."),
      falta(3, "Si te olvidas de marcar el agujero, ¿qué dificultad tendrás en el paso 4?", "No marcas el agujero. Llegas al paso 4. ¿Qué dificultad tienes?", "No sabrás qué zona lijar", ["No tendrás con qué lijar", "No podrás secar la cámara", "No podrás inflar la cámara"], "Fuera del agua ya no hay burbujas. ¿Cómo encontrarías el agujero?", "Fuera del agua ya no salen burbujas. Sin la marca, es difícil saber dónde lijar."),
    ],
  },
  {
    id: "LEE4-T4-tx2",
    titulo: "Cómo hacer adobes",
    texto:
      "Materiales: tierra arcillosa, paja, agua, una pala y un molde de madera.\nPasos:\n1. Mezcla la tierra y el agua con la pala hasta tener un barro espeso.\n2. Añade la paja: sin ella, los adobes se agrietan al secarse.\n3. Deja reposar el barro un día.\n4. Moja el molde para que el barro no se pegue.\n5. Llena el molde y aprieta bien, para que no queden huecos.\n6. Retira el molde con cuidado.\n7. Deja secar los adobes al sol dos semanas.\nDespués, guárdalos en un lugar seco.",
    preguntas: [
      orden(1, "¿Qué se hace justo antes de añadir la paja?", "Vas a añadir la paja. ¿Qué hiciste justo antes?", "Mezclar la tierra y el agua", ["Mojar el molde", "Secar los adobes"], "La paja está en el paso 2. Mira el paso 1.", "Antes de la paja, en el paso 1, se mezclan la tierra y el agua."),
      orden(2, "¿Qué se hace justo después de dejar reposar el barro?", "El barro ya reposó. ¿Qué haces ahora?", "Mojar el molde", ["Añadir la paja", "Retirar el molde", "Llenar el molde"], "Busca el paso de reposar y mira el siguiente.", "Reposar es el paso 3, y el paso 4 es mojar el molde."),
      orden(3, "Es lunes por la mañana y acabas de añadir la paja. ¿Cuándo puedes empezar a llenar el molde?", "Es lunes por la mañana. Acabas de añadir la paja. ¿Cuándo llenas el molde?", "El martes", ["El mismo lunes", "El lunes de la semana siguiente", "Dos semanas después"], "Fíjate en cuánto tiempo pide el paso 3.", "Después de la paja, el barro reposa un día. Por eso se llena el molde el martes."),
      material(1, "¿Con qué se mezclan la tierra y el agua?", "Mezclas la tierra y el agua. ¿Con qué?", "Con la pala", ["Con el molde", "Con la paja"], "Lee el paso 1.", "El paso 1 dice que se mezclan con la pala."),
      material(2, "¿Para qué sirve la paja?", "Pones paja en el barro. ¿Para qué sirve?", "Para que los adobes no se agrieten", ["Para que el barro no se pegue al molde", "Para que no queden huecos", "Para mojar la tierra"], "Lee el paso 2 con atención.", "El paso 2 dice que sin paja los adobes se agrietan al secarse."),
      material(3, "¿Qué materiales forman parte del adobe cuando ya está seco?", "El adobe ya está seco. ¿De qué está hecho?", "Tierra arcillosa y paja", ["Madera y paja", "Tierra arcillosa y madera", "Paja y una pala"], "Separa lo que se queda en el barro de lo que solo se usa para trabajar.", "La tierra y la paja forman el barro. La pala y el molde solo son herramientas, y el agua se seca."),
      falta(1, "¿Qué pasa si no añades paja?", "No pones paja. ¿Qué pasa?", "Los adobes se agrietan", ["Los adobes se secan en un día", "El molde se rompe"], "Lee el paso 2.", "El paso 2 dice que, sin paja, los adobes se agrietan al secarse."),
      falta(2, "Si no mojas el molde, ¿qué problema tendrás en el paso 6?", "No mojas el molde. Llegas al paso 6. ¿Qué problema tienes?", "El barro se quedará pegado al molde", ["El barro no tendrá paja", "Faltará tierra para mezclar", "Los adobes se secarán demasiado rápido"], "Lee para qué se moja el molde en el paso 4.", "El molde se moja para que el barro no se pegue. Si no lo mojas, al retirarlo se quedará pegado."),
      falta(3, "Si llenas el molde sin apretar, ¿cómo saldrá el adobe?", "Llenas el molde. No aprietas. ¿Cómo sale el adobe?", "Con huecos dentro", ["Sin nada de paja", "Pegado a la pala", "Seco en un solo día"], "Lee para qué hay que apretar en el paso 5.", "El paso 5 dice que hay que apretar para que no queden huecos. Sin apretar, quedan huecos."),
    ],
  },
  {
    id: "LEE4-T4-tx3",
    titulo: "Cómo hacer papel nuevo con papel usado",
    texto:
      "Materiales: papel usado, agua, un recipiente grande, un palo, un marco con malla, dos telas y dos tablas.\nPasos:\n1. Rompe el papel en trozos pequeños.\n2. Déjalo en agua toda una noche para que se ablande.\n3. Bate con el palo hasta formar una pasta.\n4. Mete el marco en la pasta y sácalo con una capa fina encima.\n5. Vuelca la capa sobre una tela y cúbrela con la otra.\n6. Aprieta entre las tablas para sacar el agua.\n7. Cuelga la hoja un día.",
    preguntas: [
      orden(1, "¿Qué se hace primero con el papel usado?", "¿Qué haces primero con el papel?", "Romperlo en trozos pequeños", ["Batirlo con el palo", "Colgarlo un día"], "Lee el paso 1.", "El paso 1 dice que primero se rompe el papel en trozos pequeños."),
      orden(2, "¿Qué se hace justo antes de meter el marco en la pasta?", "Vas a meter el marco en la pasta. ¿Qué hiciste justo antes?", "Batir con el palo", ["Colgar la hoja", "Apretar entre las tablas", "Volcar la capa sobre una tela"], "El marco está en el paso 4. Mira el anterior.", "Batir con el palo es el paso 3, y justo después se mete el marco."),
      orden(3, "¿Cuál de estos órdenes es correcto?", "¿Qué orden es correcto?", "Ablandar, batir, sacar la capa con el marco, apretar", ["Batir, ablandar, apretar, sacar la capa con el marco", "Sacar la capa con el marco, ablandar, batir, apretar", "Ablandar, sacar la capa con el marco, batir, apretar"], "Busca el número de cada paso.", "Ablandar es el paso 2, batir el 3, sacar la capa el 4 y apretar el 6."),
      material(1, "¿Con qué se bate el papel?", "Bates el papel. ¿Con qué?", "Con el palo", ["Con las tablas", "Con la malla"], "Lee el paso 3.", "El paso 3 dice que se bate con el palo."),
      material(2, "¿Para qué sirven las tablas?", "Usas dos tablas. ¿Para qué?", "Para sacar el agua apretando", ["Para romper el papel", "Para batir la pasta", "Para colgar la hoja"], "Busca la palabra «tablas» en los pasos.", "El paso 6 dice que se aprieta entre las tablas para sacar el agua."),
      material(3, "¿Cuántas telas necesitas y por qué?", "¿Cuántas telas necesitas? ¿Por qué?", "Dos, una debajo de la capa y otra encima", ["Una, para colgar la hoja", "Dos, una para cada tabla del paso 7", "Tres, una para cada capa de papel"], "Lee los materiales y el paso 5.", "La lista pide dos telas: la capa se vuelca sobre una y se cubre con la otra."),
      falta(1, "¿Para qué se deja el papel en agua toda una noche?", "Dejas el papel en agua una noche. ¿Para qué?", "Para que se ablande", ["Para que se seque", "Para que cambie de color"], "Lee el paso 2 hasta el final.", "El paso 2 dice que se deja en agua para que se ablande."),
      falta(2, "Si no dejas el papel en agua, ¿qué problema tendrás en el paso 3?", "No dejas el papel en agua. Llegas al paso 3. ¿Qué problema tienes?", "Será muy difícil formar la pasta", ["No podrás romper el papel", "El palo se ablandará", "Las telas se mojarán demasiado"], "Piensa qué le pasa al papel en el agua y qué necesitas en el paso 3.", "El agua ablanda el papel. Si sigue duro, no se deshace al batirlo y no se forma la pasta."),
      falta(3, "Si te saltas el paso 6, ¿qué pasará?", "Te saltas el paso 6. ¿Qué pasará?", "La hoja tendrá mucha más agua al colgarla", ["La pasta no se formará", "El papel no se podrá romper", "La capa no subirá con el marco"], "Mira qué paso quitas: los pasos anteriores sí están hechos.", "En el paso 6 se saca el agua. Sin ese paso, la hoja llega al paso 7 con mucha más agua."),
    ],
  },
  {
    id: "LEE4-T4-tx4",
    titulo: "Cómo secar fruta al sol",
    texto:
      "Materiales: manzanas, un cuchillo, una bandeja, una tela fina y un frasco con tapa.\nPasos:\n1. Lava la fruta.\n2. Pide a un adulto que la corte en rodajas finas: las gruesas tardan mucho en secarse.\n3. Coloca las rodajas en la bandeja sin que se toquen.\n4. Tápalas con la tela para que no se posen las moscas.\n5. Pon la bandeja al sol.\n6. Métela en casa por la noche, para que la humedad no la moje.\n7. Repítelo tres días.\n8. Guarda la fruta en el frasco.",
    preguntas: [
      orden(1, "¿Qué se hace justo después de lavar la fruta?", "Ya lavaste la fruta. ¿Qué pasa ahora?", "Cortarla en rodajas finas", ["Ponerla al sol", "Guardarla en el frasco"], "Lavar es el paso 1. Mira el paso 2.", "Después de lavar, el paso 2 dice que un adulto la corte en rodajas finas."),
      orden(2, "¿Qué se hace justo antes de poner la bandeja al sol?", "Vas a poner la bandeja al sol. ¿Qué hiciste justo antes?", "Tapar las rodajas con la tela", ["Guardar la fruta en el frasco", "Meter la bandeja en casa", "Lavar la fruta"], "Poner al sol es el paso 5. Mira el paso 4.", "Tapar con la tela es el paso 4, justo antes de poner la bandeja al sol."),
      orden(3, "Empiezas a secar la fruta el lunes. ¿En qué momento puedes guardarla en el frasco?", "Pones la fruta al sol el lunes. ¿Cuándo la guardas en el frasco?", "Al terminar el miércoles", ["Al terminar el lunes", "Al terminar el martes", "Al terminar el domingo"], "Cuenta tres días de sol empezando por el lunes.", "Son tres días: lunes, martes y miércoles. Cuando terminan, se guarda en el frasco."),
      material(1, "¿Dónde se colocan las rodajas?", "¿Dónde pones las rodajas?", "En la bandeja", ["En el frasco", "En la tela"], "Lee el paso 3.", "El paso 3 dice que las rodajas se colocan en la bandeja."),
      material(2, "¿Para qué sirve la tela fina?", "Usas una tela fina. ¿Para qué?", "Para que no se posen las moscas", ["Para secar la fruta después de lavarla", "Para cortar las rodajas", "Para guardar la fruta seca"], "Busca la palabra «tela» en los pasos.", "El paso 4 dice que se tapan con la tela para que no se posen las moscas."),
      material(3, "¿Qué material de la lista se usa solo al final de todo?", "Un material se usa solo al final. ¿Cuál es?", "El frasco con tapa", ["La bandeja", "La tela fina", "El cuchillo"], "Busca el último paso.", "El frasco aparece solo en el paso 8, el último."),
      falta(1, "¿Qué pasa si cortas rodajas muy gruesas?", "Cortas rodajas muy gruesas. ¿Qué pasa?", "Tardan mucho en secarse", ["Se secan en una hora", "Se pegan al frasco"], "Lee el paso 2 hasta el final.", "El paso 2 dice que las rodajas gruesas tardan mucho en secarse."),
      falta(2, "Si dejas la bandeja fuera por la noche, ¿qué puede pasar?", "Dejas la bandeja fuera de noche. ¿Qué puede pasar?", "La humedad mojará la fruta", ["La fruta se secará más rápido", "Las moscas se irán", "La tela se romperá"], "Lee el paso 6.", "El paso 6 dice que se mete en casa para que la humedad no la moje."),
      falta(3, "Si te saltas el paso 4, ¿qué problema tendrás mientras la bandeja está al sol?", "Te saltas el paso 4. La bandeja está al sol. ¿Qué problema tienes?", "Se posarán moscas sobre la fruta", ["La fruta no recibirá nada de sol", "Las rodajas quedarán más gruesas", "No podrás cerrar el frasco"], "Mira qué se hace en el paso 4 y para qué.", "En el paso 4 se pone la tela para que no se posen las moscas. Sin ella, se posarán sobre la fruta."),
    ],
  },
];

export const TEXTOS_4_T5: readonly TextoEscrito[] = [
  {
    id: "LEE4-T5-tx1",
    titulo: "La biblioteca del barrio",
    texto:
      "La biblioteca del barrio abrió en marzo. Tiene dos salas y unos mil libros. Abre de lunes a viernes, de tres a seis de la tarde. El año pasado entraron más de quinientos lectores. {F1}, que va cada semana, dice: «Esta es la biblioteca más bonita del mundo». Su amigo {M1} dice: «Mil libros son demasiado pocos para un barrio». Yo creo que debería abrir también los sábados. La bibliotecaria apunta cada préstamo en un cuaderno. Para entrar no hay que pagar nada.",
    preguntas: [
      distingue(1, OPINION, OPINION_FACIL, "Yo creo que debería abrir también los sábados.", ["La biblioteca abre de lunes a viernes, de tres a seis de la tarde.", "La biblioteca abrió en marzo."], PISTA_OPINION, "«Yo creo» y «debería» muestran lo que piensa alguien. Lo demás se puede comprobar."),
      distingue(2, HECHO, HECHO_FACIL, "La bibliotecaria apunta cada préstamo en un cuaderno.", ["Esta es la biblioteca más bonita del mundo.", "Mil libros son demasiado pocos para un barrio.", "La biblioteca debería abrir los sábados."], PISTA_HECHO, "Se puede comprobar mirando el cuaderno. Las otras frases dicen lo que piensa alguien."),
      distingue(3, "Todas estas frases llevan números, pero solo una es una opinión. ¿Cuál es?", "Todas las frases llevan números. Solo una es una opinión. ¿Cuál es?", "Mil libros son demasiado pocos para un barrio.", ["La biblioteca tiene unos mil libros.", "El año pasado entraron más de quinientos lectores.", "La biblioteca abre de tres a seis de la tarde."], "Un número no basta para que algo sea un hecho. Busca una palabra que juzgue.", "«Demasiado pocos» es lo que piensa {M1}. A otra persona mil libros le pueden parecer bastantes."),
      justifica(1, "¿Por qué «La biblioteca tiene dos salas» es un hecho?", "«La biblioteca tiene dos salas» es un hecho. ¿Por qué?", "Porque se puede comprobar contando las salas", ["Porque la biblioteca del barrio le gusta a todo el mundo", "Porque es una frase corta", "Porque la dice una persona mayor"], "Piensa qué tiene que tener un hecho.", "Cualquiera puede ir a la biblioteca y contar las salas. Por eso es un hecho."),
      justifica(2, "¿Qué palabras muestran que «Esta es la biblioteca más bonita del mundo» es una opinión?", "«Esta es la biblioteca más bonita del mundo». ¿Qué palabras muestran que es una opinión?", "«más bonita»", ["«esta es»", "«la biblioteca»", "«del mundo»"], "Busca las palabras que dicen lo que le parece a {F1}.", "«Más bonita» depende del gusto de cada persona. Eso no se puede medir."),
      justifica(3, "Otra persona dice que esa biblioteca es fea, y {F1} dice que es la más bonita del mundo. ¿Qué se puede decir de las dos frases?", "{F1} dice que es la más bonita. Otra persona dice que es fea. ¿Qué se puede decir?", "Son dos opiniones y ninguna se puede demostrar", ["Tiene razón {F1}, porque va cada semana", "Tiene razón la otra persona, porque habla después", "Son dos hechos que se pueden medir"], "¿Hay alguna forma de medir si un lugar es bonito?", "Lo bonito depende del gusto de cada uno. Son dos opiniones y no se puede demostrar cuál es la verdadera."),
    ],
  },
  {
    id: "LEE4-T5-tx2",
    titulo: "El huerto de la escuela",
    texto:
      "El huerto de nuestra escuela mide diez metros de largo. Lo empezamos en enero y ya tiene tomates, zanahorias y lechugas. Cada clase lo riega un día a la semana. El mes pasado recogimos doce kilos de zanahorias. {M1} dice: «Las zanahorias del huerto son las más ricas del mundo». La maestra dice: «Todas las escuelas deberían tener un huerto». A mí me parece que las lechugas son las plantas más bonitas. La cosecha se reparte entre las familias. Junto al huerto hay un grifo.",
    preguntas: [
      distingue(1, OPINION, OPINION_FACIL, "A mí me parece que las lechugas son las plantas más bonitas.", ["El huerto mide diez metros de largo.", "El mes pasado recogimos en el huerto doce kilos de zanahorias."], PISTA_OPINION, "«Me parece» muestra que es lo que piensa quien escribe."),
      distingue(2, OPINION, OPINION_FACIL, "Todas las escuelas deberían tener un huerto.", ["El mes pasado recogimos doce kilos de zanahorias.", "Cada clase riega el huerto un día a la semana.", "El huerto tiene tomates, zanahorias y lechugas."], PISTA_OPINION, "«Deberían» dice lo que a alguien le parece bien. Las otras frases se pueden comprobar."),
      distingue(3, HECHO, HECHO_FACIL, "El huerto se empezó en enero.", ["Las zanahorias del huerto son las más ricas del mundo.", "Todas las escuelas deberían tener un huerto.", "Las lechugas son las plantas más bonitas."], PISTA_HECHO, "La fecha en que empezó el huerto se puede comprobar. «Más ricas», «deberían» y «más bonitas» dependen de quien habla."),
      justifica(1, "¿Por qué «El huerto mide diez metros de largo» es un hecho?", "«El huerto mide diez metros de largo» es un hecho. ¿Por qué?", "Porque se puede comprobar midiéndolo", ["Porque el huerto es muy bonito", "Porque lo escribió un alumno que trabaja en ese huerto", "Porque diez es un número grande"], "Piensa qué harías para saber si es verdad.", "Con un metro se puede medir el huerto. Lo que se puede comprobar es un hecho."),
      justifica(2, "¿Cómo se podría comprobar que el mes pasado recogieron doce kilos de zanahorias?", "Recogieron doce kilos de zanahorias. ¿Cómo se podría comprobar?", "Mirando lo que marcó la balanza ese mes", ["Preguntando si las zanahorias estaban ricas", "Probando una lechuga del huerto", "Midiendo el largo del huerto"], "¿Con qué se saben los kilos de algo?", "Los kilos se saben con una balanza. El sabor o el largo del huerto no dicen cuántos kilos hubo."),
      justifica(3, "¿Por qué «Las zanahorias del huerto son las más ricas del mundo» no se puede comprobar?", "«Son las más ricas del mundo». ¿Por qué no se puede comprobar?", "Porque el sabor que gusta cambia de una persona a otra", ["Porque nadie ha visto el huerto", "Porque las zanahorias no se pueden pesar", "Porque {M1} no sabe contar zanahorias"], "¿A todo el mundo le gustan las mismas cosas?", "Lo que es rico para una persona puede no serlo para otra. Por eso es una opinión."),
    ],
  },
  {
    id: "LEE4-T5-tx3",
    titulo: "El autobús nuevo",
    texto:
      "Desde mayo, un autobús nuevo llega hasta el barrio alto. Tiene treinta asientos y pasa cada cuarenta minutos. El viaje hasta el centro dura veinte minutos y cuesta una moneda. Mi vecino dice: «Es el autobús más cómodo de la ciudad». Yo creo que hace demasiado ruido. Mi madre dice: «Cuarenta minutos de espera son una barbaridad». El conductor lleva quince años en este trabajo. Él dice: «Todo el mundo debería viajar en autobús». La última salida es a las ocho de la tarde.",
    preguntas: [
      distingue(1, OPINION, OPINION_FACIL, "Yo creo que hace demasiado ruido.", ["El autobús tiene treinta asientos.", "El viaje hasta el centro dura veinte minutos y cuesta una moneda."], PISTA_OPINION, "«Yo creo» y «demasiado» muestran que es lo que piensa quien escribe."),
      distingue(2, HECHO, HECHO_FACIL, "El conductor lleva quince años en este trabajo.", ["Es el autobús más cómodo de la ciudad.", "Todo el mundo debería viajar en autobús.", "El autobús hace demasiado ruido."], PISTA_HECHO, "Los años de trabajo se pueden comprobar. Las otras frases dependen de lo que piensa cada uno."),
      distingue(3, "Todas estas frases hablan de tiempo o de dinero. ¿Cuál es una opinión?", "Las frases hablan de tiempo o de dinero. ¿Cuál es una opinión?", "Cuarenta minutos de espera son una barbaridad.", ["El autobús pasa cada cuarenta minutos.", "El viaje hasta el centro dura veinte minutos.", "El viaje hasta el centro cuesta una moneda."], "Busca una palabra que diga lo que a alguien le parece.", "«Una barbaridad» es lo que le parece a la madre. Los cuarenta minutos se miden, pero ese juicio no."),
      justifica(1, "¿Por qué «El autobús tiene treinta asientos» es un hecho?", "«El autobús tiene treinta asientos» es un hecho. ¿Por qué?", "Porque se pueden contar los asientos", ["Porque el autobús es nuevo", "Porque los asientos son cómodos", "Porque el conductor lleva quince años en este trabajo"], "¿Qué harías para saber si es verdad?", "Si subes al autobús, puedes contar los asientos. Por eso es un hecho."),
      justifica(2, "¿Qué palabra muestra que «Todo el mundo debería viajar en autobús» es una opinión?", "«Todo el mundo debería viajar en autobús». ¿Qué palabra muestra que es una opinión?", "«debería»", ["«mundo»", "«viajar»", "«autobús»"], "Busca la palabra que dice lo que alguien quiere que pase.", "«Debería» dice lo que al conductor le parece bien, no lo que pasa de verdad."),
      justifica(3, "«Pasa cada cuarenta minutos» es un hecho y «Cuarenta minutos de espera son una barbaridad» es una opinión. ¿Por qué una es un hecho y la otra no?", "Una frase es un hecho y la otra, una opinión. Las dos dicen «cuarenta minutos». ¿Por qué una es un hecho y la otra no?", "La primera se puede medir con un reloj y la segunda es un juicio", ["La primera es más corta que la segunda", "La segunda es falsa y la primera es verdadera", "La segunda no lleva ningún número"], "Compara qué se puede medir en cada frase.", "El tiempo entre autobuses se mide con un reloj. Que sea una barbaridad depende de quien espera."),
    ],
  },
  {
    id: "LEE4-T5-tx4",
    titulo: "La votación del recreo",
    texto:
      "La semana pasada, la clase votó a qué jugar en el recreo. Veinte alumnos votaron por la pelota y doce por saltar a la cuerda. La maestra contó los votos en la pizarra. {F1} dice: «Saltar a la cuerda es mucho más divertido». {M1} dice: «La pelota es el mejor juego que existe». El recreo dura treinta minutos. {M2} dice: «Treinta minutos son muy pocos». Votaron los treinta y dos alumnos de la clase. Desde el lunes, la clase juega a la pelota.",
    preguntas: [
      distingue(1, OPINION, OPINION_FACIL, "La pelota es el mejor juego que existe.", ["El recreo dura treinta minutos.", "La maestra contó en la pizarra los votos de toda la clase."], PISTA_OPINION, "«El mejor» depende de lo que le gusta a cada persona. Las otras frases se pueden comprobar."),
      distingue(2, HECHO, HECHO_FACIL, "Doce alumnos votaron por saltar a la cuerda.", ["Saltar a la cuerda es mucho más divertido.", "La pelota es el mejor juego que existe.", "Treinta minutos son muy pocos."], PISTA_HECHO, "Los votos se pueden contar en la pizarra. Las otras frases dicen lo que piensa alguien."),
      distingue(3, "Las frases hablan de la pelota y del recreo. ¿Cuál es un hecho?", "Las frases hablan de la pelota y del recreo. ¿Cuál es un hecho?", "La pelota recibió más votos que la cuerda.", ["La pelota es mejor que la cuerda.", "El recreo debería durar más tiempo.", "Treinta minutos son muy pocos."], "Recibir más votos y ser mejor no es lo mismo. ¿Cuál se puede contar?", "20 votos son más que 12: se puede comprobar contando. Que la pelota sea mejor sigue siendo una opinión."),
      justifica(1, "¿Por qué «Veinte alumnos votaron por la pelota» es un hecho?", "«Veinte alumnos votaron por la pelota» es un hecho. ¿Por qué?", "Porque se pueden contar los votos", ["Porque la pelota es divertida", "Porque a {M1} le parece que la pelota es el mejor juego", "Porque veinte alumnos son muchos"], "¿Qué se ve en la pizarra?", "La maestra contó los votos, y cualquiera puede volver a contarlos."),
      justifica(2, "¿Qué palabras muestran que «Saltar a la cuerda es mucho más divertido» es una opinión?", "«Saltar a la cuerda es mucho más divertido». ¿Qué palabras muestran que es una opinión?", "«más divertido»", ["«saltar»", "«a la cuerda»", "«es»"], "Busca las palabras que dicen lo que le parece a {F1}.", "Lo divertido depende de cada persona. A otros les divierte más la pelota."),
      justifica(3, "Ganó la pelota. ¿Demuestra eso que la pelota es el mejor juego que existe?", "Ganó la pelota. ¿Eso demuestra que es el mejor juego que existe?", "No: solo demuestra que en esa clase tuvo más votos", ["Sí: lo que tiene más votos siempre es lo mejor", "Sí: porque la maestra contó los votos", "No: porque los votos no se pueden contar"], "Separa lo que se puede contar de lo que depende del gusto.", "Los votos dicen qué eligió más gente en esa clase. «El mejor» sigue siendo una opinión."),
    ],
  },
];
