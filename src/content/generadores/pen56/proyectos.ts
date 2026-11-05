// PEN6-T1: pasos, recursos y tiempo de un proyecto.
import type { Rng } from "../../../core/rng.ts";
import { barajar, elegir, entero, muestra, nombres, pregunta } from "../../ayuda.ts";
import type { Dificultad, Generador, Imagen } from "../../tipos.ts";
import { capital, cartelPistas, en, porDificultad, reintentar } from "./comun.ts";

// ---------- Pasos ----------
// Cada lista tiene un orden obligado: cada paso necesita el anterior.
interface Proyecto {
  readonly id: string;
  readonly nombre: string;
  readonly pasos: readonly string[];
}

const PROYECTOS: readonly Proyecto[] = [
  { id: "huerto", nombre: "hacer un huerto en la escuela", pasos: ["Elegir el lugar del huerto", "Quitar las piedras y remover la tierra", "Sembrar las semillas", "Regar lo sembrado hasta que crezca", "Recoger las verduras"] },
  { id: "biblioteca", nombre: "abrir una biblioteca en el aula", pasos: ["Reunir los libros", "Separar los libros por temas", "Poner a cada libro la etiqueta de su tema", "Colocar los libros ya etiquetados en el estante", "Prestar los libros a los compañeros"] },
  { id: "mural", nombre: "pintar un mural", pasos: ["Decidir qué se va a pintar", "Hacer el dibujo en un papel", "Copiar el dibujo en la pared", "Rellenar el dibujo con pintura", "Enseñar el mural terminado a la escuela"] },
  { id: "lluvia", nombre: "recoger agua de lluvia para regar", pasos: ["Buscar un tejado que recoja la lluvia", "Colocar un canal en el borde del tejado", "Poner un depósito limpio bajo el canal", "Esperar a que llueva y se llene", "Regar las plantas con esa agua"] },
  { id: "experimento", nombre: "presentar un experimento de ciencias", pasos: ["Elegir una pregunta para investigar", "Preparar el experimento", "Hacer el experimento", "Anotar los resultados", "Explicar los resultados a la clase"] },
  { id: "periodico", nombre: "hacer un periódico de la escuela", pasos: ["Decidir las noticias que saldrán", "Escribir las noticias", "Corregir los textos", "Hacer las copias del periódico", "Repartir el periódico"] },
  { id: "teatro", nombre: "representar una obra de teatro", pasos: ["Escribir la obra", "Repartir los personajes", "Aprender cada uno su parte", "Ensayar todos juntos", "Representar la obra ante el público"] },
];

const SUB_PASOS = "PEN6-T1-a";

function deProyecto(crear: (rng: Rng, d: Dificultad, p: Proyecto) => ReturnType<Generador>): Generador {
  return (rng, d) => crear(rng, d, elegir(rng, PROYECTOS));
}

const pasoExtremo = (cual: "primero" | "ultimo") => deProyecto((rng, dificultad, p) => {
  const i = cual === "primero" ? 0 : p.pasos.length - 1;
  const correcta = en(p.pasos, i);
  const palabra = cual === "primero" ? "primero" : "último";
  return pregunta(rng, {
    subhabilidad: SUB_PASOS,
    dificultad,
    enunciado: `Una clase quiere ${p.nombre}. ¿Cuál de estos pasos es el ${palabra}?`,
    enunciadoFacil: `Una clase quiere ${p.nombre}. ¿Qué paso es el ${palabra}?`,
    respuesta: { tipo: "opcion", correcta, distractores: muestra(rng, p.pasos.filter((x) => x !== correcta), 3) },
    pista: "Piensa qué paso se puede hacer sin haber hecho ninguno de los otros, o cuál necesita que todo esté hecho.",
    explicacion: cual === "primero" ? `Sin «${correcta.toLowerCase()}» no se puede hacer ninguno de los otros pasos.` : `«${correcta}» solo se puede hacer cuando todos los demás pasos están hechos.`,
    plantilla: `${SUB_PASOS}:${p.id}:${cual}`,
  });
});

