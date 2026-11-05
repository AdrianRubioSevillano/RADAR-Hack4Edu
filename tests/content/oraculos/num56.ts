// Oráculos de NUM 5.º y 6.º: recalculan la respuesta solo con lo que ve el niño
// (enunciado, imagen y opciones), con aritmética racional exacta.
import type { Imagen, Pregunta } from "../../../src/content/tipos.ts";

type Oraculo = (p: Pregunta) => string;

// ---------- Racionales ----------
interface Q { readonly n: number; readonly d: number }
const mcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : mcd(b, a % b));
function q(n: number, d = 1): Q {
  if (d === 0) throw new Error("División entre cero");
  const g = mcd(n, d) * (d < 0 ? -1 : 1);
  return { n: n / g, d: d / g };
}
const mas = (a: Q, b: Q) => q(a.n * b.d + b.n * a.d, a.d * b.d);
const menos = (a: Q, b: Q) => q(a.n * b.d - b.n * a.d, a.d * b.d);
const por = (a: Q, b: Q) => q(a.n * b.n, a.d * b.d);
const entre = (a: Q, b: Q) => q(a.n * b.d, a.d * b.n);
const igual = (a: Q, b: Q) => a.n === b.n && a.d === b.d;
const cmp = (a: Q, b: Q) => a.n * b.d - b.n * a.d;
const suma = (l: readonly Q[]) => l.reduce(mas, q(0));
const pct = (p: Q, base: Q) => entre(por(p, base), q(100));

function leer(t: string): Q {
  const [e = "0", f = ""] = t.split(",");
  return q(Number(e + f), 10 ** f.length);
}

// Números del texto, en orden. Las fracciones a/b se leen con `fracciones`.
const nums = (t: string): Q[] => (t.match(/\d+(?:,\d+)?/g) ?? []).map(leer);
const fracciones = (t: string): Q[] => [...t.matchAll(/(\d+)\/(\d+)/g)].map((m) => q(Number(m[1]), Number(m[2])));
const n = (l: readonly Q[], i: number): Q => {
  const v = l[i];
  if (v === undefined) throw new Error(`Falta el dato ${i}`);
  return v;
};

function decimal(v: Q): string {
  let d = v.d;
  let c = 0;
  while (d % 10 === 0) { d /= 10; c += 1; }
  while (d % 2 === 0) { d /= 2; c += 1; }
  while (d % 5 === 0) { d /= 5; c += 1; }
  if (d !== 1) throw new Error(`Decimal no exacto: ${v.n}/${v.d}`);
  const escala = 10 ** c;
  const entero = Math.round((v.n * escala) / v.d);
  if (c === 0) return String(entero);
  const texto = String(entero).padStart(c + 1, "0");
  return `${texto.slice(0, -c)},${texto.slice(-c)}`.replace(/,?0+$/, "");
}

const textos = (p: Pregunta): string[] => (p.opciones ?? []).map((o) => o.texto);

function unica(p: Pregunta, f: (t: string) => boolean): string {
  const l = textos(p).filter(f);
  if (l.length !== 1) throw new Error(`Se esperaba una opción y hay ${l.length}: ${p.enunciado} [${textos(p).join(" | ")}]`);
  return l[0] as string;
}

function valorOpcion(t: string): Q {
  return fracciones(t)[0] ?? n(nums(t), 0);
}

// Respuesta numérica, o la única opción que vale exactamente eso.
function responde(p: Pregunta, v: Q): string {
  if (p.formato === "numero") return decimal(v);
  return unica(p, (t) => igual(valorOpcion(t), v));
}

function respondeFraccion(p: Pregunta, v: Q): string {
  return p.formato === "numero" ? `${v.n}/${v.d}` : unica(p, (t) => igual(valorOpcion(t), v));
}

function imagen<T extends Imagen["tipo"]>(p: Pregunta, tipo: T): Extract<Imagen, { tipo: T }> {
  if (p.imagen?.tipo !== tipo) throw new Error(`Se esperaba imagen ${tipo}: ${p.enunciado}`);
  return p.imagen as Extract<Imagen, { tipo: T }>;
}

type Regla = readonly [RegExp, (m: RegExpExecArray, v: Q[], p: Pregunta) => string];

function reglas(lista: readonly Regla[]): Oraculo {
  return (p) => {
    for (const [re, f] of lista) {
      const m = re.exec(p.enunciado);
      if (m !== null) return f(m, nums(p.enunciado), p);
    }
    throw new Error(`Sin regla: ${p.enunciado}`);
  };
}

// ---------- Medidas ----------
const UNIDADES: Readonly<Record<string, readonly [string, number]>> = {
  mm: ["l", 1], cm: ["l", 10], m: ["l", 1000], km: ["l", 1000000],
  g: ["p", 1], kg: ["p", 1000], t: ["p", 1000000], ml: ["c", 1], l: ["c", 1000],
  milímetros: ["l", 1], centímetros: ["l", 10], metros: ["l", 1000], kilómetros: ["l", 1000000],
  gramos: ["p", 1], kilogramos: ["p", 1000], toneladas: ["p", 1000000], mililitros: ["c", 1], litros: ["c", 1000],
};

const factor = (u: string): Q => q(UNIDADES[u]?.[1] ?? Number.NaN);

function medidas(t: string): Q[] {
  return [...t.matchAll(/(\d+(?:,\d+)?) (mm|cm|km|kg|ml|m|g|t|l)\b/g)].map((m) => por(leer(m[1] ?? "0"), factor(m[2] ?? "")));
}

// ---------- Tiempo ----------
const minutosDe = (t: string): number => {
  const [h = "0", m = "0"] = t.split(":");
  return Number(h) * 60 + Number(m);
};
const relojes = (t: string): number[] => (t.match(/\d+:\d\d/g) ?? []).map(minutosDe);
const textoHora = (m: number): string => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

