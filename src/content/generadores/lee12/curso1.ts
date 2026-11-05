// 1.º de primaria: generadores en código con listas de palabras y dibujos (T1 a T4).
import type { Rng } from "../../../core/rng.ts";
import { barajar, elegir, entero, muestra, pregunta } from "../../ayuda.ts";
import type { Contable } from "../../ayuda.ts";
import type { ColorId, Dificultad, FormaId, Generador, Imagen, MapaGeneradores, ObjetoId, Pregunta } from "../../tipos.ts";
import { dibujo, etiquetaGrupo, grupo, inicial, mayuscula, objetos, opcionDibujo, palabra, porDificultad, SERES } from "./base.ts";
import { generadorDeTextos } from "../../plantillas.ts";
import { TEXTOS_VERDAD } from "./textos1.ts";

// ---------- LEE1-T1-a: letra inicial con imagen ----------
const SUB_INICIAL = "LEE1-T1-a";
const PISTA_INICIAL = "Di el nombre del dibujo despacio. Fíjate en el primer sonido.";

// Letras muy distintas entre sí, de forma y de sonido.
const LETRAS_LEJANAS = ["a", "e", "o", "u", "m", "p", "s", "l", "t"] as const;
const INICIAL_FACIL: readonly ObjetoId[] = ["sol", "silla", "mesa", "mano", "moneda", "pato", "pera", "pelota", "luna", "libro", "lapiz", "taza", "tren", "oso", "ojo", "uva", "arbol", "avion", "estrella", "elefante"];

// Letras que se confunden de verdad: espejo (b, d, p, q) o forma parecida (m, n, u).
// Nunca se ofrece la letra que suena igual (b y v, s y z, g y j).
const INICIAL_MEDIA: readonly (readonly [ObjetoId, readonly string[]])[] = [
  ["dado", ["b", "p", "t"]], ["dedo", ["b", "p", "t"]], ["barco", ["d", "p", "q"]], ["botella", ["d", "p", "q"]],
  ["bicicleta", ["d", "p", "q"]], ["nube", ["m", "u", "r"]], ["naranja", ["m", "u", "r"]], ["vaca", ["u", "f", "n"]],
  ["ventana", ["u", "f", "n"]], ["rana", ["n", "l", "t"]], ["reloj", ["n", "l", "t"]], ["gato", ["q", "p", "c"]],
  ["casa", ["o", "e", "g"]], ["cama", ["o", "e", "g"]], ["jabon", ["i", "l", "y"]], ["flor", ["t", "l", "j"]],
  ["zapato", ["n", "t", "r"]], ["mochila", ["n", "r", "u"]],
];

// La h no suena: el niño debe saber cómo se escribe.
const INICIAL_HACHE: readonly (readonly [ObjetoId, readonly string[]])[] = [
  ["huevo", ["u", "e"]], ["hoja", ["o", "a"]], ["hormiga", ["o", "a"]],
];

const GRUPOS_LETRA: Readonly<Record<string, readonly ObjetoId[]>> = {
  m: ["mesa", "mano", "moneda", "manzana", "mariposa"], p: ["pato", "pera", "perro", "pelota", "pan", "pez"],
  l: ["luna", "libro", "lapiz", "lupa"], s: ["sol", "silla"], t: ["taza", "tren", "tijeras"], r: ["rana", "reloj"],
  c: ["casa", "cama", "caja"], d: ["dado", "dedo"], n: ["nube", "naranja"], e: ["estrella", "elefante"],
  o: ["oso", "ojo"], a: ["avion", "arbol"], b: ["barco", "botella", "bicicleta"], v: ["vaca", "vaso", "ventana"],
};

function letraDeDibujo(dificultad: Dificultad, id: ObjetoId, distractores: readonly string[]): (rng: Rng) => Pregunta {
  const w = palabra(id).texto;
  const letra = inicial(w);
  return (rng) =>
    pregunta(rng, {
      subhabilidad: SUB_INICIAL,
      dificultad,
      enunciado: "Mira el dibujo. ¿Con qué letra empieza su nombre?",
      enunciadoFacil: "Mira el dibujo. Di su nombre. ¿Cuál es la primera letra?",
      imagen: dibujo(id),
      respuesta: { tipo: "opcion", correcta: letra, distractores },
      pista: letra === "h" ? "Esta palabra empieza con una letra que no suena." : PISTA_INICIAL,
      explicacion: letra === "h" ? `«${mayuscula(w)}» se escribe con h al principio. La h no suena.` : `«${mayuscula(w)}» empieza con la letra ${letra}.`,
      plantilla: `${SUB_INICIAL}/${id}`,
    });
}

const inicialFacil: Generador = (rng, d) => {
  const id = elegir(rng, INICIAL_FACIL);
  const letra = inicial(palabra(id).texto);
  return letraDeDibujo(d, id, muestra(rng, LETRAS_LEJANAS.filter((l) => l !== letra), 2))(rng);
};

const inicialMedia: Generador = (rng, d) => {
  const [id, distractores] = elegir(rng, INICIAL_MEDIA);
  return letraDeDibujo(d, id, distractores)(rng);
};

const inicialDificil: Generador = (rng, d) => {
  if (rng() < 0.25) {
    const [id, distractores] = elegir(rng, INICIAL_HACHE);
    return letraDeDibujo(d, id, distractores)(rng);
  }
  const letras = Object.keys(GRUPOS_LETRA);
  const letra = elegir(rng, letras);
  const correcta = elegir(rng, GRUPOS_LETRA[letra] ?? []);
  const parecida = letra === "b" ? "v" : letra === "v" ? "b" : "";
  const otras = muestra(rng, letras.filter((l) => l !== letra && l !== parecida), 3);
  const distractores = otras.map((l) => opcionDibujo(elegir(rng, GRUPOS_LETRA[l] ?? [])));
  return pregunta(rng, {
    subhabilidad: SUB_INICIAL,
    dificultad: d,
    enunciado: `Toca el dibujo que empieza con la letra «${letra}».`,
    enunciadoFacil: `Toca el dibujo que empieza con «${letra}».`,
    respuesta: { tipo: "imagen", correcta: opcionDibujo(correcta), distractores },
    pista: "Di en voz baja el nombre de cada dibujo. Escucha cómo empieza.",
    explicacion: `«${mayuscula(palabra(correcta).texto)}» empieza con la letra ${letra}.`,
    plantilla: `${SUB_INICIAL}/${correcta}/al-reves`,
  });
};

