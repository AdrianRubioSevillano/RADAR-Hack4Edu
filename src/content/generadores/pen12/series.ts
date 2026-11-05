// Series de dibujos y de números: PEN1-T1 y PEN2-T1. Todo se calcula en código y las
// series se comprueban: el periodo que ve el niño debe ser el único posible.
import { ContenidoError, barajar, distractoresNumericos, elegir, entero, muestra, pregunta } from "../../ayuda.ts";
import { COLORES, type ColorId, type Dificultad, type ElementoSerie, type FormaId, type Generador, type ObjetoId, type Pregunta } from "../../tipos.ts";
import type { Rng } from "../../../core/rng.ts";
import { tx } from "../../lengua.ts";
import { FORMAS_CLARAS, claveDibujo, colorDe, conArticuloDibujo, delDibujo, esFigura, etiquetaDibujo, nombreForma, opcionDibujo, porDificultad, type Dibujo, type Figura } from "./comun.ts";

const OBJETOS_SERIE: readonly ObjetoId[] = [
  "manzana", "pelota", "flor", "sol", "luna", "nube", "casa", "pez", "pajaro", "gato", "mariposa",
  "pato", "rana", "llave", "zapato", "paraguas", "libro", "lapiz", "taza", "hoja", "arbol", "barco",
];

function figuras(rng: Rng, n: number): Figura[] {
  const formas = muestra(rng, FORMAS_CLARAS, n);
  const colores = muestra(rng, COLORES, n);
  return formas.map((forma, i) => ({ forma, color: colores[i] as ColorId }));
}

function dibujos(rng: Rng, n: number): Dibujo[] {
  return rng() < 0.5 ? figuras(rng, n) : muestra(rng, OBJETOS_SERIE, n).map((objeto) => ({ objeto }));
}

// Dibujos del mismo tipo que los usados y que no están en la serie. Las figuras
// comparten forma o color con la respuesta para que haya que mirar las dos cosas.
function dibujosExtra(rng: Rng, correcta: Dibujo, usados: readonly Dibujo[], n: number): Dibujo[] {
  const claves = new Set(usados.map(claveDibujo));
  if (!esFigura(correcta)) {
    const libres = OBJETOS_SERIE.filter((objeto) => !claves.has(objeto));
    return muestra(rng, libres, n).map((objeto) => ({ objeto }));
  }
  const cerca: Figura[] = [];
  for (const color of barajar(rng, COLORES)) cerca.push({ forma: correcta.forma, color });
  for (const forma of barajar(rng, FORMAS_CLARAS)) cerca.push({ forma, color: correcta.color });
  const salida: Dibujo[] = [];
  for (const candidato of barajar(rng, cerca)) {
    const clave = claveDibujo(candidato);
    if (!claves.has(clave) && salida.length < n) {
      claves.add(clave);
      salida.push(candidato);
    }
  }
  return salida;
}

function distractoresDibujo(rng: Rng, correcta: Dibujo, usados: readonly Dibujo[], n: number): Dibujo[] {
  const clave = claveDibujo(correcta);
  const otros = usados.filter((d) => claveDibujo(d) !== clave);
  const propios = barajar(rng, otros).slice(0, n);
  return [...propios, ...dibujosExtra(rng, correcta, usados, n - propios.length)];
}

function aSerie(d: Dibujo): ElementoSerie {
  return esFigura(d) ? { forma: d.forma, color: d.color } : { objeto: d.objeto };
}

// Patrón por letras ("AAB"): cada letra distinta es un dibujo.
function indicesPatron(patron: string): number[] {
  const letras = [...new Set(patron)];
  return [...patron].map((letra) => letras.indexOf(letra));
}

function repetir(patron: string, elementos: readonly Dibujo[], longitud: number): Dibujo[] {
  const indices = indicesPatron(patron);
  return Array.from({ length: longitud }, (_, i) => elementos[indices[i % indices.length] as number] as Dibujo);
}

function textoCiclo(patron: string, elementos: readonly Dibujo[]): string {
  return repetir(patron, elementos, patron.length).map(etiquetaDibujo).join(", ");
}

