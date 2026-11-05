// Clasificar, igual y diferente: PEN1-T2 y PEN1-T3. Dibujos y cantidades en código.
import { barajar, elegir, entero, muestra, pregunta } from "../../ayuda.ts";
import { COLORES, type ColorId, type Dificultad, type ElementoSerie, type FormaId, type Generador, type Imagen, type ObjetoId, type Pregunta } from "../../tipos.ts";
import type { Rng } from "../../../core/rng.ts";
import {
  FORMAS_CLARAS, NOMBRE_FORMA, claveDibujo, colorDe, conArticulo, conArticuloDibujo, conArticuloForma, etiquetaDibujo,
  lista, mayuscula, nombreObjeto, opcionDibujo, porDificultad, type Dibujo, type Figura,
} from "./comun.ts";

function figura(forma: FormaId, color: ColorId): Figura {
  return { forma, color };
}

function fila(dibujos: readonly Dibujo[]): readonly ElementoSerie[] {
  return dibujos.map((d): ElementoSerie => ("forma" in d ? { forma: d.forma, color: d.color } : { objeto: d.objeto }));
}

// ---------- PEN1-T2-a: cuál no pertenece ----------
const SUB_INTRUSO = "PEN1-T2-a";

interface Grupo {
  readonly miembros: readonly ObjetoId[];
  readonly son: string; // "son frutas"
  readonly noEs: string; // "no es una fruta"
  readonly intrusos: readonly ObjetoId[];
}

// Intrusos lejanos: no comparten con el grupo ninguna otra idea sencilla.
const GRUPOS_FACILES: readonly Grupo[] = [
  { miembros: ["manzana", "pera", "naranja", "uva"], son: "son frutas", noEs: "no es una fruta", intrusos: ["silla", "llave", "zapato", "paraguas", "reloj"] },
  { miembros: ["gato", "perro", "vaca", "oso", "elefante"], son: "son animales", noEs: "no es un animal", intrusos: ["mesa", "llave", "zapato", "taza", "reloj"] },
];

const GRUPOS_MEDIOS: readonly Grupo[] = [
  { miembros: ["mesa", "silla", "cama"], son: "son muebles", noEs: "no es un mueble", intrusos: ["pez", "manzana", "sol"] },
  { miembros: ["barco", "tren", "avion", "bicicleta"], son: "sirven para viajar", noEs: "no sirve para viajar", intrusos: ["mesa", "flor", "taza"] },
  { miembros: ["sol", "luna", "nube", "estrella"], son: "se ven en el cielo", noEs: "no se ve en el cielo", intrusos: ["zapato", "pez", "silla", "taza"] },
  { miembros: ["mano", "ojo", "dedo"], son: "son partes del cuerpo", noEs: "no es una parte del cuerpo", intrusos: ["pelota", "llave", "taza"] },
  { miembros: ["vaso", "taza", "botella"], son: "sirven para beber", noEs: "no sirve para beber", intrusos: ["zapato", "llave", "lapiz"] },
  { miembros: ["lapiz", "libro", "cuaderno"], son: "se usan para estudiar", noEs: "no se usa para estudiar", intrusos: ["pez", "vaca", "uva"] },
];

// El intruso se parece en algo al grupo: hay que fijarse en la idea exacta.
const GRUPOS_DIFICILES: readonly Grupo[] = [
  { miembros: ["manzana", "pera", "uva"], son: "son frutas", noEs: "se come, pero no es una fruta", intrusos: ["pan", "huevo"] },
  { miembros: ["naranja", "pera", "uva"], son: "son frutas", noEs: "se come, pero no es una fruta", intrusos: ["pan", "huevo"] },
  { miembros: ["mesa", "silla", "cama"], son: "son muebles", noEs: "está en la casa, pero no es un mueble", intrusos: ["puerta", "ventana"] },
  { miembros: ["gato", "vaca", "oso"], son: "andan con cuatro patas", noEs: "es un animal, pero no tiene patas", intrusos: ["pez"] },
  { miembros: ["perro", "vaca", "elefante"], son: "andan con cuatro patas", noEs: "es un animal, pero no tiene patas", intrusos: ["pez"] },
  { miembros: ["mano", "ojo", "dedo"], son: "son partes del cuerpo", noEs: "se lleva puesto, pero no es una parte del cuerpo", intrusos: ["zapato", "gorro"] },
  { miembros: ["flor", "arbol", "hoja"], son: "son plantas o partes de una planta", noEs: "vive cerca de las plantas, pero es un animal", intrusos: ["mariposa", "hormiga"] },
];

