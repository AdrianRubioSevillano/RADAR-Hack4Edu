// 2.º de primaria: vocabulario y frases (T1 y T2).
import type { Rng } from "../../../core/rng.ts";
import { elegir, entero, muestra, nombres, pregunta } from "../../ayuda.ts";
import type { Contable } from "../../ayuda.ts";
import { generadorDeSituaciones } from "../../plantillas.ts";
import type { Situacion } from "../../plantillas.ts";
import type { Dificultad, Generador, Imagen, MapaGeneradores, ObjetoId, Pregunta } from "../../tipos.ts";
import { SERES, conArticulo, grupo, mayuscula, objetos, numeroEnLetra, porDificultad } from "./base.ts";

type Par = readonly [string, string, readonly [string, string]];
type EnFrase = readonly [string, string, string, readonly [string, string]];

// ---------- LEE2-T1-a: palabras parecidas ----------
const SINONIMO = "LEE2-T1-a";

// [palabra, correcta, distractores]. En la media, uno es el contrario y otro se le parece.
const SINONIMOS: Readonly<Record<1 | 2, readonly Par[]>> = {
  1: [
    ["contento", "alegre", ["alto", "frío"]], ["bonito", "hermoso", ["mojado", "lento"]], ["rápido", "veloz", ["dulce", "nuevo"]],
    ["empezar", "comenzar", ["dormir", "cantar"]], ["grande", "enorme", ["verde", "seco"]], ["volver", "regresar", ["comer", "pintar"]], ["fácil", "sencillo", ["azul", "ruidoso"]],
  ],
  2: [
    ["terminar", "acabar", ["empezar", "tirar"]], ["cara", "rostro", ["rosa", "pie"]], ["pelo", "cabello", ["caballo", "pie"]], ["mirar", "observar", ["escuchar", "ocultar"]],
    ["alumna", "estudiante", ["maestra", "alfombra"]], ["casa", "hogar", ["calle", "caja"]], ["enojado", "enfadado", ["tranquilo", "enfermo"]], ["saltar", "brincar", ["sentarse", "salir"]],
  ],
};

// [frase, palabra de la frase, correcta, distractores].
const SINONIMOS_FRASE: readonly EnFrase[] = [
  ["El perro encontró su pelota.", "encontró", "halló", ["perdió", "escondió"]],
  ["La maestra nos dio un regalo.", "regalo", "obsequio", ["castigo", "recado"]],
  ["{F1} está muy cansada después de correr.", "cansada", "agotada", ["descansada", "limpia"]],
  ["Caminamos por un sendero del bosque.", "sendero", "camino", ["río", "árbol"]],
  ["Las nubes tapan el sol.", "tapan", "cubren", ["miran", "abren"]],
  ["{M1} siente temor cuando hay tormenta.", "temor", "miedo", ["hambre", "alegría"]],
  ["Este cuento es muy divertido.", "divertido", "entretenido", ["aburrido", "triste"]],
];

const SITUACIONES_SINONIMOS: readonly Situacion[] = [
  ...([1, 2] as const).flatMap((d) =>
    SINONIMOS[d].map(([palabra, correcta, distractores]): Situacion => ({
      id: `${SINONIMO}/${palabra}`, sub: SINONIMO, dificultad: d,
      enunciado: `¿Qué palabra significa casi lo mismo que «${palabra}»?`,
      enunciadoFacil: `Lee: ${palabra}. ¿Qué palabra dice casi lo mismo?`,
      correcta, distractores,
      pista: d === 1 ? "Piensa en una frase con esa palabra. Prueba a cambiarla por cada opción." : "Cuidado con las palabras que dicen lo contrario o que solo se escriben parecido.",
      explicacion: `«${mayuscula(correcta)}» significa casi lo mismo que «${palabra}».`,
    })),
  ),
  ...SINONIMOS_FRASE.map(([frase, palabra, correcta, distractores]): Situacion => ({
    id: `${SINONIMO}/frase/${palabra}`, sub: SINONIMO, dificultad: 3,
    enunciado: `Lee la frase: «${frase}» ¿Qué palabra puede ir en lugar de «${palabra}» sin cambiar lo que dice?`,
    enunciadoFacil: `Lee: ${frase} Cambia la palabra «${palabra}». La frase debe decir lo mismo. ¿Qué palabra usas?`,
    correcta, distractores,
    pista: "Lee la frase con cada opción. Busca la que dice lo mismo.",
    explicacion: `«${mayuscula(correcta)}» significa casi lo mismo que «${palabra}». La frase sigue diciendo lo mismo.`,
  })),
];