const pasoSiguiente = deProyecto((rng, dificultad, p) => {
  const i = entero(rng, 1, p.pasos.length - 2);
  const hecho = en(p.pasos, i);
  const correcta = en(p.pasos, i + 1);
  const otros = p.pasos.filter((_, j) => j !== i && j !== i + 1);
  return pregunta(rng, {
    subhabilidad: SUB_PASOS,
    dificultad,
    enunciado: `Una clase quiere ${p.nombre}. Acaban de terminar este paso: «${hecho}». ¿Cuál es el paso que toca ahora?`,
    enunciadoFacil: `Una clase quiere ${p.nombre}. Ya han hecho esto: «${hecho}». ¿Qué paso toca ahora?`,
    respuesta: { tipo: "opcion", correcta, distractores: muestra(rng, otros, 3) },
    pista: "Busca el paso que se puede hacer ya. Descarta lo que ya está hecho y lo que necesita algo más antes.",
    explicacion: `Después de «${hecho.toLowerCase()}» toca «${correcta.toLowerCase()}». Los pasos posteriores aún no se pueden hacer.`,
    plantilla: `${SUB_PASOS}:${p.id}:siguiente`,
  });
});

const pasoAnterior = deProyecto((rng, dificultad, p) => {
  const i = entero(rng, 1, p.pasos.length - 1);
  const dado = en(p.pasos, i);
  const correcta = en(p.pasos, i - 1);
  const otros = p.pasos.filter((_, j) => j !== i && j !== i - 1);
  return pregunta(rng, {
    subhabilidad: SUB_PASOS,
    dificultad,
    enunciado: `Una clase quiere ${p.nombre}. ¿Qué paso hay que hacer justo antes de este: «${dado}»?`,
    enunciadoFacil: `Una clase quiere ${p.nombre}. El paso es: «${dado}». ¿Qué paso va justo antes?`,
    respuesta: { tipo: "opcion", correcta, distractores: muestra(rng, otros, 3) },
    pista: "Pregúntate qué debe estar listo para poder hacer ese paso.",
    explicacion: `Para poder hacer «${dado.toLowerCase()}», antes hay que «${correcta.toLowerCase()}».`,
    plantilla: `${SUB_PASOS}:${p.id}:anterior`,
  });
});

const LETRAS = ["A", "B", "C", "D"];

const ordenCorrecto = deProyecto((rng, dificultad, p) => {
  const inicio = entero(rng, 0, p.pasos.length - 4);
  const pasos = p.pasos.slice(inicio, inicio + 4);
  const barajados = reintentar(() => {
    const b = barajar(rng, pasos);
    return b.join() === pasos.join() ? null : b;
  });
  const letraDe = (paso: string) => en(LETRAS, barajados.indexOf(paso));
  const correcto = pasos.map(letraDe);
  const distractores: string[] = [];
  const texto = (x: readonly string[]) => x.join(", ");
  // Cambios típicos: dos pasos seguidos al revés y lista tal como aparece.
  const cambiar = (i: number) => {
    const c = [...correcto];
    c[i] = en(correcto, i + 1);
    c[i + 1] = en(correcto, i);
    return texto(c);
  };
  for (const candidato of [cambiar(0), cambiar(1), cambiar(2), texto(LETRAS)]) {
    if (candidato !== texto(correcto) && !distractores.includes(candidato)) distractores.push(candidato);
  }
  return pregunta(rng, {
    subhabilidad: SUB_PASOS,
    dificultad,
    enunciado: `Una clase quiere ${p.nombre}. Los pasos del cartel están desordenados. ¿Cuál es el orden correcto?`,
    enunciadoFacil: `Una clase quiere ${p.nombre}. Los pasos están desordenados. ¿Cuál es el orden correcto?`,
    imagen: cartelPistas(barajados.map((x, i) => `${en(LETRAS, i)}: ${x}`), "Pasos"),
    respuesta: { tipo: "opcion", correcta: texto(correcto), distractores: muestra(rng, distractores, 3) },
    pista: "Busca el paso que no necesita a ninguno de los otros. Después, el que se puede hacer gracias a ese.",
    explicacion: `El orden es: ${pasos.map((x) => x.toLowerCase()).join("; ")}.`,
    plantilla: `${SUB_PASOS}:${p.id}:orden`,
  });
});

