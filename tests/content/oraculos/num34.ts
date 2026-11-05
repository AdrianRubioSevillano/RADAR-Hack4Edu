// Oráculos NUM 3.º y 4.º: recalculan la respuesta solo con lo que ve el niño
// (enunciado, texto, imagen y opciones). No importan nada de los generadores.
import type { Imagen, Opcion, Pregunta } from "../../../src/content/tipos.ts";

type Oraculo = (p: Pregunta) => string;
type De<T extends Imagen["tipo"]> = Extract<Imagen, { tipo: T }>;

function falla(p: Pregunta): never {
  throw new Error(`Sin regla para: ${p.enunciado}`);
}

function ints(texto: string): number[] {
  return [...texto.matchAll(/\d{1,3}(?: \d{3})+|\d+/g)].map((m) => Number(m[0].replace(/ /g, "")));
}

function n0(texto: string, i = 0): number {
  const v = ints(texto)[i];
  if (v === undefined) throw new Error(`Sin número ${i} en: ${texto}`);
  return v;
}

function imagen<T extends Imagen["tipo"]>(p: Pregunta, tipo: T): De<T> {
  if (p.imagen?.tipo !== tipo) throw new Error(`Se esperaba imagen ${tipo}: ${p.enunciado}`);
  return p.imagen as De<T>;
}

// Única opción que cumple la condición: si hay dos, la pregunta es ambigua.
function unica(p: Pregunta, cumple: (o: Opcion) => boolean): string {
  const buenas = (p.opciones ?? []).filter(cumple);
  if (buenas.length !== 1) throw new Error(`${buenas.length} opciones válidas: ${p.enunciado} :: ${(p.opciones ?? []).map((o) => o.texto).join(" | ")}`);
  return (buenas[0] as Opcion).texto;
}

function resp(p: Pregunta, n: number): string {
  if (p.formato === "numero") return String(n);
  return unica(p, (o) => ints(o.texto).length > 0 && n0(o.texto) === n && !/ y /.test(o.texto));
}

function exacto(a: number, b: number): number {
  if (a % b !== 0) throw new Error(`División no exacta: ${a} ÷ ${b}`);
  return a / b;
}

function suma(lista: readonly number[]): number {
  return lista.reduce((x, y) => x + y, 0);
}

function sumaExpr(t: string): number {
  return suma(ints(t));
}

function redondea(n: number, paso: number): number {
  return Math.floor((n + paso / 2) / paso) * paso;
}

function signo(a: number, b: number): string {
  return a > b ? ">" : a < b ? "<" : "=";
}

function filas(p: Pregunta): readonly (readonly string[])[] {
  return imagen(p, "tabla").filas;
}

function extremo(p: Pregunta, quiereMayor: boolean, valor: (o: Opcion) => number): string {
  const lista = (p.opciones ?? []).map(valor);
  const objetivo = quiereMayor ? Math.max(...lista) : Math.min(...lista);
  return unica(p, (o) => valor(o) === objetivo);
}

// ---------- 3.º T1 ----------
const t3_1a: Oraculo = (p) => {
  const e = p.enunciado;
  if (p.imagen?.tipo === "decenas") return resp(p, 100 * (p.imagen.centenas ?? 0) + 10 * p.imagen.decenas + p.imagen.unidades);
  let m = /número (\d+), ¿qué cifra está en el lugar de las (\w+)/.exec(e);
  if (m !== null) return (m[1] as string)[{ centenas: 0, decenas: 1, unidades: 2 }[m[2] as "centenas"]] as string;
  m = /vale la cifra (\d) en el número (\d+)/.exec(e);
  if (m !== null) {
    const s = m[2] as string;
    return resp(p, Number(m[1]) * 10 ** (s.length - 1 - s.indexOf(m[1] as string)));
  }
  m = /falta\? (\d+) = (\d+) \+ ___ \+ (\d+)/.exec(e);
  if (m !== null) return resp(p, Number(m[1]) - Number(m[2]) - Number(m[3]));
  if (e.includes("centena")) {
    const v = (r: RegExp) => Number(r.exec(e)?.[1]);
    return resp(p, 100 * v(/(\d+) centena/) + 10 * v(/(\d+) decena/) + v(/(\d+) unidad/));
  }
  if (e.startsWith("¿Qué número es")) return resp(p, sumaExpr(e));
  return falla(p);
};

