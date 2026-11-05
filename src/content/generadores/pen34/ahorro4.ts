// PEN4-T2 · Ahorro. Todas las cantidades se calculan en código.
import type { Rng } from "../../../core/rng.ts";
import { distractoresNumericos, elegir, entero, monedas, nombre, nombres } from "../../ayuda.ts";
import { generadorDeSituaciones } from "../../plantillas.ts";
import type { Dificultad, Generador } from "../../tipos.ts";
import { buscar, generadorDePlantillas, semanas, situaciones, type Contenido, type Plantilla } from "./comun.ts";

const DESEOS = ["una mochila", "un libro de cuentos", "una caja de colores", "una linterna", "una pelota", "un par de zapatos", "una regadera", "un cuaderno de dibujo"] as const;
const ANTOJOS = ["unas canicas", "unos caramelos", "un juguete pequeño", "unas pegatinas", "una goma de colores"] as const;

function numero(valor: number): Contenido["respuesta"] {
  return { tipo: "numero", valor };
}

function opcionesNumero(rng: Rng, correcta: number, candidatos: readonly number[]): Contenido["respuesta"] {
  return { tipo: "opcion", correcta: String(correcta), distractores: distractoresNumericos(rng, correcta, candidatos, 3).map(String) };
}

function dividirExacto(rng: Rng, unidad: "semana" | "día" | "mes"): Contenido {
  const quien = nombre(rng);
  const deseo = elegir(rng, DESEOS);
  const a = entero(rng, 2, 10);
  const k = entero(rng, 3, 10);
  const precio = a * k;
  const plural = unidad === "mes" ? "meses" : `${unidad}s`;
  const cada = unidad === "día" ? "cada día" : unidad === "mes" ? "cada mes" : "cada semana";
  const cuantos = unidad === "semana" ? "¿Cuántas" : "¿Cuántos";
  return {
    enunciado: `${quien} quiere comprar ${deseo} que cuesta ${monedas(precio)}. Guarda ${monedas(a)} ${cada}. ${cuantos} ${plural} tarda en juntar el dinero?`,
    enunciadoFacil: `${quien} quiere ${deseo}. Cuesta ${monedas(precio)}. Guarda ${monedas(a)} ${cada}. ¿Cuánto tarda? Escribe el número de ${plural}.`,
    respuesta: numero(k),
    pista: `Piensa cuántas veces cabe ${a} en ${precio}.`,
    explicacion: `${precio} entre ${a} son ${k}. Tarda ${k} ${plural}.`,
  };
}

function cuantoTendra(rng: Rng, d: Dificultad): Contenido {
  const quien = nombre(rng);
  const a = entero(rng, 2, 9);
  const k = entero(rng, 3, 9);
  const inicial = d === 1 ? 0 : entero(rng, 5, 30);
  const total = inicial + a * k;
  const tiene = inicial === 0 ? `${quien} no tiene nada ahorrado.` : `${quien} ya tiene ${monedas(inicial)} ahorradas.`;
  return {
    enunciado: `${tiene} Desde hoy guarda ${monedas(a)} cada semana. ¿Cuántas monedas tendrá dentro de ${semanas(k)}?`,
    enunciadoFacil: `${tiene} Guarda ${monedas(a)} cada semana. Pasan ${semanas(k)}. ¿Cuántas monedas tiene?`,
    respuesta: opcionesNumero(rng, total, [a * k, inicial + a + k, total + a, total - a]),
    pista: inicial === 0 ? "Multiplica lo que guarda por las semanas." : "Multiplica lo que guarda por las semanas. Después suma lo que ya tenía.",
    explicacion: inicial === 0 ? `${a} por ${k} son ${total}. Tendrá ${monedas(total)}.` : `${a} por ${k} son ${a * k}, y ${a * k} más ${inicial} son ${total}.`,
  };
}

