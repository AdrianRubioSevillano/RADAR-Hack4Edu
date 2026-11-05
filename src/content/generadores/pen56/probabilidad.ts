// PEN6-T3: qué es más probable y decidir con riesgo (parte calculada). Las
// probabilidades se calculan contando casos en código.
import type { Rng } from "../../../core/rng.ts";
import { elegir, entero, muestra, pregunta } from "../../ayuda.ts";
import type { ColorId, Dificultad, ElementoSerie, FormaId, Generador, Imagen } from "../../tipos.ts";
import { capital, en, mcd, porDificultad, reintentar, unir } from "./comun.ts";

interface Recipiente {
  readonly id: string;
  readonly lugar: string; // "una bolsa"
  readonly el: string; // "La bolsa"
  readonly cosa: string; // "bola"
  readonly cosas: string;
  readonly forma: FormaId;
}

const RECIPIENTES: readonly Recipiente[] = [
  { id: "bolsa", lugar: "una bolsa", el: "La bolsa", cosa: "bola", cosas: "bolas", forma: "circulo" },
  { id: "caja", lugar: "una caja", el: "La caja", cosa: "ficha", cosas: "fichas", forma: "cuadrado" },
  { id: "sobre", lugar: "un sobre", el: "El sobre", cosa: "tarjeta", cosas: "tarjetas", forma: "rectangulo" },
];

const COLOR_F: Readonly<Record<ColorId, { readonly sg: string; readonly pl: string }>> = {
  rojo: { sg: "roja", pl: "rojas" },
  azul: { sg: "azul", pl: "azules" },
  verde: { sg: "verde", pl: "verdes" },
  amarillo: { sg: "amarilla", pl: "amarillas" },
  morado: { sg: "morada", pl: "moradas" },
  naranja: { sg: "naranja", pl: "naranjas" },
};

const COLORES_BOLSA: readonly ColorId[] = ["rojo", "azul", "verde", "amarillo", "morado", "naranja"];

interface Grupo {
  readonly color: ColorId;
  readonly n: number;
}

function cuentaColor(g: Grupo, r: Recipiente): string {
  return g.n === 1 ? `1 ${r.cosa} ${COLOR_F[g.color].sg}` : `${g.n} ${r.cosas} ${COLOR_F[g.color].pl}`;
}

function contenido(grupos: readonly Grupo[], r: Recipiente): string {
  return unir(grupos.map((g) => cuentaColor(g, r)));
}

function dibujo(grupos: readonly Grupo[], r: Recipiente): Imagen {
  const elementos: ElementoSerie[] = grupos.flatMap((g) => Array.from({ length: g.n }, () => ({ forma: r.forma, color: g.color })));
  return { tipo: "serie", elementos };
}

function nombreColor(c: ColorId, r: Recipiente): string {
  return capital(`${r.cosa} ${COLOR_F[c].sg}`);
}

function deRecipiente(crear: (rng: Rng, d: Dificultad, r: Recipiente) => ReturnType<Generador>): Generador {
  return (rng, d) => crear(rng, d, elegir(rng, RECIPIENTES));
}

const SUB_PROBABLE = "PEN6-T3-a";

function gruposDistintos(rng: Rng, cuantos: number, min: number, max: number): Grupo[] {
  const colores = muestra(rng, COLORES_BOLSA, cuantos);
  return reintentar(() => {
    const cantidades = colores.map(() => entero(rng, min, max));
    return new Set(cantidades).size === cuantos ? colores.map((color, i) => ({ color, n: en(cantidades, i) })) : null;
  });
}

