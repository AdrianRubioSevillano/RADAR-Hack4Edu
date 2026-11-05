// PEN3-T4-a · Horario. Las horas salen de un horario construido en código.
import type { Rng } from "../../../core/rng.ts";
import { barajar, elegir, entero, muestra, nombre } from "../../ayuda.ts";
import type { Generador, Imagen } from "../../tipos.ts";
import { buscar, en, generadorDePlantillas, hora, minutos, type Contenido, type Plantilla } from "./comun.ts";

const ACTIVIDADES = ["Lectura", "Números", "Dibujo", "Música", "Huerto", "Deporte", "Ciencias", "Escritura"] as const;

interface Bloque {
  readonly nombre: string;
  readonly inicio: number;
  readonly fin: number;
}

// Horario seguido con duraciones distintas. Con `huecos` deja un rato libre tras la primera actividad.
function crearHorario(rng: Rng, n: number, huecos: boolean): Bloque[] {
  const nombres = muestra(rng, ACTIVIDADES, n);
  const duraciones = barajar(rng, [30, 45, 60, 40, 50, 35]).slice(0, n);
  let t = elegir(rng, [480, 495, 510, 525, 540]);
  return nombres.map((nombreA, i) => {
    const inicio = t;
    const fin = inicio + en(duraciones, i);
    t = fin + (huecos && i === 0 ? elegir(rng, [15, 20, 25, 30]) : 0);
    return { nombre: nombreA, inicio, fin };
  });
}

function imagenDe(h: readonly Bloque[]): Imagen {
  return { tipo: "tabla", titulo: "Horario de la mañana", cabeceras: ["Empieza", "Termina", "Actividad"], filas: h.map((b) => [hora(b.inicio), hora(b.fin), b.nombre]) };
}


function aQueHora(rng: Rng): Contenido {
  const h = crearHorario(rng, 4, false);
  const i = entero(rng, 0, 3);
  const b = en(h, i);
  const otras = [...new Set(h.flatMap((x) => [x.inicio, x.fin]))].filter((t) => t !== b.inicio);
  return {
    enunciado: `Mira el horario. ¿A qué hora empieza ${b.nombre}?`,
    enunciadoFacil: `Mira el horario. ¿Cuándo empieza ${b.nombre}?`,
    imagen: imagenDe(h),
    respuesta: { tipo: "opcion", correcta: `A las ${hora(b.inicio)}`, distractores: [`A las ${hora(b.fin)}`, ...muestra(rng, otras.filter((t) => t !== b.fin), 2).map((t) => `A las ${hora(t)}`)] },
    pista: `Busca la fila de ${b.nombre} y mira la columna «Empieza».`,
    explicacion: `En la fila de ${b.nombre}, la columna «Empieza» dice ${hora(b.inicio)}.`,
  };
}

function aQueHoraTermina(rng: Rng): Contenido {
  const h = crearHorario(rng, 4, false);
  const b = en(h, entero(rng, 0, 3));
  const otras = [...new Set(h.flatMap((x) => [x.inicio, x.fin]))].filter((t) => t !== b.fin && t !== b.inicio);
  return {
    enunciado: `Mira el horario. ¿A qué hora termina ${b.nombre}?`,
    enunciadoFacil: `Mira el horario. ¿Cuándo termina ${b.nombre}?`,
    imagen: imagenDe(h),
    respuesta: { tipo: "opcion", correcta: `A las ${hora(b.fin)}`, distractores: [`A las ${hora(b.inicio)}`, ...muestra(rng, otras, 2).map((t) => `A las ${hora(t)}`)] },
    pista: `Busca la fila de ${b.nombre} y mira la columna «Termina».`,
    explicacion: `En la fila de ${b.nombre}, la columna «Termina» dice ${hora(b.fin)}.`,
  };
}

function queHay(rng: Rng): Contenido {
  const h = crearHorario(rng, 4, false);
  const b = en(h, entero(rng, 0, 3));
  return {
    enunciado: `Mira el horario. ¿Qué actividad empieza a las ${hora(b.inicio)}?`,
    enunciadoFacil: `Mira el horario. ¿Qué empieza a las ${hora(b.inicio)}?`,
    imagen: imagenDe(h),
    respuesta: { tipo: "opcion", correcta: b.nombre, distractores: h.filter((x) => x !== b).map((x) => x.nombre) },
    pista: `Busca ${hora(b.inicio)} en la columna «Empieza».`,
    explicacion: `La fila que empieza a las ${hora(b.inicio)} es la de ${b.nombre}.`,
  };
}

function despuesDe(rng: Rng): Contenido {
  const h = crearHorario(rng, 4, false);
  const i = entero(rng, 0, 2);
  const a = en(h, i);
  const b = en(h, i + 1);
  return {
    enunciado: `Mira el horario. ¿Qué actividad va justo después de ${a.nombre}?`,
    enunciadoFacil: `Mira el horario. ¿Qué va justo después de ${a.nombre}?`,
    imagen: imagenDe(h),
    respuesta: { tipo: "opcion", correcta: b.nombre, distractores: h.filter((x) => x !== a && x !== b).map((x) => x.nombre) },
    pista: `Busca ${a.nombre} y mira la fila de abajo.`,
    explicacion: `${a.nombre} termina a las ${hora(a.fin)} y a esa hora empieza ${b.nombre}.`,
  };
}

