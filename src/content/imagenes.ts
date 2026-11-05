// Descripción en español de cada Imagen, para lectores de pantalla y voz. Función pura.
// Da lo necesario para responder sin ver: lo que hay dibujado, sin hacer las cuentas.
import { describirImagenFr } from "./imagenesFr.ts";
import { describirImagenGn } from "./imagenesGn.ts";
import type { Lengua } from "./lengua.ts";
import type { ColorId, ElementoSerie, FormaId, Imagen, ObjetoId } from "./tipos.ts";

type Genero = "m" | "f";

export interface NombreObjeto {
  readonly singular: string;
  readonly plural: string;
  readonly genero: Genero;
  readonly soloPlural?: boolean; // "unas tijeras"
}

const m = (singular: string, plural: string): NombreObjeto => ({ singular, plural, genero: "m" });
const f = (singular: string, plural: string): NombreObjeto => ({ singular, plural, genero: "f" });

export const NOMBRES_OBJETOS: Readonly<Record<ObjetoId, NombreObjeto>> = {
  manzana: f("manzana", "manzanas"),
  pera: f("pera", "peras"),
  naranja: f("naranja", "naranjas"),
  lapiz: m("lápiz", "lápices"),
  libro: m("libro", "libros"),
  cuaderno: m("cuaderno", "cuadernos"),
  pelota: f("pelota", "pelotas"),
  flor: f("flor", "flores"),
  arbol: m("árbol", "árboles"),
  hoja: f("hoja", "hojas"),
  estrella: f("estrella", "estrellas"),
  sol: m("sol", "soles"),
  luna: f("luna", "lunas"),
  nube: f("nube", "nubes"),
  casa: f("casa", "casas"),
  pez: m("pez", "peces"),
  pajaro: m("pájaro", "pájaros"),
  gato: m("gato", "gatos"),
  perro: m("perro", "perros"),
  mariposa: f("mariposa", "mariposas"),
  pato: m("pato", "patos"),
  rana: f("rana", "ranas"),
  vaca: f("vaca", "vacas"),
  oso: m("oso", "osos"),
  elefante: m("elefante", "elefantes"),
  hormiga: f("hormiga", "hormigas"),
  moneda: f("moneda", "monedas"),
  vaso: m("vaso", "vasos"),
  botella: f("botella", "botellas"),
  taza: f("taza", "tazas"),
  llave: f("llave", "llaves"),
  mesa: f("mesa", "mesas"),
  silla: f("silla", "sillas"),
  cama: f("cama", "camas"),
  puerta: f("puerta", "puertas"),
  ventana: f("ventana", "ventanas"),
  zapato: m("zapato", "zapatos"),
  gorro: m("gorro", "gorros"),
  mochila: f("mochila", "mochilas"),
  paraguas: m("paraguas", "paraguas"),
  coche: m("coche", "coches"),
  bicicleta: f("bicicleta", "bicicletas"),
  barco: m("barco", "barcos"),
  tren: m("tren", "trenes"),
  avion: m("avión", "aviones"),
  cubo: m("cubo", "cubos"),
  caja: f("caja", "cajas"),
  dado: m("dado", "dados"),
  tijeras: { singular: "tijeras", plural: "tijeras", genero: "f", soloPlural: true },
  reloj: m("reloj", "relojes"),
  lupa: f("lupa", "lupas"),
  jabon: m("jabón", "jabones"),
  grifo: m("grifo", "grifos"),
  cepillo: m("cepillo", "cepillos"),
  huevo: m("huevo", "huevos"),
  uva: f("uva", "uvas"),
  pan: m("pan", "panes"),
  mano: f("mano", "manos"),
  ojo: m("ojo", "ojos"),
  dedo: m("dedo", "dedos"),
};

const NOMBRES_FORMAS: Readonly<Record<FormaId, { readonly nombre: string; readonly genero: Genero }>> = {
  circulo: { nombre: "círculo", genero: "m" },
  cuadrado: { nombre: "cuadrado", genero: "m" },
  triangulo: { nombre: "triángulo", genero: "m" },
  rectangulo: { nombre: "rectángulo", genero: "m" },
  rombo: { nombre: "rombo", genero: "m" },
  pentagono: { nombre: "pentágono", genero: "m" },
  hexagono: { nombre: "hexágono", genero: "m" },
  ovalo: { nombre: "óvalo", genero: "m" },
  estrella: { nombre: "estrella", genero: "f" },
};

const NOMBRES_COLORES: Readonly<Record<ColorId, Readonly<Record<Genero, string>>>> = {
  rojo: { m: "rojo", f: "roja" },
  azul: { m: "azul", f: "azul" },
  verde: { m: "verde", f: "verde" },
  amarillo: { m: "amarillo", f: "amarilla" },
  morado: { m: "morado", f: "morada" },
  naranja: { m: "naranja", f: "naranja" },
};

