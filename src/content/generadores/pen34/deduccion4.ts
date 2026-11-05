// PEN4-T1 · Deducción. Cada pregunta enumera todas las posibilidades y comprueba en
// código que las pistas dejan exactamente una solución y que ninguna pista sobra.
import type { Rng } from "../../../core/rng.ts";
import { ContenidoError, barajar, elegir, entero, muestra, nombre, nombres } from "../../ayuda.ts";
import type { ColorId, Dificultad, FormaId, Generador, Imagen } from "../../tipos.ts";
import { TODAS, buscar, en, enumerar, generadorDePlantillas, mayus, type Contenido, type Plantilla } from "./comun.ts";
import { propiedadesPosibles, type Propiedad } from "./pistas.ts";

function textoPistas(pistas: readonly string[]): string {
  if (pistas.length === 1) return `Pista: ${mayus(en(pistas, 0))}.`;
  return pistas.map((p, i) => `Pista ${i + 1}: ${mayus(p)}.`).join(" ");
}

// Las pistas identifican un único elemento y, si se quita cualquiera, deja de ser único.
function pistasNecesarias<T>(candidatos: readonly T[], pistas: readonly ((x: T) => boolean)[]): boolean {
  const quedan = (lista: readonly ((x: T) => boolean)[]): number => candidatos.filter((c) => lista.every((p) => p(c))).length;
  if (quedan(pistas) !== 1) return false;
  return pistas.every((_, i) => quedan(pistas.filter((__, j) => j !== i)) > 1);
}

// ---------- Número secreto ----------
function listaNumeros(rng: Rng, n: number): number[] {
  const salida = new Set<number>();
  while (salida.size < n) salida.add(entero(rng, 11, 89));
  return [...salida].sort((a, b) => a - b);
}

function numeroSecreto(rng: Rng, d: Dificultad): Contenido {
  const tam = d === 1 ? 4 : d === 2 ? 6 : 8;
  const cuantas = d === 1 ? 2 : 3;
  const quien = nombre(rng);
  return buscar(() => {
    const lista = listaNumeros(rng, tam);
    const secreto = elegir(rng, lista);
    const verdaderas = propiedadesPosibles(d === 3).filter((p) => p.cumple(secreto));
    const pistas = muestra(rng, verdaderas, cuantas);
    if (!pistasNecesarias(lista, pistas.map((p) => p.cumple))) return null;
    const texto = textoPistas(pistas.map((p) => p.texto));
    return {
      enunciado: `${quien} piensa en un número de esta lista: ${lista.join(", ")}. ${texto} ¿Qué número es?`,
      enunciadoFacil: `Lista: ${lista.join(", ")}. ${texto} ¿Qué número es? Escríbelo.`,
      respuesta: { tipo: "numero", valor: secreto },
      pista: "Usa la primera pista y tacha los números que no la cumplen. Sigue con la siguiente.",
      explicacion: `El ${secreto} es el único número de la lista que cumple todas las pistas: ${enumerar(pistas.map((p) => p.texto))}.`,
    };
  });
}

// ---------- Figuras ----------
const LADOS: Readonly<Partial<Record<FormaId, number>>> = { triangulo: 3, cuadrado: 4, rectangulo: 4, rombo: 4, pentagono: 5, hexagono: 6 };
const NOMBRE_FORMA: Readonly<Partial<Record<FormaId, string>>> = { triangulo: "triángulo", cuadrado: "cuadrado", rectangulo: "rectángulo", rombo: "rombo", pentagono: "pentágono", hexagono: "hexágono" };
const NOMBRE_COLOR: Readonly<Partial<Record<ColorId, string>>> = { rojo: "rojo", azul: "azul", verde: "verde", amarillo: "amarillo", morado: "morado" };

interface Figura {
  readonly forma: FormaId;
  readonly color: ColorId;
}
interface PistaFigura {
  readonly texto: string;
  readonly cumple: (f: Figura) => boolean;
}

const lados = (f: Figura): number => LADOS[f.forma] ?? 0;
const nombreFigura = (f: Figura): string => `${NOMBRE_FORMA[f.forma] ?? ""} ${NOMBRE_COLOR[f.color] ?? ""}`;
const FORMAS_LADOS = Object.keys(LADOS) as FormaId[];
const COLORES_FIG = Object.keys(NOMBRE_COLOR) as ColorId[];

