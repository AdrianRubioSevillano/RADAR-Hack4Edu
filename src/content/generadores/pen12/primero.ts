// Rutinas y seguridad de 1.º: PEN1-T4 y PEN1-T5. Frases muy cortas: niños de 6 y 7 años.
import { elegir, muestra, pregunta } from "../../ayuda.ts";
import type { Dificultad, Generador, ObjetoId } from "../../tipos.ts";
import type { Rng } from "../../../core/rng.ts";
import { objeto, porDificultad, situaciones, type Fila } from "./comun.ts";

// ---------- PEN1-T4-a: orden de las acciones ----------
const SUB_ORDEN = "PEN1-T4-a";

interface Rutina {
  readonly clave: string;
  readonly meta: string;
  readonly dibujo: ObjetoId;
  readonly pasos: readonly string[]; // cada paso necesita el anterior
}

const RUTINAS: readonly Rutina[] = [
  { clave: "leer", meta: "Vas a leer un cuento.", dibujo: "libro", pasos: ["Tomas el libro", "Abres el libro", "Lees el cuento", "Cierras el libro"] },
  { clave: "manos", meta: "Vas a lavarte las manos.", dibujo: "jabon", pasos: ["Te mojas las manos", "Te frotas con jabón", "Te enjuagas con agua", "Te secas las manos"] },
  { clave: "plantar", meta: "Vas a plantar una semilla.", dibujo: "flor", pasos: ["Haces un hoyo en la tierra", "Pones la semilla en el hoyo", "Tapas la semilla con tierra"] },
  { clave: "zapatos", meta: "Vas a salir a caminar.", dibujo: "zapato", pasos: ["Te pones los zapatos", "Te atas los cordones", "Sales a caminar"] },
  { clave: "dormir", meta: "Es de noche y vas a dormir.", dibujo: "cama", pasos: ["Te acuestas en la cama", "Te duermes", "Te despiertas por la mañana"] },
  { clave: "beber", meta: "Tienes sed y vas a beber agua.", dibujo: "vaso", pasos: ["Tomas un vaso limpio", "Llenas el vaso de agua", "Bebes el agua"] },
  { clave: "dibujar", meta: "Vas a dibujar en tu cuaderno.", dibujo: "cuaderno", pasos: ["Abres el cuaderno", "Dibujas una flor", "Cierras el cuaderno", "Guardas el cuaderno en la mochila"] },
  { clave: "barrer", meta: "Vas a barrer la casa.", dibujo: "casa", pasos: ["Tomas la escoba", "Barres el suelo", "Recoges la basura", "Tiras la basura al basurero"] },
  { clave: "escuela", meta: "Es de día y vas a la escuela.", dibujo: "mochila", pasos: ["Te despiertas", "Te vistes", "Sales de casa", "Llegas a la escuela"] },
  { clave: "comer", meta: "Vas a comer.", dibujo: "mesa", pasos: ["Te lavas las manos", "Comes la comida", "Recoges tu plato"] },
  { clave: "puerta", meta: "Vas a abrir una puerta con llave.", dibujo: "llave", pasos: ["Sacas la llave", "Metes la llave en la cerradura", "Giras la llave", "Abres la puerta"] },
  { clave: "regar", meta: "Vas a regar una planta.", dibujo: "botella", pasos: ["Llenas la botella de agua", "Vas hasta la planta", "Echas el agua en la tierra"] },
  { clave: "nombre", meta: "Vas a escribir tu nombre.", dibujo: "lapiz", pasos: ["Tomas el lápiz", "Escribes tu nombre", "Guardas el lápiz"] },
];