function intrusoDeGrupo(grupos: readonly Grupo[]): Generador {
  return (rng, dificultad) => {
    const grupo = elegir(rng, grupos);
    const miembros = muestra(rng, grupo.miembros, 3);
    const intruso = elegir(rng, grupo.intrusos);
    const opcion = (o: ObjetoId) => opcionDibujo({ objeto: o });
    return pregunta(rng, {
      subhabilidad: SUB_INTRUSO,
      dificultad,
      enunciado: "Tres dibujos van juntos y uno no. ¿Cuál no pertenece al grupo?",
      enunciadoFacil: "Tres van juntos. Uno no. ¿Cuál es?",
      respuesta: { tipo: "imagen", correcta: opcion(intruso), distractores: miembros.map(opcion) },
      pista: "Piensa en qué se parecen tres de los dibujos.",
      explicacion: `${mayuscula(lista(miembros.map(conArticulo)))} ${grupo.son}. ${mayuscula(conArticulo(intruso))} ${grupo.noEs}.`,
      plantilla: `${SUB_INTRUSO}#${miembros.slice().sort().join("-")}-${intruso}`,
    });
  };
}

// Tres figuras con la misma forma y otra distinta. Los colores no forman grupo de tres.
const intrusoPorForma: Generador = (rng, dificultad) => {
  const [forma, otra] = muestra(rng, FORMAS_CLARAS, 2) as [FormaId, FormaId];
  const colores = muestra(rng, COLORES, 3);
  const grupo = colores.map((color) => figura(forma, color));
  const intruso = figura(otra, elegir(rng, colores));
  return pregunta(rng, {
    subhabilidad: SUB_INTRUSO,
    dificultad,
    enunciado: "Tres figuras van juntas y una no. ¿Cuál no pertenece al grupo?",
    enunciadoFacil: "Tres van juntas. Una no. ¿Cuál es?",
    respuesta: { tipo: "imagen", correcta: opcionDibujo(intruso), distractores: grupo.map(opcionDibujo) },
    pista: "Mira las formas, no los colores.",
    explicacion: `Hay tres figuras con forma de ${NOMBRE_FORMA[forma].singular}. ${mayuscula(conArticuloForma(otra))} tiene otra forma.`,
  });
};

// Tres del mismo color y formas distintas. El intruso repite la forma de una de ellas.
const intrusoPorColor = (repiteForma: boolean): Generador => (rng, dificultad) => {
  const formas = muestra(rng, FORMAS_CLARAS, 4);
  const [color, otro] = muestra(rng, COLORES, 2) as [ColorId, ColorId];
  const grupo = formas.slice(0, 3).map((forma) => figura(forma, color));
  const intruso = figura(repiteForma ? (formas[0] as FormaId) : (formas[3] as FormaId), otro);
  return pregunta(rng, {
    subhabilidad: SUB_INTRUSO,
    dificultad,
    enunciado: "Tres figuras van juntas y una no. ¿Cuál no pertenece al grupo?",
    enunciadoFacil: "Tres van juntas. Una no. ¿Cuál es?",
    respuesta: { tipo: "imagen", correcta: opcionDibujo(intruso), distractores: grupo.map(opcionDibujo) },
    pista: "Mira los colores, no las formas.",
    explicacion: `Hay tres figuras de color ${color}. ${mayuscula(conArticuloDibujo(intruso))} tiene otro color.`,
  });
};

// Tres figuras de cuatro lados y una de otro tipo. Todos los colores son distintos.
const intrusoPorLados: Generador = (rng, dificultad) => {
  const colores = muestra(rng, COLORES, 4);
  const cuatro: readonly FormaId[] = ["cuadrado", "rectangulo", "rombo"];
  const forma = elegir<FormaId>(rng, ["triangulo", "circulo"]);
  const grupo = cuatro.map((f, i) => figura(f, colores[i] as ColorId));
  const intruso = figura(forma, colores[3] as ColorId);
  return pregunta(rng, {
    subhabilidad: SUB_INTRUSO,
    dificultad,
    enunciado: "Tres figuras van juntas y una no. ¿Cuál no pertenece al grupo?",
    enunciadoFacil: "Tres van juntas. Una no. ¿Cuál es?",
    respuesta: { tipo: "imagen", correcta: opcionDibujo(intruso), distractores: grupo.map(opcionDibujo) },
    pista: "Cuenta los lados de cada figura.",
    explicacion: `El cuadrado, el rectángulo y el rombo tienen cuatro lados. ${mayuscula(conArticuloForma(forma))} no tiene cuatro lados.`,
  });
};

// Tres números y una letra, o al revés. Sin signos que se confundan (0 y O, 1 e I, 5 y S).
const intrusoLetraNumero: Generador = (rng, dificultad) => {
  const numeros = muestra(rng, ["2", "3", "4", "6", "7", "9"], 3);
  const letras = muestra(rng, ["A", "M", "R", "T", "E", "P"], 3);
  const tresNumeros = rng() < 0.5;
  const correcta = tresNumeros ? (letras[0] as string) : (numeros[0] as string);
  const distractores = tresNumeros ? numeros : letras;
  return pregunta(rng, {
    subhabilidad: SUB_INTRUSO,
    dificultad,
    enunciado: `Tres de estos signos van juntos y uno no. ¿Cuál no pertenece al grupo: ${barajar(rng, [correcta, ...distractores]).join(", ")}?`,
    enunciadoFacil: "Tres van juntos. Uno no. ¿Cuál es?",
    respuesta: { tipo: "opcion", correcta, distractores },
    pista: "Piensa: ¿cuáles sirven para contar y cuáles para escribir palabras?",
    explicacion: tresNumeros ? `${lista(distractores)} son números. ${correcta} es una letra.` : `${lista(distractores)} son letras. ${correcta} es un número.`,
  });
};

