// PEN3-T3 · Comparar opciones. Los totales y precios por unidad se calculan en código.
import type { Rng } from "../../../core/rng.ts";
import { CONTABLES, cantidad, elegir, entero, monedas, muestra, nombres, type Contable } from "../../ayuda.ts";
import type { Dificultad, Generador } from "../../tipos.ts";
import { buscar, en, generadorDePlantillas, hora, minutos, type Contenido, type Plantilla } from "./comun.ts";

const PRODUCTOS: readonly Contable[] = CONTABLES.filter((c) => ["manzana", "pera", "naranja", "lapiz", "cuaderno", "pelota", "vaso", "huevo", "flor"].includes(c.id));
const IGUAL = "Cuesta lo mismo";

const puesto = (n: string): string => `En el puesto de ${n}`;
const cuantos = (c: Contable): string => (c.genero === "f" ? "Cuántas" : "Cuántos");

// "En el puesto de Ana, 4 peras cuestan 12 monedas."
function oferta(n: string, q: number, c: Contable, p: number): string {
  return `En el puesto de ${n}, ${cantidad(q, c)} cuestan ${monedas(p)}.`;
}

// Versión corta para el enunciado fácil: "Puesto de Ana: 4 peras por 12 monedas."
function ofertaFacil(n: string, q: number, c: Contable, p: number): string {
  return `Puesto de ${n}: ${cantidad(q, c)} por ${monedas(p)}.`;
}

function dosNombres(rng: Rng): [string, string] {
  return nombres(rng, 2) as [string, string];
}

function mismaCantidad(rng: Rng): Contenido {
  const [x, y] = dosNombres(rng);
  const c = elegir(rng, PRODUCTOS);
  const q = entero(rng, 2, 8);
  const [px, py] = muestra(rng, Array.from({ length: 20 }, (_, i) => i + 6), 2) as [number, number];
  const barato = px < py ? x : y;
  const texto = `${oferta(x, q, c, px)} ${oferta(y, q, c, py)}`;
  return {
    enunciado: `${texto} ¿Dónde cuestan menos?`,
    enunciadoFacil: `${ofertaFacil(x, q, c, px)} ${ofertaFacil(y, q, c, py)} ¿Dónde cuestan menos?`,
    respuesta: { tipo: "opcion", correcta: puesto(barato), distractores: [puesto(barato === x ? y : x), "Cuestan lo mismo"] },
    pista: "La cantidad es la misma. Solo tienes que comparar los precios.",
    explicacion: `En los dos puestos hay ${cantidad(q, c)}. ${Math.min(px, py)} monedas es menos que ${Math.max(px, py)}.`,
  };
}

function mismoPrecio(rng: Rng): Contenido {
  const [x, y] = dosNombres(rng);
  const c = elegir(rng, PRODUCTOS);
  const p = entero(rng, 6, 20);
  const [qx, qy] = muestra(rng, [2, 3, 4, 5, 6, 7, 8, 9], 2) as [number, number];
  const mejor = qx > qy ? x : y;
  const texto = `${oferta(x, qx, c, p)} ${oferta(y, qy, c, p)}`;
  return {
    enunciado: `${texto} ¿Dónde te dan más ${c.plural} por ese dinero?`,
    enunciadoFacil: `${ofertaFacil(x, qx, c, p)} ${ofertaFacil(y, qy, c, p)} ¿Dónde te dan más ${c.plural}?`,
    respuesta: { tipo: "opcion", correcta: puesto(mejor), distractores: [puesto(mejor === x ? y : x), "Te dan lo mismo"] },
    pista: "El precio es el mismo. Compara la cantidad.",
    explicacion: `Por ${monedas(p)} te dan ${cantidad(Math.max(qx, qy), c)} en el puesto de ${mejor}, y eso es más que ${Math.min(qx, qy)}.`,
  };
}

function diferencia(rng: Rng): Contenido {
  const [x, y] = dosNombres(rng);
  const c = elegir(rng, PRODUCTOS);
  const q = entero(rng, 2, 6);
  const [px, py] = muestra(rng, Array.from({ length: 25 }, (_, i) => i + 6), 2) as [number, number];
  const texto = `${oferta(x, q, c, px)} ${oferta(y, q, c, py)}`;
  const ahorro = Math.abs(px - py);
  return {
    enunciado: `${texto} ¿Cuántas monedas ahorras si compras en el puesto que cuesta menos?`,
    enunciadoFacil: `${ofertaFacil(x, q, c, px)} ${ofertaFacil(y, q, c, py)} ¿Cuántas monedas ahorras en el puesto que cuesta menos?`,
    respuesta: { tipo: "numero", valor: ahorro },
    pista: "Resta el precio menor al precio mayor.",
    explicacion: `${Math.max(px, py)} menos ${Math.min(px, py)} son ${ahorro}.`,
  };
}

