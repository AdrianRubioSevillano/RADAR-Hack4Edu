// NUM 4.º, temas 1 a 3: números grandes, operaciones y fracciones.
import type { Rng } from "../../../core/rng.ts";
import { barajar, elegir, entero, monedas, muestra, nombre } from "../../ayuda.ts";
import type { Dificultad, Imagen, MapaGeneradores } from "../../tipos.ts";
import { contablePorId, cuantos, dosNombres, en, enLetras, gen, grande, mcd, mercancia, num, opc, par, pl, textos, trio } from "./comun.ts";

// ---------- T1-a Hasta 100 000 ----------
function intercambiar(n: number, i: number, j: number): number {
  const c = [...String(n)];
  const x = c[i] as string;
  c[i] = c[j] as string;
  c[j] = x;
  return Number(c.join(""));
}

const leerYEscribir = gen("NUM4-T1-a", (rng, d) => {
  const n = d === 1 ? 1000 * entero(rng, 10, 99) + 100 * entero(rng, 1, 9)
    : d === 2 ? 1000 * entero(rng, 11, 99) + entero(rng, 111, 999)
      : 10000 * entero(rng, 1, 9) + elegir(rng, [entero(rng, 1, 9), 10 * entero(rng, 1, 9), 100 * entero(rng, 1, 9)]);
  const quitarCero = Number(String(n).replace("0", ""));
  const errores = [intercambiar(n, 0, 1), intercambiar(n, 2, 3), intercambiar(n, 3, 4), intercambiar(n, 1, 2), quitarCero, n + 1000, n + 100]
    .filter((x) => x >= 1000 && x < 100000);
  const letras = enLetras(n);
  if (rng() < 0.5) {
    return {
      enunciado: `¿Cómo se escribe con cifras «${letras}»?`,
      enunciadoFacil: `Lee: «${letras}». Elige ese número con cifras.`,
      respuesta: opc(rng, n, errores, 1000),
      pista: "Escribe primero lo que va antes de «mil». Después completa tres cifras.",
      explicacion: `«${letras}» se escribe ${grande(n)}.`,
    };
  }
  return {
    enunciado: `¿Cómo se lee el número ${grande(n)}?`,
    enunciadoFacil: `Mira el número ${grande(n)}. ¿Cómo se lee?`,
    respuesta: opc(rng, n, errores, 1000, enLetras),
    pista: "Lee primero lo que va antes del espacio y di «mil». Después lee el resto.",
    explicacion: `${grande(n)} se lee «${letras}».`,
  };
});

function grandesParaComparar(rng: Rng, d: Dificultad): number[] {
  if (d === 1) {
    const [a, b, c] = trio(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    return [10000 * a + entero(rng, 1000, 9999), 10000 * b + entero(rng, 1000, 9999), 10000 * c + entero(rng, 1000, 9999)];
  }
  if (d === 2) {
    const dm = entero(rng, 1, 9);
    return muestra(rng, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 4).map((um) => 10000 * dm + 1000 * um + entero(rng, 100, 999));
  }
  const inicio = 1000 * entero(rng, 11, 99);
  return muestra(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9], 3).map((c) => inicio + 100 * c + entero(rng, 10, 99)).concat(inicio - 1000 + entero(rng, 900, 999));
}

function motivoGrande(mayor: number, menor: number): string {
  if (String(mayor).length !== String(menor).length) return `${grande(mayor)} tiene más cifras que ${grande(menor)}.`;
  const a = String(mayor);
  const b = String(menor);
  const i = [...a].findIndex((c, k) => c !== b[k]);
  return `Leyendo de izquierda a derecha, la primera cifra distinta es ${a[i] as string} en ${grande(mayor)} y ${b[i] as string} en ${grande(menor)}.`;
}

const compararGrandes = gen("NUM4-T1-a", (rng, d) => {
  const lista = grandesParaComparar(rng, d);
  const quiereMayor = rng() < 0.5;
  const correcta = quiereMayor ? Math.max(...lista) : Math.min(...lista);
  const palabra = quiereMayor ? "mayor" : "menor";
  const otra = en(lista.filter((x) => x !== correcta), 0);
  return {
    enunciado: `¿Cuál de estos números es el ${palabra}?`,
    enunciadoFacil: `Busca el número ${palabra}.`,
    respuesta: textos(grande(correcta), lista.filter((x) => x !== correcta).map(grande)),
    pista: "Compara las cifras de izquierda a derecha.",
    explicacion: `El ${palabra} es ${grande(correcta)}. ${quiereMayor ? motivoGrande(correcta, otra) : motivoGrande(otra, correcta)}`,
  };
});

const siguienteNumero = gen("NUM4-T1-a", (rng, d) => {
  if (d === 3) {
    const paso = elegir(rng, [100, 1000]);
    const inicio = paso === 1000 ? 10000 * entero(rng, 1, 8) + 7000 + 100 * entero(rng, 1, 9) : 1000 * entero(rng, 11, 98) + 700 + 10 * entero(rng, 1, 9);
    const serie = [inicio, inicio + paso, inicio + 2 * paso];
    const r = inicio + 3 * paso;
    const texto = `${serie.map(grande).join(", ")}, ___`;
    return {
      enunciado: `Cuenta de ${paso} en ${paso}. ¿Qué número sigue? ${texto}`,
      enunciadoFacil: `Mira: ${texto}. Suma ${paso} al último número. ¿Qué número sale?`,
      respuesta: num(r),
      pista: "Suma al último número y fíjate si cambia otra cifra.",
      explicacion: `${grande(en(serie, 2))} + ${paso} = ${grande(r)}.`,
    };
  }
  const despues = rng() < 0.6;
  const n = d === 1
    ? 10 * entero(rng, 1001, 9998) + entero(rng, 1, 8)
    : despues ? 1000 * entero(rng, 11, 98) + 999 : 1000 * entero(rng, 11, 98);
  const r = despues ? n + 1 : n - 1;
  const palabra = despues ? "después" : "antes";
  return {
    enunciado: `¿Qué número viene justo ${palabra} de ${grande(n)}?`,
    enunciadoFacil: `Mira el número ${grande(n)}. ¿Qué número va justo ${palabra}?`,
    respuesta: num(r),
    pista: despues ? "Suma 1. Si las unidades pasan de 9, cambian más cifras." : "Resta 1. Si las unidades son 0, cambian más cifras.",
    explicacion: `${grande(n)} ${despues ? "+" : "−"} 1 = ${grande(r)}.`,
  };
});

// ---------- T1-b Valor posicional ----------
const LUGARES = ["decenas de millar", "unidades de millar", "centenas", "decenas", "unidades"] as const;
const POTENCIAS = [10000, 1000, 100, 10, 1] as const;

