// PEN3-T1 · Lógica sencilla. Toda respuesta sale de un razonamiento calculado.
import type { Rng } from "../../../core/rng.ts";
import { CONTABLES, barajar, cantidad, elegir, entero, monedas, muestra, nombre, nombres, type Contable } from "../../ayuda.ts";
import type { Dificultad, Generador, Imagen } from "../../tipos.ts";
import { TODAS, buscar, en, enumerar, generadorDePlantillas, mayus, type Contenido, type Plantilla } from "./comun.ts";
import { esImpar, esPar, mayorQue, menorQue, negar, terminaEn, type Propiedad } from "./pistas.ts";

// ---------- Motor mínimo de deducción: reglas "si A, entonces B" ----------
export interface Literal {
  readonly atomo: string;
  readonly valor: boolean;
}
export interface Implicacion {
  readonly si: Literal;
  readonly entonces: Literal;
}

// Aplica las reglas hacia delante y hacia atrás hasta que no se deduce nada nuevo.
export function deducir(reglas: readonly Implicacion[], hechos: readonly Literal[]): ReadonlyMap<string, boolean> {
  const saber = new Map(hechos.map((h) => [h.atomo, h.valor]));
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const r of reglas) {
      if (saber.get(r.si.atomo) === r.si.valor && !saber.has(r.entonces.atomo)) {
        saber.set(r.entonces.atomo, r.entonces.valor);
        cambio = true;
      }
      const consecuencia = saber.get(r.entonces.atomo);
      if (consecuencia !== undefined && consecuencia !== r.entonces.valor && !saber.has(r.si.atomo)) {
        saber.set(r.si.atomo, !r.si.valor);
        cambio = true;
      }
    }
  }
  return saber;
}

interface Prop {
  readonly si: string;
  readonly no: string;
}

interface Mundo {
  readonly clave: string;
  readonly a: Prop;
  readonly b: Prop;
  readonly c: Prop;
  readonly otra: string; // otra causa de b
  readonly ajeno: string; // opción que la regla no dice
}

const MUNDOS: readonly Mundo[] = [
  {
    clave: "lluvia",
    a: { si: "hoy llueve", no: "hoy no llueve" },
    b: { si: "el partido se juega en el aula", no: "el partido no se juega en el aula" },
    c: { si: "el patio se queda vacío", no: "el patio no se queda vacío" },
    otra: "hoy hace mucho viento",
    ajeno: "El partido se juega por la noche.",
  },
  {
    clave: "campana",
    a: { si: "suena la campana", no: "no suena la campana" },
    b: { si: "los niños entran en clase", no: "los niños no entran en clase" },
    c: { si: "el patio se queda en silencio", no: "el patio no se queda en silencio" },
    otra: "la maestra da una palmada",
    ajeno: "Los niños se van a casa.",
  },
  {
    clave: "huerto",
    a: { si: "la tierra está seca", no: "la tierra no está seca" },
    b: { si: "{N} riega el huerto", no: "{N} no riega el huerto" },
    c: { si: "el cubo se queda vacío", no: "el cubo no se queda vacío" },
    otra: "las hojas están caídas",
    ajeno: "{N} planta un árbol.",
  },
  {
    clave: "autobus",
    a: { si: "el autobús llega tarde", no: "el autobús no llega tarde" },
    b: { si: "{N} va a pie a la escuela", no: "{N} no va a pie a la escuela" },
    c: { si: "{N} pasa por el mercado", no: "{N} no pasa por el mercado" },
    otra: "hace buen tiempo",
    ajeno: "{N} se queda en casa.",
  },
  {
    clave: "linterna",
    a: { si: "se acaba la pila", no: "no se acaba la pila" },
    b: { si: "la linterna se apaga", no: "la linterna no se apaga" },
    c: { si: "{N} busca una vela", no: "{N} no busca una vela" },
    otra: "se moja la linterna",
    ajeno: "La linterna da más luz.",
  },
  {
    clave: "gato",
    a: { si: "el gato tiene hambre", no: "el gato no tiene hambre" },
    b: { si: "el gato maúlla en la puerta", no: "el gato no maúlla en la puerta" },
    c: { si: "{N} abre la puerta", no: "{N} no abre la puerta" },
    otra: "el gato quiere salir",
    ajeno: "El gato se duerme en la cama.",
  },
  {
    clave: "tarea",
    a: { si: "{N} termina la tarea", no: "{N} no termina la tarea" },
    b: { si: "{N} sale a jugar", no: "{N} no sale a jugar" },
    c: { si: "{N} ve a sus amigos", no: "{N} no ve a sus amigos" },
    otra: "la maestra da la tarde libre",
    ajeno: "{N} empieza otra tarea.",
  },
];

