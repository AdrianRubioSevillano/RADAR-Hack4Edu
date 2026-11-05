// Descripción accesible de las imágenes en francés. Es lo que lee el lector de pantalla.
import type { ColorId, ElementoSerie, FormaId, Imagen, ObjetoId } from "./tipos.ts";

const m = (sg: string, pl = `${sg}s`): readonly [string, string, boolean] => [sg, pl, false];
const f = (sg: string, pl = `${sg}s`): readonly [string, string, boolean] => [sg, pl, true];

const OBJETOS: Readonly<Record<ObjetoId, readonly [string, string, boolean]>> = {
  manzana: f("pomme"), pera: f("poire"), naranja: f("orange"), lapiz: m("crayon"), libro: m("livre"), cuaderno: m("cahier"), pelota: m("ballon"), flor: f("fleur"), arbol: m("arbre"), hoja: f("feuille"),
  estrella: f("étoile"), sol: m("soleil"), luna: f("lune"), nube: m("nuage"), casa: f("maison"), pez: m("poisson"), pajaro: m("oiseau", "oiseaux"), gato: m("chat"), perro: m("chien"), mariposa: m("papillon"),
  pato: m("canard"), rana: f("grenouille"), vaca: f("vache"), oso: m("ours", "ours"), elefante: m("éléphant"), hormiga: f("fourmi"), moneda: f("pièce"), vaso: m("verre"), botella: f("bouteille"), taza: f("tasse"),
  llave: f("clé"), mesa: f("table"), silla: f("chaise"), cama: m("lit"), puerta: f("porte"), ventana: f("fenêtre"), zapato: f("chaussure"), gorro: m("bonnet"), mochila: m("sac à dos", "sacs à dos"), paraguas: m("parapluie"),
  coche: f("voiture"), bicicleta: m("vélo"), barco: m("bateau", "bateaux"), tren: m("train"), avion: m("avion"), cubo: m("seau", "seaux"), caja: f("boîte"), dado: m("dé"), tijeras: f("paire de ciseaux", "paires de ciseaux"), reloj: f("horloge"),
  lupa: f("loupe"), jabon: m("savon"), grifo: m("robinet"), cepillo: f("brosse"), huevo: m("œuf"), uva: m("raisin"), pan: m("pain"), mano: f("main"), ojo: m("œil", "yeux"), dedo: m("doigt"),
};

const FORMAS: Readonly<Record<FormaId, readonly [string, boolean]>> = {
  circulo: ["cercle", false], cuadrado: ["carré", false], triangulo: ["triangle", false], rectangulo: ["rectangle", false], rombo: ["losange", false],
  pentagono: ["pentagone", false], hexagono: ["hexagone", false], ovalo: ["ovale", false], estrella: ["étoile", true],
};

const COLORES: Readonly<Record<ColorId, readonly [string, string]>> = {
  rojo: ["rouge", "rouge"], azul: ["bleu", "bleue"], verde: ["vert", "verte"], amarillo: ["jaune", "jaune"], morado: ["violet", "violette"], naranja: ["orange", "orange"],
};

const ESTILOS = { aviso: "Panneau", horario: "Horaire", etiqueta: "Étiquette", nota: "Note", recibo: "Reçu", folleto: "Dépliant", infografia: "Infographie" } as const;

const numero = (n: number): string => String(Math.round(n * 1e6) / 1e6).replace(".", ",");
const mayuscula = (t: string): string => t.charAt(0).toLocaleUpperCase("fr") + t.slice(1);

function frase(texto: string): string {
  const limpio = texto.trim();
  if (limpio === "") return "";
  return /[.!?:;…]$/.test(limpio) ? limpio : `${limpio}.`;
}

