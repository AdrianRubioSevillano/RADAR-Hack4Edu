// 5.º: geometría y medidas, y problemas de varios pasos.
import type { Rng } from "../../../core/rng.ts";
import { elegir, entero, nombre, nombres } from "../../ayuda.ts";
import type { Dificultad, MapaGeneradores } from "../../tipos.ts";
import {
  BARATOS, CAPACIDAD_L_ML, LONGITUD_KM_M, LONGITUD_M_CM, MASA_KG_G, articuloBarato, articuloCaro, conComa, dinero, dosCifras, enGrande, generadores,
  mayus, numero, opciones, opcionesNumero, par, porNivel, rango, trio, type Escala, type Plantilla,
} from "./comun.ts";

// Lados en centésimas de unidad. En la dificultad 3 uno de los lados lleva medio.
function lados(rng: Rng, d: Dificultad): [number, number] {
  if (d === 1) {
    const [a, b] = par(rng, rango(2, 9));
    return [a * 100, b * 100];
  }
  if (d === 2) return [entero(rng, 11, 25) * 100, entero(rng, 3, 9) * 100];
  return [entero(rng, 2, 9) * 100 + 50, entero(rng, 2, 6) * 200];
}

// ---------- NUM5-T4-a: perímetro ----------
const perimetroDelDibujo: Plantilla = (rng, d) => {
  const [a, b] = lados(rng, d);
  const unidad = d === 2 ? "m" : "cm";
  const palabra = d === 2 ? "metros" : "centímetros";
  const perimetro = 2 * (a + b);
  const texto = (v: number) => `${conComa(v)} ${unidad}`;
  return {
    enunciado: `Mira el rectángulo. ¿Cuál es su perímetro, en ${palabra}?`,
    enunciadoFacil: `Mira el rectángulo. Suma sus cuatro lados. ¿Cuántos ${palabra} son?`,
    imagen: { tipo: "rectangulo", ancho: a / 100, alto: b / 100, unidad },
    respuesta: opcionesNumero(rng, perimetro, [a + b, (a * b) / 100, 4 * a, 4 * b], texto, 100),
    pista: "El perímetro es lo que mide todo el borde: hay que sumar los cuatro lados.",
    explicacion: `${conComa(a)} + ${conComa(b)} + ${conComa(a)} + ${conComa(b)} = ${conComa(perimetro)}.`,
  };
};

const perimetroDelCuadrado: Plantilla = (rng, d) => {
  const lado = d === 1 ? entero(rng, 3, 12) : d === 2 ? entero(rng, 13, 40) : entero(rng, 6, 30);
  if (d === 3) {
    return {
      enunciado: `El perímetro de un cuadrado es ${lado * 4} cm. ¿Cuántos centímetros mide cada lado?`,
      enunciadoFacil: `Un cuadrado tiene ${lado * 4} cm de perímetro. ¿Cuántos centímetros mide un lado?`,
      respuesta: numero(lado),
      pista: "Un cuadrado tiene cuatro lados iguales.",
      explicacion: `Los cuatro lados son iguales: ${lado * 4} ÷ 4 = ${lado}.`,
    };
  }
  return {
    enunciado: `Cada lado de un cuadrado mide ${lado} cm. ¿Cuántos centímetros mide su perímetro?`,
    enunciadoFacil: `Un cuadrado tiene lados de ${lado} cm. ¿Cuántos centímetros mide su perímetro?`,
    respuesta: numero(lado * 4),
    pista: "Un cuadrado tiene cuatro lados iguales.",
    explicacion: `Son cuatro lados iguales: ${lado} × 4 = ${lado * 4}.`,
  };
};

const perimetroDePoligono: Plantilla = (rng, d) => {
  if (d === 1) {
    const a = entero(rng, 4, 9);
    const b = a + entero(rng, 1, 3);
    const c = b + entero(rng, 1, a - 1);
    return {
      enunciado: `Un triángulo tiene lados de ${a} cm, ${b} cm y ${c} cm. ¿Cuántos centímetros mide su perímetro?`,
      enunciadoFacil: `Los lados de un triángulo miden ${a} cm, ${b} cm y ${c} cm. ¿Cuántos centímetros mide su perímetro?`,
      respuesta: numero(a + b + c),
      pista: "Suma lo que mide cada lado.",
      explicacion: `${a} + ${b} + ${c} = ${a + b + c}.`,
    };
  }
  const [figura, n] = elegir(rng, [["pentágono", 5], ["hexágono", 6]] as const);
  const lado = d === 2 ? entero(rng, 4, 15) * 100 : entero(rng, 2, 9) * 100 + 50;
  return {
    enunciado: `Todos los lados de un ${figura} miden ${conComa(lado)} cm. Un ${figura} tiene ${n} lados. ¿Cuántos centímetros mide su perímetro?`,
    enunciadoFacil: `Un ${figura} tiene ${n} lados. Cada lado mide ${conComa(lado)} cm. ¿Cuántos centímetros mide su perímetro?`,
    respuesta: numero(conComa(lado * n)),
    pista: "Si todos los lados son iguales, puedes multiplicar.",
    explicacion: `Son ${n} lados iguales: ${conComa(lado)} × ${n} = ${conComa(lado * n)}.`,
  };
};

const vallaDelHuerto: Plantilla = (rng, d) => {
  const [largo, ancho] = d === 1 ? [entero(rng, 6, 12), entero(rng, 2, 5)] : [entero(rng, 13, 40), entero(rng, 6, 12)];
  const puerta = d === 3 ? entero(rng, 1, 3) : 0;
  const perimetro = 2 * (largo + ancho);
  const lugar = elegir(rng, ["huerto", "patio", "corral"]);
  if (d === 3) {
    return {
      enunciado: `Un ${lugar} rectangular mide ${largo} m de largo y ${ancho} m de ancho. Se pone una valla alrededor, pero se dejan ${puerta} m sin valla para la entrada. ¿Cuántos metros de valla hacen falta?`,
      enunciadoFacil: `Un ${lugar} rectangular mide ${largo} m de largo y ${ancho} m de ancho. Se pone una valla alrededor. La entrada mide ${puerta} m y no lleva valla. ¿Cuántos metros de valla hacen falta?`,
      respuesta: numero(perimetro - puerta),
      pista: "Calcula el perímetro. Después quita lo que mide la entrada.",
      explicacion: `El perímetro es ${perimetro} m. Sin la entrada: ${perimetro} − ${puerta} = ${perimetro - puerta}.`,
    };
  }
  return {
    enunciado: `Un ${lugar} rectangular mide ${largo} m de largo y ${ancho} m de ancho. ¿Cuántos metros de valla hacen falta para rodearlo entero?`,
    enunciadoFacil: `Un ${lugar} rectangular mide ${largo} m de largo y ${ancho} m de ancho. La valla da toda la vuelta. ¿Cuántos metros de valla hacen falta?`,
    respuesta: numero(perimetro),
    pista: "La valla va por los cuatro lados.",
    explicacion: `${largo} + ${ancho} + ${largo} + ${ancho} = ${perimetro}.`,
  };
};

