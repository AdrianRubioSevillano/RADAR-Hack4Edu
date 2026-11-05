// 5.º: decimales, fracciones y porcentajes sencillos.
import type { Rng } from "../../../core/rng.ts";
import { barajar, contable, elegir, entero, muestra, nombre, nombres } from "../../ayuda.ts";
import type { Dificultad, Imagen, MapaGeneradores } from "../../tipos.ts";
import {
  BARATOS, CAROS, articuloBarato, articuloCaro, cifras, conComa, cuarteto, dinero, dosCifras, generadores, mayus, mcd, numero, opciones, opcionesDinero,
  opcionesNumero, par, porNivel, rango, trio, type Plantilla,
} from "./comun.ts";

const CIFRAS = rango(2, 9);

// ---------- NUM5-T1-a: décimas y centésimas ----------
const cifraDelLugar: Plantilla = (rng, d) => {
  const [a, b, c, e] = cuarteto(rng, CIFRAS);
  const lugar = d === 1 ? "décimas" : d === 2 ? "centésimas" : elegir(rng, ["décimas", "centésimas"]);
  const texto = d === 3 ? `${a}${b},${c}${e}` : `${a},${b}${c}`;
  const decima = d === 3 ? c : b;
  const centesima = d === 3 ? e : c;
  const correcta = lugar === "décimas" ? decima : centesima;
  const otras = (d === 3 ? [a, b, c, e] : [a, b, c]).filter((x) => x !== correcta);
  return {
    enunciado: `En el número ${texto}, ¿qué cifra está en el lugar de las ${lugar}?`,
    enunciadoFacil: `Mira el número ${texto}. ¿Qué cifra está en las ${lugar}?`,
    respuesta: opciones(String(correcta), otras.map(String)),
    pista: "Mira las cifras que hay después de la coma. La primera son las décimas y la segunda, las centésimas.",
    explicacion: `En ${texto}, después de la coma va primero el ${decima} (décimas) y luego el ${centesima} (centésimas).`,
  };
};

const valorDeLaCifra: Plantilla = (rng, d) => {
  const [a, b, c, e] = cuarteto(rng, CIFRAS);
  const texto = d === 3 ? `${a}${b},${c}${e}` : `${a},${b}${c}`;
  const lugar = d === 1 ? "décimas" : d === 2 ? "centésimas" : elegir(rng, ["decenas", "unidades", "décimas", "centésimas"]);
  const cifras: Readonly<Record<string, number>> = d === 3 ? { decenas: a, unidades: b, décimas: c, centésimas: e } : { unidades: a, décimas: b, centésimas: c };
  const cifra = cifras[lugar] ?? 0;
  const lugares = Object.keys(cifras);
  return {
    enunciado: `¿Qué valor tiene la cifra ${cifra} en el número ${texto}?`,
    enunciadoFacil: `Mira la cifra ${cifra} en el número ${texto}. ¿Qué valor tiene?`,
    respuesta: opciones(`${cifra} ${lugar}`, lugares.filter((l) => l !== lugar).map((l) => `${cifra} ${l}`)),
    pista: "Busca la cifra y mira si está antes o después de la coma, y en qué lugar.",
    explicacion: `En ${texto}, la cifra ${cifra} está en el lugar de las ${lugar}: vale ${cifra} ${lugar}.`,
  };
};

const fraccionADecimal: Plantilla = (rng, d) => {
  const [a, b, c] = trio(rng, CIFRAS);
  const variantes: readonly [number, number][] =
    d === 1 ? [[a, 10]] : d === 2 ? [[a * 10 + b, 100]] : [[a, 100], [a * 100 + b * 10 + c, 100]];
  const [num, den] = elegir(rng, variantes);
  const respuesta = conComa(den === 10 ? num * 10 : num);
  return {
    enunciado: `Escribe la fracción ${num}/${den} como número decimal.`,
    enunciadoFacil: `Tienes la fracción ${num}/${den}. Escríbela con coma.`,
    respuesta: numero(respuesta),
    pista: den === 10 ? "Si el denominador es 10, hablamos de décimas: hay una cifra después de la coma." : "Si el denominador es 100, hablamos de centésimas: hay dos cifras después de la coma.",
    explicacion: `${num}/${den} son ${num} ${den === 10 ? "décimas" : "centésimas"}, que se escribe ${respuesta}.`,
  };
};

const formarNumero: Plantilla = (rng, d) => {
  const [a, b, c] = trio(rng, CIFRAS);
  if (d === 1) {
    return {
      enunciado: `¿Qué número se forma con ${a} unidades y ${b} décimas?`,
      enunciadoFacil: `Tienes ${a} unidades. Tienes ${b} décimas. ¿Qué número es?`,
      respuesta: opciones(`${a},${b}`, [`${b},${a}`, `${a},0${b}`, `0,${a}${b}`]),
      pista: "Las unidades van antes de la coma y las décimas, justo después.",
      explicacion: `Las ${a} unidades van antes de la coma y las ${b} décimas justo después: ${a},${b}.`,
    };
  }
  if (d === 2) {
    return {
      enunciado: `¿Qué número se forma con ${a} unidades, ${b} décimas y ${c} centésimas?`,
      enunciadoFacil: `Tienes ${a} unidades, ${b} décimas y ${c} centésimas. ¿Qué número es?`,
      respuesta: opciones(`${a},${b}${c}`, [`${a},${c}${b}`, `${b},${a}${c}`, `${c},${b}${a}`]),
      pista: "Después de la coma van primero las décimas y luego las centésimas.",
      explicacion: `Se escribe ${a}, luego la coma, luego ${b} (décimas) y ${c} (centésimas): ${a},${b}${c}.`,
    };
  }
  return {
    enunciado: `¿Qué número se forma con ${a} unidades y ${c} centésimas, sin ninguna décima?`,
    enunciadoFacil: `Tienes ${a} unidades y ${c} centésimas. No hay décimas. ¿Qué número es?`,
    respuesta: opciones(`${a},0${c}`, [`${a},${c}`, `0,${a}${c}`, `${c},0${a}`]),
    pista: "Si no hay décimas, en su lugar se escribe un cero.",
    explicacion: `No hay décimas, así que después de la coma va un 0 y luego el ${c}: ${a},0${c}.`,
  };
};

const barraDeDecimas: Plantilla = (rng, d) => {
  const k = entero(rng, 1, 9);
  const imagen: Imagen = { tipo: "fraccion", forma: "barra", partes: 10, coloreadas: k };
  if (d === 1) {
    return {
      enunciado: "La barra entera vale 1 y está dividida en 10 partes iguales. ¿Qué número decimal indica la parte coloreada?",
      enunciadoFacil: "La barra entera vale 1. Tiene 10 partes iguales. ¿Qué número indica la parte coloreada?",
      imagen,
      respuesta: numero(conComa(k * 10)),
      pista: "Cada parte es una décima. Cuenta las partes coloreadas.",
      explicacion: `Hay ${k === 1 ? "1 parte coloreada" : `${k} partes coloreadas`} de 10: ${k}/10, que se escribe ${conComa(k * 10)}.`,
    };
  }
  if (d === 2) {
    return {
      enunciado: "La barra entera vale 1 y está dividida en 10 partes iguales. ¿Qué número decimal indica la parte sin colorear?",
      enunciadoFacil: "La barra entera vale 1. Tiene 10 partes iguales. ¿Qué número indica la parte sin color?",
      imagen,
      respuesta: numero(conComa((10 - k) * 10)),
      pista: "Cada parte es una décima. Cuenta solo las partes blancas.",
      explicacion: `Sin colorear ${10 - k === 1 ? "queda 1 parte" : `quedan ${10 - k} partes`} de 10: ${10 - k}/10, que se escribe ${conComa((10 - k) * 10)}.`,
    };
  }
  return {
    enunciado: "La barra entera vale 1 y está dividida en 10 partes iguales. ¿Cuántas centésimas indica la parte coloreada?",
    enunciadoFacil: "La barra entera vale 1. Tiene 10 partes iguales. ¿Cuántas centésimas hay coloreadas?",
    imagen,
    respuesta: numero(k * 10),
    pista: "Cada décima vale lo mismo que 10 centésimas.",
    explicacion: `Hay ${k === 1 ? "1 décima coloreada" : `${k} décimas coloreadas`}, y cada décima son 10 centésimas: ${k} × 10 = ${k * 10}.`,
  };
};