// ---------- LEE1-T1-b: sílabas ----------
const SUB_SILABAS = "LEE1-T1-b";
const SIN_DIPTONGO_CORTAS: readonly ObjetoId[] = ["pan", "sol", "flor", "tren", "pez", "mesa", "luna", "gato", "casa", "mano", "pelota", "moneda", "zapato"];
const SIN_DIPTONGO_LARGAS: readonly ObjetoId[] = ["mariposa", "bicicleta", "elefante", "manzana", "ventana", "botella", "mochila", "naranja"];
const PRIMERA_SILABA: readonly ObjetoId[] = ["mesa", "luna", "gato", "casa", "mano", "rana", "moneda", "pelota", "zapato", "mochila", "tijeras", "vaca", "dado", "pera"];
const ULTIMA_SILABA: readonly ObjetoId[] = ["pelota", "moneda", "zapato", "ventana", "manzana", "mochila", "botella", "mariposa", "naranja", "elefante", "bicicleta", "vaca", "rana"];

function separada(id: ObjetoId): string {
  return palabra(id).silabas.join("-");
}

function contarSilabas(rng: Rng, d: Dificultad, id: ObjetoId, opciones: readonly number[]): Pregunta {
  const w = palabra(id);
  const n = w.silabas.length;
  return pregunta(rng, {
    subhabilidad: SUB_SILABAS,
    dificultad: d,
    enunciado: `¿Cuántas sílabas tiene la palabra «${w.texto}»?`,
    enunciadoFacil: `Lee: ${w.texto}. ¿Cuántas sílabas tiene?`,
    imagen: dibujo(id),
    respuesta: { tipo: "opcion", correcta: String(n), distractores: opciones.filter((x) => x !== n).map(String) },
    pista: "Di la palabra despacio y da una palmada en cada trozo.",
    explicacion: `«${mayuscula(w.texto)}» se parte así: ${separada(id)}. Tiene ${n} ${n === 1 ? "sílaba" : "sílabas"}.`,
    plantilla: `${SUB_SILABAS}/${id}/contar`,
  });
}

// Misma consonante con otra vocal, más otra sílaba de la palabra. Delante de e o i,
// la c y la g cambian de sonido: con ellas solo se usan a, o, u.
function silabasParecidas(silaba: string, otra: string): string[] {
  const consonante = silaba.slice(0, -1);
  const vocal = silaba.slice(-1);
  const vocales = consonante === "c" || consonante === "g" ? ["a", "o", "u"] : ["a", "e", "i", "o"];
  const salida = [otra, ...vocales.filter((v) => v !== vocal).map((v) => `${consonante}${v}`)];
  return [...new Set(salida)].filter((x) => x !== silaba).slice(0, 3);
}

const silabasFacil: Generador = (rng, d) => contarSilabas(rng, d, elegir(rng, SIN_DIPTONGO_CORTAS), [1, 2, 3]);

const silabasMedia: Generador = (rng, d) => {
  const id = elegir(rng, PRIMERA_SILABA);
  const w = palabra(id);
  const primera = w.silabas[0] ?? "";
  return pregunta(rng, {
    subhabilidad: SUB_SILABAS,
    dificultad: d,
    enunciado: `¿Con qué sílaba empieza la palabra «${w.texto}»?`,
    enunciadoFacil: `Lee: ${w.texto}. ¿Cuál es la primera sílaba?`,
    imagen: dibujo(id),
    respuesta: { tipo: "opcion", correcta: primera, distractores: silabasParecidas(primera, w.silabas[1] ?? "") },
    pista: "Di la palabra despacio. Quédate con el primer trozo.",
    explicacion: `«${mayuscula(w.texto)}» se parte así: ${separada(id)}. Empieza con ${primera}.`,
    plantilla: `${SUB_SILABAS}/${id}/primera`,
  });
};

const silabasDificil: Generador = (rng, d) => {
  if (rng() < 0.5) return contarSilabas(rng, d, elegir(rng, SIN_DIPTONGO_LARGAS), [2, 3, 4, 5]);
  const id = elegir(rng, ULTIMA_SILABA);
  const w = palabra(id);
  const ultima = w.silabas[w.silabas.length - 1] ?? "";
  return pregunta(rng, {
    subhabilidad: SUB_SILABAS,
    dificultad: d,
    enunciado: `¿Con qué sílaba termina la palabra «${w.texto}»?`,
    enunciadoFacil: `Lee: ${w.texto}. ¿Cuál es la última sílaba?`,
    imagen: dibujo(id),
    respuesta: { tipo: "opcion", correcta: ultima, distractores: silabasParecidas(ultima, w.silabas[w.silabas.length - 2] ?? "") },
    pista: "Di la palabra despacio. Quédate con el último trozo.",
    explicacion: `«${mayuscula(w.texto)}» se parte así: ${separada(id)}. Termina con ${ultima}.`,
    plantilla: `${SUB_SILABAS}/${id}/ultima`,
  });
};

// ---------- LEE1-T1-c: unir palabra e imagen (se ve el dibujo, se elige la palabra) ----------
const SUB_UNIR = "LEE1-T1-c";