const t3_1b: Oraculo = (p) => {
  const e = p.enunciado;
  if (e.includes("números es el")) return extremo(p, e.includes("mayor"), (o) => n0(o.texto));
  if (e.includes("signo")) {
    const [i, d] = (e.split("hueco? ")[1] as string).split(" ___ ") as [string, string];
    return signo(sumaExpr(i), sumaExpr(d));
  }
  if (e.startsWith("Ordena")) {
    const asc = e.includes("de menor a mayor");
    return ints(e).sort((a, b) => (asc ? a - b : b - a)).join(", ");
  }
  const ventas = [...e.matchAll(/(\p{L}+) vendió (\d+)/gu)].map((m) => ({ n: m[1] as string, v: Number(m[2]) }));
  if (ventas.length > 0) {
    const vs = ventas.map((x) => x.v);
    const objetivo = e.includes("menos") ? Math.min(...vs) : Math.max(...vs);
    return ventas.find((x) => x.v === objetivo)?.n ?? falla(p);
  }
  return falla(p);
};

const t3_1c: Oraculo = (p) => {
  const e = p.enunciado;
  const m = /da (\d+) al redondearlo/.exec(e);
  if (m !== null) return unica(p, (o) => redondea(n0(o.texto), 10) === Number(m[1]));
  return resp(p, redondea(n0(e), 10));
};

// ---------- 3.º T2 ----------
const t3_2a: Oraculo = (p) => {
  const e = p.enunciado;
  if (p.imagen?.tipo === "objetos") return resp(p, suma(p.imagen.grupos.map((g) => g.cantidad)));
  let m = /(\d+) × ___ = (\d+)|___ × (\d+) = (\d+)/.exec(e);
  if (m !== null) return resp(p, exacto(Number(m[2] ?? m[4]), Number(m[1] ?? m[3])));
  m = /(\d+) × (\d+)/.exec(e);
  if (m !== null) return resp(p, Number(m[1]) * Number(m[2]));
  return falla(p);
};

const t3_2c: Oraculo = (p) => {
  const e = p.enunciado;
  const v = ints(e);
  const [a = 0, b = 0, c = 0] = v;
  if (e.startsWith("En cada")) return resp(p, a * b + c);
  if (e.includes("pelota de")) return resp(p, a * b + c);
  if (e.includes("cuesta")) return resp(p, a * b);
  if (e.startsWith("Un libro tiene")) return resp(p, a - b * c);
  if (e.includes("páginas cada día")) return resp(p, a * b);
  return falla(p);
};

// ---------- 3.º T3 ----------
const t3_3a: Oraculo = (p) => {
  const e = p.enunciado;
  const m = /reparte (\d+) .* en (\d+) grupos iguales/.exec(e);
  if (m !== null) {
    const [total, n] = [Number(m[1]), Number(m[2])];
    return unica(p, (o) => {
      const g = (o.imagen as De<"objetos">).grupos.map((x) => x.cantidad);
      return g.length === n && suma(g) === total && new Set(g).size === 1;
    });
  }
  const total = suma(imagen(p, "objetos").grupos.map((g) => g.cantidad));
  return resp(p, exacto(total, n0(e)));
};

const t3_3b: Oraculo = (p) => {
  const e = p.enunciado;
  if (e.includes("exacta")) return unica(p, (o) => n0(o.texto) % n0(o.texto, 1) === 0);
  let m = /Si (\d+) × (\d+) = (\d+), ¿cuánto es (\d+) ÷ (\d+)/.exec(e);
  if (m !== null) return resp(p, exacto(Number(m[4]), Number(m[5])));
  m = /(\d+) ÷ ___ = (\d+)/.exec(e);
  if (m !== null) return resp(p, exacto(Number(m[1]), Number(m[2])));
  m = /___ ÷ (\d+) = (\d+)/.exec(e);
  if (m !== null) return resp(p, Number(m[1]) * Number(m[2]));
  m = /(\d+) ÷ (\d+)/.exec(e);
  if (m !== null) return resp(p, exacto(Number(m[1]), Number(m[2])));
  return falla(p);
};

const t3_3c: Oraculo = (p) => {
  const e = p.enunciado;
  const [a = 0, b = 0, c = 0] = ints(e);
  if (e.includes("regalan")) return resp(p, exacto(a - b, c));
  if (e.includes(" tiene ")) return resp(p, exacto(a + b, c));
  return resp(p, exacto(a, b));
};