function duracionDe(t: string): number {
  const h = /(\d+) h/.exec(t);
  const m = /(\d+) min/.exec(t);
  return Number(h?.[1] ?? 0) * 60 + Number(m?.[1] ?? 0);
}

// ---------- Azar ----------
function clase(casos: readonly boolean[]): string {
  return casos.every(Boolean) ? "Seguro" : casos.some(Boolean) ? "Posible" : "Imposible";
}

// Evalúa frases como "un número par mayor que 6" sobre un número.
function cumple(frase: string, x: number): boolean {
  const f = frase.toLowerCase();
  if (/par o impar/.test(f)) return true;
  if (/del 1 al 6/.test(f)) return x >= 1 && x <= 6;
  const distinto = /distinto de (\d+)/.exec(f);
  if (distinto !== null) return x !== Number(distinto[1]);
  const igualA = /igual a (\d+)/.exec(f);
  const mayor = /mayor que (\d+)/.exec(f);
  const menor = /menor que (\d+)/.exec(f);
  if (igualA !== null && mayor !== null) return x >= Number(igualA[1]);
  if (igualA !== null) return x === Number(igualA[1]);
  if (/\bpar\b/.test(f) && x % 2 !== 0) return false;
  if (/\bimpar\b/.test(f) && x % 2 !== 1) return false;
  if (mayor !== null) return x > Number(mayor[1]);
  if (menor !== null) return x < Number(menor[1]);
  const exacto = /sacar un (\d+)|^un (\d+)/.exec(f);
  if (exacto !== null) return x === Number(exacto[1] ?? exacto[2]);
  if (/\b(par|impar)\b/.test(f)) return true;
  throw new Error(`Frase sin evaluar: ${frase}`);
}

const DADO = [1, 2, 3, 4, 5, 6];

function bolas(p: Pregunta): string {
  const e = p.enunciado;
  const dentro = /hay (.*?)\. Sacas/.exec(e)?.[1] ?? "";
  const colores: Record<string, number> = {};
  const canon = (c: string) => c.replace(/s$/, "").replace(/e$/, "").replace(/a$/, "").replace(/o$/, "");
  for (const m of dentro.matchAll(/(\d+) bolas? (\p{L}+)/gu)) colores[canon(m[2] ?? "")] = Number(m[1]);
  const bolsa = Object.entries(colores).flatMap(([c, k]) => Array.from({ length: k }, () => c));
  const suceso = /Piensa en que (.*?)\. /.exec(e)?.[1] ?? "";
  if (/Sacas dos bolas/.test(e)) {
    const parejas = bolsa.flatMap((a, i) => bolsa.slice(i + 1).map((b) => [a, b] as const));
    const dos = /las dos bolas sean (\p{L}+)/u.exec(suceso);
    if (dos !== null) return clase(parejas.map(([a, b]) => a === canon(dos[1] ?? "") && b === canon(dos[1] ?? "")));
    const una = /al menos una bola sea (\p{L}+)/u.exec(suceso);
    if (una !== null) return clase(parejas.map(([a, b]) => a === canon(una[1] ?? "") || b === canon(una[1] ?? "")));
    throw new Error(`Suceso sin evaluar: ${suceso}`);
  }
  const lista = (/una bola (.*)$/.exec(suceso)?.[1] ?? "").split(/, | o /).map(canon);
  const negado = suceso.startsWith("no ");
  return clase(bolsa.map((b) => lista.includes(b) !== negado));
}

// ---------- Veredictos de «¿es razonable?» ----------
function veredicto(real: Q, mostrado: Q): string {
  if (igual(real, mostrado)) return "Sí, es razonable";
  return cmp(mostrado, real) > 0 ? "No, es demasiado grande" : "No, es demasiado pequeño";
}

const MEDIDAS: Readonly<Record<string, string>> = {
  "la altura de una puerta": "2 m", "el largo de un lápiz nuevo": "18 cm", "el agua que cabe en un vaso": "200 ml", "lo que pesa una manzana": "150 g",
  "la altura de un niño de 11 años": "1,45 m", "lo que pesa un libro de la escuela": "500 g", "la distancia que camina una persona en una hora": "5 km",
  "el agua que bebe una persona en un día": "2 l", "el tiempo que se tarda en lavarse las manos": "30 segundos", "el largo de un autobús": "12 m",
  "el agua que cabe en un cubo": "10 l", "lo que pesa una persona adulta": "70 kg", "el ancho de una hoja de cuaderno": "20 cm",
  "la altura de un edificio de 3 pisos": "10 m", "el tiempo que dura una clase en la escuela": "45 minutos",
};

// Opción con la forma «a op b», comparando operador y valores.
function expresion(p: Pregunta, op: string, a: Q, b: Q): string {
  return unica(p, (t) => {
    if (!t.includes(` ${op} `)) return false;
    const [x, y] = nums(t) as [Q, Q];
    return (igual(x, a) && igual(y, b)) || (igual(x, b) && igual(y, a));
  });
}

const TIENDAS = (a: Q, b: Q) => (cmp(a, b) < 0 ? "En la tienda A" : cmp(a, b) > 0 ? "En la tienda B" : "Cuesta lo mismo en las dos");
const rebajado = (base: Q, p: Q) => menos(base, pct(p, base));
const subido = (base: Q, p: Q) => mas(base, pct(p, base));

function filas(p: Pregunta): readonly (readonly string[])[] {
  return imagen(p, "tabla").filas;
}

function lineas(p: Pregunta): readonly string[] {
  return imagen(p, "cartel").lineas;
}

const dineroLinea = (l: string): Q => n(nums(l.split(":").slice(1).join(":")), 0);

function posicionDe(numero: string, cifra: string): string {
  const [e = "", f = ""] = numero.split(",");
  const i = f.indexOf(cifra);
  if (i === 0) return "décimas";
  if (i === 1) return "centésimas";
  return e.length - e.indexOf(cifra) === 1 ? "unidades" : "decenas";
}

