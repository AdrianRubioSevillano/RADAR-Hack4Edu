// 6.º: medidas y conversiones, y datos y azar.
import type { Rng } from "../../../core/rng.ts";
import { barajar, elegir, entero, muestra, nombre, nombres } from "../../ayuda.ts";
import type { Dificultad, MapaGeneradores } from "../../tipos.ts";
import {
  CAPACIDAD_L_ML, LONGITUD_KM_M, LONGITUD_M_CM, MASA_KG_G, conComa, dinero, duracion, enGrande, generadores, hora, numero, opciones, opcionesNumero, par,
  porNivel, rango, trio, type Escala, type Plantilla,
} from "./comun.ts";

const LONGITUD_CM_MM: Escala = { grande: "centímetros", pequena: "milímetros", g: "cm", p: "mm", factor: 10 };
const MASA_T_KG: Escala = { grande: "toneladas", pequena: "kilogramos", g: "t", p: "kg", factor: 1000 };
// "Cuántas horas", "Cuántos días".
function cuantos(palabra: string, mayuscula = true): string {
  const base = /^(horas|semanas|toneladas)$/.test(palabra) ? "uántas" : "uántos";
  return `${mayuscula ? "C" : "c"}${base} ${palabra}`;
}

const ESCALAS = [LONGITUD_M_CM, LONGITUD_KM_M, LONGITUD_CM_MM, MASA_KG_G, MASA_T_KG, CAPACIDAD_L_ML] as const;

// ---------- NUM6-T4-a: longitud, peso y capacidad ----------
const convertirMedidas: Plantilla = (rng, d) => {
  const e = elegir(rng, ESCALAS);
  const k = entero(rng, 2, 12);
  if (d === 1) {
    const cantidad = k * e.factor + e.factor / 2;
    return {
      enunciado: `¿${cuantos(e.pequena)} son ${enGrande(cantidad, e)} ${e.grande}?`,
      enunciadoFacil: `Tienes ${enGrande(cantidad, e)} ${e.grande}. ¿${cuantos(e.pequena)} son?`,
      respuesta: numero(cantidad),
      pista: `Multiplica por ${e.factor}.`,
      explicacion: `${enGrande(cantidad, e)} × ${e.factor} = ${cantidad}.`,
    };
  }
  const resto = e.factor === 1000 ? elegir(rng, [50, 150, 250, 450, 750, 800]) : e.factor === 100 ? elegir(rng, [5, 25, 45, 75, 80]) : elegir(rng, [2, 5, 8]);
  const cantidad = k * e.factor + resto;
  if (d === 2) {
    return {
      enunciado: `¿${cuantos(e.grande)} son ${cantidad} ${e.pequena}?`,
      enunciadoFacil: `Tienes ${cantidad} ${e.pequena}. ¿${cuantos(e.grande)} son?`,
      respuesta: numero(enGrande(cantidad, e)),
      pista: `Divide entre ${e.factor}.`,
      explicacion: `${cantidad} ÷ ${e.factor} = ${enGrande(cantidad, e)}.`,
    };
  }
  return {
    enunciado: `¿${cuantos(e.grande)} son en total ${k} ${e.g} y ${resto} ${e.p}?`,
    enunciadoFacil: `Tienes ${k} ${e.g} y ${resto} ${e.p}. ¿${cuantos(e.grande)} son en total?`,
    respuesta: numero(enGrande(cantidad, e)),
    pista: `Pasa los ${resto} ${e.p} a ${e.grande} y súmalos a ${k}.`,
    explicacion: `${resto} ${e.p} son ${enGrande(resto, e)} ${e.g}, y ${k} + ${enGrande(resto, e)} = ${enGrande(cantidad, e)}.`,
  };
};

const mayorMedida: Plantilla = (rng, d) => {
  const e = elegir(rng, [LONGITUD_M_CM, MASA_KG_G, CAPACIDAD_L_ML]);
  const tipo = elegir(rng, ["mayor", "menor"]);
  const v = entero(rng, 2, 6) * e.factor + (d === 1 ? 0 : e.factor / 4);
  const paso = porNivel(d, e.factor / 2, e.factor / 5, e.factor / 20);
  const valores = barajar(rng, [v - paso, v, v + paso]);
  const texto = (x: number, i: number) => (i === 1 ? `${x} ${e.p}` : `${enGrande(x, e)} ${e.g}`);
  const objetivo = tipo === "mayor" ? v + paso : v - paso;
  const textos = valores.map(texto);
  const correcta = textos[valores.indexOf(objetivo)] ?? "";
  return {
    enunciado: `¿Cuál de estas medidas es la ${tipo}?`,
    enunciadoFacil: `Mira las medidas. ¿Cuál es la ${tipo}?`,
    respuesta: opciones(correcta, textos.filter((t) => t !== correcta)),
    pista: "Escribe las tres medidas en la misma unidad antes de comparar.",
    explicacion: `En ${e.pequena}, las medidas son ${valores.join(", ")}. La ${tipo} es ${objetivo} ${e.p}.`,
  };
};

interface Reparto {
  readonly e: Escala;
  readonly frase: (a: string, b: string) => string;
  readonly facil: (a: string, b: string) => string;
  readonly pregunta: string;
}

const REPARTOS: readonly Reparto[] = [
  { e: CAPACIDAD_L_ML, frase: (a, b) => `Una jarra contiene ${a} de agua y cada vaso se llena con ${b}.`, facil: (a, b) => `Una jarra tiene ${a} de agua. Cada vaso lleva ${b}.`, pregunta: "¿Cuántos vasos se llenan?" },
  { e: MASA_KG_G, frase: (a, b) => `Un saco contiene ${a} de arroz y se reparte en bolsas de ${b}.`, facil: (a, b) => `Un saco tiene ${a} de arroz. Cada bolsa lleva ${b}.`, pregunta: "¿Cuántas bolsas se llenan?" },
  { e: LONGITUD_M_CM, frase: (a, b) => `Una cuerda mide ${a} y se corta en trozos de ${b}.`, facil: (a, b) => `Una cuerda mide ${a}. Cada trozo mide ${b}.`, pregunta: "¿Cuántos trozos salen?" },
];