// ---------- LEE2-T1-b: contrarios ----------
const CONTRARIO = "LEE2-T1-b";

// En la media, un distractor significa casi lo mismo que la palabra: es el error típico.
const CONTRARIOS: Readonly<Record<1 | 2, readonly Par[]>> = {
  1: [
    ["grande", "pequeño", ["verde", "dulce"]], ["alto", "bajo", ["rojo", "limpio"]], ["frío", "caliente", ["largo", "nuevo"]], ["día", "noche", ["mesa", "lluvia"]],
    ["abrir", "cerrar", ["comer", "saltar"]], ["subir", "bajar", ["leer", "pintar"]], ["limpio", "sucio", ["redondo", "alto"]], ["rápido", "lento", ["azul", "mojado"]],
  ],
  2: [
    ["lleno", "vacío", ["completo", "pequeño"]], ["triste", "alegre", ["apenado", "cansado"]], ["nuevo", "viejo", ["reciente", "limpio"]], ["cerca", "lejos", ["junto", "abajo"]],
    ["fuerte", "débil", ["robusto", "alto"]], ["oscuro", "claro", ["negro", "frío"]], ["mojado", "seco", ["húmedo", "sucio"]], ["entrar", "salir", ["pasar", "venir"]],
  ],
};

// La palabra va dentro de una frase: el contrario debe concordar con ella.
const CONTRARIOS_FRASE: readonly EnFrase[] = [
  ["El agua está sucia.", "sucia", "limpia", ["limpio", "turbia"]],
  ["La sopa está caliente.", "caliente", "fría", ["frío", "tibia"]],
  ["{F1} encendió la luz.", "encendió", "apagó", ["prendió", "miró"]],
  ["La puerta está abierta.", "abierta", "cerrada", ["cerrado", "rota"]],
  ["Las cajas son pesadas.", "pesadas", "ligeras", ["grandes", "ligera"]],
  ["Mi abuela compró una gallina.", "compró", "vendió", ["pagó", "trajo"]],
  ["{M1} ganó la carrera.", "ganó", "perdió", ["corrió", "terminó"]],
  ["El camino es largo.", "largo", "corto", ["corta", "ancho"]],
];

const SITUACIONES_CONTRARIOS: readonly Situacion[] = [
  ...([1, 2] as const).flatMap((d) =>
    CONTRARIOS[d].map(([palabra, correcta, distractores]): Situacion => ({
      id: `${CONTRARIO}/${palabra}`, sub: CONTRARIO, dificultad: d,
      enunciado: `¿Cuál es el contrario de «${palabra}»?`,
      enunciadoFacil: `Lee: ${palabra}. ¿Qué palabra dice lo contrario?`,
      correcta, distractores,
      pista: d === 1 ? "El contrario dice justo lo opuesto." : "Cuidado: una opción significa casi lo mismo, no lo contrario.",
      explicacion: `Lo contrario de «${palabra}» es «${correcta}».`,
    })),
  ),
  ...CONTRARIOS_FRASE.map(([frase, palabra, correcta, distractores]): Situacion => ({
    id: `${CONTRARIO}/frase/${palabra}`, sub: CONTRARIO, dificultad: 3,
    enunciado: `Lee la frase: «${frase}» ¿Qué palabra dice lo contrario de «${palabra}» y encaja en la frase?`,
    enunciadoFacil: `Lee: ${frase} Busca lo contrario de «${palabra}». Debe encajar en la frase.`,
    correcta, distractores,
    pista: "Lee la frase con cada opción. Tiene que sonar bien y decir lo opuesto.",
    explicacion: `Lo contrario de «${palabra}» aquí es «${correcta}», y encaja bien en la frase.`,
  })),
];

