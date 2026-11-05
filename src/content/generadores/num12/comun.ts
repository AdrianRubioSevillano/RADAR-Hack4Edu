// Herramientas compartidas por los generadores de NUM de 1.º y 2.º de primaria.
import type { Rng } from "../../../core/rng.ts";
import { ContenidoError, barajar, distractoresNumericos, elegir, type RespuestaBorrador } from "../../ayuda.ts";
import { lengua, tx } from "../../lengua.ts";
import type { Dificultad, ElementoSerie, FormaId, Imagen, ObjetoId } from "../../tipos.ts";

export function porD<T>(d: Dificultad, facil: T, media: T, dificil: T): T {
  return d === 1 ? facil : d === 2 ? media : dificil;
}

export type Rango = readonly [number, number];
export function porR(d: Dificultad, facil: Rango, media: Rango, dificil: Rango): Rango {
  return porD(d, facil, media, dificil);
}

export function en<T>(lista: readonly T[], i: number): T {
  const valor = lista[i];
  if (valor === undefined) throw new ContenidoError(`Índice fuera de la lista: ${i}`);
  return valor;
}

export function mayus(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Clave de plantilla: mismo modelo y mismos datos = misma pregunta en la práctica.
export function clave(sub: string, modelo: string, ...datos: readonly (string | number)[]): string {
  return `${sub}/${modelo}/${datos.join("-")}`;
}

export function suma(valores: readonly number[]): number {
  return valores.reduce((total, v) => total + v, 0);
}

// "3", "3 y 5", "3, 5 y 7".
export function listaY(valores: readonly (string | number)[]): string {
  const textos = valores.map(String);
  if (textos.length <= 1) return textos.join("");
  return `${textos.slice(0, -1).join(", ")} ${tx("y", "et", "ha")} ${textos[textos.length - 1] ?? ""}`;
}

// ---------- Unidades con concordancia ----------
export interface Unidad {
  readonly id?: ObjetoId; // solo si hay dibujo que la represente sin duda
  readonly singular: string;
  readonly plural: string;
  readonly genero: "m" | "f";
}

// Francés de cada unidad, por su nombre en español: [singular, plural, género].
const UNIDADES_FR: Readonly<Record<string, readonly [string, string, "m" | "f"]>> = {
  manzana: ["pomme", "pommes", "f"], pera: ["poire", "poires", "f"], naranja: ["orange", "oranges", "f"], lápiz: ["crayon", "crayons", "m"],
  libro: ["livre", "livres", "m"], cuaderno: ["cahier", "cahiers", "m"], mochila: ["sac à dos", "sacs à dos", "m"], pelota: ["ballon", "ballons", "m"],
  flor: ["fleur", "fleurs", "f"], pájaro: ["oiseau", "oiseaux", "m"], pato: ["canard", "canards", "m"], rana: ["grenouille", "grenouilles", "f"],
  gato: ["chat", "chats", "m"], perro: ["chien", "chiens", "m"], pez: ["poisson", "poissons", "m"], vaso: ["verre", "verres", "m"],
  taza: ["tasse", "tasses", "f"], botella: ["bouteille", "bouteilles", "f"], huevo: ["œuf", "œufs", "m"], silla: ["chaise", "chaises", "f"],
  gorro: ["bonnet", "bonnets", "m"], paraguas: ["parapluie", "parapluies", "m"], persona: ["personne", "personnes", "f"], "cubo de agua": ["seau d'eau", "seaux d'eau", "m"],
  semilla: ["graine", "graines", "f"], página: ["page", "pages", "f"], piedra: ["pierre", "pierres", "f"], rueda: ["roue", "roues", "f"],
};

function fr(u: Unidad): readonly [string, string, "m" | "f"] {
  const datos = UNIDADES_FR[u.singular];
  if (datos === undefined) throw new ContenidoError(`Unidad sin francés: ${u.singular}`);
  return datos;
}

const empiezaPorVocal = (texto: string): boolean => /^[aeiouéœ]/i.test(texto);

// En guaraní el nombre no cambia tras un número: 5 narã.
const UNIDADES_GN: Readonly<Record<string, string>> = {
  manzana: "manzana", pera: "pera", naranja: "narã", lápiz: "lápiz", libro: "aranduka", cuaderno: "kuaderno", mochila: "mochila", pelota: "pelota", flor: "yvoty", pájaro: "guyra",
  taza: "kópa", botella: "mbotella", huevo: "rupi'a", silla: "apyka", gorro: "akãngao", paraguas: "paraguas", persona: "tapicha", "cubo de agua": "balde y",
  semilla: "ra'ỹi", página: "rogue", piedra: "ita", rueda: "rueda",
};

function gn(u: Unidad): string {
  const nombre = UNIDADES_GN[u.singular];
  if (nombre === undefined) throw new ContenidoError(`Unidad sin guaraní: ${u.singular}`);
  return nombre;
}

export const sg = (u: Unidad): string => (lengua() === "fr" ? fr(u)[0] : lengua() === "gn" ? gn(u) : u.singular);
export const pl = (u: Unidad): string => (lengua() === "fr" ? fr(u)[1] : lengua() === "gn" ? gn(u) : u.plural);
// "de graines", "d'œufs".
export const dePl = (u: Unidad): string => (empiezaPorVocal(pl(u)) ? `d'${pl(u)}` : `de ${pl(u)}`);
// "un crayon", "une pomme".
export const unU = (u: Unidad): string => (lengua() === "fr" ? `${fr(u)[2] === "f" ? "une" : "un"} ${fr(u)[0]}` : "");
// "le crayon", "la pomme", "l'orange".
export const leU = (u: Unidad): string => (lengua() !== "fr" ? "" : empiezaPorVocal(fr(u)[0]) ? `l'${fr(u)[0]}` : `${fr(u)[2] === "f" ? "la" : "le"} ${fr(u)[0]}`);

export function cant(n: number, u: Unidad): string {
  return `${n} ${n === 1 ? sg(u) : pl(u)}`;
}
export const cuantos = (u: Unidad): string => (u.genero === "f" ? "Cuántas" : "Cuántos");
export const los = (u: Unidad): string => (u.genero === "f" ? "las" : "los");
export const el = (u: Unidad): string => (u.genero === "f" ? "la" : "el");
export const un = (u: Unidad): string => (u.genero === "f" ? "una" : "un");
export const quedan = (n: number): string => (n === 1 ? "Queda" : "Quedan");

export const MANZANA: Unidad = { id: "manzana", singular: "manzana", plural: "manzanas", genero: "f" };
export const PERA: Unidad = { id: "pera", singular: "pera", plural: "peras", genero: "f" };
export const NARANJA: Unidad = { id: "naranja", singular: "naranja", plural: "naranjas", genero: "f" };
export const LAPIZ: Unidad = { id: "lapiz", singular: "lápiz", plural: "lápices", genero: "m" };
export const LIBRO: Unidad = { id: "libro", singular: "libro", plural: "libros", genero: "m" };
export const CUADERNO: Unidad = { id: "cuaderno", singular: "cuaderno", plural: "cuadernos", genero: "m" };
export const MOCHILA: Unidad = { id: "mochila", singular: "mochila", plural: "mochilas", genero: "f" };
export const PELOTA: Unidad = { id: "pelota", singular: "pelota", plural: "pelotas", genero: "f" };
export const FLOR: Unidad = { id: "flor", singular: "flor", plural: "flores", genero: "f" };
export const PAJARO: Unidad = { id: "pajaro", singular: "pájaro", plural: "pájaros", genero: "m" };
export const PATO: Unidad = { id: "pato", singular: "pato", plural: "patos", genero: "m" };
export const RANA: Unidad = { id: "rana", singular: "rana", plural: "ranas", genero: "f" };
export const GATO: Unidad = { id: "gato", singular: "gato", plural: "gatos", genero: "m" };
export const PERRO: Unidad = { id: "perro", singular: "perro", plural: "perros", genero: "m" };
export const PEZ: Unidad = { id: "pez", singular: "pez", plural: "peces", genero: "m" };
export const VASO: Unidad = { id: "vaso", singular: "vaso", plural: "vasos", genero: "m" };
export const TAZA: Unidad = { id: "taza", singular: "taza", plural: "tazas", genero: "f" };
export const BOTELLA: Unidad = { id: "botella", singular: "botella", plural: "botellas", genero: "f" };
export const HUEVO: Unidad = { id: "huevo", singular: "huevo", plural: "huevos", genero: "m" };
export const SILLA: Unidad = { id: "silla", singular: "silla", plural: "sillas", genero: "f" };
export const GORRO: Unidad = { id: "gorro", singular: "gorro", plural: "gorros", genero: "m" };
export const PARAGUAS: Unidad = { id: "paraguas", singular: "paraguas", plural: "paraguas", genero: "m" };
// Sin dibujo: "cubo" puede leerse como figura y las personas no están en el catálogo.
export const PERSONA: Unidad = { singular: "persona", plural: "personas", genero: "f" };
export const CUBO_AGUA: Unidad = { singular: "cubo de agua", plural: "cubos de agua", genero: "m" };
export const SEMILLA: Unidad = { singular: "semilla", plural: "semillas", genero: "f" };
export const PAGINA: Unidad = { singular: "página", plural: "páginas", genero: "f" };
export const PIEDRA: Unidad = { singular: "piedra", plural: "piedras", genero: "f" };

// ---------- Imágenes ----------
export interface Grupo {
  readonly objeto: ObjetoId;
  readonly cantidad: number;
  readonly tachados?: number;
  readonly etiqueta?: string;
}

export function dibujo(u: Unidad): ObjetoId {
  if (u.id === undefined) throw new ContenidoError(`Sin dibujo para ${u.singular}`);
  return u.id;
}

export function grupos(...lista: readonly Grupo[]): Imagen {
  return { tipo: "objetos", grupos: lista };
}

export function grupoDe(u: Unidad, n: number): Imagen {
  return grupos({ objeto: dibujo(u), cantidad: n });
}

export function serieDeTextos(elementos: readonly (string | number | null)[]): Imagen {
  const salida: ElementoSerie[] = elementos.map((e) => (e === null ? { hueco: true } : { texto: String(e) }));
  return { tipo: "serie", elementos: salida };
}

// ---------- Respuestas ----------
export function opcionNumerica(rng: Rng, correcta: number, candidatos: readonly number[], n = 3, paso = 1): RespuestaBorrador {
  return { tipo: "opcion", correcta: String(correcta), distractores: distractoresNumericos(rng, correcta, candidatos, n, paso).map(String) };
}

// Escribir el número es más difícil que elegirlo: el formato abierto crece con la dificultad.
export function respuestaNum(rng: Rng, d: Dificultad, correcta: number, candidatos: readonly number[], paso = 1): RespuestaBorrador {
  const abierta = rng() < porD(d, 0, 0.35, 0.6);
  return abierta ? { tipo: "numero", valor: correcta } : opcionNumerica(rng, correcta, candidatos, 3, paso);
}

// Elige `n` textos distintos entre sí y de la correcta.
export function distractoresTexto(rng: Rng, correcta: string, candidatos: readonly string[], n: number): string[] {
  const unicos = [...new Set(candidatos)].filter((c) => c !== correcta);
  if (unicos.length < n) throw new ContenidoError(`Faltan distractores para ${correcta}`);
  return barajar(rng, unicos).slice(0, n);
}

// Tres números distintos dentro de un rango, separados al menos por `hueco`.
export function separados(rng: Rng, cuantosN: number, min: number, max: number, hueco: number): number[] {
  const margen = max - min - hueco * (cuantosN - 1);
  if (margen < 0) throw new ContenidoError("Rango insuficiente");
  const cortes = Array.from({ length: cuantosN }, () => Math.floor(rng() * (margen + 1))).sort((a, b) => a - b);
  return cortes.map((c, i) => min + c + i * hueco);
}

// ---------- Números en letras (0 a 100) ----------
const HASTA_29 = [
  "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez",
  "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte",
  "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
] as const;
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"] as const;

const JUSQUA_16 = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"] as const;
const DIZAINES = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"] as const;

function enLettres(n: number): string {
  if (n === 100) return "cent";
  if (n <= 16) return en(JUSQUA_16, n);
  if (n < 20) return `dix-${en(JUSQUA_16, n - 10)}`;
  if (n >= 80) {
    const reste = n - 80;
    return reste === 0 ? "quatre-vingts" : `quatre-vingt-${enLettres(reste)}`;
  }
  const base = n >= 60 ? 60 : Math.floor(n / 10) * 10;
  const reste = n - base;
  const dizaine = en(DIZAINES, base / 10);
  if (reste === 0) return dizaine;
  if (reste === 1 || reste === 11) return `${dizaine} et ${enLettres(reste)}`;
  return `${dizaine}-${enLettres(reste)}`;
}

const PAPAPY = ["", "peteĩ", "mokõi", "mbohapy", "irundy", "po", "poteĩ", "pokõi", "poapy", "porundy"] as const;
const PA_Y = ["pa", "papeteĩ", "pakõi", "pambohapy", "parundy", "papo", "papoteĩ", "papokõi", "papoapy", "paporundy"] as const;

function enGuarani(n: number): string {
  if (n === 100) return "sa";
  if (n === 0) return "mba'eve";
  if (n < 10) return en(PAPAPY, n);
  if (n < 20) return en(PA_Y, n - 10);
  const decena = `${en(PAPAPY, Math.floor(n / 10))}pa`;
  return n % 10 === 0 ? decena : `${decena} ${en(PAPAPY, n % 10)}`;
}

export function enLetras(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 100) throw new ContenidoError(`Fuera de rango: ${n}`);
  if (lengua() === "fr") return enLettres(n);
  if (lengua() === "gn") return enGuarani(n);
  if (n === 100) return "cien";
  if (n < 30) return en(HASTA_29, n);
  const decena = en(DECENAS, Math.floor(n / 10));
  return n % 10 === 0 ? decena : `${decena} y ${en(HASTA_29, n % 10)}`;
}

