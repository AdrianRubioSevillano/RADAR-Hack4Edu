// Todos los dibujos se pintan y todas las descripciones sirven para responder sin ver.
import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Ilustracion, OBJETO_DIBUJOS } from "../../src/components/Ilustracion.tsx";
import { NOMBRES_OBJETOS, describirImagen } from "../../src/content/imagenes.ts";
import { COLORES, FORMAS, OBJETOS } from "../../src/content/tipos.ts";
import type { Imagen } from "../../src/content/tipos.ts";

const ESTILOS = ["aviso", "horario", "etiqueta", "nota", "recibo", "folleto", "infografia"] as const;

const EJEMPLOS: readonly Imagen[] = [
  { tipo: "objetos", grupos: [{ objeto: "manzana", cantidad: 8, tachados: 3 }, { objeto: "lapiz", cantidad: 20, etiqueta: "Caja" }] },
  { tipo: "objetos", grupos: [{ objeto: "pez", cantidad: 0 }] },
  { tipo: "objetos", grupos: [] },
  { tipo: "objeto", objeto: "paraguas" },
  { tipo: "figura", forma: "estrella", color: "amarillo" },
  { tipo: "serie", elementos: [{ forma: "circulo", color: "rojo" }, { objeto: "pato" }, { texto: "12" }, { hueco: true }] },
  { tipo: "serie", elementos: [] },
  { tipo: "monedas", valores: [5, 2, 2, 1, 100, 50, 20] },
  { tipo: "monedas", valores: [] },
  { tipo: "reloj", hora: 3, minuto: 30 },
  { tipo: "reloj", hora: 12, minuto: 0 },
  { tipo: "reloj", hora: 7, minuto: 42 },
  { tipo: "decenas", decenas: 3, unidades: 7 },
  { tipo: "decenas", decenas: 0, unidades: 0, centenas: 2 },
  { tipo: "decenas", decenas: 0, unidades: 0 },
  { tipo: "fraccion", forma: "circulo", partes: 4, coloreadas: 3 },
  { tipo: "fraccion", forma: "circulo", partes: 1, coloreadas: 1 },
  { tipo: "fraccion", forma: "circulo", partes: 2, coloreadas: 1 },
  { tipo: "fraccion", forma: "barra", partes: 5, coloreadas: 2 },
  { tipo: "barras", titulo: "Frutas que nos gustan", etiquetas: ["Pera", "Uva verde", "Kiwi"], valores: [7, 3, 12] },
  { tipo: "barras", titulo: "Sin datos", etiquetas: [], valores: [] },
  { tipo: "barras", titulo: "Todo cero", etiquetas: ["A"], valores: [0] },
  { tipo: "tabla", titulo: "Libros leídos", cabeceras: ["Nombre", "Libros"], filas: [["Ana", "3"], ["Leo", "5"]] },
  { tipo: "tabla", cabeceras: ["Día"], filas: [] },
  { tipo: "rectangulo", ancho: 6, alto: 3, unidad: "cm" },
  { tipo: "rectangulo", ancho: 1, alto: 20, unidad: "m" },
  { tipo: "recta", desde: 0, hasta: 10, paso: 2, marca: 6 },
  { tipo: "recta", desde: 0, hasta: 1, paso: 0.1 },
  { tipo: "recta", desde: 0, hasta: 1000, paso: 10, marca: 370 },
  { tipo: "recta", desde: 5, hasta: 5, paso: 0 },
  { tipo: "tiras", tiras: [{ etiqueta: "A", largo: 5 }, { etiqueta: "Tira larga", largo: 9 }] },
  { tipo: "tiras", tiras: [] },
  { tipo: "balanza", izquierda: "manzana", derecha: "huevo", baja: "izquierda" },
  { tipo: "balanza", izquierda: "dado", derecha: "dado", baja: "ninguna" },
  { tipo: "balanza", izquierda: "gato", derecha: "elefante", baja: "derecha" },
  ...ESTILOS.map((estilo) => ({ tipo: "cartel", estilo, titulo: "Título", lineas: ["Lunes: 9:00", "Total: 3 monedas"] }) as const),
];

const pintar = (imagen: Imagen, decorativa = false): string => renderToString(<Ilustracion imagen={imagen} decorativa={decorativa} />);
const veces = (texto: string, patron: RegExp): number => (texto.match(patron) ?? []).length;

