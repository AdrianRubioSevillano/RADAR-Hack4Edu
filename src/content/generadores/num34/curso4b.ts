// NUM 4.º, temas 4 y 5: tiempo y datos.
import type { Rng } from "../../../core/rng.ts";
import { barajar, elegir, entero, muestra, nombre } from "../../ayuda.ts";
import type { Dificultad, Imagen, MapaGeneradores, ObjetoId } from "../../tipos.ts";
import { en, gen, horasYMinutos, lasHoras, num, opc, par, pl, reloj, textos, trio } from "./comun.ts";

// ---------- T4-a Horas y minutos ----------
function horaDeReloj(h: number): number {
  return ((h - 1) % 12) + 1;
}

function minutoSegun(rng: Rng, d: Dificultad): number {
  if (d === 1) return elegir(rng, [0, 15, 30, 45]);
  if (d === 2) return 5 * entero(rng, 1, 11);
  return elegir(rng, [1, 2, 3, 4, 6, 7, 8, 9]) + 10 * entero(rng, 0, 5);
}

// Horas mal leídas: agujas cambiadas, hora siguiente o anterior, minutos al revés.
function horasErroneas(h: number, m: number): number[] {
  const correcta = h * 60 + m;
  const agujas = horaDeReloj(Math.max(1, Math.round(m / 5))) * 60 + (h % 12) * 5;
  const lista = [agujas, horaDeReloj(h + 1) * 60 + m, horaDeReloj(h + 11) * 60 + m, h * 60 + ((m + 30) % 60), h * 60 + (60 - m) % 60, horaDeReloj(h + 1) * 60 + ((m + 30) % 60)];
  return [...new Set(lista)].filter((x) => x !== correcta);
}

const leerReloj = gen("NUM4-T4-a", (rng, d) => {
  const h = entero(rng, 1, 12);
  const m = minutoSegun(rng, d);
  const imagen: Imagen = { tipo: "reloj", hora: h, minuto: m };
  const malas = barajar(rng, horasErroneas(h, m)).slice(0, 3).map(reloj);
  return {
    enunciado: "¿Qué hora marca el reloj?",
    enunciadoFacil: "Mira el reloj. ¿Qué hora es?",
    imagen,
    respuesta: textos(reloj(h * 60 + m), malas),
    pista: "La aguja corta marca la hora. La aguja larga marca los minutos.",
    explicacion: `La aguja corta indica la hora ${h} y la aguja larga, ${pl(m, "minuto", "minutos")}. Marca ${lasHoras(h * 60 + m)}.`,
  };
});

const tocarReloj = gen("NUM4-T4-a", (rng, d) => {
  const h = entero(rng, 1, 12);
  const m = d === 1 ? elegir(rng, [0, 30]) : minutoSegun(rng, d === 2 ? 2 : 3);
  const dibujo = (t: number) => {
    const hh = Math.floor(t / 60);
    return { texto: `Reloj que marca ${lasHoras(t)}`, imagen: { tipo: "reloj", hora: hh, minuto: t % 60 } as Imagen };
  };
  const malas = barajar(rng, horasErroneas(h, m)).slice(0, 3);
  const hora = lasHoras(h * 60 + m);
  return {
    enunciado: `Toca el reloj que marca ${hora}.`,
    enunciadoFacil: `Busca el reloj con ${hora}. Tócalo.`,
    respuesta: { tipo: "imagen", correcta: dibujo(h * 60 + m), distractores: malas.map(dibujo) },
    pista: "Mira primero la aguja corta y después la larga.",
    explicacion: `En ${hora}, la aguja corta señala la hora ${h} y la aguja larga marca ${pl(m, "minuto", "minutos")}.`,
  };
});

const convertirTiempo = gen("NUM4-T4-a", (rng, d) => {
  if (d === 1) {
    const h = entero(rng, 2, 6);
    return {
      enunciado: `¿Cuántos minutos son ${h} horas?`,
      enunciadoFacil: `Una hora tiene 60 minutos. ¿Cuántos minutos son ${h} horas?`,
      respuesta: opc(rng, h * 60, [h * 100, h * 10, h + 60, h * 30], 60),
      pista: "Recuerda cuántos minutos tiene una hora.",
      explicacion: `Una hora tiene 60 minutos: ${h} × 60 = ${h * 60} minutos.`,
    };
  }
  if (d === 2) {
    const h = entero(rng, 1, 3);
    const m = 5 * entero(rng, 1, 11);
    const r = h * 60 + m;
    return {
      enunciado: `¿Cuántos minutos son ${horasYMinutos(r)}?`,
      enunciadoFacil: `Pasa a minutos: ${horasYMinutos(r)}. ¿Cuántos minutos son?`,
      respuesta: num(r),
      pista: "Pasa las horas a minutos y suma los minutos que quedan.",
      explicacion: `${h} × 60 = ${h * 60}, y ${h * 60} + ${m} = ${r} minutos.`,
    };
  }
  const h = entero(rng, 1, 4);
  const m = 5 * entero(rng, 1, 11);
  const total = h * 60 + m;
  const decenas = Math.floor(total / 100);
  const resto = total % 100;
  const lectura = resto < 60 && decenas !== h ? `${pl(decenas, "hora", "horas")} y ${pl(resto, "minuto", "minutos")}` : `${pl(h + 1, "hora", "horas")} y ${pl(m, "minuto", "minutos")}`;
  return {
    enunciado: `¿Cuánto tiempo son ${total} minutos?`,
    enunciadoFacil: `Pasa ${total} minutos a horas y minutos.`,
    respuesta: textos(horasYMinutos(total), [...new Set([lectura, `${pl(h, "hora", "horas")} y ${pl((m + 10) % 60 === 0 ? 5 : (m + 10) % 60, "minuto", "minutos")}`, `${pl(h + 2, "hora", "horas")} y ${pl(m, "minuto", "minutos")}`])].filter((t) => t !== horasYMinutos(total))),
    pista: "Cada 60 minutos forman una hora. Una hora no tiene 100 minutos.",
    explicacion: `${h} × 60 = ${h * 60}, y ${total} − ${h * 60} = ${m}. Son ${horasYMinutos(total)}.`,
  };
});