// ---------- Decenas y unidades ----------
export const decenasTexto = (d: number): string => tx(`${d} ${d === 1 ? "decena" : "decenas"}`, `${d} ${d <= 1 ? "dizaine" : "dizaines"}`, `${d} decena`);
export const unidadesTexto = (u: number): string => tx(`${u} ${u === 1 ? "unidad" : "unidades"}`, `${u} ${u <= 1 ? "unité" : "unités"}`, `${u} unidad`);
export const decUni = (d: number, u: number): string => `${decenasTexto(d)} ${tx("y", "et", "ha")} ${unidadesTexto(u)}`;
export const bloques = (d: number, u: number): Imagen => ({ tipo: "decenas", decenas: d, unidades: u });
export const ayudaBloques = (): string => tx("Cada bloque largo vale 10 y cada bloque suelto vale 1.", "Chaque bloc long vaut 10 et chaque bloc seul vaut 1.", "Bloque puku ha'e 10 ha bloque michĩ ha'e 1.");

// ---------- Dinero ----------
export const DENOMINACIONES = [50, 20, 10, 5, 2, 1] as const;

export function ordenarMonedas(valores: readonly number[]): number[] {
  return [...valores].sort((a, b) => b - a);
}

export function imagenMonedas(valores: readonly number[]): Imagen {
  return { tipo: "monedas", valores };
}

