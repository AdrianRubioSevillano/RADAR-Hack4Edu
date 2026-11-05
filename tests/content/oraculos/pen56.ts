// Oráculos de PEN 5.º y 6.º: leen enunciado e imagen y recalculan sin usar el generador.
import { NOMBRES } from "../../../src/content/ayuda.ts";
import type { Pregunta } from "../../../src/content/tipos.ts";

type Oraculo = (p: Pregunta) => string;

function perms<T>(l: readonly T[]): T[][] {
  if (l.length <= 1) return [[...l]];
  return l.flatMap((x, i) => perms([...l.slice(0, i), ...l.slice(i + 1)]).map((r) => [x, ...r]));
}

function lineas(p: Pregunta): readonly string[] {
  if (p.imagen?.tipo !== "cartel") throw new Error("sin cartel");
  return p.imagen.lineas;
}

function nombresEn(t: string): string[] {
  return NOMBRES.filter((n) => new RegExp(`(^|[^\\p{L}])${n}([^\\p{L}]|$)`, "u").test(t)).sort((a, b) => t.indexOf(a) - t.indexOf(b));
}

function unica<T>(sols: readonly T[]): T {
  if (sols.length !== 1) throw new Error(`Soluciones: ${sols.length}`);
  return sols[0] as T;
}

const ORD: Readonly<Record<string, number>> = { primer: 0, primera: 0, segundo: 1, segunda: 1, tercer: 2, tercera: 2, cuarto: 3, cuarta: 3, quinto: 4, quinta: 4 };

function lugarDe(t: string, n: number): number | null {
  if (/últim[oa]/.test(t)) return n - 1;
  const m = /\b(primera?|segund[oa]|tercera?|cuart[oa]|quint[oa])\b (lugar|casa)/.exec(t);
  return m === null ? null : (ORD[m[1] as string] as number);
}

const ordenar: Oraculo = (p) => {
  const inicio = p.enunciado.split(".")[0] ?? "";
  const gente = nombresEn(inicio);
  const n = gente.length;
  const ok = (o: readonly string[], l: string): boolean => {
    const [a, b] = nombresEn(l) as [string, string | undefined];
    const pa = o.indexOf(a);
    if (/^Entre/.test(l)) return Math.abs(pa - o.indexOf(b ?? "")) === 2;
    const lugar = lugarDe(l, n);
    if (lugar !== null) return / no /.test(l) ? pa !== lugar : pa === lugar;
    if (/justo/.test(l)) return pa + 1 === o.indexOf(b ?? "");
    return pa < o.indexOf(b ?? "");
  };
  const sol = unica(perms(gente).filter((o) => lineas(p).every((l) => ok(o, l))));
  const q = p.enunciado.slice(p.enunciado.lastIndexOf("¿"));
  if (/orden correcto/.test(q)) return sol.join(", ");
  if (/En qué/.test(q)) return String(sol.indexOf(nombresEn(q)[0] as string) + 1);
  return sol[lugarDe(q, n) as number] as string;
};

// Lista tras los dos puntos de una frase: "...distinto: el gato, el pato o la vaca."
function dominio(frase: string): string[] {
  const lista = frase.slice(frase.indexOf(":") + 1).trim().replace(/\.$/, "");
  return lista.split(/, | [ou] /).map((x) => x.trim());
}

function menciona(l: string, cosas: readonly string[]): string[] {
  return cosas.filter((c) => l.includes(c)).sort((a, b) => l.indexOf(a) - l.indexOf(b));
}

const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);

