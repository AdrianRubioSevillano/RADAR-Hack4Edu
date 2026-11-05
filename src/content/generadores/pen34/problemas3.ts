// PEN3-T2 · Resolver problemas cotidianos.
import type { Rng } from "../../../core/rng.ts";
import { elegir, entero, monedas, nombre } from "../../ayuda.ts";
import { generadorDeSituaciones } from "../../plantillas.ts";
import type { Generador } from "../../tipos.ts";
import { generadorDePlantillas, situaciones, type Contenido, type Plantilla } from "./comun.ts";

// ---------- Entender el problema ----------
const ENTENDER = situaciones("PEN3-T2-a", [
  { d: 1, e: "{F1} tiene 8 lápices y le regala 3 a {M1}. ¿Cuántos lápices le quedan a {F1}? ¿Qué te pide el problema?", f: "{F1} tiene 8 lápices. Regala 3. ¿Cuántos le quedan? ¿Qué te pide el problema?", c: "Saber cuántos lápices le quedan a {F1}", x: ["Saber cuántos lápices tenía {M1}", "Saber de qué color son los lápices", "Saber cuánto cuestan los lápices"], p: "Busca la frase que termina con el signo de interrogación.", ex: "La pregunta del problema es cuántos lápices le quedan a {F1}." },
  { d: 1, e: "En el huerto hay 4 filas de plantas. En cada fila hay 6 plantas. ¿Cuántas plantas hay en total? ¿Qué te pide el problema?", f: "Hay 4 filas. Cada fila tiene 6 plantas. ¿Cuántas plantas hay en total? ¿Qué te pide el problema?", c: "El total de plantas del huerto", x: ["El número de filas del huerto", "Las plantas que hay en una fila", "El agua que necesita cada planta"], p: "Fíjate en la pregunta, no en los datos que ya te dan.", ex: "El problema ya dice las filas y las plantas de cada fila. Lo que pregunta es el total." },
  { d: 1, e: "El autobús lleva 20 personas. En la parada bajan 5. ¿Cuántas personas siguen en el autobús? ¿Qué dato te da el problema?", f: "El autobús lleva 20 personas. Bajan 5. ¿Cuántas siguen? ¿Qué dato te da el problema?", c: "Bajan 5 personas en la parada", x: ["Siguen 15 personas en el autobús", "Suben 5 personas en la parada", "El autobús tarda 20 minutos"], p: "Un dato es algo que el problema ya te cuenta.", ex: "El problema cuenta que bajan 5 personas. Las que siguen hay que calcularlas." },
  { d: 1, e: "{M1} lleva 2 cubos de agua por la mañana y 3 por la tarde. ¿Cuántos cubos lleva en el día? ¿Qué dato te da el problema?", f: "{M1} lleva 2 cubos por la mañana. Lleva 3 por la tarde. ¿Cuántos lleva en el día? ¿Qué dato te da el problema?", c: "Por la tarde lleva 3 cubos", x: ["Por la noche lleva 2 cubos", "En el día lleva 5 cubos", "Cada cubo pesa 3 kilos"], p: "Vuelve a leer y busca lo que está escrito en el problema.", ex: "El problema dice que por la tarde lleva 3 cubos. El total hay que calcularlo." },
  { d: 1, e: "{F1} ha leído 12 páginas y el libro tiene 30. ¿Cuántas páginas le faltan? ¿Qué tienes que averiguar?", f: "El libro tiene 30 páginas. {F1} ha leído 12. ¿Qué tienes que averiguar?", c: "Las páginas que le faltan por leer", x: ["Las páginas que tiene el libro", "Las páginas que ya ha leído", "El título del libro"], p: "Los datos ya los sabes. Busca lo que no sabes.", ex: "Ya sabes que el libro tiene 30 páginas y que ha leído 12. Falta saber cuántas le quedan." },
  { d: 2, e: "{F1} compra 2 cuadernos por 6 monedas cada uno. Su hermano tiene 9 años. ¿Cuánto paga {F1}? ¿Qué dato sobra?", f: "{F1} compra 2 cuadernos. Cada uno cuesta 6 monedas. Su hermano tiene 9 años. ¿Cuánto paga? ¿Qué dato sobra?", c: "La edad de su hermano", x: ["El número de cuadernos", "El precio de cada cuaderno"], p: "Piensa qué números usarías para calcular. El que no uses, sobra.", ex: "Para saber lo que paga solo necesitas los cuadernos y su precio. La edad no hace falta." },
  { d: 2, e: "En la clase hay 25 sillas y 5 mesas. Faltan 3 alumnos hoy, y la clase tiene 22 alumnos. ¿Cuántos alumnos han venido hoy? ¿Qué dato sobra?", f: "Hay 25 sillas y 5 mesas. La clase tiene 22 alumnos. Faltan 3. ¿Cuántos han venido? ¿Qué dato sobra?", c: "El número de sillas y de mesas", x: ["Los alumnos que tiene la clase", "Los alumnos que faltan hoy"], p: "¿De qué habla la pregunta: de muebles o de alumnos?", ex: "Basta con restar 22 menos 3. Las sillas y las mesas no hacen falta." },
  { d: 2, e: "El pozo está a 300 metros de la casa de {M1}. {M1} hace 2 viajes por la mañana y 3 por la tarde. ¿Cuántos viajes hace en el día? ¿Qué dato sobra?", f: "El pozo está a 300 metros. {M1} hace 2 viajes por la mañana. Hace 3 por la tarde. ¿Cuántos viajes hace? ¿Qué dato sobra?", c: "La distancia hasta el pozo", x: ["Los viajes de la mañana", "Los viajes de la tarde"], p: "Pregunta por los viajes. ¿Qué datos hablan de viajes?", ex: "Solo hay que sumar los viajes: 2 más 3. Los metros no se usan." },
  { d: 2, e: "{F1} tenía 15 monedas. Gastó 4 en el mercado, que abre a las 8. ¿Cuántas monedas le quedan? ¿Qué dato no hace falta?", f: "{F1} tenía 15 monedas. Gastó 4. El mercado abre a las 8. ¿Cuántas le quedan? ¿Qué dato no hace falta?", c: "La hora a la que abre el mercado", x: ["Las monedas que tenía", "Las monedas que gastó"], p: "Mira qué números necesitas para restar.", ex: "Hay que restar 15 menos 4. La hora del mercado no hace falta." },
  { d: 2, e: "El tren sale a las 9 y lleva 6 vagones. En cada vagón van 10 personas. ¿Cuántas personas van en el tren? ¿Qué dato no hace falta?", f: "El tren sale a las 9. Lleva 6 vagones. En cada vagón van 10 personas. ¿Cuántas personas van? ¿Qué dato no hace falta?", c: "La hora de salida del tren", x: ["El número de vagones", "Las personas de cada vagón"], p: "Para calcular personas, ¿qué dos números necesitas?", ex: "Se multiplica 6 por 10. La hora de salida no se usa." },
  { d: 2, e: "{M1} quiere saber cuántos huevos tiene en total. Tiene 3 cajas. ¿Qué dato le falta?", f: "{M1} tiene 3 cajas de huevos. Quiere saber el total. ¿Qué dato le falta?", c: "Cuántos huevos hay en cada caja", x: ["Cuántas cajas tiene", "De qué color son las cajas", "Cuándo compró las cajas"], p: "Imagina que haces la cuenta. ¿Qué número no tienes?", ex: "Sabe que hay 3 cajas, pero sin saber los huevos de cada caja no puede calcular." },
  { d: 3, e: "{F1} compra 3 cuadernos iguales y paga con 20 monedas. ¿Cuánto le devuelven? ¿Qué dato falta para resolverlo?", f: "{F1} compra 3 cuadernos iguales. Paga con 20 monedas. ¿Cuánto le devuelven? ¿Qué dato falta?", c: "El precio de cada cuaderno", x: ["El número de cuadernos", "Con cuánto paga", "El nombre de la tienda"], p: "Haz la cuenta en tu cabeza. ¿Dónde te quedas sin número?", ex: "Para saber la vuelta hay que saber lo que cuestan los cuadernos, y ese dato no aparece." },
  { d: 3, e: "{M1} sale de casa a las 8 para ir a la escuela. ¿A qué hora llega? ¿Qué dato falta para resolverlo?", f: "{M1} sale de casa a las 8. ¿A qué hora llega a la escuela? ¿Qué dato falta?", c: "Cuánto tarda en llegar", x: ["A qué hora sale", "Cómo se llama la escuela", "Cuántos años tiene {M1}"], p: "Para saber cuándo llegas, ¿qué tienes que sumar a la hora de salida?", ex: "A la hora de salida hay que sumarle lo que tarda, y eso no lo dice." },
  { d: 3, e: "En una caja hay 24 lápices. Se reparten a partes iguales entre los niños de la mesa. ¿Cuántos lápices recibe cada niño? ¿Qué dato falta para resolverlo?", f: "Hay 24 lápices. Se reparten a partes iguales. ¿Cuántos recibe cada niño? ¿Qué dato falta?", c: "Cuántos niños hay en la mesa", x: ["Cuántos lápices hay en la caja", "De qué color son los lápices", "Cuánto mide la mesa"], p: "Para repartir, necesitas saber qué se reparte y entre cuántos.", ex: "Sabemos que hay 24 lápices, pero no entre cuántos niños se reparten." },
  { d: 3, e: "{F1} quiere saber si llega al autobús de las 10. Sale de casa a las 9 y media y la parada está lejos. ¿Qué tiene que averiguar primero?", f: "El autobús sale a las 10. {F1} sale de casa a las 9 y media. La parada está lejos. ¿Qué debe averiguar primero?", c: "Cuánto tarda en llegar a la parada", x: ["De qué color es el autobús", "Cuántas personas van en el autobús", "A qué hora vuelve a casa"], p: "¿Qué número necesita para comparar con el tiempo que tiene?", ex: "Tiene media hora. Debe saber si el camino hasta la parada dura menos que eso." },
  { d: 3, e: "Una tienda vende cuadernos a 4 monedas. {M1} tiene 10 monedas y dice: «Puedo comprar 3 cuadernos». ¿Qué debes comprobar para saber si tiene razón?", f: "Cada cuaderno cuesta 4 monedas. {M1} tiene 10 monedas. Dice: «Compro 3 cuadernos». ¿Qué debes comprobar?", c: "Si 3 cuadernos cuestan 10 monedas o menos", x: ["Si la tienda abre por la tarde", "Si 10 es un número par", "Si {M1} ya tiene otro cuaderno"], p: "Compara lo que cuesta con lo que tiene.", ex: "Hay que ver si le alcanza: 3 cuadernos cuestan 12 monedas y solo tiene 10." },
  { d: 3, e: "En un problema lees: «{F1} tiene 5 monedas más que {M1}. {M1} tiene 7 monedas». ¿Qué significa «5 monedas más que {M1}»?", f: "{F1} tiene 5 monedas más que {M1}. {M1} tiene 7 monedas. ¿Qué significa eso?", c: "Que a las monedas de {M1} hay que sumarles 5", x: ["Que {F1} tiene 5 monedas", "Que {M1} tiene 12 monedas", "Que hay que restar 5 a las monedas de {M1}"], p: "Lee despacio: ¿quién tiene más?", ex: "{F1} tiene las de {M1} y 5 más: 7 más 5 son 12." },
]);

