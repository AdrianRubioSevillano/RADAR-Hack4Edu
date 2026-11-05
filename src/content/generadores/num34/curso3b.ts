// NUM 3.º, temas 4 y 5: medidas y compras.
// La palabra "peso" no se escribe: el arnés la rechaza porque también es una divisa.
import type { Rng } from "../../../core/rng.ts";
import { barajar, elegir, entero, monedas, muestra, nombre } from "../../ayuda.ts";
import type { Imagen, MapaGeneradores } from "../../tipos.ts";
import { ARTICULOS, en, gen, mayuscula, num, opc, par, pl, textos, tresNombres, trio, type Articulo } from "./comun.ts";

// ---------- T4-a Longitud ----------
function metrosYCm(cm: number): string {
  return `${Math.floor(cm / 100)} m y ${cm % 100} cm`;
}

const convertirLongitud = gen("NUM3-T4-a", (rng, d) => {
  if (d === 1) {
    const m = entero(rng, 2, 9);
    return {
      enunciado: `¿Cuántos centímetros son ${m} metros?`,
      enunciadoFacil: `Un metro tiene 100 centímetros. ¿Cuántos centímetros son ${m} metros?`,
      respuesta: opc(rng, m * 100, [m * 10, m * 1000, m + 100], 100),
      pista: "Recuerda cuántos centímetros tiene un metro.",
      explicacion: `Un metro tiene 100 cm, así que ${m} × 100 = ${m * 100} cm.`,
    };
  }
  if (d === 2) {
    const m = entero(rng, 1, 8);
    const cm = rng() < 0.4 ? entero(rng, 2, 9) : entero(rng, 11, 95);
    const r = m * 100 + cm;
    return {
      enunciado: `Una cuerda mide ${pl(m, "metro", "metros")} y ${cm} centímetros. ¿Cuántos centímetros mide en total?`,
      enunciadoFacil: `Una cuerda mide ${pl(m, "metro", "metros")} y ${cm} centímetros. ¿Cuántos centímetros son?`,
      respuesta: num(r),
      pista: "Pasa primero los metros a centímetros. Después suma.",
      explicacion: `${m} m son ${m * 100} cm, y ${m * 100} + ${cm} = ${r} cm.`,
    };
  }
  const m = entero(rng, 1, 9);
  const cm = entero(rng, 11, 95);
  const total = m * 100 + cm;
  const u = cm % 10;
  return {
    enunciado: `Una tabla mide ${total} cm. ¿Cuánto es eso en metros y centímetros?`,
    enunciadoFacil: `Una tabla mide ${total} cm. Pásalo a metros y centímetros.`,
    respuesta: textos(metrosYCm(total), [`${m * 10 + Math.floor(cm / 10)} m y ${u} cm`, `${m} m y ${Math.floor(cm / 10)} cm`, `${m + 1} m y ${cm} cm`]),
    pista: "Cada 100 cm forman un metro.",
    explicacion: `${total} cm son ${m * 100} cm más ${cm} cm. Eso es ${metrosYCm(total)}.`,
  };
});

const compararCuerdas = gen("NUM3-T4-a", (rng, d) => {
  const [a, b, c] = tresNombres(rng);
  const medidas = muestra(rng, [60, 80, 100, 120, 140, 160, 180, 200, 220, 240], 3).map((x) => x + (d === 1 ? 0 : 5 * entero(rng, 0, 3)));
  const textoMedida = (cm: number, i: number) => (d > 1 && i !== 1 && cm >= 100 ? (cm % 100 === 0 ? `${cm / 100} m` : metrosYCm(cm)) : `${cm} cm`);
  const gente = [a, b, c];
  const imagen: Imagen = { tipo: "tiras", tiras: gente.map((n, i) => ({ etiqueta: `Cuerda de ${n}: ${textoMedida(en(medidas, i), i)}`, largo: en(medidas, i) })) };
  if (d === 3) {
    const orden = [0, 1, 2].sort((x, y) => en(medidas, y) - en(medidas, x));
    const [i, j] = [en(orden, 0), en(orden, 2)];
    const r = en(medidas, i) - en(medidas, j);
    return {
      enunciado: `Mira las cuerdas. ¿Cuántos centímetros más mide la cuerda de ${en(gente, i)} que la de ${en(gente, j)}?`,
      enunciadoFacil: `Mira las cuerdas. Compara la de ${en(gente, i)} y la de ${en(gente, j)}. ¿Cuántos centímetros más mide la de ${en(gente, i)}?`,
      imagen,
      respuesta: num(r),
      pista: "Pasa las dos medidas a centímetros y resta.",
      explicacion: `${en(medidas, i)} − ${en(medidas, j)} = ${r} cm.`,
    };
  }
  const larga = d === 1;
  const objetivo = larga ? Math.max(...medidas) : Math.min(...medidas);
  const i = medidas.indexOf(objetivo);
  const quien = en(gente, i);
  const palabra = larga ? "larga" : "corta";
  return {
    enunciado: `Mira las cuerdas. ¿Cuál es la más ${palabra}?`,
    enunciadoFacil: `Mira las cuerdas. Lee sus medidas. ¿Cuál es la más ${palabra}?`,
    imagen,
    respuesta: textos(`Cuerda de ${quien}`, gente.filter((n) => n !== quien).map((n) => `Cuerda de ${n}`)),
    pista: d === 1 ? "Compara los números de las medidas." : "Pasa todas las medidas a centímetros.",
    explicacion: `La cuerda de ${quien} mide ${objetivo} cm, y es la más ${palabra} de las tres.`,
  };
});

