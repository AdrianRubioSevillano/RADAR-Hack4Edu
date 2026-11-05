// NUM de 1.º de primaria: contar, comparar, sumar y restar hasta 20, formas y medidas.
import type { Rng } from "../../../core/rng.ts";
import { barajar, contable, elegir, entero, muestra, nombres, pregunta } from "../../ayuda.ts";
import type { Dificultad, Generador, Imagen, MapaGeneradores, ObjetoId } from "../../tipos.ts";
import { COLORES } from "../../tipos.ts";
import {
  BOTELLA, CUADERNO, CUBO_AGUA, FLOR, GATO, HUEVO, LAPIZ, LIBRO, MANZANA, MOCHILA, NARANJA, PAJARO, PATO, PELOTA, PERA, PERRO, PERSONA, PEZ, RANA, VASO,
  cant, chocan, clave, cuantos, dia, dibujo, distractoresTexto, el, en, enLetras, grupoDe, grupos, infoForma, listaY, los, mayus, opcionNumerica, porD, porR,
  quedan, respuestaNum, separados, serieDeTextos, suma, type Unidad,
} from "./comun.ts";

interface OpcionImagen {
  readonly texto: string;
  readonly imagen: Imagen;
}

function opcionGrupo(u: Unidad, n: number): OpcionImagen {
  return { texto: cant(n, u), imagen: grupoDe(u, n) };
}

// Distractores de cantidad cercanos, siempre positivos y distintos de la correcta.
function cercanos(correcta: number, candidatos: readonly number[], n: number): number[] {
  return [...new Set(candidatos)].filter((v) => v > 0 && v !== correcta).slice(0, n);
}

// ---------- NUM1-T1: contar hasta 20 ----------
const T1A = "NUM1-T1-a";

const contarTodo: Generador = (rng, d) => {
  const [min, max] = porR(d, [2, 6], [7, 12], [13, 20]);
  const n = entero(rng, min, max);
  const c = contable(rng);
  return pregunta(rng, {
    subhabilidad: T1A,
    dificultad: d,
    enunciado: `¿${cuantos(c)} ${c.plural} hay en la imagen?`,
    enunciadoFacil: `Mira la imagen. Cuenta ${los(c)} ${c.plural}.`,
    imagen: grupoDe(c, n),
    respuesta: respuestaNum(rng, d, n, [n + 1, n - 1, n + 2]),
    pista: "Señala cada dibujo una sola vez mientras cuentas.",
    explicacion: `Si cuentas uno a uno, llegas al ${n}. Hay ${cant(n, c)}.`,
    plantilla: clave(T1A, "todo", n),
  });
};

const contarUnTipo: Generador = (rng, d) => {
  const [minA, maxA] = porR(d, [2, 5], [4, 9], [8, 14]);
  const [minB, maxB] = porR(d, [1, 4], [3, 7], [5, 6]);
  const a = entero(rng, minA, maxA);
  const b = entero(rng, minB, maxB);
  const [c, otro] = muestra(rng, [MANZANA, PERA, NARANJA, LAPIZ, LIBRO, PELOTA, FLOR, PEZ, PAJARO, VASO], 2) as [Unidad, Unidad];
  const lista = barajar(rng, [{ objeto: dibujo(c), cantidad: a }, { objeto: dibujo(otro), cantidad: b }]);
  return pregunta(rng, {
    subhabilidad: T1A,
    dificultad: d,
    enunciado: `En la imagen hay ${c.plural} y ${otro.plural}. ¿${cuantos(c)} ${c.plural} hay?`,
    enunciadoFacil: `Mira la imagen. Cuenta solo ${los(c)} ${c.plural}.`,
    imagen: grupos(...lista),
    respuesta: respuestaNum(rng, d, a, [a + b, b, a + 1, a - 1]),
    pista: `Cuenta solo ${los(c)} ${c.plural}. No cuentes lo demás.`,
    explicacion: a === 1 ? `Hay 1 ${c.singular}.` : `Hay ${cant(a, c)}. Lo demás no se cuenta.`,
    plantilla: clave(T1A, "tipo", a, b),
  });
};

const tocarGrupo: Generador = (rng, d) => {
  const [min, max] = porR(d, [2, 5], [6, 10], [11, 19]);
  const n = entero(rng, min, max);
  const c = contable(rng);
  const otros = cercanos(n, barajar(rng, [n + 1, n - 1, n + 2, n - 2].filter((x) => x <= 20)), 2);
  return pregunta(rng, {
    subhabilidad: T1A,
    dificultad: d,
    enunciado: `Toca el grupo que tiene ${cant(n, c)}.`,
    enunciadoFacil: `Busca ${cant(n, c)}. Toca ese grupo.`,
    respuesta: { tipo: "imagen", correcta: opcionGrupo(c, n), distractores: otros.map((x) => opcionGrupo(c, x)) },
    pista: "Cuenta los dibujos de cada grupo, uno a uno.",
    explicacion: `En ese grupo, al contar uno a uno, llegas al ${n}.`,
    plantilla: clave(T1A, "tocar", n),
  });
};

const T1B = "NUM1-T1-b";
const rangoLetras = (d: Dificultad): readonly [number, number] => porR(d, [1, 9], [10, 15], [16, 20]);
const confusionesHasta20 = (n: number): number[] => [n + 10, n - 10, n + 1, n - 1, n + 2, n - 2].filter((x) => x >= 1 && x <= 20);

const letraACifra: Generador = (rng, d) => {
  const [min, max] = rangoLetras(d);
  const n = entero(rng, min, max);
  const palabra = enLetras(n);
  return pregunta(rng, {
    subhabilidad: T1B,
    dificultad: d,
    enunciado: `¿Qué número es «${palabra}»?`,
    enunciadoFacil: `Lee: ${palabra}. ¿Qué número es?`,
    respuesta: opcionNumerica(rng, n, confusionesHasta20(n)),
    pista: "Lee la palabra en voz alta y piensa en ese número.",
    explicacion: `«${mayus(palabra)}» se escribe con cifras así: ${n}.`,
    plantilla: clave(T1B, "leer", n),
  });
};

const cifraALetra: Generador = (rng, d) => {
  const [min, max] = rangoLetras(d);
  const n = entero(rng, min, max);
  const palabra = enLetras(n);
  // Dieciséis y sesenta, diecisiete y setenta: suenan parecido.
  const parecidos = n > 15 && n < 20 ? [(n % 10) * 10, n % 10] : [];
  const candidatos = [...parecidos, ...barajar(rng, confusionesHasta20(n))].map(enLetras);
  return pregunta(rng, {
    subhabilidad: T1B,
    dificultad: d,
    enunciado: `¿Cómo se escribe el número ${n} con letras?`,
    enunciadoFacil: `Mira el número ${n}. ¿Cómo se escribe con letras?`,
    respuesta: { tipo: "opcion", correcta: palabra, distractores: [...new Set(candidatos)].filter((p) => p !== palabra).slice(0, 3) },
    pista: "Di el número en voz alta. Lee despacio cada palabra.",
    explicacion: `El ${n} se lee y se escribe «${palabra}».`,
    plantilla: clave(T1B, "escribir-letras", n),
  });
};

const escribirCifra: Generador = (rng, d) => {
  const [min, max] = rangoLetras(d);
  const n = entero(rng, min, max);
  const palabra = enLetras(n);
  return pregunta(rng, {
    subhabilidad: T1B,
    dificultad: d,
    enunciado: `Escribe con cifras: ${palabra}.`,
    enunciadoFacil: `Lee: ${palabra}. Escribe el número.`,
    respuesta: { tipo: "numero", valor: n },
    pista: "Di la palabra en voz alta y piensa cómo se escribe ese número.",
    explicacion: `«${mayus(palabra)}» se escribe ${n}.`,
    plantilla: clave(T1B, "dictado", n),
  });
};

const grupoPorPalabra: Generador = (rng, d) => {
  const [min, max] = rangoLetras(d);
  const n = entero(rng, Math.max(2, min), Math.min(19, max));
  const c = contable(rng);
  const otros = cercanos(n, barajar(rng, [n + 1, n - 1, n + 2, n - 2].filter((x) => x <= 20)), 2);
  return pregunta(rng, {
    subhabilidad: T1B,
    dificultad: d,
    enunciado: `Toca el grupo que tiene ${enLetras(n)} ${c.plural}.`,
    enunciadoFacil: `Lee: ${enLetras(n)} ${c.plural}. Toca ese grupo.`,
    respuesta: { tipo: "imagen", correcta: opcionGrupo(c, n), distractores: otros.map((x) => opcionGrupo(c, x)) },
    pista: "Lee el número y después cuenta cada grupo.",
    explicacion: `«${mayus(enLetras(n))}» es el ${n}, y ese grupo tiene ${cant(n, c)}.`,
    plantilla: clave(T1B, "grupo", n),
  });
};

