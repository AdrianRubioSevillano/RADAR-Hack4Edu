// LEE6-T5-a · Recibo o factura. Documentos calculados en código: los importes,
// totales y respuestas salen siempre de los datos del documento.
import type { Rng } from "../../../core/rng.ts";
import { distractoresNumericos, elegir, entero, monedas, muestra, nombre, pregunta, type BorradorPregunta } from "../../ayuda.ts";
import type { Dificultad, Generador, Imagen } from "../../tipos.ts";

const SUB = "LEE6-T5-a";

interface Producto {
  readonly singular: string;
  readonly plural: string;
  readonly genero: "m" | "f";
}

const PRODUCTOS: readonly Producto[] = [
  { singular: "cuaderno", plural: "cuadernos", genero: "m" },
  { singular: "lápiz", plural: "lápices", genero: "m" },
  { singular: "jabón", plural: "jabones", genero: "m" },
  { singular: "cepillo", plural: "cepillos", genero: "m" },
  { singular: "paquete de arroz", plural: "paquetes de arroz", genero: "m" },
  { singular: "vela", plural: "velas", genero: "f" },
  { singular: "cuerda", plural: "cuerdas", genero: "f" },
  { singular: "taza", plural: "tazas", genero: "f" },
  { singular: "bolsa de sal", plural: "bolsas de sal", genero: "f" },
  { singular: "caja de clavos", plural: "cajas de clavos", genero: "f" },
];

const TIENDAS = ["Tienda La Esquina", "Almacén El Puente", "Tienda Dos Caminos", "Tienda La Plaza", "Puesto 7 del mercado"] as const;
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"] as const;

interface Linea {
  readonly producto: Producto;
  readonly cantidad: number;
  readonly precio: number;
  readonly importe: number;
}

interface Compra {
  readonly tienda: string;
  readonly cliente: string;
  readonly dia: number;
  readonly mes: string;
  readonly mesSiguiente: string;
  readonly lineas: readonly Linea[];
  readonly total: number;
}

type Contenido = Omit<BorradorPregunta, "subhabilidad" | "dificultad" | "plantilla">;
type Plantilla = (rng: Rng) => Contenido;

function linea(producto: Producto, cantidad: number, precio: number): Linea {
  return { producto, cantidad, precio, importe: cantidad * precio };
}

function nombreProducto(l: Linea): string {
  return l.cantidad === 1 ? l.producto.singular : l.producto.plural;
}

function textoLinea(l: Linea, importe = l.importe): string {
  return `${l.cantidad} ${nombreProducto(l)} × ${monedas(l.precio)} = ${monedas(importe)}`;
}

function sumar(lineas: readonly Linea[]): number {
  return lineas.reduce((suma, l) => suma + l.importe, 0);
}

function crearCompra(rng: Rng, lineas: readonly Linea[]): Compra {
  const indiceMes = entero(rng, 0, MESES.length - 1);
  return {
    tienda: elegir(rng, TIENDAS),
    cliente: nombre(rng),
    dia: entero(rng, 2, 20),
    mes: MESES[indiceMes] ?? "enero",
    mesSiguiente: MESES[(indiceMes + 1) % MESES.length] ?? "enero",
    lineas,
    total: sumar(lineas),
  };
}

function compraNormal(rng: Rng): Compra {
  const lineas = muestra(rng, PRODUCTOS, 3).map((p) => linea(p, entero(rng, 2, 6), entero(rng, 2, 9)));
  return crearCompra(rng, lineas);
}

function cabecera(c: Compra): string[] {
  return [`Fecha: ${c.dia} de ${c.mes}`, `Cliente: ${c.cliente}`];
}

function recibo(c: Compra, cuerpo: readonly string[]): Imagen {
  return { tipo: "cartel", estilo: "recibo", titulo: `Recibo · ${c.tienda}`, lineas: [...cabecera(c), ...cuerpo] };
}

function reciboCompleto(c: Compra, extras: readonly string[] = []): Imagen {
  return recibo(c, [...c.lineas.map((l) => textoLinea(l)), `TOTAL: ${monedas(c.total)}`, ...extras]);
}