// `inicial`: empiezan igual. `casi`: se escriben casi igual. Ninguna nombra lo dibujado.
const PALABRA_DEL_DIBUJO: readonly { readonly id: ObjetoId; readonly inicial: readonly string[]; readonly casi: readonly string[] }[] = [
  { id: "gato", inicial: ["gorro", "goma", "gota"], casi: ["pato", "plato", "gasto"] },
  { id: "sol", inicial: ["silla", "sopa", "sapo"], casi: ["sal", "col", "gol"] },
  { id: "pan", inicial: ["pez", "pera", "pato"], casi: ["paz", "pie", "van"] },
  { id: "casa", inicial: ["cuna", "cola", "copa"], casi: ["cosa", "cara", "caja"] },
  { id: "luna", inicial: ["lupa", "loro", "lata"], casi: ["cuna", "lana", "lona"] },
  { id: "mesa", inicial: ["mano", "mono", "moto"], casi: ["pesa", "masa", "meta"] },
  { id: "vaca", inicial: ["vaso", "vela", "vía"], casi: ["saca", "vara", "capa"] },
  { id: "pato", inicial: ["pera", "pelo", "piña"], casi: ["gato", "palo", "plato"] },
  { id: "rana", inicial: ["rosa", "rueda", "rojo"], casi: ["rama", "lana", "rata"] },
  { id: "mano", inicial: ["mesa", "mochila", "miel"], casi: ["mono", "malo", "mapa"] },
  { id: "dedo", inicial: ["dado", "dos", "día"], casi: ["dado", "miedo", "lado"] },
  { id: "dado", inicial: ["dedo", "dos", "día"], casi: ["dedo", "lado", "nado"] },
  { id: "oso", inicial: ["ocho", "ojo", "ola"], casi: ["ojo", "oro", "ola"] },
  { id: "pez", inicial: ["pan", "pera", "pato"], casi: ["pie", "paz", "vez"] },
  { id: "flor", inicial: ["fuego", "foca", "fila"], casi: ["flota", "sol", "color"] },
  { id: "tren", inicial: ["taza", "tigre", "tela"], casi: ["tres", "trece", "trapo"] },
  { id: "barco", inicial: ["bota", "beso", "bolsa"], casi: ["banco", "marco", "arco"] },
  { id: "huevo", inicial: ["hoja", "hilo", "humo"], casi: ["nuevo", "jueves", "hueso"] },
  { id: "uva", inicial: ["uña", "uno", "usar"], casi: ["una", "ala", "ave"] },
  { id: "llave", inicial: ["lluvia", "llama", "lleno"], casi: ["nave", "clave", "lleva"] },
];
const PALABRAS_LEJANAS = ["mesa", "casa", "tren", "sol", "uva", "pan", "libro", "gato", "barco", "flor", "mano", "oso", "luna", "pera", "vaca", "rana"] as const;

const unirPalabra: Generador = (rng, d) => {
  const item = elegir(rng, PALABRA_DEL_DIBUJO);
  const w = palabra(item.id).texto;
  const distractores =
    d === 1
      ? muestra(rng, PALABRAS_LEJANAS.filter((x) => inicial(x) !== inicial(w)), 2)
      : d === 2
        ? item.inicial
        : item.casi;
  return pregunta(rng, {
    subhabilidad: SUB_UNIR,
    dificultad: d,
    enunciado: "Mira el dibujo. ¿Qué palabra es?",
    enunciadoFacil: "Mira el dibujo. Elige su nombre.",
    imagen: dibujo(item.id),
    respuesta: { tipo: "opcion", correcta: w, distractores },
    pista: d === 3 ? "Las palabras se parecen. Lee cada una letra a letra." : "Di el nombre del dibujo. Busca la palabra que suena igual.",
    explicacion: `El dibujo muestra ${FEMENINOS.has(item.id) ? "una" : "un"} ${w}. Por eso la palabra es «${w}».`,
    plantilla: `${SUB_UNIR}/${item.id}`,
  });
};

const FEMENINOS: ReadonlySet<ObjetoId> = new Set<ObjetoId>(["casa", "luna", "mesa", "vaca", "rana", "mano", "flor", "uva", "llave"]);

// ---------- LEE1-T2-a: leer y elegir la imagen (se lee la palabra, se toca el dibujo) ----------
const SUB_ELEGIR = "LEE1-T2-a";
const ELEGIR_FACIL: readonly ObjetoId[] = ["sol", "casa", "gato", "pan", "mesa", "luna", "oso", "tren", "uva", "flor", "pez", "mano", "libro", "barco"];
const MISMA_INICIAL: readonly (readonly ObjetoId[])[] = [
  ["mesa", "mano", "moneda", "mochila"], ["pato", "pera", "perro", "pan", "pelota"], ["luna", "libro", "lapiz", "lupa"],
  ["casa", "cama", "caja"], ["barco", "botella", "bicicleta"], ["vaca", "vaso", "ventana"], ["taza", "tren", "tijeras"],
];
// Palabras casi iguales al leerlas. Todas tienen dibujo.
const CASI_IGUALES: readonly (readonly ObjetoId[])[] = [
  ["gato", "pato", "dado"], ["casa", "cama", "caja", "taza"], ["luna", "lupa", "uva"], ["pera", "perro", "pez"],
  ["oso", "ojo", "sol"], ["dedo", "dado", "pato"], ["mano", "rana", "vaca"], ["botella", "estrella", "silla"], ["vaso", "vaca", "casa"],
];

function elegirImagen(rng: Rng, d: Dificultad, id: ObjetoId, otros: readonly ObjetoId[]): Pregunta {
  const w = palabra(id).texto;
  return pregunta(rng, {
    subhabilidad: SUB_ELEGIR,
    dificultad: d,
    enunciado: `Lee la palabra «${w}». Toca su dibujo.`,
    enunciadoFacil: `Lee: ${w}. Toca el dibujo.`,
    respuesta: { tipo: "imagen", correcta: opcionDibujo(id), distractores: otros.map(opcionDibujo) },
    pista: d === 1 ? "Lee la palabra despacio, letra a letra." : "Lee todas las letras, no solo la primera.",
    explicacion: `Hay que tocar el dibujo de «${w}»: es lo que dice la palabra.`,
    plantilla: `${SUB_ELEGIR}/${id}`,
  });
}

const elegirFacil: Generador = (rng, d) => {
  const id = elegir(rng, ELEGIR_FACIL);
  const w = palabra(id).texto;
  return elegirImagen(rng, d, id, muestra(rng, ELEGIR_FACIL.filter((x) => inicial(palabra(x).texto) !== inicial(w)), 2));
};

function deUnGrupo(rng: Rng, d: Dificultad, grupos: readonly (readonly ObjetoId[])[], n: number): Pregunta {
  const conjunto = elegir(rng, grupos);
  const id = elegir(rng, conjunto);
  const otros = conjunto.filter((x) => x !== id);
  return elegirImagen(rng, d, id, muestra(rng, otros, Math.min(n, otros.length)));
}

// ---------- LEE1-T2-b: completar la palabra ----------
const SUB_COMPLETAR = "LEE1-T2-b";