type TipoRegla = "directa" | "cadena" | "contraria" | "cadenaContraria" | "dosCausas";
const NO_SE_SABE = "No se puede saber";

function regla(si: string, entonces: string): string {
  return `si ${si}, entonces ${entonces}`;
}

function crearDeMundo(m: Mundo, tipo: TipoRegla, rng: Rng): Contenido {
  const n = nombre(rng);
  const f = (t: string): string => t.replaceAll("{N}", n);
  const a: Prop = { si: f(m.a.si), no: f(m.a.no) };
  const b: Prop = { si: f(m.b.si), no: f(m.b.no) };
  const c: Prop = { si: f(m.c.si), no: f(m.c.no) };
  const otra = f(m.otra);
  const si = (p: Prop): Literal => ({ atomo: p.si, valor: true });
  const no = (p: Prop): Literal => ({ atomo: p.si, valor: false });
  const ab: Implicacion = { si: si(a), entonces: si(b) };
  const bc: Implicacion = { si: si(b), entonces: si(c) };
  const ob: Implicacion = { si: { atomo: otra, valor: true }, entonces: si(b) };

  const caso: { reglas: Implicacion[]; textos: string[]; hecho: Literal; dato: string; objetivo: Prop } = {
    directa: { reglas: [ab], textos: [regla(a.si, b.si)], hecho: si(a), dato: a.si, objetivo: b },
    cadena: { reglas: [ab, bc], textos: [regla(a.si, b.si), regla(b.si, c.si)], hecho: si(a), dato: a.si, objetivo: c },
    contraria: { reglas: [ab], textos: [regla(a.si, b.si)], hecho: no(b), dato: b.no, objetivo: a },
    cadenaContraria: { reglas: [ab, bc], textos: [regla(a.si, b.si), regla(b.si, c.si)], hecho: no(c), dato: c.no, objetivo: a },
    dosCausas: { reglas: [ab, ob], textos: [regla(a.si, b.si), regla(otra, b.si)], hecho: si(b), dato: b.si, objetivo: a },
  }[tipo];

  const valor = deducir(caso.reglas, [caso.hecho]).get(caso.objetivo.si);
  const verdad = `${mayus(caso.objetivo.si)}.`;
  const falso = `${mayus(caso.objetivo.no)}.`;
  const correcta = valor === undefined ? NO_SE_SABE : valor ? verdad : falso;
  const tercera = tipo === "directa" ? f(m.ajeno) : NO_SE_SABE;
  const todas = [verdad, falso, tercera];

  const [r1, r2] = [en(caso.textos, 0), caso.textos[1]];
  const reglasTexto = r2 === undefined ? `Esta regla siempre se cumple: ${r1}.` : `Estas reglas siempre se cumplen: ${r1}. ${mayus(r2)}.`;
  const reglasFacil = r2 === undefined ? `Regla: ${r1}.` : `Regla 1: ${r1}. Regla 2: ${r2}.`;

  const pistas: Record<TipoRegla, string> = {
    directa: "Mira si se cumple lo que va después de «si».",
    cadena: "Usa la primera regla. Lo que sale te sirve para usar la segunda.",
    contraria: "Piensa qué tendría que pasar si fuera cierto lo que va después de «si».",
    cadenaContraria: "Empieza por el final: ¿qué regla no se ha podido cumplir?",
    dosCausas: "Mira si hay más de una razón que lleve a lo mismo.",
  };
  const explicaciones: Record<TipoRegla, string> = {
    directa: `La regla dice que, si ${a.si}, entonces ${b.si}. Como ${a.si}, es seguro que ${b.si}.`,
    cadena: `Como ${a.si}, entonces ${b.si}. Y como ${b.si}, entonces ${c.si}.`,
    contraria: `Si fuera cierto que ${a.si}, también sería cierto que ${b.si}. Pero ${b.no}, así que ${a.no}.`,
    cadenaContraria: `Si fuera cierto que ${a.si}, también sería cierto que ${c.si}. Pero ${c.no}, así que ${a.no}.`,
    dosCausas: `Las dos reglas llevan a lo mismo: ${b.si}. Con ese dato no sabes cuál se ha cumplido, así que no se sabe si ${a.si}.`,
  };
  return {
    enunciado: `${reglasTexto} Sabemos que ${caso.dato}. ¿Qué puedes decir con seguridad?`,
    enunciadoFacil: `${reglasFacil} Dato: ${caso.dato}. ¿Qué es seguro?`,
    respuesta: { tipo: "opcion", correcta, distractores: todas.filter((t) => t !== correcta) },
    pista: pistas[tipo],
    explicacion: explicaciones[tipo],
  };
}

