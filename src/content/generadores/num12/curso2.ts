// NUM de 2.º de primaria: números hasta 100, sumas y restas, dinero, hora y calendario,
// y multiplicar como suma repetida.
import type { Rng } from "../../../core/rng.ts";
import { barajar, elegir, entero, muestra, nombres, pregunta, type RespuestaBorrador } from "../../ayuda.ts";
import { tx } from "../../lengua.ts";
import type { Dificultad, Generador, Imagen, MapaGeneradores } from "../../tipos.ts";
import {
  BOTELLA, CUADERNO, CUBO_AGUA, FLOR, GORRO, HUEVO, LAPIZ, LIBRO, MANZANA, MOCHILA, NARANJA, PAGINA, PAJARO, PARAGUAS, PELOTA, PERSONA, PIEDRA, SEMILLA, SILLA, TAZA,
  ayudaBloques, bloques, cant, clave, cuantos, decUni, decenasTexto, descomponer, dia, dibujo, distractoresTexto, el, en, enLetras, etiquetaMonedas, grupos, hora, horaCiclo,
  horaDigital, imagenMonedas, listaY, los, mayus, mes, monedasDeDificultad, opcionNumerica, ordenarMonedas, porD, porR, quedan, reloj, respuestaNum, separados, serieDeTextos, suma,
  dePl, leU, pl, sg, un, unU, unidadesTexto, variantesMonedas, type Unidad,
} from "./comun.ts";

interface OpcionImagen {
  readonly texto: string;
  readonly imagen: Imagen;
}

// Aquí las monedas tienen valores distintos: «cuesta 16 monedas» se confundiría con 16 monedas sueltas.
const valorDinero = (n: number): string => String(n);

// Le, la, l': en francés el mes y el tamaño se dicen con su propia concordancia.
const grandPetit = (pide: string): string => (pide === "mayor" ? "grand" : "petit");
const tuichaMichi = (pide: string): string => (pide === "mayor" ? "tuichavéva" : "michĩvéva");
const deM = (i: number): string => (/^[aeio]/.test(mes(i)) ? `d'${mes(i)}` : `de ${mes(i)}`);

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
    enunciado: tx(`¿Qué número forman estos bloques? ${ayudaBloques()}`, `Quel nombre forment ces blocs ? ${ayudaBloques()}`, `Mba'e papapýpa ojapo ko'ã bloque? ${ayudaBloques()}`),
    enunciadoFacil: tx(`Mira los bloques. ${ayudaBloques()} ¿Qué número es?`, `Regarde les blocs. ${ayudaBloques()} Quel est ce nombre ?`, `Emañá bloque-re. ${ayudaBloques()} Mba'e papapýpa?`),
    imagen: bloques(t, u),
    respuesta: respuestaNum(rng, d, n, candidatos.filter((x) => x > 0)),
    pista: tx("Cuenta los bloques largos de 10 en 10. Después sigue con los sueltos de 1 en 1.", `Compte les blocs longs de 10 en 10. Ensuite, continue avec les blocs seuls de 1 en 1.`, `Epapa bloque puku 10 ha 10. Upéi epapa bloque michĩ 1 ha 1.`),
    explicacion: d === 3
      ? tx(`Con ${unidadesTexto(u)} formas 1 decena más y te ${unidad(u) === 1 ? "queda" : "quedan"} ${unidadesTexto(unidad(u))}. Son ${decUni(t + 1, unidad(u))}: el ${n}.`, `Avec ${unidadesTexto(u)}, tu fais 1 dizaine de plus et il reste ${unidadesTexto(unidad(u))}. Ce sont ${decUni(t + 1, unidad(u))} : le nombre ${n}.`, `${unidadesTexto(u)} reheve rejapo 1 decena ha opyta ${unidadesTexto(unidad(u))}. Oĩ ${decUni(t + 1, unidad(u))}: papapy ${n}.`)
      : tx(`${decenasTexto(t)} ${t === 1 ? "es" : "son"} ${t * 10} y ${unidadesTexto(u)} más dan ${n}.`, `${decenasTexto(t)}, c'est ${t * 10}, et ${unidadesTexto(u)} de plus, ça fait ${n}.`, `${decenasTexto(t)} ha'e ${t * 10}. ${unidadesTexto(u)} reheve ha'e ${n}.`),
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
      enunciado: tx(`¿Cómo se descompone el número ${n}?`, `Comment se décompose le nombre ${n} ?`, `Mba'éicha oñemboja'o papapy ${n}?`),
      enunciadoFacil: tx(`Mira el número ${n}. ¿Cuántas decenas y unidades lo forman?`, `Regarde le nombre ${n}. Combien de dizaines et d'unités a-t-il ?`, `Emañá papapy ${n}-re. Mboy decena ha unidad oguereko?`),
      respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, descomposicionesFalsas(t, u), 3) },
      pista: tx("La cifra de la izquierda dice las decenas. La de la derecha dice las unidades.", `Le chiffre de gauche donne les dizaines. Celui de droite donne les unités.`, `Papapy asu gotyo he'i decena. Papapy akatúa gotyo he'i unidad.`),
      explicacion: tx(`En el ${n}, el ${t} está en las decenas y el ${u} en las unidades.`, `Dans ${n}, le ${t} est aux dizaines et le ${u} aux unités.`, `Papapy ${n}-pe, ${t} oĩ decena-pe ha ${u} oĩ unidad-pe.`),
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
    enunciado: tx(`En el número ${n}, ¿qué cifra está en el lugar de las ${lugar}?`, `Dans le nombre ${n}, quel chiffre est à la place des ${d === 1 ? "dizaines" : "unités"} ?`, `Papapy ${n}-pe, mba'e papapýpa oĩ ${d === 1 ? "decena" : "unidad"} rendápe?`),
    enunciadoFacil: tx(`Mira el número ${n}. ¿Qué cifra marca las ${lugar}?`, `Regarde le nombre ${n}. Quel chiffre indique les ${d === 1 ? "dizaines" : "unités"} ?`, `Emañá papapy ${n}-re. Mba'e papapýpa he'i ${d === 1 ? "decena" : "unidad"}?`),
    respuesta: opcionNumerica(rng, correcta, [otra, n, correcta + 1, correcta - 1].filter((x) => x > 0)),
    pista: tx("En un número de dos cifras, las decenas van a la izquierda y las unidades a la derecha.", `Dans un nombre de deux chiffres, les dizaines sont à gauche et les unités à droite.`, `Mokõi papapy oĩvo, decena oĩ asu gotyo ha unidad akatúa gotyo.`),
    explicacion: tx(`En el ${n}, el ${t} son las decenas y el ${u} son las unidades.`, `Dans ${n}, le ${t} donne les dizaines et le ${u} donne les unités.`, `Papapy ${n}-pe, ${t} ha'e decena ha ${u} ha'e unidad.`),
    plantilla: clave(T1A, "lugar", lugar, n),
  });
};

const componerTexto: Generador = (rng, d) => {
  const t = entero(rng, 1, 8);
  const u = d === 3 ? elegir(rng, [0, 10, 11, 12, 13, 14, 15]) : entero(rng, 1, 9);
  const n = t * 10 + u;
  const partes = d === 1 ? tx(`${decenasTexto(t)} y ${unidadesTexto(u)}`, `${decenasTexto(t)} et ${unidadesTexto(u)}`, `${decenasTexto(t)} ha ${unidadesTexto(u)}`) : tx(`${unidadesTexto(u)} y ${decenasTexto(t)}`, `${unidadesTexto(u)} et ${decenasTexto(t)}`, `${unidadesTexto(u)} ha ${decenasTexto(t)}`);
  const alReves = u < 10 ? u * 10 + t : t * 10 + unidad(u);
  return pregunta(rng, {
    subhabilidad: T1A,
    dificultad: d,
    enunciado: tx(`¿Qué número forman ${partes}?`, `Quel nombre forment ${partes} ?`, `Mba'e papapýpa ojapo ${partes}?`),
    enunciadoFacil: tx(`Junta ${partes}. ¿Qué número sale?`, `Mets ensemble ${partes}. Quel nombre obtiens-tu ?`, `Embojoaju ${partes}. Mba'e papapýpa osẽ?`),
    respuesta: respuestaNum(rng, d, n, [alReves, t + u, n + 10, n - 10, n + 1].filter((x) => x > 0)),
    pista: tx("Mira bien qué número son las decenas, aunque esté escrito al final.", `Regarde bien quel nombre donne les dizaines, même s'il est écrit à la fin.`, `Emañá porã mba'e papapýpa ha'e decena, ipaháme jepe.`),
    explicacion: tx(`${decenasTexto(t)} ${t === 1 ? "es" : "son"} ${t * 10}. ${t * 10} + ${u} = ${n}.`, `${decenasTexto(t)}, c'est ${t * 10}. ${t * 10} + ${u} = ${n}.`, `${decenasTexto(t)} ha'e ${t * 10}. ${t * 10} + ${u} = ${n}.`),
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
    enunciado: tx(`Toca los bloques que forman el número ${n}. ${ayudaBloques()}`, `Touche les blocs qui forment le nombre ${n}. ${ayudaBloques()}`, `Epoko bloque ojapóva papapy ${n}. ${ayudaBloques()}`),
    enunciadoFacil: tx(`Busca el número ${n}. ${ayudaBloques()} Toca los bloques.`, `Cherche le nombre ${n}. ${ayudaBloques()} Touche les blocs.`, `Eheka papapy ${n}. ${ayudaBloques()} Epoko bloque-re.`),
    respuesta: { tipo: "imagen", correcta: opcion(t, u), distractores: elegidas.map(([a, b]) => opcion(a, b)) },
    pista: tx("Mira cuántas decenas y cuántas unidades tiene el número.", `Regarde combien de dizaines et d'unités a le nombre.`, `Emañá mboy decena ha unidad oguereko papapy.`),
    explicacion: tx(`El ${n} tiene ${decUni(t, u)}.`, `Le nombre ${n} a ${decUni(t, u)}.`, `Papapy ${n} oguereko ${decUni(t, u)}.`),
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
    enunciado: tx(`¿Cómo se escribe con cifras «${palabra}»?`, `Comment s'écrit en chiffres « ${palabra} » ?`, `Mba'éicha ojehai papapýpe « ${palabra} »?`),
    enunciadoFacil: tx(`Lee: ${palabra}. ¿Qué número es?`, `Lis : ${palabra}. Quel est ce nombre ?`, `Emoñe'ẽ: ${palabra}. Mba'e papapýpa?`),
    respuesta: opcionNumerica(rng, n, confusiones(n)),
    pista: tx("Piensa primero en las decenas y después en las unidades.", `Pense d'abord aux dizaines, puis aux unités.`, `Epensa raẽ decena-re. Upéi unidad-re.`),
    explicacion: tx(`«${mayus(palabra)}» tiene ${decUni(decena(n), unidad(n))}: se escribe ${n}.`, `« ${mayus(palabra)} » a ${decUni(decena(n), unidad(n))} : ça s'écrit ${n}.`, `« ${mayus(palabra)} » oguereko ${decUni(decena(n), unidad(n))}: ojehai ${n}.`),
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
    enunciado: tx(`¿Cómo se lee el número ${n}?`, `Comment se lit le nombre ${n} ?`, `Mba'éicha oñemoñe'ẽ papapy ${n}?`),
    enunciadoFacil: tx(`Mira el número ${n}. ¿Cómo se lee?`, `Regarde le nombre ${n}. Comment se lit-il ?`, `Emañá papapy ${n}-re. Mba'éicha oñemoñe'ẽ?`),
    respuesta: { tipo: "opcion", correcta: palabra, distractores: palabrasFalsas(rng, n) },
    pista: tx("Lee primero la cifra de las decenas.", `Lis d'abord le chiffre des dizaines.`, `Emoñe'ẽ raẽ decena.`),
    explicacion: tx(`El ${n} se lee «${palabra}».`, `Le nombre ${n} se lit « ${palabra} ».`, `Papapy ${n} oñemoñe'ẽ « ${palabra} ».`),
    plantilla: clave(T1B, "leer", n),
  });
};

const bloquesALetras: Generador = (rng, d) => {
  const n = numeroParaLeer(rng, d);
  const palabra = enLetras(n);
  return pregunta(rng, {
    subhabilidad: T1B,
    dificultad: d,
    enunciado: tx(`¿Cómo se lee el número de estos bloques? ${ayudaBloques()}`, `Comment se lit le nombre de ces blocs ? ${ayudaBloques()}`, `Mba'éicha oñemoñe'ẽ ko'ã bloque papapy? ${ayudaBloques()}`),
    enunciadoFacil: tx(`Mira los bloques. ${ayudaBloques()} ¿Cómo se lee el número?`, `Regarde les blocs. ${ayudaBloques()} Comment se lit le nombre ?`, `Emañá bloque-re. ${ayudaBloques()} Mba'éicha oñemoñe'ẽ papapy?`),
    imagen: bloques(decena(n), unidad(n)),
    respuesta: { tipo: "opcion", correcta: palabra, distractores: palabrasFalsas(rng, n) },
    pista: tx("Primero averigua qué número es. Después léelo.", `Trouve d'abord quel est ce nombre. Ensuite, lis-le.`, `Ejuhu raẽ mba'e papapýpa. Upéi emoñe'ẽ.`),
    explicacion: tx(`Los bloques forman el ${n}, que se lee «${palabra}».`, `Les blocs forment le nombre ${n}, qui se lit « ${palabra} ».`, `Bloque ojapo papapy ${n}, oñemoñe'ẽva « ${palabra} ».`),
    plantilla: clave(T1B, "bloques", n),
  });
};

const dictado: Generador = (rng, d) => {
  const n = d === 3 && rng() < 0.15 ? 100 : numeroParaLeer(rng, d);
  const palabra = enLetras(n);
  return pregunta(rng, {
    subhabilidad: T1B,
    dificultad: d,
    enunciado: tx(`Escribe con cifras: ${palabra}.`, `Écris en chiffres : ${palabra}.`, `Ehai papapýpe: ${palabra}.`),
    enunciadoFacil: tx(`Lee: ${palabra}. Escribe el número.`, `Lis : ${palabra}. Écris le nombre.`, `Emoñe'ẽ: ${palabra}. Ehai papapy.`),
    respuesta: { tipo: "numero", valor: n },
    pista: n === 100 ? tx("Es el número que va justo después del 99.", `C'est le nombre juste après 99.`, `Ha'e papapy oúva 99 rire.`) : tx("Piensa cuántas decenas y cuántas unidades dice la palabra.", `Pense au nombre de dizaines et d'unités que dit le mot.`, `Epensa mboy decena ha unidad he'i ñe'ẽ.`),
    explicacion: tx(`«${mayus(palabra)}» se escribe ${n}.`, `« ${mayus(palabra)} » s'écrit ${n}.`, `« ${mayus(palabra)} » ojehai ${n}.`),
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
    enunciado: tx(`¿Cuál de estos números es el ${pide}?`, `Lequel de ces nombres est le plus ${grandPetit(pide)} ?`, `Ko'ã papapy apytépe, mávapa ${tuichaMichi(pide)}?`),
    enunciadoFacil: tx(`Lee los números. ¿Cuál es el ${pide}?`, `Lis les nombres. Lequel est le plus ${grandPetit(pide)} ?`, `Emoñe'ẽ papapy. Mávapa ${tuichaMichi(pide)}?`),
    respuesta: { tipo: "opcion", correcta: String(correcta), distractores: valores.filter((v) => v !== correcta).map(String) },
    pista: tx("Mira primero las decenas. Si son iguales, mira las unidades.", `Regarde d'abord les dizaines. Si elles sont égales, regarde les unités.`, `Emañá raẽ decena-re. Ojojárõ, emañá unidad-re.`),
    explicacion: mismasDecenas
      ? tx(`Todos tienen ${decenasTexto(decena(correcta))}. Por las unidades, el ${pide} es el ${correcta}.`, `Tous ont ${decenasTexto(decena(correcta))}. D'après les unités, le plus ${grandPetit(pide)} est ${correcta}.`, `Opavave oguereko ${decenasTexto(decena(correcta))}. Unidad rupi, ${tuichaMichi(pide)} ha'e ${correcta}.`)
      : tx(`Compara primero las decenas y después las unidades. El ${pide} es el ${correcta}.`, `Compare d'abord les dizaines, puis les unités. Le plus ${grandPetit(pide)} est ${correcta}.`, `Embojoja raẽ decena, upéi unidad. ${mayus(tuichaMichi(pide))} ha'e ${correcta}.`),
    plantilla: clave(T1C, "cual", pide, ...[...valores].sort((a, b) => a - b)),
  });
};

const signos = () => ({ mayor: tx("> (mayor que)", "> (plus grand que)", "> (tuichave)"), menor: tx("< (menor que)", "< (plus petit que)", "< (michĩve)"), igual: tx("= (igual que)", "= (égal à)", "= (peteĩcha)") });

