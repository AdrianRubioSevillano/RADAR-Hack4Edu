// PEN4-T3 · Decidir con datos. Las tablas se generan y la elección se comprueba en código.
import type { Rng } from "../../../core/rng.ts";
import { barajar, elegir, entero, muestra, nombre } from "../../ayuda.ts";
import type { Dificultad, Generador, Imagen } from "../../tipos.ts";
import { buscar, en, generadorDePlantillas, mayus, type Contenido, type Plantilla } from "./comun.ts";

interface Columna {
  readonly cabecera: string;
  readonly frase: string; // "precio", "número de bolsillos"
  readonly articulo: "el" | "la";
  readonly valores: readonly number[];
  readonly mejorAlto?: true; // en esta columna, más es mejor (bolsillos, páginas, horas de luz)
}

interface Dominio {
  readonly clave: string;
  readonly cosa: string; // "mochila"
  readonly unaCosa: string; // "una mochila"
  readonly titulo: string;
  readonly nombres: readonly string[];
  readonly columnas: readonly [Columna, Columna, Columna];
}

function rango(desde: number, hasta: number, paso: number): number[] {
  const salida: number[] = [];
  for (let v = desde; v <= hasta; v += paso) salida.push(v);
  return salida;
}

const PRECIO: Columna = { cabecera: "Precio (monedas)", frase: "precio", articulo: "el", valores: rango(10, 60, 5) };

const DOMINIOS: readonly Dominio[] = [
  {
    clave: "mochilas", cosa: "mochila", unaCosa: "una mochila", titulo: "Mochilas de la tienda", nombres: ["Mochila roja", "Mochila azul", "Mochila verde", "Mochila gris"],
    columnas: [PRECIO, { cabecera: "Bolsillos", frase: "número de bolsillos", articulo: "el", valores: rango(1, 8, 1), mejorAlto: true }, { cabecera: "Peso (gramos)", frase: "peso", articulo: "el", valores: rango(300, 1000, 100) }],
  },
  {
    clave: "semillas", cosa: "semilla", unaCosa: "una semilla", titulo: "Semillas para el huerto", nombres: ["Semilla A", "Semilla B", "Semilla C", "Semilla D"],
    columnas: [{ cabecera: "Días", frase: "número de días", articulo: "el", valores: rango(20, 70, 5) }, { cabecera: "Agua (litros)", frase: "cantidad de agua", articulo: "la", valores: rango(2, 12, 1) }, PRECIO],
  },
  {
    clave: "caminos", cosa: "ruta", unaCosa: "una ruta", titulo: "Rutas para la excursión", nombres: ["Ruta del río", "Ruta del puente", "Ruta de la plaza", "Ruta del bosque"],
    columnas: [{ cabecera: "Distancia (metros)", frase: "distancia", articulo: "la", valores: rango(400, 1500, 100) }, { cabecera: "Tiempo (minutos)", frase: "tiempo", articulo: "el", valores: rango(10, 60, 5) }, { cabecera: "Cuestas", frase: "número de cuestas", articulo: "el", valores: rango(0, 7, 1) }],
  },
  {
    clave: "cuadernos", cosa: "cuaderno", unaCosa: "un cuaderno", titulo: "Cuadernos de la papelería", nombres: ["Cuaderno A", "Cuaderno B", "Cuaderno C", "Cuaderno D"],
    columnas: [PRECIO, { cabecera: "Páginas", frase: "número de páginas", articulo: "el", valores: rango(40, 200, 20), mejorAlto: true }, { cabecera: "Peso (gramos)", frase: "peso", articulo: "el", valores: rango(100, 600, 50) }],
  },
  {
    clave: "autobuses", cosa: "línea de autobús", unaCosa: "una línea de autobús", titulo: "Líneas de autobús", nombres: ["Línea 1", "Línea 2", "Línea 3", "Línea 4"],
    columnas: [PRECIO, { cabecera: "Paradas", frase: "número de paradas", articulo: "el", valores: rango(3, 15, 1) }, { cabecera: "Tiempo (minutos)", frase: "tiempo", articulo: "el", valores: rango(10, 60, 5) }],
  },
  {
    clave: "linternas", cosa: "linterna", unaCosa: "una linterna", titulo: "Linternas de la tienda", nombres: ["Linterna A", "Linterna B", "Linterna C", "Linterna D"],
    columnas: [PRECIO, { cabecera: "Horas de luz", frase: "número de horas de luz", articulo: "el", valores: rango(2, 14, 1), mejorAlto: true }, { cabecera: "Peso (gramos)", frase: "peso", articulo: "el", valores: rango(100, 800, 100) }],
  },
];