const T1C = "NUM1-T1-c";

const justoDespues: Generador = (rng, d) => {
  const [min, max] = porR(d, [1, 8], [9, 14], [15, 19]);
  const n = entero(rng, min, max);
  return pregunta(rng, {
    subhabilidad: T1C,
    dificultad: d,
    enunciado: `¿Qué número va justo después del ${n}?`,
    enunciadoFacil: `Cuenta desde el ${n}. ¿Qué número sigue?`,
    respuesta: respuestaNum(rng, d, n + 1, [n - 1, n, n + 2]),
    pista: "Cuenta en voz alta hacia delante.",
    explicacion: `Al contar decimos ${n}, ${n + 1}. Después del ${n} va el ${n + 1}.`,
    plantilla: clave(T1C, "despues", n),
  });
};

const justoAntes: Generador = (rng, d) => {
  const [min, max] = porR(d, [2, 9], [10, 15], [16, 20]);
  const n = entero(rng, min, max);
  return pregunta(rng, {
    subhabilidad: T1C,
    dificultad: d,
    enunciado: `¿Qué número va justo antes del ${n}?`,
    enunciadoFacil: `Cuenta hacia atrás desde el ${n}. ¿Qué número sale?`,
    respuesta: respuestaNum(rng, d, n - 1, [n + 1, n, n - 2].filter((x) => x >= 1)),
    pista: "Cuenta hacia atrás, o empieza a contar desde un número más pequeño.",
    explicacion: `Al contar decimos ${n - 1}, ${n}. Antes del ${n} va el ${n - 1}.`,
    plantilla: clave(T1C, "antes", n),
  });
};

const entreDos: Generador = (rng, d) => {
  const [min, max] = porR(d, [1, 8], [9, 13], [14, 18]);
  const a = entero(rng, min, max);
  return pregunta(rng, {
    subhabilidad: T1C,
    dificultad: d,
    enunciado: `¿Qué número va entre el ${a} y el ${a + 2}?`,
    enunciadoFacil: `Mira el ${a} y el ${a + 2}. ¿Qué número va en medio?`,
    respuesta: respuestaNum(rng, d, a + 1, [a, a + 2, a + 3]),
    pista: "Cuenta desde el primer número hasta el segundo.",
    explicacion: `Al contar decimos ${a}, ${a + 1}, ${a + 2}. En medio está el ${a + 1}.`,
    plantilla: clave(T1C, "entre", a),
  });
};

const filaConHueco: Generador = (rng, d) => {
  const inicio = entero(rng, ...porR(d, [1, 6], [5, 12], [5, 16]));
  const asc = [0, 1, 2, 3].map((i) => inicio + i);
  const fila = d === 3 ? [...asc].reverse() : asc;
  const posicion = d === 1 ? 3 : entero(rng, 1, 2);
  const falta = en(fila, posicion);
  return pregunta(rng, {
    subhabilidad: T1C,
    dificultad: d,
    enunciado: d === 3 ? "Esta fila cuenta hacia atrás. ¿Qué número falta?" : "Mira la fila de números. ¿Qué número falta?",
    enunciadoFacil: d === 3 ? "Los números van hacia atrás. ¿Qué número falta?" : "Mira los números. ¿Cuál falta?",
    imagen: serieDeTextos(fila.map((x, i) => (i === posicion ? null : x))),
    respuesta: respuestaNum(rng, d, falta, [falta + 1, falta - 1, falta + 2].filter((x) => x >= 1)),
    pista: "Lee la fila en voz alta y di el número que toca en el hueco.",
    explicacion: `La fila completa es ${fila.join(", ")}. Falta el ${falta}.`,
    plantilla: clave(T1C, "fila", inicio, posicion),
  });
};

// ---------- NUM1-T2: comparar ----------
const T2A = "NUM1-T2-a";
const MISMA = "Tienen la misma cantidad";

function parCercano(rng: Rng, d: Dificultad): [number, number] {
  const a = entero(rng, ...porR(d, [6, 10], [5, 15], [11, 20]));
  const b = d === 1 ? entero(rng, 1, a - 4) : d === 2 ? a - entero(rng, 2, 3) : rng() < 0.3 ? a : a - 1;
  return rng() < 0.5 ? [a, b] : [b, a];
}

const quienTieneMas: Generador = (rng, d) => {
  const [a, b] = parCercano(rng, d);
  const [x, y] = nombres(rng, 2) as [string, string];
  const c = contable(rng);
  const pide = rng() < 0.5 ? "más" : "menos";
  const ganador = a === b ? MISMA : (pide === "más") === (a > b) ? x : y;
  const final = a === b ? `Los dos grupos tienen ${cant(a, c)}.` : `${ganador} tiene ${pide}.`;
  return pregunta(rng, {
    subhabilidad: T2A,
    dificultad: d,
    enunciado: `¿Quién tiene ${pide} ${c.plural}?`,
    enunciadoFacil: `Mira los dos grupos. ¿Quién tiene ${pide} ${c.plural}?`,
    imagen: grupos({ objeto: dibujo(c), cantidad: a, etiqueta: x }, { objeto: dibujo(c), cantidad: b, etiqueta: y }),
    respuesta: { tipo: "opcion", correcta: ganador, distractores: [x, y, MISMA].filter((t) => t !== ganador) },
    pista: "Cuenta cada grupo y compara los dos números.",
    explicacion: `${x} tiene ${cant(a, c)} y ${y} tiene ${cant(b, c)}. ${final}`,
    plantilla: clave(T2A, "quien", a, b),
  });
};

const tocarMasMenos: Generador = (rng, d) => {
  const valores = porD(d, separados(rng, 3, 1, 12, 3), separados(rng, 3, 3, 15, 2), separados(rng, 3, 8, 20, 1));
  const c = contable(rng);
  const pide = rng() < 0.5 ? "más" : "menos";
  const correcta = pide === "más" ? Math.max(...valores) : Math.min(...valores);
  return pregunta(rng, {
    subhabilidad: T2A,
    dificultad: d,
    enunciado: `Toca el grupo con ${pide} ${c.plural}.`,
    enunciadoFacil: `Cuenta cada grupo. Toca el que tiene ${pide}.`,
    respuesta: { tipo: "imagen", correcta: opcionGrupo(c, correcta), distractores: valores.filter((v) => v !== correcta).map((v) => opcionGrupo(c, v)) },
    pista: "Cuenta los tres grupos y compara los números.",
    explicacion: `Los grupos tienen ${listaY([...valores].sort((p, q) => p - q))}. El que tiene ${pide} es el de ${cant(correcta, c)}.`,
    plantilla: clave(T2A, "tocar", ...valores),
  });
};

const tresNinos: Generador = (rng, d) => {
  const valores = barajar(rng, porD(d, separados(rng, 3, 1, 12, 3), separados(rng, 3, 3, 15, 2), separados(rng, 3, 8, 20, 1)));
  const [x, y, z] = nombres(rng, 3) as [string, string, string];
  const [a, b, e] = valores as [number, number, number];
  const c = contable(rng);
  const pide = rng() < 0.5 ? "más" : "menos";
  const objetivo = pide === "más" ? Math.max(a, b, e) : Math.min(a, b, e);
  const ganador = objetivo === a ? x : objetivo === b ? y : z;
  return pregunta(rng, {
    subhabilidad: T2A,
    dificultad: d,
    enunciado: `Mira los tres grupos. ¿Quién tiene ${pide} ${c.plural}?`,
    enunciadoFacil: `Cuenta los tres grupos. ¿Quién tiene ${pide}?`,
    imagen: grupos({ objeto: dibujo(c), cantidad: a, etiqueta: x }, { objeto: dibujo(c), cantidad: b, etiqueta: y }, { objeto: dibujo(c), cantidad: e, etiqueta: z }),
    respuesta: { tipo: "opcion", correcta: ganador, distractores: [x, y, z].filter((t) => t !== ganador) },
    pista: "Cuenta lo que tiene cada persona y compara.",
    explicacion: `${x} tiene ${a}, ${y} tiene ${b} y ${z} tiene ${e}. ${ganador} es quien tiene ${pide}.`,
    plantilla: clave(T2A, "tres", ...[...valores].sort((p, q) => p - q)),
  });
};

const T2B = "NUM1-T2-b";