// ---------- T4-b Duración ----------
const cuantoDura = gen("NUM4-T4-b", (rng, d) => {
  const actividad = elegir(rng, ["clase", "reunión", "visita al mercado", "carrera"]);
  const hora = 60 * entero(rng, 7, 10);
  if (d === 1) {
    const a = hora + 5 * entero(rng, 0, 6);
    const b = a + 5 * entero(rng, 3, 5);
    return {
      enunciado: `Una ${actividad} empieza a las ${reloj(a)} y termina a las ${reloj(b)}. ¿Cuántos minutos dura?`,
      enunciadoFacil: `Empieza a las ${reloj(a)}. Termina a las ${reloj(b)}. ¿Cuántos minutos dura?`,
      respuesta: num(b - a),
      pista: "Es la misma hora. Resta los minutos.",
      explicacion: `De ${a % 60} a ${b % 60} minutos hay ${b - a} minutos.`,
    };
  }
  if (d === 2) {
    const a = hora + 5 * entero(rng, 7, 11);
    const b = hora + 60 + 5 * entero(rng, 1, 5);
    const hasta = hora + 60 - a;
    return {
      enunciado: `Una ${actividad} empieza a las ${reloj(a)} y termina a las ${reloj(b)}. ¿Cuántos minutos dura?`,
      enunciadoFacil: `Empieza a las ${reloj(a)}. Termina a las ${reloj(b)}. ¿Cuántos minutos dura?`,
      respuesta: num(b - a),
      pista: "Cuenta primero hasta la hora en punto. Después suma lo que queda.",
      explicacion: `Hasta las ${reloj(hora + 60)} hay ${hasta} minutos, y después ${b - hora - 60} más: ${b - a} minutos.`,
    };
  }
  const a = hora + 5 * entero(rng, 7, 11);
  const duracion = 60 * entero(rng, 1, 2) + 5 * entero(rng, 1, 11);
  const b = a + duracion;
  const texto = horasYMinutos(duracion);
  const h = Math.floor(duracion / 60);
  const m = duracion % 60;
  const sinPasar = Math.floor(b / 60) - Math.floor(a / 60);
  const malas = [`${pl(sinPasar, "hora", "horas")} y ${pl((b % 60) >= (a % 60) ? (b % 60) - (a % 60) + 10 : (a % 60) - (b % 60), "minuto", "minutos")}`, `${pl(h + 1, "hora", "horas")} y ${pl(m, "minuto", "minutos")}`, `${pl(h, "hora", "horas")} y ${pl(m === 55 ? 50 : m + 5, "minuto", "minutos")}`, `${pl(h + 2, "hora", "horas")} y ${pl(m, "minuto", "minutos")}`];
  return {
    enunciado: `Una ${actividad} empieza a las ${reloj(a)} y termina a las ${reloj(b)}. ¿Cuánto dura?`,
    enunciadoFacil: `Empieza a las ${reloj(a)}. Termina a las ${reloj(b)}. ¿Cuánto dura?`,
    respuesta: textos(texto, [...new Set(malas)].filter((t) => t !== texto).slice(0, 3)),
    pista: "Avanza primero las horas enteras y después cuenta los minutos.",
    explicacion: `De ${reloj(a)} a ${reloj(b)} pasan ${duracion} minutos, que son ${texto}.`,
  };
});

function horasCercanas(t: number, duracion: number, sentido: 1 | -1): string[] {
  const m = duracion % 60;
  const malas = [t + 60, t - 60, t + 10 * sentido, t - 10 * sentido, t - sentido * 2 * m].filter((x) => x !== t && x > 0);
  return [...new Set(malas.map(reloj))].slice(0, 3);
}

const horaFinal = gen("NUM4-T4-b", (rng, d) => {
  const n = nombre(rng);
  const hora = 60 * entero(rng, 7, 9);
  const a = d === 1 ? hora + 5 * entero(rng, 0, 5) : hora + 5 * entero(rng, 7, 11);
  const duracion = d === 1 ? 5 * entero(rng, 2, 5) : d === 2 ? 5 * entero(rng, 5, 10) : 60 + 5 * entero(rng, 5, 11);
  const b = a + duracion;
  const texto = duracion >= 60 ? horasYMinutos(duracion) : pl(duracion, "minuto", "minutos");
  const imagen: Imagen = { tipo: "reloj", hora: Math.floor(a / 60), minuto: a % 60 };
  return {
    enunciado: `${n} sale de casa a la hora que marca el reloj, por la mañana, y tarda ${texto} en llegar a la escuela. ¿A qué hora llega?`,
    enunciadoFacil: `Mira el reloj. A esa hora sale ${n}. Tarda ${texto}. ¿A qué hora llega?`,
    imagen,
    respuesta: textos(reloj(b), horasCercanas(b, duracion, 1)),
    pista: "Suma el tiempo a los minutos. Si pasas de 60, sube una hora.",
    explicacion: `${reloj(a)} más ${texto} son las ${reloj(b)}.`,
  };
});