function tablaPrecios(rng: Rng): Contenido {
  const gente = nombres(rng, 3);
  const c = elegir(rng, PRODUCTOS);
  const precios = muestra(rng, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3);
  const minimo = Math.min(...precios);
  const correcta = en(gente, precios.indexOf(minimo));
  return {
    enunciado: `Mira la tabla. ¿En qué puesto cuesta menos cada ${c.singular}?`,
    enunciadoFacil: `Mira la tabla. ¿Dónde cuesta menos cada ${c.singular}?`,
    imagen: { tipo: "tabla", titulo: `Precio de cada ${c.singular}`, cabeceras: ["Puesto", "Monedas"], filas: gente.map((g, i) => [g, String(en(precios, i))]) },
    respuesta: { tipo: "opcion", correcta: puesto(correcta), distractores: gente.filter((g) => g !== correcta).map(puesto) },
    pista: "Busca el número más pequeño de la columna de monedas.",
    explicacion: `${minimo} es el precio más bajo de la tabla, y es el del puesto de ${correcta}.`,
  };
}

// Dos ofertas con precio por unidad exacto. El puesto más barato por unidad no es el del total menor.
function ofertasUnidad(rng: Rng, qMax: number, uMax: number, igual: boolean): { qx: number; qy: number; ux: number; uy: number } {
  return buscar(() => {
    const qx = entero(rng, 2, qMax);
    const qy = entero(rng, 2, qMax);
    const ux = entero(rng, 2, uMax);
    const uy = igual ? ux : entero(rng, 2, uMax);
    if (qx === qy) return null;
    if (!igual && (ux === uy || (ux < uy) === (qx * ux < qy * uy))) return null;
    return { qx, qy, ux, uy };
  });
}

function unitario(rng: Rng, d: Dificultad): Contenido {
  const [x, y] = dosNombres(rng);
  const c = elegir(rng, PRODUCTOS);
  const igual = d === 3 && rng() < 0.35;
  const { qx, qy, ux, uy } = ofertasUnidad(rng, d === 2 ? 6 : 9, d === 2 ? 8 : 9, igual);
  const texto = `${oferta(x, qx, c, qx * ux)} ${oferta(y, qy, c, qy * uy)}`;
  const correcta = ux === uy ? IGUAL : puesto(ux < uy ? x : y);
  const todas = [puesto(x), puesto(y), IGUAL];
  return {
    enunciado: `${texto} ¿Dónde cuesta menos cada ${c.singular}?`,
    enunciadoFacil: `${ofertaFacil(x, qx, c, qx * ux)} ${ofertaFacil(y, qy, c, qy * uy)} ¿Dónde cuesta menos cada ${c.singular}?`,
    respuesta: { tipo: "opcion", correcta, distractores: todas.filter((t) => t !== correcta) },
    pista: `Divide el precio entre la cantidad para saber cuánto cuesta cada ${c.singular}.`,
    explicacion: `Cada ${c.singular} cuesta ${monedas(ux)} en el puesto de ${x} y ${monedas(uy)} en el puesto de ${y}.`,
  };
}

function unitarioNumero(rng: Rng): Contenido {
  const [x, y] = dosNombres(rng);
  const c = elegir(rng, PRODUCTOS);
  const { qx, qy, ux, uy } = ofertasUnidad(rng, 6, 8, false);
  const texto = `${oferta(x, qx, c, qx * ux)} ${oferta(y, qy, c, qy * uy)}`;
  const menor = Math.min(ux, uy);
  return {
    enunciado: `${texto} ¿Cuántas monedas cuesta cada ${c.singular} en el puesto donde es más barato?`,
    enunciadoFacil: `${ofertaFacil(x, qx, c, qx * ux)} ${ofertaFacil(y, qy, c, qy * uy)} Busca dónde cada ${c.singular} es más barato. ¿Cuántas monedas cuesta allí?`,
    respuesta: { tipo: "numero", valor: menor },
    pista: "Haz una división para cada puesto y quédate con el resultado menor.",
    explicacion: `Cada ${c.singular} cuesta ${ux} en el puesto de ${x} y ${uy} en el puesto de ${y}. El menor es ${menor}.`,
  };
}