function cuantoDura(rng: Rng): Contenido {
  const h = crearHorario(rng, 4, false);
  const b = en(h, entero(rng, 0, 3));
  return {
    enunciado: `Mira el horario. ¿Cuántos minutos dura ${b.nombre}?`,
    enunciadoFacil: `Mira el horario. ¿Cuántos minutos dura ${b.nombre}?`,
    imagen: imagenDe(h),
    respuesta: { tipo: "numero", valor: b.fin - b.inicio },
    pista: "Cuenta los minutos desde que empieza hasta que termina.",
    explicacion: `Va de las ${hora(b.inicio)} a las ${hora(b.fin)}: son ${minutos(b.fin - b.inicio)}.`,
  };
}

function queHayEnMedio(rng: Rng): Contenido {
  const h = crearHorario(rng, 4, false);
  const b = en(h, entero(rng, 0, 3));
  const t = b.inicio + 5 * entero(rng, 1, (b.fin - b.inicio) / 5 - 1);
  return {
    enunciado: `Mira el horario. ¿Qué actividad se está haciendo a las ${hora(t)}?`,
    enunciadoFacil: `Mira el horario. Son las ${hora(t)}. ¿Qué actividad hay?`,
    imagen: imagenDe(h),
    respuesta: { tipo: "opcion", correcta: b.nombre, distractores: h.filter((x) => x !== b).map((x) => x.nombre) },
    pista: "Busca la fila en la que esa hora queda entre «Empieza» y «Termina».",
    explicacion: `${b.nombre} va de las ${hora(b.inicio)} a las ${hora(b.fin)}, y las ${hora(t)} quedan en medio.`,
  };
}

function laMasLarga(rng: Rng): Contenido {
  const h = crearHorario(rng, 4, false);
  const duracion = (b: Bloque): number => b.fin - b.inicio;
  const larga = rng() < 0.5;
  const objetivo = (larga ? Math.max : Math.min)(...h.map(duracion));
  const b = h.find((x) => duracion(x) === objetivo) ?? en(h, 0);
  return {
    enunciado: `Mira el horario. ¿Qué actividad dura ${larga ? "más" : "menos"} tiempo?`,
    enunciadoFacil: `Mira el horario. ¿Qué actividad dura ${larga ? "más" : "menos"}?`,
    imagen: imagenDe(h),
    respuesta: { tipo: "opcion", correcta: b.nombre, distractores: h.filter((x) => x !== b).map((x) => x.nombre) },
    pista: "Calcula los minutos de cada actividad y compáralos.",
    explicacion: `${b.nombre} dura ${minutos(objetivo)}. Las otras duran ${larga ? "menos" : "más"}.`,
  };
}

function juntos(rng: Rng): Contenido {
  const h = crearHorario(rng, 4, false);
  const i = entero(rng, 0, 2);
  const a = en(h, i);
  const b = en(h, i + 1);
  const total = b.fin - a.inicio;
  return {
    enunciado: `Mira el horario. ¿Cuántos minutos duran en total ${a.nombre} y ${b.nombre}?`,
    enunciadoFacil: `Mira el horario. Suma ${a.nombre} y ${b.nombre}. ¿Cuántos minutos son?`,
    imagen: imagenDe(h),
    respuesta: { tipo: "numero", valor: total },
    pista: "Calcula los minutos de cada actividad y súmalos.",
    explicacion: `${a.nombre} dura ${minutos(a.fin - a.inicio)} y ${b.nombre} dura ${minutos(b.fin - b.inicio)}. En total son ${minutos(total)}.`,
  };
}

function hueco(rng: Rng): Contenido {
  const h = crearHorario(rng, 3, true);
  const a = en(h, 0);
  const b = en(h, 1);
  const libre = b.inicio - a.fin;
  return {
    enunciado: `Mira el horario. Entre ${a.nombre} y ${b.nombre} hay recreo. ¿Cuántos minutos dura el recreo?`,
    enunciadoFacil: `Mira el horario. Hay recreo entre ${a.nombre} y ${b.nombre}. ¿Cuántos minutos dura?`,
    imagen: imagenDe(h),
    respuesta: { tipo: "numero", valor: libre },
    pista: `Mira cuándo termina ${a.nombre} y cuándo empieza ${b.nombre}.`,
    explicacion: `${a.nombre} termina a las ${hora(a.fin)} y ${b.nombre} empieza a las ${hora(b.inicio)}. Hay ${minutos(libre)}.`,
  };
}