// ---------- LEE2-T1-c: categorías ----------
const CATEGORIA = "LEE2-T1-c";

// Sin palabras con dos sentidos que crucen grupos (naranja es fruta y color).
const CATEGORIAS: readonly { readonly id: string; readonly uno: string; readonly grupo: string; readonly cerca: readonly [string, string]; readonly palabras: readonly string[] }[] = [
  { id: "animales", uno: "un animal", grupo: "animales", cerca: ["plantas", "personas"], palabras: ["perro", "vaca", "pato", "rana", "oso", "gallina"] },
  { id: "frutas", uno: "una fruta", grupo: "frutas", cerca: ["verduras", "bebidas"], palabras: ["manzana", "pera", "uva", "mango", "sandía", "limón"] },
  { id: "ropa", uno: "una prenda de ropa", grupo: "ropa", cerca: ["juguetes", "muebles"], palabras: ["camisa", "pantalón", "gorro", "falda", "abrigo"] },
  { id: "muebles", uno: "un mueble", grupo: "muebles", cerca: ["ropa", "herramientas"], palabras: ["mesa", "silla", "cama", "armario"] },
  { id: "cuerpo", uno: "una parte del cuerpo", grupo: "partes del cuerpo", cerca: ["ropa", "animales"], palabras: ["mano", "pie", "rodilla", "oreja", "nariz"] },
  { id: "transporte", uno: "un medio de transporte", grupo: "medios de transporte", cerca: ["muebles", "juguetes"], palabras: ["tren", "barco", "avión", "autobús", "bicicleta"] },
  { id: "colores", uno: "un color", grupo: "colores", cerca: ["números", "formas"], palabras: ["rojo", "azul", "verde", "amarillo", "morado"] },
  { id: "dias", uno: "un día de la semana", grupo: "días de la semana", cerca: ["meses del año", "horas del día"], palabras: ["lunes", "martes", "jueves", "viernes", "domingo"] },
];

type Categoria = (typeof CATEGORIAS)[number];

function otrasCategorias(c: Categoria): readonly Categoria[] {
  return CATEGORIAS.filter((x) => x.id !== c.id);
}

const categoriaFacil: Generador = (rng, d) => {
  const c = elegir(rng, CATEGORIAS);
  const correcta = elegir(rng, c.palabras);
  const distractores = muestra(rng, otrasCategorias(c), 2).map((x) => elegir(rng, x.palabras));
  return pregunta(rng, {
    subhabilidad: CATEGORIA, dificultad: d,
    enunciado: `¿Qué palabra nombra ${c.uno}?`,
    enunciadoFacil: `Busca ${c.uno}. ¿Qué palabra es?`,
    respuesta: { tipo: "opcion", correcta, distractores },
    pista: "Lee las tres palabras. Piensa qué es cada cosa.",
    explicacion: `«${mayuscula(correcta)}» es ${c.uno}. Las otras palabras no.`,
    plantilla: `${CATEGORIA}/uno/${correcta}`,
  });
};

const categoriaMedia: Generador = (rng, d) => {
  const c = elegir(rng, CATEGORIAS);
  const trio = muestra(rng, c.palabras, 3);
  const otra = elegir(rng, otrasCategorias(c));
  const correcta = elegir(rng, otra.palabras);
  return pregunta(rng, {
    subhabilidad: CATEGORIA, dificultad: d,
    enunciado: "Tres palabras son del mismo grupo. ¿Qué palabra no va con las otras?",
    enunciadoFacil: "Tres palabras van juntas. Una no. ¿Cuál no va?",
    respuesta: { tipo: "opcion", correcta, distractores: trio },
    pista: "Busca primero qué tienen en común tres de las palabras.",
    explicacion: `«${mayuscula(trio[0] ?? "")}», «${trio[1] ?? ""}» y «${trio[2] ?? ""}» son ${c.grupo}. «${mayuscula(correcta)}» no.`,
    plantilla: `${CATEGORIA}/intruso/${c.id}/${correcta}`,
  });
};

