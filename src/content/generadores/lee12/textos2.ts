// 2.º de primaria: textos de dos a cuatro frases (30–50 palabras), escritos para RADAR.
import type { TextoEscrito } from "../../plantillas.ts";
import { q } from "./textos1.ts";

const T = "LEE2-T3-a";
const P_QUIEN = "Busca en el texto el nombre de la persona.";
const P_CUANDO = "Busca en el texto las palabras que dicen cuándo pasa.";
const P_DONDE = "Busca en el texto las palabras que dicen el lugar.";

export const TEXTOS_BUSCAR: readonly TextoEscrito[] = [
  {
    id: "LEE2-T3-tx1", titulo: "Día de mercado",
    texto: "El martes por la mañana, {F1} fue al mercado con su tía. Compraron arroz y tomates en un puesto cerca de la plaza. Por la tarde, {F1} ayudó a guardar la compra en la cocina.",
    preguntas: [
      q(T, 1, "¿Con quién fue {F1} al mercado?", "Con su tía", ["Con su abuela", "Con su hermano"], P_QUIEN, "El texto dice que {F1} fue al mercado con su tía."),
      q(T, 1, "¿Qué día fueron al mercado?", "El martes", ["El lunes", "El sábado"], P_CUANDO, "La primera frase dice «el martes por la mañana»."),
      q(T, 2, "¿Dónde estaba el puesto del arroz y los tomates?", "Cerca de la plaza", ["Cerca de la escuela", "En la cocina"], P_DONDE, "El texto dice que el puesto estaba cerca de la plaza."),
      q(T, 2, "¿Cuándo guardó {F1} la compra?", "Por la tarde", ["Por la mañana", "Por la noche"], P_CUANDO, "Por la mañana fueron al mercado. Por la tarde guardó la compra."),
      q(T, 3, "Al final del día, ¿dónde estaban el arroz y los tomates?", "En la cocina", ["En el mercado", "En la plaza"], "Primero estaban en un sitio. Mira adónde los llevaron después.", "Los compraron en el mercado, pero después {F1} guardó la compra en la cocina.", "¿Dónde quedó la compra al final?"),
    ],
  },
  {
    id: "LEE2-T3-tx2", titulo: "Las ocho y las doce",
    texto: "{M1} y su hermana {F1} salen de casa a las ocho. Él va a la escuela y ella va a la biblioteca a estudiar. A las doce, los dos vuelven a casa para comer con su madre.",
    preguntas: [
      q(T, 1, "¿Cómo se llama la hermana de {M1}?", "{F1}", ["{F2}", "{F3}"], P_QUIEN, "El texto dice «su hermana {F1}»."),
      q(T, 1, "¿A qué hora salen de casa?", "A las ocho", ["A las doce", "A las diez"], P_CUANDO, "La primera frase dice que salen a las ocho."),
      q(T, 2, "¿A qué hora vuelven a casa?", "A las doce", ["A las ocho", "A las dos"], P_CUANDO, "Salen a las ocho y vuelven a las doce."),
      q(T, 3, "¿Adónde va {F1} cuando sale de casa?", "A la biblioteca", ["A la escuela", "Al mercado"], "Mira a quién se refieren «él» y «ella».", "El texto dice «ella va a la biblioteca». «Ella» es {F1}.", "{F1} sale de casa. ¿Adónde va?"),
      q(T, 3, "¿Quién va a la escuela?", "{M1}", ["{F1}", "Su madre"], "Mira a quién se refieren «él» y «ella».", "El texto dice «él va a la escuela». «Él» es {M1}."),
    ],
  },
  {
    id: "LEE2-T3-tx3", titulo: "Una tarde de lluvia",
    texto: "Ayer por la tarde llovió mucho en el pueblo. {F1} y {F2} no jugaron en el patio: se quedaron en la biblioteca de la escuela. Cuando dejó de llover, la maestra {F3} las acompañó a casa.",
    preguntas: [
      q(T, 1, "¿Quién acompañó a las niñas a casa?", "La maestra {F3}", ["La madre de {F1}", "El abuelo de {F2}"], P_QUIEN, "El texto dice que la maestra {F3} las acompañó a casa."),
      q(T, 2, "¿Cuándo llovió mucho?", "Ayer por la tarde", ["Ayer por la mañana", "Hoy por la tarde"], P_CUANDO, "La primera frase dice «ayer por la tarde»."),
      q(T, 2, "¿Dónde se quedaron {F1} y {F2}?", "En la biblioteca", ["En el patio", "En su casa"], P_DONDE, "El texto dice que no jugaron en el patio: se quedaron en la biblioteca."),
      q(T, 3, "¿Cuándo volvieron las niñas a casa?", "Cuando dejó de llover", ["Antes de que empezara a llover", "Mientras llovía mucho"], "Lee la última frase.", "La última frase dice que la maestra las acompañó cuando dejó de llover."),
    ],
  },
  {
    id: "LEE2-T3-tx4", titulo: "El huerto del abuelo",
    texto: "Todos los sábados, {M1} ayuda a su abuelo en el huerto. Hoy llegó muy temprano y regó las plantas antes de que saliera el sol. Su amigo {M2} llegó más tarde, con una bolsa de semillas.",
    preguntas: [
      q(T, 1, "¿Dónde ayuda {M1} a su abuelo?", "En el huerto", ["En la tienda", "En la escuela"], P_DONDE, "La primera frase dice que le ayuda en el huerto."),
      q(T, 1, "¿Qué día ayuda {M1} a su abuelo?", "Los sábados", ["Los lunes", "Los domingos"], P_CUANDO, "El texto dice «todos los sábados»."),
      q(T, 2, "¿Quién llevó la bolsa de semillas?", "{M2}", ["{M1}", "El abuelo"], P_QUIEN, "El texto dice que {M2} llegó con una bolsa de semillas."),
      q(T, 3, "¿Quién llegó antes al huerto hoy, {M1} o {M2}?", "{M1}", ["{M2}", "Llegaron a la vez"], "Compara «muy temprano» y «más tarde».", "{M1} llegó muy temprano y {M2} llegó más tarde.", "¿Quién llegó antes: {M1} o {M2}?"),
      q(T, 3, "¿Cuándo regó {M1} las plantas?", "Antes de que saliera el sol", ["Cuando llegó {M2}", "Por la noche, al volver a casa"], "Lee la segunda frase.", "El texto dice que regó las plantas antes de que saliera el sol."),
    ],
  },
  {
    id: "LEE2-T3-tx5", titulo: "Visita a la granja",
    texto: "El viernes, la clase de {F1} visitó una granja. La dueña, {F2}, les enseñó las vacas en el establo. A mediodía, todos comieron en el campo, debajo de un árbol grande, y después volvieron a la escuela en autobús.",
    preguntas: [
      q(T, 1, "¿Quién es la dueña de la granja?", "{F2}", ["{F1}", "{F3}"], P_QUIEN, "El texto dice «la dueña, {F2}»."),
      q(T, 1, "¿Qué día fue la visita?", "El viernes", ["El martes", "El domingo"], P_CUANDO, "Las primeras palabras del texto lo dicen: el viernes."),
      q(T, 2, "¿Dónde estaban las vacas?", "En el establo", ["En el campo", "Debajo del árbol"], P_DONDE, "La dueña les enseñó las vacas en el establo."),
      q(T, 2, "¿Cuándo comieron?", "A mediodía", ["Por la noche", "Al llegar a la escuela"], P_CUANDO, "El texto dice que comieron a mediodía."),
      q(T, 3, "¿Dónde estaba la clase a mediodía?", "Debajo de un árbol, en el campo", ["Dentro del establo", "En el autobús"], "Busca en el texto la palabra «mediodía».", "A mediodía comieron en el campo, debajo de un árbol grande."),
    ],
  },
  {
    id: "LEE2-T3-tx6", titulo: "El gorro perdido",
    texto: "El domingo, {M1} perdió su gorro en la plaza. El lunes, antes de entrar a clase, {F1} se lo devolvió. Ella lo había encontrado junto a la fuente, cuando iba a comprar pan con su padre.",
    preguntas: [
      q(T, 1, "¿Quién perdió el gorro?", "{M1}", ["{F1}", "El padre de {F1}"], P_QUIEN, "La primera frase dice que {M1} perdió su gorro."),
      q(T, 2, "¿Qué día perdió {M1} el gorro?", "El domingo", ["El lunes", "El sábado"], P_CUANDO, "Lo perdió el domingo. El lunes se lo devolvieron."),
      q(T, 2, "¿Dónde perdió {M1} el gorro?", "En la plaza", ["En la clase", "En la tienda"], P_DONDE, "La primera frase dice que lo perdió en la plaza."),
      q(T, 3, "¿Quién encontró el gorro?", "{F1}", ["{M1}", "La maestra"], "«Ella» habla de alguien que ya salió en el texto.", "«Ella lo había encontrado»: «ella» es {F1}, la que devolvió el gorro."),
      q(T, 3, "¿Dónde estaba el gorro cuando lo encontraron?", "Junto a la fuente", ["En la clase", "En la casa de {M1}"], "Lee la última frase.", "El texto dice que {F1} lo encontró junto a la fuente.", "Encontraron el gorro. ¿Dónde estaba?"),
      q(T, 3, "¿Cuándo recuperó {M1} su gorro?", "El lunes, antes de entrar a clase", ["El domingo, en la plaza", "El lunes, al salir de clase"], "Busca cuándo se lo devolvieron.", "{F1} se lo devolvió el lunes, antes de entrar a clase."),
    ],
  },
  {
    id: "LEE2-T3-tx7", titulo: "La tienda abrió tarde",
    texto: "La tienda de {M1} abre todos los días a las nueve. Hoy abrió a las diez, porque {M1} llevó a su hija {F1} al médico. Por suerte, ella ya está mejor y esta tarde jugará en el patio con su prima {F2}.",
    preguntas: [
      q(T, 1, "¿Adónde llevó {M1} a su hija?", "Al médico", ["A la escuela", "Al mercado"], P_DONDE, "El texto dice que {M1} llevó a su hija al médico."),
      q(T, 2, "¿Cuándo jugará {F1} en el patio?", "Esta tarde", ["Esta mañana", "Mañana por la tarde"], P_CUANDO, "El texto dice «esta tarde jugará en el patio»."),
      q(T, 2, "¿Con quién jugará {F1}?", "Con su prima {F2}", ["Con su padre", "Con su hermana {F3}"], P_QUIEN, "El texto dice que jugará con su prima {F2}."),
      q(T, 3, "¿A qué hora abrió la tienda hoy?", "A las diez", ["A las nueve", "A las once"], "Cuidado: una hora es la de todos los días y otra es la de hoy.", "Todos los días abre a las nueve, pero hoy abrió a las diez."),
    ],
  },
  {
    id: "LEE2-T3-tx8", titulo: "Mirar las estrellas",
    texto: "Anoche, {F1} y su abuelo se sentaron fuera de la casa para mirar las estrellas. Él le enseñó la más brillante, cerca de la luna. Cuando empezó a hacer frío, entraron y se fueron a dormir.",
    preguntas: [
      q(T, 1, "¿Con quién miró {F1} las estrellas?", "Con su abuelo", ["Con su madre", "Con su amiga {F2}"], P_QUIEN, "El texto dice «{F1} y su abuelo»."),
      q(T, 2, "¿Dónde se sentaron?", "Fuera de la casa", ["En la cama", "En la escuela"], P_DONDE, "El texto dice que se sentaron fuera de la casa."),
      q(T, 2, "¿Cuándo miraron las estrellas?", "Anoche", ["Esta mañana", "Ayer al mediodía"], P_CUANDO, "La primera palabra del texto es «anoche»."),
      q(T, 3, "¿Quién enseñó la estrella más brillante?", "El abuelo", ["{F1}", "La abuela"], "«Él» habla de alguien que ya salió en el texto.", "«Él le enseñó la más brillante»: «él» es el abuelo."),
      q(T, 3, "¿Cuándo entraron en la casa?", "Cuando empezó a hacer frío", ["Cuando salió la luna", "Cuando salió el sol"], "Lee la última frase.", "La última frase dice que entraron cuando empezó a hacer frío."),
    ],
  },
];