const cualMayor: Generador = (rng, d) => {
  const valores = porD(d, separados(rng, 3, 1, 10, 3), separados(rng, 3, 4, 20, 2), separados(rng, 4, 11, 20, 1));
  const pide = d === 1 || rng() < 0.5 ? "mayor" : "menor";
  const correcta = pide === "mayor" ? Math.max(...valores) : Math.min(...valores);
  return pregunta(rng, {
    subhabilidad: T2B,
    dificultad: d,
    enunciado: `¿Cuál de estos números es el ${pide}?`,
    enunciadoFacil: `Lee los números. ¿Cuál es el ${pide}?`,
    respuesta: { tipo: "opcion", correcta: String(correcta), distractores: valores.filter((v) => v !== correcta).map(String) },
    pista: pide === "mayor" ? "Al contar, el número mayor se dice más tarde." : "Al contar, el número menor se dice antes.",
    explicacion: `Si contamos, el ${correcta} es el ${pide === "mayor" ? "último" : "primero"} de estos números. Por eso es el ${pide}.`,
    plantilla: clave(T2B, "cual", pide, ...valores),
  });
};

const completarComparacion: Generador = (rng, d) => {
  const a = entero(rng, ...porR(d, [1, 10], [5, 20], [11, 20]));
  const b = d === 1
    ? (a > 5 ? a - entero(rng, 2, 4) : a + entero(rng, 2, 4))
    : d === 2
      ? (a > 12 ? a - entero(rng, 2, 5) : a + entero(rng, 2, 5))
      : rng() < 0.25 ? a : a === 20 || rng() < 0.5 ? a - 1 : a + 1;
  const correcta = a > b ? "mayor que" : a < b ? "menor que" : "igual que";
  const orden = a === b ? `El ${a} y el ${b} son el mismo número.` : a > b ? `Al contar, el ${a} va después del ${b}.` : `Al contar, el ${a} va antes del ${b}.`;
  return pregunta(rng, {
    subhabilidad: T2B,
    dificultad: d,
    enunciado: `Completa: ${a} es ___ ${b}.`,
    enunciadoFacil: `Lee: ${a} es ___ ${b}. ¿Qué va en el hueco?`,
    respuesta: { tipo: "opcion", correcta, distractores: ["mayor que", "menor que", "igual que"].filter((t) => t !== correcta) },
    pista: "Piensa cuál de los dos números se dice antes al contar.",
    explicacion: `${orden} Por eso ${a} es ${correcta} ${b}.`,
    plantilla: clave(T2B, "completa", a, b),
  });
};

const escribirMayor: Generador = (rng, d) => {
  const valores = barajar(rng, porD(d, separados(rng, 3, 1, 10, 2), separados(rng, 4, 2, 20, 2), separados(rng, 5, 10, 20, 1)));
  const pide = rng() < 0.5 ? "mayor" : "menor";
  const correcta = pide === "mayor" ? Math.max(...valores) : Math.min(...valores);
  return pregunta(rng, {
    subhabilidad: T2B,
    dificultad: d,
    enunciado: `Mira estos números: ${valores.join(", ")}. ¿Cuál es el ${pide}?`,
    enunciadoFacil: `Números: ${valores.join(", ")}. Escribe el ${pide}.`,
    respuesta: { tipo: "numero", valor: correcta },
    pista: "Compara los números de dos en dos y quédate con uno.",
    explicacion: `De estos números, el ${pide} es el ${correcta}.`,
    plantilla: clave(T2B, "escribe", pide, ...[...valores].sort((p, q) => p - q)),
  });
};

const T2C = "NUM1-T2-c";

function desordenar(rng: Rng, ordenados: readonly number[]): number[] {
  const lista = barajar(rng, ordenados);
  return lista.join() === ordenados.join() ? [...lista.slice(1), en(lista, 0)] : lista;
}

function intercambiar(lista: readonly number[], i: number, j: number): number[] {
  const copia = [...lista];
  copia[i] = en(lista, j);
  copia[j] = en(lista, i);
  return copia;
}

function filasFalsas(rng: Rng, correcta: readonly number[]): number[][] {
  const ultimo = correcta.length - 1;
  const candidatas = [[...correcta].reverse(), intercambiar(correcta, 0, 1), intercambiar(correcta, ultimo - 1, ultimo), intercambiar(correcta, 0, ultimo)];
  const vistas = new Set([correcta.join()]);
  return barajar(rng, candidatas).filter((f) => {
    const nueva = !vistas.has(f.join());
    vistas.add(f.join());
    return nueva;
  });
}

const datosOrden = (rng: Rng, d: Dificultad): number[] => porD(d, separados(rng, 3, 1, 10, 1), separados(rng, 3, 3, 20, 2), separados(rng, 4, 2, 20, 1));

const ordenarLista: Generador = (rng, d) => {
  const orden = datosOrden(rng, d);
  const subiendo = d < 3 || rng() < 0.5;
  const sentido = subiendo ? "de menor a mayor" : "de mayor a menor";
  const correcta = subiendo ? orden : [...orden].reverse();
  const lista = desordenar(rng, orden);
  return pregunta(rng, {
    subhabilidad: T2C,
    dificultad: d,
    enunciado: `¿Cómo quedan estos números ordenados ${sentido}: ${lista.join(", ")}?`,
    enunciadoFacil: `Números: ${lista.join(", ")}. Ordénalos ${sentido}.`,
    respuesta: { tipo: "opcion", correcta: correcta.join(", "), distractores: filasFalsas(rng, correcta).slice(0, 3).map((f) => f.join(", ")) },
    pista: subiendo ? "Busca primero el número más pequeño." : "Busca primero el número más grande.",
    explicacion: `Ordenados ${sentido} quedan así: ${correcta.join(", ")}.`,
    plantilla: clave(T2C, "lista", sentido, ...orden),
  });
};

const lugarEnOrden: Generador = (rng, d) => {
  const orden = porD(d, separados(rng, 3, 1, 10, 1), separados(rng, 3, 3, 20, 2), separados(rng, 5, 2, 20, 1));
  const lista = desordenar(rng, orden);
  const lugar = d === 1 ? elegir(rng, ["primero", "último"] as const) : "en medio";
  const correcta = lugar === "primero" ? en(orden, 0) : lugar === "último" ? en(orden, orden.length - 1) : en(orden, (orden.length - 1) / 2);
  const otros = orden.filter((x) => x !== correcta);
  return pregunta(rng, {
    subhabilidad: T2C,
    dificultad: d,
    enunciado: `Ordena de menor a mayor: ${lista.join(", ")}. ¿Qué número queda ${lugar}?`,
    enunciadoFacil: `Números: ${lista.join(", ")}. Ordénalos de menor a mayor. ¿Cuál queda ${lugar}?`,
    respuesta: d === 3 ? { tipo: "numero", valor: correcta } : { tipo: "opcion", correcta: String(correcta), distractores: otros.map(String) },
    pista: "Primero ordena todos los números y después mira el lugar que te piden.",
    explicacion: `De menor a mayor quedan ${orden.join(", ")}. El número que queda ${lugar} es el ${correcta}.`,
    plantilla: clave(T2C, "lugar", lugar, ...orden),
  });
};

const tocarFilaOrdenada: Generador = (rng, d) => {
  const orden = datosOrden(rng, d);
  const subiendo = d < 3 || rng() < 0.5;
  const sentido = subiendo ? "de menor a mayor" : "de mayor a menor";
  const correcta = subiendo ? orden : [...orden].reverse();
  const opcion = (f: readonly number[]): OpcionImagen => ({ texto: f.join(", "), imagen: serieDeTextos(f) });
  return pregunta(rng, {
    subhabilidad: T2C,
    dificultad: d,
    enunciado: `Toca la fila ordenada ${sentido}.`,
    enunciadoFacil: `Busca la fila ${sentido}. Tócala.`,
    respuesta: { tipo: "imagen", correcta: opcion(correcta), distractores: filasFalsas(rng, correcta).slice(0, 2).map(opcion) },
    pista: "Lee cada fila y mira si los números siempre suben, o si siempre bajan.",
    explicacion: `En la fila ${correcta.join(", ")} los números van ${sentido}.`,
    plantilla: clave(T2C, "fila", sentido, ...orden),
  });
};

// ---------- NUM1-T3: sumar hasta 20 ----------
function sumandos(rng: Rng, d: Dificultad): [number, number] {
  if (d === 1) return [entero(rng, 1, 3), entero(rng, 1, 3)];
  if (d === 2) {
    const a = entero(rng, 2, 6);
    return [a, entero(rng, 2, 10 - a)];
  }
  const a = entero(rng, 6, 12);
  return [a, entero(rng, Math.max(5, 11 - a), 20 - a)];
}

const T3A = "NUM1-T3-a";

