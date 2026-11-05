// Utilidades del bloque PEN de 1.º y 2.º: nombres de los dibujos, tablas de
// situaciones y combinación de generadores.
import { ContenidoError, elegir } from "../../ayuda.ts";
import { generadorDeSituaciones } from "../../plantillas.ts";
import type { ColorId, Dificultad, FormaId, Generador, Imagen, ObjetoId } from "../../tipos.ts";

// ---------- Dibujos ----------
export type Figura = { readonly forma: FormaId; readonly color: ColorId };
export type Dibujo = Figura | { readonly objeto: ObjetoId };

interface NombreForma {
  readonly singular: string;
  readonly plural: string;
  readonly femenino: boolean;
}

export const NOMBRE_FORMA: Readonly<Record<FormaId, NombreForma>> = {
  circulo: { singular: "círculo", plural: "círculos", femenino: false },
  cuadrado: { singular: "cuadrado", plural: "cuadrados", femenino: false },
  triangulo: { singular: "triángulo", plural: "triángulos", femenino: false },
  rectangulo: { singular: "rectángulo", plural: "rectángulos", femenino: false },
  rombo: { singular: "rombo", plural: "rombos", femenino: false },
  pentagono: { singular: "pentágono", plural: "pentágonos", femenino: false },
  hexagono: { singular: "hexágono", plural: "hexágonos", femenino: false },
  ovalo: { singular: "óvalo", plural: "óvalos", femenino: false },
  estrella: { singular: "estrella", plural: "estrellas", femenino: true },
};

// Formas que se distinguen de un vistazo, incluso con un dibujo pequeño.
export const FORMAS_CLARAS: readonly FormaId[] = ["circulo", "cuadrado", "triangulo", "estrella", "rombo"];

const COLOR: Readonly<Record<ColorId, { readonly m: string; readonly f: string; readonly mp: string; readonly fp: string }>> = {
  rojo: { m: "rojo", f: "roja", mp: "rojos", fp: "rojas" },
  azul: { m: "azul", f: "azul", mp: "azules", fp: "azules" },
  verde: { m: "verde", f: "verde", mp: "verdes", fp: "verdes" },
  amarillo: { m: "amarillo", f: "amarilla", mp: "amarillos", fp: "amarillas" },
  morado: { m: "morado", f: "morada", mp: "morados", fp: "moradas" },
  naranja: { m: "naranja", f: "naranja", mp: "naranjas", fp: "naranjas" },
};

export function colorDe(color: ColorId, femenino: boolean, plural = false): string {
  const c = COLOR[color];
  if (plural) return femenino ? c.fp : c.mp;
  return femenino ? c.f : c.m;
}

interface NombreObjeto {
  readonly nombre: string;
  readonly femenino: boolean;
}

function m(nombre: string): NombreObjeto {
  return { nombre, femenino: false };
}
function f(nombre: string): NombreObjeto {
  return { nombre, femenino: true };
}

export const NOMBRE_OBJETO: Readonly<Record<ObjetoId, NombreObjeto>> = {
  manzana: f("manzana"), pera: f("pera"), naranja: f("naranja"), lapiz: m("lápiz"), libro: m("libro"),
  cuaderno: m("cuaderno"), pelota: f("pelota"), flor: f("flor"), arbol: m("árbol"), hoja: f("hoja"),
  estrella: f("estrella"), sol: m("sol"), luna: f("luna"), nube: f("nube"), casa: f("casa"),
  pez: m("pez"), pajaro: m("pájaro"), gato: m("gato"), perro: m("perro"), mariposa: f("mariposa"),
  pato: m("pato"), rana: f("rana"), vaca: f("vaca"), oso: m("oso"), elefante: m("elefante"),
  hormiga: f("hormiga"), moneda: f("moneda"), vaso: m("vaso"), botella: f("botella"), taza: f("taza"),
  llave: f("llave"), mesa: f("mesa"), silla: f("silla"), cama: f("cama"), puerta: f("puerta"),
  ventana: f("ventana"), zapato: m("zapato"), gorro: m("gorro"), mochila: f("mochila"), paraguas: m("paraguas"),
  coche: m("coche"), bicicleta: f("bicicleta"), barco: m("barco"), tren: m("tren"), avion: m("avión"),
  cubo: m("cubo"), caja: f("caja"), dado: m("dado"), tijeras: f("tijeras"), reloj: m("reloj"),
  lupa: f("lupa"), jabon: m("jabón"), grifo: m("grifo"), cepillo: m("cepillo"), huevo: m("huevo"),
  uva: f("uva"), pan: m("pan"), mano: f("mano"), ojo: m("ojo"), dedo: m("dedo"),
};

