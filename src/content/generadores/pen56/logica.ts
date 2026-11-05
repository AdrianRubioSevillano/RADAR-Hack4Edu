// PEN5-T1: ordenar con pistas y tablas lógicas. Cada puzle se construye en código y
// un resolutor por fuerza bruta garantiza que tiene una única solución.
import type { Rng } from "../../../core/rng.ts";
import { barajar, elegir, nombres, pregunta } from "../../ayuda.ts";
import type { Dificultad, Generador, Imagen, Pregunta } from "../../tipos.ts";
import { capital, cartelPistas, en, permutaciones, reintentar, unir } from "./comun.ts";

// ---------- Ordenar con pistas ----------
export type PistaOrden =
  | { readonly tipo: "antes" | "justo" | "entre"; readonly a: number; readonly b: number }
  | { readonly tipo: "lugar" | "noLugar"; readonly a: number; readonly lugar: number };

export function cumpleOrden(pista: PistaOrden, orden: readonly number[]): boolean {
  const pos = (persona: number) => orden.indexOf(persona);
  switch (pista.tipo) {
    case "antes": return pos(pista.a) < pos(pista.b);
    case "justo": return pos(pista.a) + 1 === pos(pista.b);
    case "entre": return Math.abs(pos(pista.a) - pos(pista.b)) === 2;
    case "lugar": return pos(pista.a) === pista.lugar;
    case "noLugar": return pos(pista.a) !== pista.lugar;
  }
}

export function solucionesOrden(n: number, pistas: readonly PistaOrden[]): number[][] {
  const personas = Array.from({ length: n }, (_, i) => i);
  return permutaciones(personas).filter((orden) => pistas.every((p) => cumpleOrden(p, orden)));
}

function candidatasOrden(orden: readonly number[], dificultad: Dificultad): PistaOrden[] {
  const n = orden.length;
  const salida: PistaOrden[] = [];
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const a = en(orden, i);
      const b = en(orden, j);
      salida.push({ tipo: "antes", a, b });
      if (dificultad >= 2 && j === i + 1) salida.push({ tipo: "justo", a, b });
      if (dificultad === 3 && j === i + 2) salida.push({ tipo: "entre", a: Math.min(a, b), b: Math.max(a, b) });
    }
  }
  const extremos = [0, n - 1];
  for (const lugar of extremos) {
    if (dificultad < 3) salida.push({ tipo: "lugar", a: en(orden, lugar), lugar });
    if (dificultad >= 2) {
      for (const a of orden) if (a !== en(orden, lugar)) salida.push({ tipo: "noLugar", a, lugar });
    }
  }
  return salida;
}

// Añade pistas hasta dejar una solución y quita después las que sobran.
function seleccionar<P>(rng: Rng, candidatas: readonly P[], cuenta: (pistas: readonly P[]) => number): P[] | null {
  const elegidas: P[] = [];
  let actual = cuenta([]);
  for (const c of barajar(rng, candidatas)) {
    if (actual === 1) break;
    const nueva = cuenta([...elegidas, c]);
    if (nueva < actual) {
      elegidas.push(c);
      actual = nueva;
    }
  }
  if (actual !== 1) return null;
  let minimas = elegidas;
  for (const c of barajar(rng, elegidas)) {
    const sin = minimas.filter((x) => x !== c);
    if (cuenta(sin) === 1) minimas = sin;
  }
  return minimas;
}

interface ContextoOrden {
  readonly id: string;
  readonly intro: (lista: string) => string;
  readonly introFacil: (lista: string) => string;
  readonly antes: (a: string, b: string) => string;
  readonly justo: (a: string, b: string) => string;
  readonly lugar: (a: string, lugar: string) => string;
  readonly noLugar: (a: string, lugar: string) => string;
  readonly entre: (a: string, b: string) => string;
  readonly quien: (lugar: string) => string;
  readonly enQueLugar: (a: string) => string;
  readonly lugares: readonly string[]; // primero a quinto
  readonly ultimo: string;
}

const LUGARES = ["primer lugar", "segundo lugar", "tercer lugar", "cuarto lugar", "quinto lugar"];

function conY(a: string, b: string): string {
  return unir([a, b]);
}

