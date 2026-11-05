// Oráculos del bloque PEN 3.º-4.º: recalculan la respuesta solo con lo que ve el niño
// (enunciado, imagen y textos de las opciones). Si hay cero o varias opciones válidas, fallan.
import type { Imagen, Pregunta } from "../../../src/content/tipos.ts";

function unica(lista: readonly string[], p: Pregunta): string {
  if (lista.length !== 1) throw new Error(`Se esperaba una respuesta y hay ${lista.length}: ${p.enunciado}`);
  return lista[0] as string;
}

const opciones = (p: Pregunta): string[] => (p.opciones ?? []).map((o) => o.texto);
const nums = (t: string): number[] => (t.match(/\d+/g) ?? []).map(Number);
const m = (re: RegExp, t: string): RegExpExecArray => {
  const r = re.exec(t);
  if (r === null) throw new Error(`Sin coincidencia ${re}: ${t}`);
  return r;
};
const g = (r: RegExpExecArray, i: number): string => r[i] ?? "";
const minutosDe = (h: string): number => {
  const [a, b] = h.split(":").map(Number);
  return (a ?? 0) * 60 + (b ?? 0);
};

function tabla(p: Pregunta): Extract<Imagen, { tipo: "tabla" }> {
  if (p.imagen?.tipo !== "tabla") throw new Error(`Sin tabla: ${p.enunciado}`);
  return p.imagen;
}
function barras(p: Pregunta): Extract<Imagen, { tipo: "barras" }> {
  if (p.imagen?.tipo !== "barras") throw new Error(`Sin gráfico: ${p.enunciado}`);
  return p.imagen;
}

// ---------- Propiedades de números ----------
function cumple(n: number, frase: string): boolean {
  const t = frase.trim().toLowerCase().replace(/\.$/, "");
  if (t.startsWith("no ")) return !cumple(n, t.slice(3));
  let r: RegExpExecArray | null;
  if (t === "es par") return n % 2 === 0;
  if (t === "es impar") return n % 2 === 1;
  if ((r = /^es mayor que (\d+)$/.exec(t))) return n > Number(r[1]);
  if ((r = /^es menor que (\d+)$/.exec(t))) return n < Number(r[1]);
  if ((r = /^termina en (\d)$/.exec(t))) return n % 10 === Number(r[1]);
  if ((r = /^está en la tabla del (\d+)$/.exec(t))) return n % Number(r[1]) === 0;
  if ((r = /^sus cifras suman (\d+)$/.exec(t))) return [...String(n)].reduce((s, c) => s + Number(c), 0) === Number(r[1]);
  throw new Error(`Propiedad desconocida: ${frase}`);
}

function pistas(t: string): string[] {
  return [...t.matchAll(/Pista(?: \d)?: ([^.]+)\./g)].map((x) => x[1] ?? "");
}
function listaDe(t: string): number[] {
  return (m(/(?:lista|Lista): ([\d, ]+)\./, t)[1] ?? "").split(",").map((x) => Number(x.trim()));
}

// ---------- PEN3-T1-a ----------
interface Lit { base: string; valor: boolean }
function literal(s: string): Lit {
  const t = s.trim().toLowerCase().replace(/\.$/, "");
  const sin = t.replace(/(^| )no /, "$1");
  return { base: sin, valor: sin === t };
}

function siEntonces(p: Pregunta): string {
  const t = p.enunciado;
  if (t.includes("la tarjeta va")) {
    const n = Number(g(m(/saca el (\d+)/, t), 1));
    const validas = [...t.matchAll(/si el número ([^,]+), la tarjeta va a la caja (\w+)/gi)]
      .filter((c) => (c[1] ?? "").split(" y ").every((x) => cumple(n, x)))
      .map((c) => `A la caja ${c[2] ?? ""}`);
    return unica(validas, p);
  }
  if (p.imagen?.tipo === "tabla") {
    const tb = p.imagen;
    const puntos = tb.cabeceras.indexOf("Puntos");
    const faltas = tb.cabeceras.indexOf("Faltas");
    const col = puntos >= 0 ? puntos : tb.cabeceras.indexOf("Monedas");
    let min = -Infinity;
    let r: RegExpExecArray | null;
    if ((r = /más de (\d+) puntos/.exec(t))) min = Number(r[1]) + 1;
    else if ((r = /tienes (\d+) (?:puntos|monedas) o más/.exec(t))) min = Number(r[1]);
    const maxF = /menos de (\d+) faltas/.exec(t);
    return unica(tb.filas.filter((f) => Number(f[col]) >= min && (maxF === null || Number(f[faltas]) < Number(maxF[1]))).map((f) => f[0] ?? ""), p);
  }
  const reglas = [...t.matchAll(/si ([^,.]+), entonces ([^.]+)\./gi)].map((c) => ({ si: literal(c[1] ?? ""), entonces: literal(c[2] ?? "") }));
  const hecho = literal(g(m(/Sabemos que ([^.]+)\./, t), 1));
  const saber = new Map([[hecho.base, hecho.valor]]);
  for (let i = 0; i < 5; i += 1) {
    for (const r of reglas) {
      if (saber.get(r.si.base) === r.si.valor) saber.set(r.entonces.base, r.entonces.valor);
      if (saber.has(r.entonces.base) && saber.get(r.entonces.base) !== r.entonces.valor) saber.set(r.si.base, !r.si.valor);
    }
  }
  const seguras = opciones(p).filter((o) => {
    if (o === "No se puede saber") return false;
    const l = literal(o);
    return saber.get(l.base) === l.valor;
  });
  return seguras.length === 0 ? unica(opciones(p).filter((o) => o === "No se puede saber"), p) : unica(seguras, p);
}

