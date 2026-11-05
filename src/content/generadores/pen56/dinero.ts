// Presupuesto (PEN5-T2) y decisiones con dinero (PEN6-T2). Todo se calcula en código.
import type { Rng } from "../../../core/rng.ts";
import { barajar, elegir, entero, monedas, muestra, nombre, pregunta } from "../../ayuda.ts";
import type { Dificultad, Generador, Imagen } from "../../tipos.ts";
import { capital, en, porDificultad, reintentar, unir } from "./comun.ts";

interface Producto {
  readonly singular: string;
  readonly plural: string;
  readonly genero: "m" | "f";
  readonly min: number;
  readonly max: number;
}

interface Tienda {
  readonly id: string;
  readonly lugar: string;
  readonly productos: readonly Producto[];
}

function prod(singular: string, plural: string, genero: "m" | "f", min: number, max: number): Producto {
  return { singular, plural, genero, min, max };
}

const TIENDAS: readonly Tienda[] = [
  {
    id: "escuela", lugar: "la tienda de material escolar",
    productos: [prod("cuaderno", "cuadernos", "m", 6, 12), prod("lápiz", "lápices", "m", 2, 5), prod("goma", "gomas", "f", 3, 6), prod("regla", "reglas", "f", 4, 9), prod("libro", "libros", "m", 15, 25)],
  },
  {
    id: "huerto", lugar: "la tienda del pueblo",
    productos: [prod("paquete de semillas", "paquetes de semillas", "m", 5, 9), prod("maceta", "macetas", "f", 4, 8), prod("regadera", "regaderas", "f", 12, 20), prod("pala", "palas", "f", 10, 18), prod("saco de tierra", "sacos de tierra", "m", 7, 14)],
  },
  {
    id: "mercado", lugar: "el mercado",
    productos: [prod("pan", "panes", "m", 2, 4), prod("botella de leche", "botellas de leche", "f", 3, 7), prod("kilo de fruta", "kilos de fruta", "m", 6, 10), prod("kilo de verduras", "kilos de verduras", "m", 5, 9), prod("docena de huevos", "docenas de huevos", "f", 11, 16)],
  },
  {
    id: "taller", lugar: "la ferretería",
    productos: [prod("caja de clavos", "cajas de clavos", "f", 5, 9), prod("martillo", "martillos", "m", 13, 19), prod("brocha", "brochas", "f", 4, 8), prod("bote de pintura", "botes de pintura", "m", 10, 17), prod("metro de cuerda", "metros de cuerda", "m", 2, 4)],
  },
];

function unidades(n: number, p: Producto): string {
  return `${n} ${n === 1 ? p.singular : p.plural}`;
}

function cuantos(p: Producto): string {
  return `${p.genero === "m" ? "¿Cuántos" : "¿Cuántas"} ${p.plural}`;
}

interface Linea {
  readonly producto: Producto;
  readonly precio: number;
}

// Productos al azar con precios distintos entre sí.
function surtido(rng: Rng, t: Tienda, n: number): Linea[] {
  return reintentar(() => {
    const lineas = muestra(rng, t.productos, n).map((producto) => ({ producto, precio: entero(rng, producto.min, producto.max) }));
    return new Set(lineas.map((l) => l.precio)).size === n ? lineas : null;
  });
}

function tablaPrecios(lineas: readonly Linea[]): Imagen {
  return { tipo: "tabla", titulo: "Precios", cabeceras: ["Producto", "Monedas"], filas: lineas.map((l) => [capital(l.producto.singular), String(l.precio)]) };
}

function pareja(a: Linea, b: Linea): string {
  return capital(unir([a.producto.singular, b.producto.singular]));
}

// ---------- PEN5-T2-a: gastar con un límite ----------
const SUB_LIMITE = "PEN5-T2-a";

function deTienda(crear: (rng: Rng, d: Dificultad, t: Tienda) => ReturnType<Generador>): Generador {
  return (rng, d) => crear(rng, d, elegir(rng, TIENDAS));
}

const sobra = deTienda((rng, dificultad, t) => {
  const lineas = surtido(rng, t, 3);
  const [a, b] = [en(lineas, 0), en(lineas, 1)];
  const [qa, qb] = [entero(rng, 1, 3), entero(rng, 1, 2)];
  const [ca, cb] = [qa * a.precio, qb * b.precio];
  const total = ca + cb;
  const limite = (Math.floor(total / 5) + entero(rng, 1, 3)) * 5;
  const resto = limite - total;
  const compra = unir([unidades(qa, a.producto), unidades(qb, b.producto)]);
  const n = nombre(rng);
  const rotulo = "¿Cuánto dinero le sobra, en monedas?";
  return pregunta(rng, {
    subhabilidad: SUB_LIMITE,
    dificultad,
    enunciado: `${n} tiene ${monedas(limite)} para gastar en ${t.lugar}. Compra ${compra}. Mira los precios. ${rotulo}`,
    enunciadoFacil: `${n} tiene ${monedas(limite)}. Compra ${compra}. Mira los precios. ${rotulo}`,
    imagen: tablaPrecios(lineas),
    respuesta: { tipo: "numero", valor: resto },
    pista: "Calcula primero cuánto cuesta cada producto según la cantidad. Suma y resta del dinero que tiene.",
    explicacion: `La compra cuesta ${ca} + ${cb} = ${total} monedas. Después, ${limite} − ${total} = ${resto}.`,
    plantilla: `${SUB_LIMITE}:sobra:${t.id}`,
  });
});

const parejaQueAlcanza = deTienda((rng, dificultad, t) => {
  const { lineas, pares, limite } = reintentar(() => {
    const ls = surtido(rng, t, 4);
    const todas: [Linea, Linea][] = [];
    ls.forEach((x, i) => ls.slice(i + 1).forEach((y) => todas.push([x, y])));
    const tres = muestra(rng, todas, 3).sort((x, y) => x[0].precio + x[1].precio - y[0].precio - y[1].precio);
    const sumas = tres.map((p) => p[0].precio + p[1].precio);
    const [s0, s1, s2] = [en(sumas, 0), en(sumas, 1), en(sumas, 2)];
    if (s0 + 1 >= s1 || s1 === s2) return null;
    return { lineas: ls, pares: tres, limite: entero(rng, s0, s1 - 1) };
  });
  const [buena, ...malas] = pares.map(([x, y]) => pareja(x, y));
  const [x, y] = en(pares, 0);
  const n = nombre(rng);
  return pregunta(rng, {
    subhabilidad: SUB_LIMITE,
    dificultad,
    enunciado: `${n} tiene ${monedas(limite)} para comprar dos productos en ${t.lugar}, uno de cada. Mira los precios. ¿Cuál de estas parejas puede pagar sin pasarse?`,
    enunciadoFacil: `${n} tiene ${monedas(limite)}. Compra dos productos, uno de cada. Mira los precios. ¿Qué pareja puede pagar?`,
    imagen: tablaPrecios(lineas),
    respuesta: { tipo: "opcion", correcta: buena ?? "", distractores: malas },
    pista: "Suma los dos precios de cada pareja y compara con el dinero que tiene.",
    explicacion: `Esa pareja cuesta ${x.precio} + ${y.precio} = ${x.precio + y.precio} monedas, y ${n} tiene ${limite}. Las otras dos cuestan más que su dinero.`,
    plantilla: `${SUB_LIMITE}:pareja:${t.id}`,
  });
});

