// NUM de 2.º de primaria: números hasta 100, sumas y restas, dinero, hora y calendario,
// y multiplicar como suma repetida.
import type { Rng } from "../../../core/rng.ts";
import { barajar, elegir, entero, muestra, nombres, pregunta, type RespuestaBorrador } from "../../ayuda.ts";
import type { Dificultad, Generador, Imagen, MapaGeneradores } from "../../tipos.ts";
import {
  BOTELLA, CUADERNO, CUBO_AGUA, FLOR, GORRO, HUEVO, LAPIZ, LIBRO, MANZANA, MESES, MOCHILA, NARANJA, PAGINA, PAJARO, PARAGUAS, PELOTA, PERSONA, PIEDRA, SEMILLA, SILLA, TAZA,
  ayudaBloques, bloques, cant, clave, cuantos, decUni, decenasTexto, descomponer, dia, dibujo, distractoresTexto, el, en, enLetras, etiquetaMonedas, grupos, hora, horaCiclo,
  horaDigital, imagenMonedas, listaY, los, mayus, mes, monedasDeDificultad, opcionNumerica, ordenarMonedas, porD, porR, quedan, reloj, respuestaNum, separados, serieDeTextos, suma,
  un, unidadesTexto, variantesMonedas, type Unidad,
} from "./comun.ts";

interface OpcionImagen {
  readonly texto: string;
  readonly imagen: Imagen;
}

// Aquí las monedas tienen valores distintos: «cuesta 16 monedas» se confundiría con 16 monedas sueltas.
const valorDinero = (n: number): string => String(n);

const decena = (n: number): number => Math.floor(n / 10);
const unidad = (n: number): number => n % 10;

// ---------- NUM2-T1: números hasta 100 ----------
const T1A = "NUM2-T1-a";

const leerBloques: Generador = (rng, d) => {
  const t = entero(rng, ...porR(d, [1, 5], [1, 9], [1, 7]));
  const u = entero(rng, ...porR(d, [1, 9], [0, 9], [11, 19]));
  const n = t * 10 + u;
  const candidatos = d === 3 ? [t * 10 + unidad(u), t + u, n + 10, n - 1] : [u * 10 + t, t + u, t * 10, n + 1, n - 1, n + 10];
  return pregunta(rng, {
    subhabilidad: T1A,
    dificultad: d,
    enunciado: `¿Qué número forman estos bloques? ${ayudaBloques}`,
    enunciadoFacil: `Mira los bloques. ${ayudaBloques} ¿Qué número es?`,
    imagen: bloques(t, u),
    respuesta: respuestaNum(rng, d, n, candidatos.filter((x) => x > 0)),
    pista: "Cuenta los bloques largos de 10 en 10. Después sigue con los sueltos de 1 en 1.",
    explicacion: d === 3
      ? `Con ${unidadesTexto(u)} formas 1 decena más y te ${unidad(u) === 1 ? "queda" : "quedan"} ${unidadesTexto(unidad(u))}. Son ${decUni(t + 1, unidad(u))}: el ${n}.`
      : `${decenasTexto(t)} ${t === 1 ? "es" : "son"} ${t * 10} y ${unidadesTexto(u)} más dan ${n}.`,
    plantilla: clave(T1A, "bloques", t, u),
  });
};

const descomposicionesFalsas = (t: number, u: number): string[] => [decUni(u, t), decUni(t, u + 1), decUni(t + 1, u), decUni(t - 1, u), decUni(t, t)].filter((x) => !x.includes("-"));

const lugarDeLaCifra: Generador = (rng, d) => {
  if (d === 3) {
    const t = entero(rng, 2, 9);
    const u = rng() < 0.4 ? 0 : entero(rng, 1, 9);
    const n = t * 10 + u;
    const correcta = decUni(t, u);
    return pregunta(rng, {
      subhabilidad: T1A,
      dificultad: d,
      enunciado: `¿Cómo se descompone el número ${n}?`,
      enunciadoFacil: `Mira el número ${n}. ¿Cuántas decenas y unidades lo forman?`,
      respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, descomposicionesFalsas(t, u), 3) },
      pista: "La cifra de la izquierda dice las decenas. La de la derecha dice las unidades.",
      explicacion: `En el ${n}, el ${t} está en las decenas y el ${u} en las unidades.`,
      plantilla: clave(T1A, "descompone", n),
    });
  }
  const t = entero(rng, 2, 9);
  const u = entero(rng, 1, 9);
  const n = t * 10 + u;
  const lugar = d === 1 ? "decenas" : "unidades";
  const correcta = d === 1 ? t : u;
  const otra = d === 1 ? u : t;
  return pregunta(rng, {
    subhabilidad: T1A,
    dificultad: d,
    enunciado: `En el número ${n}, ¿qué cifra está en el lugar de las ${lugar}?`,
    enunciadoFacil: `Mira el número ${n}. ¿Qué cifra marca las ${lugar}?`,
    respuesta: opcionNumerica(rng, correcta, [otra, n, correcta + 1, correcta - 1].filter((x) => x > 0)),
    pista: "En un número de dos cifras, las decenas van a la izquierda y las unidades a la derecha.",
    explicacion: `En el ${n}, el ${t} son las decenas y el ${u} son las unidades.`,
    plantilla: clave(T1A, "lugar", lugar, n),
  });
};

const componerTexto: Generador = (rng, d) => {
  const t = entero(rng, 1, 8);
  const u = d === 3 ? elegir(rng, [0, 10, 11, 12, 13, 14, 15]) : entero(rng, 1, 9);
  const n = t * 10 + u;
  const partes = d === 1 ? `${decenasTexto(t)} y ${unidadesTexto(u)}` : `${unidadesTexto(u)} y ${decenasTexto(t)}`;
  const alReves = u < 10 ? u * 10 + t : t * 10 + unidad(u);
  return pregunta(rng, {
    subhabilidad: T1A,
    dificultad: d,
    enunciado: `¿Qué número forman ${partes}?`,
    enunciadoFacil: `Junta ${partes}. ¿Qué número sale?`,
    respuesta: respuestaNum(rng, d, n, [alReves, t + u, n + 10, n - 10, n + 1].filter((x) => x > 0)),
    pista: "Mira bien qué número son las decenas, aunque esté escrito al final.",
    explicacion: `${decenasTexto(t)} ${t === 1 ? "es" : "son"} ${t * 10}. ${t * 10} + ${u} = ${n}.`,
    plantilla: clave(T1A, "componer", t, u),
  });
};

const tocarBloques: Generador = (rng, d) => {
  const t = entero(rng, ...porR(d, [1, 4], [2, 9], [2, 9]));
  const u = d === 3 ? elegir(rng, [0, 1, 9]) : entero(rng, 1, 9);
  const n = t * 10 + u;
  const opcion = (dd: number, uu: number): OpcionImagen => ({ texto: decUni(dd, uu), imagen: bloques(dd, uu) });
  const parejas: readonly (readonly [number, number])[] = [[u, t], [t + 1, u], [t, u + 1], [t - 1, u], [t, u === 0 ? 2 : u - 1]];
  const validas = parejas.filter(([a, b]) => a >= 0 && !(a === t && b === u) && a * 10 + b !== n);
  const unicas = [...new Map(validas.map((par) => [par.join("-"), par])).values()];
  const [primera, ...resto] = unicas as [readonly [number, number], ...(readonly [number, number])[]];
  const elegidas = [primera, ...muestra(rng, resto, 2)];
  return pregunta(rng, {
    subhabilidad: T1A,
    dificultad: d,
    enunciado: `Toca los bloques que forman el número ${n}. ${ayudaBloques}`,
    enunciadoFacil: `Busca el número ${n}. ${ayudaBloques} Toca los bloques.`,
    respuesta: { tipo: "imagen", correcta: opcion(t, u), distractores: elegidas.map(([a, b]) => opcion(a, b)) },
    pista: "Mira cuántas decenas y cuántas unidades tiene el número.",
    explicacion: `El ${n} tiene ${decUni(t, u)}.`,
    plantilla: clave(T1A, "tocar", n),
  });
};

const T1B = "NUM2-T1-b";

function numeroParaLeer(rng: Rng, d: Dificultad): number {
  if (d === 1) return entero(rng, 30, 59);
  if (d === 2) return entero(rng, 60, 99);
  return elegir(rng, [16, 17, 18, 19, 21, 22, 23, 26, 27, 28, 29, 40, 60, 70, 80, 90, 61, 71, 81, 91]);
}

// Errores reales al leer y escribir números de dos cifras.
function confusiones(n: number): number[] {
  const t = decena(n);
  const u = unidad(n);
  if (n < 20) return [u * 10, u, u * 10 + 1, n + 1, n - 1];
  if (u === 0) return [t, 10 + t, n + t, n + 10, n - 10];
  const vecina = t === 6 ? 7 : t === 7 ? 6 : t === 9 ? 8 : t + 1;
  return [u * 10 + t, t * 100 + u, vecina * 10 + u, n + 1, n - 1];
}

const letrasACifras: Generador = (rng, d) => {
  const n = numeroParaLeer(rng, d);
  const palabra = enLetras(n);
  return pregunta(rng, {
    subhabilidad: T1B,
    dificultad: d,
    enunciado: `¿Cómo se escribe con cifras «${palabra}»?`,
    enunciadoFacil: `Lee: ${palabra}. ¿Qué número es?`,
    respuesta: opcionNumerica(rng, n, confusiones(n)),
    pista: "Piensa primero en las decenas y después en las unidades.",
    explicacion: `«${mayus(palabra)}» tiene ${decUni(decena(n), unidad(n))}: se escribe ${n}.`,
    plantilla: clave(T1B, "cifras", n),
  });
};

function palabrasFalsas(rng: Rng, n: number): string[] {
  const palabra = enLetras(n);
  const candidatos = barajar(rng, confusiones(n).filter((x) => x > 0 && x <= 100)).map(enLetras);
  return distractoresTexto(rng, palabra, candidatos, 3);
}

const cifrasALetras: Generador = (rng, d) => {
  const n = numeroParaLeer(rng, d);
  const palabra = enLetras(n);
  return pregunta(rng, {
    subhabilidad: T1B,
    dificultad: d,
    enunciado: `¿Cómo se lee el número ${n}?`,
    enunciadoFacil: `Mira el número ${n}. ¿Cómo se lee?`,
    respuesta: { tipo: "opcion", correcta: palabra, distractores: palabrasFalsas(rng, n) },
    pista: "Lee primero la cifra de las decenas.",
    explicacion: `El ${n} se lee «${palabra}».`,
    plantilla: clave(T1B, "leer", n),
  });
};

const bloquesALetras: Generador = (rng, d) => {
  const n = numeroParaLeer(rng, d);
  const palabra = enLetras(n);
  return pregunta(rng, {
    subhabilidad: T1B,
    dificultad: d,
    enunciado: `¿Cómo se lee el número de estos bloques? ${ayudaBloques}`,
    enunciadoFacil: `Mira los bloques. ${ayudaBloques} ¿Cómo se lee el número?`,
    imagen: bloques(decena(n), unidad(n)),
    respuesta: { tipo: "opcion", correcta: palabra, distractores: palabrasFalsas(rng, n) },
    pista: "Primero averigua qué número es. Después léelo.",
    explicacion: `Los bloques forman el ${n}, que se lee «${palabra}».`,
    plantilla: clave(T1B, "bloques", n),
  });
};

const dictado: Generador = (rng, d) => {
  const n = d === 3 && rng() < 0.15 ? 100 : numeroParaLeer(rng, d);
  const palabra = enLetras(n);
  return pregunta(rng, {
    subhabilidad: T1B,
    dificultad: d,
    enunciado: `Escribe con cifras: ${palabra}.`,
    enunciadoFacil: `Lee: ${palabra}. Escribe el número.`,
    respuesta: { tipo: "numero", valor: n },
    pista: n === 100 ? "Es el número que va justo después del 99." : "Piensa cuántas decenas y cuántas unidades dice la palabra.",
    explicacion: `«${mayus(palabra)}» se escribe ${n}.`,
    plantilla: clave(T1B, "dictado", n),
  });
};

const T1C = "NUM2-T1-c";