const cualNoPertenece = porDificultad({
  1: [intrusoDeGrupo(GRUPOS_FACILES)],
  2: [intrusoDeGrupo(GRUPOS_MEDIOS), intrusoPorForma, intrusoPorColor(false), intrusoLetraNumero],
  3: [intrusoDeGrupo(GRUPOS_DIFICILES), intrusoPorColor(true), intrusoPorLados],
});

// ---------- PEN1-T2-b: agrupar por color o forma ----------
const SUB_AGRUPAR = "PEN1-T2-b";

// Grupo que comparte una sola cosa: el color (formas distintas) o la forma (colores distintos).
interface GrupoFiguras {
  readonly grupo: readonly Figura[];
  readonly correcta: Figura;
  readonly distractores: readonly Figura[];
  readonly porColor: boolean;
  readonly color: ColorId;
  readonly forma: FormaId;
}

function grupoFiguras(rng: Rng, nDistractores: number): GrupoFiguras {
  const porColor = rng() < 0.5;
  const formas = muestra(rng, FORMAS_CLARAS, 4);
  const colores = muestra(rng, COLORES, 4);
  const color = colores[0] as ColorId;
  const forma = formas[0] as FormaId;
  if (porColor) {
    const grupo = formas.slice(0, 3).map((f) => figura(f, color));
    const correcta = figura(formas[3] as FormaId, color);
    // Trampa: repiten una forma del grupo, pero tienen otro color.
    const distractores = formas.slice(0, nDistractores).map((f, i) => figura(f, colores[i + 1] as ColorId));
    return { grupo, correcta, distractores, porColor, color, forma };
  }
  const grupo = colores.slice(0, 3).map((c) => figura(forma, c));
  const correcta = figura(forma, colores[3] as ColorId);
  // Trampa: repiten un color del grupo, pero tienen otra forma.
  const distractores = colores.slice(0, nDistractores).map((c, i) => figura(formas[i + 1] as FormaId, c));
  return { grupo, correcta, distractores, porColor, color, forma };
}

function nombreGrupo(g: GrupoFiguras): string {
  return g.porColor ? `figuras de color ${g.color}` : NOMBRE_FORMA[g.forma].plural;
}

const grupoConRegla: Generador = (rng, dificultad) => {
  const g = grupoFiguras(rng, 2);
  return pregunta(rng, {
    subhabilidad: SUB_AGRUPAR,
    dificultad,
    enunciado: `En este grupo solo hay ${nombreGrupo(g)}. ¿Cuál puede entrar en el grupo?`,
    enunciadoFacil: `Aquí solo hay ${nombreGrupo(g)}. ¿Cuál puede entrar?`,
    imagen: { tipo: "serie", elementos: fila(g.grupo) },
    respuesta: { tipo: "imagen", correcta: opcionDibujo(g.correcta), distractores: g.distractores.map(opcionDibujo) },
    pista: g.porColor ? "Mira solo el color de cada figura." : "Mira solo la forma de cada figura.",
    explicacion: `En el grupo solo hay ${nombreGrupo(g)}. Por eso puede entrar ${conArticuloDibujo(g.correcta)}.`,
  });
};

const grupoSinRegla: Generador = (rng, dificultad) => {
  const g = grupoFiguras(rng, 3);
  return pregunta(rng, {
    subhabilidad: SUB_AGRUPAR,
    dificultad,
    enunciado: "Mira en qué se parecen las figuras de este grupo. ¿Cuál puede entrar en el grupo?",
    enunciadoFacil: "Mira el grupo. ¿En qué se parecen? ¿Cuál puede entrar?",
    imagen: { tipo: "serie", elementos: fila(g.grupo) },
    respuesta: { tipo: "imagen", correcta: opcionDibujo(g.correcta), distractores: g.distractores.map(opcionDibujo) },
    pista: "¿Las figuras se parecen en el color o en la forma?",
    explicacion: `Todas las figuras del grupo son ${g.porColor ? `de color ${g.color}` : NOMBRE_FORMA[g.forma].plural}. Por eso puede entrar ${conArticuloDibujo(g.correcta)}.`,
  });
};

function mezclaFiguras(rng: Rng, n: number, formas: readonly FormaId[], colores: readonly ColorId[]): Figura[] {
  return Array.from({ length: n }, () => figura(elegir(rng, formas), elegir(rng, colores)));
}

function preguntaContar(rng: Rng, dificultad: Dificultad, figuras: readonly Figura[], enunciado: string, enunciadoFacil: string, pista: string, correcta: number, explicacion: string): Pregunta {
  return pregunta(rng, {
    subhabilidad: SUB_AGRUPAR,
    dificultad,
    enunciado,
    enunciadoFacil,
    imagen: { tipo: "serie", elementos: fila(figuras) },
    respuesta: { tipo: "numero", valor: correcta },
    pista,
    explicacion,
  });
}