function conAhorroInicial(rng: Rng): Contenido {
  const quien = nombre(rng);
  const deseo = elegir(rng, DESEOS);
  const a = entero(rng, 3, 9);
  const k = entero(rng, 3, 9);
  const inicial = entero(rng, 4, 25);
  const precio = inicial + a * k;
  return {
    enunciado: `${quien} quiere comprar ${deseo} que cuesta ${monedas(precio)}. Ya tiene ${monedas(inicial)} y guarda ${monedas(a)} cada semana. ¿Cuántas semanas tarda en juntar lo que le falta?`,
    enunciadoFacil: `El precio es ${monedas(precio)}. ${quien} ya tiene ${monedas(inicial)}. Guarda ${monedas(a)} cada semana. ¿Cuántas semanas tarda?`,
    respuesta: numero(k),
    pista: "Primero calcula cuánto le falta. Después mira cuántas semanas necesita.",
    explicacion: `Le faltan ${precio} menos ${inicial}, que son ${precio - inicial}. Y ${precio - inicial} entre ${a} son ${k} semanas.`,
  };
}

function conResto(rng: Rng): Contenido {
  const quien = nombre(rng);
  const deseo = elegir(rng, DESEOS);
  const a = entero(rng, 3, 9);
  const k = entero(rng, 3, 9);
  const resto = entero(rng, 1, a - 1);
  const precio = a * k + resto;
  const n = k + 1;
  return {
    enunciado: `${quien} quiere comprar ${deseo} que cuesta ${monedas(precio)}. Guarda ${monedas(a)} cada semana. ¿Cuántas semanas necesita, como mínimo, para tener el dinero?`,
    enunciadoFacil: `${quien} quiere ${deseo}. Cuesta ${monedas(precio)}. Guarda ${monedas(a)} cada semana. ¿Cuántas semanas necesita como mínimo?`,
    respuesta: numero(n),
    pista: "Si la división no es exacta, las monedas que faltan piden una semana más.",
    explicacion: `En ${semanas(k)} junta ${a * k} y no llega a ${precio}. En ${semanas(n)} junta ${a * n} y ya le alcanza.`,
  };
}

function entreDos(rng: Rng): Contenido {
  const [x, y] = nombres(rng, 2) as [string, string];
  const deseo = elegir(rng, DESEOS);
  const a = entero(rng, 2, 7);
  const b = entero(rng, 2, 7);
  const k = entero(rng, 3, 8);
  const precio = (a + b) * k;
  return {
    enunciado: `${x} y ${y} ahorran juntos para comprar ${deseo} que cuesta ${monedas(precio)}. ${x} pone ${monedas(a)} cada semana y ${y} pone ${monedas(b)} cada semana. ¿Cuántas semanas tardan?`,
    enunciadoFacil: `El precio es ${monedas(precio)}. ${x} pone ${monedas(a)} cada semana. ${y} pone ${monedas(b)} cada semana. Ahorran juntos. ¿Cuántas semanas tardan?`,
    respuesta: numero(k),
    pista: "Calcula primero cuánto juntan entre los dos cada semana.",
    explicacion: `Cada semana juntan ${a} más ${b}, que son ${a + b}. Y ${precio} entre ${a + b} son ${k} semanas.`,
  };
}

function ganaYGasta(rng: Rng): Contenido {
  const quien = nombre(rng);
  const deseo = elegir(rng, DESEOS);
  const gasto = entero(rng, 2, 6);
  const neto = entero(rng, 3, 8);
  const gana = gasto + neto;
  const k = entero(rng, 3, 9);
  const inicial = entero(rng, 0, 1) === 0 ? 0 : entero(rng, 5, 20);
  const precio = inicial + neto * k;
  const tiene = inicial === 0 ? "" : ` Ya tiene ${monedas(inicial)}.`;
  return {
    enunciado: `${quien} recibe ${monedas(gana)} cada semana por ayudar en el huerto y gasta ${monedas(gasto)} de ellas. El resto lo guarda.${tiene} Quiere comprar ${deseo} que cuesta ${monedas(precio)}. ¿Cuántas semanas tarda?`,
    enunciadoFacil: `${quien} recibe ${monedas(gana)} cada semana. Gasta ${monedas(gasto)}. Guarda el resto.${tiene} El precio es ${monedas(precio)}. ¿Cuántas semanas tarda?`,
    respuesta: numero(k),
    pista: "Lo que cuenta es lo que guarda cada semana, no lo que recibe.",
    explicacion: `Guarda ${gana} menos ${gasto}, que son ${neto} cada semana. ${inicial === 0 ? `Y ${precio}` : `Le faltan ${precio - inicial}, y ${precio - inicial}`} entre ${neto} son ${k} semanas.`,
  };
}