const cuantosCaben: Plantilla = (rng, d) => {
  const r = elegir(rng, REPARTOS);
  const { e } = r;
  const trozo = e.factor === 100 ? elegir(rng, porNivel(d, [50, 25], [20, 10], [15, 12, 75])) : elegir(rng, porNivel(d, [500, 250], [200, 100], [150, 120, 750]));
  const n = entero(rng, 4, 12);
  const total = n * trozo;
  const a = `${enGrande(total, e)} ${e.g}`;
  const b = `${trozo} ${e.p}`;
  return {
    enunciado: `${r.frase(a, b)} ${r.pregunta}`,
    enunciadoFacil: `${r.facil(a, b)} ${r.pregunta}`,
    respuesta: numero(n),
    pista: `Pasa todo a ${e.pequena} y divide.`,
    explicacion: `${a} son ${total} ${e.p}, y ${total} ÷ ${trozo} = ${n}.`,
  };
};

const pesoDeVarios: Plantilla = (rng, d) => {
  const c = elegir(rng, [
    { e: MASA_KG_G, frase: (a: string, n: number) => `Cada saco pesa ${a}. ¿Cuántos gramos pesan ${n} sacos juntos?` },
    { e: CAPACIDAD_L_ML, frase: (a: string, n: number) => `Cada botella contiene ${a} de agua. ¿Cuántos mililitros hay en ${n} botellas?` },
    { e: LONGITUD_M_CM, frase: (a: string, n: number) => `Cada cuerda mide ${a}. ¿Cuántos centímetros miden ${n} cuerdas puestas una detrás de otra?` },
  ]);
  const { e } = c;
  const unidad = entero(rng, 1, 4) * e.factor + porNivel(d, 0, e.factor / 2, e.factor / 4);
  const n = entero(rng, 3, 9);
  const a = `${enGrande(unidad, e)} ${e.g}`;
  return {
    enunciado: c.frase(a, n),
    enunciadoFacil: c.frase(a, n),
    respuesta: numero(unidad * n),
    pista: `Pasa una unidad a ${e.pequena} y multiplica.`,
    explicacion: `${a} son ${unidad} ${e.p}, y ${unidad} × ${n} = ${unidad * n}.`,
  };
};

// ---------- NUM6-T4-b: tiempo ----------
const horasAMinutos: Plantilla = (rng, d) => {
  const h = entero(rng, 2, 9);
  if (d === 1) {
    return {
      enunciado: `¿Cuántos minutos son ${h} horas?`,
      enunciadoFacil: `Tienes ${h} horas. ¿Cuántos minutos son?`,
      respuesta: numero(h * 60),
      pista: "Una hora tiene 60 minutos.",
      explicacion: `${h} × 60 = ${h * 60}.`,
    };
  }
  if (d === 2) {
    const m = entero(rng, 1, 11) * 5;
    return {
      enunciado: `¿Cuántos minutos son ${h} horas y ${m} minutos?`,
      enunciadoFacil: `Tienes ${h} horas y ${m} minutos. ¿Cuántos minutos son en total?`,
      respuesta: numero(h * 60 + m),
      pista: "Pasa las horas a minutos y suma el resto.",
      explicacion: `${h} × 60 = ${h * 60}, y ${h * 60} + ${m} = ${h * 60 + m}.`,
    };
  }
  const [texto, minutos] = elegir<readonly [string, number]>(rng, [[`${h},5`, h * 60 + 30], [`${h},25`, h * 60 + 15], [`${h},75`, h * 60 + 45]]);
  return {
    enunciado: `¿Cuántos minutos son ${texto} horas?`,
    enunciadoFacil: `Tienes ${texto} horas. ¿Cuántos minutos son?`,
    respuesta: numero(minutos),
    pista: "0,5 horas es media hora. 0,25 horas es un cuarto de hora.",
    explicacion: `Las ${h} horas son ${h * 60} minutos, y la parte decimal son ${minutos - h * 60} minutos más: ${minutos}.`,
  };
};

const minutosAHoras: Plantilla = (rng, d) => {
  const total = porNivel(d, entero(rng, 2, 9) * 60 + 30, entero(rng, 1, 4) * 60 + entero(rng, 1, 11) * 5, entero(rng, 5, 12) * 60 + entero(rng, 1, 59));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const comoCentena = Math.floor(total / 100) * 60 + (total % 100);
  const candidatos = [(h + 1) * 60 + m, (h - 1) * 60 + m, h * 60 + ((m + 10) % 60), comoCentena];
  return {
    enunciado: `¿Cuántas horas y minutos son ${total} minutos?`,
    enunciadoFacil: `Tienes ${total} minutos. ¿Cuántas horas y minutos son?`,
    respuesta: opcionesNumero(rng, total, candidatos, duracion, 10),
    pista: "Busca cuántas veces caben 60 minutos. Lo que sobra son los minutos.",
    explicacion: `${h} × 60 = ${h * 60}, y sobran ${total} − ${h * 60} = ${m}.`,
  };
};

const cuantoDuraElViaje: Plantilla = (rng, d) => {
  const inicio = entero(rng, 7, 13) * 60 + entero(rng, 1, 11) * 5;
  const dura = porNivel(d, entero(rng, 3, 11) * 5, entero(rng, 13, 23) * 5, entero(rng, 25, 60) * 5);
  const fin = inicio + dura;
  return {
    enunciado: "Mira el horario del autobús. ¿Cuántos minutos dura el viaje?",
    enunciadoFacil: "Mira el horario. ¿Cuántos minutos dura el viaje?",
    imagen: { tipo: "cartel", estilo: "horario", titulo: "Autobús", lineas: [`Salida: ${hora(inicio)}`, `Llegada: ${hora(fin)}`] },
    respuesta: numero(dura),
    pista: "Cuenta desde la salida hasta la siguiente hora en punto, y sigue hasta la llegada.",
    explicacion: `De ${hora(inicio)} a ${hora(fin)} pasan ${dura} minutos.`,
  };
};