const ladoQueFalta: Plantilla = (rng, d) => {
  const corto = d === 3 ? entero(rng, 2, 9) * 100 + 50 : entero(rng, d === 1 ? 2 : 6, d === 1 ? 6 : 15) * 100;
  const largo = corto + (d === 3 ? entero(rng, 1, 9) * 100 + 50 : entero(rng, 1, 8) * 100);
  const perimetro = 2 * (corto + largo);
  return {
    enunciado: `El perímetro de un rectángulo es ${conComa(perimetro)} cm y su lado corto mide ${conComa(corto)} cm. ¿Cuántos centímetros mide su lado largo?`,
    enunciadoFacil: `Un rectángulo tiene ${conComa(perimetro)} cm de perímetro. Su lado corto mide ${conComa(corto)} cm. ¿Cuántos centímetros mide el lado largo?`,
    respuesta: numero(conComa(largo)),
    pista: "Quita al perímetro los dos lados cortos. Lo que queda son los dos lados largos.",
    explicacion: `${conComa(perimetro)} − ${conComa(corto)} − ${conComa(corto)} = ${conComa(2 * largo)}, y la mitad es ${conComa(largo)}.`,
  };
};

// ---------- NUM5-T4-b: área del rectángulo ----------
const areaDelDibujo: Plantilla = (rng, d) => {
  const [a, b] = lados(rng, d);
  const area = (a * b) / 100;
  const unidad = d === 2 ? "m" : "cm";
  const palabra = d === 2 ? "metros cuadrados" : "centímetros cuadrados";
  const texto = (v: number) => `${conComa(v)} ${unidad}²`;
  return {
    enunciado: `Mira el rectángulo. ¿Cuál es su área, en ${palabra}?`,
    enunciadoFacil: `Mira el rectángulo. Multiplica sus dos lados. ¿Cuántos ${palabra} son?`,
    imagen: { tipo: "rectangulo", ancho: a / 100, alto: b / 100, unidad },
    respuesta: opcionesNumero(rng, area, [2 * (a + b), a + b, area + a, area + b], texto, 100),
    pista: "El área se calcula multiplicando el largo por el ancho.",
    explicacion: `${conComa(a)} × ${conComa(b)} = ${conComa(area)}.`,
  };
};

const areaDelCuadrado: Plantilla = (rng, d) => {
  const lado = d === 1 ? entero(rng, 2, 9) : d === 2 ? entero(rng, 11, 15) : entero(rng, 4, 12);
  if (d === 3) {
    return {
      enunciado: `El área de un cuadrado es ${lado * lado} m². ¿Cuántos metros mide cada lado?`,
      enunciadoFacil: `Un cuadrado tiene ${lado * lado} m² de área. ¿Cuántos metros mide un lado?`,
      respuesta: numero(lado),
      pista: "Busca un número que, multiplicado por sí mismo, dé el área.",
      explicacion: `${lado} × ${lado} = ${lado * lado}, así que cada lado mide ${lado} m.`,
    };
  }
  return {
    enunciado: `Cada lado de un cuadrado mide ${lado} m. ¿Cuántos metros cuadrados tiene de área?`,
    enunciadoFacil: `Un cuadrado tiene lados de ${lado} m. ¿Cuántos metros cuadrados tiene?`,
    respuesta: numero(lado * lado),
    pista: "En un cuadrado, el largo y el ancho miden lo mismo.",
    explicacion: `${lado} × ${lado} = ${lado * lado}.`,
  };
};

const areaDelHuerto: Plantilla = (rng, d) => {
  const largo = entero(rng, 6, 20);
  const ancho = entero(rng, 3, 5);
  const area = largo * ancho;
  const inicio = `Un huerto rectangular mide ${largo} m de largo y ${ancho} m de ancho.`;
  if (d === 1) {
    return {
      enunciado: `${inicio} ¿Cuántos metros cuadrados tiene?`,
      enunciadoFacil: `${inicio} ¿Cuántos metros cuadrados tiene?`,
      respuesta: numero(area),
      pista: "Multiplica el largo por el ancho.",
      explicacion: `${largo} × ${ancho} = ${area}.`,
    };
  }
  if (d === 2) {
    return {
      enunciado: `El suelo de un patio rectangular mide ${largo} m de largo y ${ancho} m de ancho. Cada baldosa es un cuadrado de 1 m de lado. ¿Cuántas baldosas hacen falta para cubrir todo el suelo?`,
      enunciadoFacil: `Un patio rectangular mide ${largo} m de largo y ${ancho} m de ancho. Cada baldosa cubre 1 m². ¿Cuántas baldosas hacen falta?`,
      respuesta: numero(area),
      pista: "Cada baldosa cubre un metro cuadrado. Calcula el área del patio.",
      explicacion: `El patio tiene ${largo} × ${ancho} = ${area} m², y cada baldosa cubre 1 m².`,
    };
  }
  const plantas = entero(rng, 2, 6);
  return {
    enunciado: `${inicio} En cada metro cuadrado se siembran ${plantas} plantas. ¿Cuántas plantas se siembran en todo el huerto?`,
    enunciadoFacil: `${inicio} En cada metro cuadrado hay ${plantas} plantas. ¿Cuántas plantas hay en total?`,
    respuesta: numero(area * plantas),
    pista: "Primero calcula el área. Después multiplica por las plantas de cada metro cuadrado.",
    explicacion: `El área es ${largo} × ${ancho} = ${area} m², y ${area} × ${plantas} = ${area * plantas}.`,
  };
};