function restoConInicial(rng: Rng): Contenido {
  const quien = nombre(rng);
  const deseo = elegir(rng, DESEOS);
  const a = entero(rng, 4, 9);
  const k = entero(rng, 3, 8);
  const resto = entero(rng, 1, a - 1);
  const inicial = entero(rng, 6, 25);
  const precio = inicial + a * k + resto;
  const n = k + 1;
  return {
    enunciado: `${quien} quiere comprar ${deseo} que cuesta ${monedas(precio)}. Ya tiene ${monedas(inicial)} y guarda ${monedas(a)} cada semana. ¿Cuántas semanas necesita, como mínimo, para tener el dinero?`,
    enunciadoFacil: `El precio es ${monedas(precio)}. ${quien} ya tiene ${monedas(inicial)}. Guarda ${monedas(a)} cada semana. ¿Cuántas semanas necesita como mínimo?`,
    respuesta: numero(n),
    pista: "Calcula cuánto le falta. Si la división no es exacta, necesita una semana más.",
    explicacion: `Le faltan ${precio - inicial}. En ${semanas(k)} junta ${a * k}, que no llega. En ${semanas(n)} junta ${a * n}, y ya le alcanza.`,
  };
}

function compararPlanes(rng: Rng): Contenido {
  const quien = nombre(rng);
  const deseo = elegir(rng, DESEOS);
  return buscar(() => {
    const a = entero(rng, 2, 6);
    const b = entero(rng, a + 1, 12);
    const precio = a * b * entero(rng, 1, 3);
    const ka = precio / a;
    const kb = precio / b;
    if (precio > 90 || ka > 20 || ka - kb < 2) return null;
    return {
      enunciado: `${quien} quiere comprar ${deseo} que cuesta ${monedas(precio)}. Con el plan A guarda ${monedas(a)} cada semana. Con el plan B guarda ${monedas(b)} cada semana. ¿Cuántas semanas antes termina con el plan B?`,
      enunciadoFacil: `El precio es ${monedas(precio)}. Plan A: guarda ${monedas(a)} cada semana. Plan B: guarda ${monedas(b)} cada semana. ¿Cuántas semanas antes termina con el plan B?`,
      respuesta: numero(ka - kb),
      pista: "Calcula las semanas de cada plan y réstalas.",
      explicacion: `Con el plan A tarda ${semanas(ka)} y con el plan B tarda ${semanas(kb)}. La diferencia es ${semanas(ka - kb)}.`,
    };
  });
}

function dosEtapas(rng: Rng): Contenido {
  const quien = nombre(rng);
  const deseo = elegir(rng, DESEOS);
  const k1 = entero(rng, 2, 5);
  const a = entero(rng, 2, 5);
  const b = entero(rng, a + 1, 9);
  const k2 = entero(rng, 2, 6);
  const precio = k1 * a + k2 * b;
  return {
    enunciado: `${quien} quiere comprar ${deseo} que cuesta ${monedas(precio)}. Las primeras ${k1} semanas guarda ${monedas(a)} cada semana. Después guarda ${monedas(b)} cada semana. ¿Cuántas semanas tarda en total?`,
    enunciadoFacil: `El precio es ${monedas(precio)}. Las primeras ${k1} semanas: guarda ${monedas(a)} cada semana. Después: guarda ${monedas(b)} cada semana. ¿Cuántas semanas tarda en total?`,
    respuesta: numero(k1 + k2),
    pista: "Calcula lo que junta en las primeras semanas y lo que le falta después.",
    explicacion: `En ${k1} semanas junta ${k1 * a}. Le faltan ${k2 * b}, que son ${k2} semanas más. En total, ${k1 + k2} semanas.`,
  };
}