function cifrasDistintas(rng: Rng): number[] {
  return muestra(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9], 5);
}

function numeroDe(cifras: readonly number[]): number {
  return cifras.reduce((total, c, i) => total + c * en(POTENCIAS, i), 0);
}

const cifraEnLugar = gen("NUM4-T1-b", (rng, d) => {
  const cifras = cifrasDistintas(rng);
  const n = numeroDe(cifras);
  const i = d === 1 ? entero(rng, 2, 4) : entero(rng, 0, 1);
  const cifra = en(cifras, i);
  if (d === 3) {
    const k = entero(rng, 0, 3);
    const lugar = en(LUGARES, k);
    const sube = en(cifras, k) !== 9;
    const r = sube ? n + en(POTENCIAS, k) : n - en(POTENCIAS, k);
    return {
      enunciado: `Al número ${grande(n)} le ${sube ? "sumas" : "restas"} 1 en las ${lugar}. ¿Qué número te sale?`,
      enunciadoFacil: `Mira el número ${grande(n)}. ${sube ? "Suma" : "Resta"} 1 en las ${lugar}. ¿Qué número sale?`,
      respuesta: num(r),
      pista: "Solo cambia la cifra de ese lugar.",
      explicacion: `Cambia solo la cifra de las ${lugar}: queda ${grande(r)}.`,
    };
  }
  return {
    enunciado: `En el número ${grande(n)}, ¿qué cifra está en las ${en(LUGARES, i)}?`,
    enunciadoFacil: `Mira el número ${grande(n)}. ¿Qué cifra está en las ${en(LUGARES, i)}?`,
    respuesta: textos(String(cifra), muestra(rng, cifras.filter((c) => c !== cifra), 3).map(String)),
    pista: "De derecha a izquierda: unidades, decenas, centenas, unidades de millar y decenas de millar.",
    explicacion: `En ${grande(n)}, la cifra de las ${en(LUGARES, i)} es ${cifra}.`,
  };
});

const valorDeCifra = gen("NUM4-T1-b", (rng, d) => {
  const cifras = cifrasDistintas(rng);
  if (d === 3) {
    const [p, q] = [...muestra(rng, [0, 1, 2, 3, 4], 2)].sort((x, y) => x - y) as [number, number];
    const copia = [...cifras];
    copia[q] = en(cifras, p);
    const n = numeroDe(copia);
    const cifra = en(cifras, p);
    const izquierda = rng() < 0.5;
    const i = izquierda ? p : q;
    const valor = cifra * en(POTENCIAS, i);
    const todos = POTENCIAS.map((x) => x * cifra);
    return {
      enunciado: `En el número ${grande(n)} hay dos cifras ${cifra}. ¿Cuánto vale la que está más a la ${izquierda ? "izquierda" : "derecha"}?`,
      enunciadoFacil: `Mira el número ${grande(n)}. Tiene dos cifras ${cifra}. Mira la de la ${izquierda ? "izquierda" : "derecha"}. ¿Cuánto vale?`,
      respuesta: textos(grande(valor), muestra(rng, todos.filter((x) => x !== valor), 3).map(grande)),
      pista: "La misma cifra vale más cuanto más a la izquierda está.",
      explicacion: `Esa cifra está en las ${en(LUGARES, i)}, así que vale ${grande(valor)}.`,
    };
  }
  const n = numeroDe(cifras);
  const i = d === 1 ? entero(rng, 2, 3) : entero(rng, 0, 1);
  const cifra = en(cifras, i);
  const valor = cifra * en(POTENCIAS, i);
  const todos = POTENCIAS.map((x) => x * cifra);
  return {
    enunciado: `¿Cuánto vale la cifra ${cifra} en el número ${grande(n)}?`,
    enunciadoFacil: `Mira el número ${grande(n)}. ¿Cuánto vale la cifra ${cifra}?`,
    respuesta: textos(grande(valor), muestra(rng, todos.filter((x) => x !== valor), 3).map(grande)),
    pista: "Mira en qué lugar está esa cifra.",
    explicacion: `El ${cifra} está en las ${en(LUGARES, i)}, así que vale ${grande(valor)}.`,
  };
});

const componerNumero = gen("NUM4-T1-b", (rng, d) => {
  const cifras = cifrasDistintas(rng);
  if (d === 1) {
    const n = numeroDe(cifras);
    const imagen: Imagen = { tipo: "tabla", titulo: "Tabla de valores", cabeceras: ["Decenas de millar", "Unidades de millar", "Centenas", "Decenas", "Unidades"], filas: [cifras.map(String)] };
    return {
      enunciado: "Mira la tabla. ¿Qué número está escrito?",
      enunciadoFacil: "Lee la tabla. ¿Qué número es?",
      imagen,
      respuesta: num(n),
      pista: "Lee las cifras de izquierda a derecha.",
      explicacion: `${cifras.map((c, i) => grande(c * en(POTENCIAS, i))).join(" + ")} = ${grande(n)}.`,
    };
  }
  if (d === 2) {
    const hueco = entero(rng, 1, 3);
    const conCero = cifras.map((c, i) => (i === hueco ? 0 : c));
    const n = numeroDe(conCero);
    const partes = conCero.map((c, i) => c * en(POTENCIAS, i)).filter((x) => x > 0);
    const desordenadas = [...partes.slice(1), en(partes, 0)];
    const suma = barajar(rng, desordenadas).map(grande).join(" + ");
    return {
      enunciado: `¿Qué número es ${suma}?`,
      enunciadoFacil: `Suma: ${suma}. ¿Qué número es?`,
      respuesta: num(n),
      pista: "Ordénalos de mayor a menor. Falta un lugar: allí va un cero.",
      explicacion: `Ordenado: ${partes.map(grande).join(" + ")} = ${grande(n)}.`,
    };
  }
  const dm = entero(rng, 1, 8);
  const c = entero(rng, 11, 19);
  const u = entero(rng, 1, 9);
  const n = 10000 * dm + 100 * c + u;
  const lista = `${pl(dm, "decena de millar", "decenas de millar")}, ${c} centenas y ${pl(u, "unidad", "unidades")}`;
  return {
    enunciado: `¿Qué número tiene ${lista}?`,
    enunciadoFacil: `Un número tiene ${lista}. ¿Qué número es?`,
    respuesta: num(n),
    pista: "Hay más de 9 centenas. Diez centenas forman una unidad de millar.",
    explicacion: `${grande(10000 * dm)} + ${100 * c} + ${u} = ${grande(n)}.`,
  };
});

// ---------- T1-c Redondeo ----------
function redondear(n: number, paso: number): number {
  return Math.floor((n + paso / 2) / paso) * paso;
}