const extremoColor = (cual: "mas" | "menos") => deRecipiente((rng, dificultad, r) => {
  const grupos = gruposDistintos(rng, 3, 1, 6);
  const orden = [...grupos].sort((a, b) => (cual === "mas" ? b.n - a.n : a.n - b.n));
  const buena = en(orden, 0);
  const palabra = cual === "mas" ? "más" : "menos";
  const texto = contenido(grupos, r);
  return pregunta(rng, {
    subhabilidad: SUB_PROBABLE,
    dificultad,
    enunciado: `En ${r.lugar} hay ${texto}. Sacas una sin mirar. ¿Qué es ${palabra} probable sacar?`,
    enunciadoFacil: `En ${r.lugar} hay ${texto}. Sacas una sin mirar. ¿Qué es ${palabra} probable?`,
    imagen: dibujo(grupos, r),
    respuesta: { tipo: "opcion", correcta: nombreColor(buena.color, r), distractores: grupos.filter((g) => g !== buena).map((g) => nombreColor(g.color, r)) },
    pista: "Cuenta cuántas hay de cada color. Cuantas más hay, más fácil es que salga.",
    explicacion: `Es la que tiene ${cual === "mas" ? "más" : "menos"} unidades: ${cuentaColor(buena, r)} de ${grupos.reduce((s, g) => s + g.n, 0)} en total.`,
    plantilla: `${SUB_PROBABLE}:${cual}:${r.id}`,
  });
});

const colorImposible = deRecipiente((rng, dificultad, r) => {
  const [ausente, ...presentes] = muestra(rng, COLORES_BOLSA, 3) as [ColorId, ColorId, ColorId];
  const grupos = presentes.map((color) => ({ color, n: entero(rng, 1, 6) }));
  return pregunta(rng, {
    subhabilidad: SUB_PROBABLE,
    dificultad,
    enunciado: `En ${r.lugar} hay ${contenido(grupos, r)}. Sacas una sin mirar. ¿Qué es imposible sacar?`,
    enunciadoFacil: `En ${r.lugar} hay ${contenido(grupos, r)}. Sacas una. ¿Qué es imposible?`,
    imagen: dibujo(grupos, r),
    respuesta: { tipo: "opcion", correcta: nombreColor(ausente, r), distractores: presentes.map((c) => nombreColor(c, r)) },
    pista: "Algo es imposible si no hay ningún caso en que pueda pasar.",
    explicacion: `No hay ninguna ${r.cosa} ${COLOR_F[ausente].sg}, así que no puede salir.`,
    plantilla: `${SUB_PROBABLE}:imposible:${r.id}`,
  });
});

function reducida(a: number, b: number): string {
  const d = mcd(a, b);
  return `${a / d}/${b / d}`;
}

const fraccionDeColor = deRecipiente((rng, dificultad, r) => {
  const { grupos, buena, total } = reintentar(() => {
    const gs = gruposDistintos(rng, 3, 1, 7);
    const t = gs.reduce((s, g) => s + g.n, 0);
    const b = elegir(rng, gs);
    return b.n >= 2 && mcd(b.n, t) === 1 && t - b.n !== b.n ? { grupos: gs, buena: b, total: t } : null;
  });
  const correcta = `${buena.n}/${total}`;
  const candidatas = [reducida(buena.n, total - buena.n), reducida(total - buena.n, total), `1/${total}`, `1/${buena.n}`].filter((x) => x !== correcta && !/^\d+\/1$/.test(x));
  const distractores = [...new Set(candidatas)].slice(0, 3);
  return pregunta(rng, {
    subhabilidad: SUB_PROBABLE,
    dificultad,
    enunciado: `En ${r.lugar} hay ${contenido(grupos, r)}. Sacas una sin mirar. ¿Cuál es la probabilidad de sacar una ${r.cosa} ${COLOR_F[buena.color].sg}?`,
    enunciadoFacil: `En ${r.lugar} hay ${contenido(grupos, r)}. Sacas una. ¿Qué probabilidad hay de que sea ${COLOR_F[buena.color].sg}?`,
    imagen: dibujo(grupos, r),
    respuesta: { tipo: "opcion", correcta, distractores },
    pista: "Probabilidad: casos que quieres, partido por todos los casos posibles.",
    explicacion: `Hay ${buena.n} casos buenos de ${total} en total, así que la probabilidad es ${correcta}.`,
    plantilla: `${SUB_PROBABLE}:fraccion:${r.id}`,
  });
});