// ---------- NUM5-T1-b: comparar ----------
// Tres o cuatro decimales, en centésimas, con la misma parte entera.
function decimalesParecidos(rng: Rng, d: Dificultad): number[] {
  const a = entero(rng, 1, 9) * 100;
  if (d === 1) return trio(rng, rango(1, 9)).map((x) => a + x * 10);
  if (d === 2) {
    const largos = muestra(rng, rango(11, 99).filter((c) => c % 10 !== 0), 2);
    return [a + entero(rng, 1, 9) * 10, ...largos.map((c) => a + c)];
  }
  const [p, q] = par(rng, rango(1, 9));
  return [a + p * 10 + q, a + q * 10 + p, a + p * 10, a + p];
}

function elMayorOMenor(tipo: "mayor" | "menor"): Plantilla {
  return (rng, d) => {
    const lista = decimalesParecidos(rng, d);
    const correcta = tipo === "mayor" ? Math.max(...lista) : Math.min(...lista);
    const otras = lista.filter((x) => x !== correcta);
    return {
      enunciado: `¿Cuál de estos números es el ${tipo}?`,
      enunciadoFacil: `Mira estos números. ¿Cuál es el ${tipo}?`,
      respuesta: opciones(conComa(correcta), otras.map(conComa)),
      pista: "Compara primero la parte entera, luego las décimas y después las centésimas. Más cifras no significa un número mayor.",
      explicacion: `Comparando cifra a cifra después de la coma, el ${tipo} es ${conComa(correcta)}.`,
    };
  };
}

function permutaciones(x: number, y: number, z: number): number[][] {
  return [[x, y, z], [x, z, y], [y, x, z], [y, z, x], [z, x, y], [z, y, x]];
}

const ordenarDecimales: Plantilla = (rng, d) => {
  const a = entero(rng, 1, 8) * 100;
  const [x, y, z] =
    d === 1
      ? trio(rng, rango(1, 9)).map((c) => a + c * 10) as [number, number, number]
      : d === 2
        ? (() => {
            const p = entero(rng, 2, 8);
            return [a + p * 10, a + (p - 1) * 10 + entero(rng, 1, 9), a + p * 10 + entero(rng, 1, 9)] as [number, number, number];
          })()
        : (() => {
            const p = entero(rng, 2, 8);
            return [a + p * 10, a + p, a + 100 + entero(rng, 1, 9)] as [number, number, number];
          })();
  const texto = (lista: readonly number[]) => lista.map(conComa).join(" < ");
  const correcta = [x, y, z].sort((m, n) => m - n);
  const [u, v, w] = barajar(rng, [x, y, z]).map(conComa);
  // Error típico: ordenar la parte decimal como si fuera un número entero (1,3 antes que 1,25).
  const comoEnteros = [x, y, z].sort((m, n) => Number(conComa(m).split(",")[1]) - Number(conComa(n).split(",")[1]));
  const candidatos = [comoEnteros, [...correcta].reverse(), ...barajar(rng, permutaciones(x, y, z))];
  const unicos = [...new Set(candidatos.map(texto))].filter((t) => t !== texto(correcta));
  return {
    enunciado: `¿Qué lista ordena de menor a mayor los números ${u}; ${v} y ${w}?`,
    enunciadoFacil: `Tienes ${u}; ${v} y ${w}. ¿Qué lista va de menor a mayor?`,
    respuesta: opciones(texto(correcta), unicos.slice(0, 3)),
    pista: "Escribe los números con dos cifras después de la coma: así es más fácil compararlos.",
    explicacion: `Si miramos las cifras por orden, el menor es ${conComa(correcta[0] ?? 0)} y el mayor es ${conComa(correcta[2] ?? 0)}.`,
  };
};

const SIGNOS = ["< (menor que)", "> (mayor que)", "= (igual a)"] as const;

const elegirSigno: Plantilla = (rng, d) => {
  const a = entero(rng, 1, 9) * 100;
  const p = entero(rng, 1, 9);
  const variantes: readonly [string, string, number, number][] =
    d === 1
      ? [[`${conComa(a + p * 10)}`, `${conComa(a + ((p % 9) + 1) * 10)}`, a + p * 10, a + ((p % 9) + 1) * 10]]
      : d === 2
        ? [[conComa(a + p * 10), conComa(a + 12 + (p % 7) * 10), a + p * 10, a + 12 + (p % 7) * 10]]
        : [
            [conComa(a + p * 10), dosCifras(a + p * 10), a + p * 10, a + p * 10],
            [dosCifras(a + p), conComa(a + p * 10), a + p, a + p * 10],
          ];
  const [t1, t2, v1, v2] = elegir(rng, variantes);
  const correcta = v1 < v2 ? SIGNOS[0] : v1 > v2 ? SIGNOS[1] : SIGNOS[2];
  const explicacion = v1 === v2 ? `${t1} y ${t2} valen lo mismo: un cero al final de la parte decimal no cambia el número.` : `Con dos cifras después de la coma: ${dosCifras(v1)} y ${dosCifras(v2)}. Por eso ${t1} es ${v1 < v2 ? "menor" : "mayor"} que ${t2}.`;
  return {
    enunciado: `¿Qué signo va en el hueco? ${t1} ___ ${t2}`,
    enunciadoFacil: `Compara ${t1} y ${t2}. ¿Qué signo va en medio? ${t1} ___ ${t2}`,
    respuesta: opciones(correcta, SIGNOS.filter((s) => s !== correcta)),
    pista: "Escribe los dos números con el mismo número de cifras después de la coma.",
    explicacion,
  };
};

interface Prueba {
  readonly frase: (n: string, v: string) => string;
  readonly pregunta: string;
  readonly facil: string;
  readonly gana: "mayor" | "menor";
}

const PRUEBAS: readonly Prueba[] = [
  { frase: (n, v) => `${n} salta ${v} m`, pregunta: "¿Quién salta más lejos?", facil: "¿Quién salta más lejos?", gana: "mayor" },
  { frase: (n, v) => `${n} tarda ${v} segundos en llegar a la meta`, pregunta: "¿Quién llega antes a la meta?", facil: "¿Quién tarda menos?", gana: "menor" },
  { frase: (n, v) => `${n} recoge ${v} kg de fruta`, pregunta: "¿Quién recoge más fruta?", facil: "¿Quién recoge más?", gana: "mayor" },
  { frase: (n, v) => `${n} camina ${v} km`, pregunta: "¿Quién camina menos?", facil: "¿Quién camina menos?", gana: "menor" },
];

const compararEnSituacion: Plantilla = (rng, d) => {
  const prueba = elegir(rng, PRUEBAS);
  const [v1, v2, v3] = decimalesParecidos(rng, d) as [number, number, number];
  const [a, b, c] = trio(rng, nombres(rng, 5));
  const datos: readonly [string, number][] = [[a, v1], [b, v2], [c, v3]];
  const objetivo = prueba.gana === "mayor" ? Math.max(v1, v2, v3) : Math.min(v1, v2, v3);
  const ganador = datos.find(([, v]) => v === objetivo)?.[0] ?? a;
  const frases = datos.map(([n, v]) => prueba.frase(n, conComa(v)));
  return {
    enunciado: `${frases[0]}, ${frases[1]} y ${frases[2]}. ${prueba.pregunta}`,
    enunciadoFacil: `${frases[0]}. ${frases[1]}. ${frases[2]}. ${prueba.facil}`,
    respuesta: opciones(ganador, [a, b, c].filter((n) => n !== ganador)),
    pista: "Compara los números cifra a cifra después de la coma.",
    explicacion: `El número ${prueba.gana} de los tres es ${conComa(objetivo)}, que es el de ${ganador}.`,
  };
};

// ---------- NUM5-T1-c: sumar y restar con dinero ----------
// Precio en centésimas.
function precio(rng: Rng, min: number, max: number, centimos: readonly number[]): number {
  return entero(rng, min, max) * 100 + elegir(rng, centimos);
}

const CON_LLEVADA = [25, 35, 45, 55, 65, 75, 85, 95];