type Hueco = readonly [ObjetoId, string, string, readonly string[]];

// Tablas escritas a mano: ningún hueco acaba en la vocal final de un animal (gata, pata)
// ni deja formar una palabra malsonante. El dibujo decide entre palabras reales.
const HUECOS: Readonly<Record<Dificultad, readonly Hueco[]>> = {
  1: [
    ["casa", "c_sa", "a", ["o", "u"]], ["luna", "l_na", "u", ["a", "e"]], ["gato", "g_to", "a", ["o", "u"]], ["mesa", "m_sa", "e", ["a", "o"]],
    ["sol", "s_l", "o", ["a", "e"]], ["rana", "r_na", "a", ["e", "o"]], ["mano", "m_no", "a", ["e", "o"]], ["pera", "p_ra", "e", ["a", "o"]],
    ["uva", "_va", "u", ["a", "o"]], ["dado", "d_do", "a", ["e", "o"]], ["vaca", "v_ca", "a", ["e", "o"]], ["taza", "t_za", "a", ["o", "e"]],
    ["pan", "p_n", "a", ["e", "o"]], ["silla", "s_lla", "i", ["a", "e"]],
  ],
  2: [
    ["pera", "pe_a", "r", ["l", "s", "n"]], ["luna", "lu_a", "n", ["p", "s", "c"]], ["gato", "ga_o", "t", ["l", "s", "d"]], ["casa", "ca_a", "s", ["m", "j", "r"]],
    ["mesa", "me_a", "s", ["t", "l", "n"]], ["rana", "ra_a", "n", ["m", "t", "p"]], ["mano", "ma_o", "n", ["p", "l", "r"]], ["dado", "da_o", "d", ["t", "m", "l"]],
    ["vaca", "va_a", "c", ["r", "s", "l"]], ["llave", "lla_e", "v", ["m", "n", "t"]], ["libro", "li_ro", "b", ["t", "d", "p"]], ["pato", "pa_o", "t", ["l", "s", "n"]],
    ["oso", "o_o", "s", ["j", "r", "l"]], ["ojo", "o_o", "j", ["s", "r", "l"]], ["taza", "ta_a", "z", ["p", "r", "l"]], ["pelota", "pe_ota", "l", ["r", "d", "s"]],
  ],
  3: [
    ["tren", "t_en", "r", ["l", "a", "e"]], ["libro", "lib_o", "r", ["l", "a", "e"]], ["flor", "f_or", "l", ["r", "a", "e"]], ["estrella", "est_ella", "r", ["l", "a", "e"]],
    ["barco", "ba_co", "r", ["n", "l", "s"]], ["puerta", "pue_ta", "r", ["s", "l", "n"]], ["arbol", "á_bol", "r", ["l", "n", "s"]], ["manzana", "man_ana", "z", ["t", "l", "r"]],
    ["mariposa", "mari__sa", "po", ["pe", "pa", "bo"]], ["pelota", "pe__ta", "lo", ["la", "le", "ro"]], ["bicicleta", "bici__ta", "cle", ["cla", "cli", "ple"]],
    ["elefante", "ele__te", "fan", ["fen", "fon", "tan"]], ["ventana", "ven__na", "ta", ["te", "to", "da"]], ["naranja", "na__ja", "ran", ["ren", "ron", "ra"]], ["mochila", "mo__la", "chi", ["che", "cha", "ni"]],
  ],
};

const completarPalabra: Generador = (rng, d) => {
  const [id, patron, correcta, distractores] = elegir(rng, HUECOS[d]);
  const w = palabra(id).texto;
  const trozo = correcta.length === 1 ? "letra" : "sílaba";
  return pregunta(rng, {
    subhabilidad: SUB_COMPLETAR,
    dificultad: d,
    enunciado: `Mira el dibujo. ¿Qué ${trozo} falta en «${patron}»?`,
    enunciadoFacil: `Mira el dibujo. Lee: ${patron}. ¿Qué ${trozo} falta?`,
    imagen: dibujo(id),
    respuesta: { tipo: "opcion", correcta, distractores },
    pista: "Di el nombre del dibujo despacio. Escucha el trozo que falta.",
    explicacion: `Con ${correcta} se forma la palabra «${w}», que es lo que muestra el dibujo.`,
    plantilla: `${SUB_COMPLETAR}/${id}/${d}`,
  });
};

// ---------- LEE1-T2-c: palabras de la misma familia ----------
const SUB_FAMILIA = "LEE1-T2-c";

const FAMILIAS: readonly { readonly raiz: string; readonly familia: readonly string[]; readonly parecidas: readonly string[] }[] = [
  { raiz: "pan", familia: ["panadero", "panadería", "panecillo"], parecidas: ["pantalón", "pantalla"] },
  { raiz: "flor", familia: ["florero", "florista", "florecer"], parecidas: ["flecha", "flauta"] },
  { raiz: "zapato", familia: ["zapatero", "zapatería", "zapatilla"], parecidas: ["zanahoria", "zanja"] },
  { raiz: "libro", familia: ["librería", "librero", "librito"], parecidas: ["libre", "liebre"] },
  { raiz: "jardín", familia: ["jardinero", "jardinería", "jardincito"], parecidas: ["jarra", "jarabe"] },
  { raiz: "pelo", familia: ["peluquero", "peluquería", "peludo"], parecidas: ["pelota", "película"] },
  { raiz: "mar", familia: ["marinero", "marino", "submarino"], parecidas: ["martillo", "marrón"] },
  { raiz: "sal", familia: ["salero", "salado", "salada"], parecidas: ["salto", "salir"] },
  { raiz: "leche", familia: ["lechero", "lechera", "lechería"], parecidas: ["lejos", "lento"] },
  { raiz: "fruta", familia: ["frutero", "frutería", "frutal"], parecidas: ["frío", "frente"] },
  { raiz: "papel", familia: ["papelera", "papelería", "papelito"], parecidas: ["papá", "paloma"] },
  { raiz: "nube", familia: ["nublado", "nuboso", "nubecita"], parecidas: ["nuevo", "nuez"] },
];
const PALABRAS_SUELTAS = ["mesa", "gato", "río", "silla", "reloj", "camino", "ventana", "tijeras"] as const;
const PISTA_FAMILIA = "Las palabras de una familia se parecen y hablan de lo mismo.";