function deVerbo(id: string, intro: (l: string) => string, introFacil: (l: string) => string, verbo: string): ContextoOrden {
  return {
    id, intro, introFacil,
    antes: (a, b) => `${a} ${verbo} antes que ${b}.`,
    justo: (a, b) => `${a} ${verbo} justo antes que ${b}.`,
    lugar: (a, l) => `${a} ${verbo} en ${l}.`,
    noLugar: (a, l) => `${a} no ${verbo} en ${l}.`,
    entre: (a, b) => `Entre ${conY(a, b)} ${verbo} una sola persona.`,
    quien: (l) => `¿Quién ${verbo} en ${l}?`,
    enQueLugar: (a) => `¿En qué lugar ${verbo} ${a}? Escribe el número.`,
    lugares: LUGARES,
    ultimo: "último lugar",
  };
}

const CONTEXTOS_ORDEN: readonly ContextoOrden[] = [
  {
    id: "pozo",
    intro: (l) => `${l} hacen fila para sacar agua del pozo. El primer lugar es el más cercano al pozo.`,
    introFacil: (l) => `${l} hacen fila en el pozo. El primer lugar está junto al pozo.`,
    antes: (a, b) => `${a} está delante de ${b}.`,
    justo: (a, b) => `${a} está justo delante de ${b}.`,
    lugar: (a, l) => `${a} está en ${l}.`,
    noLugar: (a, l) => `${a} no está en ${l}.`,
    entre: (a, b) => `Entre ${conY(a, b)} hay una sola persona.`,
    quien: (l) => `¿Quién está en ${l}?`,
    enQueLugar: (a) => `¿En qué lugar está ${a}? Escribe el número.`,
    lugares: LUGARES,
    ultimo: "último lugar",
  },
  deVerbo("carrera", (l) => `${l} corren una carrera y nadie empata.`, (l) => `${l} corren una carrera. Nadie empata.`, "llega"),
  deVerbo("lectura", (l) => `${l} leen en voz alta en clase, una persona cada vez.`, (l) => `${l} leen en voz alta. Lee una persona cada vez.`, "lee"),
  deVerbo("riego", (l) => `${l} riegan el huerto por turnos, una persona cada día.`, (l) => `${l} riegan el huerto. Riega una persona cada día.`, "riega"),
  deVerbo("autobus", (l) => `${l} suben al autobús, una persona cada vez.`, (l) => `${l} suben al autobús. Sube una persona cada vez.`, "sube"),
  {
    id: "casas",
    intro: (l) => `Las casas de ${l} están en fila junto a un camino. La primera casa es la más cercana al río.`,
    introFacil: (l) => `${l} viven en casas en fila. La primera casa está junto al río.`,
    antes: (a, b) => `${a} vive antes que ${b}, contando desde el río.`,
    justo: (a, b) => `${a} vive justo antes que ${b}, contando desde el río.`,
    lugar: (a, l) => `${a} vive en ${l}.`,
    noLugar: (a, l) => `${a} no vive en ${l}.`,
    entre: (a, b) => `Entre la casa de ${a} y la de ${b} hay una sola casa.`,
    quien: (l) => `¿Quién vive en ${l}?`,
    enQueLugar: (a) => `¿En qué casa vive ${a}, contando desde el río? Escribe el número.`,
    lugares: ["la primera casa", "la segunda casa", "la tercera casa", "la cuarta casa", "la quinta casa"],
    ultimo: "la última casa",
  },
];

function textoLugar(c: ContextoOrden, lugar: number, n: number): string {
  return lugar === n - 1 ? c.ultimo : en(c.lugares, lugar);
}

function textoPistaOrden(c: ContextoOrden, p: PistaOrden, gente: readonly string[], n: number): string {
  const a = en(gente, p.a);
  switch (p.tipo) {
    case "antes": return c.antes(a, en(gente, p.b));
    case "justo": return c.justo(a, en(gente, p.b));
    case "entre": return c.entre(a, en(gente, p.b));
    case "lugar": return c.lugar(a, textoLugar(c, p.lugar, n));
    case "noLugar": return c.noLugar(a, textoLugar(c, p.lugar, n));
  }
}