function plantillasDeMundos(tipo: TipoRegla, d: Dificultad): Plantilla[] {
  return MUNDOS.map((m) => ({ clave: `${tipo}-${m.clave}`, dificultades: [d], crear: (rng) => crearDeMundo(m, tipo, rng) }));
}

// ---------- Reglas con números ----------
const COLORES_CAJA = ["azul", "roja", "verde", "amarilla"] as const;

function cajas(rng: Rng, d: Dificultad): Contenido {
  const quien = nombre(rng);
  const [c1, c2, c3, c4] = barajar(rng, COLORES_CAJA) as [string, string, string, string];
  if (d === 1) {
    const n = entero(rng, 11, 99);
    const destino = n % 2 === 0 ? c1 : c2;
    const reglas = `si el número es par, la tarjeta va a la caja ${c1}. Si el número es impar, la tarjeta va a la caja ${c2}.`;
    return {
      enunciado: `Regla del juego: ${reglas} ${quien} saca el ${n}. ¿A qué caja va la tarjeta?`,
      enunciadoFacil: `Regla: ${reglas} Sale el ${n}. ¿A qué caja va?`,
      respuesta: { tipo: "opcion", correcta: `A la caja ${destino}`, distractores: [c1, c2, c3].filter((c) => c !== destino).map((c) => `A la caja ${c}`) },
      pista: "Primero mira si el número es par o impar.",
      explicacion: `${n} es ${n % 2 === 0 ? "par" : "impar"}, así que va a la caja ${destino}.`,
    };
  }
  const t = elegir(rng, [30, 40, 50, 60]);
  if (d === 2) {
    const n = entero(rng, t - 15, t + 15);
    if (n === t) return cajas(rng, d);
    const destino = n > t ? c1 : n % 2 === 0 ? c2 : c3;
    const reglas = `si el número es mayor que ${t}, la tarjeta va a la caja ${c1}. Si el número no es mayor que ${t} y es par, la tarjeta va a la caja ${c2}. Si el número no es mayor que ${t} y es impar, la tarjeta va a la caja ${c3}.`;
    return {
      enunciado: `Regla del juego: ${reglas} ${quien} saca el ${n}. ¿A qué caja va la tarjeta?`,
      enunciadoFacil: `Regla: ${reglas} Sale el ${n}. ¿A qué caja va?`,
      respuesta: { tipo: "opcion", correcta: `A la caja ${destino}`, distractores: [c1, c2, c3, c4].filter((c) => c !== destino).map((c) => `A la caja ${c}`) },
      pista: `Primero compara el número con ${t}. Después mira si hace falta saber si es par.`,
      explicacion: n > t ? `${n} es mayor que ${t}, así que va a la caja ${destino}.` : `${n} no es mayor que ${t} y es ${n % 2 === 0 ? "par" : "impar"}, así que va a la caja ${destino}.`,
    };
  }
  const n = t + elegir(rng, [-2, -1, 0, 0, 1, 2]);
  const destino = n % 2 === 1 ? c3 : n > t ? c1 : c2;
  const reglas = `si el número es par y es mayor que ${t}, la tarjeta va a la caja ${c1}. Si el número es par y no es mayor que ${t}, la tarjeta va a la caja ${c2}. Si el número es impar, la tarjeta va a la caja ${c3}.`;
  return {
    enunciado: `Regla del juego: ${reglas} ${quien} saca el ${n}. ¿A qué caja va la tarjeta?`,
    enunciadoFacil: `Regla: ${reglas} Sale el ${n}. ¿A qué caja va?`,
    respuesta: { tipo: "opcion", correcta: `A la caja ${destino}`, distractores: [c1, c2, c3, c4].filter((c) => c !== destino).map((c) => `A la caja ${c}`) },
    pista: "Mira primero si es par. Fíjate bien: un número no es mayor que sí mismo.",
    explicacion:
      n % 2 === 1
        ? `${n} es impar, así que va a la caja ${destino}.`
        : `${n} es par y ${n > t ? "es" : "no es"} mayor que ${t}, así que va a la caja ${destino}.`,
  };
}

