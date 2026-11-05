// Oráculos de PEN 1.º y 2.º: recalculan la respuesta solo desde lo que ve el niño.
import type { ElementoSerie, Imagen, Pregunta } from "../../../src/content/tipos.ts";

type Oraculo = (p: Pregunta) => string;

function elementos(p: Pregunta): readonly ElementoSerie[] {
  if (p.imagen?.tipo !== "serie") throw new Error(`Sin serie: ${p.enunciado}`);
  return p.imagen.elementos;
}

function clave(e: ElementoSerie): string | null {
  if ("hueco" in e) return null;
  if ("forma" in e) return `${e.forma}/${e.color}`;
  return "objeto" in e ? e.objeto : e.texto;
}

function claveImagen(i: Imagen | undefined): string {
  if (i?.tipo === "figura") return `${i.forma}/${i.color}`;
  if (i?.tipo === "objeto") return i.objeto;
  return JSON.stringify(i);
}

function textoDeOpcion(p: Pregunta, buscada: string): string {
  const halladas = (p.opciones ?? []).filter((o) => claveImagen(o.imagen) === buscada);
  if (halladas.length !== 1) throw new Error(`Se esperaba una opción ${buscada}: ${p.enunciado}`);
  return (halladas[0] as { texto: string }).texto;
}

// Valor del hueco según el menor periodo compatible, con cada clase ya vista.
function huecoPeriodico(claves: readonly (string | null)[]): string {
  const hueco = claves.indexOf(null);
  for (let periodo = 1; periodo < claves.length; periodo += 1) {
    const clases = new Map<number, string>();
    const vale = claves.every((c, i) => {
      if (c === null) return true;
      const previo = clases.get(i % periodo);
      clases.set(i % periodo, c);
      return previo === undefined || previo === c;
    });
    const valor = clases.get(hueco % periodo);
    if (vale && valor !== undefined) {
      // Se exigen dos vueltas: si no, el patrón no estaría a la vista.
      if (claves.length < 2 * periodo) throw new Error("Patrón sin dos vueltas");
      return valor;
    }
  }
  throw new Error("Sin periodo");
}

const serieDibujos: Oraculo = (p) => textoDeOpcion(p, huecoPeriodico(elementos(p).map(clave)));

const dobleAtributo = (p: Pregunta): string => {
  const figuras = elementos(p);
  const formas = figuras.map((e) => ("forma" in e ? e.forma : null));
  const colores = figuras.map((e) => ("forma" in e ? e.color : null));
  return textoDeOpcion(p, `${huecoPeriodico(formas)}/${huecoPeriodico(colores)}`);
};

const creciente = (p: Pregunta): string => {
  const claves = elementos(p).map(clave);
  const conocidas = claves.filter((c): c is string => c !== null);
  const a = conocidas[0] as string;
  const b = conocidas.find((c) => c !== a) as string;
  const completa = [a, b, a, a, b, a, a, a, b];
  return textoDeOpcion(p, completa[claves.indexOf(null)] as string);
};

const lugarLejano = (p: Pregunta): string => {
  const claves = elementos(p).map(clave);
  const lugar = Number(/lugar número (\d+)/.exec(p.enunciado)?.[1]);
  const periodo = new Set(claves).size;
  return textoDeOpcion(p, claves[(lugar - 1) % periodo] as string);
};

export const oraculoFiguras: Oraculo = (p) => {
  if (p.enunciado.includes("a su ritmo")) return dobleAtributo(p);
  if (p.enunciado.includes("un dibujo más antes")) return creciente(p);
  if (p.enunciado.includes("lugar número")) return lugarLejano(p);
  return serieDibujos(p);
};

// Familias de reglas que conoce un niño de 2.º. El valor debe ser el único que encaja.
function encaja(v: readonly number[]): boolean {
  const d = v.slice(1).map((x, i) => x - (v[i] as number));
  const constante = (l: readonly number[]) => l.every((x) => x === l[0]);
  const alterna = d.every((x, i) => i < 2 || x === d[i - 2]);
  const segundas = d.slice(1).map((x, i) => x - (d[i] as number));
  const doble = v.every((x, i) => i === 0 || x === 2 * (v[i - 1] as number));
  return constante(d) || alterna || (constante(segundas) && segundas[0] === 1) || doble;
}