const anchoDesdeArea: Plantilla = (rng, d) => {
  const ancho = d === 1 ? entero(rng, 2, 5) : entero(rng, 3, 9);
  const largo = d === 1 ? ancho + entero(rng, 1, 5) : d === 2 ? entero(rng, 10, 15) : entero(rng, 16, 30);
  const area = ancho * largo;
  return {
    enunciado: `El área de un rectángulo es ${area} cm² y su ancho mide ${ancho} cm. ¿Cuántos centímetros mide de largo?`,
    enunciadoFacil: `Un rectángulo tiene ${area} cm² de área. Su ancho mide ${ancho} cm. ¿Cuántos centímetros mide de largo?`,
    respuesta: opcionesNumero(rng, largo, [area - ancho, area + ancho, area / 2 - ancho, largo + ancho]),
    pista: "El área sale de multiplicar largo por ancho. Piensa en la operación contraria.",
    explicacion: `${area} ÷ ${ancho} = ${largo}, porque ${ancho} × ${largo} = ${area}.`,
  };
};

// ---------- NUM5-T4-c: cambio de unidades ----------
const convertirUnidades: Plantilla = (rng, d) => {
  const e = elegir(rng, [LONGITUD_M_CM, LONGITUD_KM_M, MASA_KG_G, CAPACIDAD_L_ML]);
  const k = entero(rng, 2, 9);
  if (d === 1) {
    return {
      enunciado: `¿Cuántos ${e.pequena} son ${k} ${e.grande}?`,
      enunciadoFacil: `Tienes ${k} ${e.grande}. ¿Cuántos ${e.pequena} son?`,
      respuesta: numero(k * e.factor),
      pista: `En 1 ${e.g} hay ${e.factor} ${e.p}.`,
      explicacion: `${k} × ${e.factor} = ${k * e.factor}.`,
    };
  }
  if (d === 2) {
    const cantidad = k * e.factor + e.factor / 2;
    return {
      enunciado: `¿Cuántos ${e.pequena} son ${enGrande(cantidad, e)} ${e.grande}?`,
      enunciadoFacil: `Tienes ${enGrande(cantidad, e)} ${e.grande}. ¿Cuántos ${e.pequena} son?`,
      respuesta: numero(cantidad),
      pista: `En 1 ${e.g} hay ${e.factor} ${e.p}. Medio ${e.g} es la mitad.`,
      explicacion: `${k} ${e.g} son ${k * e.factor} ${e.p} y medio ${e.g} son ${e.factor / 2} ${e.p}: en total, ${cantidad}.`,
    };
  }
  const resto = e.factor === 100 ? elegir(rng, [5, 15, 25, 35, 45, 75, 80]) : elegir(rng, [250, 500, 750, 150, 800]);
  const cantidad = k * e.factor + resto;
  return {
    enunciado: `¿Cuántos ${e.grande} son ${cantidad} ${e.pequena}?`,
    enunciadoFacil: `Tienes ${cantidad} ${e.pequena}. ¿Cuántos ${e.grande} son?`,
    respuesta: numero(enGrande(cantidad, e)),
    pista: `Divide entre ${e.factor}: la coma se mueve hacia la izquierda.`,
    explicacion: `${cantidad} ÷ ${e.factor} = ${enGrande(cantidad, e)}.`,
  };
};

interface Medible {
  readonly e: Escala;
  readonly frase: (a: string, b: string) => string;
  readonly facil: (a: string, b: string) => string;
  readonly opcion: (v: string) => string;
  readonly igual: string;
}

const MEDIBLES: readonly Medible[] = [
  { e: LONGITUD_M_CM, frase: (a, b) => `Una cuerda mide ${a} y otra mide ${b}. ¿Cuál es más larga?`, facil: (a, b) => `Una cuerda mide ${a}. Otra cuerda mide ${b}. ¿Cuál es más larga?`, opcion: (v) => `La de ${v}`, igual: "Las dos miden lo mismo" },
  { e: MASA_KG_G, frase: (a, b) => `Un saco pesa ${a} y otro pesa ${b}. ¿Cuál pesa más?`, facil: (a, b) => `Un saco pesa ${a}. Otro saco pesa ${b}. ¿Cuál pesa más?`, opcion: (v) => `El de ${v}`, igual: "Los dos pesan lo mismo" },
  { e: CAPACIDAD_L_ML, frase: (a, b) => `Una botella contiene ${a} de agua y otra contiene ${b}. ¿Cuál contiene más agua?`, facil: (a, b) => `Una botella tiene ${a} de agua. Otra botella tiene ${b}. ¿Cuál tiene más agua?`, opcion: (v) => `La de ${v}`, igual: "Las dos contienen lo mismo" },
];

const compararMedidas: Plantilla = (rng, d) => {
  const m = elegir(rng, MEDIBLES);
  const { e } = m;
  const k = entero(rng, 1, 6);
  const v1 = k * e.factor + porNivel(d, 0, e.factor / 2, e.factor / 4);
  const v2 = porNivel(d, v1 + elegir(rng, [-1, 1]) * (e.factor / 2), v1 + elegir(rng, [-1, 1]) * (e.factor / 5), v1 + elegir(rng, [-1, 0, 1]) * (e.factor / 20));
  const a = `${enGrande(v1, e)} ${e.g}`;
  const b = `${v2} ${e.p}`;
  const correcta = v1 > v2 ? m.opcion(a) : v2 > v1 ? m.opcion(b) : m.igual;
  return {
    enunciado: m.frase(a, b),
    enunciadoFacil: m.facil(a, b),
    respuesta: opciones(correcta, [m.opcion(a), m.opcion(b), m.igual].filter((o) => o !== correcta)),
    pista: "Antes de comparar, escribe las dos medidas en la misma unidad.",
    explicacion: `${a} son ${v1} ${e.p}. Hay que comparar ${v1} ${e.p} con ${v2} ${e.p}.`,
  };
};

const quitarYQuedar: Plantilla = (rng, d) => {
  const situacion = elegir(rng, [
    { e: LONGITUD_M_CM, frase: (a: string, b: string) => `De una cuerda de ${a} se cortan ${b}.`, facil: (a: string, b: string) => `Una cuerda mide ${a}. Se cortan ${b}.` },
    { e: MASA_KG_G, frase: (a: string, b: string) => `De un saco de ${a} de arroz se sacan ${b}.`, facil: (a: string, b: string) => `Un saco tiene ${a} de arroz. Se sacan ${b}.` },
    { e: CAPACIDAD_L_ML, frase: (a: string, b: string) => `De una botella de ${a} de agua se beben ${b}.`, facil: (a: string, b: string) => `Una botella tiene ${a} de agua. Se beben ${b}.` },
  ]);
  const { e } = situacion;
  const k = entero(rng, 2, 6);
  const total = k * e.factor + (d === 3 ? e.factor / 2 : 0);
  const quita = d === 1 ? e.factor / 2 : e.factor === 100 ? elegir(rng, [35, 45, 65, 75, 85]) : elegir(rng, [350, 450, 650, 750, 850]);
  const a = `${enGrande(total, e)} ${e.g}`;
  const b = `${quita} ${e.p}`;
  return {
    enunciado: `${situacion.frase(a, b)} ¿Cuántos ${e.pequena} quedan?`,
    enunciadoFacil: `${situacion.facil(a, b)} ¿Cuántos ${e.pequena} quedan?`,
    respuesta: numero(total - quita),
    pista: `Pasa primero todo a ${e.pequena}. Después resta.`,
    explicacion: `${a} son ${total} ${e.p}, y ${total} − ${quita} = ${total - quita}.`,
  };
};