function puntos(rng: Rng, d: Dificultad): Contenido {
  const gente = nombres(rng, d === 3 ? 4 : 3);
  if (d === 3) {
    return buscar(() => {
      const minP = entero(rng, 5, 8);
      const maxF = entero(rng, 2, 4);
      const filas = gente.map((n) => ({ n, p: entero(rng, minP - 3, minP + 4), f: entero(rng, 0, maxF + 2) }));
      const pasan = filas.filter((x) => x.p > minP && x.f < maxF);
      const casi = filas.filter((x) => (x.p > minP) !== (x.f < maxF));
      if (pasan.length !== 1 || casi.length < 2) return null;
      const ganador = en(pasan, 0);
      const imagen: Imagen = { tipo: "tabla", titulo: "Resultados del juego", cabeceras: ["Nombre", "Puntos", "Faltas"], filas: filas.map((x) => [x.n, String(x.p), String(x.f)]) };
      return {
        enunciado: `Regla del juego: si tienes más de ${minP} puntos y menos de ${maxF} faltas, pasas a la final. Mira la tabla. ¿Quién pasa a la final?`,
        enunciadoFacil: `Regla: si tienes más de ${minP} puntos y menos de ${maxF} faltas, pasas a la final. Mira la tabla. ¿Quién pasa?`,
        imagen,
        respuesta: { tipo: "opcion", correcta: ganador.n, distractores: gente.filter((g) => g !== ganador.n) },
        pista: "Hay que cumplir las dos cosas a la vez. Mira cada fila.",
        explicacion: `${ganador.n} tiene ${ganador.p} puntos y ${ganador.f === 1 ? "1 falta" : `${ganador.f} faltas`}: cumple las dos condiciones. Los demás fallan en alguna.`,
      };
    });
  }
  const t = entero(rng, 6, 12);
  // En la dificultad 2 uno se queda justo en el límite, que es donde está el error típico.
  const inclusivo = d === 2;
  const ganadorP = inclusivo ? t : t + entero(rng, 1, 4);
  const resto = inclusivo ? [t - 1, t - entero(rng, 2, 4)] : [t, t - entero(rng, 1, 4)];
  const valores = barajar(rng, [ganadorP, ...resto]);
  const filas = gente.map((n, i) => [n, String(en(valores, i))]);
  const ganador = en(gente, valores.indexOf(ganadorP));
  const condicion = inclusivo ? `${t} puntos o más` : `más de ${t} puntos`;
  return {
    enunciado: `Regla del juego: si tienes ${condicion}, pasas a la final. Mira la tabla. ¿Quién pasa a la final?`,
    enunciadoFacil: `Regla: si tienes ${condicion}, pasas a la final. Mira la tabla. ¿Quién pasa?`,
    imagen: { tipo: "tabla", titulo: "Resultados del juego", cabeceras: ["Nombre", "Puntos"], filas },
    respuesta: { tipo: "opcion", correcta: ganador, distractores: gente.filter((g) => g !== ganador) },
    pista: inclusivo ? `«${t} o más» incluye el ${t}.` : `«Más de ${t}» no incluye el ${t}.`,
    explicacion: `${ganador} tiene ${ganadorP} puntos y cumple la regla. Los demás no llegan.`,
  };
}

function compras(rng: Rng): Contenido {
  const gente = nombres(rng, 3);
  const { cosa, lo } = elegir(rng, [
    { cosa: "el libro", lo: "comprarlo" },
    { cosa: "la mochila", lo: "comprarla" },
    { cosa: "la linterna", lo: "comprarla" },
    { cosa: "la pelota", lo: "comprarla" },
  ]);
  const p = entero(rng, 12, 30);
  const ganador = entero(rng, p, p + 6);
  const valores = barajar(rng, [ganador, p - entero(rng, 1, 3), p - entero(rng, 4, 8)]);
  const quien = en(gente, valores.indexOf(ganador));
  return {
    enunciado: `En la tienda, ${cosa} cuesta ${monedas(p)}. Regla: si tienes ${monedas(p)} o más, puedes ${lo}. Mira la tabla. ¿Quién puede ${lo}?`,
    enunciadoFacil: `Regla: si tienes ${monedas(p)} o más, puedes ${lo}. Mira la tabla. ¿Quién puede?`,
    imagen: { tipo: "tabla", titulo: "Dinero de cada persona", cabeceras: ["Nombre", "Monedas"], filas: gente.map((n, i) => [n, String(en(valores, i))]) },
    respuesta: { tipo: "opcion", correcta: quien, distractores: gente.filter((g) => g !== quien) },
    pista: `Busca quién llega a ${p}.`,
    explicacion: `${quien} tiene ${monedas(ganador)}, que llega para pagar ${monedas(p)}. Los demás tienen menos.`,
  };
}