function tablas(p: Pregunta): string {
  const q = p.enunciado.slice(p.enunciado.lastIndexOf("¿"));
  if (p.imagen?.tipo === "tabla") {
    const cab = p.imagen.cabeceras.slice(1);
    const filas = p.imagen.filas;
    const gente = filas.map((f) => f[0] as string);
    const sol = unica(perms(cab).filter((o) => filas.every((f, i) => cab.every((c, j) => {
      const marca = f[j + 1];
      return marca === "" || (marca === "sí") === (o[i] === c);
    }))));
    const persona = nombresEn(q)[0];
    if (persona !== undefined) {
      const corto = sol[gente.indexOf(persona)] as string;
      const op = p.opciones?.find((o) => o.texto.toLowerCase().endsWith(corto.toLowerCase()));
      return op?.texto ?? "";
    }
    const cosa = cab.find((c) => q.includes(c)) as string;
    return gente[sol.indexOf(cosa)] as string;
  }
  const frases = p.enunciado.split(/(?<=\.) /);
  const gente = nombresEn(frases[0] ?? "");
  const a = dominio(frases[1] ?? "");
  const segunda = (frases[2] ?? "").startsWith("Además");
  const b = segunda ? dominio(frases[2] ?? "") : [];
  const ok = (x: readonly string[], y: readonly string[], l: string): boolean => {
    const quienes = nombresEn(l);
    const en0 = menciona(l, a);
    const en1 = menciona(l, b);
    if (l.startsWith("Quien")) {
      const i = x.indexOf(en0[0] as string);
      return / no /.test(l) ? y[i] !== en1[0] : y[i] === en1[0];
    }
    const [fila, cosas] = en0.length > 0 ? [x, en0] : [y, en1];
    if (l.startsWith("Ni ")) return quienes.every((g) => fila[gente.indexOf(g)] !== cosas[0]);
    const v = fila[gente.indexOf(quienes[0] as string)] as string;
    if (cosas.length === 2) return cosas.includes(v);
    return / no /.test(l) ? v !== cosas[0] : v === cosas[0];
  };
  const pa = perms(a);
  const pb = segunda ? perms(b) : [[]];
  const sols = pa.flatMap((x) => pb.map((y) => [x, y] as const)).filter(([x, y]) => lineas(p).every((l) => ok(x, y, l)));
  const [x, y] = unica(sols);
  if (segunda) {
    const dato = menciona(q, a)[0] as string;
    return cap(y[x.indexOf(dato)] as string);
  }
  const persona = nombresEn(q)[0];
  if (persona !== undefined) return cap(x[gente.indexOf(persona)] as string);
  return gente[x.indexOf(menciona(q, a)[0] as string)] as string;
}

const numeros = (t: string): number[] => [...t.matchAll(/\d+/g)].map((m) => Number(m[0]));
const n = (t: string, re: RegExp): number => {
  const m = re.exec(t);
  if (m === null) throw new Error(`Sin dato ${re} en ${t}`);
  return Number(m[1]);
};

function filasTabla(p: Pregunta): readonly (readonly string[])[] {
  if (p.imagen?.tipo !== "tabla") throw new Error("sin tabla");
  return p.imagen.filas;
}

function plural(s: string): string {
  const [c, ...resto] = s.toLowerCase().split(" ");
  const cabeza = c as string;
  const pl = cabeza.endsWith("z") ? `${cabeza.slice(0, -1)}ces` : /[aeiouáéíóú]$/.test(cabeza) ? `${cabeza}s` : `${cabeza}es`;
  return [pl, ...resto].join(" ");
}

function precios(p: Pregunta): Map<string, number> {
  return new Map(filasTabla(p).map((f) => [(f[0] as string).toLowerCase(), Number(f[1])]));
}

// Devuelve el coste de las cantidades escritas en el trozo de texto.
function coste(texto: string, tabla: ReadonlyMap<string, number>): number {
  let total = 0;
  for (const [nombre, precio] of tabla) {
    const re = new RegExp(`(\\d+) (?:${nombre}|${plural(nombre)})(?![\\p{L}])`, "u");
    const m = re.exec(texto);
    if (m !== null) total += Number(m[1]) * precio;
  }
  return total;
}