const contarColor: Generador = (rng, dificultad) => {
  const colores = muestra(rng, COLORES, 3);
  const formas = muestra(rng, FORMAS_CLARAS, 3);
  const figuras = mezclaFiguras(rng, entero(rng, 6, 8), formas, colores);
  const color = (figuras[0] as Figura).color;
  const total = figuras.filter((x) => x.color === color).length;
  const adjetivo = colorDe(color, true, true);
  return preguntaContar(
    rng, dificultad, figuras,
    `Agrupa las figuras por color. ¿Cuántas figuras ${adjetivo} hay?`,
    `Busca las figuras ${adjetivo}. ¿Cuántas hay?`,
    "Mira solo el color. La forma no importa aquí.",
    total,
    `Si juntas las figuras ${adjetivo}, el grupo tiene ${total === 1 ? "1 figura" : `${total} figuras`}.`,
  );
};

const contarForma: Generador = (rng, dificultad) => {
  const colores = muestra(rng, COLORES, 3);
  const formas = muestra(rng, FORMAS_CLARAS, 3);
  const figuras = mezclaFiguras(rng, entero(rng, 6, 8), formas, colores);
  const forma = (figuras[0] as Figura).forma;
  const nombre = NOMBRE_FORMA[forma];
  const total = figuras.filter((x) => x.forma === forma).length;
  return preguntaContar(
    rng, dificultad, figuras,
    `Agrupa las figuras por su forma. ¿${nombre.femenino ? "Cuántas" : "Cuántos"} ${nombre.plural} hay?`,
    `Busca ${nombre.femenino ? "las" : "los"} ${nombre.plural}. ¿${nombre.femenino ? "Cuántas" : "Cuántos"} hay?`,
    "Mira solo la forma. El color no importa aquí.",
    total,
    `Si juntas ${nombre.femenino ? "las" : "los"} ${nombre.plural}, el grupo tiene ${total === 1 ? "1 figura" : `${total} figuras`}.`,
  );
};

const contarDosCosas: Generador = (rng, dificultad) => {
  const colores = muestra(rng, COLORES, 2);
  const formas = muestra(rng, FORMAS_CLARAS, 2);
  const figuras = mezclaFiguras(rng, entero(rng, 7, 9), formas, colores);
  const { forma, color } = figuras[0] as Figura;
  const nombre = NOMBRE_FORMA[forma];
  const total = figuras.filter((x) => x.forma === forma && x.color === color).length;
  const pedido = `${nombre.plural} ${colorDe(color, nombre.femenino, true)}`;
  return preguntaContar(
    rng, dificultad, figuras,
    `Mira la forma y el color a la vez. ¿${nombre.femenino ? "Cuántas" : "Cuántos"} ${pedido} hay?`,
    `Busca ${pedido}. ¿${nombre.femenino ? "Cuántas" : "Cuántos"} hay?`,
    "Cada figura debe cumplir las dos cosas: la forma y el color.",
    total,
    `Solo cuentan las figuras que cumplen las dos cosas. Hay ${total === 1 ? "1 figura" : `${total} figuras`} así.`,
  );
};

const contarGrupos: Generador = (rng, dificultad) => {
  const nColores = entero(rng, 2, 4);
  const colores = muestra(rng, COLORES, nColores);
  const formas = muestra(rng, FORMAS_CLARAS, 3);
  const base = colores.map((color) => figura(elegir(rng, formas), color));
  const figuras = barajar(rng, [...base, ...mezclaFiguras(rng, entero(rng, 3, 4), formas, colores)]);
  return preguntaContar(
    rng, dificultad, figuras,
    "Junta las figuras que tienen el mismo color. ¿Cuántos grupos salen?",
    "Junta las figuras del mismo color. ¿Cuántos grupos hay?",
    "Cada color distinto forma un grupo.",
    nColores,
    `Hay figuras de ${nColores} colores: ${lista(colores)}. Por eso salen ${nColores} grupos.`,
  );
};

// Hay que cumplir dos condiciones. Las trampas cumplen solo una.
const dosCondiciones: Generador = (rng, dificultad) => {
  const [forma, otraForma, terceraForma] = muestra(rng, FORMAS_CLARAS, 3) as [FormaId, FormaId, FormaId];
  const [color, otroColor, tercerColor] = muestra(rng, COLORES, 3) as [ColorId, ColorId, ColorId];
  const correcta = figura(forma, color);
  const nombre = etiquetaDibujo(correcta);
  return pregunta(rng, {
    subhabilidad: SUB_AGRUPAR,
    dificultad,
    enunciado: `En una caja solo entran figuras que tengan esta forma y este color: ${nombre}. ¿Cuál entra en la caja?`,
    enunciadoFacil: `Busca: ${nombre}. ¿Cuál es?`,
    respuesta: {
      tipo: "imagen",
      correcta: opcionDibujo(correcta),
      distractores: [figura(forma, otroColor), figura(otraForma, color), figura(terceraForma, tercerColor)].map(opcionDibujo),
    },
    pista: "Mira primero la forma. Después mira el color.",
    explicacion: `${mayuscula(conArticuloDibujo(correcta))} tiene la forma y el color que se piden. Las otras figuras fallan en la forma o en el color.`,
  });
};

