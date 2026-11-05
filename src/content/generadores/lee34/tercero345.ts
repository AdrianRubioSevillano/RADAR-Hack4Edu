// LEE 3.º, temas 3 (datos del texto), 4 (inferencias) y 5 (textos de la vida diaria).
import type { TextoEscrito } from "../../plantillas.ts";
import { dibujo, preguntasDe } from "./comun.ts";

const dato = preguntasDe("LEE3-T3-a");
const porque = preguntasDe("LEE3-T4-a");
const siente = preguntasDe("LEE3-T4-b");
const receta = preguntasDe("LEE3-T5-a");
const nota = preguntasDe("LEE3-T5-b");
const instr = preguntasDe("LEE3-T5-c");

export const TEXTOS_3_T3: readonly TextoEscrito[] = [
  {
    id: "LEE3-T3-tx1",
    titulo: "La feria de semillas",
    imagen: dibujo("flor"),
    texto:
      "El sábado por la mañana hubo una feria de semillas en la plaza de la aldea. {F1} llevó diez bolsitas de maíz y {M1} llevó seis de calabaza. La feria empezó a las nueve y terminó a las doce. Nadie pagó con dinero: cada persona cambiaba sus semillas por otras. {F1} volvió a casa con semillas de tomate, y {M1} consiguió semillas de girasol para el huerto de la escuela.",
    preguntas: [
      dato(1, "¿Dónde fue la feria de semillas?", "¿Dónde fue la feria?", "En la plaza de la aldea", ["En el huerto de la escuela", "En la casa de {F1}"], "Lee la primera frase.", "La primera frase dice que la feria fue en la plaza de la aldea."),
      dato(1, "¿Cuántas bolsitas de maíz llevó {F1}?", "{F1} llevó bolsitas de maíz. ¿Cuántas?", "Diez", ["Seis", "Nueve"], "Busca el nombre de {F1} en el texto.", "El texto dice que {F1} llevó diez bolsitas de maíz. Las seis eran de {M1}."),
      dato(2, "¿A qué hora terminó la feria?", "¿A qué hora acabó la feria?", "A las doce", ["A las nueve", "A las diez", "A las seis"], "Hay dos horas en el texto. Mira cuál es la del final.", "La feria empezó a las nueve y terminó a las doce."),
      dato(2, "¿Cómo conseguía la gente semillas nuevas en la feria?", "En la feria había semillas nuevas. ¿Cómo las conseguía la gente?", "Cambiándolas por otras semillas", ["Pagándolas con dinero", "Sacándolas del huerto de la escuela", "Pidiéndoselas a la maestra"], "Busca la frase que habla del dinero.", "Nadie pagó con dinero: cada persona cambiaba sus semillas por otras."),
      dato(3, "¿De qué eran las semillas que {M1} se llevó de la feria?", "{M1} se fue de la feria con unas semillas. ¿De qué eran?", "De girasol", ["De calabaza", "De tomate", "De maíz"], "Cuidado: una cosa es lo que {M1} llevó y otra lo que consiguió.", "{M1} llevó calabaza, pero la cambió y consiguió semillas de girasol."),
    ],
  },
  {
    id: "LEE3-T3-tx2",
    titulo: "Los elefantes",
    imagen: dibujo("elefante"),
    texto:
      "Los elefantes son los animales terrestres más grandes. Un elefante adulto puede beber más de cien litros de agua en un día. Usa la trompa para respirar, oler, beber y agarrar comida. Las crías pasan casi dos años dentro de su madre y, al nacer, pesan unos cien kilos. Los elefantes viven en grupos. Cada grupo sigue a la hembra de más edad, que recuerda dónde hay agua.",
    preguntas: [
      dato(1, "¿A quién sigue cada grupo de elefantes?", "Los elefantes siguen a uno de ellos. ¿A quién?", "A la hembra de más edad", ["A la cría más pequeña", "Al macho más grande"], "Lee las dos últimas frases.", "El texto dice que cada grupo sigue a la hembra de más edad."),
      dato(1, "¿Cuánta agua puede beber en un día un elefante adulto?", "Un elefante adulto bebe agua. ¿Cuánta puede beber en un día?", "Más de cien litros", ["Dos litros", "Unos diez litros"], "Busca la palabra «beber» en el texto.", "El texto dice que puede beber más de cien litros de agua en un día."),
      dato(2, "¿Cuánto tiempo pasa una cría dentro de su madre?", "La cría está dentro de su madre. ¿Cuánto tiempo?", "Casi dos años", ["Cien días", "Unos dos meses", "Más de diez años"], "Busca la frase que habla de las crías.", "El texto dice que las crías pasan casi dos años dentro de su madre."),
      dato(2, "¿Qué recuerda la elefanta que guía al grupo?", "Una elefanta guía al grupo. ¿Qué recuerda?", "Dónde hay agua", ["Cuántas crías tiene el grupo", "Qué comida le gusta más", "Por dónde llegan los otros grupos"], "Lee la última frase hasta el final.", "La última frase dice que la hembra de más edad recuerda dónde hay agua."),
      dato(3, "¿Cuál de estas cosas NO dice el texto que haga el elefante con la trompa?", "El elefante usa la trompa. ¿Qué cosa NO dice el texto?", "Oír", ["Oler", "Beber", "Respirar"], "Busca la lista de usos y compárala con las opciones.", "El texto nombra respirar, oler, beber y agarrar comida. No dice nada de oír."),
    ],
  },
  {
    id: "LEE3-T3-tx3",
    titulo: "Mi escuela",
    imagen: dibujo("casa"),
    texto:
      "La escuela de {N1} tiene tres aulas y un patio con dos árboles. En la primera aula estudian los más pequeños; en la segunda, los medianos, y en la tercera, los mayores. Las clases empiezan a las ocho y el recreo es a las diez. Los lunes, los mayores riegan el huerto. Los viernes, los pequeños barren el patio. El agua sale de un grifo que hay junto a la puerta.",
    preguntas: [
      dato(1, "¿Cuántas aulas tiene la escuela?", "¿Cuántas aulas hay en la escuela?", "Tres", ["Dos", "Diez"], "Lee la primera frase.", "La primera frase dice que la escuela tiene tres aulas."),
      dato(1, "¿A qué hora empiezan las clases?", "¿Cuándo empiezan las clases?", "A las ocho", ["A las diez", "A las tres"], "Busca la palabra «empiezan».", "El texto dice que las clases empiezan a las ocho. A las diez es el recreo."),
      dato(2, "¿Dónde está el grifo de la escuela?", "La escuela tiene un grifo. ¿Dónde está?", "Junto a la puerta", ["En el patio, entre los árboles", "En la tercera aula", "En medio del huerto"], "Es lo último que dice el texto.", "La última frase dice que el grifo está junto a la puerta."),
      dato(2, "¿Qué hacen los pequeños los viernes?", "Es viernes. ¿Qué hacen los pequeños?", "Barren el patio", ["Riegan el huerto", "Limpian las aulas", "Abren el grifo"], "Hay dos días en el texto. Busca el viernes.", "Los viernes los pequeños barren el patio. Los mayores riegan el huerto los lunes."),
      dato(3, "¿En qué aula estudian los que riegan el huerto?", "Unos alumnos riegan el huerto. ¿En qué aula estudian?", "En la tercera", ["En la primera", "En la segunda", "En el patio"], "Tienes que buscar en dos frases: primero quién riega y luego dónde estudian.", "Los mayores riegan el huerto, y los mayores estudian en la tercera aula."),
    ],
  },
  {
    id: "LEE3-T3-tx4",
    titulo: "Un día en el lago",
    imagen: dibujo("barco"),
    texto:
      "{M1} salió a pescar con su tía antes del amanecer. Llevaban una red, dos remos y una botella de agua. El lago estaba tranquilo. Pescaron hasta que el sol estuvo alto y llenaron media caja de peces. De vuelta, un viento fuerte empujó el barco hacia las rocas, pero la tía remó con fuerza y llegaron bien a la orilla. En el mercado vendieron los peces por doce monedas.",
    preguntas: [
      dato(1, "¿Con quién salió a pescar {M1}?", "{M1} fue a pescar. ¿Con quién fue?", "Con su tía", ["Con su abuelo", "Con su hermana"], "Lee la primera frase.", "La primera frase dice que {M1} salió a pescar con su tía."),
      dato(1, "¿Cuántas monedas ganaron con los peces?", "Vendieron los peces. ¿Cuántas monedas ganaron?", "Doce", ["Dos", "Veinte"], "Lee la última frase.", "La última frase dice que vendieron los peces por doce monedas."),
      dato(2, "¿Qué llevaban en el barco?", "Subieron cosas al barco. ¿Qué llevaban?", "Una red, dos remos y agua", ["Una caja, dos redes y comida", "Dos remos, una cuerda y un gorro", "Una red, un remo y una lámpara"], "Busca la frase de «llevaban». Comprueba todas las cosas de cada opción.", "El texto dice que llevaban una red, dos remos y una botella de agua."),
      dato(2, "¿Hasta cuándo estuvieron pescando?", "Estuvieron pescando un tiempo. ¿Hasta cuándo?", "Hasta que el sol estuvo alto", ["Hasta que llenaron una caja entera", "Hasta el amanecer", "Hasta que empezó el viento"], "Busca la palabra «hasta» en el texto.", "El texto dice que pescaron hasta que el sol estuvo alto. La caja quedó medio llena."),
      dato(3, "¿Qué pasó justo antes de que llegaran a la orilla?", "Llegaron a la orilla. ¿Qué pasó justo antes?", "El viento empujó el barco hacia las rocas", ["Vendieron los peces en el mercado", "Llenaron media caja de peces", "Vieron que el lago estaba tranquilo"], "Busca la frase de la orilla y lee hacia atrás.", "De vuelta, el viento empujó el barco hacia las rocas. La tía remó y entonces llegaron a la orilla."),
    ],
  },
  {
    id: "LEE3-T3-tx5",
    titulo: "La carrera del río",
    imagen: dibujo("zapato"),
    texto:
      "La escuela organizó una carrera por el camino del río. Participaron veinte niñas y niños. {F1} salió muy rápido, pero se cansó a la mitad. {M1} corrió despacio al principio y adelantó a todos en la última curva. Ganó él y {F2} llegó segunda. {F1} terminó quinta. Los tres primeros recibieron un libro de cuentos como premio. Al terminar, todos bebieron agua a la sombra.",
    preguntas: [
      dato(1, "¿Quién ganó la carrera?", "¿Quién ganó?", "{M1}", ["{F1}", "{F2}"], "Busca la palabra «ganó».", "El texto dice que ganó {M1}, justo después de adelantar a todos."),
      dato(1, "¿Por dónde fue la carrera?", "¿Por dónde corrieron?", "Por el camino del río", ["Por el patio de la escuela", "Por la calle del mercado"], "Lee la primera frase.", "La primera frase dice que la carrera fue por el camino del río."),
      dato(2, "¿Qué recibieron los tres primeros?", "Los tres primeros recibieron un premio. ¿Qué premio?", "Un libro de cuentos", ["Una botella de agua", "Un cuaderno de dibujo", "Unas zapatillas nuevas"], "Busca la palabra «premio».", "El texto dice que recibieron un libro de cuentos como premio."),
      dato(2, "¿Cuándo adelantó {M1} a los demás?", "{M1} adelantó a todos. ¿Cuándo?", "En la última curva", ["Al salir", "A la mitad de la carrera", "Después de beber agua"], "Busca el nombre de {M1}.", "{M1} corrió despacio al principio y adelantó a todos en la última curva."),
      dato(3, "¿En qué puesto terminó la niña que salió más rápido?", "Una niña salió muy rápido. ¿En qué puesto terminó?", "En el quinto", ["En el primero", "En el segundo", "En el vigésimo"], "Primero busca quién salió rápido. Después, mira cómo terminó.", "La que salió rápido fue {F1}, y {F1} terminó quinta."),
      dato(3, "¿Cuál de estas cosas NO aparece en el texto?", "¿Qué cosa NO dice el texto?", "La hora a la que empezó la carrera", ["Cuántos participaron en la carrera", "Quién llegó en segundo lugar", "Qué premio dieron"], "Comprueba cada opción en el texto. Una no está.", "El texto dice cuántos corrieron, quién fue segunda y qué premio dieron, pero no da ninguna hora."),
    ],
  },
];