function tablaUnitario(rng: Rng): Contenido {
  const gente = nombres(rng, 3);
  const c = elegir(rng, PRODUCTOS);
  return buscar(() => {
    const unidades = muestra(rng, [2, 3, 4, 5, 6, 7, 8], 3);
    const cantidades = muestra(rng, [2, 3, 4, 5, 6], 3);
    const totales = unidades.map((u, i) => u * en(cantidades, i));
    const iMin = unidades.indexOf(Math.min(...unidades));
    // El precio total más bajo debe estar en otro puesto.
    if (totales.indexOf(Math.min(...totales)) === iMin) return null;
    const correcta = en(gente, iMin);
    return {
      enunciado: `Mira la tabla. ¿En qué puesto cuesta menos cada ${c.singular}?`,
      enunciadoFacil: `Mira la tabla. ¿Dónde cuesta menos cada ${c.singular}?`,
      imagen: { tipo: "tabla", titulo: "Ofertas del mercado", cabeceras: ["Puesto", "Cantidad", "Monedas"], filas: gente.map((g, i) => [g, String(en(cantidades, i)), String(en(totales, i))]) },
      respuesta: { tipo: "opcion", correcta: puesto(correcta), distractores: gente.filter((g) => g !== correcta).map(puesto) },
      pista: "En cada fila, divide las monedas entre la cantidad.",
      explicacion: `Cada ${c.singular} cuesta ${monedas(Math.min(...unidades))} en el puesto de ${correcta}, y más en los otros.`,
    };
  });
}

function presupuesto(rng: Rng): Contenido {
  const [x, y] = dosNombres(rng);
  const c = elegir(rng, PRODUCTOS);
  const [a, b] = muestra(rng, [2, 3, 4, 5, 6], 2) as [number, number];
  const p = a * b * entero(rng, 1, 2);
  const resultado = Math.abs(p / a - p / b);
  return {
    enunciado: `Tienes ${monedas(p)}. En el puesto de ${x}, cada ${c.singular} cuesta ${monedas(a)}. En el puesto de ${y}, cada ${c.singular} cuesta ${monedas(b)}. ¿${cuantos(c)} ${c.plural} más puedes comprar en el puesto más barato?`,
    enunciadoFacil: `Tienes ${monedas(p)}. Puesto de ${x}: cada ${c.singular} cuesta ${monedas(a)}. Puesto de ${y}: cada ${c.singular} cuesta ${monedas(b)}. ¿${cuantos(c)} ${c.plural} más compras en el puesto más barato?`,
    respuesta: { tipo: "numero", valor: resultado },
    pista: "Calcula cuántos puedes comprar en cada puesto y réstalos.",
    explicacion: `En el puesto de ${x} compras ${p / a} y en el de ${y} compras ${p / b}. La diferencia es ${resultado}.`,
  };
}

function tresOfertas(rng: Rng): Contenido {
  const gente = nombres(rng, 3);
  const c = elegir(rng, PRODUCTOS);
  const unidades = muestra(rng, [2, 3, 4, 5, 6, 7, 8, 9], 3);
  const cantidades = muestra(rng, [2, 3, 4, 5, 6, 7, 8, 9], 3);
  const textos = gente.map((g, i) => oferta(g, en(cantidades, i), c, en(cantidades, i) * en(unidades, i))).join(" ");
  const menor = Math.min(...unidades);
  const correcta = en(gente, unidades.indexOf(menor));
  return {
    enunciado: `${textos} ¿Dónde cuesta menos cada ${c.singular}?`,
    enunciadoFacil: `${gente.map((g, i) => ofertaFacil(g, en(cantidades, i), c, en(cantidades, i) * en(unidades, i))).join(" ")} ¿Dónde cuesta menos cada ${c.singular}?`,
    respuesta: { tipo: "opcion", correcta: puesto(correcta), distractores: [...gente.filter((g) => g !== correcta).map(puesto), "Cuesta lo mismo en los tres"] },
    pista: "Calcula el precio de una unidad en cada puesto. Después compara.",
    explicacion: `Cada ${c.singular} cuesta ${gente.map((g, i) => `${en(unidades, i)} en el puesto de ${g}`).join(", ")}. El menor es ${menor}.`,
  };
}