// ---------- 3.º T4 ----------
function cm(t: string): number {
  const m = /(?:(\d+) m)?(?: y )?(?:(\d+) cm)?$/.exec(t);
  return 100 * Number(m?.[1] ?? 0) + Number(m?.[2] ?? 0);
}

const t3_4a: Oraculo = (p) => {
  const e = p.enunciado;
  const [a = 0, b = 0, c = 0] = ints(e);
  if (p.imagen?.tipo === "tiras") {
    const tiras = p.imagen.tiras.map((t) => {
      const [nombre, medida] = t.etiqueta.split(": ") as [string, string];
      if (cm(medida) !== t.largo) throw new Error(`Tira incoherente: ${t.etiqueta}`);
      return { nombre, largo: cm(medida) };
    });
    const de = (n: string) => tiras.find((t) => t.nombre === `Cuerda de ${n}`)?.largo ?? falla(p);
    const m = /mide la cuerda de (\p{L}+) que la de (\p{L}+)/u.exec(e);
    if (m !== null) return resp(p, de(m[1] as string) - de(m[2] as string));
    const ls = tiras.map((t) => t.largo);
    const objetivo = e.includes("larga") ? Math.max(...ls) : Math.min(...ls);
    return tiras.find((t) => t.largo === objetivo)?.nombre ?? falla(p);
  }
  if (e.startsWith("¿Cuántos centímetros son")) return resp(p, a * 100);
  if (/metros? y \d+ centímetros/.test(e)) return resp(p, a * 100 + b);
  if (e.includes("en metros y centímetros")) return `${Math.floor(a / 100)} m y ${a % 100} cm`;
  if (e.includes("valla")) return resp(p, a * 100 - b * c);
  if (e.includes("corta")) return resp(p, a * 100 - b);
  if (e.includes("otra mide")) return resp(p, a + b);
  return falla(p);
};

function gramos(t: string): number {
  if (t === "medio kilo") return 500;
  return t.endsWith("kg") ? n0(t) * 1000 : n0(t);
}

const t3_4b: Oraculo = (p) => {
  const e = p.enunciado;
  const [a = 0, b = 0] = ints(e);
  if (p.imagen?.tipo === "tabla") {
    const datos = filas(p).map((f) => ({ n: f[0] as string, g: gramos(f[1] as string) }));
    if (e.includes("juntos")) return resp(p, suma(datos.filter((x) => e.includes(x.n.toLowerCase())).map((x) => x.g)));
    const gs = datos.map((x) => x.g);
    const objetivo = e.includes("más") ? Math.max(...gs) : Math.min(...gs);
    return datos.find((x) => x.g === objetivo)?.n ?? falla(p);
  }
  if (e.startsWith("¿Cuántos gramos son")) return resp(p, a * 1000);
  if (/kilos? y \d+ gramos/.test(e)) return resp(p, a * 1000 + b);
  if (e.includes("en kilos y gramos")) return `${Math.floor(a / 1000)} kg y ${a % 1000} g`;
  if (e.includes("otro pesa")) return resp(p, a + b);
  if (e.includes("de harina")) return resp(p, a * 1000 - b);
  if (e.includes("paquetes")) return resp(p, n0(e, 2) * 1000 - a * b);
  return falla(p);
};

const t3_4c: Oraculo = (p) => {
  const e = p.enunciado;
  const [a = 0, b = 0, c = 0] = ints(e);
  if (p.imagen?.tipo === "tabla") {
    const datos = filas(p).map((f) => ({ n: f[0] as string, l: Number(f[1]) }));
    const litros = (t: string) => datos.find((x) => x.n.toLowerCase() === t)?.l ?? falla(p);
    let m = /cabe el agua de (?:la|el) (\p{L}+) en (?:la|el) (\p{L}+)/u.exec(e);
    if (m !== null) return resp(p, exacto(litros(m[2] as string), litros(m[1] as string)));
    m = /más caben en (?:la|el) (\p{L}+) que en (?:la|el) (\p{L}+)/u.exec(e);
    if (m !== null) return resp(p, litros(m[1] as string) - litros(m[2] as string));
    const ls = datos.map((x) => x.l);
    const objetivo = e.includes("más") ? Math.max(...ls) : Math.min(...ls);
    return datos.find((x) => x.l === objetivo)?.n ?? falla(p);
  }
  if (e.includes("medio litro") && e.includes("se llenan")) return resp(p, a * 2);
  if (e.includes("medio litro")) return resp(p, exacto(a, 2));
  if (e.includes("cuarto de litro")) return resp(p, a * 4);
  if (e.includes("cubos llenos")) return resp(p, a * b);
  if (e.includes("Cada día")) return resp(p, a - b * c);
  if (e.includes("botellas de")) return resp(p, exacto(a, b));
  return falla(p);
};