function pagoCon(rng: Rng, total: number): number {
  return Math.ceil((total + 1) / 10) * 10 + 10 * entero(rng, 0, 1);
}

function cuantos(p: Producto): string {
  return `${p.genero === "m" ? "Cuántos" : "Cuántas"} ${p.plural}`;
}

function unSolo(p: Producto): string {
  return `${p.genero === "m" ? "un solo" : "una sola"} ${p.singular}`;
}

function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ---------- Factura del agua ----------
interface Factura {
  readonly cliente: string;
  readonly mes: string;
  readonly mesPago: string;
  readonly anterior: number;
  readonly actual: number;
  readonly consumo: number;
  readonly precio: number;
  readonly cuota: number;
  readonly total: number;
  readonly limite: number;
  readonly recargo: number;
}

function crearFactura(rng: Rng): Factura {
  const indiceMes = entero(rng, 0, MESES.length - 1);
  const anterior = entero(rng, 100, 400);
  const consumo = entero(rng, 8, 25);
  const precio = entero(rng, 2, 4);
  const cuota = entero(rng, 3, 9);
  return {
    cliente: nombre(rng),
    mes: MESES[indiceMes] ?? "enero",
    mesPago: MESES[(indiceMes + 1) % MESES.length] ?? "enero",
    anterior,
    actual: anterior + consumo,
    consumo,
    precio,
    cuota,
    total: consumo * precio + cuota,
    limite: entero(rng, 10, 20),
    recargo: entero(rng, 2, 6),
  };
}

function factura(f: Factura, mostrarTotal: boolean): Imagen {
  return {
    tipo: "cartel",
    estilo: "recibo",
    titulo: "Factura del agua · Comité del Agua",
    lineas: [
      `Cliente: ${f.cliente}`,
      `Periodo: ${f.mes}`,
      `Lectura anterior: ${f.anterior} metros cúbicos`,
      `Lectura actual: ${f.actual} metros cúbicos`,
      `Precio: ${monedas(f.precio)} por metro cúbico`,
      `Cuota fija: ${monedas(f.cuota)}`,
      ...(mostrarTotal ? [`Total a pagar: ${monedas(f.total)}`] : []),
      `Fecha límite de pago: ${f.limite} de ${f.mesPago}`,
      `Recargo por pagar tarde: ${monedas(f.recargo)}`,
    ],
  };
}

// ---------- Dificultad 1: leer un dato ----------
const fecha: Plantilla = (rng) => {
  const c = compraNormal(rng);
  const limite = c.dia + 7;
  return {
    enunciado: `Mira el recibo de ${c.cliente}. ¿En qué fecha se hizo la compra?`,
    enunciadoFacil: "Mira el recibo. ¿Qué día fue la compra?",
    imagen: reciboCompleto(c, [`Cambios: hasta el ${limite} de ${c.mes}`]),
    respuesta: {
      tipo: "opcion",
      correcta: `${c.dia} de ${c.mes}`,
      distractores: [`${limite} de ${c.mes}`, `${c.dia} de ${c.mesSiguiente}`, `${c.dia + 1} de ${c.mes}`],
    },
    pista: "En el recibo hay dos fechas. Busca la línea que dice «Fecha».",
    explicacion: `La línea «Fecha» dice ${c.dia} de ${c.mes}. El ${limite} de ${c.mes} es el último día para hacer cambios.`,
  };
};

const total: Plantilla = (rng) => {
  const c = compraNormal(rng);
  const pagado = pagoCon(rng, c.total);
  return {
    enunciado: `Mira el recibo de ${c.cliente}. ¿Cuántas monedas costó toda la compra?`,
    enunciadoFacil: "Mira el recibo. ¿Cuántas monedas costó todo?",
    imagen: reciboCompleto(c, [`Pagado: ${monedas(pagado)}`, `Cambio: ${monedas(pagado - c.total)}`]),
    respuesta: { tipo: "numero", valor: c.total },
    pista: "Busca la línea del total. No la confundas con lo que se entregó al pagar.",
    explicacion: `La línea TOTAL dice ${monedas(c.total)}. ${c.cliente} entregó ${monedas(pagado)}, pero eso no es lo que costó la compra.`,
  };
};

