// 6.º: proporcionalidad, porcentajes y presupuesto.
import type { Rng } from "../../../core/rng.ts";
import { elegir, entero, nombre } from "../../ayuda.ts";
import type { Dificultad, MapaGeneradores } from "../../tipos.ts";
import {
  BARATOS, CAROS, articuloBarato, articuloCaro, conComa, dinero, dosCifras, generadores, mayus, numero, opciones, opcionesDinero, opcionesNumero,
  par, porNivel, rango, trio, type Plantilla,
} from "./comun.ts";

type Dato = readonly [number, number];

// Precio de una unidad, en centésimas.
function precioUnidad(rng: Rng, d: Dificultad): number {
  return porNivel(d, entero(rng, 2, 9) * 100, entero(rng, 1, 6) * 100 + 50, entero(rng, 1, 5) * 100 + elegir(rng, [20, 25, 40, 60, 75, 80]));
}

const PRODUCTOS = ["arroz", "harina", "sal", "maíz"] as const;

// ---------- NUM6-T1-a: precio por unidad ----------
const precioDeUno: Plantilla = (rng, d) => {
  const x = articuloBarato(rng);
  const n = entero(rng, 3, 9);
  const u = precioUnidad(rng, d);
  const total = n * u;
  return {
    enunciado: `${n} ${x.plural} cuestan ${dinero(total)}. Todas las unidades cuestan lo mismo. ¿Cuántas monedas cuesta cada ${x.nombre}?`,
    enunciadoFacil: `${n} ${x.plural} cuestan ${dinero(total)}. Cada unidad cuesta igual. ¿Cuántas monedas cuesta cada unidad?`,
    respuesta: numero(conComa(u)),
    pista: "Reparte el precio total entre el número de unidades.",
    explicacion: `${conComa(total)} ÷ ${n} = ${conComa(u)}.`,
  };
};

const precioDeOtraCantidad: Plantilla = (rng, d) => {
  const x = articuloBarato(rng);
  const [n1, n2] = par(rng, rango(2, 9));
  const u = precioUnidad(rng, d);
  const t1 = n1 * u;
  const t2 = n2 * u;
  return {
    enunciado: `${n1} ${x.plural} cuestan ${dinero(t1)}. Con el mismo precio por unidad, ¿cuánto cuestan ${n2} ${x.plural}?`,
    enunciadoFacil: `${n1} ${x.plural} cuestan ${dinero(t1)}. Cada unidad cuesta igual. ¿Cuánto cuestan ${n2} ${x.plural}?`,
    respuesta: opcionesDinero(rng, t2, [t1 + (n2 - n1) * 100, t1 * n2, u, t2 + u, Math.abs(t2 - u)], u),
    pista: "Calcula primero cuánto cuesta una unidad.",
    explicacion: `Una unidad cuesta ${conComa(t1)} ÷ ${n1} = ${conComa(u)}, y ${n2} × ${conComa(u)} = ${conComa(t2)}.`,
  };
};

const cuantoPuedoComprar: Plantilla = (rng, d) => {
  const p = elegir(rng, PRODUCTOS);
  const [n1, n2] = par(rng, rango(2, 12));
  const u = precioUnidad(rng, d);
  return {
    enunciado: `${n1} kg de ${p} cuestan ${dinero(n1 * u)}. ¿Cuántos kilos de ${p} se compran con ${dinero(n2 * u)}?`,
    enunciadoFacil: `${n1} kg de ${p} cuestan ${dinero(n1 * u)}. Tienes ${dinero(n2 * u)}. ¿Cuántos kilos compras?`,
    respuesta: numero(n2),
    pista: "Calcula cuánto cuesta 1 kg. Después mira cuántas veces cabe ese precio.",
    explicacion: `1 kg cuesta ${conComa(u)}, y ${conComa(n2 * u)} ÷ ${conComa(u)} = ${n2}.`,
  };
};

const tablaDePrecios: Plantilla = (rng, d) => {
  const [a, b] = par(rng, rango(2, 6));
  const c = d === 3 ? entero(rng, 10, 15) : entero(rng, 7, 9);
  const u = precioUnidad(rng, d);
  return {
    enunciado: "En esta tabla, cada unidad cuesta lo mismo. ¿Qué número va en lugar del signo de interrogación?",
    enunciadoFacil: "Cada unidad cuesta lo mismo. ¿Qué número falta en la tabla?",
    imagen: { tipo: "tabla", titulo: "Precios", cabeceras: ["Unidades", "Monedas"], filas: [[String(a), dosCifras(a * u)], [String(b), dosCifras(b * u)], [String(c), "?"]] },
    respuesta: numero(conComa(c * u)),
    pista: "Divide cualquier precio entre sus unidades para saber cuánto cuesta una.",
    explicacion: `Cada unidad cuesta ${conComa(u)}, y ${c} × ${conComa(u)} = ${conComa(c * u)}.`,
  };
};

// ---------- NUM6-T1-b: recetas y cantidades ----------
// Personas de la receta y personas pedidas, con un cambio cada vez menos directo.
function personas(rng: Rng, d: Dificultad): Dato {
  return elegir(rng, porNivel<readonly Dato[]>(d, [[2, 4], [2, 6], [3, 6], [3, 9], [4, 8], [5, 10]], [[2, 3], [4, 6], [6, 9], [8, 12], [10, 15]], [[3, 7], [4, 7], [5, 8], [6, 10], [4, 10], [3, 5]]));
}

const escalarReceta: Plantilla = (rng, d) => {
  const [p1, p2] = personas(rng, d);
  const u = entero(rng, 2, 12) * 10;
  const i = elegir(rng, ["harina", "arroz", "verduras"]);
  return {
    enunciado: `Para ${p1} personas se usan ${p1 * u} gramos de ${i}. ¿Cuántos gramos de ${i} hacen falta para ${p2} personas?`,
    enunciadoFacil: `Para ${p1} personas se usan ${p1 * u} gramos de ${i}. ¿Cuántos gramos hacen falta para ${p2} personas?`,
    respuesta: opcionesNumero(rng, p2 * u, [p1 * u + (p2 - p1), p1 * u + (p2 - p1) * 10, p1 * u * p2, u, (p1 + p2) * u], (v) => `${v} gramos`, u),
    pista: "Calcula primero cuánto hace falta para 1 persona.",
    explicacion: `Para 1 persona son ${p1 * u} ÷ ${p1} = ${u} gramos, y ${u} × ${p2} = ${p2 * u}.`,
  };
};

const notaDeReceta: Plantilla = (rng, d) => {
  const [p1, p2] = personas(rng, d);
  const [uv, ua] = [entero(rng, 5, 15) * 10, entero(rng, 10, 25) * 10];
  const us = entero(rng, 2, 5);
  const [ingrediente, u] = elegir<readonly [string, number]>(rng, [["verduras", uv], ["sal", us]]);
  return {
    enunciado: `Mira la receta. ¿Cuántos gramos de ${ingrediente} hacen falta para ${p2} personas?`,
    enunciadoFacil: `Mira la receta. Es para ${p1} personas. ¿Cuántos gramos de ${ingrediente} hacen falta para ${p2} personas?`,
    imagen: { tipo: "cartel", estilo: "nota", titulo: `Sopa para ${p1} personas`, lineas: [`Verduras: ${p1 * uv} g`, `Agua: ${p1 * ua} ml`, `Sal: ${p1 * us} g`] },
    respuesta: numero(p2 * u),
    pista: "Busca el ingrediente en la nota. Calcula cuánto hace falta para 1 persona.",
    explicacion: `Para 1 persona son ${p1 * u} ÷ ${p1} = ${u} g, y ${u} × ${p2} = ${p2 * u}.`,
  };
};