// ---------- 3.º T5 ----------
function pluralDe(n: string): string {
  if (n === "lápiz") return "lápices";
  if (n === "jabón") return "jabones";
  return `${n}s`;
}

function precios(p: Pregunta): { n: string; v: number }[] {
  return filas(p).map((f) => ({ n: (f[0] as string).toLowerCase(), v: Number(f[1]) }));
}

function compraDeTabla(p: Pregunta): number {
  const e = p.enunciado;
  return suma(precios(p).map((x) => (e.includes(`2 ${pluralDe(x.n)}`) ? 2 * x.v : new RegExp(`\\b(un|una) ${x.n}(?=[ ,.])`, "u").test(e) ? x.v : 0)));
}

const t3_5a: Oraculo = (p) => {
  const e = p.enunciado;
  if (p.imagen?.tipo === "tabla") return resp(p, compraDeTabla(p));
  if (p.imagen?.tipo === "monedas") return resp(p, suma(p.imagen.valores) + suma(ints(e)));
  return resp(p, suma(ints(e)));
};

const t3_5b: Oraculo = (p) => {
  const e = p.enunciado;
  const v = ints(e);
  const [a = 0, b = 0, c = 0] = v;
  if (p.imagen?.tipo === "monedas") return resp(p, suma(p.imagen.valores) - a);
  if (e.includes("iguales")) return resp(p, exacto(b - c, 2));
  if (e.includes("le devuelven") && !e.includes("¿Cuánto le devuelven")) return resp(p, a - b);
  if (v.length === 3) return resp(p, c - a - b);
  return resp(p, b - a);
};

const t3_5c: Oraculo = (p) => {
  const e = p.enunciado;
  const v = ints(e);
  if (p.imagen?.tipo === "tabla") {
    const lista = precios(p);
    const precio = (t: string) => lista.find((x) => x.n === t.toLowerCase())?.v ?? falla(p);
    const tiene = n0(e);
    if (e.includes("Qué artículo")) return unica(p, (o) => precio(o.texto) <= tiene);
    if (e.includes("pareja")) return unica(p, (o) => suma(o.texto.split(" y ").map(precio)) <= tiene);
    return resp(p, compraDeTabla(p) - tiene);
  }
  const [a = 0, b = 0, c = 0] = v;
  if (e.includes("como máximo")) return e.includes("Primero") ? resp(p, Math.floor((a - b) / c)) : resp(p, Math.floor(a / b));
  const total = e.includes(" cada ") ? b * c + (v[3] ?? 0) : v.length === 3 ? b + c : b;
  if (e.includes("le faltan")) return resp(p, total - a);
  const dif = a - total;
  if (v.length === 2) return unica(p, (o) => (dif === 0 ? o.texto.includes("justo") : dif > 0 ? o.texto.includes("sobra dinero") : o.texto.includes("falta dinero")));
  const esperado = dif > 0 ? /^Sí, y le sobran? (\d+)/ : /^No, le faltan? (\d+)/;
  return unica(p, (o) => Number(esperado.exec(o.texto)?.[1]) === Math.abs(dif));
};

// ---------- 4.º T1 ----------
const PALABRAS: Readonly<Record<string, number>> = {
  un: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciséis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiún: 21, veintiuno: 21, veintidós: 22, veintitrés: 23, veinticuatro: 24, veinticinco: 25, veintiséis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500, seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
};

function deLetras(t: string): number {
  let total = 0;
  let actual = 0;
  for (const w of t.split(" ")) {
    if (w === "y") continue;
    if (w === "mil") {
      total = (actual === 0 ? 1 : actual) * 1000;
      actual = 0;
    } else {
      const v = PALABRAS[w];
      if (v === undefined) throw new Error(`Palabra desconocida: ${w}`);
      actual += v;
    }
  }
  return total + actual;
}

const t4_1a: Oraculo = (p) => {
  const e = p.enunciado;
  const m = /«(.+)»/.exec(e);
  if (m !== null) return resp(p, deLetras(m[1] as string));
  if (e.includes("se lee")) return unica(p, (o) => deLetras(o.texto) === n0(e));
  if (e.includes("números es el")) return extremo(p, e.includes("mayor"), (o) => n0(o.texto));
  if (e.startsWith("Cuenta de")) {
    const v = ints(e);
    return resp(p, (v[v.length - 1] as number) + (v[0] as number));
  }
  if (e.includes("después")) return resp(p, n0(e) + 1);
  if (e.includes("antes")) return resp(p, n0(e) - 1);
  return falla(p);
};