function figuras(rng: Rng, n: number): Figura[] {
  const todas = FORMAS_LADOS.flatMap((forma) => COLORES_FIG.map((color) => ({ forma, color })));
  return muestra(rng, todas, n);
}

function pistasFigura(): PistaFigura[] {
  const salida: PistaFigura[] = [];
  for (const color of COLORES_FIG) {
    const nombreColor = NOMBRE_COLOR[color] ?? "";
    salida.push({ texto: `es de color ${nombreColor}`, cumple: (f) => f.color === color });
    salida.push({ texto: `no es de color ${nombreColor}`, cumple: (f) => f.color !== color });
  }
  for (const k of [3, 4, 5, 6]) {
    salida.push({ texto: `tiene ${k} lados`, cumple: (f) => lados(f) === k });
    salida.push({ texto: `no tiene ${k} lados`, cumple: (f) => lados(f) !== k });
  }
  for (const k of [3, 4, 5]) salida.push({ texto: `tiene más de ${k} lados`, cumple: (f) => lados(f) > k });
  for (const k of [4, 5, 6]) salida.push({ texto: `tiene menos de ${k} lados`, cumple: (f) => lados(f) < k });
  return salida;
}

function opcionFigura(f: Figura): { texto: string; imagen: Imagen } {
  return { texto: nombreFigura(f), imagen: { tipo: "figura", forma: f.forma, color: f.color } };
}

function figuraSecreta(rng: Rng, d: Dificultad): Contenido {
  const cuantas = d === 3 ? 3 : 2;
  return buscar(() => {
    const lista = figuras(rng, 4);
    const secreta = elegir(rng, lista);
    const verdaderas = pistasFigura().filter((p) => p.cumple(secreta) && (d !== 1 || !p.texto.startsWith("no ")));
    const pistas = muestra(rng, verdaderas, cuantas);
    if (!pistasNecesarias(lista, pistas.map((p) => p.cumple))) return null;
    const texto = textoPistas(pistas.map((p) => p.texto));
    return {
      enunciado: `Estoy pensando en una de estas figuras. ${texto} ¿Qué figura es?`,
      enunciadoFacil: `${texto} ¿Qué figura es?`,
      respuesta: { tipo: "imagen", correcta: opcionFigura(secreta), distractores: lista.filter((f) => f !== secreta).map(opcionFigura) },
      pista: "Cuenta los lados y mira el color. Descarta las figuras que no cumplen una pista.",
      explicacion: `El ${nombreFigura(secreta)} es la única figura que cumple todas las pistas: ${enumerar(pistas.map((p) => p.texto))}.`,
    };
  });
}

// ---------- Ordenar personas por una comparación ----------
interface Relacion {
  readonly clave: string;
  readonly mas: string;
  readonly menos: string;
  readonly preguntaMas: string;
  readonly preguntaMenos: string;
}

const RELACIONES: readonly Relacion[] = [
  { clave: "anos", mas: "tiene más años que", menos: "tiene menos años que", preguntaMas: "tiene más años", preguntaMenos: "tiene menos años" },
  { clave: "monedas", mas: "tiene más monedas que", menos: "tiene menos monedas que", preguntaMas: "tiene más monedas", preguntaMenos: "tiene menos monedas" },
  { clave: "lejos", mas: "vive más lejos de la escuela que", menos: "vive más cerca de la escuela que", preguntaMas: "vive más lejos de la escuela", preguntaMenos: "vive más cerca de la escuela" },
  { clave: "libros", mas: "ha leído más libros que", menos: "ha leído menos libros que", preguntaMas: "ha leído más libros", preguntaMenos: "ha leído menos libros" },
];

function permutaciones<T>(lista: readonly T[]): T[][] {
  if (lista.length <= 1) return [[...lista]];
  return lista.flatMap((x, i) => permutaciones(lista.filter((_, j) => j !== i)).map((resto) => [x, ...resto]));
}