const pasosCambiados = deProyecto((rng, dificultad, p) => {
  const i = entero(rng, 0, p.pasos.length - 2);
  const lista = [...p.pasos];
  lista[i] = en(p.pasos, i + 1);
  lista[i + 1] = en(p.pasos, i);
  const pareja = (j: number) => `Los pasos ${j + 1} y ${j + 2}`;
  const otros = Array.from({ length: p.pasos.length - 1 }, (_, j) => j).filter((j) => j !== i);
  return pregunta(rng, {
    subhabilidad: SUB_PASOS,
    dificultad,
    enunciado: `Una clase quiere ${p.nombre} y ha escrito este plan. Dos pasos seguidos están cambiados de lugar. ¿Cuáles son?`,
    enunciadoFacil: `Una clase quiere ${p.nombre}. Mira el plan. Hay dos pasos seguidos cambiados. ¿Cuáles son?`,
    imagen: cartelPistas(lista.map((x, j) => `${j + 1}. ${x}`), "Plan"),
    respuesta: { tipo: "opcion", correcta: pareja(i), distractores: muestra(rng, otros, 3).map(pareja) },
    pista: "Lee el plan paso a paso. Busca un paso que no se puede hacer porque aún falta el que viene después.",
    explicacion: `«${en(p.pasos, i + 1)}» no se puede hacer antes de «${en(p.pasos, i).toLowerCase()}».`,
    plantilla: `${SUB_PASOS}:${p.id}:cambiados`,
  });
});

// ---------- Recursos ----------
interface Material {
  readonly plural: string;
  readonly masculino: boolean;
  readonly min: number;
  readonly max: number;
  readonly paquete: number;
  readonly precio: number;
}

interface Obra {
  readonly id: string;
  readonly singular: string;
  readonly plural: string;
  readonly masculino: boolean;
  readonly materiales: readonly [Material, Material, Material];
}

function mat(plural: string, masculino: boolean, min: number, max: number, paquete: number, precio: number): Material {
  return { plural, masculino, min, max, paquete, precio };
}

const OBRAS: readonly Obra[] = [
  { id: "macetas", singular: "maceta", plural: "macetas", masculino: false, materiales: [mat("semillas", false, 3, 6, 10, 4), mat("vasos de tierra", true, 2, 5, 12, 6), mat("palos de apoyo", true, 2, 3, 6, 3)] },
  { id: "estantes", singular: "estante", plural: "estantes", masculino: true, materiales: [mat("clavos", true, 6, 12, 20, 5), mat("tablas", false, 2, 4, 5, 12), mat("tornillos", true, 4, 8, 10, 6)] },
  { id: "carteles", singular: "cartel", plural: "carteles", masculino: true, materiales: [mat("hojas", false, 2, 5, 10, 3), mat("pinzas", false, 3, 4, 12, 2), mat("tiras de cinta", false, 2, 6, 8, 4)] },
  { id: "cajas", singular: "caja de reciclaje", plural: "cajas de reciclaje", masculino: false, materiales: [mat("cartones", true, 2, 4, 6, 5), mat("tiras de cinta", false, 4, 8, 10, 4), mat("etiquetas", false, 2, 3, 8, 3)] },
  { id: "cometas", singular: "cometa", plural: "cometas", masculino: false, materiales: [mat("varillas", false, 2, 3, 6, 4), mat("hojas de papel", false, 2, 4, 10, 3), mat("metros de hilo", true, 3, 6, 25, 7)] },
];

const SUB_RECURSOS = "PEN6-T1-b";

function deObra(crear: (rng: Rng, d: Dificultad, o: Obra) => ReturnType<Generador>): Generador {
  return (rng, d) => crear(rng, d, elegir(rng, OBRAS));
}

function completos(o: Obra): string {
  return o.masculino ? `¿Cuántos ${o.plural} completos` : `¿Cuántas ${o.plural} completas`;
}

function cuantosMat(m: Material): string {
  return `${m.masculino ? "¿Cuántos" : "¿Cuántas"} ${m.plural}`;
}

const totalMaterial = deObra((rng, dificultad, o) => {
  const m = elegir(rng, o.materiales);
  const x = entero(rng, m.min, m.max);
  const n = entero(rng, 3, 12);
  return pregunta(rng, {
    subhabilidad: SUB_RECURSOS,
    dificultad,
    enunciado: `Un grupo va a preparar ${n} ${o.plural}. Para cada ${o.singular} hacen falta ${x} ${m.plural}. ${cuantosMat(m)} necesitan en total?`,
    enunciadoFacil: `Un grupo prepara ${n} ${o.plural}. Cada ${o.singular} lleva ${x} ${m.plural}. ${cuantosMat(m)} necesitan?`,
    respuesta: { tipo: "numero", valor: n * x },
    pista: "Multiplica lo que lleva una unidad por el número de unidades.",
    explicacion: `${n} × ${x} = ${n * x}.`,
    plantilla: `${SUB_RECURSOS}:total:${o.id}`,
  });
});