// Menor periodo compatible con lo que se ve; `null` es el hueco.
export function periodoMinimo(claves: readonly (string | null)[]): number {
  for (let p = 1; p <= claves.length; p += 1) {
    const vistos = new Map<number, string>();
    const compatible = claves.every((c, i) => {
      if (c === null) return true;
      const previo = vistos.get(i % p);
      vistos.set(i % p, c);
      return previo === undefined || previo === c;
    });
    if (compatible) return p;
  }
  return claves.length;
}

function numeroDistintos(patron: string): number {
  return new Set(patron).size;
}

// Serie con el hueco al final. Se ven al menos dos vueltas completas del patrón.
function serieQueSigue(sub: string, patrones: readonly string[], rng: Rng, dificultad: Dificultad, opciones: number, curso: 1 | 2): Pregunta {
  const patron = elegir(rng, patrones);
  const p = patron.length;
  const elementos = dibujos(rng, numeroDistintos(patron));
  const visibles = entero(rng, 2 * p, Math.min(9, 3 * p - 1));
  const secuencia = repetir(patron, elementos, visibles + 1);
  const correcta = secuencia[visibles] as Dibujo;
  const vistos = secuencia.slice(0, visibles);
  if (periodoMinimo(vistos.map(claveDibujo)) !== p) throw new ContenidoError(`Periodo ambiguo en ${patron}`);
  const distractores = distractoresDibujo(rng, correcta, elementos, opciones - 1);
  return pregunta(rng, {
    subhabilidad: sub,
    dificultad,
    enunciado: curso === 1 ? "Mira la serie. ¿Qué sigue?" : tx("Mira bien la serie de dibujos. ¿Cuál debe ir en el hueco del final?", "Regarde bien la suite de dessins. Lequel doit aller dans le trou à la fin ?"),
    enunciadoFacil: tx("Mira la fila. ¿Qué va al final?", "Regarde la file. Qu'est-ce qui va à la fin ?"),
    imagen: { tipo: "serie", elementos: [...vistos.map(aSerie), { hueco: true }] },
    respuesta: { tipo: "imagen", correcta: opcionDibujo(correcta), distractores: distractores.map(opcionDibujo) },
    pista: tx("Busca el trozo que se repite, siempre en el mismo orden.", "Cherche le morceau qui se répète, toujours dans le même ordre."),
    explicacion: tx(
      `El trozo que se repite es: ${textoCiclo(patron, elementos)}. Por eso ahora toca ${conArticuloDibujo(correcta)}.`,
      `Le morceau qui se répète est : ${textoCiclo(patron, elementos)}. C'est pour ça qu'il faut maintenant ${conArticuloDibujo(correcta)}.`,
    ),
  });
}

// Serie con un hueco dentro. `desde` es la primera casilla donde puede estar.
function serieConHueco(sub: string, patrones: readonly string[], rng: Rng, dificultad: Dificultad, opciones: number, desde: number, curso: 1 | 2): Pregunta {
  const patron = elegir(rng, patrones);
  const p = patron.length;
  const elementos = dibujos(rng, numeroDistintos(patron));
  const longitud = entero(rng, 2 * p + 1, Math.min(10, 3 * p));
  const secuencia = repetir(patron, elementos, longitud);
  const claves = secuencia.map(claveDibujo);
  const posiciones = Array.from({ length: longitud - 1 }, (_, i) => i).filter((i) => i >= desde && periodoMinimo(claves.map((c, j) => (j === i ? null : c))) === p);
  const hueco = elegir(rng, posiciones);
  const correcta = secuencia[hueco] as Dibujo;
  const distractores = distractoresDibujo(rng, correcta, elementos, opciones - 1);
  return pregunta(rng, {
    subhabilidad: sub,
    dificultad,
    enunciado: curso === 1 ? "Falta un dibujo en la serie. ¿Cuál va en el hueco?" : tx("En la serie falta un dibujo. ¿Cuál debe ir en el hueco?", "Il manque un dessin dans la suite. Lequel doit aller dans le trou ?"),
    enunciadoFacil: tx("Falta un dibujo. ¿Cuál va en el hueco?", "Il manque un dessin. Lequel va dans le trou ?"),
    imagen: { tipo: "serie", elementos: secuencia.map((d, i): ElementoSerie => (i === hueco ? { hueco: true } : aSerie(d))) },
    respuesta: { tipo: "imagen", correcta: opcionDibujo(correcta), distractores: distractores.map(opcionDibujo) },
    pista: tx("Mira qué hay justo antes y justo después del hueco.", "Regarde ce qu'il y a juste avant et juste après le trou."),
    explicacion: tx(
      `El trozo que se repite es: ${textoCiclo(patron, elementos)}. En el hueco va ${conArticuloDibujo(correcta)}.`,
      `Le morceau qui se répète est : ${textoCiclo(patron, elementos)}. Dans le trou, il faut ${conArticuloDibujo(correcta)}.`,
    ),
  });
}