function tresParaComparar(rng: Rng, d: Dificultad): number[] {
  if (d === 1) return separados(rng, 3, 1, 9, 2).map((t) => t * 10 + entero(rng, 0, 9));
  const t = entero(rng, 2, 9);
  if (d === 2) return separados(rng, 3, 0, 9, 1).map((u) => t * 10 + u);
  const u = entero(rng, 1, 9 - (t === 9 ? 1 : 0));
  const base = t === u ? [t * 10 + u, (t - 1) * 10 + u + 1, u * 10 + t + (t === 9 ? -1 : 1)] : [t * 10 + u, u * 10 + t];
  const extra = t * 10 + (u === 9 ? 8 : u + 1);
  const lista = [...new Set([...base, extra, t * 10 + (u === 0 ? 1 : u - 1)])];
  return lista.slice(0, 3);
}

const cualEsMayor: Generador = (rng, d) => {
  const valores = tresParaComparar(rng, d);
  const pide = d === 1 || rng() < 0.5 ? "mayor" : "menor";
  const correcta = pide === "mayor" ? Math.max(...valores) : Math.min(...valores);
  const mismasDecenas = new Set(valores.map(decena)).size === 1;
  return pregunta(rng, {
    subhabilidad: T1C,
    dificultad: d,
    enunciado: `¿Cuál de estos números es el ${pide}?`,
    enunciadoFacil: `Lee los números. ¿Cuál es el ${pide}?`,
    respuesta: { tipo: "opcion", correcta: String(correcta), distractores: valores.filter((v) => v !== correcta).map(String) },
    pista: "Mira primero las decenas. Si son iguales, mira las unidades.",
    explicacion: mismasDecenas
      ? `Todos tienen ${decenasTexto(decena(correcta))}. Por las unidades, el ${pide} es el ${correcta}.`
      : `Compara primero las decenas y después las unidades. El ${pide} es el ${correcta}.`,
    plantilla: clave(T1C, "cual", pide, ...[...valores].sort((a, b) => a - b)),
  });
};

const SIGNOS = { mayor: "> (mayor que)", menor: "< (menor que)", igual: "= (igual que)" } as const;

const signoEnHueco: Generador = (rng, d) => {
  const t = entero(rng, 1, 8);
  const u = entero(rng, t + 1, 9);
  const directo = t * 10 + u;
  const par: readonly [number, number] = d === 1
    ? [entero(rng, 10, 39), entero(rng, 50, 99)]
    : d === 2
      ? [directo, u === 9 ? directo - 1 : directo + 1]
      : rng() < 0.2 ? [directo, directo] : [directo, u * 10 + t];
  const [a, b] = rng() < 0.5 ? par : [par[1], par[0]];
  const correcta = a > b ? SIGNOS.mayor : a < b ? SIGNOS.menor : SIGNOS.igual;
  const motivo = a === b ? "Son el mismo número." : `El ${Math.max(a, b)} es mayor que el ${Math.min(a, b)}.`;
  return pregunta(rng, {
    subhabilidad: T1C,
    dificultad: d,
    enunciado: `¿Qué signo va en el hueco? ${a} ___ ${b}`,
    enunciadoFacil: `Mira: ${a} ___ ${b}. ¿Qué signo va en el hueco?`,
    respuesta: { tipo: "opcion", correcta, distractores: Object.values(SIGNOS).filter((s) => s !== correcta) },
    pista: "Compara primero las decenas de los dos números.",
    explicacion: `${motivo} Por eso escribimos ${a} ${correcta.charAt(0)} ${b}.`,
    plantilla: clave(T1C, "signo", a, b),
  });
};

const tocarBloquesMayor: Generador = (rng, d) => {
  const valores = tresParaComparar(rng, d);
  const pide = d === 1 || rng() < 0.5 ? "mayor" : "menor";
  const correcta = pide === "mayor" ? Math.max(...valores) : Math.min(...valores);
  const opcion = (n: number): OpcionImagen => ({ texto: decUni(decena(n), unidad(n)), imagen: bloques(decena(n), unidad(n)) });
  return pregunta(rng, {
    subhabilidad: T1C,
    dificultad: d,
    enunciado: `Toca los bloques del número ${pide}. ${ayudaBloques}`,
    enunciadoFacil: `Busca el número ${pide}. ${ayudaBloques} Toca esos bloques.`,
    respuesta: { tipo: "imagen", correcta: opcion(correcta), distractores: valores.filter((v) => v !== correcta).map(opcion) },
    pista: "Averigua qué número forma cada grupo de bloques y compara.",
    explicacion: `Los bloques forman ${listaY([...valores].sort((a, b) => a - b))}. El ${pide} es el ${correcta}.`,
    plantilla: clave(T1C, "bloques", pide, ...[...valores].sort((a, b) => a - b)),
  });
};

const numeroEntre: Generador = (rng, d) => {
  const t = entero(rng, 2, 8);
  const a = d === 1 ? t * 10 : t * 10 + entero(rng, 1, 5);
  const b = d === 1 ? a + 10 : d === 2 ? a + entero(rng, 4, 7) : a + 2;
  const correcta = d === 3 ? a + 1 : entero(rng, a + 1, b - 1);
  // Todos los distractores quedan fuera del intervalo.
  const fuera = [a, b, a - 1, b + 1, unidad(correcta) * 10 + decena(correcta)].filter((x) => (x <= a || x >= b) && x > 0);
  return pregunta(rng, {
    subhabilidad: T1C,
    dificultad: d,
    enunciado: `¿Qué número es mayor que ${a} y menor que ${b}?`,
    enunciadoFacil: `Busca un número. Tiene que ser mayor que ${a}. Tiene que ser menor que ${b}.`,
    respuesta: { tipo: "opcion", correcta: String(correcta), distractores: distractoresTexto(rng, String(correcta), fuera.map(String), 3) },
    pista: "Comprueba las dos condiciones con cada número.",
    explicacion: `El ${correcta} va después del ${a} y antes del ${b}.`,
    plantilla: clave(T1C, "entre", a, b, correcta),
  });
};

const MISMA = "Tienen la misma cantidad";

const compararHistoria: Generador = (rng, d) => {
  const t = entero(rng, 1, 8);
  const u = entero(rng, t + 1, 9);
  const directo = t * 10 + u;
  const par: readonly [number, number] = d === 1
    ? [entero(rng, 12, 39), entero(rng, 51, 98)]
    : d === 2
      ? [directo, directo + 10]
      : rng() < 0.2 ? [directo, directo] : [directo, u * 10 + t];
  const [a, b] = rng() < 0.5 ? par : [par[1], par[0]];
  const [x, y] = nombres(rng, 2) as [string, string];
  const c = elegir(rng, [SEMILLA, PIEDRA, HUEVO, FLOR, LAPIZ]);
  const pide = rng() < 0.5 ? "más" : "menos";
  const ganador = a === b ? MISMA : (pide === "más") === (a > b) ? x : y;
  const final = a === b ? "Son el mismo número." : `${ganador} tiene ${pide}.`;
  return pregunta(rng, {
    subhabilidad: T1C,
    dificultad: d,
    enunciado: `${x} tiene ${a} ${c.plural} y ${y} tiene ${b} ${c.plural}. ¿Quién tiene ${pide} ${c.plural}?`,
    enunciadoFacil: `${x} tiene ${a} ${c.plural}. ${y} tiene ${b} ${c.plural}. ¿Quién tiene ${pide}?`,
    respuesta: { tipo: "opcion", correcta: ganador, distractores: [x, y, MISMA].filter((v) => v !== ganador) },
    pista: "Compara primero las decenas de los dos números.",
    explicacion: `Comparamos el ${a} y el ${b}. ${final}`,
    plantilla: clave(T1C, "historia", pide, a, b),
  });
};

// ---------- NUM2-T2: sumas y restas hasta 100 ----------
type Par = readonly [number, number];

function sumaSinLlevar(rng: Rng, d: Dificultad): Par {
  const ua = entero(rng, 1, 8);
  const ub = entero(rng, 1, 9 - ua);
  const ta = entero(rng, 1, 8);
  if (d === 1) return [ta * 10 + ua, ub];
  const tb = entero(rng, 1, 9 - ta);
  if (d === 2) return [ta * 10 + ua, tb * 10];
  return [ta * 10 + ua, tb * 10 + ub];
}

function restaSinLlevar(rng: Rng, d: Dificultad): Par {
  const ua = entero(rng, 2, 9);
  const ub = entero(rng, 1, ua);
  const ta = entero(rng, 2, 9);
  if (d === 1) return [ta * 10 + ua, ub];
  const tb = entero(rng, 1, ta - 1);
  if (d === 2) return [ta * 10 + ua, tb * 10];
  return [ta * 10 + ua, tb * 10 + ub];
}

const T2A = "NUM2-T2-a";

const sumaSin: Generador = (rng, d) => {
  const [a, b] = sumaSinLlevar(rng, d);
  const s = a + b;
  return pregunta(rng, {
    subhabilidad: T2A,
    dificultad: d,
    enunciado: `¿Cuánto es ${a} + ${b}?`,
    enunciadoFacil: `Suma ${a} y ${b}.`,
    respuesta: respuestaNum(rng, d, s, [s + 10, s - 10, s + 1, s - 1, a]),
    pista: "Suma las unidades con las unidades y las decenas con las decenas.",
    explicacion: `Unidades: ${unidad(a)} + ${unidad(b)} = ${unidad(s)}. Decenas: ${decena(a)} + ${decena(b)} = ${decena(s)}. El resultado es ${s}.`,
    plantilla: clave(T2A, "suma", a, b),
  });
};

const restaSin: Generador = (rng, d) => {
  const [a, b] = restaSinLlevar(rng, d);
  const r = a - b;
  return pregunta(rng, {
    subhabilidad: T2A,
    dificultad: d,
    enunciado: `¿Cuánto es ${a} − ${b}?`,
    enunciadoFacil: `Al ${a} quítale ${b}.`,
    respuesta: respuestaNum(rng, d, r, [a + b, r + 10, r - 10, r + 1, r - 1].filter((x) => x > 0)),
    pista: "Resta las unidades con las unidades y las decenas con las decenas.",
    explicacion: `Unidades: ${unidad(a)} − ${unidad(b)} = ${unidad(r)}. Decenas: ${decena(a)} − ${decena(b)} = ${decena(r)}. El resultado es ${r}.`,
    plantilla: clave(T2A, "resta", a, b),
  });
};

const operarConBloques: Generador = (rng, d) => {
  const sumar = rng() < 0.5;
  const [a, b] = sumar ? sumaSinLlevar(rng, d) : restaSinLlevar(rng, d);
  const r = sumar ? a + b : a - b;
  return pregunta(rng, {
    subhabilidad: T2A,
    dificultad: d,
    enunciado: `${ayudaBloques} ${sumar ? "Súmale" : "Réstale"} ${b} a este número. ¿Cuánto da?`,
    enunciadoFacil: `Mira los bloques. ${ayudaBloques} ${sumar ? "Suma" : "Resta"} ${b}. ¿Cuánto da?`,
    imagen: bloques(decena(a), unidad(a)),
    respuesta: respuestaNum(rng, d, r, [sumar ? a - b : a + b, a, r + 10, r - 10, r + 1, r - 1].filter((x) => x > 0)),
    pista: "Averigua qué número forman los bloques. Después haz la cuenta.",
    explicacion: `Los bloques forman el ${a}. ${a} ${sumar ? "+" : "−"} ${b} = ${r}.`,
    plantilla: clave(T2A, "bloques", sumar ? "suma" : "resta", a, b),
  });
};

const huecoSin: Generador = (rng, d) => {
  const [a, b] = sumaSinLlevar(rng, d);
  const s = a + b;
  return pregunta(rng, {
    subhabilidad: T2A,
    dificultad: d,
    enunciado: `¿Qué número falta? ${a} + ___ = ${s}`,
    enunciadoFacil: `Mira: ${a} + ___ = ${s}. ¿Qué número va en el hueco?`,
    respuesta: respuestaNum(rng, d, b, [s, a, b + 10, b + 1, Math.abs(b - 1)].filter((x) => x > 0)),
    pista: "Piensa cuánto le falta al primer número para llegar al resultado.",
    explicacion: `${a} + ${b} = ${s}. Por eso falta el ${b}.`,
    plantilla: clave(T2A, "hueco", a, b),
  });
};

