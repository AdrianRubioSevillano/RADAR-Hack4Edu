// Descripción accesible en guaraní de las imágenes que usa NUM2. SUPUESTO: sin revisar por
// hablantes nativos (docs/GLOSARIO_GN.md). Devuelve null si el tipo de imagen no se usa ahí.
import type { ElementoSerie, Imagen, ObjetoId } from "./tipos.ts";

const OBJETOS: Readonly<Partial<Record<ObjetoId, string>>> = {
  manzana: "manzana", naranja: "narã", lapiz: "lápiz", libro: "aranduka", cuaderno: "kuaderno", pelota: "pelota", flor: "yvoty", pajaro: "guyra",
  huevo: "rupi'a", mochila: "mochila", paraguas: "paraguas", gorro: "akãngao", taza: "kópa", botella: "mbotella", silla: "apyka",
};

const nombre = (o: ObjetoId): string => OBJETOS[o] ?? "mba'e";

function elemento(e: ElementoSerie): string {
  if ("hueco" in e) return "pa'ũ";
  if ("texto" in e) return e.texto;
  return "objeto" in e ? nombre(e.objeto) : "ta'anga";
}

export function describirImagenGn(imagen: Imagen): string | null {
  switch (imagen.tipo) {
    case "objetos":
      return imagen.grupos.map((g) => `${g.cantidad} ${nombre(g.objeto)}.`).join(" ");
    case "objeto":
      return `${nombre(imagen.objeto)}.`;
    case "serie":
      return `Rysýi: ${imagen.elementos.map(elemento).join("; ")}.`;
    case "monedas":
      return `${imagen.valores.length} moneda: ${imagen.valores.join(", ")}.`;
    case "reloj":
      return `Aravopapaha: aguja mbyky ${imagen.minuto === 0 ? `oĩ ${imagen.hora}-pe` : `ohasáma ${imagen.hora}-gui`}, aguja puku oĩ ${imagen.minuto === 0 ? 12 : 6}-pe.`;
    case "decenas":
      return `Bloque: ${imagen.decenas} bloque puku ha ${imagen.unidades} bloque michĩ.`;
    case "tabla":
      return [imagen.titulo ?? "", ...imagen.filas.map((f) => f.filter((c) => c !== "").join(", "))].filter((t) => t !== "").join(". ");
    case "cartel":
      return [imagen.titulo, ...imagen.lineas].join(". ");
    default:
      return null;
  }
}