const NOMBRE_PASO: Readonly<Record<number, { a: string; mira: string }>> = {
  100: { a: "la centena", mira: "las decenas" },
  1000: { a: "la unidad de millar", mira: "las centenas" },
};

function motivoRedondeo(n: number, paso: number): string {
  const info = NOMBRE_PASO[paso] as { a: string; mira: string };
  const cifra = Math.floor(n / (paso / 10)) % 10;
  return `Para redondear ${grande(n)} a ${info.a} miramos ${info.mira}: la cifra es ${cifra}. Como es ${cifra >= 5 ? "5 o más, se sube" : "menos de 5, no se sube"}: queda ${grande(redondear(n, paso))}.`;
}

// Número cuya cifra decisiva no es 5, para no depender de ninguna convención.
function paraRedondear(rng: Rng, min: number, max: number, paso: number): number {
  const base = paso * entero(rng, Math.ceil(min / paso), Math.floor(max / paso));
  return base + (paso / 10) * elegir(rng, [1, 2, 3, 4, 6, 7, 8, 9]) + entero(rng, 0, paso / 10 - 1);
}

const redondearDirecto = gen("NUM4-T1-c", (rng, d) => {
  if (d === 3) {
    const paso = elegir(rng, [100, 1000]);
    const n = paso === 100
      ? 1000 * entero(rng, 1, 8) + 900 + 10 * entero(rng, 6, 9) + entero(rng, 0, 9)
      : 10000 * entero(rng, 1, 8) + 9000 + 100 * entero(rng, 6, 9) + entero(rng, 10, 99);
    const info = NOMBRE_PASO[paso] as { a: string; mira: string };
    return {
      enunciado: `Redondea ${grande(n)} a ${info.a} más cercana.`,
      enunciadoFacil: `Mira el número ${grande(n)}. Redondea a ${info.a} más cercana.`,
      respuesta: num(redondear(n, paso)),
      pista: "Al subir, también cambia la cifra de la izquierda.",
      explicacion: motivoRedondeo(n, paso),
    };
  }
  const paso = d === 1 ? 100 : 1000;
  const n = d === 1 ? paraRedondear(rng, 1000, 9900, 100) : paraRedondear(rng, 11000, 98000, 1000);
  const r = redondear(n, paso);
  const abajo = n - (n % paso);
  const info = NOMBRE_PASO[paso] as { a: string; mira: string };
  return {
    enunciado: `Redondea ${grande(n)} a ${info.a} más cercana.`,
    enunciadoFacil: `Mira el número ${grande(n)}. Redondea a ${info.a} más cercana.`,
    respuesta: d === 1 ? opc(rng, r, [abajo, abajo + paso, r + paso, r - paso], paso) : num(r),
    pista: `Mira ${info.mira}: ¿son menos de 5, o 5 o más?`,
    explicacion: motivoRedondeo(n, paso),
  };
});

const redondearProblema = gen("NUM4-T1-c", (rng, d) => {
  if (d === 3) {
    const a = paraRedondear(rng, 1000, 5000, 100);
    const b = paraRedondear(rng, 1000, 4000, 100);
    const [ra, rb] = [redondear(a, 100), redondear(b, 100)];
    const r = ra + rb;
    return {
      enunciado: `Un camión lleva ${a} kilos y otro lleva ${b} kilos. Redondea cada cantidad a la centena más cercana y suma. ¿Qué número te sale?`,
      enunciadoFacil: `Un camión lleva ${a} kilos. Otro lleva ${b} kilos. Redondea cada número a la centena más cercana. Después suma. ¿Qué número sale?`,
      respuesta: num(r),
      pista: "Redondea primero. Suma después.",
      explicacion: `${a} se redondea a ${ra} y ${b} a ${rb}. ${ra} + ${rb} = ${grande(r)}.`,
    };
  }
  const paso = d === 1 ? 100 : 1000;
  const n = d === 1 ? paraRedondear(rng, 1000, 9900, 100) : paraRedondear(rng, 11000, 98000, 1000);
  const info = NOMBRE_PASO[paso] as { a: string; mira: string };
  return {
    enunciado: `En una ciudad viven ${grande(n)} personas. Redondea ese número a ${info.a} más cercana. ¿Qué número te sale?`,
    enunciadoFacil: `En una ciudad viven ${grande(n)} personas. Redondea a ${info.a} más cercana. ¿Qué número sale?`,
    respuesta: num(redondear(n, paso)),
    pista: `Mira ${info.mira} del número.`,
    explicacion: motivoRedondeo(n, paso),
  };
});

const redondeoInverso = gen("NUM4-T1-c", (rng, d) => {
  const paso = d === 3 ? 1000 : 100;
  const objetivo = d === 1 ? 100 * entero(rng, 3, 9) : d === 2 ? 100 * entero(rng, 11, 98) : 1000 * entero(rng, 11, 98);
  const mitad = paso / 2;
  const cerca = entero(rng, 1, mitad - 1) * (rng() < 0.5 ? 1 : -1);
  const correcta = objetivo + cerca;
  const lista = [objetivo - mitad - entero(rng, 1, mitad - 1), objetivo + mitad + entero(rng, 1, mitad - 1), objetivo + paso + entero(rng, 1, mitad - 1)];
  const info = NOMBRE_PASO[paso] as { a: string; mira: string };
  return {
    enunciado: `¿Cuál de estos números da ${grande(objetivo)} al redondearlo a ${info.a} más cercana?`,
    enunciadoFacil: `Redondea cada número a ${info.a} más cercana. ¿Cuál da ${grande(objetivo)}?`,
    respuesta: textos(grande(correcta), lista.map(grande)),
    pista: "Redondea cada opción y compara con el número pedido.",
    explicacion: motivoRedondeo(correcta, paso),
  };
});

// ---------- T2-a Multiplicar por dos cifras ----------
function explicarDosCifras(a: number, b: number): string {
  const u = b % 10;
  const t = b - u;
  if (u === 0) return `${a} × ${t / 10} = ${grande((a * t) / 10)}, y con el cero queda ${grande(a * b)}.`;
  return `${a} × ${u} = ${grande(a * u)} y ${a} × ${t} = ${grande(a * t)}. Sumados dan ${grande(a * b)}.`;
}

function dosFactores(rng: Rng, d: Dificultad): { a: number; b: number } {
  if (d === 1) return { a: entero(rng, 12, 49), b: 10 * entero(rng, 2, 5) };
  if (d === 2) return { a: entero(rng, 12, 49), b: entero(rng, 11, 19) };
  return rng() < 0.5 ? { a: entero(rng, 23, 98), b: 10 * entero(rng, 2, 7) + entero(rng, 2, 9) } : { a: entero(rng, 102, 399), b: 10 * entero(rng, 1, 3) + entero(rng, 2, 9) };
}