function paquetes(rng: Rng): Contenido {
  const [x, y] = dosNombres(rng);
  const c = elegir(rng, PRODUCTOS);
  return buscar(() => {
    const [qx, qy] = muestra(rng, [2, 3, 4, 6], 2) as [number, number];
    const n = qx * qy === 24 ? 12 : qx * qy;
    if (n % qx !== 0 || n % qy !== 0) return null;
    const px = entero(rng, 3, 15);
    const py = entero(rng, 3, 15);
    const tx = (n / qx) * px;
    const ty = (n / qy) * py;
    if (tx === ty || Math.abs(tx - ty) > 12) return null;
    const barato = tx < ty ? x : y;
    const texto = `En el puesto de ${x} venden paquetes de ${qx} ${c.plural} por ${monedas(px)}. En el puesto de ${y} venden paquetes de ${qy} ${c.plural} por ${monedas(py)}.`;
    return {
      enunciado: `Necesitas ${n} ${c.plural}. ${texto} ¿Dónde gastas menos en total?`,
      enunciadoFacil: `Necesitas ${n} ${c.plural}. ${texto} ¿Dónde gastas menos?`,
      respuesta: { tipo: "opcion", correcta: puesto(barato), distractores: [puesto(barato === x ? y : x), "Gastas lo mismo"] },
      pista: "Calcula cuántos paquetes necesitas en cada puesto y cuánto pagas en total.",
      explicacion: `En el puesto de ${x} necesitas ${n / qx} paquetes y pagas ${tx}. En el puesto de ${y} necesitas ${n / qy} paquetes y pagas ${ty}.`,
    };
  });
}

function regalo(rng: Rng): Contenido {
  const [x, y] = dosNombres(rng);
  const c = elegir(rng, PRODUCTOS);
  const k = entero(rng, 2, 3);
  const grupos = entero(rng, 2, 3);
  const n = (k + 1) * grupos;
  const pagadas = k * grupos;
  const py = entero(rng, 3, 6);
  const px = py - 1;
  const tx = n * px;
  const ty = pagadas * py;
  const todas = [puesto(x), puesto(y), "Gastas lo mismo"];
  const correcta = tx === ty ? "Gastas lo mismo" : puesto(tx < ty ? x : y);
  return {
    enunciado: `Necesitas ${n} ${c.plural}. En el puesto de ${x}, cada ${c.singular} cuesta ${monedas(px)}. En el puesto de ${y}, cada ${c.singular} cuesta ${monedas(py)}, pero por cada ${k} que compras te regalan 1. ¿Dónde gastas menos?`,
    enunciadoFacil: `Necesitas ${n} ${c.plural}. Puesto de ${x}: cada ${c.singular} cuesta ${monedas(px)}. Puesto de ${y}: cada ${c.singular} cuesta ${monedas(py)}. Por cada ${k} que compras te regalan 1. ¿Dónde gastas menos?`,
    respuesta: { tipo: "opcion", correcta, distractores: todas.filter((t) => t !== correcta) },
    pista: "En el puesto del regalo no pagas todas. Calcula cuántas pagas.",
    explicacion: `En el puesto de ${x} pagas ${n} por ${px}, que son ${tx}. En el puesto de ${y} pagas solo ${pagadas} por ${py}, que son ${ty}.`,
  };
}

const PLANTILLAS_PRECIO: readonly Plantilla[] = [
  { clave: "misma-cantidad", dificultades: [1], crear: mismaCantidad },
  { clave: "mismo-precio", dificultades: [1], crear: mismoPrecio },
  { clave: "diferencia", dificultades: [1], crear: diferencia },
  { clave: "tabla-precios", dificultades: [1], crear: tablaPrecios },
  { clave: "unitario", dificultades: [2, 3], crear: unitario },
  { clave: "unitario-numero", dificultades: [2], crear: unitarioNumero },
  { clave: "tabla-unitario", dificultades: [2], crear: tablaUnitario },
  { clave: "presupuesto", dificultades: [2], crear: presupuesto },
  { clave: "tres-ofertas", dificultades: [3], crear: tresOfertas },
  { clave: "paquetes", dificultades: [3], crear: paquetes },
  { clave: "regalo", dificultades: [3], crear: regalo },
];

