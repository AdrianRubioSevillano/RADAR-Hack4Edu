// LEE 4.º, temas 1 (idea principal y secundarias) y 2 (inferencias).
// Los textos del tema 1 no llevan título: daría pistas sobre la idea principal.
import type { TextoEscrito } from "../../plantillas.ts";
import { preguntasDe } from "./comun.ts";

const idea = preguntasDe("LEE4-T1-a");
const detalle = preguntasDe("LEE4-T1-b");
const causa = preguntasDe("LEE4-T2-a");
const predice = preguntasDe("LEE4-T2-b");

const IDEA = "¿Cuál es la idea principal del texto?";
const IDEA_FACIL = "La idea principal es lo más importante. Sirve para todo el texto. ¿Cuál es?";
const PISTA_IDEA = "Pregúntate qué idea explican todas las demás frases.";

export const TEXTOS_4_T1: readonly TextoEscrito[] = [
  // Dificultad 1: la idea principal está en la primera frase.
  {
    id: "LEE4-T1-tx1",
    texto:
      "Los árboles hacen que la vida en la ciudad sea mucho mejor. En los días de calor, su sombra refresca las calles y las plazas. Sus hojas ayudan a limpiar el aire que respiramos. Además, sus raíces sujetan la tierra y absorben el agua cuando llueve mucho, así que las calles se inundan menos. Muchos pájaros e insectos encuentran en sus ramas un lugar para vivir. Por todo esto, varios barrios han empezado a plantar árboles y a cuidarlos entre todos los vecinos.",
    preguntas: [
      idea(1, IDEA, IDEA_FACIL, "Los árboles mejoran la vida en la ciudad", ["Muchos pájaros e insectos viven en las ramas de los árboles", "Las calles de la ciudad se inundan cuando llueve mucho"], PISTA_IDEA, "La primera frase lo dice, y las demás dan ejemplos de cómo los árboles mejoran la ciudad."),
      detalle(1, "¿Qué detalle del texto muestra que los árboles ayudan en los días de calor?", "Hace calor. ¿Qué detalle dice cómo ayudan los árboles?", "Su sombra refresca las calles", ["Sus raíces sujetan la tierra", "Los pájaros viven en sus ramas"], "Busca en el texto la palabra «calor».", "El texto dice que en los días de calor su sombra refresca las calles y las plazas."),
    ],
  },
  {
    id: "LEE4-T1-tx2",
    texto:
      "Aunque a mucha gente le dan miedo, los murciélagos son muy útiles para las personas. En una sola noche, un murciélago puede comer cientos de mosquitos y de otros insectos que dañan los cultivos. Otros murciélagos se alimentan de fruta y, al volar, dejan caer semillas lejos del árbol; así nacen árboles nuevos. También hay murciélagos que llevan el polen de una flor a otra, igual que las abejas. De día duermen colgados boca abajo y casi nunca molestan a nadie.",
    preguntas: [
      idea(1, IDEA, IDEA_FACIL, "Los murciélagos son muy útiles", ["A mucha gente le dan miedo los murciélagos", "Los murciélagos duermen de día colgados boca abajo"], PISTA_IDEA, "Casi todo el texto da ejemplos de para qué sirven los murciélagos. El miedo y el sueño son detalles."),
      detalle(1, "¿Qué detalle apoya que los murciélagos ayudan a que nazcan árboles?", "Los murciélagos ayudan a que nazcan árboles. ¿Qué detalle lo muestra?", "Dejan caer semillas lejos del árbol", ["Comen cientos de mosquitos en una noche", "Duermen colgados boca abajo"], "Busca dónde dice «árboles nuevos».", "Al volar dejan caer semillas, y de esas semillas nacen árboles nuevos."),
    ],
  },
  {
    id: "LEE4-T1-tx3",
    texto:
      "Dormir bien es tan importante como comer bien. Mientras dormimos, el cuerpo descansa y repara lo que se ha gastado durante el día. El cerebro también trabaja: ordena lo que hemos aprendido, y por eso al día siguiente recordamos mejor las lecciones. Quien duerme poco se enfada con más facilidad y le cuesta prestar atención en clase. Los niños de tu edad necesitan unas diez horas de sueño cada noche. Por eso conviene acostarse siempre a la misma hora y no dejarlo para más tarde.",
    preguntas: [
      idea(1, IDEA, IDEA_FACIL, "Dormir bien es muy importante", ["El cuerpo gasta cosas durante el día", "Conviene comer siempre a la misma hora de la noche"], PISTA_IDEA, "La primera frase da la idea y las demás explican por qué dormir bien es tan importante."),
      detalle(1, "¿Qué detalle apoya que dormir ayuda a aprender?", "Dormir ayuda a aprender. ¿Qué detalle lo muestra?", "El cerebro ordena lo aprendido mientras dormimos", ["Los niños necesitan unas diez horas de sueño", "Quien duerme poco se enfada más"], "Busca la frase que habla de las lecciones.", "El texto dice que el cerebro ordena lo aprendido y por eso recordamos mejor las lecciones."),
    ],
  },
  {
    id: "LEE4-T1-tx4",
    texto:
      "Lavarse las manos con jabón es una de las formas más sencillas de cuidar la salud. En las manos hay gérmenes tan pequeños que no se ven, y muchos llegan a la boca cuando comemos o nos tocamos la cara. El agua sola se lleva poca suciedad, pero el jabón despega los gérmenes de la piel y el agua los arrastra. Si todas las personas de una familia se lavan las manos antes de comer, enferman menos. Además, una pastilla de jabón dura muchos días.",
    preguntas: [
      idea(1, IDEA, IDEA_FACIL, "Lavarse las manos con jabón cuida la salud", ["Los gérmenes son tan pequeños que no se ven", "Una pastilla de jabón dura muchos días en cada casa"], PISTA_IDEA, "La primera frase lo dice y las demás explican por qué el jabón protege la salud."),
      detalle(1, "¿Qué detalle explica por qué el jabón limpia mejor que el agua sola?", "El jabón limpia mejor que el agua sola. ¿Qué detalle explica por qué?", "Despega los gérmenes de la piel", ["Dura muchos días", "Se usa antes de comer"], "Busca la frase donde aparecen juntos el agua y el jabón.", "El jabón despega los gérmenes de la piel y después el agua se los lleva."),
    ],
  },
  // Dificultad 2: la idea principal llega al final y los ejemplos atraen.
  {
    id: "LEE4-T1-tx5",
    texto:
      "Una hormiga encuentra una miga grande y no puede moverla. Vuelve al hormiguero dejando un rastro de olor en el suelo. Otras hormigas siguen ese rastro y llegan hasta la miga. Entre muchas la levantan y la llevan a casa. Cuando encuentran un hueco en el camino, algunas se agarran unas a otras y forman un puente para que pasen las demás. Dentro del hormiguero, unas cuidan los huevos y otras guardan la comida. Ninguna podría hacer todo esto sola: su fuerza está en trabajar juntas.",
    preguntas: [
      idea(2, IDEA, IDEA_FACIL, "Las hormigas logran mucho porque trabajan juntas", ["Las hormigas dejan un rastro de olor en el suelo", "Las hormigas forman puentes para cruzar los huecos del camino", "Las migas grandes son muy difíciles de mover"], PISTA_IDEA, "El rastro y el puente son ejemplos. La última frase dice lo que todos demuestran: trabajan juntas."),
      detalle(2, "¿Qué detalle muestra que unas hormigas ayudan a otras a cruzar el camino?", "Unas hormigas ayudan a otras a cruzar. ¿Qué detalle lo muestra?", "Se agarran y forman un puente", ["Cuidan los huevos en el hormiguero", "Guardan la comida en el hormiguero", "Dejan un rastro de olor al volver"], "Piensa en qué pasa cuando aparece un hueco.", "Ante un hueco, algunas forman un puente con su cuerpo para que pasen las demás."),
    ],
  },
  {
    id: "LEE4-T1-tx6",
    texto:
      "El camello puede pasar muchos días sin beber. Cuando encuentra agua, bebe más de cien litros en pocos minutos. En su joroba guarda grasa, que le da energía cuando no hay comida. Sus patas anchas no se hunden en la arena, y sus largas pestañas protegen sus ojos del viento. Incluso puede cerrar los agujeros de la nariz para que no entre arena. Por eso, donde otros animales no sobrevivirían, el camello sigue caminando: su cuerpo está preparado para vivir en el desierto.",
    preguntas: [
      idea(2, IDEA, IDEA_FACIL, "El cuerpo del camello está preparado para el desierto", ["El camello bebe más de cien litros de agua en pocos minutos", "El camello guarda grasa en la joroba", "Los animales del desierto casi nunca encuentran comida ni agua"], PISTA_IDEA, "Las patas, las pestañas y la joroba son ejemplos. Todos muestran que su cuerpo sirve para el desierto."),
      detalle(2, "¿Qué detalle muestra que el camello está preparado para caminar por la arena?", "El camello camina bien por la arena. ¿Qué detalle lo muestra?", "Sus patas anchas no se hunden", ["Sus pestañas son largas", "Su joroba guarda grasa", "Bebe mucha agua de una vez"], "Piensa qué parte del cuerpo toca la arena al caminar.", "Para caminar por la arena importan las patas, y las suyas son anchas y no se hunden."),
    ],
  },
  {
    id: "LEE4-T1-tx7",
    texto:
      "Mi tío tiene un pequeño taller junto al mercado. Allí llegan radios que no suenan, sillas cojas y ollas con el asa rota. Él las mira con calma, busca la pieza que falla y casi siempre las deja como nuevas. Una silla arreglada cuesta mucho menos que una nueva, así que las familias ahorran dinero. Además, lo que se repara no termina en la basura, y el barrio está más limpio. Arreglar en lugar de tirar es bueno para el bolsillo y para el lugar donde vivimos.",
    preguntas: [
      idea(2, IDEA, IDEA_FACIL, "Arreglar las cosas ahorra dinero y cuida el barrio", ["Mi tío tiene un pequeño taller junto al mercado de su barrio", "Las ollas con el asa rota son difíciles de arreglar", "Las sillas nuevas cuestan mucho dinero"], PISTA_IDEA, "El taller es el ejemplo. La última frase dice lo importante: arreglar es mejor que tirar."),
      detalle(2, "¿Qué detalle apoya que reparar las cosas ayuda a ahorrar?", "Reparar ayuda a ahorrar. ¿Qué detalle lo muestra?", "Una silla arreglada cuesta menos que una nueva", ["El tío mira las cosas con calma", "El taller está junto al mercado", "Lo que se repara no termina en la basura"], "Busca una frase que compare dos precios.", "El texto compara el precio de una silla arreglada con el de una nueva. Por eso las familias ahorran."),
    ],
  },
  {
    id: "LEE4-T1-tx8",
    texto:
      "Los jueves, mucha gente baja de las aldeas al mercado. Van a comprar y a vender, claro: huevos, telas, herramientas. Pero ese no es el único motivo. En el mercado, los vecinos se cuentan las noticias de la semana. Los agricultores comparan sus cosechas y se dan consejos. Los jóvenes se enteran de quién busca trabajadores. Incluso hay quien va sin nada que vender, solo para encontrarse con sus amigos. Por eso, el mercado es mucho más que un lugar de compras: allí se reúne la gente.",
    preguntas: [
      idea(2, IDEA, IDEA_FACIL, "El mercado es también un lugar de encuentro", ["En el mercado se venden huevos, telas y herramientas", "Los agricultores se dan consejos sobre sus cosechas", "Los jóvenes van a buscar trabajo todos los jueves"], PISTA_IDEA, "Las noticias, los consejos y los amigos son ejemplos de lo mismo: la gente se reúne allí."),
      detalle(2, "¿Qué detalle dice claramente que hay personas que no van al mercado a vender?", "Algunas personas no van a vender. ¿Qué detalle lo dice?", "Hay quien va solo para encontrarse con sus amigos", ["Mucha gente baja de las aldeas", "Se venden huevos, telas y herramientas", "El mercado es los jueves"], "Busca la frase que empieza con «Incluso».", "El texto dice que hay quien va sin nada que vender, solo para ver a sus amigos."),
    ],
  },
  // Dificultad 3: la idea principal no está escrita; hay que construirla.
  {
    id: "LEE4-T1-tx9",
    texto:
      "El diente de león suelta semillas con pelitos que flotan en el aire durante kilómetros. El coco cae al mar y navega semanas hasta otra playa. Algunas semillas tienen ganchos que se enganchan en el pelo de los animales y se sueltan mucho más lejos. Otras van dentro de frutos dulces: un pájaro se come el fruto y deja caer la semilla en otro lugar. Y hay plantas con frutos secos que estallan y lanzan sus semillas como pequeñas pelotas.",
    preguntas: [
      idea(3, IDEA, IDEA_FACIL, "Las semillas tienen muchas formas de viajar", ["Los pájaros se comen los frutos dulces de las plantas", "El coco es la semilla que más lejos viaja por el mar", "Las semillas necesitan mucha agua para crecer"], "El texto no la escribe. Piensa qué tienen en común todos los ejemplos.", "Cada frase cuenta una manera de viajar: por el aire, por el mar, con animales o saltando."),
      detalle(3, "¿Cuál de estos detalles NO sirve para mostrar que hay semillas que viajan con ayuda de animales?", "Hay semillas que viajan con animales. ¿Qué detalle NO sirve para mostrarlo?", "El coco navega semanas por el mar", ["Los ganchos se enganchan en el pelo", "Un pájaro deja caer la semilla en otro lugar", "Un pájaro se come el fruto dulce"], "Mira en cada detalle si aparece un animal.", "El coco viaja por el mar, sin ningún animal. Los otros detalles hablan de animales."),
    ],
  },
  {
    id: "LEE4-T1-tx10",
    texto:
      "El insecto palo es tan delgado y marrón que parece una ramita. Una mariposa de la selva, con las alas cerradas, es igual que una hoja seca. El pulpo cambia de color en segundos y se confunde con las rocas del fondo. La liebre de las montañas frías tiene el pelo blanco en invierno, cuando todo está nevado, y marrón en verano. Un enemigo puede pasar muy cerca de cualquiera de ellos sin descubrirlos, y eso les salva la vida muchas veces.",
    preguntas: [
      idea(3, IDEA, IDEA_FACIL, "Muchos animales se protegen pareciéndose a lo que los rodea", ["El pulpo es el animal que cambia de color más rápido", "Las mariposas de la selva cierran las alas para dormir", "En las montañas frías, el pelo de la liebre es blanco"], "El texto no la escribe. ¿Qué hacen todos estos animales y para qué?", "Todos se confunden con lo que tienen alrededor, y así sus enemigos no los ven."),
      detalle(3, "¿Qué frase del texto explica para qué les sirve a estos animales parecerse a lo que los rodea?", "Estos animales se parecen a lo que los rodea. ¿Qué frase dice para qué les sirve?", "Un enemigo puede pasar cerca sin descubrirlos", ["El pulpo cambia de color en segundos", "Tiene el pelo blanco en invierno", "Con las alas cerradas es igual que una hoja seca"], "Tres opciones cuentan cómo son los animales. Busca la que dice para qué.", "Las otras frases describen a un animal. Solo esta dice el motivo: el enemigo no los descubre."),
    ],
  },
  {
    id: "LEE4-T1-tx11",
    texto:
      "{F1} habla una lengua con su abuela y otra en la escuela. En el mercado escucha una tercera, la de los comerciantes del norte, y ya sabe saludar y contar en ella. Una vez, una señora de lejos no entendía a un vendedor, y {F1} la ayudó a comprar. Su abuela le cuenta historias que no están en los libros de la escuela, y ella las escribe para sus compañeros. {F1} tiene once años y va a la escuela a pie.",
    preguntas: [
      idea(3, IDEA, IDEA_FACIL, "Saber varias lenguas le sirve mucho a {F1}", ["{F1} va a la escuela a pie todos los días", "Los comerciantes del norte hablan una lengua difícil", "Las historias de la abuela no están en los libros de la escuela"], "El texto no la escribe. ¿Qué tienen en común casi todas las frases?", "Casi todas las frases cuentan algo que {F1} puede hacer gracias a las lenguas que sabe."),
      detalle(3, "¿Cuál de estos detalles NO apoya la idea de que saber varias lenguas le es útil a {F1}?", "Saber lenguas le sirve a {F1}. ¿Qué detalle NO tiene que ver con eso?", "Va a la escuela a pie", ["Ayudó a una señora a comprar", "Escribe las historias de su abuela para sus compañeros", "Sabe saludar a los comerciantes del norte"], "Pregúntate en cada detalle: ¿aquí importan las lenguas?", "Ir a pie no tiene que ver con las lenguas. Los otros detalles sí."),
    ],
  },
  {
    id: "LEE4-T1-tx12",
    texto:
      "{M1} ya no tira las cáscaras de fruta. Las echa en un rincón del huerto, junto con hojas secas y restos de verdura. Cada semana las remueve con un palo y les pone un poco de agua. Unos meses después, aquel montón se ha vuelto una tierra oscura que huele a bosque. {M1} la reparte entre sus plantas, que crecen más fuertes, y ya no necesita comprar abono. Además, su familia saca la mitad de basura que antes. Ahora sus vecinos quieren probarlo también.",
    preguntas: [
      idea(3, IDEA, IDEA_FACIL, "Los restos que antes eran basura pueden alimentar el huerto", ["{M1} remueve el montón con un palo cada semana", "El abono que se compra en las tiendas es demasiado caro", "Las cáscaras de fruta huelen muy mal en la basura"], "El texto no la escribe. Compara cómo empiezan las cáscaras y cómo terminan.", "Las cáscaras y las hojas se vuelven tierra buena para las plantas. Lo que era basura ahora sirve."),
      detalle(3, "¿Qué detalle apoya la idea de que el montón acaba siendo algo útil?", "El montón acaba siendo útil. ¿Qué detalle lo muestra?", "Las plantas crecen más fuertes con esa tierra", ["{M1} lo remueve con un palo", "Está en un rincón del huerto", "Lleva hojas secas y restos de verdura"], "Busca lo que pasa al final, cuando el montón ya está listo.", "Remover, el rincón y las hojas cuentan cómo se hace. La utilidad se ve en que las plantas crecen más fuertes."),
    ],
  },
];