const porDosCifras = gen("NUM4-T2-a", (rng, d) => {
  const { a, b } = dosFactores(rng, d);
  const r = a * b;
  return {
    enunciado: `¿Cuánto es ${a} × ${b}?`,
    enunciadoFacil: `Multiplica ${a} por ${b}.`,
    respuesta: d === 1 ? opc(rng, r, [a * (b / 10), r * 10, a + b, r + 10, r - 10], 10) : num(r),
    pista: d === 1 ? "Multiplica sin el cero y después añade el cero." : "Multiplica por las unidades, luego por las decenas, y suma.",
    explicacion: explicarDosCifras(a, b),
  };
});

const porDosCifrasErrores = gen("NUM4-T2-a", (rng, d) => {
  const a = d === 3 ? entero(rng, 102, 299) : d === 2 ? entero(rng, 23, 98) : entero(rng, 12, 39);
  const b = d === 1 ? entero(rng, 11, 15) : 10 * entero(rng, 1, 4) + entero(rng, 2, 9);
  const r = a * b;
  const u = b % 10;
  const t = Math.floor(b / 10);
  return {
    enunciado: `Elige el resultado correcto de ${a} × ${b}.`,
    enunciadoFacil: `Multiplica: ${a} × ${b}. Elige el resultado.`,
    respuesta: opc(rng, r, [a * u + a * t, a * u, r + 100, r - 100, r + 10, r - 10], 10),
    pista: "Al multiplicar por las decenas, el resultado se desplaza un lugar a la izquierda.",
    explicacion: explicarDosCifras(a, b),
  };
});

const porPartes = gen("NUM4-T2-a", (rng, d) => {
  const n = nombre(rng);
  if (d === 3) {
    const c = mercancia(rng);
    const a = entero(rng, 12, 48);
    const b = entero(rng, 12, 35);
    return {
      enunciado: `En cada caja caben ${b} ${c.plural}. En el mercado llenan ${a} cajas. ¿${cuantos(c)} hay en total?`,
      enunciadoFacil: `Hay ${a} cajas. En cada caja caben ${b} ${c.plural}. ¿${cuantos(c)} hay?`,
      respuesta: num(a * b),
      pista: "Son grupos iguales. Multiplica las dos cantidades.",
      explicacion: `${a} × ${b} = ${grande(a * b)}.`,
    };
  }
  const a = entero(rng, 13, 79);
  const u = entero(rng, 2, 9);
  const b = 10 + u;
  if (d === 1) {
    return {
      enunciado: `Para calcular ${a} × ${b}, ${n} hace ${a} × 10 = ${a * 10} y ${a} × ${u} = ${a * u}. ¿Cuánto es ${a} × ${b}?`,
      enunciadoFacil: `${n} calcula ${a} × ${b}. Sabe que ${a} × 10 = ${a * 10}. Sabe que ${a} × ${u} = ${a * u}. ¿Cuánto es ${a} × ${b}?`,
      respuesta: num(a * b),
      pista: "Suma los dos resultados.",
      explicacion: `${a * 10} + ${a * u} = ${a * b}.`,
    };
  }
  return {
    enunciado: `¿Qué número falta? ${a} × ${b} = ${a * 10} + ___`,
    enunciadoFacil: `Mira: ${a} × ${b} = ${a * 10} + ___. ¿Qué número va en el hueco?`,
    respuesta: num(a * u),
    pista: `Separa ${b} en 10 y lo que queda.`,
    explicacion: `${b} = 10 + ${u}, y el hueco es ${a} × ${u} = ${a * u}.`,
  };
});

// ---------- T2-b Dividir con resto ----------
function divisionConResto(rng: Rng, d: Dificultad): { a: number; b: number; q: number; r: number } {
  const b = d === 3 ? entero(rng, 11, 25) : d === 2 ? entero(rng, 3, 9) : entero(rng, 2, 9);
  const q = d === 1 ? entero(rng, 3, 9) : d === 2 ? entero(rng, 11, 49) : entero(rng, 11, 39);
  const r = entero(rng, 1, b - 1);
  return { a: b * q + r, b, q, r };
}

function cocienteResto(q: number, r: number): string {
  return `Cociente ${q} y resto ${r}`;
}

const cocienteYResto = gen("NUM4-T2-b", (rng, d) => {
  const { a, b, q, r } = divisionConResto(rng, d);
  return {
    enunciado: `Calcula ${a} ÷ ${b}. ¿Cuál es el cociente y cuál es el resto?`,
    enunciadoFacil: `Divide ${a} entre ${b}. Busca el cociente y el resto.`,
    respuesta: textos(cocienteResto(q, r), [cocienteResto(q - 1, r + b), cocienteResto(q + 1, r), r + 1 < b ? cocienteResto(q, r + 1) : cocienteResto(q, r - 1 === 0 ? b + 1 : r - 1)]),
    pista: "El resto siempre es menor que el divisor.",
    explicacion: `${q} × ${b} = ${q * b}, y ${a} − ${q * b} = ${r}. El resto ${r} es menor que ${b}.`,
  };
});

const soloUnaParte = gen("NUM4-T2-b", (rng, d) => {
  const { a, b, q, r } = divisionConResto(rng, d === 3 ? 2 : d);
  if (d === 3) {
    return {
      enunciado: `En una división, el divisor es ${b}, el cociente es ${q} y el resto es ${r}. ¿Cuál es el dividendo?`,
      enunciadoFacil: `Una división tiene divisor ${b}. Tiene cociente ${q}. Tiene resto ${r}. ¿Cuál es el dividendo?`,
      respuesta: num(a),
      pista: "Multiplica el divisor por el cociente y suma el resto.",
      explicacion: `${b} × ${q} = ${b * q}, y ${b * q} + ${r} = ${a}.`,
    };
  }
  const quiereResto = d === 1;
  return {
    enunciado: `¿Cuál es el ${quiereResto ? "resto" : "cociente"} de ${a} ÷ ${b}?`,
    enunciadoFacil: `Divide ${a} entre ${b}. ¿Cuál es el ${quiereResto ? "resto" : "cociente"}?`,
    respuesta: num(quiereResto ? r : q),
    pista: quiereResto ? `Busca el mayor número de la tabla del ${b} que no pasa de ${a}.` : "Divide primero las decenas y después las unidades.",
    explicacion: `${q} × ${b} = ${q * b} y ${r === 1 ? "sobra" : "sobran"} ${r}. El cociente es ${q} y el resto es ${r}.`,
  };
});