const maximoUnidades = deTienda((rng, dificultad, t) => {
  const lineas = surtido(rng, t, 3);
  const [a, b] = [en(lineas, 0), en(lineas, 1)];
  const qa = entero(rng, 1, 3);
  const veces = entero(rng, 2, 6);
  const extra = entero(rng, 1, b.precio - 1);
  const queda = veces * b.precio + extra;
  const limite = qa * a.precio + queda;
  const n = nombre(rng);
  return pregunta(rng, {
    subhabilidad: SUB_LIMITE,
    dificultad,
    enunciado: `${n} tiene ${monedas(limite)}. Primero compra ${unidades(qa, a.producto)}. Con lo que le queda quiere comprar la mayor cantidad posible de ${b.producto.plural}. Mira los precios. ${cuantos(b.producto)} puede comprar?`,
    enunciadoFacil: `${n} tiene ${monedas(limite)}. Primero compra ${unidades(qa, a.producto)}. Después compra ${b.producto.plural} con lo que queda. Mira los precios. ${cuantos(b.producto)} puede comprar como máximo?`,
    imagen: tablaPrecios(lineas),
    respuesta: { tipo: "numero", valor: veces },
    pista: "Resta primero lo que tiene que comprar. Después mira cuántas veces cabe el precio en lo que queda.",
    explicacion: `Le quedan ${limite} − ${qa * a.precio} = ${queda} monedas. Como ${veces} × ${b.precio} = ${veces * b.precio} y una unidad más ya no alcanza, puede comprar ${veces}.`,
    plantilla: `${SUB_LIMITE}:maximo:${t.id}`,
  });
});

const quitarUno = deTienda((rng, dificultad, t) => {
  const lineas = surtido(rng, t, 4);
  const quitado = elegir(rng, lineas);
  const total = lineas.reduce((s, l) => s + l.precio, 0);
  const limite = total - quitado.precio;
  const lista = unir(lineas.map((l) => unidades(1, l.producto)));
  const n = nombre(rng);
  return pregunta(rng, {
    subhabilidad: SUB_LIMITE,
    dificultad,
    enunciado: `${n} tiene ${monedas(limite)} y en su lista hay ${lista}. Todo junto cuesta más de lo que tiene. Quiere quitar un solo producto y gastar exactamente su dinero. Mira los precios. ¿Qué producto debe quitar?`,
    enunciadoFacil: `${n} tiene ${monedas(limite)}. Su lista tiene ${lista}. No le alcanza para todo. Quiere quitar un producto. Quiere gastar todo su dinero justo. Mira los precios. ¿Qué producto quita?`,
    imagen: tablaPrecios(lineas),
    respuesta: { tipo: "opcion", correcta: capital(quitado.producto.singular), distractores: lineas.filter((l) => l !== quitado).map((l) => capital(l.producto.singular)) },
    pista: "Suma toda la lista y mira cuánto se pasa de su dinero. Ese exceso es el precio del producto que debe quitar.",
    explicacion: `Toda la lista cuesta ${total} monedas y tiene ${limite}, así que se pasa en ${total - limite}. Ese es justo el precio del producto que debe quitar.`,
    plantilla: `${SUB_LIMITE}:quitar:${t.id}`,
  });
});

const mejorPareja = deTienda((rng, dificultad, t) => {
  const { obligado, extras, limite, orden } = reintentar(() => {
    const ls = surtido(rng, t, 5);
    const ob = en(ls, 0);
    const resto = ls.slice(1);
    const pares: { a: Linea; b: Linea; suma: number }[] = [];
    resto.forEach((a, i) => resto.slice(i + 1).forEach((b) => pares.push({ a, b, suma: a.precio + b.precio })));
    const ordenados = [...pares].sort((x, y) => y.suma - x.suma);
    const corte = entero(rng, 1, ordenados.length - 3);
    const mejor = en(ordenados, corte);
    const encima = en(ordenados, corte - 1);
    const debajo = en(ordenados, corte + 1);
    if (mejor.suma === encima.suma || mejor.suma === debajo.suma) return null;
    return { obligado: ob, extras: resto, limite: ob.precio + entero(rng, mejor.suma, encima.suma - 1), orden: { mejor, encima, debajo, otro: en(ordenados, corte + 2) } };
  });
  const n = nombre(rng);
  const { mejor, encima, debajo, otro } = orden;
  const queda = limite - obligado.precio;
  return pregunta(rng, {
    subhabilidad: SUB_LIMITE,
    dificultad,
    enunciado: `${n} tiene ${monedas(limite)}. Debe comprar 1 ${obligado.producto.singular}. Además quiere dos productos distintos más y gastar lo máximo posible sin pasarse. Mira los precios. ¿Qué dos productos elige?`,
    enunciadoFacil: `${n} tiene ${monedas(limite)}. Debe comprar 1 ${obligado.producto.singular}. Quiere dos productos más, distintos. Quiere gastar lo máximo sin pasarse. Mira los precios. ¿Qué dos elige?`,
    imagen: tablaPrecios([obligado, ...barajar(rng, extras)]),
    respuesta: { tipo: "opcion", correcta: pareja(mejor.a, mejor.b), distractores: [pareja(encima.a, encima.b), pareja(debajo.a, debajo.b), pareja(otro.a, otro.b)] },
    pista: "Resta primero lo que debe comprar. Busca la pareja que más se acerque a lo que queda sin pasarse.",
    explicacion: `Tras la compra obligada le quedan ${queda} monedas. Esa pareja cuesta ${mejor.suma}: es la que más se acerca a ${queda} sin pasarse.`,
    plantilla: `${SUB_LIMITE}:mejorPareja:${t.id}`,
  });
});

const porDia = deTienda((rng, dificultad, t) => {
  const lineas = surtido(rng, t, 3);
  const [a, b] = [en(lineas, 0), en(lineas, 1)];
  const dias = entero(rng, 3, 7);
  const diario = entero(rng, 3, 12);
  const fijo = a.precio + b.precio;
  const limite = fijo + dias * diario;
  const compra = unir([unidades(1, a.producto), unidades(1, b.producto)]);
  return pregunta(rng, {
    subhabilidad: SUB_LIMITE,
    dificultad,
    enunciado: `Un grupo de la escuela tiene ${monedas(limite)} para un trabajo de ${dias} días. Primero paga ${compra}. El resto del dinero lo gasta por igual cada día. Mira los precios. ¿Cuántas monedas puede gastar cada día?`,
    enunciadoFacil: `Un grupo tiene ${monedas(limite)} para ${dias} días. Primero paga ${compra}. El resto se gasta igual cada día. Mira los precios. ¿Cuántas monedas gasta cada día?`,
    imagen: tablaPrecios(lineas),
    respuesta: { tipo: "numero", valor: diario },
    pista: "Resta primero lo que hay que pagar. Reparte lo que queda entre los días.",
    explicacion: `Quedan ${limite} − ${fijo} = ${limite - fijo} monedas. Repartidas en ${dias} días son ${diario} cada día.`,
    plantilla: `${SUB_LIMITE}:porDia:${t.id}`,
  });
});