const categoriaDificil: Generador = (rng, d) => {
  const c = elegir(rng, CATEGORIAS);
  const trio = muestra(rng, c.palabras, 3);
  const lista = `${trio[0] ?? ""}, ${trio[1] ?? ""}, ${trio[2] ?? ""}`;
  return pregunta(rng, {
    subhabilidad: CATEGORIA, dificultad: d,
    enunciado: `Mira estas palabras: ${lista}. ¿Cómo se llama su grupo?`,
    enunciadoFacil: `Lee: ${lista}. ¿Qué nombre tiene su grupo?`,
    respuesta: { tipo: "opcion", correcta: mayuscula(c.grupo), distractores: c.cerca.map(mayuscula) },
    pista: "Piensa qué son las tres cosas. Busca una palabra que las nombre a todas.",
    explicacion: `${mayuscula(lista)}: las tres palabras nombran ${c.grupo}.`,
    plantilla: `${CATEGORIA}/grupo/${c.id}/${[...trio].sort().join("-")}`,
  });
};

// ---------- LEE2-T2-a: completar la frase ----------
const COMPLETAR = "LEE2-T2-a";

type Hueco = readonly [string, string, string, readonly [string, string], string];

// [id, frase con ___, correcta, distractores, explicación].
const HUECOS: Readonly<Record<Dificultad, readonly Hueco[]>> = {
  1: [
    ["luna", "Por la noche, en el cielo se ve la ___.", "luna", ["silla", "pelota"], "De noche, en el cielo se ve la luna. Una silla o una pelota no están en el cielo."],
    ["jabon", "Me lavo las manos con agua y ___.", "jabón", ["pan", "lápiz"], "Las manos se lavan con agua y jabón."],
    ["lapiz", "Escribo en el cuaderno con un ___.", "lápiz", ["zapato", "vaso"], "Para escribir se usa un lápiz."],
    ["pez", "El pez vive en el ___.", "agua", ["árbol", "cielo"], "Los peces viven en el agua."],
    ["paraguas", "Llueve mucho. Abro mi ___.", "paraguas", ["zapato", "cuaderno"], "El paraguas nos tapa de la lluvia."],
    ["sed", "Tengo sed. Bebo ___.", "agua", ["arena", "papel"], "Cuando tenemos sed, bebemos agua."],
  ],
  2: [
    ["juegan", "Las niñas ___ en el patio.", "juegan", ["juega", "jugar"], "«Las niñas» son varias, por eso se dice «juegan»."],
    ["van", "{M1} y {F1} ___ al mercado.", "van", ["va", "voy"], "Son dos personas, por eso se dice «van»."],
    ["leyo", "Ayer {N1} ___ un cuento.", "leyó", ["lee", "leerá"], "La palabra «ayer» habla del pasado, por eso se dice «leyó»."],
    ["ira", "Mañana {N1} ___ al río.", "irá", ["fue", "iba"], "La palabra «mañana» habla del futuro, por eso se dice «irá»."],
    ["bonita", "La casa de {N1} es muy ___.", "bonita", ["bonito", "bonitos"], "«Casa» es femenino y singular, por eso se dice «bonita»."],
    ["cansados", "Los perros están ___.", "cansados", ["cansado", "cansada"], "«Los perros» son varios, por eso se dice «cansados»."],
    ["cuadernos", "Tengo dos ___ nuevos.", "cuadernos", ["cuaderno", "mochilas"], "«Dos» pide plural y «nuevos» es masculino, por eso se dice «cuadernos»."],
  ],
  3: [
    ["frio", "{M1} se puso el abrigo porque tenía ___.", "frío", ["calor", "sed"], "El abrigo se usa cuando hace frío."],
    ["seca", "Regamos las plantas porque la tierra estaba ___.", "seca", ["mojada", "limpia"], "Las plantas se riegan cuando la tierra no tiene agua, cuando está seca."],
    ["nubes", "Llevé el paraguas porque el cielo tenía muchas ___.", "nubes", ["estrellas", "flores"], "Las nubes traen lluvia, por eso se lleva el paraguas."],
    ["luz", "{F1} no pudo leer porque no había ___.", "luz", ["ruido", "sed"], "Sin luz no se pueden ver las letras."],
    ["cama", "{M1} tiene mucho sueño, por eso ___.", "se va a la cama", ["corre al patio", "se levanta de la cama"], "Cuando tenemos sueño, nos vamos a dormir."],
    ["sucia", "El agua está sucia, por eso ___.", "no la bebemos", ["la bebemos", "la guardamos para beber"], "El agua sucia no es segura. No se debe beber."],
    ["dormir", "Por la noche apagamos la luz para ___.", "dormir", ["leer", "pintar"], "Para leer o pintar hace falta luz. Para dormir, no."],
  ],
};