const agrupar = porDificultad({
  1: [grupoConRegla],
  2: [grupoSinRegla, contarColor, contarForma],
  3: [contarDosCosas, contarGrupos, dosCondiciones],
});

// ---------- PEN1-T3-a: encontrar el igual ----------
const SUB_IGUAL = "PEN1-T3-a";
const OBJETOS_MODELO: readonly ObjetoId[] = ["pelota", "flor", "gato", "pez", "taza", "llave", "zapato", "sol", "luna", "casa", "libro", "paraguas", "barco", "mariposa", "hoja", "reloj"];

const igualUno: Generador = (rng, dificultad) => {
  if (rng() < 0.5) {
    const [modelo, ...otros] = muestra(rng, OBJETOS_MODELO, 3) as [ObjetoId, ObjetoId, ObjetoId];
    const opcion = (o: ObjetoId) => opcionDibujo({ objeto: o });
    return pregunta(rng, {
      subhabilidad: SUB_IGUAL,
      dificultad,
      enunciado: "Mira este dibujo. ¿Cuál es igual?",
      enunciadoFacil: "¿Cuál es igual?",
      imagen: { tipo: "objeto", objeto: modelo },
      respuesta: { tipo: "imagen", correcta: opcion(modelo), distractores: otros.map(opcion) },
      pista: "Compara cada dibujo con el de arriba.",
      explicacion: `El dibujo es ${conArticulo(modelo)}, y solo ${conArticulo(modelo)} es igual.`,
    });
  }
  const [forma, f2, f3] = muestra(rng, FORMAS_CLARAS, 3) as [FormaId, FormaId, FormaId];
  const [color, c2, c3] = muestra(rng, COLORES, 3) as [ColorId, ColorId, ColorId];
  const modelo = figura(forma, color);
  return pregunta(rng, {
    subhabilidad: SUB_IGUAL,
    dificultad,
    enunciado: "Mira esta figura. ¿Cuál es igual?",
    enunciadoFacil: "¿Cuál es igual?",
    imagen: { tipo: "figura", forma, color },
    respuesta: { tipo: "imagen", correcta: opcionDibujo(modelo), distractores: [figura(f2, c2), figura(f3, c3)].map(opcionDibujo) },
    pista: "Mira la forma y el color.",
    explicacion: `La figura es ${conArticuloDibujo(modelo)}. Las otras tienen otra forma y otro color.`,
  });
};

// Misma forma con otro color, y mismo color con otra forma.
const igualFiguraCercana: Generador = (rng, dificultad) => {
  const [forma, f2] = muestra(rng, FORMAS_CLARAS, 2) as [FormaId, FormaId];
  const [color, c2, c3] = muestra(rng, COLORES, 3) as [ColorId, ColorId, ColorId];
  const modelo = figura(forma, color);
  return pregunta(rng, {
    subhabilidad: SUB_IGUAL,
    dificultad,
    enunciado: "Mira esta figura. ¿Cuál es exactamente igual?",
    enunciadoFacil: "¿Cuál es igual? Mira la forma. Mira el color.",
    imagen: { tipo: "figura", forma, color },
    respuesta: {
      tipo: "imagen",
      correcta: opcionDibujo(modelo),
      distractores: [figura(forma, c2), figura(f2, color), figura(forma, c3)].map(opcionDibujo),
    },
    pista: "Debe tener la misma forma y también el mismo color.",
    explicacion: `Solo ${conArticuloDibujo(modelo)} tiene la misma forma y el mismo color.`,
  });
};

function etiquetaFila(dibujos: readonly Dibujo[]): string {
  return dibujos.map(etiquetaDibujo).join(", ");
}

function opcionFila(dibujos: readonly Dibujo[]): { readonly texto: string; readonly imagen: Imagen } {
  return { texto: etiquetaFila(dibujos), imagen: { tipo: "serie", elementos: fila(dibujos) } };
}

// Filas de tres: las otras tienen el mismo contenido en otro orden, o cambian una figura.
const igualFila: Generador = (rng, dificultad) => {
  const formas = muestra(rng, FORMAS_CLARAS, 4);
  const colores = muestra(rng, COLORES, 4);
  const [a, b, c] = [0, 1, 2].map((i) => figura(formas[i] as FormaId, colores[i] as ColorId)) as [Figura, Figura, Figura];
  const nueva = figura(formas[3] as FormaId, colores[3] as ColorId);
  const modelo = [a, b, c];
  return pregunta(rng, {
    subhabilidad: SUB_IGUAL,
    dificultad,
    enunciado: "Mira esta fila de figuras. ¿Qué fila es igual, con las figuras en el mismo orden?",
    enunciadoFacil: "¿Qué fila es igual? Mira el orden.",
    imagen: { tipo: "serie", elementos: fila(modelo) },
    respuesta: { tipo: "imagen", correcta: opcionFila(modelo), distractores: [[b, a, c], [a, c, b], [a, b, nueva]].map(opcionFila) },
    pista: "Compara las figuras una a una, de izquierda a derecha.",
    explicacion: `La fila es: ${etiquetaFila(modelo)}. Solo una opción tiene las mismas figuras en ese orden.`,
  });
};

