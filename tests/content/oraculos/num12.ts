// Oráculos de NUM 1.º y 2.º: recalculan la respuesta solo con lo que ve el niño
// (enunciado, imagen y opciones), sin usar la lógica de los generadores.
import type { Imagen, Opcion, Pregunta } from "../../../src/content/tipos.ts";

type Oraculo = (p: Pregunta) => string;

const PLURALES: Readonly<Record<string, string>> = {
  manzanas: "manzana", peras: "pera", naranjas: "naranja", "lápices": "lapiz", libros: "libro", cuadernos: "cuaderno", pelotas: "pelota", flores: "flor",
  estrellas: "estrella", peces: "pez", "pájaros": "pajaro", mariposas: "mariposa", vasos: "vaso", botellas: "botella", huevos: "huevo", cajas: "caja",
};
const UNIDADES = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince"];
const DIECI: Readonly<Record<string, number>> = { "dieciséis": 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, "veintidós": 22, "veintitrés": 23, veinticuatro: 24, veinticinco: 25, "veintiséis": 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, cien: 100 };
const TENS: Readonly<Record<string, number>> = { treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90 };
const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const ABREV = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
const LADOS: Readonly<Record<string, number>> = { triangulo: 3, cuadrado: 4, rectangulo: 4, rombo: 4, pentagono: 5, hexagono: 6 };

function fallo(p: Pregunta): never {
  throw new Error(`Oráculo sin caso para: ${p.enunciado}`);
}
const nums = (t: string): number[] => (t.match(/\d+/g) ?? []).map(Number);
const sin = (t: string): string => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
const sum = (v: readonly number[]): number => v.reduce((a, b) => a + b, 0);
const mod = (a: number, b: number): number => ((a % b) + b) % b;
const ops = (p: Pregunta): readonly Opcion[] => p.opciones ?? [];

function deLetras(texto: string): number {
  const t = texto.trim();
  const i = UNIDADES.indexOf(t);
  if (i >= 0) return i;
  const dieci = DIECI[t];
  if (dieci !== undefined) return dieci;
  const [a, , b] = t.split(" ");
  const tens = TENS[a ?? ""];
  if (tens === undefined) throw new Error(`No sé leer: ${texto}`);
  return tens + (b === undefined ? 0 : UNIDADES.indexOf(b));
}

// Texto correcto para un valor: número escrito u opción con ese número.
function salida(p: Pregunta, v: number): string {
  if (p.formato === "numero") return String(v);
  const o = ops(p).find((x) => new RegExp(`^${v}( monedas?)?$`).test(x.texto));
  return o?.texto ?? `sin opción ${v}`;
}
function opcionQue(p: Pregunta, f: (o: Opcion) => boolean): string {
  const hay = ops(p).filter(f);
  return hay.length === 1 ? (hay[0] as Opcion).texto : `opciones válidas: ${hay.length}`;
}
const cantidades = (i: Imagen | undefined): number[] => (i?.tipo === "objetos" ? i.grupos.map((g) => g.cantidad) : []);
const tachados = (i: Imagen | undefined): number => (i?.tipo === "objetos" ? sum(i.grupos.map((g) => g.tachados ?? 0)) : 0);
const valorBloques = (i: Imagen | undefined): number => (i?.tipo === "decenas" ? i.decenas * 10 + i.unidades : NaN);
const valorMonedas = (i: Imagen | undefined): number => (i?.tipo === "monedas" ? sum(i.valores) : NaN);

function resolverSerie(i: Imagen | undefined): number {
  if (i?.tipo !== "serie") return NaN;
  const v = i.elementos.map((e) => ("texto" in e ? Number(e.texto) : null));
  const hueco = v.indexOf(null);
  for (let j = 0; j + 1 < v.length; j += 1) {
    const a = v[j];
    const b = v[j + 1];
    if (a !== null && a !== undefined && b !== null && b !== undefined) return a + (hueco - j) * (b - a);
  }
  return NaN;
}