const litrosParaTodos: Plantilla = (rng, d) => {
  const [p1, p2] = personas(rng, d);
  const u = porNivel(d, entero(rng, 1, 2) * 50, entero(rng, 1, 3) * 50, entero(rng, 1, 3) * 25); // centésimas de litro por persona
  const se = p1 * u === 100 ? "se usa 1 litro" : `se usan ${conComa(p1 * u)} litros`;
  return {
    enunciado: `Para preparar agua con limón para ${p1} personas ${se} de agua. ¿Cuántos litros hacen falta para ${p2} personas?`,
    enunciadoFacil: `Para ${p1} personas ${se} de agua. ¿Cuántos litros hacen falta para ${p2} personas?`,
    respuesta: numero(conComa(p2 * u)),
    pista: "Calcula cuánta agua corresponde a 1 persona.",
    explicacion: `Para 1 persona: ${conComa(p1 * u)} ÷ ${p1} = ${conComa(u)}, y ${conComa(u)} × ${p2} = ${conComa(p2 * u)}.`,
  };
};

const paraCuantasPersonas: Plantilla = (rng, d) => {
  const [p1, p2] = personas(rng, d);
  const u = entero(rng, 3, 15) * 10;
  return {
    enunciado: `Con ${p1 * u} gramos de arroz comen ${p1} personas. Con la misma cantidad por persona, ¿cuántas personas comen con ${p2 * u} gramos?`,
    enunciadoFacil: `Con ${p1 * u} gramos de arroz comen ${p1} personas. Cada persona come igual. ¿Cuántas personas comen con ${p2 * u} gramos?`,
    respuesta: numero(p2),
    pista: "Calcula cuántos gramos come cada persona.",
    explicacion: `Cada persona come ${p1 * u} ÷ ${p1} = ${u} gramos, y ${p2 * u} ÷ ${u} = ${p2}.`,
  };
};

const mezclarPintura: Plantilla = (rng, d) => {
  const [a, b] = elegir(rng, porNivel<readonly Dato[]>(d, [[1, 2], [1, 3], [2, 1], [3, 1]], [[2, 3], [3, 2], [3, 4], [4, 3]], [[3, 5], [5, 3], [4, 5], [5, 4]]));
  const k = porNivel(d, entero(rng, 2, 5), entero(rng, 2, 6), entero(rng, 3, 9));
  return {
    enunciado: `Para hacer pintura verde ${a === 1 ? "se mezcla 1 bote" : `se mezclan ${a} botes`} de azul por cada ${b === 1 ? "bote" : `${b} botes`} de amarillo. Si usas ${a * k} botes de azul, ¿cuántos botes de amarillo necesitas para el mismo verde?`,
    enunciadoFacil: `La pintura verde lleva ${a === 1 ? "1 bote" : `${a} botes`} de azul por cada ${b === 1 ? "1 bote" : `${b} botes`} de amarillo. Usas ${a * k} botes de azul. ¿Cuántos botes de amarillo necesitas?`,
    respuesta: opcionesNumero(rng, b * k, [a * k + (b - a), a * k, b + k, a * b * k, b * k + a]),
    pista: "Piensa cuántas veces se ha repetido la mezcla.",
    explicacion: `${a * k} ÷ ${a} = ${k}: la mezcla se repite ${k} veces. Entonces, ${b} × ${k} = ${b * k}.`,
  };
};

// ---------- NUM6-T1-c: comparar ofertas ----------
const OFERTAS = ["La oferta A", "La oferta B", "Las dos cuestan lo mismo por unidad"] as const;

const compararDosOfertas: Plantilla = (rng, d) => {
  const x = articuloBarato(rng);
  const [n1, n2] = par(rng, rango(2, 8));
  const u1 = porNivel(d, entero(rng, 3, 9) * 100, entero(rng, 3, 9) * 100, entero(rng, 2, 6) * 100 + elegir(rng, [25, 50, 75]));
  const u2 = u1 + porNivel(d, elegir(rng, [-200, 200]), elegir(rng, [-50, 50]), elegir(rng, [-25, 0, 25]));
  const correcta = u1 < u2 ? OFERTAS[0] : u1 > u2 ? OFERTAS[1] : OFERTAS[2];
  return {
    enunciado: `Oferta A: ${n1} ${x.plural} por ${dinero(n1 * u1)}. Oferta B: ${n2} ${x.plural} por ${dinero(n2 * u2)}. ¿En qué oferta sale más barata cada unidad?`,
    enunciadoFacil: `Oferta A: ${n1} ${x.plural} por ${dinero(n1 * u1)}. Oferta B: ${n2} ${x.plural} por ${dinero(n2 * u2)}. ¿Dónde cuesta menos una unidad?`,
    respuesta: opciones(correcta, OFERTAS.filter((o) => o !== correcta)),
    pista: "Calcula el precio de una unidad en cada oferta.",
    explicacion: `En la oferta A cada unidad cuesta ${dinero(u1)} y en la oferta B, ${dinero(u2)}.`,
  };
};

const litroMasBarato: Plantilla = (rng, d) => {
  const [l1, l2] = par(rng, porNivel(d, [2, 3, 4, 5], [2, 3, 4, 5, 6], [3, 4, 5, 6, 8]));
  const u1 = porNivel(d, entero(rng, 2, 6) * 100, entero(rng, 1, 5) * 100 + 50, entero(rng, 1, 5) * 100 + elegir(rng, [25, 75]));
  const u2 = u1 + elegir(rng, [50, 100]);
  const barato = Math.min(u1, u2);
  return {
    enunciado: `Una botella de aceite de ${l1} litros cuesta ${dinero(l1 * u1)} y otra de ${l2} litros cuesta ${dinero(l2 * u2)}. ¿Cuántas monedas cuesta cada litro en la botella que sale más barata por litro?`,
    enunciadoFacil: `Una botella de ${l1} litros cuesta ${dinero(l1 * u1)}. Otra de ${l2} litros cuesta ${dinero(l2 * u2)}. Busca la que tiene el litro más barato. ¿Cuántas monedas cuesta ese litro?`,
    respuesta: numero(conComa(barato)),
    pista: "Divide el precio de cada botella entre sus litros y quédate con el número menor.",
    explicacion: `En la primera, cada litro cuesta ${conComa(u1)}. En la segunda, ${conComa(u2)}. El más barato es ${conComa(barato)}.`,
  };
};

const tresPorDos: Plantilla = (rng, d) => {
  const x = articuloCaro(rng);
  const pa = porNivel(d, entero(rng, 3, 8) * 3, entero(rng, 3, 8) * 3 + 1, entero(rng, 3, 8) * 3 + 2);
  const totalA = 2 * pa;
  const pb = Math.floor(totalA / 3) + elegir(rng, [-2, -1, 1, 2]);
  const totalB = 3 * pb;
  return {
    enunciado: `Quieres 3 ${x.plural}. En la tienda A cada unidad cuesta ${dinero(pa * 100)}, pero si te llevas 3 pagas solo 2. En la tienda B cada unidad cuesta ${dinero(pb * 100)} y no hay oferta. ¿Cuántas monedas ahorras al comprar en la tienda más barata?`,
    enunciadoFacil: `Quieres 3 ${x.plural}. Tienda A: cada unidad cuesta ${dinero(pa * 100)}. Si te llevas 3, pagas 2. Tienda B: cada unidad cuesta ${dinero(pb * 100)}. No hay oferta. ¿Cuántas monedas ahorras en la tienda más barata?`,
    respuesta: numero(Math.abs(totalA - totalB)),
    pista: "Calcula lo que pagas por las 3 unidades en cada tienda y resta.",
    explicacion: `En la tienda A pagas 2 × ${pa} = ${totalA}. En la tienda B pagas 3 × ${pb} = ${totalB}. La diferencia es ${Math.abs(totalA - totalB)}.`,
  };
};