// ---------- Comparar por tiempo ----------
const CAMINOS = ["camino del río", "camino del puente", "camino de la plaza", "camino del bosque", "camino de la colina", "camino del molino"] as const;
const DESTINOS = ["a la escuela", "al mercado", "a la biblioteca", "al centro de salud"] as const;
const TAREAS = ["barrer el aula", "regar el huerto", "ordenar los libros", "limpiar la pizarra"] as const;
const IGUAL_T = "Tardas lo mismo";

const por = (c: string): string => `Por el ${c}`;

function dosCaminos(rng: Rng): [string, string] {
  return muestra(rng, CAMINOS, 2) as [string, string];
}

function tiempos2(rng: Rng): [number, number] {
  return muestra(rng, [10, 12, 15, 18, 20, 25, 30, 35, 40], 2) as [number, number];
}

function caminosSimple(rng: Rng): Contenido {
  const [a, b] = dosCaminos(rng);
  const [ta, tb] = tiempos2(rng);
  const destino = elegir(rng, DESTINOS);
  const rapido = ta < tb ? a : b;
  const texto = `Por el ${a} tardas ${minutos(ta)}. Por el ${b} tardas ${minutos(tb)}.`;
  return {
    enunciado: `Quieres ir ${destino}. ${texto} ¿Por qué camino llegas antes?`,
    enunciadoFacil: `${texto} ¿Por qué camino llegas antes?`,
    respuesta: { tipo: "opcion", correcta: por(rapido), distractores: [por(rapido === a ? b : a), IGUAL_T] },
    pista: "Llegas antes por el camino que tarda menos minutos.",
    explicacion: `${minutos(Math.min(ta, tb))} es menos que ${minutos(Math.max(ta, tb))}.`,
  };
}

function caminosTabla(rng: Rng): Contenido {
  const caminos = muestra(rng, CAMINOS, 3);
  const tiempos = muestra(rng, [10, 12, 15, 18, 20, 25, 30, 35, 40], 3);
  const menor = Math.min(...tiempos);
  const correcta = en(caminos, tiempos.indexOf(menor));
  return {
    enunciado: "Mira la tabla. ¿Por qué camino llegas antes?",
    enunciadoFacil: "Mira la tabla. ¿Qué camino es el más rápido?",
    imagen: { tipo: "tabla", titulo: "Tiempo de cada camino", cabeceras: ["Camino", "Minutos"], filas: caminos.map((c, i) => [c, String(en(tiempos, i))]) },
    respuesta: { tipo: "opcion", correcta: por(correcta), distractores: caminos.filter((c) => c !== correcta).map(por) },
    pista: "Busca el número más pequeño de minutos.",
    explicacion: `${minutos(menor)} es el tiempo más corto de la tabla, y es el del ${correcta}.`,
  };
}

function caminosDiferencia(rng: Rng): Contenido {
  const [a, b] = dosCaminos(rng);
  const [ta, tb] = tiempos2(rng);
  const texto = `Por el ${a} tardas ${minutos(ta)}. Por el ${b} tardas ${minutos(tb)}.`;
  const dif = Math.abs(ta - tb);
  return {
    enunciado: `${texto} ¿Cuántos minutos ganas si vas por el camino más rápido?`,
    enunciadoFacil: `${texto} ¿Cuántos minutos ganas por el camino más rápido?`,
    respuesta: { tipo: "numero", valor: dif },
    pista: "Resta los dos tiempos.",
    explicacion: `${Math.max(ta, tb)} menos ${Math.min(ta, tb)} son ${dif} minutos.`,
  };
}

function quienTarda(rng: Rng): Contenido {
  const [x, y] = dosNombres(rng);
  const [tx, ty] = tiempos2(rng);
  const tarea = elegir(rng, TAREAS);
  const rapido = tx < ty ? x : y;
  const texto = `${x} tarda ${minutos(tx)} en ${tarea}. ${y} tarda ${minutos(ty)} en ${tarea}.`;
  return {
    enunciado: `${texto} ¿Quién termina antes si empiezan a la vez?`,
    enunciadoFacil: `${texto} Empiezan a la vez. ¿Quién termina antes?`,
    respuesta: { tipo: "opcion", correcta: rapido, distractores: [rapido === x ? y : x, "Terminan a la vez"] },
    pista: "Termina antes quien tarda menos minutos.",
    explicacion: `${rapido} tarda ${minutos(Math.min(tx, ty))}, que es menos que ${minutos(Math.max(tx, ty))}.`,
  };
}