// a + b, a − b, a × b, con cualquier número de términos del mismo signo.
function expresion(t: string): number | null {
  const m = /(\d+(?: [+−×] \d+)+)/.exec(t);
  if (m === null || t.includes("___")) return null;
  const partes = (m[1] as string).split(" ");
  let v = Number(partes[0]);
  for (let i = 1; i < partes.length; i += 2) {
    const n = Number(partes[i + 1]);
    v = partes[i] === "+" ? v + n : partes[i] === "−" ? v - n : v * n;
  }
  return v;
}
function hueco(t: string): number | null {
  let m = /(\d+) \+ ___ = (\d+)/.exec(t);
  if (m !== null) return Number(m[2]) - Number(m[1]);
  m = /(\d+) − ___ = (\d+)/.exec(t);
  if (m !== null) return Number(m[1]) - Number(m[2]);
  m = /(\d+) × ___ = (\d+)/.exec(t);
  if (m !== null) return Number(m[2]) / Number(m[1]);
  m = /([\d +]+) = (\d+) × ___/.exec(t);
  if (m !== null) return sum(nums(m[1] as string)) / Number(m[2]);
  return null;
}
function calculo(p: Pregunta): string {
  const v = hueco(p.enunciado) ?? expresion(p.enunciado);
  return v === null ? fallo(p) : salida(p, v);
}

const extremo = (pide: string, v: readonly number[]): number => (/mayor|más|larga/.test(pide) ? Math.max(...v) : Math.min(...v));

function porEtiquetas(p: Pregunta, igualdad: string): string {
  const i = p.imagen;
  if (i?.tipo !== "objetos") return fallo(p);
  const pide = /tiene (más|menos)/.exec(p.enunciado)?.[1] ?? fallo(p);
  const e = extremo(pide, i.grupos.map((g) => g.cantidad));
  const quienes = i.grupos.filter((g) => g.cantidad === e);
  return quienes.length > 1 ? igualdad : (quienes[0]?.etiqueta ?? fallo(p));
}

// ---- Hora ----
function etiquetaHora(h: number, m: number): string {
  return `${h === 1 ? "La" : "Las"} ${h} ${m === 0 ? "en punto" : "y media"}`;
}
function horaDe(t: string): [number, number] | null {
  const m = /las? (\d+) (en punto|y media)/.exec(t);
  return m === null ? null : [Number(m[1]), m[2] === "en punto" ? 0 : 30];
}

// ---- Calendario ----
const diasDelMes = (i: number): number => (i === 1 ? 28 : (i + 1 <= 7 ? (i + 1) % 2 === 1 : (i + 1) % 2 === 0) ? 31 : 30);