// ---------- Elegir los pasos ----------
const COSAS = [
  { plural: "manzanas", genero: "f" },
  { plural: "lápices", genero: "m" },
  { plural: "huevos", genero: "m" },
  { plural: "naranjas", genero: "f" },
  { plural: "cuadernos", genero: "m" },
] as const;
const PRODUCTOS = [
  { plural: "cuadernos", cada: "cada uno" },
  { plural: "lápices", cada: "cada uno" },
  { plural: "vasos", cada: "cada uno" },
  { plural: "pelotas", cada: "cada una" },
] as const;

function cuantosDe(c: (typeof COSAS)[number]): string {
  return c.genero === "f" ? "Cuántas" : "Cuántos";
}

const PREGUNTA_OP = "¿Qué operación debes hacer?";

function opciones(a: number, b: number): { sumar: string; restar: string; multiplicar: string; dividir: string } {
  const [mayor, menor] = a >= b ? [a, b] : [b, a];
  return { sumar: `Sumar ${a} + ${b}`, restar: `Restar ${mayor} − ${menor}`, multiplicar: `Multiplicar ${a} × ${b}`, dividir: `Dividir ${mayor} ÷ ${menor}` };
}

function opSumar(rng: Rng): Contenido {
  const quien = nombre(rng);
  const c = elegir(rng, COSAS);
  const a = entero(rng, 12, 40);
  const b = entero(rng, 3, 11);
  const o = opciones(a, b);
  return {
    enunciado: `${quien} recoge ${a} ${c.plural} por la mañana y ${b} por la tarde. ¿${cuantosDe(c)} ${c.plural} recoge en total? ${PREGUNTA_OP}`,
    enunciadoFacil: `${quien} recoge ${a} ${c.plural} por la mañana. Recoge ${b} por la tarde. ¿${cuantosDe(c)} son en total? ${PREGUNTA_OP}`,
    respuesta: { tipo: "opcion", correcta: o.sumar, distractores: [o.restar, o.multiplicar, o.dividir] },
    pista: "Se juntan dos cantidades.",
    explicacion: `Hay que juntar lo de la mañana y lo de la tarde, y juntar es sumar: ${a} + ${b}.`,
  };
}