const materialQueFalta = deObra((rng, dificultad, o) => {
  const m = elegir(rng, o.materiales);
  const x = entero(rng, m.min, m.max);
  const n = entero(rng, 3, 12);
  const faltan = entero(rng, 2, n * x - 1);
  const tienen = n * x - faltan;
  return pregunta(rng, {
    subhabilidad: SUB_RECURSOS,
    dificultad,
    enunciado: `Un grupo va a preparar ${n} ${o.plural}. Para cada ${o.singular} hacen falta ${x} ${m.plural}, y ya tienen ${tienen}. ${cuantosMat(m)} les faltan?`,
    enunciadoFacil: `Un grupo prepara ${n} ${o.plural}. Cada ${o.singular} lleva ${x} ${m.plural}. Ya tienen ${tienen}. ${cuantosMat(m)} faltan?`,
    respuesta: { tipo: "numero", valor: faltan },
    pista: "Calcula cuánto necesitan en total y resta lo que ya tienen.",
    explicacion: `Necesitan ${n} × ${x} = ${n * x}. Si tienen ${tienen}, faltan ${n * x} − ${tienen} = ${faltan}.`,
    plantilla: `${SUB_RECURSOS}:faltan:${o.id}`,
  });
});

const paquetesNecesarios = deObra((rng, dificultad, o) => {
  const { m, x, n, k } = reintentar(() => {
    const material = elegir(rng, o.materiales);
    const porUnidad = entero(rng, material.min, material.max);
    const cuantas = entero(rng, 4, 15);
    const total = cuantas * porUnidad;
    return total % material.paquete !== 0 && total > material.paquete ? { m: material, x: porUnidad, n: cuantas, k: material.paquete } : null;
  });
  const total = n * x;
  const p = Math.ceil(total / k);
  return pregunta(rng, {
    subhabilidad: SUB_RECURSOS,
    dificultad,
    enunciado: `Un grupo va a preparar ${n} ${o.plural}. Para cada ${o.singular} hacen falta ${x} ${m.plural}, que se venden en paquetes de ${k}. ¿Cuántos paquetes deben comprar, como mínimo?`,
    enunciadoFacil: `Un grupo prepara ${n} ${o.plural}. Cada ${o.singular} lleva ${x} ${m.plural}. Cada paquete trae ${k}. ¿Cuántos paquetes compran como mínimo?`,
    respuesta: { tipo: "numero", valor: p },
    pista: "Calcula cuánto material necesitan. Si un paquete queda a medias, hay que comprarlo entero.",
    explicacion: `Necesitan ${total}. Con ${p - 1 === 1 ? "1 paquete" : `${p - 1} paquetes`} tienen ${(p - 1) * k}, que no alcanza. Con ${p} tienen ${p * k}.`,
    plantilla: `${SUB_RECURSOS}:paquetes:${o.id}`,
  });
});

const cualNoAlcanza = deObra((rng, dificultad, o) => {
  const n = entero(rng, 3, 9);
  const filas = o.materiales.map((m) => ({ m, x: entero(rng, m.min, m.max) }));
  const corto = elegir(rng, filas);
  const datos = filas.map((f) => ({ ...f, tienen: f === corto ? n * f.x - entero(rng, 1, Math.min(f.x * 2, n * f.x - 1)) : n * f.x + entero(rng, 0, 8) }));
  const imagen: Imagen = {
    tipo: "tabla",
    titulo: `Material para ${n} ${o.plural}`,
    cabeceras: ["Material", "Por cada unidad", "Tienen"],
    filas: datos.map((d) => [capital(d.m.plural), String(d.x), String(d.tienen)]),
  };
  const faltaDe = datos.find((d) => d.m === corto.m);
  return pregunta(rng, {
    subhabilidad: SUB_RECURSOS,
    dificultad,
    enunciado: `Un grupo va a preparar ${n} ${o.plural}. La tabla dice cuánto lleva cada unidad y cuánto tienen. ¿De qué material no tienen suficiente?`,
    enunciadoFacil: `Un grupo prepara ${n} ${o.plural}. Mira la tabla. ¿Qué material no les alcanza?`,
    imagen,
    respuesta: { tipo: "opcion", correcta: capital(corto.m.plural), distractores: filas.filter((f) => f !== corto).map((f) => capital(f.m.plural)) },
    pista: "Multiplica cada fila por el número de unidades y compara con lo que tienen.",
    explicacion: `Necesitan ${n} × ${corto.x} = ${n * corto.x} ${corto.m.plural} y solo tienen ${faltaDe?.tienen ?? 0}. Del resto tienen suficiente.`,
    plantilla: `${SUB_RECURSOS}:noAlcanza:${o.id}`,
  });
});