export const TEXTOS_3_T4: readonly TextoEscrito[] = [
  {
    id: "LEE3-T4-tx1",
    titulo: "El cachorro",
    imagen: dibujo("perro"),
    texto:
      "Al volver de la escuela, {F1} encontró un cachorro bajo la lluvia, con una pata herida. Lo envolvió en su chaqueta y lo llevó a casa. Su madre le limpió la herida mientras {F1} le daba agua. Esa noche, el cachorro durmió junto a ella. Por la mañana llegó un vecino que llevaba dos días buscándolo. {F1} se lo entregó con lágrimas en los ojos, pero el vecino le dijo que podría visitarlo siempre.",
    preguntas: [
      porque(1, "¿Por qué {F1} envolvió al cachorro en su chaqueta?", "{F1} envolvió al cachorro en su chaqueta. ¿Por qué?", "Porque estaba bajo la lluvia y quería protegerlo", ["Porque quería esconderlo de su madre", "Porque quería jugar con él"], "Mira dónde estaba el cachorro cuando {F1} lo encontró.", "El cachorro estaba bajo la lluvia y herido. La chaqueta lo protegía mientras iban a casa."),
      porque(2, "¿Por qué fue el vecino a casa de {F1}?", "El vecino llegó por la mañana. ¿Por qué fue?", "Porque estaba buscando a su cachorro", ["Porque quería regalarle un cachorro a {F1}", "Porque quería hablar con la madre sobre la lluvia", "Porque iba a curar la pata del cachorro"], "Busca qué llevaba haciendo el vecino dos días.", "El vecino llevaba dos días buscando al cachorro: el perro era suyo."),
      porque(3, "¿Por qué estaba el cachorro solo en la calle?", "El cachorro estaba solo en la calle. ¿Por qué?", "Porque se había perdido", ["Porque {F1} lo había dejado allí", "Porque el vecino ya no lo quería", "Porque había salido a buscar agua"], "Si alguien lo buscaba desde hacía dos días, ¿qué le había pasado?", "El vecino lo buscó durante dos días, así que el cachorro se había perdido."),
      siente(1, "¿Cómo se sintió {F1} al entregar el cachorro?", "{F1} entregó el cachorro. ¿Cómo se sintió?", "Triste", ["Muy aburrida", "Enfadada con su madre"], "Mira cómo tenía los ojos.", "{F1} tenía lágrimas en los ojos porque le daba pena separarse del cachorro."),
      siente(2, "¿Cómo crees que se sintió {F1} cuando vio al cachorro herido?", "{F1} vio al cachorro herido. ¿Cómo se sintió?", "Preocupada por él", ["Aburrida de esperar", "Orgullosa de su chaqueta", "Enfadada con el perro"], "Fíjate en lo que hace {F1} enseguida.", "{F1} lo protegió y lo llevó a casa. Eso hace quien está preocupada por alguien."),
      siente(3, "¿Cómo crees que se sintió {F1} cuando el vecino le dijo que podría visitar al cachorro?", "El vecino le dijo a {F1}: «Puedes visitarlo». ¿Cómo se sintió ella?", "Más animada, porque lo volvería a ver", ["Más triste que antes", "Asustada por el vecino", "Celosa de su madre"], "Piensa qué era lo que la ponía triste.", "Le daba pena no ver más al cachorro. Si puede visitarlo, esa pena se hace más pequeña."),
    ],
  },
  {
    id: "LEE3-T4-tx2",
    titulo: "A mitad de curso",
    imagen: dibujo("pelota"),
    texto:
      "{M1} llegó a una escuela nueva a mitad de curso. El primer día no conocía a nadie. En el recreo se quedó sentado solo, mirando sus zapatos. Entonces {M2} se acercó con una pelota. —Nos falta uno para jugar. ¿Vienes? {M1} dudó un momento, pero se levantó. Jugó con todos hasta que sonó la campana. Al volver a clase ya sabía cinco nombres, y al día siguiente fue a la escuela corriendo.",
    preguntas: [
      porque(1, "¿Por qué {M1} se quedó solo en el recreo?", "{M1} se quedó solo en el recreo. ¿Por qué?", "Porque no conocía a nadie", ["Porque le dolía un pie", "Porque estaba castigado"], "Lee la frase que va antes del recreo.", "Era su primer día en una escuela nueva y no conocía a nadie."),
      porque(2, "¿Por qué {M2} invitó a {M1} a jugar?", "{M2} invitó a {M1} a jugar. ¿Qué motivo dijo?", "Porque les faltaba un jugador", ["Porque {M1} era el dueño de la pelota", "Porque la maestra se lo había ordenado", "Porque eran amigos desde pequeños"], "Lee lo que dice {M2}.", "{M2} dice: «Nos falta uno para jugar». Por eso le pide que vaya."),
      porque(3, "¿Por qué {M1} fue corriendo a la escuela al día siguiente?", "Al día siguiente, {M1} fue corriendo a la escuela. ¿Por qué?", "Porque ya tenía compañeros y quería volver a verlos", ["Porque quería devolver la pelota a {M2}", "Porque tenía miedo de la campana", "Porque quería aprender más nombres de calles"], "Compara cómo estaba el primer día y cómo terminó.", "Después de jugar ya conocía a varios compañeros, así que tenía ganas de volver."),
      siente(1, "¿Cómo se sentía {M1} sentado en el recreo, mirando sus zapatos?", "{M1} estaba sentado y solo. ¿Cómo se sentía?", "Solo y triste", ["Alegre y tranquilo", "Enfadado con {M2}"], "Piensa en un niño nuevo que no conoce a nadie.", "No conocía a nadie y estaba solo mirando al suelo: se sentía triste."),
      siente(2, "¿Cómo se sentía {M1} cuando dudó un momento?", "{M1} dudó un momento. ¿Cómo se sentía?", "Inseguro, porque aún no conocía a nadie", ["Enfadado, porque no le gustaba la pelota", "Cansado, porque había corrido mucho", "Seguro de que ganaría el partido"], "Si dudas antes de hacer algo, ¿cómo te sientes?", "Dudar es no estar seguro. Quería jugar, pero todos eran desconocidos."),
      siente(3, "¿Cómo se sentía {M1} con su nueva escuela al final del texto?", "Mira el final del texto. ¿Cómo se sentía {M1} con su escuela?", "Contento y con ganas de ir", ["Igual de triste que el primer día", "Con miedo de sus compañeros", "Aburrido de jugar a la pelota"], "Fíjate en cómo va a la escuela el último día.", "Ir corriendo a la escuela muestra que estaba contento y tenía ganas de ir."),
    ],
  },
  {
    id: "LEE3-T4-tx3",
    titulo: "La primera gota",
    imagen: dibujo("nube"),
    texto:
      "Hacía semanas que no llovía y la tierra estaba agrietada. Las plantas de maíz se veían secas y el abuelo de {N1} miraba el cielo cada mañana sin decir nada. Una tarde, {N1} sintió una gota en el brazo. Después, otra. Salió corriendo a avisar al abuelo. Los dos se quedaron en el patio, riendo bajo la lluvia, con los brazos abiertos. Esa noche, el abuelo volvió a contar chistes.",
    preguntas: [
      porque(1, "¿Por qué estaban secas las plantas de maíz?", "Las plantas estaban secas. ¿Por qué?", "Porque hacía semanas que no llovía", ["Porque el abuelo las había cortado", "Porque había llovido demasiado"], "Lee la primera frase.", "Llevaba semanas sin llover, así que las plantas no tenían agua."),
      porque(2, "¿Por qué el abuelo miraba el cielo cada mañana?", "El abuelo miraba el cielo cada mañana. ¿Por qué?", "Porque esperaba que lloviera", ["Porque buscaba pájaros en el cielo", "Porque quería saber qué hora era", "Porque le gustaba ver el sol"], "Piensa qué necesitaban sus plantas.", "Sus plantas necesitaban agua. El abuelo miraba si llegaban nubes de lluvia."),
      porque(3, "¿Por qué el abuelo volvió a contar chistes esa noche?", "Esa noche, el abuelo contó chistes otra vez. ¿Por qué?", "Porque la lluvia le quitó la preocupación por las plantas", ["Porque {N1} le pidió un chiste nuevo", "Porque ya no tenía que trabajar nunca más", "Porque había estado todo el día en el patio"], "Compara cómo estaba antes de la lluvia y cómo estaba después.", "Antes estaba callado por la falta de agua. Con la lluvia, sus plantas podían salvarse y volvió a estar alegre."),
      siente(1, "¿Cómo se sentían {N1} y el abuelo bajo la lluvia?", "{N1} y el abuelo estaban bajo la lluvia. ¿Cómo se sentían?", "Muy contentos", ["Muy enfadados", "Muy aburridos"], "Busca qué hacían los dos en el patio.", "Estaban riendo con los brazos abiertos: eso muestra que estaban muy contentos."),
      siente(2, "¿Cómo se sentía el abuelo antes de que llegara la lluvia?", "Aún no llovía. ¿Cómo se sentía el abuelo?", "Preocupado por las plantas", ["Alegre y con ganas de bromear", "Tranquilo porque tenía mucha agua", "Enfadado con {N1}"], "Mira qué hacía cada mañana y qué no decía.", "Miraba el cielo sin decir nada mientras sus plantas se secaban. Estaba preocupado."),
      siente(3, "¿Qué sintió {N1} al notar las primeras gotas?", "{N1} notó las primeras gotas. ¿Qué sintió?", "Mucha ilusión por dar la buena noticia", ["Miedo a mojarse el brazo", "Pena por el abuelo", "Ganas de quedarse sin hacer nada"], "Fíjate en lo que hace {N1} y en lo que pasa después en el patio.", "{N1} corrió a avisar y después rio con el abuelo: era una noticia buena que quería contar."),
    ],
  },
  {
    id: "LEE3-T4-tx4",
    titulo: "La jarra azul",
    imagen: dibujo("pelota"),
    texto:
      "{F1} jugaba a la pelota en casa, aunque su padre le había pedido que no lo hiciera. De pronto, la pelota golpeó la jarra azul de la abuela y la jarra se rompió. {F1} se quedó blanca. Escondió los trozos debajo de la cama, pero esa noche no pudo dormir. Por la mañana se acercó a su padre, bajó la mirada y se lo contó todo. Él la abrazó y juntos pegaron los trozos.",
    preguntas: [
      porque(1, "¿Por qué se rompió la jarra?", "La jarra se rompió. ¿Por qué?", "Porque la golpeó la pelota", ["Porque se cayó de la cama", "Porque la abuela la soltó"], "Busca la frase donde aparece la jarra.", "La pelota de {F1} golpeó la jarra y la rompió."),
      porque(2, "¿Por qué {F1} escondió los trozos debajo de la cama?", "{F1} escondió los trozos. ¿Por qué?", "Para que nadie supiera lo que había pasado", ["Para pegarlos ella sola esa noche", "Para que no se perdieran en el patio", "Para dárselos a la abuela al día siguiente"], "Recuerda lo que le había pedido su padre.", "Su padre le había pedido que no jugara allí. {F1} quería que nadie viera lo ocurrido."),
      porque(3, "¿Por qué {F1} no pudo dormir esa noche?", "{F1} no pudo dormir. ¿Por qué?", "Porque le preocupaba lo que había hecho y escondido", ["Porque los trozos hacían ruido debajo de la cama", "Porque su padre la estaba regañando", "Porque había dormido por la tarde"], "Piensa en lo que había debajo de la cama y en lo que hizo por la mañana.", "Sabía que había desobedecido y escondido los trozos. Por eso no estaba tranquila y por la mañana lo contó."),
      siente(1, "¿Cómo se sintió {F1} cuando se rompió la jarra?", "La jarra se rompió. ¿Cómo se sintió {F1}?", "Asustada", ["Divertida", "Orgullosa"], "«Quedarse blanca» es algo que pasa con un gran susto.", "Se quedó blanca del susto: sabía que había pasado algo malo."),
      siente(2, "¿Cómo se sentía {F1} cuando bajó la mirada delante de su padre?", "{F1} bajó la mirada ante su padre. ¿Cómo se sentía?", "Avergonzada por lo que había hecho", ["Contenta por contar una buena noticia", "Enfadada porque su padre la abrazó", "Tranquila porque nadie sabía nada"], "Piensa cuándo bajamos la mirada al hablar con alguien.", "Bajar la mirada al contar algo que hiciste mal muestra vergüenza."),
      siente(3, "¿Cómo crees que se sintió {F1} cuando su padre la abrazó?", "Su padre la abrazó. ¿Cómo se sintió {F1}?", "Aliviada, porque ya no tenía que esconder nada", ["Más asustada que la noche anterior", "Enfadada con la abuela", "Aburrida de pegar trozos"], "Piensa cómo estaba por la noche y qué cambió después de contarlo.", "Ya había dicho la verdad y su padre no se enfadó con ella: ya no tenía que preocuparse por esconderlo."),
    ],
  },
];