function opRestar(rng: Rng): Contenido {
  const quien = nombre(rng);
  const c = elegir(rng, COSAS);
  const a = entero(rng, 15, 40);
  const b = entero(rng, 3, 12);
  const o = opciones(a, b);
  return {
    enunciado: `${quien} tiene ${a} ${c.plural} y regala ${b}. ¿${cuantosDe(c)} ${c.plural} le quedan? ${PREGUNTA_OP}`,
    enunciadoFacil: `${quien} tiene ${a} ${c.plural}. Regala ${b}. ¿${cuantosDe(c)} le quedan? ${PREGUNTA_OP}`,
    respuesta: { tipo: "opcion", correcta: o.restar, distractores: [o.sumar, o.multiplicar, o.dividir] },
    pista: "Si regala, tiene menos que antes.",
    explicacion: `Se quitan los que regala, y quitar es restar: ${a} − ${b}.`,
  };
}

function opMultiplicar(rng: Rng): Contenido {
  const c = elegir(rng, COSAS);
  const a = entero(rng, 6, 9);
  const b = entero(rng, 2, 5);
  const o = opciones(a, b);
  return {
    enunciado: `Hay ${a} cajas. En cada caja hay ${b} ${c.plural}. ¿${cuantosDe(c)} ${c.plural} hay en total? ${PREGUNTA_OP}`,
    enunciadoFacil: `Hay ${a} cajas. Cada caja tiene ${b} ${c.plural}. ¿${cuantosDe(c)} hay en total? ${PREGUNTA_OP}`,
    respuesta: { tipo: "opcion", correcta: o.multiplicar, distractores: [o.sumar, o.restar, o.dividir] },
    pista: "Son varios grupos iguales.",
    explicacion: `Son ${a} grupos iguales de ${b}, y eso se calcula multiplicando: ${a} × ${b}.`,
  };
}