const horaDeFin: Plantilla = (rng, d) => {
  const n = nombre(rng);
  const inicio = entero(rng, 7, 13) * 60 + entero(rng, 1, 11) * 5;
  const dura = porNivel(d, entero(rng, 2, 8) * 5, entero(rng, 13, 23) * 5, entero(rng, 25, 50) * 5);
  const fin = inicio + dura;
  return {
    enunciado: `${n} empieza una tarea a las ${hora(inicio)} y tarda ${duracion(dura)}. ¿A qué hora termina?`,
    enunciadoFacil: `${n} empieza a las ${hora(inicio)}. Tarda ${duracion(dura)}. ¿A qué hora termina?`,
    respuesta: opcionesNumero(rng, fin, [fin + 60, fin - 60, fin + 10, fin - 10, fin + 40], hora, 5),
    pista: "Suma primero las horas y después los minutos. Recuerda que 60 minutos son una hora.",
    explicacion: `Si a las ${hora(inicio)} le sumamos ${duracion(dura)}, llegamos a las ${hora(fin)}.`,
  };
};

interface Pareja {
  readonly grande: string;
  readonly pequena: string;
  readonly factor: number;
}

const PAREJAS: readonly Pareja[] = [
  { grande: "semanas", pequena: "días", factor: 7 },
  { grande: "días", pequena: "horas", factor: 24 },
  { grande: "años", pequena: "meses", factor: 12 },
  { grande: "minutos", pequena: "segundos", factor: 60 },
];

const unidadesDeTiempo: Plantilla = (rng, d) => {
  const k = entero(rng, 2, 9);
  if (d === 3) {
    const [texto, de, a, factor] = elegir<readonly [string, string, string, number]>(rng, [
      ["1 día tiene 24 horas y 1 hora tiene 60 minutos", "días", "minutos", 1440],
      ["1 semana tiene 7 días y 1 día tiene 24 horas", "semanas", "horas", 168],
      ["1 hora tiene 60 minutos y 1 minuto tiene 60 segundos", "horas", "segundos", 3600],
    ]);
    return {
      enunciado: `Sabes que ${texto}. ¿${cuantos(a)} son ${k} ${de}?`,
      enunciadoFacil: `Sabes que ${texto}. ¿${cuantos(a)} son ${k} ${de}?`,
      respuesta: numero(k * factor),
      pista: "Haz el cambio en dos pasos.",
      explicacion: `Cada unidad equivale a ${factor} ${a}, y ${k} × ${factor} = ${k * factor}.`,
    };
  }
  const p = elegir(rng, PAREJAS);
  if (d === 1) {
    return {
      enunciado: `¿${cuantos(p.pequena)} son ${k} ${p.grande}?`,
      enunciadoFacil: `Tienes ${k} ${p.grande}. ¿${cuantos(p.pequena)} son?`,
      respuesta: numero(k * p.factor),
      pista: "Piensa cuántas unidades pequeñas caben en una grande.",
      explicacion: `${k} × ${p.factor} = ${k * p.factor}.`,
    };
  }
  const r = entero(rng, 2, p.factor - 1);
  return {
    enunciado: `¿${cuantos(p.pequena)} son ${k} ${p.grande} y ${r} ${p.pequena}?`,
    enunciadoFacil: `Tienes ${k} ${p.grande} y ${r} ${p.pequena}. ¿${cuantos(p.pequena)} son en total?`,
    respuesta: numero(k * p.factor + r),
    pista: "Pasa la unidad grande a la pequeña y suma el resto.",
    explicacion: `${k} × ${p.factor} = ${k * p.factor}, y ${k * p.factor} + ${r} = ${k * p.factor + r}.`,
  };
};

// ---------- NUM6-T4-c: área ----------
const areaConDecimales: Plantilla = (rng, d) => {
  const [a, b] = porNivel<readonly [number, number]>(d,
    [entero(rng, 6, 20) * 100, entero(rng, 3, 9) * 100],
    [entero(rng, 2, 9) * 100 + 50, entero(rng, 1, 5) * 200],
    [entero(rng, 1, 6) * 100 + 50, entero(rng, 1, 4) * 100 + 50]);
  const area = (a * b) / 100;
  return {
    enunciado: "Mira el rectángulo. ¿Cuántos metros cuadrados tiene de área?",
    enunciadoFacil: "Mira el rectángulo. Multiplica sus dos lados. ¿Cuántos metros cuadrados son?",
    imagen: { tipo: "rectangulo", ancho: a / 100, alto: b / 100, unidad: "m" },
    respuesta: numero(conComa(area)),
    pista: "Multiplica el largo por el ancho.",
    explicacion: `${conComa(a)} × ${conComa(b)} = ${conComa(area)}.`,
  };
};

const areaDelTriangulo: Plantilla = (rng, d) => {
  const base = porNivel(d, entero(rng, 2, 6) * 2, entero(rng, 6, 15) * 2, entero(rng, 3, 12) * 2 + 1);
  const altura = porNivel(d, entero(rng, 2, 9), entero(rng, 5, 15), entero(rng, 2, 7) * 2 + 1);
  const area = base * altura * 50;
  return {
    enunciado: `Un triángulo tiene ${base} cm de base y ${altura} cm de altura. ¿Cuántos centímetros cuadrados tiene de área?`,
    enunciadoFacil: `La base de un triángulo mide ${base} cm. Su altura mide ${altura} cm. ¿Cuántos centímetros cuadrados tiene?`,
    respuesta: opcionesNumero(rng, area, [base * altura * 100, (base + altura) * 100, (base + altura) * 200], (v) => `${conComa(v)} cm²`, 100),
    pista: "Multiplica la base por la altura y calcula la mitad.",
    explicacion: `${base} × ${altura} = ${base * altura}, y la mitad es ${conComa(area)}.`,
  };
};