const problemaLongitud = gen("NUM3-T4-a", (rng, d) => {
  const n = nombre(rng);
  if (d === 1) {
    const a = 10 * entero(rng, 10, 30);
    const b = 10 * entero(rng, 3, 9);
    const r = a + b;
    return {
      enunciado: `Una tabla mide ${a} cm y otra mide ${b} cm. ${n} las pone en línea, una detrás de otra. ¿Cuántos centímetros miden juntas?`,
      enunciadoFacil: `Una tabla mide ${a} cm. Otra mide ${b} cm. Se ponen en línea. ¿Cuántos centímetros miden juntas?`,
      respuesta: opc(rng, r, [a - b, r + 100, r - 10, r + 10], 10),
      pista: "Las dos medidas están en centímetros. Súmalas.",
      explicacion: `${a} + ${b} = ${r} cm.`,
    };
  }
  if (d === 2) {
    const m = entero(rng, 2, 5);
    const corte = 5 * entero(rng, 7, 19);
    const r = m * 100 - corte;
    return {
      enunciado: `${n} tiene una cuerda de ${m} metros y corta ${corte} centímetros. ¿Cuántos centímetros de cuerda le quedan?`,
      enunciadoFacil: `Una cuerda mide ${m} metros. ${n} corta ${corte} centímetros. ¿Cuántos centímetros quedan?`,
      respuesta: num(r),
      pista: "Pasa los metros a centímetros antes de restar.",
      explicacion: `${m} m son ${m * 100} cm, y ${m * 100} − ${corte} = ${r} cm.`,
    };
  }
  const veces = entero(rng, 3, 4);
  const tabla = 5 * entero(rng, 9, 15);
  const m = Math.floor((veces * tabla) / 100) + 1;
  const r = m * 100 - veces * tabla;
  return {
    enunciado: `Para una valla de ${m} metros, ${n} pone en línea ${veces} tablas de ${tabla} cm cada una. ¿Cuántos centímetros faltan para completar la valla?`,
    enunciadoFacil: `Una valla mide ${m} metros. ${n} pone ${veces} tablas en línea. Cada tabla mide ${tabla} cm. ¿Cuántos centímetros faltan?`,
    respuesta: num(r),
    pista: "Calcula cuánto miden las tablas juntas y compáralo con la valla en centímetros.",
    explicacion: `${veces} × ${tabla} = ${veces * tabla} cm, y ${m * 100} − ${veces * tabla} = ${r} cm.`,
  };
});

// ---------- T4-b Peso ----------
function kilosYGramos(g: number): string {
  return `${Math.floor(g / 1000)} kg y ${g % 1000} g`;
}

const convertirMasa = gen("NUM3-T4-b", (rng, d) => {
  if (d === 1) {
    const k = entero(rng, 2, 9);
    return {
      enunciado: `¿Cuántos gramos son ${k} kilos?`,
      enunciadoFacil: `Un kilo tiene 1000 gramos. ¿Cuántos gramos son ${k} kilos?`,
      respuesta: opc(rng, k * 1000, [k * 100, k * 10, k + 1000, k * 10000], 1000),
      pista: "Recuerda cuántos gramos tiene un kilo.",
      explicacion: `Un kilo tiene 1000 gramos, así que ${k} × 1000 = ${k * 1000} gramos.`,
    };
  }
  if (d === 2) {
    const k = entero(rng, 1, 8);
    const g = rng() < 0.4 ? 10 * entero(rng, 2, 9) : 50 * entero(rng, 3, 19);
    const r = k * 1000 + g;
    return {
      enunciado: `Una bolsa pesa ${pl(k, "kilo", "kilos")} y ${g} gramos. ¿Cuántos gramos pesa en total?`,
      enunciadoFacil: `Una bolsa pesa ${pl(k, "kilo", "kilos")} y ${g} gramos. ¿Cuántos gramos son?`,
      respuesta: num(r),
      pista: "Pasa primero los kilos a gramos. Después suma.",
      explicacion: `${k} kg son ${k * 1000} g, y ${k * 1000} + ${g} = ${r} g.`,
    };
  }
  const k = entero(rng, 1, 9);
  const c = entero(rng, 1, 9);
  const total = k * 1000 + c * 100;
  return {
    enunciado: `Un saco pesa ${total} g. ¿Cuánto es eso en kilos y gramos?`,
    enunciadoFacil: `Un saco pesa ${total} g. Pásalo a kilos y gramos.`,
    respuesta: textos(kilosYGramos(total), [`${k * 10 + c} kg y 0 g`, `${k} kg y ${c} g`, `${k + 1} kg y ${c * 10} g`]),
    pista: "Cada 1000 g forman un kilo.",
    explicacion: `${total} g son ${k * 1000} g más ${c * 100} g. Eso es ${kilosYGramos(total)}.`,
  };
});

const COSAS_QUE_SE_PESAN = ["Saco de arena", "Caja de naranjas", "Bolsa de harina", "Cesta de peras", "Saco de semillas", "Caja de libros"] as const;

function textoMasa(g: number, mixto: boolean): string {
  if (!mixto) return `${g / 1000} kg`;
  if (g === 500) return "medio kilo";
  return g % 1000 === 0 ? `${g / 1000} kg` : `${g} g`;
}