function opDividir(rng: Rng): Contenido {
  const quien = nombre(rng);
  const c = elegir(rng, COSAS);
  const b = entero(rng, 2, 6);
  const a = b * entero(rng, 3, 9);
  const o = opciones(a, b);
  return {
    enunciado: `${quien} reparte ${a} ${c.plural} entre ${b} amigos a partes iguales. ¿${cuantosDe(c)} ${c.plural} recibe cada amigo? ${PREGUNTA_OP}`,
    enunciadoFacil: `${quien} reparte ${a} ${c.plural} entre ${b} amigos. Todos reciben igual. ¿${cuantosDe(c)} recibe cada uno? ${PREGUNTA_OP}`,
    respuesta: { tipo: "opcion", correcta: o.dividir, distractores: [o.sumar, o.restar, o.multiplicar] },
    pista: "Repartir a partes iguales es hacer grupos iguales.",
    explicacion: `Repartir a partes iguales es dividir: ${a} ÷ ${b}.`,
  };
}

const PREGUNTA_PASOS = "¿Qué pasos debes seguir?";

function pasosCompra(rng: Rng): Contenido {
  const quien = nombre(rng);
  const cosa = elegir(rng, PRODUCTOS);
  const n = entero(rng, 2, 5);
  const p = entero(rng, 2, 6);
  const paga = n * p + entero(rng, 2, 9);
  return {
    enunciado: `${quien} compra ${n} ${cosa.plural} a ${monedas(p)} ${cosa.cada} y paga con ${monedas(paga)}. ¿Cuántas monedas le devuelven? ${PREGUNTA_PASOS}`,
    enunciadoFacil: `${quien} compra ${n} ${cosa.plural}. El precio de cada unidad es ${monedas(p)}. Paga con ${monedas(paga)}. ¿Cuánto le devuelven? ${PREGUNTA_PASOS}`,
    respuesta: {
      tipo: "opcion",
      correcta: `Multiplicar ${n} × ${p} y restar el resultado a ${paga}`,
      distractores: [`Sumar ${n} + ${p} y restar el resultado a ${paga}`, `Multiplicar ${n} × ${p} y sumar ${paga} al resultado`, `Restar ${paga} − ${n} y multiplicar el resultado por ${p}`],
    },
    pista: "Primero calcula lo que cuesta todo. Después piensa en la vuelta.",
    explicacion: `Primero el coste: ${n} × ${p} = ${n * p}. Después la vuelta: ${paga} − ${n * p} = ${paga - n * p}.`,
  };
}