const limite: Oraculo = (p) => {
  const e = p.enunciado;
  const dinero = n(e, /tiene (\d+) moneda/);
  const t = precios(p);
  if (/Un grupo de la escuela/.test(e)) {
    const dias = n(e, /de (\d+) días/);
    const paga = e.slice(e.indexOf("paga"), e.indexOf("El resto"));
    return String((dinero - coste(paga, t)) / dias);
  }
  if (/Compra .* le sobra/.test(e)) return String(dinero - coste(e.slice(e.indexOf("Compra")), t));
  if (/Cuál de estas parejas/.test(e)) {
    const buenas = (p.opciones ?? []).filter((o) => [...t].filter(([k]) => o.texto.toLowerCase().includes(k)).reduce((s, [, v]) => s + v, 0) <= dinero);
    return unica(buenas).texto;
  }
  if (/Primero compra/.test(e)) {
    const primero = e.slice(e.indexOf("Primero"), e.indexOf("Con lo que"));
    const resto = dinero - coste(primero, t);
    const objetivo = [...t].find(([k]) => e.slice(e.indexOf("mayor cantidad")).includes(plural(k))) as [string, number];
    return String(Math.floor(resto / objetivo[1]));
  }
  if (/quitar un solo producto/.test(e)) {
    const total = [...t.values()].reduce((s, v) => s + v, 0);
    return cap(unica([...t].filter(([, v]) => total - v === dinero))[0]);
  }
  if (/dos productos distintos/.test(e)) {
    const obligado = coste(e.slice(e.indexOf("Debe comprar"), e.indexOf("Además")), t);
    const op = (p.opciones ?? []).map((o) => ({ o, v: [...t].filter(([k]) => o.texto.toLowerCase().includes(k)).reduce((s, [, x]) => s + x, 0) })).filter((x) => x.v + obligado <= dinero);
    const max = Math.max(...op.map((x) => x.v));
    return unica(op.filter((x) => x.v === max)).o.texto;
  }
  const obl = coste(e.slice(e.indexOf("Debe comprar"), e.indexOf("Con lo que")), t);
  const obj = [...t].find(([k]) => e.slice(e.indexOf("mayor cantidad")).includes(plural(k))) as [string, number];
  return String((dinero - obl) % obj[1]);
};

const prioridad: Oraculo = (p) => {
  const e = p.enunciado;
  const dinero = n(e, /tiene (\d+) moneda/);
  const filas = filasTabla(p);
  if (p.imagen?.tipo === "tabla" && p.imagen.cabeceras[0] === "Prioridad") {
    let resto = dinero;
    let i = 0;
    while (i < filas.length && Number(filas[i]?.[2]) <= resto) {
      resto -= Number(filas[i]?.[2]);
      i += 1;
    }
    return /Cuántas cosas/.test(e) ? String(i) : (filas[i - 1]?.[1] as string);
  }
  const queda = dinero - filas.filter((f) => f[2] === "sí").reduce((s, f) => s + Number(f[1]), 0);
  if (/Cuánto dinero/.test(e)) return String(queda);
  return unica(filas.filter((f) => f[2] === "no" && Number(f[1]) <= queda))[0] as string;
};

const ceil = Math.ceil;

const recursos: Oraculo = (p) => {
  const e = p.enunciado;
  if (p.imagen?.tipo === "tabla") {
    const u = n(e, /preparar (\d+)/);
    return unica(p.imagen.filas.filter((f) => Number(f[1]) * u > Number(f[2])))[0] as string;
  }
  if (/completos|completas/.test(e)) {
    const [x, y, ta, tb] = numeros(e) as [number, number, number, number];
    return String(Math.min(Math.floor(ta / x), Math.floor(tb / y)));
  }
  const u = n(e, /preparar (\d+)/);
  const x = n(e, /hacen falta (\d+)/);
  const ya = /ya tienen (\d+)/.test(e) ? n(e, /ya tienen (\d+)/) : 0;
  const falta = u * x - ya;
  if (/monedas gastan/.test(e)) return String(ceil(falta / n(e, /paquetes de (\d+)/)) * n(e, /cuestan (\d+) monedas/));
  if (/paquetes deben/.test(e)) return String(ceil(falta / n(e, /paquetes de (\d+)/)));
  return String(falta);
};