const sumarGrupos: Generador = (rng, d) => {
  const [a, b] = sumandos(rng, d);
  const s = a + b;
  const c = contable(rng);
  return pregunta(rng, {
    subhabilidad: T3A,
    dificultad: d,
    enunciado: `Mira los dos grupos. ¿${cuantos(c)} ${c.plural} hay en total?`,
    enunciadoFacil: `Junta los dos grupos. ¿${cuantos(c)} ${c.plural} hay?`,
    imagen: grupos({ objeto: dibujo(c), cantidad: a }, { objeto: dibujo(c), cantidad: b }),
    respuesta: respuestaNum(rng, d, s, [s + 1, s - 1, Math.max(a, b), Math.min(a, b)].filter((x) => x >= 1)),
    pista: "Cuenta un grupo y sigue contando con el otro.",
    explicacion: `${a} + ${b} = ${s}. Hay ${cant(s, c)} en total.`,
    plantilla: clave(T3A, "grupos", Math.min(a, b), Math.max(a, b)),
  });
};

const CATEGORIAS = [
  { nombre: "frutas", cuantas: "Cuántas", miembros: [MANZANA, PERA, NARANJA] },
  { nombre: "animales", cuantas: "Cuántos", miembros: [PATO, RANA, GATO, PERRO, PEZ, PAJARO] },
  { nombre: "cosas de la escuela", cuantas: "Cuántas", miembros: [LAPIZ, LIBRO, CUADERNO, MOCHILA] },
] as const;

const sumarCategoria: Generador = (rng, d) => {
  const [a, b] = sumandos(rng, d);
  const s = a + b;
  const cat = elegir(rng, CATEGORIAS);
  const [p, q] = muestra<Unidad>(rng, cat.miembros, 2) as [Unidad, Unidad];
  return pregunta(rng, {
    subhabilidad: T3A,
    dificultad: d,
    enunciado: `Mira la imagen. ¿${cat.cuantas} ${cat.nombre} hay en total?`,
    enunciadoFacil: `Cuenta los dos grupos. ¿${cat.cuantas} ${cat.nombre} hay?`,
    imagen: grupos({ objeto: dibujo(p), cantidad: a }, { objeto: dibujo(q), cantidad: b }),
    respuesta: respuestaNum(rng, d, s, [a, b, s + 1, s - 1].filter((x) => x >= 1)),
    pista: "Cuenta los dos grupos, no solo uno.",
    explicacion: `Hay ${cant(a, p)} y ${cant(b, q)}. ${a} + ${b} = ${s}.`,
    plantilla: clave(T3A, "categoria", Math.min(a, b), Math.max(a, b)),
  });
};

const tocarSuma: Generador = (rng, d) => {
  const [a, b] = sumandos(rng, d);
  const s = a + b;
  const c = contable(rng);
  const otros = cercanos(s, barajar(rng, [s + 1, s - 1, s + 2, s - 2, Math.max(a, b)].filter((x) => x <= 20)), 2);
  return pregunta(rng, {
    subhabilidad: T3A,
    dificultad: d,
    enunciado: `Toca el grupo que tiene lo mismo que ${a} + ${b}.`,
    enunciadoFacil: `Haz la suma ${a} + ${b}. Toca el grupo con ese número.`,
    respuesta: { tipo: "imagen", correcta: opcionGrupo(c, s), distractores: otros.map((x) => opcionGrupo(c, x)) },
    pista: "Primero haz la suma. Después cuenta cada grupo.",
    explicacion: `${a} + ${b} = ${s}, y ese grupo tiene ${cant(s, c)}.`,
    plantilla: clave(T3A, "tocar", Math.min(a, b), Math.max(a, b)),
  });
};

const T3B = "NUM1-T3-b";

function sumaHasta20(rng: Rng, d: Dificultad): [number, number] {
  if (d === 1) {
    const a = entero(rng, 1, 8);
    return [a, entero(rng, 1, 10 - a)];
  }
  if (d === 2) {
    const u = entero(rng, 0, 7);
    return [10 + u, entero(rng, 2, 9 - u)];
  }
  const a = entero(rng, 4, 9);
  return [a, entero(rng, 11 - a, 9)];
}

const sumaDirecta: Generador = (rng, d) => {
  const [a, b] = sumaHasta20(rng, d);
  const s = a + b;
  const olvidoDecena = s > 10 && d === 3 ? [s - 10] : [];
  return pregunta(rng, {
    subhabilidad: T3B,
    dificultad: d,
    enunciado: `¿Cuánto es ${a} + ${b}?`,
    enunciadoFacil: `Suma ${a} y ${b}.`,
    respuesta: respuestaNum(rng, d, s, [...olvidoDecena, s + 1, s - 1, Math.abs(a - b)].filter((x) => x >= 1)),
    pista: "Empieza por el número mayor y cuenta hacia delante.",
    explicacion: `Desde el ${Math.max(a, b)} cuentas ${Math.min(a, b)} más y llegas al ${s}.`,
    plantilla: clave(T3B, "directa", Math.min(a, b), Math.max(a, b)),
  });
};

const sumandoQueFalta: Generador = (rng, d) => {
  const [a, b] = sumaHasta20(rng, d);
  const s = a + b;
  return pregunta(rng, {
    subhabilidad: T3B,
    dificultad: d,
    enunciado: `¿Qué número falta? ${a} + ___ = ${s}`,
    enunciadoFacil: `Mira: ${a} + ___ = ${s}. ¿Qué número va en el hueco?`,
    respuesta: respuestaNum(rng, d, b, [s, a, b + 1, b - 1].filter((x) => x >= 1)),
    pista: `Cuenta desde el ${a} hasta llegar al ${s}.`,
    explicacion: `${a} + ${b} = ${s}. Del ${a} al ${s} hay ${b}.`,
    plantilla: clave(T3B, "falta", a, b),
  });
};

const tresSumandos: Generador = (rng, d) => {
  const [m1, m2] = porR(d, [1, 3], [2, 5], [3, 6]);
  const lista = [entero(rng, m1, m2), entero(rng, m1, m2), entero(rng, m1, m2)];
  const s = suma(lista);
  const [a, b, c] = lista as [number, number, number];
  return pregunta(rng, {
    subhabilidad: T3B,
    dificultad: d,
    enunciado: `¿Cuánto es ${a} + ${b} + ${c}?`,
    enunciadoFacil: `Suma ${a}, ${b} y ${c}.`,
    respuesta: respuestaNum(rng, d, s, [a + b, b + c, s + 1, s - 1]),
    pista: "Suma dos números y después suma el tercero.",
    explicacion: `${a} + ${b} = ${a + b}, y ${a + b} + ${c} = ${s}.`,
    plantilla: clave(T3B, "tres", ...[...lista].sort((p, q) => p - q)),
  });
};

interface Historia {
  readonly u: Unidad;
  readonly texto: (a: number, b: number, x: string, y: string) => string;
  readonly facil: (a: number, b: number, x: string, y: string) => string;
}

const JUNTAR: readonly Historia[] = [
  { u: MANZANA, texto: (a, b, x, y) => `${x} recoge ${a} manzanas en el huerto y ${y} recoge ${b}. ¿Cuántas manzanas recogen en total?`, facil: (a, b, x, y) => `${x} recoge ${a} manzanas. ${y} recoge ${b} manzanas. ¿Cuántas son en total?` },
  { u: PAJARO, texto: (a, b) => `En un árbol hay ${a} pájaros y llegan ${b} pájaros más. ¿Cuántos pájaros hay ahora en el árbol?`, facil: (a, b) => `Hay ${a} pájaros. Llegan ${b} pájaros más. ¿Cuántos hay ahora?` },
  { u: LAPIZ, texto: (a, b) => `En una caja hay ${a} lápices y en la mesa hay ${b} lápices. ¿Cuántos lápices hay en total?`, facil: (a, b) => `Hay ${a} lápices en una caja. Hay ${b} lápices en la mesa. ¿Cuántos hay en total?` },
  { u: RANA, texto: (a, b) => `En el charco hay ${a} ranas y saltan ${b} ranas más al agua. ¿Cuántas ranas hay ahora en el charco?`, facil: (a, b) => `Hay ${a} ranas. Saltan ${b} ranas más. ¿Cuántas hay ahora?` },
  { u: LIBRO, texto: (a, b, x, y) => `${x} tiene ${a} libros y ${y} tiene ${b} libros. ¿Cuántos libros tienen en total?`, facil: (a, b, x, y) => `${x} tiene ${a} libros. ${y} tiene ${b} libros. ¿Cuántos son en total?` },
  { u: NARANJA, texto: (a, b) => `En el mercado hay ${a} naranjas en una caja y ${b} naranjas en otra. ¿Cuántas naranjas hay en total?`, facil: (a, b) => `Una caja tiene ${a} naranjas. Otra caja tiene ${b} naranjas. ¿Cuántas hay en total?` },
  { u: PATO, texto: (a, b) => `En el río nadan ${a} patos y llegan ${b} patos más. ¿Cuántos patos hay ahora en el río?`, facil: (a, b) => `Nadan ${a} patos. Llegan ${b} patos más. ¿Cuántos hay ahora?` },
  { u: CUBO_AGUA, texto: (a, b, x) => `${x} saca ${a} cubos de agua del pozo por la mañana y ${b} por la tarde. ¿Cuántos cubos de agua saca en total?`, facil: (a, b, x) => `${x} saca ${a} cubos por la mañana. Saca ${b} cubos por la tarde. ¿Cuántos saca en total?` },
];