const costePaquetes = deObra((rng, dificultad, o) => {
  const { m, x, n, tienen, p } = reintentar(() => {
    const material = elegir(rng, o.materiales);
    const porUnidad = entero(rng, material.min, material.max);
    const cuantas = entero(rng, 5, 15);
    const total = cuantas * porUnidad;
    const ya = entero(rng, 2, Math.floor(total / 2));
    const falta = total - ya;
    if (falta % material.paquete === 0 || falta <= material.paquete) return null;
    return { m: material, x: porUnidad, n: cuantas, tienen: ya, p: Math.ceil(falta / material.paquete) };
  });
  const falta = n * x - tienen;
  return pregunta(rng, {
    subhabilidad: SUB_RECURSOS,
    dificultad,
    enunciado: `Un grupo va a preparar ${n} ${o.plural}. Para cada ${o.singular} hacen falta ${x} ${m.plural}, y ya tienen ${tienen}. El resto se compra en paquetes de ${m.paquete} que cuestan ${m.precio} monedas cada uno. ¿Cuántas monedas gastan como mínimo?`,
    enunciadoFacil: `Un grupo prepara ${n} ${o.plural}. Cada ${o.singular} lleva ${x} ${m.plural}. Ya tienen ${tienen}. Cada paquete trae ${m.paquete} y cuesta ${m.precio} monedas. ¿Cuántas monedas gastan como mínimo?`,
    respuesta: { tipo: "numero", valor: p * m.precio },
    pista: "Calcula lo que falta, después los paquetes enteros que hacen falta y por último el dinero.",
    explicacion: `Faltan ${n * x} − ${tienen} = ${falta}. Hacen falta ${p} paquetes, y ${p} × ${m.precio} = ${p * m.precio} monedas.`,
    plantilla: `${SUB_RECURSOS}:coste:${o.id}`,
  });
});

const materialLimita = deObra((rng, dificultad, o) => {
  const { a, b, x, y, ta, tb, ua, ub } = reintentar(() => {
    const [m1, m2] = muestra(rng, o.materiales, 2) as [Material, Material];
    const [p1, p2] = [entero(rng, m1.min, m1.max), entero(rng, m2.min, m2.max)];
    const [s1, s2] = [entero(rng, 10, 60), entero(rng, 10, 60)];
    const [u1, u2] = [Math.floor(s1 / p1), Math.floor(s2 / p2)];
    if (u1 === u2 || u1 < 2 || u2 < 2 || s1 % p1 === 0 || s2 % p2 === 0) return null;
    return { a: m1, b: m2, x: p1, y: p2, ta: s1, tb: s2, ua: u1, ub: u2 };
  });
  const maximo = Math.min(ua, ub);
  return pregunta(rng, {
    subhabilidad: SUB_RECURSOS,
    dificultad,
    enunciado: `Para cada ${o.singular} hacen falta ${x} ${a.plural} y ${y} ${b.plural}. Un grupo tiene ${ta} ${a.plural} y ${tb} ${b.plural}. ${completos(o)} puede preparar como máximo?`,
    enunciadoFacil: `Cada ${o.singular} lleva ${x} ${a.plural} y ${y} ${b.plural}. Hay ${ta} ${a.plural} y ${tb} ${b.plural}. ${completos(o)} salen como máximo?`,
    respuesta: { tipo: "numero", valor: maximo },
    pista: "Calcula cuántas unidades salen con cada material. El que da menos es el que manda.",
    explicacion: `Con ${ta} ${a.plural} alcanza para ${ua} y con ${tb} ${b.plural}, para ${ub}. El material que se acaba antes manda, así que son ${maximo}.`,
    plantilla: `${SUB_RECURSOS}:limita:${o.id}`,
  });
});