function comparar(rel: Relacion, rng: Rng, d: Dificultad): Contenido {
  const k = d === 1 ? 3 : d === 2 ? 4 : 5;
  const orden = nombres(rng, k); // orden[0] es el que más tiene
  const pares: [string, string][] = orden.slice(1).map((b, i) => [en(orden, i), b]);
  const pistas = barajar(rng, pares).map(([a, b]) => ({ a, b, mas: rng() < 0.5 }));
  const textos = pistas.map((p) => (p.mas ? `${p.a} ${rel.mas} ${p.b}` : `${p.b} ${rel.menos} ${p.a}`));
  // Comprobación por fuerza bruta: solo un orden cumple todas las pistas.
  const validos = permutaciones(orden).filter((o) => pistas.every((p) => o.indexOf(p.a) < o.indexOf(p.b)));
  if (validos.length !== 1) throw new ContenidoError("Orden no único");
  const pideMas = rng() < 0.5;
  const correcta = pideMas ? en(orden, 0) : en(orden, k - 1);
  const distractores = muestra(rng, orden.filter((n) => n !== correcta), 3 > k - 1 ? k - 1 : 3);
  const pregunta = pideMas ? rel.preguntaMas : rel.preguntaMenos;
  const frases = textos.map((t) => `${t}.`).join(" ");
  return {
    enunciado: `${frases} ¿Quién ${pregunta}?`,
    enunciadoFacil: `${frases} ¿Quién ${pregunta}?`,
    respuesta: { tipo: "opcion", correcta, distractores },
    pista: "Escribe los nombres en una fila y ve colocándolos con cada frase.",
    explicacion: `Si los colocas en fila, de quien ${rel.preguntaMas} a quien ${rel.preguntaMenos}, el orden es ${enumerar(orden)}. Por eso ${correcta} es quien ${pregunta}.`,
  };
}

// ---------- Tres personas y tres cosas ----------
interface Reparto {
  readonly clave: string;
  readonly intro: string;
  readonly cosas: readonly { readonly nombre: string; readonly accion: string; readonly negada: string }[];
}

const REPARTOS: readonly Reparto[] = [
  {
    clave: "animales",
    intro: "cuida un animal distinto",
    cosas: [
      { nombre: "el gato", accion: "cuida el gato", negada: "no cuida el gato" },
      { nombre: "el perro", accion: "cuida el perro", negada: "no cuida el perro" },
      { nombre: "el pato", accion: "cuida el pato", negada: "no cuida el pato" },
    ],
  },
  {
    clave: "tareas",
    intro: "hace una tarea distinta",
    cosas: [
      { nombre: "barrer", accion: "barre", negada: "no barre" },
      { nombre: "regar", accion: "riega", negada: "no riega" },
      { nombre: "ordenar", accion: "ordena", negada: "no ordena" },
    ],
  },
  {
    clave: "lugares",
    intro: "vive en un lugar distinto",
    cosas: [
      { nombre: "junto al pozo", accion: "vive junto al pozo", negada: "no vive junto al pozo" },
      { nombre: "junto al mercado", accion: "vive junto al mercado", negada: "no vive junto al mercado" },
      { nombre: "junto a la escuela", accion: "vive junto a la escuela", negada: "no vive junto a la escuela" },
    ],
  },
  {
    clave: "mochilas",
    intro: "lleva una mochila de un color distinto",
    cosas: [
      { nombre: "roja", accion: "lleva la mochila roja", negada: "no lleva la mochila roja" },
      { nombre: "azul", accion: "lleva la mochila azul", negada: "no lleva la mochila azul" },
      { nombre: "verde", accion: "lleva la mochila verde", negada: "no lleva la mochila verde" },
    ],
  },
];