const horaInicio = gen("NUM4-T4-b", (rng, d) => {
  const n = nombre(rng);
  const hora = 60 * entero(rng, 8, 11);
  const b = d === 1 ? hora + 5 * entero(rng, 7, 11) : hora + 5 * entero(rng, 1, 5);
  const duracion = d === 1 ? 5 * entero(rng, 2, 6) : d === 2 ? 5 * entero(rng, 7, 10) : 60 + 5 * entero(rng, 7, 11);
  const a = b - duracion;
  const texto = duracion >= 60 ? horasYMinutos(duracion) : pl(duracion, "minuto", "minutos");
  return {
    enunciado: `${n} llega al mercado a las ${reloj(b)} después de caminar ${texto}. ¿A qué hora salió?`,
    enunciadoFacil: `${n} llega a las ${reloj(b)}. Camina ${texto}. ¿A qué hora salió?`,
    respuesta: textos(reloj(a), horasCercanas(a, duracion, -1)),
    pista: "Hay que ir hacia atrás: resta el tiempo.",
    explicacion: `${reloj(b)} menos ${texto} son las ${reloj(a)}.`,
  };
});

// ---------- T4-c Leer horarios ----------
const PARADAS = ["Mercado", "Escuela", "Plaza", "Puente", "Hospital", "Río", "Estación"] as const;

const horarioAutobus = gen("NUM4-T4-c", (rng, d) => {
  const n = nombre(rng);
  const paradas = muestra(rng, PARADAS, 4);
  const inicio = 6 * 60 + 5 * entero(rng, 6, 18);
  const saltos = [0, 5 * entero(rng, 2, 5), 5 * entero(rng, 2, 5), 5 * entero(rng, 2, 5)];
  const primero = saltos.reduce<number[]>((acc, s) => [...acc, (acc[acc.length - 1] ?? inicio) + s], []);
  const espera = 5 * entero(rng, 9, 15);
  const segundo = primero.map((t) => t + espera);
  const imagen: Imagen = { tipo: "tabla", titulo: "Horario del autobús", cabeceras: ["Parada", "Primer autobús", "Segundo autobús"], filas: paradas.map((p, i) => [p, reloj(en(primero, i)), reloj(en(segundo, i))]) };
  if (d === 1) {
    const i = entero(rng, 0, 3);
    const usaSegundo = rng() < 0.5;
    const correcta = reloj(en(usaSegundo ? segundo : primero, i));
    const todas = [...primero, ...segundo].map(reloj);
    return {
      enunciado: `Mira el horario. ¿A qué hora pasa el ${usaSegundo ? "segundo" : "primer"} autobús por la parada ${en(paradas, i)}?`,
      enunciadoFacil: `Lee el horario. Busca la parada ${en(paradas, i)}. ¿A qué hora pasa el ${usaSegundo ? "segundo" : "primer"} autobús?`,
      imagen,
      respuesta: textos(correcta, muestra(rng, [...new Set(todas)].filter((t) => t !== correcta), 3)),
      pista: "Busca la fila de la parada y la columna del autobús.",
      explicacion: `En la fila ${en(paradas, i)} y la columna del ${usaSegundo ? "segundo" : "primer"} autobús pone ${correcta}.`,
    };
  }
  if (d === 2) {
    const [x, y] = [...muestra(rng, [0, 1, 2, 3], 2)].sort((p, q) => p - q) as [number, number];
    const r = en(primero, y) - en(primero, x);
    return {
      enunciado: `Mira el horario. ¿Cuántos minutos tarda el primer autobús en ir de ${en(paradas, x)} a ${en(paradas, y)}?`,
      enunciadoFacil: `Lee el horario. Mira el primer autobús. Va de ${en(paradas, x)} a ${en(paradas, y)}. ¿Cuántos minutos tarda?`,
      imagen,
      respuesta: num(r),
      pista: "Busca las dos horas y calcula el tiempo que pasa entre ellas.",
      explicacion: `Sale a las ${reloj(en(primero, x))} y llega a las ${reloj(en(primero, y))}: son ${r} minutos.`,
    };
  }
  const i = entero(rng, 0, 3);
  const llega = en(primero, i) + 5 * entero(rng, 1, espera / 5 - 1);
  const r = en(segundo, i) - llega;
  return {
    enunciado: `Mira el horario. ${n} llega a la parada ${en(paradas, i)} a las ${reloj(llega)}. ¿Cuántos minutos espera hasta que pasa el siguiente autobús?`,
    enunciadoFacil: `Lee el horario. ${n} llega a la parada ${en(paradas, i)} a las ${reloj(llega)}. Espera el siguiente autobús. ¿Cuántos minutos espera?`,
    imagen,
    respuesta: num(r),
    pista: "Busca en esa fila la primera hora que viene después de la llegada.",
    explicacion: `El siguiente autobús pasa a las ${reloj(en(segundo, i))}. De ${reloj(llega)} a ${reloj(en(segundo, i))} hay ${r} minutos.`,
  };
});

const ACTIVIDADES = ["Lectura", "Números", "Descanso", "Dibujo", "Música", "Huerto", "Deporte"] as const;