const PLANTILLAS_SI: readonly Plantilla[] = [
  ...plantillasDeMundos("directa", 1),
  ...plantillasDeMundos("cadena", 2),
  ...plantillasDeMundos("contraria", 3),
  ...plantillasDeMundos("cadenaContraria", 3),
  ...plantillasDeMundos("dosCausas", 3),
  { clave: "cajas", dificultades: TODAS, crear: cajas },
  { clave: "puntos", dificultades: TODAS, crear: puntos },
  { clave: "compras", dificultades: [1], crear: compras },
];

// ---------- Verdadero o falso ----------
interface Frase {
  readonly texto: string;
  readonly verdad: boolean;
}

// Una verdadera (o una falsa, si `buscaFalsa`) y el resto de la otra clase.
function escoger(rng: Rng, frases: readonly Frase[], total: number, buscaFalsa: boolean): { correcta: string; distractores: string[] } | null {
  const unicas = [...new Map(frases.map((f) => [f.texto, f])).values()];
  const buenas = unicas.filter((f) => f.verdad !== buscaFalsa);
  const malas = unicas.filter((f) => f.verdad === buscaFalsa);
  if (buenas.length === 0 || malas.length < total - 1) return null;
  return { correcta: elegir(rng, buenas).texto, distractores: muestra(rng, malas, total - 1).map((f) => f.texto) };
}

function frasesDeObjetos(grupos: readonly { c: Contable; n: number }[]): Frase[] {
  const salida: Frase[] = [];
  for (const g of grupos) {
    for (const k of [g.n - 2, g.n - 1, g.n, g.n + 1, g.n + 2]) {
      if (k >= 2) salida.push({ texto: `Hay ${k} ${g.c.plural}.`, verdad: k === g.n });
    }
    for (const h of grupos) {
      if (g === h) continue;
      salida.push({ texto: `Hay más ${g.c.plural} que ${h.c.plural}.`, verdad: g.n > h.n });
      salida.push({ texto: `Hay menos ${g.c.plural} que ${h.c.plural}.`, verdad: g.n < h.n });
    }
  }
  return salida;
}

function grupos(rng: Rng, n: number, max: number): { c: Contable; n: number }[] {
  const objetos = muestra(rng, CONTABLES, n);
  const cantidades = muestra(rng, Array.from({ length: max - 1 }, (_, i) => i + 2), n);
  return objetos.map((c, i) => ({ c, n: en(cantidades, i) }));
}

function resumen(gs: readonly { c: Contable; n: number }[]): string {
  return enumerar(gs.map((g) => cantidad(g.n, g.c)));
}

function imagenGrupos(gs: readonly { c: Contable; n: number }[]): Imagen {
  return { tipo: "objetos", grupos: gs.map((g) => ({ objeto: g.c.id, cantidad: g.n })) };
}

function objetos2(rng: Rng): Contenido {
  const gs = grupos(rng, 2, 9);
  const op = buscar(() => escoger(rng, frasesDeObjetos(gs), 3, false));
  return {
    enunciado: "Mira el dibujo. ¿Qué frase es verdadera?",
    enunciadoFacil: "Mira el dibujo. Una frase es verdadera. ¿Cuál?",
    imagen: imagenGrupos(gs),
    respuesta: { tipo: "opcion", ...op },
    pista: "Cuenta cada grupo antes de leer las frases.",
    explicacion: `En el dibujo hay ${resumen(gs)}. Por eso es verdad: «${op.correcta}»`,
  };
}

function objetos3(rng: Rng): Contenido {
  const gs = grupos(rng, 3, 9);
  const total = gs.reduce((t, g) => t + g.n, 0);
  const frases = [...frasesDeObjetos(gs), ...[total - 2, total - 1, total, total + 1, total + 2].map((k) => ({ texto: `En total hay ${k} objetos.`, verdad: k === total }))];
  const op = buscar(() => escoger(rng, frases, 4, false));
  return {
    enunciado: "Mira el dibujo. ¿Qué frase es verdadera?",
    enunciadoFacil: "Mira el dibujo. Una frase es verdadera. ¿Cuál?",
    imagen: imagenGrupos(gs),
    respuesta: { tipo: "opcion", ...op },
    pista: "Cuenta cada grupo. Si la frase habla del total, suma los tres grupos.",
    explicacion: `En el dibujo hay ${resumen(gs)}, ${total} objetos en total. Por eso es verdad: «${op.correcta}»`,
  };
}