interface Tabla {
  readonly nombres: readonly string[];
  readonly valores: readonly (readonly number[])[]; // valores[fila][columna], sin repetir por columna
  readonly imagen: Imagen;
}

function crearTabla(rng: Rng, dom: Dominio, filas: number): Tabla {
  const nombres = muestra(rng, dom.nombres, filas);
  const columnas = dom.columnas.map((c) => muestra(rng, c.valores, filas));
  const valores = nombres.map((_, i) => columnas.map((c) => en(c, i)));
  return {
    nombres,
    valores,
    imagen: { tipo: "tabla", titulo: dom.titulo, cabeceras: ["Nombre", ...dom.columnas.map((c) => c.cabecera)], filas: nombres.map((n, i) => [n, ...en(valores, i).map(String)]) },
  };
}

// "Mochila roja" -> "la mochila roja".
const ref = (dom: Dominio, nombre: string): string => `${dom.unaCosa.startsWith("un ") ? "el" : "la"} ${nombre.charAt(0).toLowerCase()}${nombre.slice(1)}`;
const conArticulo = (c: Columna): string => `${c.articulo} ${c.frase}`;
const extremo = (c: Columna, alto: boolean): string => `${conArticulo(c)} más ${alto ? "alt" : "baj"}${c.articulo === "el" ? "o" : "a"}`;
const valorDe = (t: Tabla, fila: number, col: number): number => en(en(t.valores, fila), col);
const columnaDe = (t: Tabla, col: number): number[] => t.valores.map((f) => en(f, col));

interface Condicion {
  readonly col: number;
  readonly debajo: boolean;
  readonly limite: number;
}

function cumple(t: Tabla, fila: number, c: Condicion): boolean {
  const v = valorDe(t, fila, c.col);
  return c.debajo ? v < c.limite : v > c.limite;
}

function textoCondicion(dom: Dominio, c: Condicion): string {
  return `${en(dom.columnas, c.col).frase} por ${c.debajo ? "debajo" : "encima"} de ${c.limite}`;
}

// Límite que no coincide con ningún valor de la tabla: así nadie duda si "justo" vale.
function limiteEntre(rng: Rng, t: Tabla, dom: Dominio, col: number): number | null {
  const presentes = columnaDe(t, col);
  const libres = en(dom.columnas, col).valores.filter((v) => !presentes.includes(v) && v > Math.min(...presentes) && v < Math.max(...presentes));
  return libres.length === 0 ? null : elegir(rng, libres);
}

function condicionesUnicas(rng: Rng, t: Tabla, dom: Dominio, cols: readonly number[]): { conds: Condicion[]; fila: number } | null {
  const conds: Condicion[] = [];
  for (const col of cols) {
    const limite = limiteEntre(rng, t, dom, col);
    if (limite === null) return null;
    conds.push({ col, debajo: en(dom.columnas, col).mejorAlto !== true, limite });
  }
  const validas = t.nombres.map((_, i) => i).filter((i) => conds.every((c) => cumple(t, i, c)));
  if (validas.length !== 1) return null;
  // Las condiciones hacen falta todas: si se quita una, ya hay más de una fila válida.
  const necesarias = conds.every((_, k) => t.nombres.filter((__, i) => conds.every((c, j) => j === k || cumple(t, i, c))).length > 1);
  return necesarias ? { conds, fila: en(validas, 0) } : null;
}

function elegirExtremo(dom: Dominio, rng: Rng): Contenido {
  const t = crearTabla(rng, dom, 3);
  const col = entero(rng, 0, 2);
  const alto = rng() < 0.5;
  const valores = columnaDe(t, col);
  const objetivo = alto ? Math.max(...valores) : Math.min(...valores);
  const correcta = en(t.nombres, valores.indexOf(objetivo));
  const c = en(dom.columnas, col);
  return {
    enunciado: `Mira la tabla. ¿Qué ${dom.cosa} tiene ${extremo(c, alto)}?`,
    enunciadoFacil: `Mira la tabla. Busca ${extremo(c, alto)}. ¿Cuál es?`,
    imagen: t.imagen,
    respuesta: { tipo: "opcion", correcta, distractores: t.nombres.filter((n) => n !== correcta) },
    pista: `Mira solo la columna «${c.cabecera}».`,
    explicacion: `En esa columna, ${objetivo} es el número más ${alto ? "alto" : "bajo"}, y lo tiene ${ref(dom, correcta)}.`,
  };
}