const sumarPrecios: Plantilla = (rng, d) => {
  const [x, y, z] = trio(rng, BARATOS);
  const p1 = precio(rng, 1, 6, d === 1 ? [10, 20, 30] : CON_LLEVADA.slice(3));
  const p2 = precio(rng, 1, 6, d === 1 ? [20, 40, 50] : CON_LLEVADA.slice(3));
  const p3 = precio(rng, 1, 4, CON_LLEVADA);
  const lista = d === 3 ? [p1, p2, p3] : [p1, p2];
  const total = lista.reduce((s, v) => s + v, 0);
  const frase =
    d === 3
      ? `${mayus(x.un)} cuesta ${dinero(p1)}, ${y.un} cuesta ${dinero(p2)} y ${z.un} cuesta ${dinero(p3)}. ¿Cuántas monedas cuesta todo junto?`
      : `${mayus(x.un)} cuesta ${dinero(p1)} y ${y.un} cuesta ${dinero(p2)}. ¿Cuántas monedas cuesta todo junto?`;
  const facil =
    d === 3
      ? `${mayus(x.un)} cuesta ${dinero(p1)}. ${mayus(y.un)} cuesta ${dinero(p2)}. ${mayus(z.un)} cuesta ${dinero(p3)}. Suma los tres precios.`
      : `${mayus(x.un)} cuesta ${dinero(p1)}. ${mayus(y.un)} cuesta ${dinero(p2)}. Suma los dos precios.`;
  return {
    enunciado: frase,
    enunciadoFacil: facil,
    respuesta: numero(conComa(total)),
    pista: "Coloca los precios con las comas una debajo de la otra y suma.",
    explicacion: `${lista.map(cifras).join(" + ")} = ${cifras(total)}. Cuestan ${dinero(total)}.`,
  };
};

const calcularCambio: Plantilla = (rng, d) => {
  const [x, y] = par(rng, BARATOS);
  const n = nombre(rng);
  const p1 = precio(rng, 1, d === 1 ? 4 : 8, d === 1 ? [50] : CON_LLEVADA);
  const p2 = d === 3 ? precio(rng, 1, 8, CON_LLEVADA) : 0;
  const total = p1 + p2;
  const pago = d === 1 ? 500 : d === 2 ? 1000 : 2000;
  const cambio = pago - total;
  const compra = d === 3 ? `${x.un} de ${dinero(p1)} y ${y.un} de ${dinero(p2)}` : `${x.un} de ${dinero(p1)}`;
  return {
    enunciado: `${n} compra ${compra} y paga con ${dinero(pago)}. ¿Cuánto le devuelven?`,
    enunciadoFacil: `${n} compra ${compra}. Paga con ${dinero(pago)}. ¿Cuánto le devuelven?`,
    respuesta: opcionesDinero(rng, cambio, [cambio + 100, cambio - 100, total, cambio + 10, cambio - 10], 50),
    pista: d === 3 ? "Primero suma lo que cuesta todo. Después resta esa cantidad a lo que paga." : "Resta el precio a lo que paga. Puedes contar hacia arriba desde el precio.",
    explicacion: `${cifras(pago)} − ${cifras(total)} = ${cifras(cambio)}. Le devuelven ${dinero(cambio)}.`,
  };
};

const cuantoFalta: Plantilla = (rng, d) => {
  const x = articuloCaro(rng);
  const n = nombre(rng);
  const precioFinal = d === 1 ? entero(rng, 8, 15) * 100 + 50 : precio(rng, 10, 25, CON_LLEVADA);
  const falta = d === 1 ? entero(rng, 2, 6) * 100 : d === 2 ? entero(rng, 2, 6) * 100 + 50 : entero(rng, 2, 6) * 100 + elegir(rng, [15, 40, 60, 80]);
  const tiene = precioFinal - falta;
  return {
    enunciado: `${n} quiere comprar ${x.un} que cuesta ${dinero(precioFinal)} y tiene ${dinero(tiene)}. ¿Cuántas monedas le faltan?`,
    enunciadoFacil: `${mayus(x.un)} cuesta ${dinero(precioFinal)}. ${n} tiene ${dinero(tiene)}. ¿Cuántas monedas le faltan?`,
    respuesta: numero(conComa(falta)),
    pista: "Resta lo que tiene a lo que cuesta.",
    explicacion: `${cifras(precioFinal)} − ${cifras(tiene)} = ${cifras(falta)}. Le faltan ${dinero(falta)}.`,
  };
};

const cuantoMasCaro: Plantilla = (rng, d) => {
  const [x, y] = par(rng, CAROS);
  const p2 = precio(rng, 4, 12, d === 1 ? [20, 30] : CON_LLEVADA);
  const diferencia = d === 1 ? entero(rng, 2, 7) * 100 + elegir(rng, [10, 30, 50]) : entero(rng, 2, 9) * 100 + elegir(rng, d === 2 ? [50, 75] : [15, 35, 65, 85]);
  const p1 = p2 + diferencia;
  return {
    enunciado: `${mayus(x.un)} cuesta ${dinero(p1)} y ${y.un} cuesta ${dinero(p2)}. ¿Cuántas monedas más cuesta ${x.el} que ${y.el}?`,
    enunciadoFacil: `${mayus(x.un)} cuesta ${dinero(p1)}. ${mayus(y.un)} cuesta ${dinero(p2)}. ¿Cuántas monedas de diferencia hay?`,
    respuesta: opcionesDinero(rng, diferencia, [diferencia + 100, diferencia - 100, p1 + p2, diferencia + 10], 50),
    pista: "Para saber cuánto más cuesta, resta los dos precios.",
    explicacion: `${cifras(p1)} − ${cifras(p2)} = ${cifras(diferencia)}. Cuesta ${dinero(diferencia)} más.`,
  };
};

const leerRecibo: Plantilla = (rng, d) => {
  const items = trio(rng, BARATOS);
  const precios = items.map(() => precio(rng, 1, 5, d === 1 ? [10, 20, 30] : CON_LLEVADA));
  const usados = d === 1 ? 2 : 3;
  const lineas = items.slice(0, usados).map((a, i) => `${mayus(a.nombre)}: ${dinero(precios[i] ?? 0)}`);
  const total = precios.slice(0, usados).reduce((s, v) => s + v, 0);
  const imagen: Imagen = { tipo: "cartel", estilo: "recibo", titulo: "Recibo de la tienda", lineas };
  if (d === 3) {
    const pago = 2000;
    return {
      enunciado: `Mira el recibo. Si se paga con ${dinero(pago)}, ¿cuántas monedas hay que devolver?`,
      enunciadoFacil: `Mira el recibo. Se paga con ${dinero(pago)}. ¿Cuántas monedas hay que devolver?`,
      imagen,
      respuesta: numero(conComa(pago - total)),
      pista: "Primero suma todo el recibo. Después resta el total a lo que se paga.",
      explicacion: `El recibo suma ${dinero(total)}, y ${cifras(pago)} − ${cifras(total)} = ${cifras(pago - total)}.`,
    };
  }
  return {
    enunciado: "Mira el recibo. ¿Cuántas monedas hay que pagar en total?",
    enunciadoFacil: "Mira el recibo. Suma los precios. ¿Cuántas monedas son?",
    imagen,
    respuesta: numero(conComa(total)),
    pista: "Coloca los precios con las comas una debajo de la otra y suma.",
    explicacion: `${precios.slice(0, usados).map(cifras).join(" + ")} = ${cifras(total)}. Hay que pagar ${dinero(total)}.`,
  };
};

// ---------- NUM5-T2-a: fracciones equivalentes ----------
type Fraccion = readonly [number, number];
const texto = ([a, b]: Fraccion): string => `${a}/${b}`;
const iguales = ([a, b]: Fraccion, [c, e]: Fraccion): boolean => a * e === b * c;

const BASES: Readonly<Record<Dificultad, readonly Fraccion[]>> = {
  1: [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]],
  2: [[2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [3, 8], [5, 8]],
  3: [[3, 7], [5, 7], [4, 9], [7, 9], [3, 10], [7, 10], [5, 12], [7, 12]],
};

// Fracciones no equivalentes a `f` y distintas entre sí, a partir de errores típicos.
function noEquivalentes(f: Fraccion, candidatos: readonly Fraccion[], n: number): string[] {
  const salida: Fraccion[] = [];
  for (const c of candidatos) {
    if (c[0] > 0 && c[1] > 0 && !iguales(f, c) && !salida.some((s) => iguales(s, c))) salida.push(c);
  }
  return salida.slice(0, n).map(texto);
}