const tablaDeOfertas: Plantilla = (rng, d) => {
  const p = elegir(rng, PRODUCTOS);
  const kilos = trio(rng, rango(2, 8));
  const base = porNivel(d, entero(rng, 2, 5) * 100, entero(rng, 2, 5) * 100 + 50, entero(rng, 2, 5) * 100 + 25);
  const salto = porNivel(d, 100, 50, 25);
  const precios = trio(rng, [base, base + salto, base + 2 * salto]);
  const nombres = ["Puesto A", "Puesto B", "Puesto C"];
  const barato = Math.min(...precios);
  const correcta = nombres[precios.indexOf(barato)] ?? "";
  return {
    enunciado: `La tabla muestra lo que cuestan varios kilos de ${p} en tres puestos del mercado. ¿Qué puesto vende más barato cada kilo?`,
    enunciadoFacil: "Mira la tabla. ¿Dónde cuesta menos un kilo?",
    imagen: { tipo: "tabla", titulo: `Precios: ${p}`, cabeceras: ["Puesto", "Kilos", "Monedas"], filas: nombres.map((n, i) => [n, String(kilos[i] ?? 0), dosCifras((kilos[i] ?? 0) * (precios[i] ?? 0))]) },
    respuesta: opciones(correcta, nombres.filter((n) => n !== correcta)),
    pista: "Divide las monedas entre los kilos en cada fila.",
    explicacion: `Un kilo cuesta ${precios.map(conComa).join("; ")} monedas en los puestos A, B y C. El precio menor es ${conComa(barato)}.`,
  };
};

// ---------- NUM6-T2-a: calcular un porcentaje ----------
const con = (p: number, bases: readonly number[]): Dato[] => bases.map((b) => [p, b]);

function porcentajeYBase(rng: Rng, d: Dificultad): Dato {
  return elegir(rng, porNivel<readonly Dato[]>(d,
    [...con(20, rango(50, 300, 50)), ...con(30, rango(50, 300, 50)), ...con(40, rango(50, 300, 50)), ...con(60, rango(50, 300, 50)), ...con(80, rango(50, 300, 50))],
    [...con(5, rango(40, 400, 20)), ...con(15, rango(40, 400, 20)), ...con(75, rango(40, 400, 20))],
    [...con(12, rango(25, 400, 25)), ...con(35, rango(20, 400, 20)), ...con(45, rango(20, 400, 20)), ...con(8, rango(25, 400, 25))],
  ));
}

const calcularPorcentaje: Plantilla = (rng, d) => {
  const [p, base] = porcentajeYBase(rng, d);
  const r = (p * base) / 100;
  return {
    enunciado: `¿Cuánto es el ${p} % de ${base}?`,
    enunciadoFacil: `Calcula el ${p} % de ${base}.`,
    respuesta: numero(r),
    pista: "Multiplica por el porcentaje y divide entre 100. También puedes calcular primero el 1 % o el 10 %.",
    explicacion: `${base} × ${p} = ${base * p}, y ${base * p} ÷ 100 = ${r}.`,
  };
};

const SITUACIONES = [
  { todo: "alumnos en una escuela", dato: "va en bicicleta", pregunta: "¿Cuántos alumnos van en bicicleta?" },
  { todo: "árboles en un campo", dato: "da fruta", pregunta: "¿Cuántos árboles dan fruta?" },
  { todo: "personas en un mercado", dato: "compra verduras", pregunta: "¿Cuántas personas compran verduras?" },
  { todo: "litros de agua en un depósito", dato: "se usa para regar", pregunta: "¿Cuántos litros se usan para regar?" },
] as const;

const problemaDePorcentaje6: Plantilla = (rng, d) => {
  const s = elegir(rng, SITUACIONES);
  const [p, base] = porcentajeYBase(rng, d);
  const r = (p * base) / 100;
  return {
    enunciado: `Hay ${base} ${s.todo}. El ${p} % ${s.dato}. ${s.pregunta}`,
    enunciadoFacil: `Hay ${base} ${s.todo}. El ${p} % ${s.dato}. ${s.pregunta}`,
    respuesta: opcionesNumero(rng, r, [base - r, p, r * 10, base - p, r + p], String, 5),
    pista: "El porcentaje indica cuántos hay de cada 100.",
    explicacion: `El ${p} % de ${base} es ${base} × ${p} ÷ 100 = ${r}.`,
  };
};

const quePorcentajeEs: Plantilla = (rng, d) => {
  const [p, base] = elegir(rng, porNivel<readonly Dato[]>(d,
    [...con(50, rango(20, 100, 20)), ...con(25, rango(20, 100, 20)), ...con(10, rango(20, 100, 20))],
    [...con(20, rango(20, 200, 20)), ...con(40, rango(20, 200, 20)), ...con(75, rango(20, 200, 20))],
    [...con(15, rango(40, 200, 20)), ...con(35, rango(40, 200, 20)), ...con(60, rango(25, 200, 25)), ...con(5, rango(40, 200, 20))],
  ));
  const parte = (p * base) / 100;
  const n = nombre(rng);
  return {
    enunciado: `De ${base} preguntas, ${n} acierta ${parte}. ¿Qué porcentaje de las preguntas acierta?`,
    enunciadoFacil: `Hay ${base} preguntas. ${n} acierta ${parte}. ¿Qué porcentaje acierta?`,
    respuesta: opcionesNumero(rng, p, [parte, base - parte, 100 - p, p + 10, p + 5], (v) => `${v} %`, 5),
    pista: "Divide la parte entre el total y multiplica por 100.",
    explicacion: `${parte} de ${base} es lo mismo que ${p} de cada 100: el ${p} %.`,
  };
};

const porcentajeADecimal: Plantilla = (rng, d) => {
  const p = porNivel(d, entero(rng, 1, 9) * 10, elegir(rng, rango(11, 99).filter((v) => v % 10 !== 0)), entero(rng, 1, 9));
  const texto = conComa(p);
  if (d === 3 && rng() < 0.5) {
    return {
      enunciado: `El número ${conComa(p)} es igual a un porcentaje. ¿Cuál es?`,
      enunciadoFacil: `Mira el número ${conComa(p)}. ¿Qué porcentaje es?`,
      respuesta: opciones(`${p} %`, [`${p * 10} %`, `${p * 100} %`, `0,${p} %`]),
      pista: "Multiplica el número decimal por 100.",
      explicacion: `${conComa(p)} ${p === 1 ? "es 1 centésima" : `son ${p} centésimas`}, es decir, ${p} de cada 100: el ${p} %.`,
    };
  }
  return {
    enunciado: `¿Qué número decimal es igual al ${p} %?`,
    enunciadoFacil: `Escribe el ${p} % como número decimal.`,
    respuesta: numero(texto),
    pista: "Un porcentaje son centésimas: divide entre 100.",
    explicacion: `El ${p} % ${p === 1 ? "es 1 centésima" : `son ${p} centésimas`}: ${p} ÷ 100 = ${texto}.`,
  };
};

const porcentajeDeLaBarra: Plantilla = (rng, d) => {
  const partes = porNivel(d, 10, 5, 20);
  const coloreadas = entero(rng, 1, partes - 1);
  const p = (coloreadas * 100) / partes;
  const opcion = (v: number) => `${v} %`;
  return {
    enunciado: `La barra está dividida en ${partes} partes iguales. ¿Qué porcentaje está coloreado?`,
    enunciadoFacil: `La barra tiene ${partes} partes iguales. ¿Qué porcentaje tiene color?`,
    imagen: { tipo: "fraccion", forma: "barra", partes, coloreadas },
    respuesta: opcionesNumero(rng, p, [coloreadas, 100 - p, partes, p + 5, p + 10], opcion, 5),
    pista: `Piensa cuánto vale cada parte: 100 entre ${partes}.`,
    explicacion: `Cada parte vale 100 ÷ ${partes} = ${100 / partes} %, y ${coloreadas} × ${100 / partes} = ${p}.`,
  };
};