function juntarHasta20(rng: Rng, d: Dificultad): [number, number] {
  if (d === 1) {
    const a = entero(rng, 2, 7);
    return [a, entero(rng, 2, 9 - a)];
  }
  if (d === 2) {
    const a = entero(rng, 5, 11);
    return [a, entero(rng, 2, 15 - a)];
  }
  const a = entero(rng, 6, 9);
  return [a, entero(rng, 11 - a, 9)];
}

const T3C = "NUM1-T3-c";

const problemaJuntar: Generador = (rng, d) => {
  const [a, b] = juntarHasta20(rng, d);
  const s = a + b;
  const h = elegir(rng, JUNTAR);
  const [x, y] = nombres(rng, 2) as [string, string];
  const id = h.u.id;
  const imagen = id !== undefined && d < 3 ? grupos({ objeto: id, cantidad: a }, { objeto: id, cantidad: b }) : undefined;
  return pregunta(rng, {
    subhabilidad: T3C,
    dificultad: d,
    enunciado: h.texto(a, b, x, y),
    enunciadoFacil: h.facil(a, b, x, y),
    ...(imagen === undefined ? {} : { imagen }),
    respuesta: respuestaNum(rng, d, s, [Math.abs(a - b), a, b, s + 1, s - 1].filter((v) => v >= 1)),
    pista: "Tienes que juntar las dos cantidades.",
    explicacion: `Juntamos: ${a} + ${b} = ${s}. Son ${cant(s, h.u)}.`,
    plantilla: clave(T3C, "juntar", Math.min(a, b), Math.max(a, b)),
  });
};

const tresPersonas: Generador = (rng, d) => {
  const [m1, m2] = porR(d, [2, 3], [2, 5], [3, 6]);
  const lista = [entero(rng, m1, m2), entero(rng, m1, m2), entero(rng, m1, m2)];
  const [a, b, c] = lista as [number, number, number];
  const s = suma(lista);
  const u = elegir(rng, [LIBRO, LAPIZ, PELOTA, CUADERNO, FLOR]);
  const [x, y, z] = nombres(rng, 3) as [string, string, string];
  return pregunta(rng, {
    subhabilidad: T3C,
    dificultad: d,
    enunciado: `${x} tiene ${a} ${u.plural}, ${y} tiene ${b} y ${z} tiene ${c}. ¿${cuantos(u)} ${u.plural} tienen en total?`,
    enunciadoFacil: `${x} tiene ${a} ${u.plural}. ${y} tiene ${b}. ${z} tiene ${c}. ¿${cuantos(u)} son en total?`,
    respuesta: respuestaNum(rng, d, s, [a + b, b + c, s + 1, s - 1]),
    pista: "Suma lo de dos personas y después añade lo de la tercera.",
    explicacion: `${a} + ${b} + ${c} = ${s}. Tienen ${cant(s, u)} en total.`,
    plantilla: clave(T3C, "tres", ...[...lista].sort((p, q) => p - q)),
  });
};

// ---------- NUM1-T4: restar hasta 20 ----------
function restaHasta20(rng: Rng, d: Dificultad): [number, number] {
  if (d === 1) {
    const a = entero(rng, 4, 10);
    return [a, entero(rng, 2, a - 2)];
  }
  if (d === 2) {
    const u = entero(rng, 2, 9);
    return [10 + u, entero(rng, 2, u)];
  }
  const u = entero(rng, 0, 8);
  return [10 + u, entero(rng, Math.max(2, u + 1), Math.min(9, 8 + u))];
}

const T4A = "NUM1-T4-a";
const tachado = (k: number, u: Unidad): string => `${k} ${u.genero === "f" ? "tachada" : "tachado"}${k === 1 ? "" : "s"}`;

function quitarConDibujo(rng: Rng, d: Dificultad): [number, number] {
  const n = entero(rng, ...porR(d, [3, 5], [6, 10], [11, 20]));
  return [n, entero(rng, 1, n - 2)];
}

const contarLosQueQuedan: Generador = (rng, d) => {
  const [n, k] = quitarConDibujo(rng, d);
  const r = n - k;
  const c = contable(rng);
  return pregunta(rng, {
    subhabilidad: T4A,
    dificultad: d,
    enunciado: `Los dibujos con una cruz se han quitado. ¿${cuantos(c)} ${c.plural} quedan?`,
    enunciadoFacil: `Mira ${los(c)} ${c.plural}. No cuentes los dibujos con cruz. ¿${cuantos(c)} quedan?`,
    imagen: grupos({ objeto: dibujo(c), cantidad: n, tachados: k }),
    respuesta: respuestaNum(rng, d, r, [k, n, r + 1, r - 1].filter((x) => x >= 1)),
    pista: "Cuenta solo los dibujos que no tienen cruz.",
    explicacion: `Había ${n} y ${k === 1 ? "se quita" : "se quitan"} ${k}: ${n} − ${k} = ${r}. ${quedan(r)} ${cant(r, c)}.`,
    plantilla: clave(T4A, "quedan", n, k),
  });
};

const tocarDibujoDeResta: Generador = (rng, d) => {
  const [n, k0] = quitarConDibujo(rng, d);
  const k = Math.max(2, k0);
  const c = contable(rng);
  const opcion = (total: number, quitados: number): OpcionImagen => ({
    texto: `${cant(total, c)}, ${tachado(quitados, c)}`,
    imagen: grupos({ objeto: dibujo(c), cantidad: total, tachados: quitados }),
  });
  return pregunta(rng, {
    subhabilidad: T4A,
    dificultad: d,
    enunciado: `Tienes ${n} ${c.plural} y quitas ${k}. Toca el dibujo que lo muestra.`,
    enunciadoFacil: `Hay ${n} ${c.plural}. Quitas ${k}. ¿Qué dibujo es?`,
    respuesta: { tipo: "imagen", correcta: opcion(n, k), distractores: [opcion(n, k - 1), opcion(n === 20 ? n - 1 : n + 1, k)] },
    pista: "Cuenta todos los dibujos y después cuenta solo los que tienen cruz.",
    explicacion: `Ese dibujo tiene ${cant(n, c)} y ${k} con una cruz.`,
    plantilla: clave(T4A, "dibujo", n, k),
  });
};

const tocarLoQueQueda: Generador = (rng, d) => {
  const [n, k] = quitarConDibujo(rng, d);
  const r = n - k;
  const c = contable(rng);
  const otros = cercanos(r, barajar(rng, [r + 1, r - 1, k, n]), 2);
  return pregunta(rng, {
    subhabilidad: T4A,
    dificultad: d,
    enunciado: `Hay ${n} ${c.plural} y quitas ${k}. Toca el grupo que queda.`,
    enunciadoFacil: `Hay ${n} ${c.plural}. Quitas ${k}. ¿Qué grupo queda?`,
    imagen: grupos({ objeto: dibujo(c), cantidad: n, tachados: k }),
    respuesta: { tipo: "imagen", correcta: opcionGrupo(c, r), distractores: otros.map((x) => opcionGrupo(c, x)) },
    pista: "Cuenta los dibujos que no tienen cruz.",
    explicacion: `${n} − ${k} = ${r}. ${quedan(r)} ${cant(r, c)}.`,
    plantilla: clave(T4A, "tocar", n, k),
  });
};

const T4B = "NUM1-T4-b";

// Error típico al restar: quitar el número pequeño del grande sin mirar el orden.
const erroresResta = (a: number, b: number): number[] => {
  const r = a - b;
  const alReves = a > 10 && b > a % 10 ? [10 + (b - (a % 10))] : [];
  return [...alReves, a + b, r + 1, r - 1, b].filter((x) => x >= 1 && x !== r);
};

const restaDirecta: Generador = (rng, d) => {
  const [a, b] = restaHasta20(rng, d);
  const r = a - b;
  return pregunta(rng, {
    subhabilidad: T4B,
    dificultad: d,
    enunciado: `¿Cuánto es ${a} − ${b}?`,
    enunciadoFacil: `Al ${a} quítale ${b}.`,
    respuesta: respuestaNum(rng, d, r, erroresResta(a, b)),
    pista: `Cuenta hacia atrás desde el ${a}.`,
    explicacion: `Desde el ${a} cuentas ${b} hacia atrás y llegas al ${r}.`,
    plantilla: clave(T4B, "directa", a, b),
  });
};