const figuraCompuesta: Plantilla = (rng, d) => {
  const [a, b] = [entero(rng, 5, 12), entero(rng, 3, 8)];
  const [c, e] = [entero(rng, 2, 6), entero(rng, 2, 5)];
  if (d === 3) {
    const l = entero(rng, 2, 3);
    return {
      enunciado: `Un patio rectangular mide ${a + 4} m de largo y ${b + 4} m de ancho. En el centro hay un pozo con una base cuadrada de ${l} m de lado. ¿Cuántos metros cuadrados del patio quedan libres?`,
      enunciadoFacil: `Un patio rectangular mide ${a + 4} m de largo y ${b + 4} m de ancho. Dentro hay un cuadrado de ${l} m de lado. ¿Cuántos metros cuadrados quedan libres?`,
      respuesta: numero((a + 4) * (b + 4) - l * l),
      pista: "Calcula el área del patio y quita el área del cuadrado.",
      explicacion: `${a + 4} × ${b + 4} = ${(a + 4) * (b + 4)}, ${l} × ${l} = ${l * l}, y la resta da ${(a + 4) * (b + 4) - l * l}.`,
    };
  }
  const [x, y] = d === 1 ? [a, b] : [a + 10, b + 5];
  return {
    enunciado: `Una figura está formada por dos rectángulos que no se tapan. Uno mide ${x} cm por ${y} cm y el otro mide ${c} cm por ${e} cm. ¿Cuántos centímetros cuadrados tiene la figura?`,
    enunciadoFacil: `Una figura tiene dos rectángulos. No se tapan. Uno mide ${x} cm por ${y} cm. El otro mide ${c} cm por ${e} cm. ¿Cuántos centímetros cuadrados tiene?`,
    respuesta: numero(x * y + c * e),
    pista: "Calcula el área de cada rectángulo y suma.",
    explicacion: `${x} × ${y} = ${x * y}, ${c} × ${e} = ${c * e}, y la suma es ${x * y + c * e}.`,
  };
};

const baldosasDelSuelo: Plantilla = (rng, d) => {
  const [l, a] = [entero(rng, 3, 9), entero(rng, 2, 6)];
  const lado = porNivel(d, 100, 50, elegir(rng, [20, 25]));
  const porMetro = (100 / lado) ** 2;
  return {
    enunciado: `El suelo de una sala mide ${l} m de largo y ${a} m de ancho. Se cubre con baldosas cuadradas de ${lado} cm de lado. ¿Cuántas baldosas hacen falta?`,
    enunciadoFacil: `Una sala mide ${l} m de largo y ${a} m de ancho. Las baldosas son cuadradas. Cada lado mide ${lado} cm. ¿Cuántas baldosas hacen falta?`,
    respuesta: numero(l * a * porMetro),
    pista: "Piensa cuántas baldosas caben a lo largo y cuántas a lo ancho.",
    explicacion: `A lo largo caben ${(l * 100) / lado} y a lo ancho, ${(a * 100) / lado}. Son ${(l * 100) / lado} × ${(a * 100) / lado} = ${l * a * porMetro}.`,
  };
};

const costePorMetro: Plantilla = (rng, d) => {
  const [l, a] = [entero(rng, 3, 12), entero(rng, 2, 5)];
  const precio = porNivel(d, entero(rng, 2, 6) * 100, entero(rng, 3, 9) * 100, entero(rng, 1, 4) * 100 + 50);
  const paredes = d === 2 ? 2 : 1;
  const area = l * a * paredes;
  const frase = paredes === 2 ? `Hay que pintar 2 paredes iguales de ${l} m de largo y ${a} m de alto` : `Hay que pintar una pared de ${l} m de largo y ${a} m de alto`;
  return {
    enunciado: `${frase}. Pintar cada metro cuadrado cuesta ${dinero(precio)}. ¿Cuántas monedas cuesta en total?`,
    enunciadoFacil: `${frase}. Cada metro cuadrado cuesta ${dinero(precio)}. ¿Cuántas monedas cuesta en total?`,
    respuesta: numero(conComa(area * precio)),
    pista: "Calcula el área y multiplica por el precio de un metro cuadrado.",
    explicacion: `El área es ${area} m², y ${area} × ${conComa(precio)} = ${conComa(area * precio)}.`,
  };
};

const ladoDesdeArea: Plantilla = (rng, d) => {
  if (d === 3) {
    const base = entero(rng, 3, 12) * 2;
    const altura = entero(rng, 3, 15);
    const area = (base * altura) / 2;
    return {
      enunciado: `Un triángulo tiene ${area} cm² de área y ${base} cm de base. ¿Cuántos centímetros mide su altura?`,
      enunciadoFacil: `El área de un triángulo es ${area} cm². Su base mide ${base} cm. ¿Cuántos centímetros mide su altura?`,
      respuesta: numero(altura),
      pista: "Base por altura da el doble del área.",
      explicacion: `El doble del área es ${area * 2}, y ${area * 2} ÷ ${base} = ${altura}.`,
    };
  }
  const ancho = entero(rng, 3, 9);
  const largo = d === 1 ? entero(rng, 4, 10) : entero(rng, 11, 25);
  return {
    enunciado: `Un rectángulo tiene ${ancho * largo} m² de área y ${ancho} m de ancho. ¿Cuántos metros mide de largo?`,
    enunciadoFacil: `El área de un rectángulo es ${ancho * largo} m². Su ancho mide ${ancho} m. ¿Cuántos metros mide de largo?`,
    respuesta: numero(largo),
    pista: "Divide el área entre el lado que conoces.",
    explicacion: `${ancho * largo} ÷ ${ancho} = ${largo}.`,
  };
};

// ---------- NUM6-T5-a: media ----------
// Lista cuya media es un entero (dificultades 1 y 2) o un decimal exacto (3).
function datosParaMedia(rng: Rng, d: Dificultad): { valores: number[]; media: number } {
  const n = porNivel(d, 3, elegir(rng, [4, 5]), elegir(rng, [4, 5]));
  if (d === 3) {
    const valores = Array.from({ length: n }, () => entero(rng, 5, 40));
    const suma = valores.reduce((s, v) => s + v, 0);
    return { valores, media: (suma * 100) / n };
  }
  const m = entero(rng, 13, porNivel(d, 18, 30, 30));
  const valores = Array.from({ length: n - 1 }, () => entero(rng, m - 3, m + 3));
  const ultimo = n * m - valores.reduce((s, v) => s + v, 0);
  return { valores: barajar(rng, [...valores, ultimo]), media: m * 100 };
}

function lista(valores: readonly (number | string)[]): string {
  return `${valores.slice(0, -1).join(", ")} y ${valores[valores.length - 1] ?? ""}`;
}