function reparto(r: Reparto, rng: Rng, d: Dificultad): Contenido {
  const gente = nombres(rng, 3);
  const indices = [0, 1, 2];
  const asignaciones = permutaciones(indices); // asignaciones[x][persona] = cosa
  const solucion = elegir(rng, asignaciones);
  return buscar(() => {
    interface PistaR { readonly persona: number; readonly cosa: number; readonly positiva: boolean }
    const todas: PistaR[] = indices.flatMap((persona) => indices.map((cosa) => ({ persona, cosa, positiva: en(solucion, persona) === cosa })));
    const positivas = todas.filter((p) => p.positiva);
    const negativas = todas.filter((p) => !p.positiva);
    const pistas = d === 2 ? [elegir(rng, positivas), elegir(rng, negativas)] : muestra(rng, negativas, 3);
    const cumple = pistas.map((p) => (a: number[]) => (en(a, p.persona) === p.cosa) === p.positiva);
    if (!pistasNecesarias(asignaciones, cumple)) return null;
    const textos = barajar(rng, pistas).map((p) => {
      const cosa = en(r.cosas, p.cosa);
      return `${en(gente, p.persona)} ${p.positiva ? cosa.accion : cosa.negada}`;
    });
    // Se pregunta por algo que ninguna pista dice directamente.
    const objetivo = elegir(rng, indices.filter((i) => !pistas.some((p) => p.positiva && p.cosa === i)));
    const persona = solucion.indexOf(objetivo);
    const cosa = en(r.cosas, objetivo);
    const correcta = en(gente, persona);
    const frases = textos.map((t) => `${t}.`).join(" ");
    const intro = `${enumerar(gente)}: cada persona ${r.intro} (${enumerar(r.cosas.map((c) => c.nombre))}).`;
    return {
      enunciado: `${intro} ${frases} ¿Quién ${cosa.accion}?`,
      enunciadoFacil: `${intro} ${frases} ¿Quién ${cosa.accion}?`,
      respuesta: { tipo: "opcion", correcta, distractores: gente.filter((g) => g !== correcta) },
      pista: "Haz una tabla pequeña con personas y opciones. Tacha lo que las pistas no permiten.",
      explicacion: `Con las pistas solo hay un reparto posible: ${enumerar(gente.map((g, i) => `${g} ${en(r.cosas, en(solucion, i)).accion}`))}.`,
    };
  });
}

// ---------- ¿Quién es? Tabla de sí y no ----------
const PRENDAS = ["gorro", "mochila", "paraguas", "libro"] as const;

interface Persona {
  readonly nombre: string;
  readonly lleva: readonly boolean[];
}

function articuloPrenda(c: string): string {
  return c === "mochila" ? "una mochila" : `un ${c}`;
}

function tablaPersonas(rng: Rng, n: number, prendas: readonly string[]): { personas: Persona[]; imagen: Imagen } {
  const gente = nombres(rng, n);
  const personas = gente.map((nombreP) => ({ nombre: nombreP, lleva: prendas.map(() => rng() < 0.5) }));
  const imagen: Imagen = {
    tipo: "tabla",
    titulo: "Qué lleva cada persona",
    cabeceras: ["Nombre", ...prendas.map(mayus)],
    filas: personas.map((p) => [p.nombre, ...p.lleva.map((x) => (x ? "Sí" : "No"))]),
  };
  return { personas, imagen };
}

interface PistaPersona {
  readonly texto: string;
  readonly cumple: (p: Persona) => boolean;
}

function pistasPersona(prendas: readonly string[]): PistaPersona[] {
  return prendas.flatMap((c, j) => [
    { texto: `lleva ${articuloPrenda(c)}`, cumple: (p: Persona) => en(p.lleva, j) },
    { texto: `no lleva ${articuloPrenda(c)}`, cumple: (p: Persona) => !en(p.lleva, j) },
  ]);
}

function quienEs(rng: Rng, d: Dificultad): Contenido {
  const n = d === 1 ? 3 : 4;
  const prendas = muestra(rng, PRENDAS, d === 3 ? 4 : d === 2 ? 3 : 2);
  const cuantas = d === 3 ? 3 : 2;
  return buscar(() => {
    const { personas, imagen } = tablaPersonas(rng, n, prendas);
    const secreta = elegir(rng, personas);
    const verdaderas = pistasPersona(prendas).filter((p) => p.cumple(secreta));
    if (verdaderas.length < cuantas) return null;
    const pistas = muestra(rng, verdaderas, cuantas);
    if (!pistasNecesarias(personas, pistas.map((p) => p.cumple))) return null;
    const texto = textoPistas(pistas.map((p) => p.texto));
    return {
      enunciado: `Mira la tabla. Busco a una persona. ${texto} ¿A quién busco?`,
      enunciadoFacil: `Mira la tabla. ${texto} ¿Quién es?`,
      imagen,
      respuesta: { tipo: "opcion", correcta: secreta.nombre, distractores: personas.filter((p) => p !== secreta).map((p) => p.nombre) },
      pista: "Mira la columna de cada pista y tacha a quien no la cumple.",
      explicacion: `Solo ${secreta.nombre} cumple todas las pistas: ${enumerar(pistas.map((p) => p.texto))}.`,
    };
  });
}