const restoImposible = gen("NUM4-T2-b", (rng, d) => {
  const b = d === 1 ? entero(rng, 3, 5) : d === 2 ? entero(rng, 6, 9) : entero(rng, 11, 15);
  const imposible = d === 3 ? b : elegir(rng, [b, b + 1, b + 2]);
  const posibles = muestra(rng, Array.from({ length: b }, (_, i) => i), 3);
  return {
    enunciado: `Al dividir un número entre ${b}, ¿cuál de estos restos NO puede salir?`,
    enunciadoFacil: `Divides un número entre ${b}. Un resto de la lista NO puede salir. ¿Cuál es?`,
    respuesta: textos(String(imposible), posibles.map(String)),
    pista: "Compara cada resto con el divisor.",
    explicacion: `El resto siempre es menor que el divisor. ${imposible} no es menor que ${b}.`,
  };
});

const problemaConResto = gen("NUM4-T2-b", (rng, d) => {
  const c = contablePorId(elegir(rng, ["huevo", "naranja", "manzana", "botella"]));
  const b = entero(rng, 4, 9);
  const q = entero(rng, d === 1 ? 3 : 6, d === 1 ? 9 : 15);
  const r = entero(rng, 1, b - 1);
  const a = b * q + r;
  const base = `Hay ${a} ${c.plural}. En cada caja caben ${b}.`;
  if (d === 1) {
    return {
      enunciado: `${base} ¿Cuántas cajas se llenan del todo?`,
      enunciadoFacil: `${base} ¿Cuántas cajas se llenan?`,
      respuesta: num(q),
      pista: "Divide y mira el cociente.",
      explicacion: `${a} ÷ ${b} da ${q} y ${r === 1 ? "sobra" : "sobran"} ${r}. Se llenan ${q} cajas.`,
    };
  }
  if (d === 2) {
    return {
      enunciado: `${base} Se llenan todas las cajas que se puede. ¿${cuantos(c)} quedan sin caja?`,
      enunciadoFacil: `${base} ¿${cuantos(c)} quedan sin caja?`,
      respuesta: num(r),
      pista: "Lo que queda sin caja es el resto de la división.",
      explicacion: `${q} × ${b} = ${q * b}, y ${a} − ${q * b} = ${r}.`,
    };
  }
  return {
    enunciado: `${base} ¿Cuántas cajas hacen falta para guardar ${c.genero === "f" ? "todas las" : "todos los"} ${c.plural}, aunque una quede sin llenar?`,
    enunciadoFacil: `${base} Hay que guardar ${c.genero === "f" ? "todas" : "todos"}. Una caja puede quedar sin llenar. ¿Cuántas cajas hacen falta?`,
    respuesta: num(q + 1),
    pista: "Piensa qué pasa con lo que sobra después de llenar las cajas.",
    explicacion: `${a} ÷ ${b} da ${q} y ${r === 1 ? "sobra" : "sobran"} ${r}. Lo que sobra necesita otra caja: ${q} + 1 = ${q + 1}.`,
  };
});

// ---------- T2-c Problemas de dos pasos ----------
const dosPasosCompra = gen("NUM4-T2-c", (rng, d) => {
  const n = nombre(rng);
  const cosa = elegir(rng, [["cuadernos", "cada uno"], ["reglas", "cada una"], ["libros", "cada uno"], ["tazas", "cada una"]] as const);
  const a = d === 1 ? entero(rng, 2, 3) : d === 2 ? entero(rng, 3, 6) : entero(rng, 4, 9);
  const p = d === 1 ? entero(rng, 5, 12) : d === 2 ? entero(rng, 12, 30) : entero(rng, 23, 99);
  const paga = d === 1 ? 50 : d === 2 ? 200 : 1000;
  const total = a * p;
  const r = paga - total;
  return {
    enunciado: `${n} compra ${a} ${cosa[0]} a ${monedas(p)} ${cosa[1]}. Paga con ${monedas(paga)}. ¿Cuántas monedas le devuelven?`,
    enunciadoFacil: `${n} compra ${a} ${cosa[0]}. ${cosa[1] === "cada uno" ? "Cada uno" : "Cada una"} cuesta ${monedas(p)}. Paga con ${monedas(paga)}. ¿Cuántas monedas le devuelven?`,
    respuesta: num(r),
    pista: "Primero calcula cuánto cuesta todo. Después calcula el cambio.",
    explicacion: `${a} × ${p} = ${total}, y ${paga} − ${total} = ${r} monedas.`,
  };
});

const dosPasosReparto = gen("NUM4-T2-c", (rng, d) => {
  const c = mercancia(rng);
  const b = d === 1 ? entero(rng, 2, 4) : entero(rng, 3, 8);
  const q = d === 1 ? entero(rng, 4, 9) : d === 2 ? entero(rng, 8, 25) : entero(rng, 12, 60);
  const total = b * q;
  if (d === 3) {
    const regalo = entero(rng, 12, 95);
    const inicio = total + regalo;
    return {
      enunciado: `En un almacén hay ${inicio} ${c.plural}. Se llevan ${regalo} a otra escuela. El resto se reparte en partes iguales entre ${b} clases. ¿${cuantos(c)} recibe cada clase?`,
      enunciadoFacil: `Hay ${inicio} ${c.plural}. Se llevan ${regalo}. Lo demás se reparte entre ${b} clases. Todas reciben igual. ¿${cuantos(c)} recibe cada clase?`,
      respuesta: num(q),
      pista: "Primero resta. Después reparte.",
      explicacion: `${inicio} − ${regalo} = ${total}, y ${total} ÷ ${b} = ${q}.`,
    };
  }
  const primero = entero(rng, Math.ceil(total / 4), Math.floor((3 * total) / 4));
  const segundo = total - primero;
  return {
    enunciado: `Un día llegan ${primero} ${c.plural} a la escuela y otro día llegan ${segundo}. Se reparten todo en partes iguales entre ${b} clases. ¿${cuantos(c)} recibe cada clase?`,
    enunciadoFacil: `Un día llegan ${primero} ${c.plural}. Otro día llegan ${segundo}. Se reparten entre ${b} clases. Todas reciben igual. ¿${cuantos(c)} recibe cada clase?`,
    respuesta: num(q),
    pista: "Primero suma. Después reparte.",
    explicacion: `${primero} + ${segundo} = ${total}, y ${total} ÷ ${b} = ${q}.`,
  };
});