function pasosReparto(rng: Rng): Contenido {
  const quien = nombre(rng);
  const c = elegir(rng, COSAS);
  const k = entero(rng, 2, 5);
  const total = k * entero(rng, 4, 9);
  const x = entero(rng, 2, total - 2);
  const y = total - x;
  return {
    enunciado: `${quien} recoge ${x} ${c.plural} por la mañana y ${y} por la tarde. ${c.genero === "f" ? "Las" : "Los"} reparte a partes iguales en ${k} cestas. ¿${cuantosDe(c)} ${c.plural} van en cada cesta? ${PREGUNTA_PASOS}`,
    enunciadoFacil: `${quien} recoge ${x} ${c.plural} por la mañana. Recoge ${y} por la tarde. Hay ${k} cestas. En todas va igual. ¿${cuantosDe(c)} van en cada cesta? ${PREGUNTA_PASOS}`,
    respuesta: {
      tipo: "opcion",
      correcta: `Sumar ${x} + ${y} y dividir el resultado entre ${k}`,
      distractores: [`Multiplicar ${x} × ${y} y dividir el resultado entre ${k}`, `Sumar ${x} + ${y} y multiplicar el resultado por ${k}`, `Sumar ${x} + ${k} y restar ${y} al resultado`],
    },
    pista: "Primero junta todo lo recogido. Después reparte.",
    explicacion: `Primero se junta: ${x} + ${y} = ${total}. Después se reparte: ${total} ÷ ${k} = ${total / k}.`,
  };
}

function pasosFilas(rng: Rng): Contenido {
  const a = entero(rng, 3, 8);
  const b = entero(rng, 4, 9);
  const c = entero(rng, 10, a * b - 2); // distinto de a y b: las opciones no se repiten
  return {
    enunciado: `En el huerto hay ${a} filas con ${b} plantas cada una. Se secan ${c} plantas. ¿Cuántas plantas quedan? ${PREGUNTA_PASOS}`,
    enunciadoFacil: `Hay ${a} filas. Cada fila tiene ${b} plantas. Se secan ${c}. ¿Cuántas quedan? ${PREGUNTA_PASOS}`,
    respuesta: {
      tipo: "opcion",
      correcta: `Multiplicar ${a} × ${b} y restar ${c} al resultado`,
      distractores: [`Sumar ${a} + ${b} y restar ${c} al resultado`, `Multiplicar ${a} × ${b} y sumar ${c} al resultado`, `Multiplicar ${a} × ${c} y sumar ${b} al resultado`],
    },
    pista: "Primero calcula cuántas plantas había. Después quita las secas.",
    explicacion: `Había ${a} × ${b} = ${a * b} plantas. Si se secan ${c}, quedan ${a * b - c}.`,
  };
}

function pasosDias(rng: Rng): Contenido {
  const quien = nombre(rng);
  const a = entero(rng, 3, 7);
  const b = entero(rng, 2, 6);
  const c = entero(rng, 10, 20);
  return {
    enunciado: `En el depósito ya hay ${c} cubos de agua. ${quien} echa ${b} cubos cada día durante ${a} días. ¿Cuántos cubos hay al final? ${PREGUNTA_PASOS}`,
    enunciadoFacil: `En el depósito hay ${c} cubos. ${quien} echa ${b} cubos cada día. Lo hace ${a} días. ¿Cuántos cubos hay al final? ${PREGUNTA_PASOS}`,
    respuesta: {
      tipo: "opcion",
      correcta: `Multiplicar ${b} × ${a} y sumar ${c} al resultado`,
      distractores: [`Sumar ${b} + ${a} y sumar ${c} al resultado`, `Multiplicar ${b} × ${a} y restar el resultado a ${c}`, `Multiplicar ${c} × ${a} y sumar ${b} al resultado`],
    },
    pista: "Calcula lo que echa en todos los días. Después añade lo que ya había.",
    explicacion: `Echa ${b} × ${a} = ${a * b} cubos, y con los ${c} que había son ${a * b + c}.`,
  };
}