// ---------- 1.º: patrones ----------
const PATRONES_1: Readonly<Record<Dificultad, readonly string[]>> = {
  1: ["AB"],
  2: ["ABC", "AAB", "ABB"],
  3: ["AABB", "ABAC", "AABC", "ABCD"],
};

const OPCIONES_1: Readonly<Record<Dificultad, number>> = { 1: 3, 2: 3, 3: 4 };
const DESDE_1: Readonly<Record<Dificultad, number>> = { 1: 2, 2: 1, 3: 0 };

const queSigue1: Generador = (rng, d) => serieQueSigue("PEN1-T1-a", PATRONES_1[d], rng, d, OPCIONES_1[d], 1);
const completarHueco1: Generador = (rng, d) => serieConHueco("PEN1-T1-b", PATRONES_1[d], rng, d, OPCIONES_1[d], DESDE_1[d], 1);

// ---------- 2.º: series con figuras ----------
const SUB_FIGURAS = "PEN2-T1-b";
const PATRONES_2_FACIL = ["ABC", "AAB", "ABB"] as const;
const PATRONES_2_MEDIA = ["AABB", "ABAC", "AABC", "ABCD", "ABBC"] as const;

const figuraSigue2 = (patrones: readonly string[]): Generador => (rng, d) => serieQueSigue(SUB_FIGURAS, patrones, rng, d, 4, 2);
const figuraHueco2 = (patrones: readonly string[], desde: number): Generador => (rng, d) => serieConHueco(SUB_FIGURAS, patrones, rng, d, 4, desde, 2);

// Forma y color cambian cada uno a su ritmo: hay que seguir las dos cosas.
const dobleRitmo: Generador = (rng, dificultad) => {
  const formasPrimero = rng() < 0.5;
  const nFormas = formasPrimero ? 2 : 3;
  const nColores = formasPrimero ? 3 : 2;
  const formas: readonly FormaId[] = muestra(rng, FORMAS_CLARAS, nFormas);
  const colores: readonly ColorId[] = muestra(rng, COLORES, nColores);
  const visibles = entero(rng, 7, 8);
  const figura = (i: number): Figura => ({ forma: formas[i % nFormas] as FormaId, color: colores[i % nColores] as ColorId });
  const secuencia = Array.from({ length: visibles }, (_, i) => figura(i));
  const correcta = figura(visibles);
  const otraForma = formas.find((x) => x !== correcta.forma) as FormaId;
  const otroColor = colores.find((x) => x !== correcta.color) as ColorId;
  const distractores: readonly Figura[] = [
    { forma: correcta.forma, color: otroColor },
    { forma: otraForma, color: correcta.color },
    { forma: otraForma, color: otroColor },
  ];
  const textoFormas = formas.map(nombreForma).join(", ");
  const textoColores = colores.map((color) => colorDe(color, false)).join(", ");
  return pregunta(rng, {
    subhabilidad: SUB_FIGURAS,
    dificultad,
    enunciado: tx("En esta serie la forma y el color cambian cada uno a su ritmo. ¿Qué figura debe ir en el hueco?", "Dans cette suite, la forme et la couleur changent chacune à leur rythme. Quelle figure doit aller dans le trou ?"),
    enunciadoFacil: tx("La forma cambia. El color también cambia. ¿Qué figura va en el hueco?", "La forme change. La couleur change aussi. Quelle figure va dans le trou ?"),
    imagen: { tipo: "serie", elementos: [...secuencia.map(aSerie), { hueco: true }] },
    respuesta: { tipo: "imagen", correcta: opcionDibujo(correcta), distractores: distractores.map(opcionDibujo) },
    pista: tx("Mira primero solo las formas. Después mira solo los colores.", "Regarde d'abord seulement les formes. Ensuite, regarde seulement les couleurs."),
    explicacion: tx(
      `Las formas se repiten así: ${textoFormas}. Los colores se repiten así: ${textoColores}. Por eso toca ${conArticuloDibujo(correcta)}.`,
      `Les formes se répètent comme ça : ${textoFormas}. Les couleurs se répètent comme ça : ${textoColores}. C'est pour ça qu'il faut ${conArticuloDibujo(correcta)}.`,
    ),
  });
};