const elegirEquivalente: Plantilla = (rng, d) => {
  const f = elegir(rng, BASES[d]);
  const [a, b] = f;
  const k = porNivel(d, entero(rng, 2, 3), entero(rng, 2, 4), entero(rng, 3, 6));
  const distractores = noEquivalentes(f, [[a + k, b + k], [a * k, b], [a * k, b + k], [a, b * k], [a + 1, b * k], [a * k + 1, b * k]], 3);
  return {
    enunciado: `¿Qué fracción es equivalente a ${texto(f)}?`,
    enunciadoFacil: `Mira la fracción ${texto(f)}. ¿Cuál vale lo mismo?`,
    respuesta: opciones(texto([a * k, b * k]), distractores),
    pista: "Multiplica el numerador y el denominador por el mismo número.",
    explicacion: `Si multiplicamos arriba y abajo por ${k}, ${texto(f)} se convierte en ${a * k}/${b * k}.`,
  };
};

const noEsEquivalente: Plantilla = (rng, d) => {
  const f = elegir(rng, BASES[d]);
  const [a, b] = f;
  const [k1, k2, k3] = trio(rng, rango(2, 6));
  const intruso = elegir<Fraccion>(rng, [[a + k1, b + k1], [a * k1 + 1, b * k1]]);
  return {
    enunciado: `¿Cuál de estas fracciones no es equivalente a ${texto(f)}?`,
    enunciadoFacil: `Tres fracciones valen lo mismo que ${texto(f)}. Una no. ¿Cuál es la que no vale lo mismo?`,
    respuesta: opciones(texto(intruso), [k1, k2, k3].map((k) => texto([a * k, b * k]))),
    pista: "Comprueba si cada fracción sale de multiplicar arriba y abajo por el mismo número.",
    explicacion: `${texto(intruso)} no sale de multiplicar ${a} y ${b} por el mismo número, así que no vale lo mismo que ${texto(f)}.`,
  };
};

const completarEquivalente: Plantilla = (rng, d) => {
  const f = elegir(rng, BASES[d === 3 ? 2 : d]);
  const [a, b] = f;
  const k = porNivel(d, entero(rng, 2, 4), entero(rng, 3, 6), entero(rng, 2, 6));
  const [c, e] = [a * k, b * k];
  const hueco = d === 3 ? elegir(rng, ["abajo", "arriba"]) : d === 2 ? "abajo" : "arriba";
  const igualdad = d === 3 ? (hueco === "abajo" ? `${c}/${e} = ${a}/?` : `${c}/${e} = ?/${b}`) : hueco === "abajo" ? `${a}/${b} = ${c}/?` : `${a}/${b} = ?/${e}`;
  const correcta = hueco === "abajo" ? (d === 3 ? b : e) : d === 3 ? a : c;
  return {
    enunciado: `Completa la igualdad: ${igualdad}. ¿Qué número va en lugar del signo de interrogación?`,
    enunciadoFacil: `Mira la igualdad: ${igualdad}. ¿Qué número falta?`,
    respuesta: numero(correcta),
    pista: d === 3 ? "Busca entre qué número se ha dividido la parte que conoces." : "Busca por qué número se ha multiplicado la parte que conoces.",
    explicacion: d === 3 ? `Se ha dividido entre ${k} arriba y abajo: ${c} ÷ ${k} = ${a} y ${e} ÷ ${k} = ${b}.` : `Se ha multiplicado por ${k} arriba y abajo: ${a} × ${k} = ${c} y ${b} × ${k} = ${e}.`,
  };
};

const simplificar: Plantilla = (rng, d) => {
  const f = elegir(rng, d === 1 ? BASES[1] : BASES[2]);
  const k = porNivel(d, 2, elegir(rng, [3, 4, 5]), elegir(rng, [6, 8, 9, 10, 12]));
  const [a, b] = f;
  return {
    enunciado: `Simplifica la fracción ${a * k}/${b * k} todo lo posible.`,
    enunciadoFacil: `Tienes la fracción ${a * k}/${b * k}. Simplifícala todo lo que puedas.`,
    respuesta: numero(texto(f)),
    pista: "Divide el numerador y el denominador entre el mismo número. Sigue hasta que no puedas más.",
    explicacion: `Al dividir arriba y abajo entre ${k} queda ${texto(f)}, y ya no se puede simplificar más.`,
  };
};

const DIBUJOS: Readonly<Record<Dificultad, readonly Fraccion[]>> = {
  1: [[2, 4], [3, 6], [4, 8], [5, 10], [2, 6]],
  2: [[6, 8], [4, 6], [6, 9], [2, 8], [3, 9], [4, 10]],
  3: [[8, 12], [9, 12], [10, 12], [6, 10], [8, 10], [3, 12]],
};

const equivalenteDelDibujo: Plantilla = (rng, d) => {
  const f = elegir(rng, DIBUJOS[d]);
  const [c, e] = f;
  const g = mcd(c, e);
  const [a, b] = [c / g, e / g];
  const candidatos: readonly Fraccion[] = [[e - c, e], [a + 1, b + 1], [a, b + 1], [a + 1, b + 2], [c, e + 1], [c + 1, e]];
  return {
    enunciado: "El dibujo está dividido en partes iguales. ¿Qué fracción es equivalente a la parte coloreada?",
    enunciadoFacil: "El dibujo tiene partes iguales. Mira la parte coloreada. ¿Qué fracción vale lo mismo?",
    imagen: { tipo: "fraccion", forma: elegir(rng, ["circulo", "barra"]), partes: e, coloreadas: c },
    respuesta: opciones(texto([a, b]), noEquivalentes(f, candidatos.filter(([x, y]) => x < y), 3)),
    pista: "Cuenta las partes coloreadas y las partes totales. Después simplifica esa fracción.",
    explicacion: `Hay ${c} partes coloreadas de ${e}: ${c}/${e}. Al dividir arriba y abajo entre ${g} queda ${a}/${b}.`,
  };
};

// ---------- NUM5-T2-b: sumar con igual denominador ----------
// Pares (o tríos) de numeradores cuya suma es menor que el denominador y no se simplifica.
function sumandos(n: number, cuantos: 2 | 3): number[][] {
  const salida: number[][] = [];
  for (const a of rango(1, n - 1)) {
    for (const b of rango(1, n - 1)) {
      if (cuantos === 2 && a + b < n && mcd(a + b, n) === 1) salida.push([a, b]);
      if (cuantos === 3) for (const c of rango(1, n - 1)) if (a + b + c < n && mcd(a + b + c, n) === 1) salida.push([a, b, c]);
    }
  }
  return salida;
}

function sumaSencilla(rng: Rng, d: Dificultad): { n: number; lista: number[]; suma: number } {
  const n = elegir(rng, porNivel(d, [5, 7, 8, 9], [10, 11, 12, 13], [11, 13, 14, 15]));
  const lista = elegir(rng, sumandos(n, d === 3 ? 3 : 2));
  return { n, lista, suma: lista.reduce((s, v) => s + v, 0) };
}

const sumarFracciones: Plantilla = (rng, d) => {
  const { n, lista, suma } = sumaSencilla(rng, d);
  const operacion = lista.map((a) => `${a}/${n}`).join(" + ");
  return {
    enunciado: `¿Cuánto es ${operacion}?`,
    enunciadoFacil: `Suma las fracciones: ${operacion}.`,
    respuesta: numero(`${suma}/${n}`),
    pista: "Si el denominador es igual, se suman los numeradores y el denominador no cambia.",
    explicacion: `${lista.join(" + ")} = ${suma}, y el denominador sigue siendo ${n}: ${suma}/${n}.`,
  };
};