function tramos(rng: Rng, n: number): number[] {
  return Array.from({ length: n }, () => entero(rng, 4, 20));
}

function frasesTramos(c: string, t: readonly number[]): string {
  if (t.length === 2) return `Por el ${c} caminas ${minutos(en(t, 0))} y descansas ${minutos(en(t, 1))}.`;
  return `Por el ${c} caminas ${minutos(en(t, 0))}, descansas ${minutos(en(t, 1))} y caminas ${minutos(en(t, 2))} más.`;
}

function frasesTramosFacil(c: string, t: readonly number[]): string {
  return `Por el ${c}: ${t.map(minutos).join(" más ")}.`;
}

function sumaTramos(t: readonly number[]): number {
  return t.reduce((a, b) => a + b, 0);
}

function dosTramos(rng: Rng): Contenido {
  const [a, b] = dosCaminos(rng);
  return buscar(() => {
    const ta = tramos(rng, 2);
    const tb = tramos(rng, 2);
    const sa = sumaTramos(ta);
    const sb = sumaTramos(tb);
    if (sa === sb || Math.max(...ta) === Math.max(...tb)) return null;
    // Quien tiene el tramo más largo no tiene por qué ser el más lento.
    if ((Math.max(...ta) < Math.max(...tb)) === (sa < sb)) return null;
    const rapido = sa < sb ? a : b;
    const texto = `${frasesTramos(a, ta)} ${frasesTramos(b, tb)}`;
    return {
      enunciado: `${texto} ¿Por qué camino llegas antes?`,
      enunciadoFacil: `${frasesTramosFacil(a, ta)} ${frasesTramosFacil(b, tb)} ¿Por qué camino llegas antes?`,
      respuesta: { tipo: "opcion", correcta: por(rapido), distractores: [por(rapido === a ? b : a), IGUAL_T] },
      pista: "Suma todos los minutos de cada camino.",
      explicacion: `Por el ${a} son ${minutos(sa)} y por el ${b} son ${minutos(sb)}.`,
    };
  });
}

function autobusOPie(rng: Rng): Contenido {
  return buscar(() => {
    const pie = entero(rng, 20, 45);
    const espera = entero(rng, 5, 20);
    const viaje = entero(rng, 8, 25);
    const bus = espera + viaje;
    if (bus === pie || Math.abs(bus - pie) > 12 || viaje >= pie) return null;
    const correcta = pie < bus ? "A pie" : "En autobús";
    const texto = `A pie tardas ${minutos(pie)}. En autobús esperas ${minutos(espera)} y el viaje dura ${minutos(viaje)}.`;
    return {
      enunciado: `${texto} ¿Cómo llegas antes?`,
      enunciadoFacil: `A pie: ${minutos(pie)}. En autobús: esperas ${minutos(espera)}. El viaje dura ${minutos(viaje)}. ¿Cómo llegas antes?`,
      respuesta: { tipo: "opcion", correcta, distractores: [pie < bus ? "En autobús" : "A pie", IGUAL_T] },
      pista: "En el autobús también cuenta el tiempo de espera.",
      explicacion: `En autobús son ${espera} más ${viaje}, que son ${minutos(bus)}. A pie son ${minutos(pie)}.`,
    };
  });
}

function tramosNumero(rng: Rng): Contenido {
  const [a, b] = dosCaminos(rng);
  return buscar(() => {
    const ta = tramos(rng, 2);
    const tb = tramos(rng, 2);
    const sa = sumaTramos(ta);
    const sb = sumaTramos(tb);
    if (sa === sb) return null;
    const texto = `${frasesTramos(a, ta)} ${frasesTramos(b, tb)}`;
    return {
      enunciado: `${texto} ¿Cuántos minutos en total tardas por el camino más rápido?`,
      enunciadoFacil: `${frasesTramosFacil(a, ta)} ${frasesTramosFacil(b, tb)} ¿Cuántos minutos tardas por el camino más rápido?`,
      respuesta: { tipo: "numero", valor: Math.min(sa, sb) },
      pista: "Suma los minutos de cada camino y quédate con el total menor.",
      explicacion: `Por el ${a} son ${sa} minutos y por el ${b} son ${sb}. El menor es ${Math.min(sa, sb)}.`,
    };
  });
}