function sumaLlevando(rng: Rng, d: Dificultad): Par {
  const ua = entero(rng, 2, 9);
  const ub = entero(rng, 11 - ua > 9 ? 9 : Math.max(11 - ua, 2), 9);
  const ta = entero(rng, 1, 7);
  if (d === 1) return [ta * 10 + ua, ub];
  const tb = entero(rng, 1, 8 - ta);
  return [ta * 10 + ua, tb * 10 + ub];
}

function restaLlevando(rng: Rng, d: Dificultad): Par {
  const ua = d === 3 ? 0 : entero(rng, 1, 8);
  const ub = entero(rng, ua + 1, 9);
  const ta = entero(rng, 3, 9);
  if (d === 1) return [ta * 10 + ua, ub];
  const tb = entero(rng, 1, ta - 2);
  return [ta * 10 + ua, tb * 10 + ub];
}

// Olvida la decena que se lleva: 47 + 36 = 73.
const sinLlevarse = (a: number, b: number): number => a + b - 10;
// Quita el número pequeño del grande en cada columna: 72 − 38 = 46.
const restaAlReves = (a: number, b: number): number => (decena(a) - decena(b)) * 10 + Math.abs(unidad(a) - unidad(b));
// Pide prestado pero no descuenta la decena: 72 − 38 = 44.
const sinDevolver = (a: number, b: number): number => a - b + 10;

const T2B = "NUM2-T2-b";

const sumaCon: Generador = (rng, d) => {
  const [a, b] = sumaLlevando(rng, d);
  const s = a + b;
  const us = unidad(a) + unidad(b);
  return pregunta(rng, {
    subhabilidad: T2B,
    dificultad: d,
    enunciado: `¿Cuánto es ${a} + ${b}?`,
    enunciadoFacil: `Suma ${a} y ${b}. Recuerda la decena que te llevas.`,
    respuesta: respuestaNum(rng, d, s, [sinLlevarse(a, b), s + 10, s + 1, s - 1]),
    pista: "Si las unidades pasan de 9, te llevas 1 a las decenas.",
    explicacion: `${unidad(a)} + ${unidad(b)} = ${us}: escribes ${unidad(us)} y te llevas 1. Con esa decena, el resultado es ${s}.`,
    plantilla: clave(T2B, "suma", a, b),
  });
};

const restaCon: Generador = (rng, d) => {
  const [a, b] = restaLlevando(rng, d);
  const r = a - b;
  return pregunta(rng, {
    subhabilidad: T2B,
    dificultad: d,
    enunciado: `¿Cuánto es ${a} − ${b}?`,
    enunciadoFacil: `Al ${a} quítale ${b}. Si no llegas, cambia una decena.`,
    respuesta: respuestaNum(rng, d, r, [restaAlReves(a, b), sinDevolver(a, b), r + 1, r - 1].filter((x) => x > 0)),
    pista: "Si no puedes quitar las unidades, cambia una decena por 10 unidades.",
    explicacion: `No puedes quitar ${unidad(b)} de ${unidad(a)}. Cambias una decena: ${10 + unidad(a)} − ${unidad(b)} = ${10 + unidad(a) - unidad(b)}. El resultado es ${r}.`,
    plantilla: clave(T2B, "resta", a, b),
  });
};

const sumaEscrita: Generador = (rng, d) => {
  const [a, b] = sumaLlevando(rng, d);
  const s = a + b;
  return pregunta(rng, {
    subhabilidad: T2B,
    dificultad: d,
    enunciado: `Escribe el resultado: ${a} + ${b}`,
    enunciadoFacil: `Suma ${a} y ${b}. Escribe el resultado.`,
    respuesta: { tipo: "numero", valor: s },
    pista: "Empieza por las unidades. Si pasan de 9, te llevas 1.",
    explicacion: `${a} + ${b} = ${s}. No olvides la decena que te llevas.`,
    plantilla: clave(T2B, "escrita", a, b),
  });
};

const restaEscrita: Generador = (rng, d) => {
  const [a, b] = restaLlevando(rng, d);
  const r = a - b;
  return pregunta(rng, {
    subhabilidad: T2B,
    dificultad: d,
    enunciado: `Escribe el resultado: ${a} − ${b}`,
    enunciadoFacil: `Al ${a} quítale ${b}. Escribe el resultado.`,
    respuesta: { tipo: "numero", valor: r },
    pista: "Empieza por las unidades. Si no llegas, cambia una decena por 10 unidades.",
    explicacion: `${a} − ${b} = ${r}. Puedes comprobarlo: ${r} + ${b} = ${a}.`,
    plantilla: clave(T2B, "escrita-resta", a, b),
  });
};

const huecoCon: Generador = (rng, d) => {
  const [a, b] = sumaLlevando(rng, d);
  const s = a + b;
  return pregunta(rng, {
    subhabilidad: T2B,
    dificultad: d,
    enunciado: `¿Qué número falta? ${a} + ___ = ${s}`,
    enunciadoFacil: `Mira: ${a} + ___ = ${s}. ¿Qué número va en el hueco?`,
    respuesta: respuestaNum(rng, d, b, [b + 10, b - 10, b + 1, b - 1, s].filter((x) => x > 0)),
    pista: `Resta: al ${s} quítale ${a}.`,
    explicacion: `${s} − ${a} = ${b}, y ${a} + ${b} = ${s}.`,
    plantilla: clave(T2B, "hueco", a, b),
  });
};

// Problemas: siempre con cantidades mayores que 1 para que la concordancia sea plural.
interface Relato {
  readonly u: Unidad;
  readonly texto: (a: number, b: number, x: string, y: string) => string;
  readonly facil: (a: number, b: number, x: string, y: string) => string;
}

const JUNTAR: readonly Relato[] = [
  { u: PERSONA, texto: (a, b) => `En el autobús van ${a} personas. En la parada suben ${b} personas. ¿Cuántas personas van ahora en el autobús?`, facil: (a, b) => `Van ${a} personas. Suben ${b} personas. ¿Cuántas van ahora?` },
  { u: SEMILLA, texto: (a, b, x) => `${x} planta ${a} semillas por la mañana y ${b} semillas por la tarde. ¿Cuántas semillas planta en total?`, facil: (a, b, x) => `${x} planta ${a} semillas. Luego planta ${b} semillas. ¿Cuántas son en total?` },
  { u: LIBRO, texto: (a, b) => `La escuela tiene ${a} libros en una estantería y ${b} libros en otra. ¿Cuántos libros tiene en total?`, facil: (a, b) => `Hay ${a} libros en una estantería. Hay ${b} libros en otra. ¿Cuántos son en total?` },
  { u: NARANJA, texto: (a, b, x) => `En el mercado, ${x} vende ${a} naranjas por la mañana y ${b} naranjas por la tarde. ¿Cuántas naranjas vende en total?`, facil: (a, b, x) => `${x} vende ${a} naranjas. Luego vende ${b} naranjas. ¿Cuántas son en total?` },
  { u: HUEVO, texto: (a, b, x, y) => `${x} recoge ${a} huevos y ${y} recoge ${b} huevos. ¿Cuántos huevos recogen en total?`, facil: (a, b, x, y) => `${x} recoge ${a} huevos. ${y} recoge ${b} huevos. ¿Cuántos son en total?` },
  { u: CUBO_AGUA, texto: (a, b) => `Esta semana se sacan ${a} cubos de agua del pozo y la semana pasada se sacaron ${b}. ¿Cuántos cubos de agua son en total?`, facil: (a, b) => `Esta semana sacan ${a} cubos de agua. Antes sacaron ${b} cubos. ¿Cuántos son en total?` },
];

const QUITAR: readonly Relato[] = [
  { u: PERSONA, texto: (a, b) => `En el autobús van ${a} personas. En la parada bajan ${b} personas. ¿Cuántas personas quedan en el autobús?`, facil: (a, b) => `Van ${a} personas. Bajan ${b} personas. ¿Cuántas quedan?` },
  { u: CUADERNO, texto: (a, b) => `En la tienda hay ${a} cuadernos y se venden ${b}. ¿Cuántos cuadernos quedan?`, facil: (a, b) => `Hay ${a} cuadernos. Se venden ${b} cuadernos. ¿Cuántos quedan?` },
  { u: SEMILLA, texto: (a, b, x) => `${x} tiene ${a} semillas y planta ${b}. ¿Cuántas semillas le quedan?`, facil: (a, b, x) => `${x} tiene ${a} semillas. Planta ${b} semillas. ¿Cuántas le quedan?` },
  { u: NARANJA, texto: (a, b, x) => `Un árbol tiene ${a} naranjas y ${x} recoge ${b}. ¿Cuántas naranjas quedan en el árbol?`, facil: (a, b, x) => `Hay ${a} naranjas. ${x} recoge ${b} naranjas. ¿Cuántas quedan?` },
  { u: LAPIZ, texto: (a, b, x) => `En el armario de la escuela hay ${a} lápices y ${x} reparte ${b} en la clase. ¿Cuántos lápices quedan en el armario?`, facil: (a, b, x) => `Hay ${a} lápices. ${x} reparte ${b} lápices. ¿Cuántos quedan?` },
];

const DIFERENCIA: readonly Relato[] = [
  { u: PAGINA, texto: (a, b, x, y) => `${x} ha leído ${a} páginas y ${y} ha leído ${b} páginas. ¿Cuántas páginas más ha leído ${x}?`, facil: (a, b, x, y) => `${x} lee ${a} páginas. ${y} lee ${b} páginas. ¿Cuántas páginas más lee ${x}?` },
  { u: SILLA, texto: (a, b) => `Una sala tiene ${a} sillas y otra sala tiene ${b} sillas. ¿Cuántas sillas más tiene la primera sala?`, facil: (a, b) => `Una sala tiene ${a} sillas. Otra sala tiene ${b} sillas. ¿Cuántas sillas más tiene la primera?` },
  { u: PAGINA, texto: (a, b, x) => `Un libro tiene ${a} páginas y ${x} ya ha leído ${b}. ¿Cuántas páginas le faltan por leer?`, facil: (a, b, x) => `El libro tiene ${a} páginas. ${x} lee ${b} páginas. ¿Cuántas le faltan?` },
  { u: SEMILLA, texto: (a, b, x) => `${x} quiere juntar ${a} semillas y ya tiene ${b}. ¿Cuántas semillas le faltan?`, facil: (a, b, x) => `${x} quiere ${a} semillas. Ya tiene ${b}. ¿Cuántas le faltan?` },
];

const T2C = "NUM2-T2-c";

// Resta con resultado mayor que 1.
function restaProblema(rng: Rng, d: Dificultad): Par {
  if (d === 1) return restaSinLlevar(rng, 3);
  const ua = entero(rng, 1, 8);
  const ub = entero(rng, ua + 1, 9);
  const ta = entero(rng, 4, 9);
  const tb = entero(rng, 1, ta - 2);
  return [ta * 10 + ua, tb * 10 + ub];
}

const problemaSuma: Generador = (rng, d) => {
  const [a, b] = d === 1 ? sumaSinLlevar(rng, 3) : sumaLlevando(rng, 2);
  const s = a + b;
  const h = elegir(rng, JUNTAR);
  const [x, y] = nombres(rng, 2) as [string, string];
  const candidatos = [Math.abs(a - b), sinLlevarse(a, b), s + 10, s + 1, s - 1];
  return pregunta(rng, {
    subhabilidad: T2C,
    dificultad: d,
    enunciado: h.texto(a, b, x, y),
    enunciadoFacil: h.facil(a, b, x, y),
    ...(h.u.id === undefined ? {} : { imagen: { tipo: "objeto" as const, objeto: h.u.id } }),
    respuesta: respuestaNum(rng, d, s, candidatos.filter((v) => v > 0)),
    pista: "¿Las cantidades se juntan o se quitan? Después haz la cuenta.",
    explicacion: `Las cantidades se juntan: ${a} + ${b} = ${s}. Son ${cant(s, h.u)}.`,
    plantilla: clave(T2C, "suma", a, b),
  });
};

const problemaResta: Generador = (rng, d) => {
  const [a, b] = restaProblema(rng, d);
  const r = a - b;
  const h = elegir(rng, QUITAR);
  const [x, y] = nombres(rng, 2) as [string, string];
  return pregunta(rng, {
    subhabilidad: T2C,
    dificultad: d,
    enunciado: h.texto(a, b, x, y),
    enunciadoFacil: h.facil(a, b, x, y),
    ...(h.u.id === undefined ? {} : { imagen: { tipo: "objeto" as const, objeto: h.u.id } }),
    respuesta: respuestaNum(rng, d, r, [a + b, restaAlReves(a, b), r + 10, r + 1, r - 1].filter((v) => v > 0)),
    pista: "Al final hay menos que al principio. Piensa qué cuenta sirve.",
    explicacion: `Se quita una parte: ${a} − ${b} = ${r}. ${quedan(r)} ${cant(r, h.u)}.`,
    plantilla: clave(T2C, "resta", a, b),
  });
};