const dosRecipientes = deRecipiente((rng, dificultad, r) => {
  const [c1, c2] = muestra(rng, COLORES_BOLSA, 2) as [ColorId, ColorId];
  const { a1, b1, a2, b2 } = reintentar(() => {
    const [x1, y1, x2, y2] = [entero(rng, 1, 8), entero(rng, 1, 8), entero(rng, 1, 8), entero(rng, 1, 8)];
    if (x1 === x2 || (x1 === y1 && x2 === y2)) return null;
    // La trampa solo sirve si hay más de ese color donde no es más probable, o si empatan.
    return { a1: x1, b1: y1, a2: x2, b2: y2 };
  });
  const [t1, t2] = [a1 + b1, a2 + b2];
  const [p1, p2] = [a1 * t2, a2 * t1];
  const nombre1 = `${r.el} A`;
  const nombre2 = `${r.el} B`;
  const igual = "Es igual de probable en A y en B";
  const correcta = p1 === p2 ? igual : p1 > p2 ? nombre1 : nombre2;
  const g1 = contenido([{ color: c1, n: a1 }, { color: c2, n: b1 }], r);
  const g2 = contenido([{ color: c1, n: a2 }, { color: c2, n: b2 }], r);
  const f = COLOR_F[c1].sg;
  return pregunta(rng, {
    subhabilidad: SUB_PROBABLE,
    dificultad,
    enunciado: `${nombre1} tiene ${g1}. ${nombre2} tiene ${g2}. Eliges A o B y sacas una sin mirar. ¿Dónde es más probable sacar una ${r.cosa} ${f}?`,
    enunciadoFacil: `${nombre1}: ${g1}. ${nombre2}: ${g2}. Sacas una sin mirar. ¿Dónde es más probable que sea ${f}?`,
    respuesta: { tipo: "opcion", correcta, distractores: [nombre1, nombre2, igual].filter((x) => x !== correcta) },
    pista: "No basta con ver dónde hay más de ese color: compara qué parte del total son.",
    explicacion: `En A la probabilidad es ${a1}/${t1} y en B, ${a2}/${t2}. Con el mismo denominador son ${p1}/${t1 * t2} y ${p2}/${t1 * t2}.`,
    plantilla: `${SUB_PROBABLE}:dos:${r.id}`,
  });
});

interface Suceso {
  readonly texto: string;
  readonly cumple: (n: number) => boolean;
}

const SUCESOS_DADO: readonly Suceso[] = [
  { texto: "Sacar un número par", cumple: (n) => n % 2 === 0 },
  { texto: "Sacar más de 4", cumple: (n) => n > 4 },
  { texto: "Sacar un 6", cumple: (n) => n === 6 },
  { texto: "Sacar menos de 5", cumple: (n) => n < 5 },
  { texto: "Sacar más de 1", cumple: (n) => n > 1 },
  { texto: "Sacar un 1 o un 2", cumple: (n) => n <= 2 },
];

function casos(s: Suceso, tope: number): number[] {
  return Array.from({ length: tope }, (_, i) => i + 1).filter(s.cumple);
}