const familiaFacilOMedia: Generador = (rng, d) => {
  const f = elegir(rng, FAMILIAS);
  const correcta = elegir(rng, f.familia);
  const distractores = d === 1 ? muestra(rng, PALABRAS_SUELTAS, 2) : f.parecidas;
  const nota = d === 1 ? "" : ` «${mayuscula(f.parecidas[0] ?? "")}» se parece, pero no habla de lo mismo.`;
  return pregunta(rng, {
    subhabilidad: SUB_FAMILIA,
    dificultad: d,
    enunciado: `¿Qué palabra es de la familia de «${f.raiz}»?`,
    enunciadoFacil: `Lee: ${f.raiz}. ¿Qué palabra es de su familia?`,
    respuesta: { tipo: "opcion", correcta, distractores },
    pista: PISTA_FAMILIA,
    explicacion: `«${mayuscula(correcta)}» es de la familia de «${f.raiz}»: viene de esa palabra.${nota}`,
    plantilla: `${SUB_FAMILIA}/${f.raiz}/${correcta}`,
  });
};

const familiaDificil: Generador = (rng, d) => {
  const f = elegir(rng, FAMILIAS);
  const correcta = elegir(rng, f.parecidas);
  return pregunta(rng, {
    subhabilidad: SUB_FAMILIA,
    dificultad: d,
    enunciado: `¿Qué palabra NO es de la familia de «${f.raiz}»?`,
    enunciadoFacil: `Lee: ${f.raiz}. Una palabra NO es de su familia. ¿Cuál?`,
    respuesta: { tipo: "opcion", correcta, distractores: muestra(rng, f.familia, 2) },
    pista: "Una palabra empieza parecido, pero habla de otra cosa.",
    explicacion: `«${mayuscula(correcta)}» se parece a «${f.raiz}», pero no viene de esa palabra. Las otras dos, sí.`,
    plantilla: `${SUB_FAMILIA}/${f.raiz}/no/${correcta}`,
  });
};

// ---------- LEE1-T3-a: frase e imagen ----------
const SUB_FRASE = "LEE1-T3-a";

const FRASE_DIBUJO: readonly (readonly [string, ObjetoId, readonly ObjetoId[]])[] = [
  ["El pez nada en el agua.", "pez", ["gato", "vaca"]], ["El pájaro vuela.", "pajaro", ["pez", "oso"]], ["La vaca come hierba.", "vaca", ["pez", "reloj"]],
  ["El sol da luz.", "sol", ["silla", "zapato"]], ["El tren va por la vía.", "tren", ["barco", "avion"]], ["El barco va por el mar.", "barco", ["tren", "bicicleta"]],
  ["La llave abre la puerta.", "llave", ["pan", "pelota"]], ["El avión vuela alto.", "avion", ["barco", "bicicleta"]], ["La niña lee un libro.", "libro", ["zapato", "pan"]],
  ["La rana salta.", "rana", ["pez", "mesa"]], ["Mi perro ladra.", "perro", ["pez", "rana"]], ["Bebo agua en el vaso.", "vaso", ["pelota", "reloj"]],
];

// Adivinanzas: la frase no nombra lo dibujado, hay que entenderla.
const ADIVINANZAS: readonly (readonly [string, ObjetoId, readonly ObjetoId[]])[] = [
  ["Sirve para abrir la puerta.", "llave", ["pan", "pelota"]], ["Sirve para cortar papel.", "tijeras", ["vaso", "mesa"]], ["Nos dice la hora.", "reloj", ["pera", "zapato"]],
  ["Nos tapa de la lluvia.", "paraguas", ["pan", "dado"]], ["Sale de noche en el cielo.", "luna", ["pez", "silla"]], ["Tiene ruedas y la mueves con los pies.", "bicicleta", ["barco", "avion"]],
  ["Sirve para lavarse las manos.", "jabon", ["pelota", "lapiz"]], ["Sirve para sentarse.", "silla", ["lupa", "huevo"]],
];

function fraseImagen(rng: Rng, d: Dificultad, frase: string, correcta: { texto: string; imagen: Imagen }, distractores: readonly { texto: string; imagen: Imagen }[], plantilla: string, explicacion: string): Pregunta {
  return pregunta(rng, {
    subhabilidad: SUB_FRASE,
    dificultad: d,
    enunciado: `Lee la frase: «${frase}» Toca el dibujo que va con ella.`,
    enunciadoFacil: `Lee: ${frase} Toca el dibujo.`,
    respuesta: { tipo: "imagen", correcta, distractores },
    pista: "Lee toda la frase despacio. Después mira todos los dibujos.",
    explicacion,
    plantilla: `${SUB_FRASE}/${plantilla}`,
  });
}

const fraseFacil: Generador = (rng, d) => {
  const [frase, id, otros] = elegir(rng, FRASE_DIBUJO);
  return fraseImagen(rng, d, frase, opcionDibujo(id), otros.map(opcionDibujo), id, `El dibujo correcto es «${palabra(id).texto}»: de eso habla la frase.`);
};

function grupoOpcion(n: number, c: Contable): { texto: string; imagen: Imagen } {
  return { texto: etiquetaGrupo(n, c), imagen: objetos([c, n]) };
}

const fraseMedia: Generador = (rng, d) => {
  const [c, otra] = muestra(rng, SERES, 2) as [Contable, Contable];
  const n = entero(rng, 2, 5);
  const m = rng() < 0.5 ? n + 1 : n - 1;
  const frase = `Hay ${grupo(n, c)}.`;
  return fraseImagen(rng, d, frase, grupoOpcion(n, c), [grupoOpcion(m, c), grupoOpcion(n, otra)], `${c.id}/${n}`, `La frase dice que hay ${grupo(n, c)}. Ese dibujo tiene ${grupo(n, c)}.`);
};