const problemaDiferencia: Generador = (rng, d) => {
  const [a, b] = restaProblema(rng, d === 1 ? 1 : 2);
  const r = a - b;
  const h = elegir(rng, DIFERENCIA);
  const [x, y] = nombres(rng, 2) as [string, string];
  return pregunta(rng, {
    subhabilidad: T2C,
    dificultad: d,
    enunciado: h.texto(a, b, x, y),
    enunciadoFacil: h.facil(a, b, x, y),
    respuesta: respuestaNum(rng, d, r, [a + b, a, b, r + 1, r - 1].filter((v) => v > 0)),
    pista: "Busca la distancia entre los dos números: del pequeño al grande.",
    explicacion: `Del ${b} al ${a} hay ${r}: ${a} − ${b} = ${r}.`,
    plantilla: clave(T2C, "diferencia", a, b),
  });
};

const problemaDosPasos: Generador = (rng, d) => {
  const [m1, m2] = porR(d, [20, 40], [40, 70], [60, 70]);
  const a = entero(rng, m1, m2);
  const b = entero(rng, ...porR(d, [2, 9], [10, 19], [12, 28]));
  const c = entero(rng, ...porR(d, [2, 9], [10, 19], [13, 29]));
  const r = a - b + c;
  const quitarPrimero = rng() < 0.5;
  const persona = rng() < 0.5;
  const [x] = nombres(rng, 1) as [string];
  const frase = persona
    ? { inicio: `En el autobús van ${a} personas.`, resto: quitarPrimero ? `Bajan ${b} y suben ${c}.` : `Suben ${c} y bajan ${b}.`, pregunta: "¿Cuántas personas van ahora?" }
    : { inicio: `${x} tiene ${a} semillas.`, resto: quitarPrimero ? `Planta ${b} y recoge ${c}.` : `Recoge ${c} y planta ${b}.`, pregunta: "¿Cuántas semillas tiene ahora?" };
  return pregunta(rng, {
    subhabilidad: T2C,
    dificultad: d,
    enunciado: `${frase.inicio} ${frase.resto} ${frase.pregunta}`,
    enunciadoFacil: `${frase.inicio} ${frase.resto} ${frase.pregunta}`,
    respuesta: respuestaNum(rng, d, r, [a + b + c, a - b - c, a - b, a + c, r + 10].filter((v) => v > 0)),
    pista: "Hazlo en dos pasos, en el orden de la historia.",
    explicacion: quitarPrimero ? `${a} − ${b} = ${a - b}, y ${a - b} + ${c} = ${r}.` : `${a} + ${c} = ${a + c}, y ${a + c} − ${b} = ${r}.`,
    plantilla: clave(T2C, "dospasos", a, b, c),
  });
};

// ---------- NUM2-T3: dinero ----------
const T3A = "NUM2-T3-a";
const sumaEscribible = (v: readonly number[]): string => v.join(" + ");

function falsosTotales(valores: readonly number[]): number[] {
  const total = suma(valores);
  const ultima = valores[valores.length - 1] ?? 0;
  return [valores.length, total - ultima, total + ultima, total + 1, total - 1, total + 10].filter((x) => x > 0 && x !== total);
}

const PISTA_VALOR = "Suma lo que vale cada moneda. No cuentes solo cuántas monedas hay.";

const contarDinero: Generador = (rng, d) => {
  const valores = monedasDeDificultad(rng, d);
  const total = suma(valores);
  return pregunta(rng, {
    subhabilidad: T3A,
    dificultad: d,
    enunciado: "Cada moneda lleva escrito lo que vale. ¿Cuánto dinero hay en total?",
    enunciadoFacil: "Mira las monedas. Suma lo que vale cada una. ¿Cuánto dinero hay?",
    imagen: imagenMonedas(valores),
    respuesta: respuestaNum(rng, d, total, falsosTotales(valores)),
    pista: PISTA_VALOR,
    explicacion: `${sumaEscribible(valores)} = ${total}. Las ${valores.length} monedas valen ${total} en total.`,
    plantilla: clave(T3A, "contar", ...ordenarMonedas(valores)),
  });
};

const contarDineroEscrito: Generador = (rng, d) => {
  const valores = monedasDeDificultad(rng, d);
  const total = suma(valores);
  return pregunta(rng, {
    subhabilidad: T3A,
    dificultad: d,
    enunciado: "Suma el valor de estas monedas y escribe el total.",
    enunciadoFacil: "Mira las monedas. Suma lo que vale cada una. Escribe el total.",
    imagen: imagenMonedas(valores),
    respuesta: { tipo: "numero", valor: total },
    pista: "Empieza por las monedas que valen más y ve sumando las demás.",
    explicacion: `${sumaEscribible(ordenarMonedas(valores))} = ${total}.`,
    plantilla: clave(T3A, "escrito", ...ordenarMonedas(valores)),
  });
};

const opcionMonedas = (valores: readonly number[]): OpcionImagen => ({ texto: etiquetaMonedas(valores), imagen: imagenMonedas(ordenarMonedas(valores)) });

const tocarTotal: Generador = (rng, d) => {
  const valores = monedasDeDificultad(rng, d);
  const total = suma(valores);
  return pregunta(rng, {
    subhabilidad: T3A,
    dificultad: d,
    enunciado: `Toca el grupo de monedas que vale ${total} en total.`,
    enunciadoFacil: `Busca las monedas que suman ${total}. Tócalas.`,
    respuesta: { tipo: "imagen", correcta: opcionMonedas(valores), distractores: variantesMonedas(rng, valores, [total], 2).map(opcionMonedas) },
    pista: "Suma lo que vale cada grupo de monedas.",
    explicacion: `${sumaEscribible(ordenarMonedas(valores))} = ${total}.`,
    plantilla: clave(T3A, "tocar", ...ordenarMonedas(valores)),
  });
};

const grupoQueValeMas: Generador = (rng, d) => {
  const ganador = ordenarMonedas(monedasDeDificultad(rng, d));
  const total = suma(ganador);
  // Trampa: muchas monedas pequeñas que valen menos que unas pocas grandes.
  const cuantasTrampa = ganador.length + 1;
  const trampa = Array.from({ length: cuantasTrampa }, () => (2 * cuantasTrampa >= total ? 1 : 2));
  const menos = ganador.slice(0, -1);
  return pregunta(rng, {
    subhabilidad: T3A,
    dificultad: d,
    enunciado: "¿Qué grupo de monedas vale más? Tócalo.",
    enunciadoFacil: "Suma cada grupo de monedas. Toca el que vale más.",
    respuesta: { tipo: "imagen", correcta: opcionMonedas(ganador), distractores: [opcionMonedas(trampa), opcionMonedas(menos)] },
    pista: "Tener más monedas no siempre es tener más dinero. Suma cada grupo.",
    explicacion: `Ese grupo vale ${total}. Los otros valen ${suma(trampa)} y ${suma(menos)}.`,
    plantilla: clave(T3A, "vale-mas", ...ganador),
  });
};

const ARTICULOS: readonly Unidad[] = [LAPIZ, CUADERNO, LIBRO, PELOTA, MOCHILA, PARAGUAS, GORRO, TAZA, BOTELLA];
const unArticulo = (u: Unidad): string => `${un(u)} ${u.singular}`;
const elArticulo = (u: Unidad): string => `${el(u)} ${u.singular}`;
const dibujoArticulo = (u: Unidad): Imagen => ({ tipo: "objeto", objeto: dibujo(u) });

function monedasDePago(rng: Rng, d: Dificultad): number[] {
  if (d === 1) return muestra(rng, [10, 5, 2, 1], 2);
  if (d === 2) return muestra(rng, [20, 10, 5, 2, 1], 3);
  return muestra(rng, [50, 20, 10, 5, 2, 1], entero(rng, 4, 5));
}

const T3B = "NUM2-T3-b";

const tocarPago: Generador = (rng, d) => {
  const valores = monedasDePago(rng, d);
  const precio = suma(valores);
  const u = elegir(rng, ARTICULOS);
  return pregunta(rng, {
    subhabilidad: T3B,
    dificultad: d,
    enunciado: `${mayus(unArticulo(u))} cuesta ${valorDinero(precio)}. Toca las monedas que suman justo ese precio.`,
    enunciadoFacil: `${mayus(elArticulo(u))} cuesta ${valorDinero(precio)}. ¿Con qué monedas pagas justo?`,
    imagen: dibujoArticulo(u),
    respuesta: { tipo: "imagen", correcta: opcionMonedas(valores), distractores: variantesMonedas(rng, valores, [precio], porD(d, 2, 2, 3)).map(opcionMonedas) },
    pista: "Suma cada grupo de monedas y compáralo con el precio.",
    explicacion: `${sumaEscribible(ordenarMonedas(valores))} = ${precio}. Con esas monedas pagas justo.`,
    plantilla: clave(T3B, "tocar", ...ordenarMonedas(valores)),
  });
};

const pagarConIguales: Generador = (rng, d) => {
  const v = elegir(rng, porD(d, [10, 5] as readonly number[], [5, 2, 10], [5, 2, 20]));
  const n = entero(rng, ...porR(d, [2, 4], [4, 7], v === 20 ? [3, 4] : [7, 10]));
  const precio = v * n;
  const u = elegir(rng, ARTICULOS);
  return pregunta(rng, {
    subhabilidad: T3B,
    dificultad: d,
    enunciado: `${mayus(unArticulo(u))} cuesta ${valorDinero(precio)}. Solo tienes monedas de ${v}. ¿Cuántas monedas de ${v} necesitas para pagar justo?`,
    enunciadoFacil: `${mayus(elArticulo(u))} cuesta ${valorDinero(precio)}. Solo tienes monedas de ${v}. ¿Cuántas necesitas?`,
    imagen: imagenMonedas([v]),
    respuesta: respuestaNum(rng, d, n, [precio, v, n + 1, n - 1].filter((x) => x > 0)),
    pista: `Cuenta de ${v} en ${v} hasta llegar al precio.`,
    explicacion: `Contando de ${v} en ${v}: ${Array.from({ length: n }, (_, i) => v * (i + 1)).join(", ")}. Son ${n} monedas de ${v}.`,
    plantilla: clave(T3B, "iguales", v, n),
  });
};

const unaMonedaDe = (v: number): string => `Una moneda de ${v}`;

const monedaQueFalta: Generador = (rng, d) => {
  const valores = monedasDePago(rng, d);
  const v = en(valores, valores.length - 1);
  const puestas = valores.slice(0, -1);
  const precio = suma(valores);
  const otras = [50, 20, 10, 5, 2, 1].filter((x) => x !== v).map(unaMonedaDe);
  const yaPuesto = suma(puestas);
  return pregunta(rng, {
    subhabilidad: T3B,
    dificultad: d,
    enunciado: `El precio es ${valorDinero(precio)}. Mira lo que ya has puesto. ¿Qué moneda falta para pagar justo?`,
    enunciadoFacil: `El precio es ${valorDinero(precio)}. Mira lo que ya has puesto. ¿Qué moneda falta?`,
    imagen: imagenMonedas(puestas),
    respuesta: { tipo: "opcion", correcta: unaMonedaDe(v), distractores: distractoresTexto(rng, unaMonedaDe(v), otras, 3) },
    pista: "Suma lo que ya has puesto y piensa cuánto queda para llegar al precio.",
    explicacion: `Ya has puesto ${yaPuesto}. Del ${yaPuesto} al ${precio} ${v === 1 ? "falta" : "faltan"} ${v}, así que falta una moneda de ${v}.`,
    plantilla: clave(T3B, "falta", precio, v),
  });
};

const SOBRA = "Te sobra dinero";
const FALTA = "Te falta dinero";
const JUSTO = "Tienes lo justo";