// Nombre de lo dibujado en una opción: "Moneda de 10", "Monedas de 10, 5 y 2".
export function etiquetaMonedas(valores: readonly number[]): string {
  const orden = ordenarMonedas(valores);
  return orden.length === 1 ? tx(`Moneda de ${en(orden, 0)}`, `Pièce de ${en(orden, 0)}`, `Moneda ${en(orden, 0)}`) : tx(`Monedas de ${listaY(orden)}`, `Pièces de ${listaY(orden)}`, `Moneda ${listaY(orden)}`);
}

// Grupos parecidos a `valores` cuyo total no está en `prohibidos`: cambia, quita o añade una moneda.
export function variantesMonedas(rng: Rng, valores: readonly number[], prohibidos: readonly number[], n: number): number[][] {
  const candidatos: number[][] = [];
  valores.forEach((_, i) => {
    candidatos.push(valores.filter((__, j) => j !== i));
    DENOMINACIONES.forEach((v) => candidatos.push(valores.map((x, j) => (j === i ? v : x))));
  });
  DENOMINACIONES.forEach((v) => candidatos.push([...valores, v]));
  const vistos = new Set([ordenarMonedas(valores).join("+")]);
  const salida: number[][] = [];
  // Primero los grupos de valor parecido: un grupo muy distinto no engaña a nadie.
  const total = suma(valores);
  const cerca = (c: readonly number[]): boolean => Math.abs(suma(c) - total) <= 10;
  const barajados = barajar(rng, candidatos);
  for (const c of [...barajados.filter(cerca), ...barajados.filter((x) => !cerca(x))]) {
    const llave = ordenarMonedas(c).join("+");
    if (c.length > 0 && !vistos.has(llave) && !prohibidos.includes(suma(c)) && salida.length < n) {
      vistos.add(llave);
      salida.push(ordenarMonedas(c));
    }
  }
  if (salida.length < n) throw new ContenidoError("Faltan variantes de monedas");
  return salida;
}