const fraseDificil: Generador = (rng, d) => {
  if (rng() < 0.4) {
    const [frase, id, otros] = elegir(rng, ADIVINANZAS);
    return fraseImagen(rng, d, frase, opcionDibujo(id), otros.map(opcionDibujo), `adivinanza/${id}`, `El dibujo correcto es «${palabra(id).texto}»: de eso habla la frase.`);
  }
  const [a, b] = muestra(rng, SERES, 2) as [Contable, Contable];
  const n = entero(rng, 2, 4);
  const m = entero(rng, 1, n - 1);
  const dibujoDe = (x: number, y: number) => ({ texto: `${etiquetaGrupo(x, a)} y ${etiquetaGrupo(y, b)}`, imagen: objetos([a, x], [b, y]) });
  const frase = `Hay ${grupo(n, a)} y ${grupo(m, b)}.`;
  return fraseImagen(rng, d, frase, dibujoDe(n, m), [dibujoDe(m, n), dibujoDe(n, n)], `${a.id}/${b.id}/${n}/${m}`, `La frase dice ${grupo(n, a)} y ${grupo(m, b)}. Hay que mirar las dos cantidades.`);
};

// ---------- LEE1-T3-b: ordenar palabras ----------
const SUB_ORDENAR = "LEE1-T3-b";

// Los desórdenes separan siempre artículo y nombre, así ninguno es una frase válida.
const FRASES_ORDENAR: Readonly<Record<Dificultad, { readonly frases: readonly string[]; readonly desordenes: readonly (readonly number[])[] }>> = {
  1: {
    frases: ["el gato duerme", "el perro corre", "el pez nada", "la luna brilla", "el pájaro canta", "la rana salta", "el tren llega", "la niña lee", "el sol sale"],
    desordenes: [[1, 2, 0], [2, 1, 0]],
  },
  2: {
    frases: ["el gato bebe agua", "la vaca come hierba", "el niño lee cuentos", "la niña toma sopa", "mi hermana canta bien", "el pájaro come semillas", "la maestra escribe letras", "mi perro corre mucho"],
    desordenes: [[1, 0, 3, 2], [3, 2, 1, 0]],
  },
  3: {
    frases: ["el perro come un hueso", "la niña lee un libro", "el niño tiene una pelota", "mi hermano lava los vasos", "la maestra abre la puerta", "el pato busca un pez", "la abuela riega las flores", "el panadero hace el pan"],
    desordenes: [[1, 0, 4, 3, 2], [2, 3, 0, 1, 4], [4, 3, 2, 1, 0]],
  },
};

function frase(palabras: readonly string[]): string {
  return `${mayuscula(palabras.join(" "))}.`;
}

const ordenarPalabras: Generador = (rng, d) => {
  const { frases, desordenes } = FRASES_ORDENAR[d];
  const texto = elegir(rng, frases);
  const palabras = texto.split(" ");
  const mezcla = barajar(rng, palabras);
  const fichas = mezcla.join(" ") === texto ? [...palabras].reverse() : mezcla;
  const correcta = frase(palabras);
  return pregunta(rng, {
    subhabilidad: SUB_ORDENAR,
    dificultad: d,
    enunciado: "Ordena estas palabras. ¿Qué frase está bien escrita?",
    enunciadoFacil: "Mira las palabras. ¿Qué frase está bien?",
    imagen: { tipo: "serie", elementos: fichas.map((f) => ({ texto: f })) },
    respuesta: { tipo: "opcion", correcta, distractores: desordenes.map((o) => frase(o.map((i) => palabras[i] ?? ""))) },
    pista: "Lee cada frase en voz baja. Busca la que suena bien y se entiende.",
    explicacion: `«${correcta}» es la frase que se entiende. En las otras, las palabras están mal colocadas.`,
    plantilla: `${SUB_ORDENAR}/${texto}`,
  });
};

// ---------- LEE1-T3-c: verdadero o falso ----------
// Con solo dos opciones no se puede: se elige la frase verdadera entre tres.
const SUB_VERDAD = "LEE1-T3-c";

const verdadFacil: Generador = (rng, d) => {
  const [c, otra] = muestra(rng, SERES, 2) as [Contable, Contable];
  const n = entero(rng, 2, 5);
  const correcta = `Hay ${grupo(n, c)}.`;
  return pregunta(rng, {
    subhabilidad: SUB_VERDAD,
    dificultad: d,
    enunciado: "Mira el dibujo. ¿Qué frase es verdadera?",
    enunciadoFacil: "Mira el dibujo. Una frase es verdad. ¿Cuál?",
    imagen: objetos([c, n]),
    respuesta: { tipo: "opcion", correcta, distractores: [`Hay ${grupo(n + 1, c)}.`, `Hay ${grupo(n, otra)}.`] },
    pista: "Cuenta lo que ves. Después lee las frases.",
    explicacion: `En el dibujo hay ${grupo(n, c)}, por eso esa frase es verdadera.`,
    plantilla: `${SUB_VERDAD}/${c.id}/${n}`,
  });
};

const VERDADES: readonly (readonly [string, readonly [string, string]])[] = [
  ["Los peces nadan.", ["Los peces vuelan.", "Los peces leen."]],
  ["El sol da luz.", ["El sol es un animal.", "El sol es de agua."]],
  ["Los pájaros tienen plumas.", ["Los pájaros tienen ruedas.", "Los pájaros son mesas."]],
  ["El fuego quema.", ["El fuego está frío.", "El fuego se bebe."]],
  ["Los perros ladran.", ["Los perros tienen alas.", "Los perros son plantas."]],
  ["El agua moja.", ["El agua es de papel.", "El agua canta."]],
  ["La noche es oscura.", ["La noche tiene patas.", "La noche es un pez."]],
  ["Las vacas comen hierba.", ["Las vacas vuelan.", "Las vacas comen piedras."]],
];

const verdadMedia: Generador = (rng, d) => {
  const [correcta, distractores] = elegir(rng, VERDADES);
  return pregunta(rng, {
    subhabilidad: SUB_VERDAD,
    dificultad: d,
    enunciado: "¿Qué frase es verdadera?",
    enunciadoFacil: "Una frase es verdad. ¿Cuál?",
    respuesta: { tipo: "opcion", correcta, distractores },
    pista: "Piensa en cada frase. ¿Eso pasa de verdad?",
    explicacion: `«${correcta}» es lo que pasa de verdad. Las otras frases no pueden ser.`,
    plantilla: `${SUB_VERDAD}/${correcta}`,
  });
};

// ---------- LEE1-T4-a: seguir una orden ----------
const SUB_ORDEN = "LEE1-T4-a";