function enumerar(partes: readonly string[]): string {
  if (partes.length < 2) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} et ${partes[partes.length - 1] ?? ""}`;
}

function articulo(objeto: ObjetoId): string {
  const [sg, , femenino] = OBJETOS[objeto];
  return `${femenino ? "une" : "un"} ${sg}`;
}

const cantidad = (objeto: ObjetoId, n: number): string => (n === 1 ? articulo(objeto) : `${n} ${OBJETOS[objeto][1]}`);

function describirGrupo(g: Extract<Imagen, { tipo: "objetos" }>["grupos"][number]): string {
  const tachados = Math.min(Math.max(g.tachados ?? 0, 0), g.cantidad);
  const base = cantidad(g.objeto, g.cantidad);
  const texto = tachados === 0 ? base : tachados === g.cantidad ? `${base}, toutes barrées` : `${base}, dont ${tachados} barrées`;
  return g.etiqueta === undefined ? texto : `${g.etiqueta} : ${texto}`;
}

function describirForma(forma: FormaId, color: ColorId): string {
  const [nombre, femenino] = FORMAS[forma];
  return `${femenino ? "une" : "un"} ${nombre} ${COLORES[color][femenino ? 1 : 0]}`;
}

function describirElemento(e: ElementoSerie): string {
  if ("hueco" in e) return "un trou";
  if ("texto" in e) return e.texto;
  if ("objeto" in e) return articulo(e.objeto);
  return describirForma(e.forma, e.color);
}

function describirMonedas(valores: readonly number[]): string {
  if (valores.length === 0) return "Aucune pièce.";
  if (valores.length === 1) return `Une pièce de ${numero(valores[0] ?? 0)}.`;
  const cuentas = new Map<number, number>();
  for (const v of valores) cuentas.set(v, (cuentas.get(v) ?? 0) + 1);
  return `${valores.length} pièces : ${enumerar([...cuentas].map(([v, n]) => `${n === 1 ? "une" : n} de ${numero(v)}`))}.`;
}

function describirReloj(hora: number, minuto: number): string {
  const h = ((((Math.trunc(hora) - 1) % 12) + 12) % 12) + 1;
  const min = ((Math.trunc(minuto) % 60) + 60) % 60;
  const corta = min === 0 ? `sur le ${h}` : `entre le ${h} et le ${(h % 12) + 1}`;
  const num = Math.floor(min / 5) === 0 ? 12 : Math.floor(min / 5);
  const resto = min % 5;
  const larga = resto === 0 ? `sur le ${num}` : `${resto} traits après le ${num}`;
  return `Horloge à aiguilles : petite aiguille ${corta}, grande aiguille ${larga}.`;
}

const bloques = (n: number, una: string, varias: string, ninguna: string): string => (n === 0 ? ninguna : n === 1 ? una : `${n} ${varias}`);

function describirTabla(imagen: Extract<Imagen, { tipo: "tabla" }>): string {
  const inicio = imagen.titulo === undefined ? "Tableau." : `Tableau : ${frase(imagen.titulo)}`;
  const filas = imagen.filas.map((fila, i) => `Ligne ${i + 1}. ${fila.map((c, j) => (imagen.cabeceras[j] === undefined ? c : `${imagen.cabeceras[j]} : ${c}`)).join(" ; ")}.`);
  return [inicio, `Colonnes : ${imagen.cabeceras.join(" ; ")}.`, ...filas].join(" ");
}

export function describirImagenFr(imagen: Imagen): string {
  switch (imagen.tipo) {
    case "objetos":
      return imagen.grupos.length === 0 ? "Aucun objet." : imagen.grupos.map((g) => frase(mayuscula(describirGrupo(g)))).join(" ");
    case "objeto":
      return frase(mayuscula(articulo(imagen.objeto)));
    case "figura":
      return frase(mayuscula(describirForma(imagen.forma, imagen.color)));
    case "serie":
      return imagen.elementos.length === 0 ? "Suite vide." : `Suite dans l'ordre : ${imagen.elementos.map(describirElemento).join(" ; ")}.`;
    case "monedas":
      return describirMonedas(imagen.valores);
    case "reloj":
      return describirReloj(imagen.hora, imagen.minuto);
    case "decenas": {
      const partes = [bloques(imagen.decenas, "une barre de dix", "barres de dix", "aucune barre de dix"), bloques(imagen.unidades, "un petit cube seul", "petits cubes seuls", "aucun petit cube seul")];
      if ((imagen.centenas ?? 0) > 0) partes.unshift(bloques(imagen.centenas ?? 0, "une plaque de cent", "plaques de cent", ""));
      return `Blocs : ${enumerar(partes)}.`;
    }
    case "fraccion":
      return `${imagen.forma === "circulo" ? "Cercle divisé" : "Barre divisée"} en ${imagen.partes} parties égales, avec ${bloques(imagen.coloreadas, "une partie coloriée", "parties coloriées", "aucune partie coloriée")}.`;
    case "barras":
      return `Diagramme en barres : ${frase(imagen.titulo)} ${imagen.etiquetas.map((e, i) => `${e} : ${numero(imagen.valores[i] ?? 0)}`).join(" ; ")}.`;
    case "tabla":
      return describirTabla(imagen);
    case "rectangulo":
      return `Rectangle de ${numero(imagen.ancho)} ${imagen.unidad} de large et ${numero(imagen.alto)} ${imagen.unidad} de haut.`;
    case "recta": {
      const base = `Droite graduée de ${numero(imagen.desde)} à ${numero(imagen.hasta)}, de ${numero(imagen.paso)} en ${numero(imagen.paso)}.`;
      return imagen.marca === undefined ? base : `${base} Une flèche montre le ${numero(imagen.marca)}.`;
    }
    case "tiras":
      return imagen.tiras.length === 0 ? "Aucune bande." : `Bandes à comparer : ${imagen.tiras.map((t) => `${t.etiqueta}, ${numero(t.largo)} de long`).join(" ; ")}.`;
    case "balanza": {
      const lados = `Balance avec ${articulo(imagen.izquierda)} à gauche et ${articulo(imagen.derecha)} à droite.`;
      return imagen.baja === "ninguna" ? `${lados} Les deux côtés sont à la même hauteur.` : `${lados} Le côté ${imagen.baja === "izquierda" ? "gauche" : "droit"} descend.`;
    }
    case "cartel":
      return [`${ESTILOS[imagen.estilo]} : ${frase(imagen.titulo)}`, ...imagen.lineas.map(frase).filter((l) => l !== "")].join(" ");
  }
}