const PLANTILLAS_TARDO: readonly Plantilla[] = [
  { clave: "semanas", dificultades: [1], crear: (rng) => dividirExacto(rng, "semana") },
  { clave: "dias", dificultades: [1], crear: (rng) => dividirExacto(rng, "día") },
  { clave: "meses", dificultades: [1], crear: (rng) => dividirExacto(rng, "mes") },
  { clave: "cuanto-tendra", dificultades: [1, 2], crear: cuantoTendra },
  { clave: "inicial", dificultades: [2], crear: conAhorroInicial },
  { clave: "resto", dificultades: [2], crear: conResto },
  { clave: "entre-dos", dificultades: [2], crear: entreDos },
  { clave: "gana-gasta", dificultades: [3], crear: ganaYGasta },
  { clave: "resto-inicial", dificultades: [3], crear: restoConInicial },
  { clave: "planes", dificultades: [3], crear: compararPlanes },
  { clave: "etapas", dificultades: [3], crear: dosEtapas },
];

// ---------- Ahorrar o gastar ----------
function sobraOFalta(n: number, sobra: boolean): string {
  const verbo = sobra ? (n === 1 ? "le sobra" : "le sobran") : n === 1 ? "le falta" : "le faltan";
  return `${verbo} ${monedas(n)}`;
}

function llegaSiGasta(rng: Rng, d: Dificultad): Contenido {
  const quien = nombre(rng);
  const deseo = elegir(rng, DESEOS);
  const antojo = elegir(rng, ANTOJOS);
  return buscar(() => {
    const tiene = entero(rng, 12, 30);
    const gasto = entero(rng, 3, 11);
    const a = entero(rng, 2, 6);
    const k = entero(rng, 2, 5);
    const precio = entero(rng, 15, 50);
    const conGasto = tiene - gasto + a * k;
    const sinGasto = tiene + a * k;
    const diferencia = conGasto - precio;
    if (diferencia === 0 || Math.abs(diferencia) > 12) return null;
    // Solo interesa el caso en que gastar sí cambia algo, o en que aun así llega.
    if (d === 3 && !(sinGasto >= precio && conGasto < precio)) return null;
    const correcta = diferencia > 0 ? `Sí, y ${sobraOFalta(diferencia, true)}` : `No, ${sobraOFalta(-diferencia, false)}`;
    const candidatos = [
      diferencia > 0 ? `No, ${sobraOFalta(diferencia, false)}` : `Sí, y ${sobraOFalta(-diferencia, true)}`,
      sinGasto - precio > 0 ? `Sí, y ${sobraOFalta(sinGasto - precio, true)}` : `No, ${sobraOFalta(precio - sinGasto, false)}`,
      diferencia > 0 ? `Sí, y ${sobraOFalta(diferencia + a, true)}` : `No, ${sobraOFalta(-diferencia + a, false)}`,
    ];
    const distractores = [...new Set(candidatos)].filter((c) => c !== correcta);
    if (distractores.length < 2) return null;
    return {
      enunciado: `${quien} tiene ${monedas(tiene)} y guarda ${monedas(a)} cada semana. Dentro de ${semanas(k)} quiere comprar ${deseo} que cuesta ${monedas(precio)}. Hoy ve ${antojo} por ${monedas(gasto)}. Si hoy gasta ese dinero, ¿podrá comprar lo que quiere dentro de ${semanas(k)}?`,
      enunciadoFacil: `${quien} tiene ${monedas(tiene)}. Guarda ${monedas(a)} cada semana. Quiere algo que cuesta ${monedas(precio)}. Lo compra dentro de ${semanas(k)}. Hoy gasta ${monedas(gasto)}. ¿Le alcanza?`,
      respuesta: { tipo: "opcion", correcta, distractores },
      pista: "Resta lo que gasta hoy, suma lo que guardará y compáralo con el precio.",
      explicacion: `${tiene} menos ${gasto} son ${tiene - gasto}, y ${a} por ${k} son ${a * k}. En total tendrá ${conGasto} y el precio es ${precio}.`,
    };
  });
}