const restoFinal = deTienda((rng, dificultad, t) => {
  const lineas = surtido(rng, t, 3);
  const [a, b, c] = [en(lineas, 0), en(lineas, 1), en(lineas, 2)];
  const [qa, qb] = [entero(rng, 2, 3), entero(rng, 1, 3)];
  const veces = entero(rng, 2, 5);
  const resto = entero(rng, 1, c.precio - 1);
  const obligado = qa * a.precio + qb * b.precio;
  const limite = obligado + veces * c.precio + resto;
  const n = nombre(rng);
  const compra = unir([unidades(qa, a.producto), unidades(qb, b.producto)]);
  return pregunta(rng, {
    subhabilidad: SUB_LIMITE,
    dificultad,
    enunciado: `${n} tiene ${monedas(limite)}. Debe comprar ${compra}. Con lo que le queda compra la mayor cantidad posible de ${c.producto.plural}. Mira los precios. ¿Cuánto dinero le sobra al final, en monedas?`,
    enunciadoFacil: `${n} tiene ${monedas(limite)}. Debe comprar ${compra}. Después compra todo lo que pueda de ${c.producto.plural}. Mira los precios. ¿Cuánto dinero sobra al final, en monedas?`,
    imagen: tablaPrecios(lineas),
    respuesta: { tipo: "numero", valor: resto },
    pista: "Hazlo por pasos: lo obligado, lo que queda, cuántas unidades caben y qué sobra.",
    explicacion: `Lo obligado cuesta ${obligado} monedas y quedan ${limite - obligado}. Caben ${veces} unidades, que cuestan ${veces * c.precio}, y sobran ${resto}.`,
    plantilla: `${SUB_LIMITE}:resto:${t.id}`,
  });
});

// ---------- PEN5-T2-b: priorizar (parte calculada) ----------
const SUB_PRIORIDAD = "PEN5-T2-b";

function tablaUrgencia(lineas: readonly Linea[], urgentes: readonly Linea[]): Imagen {
  return {
    tipo: "tabla",
    titulo: "Lista de compra",
    cabeceras: ["Producto", "Monedas", "¿Hace falta ya?"],
    filas: lineas.map((l) => [capital(l.producto.singular), String(l.precio), urgentes.includes(l) ? "sí" : "no"]),
  };
}

const quedaTrasLoUrgente = deTienda((rng, dificultad, t) => {
  const lineas = surtido(rng, t, 4);
  const urgentes = muestra(rng, lineas, 2);
  const necesario = urgentes.reduce((s, l) => s + l.precio, 0);
  const limite = necesario + entero(rng, 2, 15);
  const n = nombre(rng);
  return pregunta(rng, {
    subhabilidad: SUB_PRIORIDAD,
    dificultad,
    enunciado: `${n} tiene ${monedas(limite)}. Primero compra todo lo que hace falta ya, una unidad de cada. ¿Cuánto dinero le queda después, en monedas?`,
    enunciadoFacil: `${n} tiene ${monedas(limite)}. Primero compra lo que hace falta ya, una unidad de cada. ¿Cuánto dinero queda, en monedas?`,
    imagen: tablaUrgencia(lineas, urgentes),
    respuesta: { tipo: "numero", valor: limite - necesario },
    pista: "Mira solo las filas con «sí». Suma sus precios y resta del dinero.",
    explicacion: `Lo que hace falta ya cuesta ${necesario} monedas. Entonces ${limite} − ${necesario} = ${limite - necesario}.`,
    plantilla: `${SUB_PRIORIDAD}:queda:${t.id}`,
  });
});

const extraQueAlcanza = deTienda((rng, dificultad, t) => {
  const { lineas, urgentes, limite, buena, malas } = reintentar(() => {
    const ls = surtido(rng, t, 5);
    const urg = muestra(rng, ls, 2);
    const esperan = ls.filter((l) => !urg.includes(l)).sort((x, y) => x.precio - y.precio);
    const [b, m1, m2] = [en(esperan, 0), en(esperan, 1), en(esperan, 2)];
    if (b.precio >= m1.precio) return null;
    const necesario = urg.reduce((s, l) => s + l.precio, 0);
    return { lineas: ls, urgentes: urg, limite: necesario + entero(rng, b.precio, m1.precio - 1), buena: b, malas: [m1, m2] };
  });
  const necesario = urgentes.reduce((s, l) => s + l.precio, 0);
  const queda = limite - necesario;
  const n = nombre(rng);
  return pregunta(rng, {
    subhabilidad: SUB_PRIORIDAD,
    dificultad,
    enunciado: `${n} tiene ${monedas(limite)}. Primero compra todo lo que hace falta ya, una unidad de cada. Con lo que queda solo le alcanza para una de las cosas que pueden esperar. ¿Cuál es?`,
    enunciadoFacil: `${n} tiene ${monedas(limite)}. Primero compra lo que hace falta ya, una unidad de cada. Después compra una cosa que puede esperar. ¿Cuál le alcanza?`,
    imagen: tablaUrgencia(lineas, urgentes),
    respuesta: { tipo: "opcion", correcta: capital(buena.producto.singular), distractores: malas.map((l) => capital(l.producto.singular)) },
    pista: "Resta primero lo de las filas con «sí». Compara lo que queda con los precios de las filas con «no».",
    explicacion: `Lo urgente cuesta ${necesario} monedas y quedan ${queda}. De lo que puede esperar, solo eso alcanza: cuesta ${buena.precio}.`,
    plantilla: `${SUB_PRIORIDAD}:extra:${t.id}`,
  });
});

function tablaPrioridad(lineas: readonly Linea[]): Imagen {
  return {
    tipo: "tabla",
    titulo: "Lista por orden de prioridad",
    cabeceras: ["Prioridad", "Producto", "Monedas"],
    filas: lineas.map((l, i) => [String(i + 1), capital(l.producto.singular), String(l.precio)]),
  };
}

function casoPrioridad(rng: Rng, t: Tienda): { lineas: Linea[]; limite: number; compradas: number; gastado: number } {
  const lineas = surtido(rng, t, 5);
  const compradas = entero(rng, 2, 4);
  const gastado = lineas.slice(0, compradas).reduce((s, l) => s + l.precio, 0);
  const siguiente = en(lineas, compradas).precio;
  return { lineas, limite: gastado + entero(rng, 0, siguiente - 1), compradas, gastado };
}

const ultimaComprada = deTienda((rng, dificultad, t) => {
  const { lineas, limite, compradas, gastado } = casoPrioridad(rng, t);
  const ultima = en(lineas, compradas - 1);
  const n = nombre(rng);
  const malas = lineas.filter((l) => l !== ultima);
  const siguiente = en(lineas, compradas);
  return pregunta(rng, {
    subhabilidad: SUB_PRIORIDAD,
    dificultad,
    enunciado: `${n} tiene ${monedas(limite)}. Compra una unidad de cada cosa siguiendo el orden de prioridad, y se detiene en la primera que no puede pagar. ¿Cuál es la última cosa que compra?`,
    enunciadoFacil: `${n} tiene ${monedas(limite)}. Compra una unidad de cada cosa, en orden. Se detiene cuando no puede pagar. ¿Qué compra en último lugar?`,
    imagen: tablaPrioridad(lineas),
    respuesta: { tipo: "opcion", correcta: capital(ultima.producto.singular), distractores: [siguiente, ...malas.filter((l) => l !== siguiente).slice(0, 2)].map((l) => capital(l.producto.singular)) },
    pista: "Ve restando precios en orden, desde la prioridad 1, hasta que el dinero no alcance.",
    explicacion: `Las ${compradas} primeras cuestan ${gastado} monedas. Le quedan ${limite - gastado} y la siguiente cuesta ${siguiente.precio}, así que ya no puede pagarla.`,
    plantilla: `${SUB_PRIORIDAD}:ultima:${t.id}`,
  });
});