const PLANTILLAS_PISTAS: readonly Plantilla[] = [
  { clave: "numero", dificultades: TODAS, crear: numeroSecreto },
  { clave: "figura", dificultades: TODAS, crear: figuraSecreta },
  { clave: "quien", dificultades: TODAS, crear: quienEs },
  ...RELACIONES.map((r): Plantilla => ({ clave: `orden-${r.clave}`, dificultades: TODAS, crear: (rng, d) => comparar(r, rng, d) })),
  ...REPARTOS.map((r): Plantilla => ({ clave: `reparto-${r.clave}`, dificultades: [2, 3], crear: (rng, d) => reparto(r, rng, d) })),
];

// ---------- Descartar opciones ----------
function noPuedeSer(rng: Rng, d: Dificultad): Contenido {
  const cuantas = d;
  return buscar(() => {
    const secretoBase = entero(rng, 11, 89);
    const verdaderas = propiedadesPosibles(d === 3).filter((p) => p.cumple(secretoBase));
    const pistas = muestra(rng, verdaderas, cuantas);
    // Cinco números: tres que cumplen todo y uno que falla justo una pista.
    const posibles = Array.from({ length: 79 }, (_, i) => i + 11);
    const cumplen = posibles.filter((n) => pistas.every((p) => p.cumple(n)));
    const fallan = posibles.filter((n) => pistas.filter((p) => !p.cumple(n)).length === 1);
    if (cumplen.length < 3 || fallan.length === 0) return null;
    const correcta = elegir(rng, fallan);
    const fallo = pistas.find((p) => !p.cumple(correcta));
    if (fallo === undefined) return null;
    const texto = textoPistas(pistas.map((p) => p.texto));
    const singular = pistas.length === 1;
    return {
      enunciado: `Tengo un número secreto. ${texto} ¿Qué número puedes descartar?`,
      enunciadoFacil: `Número secreto. ${texto} ¿Qué número NO puede ser?`,
      respuesta: { tipo: "opcion", correcta: String(correcta), distractores: muestra(rng, cumplen, 3).map(String) },
      pista: singular ? "Busca el número que no cumple la pista." : "Comprueba cada número con todas las pistas. Basta con que falle una.",
      explicacion: `El ${correcta} no puede ser porque la pista dice que ${fallo.texto}, y el ${correcta} no lo cumple.`,
    };
  });
}

function cuantasQuedan(rng: Rng, d: Dificultad): Contenido {
  const tam = d === 1 ? 6 : d === 2 ? 8 : 10;
  return buscar(() => {
    const lista = listaNumeros(rng, tam);
    const pistas = muestra(rng, propiedadesPosibles(d === 3), d);
    const quedan = lista.filter((n) => pistas.every((p) => p.cumple(n)));
    if (quedan.length < 1 || quedan.length === tam) return null;
    // Cada pista debe descartar algo.
    if (pistas.some((p) => lista.every((n) => p.cumple(n)))) return null;
    const texto = textoPistas(pistas.map((p) => p.texto));
    return {
      enunciado: `El número secreto está en esta lista: ${lista.join(", ")}. ${texto} ¿Cuántos números de la lista siguen siendo posibles?`,
      enunciadoFacil: `Lista: ${lista.join(", ")}. ${texto} ¿Cuántos números quedan? Escribe cuántos.`,
      respuesta: { tipo: "numero", valor: quedan.length },
      pista: "Tacha los números que no cumplen las pistas y cuenta los que quedan.",
      explicacion: `Después de descartar, ${quedan.length === 1 ? `solo queda el ${en(quedan, 0)}` : `quedan ${enumerar(quedan.map(String))}: son ${quedan.length} números`}.`,
    };
  });
}

function figuraDescartar(rng: Rng, d: Dificultad): Contenido {
  return buscar(() => {
    const lista = figuras(rng, 4);
    const pistas = muestra(rng, pistasFigura(), d);
    const fallan = lista.filter((f) => pistas.filter((p) => !p.cumple(f)).length >= 1);
    if (fallan.length !== 1) return null;
    const descartada = en(fallan, 0);
    if (pistas.filter((p) => !p.cumple(descartada)).length !== 1) return null;
    const fallo = pistas.find((p) => !p.cumple(descartada));
    if (fallo === undefined) return null;
    const texto = textoPistas(pistas.map((p) => p.texto));
    return {
      enunciado: `Busco una figura. ${texto} ¿Qué figura puedes descartar?`,
      enunciadoFacil: `Busco una figura. ${texto} ¿Qué figura NO puede ser?`,
      respuesta: { tipo: "imagen", correcta: opcionFigura(descartada), distractores: lista.filter((f) => f !== descartada).map(opcionFigura) },
      pista: "Comprueba cada figura. Se descarta la que no cumple alguna pista.",
      explicacion: `El ${nombreFigura(descartada)} no puede ser porque la figura ${fallo.texto}. Las otras figuras cumplen ${pistas.length === 1 ? "la pista" : "todas las pistas"}.`,
    };
  });
}