const compararMasas = gen("NUM3-T4-b", (rng, d) => {
  const [c1, c2, c3] = trio(rng, COSAS_QUE_SE_PESAN);
  const cosas = [c1, c2, c3];
  const valores = d === 1 ? muestra(rng, [2, 3, 4, 5, 6, 7, 8, 9], 3).map((k) => k * 1000) : d === 2 ? muestra(rng, [1000, 1200, 1500, 2000, 2500, 3000, 3500, 4000], 3) : muestra(rng, [500, 700, 800, 1000, 1500, 2000, 2500], 3);
  const imagen: Imagen = { tipo: "tabla", titulo: "Lo que pesa cada cosa", cabeceras: ["Cosa", "Cuánto pesa"], filas: cosas.map((c, i) => [c, textoMasa(en(valores, i), d > 1)]) };
  if (d === 3) {
    const [i, j] = par(rng, [0, 1, 2]);
    const r = en(valores, i) + en(valores, j);
    return {
      enunciado: `Mira la tabla. ¿Cuántos gramos pesan juntos estos dos: ${en(cosas, i).toLowerCase()} y ${en(cosas, j).toLowerCase()}?`,
      enunciadoFacil: `Mira la tabla. Busca: ${en(cosas, i).toLowerCase()} y ${en(cosas, j).toLowerCase()}. ¿Cuántos gramos pesan juntos?`,
      imagen,
      respuesta: num(r),
      pista: "Pasa todo a gramos. Medio kilo son 500 gramos.",
      explicacion: `${en(valores, i)} + ${en(valores, j)} = ${r} gramos.`,
    };
  }
  const mas = rng() < 0.6;
  const objetivo = mas ? Math.max(...valores) : Math.min(...valores);
  const quien = en(cosas, valores.indexOf(objetivo));
  const palabra = mas ? "más" : "menos";
  return {
    enunciado: `Mira la tabla. ¿Qué pesa ${palabra}?`,
    enunciadoFacil: `Lee la tabla. ¿Qué pesa ${palabra}?`,
    imagen,
    respuesta: textos(quien, cosas.filter((c) => c !== quien)),
    pista: d === 1 ? "Compara los números de kilos." : "Pasa todas las medidas a gramos antes de comparar.",
    explicacion: `${quien} pesa ${objetivo} gramos, y es lo que pesa ${palabra} de las tres cosas.`,
  };
});

const problemaMasa = gen("NUM3-T4-b", (rng, d) => {
  const n = nombre(rng);
  if (d === 1) {
    const a = entero(rng, 5, 25);
    const b = entero(rng, 3, 20);
    const r = a + b;
    return {
      enunciado: `Un saco pesa ${a} kg y otro pesa ${b} kg. ¿Cuántos kilos pesan juntos?`,
      enunciadoFacil: `Un saco pesa ${a} kg. Otro saco pesa ${b} kg. ¿Cuántos kilos pesan juntos?`,
      respuesta: opc(rng, r, [Math.abs(a - b), r + 10, r - 10, r + 1]),
      pista: "Junta los dos sacos: suma.",
      explicacion: `${a} + ${b} = ${r} kg.`,
    };
  }
  if (d === 2) {
    const k = entero(rng, 1, 3);
    const usa = 50 * entero(rng, 3, 17);
    const r = k * 1000 - usa;
    return {
      enunciado: `${n} tiene ${pl(k, "kilo", "kilos")} de harina y usa ${usa} gramos. ¿Cuántos gramos de harina le quedan?`,
      enunciadoFacil: `Hay ${pl(k, "kilo", "kilos")} de harina. ${n} usa ${usa} gramos. ¿Cuántos gramos quedan?`,
      respuesta: num(r),
      pista: "Pasa los kilos a gramos antes de restar.",
      explicacion: `${k} kg son ${k * 1000} g, y ${k * 1000} − ${usa} = ${r} g.`,
    };
  }
  const veces = entero(rng, 3, 6);
  const paquete = 50 * entero(rng, 3, 6);
  const k = Math.floor((veces * paquete) / 1000) + 1;
  const r = k * 1000 - veces * paquete;
  return {
    enunciado: `${n} pone en una caja ${veces} paquetes de ${paquete} g cada uno. ¿Cuántos gramos faltan para llegar a ${pl(k, "kilo", "kilos")}?`,
    enunciadoFacil: `Hay ${veces} paquetes. Cada paquete pesa ${paquete} g. ¿Cuántos gramos faltan para llegar a ${pl(k, "kilo", "kilos")}?`,
    respuesta: num(r),
    pista: "Calcula cuánto pesan los paquetes. Después resta.",
    explicacion: `${veces} × ${paquete} = ${veces * paquete} g, y ${k * 1000} − ${veces * paquete} = ${r} g.`,
  };
});

// ---------- T4-c Capacidad ----------
const problemaLitros = gen("NUM3-T4-c", (rng, d) => {
  const n = nombre(rng);
  if (d === 1) {
    const cubo = entero(rng, 3, 9);
    const veces = entero(rng, 2, 6);
    const r = cubo * veces;
    return {
      enunciado: `En un cubo caben ${cubo} litros. ${n} saca del pozo ${veces} cubos llenos. ¿Cuántos litros de agua saca?`,
      enunciadoFacil: `En un cubo caben ${cubo} litros. ${n} saca ${veces} cubos llenos. ¿Cuántos litros saca?`,
      respuesta: opc(rng, r, [cubo + veces, r + cubo, r - cubo, r + 1]),
      pista: "Cada cubo lleva lo mismo.",
      explicacion: `${veces} × ${cubo} = ${r} litros.`,
    };
  }
  if (d === 2) {
    const botella = entero(rng, 2, 5);
    const q = entero(rng, 4, 12);
    const total = botella * q;
    return {
      enunciado: `Un tanque tiene ${total} litros de agua. ${n} llena botellas de ${botella} litros hasta vaciarlo. ¿Cuántas botellas llena?`,
      enunciadoFacil: `Un tanque tiene ${total} litros. Cada botella lleva ${botella} litros. ¿Cuántas botellas se llenan?`,
      respuesta: num(q),
      pista: "¿Cuántas veces cabe una botella en el tanque?",
      explicacion: `${total} ÷ ${botella} = ${q} botellas.`,
    };
  }
  const gasto = 5 * entero(rng, 2, 6);
  const dias = entero(rng, 3, 6);
  const total = 10 * (Math.floor((gasto * dias) / 10) + entero(rng, 2, 8));
  const r = total - gasto * dias;
  return {
    enunciado: `Un tanque tiene ${total} litros de agua. Cada día se gastan ${gasto} litros. ¿Cuántos litros quedan después de ${dias} días?`,
    enunciadoFacil: `Un tanque tiene ${total} litros. Cada día se gastan ${gasto} litros. Pasan ${dias} días. ¿Cuántos litros quedan?`,
    respuesta: num(r),
    pista: "Calcula primero todo lo que se gasta.",
    explicacion: `${dias} × ${gasto} = ${gasto * dias} litros gastados, y ${total} − ${gasto * dias} = ${r} litros.`,
  };
});