const horarioEscuela = gen("NUM4-T4-c", (rng, d) => {
  const actividades = muestra(rng, ACTIVIDADES, 5);
  const duraciones = muestra(rng, [30, 35, 40, 45, 50, 55, 60], 5);
  const inicio = elegir(rng, [480, 495, 510]);
  const horas = duraciones.reduce<number[]>((acc, x) => [...acc, (acc[acc.length - 1] as number) + x], [inicio]);
  const imagen: Imagen = { tipo: "tabla", titulo: "Horario de la escuela", cabeceras: ["Hora", "Actividad"], filas: actividades.map((a, i) => [`${reloj(en(horas, i))} a ${reloj(en(horas, i + 1))}`, a]) };
  if (d === 1) {
    const i = entero(rng, 0, 4);
    const a = en(actividades, i);
    return {
      enunciado: `Mira el horario. ¿Qué actividad empieza a las ${reloj(en(horas, i))}?`,
      enunciadoFacil: `Lee el horario. ¿Qué empieza a las ${reloj(en(horas, i))}?`,
      imagen,
      respuesta: textos(a, muestra(rng, actividades.filter((x) => x !== a), 3)),
      pista: "Busca esa hora al principio de una fila.",
      explicacion: `La fila que empieza a las ${reloj(en(horas, i))} es la de ${a}.`,
    };
  }
  if (d === 2) {
    const i = entero(rng, 0, 4);
    return {
      enunciado: `Mira el horario. ¿Cuántos minutos dura ${en(actividades, i)}?`,
      enunciadoFacil: `Lee el horario. Busca ${en(actividades, i)}. ¿Cuántos minutos dura?`,
      imagen,
      respuesta: num(en(duraciones, i)),
      pista: "Calcula el tiempo entre la hora de inicio y la hora de fin.",
      explicacion: `Va de ${reloj(en(horas, i))} a ${reloj(en(horas, i + 1))}: son ${en(duraciones, i)} minutos.`,
    };
  }
  const mayor = Math.max(...duraciones);
  const i = duraciones.indexOf(mayor);
  const a = en(actividades, i);
  return {
    enunciado: "Mira el horario. ¿Qué actividad dura más tiempo?",
    enunciadoFacil: "Lee el horario. ¿Qué dura más?",
    imagen,
    respuesta: textos(a, muestra(rng, actividades.filter((x) => x !== a), 3)),
    pista: "Calcula los minutos de cada fila.",
    explicacion: `${a} dura ${mayor} minutos, más que las demás.`,
  };
});

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] as const;

const horarioCartel = gen("NUM4-T4-c", (rng, d) => {
  const lugar = elegir(rng, [["el mercado", "del mercado"], ["la biblioteca", "de la biblioteca"], ["la tienda", "de la tienda"]] as const);
  const dias = DIAS.slice(entero(rng, 0, 1)).slice(0, 4);
  const duraciones = muestra(rng, [3, 4, 5, 6, 7], 4);
  const aperturas = dias.map(() => entero(rng, 7, 10));
  const lineas = dias.map((dia, i) => `${dia}: de ${en(aperturas, i)}:00 a ${en(aperturas, i) + en(duraciones, i)}:00`);
  const imagen: Imagen = { tipo: "cartel", estilo: "horario", titulo: `Horario ${lugar[1]}`, lineas };
  const i = entero(rng, 0, 3);
  const dia = en(dias, i).toLowerCase();
  if (d === 1) {
    const abre = en(aperturas, i);
    const correcta = `${abre}:00`;
    return {
      enunciado: `Mira el cartel. ¿A qué hora abre ${lugar[0]} el ${dia}?`,
      enunciadoFacil: `Lee el cartel. Busca el ${dia}. ¿A qué hora abre?`,
      imagen,
      respuesta: textos(correcta, [`${abre + en(duraciones, i)}:00`, `${abre + 1 + en(duraciones, i)}:00`, `${abre === 7 ? 6 : abre - 1}:00`]),
      pista: "La primera hora de la línea es la de abrir.",
      explicacion: `El ${dia} pone: de ${abre}:00 a ${abre + en(duraciones, i)}:00. Abre a las ${correcta}.`,
    };
  }
  if (d === 2) {
    const r = en(duraciones, i);
    return {
      enunciado: `Mira el cartel. ¿Cuántas horas abre ${lugar[0]} el ${dia}?`,
      enunciadoFacil: `Lee el cartel. Busca el ${dia}. ¿Cuántas horas abre?`,
      imagen,
      respuesta: num(r),
      pista: "Resta la hora de abrir a la hora de cerrar.",
      explicacion: `De ${en(aperturas, i)}:00 a ${en(aperturas, i) + r}:00 hay ${r} horas.`,
    };
  }
  const mayor = Math.max(...duraciones);
  const correcta = en(dias, duraciones.indexOf(mayor));
  return {
    enunciado: `Mira el cartel. ¿Qué día abre ${lugar[0]} más horas?`,
    enunciadoFacil: "Lee el cartel. ¿Qué día abre más horas?",
    imagen,
    respuesta: textos(correcta, dias.filter((x) => x !== correcta)),
    pista: "Calcula las horas de cada día.",
    explicacion: `El ${correcta.toLowerCase()} abre ${mayor} horas, más que los otros días.`,
  };
});