const signoEnHueco: Generador = (rng, d) => {
  const SIGNOS = signos();
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
  const motivo = a === b ? tx("Son el mismo número.", `C'est le même nombre.`, `Ha'e papapy peteĩcha.`) : tx(`El ${Math.max(a, b)} es mayor que el ${Math.min(a, b)}.`, `${Math.max(a, b)} est plus grand que ${Math.min(a, b)}.`, `${Math.max(a, b)} tuichave ${Math.min(a, b)}-gui.`);
  return pregunta(rng, {
    subhabilidad: T1C,
    dificultad: d,
    enunciado: tx(`¿Qué signo va en el hueco? ${a} ___ ${b}`, `Quel signe va dans le trou ? ${a} ___ ${b}`, `Mba'e signo oike pa'ũme? ${a} ___ ${b}`),
    enunciadoFacil: tx(`Mira: ${a} ___ ${b}. ¿Qué signo va en el hueco?`, `Regarde : ${a} ___ ${b}. Quel signe va dans le trou ?`, `Emañá: ${a} ___ ${b}. Mba'e signo oike pa'ũme?`),
    respuesta: { tipo: "opcion", correcta, distractores: Object.values(SIGNOS).filter((s) => s !== correcta) },
    pista: tx("Compara primero las decenas de los dos números.", `Compare d'abord les dizaines des deux nombres.`, `Embojoja raẽ mokõive papapy decena.`),
    explicacion: tx(`${motivo} Por eso escribimos ${a} ${correcta.charAt(0)} ${b}.`, `${motivo} C'est pourquoi on écrit ${a} ${correcta.charAt(0)} ${b}.`, `${motivo} Upévare jahai ${a} ${correcta.charAt(0)} ${b}.`),
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
    enunciado: tx(`Toca los bloques del número ${pide}. ${ayudaBloques()}`, `Touche les blocs du nombre le plus ${grandPetit(pide)}. ${ayudaBloques()}`, `Epoko papapy ${tuichaMichi(pide)} bloque. ${ayudaBloques()}`),
    enunciadoFacil: tx(`Busca el número ${pide}. ${ayudaBloques()} Toca esos bloques.`, `Cherche le nombre le plus ${grandPetit(pide)}. ${ayudaBloques()} Touche ces blocs.`, `Eheka papapy ${tuichaMichi(pide)}. ${ayudaBloques()} Epoko umi bloque.`),
    respuesta: { tipo: "imagen", correcta: opcion(correcta), distractores: valores.filter((v) => v !== correcta).map(opcion) },
    pista: tx("Averigua qué número forma cada grupo de bloques y compara.", `Trouve quel nombre forme chaque groupe de blocs, puis compare.`, `Ejuhu mba'e papapýpa ojapo peteĩteĩ aty bloque. Upéi embojoja.`),
    explicacion: tx(`Los bloques forman ${listaY([...valores].sort((a, b) => a - b))}. El ${pide} es el ${correcta}.`, `Les blocs forment ${listaY([...valores].sort((a, b) => a - b))}. Le plus ${grandPetit(pide)} est ${correcta}.`, `Bloque ojapo ${listaY([...valores].sort((a, b) => a - b))}. ${mayus(tuichaMichi(pide))} ha'e ${correcta}.`),
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
    enunciado: tx(`¿Qué número es mayor que ${a} y menor que ${b}?`, `Quel nombre est plus grand que ${a} et plus petit que ${b} ?`, `Mba'e papapýpa tuichave ${a}-gui ha michĩve ${b}-gui?`),
    enunciadoFacil: tx(`Busca un número. Tiene que ser mayor que ${a}. Tiene que ser menor que ${b}.`, `Cherche un nombre. Il doit être plus grand que ${a}. Il doit être plus petit que ${b}.`, `Eheka peteĩ papapy. Tuichave va'erã ${a}-gui. Michĩve va'erã ${b}-gui.`),
    respuesta: { tipo: "opcion", correcta: String(correcta), distractores: distractoresTexto(rng, String(correcta), fuera.map(String), 3) },
    pista: tx("Comprueba las dos condiciones con cada número.", `Vérifie les deux conditions pour chaque nombre.`, `Ehecha mokõive mba'e peteĩteĩ papapýpe.`),
    explicacion: tx(`El ${correcta} va después del ${a} y antes del ${b}.`, `${correcta} vient après ${a} et avant ${b}.`, `${correcta} ou ${a} rire ha ${b} mboyve.`),
    plantilla: clave(T1C, "entre", a, b, correcta),
  });
};

const misma = (): string => tx("Tienen la misma cantidad", "La même quantité", "Oguereko peteĩcha");

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
  const MISMA = misma();
  const ganador = a === b ? MISMA : (pide === "más") === (a > b) ? x : y;
  const final = a === b ? tx("Son el mismo número.", `C'est le même nombre.`, `Ha'e papapy peteĩcha.`) : tx(`${ganador} tiene ${pide}.`, `${ganador} en a ${pide === "más" ? "le plus" : "le moins"}.`, `${ganador} oguereko ${pide === "más" ? "hetave" : "sa'ive"}.`);
  return pregunta(rng, {
    subhabilidad: T1C,
    dificultad: d,
    enunciado: tx(`${x} tiene ${a} ${pl(c)} y ${y} tiene ${b} ${pl(c)}. ¿Quién tiene ${pide} ${pl(c)}?`, `${x} a ${a} ${pl(c)} et ${y} a ${b} ${pl(c)}. Qui a le ${pide === "más" ? "plus" : "moins"} ${dePl(c)} ?`, `${x} oguereko ${a} ${pl(c)} ha ${y} oguereko ${b} ${pl(c)}. Mávapa oguereko ${pide === "más" ? "hetave" : "sa'ive"} ${pl(c)}?`),
    enunciadoFacil: tx(`${x} tiene ${a} ${pl(c)}. ${y} tiene ${b} ${pl(c)}. ¿Quién tiene ${pide}?`, `${x} a ${a} ${pl(c)}. ${y} a ${b} ${pl(c)}. Qui en a le ${pide === "más" ? "plus" : "moins"} ?`, `${x} oguereko ${a} ${pl(c)}. ${y} oguereko ${b} ${pl(c)}. Mávapa oguereko ${pide === "más" ? "hetave" : "sa'ive"}?`),
    respuesta: { tipo: "opcion", correcta: ganador, distractores: [x, y, MISMA].filter((v) => v !== ganador) },
    pista: tx("Compara primero las decenas de los dos números.", `Compare d'abord les dizaines des deux nombres.`, `Embojoja raẽ mokõive papapy decena.`),
    explicacion: tx(`Comparamos el ${a} y el ${b}. ${final}`, `On compare ${a} et ${b}. ${final}`, `Jambojoja ${a} ha ${b}. ${final}`),
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
    enunciado: tx(`¿Cuánto es ${a} + ${b}?`, `Combien font ${a} + ${b} ?`, `Mboýpa ${a} + ${b}?`),
    enunciadoFacil: tx(`Suma ${a} y ${b}.`, `Additionne ${a} et ${b}.`, `Embojoapy ${a} ha ${b}.`),
    respuesta: respuestaNum(rng, d, s, [s + 10, s - 10, s + 1, s - 1, a]),
    pista: tx("Suma las unidades con las unidades y las decenas con las decenas.", `Additionne les unités avec les unités et les dizaines avec les dizaines.`, `Embojoapy unidad unidad ndive ha decena decena ndive.`),
    explicacion: tx(`Unidades: ${unidad(a)} + ${unidad(b)} = ${unidad(s)}. Decenas: ${decena(a)} + ${decena(b)} = ${decena(s)}. El resultado es ${s}.`, `Unités : ${unidad(a)} + ${unidad(b)} = ${unidad(s)}. Dizaines : ${decena(a)} + ${decena(b)} = ${decena(s)}. Le résultat est ${s}.`, `Unidad: ${unidad(a)} + ${unidad(b)} = ${unidad(s)}. Decena: ${decena(a)} + ${decena(b)} = ${decena(s)}. Osẽ ${s}.`),
    plantilla: clave(T2A, "suma", a, b),
  });
};

const restaSin: Generador = (rng, d) => {
  const [a, b] = restaSinLlevar(rng, d);
  const r = a - b;
  return pregunta(rng, {
    subhabilidad: T2A,
    dificultad: d,
    enunciado: tx(`¿Cuánto es ${a} − ${b}?`, `Combien font ${a} − ${b} ?`, `Mboýpa ${a} − ${b}?`),
    enunciadoFacil: tx(`Al ${a} quítale ${b}.`, `À ${a}, enlève ${b}.`, `${a}-gui enohẽ ${b}.`),
    respuesta: respuestaNum(rng, d, r, [a + b, r + 10, r - 10, r + 1, r - 1].filter((x) => x > 0)),
    pista: tx("Resta las unidades con las unidades y las decenas con las decenas.", `Soustrais les unités des unités et les dizaines des dizaines.`, `Emboguepy unidad unidad-gui ha decena decena-gui.`),
    explicacion: tx(`Unidades: ${unidad(a)} − ${unidad(b)} = ${unidad(r)}. Decenas: ${decena(a)} − ${decena(b)} = ${decena(r)}. El resultado es ${r}.`, `Unités : ${unidad(a)} − ${unidad(b)} = ${unidad(r)}. Dizaines : ${decena(a)} − ${decena(b)} = ${decena(r)}. Le résultat est ${r}.`, `Unidad: ${unidad(a)} − ${unidad(b)} = ${unidad(r)}. Decena: ${decena(a)} − ${decena(b)} = ${decena(r)}. Osẽ ${r}.`),
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
    enunciado: tx(`${ayudaBloques()} ${sumar ? "Súmale" : "Réstale"} ${b} a este número. ¿Cuánto da?`, `${ayudaBloques()} ${sumar ? `Ajoute ${b} à` : `Enlève ${b} de`} ce nombre. Combien ça fait ?`, `${ayudaBloques()} ${sumar ? `Embojoapy ${b} ko papapýre` : `Enohẽ ${b} ko papapýgui`}. Mboýpa osẽ?`),
    enunciadoFacil: tx(`Mira los bloques. ${ayudaBloques()} ${sumar ? "Suma" : "Resta"} ${b}. ¿Cuánto da?`, `Regarde les blocs. ${ayudaBloques()} ${sumar ? "Ajoute" : "Enlève"} ${b}. Combien ça fait ?`, `Emañá bloque-re. ${ayudaBloques()} ${sumar ? "Embojoapy" : "Enohẽ"} ${b}. Mboýpa osẽ?`),
    imagen: bloques(decena(a), unidad(a)),
    respuesta: respuestaNum(rng, d, r, [sumar ? a - b : a + b, a, r + 10, r - 10, r + 1, r - 1].filter((x) => x > 0)),
    pista: tx("Averigua qué número forman los bloques. Después haz la cuenta.", `Trouve quel nombre forment les blocs. Ensuite, fais le calcul.`, `Ejuhu mba'e papapýpa ojapo bloque. Upéi ejapo cuenta.`),
    explicacion: tx(`Los bloques forman el ${a}. ${a} ${sumar ? "+" : "−"} ${b} = ${r}.`, `Les blocs forment le nombre ${a}. ${a} ${sumar ? "+" : "−"} ${b} = ${r}.`, `Bloque ojapo papapy ${a}. ${a} ${sumar ? "+" : "−"} ${b} = ${r}.`),
    plantilla: clave(T2A, "bloques", sumar ? "suma" : "resta", a, b),
  });
};

const huecoSin: Generador = (rng, d) => {
  const [a, b] = sumaSinLlevar(rng, d);
  const s = a + b;
  return pregunta(rng, {
    subhabilidad: T2A,
    dificultad: d,
    enunciado: tx(`¿Qué número falta? ${a} + ___ = ${s}`, `Quel nombre manque ? ${a} + ___ = ${s}`, `Mba'e papapýpa ofalta? ${a} + ___ = ${s}`),
    enunciadoFacil: tx(`Mira: ${a} + ___ = ${s}. ¿Qué número va en el hueco?`, `Regarde : ${a} + ___ = ${s}. Quel nombre va dans le trou ?`, `Emañá: ${a} + ___ = ${s}. Mba'e papapýpa oike pa'ũme?`),
    respuesta: respuestaNum(rng, d, b, [s, a, b + 10, b + 1, Math.abs(b - 1)].filter((x) => x > 0)),
    pista: tx("Piensa cuánto le falta al primer número para llegar al resultado.", `Pense à ce qu'il manque au premier nombre pour arriver au résultat.`, `Epensa mboýpa ofalta papapy peteĩhápe oguahẽ hag̃ua.`),
    explicacion: tx(`${a} + ${b} = ${s}. Por eso falta el ${b}.`, `${a} + ${b} = ${s}. Il manque donc ${b}.`, `${a} + ${b} = ${s}. Upévare ofalta ${b}.`),
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
    enunciado: tx(`¿Cuánto es ${a} + ${b}?`, `Combien font ${a} + ${b} ?`, `Mboýpa ${a} + ${b}?`),
    enunciadoFacil: tx(`Suma ${a} y ${b}. Recuerda la decena que te llevas.`, `Additionne ${a} et ${b}. N'oublie pas la retenue.`, `Embojoapy ${a} ha ${b}. Ani nderesarái decena reraháva-gui.`),
    respuesta: respuestaNum(rng, d, s, [sinLlevarse(a, b), s + 10, s + 1, s - 1]),
    pista: tx("Si las unidades pasan de 9, te llevas 1 a las decenas.", `Si les unités dépassent 9, tu retiens 1 dizaine.`, `Unidad ohasárõ 9-gui, ereraha 1 decena-pe.`),
    explicacion: tx(`${unidad(a)} + ${unidad(b)} = ${us}: escribes ${unidad(us)} y te llevas 1. Con esa decena, el resultado es ${s}.`, `${unidad(a)} + ${unidad(b)} = ${us} : tu écris ${unidad(us)} et tu retiens 1. Avec cette retenue, le résultat est ${s}.`, `${unidad(a)} + ${unidad(b)} = ${us}: rehai ${unidad(us)} ha ereraha 1. Upe decena reheve, osẽ ${s}.`),
    plantilla: clave(T2B, "suma", a, b),
  });
};

const restaCon: Generador = (rng, d) => {
  const [a, b] = restaLlevando(rng, d);
  const r = a - b;
  return pregunta(rng, {
    subhabilidad: T2B,
    dificultad: d,
    enunciado: tx(`¿Cuánto es ${a} − ${b}?`, `Combien font ${a} − ${b} ?`, `Mboýpa ${a} − ${b}?`),
    enunciadoFacil: tx(`Al ${a} quítale ${b}. Si no llegas, cambia una decena.`, `À ${a}, enlève ${b}. Si tu ne peux pas, échange une dizaine.`, `${a}-gui enohẽ ${b}. Ndaikatúiramo, emoambue peteĩ decena.`),
    respuesta: respuestaNum(rng, d, r, [restaAlReves(a, b), sinDevolver(a, b), r + 1, r - 1].filter((x) => x > 0)),
    pista: tx("Si no puedes quitar las unidades, cambia una decena por 10 unidades.", `Si tu ne peux pas enlever les unités, échange une dizaine contre 10 unités.`, `Ndaikatúiramo renohẽ unidad, emoambue peteĩ decena 10 unidad-re.`),
    explicacion: tx(`No puedes quitar ${unidad(b)} de ${unidad(a)}. Cambias una decena: ${10 + unidad(a)} − ${unidad(b)} = ${10 + unidad(a) - unidad(b)}. El resultado es ${r}.`, `Tu ne peux pas enlever ${unidad(b)} de ${unidad(a)}. Tu échanges une dizaine : ${10 + unidad(a)} − ${unidad(b)} = ${10 + unidad(a) - unidad(b)}. Le résultat est ${r}.`, `Ndaikatúi renohẽ ${unidad(b)} ${unidad(a)}-gui. Remoambue peteĩ decena: ${10 + unidad(a)} − ${unidad(b)} = ${10 + unidad(a) - unidad(b)}. Osẽ ${r}.`),
    plantilla: clave(T2B, "resta", a, b),
  });
};

const sumaEscrita: Generador = (rng, d) => {
  const [a, b] = sumaLlevando(rng, d);
  const s = a + b;
  return pregunta(rng, {
    subhabilidad: T2B,
    dificultad: d,
    enunciado: tx(`Escribe el resultado: ${a} + ${b}`, `Écris le résultat : ${a} + ${b}`, `Ehai mba'e osẽva: ${a} + ${b}`),
    enunciadoFacil: tx(`Suma ${a} y ${b}. Escribe el resultado.`, `Additionne ${a} et ${b}. Écris le résultat.`, `Embojoapy ${a} ha ${b}. Ehai mba'e osẽva.`),
    respuesta: { tipo: "numero", valor: s },
    pista: tx("Empieza por las unidades. Si pasan de 9, te llevas 1.", `Commence par les unités. Si elles dépassent 9, tu retiens 1.`, `Eñepyrũ unidad-gui. Ohasárõ 9-gui, ereraha 1.`),
    explicacion: tx(`${a} + ${b} = ${s}. No olvides la decena que te llevas.`, `${a} + ${b} = ${s}. N'oublie pas la retenue.`, `${a} + ${b} = ${s}. Ani nderesarái decena reraháva-gui.`),
    plantilla: clave(T2B, "escrita", a, b),
  });
};