const unidad: Plantilla = (rng) => {
  const c = compraNormal(rng);
  const l = elegir(rng, c.lineas);
  return {
    enunciado: `Mira el recibo de ${c.cliente}. ¿Cuánto cuesta ${unSolo(l.producto)}?`,
    enunciadoFacil: `Mira el recibo. ¿Cuánto cuesta ${unSolo(l.producto)}?`,
    imagen: reciboCompleto(c),
    respuesta: {
      tipo: "opcion",
      correcta: monedas(l.precio),
      distractores: distractoresNumericos(rng, l.precio, [l.importe, l.cantidad, c.total], 3).map((n) => monedas(n)),
    },
    pista: "En cada línea, el número que va después de × es el precio de una unidad.",
    explicacion: `La línea dice ${textoLinea(l)}. El precio de cada unidad es ${monedas(l.precio)}.`,
  };
};

const cantidad: Plantilla = (rng) => {
  const c = compraNormal(rng);
  const l = elegir(rng, c.lineas);
  return {
    enunciado: `Mira el recibo de ${c.cliente}. ¿${cuantos(l.producto)} compró?`,
    enunciadoFacil: `Mira el recibo. ¿${cuantos(l.producto)} compró ${c.cliente}?`,
    imagen: reciboCompleto(c),
    respuesta: { tipo: "numero", valor: l.cantidad },
    pista: "En cada línea, el primer número es la cantidad que se compró.",
    explicacion: `La línea dice ${textoLinea(l)}, así que compró ${l.cantidad}.`,
  };
};

const pagado: Plantilla = (rng) => {
  const c = compraNormal(rng);
  const entregado = pagoCon(rng, c.total);
  return {
    enunciado: `Mira el recibo de ${c.cliente}. ¿Cuántas monedas entregó al pagar?`,
    enunciadoFacil: `Mira el recibo. ¿Cuántas monedas dio ${c.cliente} al pagar?`,
    imagen: reciboCompleto(c, [`Pagado: ${monedas(entregado)}`, `Cambio: ${monedas(entregado - c.total)}`]),
    respuesta: { tipo: "numero", valor: entregado },
    pista: "Busca la línea que dice «Pagado». No es lo mismo que el total.",
    explicacion: `La línea «Pagado» dice ${monedas(entregado)}. La compra costó ${monedas(c.total)}.`,
  };
};

// ---------- Dificultad 2: relacionar datos ----------
const cambio: Plantilla = (rng) => {
  const c = compraNormal(rng);
  const entregado = pagoCon(rng, c.total);
  const devuelto = entregado - c.total;
  return {
    enunciado: `Mira el recibo de ${c.cliente}. ¿Cuántas monedas le devolvieron?`,
    enunciadoFacil: `Mira el recibo. Fíjate en el total. Fíjate en lo pagado. ¿Cuántas monedas le devolvieron a ${c.cliente}?`,
    imagen: reciboCompleto(c, [`Pagado: ${monedas(entregado)}`]),
    respuesta: { tipo: "numero", valor: devuelto },
    pista: "Lo que te devuelven es lo que entregas menos lo que cuesta la compra.",
    explicacion: `Entregó ${monedas(entregado)} y la compra costó ${monedas(c.total)}. Le devolvieron ${entregado} − ${c.total} = ${monedas(devuelto)}.`,
  };
};