const TAMANO_ORDEN: Readonly<Record<Dificultad, number>> = { 1: 3, 2: 4, 3: 5 };
const MAX_PISTAS_ORDEN: Readonly<Record<Dificultad, number>> = { 1: 3, 2: 4, 3: 6 };

function pistasOrden(rng: Rng, dificultad: Dificultad): { orden: number[]; pistas: PistaOrden[] } {
  const n = TAMANO_ORDEN[dificultad];
  return reintentar(() => {
    const orden = barajar(rng, Array.from({ length: n }, (_, i) => i));
    const pistas = seleccionar(rng, candidatasOrden(orden, dificultad), (ps) => solucionesOrden(n, ps).length);
    if (pistas === null || pistas.length > MAX_PISTAS_ORDEN[dificultad]) return null;
    if (dificultad === 2 && !pistas.some((p) => p.tipo === "justo" || p.tipo === "noLugar")) return null;
    if (dificultad === 3 && !pistas.some((p) => p.tipo === "entre")) return null;
    return { orden, pistas };
  });
}

const SUB_ORDEN = "PEN5-T1-a";

const ordenarConPistas: Generador = (rng, dificultad) => {
  const c = elegir(rng, CONTEXTOS_ORDEN);
  const n = TAMANO_ORDEN[dificultad];
  const gente = nombres(rng, n);
  const { orden, pistas } = pistasOrden(rng, dificultad);
  const lista = unir(gente);
  const lineas = barajar(rng, pistas).map((p) => textoPistaOrden(c, p, gente, n));
  const ordenTexto = orden.map((i) => en(gente, i)).join(", ");
  const comun = {
    subhabilidad: SUB_ORDEN,
    dificultad,
    imagen: cartelPistas(lineas),
    pista: `Imagina ${n} huecos en fila. Coloca los nombres según cada pista y comprueba que se cumplen todas.`,
  };
  const directos = new Set(pistas.flatMap((p) => (p.tipo === "lugar" ? [p.lugar] : [])));
  const lugares = Array.from({ length: n }, (_, i) => i).filter((i) => !directos.has(i));
  const tipo = dificultad === 3 ? elegir(rng, ["quien", "numero"] as const) : elegir(rng, ["quien", "orden"] as const);
  if (tipo === "orden") {
    const todas = permutaciones(orden).filter((x) => x.join() !== orden.join());
    const aciertos = (x: readonly number[]) => pistas.filter((p) => cumpleOrden(p, x)).length;
    const cercanas = barajar(rng, todas).sort((x, y) => aciertos(y) - aciertos(x)).slice(0, n === 3 ? 2 : 3);
    return pregunta(rng, {
      ...comun,
      enunciado: `${c.intro(lista)} Lee las pistas. ¿Cuál es el orden correcto, del primero al último?`,
      enunciadoFacil: `${c.introFacil(lista)} Lee las pistas. ¿Cuál es el orden correcto?`,
      respuesta: { tipo: "opcion", correcta: ordenTexto, distractores: cercanas.map((x) => x.map((i) => en(gente, i)).join(", ")) },
      explicacion: `Solo este orden cumple todas las pistas: ${ordenTexto}.`,
      plantilla: `${SUB_ORDEN}:${c.id}:orden:d${dificultad}`,
    });
  }
  const lugar = elegir(rng, lugares);
  const persona = en(gente, en(orden, lugar));
  if (tipo === "numero") {
    const q = c.enQueLugar(persona);
    return pregunta(rng, {
      ...comun,
      enunciado: `${c.intro(lista)} Lee las pistas. ${q}`,
      enunciadoFacil: `${c.introFacil(lista)} Lee las pistas. ${q}`,
      respuesta: { tipo: "numero", valor: lugar + 1 },
      explicacion: `Solo este orden cumple todas las pistas: ${ordenTexto}. ${persona} ocupa el lugar ${lugar + 1}.`,
      plantilla: `${SUB_ORDEN}:${c.id}:numero:d${dificultad}`,
    });
  }
  const q = c.quien(textoLugar(c, lugar, n));
  const otros = barajar(rng, gente.filter((g) => g !== persona)).slice(0, 3);
  return pregunta(rng, {
    ...comun,
    enunciado: `${c.intro(lista)} Lee las pistas. ${q}`,
    enunciadoFacil: `${c.introFacil(lista)} Lee las pistas. ${q}`,
    respuesta: { tipo: "opcion", correcta: persona, distractores: otros },
    explicacion: `Solo este orden cumple todas las pistas: ${ordenTexto}. Por eso la respuesta es ${persona}.`,
    plantilla: `${SUB_ORDEN}:${c.id}:quien:d${dificultad}`,
  });
};