// ---------- NUM5-T5-a: elegir la operación ----------
type Op = "+" | "−" | "×" | "÷";
const OPS: readonly Op[] = ["+", "−", "×", "÷"];

// Con resta y división el número mayor va delante; con suma y producto, en el orden dado.
function expresion(op: Op, x: string, y: string, vx: number, vy: number): string {
  return (op === "−" || op === "÷") && vx < vy ? `${y} ${op} ${x}` : `${x} ${op} ${y}`;
}

interface Caso {
  readonly op: Op;
  readonly a: number;
  readonly b: number;
  readonly extra?: number;
  readonly frase: string;
  readonly facil: string;
  readonly porque: string;
}

const CASOS: Readonly<Record<Dificultad, readonly ((rng: Rng) => Caso)[]>> = {
  1: [
    (rng) => {
      const [a, b] = [entero(rng, 12, 40), entero(rng, 5, 11)];
      const n = nombre(rng);
      return { op: "+", a, b, frase: `${n} recoge ${a} huevos por la mañana y ${b} huevos por la tarde. ¿Cuántos huevos recoge en total?`, facil: `${n} recoge ${a} huevos por la mañana. Recoge ${b} huevos por la tarde. ¿Cuántos huevos recoge en total?`, porque: "Hay que juntar las dos cantidades." };
    },
    (rng) => {
      const [a, b] = [entero(rng, 25, 50), entero(rng, 5, 20)];
      return { op: "−", a, b, frase: `En un autobús van ${a} personas y bajan ${b}. ¿Cuántas personas quedan en el autobús?`, facil: `En un autobús van ${a} personas. Bajan ${b}. ¿Cuántas personas quedan?`, porque: "Las personas que bajan se quitan de las que iban." };
    },
    (rng) => {
      const [a, b] = [entero(rng, 3, 9), entero(rng, 11, 15)];
      return { op: "×", a, b, frase: `Hay ${a} cajas con ${b} lápices en cada caja. ¿Cuántos lápices hay en total?`, facil: `Hay ${a} cajas. Cada caja tiene ${b} lápices. ¿Cuántos lápices hay en total?`, porque: "Son grupos iguales: varias cajas con los mismos lápices." };
    },
    (rng) => {
      const b = entero(rng, 3, 9);
      const a = b * entero(rng, 4, 12);
      return { op: "÷", a, b, frase: `Hay ${a} cuadernos para repartir en partes iguales entre ${b} alumnos. ¿Cuántos cuadernos recibe cada alumno?`, facil: `Hay ${a} cuadernos. Se reparten en partes iguales entre ${b} alumnos. ¿Cuántos recibe cada alumno?`, porque: "Repartir en partes iguales es dividir." };
    },
  ],
  2: [
    (rng) => {
      const [a, b] = [entero(rng, 30, 60), entero(rng, 5, 25)];
      const [x, y] = nombres(rng, 2) as [string, string];
      return { op: "−", a, b, frase: `${x} tiene ${a} monedas. Eso es ${b} monedas más que ${y}. ¿Cuántas monedas tiene ${y}?`, facil: `${x} tiene ${a} monedas. ${y} tiene ${b} monedas menos que ${x}. ¿Cuántas monedas tiene ${y}?`, porque: "Si tiene menos que la otra persona, hay que quitar la diferencia, aunque el problema diga «más»." };
    },
    (rng) => {
      const [a, b] = [entero(rng, 30, 60), entero(rng, 5, 25)];
      const [x, y] = nombres(rng, 2) as [string, string];
      return { op: "+", a, b, frase: `${x} tiene ${a} monedas. Eso es ${b} monedas menos que ${y}. ¿Cuántas monedas tiene ${y}?`, facil: `${x} tiene ${a} monedas. ${y} tiene ${b} monedas más que ${x}. ¿Cuántas monedas tiene ${y}?`, porque: "La otra persona tiene más, así que hay que añadir la diferencia, aunque el problema diga «menos»." };
    },
    (rng) => {
      const b = elegir(rng, [6, 10, 12]);
      const a = b * entero(rng, 4, 12);
      return { op: "÷", a, b, frase: `Hay ${a} huevos y se guardan en cajas de ${b} huevos. ¿Cuántas cajas se llenan?`, facil: `Hay ${a} huevos. En cada caja caben ${b} huevos. ¿Cuántas cajas se llenan?`, porque: "Hay que ver cuántos grupos de ese tamaño salen del total." };
    },
    (rng) => {
      const [a, b] = [entero(rng, 3, 9), entero(rng, 11, 30)];
      const n = nombre(rng);
      return { op: "×", a, b, frase: `${n} camina ${a} km cada día. ¿Cuántos kilómetros camina en ${b} días?`, facil: `${n} camina ${a} km cada día. Camina durante ${b} días. ¿Cuántos kilómetros son?`, porque: "Cada día camina lo mismo: se repite la misma cantidad." };
    },
  ],
  3: [
    (rng) => {
      const [a, b, extra] = [entero(rng, 4, 9), entero(rng, 11, 20), entero(rng, 21, 30)];
      return { op: "×", a, b, extra, frase: `En una tienda hay ${a} filas con ${b} botellas en cada fila. Cada botella cuesta ${extra} monedas. ¿Cuántas botellas hay?`, facil: `Hay ${a} filas. Cada fila tiene ${b} botellas. Cada botella cuesta ${extra} monedas. ¿Cuántas botellas hay?`, porque: "El precio no hace falta. Solo importan las filas y las botellas de cada fila." };
    },
    (rng) => {
      const b = entero(rng, 3, 8);
      const a = b * entero(rng, 5, 12);
      const extra = entero(rng, 12, 14);
      return { op: "÷", a, b, extra, frase: `En una clase hay ${extra} mesas. Se reparten ${a} libros en partes iguales entre ${b} grupos. ¿Cuántos libros recibe cada grupo?`, facil: `Hay ${extra} mesas. Hay ${a} libros. Se reparten en partes iguales entre ${b} grupos. ¿Cuántos libros recibe cada grupo?`, porque: "Las mesas no hacen falta. Hay que repartir los libros entre los grupos." };
    },
    (rng) => {
      const [a, b, extra] = [entero(rng, 25, 40), entero(rng, 5, 20), entero(rng, 45, 60)];
      return { op: "−", a, b, extra, frase: `Un autobús tiene ${extra} asientos y sale con ${a} personas. En la primera parada bajan ${b} personas. ¿Cuántas personas siguen en el autobús?`, facil: `Un autobús tiene ${extra} asientos. Sale con ${a} personas. Bajan ${b} personas. ¿Cuántas personas siguen en el autobús?`, porque: "Los asientos no hacen falta. A las personas que iban se les quitan las que bajan." };
    },
    (rng) => {
      const [a, b, extra] = [entero(rng, 15, 40), entero(rng, 11, 14), entero(rng, 2, 9)];
      return { op: "+", a, b, extra, frase: `Una tienda vende ${a} cuadernos el lunes y ${b} cuadernos el martes. Cada cuaderno cuesta ${extra} monedas. ¿Cuántos cuadernos vende en los dos días?`, facil: `El lunes se venden ${a} cuadernos. El martes se venden ${b} cuadernos. Cada cuaderno cuesta ${extra} monedas. ¿Cuántos cuadernos se venden en los dos días?`, porque: "El precio no hace falta. Hay que juntar los cuadernos de los dos días." };
    },
  ],
};