// ---------- NUM6-T2-b: descuentos y subidas ----------
function cambioDePrecio(rng: Rng, d: Dificultad): Dato {
  return elegir(rng, porNivel<readonly Dato[]>(d,
    [...con(10, rango(20, 200, 10)), ...con(20, rango(20, 200, 10)), ...con(50, rango(20, 200, 10))],
    [...con(5, rango(40, 300, 20)), ...con(15, rango(40, 300, 20)), ...con(30, rango(40, 300, 20))],
    [...con(12, rango(50, 400, 25)), ...con(35, rango(20, 300, 20)), ...con(5, rango(30, 90, 20))],
  ));
}

function nuevoPrecio(tipo: "baja" | "sube"): Plantilla {
  return (rng, d) => {
    const x = articuloCaro(rng);
    const [p, base] = cambioDePrecio(rng, d);
    const cambio = p * base; // en centésimas
    const final = tipo === "baja" ? base * 100 - cambio : base * 100 + cambio;
    const signo = tipo === "baja" ? "−" : "+";
    return {
      enunciado: `${mayus(x.un)} costaba ${dinero(base * 100)} y su precio ${tipo === "baja" ? "baja" : "sube"} un ${p} %. ¿Cuántas monedas cuesta ahora?`,
      enunciadoFacil: `${mayus(x.un)} costaba ${dinero(base * 100)}. El precio ${tipo === "baja" ? "baja" : "sube"} un ${p} %. ¿Cuántas monedas cuesta ahora?`,
      respuesta: numero(conComa(final)),
      pista: `Calcula el ${p} % del precio. Después ${tipo === "baja" ? "réstalo" : "súmalo"}.`,
      explicacion: `El ${p} % de ${base} es ${conComa(cambio)}, y ${base} ${signo} ${conComa(cambio)} = ${conComa(final)}.`,
    };
  };
}

const porcentajeDelCambio: Plantilla = (rng, d) => {
  const [p, base] = d === 3 ? elegir<Dato>(rng, [...con(12, rango(50, 400, 25)), ...con(35, rango(20, 300, 20))]) : cambioDePrecio(rng, d);
  const sube = rng() < 0.5;
  const cambio = (p * base) / 100;
  const x = articuloCaro(rng);
  const despues = sube ? base + cambio : base - cambio;
  return {
    enunciado: `${mayus(x.un)} costaba ${dinero(base * 100)} y ahora cuesta ${dinero(despues * 100)}. ¿Qué porcentaje ha ${sube ? "subido" : "bajado"} su precio?`,
    enunciadoFacil: `${mayus(x.un)} costaba ${dinero(base * 100)}. Ahora cuesta ${dinero(despues * 100)}. ¿Qué porcentaje ha ${sube ? "subido" : "bajado"}?`,
    respuesta: opcionesNumero(rng, p, [cambio, 100 - p, p + 5, p + 10], (v) => `${v} %`, 5),
    pista: "Calcula cuántas monedas ha cambiado. Compara esa cantidad con el precio de antes.",
    explicacion: `Ha cambiado ${cambio} monedas, y ${cambio} de ${base} es el ${p} %.`,
  };
};

const dosCambios: Plantilla = (rng, d) => {
  const x = articuloCaro(rng);
  if (d === 1) {
    const base = entero(rng, 4, 20) * 10;
    const fijo = entero(rng, 2, 9);
    const final = base / 2 + fijo;
    return {
      enunciado: `${mayus(x.un)} costaba ${dinero(base * 100)}. Su precio baja un 50 % y después sube ${dinero(fijo * 100)}. ¿Cuántas monedas cuesta ahora?`,
      enunciadoFacil: `${mayus(x.un)} costaba ${dinero(base * 100)}. Primero baja un 50 %. Después sube ${dinero(fijo * 100)}. ¿Cuántas monedas cuesta ahora?`,
      respuesta: numero(final),
      pista: "Haz los cambios en orden: primero la bajada.",
      explicacion: `El 50 % de ${base} es ${base / 2}. Queda ${base / 2}, y ${base / 2} + ${fijo} = ${final}.`,
    };
  }
  if (d === 2) {
    const base = entero(rng, 3, 20) * 20;
    const p = elegir(rng, [10, 20, 25]);
    const fijo = entero(rng, 2, 9);
    const intermedio = (base * (100 - p)) / 100;
    return {
      enunciado: `${mayus(x.un)} costaba ${dinero(base * 100)}. Su precio baja un ${p} % y después baja ${dinero(fijo * 100)} más. ¿Cuántas monedas cuesta ahora?`,
      enunciadoFacil: `${mayus(x.un)} costaba ${dinero(base * 100)}. Primero baja un ${p} %. Después baja ${dinero(fijo * 100)} más. ¿Cuántas monedas cuesta ahora?`,
      respuesta: numero(intermedio - fijo),
      pista: "Haz los cambios en orden: primero el porcentaje.",
      explicacion: `Tras bajar un ${p} % cuesta ${intermedio}, y ${intermedio} − ${fijo} = ${intermedio - fijo}.`,
    };
  }
  const base = entero(rng, 1, 9) * 100;
  const p = elegir(rng, [10, 20]);
  const subido = (base * (100 + p)) / 100;
  const final = (subido * (100 - p)) / 100;
  return {
    enunciado: `${mayus(x.un)} costaba ${dinero(base * 100)}. Su precio sube un ${p} % y después, sobre ese nuevo precio, baja un ${p} %. ¿Cuántas monedas cuesta ahora?`,
    enunciadoFacil: `${mayus(x.un)} costaba ${dinero(base * 100)}. Primero sube un ${p} %. Después baja un ${p} % del nuevo precio. ¿Cuántas monedas cuesta ahora?`,
    respuesta: opcionesNumero(rng, final, [base, subido, base + p, base - p], String, 2),
    pista: "El segundo porcentaje se calcula sobre el precio nuevo, no sobre el de antes.",
    explicacion: `Primero sube a ${subido}. El ${p} % de ${subido} es ${subido - final}, y ${subido} − ${subido - final} = ${final}.`,
  };
};

const avisoDeSubida: Plantilla = (rng, d) => {
  const [x, y] = par(rng, BARATOS);
  const [p, b1] = cambioDePrecio(rng, d);
  const b2 = b1 + (d === 1 ? 10 : 20);
  const verbo = elegir(rng, ["suben", "bajan"]);
  const objetivo = rng() < 0.5;
  const [art, base] = objetivo ? [x, b1] : [y, b2];
  const final = verbo === "suben" ? base * 100 + base * p : base * 100 - base * p;
  return {
    enunciado: `Mira el aviso de la tienda. ¿Cuántas monedas costará ${art.el} con el nuevo precio?`,
    enunciadoFacil: `Mira el aviso. ¿Cuántas monedas costará ${art.el}?`,
    imagen: { tipo: "cartel", estilo: "aviso", titulo: `Desde el lunes, los precios ${verbo} un ${p} %`, lineas: [`${mayus(x.nombre)}: ${dinero(b1 * 100)}`, `${mayus(y.nombre)}: ${dinero(b2 * 100)}`] },
    respuesta: numero(conComa(final)),
    pista: "Busca el precio de hoy y calcula el porcentaje que dice el aviso.",
    explicacion: `El ${p} % de ${base} es ${conComa(base * p)}. El nuevo precio es ${conComa(final)}.`,
  };
};

// ---------- NUM6-T2-c: comparar precios finales ----------
const TIENDAS = ["En la tienda A", "En la tienda B", "Cuesta lo mismo en las dos"] as const;

