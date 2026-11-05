// LEE 3.º, temas 1 (significado por el contexto) y 2 (idea principal).
// Los textos del tema 2 no llevan título: elegirlo es la tarea.
import type { TextoEscrito } from "../../plantillas.ts";
import { dibujo, preguntasDe } from "./comun.ts";

const ctx = preguntasDe("LEE3-T1-a");
const trata = preguntasDe("LEE3-T2-a");
const titulo = preguntasDe("LEE3-T2-b");

const QUE_TRATA = "¿De qué trata el texto?";
const QUE_TRATA_FACIL = "Piensa en todo el texto. ¿De qué habla?";
const MEJOR_TITULO = "¿Cuál es el mejor título para este texto?";
const MEJOR_TITULO_FACIL = "Un buen título habla de todo el texto. ¿Cuál es el mejor?";
const PISTA_TRATA = "Piensa en qué hablan todas las frases, no solo una.";
const PISTA_TITULO = "Un buen título sirve para todo el texto, no solo para una parte.";

export const TEXTOS_3_T1: readonly TextoEscrito[] = [
  {
    id: "LEE3-T1-tx1",
    titulo: "Después de la lluvia",
    imagen: dibujo("nube"),
    texto:
      "Aquella tarde cayó un aguacero tan fuerte que el camino se llenó de charcos. {F1} corrió al huerto para proteger las plantas jóvenes. Las tapó con una lona y la sujetó con piedras. Al día siguiente, el sol volvió a salir y las plantas estaban intactas: ninguna tenía una hoja rota. {F1} sonrió, tomó la azada y siguió cavando la tierra, porque aún quedaba mucho por sembrar esa semana.",
    preguntas: [
      ctx(1, "¿Qué significa «aguacero» en el texto?", "Lee la primera frase. ¿Qué es un «aguacero»?", "Una lluvia muy fuerte", ["Un charco muy grande", "Un viento frío"], "Mira qué le pasó al camino por culpa del aguacero.", "El aguacero cayó tan fuerte que llenó el camino de charcos: es una lluvia muy fuerte."),
      ctx(2, "En el texto, las plantas estaban «intactas». ¿Qué quiere decir?", "Las plantas estaban «intactas». ¿Qué quiere decir?", "Que no tenían ningún daño", ["Que estaban tapadas con una lona", "Que estaban mucho más altas que antes", "Que estaban llenas de charcos"], "Lee lo que viene justo después de los dos puntos.", "El texto explica que ninguna tenía una hoja rota. Por eso, «intactas» quiere decir sin ningún daño."),
      ctx(3, "¿Qué es una «azada», según lo que hace {F1} con ella?", "{F1} usa una «azada». ¿Qué es?", "Una herramienta para cavar la tierra", ["Una tela gruesa para tapar plantas", "Una bolsa pequeña para guardar semillas", "Una piedra para sujetar la lona"], "Fíjate en qué hace {F1} justo después de tomarla.", "{F1} toma la azada y sigue cavando la tierra. Entonces, es una herramienta para cavar."),
    ],
  },
  {
    id: "LEE3-T1-tx2",
    titulo: "Bajo el árbol",
    imagen: dibujo("arbol"),
    texto:
      "{M1} y su abuelo descansaban bajo un árbol enorme. Desde abajo apenas se veía el cielo, porque la copa estaba llena de ramas y hojas. De pronto oyeron un golpeteo. Un pájaro picaba la corteza del tronco buscando insectos. —Es un animal muy paciente —susurró el abuelo—. No hagas ruido o se marchará. {M1} se quedó inmóvil, sin mover ni un dedo, hasta que el pájaro alzó el vuelo.",
    preguntas: [
      ctx(1, "¿Qué significa «inmóvil» en el texto?", "{M1} se quedó «inmóvil». ¿Qué quiere decir?", "Muy quieto, sin moverse", ["Muy cansado, casi dormido", "Muy asustado, a punto de llorar"], "Lee lo que viene justo después de esa palabra.", "El texto dice que {M1} no movió ni un dedo. Eso es estar inmóvil: muy quieto."),
      ctx(2, "El abuelo «susurró». ¿Qué quiere decir?", "El abuelo «susurró». ¿Qué hizo?", "Habló en voz muy baja", ["Gritó con mucha fuerza", "Cantó una canción", "Preguntó algo enfadado"], "Piensa en lo que el abuelo le pide a {M1} en ese momento.", "El abuelo pide que no hagan ruido para que el pájaro no se vaya. Por eso habla en voz muy baja."),
      ctx(3, "La palabra «copa» tiene varios significados. ¿Qué significa en este texto?", "«Copa» puede significar varias cosas. ¿Qué es en este texto?", "La parte alta del árbol, con ramas y hojas", ["Un vaso con pie para beber", "Un premio que gana un equipo", "La parte baja y gruesa del tronco"], "Busca de qué estaba llena la copa y desde dónde la miran.", "La copa estaba llena de ramas y hojas y tapaba el cielo. Es la parte alta del árbol."),
    ],
  },
  {
    id: "LEE3-T1-tx3",
    titulo: "La noche de la vela",
    imagen: dibujo("luna"),
    texto:
      "Una noche se fue la luz en todo el barrio. {F1} encendió una vela y la llama iluminó la cocina. Su hermano {M1} estaba desconcertado: no entendía qué ocurría ni dónde estaban las cosas. —No te preocupes —le dijo ella—. Es un apagón. Pasará pronto. Se sentaron juntos a contar historias. Una hora después, la luz regresó y todos los vecinos aplaudieron desde sus ventanas, muy contentos.",
    preguntas: [
      ctx(1, "¿Qué es un «apagón», según el texto?", "¿Qué es un «apagón»?", "Un rato en que se va la luz", ["Una vela muy grande", "Una historia de miedo"], "Lee cómo empieza el texto.", "Al principio se va la luz en todo el barrio, y {F1} dice que es un apagón."),
      ctx(2, "¿Qué significa que {M1} estaba «desconcertado»?", "{M1} estaba «desconcertado». ¿Cómo estaba?", "Confundido, sin entender qué pasaba", ["Muy contento con la vela", "Enfadado con su hermana", "Con mucho sueño y sin ganas de hablar"], "Lee lo que viene después de los dos puntos.", "El texto dice que {M1} no entendía qué ocurría. Por eso, «desconcertado» significa confundido."),
      ctx(3, "«Llama» tiene varios significados. ¿Qué significa en la frase «la llama iluminó la cocina»?", "«Llama» puede significar varias cosas. En este texto, ¿qué ilumina la cocina?", "El fuego que sale de la vela", ["Un animal que tiene mucha lana", "Una voz que pide ayuda desde lejos", "La luz que vuelve al barrio"], "Mira qué acaba de encender {F1}.", "{F1} enciende una vela y lo que da luz es su fuego. Esa es la llama."),
    ],
  },
  {
    id: "LEE3-T1-tx4",
    titulo: "Un año de poca lluvia",
    imagen: dibujo("hoja"),
    texto:
      "Este año llovió poco y la cosecha de tomates fue escasa: en cada planta había apenas dos o tres. En cambio, las calabazas crecieron en abundancia y llenaron todo el terreno. {N1} llevó al mercado una carretilla de calabazas y las vendió enseguida. Con lo que ganó, compró semillas nuevas. —El próximo año sembraré de todo —dijo—. Así, si una planta no da fruto, las otras nos salvan la temporada.",
    preguntas: [
      ctx(1, "¿Qué significa que la cosecha fue «escasa»?", "La cosecha fue «escasa». ¿Qué quiere decir?", "Que hubo muy pocos tomates", ["Que hubo tomates muy grandes", "Que hubo tomates muy dulces"], "Lee cuántos tomates había en cada planta.", "En cada planta había apenas dos o tres tomates. Eso es una cosecha escasa: muy poca."),
      ctx(2, "¿Qué significa «en abundancia» en el texto?", "Las calabazas crecieron «en abundancia». ¿Qué quiere decir?", "En gran cantidad", ["Muy despacio", "Con muy poca agua", "Solo en una esquina del terreno"], "«En cambio» avisa de que las calabazas son lo contrario de los tomates.", "Las calabazas llenaron todo el terreno, al contrario que los tomates. Crecieron en gran cantidad."),
      ctx(3, "¿Qué quiere decir «nos salvan la temporada» en el texto?", "«Las otras nos salvan la temporada». ¿Qué quiere decir?", "Que habrá algo que cosechar aunque falle una planta", ["Que las semillas nuevas se venden más caras", "Que las plantas sobrevivirán sin nada de agua", "Que el próximo año lloverá mucho más"], "Piensa por qué {N1} quiere sembrar de todo.", "Si una planta no da fruto, las otras sí darán. Así habrá cosecha ese año."),
    ],
  },
  {
    id: "LEE3-T1-tx5",
    titulo: "Naranjas en el autobús",
    imagen: dibujo("naranja"),
    texto:
      "El autobús de la mañana iba repleto: no quedaba ni un asiento libre y mucha gente viajaba de pie. {F1} se sujetó a la barra. En una curva, el autobús frenó de golpe y una señora soltó su bolsa. Las naranjas rodaron por el pasillo y todos ayudaron a recogerlas. La señora, agradecida, repartió una a cada uno. El viaje duró diez minutos más, pero nadie se quejó de la demora.",
    preguntas: [
      ctx(1, "¿Qué significa que el autobús iba «repleto»?", "El autobús iba «repleto». ¿Cómo iba?", "Lleno de gente", ["Casi vacío", "Muy rápido"], "Mira si quedaban asientos libres.", "No quedaba ni un asiento libre y había gente de pie. El autobús iba lleno."),
      ctx(2, "¿Qué significa que la señora estaba «agradecida»?", "La señora estaba «agradecida». ¿Cómo estaba?", "Contenta por la ayuda que recibió", ["Enfadada por el frenazo", "Cansada de viajar de pie", "Triste por sus naranjas"], "Mira qué hizo la gente y qué hizo después la señora.", "Todos la ayudaron y ella les dio una naranja a cada uno. Estaba contenta por esa ayuda."),
      ctx(3, "¿Qué es la «demora» de la que nadie se quejó?", "Nadie se quejó de la «demora». ¿Qué es la «demora»?", "El tiempo de más que tardó el viaje", ["La curva en la que frenó el autobús", "La falta de asientos libres", "El ruido de las naranjas en el pasillo"], "Lee el principio de la última frase.", "El viaje duró diez minutos más. Ese retraso es la demora."),
    ],
  },
];