// ---------- T5-a Leer una tabla ----------
interface TablaDoble {
  readonly titulo: string;
  readonly cabecera: string;
  readonly filas: readonly string[];
  readonly columnas: readonly string[];
  readonly celda: (f: string, c: string) => string;
  readonly totalFila: (f: string) => string;
  readonly mejorColumna: string;
}

const TABLAS: readonly TablaDoble[] = [
  {
    titulo: "Frutas vendidas en el mercado", cabecera: "Fruta", filas: ["Manzanas", "Peras", "Naranjas"], columnas: ["Lunes", "Martes", "Miércoles"],
    celda: (f, c) => `¿Cuántas ${f.toLowerCase()} se vendieron el ${c.toLowerCase()}?`,
    totalFila: (f) => `¿Cuántas ${f.toLowerCase()} se vendieron en los tres días?`,
    mejorColumna: "¿Qué día se vendieron más frutas en total?",
  },
  {
    titulo: "Cómo llegan a la escuela", cabecera: "Forma", filas: ["A pie", "En autobús", "En bicicleta"], columnas: ["Clase A", "Clase B", "Clase C"],
    celda: (f, c) => `¿Cuántos alumnos de la clase ${c.slice(-1)} llegan ${f.toLowerCase()}?`,
    totalFila: (f) => `¿Cuántos alumnos llegan ${f.toLowerCase()} entre las tres clases?`,
    mejorColumna: "¿Qué clase tiene más alumnos en total?",
  },
  {
    titulo: "Libros prestados en la biblioteca", cabecera: "Tipo", filas: ["Cuentos", "Poesía", "Ciencias"], columnas: ["Enero", "Febrero", "Marzo"],
    celda: (f, c) => `¿Cuántos libros de ${f.toLowerCase()} se prestaron en ${c.toLowerCase()}?`,
    totalFila: (f) => `¿Cuántos libros de ${f.toLowerCase()} se prestaron en los tres meses?`,
    mejorColumna: "¿Qué mes se prestaron más libros en total?",
  },
];

const tablaDoble = gen("NUM4-T5-a", (rng, d) => {
  const t = elegir(rng, TABLAS);
  const datos = t.filas.map(() => t.columnas.map(() => entero(rng, d === 1 ? 5 : 12, d === 1 ? 30 : 48)));
  const sumaColumna = (j: number) => datos.reduce((s, fila) => s + en(fila, j), 0);
  if (d === 3) {
    const ganadora = entero(rng, 0, 2);
    const fila = en(datos, 0);
    const maxOtras = Math.max(...[0, 1, 2].filter((j) => j !== ganadora).map(sumaColumna));
    if (sumaColumna(ganadora) <= maxOtras) fila[ganadora] = en(fila, ganadora) + maxOtras - sumaColumna(ganadora) + entero(rng, 2, 6);
  }
  const imagen: Imagen = { tipo: "tabla", titulo: t.titulo, cabeceras: [t.cabecera, ...t.columnas], filas: t.filas.map((f, i) => [f, ...en(datos, i).map(String)]) };
  const i = entero(rng, 0, 2);
  const j = entero(rng, 0, 2);
  const f = en(t.filas, i);
  const c = en(t.columnas, j);
  if (d === 1) {
    const r = en(en(datos, i), j);
    return {
      enunciado: `Mira la tabla. ${t.celda(f, c)}`,
      enunciadoFacil: `Lee la tabla. ${t.celda(f, c)}`,
      imagen,
      respuesta: num(r),
      pista: "Busca la fila y la columna. El dato está donde se cruzan.",
      explicacion: `Donde se cruzan ${f} y ${c} pone ${r}.`,
    };
  }
  if (d === 2) {
    const fila = en(datos, i);
    const r = fila.reduce((x, y) => x + y, 0);
    return {
      enunciado: `Mira la tabla. ${t.totalFila(f)}`,
      enunciadoFacil: `Lee la tabla. ${t.totalFila(f)}`,
      imagen,
      respuesta: num(r),
      pista: "Suma los tres números de esa fila.",
      explicacion: `${fila.join(" + ")} = ${r}.`,
    };
  }
  const sumas = [0, 1, 2].map(sumaColumna);
  const mayor = Math.max(...sumas);
  const correcta = en(t.columnas, sumas.indexOf(mayor));
  return {
    enunciado: `Mira la tabla. ${t.mejorColumna}`,
    enunciadoFacil: `Lee la tabla. Suma cada columna. ${t.mejorColumna}`,
    imagen,
    respuesta: textos(correcta, t.columnas.filter((x) => x !== correcta)),
    pista: "Suma los números de cada columna y compara.",
    explicacion: `Los totales son ${sumas.join(", ")}. El mayor es ${mayor}, de ${correcta}.`,
  };
});