// Dos precios con descuento cuyo resultado final está a `dif` monedas.
function dosDescuentos(rng: Rng, d: Dificultad, sinEmpate = false): { pa: number; ba: number; fa: number; pb: number; bb: number; fb: number } {
  const [pa, pb] = par(rng, porNivel(d, [10, 50], [10, 20, 25, 50], [5, 15, 25, 40]));
  const candidatos: { ba: number; bb: number }[] = [];
  const limite = porNivel(d, 12, 4, 1);
  for (const ba of rango(20, 200, 20)) {
    for (const bb of rango(20, 200, 20)) {
      const fa = (ba * (100 - pa)) / 100;
      const fb = (bb * (100 - pb)) / 100;
      const dif = Math.abs(fa - fb);
      if (Number.isInteger(fa) && Number.isInteger(fb) && ba !== bb && (d === 3 ? dif <= 4 : dif >= limite && dif <= 30) && !(sinEmpate && dif === 0)) candidatos.push({ ba, bb });
    }
  }
  const { ba, bb } = elegir(rng, candidatos);
  return { pa, ba, fa: (ba * (100 - pa)) / 100, pb, bb, fb: (bb * (100 - pb)) / 100 };
}

const dondeCuestaMenos: Plantilla = (rng, d) => {
  const { pa, ba, fa, pb, bb, fb } = dosDescuentos(rng, d);
  const x = articuloCaro(rng);
  const correcta = fa < fb ? TIENDAS[0] : fa > fb ? TIENDAS[1] : TIENDAS[2];
  return {
    enunciado: `En la tienda A, ${x.un} cuesta ${dinero(ba * 100)} y tiene un descuento del ${pa} %. En la tienda B, cuesta ${dinero(bb * 100)} y tiene un descuento del ${pb} %. ¿Dónde es menor el precio final?`,
    enunciadoFacil: `Tienda A: ${x.un} cuesta ${dinero(ba * 100)}. Descuento del ${pa} %. Tienda B: cuesta ${dinero(bb * 100)}. Descuento del ${pb} %. ¿Dónde pagas menos?`,
    respuesta: opciones(correcta, TIENDAS.filter((t) => t !== correcta)),
    pista: "No mires solo el descuento. Calcula el precio final en cada tienda.",
    explicacion: `En la tienda A pagas ${dinero(fa * 100)} y en la tienda B pagas ${dinero(fb * 100)}.`,
  };
};

const cuantoSeAhorra: Plantilla = (rng, d) => {
  const { pa, ba, fa, pb, bb, fb } = dosDescuentos(rng, d, true);
  const x = articuloCaro(rng);
  const ahorro = Math.abs(fa - fb);
  return {
    enunciado: `En la tienda A, ${x.un} cuesta ${dinero(ba * 100)} y tiene un descuento del ${pa} %. En la tienda B, cuesta ${dinero(bb * 100)} y tiene un descuento del ${pb} %. ¿Cuántas monedas ahorras si compras en la tienda con el precio final más bajo?`,
    enunciadoFacil: `Tienda A: ${x.un} cuesta ${dinero(ba * 100)}. Descuento del ${pa} %. Tienda B: cuesta ${dinero(bb * 100)}. Descuento del ${pb} %. ¿Cuántas monedas de diferencia hay entre los dos precios finales?`,
    respuesta: numero(conComa(Math.round(ahorro * 100))),
    pista: "Calcula los dos precios finales y resta.",
    explicacion: `En la tienda A pagas ${conComa(Math.round(fa * 100))} y en la tienda B, ${conComa(Math.round(fb * 100))}. La diferencia es ${conComa(Math.round(ahorro * 100))}.`,
  };
};

const porcentajeOCantidad: Plantilla = (rng, d) => {
  const x = articuloCaro(rng);
  const p = porNivel(d, 50, elegir(rng, [10, 20, 25]), elegir(rng, [15, 30, 35]));
  const base = entero(rng, 3, 15) * 20;
  const rebaja = (base * p) / 100;
  const fijo = rebaja + porNivel(d, elegir(rng, [-5, 5]), elegir(rng, [-2, 2]), elegir(rng, [-1, 0, 1]));
  const a = `El descuento del ${p} %`;
  const b = `El descuento de ${dinero(fijo * 100)}`;
  const igual = "Los dos descuentos ahorran lo mismo";
  const correcta = rebaja > fijo ? a : fijo > rebaja ? b : igual;
  return {
    enunciado: `${mayus(x.un)} cuesta ${dinero(base * 100)}. Puedes elegir un descuento del ${p} % o un descuento de ${dinero(fijo * 100)}. ¿Con cuál pagas menos?`,
    enunciadoFacil: `${mayus(x.un)} cuesta ${dinero(base * 100)}. Hay dos descuentos: el ${p} % o ${dinero(fijo * 100)}. ¿Con cuál pagas menos?`,
    respuesta: opciones(correcta, [a, b, igual].filter((o) => o !== correcta)),
    pista: "Calcula cuántas monedas son ese porcentaje y compara.",
    explicacion: `El ${p} % de ${base} son ${rebaja} monedas, y el otro descuento son ${fijo}.`,
  };
};

const subidaYDescuento: Plantilla = (rng, d) => {
  const x = articuloCaro(rng);
  const ba = entero(rng, 2, 10) * 20;
  const pa = porNivel(d, 10, elegir(rng, [10, 20]), elegir(rng, [5, 15, 25]));
  const pb = porNivel(d, 50, elegir(rng, [10, 25]), elegir(rng, [5, 15, 25]));
  const fa = (ba * (100 + pa)) / 100;
  const bb = porNivel(d, ba + 40, ba + 20, ba + 20);
  const fb = (bb * (100 - pb)) / 100;
  const correcta = fa < fb ? TIENDAS[0] : fa > fb ? TIENDAS[1] : TIENDAS[2];
  return {
    enunciado: `En la tienda A, ${x.un} cuesta ${dinero(ba * 100)} y hay que sumar un ${pa} % de transporte. En la tienda B cuesta ${dinero(bb * 100)}, te descuentan un ${pb} % y no se paga transporte. ¿Dónde es menor el precio final?`,
    enunciadoFacil: `Tienda A: cuesta ${dinero(ba * 100)}. Hay que sumar un ${pa} % de transporte. Tienda B: cuesta ${dinero(bb * 100)}. Hay que restar un ${pb} %. ¿Dónde pagas menos?`,
    respuesta: opciones(correcta, TIENDAS.filter((t) => t !== correcta)),
    pista: "En una tienda el porcentaje se suma y en la otra se resta.",
    explicacion: `En la tienda A pagas ${conComa(Math.round(fa * 100))} y en la tienda B pagas ${conComa(Math.round(fb * 100))}.`,
  };
};

const tablaDeDescuentos: Plantilla = (rng, d) => {
  const x = articuloCaro(rng);
  const pcts = trio(rng, porNivel(d, [10, 20, 50], [10, 20, 25, 50], [5, 10, 15, 20, 25, 30]));
  let bases = pcts.map(() => entero(rng, 2, 10) * 20);
  const finales = (lista: readonly number[]) => lista.map((b, i) => (b * (100 - (pcts[i] ?? 0))) / 100);
  for (let i = 0; i < 40 && new Set(finales(bases)).size < 3; i += 1) bases = pcts.map(() => entero(rng, 2, 10) * 20);
  if (new Set(finales(bases)).size < 3) bases = [40, 100, 200];
  const nombres = ["Tienda A", "Tienda B", "Tienda C"];
  const f = finales(bases);
  const barato = Math.min(...f);
  const correcta = nombres[f.indexOf(barato)] ?? "";
  return {
    enunciado: `La tabla muestra el precio y el descuento ${x.genero === "f" ? "de una" : "de un"} ${x.nombre} en tres tiendas. ¿En qué tienda es menor el precio final?`,
    enunciadoFacil: "Mira la tabla. Calcula los precios finales. ¿En qué tienda pagas menos?",
    imagen: { tipo: "tabla", titulo: mayus(x.nombre), cabeceras: ["Tienda", "Precio (monedas)", "Descuento"], filas: nombres.map((n, i) => [n, String(bases[i] ?? 0), `${pcts[i] ?? 0} %`]) },
    respuesta: opciones(correcta, nombres.filter((n) => n !== correcta)),
    pista: "Calcula el precio final de cada fila antes de decidir.",
    explicacion: `Los precios finales son ${f.map((v) => conComa(Math.round(v * 100))).join("; ")} en las tiendas A, B y C. El menor es ${conComa(Math.round(barato * 100))}.`,
  };
};