function minutos(h: string): number {
  const [a, b] = h.split(":").map(Number) as [number, number];
  return a * 60 + b;
}

function reloj(m: number): string {
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

const tiempo: Oraculo = (p) => {
  const e = p.enunciado;
  const suma = p.imagen?.tipo === "tabla" ? p.imagen.filas.reduce((s, f) => s + Number(f[1]), 0) : 0;
  if (/Cuántos minutos tarda/.test(e)) return String(suma);
  if (/empieza a las/.test(e)) return reloj(minutos(/a las (\d+:\d+)/.exec(e)?.[1] ?? "") + suma);
  if (/debe terminar a las/.test(e)) return reloj(minutos(/a las (\d+:\d+)/.exec(e)?.[1] ?? "") - suma);
  if (/días sobrarán/.test(e)) return String(n(e, /hay (\d+) días/) - suma);
  if (/A la vez/.test(e)) {
    const [a, b, c] = [...e.matchAll(/en (\d+) minutos/g)].map((m) => Number(m[1])) as [number, number, number];
    return String(Math.max(a, b) + c);
  }
  if (/Durante/.test(e)) {
    const [total, dias, r, quedan] = numeros(e) as [number, number, number, number];
    return String((total - dias * r) / quedan);
  }
  if (/ya lleva/.test(e)) {
    const [total, ya, d] = numeros(e) as [number, number, number];
    return String((total - ya) / d);
  }
  const [total, r] = numeros(e) as [number, number];
  return String(total / r);
};

const plazos: Oraculo = (p) => {
  const e = p.enunciado;
  if (p.imagen?.tipo === "tabla") {
    const filas = p.imagen.filas;
    if (p.imagen.cabeceras.length === 4) {
      const t = filas.map((f) => Number(f[1]) + Number(f[2]) * Number(f[3]));
      return String(Math.abs((t[0] as number) - (t[1] as number)));
    }
    const m = n(e, /máximo (\d+) moneda/);
    const ok = filas.filter((f) => Number(f[2]) <= m).map((f) => ({ l: f[0] as string, t: Number(f[1]) * Number(f[2]) }));
    const min = Math.min(...ok.map((x) => x.t));
    return `Plan ${unica(ok.filter((x) => x.t === min)).l}`;
  }
  const cuotas = /(\d+) cuotas de (\d+)/.exec(e);
  if (/% más/.test(e)) return String((n(e, /cuesta (\d+) moneda/) * (100 + n(e, /un (\d+) %/))) / 100 / n(e, /en (\d+) cuotas/));
  const total = Number(cuotas?.[1]) * Number(cuotas?.[2]) + (/entrada de (\d+)/.test(e) ? n(e, /entrada de (\d+)/) : 0);
  if (/Dónde/.test(e)) {
    const contado = n(e, /cuesta (\d+) moneda/);
    return contado === total ? "Cuesta lo mismo en las dos" : contado < total ? "En la tienda del centro" : "En la tienda del barrio";
  }
  if (/monedas más/.test(e)) return String(total - n(e, /cuesta (\d+) moneda/));
  return String(total);
};

const comparar: Oraculo = (p) => {
  const e = p.enunciado;
  if (p.imagen?.tipo === "tabla") {
    const u = p.imagen.filas.map((f) => ({ l: f[0] as string, v: Number(f[2]) / Number(f[1]) }));
    const min = Math.min(...u.map((x) => x.v));
    return `Oferta ${unica(u.filter((x) => x.v === min)).l}`;
  }
  if (/se rebaja/.test(e)) {
    const precio = n(e, /cuesta (\d+) moneda/);
    const final = precio * (1 - n(e, /rebaja un (\d+) %/) / 100);
    return String(Math.abs(final - n(e, /tienda B cuesta (\d+)/)));
  }
  if (/mercado lejano/.test(e)) {
    const u = n(e, /Necesitas (\d+)/);
    return String(Math.min(u * n(e, /cercana cada unidad cuesta (\d+)/), u * n(e, /lejano cada unidad cuesta (\d+)/) + n(e, /autobús cuesta (\d+)/)));
  }
  if (/exactamente/.test(e)) {
    const [u, k, pack, suelto] = [n(e, /exactamente (\d+)/), n(e, /paquete de (\d+)/), n(e, /unidades cuesta (\d+)/), n(e, /suelta cuesta (\d+)/)];
    let min = Infinity;
    for (let a = 0; a * k <= u; a += 1) min = Math.min(min, a * pack + (u - a * k) * suelto);
    return String(min);
  }
  if (/solo pagas 2/.test(e)) return String((n(e, /llevas (\d+)/) / 3) * 2 * n(e, /cuesta (\d+) moneda/));
  if (/Otro paquete/.test(e)) {
    const [n1, p1, n2, p2] = numeros(e) as [number, number, number, number];
    const [u1, u2] = [p1 / n1, p2 / n2];
    return u1 === u2 ? "Cuesta lo mismo en los dos" : `El paquete de ${u1 < u2 ? n1 : n2}`;
  }
  const [u, precio] = numeros(e) as [number, number];
  return String(precio / u);
};

const ahorro: Oraculo = (p) => {
  const e = p.enunciado;
  const meta = n(e, /[Cc]uesta (\d+) moneda/);
  if (/gana/.test(e)) return String(ceil((meta - n(e, /tiene (\d+) monedas/)) / (n(e, /gana (\d+)/) - n(e, /gasta (\d+)/))));
  if (/primeras/.test(e)) {
    const [k, a, b] = [n(e, /primeras (\d+) semanas/), n(e, /ahorra (\d+) moneda/), n(e, /Después ahorra (\d+)/)];
    return String(k + ceil((meta - k * a) / b));
  }
  if (/le faltarán/.test(e)) return String(meta - n(e, /tiene (\d+) monedas/) - n(e, /ahorra (\d+)/) * n(e, /Dentro de (\d+) semanas/));
  if (/dentro de \d+ semanas/.test(e)) return String((meta - n(e, /tiene (\d+) monedas/)) / n(e, /dentro de (\d+) semanas/));
  if (/le faltan/.test(e)) return String(meta - n(e, /ahorradas (\d+)/));
  const ya = /tiene (\d+) monedas/.test(e) ? n(e, /tiene (\d+) monedas/) : 0;
  return String(ceil((meta - ya) / n(e, /[Aa]horra (\d+)/)));
};

const COLOR = /(\d+) (?:bolas?|fichas?|tarjetas?) (rojas?|azul(?:es)?|verdes?|amarillas?|moradas?|naranjas?)/g;
const raiz = (c: string): string => c.slice(0, 3);

function cuenta(t: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of t.matchAll(COLOR)) m.set(raiz(x[2] as string), Number(x[1]));
  return m;
}