const A = "LEE2-T4-a";
const B = "LEE2-T4-b";
const P_ORDEN = "Vuelve a leer el texto y piensa qué pasó antes y qué pasó después.";
const P_MARCAS = "Fíjate en palabras como «primero», «luego», «después» y «al final».";
const P_ANTES = "Cuidado: el texto no lo cuenta todo en orden. Busca la palabra «antes» o «había».";

export const TEXTOS_ORDEN: readonly TextoEscrito[] = [
  {
    id: "LEE2-T4-tx1", titulo: "Las calabazas",
    texto: "Primero, {F1} sacó agua del pozo. Luego regó las plantas del huerto con su madre. Después recogieron dos calabazas grandes. Al final de la tarde, las llevaron al mercado y las vendieron.",
    preguntas: [
      q(A, 1, "¿Qué hizo {F1} justo después de sacar agua?", "Regó las plantas", ["Recogió dos calabazas", "Fue al mercado"], P_MARCAS, "Primero sacó agua y luego regó las plantas.", "{F1} sacó agua. ¿Qué hizo justo después?"),
      q(A, 2, "¿Qué hicieron justo antes de ir al mercado?", "Recogieron dos calabazas", ["Regaron las plantas", "Sacaron agua del pozo"], P_MARCAS, "Después de regar recogieron las calabazas, y al final fueron al mercado.", "Fueron al mercado. ¿Qué hicieron justo antes?"),
      q(B, 1, "¿Qué pasó primero?", "{F1} sacó agua del pozo", ["{F1} regó las plantas", "Vendieron las calabazas"], P_MARCAS, "El texto empieza con «primero, {F1} sacó agua del pozo»."),
      q(B, 2, "¿Qué pasó al final?", "Vendieron las calabazas", ["Recogieron las calabazas", "Regaron las plantas"], P_MARCAS, "La última frase dice que al final de la tarde las vendieron en el mercado."),
    ],
  },
  {
    id: "LEE2-T4-tx2", titulo: "La carta",
    texto: "Por la mañana, {M1} escribió una carta para su abuela. A mediodía la metió en un sobre. Por la tarde fue a la oficina de correos y la envió. Tres días después, su abuela la leyó muy contenta.",
    preguntas: [
      q(A, 1, "¿Qué hizo {M1} antes de meter la carta en el sobre?", "Escribió la carta", ["Fue a la oficina de correos", "Envió la carta"], P_ORDEN, "Por la mañana la escribió y a mediodía la metió en el sobre.", "{M1} metió la carta en el sobre. ¿Qué hizo antes?"),
      q(A, 2, "¿Qué pasó después de que {M1} enviara la carta?", "Su abuela la leyó", ["{M1} la escribió", "{M1} la metió en un sobre"], P_ORDEN, "Tres días después de enviarla, su abuela la leyó.", "{M1} envió la carta. ¿Qué pasó después?"),
      q(B, 1, "¿Qué hizo {M1} primero?", "Escribió una carta", ["Fue a la oficina de correos", "Metió la carta en un sobre"], P_ORDEN, "Lo primero, por la mañana, fue escribir la carta."),
      q(B, 2, "¿Qué pasó en último lugar?", "La abuela leyó la carta", ["{M1} envió la carta", "{M1} metió la carta en un sobre"], P_ORDEN, "Lo último pasó tres días después: la abuela leyó la carta."),
    ],
  },
  {
    id: "LEE2-T4-tx3", titulo: "Las manos sucias",
    texto: "{F1} llegó a la escuela con las manos sucias. Antes, en el camino, había ayudado a un señor a levantar unas cajas. Se lavó las manos con jabón y luego entró en clase.",
    preguntas: [
      q(A, 2, "¿Qué hizo {F1} justo antes de entrar en clase?", "Se lavó las manos", ["Ayudó a un señor", "Llegó a la escuela"], "Lee la última frase.", "El texto dice que se lavó las manos y luego entró en clase.", "{F1} entró en clase. ¿Qué hizo justo antes?"),
      q(A, 3, "¿Qué hizo {F1} antes de llegar a la escuela?", "Ayudó a un señor con unas cajas", ["Se lavó las manos", "Entró en clase"], P_ANTES, "El texto dice «antes, en el camino»: ayudó al señor antes de llegar.", "{F1} llegó a la escuela. ¿Qué hizo antes?"),
      q(B, 3, "¿Qué pasó primero?", "{F1} ayudó a un señor", ["{F1} llegó a la escuela", "{F1} se lavó las manos"], P_ANTES, "Aunque se cuenta después, ayudar al señor pasó antes de llegar a la escuela."),
      q(B, 3, "¿Cuál es el orden de lo que pasó?", "Ayudó a un señor, llegó a la escuela y se lavó las manos.", ["Llegó a la escuela, ayudó a un señor y se lavó las manos.", "Se lavó las manos, ayudó a un señor y llegó a la escuela."], P_ANTES, "Ayudó en el camino, después llegó a la escuela y allí se lavó las manos."),
    ],
  },
  {
    id: "LEE2-T4-tx4", titulo: "La mochila lista",
    texto: "Antes de irse a dormir, {M1} guardó sus libros en la mochila. Esa tarde había terminado la tarea con su hermano. Por la mañana se levantó temprano, tomó la mochila y se fue a la escuela.",
    preguntas: [
      q(A, 2, "¿Qué hizo {M1} justo después de levantarse?", "Tomó la mochila", ["Guardó sus libros", "Terminó la tarea"], "Lee la última frase.", "Por la mañana se levantó y tomó la mochila.", "{M1} se levantó. ¿Qué hizo justo después?"),
      q(A, 3, "¿Qué hizo {M1} antes de guardar los libros?", "Terminó la tarea", ["Se levantó temprano", "Se fue a la escuela"], P_ANTES, "Terminó la tarea por la tarde y guardó los libros antes de dormir.", "{M1} guardó los libros. ¿Qué hizo antes?"),
      q(B, 1, "¿Qué hizo {M1} al final?", "Se fue a la escuela", ["Terminó la tarea", "Guardó sus libros"], "Lee la última frase.", "Lo último que cuenta el texto es que se fue a la escuela."),
      q(B, 3, "¿Qué hizo {M1} primero?", "Terminó la tarea con su hermano", ["Guardó sus libros", "Se levantó temprano"], P_ANTES, "Primero fue la tarde, cuando terminó la tarea. Después guardó los libros y durmió."),
    ],
  },
  {
    id: "LEE2-T4-tx5", titulo: "La gallina escapada",
    texto: "Una gallina se escapó del corral de {F1}. {F1} y {M1} la buscaron por toda la calle. La encontraron detrás de la tienda, comiendo maíz. La llevaron al corral y cerraron bien la puerta.",
    preguntas: [
      q(A, 1, "¿Qué hicieron justo después de encontrar la gallina?", "La llevaron al corral", ["La buscaron por la calle", "Fueron a la tienda"], P_ORDEN, "La encontraron y la llevaron al corral.", "Encontraron la gallina. ¿Qué hicieron justo después?"),
      q(A, 2, "¿Qué pasó antes de que {F1} y {M1} buscaran por la calle?", "La gallina se escapó", ["Encontraron la gallina", "Cerraron la puerta"], P_ORDEN, "La buscaron porque antes se había escapado.", "{F1} y {M1} buscaron por la calle. ¿Qué pasó antes?"),
      q(B, 1, "¿Qué pasó primero?", "La gallina se escapó", ["La encontraron", "Cerraron la puerta"], P_ORDEN, "Todo empieza cuando la gallina se escapa del corral."),
      q(B, 2, "¿Qué pasó al final?", "Cerraron bien la puerta", ["Buscaron por la calle", "Encontraron la gallina"], P_ORDEN, "Lo último que hicieron fue cerrar bien la puerta del corral."),
      q(B, 3, "¿Cuál es el orden de la historia?", "Se escapó, la buscaron y la encontraron.", ["La buscaron, se escapó y la encontraron.", "La encontraron, la buscaron y se escapó."], P_ORDEN, "Primero se escapó la gallina, después la buscaron y al final la encontraron."),
    ],
  },
  {
    id: "LEE2-T4-tx6", titulo: "El puente cerrado",
    texto: "Anoche llovió mucho y el río creció. Esta mañana el puente estaba cerrado, así que el autobús dio una vuelta por otro camino. Por eso {N1} llegó tarde a la escuela.",
    preguntas: [
      q(A, 1, "¿Qué pasó antes de que creciera el río?", "Llovió mucho", ["El autobús dio una vuelta", "{N1} llegó tarde"], P_ORDEN, "Primero llovió mucho y por eso creció el río.", "El río creció. ¿Qué pasó antes?"),
      q(A, 3, "¿Qué pasó justo antes de que {N1} llegara tarde?", "El autobús dio una vuelta", ["Llovió mucho", "El río creció"], "Busca qué pasó esta mañana, justo antes de llegar.", "{N1} llegó tarde porque el autobús dio una vuelta por otro camino.", "{N1} llegó tarde. ¿Qué pasó justo antes?"),
      q(B, 2, "¿Qué pasó en último lugar?", "{N1} llegó tarde a la escuela", ["El río creció", "Cerraron el paso por el puente"], P_ORDEN, "Lo último fue la llegada a la escuela, después de todo lo demás."),
    ],
  },
  {
    id: "LEE2-T4-tx7", titulo: "El cuaderno escondido",
    texto: "{F1} encontró por fin su cuaderno debajo de la cama. Lo había buscado toda la mañana en la mochila y en la mesa. Su hermana lo había dejado allí ayer, cuando hacía sus dibujos.",
    preguntas: [
      q(A, 3, "¿Qué pasó antes de que {F1} buscara el cuaderno?", "Su hermana lo dejó debajo de la cama", ["{F1} lo encontró", "{F1} miró en la mochila"], P_ANTES, "La hermana lo dejó allí ayer. {F1} lo buscó después, esta mañana.", "{F1} buscó el cuaderno. ¿Qué pasó antes?"),
      q(B, 3, "¿Qué pasó primero?", "Su hermana dejó el cuaderno debajo de la cama", ["{F1} buscó en la mochila", "{F1} encontró el cuaderno"], P_ANTES, "Lo primero pasó ayer: la hermana dejó allí el cuaderno."),
    ],
  },
];