const FIGURAS: readonly { readonly forma: FormaId; readonly nombre: string; readonly genero: "m" | "f" }[] = [
  { forma: "circulo", nombre: "círculo", genero: "m" }, { forma: "cuadrado", nombre: "cuadrado", genero: "m" },
  { forma: "triangulo", nombre: "triángulo", genero: "m" }, { forma: "estrella", nombre: "estrella", genero: "f" },
];
type Figura = (typeof FIGURAS)[number];

const COLORES_ORDEN: readonly ColorId[] = ["rojo", "azul", "verde", "amarillo", "morado"];

function colorEn(color: ColorId, genero: "m" | "f"): string {
  return genero === "f" && color.endsWith("o") ? `${color.slice(0, -1)}a` : color;
}

function figura(f: Figura, color: ColorId): { texto: string; imagen: Imagen } {
  return { texto: `${f.nombre} ${colorEn(color, f.genero)}`, imagen: { tipo: "figura", forma: f.forma, color } };
}

function artDe(f: Figura, definido: boolean): string {
  if (definido) return f.genero === "m" ? "el" : "la";
  return f.genero === "m" ? "un" : "una";
}

function ordenFigura(rng: Rng, d: Dificultad, orden: string, correcta: { texto: string; imagen: Imagen }, distractores: readonly { texto: string; imagen: Imagen }[], explicacion: string): Pregunta {
  return pregunta(rng, {
    subhabilidad: SUB_ORDEN,
    dificultad: d,
    enunciado: `Lee la orden y hazla: ${orden}`,
    enunciadoFacil: orden,
    respuesta: { tipo: "imagen", correcta, distractores },
    pista: d === 3 ? "Fíjate bien en la palabra «no»." : d === 2 ? "Lee la orden entera. Fíjate en la forma y en el color." : "Lee la orden entera. Fíjate en la forma.",
    explicacion,
    plantilla: `${SUB_ORDEN}/${correcta.texto}/${orden}`,
  });
}

const ordenFacil: Generador = (rng, d) => {
  const [a, b, c] = muestra(rng, FIGURAS, 3) as [Figura, Figura, Figura];
  const color = elegir(rng, COLORES_ORDEN);
  return ordenFigura(rng, d, `Toca ${artDe(a, true)} ${a.nombre}.`, figura(a, color), [figura(b, color), figura(c, color)], `La orden pide ${artDe(a, true)} ${a.nombre}.`);
};

const LUGARES: readonly (readonly [ObjetoId, string])[] = [["mesa", "en la mesa"], ["silla", "en la silla"], ["caja", "en la caja"], ["cama", "en la cama"], ["mochila", "en la mochila"]];
const COSAS: readonly (readonly [ObjetoId, string])[] = [["libro", "el libro"], ["vaso", "el vaso"], ["lapiz", "el lápiz"], ["pelota", "la pelota"], ["zapato", "el zapato"], ["llave", "la llave"]];

const ordenMedia: Generador = (rng, d) => {
  if (rng() < 0.5) {
    const [a, b] = muestra(rng, FIGURAS, 2) as [Figura, Figura];
    const [c1, c2] = muestra(rng, COLORES_ORDEN, 2) as [ColorId, ColorId];
    const orden = `Toca ${artDe(a, true)} ${a.nombre} ${colorEn(c1, a.genero)}.`;
    return ordenFigura(rng, d, orden, figura(a, c1), [figura(a, c2), figura(b, c1), figura(b, c2)], `La orden pide ${artDe(a, true)} ${a.nombre} ${colorEn(c1, a.genero)}. Hay que mirar la forma y el color.`);
  }
  const [cosaId, cosa] = elegir(rng, COSAS);
  const [[lugarId, lugar], [otroId]] = muestra(rng, LUGARES, 2) as [readonly [ObjetoId, string], readonly [ObjetoId, string]];
  const orden = `Pon ${cosa} ${lugar}.`;
  return pregunta(rng, {
    subhabilidad: SUB_ORDEN,
    dificultad: d,
    enunciado: `Lee la orden: «${orden}» Toca el lugar donde ${cosa.startsWith("la") ? "la" : "lo"} pones.`,
    enunciadoFacil: `Lee: ${orden} ¿Dónde va ${cosa}? Toca el dibujo.`,
    respuesta: { tipo: "imagen", correcta: opcionDibujo(lugarId), distractores: [opcionDibujo(otroId), opcionDibujo(cosaId)] },
    pista: "Busca en la orden el lugar: va después de la palabra «en».",
    explicacion: `La orden dice «${lugar}». Ese es el lugar.`,
    plantilla: `${SUB_ORDEN}/${cosaId}/${lugarId}`,
  });
};

const ordenDificil: Generador = (rng, d) => {
  const [a, b] = muestra(rng, FIGURAS, 2) as [Figura, Figura];
  const [c1, c2, c3] = muestra(rng, COLORES_ORDEN, 3) as [ColorId, ColorId, ColorId];
  const tipo = elegir(rng, [0, 1, 2]);
  if (tipo === 0) {
    const [x, y, z] = muestra(rng, FIGURAS, 3) as [Figura, Figura, Figura];
    return ordenFigura(rng, d, `Toca la figura que no es ${colorEn(c1, "f")}.`, figura(z, c2), [figura(x, c1), figura(y, c1)], `Las otras dos figuras son de color ${c1}. Solo ${artDe(z, true)} ${z.nombre} no lo es.`);
  }
  if (tipo === 1) {
    const orden = `Toca ${artDe(a, true)} ${a.nombre} que no es ${colorEn(c1, a.genero)}.`;
    return ordenFigura(rng, d, orden, figura(a, c2), [figura(a, c1), figura(b, c3)], `Solo hay dos figuras con forma de ${a.nombre}, y una es de color ${c1}. La correcta es la otra.`);
  }
  const circulo = FIGURAS[0] as Figura;
  const [otra] = muestra(rng, FIGURAS.filter((f) => f !== circulo), 1) as [Figura];
  const orden = `Toca la figura ${colorEn(c1, "f")} que no es un círculo.`;
  return ordenFigura(rng, d, orden, figura(otra, c1), [figura(circulo, c1), figura(otra, c2)], `Hay dos figuras de color ${c1}. Una es un círculo. La correcta es ${artDe(otra, false)} ${otra.nombre}.`);
};

