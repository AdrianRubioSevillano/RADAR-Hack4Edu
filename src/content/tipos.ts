// Contrato del contenido: lo que producen los generadores y consume la app.
import type { Rng } from "../core/rng.ts";
import type { Lengua } from "./lengua.ts";

export type Bloque = "NUM" | "LEE" | "PEN";
export type Curso = 1 | 2 | 3 | 4 | 5 | 6;
export type Dificultad = 1 | 2 | 3;

export interface TemaBruto {
  readonly bloque: Bloque;
  readonly curso: Curso;
  readonly numero: number;
  readonly nombre: string;
  readonly subhabilidades: readonly string[];
}

export interface Subhabilidad {
  readonly id: string; // NUM2-T3-b
  readonly tema: string; // NUM2-T3
  readonly nombre: string;
  readonly orden: number; // posición dentro del tema: a = 0, b = 1, c = 2
}

export interface Tema {
  readonly id: string; // NUM2-T3
  readonly bloque: Bloque;
  readonly curso: Curso;
  readonly numero: number;
  readonly nombre: string;
  readonly subhabilidades: readonly Subhabilidad[];
}

// Dibujos disponibles. Son datos: los pinta src/components/Ilustracion.tsx.
export const OBJETOS = [
  "manzana", "pera", "naranja", "lapiz", "libro", "cuaderno", "pelota", "flor", "arbol", "hoja",
  "estrella", "sol", "luna", "nube", "casa", "pez", "pajaro", "gato", "perro", "mariposa",
  "pato", "rana", "vaca", "oso", "elefante", "hormiga", "moneda", "vaso", "botella", "taza",
  "llave", "mesa", "silla", "cama", "puerta", "ventana", "zapato", "gorro", "mochila", "paraguas",
  "coche", "bicicleta", "barco", "tren", "avion", "cubo", "caja", "dado", "tijeras", "reloj",
  "lupa", "jabon", "grifo", "cepillo", "huevo", "uva", "pan", "mano", "ojo", "dedo",
] as const;
export type ObjetoId = (typeof OBJETOS)[number];

export const FORMAS = ["circulo", "cuadrado", "triangulo", "rectangulo", "rombo", "pentagono", "hexagono", "ovalo", "estrella"] as const;
export type FormaId = (typeof FORMAS)[number];

export const COLORES = ["rojo", "azul", "verde", "amarillo", "morado", "naranja"] as const;
export type ColorId = (typeof COLORES)[number];

export type ElementoSerie =
  | { readonly forma: FormaId; readonly color: ColorId }
  | { readonly objeto: ObjetoId }
  | { readonly texto: string }
  | { readonly hueco: true };

export type Imagen =
  // Varios grupos de objetos, uno al lado del otro. `tachados` dibuja una cruz sobre los últimos.
  | { readonly tipo: "objetos"; readonly grupos: readonly { readonly objeto: ObjetoId; readonly cantidad: number; readonly tachados?: number; readonly etiqueta?: string }[] }
  | { readonly tipo: "objeto"; readonly objeto: ObjetoId }
  | { readonly tipo: "figura"; readonly forma: FormaId; readonly color: ColorId }
  | { readonly tipo: "serie"; readonly elementos: readonly ElementoSerie[] }
  | { readonly tipo: "monedas"; readonly valores: readonly number[] } // cada moneda con su valor
  | { readonly tipo: "reloj"; readonly hora: number; readonly minuto: number } // analógico, hora 1–12
  | { readonly tipo: "decenas"; readonly decenas: number; readonly unidades: number; readonly centenas?: number } // bloques
  | { readonly tipo: "fraccion"; readonly forma: "circulo" | "barra"; readonly partes: number; readonly coloreadas: number }
  | { readonly tipo: "barras"; readonly titulo: string; readonly etiquetas: readonly string[]; readonly valores: readonly number[] }
  | { readonly tipo: "tabla"; readonly titulo?: string; readonly cabeceras: readonly string[]; readonly filas: readonly (readonly string[])[] }
  | { readonly tipo: "rectangulo"; readonly ancho: number; readonly alto: number; readonly unidad: string } // con medidas rotuladas
  | { readonly tipo: "recta"; readonly desde: number; readonly hasta: number; readonly paso: number; readonly marca?: number }
  | { readonly tipo: "tiras"; readonly tiras: readonly { readonly etiqueta: string; readonly largo: number }[] } // comparar longitudes
  | { readonly tipo: "balanza"; readonly izquierda: ObjetoId; readonly derecha: ObjetoId; readonly baja: "izquierda" | "derecha" | "ninguna" }
  // Cartel, aviso, etiqueta, horario, nota, recibo, folleto, infografía... en formato de texto.
  | { readonly tipo: "cartel"; readonly estilo: "aviso" | "horario" | "etiqueta" | "nota" | "recibo" | "folleto" | "infografia"; readonly titulo: string; readonly lineas: readonly string[] };

export type Formato = "opcion" | "numero" | "imagen";

export interface Opcion {
  readonly id: string; // a, b, c, d
  readonly texto: string; // también es la etiqueta accesible si la opción es una imagen
  readonly imagen?: Imagen;
}

export interface Pregunta {
  readonly id: string; // {subhabilidad}:{hash del contenido}
  readonly subhabilidad: string;
  readonly dificultad: Dificultad;
  readonly formato: Formato;
  readonly enunciado: string;
  readonly enunciadoFacil: string; // frases cortas, para dislexia
  readonly texto?: string; // lectura o situación larga que acompaña a la pregunta
  readonly titulo?: string; // título de esa lectura
  readonly imagen?: Imagen;
  readonly opciones?: readonly Opcion[];
  readonly respuestaCorrecta: string; // id de opción, o número canónico (entero, "3,5" o "3/4")
  readonly pista: string;
  readonly explicacion: string; // una o dos frases, lenguaje de niño
  readonly slip: number; // SUPUESTO
  readonly guess: number; // SUPUESTO
  readonly plantilla?: string; // clave de la plantilla: evita preguntas casi iguales en un test
  readonly idioma?: Lengua; // en qué está escrita; sin este campo, en español
}

export type Generador = (rng: Rng, dificultad: Dificultad) => Pregunta;

// Generadores por id de subhabilidad.
export type MapaGeneradores = Readonly<Record<string, readonly Generador[]>>;