const sumarConOpciones: Plantilla = (rng, d) => {
  const n = elegir(rng, porNivel(d, [5, 7, 9], [8, 11, 13], [7, 9, 11]));
  const pares = rango(1, n - 1).flatMap((a) => rango(1, n - 1).map((b) => [a, b] as const));
  const validos = pares.filter(([a, b]) => a !== b && mcd(a + b, n) === 1 && (d === 3 ? a + b > n : a + b < n));
  const [a, b] = elegir(rng, validos);
  const suma = a + b;
  const f: Fraccion = [suma, n];
  const distractores = noEquivalentes(f, [[suma, n + n], [a * b, n], [Math.abs(a - b), n], [suma + 1, n], [suma, n + 1]], 3);
  return {
    enunciado: `¿Cuál es el resultado de ${a}/${n} + ${b}/${n}?`,
    enunciadoFacil: `Suma ${a}/${n} y ${b}/${n}. ¿Qué resultado es?`,
    respuesta: opciones(`${suma}/${n}`, distractores),
    pista: "El denominador dice en cuántas partes se divide. Esas partes no cambian al sumar.",
    explicacion: `Se suman los numeradores: ${a} + ${b} = ${suma}. El denominador sigue siendo ${n}: ${suma}/${n}.`,
  };
};

interface Tarea {
  readonly frase: (n: string, a: string, b: string) => string;
  readonly facil: (n: string, a: string, b: string) => string;
  readonly pregunta: string;
  readonly falta: string;
}

const TAREAS: readonly Tarea[] = [
  { frase: (n, a, b) => `${n} pinta ${a} de una valla por la mañana y ${b} de la valla por la tarde.`, facil: (n, a, b) => `${n} pinta una valla. Por la mañana pinta ${a}. Por la tarde pinta ${b}.`, pregunta: "¿Qué fracción de la valla ha pintado en total?", falta: "¿Qué fracción de la valla queda sin pintar?" },
  { frase: (n, a, b) => `${n} riega ${a} de un huerto el lunes y ${b} del huerto el martes.`, facil: (n, a, b) => `${n} riega un huerto. El lunes riega ${a}. El martes riega ${b}.`, pregunta: "¿Qué fracción del huerto ha regado en total?", falta: "¿Qué fracción del huerto queda sin regar?" },
  { frase: (n, a, b) => `${n} lee ${a} de un libro el sábado y ${b} del libro el domingo.`, facil: (n, a, b) => `${n} lee un libro. El sábado lee ${a}. El domingo lee ${b}.`, pregunta: "¿Qué fracción del libro ha leído en total?", falta: "¿Qué fracción del libro queda sin leer?" },
  { frase: (n, a, b) => `${n} limpia ${a} de un patio antes del recreo y ${b} del patio después.`, facil: (n, a, b) => `${n} limpia un patio. Antes del recreo limpia ${a}. Después limpia ${b}.`, pregunta: "¿Qué fracción del patio ha limpiado en total?", falta: "¿Qué fracción del patio queda sin limpiar?" },
];

const problemaDeFracciones: Plantilla = (rng, d) => {
  const t = elegir(rng, TAREAS);
  const quien = nombre(rng);
  const n = elegir(rng, porNivel(d, [5, 7, 9], [8, 11, 13], [9, 11, 13]));
  const pares = rango(1, n - 1).flatMap((a) => rango(1, n - 1).map((b) => [a, b] as const));
  const [a, b] = elegir(rng, pares.filter(([x, y]) => x + y < n && mcd(x + y, n) === 1));
  const suma = a + b;
  const resto = n - suma;
  const pregunta = d === 3 ? t.falta : t.pregunta;
  return {
    enunciado: `${t.frase(quien, `${a}/${n}`, `${b}/${n}`)} ${pregunta}`,
    enunciadoFacil: `${t.facil(quien, `${a}/${n}`, `${b}/${n}`)} ${pregunta}`,
    respuesta: numero(d === 3 ? `${resto}/${n}` : `${suma}/${n}`),
    pista: d === 3 ? `Suma lo que ya está hecho. Después piensa cuánto falta para llegar a ${n}/${n}, que es todo.` : "Suma los numeradores. El denominador no cambia.",
    explicacion: d === 3 ? `Está hecho ${suma}/${n}. Todo son ${n}/${n}, así que falta ${n} − ${suma} = ${resto}: ${resto}/${n}.` : `${a} + ${b} = ${suma}. En total es ${suma}/${n}.`,
  };
};

const completarSuma: Plantilla = (rng, d) => {
  const { n, lista, suma } = sumaSencilla(rng, d);
  const [a, b, c] = lista as [number, number, number | undefined];
  const igualdad = c === undefined ? `${a}/${n} + ?/${n} = ${suma}/${n}` : `${a}/${n} + ?/${n} + ${c}/${n} = ${suma}/${n}`;
  return {
    enunciado: `Completa la suma: ${igualdad}. ¿Qué numerador falta?`,
    enunciadoFacil: `Mira la suma: ${igualdad}. ¿Qué número falta?`,
    respuesta: numero(b),
    pista: "Piensa solo en los numeradores: ¿qué número falta para llegar al resultado?",
    explicacion: c === undefined ? `${a} + ${b} = ${suma}, así que falta el ${b}.` : `${a} + ${b} + ${c} = ${suma}, así que falta el ${b}.`,
  };
};

const sumarYSimplificar: Plantilla = (rng, d) => {
  const n = elegir(rng, porNivel(d, [4, 6, 8], [9, 10, 12], [14, 15, 16, 18, 20]));
  const pares = rango(1, n - 1).flatMap((a) => rango(1, n - 1).map((b) => [a, b] as const));
  const [a, b] = elegir(rng, pares.filter(([x, y]) => x + y < n && mcd(x + y, n) > 1));
  const g = mcd(a + b, n);
  return {
    enunciado: `Calcula ${a}/${n} + ${b}/${n} y simplifica el resultado todo lo posible.`,
    enunciadoFacil: `Suma ${a}/${n} y ${b}/${n}. Después simplifica el resultado todo lo que puedas.`,
    respuesta: numero(`${(a + b) / g}/${n / g}`),
    pista: "Primero suma los numeradores. Después divide arriba y abajo entre el mismo número.",
    explicacion: `La suma es ${a + b}/${n}. Al dividir arriba y abajo entre ${g} queda ${(a + b) / g}/${n / g}.`,
  };
};

// ---------- NUM5-T2-c: fracción de una cantidad ----------
function fraccionYCantidad(rng: Rng, d: Dificultad): { a: number; b: number; q: number; total: number; parte: number } {
  const b = porNivel(d, entero(rng, 2, 5), entero(rng, 3, 6), entero(rng, 6, 10));
  const candidatos = rango(1, b - 1).filter((x) => mcd(x, b) === 1 && (d === 1 ? x === 1 : x > 1 || b === 2));
  const a = elegir(rng, candidatos.length > 0 ? candidatos : [1]);
  const q = porNivel(d, entero(rng, 2, 12), entero(rng, 3, 12), entero(rng, 5, 15));
  return { a, b, q, total: b * q, parte: a * q };
}

const fraccionDeUnNumero: Plantilla = (rng, d) => {
  const { a, b, q, total, parte } = fraccionYCantidad(rng, d);
  return {
    enunciado: `¿Cuánto es ${a}/${b} de ${total}?`,
    enunciadoFacil: `Calcula ${a}/${b} de ${total}.`,
    respuesta: numero(parte),
    pista: "Divide entre el denominador y multiplica por el numerador.",
    explicacion: `${total} ÷ ${b} = ${q}, y ${q} × ${a} = ${parte}.`,
  };
};

const fraccionDelDibujo: Plantilla = (rng, d) => {
  const objeto = contable(rng);
  const b = porNivel(d, entero(rng, 2, 4), entero(rng, 3, 5), entero(rng, 3, 6));
  const a = d === 1 ? 1 : elegir(rng, rango(1, b - 1).filter((x) => mcd(x, b) === 1 && (x > 1 || b === 2 || d === 3)));
  const q = entero(rng, 2, 4);
  const total = b * q;
  const parte = a * q;
  const cuantos = objeto.genero === "f" ? "Cuántas" : "Cuántos";
  const quedan = d === 3;
  const resultado = quedan ? total - parte : parte;
  return {
    enunciado: quedan ? `Si quitas ${a}/${b} de ${objeto.genero === "f" ? "las" : "los"} ${objeto.plural} del dibujo, ¿${cuantos.toLowerCase()} ${objeto.plural} quedan?` : `¿${cuantos} ${objeto.plural} son ${a}/${b} de ${objeto.genero === "f" ? "las" : "los"} ${objeto.plural} del dibujo?`,
    enunciadoFacil: quedan ? `Cuenta ${objeto.genero === "f" ? "las" : "los"} ${objeto.plural}. Quitas ${a}/${b}. ¿${cuantos} quedan?` : `Cuenta ${objeto.genero === "f" ? "las" : "los"} ${objeto.plural}. ¿${cuantos} son ${a}/${b}?`,
    imagen: { tipo: "objetos", grupos: [{ objeto: objeto.id, cantidad: total }] },
    respuesta: numero(resultado),
    pista: "Cuenta todos. Haz grupos iguales según el denominador.",
    explicacion: quedan ? `Hay ${total}. ${a}/${b} son ${parte}, así que quedan ${total} − ${parte} = ${resultado}.` : `Hay ${total}. ${total} ÷ ${b} = ${q}, y ${q} × ${a} = ${parte}.`,
  };
};