const dosPasosComparar = gen("NUM4-T2-c", (rng, d) => {
  const [x, y] = dosNombres(rng);
  const c = mercancia(rng);
  const a1 = d === 1 ? entero(rng, 3, 5) : entero(rng, 4, 9);
  const b1 = d === 1 ? entero(rng, 4, 9) : d === 2 ? entero(rng, 12, 25) : entero(rng, 26, 60);
  const a2 = d === 1 ? 2 : entero(rng, 2, 3);
  const b2 = d === 1 ? entero(rng, 2, b1 - 1) : entero(rng, 11, b1 - 1);
  const [t1, t2] = [a1 * b1, a2 * b2];
  const r = t1 - t2;
  return {
    enunciado: `${x} llena ${a1} cajas con ${b1} ${c.plural} en cada una. ${y} llena ${a2} cajas con ${b2} ${c.plural} en cada una. ¿${cuantos(c)} más guarda ${x} que ${y}?`,
    enunciadoFacil: `${x} llena ${a1} cajas. Cada caja lleva ${b1} ${c.plural}. ${y} llena ${a2} cajas. Cada caja lleva ${b2} ${c.plural}. ¿${cuantos(c)} más guarda ${x}?`,
    respuesta: num(r),
    pista: "Calcula lo que guarda cada persona. Después resta.",
    explicacion: `${a1} × ${b1} = ${t1} y ${a2} × ${b2} = ${t2}. ${t1} − ${t2} = ${r}.`,
  };
});

// ---------- T3-a Parte de un todo con imagen ----------
type Forma = "circulo" | "barra";

function forma(rng: Rng): Forma {
  return rng() < 0.5 ? "circulo" : "barra";
}

function fraccion(k: number, n: number): string {
  return `${k}/${n}`;
}

function distintasEnValor(lista: readonly [number, number][]): [number, number][] {
  const salida: [number, number][] = [];
  for (const [a, b] of lista) if (!salida.some(([x, y]) => a * y === x * b)) salida.push([a, b]);
  return salida;
}

// Fracciones erróneas típicas, sin ninguna equivalente a k/n ni entre sí.
function fraccionesErroneas(rng: Rng, k: number, n: number, cuantas = 3): string[] {
  const candidatos: [number, number][] = [[n, k], [n - k, n], [k, n + 1], [k + 1, n], [k, n - k], [k + 1, n + 1], [n - k + 1, n]];
  const validos = candidatos.filter(([a, b]) => a > 0 && b > 0 && a * n !== k * b);
  return distintasEnValor(barajar(rng, validos)).slice(0, cuantas).map(([a, b]) => fraccion(a, b));
}

function coprimo(rng: Rng, n: number): number {
  return elegir(rng, Array.from({ length: n - 1 }, (_, i) => i + 1).filter((k) => mcd(k, n) === 1));
}

const AVISO_BARRA = "Escríbela con una barra, como 1/2.";

const queFraccion = gen("NUM4-T3-a", (rng, d) => {
  const f = forma(rng);
  if (d === 3) {
    const n = entero(rng, 6, 12);
    const k = entero(rng, 1, n - 1);
    const blancas = n - k;
    const imagen: Imagen = { tipo: "fraccion", forma: f, partes: n, coloreadas: k };
    return {
      enunciado: "¿Qué fracción de la figura NO está coloreada?",
      enunciadoFacil: "Mira las partes sin color. ¿Qué fracción son?",
      imagen,
      respuesta: textos(fraccion(blancas, n), fraccionesErroneas(rng, blancas, n)),
      pista: "Cuenta todas las partes. Después cuenta las que no tienen color.",
      explicacion: `Hay ${n} partes y ${pl(blancas, "parte está", "partes están")} sin colorear: ${fraccion(blancas, n)}.`,
    };
  }
  const n = d === 1 ? entero(rng, 2, 5) : elegir(rng, [5, 7, 8, 9]);
  const k = d === 1 ? entero(rng, 1, n - 1) : coprimo(rng, n);
  const imagen: Imagen = { tipo: "fraccion", forma: f, partes: n, coloreadas: k };
  return {
    enunciado: d === 1 ? "¿Qué fracción de la figura está coloreada?" : `¿Qué fracción de la figura está coloreada? ${AVISO_BARRA}`,
    enunciadoFacil: d === 1 ? "Mira las partes con color. ¿Qué fracción son?" : `Mira las partes con color. ¿Qué fracción son? ${AVISO_BARRA}`,
    imagen,
    respuesta: d === 1 ? textos(fraccion(k, n), fraccionesErroneas(rng, k, n)) : num(fraccion(k, n)),
    pista: "Abajo van todas las partes. Arriba, las coloreadas.",
    explicacion: `Hay ${n} partes iguales y ${pl(k, "está coloreada", "están coloreadas")}: ${fraccion(k, n)}.`,
  };
});

function dibujoFraccion(f: Forma, k: number, n: number): { texto: string; imagen: Imagen } {
  return { texto: `${f === "circulo" ? "Círculo" : "Barra"} con ${k} de ${n} partes coloreadas`, imagen: { tipo: "fraccion", forma: f, partes: n, coloreadas: k } };
}

const tocarFraccion = gen("NUM4-T3-a", (rng, d) => {
  const f = forma(rng);
  if (d === 3) {
    const [a, b] = elegir(rng, [[1, 2], [1, 3], [1, 4]] as const);
    const m = entero(rng, 2, 3);
    const [k, n] = [a * m, b * m];
    const otras = ([[1, 3], [3, 4], [3, 8], [2, 5], [4, 6], [5, 8], [1, 2], [2, 3], [5, 6]] as const).filter(([x, y]) => x * b !== a * y);
    const elegidas = distintasEnValor(barajar(rng, otras.map(([x, y]): [number, number] => [x, y]))).slice(0, 3);
    return {
      enunciado: `Toca el dibujo que tiene coloreada la misma parte que ${fraccion(a, b)}.`,
      enunciadoFacil: `Busca el dibujo con la misma parte coloreada que ${fraccion(a, b)}. Tócalo.`,
      respuesta: { tipo: "imagen", correcta: dibujoFraccion(f, k, n), distractores: elegidas.map(([x, y]) => dibujoFraccion(f, x, y)) },
      pista: "Compara lo coloreado con el total de partes, aunque haya más partes.",
      explicacion: `${fraccion(k, n)} es lo mismo que ${fraccion(a, b)}: ${k} de ${n} partes es igual que ${a} de ${b}.`,
    };
  }
  const n = d === 1 ? entero(rng, 3, 5) : entero(rng, 6, 9);
  const k = entero(rng, 1, n - 2);
  const distractores: [number, number][] = [[n - k, n], [k + 1, n], [k, n + 1], [k + 1, n + 1]];
  const finales = distintasEnValor(distractores.filter(([x, y]) => x * n !== k * y)).slice(0, 3);
  return {
    enunciado: `Toca el dibujo que muestra ${fraccion(k, n)} coloreado.`,
    enunciadoFacil: `Busca ${fraccion(k, n)} coloreado. Toca ese dibujo.`,
    respuesta: { tipo: "imagen", correcta: dibujoFraccion(f, k, n), distractores: finales.map(([x, y]) => dibujoFraccion(f, x, y)) },
    pista: "El número de abajo dice cuántas partes hay. El de arriba, cuántas tienen color.",
    explicacion: `${fraccion(k, n)} son ${n} partes en total y ${k} con color.`,
  };
});