export const TEXTOS_3_T2: readonly TextoEscrito[] = [
  // Dificultad 1: el tema aparece en la primera frase y se repite.
  {
    id: "LEE3-T2-tx1",
    texto:
      "Las abejas viven juntas en una colmena y cada abeja tiene un trabajo. Unas salen a buscar flores y recogen polen. Otras cuidan a las crías y limpian la colmena. También hay abejas que vigilan la entrada para que no pasen extraños. La reina pone los huevos. Gracias a este reparto de tareas, la colmena funciona bien y todas las abejas tienen alimento durante el año.",
    preguntas: [
      trata(1, QUE_TRATA, QUE_TRATA_FACIL, "De cómo trabajan las abejas en la colmena", ["De las flores que crecen en el campo", "De cómo se construye una casa de madera para guardar animales"], PISTA_TRATA, "Casi todas las frases cuentan qué trabajo hace cada abeja en la colmena."),
      titulo(1, MEJOR_TITULO, MEJOR_TITULO_FACIL, "Cada abeja tiene su trabajo", ["Las flores del campo", "Un largo viaje en barco por el río"], PISTA_TITULO, "El texto entero explica los trabajos de las abejas, y eso dice este título."),
    ],
  },
  {
    id: "LEE3-T2-tx2",
    texto:
      "El pozo es el lugar más importante de nuestro pueblo. De él sacamos agua para beber, cocinar y lavar. Cada mañana llegan muchas familias con sus recipientes. Por eso cuidamos mucho el pozo: lo mantenemos tapado, limpiamos alrededor y no dejamos que los animales se acerquen. Si el agua se ensucia, todos podemos enfermar. Un pozo limpio nos ayuda a vivir mejor a todos.",
    preguntas: [
      trata(1, QUE_TRATA, QUE_TRATA_FACIL, "De la importancia de cuidar el pozo del pueblo", ["De los animales", "De los recipientes que usan las familias por la mañana"], PISTA_TRATA, "El texto cuenta para qué sirve el pozo y cómo lo cuida el pueblo."),
      titulo(1, MEJOR_TITULO, MEJOR_TITULO_FACIL, "Cuidamos el pozo del pueblo", ["La mañana de una familia con muchos hijos", "Los animales"], PISTA_TITULO, "Todo el texto habla del pozo y de por qué hay que cuidarlo."),
    ],
  },
  {
    id: "LEE3-T2-tx3",
    texto:
      "La bicicleta es muy útil en mi barrio. Mi hermana va en bicicleta a la escuela y llega en diez minutos. Mi tío lleva en ella cajas con verduras hasta el mercado. La vecina la usa para visitar a su madre, que vive lejos. Además, la bicicleta no hace ruido, no ensucia el aire y solo necesita que alguien pedalee. Por eso tanta gente la usa aquí.",
    preguntas: [
      trata(1, QUE_TRATA, QUE_TRATA_FACIL, "De para qué usa la gente la bicicleta en el barrio", ["De lo que cuestan las verduras en el mercado del barrio", "De la madre de la vecina"], PISTA_TRATA, "Cada frase cuenta un uso de la bicicleta o algo bueno de ella."),
      titulo(1, MEJOR_TITULO, MEJOR_TITULO_FACIL, "La bicicleta, muy útil en el barrio", ["Diez minutos hasta la escuela", "Mi tío vende verduras en el mercado"], PISTA_TITULO, "El texto entero habla de lo útil que es la bicicleta, no solo de una persona."),
    ],
  },
  {
    id: "LEE3-T2-tx4",
    texto:
      "Las plantas necesitan varias cosas para crecer. Primero necesitan agua, que toman de la tierra por las raíces. También necesitan la luz del sol, porque sin ella se ponen débiles y amarillas. Además, les hace falta una tierra buena, con alimento. Si una planta tiene agua, luz y buena tierra, crece fuerte y da hojas verdes, flores y frutos. Por eso hay que cuidarlas cada día.",
    preguntas: [
      trata(1, QUE_TRATA, QUE_TRATA_FACIL, "De lo que necesitan las plantas para crecer", ["De cómo se recogen los frutos maduros de un árbol", "Del color de las hojas"], PISTA_TRATA, "La primera frase lo dice, y las demás explican qué necesitan las plantas."),
      titulo(1, MEJOR_TITULO, MEJOR_TITULO_FACIL, "Lo que una planta necesita", ["Las raíces", "Un paseo por el bosque con mis amigos"], PISTA_TITULO, "El texto repasa todo lo que hace falta para que una planta crezca."),
    ],
  },
  // Dificultad 2: hay detalles que atraen; hay que ver el conjunto.
  {
    id: "LEE3-T2-tx5",
    texto:
      "Cada martes, una maestra llega a la aldea con dos cajas llenas de libros. Las deja bajo el árbol grande de la plaza y los niños se acercan corriendo. Cada uno elige un libro y se lo lleva a casa durante una semana. El martes siguiente lo devuelve y elige otro. Así, aunque en la aldea no hay biblioteca, todos pueden leer cuentos nuevos.",
    preguntas: [
      trata(2, QUE_TRATA, QUE_TRATA_FACIL, "De cómo los niños de una aldea sin biblioteca consiguen libros", ["De un árbol muy grande que hay en la plaza de la aldea", "De una maestra que enseña a sumar", "De los cuentos que más le gustan a una niña"], PISTA_TRATA, "El árbol y las cajas son detalles. Lo importante es que los niños leen aunque no haya biblioteca."),
      titulo(2, MEJOR_TITULO, MEJOR_TITULO_FACIL, "Los libros que llegan cada martes", ["El árbol grande de la plaza", "Una aldea donde nadie quiere leer cuentos", "Dos cajas muy pesadas"], PISTA_TITULO, "Todo el texto cuenta cómo llegan los libros a la aldea cada martes."),
    ],
  },
  {
    id: "LEE3-T2-tx6",
    texto:
      "Al principio parece una simple oruga que solo come hojas. Pasa los días masticando y crece muy rápido. Después se cuelga de una rama y se envuelve en una cubierta dura. Allí dentro no come ni se mueve durante varios días. Cuando por fin sale, tiene alas de colores y ya no camina: vuela de flor en flor. Así es como una oruga se convierte en mariposa.",
    preguntas: [
      trata(2, QUE_TRATA, QUE_TRATA_FACIL, "De cómo una oruga se convierte en mariposa", ["De lo que comen las orugas", "De los colores que tienen las alas de los insectos", "De cómo se cuelgan los animales de las ramas de los árboles"], PISTA_TRATA, "El texto sigue todos los cambios de la oruga hasta que es mariposa. Las hojas y las alas son partes de esa historia."),
      titulo(2, MEJOR_TITULO, MEJOR_TITULO_FACIL, "De oruga a mariposa", ["Las hojas que comen las orugas", "Una rama fuerte", "Las flores más bonitas del jardín de mi casa"], PISTA_TITULO, "El título debe recoger el cambio completo, desde el principio hasta el final."),
    ],
  },
  {
    id: "LEE3-T2-tx7",
    texto:
      "Mi abuela mira el cielo antes de salir al campo. Si las nubes son blancas y pequeñas, deja la ropa tendida y sale tranquila. Si son grises y bajas, recoge la ropa y guarda las herramientas, porque pronto lloverá. También se fija en el viento y en el vuelo de los pájaros. Nunca estudió esto en la escuela, pero lleva muchos años observando y casi siempre acierta.",
    preguntas: [
      trata(2, QUE_TRATA, QUE_TRATA_FACIL, "De cómo una abuela sabe si va a llover", ["De cómo se tiende la ropa para que se seque antes", "De los pájaros que vuelan por el campo", "De las herramientas que guarda la abuela"], PISTA_TRATA, "La ropa, los pájaros y las herramientas son detalles. Todos sirven para contar cómo adivina la abuela el tiempo."),
      titulo(2, MEJOR_TITULO, MEJOR_TITULO_FACIL, "La abuela que sabe leer el cielo", ["La ropa tendida", "Lo que aprendió mi abuela en la escuela cuando era niña", "Las herramientas del campo"], PISTA_TITULO, "Busca el título que resume lo que la abuela hace en todo el texto."),
    ],
  },
  {
    id: "LEE3-T2-tx8",
    texto:
      "La plaza del barrio estaba llena de basura y nadie quería jugar allí. Un sábado, los vecinos se reunieron con escobas y bolsas. Unos barrieron el suelo, otros recogieron botellas y los más jóvenes pintaron los bancos. Al mediodía, la plaza estaba limpia. Esa misma tarde, los niños volvieron a jugar a la pelota, y los abuelos volvieron a sentarse a conversar bajo los árboles.",
    preguntas: [
      trata(2, QUE_TRATA, QUE_TRATA_FACIL, "De cómo los vecinos limpiaron juntos su plaza", ["De unos niños que juegan a la pelota por la tarde", "De cómo se pintan los bancos de un parque", "De lo que conversan los abuelos bajo los árboles"], PISTA_TRATA, "El texto cuenta que la plaza estaba sucia y que los vecinos la dejaron limpia entre todos."),
      titulo(2, MEJOR_TITULO, MEJOR_TITULO_FACIL, "Una plaza limpia entre todos", ["Los bancos pintados", "Un partido de pelota muy importante en el barrio", "Las escobas nuevas"], PISTA_TITULO, "Piensa qué pasa de principio a fin, no solo al final."),
    ],
  },
  // Dificultad 3: el tema no se nombra; hay que deducirlo de todo el texto.
  {
    id: "LEE3-T2-tx9",
    texto:
      "{M1} quería hacer una cometa, pero solo tenía papel. {F1} tenía hilo, aunque no sabía cómo armarla. {M2} encontró dos cañas largas junto al río, pero no tenía pegamento. Al final, {F2} trajo un poco de pegamento de su casa. Se sentaron los cuatro bajo un árbol y cada uno puso lo suyo. Por la tarde, la cometa subía muy alto y todos sujetaban el hilo por turnos.",
    preguntas: [
      trata(3, QUE_TRATA, QUE_TRATA_FACIL, "De unos amigos que juntan lo que tiene cada uno para lograr algo", ["De cómo encontrar cañas largas junto a un río", "De una niña que guarda pegamento en su casa", "De una competición para ver qué cometa vuela más alto"], "Pregúntate: ¿podría uno de ellos hacer la cometa sin los demás?", "Ninguno podía hacer la cometa solo. La hicieron porque cada uno puso lo que tenía."),
      titulo(3, MEJOR_TITULO, MEJOR_TITULO_FACIL, "Una cometa entre todos", ["Las cañas del río", "El pegamento de {F2}", "La cometa que se perdió"], "Pregúntate qué hace posible que la cometa vuele.", "Cada personaje aporta una cosa y la cometa solo existe gracias a todos."),
    ],
  },
  {
    id: "LEE3-T2-tx10",
    texto:
      "El primer día, {F1} no consiguió sacar ni una nota limpia de la flauta. El segundo día le salieron dos, y su hermano se tapó los oídos. Cada tarde, después de ayudar en casa, se sentaba en el patio a soplar. Algunas veces se enfadaba y dejaba la flauta, pero siempre volvía a tomarla. Tres meses después tocó una canción entera delante de su clase, y nadie se tapó los oídos.",
    preguntas: [
      trata(3, QUE_TRATA, QUE_TRATA_FACIL, "De una niña que no se rinde y aprende a tocar", ["De un hermano al que le molesta la música", "De una clase que prepara una canción entre todos", "De cómo se fabrica una flauta"], "Compara cómo empieza y cómo termina {F1}.", "Al principio {F1} no sabía tocar. Practicó muchos días, aunque se enfadaba, y al final lo consiguió."),
      titulo(3, MEJOR_TITULO, MEJOR_TITULO_FACIL, "Nota a nota, sin rendirse", ["Los oídos de su hermano", "La flauta rota", "Un patio muy grande"], "Compara el primer día con el último.", "El texto cuenta cómo {F1} mejora poco a poco porque sigue practicando."),
    ],
  },
  {
    id: "LEE3-T2-tx11",
    texto:
      "Nace en la arena de una playa, junto a muchos hermanos. En cuanto rompe el huevo, corre hacia el mar sin que nadie la guíe. Pasa años nadando por aguas lejanas y comiendo algas. Lleva siempre encima un caparazón duro como una piedra. Cuando es adulta, nada cientos de kilómetros y regresa a la misma playa donde nació. Allí, por la noche, entierra sus propios huevos.",
    preguntas: [
      trata(3, QUE_TRATA, QUE_TRATA_FACIL, "De la vida de un animal, desde que nace hasta que vuelve a su playa", ["De lo que comen los animales que viven en el mar", "De los huevos que hay en la arena", "De cómo se forma una playa"], "Sigue al animal desde la primera frase hasta la última.", "El texto sigue la vida de un animal: nace en una playa, viaja por el mar y vuelve a esa playa."),
      titulo(3, MEJOR_TITULO, MEJOR_TITULO_FACIL, "El largo viaje de vuelta a la playa", ["Las algas del mar", "Una noche en la arena", "Un caparazón duro como una piedra"], "Busca el título que une el principio y el final del texto.", "El animal sale de una playa y, después de muchos años, nada de vuelta hasta ella."),
    ],
  },
  {
    id: "LEE3-T2-tx12",
    texto:
      "Antes, para llegar a la ciudad, la gente del valle caminaba todo un día. Las medicinas tardaban una semana en llegar. Los niños mayores dejaban de estudiar, porque la escuela quedaba muy lejos. Hoy pasa un autobús dos veces al día. El viaje dura una hora, las medicinas llegan pronto y los jóvenes van y vuelven de la escuela cada día. Nadie quiere ya recordar aquellos caminos.",
    preguntas: [
      trata(3, QUE_TRATA, QUE_TRATA_FACIL, "De cómo cambió la vida del valle con el autobús", ["De lo que tarda un autobús en llegar a la ciudad", "De cómo se preparan las medicinas en la ciudad", "De lo cansado que es caminar por un valle todo un día"], "Compara lo que pasaba antes con lo que pasa hoy.", "El texto compara antes y hoy, y lo que cambia todo es que ahora pasa un autobús."),
      titulo(3, MEJOR_TITULO, MEJOR_TITULO_FACIL, "El autobús que cambió el valle", ["Una hora de viaje", "Las medicinas de la ciudad", "Una escuela muy lejana"], "Busca el título que sirve para el antes y para el hoy.", "Las medicinas, la escuela y el viaje mejoraron por la misma razón: el autobús."),
    ],
  },
];