const VALOR_LUGAR: readonly (readonly [string, number])[] = [["decenas de millar", 10000], ["unidades de millar", 1000], ["centenas", 100], ["decenas", 10], ["unidades", 1]];

function lugarEn(e: string): number {
  const l = VALOR_LUGAR.find(([n]) => e.includes(`las ${n}`));
  if (l === undefined) throw new Error(`Sin lugar: ${e}`);
  return l[1];
}

const t4_1b: Oraculo = (p) => {
  const e = p.enunciado;
  if (p.imagen?.tipo === "tabla") return resp(p, Number((filas(p)[0] as readonly string[]).join("")));
  if (e.includes("qué cifra está")) return String(Math.floor(n0(e) / lugarEn(e)) % 10);
  if (e.includes("sumas 1")) return resp(p, n0(e) + lugarEn(e));
  if (e.includes("restas 1")) return resp(p, n0(e) - lugarEn(e));
  let m = /hay dos cifras (\d)\. ¿Cuánto vale la que está más a la (\w+)/.exec(e);
  if (m !== null) {
    const s = String(n0(e));
    const i = m[2] === "izquierda" ? s.indexOf(m[1] as string) : s.lastIndexOf(m[1] as string);
    return resp(p, Number(m[1]) * 10 ** (s.length - 1 - i));
  }
  m = /vale la cifra (\d) en el número (.+)\?/.exec(e);
  if (m !== null) {
    const s = String(n0(m[2] as string));
    return resp(p, Number(m[1]) * 10 ** (s.length - 1 - s.indexOf(m[1] as string)));
  }
  m = /(\d+) decenas? de millar, (\d+) centenas y (\d+) unidad/.exec(e);
  if (m !== null) return resp(p, 10000 * Number(m[1]) + 100 * Number(m[2]) + Number(m[3]));
  if (e.startsWith("¿Qué número es")) return resp(p, sumaExpr(e));
  return falla(p);
};

function pasoDe(e: string): number {
  return e.includes("la unidad de millar") ? 1000 : 100;
}

const t4_1c: Oraculo = (p) => {
  const e = p.enunciado;
  if (e.includes("al redondearlo")) return unica(p, (o) => redondea(n0(o.texto), pasoDe(e)) === n0(e));
  if (e.includes("camión")) return resp(p, redondea(n0(e), 100) + redondea(n0(e, 1), 100));
  return resp(p, redondea(n0(e), pasoDe(e)));
};

// ---------- 4.º T2 ----------
const t4_2a: Oraculo = (p) => {
  const e = p.enunciado;
  let m = /(\d+) × (\d+) = (\d+) \+ ___/.exec(e);
  if (m !== null) return resp(p, Number(m[1]) * Number(m[2]) - Number(m[3]));
  m = /(\d+) × (\d+)/.exec(e);
  if (m !== null) return resp(p, Number(m[1]) * Number(m[2]));
  if (e.startsWith("En cada caja")) return resp(p, n0(e) * n0(e, 1));
  return falla(p);
};

const t4_2b: Oraculo = (p) => {
  const e = p.enunciado;
  const [a = 0, b = 0, c = 0] = ints(e);
  if (e.includes("cociente y cuál es el resto")) return `Cociente ${Math.floor(a / b)} y resto ${a % b}`;
  if (e.includes("dividendo")) return resp(p, a * b + c);
  if (e.includes("¿Cuál es el resto")) return resp(p, a % b);
  if (e.includes("¿Cuál es el cociente")) return resp(p, Math.floor(a / b));
  if (e.includes("NO puede salir")) return unica(p, (o) => n0(o.texto) >= a);
  if (e.includes("hacen falta")) return resp(p, Math.ceil(a / b));
  if (e.includes("se llenan del todo")) return resp(p, Math.floor(a / b));
  if (e.includes("sin caja")) return resp(p, a % b);
  return falla(p);
};

const t4_2c: Oraculo = (p) => {
  const e = p.enunciado;
  const v = ints(e);
  const [a = 0, b = 0, c = 0, d = 0] = v;
  if (e.includes("Paga con")) return resp(p, c - a * b);
  if (e.includes("Se llevan")) return resp(p, exacto(a - b, c));
  if (e.includes("otro día")) return resp(p, exacto(a + b, c));
  if (e.includes("llena")) return resp(p, a * b - c * d);
  return falla(p);
};

