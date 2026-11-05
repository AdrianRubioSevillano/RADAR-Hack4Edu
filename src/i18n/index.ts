// Idiomas de la interfaz. Las claves salen de es.ts: si a fr.ts o gn.ts les falta una
// (o les sobra), TypeScript da error. Las preguntas siguen en español por ahora.
import { es } from "./es.ts";
import { fr } from "./fr.ts";
import { gn } from "./gn.ts";

export const IDIOMAS = ["es", "fr", "gn"] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_DEFECTO: Idioma = "es";

// Cada idioma se nombra en su propia lengua: quien no lee la actual sigue encontrándolo.
export const NOMBRE_IDIOMA: Readonly<Record<Idioma, string>> = { es: "Español", fr: "Français", gn: "Avañe'ẽ" };

export type Clave = keyof typeof es;
export type Diccionario = Readonly<Record<Clave, string>>;
export type Variables = Readonly<Record<string, string | number>>;
export type Traductor = (clave: Clave, variables?: Variables) => string;

export const DICCIONARIOS: Readonly<Record<Idioma, Diccionario>> = { es, fr, gn };

export function esIdioma(valor: unknown): valor is Idioma {
  return IDIOMAS.some((i) => i === valor);
}

export function esClave(texto: string): texto is Clave {
  return Object.hasOwn(es, texto);
}

export function traducir(idioma: Idioma, clave: Clave, variables: Variables = {}): string {
  return DICCIONARIOS[idioma][clave].replace(/\{(\w+)\}/g, (marca, nombre: string) => String(variables[nombre] ?? marca));
}

export function crearT(idioma: Idioma): Traductor {
  return (clave, variables) => traducir(idioma, clave, variables);
}