const OBJETOS_GRUPO: readonly ObjetoId[] = ["manzana", "pera", "naranja", "pelota", "flor", "lapiz", "libro", "pez", "pajaro", "vaso", "huevo", "moneda"];

function plural(o: ObjetoId, n: number): string {
  const nombre = nombreObjeto(o);
  if (n === 1) return `1 ${nombre}`;
  if (o === "lapiz") return `${n} lápices`;
  if (o === "pez") return `${n} peces`;
  if (o === "flor") return `${n} flores`;
  if (o === "pajaro") return `${n} pájaros`;
  return `${n} ${nombre}s`;
}

function opcionGrupos(a: ObjetoId, x: number, b: ObjetoId, y: number): { readonly texto: string; readonly imagen: Imagen } {
  return {
    texto: `${plural(a, x)} y ${plural(b, y)}`,
    imagen: { tipo: "objetos", grupos: [{ objeto: a, cantidad: x }, { objeto: b, cantidad: y }] },
  };
}

// Mismos objetos en otras cantidades, o los mismos números con otro objeto.
const igualCantidades: Generador = (rng, dificultad) => {
  const [a, b, c] = muestra(rng, OBJETOS_GRUPO, 3) as [ObjetoId, ObjetoId, ObjetoId];
  const x = entero(rng, 2, 3);
  const y = x + entero(rng, 1, 2);
  const modelo = opcionGrupos(a, x, b, y);
  return pregunta(rng, {
    subhabilidad: SUB_IGUAL,
    dificultad,
    enunciado: "Mira estos dibujos. ¿Qué grupo es igual: los mismos objetos y las mismas cantidades?",
    enunciadoFacil: "¿Qué grupo es igual? Cuenta cada objeto.",
    imagen: modelo.imagen,
    respuesta: { tipo: "imagen", correcta: modelo, distractores: [opcionGrupos(a, y, b, x), opcionGrupos(a, x, b, y + 1), opcionGrupos(a, x, c, y)] },
    pista: "Cuenta cada tipo de objeto y compara.",
    explicacion: `El grupo tiene ${modelo.texto}. Solo una opción tiene justo eso.`,
  });
};

// Dos cifras cambiadas de sitio: el error típico al copiar números.
const igualNumero = (cifras: 2 | 3): Generador => (rng, dificultad) => {
  const digitos = muestra(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9], cifras);
  const texto = digitos.join("");
  const [a, b, c] = digitos as [number, number, number];
  const otro = (a + 1) % 9 === 0 ? 9 : (a + 1) % 9;
  const distractores = cifras === 2
    ? [`${b}${a}`, `${otro === b ? (otro % 9) + 1 : otro}${b}`, `${a}${b === 9 ? 1 : b + 1}`]
    : [`${b}${a}${c}`, `${a}${c}${b}`, `${c}${b}${a}`];
  return pregunta(rng, {
    subhabilidad: SUB_IGUAL,
    dificultad,
    enunciado: `¿Qué número es igual a ${texto}?`,
    enunciadoFacil: `Busca el número ${texto}.`,
    imagen: { tipo: "serie", elementos: [{ texto }] },
    respuesta: { tipo: "opcion", correcta: texto, distractores },
    pista: "Compara las cifras una a una, de izquierda a derecha.",
    explicacion: `Solo ${texto} tiene las mismas cifras en el mismo orden.`,
  });
};

const PALABRAS_PARECIDAS: readonly (readonly [string, string, string, string])[] = [
  ["casa", "cosa", "caso", "cama"],
  ["pato", "palo", "gato", "plato"],
  ["mesa", "masa", "pesa", "meta"],
  ["luna", "cuna", "lupa", "lana"],
  ["pera", "para", "pena", "perro"],
  ["mano", "mono", "mago", "malo"],
  ["sopa", "ropa", "copa", "sapo"],
  ["sol", "sal", "son", "gol"],
];

const igualPalabra: Generador = (rng, dificultad) => {
  const [palabra, ...otras] = elegir(rng, PALABRAS_PARECIDAS);
  return pregunta(rng, {
    subhabilidad: SUB_IGUAL,
    dificultad,
    enunciado: `¿Qué palabra es igual a «${palabra}»?`,
    enunciadoFacil: `Busca la palabra «${palabra}».`,
    imagen: { tipo: "serie", elementos: [{ texto: palabra }] },
    respuesta: { tipo: "opcion", correcta: palabra, distractores: otras },
    pista: "Compara las letras una a una.",
    explicacion: `Solo «${palabra}» tiene las mismas letras en el mismo orden.`,
    plantilla: `${SUB_IGUAL}#${palabra}`,
  });
};

const encontrarIgual = porDificultad({
  1: [igualUno],
  2: [igualFiguraCercana, igualNumero(2), igualPalabra],
  3: [igualFila, igualCantidades, igualNumero(3)],
});