// ---------- NUM6-T3-a: ingresos y gastos ----------
const INGRESOS = ["Venta de huevos", "Venta de verduras", "Trabajo en el taller", "Venta de pan"] as const;
const GASTOS = ["Comida", "Transporte", "Agua y luz", "Material"] as const;

function importes(rng: Rng, d: Dificultad, n: number, min: number, max: number): number[] {
  return Array.from({ length: n }, () => entero(rng, min, max) * 100 + (d === 3 ? elegir(rng, [25, 50, 75]) : 0));
}

const tablaDeCuentas: Plantilla = (rng, d) => {
  const n = porNivel(d, 1, 2, 3);
  const ing = importes(rng, d, n, 40, 90);
  const gas = importes(rng, d, n, 8, 30);
  const totalI = ing.reduce((s, v) => s + v, 0);
  const totalG = gas.reduce((s, v) => s + v, 0);
  const nombresI = trio(rng, INGRESOS);
  const nombresG = trio(rng, GASTOS);
  const filas = [...ing.map((v, i) => [nombresI[i] ?? "", "Ingreso", dosCifras(v)]), ...gas.map((v, i) => [nombresG[i] ?? "", "Gasto", dosCifras(v)])];
  return {
    enunciado: "La tabla muestra las cuentas de una familia en una semana. ¿Cuántas monedas quedan al restar los gastos a los ingresos?",
    enunciadoFacil: "Mira la tabla. Suma los ingresos. Suma los gastos. Resta. ¿Cuántas monedas quedan?",
    imagen: { tipo: "tabla", titulo: "Cuentas de la semana", cabeceras: ["Concepto", "Tipo", "Monedas"], filas },
    respuesta: numero(conComa(totalI - totalG)),
    pista: "Suma por separado lo que entra y lo que sale. Después resta.",
    explicacion: `Entran ${conComa(totalI)} y salen ${conComa(totalG)}. Quedan ${conComa(totalI)} − ${conComa(totalG)} = ${conComa(totalI - totalG)}.`,
  };
};

const gananciaDelPuesto: Plantilla = (rng, d) => {
  const x = articuloBarato(rng);
  const q = porNivel(d, entero(rng, 10, 20), entero(rng, 15, 40), entero(rng, 12, 40));
  const precio = porNivel(d, entero(rng, 2, 5) * 100, entero(rng, 3, 9) * 100, entero(rng, 1, 4) * 100 + 50);
  const material = porNivel(d, entero(rng, 5, 15), entero(rng, 15, 40), entero(rng, 8, 16)) * 100;
  const ingreso = q * precio;
  return {
    enunciado: `Un puesto vende ${q} ${x.plural} a ${dinero(precio)} cada unidad y gasta ${dinero(material)} en comprar la mercancía. ¿Cuántas monedas gana?`,
    enunciadoFacil: `Un puesto vende ${q} ${x.plural}. Cada unidad cuesta ${dinero(precio)}. Gasta ${dinero(material)} en la mercancía. ¿Cuántas monedas gana?`,
    respuesta: numero(conComa(ingreso - material)),
    pista: "Calcula lo que entra por las ventas. Después resta lo que ha gastado.",
    explicacion: `Entran ${q} × ${conComa(precio)} = ${conComa(ingreso)}. Ganancia: ${conComa(ingreso)} − ${conComa(material)} = ${conComa(ingreso - material)}.`,
  };
};

const sobraOFalta: Plantilla = (rng, d) => {
  const [g1, g2, g3] = [entero(rng, 20, 60), entero(rng, 10, 40), entero(rng, 5, 30)];
  const gastos = d === 1 ? g1 + g2 : g1 + g2 + g3;
  const dif = porNivel(d, entero(rng, 5, 30), elegir(rng, [-1, 1]) * entero(rng, 3, 20), elegir(rng, [-1, 0, 1]) * entero(rng, 2, 12));
  const ingresos = gastos + dif;
  const lista = d === 1 ? `${g1} monedas en comida y ${g2} monedas en transporte` : `${g1} monedas en comida, ${g2} monedas en transporte y ${g3} monedas en agua y luz`;
  const facil = d === 1 ? `Comida: ${g1} monedas. Transporte: ${g2} monedas.` : `Comida: ${g1} monedas. Transporte: ${g2} monedas. Agua y luz: ${g3} monedas.`;
  const nada = "No sobra ni falta nada";
  const m = Math.abs(dif);
  const otro = entero(rng, 3, 9);
  const correcta = dif > 0 ? `Sobran ${m} monedas` : dif < 0 ? `Faltan ${m} monedas` : nada;
  const distractores = dif === 0 ? [`Sobran ${otro} monedas`, `Faltan ${otro} monedas`] : [dif > 0 ? `Faltan ${m} monedas` : `Sobran ${m} monedas`, nada];
  return {
    enunciado: `Una familia ingresa ${ingresos} monedas este mes y gasta ${lista}. ¿Qué pasa con su dinero?`,
    enunciadoFacil: `Una familia ingresa ${ingresos} monedas. Sus gastos son: ${facil} ¿Qué pasa con su dinero?`,
    respuesta: opciones(correcta, distractores),
    pista: "Suma todos los gastos y compáralos con lo que entra.",
    explicacion: `Los gastos suman ${gastos} monedas y los ingresos son ${ingresos}.`,
  };
};

const cajaDelDia: Plantilla = (rng, d) => {
  const inicio = entero(rng, 20, 80) * 100;
  const entradas = importes(rng, d, d === 1 ? 1 : 2, 15, 50);
  const salidas = importes(rng, d, d === 1 ? 1 : 2, 5, 15);
  const final = inicio + entradas.reduce((s, v) => s + v, 0) - salidas.reduce((s, v) => s + v, 0);
  return {
    enunciado: "Mira las cuentas de la caja de la tienda. ¿Cuántas monedas hay en la caja al final del día?",
    enunciadoFacil: "Mira las cuentas de la caja. ¿Cuántas monedas hay al final?",
    imagen: { tipo: "cartel", estilo: "recibo", titulo: "Caja de la tienda", lineas: [`Al empezar: ${dinero(inicio)}`, ...entradas.map((v) => `Entra: ${dinero(v)}`), ...salidas.map((v) => `Sale: ${dinero(v)}`)] },
    respuesta: numero(conComa(final)),
    pista: "A lo que había al empezar, súmale lo que entra y réstale lo que sale.",
    explicacion: `Había ${conComa(inicio)}, entraron ${entradas.map(conComa).join(" y ")} y salieron ${salidas.map(conComa).join(" y ")}: quedan ${conComa(final)}.`,
  };
};

// ---------- NUM6-T3-b: ahorro ----------
const ahorroAcumulado: Plantilla = (rng, d) => {
  const n = nombre(rng);
  const s = porNivel(d, entero(rng, 3, 15) * 100, entero(rng, 3, 15) * 100 + 50, entero(rng, 2, 9) * 100 + 25);
  const k = porNivel(d, entero(rng, 3, 9), entero(rng, 4, 12), entero(rng, 8, 20));
  const inicio = d === 3 ? entero(rng, 5, 30) * 100 : 0;
  const total = inicio + s * k;
  return {
    enunciado: d === 3 ? `${n} tiene ${dinero(inicio)} y ahorra ${dinero(s)} cada semana. ¿Cuántas monedas tendrá dentro de ${k} semanas?` : `${n} ahorra ${dinero(s)} cada semana. ¿Cuántas monedas ahorra en ${k} semanas?`,
    enunciadoFacil: d === 3 ? `${n} tiene ${dinero(inicio)}. Ahorra ${dinero(s)} cada semana. ¿Cuántas monedas tendrá en ${k} semanas?` : `${n} ahorra ${dinero(s)} cada semana. Pasan ${k} semanas. ¿Cuántas monedas ahorra?`,
    respuesta: numero(conComa(total)),
    pista: d === 3 ? "Multiplica lo que ahorra cada semana por las semanas. Después súmalo a lo que ya tiene." : "Multiplica lo que ahorra cada semana por las semanas.",
    explicacion: d === 3 ? `${k} × ${conComa(s)} = ${conComa(s * k)}, y ${conComa(s * k)} + ${conComa(inicio)} = ${conComa(total)}.` : `${k} × ${conComa(s)} = ${conComa(total)}.`,
  };
};