const fraccionHuerto = gen("NUM4-T3-a", (rng, d) => {
  const n = d === 1 ? entero(rng, 3, 5) : d === 2 ? entero(rng, 6, 8) : elegir(rng, [7, 9, 10]);
  const k = d === 3 ? n - coprimo(rng, n) : entero(rng, 1, n - 1);
  const persona = nombre(rng);
  const imagen: Imagen = { tipo: "fraccion", forma: "barra", partes: n, coloreadas: k };
  const base = `Este huerto tiene ${n} partes iguales. ${persona} sembró las partes coloreadas.`;
  if (d === 3) {
    const libres = n - k;
    return {
      enunciado: `${base} ¿Qué fracción del huerto queda sin sembrar? ${AVISO_BARRA}`,
      enunciadoFacil: `${base} ¿Qué fracción queda sin sembrar? ${AVISO_BARRA}`,
      imagen,
      respuesta: num(fraccion(libres, n)),
      pista: "Cuenta las partes que no tienen color.",
      explicacion: `${libres === 1 ? "Queda" : "Quedan"} ${libres} de ${n} partes sin sembrar: ${fraccion(libres, n)}.`,
    };
  }
  return {
    enunciado: `${base} ¿Qué fracción del huerto sembró?`,
    enunciadoFacil: `${base} ¿Qué fracción sembró?`,
    imagen,
    respuesta: textos(fraccion(k, n), fraccionesErroneas(rng, k, n)),
    pista: "Abajo van todas las partes del huerto.",
    explicacion: `Sembró ${k} de ${n} partes: ${fraccion(k, n)}.`,
  };
});

// ---------- T3-b Comparar fracciones sencillas ----------
type Par = readonly [number, number];
const OCTAVOS: readonly Par[] = [[1, 2], [1, 4], [3, 4], [1, 8], [3, 8], [5, 8], [7, 8]];

function fraccionesParaComparar(rng: Rng, d: Dificultad, cuantas: number): Par[] {
  if (d === 1) {
    const n = entero(rng, 5, 10);
    return muestra(rng, Array.from({ length: n - 1 }, (_, i) => i + 1), cuantas).map((k) => [k, n] as const);
  }
  if (d === 2) {
    const k = entero(rng, 1, 2);
    return muestra(rng, [3, 4, 5, 6, 8, 10], cuantas).map((n) => [k, n] as const);
  }
  return muestra(rng, OCTAVOS, cuantas);
}

function comoOctavos([a, b]: Par): string {
  return `${(a * 8) / b}/8`;
}

function motivoFracciones(mayor: Par, menor: Par, d: Dificultad): string {
  const [m, n] = [fraccion(...mayor), fraccion(...menor)];
  if (d === 1) return `Las partes son del mismo tamaño, y ${mayor[0]} partes son más que ${menor[0]}. Por eso ${m} es mayor que ${n}.`;
  if (d === 2) return `Cuantas más partes tiene el entero, más pequeña es cada una. Por eso ${m} es mayor que ${n}.`;
  return `Si pasamos a octavos, quedan ${comoOctavos(mayor)} y ${comoOctavos(menor)}. Por eso ${m} es mayor que ${n}.`;
}

const valor = ([a, b]: Par): number => a / b;

const mayorFraccion = gen("NUM4-T3-b", (rng, d) => {
  const lista = fraccionesParaComparar(rng, d, 3);
  const quiereMayor = rng() < 0.5;
  const ordenadas = [...lista].sort((x, y) => valor(y) - valor(x));
  const correcta = en(ordenadas, quiereMayor ? 0 : 2);
  const otra = en(ordenadas, 1);
  const palabra = quiereMayor ? "mayor" : "menor";
  return {
    enunciado: `¿Cuál de estas fracciones es la ${palabra}?`,
    enunciadoFacil: `Busca la fracción ${palabra}.`,
    respuesta: textos(fraccion(...correcta), lista.filter((x) => x !== correcta).map((x) => fraccion(...x))),
    pista: d === 1 ? "Abajo pone lo mismo. Compara los números de arriba." : d === 2 ? "Arriba pone lo mismo. Piensa en el tamaño de cada parte." : "Pásalas todas a octavos.",
    explicacion: quiereMayor ? motivoFracciones(correcta, otra, d) : motivoFracciones(otra, correcta, d),
  };
});

const IGUALES: readonly (readonly [Par, Par])[] = [[[1, 2], [2, 4]], [[1, 2], [4, 8]], [[1, 4], [2, 8]], [[3, 4], [6, 8]]];

const signoFracciones = gen("NUM4-T3-b", (rng, d) => {
  const iguales = d === 3 && rng() < 0.4;
  const [a, b] = iguales ? elegir(rng, IGUALES) : par(rng, fraccionesParaComparar(rng, d, 3));
  const [x, y] = rng() < 0.5 ? [a, b] : [b, a];
  const signo = x[0] * y[1] > y[0] * x[1] ? ">" : x[0] * y[1] < y[0] * x[1] ? "<" : "=";
  const cuenta = `${fraccion(...x)} ___ ${fraccion(...y)}`;
  return {
    enunciado: `¿Qué signo va en el hueco? ${cuenta}`,
    enunciadoFacil: `Mira: ${cuenta}. ¿Qué signo va en el hueco?`,
    respuesta: textos(signo, ["<", ">", "="].filter((s) => s !== signo)),
    pista: d === 3 ? "Pasa las dos fracciones a octavos." : "Imagina las dos fracciones dibujadas en barras iguales.",
    explicacion: signo === "=" ? `${fraccion(...x)} y ${fraccion(...y)} son la misma parte: en octavos, las dos son ${comoOctavos(x)}.` : signo === ">" ? motivoFracciones(x, y, d) : motivoFracciones(y, x, d),
  };
});