function maximoGasto(rng: Rng): Contenido {
  const quien = nombre(rng);
  const deseo = elegir(rng, DESEOS);
  return buscar(() => {
    const tiene = entero(rng, 10, 30);
    const a = entero(rng, 2, 6);
    const k = entero(rng, 2, 6);
    const puede = entero(rng, 2, 9);
    const precio = tiene + a * k - puede;
    if (puede >= tiene || precio <= tiene) return null;
    return {
      enunciado: `${quien} tiene ${monedas(tiene)} y guarda ${monedas(a)} cada semana. Dentro de ${semanas(k)} quiere comprar ${deseo} que cuesta ${monedas(precio)}. ¿Cuántas monedas puede gastar hoy, como máximo, para que le alcance?`,
      enunciadoFacil: `${quien} tiene ${monedas(tiene)}. Guarda ${monedas(a)} cada semana. Pasan ${semanas(k)}. Necesita ${monedas(precio)}. ¿Cuántas monedas puede gastar hoy como máximo?`,
      respuesta: numero(puede),
      pista: "Calcula cuánto tendrá sin gastar nada. Lo que pase del precio se puede gastar.",
      explicacion: `Sin gastar tendría ${tiene} más ${a * k}, que son ${tiene + a * k}. Necesita ${precio}, así que puede gastar ${puede}.`,
    };
  });
}

function semanasDeMas(rng: Rng): Contenido {
  const quien = nombre(rng);
  const antojo = elegir(rng, ANTOJOS);
  const a = entero(rng, 3, 8);
  const m = entero(rng, 2, 5);
  const gasto = a * m;
  return {
    enunciado: `${quien} guarda ${monedas(a)} cada semana para comprar algo que quiere. Hoy gasta ${monedas(gasto)} de sus ahorros en ${antojo}. ¿Cuántas semanas más tardará ahora en juntar el dinero?`,
    enunciadoFacil: `${quien} guarda ${monedas(a)} cada semana. Hoy gasta ${monedas(gasto)} de sus ahorros. ¿Cuántas semanas más tardará?`,
    respuesta: numero(m),
    pista: "Piensa cuántas semanas de ahorro hacen falta para recuperar lo gastado.",
    explicacion: `${gasto} entre ${a} son ${m}. Necesita ${semanas(m)} más para recuperar lo gastado.`,
  };
}

function dosPlanes(rng: Rng): Contenido {
  const quien = nombre(rng);
  const deseo = elegir(rng, DESEOS);
  return buscar(() => {
    const recibe = entero(rng, 8, 14);
    const guardaA = entero(rng, 2, 4);
    const guardaB = entero(rng, 5, recibe - 1);
    const k = entero(rng, 3, 6);
    const precio = entero(rng, guardaA * k + 1, guardaB * k);
    const a = guardaA * k >= precio;
    const b = guardaB * k >= precio;
    if (a || !b) return null;
    return {
      enunciado: `${quien} recibe ${monedas(recibe)} cada semana. Plan A: guardar ${monedas(guardaA)} y gastar el resto. Plan B: guardar ${monedas(guardaB)} y gastar el resto. Dentro de ${semanas(k)} quiere comprar ${deseo} que cuesta ${monedas(precio)}. ¿Con qué plan le alcanza?`,
      enunciadoFacil: `${quien} recibe ${monedas(recibe)} cada semana. Plan A: guarda ${monedas(guardaA)}. Plan B: guarda ${monedas(guardaB)}. Necesita ${monedas(precio)} dentro de ${semanas(k)}. ¿Con qué plan le alcanza?`,
      respuesta: { tipo: "opcion", correcta: "Solo con el plan B", distractores: ["Solo con el plan A", "Con los dos planes", "Con ninguno de los dos"] },
      pista: "Multiplica lo que guarda en cada plan por las semanas.",
      explicacion: `Con el plan A junta ${guardaA * k} y con el plan B junta ${guardaB * k}. Solo el plan B llega a ${precio}.`,
    };
  });
}