const sobranteTrasPrioridades = deTienda((rng, dificultad, t) => {
  const { lineas, limite, compradas, gastado } = casoPrioridad(rng, t);
  const n = nombre(rng);
  const siguiente = en(lineas, compradas);
  return pregunta(rng, {
    subhabilidad: SUB_PRIORIDAD,
    dificultad,
    enunciado: `${n} tiene ${monedas(limite)}. Compra una unidad de cada cosa siguiendo el orden de prioridad, y se detiene en la primera que no puede pagar. ¿Cuántas cosas compra?`,
    enunciadoFacil: `${n} tiene ${monedas(limite)}. Compra una unidad de cada cosa, en orden. Se detiene cuando no puede pagar. ¿Cuántas cosas compra?`,
    imagen: tablaPrioridad(lineas),
    respuesta: { tipo: "numero", valor: compradas },
    pista: "Ve sumando precios en orden, desde la prioridad 1, sin pasarte del dinero que tiene.",
    explicacion: `Las ${compradas} primeras cuestan ${gastado} monedas. La siguiente cuesta ${siguiente.precio} y solo le quedan ${limite - gastado}.`,
    plantilla: `${SUB_PRIORIDAD}:cuantas:${t.id}`,
  });
});

// ---------- PEN6-T2-a: al contado o a plazos ----------
const SUB_PLAZOS = "PEN6-T2-a";

interface Bien {
  readonly id: string;
  readonly un: string;
  readonly el: string;
}

const BIENES: readonly Bien[] = [
  { id: "bicicleta", un: "una bicicleta", el: "la bicicleta" },
  { id: "coser", un: "una máquina de coser", el: "la máquina de coser" },
  { id: "carretilla", un: "una carretilla", el: "la carretilla" },
  { id: "radio", un: "una radio", el: "la radio" },
  { id: "bomba", un: "una bomba de agua", el: "la bomba de agua" },
];

function deBien(crear: (rng: Rng, d: Dificultad, b: Bien) => ReturnType<Generador>): Generador {
  return (rng, d) => crear(rng, d, elegir(rng, BIENES));
}

const PISTA_PLAZOS = "Pagar a plazos es pagar poco a poco. Para saber el total, multiplica las cuotas y suma la entrada si la hay.";

const totalCuotas = deBien((rng, dificultad, b) => {
  const n = elegir(rng, [3, 4, 5, 6, 10]);
  const c = entero(rng, 6, 30);
  return pregunta(rng, {
    subhabilidad: SUB_PLAZOS,
    dificultad,
    enunciado: `Una familia compra ${b.un} a plazos. Paga ${n} cuotas de ${monedas(c)}. ¿Cuántas monedas paga en total?`,
    enunciadoFacil: `Una familia compra ${b.un}. Paga ${n} cuotas. Cada cuota es de ${monedas(c)}. ¿Cuántas monedas paga en total?`,
    respuesta: { tipo: "numero", valor: n * c },
    pista: PISTA_PLAZOS,
    explicacion: `${n} cuotas de ${c} monedas son ${n} × ${c} = ${n * c} monedas.`,
    plantilla: `${SUB_PLAZOS}:total:${b.id}`,
  });
});

const diferenciaPlazos = deBien((rng, dificultad, b) => {
  const n = elegir(rng, [3, 4, 5, 6, 10]);
  const c = entero(rng, 8, 30);
  const extra = entero(rng, 3, 20);
  const contado = n * c - extra;
  return pregunta(rng, {
    subhabilidad: SUB_PLAZOS,
    dificultad,
    enunciado: `${capital(b.el)} cuesta ${monedas(contado)} al contado. A plazos se paga en ${n} cuotas de ${monedas(c)}. ¿Cuántas monedas más cuesta a plazos?`,
    enunciadoFacil: `${capital(b.el)} cuesta ${monedas(contado)} al contado. A plazos son ${n} cuotas de ${monedas(c)}. ¿Cuántas monedas más cuesta a plazos?`,
    respuesta: { tipo: "numero", valor: extra },
    pista: "Calcula el total a plazos y réstale el precio al contado.",
    explicacion: `A plazos son ${n} × ${c} = ${n * c} monedas. Entonces ${n * c} − ${contado} = ${extra}.`,
    plantilla: `${SUB_PLAZOS}:diferencia:${b.id}`,
  });
});

const conEntrada = deBien((rng, dificultad, b) => {
  const n = elegir(rng, [3, 4, 5, 6, 8]);
  const c = entero(rng, 6, 25);
  const e = entero(rng, 2, 8) * 5;
  return pregunta(rng, {
    subhabilidad: SUB_PLAZOS,
    dificultad,
    enunciado: `Para comprar ${b.un} a plazos se paga una entrada de ${monedas(e)} y después ${n} cuotas de ${monedas(c)}. ¿Cuántas monedas se pagan en total?`,
    enunciadoFacil: `Compras ${b.un} a plazos. Primero pagas ${monedas(e)} de entrada. Después pagas ${n} cuotas de ${monedas(c)}. ¿Cuántas monedas pagas en total?`,
    respuesta: { tipo: "numero", valor: e + n * c },
    pista: PISTA_PLAZOS,
    explicacion: `Las cuotas son ${n} × ${c} = ${n * c} monedas. Con la entrada: ${e} + ${n * c} = ${e + n * c}.`,
    plantilla: `${SUB_PLAZOS}:entrada:${b.id}`,
  });
});

const CENTRO = "En la tienda del centro";
const BARRIO = "En la tienda del barrio";
const IGUAL = "Cuesta lo mismo en las dos";

const dondeMenos = deBien((rng, dificultad, b) => {
  const n = elegir(rng, [3, 4, 5, 6]);
  const c = entero(rng, 8, 25);
  const e = entero(rng, 2, 6) * 5;
  const plazos = e + n * c;
  const cambio = rng() < 0.15 ? 0 : elegir(rng, [-1, 1]) * entero(rng, 3, 15);
  const contado = plazos + cambio;
  const correcta = cambio === 0 ? IGUAL : cambio > 0 ? BARRIO : CENTRO;
  const comparacion = cambio === 0 ? `las dos cuestan ${plazos}` : `en la más barata se ahorran ${Math.abs(cambio)} monedas`;
  return pregunta(rng, {
    subhabilidad: SUB_PLAZOS,
    dificultad,
    enunciado: `En la tienda del centro, ${b.el} cuesta ${monedas(contado)} al contado. En la tienda del barrio se paga a plazos: entrada de ${monedas(e)} y ${n} cuotas de ${monedas(c)}. ¿Dónde se paga menos en total?`,
    enunciadoFacil: `Tienda del centro: ${b.el} cuesta ${monedas(contado)} al contado. Tienda del barrio: entrada de ${monedas(e)} y ${n} cuotas de ${monedas(c)}. ¿Dónde pagas menos en total?`,
    respuesta: { tipo: "opcion", correcta, distractores: [CENTRO, BARRIO, IGUAL].filter((x) => x !== correcta) },
    pista: "No mires solo la cuota. Calcula el total de cada tienda y compara.",
    explicacion: `A plazos se paga ${e} + ${n} × ${c} = ${plazos} monedas, y al contado ${contado}: ${comparacion}.`,
    plantilla: `${SUB_PLAZOS}:donde:${b.id}`,
  });
});