const semanasParaLaMeta: Plantilla = (rng, d) => {
  const n = nombre(rng);
  const x = articuloCaro(rng);
  const s = entero(rng, 3, 15);
  const k = entero(rng, 4, 15);
  if (d === 1) {
    return {
      enunciado: `${mayus(x.un)} cuesta ${dinero(s * k * 100)} y ${n} ahorra ${dinero(s * 100)} cada semana. ¿Cuántas semanas tarda en reunir ese dinero?`,
      enunciadoFacil: `${mayus(x.un)} cuesta ${dinero(s * k * 100)}. ${n} ahorra ${dinero(s * 100)} cada semana. ¿Cuántas semanas tarda?`,
      respuesta: numero(k),
      pista: "Piensa cuántas veces cabe lo que ahorra cada semana en el precio.",
      explicacion: `${s * k} ÷ ${s} = ${k}.`,
    };
  }
  const tiene = entero(rng, 5, 30);
  if (d === 2) {
    const precio = s * k + tiene;
    return {
      enunciado: `${mayus(x.un)} cuesta ${dinero(precio * 100)}. ${n} ya tiene ${dinero(tiene * 100)} y ahorra ${dinero(s * 100)} cada semana. ¿Cuántas semanas tarda en reunir lo que falta?`,
      enunciadoFacil: `${mayus(x.un)} cuesta ${dinero(precio * 100)}. ${n} ya tiene ${dinero(tiene * 100)}. Ahorra ${dinero(s * 100)} cada semana. ¿Cuántas semanas tarda?`,
      respuesta: numero(k),
      pista: "Calcula primero lo que falta.",
      explicacion: `Faltan ${precio} − ${tiene} = ${precio - tiene}, y ${precio - tiene} ÷ ${s} = ${k}.`,
    };
  }
  const precio = s * k + tiene + entero(rng, 1, s - 1);
  const falta = precio - tiene;
  const semanas = Math.ceil(falta / s);
  return {
    enunciado: `${mayus(x.un)} cuesta ${dinero(precio * 100)}. ${n} ya tiene ${dinero(tiene * 100)} y ahorra ${dinero(s * 100)} cada semana. ¿Cuántas semanas necesita, como mínimo, para poder comprar${x.genero === "f" ? "la" : "lo"}?`,
    enunciadoFacil: `${mayus(x.un)} cuesta ${dinero(precio * 100)}. ${n} ya tiene ${dinero(tiene * 100)}. Ahorra ${dinero(s * 100)} cada semana. ¿Cuántas semanas necesita como mínimo?`,
    respuesta: opcionesNumero(rng, semanas, [semanas - 1, semanas + 1, Math.ceil(precio / s), semanas + 2]),
    pista: "Si la división no es exacta, hace falta una semana más para llegar.",
    explicacion: `Faltan ${falta}. En ${semanas - 1} semanas reúne ${(semanas - 1) * s}, que no basta, y en ${semanas} semanas reúne ${semanas * s}, que sí.`,
  };
};

const ahorroMensual: Plantilla = (rng, d) => {
  const n = nombre(rng);
  const gana = entero(rng, 8, 20) * 10;
  const gasta = gana - entero(rng, 2, 7) * 10 - (d === 1 ? 0 : 5);
  const meses = porNivel(d, entero(rng, 2, 4), entero(rng, 3, 6), entero(rng, 6, 12));
  const ahorro = gana - gasta;
  return {
    enunciado: `${n} recibe ${gana} monedas al mes y gasta ${gasta} monedas al mes. Lo demás lo ahorra. ¿Cuántas monedas ahorra en ${meses} meses?`,
    enunciadoFacil: `${n} recibe ${gana} monedas al mes. Gasta ${gasta} monedas al mes. Ahorra lo demás. ¿Cuántas monedas ahorra en ${meses} meses?`,
    respuesta: opcionesNumero(rng, ahorro * meses, [gana * meses, gasta * meses, ahorro, ahorro + meses], String, 10),
    pista: "Calcula primero lo que ahorra en un mes.",
    explicacion: `Cada mes ahorra ${gana} − ${gasta} = ${ahorro}, y ${ahorro} × ${meses} = ${ahorro * meses}.`,
  };
};

const ahorrarUnPorcentaje: Plantilla = (rng, d) => {
  const n = nombre(rng);
  const p = porNivel(d, 10, elegir(rng, [20, 25]), elegir(rng, [15, 30, 35]));
  const recibe = entero(rng, 3, 15) * 20;
  const meses = entero(rng, 2, 6);
  const mes = (recibe * p) / 100;
  return {
    enunciado: `${n} recibe ${recibe} monedas al mes y ahorra el ${p} %. ¿Cuántas monedas ahorra en ${meses} meses?`,
    enunciadoFacil: `${n} recibe ${recibe} monedas al mes. Ahorra el ${p} %. ¿Cuántas monedas ahorra en ${meses} meses?`,
    respuesta: numero(mes * meses),
    pista: "Calcula el porcentaje de un mes. Después multiplica por los meses.",
    explicacion: `El ${p} % de ${recibe} es ${mes}, y ${mes} × ${meses} = ${mes * meses}.`,
  };
};

const graficoDeAhorro: Plantilla = (rng, d) => {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo"].slice(0, porNivel(d, 3, 4, 5));
  const valores = meses.map(() => entero(rng, 2, 9) * 5);
  const total = valores.reduce((s, v) => s + v, 0);
  const meta = (Math.floor(total / 10) + entero(rng, 1, 5)) * 10;
  return {
    enunciado: `El gráfico muestra lo que ahorró un grupo de amigos cada mes. Quieren reunir ${meta} monedas. ¿Cuántas monedas les faltan?`,
    enunciadoFacil: `Mira el gráfico. Quieren reunir ${meta} monedas. ¿Cuántas monedas les faltan?`,
    imagen: { tipo: "barras", titulo: "Monedas ahorradas", etiquetas: meses, valores },
    respuesta: numero(meta - total),
    pista: "Suma lo que indica cada barra. Después resta.",
    explicacion: `Han ahorrado ${valores.join(" + ")} = ${total}, y ${meta} − ${total} = ${meta - total}.`,
  };
};

// ---------- NUM6-T3-c: decidir una compra ----------
const parejaQueAlcanza: Plantilla = (rng, d) => {
  const n = nombre(rng);
  const [x, y, z] = trio(rng, CAROS);
  // Precios a < b < c: solo la pareja de los dos más baratos cabe en el presupuesto.
  const a = entero(rng, 8, 20);
  const b = a + porNivel(d, entero(rng, 5, 9), entero(rng, 3, 5), entero(rng, 2, 3));
  const c = b + porNivel(d, entero(rng, 5, 9), entero(rng, 3, 5), entero(rng, 1, 2));
  const limite = a + b + porNivel(d, entero(rng, 0, 3), entero(rng, 0, 1), 0);
  const ok = limite < a + c;
  const [pa, pb, pc] = ok ? [a, b, c] : [a, b, c + 5];
  return {
    enunciado: `${n} tiene ${limite} monedas. ${mayus(x.un)} cuesta ${pa} monedas, ${y.un} cuesta ${pb} monedas y ${z.un} cuesta ${pc} monedas. ¿Qué dos cosas puede comprar sin pasarse?`,
    enunciadoFacil: `${n} tiene ${limite} monedas. Precios: ${x.nombre}, ${pa} monedas; ${y.nombre}, ${pb} monedas; ${z.nombre}, ${pc} monedas. ¿Qué dos cosas puede comprar?`,
    respuesta: opciones(`${mayus(x.nombre)} y ${y.nombre}`, [`${mayus(x.nombre)} y ${z.nombre}`, `${mayus(y.nombre)} y ${z.nombre}`]),
    pista: "Suma los precios de cada pareja y compara con lo que tiene.",
    explicacion: `Solo una pareja no se pasa: ${pa} + ${pb} = ${pa + pb}, que no supera ${limite}.`,
  };
};