function quedaGuardado(rng: Rng): Contenido {
  const quien = nombre(rng);
  const tiene = entero(rng, 15, 40);
  const g1 = entero(rng, 3, 9);
  const g2 = entero(rng, 10, 14);
  const antojo = elegir(rng, ANTOJOS);
  return {
    enunciado: `${quien} tiene ${monedas(tiene)}. Puede gastar ${monedas(g1)} en ${antojo} o gastar ${monedas(g2)} en un paseo en barca. ¿Qué opción le deja más monedas guardadas?`,
    enunciadoFacil: `${quien} tiene ${monedas(tiene)}. Opción 1: gastar ${monedas(g1)}. Opción 2: gastar ${monedas(g2)}. ¿Con qué opción guarda más?`,
    respuesta: { tipo: "opcion", correcta: `Gastar ${monedas(g1)}`, distractores: [`Gastar ${monedas(g2)}`, "Las dos dejan lo mismo"] },
    pista: "Cuanto menos gastas, más te queda.",
    explicacion: `Si gasta ${g1} le quedan ${tiene - g1}. Si gasta ${g2} le quedan ${tiene - g2}.`,
  };
}

function quedaNumero(rng: Rng): Contenido {
  const quien = nombre(rng);
  const tiene = entero(rng, 15, 50);
  const gasto = entero(rng, 3, 12);
  const antojo = elegir(rng, ANTOJOS);
  return {
    enunciado: `${quien} tiene ${monedas(tiene)} ahorradas y gasta ${monedas(gasto)} en ${antojo}. ¿Cuántas monedas le quedan guardadas?`,
    enunciadoFacil: `${quien} tiene ${monedas(tiene)}. Gasta ${monedas(gasto)}. ¿Cuántas monedas le quedan?`,
    respuesta: numero(tiene - gasto),
    pista: "Resta lo que gasta a lo que tenía.",
    explicacion: `${tiene} menos ${gasto} son ${tiene - gasto}.`,
  };
}

function cuantoFaltaria(rng: Rng): Contenido {
  const quien = nombre(rng);
  const deseo = elegir(rng, DESEOS);
  const tiene = entero(rng, 12, 30);
  const falta = entero(rng, 3, 15);
  const gasto = entero(rng, 2, 10);
  const precio = tiene + falta;
  return {
    enunciado: `${quien} tiene ${monedas(tiene)} y quiere comprar ${deseo} que cuesta ${monedas(precio)}. Si gasta ${monedas(gasto)} hoy, ¿cuántas monedas le faltarán para pagar ese precio?`,
    enunciadoFacil: `${quien} tiene ${monedas(tiene)}. El precio es ${monedas(precio)}. Hoy gasta ${monedas(gasto)}. ¿Cuántas monedas le faltan?`,
    respuesta: numero(falta + gasto),
    pista: "Resta primero lo que gasta. Después mira cuánto falta hasta el precio.",
    explicacion: `Le quedan ${tiene - gasto}. Para llegar a ${precio} le faltan ${falta + gasto}.`,
  };
}

const PLANTILLAS_GASTAR: readonly Plantilla[] = [
  { clave: "queda-guardado", dificultades: [1], crear: quedaGuardado },
  { clave: "queda-numero", dificultades: [1], crear: quedaNumero },
  { clave: "llega", dificultades: [2, 3], crear: llegaSiGasta },
  { clave: "faltaria", dificultades: [2], crear: cuantoFaltaria },
  { clave: "maximo", dificultades: [2, 3], crear: maximoGasto },
  { clave: "semanas-mas", dificultades: [3], crear: semanasDeMas },
  { clave: "planes", dificultades: [3], crear: dosPlanes },
];