const SITUACIONES_COMPLETAR: readonly Situacion[] = ([1, 2, 3] as const).flatMap((d) =>
  HUECOS[d].map(([id, frase, correcta, distractores, explicacion]): Situacion => ({
    id: `${COMPLETAR}/${id}`, sub: COMPLETAR, dificultad: d,
    enunciado: `Lee la frase: «${frase}» ¿Qué va en el hueco?`,
    enunciadoFacil: `Lee: ${frase} ¿Qué falta?`,
    correcta, distractores,
    pista: d === 2 ? "Lee la frase con cada opción. Mira con qué palabra tiene que concordar." : "Lee la frase con cada opción. Busca la que tiene sentido.",
    explicacion,
  })),
);

// ---------- LEE2-T2-b: elegir la frase de la imagen ----------
const FRASE_IMAGEN = "LEE2-T2-b";

function fraseDe(rng: Rng, d: Dificultad, imagen: Imagen, correcta: string, distractores: readonly string[], explicacion: string, plantilla: string, pista: string): Pregunta {
  return pregunta(rng, {
    subhabilidad: FRASE_IMAGEN, dificultad: d,
    enunciado: "Mira el dibujo. ¿Qué frase dice lo que ves?",
    enunciadoFacil: "Mira el dibujo. ¿Qué frase es la correcta?",
    imagen,
    respuesta: { tipo: "opcion", correcta, distractores },
    pista,
    explicacion,
    plantilla: `${FRASE_IMAGEN}/${plantilla}`,
  });
}

const imagenFacil: Generador = (rng, d) => {
  const [c, otra] = muestra(rng, SERES, 2) as [Contable, Contable];
  const n = entero(rng, 2, 8);
  const correcta = `Hay ${grupo(n, c)}.`;
  return fraseDe(rng, d, objetos([c, n]), correcta, [`Hay ${grupo(n + 1, c)}.`, `Hay ${grupo(n - 1, c)}.`, `Hay ${grupo(n, otra)}.`], `En el dibujo hay ${grupo(n, c)}.`, `${c.id}/${n}`, "Cuenta lo que ves y mira de qué se trata.");
};

const imagenMedia: Generador = (rng, d) => {
  const [a, b] = muestra(rng, SERES, 2) as [Contable, Contable];
  const n = entero(rng, 2, 5);
  const m = entero(rng, 1, n - 1);
  const dice = (x: number, y: number) => `Hay ${grupo(x, a)} y ${grupo(y, b)}.`;
  return fraseDe(rng, d, objetos([a, n], [b, m]), dice(n, m), [dice(m, n), dice(n, n), dice(n + 1, m)], `En el dibujo hay ${grupo(n, a)} y ${grupo(m, b)}.`, `${a.id}/${b.id}/${n}/${m}`, "Cuenta cada grupo por separado.");
};

const PESADOS: readonly Contable[] = SERES.filter((c) => ["manzana", "pera", "naranja", "libro", "pelota", "botella"].includes(c.id));