const sustraendoQueFalta: Generador = (rng, d) => {
  const [a, b] = restaHasta20(rng, d);
  const r = a - b;
  return pregunta(rng, {
    subhabilidad: T4B,
    dificultad: d,
    enunciado: `¿Qué número falta? ${a} − ___ = ${r}`,
    enunciadoFacil: `Mira: ${a} − ___ = ${r}. ¿Qué número va en el hueco?`,
    respuesta: respuestaNum(rng, d, b, [a, r, b + 1, b - 1].filter((x) => x >= 1)),
    pista: `Cuenta desde el ${r} hasta llegar al ${a}.`,
    explicacion: `${a} − ${b} = ${r}. Del ${r} al ${a} hay ${b}.`,
    plantilla: clave(T4B, "falta", a, b),
  });
};

const quitarDosVeces: Generador = (rng, d) => {
  const [m1, m2] = porR(d, [6, 10], [11, 15], [16, 20]);
  const a = entero(rng, m1, m2);
  const b = entero(rng, 1, porD(d, 2, 4, 7));
  const c = entero(rng, 1, porD(d, 2, 4, 7));
  const r = a - b - c;
  return pregunta(rng, {
    subhabilidad: T4B,
    dificultad: d,
    enunciado: `¿Cuánto es ${a} − ${b} − ${c}?`,
    enunciadoFacil: `Al ${a} quítale ${b}. Después quítale ${c}.`,
    respuesta: respuestaNum(rng, d, r, [a - b, a - c, a - b + c, r + 1, r - 1].filter((x) => x >= 1)),
    pista: "Haz primero la primera resta. Sigue con lo que te dé.",
    explicacion: `${a} − ${b} = ${a - b}, y ${a - b} − ${c} = ${r}.`,
    plantilla: clave(T4B, "dos", a, b, c),
  });
};

const QUITAR: readonly Historia[] = [
  { u: MANZANA, texto: (a, b, x, y) => `${x} tiene ${a} manzanas y le da ${b} a ${y}. ¿Cuántas manzanas le quedan a ${x}?`, facil: (a, b, x, y) => `${x} tiene ${a} manzanas. Da ${b} a ${y}. ¿Cuántas le quedan?` },
  { u: PAJARO, texto: (a, b) => `En un árbol hay ${a} pájaros y se van ${b} pájaros. ¿Cuántos pájaros quedan en el árbol?`, facil: (a, b) => `Hay ${a} pájaros. Se van ${b} pájaros. ¿Cuántos quedan?` },
  { u: HUEVO, texto: (a, b, x) => `En la caja hay ${a} huevos y ${x} saca ${b}. ¿Cuántos huevos quedan en la caja?`, facil: (a, b, x) => `Hay ${a} huevos. ${x} saca ${b} huevos. ¿Cuántos quedan?` },
  { u: LAPIZ, texto: (a, b, x) => `En la caja hay ${a} lápices y ${x} saca ${b} para la clase. ¿Cuántos lápices quedan en la caja?`, facil: (a, b, x) => `Hay ${a} lápices. ${x} saca ${b} lápices. ¿Cuántos quedan?` },
  { u: NARANJA, texto: (a, b) => `En el mercado había ${a} naranjas y se venden ${b}. ¿Cuántas naranjas quedan?`, facil: (a, b) => `Había ${a} naranjas. Se venden ${b} naranjas. ¿Cuántas quedan?` },
  { u: PATO, texto: (a, b) => `En el río hay ${a} patos y se van ${b} patos. ¿Cuántos patos quedan en el río?`, facil: (a, b) => `Hay ${a} patos. Se van ${b} patos. ¿Cuántos quedan?` },
  { u: PERSONA, texto: (a, b) => `En el autobús van ${a} personas y bajan ${b}. ¿Cuántas personas quedan en el autobús?`, facil: (a, b) => `Van ${a} personas. Bajan ${b} personas. ¿Cuántas quedan?` },
  { u: VASO, texto: (a, b, x) => `En la mesa hay ${a} vasos y ${x} guarda ${b}. ¿Cuántos vasos quedan en la mesa?`, facil: (a, b, x) => `Hay ${a} vasos. ${x} guarda ${b} vasos. ¿Cuántos quedan?` },
];

const T4C = "NUM1-T4-c";

const problemaQuitar: Generador = (rng, d) => {
  const [a, b] = restaHasta20(rng, d);
  const r = a - b;
  const h = elegir(rng, QUITAR);
  const [x, y] = nombres(rng, 2) as [string, string];
  const id = h.u.id;
  const imagen = id !== undefined && d < 3 ? grupos({ objeto: id, cantidad: a, tachados: b }) : undefined;
  return pregunta(rng, {
    subhabilidad: T4C,
    dificultad: d,
    enunciado: h.texto(a, b, x, y),
    enunciadoFacil: h.facil(a, b, x, y),
    ...(imagen === undefined ? {} : { imagen }),
    respuesta: respuestaNum(rng, d, r, [a + b, b, r + 1, r - 1].filter((v) => v >= 1)),
    pista: "Al principio había más. Piensa cuántos se quitan.",
    explicacion: `Quitamos: ${a} − ${b} = ${r}. ${quedan(r)} ${cant(r, h.u)}.`,
    plantilla: clave(T4C, "quitar", a, b),
  });
};

const FALTAR: readonly { readonly u: Unidad; readonly verbo: string; readonly hecho: string; readonly lugar: string }[] = [
  { u: LAPIZ, verbo: "repartir", hecho: "repartido", lugar: "en la clase" },
  { u: FLOR, verbo: "plantar", hecho: "plantado", lugar: "en el huerto" },
  { u: BOTELLA, verbo: "llenar", hecho: "llenado", lugar: "en el pozo" },
  { u: LIBRO, verbo: "ordenar", hecho: "ordenado", lugar: "en la escuela" },
];

const problemaFaltan: Generador = (rng, d) => {
  const [a, b] = restaHasta20(rng, d);
  const r = a - b;
  const h = elegir(rng, FALTAR);
  const [x] = nombres(rng, 1) as [string];
  return pregunta(rng, {
    subhabilidad: T4C,
    dificultad: d,
    enunciado: `${x} tiene que ${h.verbo} ${a} ${h.u.plural} ${h.lugar}. Ya ha ${h.hecho} ${b}. ¿${cuantos(h.u)} ${h.u.plural} le faltan?`,
    enunciadoFacil: `${x} tiene que ${h.verbo} ${a} ${h.u.plural}. Ya ha ${h.hecho} ${b}. ¿${cuantos(h.u)} le faltan?`,
    respuesta: respuestaNum(rng, d, r, [a + b, b, r + 1, r - 1].filter((v) => v >= 1)),
    pista: `Piensa cuánto hay que contar desde el ${b} hasta llegar al ${a}.`,
    explicacion: `${a} − ${b} = ${r}. Le ${r === 1 ? "falta" : "faltan"} ${cant(r, h.u)}.`,
    plantilla: clave(T4C, "faltan", a, b),
  });
};

// ---------- NUM1-T5: formas y medidas ----------
const T5A = "NUM1-T5-a";
const OBJETIVOS = { 1: ["circulo", "cuadrado", "triangulo", "rectangulo"], 2: ["rombo", "ovalo", "rectangulo"], 3: ["pentagono", "hexagono", "rombo"] } as const;
const COMPANIAS = {
  1: ["circulo", "cuadrado", "triangulo", "rectangulo"],
  2: ["circulo", "triangulo", "cuadrado", "rombo", "ovalo", "rectangulo"],
  3: ["pentagono", "hexagono", "rombo", "ovalo", "rectangulo"],
} as const;

// Dos formas que acompañan a `objetivo` y no se pueden confundir con ella en sentido estricto.
function formasCompatibles(rng: Rng, objetivo: string, pool: readonly string[]): string[] {
  const salida: string[] = [];
  // Óvalo y círculo, pentágono y hexágono: la confusión típica va primero si existe.
  const pareja: Readonly<Record<string, string>> = { ovalo: "circulo", pentagono: "hexagono", hexagono: "pentagono" };
  const primera = pareja[objetivo];
  const orden = [...(primera === undefined ? [] : [primera]), ...barajar(rng, pool)];
  for (const f of orden) {
    if (f !== objetivo && !salida.includes(f) && !chocan(f, objetivo) && !salida.some((s) => chocan(s, f)) && salida.length < 2) salida.push(f);
  }
  return salida;
}

const figura = (rng: Rng, id: string): Imagen => ({ tipo: "figura", forma: infoForma(id).id, color: elegir(rng, COLORES) });