const SITUACIONES_GASTAR = situaciones("PEN4-T2-b", [
  { d: 1, e: "{F1} ahorra para comprar un libro la semana que viene. Hoy ve unos caramelos que cuestan casi todo lo que tiene. Si quiere el libro, ¿qué debe hacer?", f: "{F1} quiere un libro. Lo compra la semana que viene. Hoy ve unos caramelos. Cuestan casi todo su dinero. ¿Qué debe hacer?", c: "Guardar sus monedas", x: ["Comprar los caramelos hoy", "Gastar un poco cada día en la tienda"], p: "Piensa en lo que quiere conseguir.", ex: "Si gasta hoy, no tendrá dinero para el libro. Guardar sus monedas la acerca a lo que quiere." },
  { d: 1, e: "{M1} ha recibido monedas por ayudar en el mercado. Quiere tener dinero para unos zapatos que necesita. ¿Qué le ayuda más a conseguirlo?", f: "{M1} tiene monedas. Necesita unos zapatos. ¿Qué le ayuda más?", c: "Guardar una parte cada semana", x: ["Gastarlo todo el mismo día", "Perder la cuenta de lo que tiene"], p: "¿Qué hace crecer sus ahorros?", ex: "Si guarda una parte cada semana, el dinero se va juntando para los zapatos." },
  { d: 2, e: "{F1} tiene dos deseos: unas canicas ahora o una mochila nueva dentro de un mes. La mochila vieja está rota y la necesita para ir a la escuela. ¿Qué es lo más sensato?", f: "{F1} puede comprar canicas ahora. También necesita una mochila. La suya está rota. ¿Qué es lo más sensato?", c: "Ahorrar para la mochila", x: ["Comprar las canicas y seguir con la mochila rota", "Pedir que le compren canicas cada semana"], p: "¿Qué necesita de verdad y qué solo le apetece?", ex: "La mochila le hace falta para la escuela. Las canicas son un capricho que puede esperar." },
  { d: 2, e: "{M1} ha guardado monedas durante tres semanas para una linterna. Un amigo le dice que se lo gaste todo hoy en dulces. ¿Qué respuesta le ayuda a cumplir su plan?", f: "{M1} ahorra para una linterna. Un amigo le dice: «Gástalo todo en dulces». ¿Qué responde para cumplir su plan?", c: "«No, estoy ahorrando para algo»", x: ["«Sí, y mañana empiezo otra vez»", "«Sí, y me gasto también lo de mañana»"], p: "Fíjate en la frase que no gasta sus ahorros.", ex: "Si dice que no, mantiene su ahorro y sigue cerca de la linterna." },
  { d: 3, e: "{F1} recibe monedas cada semana. Quiere comprar una caja de colores. Hasta ahora gasta todo lo que recibe el primer día. ¿Qué cambio le ayudará a comprar la caja?", f: "{F1} recibe monedas cada semana. Se las gasta el primer día. Quiere una caja de colores. ¿Qué cambio le ayuda?", c: "Guardar una parte en cuanto recibe las monedas", x: ["Esperar a ver si le sobra algo tras gastar todo", "Gastar igual, pero en otra tienda"], p: "Si lo gasta todo, nunca sobra nada.", ex: "Si guarda una parte nada más recibirla, ese dinero ya no se gasta y la caja se va acercando." },
  { d: 3, e: "{M1} ahorra para unos zapatos que necesita en dos meses. Hoy se le rompe el único cuaderno que tiene para la escuela, y cuesta poco. ¿Qué es lo más sensato?", f: "{M1} ahorra para unos zapatos. Hoy se rompe su único cuaderno. Lo necesita para la escuela. Cuesta poco. ¿Qué es lo más sensato?", c: "Gastar un poco en el cuaderno y seguir ahorrando", x: ["Gastar todos los ahorros en dulces", "Ir a la escuela sin cuaderno todo el curso"], p: "A veces hay un gasto necesario. Piensa cuál y cuánto.", ex: "El cuaderno es necesario y cuesta poco. Después puede seguir ahorrando para los zapatos." },
]);

export const GENERADORES_AHORRO4: Readonly<Record<string, readonly Generador[]>> = {
  "PEN4-T2-a": [generadorDePlantillas("PEN4-T2-a", PLANTILLAS_TARDO)],
  "PEN4-T2-b": [generadorDePlantillas("PEN4-T2-b", PLANTILLAS_GASTAR), generadorDeSituaciones("PEN4-T2-b", SITUACIONES_GASTAR)],
};