const pagarAPlazos: Plantilla = (rng, d) => {
  const x = articuloCaro(rng);
  const plazos = porNivel(d, entero(rng, 2, 4), entero(rng, 3, 6), entero(rng, 6, 12));
  const cuota = porNivel(d, entero(rng, 10, 30), entero(rng, 15, 40), entero(rng, 8, 25) );
  const recargo = entero(rng, 2, 6) + (d === 1 ? 0 : 5);
  const contado = plazos * cuota - recargo;
  return {
    enunciado: `${mayus(x.un)} cuesta ${contado} monedas si se paga de una vez. También se puede pagar en ${plazos} pagos de ${cuota} monedas. ¿Cuántas monedas más se paga con los ${plazos} pagos?`,
    enunciadoFacil: `Pago de una vez: ${contado} monedas. Otra forma: ${plazos} pagos de ${cuota} monedas. ¿Cuántas monedas más cuesta con los pagos?`,
    respuesta: numero(recargo),
    pista: "Calcula cuánto se paga en total con los pagos y compara.",
    explicacion: `${plazos} × ${cuota} = ${plazos * cuota}, y ${plazos * cuota} − ${contado} = ${recargo}.`,
  };
};

const alquilarOComprar: Plantilla = (rng, d) => {
  const objeto = elegir(rng, ["una bicicleta", "una carretilla", "una escalera"]);
  const dia = porNivel(d, entero(rng, 2, 5), entero(rng, 3, 8), entero(rng, 4, 9));
  const dias = porNivel(d, entero(rng, 5, 10), entero(rng, 10, 20), entero(rng, 15, 30));
  const compra = dia * dias;
  return {
    enunciado: `Alquilar ${objeto} cuesta ${dia} monedas al día y comprarla cuesta ${compra} monedas. ¿Con cuántos días de alquiler se paga lo mismo que al comprarla?`,
    enunciadoFacil: `Alquilar ${objeto} cuesta ${dia} monedas al día. Comprarla cuesta ${compra} monedas. ¿Cuántos días de alquiler cuestan lo mismo?`,
    respuesta: numero(dias),
    pista: "Piensa cuántas veces cabe el precio de un día en el precio de compra.",
    explicacion: `${compra} ÷ ${dia} = ${dias}.`,
  };
};

const SALE_A = "Los zapatos A";
const SALE_B = "Los zapatos B";
const SALE_IGUAL = "Los dos cuestan lo mismo al mes";

const cuestaPorMes: Plantilla = (rng, d) => {
  const [m1, m2] = par(rng, [3, 4, 5, 6, 8, 10, 12]);
  const u1 = entero(rng, 3, 9);
  const u2 = u1 + porNivel(d, elegir(rng, [-2, 2, 3]), elegir(rng, [-1, 1]), elegir(rng, [-1, 0, 1]));
  const correcta = u1 < u2 ? SALE_A : u1 > u2 ? SALE_B : SALE_IGUAL;
  return {
    enunciado: `Los zapatos A cuestan ${m1 * u1} monedas y duran ${m1} meses. Los zapatos B cuestan ${m2 * u2} monedas y duran ${m2} meses. ¿Cuáles salen más baratos por cada mes de uso?`,
    enunciadoFacil: `Zapatos A: ${m1 * u1} monedas. Duran ${m1} meses. Zapatos B: ${m2 * u2} monedas. Duran ${m2} meses. ¿Cuáles cuestan menos cada mes?`,
    respuesta: opciones(correcta, [SALE_A, SALE_B, SALE_IGUAL].filter((o) => o !== correcta)),
    pista: "Divide el precio entre los meses que duran.",
    explicacion: `Los zapatos A cuestan ${u1} monedas al mes y los zapatos B, ${u2}.`,
  };
};

const llegaAlPrecio: Plantilla = (rng, d) => {
  const n = nombre(rng);
  const x = articuloCaro(rng);
  const tiene = entero(rng, 10, 40);
  const s = entero(rng, 4, 12);
  const k = porNivel(d, entero(rng, 2, 3), entero(rng, 3, 5), entero(rng, 5, 8));
  const reunido = tiene + s * k;
  const dif = elegir(rng, [-1, 1]) * entero(rng, 2, 9);
  const precio = reunido + dif;
  const m = Math.abs(dif);
  const correcta = dif < 0 ? `Sí, y le sobran ${m} monedas` : `No, le faltan ${m} monedas`;
  const distractores = dif < 0 ? [`No, le faltan ${m} monedas`, `Sí, y no le sobra nada`] : [`Sí, y le sobran ${m} monedas`, `Sí, y no le sobra nada`];
  return {
    enunciado: `${n} tiene ${tiene} monedas y ahorra ${s} monedas cada semana. ${mayus(x.un)} cuesta ${precio} monedas. ¿Podrá comprar${x.genero === "f" ? "la" : "lo"} dentro de ${k} semanas?`,
    enunciadoFacil: `${n} tiene ${tiene} monedas. Ahorra ${s} monedas cada semana. ${mayus(x.un)} cuesta ${precio} monedas. Pasan ${k} semanas. ¿Puede comprar${x.genero === "f" ? "la" : "lo"}?`,
    respuesta: opciones(correcta, distractores),
    pista: "Calcula cuánto tendrá después de esas semanas y compara con el precio.",
    explicacion: `Tendrá ${tiene} + ${k} × ${s} = ${reunido}, y el precio es ${precio}.`,
  };
};

export const SEXTO_A: MapaGeneradores = {
  "NUM6-T1-a": generadores("NUM6-T1-a", [precioDeUno, precioDeOtraCantidad, cuantoPuedoComprar, tablaDePrecios]),
  "NUM6-T1-b": generadores("NUM6-T1-b", [escalarReceta, notaDeReceta, litrosParaTodos, paraCuantasPersonas, mezclarPintura]),
  "NUM6-T1-c": generadores("NUM6-T1-c", [compararDosOfertas, litroMasBarato, tresPorDos, tablaDeOfertas]),
  "NUM6-T2-a": generadores("NUM6-T2-a", [calcularPorcentaje, problemaDePorcentaje6, quePorcentajeEs, porcentajeADecimal, porcentajeDeLaBarra]),
  "NUM6-T2-b": generadores("NUM6-T2-b", [nuevoPrecio("baja"), nuevoPrecio("sube"), porcentajeDelCambio, dosCambios, avisoDeSubida]),
  "NUM6-T2-c": generadores("NUM6-T2-c", [dondeCuestaMenos, cuantoSeAhorra, porcentajeOCantidad, subidaYDescuento, tablaDeDescuentos]),
  "NUM6-T3-a": generadores("NUM6-T3-a", [tablaDeCuentas, gananciaDelPuesto, sobraOFalta, cajaDelDia]),
  "NUM6-T3-b": generadores("NUM6-T3-b", [ahorroAcumulado, semanasParaLaMeta, ahorroMensual, ahorrarUnPorcentaje, graficoDeAhorro]),
  "NUM6-T3-c": generadores("NUM6-T3-c", [parejaQueAlcanza, pagarAPlazos, alquilarOComprar, cuestaPorMes, llegaAlPrecio]),
};