const sucesosDado: Generador = (rng, dificultad) => {
  const elegidos = reintentar(() => {
    const m = muestra(rng, SUCESOS_DADO, 3);
    return new Set(m.map((s) => casos(s, 6).length)).size === 3 ? m : null;
  });
  const orden = [...elegidos].sort((a, b) => casos(b, 6).length - casos(a, 6).length);
  const mejor = en(orden, 0);
  return pregunta(rng, {
    subhabilidad: SUB_PROBABLE,
    dificultad,
    enunciado: "Lanzas un dado normal de 6 caras, numeradas del 1 al 6. ¿Qué es más probable?",
    enunciadoFacil: "Lanzas un dado de 6 caras, del 1 al 6. ¿Qué es más probable?",
    respuesta: { tipo: "opcion", correcta: mejor.texto, distractores: orden.slice(1).map((s) => s.texto) },
    pista: "Cuenta cuántas caras del dado cumplen cada opción.",
    explicacion: `Esa opción se cumple con ${casos(mejor, 6).length} caras: ${unir(casos(mejor, 6).map(String))}. Las demás se cumplen con menos.`,
    plantilla: `${SUB_PROBABLE}:dado:${SUCESOS_DADO.indexOf(mejor)}`,
  });
};

function formasSuma(s: number): number {
  let total = 0;
  for (let a = 1; a <= 6; a += 1) for (let b = 1; b <= 6; b += 1) if (a + b === s) total += 1;
  return total;
}

const sumaDosDados: Generador = (rng, dificultad) => {
  const sumas = reintentar(() => {
    const m = muestra(rng, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3);
    return new Set(m.map(formasSuma)).size === 3 ? m : null;
  });
  const orden = [...sumas].sort((a, b) => formasSuma(b) - formasSuma(a));
  const mejor = en(orden, 0);
  return pregunta(rng, {
    subhabilidad: SUB_PROBABLE,
    dificultad,
    enunciado: `Lanzas dos dados normales de 6 caras y sumas los puntos. ¿Qué suma es más probable: ${unir(sumas.map(String), "o")}?`,
    enunciadoFacil: `Lanzas dos dados de 6 caras. Sumas los dos números. ¿Qué es más probable: ${unir(sumas.map(String), "o")}?`,
    respuesta: { tipo: "opcion", correcta: `Suma ${mejor}`, distractores: orden.slice(1).map((s) => `Suma ${s}`) },
    pista: "Cuenta de cuántas formas puede salir cada suma. Por ejemplo, 3 sale con 1 y 2 o con 2 y 1.",
    explicacion: `La suma ${mejor} puede salir de ${formasSuma(mejor)} ${formasSuma(mejor) === 1 ? "forma" : "formas"} entre las 36 posibles, más que las otras dos.`,
    plantilla: `${SUB_PROBABLE}:dosDados:${mejor}`,
  });
};

const trasQuitar = deRecipiente((rng, dificultad, r) => {
  const { antes, despues, quitado, cuantas } = reintentar(() => {
    const gs = gruposDistintos(rng, 3, 2, 8);
    const q = [...gs].sort((a, b) => b.n - a.n)[0];
    if (q === undefined) return null;
    const c = entero(rng, 2, q.n - 1);
    if (q.n < 3) return null;
    const ds = gs.map((g) => (g === q ? { ...g, n: g.n - c } : g));
    if (new Set(ds.map((g) => g.n)).size !== 3) return null;
    const mayor = [...ds].sort((a, b) => b.n - a.n)[0];
    if (mayor === undefined || mayor.color === q.color) return null;
    return { antes: gs, despues: ds, quitado: q, cuantas: c };
  });
  const mejor = [...despues].sort((a, b) => b.n - a.n)[0] ?? en(despues, 0);
  return pregunta(rng, {
    subhabilidad: SUB_PROBABLE,
    dificultad,
    enunciado: `En ${r.lugar} hay ${contenido(antes, r)}. Alguien saca ${cuantas} ${r.cosas} ${COLOR_F[quitado.color].pl} y no las devuelve. Ahora sacas tú una sin mirar. ¿Qué es más probable sacar?`,
    enunciadoFacil: `En ${r.lugar} hay ${contenido(antes, r)}. Alguien quita ${cuantas} ${r.cosas} ${COLOR_F[quitado.color].pl}. Sacas una sin mirar. ¿Qué es más probable?`,
    respuesta: { tipo: "opcion", correcta: nombreColor(mejor.color, r), distractores: despues.filter((g) => g !== mejor).map((g) => nombreColor(g.color, r)) },
    pista: "Cuenta primero cuántas quedan de cada color después de quitar.",
    explicacion: `Ahora quedan ${contenido(despues, r)}. El color con más unidades es el más probable.`,
    plantilla: `${SUB_PROBABLE}:quitar:${r.id}`,
  });
});