function opcionDeColor(p: Pregunta, color: string): string {
  return unica((p.opciones ?? []).filter((o) => raiz(o.texto.split(" ")[1] ?? "") === color)).texto;
}

const probable: Oraculo = (p) => {
  const e = p.enunciado;
  const ops = p.opciones ?? [];
  if (/dado normal/.test(e)) {
    const casos = (t: string): number => [1, 2, 3, 4, 5, 6].filter((v) => {
      if (/par/.test(t)) return v % 2 === 0;
      if (/más de 4/.test(t)) return v > 4;
      if (/más de 1/.test(t)) return v > 1;
      if (/menos de 5/.test(t)) return v < 5;
      if (/un 1 o un 2/.test(t)) return v <= 2;
      return v === 6;
    }).length;
    const max = Math.max(...ops.map((o) => casos(o.texto)));
    return unica(ops.filter((o) => casos(o.texto) === max)).texto;
  }
  if (/dos dados/.test(e)) {
    const formas = (s: number): number => [1, 2, 3, 4, 5, 6].flatMap((a) => [1, 2, 3, 4, 5, 6].map((b) => a + b)).filter((x) => x === s).length;
    const v = ops.map((o) => ({ o, f: formas(Number(o.texto.replace("Suma ", ""))) }));
    const max = Math.max(...v.map((x) => x.f));
    return unica(v.filter((x) => x.f === max)).o.texto;
  }
  if (/tarjetas numeradas/.test(e)) {
    const tope = n(e, /del 1 al (\d+)/);
    const casos = (t: string): number => Array.from({ length: tope }, (_, i) => i + 1).filter((v) => {
      if (/par/.test(t)) return v % 2 === 0;
      if (/de 3/.test(t)) return v % 3 === 0;
      if (/de 5/.test(t)) return v % 5 === 0;
      return v < 4;
    }).length;
    const max = Math.max(...ops.map((o) => casos(o.texto)));
    return unica(ops.filter((o) => casos(o.texto) === max)).texto;
  }
  if (/ A tiene/.test(e)) {
    const [fa, fb] = e.split(/ B tiene /) as [string, string];
    const c = /sacar una \S+ (\S+)\?/.exec(e)?.[1] as string;
    const [a, b] = [cuenta(fa), cuenta(fb)];
    const d = (a.get(raiz(c)) as number) * [...b.values()].reduce((s, x) => s + x, 0) - (b.get(raiz(c)) as number) * [...a.values()].reduce((s, x) => s + x, 0);
    return (ops.find((o) => (d === 0 ? /igual/.test(o.texto) : d > 0 ? /^(La|El) \S+ A$/.test(o.texto) : /^(La|El) \S+ B$/.test(o.texto))) ?? { texto: "" }).texto;
  }
  const m = cuenta(e.split("Alguien")[0] ?? e);
  if (/Alguien/.test(e)) {
    const q = /saca (\d+) \S+ (\S+) y no/.exec(e);
    const c = raiz(q?.[2] ?? "");
    m.set(c, (m.get(c) as number) - Number(q?.[1]));
  }
  if (/imposible/.test(e)) return unica(ops.filter((o) => !m.has(raiz(o.texto.split(" ")[1] ?? "")))).texto;
  if (/probabilidad/.test(e)) {
    const c = raiz(/sacar una \S+ (\S+)\?/.exec(e)?.[1] ?? "");
    return `${m.get(c)}/${[...m.values()].reduce((s, x) => s + x, 0)}`;
  }
  const valores = [...m.values()];
  const objetivo = /menos probable/.test(e) ? Math.min(...valores) : Math.max(...valores);
  return opcionDeColor(p, unica([...m].filter(([, v]) => v === objetivo))[0]);
};