// Cada vez hay un dibujo más antes del separador: A B, A A B, A A A B.
const serieCreciente: Generador = (rng, dificultad) => {
  const [a, b, ...extras] = dibujos(rng, 4) as [Dibujo, Dibujo, Dibujo, Dibujo];
  const completa: readonly Dibujo[] = [a, b, a, a, b, a, a, a, b];
  const huecoFinal = rng() < 0.5;
  const hueco = huecoFinal ? 8 : elegir(rng, [3, 4, 6, 7]);
  const correcta = completa[hueco] as Dibujo;
  const visibles = huecoFinal ? completa.slice(0, 8) : completa;
  const elementos = visibles.map((d, i): ElementoSerie => (i === hueco ? { hueco: true } : aSerie(d)));
  const otro = claveDibujo(correcta) === claveDibujo(a) ? b : a;
  return pregunta(rng, {
    subhabilidad: SUB_FIGURAS,
    dificultad,
    enunciado: tx(
      `En esta serie, cada vez hay un dibujo más antes ${delDibujo(b)}. ¿Cuál debe ir en el hueco?`,
      `Dans cette suite, il y a chaque fois un dessin de plus avant ${conArticuloDibujo(b)}. Lequel doit aller dans le trou ?`,
    ),
    enunciadoFacil: tx(
      `Cada vez hay uno más antes ${delDibujo(b)}. ¿Qué va en el hueco?`,
      `Chaque fois, il y en a un de plus avant ${conArticuloDibujo(b)}. Qu'est-ce qui va dans le trou ?`,
    ),
    imagen: { tipo: "serie", elementos: huecoFinal ? [...elementos, { hueco: true }] : elementos },
    respuesta: { tipo: "imagen", correcta: opcionDibujo(correcta), distractores: [otro, ...extras].map(opcionDibujo) },
    pista: tx("Cuenta cuántos dibujos iguales hay en cada grupo: 1, 2…", "Compte combien de dessins pareils il y a dans chaque groupe : 1, 2…"),
    explicacion: tx(
      `Primero hay 1 ${etiquetaDibujo(a)}, después 2 y después 3, y cada grupo acaba en ${conArticuloDibujo(b)}. Por eso en el hueco va ${conArticuloDibujo(correcta)}.`,
      `D'abord, il y a 1 ${etiquetaDibujo(a)}, puis 2, puis 3, et chaque groupe finit par ${conArticuloDibujo(b)}. C'est pour ça que dans le trou, il faut ${conArticuloDibujo(correcta)}.`,
    ),
  });
};

// Sin dibujar toda la serie: ¿qué hay en el lugar N?
const lugarLejano: Generador = (rng, dificultad) => {
  const patron = elegir(rng, ["ABC", "ABCD"]);
  const p = patron.length;
  const elementos = dibujos(rng, p);
  const visibles = repetir(patron, elementos, 2 * p);
  const lugar = entero(rng, 2 * p + 2, 3 * p + 2);
  const correcta = elementos[(lugar - 1) % p] as Dibujo;
  const distractores = distractoresDibujo(rng, correcta, elementos, 3);
  return pregunta(rng, {
    subhabilidad: SUB_FIGURAS,
    dificultad,
    enunciado: tx(`La serie sigue siempre igual. ¿Qué dibujo habrá en el lugar número ${lugar}?`, `La suite continue toujours pareil. Quel dessin y aura-t-il à la place numéro ${lugar} ?`),
    enunciadoFacil: tx(`La serie sigue igual. Cuenta hasta el lugar ${lugar}. ¿Qué dibujo hay?`, `La suite continue pareil. Compte jusqu'à la place ${lugar}. Quel dessin y a-t-il ?`),
    imagen: { tipo: "serie", elementos: visibles.map(aSerie) },
    respuesta: { tipo: "imagen", correcta: opcionDibujo(correcta), distractores: distractores.map(opcionDibujo) },
    pista: tx(`Se repiten ${p} dibujos. Sigue contando desde el último dibujo que ves.`, `${p} dessins se répètent. Continue à compter à partir du dernier dessin que tu vois.`),
    explicacion: tx(
      `Se repite ${textoCiclo(patron, elementos)}. Si sigues contando, en el lugar ${lugar} cae ${conArticuloDibujo(correcta)}.`,
      `Ce qui se répète, c'est : ${textoCiclo(patron, elementos)}. Si tu continues à compter, à la place ${lugar}, il y a ${conArticuloDibujo(correcta)}.`,
    ),
  });
};