const tablaSimple = gen("NUM4-T5-a", (rng, d) => {
  const clases = ["Clase A", "Clase B", "Clase C", "Clase D"];
  const valores = muestra(rng, Array.from({ length: 26 }, (_, i) => i + 15), 4);
  const imagen: Imagen = { tipo: "tabla", titulo: "Alumnos de cada clase", cabeceras: ["Clase", "Alumnos"], filas: clases.map((c, i) => [c, String(en(valores, i))]) };
  const mayor = Math.max(...valores);
  const menor = Math.min(...valores);
  if (d === 1) {
    const correcta = en(clases, valores.indexOf(mayor));
    return {
      enunciado: "Mira la tabla. ¿Qué clase tiene más alumnos?",
      enunciadoFacil: "Lee la tabla. ¿Qué clase tiene más alumnos?",
      imagen,
      respuesta: textos(correcta, clases.filter((c) => c !== correcta)),
      pista: "Busca el número mayor.",
      explicacion: `${correcta} tiene ${mayor} alumnos, el número mayor de la tabla.`,
    };
  }
  if (d === 2) {
    const r = valores.reduce((x, y) => x + y, 0);
    return {
      enunciado: "Mira la tabla. ¿Cuántos alumnos hay entre todas las clases?",
      enunciadoFacil: "Lee la tabla. Suma todas las clases. ¿Cuántos alumnos hay?",
      imagen,
      respuesta: num(r),
      pista: "Suma los cuatro números.",
      explicacion: `${valores.join(" + ")} = ${r}.`,
    };
  }
  return {
    enunciado: "Mira la tabla. ¿Cuántos alumnos más tiene la clase con más alumnos que la clase con menos alumnos?",
    enunciadoFacil: "Lee la tabla. Busca la clase con más alumnos. Busca la clase con menos. ¿Cuántos alumnos de diferencia hay?",
    imagen,
    respuesta: num(mayor - menor),
    pista: "Busca el número mayor y el menor. Después resta.",
    explicacion: `${mayor} − ${menor} = ${mayor - menor}.`,
  };
});

// ---------- T5-b Gráfico de barras ----------
interface Grafico {
  readonly titulo: string;
  readonly etiquetas: readonly string[];
  readonly dato: (e: string) => string;
  readonly diferencia: (a: string, b: string) => string;
  readonly total: string;
  readonly mas: string;
  readonly menos: string;
  readonly juntos: string; // nombre de los datos: "libros"
}

const GRAFICOS: readonly Grafico[] = [
  {
    titulo: "Libros leídos por cada clase", etiquetas: ["Clase A", "Clase B", "Clase C", "Clase D"],
    dato: (e) => `¿Cuántos libros leyó la clase ${e.slice(-1)}?`, diferencia: (a, b) => `¿Cuántos libros más leyó la clase ${a.slice(-1)} que la clase ${b.slice(-1)}?`,
    total: "¿Cuántos libros leyeron entre todas las clases?", mas: "¿Qué clase leyó más libros?", menos: "¿Qué clase leyó menos libros?", juntos: "libros",
  },
  {
    titulo: "Frutas vendidas en una semana", etiquetas: ["Manzanas", "Peras", "Naranjas", "Uvas"],
    dato: (e) => `¿Cuántas ${e.toLowerCase()} se vendieron?`, diferencia: (a, b) => `¿Cuántas ${a.toLowerCase()} más que ${b.toLowerCase()} se vendieron?`,
    total: "¿Cuántas frutas se vendieron en total?", mas: "¿Qué fruta se vendió más?", menos: "¿Qué fruta se vendió menos?", juntos: "frutas",
  },
  {
    titulo: "Litros de agua sacados del pozo", etiquetas: ["Lunes", "Martes", "Miércoles", "Jueves"],
    dato: (e) => `¿Cuántos litros se sacaron el ${e.toLowerCase()}?`, diferencia: (a, b) => `¿Cuántos litros más se sacaron el ${a.toLowerCase()} que el ${b.toLowerCase()}?`,
    total: "¿Cuántos litros se sacaron en total?", mas: "¿Qué día se sacaron más litros?", menos: "¿Qué día se sacaron menos litros?", juntos: "litros",
  },
];

function datosBarras(rng: Rng): number[] {
  return muestra(rng, [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60], 4);
}

const leerBarras = gen("NUM4-T5-b", (rng, d) => {
  const g = elegir(rng, GRAFICOS);
  const valores = datosBarras(rng);
  const imagen: Imagen = { tipo: "barras", titulo: g.titulo, etiquetas: g.etiquetas, valores };
  if (d === 1) {
    const i = entero(rng, 0, 3);
    return {
      enunciado: `Mira el gráfico. ${g.dato(en(g.etiquetas, i))}`,
      enunciadoFacil: `Lee el gráfico. ${g.dato(en(g.etiquetas, i))}`,
      imagen,
      respuesta: num(en(valores, i)),
      pista: "Busca la barra y mira hasta qué número llega.",
      explicacion: `La barra de ${en(g.etiquetas, i)} llega hasta ${en(valores, i)}.`,
    };
  }
  if (d === 2) {
    const [i, j] = par(rng, [0, 1, 2, 3]);
    const [x, y] = en(valores, i) > en(valores, j) ? [i, j] : [j, i];
    const r = en(valores, x) - en(valores, y);
    const texto = g.diferencia(en(g.etiquetas, x), en(g.etiquetas, y));
    return {
      enunciado: `Mira el gráfico. ${texto}`,
      enunciadoFacil: `Lee el gráfico. Mira dos barras. ${texto}`,
      imagen,
      respuesta: num(r),
      pista: "Lee las dos barras y resta.",
      explicacion: `${en(valores, x)} − ${en(valores, y)} = ${r}.`,
    };
  }
  const r = valores.reduce((a, b) => a + b, 0);
  return {
    enunciado: `Mira el gráfico. ${g.total}`,
    enunciadoFacil: `Lee el gráfico. Suma todas las barras. ${g.total}`,
    imagen,
    respuesta: num(r),
    pista: "Lee las cuatro barras y súmalas.",
    explicacion: `${valores.join(" + ")} = ${r}.`,
  };
});