// Forma de pagar un total con las monedas de mayor valor posibles.
export function descomponer(total: number): number[] {
  const salida: number[] = [];
  let resto = total;
  for (const v of DENOMINACIONES) {
    while (resto >= v) {
      salida.push(v);
      resto -= v;
    }
  }
  return salida;
}

// Monedas para contar: iguales, de dos valores o de tres o cuatro, según la dificultad.
export function monedasDeDificultad(rng: Rng, d: Dificultad): number[] {
  if (d === 1) {
    const v = elegir(rng, [2, 5, 10]);
    const n = 2 + Math.floor(rng() * 4);
    return Array.from({ length: n }, () => v);
  }
  if (d === 2) {
    const [a, b] = elegir(rng, [[20, 5], [10, 5], [10, 2], [10, 1], [5, 2], [5, 1]] as const);
    const na = 1 + Math.floor(rng() * 2);
    const nb = 1 + Math.floor(rng() * 3);
    return [...Array.from({ length: na }, () => a), ...Array.from({ length: nb }, () => b)];
  }
  const base = barajar(rng, DENOMINACIONES).slice(0, 3 + Math.floor(rng() * 2));
  const menor = Math.min(...base);
  const repetida = suma(base) + menor <= 99 ? [menor] : [];
  return barajar(rng, [...base, ...repetida]);
}

