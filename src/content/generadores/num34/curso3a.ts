// NUM 3.º, temas 1 a 3: números hasta 1000, multiplicación y división como reparto.
import type { Rng } from "../../../core/rng.ts";
import { barajar, contable, elegir, entero, monedas, muestra, nombre } from "../../ayuda.ts";
import type { Contable } from "../../ayuda.ts";
import type { Dificultad, Imagen, MapaGeneradores } from "../../tipos.ts";
import { contablePorId, cuantos, dosNombres, en, gen, mercancia, num, opc, pl, textos, tresNombres, trio } from "./comun.ts";

function cifrasDistintas(rng: Rng): [number, number, number] {
  return trio(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
}

// ---------- T1-a Valor posicional ----------
const bloques = gen("NUM3-T1-a", (rng, d) => {
  const c = d === 1 ? entero(rng, 1, 4) : d === 2 ? entero(rng, 2, 6) : entero(rng, 1, 5);
  const conCeroEnDecenas = rng() < 0.5;
  const dd = d === 1 ? entero(rng, 1, 5) : d === 2 ? (conCeroEnDecenas ? 0 : entero(rng, 1, 9)) : entero(rng, 10, 13);
  const u = d === 2 && !conCeroEnDecenas ? 0 : entero(rng, 2, 9);
  const n = 100 * c + 10 * dd + u;
  const imagen: Imagen = { tipo: "decenas", centenas: c, decenas: dd, unidades: u };
  const errores = [100 * u + 10 * dd + c, 100 * c + 10 * u + dd, c + dd + u, n + 10, n + 100, 100 * c + 10 * (dd % 10) + u, n - 10];
  return {
    enunciado: "Una placa vale 100, una barra vale 10 y un cubito vale 1. ¿Qué número forman estos bloques?",
    enunciadoFacil: "Mira los bloques. Una placa vale 100. Una barra vale 10. Un cubito vale 1. ¿Qué número forman?",
    imagen,
    respuesta: d === 2 ? num(n) : opc(rng, n, errores, 10),
    pista: d === 3 ? "Hay más de 9 barras. Con 10 barras se forma una placa de 100." : "Cuenta las placas, luego las barras y luego los cubitos.",
    explicacion: `En placas hay ${100 * c}, en barras ${10 * dd} y en cubitos ${u}. En total, ${n}.`,
  };
});

const LUGARES = ["centenas", "decenas", "unidades"] as const;

const cifraDeUnNumero = gen("NUM3-T1-a", (rng, d) => {
  const [c, dd, u] = cifrasDistintas(rng);
  const n = 100 * c + 10 * dd + u;
  const digitos = [c, dd, u];
  if (d === 1) {
    const i = entero(rng, 0, 2);
    const lugar = en(LUGARES, i);
    const cifra = en(digitos, i);
    return {
      enunciado: `En el número ${n}, ¿qué cifra está en el lugar de las ${lugar}?`,
      enunciadoFacil: `Mira el número ${n}. ¿Qué cifra está en las ${lugar}?`,
      respuesta: textos(String(cifra), digitos.filter((x) => x !== cifra).map(String)),
      pista: "De derecha a izquierda: unidades, decenas y centenas.",
      explicacion: `En ${n} hay ${c} en las centenas, ${dd} en las decenas y ${u} en las unidades. En las ${lugar} está el ${cifra}.`,
    };
  }
  if (d === 2) {
    const i = entero(rng, 0, 2);
    const cifra = en(digitos, i);
    const valor = cifra * en([100, 10, 1], i);
    const todos = [cifra, cifra * 10, cifra * 100].map(String);
    return {
      enunciado: `¿Cuánto vale la cifra ${cifra} en el número ${n}?`,
      enunciadoFacil: `Mira el número ${n}. ¿Cuánto vale la cifra ${cifra}?`,
      respuesta: textos(String(valor), todos.filter((x) => x !== String(valor))),
      pista: "Mira en qué lugar está la cifra: unidades, decenas o centenas.",
      explicacion: `En ${n}, el ${cifra} está en las ${en(LUGARES, i)}, así que vale ${valor}.`,
    };
  }
  const decenas = rng() < 0.3 ? 0 : dd;
  const numero = 100 * c + 10 * decenas + u;
  const trozos = barajar(rng, [
    { valor: c, texto: pl(c, "centena", "centenas") },
    { valor: decenas, texto: pl(decenas, "decena", "decenas") },
    { valor: u, texto: pl(u, "unidad", "unidades") },
  ]);
  const [t1, t2, t3] = [en(trozos, 0), en(trozos, 1), en(trozos, 2)];
  const lista = `${t1.texto}, ${t2.texto} y ${t3.texto}`;
  return {
    enunciado: `¿Qué número tiene ${lista}?`,
    enunciadoFacil: `Un número tiene ${lista}. ¿Qué número es?`,
    respuesta: opc(rng, numero, [100 * c + 10 * u + decenas, 100 * u + 10 * decenas + c, 100 * decenas + 10 * c + u, 100 * t1.valor + 10 * t2.valor + t3.valor, 10 * c + u, numero + 100], 10),
    pista: "Coloca primero las centenas, luego las decenas y al final las unidades.",
    explicacion: `${100 * c} + ${10 * decenas} + ${u} = ${numero}.`,
  };
});

const descomponer = gen("NUM3-T1-a", (rng, d) => {
  const [c, dd, u] = cifrasDistintas(rng);
  if (d === 1) {
    const n = 100 * c + 10 * dd + u;
    return {
      enunciado: `¿Qué número es ${100 * c} + ${10 * dd} + ${u}?`,
      enunciadoFacil: `Suma: ${100 * c} + ${10 * dd} + ${u}. ¿Qué número es?`,
      respuesta: num(n),
      pista: "Cada sumando da una cifra: centenas, decenas y unidades.",
      explicacion: `${100 * c} + ${10 * dd} + ${u} = ${n}.`,
    };
  }
  if (d === 2) {
    const sinDecenas = rng() < 0.4;
    const n = 100 * c + (sinDecenas ? 0 : 10 * dd) + u;
    const partes = sinDecenas ? [u, 100 * c] : barajar(rng, [100 * c, 10 * dd, u]);
    const orden = partes[0] === 100 * c ? [...partes].reverse() : partes;
    const suma = orden.join(" + ");
    return {
      enunciado: `¿Qué número es ${suma}?`,
      enunciadoFacil: `Suma: ${suma}. ¿Qué número es?`,
      respuesta: num(n),
      pista: "Los sumandos están desordenados. Busca primero las centenas.",
      explicacion: `Ordenado queda ${[...orden].sort((a, b) => b - a).join(" + ")} = ${n}.`,
    };
  }
  const n = 100 * Math.max(c, 2) + 10 * dd + u;
  const centenas = 100 * Math.max(c, 2);
  const base = rng() < 0.5 ? centenas : centenas - 100;
  const falta = n - base - u;
  return {
    enunciado: `¿Qué número falta? ${n} = ${base} + ___ + ${u}`,
    enunciadoFacil: `Mira: ${n} = ${base} + ___ + ${u}. ¿Qué número va en el hueco?`,
    respuesta: num(falta),
    pista: `Calcula cuánto hay de ${base} hasta ${n} y quita las unidades.`,
    explicacion: `${base} + ${falta} + ${u} = ${n}, así que falta ${falta}.`,
  };
});

// ---------- T1-b Comparar ----------
function motivo(a: number, b: number): string {
  const mayor = Math.max(a, b);
  const menor = Math.min(a, b);
  const nombres = [["centena", "centenas", 100], ["decena", "decenas", 10], ["unidad", "unidades", 1]] as const;
  for (const [uno, varios, peso] of nombres) {
    const x = Math.floor(mayor / peso) % 10;
    const y = Math.floor(menor / peso) % 10;
    if (x !== y) return `${mayor} tiene ${pl(x, uno, varios)} y ${menor} tiene ${pl(y, uno, varios)}, así que ${mayor} es mayor.`;
  }
  return `${a} y ${b} son iguales.`;
}

function numerosParaComparar(rng: Rng, d: Dificultad): number[] {
  if (d === 1) {
    const [a, b, c] = trio(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    return [a, b, c].map((h) => 100 * h + entero(rng, 10, 99));
  }
  if (d === 2) {
    const h = entero(rng, 1, 9);
    return muestra(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9], 4).map((t) => 100 * h + 10 * t + entero(rng, 0, 9));
  }
  const [x, y, z] = cifrasDistintas(rng);
  return [100 * x + 10 * y + z, 100 * x + 10 * z + y, 100 * y + 10 * x + z, 100 * y + 10 * z + x];
}

const mayorMenor = gen("NUM3-T1-b", (rng, d) => {
  const lista = numerosParaComparar(rng, d);
  const quiereMayor = rng() < 0.5;
  const correcta = quiereMayor ? Math.max(...lista) : Math.min(...lista);
  const palabra = quiereMayor ? "mayor" : "menor";
  const otro = en(lista.filter((x) => x !== correcta), 0);
  return {
    enunciado: `¿Cuál de estos números es el ${palabra}?`,
    enunciadoFacil: `Busca el número ${palabra}.`,
    respuesta: textos(String(correcta), lista.filter((x) => x !== correcta).map(String)),
    pista: "Compara primero las centenas. Si son iguales, mira las decenas.",
    explicacion: `El ${palabra} es ${correcta}. Por ejemplo, ${motivo(correcta, otro)}`,
  };
});

const signoEntre = gen("NUM3-T1-b", (rng, d) => {
  let a: number;
  let b: number;
  let izquierda: string;
  if (d === 3) {
    const [c, dd, u] = cifrasDistintas(rng);
    a = 100 * c + 10 * dd + u;
    b = elegir(rng, [a, 100 * c + 10 * u + dd, 100 * dd + 10 * c + u]);
    izquierda = barajar(rng, [100 * c, 10 * dd, u]).join(" + ");
  } else {
    const [x, y] = numerosParaComparar(rng, d);
    a = x as number;
    b = y as number;
    izquierda = String(a);
  }
  const signo = a > b ? ">" : a < b ? "<" : "=";
  const frase = a === b ? `Los dos lados valen ${a}.` : d === 3 ? `${izquierda} = ${a}. ${motivo(a, b)}` : motivo(a, b);
  return {
    enunciado: `¿Qué signo va en el hueco? ${izquierda} ___ ${b}`,
    enunciadoFacil: `Mira: ${izquierda} ___ ${b}. ¿Qué signo va en el hueco?`,
    respuesta: textos(signo, ["<", ">", "="].filter((s) => s !== signo)),
    pista: d === 3 ? "Calcula primero la suma. Después compara." : "La boca abierta del signo mira al número mayor.",
    explicacion: frase,
  };
});

const ordenar = gen("NUM3-T1-b", (rng, d) => {
  const h = entero(rng, 2, 8);
  const t = entero(rng, 1, 8);
  const lista = d === 1 ? numerosParaComparar(rng, 1)
    : d === 2 ? numerosParaComparar(rng, 2).slice(0, 3)
      : [100 * h + 10 * t + entero(rng, 0, 4), 100 * h + 10 * t + entero(rng, 5, 9), 100 * h + 10 * (t + 1) + entero(rng, 0, 9), 100 * (h - 1) + 10 * t + entero(rng, 0, 9)];
  const ascendente = d === 1 || rng() < 0.5;
  const correcta = [...lista].sort((a, b) => (ascendente ? a - b : b - a));
  const inverso = [...correcta].reverse();
  const cambia = (i: number) => correcta.map((_, k) => en(correcta, k === i ? i + 1 : k === i + 1 ? i : k));
  const mostrar = barajar(rng, lista);
  const enunciadoLista = (mostrar.join(",") === correcta.join(",") ? inverso : mostrar).join(", ");
  const sentido = ascendente ? "de menor a mayor" : "de mayor a menor";
  return {
    enunciado: `Ordena estos números ${sentido}: ${enunciadoLista}.`,
    enunciadoFacil: `Mira estos números: ${enunciadoLista}. Ordénalos ${sentido}.`,
    respuesta: textos(correcta.join(", "), [inverso, cambia(0), cambia(correcta.length - 2)].map((x) => x.join(", "))),
    pista: "Compara las centenas. Si son iguales, compara las decenas.",
    explicacion: `${ascendente ? "De menor a mayor" : "De mayor a menor"} quedan así: ${correcta.join(", ")}.`,
  };
});

const quienVendio = gen("NUM3-T1-b", (rng, d) => {
  const c = mercancia(rng);
  const lista = numerosParaComparar(rng, d === 3 ? 2 : d);
  if (d === 3) {
    const [a, b, e] = tresNombres(rng);
    const [x, y, z] = [en(lista, 0), en(lista, 1), en(lista, 2)];
    const menor = Math.min(x, y, z);
    const ganador = menor === x ? a : menor === y ? b : e;
    return {
      enunciado: `En el mercado, ${a} vendió ${x} ${c.plural}, ${b} vendió ${y} ${c.plural} y ${e} vendió ${z} ${c.plural}. ¿Quién vendió menos?`,
      enunciadoFacil: `${a} vendió ${x} ${c.plural}. ${b} vendió ${y} ${c.plural}. ${e} vendió ${z} ${c.plural}. ¿Quién vendió menos?`,
      respuesta: textos(ganador, [a, b, e].filter((n) => n !== ganador)),
      pista: "Las centenas son iguales. Compara las decenas.",
      explicacion: `${ganador} vendió ${menor}, que es el número menor de los tres.`,
    };
  }
  const [a, b] = dosNombres(rng);
  const [x, y] = [en(lista, 0), en(lista, 1)];
  const ganador = x > y ? a : b;
  return {
    enunciado: `En el mercado, ${a} vendió ${x} ${c.plural} y ${b} vendió ${y} ${c.plural}. ¿Quién vendió más?`,
    enunciadoFacil: `${a} vendió ${x} ${c.plural}. ${b} vendió ${y} ${c.plural}. ¿Quién vendió más?`,
    respuesta: textos(ganador, [ganador === a ? b : a, "Vendieron la misma cantidad"]),
    pista: "Compara los dos números empezando por las centenas.",
    explicacion: `${ganador} vendió más. ${motivo(x, y)}`,
  };
});

// ---------- T1-c Redondear a la decena ----------
function aDecena(n: number): number {
  return Math.floor((n + 5) / 10) * 10;
}

function unidadSinCinco(rng: Rng): number {
  return elegir(rng, [1, 2, 3, 4, 6, 7, 8, 9]);
}

function motivoRedondeo(n: number): string {
  const u = n % 10;
  const destino = aDecena(n);
  if (u === 5) return `${n} tiene 5 unidades y entonces se redondea hacia arriba, a ${destino}.`;
  return `${n} tiene ${pl(u, "unidad", "unidades")}, así que está más cerca de ${destino}.`;
}

const redondear = gen("NUM3-T1-c", (rng, d) => {
  if (d === 3) {
    const empate = rng() < 0.5;
    const n = empate ? 100 * entero(rng, 1, 8) + 10 * entero(rng, 1, 8) + 5 : 100 * entero(rng, 1, 8) + 90 + entero(rng, 6, 9);
    return {
      enunciado: `Redondea ${n} a la decena más cercana.${empate ? " Si las unidades son 5, se redondea hacia arriba." : ""}`,
      enunciadoFacil: `Mira el número ${n}. Redondea a la decena más cercana.${empate ? " Con 5 unidades, se sube." : ""}`,
      respuesta: num(aDecena(n)),
      pista: empate ? "Mira la cifra de las unidades." : "Si subes de decena aquí, también cambian las centenas.",
      explicacion: motivoRedondeo(n),
    };
  }
  const n = d === 1 ? 10 * entero(rng, 1, 9) + unidadSinCinco(rng) : 100 * entero(rng, 1, 9) + 10 * entero(rng, 0, 8) + unidadSinCinco(rng);
  const destino = aDecena(n);
  const abajo = n - (n % 10);
  return {
    enunciado: `Redondea ${n} a la decena más cercana.`,
    enunciadoFacil: `Mira el número ${n}. Redondea a la decena más cercana.`,
    respuesta: d === 1 ? opc(rng, destino, [abajo, abajo + 10, destino + 10, destino - 10], 10) : num(destino),
    pista: "Mira las unidades. ¿Están más cerca de 0 o de 10?",
    explicacion: motivoRedondeo(n),
  };
});

const redondearEnRecta = gen("NUM3-T1-c", (rng, d) => {
  const n = d === 1 ? 10 * entero(rng, 1, 9) + elegir(rng, [1, 2, 8, 9])
    : d === 2 ? 100 * entero(rng, 1, 9) + 10 * entero(rng, 0, 8) + elegir(rng, [3, 4, 6, 7])
      : 100 * entero(rng, 1, 8) + 90 + elegir(rng, [2, 3, 4, 6, 7, 8]);
  const desde = n - (n % 10);
  const destino = aDecena(n);
  const imagen: Imagen = { tipo: "recta", desde, hasta: desde + 10, paso: 1, marca: n };
  const otra = destino === desde ? desde + 10 : desde;
  return {
    enunciado: `Mira la recta. ¿Qué decena está más cerca de ${n}?`,
    enunciadoFacil: `Mira la recta. Busca el ${n}. ¿Qué decena está más cerca?`,
    imagen,
    respuesta: d === 3 ? num(destino) : opc(rng, destino, [otra, destino === desde ? desde - 10 : desde + 20], 10),
    pista: "Cuenta los saltos hasta cada extremo de la recta.",
    explicacion: `Desde ${n} hasta ${destino} hay ${pl(Math.abs(destino - n), "salto", "saltos")}, y hasta ${otra} hay ${Math.abs(otra - n)}. Está más cerca de ${destino}.`,
  };
});

const redondearProblema = gen("NUM3-T1-c", (rng, d) => {
  if (d === 3) {
    const objetivo = 100 * entero(rng, 1, 8) + 10 * entero(rng, 1, 8);
    const correcta = objetivo + elegir(rng, [-4, -3, -2, -1, 1, 2, 3, 4]);
    const lista = [objetivo - entero(rng, 6, 9), objetivo + entero(rng, 6, 9), objetivo + entero(rng, 11, 14)];
    return {
      enunciado: `¿Cuál de estos números da ${objetivo} al redondearlo a la decena más cercana?`,
      enunciadoFacil: `Redondea cada número a la decena más cercana. ¿Cuál da ${objetivo}?`,
      respuesta: textos(String(correcta), lista.map(String)),
      pista: "Redondea cada opción y compara con el número pedido.",
      explicacion: motivoRedondeo(correcta),
    };
  }
  const c = mercancia(rng);
  const n = d === 1 ? 10 * entero(rng, 2, 9) + unidadSinCinco(rng) : 100 * entero(rng, 1, 9) + 10 * entero(rng, 0, 8) + unidadSinCinco(rng);
  return {
    enunciado: `En el mercado hay ${n} ${c.plural}. Redondea esa cantidad a la decena más cercana. ¿Qué número te sale?`,
    enunciadoFacil: `Hay ${n} ${c.plural}. Redondea a la decena más cercana. ¿Qué número sale?`,
    respuesta: num(aDecena(n)),
    pista: "Solo importa la cifra de las unidades.",
    explicacion: motivoRedondeo(n),
  };
});

// ---------- T2-a Tablas hasta el 10 ----------
const tablaDirecta = gen("NUM3-T2-a", (rng, d) => {
  const a = d === 1 ? elegir(rng, [2, 3, 4, 5, 10]) : elegir(rng, [6, 7, 8, 9]);
  const b = d === 1 ? entero(rng, 2, 10) : d === 2 ? entero(rng, 2, 6) : entero(rng, 6, 9);
  const [x, y] = rng() < 0.5 ? [a, b] : [b, a];
  const r = a * b;
  return {
    enunciado: `¿Cuánto es ${x} × ${y}?`,
    enunciadoFacil: `Multiplica ${x} por ${y}.`,
    respuesta: d === 1 ? opc(rng, r, [a + b, r + a, r - a, r + b, r - b]) : num(r),
    pista: "Recita la tabla o suma el mismo número varias veces.",
    explicacion: `${x} × ${y} = ${r}.`,
  };
});

const tablaHueco = gen("NUM3-T2-a", (rng, d) => {
  const a = elegir(rng, d === 1 ? [2, 5, 10] : d === 2 ? [3, 4, 6] : [7, 8, 9]);
  const b = entero(rng, d === 3 ? 3 : 2, 10);
  const r = a * b;
  const cuenta = rng() < 0.5 ? `${a} × ___ = ${r}` : `___ × ${a} = ${r}`;
  return {
    enunciado: `¿Qué número falta? ${cuenta}`,
    enunciadoFacil: `Mira: ${cuenta}. ¿Qué número va en el hueco?`,
    respuesta: num(b),
    pista: `Recita la tabla del número que ves hasta llegar a ${r}.`,
    explicacion: `${a} × ${b} = ${r}, así que falta el ${b}.`,
  };
});

const tablaConDibujo = gen("NUM3-T2-a", (rng, d) => {
  const c = contable(rng);
  const a = d === 1 ? entero(rng, 2, 3) : d === 2 ? entero(rng, 3, 5) : entero(rng, 4, 6);
  const b = d === 1 ? entero(rng, 2, 5) : d === 2 ? entero(rng, 4, 6) : entero(rng, 6, 9);
  const r = a * b;
  const imagen: Imagen = { tipo: "objetos", grupos: Array.from({ length: a }, () => ({ objeto: c.id, cantidad: b })) };
  return {
    enunciado: `Mira los grupos iguales. ¿${cuantos(c)} hay en total?`,
    enunciadoFacil: `Mira los grupos. Todos son iguales. ¿${cuantos(c)} hay?`,
    imagen,
    respuesta: d === 1 ? opc(rng, r, [a + b, r + b, r - b, r + 1]) : num(r),
    pista: "Cuenta cuántos grupos hay y cuántos hay en cada grupo. Después multiplica.",
    explicacion: `Hay ${a} grupos de ${b}: ${a} × ${b} = ${r}.`,
  };
});

// ---------- T2-b Por una cifra ----------
function sinLlevar(a: number, b: number): number {
  const texto = String(a);
  const ultimas = [...texto.slice(1)].map((x) => String((Number(x) * b) % 10)).join("");
  return Number(`${Number(texto[0]) * b}${ultimas}`);
}

interface Factores {
  readonly a: number;
  readonly b: number;
}

function factores(rng: Rng, d: Dificultad): Factores {
  if (d === 1) {
    const b = entero(rng, 2, 4);
    const tope = Math.floor(9 / b);
    return { a: 10 * entero(rng, 1, tope) + entero(rng, 1, tope), b };
  }
  if (d === 2) {
    const b = entero(rng, 3, 9);
    return { a: 10 * entero(rng, 1, 9) + entero(rng, 3, 9), b };
  }
  const b = entero(rng, 2, 6);
  const tope = Math.floor(999 / b);
  const c = entero(rng, 1, Math.floor(tope / 100));
  const a = 100 * c + 10 * entero(rng, 1, 9) + entero(rng, 5, 9);
  return a * b <= 999 ? { a, b } : { a: 100 + 10 * entero(rng, 1, 4) + entero(rng, 5, 9), b };
}

function explicarPorCifra(a: number, b: number): string {
  const decena = a - (a % 10);
  return `${decena} × ${b} = ${decena * b} y ${a % 10} × ${b} = ${(a % 10) * b}. Sumados dan ${a * b}.`;
}

const porUnaCifra = gen("NUM3-T2-b", (rng, d) => {
  const { a, b } = factores(rng, d);
  return {
    enunciado: `¿Cuánto es ${a} × ${b}?`,
    enunciadoFacil: `Multiplica ${a} por ${b}.`,
    respuesta: num(a * b),
    pista: d === 1 ? "Multiplica las unidades y después las decenas." : "Empieza por las unidades. No olvides lo que te llevas.",
    explicacion: explicarPorCifra(a, b),
  };
});

const porUnaCifraErrores = gen("NUM3-T2-b", (rng, d) => {
  const { a, b } = factores(rng, d);
  const r = a * b;
  const decena = a - (a % 10);
  return {
    enunciado: `Elige el resultado correcto de ${a} × ${b}.`,
    enunciadoFacil: `Multiplica: ${a} × ${b}. Elige el resultado.`,
    respuesta: opc(rng, r, [sinLlevar(a, b), decena + (a % 10) * b, a + b, r + 10, r - 10], 10),
    pista: "Calcula primero el resultado de las unidades.",
    explicacion: explicarPorCifra(a, b),
  };
});

const porPartes = gen("NUM3-T2-b", (rng, d) => {
  if (d === 3) {
    const a = 10 * entero(rng, 2, 8) + entero(rng, 2, 9);
    const b = entero(rng, 3, 9);
    const decena = a - (a % 10);
    const n = nombre(rng);
    return {
      enunciado: `Para calcular ${a} × ${b}, ${n} hace ${decena} × ${b} y ${a % 10} × ${b}, y luego suma. ¿Cuánto le da?`,
      enunciadoFacil: `${n} calcula ${a} × ${b}. Primero hace ${decena} × ${b}. Luego hace ${a % 10} × ${b}. Después suma. ¿Cuánto da?`,
      respuesta: num(a * b),
      pista: "Haz las dos multiplicaciones y súmalas.",
      explicacion: explicarPorCifra(a, b),
    };
  }
  const cifra = d === 1 ? entero(rng, 1, 4) : entero(rng, 3, 9);
  const b = d === 1 ? entero(rng, 2, 4) : entero(rng, 6, 9);
  const redondo = 10 * cifra;
  const r = redondo * b;
  return {
    enunciado: `¿Cuánto es ${redondo} × ${b}?`,
    enunciadoFacil: `Multiplica ${redondo} por ${b}.`,
    respuesta: opc(rng, r, [cifra * b, r * 10, redondo + b, r + redondo], 10),
    pista: "Multiplica sin el cero y después añade el cero.",
    explicacion: `${cifra} × ${b} = ${cifra * b}, y con el cero queda ${r}.`,
  };
});

// ---------- T2-c Problemas ----------
const EN_CADA: readonly { readonly uno: string; readonly varios: string; readonly cosa: Contable }[] = [
  { uno: "caja", varios: "cajas", cosa: contablePorId("huevo") },
  { uno: "bolsa", varios: "bolsas", cosa: contablePorId("naranja") },
  { uno: "estante", varios: "estantes", cosa: contablePorId("libro") },
  { uno: "mesa", varios: "mesas", cosa: contablePorId("lapiz") },
  { uno: "cesta", varios: "cestas", cosa: contablePorId("pera") },
  { uno: "fila del huerto", varios: "filas", cosa: contablePorId("flor") },
];

const problemaGrupos = gen("NUM3-T2-c", (rng, d) => {
  const { uno, varios, cosa } = elegir(rng, EN_CADA);
  const a = d === 1 ? entero(rng, 2, 6) : entero(rng, 3, 9);
  const b = d === 1 ? entero(rng, 3, 9) : d === 2 ? entero(rng, 12, 49) : entero(rng, 6, 25);
  const base = `En cada ${uno} hay ${b} ${cosa.plural}. Hay ${a} ${varios}.`;
  if (d === 3) {
    const extra = entero(rng, 3, 15);
    const r = a * b + extra;
    return {
      enunciado: `${base} Además, hay ${extra} ${cosa.plural} ${cosa.genero === "f" ? "sueltas" : "sueltos"}. ¿${cuantos(cosa)} hay en total?`,
      enunciadoFacil: `${base} También hay ${extra} ${cosa.plural} más. ¿${cuantos(cosa)} hay en total?`,
      respuesta: opc(rng, r, [a * b, a + b + extra, a * b - extra, a * (b + extra)]),
      pista: "Primero multiplica. Después suma lo que queda.",
      explicacion: `${a} × ${b} = ${a * b}, y ${a * b} + ${extra} = ${r}.`,
    };
  }
  const r = a * b;
  return {
    enunciado: `${base} ¿${cuantos(cosa)} hay en total?`,
    enunciadoFacil: `Hay ${a} ${varios}. ${uno === "estante" ? "Cada uno" : "Cada una"} lleva ${b} ${cosa.plural}. ¿${cuantos(cosa)} hay?`,
    respuesta: d === 1 ? opc(rng, r, [a + b, r + a, r - a, r + b]) : num(r),
    pista: "Son grupos iguales. ¿Qué operación cuenta grupos iguales?",
    explicacion: `${a} × ${b} = ${r}.`,
  };
});

const problemaPrecio = gen("NUM3-T2-c", (rng, d) => {
  const n = nombre(rng);
  const cosa = elegir(rng, ["cuaderno", "libro", "vaso", "lapiz"].map(contablePorId));
  const a = d === 1 ? entero(rng, 2, 5) : entero(rng, 3, 8);
  const p = d === 1 ? entero(rng, 2, 9) : d === 2 ? entero(rng, 13, 45) : entero(rng, 11, 30);
  if (d === 3) {
    const otro = entero(rng, 5, 40);
    const r = a * p + otro;
    return {
      enunciado: `${n} compra ${a} ${cosa.plural} a ${monedas(p)} cada uno y una pelota de ${monedas(otro)}. ¿Cuántas monedas paga en total?`,
      enunciadoFacil: `${n} compra ${a} ${cosa.plural}. Cada uno cuesta ${monedas(p)}. También compra una pelota de ${monedas(otro)}. ¿Cuántas monedas paga?`,
      respuesta: num(r),
      pista: "Calcula primero cuánto cuestan las cosas iguales.",
      explicacion: `${a} × ${p} = ${a * p}, y ${a * p} + ${otro} = ${r} monedas.`,
    };
  }
  const r = a * p;
  return {
    enunciado: `Un ${cosa.singular} cuesta ${monedas(p)}. ${n} compra ${a} ${cosa.plural}. ¿Cuántas monedas paga en total?`,
    enunciadoFacil: `Un ${cosa.singular} cuesta ${monedas(p)}. ${n} compra ${a}. ¿Cuántas monedas paga?`,
    respuesta: d === 1 ? opc(rng, r, [a + p, r + p, r - p, r + a]) : num(r),
    pista: "Paga el mismo precio varias veces.",
    explicacion: `${a} × ${p} = ${r} monedas.`,
  };
});

const problemaDias = gen("NUM3-T2-c", (rng, d) => {
  const n = nombre(rng);
  const dias = d === 1 ? entero(rng, 2, 5) : entero(rng, 3, 7);
  const paginas = d === 1 ? entero(rng, 3, 9) : d === 2 ? entero(rng, 12, 35) : entero(rng, 6, 15);
  if (d === 3) {
    const leidas = dias * paginas;
    const libro = 10 * (Math.floor(leidas / 10) + entero(rng, 2, 9));
    const r = libro - leidas;
    return {
      enunciado: `Un libro tiene ${libro} páginas. ${n} lee ${paginas} páginas cada día durante ${dias} días. ¿Cuántas páginas le faltan por leer?`,
      enunciadoFacil: `Un libro tiene ${libro} páginas. ${n} lee ${paginas} páginas cada día. Lee ${dias} días. ¿Cuántas páginas le faltan?`,
      respuesta: num(r),
      pista: "Primero calcula cuántas páginas ha leído ya.",
      explicacion: `${dias} × ${paginas} = ${leidas} páginas leídas, y ${libro} − ${leidas} = ${r}.`,
    };
  }
  const r = dias * paginas;
  return {
    enunciado: `${n} lee ${paginas} páginas cada día. ¿Cuántas páginas lee en ${dias} días?`,
    enunciadoFacil: `${n} lee ${paginas} páginas al día. Lee ${dias} días. ¿Cuántas páginas lee?`,
    respuesta: d === 1 ? opc(rng, r, [dias + paginas, r + paginas, r - paginas, r + dias]) : num(r),
    pista: "Cada día lee lo mismo.",
    explicacion: `${dias} × ${paginas} = ${r} páginas.`,
  };
});

// ---------- T3-a Repartir con imágenes ----------
function reparto(rng: Rng, d: Dificultad): { n: number; q: number } {
  if (d === 1) return { n: entero(rng, 2, 3), q: entero(rng, 2, 5) };
  if (d === 2) return { n: entero(rng, 3, 5), q: entero(rng, 3, 6) };
  return { n: entero(rng, 4, 6), q: entero(rng, 4, 8) };
}

const repartirDibujo = gen("NUM3-T3-a", (rng, d) => {
  const c = mercancia(rng);
  const { n, q } = reparto(rng, d);
  const total = n * q;
  const imagen: Imagen = { tipo: "objetos", grupos: [{ objeto: c.id, cantidad: total }] };
  return {
    enunciado: `Hay que repartir ${c.genero === "f" ? "estas" : "estos"} ${c.plural} entre ${n} personas, y todas reciben la misma cantidad. ¿${cuantos(c)} recibe cada persona?`,
    enunciadoFacil: `Mira el dibujo. Reparte entre ${n} personas. Todas reciben igual. ¿${cuantos(c)} recibe cada persona?`,
    imagen,
    respuesta: d === 1 ? opc(rng, q, [q + 1, q - 1, total - n, q + 2]) : num(q),
    pista: "Da uno a cada persona, una y otra vez, hasta que no quede ninguno.",
    explicacion: `Hay ${total} y son ${n} personas: ${total} ÷ ${n} = ${q}.`,
  };
});

const hacerGrupos = gen("NUM3-T3-a", (rng, d) => {
  const c = mercancia(rng);
  const { n, q } = reparto(rng, d);
  const total = n * q;
  const imagen: Imagen = { tipo: "objetos", grupos: [{ objeto: c.id, cantidad: total }] };
  return {
    enunciado: `Haz grupos de ${q} con ${c.genero === "f" ? "estas" : "estos"} ${c.plural}. ¿Cuántos grupos salen?`,
    enunciadoFacil: `Mira el dibujo. Cada grupo tiene ${q}. ¿Cuántos grupos salen?`,
    imagen,
    respuesta: d === 1 ? opc(rng, n, [n + 1, n + 2, q === n ? n - 1 : q, total]) : num(n),
    pista: `Rodea ${q} de golpe y cuenta cuántas veces puedes hacerlo.`,
    explicacion: `Hay ${total}: ${total} ÷ ${q} = ${n} grupos.`,
  };
});

const elegirReparto = gen("NUM3-T3-a", (rng, d) => {
  const c = mercancia(rng);
  const n = d === 1 ? 2 : d === 2 ? 3 : entero(rng, 4, 5);
  const q = elegir(rng, (d === 1 ? [3, 4, 5, 6] : d === 2 ? [2, 4, 5] : [2, 3, 6, 7]).filter((x) => x !== n));
  const total = n * q;
  const dibujo = (cantidades: readonly number[]): Imagen => ({ tipo: "objetos", grupos: cantidades.map((cantidad) => ({ objeto: c.id, cantidad })) });
  const desigual = Array.from({ length: n }, (_, i) => (i === 0 ? q + 1 : i === 1 ? q - 1 : q));
  return {
    enunciado: `Toca el dibujo que reparte ${total} ${c.plural} en ${n} grupos iguales.`,
    enunciadoFacil: `Hay ${total} ${c.plural}. Se hacen ${n} grupos iguales. Toca el dibujo correcto.`,
    respuesta: {
      tipo: "imagen",
      correcta: { texto: `${n} grupos de ${q}`, imagen: dibujo(Array.from({ length: n }, () => q)) },
      distractores: [
        { texto: `Grupos de ${desigual.join(", ")}`, imagen: dibujo(desigual) },
        { texto: `${q} grupos de ${n}`, imagen: dibujo(Array.from({ length: q }, () => n)) },
        { texto: `${n} grupos de ${q + 1}`, imagen: dibujo(Array.from({ length: n }, () => q + 1)) },
      ],
    },
    pista: "Comprueba tres cosas: cuántos grupos hay, si son iguales y cuánto suman.",
    explicacion: `${total} ÷ ${n} = ${q}, así que son ${n} grupos de ${q}.`,
  };
});

// ---------- T3-b División exacta ----------
function division(rng: Rng, d: Dificultad): { b: number; q: number } {
  if (d === 1) return { b: entero(rng, 2, 5), q: entero(rng, 2, 10) };
  if (d === 2) return { b: entero(rng, 6, 9), q: entero(rng, 3, 10) };
  const b = entero(rng, 2, 6);
  return { b, q: entero(rng, 11, Math.floor(99 / b)) };
}

const dividir = gen("NUM3-T3-b", (rng, d) => {
  const { b, q } = division(rng, d);
  const a = b * q;
  return {
    enunciado: `¿Cuánto es ${a} ÷ ${b}?`,
    enunciadoFacil: `Divide ${a} entre ${b}.`,
    respuesta: d === 1 ? opc(rng, q, [q + 1, q - 1, a - b, q + 2]) : num(q),
    pista: d === 3 ? "Reparte primero las decenas y después las unidades." : `Piensa: ¿qué número por ${b} da ${a}?`,
    explicacion: `${q} × ${b} = ${a}, así que ${a} ÷ ${b} = ${q}.`,
  };
});

const dividirHueco = gen("NUM3-T3-b", (rng, d) => {
  if (d === 1) {
    const { b, q } = division(rng, 2);
    const a = b * q;
    return {
      enunciado: `Si ${b} × ${q} = ${a}, ¿cuánto es ${a} ÷ ${b}?`,
      enunciadoFacil: `Sabes que ${b} × ${q} = ${a}. ¿Cuánto es ${a} ÷ ${b}?`,
      respuesta: num(q),
      pista: "La división es la operación contraria a la multiplicación.",
      explicacion: `Como ${b} × ${q} = ${a}, entonces ${a} ÷ ${b} = ${q}.`,
    };
  }
  if (d === 2) {
    const { b, q } = division(rng, 2);
    const a = b * q;
    return {
      enunciado: `¿Qué número falta? ${a} ÷ ___ = ${q}`,
      enunciadoFacil: `Mira: ${a} ÷ ___ = ${q}. ¿Qué número va en el hueco?`,
      respuesta: num(b),
      pista: `¿Por qué número hay que multiplicar ${q} para llegar a ${a}?`,
      explicacion: `${q} × ${b} = ${a}, así que ${a} ÷ ${b} = ${q}.`,
    };
  }
  const { b, q } = division(rng, 3);
  const a = b * q;
  return {
    enunciado: `¿Qué número falta? ___ ÷ ${b} = ${q}`,
    enunciadoFacil: `Mira: ___ ÷ ${b} = ${q}. ¿Qué número va en el hueco?`,
    respuesta: num(a),
    pista: "Para deshacer una división, multiplica.",
    explicacion: `${q} × ${b} = ${a}, así que ${a} ÷ ${b} = ${q}.`,
  };
});

const cualEsExacta = gen("NUM3-T3-b", (rng, d) => {
  const divisores = d === 1 ? [2, 3, 4, 5] : d === 2 ? [6, 7, 8, 9] : [3, 4, 5, 6];
  const cocienteMin = d === 3 ? 11 : 3;
  const cocienteMax = d === 3 ? 16 : 9;
  const crear = (b: number, sobra: number): string => `${b * entero(rng, cocienteMin, cocienteMax) + sobra} ÷ ${b}`;
  const b0 = elegir(rng, divisores);
  const q0 = entero(rng, cocienteMin, cocienteMax);
  const a0 = b0 * q0;
  const candidatos = new Set<string>();
  while (candidatos.size < 3) {
    const b = elegir(rng, divisores);
    candidatos.add(crear(b, entero(rng, 1, b - 1)));
  }
  return {
    enunciado: "¿Cuál de estas divisiones es exacta, es decir, no sobra nada?",
    enunciadoFacil: "Busca la división exacta. En ella no sobra nada.",
    respuesta: textos(`${a0} ÷ ${b0}`, [...candidatos]),
    pista: "Busca el primer número en la tabla del segundo.",
    explicacion: `${a0} ÷ ${b0} = ${q0} y no sobra nada, porque ${q0} × ${b0} = ${a0}.`,
  };
});

// ---------- T3-c Problemas de reparto ----------
const DESTINOS: readonly { readonly varios: string; readonly cada: string }[] = [
  { varios: "cestas", cada: "cesta" },
  { varios: "cajas", cada: "caja" },
  { varios: "bolsas", cada: "bolsa" },
  { varios: "mesas", cada: "mesa" },
];

const problemaRepartir = gen("NUM3-T3-c", (rng, d) => {
  const n = nombre(rng);
  const c = mercancia(rng);
  const destino = elegir(rng, DESTINOS);
  const { b, q } = division(rng, d);
  const a = b * q;
  return {
    enunciado: `${n} reparte ${a} ${c.plural} en ${b} ${destino.varios}. En todas pone la misma cantidad. ¿${cuantos(c)} pone en cada ${destino.cada}?`,
    enunciadoFacil: `Hay ${a} ${c.plural}. Hay ${b} ${destino.varios}. Todas llevan igual. ¿${cuantos(c)} van en cada ${destino.cada}?`,
    respuesta: d === 1 ? opc(rng, q, [q + 1, q - 1, a - b, a + b]) : num(q),
    pista: "Repartir en partes iguales es dividir.",
    explicacion: `${a} ÷ ${b} = ${q}, porque ${q} × ${b} = ${a}.`,
  };
});

const problemaCuantosGrupos = gen("NUM3-T3-c", (rng, d) => {
  const c = contablePorId(elegir(rng, ["huevo", "naranja", "manzana", "botella"]));
  const { b, q } = division(rng, d);
  const a = b * q;
  return {
    enunciado: `Hay ${a} ${c.plural}. En cada caja caben ${b}. ¿Cuántas cajas se llenan?`,
    enunciadoFacil: `Hay ${a} ${c.plural}. Cada caja lleva ${b}. ¿Cuántas cajas se llenan?`,
    respuesta: d === 1 ? opc(rng, q, [q + 1, q - 1, a - b, a + b]) : num(q),
    pista: `¿Cuántas veces cabe ${b} en ${a}?`,
    explicacion: `${a} ÷ ${b} = ${q} cajas.`,
  };
});

const problemaJuntarYRepartir = gen("NUM3-T3-c", (rng, d) => {
  const c = mercancia(rng);
  const b = d === 1 ? entero(rng, 2, 3) : entero(rng, 3, 6);
  const q = d === 1 ? entero(rng, 3, 6) : d === 2 ? entero(rng, 4, 9) : entero(rng, 6, 14);
  const total = b * q;
  if (d === 3) {
    const regalo = entero(rng, 3, 20);
    const inicio = total + regalo;
    return {
      enunciado: `Hay ${inicio} ${c.plural}. Se regalan ${regalo}. El resto se reparte en partes iguales entre ${b} familias. ¿${cuantos(c)} recibe cada familia?`,
      enunciadoFacil: `Hay ${inicio} ${c.plural}. Se regalan ${regalo}. Lo demás se reparte entre ${b} familias. Todas reciben igual. ¿${cuantos(c)} recibe cada familia?`,
      respuesta: num(q),
      pista: "Primero resta. Después reparte.",
      explicacion: `${inicio} − ${regalo} = ${total}, y ${total} ÷ ${b} = ${q}.`,
    };
  }
  const [x, y] = dosNombres(rng);
  const primero = entero(rng, 2, total - 2);
  const segundo = total - primero;
  return {
    enunciado: `${x} tiene ${primero} ${c.plural} y ${y} tiene ${segundo}. ${c.genero === "f" ? "Las juntan todas y las reparten" : "Los juntan todos y los reparten"} en partes iguales entre ${b} grupos. ¿${cuantos(c)} recibe cada grupo?`,
    enunciadoFacil: `${x} tiene ${primero} ${c.plural}. ${y} tiene ${segundo}. ${c.genero === "f" ? "Se juntan todas" : "Se juntan todos"}. Se reparten entre ${b} grupos. Todos reciben igual. ¿${cuantos(c)} recibe cada grupo?`,
    respuesta: num(q),
    pista: "Primero suma. Después reparte.",
    explicacion: `${primero} + ${segundo} = ${total}, y ${total} ÷ ${b} = ${q}.`,
  };
});

export const GENERADORES_3A: MapaGeneradores = {
  "NUM3-T1-a": [bloques, cifraDeUnNumero, descomponer],
  "NUM3-T1-b": [mayorMenor, signoEntre, ordenar, quienVendio],
  "NUM3-T1-c": [redondear, redondearEnRecta, redondearProblema],
  "NUM3-T2-a": [tablaDirecta, tablaHueco, tablaConDibujo],
  "NUM3-T2-b": [porUnaCifra, porUnaCifraErrores, porPartes],
  "NUM3-T2-c": [problemaGrupos, problemaPrecio, problemaDias],
  "NUM3-T3-a": [repartirDibujo, hacerGrupos, elegirReparto],
  "NUM3-T3-b": [dividir, dividirHueco, cualEsExacta],
  "NUM3-T3-c": [problemaRepartir, problemaCuantosGrupos, problemaJuntarYRepartir],
};