const compararBarras = gen("NUM4-T5-b", (rng, d) => {
  const g = elegir(rng, GRAFICOS);
  const valores = datosBarras(rng);
  const imagen: Imagen = { tipo: "barras", titulo: g.titulo, etiquetas: g.etiquetas, valores };
  if (d === 3) {
    const [i, j] = par(rng, [0, 1, 2, 3]);
    const objetivo = en(valores, i) + en(valores, j);
    const pares: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
    const nombrePar = ([a, b]: [number, number]) => `${en(g.etiquetas, a)} y ${en(g.etiquetas, b)}`;
    const suma = ([a, b]: [number, number]) => en(valores, a) + en(valores, b);
    const [p, q] = [Math.min(i, j), Math.max(i, j)];
    const otros = pares.filter((x) => suma(x) !== objetivo);
    return {
      enunciado: `Mira el gráfico. ¿Qué dos barras suman ${objetivo} ${g.juntos}?`,
      enunciadoFacil: `Lee el gráfico. Dos barras suman ${objetivo} ${g.juntos}. ¿Cuáles son?`,
      imagen,
      respuesta: textos(nombrePar([p, q]), muestra(rng, otros, 3).map(nombrePar)),
      pista: "Prueba cada opción y suma sus dos barras.",
      explicacion: `${en(valores, p)} + ${en(valores, q)} = ${objetivo}.`,
    };
  }
  const mas = d === 1;
  const objetivo = mas ? Math.max(...valores) : Math.min(...valores);
  const correcta = en(g.etiquetas, valores.indexOf(objetivo));
  const texto = mas ? g.mas : g.menos;
  return {
    enunciado: `Mira el gráfico. ${texto}`,
    enunciadoFacil: `Lee el gráfico. ${texto}`,
    imagen,
    respuesta: textos(correcta, g.etiquetas.filter((e) => e !== correcta)),
    pista: mas ? "Busca la barra más alta." : "Busca la barra más baja.",
    explicacion: `La barra de ${correcta} llega a ${objetivo}, y es la ${mas ? "más alta" : "más baja"}.`,
  };
});

// ---------- T5-c Clasificar y contar ----------
const CATEGORIAS: readonly { readonly nombre: string; readonly f: boolean; readonly objetos: readonly (readonly [ObjetoId, string])[] }[] = [
  { nombre: "frutas", f: true, objetos: [["manzana", "Manzanas"], ["pera", "Peras"], ["naranja", "Naranjas"]] },
  { nombre: "animales", f: false, objetos: [["gato", "Gatos"], ["perro", "Perros"], ["pato", "Patos"], ["vaca", "Vacas"]] },
  { nombre: "vehículos", f: false, objetos: [["coche", "Coches"], ["bicicleta", "Bicicletas"], ["barco", "Barcos"], ["tren", "Trenes"]] },
];

const clasificarDibujos = gen("NUM4-T5-c", (rng, d) => {
  const [c1, c2, c3] = trio(rng, CATEGORIAS);
  const usadas = d === 1 ? [c1, c2] : [c1, c2, c3];
  const grupos = usadas.map((c) => muestra(rng, c.objetos, 2).map(([objeto, etiqueta]) => ({ objeto, etiqueta, cantidad: entero(rng, 2, d === 1 ? 5 : 7) })));
  const [g1, g2] = [en(grupos, 0), en(grupos, 1)];
  const total = (g: typeof g1) => g.reduce((s, x) => s + x.cantidad, 0);
  if (d === 3 && total(g1) === total(g2)) en(g1, 0).cantidad += 2;
  const imagen: Imagen = { tipo: "objetos", grupos: barajar(rng, grupos.flat()) };
  const cuantas = (c: typeof c1) => `${c.f ? "Cuántas" : "Cuántos"} ${c.nombre}`;
  if (d === 3) {
    const [mayor, menor, tm, tn] = total(g1) > total(g2) ? [c1, c2, total(g1), total(g2)] : [c2, c1, total(g2), total(g1)];
    const r = tm - tn;
    return {
      enunciado: `Clasifica los dibujos. ¿${cuantas(mayor)} más que ${menor.nombre} hay?`,
      enunciadoFacil: `Mira el dibujo. Cuenta ${mayor.nombre}. Cuenta ${menor.nombre}. ¿${cuantas(mayor)} más hay?`,
      imagen,
      respuesta: num(r),
      pista: "Cuenta cada clase por separado. Después resta.",
      explicacion: `Hay ${tm} ${mayor.nombre} y ${tn} ${menor.nombre}: ${tm} − ${tn} = ${r}.`,
    };
  }
  const r = total(g1);
  const lista = g1.map((x) => x.cantidad).join(" + ");
  return {
    enunciado: `Clasifica los dibujos. ¿${cuantas(c1)} hay en total?`,
    enunciadoFacil: `Mira el dibujo. Busca ${c1.nombre}. ¿${cuantas(c1)} hay?`,
    imagen,
    respuesta: num(r),
    pista: `Busca solo ${c1.nombre} y suma sus grupos.`,
    explicacion: `De ${c1.nombre} hay ${lista} = ${r}.`,
  };
});

const COLORES_VOTO = ["rojo", "azul", "verde", "amarillo"] as const;