const mediosLitros = gen("NUM3-T4-c", (rng, d) => {
  if (d === 1) {
    const l = entero(rng, 2, 9);
    return {
      enunciado: `¿Cuántas botellas de medio litro se llenan con ${l} litros de agua?`,
      enunciadoFacil: `Hay ${l} litros de agua. Cada botella lleva medio litro. ¿Cuántas botellas se llenan?`,
      respuesta: opc(rng, 2 * l, [l, l + 2, 4 * l, l + 1]),
      pista: "Con un litro se llenan dos botellas de medio litro.",
      explicacion: `Cada litro llena 2 botellas: ${l} × 2 = ${2 * l} botellas.`,
    };
  }
  if (d === 2) {
    const l = entero(rng, 2, 9);
    const b = 2 * l;
    return {
      enunciado: `Hay ${b} botellas llenas de medio litro. ¿Cuántos litros de agua hay en total?`,
      enunciadoFacil: `Hay ${b} botellas. Cada botella tiene medio litro. ¿Cuántos litros hay?`,
      respuesta: num(l),
      pista: "Dos botellas de medio litro hacen un litro.",
      explicacion: `Cada 2 botellas son un litro: ${b} ÷ 2 = ${l} litros.`,
    };
  }
  const l = entero(rng, 2, 6);
  return {
    enunciado: `¿Cuántas tazas de un cuarto de litro se llenan con ${l} litros de agua?`,
    enunciadoFacil: `Hay ${l} litros de agua. Cada taza lleva un cuarto de litro. ¿Cuántas tazas se llenan?`,
    respuesta: num(4 * l),
    pista: "Piensa cuántos cuartos de litro hay en un litro.",
    explicacion: `Un litro llena 4 tazas: ${l} × 4 = ${4 * l} tazas.`,
  };
});

// De menor a mayor, para que las capacidades de la tabla sean creíbles.
const RECIPIENTES = ["Jarra", "Olla", "Regadera", "Cubo", "Barril", "Tanque"] as const;

function articulo(recipiente: string): string {
  const femenino = ["Olla", "Regadera", "Jarra"].includes(recipiente);
  return `${femenino ? "la" : "el"} ${recipiente.toLowerCase()}`;
}

const tablaRecipientes = gen("NUM3-T4-c", (rng, d) => {
  const elegidos = muestra(rng, RECIPIENTES, 4);
  const nombres = RECIPIENTES.filter((x) => elegidos.includes(x));
  const pequeno = entero(rng, 2, 6);
  const veces = entero(rng, 4, 12);
  const valores = d === 3 ? [pequeno, pequeno + 1, pequeno * veces - 1, pequeno * veces] : muestra(rng, [3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 25, 30], 4).sort((x, y) => x - y);
  const filas = barajar(rng, nombres.map((x, i) => [x, String(en(valores, i))]));
  const imagen: Imagen = { tipo: "tabla", titulo: "Capacidad de cada recipiente", cabeceras: ["Recipiente", "Litros"], filas };
  if (d === 3) {
    const [chico, grandote] = [articulo(en(nombres, 0)), articulo(en(nombres, 3))];
    return {
      enunciado: `Mira la tabla. ¿Cuántas veces cabe el agua de ${chico} en ${grandote}?`,
      enunciadoFacil: `Lee la tabla. Busca ${chico} y ${grandote}. ¿Cuántas veces cabe el agua de ${chico} en ${grandote}?`,
      imagen,
      respuesta: num(veces),
      pista: "Busca los dos números y divide el mayor entre el menor.",
      explicacion: `${pequeno * veces} ÷ ${pequeno} = ${veces} veces.`,
    };
  }
  if (d === 1) {
    const mas = rng() < 0.6;
    const objetivo = mas ? Math.max(...valores) : Math.min(...valores);
    const quien = en(nombres, valores.indexOf(objetivo));
    return {
      enunciado: `Mira la tabla. ¿En qué recipiente cabe ${mas ? "más" : "menos"} agua?`,
      enunciadoFacil: `Lee la tabla. ¿Dónde cabe ${mas ? "más" : "menos"} agua?`,
      imagen,
      respuesta: textos(quien, nombres.filter((x) => x !== quien)),
      pista: "Compara los números de la columna de litros.",
      explicacion: `En ${articulo(quien)} caben ${objetivo} litros, y es ${mas ? "el número mayor" : "el número menor"} de la tabla.`,
    };
  }
  const [i, j] = par(rng, [0, 1, 2, 3]);
  const [x, y] = en(valores, i) > en(valores, j) ? [i, j] : [j, i];
  const r = en(valores, x) - en(valores, y);
  return {
    enunciado: `Mira la tabla. ¿Cuántos litros más caben en ${articulo(en(nombres, x))} que en ${articulo(en(nombres, y))}?`,
    enunciadoFacil: `Lee la tabla. Compara ${articulo(en(nombres, x))} y ${articulo(en(nombres, y))}. ¿Cuántos litros más caben en ${articulo(en(nombres, x))}?`,
    imagen,
    respuesta: num(r),
    pista: "Busca los dos números y resta.",
    explicacion: `${en(valores, x)} − ${en(valores, y)} = ${r} litros.`,
  };
});

// ---------- T5 Compras ----------
function tablaPrecios(articulos: readonly Articulo[], precios: readonly number[]): Imagen {
  return { tipo: "tabla", titulo: "Precios de la tienda", cabeceras: ["Artículo", "Monedas"], filas: articulos.map((a, i) => [mayuscula(a.nombre), String(en(precios, i))]) };
}

function preciosDistintos(rng: Rng, n: number, min: number, max: number): number[] {
  const salida: number[] = [];
  while (salida.length < n) {
    const p = entero(rng, min, max);
    if (!salida.includes(p)) salida.push(p);
  }
  return salida;
}