// ---------- LEE1-T4-b: ordenar los pasos ----------
const SUB_PASOS = "LEE1-T4-b";

const PASOS: readonly { readonly id: string; readonly para: string; readonly objeto?: ObjetoId; readonly pasos: readonly [string, string, string] }[] = [
  { id: "manos", para: "lavarte las manos", objeto: "jabon", pasos: ["Te mojas las manos", "Te frotas con jabón", "Te enjuagas con agua"] },
  { id: "libro", para: "leer un libro", objeto: "libro", pasos: ["Abres el libro", "Lees", "Cierras el libro"] },
  { id: "semilla", para: "sembrar una semilla", objeto: "flor", pasos: ["Haces un hoyo", "Pones la semilla", "Tapas el hoyo con tierra"] },
  { id: "beber", para: "beber agua", objeto: "vaso", pasos: ["Tomas un vaso", "Echas agua en el vaso", "Bebes"] },
  { id: "mochila", para: "guardar el lápiz en la mochila", objeto: "mochila", pasos: ["Abres la mochila", "Metes el lápiz", "Cierras la mochila"] },
  { id: "calle", para: "cruzar la calle", pasos: ["Te paras", "Miras a los dos lados", "Cruzas"] },
  { id: "salir", para: "salir de casa", objeto: "puerta", pasos: ["Abres la puerta", "Sales", "Cierras la puerta"] },
  { id: "manzana", para: "comer una manzana", objeto: "manzana", pasos: ["Lavas la manzana", "La cortas", "La comes"] },
  { id: "regar", para: "regar una flor", objeto: "botella", pasos: ["Llenas la botella", "Llevas el agua hasta la flor", "Echas el agua"] },
  { id: "dibujar", para: "hacer un dibujo", objeto: "lapiz", pasos: ["Tomas el lápiz", "Dibujas", "Guardas el lápiz"] },
  { id: "caja", para: "guardar la pelota en la caja", objeto: "caja", pasos: ["Abres la caja", "Metes la pelota", "Cierras la caja"] },
  { id: "dormir", para: "dormir", objeto: "cama", pasos: ["Te acuestas", "Cierras los ojos", "Te duermes"] },
  { id: "llave", para: "abrir la puerta con llave", objeto: "llave", pasos: ["Metes la llave", "Giras la llave", "Abres la puerta"] },
];

function minuscula(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

function lista(a: string, b: string, c: string): string {
  return `${a}, ${minuscula(b)} y ${minuscula(c)}.`;
}

const ordenarPasos: Generador = (rng, d) => {
  const item = elegir(rng, PASOS);
  const [p1, p2, p3] = item.pasos;
  const imagen = item.objeto === undefined ? {} : { imagen: dibujo(item.objeto) };
  const comun = { subhabilidad: SUB_PASOS, dificultad: d, ...imagen, plantilla: `${SUB_PASOS}/${item.id}` };
  if (d === 1) {
    return pregunta(rng, {
      ...comun,
      enunciado: `Para ${item.para}, ¿qué haces primero?`,
      enunciadoFacil: `Quieres ${item.para}. ¿Qué haces primero?`,
      respuesta: { tipo: "opcion", correcta: p1, distractores: [p2, p3] },
      pista: "Imagina que lo haces. ¿Por dónde empiezas?",
      explicacion: `Primero: «${minuscula(p1)}». Después vienen los otros pasos.`,
    });
  }
  if (d === 2) {
    return pregunta(rng, {
      ...comun,
      enunciado: `Para ${item.para}, ¿qué haces al final?`,
      enunciadoFacil: `Quieres ${item.para}. ¿Qué haces al final?`,
      respuesta: { tipo: "opcion", correcta: p3, distractores: [p1, p2] },
      pista: "Imagina que lo haces. ¿Con qué terminas?",
      explicacion: `Primero: «${minuscula(p1)}». Después: «${minuscula(p2)}». Al final: «${minuscula(p3)}».`,
    });
  }
  return pregunta(rng, {
    ...comun,
    enunciado: `Quieres ${item.para}. ¿Qué orden es el correcto?`,
    enunciadoFacil: `Quieres ${item.para}. ¿Qué orden está bien?`,
    respuesta: { tipo: "opcion", correcta: lista(p1, p2, p3), distractores: [lista(p2, p1, p3), lista(p3, p2, p1)] },
    pista: "Busca primero el paso que va al principio.",
    explicacion: `Primero: «${minuscula(p1)}». Después: «${minuscula(p2)}». Al final: «${minuscula(p3)}».`,
  });
};

export const GENERADORES_CURSO1: MapaGeneradores = {
  [SUB_INICIAL]: [porDificultad({ 1: inicialFacil, 2: inicialMedia, 3: inicialDificil })],
  [SUB_SILABAS]: [porDificultad({ 1: silabasFacil, 2: silabasMedia, 3: silabasDificil })],
  [SUB_UNIR]: [unirPalabra],
  [SUB_ELEGIR]: [
    porDificultad({
      1: elegirFacil,
      2: (rng, d) => deUnGrupo(rng, d, MISMA_INICIAL, 2),
      3: (rng, d) => deUnGrupo(rng, d, CASI_IGUALES, 3),
    }),
  ],
  [SUB_COMPLETAR]: [completarPalabra],
  [SUB_FAMILIA]: [porDificultad({ 1: familiaFacilOMedia, 2: familiaFacilOMedia, 3: familiaDificil })],
  [SUB_FRASE]: [porDificultad({ 1: fraseFacil, 2: fraseMedia, 3: fraseDificil })],
  [SUB_ORDENAR]: [ordenarPalabras],
  [SUB_VERDAD]: [porDificultad({ 1: verdadFacil, 2: verdadMedia, 3: generadorDeTextos(SUB_VERDAD, TEXTOS_VERDAD) })],
  [SUB_ORDEN]: [porDificultad({ 1: ordenFacil, 2: ordenMedia, 3: ordenDificil })],
  [SUB_PASOS]: [ordenarPasos],
};

// Tablas expuestas para que los tests comprueben sus datos.
export const DATOS_CURSO1 = { HUECOS };