const elegirOperacion: Plantilla = (rng, d) => {
  const c = elegir(rng, CASOS[d])(rng);
  const fx = (op: Op, x: number, y: number) => expresion(op, String(x), String(y), x, y);
  const correcta = fx(c.op, c.a, c.b);
  const otras = OPS.filter((o) => o !== c.op).map((o) => fx(o, c.a, c.b));
  const distractores = c.extra === undefined ? otras : [...otras.slice(0, 2), fx(c.op, c.extra, c.b)];
  return {
    enunciado: `${c.frase} ¿Qué operación resuelve el problema?`,
    enunciadoFacil: `${c.facil} ¿Qué operación usas?`,
    respuesta: opciones(correcta, distractores),
    pista: "Piensa qué pasa en la historia: ¿se junta, se quita, se repite o se reparte?",
    explicacion: `${c.porque} Por eso la operación es ${correcta}.`,
  };
};

const operacionConDecimales: Plantilla = (rng, d) => {
  const n = nombre(rng);
  const c = entero(rng, 2, 6) * 100 + elegir(rng, porNivel(d, [50], [25, 75], [15, 35, 45]));
  const k = entero(rng, 3, 8);
  const x = articuloBarato(rng);
  const plano = (v: number) => (v % 100 === 0 ? String(v / 100) : dosCifras(v));
  const casos: readonly { op: Op; p: number; q: number; frase: string; facil: string; porque: string; f: (v: number) => string }[] = [
    { op: "×", p: k * 100, q: c, f: plano, frase: `Cada ${x.nombre} cuesta ${dinero(c)}. ${n} compra ${k} y quiere saber cuánto paga.`, facil: `Cada ${x.nombre} cuesta ${dinero(c)}. ${n} compra ${k}. Quiere saber cuánto paga.`, porque: "Se repite el mismo precio varias veces." },
    { op: "÷", p: c * k, q: k * 100, f: plano, frase: `${k} amigos pagan ${dinero(c * k)} entre todos, en partes iguales. Quieren saber cuánto paga cada uno.`, facil: `${k} amigos pagan ${dinero(c * k)}. Todos pagan lo mismo. Quieren saber cuánto paga cada uno.`, porque: "Hay que repartir el total en partes iguales." },
    { op: "−", p: c + k * 100, q: c, f: plano, frase: `${n} tenía ${dinero(c + k * 100)} y gasta ${dinero(c)}. Quiere saber cuánto le queda.`, facil: `${n} tenía ${dinero(c + k * 100)}. Gasta ${dinero(c)}. Quiere saber cuánto le queda.`, porque: "Lo que gasta se quita de lo que tenía." },
    { op: "+", p: c, q: k * 100 + 50, f: conComa, frase: `${n} camina ${conComa(c)} km por la mañana y ${conComa(k * 100 + 50)} km por la tarde. Quiere saber cuántos kilómetros camina en total.`, facil: `${n} camina ${conComa(c)} km por la mañana. Camina ${conComa(k * 100 + 50)} km por la tarde. Quiere saber cuántos kilómetros son en total.`, porque: "Hay que juntar las dos distancias." },
  ];
  const caso = elegir(rng, casos);
  const fx = (op: Op) => expresion(op, caso.f(caso.p), caso.f(caso.q), caso.p, caso.q);
  const correcta = fx(caso.op);
  return {
    enunciado: `${caso.frase} ¿Qué operación debe hacer?`,
    enunciadoFacil: `${caso.facil} ¿Qué operación hace?`,
    respuesta: opciones(correcta, OPS.filter((o) => o !== caso.op).map(fx)),
    pista: "Los decimales no cambian la operación. Piensa cómo lo harías con números enteros.",
    explicacion: `${caso.porque} Por eso la operación es ${correcta}.`,
  };
};

// ---------- NUM5-T5-b: resolver en dos pasos ----------
const compraYCambio: Plantilla = (rng, d) => {
  const x = articuloBarato(rng);
  const n = nombre(rng);
  const q = porNivel(d, entero(rng, 2, 4), entero(rng, 3, 6), entero(rng, 2, 4));
  const unidad = porNivel(d, entero(rng, 2, 5) * 100, entero(rng, 6, 12) * 100, entero(rng, 2, 6) * 100 + elegir(rng, [25, 50, 75]));
  const total = q * unidad;
  const pago = Math.ceil((total + 100) / 1000) * 1000;
  return {
    enunciado: `Cada ${x.nombre} cuesta ${dinero(unidad)}. ${n} compra ${q} y paga con ${dinero(pago)}. ¿Cuántas monedas le devuelven?`,
    enunciadoFacil: `Cada ${x.nombre} cuesta ${dinero(unidad)}. ${n} compra ${q}. Paga con ${dinero(pago)}. ¿Cuántas monedas le devuelven?`,
    respuesta: numero(conComa(pago - total)),
    pista: "Primero calcula lo que cuesta todo. Después resta.",
    explicacion: `${q} × ${conComa(unidad)} = ${conComa(total)}, y ${conComa(pago)} − ${conComa(total)} = ${conComa(pago - total)}.`,
  };
};