const mediaDeNumeros: Plantilla = (rng, d) => {
  const { valores, media } = datosParaMedia(rng, d);
  const suma = valores.reduce((s, v) => s + v, 0);
  return {
    enunciado: `¿Cuál es la media de ${lista(valores)}?`,
    enunciadoFacil: `Calcula la media de ${lista(valores)}.`,
    respuesta: numero(conComa(media)),
    pista: "Suma todos los números y divide entre cuántos hay.",
    explicacion: `La suma es ${suma}, y ${suma} ÷ ${valores.length} = ${conComa(media)}.`,
  };
};

const mediaDelGrafico: Plantilla = (rng, d) => {
  const { valores, media } = datosParaMedia(rng, d);
  const etiquetas = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].slice(0, valores.length);
  const suma = valores.reduce((s, v) => s + v, 0);
  return {
    enunciado: "El gráfico muestra los cubos de agua que se sacaron del pozo cada día. ¿Cuál es la media de cubos por día?",
    enunciadoFacil: "Mira el gráfico. Suma los cubos. Divide entre los días. ¿Cuál es la media?",
    imagen: { tipo: "barras", titulo: "Cubos de agua", etiquetas, valores },
    respuesta: numero(conComa(media)),
    pista: "Lee cada barra, suma y divide entre el número de días.",
    explicacion: `La suma es ${valores.join(" + ")} = ${suma}, y ${suma} ÷ ${valores.length} = ${conComa(media)}.`,
  };
};

const numeroQueFalta: Plantilla = (rng, d) => {
  const n = porNivel(d, 3, 4, 5);
  const m = entero(rng, 13, 20);
  const conocidos = Array.from({ length: n - 1 }, () => entero(rng, m - 3, m + 3));
  const falta = n * m - conocidos.reduce((s, v) => s + v, 0);
  return {
    enunciado: `La media de ${n} números es ${m}. Ya conoces estos: ${lista(conocidos)}. ¿Cuál es el número que falta?`,
    enunciadoFacil: `Hay ${n} números. Su media es ${m}. Conoces estos: ${lista(conocidos)}. ¿Qué número falta?`,
    respuesta: numero(falta),
    pista: "Multiplica la media por la cantidad de números: así sabes cuánto suman todos.",
    explicacion: `Entre todos suman ${n} × ${m} = ${n * m}. Los conocidos suman ${n * m - falta}, así que falta ${falta}.`,
  };
};

const repartirPorIgual: Plantilla = (rng, d) => {
  const { valores, media } = datosParaMedia(rng, d === 3 ? 2 : d);
  const quienes = nombres(rng, valores.length);
  const frases = valores.map((v, i) => `${quienes[i] ?? ""} tiene ${dinero(v * 100)}`);
  const suma = valores.reduce((s, v) => s + v, 0);
  return {
    enunciado: `${frases.slice(0, -1).join(", ")} y ${frases[frases.length - 1] ?? ""}. Juntan todo y lo reparten por igual. ¿Cuántas monedas recibe cada persona?`,
    enunciadoFacil: `${frases.join(". ")}. Juntan todo. Lo reparten por igual. ¿Cuántas monedas recibe cada persona?`,
    respuesta: opcionesNumero(rng, media / 100, [suma, Math.max(...valores), Math.min(...valores), media / 100 + 2], String),
    pista: "Repartir por igual es calcular la media.",
    explicacion: `Juntan ${suma}, y ${suma} ÷ ${valores.length} = ${conComa(media)}.`,
  };
};

// ---------- NUM6-T5-b: leer gráficos ----------
const TEMAS_GRAFICO = [
  { titulo: "Libros prestados", cosa: "libros", prestar: "se prestaron" },
  { titulo: "Huevos recogidos", cosa: "huevos", prestar: "se recogieron" },
  { titulo: "Cubos de agua", cosa: "cubos", prestar: "se llenaron" },
] as const;

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] as const;

function grafico(rng: Rng, n: number, paso: number): { titulo: string; cosa: string; prestar: string; etiquetas: string[]; valores: number[] } {
  const t = elegir(rng, TEMAS_GRAFICO);
  return { ...t, etiquetas: DIAS.slice(0, n), valores: muestra(rng, rango(2, 14), n).map((v) => v * paso) };
}

const leerElGrafico: Plantilla = (rng, d) => {
  const g = grafico(rng, porNivel(d, 4, 4, 5), porNivel(d, 1, 5, 5));
  const imagen = { tipo: "barras" as const, titulo: g.titulo, etiquetas: g.etiquetas, valores: g.valores };
  const i = entero(rng, 0, g.etiquetas.length - 1);
  if (d === 1) {
    const dia = (g.etiquetas[i] ?? "").toLowerCase();
    return {
      enunciado: `Mira el gráfico. ¿Cuántos ${g.cosa} ${g.prestar} el ${dia}?`,
      enunciadoFacil: `Mira el gráfico. ¿Cuántos ${g.cosa} ${g.prestar} el ${dia}?`,
      imagen,
      respuesta: numero(g.valores[i] ?? 0),
      pista: "Busca la barra de ese día y mira hasta dónde llega.",
      explicacion: `La barra del ${dia} llega hasta ${g.valores[i] ?? 0}.`,
    };
  }
  const ordenados = [...g.valores].sort((a, b) => b - a);
  const objetivo = d === 2 ? ordenados[0] ?? 0 : ordenados[1] ?? 0;
  const correcta = g.etiquetas[g.valores.indexOf(objetivo)] ?? "";
  const otras = g.etiquetas.filter((e) => e !== correcta).slice(0, 3);
  return {
    enunciado: d === 2 ? `Mira el gráfico. ¿Qué día ${g.prestar} más ${g.cosa}?` : `Mira el gráfico. ¿Qué día quedó en segundo lugar, justo por detrás del día con más ${g.cosa}?`,
    enunciadoFacil: d === 2 ? `Mira el gráfico. ¿Qué día tiene la barra más alta?` : `Mira el gráfico. ¿Qué día tiene la segunda barra más alta?`,
    imagen,
    respuesta: opciones(correcta, otras),
    pista: "Compara la altura de las barras.",
    explicacion: `La barra del ${correcta.toLowerCase()} llega hasta ${objetivo}${d === 3 ? `, y solo la supera la que llega hasta ${ordenados[0] ?? 0}` : ", y es la más alta"}.`,
  };
};