function objetosFalsa(rng: Rng): Contenido {
  const gs = grupos(rng, 3, 9);
  const op = buscar(() => escoger(rng, frasesDeObjetos(gs), 4, true));
  return {
    enunciado: "Mira el dibujo. Tres frases son verdaderas y una es falsa. ¿Cuál es la frase falsa?",
    enunciadoFacil: "Mira el dibujo. Una frase es falsa. ¿Cuál?",
    imagen: imagenGrupos(gs),
    respuesta: { tipo: "opcion", ...op },
    pista: "Comprueba las frases una a una con el dibujo.",
    explicacion: `En el dibujo hay ${resumen(gs)}. Por eso no es verdad: «${op.correcta}»`,
  };
}

function frasesDeNumero(n: number): Frase[] {
  const decena = Math.floor(n / 10) * 10;
  const lista: Propiedad[] = [esPar, esImpar, mayorQue(decena - 10), mayorQue(decena + 10), menorQue(decena + 10), menorQue(decena), terminaEn(n % 10), terminaEn((n + 3) % 10)];
  return lista.map((p) => ({ texto: `${n} ${p.texto}.`, verdad: p.cumple(n) }));
}

function numeroSimple(rng: Rng): Contenido {
  const n = entero(rng, 21, 89);
  const op = buscar(() => escoger(rng, frasesDeNumero(n), 3, false));
  return {
    enunciado: `Lee estas frases sobre el número ${n}. ¿Qué frase es verdadera?`,
    enunciadoFacil: `Piensa en el número ${n}. ¿Qué frase es verdadera?`,
    respuesta: { tipo: "opcion", ...op },
    pista: "Mira la última cifra y compara el número con los que aparecen.",
    explicacion: `Es verdad que «${op.correcta}» Las otras frases no se cumplen para ${n}.`,
  };
}

function numeroCompuesto(rng: Rng, n: number, negaciones: boolean): { correcta: string; distractores: string[] } {
  const decena = Math.floor(n / 10) * 10;
  const base: Propiedad[] = [esPar, esImpar, mayorQue(decena - 5), menorQue(decena + 15), mayorQue(decena + 15), menorQue(decena - 5), terminaEn(n % 10), terminaEn((n + 1) % 10)];
  const lista = negaciones ? [...base, ...base.map(negar)] : base;
  const si = lista.filter((p) => p.cumple(n));
  const no = lista.filter((p) => !p.cumple(n));
  return buscar(() => {
    const [p, q] = muestra(rng, si, 2) as [Propiedad, Propiedad];
    const frase = (a: Propiedad, b: Propiedad): string => `${n} ${a.texto} y ${b.texto}.`;
    const [f1, f2] = [elegir(rng, no), elegir(rng, no)];
    if (f1.texto === f2.texto) return null; // evita «48 no termina en 8 y no termina en 8»
    const falsas = [frase(elegir(rng, si), elegir(rng, no)), frase(elegir(rng, no), elegir(rng, si)), frase(f1, f2)];
    if (new Set(falsas).size !== 3) return null;
    return { correcta: frase(p, q), distractores: falsas };
  });
}

function numeroY(rng: Rng): Contenido {
  const n = entero(rng, 21, 79);
  const op = numeroCompuesto(rng, n, false);
  return {
    enunciado: `Lee estas frases sobre el número ${n}. Una frase con «y» solo es verdadera si se cumplen sus dos partes. ¿Qué frase es verdadera?`,
    enunciadoFacil: `Piensa en el número ${n}. Con «y» se cumplen las dos partes. ¿Qué frase es verdadera?`,
    respuesta: { tipo: "opcion", ...op },
    pista: "Comprueba cada parte de la frase por separado.",
    explicacion: `En «${op.correcta}» se cumplen las dos partes. En las otras frases falla alguna parte.`,
  };
}

function numeroNo(rng: Rng): Contenido {
  const n = entero(rng, 21, 79);
  const op = numeroCompuesto(rng, n, true);
  return {
    enunciado: `Lee estas frases sobre el número ${n}. Una frase con «y» solo es verdadera si se cumplen sus dos partes. Fíjate bien en la palabra «no». ¿Qué frase es verdadera?`,
    enunciadoFacil: `Piensa en el número ${n}. Con «y» se cumplen las dos partes. Fíjate en la palabra «no». ¿Qué frase es verdadera?`,
    respuesta: { tipo: "opcion", ...op },
    pista: "Comprueba cada parte por separado. La palabra «no» le da la vuelta a lo que dice.",
    explicacion: `En «${op.correcta}» se cumplen las dos partes. En las otras frases falla alguna parte.`,
  };
}

