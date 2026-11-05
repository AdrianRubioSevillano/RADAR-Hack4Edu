// 1.º de primaria: textos de una o dos frases, escritos para RADAR.
import type { Dificultad, ObjetoId } from "../../tipos.ts";
import type { PreguntaEscrita, TextoEscrito } from "../../plantillas.ts";

export function q(sub: string, dificultad: Dificultad, enunciado: string, correcta: string, distractores: readonly string[], pista: string, explicacion: string, enunciadoFacil = enunciado): PreguntaEscrita {
  return { sub, dificultad, enunciado, enunciadoFacil, correcta, distractores, pista, explicacion };
}

function dibujado(objeto: ObjetoId): { readonly imagen: { readonly tipo: "objeto"; readonly objeto: ObjetoId } } {
  return { imagen: { tipo: "objeto", objeto } };
}

const V = "LEE1-T3-c";
const ENUNCIADO_V = "Lee el texto. ¿Qué frase es verdadera?";
const FACIL_V = "Lee el texto. Una frase es verdad. ¿Cuál?";
const PISTA_V = "Vuelve a leer el texto. Busca cada frase en él.";

// Frases verdaderas según un texto: dificultad 3 de verdadero o falso.
export const TEXTOS_VERDAD: readonly TextoEscrito[] = [
  {
    id: "LEE1-T3-tx1", texto: "{F1} tiene un gato negro. El gato duerme en la cama.", ...dibujado("gato"),
    preguntas: [q(V, 3, ENUNCIADO_V, "El gato es negro.", ["El gato es blanco.", "El gato duerme en la mesa."], PISTA_V, "El texto dice que {F1} tiene un gato negro.", FACIL_V)],
  },
  {
    id: "LEE1-T3-tx2", texto: "{M1} come una pera. Su amigo {M2} come una manzana.", ...dibujado("pera"),
    preguntas: [q(V, 3, ENUNCIADO_V, "{M2} come una manzana.", ["{M1} come una manzana.", "{M2} come una pera."], PISTA_V, "El texto dice que {M2} come una manzana. La pera es de {M1}.", FACIL_V)],
  },
  {
    id: "LEE1-T3-tx3", texto: "Hoy llueve. {F1} sale con su paraguas azul.", ...dibujado("paraguas"),
    preguntas: [q(V, 3, ENUNCIADO_V, "El paraguas es azul.", ["Hoy hace sol.", "El paraguas es rojo."], PISTA_V, "El texto dice que el paraguas de {F1} es azul.", FACIL_V)],
  },
  {
    id: "LEE1-T3-tx4", texto: "El pato nada en el río. La rana está en una piedra.", ...dibujado("pato"),
    preguntas: [q(V, 3, ENUNCIADO_V, "La rana está en una piedra.", ["La rana nada en el río.", "El pato está en una piedra."], PISTA_V, "El texto dice que la rana está en una piedra. El que nada es el pato.", FACIL_V)],
  },
  {
    id: "LEE1-T3-tx5", texto: "{M1} tiene dos libros. Le da uno a {F1}.", ...dibujado("libro"),
    preguntas: [q(V, 3, ENUNCIADO_V, "{F1} recibe un libro.", ["{M1} tiene tres libros.", "{F1} da un libro a {M1}."], PISTA_V, "El texto dice que {M1} le da un libro a {F1}.", FACIL_V)],
  },
];

const QUIEN = "LEE1-T5-a";
const QUE = "LEE1-T5-b";
const DONDE = "LEE1-T5-c";
const P_QUIEN = "Busca en el texto el nombre de quien lo hace.";
const P_QUE = "Vuelve a leer el texto despacio.";
const P_DONDE = "Busca en el texto el lugar.";