function elegirCondiciones(dom: Dominio, rng: Rng, d: Dificultad): Contenido {
  const cuantas = d === 2 ? 2 : 3;
  return buscar(() => {
    const t = crearTabla(rng, dom, 4);
    const cols = muestra(rng, [0, 1, 2], cuantas);
    const r = condicionesUnicas(rng, t, dom, cols);
    if (r === null) return null;
    const correcta = en(t.nombres, r.fila);
    const lista = r.conds.map((c) => textoCondicion(dom, c));
    const unidas = lista.length === 2 ? lista.join(" y ") : `${lista.slice(0, -1).join(", ")} y ${en(lista, lista.length - 1)}`;
    const numero = cuantas === 2 ? "dos" : "tres";
    return {
      enunciado: `Mira la tabla. Buscas ${dom.unaCosa} con estas condiciones: ${unidas}. ¿Cuál cumple las ${numero} condiciones?`,
      enunciadoFacil: `Mira la tabla. Condiciones: ${lista.map(mayus).join(". ")}. ¿Cuál las cumple todas?`,
      imagen: t.imagen,
      respuesta: { tipo: "opcion", correcta, distractores: t.nombres.filter((n) => n !== correcta) },
      pista: "Comprueba una condición cada vez y tacha las filas que no la cumplen.",
      explicacion: `${mayus(ref(dom, correcta))} es la única opción que cumple ${cuantas === 2 ? "las dos condiciones" : "las tres condiciones"}: ${r.conds.map((c) => `${en(dom.columnas, c.col).frase} ${valorDe(t, r.fila, c.col)}`).join(", ")}.`,
    };
  });
}

function filtrarYElegir(dom: Dominio, rng: Rng): Contenido {
  return buscar(() => {
    const t = crearTabla(rng, dom, 4);
    const [cf, ce] = muestra(rng, [0, 1, 2], 2) as [number, number];
    const limite = limiteEntre(rng, t, dom, cf);
    if (limite === null) return null;
    const cond: Condicion = { col: cf, debajo: en(dom.columnas, cf).mejorAlto !== true, limite };
    const alto = en(dom.columnas, ce).mejorAlto === true;
    const validas = t.nombres.map((_, i) => i).filter((i) => cumple(t, i, cond));
    if (validas.length < 2 || validas.length === 4) return null;
    const valoresValidos = validas.map((i) => valorDe(t, i, ce));
    const objetivo = alto ? Math.max(...valoresValidos) : Math.min(...valoresValidos);
    const fila = en(validas, valoresValidos.indexOf(objetivo));
    const todos = columnaDe(t, ce);
    const global = alto ? Math.max(...todos) : Math.min(...todos);
    // Trampa: el extremo de toda la tabla no cumple la condición.
    if (global === objetivo) return null;
    const correcta = en(t.nombres, fila);
    const c = en(dom.columnas, ce);
    return {
      enunciado: `Mira la tabla. Solo sirven las filas con ${textoCondicion(dom, cond)}. De esas filas, ¿cuál tiene ${extremo(c, alto)}?`,
      enunciadoFacil: `Mira la tabla. Solo sirven las filas con ${textoCondicion(dom, cond)}. De esas, ¿cuál tiene ${extremo(c, alto)}?`,
      imagen: t.imagen,
      respuesta: { tipo: "opcion", correcta, distractores: t.nombres.filter((n) => n !== correcta) },
      pista: "Primero tacha las filas que no sirven. Después compara solo las que quedan.",
      explicacion: `Quedan ${validas.length} filas. De ellas, ${ref(dom, correcta)} tiene el valor más ${alto ? "alto" : "bajo"} en esa columna: ${objetivo}.`,
    };
  });
}

const PLANTILLAS_TABLA: readonly Plantilla[] = DOMINIOS.flatMap((dom): Plantilla[] => [
  { clave: `extremo-${dom.clave}`, dificultades: [1], crear: (rng) => elegirExtremo(dom, rng) },
  { clave: `condiciones-${dom.clave}`, dificultades: [2, 3], crear: (rng, d) => elegirCondiciones(dom, rng, d) },
  { clave: `filtrar-${dom.clave}`, dificultades: [3], crear: (rng) => filtrarYElegir(dom, rng) },
]);