function cuantasVerdaderas(rng: Rng): Contenido {
  const n = entero(rng, 21, 89);
  const k = entero(rng, 0, 3);
  const props = frasesDeNumero(n);
  const elegidas = barajar(rng, [...muestra(rng, props.filter((f) => f.verdad), Math.min(k, 3)), ...muestra(rng, props.filter((f) => !f.verdad), 3 - k)]);
  const textos = elegidas.map((f, i) => `Frase ${i + 1}: ${f.texto}`).join(" ");
  return {
    enunciado: `Lee estas tres frases. ${textos} ¿Cuántas frases son verdaderas?`,
    enunciadoFacil: `${textos} ¿Cuántas son verdaderas? Escribe el número.`,
    respuesta: { tipo: "numero", valor: k },
    pista: "Comprueba las frases una a una y lleva la cuenta.",
    explicacion: `${k === 0 ? "Ninguna frase se cumple" : k === 1 ? "Solo se cumple 1 frase" : `Se cumplen ${k} frases`} para el número ${n}.`,
  };
}

function barrasLibros(rng: Rng): Contenido {
  const gente = nombres(rng, 3);
  const valores = muestra(rng, [2, 3, 4, 5, 6, 7, 8, 9], 3);
  const frases: Frase[] = [];
  gente.forEach((a, i) => {
    const va = en(valores, i);
    for (const k of [va - 1, va, va + 1]) if (k >= 2) frases.push({ texto: `${a} ha leído ${k} libros.`, verdad: k === va });
    gente.forEach((b, j) => {
      if (i !== j) frases.push({ texto: `${a} ha leído más libros que ${b}.`, verdad: va > en(valores, j) });
    });
  });
  const op = buscar(() => escoger(rng, frases, 3, false));
  return {
    enunciado: "Mira el gráfico. ¿Qué frase es verdadera?",
    enunciadoFacil: "Mira el gráfico. Una frase es verdadera. ¿Cuál?",
    imagen: { tipo: "barras", titulo: "Libros leídos", etiquetas: gente, valores },
    respuesta: { tipo: "opcion", ...op },
    pista: "Cuanto más alta es la barra, más libros ha leído.",
    explicacion: `En el gráfico, ${enumerar(gente.map((g, i) => `${g} ha leído ${en(valores, i)} libros`))}.`,
  };
}

function monedasFrases(rng: Rng, d: Dificultad): Contenido {
  const valores = barajar(rng, Array.from({ length: entero(rng, 4, 6) }, () => elegir(rng, [1, 2, 5, 10])));
  const suma = valores.reduce((a, b) => a + b, 0);
  const n = valores.length;
  const cuenta = (v: number): number => valores.filter((x) => x === v).length;
  const frases: Frase[] = [];
  if (d === 1) {
    for (const k of [n - 2, n - 1, n, n + 1]) frases.push({ texto: `Hay ${k} monedas.`, verdad: k === n });
    for (const [a, b] of [[1, 2], [2, 5], [5, 10], [1, 5], [2, 10]] as const) {
      frases.push({ texto: `Hay más monedas de ${a} que de ${b}.`, verdad: cuenta(a) > cuenta(b) });
      frases.push({ texto: `Hay más monedas de ${b} que de ${a}.`, verdad: cuenta(b) > cuenta(a) });
    }
  } else {
    for (const k of [suma - 5, suma - 2, suma - 1, suma, suma + 1, suma + 2, suma + 5]) if (k >= 2) frases.push({ texto: `Las monedas suman ${k}.`, verdad: k === suma });
    for (const k of [suma - 3, suma + 3]) if (k >= 2) frases.push({ texto: `Las monedas suman más de ${k}.`, verdad: suma > k });
  }
  const op = buscar(() => escoger(rng, frases, 3, false));
  return {
    enunciado: "Mira las monedas. ¿Qué frase es verdadera?",
    enunciadoFacil: "Mira las monedas. Una frase es verdadera. ¿Cuál?",
    imagen: { tipo: "monedas", valores },
    respuesta: { tipo: "opcion", ...op },
    pista: d === 1 ? "Cuenta las monedas de cada valor." : "Suma el valor de todas las monedas.",
    explicacion: d === 1 ? `Hay ${n} monedas en total. Es verdad que: «${op.correcta}»` : `Las monedas suman ${suma}. Es verdad que: «${op.correcta}»`,
  };
}