function salirDeCasa(rng: Rng): Contenido {
  const h = crearHorario(rng, 4, false);
  const quien = nombre(rng);
  const b = en(h, 0);
  const camino = elegir(rng, [15, 20, 25, 30, 35]);
  const correcta = b.inicio - camino;
  return {
    enunciado: `Mira el horario. ${quien} tarda ${minutos(camino)} en llegar a la escuela y quiere llegar justo cuando empieza ${b.nombre}. ¿A qué hora debe salir de casa?`,
    enunciadoFacil: `Mira el horario. ${quien} tarda ${minutos(camino)} en llegar. Quiere llegar justo al empezar ${b.nombre}. ¿A qué hora sale?`,
    imagen: imagenDe(h),
    respuesta: { tipo: "opcion", correcta: `A las ${hora(correcta)}`, distractores: [`A las ${hora(b.inicio)}`, `A las ${hora(b.inicio + camino)}`, `A las ${hora(correcta - 10)}`] },
    pista: "Parte de la hora de empezar y cuenta hacia atrás.",
    explicacion: `${b.nombre} empieza a las ${hora(b.inicio)}. Si restas ${minutos(camino)}, salen las ${hora(correcta)}.`,
  };
}

function cabeEnHueco(rng: Rng): Contenido {
  return buscar(() => {
    const nombres = muestra(rng, ACTIVIDADES, 4);
    const inicio = elegir(rng, [480, 510, 540]);
    const d = barajar(rng, [30, 45, 60]);
    const [h1, h2] = muestra(rng, [10, 15, 20, 25, 30, 40], 2) as [number, number];
    const a: Bloque = { nombre: en(nombres, 0), inicio, fin: inicio + en(d, 0) };
    const b: Bloque = { nombre: en(nombres, 1), inicio: a.fin + h1, fin: a.fin + h1 + en(d, 1) };
    const c: Bloque = { nombre: en(nombres, 2), inicio: b.fin + h2, fin: b.fin + h2 + en(d, 2) };
    const necesita = entero(rng, 3, 7) * 5;
    const cabe1 = h1 >= necesita;
    const cabe2 = h2 >= necesita;
    if (cabe1 === cabe2 || h1 === necesita || h2 === necesita) return null;
    const entre1 = `Entre ${a.nombre} y ${b.nombre}`;
    const entre2 = `Entre ${b.nombre} y ${c.nombre}`;
    return {
      enunciado: `Mira el horario. Hay dos ratos libres. Quieres hacer una tarea que dura ${minutos(necesita)}. ¿En qué rato libre cabe entera?`,
      enunciadoFacil: `Mira el horario. Hay dos ratos libres. Tu tarea dura ${minutos(necesita)}. ¿Dónde cabe entera?`,
      imagen: imagenDe([a, b, c]),
      respuesta: { tipo: "opcion", correcta: cabe1 ? entre1 : entre2, distractores: [cabe1 ? entre2 : entre1, "En ninguno de los dos"] },
      pista: "Calcula los minutos libres entre cada actividad y la siguiente.",
      explicacion: `El primer rato libre dura ${minutos(h1)} y el segundo dura ${minutos(h2)}. La tarea necesita ${minutos(necesita)}.`,
    };
  });
}

const PLANTILLAS_HORARIO: readonly Plantilla[] = [
  { clave: "empieza", dificultades: [1], crear: aQueHora },
  { clave: "termina", dificultades: [1], crear: aQueHoraTermina },
  { clave: "que-empieza", dificultades: [1], crear: queHay },
  { clave: "despues", dificultades: [1], crear: despuesDe },
  { clave: "dura", dificultades: [2], crear: cuantoDura },
  { clave: "en-medio", dificultades: [2], crear: queHayEnMedio },
  { clave: "mas-larga", dificultades: [2], crear: laMasLarga },
  { clave: "juntos", dificultades: [2], crear: juntos },
  { clave: "recreo", dificultades: [3], crear: hueco },
  { clave: "salir", dificultades: [3], crear: salirDeCasa },
  { clave: "hueco", dificultades: [3], crear: cabeEnHueco },
  { clave: "juntos-dificil", dificultades: [3], crear: juntosConHueco },
];

function juntosConHueco(rng: Rng): Contenido {
  const h = crearHorario(rng, 3, true);
  const a = en(h, 0);
  const b = en(h, 1);
  const total = a.fin - a.inicio + (b.fin - b.inicio);
  return {
    enunciado: `Mira el horario. Entre ${a.nombre} y ${b.nombre} hay un descanso. Sin contar el descanso, ¿cuántos minutos duran en total ${a.nombre} y ${b.nombre}?`,
    enunciadoFacil: `Mira el horario. Suma ${a.nombre} y ${b.nombre}. No cuentes el descanso. ¿Cuántos minutos son?`,
    imagen: imagenDe(h),
    respuesta: { tipo: "numero", valor: total },
    pista: "Calcula cada actividad por separado y después suma.",
    explicacion: `${a.nombre} dura ${minutos(a.fin - a.inicio)} y ${b.nombre} dura ${minutos(b.fin - b.inicio)}. En total son ${minutos(total)}.`,
  };
}

export const GENERADORES_HORARIO3: Readonly<Record<string, readonly Generador[]>> = {
  "PEN3-T4-a": [generadorDePlantillas("PEN3-T4-a", PLANTILLAS_HORARIO)],
};