// ---------- Tablas lógicas ----------
interface Item {
  readonly texto: string; // "el gato"
  readonly corto: string; // cabecera de la tabla
}

interface Categoria {
  readonly id: string;
  readonly frase: string; // "Cada persona cuida un animal distinto"
  readonly fraseFacil: string;
  readonly sg: string;
  readonly pl: string;
  readonly que: (sujeto: string) => string; // "¿Qué animal cuida Amina?"
  readonly items: readonly Item[];
}

function item(texto: string, corto: string): Item {
  return { texto, corto };
}

const CATEGORIAS: readonly Categoria[] = [
  {
    id: "animal", frase: "Cada persona cuida un animal distinto", fraseFacil: "Cada persona cuida un animal", sg: "cuida", pl: "cuidan",
    que: (s) => `¿Qué animal cuida ${s}?`,
    items: [item("el gato", "gato"), item("el perro", "perro"), item("el pato", "pato"), item("la vaca", "vaca")],
  },
  {
    id: "instrumento", frase: "Cada persona toca un instrumento distinto", fraseFacil: "Cada persona toca un instrumento", sg: "toca", pl: "tocan",
    que: (s) => `¿Qué instrumento toca ${s}?`,
    items: [item("el tambor", "tambor"), item("la flauta", "flauta"), item("la guitarra", "guitarra"), item("el violín", "violín")],
  },
  {
    id: "objeto", frase: "Cada persona lleva un objeto distinto a clase", fraseFacil: "Cada persona lleva un objeto", sg: "lleva", pl: "llevan",
    que: (s) => `¿Qué objeto lleva ${s}?`,
    items: [item("el libro", "libro"), item("la pelota", "pelota"), item("el cuaderno", "cuaderno"), item("la regla", "regla")],
  },
  {
    id: "pintura", frase: "Cada persona pinta una cosa distinta de la escuela", fraseFacil: "Cada persona pinta una cosa", sg: "pinta", pl: "pintan",
    que: (s) => `¿Qué cosa pinta ${s}?`,
    items: [item("la puerta", "puerta"), item("la ventana", "ventana"), item("la mesa", "mesa"), item("el banco", "banco")],
  },
  {
    id: "cultivo", frase: "Cada persona riega una planta distinta del huerto", fraseFacil: "Cada persona riega una planta", sg: "riega", pl: "riegan",
    que: (s) => `¿Qué planta riega ${s}?`,
    items: [item("el tomate", "tomate"), item("la lechuga", "lechuga"), item("la zanahoria", "zanahoria"), item("el pepino", "pepino")],
  },
];

const SEGUNDAS: readonly Categoria[] = [
  {
    id: "lugar", frase: "Además, cada persona va a un lugar distinto", fraseFacil: "Cada persona va a un lugar", sg: "va", pl: "van",
    que: (s) => `¿A qué lugar va ${s}?`,
    items: [item("al mercado", "mercado"), item("al pozo", "pozo"), item("a la escuela", "escuela")],
  },
  {
    id: "gorro", frase: "Además, cada persona tiene un gorro de un color distinto", fraseFacil: "Cada persona tiene un gorro", sg: "tiene", pl: "tienen",
    que: (s) => `¿Qué gorro tiene ${s}?`,
    items: [item("el gorro rojo", "rojo"), item("el gorro azul", "azul"), item("el gorro verde", "verde")],
  },
];

// Asignación: a[c][persona] = índice del ítem en la categoría c.
export type Asignacion = readonly (readonly number[])[];