function tablaTramos(rng: Rng): Contenido {
  const caminos = muestra(rng, CAMINOS, 3);
  return buscar(() => {
    const filas = caminos.map(() => tramos(rng, 2));
    const sumas = filas.map(sumaTramos);
    const menor = Math.min(...sumas);
    if (sumas.filter((s) => s === menor).length !== 1) return null;
    const correcta = en(caminos, sumas.indexOf(menor));
    return {
      enunciado: "Mira la tabla. Cada camino tiene dos partes. ¿Por qué camino llegas antes?",
      enunciadoFacil: "Mira la tabla. Suma las dos partes. ¿Qué camino es el más rápido?",
      imagen: { tipo: "tabla", titulo: "Minutos de cada parte", cabeceras: ["Camino", "Parte 1", "Parte 2"], filas: caminos.map((c, i) => [c, String(en(en(filas, i), 0)), String(en(en(filas, i), 1))]) },
      respuesta: { tipo: "opcion", correcta: por(correcta), distractores: caminos.filter((c) => c !== correcta).map(por) },
      pista: "Suma las dos partes de cada fila.",
      explicacion: `El ${correcta} suma ${minutos(menor)}, menos que los otros.`,
    };
  });
}

function llegarATiempo(rng: Rng): Contenido {
  const caminos = muestra(rng, CAMINOS, 3);
  const abre = elegir(rng, [480, 495, 510, 540]);
  const margen = elegir(rng, [20, 25, 30, 35, 40]);
  const sale = abre - margen;
  const bueno = margen - entero(rng, 1, 8);
  const malos = [margen + entero(rng, 1, 5), margen + entero(rng, 6, 15)];
  const tiempos = muestra(rng, [bueno, ...malos], 3);
  const correcta = en(caminos, tiempos.indexOf(bueno));
  const texto = caminos.map((c, i) => `Por el ${c} tardas ${minutos(en(tiempos, i))}.`).join(" ");
  return {
    enunciado: `La clase empieza a las ${hora(abre)} y sales de casa a las ${hora(sale)}. ${texto} ¿Por qué camino llegas antes de que empiece la clase?`,
    enunciadoFacil: `La clase empieza a las ${hora(abre)}. Sales a las ${hora(sale)}. ${texto} ¿Por qué camino llegas a tiempo?`,
    respuesta: { tipo: "opcion", correcta: por(correcta), distractores: caminos.filter((c) => c !== correcta).map(por) },
    pista: "Calcula cuántos minutos hay desde que sales hasta que empieza la clase.",
    explicacion: `Tienes ${minutos(margen)}. Solo el ${correcta}, con ${minutos(bueno)}, tarda menos que eso.`,
  };
}

function filas(rng: Rng): Contenido {
  return buscar(() => {
    const pa = entero(rng, 3, 9);
    const ma = entero(rng, 2, 6);
    const pb = entero(rng, 3, 9);
    const mb = entero(rng, 2, 6);
    const ta = pa * ma;
    const tb = pb * mb;
    if (pa === pb || ma === mb) return null;
    // Menos personas no siempre es menos espera.
    if (ta !== tb && (pa < pb) === (ta < tb)) return null;
    const correcta = ta === tb ? "Esperas lo mismo" : ta < tb ? "En la fila A" : "En la fila B";
    const todas = ["En la fila A", "En la fila B", "Esperas lo mismo"];
    const texto = `En la fila A hay ${pa} personas y cada una tarda ${minutos(ma)}. En la fila B hay ${pb} personas y cada una tarda ${minutos(mb)}.`;
    return {
      enunciado: `${texto} ¿En qué fila esperas menos?`,
      enunciadoFacil: `Fila A: ${pa} personas. Cada una tarda ${minutos(ma)}. Fila B: ${pb} personas. Cada una tarda ${minutos(mb)}. ¿En qué fila esperas menos?`,
      respuesta: { tipo: "opcion", correcta, distractores: todas.filter((t) => t !== correcta) },
      pista: "Multiplica las personas por los minutos de cada una.",
      explicacion: `En la fila A esperas ${pa} por ${ma}, que son ${minutos(ta)}. En la fila B esperas ${pb} por ${mb}, que son ${minutos(tb)}.`,
    };
  });
}