function sinLlevarSuma(a: number, b: number): number {
  return a + b - 10;
}

const sumarConTabla = gen("NUM3-T5-a", (rng, d) => {
  const n = nombre(rng);
  const articulos = muestra(rng, ARTICULOS, 4);
  const precios = d === 1 ? preciosDistintos(rng, 4, 3, 24) : d === 2 ? preciosDistintos(rng, 4, 13, 59) : preciosDistintos(rng, 4, 14, 85);
  const imagen = tablaPrecios(articulos, precios);
  const a = en(articulos, 0);
  const b = en(articulos, 1);
  const pa = en(precios, 0);
  const pb = en(precios, 1);
  if (d === 3) {
    const c = en(articulos, 2);
    const pc = en(precios, 2);
    const r = 2 * pa + pb + pc;
    return {
      enunciado: `Mira los precios. ${n} compra 2 ${a.plural}, ${b.uno} y ${c.uno}. ¿Cuántas monedas paga en total?`,
      enunciadoFacil: `Lee los precios. ${n} compra 2 ${a.plural}. También ${b.uno} y ${c.uno}. ¿Cuántas monedas paga?`,
      imagen,
      respuesta: num(r),
      pista: "Hay dos cosas iguales: cuenta su precio dos veces.",
      explicacion: `${pa} + ${pa} + ${pb} + ${pc} = ${r} monedas.`,
    };
  }
  const r = pa + pb;
  return {
    enunciado: `Mira los precios. ${n} compra ${a.uno} y ${b.uno}. ¿Cuántas monedas paga en total?`,
    enunciadoFacil: `Lee los precios. ${n} compra ${a.uno} y ${b.uno}. ¿Cuántas monedas paga?`,
    imagen,
    respuesta: d === 1 ? opc(rng, r, [r + 10, r + 1, r - 1, Math.abs(pa - pb)]) : num(r),
    pista: "Busca los dos precios en la tabla y súmalos.",
    explicacion: `${pa} + ${pb} = ${r} monedas.`,
  };
});

const sumarDosPrecios = gen("NUM3-T5-a", (rng, d) => {
  const n = nombre(rng);
  const [a, b, c] = trio(rng, ARTICULOS);
  if (d === 3) {
    const [x, y, z] = [entero(rng, 105, 280), entero(rng, 45, 190), entero(rng, 26, 99)];
    const r = x + y + z;
    return {
      enunciado: `${mayuscula(a.uno)} cuesta ${monedas(x)}, ${b.uno} cuesta ${monedas(y)} y ${c.uno} cuesta ${monedas(z)}. ¿Cuánto cuestan las tres cosas juntas?`,
      enunciadoFacil: `${mayuscula(a.uno)} cuesta ${monedas(x)}. ${mayuscula(b.uno)} cuesta ${monedas(y)}. ${mayuscula(c.uno)} cuesta ${monedas(z)}. ¿Cuánto cuestan las tres cosas?`,
      respuesta: opc(rng, r, [r - 10, r + 10, r - 100, r + 100, x + y], 10, monedas),
      pista: "Suma dos precios y al resultado súmale el tercero.",
      explicacion: `${x} + ${y} = ${x + y}, y ${x + y} + ${z} = ${r} monedas.`,
    };
  }
  const x = d === 1 ? 10 * entero(rng, 1, 7) + entero(rng, 0, 4) : 10 * entero(rng, 1, 6) + entero(rng, 3, 9);
  const y = d === 1 ? 10 * entero(rng, 1, 2) + entero(rng, 1, 5) : 10 * entero(rng, 1, 3) + entero(rng, 11 - (x % 10), 9);
  const r = x + y;
  return {
    enunciado: `${n} compra ${a.uno} de ${monedas(x)} y ${b.uno} de ${monedas(y)}. ¿Cuánto paga en total?`,
    enunciadoFacil: `${mayuscula(a.uno)} cuesta ${monedas(x)}. ${mayuscula(b.uno)} cuesta ${monedas(y)}. ¿Cuánto paga ${n}?`,
    respuesta: opc(rng, r, d === 2 ? [sinLlevarSuma(x, y), r + 10, r + 1, Math.abs(x - y)] : [r + 10, r - 10, r + 1, Math.abs(x - y)], 1, monedas),
    pista: d === 1 ? "Suma las unidades y después las decenas." : "Si las unidades pasan de 9, te llevas una decena.",
    explicacion: `${x} + ${y} = ${r} monedas.`,
  };
});

const VALORES_MONEDA = [1, 2, 5, 10, 20, 50] as const;

function monedasAlAzar(rng: Rng, cantidad: number, valores: readonly number[]): number[] {
  return Array.from({ length: cantidad }, () => elegir(rng, valores)).sort((a, b) => b - a);
}

const contarPago = gen("NUM3-T5-a", (rng, d) => {
  const n = nombre(rng);
  const a = elegir(rng, ARTICULOS);
  const valores = monedasAlAzar(rng, d === 1 ? 3 : d === 2 ? 5 : 6, d === 1 ? [1, 2, 5, 10] : VALORES_MONEDA);
  const imagen: Imagen = { tipo: "monedas", valores };
  const suma = valores.reduce((x, y) => x + y, 0);
  const lista = valores.join(" + ");
  if (d === 3) {
    const extra = entero(rng, 12, 38);
    const r = suma + extra;
    return {
      enunciado: `${n} paga ${a.uno} con estas monedas, sin que sobre nada. Además compra otra cosa que cuesta ${extra}. ¿Cuánto cuestan las dos cosas juntas?`,
      enunciadoFacil: `${n} paga ${a.uno} con estas monedas. No sobra nada. Compra otra cosa que cuesta ${extra}. ¿Cuánto cuestan las dos cosas?`,
      imagen,
      respuesta: num(r),
      pista: "Suma primero el valor de todas las monedas del dibujo.",
      explicacion: `Las monedas valen ${lista} = ${suma}. Con la otra compra: ${suma} + ${extra} = ${r}.`,
    };
  }
  return {
    enunciado: `${n} paga ${a.uno} con estas monedas, sin que sobre nada. ¿Cuánto cuesta ${a.genero === "f" ? "la" : "el"} ${a.nombre}?`,
    enunciadoFacil: `${n} paga con estas monedas. No sobra nada. ¿Cuánto cuesta ${a.genero === "f" ? "la" : "el"} ${a.nombre}?`,
    imagen,
    respuesta: num(suma),
    pista: "Lee el valor de cada moneda y súmalos. Empieza por las de más valor.",
    explicacion: `${lista} = ${suma}.`,
  };
});