const CONJUNTOS = [
  { todo: "plantas en un huerto", plural: "plantas", parte: "tienen flores", cuantos: "Cuántas" },
  { todo: "alumnos en una clase", plural: "alumnos", parte: "van a la escuela a pie", cuantos: "Cuántos" },
  { todo: "gallinas en una granja", plural: "gallinas", parte: "son blancas", cuantos: "Cuántas" },
  { todo: "asientos en un autobús", plural: "asientos", parte: "están ocupados", cuantos: "Cuántos" },
] as const;

const fraccionDeUnGrupo: Plantilla = (rng, d) => {
  const c = elegir(rng, CONJUNTOS);
  const { a, b, q, total, parte } = fraccionYCantidad(rng, d);
  const verbo = c.parte;
  return {
    enunciado: `Hay ${total} ${c.todo}, y ${a}/${b} de ${c.cuantos === "Cuántas" ? "las" : "los"} ${c.plural} ${verbo}. ¿${c.cuantos} ${c.plural} ${verbo}?`,
    enunciadoFacil: `Hay ${total} ${c.plural}. De ${c.cuantos === "Cuántas" ? "ellas" : "ellos"}, ${a}/${b} ${verbo}. ¿${c.cuantos} son?`,
    respuesta: opcionesNumero(rng, parte, [q, total - parte, total - a, total - b, a * b, parte + q]),
    pista: "Divide el total entre el denominador. Después multiplica por el numerador.",
    explicacion: `${total} ÷ ${b} = ${q}, y ${q} × ${a} = ${parte}.`,
  };
};

const lasMonedasQueQuedan: Plantilla = (rng, d) => {
  const { a, b, q, total, parte } = fraccionYCantidad(rng, d);
  const n = nombre(rng);
  const resto = total - parte;
  return {
    enunciado: `${n} tiene ${dinero(total * 100)} y gasta ${a}/${b}. ¿Cuántas monedas le quedan?`,
    enunciadoFacil: `${n} tiene ${dinero(total * 100)}. Gasta ${a}/${b}. ¿Cuántas monedas le quedan?`,
    respuesta: opcionesNumero(rng, resto, [parte, q, total - a, total - b]),
    pista: "Primero calcula cuánto gasta. Después réstalo de lo que tenía.",
    explicacion: `${a}/${b} de ${total} son ${parte}. Le quedan ${total} − ${parte} = ${resto}.`,
  };
};

const cantidadEntera: Plantilla = (rng, d) => {
  const { a, b, total, parte } = d === 3
    ? (() => {
        const [x, y] = elegir(rng, [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5]] as const);
        const q = entero(rng, 2, 9);
        return { a: x, b: y, total: y * q, parte: x * q };
      })()
    : (() => {
        const y = d === 1 ? entero(rng, 2, 3) : entero(rng, 4, 6);
        const q = entero(rng, 3, 12);
        return { a: 1, b: y, total: y * q, parte: q };
      })();
  const c = elegir(rng, ["alumnos", "niños", "amigos"]);
  return {
    enunciado: `En una excursión, ${a}/${b} de los ${c} llevan gorro. Esos ${a}/${b} son ${parte} ${c}. ¿Cuántos ${c} hay en total?`,
    enunciadoFacil: `Llevan gorro ${a}/${b} de los ${c}. Esos ${a}/${b} son ${parte} ${c}. ¿Cuántos ${c} hay en total?`,
    respuesta: numero(total),
    pista: a === 1 ? `Si ${parte} es una de ${b} partes iguales, piensa cuánto son las ${b} partes.` : `Primero calcula cuánto es 1/${b}. Después multiplica por ${b}.`,
    explicacion: a === 1 ? `${parte} es 1 de ${b} partes iguales: ${parte} × ${b} = ${total}.` : `Si ${a}/${b} son ${parte}, entonces 1/${b} es ${parte / a}, y ${parte / a} × ${b} = ${total}.`,
  };
};

// ---------- NUM5-T3-a: 50 %, 25 % y 10 % ----------
type Dato = readonly [number, number]; // porcentaje y cantidad
const con = (p: number, bases: readonly number[]): Dato[] => bases.map((b) => [p, b]);

const porcentajeDeNumero: Plantilla = (rng, d) => {
  const [p, base] = elegir(rng, porNivel<readonly Dato[]>(d,
    [...con(50, rango(20, 100, 2)), ...con(10, rango(20, 100, 10))],
    [...con(25, rango(12, 100, 4)), ...con(10, rango(120, 300, 10))],
    [...con(25, rango(120, 400, 4)), ...con(50, rango(15, 95, 10)), ...con(10, rango(15, 95, 10))],
  ));
  const resultado = conComa(base * p);
  const metodo = p === 50 ? `la mitad de ${base}` : p === 25 ? `la cuarta parte de ${base}` : `la décima parte de ${base}`;
  return {
    enunciado: `¿Cuánto es el ${p} % de ${base}?`,
    enunciadoFacil: `Calcula el ${p} % de ${base}.`,
    respuesta: numero(resultado),
    pista: "El 50 % es la mitad, el 25 % es la cuarta parte y el 10 % es la décima parte.",
    explicacion: `El ${p} % de ${base} es ${metodo}: ${resultado}.`,
  };
};

const IGUALDADES: Readonly<Record<Dificultad, readonly { readonly p: number; readonly f: string; readonly otras: readonly string[] }[]>> = {
  1: [{ p: 50, f: "1/2", otras: ["1/50", "1/5", "1/4"] }, { p: 50, f: "2/4", otras: ["1/50", "1/5", "1/4"] }],
  2: [{ p: 25, f: "1/4", otras: ["1/25", "1/2", "1/5"] }, { p: 25, f: "2/8", otras: ["1/25", "1/2", "1/5"] }],
  3: [{ p: 10, f: "1/10", otras: ["1/100", "1/2", "1/5"] }, { p: 10, f: "10/100", otras: ["1/100", "1/2", "1/5"] }],
};

const porcentajeYFraccion: Plantilla = (rng, d) => {
  const { p, f, otras } = elegir(rng, IGUALDADES[d]);
  const aFraccion = rng() < 0.5;
  const [num, den] = f.split("/").map(Number) as [number, number];
  const porcentajes = [50, 25, 10, 5].filter((x) => x !== p).map((x) => `${x} %`);
  return {
    enunciado: aFraccion ? `¿Qué fracción es igual al ${p} %?` : `¿Qué porcentaje es igual a la fracción ${f}?`,
    enunciadoFacil: aFraccion ? `Mira el ${p} %. ¿Qué fracción vale lo mismo?` : `Mira la fracción ${f}. ¿Qué porcentaje vale lo mismo?`,
    respuesta: aFraccion ? opciones(f, otras) : opciones(`${p} %`, porcentajes),
    pista: "El porcentaje dice cuántas partes de cada 100 tomamos.",
    explicacion: `${num}/${den} es lo mismo que ${p}/100, es decir, el ${p} %.`,
  };
};