function personaDescartar(rng: Rng, d: Dificultad): Contenido {
  const prendas = muestra(rng, PRENDAS, d === 1 ? 2 : 3);
  return buscar(() => {
    const { personas, imagen } = tablaPersonas(rng, 4, prendas);
    const pistas = muestra(rng, pistasPersona(prendas), d);
    const fallan = personas.filter((p) => pistas.some((x) => !x.cumple(p)));
    if (fallan.length !== 1) return null;
    const descartada = en(fallan, 0);
    const fallo = pistas.find((x) => !x.cumple(descartada));
    if (fallo === undefined) return null;
    const texto = textoPistas(pistas.map((p) => p.texto));
    return {
      enunciado: `Mira la tabla. Busco a una persona. ${texto} ¿A quién puedes descartar?`,
      enunciadoFacil: `Mira la tabla. ${texto} ¿Quién NO puede ser?`,
      imagen,
      respuesta: { tipo: "opcion", correcta: descartada.nombre, distractores: personas.filter((p) => p !== descartada).map((p) => p.nombre) },
      pista: "Mira la columna de cada pista. Busca a quien no la cumple.",
      explicacion: `${descartada.nombre} no cumple esta pista: ${fallo.texto}. Por eso se descarta.`,
    };
  });
}

function mejorPista(rng: Rng, d: Dificultad): Contenido {
  const tam = d === 2 ? 6 : 8;
  return buscar(() => {
    const lista = listaNumeros(rng, tam);
    const pistas: Propiedad[] = muestra(rng, propiedadesPosibles(d === 3), 3);
    const descartados = pistas.map((p) => lista.filter((n) => !p.cumple(n)).length);
    const maximo = Math.max(...descartados);
    if (descartados.filter((x) => x === maximo).length !== 1 || maximo === tam || Math.min(...descartados) === 0) return null;
    const mejor = en(pistas, descartados.indexOf(maximo));
    const quedan = lista.filter((n) => mejor.cumple(n));
    return {
      enunciado: `El número secreto está en esta lista: ${lista.join(", ")}. Puedes pedir una sola pista. ¿Qué pista descarta más números de la lista?`,
      enunciadoFacil: `Lista: ${lista.join(", ")}. Puedes pedir una pista. ¿Qué pista quita más números?`,
      respuesta: { tipo: "opcion", correcta: mayus(mejor.texto), distractores: pistas.filter((p) => p !== mejor).map((p) => mayus(p.texto)) },
      pista: "Para cada pista, cuenta cuántos números de la lista no la cumplen.",
      explicacion: `La pista «${mejor.texto}» descarta ${maximo} ${maximo === 1 ? "número" : "números"} y deja ${quedan.length === 1 ? "solo 1" : quedan.length}. Las otras descartan menos.`,
    };
  });
}

const PLANTILLAS_DESCARTAR: readonly Plantilla[] = [
  { clave: "no-puede-ser", dificultades: TODAS, crear: noPuedeSer },
  { clave: "cuantas-quedan", dificultades: TODAS, crear: cuantasQuedan },
  { clave: "figura", dificultades: TODAS, crear: figuraDescartar },
  { clave: "persona", dificultades: TODAS, crear: personaDescartar },
  { clave: "mejor-pista", dificultades: [2, 3], crear: mejorPista },
];

export const GENERADORES_DEDUCCION4: Readonly<Record<string, readonly Generador[]>> = {
  "PEN4-T1-a": [generadorDePlantillas("PEN4-T1-a", PLANTILLAS_PISTAS)],
  "PEN4-T1-b": [generadorDePlantillas("PEN4-T1-b", PLANTILLAS_DESCARTAR)],
};