// ---------- PEN3-T1-b ----------
function verdadDeFrase(p: Pregunta, frase: string): boolean {
  const img = p.imagen;
  let r: RegExpExecArray | null;
  if (/^\d/.test(frase)) {
    const n = Number(g(m(/^(\d+) /, frase), 1));
    return frase.replace(/^\d+ /, "").replace(/\.$/, "").split(" y ").every((x) => cumple(n, x));
  }
  if (img?.tipo === "objetos") {
    const plural = (id: string): string => ({ lapiz: "lápices", pez: "peces", flor: "flores", pajaro: "pájaros" } as Record<string, string>)[id] ?? `${id}s`;
    const cuenta = (nombre: string): number => img.grupos.find((x) => plural(x.objeto) === nombre)?.cantidad ?? -1;
    if ((r = /^En total hay (\d+) objetos\.$/.exec(frase))) return img.grupos.reduce((s, x) => s + x.cantidad, 0) === Number(r[1]);
    if ((r = /^Hay más (\S+) que (\S+)\.$/.exec(frase))) return cuenta(r[1] ?? "") > cuenta(r[2] ?? "");
    if ((r = /^Hay menos (\S+) que (\S+)\.$/.exec(frase))) return cuenta(r[1] ?? "") < cuenta(r[2] ?? "");
    if ((r = /^Hay (\d+) (\S+)\.$/.exec(frase))) return cuenta(r[2] ?? "") === Number(r[1]);
  }
  if (img?.tipo === "barras") {
    const v = (n: string): number => img.valores[img.etiquetas.indexOf(n)] ?? -1;
    if ((r = /^(\S+) ha leído más libros que (\S+)\.$/.exec(frase))) return v(r[1] ?? "") > v(r[2] ?? "");
    if ((r = /^(\S+) ha leído (\d+) libros\.$/.exec(frase))) return v(r[1] ?? "") === Number(r[2]);
  }
  if (img?.tipo === "monedas") {
    const suma = img.valores.reduce((a, b) => a + b, 0);
    const c = (v: number): number => img.valores.filter((x) => x === v).length;
    if ((r = /^Hay (\d+) monedas\.$/.exec(frase))) return img.valores.length === Number(r[1]);
    if ((r = /^Hay más monedas de (\d+) que de (\d+)\.$/.exec(frase))) return c(Number(r[1])) > c(Number(r[2]));
    if ((r = /^Las monedas suman más de (\d+)\.$/.exec(frase))) return suma > Number(r[1]);
    if ((r = /^Las monedas suman (\d+)\.$/.exec(frase))) return suma === Number(r[1]);
  }
  if (img?.tipo === "tabla") {
    const col = (c: string): number => img.cabeceras.findIndex((h) => h.toLowerCase() === c);
    const si = (f: readonly string[], c: string): boolean => f[col(c)] === "Sí";
    if ((r = /^Todos traen una? (\S+)\.$/.exec(frase))) { const c = r[1] ?? ""; return img.filas.every((f) => si(f, c)); }
    if ((r = /^Nadie trae una? (\S+)\.$/.exec(frase))) { const c = r[1] ?? ""; return img.filas.every((f) => !si(f, c)); }
    if ((r = /^Solo (\S+) trae una? (\S+)\.$/.exec(frase))) { const n = r[1]; const c = r[2] ?? ""; const con = img.filas.filter((f) => si(f, c)); return con.length === 1 && con[0]?.[0] === n; }
    if ((r = /^(\S+) no trae una? (\S+)\.$/.exec(frase))) { const n = r[1]; const c = r[2] ?? ""; return !si(img.filas.find((f) => f[0] === n) ?? [], c); }
    if ((r = /^(\S+) trae una? (\S+)\.$/.exec(frase))) { const n = r[1]; const c = r[2] ?? ""; return si(img.filas.find((f) => f[0] === n) ?? [], c); }
  }
  throw new Error(`Frase desconocida: ${frase}`);
}