interface Plan {
  readonly letra: string;
  readonly entrada: number;
  readonly cuotas: number;
  readonly cuota: number;
}

const totalPlan = (p: Plan): number => p.entrada + p.cuotas * p.cuota;

const dosPlanes = deBien((rng, dificultad, b) => {
  const [p1, p2] = reintentar(() => {
    const x: Plan = { letra: "A", entrada: entero(rng, 1, 6) * 5, cuotas: elegir(rng, [3, 4, 5]), cuota: entero(rng, 10, 30) };
    const y: Plan = { letra: "B", entrada: entero(rng, 0, 3) * 5, cuotas: elegir(rng, [6, 8, 10]), cuota: entero(rng, 6, 18) };
    const d = Math.abs(totalPlan(x) - totalPlan(y));
    return d >= 3 && d <= 40 ? ([x, y] as const) : null;
  });
  const [t1, t2] = [totalPlan(p1), totalPlan(p2)];
  const imagen: Imagen = {
    tipo: "tabla",
    titulo: `Planes para pagar ${b.el}`,
    cabeceras: ["Plan", "Entrada", "Número de cuotas", "Monedas por cuota"],
    filas: [p1, p2].map((p) => [p.letra, String(p.entrada), String(p.cuotas), String(p.cuota)]),
  };
  return pregunta(rng, {
    subhabilidad: SUB_PLAZOS,
    dificultad,
    enunciado: `La tabla muestra dos planes para pagar ${b.el}. ¿Cuántas monedas se ahorran en total eligiendo el plan más barato en lugar del otro?`,
    enunciadoFacil: `Mira los dos planes para pagar ${b.el}. Calcula el total de cada uno. ¿Cuántas monedas de diferencia hay?`,
    imagen,
    respuesta: { tipo: "numero", valor: Math.abs(t1 - t2) },
    pista: "Para cada plan: entrada más número de cuotas por monedas de cada cuota. Después resta.",
    explicacion: `El plan A cuesta ${t1} monedas y el plan B, ${t2}. La diferencia es ${Math.abs(t1 - t2)}.`,
    plantilla: `${SUB_PLAZOS}:dosPlanes:${b.id}`,
  });
});

const planAsequible = deBien((rng, dificultad, b) => {
  const { planes, limite, mejor } = reintentar(() => {
    const ps: Plan[] = ["A", "B", "C"].map((letra) => ({ letra, entrada: 0, cuotas: elegir(rng, [3, 4, 5, 6, 8, 10]), cuota: entero(rng, 8, 40) }));
    const m = entero(rng, 10, 30);
    const posibles = ps.filter((p) => p.cuota <= m).sort((x, y) => totalPlan(x) - totalPlan(y));
    const baratoGlobal = [...ps].sort((x, y) => totalPlan(x) - totalPlan(y))[0];
    if (posibles.length !== 2 || baratoGlobal === undefined || baratoGlobal.cuota <= m) return null;
    const [x, y] = [en(posibles, 0), en(posibles, 1)];
    if (totalPlan(x) === totalPlan(y)) return null;
    return { planes: ps, limite: m, mejor: x };
  });
  const imagen: Imagen = {
    tipo: "tabla",
    titulo: `Planes para pagar ${b.el}`,
    cabeceras: ["Plan", "Número de cuotas", "Monedas por cuota"],
    filas: planes.map((p) => [p.letra, String(p.cuotas), String(p.cuota)]),
  };
  const descartado = planes.filter((p) => p.cuota > limite).map((p) => p.letra).join("");
  return pregunta(rng, {
    subhabilidad: SUB_PLAZOS,
    dificultad,
    enunciado: `Una familia puede pagar como máximo ${monedas(limite)} cada mes. Hay una cuota al mes. De los planes que puede pagar, quiere el que cuesta menos en total. ¿Cuál elige?`,
    enunciadoFacil: `Una familia paga como máximo ${monedas(limite)} al mes. Hay una cuota al mes. Quiere pagar menos en total. ¿Qué plan elige?`,
    imagen,
    respuesta: { tipo: "opcion", correcta: `Plan ${mejor.letra}`, distractores: planes.filter((p) => p !== mejor).map((p) => `Plan ${p.letra}`) },
    pista: "Descarta primero los planes con una cuota demasiado alta. Calcula el total de los que quedan.",
    explicacion: `El plan ${descartado} tiene una cuota mayor de ${limite}, así que no se puede pagar. De los otros, el plan ${mejor.letra} es el más barato: ${totalPlan(mejor)} monedas.`,
    plantilla: `${SUB_PLAZOS}:asequible:${b.id}`,
  });
});

const recargo = deBien((rng, dificultad, b) => {
  const { contado, pct, n, c } = reintentar(() => {
    const p = elegir(rng, [10, 20, 25, 50]);
    const cuotas = elegir(rng, [3, 4, 5, 6]);
    const cuota = entero(rng, 10, 45);
    const total = cuotas * cuota;
    if ((total * 100) % (100 + p) !== 0) return null;
    return { contado: (total * 100) / (100 + p), pct: p, n: cuotas, c: cuota };
  });
  return pregunta(rng, {
    subhabilidad: SUB_PLAZOS,
    dificultad,
    enunciado: `${capital(b.el)} cuesta ${monedas(contado)} al contado. A plazos cuesta un ${pct} % más y se paga en ${n} cuotas iguales. ¿De cuántas monedas es cada cuota?`,
    enunciadoFacil: `${capital(b.el)} cuesta ${monedas(contado)} al contado. A plazos cuesta un ${pct} % más. Se paga en ${n} cuotas iguales. ¿Cuántas monedas es cada cuota?`,
    respuesta: { tipo: "numero", valor: c },
    pista: "Calcula primero cuánto sube el precio. Después reparte el total entre las cuotas.",
    explicacion: `El ${pct} % de ${contado} es ${n * c - contado}, así que el total es ${n * c}. Repartido en ${n} cuotas son ${c} monedas.`,
    plantilla: `${SUB_PLAZOS}:recargo:${b.id}`,
  });
});

// ---------- PEN6-T2-b: comparar compras ----------
const SUB_COMPARAR = "PEN6-T2-b";

interface Envasado {
  readonly id: string;
  readonly singular: string;
  readonly plural: string;
  readonly cada: string; // "cada lápiz"
}

const ENVASADOS: readonly Envasado[] = [
  { id: "lapices", singular: "lápiz", plural: "lápices", cada: "cada lápiz" },
  { id: "cuadernos", singular: "cuaderno", plural: "cuadernos", cada: "cada cuaderno" },
  { id: "jabon", singular: "pastilla de jabón", plural: "pastillas de jabón", cada: "cada pastilla de jabón" },
  { id: "huevos", singular: "huevo", plural: "huevos", cada: "cada huevo" },
  { id: "agua", singular: "botella de agua", plural: "botellas de agua", cada: "cada botella de agua" },
];