const tocarForma: Generador = (rng, d) => {
  const objetivo = elegir(rng, OBJETIVOS[d]);
  const info = infoForma(objetivo);
  const opcion = (id: string): OpcionImagen => ({ texto: mayus(infoForma(id).nombre), imagen: figura(rng, id) });
  return pregunta(rng, {
    subhabilidad: T5A,
    dificultad: d,
    enunciado: `Toca el ${info.nombre}.`,
    enunciadoFacil: `Busca el ${info.nombre}. Tócalo.`,
    respuesta: { tipo: "imagen", correcta: opcion(objetivo), distractores: formasCompatibles(rng, objetivo, COMPANIAS[d]).map(opcion) },
    pista: "Mira los lados y las esquinas de cada forma.",
    explicacion: descripcionForma(objetivo),
    plantilla: clave(T5A, "tocar", objetivo),
  });
};

function descripcionForma(id: string): string {
  const info = infoForma(id);
  const textos: Readonly<Record<string, string>> = {
    circulo: "El círculo es redondo y no tiene esquinas.",
    ovalo: "El óvalo es redondo pero alargado, como un huevo.",
    triangulo: "El triángulo tiene 3 lados y 3 esquinas.",
    cuadrado: "El cuadrado tiene 4 lados iguales y 4 esquinas rectas.",
    rectangulo: "El rectángulo tiene 4 lados: 2 largos y 2 cortos.",
    rombo: "El rombo tiene 4 lados iguales y parece un cuadrado inclinado.",
    pentagono: "El pentágono tiene 5 lados.",
    hexagono: "El hexágono tiene 6 lados.",
  };
  return textos[id] ?? `Es un ${info.nombre}.`;
}

const nombrarForma: Generador = (rng, d) => {
  const objetivo = elegir(rng, OBJETIVOS[d]);
  const info = infoForma(objetivo);
  return pregunta(rng, {
    subhabilidad: T5A,
    dificultad: d,
    enunciado: "¿Qué forma es esta?",
    enunciadoFacil: "Mira la forma. ¿Cómo se llama?",
    imagen: figura(rng, objetivo),
    respuesta: { tipo: "opcion", correcta: mayus(info.nombre), distractores: formasCompatibles(rng, objetivo, COMPANIAS[d]).map((f) => mayus(infoForma(f).nombre)) },
    pista: "Cuenta los lados. Mira si es redonda o si tiene esquinas.",
    explicacion: descripcionForma(objetivo),
    plantilla: clave(T5A, "nombrar", objetivo),
  });
};

const CON_LADOS = { 1: ["triangulo", "cuadrado"], 2: ["rectangulo", "rombo", "triangulo"], 3: ["pentagono", "hexagono"] } as const;

const contarLados: Generador = (rng, d) => {
  const objetivo = elegir(rng, CON_LADOS[d]);
  const n = infoForma(objetivo).lados ?? 0;
  return pregunta(rng, {
    subhabilidad: T5A,
    dificultad: d,
    enunciado: "Mira la forma. ¿Cuántos lados tiene?",
    enunciadoFacil: "Cuenta los lados de la forma.",
    imagen: figura(rng, objetivo),
    respuesta: respuestaNum(rng, d, n, [n + 1, n - 1, n + 2]),
    pista: "Pon el dedo en un lado y da la vuelta contando cada lado.",
    explicacion: `Es un ${infoForma(objetivo).nombre} y tiene ${n} lados.`,
    plantilla: clave(T5A, "lados", objetivo),
  });
};

const POR_LADOS = {
  1: [{ n: 3, f: "triangulo", otras: ["circulo", "cuadrado", "pentagono"] }, { n: 4, f: "cuadrado", otras: ["circulo", "triangulo", "pentagono"] }],
  2: [{ n: 4, f: "rombo", otras: ["triangulo", "pentagono", "circulo"] }, { n: 4, f: "rectangulo", otras: ["triangulo", "hexagono", "ovalo"] }, { n: 5, f: "pentagono", otras: ["cuadrado", "triangulo", "ovalo"] }],
  3: [{ n: 5, f: "pentagono", otras: ["hexagono", "rombo", "rectangulo"] }, { n: 6, f: "hexagono", otras: ["pentagono", "rombo", "rectangulo"] }],
} as const;

const tocarPorLados: Generador = (rng, d) => {
  const caso = elegir<{ readonly n: number; readonly f: string; readonly otras: readonly string[] }>(rng, POR_LADOS[d]);
  const opcion = (id: string): OpcionImagen => ({ texto: mayus(infoForma(id).nombre), imagen: figura(rng, id) });
  const otras = muestra(rng, caso.otras, 2);
  return pregunta(rng, {
    subhabilidad: T5A,
    dificultad: d,
    enunciado: `Toca la forma que tiene ${caso.n} lados.`,
    enunciadoFacil: `Cuenta los lados. Toca la forma con ${caso.n} lados.`,
    respuesta: { tipo: "imagen", correcta: opcion(caso.f), distractores: otras.map(opcion) },
    pista: "Cuenta los lados de cada forma, uno a uno.",
    explicacion: `El ${infoForma(caso.f).nombre} tiene ${caso.n} lados.`,
    plantilla: clave(T5A, "porlados", caso.f, ...[...otras].sort()),
  });
};

const T5B = "NUM1-T5-b";

const tiraExtrema: Generador = (rng, d) => {
  const largos = barajar(rng, porD(d, separados(rng, 3, 2, 12, 4), separados(rng, 3, 3, 12, 2), separados(rng, 4, 6, 13, 1)));
  const letras = ["A", "B", "C", "D"].slice(0, largos.length);
  const pide = d === 1 || rng() < 0.5 ? "larga" : "corta";
  const objetivo = pide === "larga" ? Math.max(...largos) : Math.min(...largos);
  const correcta = en(letras, largos.indexOf(objetivo));
  return pregunta(rng, {
    subhabilidad: T5B,
    dificultad: d,
    enunciado: `¿Qué tira es la más ${pide}?`,
    enunciadoFacil: `Mira las tiras. ¿Cuál es la más ${pide}?`,
    imagen: { tipo: "tiras", tiras: largos.map((largo, i) => ({ etiqueta: en(letras, i), largo })) },
    respuesta: { tipo: "opcion", correcta: `La tira ${correcta}`, distractores: letras.filter((l) => l !== correcta).map((l) => `La tira ${l}`) },
    pista: "Compara dónde termina cada tira.",
    explicacion: `La tira ${correcta} es la que ${pide === "larga" ? "llega más lejos" : "termina antes"}.`,
    plantilla: clave(T5B, "tira", pide, ...largos),
  });
};

const MISMO_PESO = "Pesan lo mismo";

interface Pesable {
  readonly id: ObjetoId;
  readonly texto: string;
}
const P = (id: ObjetoId, texto: string): Pesable => ({ id, texto });
// Parejas donde la balanza coincide con lo que todo el mundo sabe: el primero pesa más.
const PAREJAS_REALES: readonly (readonly [Pesable, Pesable])[] = [
  [P("elefante", "El elefante"), P("gato", "El gato")],
  [P("vaca", "La vaca"), P("pato", "El pato")],
  [P("mesa", "La mesa"), P("lapiz", "El lápiz")],
  [P("libro", "El libro"), P("hoja", "La hoja")],
  [P("oso", "El oso"), P("rana", "La rana")],
  [P("perro", "El perro"), P("hormiga", "La hormiga")],
];
// Parejas parecidas: solo la balanza dice cuál pesa más.
const PAREJAS_PARECIDAS: readonly (readonly [Pesable, Pesable])[] = [
  [P("manzana", "La manzana"), P("pera", "La pera")],
  [P("taza", "La taza"), P("vaso", "El vaso")],
  [P("caja", "La caja"), P("mochila", "La mochila")],
  [P("pelota", "La pelota"), P("naranja", "La naranja")],
  [P("libro", "El libro"), P("cuaderno", "El cuaderno")],
  [P("botella", "La botella"), P("zapato", "El zapato")],
];

const balanza: Generador = (rng, d) => {
  const [pesado, ligero] = elegir(rng, d === 1 ? PAREJAS_REALES : PAREJAS_PARECIDAS) as readonly [Pesable, Pesable];
  const igual = d === 3 && rng() < 0.3;
  const pesadoIzquierda = rng() < 0.5;
  const izquierda = pesadoIzquierda ? pesado : ligero;
  const derecha = pesadoIzquierda ? ligero : pesado;
  const pide = d === 1 ? "más" : d === 2 ? elegir(rng, ["más", "menos"] as const) : "menos";
  const correcta = igual ? MISMO_PESO : pide === "más" ? pesado.texto : ligero.texto;
  const baja = igual ? "ninguna" : pesadoIzquierda ? "izquierda" : "derecha";
  return pregunta(rng, {
    subhabilidad: T5B,
    dificultad: d,
    enunciado: `Mira la balanza. ¿Qué pesa ${pide}?`,
    enunciadoFacil: `Mira qué lado de la balanza baja. ¿Qué pesa ${pide}?`,
    imagen: { tipo: "balanza", izquierda: izquierda.id, derecha: derecha.id, baja },
    respuesta: { tipo: "opcion", correcta, distractores: [pesado.texto, ligero.texto, MISMO_PESO].filter((t) => t !== correcta) },
    pista: "El lado de la balanza que pesa más baja. Si pesan igual, queda recta.",
    explicacion: igual
      ? "La balanza queda recta, así que pesan lo mismo."
      : `Baja el lado ${pesado.texto.startsWith("El ") ? `del ${pesado.texto.slice(3)}` : `de ${pesado.texto.toLowerCase()}`}, que pesa más. ${ligero.texto} pesa menos.`,
    plantilla: clave(T5B, "balanza", pesado.id, igual ? "igual" : pide),
  });
};