export type PistaTabla =
  | { readonly tipo: "si" | "no"; readonly cat: number; readonly p: number; readonly i: number }
  | { readonly tipo: "ni"; readonly cat: number; readonly p: number; readonly q: number; readonly i: number }
  | { readonly tipo: "o"; readonly cat: number; readonly p: number; readonly i: number; readonly j: number }
  | { readonly tipo: "cruceSi" | "cruceNo"; readonly i: number; readonly j: number };

export function cumpleTabla(pista: PistaTabla, a: Asignacion): boolean {
  switch (pista.tipo) {
    case "si": return en(en(a, pista.cat), pista.p) === pista.i;
    case "no": return en(en(a, pista.cat), pista.p) !== pista.i;
    case "ni": return en(en(a, pista.cat), pista.p) !== pista.i && en(en(a, pista.cat), pista.q) !== pista.i;
    case "o": {
      const valor = en(en(a, pista.cat), pista.p);
      return valor === pista.i || valor === pista.j;
    }
    case "cruceSi": return en(en(a, 1), en(a, 0).indexOf(pista.i)) === pista.j;
    case "cruceNo": return en(en(a, 1), en(a, 0).indexOf(pista.i)) !== pista.j;
  }
}

export function solucionesTabla(n: number, categorias: number, pistas: readonly PistaTabla[]): Asignacion[] {
  const perms = permutaciones(Array.from({ length: n }, (_, i) => i));
  const todas: Asignacion[] = categorias === 1 ? perms.map((x) => [x]) : perms.flatMap((x) => perms.map((y) => [x, y]));
  return todas.filter((a) => pistas.every((p) => cumpleTabla(p, a)));
}

function candidatasTabla(a: Asignacion, dificultad: Dificultad, soloMarcas: boolean): PistaTabla[] {
  const salida: PistaTabla[] = [];
  const cats = a.length;
  for (let cat = 0; cat < cats; cat += 1) {
    const fila = en(a, cat);
    const n = fila.length;
    for (let p = 0; p < n; p += 1) {
      const real = en(fila, p);
      salida.push({ tipo: "si", cat, p, i: real });
      for (let i = 0; i < n; i += 1) {
        if (i === real) continue;
        salida.push({ tipo: "no", cat, p, i });
        if (soloMarcas) continue;
        salida.push({ tipo: "o", cat, p, i: Math.min(i, real), j: Math.max(i, real) });
        for (let q = p + 1; q < n; q += 1) if (en(fila, q) !== i) salida.push({ tipo: "ni", cat, p, q, i });
      }
    }
  }
  if (cats === 2) {
    const [x, y] = [en(a, 0), en(a, 1)];
    for (let p = 0; p < x.length; p += 1) {
      for (let j = 0; j < y.length; j += 1) {
        salida.push(j === en(y, p) ? { tipo: "cruceSi", i: en(x, p), j } : { tipo: "cruceNo", i: en(x, p), j });
      }
    }
  }
  if (dificultad === 1 && !soloMarcas) return salida.filter((c) => c.tipo !== "o");
  return salida;
}

function textoPistaTabla(p: PistaTabla, gente: readonly string[], cats: readonly Categoria[]): string {
  switch (p.tipo) {
    case "si": {
      const c = en(cats, p.cat);
      return `${en(gente, p.p)} ${c.sg} ${en(c.items, p.i).texto}.`;
    }
    case "no": {
      const c = en(cats, p.cat);
      return `${en(gente, p.p)} no ${c.sg} ${en(c.items, p.i).texto}.`;
    }
    case "ni": {
      const c = en(cats, p.cat);
      return `Ni ${en(gente, p.p)} ni ${en(gente, p.q)} ${c.pl} ${en(c.items, p.i).texto}.`;
    }
    case "o": {
      const c = en(cats, p.cat);
      return `${en(gente, p.p)} ${c.sg} ${unir([en(c.items, p.i).texto, en(c.items, p.j).texto], "o")}.`;
    }
    case "cruceSi":
    case "cruceNo": {
      const [c0, c1] = [en(cats, 0), en(cats, 1)];
      const verbo = p.tipo === "cruceSi" ? c1.sg : `no ${c1.sg}`;
      return `Quien ${c0.sg} ${en(c0.items, p.i).texto} ${verbo} ${en(c1.items, p.j).texto}.`;
    }
  }
}