const diferenciaEnElGrafico: Plantilla = (rng, d) => {
  const g = grafico(rng, porNivel(d, 4, 4, 5), porNivel(d, 1, 5, 5));
  const imagen = { tipo: "barras" as const, titulo: g.titulo, etiquetas: g.etiquetas, valores: g.valores };
  if (d === 3) {
    const [i, j, k] = trio(rng, rango(0, g.etiquetas.length - 1));
    const [a, b, c] = [g.valores[i] ?? 0, g.valores[j] ?? 0, g.valores[k] ?? 0];
    const [di, dj, dk] = [g.etiquetas[i] ?? "", g.etiquetas[j] ?? "", g.etiquetas[k] ?? ""].map((t) => t.toLowerCase());
    const dif = Math.abs(a + b - c);
    return {
      enunciado: `Mira el gráfico. ¿Cuál es la diferencia entre los ${g.cosa} del ${di} y el ${dj} juntos y los ${g.cosa} del ${dk}?`,
      enunciadoFacil: `Mira el gráfico. Suma ${di} y ${dj}. Compara con ${dk}. ¿Cuál es la diferencia?`,
      imagen,
      respuesta: numero(dif),
      pista: "Suma las dos primeras barras. Después compara con la tercera.",
      explicacion: `${a} + ${b} = ${a + b}, y la diferencia con ${c} es ${dif}.`,
    };
  }
  const [i, j] = par(rng, rango(0, g.etiquetas.length - 1));
  const [a, b] = [g.valores[i] ?? 0, g.valores[j] ?? 0];
  const [di, dj] = [g.etiquetas[i] ?? "", g.etiquetas[j] ?? ""].map((t) => t.toLowerCase());
  return {
    enunciado: `Mira el gráfico. ¿Cuál es la diferencia de ${g.cosa} entre el ${di} y el ${dj}?`,
    enunciadoFacil: `Mira el gráfico. Compara ${di} y ${dj}. ¿Cuál es la diferencia?`,
    imagen,
    respuesta: numero(Math.abs(a - b)),
    pista: "Lee las dos barras y resta la menor a la mayor.",
    explicacion: `La diferencia entre ${Math.max(a, b)} y ${Math.min(a, b)} es ${Math.abs(a - b)}.`,
  };
};

const totalDelGrafico: Plantilla = (rng, d) => {
  const g = grafico(rng, porNivel(d, 3, 4, 5), porNivel(d, 1, 5, 5));
  const total = g.valores.reduce((s, v) => s + v, 0);
  return {
    enunciado: `Mira el gráfico. ¿Cuántos ${g.cosa} ${g.prestar} en total esos días?`,
    enunciadoFacil: `Mira el gráfico. Suma todas las barras. ¿Cuántos ${g.cosa} son?`,
    imagen: { tipo: "barras", titulo: g.titulo, etiquetas: g.etiquetas, valores: g.valores },
    respuesta: opcionesNumero(rng, total, [total + (g.valores[0] ?? 0), total - (g.valores[0] ?? 0), Math.max(...g.valores), total + 10], String, 5),
    pista: "Lee todas las barras y súmalas.",
    explicacion: `${g.valores.join(" + ")} = ${total}.`,
  };
};

// Cuatro partes distintas, múltiplos de 5, que suman 100: cada valor es ya un porcentaje.
const REPARTOS_100: readonly (readonly number[])[] = [[10, 20, 30, 40], [5, 15, 35, 45], [10, 15, 25, 50], [5, 20, 30, 45], [15, 20, 25, 40], [5, 10, 40, 45], [10, 15, 30, 45], [5, 25, 30, 40]];

const porcentajeDelGrafico: Plantilla = (rng, d) => {
  const escala = porNivel(d, 1, 2, 4);
  const partes = barajar(rng, elegir(rng, REPARTOS_100));
  const valores = partes.map((p) => p * escala);
  const etiquetas = ["Lunes", "Martes", "Miércoles", "Jueves"];
  const i = entero(rng, 0, 3);
  const dia = (etiquetas[i] ?? "").toLowerCase();
  const p = partes[i] ?? 0;
  const total = 100 * escala;
  return {
    enunciado: `Mira el gráfico. El total de los cuatro días es ${total}. ¿Qué porcentaje del total corresponde al ${dia}?`,
    enunciadoFacil: `Mira el gráfico. El total es ${total}. ¿Qué porcentaje es el ${dia}?`,
    imagen: { tipo: "barras", titulo: "Visitas a la biblioteca", etiquetas, valores },
    respuesta: opcionesNumero(rng, p, [valores[i] ?? 0, 100 - p, p + 5, p + 10, 25], (v) => `${v} %`, 5),
    pista: "Divide el valor de la barra entre el total y multiplica por 100.",
    explicacion: `${valores[i] ?? 0} de ${total} es lo mismo que ${p} de cada 100: el ${p} %.`,
  };
};

// ---------- NUM6-T5-c: seguro, posible o imposible ----------
const SEGURO = "Seguro";
const POSIBLE = "Posible";
const IMPOSIBLE = "Imposible";
const TRES = [SEGURO, POSIBLE, IMPOSIBLE];

function clasificar(casos: readonly boolean[]): string {
  return casos.every(Boolean) ? SEGURO : casos.some(Boolean) ? POSIBLE : IMPOSIBLE;
}

function razonDe(r: string, seguro: string, posible: string, imposible: string): string {
  return r === SEGURO ? seguro : r === POSIBLE ? posible : imposible;
}

const COLORES = [
  { singular: "roja", plural: "rojas" },
  { singular: "azul", plural: "azules" },
  { singular: "verde", plural: "verdes" },
  { singular: "amarilla", plural: "amarillas" },
  { singular: "negra", plural: "negras" },
] as const;