const porcentajeDelDibujo: Plantilla = (rng, d) => {
  const [partes, coloreadas] = elegir(rng, porNivel<readonly Dato[]>(d, [[2, 1], [4, 2], [10, 5], [6, 3]], [[4, 1], [8, 2], [12, 3]], [[10, 1], [20, 2]]));
  const p = (coloreadas * 100) / partes;
  const otras = [coloreadas, 50, 25, 10, 20].filter((x) => x !== p);
  return {
    enunciado: "El dibujo está dividido en partes iguales. ¿Qué porcentaje está coloreado?",
    enunciadoFacil: "El dibujo tiene partes iguales. ¿Qué porcentaje tiene color?",
    imagen: { tipo: "fraccion", forma: "barra", partes, coloreadas },
    respuesta: opciones(`${p} %`, [...new Set(otras)].slice(0, 3).map((x) => `${x} %`)),
    pista: "Piensa qué fracción del dibujo tiene color. La mitad es el 50 %.",
    explicacion: `Hay ${coloreadas === 1 ? "1 parte coloreada" : `${coloreadas} partes coloreadas`} de ${partes}, que es lo mismo que ${p} de cada 100: el ${p} %.`,
  };
};

const GRUPOS = [
  { todo: "alumnos en una escuela", plural: "alumnos", dato: "va en autobús", si: "van en autobús", no: "no van en autobús", cuantos: "Cuántos" },
  { todo: "plantas en un huerto", plural: "plantas", dato: "tiene flores", si: "tienen flores", no: "no tienen flores", cuantos: "Cuántas" },
  { todo: "gallinas en una granja", plural: "gallinas", dato: "son negras", si: "son negras", no: "no son negras", cuantos: "Cuántas" },
  { todo: "libros en una biblioteca", plural: "libros", dato: "son de cuentos", si: "son de cuentos", no: "no son de cuentos", cuantos: "Cuántos" },
] as const;

const problemaDePorcentaje: Plantilla = (rng, d) => {
  const g = elegir(rng, GRUPOS);
  const [p, base] = elegir(rng, porNivel<readonly Dato[]>(d,
    con(50, rango(20, 100, 10)),
    [...con(25, rango(20, 100, 4)), ...con(10, rango(30, 200, 10))],
    [...con(25, rango(40, 200, 4)), ...con(10, rango(30, 200, 10))],
  ));
  const parte = (base * p) / 100;
  const contrario = d === 3;
  const resultado = contrario ? base - parte : parte;
  const frase = `Hay ${base} ${g.todo}. El ${p} % ${g.dato}.`;
  const pregunta = `¿${g.cuantos} ${g.plural} ${contrario ? g.no : g.si}?`;
  return {
    enunciado: `${frase} ${pregunta}`,
    enunciadoFacil: `${frase} ${pregunta}`,
    respuesta: numero(resultado),
    pista: contrario ? "Calcula primero cuántos cumplen la frase. Después réstalos del total." : "Piensa si el porcentaje es la mitad, la cuarta parte o la décima parte.",
    explicacion: contrario ? `El ${p} % de ${base} es ${parte}. Los demás son ${base} − ${parte} = ${resultado}.` : `El ${p} % de ${base} es ${parte}.`,
  };
};

const comoSeCalcula: Plantilla = (rng, d) => {
  const p = porNivel(d, 50, 10, 25);
  const divisor = 100 / p;
  const base = entero(rng, 7, 20) * 20;
  return {
    enunciado: `Para calcular el ${p} % de ${base}, ¿qué operación puedes hacer?`,
    enunciadoFacil: `Quieres el ${p} % de ${base}. ¿Qué operación haces?`,
    respuesta: opciones(`Dividir ${base} entre ${divisor}`, [`Dividir ${base} entre ${p === 10 ? 100 : p}`, `Restar ${p} a ${base}`, `Multiplicar ${base} por ${divisor}`]),
    pista: "Piensa en qué fracción es ese porcentaje.",
    explicacion: `El ${p} % es 1/${divisor}, por eso se divide entre ${divisor}: ${base} ÷ ${divisor} = ${base / divisor}.`,
  };
};

// ---------- NUM5-T3-b: descuentos ----------
function precioYDescuento(rng: Rng, d: Dificultad): { p: number; base: number } {
  const [p, base] = elegir(rng, porNivel<readonly Dato[]>(d,
    [...con(50, rango(10, 80, 2)), ...con(10, rango(20, 100, 10))],
    [...con(25, rango(16, 100, 4)), ...con(10, rango(110, 200, 10))],
    [...con(25, rango(14, 98, 4)), ...con(10, rango(15, 95, 10)), ...con(50, rango(15, 95, 10))],
  ));
  return { p, base };
}

const cuantoDescuentan: Plantilla = (rng, d) => {
  const { p, base } = precioYDescuento(rng, d);
  const x = articuloCaro(rng);
  const rebaja = base * p; // en centésimas
  return {
    enunciado: `${mayus(x.un)} cuesta ${dinero(base * 100)} y tiene un descuento del ${p} %. ¿Cuántas monedas te descuentan?`,
    enunciadoFacil: `${mayus(x.un)} cuesta ${dinero(base * 100)}. Tiene un descuento del ${p} %. ¿Cuántas monedas te descuentan?`,
    respuesta: numero(conComa(rebaja)),
    pista: "Calcula el porcentaje del precio. Todavía no hay que restar.",
    explicacion: `El ${p} % de ${base} es ${conComa(rebaja)}. Te descuentan ${dinero(rebaja)}.`,
  };
};

const precioConDescuento: Plantilla = (rng, d) => {
  const { p, base } = precioYDescuento(rng, d);
  const x = articuloCaro(rng);
  const rebaja = base * p;
  const final = base * 100 - rebaja;
  return {
    enunciado: `${mayus(x.un)} cuesta ${dinero(base * 100)} y tiene un descuento del ${p} %. ¿Cuánto pagas?`,
    enunciadoFacil: `${mayus(x.un)} cuesta ${dinero(base * 100)}. Tiene un descuento del ${p} %. ¿Cuánto pagas?`,
    respuesta: opcionesDinero(rng, final, [rebaja, base * 100 - p * 100, base * 100, final + rebaja / 2], 100),
    pista: "Calcula cuánto te descuentan. Después réstalo del precio.",
    explicacion: `El ${p} % de ${base} es ${conComa(rebaja)}. Pagas ${cifras(base * 100)} − ${cifras(rebaja)} = ${cifras(final)}.`,
  };
};

const etiquetaDeOferta: Plantilla = (rng, d) => {
  const { p, base } = precioYDescuento(rng, d);
  const x = articuloCaro(rng);
  const final = base * 100 - base * p;
  return {
    enunciado: `Mira la etiqueta. ¿Cuántas monedas cuesta ${x.el} con el descuento?`,
    enunciadoFacil: `Mira la etiqueta. ¿Cuántas monedas cuesta ahora?`,
    imagen: { tipo: "cartel", estilo: "etiqueta", titulo: "Oferta", lineas: [mayus(x.nombre), `Precio: ${dinero(base * 100)}`, `Descuento: ${p} %`] },
    respuesta: numero(conComa(final)),
    pista: "Calcula el descuento y réstalo del precio.",
    explicacion: `El ${p} % de ${base} es ${conComa(base * p)}, y ${cifras(base * 100)} − ${cifras(base * p)} = ${cifras(final)}.`,
  };
};

const queDescuentoEs: Plantilla = (rng, d) => {
  const p = porNivel(d, 50, 10, 25);
  const base = d === 2 ? entero(rng, 5, 25) * 20 : entero(rng, 5, 30) * 4;
  const rebaja = (base * p) / 100;
  const final = base - rebaja;
  const x = articuloCaro(rng);
  const otras = [...new Set([50, 25, 10, rebaja, 20].filter((v) => v !== p && v < 100))].slice(0, 3);
  return {
    enunciado: `${mayus(x.un)} costaba ${dinero(base * 100)} y ahora cuesta ${dinero(final * 100)}. ¿Qué descuento le han hecho?`,
    enunciadoFacil: `${mayus(x.un)} costaba ${dinero(base * 100)}. Ahora cuesta ${dinero(final * 100)}. ¿Qué descuento le han hecho?`,
    respuesta: opciones(`${p} %`, otras.map((v) => `${v} %`)),
    pista: "Calcula cuántas monedas ha bajado. Piensa si es la mitad, la cuarta parte o la décima parte del precio.",
    explicacion: `Ha bajado ${base} − ${final} = ${rebaja}. Eso es el ${p} % de ${base}.`,
  };
};