// ---------- Hora y calendario ----------
export const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"] as const;
export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"] as const;

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] as const;

const ARA = ["arateĩ", "arakõi", "araapy", "ararundy", "arapo", "arapoteĩ", "arapokõi"] as const;
const JASY = ["jasyteĩ", "jasykõi", "jasyapy", "jasyrundy", "jasypo", "jasypoteĩ", "jasypokõi", "jasypoapy", "jasyporundy", "jasypa", "jasypateĩ", "jasypakõi"] as const;

export const dia = (i: number): string => en(tx<readonly string[]>(DIAS, JOURS, ARA), ((i % 7) + 7) % 7);
export const mes = (i: number): string => en(tx<readonly string[]>(MESES, MOIS, JASY), ((i % 12) + 12) % 12);
export const horaCiclo = (h: number): number => ((((h - 1) % 12) + 12) % 12) + 1;

// "las 3 en punto", "la 1 y media".
export function hora(h: number, minuto: 0 | 30): string {
  const heures = `${h} ${h === 1 ? "heure" : "heures"}`;
  return tx(`${h === 1 ? "la" : "las"} ${h} ${minuto === 0 ? "en punto" : "y media"}`, minuto === 0 ? heures : `${heures} et demie`, minuto === 0 ? `aravo ${h}` : `aravo ${h} ha mbyte`);
}
export const horaDigital = (h: number, minuto: number): string => `${h}:${minuto === 0 ? "00" : String(minuto)}`;
export const reloj = (h: number, minuto: 0 | 30): Imagen => ({ tipo: "reloj", hora: h, minuto });

// ---------- Formas ----------
export interface InfoForma {
  readonly id: FormaId;
  readonly nombre: string;
  readonly lados: number | null;
}

export const INFO_FORMAS: Readonly<Record<string, InfoForma>> = {
  circulo: { id: "circulo", nombre: "círculo", lados: null },
  ovalo: { id: "ovalo", nombre: "óvalo", lados: null },
  triangulo: { id: "triangulo", nombre: "triángulo", lados: 3 },
  cuadrado: { id: "cuadrado", nombre: "cuadrado", lados: 4 },
  rectangulo: { id: "rectangulo", nombre: "rectángulo", lados: 4 },
  rombo: { id: "rombo", nombre: "rombo", lados: 4 },
  pentagono: { id: "pentagono", nombre: "pentágono", lados: 5 },
  hexagono: { id: "hexagono", nombre: "hexágono", lados: 6 },
};

export function infoForma(id: string): InfoForma {
  const info = INFO_FORMAS[id];
  if (info === undefined) throw new ContenidoError(`Forma desconocida: ${id}`);
  return info;
}

// Un cuadrado también es un rectángulo y un rombo: nunca aparecen juntos como opciones.
export function chocan(a: string, b: string): boolean {
  const par = [a, b].sort().join("/");
  return par === "cuadrado/rectangulo" || par === "cuadrado/rombo";
}