const tarjetasNumeradas: Generador = (rng, dificultad) => {
  const tope = elegir(rng, [10, 12, 15, 20]);
  const sucesos: readonly Suceso[] = [
    { texto: "Un número par", cumple: (n) => n % 2 === 0 },
    { texto: "Un múltiplo de 3", cumple: (n) => n % 3 === 0 },
    { texto: "Un múltiplo de 5", cumple: (n) => n % 5 === 0 },
    { texto: "Un número menor que 4", cumple: (n) => n < 4 },
  ];
  const elegidos = reintentar(() => {
    const m = muestra(rng, sucesos, 3);
    return new Set(m.map((s) => casos(s, tope).length)).size === 3 ? m : null;
  });
  const orden = [...elegidos].sort((a, b) => casos(b, tope).length - casos(a, tope).length);
  const mejor = en(orden, 0);
  return pregunta(rng, {
    subhabilidad: SUB_PROBABLE,
    dificultad,
    enunciado: `Hay ${tope} tarjetas numeradas del 1 al ${tope}. Sacas una sin mirar. ¿Qué es más probable que salga?`,
    enunciadoFacil: `Hay ${tope} tarjetas, del 1 al ${tope}. Sacas una. ¿Qué es más probable?`,
    respuesta: { tipo: "opcion", correcta: mejor.texto, distractores: orden.slice(1).map((s) => s.texto) },
    pista: "Escribe qué números cumplen cada opción y cuenta.",
    explicacion: `Lo cumplen ${casos(mejor, tope).length} tarjetas de ${tope}, más que en las otras opciones.`,
    plantilla: `${SUB_PROBABLE}:tarjetas:${tope}`,
  });
};

// ---------- Decidir con riesgo (parte calculada) ----------
const SUB_RIESGO = "PEN6-T3-b";

interface Frecuencia {
  readonly id: string;
  readonly dato: (a: number, b: number) => string;
  readonly pregunta: (n: number) => string;
  readonly facil: (n: number) => string;
}

const FRECUENCIAS: readonly Frecuencia[] = [
  { id: "lluvia", dato: (a, b) => `En esta época llueve ${a} de cada ${b} días.`, pregunta: (n) => `Según ese dato, ¿cuántos días de lluvia se esperan en ${n} días?`, facil: (n) => `Pasan ${n} días. ¿Cuántos días de lluvia se esperan?` },
  { id: "semillas", dato: (a, b) => `De cada ${b} semillas de este saco, brotan ${a}.`, pregunta: (n) => `Según ese dato, si siembras ${n} semillas, ¿cuántas se espera que broten?`, facil: (n) => `Siembras ${n} semillas. ¿Cuántas se espera que broten?` },
  { id: "autobus", dato: (a, b) => `El autobús llega tarde ${a} de cada ${b} días.`, pregunta: (n) => `Según ese dato, ¿cuántos retrasos se esperan en ${n} días?`, facil: (n) => `Pasan ${n} días. ¿Cuántos retrasos se esperan?` },
  { id: "huevos", dato: (a, b) => `En el camino al mercado se rompen ${a} de cada ${b} huevos.`, pregunta: (n) => `Según ese dato, si llevas ${n} huevos, ¿cuántos se espera que se rompan?`, facil: (n) => `Llevas ${n} huevos. ¿Cuántos se espera que se rompan?` },
];