const bolasEnLaBolsa: Plantilla = (rng, d) => {
  const [c1, c2, c3] = trio(rng, COLORES);
  const [a, b] = [entero(rng, 2, 7), entero(rng, 2, 7)];
  const pregunta = "¿Cómo es ese suceso: seguro, posible o imposible?";
  if (d === 3) {
    const unaSola = rng() < 0.5;
    const azules = unaSola ? 1 : b;
    const bolas = [...Array.from({ length: a }, () => "x"), ...Array.from({ length: azules }, () => "y")];
    const parejas = bolas.flatMap((p, i) => bolas.slice(i + 1).map((q) => [p, q] as const));
    const dosIguales = rng() < 0.5;
    const suceso = dosIguales ? `las dos bolas sean ${c2.plural}` : `al menos una bola sea ${c1.singular}`;
    const r = clasificar(parejas.map(([p, q]) => (dosIguales ? p === "y" && q === "y" : p === "x" || q === "x")));
    const dentro = `${a} bolas ${c1.plural} y ${azules === 1 ? `1 bola ${c2.singular}` : `${azules} bolas ${c2.plural}`}`;
    return {
      enunciado: `En una bolsa hay ${dentro}. Sacas dos bolas a la vez sin mirar. Piensa en que ${suceso}. ${pregunta}`,
      enunciadoFacil: `En una bolsa hay ${dentro}. Sacas dos bolas a la vez. Piensa en que ${suceso}. ¿Es seguro, posible o imposible?`,
      respuesta: opciones(r, TRES.filter((t) => t !== r)),
      pista: "Imagina todas las parejas de bolas que pueden salir.",
      explicacion: razonDe(r, "Pase lo que pase, en todas las parejas se cumple.", "Se cumple en algunas parejas, pero no en todas.", "No hay ninguna pareja en la que se cumpla."),
    };
  }
  const tipo = elegir(rng, [SEGURO, POSIBLE, IMPOSIBLE]);
  if (d === 1) {
    const dentro = tipo === SEGURO ? `${a} bolas ${c1.plural}` : `${a} bolas ${c1.plural} y ${b} bolas ${c2.plural}`;
    const color = tipo === IMPOSIBLE ? c3 : c1;
    return {
      enunciado: `En una bolsa hay ${dentro}. Sacas una bola sin mirar. Piensa en que salga una bola ${color.singular}. ${pregunta}`,
      enunciadoFacil: `En una bolsa hay ${dentro}. Sacas una bola. Piensa en que salga ${color.singular}. ¿Es seguro, posible o imposible?`,
      respuesta: opciones(tipo, TRES.filter((t) => t !== tipo)),
      pista: "Mira qué bolas hay dentro de la bolsa.",
      explicacion: razonDe(tipo, `Todas las bolas son ${c1.plural}.`, `Hay bolas ${color.plural}, pero también de otro color.`, `No hay ninguna bola ${color.singular} en la bolsa.`),
    };
  }
  const c = entero(rng, 2, 7);
  const dentro = `${a} bolas ${c1.plural}, ${b} bolas ${c2.plural} y ${c} bolas ${c3.plural}`;
  const [suceso, r] = elegir<readonly [string, string]>(rng, [
    [`salga una bola ${c1.singular}, ${c2.singular} o ${c3.singular}`, SEGURO],
    [`no salga una bola ${COLORES.find((x) => x !== c1 && x !== c2 && x !== c3)?.singular ?? ""}`, SEGURO],
    [`salga una bola ${c1.singular} o ${c2.singular}`, POSIBLE],
    [`no salga una bola ${c3.singular}`, POSIBLE],
    [`salga una bola ${COLORES.find((x) => x !== c1 && x !== c2 && x !== c3)?.singular ?? ""}`, IMPOSIBLE],
  ]);
  return {
    enunciado: `En una bolsa hay ${dentro}. Sacas una bola sin mirar. Piensa en que ${suceso}. ${pregunta}`,
    enunciadoFacil: `En una bolsa hay ${dentro}. Sacas una bola. Piensa en que ${suceso}. ¿Es seguro, posible o imposible?`,
    respuesta: opciones(r, TRES.filter((t) => t !== r)),
    pista: "Comprueba qué pasa con cada color de la bolsa.",
    explicacion: razonDe(r, "Con cualquier bola de la bolsa se cumple.", "Se cumple con algunas bolas, pero no con todas.", "No se cumple con ninguna bola de la bolsa."),
  };
};

interface Condicion {
  readonly texto: string;
  readonly f: (n: number) => boolean;
}

function condiciones(tope: number): Condicion[] {
  const salida: Condicion[] = [{ texto: "un número par", f: (n) => n % 2 === 0 }, { texto: "un número impar", f: (n) => n % 2 === 1 }];
  for (const k of rango(1, tope)) {
    salida.push({ texto: `un número mayor que ${k}`, f: (n) => n > k }, { texto: `un número menor que ${k}`, f: (n) => n < k });
  }
  return salida;
}

const lanzarUnDado: Plantilla = (rng, d) => {
  const caras = rango(1, 6);
  const intro = "Lanzas un dado normal, con caras del 1 al 6.";
  if (d === 3) {
    const sumas = caras.flatMap((a) => caras.map((b) => a + b));
    const k = entero(rng, 1, 14);
    const c = elegir<Condicion>(rng, [
      { texto: `sea igual a ${k}`, f: (n) => n === k },
      { texto: `sea mayor que ${k}`, f: (n) => n > k },
      { texto: `sea menor que ${k}`, f: (n) => n < k },
    ]);
    const r = clasificar(sumas.map(c.f));
    return {
      enunciado: `Lanzas dos dados normales, con caras del 1 al 6, y sumas los puntos. Piensa en que la suma ${c.texto}. ¿Cómo es ese suceso: seguro, posible o imposible?`,
      enunciadoFacil: `Lanzas dos dados, con caras del 1 al 6. Sumas los puntos. Piensa en que la suma ${c.texto}. ¿Es seguro, posible o imposible?`,
      respuesta: opciones(r, TRES.filter((t) => t !== r)),
      pista: "La suma más pequeña es 2 y la más grande es 12.",
      explicacion: razonDe(r, "Las sumas van del 2 al 12, y todas lo cumplen.", "Las sumas van del 2 al 12: algunas lo cumplen y otras no.", "Las sumas van del 2 al 12, y ninguna lo cumple."),
    };
  }
  const c = d === 1
    ? elegir<Condicion>(rng, rango(1, 8).map((k) => ({ texto: `un ${k}`, f: (n: number) => n === k })).concat([{ texto: "un número menor que 7", f: (n) => n < 7 }, { texto: "un número mayor que 0", f: (n) => n > 0 }]))
    : elegir(rng, condiciones(8));
  const r = clasificar(caras.map(c.f));
  return {
    enunciado: `${intro} Piensa en sacar ${c.texto}. ¿Cómo es ese suceso: seguro, posible o imposible?`,
    enunciadoFacil: `${intro} Piensa en sacar ${c.texto}. ¿Es seguro, posible o imposible?`,
    respuesta: opciones(r, TRES.filter((t) => t !== r)),
    pista: "Mira qué caras cumplen lo que se pide: todas, algunas o ninguna.",
    explicacion: razonDe(r, "Todas las caras del dado lo cumplen.", "Algunas caras lo cumplen y otras no.", "Ninguna cara del dado lo cumple."),
  };
};