const ESTILOS_CARTEL = {
  aviso: "Aviso",
  horario: "Horario",
  etiqueta: "Etiqueta",
  nota: "Nota",
  recibo: "Recibo",
  folleto: "Folleto",
  infografia: "Infografía",
} as const;

// Número con coma decimal y sin ruido de coma flotante: 0.30000000000000004 → "0,3".
export function numeroEnTexto(n: number): string {
  return String(Math.round(n * 1e6) / 1e6).replace(".", ",");
}

function mayuscula(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase("es") + texto.slice(1);
}

function frase(texto: string): string {
  const limpio = texto.trim();
  if (limpio === "") return "";
  return /[.!?:;…]$/.test(limpio) ? limpio : `${limpio}.`;
}

function enumerar(partes: readonly string[]): string {
  if (partes.length < 2) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1] ?? ""}`;
}

function articuloDe(objeto: ObjetoId): string {
  const n = NOMBRES_OBJETOS[objeto];
  if (n.soloPlural === true) return `unas ${n.singular}`;
  return `${n.genero === "f" ? "una" : "un"} ${n.singular}`;
}

function cantidadDe(objeto: ObjetoId, cantidad: number): string {
  return cantidad === 1 ? articuloDe(objeto) : `${cantidad} ${NOMBRES_OBJETOS[objeto].plural}`;
}

function describirGrupo(grupo: Extract<Imagen, { tipo: "objetos" }>["grupos"][number]): string {
  const n = NOMBRES_OBJETOS[grupo.objeto];
  const base = cantidadDe(grupo.objeto, grupo.cantidad);
  const tachados = Math.min(Math.max(grupo.tachados ?? 0, 0), grupo.cantidad);
  const femenino = n.genero === "f";
  const adjetivo = (plural: boolean): string => `tachad${femenino ? "a" : "o"}${plural ? "s" : ""}`;
  let texto = base;
  if (tachados > 0 && tachados === grupo.cantidad) {
    if (tachados === 1) texto = `${base} ${adjetivo(n.soloPlural === true)}`;
    else texto = `${base}, ${femenino ? "todas" : "todos"} ${adjetivo(true)}`;
  } else if (tachados > 0) {
    const cuantos = tachados === 1 ? (femenino ? "una" : "uno") : String(tachados);
    texto = `${base}, ${cuantos} de ${femenino ? "ellas" : "ellos"} ${adjetivo(tachados > 1)}`;
  }
  return grupo.etiqueta === undefined ? texto : `${grupo.etiqueta}: ${texto}`;
}

function describirForma(forma: FormaId, color: ColorId): string {
  const { nombre, genero } = NOMBRES_FORMAS[forma];
  return `${genero === "f" ? "una" : "un"} ${nombre} ${NOMBRES_COLORES[color][genero]}`;
}

function describirElemento(elemento: ElementoSerie): string {
  if ("hueco" in elemento) return "un hueco";
  if ("texto" in elemento) return elemento.texto;
  if ("objeto" in elemento) return articuloDe(elemento.objeto);
  return describirForma(elemento.forma, elemento.color);
}

function describirMonedas(valores: readonly number[]): string {
  if (valores.length === 0) return "Ninguna moneda.";
  if (valores.length === 1) return `Una moneda de ${numeroEnTexto(valores[0] ?? 0)}.`;
  const cuentas = new Map<number, number>();
  for (const v of valores) cuentas.set(v, (cuentas.get(v) ?? 0) + 1);
  const partes = [...cuentas].map(([valor, n]) => `${n === 1 ? "una" : n} de ${numeroEnTexto(valor)}`);
  return `${valores.length} monedas: ${enumerar(partes)}.`;
}

function describirReloj(hora: number, minuto: number): string {
  const h = ((((Math.trunc(hora) - 1) % 12) + 12) % 12) + 1;
  const min = ((Math.trunc(minuto) % 60) + 60) % 60;
  // La aguja corta avanza con los minutos: se dice donde está dibujada de verdad.
  const corta = min === 0 ? `en el ${h}` : `entre el ${h} y el ${(h % 12) + 1}`;
  const numero = Math.floor(min / 5) === 0 ? 12 : Math.floor(min / 5);
  const resto = min % 5;
  const rayitas = resto === 1 ? "una rayita" : `${resto} rayitas`;
  const larga = resto === 0 ? `en el ${numero}` : `${rayitas} después del ${numero}`;
  return `Reloj de agujas: aguja corta ${corta}, aguja larga ${larga}.`;
}

function bloques(n: number, una: string, varias: string, ninguna: string): string {
  if (n === 0) return ninguna;
  return n === 1 ? una : `${n} ${varias}`;
}

function describirTabla(imagen: Extract<Imagen, { tipo: "tabla" }>): string {
  const inicio = imagen.titulo === undefined ? "Tabla." : `Tabla: ${frase(imagen.titulo)}`;
  const filas = imagen.filas.map((fila, i) => {
    const celdas = fila.map((celda, j) => {
      const cabecera = imagen.cabeceras[j];
      return cabecera === undefined ? celda : `${cabecera}: ${celda}`;
    });
    return `Fila ${i + 1}. ${celdas.join("; ")}.`;
  });
  return [inicio, `Columnas: ${imagen.cabeceras.join("; ")}.`, ...filas].join(" ");
}

export function describirImagen(imagen: Imagen, lengua: Lengua = "es"): string {
  if (lengua === "fr") return describirImagenFr(imagen);
  const enGuarani = lengua === "gn" ? describirImagenGn(imagen) : null;
  if (enGuarani !== null) return enGuarani;
  switch (imagen.tipo) {
    case "objetos":
      if (imagen.grupos.length === 0) return "Ningún objeto.";
      return imagen.grupos.map((g) => frase(mayuscula(describirGrupo(g)))).join(" ");
    case "objeto":
      return frase(mayuscula(articuloDe(imagen.objeto)));
    case "figura":
      return frase(mayuscula(describirForma(imagen.forma, imagen.color)));
    case "serie":
      if (imagen.elementos.length === 0) return "Serie vacía.";
      return `Serie en orden: ${imagen.elementos.map(describirElemento).join("; ")}.`;
    case "monedas":
      return describirMonedas(imagen.valores);
    case "reloj":
      return describirReloj(imagen.hora, imagen.minuto);
    case "decenas": {
      const partes = [
        bloques(imagen.decenas, "una barra de diez", "barras de diez", "ninguna barra de diez"),
        bloques(imagen.unidades, "un cubito suelto", "cubitos sueltos", "ningún cubito suelto"),
      ];
      if ((imagen.centenas ?? 0) > 0) partes.unshift(bloques(imagen.centenas ?? 0, "una placa de cien", "placas de cien", ""));
      return `Bloques: ${enumerar(partes)}.`;
    }
    case "fraccion": {
      const figura = imagen.forma === "circulo" ? "Círculo dividido" : "Barra dividida";
      const pintadas = bloques(imagen.coloreadas, "una parte coloreada", "partes coloreadas", "ninguna parte coloreada");
      return `${figura} en ${imagen.partes} partes iguales, con ${pintadas}.`;
    }
    case "barras": {
      const datos = imagen.etiquetas.map((e, i) => `${e}: ${numeroEnTexto(imagen.valores[i] ?? 0)}`);
      return `Gráfico de barras: ${frase(imagen.titulo)} ${datos.join("; ")}.`;
    }
    case "tabla":
      return describirTabla(imagen);
    case "rectangulo": {
      const medida = (n: number): string => `${numeroEnTexto(n)} ${imagen.unidad}`;
      return `Rectángulo de ${medida(imagen.ancho)} de ancho y ${medida(imagen.alto)} de alto.`;
    }
    case "recta": {
      const base = `Recta numérica del ${numeroEnTexto(imagen.desde)} al ${numeroEnTexto(imagen.hasta)}, de ${numeroEnTexto(imagen.paso)} en ${numeroEnTexto(imagen.paso)}.`;
      return imagen.marca === undefined ? base : `${base} Una flecha señala el ${numeroEnTexto(imagen.marca)}.`;
    }
    case "tiras": {
      if (imagen.tiras.length === 0) return "Ninguna tira.";
      const datos = imagen.tiras.map((t) => `${t.etiqueta}, ${numeroEnTexto(t.largo)} de largo`);
      return `Tiras para comparar: ${datos.join("; ")}.`;
    }
    case "balanza": {
      const lados = `Balanza con ${articuloDe(imagen.izquierda)} a la izquierda y ${articuloDe(imagen.derecha)} a la derecha.`;
      if (imagen.baja === "ninguna") return `${lados} Los dos lados están a la misma altura.`;
      return `${lados} Baja el lado ${imagen.baja === "izquierda" ? "izquierdo" : "derecho"}.`;
    }
    case "cartel": {
      const lineas = imagen.lineas.map(frase).filter((l) => l !== "");
      return [`${ESTILOS_CARTEL[imagen.estilo]}: ${frase(imagen.titulo)}`, ...lineas].join(" ");
    }
  }
}