const casosEsperados: Generador = (rng, dificultad) => {
  const f = elegir(rng, FRECUENCIAS);
  const b = elegir(rng, [4, 5, 10]);
  const a = entero(rng, 2, b - 1);
  const veces = entero(rng, 2, 6);
  const n = b * veces;
  return pregunta(rng, {
    subhabilidad: SUB_RIESGO,
    dificultad,
    enunciado: `${f.dato(a, b)} ${f.pregunta(n)}`,
    enunciadoFacil: `${f.dato(a, b)} ${f.facil(n)}`,
    respuesta: { tipo: "numero", valor: a * veces },
    pista: `Mira cuántos grupos de ${b} caben en ${n}.`,
    explicacion: `En ${n} hay ${veces} grupos de ${b}. Se esperan ${veces} × ${a} = ${a * veces}. Es lo esperado, no algo seguro.`,
    plantilla: `${SUB_RIESGO}:esperados:${f.id}`,
  });
};

interface Inversa {
  readonly id: string;
  readonly texto: (a: number, b: number, n: number) => string;
  readonly facil: (a: number, b: number, n: number) => string;
}

const INVERSAS: readonly Inversa[] = [
  { id: "plantas", texto: (a, b, n) => `De cada ${b} semillas brotan ${a}. Un grupo quiere conseguir ${n} plantas. Según ese dato, ¿cuántas semillas debe sembrar?`, facil: (a, b, n) => `De cada ${b} semillas brotan ${a}. Quieren ${n} plantas. ¿Cuántas semillas siembran?` },
  { id: "huevos", texto: (a, b, n) => `De cada ${b} huevos que se llevan al mercado llegan enteros ${a}. Un vendedor quiere tener ${n} huevos enteros. Según ese dato, ¿cuántos huevos debe llevar?`, facil: (a, b, n) => `De cada ${b} huevos llegan enteros ${a}. Quieren ${n} enteros. ¿Cuántos huevos llevan?` },
  { id: "plantones", texto: (a, b, n) => `De cada ${b} árboles que se plantan aquí sobreviven ${a}. Una escuela quiere tener ${n} árboles vivos. Según ese dato, ¿cuántos árboles debe plantar?`, facil: (a, b, n) => `De cada ${b} árboles viven ${a}. Quieren ${n} árboles vivos. ¿Cuántos plantan?` },
  { id: "avisos", texto: (a, b, n) => `De cada ${b} familias avisadas vienen ${a} a la reunión. La escuela quiere que vengan ${n} familias. Según ese dato, ¿a cuántas familias debe avisar?`, facil: (a, b, n) => `De cada ${b} familias avisadas vienen ${a}. Quieren ${n} familias. ¿A cuántas avisan?` },
];

const cuantoPreparar: Generador = (rng, dificultad) => {
  const f = elegir(rng, INVERSAS);
  const b = elegir(rng, [4, 5, 10]);
  const a = entero(rng, 2, b - 1);
  const veces = entero(rng, 2, 8);
  return pregunta(rng, {
    subhabilidad: SUB_RIESGO,
    dificultad,
    enunciado: f.texto(a, b, a * veces),
    enunciadoFacil: f.facil(a, b, a * veces),
    respuesta: { tipo: "numero", valor: b * veces },
    pista: `Mira cuántos grupos de ${a} hacen falta. Cada grupo son ${b} al empezar.`,
    explicacion: `Hacen falta ${veces} grupos de ${a}, porque ${veces} × ${a} = ${a * veces}. Eso son ${veces} × ${b} = ${b * veces} al empezar.`,
    plantilla: `${SUB_RIESGO}:preparar:${f.id}`,
  });
};

const SEMILLA_A = "La semilla A";
const SEMILLA_B = "La semilla B";
const LO_MISMO = "Las dos dan lo mismo";

