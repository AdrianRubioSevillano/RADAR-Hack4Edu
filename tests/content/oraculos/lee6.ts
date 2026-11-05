// Oráculo de LEE6-T5-a: recalcula la respuesta leyendo solo el cartel y el enunciado.
import type { Pregunta } from "../../../src/content/tipos.ts";

interface LineaLeida {
  readonly cantidad: number;
  readonly nombre: string;
  readonly precio: number;
  readonly importe: number;
}

const LINEA = /^(\d+) (.+) × (\d+) monedas? = (\d+) monedas?$/;

function lineasDe(p: Pregunta): readonly string[] {
  if (p.imagen?.tipo !== "cartel") throw new Error("Falta el cartel");
  return p.imagen.lineas;
}

function dato(p: Pregunta, etiqueta: string): string {
  const fila = lineasDe(p).find((l) => l.startsWith(`${etiqueta}:`));
  if (fila === undefined) throw new Error(`Falta ${etiqueta}`);
  return fila.slice(etiqueta.length + 1).trim();
}

function numero(p: Pregunta, etiqueta: string): number {
  return Number(/\d+/.exec(dato(p, etiqueta))?.[0]);
}

function productos(p: Pregunta): readonly LineaLeida[] {
  return lineasDe(p).flatMap((l) => {
    const m = LINEA.exec(l);
    return m === null ? [] : [{ cantidad: Number(m[1]), nombre: m[2] ?? "", precio: Number(m[3]), importe: Number(m[4]) }];
  });
}

// Las líneas del recibo van en plural y el enunciado puede ir en singular.
function singular(nombre: string): string {
  const [primera = "", ...resto] = nombre.split(" ");
  const base = primera === "lápices" ? "lápiz" : primera === "jabones" ? "jabón" : primera.replace(/s$/, "");
  return [base, ...resto].join(" ");
}

function buscarProducto(p: Pregunta): LineaLeida {
  const hallado = productos(p).find((l) => p.enunciado.includes(l.nombre) || p.enunciado.includes(singular(l.nombre)));
  if (hallado === undefined) throw new Error(`Producto no encontrado: ${p.enunciado}`);
  return hallado;
}

function consumo(p: Pregunta): number {
  return numero(p, "Lectura actual") - numero(p, "Lectura anterior");
}

function diaDe(texto: string): number {
  return Number(/(\d+) de /.exec(texto)?.[1]);
}

function mesDe(texto: string): string {
  return /\d+ de (\S+)/.exec(texto)?.[1] ?? "";
}

const r = String;

export function oraculoRecibos(p: Pregunta): string {
  const e = p.enunciado;
  const suma = productos(p).reduce((s, l) => s + l.importe, 0);
  if (e.includes("¿En qué fecha")) return dato(p, "Fecha");
  if (e.includes("costó toda la compra")) return r(numero(p, "TOTAL"));
  if (e.includes("¿Cuánto cuesta")) {
    const precio = buscarProducto(p).precio;
    return `${precio} ${precio === 1 ? "moneda" : "monedas"}`;
  }
  if (e.includes("compró?")) return r(buscarProducto(p).cantidad);
  if (e.includes("entregó al pagar")) return r(numero(p, "Pagado"));
  if (e.includes("le devolvieron")) return r(numero(p, "Pagado") - numero(p, "TOTAL"));
  if (e.includes("gastó más monedas")) {
    const mayor = [...productos(p)].sort((x, y) => y.importe - x.importe)[0]?.nombre ?? "";
    return mayor.charAt(0).toUpperCase() + mayor.slice(1);
  }
  if (e.includes("último día para cambiar")) {
    const f = dato(p, "Fecha");
    return `${diaDe(f) + 7} de ${mesDe(f)}`;
  }
  if (e.includes("si no hubiera comprado")) return r(numero(p, "TOTAL") - buscarProducto(p).importe);
  if (e.includes("¿Qué significa?")) return `Es lo que la tienda le devolvió a ${dato(p, "Cliente")}.`;
  if (e.includes("metros cúbicos de agua se gastaron")) return r(consumo(p));
  if (e.includes("debería decir el TOTAL")) return r(suma);
  if (e.includes("mal multiplicada")) return r(productos(p).reduce((s, l) => s + l.importe - l.cantidad * l.precio, 0));
  if (e.includes("descuento para socios")) return r(numero(p, "Subtotal") - numero(p, "Subtotal") / 10);
  if (e.includes("sin contar la cuota fija")) return r(consumo(p) * numero(p, "Precio"));
  if (e.includes("se le ha borrado el total")) return r(consumo(p) * numero(p, "Precio") + numero(p, "Cuota fija"));
  if (e.includes("paga esta factura")) {
    const dia = Number(/paga esta factura del agua el (\d+) de/.exec(e)?.[1]);
    const limite = diaDe(dato(p, "Fecha límite de pago"));
    return r(numero(p, "Total a pagar") + (dia > limite ? numero(p, "Recargo por pagar tarde") : 0));
  }
  throw new Error(`Plantilla sin oráculo: ${e}`);
}