const conFiguras = porDificultad({
  1: [figuraSigue2(PATRONES_2_FACIL), figuraHueco2(PATRONES_2_FACIL, 1)],
  2: [figuraSigue2(PATRONES_2_MEDIA), figuraHueco2(PATRONES_2_MEDIA, 1)],
  3: [dobleRitmo, serieCreciente, lugarLejano],
});

// ---------- 2.º: series con números ----------
const SUB_NUMEROS = "PEN2-T1-a";

function comoSerie(valores: readonly number[], hueco?: number): ElementoSerie[] {
  return valores.map((v, i): ElementoSerie => (i === hueco ? { hueco: true } : { texto: String(v) }));
}

function leerSerie(valores: readonly number[], hueco?: number): string {
  return valores.map((v, i) => (i === hueco ? tx("hueco", "trou") : String(v))).join(", ");
}

// Pregunta por el número que sigue, a veces para escribirlo y a veces para elegirlo.
function preguntaNumero(rng: Rng, dificultad: Dificultad, valores: readonly number[], correcta: number, candidatos: readonly number[], pista: string, explicacion: string): Pregunta {
  const escrita = rng() < 0.5;
  return pregunta(rng, {
    subhabilidad: SUB_NUMEROS,
    dificultad,
    enunciado: tx(`Mira la serie: ${leerSerie(valores)}. ¿Qué número sigue?`, `Regarde la suite : ${leerSerie(valores)}. Quel nombre vient après ?`),
    enunciadoFacil: tx(`Mira los números: ${leerSerie(valores)}. ¿Cuál va después?`, `Regarde les nombres : ${leerSerie(valores)}. Lequel vient après ?`),
    imagen: { tipo: "serie", elementos: [...comoSerie(valores), { hueco: true }] },
    respuesta: escrita ? { tipo: "numero", valor: correcta } : { tipo: "opcion", correcta: String(correcta), distractores: distractoresNumericos(rng, correcta, candidatos, 3).map(String) },
    pista,
    explicacion,
  });
}

function preguntaHuecoNumero(rng: Rng, dificultad: Dificultad, valores: readonly number[], hueco: number, candidatos: readonly number[], pista: string, explicacion: string): Pregunta {
  const correcta = valores[hueco] as number;
  const escrita = rng() < 0.5;
  return pregunta(rng, {
    subhabilidad: SUB_NUMEROS,
    dificultad,
    enunciado: tx(`Mira la serie: ${leerSerie(valores, hueco)}. ¿Qué número va en el hueco?`, `Regarde la suite : ${leerSerie(valores, hueco)}. Quel nombre va dans le trou ?`),
    enunciadoFacil: tx(`Mira los números: ${leerSerie(valores, hueco)}. ¿Cuál falta?`, `Regarde les nombres : ${leerSerie(valores, hueco)}. Lequel manque ?`),
    imagen: { tipo: "serie", elementos: comoSerie(valores, hueco) },
    respuesta: escrita ? { tipo: "numero", valor: correcta } : { tipo: "opcion", correcta: String(correcta), distractores: distractoresNumericos(rng, correcta, candidatos, 3).map(String) },
    pista,
    explicacion,
  });
}

function progresion(inicio: number, paso: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => inicio + i * paso);
}

function inicioPara(rng: Rng, paso: number, n: number): number {
  const absoluto = Math.abs(paso);
  const redondo = absoluto === 5 || absoluto === 10;
  const alcance = absoluto * (n - 1);
  if (paso > 0) {
    const inicio = entero(rng, 1, 100 - alcance - absoluto);
    return redondo ? Math.max(absoluto, inicio - (inicio % absoluto)) : inicio;
  }
  const inicio = entero(rng, alcance + absoluto + 1, 100);
  return redondo ? inicio - (inicio % absoluto) : inicio;
}

const verbo = (paso: number): string => (paso > 0 ? tx("más", "de plus") : tx("menos", "de moins"));
const signo = (paso: number): string => (paso > 0 ? "+" : "−");