export function nombreObjeto(objeto: ObjetoId): string {
  return NOMBRE_OBJETO[objeto].nombre;
}

// "el lápiz", "la mano".
export function conArticulo(objeto: ObjetoId): string {
  const o = NOMBRE_OBJETO[objeto];
  return `${o.femenino ? "la" : "el"} ${o.nombre}`;
}

export function conArticuloForma(forma: FormaId): string {
  const o = NOMBRE_FORMA[forma];
  return `${o.femenino ? "la" : "el"} ${o.singular}`;
}

export function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "a, b y c".
export function lista(partes: readonly string[]): string {
  if (partes.length < 2) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1] ?? ""}`;
}

export function esFigura(d: Dibujo): d is Figura {
  return "forma" in d;
}

export function claveDibujo(d: Dibujo): string {
  return esFigura(d) ? `${d.forma}/${d.color}` : d.objeto;
}

export function etiquetaDibujo(d: Dibujo): string {
  if (!esFigura(d)) return nombreObjeto(d.objeto);
  const forma = NOMBRE_FORMA[d.forma];
  return `${forma.singular} ${colorDe(d.color, forma.femenino)}`;
}

// "el círculo rojo", "la flor".
export function conArticuloDibujo(d: Dibujo): string {
  const femenino = esFigura(d) ? NOMBRE_FORMA[d.forma].femenino : NOMBRE_OBJETO[d.objeto].femenino;
  return `${femenino ? "la" : "el"} ${etiquetaDibujo(d)}`;
}

// "del círculo rojo", "de la flor".
export function delDibujo(d: Dibujo): string {
  const conArticulo = conArticuloDibujo(d);
  return conArticulo.startsWith("el ") ? `del ${conArticulo.slice(3)}` : `de ${conArticulo}`;
}

export function imagenDibujo(d: Dibujo): Imagen {
  return esFigura(d) ? { tipo: "figura", forma: d.forma, color: d.color } : { tipo: "objeto", objeto: d.objeto };
}

export function opcionDibujo(d: Dibujo): { readonly texto: string; readonly imagen: Imagen } {
  return { texto: etiquetaDibujo(d), imagen: imagenDibujo(d) };
}

export function objeto(id: ObjetoId): Imagen {
  return { tipo: "objeto", objeto: id };
}

// ---------- Generadores ----------
export type Fila = readonly [
  dificultad: Dificultad,
  enunciado: string,
  enunciadoFacil: string,
  correcta: string,
  distractores: readonly string[],
  pista: string,
  explicacion: string,
  imagen?: Imagen,
];

// Tabla de situaciones escritas de una subhabilidad.
export function situaciones(sub: string, filas: readonly Fila[]): Generador {
  return generadorDeSituaciones(
    sub,
    filas.map(([dificultad, enunciado, enunciadoFacil, correcta, distractores, pista, explicacion, imagen], i) => ({
      id: `${sub}-s${i + 1}`,
      sub,
      dificultad,
      enunciado,
      enunciadoFacil,
      correcta,
      distractores,
      pista,
      explicacion,
      ...(imagen === undefined ? {} : { imagen }),
    })),
  );
}

// Elige al azar uno de los generadores previstos para la dificultad pedida.
export function porDificultad(tabla: Readonly<Record<Dificultad, readonly Generador[]>>): Generador {
  return (rng, dificultad) => {
    const opciones = tabla[dificultad];
    if (opciones.length === 0) throw new ContenidoError(`Sin generadores para la dificultad ${dificultad}`);
    return elegir(rng, opciones)(rng, dificultad);
  };
}