const dosCultivos: Generador = (rng, dificultad) => {
  const { fija, bueno, malo, buenos } = reintentar(() => {
    const f = entero(rng, 5, 15);
    const bu = entero(rng, 3, 6) * 5;
    const m = entero(rng, 0, 4);
    const k = entero(rng, 1, 3);
    return bu > f && m < f ? { fija: f, bueno: bu, malo: m, buenos: k } : null;
  });
  const [totalA, totalB] = [4 * fija, buenos * bueno + (4 - buenos) * malo];
  const correcta = totalA === totalB ? LO_MISMO : totalA > totalB ? SEMILLA_A : SEMILLA_B;
  const contexto = `La semilla A da ${fija} sacos todos los años. La semilla B da ${bueno} sacos en un año bueno y ${malo} en un año malo.`;
  return pregunta(rng, {
    subhabilidad: SUB_RIESGO,
    dificultad,
    enunciado: `${contexto} De cada 4 años, ${buenos === 1 ? "1 es bueno" : `${buenos} son buenos`}. Según esos datos, ¿qué semilla da más sacos en total en 4 años?`,
    enunciadoFacil: `Semilla A: ${fija} sacos cada año. Semilla B: ${bueno} sacos si el año es bueno, ${malo} si es malo. De cada 4 años, ${buenos === 1 ? "1 es bueno" : `${buenos} son buenos`}. ¿Qué semilla da más en 4 años?`,
    respuesta: { tipo: "opcion", correcta, distractores: [SEMILLA_A, SEMILLA_B, LO_MISMO].filter((x) => x !== correcta) },
    pista: "Calcula el total de cada semilla en los 4 años, separando años buenos y malos.",
    explicacion: `La semilla A da 4 × ${fija} = ${totalA} sacos. La semilla B da ${buenos} × ${bueno} + ${4 - buenos} × ${malo} = ${totalB} sacos.`,
    plantilla: `${SUB_RIESGO}:cultivos:${buenos}`,
  });
};

const reservaParaImprevistos: Generador = (rng, dificultad) => {
  const c = entero(rng, 5, 30);
  const x = entero(rng, 5, 25);
  const b = elegir(rng, [3, 4, 6]);
  const meses = 12;
  const veces = meses / b;
  const contextos = [
    { id: "bomba", texto: "la bomba de agua de la escuela", gasto: "arreglarla" },
    { id: "bicicleta", texto: "la bicicleta del reparto", gasto: "arreglarla" },
    { id: "cerca", texto: "la cerca del huerto", gasto: "arreglarla" },
  ] as const;
  const k = elegir(rng, contextos);
  const total = meses * c + veces * x;
  return pregunta(rng, {
    subhabilidad: SUB_RIESGO,
    dificultad,
    enunciado: `Mantener ${k.texto} cuesta ${c} monedas al mes. Además, se estropea 1 de cada ${b} meses, y ${k.gasto} cuesta ${x} monedas más. Según esos datos, ¿cuántas monedas se espera gastar en 12 meses?`,
    enunciadoFacil: `Mantener ${k.texto} cuesta ${c} monedas al mes. Se estropea 1 de cada ${b} meses. Arreglarla cuesta ${x} monedas. ¿Cuántas monedas se espera gastar en 12 meses?`,
    respuesta: { tipo: "numero", valor: total },
    pista: "Suma el gasto fijo de los 12 meses y el gasto de las averías que se esperan.",
    explicacion: `El gasto fijo es 12 × ${c} = ${12 * c}. Se esperan ${veces} averías: ${veces} × ${x} = ${veces * x}. En total, ${total} monedas.`,
    plantilla: `${SUB_RIESGO}:reserva:${k.id}`,
  });
};

export const GENERADOR_PROBABLE = porDificultad({
  1: [extremoColor("mas"), extremoColor("menos"), colorImposible],
  2: [fraccionDeColor, dosRecipientes],
  3: [sucesosDado, sumaDosDados, trasQuitar, tarjetasNumeradas],
});
export const GENERADOR_RIESGO = porDificultad({ 1: [casosEsperados], 2: [cuantoPreparar], 3: [dosCultivos, reservaParaImprevistos] });