function deEnvasado(crear: (rng: Rng, d: Dificultad, e: Envasado) => ReturnType<Generador>): Generador {
  return (rng, d) => crear(rng, d, elegir(rng, ENVASADOS));
}

const precioUnidad = deEnvasado((rng, dificultad, e) => {
  const n = elegir(rng, [3, 4, 5, 6, 8, 10, 12]);
  const u = entero(rng, 2, 12);
  return pregunta(rng, {
    subhabilidad: SUB_COMPARAR,
    dificultad,
    enunciado: `Un paquete de ${n} ${e.plural} cuesta ${monedas(n * u)}. ¿Cuántas monedas cuesta ${e.cada}?`,
    enunciadoFacil: `El paquete tiene ${n} ${e.plural}. Cuesta ${monedas(n * u)}. ¿Cuántas monedas cuesta ${e.cada}?`,
    respuesta: { tipo: "numero", valor: u },
    pista: "Reparte el precio del paquete entre las unidades que trae.",
    explicacion: `${n * u} monedas entre ${n} unidades son ${u} monedas por unidad.`,
    plantilla: `${SUB_COMPARAR}:unidad:${e.id}`,
  });
});

const dosPaquetes = deEnvasado((rng, dificultad, e) => {
  const [n1, n2] = muestra(rng, [2, 3, 4, 5, 6, 8, 10], 2).sort((x, y) => x - y) as [number, number];
  const u1 = entero(rng, 3, 12);
  const u2 = rng() < 0.15 ? u1 : reintentar(() => {
    const v = entero(rng, 3, 12);
    return v === u1 ? null : v;
  });
  const correcta = u1 === u2 ? "Cuesta lo mismo en los dos" : u1 < u2 ? `El paquete de ${n1}` : `El paquete de ${n2}`;
  const todas = [`El paquete de ${n1}`, `El paquete de ${n2}`, "Cuesta lo mismo en los dos"];
  return pregunta(rng, {
    subhabilidad: SUB_COMPARAR,
    dificultad,
    enunciado: `Un paquete de ${n1} ${e.plural} cuesta ${monedas(n1 * u1)}. Otro paquete de ${n2} ${e.plural} cuesta ${monedas(n2 * u2)}. ¿En qué paquete sale más barata cada unidad?`,
    enunciadoFacil: `Paquete de ${n1} ${e.plural}: ${monedas(n1 * u1)}. Paquete de ${n2} ${e.plural}: ${monedas(n2 * u2)}. ¿Dónde es más barata cada unidad?`,
    respuesta: { tipo: "opcion", correcta, distractores: todas.filter((x) => x !== correcta) },
    pista: "Calcula el precio de una unidad en cada paquete y compara.",
    explicacion: `En el paquete de ${n1} cada unidad cuesta ${u1} monedas, y en el de ${n2}, ${u2}.`,
    plantilla: `${SUB_COMPARAR}:dos:${e.id}`,
  });
});

const tresOfertas = deEnvasado((rng, dificultad, e) => {
  const tamanos = muestra(rng, [2, 3, 4, 5, 6, 8, 10], 3);
  const precios = muestra(rng, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3);
  const ofertas = ["A", "B", "C"].map((letra, i) => ({ letra, n: en(tamanos, i), u: en(precios, i) }));
  const mejor = [...ofertas].sort((x, y) => x.u - y.u)[0] ?? en(ofertas, 0);
  return pregunta(rng, {
    subhabilidad: SUB_COMPARAR,
    dificultad,
    enunciado: `La tabla muestra tres ofertas de ${e.plural}. ¿En qué oferta cuesta menos cada unidad?`,
    enunciadoFacil: `Mira las tres ofertas de ${e.plural}. ¿Dónde cuesta menos cada unidad?`,
    imagen: { tipo: "tabla", titulo: "Ofertas", cabeceras: ["Oferta", "Unidades", "Monedas"], filas: ofertas.map((o) => [o.letra, String(o.n), String(o.n * o.u)]) },
    respuesta: { tipo: "opcion", correcta: `Oferta ${mejor.letra}`, distractores: ofertas.filter((o) => o !== mejor).map((o) => `Oferta ${o.letra}`) },
    pista: "El precio más bajo no siempre es la mejor compra. Divide las monedas entre las unidades.",
    explicacion: `Por unidad: ${ofertas.map((o) => `${o.letra} cuesta ${o.u}`).join(", ")}. La más barata es la oferta ${mejor.letra}.`,
    plantilla: `${SUB_COMPARAR}:tres:${e.id}`,
  });
});

const llevaTres = deEnvasado((rng, dificultad, e) => {
  const u = entero(rng, 2, 12);
  const grupos = entero(rng, 2, 5);
  const n = grupos * 3;
  return pregunta(rng, {
    subhabilidad: SUB_COMPARAR,
    dificultad,
    enunciado: `${capital(e.cada)} cuesta ${monedas(u)}. La tienda tiene una oferta: por cada 3 unidades, solo pagas 2. Si llevas ${n} ${e.plural}, ¿cuántas monedas pagas?`,
    enunciadoFacil: `${capital(e.cada)} cuesta ${monedas(u)}. Oferta: llevas 3 y pagas 2. Llevas ${n} ${e.plural}. ¿Cuántas monedas pagas?`,
    respuesta: { tipo: "numero", valor: grupos * 2 * u },
    pista: "Mira cuántos grupos de 3 hay. En cada grupo pagas solo 2 unidades.",
    explicacion: `${n} unidades son ${grupos} grupos de 3. Pagas ${grupos * 2} unidades: ${grupos * 2} × ${u} = ${grupos * 2 * u} monedas.`,
    plantilla: `${SUB_COMPARAR}:lleva3:${e.id}`,
  });
});

const descuentoOFijo = deBien((rng, dificultad, b) => {
  const { pct, p, final, otra } = reintentar(() => {
    const porcentaje = elegir(rng, [10, 25, 50]);
    const precio = entero(rng, 4, 30) * 20;
    const f = precio - (precio * porcentaje) / 100;
    const o = f + elegir(rng, [-1, 1]) * entero(rng, 3, 25);
    return o > 0 && o !== precio ? { pct: porcentaje, p: precio, final: f, otra: o } : null;
  });
  return pregunta(rng, {
    subhabilidad: SUB_COMPARAR,
    dificultad,
    enunciado: `En la tienda A, ${b.el} cuesta ${monedas(p)}, pero hoy se rebaja un ${pct} %. En la tienda B cuesta ${monedas(otra)} y no hay rebaja. ¿Cuántas monedas se ahorran comprando en la tienda más barata en lugar de en la otra?`,
    enunciadoFacil: `Tienda A: ${b.el} cuesta ${monedas(p)}. Hoy se rebaja un ${pct} %. Tienda B: cuesta ${monedas(otra)}, sin rebaja. ¿Cuántas monedas de diferencia hay?`,
    respuesta: { tipo: "numero", valor: Math.abs(final - otra) },
    pista: "Calcula primero el precio con descuento. Después compara con la otra tienda.",
    explicacion: `El ${pct} % de ${p} es ${p - final}, así que en la tienda A cuesta ${final}. La diferencia con ${otra} es ${Math.abs(final - otra)}.`,
    plantilla: `${SUB_COMPARAR}:descuento:${b.id}`,
  });
});