const imagenDificil: Generador = (rng, d) => {
  const tipo = elegir(rng, [0, 1, 2]);
  if (tipo === 0) {
    const [a, b] = muestra(rng, PESADOS, 2) as [Contable, Contable];
    const baja = elegir(rng, ["izquierda", "derecha", "ninguna"] as const);
    const masA = `${mayuscula(conArticulo(a))} pesa más que ${conArticulo(b)}.`;
    const masB = `${mayuscula(conArticulo(b))} pesa más que ${conArticulo(a)}.`;
    const igual = `${mayuscula(conArticulo(a))} y ${conArticulo(b)} pesan lo mismo.`;
    const [correcta, distractores] = baja === "izquierda" ? [masA, [masB, igual]] : baja === "derecha" ? [masB, [masA, igual]] : [igual, [masA, masB]];
    const izquierda: ObjetoId = a.id;
    const derecha: ObjetoId = b.id;
    const explicacion = baja === "ninguna" ? "Los dos platos de la balanza están a la misma altura: pesan lo mismo." : `El plato que baja es el que pesa más. Baja el de ${conArticulo(baja === "izquierda" ? a : b)}.`;
    return fraseDe(rng, d, { tipo: "balanza", izquierda, derecha, baja }, correcta, distractores, explicacion, `balanza/${a.id}/${b.id}/${baja}`, "En una balanza, baja el plato que pesa más.");
  }
  if (tipo === 1) {
    const [n1, n2] = nombres(rng, 2) as [string, string];
    const largo1 = entero(rng, 3, 9);
    const largo2 = entero(rng, 3, 9);
    const mas1 = `La cuerda de ${n1} es más larga que la de ${n2}.`;
    const mas2 = `La cuerda de ${n2} es más larga que la de ${n1}.`;
    const igual = "Las dos cuerdas son igual de largas.";
    const [correcta, distractores] = largo1 > largo2 ? [mas1, [mas2, igual]] : largo2 > largo1 ? [mas2, [mas1, igual]] : [igual, [mas1, mas2]];
    const explicacion = largo1 === largo2 ? "Las dos tiras llegan hasta el mismo sitio: son igual de largas." : `La tira de ${largo1 > largo2 ? n1 : n2} llega más lejos: es la más larga.`;
    return fraseDe(rng, d, { tipo: "tiras", tiras: [{ etiqueta: `Cuerda de ${n1}`, largo: largo1 }, { etiqueta: `Cuerda de ${n2}`, largo: largo2 }] }, correcta, distractores, explicacion, `tiras/${n1}/${largo1}/${largo2}`, "Compara dónde termina cada tira.");
  }
  const [a, b] = muestra(rng, SERES, 2) as [Contable, Contable];
  const n = entero(rng, 2, 6);
  const m = entero(rng, 2, 6);
  const masA = `Hay más ${a.plural} que ${b.plural}.`;
  const masB = `Hay más ${b.plural} que ${a.plural}.`;
  const igual = `Hay ${a.genero === "m" ? "tantos" : "tantas"} ${a.plural} como ${b.plural}.`;
  const [correcta, distractores] = n > m ? [masA, [masB, igual]] : m > n ? [masB, [masA, igual]] : [igual, [masA, masB]];
  const explicacion = `Hay ${numeroEnLetra(n)} ${a.plural} y ${numeroEnLetra(m)} ${b.plural}.`;
  return fraseDe(rng, d, objetos([a, n], [b, m]), correcta, distractores, explicacion, `comparar/${a.id}/${b.id}/${n}/${m}`, "Cuenta cada grupo y compara.");
};

export const GENERADORES_CURSO2: MapaGeneradores = {
  [SINONIMO]: [generadorDeSituaciones(SINONIMO, SITUACIONES_SINONIMOS)],
  [CONTRARIO]: [generadorDeSituaciones(CONTRARIO, SITUACIONES_CONTRARIOS)],
  [CATEGORIA]: [porDificultad({ 1: categoriaFacil, 2: categoriaMedia, 3: categoriaDificil })],
  [COMPLETAR]: [generadorDeSituaciones(COMPLETAR, SITUACIONES_COMPLETAR)],
  [FRASE_IMAGEN]: [porDificultad({ 1: imagenFacil, 2: imagenMedia, 3: imagenDificil })],
};