function comprobarDescripcion(imagen: Imagen): void {
  const texto = describirImagen(imagen);
  expect(typeof texto).toBe("string");
  expect(texto.trim().length).toBeGreaterThan(3);
  expect(texto).not.toMatch(/undefined|NaN|null|\[object/);
}

describe("catálogo de dibujos", () => {
  it("hay un dibujo y un nombre por cada objeto, y nada más", () => {
    expect(Object.keys(OBJETO_DIBUJOS).sort()).toEqual([...OBJETOS].sort());
    expect(Object.keys(NOMBRES_OBJETOS).sort()).toEqual([...OBJETOS].sort());
    expect(OBJETOS).toHaveLength(60);
  });

  it.each(OBJETOS)("pinta y describe %s", (objeto) => {
    const imagen: Imagen = { tipo: "objeto", objeto };
    const html = pintar(imagen);
    expect(html).toContain("<svg");
    expect(html).toContain('viewBox="0 0 64 64"');
    expect(html).toMatch(/<(path|circle|rect|ellipse|polygon)/);
    expect(html).not.toMatch(/undefined|NaN/);
    comprobarDescripcion(imagen);
    comprobarDescripcion({ tipo: "objetos", grupos: [{ objeto, cantidad: 3, tachados: 1 }] });
  });

  it("todos los dibujos son distintos entre sí", () => {
    const dibujos = OBJETOS.map((objeto) => pintar({ tipo: "objeto", objeto }).replace(/aria-label="[^"]*"/, ""));
    expect(new Set(dibujos).size).toBe(OBJETOS.length);
  });

  it("no usa recursos externos", () => {
    for (const imagen of EJEMPLOS) expect(pintar(imagen)).not.toMatch(/https?:|<image|<img|xlink:href/);
  });

  it("todas las formas y colores se pintan, y cada color lleva su trama", () => {
    for (const forma of FORMAS) {
      for (const color of COLORES) {
        const imagen: Imagen = { tipo: "figura", forma, color };
        const html = pintar(imagen);
        expect(html).toContain("<pattern");
        expect(html).toMatch(/fill="url\(#ilu[a-zA-Z0-9]+-[a-z]+\)"/);
        expect(html).not.toMatch(/undefined|NaN/);
        comprobarDescripcion(imagen);
      }
    }
    const formas = FORMAS.map((forma) => pintar({ tipo: "figura", forma, color: "rojo" }).replace(/aria-label="[^"]*"/, ""));
    expect(new Set(formas).size).toBe(FORMAS.length);
    const colores = COLORES.map((color) => pintar({ tipo: "figura", forma: "cuadrado", color }).replace(/aria-label="[^"]*"/, "").replace(/ilu[a-zA-Z0-9]*-[a-z]+/g, ""));
    expect(new Set(colores).size).toBe(COLORES.length);
  });
});

describe("todos los tipos de imagen", () => {
  it("el catálogo de ejemplos cubre los 15 tipos", () => {
    expect(new Set(EJEMPLOS.map((e) => e.tipo)).size).toBe(15);
  });

  it.each(EJEMPLOS.map((imagen, i) => [`${i} ${imagen.tipo}`, imagen] as const))("%s", (_, imagen) => {
    for (const tamano of ["normal", "opcion"] as const) {
      const html = renderToString(<Ilustracion imagen={imagen} tamano={tamano} />);
      expect(html.length).toBeGreaterThan(20);
      expect(html).not.toMatch(/undefined|NaN|Infinity/);
      expect(html).toContain(`ilu-${tamano}`);
    }
    comprobarDescripcion(imagen);
  });
});

describe("accesibilidad", () => {
  const svg = EJEMPLOS.filter((e) => e.tipo !== "tabla" && e.tipo !== "cartel");

  it("los SVG llevan role=img, su descripción y focusable=false", () => {
    for (const imagen of svg) {
      const html = pintar(imagen);
      expect(html).toContain('role="img"');
      expect(html).toContain('focusable="false"');
      expect(html).toContain("aria-label=");
    }
    expect(pintar({ tipo: "objeto", objeto: "avion" })).toContain('aria-label="Un avión."');
  });

  it("los decorativos se ocultan y no llevan etiqueta", () => {
    for (const imagen of EJEMPLOS) {
      const html = pintar(imagen, true);
      expect(html).toContain('aria-hidden="true"');
      expect(html).not.toContain("aria-label=");
      expect(html).not.toContain('role="img"');
    }
  });

  it("la tabla es una tabla real con caption y th scope", () => {
    const html = pintar({ tipo: "tabla", titulo: "Libros", cabeceras: ["Nombre", "Libros"], filas: [["Ana", "3"]] });
    expect(html).toContain("<table");
    expect(html).toContain("Libros</caption>");
    expect(html).toContain('<th scope="col">Nombre</th>');
    expect(html).toContain('<th scope="row">Ana</th>');
    expect(html).toContain("<td>3</td>");
    expect(pintar({ tipo: "tabla", cabeceras: ["A"], filas: [] })).toContain("<caption");
  });

  it("el cartel es HTML con su texto y su estilo, sin SVG de contenido", () => {
    for (const estilo of ESTILOS) {
      const html = pintar({ tipo: "cartel", estilo, titulo: "Piscina", lineas: ["Abierto"] });
      expect(html).toContain("<figure");
      expect(html).toContain("<figcaption");
      expect(html).toContain(`ilu-cartel-${estilo}`);
      expect(html).toContain("Abierto");
    }
  });
});

describe("carteles con mucho texto", () => {
  const LARGA = "Recuerda: trae ropa cómoda, agua y una gorra para el sol de la tarde";
  const lineas = [LARGA, "Nombre: ________________", "________________________________________", "Lunes: 9:00", ...Array.from({ length: 5 }, (_, i) => `${i + 1}. ${LARGA}`)];

  it("se pintan las 9 líneas completas en todos los estilos", () => {
    expect(lineas).toHaveLength(9);
    for (const estilo of ESTILOS) {
      const imagen: Imagen = { tipo: "cartel", estilo, titulo: "Excursión", lineas };
      const html = pintar(imagen);
      expect(veces(html, /<(p|li)[ >]/g)).toBe(9);
      expect(html).toContain("________________________________________");
      comprobarDescripcion(imagen);
    }
  });

  it("una frase larga con dos puntos no se parte en columnas", () => {
    const html = pintar({ tipo: "cartel", estilo: "horario", titulo: "T", lineas: [LARGA, "Lunes: 9:00"] });
    expect(html).toContain(`<span>${LARGA}</span>`);
    expect(veces(html, /ilu-cartel-dato/g)).toBe(1);
  });

  it("los estilos ajustan el texto en vez de desbordar", () => {
    const css = readFileSync("src/components/ilustracion.css", "utf8");
    expect(veces(css, /overflow-wrap: anywhere/g)).toBeGreaterThanOrEqual(3);
  });
});

describe("detalles que hacen falta para responder", () => {
  it("objetos: las cruces van sobre los últimos y hay tantas como tachados", () => {
    const html = pintar({ tipo: "objetos", grupos: [{ objeto: "pera", cantidad: 7, tachados: 3 }] });
    expect(veces(html, /class="ilu-dibujo"/g)).toBe(7);
    expect(veces(html, /class="ilu-cruz"/g)).toBe(3);
    const ultimo = html.lastIndexOf('class="ilu-dibujo"');
    expect(html.indexOf('class="ilu-cruz"')).toBeLessThan(ultimo);
    expect(html.lastIndexOf('class="ilu-cruz"')).toBeGreaterThan(ultimo);
  });

  it("objetos: filas de 5", () => {
    const html = pintar({ tipo: "objetos", grupos: [{ objeto: "pera", cantidad: 20 }] });
    expect(veces(html, /class="ilu-dibujo"/g)).toBe(20);
    expect(html).toContain('viewBox="0 0 354 282"'); // 5 × 72 − 8 + 2 y 4 × 72 − 8 + 2
  });

  it("serie: el hueco es una casilla punteada con ?", () => {
    const html = pintar({ tipo: "serie", elementos: [{ texto: "2" }, { hueco: true }] });
    expect(html).toContain("stroke-dasharray");
    expect(html).toContain(">?</text>");
  });

  it("reloj: los 12 números y las agujas en su sitio", () => {
    const html = pintar({ tipo: "reloj", hora: 3, minuto: 0 });
    for (let n = 1; n <= 12; n++) expect(html).toContain(`>${n}</text>`);
    expect(html).toMatch(/ilu-aguja-corta" x1="120" y1="120" x2="160" y2="120"/);
    expect(html).toMatch(/ilu-aguja-larga" x1="120" y1="120" x2="120" y2="58"/);
  });

  it("barras: cada valor se lee en el eje y solo en el eje", () => {
    const html = pintar({ tipo: "barras", titulo: "Votos", etiquetas: ["A", "B", "C"], valores: [7, 3, 12] });
    for (const v of [7, 3, 12]) expect(veces(html, new RegExp(`>${v}</text>`, "g"))).toBe(1);
    expect(html).not.toContain("<text class=\"ilu-valor");
  });

  it("barras: la punta de cada barra cae sobre una línea de la rejilla", () => {
    for (const valores of [[35, 120], [7, 3, 12], [20, 40, 60], [13, 4], [0.5, 2], [1500, 250]]) {
      const html = pintar({ tipo: "barras", titulo: "Votos", etiquetas: valores.map((_, i) => `E${i}`), valores });
      const lineas = new Set([...html.matchAll(/class="ilu-rejilla"><line x1="[\d.]+" y1="([\d.]+)"/g)].map((m) => m[1]));
      const puntas = [...html.matchAll(/class="ilu-barra-dato" x="[\d.]+" y="([\d.]+)"/g)].map((m) => m[1]);
      expect(puntas).toHaveLength(valores.length);
      for (const y of puntas) expect(lineas.has(y)).toBe(true);
      expect(lineas.size).toBeLessThanOrEqual(25);
      expect(lineas.size).toBeGreaterThanOrEqual(4);
    }
  });

  it("decenas: una pieza por cada placa, barra y cubito", () => {
    const html = pintar({ tipo: "decenas", centenas: 2, decenas: 3, unidades: 7 });
    expect(veces(html, /class="ilu-placa"/g)).toBe(2);
    expect(veces(html, /class="ilu-barra"/g)).toBe(3);
    expect(veces(html, /class="ilu-cubito"/g)).toBe(7);
  });

  it("fracción: tantas partes como dice, y las coloreadas", () => {
    for (const forma of ["circulo", "barra"] as const) {
      const html = pintar({ tipo: "fraccion", forma, partes: 8, coloreadas: 3 });
      expect(veces(html, /class="ilu-parte"/g)).toBe(8);
      expect(veces(html, /fill="#F5912F"/g)).toBe(3);
    }
  });

  it("recta: rotula sin decir qué número marca la flecha", () => {
    const html = pintar({ tipo: "recta", desde: 0, hasta: 10, paso: 1, marca: 7 });
    expect(veces(html, /class="ilu-marca"/g)).toBe(1);
    expect(veces(html, />7<\/text>/g)).toBe(1);
    const entre = pintar({ tipo: "recta", desde: 0, hasta: 100, paso: 10, marca: 35 });
    expect(entre).not.toContain(">35</text>");
  });

  it("balanza: baja el lado indicado", () => {
    const alturas = (baja: "izquierda" | "derecha" | "ninguna"): readonly number[] => {
      const html = pintar({ tipo: "balanza", izquierda: "dado", derecha: "dado", baja });
      return [...html.matchAll(/class="ilu-platillo"><path d="M[\d.]+ ([\d.]+)L/g)].map((m) => Number(m[1]));
    };
    const [i1 = 0, d1 = 0] = alturas("izquierda");
    const [i2 = 0, d2 = 0] = alturas("derecha");
    const [i3 = 0, d3 = 0] = alturas("ninguna");
    expect(i1).toBeGreaterThan(d1);
    expect(d2).toBeGreaterThan(i2);
    expect(i3).toBe(d3);
  });
});

describe("describirImagen", () => {
  it("objetos: cantidades, plurales, tildes y concordancia", () => {
    expect(describirImagen({ tipo: "objetos", grupos: [{ objeto: "manzana", cantidad: 8, tachados: 3 }] })).toBe("8 manzanas, 3 de ellas tachadas.");
    expect(describirImagen({ tipo: "objetos", grupos: [{ objeto: "lapiz", cantidad: 5, tachados: 1 }] })).toBe("5 lápices, uno de ellos tachado.");
    expect(describirImagen({ tipo: "objetos", grupos: [{ objeto: "pez", cantidad: 3, tachados: 3 }] })).toBe("3 peces, todos tachados.");
    expect(describirImagen({ tipo: "objetos", grupos: [{ objeto: "flor", cantidad: 1, tachados: 1 }] })).toBe("Una flor tachada.");
    expect(describirImagen({ tipo: "objetos", grupos: [{ objeto: "avion", cantidad: 2, etiqueta: "Ana" }, { objeto: "arbol", cantidad: 1 }] })).toBe("Ana: 2 aviones. Un árbol.");
    expect(describirImagen({ tipo: "objeto", objeto: "tijeras" })).toBe("Unas tijeras.");
    expect(describirImagen({ tipo: "objetos", grupos: [{ objeto: "paraguas", cantidad: 4 }] })).toBe("4 paraguas.");
  });

  it("figura y serie", () => {
    expect(describirImagen({ tipo: "figura", forma: "estrella", color: "amarillo" })).toBe("Una estrella amarilla.");
    expect(describirImagen({ tipo: "figura", forma: "triangulo", color: "azul" })).toBe("Un triángulo azul.");
    expect(describirImagen({ tipo: "serie", elementos: [{ forma: "circulo", color: "rojo" }, { objeto: "pato" }, { texto: "3,5" }, { hueco: true }] })).toBe("Serie en orden: un círculo rojo; un pato; 3,5; un hueco.");
  });

  it("reloj: posición de las agujas, sin la hora calculada", () => {
    expect(describirImagen({ tipo: "reloj", hora: 3, minuto: 0 })).toBe("Reloj de agujas: aguja corta en el 3, aguja larga en el 12.");
    expect(describirImagen({ tipo: "reloj", hora: 3, minuto: 30 })).toBe("Reloj de agujas: aguja corta entre el 3 y el 4, aguja larga en el 6.");
    expect(describirImagen({ tipo: "reloj", hora: 12, minuto: 45 })).toBe("Reloj de agujas: aguja corta entre el 12 y el 1, aguja larga en el 9.");
    expect(describirImagen({ tipo: "reloj", hora: 7, minuto: 42 })).toBe("Reloj de agujas: aguja corta entre el 7 y el 8, aguja larga 2 rayitas después del 8.");
    expect(describirImagen({ tipo: "reloj", hora: 7, minuto: 42 })).not.toMatch(/7:42|siete y/);
  });

  it("barras, tabla y cartel dan todo su contenido", () => {
    expect(describirImagen({ tipo: "barras", titulo: "Votos", etiquetas: ["A", "B"], valores: [7, 3] })).toBe("Gráfico de barras: Votos. A: 7; B: 3.");
    const tabla = describirImagen({ tipo: "tabla", titulo: "Libros", cabeceras: ["Nombre", "Libros"], filas: [["Ana", "3"], ["Leo", "5"]] });
    for (const dato of ["Libros", "Nombre: Ana", "Libros: 3", "Nombre: Leo", "Libros: 5"]) expect(tabla).toContain(dato);
    expect(describirImagen({ tipo: "cartel", estilo: "aviso", titulo: "¡Cuidado!", lineas: ["Suelo mojado", "No correr."] })).toBe("Aviso: ¡Cuidado! Suelo mojado. No correr.");
  });

  it("monedas, bloques, fracción, rectángulo, recta, tiras y balanza", () => {
    expect(describirImagen({ tipo: "monedas", valores: [5, 2, 2, 1] })).toBe("4 monedas: una de 5, 2 de 2 y una de 1.");
    expect(describirImagen({ tipo: "monedas", valores: [5] })).toBe("Una moneda de 5.");
    expect(describirImagen({ tipo: "decenas", centenas: 1, decenas: 3, unidades: 1 })).toBe("Bloques: una placa de cien, 3 barras de diez y un cubito suelto.");
    expect(describirImagen({ tipo: "decenas", decenas: 2, unidades: 0 })).toBe("Bloques: 2 barras de diez y ningún cubito suelto.");
    expect(describirImagen({ tipo: "fraccion", forma: "barra", partes: 4, coloreadas: 3 })).toBe("Barra dividida en 4 partes iguales, con 3 partes coloreadas.");
    expect(describirImagen({ tipo: "rectangulo", ancho: 6, alto: 2.5, unidad: "cm" })).toBe("Rectángulo de 6 cm de ancho y 2,5 cm de alto.");
    expect(describirImagen({ tipo: "recta", desde: 0, hasta: 10, paso: 2, marca: 6 })).toBe("Recta numérica del 0 al 10, de 2 en 2. Una flecha señala el 6.");
    expect(describirImagen({ tipo: "tiras", tiras: [{ etiqueta: "A", largo: 5 }] })).toBe("Tiras para comparar: A, 5 de largo.");
    expect(describirImagen({ tipo: "balanza", izquierda: "manzana", derecha: "lapiz", baja: "derecha" })).toBe("Balanza con una manzana a la izquierda y un lápiz a la derecha. Baja el lado derecho.");
    expect(describirImagen({ tipo: "balanza", izquierda: "dado", derecha: "huevo", baja: "ninguna" })).toContain("misma altura");
  });

  it("es pura: no muta la imagen", () => {
    const imagen: Imagen = Object.freeze({ tipo: "monedas", valores: Object.freeze([1, 2]) });
    expect(describirImagen(imagen)).toBe(describirImagen(imagen));
  });
});