// ---------- Tiempo ----------
interface Trabajo {
  readonly id: string;
  readonly nombre: string;
  readonly tareas: readonly string[];
  readonly accion: string; // "poner etiquetas a"
  readonly unidad: string; // "libros"
  readonly genero: "m" | "f";
  readonly paralelas: readonly [string, string, string]; // dos a la vez y una después
}

const TRABAJOS: readonly Trabajo[] = [
  { id: "mural", nombre: "el mural", tareas: ["Dibujar el boceto", "Pintar el fondo", "Pintar las figuras", "Limpiar los pinceles"], accion: "pintar", unidad: "tablas", genero: "f", paralelas: ["Preparar las pinturas", "Limpiar la pared", "Pintar el mural"] },
  { id: "huerto", nombre: "el huerto", tareas: ["Limpiar la tierra", "Sembrar", "Regar", "Poner los carteles"], accion: "sembrar", unidad: "plantas", genero: "f", paralelas: ["Separar las semillas", "Remover la tierra", "Sembrar"] },
  { id: "biblioteca", nombre: "la biblioteca", tareas: ["Clasificar los libros", "Poner las etiquetas", "Colocar los libros", "Escribir la lista"], accion: "etiquetar", unidad: "libros", genero: "m", paralelas: ["Escribir las etiquetas", "Limpiar el estante", "Colocar los libros"] },
  { id: "limpieza", nombre: "la limpieza del patio", tareas: ["Recoger las hojas", "Barrer el suelo", "Vaciar los cubos", "Ordenar las herramientas"], accion: "limpiar", unidad: "bancos", genero: "m", paralelas: ["Recoger las hojas", "Traer las escobas", "Barrer el suelo"] },
];

const SUB_TIEMPO = "PEN6-T1-c";

function deTrabajo(crear: (rng: Rng, d: Dificultad, t: Trabajo) => ReturnType<Generador>): Generador {
  return (rng, d) => crear(rng, d, elegir(rng, TRABAJOS));
}

function cuantasUnidades(t: Trabajo): string {
  return `${t.genero === "m" ? "¿Cuántos" : "¿Cuántas"} ${t.unidad}`;
}

function tablaTareas(t: Trabajo, tiempos: readonly number[], rotulo: string): Imagen {
  return { tipo: "tabla", titulo: `Tareas: ${t.nombre}`, cabeceras: ["Tarea", rotulo], filas: t.tareas.slice(0, tiempos.length).map((x, i) => [x, String(en(tiempos, i))]) };
}

function suma(lista: readonly number[]): number {
  return lista.reduce((s, x) => s + x, 0);
}

const totalMinutos = deTrabajo((rng, dificultad, t) => {
  const tiempos = t.tareas.slice(0, 3).map(() => entero(rng, 2, 9) * 5);
  const total = suma(tiempos);
  return pregunta(rng, {
    subhabilidad: SUB_TIEMPO,
    dificultad,
    enunciado: "Un grupo hace estas tareas una detrás de otra. ¿Cuántos minutos tarda en total?",
    enunciadoFacil: "Un grupo hace estas tareas. Hace una después de otra. ¿Cuántos minutos tarda en total?",
    imagen: tablaTareas(t, tiempos, "Minutos"),
    respuesta: { tipo: "numero", valor: total },
    pista: "Si las tareas van una detrás de otra, sus tiempos se suman.",
    explicacion: `${tiempos.join(" + ")} = ${total} minutos.`,
    plantilla: `${SUB_TIEMPO}:suma:${t.id}`,
  });
});

const diasDeTrabajo = deTrabajo((rng, dificultad, t) => {
  const r = entero(rng, 3, 12);
  const d = entero(rng, 3, 10);
  return pregunta(rng, {
    subhabilidad: SUB_TIEMPO,
    dificultad,
    enunciado: `Un grupo debe ${t.accion} ${r * d} ${t.unidad}. Cada día termina ${r} ${t.unidad}. ¿Cuántos días tarda?`,
    enunciadoFacil: `Hay que ${t.accion} ${r * d} ${t.unidad}. Cada día terminan ${r} ${t.unidad}. ¿Cuántos días tardan?`,
    respuesta: { tipo: "numero", valor: d },
    pista: "Divide todo el trabajo entre lo que se hace en un día.",
    explicacion: `${r * d} entre ${r} es ${d} días.`,
    plantilla: `${SUB_TIEMPO}:dias:${t.id}`,
  });
});