const SUB_TABLA = "PEN5-T1-b";
const PISTA_TABLA = "Haz una tabla con personas y cosas. Tacha lo que no puede ser: si en una fila queda una sola casilla, esa es la buena.";
const MAX_PISTAS_TABLA: Readonly<Record<Dificultad, number>> = { 1: 3, 2: 5, 3: 6 };

function puzleTabla(rng: Rng, n: number, cats: number, dificultad: Dificultad, soloMarcas: boolean): { a: Asignacion; pistas: PistaTabla[] } {
  const maximo = soloMarcas ? 9 : MAX_PISTAS_TABLA[dificultad];
  return reintentar(() => {
    const base = Array.from({ length: n }, (_, i) => i);
    const a: Asignacion = Array.from({ length: cats }, () => barajar(rng, base));
    const candidatas = candidatasTabla(a, dificultad, soloMarcas);
    const pistas = seleccionar(rng, candidatas, (ps) => solucionesTabla(n, cats, ps).length);
    if (pistas === null || pistas.length > maximo) return null;
    const positivas = pistas.filter((p) => p.tipo === "si" || p.tipo === "cruceSi").length;
    if (positivas > (dificultad === 3 ? 2 : 1)) return null;
    return { a, pistas };
  });
}

// Una persona cuyo dato de la categoría 0 no aparece dicho tal cual en una pista.
function personaOculta(rng: Rng, n: number, pistas: readonly PistaTabla[]): number {
  const dichas = new Set(pistas.flatMap((p) => (p.tipo === "si" && p.cat === 0 ? [p.p] : [])));
  return elegir(rng, Array.from({ length: n }, (_, i) => i).filter((i) => !dichas.has(i)));
}

function resumenTabla(a: Asignacion, gente: readonly string[], cats: readonly Categoria[]): string {
  const partes = gente.map((g, p) => {
    const hechos = cats.map((c, ci) => `${c.sg} ${en(c.items, en(en(a, ci), p)).texto}`);
    return `${g} ${unir(hechos)}`;
  });
  return unir(partes);
}

function preguntaSimple(rng: Rng, dificultad: Dificultad, c: Categoria, gente: readonly string[], a: Asignacion, pistas: readonly PistaTabla[], base: {
  readonly enunciado: string;
  readonly enunciadoFacil: string;
  readonly imagen: Imagen;
  readonly plantilla: string;
}): Pregunta {
  const n = gente.length;
  const p = personaOculta(rng, n, pistas);
  const persona = en(gente, p);
  const fila = en(a, 0);
  const real = en(c.items, en(fila, p));
  const preguntaPorCosa = rng() < 0.5;
  const enunciadoFinal = preguntaPorCosa ? c.que(persona) : `¿Quién ${c.sg} ${real.texto}?`;
  const respuesta = preguntaPorCosa
    ? { tipo: "opcion" as const, correcta: capital(real.texto), distractores: c.items.slice(0, n).filter((x) => x !== real).map((x) => capital(x.texto)) }
    : { tipo: "opcion" as const, correcta: persona, distractores: gente.filter((g) => g !== persona) };
  return pregunta(rng, {
    subhabilidad: SUB_TABLA,
    dificultad,
    enunciado: `${base.enunciado} ${enunciadoFinal}`,
    enunciadoFacil: `${base.enunciadoFacil} ${enunciadoFinal}`,
    imagen: base.imagen,
    respuesta,
    pista: PISTA_TABLA,
    explicacion: `Solo hay un reparto posible: ${resumenTabla(a, gente, [c])}.`,
    plantilla: base.plantilla,
  });
}

function acotar(c: Categoria, n: number, rng: Rng): Categoria {
  return { ...c, items: barajar(rng, c.items).slice(0, n) };
}