export const TEXTOS_4_T2: readonly TextoEscrito[] = [
  {
    id: "LEE4-T2-tx1",
    titulo: "El río crecido",
    texto:
      "Llevaba tres días lloviendo en las montañas y el río bajaba marrón y muy crecido. El agua ya había cubierto el camino de piedras que usan los niños para ir a la escuela. Por eso, la maestra avisó de que ese día no habría clase. Los vecinos de la parte baja subieron sus animales a la colina y pusieron sacos de tierra delante de las puertas. {M1} ayudó a su padre a llevar las gallinas. Por la tarde, las nubes seguían negras y el agua no dejaba de subir.",
    preguntas: [
      causa(1, "¿Por qué no hubo clase ese día?", "Ese día no hubo clase. ¿Por qué?", "Porque el agua cubrió el camino a la escuela", ["Porque la maestra estaba enferma", "Porque los niños llevaban gallinas a la colina"], "Busca la frase que empieza por «Por eso» y lee la anterior.", "El agua cubrió el camino de piedras. Por eso la maestra avisó de que no habría clase."),
      causa(2, "¿Qué causó que el río bajara tan crecido?", "El río bajaba muy crecido. ¿Qué lo causó?", "La lluvia de tres días en las montañas", ["Los sacos de tierra de los vecinos", "Las piedras del camino de la escuela", "Las nubes negras de esa tarde"], "Lee la primera frase.", "Llovió tres días en las montañas, y esa agua llegó al río."),
      causa(3, "¿Cuál es el orden correcto de las causas y los efectos?", "Lee estas cadenas. ¿Cuál va en el orden correcto?", "Lluvia → río crecido → camino cubierto → sin clase", ["Río crecido → sin clase → lluvia → camino cubierto", "Camino cubierto → lluvia → sin clase → río crecido", "Sin clase → camino cubierto → río crecido → lluvia"], "Empieza por lo que pasó primero: ¿qué hizo que pasara todo lo demás?", "La lluvia hizo crecer el río, el río cubrió el camino y, sin camino, no hubo clase."),
      predice(1, "Si sigue lloviendo y el agua no deja de subir, ¿qué es lo más probable?", "Sigue lloviendo. El agua sigue subiendo. ¿Qué pasará?", "El agua llegará a las casas de la parte baja", ["El río se secará esa misma tarde", "Los niños cruzarán el camino sin mojarse"], "Piensa por qué los vecinos pusieron sacos de tierra.", "Si el agua sigue subiendo, llegará a las casas más bajas. Por eso pusieron sacos en las puertas."),
      predice(2, "Si al día siguiente el camino sigue cubierto de agua, ¿qué es lo más probable?", "Al día siguiente el camino sigue cubierto. ¿Qué pasará?", "Tampoco habrá clase", ["Los niños llegarán antes a la escuela", "Los vecinos quitarán los sacos de tierra", "El camino quedará seco por la tarde"], "Recuerda por qué no hubo clase hoy.", "Hoy no hubo clase porque el camino estaba cubierto. Si sigue igual, pasará lo mismo."),
      predice(3, "Cuando el agua baje, ¿qué harán seguramente los vecinos de la parte baja?", "El agua baja. ¿Qué harán los vecinos de la parte baja?", "Bajar sus animales de la colina", ["Subir más sacos de tierra a la colina", "Marcharse a vivir a las montañas", "Pedir que llueva tres días más"], "Piensa qué cosas hicieron por el peligro y ya no harán falta.", "Subieron los animales para protegerlos del agua. Sin peligro, los llevarán de vuelta."),
    ],
  },
  {
    id: "LEE4-T2-tx2",
    titulo: "Las latas del maizal",
    texto:
      "{F1} y su padre sembraron maíz junto al camino. Cuando las plantas dieron mazorcas, llegaron los pájaros y picotearon muchas. Como el padre no podía vigilar todo el día, {F1} tuvo una idea: colgó latas viejas de unas cuerdas, entre las plantas. Con el viento, las latas chocaban y hacían ruido, y los pájaros se asustaban y se marchaban. Durante dos semanas funcionó muy bien. Pero esta mañana no sopla nada de viento, las latas cuelgan quietas y unos pájaros ya se acercan despacio desde el árbol.",
    preguntas: [
      causa(1, "¿Por qué se marchaban los pájaros?", "Los pájaros se marchaban. ¿Por qué?", "Porque el ruido de las latas los asustaba", ["Porque ya no quedaban mazorcas", "Porque el padre los vigilaba"], "Busca la frase de las latas.", "Las latas chocaban y hacían ruido, y ese ruido asustaba a los pájaros."),
      causa(2, "¿Qué hacía que las latas sonaran?", "Las latas sonaban. ¿Qué las movía?", "El viento", ["Los pájaros", "El padre de {F1}", "Las mazorcas"], "Busca qué pasaba justo antes de que las latas chocaran.", "El texto dice que las latas chocaban con el viento. Por eso hoy, sin viento, cuelgan quietas."),
      causa(3, "¿Por qué {F1} tuvo que inventar algo para proteger el maíz?", "{F1} inventó algo para proteger el maíz. ¿Por qué?", "Porque los pájaros dañaban las mazorcas y su padre no podía vigilar todo el día", ["Porque quería aprovechar unas latas viejas que le sobraban", "Porque el viento rompía las plantas de maíz", "Porque sembraron demasiado cerca del camino"], "Hacen falta dos razones. Busca el problema y por qué el padre no lo resolvía.", "Los pájaros picoteaban las mazorcas y el padre no podía vigilar siempre. Hacía falta otra solución."),
      predice(1, "Si hoy sigue sin haber viento, ¿qué es lo más probable?", "Hoy no hay viento. ¿Qué pasará?", "Los pájaros picotearán las mazorcas", ["Las latas sonarán más fuerte que nunca", "Los pájaros se asustarán y se irán"], "Sin viento, ¿hay ruido?", "Sin viento las latas no suenan, los pájaros no se asustan y pueden comer."),
      predice(2, "Si mañana vuelve a soplar el viento, ¿qué es lo más probable?", "Mañana hay viento. ¿Qué pasará?", "Las latas sonarán y los pájaros se irán", ["Las latas se quedarán quietas todo el día", "Los pájaros harán sus nidos entre las latas", "El padre tendrá que vigilar todo el día"], "Recuerda lo que pasó durante dos semanas.", "Con viento, las latas vuelven a hacer ruido, y eso asusta a los pájaros, como antes."),
      predice(3, "Si los pájaros se acostumbran al ruido y pierden el miedo, ¿qué pasará?", "Los pájaros ya no tienen miedo del ruido. ¿Qué pasará?", "Las latas dejarán de proteger el maíz", ["Las latas dejarán de hacer ruido", "Dejará de soplar el viento en el campo", "El maíz dará más mazorcas que nunca"], "Las latas funcionaban por una sola razón. ¿Cuál era?", "Las latas solo funcionaban porque el ruido daba miedo. Sin miedo, los pájaros volverán a comer."),
    ],
  },
  {
    id: "LEE4-T2-tx3",
    titulo: "El carrito de {M1}",
    texto:
      "Cada tarde, {M1} vende jugo de naranja en la parada del autobús. El mes pasado, la escuela cambió su horario y los alumnos empezaron a salir una hora antes. Como {M1} llegaba a la hora de siempre, ya no encontraba a sus clientes y vendía la mitad. Entonces empezó a llegar una hora antes y volvió a venderlo todo. Ahora ha oído que la semana próxima cerrarán la parada por obras y la pondrán dos calles más abajo, frente a la panadería. {M1} ya está pensando en el camino nuevo.",
    preguntas: [
      causa(1, "¿Por qué {M1} empezó a vender la mitad?", "{M1} vendía la mitad. ¿Por qué?", "Porque ya no encontraba a sus clientes", ["Porque subió el precio del jugo", "Porque se le acabaron las naranjas"], "Busca la frase donde aparece «la mitad».", "Llegaba a la hora de siempre, pero sus clientes ya se habían ido."),
      causa(2, "¿Por qué {M1} volvió a venderlo todo?", "{M1} volvió a venderlo todo. ¿Por qué?", "Porque empezó a llegar una hora antes", ["Porque movió el carrito frente a la panadería", "Porque la escuela volvió al horario antiguo", "Porque empezó a vender también agua"], "Busca qué cambió {M1}.", "Al llegar una hora antes, volvió a coincidir con los alumnos que salían de la escuela."),
      causa(3, "¿Qué hecho fue el primero que hizo bajar las ventas de {M1}?", "Las ventas bajaron. ¿Qué pasó primero de todo?", "La escuela cambió su horario", ["La parada se cerró por obras", "{M1} llegó una hora antes", "Abrieron una panadería nueva"], "Busca el primer cambio del texto, antes de que {M1} vendiera menos.", "La escuela cambió el horario, los alumnos salieron antes y {M1} dejó de encontrarlos."),
      predice(1, "¿A dónde llevará {M1} su carrito la semana próxima?", "La parada se mueve. ¿A dónde irá {M1} con su carrito?", "Frente a la panadería", ["A la puerta de su casa", "Al mismo lugar de siempre"], "{M1} vende donde están sus clientes. Mira dónde estará la parada.", "La parada se pondrá frente a la panadería y sus clientes irán allí."),
      predice(2, "Si {M1} se quedara en la parada cerrada durante las obras, ¿qué pasaría?", "La parada está cerrada. {M1} se queda allí. ¿Qué pasará?", "Vendería muy poco", ["Vendería más que nunca", "Los alumnos saldrían antes de la escuela", "Las obras terminarían antes"], "Recuerda qué pasó cuando dejó de encontrar a sus clientes.", "Ya vendió menos cuando no coincidía con sus clientes. Si no hay parada, tampoco habrá gente."),
      predice(3, "Si la escuela volviera a su horario antiguo, ¿qué haría {M1} seguramente?", "La escuela vuelve al horario de antes. ¿Qué hará {M1}?", "Llegar una hora más tarde que ahora", ["Llegar dos horas antes que ahora", "Dejar de vender jugo para siempre", "Cerrar la parada del autobús"], "Fíjate en lo que hizo {M1} la otra vez que cambió el horario.", "{M1} adapta su hora a la salida de los alumnos. Si salen una hora más tarde, llegará una hora más tarde."),
    ],
  },
  {
    id: "LEE4-T2-tx4",
    titulo: "La gotera",
    texto:
      "Hace un mes se rompió una teja del techo de la escuela. Al principio solo caían unas gotas cuando llovía y nadie le dio importancia. Pero el agua fue mojando la madera y la pared, y apareció una mancha oscura que cada semana era más grande. La humedad estropeó unos libros de la estantería de abajo, así que la maestra cambió los demás de sitio. Ayer, con la tormenta, cayó un trozo del techo. La directora cerró esa aula y llamó a un albañil. Mañana anuncian lluvia.",
    preguntas: [
      causa(1, "¿Qué estropeó los libros?", "Unos libros se estropearon. ¿Qué los estropeó?", "La humedad", ["La tormenta de ayer", "Un trozo del techo"], "Busca la frase de la estantería.", "El texto dice que la humedad estropeó unos libros de la estantería de abajo."),
      causa(2, "¿Por qué la maestra cambió los demás libros de sitio?", "La maestra movió los libros. ¿Por qué?", "Para que la humedad no los estropeara también", ["Porque iban a cerrar el aula ese día", "Porque el albañil se lo pidió", "Para hacer sitio a los libros nuevos"], "Mira lo que acababa de pasar con los libros de abajo.", "La humedad estropeó unos libros, y la maestra movió los otros para protegerlos."),
      causa(3, "¿Cuál fue la primera causa de todos los problemas del aula?", "El aula tuvo muchos problemas. ¿Cuál fue la primera causa?", "Una teja rota", ["La mancha oscura de la pared", "La tormenta de ayer", "Los libros mojados"], "Vuelve al principio y busca qué pasó antes que todo lo demás.", "Por la teja rota entró el agua, y el agua causó la mancha, la humedad y el daño del techo."),
      predice(1, "Si el albañil cambia la teja rota, ¿qué pasará cuando llueva?", "El albañil cambia la teja. Después llueve. ¿Qué pasará?", "No entrará agua por ese lugar", ["Caerá otro trozo del techo", "Saldrá otra mancha en la pared"], "Piensa por dónde entraba el agua.", "El agua entraba por la teja rota. Con una teja buena, ya no entra por ahí."),
      predice(2, "Si mañana llueve y la teja sigue rota, ¿qué es lo más probable?", "Mañana llueve. La teja sigue rota. ¿Qué pasará?", "Entrará agua y la mancha crecerá", ["La mancha desaparecerá sola", "La pared se secará del todo", "Los libros mojados se arreglarán"], "Recuerda lo que pasaba cada vez que llovía.", "Cada vez que llovía entraba agua y la mancha crecía. Si nada cambia, volverá a pasar."),
      predice(3, "Cuando el techo esté arreglado y seco, ¿qué hará seguramente la directora?", "El techo ya está arreglado y seco. ¿Qué hará la directora?", "Abrir otra vez el aula", ["Cerrar el resto de la escuela", "Llamar a otro albañil para romper el techo", "Mover los libros a la estantería mojada"], "Piensa por qué cerró el aula.", "Cerró el aula porque el techo era un peligro. Sin peligro, los alumnos podrán volver."),
    ],
  },
];