function verdaderoFalso(p: Pregunta): string {
  if (p.formato === "numero") {
    const frases = [...p.enunciado.matchAll(/Frase \d: ([^.]+\.)/g)].map((x) => x[1] ?? "");
    return String(frases.filter((f) => verdadDeFrase(p, f)).length);
  }
  const buscaFalsa = /frase falsa/.test(p.enunciado);
  return unica(opciones(p).filter((o) => verdadDeFrase(p, o) !== buscaFalsa), p);
}

// ---------- PEN3-T3-a ----------
function porPrecio(p: Pregunta): string {
  const t = p.enunciado;
  const puesto = (n: string): string => `En el puesto de ${n}`;
  const menor = (l: readonly { n: string; v: number }[], igual: string): string => {
    const min = Math.min(...l.map((x) => x.v));
    const c = l.filter((x) => x.v === min);
    return c.length > 1 ? igual : puesto(c[0]?.n ?? "");
  };
  const igualDe = opciones(p).find((o) => !o.startsWith("En el puesto")) ?? "";
  if (t.startsWith("Necesitas")) {
    const n = Number(g(m(/Necesitas (\d+)/, t), 1));
    const paq = [...t.matchAll(/En el puesto de (\S+) venden paquetes de (\d+) \S+ por (\d+) monedas?/g)];
    if (paq.length > 0) return menor(paq.map((x) => ({ n: x[1] ?? "", v: (n / Number(x[2])) * Number(x[3]) })), igualDe);
    const a = m(/En el puesto de (\S+), cada \S+ cuesta (\d+) monedas?\. En el puesto de (\S+), cada \S+ cuesta (\d+) monedas?, pero por cada (\d+)/, t);
    const k = Number(a[5]);
    return menor([{ n: g(a, 1), v: n * Number(a[2]) }, { n: g(a, 3), v: (n - n / (k + 1)) * Number(a[4]) }], igualDe);
  }
  if (t.startsWith("Tienes")) {
    const pr = [...t.matchAll(/cuesta (\d+) monedas?/g)].map((x) => Number(x[1]));
    const total = Number(g(m(/Tienes (\d+)/, t), 1));
    return String(Math.abs(total / (pr[0] ?? 1) - total / (pr[1] ?? 1)));
  }
  if (p.imagen?.tipo === "tabla") {
    const tb = p.imagen;
    return menor(tb.filas.map((f) => ({ n: f[0] ?? "", v: tb.cabeceras.length === 3 ? Number(f[2]) / Number(f[1]) : Number(f[1]) })), igualDe);
  }
  const of = [...t.matchAll(/En el puesto de (\S+), (\d+) \S+ cuestan (\d+) monedas?\./g)].map((x) => ({ n: x[1] ?? "", q: Number(x[2]), c: Number(x[3]) }));
  if (t.includes("más") && t.includes("te dan")) {
    const max = Math.max(...of.map((o) => o.q));
    return puesto(of.find((o) => o.q === max)?.n ?? "");
  }
  if (t.includes("ahorras")) return String(Math.abs((of[0]?.c ?? 0) - (of[1]?.c ?? 0)));
  if (t.includes("¿Cuántas monedas cuesta cada")) return String(Math.min(...of.map((o) => o.c / o.q)));
  if (t.includes("Dónde cuesta menos cada")) return menor(of.map((o) => ({ n: o.n, v: o.c / o.q })), igualDe);
  return menor(of.map((o) => ({ n: o.n, v: o.c })), igualDe);
}