function viajes(rng: Rng): Contenido {
  return buscar(() => {
    const cubos = elegir(rng, [4, 6, 8, 12]);
    const ca = elegir(rng, [2, 3, 4]);
    const cb = elegir(rng, [1, 2]);
    if (ca <= cb || cubos % ca !== 0 || cubos % cb !== 0) return null;
    const ma = entero(rng, 8, 20);
    const mb = entero(rng, 3, ma - 2);
    const ta = (cubos / ca) * ma;
    const tb = (cubos / cb) * mb;
    if (ta === tb || Math.abs(ta - tb) > 20) return null;
    const cubo = (n: number): string => `${n} ${n === 1 ? "cubo" : "cubos"}`;
    const texto = `Cada viaje al pozo grande dura ${minutos(ma)} y traes ${cubo(ca)}. Cada viaje al pozo pequeño dura ${minutos(mb)} y traes ${cubo(cb)}.`;
    return {
      enunciado: `Necesitas ${cubos} cubos de agua. ${texto} ¿Con qué pozo terminas antes?`,
      enunciadoFacil: `Necesitas ${cubos} cubos. Pozo grande: ${minutos(ma)} cada viaje, ${cubo(ca)}. Pozo pequeño: ${minutos(mb)} cada viaje, ${cubo(cb)}. ¿Con qué pozo terminas antes?`,
      respuesta: { tipo: "opcion", correcta: ta < tb ? "Con el pozo grande" : "Con el pozo pequeño", distractores: [ta < tb ? "Con el pozo pequeño" : "Con el pozo grande", "Terminas a la vez"] },
      pista: "Calcula cuántos viajes necesitas en cada pozo y multiplica por los minutos.",
      explicacion: `Al pozo grande haces ${cubos / ca} viajes: ${minutos(ta)}. Al pozo pequeño haces ${cubos / cb} viajes: ${minutos(tb)}.`,
    };
  });
}

function sobranMinutos(rng: Rng): Contenido {
  const [a, b] = dosCaminos(rng);
  const abre = elegir(rng, [480, 510, 540]);
  const margen = elegir(rng, [30, 35, 40, 45, 50]);
  const sale = abre - margen;
  const [ta, tb] = muestra(rng, [12, 15, 18, 20, 22, 25, 28], 2) as [number, number];
  const sobran = margen - Math.min(ta, tb);
  return {
    enunciado: `La clase empieza a las ${hora(abre)} y sales de casa a las ${hora(sale)}. Por el ${a} tardas ${minutos(ta)}. Por el ${b} tardas ${minutos(tb)}. Si vas por el camino más rápido, ¿cuántos minutos antes de empezar la clase llegas?`,
    enunciadoFacil: `La clase empieza a las ${hora(abre)}. Sales a las ${hora(sale)}. Por el ${a} tardas ${minutos(ta)}. Por el ${b} tardas ${minutos(tb)}. Vas por el más rápido. ¿Cuántos minutos antes llegas?`,
    respuesta: { tipo: "numero", valor: sobran },
    pista: "Calcula el tiempo que tienes y réstale lo que tarda el camino más rápido.",
    explicacion: `Tienes ${minutos(margen)} y el camino más rápido tarda ${minutos(Math.min(ta, tb))}. Te sobran ${minutos(sobran)}.`,
  };
}

const PLANTILLAS_TIEMPO: readonly Plantilla[] = [
  { clave: "caminos", dificultades: [1], crear: caminosSimple },
  { clave: "caminos-tabla", dificultades: [1], crear: caminosTabla },
  { clave: "caminos-diferencia", dificultades: [1], crear: caminosDiferencia },
  { clave: "quien", dificultades: [1], crear: quienTarda },
  { clave: "tramos", dificultades: [2], crear: dosTramos },
  { clave: "autobus", dificultades: [2], crear: autobusOPie },
  { clave: "tramos-numero", dificultades: [2], crear: tramosNumero },
  { clave: "tramos-tabla", dificultades: [2], crear: tablaTramos },
  { clave: "a-tiempo", dificultades: [3], crear: llegarATiempo },
  { clave: "filas", dificultades: [3], crear: filas },
  { clave: "viajes", dificultades: [3], crear: viajes },
  { clave: "sobran", dificultades: [3], crear: sobranMinutos },
];

export const GENERADORES_COMPARAR3: Readonly<Record<string, readonly Generador[]>> = {
  "PEN3-T3-a": [generadorDePlantillas("PEN3-T3-a", PLANTILLAS_PRECIO)],
  "PEN3-T3-b": [generadorDePlantillas("PEN3-T3-b", PLANTILLAS_TIEMPO)],
};