const restaEscrita: Generador = (rng, d) => {
  const [a, b] = restaLlevando(rng, d);
  const r = a - b;
  return pregunta(rng, {
    subhabilidad: T2B,
    dificultad: d,
    enunciado: tx(`Escribe el resultado: ${a} − ${b}`, `Écris le résultat : ${a} − ${b}`, `Ehai mba'e osẽva: ${a} − ${b}`),
    enunciadoFacil: tx(`Al ${a} quítale ${b}. Escribe el resultado.`, `À ${a}, enlève ${b}. Écris le résultat.`, `${a}-gui enohẽ ${b}. Ehai mba'e osẽva.`),
    respuesta: { tipo: "numero", valor: r },
    pista: tx("Empieza por las unidades. Si no llegas, cambia una decena por 10 unidades.", `Commence par les unités. Si tu ne peux pas, échange une dizaine contre 10 unités.`, `Eñepyrũ unidad-gui. Ndaikatúiramo, emoambue peteĩ decena 10 unidad-re.`),
    explicacion: tx(`${a} − ${b} = ${r}. Puedes comprobarlo: ${r} + ${b} = ${a}.`, `${a} − ${b} = ${r}. Tu peux vérifier : ${r} + ${b} = ${a}.`, `${a} − ${b} = ${r}. Ikatu rehecha: ${r} + ${b} = ${a}.`),
    plantilla: clave(T2B, "escrita-resta", a, b),
  });
};

const huecoCon: Generador = (rng, d) => {
  const [a, b] = sumaLlevando(rng, d);
  const s = a + b;
  return pregunta(rng, {
    subhabilidad: T2B,
    dificultad: d,
    enunciado: tx(`¿Qué número falta? ${a} + ___ = ${s}`, `Quel nombre manque ? ${a} + ___ = ${s}`, `Mba'e papapýpa ofalta? ${a} + ___ = ${s}`),
    enunciadoFacil: tx(`Mira: ${a} + ___ = ${s}. ¿Qué número va en el hueco?`, `Regarde : ${a} + ___ = ${s}. Quel nombre va dans le trou ?`, `Emañá: ${a} + ___ = ${s}. Mba'e papapýpa oike pa'ũme?`),
    respuesta: respuestaNum(rng, d, b, [b + 10, b - 10, b + 1, b - 1, s].filter((x) => x > 0)),
    pista: tx(`Resta: al ${s} quítale ${a}.`, `Soustrais : à ${s}, enlève ${a}.`, `Emboguepy: ${s}-gui enohẽ ${a}.`),
    explicacion: tx(`${s} − ${a} = ${b}, y ${a} + ${b} = ${s}.`, `${s} − ${a} = ${b}, et ${a} + ${b} = ${s}.`, `${s} − ${a} = ${b}, ha ${a} + ${b} = ${s}.`),
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
  { u: PERSONA, texto: (a, b) => tx(`En el autobús van ${a} personas. En la parada suben ${b} personas. ¿Cuántas personas van ahora en el autobús?`, `Dans le bus, il y a ${a} personnes. À l'arrêt, ${b} personnes montent. Combien de personnes y a-t-il maintenant dans le bus ?`, `Ómnibus-pe oĩ ${a} tapicha. Parada-pe ojupi ${b} tapicha. Mboy tapichápa oĩ ko'ágã ómnibus-pe?`), facil: (a, b) => tx(`Van ${a} personas. Suben ${b} personas. ¿Cuántas van ahora?`, `Il y a ${a} personnes. ${b} personnes montent. Combien sont-elles maintenant ?`, `Oĩ ${a} tapicha. Ojupi ${b} tapicha. Mboýpa oĩ ko'ágã?`) },
  { u: SEMILLA, texto: (a, b, x) => tx(`${x} planta ${a} semillas por la mañana y ${b} semillas por la tarde. ¿Cuántas semillas planta en total?`, `${x} plante ${a} graines le matin et ${b} graines l'après-midi. Combien de graines plante-t-on en tout ?`, `${x} oñotỹ ${a} ra'ỹi pyhareve ha ${b} ra'ỹi ka'aru. Mboy ra'ỹipa oñotỹ opaite?`), facil: (a, b, x) => tx(`${x} planta ${a} semillas. Luego planta ${b} semillas. ¿Cuántas son en total?`, `${x} plante ${a} graines. Puis ${b} graines. Combien en tout ?`, `${x} oñotỹ ${a} ra'ỹi. Upéi oñotỹ ${b} ra'ỹi. Mboýpa opaite?`) },
  { u: LIBRO, texto: (a, b) => tx(`La escuela tiene ${a} libros en una estantería y ${b} libros en otra. ¿Cuántos libros tiene en total?`, `L'école a ${a} livres sur une étagère et ${b} livres sur une autre. Combien de livres a-t-elle en tout ?`, `Mbo'ehao oguereko ${a} aranduka peteĩ estante-pe ha ${b} aranduka ambue estante-pe. Mboy arandukápa oguereko opaite?`), facil: (a, b) => tx(`Hay ${a} libros en una estantería. Hay ${b} libros en otra. ¿Cuántos son en total?`, `Il y a ${a} livres sur une étagère. Il y a ${b} livres sur une autre. Combien en tout ?`, `Oĩ ${a} aranduka peteĩ estante-pe. Oĩ ${b} aranduka ambuépe. Mboýpa opaite?`) },
  { u: NARANJA, texto: (a, b, x) => tx(`En el mercado, ${x} vende ${a} naranjas por la mañana y ${b} naranjas por la tarde. ¿Cuántas naranjas vende en total?`, `Au marché, ${x} vend ${a} oranges le matin et ${b} oranges l'après-midi. Combien d'oranges sont vendues en tout ?`, `Merkádo-pe, ${x} ovende ${a} narã pyhareve ha ${b} narã ka'aru. Mboy narãpa ovende opaite?`), facil: (a, b, x) => tx(`${x} vende ${a} naranjas. Luego vende ${b} naranjas. ¿Cuántas son en total?`, `${x} vend ${a} oranges. Puis ${b} oranges. Combien en tout ?`, `${x} ovende ${a} narã. Upéi ovende ${b} narã. Mboýpa opaite?`) },
  { u: HUEVO, texto: (a, b, x, y) => tx(`${x} recoge ${a} huevos y ${y} recoge ${b} huevos. ¿Cuántos huevos recogen en total?`, `${x} ramasse ${a} œufs et ${y} ramasse ${b} œufs. Combien d'œufs ramassent-ils en tout ?`, `${x} ombyaty ${a} rupi'a ha ${y} ombyaty ${b} rupi'a. Mboy rupi'ápa ombyaty hikuái opaite?`), facil: (a, b, x, y) => tx(`${x} recoge ${a} huevos. ${y} recoge ${b} huevos. ¿Cuántos son en total?`, `${x} ramasse ${a} œufs. ${y} ramasse ${b} œufs. Combien en tout ?`, `${x} ombyaty ${a} rupi'a. ${y} ombyaty ${b} rupi'a. Mboýpa opaite?`) },
  { u: CUBO_AGUA, texto: (a, b) => tx(`Esta semana se sacan ${a} cubos de agua del pozo y la semana pasada se sacaron ${b}. ¿Cuántos cubos de agua son en total?`, `Cette semaine, on tire ${a} seaux d'eau du puits et la semaine dernière, on en a tiré ${b}. Combien de seaux d'eau en tout ?`, `Ko arapokõindýpe oñenohẽ ${a} balde y ykuágui ha ambue arapokõindýpe oñenohẽ ${b}. Mboy balde ýpa opaite?`), facil: (a, b) => tx(`Esta semana sacan ${a} cubos de agua. Antes sacaron ${b} cubos. ¿Cuántos son en total?`, `Cette semaine, on tire ${a} seaux d'eau. Avant, on en a tiré ${b}. Combien en tout ?`, `Ko arapokõindýpe oñenohẽ ${a} balde y. Yma oñenohẽ ${b}. Mboýpa opaite?`) },
];

const QUITAR: readonly Relato[] = [
  { u: PERSONA, texto: (a, b) => tx(`En el autobús van ${a} personas. En la parada bajan ${b} personas. ¿Cuántas personas quedan en el autobús?`, `Dans le bus, il y a ${a} personnes. À l'arrêt, ${b} personnes descendent. Combien de personnes restent dans le bus ?`, `Ómnibus-pe oĩ ${a} tapicha. Parada-pe oguejy ${b} tapicha. Mboy tapichápa opyta ómnibus-pe?`), facil: (a, b) => tx(`Van ${a} personas. Bajan ${b} personas. ¿Cuántas quedan?`, `Il y a ${a} personnes. ${b} personnes descendent. Combien en reste-t-il ?`, `Oĩ ${a} tapicha. Oguejy ${b} tapicha. Mboýpa opyta?`) },
  { u: CUADERNO, texto: (a, b) => tx(`En la tienda hay ${a} cuadernos y se venden ${b}. ¿Cuántos cuadernos quedan?`, `Au magasin, il y a ${a} cahiers et on en vend ${b}. Combien de cahiers reste-t-il ?`, `Ñemuhápe oĩ ${a} kuaderno ha oñevende ${b}. Mboy kuadérnopa opyta?`), facil: (a, b) => tx(`Hay ${a} cuadernos. Se venden ${b} cuadernos. ¿Cuántos quedan?`, `Il y a ${a} cahiers. On vend ${b} cahiers. Combien en reste-t-il ?`, `Oĩ ${a} kuaderno. Oñevende ${b} kuaderno. Mboýpa opyta?`) },
  { u: SEMILLA, texto: (a, b, x) => tx(`${x} tiene ${a} semillas y planta ${b}. ¿Cuántas semillas le quedan?`, `${x} a ${a} graines et en plante ${b}. Combien de graines reste-t-il ?`, `${x} oguereko ${a} ra'ỹi ha oñotỹ ${b}. Mboy ra'ỹipa opyta chupe?`), facil: (a, b, x) => tx(`${x} tiene ${a} semillas. Planta ${b} semillas. ¿Cuántas le quedan?`, `${x} a ${a} graines. ${x} plante ${b} graines. Combien en reste-t-il ?`, `${x} oguereko ${a} ra'ỹi. Oñotỹ ${b} ra'ỹi. Mboýpa opyta chupe?`) },
  { u: NARANJA, texto: (a, b, x) => tx(`Un árbol tiene ${a} naranjas y ${x} recoge ${b}. ¿Cuántas naranjas quedan en el árbol?`, `Un arbre a ${a} oranges et ${x} en cueille ${b}. Combien d'oranges reste-t-il sur l'arbre ?`, `Peteĩ yvyra oguereko ${a} narã ha ${x} oipo'o ${b}. Mboy narãpa opyta yvyrápe?`), facil: (a, b, x) => tx(`Hay ${a} naranjas. ${x} recoge ${b} naranjas. ¿Cuántas quedan?`, `Il y a ${a} oranges. ${x} cueille ${b} oranges. Combien en reste-t-il ?`, `Oĩ ${a} narã. ${x} oipo'o ${b} narã. Mboýpa opyta?`) },
  { u: LAPIZ, texto: (a, b, x) => tx(`En el armario de la escuela hay ${a} lápices y ${x} reparte ${b} en la clase. ¿Cuántos lápices quedan en el armario?`, `Dans l'armoire de l'école, il y a ${a} crayons et ${x} en distribue ${b} dans la classe. Combien de crayons reste-t-il dans l'armoire ?`, `Mbo'ehao armario-pe oĩ ${a} lápiz ha ${x} ome'ẽ ${b} mbo'esyrype. Mboy lápizpa opyta armario-pe?`), facil: (a, b, x) => tx(`Hay ${a} lápices. ${x} reparte ${b} lápices. ¿Cuántos quedan?`, `Il y a ${a} crayons. ${x} distribue ${b} crayons. Combien en reste-t-il ?`, `Oĩ ${a} lápiz. ${x} ome'ẽ ${b} lápiz. Mboýpa opyta?`) },
];

const DIFERENCIA: readonly Relato[] = [
  { u: PAGINA, texto: (a, b, x, y) => tx(`${x} ha leído ${a} páginas y ${y} ha leído ${b} páginas. ¿Cuántas páginas más ha leído ${x}?`, `${x} a lu ${a} pages et ${y} a lu ${b} pages. Combien de pages ${x} a lu de plus ?`, `${x} omoñe'ẽ ${a} rogue ha ${y} omoñe'ẽ ${b} rogue. Mboy rogue hetavépa omoñe'ẽ ${x}?`), facil: (a, b, x, y) => tx(`${x} lee ${a} páginas. ${y} lee ${b} páginas. ¿Cuántas páginas más lee ${x}?`, `${x} lit ${a} pages. ${y} lit ${b} pages. Combien de pages ${x} lit de plus ?`, `${x} omoñe'ẽ ${a} rogue. ${y} omoñe'ẽ ${b} rogue. Mboy hetavépa omoñe'ẽ ${x}?`) },
  { u: SILLA, texto: (a, b) => tx(`Una sala tiene ${a} sillas y otra sala tiene ${b} sillas. ¿Cuántas sillas más tiene la primera sala?`, `Une salle a ${a} chaises et une autre salle a ${b} chaises. Combien de chaises la première salle a-t-elle de plus ?`, `Peteĩ koty oguereko ${a} apyka ha ambue koty oguereko ${b} apyka. Mboy apyka hetavépa oguereko koty peteĩha?`), facil: (a, b) => tx(`Una sala tiene ${a} sillas. Otra sala tiene ${b} sillas. ¿Cuántas sillas más tiene la primera?`, `Une salle a ${a} chaises. Une autre salle a ${b} chaises. Combien de chaises la première a de plus ?`, `Peteĩ koty oguereko ${a} apyka. Ambue koty oguereko ${b} apyka. Mboy hetavépa oguereko peteĩha?`) },
  { u: PAGINA, texto: (a, b, x) => tx(`Un libro tiene ${a} páginas y ${x} ya ha leído ${b}. ¿Cuántas páginas le faltan por leer?`, `Un livre a ${a} pages et ${x} en a déjà lu ${b}. Combien de pages reste-t-il à lire ?`, `Peteĩ aranduka oguereko ${a} rogue ha ${x} omoñe'ẽma ${b}. Mboy roguépa ofalta omoñe'ẽ hag̃ua?`), facil: (a, b, x) => tx(`El libro tiene ${a} páginas. ${x} lee ${b} páginas. ¿Cuántas le faltan?`, `Le livre a ${a} pages. ${x} lit ${b} pages. Combien en reste-t-il ?`, `Aranduka oguereko ${a} rogue. ${x} omoñe'ẽ ${b} rogue. Mboýpa ofalta?`) },
  { u: SEMILLA, texto: (a, b, x) => tx(`${x} quiere juntar ${a} semillas y ya tiene ${b}. ¿Cuántas semillas le faltan?`, `${x} veut réunir ${a} graines et en a déjà ${b}. Combien de graines manque-t-il ?`, `${x} ombyatyse ${a} ra'ỹi ha oguerekóma ${b}. Mboy ra'ỹipa ofalta chupe?`), facil: (a, b, x) => tx(`${x} quiere ${a} semillas. Ya tiene ${b}. ¿Cuántas le faltan?`, `${x} veut ${a} graines. ${x} en a déjà ${b}. Combien en manque-t-il ?`, `${x} oipota ${a} ra'ỹi. Oguerekóma ${b}. Mboýpa ofalta chupe?`) },
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
    pista: tx("¿Las cantidades se juntan o se quitan? Después haz la cuenta.", `Les quantités s'ajoutent ou s'enlèvent ? Ensuite, fais le calcul.`, `Oñembojoapýpa térã oñenohẽ? Upéi ejapo cuenta.`),
    explicacion: tx(`Las cantidades se juntan: ${a} + ${b} = ${s}. Son ${cant(s, h.u)}.`, `Les quantités s'ajoutent : ${a} + ${b} = ${s}. Ce sont ${cant(s, h.u)}.`, `Oñembojoapy: ${a} + ${b} = ${s}. Ha'e ${cant(s, h.u)}.`),
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
    pista: tx("Al final hay menos que al principio. Piensa qué cuenta sirve.", `À la fin, il y en a moins qu'au début. Pense au bon calcul.`, `Ipaháme oĩ sa'ive. Epensa mba'e cuenta oikóta.`),
    explicacion: tx(`Se quita una parte: ${a} − ${b} = ${r}. ${quedan(r)} ${cant(r, h.u)}.`, `On enlève une partie : ${a} − ${b} = ${r}. Il reste ${cant(r, h.u)}.`, `Oñenohẽ peteĩ pehẽngue: ${a} − ${b} = ${r}. Opyta ${cant(r, h.u)}.`),
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
    pista: tx("Busca la distancia entre los dos números: del pequeño al grande.", `Cherche la distance entre les deux nombres : du petit au grand.`, `Eheka mboýpa oĩ mokõi papapy pa'ũme: michĩvégui tuichavépe.`),
    explicacion: tx(`Del ${b} al ${a} hay ${r}: ${a} − ${b} = ${r}.`, `De ${b} à ${a}, il y a ${r} : ${a} − ${b} = ${r}.`, `${b}-gui ${a} peve oĩ ${r}: ${a} − ${b} = ${r}.`),
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
    ? { inicio: tx(`En el autobús van ${a} personas.`, `Dans le bus, il y a ${a} personnes.`, `Ómnibus-pe oĩ ${a} tapicha.`), resto: quitarPrimero ? tx(`Bajan ${b} y suben ${c}.`, `${b} descendent et ${c} montent.`, `Oguejy ${b} ha ojupi ${c}.`) : tx(`Suben ${c} y bajan ${b}.`, `${c} montent et ${b} descendent.`, `Ojupi ${c} ha oguejy ${b}.`), pregunta: tx("¿Cuántas personas van ahora?", `Combien de personnes y a-t-il maintenant ?`, `Mboy tapichápa oĩ ko'ágã?`) }
    : { inicio: tx(`${x} tiene ${a} semillas.`, `${x} a ${a} graines.`, `${x} oguereko ${a} ra'ỹi.`), resto: quitarPrimero ? tx(`Planta ${b} y recoge ${c}.`, `${x} en plante ${b} et en ramasse ${c}.`, `Oñotỹ ${b} ha ombyaty ${c}.`) : tx(`Recoge ${c} y planta ${b}.`, `${x} en ramasse ${c} et en plante ${b}.`, `Ombyaty ${c} ha oñotỹ ${b}.`), pregunta: tx("¿Cuántas semillas tiene ahora?", `Combien de graines y a-t-il maintenant ?`, `Mboy ra'ỹipa oguereko ko'ágã?`) };
  return pregunta(rng, {
    subhabilidad: T2C,
    dificultad: d,
    enunciado: `${frase.inicio} ${frase.resto} ${frase.pregunta}`,
    enunciadoFacil: `${frase.inicio} ${frase.resto} ${frase.pregunta}`,
    respuesta: respuestaNum(rng, d, r, [a + b + c, a - b - c, a - b, a + c, r + 10].filter((v) => v > 0)),
    pista: tx("Hazlo en dos pasos, en el orden de la historia.", `Fais-le en deux étapes, dans l'ordre de l'histoire.`, `Ejapo mokõi pyrũme, mombe'u rysýi rupi.`),
    explicacion: quitarPrimero ? tx(`${a} − ${b} = ${a - b}, y ${a - b} + ${c} = ${r}.`, `${a} − ${b} = ${a - b}, et ${a - b} + ${c} = ${r}.`, `${a} − ${b} = ${a - b}, ha ${a - b} + ${c} = ${r}.`) : tx(`${a} + ${c} = ${a + c}, y ${a + c} − ${b} = ${r}.`, `${a} + ${c} = ${a + c}, et ${a + c} − ${b} = ${r}.`, `${a} + ${c} = ${a + c}, ha ${a + c} − ${b} = ${r}.`),
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

const pistaValor = (): string => tx("Suma lo que vale cada moneda. No cuentes solo cuántas monedas hay.", "Additionne ce que vaut chaque pièce. Ne compte pas seulement le nombre de pièces.", "Embojoapy peteĩteĩ moneda hepy. Ani repapa moneda añónte.");

const contarDinero: Generador = (rng, d) => {
  const valores = monedasDeDificultad(rng, d);
  const total = suma(valores);
  return pregunta(rng, {
    subhabilidad: T3A,
    dificultad: d,
    enunciado: tx("Cada moneda lleva escrito lo que vale. ¿Cuánto dinero hay en total?", `Sur chaque pièce est écrit ce qu'elle vaut. Combien d'argent y a-t-il en tout ?`, `Peteĩteĩ moneda oguereko ojehaipyre hepy. Mboy pirapirepa oĩ opaite?`),
    enunciadoFacil: tx("Mira las monedas. Suma lo que vale cada una. ¿Cuánto dinero hay?", `Regarde les pièces. Additionne ce que vaut chacune. Combien d'argent y a-t-il ?`, `Emañá moneda-re. Embojoapy peteĩteĩ hepy. Mboy pirapirepa oĩ?`),
    imagen: imagenMonedas(valores),
    respuesta: respuestaNum(rng, d, total, falsosTotales(valores)),
    pista: pistaValor(),
    explicacion: tx(`${sumaEscribible(valores)} = ${total}. Las ${valores.length} monedas valen ${total} en total.`, `${sumaEscribible(valores)} = ${total}. Les ${valores.length} pièces valent ${total} en tout.`, `${sumaEscribible(valores)} = ${total}. Umi ${valores.length} moneda hepy ${total} opaite.`),
    plantilla: clave(T3A, "contar", ...ordenarMonedas(valores)),
  });
};

const contarDineroEscrito: Generador = (rng, d) => {
  const valores = monedasDeDificultad(rng, d);
  const total = suma(valores);
  return pregunta(rng, {
    subhabilidad: T3A,
    dificultad: d,
    enunciado: tx("Suma el valor de estas monedas y escribe el total.", `Additionne la valeur de ces pièces et écris le total.`, `Embojoapy ko'ã moneda hepy ha ehai opaite.`),
    enunciadoFacil: tx("Mira las monedas. Suma lo que vale cada una. Escribe el total.", `Regarde les pièces. Additionne ce que vaut chacune. Écris le total.`, `Emañá moneda-re. Embojoapy peteĩteĩ hepy. Ehai opaite.`),
    imagen: imagenMonedas(valores),
    respuesta: { tipo: "numero", valor: total },
    pista: tx("Empieza por las monedas que valen más y ve sumando las demás.", `Commence par les pièces qui valent le plus, puis ajoute les autres.`, `Eñepyrũ moneda hepyvévagui ha embojoapy ambue.`),
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
    enunciado: tx(`Toca el grupo de monedas que vale ${total} en total.`, `Touche le groupe de pièces qui vaut ${total} en tout.`, `Epoko aty moneda hepýva ${total} opaite.`),
    enunciadoFacil: tx(`Busca las monedas que suman ${total}. Tócalas.`, `Cherche les pièces qui font ${total}. Touche-les.`, `Eheka moneda ojapóva ${total}. Epoko chupekuéra.`),
    respuesta: { tipo: "imagen", correcta: opcionMonedas(valores), distractores: variantesMonedas(rng, valores, [total], 2).map(opcionMonedas) },
    pista: tx("Suma lo que vale cada grupo de monedas.", `Additionne ce que vaut chaque groupe de pièces.`, `Embojoapy peteĩteĩ aty moneda hepy.`),
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
    enunciado: tx("¿Qué grupo de monedas vale más? Tócalo.", `Quel groupe de pièces vaut le plus ? Touche-le.`, `Mba'e aty monedápa hepyve? Epoko.`),
    enunciadoFacil: tx("Suma cada grupo de monedas. Toca el que vale más.", `Additionne chaque groupe de pièces. Touche celui qui vaut le plus.`, `Embojoapy peteĩteĩ aty moneda. Epoko hepyvéva.`),
    respuesta: { tipo: "imagen", correcta: opcionMonedas(ganador), distractores: [opcionMonedas(trampa), opcionMonedas(menos)] },
    pista: tx("Tener más monedas no siempre es tener más dinero. Suma cada grupo.", `Avoir plus de pièces, ce n'est pas toujours avoir plus d'argent. Additionne chaque groupe.`, `Heta moneda nda'ereíri heta pirapire. Embojoapy peteĩteĩ aty.`),
    explicacion: tx(`Ese grupo vale ${total}. Los otros valen ${suma(trampa)} y ${suma(menos)}.`, `Ce groupe vaut ${total}. Les autres valent ${suma(trampa)} et ${suma(menos)}.`, `Ko aty hepy ${total}. Ambuekuéra hepy ${suma(trampa)} ha ${suma(menos)}.`),
    plantilla: clave(T3A, "vale-mas", ...ganador),
  });
};

const ARTICULOS: readonly Unidad[] = [LAPIZ, CUADERNO, LIBRO, PELOTA, MOCHILA, PARAGUAS, GORRO, TAZA, BOTELLA];
const unArticulo = (u: Unidad): string => tx(`${un(u)} ${sg(u)}`, unU(u), sg(u));
const elArticulo = (u: Unidad): string => tx(`${el(u)} ${sg(u)}`, leU(u), sg(u));
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
    enunciado: tx(`${mayus(unArticulo(u))} cuesta ${valorDinero(precio)}. Toca las monedas que suman justo ese precio.`, `${mayus(unArticulo(u))} coûte ${valorDinero(precio)}. Touche les pièces qui font juste ce prix.`, `${mayus(unArticulo(u))} hepy ${valorDinero(precio)}. Epoko moneda ojapóva upe hepy.`),
    enunciadoFacil: tx(`${mayus(elArticulo(u))} cuesta ${valorDinero(precio)}. ¿Con qué monedas pagas justo?`, `${mayus(elArticulo(u))} coûte ${valorDinero(precio)}. Avec quelles pièces paies-tu juste ?`, `${mayus(elArticulo(u))} hepy ${valorDinero(precio)}. Mba'e moneda reheve repaga hekopete?`),
    imagen: dibujoArticulo(u),
    respuesta: { tipo: "imagen", correcta: opcionMonedas(valores), distractores: variantesMonedas(rng, valores, [precio], porD(d, 2, 2, 3)).map(opcionMonedas) },
    pista: tx("Suma cada grupo de monedas y compáralo con el precio.", `Additionne chaque groupe de pièces et compare avec le prix.`, `Embojoapy peteĩteĩ aty moneda ha embojoja hepy ndive.`),
    explicacion: tx(`${sumaEscribible(ordenarMonedas(valores))} = ${precio}. Con esas monedas pagas justo.`, `${sumaEscribible(ordenarMonedas(valores))} = ${precio}. Avec ces pièces, tu paies juste.`, `${sumaEscribible(ordenarMonedas(valores))} = ${precio}. Ko'ã moneda reheve repaga hekopete.`),
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
    enunciado: tx(`${mayus(unArticulo(u))} cuesta ${valorDinero(precio)}. Solo tienes monedas de ${v}. ¿Cuántas monedas de ${v} necesitas para pagar justo?`, `${mayus(unArticulo(u))} coûte ${valorDinero(precio)}. Tu as seulement des pièces de ${v}. Combien de pièces de ${v} te faut-il pour payer juste ?`, `${mayus(unArticulo(u))} hepy ${valorDinero(precio)}. Reguereko moneda ${v} añoite. Mboy moneda ${v} reikotevẽ repaga hag̃ua hekopete?`),
    enunciadoFacil: tx(`${mayus(elArticulo(u))} cuesta ${valorDinero(precio)}. Solo tienes monedas de ${v}. ¿Cuántas necesitas?`, `${mayus(elArticulo(u))} coûte ${valorDinero(precio)}. Tu as seulement des pièces de ${v}. Combien t'en faut-il ?`, `${mayus(elArticulo(u))} hepy ${valorDinero(precio)}. Reguereko moneda ${v} añoite. Mboýpa reikotevẽ?`),
    imagen: imagenMonedas([v]),
    respuesta: respuestaNum(rng, d, n, [precio, v, n + 1, n - 1].filter((x) => x > 0)),
    pista: tx(`Cuenta de ${v} en ${v} hasta llegar al precio.`, `Compte de ${v} en ${v} jusqu'au prix.`, `Epapa ${v} ha ${v} hepy peve.`),
    explicacion: tx(`Contando de ${v} en ${v}: ${Array.from({ length: n }, (_, i) => v * (i + 1)).join(", ")}. Son ${n} monedas de ${v}.`, `En comptant de ${v} en ${v} : ${Array.from({ length: n }, (_, i) => v * (i + 1)).join(", ")}. Il faut ${n} pièces de ${v}.`, `Epapávo ${v} ha ${v}: ${Array.from({ length: n }, (_, i) => v * (i + 1)).join(", ")}. Ha'e ${n} moneda ${v}.`),
    plantilla: clave(T3B, "iguales", v, n),
  });
};

const unaMonedaDe = (v: number): string => tx(`Una moneda de ${v}`, `Une pièce de ${v}`, `Peteĩ moneda ${v}`);

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
    enunciado: tx(`El precio es ${valorDinero(precio)}. Mira lo que ya has puesto. ¿Qué moneda falta para pagar justo?`, `Le prix est ${valorDinero(precio)}. Regarde ce que tu as déjà mis. Quelle pièce manque pour payer juste ?`, `Hepy ${valorDinero(precio)}. Emañá remoĩmava. Mba'e monedápa ofalta repaga hag̃ua hekopete?`),
    enunciadoFacil: tx(`El precio es ${valorDinero(precio)}. Mira lo que ya has puesto. ¿Qué moneda falta?`, `Le prix est ${valorDinero(precio)}. Regarde ce que tu as déjà mis. Quelle pièce manque ?`, `Hepy ${valorDinero(precio)}. Emañá remoĩmava. Mba'e monedápa ofalta?`),
    imagen: imagenMonedas(puestas),
    respuesta: { tipo: "opcion", correcta: unaMonedaDe(v), distractores: distractoresTexto(rng, unaMonedaDe(v), otras, 3) },
    pista: tx("Suma lo que ya has puesto y piensa cuánto queda para llegar al precio.", `Additionne ce que tu as déjà mis et pense à ce qu'il reste pour arriver au prix.`, `Embojoapy remoĩmava ha epensa mboýpa ofalta hepy peve.`),
    explicacion: tx(`Ya has puesto ${yaPuesto}. Del ${yaPuesto} al ${precio} ${v === 1 ? "falta" : "faltan"} ${v}, así que falta una moneda de ${v}.`, `Tu as déjà mis ${yaPuesto}. De ${yaPuesto} à ${precio}, il manque ${v} : il manque donc une pièce de ${v}.`, `Remoĩma ${yaPuesto}. ${yaPuesto}-gui ${precio} peve ofalta ${v}: ofalta peteĩ moneda ${v}.`),
    plantilla: clave(T3B, "falta", precio, v),
  });
};