const MISMA_MEDIDA = "Miden lo mismo";

const cuerdas: Generador = (rng, d) => {
  const a = entero(rng, ...porR(d, [7, 12], [5, 14], [12, 20]));
  const b = d === 1 ? entero(rng, 2, a - 4) : d === 2 ? a - entero(rng, 2, 3) : rng() < 0.3 ? a : a - 1;
  const [p, q] = rng() < 0.5 ? [a, b] : [b, a];
  const [x, y] = nombres(rng, 2) as [string, string];
  const pide = d === 1 || rng() < 0.5 ? "larga" : "corta";
  const ganador = p === q ? MISMA_MEDIDA : (pide === "larga") === (p > q) ? x : y;
  const final = p === q ? "Las dos cuerdas miden lo mismo." : `La de ${ganador} es la más ${pide}.`;
  return pregunta(rng, {
    subhabilidad: T5B,
    dificultad: d,
    enunciado: `La cuerda de ${x} mide ${p} pasos y la de ${y} mide ${q} pasos. ¿De quién es la cuerda más ${pide}?`,
    enunciadoFacil: `La cuerda de ${x} mide ${p} pasos. La cuerda de ${y} mide ${q} pasos. ¿Cuál es la más ${pide}?`,
    imagen: { tipo: "tiras", tiras: [{ etiqueta: x, largo: p }, { etiqueta: y, largo: q }] },
    respuesta: { tipo: "opcion", correcta: ganador, distractores: [x, y, MISMA_MEDIDA].filter((t) => t !== ganador) },
    pista: "Compara los dos números de pasos.",
    explicacion: `Una cuerda mide ${p} pasos y la otra mide ${q} pasos. ${final}`,
    plantilla: clave(T5B, "cuerdas", pide, p, q),
  });
};

const T5C = "NUM1-T5-c";
const D = (i: number): string => mayus(dia(i));

const diaVecino: Generador = (rng, d) => {
  const i = entero(rng, 0, 6);
  const salto = porD(d, 1, -1, 2);
  const frase = porD(d, `justo después del ${dia(i)}`, `justo antes del ${dia(i)}`, `dos días después del ${dia(i)}`);
  const correcto = i + salto;
  return pregunta(rng, {
    subhabilidad: T5C,
    dificultad: d,
    enunciado: `¿Qué día va ${frase}?`,
    enunciadoFacil: `Piensa en el ${dia(i)}. ¿Qué día va ${frase.replace(` del ${dia(i)}`, "")}?`,
    respuesta: { tipo: "opcion", correcta: D(correcto), distractores: distractoresTexto(rng, D(correcto), [D(i - 1), D(i + 1), D(i + 2), D(i)], 3) },
    pista: "Di los días de la semana en orden, en voz alta.",
    explicacion: d === 2 ? `Al decir los días en orden, el ${dia(correcto)} va justo antes del ${dia(i)}.` : d === 1 ? `Después del ${dia(i)} viene el ${dia(correcto)}.` : `Después del ${dia(i)} viene el ${dia(i + 1)}, y después el ${dia(correcto)}.`,
    plantilla: clave(T5C, "vecino", i),
  });
};

const hoyEs: Generador = (rng, d) => {
  const i = entero(rng, 0, 6);
  const caso = porD(
    d,
    { palabra: "mañana", verbo: "será", salto: 1 },
    { palabra: "ayer", verbo: "fue", salto: -1 },
    elegir(rng, [{ palabra: "pasado mañana", verbo: "será", salto: 2 }, { palabra: "anteayer", verbo: "fue", salto: -2 }]),
  );
  const correcto = i + caso.salto;
  return pregunta(rng, {
    subhabilidad: T5C,
    dificultad: d,
    enunciado: `Hoy es ${dia(i)}. ¿Qué día ${caso.verbo} ${caso.palabra}?`,
    enunciadoFacil: `Hoy es ${dia(i)}. ¿Qué día ${caso.verbo} ${caso.palabra}?`,
    respuesta: { tipo: "opcion", correcta: D(correcto), distractores: distractoresTexto(rng, D(correcto), [D(i), D(i + 1), D(i - 1), D(i + 2), D(i - 2)], 3) },
    pista: caso.salto > 0 ? "Cuenta los días hacia delante desde hoy." : "Cuenta los días hacia atrás desde hoy.",
    explicacion: `Si hoy es ${dia(i)}, ${caso.palabra} ${caso.verbo} ${dia(correcto)}.`,
    plantilla: clave(T5C, "hoy", caso.palabra, i),
  });
};

const filaDeDias: Generador = (rng, d) => {
  const i = entero(rng, 0, 6);
  const posicion = porD(d, 2, 1, 0);
  const fila = [dia(i), dia(i + 1), dia(i + 2)];
  const correcto = i + posicion;
  return pregunta(rng, {
    subhabilidad: T5C,
    dificultad: d,
    enunciado: "Los días están en orden. ¿Qué día falta?",
    enunciadoFacil: "Lee los días en orden. ¿Cuál falta?",
    imagen: { tipo: "serie", elementos: fila.map((texto, p) => (p === posicion ? { hueco: true } : { texto })) },
    respuesta: { tipo: "opcion", correcta: D(correcto), distractores: distractoresTexto(rng, D(correcto), [D(i + 3), D(i - 1), D(i + 4), D(i - 2)], 3) },
    pista: "Di en voz alta los días que ves y piensa cuál toca en el hueco.",
    explicacion: `En orden son ${listaY(fila)}. Falta el ${dia(correcto)}.`,
    plantilla: clave(T5C, "fila", i),
  });
};

const diasQueFaltan: Generador = (rng, d) => {
  const i = entero(rng, 0, 6);
  const n = porD(d, 1, 2, entero(rng, 3, 5));
  const j = i + n;
  return pregunta(rng, {
    subhabilidad: T5C,
    dificultad: d,
    enunciado: `Hoy es ${dia(i)}. ¿Cuántos días faltan para el ${dia(j)}?`,
    enunciadoFacil: `Hoy es ${dia(i)}. Cuenta los días hasta el ${dia(j)}.`,
    respuesta: respuestaNum(rng, d, n, [n + 1, n - 1, n + 2].filter((x) => x >= 1)),
    pista: "Cuenta los saltos de un día a otro, sin contar el día de hoy.",
    explicacion: `Del ${dia(i)} al ${dia(j)} ${n === 1 ? "hay 1 salto" : `hay ${n} saltos`}: ${n === 1 ? "falta 1 día" : `faltan ${n} días`}.`,
    plantilla: clave(T5C, "faltan", i, n),
  });
};

export const CURSO1: MapaGeneradores = {
  "NUM1-T1-a": [contarTodo, contarUnTipo, tocarGrupo],
  "NUM1-T1-b": [letraACifra, cifraALetra, escribirCifra, grupoPorPalabra],
  "NUM1-T1-c": [justoDespues, justoAntes, entreDos, filaConHueco],
  "NUM1-T2-a": [quienTieneMas, tocarMasMenos, tresNinos],
  "NUM1-T2-b": [cualMayor, completarComparacion, escribirMayor],
  "NUM1-T2-c": [ordenarLista, lugarEnOrden, tocarFilaOrdenada],
  "NUM1-T3-a": [sumarGrupos, sumarCategoria, tocarSuma],
  "NUM1-T3-b": [sumaDirecta, sumandoQueFalta, tresSumandos],
  "NUM1-T3-c": [problemaJuntar, tresPersonas],
  "NUM1-T4-a": [contarLosQueQuedan, tocarDibujoDeResta, tocarLoQueQueda],
  "NUM1-T4-b": [restaDirecta, sustraendoQueFalta, quitarDosVeces],
  "NUM1-T4-c": [problemaQuitar, problemaFaltan],
  "NUM1-T5-a": [tocarForma, nombrarForma, contarLados, tocarPorLados],
  "NUM1-T5-b": [tiraExtrema, balanza, cuerdas],
  "NUM1-T5-c": [diaVecino, hoyEs, filaDeDias, diasQueFaltan],
};