// ---------- PEN3-T3-b ----------
function porTiempo(p: Pregunta): string {
  const t = p.enunciado;
  const mins = (s: string): number[] => [...s.matchAll(/(\d+) minutos?/g)].map((x) => Number(x[1]));
  const suma = (l: readonly number[]): number => l.reduce((a, b) => a + b, 0);
  const elegirMenor = (l: readonly { o: string; v: number }[]): string => {
    const min = Math.min(...l.map((x) => x.v));
    const c = l.filter((x) => x.v === min);
    return c.length === 1 ? (c[0]?.o ?? "") : unica(opciones(p).filter((o) => /lo mismo|a la vez/.test(o)), p);
  };
  if (p.imagen?.tipo === "tabla") return elegirMenor(p.imagen.filas.map((f) => ({ o: `Por el ${f[0] ?? ""}`, v: f.slice(1).reduce((a, b) => a + Number(b), 0) })));
  if (t.startsWith("La clase empieza")) {
    const [a, b] = [...t.matchAll(/(\d+:\d\d)/g)].map((x) => minutosDe(x[1] ?? ""));
    const margen = (a ?? 0) - (b ?? 0);
    const caminos = [...t.matchAll(/Por el (camino [^.]+?) tardas (\d+) minutos?\./g)].map((x) => ({ c: x[1] ?? "", v: Number(x[2]) }));
    if (p.formato === "numero") return String(margen - Math.min(...caminos.map((c) => c.v)));
    return unica(caminos.filter((c) => c.v < margen).map((c) => `Por el ${c.c}`), p);
  }
  if (t.startsWith("En la fila A")) {
    const a = m(/fila A hay (\d+) personas y cada una tarda (\d+)/, t);
    const b = m(/fila B hay (\d+) personas y cada una tarda (\d+)/, t);
    return elegirMenor([{ o: "En la fila A", v: Number(a[1]) * Number(a[2]) }, { o: "En la fila B", v: Number(b[1]) * Number(b[2]) }]);
  }
  if (t.startsWith("Necesitas")) {
    const n = Number(g(m(/Necesitas (\d+)/, t), 1));
    const a = m(/pozo grande dura (\d+) minutos? y traes (\d+)/, t);
    const b = m(/pozo pequeño dura (\d+) minutos? y traes (\d+)/, t);
    return elegirMenor([{ o: "Con el pozo grande", v: (n / Number(a[2])) * Number(a[1]) }, { o: "Con el pozo pequeño", v: (n / Number(b[2])) * Number(b[1]) }]);
  }
  if (t.startsWith("A pie")) {
    const [pie, e, v] = mins(t);
    return elegirMenor([{ o: "A pie", v: pie ?? 0 }, { o: "En autobús", v: (e ?? 0) + (v ?? 0) }]);
  }
  if (/tarda \d+ minutos? en /.test(t)) {
    const q = [...t.matchAll(/(\S+) tarda (\d+) minutos? en /g)].map((x) => ({ o: x[1] ?? "", v: Number(x[2]) }));
    return elegirMenor(q);
  }
  const frases = [...t.matchAll(/Por el (camino [^.]+?) (?:tardas|caminas) ([^.]+)\./g)].map((x) => ({ o: `Por el ${x[1] ?? ""}`, v: suma(mins(x[2] ?? "")) }));
  if (t.includes("¿Cuántos minutos ganas")) return String(Math.abs((frases[0]?.v ?? 0) - (frases[1]?.v ?? 0)));
  if (t.includes("¿Cuántos minutos en total")) return String(Math.min(...frases.map((f) => f.v)));
  return elegirMenor(frases);
}