const sacarUnaTarjeta: Plantilla = (rng, d) => {
  const inicio = entero(rng, 1, 5) * 2;
  const paso = elegir(rng, [2, 2, 3, 5]);
  const n = porNivel(d, 4, 5, 6);
  const tarjetas = rango(0, n - 1).map((i) => inicio + i * paso);
  const alto = tarjetas[n - 1] ?? 0;
  const c = d === 3
    ? (() => {
        const k = elegir(rng, [tarjetas[0] ?? 0, tarjetas[2] ?? 0, alto]);
        return elegir<Condicion>(rng, [
          { texto: `un número par mayor que ${k}`, f: (x) => x % 2 === 0 && x > k },
          { texto: `un número impar menor que ${k}`, f: (x) => x % 2 === 1 && x < k },
          { texto: `un número mayor que ${k} o igual a ${k}`, f: (x) => x >= k },
        ]);
      })()
    : elegir<Condicion>(rng, [
        { texto: "un número par", f: (x) => x % 2 === 0 },
        { texto: "un número impar", f: (x) => x % 2 === 1 },
        { texto: `un número mayor que ${alto}`, f: (x) => x > alto },
        { texto: `un número menor que ${alto + 1}`, f: (x) => x < alto + 1 },
        { texto: `un número mayor que ${tarjetas[1] ?? 0}`, f: (x) => x > (tarjetas[1] ?? 0) },
      ]);
  const r = clasificar(tarjetas.map(c.f));
  return {
    enunciado: `En una caja hay ${n} tarjetas con estos números: ${lista(tarjetas)}. Sacas una tarjeta sin mirar. Piensa en sacar ${c.texto}. ¿Cómo es ese suceso: seguro, posible o imposible?`,
    enunciadoFacil: `Hay ${n} tarjetas: ${lista(tarjetas)}. Sacas una. Piensa en sacar ${c.texto}. ¿Es seguro, posible o imposible?`,
    respuesta: opciones(r, TRES.filter((t) => t !== r)),
    pista: "Comprueba las tarjetas una por una.",
    explicacion: razonDe(r, "Todas las tarjetas lo cumplen.", "Algunas tarjetas lo cumplen y otras no.", "Ninguna tarjeta lo cumple."),
  };
};

const IMPOSIBLES: Readonly<Record<Dificultad, readonly string[]>> = {
  1: ["Sacar un 8", "Sacar un 0"],
  2: ["Sacar un número mayor que 6", "Sacar un número menor que 1"],
  3: ["Sacar un número par mayor que 6", "Sacar un número impar mayor que 5"],
};
const SEGUROS: Readonly<Record<Dificultad, readonly string[]>> = {
  1: ["Sacar un número menor que 7", "Sacar un número del 1 al 6"],
  2: ["Sacar un número mayor que 0", "Sacar un número par o impar"],
  3: ["Sacar un número distinto de 7", "Sacar un número menor que 10"],
};
const POSIBLES = ["Sacar un 2", "Sacar un 5", "Sacar un número par", "Sacar un número mayor que 3", "Sacar un número menor que 3"];

const elegirElSuceso: Plantilla = (rng, d) => {
  const buscaImposible = rng() < 0.5;
  const correcta = elegir(rng, buscaImposible ? IMPOSIBLES[d] : SEGUROS[d]);
  const palabra = buscaImposible ? "imposible" : "seguro";
  return {
    enunciado: `Lanzas un dado normal, con caras del 1 al 6. ¿Cuál de estos sucesos es ${palabra}?`,
    enunciadoFacil: `Lanzas un dado, con caras del 1 al 6. ¿Qué suceso es ${palabra}?`,
    respuesta: opciones(correcta, muestra(rng, POSIBLES, 3)),
    pista: "Comprueba cada frase con las caras 1, 2, 3, 4, 5 y 6.",
    explicacion: buscaImposible ? `«${correcta}» no se cumple con ninguna cara del dado.` : `«${correcta}» se cumple con todas las caras del dado.`,
  };
};

export const SEXTO_B: MapaGeneradores = {
  "NUM6-T4-a": generadores("NUM6-T4-a", [convertirMedidas, mayorMedida, cuantosCaben, pesoDeVarios]),
  "NUM6-T4-b": generadores("NUM6-T4-b", [horasAMinutos, minutosAHoras, cuantoDuraElViaje, horaDeFin, unidadesDeTiempo]),
  "NUM6-T4-c": generadores("NUM6-T4-c", [areaConDecimales, areaDelTriangulo, figuraCompuesta, baldosasDelSuelo, costePorMetro, ladoDesdeArea]),
  "NUM6-T5-a": generadores("NUM6-T5-a", [mediaDeNumeros, mediaDelGrafico, numeroQueFalta, repartirPorIgual]),
  "NUM6-T5-b": generadores("NUM6-T5-b", [leerElGrafico, diferenciaEnElGrafico, totalDelGrafico, porcentajeDelGrafico]),
  "NUM6-T5-c": generadores("NUM6-T5-c", [bolasEnLaBolsa, lanzarUnDado, sacarUnaTarjeta, elegirElSuceso]),
};
