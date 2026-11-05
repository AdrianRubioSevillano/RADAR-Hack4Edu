// Utilidades comunes del bloque LEE de 1.º y 2.º: palabras dibujables y ayudas de texto.
import { ContenidoError } from "../../ayuda.ts";
import type { Contable } from "../../ayuda.ts";
import { CONTABLES } from "../../ayuda.ts";
import type { Dificultad, Generador, Imagen, ObjetoId } from "../../tipos.ts";

export interface Palabra {
  readonly id: ObjetoId;
  readonly texto: string;
  readonly silabas: readonly string[];
}

function p(id: ObjetoId, separada: string): Palabra {
  return { id, texto: separada.replaceAll("-", ""), silabas: separada.split("-") };
}

// Se dejan fuera coche, grifo, cubo y cepillo: su nombre cambia según el país o el
// dibujo admite otro nombre, y aquí el niño tiene que nombrar lo que ve.
export const PALABRAS: readonly Palabra[] = [
  p("manzana", "man-za-na"), p("pera", "pe-ra"), p("naranja", "na-ran-ja"), p("lapiz", "lá-piz"),
  p("libro", "li-bro"), p("pelota", "pe-lo-ta"), p("flor", "flor"), p("arbol", "ár-bol"),
  p("hoja", "ho-ja"), p("estrella", "es-tre-lla"), p("sol", "sol"), p("luna", "lu-na"),
  p("nube", "nu-be"), p("casa", "ca-sa"), p("pez", "pez"), p("pajaro", "pá-ja-ro"), p("gato", "ga-to"), p("perro", "pe-rro"),
  p("mariposa", "ma-ri-po-sa"), p("pato", "pa-to"), p("rana", "ra-na"), p("vaca", "va-ca"),
  p("oso", "o-so"), p("elefante", "e-le-fan-te"), p("hormiga", "hor-mi-ga"), p("moneda", "mo-ne-da"),
  p("vaso", "va-so"), p("botella", "bo-te-lla"), p("taza", "ta-za"), p("llave", "lla-ve"),
  p("mesa", "me-sa"), p("silla", "si-lla"), p("cama", "ca-ma"), p("puerta", "puer-ta"),
  p("ventana", "ven-ta-na"), p("zapato", "za-pa-to"), p("gorro", "go-rro"), p("mochila", "mo-chi-la"),
  p("paraguas", "pa-ra-guas"), p("bicicleta", "bi-ci-cle-ta"), p("barco", "bar-co"), p("tren", "tren"),
  p("avion", "a-vión"), p("caja", "ca-ja"), p("dado", "da-do"), p("tijeras", "ti-je-ras"),
  p("reloj", "re-loj"), p("lupa", "lu-pa"), p("jabon", "ja-bón"), p("huevo", "hue-vo"), p("uva", "u-va"),
  p("pan", "pan"), p("mano", "ma-no"), p("ojo", "o-jo"), p("dedo", "de-do"),
];

const POR_ID = new Map(PALABRAS.map((x) => [x.id, x]));

export function palabra(id: ObjetoId): Palabra {
  const encontrada = POR_ID.get(id);
  if (encontrada === undefined) throw new ContenidoError(`Palabra sin datos: ${id}`);
  return encontrada;
}

export function dibujo(id: ObjetoId): Imagen {
  return { tipo: "objeto", objeto: id };
}

export function opcionDibujo(id: ObjetoId): { readonly texto: string; readonly imagen: Imagen } {
  return { texto: palabra(id).texto, imagen: dibujo(id) };
}

export function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Primera letra sin tilde: "árbol" -> "a".
export function inicial(texto: string): string {
  return texto.normalize("NFD").charAt(0).toLowerCase();
}

// Un generador distinto para cada dificultad.
export function porDificultad(f: Readonly<Record<Dificultad, Generador>>): Generador {
  return (rng, dificultad) => f[dificultad](rng, dificultad);
}

const NUMEROS = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"] as const;

export function numeroEnLetra(n: number): string {
  const texto = NUMEROS[n];
  if (texto === undefined) throw new ContenidoError(`Número sin letra: ${n}`);
  return texto;
}

// Cosas contables dibujables para las frases con cantidades.
export const SERES: readonly Contable[] = [
  ...CONTABLES.filter((c) => c.id !== "caja" && c.id !== "cuaderno"),
  { id: "gato", singular: "gato", plural: "gatos", genero: "m" },
  { id: "perro", singular: "perro", plural: "perros", genero: "m" },
  { id: "pato", singular: "pato", plural: "patos", genero: "m" },
  { id: "rana", singular: "rana", plural: "ranas", genero: "f" },
  { id: "vaca", singular: "vaca", plural: "vacas", genero: "f" },
];

// "un pez", "una flor", "tres peces".
export function grupo(n: number, c: Contable): string {
  if (n === 1) return `${c.genero === "m" ? "un" : "una"} ${c.singular}`;
  return `${numeroEnLetra(n)} ${c.plural}`;
}

// Etiqueta accesible de un dibujo con cantidades: "2 peras".
export function etiquetaGrupo(n: number, c: Contable): string {
  return `${n} ${n === 1 ? c.singular : c.plural}`;
}

export function objetos(...grupos: readonly (readonly [Contable, number])[]): Imagen {
  return { tipo: "objetos", grupos: grupos.map(([c, cantidad]) => ({ objeto: c.id, cantidad })) };
}

// "el libro", "la manzana".
export function conArticulo(c: Contable): string {
  return `${c.genero === "m" ? "el" : "la"} ${c.singular}`;
}