function cadaNumero(a: number, paso: number, desde: number, correcta: number): string {
  const cuenta = `${desde} ${signo(paso)} ${a} = ${correcta}`;
  return tx(`Cada número tiene ${a} ${verbo(paso)} que el anterior: ${cuenta}.`, `Chaque nombre a ${a} ${verbo(paso)} que celui d'avant : ${cuenta}.`);
}

const siguienteConstante = (pasos: readonly number[]): Generador => (rng, d) => {
  const paso = elegir(rng, pasos);
  const n = 5;
  const valores = progresion(inicioPara(rng, paso, n + 1), paso, n);
  const ultimo = valores[n - 1] as number;
  const correcta = ultimo + paso;
  const a = Math.abs(paso);
  return preguntaNumero(
    rng, d, valores, correcta,
    [ultimo + Math.sign(paso), ultimo - paso, correcta + paso, ultimo, correcta + Math.sign(paso)],
    tx("Mira cuánto cambia de un número al siguiente.", "Regarde de combien ça change d'un nombre au suivant."),
    cadaNumero(a, paso, ultimo, correcta),
  );
};

const huecoConstante = (pasos: readonly number[]): Generador => (rng, d) => {
  const paso = elegir(rng, pasos);
  const n = 6;
  const valores = progresion(inicioPara(rng, paso, n), paso, n);
  const hueco = entero(rng, 1, n - 2);
  const correcta = valores[hueco] as number;
  const antes = valores[hueco - 1] as number;
  const a = Math.abs(paso);
  return preguntaHuecoNumero(
    rng, d, valores, hueco,
    [antes, valores[hueco + 1] as number, correcta + Math.sign(paso), correcta - Math.sign(paso)],
    tx("Mira cuánto cambia entre los números que están juntos.", "Regarde de combien ça change entre les nombres qui sont côte à côte."),
    cadaNumero(a, paso, antes, correcta),
  );
};

function textoRegla(paso: number): string {
  const a = Math.abs(paso);
  return tx(`${paso > 0 ? "Suma" : "Resta"} ${a} cada vez`, `${paso > 0 ? "Ajoute" : "Enlève"} ${a} à chaque fois`);
}

// Pide la regla, no el número.
const reglaDeLaSerie: Generador = (rng, dificultad) => {
  const paso = elegir(rng, [2, 3, 4, 5, 10, -2, -3, -5, -10]);
  const n = 5;
  const valores = progresion(inicioPara(rng, paso, n), paso, n);
  const a = Math.abs(paso);
  const s = Math.sign(paso);
  const distractores = [textoRegla(-paso), textoRegla(s * (a + 1)), a > 2 ? textoRegla(s * (a - 1)) : textoRegla(s * (a + 2))];
  return pregunta(rng, {
    subhabilidad: SUB_NUMEROS,
    dificultad,
    enunciado: tx(`Mira la serie: ${leerSerie(valores)}. ¿Qué regla sigue?`, `Regarde la suite : ${leerSerie(valores)}. Quelle règle suit-elle ?`),
    enunciadoFacil: tx(`Mira los números: ${leerSerie(valores)}. ¿Cómo cambian?`, `Regarde les nombres : ${leerSerie(valores)}. Comment changent-ils ?`),
    imagen: { tipo: "serie", elementos: comoSerie(valores) },
    respuesta: { tipo: "opcion", correcta: textoRegla(paso), distractores },
    pista: tx("Compara el primer número con el segundo. ¿Sube o baja? ¿Cuánto?", "Compare le premier nombre et le deuxième. Ça monte ou ça descend ? De combien ?"),
    explicacion: tx(
      `De ${valores[0] as number} a ${valores[1] as number} ${paso > 0 ? "sube" : "baja"} ${a}, y siempre pasa lo mismo. La regla es: ${textoRegla(paso).toLowerCase()}.`,
      `De ${valores[0] as number} à ${valores[1] as number}, ça ${paso > 0 ? "monte" : "descend"} de ${a}, et c'est toujours pareil. La règle est : ${textoRegla(paso).toLowerCase()}.`,
    ),
  });
};