const meAlcanza: Generador = (rng, d) => {
  const valores = monedasDeDificultad(rng, d);
  const total = suma(valores);
  const hueco = entero(rng, ...porR(d, [5, 9], [2, 4], [1, 1]));
  const caso = elegir(rng, ["sobra", "falta", "justo"] as const);
  const precio = caso === "justo" ? total : caso === "sobra" ? Math.max(1, total - hueco) : total + hueco;
  const correcta = caso === "justo" ? JUSTO : caso === "sobra" ? SOBRA : FALTA;
  const u = elegir(rng, ARTICULOS);
  const final = caso === "justo" ? "Es la misma cantidad." : caso === "sobra" ? `${total - precio === 1 ? "Te sobra" : "Te sobran"} ${total - precio}.` : `${precio - total === 1 ? "Te falta" : "Te faltan"} ${precio - total}.`;
  return pregunta(rng, {
    subhabilidad: T3B,
    dificultad: d,
    enunciado: `Tienes estas monedas. ${mayus(unArticulo(u))} cuesta ${valorDinero(precio)}. ¿Qué pasa al pagar?`,
    enunciadoFacil: `Mira tus monedas. ${mayus(elArticulo(u))} cuesta ${valorDinero(precio)}. ¿Qué pasa al pagar?`,
    imagen: imagenMonedas(valores),
    respuesta: { tipo: "opcion", correcta, distractores: [SOBRA, FALTA, JUSTO].filter((t) => t !== correcta) },
    pista: "Suma tus monedas y compara el total con el precio.",
    explicacion: `Tus monedas valen ${total} y el precio es ${precio}. ${final}`,
    plantilla: clave(T3B, "alcanza", caso, ...ordenarMonedas(valores)),
  });
};

const T3C = "NUM2-T3-c";

interface Compra {
  readonly pago: readonly number[];
  readonly precio: number;
}

function compraDe(rng: Rng, d: Dificultad): Compra {
  if (d === 1) return { pago: [10], precio: entero(rng, 2, 8) };
  if (d === 2) {
    if (rng() < 0.5) return { pago: [20], precio: entero(rng, 3, 17) };
    return { pago: [50], precio: elegir(rng, [10, 15, 20, 25, 30, 35, 40, 45]) };
  }
  if (rng() < 0.5) return { pago: [20, 20], precio: entero(rng, 12, 37) };
  return { pago: [50], precio: 20 + elegir(rng, [1, 3, 4, 6, 7, 8, 9, 11, 13, 14, 16, 17, 18, 19, 21, 23, 24, 26, 27]) };
}

const pagoTexto = (pago: readonly number[]): string => (pago.length === 1 ? `una moneda de ${en(pago, 0)}` : `dos monedas de ${en(pago, 0)}`);

// Errores típicos: sumar en vez de restar, dar el precio, o restar mal las unidades.
function falsosCambios(pago: number, precio: number): number[] {
  const cambio = pago - precio;
  const unidadesSinRestar = (decena(pago) - decena(precio)) * 10 + unidad(precio);
  return [precio, unidadesSinRestar, pago + precio, cambio + 1, cambio - 1, cambio + 10].filter((x) => x > 0 && x !== cambio);
}

function respuestaCambio(rng: Rng, d: Dificultad, pago: number, precio: number): RespuestaBorrador {
  const cambio = pago - precio;
  return respuestaNum(rng, d, cambio, falsosCambios(pago, precio));
}

const devuelven = (c: number): string => `te devuelven ${valorDinero(c)}`;

const cambioDirecto: Generador = (rng, d) => {
  const { pago, precio } = compraDe(rng, d);
  const pagado = suma(pago);
  const u = elegir(rng, ARTICULOS);
  const cambio = pagado - precio;
  return pregunta(rng, {
    subhabilidad: T3C,
    dificultad: d,
    enunciado: `Compras ${unArticulo(u)} que cuesta ${valorDinero(precio)}. Pagas con ${pagoTexto(pago)}. ¿Cuánto dinero te devuelven?`,
    enunciadoFacil: `${mayus(elArticulo(u))} cuesta ${valorDinero(precio)}. Pagas con ${pagoTexto(pago)}. ¿Cuánto te devuelven?`,
    imagen: imagenMonedas(pago),
    respuesta: respuestaCambio(rng, d, pagado, precio),
    pista: "Piensa cuánto falta desde el precio hasta lo que has pagado.",
    explicacion: `Has pagado ${pagado} y cuesta ${precio}: ${pagado} − ${precio} = ${cambio}. Por eso ${devuelven(cambio)}.`,
    plantilla: clave(T3C, "directo", pagado, precio),
  });
};

const tocarCambio: Generador = (rng, d) => {
  const { pago, precio } = compraDe(rng, d);
  const pagado = suma(pago);
  const cambio = pagado - precio;
  const valores = descomponer(cambio);
  const u = elegir(rng, ARTICULOS);
  return pregunta(rng, {
    subhabilidad: T3C,
    dificultad: d,
    enunciado: `${mayus(unArticulo(u))} cuesta ${valorDinero(precio)} y pagas con ${pagoTexto(pago)}. Toca las monedas que te devuelven.`,
    enunciadoFacil: `${mayus(elArticulo(u))} cuesta ${valorDinero(precio)}. Pagas con ${pagoTexto(pago)}. ¿Qué monedas te devuelven?`,
    imagen: imagenMonedas(pago),
    respuesta: { tipo: "imagen", correcta: opcionMonedas(valores), distractores: variantesMonedas(rng, valores, [cambio], 2).map(opcionMonedas) },
    pista: "Calcula primero el cambio. Después suma cada grupo de monedas.",
    explicacion: `${pagado} − ${precio} = ${cambio}, y esas monedas suman ${cambio}.`,
    plantilla: clave(T3C, "tocar", pagado, precio),
  });
};

const precioPerdido: Generador = (rng, d) => {
  const compra = compraDe(rng, d);
  const pagado = suma(compra.pago);
  const precio = Math.min(compra.precio, pagado - 2);
  const cambio = pagado - precio;
  const u = elegir(rng, ARTICULOS);
  return pregunta(rng, {
    subhabilidad: T3C,
    dificultad: d,
    enunciado: `Compras ${unArticulo(u)} y pagas con ${pagoTexto(compra.pago)}. Te devuelven ${valorDinero(cambio)}. ¿Cuánto cuesta ${elArticulo(u)}?`,
    enunciadoFacil: `Pagas con ${pagoTexto(compra.pago)}. Te devuelven ${valorDinero(cambio)}. ¿Cuánto cuesta ${elArticulo(u)}?`,
    imagen: imagenMonedas(compra.pago),
    respuesta: respuestaNum(rng, d, precio, [pagado + cambio, cambio, precio + 1, precio - 1, precio + 10].filter((x) => x > 0)),
    pista: "Lo que pagas se divide en dos partes: el precio y lo que te devuelven.",
    explicacion: `${pagado} − ${cambio} = ${precio}. Cuesta ${valorDinero(precio)}.`,
    plantilla: clave(T3C, "precio", pagado, cambio),
  });
};

const cartelDePrecios: Generador = (rng, d) => {
  const lista = muestra(rng, ARTICULOS, 3);
  const [p1, p2, p3] = porD(d, separados(rng, 3, 2, 9, 1), separados(rng, 3, 3, 18, 2), separados(rng, 3, 6, 22, 3)) as [number, number, number];
  const [a, b, c] = lista as [Unidad, Unidad, Unidad];
  const precios = barajar(rng, [p1, p2, p3]);
  const [qa, qb, qc] = precios as [number, number, number];
  const pago = porD(d, 10, elegir(rng, [20, 50]), 50);
  const coste = d === 3 ? qa + qb : qa;
  const compra = d === 3 ? `${elArticulo(a)} y ${elArticulo(b)}` : elArticulo(a);
  const cambio = pago - coste;
  return pregunta(rng, {
    subhabilidad: T3C,
    dificultad: d,
    enunciado: `Mira los precios. Compras ${compra} y pagas con una moneda de ${pago}. ¿Cuánto dinero te devuelven?`,
    enunciadoFacil: `Busca el precio. Compras ${compra}. Pagas con una moneda de ${pago}. ¿Cuánto te devuelven?`,
    imagen: {
      tipo: "cartel",
      estilo: "etiqueta",
      titulo: "Precios",
      lineas: [`${mayus(a.singular)}: ${valorDinero(qa)}`, `${mayus(b.singular)}: ${valorDinero(qb)}`, `${mayus(c.singular)}: ${valorDinero(qc)}`],
    },
    respuesta: respuestaCambio(rng, d, pago, coste),
    pista: d === 3 ? "Suma primero lo que cuestan las dos cosas." : "Busca el precio en el cartel y piensa cuánto falta hasta lo que pagas.",
    explicacion: d === 3
      ? `${qa} + ${qb} = ${coste}, y ${pago} − ${coste} = ${cambio}. Por eso ${devuelven(cambio)}.`
      : `${pago} − ${coste} = ${cambio}. Por eso ${devuelven(cambio)}.`,
    plantilla: clave(T3C, "cartel", pago, coste),
  });
};

// ---------- NUM2-T4: hora y calendario ----------
const T4A = "NUM2-T4-a";
const H = (h: number, m: 0 | 30): string => mayus(hora(h, m));

interface HoraFalsa {
  readonly h: number;
  readonly m: 0 | 30;
}

// Horas que se confunden con la pedida. En y media, la aguja corta está entre dos números.
function horasFalsas(h: number, m: 0 | 30): HoraFalsa[] {
  const sig = horaCiclo(h + 1);
  const ant = horaCiclo(h - 1);
  return m === 0
    ? [{ h: sig, m: 0 }, { h: ant, m: 0 }, { h, m: 30 }]
    : [{ h, m: 0 }, { h: sig, m: 30 }, { h: sig, m: 0 }];
}

const horaPara = (rng: Rng, d: Dificultad): HoraFalsa => {
  if (d === 1) return { h: entero(rng, 1, 12), m: 0 };
  if (d === 2) return { h: entero(rng, 1, 12), m: 30 };
  return { h: elegir(rng, [12, 1, 11, 2, 10]), m: elegir(rng, [0, 30] as const) };
};

const esHora = (h: number, m: 0 | 30): string => `${h === 1 ? "es" : "son"} ${hora(h, m)}`;

const explicarHora = (h: number, m: 0 | 30): string =>
  m === 0
    ? `La aguja larga está en el 12 y la corta en el ${h}: ${esHora(h, 0)}.`
    : `La aguja larga está en el 6 y la corta ha pasado del ${h}: ${esHora(h, 30)}.`;

const leerReloj: Generador = (rng, d) => {
  const { h, m } = horaPara(rng, d);
  return pregunta(rng, {
    subhabilidad: T4A,
    dificultad: d,
    enunciado: "¿Qué hora marca el reloj?",
    enunciadoFacil: "Mira las agujas del reloj. ¿Qué hora es?",
    imagen: reloj(h, m),
    respuesta: { tipo: "opcion", correcta: H(h, m), distractores: horasFalsas(h, m).map((f) => H(f.h, f.m)) },
    pista: "Mira primero la aguja larga: en el 12 es en punto y en el 6 es y media.",
    explicacion: explicarHora(h, m),
    plantilla: clave(T4A, "leer", h, m),
  });
};

const tocarReloj: Generador = (rng, d) => {
  const { h, m } = horaPara(rng, d);
  const opcion = (hh: number, mm: 0 | 30): OpcionImagen => ({ texto: `Reloj con ${hora(hh, mm)}`, imagen: reloj(hh, mm) });
  return pregunta(rng, {
    subhabilidad: T4A,
    dificultad: d,
    enunciado: `Toca el reloj que marca ${hora(h, m)}.`,
    enunciadoFacil: `Busca el reloj con ${hora(h, m)}. Tócalo.`,
    respuesta: { tipo: "imagen", correcta: opcion(h, m), distractores: horasFalsas(h, m).map((f) => opcion(f.h, f.m)) },
    pista: "Mira dónde está la aguja larga en cada reloj. Después mira la corta.",
    explicacion: explicarHora(h, m),
    plantilla: clave(T4A, "tocar", h, m),
  });
};