// ---------- Justificar ----------
function justificar(dom: Dominio, rng: Rng): Contenido {
  const quien = nombre(rng);
  const t = crearTabla(rng, dom, 3);
  const [col, otra] = muestra(rng, [0, 1, 2], 2) as [number, number];
  const alto = en(dom.columnas, col).mejorAlto === true;
  const valores = columnaDe(t, col);
  const objetivo = alto ? Math.max(...valores) : Math.min(...valores);
  const fila = valores.indexOf(objetivo);
  const c = en(dom.columnas, col);
  const o = en(dom.columnas, otra);
  const elegida = en(t.nombres, fila);
  const falso = elegir(rng, valores.filter((v) => v !== objetivo));
  const adjetivo = `más ${alto ? "alt" : "baj"}${c.articulo === "el" ? "o" : "a"}`;
  const correcta = `Su ${c.frase} es ${objetivo}, ${c.articulo} ${adjetivo} de la tabla.`;
  return {
    enunciado: `Mira la tabla. ${quien} quiere la opción con ${extremo(c, alto)} y elige ${ref(dom, elegida)}. ¿Qué frase justifica su elección?`,
    enunciadoFacil: `Mira la tabla. ${quien} quiere ${extremo(c, alto)}. Elige ${ref(dom, elegida)}. ¿Qué frase lo explica bien?`,
    imagen: t.imagen,
    respuesta: {
      tipo: "opcion",
      correcta,
      distractores: [`Su ${c.frase} es ${falso}, ${c.articulo} ${adjetivo} de la tabla.`, `Su ${o.frase} es ${valorDe(t, fila, otra)}.`],
    },
    pista: "La frase debe ser cierta y debe hablar de lo que quiere conseguir.",
    explicacion: `${quien} busca ${extremo(c, alto)}, y ${ref(dom, elegida)} tiene ${objetivo} en esa columna. Un dato de otra columna no explica su elección.`,
  };
}

function tieneRazon(dom: Dominio, rng: Rng): Contenido {
  const quien = nombre(rng);
  const t = crearTabla(rng, dom, 4);
  const [col, otra] = muestra(rng, [0, 1, 2], 2) as [number, number];
  const alto = en(dom.columnas, col).mejorAlto === true;
  const valores = columnaDe(t, col);
  const objetivo = alto ? Math.max(...valores) : Math.min(...valores);
  const mejor = valores.indexOf(objetivo);
  const acierta = rng() < 0.45;
  const fila = acierta ? mejor : elegir(rng, [0, 1, 2, 3].filter((i) => i !== mejor));
  const c = en(dom.columnas, col);
  const o = en(dom.columnas, otra);
  const elegida = en(t.nombres, fila);
  const nombreMejor = en(t.nombres, mejor);
  const adjetivo = `más ${alto ? "alt" : "baj"}${c.articulo === "el" ? "o" : "a"}`;
  const segundo = en(t.nombres, [0, 1, 2, 3].find((i) => i !== mejor && i !== fila) ?? 0);
  const si = `Sí, porque ${ref(dom, elegida)} tiene ${conArticulo(c)} ${adjetivo}`;
  const noMejor = `No, porque ${ref(dom, nombreMejor)} tiene ${conArticulo(c)} ${adjetivo}`;
  const correcta = acierta ? si : noMejor;
  const irrelevante = `Sí, porque su ${o.frase} es ${valorDe(t, fila, otra)}`;
  const otraFalsa = `No, porque ${ref(dom, segundo)} tiene ${conArticulo(c)} ${adjetivo}`;
  const distractores = acierta ? [otraFalsa, irrelevante] : [si, otraFalsa, irrelevante];
  return {
    enunciado: `Mira la tabla. ${quien} quiere la opción con ${extremo(c, alto)} y elige ${ref(dom, elegida)}. ¿Ha elegido bien?`,
    enunciadoFacil: `Mira la tabla. ${quien} quiere ${extremo(c, alto)}. Elige ${ref(dom, elegida)}. ¿Ha elegido bien?`,
    imagen: t.imagen,
    respuesta: { tipo: "opcion", correcta, distractores },
    pista: "Compara los números de esa columna. La razón debe ser cierta.",
    explicacion: `En la columna «${c.cabecera}», el valor más ${alto ? "alto" : "bajo"} es ${objetivo}, y lo tiene ${ref(dom, nombreMejor)}.`,
  };
}