// Calcular el cambio
const cambioDirecto = gen("NUM3-T5-b", (rng, d) => {
  const n = nombre(rng);
  const [a, b] = par(rng, ARTICULOS);
  if (d === 3) {
    const x = entero(rng, 12, 48);
    const y = entero(rng, 13, 39);
    const total = x + y;
    const paga = elegir(rng, [100, 200]);
    const r = paga - total;
    return {
      enunciado: `${n} compra ${a.uno} de ${monedas(x)} y ${b.uno} de ${monedas(y)}. Paga con ${monedas(paga)}. ¿Cuánto le devuelven?`,
      enunciadoFacil: `${mayuscula(a.uno)} cuesta ${monedas(x)}. ${mayuscula(b.uno)} cuesta ${monedas(y)}. ${n} paga con ${monedas(paga)}. ¿Cuánto le devuelven?`,
      respuesta: opc(rng, r, [paga - x, paga - y, r + 10, r - 10, total], 1, monedas),
      pista: "Suma primero lo que cuesta todo. Después resta.",
      explicacion: `${x} + ${y} = ${total}, y ${paga} − ${total} = ${monedas(r)}.`,
    };
  }
  const precio = d === 1 ? 5 * entero(rng, 1, 9) : entero(rng, 12, 88);
  const paga = d === 1 ? 50 : 100;
  const r = paga - precio;
  return {
    enunciado: `${mayuscula(a.uno)} cuesta ${monedas(precio)}. ${n} paga con ${monedas(paga)}. ¿Cuánto le devuelven?`,
    enunciadoFacil: `${mayuscula(a.uno)} cuesta ${monedas(precio)}. ${n} da ${monedas(paga)}. ¿Cuánto le devuelven?`,
    respuesta: d === 1 ? opc(rng, r, [paga + precio, precio, r + 5, r - 5], 5, monedas) : num(r),
    pista: "El cambio es lo que pagas menos lo que cuesta.",
    explicacion: `${paga} − ${precio} = ${monedas(r)}.`,
  };
});

const cambioConMonedas = gen("NUM3-T5-b", (rng, d) => {
  const n = nombre(rng);
  const a = elegir(rng, ARTICULOS);
  const valores = elegir(rng, d === 1 ? [[10, 10], [20], [10, 5, 5]] : d === 2 ? [[20, 10, 10, 5], [20, 20, 5, 5], [50]] : [[50, 20, 20, 5, 2], [50, 50], [50, 20, 10, 10, 5]]);
  const total = valores.reduce((x, y) => x + y, 0);
  const precio = d === 1 ? entero(rng, 4, 17) : d === 2 ? entero(rng, 11, 41) : entero(rng, 23, 91);
  const r = total - precio;
  const imagen: Imagen = { tipo: "monedas", valores };
  return {
    enunciado: `${mayuscula(a.uno)} cuesta ${precio}. ${n} paga con las monedas del dibujo. ¿Cuánto le devuelven?`,
    enunciadoFacil: `${mayuscula(a.uno)} cuesta ${precio}. ${n} paga con estas monedas. ¿Cuánto le devuelven?`,
    imagen,
    respuesta: num(r),
    pista: "Suma primero el valor de las monedas. Después resta el precio.",
    explicacion: `Las monedas valen ${total}, y ${total} − ${precio} = ${r}.`,
  };
});

const cuantoCosto = gen("NUM3-T5-b", (rng, d) => {
  const n = nombre(rng);
  const a = elegir(rng, ARTICULOS);
  if (d === 3) {
    const precio = entero(rng, 12, 45);
    const paga = 100;
    const devuelven = paga - 2 * precio;
    return {
      enunciado: `${n} compra 2 ${a.plural} iguales. Paga con ${monedas(paga)} y le devuelven ${monedas(devuelven)}. ¿Cuántas monedas cuesta ${a.genero === "f" ? "cada una" : "cada uno"}?`,
      enunciadoFacil: `${n} compra 2 ${a.plural} iguales. Da ${monedas(paga)}. Le devuelven ${monedas(devuelven)}. ¿Cuántas monedas cuesta ${a.genero === "f" ? "cada una" : "cada uno"}?`,
      respuesta: num(precio),
      pista: "Calcula lo que ha costado todo junto. Después divide entre 2.",
      explicacion: `${paga} − ${devuelven} = ${2 * precio}, y ${2 * precio} ÷ 2 = ${precio} monedas.`,
    };
  }
  const paga = d === 1 ? elegir(rng, [20, 50]) : 100;
  const devuelven = d === 1 ? entero(rng, 2, paga - 5) : entero(rng, 11, 89);
  const r = paga - devuelven;
  return {
    enunciado: `${n} paga ${a.uno} con ${monedas(paga)} y le devuelven ${monedas(devuelven)}. ¿Cuántas monedas costó?`,
    enunciadoFacil: `${n} da ${monedas(paga)}. Le devuelven ${monedas(devuelven)}. ¿Cuántas monedas costó ${a.genero === "f" ? "la" : "el"} ${a.nombre}?`,
    respuesta: d === 1 ? opc(rng, r, [paga + devuelven, devuelven, r + 10, r + 1]) : num(r),
    pista: "De lo que pagó, una parte volvió. La otra parte es el precio.",
    explicacion: `${paga} − ${devuelven} = ${r} monedas.`,
  };
});