const horaEscrita: Generador = (rng, d) => {
  const { h, m } = horaPara(rng, d);
  const digital = horaDigital(h, m);
  return pregunta(rng, {
    subhabilidad: T4A,
    dificultad: d,
    enunciado: `¿Cómo se dice esta hora: ${digital}?`,
    enunciadoFacil: `Lee la hora: ${digital}. ¿Cómo se dice?`,
    respuesta: { tipo: "opcion", correcta: H(h, m), distractores: horasFalsas(h, m).map((f) => H(f.h, f.m)) },
    pista: "Los números de la derecha son los minutos: 00 es en punto y 30 es y media.",
    explicacion: `En ${digital}, el ${h} es la hora y ${m === 0 ? "00 quiere decir en punto" : "30 quiere decir y media"}. Por eso ${esHora(h, m)}.`,
    plantilla: clave(T4A, "escrita", h, m),
  });
};

const agujas: Generador = (rng, d) => {
  const { h, m } = horaPara(rng, d);
  const sig = horaCiclo(h + 1);
  const descripcion = m === 0
    ? `La aguja larga señala el 12 y la aguja corta señala el ${h}.`
    : `La aguja larga señala el 6 y la aguja corta está entre el ${h} y el ${sig}.`;
  return pregunta(rng, {
    subhabilidad: T4A,
    dificultad: d,
    enunciado: `${descripcion} ¿Qué hora es?`,
    enunciadoFacil: `${descripcion} ¿Qué hora es?`,
    respuesta: { tipo: "opcion", correcta: H(h, m), distractores: horasFalsas(h, m).map((f) => H(f.h, f.m)) },
    pista: "La aguja larga dice si es en punto o y media. La corta dice la hora.",
    explicacion: explicarHora(h, m),
    plantilla: clave(T4A, "agujas", h, m),
  });
};

const T4B = "NUM2-T4-b";
const M = (i: number): string => mayus(mes(i));

const mesVecino: Generador = (rng, d) => {
  const i = d === 3 ? elegir(rng, [9, 10, 11, 0, 1]) : entero(rng, 1, 10);
  const salto = porD(d, 1, -1, 2);
  const frase = porD(d, `justo después de ${mes(i)}`, `justo antes de ${mes(i)}`, `dos meses después de ${mes(i)}`);
  const correcto = i + salto;
  return pregunta(rng, {
    subhabilidad: T4B,
    dificultad: d,
    enunciado: `¿Qué mes va ${frase}?`,
    enunciadoFacil: `Di los meses en orden. ¿Qué mes va ${frase}?`,
    respuesta: { tipo: "opcion", correcta: M(correcto), distractores: distractoresTexto(rng, M(correcto), [M(i), M(i + 1), M(i - 1), M(i + 2), M(i + 3)], 3) },
    pista: "Di los meses del año en orden, en voz alta. Después de diciembre vuelve enero.",
    explicacion: d === 3 ? `Después de ${mes(i)} va ${mes(i + 1)}, y después ${mes(correcto)}.` : d === 1 ? `Después de ${mes(i)} va ${mes(correcto)}.` : `Antes de ${mes(i)} va ${mes(correcto)}.`,
    plantilla: clave(T4B, "vecino", i),
  });
};

const numeroDeMes: Generador = (rng, d) => {
  const i = entero(rng, ...porR(d, [0, 3], [4, 7], [8, 11]));
  const n = i + 1;
  const otros = [M(i - 1), M(i + 1), M(i + 2), M(i - 2)];
  const directa = rng() < 0.5;
  return pregunta(rng, {
    subhabilidad: T4B,
    dificultad: d,
    enunciado: directa ? `Si empiezas a contar en enero, ¿qué mes es el número ${n}?` : `Si empiezas a contar en enero, ¿qué número de mes es ${mes(i)}?`,
    enunciadoFacil: directa ? `Enero es el mes 1. ¿Qué mes es el número ${n}?` : `Enero es el mes 1. ¿Qué número es ${mes(i)}?`,
    respuesta: directa
      ? { tipo: "opcion", correcta: M(i), distractores: distractoresTexto(rng, M(i), otros, 3) }
      : respuestaNum(rng, d, n, [n + 1, n - 1, n + 2].filter((x) => x > 0 && x <= 12)),
    pista: "Cuenta con los dedos mientras dices los meses desde enero.",
    explicacion: `Contando desde enero, ${mes(i)} es el mes número ${n}.`,
    plantilla: clave(T4B, "numero", directa ? "mes" : "numero", i),
  });
};

interface Dato {
  readonly clave: string;
  readonly enunciado: string;
  readonly facil: string;
  readonly valor: number;
  readonly explicacion: string;
  readonly falsos: readonly number[];
}

const DIAS_MES = [31, 0, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

const DATOS: Readonly<Record<Dificultad, readonly Dato[]>> = {
  1: [
    { clave: "semana", enunciado: "¿Cuántos días tiene una semana?", facil: "Cuenta los días de una semana.", valor: 7, explicacion: "La semana tiene 7 días.", falsos: [5, 12, 30] },
    { clave: "anio", enunciado: "¿Cuántos meses tiene un año?", facil: "Cuenta los meses de un año.", valor: 12, explicacion: "El año tiene 12 meses, de enero a diciembre.", falsos: [7, 10, 30] },
  ],
  2: [
    { clave: "2sem", enunciado: "¿Cuántos días hay en 2 semanas?", facil: "Una semana tiene 7 días. ¿Cuántos días hay en 2 semanas?", valor: 14, explicacion: "7 + 7 = 14 días.", falsos: [7, 9, 12] },
    { clave: "3sem", enunciado: "¿Cuántos días hay en 3 semanas?", facil: "Una semana tiene 7 días. ¿Cuántos días hay en 3 semanas?", valor: 21, explicacion: "7 + 7 + 7 = 21 días.", falsos: [14, 10, 28] },
    { clave: "medio", enunciado: "¿Cuántos meses hay en medio año?", facil: "Un año tiene 12 meses. ¿Cuántos meses hay en medio año?", valor: 6, explicacion: "La mitad de 12 es 6.", falsos: [4, 12, 8] },
  ],
  3: [
    ...[0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i): Dato => ({
      clave: `dias-${i}`,
      enunciado: `¿Cuántos días tiene el mes de ${mes(i)}?`,
      facil: `Piensa en ${mes(i)}. ¿Cuántos días tiene?`,
      valor: en(DIAS_MES, i),
      explicacion: `El mes de ${mes(i)} tiene ${en(DIAS_MES, i)} días.`,
      falsos: en(DIAS_MES, i) === 31 ? [30, 28, 7] : [31, 28, 7],
    })),
    { clave: "4sem", enunciado: "¿Cuántos días hay en 4 semanas?", facil: "Una semana tiene 7 días. ¿Cuántos días hay en 4 semanas?", valor: 28, explicacion: "7 + 7 + 7 + 7 = 28 días.", falsos: [21, 11, 30] },
    { clave: "2anios", enunciado: "¿Cuántos meses hay en 2 años?", facil: "Un año tiene 12 meses. ¿Cuántos meses hay en 2 años?", valor: 24, explicacion: "12 + 12 = 24 meses.", falsos: [12, 14, 22] },
  ],
};

const datosDelCalendario: Generador = (rng, d) => {
  const dato = elegir(rng, DATOS[d]);
  return pregunta(rng, {
    subhabilidad: T4B,
    dificultad: d,
    enunciado: dato.enunciado,
    enunciadoFacil: dato.facil,
    respuesta: opcionNumerica(rng, dato.valor, dato.falsos),
    pista: "Piensa en cómo es un calendario.",
    explicacion: dato.explicacion,
    plantilla: clave(T4B, "dato", dato.clave),
  });
};

const ABREVIADOS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"] as const;
const DIA_PLURAL = (i: number): string => (i === 5 ? "sábados" : i === 6 ? "domingos" : dia(i));

function calendario(i: number, inicio: number): Imagen {
  const dias = en(DIAS_MES, i);
  const filas: string[][] = [];
  let fila: string[] = Array.from({ length: inicio }, () => "");
  for (let n = 1; n <= dias; n += 1) {
    fila.push(String(n));
    if (fila.length === 7) {
      filas.push(fila);
      fila = [];
    }
  }
  if (fila.length > 0) filas.push([...fila, ...Array.from({ length: 7 - fila.length }, () => "")]);
  return { tipo: "tabla", titulo: `Calendario de ${mes(i)}`, cabeceras: ABREVIADOS, filas };
}

const leerCalendario: Generador = (rng, d) => {
  const i = elegir(rng, [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const inicio = entero(rng, 0, 6);
  const imagen = calendario(i, inicio);
  const dias = en(DIAS_MES, i);
  if (d === 3) {
    const contarDias = rng() < 0.5;
    if (contarDias) {
      const s = entero(rng, 0, 6);
      const veces = Array.from({ length: dias }, (_, n) => (n + inicio) % 7).filter((x) => x === s).length;
      return pregunta(rng, {
        subhabilidad: T4B,
        dificultad: d,
        enunciado: `Mira el calendario. ¿Cuántos ${DIA_PLURAL(s)} tiene este mes?`,
        enunciadoFacil: `Mira la columna de ${DIA_PLURAL(s)}. Cuenta los números.`,
        imagen,
        respuesta: { tipo: "numero", valor: veces },
        pista: "Busca la columna de ese día y cuenta solo las casillas con número.",
        explicacion: `En la columna de ${DIA_PLURAL(s)} hay ${veces} números.`,
        plantilla: clave(T4B, "cal-cuantos", i, inicio, s),
      });
    }
    const n = entero(rng, 1, dias - 7);
    return pregunta(rng, {
      subhabilidad: T4B,
      dificultad: d,
      enunciado: `Mira el calendario. Hoy es día ${n}. ¿Qué día del mes será dentro de una semana?`,
      enunciadoFacil: `Hoy es día ${n}. Pasa una semana. ¿Qué día del mes será?`,
      imagen,
      respuesta: { tipo: "numero", valor: n + 7 },
      pista: "En el calendario, baja una fila en la misma columna.",
      explicacion: `Una semana son 7 días: ${n} + 7 = ${n + 7}.`,
      plantilla: clave(T4B, "cal-semana", i, n),
    });
  }
  const n = d === 1 ? entero(rng, 1, 7 - inicio) : entero(rng, 8, dias);
  const s = (n - 1 + inicio) % 7;
  const correcta = mayus(dia(s));
  return pregunta(rng, {
    subhabilidad: T4B,
    dificultad: d,
    enunciado: `Mira el calendario. ¿Qué día de la semana es el día ${n}?`,
    enunciadoFacil: `Busca el número ${n}. Mira arriba. ¿Qué día es?`,
    imagen,
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, [s - 1, s + 1, s + 2, s - 2].map((x) => mayus(dia(x))), 3) },
    pista: "Busca el número y sube por su columna hasta el nombre del día.",
    explicacion: `El día ${n} está en la columna de ${dia(s)}.`,
    plantilla: clave(T4B, "cal-dia", i, inicio, n),
  });
};

const T4C = "NUM2-T4-c";

interface Salto {
  readonly texto: string;
  readonly medias: number;
  readonly futuro: boolean;
}

const SALTOS: Readonly<Record<Dificultad, readonly Salto[]>> = {
  1: [{ texto: "dentro de una hora", medias: 2, futuro: true }],
  2: [{ texto: "hace una hora", medias: -2, futuro: false }, { texto: "dentro de media hora", medias: 1, futuro: true }],
  3: [{ texto: "hace media hora", medias: -1, futuro: false }, { texto: "dentro de una hora y media", medias: 3, futuro: true }, { texto: "dentro de dos horas", medias: 4, futuro: true }, { texto: "hace dos horas", medias: -4, futuro: false }],
};

function moverHora(h: number, m: 0 | 30, medias: number): HoraFalsa {
  const total = h * 2 + (m === 30 ? 1 : 0) + medias;
  return { h: horaCiclo(Math.floor(total / 2)), m: ((total % 2) + 2) % 2 === 0 ? 0 : 30 };
}