export const TEXTOS_3_T5: readonly TextoEscrito[] = [
  // Recetas
  {
    id: "LEE3-T5-tx1",
    titulo: "Ensalada de frutas (para 4 personas)",
    imagen: dibujo("manzana"),
    texto:
      "Necesitas: 2 manzanas, 2 peras, 1 naranja y una cucharada de miel.\nPasos:\n1. Lávate las manos y lava bien la fruta.\n2. Pide a un adulto que corte las manzanas y las peras en trozos.\n3. Pon los trozos en un recipiente grande.\n4. Exprime la naranja y echa el jugo por encima.\n5. Añade la miel y mezcla con una cuchara.\n6. Sirve enseguida.",
    preguntas: [
      receta(1, "¿Cuántas peras necesitas para esta receta?", "¿Cuántas peras necesitas?", "2", ["1", "4"], "Lee la lista de lo que necesitas.", "La lista dice: 2 peras."),
      receta(2, "¿Qué haces justo después de poner los trozos en el recipiente?", "Ya pusiste los trozos en el recipiente. ¿Qué haces ahora?", "Exprimir la naranja y echar el jugo", ["Añadir la miel", "Lavar bien la fruta", "Servir la ensalada"], "Busca el paso 3 y mira cuál viene después.", "El paso 3 es poner los trozos y el paso 4 es exprimir la naranja y echar el jugo."),
      receta(3, "Quieres hacer esta ensalada para 8 personas. ¿Cuántas manzanas necesitas?", "La receta es para 4 personas. Tú quieres hacerla para 8. ¿Cuántas manzanas necesitas?", "4", ["2", "8", "6"], "8 personas son el doble de 4 personas.", "Para 4 personas se usan 2 manzanas. Para 8 personas, el doble: 4 manzanas."),
    ],
  },
  {
    id: "LEE3-T5-tx2",
    titulo: "Sopa de verduras (para 6 personas)",
    texto:
      "Necesitas: 3 zanahorias, 2 cebollas, 1 tomate, 2 litros de agua limpia y un poco de sal.\nPasos:\n1. Lava las verduras.\n2. Con ayuda de un adulto, córtalas en trozos pequeños.\n3. Con un adulto, calienta el agua en una olla hasta que hierva.\n4. Echa las verduras y la sal.\n5. Deja hervir durante 30 minutos.\n6. Espera a que se enfríe un poco antes de tomarla.",
    preguntas: [
      receta(1, "¿Cuántos litros de agua lleva la sopa?", "¿Cuántos litros de agua necesitas?", "2", ["3", "6"], "Lee la lista de lo que necesitas.", "La lista dice: 2 litros de agua limpia."),
      receta(2, "¿Cuándo se echan las verduras en la olla?", "¿En qué momento echas las verduras en la olla?", "Cuando el agua ya está hirviendo", ["Antes de lavarlas", "Antes de poner el agua", "Cuando la sopa ya se enfrió"], "Lee los pasos 3 y 4.", "En el paso 3 el agua hierve, y en el paso 4 se echan las verduras."),
      receta(3, "Empiezas a hervir las verduras a las 12:00. ¿A qué hora debes dejar de hervirlas?", "Las verduras empiezan a hervir a las 12:00. Hierven 30 minutos. ¿A qué hora terminan?", "A las 12:30", ["A las 12:06", "A las 13:00", "A las 12:03"], "Busca cuántos minutos deben hervir y súmalos.", "Las verduras hierven 30 minutos. Desde las 12:00, eso llega a las 12:30."),
    ],
  },
  {
    id: "LEE3-T5-tx3",
    titulo: "Limonada (para 5 vasos)",
    imagen: dibujo("vaso"),
    texto:
      "Necesitas: 3 limones, 1 litro de agua limpia y 4 cucharadas de azúcar.\nPasos:\n1. Lava los limones.\n2. Pide a un adulto que los corte por la mitad.\n3. Exprime las mitades y echa el jugo en una jarra.\n4. Añade el agua.\n5. Echa el azúcar y remueve con una cuchara hasta que no se vea.\n6. Prueba la limonada. Si está muy ácida, añade otra cucharada de azúcar.",
    preguntas: [
      receta(1, "¿Qué fruta lleva la limonada?", "¿Qué fruta necesitas?", "Limones", ["Naranjas", "Peras"], "Lee la lista de lo que necesitas.", "La lista dice: 3 limones."),
      receta(2, "¿Para qué sirve remover con la cuchara en el paso 5?", "En el paso 5 remueves con una cuchara. ¿Para qué?", "Para que el azúcar se mezcle hasta no verse", ["Para exprimir mejor los limones", "Para partir los limones por la mitad", "Para que el agua se enfríe"], "Lee el paso 5 hasta el final.", "El paso 5 dice que hay que remover hasta que el azúcar no se vea."),
      receta(3, "Pruebas la limonada y está muy ácida. ¿Cuántas cucharadas de azúcar tendrá en total después de arreglarla?", "La limonada ya lleva su azúcar, pero está muy ácida. La arreglas como dice el paso 6. ¿Cuántas cucharadas tendrá en total?", "5", ["4", "1", "3"], "Busca las cucharadas de la lista y lee el paso 6.", "La receta lleva 4 cucharadas y el paso 6 dice que se añade otra. En total, 5."),
    ],
  },
  {
    id: "LEE3-T5-tx4",
    titulo: "Arroz con zanahoria (para 4 personas)",
    texto:
      "Necesitas: 2 tazas de arroz, 4 tazas de agua limpia, 2 zanahorias, 1 cucharada de aceite y un poco de sal.\nPasos:\n1. Lava y ralla las zanahorias.\n2. Con un adulto, calienta el aceite en una olla.\n3. Añade la zanahoria y remueve 2 minutos.\n4. Echa el arroz, el agua y la sal.\n5. Tapa la olla y cuece a fuego bajo 20 minutos.\n6. Apaga el fuego y sirve.",
    preguntas: [
      receta(1, "¿Cuántas tazas de agua necesitas?", "¿Cuántas tazas de agua necesitas?", "4", ["2", "20"], "Lee la lista de lo que necesitas.", "La lista dice: 4 tazas de agua limpia. Las 2 tazas son de arroz."),
      receta(2, "¿Qué va primero en la olla, después del aceite?", "Ya calentaste el aceite. ¿Qué echas primero?", "La zanahoria", ["El arroz", "La sal", "El agua"], "Compara los pasos 3 y 4.", "En el paso 3 se añade la zanahoria. El arroz, el agua y la sal van en el paso 4."),
      receta(3, "Quieres hacer la mitad de esta receta, para 2 personas. ¿Cuántas tazas de agua necesitas?", "La receta es para 4 personas. Quieres hacer la mitad, para 2. ¿Cuántas tazas de agua necesitas?", "2", ["4", "1", "8"], "Busca el agua de la lista. La mitad es dividir entre dos.", "La receta lleva 4 tazas de agua. La mitad de 4 son 2 tazas."),
    ],
  },
  // Notas y mensajes
  {
    id: "LEE3-T5-tx5",
    titulo: "Una nota en la mesa",
    texto:
      "Hola, {M1}:\nHe salido al mercado a vender las verduras y volveré a las cinco. Tu hermana {F1} está en casa de la vecina; ve a buscarla a las cuatro, por favor. Hay sopa en la olla, pero caliéntala solo si la abuela está contigo. Antes de salir, cierra bien la puerta y guarda la llave en tu mochila. Gracias por ayudarme.\nMamá",
    preguntas: [
      nota(1, "¿Quién escribió la nota?", "¿Quién escribió esta nota?", "Mamá", ["{M1}", "La vecina"], "Mira quién firma al final.", "La nota termina con la firma «Mamá»."),
      nota(2, "¿Qué le pide la nota a {M1} que haga a las cuatro?", "Son las cuatro. ¿Qué debe hacer {M1}?", "Ir a buscar a su hermana", ["Volver del mercado", "Calentar la sopa", "Vender las verduras"], "Busca en la nota la hora de las cuatro.", "La nota dice: «ve a buscarla a las cuatro». Habla de su hermana {F1}."),
      nota(3, "¿Por qué mamá deja una nota en lugar de decírselo a {M1} en persona?", "Mamá escribe una nota. No habla con {M1}. ¿Por qué?", "Porque ella ya no está en casa", ["Porque {M1} no quiere hablar con ella", "Porque la abuela le pidió escribirla", "Porque {M1} está en el mercado con ella"], "Lee lo que dice mamá en la primera frase.", "Mamá ha salido al mercado y no está para hablar con {M1}. Por eso se lo deja escrito."),
    ],
  },
  {
    id: "LEE3-T5-tx6",
    titulo: "Aviso de la maestra",
    texto:
      "Estimadas familias:\nEl jueves iremos con la clase al río para estudiar las plantas. Saldremos de la escuela a las nueve y volveremos a las doce. Cada niño y cada niña debe traer una botella de agua, un gorro y un cuaderno. No hace falta traer dinero. Si llueve, nos quedaremos en la escuela y haremos la clase en el aula.\nMuchas gracias.\nLa maestra",
    preguntas: [
      nota(1, "¿Para quién es este mensaje?", "¿A quién le escribe la maestra?", "Para las familias", ["Para el río", "Para la directora"], "Lee el saludo del principio.", "El mensaje empieza con «Estimadas familias»."),
      nota(2, "¿Qué NO hace falta llevar al río?", "Van al río. ¿Qué cosa NO hace falta llevar?", "Dinero", ["Un gorro", "Un cuaderno", "Una botella de agua"], "Busca en el mensaje lo que no hace falta.", "La maestra pide agua, gorro y cuaderno, y dice que no hace falta traer dinero."),
      nota(3, "Si el jueves llueve, ¿dónde estará la clase a las diez de la mañana?", "El jueves llueve. Son las diez. ¿Dónde está la clase?", "En el aula", ["Junto al río", "En casa", "En el camino del río"], "Lee la frase que empieza por «Si llueve».", "Si llueve no van al río: se quedan en la escuela y tienen clase en el aula."),
    ],
  },
  {
    id: "LEE3-T5-tx7",
    titulo: "Un mensaje para {F1}",
    texto:
      "Querida {F1}:\nAyer encontré tu cuaderno verde debajo de mi mesa, en el aula. Creo que se te cayó al cambiarnos de sitio. No te preocupes: lo tengo guardado en mi mochila y no se ha mojado. Mañana no iré a clase porque voy al médico con mi abuelo, así que se lo daré a tu primo {M1}, que vive en mi calle. Él te lo llevará.\nUn abrazo,\n{F2}",
    preguntas: [
      nota(1, "¿Qué encontró {F2}?", "{F2} encontró una cosa. ¿Qué encontró?", "Un cuaderno verde", ["Una mochila mojada", "Una mesa rota"], "Lee la primera frase del mensaje.", "{F2} dice que encontró el cuaderno verde de {F1}."),
      nota(2, "¿Quién le llevará el cuaderno a {F1}?", "¿Quién lleva el cuaderno a {F1}?", "Su primo {M1}", ["{F2}", "El abuelo de {F2}", "La maestra"], "Lee el final del mensaje.", "{F2} se lo dará al primo de {F1}, {M1}, y él se lo llevará."),
      nota(3, "¿Por qué {F2} no le da el cuaderno a {F1} en clase?", "{F2} no da el cuaderno a {F1} en clase. ¿Por qué?", "Porque mañana no irá a clase", ["Porque el cuaderno se ha mojado", "Porque quiere quedarse el cuaderno", "Porque {F1} vive en su calle"], "Busca qué va a hacer {F2} mañana.", "{F2} irá al médico con su abuelo y no estará en clase. Por eso buscó otra forma."),
    ],
  },
  {
    id: "LEE3-T5-tx8",
    titulo: "Aviso para un vecino",
    texto:
      "Señor {M1}:\nSoy {F1}, la hija de la vecina de la casa azul. Mi madre me pide que le avise: mañana no habrá agua en esta calle, porque arreglarán la tubería. La cortarán a las ocho de la mañana y volverá a las dos de la tarde. Le conviene llenar hoy sus recipientes. Si necesita ayuda para cargarlos, yo puedo ir después de clase.\nMuchas gracias.",
    preguntas: [
      nota(1, "¿Quién escribe este mensaje?", "¿Quién escribe el mensaje?", "{F1}, la hija de la vecina", ["El señor {M1}", "El hombre que arregla la tubería"], "Lee la primera frase después del saludo.", "El mensaje dice: «Soy {F1}, la hija de la vecina de la casa azul»."),
      nota(2, "¿Por qué mañana no habrá agua?", "Mañana no habrá agua. ¿Por qué?", "Porque arreglarán la tubería", ["Porque los recipientes están vacíos", "Porque la vecina se va de viaje", "Porque el pozo está seco"], "Busca la palabra «porque» en el mensaje.", "El mensaje dice que no habrá agua porque arreglarán la tubería."),
      nota(3, "Mañana, a las diez de la mañana, el señor {M1} quiere lavar unos platos. ¿De dónde sacará el agua?", "Mañana son las diez. El señor {M1} quiere lavar platos. ¿De dónde saca agua?", "De los recipientes que llenó hoy", ["Del grifo, como siempre", "De la casa azul, que sí tendrá agua", "Del agua que volverá a las ocho"], "Mira a qué horas no habrá agua y qué le aconsejan hacer hoy.", "De ocho a dos no habrá agua en la calle. Por eso le aconsejan llenar hoy sus recipientes."),
    ],
  },
  // Instrucciones
  {
    id: "LEE3-T5-tx9",
    titulo: "Cómo lavarse bien las manos",
    imagen: dibujo("jabon"),
    texto:
      "1. Moja las manos con agua limpia.\n2. Pon jabón y frota las palmas.\n3. Frota también entre los dedos y debajo de las uñas.\n4. Sigue frotando mientras cuentas hasta veinte.\n5. Enjuaga las manos hasta que no quede jabón.\n6. Sécalas con una toalla limpia o déjalas secar al aire.\nLávate las manos antes de comer, después de usar el baño y al volver de jugar.",
    preguntas: [
      instr(1, "¿Qué es lo primero que hay que hacer?", "¿Qué haces primero?", "Mojar las manos", ["Poner jabón", "Secar las manos"], "Mira el paso 1.", "El paso 1 dice que primero se mojan las manos con agua limpia."),
      instr(2, "¿Hasta qué número debes contar mientras frotas?", "Frotas y cuentas. ¿Hasta qué número cuentas?", "Hasta veinte", ["Hasta seis", "Hasta cinco", "Hasta diez"], "Busca el paso que habla de contar.", "El paso 4 dice que sigas frotando mientras cuentas hasta veinte."),
      instr(3, "Acabas de enjuagarte y aún ves jabón en los dedos. ¿Qué debes hacer?", "Te enjuagas. Todavía tienes jabón en los dedos. ¿Qué haces?", "Seguir enjuagando hasta que no quede jabón", ["Secarte con la toalla enseguida", "Poner más jabón", "Volver a contar hasta veinte"], "Lee con atención el paso 5.", "El paso 5 dice que hay que enjuagar hasta que no quede jabón, y aún queda."),
    ],
  },
  {
    id: "LEE3-T5-tx10",
    titulo: "Cómo sembrar una semilla en un vaso",
    imagen: dibujo("vaso"),
    texto:
      "1. Haz un agujero pequeño en el fondo de un vaso viejo. Pide ayuda a un adulto.\n2. Llena el vaso de tierra hasta casi arriba.\n3. Haz un hoyo con el dedo, de un dedo de hondo.\n4. Pon la semilla dentro y tápala con tierra.\n5. Riega con poca agua.\n6. Deja el vaso donde le dé la luz.\n7. Riega cada dos días. En una semana verás un brote.",
    preguntas: [
      instr(1, "¿Dónde se hace el agujero del vaso?", "Haces un agujero en el vaso. ¿Dónde?", "En el fondo", ["En el borde", "En la tierra del patio"], "Lee el paso 1.", "El paso 1 dice que el agujero se hace en el fondo del vaso."),
      instr(2, "¿Con qué se hace el hoyo para la semilla?", "Haces un hoyo para la semilla. ¿Con qué?", "Con el dedo", ["Con una cuchara", "Con un lápiz", "Con el vaso"], "Busca la palabra «hoyo».", "El paso 3 dice: «Haz un hoyo con el dedo»."),
      instr(3, "Regaste la semilla el lunes por última vez. ¿Qué día te toca regarla otra vez?", "Regaste el lunes. Riegas cada dos días. ¿Qué día riegas otra vez?", "El miércoles", ["El martes", "El jueves", "El domingo"], "Busca cada cuánto hay que regar y cuenta desde el lunes.", "Hay que regar cada dos días. Dos días después del lunes es miércoles."),
    ],
  },
  {
    id: "LEE3-T5-tx11",
    titulo: "Cómo jugar a las tres piedras",
    texto:
      "Juegan dos personas. Cada una tiene tres piedras en la mano.\n1. Las dos esconden las manos en la espalda.\n2. Cada una pone en un puño las piedras que quiere: ninguna, una, dos o tres.\n3. Sacan los puños cerrados y cada una dice un número.\n4. Abren los puños y cuentan todas las piedras.\n5. Gana un punto quien dijo el número correcto.\nGana el juego quien consigue cinco puntos.",
    preguntas: [
      instr(1, "¿Cuántas personas juegan?", "¿Cuántas personas juegan?", "Dos", ["Tres", "Cinco"], "Lee la primera frase.", "La primera frase dice que juegan dos personas."),
      instr(2, "¿Cuándo se abren los puños?", "¿En qué momento abres el puño?", "Después de que cada una diga un número", ["Antes de esconder las manos", "Al empezar a jugar", "Cuando alguien tiene cinco puntos"], "Compara los pasos 3 y 4.", "En el paso 3 cada persona dice un número, y en el paso 4 se abren los puños."),
      instr(3, "{F1} tiene dos piedras en el puño y {M1} tiene una. {F1} dijo tres y {M1} dijo dos. ¿Quién gana el punto?", "{F1} tiene 2 piedras en el puño. {M1} tiene 1. {F1} dijo 3. {M1} dijo 2. ¿Quién gana el punto?", "{F1}", ["{M1}", "Los dos", "Ninguno de los dos"], "Cuenta todas las piedras, como dice el paso 4.", "Hay tres piedras en total, y quien dijo tres fue {F1}. Ella gana el punto."),
    ],
  },
  {
    id: "LEE3-T5-tx12",
    titulo: "Cómo hacer un marcador para tu libro",
    imagen: dibujo("libro"),
    texto:
      "Necesitas una tira de cartón, un trozo de hilo, tijeras y lápices de colores.\n1. Recorta la tira. Debe ser más larga que tu mano.\n2. Dibuja lo que quieras en un lado.\n3. Escribe tu nombre en el otro lado.\n4. Pide a un adulto que haga un agujero arriba.\n5. Pasa el hilo por el agujero y haz un nudo.\n6. Ponlo entre las páginas donde dejes de leer.",
    preguntas: [
      instr(1, "¿Qué se escribe en el marcador?", "¿Qué escribes en el marcador?", "Tu nombre", ["La fecha", "El título del libro"], "Busca la palabra «escribe».", "El paso 3 dice: «Escribe tu nombre en el otro lado»."),
      instr(2, "¿Quién debe hacer el agujero?", "Hay que hacer un agujero. ¿Quién lo hace?", "Un adulto", ["Tú, con el lápiz", "Tú, con el hilo", "Nadie, ya viene hecho"], "Lee el paso 4.", "El paso 4 dice que pidas a un adulto que haga el agujero."),
      instr(3, "¿Qué pasa si te saltas el paso 4?", "Te saltas el paso 4. ¿Qué pasa?", "No podrás pasar el hilo", ["No podrás dibujar en un lado", "No podrás recortar la tira", "No podrás escribir tu nombre"], "Lee el paso que viene justo después. ¿Qué necesita?", "El paso 5 pide pasar el hilo por el agujero. Sin agujero, no se puede."),
    ],
  },
];