const mayorGasto: Plantilla = (rng) => {
  const [a, b, d] = muestra(rng, PRODUCTOS, 3) as [Producto, Producto, Producto];
  // El más caro por unidad no es en el que más se gasta: ese es el error típico.
  const caro = linea(a, 1, entero(rng, 9, 12));
  const mayor = linea(b, entero(rng, 5, 6), entero(rng, 3, 4));
  const menor = linea(d, entero(rng, 2, 3), 2);
  const c = crearCompra(rng, muestra(rng, [caro, mayor, menor], 3));
  return {
    enunciado: `Mira el recibo de ${c.cliente}. ¿En qué producto gastó más monedas en total?`,
    enunciadoFacil: "Mira el recibo. ¿En qué producto se gastó más en total?",
    imagen: reciboCompleto(c),
    respuesta: { tipo: "opcion", correcta: mayuscula(b.plural), distractores: [mayuscula(a.plural), mayuscula(d.plural)] },
    pista: "No mires el precio de una unidad. Mira el importe que aparece al final de cada línea.",
    explicacion: `En ${b.plural} gastó ${monedas(mayor.importe)}, más que en lo demás. El producto más caro por unidad cuesta ${monedas(caro.precio)}, pero solo compró 1 unidad.`,
  };
};

const plazo: Plantilla = (rng) => {
  const c = compraNormal(rng);
  const ultimo = c.dia + 7;
  return {
    enunciado: `Mira el recibo de ${c.cliente}. ¿Cuál es el último día para cambiar un producto?`,
    enunciadoFacil: "Mira el recibo. Se puede cambiar un producto durante 7 días. ¿Cuál es el último día?",
    imagen: reciboCompleto(c, ["Cambios: hasta 7 días después de la compra, con este recibo"]),
    respuesta: {
      tipo: "opcion",
      correcta: `${ultimo} de ${c.mes}`,
      distractores: [`${c.dia} de ${c.mes}`, `${c.dia + 6} de ${c.mes}`, `${ultimo} de ${c.mesSiguiente}`],
    },
    pista: "Busca la fecha de la compra y suma los días que dice la línea «Cambios».",
    explicacion: `La compra fue el ${c.dia} de ${c.mes}. Siete días después es el ${ultimo} de ${c.mes}.`,
  };
};

const sinProducto: Plantilla = (rng) => {
  const c = compraNormal(rng);
  const l = elegir(rng, c.lineas);
  const resto = c.total - l.importe;
  return {
    enunciado: `Mira el recibo de ${c.cliente}. ¿Cuántas monedas habría pagado si no hubiera comprado ${l.producto.genero === "m" ? "los" : "las"} ${l.producto.plural}?`,
    enunciadoFacil: `Mira el recibo. Quita la línea de ${l.producto.plural}. ¿Cuántas monedas cuesta el resto?`,
    imagen: reciboCompleto(c),
    respuesta: { tipo: "numero", valor: resto },
    pista: "Resta al total lo que cuesta esa línea.",
    explicacion: `El total es ${monedas(c.total)} y esa línea cuesta ${monedas(l.importe)}. Quedan ${c.total} − ${l.importe} = ${monedas(resto)}.`,
  };
};

const significado: Plantilla = (rng) => {
  const c = compraNormal(rng);
  const entregado = pagoCon(rng, c.total);
  const devuelto = entregado - c.total;
  return {
    enunciado: `En el recibo de ${c.cliente} aparece «Cambio: ${monedas(devuelto)}». ¿Qué significa?`,
    enunciadoFacil: `El recibo dice «Cambio: ${monedas(devuelto)}». ¿Qué quiere decir?`,
    imagen: reciboCompleto(c, [`Pagado: ${monedas(entregado)}`, `Cambio: ${monedas(devuelto)}`]),
    respuesta: {
      tipo: "opcion",
      correcta: `Es lo que la tienda le devolvió a ${c.cliente}.`,
      distractores: [`Es lo que ${c.cliente} entregó al pagar.`, "Es lo que costó toda la compra.", "Es lo que cobra la tienda por cambiar un producto."],
    },
    pista: "Compara el total y lo pagado. ¿Qué pasa con las monedas que sobran?",
    explicacion: `${c.cliente} entregó ${monedas(entregado)} y la compra costó ${monedas(c.total)}. Las ${monedas(devuelto)} de diferencia se las devolvió la tienda.`,
  };
};