const juntarYRepartir: Plantilla = (rng, d) => {
  const [x, y] = nombres(rng, 2) as [string, string];
  const k = porNivel(d, entero(rng, 2, 5), entero(rng, 4, 8), entero(rng, 6, 12));
  const cada = porNivel(d, entero(rng, 3, 9), entero(rng, 6, 15), entero(rng, 12, 25));
  const total = k * cada;
  const a = entero(rng, Math.ceil(total / 3), Math.floor((2 * total) / 3));
  const b = total - a;
  return {
    enunciado: `${x} tiene ${a} lápices y ${y} tiene ${b} lápices. Juntan todos los lápices y los reparten en partes iguales en ${k} cajas. ¿Cuántos lápices hay en cada caja?`,
    enunciadoFacil: `${x} tiene ${a} lápices. ${y} tiene ${b} lápices. Los juntan. Los reparten en partes iguales en ${k} cajas. ¿Cuántos lápices hay en cada caja?`,
    respuesta: numero(cada),
    pista: "Primero suma todos los lápices. Después reparte.",
    explicacion: `${a} + ${b} = ${total}, y ${total} ÷ ${k} = ${cada}.`,
  };
};

const cajasYSueltos: Plantilla = (rng, d) => {
  const c = porNivel(d, entero(rng, 2, 5), entero(rng, 6, 12), entero(rng, 12, 25));
  const h = porNivel(d, entero(rng, 3, 6), elegir(rng, [6, 10, 12]), elegir(rng, [12, 15, 24]));
  const s = entero(rng, 2, h - 1);
  const objeto = elegir(rng, ["huevos", "lápices", "jabones"]);
  return {
    enunciado: `Hay ${c} cajas con ${h} ${objeto} en cada caja y ${s} ${objeto} sueltos. ¿Cuántos ${objeto} hay en total?`,
    enunciadoFacil: `Hay ${c} cajas. Cada caja tiene ${h} ${objeto}. Hay ${s} ${objeto} sueltos. ¿Cuántos ${objeto} hay en total?`,
    respuesta: numero(c * h + s),
    pista: "Primero calcula lo que hay en las cajas. Después añade los sueltos.",
    explicacion: `${c} × ${h} = ${c * h}, y ${c * h} + ${s} = ${c * h + s}.`,
  };
};

const gastarYRepartir: Plantilla = (rng, d) => {
  const k = porNivel(d, entero(rng, 2, 4), entero(rng, 3, 6), entero(rng, 5, 9));
  const cada = porNivel(d, entero(rng, 3, 8), entero(rng, 7, 15), entero(rng, 12, 30));
  const gasto = porNivel(d, entero(rng, 3, 9), entero(rng, 10, 30), entero(rng, 25, 80));
  const total = k * cada + gasto;
  return {
    enunciado: `Un grupo de ${k} amigos tiene ${dinero(total * 100)}. Gasta ${dinero(gasto * 100)} y reparte lo que queda en partes iguales. ¿Cuántas monedas recibe cada amigo?`,
    enunciadoFacil: `Hay ${k} amigos. Tienen ${dinero(total * 100)}. Gastan ${dinero(gasto * 100)}. Reparten el resto en partes iguales. ¿Cuántas monedas recibe cada amigo?`,
    respuesta: numero(cada),
    pista: "Primero resta lo que gastan. Después reparte.",
    explicacion: `${total} − ${gasto} = ${total - gasto}, y ${total - gasto} ÷ ${k} = ${cada}.`,
  };
};

const dosCompras: Plantilla = (rng, d) => {
  const [x, y] = par(rng, BARATOS);
  const n = nombre(rng);
  const [q1, q2] = par(rng, rango(2, porNivel(d, 5, 9, 6)));
  const [p1, p2] = d === 3
    ? [entero(rng, 1, 4) * 100 + 50, entero(rng, 1, 4) * 100 + 25]
    : par(rng, rango(porNivel(d, 2, 5, 1), porNivel(d, 6, 12, 1) + 1).map((v) => v * 100));
  const total = q1 * p1 + q2 * p2;
  return {
    enunciado: `Cada ${x.nombre} cuesta ${dinero(p1)} y cada ${y.nombre} cuesta ${dinero(p2)}. ${n} compra ${q1} ${x.plural} y ${q2} ${y.plural}. ¿Cuántas monedas paga en total?`,
    enunciadoFacil: `Cada ${x.nombre} cuesta ${dinero(p1)}. Cada ${y.nombre} cuesta ${dinero(p2)}. ${n} compra ${q1} ${x.plural}. También compra ${q2} ${y.plural}. ¿Cuántas monedas paga en total?`,
    respuesta: numero(conComa(total)),
    pista: "Calcula por separado cada compra. Después suma.",
    explicacion: `${q1} × ${conComa(p1)} = ${conComa(q1 * p1)} y ${q2} × ${conComa(p2)} = ${conComa(q2 * p2)}. En total, ${conComa(total)}.`,
  };
};

const paradasDeAutobus: Plantilla = (rng, d) => {
  const a = porNivel(d, entero(rng, 15, 30), entero(rng, 30, 45), entero(rng, 40, 60));
  const b = entero(rng, 5, 14);
  const c = entero(rng, 3, 12);
  const e = entero(rng, 4, 15);
  if (d === 3) {
    return {
      enunciado: `En un autobús van ${a} personas. En la primera parada bajan ${b} y suben ${c}. En la segunda parada bajan ${e}. ¿Cuántas personas van ahora en el autobús?`,
      enunciadoFacil: `En un autobús van ${a} personas. Primera parada: bajan ${b} y suben ${c}. Segunda parada: bajan ${e}. ¿Cuántas personas van ahora?`,
      respuesta: numero(a - b + c - e),
      pista: "Sigue la historia parada a parada.",
      explicacion: `${a} − ${b} = ${a - b}, ${a - b} + ${c} = ${a - b + c}, y ${a - b + c} − ${e} = ${a - b + c - e}.`,
    };
  }
  return {
    enunciado: `En un autobús van ${a} personas. En una parada bajan ${b} y suben ${c}. ¿Cuántas personas van ahora en el autobús?`,
    enunciadoFacil: `En un autobús van ${a} personas. Bajan ${b}. Suben ${c}. ¿Cuántas personas van ahora?`,
    respuesta: numero(a - b + c),
    pista: "Primero quita las que bajan. Después añade las que suben.",
    explicacion: `${a} − ${b} = ${a - b}, y ${a - b} + ${c} = ${a - b + c}.`,
  };
};