// ---------- PEN3-T4-a ----------
function horario(p: Pregunta): string {
  const t = p.enunciado;
  const filas = tabla(p).filas.map((f) => ({ i: minutosDe(f[0] ?? ""), f: minutosDe(f[1] ?? ""), n: f[2] ?? "" }));
  const dura = (n: string): number => { const b = filas.find((x) => x.n === n); return (b?.f ?? 0) - (b?.i ?? 0); };
  const fmt = (v: number): string => `A las ${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
  const de = (n: string): (typeof filas)[number] => { const b = filas.find((x) => x.n === n); if (b === undefined) throw new Error(n); return b; };
  let r: RegExpExecArray | null;
  if ((r = /¿A qué hora empieza (\S+)\?/.exec(t))) return fmt(de(r[1] ?? "").i);
  if ((r = /¿A qué hora termina (\S+)\?/.exec(t))) return fmt(de(r[1] ?? "").f);
  if ((r = /actividad empieza a las (\d+:\d\d)/.exec(t))) { const h = minutosDe(r[1] ?? ""); return unica(filas.filter((x) => x.i === h).map((x) => x.n), p); }
  if ((r = /se está haciendo a las (\d+:\d\d)/.exec(t))) { const h = minutosDe(r[1] ?? ""); return unica(filas.filter((x) => x.i < h && h < x.f).map((x) => x.n), p); }
  if ((r = /justo después de (\S+)\?/.exec(t))) { const f = de(r[1] ?? "").f; return unica(filas.filter((x) => x.i === f).map((x) => x.n), p); }
  if ((r = /¿Cuántos minutos dura (\S+)\?/.exec(t))) return String(dura(r[1] ?? ""));
  if ((r = /dura (más|menos) tiempo/.exec(t))) {
    const v = filas.map((x) => x.f - x.i);
    const obj = r[1] === "más" ? Math.max(...v) : Math.min(...v);
    return unica(filas.filter((x) => x.f - x.i === obj).map((x) => x.n), p);
  }
  if ((r = /duran en total (\S+) y (\S+)\?/.exec(t))) return String(dura(r[1] ?? "") + dura(r[2] ?? ""));
  if ((r = /Entre (\S+) y (\S+) hay recreo/.exec(t))) return String(de(r[2] ?? "").i - de(r[1] ?? "").f);
  if ((r = /tarda (\d+) minutos en llegar a la escuela y quiere llegar justo cuando empieza (\S+)\./.exec(t))) return fmt(de(r[2] ?? "").i - Number(r[1]));
  if ((r = /tarea que dura (\d+) minutos/.exec(t))) {
    const n = Number(r[1]);
    const [a, b, c] = filas as [(typeof filas)[number], (typeof filas)[number], (typeof filas)[number]];
    const validas = [];
    if (b.i - a.f >= n) validas.push(`Entre ${a.n} y ${b.n}`);
    if (c.i - b.f >= n) validas.push(`Entre ${b.n} y ${c.n}`);
    return unica(validas, p);
  }
  throw new Error(`Horario desconocido: ${t}`);
}

// ---------- PEN4-T1 ----------
const LADOS: Record<string, number> = { triángulo: 3, cuadrado: 4, rectángulo: 4, rombo: 4, pentágono: 5, hexágono: 6 };

function cumpleFigura(op: string, pista: string): boolean {
  const [forma, color] = op.split(" ") as [string, string];
  const lados = LADOS[forma] ?? 0;
  const t = pista.toLowerCase();
  if (t.startsWith("no ")) return !cumpleFigura(op, t.slice(3));
  let r: RegExpExecArray | null;
  if ((r = /^es de color (\w+)$/.exec(t))) return color === r[1];
  if ((r = /^tiene más de (\d) lados$/.exec(t))) return lados > Number(r[1]);
  if ((r = /^tiene menos de (\d) lados$/.exec(t))) return lados < Number(r[1]);
  if ((r = /^tiene (\d) lados$/.exec(t))) return lados === Number(r[1]);
  throw new Error(`Pista de figura desconocida: ${pista}`);
}

function cumplePersona(p: Pregunta, fila: readonly string[], pista: string): boolean {
  const tb = tabla(p);
  const t = pista.toLowerCase();
  const r = m(/^(no )?lleva una? (\w+)$/, t);
  const lleva = fila[tb.cabeceras.findIndex((h) => h.toLowerCase() === r[2])] === "Sí";
  return r[1] === undefined ? lleva : !lleva;
}

function permutar<T>(l: readonly T[]): T[][] {
  return l.length <= 1 ? [[...l]] : l.flatMap((x, i) => permutar(l.filter((_, j) => j !== i)).map((r) => [x, ...r]));
}

function conPistas(p: Pregunta): string {
  const t = p.enunciado;
  const ps = pistas(t);
  if (p.formato === "numero") return unica(listaDe(t).filter((n) => ps.every((x) => cumple(n, x))).map(String), p);
  if (p.formato === "imagen") return unica(opciones(p).filter((o) => ps.every((x) => cumpleFigura(o, x))), p);
  if (p.imagen?.tipo === "tabla") return unica(tabla(p).filas.filter((f) => ps.every((x) => cumplePersona(p, f, x))).map((f) => f[0] ?? ""), p);
  if (t.includes(": cada persona")) {
    const gente = (g(m(/^(.+?): cada persona/, t), 1)).split(/, | y /);
    const cosas = g(m(/\((.+)\)\./, t), 1).split(/, | y (?=el |la |[a-z]+$|junto)/);
    const resto = t.slice(t.indexOf(").") + 2).trim();
    const frases = resto.split(/(?<=\.) /).filter((x) => x.endsWith("."));
    const preg = g(m(/¿Quién (.+)\?/, t), 1);
    // Clave de cada cosa: el verbo o sintagma que distingue su acción.
    const claves = frases.concat([`X ${preg}.`]).map((f) => f.replace(/^\S+ (no )?/, "").replace(/\.$/, ""));
    const acciones = [...new Set(claves)];
    if (acciones.length > cosas.length) throw new Error(`Acciones de más: ${t}`);
    while (acciones.length < cosas.length) acciones.push(`?${acciones.length}`);
    const validas = permutar(acciones).filter((perm) => frases.every((f) => {
      const r = m(/^(\S+) (no )?(.+)\.$/, f);
      const i = gente.indexOf(g(r, 1));
      return (perm[i] === g(r, 3)) === (r[2] === undefined);
    }));
    return unica([...new Set(validas.map((perm) => gente[perm.indexOf(preg)] ?? ""))], p);
  }
  const frases = t.split(/(?<=\.) /).filter((x) => x.endsWith("."));
  const pr = g(m(/¿Quién (.+)\?/, t), 1);
  const parejas = frases.map((f) => {
    const r = m(/^(\S+) (.+) que (\S+)\.$/, f);
    const mas = /más (años|monedas|libros|lejos)/.test(g(r, 2));
    return mas ? [g(r, 1), g(r, 3)] : [g(r, 3), g(r, 1)];
  });
  const gente = [...new Set(parejas.flat())];
  const ordenes = permutar(gente).filter((o) => parejas.every(([a, b]) => o.indexOf(a ?? "") < o.indexOf(b ?? "")));
  const orden = ordenes.length === 1 ? (ordenes[0] ?? []) : [];
  if (orden.length === 0) throw new Error(`Orden no único: ${t}`);
  return /más (años|monedas|libros|lejos)/.test(pr) ? (orden[0] ?? "") : (orden[orden.length - 1] ?? "");
}

function descartar(p: Pregunta): string {
  const t = p.enunciado;
  const ps = pistas(t);
  if (p.formato === "numero") return String(listaDe(t).filter((n) => ps.every((x) => cumple(n, x))).length);
  if (p.formato === "imagen") return unica(opciones(p).filter((o) => !ps.every((x) => cumpleFigura(o, x))), p);
  if (p.imagen?.tipo === "tabla") return unica(tabla(p).filas.filter((f) => !ps.every((x) => cumplePersona(p, f, x))).map((f) => f[0] ?? ""), p);
  if (t.includes("descarta más")) {
    const lista = listaDe(t);
    const c = opciones(p).map((o) => ({ o, v: lista.filter((n) => !cumple(n, o)).length }));
    const max = Math.max(...c.map((x) => x.v));
    return unica(c.filter((x) => x.v === max).map((x) => x.o), p);
  }
  return unica(opciones(p).filter((o) => !ps.every((x) => cumple(Number(o), x))), p);
}

// ---------- PEN4-T2 ----------
function simular(objetivo: number, inicial: number, ahorro: (semana: number) => number): number {
  let s = 0;
  let total = inicial;
  while (total < objetivo) { s += 1; total += ahorro(s); }
  return s;
}

function cuantoTardo(p: Pregunta): string {
  const t = p.enunciado;
  let r: RegExpExecArray | null;
  const precio = /cuesta (\d+) monedas/.exec(t);
  if ((r = /recibe (\d+) monedas cada semana.* y gasta (\d+) monedas/.exec(t))) {
    const inicial = /Ya tiene (\d+)/.exec(t);
    const neto = Number(r[1]) - Number(r[2]);
    return String(simular(Number(precio?.[1]), Number(inicial?.[1] ?? 0), () => neto));
  }
  if ((r = /Con el plan A guarda (\d+) monedas cada semana\. Con el plan B guarda (\d+)/.exec(t))) {
    const a = Number(r[1]); const b = Number(r[2]);
    return String(simular(Number(precio?.[1]), 0, () => a) - simular(Number(precio?.[1]), 0, () => b));
  }
  if ((r = /Las primeras (\d+) semanas guarda (\d+) monedas cada semana\. Después guarda (\d+)/.exec(t))) {
    const k = Number(r[1]); const a = Number(r[2]); const b = Number(r[3]);
    return String(simular(Number(precio?.[1]), 0, (s) => (s <= k ? a : b)));
  }
  if ((r = /pone (\d+) monedas cada semana y \S+ pone (\d+)/.exec(t))) {
    const suma = Number(r[1]) + Number(r[2]);
    return String(simular(Number(precio?.[1]), 0, () => suma));
  }
  if ((r = /guarda (\d+) monedas cada semana\. ¿Cuántas monedas tendrá dentro de (\d+)/.exec(t))) {
    const inicial = /ya tiene (\d+)/.exec(t);
    return String(Number(inicial?.[1] ?? 0) + Number(r[1]) * Number(r[2]));
  }
  const a = Number(g(m(/[Gg]uarda (\d+) monedas cada/, t), 1));
  const inicial = /Ya tiene (\d+)/.exec(t);
  return String(simular(Number(precio?.[1]), Number(inicial?.[1] ?? 0), () => a));
}

function ahorrarGastar(p: Pregunta): string | null {
  const t = p.enunciado;
  let r: RegExpExecArray | null;
  if ((r = /tiene (\d+) monedas ahorradas y gasta (\d+)/.exec(t))) return String(Number(r[1]) - Number(r[2]));
  if ((r = /Puede gastar (\d+) monedas en .+ o gastar (\d+) monedas/.exec(t))) return `Gastar ${Math.min(Number(r[1]), Number(r[2]))} monedas`;
  if ((r = /tiene (\d+) monedas y guarda (\d+) monedas? cada semana\. Dentro de (\d+) semanas? quiere comprar .+ cuesta (\d+) monedas\. Hoy ve .+ por (\d+) monedas/.exec(t))) {
    const d = Number(r[1]) - Number(r[5]) + Number(r[2]) * Number(r[3]) - Number(r[4]);
    const verbo = (v: string, n: number): string => `le ${v}${n === 1 ? "" : "n"} ${n} ${n === 1 ? "moneda" : "monedas"}`;
    return d > 0 ? `Sí, y ${verbo("sobra", d)}` : `No, ${verbo("falta", -d)}`;
  }
  if ((r = /tiene (\d+) monedas y guarda (\d+) monedas? cada semana\. Dentro de (\d+) semanas? quiere comprar .+ cuesta (\d+) monedas\. ¿Cuántas monedas puede gastar/.exec(t))) return String(Number(r[1]) + Number(r[2]) * Number(r[3]) - Number(r[4]));
  if ((r = /tiene (\d+) monedas y quiere comprar .+ cuesta (\d+) monedas\. Si gasta (\d+)/.exec(t))) return String(Number(r[2]) - Number(r[1]) + Number(r[3]));
  if ((r = /guarda (\d+) monedas cada semana para comprar algo.+Hoy gasta (\d+)/.exec(t))) return String(Number(r[2]) / Number(r[1]));
  if ((r = /Plan A: guardar (\d+) monedas.+Plan B: guardar (\d+) monedas.+Dentro de (\d+) semanas.+cuesta (\d+) monedas/.exec(t))) {
    const a = Number(r[1]) * Number(r[3]) >= Number(r[4]);
    const b = Number(r[2]) * Number(r[3]) >= Number(r[4]);
    return a && b ? "Con los dos planes" : a ? "Solo con el plan A" : b ? "Solo con el plan B" : "Con ninguno de los dos";
  }
  return null;
}

// ---------- PEN4-T3 ----------
function indiceColumna(p: Pregunta, frase: string): number {
  const i = tabla(p).cabeceras.findIndex((h) => frase.toLowerCase().endsWith(h.replace(/ \(.*\)$/, "").toLowerCase()));
  if (i < 0) throw new Error(`Columna desconocida: ${frase}`);
  return i;
}

function extremoFila(p: Pregunta, filas: readonly (readonly string[])[], frase: string, alto: boolean): readonly string[] {
  const c = indiceColumna(p, frase);
  const valores = filas.map((f) => Number(f[c]));
  const obj = alto ? Math.max(...valores) : Math.min(...valores);
  const r = filas.filter((f) => Number(f[c]) === obj);
  if (r.length !== 1) throw new Error(`Empate: ${p.enunciado}`);
  return r[0] ?? [];
}

function pasaCondicion(p: Pregunta, f: readonly string[], c: string): boolean {
  const r = m(/^(.+) por (debajo|encima) de (\d+)$/, c.trim());
  const v = Number(f[indiceColumna(p, g(r, 1))]);
  return r[2] === "debajo" ? v < Number(r[3]) : v > Number(r[3]);
}

function segunTabla(p: Pregunta): string {
  const t = p.enunciado;
  const tb = tabla(p);
  let r: RegExpExecArray | null;
  if ((r = /Solo sirven las filas con (.+?)\. De esas filas, ¿cuál tiene (?:el|la) (.+) más (bajo|baja|alto|alta)\?/.exec(t))) {
    const cond = r[1] ?? "";
    return extremoFila(p, tb.filas.filter((f) => pasaCondicion(p, f, cond)), r[2] ?? "", (r[3] ?? "").startsWith("alt"))[0] ?? "";
  }
  if ((r = /con estas condiciones: (.+?)\. ¿Cuál/.exec(t))) {
    const conds = (r[1] ?? "").split(/, | y /);
    return unica(tb.filas.filter((f) => conds.every((c) => pasaCondicion(p, f, c))).map((f) => f[0] ?? ""), p);
  }
  r = m(/tiene (?:el|la) (.+) más (bajo|baja|alto|alta)\?/, t);
  return extremoFila(p, tb.filas, g(r, 1), g(r, 2).startsWith("alt"))[0] ?? "";
}

function justificar(p: Pregunta): string {
  const t = p.enunciado;
  const tb = tabla(p);
  const normal = (s: string): string => s.toLowerCase();
  const fila = (ref: string): readonly string[] => tb.filas.find((f) => normal(ref).endsWith(normal(f[0] ?? ""))) ?? [];
  let r: RegExpExecArray | null;
  if ((r = /tiene (?:el|la) (.+) más (?:bajo|baja|alto|alta)\. ¿Qué columna/.exec(t))) return tb.cabeceras[indiceColumna(p, r[1] ?? "")] ?? "";
  if ((r = /La clase necesita (.+?) y ([^.]+)\. La clase elige .+ ¿Por qué no sirve (.+)\?/.exec(t))) {
    const f = fila(r[3] ?? "");
    const condiciones = [r[1] ?? "", r[2] ?? ""];
    const fallo = unica(condiciones.filter((c) => !pasaCondicion(p, f, c)), p);
    const c = m(/^(.+) por (debajo|encima) de (\d+)$/, fallo);
    return `Porque su ${g(c, 1)} es ${f[indiceColumna(p, g(c, 1))] ?? ""}, y debe estar por ${g(c, 2)} de ${g(c, 3)}.`;
  }
  r = m(/quiere la opción con (el|la) (.+) más (bajo|baja|alto|alta) y elige (.+?)\. ¿(Qué frase|Ha elegido)/, t);
  const [art, col, adj, ref, tipo] = [g(r, 1), g(r, 2), g(r, 3), g(r, 4), g(r, 5)];
  const c = indiceColumna(p, col);
  const alto = adj.startsWith("alt");
  const mejor = extremoFila(p, tb.filas, col, alto);
  if (tipo === "Qué frase") return `Su ${col} es ${mejor[c] ?? ""}, ${art} más ${adj} de la tabla.`;
  const correctaSi = fila(ref)[0] === mejor[0];
  const buscado = normal(mejor[0] ?? "");
  return unica(opciones(p).filter((o) => o.startsWith(correctaSi ? "Sí" : "No") && normal(o).includes(buscado) && normal(o).includes(`${art} ${col}`)), p);
}

// ---------- PEN4-T5 ----------
function repartir(p: Pregunta): string | null {
  const t = p.enunciado;
  let r: RegExpExecArray | null;
  if ((r = /tiene (\d+) personas y debe colocar (\d+)/.exec(t))) return String(Number(r[2]) / Number(r[1]));
  if ((r = /grupo de (\d+) personas compra material por (\d+)/.exec(t))) return String(Number(r[2]) / Number(r[1]));
  if (t.includes("Quieren trabajar el mismo tiempo")) {
    const tiempos = new Map([...t.matchAll(/([a-zá-ú ]+) \((\d+) minutos\)/g)].map((x) => [(x[1] ?? "").trim(), Number(x[2])]));
    const total = [...tiempos.values()].reduce((a, b) => a + b, 0);
    const suma = (lista: string): number => lista.split(/, | y /).reduce((s, x) => s + (tiempos.get(x.trim()) ?? NaN), 0);
    return unica(opciones(p).filter((o) => {
      const partes = [...o.matchAll(/\S+: ([^.]+)\./g)].map((x) => suma(x[1] ?? ""));
      return partes.length === 2 && partes[0] === total / 2 && partes[1] === total / 2;
    }), p);
  }
  return null;
}

function decidir(p: Pregunta): string | null {
  if (p.imagen?.tipo !== "barras") return null;
  const b = barras(p);
  const t = p.enunciado;
  const orden = [...b.valores].sort((x, y) => y - x);
  const max = orden[0] ?? 0;
  const lider = b.etiquetas[b.valores.indexOf(max)] ?? "";
  if (t.includes("¿Cuántos votos más")) return String(max - (orden[1] ?? 0));
  if (t.includes("más de la mitad")) {
    const total = b.valores.reduce((x, y) => x + y, 0);
    return max * 2 > total ? lider : "Ninguna";
  }
  const r = /Se elimina la opción con menos votos, (.+?), y quienes la votaron votan ahora por (.+?)\./.exec(t);
  if (r !== null) {
    const v = (n: string): number => b.valores[b.etiquetas.indexOf(n)] ?? 0;
    const receptor = r[2] ?? "";
    const final = v(receptor) + v(r[1] ?? "");
    return final > max ? receptor : lider;
  }
  return lider;
}

export const ORACULOS_PEN34: Readonly<Record<string, (p: Pregunta) => string>> = {
  "PEN3-T1-a": siEntonces,
  "PEN3-T1-b": verdaderoFalso,
  "PEN3-T3-a": porPrecio,
  "PEN3-T3-b": porTiempo,
  "PEN3-T4-a": horario,
  "PEN4-T1-a": conPistas,
  "PEN4-T1-b": descartar,
  "PEN4-T2-a": cuantoTardo,
  "PEN4-T3-a": segunTabla,
  "PEN4-T3-b": justificar,
};

// Subhabilidades que mezclan casos calculados y situaciones escritas: null = caso escrito.
export const ORACULOS_PARCIALES_PEN34: Readonly<Record<string, (p: Pregunta) => string | null>> = {
  "PEN4-T2-b": ahorrarGastar,
  "PEN4-T5-a": repartir,
  "PEN4-T5-b": decidir,
};