const consumo: Plantilla = (rng) => {
  const f = crearFactura(rng);
  return {
    enunciado: `Mira la factura del agua de ${f.cliente}. ¿Cuántos metros cúbicos de agua se gastaron en ${f.mes}?`,
    enunciadoFacil: `Mira la factura. Compara las dos lecturas. ¿Cuántos metros cúbicos se gastaron en ${f.mes}?`,
    imagen: factura(f, true),
    respuesta: { tipo: "numero", valor: f.consumo },
    pista: "El contador acumula el agua: lo gastado es la lectura actual menos la anterior.",
    explicacion: `La lectura actual es ${f.actual} y la anterior, ${f.anterior}. Se gastaron ${f.actual} − ${f.anterior} = ${f.consumo} metros cúbicos.`,
  };
};

// ---------- Dificultad 3: revisar y calcular con varios datos ----------
const sumaMal: Plantilla = (rng) => {
  const c = compraNormal(rng);
  const impreso = c.total + elegir(rng, [2, 3, 10]);
  return {
    enunciado: `${c.cliente} revisa su recibo y ve que el TOTAL no coincide con la suma de las líneas. ¿Cuántas monedas debería decir el TOTAL?`,
    enunciadoFacil: "El TOTAL de este recibo está mal. Suma las líneas. ¿Cuántas monedas debería decir?",
    imagen: recibo(c, [...c.lineas.map((l) => textoLinea(l)), `TOTAL: ${monedas(impreso)}`]),
    respuesta: { tipo: "numero", valor: c.total },
    pista: "Suma el importe que aparece al final de cada línea y compáralo con el TOTAL.",
    explicacion: `Las líneas suman ${c.lineas.map((l) => l.importe).join(" + ")} = ${monedas(c.total)}. El recibo dice ${monedas(impreso)}, y eso está mal.`,
  };
};

const lineaMal: Plantilla = (rng) => {
  const c = compraNormal(rng);
  const errada = elegir(rng, c.lineas);
  const error = entero(rng, 1, 4);
  const cobrado = c.total + error;
  return {
    enunciado: `En el recibo de ${c.cliente} hay una línea mal multiplicada, y por eso le han cobrado de más. ¿Cuántas monedas de más le han cobrado?`,
    enunciadoFacil: "Una línea de este recibo está mal multiplicada. Se ha cobrado de más. ¿Cuántas monedas de más?",
    imagen: recibo(c, [...c.lineas.map((l) => textoLinea(l, l === errada ? l.importe + error : l.importe)), `TOTAL: ${monedas(cobrado)}`]),
    respuesta: { tipo: "numero", valor: error },
    pista: "Multiplica la cantidad por el precio en cada línea y compara con lo que dice el recibo.",
    explicacion: `En la línea de ${errada.producto.plural}, ${errada.cantidad} × ${errada.precio} = ${errada.importe}, pero el recibo dice ${errada.importe + error}. Le han cobrado ${monedas(error)} de más.`,
  };
};

const descuento: Plantilla = (rng) => {
  const [a, b, d] = muestra(rng, PRODUCTOS, 3) as [Producto, Producto, Producto];
  const primeras = [linea(a, entero(rng, 2, 6), entero(rng, 2, 9)), linea(b, entero(rng, 2, 6), entero(rng, 2, 9))];
  // La última línea hace que el subtotal sea múltiplo de 10 y el 10 % salga exacto.
  const falta = (10 - (sumar(primeras) % 10)) % 10;
  const c = crearCompra(rng, [...primeras, linea(d, 1, falta < 2 ? falta + 10 : falta)]);
  const rebaja = c.total / 10;
  const final = c.total - rebaja;
  return {
    enunciado: `Mira el recibo de ${c.cliente}, que tiene el descuento para socios. ¿Cuántas monedas paga al final?`,
    enunciadoFacil: "Mira el recibo. Calcula el descuento. Réstalo al subtotal. ¿Cuántas monedas se pagan al final?",
    imagen: recibo(c, [...c.lineas.map((l) => textoLinea(l)), `Subtotal: ${monedas(c.total)}`, "Descuento para socios: 10 %"]),
    respuesta: { tipo: "numero", valor: final },
    pista: "El 10 % es la décima parte del subtotal. Después hay que restarla.",
    explicacion: `El 10 % de ${c.total} son ${rebaja} monedas. Paga ${c.total} − ${rebaja} = ${monedas(final)}.`,
  };
};