const contarVotos = gen("NUM4-T5-c", (rng, d) => {
  const total = d === 1 ? 10 : d === 2 ? 15 : 20;
  const [c1, c2, c3] = trio(rng, COLORES_VOTO);
  const primero = d === 1 ? entero(rng, 2, 5) : d === 2 ? entero(rng, 7, 8) : entero(rng, 8, 10);
  const segundo = d === 1 ? entero(rng, 2, 3) : d === 2 ? entero(rng, 3, 4) : entero(rng, 4, 6);
  const tercero = total - primero - segundo;
  const votos = barajar(rng, [...Array<string>(primero).fill(c1), ...Array<string>(segundo).fill(c2), ...Array<string>(tercero).fill(c3)]);
  const texto = `Cada alumno dijo su color favorito: ${votos.join(", ")}.`;
  if (d === 1) {
    return {
      enunciado: `Lee los votos. ¿Cuántos alumnos eligieron ${c1}?`,
      enunciadoFacil: `Lee los votos. Cuenta solo ${c1}. ¿Cuántos hay?`,
      texto,
      respuesta: num(primero),
      pista: "Ve marcando cada voto de ese color.",
      explicacion: `El ${c1} aparece ${primero} veces.`,
    };
  }
  if (d === 2) {
    return {
      enunciado: "Lee los votos. ¿Qué color eligieron más alumnos?",
      enunciadoFacil: "Lee los votos. Cuenta cada color. ¿Cuál tiene más votos?",
      texto,
      respuesta: textos(c1, [c2, c3]),
      pista: "Haz una marca por cada voto y compara.",
      explicacion: `Hay ${primero} de ${c1}, ${segundo} de ${c2} y ${tercero} de ${c3}.`,
    };
  }
  const r = primero - segundo;
  return {
    enunciado: `Lee los votos. ¿Cuántos alumnos más eligieron ${c1} que ${c2}?`,
    enunciadoFacil: `Lee los votos. Cuenta ${c1}. Cuenta ${c2}. ¿Cuántos más eligieron ${c1}?`,
    texto,
    respuesta: num(r),
    pista: "Cuenta los dos colores y resta.",
    explicacion: `Hay ${primero} de ${c1} y ${segundo} de ${c2}: ${primero} − ${segundo} = ${r}.`,
  };
});

const FORMAS_F = [["circulo", "círculos"], ["cuadrado", "cuadrados"], ["triangulo", "triángulos"], ["rombo", "rombos"]] as const;
const COLORES_F = [["rojo", "rojos", "rojas"], ["azul", "azules", "azules"], ["verde", "verdes", "verdes"], ["amarillo", "amarillos", "amarillas"]] as const;

const clasificarFiguras = gen("NUM4-T5-c", (rng, d) => {
  const n = d === 1 ? 8 : d === 2 ? 10 : 12;
  const figuras = Array.from({ length: n }, () => ({ f: elegir(rng, FORMAS_F), c: elegir(rng, COLORES_F) }));
  const imagen: Imagen = { tipo: "serie", elementos: figuras.map((x) => ({ forma: x.f[0], color: x.c[0] })) };
  const modelo = en(figuras, entero(rng, 0, n - 1));
  if (d === 1) {
    const r = figuras.filter((x) => x.f === modelo.f).length;
    return {
      enunciado: `Mira las figuras. ¿Cuántos ${modelo.f[1]} hay?`,
      enunciadoFacil: `Mira las figuras. Cuenta los ${modelo.f[1]}. ¿Cuántos hay?`,
      imagen,
      respuesta: num(r),
      pista: "Fíjate solo en la forma, no en el color.",
      explicacion: `Hay ${r} con esa forma, sea cual sea su color.`,
    };
  }
  if (d === 2) {
    const r = figuras.filter((x) => x.f === modelo.f && x.c === modelo.c).length;
    return {
      enunciado: `Mira las figuras. ¿Cuántos ${modelo.f[1]} ${modelo.c[1]} hay?`,
      enunciadoFacil: `Mira las figuras. Cuenta los ${modelo.f[1]} ${modelo.c[1]}. ¿Cuántos hay?`,
      imagen,
      respuesta: num(r),
      pista: "Tienen que cumplir las dos cosas: la forma y el color.",
      explicacion: `Con esa forma y ese color hay ${r}.`,
    };
  }
  const otra = elegir(rng, FORMAS_F.filter((f) => f !== modelo.f));
  const r = figuras.filter((x) => x.c === modelo.c && x.f !== otra).length;
  return {
    enunciado: `Mira las figuras. ¿Cuántas figuras son ${modelo.c[2]} pero no son ${otra[1]}?`,
    enunciadoFacil: `Mira las figuras. Busca las ${modelo.c[2]}. Quita los ${otra[1]}. ¿Cuántas quedan?`,
    imagen,
    respuesta: num(r),
    pista: `Busca primero las ${modelo.c[2]}. Después quita los ${otra[1]}.`,
    explicacion: `Figuras ${modelo.c[2]} que no son ${otra[1]}: ${r}.`,
  };
});

export const GENERADORES_4B: MapaGeneradores = {
  "NUM4-T4-a": [leerReloj, tocarReloj, convertirTiempo],
  "NUM4-T4-b": [cuantoDura, horaFinal, horaInicio],
  "NUM4-T4-c": [horarioAutobus, horarioEscuela, horarioCartel],
  "NUM4-T5-a": [tablaDoble, tablaSimple],
  "NUM4-T5-b": [leerBarras, compararBarras],
  "NUM4-T5-c": [clasificarDibujos, contarVotos, clasificarFiguras],
};