export const TEXTOS_CUENTO: readonly TextoEscrito[] = [
  {
    id: "LEE1-T5-tx1", texto: "{F1} va al río con {M1}. {M1} ve un pez.", ...dibujado("pez"),
    preguntas: [
      q(QUIEN, 1, "¿Quién va con {M1}?", "{F1}", ["{F2}", "{F3}"], P_QUIEN, "El texto dice que {F1} va al río con {M1}."),
      q(QUIEN, 2, "¿Quién ve un pez?", "{M1}", ["{F1}", "{F2}"], P_QUIEN, "La segunda frase dice que {M1} ve un pez."),
      q(QUE, 1, "¿Qué ve {M1}?", "Un pez", ["Un gato", "Una vaca"], P_QUE, "El texto dice que {M1} ve un pez."),
      q(DONDE, 1, "¿Adónde van {F1} y {M1}?", "Al río", ["A la casa", "Al mercado"], P_DONDE, "El texto dice que van al río.", "¿Adónde van?"),
    ],
  },
  {
    id: "LEE1-T5-tx2", texto: "{M1} está en el huerto. Una rana salta y {M1} se ríe.", ...dibujado("rana"),
    preguntas: [
      q(QUIEN, 1, "¿Quién está en el huerto?", "{M1}", ["{M2}", "{F1}"], P_QUIEN, "El texto dice que {M1} está en el huerto."),
      q(QUE, 2, "¿Qué hace la rana?", "Salta", ["Se ríe", "Come"], P_QUE, "El texto dice que la rana salta. El que se ríe es {M1}."),
      q(DONDE, 1, "¿Dónde está {M1}?", "En el huerto", ["En el río", "En la escuela"], P_DONDE, "El texto dice que {M1} está en el huerto."),
      q(QUE, 3, "¿Por qué se ríe {M1}?", "Porque la rana salta", ["Porque tiene hambre", "Porque está en la escuela"], "Mira qué pasa justo antes de que se ría.", "{M1} se ríe cuando la rana salta."),
    ],
  },
  {
    id: "LEE1-T5-tx3", texto: "La gata de {F1} sube al árbol. {F1} la llama y la gata baja.", ...dibujado("gato"),
    preguntas: [
      q(QUIEN, 2, "¿Quién sube al árbol?", "La gata", ["{F1}", "Un perro"], P_QUIEN, "El texto dice que la gata sube al árbol. {F1} se queda abajo y la llama."),
      q(QUE, 2, "¿Qué hace la gata al final?", "Baja del árbol", ["Duerme", "Come"], "Lee la última frase.", "Al final, {F1} la llama y la gata baja."),
      q(DONDE, 2, "¿Adónde sube la gata?", "Al árbol", ["A la mesa", "A la cama"], P_DONDE, "El texto dice que la gata sube al árbol."),
      q(DONDE, 3, "¿Dónde está la gata antes de bajar?", "En el árbol", ["Abajo, con {F1}", "En el pozo"], "Lee la primera frase.", "La gata sube al árbol. Después baja.", "La gata baja. ¿Dónde estaba antes?"),
      q(QUIEN, 3, "¿A quién llama {F1}?", "A su gata", ["A {M1}", "A su madre"], "La palabra «la» habla de alguien que ya salió en el texto.", "En «{F1} la llama», la palabra «la» habla de la gata."),
    ],
  },
  {
    id: "LEE1-T5-tx4", texto: "{F1} llena una botella en el pozo. Su hermano {M1} llena otra.", ...dibujado("botella"),
    preguntas: [
      q(QUIEN, 1, "¿Quién llena la botella?", "{F1}", ["{F2}", "{M2}"], P_QUIEN, "El texto dice que {F1} llena una botella."),
      q(QUIEN, 3, "¿Quién es el hermano de {F1}?", "{M1}", ["{M2}", "{M3}"], "Lee la segunda frase. La palabra «su» habla de {F1}.", "El texto dice «su hermano {M1}». Es el hermano de {F1}."),
      q(QUE, 1, "¿Qué llena {F1}?", "Una botella", ["Un vaso", "Una taza"], P_QUE, "El texto dice que {F1} llena una botella."),
      q(DONDE, 2, "¿Dónde llena {F1} la botella?", "En el pozo", ["En la casa", "En la escuela"], P_DONDE, "El texto dice que llena la botella en el pozo."),
    ],
  },
  {
    id: "LEE1-T5-tx5", texto: "El perro de {M1} duerme bajo la mesa. {F1} entra y el perro se despierta.", ...dibujado("perro"),
    preguntas: [
      q(QUIEN, 2, "¿Quién entra?", "{F1}", ["{M1}", "El perro"], P_QUIEN, "El texto dice que {F1} entra."),
      q(QUIEN, 3, "¿De quién es el perro?", "De {M1}", ["De {F1}", "De {M2}"], "Lee las primeras palabras del texto.", "El texto dice «el perro de {M1}»."),
      q(QUE, 2, "¿Qué hace el perro al principio?", "Duerme", ["Come", "Corre"], "Lee la primera frase.", "Al principio, el perro duerme bajo la mesa."),
      q(QUE, 3, "¿Por qué se despierta el perro?", "Porque entra {F1}", ["Porque llueve", "Porque tiene hambre"], "Mira qué pasa justo antes.", "El perro se despierta cuando {F1} entra."),
      q(DONDE, 2, "¿Dónde duerme el perro?", "Bajo la mesa", ["En la cama", "En la puerta"], P_DONDE, "El texto dice que duerme bajo la mesa."),
    ],
  },
  {
    id: "LEE1-T5-tx6", texto: "{F1} sube al autobús con su abuela. Las dos bajan en el mercado.",
    preguntas: [
      q(DONDE, 1, "¿Adónde sube {F1}?", "Al autobús", ["Al árbol", "Al barco"], P_DONDE, "El texto dice que {F1} sube al autobús."),
      q(QUIEN, 2, "¿Quién va con {F1}?", "Su abuela", ["Su maestra", "Su hermano"], P_QUIEN, "El texto dice que {F1} sube al autobús con su abuela."),
      q(QUE, 2, "¿Qué hacen las dos en el mercado?", "Bajan del autobús", ["Suben al autobús", "Duermen"], "Lee la segunda frase.", "La segunda frase dice que las dos bajan en el mercado."),
      q(DONDE, 3, "¿Dónde están las dos al final?", "En el mercado", ["En el autobús", "En la escuela"], "Primero están en un sitio. Después, en otro.", "Primero suben al autobús. Después bajan en el mercado."),
    ],
  },
  {
    id: "LEE1-T5-tx7", texto: "Hoy llueve mucho. {M1} se queda en casa y lee un libro.", ...dibujado("libro"),
    preguntas: [
      q(QUIEN, 1, "¿Quién se queda en casa?", "{M1}", ["{M2}", "{F1}"], P_QUIEN, "El texto dice que {M1} se queda en casa."),
      q(QUE, 1, "¿Qué hace {M1}?", "Lee un libro", ["Juega en el patio", "Va al río"], P_QUE, "El texto dice que {M1} lee un libro."),
      q(QUE, 3, "¿Por qué se queda {M1} en casa?", "Porque llueve mucho", ["Porque tiene sueño", "Porque es de noche"], "Lee la primera frase.", "Hoy llueve mucho, por eso {M1} no sale de casa."),
      q(DONDE, 1, "¿Dónde se queda {M1}?", "En casa", ["En la escuela", "En el río"], P_DONDE, "El texto dice que {M1} se queda en casa."),
    ],
  },
  {
    id: "LEE1-T5-tx8", texto: "En la escuela, {F1} pierde su lápiz. {M1} lo encuentra debajo de la silla.", ...dibujado("lapiz"),
    preguntas: [
      q(QUIEN, 3, "¿Quién encuentra el lápiz?", "{M1}", ["{F1}", "La maestra"], "La palabra «lo» habla del lápiz.", "En «{M1} lo encuentra», la palabra «lo» habla del lápiz."),
      q(QUE, 1, "¿Qué pierde {F1}?", "Su lápiz", ["Su libro", "Su mochila"], P_QUE, "El texto dice que {F1} pierde su lápiz."),
      q(DONDE, 3, "¿Dónde estaba el lápiz?", "Debajo de la silla", ["Encima de la mesa", "En la mochila"], "Lee la segunda frase. «Lo» habla del lápiz.", "{M1} encuentra el lápiz debajo de la silla."),
      q(DONDE, 2, "¿Dónde pierde {F1} su lápiz?", "En la escuela", ["En su casa", "En el río"], P_DONDE, "El texto empieza diciendo «en la escuela»."),
    ],
  },
  {
    id: "LEE1-T5-tx9", texto: "La gallina pone un huevo en la caja. {M1} lo toma con cuidado.", ...dibujado("huevo"),
    preguntas: [
      q(QUIEN, 2, "¿Quién toma el huevo?", "{M1}", ["La gallina", "{F1}"], P_QUIEN, "El texto dice que {M1} lo toma con cuidado."),
      q(QUIEN, 3, "¿Quién pone el huevo?", "La gallina", ["{M1}", "El pato"], "Lee la primera frase.", "El texto dice que la gallina pone un huevo."),
      q(QUE, 3, "¿Qué toma {M1} con cuidado?", "El huevo", ["La gallina", "La caja"], "La palabra «lo» habla de algo que ya salió en el texto.", "En «{M1} lo toma», la palabra «lo» habla del huevo."),
      q(DONDE, 3, "¿Dónde está el huevo antes de que {M1} lo tome?", "En la caja", ["En la mano de {M1}", "En el árbol"], "Lee la primera frase.", "La gallina pone el huevo en la caja.", "¿Dónde pone el huevo la gallina?"),
    ],
  },
];