function porQueNo(dom: Dominio, rng: Rng): Contenido {
  return buscar(() => {
    const t = crearTabla(rng, dom, 4);
    const [c1, c2, c3] = barajar(rng, [0, 1, 2]) as [number, number, number];
    const r = condicionesUnicas(rng, t, dom, [c1, c2]);
    if (r === null) return null;
    const [k1, k2] = r.conds as [Condicion, Condicion];
    // Fila descartada: falla la primera condición y cumple la segunda.
    const candidatas = t.nombres.map((_, i) => i).filter((i) => !cumple(t, i, k1) && cumple(t, i, k2));
    if (candidatas.length === 0) return null;
    const fila = elegir(rng, candidatas);
    const col1 = en(dom.columnas, k1.col);
    const col2 = en(dom.columnas, k2.col);
    const col3 = en(dom.columnas, c3);
    const elegida = en(t.nombres, r.fila);
    const descartada = en(t.nombres, fila);
    const razon = (col: Columna, v: number, k: Condicion): string => `Porque su ${col.frase} es ${v}, y debe estar por ${k.debajo ? "debajo" : "encima"} de ${k.limite}.`;
    return {
      enunciado: `Mira la tabla. La clase necesita ${textoCondicion(dom, k1)} y ${textoCondicion(dom, k2)}. La clase elige ${ref(dom, elegida)}. ¿Por qué no sirve ${ref(dom, descartada)}?`,
      enunciadoFacil: `Mira la tabla. La clase necesita ${textoCondicion(dom, k1)}. También ${textoCondicion(dom, k2)}. La clase elige ${ref(dom, elegida)}. ¿Por qué no sirve ${ref(dom, descartada)}?`,
      imagen: t.imagen,
      respuesta: {
        tipo: "opcion",
        correcta: razon(col1, valorDe(t, fila, k1.col), k1),
        distractores: [razon(col2, valorDe(t, fila, k2.col), k2), `Porque su ${col3.frase} es ${valorDe(t, fila, c3)}.`, razon(col1, valorDe(t, r.fila, k1.col), k1)],
      },
      pista: "Mira esa fila y compárala con cada condición.",
      explicacion: `${mayus(ref(dom, descartada))} tiene ${valorDe(t, fila, k1.col)} en esa columna, y eso no cumple «${textoCondicion(dom, k1)}». La otra condición sí la cumple.`,
    };
  });
}

function queColumna(dom: Dominio, rng: Rng): Contenido {
  const col = entero(rng, 0, 2);
  const alto = rng() < 0.5;
  const t = crearTabla(rng, dom, 3);
  const c = en(dom.columnas, col);
  return {
    enunciado: `Mira la tabla. Quieres saber qué opción tiene ${extremo(c, alto)}. ¿Qué columna debes mirar?`,
    enunciadoFacil: `Mira la tabla. Buscas ${extremo(c, alto)}. ¿Qué columna miras?`,
    imagen: t.imagen,
    respuesta: { tipo: "opcion", correcta: c.cabecera, distractores: dom.columnas.filter((x) => x !== c).map((x) => x.cabecera) },
    pista: "Busca la columna que habla de lo que quieres saber.",
    explicacion: `Para comparar ${conArticulo(c)} hay que mirar la columna «${c.cabecera}».`,
  };
}

const PLANTILLAS_JUSTIFICAR: readonly Plantilla[] = DOMINIOS.flatMap((dom): Plantilla[] => [
  { clave: `columna-${dom.clave}`, dificultades: [1], crear: (rng) => queColumna(dom, rng) },
  { clave: `justificar-${dom.clave}`, dificultades: [1, 2], crear: (rng) => justificar(dom, rng) },
  { clave: `razon-${dom.clave}`, dificultades: [2], crear: (rng) => tieneRazon(dom, rng) },
  { clave: `por-que-no-${dom.clave}`, dificultades: [3], crear: (rng) => porQueNo(dom, rng) },
]);

export const GENERADORES_DATOS4: Readonly<Record<string, readonly Generador[]>> = {
  "PEN4-T3-a": [generadorDePlantillas("PEN4-T3-a", PLANTILLAS_TABLA)],
  "PEN4-T3-b": [generadorDePlantillas("PEN4-T3-b", PLANTILLAS_JUSTIFICAR)],
};