const sobra = (): string => tx("Te sobra dinero", "Il te reste de l'argent", "Hemby ndéve pirapire");
const falta = (): string => tx("Te falta dinero", "Il te manque de l'argent", "Ofalta ndéve pirapire");
const justo = (): string => tx("Tienes lo justo", "Tu as juste ce qu'il faut", "Reguereko hekopete");

const meAlcanza: Generador = (rng, d) => {
  const [SOBRA, FALTA, JUSTO] = [sobra(), falta(), justo()];
  const valores = monedasDeDificultad(rng, d);
  const total = suma(valores);
  const hueco = entero(rng, ...porR(d, [5, 9], [2, 4], [1, 1]));
  const caso = elegir(rng, ["sobra", "falta", "justo"] as const);
  const precio = caso === "justo" ? total : caso === "sobra" ? Math.max(1, total - hueco) : total + hueco;
  const correcta = caso === "justo" ? JUSTO : caso === "sobra" ? SOBRA : FALTA;
  const u = elegir(rng, ARTICULOS);
  const final = caso === "justo" ? tx("Es la misma cantidad.", `C'est la même somme.`, `Ha'e peteĩcha.`) : caso === "sobra" ? tx(`${total - precio === 1 ? "Te sobra" : "Te sobran"} ${total - precio}.`, `Il te reste ${total - precio}.`, `Hemby ndéve ${total - precio}.`) : tx(`${precio - total === 1 ? "Te falta" : "Te faltan"} ${precio - total}.`, `Il te manque ${precio - total}.`, `Ofalta ndéve ${precio - total}.`);
  return pregunta(rng, {
    subhabilidad: T3B,
    dificultad: d,
    enunciado: tx(`Tienes estas monedas. ${mayus(unArticulo(u))} cuesta ${valorDinero(precio)}. ¿Qué pasa al pagar?`, `Tu as ces pièces. ${mayus(unArticulo(u))} coûte ${valorDinero(precio)}. Que se passe-t-il quand tu paies ?`, `Reguereko ko'ã moneda. ${mayus(unArticulo(u))} hepy ${valorDinero(precio)}. Mba'épa oiko repagávo?`),
    enunciadoFacil: tx(`Mira tus monedas. ${mayus(elArticulo(u))} cuesta ${valorDinero(precio)}. ¿Qué pasa al pagar?`, `Regarde tes pièces. ${mayus(elArticulo(u))} coûte ${valorDinero(precio)}. Que se passe-t-il quand tu paies ?`, `Emañá ne moneda-re. ${mayus(elArticulo(u))} hepy ${valorDinero(precio)}. Mba'épa oiko repagávo?`),
    imagen: imagenMonedas(valores),
    respuesta: { tipo: "opcion", correcta, distractores: [SOBRA, FALTA, JUSTO].filter((t) => t !== correcta) },
    pista: tx("Suma tus monedas y compara el total con el precio.", `Additionne tes pièces et compare le total avec le prix.`, `Embojoapy ne moneda ha embojoja hepy ndive.`),
    explicacion: tx(`Tus monedas valen ${total} y el precio es ${precio}. ${final}`, `Tes pièces valent ${total} et le prix est ${precio}. ${final}`, `Ne moneda hepy ${total} ha ojejogua ${precio}. ${final}`),
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

const pagoTexto = (pago: readonly number[]): string => (pago.length === 1 ? tx(`una moneda de ${en(pago, 0)}`, `une pièce de ${en(pago, 0)}`, `peteĩ moneda ${en(pago, 0)}`) : tx(`dos monedas de ${en(pago, 0)}`, `deux pièces de ${en(pago, 0)}`, `mokõi moneda ${en(pago, 0)}`));

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

const devuelven = (c: number): string => tx(`te devuelven ${valorDinero(c)}`, `on te rend ${valorDinero(c)}`, `ome'ẽ jey ndéve ${valorDinero(c)}`);

const cambioDirecto: Generador = (rng, d) => {
  const { pago, precio } = compraDe(rng, d);
  const pagado = suma(pago);
  const u = elegir(rng, ARTICULOS);
  const cambio = pagado - precio;
  return pregunta(rng, {
    subhabilidad: T3C,
    dificultad: d,
    enunciado: tx(`Compras ${unArticulo(u)} que cuesta ${valorDinero(precio)}. Pagas con ${pagoTexto(pago)}. ¿Cuánto dinero te devuelven?`, `Tu achètes ${unArticulo(u)} qui coûte ${valorDinero(precio)}. Tu paies avec ${pagoTexto(pago)}. Combien d'argent te rend-on ?`, `Rejogua ${unArticulo(u)} hepýva ${valorDinero(precio)}. Repaga ${pagoTexto(pago)} reheve. Mboýpa ome'ẽ jey ndéve?`),
    enunciadoFacil: tx(`${mayus(elArticulo(u))} cuesta ${valorDinero(precio)}. Pagas con ${pagoTexto(pago)}. ¿Cuánto te devuelven?`, `${mayus(elArticulo(u))} coûte ${valorDinero(precio)}. Tu paies avec ${pagoTexto(pago)}. Combien te rend-on ?`, `${mayus(elArticulo(u))} hepy ${valorDinero(precio)}. Repaga ${pagoTexto(pago)} reheve. Mboýpa ome'ẽ jey ndéve?`),
    imagen: imagenMonedas(pago),
    respuesta: respuestaCambio(rng, d, pagado, precio),
    pista: tx("Piensa cuánto falta desde el precio hasta lo que has pagado.", `Pense à ce qu'il manque entre le prix et ce que tu as payé.`, `Epensa mboýpa ofalta hepy guive repagava peve.`),
    explicacion: tx(`Has pagado ${pagado} y cuesta ${precio}: ${pagado} − ${precio} = ${cambio}. Por eso ${devuelven(cambio)}.`, `Tu as payé ${pagado} et ça coûte ${precio} : ${pagado} − ${precio} = ${cambio}. C'est pourquoi ${devuelven(cambio)}.`, `Repaga ${pagado} ha hepy ${precio}: ${pagado} − ${precio} = ${cambio}. Upévare ${devuelven(cambio)}.`),
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
    enunciado: tx(`${mayus(unArticulo(u))} cuesta ${valorDinero(precio)} y pagas con ${pagoTexto(pago)}. Toca las monedas que te devuelven.`, `${mayus(unArticulo(u))} coûte ${valorDinero(precio)} et tu paies avec ${pagoTexto(pago)}. Touche les pièces qu'on te rend.`, `${mayus(unArticulo(u))} hepy ${valorDinero(precio)} ha repaga ${pagoTexto(pago)} reheve. Epoko moneda ome'ẽ jeýva ndéve.`),
    enunciadoFacil: tx(`${mayus(elArticulo(u))} cuesta ${valorDinero(precio)}. Pagas con ${pagoTexto(pago)}. ¿Qué monedas te devuelven?`, `${mayus(elArticulo(u))} coûte ${valorDinero(precio)}. Tu paies avec ${pagoTexto(pago)}. Quelles pièces te rend-on ?`, `${mayus(elArticulo(u))} hepy ${valorDinero(precio)}. Repaga ${pagoTexto(pago)} reheve. Mba'e monedápa ome'ẽ jey ndéve?`),
    imagen: imagenMonedas(pago),
    respuesta: { tipo: "imagen", correcta: opcionMonedas(valores), distractores: variantesMonedas(rng, valores, [cambio], 2).map(opcionMonedas) },
    pista: tx("Calcula primero el cambio. Después suma cada grupo de monedas.", `Calcule d'abord la monnaie. Ensuite, additionne chaque groupe de pièces.`, `Ejuhu raẽ vuelto. Upéi embojoapy peteĩteĩ aty moneda.`),
    explicacion: tx(`${pagado} − ${precio} = ${cambio}, y esas monedas suman ${cambio}.`, `${pagado} − ${precio} = ${cambio}, et ces pièces font ${cambio}.`, `${pagado} − ${precio} = ${cambio}, ha ko'ã moneda ojapo ${cambio}.`),
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
    enunciado: tx(`Compras ${unArticulo(u)} y pagas con ${pagoTexto(compra.pago)}. Te devuelven ${valorDinero(cambio)}. ¿Cuánto cuesta ${elArticulo(u)}?`, `Tu achètes ${unArticulo(u)} et tu paies avec ${pagoTexto(compra.pago)}. On te rend ${valorDinero(cambio)}. Combien coûte ${elArticulo(u)} ?`, `Rejogua ${unArticulo(u)} ha repaga ${pagoTexto(compra.pago)} reheve. Ome'ẽ jey ndéve ${valorDinero(cambio)}. Mboýpa hepy ${elArticulo(u)}?`),
    enunciadoFacil: tx(`Pagas con ${pagoTexto(compra.pago)}. Te devuelven ${valorDinero(cambio)}. ¿Cuánto cuesta ${elArticulo(u)}?`, `Tu paies avec ${pagoTexto(compra.pago)}. On te rend ${valorDinero(cambio)}. Combien coûte ${elArticulo(u)} ?`, `Repaga ${pagoTexto(compra.pago)} reheve. Ome'ẽ jey ndéve ${valorDinero(cambio)}. Mboýpa hepy ${elArticulo(u)}?`),
    imagen: imagenMonedas(compra.pago),
    respuesta: respuestaNum(rng, d, precio, [pagado + cambio, cambio, precio + 1, precio - 1, precio + 10].filter((x) => x > 0)),
    pista: tx("Lo que pagas se divide en dos partes: el precio y lo que te devuelven.", `Ce que tu paies se divise en deux parties : le prix et ce qu'on te rend.`, `Repagava oñemboja'o mokõime: hepy ha ome'ẽ jeýva ndéve.`),
    explicacion: tx(`${pagado} − ${cambio} = ${precio}. Cuesta ${valorDinero(precio)}.`, `${pagado} − ${cambio} = ${precio}. Ça coûte ${valorDinero(precio)}.`, `${pagado} − ${cambio} = ${precio}. Hepy ${valorDinero(precio)}.`),
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
  const compra = d === 3 ? tx(`${elArticulo(a)} y ${elArticulo(b)}`, `${elArticulo(a)} et ${elArticulo(b)}`, `${elArticulo(a)} ha ${elArticulo(b)}`) : elArticulo(a);
  const cambio = pago - coste;
  return pregunta(rng, {
    subhabilidad: T3C,
    dificultad: d,
    enunciado: tx(`Mira los precios. Compras ${compra} y pagas con una moneda de ${pago}. ¿Cuánto dinero te devuelven?`, `Regarde les prix. Tu achètes ${compra} et tu paies avec une pièce de ${pago}. Combien d'argent te rend-on ?`, `Emañá hepy. Rejogua ${compra} ha repaga peteĩ moneda ${pago} reheve. Mboy pirapirepa ome'ẽ jey ndéve?`),
    enunciadoFacil: tx(`Busca el precio. Compras ${compra}. Pagas con una moneda de ${pago}. ¿Cuánto te devuelven?`, `Cherche le prix. Tu achètes ${compra}. Tu paies avec une pièce de ${pago}. Combien te rend-on ?`, `Eheka hepy. Rejogua ${compra}. Repaga peteĩ moneda ${pago} reheve. Mboýpa ome'ẽ jey ndéve?`),
    imagen: {
      tipo: "cartel",
      estilo: "etiqueta",
      titulo: tx("Precios", `Prix`, `Hepy`),
      lineas: [`${mayus(sg(a))}: ${valorDinero(qa)}`, `${mayus(sg(b))}: ${valorDinero(qb)}`, `${mayus(sg(c))}: ${valorDinero(qc)}`],
    },
    respuesta: respuestaCambio(rng, d, pago, coste),
    pista: d === 3 ? tx("Suma primero lo que cuestan las dos cosas.", `Additionne d'abord le prix des deux choses.`, `Embojoapy raẽ mokõive mba'e hepy.`) : tx("Busca el precio en el cartel y piensa cuánto falta hasta lo que pagas.", `Cherche le prix sur l'affiche et pense à ce qu'il manque jusqu'à ce que tu paies.`, `Eheka hepy cartel-pe ha epensa mboýpa ofalta repagava peve.`),
    explicacion: d === 3
      ? tx(`${qa} + ${qb} = ${coste}, y ${pago} − ${coste} = ${cambio}. Por eso ${devuelven(cambio)}.`, `${qa} + ${qb} = ${coste}, et ${pago} − ${coste} = ${cambio}. C'est pourquoi ${devuelven(cambio)}.`, `${qa} + ${qb} = ${coste}, ha ${pago} − ${coste} = ${cambio}. Upévare ${devuelven(cambio)}.`)
      : tx(`${pago} − ${coste} = ${cambio}. Por eso ${devuelven(cambio)}.`, `${pago} − ${coste} = ${cambio}. C'est pourquoi ${devuelven(cambio)}.`, `${pago} − ${coste} = ${cambio}. Upévare ${devuelven(cambio)}.`),
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

const esHora = (h: number, m: 0 | 30): string => tx(`${h === 1 ? "es" : "son"} ${hora(h, m)}`, `il est ${hora(h, m)}`, `ko'ágã ${hora(h, m)}`);

const explicarHora = (h: number, m: 0 | 30): string =>
  m === 0
    ? tx(`La aguja larga está en el 12 y la corta en el ${h}: ${esHora(h, 0)}.`, `La grande aiguille est sur le 12 et la petite sur le ${h} : ${esHora(h, 0)}.`, `Aguja puku oĩ 12-pe ha aguja mbyky oĩ ${h}-pe: ${esHora(h, 0)}.`)
    : tx(`La aguja larga está en el 6 y la corta ha pasado del ${h}: ${esHora(h, 30)}.`, `La grande aiguille est sur le 6 et la petite a dépassé le ${h} : ${esHora(h, 30)}.`, `Aguja puku oĩ 6-pe ha aguja mbyky ohasáma ${h}-gui: ${esHora(h, 30)}.`);

const leerReloj: Generador = (rng, d) => {
  const { h, m } = horaPara(rng, d);
  return pregunta(rng, {
    subhabilidad: T4A,
    dificultad: d,
    enunciado: tx("¿Qué hora marca el reloj?", `Quelle heure indique l'horloge ?`, `Mba'e aravópa ohechauka aravopapaha?`),
    enunciadoFacil: tx("Mira las agujas del reloj. ¿Qué hora es?", `Regarde les aiguilles de l'horloge. Quelle heure est-il ?`, `Emañá aravopapaha aguja-re. Mba'e aravópa?`),
    imagen: reloj(h, m),
    respuesta: { tipo: "opcion", correcta: H(h, m), distractores: horasFalsas(h, m).map((f) => H(f.h, f.m)) },
    pista: tx("Mira primero la aguja larga: en el 12 es en punto y en el 6 es y media.", `Regarde d'abord la grande aiguille : sur le 12, c'est l'heure pile ; sur le 6, c'est la demie.`, `Emañá raẽ aguja puku-re: 12-pe aravo teete, 6-pe aravo ha mbyte.`),
    explicacion: explicarHora(h, m),
    plantilla: clave(T4A, "leer", h, m),
  });
};

const tocarReloj: Generador = (rng, d) => {
  const { h, m } = horaPara(rng, d);
  const opcion = (hh: number, mm: 0 | 30): OpcionImagen => ({ texto: tx(`Reloj con ${hora(hh, mm)}`, `Horloge à ${hora(hh, mm)}`, `Aravopapaha ${hora(hh, mm)}`), imagen: reloj(hh, mm) });
  return pregunta(rng, {
    subhabilidad: T4A,
    dificultad: d,
    enunciado: tx(`Toca el reloj que marca ${hora(h, m)}.`, `Touche l'horloge qui indique ${hora(h, m)}.`, `Epoko aravopapaha ohechaukáva ${hora(h, m)}.`),
    enunciadoFacil: tx(`Busca el reloj con ${hora(h, m)}. Tócalo.`, `Cherche l'horloge à ${hora(h, m)}. Touche-la.`, `Eheka aravopapaha ${hora(h, m)}. Epoko.`),
    respuesta: { tipo: "imagen", correcta: opcion(h, m), distractores: horasFalsas(h, m).map((f) => opcion(f.h, f.m)) },
    pista: tx("Mira dónde está la aguja larga en cada reloj. Después mira la corta.", `Regarde où est la grande aiguille sur chaque horloge. Ensuite, regarde la petite.`, `Emañá moõpa oĩ aguja puku peteĩteĩ aravopapahápe. Upéi emañá aguja mbyky-re.`),
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
    enunciado: tx(`¿Cómo se dice esta hora: ${digital}?`, `Comment se dit cette heure : ${digital} ?`, `Mba'éicha oje'e ko aravo: ${digital}?`),
    enunciadoFacil: tx(`Lee la hora: ${digital}. ¿Cómo se dice?`, `Lis l'heure : ${digital}. Comment se dit-elle ?`, `Emoñe'ẽ aravo: ${digital}. Mba'éicha oje'e?`),
    respuesta: { tipo: "opcion", correcta: H(h, m), distractores: horasFalsas(h, m).map((f) => H(f.h, f.m)) },
    pista: tx("Los números de la derecha son los minutos: 00 es en punto y 30 es y media.", `Les chiffres de droite sont les minutes : 00, c'est l'heure pile, et 30, c'est la demie.`, `Papapy akatúa gotyo ha'e aravo'i: 00 ha'e aravo teete ha 30 ha'e mbyte.`),
    explicacion: tx(`En ${digital}, el ${h} es la hora y ${m === 0 ? "00 quiere decir en punto" : "30 quiere decir y media"}. Por eso ${esHora(h, m)}.`, `Dans ${digital}, le ${h} donne l'heure et ${m === 0 ? "00 veut dire l'heure pile" : "30 veut dire et demie"}. C'est pourquoi ${esHora(h, m)}.`, `${digital}-pe, ${h} ha'e aravo ha ${m === 0 ? "00 he'ise aravo teete" : "30 he'ise mbyte"}. Upévare ${esHora(h, m)}.`),
    plantilla: clave(T4A, "escrita", h, m),
  });
};

const agujas: Generador = (rng, d) => {
  const { h, m } = horaPara(rng, d);
  const sig = horaCiclo(h + 1);
  const descripcion = m === 0
    ? tx(`La aguja larga señala el 12 y la aguja corta señala el ${h}.`, `La grande aiguille montre le 12 et la petite aiguille montre le ${h}.`, `Aguja puku ohechauka 12 ha aguja mbyky ohechauka ${h}.`)
    : tx(`La aguja larga señala el 6 y la aguja corta está entre el ${h} y el ${sig}.`, `La grande aiguille montre le 6 et la petite aiguille est entre le ${h} et le ${sig}.`, `Aguja puku ohechauka 6 ha aguja mbyky oĩ ${h} ha ${sig} pa'ũme.`);
  return pregunta(rng, {
    subhabilidad: T4A,
    dificultad: d,
    enunciado: tx(`${descripcion} ¿Qué hora es?`, `${descripcion} Quelle heure est-il ?`, `${descripcion} Mba'e aravópa?`),
    enunciadoFacil: tx(`${descripcion} ¿Qué hora es?`, `${descripcion} Quelle heure est-il ?`, `${descripcion} Mba'e aravópa?`),
    respuesta: { tipo: "opcion", correcta: H(h, m), distractores: horasFalsas(h, m).map((f) => H(f.h, f.m)) },
    pista: tx("La aguja larga dice si es en punto o y media. La corta dice la hora.", `La grande aiguille dit si c'est l'heure pile ou la demie. La petite dit l'heure.`, `Aguja puku he'i aravo teete térã mbyte. Aguja mbyky he'i aravo.`),
    explicacion: explicarHora(h, m),
    plantilla: clave(T4A, "agujas", h, m),
  });
};

const T4B = "NUM2-T4-b";
const M = (i: number): string => mayus(mes(i));

const mesVecino: Generador = (rng, d) => {
  const i = d === 3 ? elegir(rng, [9, 10, 11, 0, 1]) : entero(rng, 1, 10);
  const salto = porD(d, 1, -1, 2);
  const frase = porD(d, tx(`justo después de ${mes(i)}`, `juste après ${mes(i)}`, `${mes(i)} rire`), tx(`justo antes de ${mes(i)}`, `juste avant ${mes(i)}`, `${mes(i)} mboyve`), tx(`dos meses después de ${mes(i)}`, `deux mois après ${mes(i)}`, `${mes(i)} rire mokõi jasy`));
  const correcto = i + salto;
  return pregunta(rng, {
    subhabilidad: T4B,
    dificultad: d,
    enunciado: tx(`¿Qué mes va ${frase}?`, `Quel mois vient ${frase} ?`, `Mba'e jasýpa ou ${frase}?`),
    enunciadoFacil: tx(`Di los meses en orden. ¿Qué mes va ${frase}?`, `Dis les mois dans l'ordre. Quel mois vient ${frase} ?`, `Ere jasykuéra rysýi. Mba'e jasýpa ou ${frase}?`),
    respuesta: { tipo: "opcion", correcta: M(correcto), distractores: distractoresTexto(rng, M(correcto), [M(i), M(i + 1), M(i - 1), M(i + 2), M(i + 3)], 3) },
    pista: tx("Di los meses del año en orden, en voz alta. Después de diciembre vuelve enero.", `Dis les mois de l'année dans l'ordre, à voix haute. Après décembre, on revient à janvier.`, `Ere jasykuéra rysýi, hatãme. Jasypakõi rire ou jey jasyteĩ.`),
    explicacion: d === 3 ? tx(`Después de ${mes(i)} va ${mes(i + 1)}, y después ${mes(correcto)}.`, `Après ${mes(i)} vient ${mes(i + 1)}, puis ${mes(correcto)}.`, `${mes(i)} rire ou ${mes(i + 1)}, upéi ${mes(correcto)}.`) : d === 1 ? tx(`Después de ${mes(i)} va ${mes(correcto)}.`, `Après ${mes(i)} vient ${mes(correcto)}.`, `${mes(i)} rire ou ${mes(correcto)}.`) : tx(`Antes de ${mes(i)} va ${mes(correcto)}.`, `Avant ${mes(i)} vient ${mes(correcto)}.`, `${mes(i)} mboyve ou ${mes(correcto)}.`),
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
    enunciado: directa ? tx(`Si empiezas a contar en enero, ¿qué mes es el número ${n}?`, `Si tu commences à compter en janvier, quel mois est le numéro ${n} ?`, `Repapárõ jasyteĩgui, mba'e jasýpa ha'e papapy ${n}?`) : tx(`Si empiezas a contar en enero, ¿qué número de mes es ${mes(i)}?`, `Si tu commences à compter en janvier, quel numéro a le mois ${deM(i)} ?`, `Repapárõ jasyteĩgui, mba'e papapýpa ha'e ${mes(i)}?`),
    enunciadoFacil: directa ? tx(`Enero es el mes 1. ¿Qué mes es el número ${n}?`, `Janvier est le mois 1. Quel mois est le numéro ${n} ?`, `Jasyteĩ ha'e jasy 1. Mba'e jasýpa ha'e papapy ${n}?`) : tx(`Enero es el mes 1. ¿Qué número es ${mes(i)}?`, `Janvier est le mois 1. Quel numéro a ${mes(i)} ?`, `Jasyteĩ ha'e jasy 1. Mba'e papapýpa ha'e ${mes(i)}?`),
    respuesta: directa
      ? { tipo: "opcion", correcta: M(i), distractores: distractoresTexto(rng, M(i), otros, 3) }
      : respuestaNum(rng, d, n, [n + 1, n - 1, n + 2].filter((x) => x > 0 && x <= 12)),
    pista: tx("Cuenta con los dedos mientras dices los meses desde enero.", `Compte sur tes doigts en disant les mois depuis janvier.`, `Epapa nde kuã rehe ere aja jasykuéra jasyteĩgui.`),
    explicacion: tx(`Contando desde enero, ${mes(i)} es el mes número ${n}.`, `En comptant depuis janvier, ${mes(i)} est le mois numéro ${n}.`, `Epapávo jasyteĩgui, ${mes(i)} ha'e jasy ${n}.`),
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

const datos = (): Readonly<Record<Dificultad, readonly Dato[]>> => ({
  1: [
    { clave: "semana", enunciado: tx("¿Cuántos días tiene una semana?", `Combien de jours y a-t-il dans une semaine ?`, `Mboy árapa oguereko peteĩ arapokõindy?`), facil: tx("Cuenta los días de una semana.", `Compte les jours d'une semaine.`, `Epapa peteĩ arapokõindy ára.`), valor: 7, explicacion: tx("La semana tiene 7 días.", `La semaine a 7 jours.`, `Arapokõindy oguereko 7 ára.`), falsos: [5, 12, 30] },
    { clave: "anio", enunciado: tx("¿Cuántos meses tiene un año?", `Combien de mois y a-t-il dans une année ?`, `Mboy jasýpa oguereko peteĩ ary?`), facil: tx("Cuenta los meses de un año.", `Compte les mois d'une année.`, `Epapa peteĩ ary jasy.`), valor: 12, explicacion: tx("El año tiene 12 meses, de enero a diciembre.", `L'année a 12 mois, de janvier à décembre.`, `Ary oguereko 12 jasy, jasyteĩgui jasypakõi peve.`), falsos: [7, 10, 30] },
  ],
  2: [
    { clave: "2sem", enunciado: tx("¿Cuántos días hay en 2 semanas?", `Combien de jours y a-t-il dans 2 semaines ?`, `Mboy árapa oĩ 2 arapokõindýpe?`), facil: tx("Una semana tiene 7 días. ¿Cuántos días hay en 2 semanas?", `Une semaine a 7 jours. Combien de jours y a-t-il dans 2 semaines ?`, `Arapokõindy oguereko 7 ára. Mboy árapa oĩ 2 arapokõindýpe?`), valor: 14, explicacion: tx("7 + 7 = 14 días.", `7 + 7 = 14 jours.`, `7 + 7 = 14 ára.`), falsos: [7, 9, 12] },
    { clave: "3sem", enunciado: tx("¿Cuántos días hay en 3 semanas?", `Combien de jours y a-t-il dans 3 semaines ?`, `Mboy árapa oĩ 3 arapokõindýpe?`), facil: tx("Una semana tiene 7 días. ¿Cuántos días hay en 3 semanas?", `Une semaine a 7 jours. Combien de jours y a-t-il dans 3 semaines ?`, `Arapokõindy oguereko 7 ára. Mboy árapa oĩ 3 arapokõindýpe?`), valor: 21, explicacion: tx("7 + 7 + 7 = 21 días.", `7 + 7 + 7 = 21 jours.`, `7 + 7 + 7 = 21 ára.`), falsos: [14, 10, 28] },
    { clave: "medio", enunciado: tx("¿Cuántos meses hay en medio año?", `Combien de mois y a-t-il dans une demi-année ?`, `Mboy jasýpa oĩ ary mbytépe?`), facil: tx("Un año tiene 12 meses. ¿Cuántos meses hay en medio año?", `Une année a 12 mois. Combien de mois y a-t-il dans une demi-année ?`, `Ary oguereko 12 jasy. Mboy jasýpa oĩ ary mbytépe?`), valor: 6, explicacion: tx("La mitad de 12 es 6.", `La moitié de 12, c'est 6.`, `12 mbyte ha'e 6.`), falsos: [4, 12, 8] },
  ],
  3: [
    ...[0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i): Dato => ({
      clave: `dias-${i}`,
      enunciado: tx(`¿Cuántos días tiene el mes de ${mes(i)}?`, `Combien de jours a le mois ${deM(i)} ?`, `Mboy árapa oguereko ${mes(i)}?`),
      facil: tx(`Piensa en ${mes(i)}. ¿Cuántos días tiene?`, `Pense au mois ${deM(i)}. Combien de jours a-t-il ?`, `Epensa ${mes(i)}-re. Mboy árapa oguereko?`),
      valor: en(DIAS_MES, i),
      explicacion: tx(`El mes de ${mes(i)} tiene ${en(DIAS_MES, i)} días.`, `Le mois ${deM(i)} a ${en(DIAS_MES, i)} jours.`, `${mayus(mes(i))} oguereko ${en(DIAS_MES, i)} ára.`),
      falsos: en(DIAS_MES, i) === 31 ? [30, 28, 7] : [31, 28, 7],
    })),
    { clave: "4sem", enunciado: tx("¿Cuántos días hay en 4 semanas?", `Combien de jours y a-t-il dans 4 semaines ?`, `Mboy árapa oĩ 4 arapokõindýpe?`), facil: tx("Una semana tiene 7 días. ¿Cuántos días hay en 4 semanas?", `Une semaine a 7 jours. Combien de jours y a-t-il dans 4 semaines ?`, `Arapokõindy oguereko 7 ára. Mboy árapa oĩ 4 arapokõindýpe?`), valor: 28, explicacion: tx("7 + 7 + 7 + 7 = 28 días.", `7 + 7 + 7 + 7 = 28 jours.`, `7 + 7 + 7 + 7 = 28 ára.`), falsos: [21, 11, 30] },
    { clave: "2anios", enunciado: tx("¿Cuántos meses hay en 2 años?", `Combien de mois y a-t-il dans 2 ans ?`, `Mboy jasýpa oĩ 2 arýpe?`), facil: tx("Un año tiene 12 meses. ¿Cuántos meses hay en 2 años?", `Une année a 12 mois. Combien de mois y a-t-il dans 2 ans ?`, `Ary oguereko 12 jasy. Mboy jasýpa oĩ 2 arýpe?`), valor: 24, explicacion: tx("12 + 12 = 24 meses.", `12 + 12 = 24 mois.`, `12 + 12 = 24 jasy.`), falsos: [12, 14, 22] },
  ],
});

const datosDelCalendario: Generador = (rng, d) => {
  const dato = elegir(rng, datos()[d]);
  return pregunta(rng, {
    subhabilidad: T4B,
    dificultad: d,
    enunciado: dato.enunciado,
    enunciadoFacil: dato.facil,
    respuesta: opcionNumerica(rng, dato.valor, dato.falsos),
    pista: tx("Piensa en cómo es un calendario.", `Pense à un calendrier.`, `Epensa arapapaha-re.`),
    explicacion: dato.explicacion,
    plantilla: clave(T4B, "dato", dato.clave),
  });
};

const abreviados = (): readonly string[] => tx(["lun", "mar", "mié", "jue", "vie", "sáb", "dom"], ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"], ["teĩ", "kõi", "apy", "rundy", "po", "poteĩ", "pokõi"]);
const DIA_PLURAL = (i: number): string => tx(i === 5 ? "sábados" : i === 6 ? "domingos" : dia(i), `${dia(i)}s`, dia(i));

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
  return { tipo: "tabla", titulo: tx(`Calendario de ${mes(i)}`, `Calendrier ${deM(i)}`, `Arapapaha: ${mes(i)}`), cabeceras: abreviados(), filas };
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
        enunciado: tx(`Mira el calendario. ¿Cuántos ${DIA_PLURAL(s)} tiene este mes?`, `Regarde le calendrier. Combien de ${DIA_PLURAL(s)} y a-t-il ce mois-ci ?`, `Emañá arapapaha-re. Mboy ${dia(s)}-pa oguereko ko jasy?`),
        enunciadoFacil: tx(`Mira la columna de ${DIA_PLURAL(s)}. Cuenta los números.`, `Regarde la colonne des ${DIA_PLURAL(s)}. Compte les nombres.`, `Emañá ${dia(s)} rysýi-re. Epapa papapy.`),
        imagen,
        respuesta: { tipo: "numero", valor: veces },
        pista: tx("Busca la columna de ese día y cuenta solo las casillas con número.", `Cherche la colonne de ce jour et compte seulement les cases avec un nombre.`, `Eheka upe ára rysýi ha epapa papapy oĩháme añoite.`),
        explicacion: tx(`En la columna de ${DIA_PLURAL(s)} hay ${veces} números.`, `Dans la colonne des ${DIA_PLURAL(s)}, il y a ${veces} nombres.`, `${mayus(dia(s))} rysýipe oĩ ${veces} papapy.`),
        plantilla: clave(T4B, "cal-cuantos", i, inicio, s),
      });
    }
    const n = entero(rng, 1, dias - 7);
    return pregunta(rng, {
      subhabilidad: T4B,
      dificultad: d,
      enunciado: tx(`Mira el calendario. Hoy es día ${n}. ¿Qué día del mes será dentro de una semana?`, `Regarde le calendrier. Aujourd'hui, c'est le ${n}. Quel jour du mois serons-nous dans une semaine ?`, `Emañá arapapaha-re. Ko árape ha'e ${n}. Mba'e árapa oikóta peteĩ arapokõindy rire?`),
      enunciadoFacil: tx(`Hoy es día ${n}. Pasa una semana. ¿Qué día del mes será?`, `Aujourd'hui, c'est le ${n}. Une semaine passe. Quel jour du mois serons-nous ?`, `Ko árape ha'e ${n}. Ohasa peteĩ arapokõindy. Mba'e árapa oikóta?`),
      imagen,
      respuesta: { tipo: "numero", valor: n + 7 },
      pista: tx("En el calendario, baja una fila en la misma columna.", `Sur le calendrier, descends d'une ligne dans la même colonne.`, `Arapapaha-pe, eguejy peteĩ rysýi upe columna-pe.`),
      explicacion: tx(`Una semana son 7 días: ${n} + 7 = ${n + 7}.`, `Une semaine, c'est 7 jours : ${n} + 7 = ${n + 7}.`, `Arapokõindy ha'e 7 ára: ${n} + 7 = ${n + 7}.`),
      plantilla: clave(T4B, "cal-semana", i, n),
    });
  }
  const n = d === 1 ? entero(rng, 1, 7 - inicio) : entero(rng, 8, dias);
  const s = (n - 1 + inicio) % 7;
  const correcta = mayus(dia(s));
  return pregunta(rng, {
    subhabilidad: T4B,
    dificultad: d,
    enunciado: tx(`Mira el calendario. ¿Qué día de la semana es el día ${n}?`, `Regarde le calendrier. Quel jour de la semaine est le ${n} ?`, `Emañá arapapaha-re. Mba'e árapa ha'e ${n}?`),
    enunciadoFacil: tx(`Busca el número ${n}. Mira arriba. ¿Qué día es?`, `Cherche le nombre ${n}. Regarde en haut. Quel jour est-ce ?`, `Eheka papapy ${n}. Emañá yvate gotyo. Mba'e árapa?`),
    imagen,
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, [s - 1, s + 1, s + 2, s - 2].map((x) => mayus(dia(x))), 3) },
    pista: tx("Busca el número y sube por su columna hasta el nombre del día.", `Cherche le nombre et remonte sa colonne jusqu'au nom du jour.`, `Eheka papapy ha ejupi ára réra peve.`),
    explicacion: tx(`El día ${n} está en la columna de ${dia(s)}.`, `Le ${n} est dans la colonne du ${dia(s)}.`, `${n} oĩ ${dia(s)} rysýipe.`),
    plantilla: clave(T4B, "cal-dia", i, inicio, n),
  });
};

const T4C = "NUM2-T4-c";

interface Salto {
  readonly texto: string;
  readonly medias: number;
  readonly futuro: boolean;
}

const saltos = (): Readonly<Record<Dificultad, readonly Salto[]>> => ({
  1: [{ texto: tx("dentro de una hora", `dans une heure`, `peteĩ aravo rire`), medias: 2, futuro: true }],
  2: [{ texto: tx("hace una hora", `il y a une heure`, `peteĩ aravo mboyve`), medias: -2, futuro: false }, { texto: tx("dentro de media hora", `dans une demi-heure`, `aravo mbyte rire`), medias: 1, futuro: true }],
  3: [{ texto: tx("hace media hora", `il y a une demi-heure`, `aravo mbyte mboyve`), medias: -1, futuro: false }, { texto: tx("dentro de una hora y media", `dans une heure et demie`, `peteĩ aravo ha mbyte rire`), medias: 3, futuro: true }, { texto: tx("dentro de dos horas", `dans deux heures`, `mokõi aravo rire`), medias: 4, futuro: true }, { texto: tx("hace dos horas", `il y a deux heures`, `mokõi aravo mboyve`), medias: -4, futuro: false }],
});

function moverHora(h: number, m: 0 | 30, medias: number): HoraFalsa {
  const total = h * 2 + (m === 30 ? 1 : 0) + medias;
  return { h: horaCiclo(Math.floor(total / 2)), m: ((total % 2) + 2) % 2 === 0 ? 0 : 30 };
}

const horaAntesDespues: Generador = (rng, d) => {
  const h = entero(rng, 1, 12);
  const m = d === 1 ? 0 : elegir(rng, [0, 30] as const);
  const salto = elegir(rng, saltos()[d]);
  const destino = moverHora(h, m, salto.medias);
  const contraria = moverHora(h, m, -salto.medias);
  const correcta = H(destino.h, destino.m);
  const falsos = [H(contraria.h, contraria.m), H(h, m), ...[1, -1, 2, -2, 3].map((x) => moverHora(destino.h, destino.m, x)).map((f) => H(f.h, f.m))];
  const verbo = salto.futuro ? tx("¿Qué hora será", `Quelle heure sera-t-il`, `Mba'e aravópa oikóta`) : tx("¿Qué hora era", `Quelle heure était-il`, `Mba'e aravópa oikova'ekue`);
  const son = h === 1 ? "Es" : "Son";
  return pregunta(rng, {
    subhabilidad: T4C,
    dificultad: d,
    enunciado: tx(`${son} ${hora(h, m)}. ${verbo} ${salto.texto}?`, `Il est ${hora(h, m)}. ${verbo} ${salto.texto} ?`, `Ko'ágã ${hora(h, m)}. ${verbo} ${salto.texto}?`),
    enunciadoFacil: tx(`Mira el reloj: ${hora(h, m)}. ${verbo} ${salto.texto}?`, `Regarde l'horloge : ${hora(h, m)}. ${verbo} ${salto.texto} ?`, `Emañá aravopapaha-re: ${hora(h, m)}. ${verbo} ${salto.texto}?`),
    imagen: reloj(h, m),
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, falsos.slice(0, 5), 3) },
    pista: salto.futuro ? tx("Mueve las agujas hacia delante en tu cabeza.", `Avance les aiguilles dans ta tête.`, `Emongu'e aguja tenonde gotyo nde akãme.`) : tx("Mueve las agujas hacia atrás en tu cabeza.", `Recule les aiguilles dans ta tête.`, `Emongu'e aguja tapykue gotyo nde akãme.`),
    explicacion: tx(`Si ${son === "Es" ? "es" : "son"} ${hora(h, m)}, ${salto.texto} ${salto.futuro ? "serán" : "eran"} ${hora(destino.h, destino.m)}.`, `S'il est ${hora(h, m)}, ${salto.texto} il ${salto.futuro ? "sera" : "était"} ${hora(destino.h, destino.m)}.`, `Ko'ágã ${hora(h, m)}. ${mayus(salto.texto)} ${salto.futuro ? "oikóta" : "oikova'ekue"} ${hora(destino.h, destino.m)}.`).replace("serán la 1", "será la 1").replace("eran la 1", "era la 1"),
    plantilla: clave(T4C, "hora", h, m, salto.medias),
  });
};

const diaAntesDespues: Generador = (rng, d) => {
  const i = entero(rng, 0, 6);
  const caso = porD(
    d,
    elegir(rng, [{ t: tx("mañana", `demain`, `ko'ẽrõ`), s: 1 }, { t: tx("ayer", `hier`, `kuehe`), s: -1 }]),
    elegir(rng, [{ t: tx("dentro de 2 días", `dans 2 jours`, `2 ára rire`), s: 2 }, { t: tx("hace 2 días", `il y a 2 jours`, `2 ára mboyve`), s: -2 }]),
    elegir(rng, [{ t: tx("dentro de 3 días", `dans 3 jours`, `3 ára rire`), s: 3 }, { t: tx("hace 3 días", `il y a 3 jours`, `3 ára mboyve`), s: -3 }, { t: tx("dentro de 4 días", `dans 4 jours`, `4 ára rire`), s: 4 }, { t: tx("dentro de 7 días", `dans 7 jours`, `7 ára rire`), s: 7 }, { t: tx("hace 7 días", `il y a 7 jours`, `7 ára mboyve`), s: -7 }]),
  );
  const correcta = mayus(dia(i + caso.s));
  const verbo = caso.s > 0 ? "será" : "fue";
  return pregunta(rng, {
    subhabilidad: T4C,
    dificultad: d,
    enunciado: tx(`Hoy es ${dia(i)}. ¿Qué día ${verbo} ${caso.t}?`, `Aujourd'hui, c'est ${dia(i)}. Quel jour ${caso.s > 0 ? "sera-t-on" : "était-on"} ${caso.t} ?`, `Ko árape ha'e ${dia(i)}. Mba'e árapa ${caso.s > 0 ? "oikóta" : "oikova'ekue"} ${caso.t}?`),
    enunciadoFacil: tx(`Hoy es ${dia(i)}. ¿Qué día ${verbo} ${caso.t}?`, `Aujourd'hui, c'est ${dia(i)}. Quel jour ${caso.s > 0 ? "sera-t-on" : "était-on"} ${caso.t} ?`, `Ko árape ha'e ${dia(i)}. Mba'e árapa ${caso.s > 0 ? "oikóta" : "oikova'ekue"} ${caso.t}?`),
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, [i - caso.s, i, i + caso.s + 1, i + caso.s - 1, i + caso.s + 2].map((x) => mayus(dia(x))), 3) },
    pista: caso.s > 0 ? tx("Di los días en orden hacia delante desde hoy.", `Dis les jours dans l'ordre à partir d'aujourd'hui.`, `Ere ára rysýi ko árangue guive.`) : tx("Di los días hacia atrás desde hoy.", `Dis les jours à l'envers à partir d'aujourd'hui.`, `Ere ára tapykue gotyo ko árangue guive.`),
    explicacion: Math.abs(caso.s) === 7
      ? tx(`Cada 7 días se repite el mismo día. Por eso ${caso.t} ${verbo} ${dia(i)}.`, `Tous les 7 jours, le même jour revient. Donc ${caso.t}, ${caso.s > 0 ? "ce sera" : "c'était"} ${dia(i)}.`, `Káda 7 ára ou jey peteĩ ára. Upévare ${caso.t} ${caso.s > 0 ? "oikóta" : "oikova'ekue"} ${dia(i)}.`)
      : tx(`Si hoy es ${dia(i)}, ${caso.t} ${verbo} ${dia(i + caso.s)}.`, `Si aujourd'hui c'est ${dia(i)}, ${caso.t}, ${caso.s > 0 ? "ce sera" : "c'était"} ${dia(i + caso.s)}.`, `Ko árape ha'érõ ${dia(i)}, ${caso.t} ${caso.s > 0 ? "oikóta" : "oikova'ekue"} ${dia(i + caso.s)}.`),
    plantilla: clave(T4C, "dia", i, caso.s),
  });
};