// ---------- PEN1-T3-b: encontrar la diferencia ----------
const SUB_DIFERENCIA = "PEN1-T3-b";
const FLECHA: ElementoSerie = { texto: "→" };

// Varios dibujos iguales y uno distinto.
const unoDiferente: Generador = (rng, dificultad) => {
  const objetos = rng() < 0.5;
  const [repetido, diferente, ausente]: Dibujo[] = objetos
    ? muestra(rng, OBJETOS_MODELO, 3).map((objeto) => ({ objeto }))
    : (() => {
        const formas = muestra(rng, FORMAS_CLARAS, 3);
        const colores = muestra(rng, COLORES, 3);
        return formas.map((forma, i) => figura(forma, colores[i] as ColorId));
      })();
  const a = repetido as Dibujo;
  const b = diferente as Dibujo;
  const c = ausente as Dibujo;
  const n = entero(rng, 4, 5);
  const lugar = entero(rng, 0, n - 1);
  const dibujos = Array.from({ length: n }, (_, i) => (i === lugar ? b : a));
  return pregunta(rng, {
    subhabilidad: SUB_DIFERENCIA,
    dificultad,
    enunciado: "En esta fila hay un dibujo diferente. ¿Cuál es?",
    enunciadoFacil: "Un dibujo es diferente. ¿Cuál es?",
    imagen: { tipo: "serie", elementos: fila(dibujos) },
    respuesta: { tipo: "imagen", correcta: opcionDibujo(b), distractores: [a, c].map(opcionDibujo) },
    pista: "Busca cuál se repite. El diferente solo está una vez.",
    explicacion: `En la fila se repite ${conArticuloDibujo(a)}. El diferente es ${conArticuloDibujo(b)}.`,
  });
};

// Solo cambia el color: hay que mirar con más atención.
const unoDiferenteColor: Generador = (rng, dificultad) => {
  const forma = elegir(rng, FORMAS_CLARAS);
  const [color, otro, tercero] = muestra(rng, COLORES, 3) as [ColorId, ColorId, ColorId];
  const a = figura(forma, color);
  const b = figura(forma, otro);
  const n = entero(rng, 5, 6);
  const lugar = entero(rng, 0, n - 1);
  return pregunta(rng, {
    subhabilidad: SUB_DIFERENCIA,
    dificultad,
    enunciado: "En esta fila hay una figura diferente. ¿Cuál es?",
    enunciadoFacil: "Una figura es diferente. ¿Cuál es?",
    imagen: { tipo: "serie", elementos: fila(Array.from({ length: n }, (_, i) => (i === lugar ? b : a))) },
    respuesta: { tipo: "imagen", correcta: opcionDibujo(b), distractores: [a, figura(forma, tercero)].map(opcionDibujo) },
    pista: "Todas tienen la misma forma. Mira el color.",
    explicacion: `Se repite ${conArticuloDibujo(a)}. La diferente es ${conArticuloDibujo(b)}.`,
  });
};

// ¿En qué se diferencian dos figuras?
const enQueSeDiferencian = (tambienAmbas: boolean): Generador => (rng, dificultad) => {
  const [f1, f2] = muestra(rng, FORMAS_CLARAS, 2) as [FormaId, FormaId];
  const [c1, c2] = muestra(rng, COLORES, 2) as [ColorId, ColorId];
  const casos = tambienAmbas ? (["color", "forma", "ambas", "nada"] as const) : (["color", "forma"] as const);
  const caso = elegir(rng, casos);
  const primera = figura(f1, c1);
  const segunda = figura(caso === "forma" || caso === "ambas" ? f2 : f1, caso === "color" || caso === "ambas" ? c2 : c1);
  const textos = tambienAmbas
    ? { color: "Solo el color", forma: "Solo la forma", ambas: "El color y la forma", nada: "Nada, son iguales" }
    : { color: "El color", forma: "La forma", ambas: "", nada: "" };
  const correcta = textos[caso];
  const distractores = tambienAmbas
    ? Object.values(textos).filter((t) => t !== correcta)
    : [caso === "color" ? textos.forma : textos.color, "Nada, son iguales"];
  const motivo: Readonly<Record<typeof caso, string>> = {
    color: "Tienen la misma forma, pero el color cambia.",
    forma: "Tienen el mismo color, pero la forma cambia.",
    ambas: "Cambian la forma y también el color.",
    nada: "Tienen la misma forma y el mismo color: son iguales.",
  };
  return pregunta(rng, {
    subhabilidad: SUB_DIFERENCIA,
    dificultad,
    enunciado: "Mira estas dos figuras. ¿En qué se diferencian?",
    enunciadoFacil: "Mira las dos figuras. ¿Qué cambia?",
    imagen: { tipo: "serie", elementos: fila([primera, segunda]) },
    respuesta: { tipo: "opcion", correcta, distractores },
    pista: "Compara primero las formas. Después compara los colores.",
    explicacion: `Son ${conArticuloDibujo(primera)} y ${conArticuloDibujo(segunda)}. ${motivo[caso]}`,
  });
};