// ---------- NUM5-T3-c: problemas de compras ----------
const totalConDescuento: Plantilla = (rng, d) => {
  const x = articuloBarato(rng);
  const p = porNivel(d, 50, 10, 25);
  const n = porNivel(d, entero(rng, 2, 6), entero(rng, 2, 5), elegir(rng, [4, 8]));
  const unidad = porNivel(d, entero(rng, 2, 9) * 2, entero(rng, 1, 6) * 5 * 2, entero(rng, 3, 15));
  const total = n * unidad;
  const final = (total * (100 - p)) / 100;
  return {
    enunciado: `Cada ${x.nombre} cuesta ${dinero(unidad * 100)}. Compras ${n} y te hacen un descuento del ${p} % sobre el total. ¿Cuántas monedas pagas?`,
    enunciadoFacil: `Cada ${x.nombre} cuesta ${dinero(unidad * 100)}. Compras ${n}. Te descuentan el ${p} % del total. ¿Cuántas monedas pagas?`,
    respuesta: numero(final),
    pista: "Primero multiplica para saber el total. Después calcula el descuento y réstalo.",
    explicacion: `${n} × ${unidad} = ${total}. El ${p} % de ${total} es ${total - final}. Pagas ${total} − ${total - final} = ${final}.`,
  };
};

const cuantoLeSobra: Plantilla = (rng, d) => {
  const p = porNivel(d, 50, 10, 25);
  const base = d === 2 ? entero(rng, 4, 15) * 10 : entero(rng, 5, 25) * 4;
  const x = articuloCaro(rng);
  const n = nombre(rng);
  const final = (base * (100 - p)) / 100;
  const tiene = Math.ceil(final / 10) * 10 + entero(rng, 1, 4) * 10;
  return {
    enunciado: `${n} tiene ${dinero(tiene * 100)}. ${mayus(x.un)} cuesta ${dinero(base * 100)} y tiene un descuento del ${p} %. ¿Cuántas monedas le sobran después de ${x.genero === "f" ? "comprarla" : "comprarlo"}?`,
    enunciadoFacil: `${n} tiene ${dinero(tiene * 100)}. ${mayus(x.un)} cuesta ${dinero(base * 100)}. Tiene un descuento del ${p} %. ¿Cuántas monedas le sobran?`,
    respuesta: numero(tiene - final),
    pista: "Calcula primero el precio con descuento. Después resta ese precio a lo que tiene.",
    explicacion: `Con el descuento cuesta ${final}. Le sobran ${tiene} − ${final} = ${tiene - final}.`,
  };
};

const unoConDescuento: Plantilla = (rng, d) => {
  const [x, y] = par(rng, CAROS);
  const p = porNivel(d, 50, 10, 25);
  const base = d === 2 ? entero(rng, 3, 12) * 10 : entero(rng, 3, 15) * 4;
  const otro = entero(rng, 3, 15);
  const final = (base * (100 - p)) / 100;
  return {
    enunciado: `${mayus(x.un)} cuesta ${dinero(base * 100)}, pero tiene un descuento del ${p} %. ${mayus(y.un)} cuesta ${dinero(otro * 100)} y no tiene descuento. ¿Cuántas monedas pagas por las dos cosas?`,
    enunciadoFacil: `${mayus(x.un)} cuesta ${dinero(base * 100)}. Tiene un descuento del ${p} %. ${mayus(y.un)} cuesta ${dinero(otro * 100)}. No tiene descuento. ¿Cuántas monedas pagas en total?`,
    respuesta: opcionesNumero(rng, final + otro, [base + otro, final, final + otro - p, base - p + otro, ((base + otro) * (100 - p)) / 100]),
    pista: "El descuento solo se aplica a una de las dos cosas.",
    explicacion: `${mayus(x.el)} se queda en ${final}. En total: ${final} + ${otro} = ${final + otro}.`,
  };
};

const TIENDAS = ["En la tienda A", "En la tienda B", "Cuesta lo mismo en las dos"] as const;

const dosTiendas: Plantilla = (rng, d) => {
  const x = articuloCaro(rng);
  const p = porNivel(d, 50, 10, 25);
  const base = d === 2 ? entero(rng, 4, 15) * 10 : entero(rng, 5, 25) * 4;
  const final = (base * (100 - p)) / 100;
  const dif = porNivel(d, elegir(rng, [-6, -4, 4, 6]), elegir(rng, [-3, -2, 2, 3]), elegir(rng, [-1, 0, 1]));
  const otra = final + dif;
  const correcta = final < otra ? TIENDAS[0] : final > otra ? TIENDAS[1] : TIENDAS[2];
  return {
    enunciado: `En la tienda A, ${x.un} cuesta ${dinero(base * 100)}, pero tiene un descuento del ${p} %. En la tienda B cuesta ${dinero(otra * 100)} y no tiene descuento. ¿Dónde cuesta menos?`,
    enunciadoFacil: `Tienda A: ${x.un} cuesta ${dinero(base * 100)}. Tiene un descuento del ${p} %. Tienda B: cuesta ${dinero(otra * 100)}. No tiene descuento. ¿Dónde cuesta menos?`,
    respuesta: opciones(correcta, TIENDAS.filter((t) => t !== correcta)),
    pista: "Calcula el precio final en la tienda A y compáralo con el de la tienda B.",
    explicacion: `En la tienda A cuesta ${dinero(final * 100)} con el descuento, y en la tienda B cuesta ${dinero(otra * 100)}.`,
  };
};

const cambioConDescuento: Plantilla = (rng, d) => {
  const x = articuloCaro(rng);
  const n = nombre(rng);
  const p = porNivel(d, 50, 10, 25);
  const base = d === 2 ? entero(rng, 4, 15) * 10 : entero(rng, 5, 20) * 4;
  const final = (base * (100 - p)) / 100;
  const pago = Math.ceil((final + 1) / 50) * 50;
  const cambio = pago - final;
  return {
    enunciado: `${mayus(x.un)} cuesta ${dinero(base * 100)} y tiene un descuento del ${p} %. ${n} ${x.genero === "f" ? "la" : "lo"} compra y paga con ${dinero(pago * 100)}. ¿Cuánto le devuelven?`,
    enunciadoFacil: `${mayus(x.un)} cuesta ${dinero(base * 100)}. Tiene un descuento del ${p} %. ${n} paga con ${dinero(pago * 100)}. ¿Cuánto le devuelven?`,
    respuesta: opcionesNumero(rng, cambio, [pago - base + final, base - final, pago - p, Math.abs(pago - base), final], (v) => dinero(v * 100), 5),
    pista: "Primero calcula el precio con descuento. Después réstalo de lo que paga.",
    explicacion: `Con el descuento cuesta ${final}. Le devuelven ${pago} − ${final} = ${cambio}.`,
  };
};

export const QUINTO_A: MapaGeneradores = {
  "NUM5-T1-a": generadores("NUM5-T1-a", [cifraDelLugar, valorDeLaCifra, fraccionADecimal, formarNumero, barraDeDecimas]),
  "NUM5-T1-b": generadores("NUM5-T1-b", [elMayorOMenor("mayor"), elMayorOMenor("menor"), ordenarDecimales, elegirSigno, compararEnSituacion]),
  "NUM5-T1-c": generadores("NUM5-T1-c", [sumarPrecios, calcularCambio, cuantoFalta, cuantoMasCaro, leerRecibo]),
  "NUM5-T2-a": generadores("NUM5-T2-a", [elegirEquivalente, noEsEquivalente, completarEquivalente, simplificar, equivalenteDelDibujo]),
  "NUM5-T2-b": generadores("NUM5-T2-b", [sumarFracciones, sumarConOpciones, problemaDeFracciones, completarSuma, sumarYSimplificar]),
  "NUM5-T2-c": generadores("NUM5-T2-c", [fraccionDeUnNumero, fraccionDelDibujo, fraccionDeUnGrupo, lasMonedasQueQuedan, cantidadEntera]),
  "NUM5-T3-a": generadores("NUM5-T3-a", [porcentajeDeNumero, porcentajeYFraccion, porcentajeDelDibujo, problemaDePorcentaje, comoSeCalcula]),
  "NUM5-T3-b": generadores("NUM5-T3-b", [cuantoDescuentan, precioConDescuento, etiquetaDeOferta, queDescuentoEs]),
  "NUM5-T3-c": generadores("NUM5-T3-c", [totalConDescuento, cuantoLeSobra, unoConDescuento, dosTiendas, cambioConDescuento]),
};