// Dos pasos que se alternan. Se ven seis números: a, b, a, b, a, y ahora toca b.
const alternante: Generador = (rng, d) => {
  const sube = rng() < 0.6;
  const a = sube ? entero(rng, 1, 4) : entero(rng, 3, 5);
  const b = sube ? entero(rng, a + 1, 6) : -entero(rng, 1, a - 1);
  const valores = [entero(rng, 1, 20)];
  for (let i = 0; i < 5; i += 1) valores.push((valores[i] as number) + (i % 2 === 0 ? a : b));
  const ultimo = valores[5] as number;
  const correcta = ultimo + b;
  const textoB = b > 0 ? tx(`suma ${b}`, `on ajoute ${b}`) : tx(`resta ${-b}`, `on enlève ${-b}`);
  return preguntaNumero(
    rng, d, valores, correcta,
    [ultimo + a, ultimo + 1, correcta + 1, ultimo],
    tx("Mira qué pasa del primero al segundo y del segundo al tercero. Son dos cambios distintos.", "Regarde ce qui se passe du premier au deuxième, puis du deuxième au troisième. Ce sont deux changements différents."),
    tx(
      `Primero suma ${a}, luego ${textoB}, y vuelve a empezar. Ahora toca: ${ultimo} ${b > 0 ? "+" : "−"} ${Math.abs(b)} = ${correcta}.`,
      `D'abord on ajoute ${a}, puis ${textoB}, et on recommence. Maintenant, il faut faire : ${ultimo} ${b > 0 ? "+" : "−"} ${Math.abs(b)} = ${correcta}.`,
    ),
  );
};

// Cada salto es uno mayor que el anterior.
const saltoCreciente: Generador = (rng, d) => {
  const primero = entero(rng, 1, 3);
  const valores = [entero(rng, 1, 12)];
  for (let i = 0; i < 4; i += 1) valores.push((valores[i] as number) + primero + i);
  const ultimo = valores[4] as number;
  const salto = primero + 4;
  const correcta = ultimo + salto;
  return preguntaNumero(
    rng, d, valores, correcta,
    [ultimo + salto - 1, ultimo + salto + 1, ultimo + 1, ultimo + primero],
    tx("Calcula cuánto sube cada vez. ¿Siempre sube lo mismo?", "Calcule de combien ça monte chaque fois. Est-ce que ça monte toujours pareil ?"),
    tx(
      `Cada vez sube uno más: +${primero}, +${primero + 1}, +${primero + 2}, +${primero + 3}. Ahora toca +${salto}: ${ultimo} + ${salto} = ${correcta}.`,
      `Chaque fois, ça monte de 1 de plus : +${primero}, +${primero + 1}, +${primero + 2}, +${primero + 3}. Maintenant, il faut faire +${salto} : ${ultimo} + ${salto} = ${correcta}.`,
    ),
  );
};

// Cada número es el doble del anterior.
const dobles: Generador = (rng, d) => {
  const inicio = elegir(rng, [1, 2, 3, 5, 6]);
  const n = inicio > 3 ? 4 : 5;
  const valores = Array.from({ length: n }, (_, i) => inicio * 2 ** i);
  const ultimo = valores[n - 1] as number;
  const anterior = valores[n - 2] as number;
  const correcta = ultimo * 2;
  return preguntaNumero(
    rng, d, valores, correcta,
    [ultimo + (ultimo - anterior) / 2, ultimo + 2, ultimo + anterior + 1, correcta + 2],
    tx("¿Qué le pasa a cada número para convertirse en el siguiente?", "Que se passe-t-il pour que chaque nombre devienne le suivant ?"),
    tx(`Cada número es el doble del anterior: ${ultimo} + ${ultimo} = ${correcta}.`, `Chaque nombre est le double de celui d'avant : ${ultimo} + ${ultimo} = ${correcta}.`),
  );
};

const conNumeros = porDificultad({
  1: [siguienteConstante([1, 2, 5, 10])],
  2: [siguienteConstante([3, 4, -1, -2, -5, -10]), huecoConstante([2, 3, 4, 5, 10, -2, -5, -10]), reglaDeLaSerie],
  3: [alternante, saltoCreciente, dobles, huecoConstante([-3, -4, 6, 7])],
});

export const GENERADORES_SERIES = {
  "PEN1-T1-a": [queSigue1],
  "PEN1-T1-b": [completarHueco1],
  "PEN2-T1-a": [conNumeros],
  "PEN2-T1-b": [conFiguras],
} as const;