const viajeAlMercado = deEnvasado((rng, dificultad, e) => {
  const { n, cerca, lejos, viaje } = reintentar(() => {
    const unidades2 = entero(rng, 4, 12);
    const c = entero(rng, 4, 12);
    const l = c - entero(rng, 1, 3);
    const v = entero(rng, 3, 20);
    return l > 0 && unidades2 * c !== unidades2 * l + v ? { n: unidades2, cerca: c, lejos: l, viaje: v } : null;
  });
  const [tc, tl] = [n * cerca, n * lejos + viaje];
  return pregunta(rng, {
    subhabilidad: SUB_COMPARAR,
    dificultad,
    enunciado: `Necesitas ${n} ${e.plural}. En la tienda cercana cada unidad cuesta ${monedas(cerca)}. En el mercado lejano cada unidad cuesta ${monedas(lejos)}, pero el viaje en autobús cuesta ${monedas(viaje)}. ¿Cuántas monedas pagas en total con la opción más barata?`,
    enunciadoFacil: `Necesitas ${n} ${e.plural}. Tienda cercana: ${monedas(cerca)} cada unidad. Mercado lejano: ${monedas(lejos)} cada unidad, y ${monedas(viaje)} de autobús. ¿Cuánto pagas con la opción más barata, en monedas?`,
    respuesta: { tipo: "numero", valor: Math.min(tc, tl) },
    pista: "Calcula el total de cada opción. No olvides sumar el viaje.",
    explicacion: `En la tienda cercana son ${n} × ${cerca} = ${tc} monedas. En el mercado, ${n} × ${lejos} + ${viaje} = ${tl}. La más barata cuesta ${Math.min(tc, tl)}.`,
    plantilla: `${SUB_COMPARAR}:viaje:${e.id}`,
  });
});

const paquetesYSueltos = deEnvasado((rng, dificultad, e) => {
  const { n, k, pack, suelto, mejor, paquetes, sueltos } = reintentar(() => {
    const tam = elegir(rng, [3, 4, 5, 6]);
    const s = entero(rng, 3, 9);
    const p = tam * s - entero(rng, 1, tam);
    const total = tam * entero(rng, 1, 3) + entero(rng, 1, tam - 1);
    let min = Number.POSITIVE_INFINITY;
    let cp = 0;
    for (let a = 0; a * tam <= total; a += 1) {
      const coste = a * p + (total - a * tam) * s;
      if (coste < min) {
        min = coste;
        cp = a;
      }
    }
    return { n: total, k: tam, pack: p, suelto: s, mejor: min, paquetes: cp, sueltos: total - cp * tam };
  });
  return pregunta(rng, {
    subhabilidad: SUB_COMPARAR,
    dificultad,
    enunciado: `Necesitas exactamente ${n} ${e.plural}: no puede sobrar ninguna unidad. Un paquete de ${k} unidades cuesta ${monedas(pack)} y una unidad suelta cuesta ${monedas(suelto)}. ¿Cuántas monedas pagas como mínimo?`,
    enunciadoFacil: `Necesitas ${n} ${e.plural}. No puede sobrar ninguna unidad. Paquete de ${k}: ${monedas(pack)}. Unidad suelta: ${monedas(suelto)}. ¿Cuánto pagas como mínimo, en monedas?`,
    respuesta: { tipo: "numero", valor: mejor },
    pista: "Compara el paquete con comprar esas unidades sueltas. Usa la forma más barata y completa lo que falte.",
    explicacion: `Lo más barato es comprar ${paquetes === 1 ? "1 paquete" : `${paquetes} paquetes`} y ${sueltos === 1 ? "1 unidad suelta" : `${sueltos} unidades sueltas`}: ${paquetes} × ${pack} + ${sueltos} × ${suelto} = ${mejor} monedas.`,
    plantilla: `${SUB_COMPARAR}:sueltos:${e.id}`,
  });
});

// ---------- PEN6-T2-c: ahorro con objetivo ----------
const SUB_AHORRO = "PEN6-T2-c";

interface Meta {
  readonly id: string;
  readonly un: string;
  readonly el: string;
}

const METAS: readonly Meta[] = [
  { id: "mochila", un: "una mochila", el: "la mochila" },
  { id: "balon", un: "una pelota nueva", el: "la pelota" },
  { id: "libro", un: "un libro de animales", el: "el libro" },
  { id: "bici", un: "una bicicleta", el: "la bicicleta" },
  { id: "lampara", un: "una lámpara solar", el: "la lámpara" },
];

function deMeta(crear: (rng: Rng, d: Dificultad, m: Meta) => ReturnType<Generador>): Generador {
  return (rng, d) => crear(rng, d, elegir(rng, METAS));
}

const semanasExactas = deMeta((rng, dificultad, m) => {
  const a = entero(rng, 3, 15);
  const w = entero(rng, 3, 12);
  const n = nombre(rng);
  return pregunta(rng, {
    subhabilidad: SUB_AHORRO,
    dificultad,
    enunciado: `${n} quiere comprar ${m.un} que cuesta ${monedas(a * w)}. Cada semana ahorra ${monedas(a)}. ¿Cuántas semanas tarda en reunir el dinero?`,
    enunciadoFacil: `${n} quiere ${m.un}. Cuesta ${monedas(a * w)}. Ahorra ${monedas(a)} cada semana. ¿Cuántas semanas tarda?`,
    respuesta: { tipo: "numero", valor: w },
    pista: "Divide lo que cuesta entre lo que ahorra cada semana.",
    explicacion: `${a * w} entre ${a} es ${w}: tarda ${w} semanas.`,
    plantilla: `${SUB_AHORRO}:semanas:${m.id}`,
  });
});

const cuantoFalta = deMeta((rng, dificultad, m) => {
  const g = entero(rng, 30, 150);
  const s = entero(rng, 5, g - 5);
  const n = nombre(rng);
  return pregunta(rng, {
    subhabilidad: SUB_AHORRO,
    dificultad,
    enunciado: `${n} quiere comprar ${m.un} que cuesta ${monedas(g)}. Ya tiene ahorradas ${s} monedas. ¿Cuántas monedas le faltan?`,
    enunciadoFacil: `${capital(m.el)} cuesta ${monedas(g)}. ${n} tiene ${s} monedas. ¿Cuántas monedas le faltan?`,
    respuesta: { tipo: "numero", valor: g - s },
    pista: "Resta lo que ya tiene de lo que necesita.",
    explicacion: `${g} − ${s} = ${g - s} monedas.`,
    plantilla: `${SUB_AHORRO}:falta:${m.id}`,
  });
});