// ¿Me alcanza el dinero?
function sobraOFalta(diferencia: number): string {
  if (diferencia >= 0) return `Sí, y ${diferencia === 1 ? "le sobra 1 moneda" : `le sobran ${monedas(diferencia)}`}`;
  const f = -diferencia;
  return `No, ${f === 1 ? "le falta 1 moneda" : `le faltan ${monedas(f)}`}`;
}

const leAlcanza = gen("NUM3-T5-c", (rng, d) => {
  const n = nombre(rng);
  const [a, b] = par(rng, ARTICULOS);
  if (d === 1) {
    const precio = entero(rng, 12, 80);
    const caso = elegir(rng, ["sobra", "falta", "justo"] as const);
    const tiene = caso === "justo" ? precio : caso === "sobra" ? precio + entero(rng, 1, 15) : precio - entero(rng, 1, 10);
    const opciones = { sobra: "Sí, y le sobra dinero", falta: "No, le falta dinero", justo: "Sí, justo, sin que sobre nada" } as const;
    return {
      enunciado: `${n} tiene ${monedas(tiene)} y quiere comprar ${a.uno} de ${monedas(precio)}. ¿Le alcanza el dinero?`,
      enunciadoFacil: `${n} tiene ${monedas(tiene)}. ${mayuscula(a.uno)} cuesta ${monedas(precio)}. ¿Le alcanza?`,
      respuesta: textos(opciones[caso], (["sobra", "falta", "justo"] as const).filter((x) => x !== caso).map((x) => opciones[x])),
      pista: "Compara lo que tiene con lo que cuesta.",
      explicacion: caso === "justo" ? `Tiene ${tiene} y cuesta ${precio}: es la misma cantidad.` : caso === "sobra" ? `${tiene} es mayor que ${precio}, así que le alcanza y le sobra dinero.` : `${tiene} es menor que ${precio}, así que le falta dinero.`,
    };
  }
  const x = d === 2 ? entero(rng, 12, 45) : entero(rng, 8, 25);
  const y = entero(rng, 11, 40);
  const total = d === 2 ? x + y : 3 * x + y;
  const dif = elegir(rng, [-1, 1]) * entero(rng, 2, 14);
  const tiene = total + dif;
  const compra = d === 2 ? `${a.uno} de ${monedas(x)} y ${b.uno} de ${monedas(y)}` : `3 ${a.plural} de ${monedas(x)} cada ${a.genero === "f" ? "una" : "uno"} y ${b.uno} de ${monedas(y)}`;
  const compraFacil = d === 2 ? `${mayuscula(a.uno)} cuesta ${monedas(x)}. ${mayuscula(b.uno)} cuesta ${monedas(y)}.` : `Quiere 3 ${a.plural}. ${a.genero === "f" ? "Cada una" : "Cada uno"} cuesta ${monedas(x)}. ${mayuscula(b.uno)} cuesta ${monedas(y)}.`;
  return {
    enunciado: `${n} tiene ${monedas(tiene)} y quiere comprar ${compra}. ¿Le alcanza el dinero?`,
    enunciadoFacil: `${n} tiene ${monedas(tiene)}. ${compraFacil} ¿Le alcanza?`,
    respuesta: textos(sobraOFalta(dif), [sobraOFalta(-dif), sobraOFalta(dif + (dif > 0 ? 10 : -10)), sobraOFalta(dif > 0 ? -dif - 10 : -dif + 10)]),
    pista: "Calcula primero cuánto cuesta todo.",
    explicacion: `Todo cuesta ${total} y tiene ${tiene}. ${dif > 0 ? `Le sobran ${dif}` : `Le faltan ${-dif}`} monedas.`,
  };
});

const cuantoLeFalta = gen("NUM3-T5-c", (rng, d) => {
  const n = nombre(rng);
  const [a, b] = par(rng, ARTICULOS);
  const uno = a.genero === "f" ? "una" : "uno";
  const x = d === 3 ? entero(rng, 8, 25) : entero(rng, 18, 60);
  const y = entero(rng, 11, 35);
  const total = d === 1 ? x : d === 2 ? x + y : 3 * x + y;
  const falta = entero(rng, 2, 15);
  const tiene = total - falta;
  const compra = d === 1 ? `${a.uno} de ${monedas(x)}` : d === 2 ? `${a.uno} de ${monedas(x)} y ${b.uno} de ${monedas(y)}` : `3 ${a.plural} de ${monedas(x)} cada ${uno} y ${b.uno} de ${monedas(y)}`;
  const facil = d === 1 ? `${mayuscula(a.uno)} cuesta ${monedas(x)}.` : d === 2 ? `${mayuscula(a.uno)} cuesta ${monedas(x)}. ${mayuscula(b.uno)} cuesta ${monedas(y)}.` : `Quiere 3 ${a.plural}. Cada ${uno} cuesta ${monedas(x)}. ${mayuscula(b.uno)} cuesta ${monedas(y)}.`;
  return {
    enunciado: `${n} tiene ${monedas(tiene)} y quiere comprar ${compra}. ¿Cuántas monedas le faltan?`,
    enunciadoFacil: `${n} tiene ${monedas(tiene)}. ${facil} ¿Cuántas monedas le faltan?`,
    respuesta: num(falta),
    pista: d === 1 ? "Resta lo que tiene a lo que cuesta." : "Calcula primero cuánto cuesta todo.",
    explicacion: `${d === 1 ? "Cuesta" : "Todo cuesta"} ${total} y tiene ${tiene}: ${total} − ${tiene} = ${falta}.`,
  };
});