// ---------- NUM5-T5-c: ¿es razonable el resultado? ----------
const SI = "Sí, es razonable";
const GRANDE = "No, es demasiado grande";
const PEQUENO = "No, es demasiado pequeño";

// Lo mostrado es exacto, o diez veces mayor o menor: nunca un caso discutible.
function veredicto(rng: Rng, correcta: number): { mostrado: number; correcta: string; otras: string[] } {
  const tipo = elegir(rng, [SI, GRANDE, PEQUENO]);
  const mostrado = tipo === SI ? correcta : tipo === GRANDE ? correcta * 10 : Math.floor(correcta / 10);
  return { mostrado, correcta: tipo, otras: [SI, GRANDE, PEQUENO].filter((t) => t !== tipo) };
}

function razon(correcta: string, real: string, mostrado: string): string {
  if (correcta === SI) return `El resultado ${mostrado} es correcto y tiene sentido.`;
  return `El resultado de verdad es ${real}, muy lejos de ${mostrado}: ${correcta === GRANDE ? "es unas 10 veces mayor" : "es unas 10 veces menor"}.`;
}

const resultadoSinCalcular: Plantilla = (rng, d) => {
  if (d === 3) {
    const a = entero(rng, 2, 9) * 100 + elegir(rng, [80, 90]);
    const b = entero(rng, 3, 9);
    const r = a * b;
    return {
      enunciado: `Sin hacer la cuenta exacta, ¿cuál de estos resultados es razonable para ${conComa(a)} × ${b}?`,
      enunciadoFacil: `Mira la cuenta ${conComa(a)} × ${b}. No la hagas exacta. ¿Qué resultado es razonable?`,
      respuesta: opciones(conComa(r), [conComa(r / 10), conComa(r * 10), conComa(a + b * 100)]),
      pista: `Redondea ${conComa(a)} al número entero más cercano y multiplica.`,
      explicacion: `${conComa(a)} está cerca de ${Math.round(a / 100)}, y ${Math.round(a / 100)} × ${b} = ${Math.round(a / 100) * b}. El resultado debe estar cerca de ese número.`,
    };
  }
  const a = d === 1 ? entero(rng, 2, 9) * 10 + elegir(rng, [8, 9, 1, 2]) : entero(rng, 1, 9) * 100 + elegir(rng, [98, 99, 2, 1]);
  const b = entero(rng, 3, 9);
  const r = a * b;
  const redondo = Math.round(a / (d === 1 ? 10 : 100)) * (d === 1 ? 10 : 100);
  return {
    enunciado: `Sin hacer la cuenta exacta, ¿cuál de estos resultados es razonable para ${a} × ${b}?`,
    enunciadoFacil: `Mira la cuenta ${a} × ${b}. No la hagas exacta. ¿Qué resultado es razonable?`,
    respuesta: opciones(String(r), [String(r * 10), String(Math.floor(r / 10)), String(a + b)]),
    pista: `Redondea ${a} y multiplica de cabeza.`,
    explicacion: `${a} está cerca de ${redondo}, y ${redondo} × ${b} = ${redondo * b}. El resultado debe estar cerca de ese número.`,
  };
};

const comprobarCuenta: Plantilla = (rng, d) => {
  const n = nombre(rng);
  const a = d === 3 ? entero(rng, 2, 9) * 100 + entero(rng, 1, 9) * 10 : d === 2 ? entero(rng, 12, 49) : entero(rng, 15, 60);
  const b = d === 1 ? entero(rng, 15, 39) : entero(rng, 3, 9);
  const real = d === 3 ? a * b : d === 2 ? a * b * 100 : (a + b) * 100;
  const signo = d === 1 ? "+" : "×";
  const v = veredicto(rng, real / (d === 3 ? 1 : 100));
  const mostrado = d === 3 ? conComa(v.mostrado) : String(v.mostrado);
  const cuenta = `${d === 3 ? conComa(a) : a} ${signo} ${b}`;
  const texto = d === 3 ? conComa(real) : String(real / 100);
  return {
    enunciado: `${n} ha calculado que ${cuenta} = ${mostrado}. ¿Es razonable ese resultado?`,
    enunciadoFacil: `${n} dice que ${cuenta} = ${mostrado}. ¿Es razonable?`,
    respuesta: opciones(v.correcta, v.otras),
    pista: "Redondea los números y haz la cuenta de cabeza. Compara con lo que dice el problema.",
    explicacion: razon(v.correcta, texto, mostrado),
  };
};

interface Afirmacion {
  readonly correcta: number;
  readonly frase: (m: number) => string;
  readonly facil: (m: number) => string;
}