const ritmoNecesario = deTrabajo((rng, dificultad, t) => {
  const r = entero(rng, 3, 12);
  const d = entero(rng, 3, 10);
  const ya = entero(rng, 4, 30);
  return pregunta(rng, {
    subhabilidad: SUB_TIEMPO,
    dificultad,
    enunciado: `Un grupo debe ${t.accion} ${ya + r * d} ${t.unidad} y ya lleva ${ya}. Le quedan ${d} días y cada día hará lo mismo. ${cuantasUnidades(t)} debe terminar cada día?`,
    enunciadoFacil: `Hay que ${t.accion} ${ya + r * d} ${t.unidad}. Ya llevan ${ya}. Quedan ${d} días. Cada día hacen lo mismo. ${cuantasUnidades(t)} terminan cada día?`,
    respuesta: { tipo: "numero", valor: r },
    pista: "Calcula lo que queda por hacer y repártelo entre los días.",
    explicacion: `Quedan ${r * d} por hacer. Entre ${d} días son ${r} cada día.`,
    plantilla: `${SUB_TIEMPO}:ritmo:${t.id}`,
  });
});

const diasDeMargen = deTrabajo((rng, dificultad, t) => {
  const tiempos = t.tareas.map(() => entero(rng, 1, 4));
  const total = suma(tiempos);
  const margen = entero(rng, 1, 6);
  const plazo = total + margen;
  return pregunta(rng, {
    subhabilidad: SUB_TIEMPO,
    dificultad,
    enunciado: `Para terminar ${t.nombre} hay ${plazo} días. Las tareas se hacen una detrás de otra. ¿Cuántos días sobrarán al final?`,
    enunciadoFacil: `Hay ${plazo} días para ${t.nombre}. Las tareas van una después de otra. ¿Cuántos días sobran?`,
    imagen: tablaTareas(t, tiempos, "Días"),
    respuesta: { tipo: "numero", valor: margen },
    pista: "Suma los días de todas las tareas y resta del plazo.",
    explicacion: `Las tareas duran ${tiempos.join(" + ")} = ${total} días. ${plazo} − ${total} = ${margen}.`,
    plantilla: `${SUB_TIEMPO}:margen:${t.id}`,
  });
});

function hora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

const horaDeFin = deTrabajo((rng, dificultad, t) => {
  const tiempos = t.tareas.slice(0, 3).map(() => entero(rng, 2, 9) * 5);
  const inicio = entero(rng, 16, 21) * 30;
  const total = suma(tiempos);
  const fin = inicio + total;
  const olvido = fin - en(tiempos, 2);
  const correcta = hora(fin);
  const candidatos = [olvido, fin + 15, fin - 10, fin + 30].map(hora).filter((x) => x !== correcta);
  return pregunta(rng, {
    subhabilidad: SUB_TIEMPO,
    dificultad,
    enunciado: `Un grupo empieza a las ${hora(inicio)} y hace estas tareas una detrás de otra, sin descansos. ¿A qué hora termina?`,
    enunciadoFacil: `Un grupo empieza a las ${hora(inicio)}. Hace estas tareas sin parar. ¿A qué hora termina?`,
    imagen: tablaTareas(t, tiempos, "Minutos"),
    respuesta: { tipo: "opcion", correcta, distractores: [...new Set(candidatos)].slice(0, 3) },
    pista: "Suma los minutos. Recuerda que 60 minutos forman una hora.",
    explicacion: `Las tareas duran ${total} minutos. Desde las ${hora(inicio)}, eso lleva hasta las ${correcta}.`,
    plantilla: `${SUB_TIEMPO}:fin:${t.id}`,
  });
});