const O: Record<string, Oraculo> = {
  "NUM1-T1-a": (p) => {
    const t = /Toca el grupo que tiene (\d+)/.exec(p.enunciado);
    if (t !== null) return opcionQue(p, (o) => sum(cantidades(o.imagen)) === Number(t[1]));
    const plural = /¿Cuánt[ao]s (.+?) hay/.exec(p.enunciado)?.[1] ?? fallo(p);
    if (p.imagen?.tipo !== "objetos") return fallo(p);
    return salida(p, sum(p.imagen.grupos.filter((g) => g.objeto === PLURALES[plural]).map((g) => g.cantidad)));
  },
  "NUM1-T1-b": (p) => {
    const e = p.enunciado;
    const palabra = /«(.+)»/.exec(e)?.[1] ?? /cifras: (.+)\.$/.exec(e)?.[1];
    if (palabra !== undefined) return salida(p, deLetras(palabra));
    const n = /número (\d+) con letras/.exec(e);
    if (n !== null) return opcionQue(p, (o) => deLetras(o.texto) === Number(n[1]));
    const g = /tiene (\S+) /.exec(e)?.[1] ?? fallo(p);
    return opcionQue(p, (o) => sum(cantidades(o.imagen)) === deLetras(g));
  },
  "NUM1-T1-c": (p) => {
    const e = p.enunciado;
    if (e.includes("después del")) return salida(p, (nums(e)[0] ?? NaN) + 1);
    if (e.includes("antes del")) return salida(p, (nums(e)[0] ?? NaN) - 1);
    if (e.includes("entre")) return salida(p, sum(nums(e)) / 2);
    return salida(p, resolverSerie(p.imagen));
  },
  "NUM1-T2-a": (p) => {
    const t = /Toca el grupo con (más|menos)/.exec(p.enunciado);
    if (t === null) return porEtiquetas(p, "Tienen la misma cantidad");
    const e = extremo(t[1] as string, ops(p).map((o) => sum(cantidades(o.imagen))));
    return opcionQue(p, (o) => sum(cantidades(o.imagen)) === e);
  },
  "NUM1-T2-b": (p) => {
    const e = p.enunciado;
    const c = /Completa: (\d+) es ___ (\d+)/.exec(e);
    if (c !== null) {
      const d = Number(c[1]) - Number(c[2]);
      return d > 0 ? "mayor que" : d < 0 ? "menor que" : "igual que";
    }
    const pide = /el (mayor|menor)\?/.exec(e)?.[1] ?? fallo(p);
    const lista = /números: ([\d, ]+)\./.exec(e);
    return salida(p, extremo(pide, lista !== null ? nums(lista[1] as string) : ops(p).map((o) => Number(o.texto))));
  },
  "NUM1-T2-c": (p) => {
    const e = p.enunciado;
    const asc = (v: readonly number[]): number[] => [...v].sort((a, b) => a - b);
    const lugar = /Ordena de menor a mayor: ([\d, ]+)\. ¿Qué número queda (.+)\?/.exec(e);
    if (lugar !== null) {
      const v = asc(nums(lugar[1] as string));
      const i = lugar[2] === "primero" ? 0 : lugar[2] === "último" ? v.length - 1 : (v.length - 1) / 2;
      return salida(p, v[i] ?? NaN);
    }
    const sube = e.includes("de menor a mayor");
    const lista = /: ([\d, ]+)\?/.exec(e);
    if (lista !== null) {
      const v = asc(nums(lista[1] as string));
      return (sube ? v : v.reverse()).join(", ");
    }
    return opcionQue(p, (o) => {
      const v = nums(o.texto);
      return v.every((x, i) => i === 0 || (sube ? x > (v[i - 1] as number) : x < (v[i - 1] as number)));
    });
  },
  "NUM1-T3-a": (p) => {
    const m = /lo mismo que (\d+) \+ (\d+)/.exec(p.enunciado);
    if (m !== null) return opcionQue(p, (o) => sum(cantidades(o.imagen)) === Number(m[1]) + Number(m[2]));
    return salida(p, sum(cantidades(p.imagen)));
  },
  "NUM1-T3-b": calculo,
  "NUM1-T3-c": (p) => salida(p, sum(nums(p.enunciado))),
  "NUM1-T4-a": (p) => {
    const e = p.enunciado;
    const m = /(?:Tienes|Hay) (\d+) .+ quitas (\d+)/.exec(e);
    if (m === null) return salida(p, sum(cantidades(p.imagen)) - tachados(p.imagen));
    const [n, k] = [Number(m[1]), Number(m[2])];
    if (e.includes("dibujo")) return opcionQue(p, (o) => sum(cantidades(o.imagen)) === n && tachados(o.imagen) === k);
    return opcionQue(p, (o) => sum(cantidades(o.imagen)) === n - k);
  },
  "NUM1-T4-b": calculo,
  "NUM1-T4-c": (p) => {
    const [a, b] = nums(p.enunciado) as [number, number];
    return salida(p, a - b);
  },
  "NUM1-T5-a": (p) => {
    const e = p.enunciado;
    const forma = (o: Opcion): string => (o.imagen?.tipo === "figura" ? o.imagen.forma : "");
    if (p.imagen?.tipo === "figura") {
      if (e.includes("lados")) return salida(p, LADOS[p.imagen.forma] ?? NaN);
      const f = p.imagen.forma;
      return opcionQue(p, (o) => sin(o.texto) === f);
    }
    const n = /tiene (\d+) lados/.exec(e);
    if (n !== null) return opcionQue(p, (o) => LADOS[forma(o)] === Number(n[1]));
    const nombre = sin(/Toca el (.+)\./.exec(e)?.[1] ?? fallo(p));
    return opcionQue(p, (o) => forma(o) === nombre);
  },
  "NUM1-T5-b": (p) => {
    const e = p.enunciado;
    const i = p.imagen;
    if (i?.tipo === "balanza") {
      if (i.baja === "ninguna") return "Pesan lo mismo";
      const pesado = i.baja === "izquierda" ? i.izquierda : i.derecha;
      const ligero = i.baja === "izquierda" ? i.derecha : i.izquierda;
      const buscado = e.includes("pesa más") ? pesado : ligero;
      return opcionQue(p, (o) => sin(o.texto).endsWith(buscado));
    }
    if (i?.tipo !== "tiras") return fallo(p);
    const pide = /más (larga|corta)/.exec(e)?.[1] ?? fallo(p);
    const m = extremo(pide, i.tiras.map((t) => t.largo));
    const hay = i.tiras.filter((t) => t.largo === m);
    if (hay.length > 1) return "Miden lo mismo";
    const etiqueta = hay[0]?.etiqueta ?? fallo(p);
    return e.startsWith("¿Qué tira") ? `La tira ${etiqueta}` : etiqueta;
  },
  "NUM1-T5-c": (p) => {
    const e = p.enunciado;
    const d = (i: number): string => DIAS[mod(i, 7)] as string;
    const pos = (t: string): number => DIAS.findIndex((x) => new RegExp(`\\b${x}\\b`).test(t) || t.includes(` ${x}`));
    if (p.imagen?.tipo === "serie") {
      const v = p.imagen.elementos.map((x) => ("texto" in x ? DIAS.indexOf(x.texto) : -1));
      const h = v.indexOf(-1);
      const j = v.findIndex((x) => x >= 0);
      return cap(d((v[j] as number) + h - j));
    }
    const hoy = /Hoy es ([^.]+)\./.exec(e)?.[1];
    if (e.includes("faltan")) {
      const destino = /para el (.+)\?/.exec(e)?.[1] ?? fallo(p);
      return salida(p, mod(DIAS.indexOf(destino) - DIAS.indexOf(hoy ?? ""), 7));
    }
    if (hoy !== undefined) {
      const s = e.includes("pasado mañana") ? 2 : e.includes("anteayer") ? -2 : e.includes("mañana") ? 1 : -1;
      return cap(d(DIAS.indexOf(hoy) + s));
    }
    const dia = /del (.+)\?/.exec(e)?.[1] ?? fallo(p);
    const s = e.includes("dos días después") ? 2 : e.includes("después") ? 1 : -1;
    return pos(dia) < 0 ? fallo(p) : cap(d(DIAS.indexOf(dia) + s));
  },

  "NUM2-T1-a": (p) => {
    const e = p.enunciado;
    if (p.imagen?.tipo === "decenas") return salida(p, valorBloques(p.imagen));
    const toca = /forman el número (\d+)/.exec(e);
    if (toca !== null) return opcionQue(p, (o) => valorBloques(o.imagen) === Number(toca[1]));
    const lugar = /número (\d+), ¿qué cifra está en el lugar de las (decenas|unidades)/.exec(e);
    if (lugar !== null) return salida(p, lugar[2] === "decenas" ? Math.floor(Number(lugar[1]) / 10) : Number(lugar[1]) % 10);
    const desc = /descompone el número (\d+)/.exec(e);
    if (desc !== null) return opcionQue(p, (o) => {
      const [a, b] = nums(o.texto) as [number, number];
      return a * 10 + b === Number(desc[1]) && b < 10;
    });
    const dd = /(\d+) decenas?/.exec(e);
    const uu = /(\d+) unidad(?:es)?/.exec(e);
    if (dd === null || uu === null) return fallo(p);
    return salida(p, Number(dd[1]) * 10 + Number(uu[1]));
  },
  "NUM2-T1-b": (p) => {
    const e = p.enunciado;
    const palabra = /«(.+)»/.exec(e)?.[1] ?? /cifras: (.+)\.$/.exec(e)?.[1];
    if (palabra !== undefined) return salida(p, deLetras(palabra));
    const n = p.imagen?.tipo === "decenas" ? valorBloques(p.imagen) : (nums(e)[0] ?? NaN);
    return opcionQue(p, (o) => deLetras(o.texto) === n);
  },
  "NUM2-T1-c": (p) => {
    const e = p.enunciado;
    const signo = /(\d+) ___ (\d+)/.exec(e);
    if (signo !== null) {
      const d = Number(signo[1]) - Number(signo[2]);
      return opcionQue(p, (o) => o.texto.startsWith(d > 0 ? ">" : d < 0 ? "<" : "="));
    }
    const entre = /mayor que (\d+) y menor que (\d+)/.exec(e);
    if (entre !== null) return opcionQue(p, (o) => Number(o.texto) > Number(entre[1]) && Number(o.texto) < Number(entre[2]));
    const hist = /(\S+) tiene (\d+) .+ y (\S+) tiene (\d+) .+ ¿Quién tiene (más|menos)/.exec(e);
    if (hist !== null) {
      const [a, b] = [Number(hist[2]), Number(hist[4])];
      if (a === b) return "Tienen la misma cantidad";
      return (hist[5] === "más") === (a > b) ? (hist[1] as string) : (hist[3] as string);
    }
    const pide = /(mayor|menor)/.exec(e)?.[1] ?? fallo(p);
    if (e.startsWith("Toca")) {
      const m = extremo(pide, ops(p).map((o) => valorBloques(o.imagen)));
      return opcionQue(p, (o) => valorBloques(o.imagen) === m);
    }
    return salida(p, extremo(pide, ops(p).map((o) => Number(o.texto))));
  },
  "NUM2-T2-a": (p) => {
    if (p.imagen?.tipo === "decenas") {
      const b = nums(p.enunciado.split("Súmale")[1] ?? p.enunciado.split("Réstale")[1] ?? "")[0] ?? NaN;
      return salida(p, p.enunciado.includes("Súmale") ? valorBloques(p.imagen) + b : valorBloques(p.imagen) - b);
    }
    return calculo(p);
  },
  "NUM2-T2-b": calculo,
  "NUM2-T2-c": (p) => {
    const e = p.enunciado;
    const v = nums(e);
    if (v.length === 3) {
      let total = v[0] as number;
      for (const m of e.matchAll(/(Bajan|bajan|Planta|planta|Suben|suben|Recoge|recoge) (\d+)/g)) {
        total += /ajan|lanta/.test(m[1] as string) ? -Number(m[2]) : Number(m[2]);
      }
      return salida(p, total);
    }
    const [a, b] = v as [number, number];
    return salida(p, /quedan?\b|faltan?\b|más ha leído|más tiene/.test(e) ? a - b : a + b);
  },
  "NUM2-T3-a": (p) => {
    const e = p.enunciado;
    if (p.imagen?.tipo === "monedas") return salida(p, valorMonedas(p.imagen));
    const t = /vale (\d+) en total/.exec(e);
    if (t !== null) return opcionQue(p, (o) => valorMonedas(o.imagen) === Number(t[1]));
    const m = Math.max(...ops(p).map((o) => valorMonedas(o.imagen)));
    return opcionQue(p, (o) => valorMonedas(o.imagen) === m);
  },
  "NUM2-T3-b": (p) => {
    const e = p.enunciado;
    const precio = Number(/(?:cuesta|precio es) (\d+)/.exec(e)?.[1]);
    if (e.includes("Toca")) return opcionQue(p, (o) => valorMonedas(o.imagen) === precio);
    const v = /Solo tienes monedas de (\d+)/.exec(e);
    if (v !== null) return salida(p, precio / Number(v[1]));
    const t = valorMonedas(p.imagen);
    if (e.includes("qué moneda falta") || e.includes("Qué moneda falta")) return `Una moneda de ${precio - t}`;
    return t > precio ? "Te sobra dinero" : t < precio ? "Te falta dinero" : "Tienes lo justo";
  },
  "NUM2-T3-c": (p) => {
    const e = p.enunciado;
    const i = p.imagen;
    if (i?.tipo === "cartel") {
      const pagado = Number(/moneda de (\d+)/.exec(e)?.[1]);
      const compra = /Compras (.+) y pagas/.exec(e)?.[1] ?? fallo(p);
      const coste = sum(i.lineas.filter((l) => compra.includes(sin((l.split(":")[0] as string)) ) || sin(compra).includes(sin(l.split(":")[0] as string))).map((l) => nums(l)[0] ?? 0));
      return salida(p, pagado - coste);
    }
    const pagado = valorMonedas(i);
    const dev = /Te devuelven (\d+)/.exec(e);
    if (dev !== null) return salida(p, pagado - Number(dev[1]));
    const precio = Number(/cuesta (\d+)/.exec(e)?.[1]);
    if (e.includes("Toca")) return opcionQue(p, (o) => valorMonedas(o.imagen) === pagado - precio);
    return salida(p, pagado - precio);
  },
  "NUM2-T4-a": (p) => {
    const e = p.enunciado;
    const i = p.imagen;
    if (i?.tipo === "reloj") return etiquetaHora(i.hora, i.minuto);
    const dig = /(\d+):(\d+)/.exec(e);
    if (dig !== null) return etiquetaHora(Number(dig[1]), Number(dig[2]));
    const agujas = /larga señala el (\d+) y la aguja corta (señala el|está entre el) (\d+)/.exec(e);
    if (agujas !== null) return etiquetaHora(Number(agujas[3]), agujas[1] === "12" ? 0 : 30);
    const h = horaDe(e) ?? fallo(p);
    return opcionQue(p, (o) => o.imagen?.tipo === "reloj" && o.imagen.hora === h[0] && o.imagen.minuto === h[1]);
  },
  "NUM2-T4-b": (p) => {
    const e = p.enunciado;
    const i = p.imagen;
    if (i?.tipo === "tabla") {
      const celdas = i.filas.flatMap((f) => f.map((c, col) => ({ c, col })));
      const cuantos = /¿Cuántos (\S+) tiene/.exec(e)?.[1];
      if (cuantos !== undefined) {
        const col = ABREV.findIndex((a) => sin(cuantos).startsWith(sin(a)));
        return String(celdas.filter((x) => x.col === col && x.c !== "").length);
      }
      const hoy = /Hoy es día (\d+)/.exec(e);
      if (hoy !== null) return String(Number(hoy[1]) + 7);
      const n = /es el día (\d+)/.exec(e)?.[1] ?? fallo(p);
      const col = celdas.find((x) => x.c === n)?.col ?? fallo(p);
      return cap(DIAS[col] as string);
    }
    const m = (j: number): string => cap(MESES[mod(j, 12)] as string);
    const vecino = /va (justo después de|justo antes de|dos meses después de) (\S+)\?/.exec(e);
    if (vecino !== null) {
      const j = MESES.indexOf(vecino[2] as string);
      return m(j + (vecino[1] === "justo después de" ? 1 : vecino[1] === "justo antes de" ? -1 : 2));
    }
    const qm = /qué mes es el número (\d+)/.exec(e);
    if (qm !== null) return m(Number(qm[1]) - 1);
    const qn = /qué número de mes es (\S+)\?/.exec(e);
    if (qn !== null) return salida(p, MESES.indexOf(qn[1] as string) + 1);
    const dm = /días tiene el mes de (\S+)\?/.exec(e);
    if (dm !== null) return salida(p, diasDelMes(MESES.indexOf(dm[1] as string)));
    if (e.includes("días tiene una semana")) return salida(p, 7);
    if (e.includes("meses tiene un año")) return salida(p, 12);
    if (e.includes("medio año")) return salida(p, 6);
    const sem = /días hay en (\d+) semanas/.exec(e);
    if (sem !== null) return salida(p, 7 * Number(sem[1]));
    const an = /meses hay en (\d+) años/.exec(e);
    if (an !== null) return salida(p, 12 * Number(an[1]));
    return fallo(p);
  },
  "NUM2-T4-c": (p) => {
    const e = p.enunciado;
    if (p.imagen?.tipo === "reloj") {
      const { hora, minuto } = p.imagen;
      const texto = /(dentro de|hace) (una hora y media|media hora|una hora|dos horas)/.exec(e) ?? fallo(p);
      const minutos = { "una hora y media": 90, "media hora": 30, "una hora": 60, "dos horas": 120 }[texto[2] as string] ?? NaN;
      const total = mod(hora * 60 + minuto + (texto[1] === "hace" ? -minutos : minutos), 720);
      const h = Math.floor(total / 60);
      return etiquetaHora(h === 0 ? 12 : h, total % 60);
    }
    const llega = /(\S+) llega a la escuela a (las? \d+ [a-z ]+?) y (\S+) llega a (las? \d+ [a-z ]+?)\. ¿Quién llega (antes|después)/.exec(e);
    if (llega !== null) {
      const [a, b] = [horaDe(llega[2] as string), horaDe(llega[4] as string)] as [[number, number], [number, number]];
      const [va, vb] = [a[0] * 60 + a[1], b[0] * 60 + b[1]];
      if (va === vb) return "Llegan a la vez";
      return (llega[5] === "antes") === (va < vb) ? (llega[1] as string).replace(",", "") : (llega[3] as string);
    }
    const hoy = /Hoy es ([^.]+)\./.exec(e)?.[1];
    if (hoy !== undefined) {
      const n = nums(e)[0];
      const s = e.includes("mañana") ? 1 : e.includes("ayer") ? -1 : e.includes("dentro") ? (n ?? NaN) : -(n ?? NaN);
      return cap(DIAS[mod(DIAS.indexOf(hoy) + s, 7)] as string);
    }
    const mes = /Estamos en (\S+)\./.exec(e)?.[1] ?? fallo(p);
    const n = nums(e)[0] ?? NaN;
    return cap(MESES[mod(MESES.indexOf(mes) + (e.includes("dentro") ? n : -n), 12)] as string);
  },
  "NUM2-T5-a": (p) => {
    const e = p.enunciado;
    const c = cantidades(p.imagen);
    if (e.includes("en total")) return salida(p, sum(c));
    if (e.includes("Qué suma")) return c.join(" + ");
    if (e.includes("multiplicación")) return opcionQue(p, (o) => {
      const m = /^(\d+) × (\d+)$/.exec(o.texto);
      return m !== null && Number(m[1]) === c.length && Number(m[2]) === c[0];
    });
    const t = /con (\d+) grupos de (\d+)/.exec(e);
    if (t !== null) return opcionQue(p, (o) => {
      const v = cantidades(o.imagen);
      return v.length === Number(t[1]) && v.every((x) => x === Number(t[2]));
    });
    return opcionQue(p, (o) => new Set(cantidades(o.imagen)).size === 1);
  },
  "NUM2-T5-b": (p) => (p.imagen?.tipo === "serie" ? salida(p, resolverSerie(p.imagen)) : calculo(p)),
  "NUM2-T5-c": (p) => {
    const e = p.enunciado;
    const pregunta = e.indexOf("¿");
    const v = nums(e.slice(0, pregunta));
    const [g, k] = v as [number, number];
    if (e.includes("Qué operación")) return opcionQue(p, (o) => {
      const m = /^(\d+) × (\d+)$/.exec(o.texto);
      return m !== null && Number(m[1]) * Number(m[2]) === g * k && [g, k].includes(Number(m[1]));
    });
    return salida(p, g * k + (v[2] ?? 0));
  },
};

export const ORACULOS: Readonly<Record<string, Oraculo>> = O;