const cuantosPuede = gen("NUM3-T5-c", (rng, d) => {
  const n = nombre(rng);
  const [a, b] = par(rng, ARTICULOS);
  const precio = entero(rng, 3, 9);
  const q = entero(rng, 3, 9);
  const cuantas = a.genero === "f" ? "Cuántas" : "Cuántos";
  const sobra = d === 1 ? 0 : entero(rng, 1, precio - 1);
  const disponible = precio * q + sobra;
  if (d === 3) {
    const otro = entero(rng, 7, 30);
    const tiene = disponible + otro;
    return {
      enunciado: `${n} tiene ${monedas(tiene)}. Primero compra ${b.uno} de ${monedas(otro)}. Con lo que le queda, ¿${cuantas.toLowerCase()} ${a.plural} de ${monedas(precio)} puede comprar como máximo?`,
      enunciadoFacil: `${n} tiene ${monedas(tiene)}. Compra ${b.uno} de ${monedas(otro)}. Después compra ${a.plural} de ${monedas(precio)}. ¿${cuantas} puede comprar como máximo?`,
      respuesta: num(q),
      pista: "Resta primero. Después mira cuántas veces cabe el precio.",
      explicacion: `${tiene} − ${otro} = ${disponible}. Con ${disponible} monedas compra ${q}, porque ${q} × ${precio} = ${q * precio}${sobra > 0 ? ` y ${sobra === 1 ? "sobra" : "sobran"} ${monedas(sobra)}` : ""}.`,
    };
  }
  return {
    enunciado: `${n} tiene ${monedas(disponible)}. ¿${cuantas} ${a.plural} de ${monedas(precio)} puede comprar como máximo?`,
    enunciadoFacil: `${n} tiene ${monedas(disponible)}. ${mayuscula(a.uno)} cuesta ${monedas(precio)}. ¿${cuantas} puede comprar como máximo?`,
    respuesta: d === 1 ? opc(rng, q, [q + 1, q - 1, disponible - precio, q + 2]) : num(q),
    pista: "Mira cuántas veces cabe el precio en lo que tiene.",
    explicacion: `${q} × ${precio} = ${q * precio}${sobra > 0 ? ` y ${sobra === 1 ? "sobra" : "sobran"} ${monedas(sobra)}, que no llega para otra compra` : ""}. Puede comprar ${q}.`,
  };
});

const queCosasAlcanzan = gen("NUM3-T5-c", (rng, d) => {
  const n = nombre(rng);
  const articulos = muestra(rng, ARTICULOS, 4);
  const precios = preciosDistintos(rng, 4, 11, d === 1 ? 45 : 60).sort((x, y) => x - y);
  const [p1, p2, p3, p4] = [en(precios, 0), en(precios, 1), en(precios, 2), en(precios, 3)];
  const [a1, a2, a3, a4] = [en(articulos, 0), en(articulos, 1), en(articulos, 2), en(articulos, 3)];
  const orden = barajar(rng, [0, 1, 2, 3]);
  const imagen = tablaPrecios(orden.map((i) => en(articulos, i)), orden.map((i) => en(precios, i)));
  if (d === 1) {
    const tiene = entero(rng, p1, p2 - 1);
    return {
      enunciado: `Mira los precios. ${n} tiene ${monedas(tiene)}. ¿Qué artículo puede comprar?`,
      enunciadoFacil: `Lee los precios. ${n} tiene ${monedas(tiene)}. ¿Qué puede comprar?`,
      imagen,
      respuesta: textos(mayuscula(a1.nombre), [a2, a3, a4].map((a) => mayuscula(a.nombre))),
      pista: "Busca el precio que no pasa de lo que tiene.",
      explicacion: `${a1.genero === "f" ? "La" : "El"} ${a1.nombre} cuesta ${monedas(p1)} y le alcanza. Lo demás cuesta más de ${monedas(tiene)}.`,
    };
  }
  const barato = p1 + p2;
  const siguiente = p1 + p3;
  const tiene = entero(rng, barato, Math.max(barato, siguiente - 1));
  const unir = (x: Articulo, y: Articulo) => `${mayuscula(x.nombre)} y ${y.nombre}`;
  if (d === 2) {
    return {
      enunciado: `Mira los precios. ${n} tiene ${monedas(tiene)} y quiere comprar dos artículos. ¿Qué pareja puede comprar?`,
      enunciadoFacil: `Lee los precios. ${n} tiene ${monedas(tiene)}. Quiere dos artículos. ¿Qué pareja puede comprar?`,
      imagen,
      respuesta: textos(unir(a1, a2), [unir(a1, a3), unir(a2, a4), unir(a3, a4)]),
      pista: "Suma los precios de cada pareja y compara con lo que tiene.",
      explicacion: `${p1} + ${p2} = ${barato}, y sí le alcanza. Las otras parejas cuestan ${siguiente} o más.`,
    };
  }
  const falta = p3 + p4 - tiene;
  return {
    enunciado: `Mira los precios. ${n} tiene ${monedas(tiene)} y quiere comprar ${a3.uno} y ${a4.uno}. ¿Cuántas monedas le faltan?`,
    enunciadoFacil: `Lee los precios. ${n} tiene ${monedas(tiene)}. Quiere ${a3.uno} y ${a4.uno}. ¿Cuántas monedas le faltan?`,
    imagen,
    respuesta: num(falta),
    pista: "Suma los dos precios. Después resta lo que tiene.",
    explicacion: `${p3} + ${p4} = ${p3 + p4}, y ${p3 + p4} − ${tiene} = ${falta}.`,
  };
});

export const GENERADORES_3B: MapaGeneradores = {
  "NUM3-T4-a": [convertirLongitud, compararCuerdas, problemaLongitud],
  "NUM3-T4-b": [convertirMasa, compararMasas, problemaMasa],
  "NUM3-T4-c": [problemaLitros, mediosLitros, tablaRecipientes],
  "NUM3-T5-a": [sumarConTabla, sumarDosPrecios, contarPago],
  "NUM3-T5-b": [cambioDirecto, cambioConMonedas, cuantoCosto],
  "NUM3-T5-c": [leAlcanza, cuantoLeFalta, cuantosPuede, queCosasAlcanzan],
};