export const oraculoNumeros: Oraculo = (p) => {
  const valores = elementos(p).map((e) => (e !== undefined && "texto" in e ? Number(e.texto) : null));
  if (p.enunciado.includes("regla")) {
    const v = valores as number[];
    const paso = (v[1] as number) - (v[0] as number);
    return `${paso > 0 ? "Suma" : "Resta"} ${Math.abs(paso)} cada vez`;
  }
  const hueco = valores.indexOf(null);
  const posibles: number[] = [];
  for (let x = 0; x <= 200; x += 1) {
    if (encaja(valores.map((v, i) => (i === hueco ? x : (v as number))))) posibles.push(x);
  }
  if (posibles.length !== 1) throw new Error(`Serie ambigua (${posibles.join(",")}): ${p.enunciado}`);
  return String(posibles[0]);
};

// Grupos que comparten forma o color, y conteos.
const COLORES: Readonly<Record<string, string>> = { rojo: "rojo", roja: "rojo", rojas: "rojo", rojos: "rojo", azul: "azul", azules: "azul", verde: "verde", verdes: "verde", amarillo: "amarillo", amarilla: "amarillo", amarillas: "amarillo", amarillos: "amarillo", morado: "morado", morada: "morado", moradas: "morado", morados: "morado", naranja: "naranja", naranjas: "naranja" };
const FORMAS: Readonly<Record<string, string>> = { círculo: "circulo", círculos: "circulo", cuadrado: "cuadrado", cuadrados: "cuadrado", triángulo: "triangulo", triángulos: "triangulo", estrella: "estrella", estrellas: "estrella", rombo: "rombo", rombos: "rombo" };

export const oraculoAgrupar: Oraculo = (p) => {
  const palabras = p.enunciado.replace(/[¿?.:,]/g, " ").split(/\s+/);
  const color = palabras.map((w) => COLORES[w]).find((c) => c !== undefined);
  const forma = palabras.map((w) => FORMAS[w]).find((f) => f !== undefined);
  if (p.formato === "numero") {
    const figuras = elementos(p).filter((e) => "forma" in e) as readonly { forma: string; color: string }[];
    if (p.enunciado.includes("grupos")) return String(new Set(figuras.map((f) => f.color)).size);
    return String(figuras.filter((f) => (color === undefined || f.color === color) && (forma === undefined || f.forma === forma)).length);
  }
  if (p.imagen === undefined) return textoDeOpcion(p, `${forma ?? ""}/${color ?? ""}`);
  const figuras = elementos(p).filter((e) => "forma" in e) as readonly { forma: string; color: string }[];
  const mismoColor = new Set(figuras.map((f) => f.color)).size === 1;
  const comun = mismoColor ? (figuras[0] as { color: string }).color : (figuras[0] as { forma: string }).forma;
  const validas = (p.opciones ?? []).filter((o) => o.imagen?.tipo === "figura" && (mismoColor ? o.imagen.color : o.imagen.forma) === comun);
  if (validas.length !== 1) throw new Error(`Grupo ambiguo: ${p.enunciado}`);
  return (validas[0] as { texto: string }).texto;
};

// El igual: la única opción idéntica al modelo.
export const oraculoIgual: Oraculo = (p) => {
  const modelo = p.imagen;
  if (modelo?.tipo === "serie" && modelo.elementos.length === 1) return clave(modelo.elementos[0] as ElementoSerie) ?? "";
  const iguales = (p.opciones ?? []).filter((o) => JSON.stringify(o.imagen) === JSON.stringify(modelo));
  if (iguales.length !== 1) throw new Error(`Sin igual único: ${p.enunciado}`);
  return (iguales[0] as { texto: string }).texto;
};

export const oraculoFaltan: Oraculo = (p) => {
  if (p.formato !== "numero") return (p.opciones ?? []).find((o) => o.id === p.respuestaCorrecta)?.texto ?? "";
  const m = /^(\d+) .*Hay (\d+) /.exec(p.enunciado);
  return String(Number(m?.[1]) - Number(m?.[2]));
};

// Solo lo necesario suma justo las monedas que hay.
export const oraculoPresupuesto: Oraculo = (p) => {
  const m = /^Tienes (\d+) monedas\. Necesitas (.+?) para .*?cuesta (\d+) monedas?, y (.+?) para .*?cuesta (\d+) monedas?\./.exec(p.enunciado);
  if (m === null) return (p.opciones ?? []).find((o) => o.id === p.respuestaCorrecta)?.texto ?? "";
  if (Number(m[1]) !== Number(m[3]) + Number(m[5])) throw new Error(`No cuadra: ${p.enunciado}`);
  const a = m[2] as string;
  return `${a.charAt(0).toUpperCase()}${a.slice(1)} y ${m[4] as string}`;
};