const horaAntesDespues: Generador = (rng, d) => {
  const h = entero(rng, 1, 12);
  const m = d === 1 ? 0 : elegir(rng, [0, 30] as const);
  const salto = elegir(rng, SALTOS[d]);
  const destino = moverHora(h, m, salto.medias);
  const contraria = moverHora(h, m, -salto.medias);
  const correcta = H(destino.h, destino.m);
  const falsos = [H(contraria.h, contraria.m), H(h, m), ...[1, -1, 2, -2, 3].map((x) => moverHora(destino.h, destino.m, x)).map((f) => H(f.h, f.m))];
  const verbo = salto.futuro ? "¿Qué hora será" : "¿Qué hora era";
  const son = h === 1 ? "Es" : "Son";
  return pregunta(rng, {
    subhabilidad: T4C,
    dificultad: d,
    enunciado: `${son} ${hora(h, m)}. ${verbo} ${salto.texto}?`,
    enunciadoFacil: `Mira el reloj: ${hora(h, m)}. ${verbo} ${salto.texto}?`,
    imagen: reloj(h, m),
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, falsos.slice(0, 5), 3) },
    pista: salto.futuro ? "Mueve las agujas hacia delante en tu cabeza." : "Mueve las agujas hacia atrás en tu cabeza.",
    explicacion: `Si ${son === "Es" ? "es" : "son"} ${hora(h, m)}, ${salto.texto} ${salto.futuro ? "serán" : "eran"} ${hora(destino.h, destino.m)}.`.replace("serán la 1", "será la 1").replace("eran la 1", "era la 1"),
    plantilla: clave(T4C, "hora", h, m, salto.medias),
  });
};

const diaAntesDespues: Generador = (rng, d) => {
  const i = entero(rng, 0, 6);
  const caso = porD(
    d,
    elegir(rng, [{ t: "mañana", s: 1 }, { t: "ayer", s: -1 }]),
    elegir(rng, [{ t: "dentro de 2 días", s: 2 }, { t: "hace 2 días", s: -2 }]),
    elegir(rng, [{ t: "dentro de 3 días", s: 3 }, { t: "hace 3 días", s: -3 }, { t: "dentro de 4 días", s: 4 }, { t: "dentro de 7 días", s: 7 }, { t: "hace 7 días", s: -7 }]),
  );
  const correcta = mayus(dia(i + caso.s));
  const verbo = caso.s > 0 ? "será" : "fue";
  return pregunta(rng, {
    subhabilidad: T4C,
    dificultad: d,
    enunciado: `Hoy es ${dia(i)}. ¿Qué día ${verbo} ${caso.t}?`,
    enunciadoFacil: `Hoy es ${dia(i)}. ¿Qué día ${verbo} ${caso.t}?`,
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, [i - caso.s, i, i + caso.s + 1, i + caso.s - 1, i + caso.s + 2].map((x) => mayus(dia(x))), 3) },
    pista: caso.s > 0 ? "Di los días en orden hacia delante desde hoy." : "Di los días hacia atrás desde hoy.",
    explicacion: Math.abs(caso.s) === 7
      ? `Cada 7 días se repite el mismo día. Por eso ${caso.t} ${verbo} ${dia(i)}.`
      : `Si hoy es ${dia(i)}, ${caso.t} ${verbo} ${dia(i + caso.s)}.`,
    plantilla: clave(T4C, "dia", i, caso.s),
  });
};

const mesAntesDespues: Generador = (rng, d) => {
  const i = entero(rng, 0, 11);
  const salto = porD(d, 1, elegir(rng, [2, -1]), elegir(rng, [3, 4, -2, -3]));
  const frase = salto > 0 ? `dentro de ${salto === 1 ? "1 mes" : `${salto} meses`}` : `hace ${salto === -1 ? "1 mes" : `${-salto} meses`}`;
  const verbo = salto > 0 ? "¿En qué mes estaremos" : "¿En qué mes estábamos";
  const correcta = M(i + salto);
  return pregunta(rng, {
    subhabilidad: T4C,
    dificultad: d,
    enunciado: `Estamos en ${mes(i)}. ${verbo} ${frase}?`,
    enunciadoFacil: `Ahora es ${mes(i)}. ${verbo} ${frase}?`,
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, [M(i - salto), M(i), M(i + salto + 1), M(i + salto - 1)], 3) },
    pista: "Di los meses en orden. Después de diciembre vuelve enero.",
    explicacion: `Si estamos en ${mes(i)}, ${frase} ${salto > 0 ? "estaremos" : "estábamos"} en ${mes(i + salto)}.`,
    plantilla: clave(T4C, "mes", i, salto),
  });
};

const A_LA_VEZ = "Llegan a la vez";

const quienLlegaAntes: Generador = (rng, d) => {
  const [x, y] = nombres(rng, 2) as [string, string];
  const h1 = entero(rng, 7, 9);
  const h2 = h1 + (d === 1 ? entero(rng, 1, 2) : d === 2 ? 1 : elegir(rng, [0, 1]));
  const m1: 0 | 30 = d === 1 ? 0 : 30;
  const m2: 0 | 30 = d === 1 ? 0 : d === 2 ? 0 : h2 === h1 ? 30 : 0;
  // En dificultad 2 hay media hora de diferencia; en la 3 también pueden coincidir.
  const orden = rng() < 0.5;
  const [ha, ma, hb, mb] = orden ? [h1, m1, h2, m2] : [h2, m2, h1, m1];
  const valor = (h: number, m: number): number => h * 60 + m;
  const pide = rng() < 0.5 ? "antes" : "después";
  const ganador = valor(ha, ma) === valor(hb, mb) ? A_LA_VEZ : (pide === "antes") === (valor(ha, ma) < valor(hb, mb)) ? x : y;
  const final = ganador === A_LA_VEZ ? "Es la misma hora." : `${ganador} llega ${pide}.`;
  return pregunta(rng, {
    subhabilidad: T4C,
    dificultad: d,
    enunciado: `Por la mañana, ${x} llega a la escuela a ${hora(ha, ma)} y ${y} llega a ${hora(hb, mb)}. ¿Quién llega ${pide}?`,
    enunciadoFacil: `Por la mañana, ${x} llega a ${hora(ha, ma)}. ${y} llega a ${hora(hb, mb)}. ¿Quién llega ${pide}?`,
    respuesta: { tipo: "opcion", correcta: ganador, distractores: [x, y, A_LA_VEZ].filter((t) => t !== ganador) },
    pista: "Piensa qué hora llega primero en el reloj.",
    explicacion: `Comparamos ${hora(ha, ma)} y ${hora(hb, mb)}. ${final}`,
    plantilla: clave(T4C, "llega", pide, ha, ma, hb, mb),
  });
};

// ---------- NUM2-T5: multiplicar como suma repetida ----------
const T5A = "NUM2-T5-a";
const OBJETOS_GRUPOS: readonly Unidad[] = [MANZANA, NARANJA, LAPIZ, FLOR, HUEVO, PELOTA, LIBRO, PAJARO];

function gruposIguales(rng: Rng, d: Dificultad): [number, number] {
  const g = entero(rng, ...porR(d, [2, 3], [3, 4], [4, 5]));
  const k = entero(rng, ...porR(d, [2, 3], [3, 5], [4, 6]));
  return [g, k];
}

const dibujoGrupos = (u: Unidad, tamanos: readonly number[]): Imagen => grupos(...tamanos.map((cantidad) => ({ objeto: dibujo(u), cantidad })));
const iguales = (g: number, k: number): number[] => Array.from({ length: g }, () => k);
const sumaRepetida = (g: number, k: number): string => iguales(g, k).join(" + ");

const totalDeGrupos: Generador = (rng, d) => {
  const [g, k] = gruposIguales(rng, d);
  const t = g * k;
  const u = elegir(rng, OBJETOS_GRUPOS);
  return pregunta(rng, {
    subhabilidad: T5A,
    dificultad: d,
    enunciado: `Hay ${g} grupos de ${k} ${u.plural}. ¿${cuantos(u)} ${u.plural} hay en total?`,
    enunciadoFacil: `Mira los grupos. Hay ${g} grupos. Cada grupo tiene ${k}. ¿${cuantos(u)} hay en total?`,
    imagen: dibujoGrupos(u, iguales(g, k)),
    respuesta: respuestaNum(rng, d, t, [g + k, t + k, t - k, t + 1, t - 1]),
    pista: "Suma lo que hay en cada grupo, grupo por grupo.",
    explicacion: `${sumaRepetida(g, k)} = ${t}. Hay ${cant(t, u)} en total.`,
    plantilla: clave(T5A, "total", g, k),
  });
};

const sumaDeLaImagen: Generador = (rng, d) => {
  const [g, k] = gruposIguales(rng, d);
  const u = elegir(rng, OBJETOS_GRUPOS);
  const correcta = sumaRepetida(g, k);
  return pregunta(rng, {
    subhabilidad: T5A,
    dificultad: d,
    enunciado: "¿Qué suma corresponde a estos grupos?",
    enunciadoFacil: "Mira los grupos. ¿Qué suma es?",
    imagen: dibujoGrupos(u, iguales(g, k)),
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, [`${g} + ${k}`, sumaRepetida(g + 1, k), sumaRepetida(g - 1, k), sumaRepetida(g, k + 1), sumaRepetida(k, g)], 3) },
    pista: "Cuenta cuántos grupos hay y cuántos dibujos tiene cada uno.",
    explicacion: `Hay ${g} grupos de ${k}, así que sumamos ${g} veces el ${k}: ${correcta}.`,
    plantilla: clave(T5A, "suma", g, k),
  });
};

const multiplicacionDeLaImagen: Generador = (rng, d) => {
  const [g, k] = gruposIguales(rng, d);
  const u = elegir(rng, OBJETOS_GRUPOS);
  const correcta = `${g} × ${k}`;
  // k × g también sería válido: nunca se ofrece como distractor.
  const falsos = [`${g} + ${k}`, `${g + 1} × ${k}`, `${g} × ${k + 1}`, `${g - 1} × ${k}`].filter((t) => t !== `${k} × ${g}` && !(g === 2 && k === 2 && t === "2 + 2"));
  return pregunta(rng, {
    subhabilidad: T5A,
    dificultad: d,
    enunciado: "¿Qué multiplicación corresponde a estos grupos?",
    enunciadoFacil: "Mira los grupos. ¿Qué multiplicación es?",
    imagen: dibujoGrupos(u, iguales(g, k)),
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, falsos, 3) },
    pista: "Cuenta los grupos y lo que hay dentro de cada uno.",
    explicacion: `Hay ${g} grupos de ${k}: ${correcta} = ${g * k}.`,
    plantilla: clave(T5A, "multi", g, k),
  });
};

const tocarGrupos: Generador = (rng, d) => {
  const [g0, k0] = gruposIguales(rng, d);
  const g = g0;
  const k = g0 === k0 ? k0 + 1 : k0;
  const u = elegir(rng, OBJETOS_GRUPOS);
  const opcion = (gg: number, kk: number): OpcionImagen => ({ texto: `${gg} grupos de ${kk} ${u.plural}`, imagen: dibujoGrupos(u, iguales(gg, kk)) });
  return pregunta(rng, {
    subhabilidad: T5A,
    dificultad: d,
    enunciado: `Toca la imagen con ${g} grupos de ${k} ${u.plural}.`,
    enunciadoFacil: `Busca ${g} grupos. Cada grupo tiene ${k} ${u.plural}. Toca esa imagen.`,
    respuesta: { tipo: "imagen", correcta: opcion(g, k), distractores: [opcion(k, g), opcion(g, k + 1)] },
    pista: "Cuenta primero los grupos. Después mira cuántos hay en cada grupo.",
    explicacion: `Esa imagen tiene ${g} grupos y en cada uno hay ${cant(k, u)}.`,
    plantilla: clave(T5A, "tocar", g, k),
  });
};

const gruposDistintos: Generador = (rng, d) => {
  const g = 3;
  const k = entero(rng, ...porR(d, [3, 4], [4, 5], [5, 6]));
  const u = elegir(rng, OBJETOS_GRUPOS);
  const salto = porD(d, 2, 1, 1);
  const a = [k, k - salto, k + salto];
  const b = [k + salto, k, k];
  const opcion = (t: readonly number[]): OpcionImagen => ({ texto: `Grupos de ${listaY(t)}`, imagen: dibujoGrupos(u, t) });
  return pregunta(rng, {
    subhabilidad: T5A,
    dificultad: d,
    enunciado: "Toca la imagen en la que todos los grupos son iguales.",
    enunciadoFacil: "Cuenta cada grupo. Toca la imagen con grupos iguales.",
    respuesta: { tipo: "imagen", correcta: opcion(iguales(g, k)), distractores: [opcion(barajar(rng, a)), opcion(barajar(rng, b))] },
    pista: "Cuenta los dibujos de cada grupo y compara.",
    explicacion: `En esa imagen, los ${g} grupos tienen ${cant(k, u)} cada uno.`,
    plantilla: clave(T5A, "iguales", k, salto),
  });
};