const COSAS_TABLA = ["cuaderno", "lápiz", "regla", "libro"] as const;

function tablaFrases(rng: Rng, buscaFalsa: boolean): Contenido {
  const gente = nombres(rng, 4);
  const cosas = muestra(rng, COSAS_TABLA, 3);
  return buscar(() => {
    const tiene = gente.map(() => cosas.map(() => rng() < 0.55));
    const articulo = (c: string): string => (c === "regla" ? "una regla" : `un ${c}`);
    const frases: Frase[] = [];
    cosas.forEach((c, j) => {
      const columna = tiene.map((fila) => en(fila, j));
      const cuantos = columna.filter(Boolean).length;
      frases.push({ texto: `Todos traen ${articulo(c)}.`, verdad: cuantos === gente.length });
      frases.push({ texto: `Nadie trae ${articulo(c)}.`, verdad: cuantos === 0 });
      gente.forEach((g, i) => {
        frases.push({ texto: `Solo ${g} trae ${articulo(c)}.`, verdad: cuantos === 1 && en(columna, i) });
        frases.push({ texto: `${g} trae ${articulo(c)}.`, verdad: en(columna, i) });
        frases.push({ texto: `${g} no trae ${articulo(c)}.`, verdad: !en(columna, i) });
      });
    });
    // Se exige alguna frase con todos, nadie o solo: son las que hacen pensar.
    const cuantificadas = frases.filter((f) => /^(Todos|Nadie|Solo)/.test(f.texto));
    const lista = buscaFalsa ? frases : cuantificadas.some((f) => f.verdad) ? [...cuantificadas.filter((f) => f.verdad), ...frases.filter((f) => !f.verdad)] : null;
    if (lista === null) return null;
    const op = escoger(rng, lista, 4, buscaFalsa);
    if (op === null) return null;
    const imagen: Imagen = {
      tipo: "tabla",
      titulo: "Lo que trae cada uno",
      cabeceras: ["Nombre", ...cosas.map(mayus)],
      filas: gente.map((g, i) => [g, ...cosas.map((_, j) => (en(en(tiene, i), j) ? "Sí" : "No"))]),
    };
    return {
      enunciado: buscaFalsa ? "Mira la tabla. Tres frases son verdaderas y una es falsa. ¿Cuál es la frase falsa?" : "Mira la tabla. ¿Qué frase es verdadera?",
      enunciadoFacil: buscaFalsa ? "Mira la tabla. Una frase es falsa. ¿Cuál?" : "Mira la tabla. Una frase es verdadera. ¿Cuál?",
      imagen,
      respuesta: { tipo: "opcion", ...op },
      pista: "«Todos» es cada fila, «nadie» es ninguna fila y «solo» es una única fila.",
      explicacion: `Si miras la columna de esa cosa en la tabla, ${buscaFalsa ? "no es verdad" : "es verdad"}: «${op.correcta}»`,
    };
  });
}

const PLANTILLAS_VF: readonly Plantilla[] = [
  { clave: "objetos2", dificultades: [1], crear: objetos2 },
  { clave: "numero", dificultades: [1], crear: numeroSimple },
  { clave: "barras", dificultades: [1], crear: barrasLibros },
  { clave: "monedas", dificultades: [1, 2], crear: monedasFrases },
  { clave: "objetos3", dificultades: [2], crear: objetos3 },
  { clave: "numero-y", dificultades: [2], crear: numeroY },
  { clave: "tabla", dificultades: [2], crear: (rng) => tablaFrases(rng, false) },
  { clave: "objetos-falsa", dificultades: [3], crear: objetosFalsa },
  { clave: "tabla-falsa", dificultades: [3], crear: (rng) => tablaFrases(rng, true) },
  { clave: "numero-no", dificultades: [3], crear: numeroNo },
  { clave: "cuantas", dificultades: [3], crear: cuantasVerdaderas },
];

export const GENERADORES_LOGICA3: Readonly<Record<string, readonly Generador[]>> = {
  "PEN3-T1-a": [generadorDePlantillas("PEN3-T1-a", PLANTILLAS_SI)],
  "PEN3-T1-b": [generadorDePlantillas("PEN3-T1-b", PLANTILLAS_VF)],
};