function pasosDosCompras(rng: Rng): Contenido {
  const quien = nombre(rng);
  const n1 = entero(rng, 2, 4);
  const p1 = entero(rng, 2, 6);
  const n2 = entero(rng, 2, 4);
  const p2 = entero(rng, 2, 6);
  const total = n1 * p1 + n2 * p2;
  const paga = total + entero(rng, 2, 10);
  return {
    enunciado: `${quien} compra ${n1} cuadernos a ${monedas(p1)} cada uno y ${n2} lápices a ${monedas(p2)} cada uno. Paga con ${monedas(paga)}. ¿Cuántas monedas le devuelven? ${PREGUNTA_PASOS}`,
    enunciadoFacil: `${quien} compra ${n1} cuadernos. Cada cuaderno cuesta ${monedas(p1)}. Compra ${n2} lápices. Cada lápiz cuesta ${monedas(p2)}. Paga con ${monedas(paga)}. ¿Cuánto le devuelven? ${PREGUNTA_PASOS}`,
    respuesta: {
      tipo: "opcion",
      correcta: `Multiplicar ${n1} × ${p1} y ${n2} × ${p2}, sumar los dos resultados y restar la suma a ${paga}`,
      distractores: [
        `Sumar ${n1} + ${p1} y ${n2} + ${p2}, sumar los dos resultados y restar la suma a ${paga}`,
        `Multiplicar ${n1} × ${p1} y ${n2} × ${p2}, y sumar ${paga} a los dos resultados`,
        `Multiplicar ${n1} × ${p1}, restar el resultado a ${paga} y terminar ahí`,
      ],
    },
    pista: "Calcula el coste de cada compra, júntalos y piensa en la vuelta.",
    explicacion: `Los cuadernos cuestan ${n1 * p1} y los lápices ${n2 * p2}: en total ${total}. La vuelta es ${paga} − ${total} = ${paga - total}.`,
  };
}

function pasosMedia(rng: Rng): Contenido {
  const quien = nombre(rng);
  const k = entero(rng, 2, 4);
  const cada = entero(rng, 3, 8);
  const extra = entero(rng, 2, 9);
  const total = k * cada + extra;
  return {
    enunciado: `${quien} tiene ${total} huevos. Aparta ${extra} para su familia y el resto lo coloca a partes iguales en ${k} cajas. ¿Cuántos huevos van en cada caja? ${PREGUNTA_PASOS}`,
    enunciadoFacil: `${quien} tiene ${total} huevos. Aparta ${extra}. El resto va en ${k} cajas. En todas va igual. ¿Cuántos van en cada caja? ${PREGUNTA_PASOS}`,
    respuesta: {
      tipo: "opcion",
      correcta: `Restar ${total} − ${extra} y dividir el resultado entre ${k}`,
      distractores: [`Dividir ${total} entre ${k} y restar ${extra} al resultado`, `Sumar ${total} + ${extra} y dividir el resultado entre ${k}`, `Restar ${total} − ${extra} y multiplicar el resultado por ${k}`],
    },
    pista: "Antes de repartir, quita lo que no se reparte.",
    explicacion: `Se reparten solo los que quedan: ${total} − ${extra} = ${k * cada}. Y ${k * cada} ÷ ${k} = ${cada}.`,
  };
}

const PLANTILLAS_PASOS: readonly Plantilla[] = [
  { clave: "sumar", dificultades: [1], crear: opSumar },
  { clave: "restar", dificultades: [1], crear: opRestar },
  { clave: "multiplicar", dificultades: [1], crear: opMultiplicar },
  { clave: "dividir", dificultades: [1], crear: opDividir },
  { clave: "compra", dificultades: [2], crear: pasosCompra },
  { clave: "reparto", dificultades: [2], crear: pasosReparto },
  { clave: "filas", dificultades: [2], crear: pasosFilas },
  { clave: "dias", dificultades: [2], crear: pasosDias },
  { clave: "dos-compras", dificultades: [3], crear: pasosDosCompras },
  { clave: "apartar", dificultades: [3], crear: pasosMedia },
];