const semanasRedondeando = deMeta((rng, dificultad, m) => {
  const a = entero(rng, 4, 15);
  const w = entero(rng, 3, 10);
  const s = entero(rng, 5, 40);
  const g = s + a * w - entero(rng, 1, a - 1);
  const n = nombre(rng);
  return pregunta(rng, {
    subhabilidad: SUB_AHORRO,
    dificultad,
    enunciado: `${n} tiene ${s} monedas y quiere comprar ${m.un} que cuesta ${monedas(g)}. Ahorra ${monedas(a)} cada semana. ¿Cuántas semanas necesita, como mínimo, para reunir todo el dinero?`,
    enunciadoFacil: `${n} tiene ${s} monedas. ${capital(m.el)} cuesta ${monedas(g)}. Ahorra ${monedas(a)} cada semana. ¿Cuántas semanas necesita como mínimo?`,
    respuesta: { tipo: "numero", valor: w },
    pista: "Calcula cuánto falta. Si la división no da exacta, hace falta una semana más.",
    explicacion: `Faltan ${g - s} monedas. En ${w - 1} semanas reúne ${(w - 1) * a}, que no llega. En ${w} semanas reúne ${w * a}, que sí llega.`,
    plantilla: `${SUB_AHORRO}:redondeo:${m.id}`,
  });
});

const cuantoPorSemana = deMeta((rng, dificultad, m) => {
  const a = entero(rng, 3, 15);
  const w = entero(rng, 3, 10);
  const s = entero(rng, 4, 40);
  const g = s + a * w;
  const n = nombre(rng);
  return pregunta(rng, {
    subhabilidad: SUB_AHORRO,
    dificultad,
    enunciado: `${n} quiere comprar ${m.un} dentro de ${w} semanas. Cuesta ${monedas(g)} y ya tiene ${s} monedas. ¿Cuántas monedas debe ahorrar cada semana, siempre la misma cantidad?`,
    enunciadoFacil: `${capital(m.el)} cuesta ${monedas(g)}. ${n} tiene ${s} monedas. Quedan ${w} semanas. Ahorra lo mismo cada semana. ¿Cuántas monedas ahorra cada semana?`,
    respuesta: { tipo: "numero", valor: a },
    pista: "Calcula cuánto falta y repártelo entre las semanas.",
    explicacion: `Faltan ${g} − ${s} = ${g - s} monedas. Entre ${w} semanas son ${a} monedas cada semana.`,
    plantilla: `${SUB_AHORRO}:porSemana:${m.id}`,
  });
});

const ingresosYGastos = deMeta((rng, dificultad, m) => {
  const gasto = entero(rng, 3, 12);
  const a = entero(rng, 4, 12);
  const ingreso = gasto + a;
  const w = entero(rng, 3, 9);
  const s = entero(rng, 5, 30);
  const g = s + a * w - entero(rng, 0, a - 1);
  const n = nombre(rng);
  return pregunta(rng, {
    subhabilidad: SUB_AHORRO,
    dificultad,
    enunciado: `${n} gana ${monedas(ingreso)} cada semana ayudando en el mercado y gasta ${monedas(gasto)} en el autobús. Ahorra el resto. Ya tiene ${s} monedas y quiere comprar ${m.un} que cuesta ${monedas(g)}. ¿Cuántas semanas necesita como mínimo?`,
    enunciadoFacil: `${n} gana ${monedas(ingreso)} cada semana. Gasta ${monedas(gasto)} cada semana. Ahorra el resto. Tiene ${s} monedas. ${capital(m.el)} cuesta ${monedas(g)}. ¿Cuántas semanas necesita como mínimo?`,
    respuesta: { tipo: "numero", valor: w },
    pista: "Primero calcula cuánto ahorra de verdad cada semana. Después mira cuánto le falta.",
    explicacion: `Ahorra ${ingreso} − ${gasto} = ${a} monedas por semana y le faltan ${g - s}. Con ${w} semanas reúne ${a * w}, que ya alcanza.`,
    plantilla: `${SUB_AHORRO}:ingresos:${m.id}`,
  });
});

const dosRitmos = deMeta((rng, dificultad, m) => {
  const k = entero(rng, 2, 5);
  const a = entero(rng, 3, 8);
  const b = a + entero(rng, 2, 6);
  const w2 = entero(rng, 2, 6);
  const g = k * a + w2 * b - entero(rng, 0, b - 1);
  const n = nombre(rng);
  return pregunta(rng, {
    subhabilidad: SUB_AHORRO,
    dificultad,
    enunciado: `${n} quiere comprar ${m.un} que cuesta ${monedas(g)}. Las primeras ${k} semanas ahorra ${monedas(a)} cada semana. Después ahorra ${monedas(b)} cada semana. Empieza sin nada. ¿Cuántas semanas necesita en total, como mínimo?`,
    enunciadoFacil: `${capital(m.el)} cuesta ${monedas(g)}. ${n} empieza sin nada. Ahorra ${monedas(a)} por semana las primeras ${k} semanas. Después ahorra ${monedas(b)} por semana. ¿Cuántas semanas necesita en total como mínimo?`,
    respuesta: { tipo: "numero", valor: k + w2 },
    pista: "Calcula lo que reúne en la primera etapa. Después mira cuántas semanas más necesita.",
    explicacion: `En ${k} semanas reúne ${k * a} monedas y le faltan ${g - k * a}. A ${b} por semana necesita ${w2} semanas más: ${k + w2} en total.`,
    plantilla: `${SUB_AHORRO}:ritmos:${m.id}`,
  });
});

const faltaraAlFinal = deMeta((rng, dificultad, m) => {
  const a = entero(rng, 3, 12);
  const w = entero(rng, 3, 9);
  const s = entero(rng, 5, 30);
  const corto = entero(rng, 2, 20);
  const g = s + a * w + corto;
  const n = nombre(rng);
  return pregunta(rng, {
    subhabilidad: SUB_AHORRO,
    dificultad,
    enunciado: `${n} tiene ${s} monedas y ahorra ${monedas(a)} cada semana. Dentro de ${w} semanas quiere comprar ${m.un} que cuesta ${monedas(g)}. ¿Cuántas monedas le faltarán ese día?`,
    enunciadoFacil: `${n} tiene ${s} monedas. Ahorra ${monedas(a)} cada semana. Pasan ${w} semanas. ${capital(m.el)} cuesta ${monedas(g)}. ¿Cuántas monedas le faltan?`,
    respuesta: { tipo: "numero", valor: corto },
    pista: "Calcula cuánto tendrá ese día y compáralo con el precio.",
    explicacion: `Tendrá ${s} + ${w} × ${a} = ${s + a * w} monedas. Le faltan ${g} − ${s + a * w} = ${corto}.`,
    plantilla: `${SUB_AHORRO}:faltara:${m.id}`,
  });
});

export const GENERADORES_LIMITE = porDificultad({ 1: [sobra, parejaQueAlcanza], 2: [maximoUnidades, quitarUno], 3: [mejorPareja, porDia, restoFinal] });
export const GENERADOR_PRIORIDAD = porDificultad({ 1: [quedaTrasLoUrgente], 2: [extraQueAlcanza], 3: [ultimaComprada, sobranteTrasPrioridades] });
export const GENERADOR_PLAZOS = porDificultad({ 1: [totalCuotas, diferenciaPlazos], 2: [conEntrada, dondeMenos], 3: [dosPlanes, planAsequible, recargo] });
export const GENERADOR_COMPARAR = porDificultad({ 1: [precioUnidad, dosPaquetes], 2: [tresOfertas, llevaTres], 3: [descuentoOFijo, viajeAlMercado, paquetesYSueltos] });
export const GENERADOR_AHORRO = porDificultad({ 1: [semanasExactas, cuantoFalta], 2: [semanasRedondeando, cuantoPorSemana], 3: [ingresosYGastos, dosRitmos, faltaraAlFinal] });