function minuscula(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

function ordenEnFrase(pasos: readonly string[]): string {
  const [primero, ...resto] = pasos;
  return [primero ?? "", ...resto.map(minuscula)].join(", ");
}

function preguntaRutina(rng: Rng, dificultad: Dificultad, r: Rutina, pedido: string, pedidoFacil: string, correcta: string, distractores: readonly string[], pista: string): ReturnType<Generador> {
  return pregunta(rng, {
    subhabilidad: SUB_ORDEN,
    dificultad,
    enunciado: `${r.meta} ${pedido}`,
    enunciadoFacil: `${r.meta} ${pedidoFacil}`,
    imagen: objeto(r.dibujo),
    respuesta: { tipo: "opcion", correcta, distractores },
    pista,
    explicacion: `El orden es: ${minuscula(ordenEnFrase(r.pasos))}.`,
    plantilla: `${SUB_ORDEN}#${r.clave}#${dificultad}`,
  });
}

// Fácil: el primer paso o el último.
const primeroOUltimo: Generador = (rng, dificultad) => {
  const r = elegir(rng, RUTINAS);
  const primero = rng() < 0.6;
  const correcta = (primero ? r.pasos[0] : r.pasos[r.pasos.length - 1]) as string;
  const otros = r.pasos.filter((p) => p !== correcta);
  return primero
    ? preguntaRutina(rng, dificultad, r, "¿Qué haces primero?", "¿Qué va primero?", correcta, muestra(rng, otros, Math.min(3, otros.length)), "Piensa cómo empieza todo.")
    : preguntaRutina(rng, dificultad, r, "¿Qué haces al final?", "¿Qué va al final?", correcta, muestra(rng, otros, Math.min(3, otros.length)), "Piensa cómo termina todo.");
};

// Media: el paso justo después de otro. Los pasos anteriores son el error típico.
const justoDespues: Generador = (rng, dificultad) => {
  const r = elegir(rng, RUTINAS);
  const i = Math.floor(rng() * (r.pasos.length - 1));
  const paso = r.pasos[i] as string;
  const correcta = r.pasos[i + 1] as string;
  const otros = r.pasos.filter((p) => p !== correcta && p !== paso);
  const distractores = otros.length >= 2 ? otros : [...otros, paso];
  return preguntaRutina(rng, dificultad, r, `Ya has hecho esto: «${minuscula(paso)}». ¿Qué haces justo después?`, `Ya: «${minuscula(paso)}». ¿Qué va después?`, correcta, distractores, "Piensa en lo que ya has hecho y en lo que falta.");
};

// Difícil: el paso justo antes, o el orden de tres pasos.
const justoAntes: Generador = (rng, dificultad) => {
  const r = elegir(rng, RUTINAS);
  const i = 1 + Math.floor(rng() * (r.pasos.length - 1));
  const paso = r.pasos[i] as string;
  const correcta = r.pasos[i - 1] as string;
  const otros = r.pasos.filter((p) => p !== correcta && p !== paso);
  const distractores = otros.length >= 2 ? otros : [...otros, paso];
  return preguntaRutina(rng, dificultad, r, `¿Qué haces justo antes de esto: «${minuscula(paso)}»?`, `Antes de «${minuscula(paso)}», ¿qué va?`, correcta, distractores, "Piensa qué tiene que estar hecho ya.");
};

const ordenDeTres: Generador = (rng, dificultad) => {
  const r = elegir(rng, RUTINAS);
  const inicio = Math.floor(rng() * (r.pasos.length - 2));
  const [a, b, c] = r.pasos.slice(inicio, inicio + 3) as [string, string, string];
  return preguntaRutina(
    rng, dificultad, r,
    "¿Cuál es el orden correcto?", "¿Qué orden es bueno?",
    ordenEnFrase([a, b, c]),
    [ordenEnFrase([c, b, a]), ordenEnFrase([b, a, c]), ordenEnFrase([a, c, b])],
    "Lee cada opción y piensa si se puede hacer de verdad así.",
  );
};

const ordenAcciones = porDificultad({
  1: [primeroOUltimo],
  2: [justoDespues],
  3: [justoAntes, ordenDeTres],
});

// ---------- PEN1-T4-b: lavarse las manos (cuándo) ----------
const MANOS: readonly Fila[] = [
  [1, "Vas a comer. ¿Qué haces antes?", "Vas a comer. ¿Qué haces antes?", "Lavarme las manos", ["Jugar con la tierra", "Tocar al perro"], "Piensa en lo que llega a tu boca.", "Antes de comer hay que lavarse las manos. Así la suciedad no llega a la boca.", objeto("jabon")],
  [1, "Acabas de usar el baño. ¿Qué haces ahora?", "Sales del baño. ¿Qué haces?", "Lavarme las manos", ["Tomar una fruta y comerla", "Tocarme la boca"], "Piensa en lo que tocan tus manos en el baño.", "Después de usar el baño hay que lavarse las manos con jabón.", objeto("jabon")],
  [1, "Tus manos tienen tierra. ¿Qué haces?", "Tienes tierra en las manos. ¿Qué haces?", "Lavarlas con agua y jabón", ["Limpiarlas en la ropa que llevo puesta", "Chuparme los dedos"], "La tierra no se va sola.", "Las manos sucias se lavan con agua y jabón.", objeto("mano")],
  [1, "¿Qué momento es bueno para lavarse las manos?", "¿Cuándo te lavas las manos?", "Antes de comer", ["Mientras duermes", "Mientras miras las nubes"], "Piensa en un momento en que usas las manos para algo importante.", "Antes de comer hay que lavarse las manos.", objeto("mano")],
  [1, "Has acariciado a un animal. ¿Qué haces después?", "Tocas a un animal. ¿Qué haces luego?", "Lavarme las manos", ["Chuparme los dedos", "Frotarme los ojos"], "Los animales pueden tener suciedad en el pelo.", "Después de tocar a un animal hay que lavarse las manos.", objeto("perro")],
  [1, "¿Cuándo tienes que lavarte las manos?", "¿Cuándo te lavas las manos?", "Cuando están sucias", ["Cuando tengo mucho sueño", "Cuando hace sol"], "Piensa para qué sirve lavarse.", "Las manos se lavan cuando están sucias, para quitar la suciedad.", objeto("jabon")],

  [2, "¿En cuál de estos momentos debes lavarte las manos?", "¿Cuándo debes lavarte las manos?", "Después de dar de comer a las gallinas", ["Mientras escuchas un cuento de la maestra", "Mientras miras por la ventana"], "Busca el momento en que tus manos tocan algo sucio.", "Al dar de comer a los animales las manos se ensucian. Hay que lavarlas después.", objeto("mano")],
  [2, "{F1} ha estornudado y se ha tapado con la mano. ¿Qué debe hacer ahora?", "{F1} estornuda en su mano. ¿Qué hace ahora?", "Lavarse las manos", ["Darle la mano a una amiga", "Comer una fruta"], "Al estornudar salen microbios.", "Al estornudar, los microbios quedan en la mano. Por eso {F1} debe lavársela.", objeto("mano")],
  [2, "{M1} va a ayudar a preparar la comida. ¿Qué debe hacer primero?", "{M1} ayuda con la comida. ¿Qué hace primero?", "Lavarse las manos", ["Tocar la comida", "Probar la comida"], "La comida debe estar limpia.", "Antes de tocar la comida hay que lavarse las manos.", objeto("jabon")],
  [2, "{F1} ha sacado la basura y ahora quiere comer una fruta. ¿Qué hace antes de comer?", "{F1} saca la basura. Luego quiere una fruta. ¿Qué hace antes?", "Lavarse las manos", ["Secarse las manos en la ropa", "Sentarse a comer"], "Piensa en lo que tocó {F1}.", "La basura ensucia las manos. {F1} debe lavarlas antes de comer.", objeto("manzana")],
  [2, "{M1} ha jugado con tierra y tiene hambre. Ve una fruta en la mesa. ¿Qué debe hacer antes de comerla?", "{M1} juega con tierra. Tiene hambre. ¿Qué hace antes de comer?", "Lavarse las manos", ["Comer rápido", "Limpiarse en el pantalón"], "Mira cómo están las manos de {M1}.", "{M1} tiene tierra en las manos. Debe lavarlas antes de comer.", objeto("manzana")],
  [2, "Suena la hora de comer en la escuela. {F1} viene de jugar con la pelota. ¿Qué hace primero?", "Es hora de comer. {F1} viene de jugar. ¿Qué hace primero?", "Lavarse las manos", ["Sentarse y empezar a comer", "Seguir jugando con la pelota"], "La pelota ha estado en el suelo.", "La pelota ensucia las manos. Antes de comer, {F1} debe lavarlas.", objeto("pelota")],

  [3, "Tus manos parecen limpias, pero vas a comer. ¿Qué haces?", "Tus manos parecen limpias. Vas a comer. ¿Qué haces?", "Lavarlas, porque hay microbios que no se ven", ["No lavarlas, porque no veo nada de suciedad en ellas", "Lavarlas solo si alguien me mira"], "No todo lo que ensucia se puede ver.", "Los microbios no se ven. Por eso hay que lavarse las manos aunque parezcan limpias.", objeto("lupa")],
  [3, "{F1} se lava las manos antes de comer. {M1} no se las lava. ¿Quién lo hace bien?", "{F1} se lava las manos antes de comer. {M1} no. ¿Quién lo hace bien?", "{F1}", ["{M1}", "Ninguno de los dos"], "Piensa en lo que hay que hacer antes de comer.", "Antes de comer hay que lavarse las manos, y eso es lo que hace {F1}.", objeto("jabon")],
  [3, "¿Por qué hay que lavarse las manos antes de comer?", "¿Por qué te lavas las manos antes de comer?", "Para no llevar microbios a la boca", ["Para que la comida sepa mucho mejor", "Para tener las manos frías"], "Piensa en lo que puede hacerte enfermar.", "Con las manos sucias, los microbios llegan a la boca y pueden enfermarte.", objeto("mano")],
  [3, "¿Después de qué cosa no hace falta lavarse las manos?", "¿Cuándo no hace falta lavarse las manos?", "Después de mirar un dibujo en la pared", ["Después de usar el baño", "Después de tocar la basura de la escuela"], "Busca lo que no ensucia las manos.", "Mirar un dibujo no ensucia las manos. El baño y la basura sí.", objeto("mano")],
  [3, "{M1} juega en la tierra y luego va a comer. ¿Qué orden es el bueno?", "{M1} juega y luego come. ¿Qué orden es bueno?", "Jugar, lavarse las manos y comer", ["Jugar, comer y lavarse las manos", "Lavarse las manos, comer y jugar con la comida"], "¿Cuándo tienen que estar limpias las manos?", "Las manos deben estar limpias justo antes de comer. Por eso el lavado va entre jugar y comer.", objeto("jabon")],
  [3, "{F1} se moja las manos muy rápido, sin jabón. ¿Qué debería hacer?", "{F1} se moja las manos rápido. No usa jabón. ¿Qué debe hacer?", "Usar jabón y frotar bien", ["Lavarse menos veces cada día", "Secarse en la ropa"], "Solo con agua no se va toda la suciedad.", "El jabón y el frotado quitan la suciedad y los microbios mejor que el agua sola.", objeto("jabon")],
];

// ---------- PEN1-T5-a: elegir la opción segura ----------
const SEGURA: readonly Fila[] = [
  [1, "Quieres cruzar la calle. ¿Qué es lo seguro?", "Vas a cruzar la calle. ¿Qué haces?", "Mirar a los dos lados", ["Cruzar corriendo sin mirar nada", "Cruzar mirando siempre al suelo"], "Piensa en lo que puede venir por la calle.", "Hay que mirar a los dos lados para ver si viene algo."],
  [1, "Encuentras unos fósforos en el suelo. ¿Qué es lo seguro?", "Ves unos fósforos. ¿Qué haces?", "No tocarlos y avisar", ["Encenderlos para ver el fuego", "Guardarlos en la mochila"], "Los fósforos hacen fuego.", "Los fósforos pueden quemar. No se tocan, y hay que avisar a un adulto."],
  [1, "Ves un cuchillo en la mesa. ¿Qué es lo seguro?", "Ves un cuchillo. ¿Qué haces?", "Dejarlo donde está", ["Jugar con el cuchillo", "Correr con el cuchillo en la mano"], "Un cuchillo corta.", "Un cuchillo puede cortarte. No es un juguete.", objeto("mesa")],
  [1, "Hay un pozo sin tapa. ¿Qué es lo seguro?", "Hay un pozo abierto. ¿Qué haces?", "Alejarme y avisar a un adulto", ["Asomarme para ver el fondo", "Jugar en el borde del pozo"], "Piensa en lo que pasaría si resbalas.", "Te puedes caer en un pozo abierto. Hay que alejarse y avisar."],
  [1, "Hay una olla caliente en el fuego. ¿Qué es lo seguro?", "La olla está caliente. ¿Qué haces?", "No tocarla", ["Tocarla con un dedo", "Mirar dentro con la cara muy cerca"], "El fuego calienta mucho la olla.", "Una olla caliente quema. No se toca."],
  [1, "Ves un enchufe en la pared. ¿Qué es lo seguro?", "Ves un enchufe. ¿Qué haces?", "No meter nada dentro", ["Meter un dedo para probar", "Meter una llave en los agujeros"], "Por el enchufe pasa la electricidad.", "La electricidad es peligrosa. En un enchufe no se mete nada."],

  [2, "Una persona que no conoces te ofrece dulces y te pide que te vayas con ella. ¿Qué es lo seguro?", "Alguien que no conoces te da dulces. Te pide ir con esa persona. ¿Qué haces?", "Decir que no y buscar a un adulto de confianza", ["Irme con esa persona un rato", "Tomar los dulces y quedarme a su lado"], "Piensa si conoces a esa persona.", "Nunca te vayas con alguien que no conoces. Di que no y busca a un adulto de confianza."],
  [2, "Ves un cable caído en el suelo. ¿Qué es lo seguro?", "Hay un cable en el suelo. ¿Qué haces?", "No tocarlo y avisar a un adulto", ["Apartarlo con la mano", "Saltar encima del cable"], "Un cable puede tener electricidad.", "Un cable caído puede dar una descarga. No se toca, y hay que avisar a un adulto."],
  [2, "Un perro que no conoces te enseña los dientes. ¿Qué es lo seguro?", "Un perro te enseña los dientes. ¿Qué haces?", "Alejarme despacio", ["Acariciarle la cabeza", "Tirarle una piedra"], "Ese perro está avisando de que no quiere que te acerques.", "Un perro que enseña los dientes puede morder. Hay que alejarse despacio.", objeto("perro")],
  [2, "En casa ves una botella sin etiqueta con un líquido. ¿Qué es lo seguro?", "Ves una botella sin nombre. ¿Qué haces?", "No beber y preguntar a un adulto", ["Beber un poco para probar", "Oler el líquido muy de cerca"], "No sabes qué hay dentro.", "Dentro puede haber algo que hace daño. No se bebe, y hay que preguntar a un adulto.", objeto("botella")],
  [2, "Ha llovido mucho y el río baja con mucha agua. ¿Qué es lo seguro?", "El río tiene mucha agua. ¿Qué haces?", "Quedarme lejos de la orilla", ["Jugar en la orilla del río", "Meter los pies para ver si cubre"], "El agua fuerte puede arrastrarte.", "Un río con mucha agua puede arrastrarte. Hay que quedarse lejos."],
  [2, "Encuentras unas pastillas de colores. Parecen dulces. ¿Qué es lo seguro?", "Ves pastillas de colores. ¿Qué haces?", "No tocarlas y avisar a un adulto", ["Probar una para saber a qué sabe", "Dárselas a mi hermano pequeño"], "Las pastillas son medicinas, no dulces.", "Las medicinas pueden hacer daño si no te las da un adulto. Hay que avisar."],

  [3, "{F1} espera y mira a los dos lados antes de cruzar. {M1} cruza corriendo detrás de su pelota. ¿Quién lo hace de forma segura?", "{F1} mira antes de cruzar. {M1} corre sin mirar. ¿Quién lo hace bien?", "{F1}", ["{M1}", "Los dos"], "Piensa quién puede ver si viene algo.", "{F1} mira antes de cruzar. {M1} no mira, y algo puede atropellarlo.", objeto("pelota")],
  [3, "Tu pelota cae a la calle y viene un autobús. ¿Qué es lo seguro?", "Tu pelota cae a la calle. Viene un autobús. ¿Qué haces?", "Esperar y pedir ayuda a un adulto", ["Correr deprisa a buscar la pelota", "Cruzar antes de que llegue el autobús"], "¿Qué vale más: tú o la pelota?", "Una pelota se puede recuperar después. Hay que esperar y pedir ayuda a un adulto.", objeto("pelota")],
  [3, "Sale humo de una habitación. ¿Qué es lo seguro?", "Sale humo de un cuarto. ¿Qué haces?", "Salir y avisar a un adulto", ["Entrar a ver qué pasa", "Esconderme debajo de la cama"], "El humo y el fuego son peligrosos.", "Con humo hay que salir y avisar. Esconderse es peligroso, porque nadie te encuentra."],
  [3, "Hay rayos y truenos mientras juegas fuera. ¿Qué es lo seguro?", "Hay rayos y estás fuera. ¿Qué haces?", "Entrar en una casa", ["Ponerme bajo el árbol más alto", "Seguir jugando en el campo"], "Los rayos suelen caer en lo más alto.", "Los rayos pueden caer en los árboles altos. Lo seguro es entrar en una casa.", objeto("casa")],
  [3, "Ves una fruta en el campo que no conoces. Parece rica. ¿Qué es lo seguro?", "Ves una fruta que no conoces. ¿Qué haces?", "Preguntar antes a un adulto", ["Comerla para saber a qué sabe", "Darle un mordisco pequeño"], "Algunas plantas son venenosas.", "Hay frutas que hacen daño. Si no la conoces, no te la comas sin preguntar."],
  [3, "Unos amigos te retan a saltar desde un muro muy alto. ¿Qué es lo seguro?", "Tus amigos dicen: salta del muro alto. ¿Qué haces?", "Decir que no y bajar por otro sitio", ["Saltar para que no se rían", "Saltar con los ojos cerrados"], "Piensa en lo que puede pasar al caer.", "Saltar de un muro alto puede hacerte mucho daño. Puedes decir que no, aunque te reten."],
];

// ---------- PEN1-T5-b: pedir ayuda a un adulto ----------
const AYUDA: readonly Fila[] = [
  [1, "Te has caído y te sangra la rodilla. ¿Qué haces?", "Te sangra la rodilla. ¿Qué haces?", "Decírselo a un adulto", ["Esconder la herida", "Seguir jugando y callarme"], "Una herida hay que curarla.", "Un adulto puede limpiar y curar la herida."],
  [1, "Ves mucho humo en la cocina. ¿Qué haces?", "Hay humo en la cocina. ¿Qué haces?", "Llamar a un adulto", ["Quedarme a mirar el humo", "Esconderme debajo de la mesa"], "Esto no se arregla sin un adulto.", "El humo puede ser fuego. Hay que llamar enseguida a un adulto."],
  [1, "Un compañero se ha caído y no se levanta. ¿Qué haces?", "Un niño se cae. No se levanta. ¿Qué haces?", "Avisar a la maestra", ["Reírme de él", "Irme a jugar a otro sitio"], "Tu compañero necesita ayuda.", "La maestra sabe qué hacer. Por eso hay que avisarla."],
  [1, "Te duele mucho la barriga. ¿Qué haces?", "Te duele mucho la barriga. ¿Qué haces?", "Decírselo a un adulto", ["Tomar una medicina sin preguntar", "No decir nada a nadie"], "Quien te cuida debe saberlo.", "Un adulto puede ayudarte. Las medicinas solo te las da un adulto."],
  [1, "En la escuela necesitas ayuda. ¿A quién se la pides?", "Necesitas ayuda en la escuela. ¿A quién la pides?", "A la maestra", ["A un bebé que está dormido", "A un gato de la calle"], "Busca a una persona mayor que te cuida.", "La maestra es un adulto de confianza que puede ayudarte."],
  [1, "Un niño mayor te quita la mochila. ¿Qué haces?", "Un niño mayor te quita la mochila. ¿Qué haces?", "Contárselo a la maestra", ["Callarme y no decir nada", "Pegarle con un palo"], "Hay personas mayores que pueden ayudarte.", "La maestra puede ayudarte a recuperarla. Pegar no arregla nada.", objeto("mochila")],

  [2, "Te has perdido en el mercado. ¿Qué haces?", "Te pierdes en el mercado. ¿Qué haces?", "Pedir ayuda a alguien que trabaja en un puesto", ["Salir del mercado y volver a casa sin decir nada a nadie", "Irme con quien me ofrezca dulces"], "Quédate cerca. No te vayas lejos.", "Quien trabaja en un puesto puede ayudarte a encontrar a tu familia."],
  [2, "Un adulto que no conoces te pide que le ayudes a buscar a su perro lejos de aquí. ¿Qué haces?", "Alguien que no conoces te pide ir lejos. ¿Qué haces?", "Decir que no y contárselo a un adulto de confianza", ["Irme a buscar el perro con esa persona que no conozco", "Ir y no decírselo a nadie"], "Los adultos piden ayuda a otros adultos.", "No te vayas con desconocidos. Di que no y cuéntaselo a un adulto de confianza.", objeto("perro")],
  [2, "Alguien te toca y a ti no te gusta. ¿Qué haces?", "Alguien te toca. No te gusta. ¿Qué haces?", "Decir que no y contárselo a un adulto de confianza", ["Guardar el secreto para siempre y no contarlo a nadie", "Pensar que tengo yo la culpa"], "Tu cuerpo es tuyo.", "Tu cuerpo es tuyo y puedes decir que no. Un adulto de confianza te ayudará."],
  [2, "Un compañero te insulta todos los días. ¿Qué haces?", "Un niño te insulta cada día. ¿Qué haces?", "Contárselo a la maestra o a mi familia", ["Insultarle yo más fuerte", "Callarme siempre, aunque me sienta muy mal"], "No tienes que aguantarlo sin ayuda.", "Si alguien te trata mal cada día, cuéntalo. Un adulto puede pararlo."],
  [2, "{F1} tiene mucho calor y le duele la cabeza en clase. ¿Qué debe hacer?", "{F1} se siente mal en clase. ¿Qué hace?", "Avisar a la maestra", ["Salir sola a la calle", "Callarse hasta la noche"], "Puede estar enferma.", "Si te sientes mal, hay que avisar. La maestra sabrá ayudar a {F1}."],
  [2, "Se ha roto un vaso y hay cristales en el suelo. ¿Qué haces?", "Hay cristales en el suelo. ¿Qué haces?", "Avisar a un adulto", ["Recogerlos con las manos", "Andar por encima descalzo"], "Los cristales cortan.", "Los cristales rotos cortan. Hay que avisar a un adulto y no tocarlos.", objeto("vaso")],

  [3, "¿Quién es un adulto de confianza?", "¿Quién es un adulto de confianza?", "Una persona mayor que conoces y que te cuida", ["Una persona que te da dulces en la calle", "Cualquier persona que sepa cómo te llamas y dónde vives"], "Piensa en quién te cuida cada día.", "Un adulto de confianza te conoce y te cuida, como tu familia o tu maestra."],
  [3, "Un adulto te dice que guardes un secreto que te hace sentir mal. ¿Qué haces?", "Un adulto te pide guardar un secreto. Te sientes mal. ¿Qué haces?", "Contárselo a un adulto de confianza", ["Guardarlo porque es un adulto", "Olvidarlo y no decir nada nunca a nadie"], "Un secreto que hace daño no hay que guardarlo.", "Los secretos que te hacen sentir mal se cuentan a un adulto de confianza."],
  [3, "Tu hermano pequeño ha tomado pastillas de un frasco. ¿Qué haces?", "Tu hermano toma pastillas. ¿Qué haces?", "Avisar enseguida a un adulto", ["Esperar a ver si se pone mal", "Darle agua y no decir nada"], "No hay que perder tiempo.", "Las pastillas pueden hacerle mucho daño. Hay que avisar a un adulto enseguida."],
  [3, "Pides ayuda a un adulto, pero no te escucha. ¿Qué haces?", "Pides ayuda. No te escuchan. ¿Qué haces?", "Buscar a otro adulto de confianza", ["Dejar de pedir ayuda a todo el mundo", "Arreglarlo a golpes"], "Hay más personas que pueden ayudarte.", "Si un adulto no te escucha, busca a otro hasta que alguien te ayude."],
  [3, "Ves a un niño pequeño solo y llorando en la calle. ¿Qué haces?", "Un niño pequeño llora solo. ¿Qué haces?", "Avisar a un adulto de confianza", ["Llevármelo a mi casa sin decir nada a nadie", "Decirle que deje de llorar"], "Esto debe resolverlo una persona mayor.", "Un adulto puede ayudar al niño a encontrar a su familia."],
  [3, "Cuando pides ayuda a un adulto, ¿qué le dices?", "Pides ayuda. ¿Qué dices?", "Qué ha pasado y dónde", ["Solo que tengo hambre", "Un chiste para que se ría"], "El adulto necesita saber lo que pasa.", "Si dices qué ha pasado y dónde, el adulto puede ayudar más rápido."],
];

export const GENERADORES_PRIMERO = {
  "PEN1-T4-a": [ordenAcciones],
  "PEN1-T4-b": [situaciones("PEN1-T4-b", MANOS)],
  "PEN1-T5-a": [situaciones("PEN1-T5-a", SEGURA)],
  "PEN1-T5-b": [situaciones("PEN1-T5-b", AYUDA)],
} as const;