const mesAntesDespues: Generador = (rng, d) => {
  const i = entero(rng, 0, 11);
  const salto = porD(d, 1, elegir(rng, [2, -1]), elegir(rng, [3, 4, -2, -3]));
  const frase = salto > 0 ? tx(`dentro de ${salto === 1 ? "1 mes" : `${salto} meses`}`, `dans ${salto} mois`, `${salto} jasy rire`) : tx(`hace ${salto === -1 ? "1 mes" : `${-salto} meses`}`, `il y a ${-salto} mois`, `${-salto} jasy mboyve`);
  const verbo = salto > 0 ? tx("¿En qué mes estaremos", `En quel mois serons-nous`, `Mba'e jasýpepa jaikóta`) : tx("¿En qué mes estábamos", `En quel mois étions-nous`, `Mba'e jasýpepa jaikova'ekue`);
  const correcta = M(i + salto);
  return pregunta(rng, {
    subhabilidad: T4C,
    dificultad: d,
    enunciado: tx(`Estamos en ${mes(i)}. ${verbo} ${frase}?`, `Nous sommes en ${mes(i)}. ${verbo} ${frase} ?`, `Ko'ágã ${mes(i)}. ${verbo} ${frase}?`),
    enunciadoFacil: tx(`Ahora es ${mes(i)}. ${verbo} ${frase}?`, `Maintenant, c'est ${mes(i)}. ${verbo} ${frase} ?`, `Ko'ágã ha'e ${mes(i)}. ${verbo} ${frase}?`),
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, [M(i - salto), M(i), M(i + salto + 1), M(i + salto - 1)], 3) },
    pista: tx("Di los meses en orden. Después de diciembre vuelve enero.", `Dis les mois dans l'ordre. Après décembre, on revient à janvier.`, `Ere jasykuéra rysýi. Jasypakõi rire ou jey jasyteĩ.`),
    explicacion: tx(`Si estamos en ${mes(i)}, ${frase} ${salto > 0 ? "estaremos" : "estábamos"} en ${mes(i + salto)}.`, `Si nous sommes en ${mes(i)}, ${frase} nous ${salto > 0 ? "serons" : "étions"} en ${mes(i + salto)}.`, `Ko'ágã ${mes(i)}. ${mayus(frase)} ${salto > 0 ? "jaikóta" : "jaikova'ekue"} ${mes(i + salto)}-pe.`),
    plantilla: clave(T4C, "mes", i, salto),
  });
};