const costeAgua: Plantilla = (rng) => {
  const f = crearFactura(rng);
  const coste = f.consumo * f.precio;
  return {
    enunciado: `Mira la factura del agua de ${f.cliente}. ¿Cuántas monedas cuesta el agua gastada, sin contar la cuota fija?`,
    enunciadoFacil: "Mira la factura. Calcula el agua gastada. Multiplica por el precio. No sumes la cuota fija. ¿Cuántas monedas son?",
    imagen: factura(f, false),
    respuesta: { tipo: "numero", valor: coste },
    pista: "Primero calcula el agua gastada con las dos lecturas. Después multiplica por el precio.",
    explicacion: `Se gastaron ${f.actual} − ${f.anterior} = ${f.consumo} metros cúbicos. A ${monedas(f.precio)} cada uno son ${monedas(coste)}.`,
  };
};

const totalFactura: Plantilla = (rng) => {
  const f = crearFactura(rng);
  return {
    enunciado: `A la factura del agua de ${f.cliente} se le ha borrado el total. ¿Cuántas monedas hay que pagar, si se paga a tiempo?`,
    enunciadoFacil: "A esta factura le falta el total. Se paga a tiempo. Calcula el agua gastada. Multiplica por el precio. Suma la cuota fija. ¿Cuántas monedas son?",
    imagen: factura(f, false),
    respuesta: { tipo: "numero", valor: f.total },
    pista: "Calcula el agua gastada, multiplica por el precio y suma la cuota fija. El recargo no se cuenta.",
    explicacion: `Son ${f.consumo} metros cúbicos a ${monedas(f.precio)}, que hacen ${f.consumo * f.precio} monedas. Con la cuota fija de ${f.cuota} son ${monedas(f.total)}.`,
  };
};

const recargo: Plantilla = (rng) => {
  const f = crearFactura(rng);
  const tarde = rng() < 0.5;
  const dia = tarde ? f.limite + entero(rng, 1, 5) : f.limite - entero(rng, 1, 5);
  const aPagar = tarde ? f.total + f.recargo : f.total;
  return {
    enunciado: `${f.cliente} paga esta factura del agua el ${dia} de ${f.mesPago}. ¿Cuántas monedas tiene que pagar?`,
    enunciadoFacil: `Mira la fecha límite. ${f.cliente} paga el ${dia} de ${f.mesPago}. ¿Cuántas monedas paga?`,
    imagen: factura(f, true),
    respuesta: { tipo: "numero", valor: aPagar },
    pista: "Compara el día del pago con la fecha límite. El recargo solo se suma si se paga tarde.",
    explicacion: tarde
      ? `El ${dia} es después del ${f.limite}, la fecha límite. Paga ${f.total} + ${f.recargo} = ${monedas(aPagar)}.`
      : `El ${dia} es antes del ${f.limite}, la fecha límite. No hay recargo y paga ${monedas(aPagar)}.`,
  };
};

const PLANTILLAS: Readonly<Record<Dificultad, Readonly<Record<string, Plantilla>>>> = {
  1: { fecha, total, unidad, cantidad, pagado },
  2: { cambio, mayorGasto, plazo, sinProducto, significado, consumo },
  3: { sumaMal, lineaMal, descuento, costeAgua, totalFactura, recargo },
};

export const generadorRecibos: Generador = (rng, dificultad) => {
  const [clave, crear] = elegir(rng, Object.entries(PLANTILLAS[dificultad]));
  return pregunta(rng, { ...crear(rng), subhabilidad: SUB, dificultad, plantilla: `${SUB}#${clave}` });
};