const tablaConPistas: Generador = (rng, dificultad) => {
  const n = dificultad === 2 ? 4 : 3;
  const gente = nombres(rng, n);
  const lista = unir(gente);
  const c = acotar(elegir(rng, CATEGORIAS), n, rng);
  const opciones = unir(c.items.map((x) => x.texto), "o");
  if (dificultad < 3) {
    const { a, pistas } = puzleTabla(rng, n, 1, dificultad, false);
    return preguntaSimple(rng, dificultad, c, gente, a, pistas, {
      enunciado: `Hay ${n} personas: ${lista}. ${c.frase}: ${opciones}. Lee las pistas.`,
      enunciadoFacil: `Hay ${n} personas: ${lista}. ${c.fraseFacil}: ${opciones}. No se repite. Lee las pistas.`,
      imagen: cartelPistas(barajar(rng, pistas).map((p) => textoPistaTabla(p, gente, [c]))),
      plantilla: `${SUB_TABLA}:${c.id}:pistas:d${dificultad}`,
    });
  }
  const c2 = elegir(rng, SEGUNDAS);
  const cats = [c, c2];
  const opciones2 = unir(c2.items.map((x) => x.texto), "o");
  const { a, pistas } = puzleTabla(rng, n, 2, dificultad, false);
  const lineas = barajar(rng, pistas).map((p) => textoPistaTabla(p, gente, cats));
  const [fila0, fila1] = [en(a, 0), en(a, 1)];
  const ocultas = gente.map((_, p) => p).filter((p) => !pistas.some((x) => (x.tipo === "si" && x.p === p && x.cat === 1) || (x.tipo === "cruceSi" && x.i === en(fila0, p))));
  const p = elegir(rng, ocultas.length > 0 ? ocultas : gente.map((_, i) => i));
  const dato = en(c.items, en(fila0, p));
  const real = en(c2.items, en(fila1, p));
  const q = c2.que(`quien ${c.sg} ${dato.texto}`);
  return pregunta(rng, {
    subhabilidad: SUB_TABLA,
    dificultad,
    enunciado: `Hay ${n} personas: ${lista}. ${c.frase}: ${opciones}. ${c2.frase}: ${opciones2}. Lee las pistas. ${q}`,
    enunciadoFacil: `Hay ${n} personas: ${lista}. ${c.fraseFacil}: ${opciones}. ${c2.fraseFacil}: ${opciones2}. No se repite. Lee las pistas. ${q}`,
    imagen: cartelPistas(lineas),
    respuesta: { tipo: "opcion", correcta: capital(real.texto), distractores: c2.items.filter((x) => x !== real).map((x) => capital(x.texto)) },
    pista: "Haz dos tablas, una para cada dato. Empieza por la pista más segura y tacha lo que no puede ser.",
    explicacion: `Solo hay un reparto posible: ${resumenTabla(a, gente, cats)}.`,
    plantilla: `${SUB_TABLA}:${c.id}-${c2.id}:d3`,
  });
};

const tablaMarcada: Generador = (rng, dificultad) => {
  if (dificultad === 3) return tablaConPistas(rng, dificultad);
  const n = dificultad === 1 ? 3 : 4;
  const gente = nombres(rng, n);
  const c = acotar(elegir(rng, CATEGORIAS), n, rng);
  const { a, pistas } = puzleTabla(rng, n, 1, dificultad, true);
  const marca = (p: number, i: number) => {
    const m = pistas.find((x) => (x.tipo === "si" || x.tipo === "no") && x.p === p && x.i === i);
    return m === undefined ? "" : m.tipo === "si" ? "sí" : "no";
  };
  const imagen: Imagen = {
    tipo: "tabla",
    titulo: "Lo que ya se sabe",
    cabeceras: ["Persona", ...c.items.map((x) => x.corto)],
    filas: gente.map((g, p) => [g, ...c.items.map((_, i) => marca(p, i))]),
  };
  return preguntaSimple(rng, dificultad, c, gente, a, pistas, {
    enunciado: `${c.frase}. En la tabla, «sí» quiere decir que esa persona y esa columna van juntas, y «no», que no van juntas. Una casilla vacía significa que aún no se sabe.`,
    enunciadoFacil: `${c.fraseFacil}. No se repite. Mira la tabla. «Sí»: van juntas. «No»: no van juntas. Vacía: aún no se sabe.`,
    imagen,
    plantilla: `${SUB_TABLA}:${c.id}:marcada:d${dificultad}`,
  });
};

export const GENERADORES_LOGICA = {
  "PEN5-T1-a": [ordenarConPistas],
  "PEN5-T1-b": [tablaConPistas, tablaMarcada],
} as const;