function barrasDias(p: Pregunta): (dia: string) => Q {
  const b = imagen(p, "barras");
  return (dia) => q(b.valores[b.etiquetas.findIndex((e) => e.toLowerCase() === dia)] ?? Number.NaN);
}

function media(valores: readonly Q[]): Q {
  return entre(suma(valores), q(valores.length));
}

export const ORACULOS: Readonly<Record<string, Oraculo>> = {
  "NUM5-T1-a": reglas([
    [/En el número (\d+),(\d)(\d), .*lugar de las (décimas|centésimas)/, (m) => (m[4] === "décimas" ? m[2] : m[3]) ?? ""],
    [/valor tiene la cifra (\d) en el número ([\d,]+)\?/, (m) => `${m[1]} ${posicionDe(m[2] ?? "", m[1] ?? "")}`],
    [/la fracción (\d+)\/(\d+) como/, (m, _v, p) => responde(p, q(Number(m[1]), Number(m[2])))],
    [/se forma con (.*)\?/, (m, _v, p) => {
      const t = m[1] ?? "";
      const cifra = (re: RegExp) => Number(re.exec(t)?.[1] ?? 0);
      return responde(p, suma([q(cifra(/(\d) unidades/)), q(cifra(/(\d) décimas/), 10), q(cifra(/(\d) centésimas/), 100)]));
    }],
    [/La barra entera/, (_m, _v, p) => {
      const b = imagen(p, "fraccion");
      if (/centésimas/.test(p.enunciado)) return responde(p, q(b.coloreadas * 10));
      return responde(p, q(/sin colorear/.test(p.enunciado) ? b.partes - b.coloreadas : b.coloreadas, b.partes));
    }],
  ]),
  "NUM5-T1-b": reglas([
    [/es el (mayor|menor)\?/, (m, _v, p) => {
      const l = textos(p).sort((a, b) => cmp(leer(a), leer(b)));
      return (m[1] === "mayor" ? l[l.length - 1] : l[0]) ?? "";
    }],
    [/ordena de menor a mayor/, (_m, _v, p) => unica(p, (t) => {
      const [a, b, c] = nums(t) as [Q, Q, Q];
      return cmp(a, b) < 0 && cmp(b, c) < 0;
    })],
    [/([\d,]+) ___ ([\d,]+)/, (m, _v, p) => {
      const c = cmp(leer(m[1] ?? ""), leer(m[2] ?? ""));
      return unica(p, (t) => t.startsWith(c < 0 ? "<" : c > 0 ? ">" : "="));
    }],
    [/¿Quién/, (_m, _v, p) => {
      const datos = [...p.enunciado.matchAll(/(\p{L}+) (?:salta|tarda|recoge|camina) ([\d,]+)/gu)].map((m) => [m[1] ?? "", leer(m[2] ?? "")] as const);
      const l = [...datos].sort((a, b) => cmp(a[1], b[1]));
      const quiereMenor = /antes a la meta|camina menos/.test(p.enunciado);
      return (quiereMenor ? l[0] : l[l.length - 1])?.[0] ?? "";
    }],
  ]),
  "NUM5-T1-c": reglas([
    [/todo junto/, (_m, v, p) => responde(p, suma(v))],
    [/Mira el recibo\. Si se paga/, (_m, v, p) => responde(p, menos(n(v, 0), suma(lineas(p).map(dineroLinea))))],
    [/Mira el recibo/, (_m, _v, p) => responde(p, suma(lineas(p).map(dineroLinea)))],
    [/paga con/, (_m, v, p) => responde(p, menos(n(v, v.length - 1), suma(v.slice(0, -1))))],
    [/le faltan/, (_m, v, p) => responde(p, menos(n(v, 0), n(v, 1)))],
    [/monedas más cuesta/, (_m, v, p) => responde(p, menos(n(v, 0), n(v, 1)))],
  ]),
  "NUM5-T2-a": reglas([
    [/no es equivalente a (\d+)\/(\d+)/, (m, _v, p) => unica(p, (t) => !igual(valorOpcion(t), q(Number(m[1]), Number(m[2]))))],
    [/es equivalente a (\d+)\/(\d+)\?/, (m, _v, p) => responde(p, q(Number(m[1]), Number(m[2])))],
    [/igualdad: (\d+)\/(\d+) = (\d+|\?)\/(\d+|\?)\./, (m) => {
      const f = q(Number(m[1]), Number(m[2]));
      return String(m[3] === "?" ? (Number(m[4]) * f.n) / f.d : (Number(m[3]) * f.d) / f.n);
    }],
    [/Simplifica la fracción (\d+)\/(\d+)/, (m, _v, p) => respondeFraccion(p, q(Number(m[1]), Number(m[2])))],
    [/parte coloreada/, (_m, _v, p) => {
      const b = imagen(p, "fraccion");
      return responde(p, q(b.coloreadas, b.partes));
    }],
  ]),
  "NUM5-T2-b": reglas([
    [/Completa la suma: (.*) = (\d+)\/\d+\./, (m) => {
      const conocidos = (m[1] ?? "").split(" + ").filter((t) => !t.startsWith("?")).map((t) => Number(t.split("/")[0]));
      return String(Number(m[2]) - conocidos.reduce((s, x) => s + x, 0));
    }],
    [/queda sin/, (_m, _v, p) => respondeFraccion(p, menos(q(1), suma(fracciones(p.enunciado))))],
    [/./, (_m, _v, p) => respondeFraccion(p, suma(fracciones(p.enunciado)))],
  ]),
  "NUM5-T2-c": reglas([
    [/¿Cuánto es (\d+)\/(\d+) de (\d+)\?/, (m, _v, p) => responde(p, por(q(Number(m[1]), Number(m[2])), q(Number(m[3]))))],
    [/del dibujo/, (_m, _v, p) => {
      const total = q(imagen(p, "objetos").grupos[0]?.cantidad ?? Number.NaN);
      const parte = por(n(fracciones(p.enunciado), 0), total);
      return responde(p, /quitas/.test(p.enunciado) ? menos(total, parte) : parte);
    }],
    [/llevan gorro\. Esos \d+\/\d+ son (\d+)/, (m, _v, p) => responde(p, entre(q(Number(m[1])), n(fracciones(p.enunciado), 0)))],
    [/tiene (\d+) monedas y gasta/, (m, _v, p) => responde(p, por(q(Number(m[1])), menos(q(1), n(fracciones(p.enunciado), 0))))],
    [/^Hay (\d+) /, (m, _v, p) => responde(p, por(q(Number(m[1])), n(fracciones(p.enunciado), 0)))],
  ]),
  "NUM5-T3-a": reglas([
    [/¿Cuánto es el (\d+) % de (\d+)\?/, (m, _v, p) => responde(p, pct(q(Number(m[1])), q(Number(m[2]))))],
    [/fracción es igual al (\d+) %/, (m, _v, p) => responde(p, q(Number(m[1]), 100))],
    [/porcentaje es igual a la fracción (\d+)\/(\d+)/, (m, _v, p) => responde(p, q(Number(m[1]) * 100, Number(m[2])))],
    [/porcentaje está coloreado/, (_m, _v, p) => {
      const b = imagen(p, "fraccion");
      return responde(p, q(b.coloreadas * 100, b.partes));
    }],
    [/Para calcular el (\d+) % de (\d+)/, (m) => `Dividir ${m[2]} entre ${100 / Number(m[1])}`],
    [/^Hay (\d+) .*El (\d+) % .*¿\p{L}+ \p{L}+ (no )?/u, (m, _v, p) => {
      const base = q(Number(m[1]));
      const parte = pct(q(Number(m[2])), base);
      return responde(p, m[3] === undefined ? parte : menos(base, parte));
    }],
  ]),
  "NUM5-T3-b": reglas([
    [/te descuentan/, (_m, v, p) => responde(p, pct(n(v, 1), n(v, 0)))],
    [/¿Cuánto pagas/, (_m, v, p) => responde(p, rebajado(n(v, 0), n(v, 1)))],
    [/Mira la etiqueta/, (_m, _v, p) => {
      const l = lineas(p);
      return responde(p, rebajado(dineroLinea(l[1] ?? ""), dineroLinea(l[2] ?? "")));
    }],
    [/ahora cuesta/, (_m, v, p) => responde(p, entre(por(menos(n(v, 0), n(v, 1)), q(100)), n(v, 0)))],
  ]),
  "NUM5-T3-c": reglas([
    [/^Cada .*Compras/, (_m, v, p) => responde(p, rebajado(por(n(v, 0), n(v, 1)), n(v, 2)))],
    [/le sobran/, (_m, v, p) => responde(p, menos(n(v, 0), rebajado(n(v, 1), n(v, 2))))],
    [/por las dos cosas/, (_m, v, p) => responde(p, mas(rebajado(n(v, 0), n(v, 1)), n(v, 2)))],
    [/¿Dónde cuesta menos/, (_m, v) => TIENDAS(rebajado(n(v, 0), n(v, 1)), n(v, 2))],
    [/le devuelven/, (_m, v, p) => responde(p, menos(n(v, 2), rebajado(n(v, 0), n(v, 1))))],
  ]),
  "NUM5-T4-a": reglas([
    [/Mira el rectángulo/, (_m, _v, p) => {
      const r = imagen(p, "rectangulo");
      return responde(p, q(Math.round((r.ancho + r.alto) * 200), 100));
    }],
    [/Cada lado de un cuadrado/, (_m, v, p) => responde(p, por(n(v, 0), q(4)))],
    [/perímetro de un cuadrado/, (_m, v, p) => responde(p, entre(n(v, 0), q(4)))],
    [/Un triángulo/, (_m, v, p) => responde(p, suma(v))],
    [/Todos los lados/, (_m, v, p) => responde(p, por(n(v, 0), n(v, 1)))],
    [/se dejan/, (_m, v, p) => responde(p, menos(por(mas(n(v, 0), n(v, 1)), q(2)), n(v, 2)))],
    [/rodearlo/, (_m, v, p) => responde(p, por(mas(n(v, 0), n(v, 1)), q(2)))],
    [/lado corto/, (_m, v, p) => responde(p, entre(menos(n(v, 0), por(n(v, 1), q(2))), q(2)))],
  ]),
  "NUM5-T4-b": reglas([
    [/Mira el rectángulo/, (_m, _v, p) => {
      const r = imagen(p, "rectangulo");
      return responde(p, q(Math.round(r.ancho * 100) * Math.round(r.alto * 100), 10000));
    }],
    [/Cada lado de un cuadrado/, (_m, v, p) => responde(p, por(n(v, 0), n(v, 0)))],
    [/área de un cuadrado/, (_m, v, p) => responde(p, q(Math.round(Math.sqrt(n(v, 0).n))))],
    [/área de un rectángulo/, (_m, v, p) => responde(p, entre(n(v, 0), n(v, 1)))],
    [/se siembran (\d+) plantas/, (_m, v, p) => responde(p, por(por(n(v, 0), n(v, 1)), n(v, 2)))],
    [/largo y/, (_m, v, p) => responde(p, por(n(v, 0), n(v, 1)))],
  ]),
  "NUM5-T4-c": reglas([
    [/¿Cuánt[oa]s (\p{L}+) son ([\d,]+) (\p{L}+)\?/u, (m, _v, p) => responde(p, entre(por(leer(m[2] ?? ""), factor(m[3] ?? "")), factor(m[1] ?? "")))],
    [/¿Cuál/, (_m, _v, p) => {
      const [a, b] = medidas(p.enunciado) as [Q, Q];
      const textosM = [...p.enunciado.matchAll(/\d+(?:,\d+)? (?:cm|kg|ml|m|g|l)\b/g)].map((x) => x[0]);
      const c = cmp(a, b);
      return unica(p, (t) => (c === 0 ? /lo mismo/.test(t) : t.endsWith(` ${textosM[c > 0 ? 0 : 1] ?? ""}`)));
    }],
    [/¿Cuántos (\p{L}+) quedan\?/u, (m, _v, p) => {
      const [a, b] = medidas(p.enunciado) as [Q, Q];
      return responde(p, entre(menos(a, b), factor(m[1] ?? "")));
    }],
  ]),
  "NUM5-T5-a": reglas([
    [/recoge|vende (\d+) cuadernos el lunes|km por la mañana/, (_m, v, p) => expresion(p, "+", n(v, 0), n(v, 1))],
    [/Eso es \d+ monedas más/, (_m, v, p) => expresion(p, "−", n(v, 0), n(v, 1))],
    [/Eso es \d+ monedas menos/, (_m, v, p) => expresion(p, "+", n(v, 0), n(v, 1))],
    [/van \d+ personas y bajan/, (_m, v, p) => expresion(p, "−", n(v, 0), n(v, 1))],
    [/asientos y sale con/, (_m, v, p) => expresion(p, "−", n(v, 1), n(v, 2))],
    [/tenía .* y gasta/, (_m, v, p) => expresion(p, "−", n(v, 0), n(v, 1))],
    [/cajas con|filas con|camina \d+ km cada día/, (_m, v, p) => expresion(p, "×", n(v, 0), n(v, 1))],
    [/^Cada .* compra/, (_m, v, p) => expresion(p, "×", n(v, 0), n(v, 1))],
    [/mesas\. Se reparten/, (_m, v, p) => expresion(p, "÷", n(v, 1), n(v, 2))],
    [/para repartir|se guardan en cajas/, (_m, v, p) => expresion(p, "÷", n(v, 0), n(v, 1))],
    [/amigos pagan/, (_m, v, p) => expresion(p, "÷", n(v, 1), n(v, 0))],
  ]),
  "NUM5-T5-b": reglas([
    [/^Cada .* y cada /, (_m, v, p) => responde(p, mas(por(n(v, 0), n(v, 2)), por(n(v, 1), n(v, 3))))],
    [/^Cada .*paga con/, (_m, v, p) => responde(p, menos(n(v, 2), por(n(v, 0), n(v, 1))))],
    [/Juntan todos/, (_m, v, p) => responde(p, entre(mas(n(v, 0), n(v, 1)), n(v, 2)))],
    [/sueltos/, (_m, v, p) => responde(p, mas(por(n(v, 0), n(v, 1)), n(v, 2)))],
    [/Un grupo de/, (_m, v, p) => responde(p, entre(menos(n(v, 1), n(v, 2)), n(v, 0)))],
    [/segunda parada/, (_m, v, p) => responde(p, menos(mas(menos(n(v, 0), n(v, 1)), n(v, 2)), n(v, 3)))],
    [/autobús/, (_m, v, p) => responde(p, mas(menos(n(v, 0), n(v, 1)), n(v, 2)))],
  ]),
  "NUM5-T5-c": reglas([
    [/razonable para ([\d,]+) × ([\d,]+)\?/, (m, _v, p) => responde(p, por(leer(m[1] ?? ""), leer(m[2] ?? "")))],
    [/ha calculado que ([\d,]+) ([+×]) ([\d,]+) = ([\d,]+)/, (m) => {
      const [a, b] = [leer(m[1] ?? ""), leer(m[3] ?? "")];
      return veredicto(m[2] === "+" ? mas(a, b) : por(a, b), leer(m[4] ?? ""));
    }],
    [/Se reparten/, (_m, v) => veredicto(entre(n(v, 0), n(v, 1)), n(v, 2))],
    [/autobús recorre/, (_m, v) => veredicto(por(n(v, 0), n(v, 1)), n(v, 2))],
    [/le devuelven/, (_m, v) => veredicto(menos(n(v, 2), por(n(v, 0), n(v, 1))), n(v, 3))],
    [/Un huerto/, (_m, v) => veredicto(por(n(v, 0), n(v, 1)), n(v, 2))],
    [/descuento del/, (_m, v) => veredicto(rebajado(n(v, 0), n(v, 1)), n(v, 2))],
    [/va a pie/, (_m, v) => veredicto(pct(n(v, 1), n(v, 0)), n(v, 2))],
    [/medida es razonable para (.*)\?/, (m) => MEDIDAS[m[1] ?? ""] ?? ""],
  ]),
  "NUM6-T1-a": reglas([
    [/En esta tabla/, (_m, _v, p) => {
      const [a, , c] = filas(p) as [readonly string[], readonly string[], readonly string[]];
      return responde(p, por(entre(leer(a[1] ?? ""), leer(a[0] ?? "")), leer(c[0] ?? "")));
    }],
    [/cada .*\?$/, (_m, v, p) => responde(p, entre(n(v, 1), n(v, 0)))],
    [/mismo precio por unidad/, (_m, v, p) => responde(p, por(entre(n(v, 1), n(v, 0)), n(v, 2)))],
    [/kg de/, (_m, v, p) => responde(p, entre(n(v, 2), entre(n(v, 1), n(v, 0))))],
  ]),
  "NUM6-T1-b": reglas([
    [/Mira la receta\. ¿Cuántos gramos de (\p{L}+) hacen falta para (\d+)/u, (m, _v, p) => {
      const c = imagen(p, "cartel");
      const personas = n(nums(c.titulo), 0);
      const linea = c.lineas.find((l) => l.toLowerCase().startsWith(m[1] ?? "")) ?? "";
      return responde(p, por(entre(dineroLinea(linea), personas), q(Number(m[2]))));
    }],
    [/^Para preparar agua/, (_m, v, p) => responde(p, por(entre(n(v, 1), n(v, 0)), n(v, 2)))],
    [/^Para \d+ personas/, (_m, v, p) => responde(p, por(entre(n(v, 1), n(v, 0)), n(v, 2)))],
    [/^Con \d+ gramos/, (_m, v, p) => responde(p, entre(n(v, 2), entre(n(v, 0), n(v, 1))))],
    [/se mezclan? (\d+) botes? de azul por cada (?:(\d+) botes|bote) de amarillo\. Si usas (\d+)/, (m, _v, p) => responde(p, entre(por(q(Number(m[3])), q(Number(m[2] ?? 1))), q(Number(m[1]))))],
  ]),
  "NUM6-T1-c": reglas([
    [/Oferta A/, (_m, v, p) => {
      const c = cmp(entre(n(v, 1), n(v, 0)), entre(n(v, 3), n(v, 2)));
      return unica(p, (t) => (c < 0 ? t === "La oferta A" : c > 0 ? t === "La oferta B" : /lo mismo/.test(t)));
    }],
    [/botella de aceite/, (_m, v, p) => {
      const [a, b] = [entre(n(v, 1), n(v, 0)), entre(n(v, 3), n(v, 2))];
      return responde(p, cmp(a, b) < 0 ? a : b);
    }],
    [/pagas solo 2/, (_m, v, p) => {
      const d = menos(por(n(v, 1), q(2)), por(n(v, 4), q(3)));
      return responde(p, q(Math.abs(d.n), d.d));
    }],
    [/tres puestos/, (_m, _v, p) => {
      const l = filas(p).map((f) => [f[0] ?? "", entre(leer(f[2] ?? ""), leer(f[1] ?? ""))] as const).sort((a, b) => cmp(a[1], b[1]));
      return l[0]?.[0] ?? "";
    }],
  ]),
  "NUM6-T2-a": reglas([
    [/¿Cuánto es el/, (_m, v, p) => responde(p, pct(n(v, 0), n(v, 1)))],
    [/^Hay \d+ /, (_m, v, p) => responde(p, pct(n(v, 1), n(v, 0)))],
    [/preguntas/, (_m, v, p) => responde(p, entre(por(n(v, 1), q(100)), n(v, 0)))],
    [/número decimal es igual al/, (_m, v, p) => responde(p, entre(n(v, 0), q(100)))],
    [/El número ([\d,]+) es igual/, (_m, v, p) => responde(p, por(n(v, 0), q(100)))],
    [/La barra/, (_m, _v, p) => {
      const b = imagen(p, "fraccion");
      return responde(p, q(b.coloreadas * 100, b.partes));
    }],
  ]),
  "NUM6-T2-b": reglas([
    [/baja un (\d+) % y después sube/, (_m, v, p) => responde(p, mas(rebajado(n(v, 0), n(v, 1)), n(v, 2)))],
    [/baja un (\d+) % y después baja/, (_m, v, p) => responde(p, menos(rebajado(n(v, 0), n(v, 1)), n(v, 2)))],
    [/sube un (\d+) % y después/, (_m, v, p) => responde(p, rebajado(subido(n(v, 0), n(v, 1)), n(v, 2)))],
    [/precio baja un/, (_m, v, p) => responde(p, rebajado(n(v, 0), n(v, 1)))],
    [/precio sube un/, (_m, v, p) => responde(p, subido(n(v, 0), n(v, 1)))],
    [/ahora cuesta/, (_m, v, p) => {
      const d = menos(n(v, 0), n(v, 1));
      return responde(p, entre(por(q(Math.abs(d.n), d.d), q(100)), n(v, 0)));
    }],
    [/Mira el aviso de la tienda\. ¿Cuántas monedas costará (?:el|la) (.*) con/, (m, _v, p) => {
      const c = imagen(p, "cartel");
      const linea = c.lineas.find((l) => l.toLowerCase().startsWith(`${m[1] ?? ""}:`)) ?? "";
      const porcentaje = n(nums(c.titulo), 0);
      return responde(p, /suben/.test(c.titulo) ? subido(dineroLinea(linea), porcentaje) : rebajado(dineroLinea(linea), porcentaje));
    }],
  ]),
  "NUM6-T2-c": reglas([
    [/transporte/, (_m, v) => TIENDAS(subido(n(v, 0), n(v, 1)), rebajado(n(v, 2), n(v, 3)))],
    [/¿Dónde es menor/, (_m, v) => TIENDAS(rebajado(n(v, 0), n(v, 1)), rebajado(n(v, 2), n(v, 3)))],
    [/ahorras/, (_m, v, p) => {
      const d = menos(rebajado(n(v, 0), n(v, 1)), rebajado(n(v, 2), n(v, 3)));
      return responde(p, q(Math.abs(d.n), d.d));
    }],
    [/Puedes elegir/, (_m, v, p) => {
      const c = cmp(pct(n(v, 1), n(v, 0)), n(v, 2));
      return unica(p, (t) => (c === 0 ? /lo mismo/.test(t) : c > 0 ? t.includes(" %") : t.includes("monedas") || t.includes("moneda")));
    }],
    [/tres tiendas/, (_m, _v, p) => {
      const l = filas(p).map((f) => [f[0] ?? "", rebajado(leer(f[1] ?? ""), n(nums(f[2] ?? ""), 0))] as const).sort((a, b) => cmp(a[1], b[1]));
      return l[0]?.[0] ?? "";
    }],
  ]),
  "NUM6-T3-a": reglas([
    [/cuentas de una familia/, (_m, _v, p) => {
      const de = (tipo: string) => suma(filas(p).filter((f) => f[1] === tipo).map((f) => leer(f[2] ?? "")));
      return responde(p, menos(de("Ingreso"), de("Gasto")));
    }],
    [/Un puesto vende/, (_m, v, p) => responde(p, menos(por(n(v, 0), n(v, 1)), n(v, 2)))],
    [/Una familia ingresa/, (_m, v, p) => {
      const d = menos(n(v, 0), suma(v.slice(1)));
      const m = decimal(q(Math.abs(d.n), d.d));
      return unica(p, (t) => (d.n === 0 ? t === "No sobra ni falta nada" : t === `${d.n > 0 ? "Sobran" : "Faltan"} ${m} monedas`));
    }],
    [/la caja de la tienda/, (_m, _v, p) => {
      const l = lineas(p);
      const de = (pre: string) => suma(l.filter((x) => x.startsWith(pre)).map(dineroLinea));
      return responde(p, menos(mas(de("Al empezar"), de("Entra")), de("Sale")));
    }],
  ]),
  "NUM6-T3-b": reglas([
    [/dentro de/, (_m, v, p) => responde(p, mas(n(v, 0), por(n(v, 1), n(v, 2))))],
    [/recibe \d+ monedas al mes y gasta/, (_m, v, p) => responde(p, por(menos(n(v, 0), n(v, 1)), n(v, 2)))],
    [/recibe \d+ monedas al mes y ahorra el/, (_m, v, p) => responde(p, por(pct(n(v, 1), n(v, 0)), n(v, 2)))],
    [/El gráfico/, (_m, v, p) => responde(p, menos(n(v, 0), suma(imagen(p, "barras").valores.map((x) => q(x)))))],
    [/como mínimo/, (_m, v, p) => {
      const s = entre(menos(n(v, 0), n(v, 1)), n(v, 2));
      return responde(p, q(Math.ceil(s.n / s.d)));
    }],
    [/ya tiene/, (_m, v, p) => responde(p, entre(menos(n(v, 0), n(v, 1)), n(v, 2)))],
    [/tarda en reunir/, (_m, v, p) => responde(p, entre(n(v, 0), n(v, 1)))],
    [/ahorra .* cada semana\. ¿Cuántas monedas ahorra en/, (_m, v, p) => responde(p, por(n(v, 0), n(v, 1)))],
  ]),
  "NUM6-T3-c": reglas([
    [/¿Qué dos cosas/, (_m, v, p) => {
      const [limite, a, b, c] = [n(v, 0), n(v, 1), n(v, 2), n(v, 3)];
      const nombres = [...p.enunciado.matchAll(/(?:Un|Una|un|una) ([\p{L} ]+?) cuesta/gu)].map((m) => (m[1] ?? "").toLowerCase());
      const posibles = [[0, 1, mas(a, b)], [0, 2, mas(a, c)], [1, 2, mas(b, c)]] as const;
      const validas = posibles.filter(([, , t]) => cmp(t, limite) <= 0);
      if (validas.length !== 1) throw new Error(`Parejas válidas: ${validas.length}`);
      const [i, j] = validas[0] as readonly [number, number, Q];
      return unica(p, (t) => t.toLowerCase() === `${nombres[i] ?? ""} y ${nombres[j] ?? ""}`);
    }],
    [/pagos de/, (_m, v, p) => responde(p, menos(por(n(v, 1), n(v, 2)), n(v, 0)))],
    [/Alquilar/, (_m, v, p) => responde(p, entre(n(v, 1), n(v, 0)))],
    [/zapatos A/, (_m, v, p) => {
      const c = cmp(entre(n(v, 0), n(v, 1)), entre(n(v, 2), n(v, 3)));
      return unica(p, (t) => (c < 0 ? t === "Los zapatos A" : c > 0 ? t === "Los zapatos B" : /lo mismo/.test(t)));
    }],
    [/dentro de/, (_m, v, p) => {
      const [tiene, s, precio, k] = [n(v, 0), n(v, 1), n(v, 2), n(v, 3)];
      const d = menos(mas(tiene, por(s, k)), precio);
      const m = decimal(q(Math.abs(d.n), d.d));
      return unica(p, (t) => t === (d.n >= 0 ? `Sí, y le sobran ${m} monedas` : `No, le faltan ${m} monedas`));
    }],
  ]),
  "NUM6-T4-a": reglas([
    [/¿Cuánt[oa]s (\p{L}+) son en total (\d+) (\p{L}+) y (\d+) (\p{L}+)\?/u, (m, _v, p) => responde(p, entre(mas(por(q(Number(m[2])), factor(m[3] ?? "")), por(q(Number(m[4])), factor(m[5] ?? ""))), factor(m[1] ?? "")))],
    [/¿Cuánt[oa]s (\p{L}+) son ([\d,]+) (\p{L}+)\?/u, (m, _v, p) => responde(p, entre(por(leer(m[2] ?? ""), factor(m[3] ?? "")), factor(m[1] ?? "")))],
    [/medidas es la (mayor|menor)/, (m, _v, p) => {
      const l = textos(p).sort((a, b) => cmp(n(medidas(a), 0), n(medidas(b), 0)));
      return (m[1] === "mayor" ? l[l.length - 1] : l[0]) ?? "";
    }],
    [/¿Cuánt\p{L}+ \p{L}+ (?:se llenan|salen)\?/u, (_m, _v, p) => {
      const [a, b] = medidas(p.enunciado) as [Q, Q];
      return responde(p, entre(a, b));
    }],
    [/¿Cuántos (\p{L}+) (?:pesan|hay en|miden) (\d+)/u, (m, _v, p) => responde(p, entre(por(n(medidas(p.enunciado), 0), q(Number(m[2]))), factor(m[1] ?? "")))],
  ]),
  "NUM6-T4-b": reglas([
    [/Sabes que .*¿Cuánt[oa]s (\p{L}+) son (\d+) (\p{L}+)\?/u, (m, _v, p) => {
      const f: Record<string, number> = { "días>minutos": 1440, "semanas>horas": 168, "horas>segundos": 3600 };
      return responde(p, q(Number(m[2]) * (f[`${m[3]}>${m[1]}`] ?? Number.NaN)));
    }],
    [/¿Cuántos minutos son (\d+) horas y (\d+) minutos/, (m, _v, p) => responde(p, q(Number(m[1]) * 60 + Number(m[2])))],
    [/¿Cuántos minutos son ([\d,]+) horas/, (m, _v, p) => responde(p, por(leer(m[1] ?? ""), q(60)))],
    [/¿Cuántas horas y minutos son (\d+) minutos/, (m, _v, p) => unica(p, (t) => duracionDe(t) === Number(m[1]))],
    [/Mira el horario/, (_m, _v, p) => {
      const [a, b] = lineas(p).flatMap((l) => relojes(l)) as [number, number];
      return responde(p, q(b - a));
    }],
    [/empieza una tarea a las (\d+:\d\d) y tarda (.*)\. ¿A qué hora/, (m) => textoHora(minutosDe(m[1] ?? "") + duracionDe(m[2] ?? ""))],
    [/¿Cuánt[oa]s (\p{L}+) son (\d+) (\p{L}+)(?: y (\d+) \p{L}+)?\?/u, (m, _v, p) => {
      const f: Record<string, number> = { "semanas>días": 7, "días>horas": 24, "años>meses": 12, "minutos>segundos": 60 };
      return responde(p, q(Number(m[2]) * (f[`${m[3]}>${m[1]}`] ?? Number.NaN) + Number(m[4] ?? 0)));
    }],
  ]),
  "NUM6-T4-c": reglas([
    [/Mira el rectángulo/, (_m, _v, p) => {
      const r = imagen(p, "rectangulo");
      return responde(p, q(Math.round(r.ancho * 100) * Math.round(r.alto * 100), 10000));
    }],
    [/Un triángulo tiene \d+ cm de base/, (_m, v, p) => responde(p, entre(por(n(v, 0), n(v, 1)), q(2)))],
    [/Un triángulo tiene \d+ cm² de área/, (_m, v, p) => responde(p, entre(por(n(v, 0), q(2)), n(v, 1)))],
    [/Un rectángulo tiene/, (_m, v, p) => responde(p, entre(n(v, 0), n(v, 1)))],
    [/base cuadrada/, (_m, v, p) => responde(p, menos(por(n(v, 0), n(v, 1)), por(n(v, 2), n(v, 2))))],
    [/dos rectángulos/, (_m, v, p) => responde(p, mas(por(n(v, 0), n(v, 1)), por(n(v, 2), n(v, 3))))],
    [/baldosas/, (_m, v, p) => {
      const lado = entre(n(v, 2), q(100));
      return responde(p, por(entre(n(v, 0), lado), entre(n(v, 1), lado)));
    }],
    [/2 paredes/, (_m, v, p) => responde(p, por(por(n(v, 0), por(n(v, 1), n(v, 2))), n(v, 3)))],
    [/una pared/, (_m, v, p) => responde(p, por(por(n(v, 0), n(v, 1)), n(v, 2)))],
  ]),
  "NUM6-T5-a": reglas([
    [/El gráfico/, (_m, _v, p) => responde(p, media(imagen(p, "barras").valores.map((x) => q(x))))],
    [/¿Cuál es la media de/, (_m, v, p) => responde(p, media(v))],
    [/La media de (\d+) números es (\d+)/, (_m, v, p) => responde(p, menos(por(n(v, 0), n(v, 1)), suma(v.slice(2))))],
    [/lo reparten por igual/, (_m, v, p) => responde(p, media(v))],
  ]),
  "NUM6-T5-b": reglas([
    [/Mira el gráfico\. ¿Cuántos \p{L}+ [\p{L} ]+ el (\p{L}+)\?/u, (m, _v, p) => responde(p, barrasDias(p)(m[1] ?? ""))],
    [/¿Qué día \p{L}+ \p{L}+ más/u, (_m, _v, p) => {
      const b = imagen(p, "barras");
      return b.etiquetas[b.valores.indexOf(Math.max(...b.valores))] ?? "";
    }],
    [/segundo lugar/, (_m, _v, p) => {
      const b = imagen(p, "barras");
      const l = [...b.valores].sort((x, y) => y - x);
      return b.etiquetas[b.valores.indexOf(l[1] ?? Number.NaN)] ?? "";
    }],
    [/del (\p{L}+) y el (\p{L}+) juntos y los \p{L}+ del (\p{L}+)\?/u, (m, _v, p) => {
      const v = barrasDias(p);
      const d = menos(mas(v(m[1] ?? ""), v(m[2] ?? "")), v(m[3] ?? ""));
      return responde(p, q(Math.abs(d.n), d.d));
    }],
    [/entre el (\p{L}+) y el (\p{L}+)\?/u, (m, _v, p) => {
      const v = barrasDias(p);
      const d = menos(v(m[1] ?? ""), v(m[2] ?? ""));
      return responde(p, q(Math.abs(d.n), d.d));
    }],
    [/en total esos días/, (_m, _v, p) => responde(p, suma(imagen(p, "barras").valores.map((x) => q(x))))],
    [/corresponde al (\p{L}+)\?/u, (m, v, p) => responde(p, entre(por(barrasDias(p)(m[1] ?? ""), q(100)), n(v, 0)))],
  ]),
  "NUM6-T5-c": reglas([
    [/bolsa/, (_m, _v, p) => bolas(p)],
    [/Lanzas dos dados .* la suma (.*?)\. /, (m) => clase(DADO.flatMap((a) => DADO.map((b) => cumple(m[1] ?? "", a + b))))],
    [/¿Cuál de estos sucesos es (imposible|seguro)\?/, (m, _v, p) => unica(p, (t) => clase(DADO.map((x) => cumple(t, x))) === (m[1] === "seguro" ? "Seguro" : "Imposible"))],
    [/Lanzas un dado .*Piensa en sacar (.*?)\. /, (m) => clase(DADO.map((x) => cumple(m[1] ?? "", x)))],
    [/tarjetas con estos números: (.*?)\. Sacas.*Piensa en sacar (.*?)\. /, (m) => clase(nums(m[1] ?? "").map((x) => cumple(m[2] ?? "", x.n)))],
  ]),
};