const quienPintaMas = gen("NUM4-T3-b", (rng, d) => {
  const [p, q] = dosNombres(rng);
  const iguales = d === 3 && rng() < 0.3;
  const [x, y] = iguales ? elegir(rng, IGUALES) : par(rng, fraccionesParaComparar(rng, d, 3));
  const iguala = "Pintan lo mismo";
  const diferencia = x[0] * y[1] - y[0] * x[1];
  const correcta = diferencia === 0 ? iguala : diferencia > 0 ? p : q;
  return {
    enunciado: `${p} y ${q} tienen dos tiras de papel iguales. ${p} pinta ${fraccion(...x)} de la suya y ${q} pinta ${fraccion(...y)} de la suya. ¿Quién pinta más papel?`,
    enunciadoFacil: `Las dos tiras son iguales. ${p} pinta ${fraccion(...x)} de su tira. ${q} pinta ${fraccion(...y)} de su tira. ¿Quién pinta más?`,
    respuesta: textos(correcta, [p, q, iguala].filter((t) => t !== correcta)),
    pista: "Las tiras son iguales, así que basta comparar las dos fracciones.",
    explicacion: diferencia === 0 ? `${fraccion(...x)} y ${fraccion(...y)} son la misma parte: en octavos, las dos son ${comoOctavos(x)}.` : diferencia > 0 ? motivoFracciones(x, y, d) : motivoFracciones(y, x, d),
  };
});

// ---------- T3-c Fracción de una cantidad ----------
function partes(rng: Rng, d: Dificultad): { k: number; b: number; q: number } {
  if (d === 1) return { k: 1, b: entero(rng, 2, 5), q: entero(rng, 2, 10) };
  if (d === 2) return { k: 1, b: entero(rng, 6, 10), q: entero(rng, 3, 12) };
  const b = elegir(rng, [3, 4, 5, 6, 8]);
  return { k: elegir(rng, Array.from({ length: b - 2 }, (_, i) => i + 2).filter((k) => mcd(k, b) === 1)), b, q: entero(rng, 3, 12) };
}

function explicarParte(k: number, b: number, q: number): string {
  const total = b * q;
  return k === 1 ? `${total} ÷ ${b} = ${q}.` : `${total} ÷ ${b} = ${q}, y ${q} × ${k} = ${k * q}.`;
}

const fraccionDe = gen("NUM4-T3-c", (rng, d) => {
  const { k, b, q } = partes(rng, d);
  const total = b * q;
  const r = k * q;
  return {
    enunciado: `¿Cuánto es ${fraccion(k, b)} de ${total}?`,
    enunciadoFacil: `Calcula ${fraccion(k, b)} de ${total}.`,
    respuesta: d === 1 ? opc(rng, r, [total - q, q + 1, q + b, total + b]) : num(r),
    pista: k === 1 ? "Divide el total entre el número de abajo." : "Divide entre el número de abajo y multiplica por el de arriba.",
    explicacion: explicarParte(k, b, q),
  };
});

const fraccionConDibujo = gen("NUM4-T3-c", (rng, d) => {
  const n = nombre(rng);
  const c = mercancia(rng);
  const b = d === 1 ? entero(rng, 2, 4) : d === 2 ? entero(rng, 3, 5) : elegir(rng, [3, 4, 5]);
  const q = d === 1 ? entero(rng, 2, 4) : entero(rng, 3, 5);
  const k = d === 3 ? entero(rng, 2, b - 1) : 1;
  const total = b * q;
  const r = k * q;
  const imagen: Imagen = { tipo: "objetos", grupos: [{ objeto: c.id, cantidad: total }] };
  return {
    enunciado: `${n} se queda con ${fraccion(k, b)} de ${c.genero === "f" ? "estas" : "estos"} ${c.plural}. ¿Con ${cuantos(c).toLowerCase()} se queda?`,
    enunciadoFacil: `Mira el dibujo. ${n} toma ${fraccion(k, b)}. ¿${cuantos(c)} toma?`,
    imagen,
    respuesta: num(r),
    pista: "Cuenta el total. Después haz tantos grupos como dice el número de abajo.",
    explicacion: `Hay ${total}. ${explicarParte(k, b, q)}`,
  };
});

const fraccionProblema = gen("NUM4-T3-c", (rng, d) => {
  const { k, b, q } = partes(rng, d === 2 ? 1 : d);
  const total = b * q;
  const parte = k * q;
  if (d === 1) {
    return {
      enunciado: `En una clase hay ${total} alumnos. ${fraccion(k, b)} de ellos va a pie a la escuela. ¿Cuántos alumnos van a pie?`,
      enunciadoFacil: `Hay ${total} alumnos. ${fraccion(k, b)} van a pie. ¿Cuántos alumnos van a pie?`,
      respuesta: num(parte),
      pista: "Calcula esa fracción del total de alumnos.",
      explicacion: explicarParte(k, b, q),
    };
  }
  const r = total - parte;
  if (d === 2) {
    return {
      enunciado: `Un tanque tiene ${total} litros de agua. Se gasta ${fraccion(k, b)} del agua. ¿Cuántos litros quedan?`,
      enunciadoFacil: `Un tanque tiene ${total} litros. Se gasta ${fraccion(k, b)}. ¿Cuántos litros quedan?`,
      respuesta: num(r),
      pista: "Calcula lo que se gasta. Después réstalo.",
      explicacion: `${total} ÷ ${b} = ${parte} litros gastados, y ${total} − ${parte} = ${r}.`,
    };
  }
  return {
    enunciado: `En un huerto hay ${total} árboles. ${fraccion(k, b)} de ellos dan fruta este año. ¿Cuántos árboles NO dan fruta este año?`,
    enunciadoFacil: `Hay ${total} árboles. ${fraccion(k, b)} dan fruta. ¿Cuántos NO dan fruta?`,
    respuesta: num(r),
    pista: "Calcula los que dan fruta y réstalos del total.",
    explicacion: `${explicarParte(k, b, q)} Dan fruta ${parte}, y ${total} − ${parte} = ${r}.`,
  };
});

export const GENERADORES_4A: MapaGeneradores = {
  "NUM4-T1-a": [leerYEscribir, compararGrandes, siguienteNumero],
  "NUM4-T1-b": [cifraEnLugar, valorDeCifra, componerNumero],
  "NUM4-T1-c": [redondearDirecto, redondearProblema, redondeoInverso],
  "NUM4-T2-a": [porDosCifras, porDosCifrasErrores, porPartes],
  "NUM4-T2-b": [cocienteYResto, soloUnaParte, restoImposible, problemaConResto],
  "NUM4-T2-c": [dosPasosCompra, dosPasosReparto, dosPasosComparar],
  "NUM4-T3-a": [queFraccion, tocarFraccion, fraccionHuerto],
  "NUM4-T3-b": [mayorFraccion, signoFracciones, quienPintaMas],
  "NUM4-T3-c": [fraccionDe, fraccionConDibujo, fraccionProblema],
};