const aLaVez = (): string => tx("Llegan a la vez", "En même temps", "Oñondive");

const quienLlegaAntes: Generador = (rng, d) => {
  const A_LA_VEZ = aLaVez();
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
  const final = ganador === A_LA_VEZ ? tx("Es la misma hora.", `C'est la même heure.`, `Ha'e aravo peteĩcha.`) : tx(`${ganador} llega ${pide}.`, `${ganador} arrive le plus ${pide === "antes" ? "tôt" : "tard"}.`, `${ganador} og̃uahẽ ${pide === "antes" ? "raẽ" : "upéi"}.`);
  return pregunta(rng, {
    subhabilidad: T4C,
    dificultad: d,
    enunciado: tx(`Por la mañana, ${x} llega a la escuela a ${hora(ha, ma)} y ${y} llega a ${hora(hb, mb)}. ¿Quién llega ${pide}?`, `Le matin, ${x} arrive à l'école à ${hora(ha, ma)} et ${y} arrive à ${hora(hb, mb)}. Qui arrive le plus ${pide === "antes" ? "tôt" : "tard"} ?`, `Pyhareve, ${x} og̃uahẽ mbo'ehaópe ${hora(ha, ma)} ha ${y} og̃uahẽ ${hora(hb, mb)}. Mávapa og̃uahẽ ${pide === "antes" ? "raẽ" : "upéi"}?`),
    enunciadoFacil: tx(`Por la mañana, ${x} llega a ${hora(ha, ma)}. ${y} llega a ${hora(hb, mb)}. ¿Quién llega ${pide}?`, `Le matin, ${x} arrive à ${hora(ha, ma)}. ${y} arrive à ${hora(hb, mb)}. Qui arrive le plus ${pide === "antes" ? "tôt" : "tard"} ?`, `Pyhareve, ${x} og̃uahẽ ${hora(ha, ma)}. ${y} og̃uahẽ ${hora(hb, mb)}. Mávapa og̃uahẽ ${pide === "antes" ? "raẽ" : "upéi"}?`),
    respuesta: { tipo: "opcion", correcta: ganador, distractores: [x, y, A_LA_VEZ].filter((t) => t !== ganador) },
    pista: tx("Piensa qué hora llega primero en el reloj.", `Pense à l'heure qui arrive d'abord sur l'horloge.`, `Epensa mba'e aravópa ou raẽ aravopapahápe.`),
    explicacion: tx(`Comparamos ${hora(ha, ma)} y ${hora(hb, mb)}. ${final}`, `On compare ${hora(ha, ma)} et ${hora(hb, mb)}. ${final}`, `Jambojoja ${hora(ha, ma)} ha ${hora(hb, mb)}. ${final}`),
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
    enunciado: tx(`Hay ${g} grupos de ${k} ${pl(u)}. ¿${cuantos(u)} ${pl(u)} hay en total?`, `Il y a ${g} groupes de ${k} ${pl(u)}. Combien ${dePl(u)} y a-t-il en tout ?`, `Oĩ ${g} aty ${k} ${pl(u)} rehegua. Mboy ${pl(u)}pa oĩ opaite?`),
    enunciadoFacil: tx(`Mira los grupos. Hay ${g} grupos. Cada grupo tiene ${k}. ¿${cuantos(u)} hay en total?`, `Regarde les groupes. Il y a ${g} groupes. Chaque groupe en a ${k}. Combien y en a-t-il en tout ?`, `Emañá aty-re. Oĩ ${g} aty. Peteĩteĩ aty oguereko ${k}. Mboýpa oĩ opaite?`),
    imagen: dibujoGrupos(u, iguales(g, k)),
    respuesta: respuestaNum(rng, d, t, [g + k, t + k, t - k, t + 1, t - 1]),
    pista: tx("Suma lo que hay en cada grupo, grupo por grupo.", `Additionne ce qu'il y a dans chaque groupe, groupe par groupe.`, `Embojoapy oĩva peteĩteĩ atýpe.`),
    explicacion: tx(`${sumaRepetida(g, k)} = ${t}. Hay ${cant(t, u)} en total.`, `${sumaRepetida(g, k)} = ${t}. Il y a ${cant(t, u)} en tout.`, `${sumaRepetida(g, k)} = ${t}. Oĩ ${cant(t, u)} opaite.`),
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
    enunciado: tx("¿Qué suma corresponde a estos grupos?", `Quelle addition correspond à ces groupes ?`, `Mba'e ñembojoapýpa oho ko'ã atýre?`),
    enunciadoFacil: tx("Mira los grupos. ¿Qué suma es?", `Regarde les groupes. Quelle addition est-ce ?`, `Emañá aty-re. Mba'e ñembojoapýpa?`),
    imagen: dibujoGrupos(u, iguales(g, k)),
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, [`${g} + ${k}`, sumaRepetida(g + 1, k), sumaRepetida(g - 1, k), sumaRepetida(g, k + 1), sumaRepetida(k, g)], 3) },
    pista: tx("Cuenta cuántos grupos hay y cuántos dibujos tiene cada uno.", `Compte combien il y a de groupes et combien de dessins dans chacun.`, `Epapa mboy aty oĩ ha mboy ta'anga oguereko peteĩteĩ.`),
    explicacion: tx(`Hay ${g} grupos de ${k}, así que sumamos ${g} veces el ${k}: ${correcta}.`, `Il y a ${g} groupes de ${k}. On additionne donc ${g} fois le ${k} : ${correcta}.`, `Oĩ ${g} aty ${k} rehegua. Jambojoapy ${g} jey ${k}: ${correcta}.`),
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
    enunciado: tx("¿Qué multiplicación corresponde a estos grupos?", `Quelle multiplication correspond à ces groupes ?`, `Mba'e ñembohetápa oho ko'ã atýre?`),
    enunciadoFacil: tx("Mira los grupos. ¿Qué multiplicación es?", `Regarde les groupes. Quelle multiplication est-ce ?`, `Emañá aty-re. Mba'e ñembohetápa?`),
    imagen: dibujoGrupos(u, iguales(g, k)),
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, falsos, 3) },
    pista: tx("Cuenta los grupos y lo que hay dentro de cada uno.", `Compte les groupes et ce qu'il y a dans chacun.`, `Epapa aty ha oĩva peteĩteĩme.`),
    explicacion: tx(`Hay ${g} grupos de ${k}: ${correcta} = ${g * k}.`, `Il y a ${g} groupes de ${k} : ${correcta} = ${g * k}.`, `Oĩ ${g} aty ${k} rehegua: ${correcta} = ${g * k}.`),
    plantilla: clave(T5A, "multi", g, k),
  });
};