// Dos mesas con objetos: cambia la cantidad o cambia el objeto.
const diferenciaEnMesas: Generador = (rng, dificultad) => {
  const [a, b] = muestra(rng, OBJETOS_GRUPO, 2) as [ObjetoId, ObjetoId];
  const n = entero(rng, 2, 4);
  const cambiaCantidad = rng() < 0.5;
  const m = cambiaCantidad ? n + entero(rng, 1, 2) : n;
  const segundo = cambiaCantidad ? a : b;
  return pregunta(rng, {
    subhabilidad: SUB_DIFERENCIA,
    dificultad,
    enunciado: "Compara las dos mesas. ¿Qué es diferente?",
    enunciadoFacil: "Mira las dos mesas. ¿Qué cambia?",
    imagen: { tipo: "objetos", grupos: [{ objeto: a, cantidad: n, etiqueta: "Mesa 1" }, { objeto: segundo, cantidad: m, etiqueta: "Mesa 2" }] },
    respuesta: { tipo: "opcion", correcta: cambiaCantidad ? "Cuántos objetos hay" : "Qué objeto hay", distractores: [cambiaCantidad ? "Qué objeto hay" : "Cuántos objetos hay", "Nada, son iguales"] },
    pista: "Mira qué objeto hay en cada mesa. Después cuéntalos.",
    explicacion: cambiaCantidad
      ? `Las dos mesas tienen el mismo objeto, pero una tiene ${plural(a, n)} y la otra ${plural(a, m)}.`
      : `Las dos mesas tienen ${n} objetos, pero en una hay ${plural(a, n)} y en la otra ${plural(b, n)}.`,
  });
};

// Dos filas separadas por una flecha. Las figuras son todas distintas entre sí.
function filasConCambios(rng: Rng, n: number, cambios: number): { antes: Figura[]; despues: Figura[]; lugares: number[]; nuevas: Figura[] } {
  const formas = barajar(rng, FORMAS_CLARAS);
  const colores = barajar(rng, COLORES);
  const todas = formas.map((forma, i) => figura(forma, colores[i] as ColorId));
  const antes = todas.slice(0, n);
  const nuevas = todas.slice(n, n + cambios);
  const lugares = muestra(rng, antes.map((_, i) => i), cambios);
  const despues = antes.map((d, i) => {
    const k = lugares.indexOf(i);
    return k === -1 ? d : (nuevas[k] as Figura);
  });
  return { antes, despues, lugares, nuevas };
}

const figuraNueva: Generador = (rng, dificultad) => {
  const { antes, despues, lugares, nuevas } = filasConCambios(rng, 3, 1);
  const nueva = nuevas[0] as Figura;
  const quitada = antes[lugares[0] as number] as Figura;
  const queda = antes.filter((d) => d !== quitada);
  return pregunta(rng, {
    subhabilidad: SUB_DIFERENCIA,
    dificultad,
    enunciado: "Compara la fila de antes de la flecha con la de después. ¿Qué figura es nueva?",
    enunciadoFacil: "Mira antes de la flecha. Mira después. ¿Qué figura es nueva?",
    imagen: { tipo: "serie", elementos: [...fila(antes), FLECHA, ...fila(despues)] },
    respuesta: { tipo: "imagen", correcta: opcionDibujo(nueva), distractores: [quitada, ...queda].map(opcionDibujo) },
    pista: "Compara las figuras de una en una, en el mismo lugar.",
    explicacion: `Antes estaba ${conArticuloDibujo(quitada)}, y en su lugar ahora está ${conArticuloDibujo(nueva)}.`,
  });
};

const cuantasCambian: Generador = (rng, dificultad) => {
  const n = 3;
  const cambios = entero(rng, 1, 2);
  const { antes, despues } = filasConCambios(rng, n, cambios);
  return pregunta(rng, {
    subhabilidad: SUB_DIFERENCIA,
    dificultad,
    enunciado: "Compara la fila de antes de la flecha con la de después, lugar por lugar. ¿Cuántas figuras han cambiado?",
    enunciadoFacil: "Mira antes de la flecha. Mira después. ¿Cuántas figuras cambian?",
    imagen: { tipo: "serie", elementos: [...fila(antes), FLECHA, ...fila(despues)] },
    respuesta: { tipo: "numero", valor: cambios },
    pista: "Compara la primera con la primera, la segunda con la segunda…",
    explicacion: cambios === 1 ? "Solo ha cambiado 1 figura. Las demás siguen en su lugar." : `Han cambiado ${cambios} figuras. La otra sigue en su lugar.`,
  });
};

const encontrarDiferencia = porDificultad({
  1: [unoDiferente],
  2: [unoDiferenteColor, enQueSeDiferencian(false), diferenciaEnMesas],
  3: [enQueSeDiferencian(true), figuraNueva, cuantasCambian],
});

export const GENERADORES_CLASES = {
  "PEN1-T2-a": [cualNoPertenece],
  "PEN1-T2-b": [agrupar],
  "PEN1-T3-a": [encontrarIgual],
  "PEN1-T3-b": [encontrarDiferencia],
} as const;