const riesgo: Oraculo = (p) => {
  const e = p.enunciado;
  if (/semilla A/.test(e)) {
    const fija = n(e, /A da (\d+)/);
    const buenos = n(e, /De cada 4 años, (\d+)/);
    const b = buenos * n(e, /B da (\d+)/) + (4 - buenos) * n(e, /y (\d+) en un año malo/);
    return 4 * fija === b ? "Las dos dan lo mismo" : 4 * fija > b ? "La semilla A" : "La semilla B";
  }
  if (/12 meses/.test(e)) return String(12 * n(e, /cuesta (\d+) monedas al mes/) + (12 / n(e, /1 de cada (\d+) meses/)) * n(e, /cuesta (\d+) monedas más/));
  const [x, y, z] = numeros(e) as [number, number, number];
  if (/quiere/.test(e)) return String((z * Math.max(x, y)) / Math.min(x, y));
  return String((z * Math.min(x, y)) / Math.max(x, y));
};

export const ORACULOS_PEN56: Readonly<Record<string, Oraculo>> = {
  "PEN5-T1-a": ordenar,
  "PEN5-T1-b": tablas,
  "PEN5-T2-a": limite,
  "PEN5-T2-b": prioridad,
  "PEN6-T1-b": recursos,
  "PEN6-T1-c": tiempo,
  "PEN6-T2-a": plazos,
  "PEN6-T2-b": comparar,
  "PEN6-T2-c": ahorro,
  "PEN6-T3-a": probable,
  "PEN6-T3-b": riesgo,
};