// ---------- 4.º T3 ----------
function frac(t: string): [number, number] {
  const m = /(\d+)\/(\d+)/.exec(t);
  if (m === null) throw new Error(`Sin fracción: ${t}`);
  return [Number(m[1]), Number(m[2])];
}

function fracciones(t: string): [number, number][] {
  return [...t.matchAll(/(\d+)\/(\d+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

const t4_3a: Oraculo = (p) => {
  const e = p.enunciado;
  if (e.startsWith("Toca")) {
    const m = /Toca el dibujo que (?:muestra|tiene coloreada la misma parte que) (\d+)\/(\d+)/.exec(e);
    const [a, b] = [Number(m?.[1]), Number(m?.[2])];
    const misma = e.includes("misma parte");
    return unica(p, (o) => {
      const i = o.imagen as De<"fraccion">;
      return misma ? i.coloreadas * b === a * i.partes : i.coloreadas === a && i.partes === b;
    });
  }
  const i = imagen(p, "fraccion");
  const k = /NO está|sin sembrar/.test(e) ? i.partes - i.coloreadas : i.coloreadas;
  return `${k}/${i.partes}`;
};

const t4_3b: Oraculo = (p) => {
  const e = p.enunciado;
  const val = (t: string) => {
    const [a, b] = frac(t);
    return a / b;
  };
  if (e.includes("fracciones es la")) return extremo(p, e.includes("mayor"), (o) => val(o.texto));
  const [x, y] = fracciones(e) as [[number, number], [number, number]];
  const dif = x[0] * y[1] - y[0] * x[1];
  if (e.includes("signo")) return signo(dif, 0);
  const m = /^(\p{L}+) y (\p{L}+) tienen/u.exec(e);
  return dif === 0 ? "Pintan lo mismo" : ((dif > 0 ? m?.[1] : m?.[2]) ?? falla(p));
};

const t4_3c: Oraculo = (p) => {
  const e = p.enunciado;
  const [a, b] = frac(e);
  const total = p.imagen?.tipo === "objetos" ? suma(p.imagen.grupos.map((g) => g.cantidad)) : n0(e.replace(/\d+\/\d+/, ""));
  const parte = exacto(total * a, b);
  return resp(p, /quedan|NO dan/.test(e) ? total - parte : parte);
};

// ---------- 4.º T4 ----------
function horas(t: string): number[] {
  return [...t.matchAll(/(\d+):(\d\d)/g)].map((m) => 60 * Number(m[1]) + Number(m[2]));
}

function hhmm(t: number): string {
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

function duracionTexto(t: string): number {
  const h = /(\d+) horas?/.exec(t);
  const m = /(\d+) minutos?/.exec(t);
  return 60 * Number(h?.[1] ?? 0) + Number(m?.[1] ?? 0);
}

const t4_4a: Oraculo = (p) => {
  const e = p.enunciado;
  if (p.imagen?.tipo === "reloj") return hhmm(60 * p.imagen.hora + p.imagen.minuto);
  if (e.startsWith("Toca")) {
    const t = horas(e)[0] as number;
    return unica(p, (o) => {
      const r = o.imagen as De<"reloj">;
      return 60 * r.hora + r.minuto === t;
    });
  }
  if (e.includes("¿Cuántos minutos son")) return resp(p, duracionTexto(e));
  if (e.includes("¿Cuánto tiempo son")) return unica(p, (o) => duracionTexto(o.texto) === n0(e) && (/ (\d+) minutos?$/.exec(o.texto) !== null));
  return falla(p);
};

const t4_4b: Oraculo = (p) => {
  const e = p.enunciado;
  const hs = horas(e);
  if (hs.length === 2) {
    const d = (hs[1] as number) - (hs[0] as number);
    return e.includes("¿Cuántos minutos") ? resp(p, d) : unica(p, (o) => duracionTexto(o.texto) === d);
  }
  const tarda = duracionTexto(e.replace(/\d+:\d\d/g, ""));
  if (p.imagen?.tipo === "reloj") return hhmm(60 * p.imagen.hora + p.imagen.minuto + tarda);
  return hhmm((hs[0] as number) - tarda);
};

const t4_4c: Oraculo = (p) => {
  const e = p.enunciado;
  if (p.imagen?.tipo === "cartel") {
    const dias = p.imagen.lineas.map((l) => {
      const m = /^(\p{L}+): de (\d+):00 a (\d+):00$/u.exec(l);
      return { dia: m?.[1] as string, abre: Number(m?.[2]), cierra: Number(m?.[3]) };
    });
    const d = dias.find((x) => e.includes(`el ${x.dia.toLowerCase()}`));
    if (e.includes("A qué hora abre") && d !== undefined) return `${d.abre}:00`;
    if (e.includes("Cuántas horas") && d !== undefined) return resp(p, d.cierra - d.abre);
    const dur = dias.map((x) => x.cierra - x.abre);
    return dias[dur.indexOf(Math.max(...dur))]?.dia ?? falla(p);
  }
  const t = imagen(p, "tabla");
  if (t.cabeceras[0] === "Parada") {
    const fila = (n: string) => t.filas.find((f) => f[0] === n) ?? falla(p);
    let m = /por la parada (\p{L}+)\?/u.exec(e);
    if (m !== null) return fila(m[1] as string)[e.includes("segundo") ? 2 : 1] as string;
    m = /en ir de (\p{L}+) a (\p{L}+)\?/u.exec(e);
    if (m !== null) return resp(p, (horas(fila(m[2] as string)[1] as string)[0] as number) - (horas(fila(m[1] as string)[1] as string)[0] as number));
    m = /llega a la parada (\p{L}+) a las/u.exec(e);
    if (m !== null) {
      const llega = horas(e)[0] as number;
      const siguiente = fila(m[1] as string).slice(1).flatMap(horas).filter((x) => x > llega);
      return resp(p, Math.min(...siguiente) - llega);
    }
    return falla(p);
  }
  const datos = t.filas.map((f) => {
    const [a, b] = horas(f[0] as string) as [number, number];
    return { act: f[1] as string, a, dura: b - a };
  });
  if (e.includes("empieza")) return datos.find((x) => x.a === horas(e)[0])?.act ?? falla(p);
  const una = datos.find((x) => e.includes(`dura ${x.act}`));
  if (una !== undefined) return resp(p, una.dura);
  const mayor = Math.max(...datos.map((x) => x.dura));
  return datos.find((x) => x.dura === mayor)?.act ?? falla(p);
};

// ---------- 4.º T5 ----------
const t4_5a: Oraculo = (p) => {
  const e = p.enunciado.toLowerCase();
  const t = imagen(p, "tabla");
  if (t.cabeceras.length === 2) {
    const v = t.filas.map((f) => Number(f[1]));
    if (e.includes("qué clase tiene más")) return t.filas[v.indexOf(Math.max(...v))]?.[0] as string;
    if (e.includes("entre todas")) return resp(p, suma(v));
    return resp(p, Math.max(...v) - Math.min(...v));
  }
  const columnas = t.cabeceras.slice(1);
  if (/¿qué (día|clase|mes)/.test(e)) {
    const totales = columnas.map((_, j) => suma(t.filas.map((f) => Number(f[j + 1]))));
    return columnas[totales.indexOf(Math.max(...totales))] as string;
  }
  const fila = t.filas.find((f) => e.includes((f[0] as string).toLowerCase())) ?? falla(p);
  const j = columnas.findIndex((c) => e.includes(c.toLowerCase()));
  return resp(p, j >= 0 ? Number(fila[j + 1]) : suma(fila.slice(1).map(Number)));
};

const t4_5b: Oraculo = (p) => {
  const e = p.enunciado.toLowerCase();
  const g = imagen(p, "barras");
  const valor = (t: string) => g.valores[g.etiquetas.indexOf(t)] as number;
  const v = g.valores;
  if (e.includes("qué dos barras")) return unica(p, (o) => suma(o.texto.split(" y ").map(valor)) === n0(e));
  if (/¿qué (clase|fruta|día)/.test(e)) {
    const objetivo = /más/.test(e) ? Math.max(...v) : Math.min(...v);
    return g.etiquetas[v.indexOf(objetivo)] as string;
  }
  const mencion = g.etiquetas
    .map((t, i) => ({ i, pos: e.search(new RegExp(`\\b${t.toLowerCase()}\\b`, "u")) }))
    .filter((x) => x.pos >= 0)
    .sort((a, b) => a.pos - b.pos);
  if (mencion.length === 2) return resp(p, (v[(mencion[0] as { i: number }).i] as number) - (v[(mencion[1] as { i: number }).i] as number));
  if (mencion.length === 1) return resp(p, v[(mencion[0] as { i: number }).i] as number);
  return resp(p, suma(v));
};

const TIPOS: Readonly<Record<string, readonly string[]>> = {
  frutas: ["manzana", "pera", "naranja"],
  animales: ["gato", "perro", "pato", "vaca"],
  vehículos: ["coche", "bicicleta", "barco", "tren"],
};

const FORMAS: Readonly<Record<string, string>> = { círculos: "circulo", cuadrados: "cuadrado", triángulos: "triangulo", rombos: "rombo" };
const COLORES: Readonly<Record<string, string>> = { rojos: "rojo", rojas: "rojo", azules: "azul", verdes: "verde", amarillos: "amarillo", amarillas: "amarillo" };

const t4_5c: Oraculo = (p) => {
  const e = p.enunciado;
  if (p.imagen?.tipo === "objetos") {
    const grupos = p.imagen.grupos;
    const cuenta = (c: string) => suma(grupos.filter((g) => (TIPOS[c] ?? []).includes(g.objeto)).map((g) => g.cantidad));
    const m = /¿Cuánt[ao]s (\p{L}+) más que (\p{L}+) hay/u.exec(e);
    if (m !== null) return resp(p, cuenta(m[1] as string) - cuenta(m[2] as string));
    const c = /¿Cuánt[ao]s (\p{L}+) hay en total/u.exec(e);
    return resp(p, cuenta(c?.[1] as string));
  }
  if (p.imagen?.tipo === "serie") {
    const figuras = p.imagen.elementos as readonly { forma: string; color: string }[];
    const pal = e.replace(/[¿?.]/g, "").split(" ");
    const forma = (w: string | undefined) => FORMAS[w ?? ""];
    const color = (w: string | undefined) => COLORES[w ?? ""];
    const m = /figuras son (\p{L}+) pero no son (\p{L}+)/u.exec(e);
    if (m !== null) return resp(p, figuras.filter((x) => x.color === color(m[1]) && x.forma !== forma(m[2])).length);
    const f = forma(pal.find((w) => forma(w) !== undefined));
    const c = color(pal.find((w) => color(w) !== undefined));
    return resp(p, figuras.filter((x) => x.forma === f && (c === undefined || x.color === c)).length);
  }
  const votos = (/favorito: (.+)\./.exec(p.texto ?? "")?.[1] as string).split(", ");
  const cuenta = (c: string) => votos.filter((x) => x === c).length;
  let m = /eligieron (\p{L}+)\?/u.exec(e);
  if (m !== null) return resp(p, cuenta(m[1] as string));
  m = /más eligieron (\p{L}+) que (\p{L}+)\?/u.exec(e);
  if (m !== null) return resp(p, cuenta(m[1] as string) - cuenta(m[2] as string));
  return extremo(p, true, (o) => cuenta(o.texto));
};

const producto: Oraculo = (p) => {
  const m = /(\d+) × (\d+)/.exec(p.enunciado);
  return m === null ? falla(p) : resp(p, Number(m[1]) * Number(m[2]));
};

export const ORACULOS: Readonly<Record<string, Oraculo>> = {
  "NUM3-T1-a": t3_1a, "NUM3-T1-b": t3_1b, "NUM3-T1-c": t3_1c,
  "NUM3-T2-a": t3_2a, "NUM3-T2-b": producto, "NUM3-T2-c": t3_2c,
  "NUM3-T3-a": t3_3a, "NUM3-T3-b": t3_3b, "NUM3-T3-c": t3_3c,
  "NUM3-T4-a": t3_4a, "NUM3-T4-b": t3_4b, "NUM3-T4-c": t3_4c,
  "NUM3-T5-a": t3_5a, "NUM3-T5-b": t3_5b, "NUM3-T5-c": t3_5c,
  "NUM4-T1-a": t4_1a, "NUM4-T1-b": t4_1b, "NUM4-T1-c": t4_1c,
  "NUM4-T2-a": t4_2a, "NUM4-T2-b": t4_2b, "NUM4-T2-c": t4_2c,
  "NUM4-T3-a": t4_3a, "NUM4-T3-b": t4_3b, "NUM4-T3-c": t4_3c,
  "NUM4-T4-a": t4_4a, "NUM4-T4-b": t4_4b, "NUM4-T4-c": t4_4c,
  "NUM4-T5-a": t4_5a, "NUM4-T5-b": t4_5b, "NUM4-T5-c": t4_5c,
};