const PASOS_ESCRITOS = situaciones("PEN3-T2-b", [
  { d: 1, e: "{F1} quiere plantar una semilla. ¿Qué orden de pasos es el correcto?", f: "{F1} planta una semilla. ¿Cuál es el orden correcto?", c: "Hacer un hoyo, poner la semilla, taparla y regarla", x: ["Regar, tapar el hoyo, poner la semilla y hacer el hoyo", "Tapar la tierra, poner la semilla encima y hacer un hoyo"], p: "Imagina que lo haces de verdad. ¿Qué va primero?", ex: "Sin hoyo no se puede poner la semilla, y hasta que no está tapada no se riega." },
  { d: 1, e: "{M1} quiere escribir una carta y llevarla a su abuela. ¿Qué orden de pasos es el correcto?", f: "{M1} quiere enviar una carta. ¿Cuál es el orden correcto?", c: "Escribirla, meterla en el sobre y llevarla", x: ["Llevar el sobre, escribir la carta y cerrarlo", "Cerrar el sobre vacío, escribir la carta y llevarla"], p: "¿Qué tiene que estar hecho antes de cerrar el sobre?", ex: "Primero se escribe, después se mete en el sobre y por último se lleva." },
  { d: 2, e: "A {F1} se le ha salido la cadena de la bicicleta en el camino. No sabe arreglarla sola. ¿Cuál es el mejor plan?", f: "A {F1} se le sale la cadena de la bicicleta. No sabe arreglarla. ¿Cuál es el mejor plan?", c: "Parar a un lado del camino y pedir ayuda a un adulto", x: ["Seguir pedaleando sin cadena hasta casa", "Dejar la bicicleta en medio del camino y marcharse"], p: "Piensa primero en estar segura. Después en arreglarlo.", ex: "Parar a un lado es seguro, y un adulto puede ayudarla a arreglar la cadena." },
  { d: 2, e: "{M1} tiene que llevar agua a casa, pero el cubo tiene un agujero. ¿Qué debe hacer primero?", f: "{M1} debe llevar agua. El cubo tiene un agujero. ¿Qué hace primero?", c: "Buscar otro cubo o arreglar ese", x: ["Llenar el cubo y correr muy deprisa", "Llenar el cubo varias veces seguidas en el pozo"], p: "¿Qué pasará con el agua si no cambia nada?", ex: "Con el agujero el agua se saldría, así que primero hay que resolver eso." },
  { d: 3, e: "En la escuela se ha terminado el papel para el cartel, y hay que entregarlo mañana. ¿Qué orden de pasos tiene más sentido?", f: "Se ha terminado el papel. El cartel es para mañana. ¿Qué orden tiene más sentido?", c: "Avisar a la maestra, conseguir papel y terminar el cartel", x: ["Terminar el cartel, conseguir papel y avisar a la maestra", "Entregar el cartel, avisar a la maestra y conseguir papel"], p: "Sin papel no se puede seguir. ¿Qué hay que hacer antes de terminar?", ex: "Primero avisa para conseguir papel, y con papel ya puede terminar el cartel." },
  { d: 3, e: "{M1} ha perdido la llave de casa en algún lugar de la escuela. ¿Qué plan es el más ordenado?", f: "{M1} perdió la llave en la escuela. ¿Qué plan es el más ordenado?", c: "Pensar dónde estuvo, mirar en esos sitios y preguntar a la maestra", x: ["Irse a casa sin decir nada y esperar en la puerta", "Mirar en cualquier sitio de la calle y después pensar dónde estuvo"], p: "Empieza por recordar. Así no buscas al azar.", ex: "Pensar dónde estuvo reduce los sitios para buscar, y la maestra puede ayudarle." },
]);

export const GENERADORES_PROBLEMAS3: Readonly<Record<string, readonly Generador[]>> = {
  "PEN3-T2-a": [generadorDeSituaciones("PEN3-T2-a", ENTENDER)],
  "PEN3-T2-b": [generadorDePlantillas("PEN3-T2-b", PLANTILLAS_PASOS), generadorDeSituaciones("PEN3-T2-b", PASOS_ESCRITOS)],
};