const T5B = "NUM2-T5-b";

function factores(rng: Rng, d: Dificultad): [number, number] {
  if (d === 1) return [elegir(rng, [2, 10]), entero(rng, 1, 5)];
  if (d === 2) return [elegir(rng, [2, 5]), entero(rng, 3, 7)];
  return [elegir(rng, [2, 5, 10]), entero(rng, 6, 10)];
}

const erroresTabla = (t: number, n: number): number[] => {
  const p = t * n;
  return [t + n, p + t, p - t, p + 1, p - 1].filter((x) => x > 0);
};

const tablaOpcion: Generador = (rng, d) => {
  const [t, n] = factores(rng, d);
  const p = t * n;
  return pregunta(rng, {
    subhabilidad: T5B,
    dificultad: d,
    enunciado: `¿Cuánto es ${t} × ${n}?`,
    enunciadoFacil: `Multiplica ${t} por ${n}.`,
    respuesta: opcionNumerica(rng, p, erroresTabla(t, n)),
    pista: `Cuenta de ${t} en ${t}, ${n === 1 ? "una vez" : `${n} veces`}.`,
    explicacion: `Contando de ${t} en ${t}, ${n === 1 ? "la primera vez" : `${n} veces`}, llegas al ${p}. ${t} × ${n} = ${p}.`,
    plantilla: clave(T5B, "tabla", t, n),
  });
};

const tablaEscrita: Generador = (rng, d) => {
  const [t, n] = factores(rng, d);
  const p = t * n;
  return pregunta(rng, {
    subhabilidad: T5B,
    dificultad: d,
    enunciado: `Escribe el resultado: ${n} × ${t}`,
    enunciadoFacil: `Multiplica ${n} por ${t}. Escribe el resultado.`,
    respuesta: { tipo: "numero", valor: p },
    pista: `Da igual el orden: puedes contar de ${t} en ${t}.`,
    explicacion: `${n} × ${t} = ${t} × ${n} = ${p}.`,
    plantilla: clave(T5B, "escrita", t, n),
  });
};

const tablaHueco: Generador = (rng, d) => {
  const [t, n] = factores(rng, d);
  const p = t * n;
  return pregunta(rng, {
    subhabilidad: T5B,
    dificultad: d,
    enunciado: `¿Qué número falta? ${t} × ___ = ${p}`,
    enunciadoFacil: `Mira: ${t} × ___ = ${p}. ¿Qué número va en el hueco?`,
    respuesta: respuestaNum(rng, d, n, [p - t, p, n + 1, n - 1].filter((x) => x > 0)),
    pista: `Cuenta de ${t} en ${t} hasta llegar al ${p}. Cuenta los saltos.`,
    explicacion: `${t} × ${n} = ${p}. Por eso falta el ${n}.`,
    plantilla: clave(T5B, "hueco", t, n),
  });
};

const contarDeEnEn: Generador = (rng, d) => {
  const t = elegir(rng, [2, 5, 10]);
  const inicio = entero(rng, ...porR(d, [1, 3], [2, 4], [3, 6]));
  const sube = [0, 1, 2, 3].map((i) => t * (inicio + i));
  const fila = d === 3 ? [...sube].reverse() : sube;
  const posicion = d === 1 ? 3 : entero(rng, 1, 2);
  const falta = en(fila, posicion);
  return pregunta(rng, {
    subhabilidad: T5B,
    dificultad: d,
    enunciado: d === 3 ? `Esta fila cuenta hacia atrás de ${t} en ${t}. ¿Qué número falta?` : `Esta fila cuenta de ${t} en ${t}. ¿Qué número falta?`,
    enunciadoFacil: d === 3 ? `Cuenta hacia atrás de ${t} en ${t}. ¿Qué número falta?` : `Cuenta de ${t} en ${t}. ¿Qué número falta?`,
    imagen: serieDeTextos(fila.map((x, i) => (i === posicion ? null : x))),
    respuesta: respuestaNum(rng, d, falta, [falta + t, falta - t, falta + 1, falta - 1].filter((x) => x > 0)),
    pista: `De un número al siguiente siempre hay ${t} de diferencia.`,
    explicacion: `La fila completa es ${fila.join(", ")}. Falta el ${falta}.`,
    plantilla: clave(T5B, "fila", t, inicio, posicion),
  });
};

const sumaComoProducto: Generador = (rng, d) => {
  const t = elegir(rng, [2, 5, 10]);
  const n = entero(rng, ...porR(d, [2, 3], [4, 5], [6, 7]));
  const p = t * n;
  const sumaTexto = iguales(n, t).join(" + ");
  return pregunta(rng, {
    subhabilidad: T5B,
    dificultad: d,
    enunciado: `¿Qué número falta? ${sumaTexto} = ${t} × ___`,
    enunciadoFacil: `Mira: ${sumaTexto} = ${t} × ___. ¿Qué número va en el hueco?`,
    respuesta: respuestaNum(rng, d, n, [p, t, n + 1, n - 1].filter((x) => x > 0)),
    pista: "Cuenta cuántas veces se repite el mismo número en la suma.",
    explicacion: `El ${t} se suma ${n} veces, así que ${sumaTexto} = ${t} × ${n}.`,
    plantilla: clave(T5B, "suma", t, n),
  });
};

const T5C = "NUM2-T5-c";

interface RelatoGrupos {
  readonly u: Unidad;
  readonly fijo?: number;
  readonly texto: (g: number, k: number) => string;
  readonly facil: (g: number, k: number) => string;
}

const HISTORIAS_GRUPOS: readonly RelatoGrupos[] = [
  { u: LAPIZ, texto: (g, k) => `Hay ${g} cajas y en cada caja hay ${k} lápices.`, facil: (g, k) => `Hay ${g} cajas. Cada caja tiene ${k} lápices.` },
  { u: SILLA, texto: (g, k) => `En la escuela hay ${g} filas y en cada fila hay ${k} sillas.`, facil: (g, k) => `Hay ${g} filas. Cada fila tiene ${k} sillas.` },
  { u: NARANJA, texto: (g, k) => `En el mercado hay ${g} bolsas con ${k} naranjas en cada bolsa.`, facil: (g, k) => `Hay ${g} bolsas. Cada bolsa tiene ${k} naranjas.` },
  { u: FLOR, texto: (g, k) => `En el huerto hay ${g} filas con ${k} flores en cada fila.`, facil: (g, k) => `Hay ${g} filas. Cada fila tiene ${k} flores.` },
  { u: PAJARO, texto: (g, k) => `En un árbol hay ${g} ramas y en cada rama hay ${k} pájaros.`, facil: (g, k) => `Hay ${g} ramas. Cada rama tiene ${k} pájaros.` },
  { u: HUEVO, texto: (g, k) => `En la tienda hay ${g} cajas con ${k} huevos en cada caja.`, facil: (g, k) => `Hay ${g} cajas. Cada caja tiene ${k} huevos.` },
  { u: { singular: "rueda", plural: "ruedas", genero: "f" }, fijo: 2, texto: (g, k) => `Hay ${g} bicicletas y cada bicicleta tiene ${k} ruedas.`, facil: (g, k) => `Hay ${g} bicicletas. Cada una tiene ${k} ruedas.` },
];

function datosProblema(rng: Rng, d: Dificultad, h: RelatoGrupos): [number, number] {
  const g = entero(rng, ...porR(d, [2, 4], [3, 6], [6, 10]));
  const k = h.fijo ?? elegir(rng, d === 1 ? [2, 3, 5] : [2, 5, 10]);
  return [g, k];
}

const textoSuma = (g: number, k: number): string => (g <= 6 ? `${sumaRepetida(g, k)} = ${g * k}` : `${g} × ${k} = ${g * k}`);

const problemaDeGrupos: Generador = (rng, d) => {
  const h = elegir(rng, HISTORIAS_GRUPOS);
  const [g, k] = datosProblema(rng, d, h);
  const t = g * k;
  const r = d === 3 && t < 90 && rng() < 0.5 ? entero(rng, 2, 9) : 0;
  const total = t + r;
  const pregunto = `¿${cuantos(h.u)} ${h.u.plural} hay en total?`;
  const extra = r === 0 ? "" : ` Además, hay ${r} ${h.u.plural} más.`;
  const id = h.u.id;
  const imagen = d === 1 && id !== undefined ? dibujoGrupos(h.u, iguales(g, k)) : undefined;
  return pregunta(rng, {
    subhabilidad: T5C,
    dificultad: d,
    enunciado: `${h.texto(g, k)}${extra} ${pregunto}`,
    enunciadoFacil: `${h.facil(g, k)}${extra} ${pregunto}`,
    ...(imagen === undefined ? {} : { imagen }),
    respuesta: respuestaNum(rng, d, total, [g + k, t + k, t - k, t, total + 1, total - 1].filter((x) => x > 0)),
    pista: r === 0 ? "Son grupos iguales: puedes sumar el mismo número varias veces." : "Primero calcula los grupos iguales. Después añade los que hay de más.",
    explicacion: r === 0 ? `${textoSuma(g, k)}. Hay ${cant(t, h.u)} en total.` : `${textoSuma(g, k)}, y ${t} + ${r} = ${total}. Hay ${cant(total, h.u)} en total.`,
    plantilla: clave(T5C, "total", g, k, r),
  });
};

const elegirOperacion: Generador = (rng, d) => {
  const h = elegir(rng, HISTORIAS_GRUPOS);
  const [g0, k0] = datosProblema(rng, d, h);
  // Con 2 grupos de 2, también 2 + 2 daría el total: se evita ese caso.
  const g = g0 === 2 && k0 === 2 ? 3 : g0;
  const k = g === k0 && h.fijo === undefined ? (k0 === 10 ? 5 : 10) : k0;
  const correcta = `${g} × ${k}`;
  const prohibida = `${k} × ${g}`;
  const falsos = [`${g} + ${k}`, `${Math.max(g, k)} − ${Math.min(g, k)}`, `${g + 1} × ${k}`, `${g} × ${k + 1}`].filter((t) => t !== prohibida);
  return pregunta(rng, {
    subhabilidad: T5C,
    dificultad: d,
    enunciado: `${h.texto(g, k)} ¿Qué operación sirve para saber ${cuantos(h.u).toLowerCase()} ${h.u.plural} hay en total?`,
    enunciadoFacil: `${h.facil(g, k)} ¿Qué operación da el total?`,
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, falsos, 3) },
    pista: "Son grupos iguales. Piensa qué operación repite el mismo número.",
    explicacion: `Hay ${g} grupos iguales de ${k}. Se calcula con ${correcta} = ${g * k}.`,
    plantilla: clave(T5C, "operacion", g, k),
  });
};

export const CURSO2: MapaGeneradores = {
  "NUM2-T1-a": [leerBloques, lugarDeLaCifra, componerTexto, tocarBloques],
  "NUM2-T1-b": [letrasACifras, cifrasALetras, bloquesALetras, dictado],
  "NUM2-T1-c": [cualEsMayor, signoEnHueco, tocarBloquesMayor, numeroEntre, compararHistoria],
  "NUM2-T2-a": [sumaSin, restaSin, operarConBloques, huecoSin],
  "NUM2-T2-b": [sumaCon, restaCon, sumaEscrita, restaEscrita, huecoCon],
  "NUM2-T2-c": [problemaSuma, problemaResta, problemaDiferencia, problemaDosPasos],
  "NUM2-T3-a": [contarDinero, contarDineroEscrito, tocarTotal, grupoQueValeMas],
  "NUM2-T3-b": [tocarPago, pagarConIguales, monedaQueFalta, meAlcanza],
  "NUM2-T3-c": [cambioDirecto, tocarCambio, precioPerdido, cartelDePrecios],
  "NUM2-T4-a": [leerReloj, tocarReloj, horaEscrita, agujas],
  "NUM2-T4-b": [mesVecino, numeroDeMes, datosDelCalendario, leerCalendario],
  "NUM2-T4-c": [horaAntesDespues, diaAntesDespues, mesAntesDespues, quienLlegaAntes],
  "NUM2-T5-a": [totalDeGrupos, sumaDeLaImagen, multiplicacionDeLaImagen, tocarGrupos, gruposDistintos],
  "NUM2-T5-b": [tablaOpcion, tablaEscrita, tablaHueco, contarDeEnEn, sumaComoProducto],
  "NUM2-T5-c": [problemaDeGrupos, elegirOperacion],
};