const trabajoEnParalelo = deTrabajo((rng, dificultad, t) => {
  const [p, q] = nombres(rng, 2) as [string, string];
  const [a, b] = reintentar(() => {
    const x = entero(rng, 3, 10) * 5;
    const y = entero(rng, 3, 10) * 5;
    return x === y ? null : ([x, y] as const);
  });
  const c = entero(rng, 2, 6) * 5;
  const [t1, t2, t3] = t.paralelas;
  return pregunta(rng, {
    subhabilidad: SUB_TIEMPO,
    dificultad,
    enunciado: `A la vez, ${p} hace «${t1}» en ${a} minutos y ${q} hace «${t2}» en ${b} minutos. Cuando los dos terminan, hacen juntos «${t3}» en ${c} minutos. ¿Cuántos minutos pasan desde el principio hasta el final?`,
    enunciadoFacil: `${p} hace «${t1}»: ${a} minutos. A la vez, ${q} hace «${t2}»: ${b} minutos. Al acabar los dos, hacen «${t3}»: ${c} minutos. ¿Cuántos minutos pasan en total?`,
    respuesta: { tipo: "numero", valor: Math.max(a, b) + c },
    pista: "Lo que se hace a la vez no se suma: hay que esperar a la tarea más larga.",
    explicacion: `Las dos primeras tareas van a la vez y duran lo que la más larga: ${Math.max(a, b)} minutos. Después, ${Math.max(a, b)} + ${c} = ${Math.max(a, b) + c}.`,
    plantilla: `${SUB_TIEMPO}:paralelo:${t.id}`,
  });
});

const horaDeInicio = deTrabajo((rng, dificultad, t) => {
  const tiempos = t.tareas.map(() => entero(rng, 2, 8) * 5);
  const fin = entero(rng, 22, 26) * 30;
  const total = suma(tiempos);
  const inicio = fin - total;
  const correcta = hora(inicio);
  const candidatos = [inicio + en(tiempos, 3), inicio + 15, inicio - 10, inicio + 30].map(hora).filter((x) => x !== correcta);
  return pregunta(rng, {
    subhabilidad: SUB_TIEMPO,
    dificultad,
    enunciado: `Un grupo debe terminar a las ${hora(fin)} y hace estas tareas una detrás de otra, sin descansos. ¿A qué hora debe empezar, como muy tarde?`,
    enunciadoFacil: `Un grupo debe acabar a las ${hora(fin)}. Hace estas tareas sin parar. ¿A qué hora empieza, como muy tarde?`,
    imagen: tablaTareas(t, tiempos, "Minutos"),
    respuesta: { tipo: "opcion", correcta, distractores: [...new Set(candidatos)].slice(0, 3) },
    pista: "Suma todos los minutos y cuenta hacia atrás desde la hora de terminar.",
    explicacion: `Las tareas duran ${total} minutos. Contando hacia atrás desde las ${hora(fin)} se llega a las ${correcta}.`,
    plantilla: `${SUB_TIEMPO}:inicio:${t.id}`,
  });
});

const recuperarRetraso = deTrabajo((rng, dificultad, t) => {
  const r = entero(rng, 3, 8);
  const pasados = entero(rng, 2, 4);
  const nuevo = r + entero(rng, 1, 5);
  const quedan = entero(rng, 2, 5);
  const total = r * pasados + nuevo * quedan;
  return pregunta(rng, {
    subhabilidad: SUB_TIEMPO,
    dificultad,
    enunciado: `Un grupo debe ${t.accion} ${total} ${t.unidad}. Durante ${pasados} días ha terminado ${r} cada día. Ahora solo quedan ${quedan} días. ${cuantasUnidades(t)} debe terminar cada uno de esos días, siempre la misma cantidad?`,
    enunciadoFacil: `Hay que ${t.accion} ${total} ${t.unidad}. Durante ${pasados} días hicieron ${r} cada día. Quedan ${quedan} días. Cada día harán lo mismo. ${cuantasUnidades(t)} harán cada día?`,
    respuesta: { tipo: "numero", valor: nuevo },
    pista: "Calcula lo ya hecho, lo que queda y repártelo entre los días que faltan.",
    explicacion: `Ya llevan ${pasados} × ${r} = ${r * pasados}. Quedan ${total - r * pasados}, y entre ${quedan} días son ${nuevo} cada día.`,
    plantilla: `${SUB_TIEMPO}:retraso:${t.id}`,
  });
});

export const GENERADOR_PASOS = porDificultad({
  1: [pasoExtremo("primero"), pasoExtremo("ultimo")],
  2: [pasoSiguiente, pasoAnterior],
  3: [ordenCorrecto, pasosCambiados],
});
export const GENERADOR_RECURSOS = porDificultad({ 1: [totalMaterial, materialQueFalta], 2: [paquetesNecesarios, cualNoAlcanza], 3: [costePaquetes, materialLimita] });
export const GENERADOR_TIEMPO = porDificultad({ 1: [totalMinutos, diasDeTrabajo], 2: [ritmoNecesario, diasDeMargen, horaDeFin], 3: [trabajoEnParalelo, horaDeInicio, recuperarRetraso] });