const AFIRMACIONES: Readonly<Record<Dificultad, readonly ((rng: Rng, n: string) => Afirmacion)[]>> = {
  1: [
    (rng, n) => {
      const k = entero(rng, 3, 8);
      const c = entero(rng, 21, 35);
      return {
        correcta: c,
        frase: (m) => `Se reparten ${k * c} lápices en partes iguales entre ${k} niños. ${n} dice que a cada niño le tocan ${m} lápices. ¿Es razonable?`,
        facil: (m) => `Hay ${k * c} lápices. Se reparten entre ${k} niños. ${n} dice que cada niño recibe ${m}. ¿Es razonable?`,
      };
    },
    (rng, n) => {
      const v = entero(rng, 4, 9) * 10;
      const h = entero(rng, 2, 5);
      return {
        correcta: v * h,
        frase: (m) => `Un autobús recorre ${v} km cada hora. ${n} dice que en ${h} horas recorre ${m} km. ¿Es razonable?`,
        facil: (m) => `Un autobús hace ${v} km cada hora. Viaja ${h} horas. ${n} dice que hace ${m} km. ¿Es razonable?`,
      };
    },
  ],
  2: [
    (rng, n) => {
      const q = entero(rng, 2, 4);
      const u = entero(rng, 5, 9);
      const pago = 50;
      return {
        correcta: pago - q * u,
        frase: (m) => `Cada cuaderno cuesta ${u} monedas. ${n} compra ${q} y paga con ${pago} monedas. Dice que le devuelven ${m === 1 ? "1 moneda" : `${m} monedas`}. ¿Es razonable?`,
        facil: (m) => `Cada cuaderno cuesta ${u} monedas. ${n} compra ${q}. Paga con ${pago} monedas. Dice que le devuelven ${m === 1 ? "1 moneda" : `${m} monedas`}. ¿Es razonable?`,
      };
    },
    (rng, n) => {
      const [l, a] = [entero(rng, 10, 15), entero(rng, 3, 5)];
      return {
        correcta: l * a,
        frase: (m) => `Un huerto rectangular mide ${l} m de largo y ${a} m de ancho. ${n} dice que tiene ${m} metros cuadrados. ¿Es razonable?`,
        facil: (m) => `Un huerto rectangular mide ${l} m de largo y ${a} m de ancho. ${n} dice que tiene ${m} metros cuadrados. ¿Es razonable?`,
      };
    },
  ],
  3: [
    (rng, n) => {
      const base = entero(rng, 15, 40) * 4;
      const x = articuloCaro(rng);
      return {
        correcta: (base * 3) / 4,
        frase: (m) => `${mayus(x.un)} cuesta ${base} monedas y tiene un descuento del 25 %. ${n} dice que paga ${m} monedas. ¿Es razonable?`,
        facil: (m) => `${mayus(x.un)} cuesta ${base} monedas. Tiene un descuento del 25 %. ${n} dice que paga ${m} monedas. ¿Es razonable?`,
      };
    },
    (rng, n) => {
      const total = entero(rng, 12, 40) * 10;
      return {
        correcta: total / 2,
        frase: (m) => `En una escuela hay ${total} alumnos y el 50 % va a pie. ${n} dice que van a pie ${m} alumnos. ¿Es razonable?`,
        facil: (m) => `En una escuela hay ${total} alumnos. El 50 % va a pie. ${n} dice que son ${m} alumnos. ¿Es razonable?`,
      };
    },
  ],
};

const comprobarProblema: Plantilla = (rng, d) => {
  const n = nombre(rng);
  const a = elegir(rng, AFIRMACIONES[d])(rng, n);
  const v = veredicto(rng, a.correcta);
  return {
    enunciado: a.frase(v.mostrado),
    enunciadoFacil: a.facil(v.mostrado),
    respuesta: opciones(v.correcta, v.otras),
    pista: "Calcula de forma aproximada lo que debería salir y compáralo con lo que dice.",
    explicacion: razon(v.correcta, String(a.correcta), String(v.mostrado)),
  };
};

interface Medida {
  readonly cosa: string;
  readonly bien: string;
  readonly mal: readonly [string, string, string];
}

const MEDIDAS: Readonly<Record<Dificultad, readonly Medida[]>> = {
  1: [
    { cosa: "la altura de una puerta", bien: "2 m", mal: ["2 cm", "2 km", "200 m"] },
    { cosa: "el largo de un lápiz nuevo", bien: "18 cm", mal: ["18 m", "18 km", "180 m"] },
    { cosa: "el agua que cabe en un vaso", bien: "200 ml", mal: ["200 l", "2000 l", "2 ml"] },
    { cosa: "lo que pesa una manzana", bien: "150 g", mal: ["150 kg", "1500 kg", "1 g"] },
    { cosa: "la altura de un niño de 11 años", bien: "1,45 m", mal: ["14,5 m", "145 m", "14,5 cm"] },
  ],
  2: [
    { cosa: "lo que pesa un libro de la escuela", bien: "500 g", mal: ["500 kg", "5 g", "50 kg"] },
    { cosa: "la distancia que camina una persona en una hora", bien: "5 km", mal: ["500 km", "5 m", "5 cm"] },
    { cosa: "el agua que bebe una persona en un día", bien: "2 l", mal: ["200 l", "2 ml", "2000 l"] },
    { cosa: "el tiempo que se tarda en lavarse las manos", bien: "30 segundos", mal: ["30 horas", "30 días", "30 semanas"] },
    { cosa: "el largo de un autobús", bien: "12 m", mal: ["12 cm", "12 km", "120 km"] },
  ],
  3: [
    { cosa: "el agua que cabe en un cubo", bien: "10 l", mal: ["10 ml", "1000 l", "100 ml"] },
    { cosa: "lo que pesa una persona adulta", bien: "70 kg", mal: ["70 g", "700 kg", "7 kg"] },
    { cosa: "el ancho de una hoja de cuaderno", bien: "20 cm", mal: ["20 m", "2 mm", "2 m"] },
    { cosa: "la altura de un edificio de 3 pisos", bien: "10 m", mal: ["10 cm", "10 km", "100 m"] },
    { cosa: "el tiempo que dura una clase en la escuela", bien: "45 minutos", mal: ["45 segundos", "45 horas", "45 días"] },
  ],
};

const medidaRazonable: Plantilla = (rng, d) => {
  const m = elegir(rng, MEDIDAS[d]);
  return {
    enunciado: `¿Qué medida es razonable para ${m.cosa}?`,
    enunciadoFacil: `Piensa en ${m.cosa}. ¿Qué medida es razonable?`,
    respuesta: opciones(m.bien, m.mal),
    pista: "Imagina el objeto de verdad y compáralo con cosas que conoces.",
    explicacion: `Para ${m.cosa}, lo razonable es ${m.bien}. Las otras medidas son demasiado grandes o demasiado pequeñas.`,
  };
};

export const QUINTO_B: MapaGeneradores = {
  "NUM5-T4-a": generadores("NUM5-T4-a", [perimetroDelDibujo, perimetroDelCuadrado, perimetroDePoligono, vallaDelHuerto, ladoQueFalta]),
  "NUM5-T4-b": generadores("NUM5-T4-b", [areaDelDibujo, areaDelCuadrado, areaDelHuerto, anchoDesdeArea]),
  "NUM5-T4-c": generadores("NUM5-T4-c", [convertirUnidades, compararMedidas, quitarYQuedar]),
  "NUM5-T5-a": generadores("NUM5-T5-a", [elegirOperacion, operacionConDecimales]),
  "NUM5-T5-b": generadores("NUM5-T5-b", [compraYCambio, juntarYRepartir, cajasYSueltos, gastarYRepartir, dosCompras, paradasDeAutobus]),
  "NUM5-T5-c": generadores("NUM5-T5-c", [resultadoSinCalcular, comprobarCuenta, comprobarProblema, medidaRazonable]),
};