const tocarGrupos: Generador = (rng, d) => {
  const [g0, k0] = gruposIguales(rng, d);
  const g = g0;
  const k = g0 === k0 ? k0 + 1 : k0;
  const u = elegir(rng, OBJETOS_GRUPOS);
  const opcion = (gg: number, kk: number): OpcionImagen => ({ texto: tx(`${gg} grupos de ${kk} ${pl(u)}`, `${gg} groupes de ${kk} ${pl(u)}`, `${gg} aty ${kk} ${pl(u)} rehegua`), imagen: dibujoGrupos(u, iguales(gg, kk)) });
  return pregunta(rng, {
    subhabilidad: T5A,
    dificultad: d,
    enunciado: tx(`Toca la imagen con ${g} grupos de ${k} ${pl(u)}.`, `Touche l'image avec ${g} groupes de ${k} ${pl(u)}.`, `Epoko ta'anga ${g} aty ${k} ${pl(u)} rehegua.`),
    enunciadoFacil: tx(`Busca ${g} grupos. Cada grupo tiene ${k} ${pl(u)}. Toca esa imagen.`, `Cherche ${g} groupes. Chaque groupe a ${k} ${pl(u)}. Touche cette image.`, `Eheka ${g} aty. Peteĩteĩ aty oguereko ${k} ${pl(u)}. Epoko upe ta'anga.`),
    respuesta: { tipo: "imagen", correcta: opcion(g, k), distractores: [opcion(k, g), opcion(g, k + 1)] },
    pista: tx("Cuenta primero los grupos. Después mira cuántos hay en cada grupo.", `Compte d'abord les groupes. Ensuite, regarde combien il y en a dans chaque groupe.`, `Epapa raẽ aty. Upéi emañá mboýpa oĩ peteĩteĩ atýpe.`),
    explicacion: tx(`Esa imagen tiene ${g} grupos y en cada uno hay ${cant(k, u)}.`, `Cette image a ${g} groupes et dans chacun il y a ${cant(k, u)}.`, `Ko ta'anga oguereko ${g} aty ha peteĩteĩme oĩ ${cant(k, u)}.`),
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
  const opcion = (t: readonly number[]): OpcionImagen => ({ texto: tx(`Grupos de ${listaY(t)}`, `Groupes de ${listaY(t)}`, `Aty ${listaY(t)}`), imagen: dibujoGrupos(u, t) });
  return pregunta(rng, {
    subhabilidad: T5A,
    dificultad: d,
    enunciado: tx("Toca la imagen en la que todos los grupos son iguales.", `Touche l'image où tous les groupes sont égaux.`, `Epoko ta'anga opa aty ojojaha.`),
    enunciadoFacil: tx("Cuenta cada grupo. Toca la imagen con grupos iguales.", `Compte chaque groupe. Touche l'image avec des groupes égaux.`, `Epapa peteĩteĩ aty. Epoko ta'anga aty ojojáva reheve.`),
    respuesta: { tipo: "imagen", correcta: opcion(iguales(g, k)), distractores: [opcion(barajar(rng, a)), opcion(barajar(rng, b))] },
    pista: tx("Cuenta los dibujos de cada grupo y compara.", `Compte les dessins de chaque groupe et compare.`, `Epapa ta'anga peteĩteĩ atýpe ha embojoja.`),
    explicacion: tx(`En esa imagen, los ${g} grupos tienen ${cant(k, u)} cada uno.`, `Dans cette image, les ${g} groupes ont ${cant(k, u)} chacun.`, `Ko ta'angápe, umi ${g} aty oguereko ${cant(k, u)} peteĩteĩ.`),
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
    enunciado: tx(`¿Cuánto es ${t} × ${n}?`, `Combien font ${t} × ${n} ?`, `Mboýpa ${t} × ${n}?`),
    enunciadoFacil: tx(`Multiplica ${t} por ${n}.`, `Multiplie ${t} par ${n}.`, `Emboheta ${t} ${n} rehe.`),
    respuesta: opcionNumerica(rng, p, erroresTabla(t, n)),
    pista: tx(`Cuenta de ${t} en ${t}, ${n === 1 ? "una vez" : `${n} veces`}.`, `Compte de ${t} en ${t}, ${n === 1 ? "une fois" : `${n} fois`}.`, `Epapa ${t} ha ${t}, ${n === 1 ? "peteĩ jey" : `${n} jey`}.`),
    explicacion: tx(`Contando de ${t} en ${t}, ${n === 1 ? "la primera vez" : `${n} veces`}, llegas al ${p}. ${t} × ${n} = ${p}.`, `En comptant de ${t} en ${t}, ${n === 1 ? "la première fois" : `${n} fois`}, tu arrives à ${p}. ${t} × ${n} = ${p}.`, `Epapávo ${t} ha ${t}, ${n === 1 ? "peteĩ jey" : `${n} jey`}, reg̃uahẽ ${p}-pe. ${t} × ${n} = ${p}.`),
    plantilla: clave(T5B, "tabla", t, n),
  });
};

const tablaEscrita: Generador = (rng, d) => {
  const [t, n] = factores(rng, d);
  const p = t * n;
  return pregunta(rng, {
    subhabilidad: T5B,
    dificultad: d,
    enunciado: tx(`Escribe el resultado: ${n} × ${t}`, `Écris le résultat : ${n} × ${t}`, `Ehai mba'e osẽva: ${n} × ${t}`),
    enunciadoFacil: tx(`Multiplica ${n} por ${t}. Escribe el resultado.`, `Multiplie ${n} par ${t}. Écris le résultat.`, `Emboheta ${n} ${t} rehe. Ehai mba'e osẽva.`),
    respuesta: { tipo: "numero", valor: p },
    pista: tx(`Da igual el orden: puedes contar de ${t} en ${t}.`, `L'ordre ne change rien : tu peux compter de ${t} en ${t}.`, `Rysýi ndoikoambuéi: ikatu repapa ${t} ha ${t}.`),
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
    enunciado: tx(`¿Qué número falta? ${t} × ___ = ${p}`, `Quel nombre manque ? ${t} × ___ = ${p}`, `Mba'e papapýpa ofalta? ${t} × ___ = ${p}`),
    enunciadoFacil: tx(`Mira: ${t} × ___ = ${p}. ¿Qué número va en el hueco?`, `Regarde : ${t} × ___ = ${p}. Quel nombre va dans le trou ?`, `Emañá: ${t} × ___ = ${p}. Mba'e papapýpa oike pa'ũme?`),
    respuesta: respuestaNum(rng, d, n, [p - t, p, n + 1, n - 1].filter((x) => x > 0)),
    pista: tx(`Cuenta de ${t} en ${t} hasta llegar al ${p}. Cuenta los saltos.`, `Compte de ${t} en ${t} jusqu'à ${p}. Compte les sauts.`, `Epapa ${t} ha ${t} ${p} peve. Epapa mboy jey.`),
    explicacion: tx(`${t} × ${n} = ${p}. Por eso falta el ${n}.`, `${t} × ${n} = ${p}. Il manque donc ${n}.`, `${t} × ${n} = ${p}. Upévare ofalta ${n}.`),
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
    enunciado: d === 3 ? tx(`Esta fila cuenta hacia atrás de ${t} en ${t}. ¿Qué número falta?`, `Cette ligne compte à l'envers de ${t} en ${t}. Quel nombre manque ?`, `Ko rysýi opapa tapykue gotyo ${t} ha ${t}. Mba'e papapýpa ofalta?`) : tx(`Esta fila cuenta de ${t} en ${t}. ¿Qué número falta?`, `Cette ligne compte de ${t} en ${t}. Quel nombre manque ?`, `Ko rysýi opapa ${t} ha ${t}. Mba'e papapýpa ofalta?`),
    enunciadoFacil: d === 3 ? tx(`Cuenta hacia atrás de ${t} en ${t}. ¿Qué número falta?`, `Compte à l'envers de ${t} en ${t}. Quel nombre manque ?`, `Epapa tapykue gotyo ${t} ha ${t}. Mba'e papapýpa ofalta?`) : tx(`Cuenta de ${t} en ${t}. ¿Qué número falta?`, `Compte de ${t} en ${t}. Quel nombre manque ?`, `Epapa ${t} ha ${t}. Mba'e papapýpa ofalta?`),
    imagen: serieDeTextos(fila.map((x, i) => (i === posicion ? null : x))),
    respuesta: respuestaNum(rng, d, falta, [falta + t, falta - t, falta + 1, falta - 1].filter((x) => x > 0)),
    pista: tx(`De un número al siguiente siempre hay ${t} de diferencia.`, `D'un nombre au suivant, il y a toujours ${t} d'écart.`, `Peteĩ papapýgui ambuépe oĩ ${t} pa'ũ.`),
    explicacion: tx(`La fila completa es ${fila.join(", ")}. Falta el ${falta}.`, `La ligne complète est ${fila.join(", ")}. Il manque ${falta}.`, `Rysýi henyhẽva ha'e ${fila.join(", ")}. Ofalta ${falta}.`),
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
    enunciado: tx(`¿Qué número falta? ${sumaTexto} = ${t} × ___`, `Quel nombre manque ? ${sumaTexto} = ${t} × ___`, `Mba'e papapýpa ofalta? ${sumaTexto} = ${t} × ___`),
    enunciadoFacil: tx(`Mira: ${sumaTexto} = ${t} × ___. ¿Qué número va en el hueco?`, `Regarde : ${sumaTexto} = ${t} × ___. Quel nombre va dans le trou ?`, `Emañá: ${sumaTexto} = ${t} × ___. Mba'e papapýpa oike pa'ũme?`),
    respuesta: respuestaNum(rng, d, n, [p, t, n + 1, n - 1].filter((x) => x > 0)),
    pista: tx("Cuenta cuántas veces se repite el mismo número en la suma.", `Compte combien de fois le même nombre se répète dans l'addition.`, `Epapa mboy jey oñembojoapy peteĩ papapy.`),
    explicacion: tx(`El ${t} se suma ${n} veces, así que ${sumaTexto} = ${t} × ${n}.`, `Le ${t} est additionné ${n} fois, donc ${sumaTexto} = ${t} × ${n}.`, `${t} oñembojoapy ${n} jey, upévare ${sumaTexto} = ${t} × ${n}.`),
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
  { u: LAPIZ, texto: (g, k) => tx(`Hay ${g} cajas y en cada caja hay ${k} lápices.`, `Il y a ${g} boîtes et dans chaque boîte il y a ${k} crayons.`, `Oĩ ${g} kája ha peteĩteĩ kájape oĩ ${k} lápiz.`), facil: (g, k) => tx(`Hay ${g} cajas. Cada caja tiene ${k} lápices.`, `Il y a ${g} boîtes. Chaque boîte a ${k} crayons.`, `Oĩ ${g} kája. Peteĩteĩ kája oguereko ${k} lápiz.`) },
  { u: SILLA, texto: (g, k) => tx(`En la escuela hay ${g} filas y en cada fila hay ${k} sillas.`, `À l'école, il y a ${g} rangées et dans chaque rangée il y a ${k} chaises.`, `Mbo'ehaópe oĩ ${g} rysýi ha peteĩteĩ rysýipe oĩ ${k} apyka.`), facil: (g, k) => tx(`Hay ${g} filas. Cada fila tiene ${k} sillas.`, `Il y a ${g} rangées. Chaque rangée a ${k} chaises.`, `Oĩ ${g} rysýi. Peteĩteĩ rysýi oguereko ${k} apyka.`) },
  { u: NARANJA, texto: (g, k) => tx(`En el mercado hay ${g} bolsas con ${k} naranjas en cada bolsa.`, `Au marché, il y a ${g} sacs avec ${k} oranges dans chaque sac.`, `Merkádo-pe oĩ ${g} vosa ha peteĩteĩ vosápe oĩ ${k} narã.`), facil: (g, k) => tx(`Hay ${g} bolsas. Cada bolsa tiene ${k} naranjas.`, `Il y a ${g} sacs. Chaque sac a ${k} oranges.`, `Oĩ ${g} vosa. Peteĩteĩ vosa oguereko ${k} narã.`) },
  { u: FLOR, texto: (g, k) => tx(`En el huerto hay ${g} filas con ${k} flores en cada fila.`, `Dans le potager, il y a ${g} rangées avec ${k} fleurs dans chaque rangée.`, `Kokuépe oĩ ${g} rysýi ha peteĩteĩ rysýipe oĩ ${k} yvoty.`), facil: (g, k) => tx(`Hay ${g} filas. Cada fila tiene ${k} flores.`, `Il y a ${g} rangées. Chaque rangée a ${k} fleurs.`, `Oĩ ${g} rysýi. Peteĩteĩ rysýi oguereko ${k} yvoty.`) },
  { u: PAJARO, texto: (g, k) => tx(`En un árbol hay ${g} ramas y en cada rama hay ${k} pájaros.`, `Dans un arbre, il y a ${g} branches et sur chaque branche il y a ${k} oiseaux.`, `Peteĩ yvyrápe oĩ ${g} rakã ha peteĩteĩ rakãme oĩ ${k} guyra.`), facil: (g, k) => tx(`Hay ${g} ramas. Cada rama tiene ${k} pájaros.`, `Il y a ${g} branches. Chaque branche a ${k} oiseaux.`, `Oĩ ${g} rakã. Peteĩteĩ rakã oguereko ${k} guyra.`) },
  { u: HUEVO, texto: (g, k) => tx(`En la tienda hay ${g} cajas con ${k} huevos en cada caja.`, `Au magasin, il y a ${g} boîtes avec ${k} œufs dans chaque boîte.`, `Ñemuhápe oĩ ${g} kája ha peteĩteĩ kájape oĩ ${k} rupi'a.`), facil: (g, k) => tx(`Hay ${g} cajas. Cada caja tiene ${k} huevos.`, `Il y a ${g} boîtes. Chaque boîte a ${k} œufs.`, `Oĩ ${g} kája. Peteĩteĩ kája oguereko ${k} rupi'a.`) },
  { u: { singular: "rueda", plural: "ruedas", genero: "f" }, fijo: 2, texto: (g, k) => tx(`Hay ${g} bicicletas y cada bicicleta tiene ${k} ruedas.`, `Il y a ${g} vélos et chaque vélo a ${k} roues.`, `Oĩ ${g} bicicleta ha peteĩteĩ oguereko ${k} rueda.`), facil: (g, k) => tx(`Hay ${g} bicicletas. Cada una tiene ${k} ruedas.`, `Il y a ${g} vélos. Chacun a ${k} roues.`, `Oĩ ${g} bicicleta. Peteĩteĩ oguereko ${k} rueda.`) },
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
  const pregunto = tx(`¿${cuantos(h.u)} ${pl(h.u)} hay en total?`, `Combien ${dePl(h.u)} y a-t-il en tout ?`, `Mboy ${pl(h.u)}pa oĩ opaite?`);
  const extra = r === 0 ? "" : tx(` Además, hay ${r} ${pl(h.u)} más.`, ` Il y a aussi ${r} autres ${pl(h.u)}.`, ` Oĩ avei ${r} ${pl(h.u)} ambue.`);
  const id = h.u.id;
  const imagen = d === 1 && id !== undefined ? dibujoGrupos(h.u, iguales(g, k)) : undefined;
  return pregunta(rng, {
    subhabilidad: T5C,
    dificultad: d,
    enunciado: `${h.texto(g, k)}${extra} ${pregunto}`,
    enunciadoFacil: `${h.facil(g, k)}${extra} ${pregunto}`,
    ...(imagen === undefined ? {} : { imagen }),
    respuesta: respuestaNum(rng, d, total, [g + k, t + k, t - k, t, total + 1, total - 1].filter((x) => x > 0)),
    pista: r === 0 ? tx("Son grupos iguales: puedes sumar el mismo número varias veces.", `Ce sont des groupes égaux : tu peux additionner plusieurs fois le même nombre.`, `Ha'e aty ojojáva: ikatu rembojoapy heta jey peteĩ papapy.`) : tx("Primero calcula los grupos iguales. Después añade los que hay de más.", `Calcule d'abord les groupes égaux. Ensuite, ajoute ceux qui restent.`, `Ejuhu raẽ aty ojojáva. Upéi embojoapy hembýva.`),
    explicacion: r === 0 ? tx(`${textoSuma(g, k)}. Hay ${cant(t, h.u)} en total.`, `${textoSuma(g, k)}. Il y a ${cant(t, h.u)} en tout.`, `${textoSuma(g, k)}. Oĩ ${cant(t, h.u)} opaite.`) : tx(`${textoSuma(g, k)}, y ${t} + ${r} = ${total}. Hay ${cant(total, h.u)} en total.`, `${textoSuma(g, k)}, et ${t} + ${r} = ${total}. Il y a ${cant(total, h.u)} en tout.`, `${textoSuma(g, k)}, ha ${t} + ${r} = ${total}. Oĩ ${cant(total, h.u)} opaite.`),
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
    enunciado: tx(`${h.texto(g, k)} ¿Qué operación sirve para saber ${cuantos(h.u).toLowerCase()} ${pl(h.u)} hay en total?`, `${h.texto(g, k)} Quelle opération permet de savoir combien ${dePl(h.u)} il y a en tout ?`, `${h.texto(g, k)} Mba'e cuenta oipytyvõ reikuaa hag̃ua mboy ${pl(h.u)} oĩ opaite?`),
    enunciadoFacil: tx(`${h.facil(g, k)} ¿Qué operación da el total?`, `${h.facil(g, k)} Quelle opération donne le total ?`, `${h.facil(g, k)} Mba'e cuenta ome'ẽ opaite?`),
    respuesta: { tipo: "opcion", correcta, distractores: distractoresTexto(rng, correcta, falsos, 3) },
    pista: tx("Son grupos iguales. Piensa qué operación repite el mismo número.", `Ce sont des groupes égaux. Pense à l'opération qui répète le même nombre.`, `Ha'e aty ojojáva. Epensa mba'e cuenta omoĩ jey peteĩ papapy.`),
    explicacion: tx(`Hay ${g} grupos iguales de ${k}. Se calcula con ${correcta} = ${g * k}.`, `Il y a ${g} groupes égaux de ${k}. On calcule avec ${correcta} = ${g * k}.`, `Oĩ ${g} aty ojojáva ${k} rehegua. Jajapo ${correcta} = ${g * k}.`),
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
