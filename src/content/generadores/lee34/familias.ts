// LEE3-T1-b: familias de palabras. Generador en código con listas revisadas a mano.
// Se evitan parentescos dudosos (leche/lechuga, pelo/pelear, casa/casar): un miembro
// debe compartir raíz y significado, y un falso amigo solo debe parecerse en las letras.
import { barajar, elegir, muestra, pregunta } from "../../ayuda.ts";
import type { Generador } from "../../tipos.ts";

const SUB = "LEE3-T1-b";

export interface Palabra {
  readonly palabra: string;
  readonly sentido: string; // se lee detrás de "es"
}

export interface Familia {
  readonly base: string;
  readonly miembros: readonly Palabra[]; // al menos 3
  readonly falsos: readonly Palabra[]; // al menos 3
}

const p = (palabra: string, sentido: string): Palabra => ({ palabra, sentido });

export const FAMILIAS: readonly Familia[] = [
  { base: "pan", miembros: [p("panadero", "la persona que hace pan"), p("panadería", "la tienda donde venden pan"), p("panecillo", "un pan pequeño")], falsos: [p("pantalón", "una prenda de vestir"), p("pantera", "un animal salvaje"), p("pañuelo", "un trozo de tela")] },
  { base: "flor", miembros: [p("florero", "el recipiente donde se ponen las flores"), p("florista", "la persona que vende flores"), p("florecer", "cuando una planta echa flores")], falsos: [p("flota", "un grupo de barcos"), p("flauta", "un instrumento de música"), p("flaco", "alguien muy delgado")] },
  { base: "mar", miembros: [p("marinero", "la persona que trabaja en un barco en el mar"), p("marítimo", "lo que tiene que ver con el mar"), p("marea", "la subida y bajada del agua del mar")], falsos: [p("martes", "un día de la semana"), p("marco", "el borde de un cuadro"), p("mariposa", "un insecto con alas")] },
  { base: "sal", miembros: [p("salero", "el recipiente donde se guarda la sal"), p("salado", "lo que tiene sal"), p("salina", "el lugar de donde se saca la sal")], falsos: [p("salto", "un movimiento para subir del suelo"), p("sala", "una habitación grande"), p("salud", "estar bien del cuerpo")] },
  { base: "zapato", miembros: [p("zapatero", "la persona que arregla zapatos"), p("zapatería", "la tienda de zapatos"), p("zapatilla", "un zapato ligero")], falsos: [p("zanahoria", "una verdura de color naranja"), p("zarpa", "la mano de algunos animales"), p("zanja", "un hoyo largo en la tierra")] },
  { base: "libro", miembros: [p("librería", "la tienda donde venden libros"), p("librero", "la persona que vende libros"), p("libreta", "un cuaderno pequeño, como un libro para escribir")], falsos: [p("libre", "quien puede hacer lo que quiere"), p("liebre", "un animal parecido al conejo"), p("lirio", "una flor")] },
  { base: "lluvia", miembros: [p("lluvioso", "un día con mucha lluvia"), p("llover", "lo que hace la lluvia al caer"), p("llovizna", "una lluvia muy suave")], falsos: [p("llave", "lo que sirve para abrir una puerta"), p("lleno", "lo contrario de vacío"), p("llevar", "cargar algo de un lugar a otro")] },
  { base: "nube", miembros: [p("nublado", "un cielo con muchas nubes"), p("nuboso", "un día con nubes"), p("nubarrón", "una nube grande y oscura")], falsos: [p("nuevo", "lo contrario de viejo"), p("nudo", "lo que se hace al atar una cuerda"), p("nuez", "un fruto seco")] },
  { base: "diente", miembros: [p("dentista", "la persona que cuida los dientes"), p("dentadura", "el conjunto de los dientes"), p("dental", "lo que tiene que ver con los dientes")], falsos: [p("dentro", "lo contrario de fuera"), p("diez", "un número"), p("dieta", "lo que come una persona")] },
  { base: "pelo", miembros: [p("peluquero", "la persona que corta el pelo"), p("peluquería", "el lugar donde cortan el pelo"), p("peludo", "lo que tiene mucho pelo")], falsos: [p("pelota", "un juguete redondo"), p("película", "una historia que se ve en una pantalla"), p("pelícano", "un ave con el pico muy grande")] },
  { base: "papel", miembros: [p("papelera", "el recipiente donde se tiran los papeles"), p("papelería", "la tienda donde venden papel y cuadernos"), p("papelito", "un papel pequeño")], falsos: [p("papagayo", "un pájaro de colores"), p("papá", "el padre"), p("papaya", "una fruta")] },
  { base: "caballo", miembros: [p("caballito", "un caballo pequeño"), p("cabalgar", "ir montado en un caballo"), p("caballeriza", "el lugar donde duermen los caballos")], falsos: [p("cabello", "el pelo de la cabeza"), p("cabeza", "la parte de arriba del cuerpo"), p("cabaña", "una casa pequeña y sencilla")] },
  { base: "fruta", miembros: [p("frutería", "la tienda donde venden fruta"), p("frutero", "el recipiente donde se pone la fruta"), p("frutal", "un árbol que da fruta")], falsos: [p("frente", "la parte de la cara encima de los ojos"), p("frase", "un grupo de palabras con sentido"), p("frío", "lo contrario de calor")] },
  { base: "carne", miembros: [p("carnicero", "la persona que vende carne"), p("carnicería", "la tienda donde venden carne"), p("carnoso", "lo que tiene mucha carne")], falsos: [p("carta", "un mensaje escrito en papel"), p("carro", "un vehículo con ruedas"), p("cartón", "un papel grueso y duro")] },
  { base: "pintar", miembros: [p("pintor", "la persona que pinta"), p("pintura", "lo que se usa para pintar"), p("pintado", "lo que ya tiene color porque alguien lo pintó")], falsos: [p("pino", "un árbol"), p("pinza", "lo que sirve para sujetar la ropa"), p("piña", "una fruta")] },
  { base: "cantar", miembros: [p("canción", "lo que se canta"), p("cantante", "la persona que canta"), p("cantor", "alguien que canta")], falsos: [p("cantidad", "cuánto hay de algo"), p("canasta", "un recipiente hecho de tiras"), p("cansado", "alguien que necesita descansar")] },
  { base: "jugar", miembros: [p("juego", "lo que se hace al jugar"), p("jugador", "la persona que juega"), p("juguete", "un objeto para jugar")], falsos: [p("jugo", "el líquido de una fruta"), p("junto", "lo que está al lado"), p("juez", "la persona que decide en un juicio")] },
  { base: "tierra", miembros: [p("terreno", "un trozo de tierra"), p("enterrar", "meter algo bajo la tierra"), p("terrestre", "lo que vive sobre la tierra")], falsos: [p("terror", "un miedo muy grande"), p("tiempo", "lo que miden los relojes"), p("tienda", "un lugar donde se compra")] },
  { base: "noche", miembros: [p("anochecer", "cuando empieza la noche"), p("nocturno", "lo que pasa de noche"), p("trasnochar", "quedarse despierto por la noche")], falsos: [p("nombre", "la palabra con la que te llaman"), p("norte", "un punto cardinal"), p("nota", "un mensaje corto")] },
  { base: "agua", miembros: [p("aguacero", "una lluvia con mucha agua"), p("aguado", "lo que tiene demasiada agua"), p("desaguar", "sacar el agua de un lugar")], falsos: [p("aguja", "lo que se usa para coser"), p("águila", "un ave grande"), p("agudo", "lo que tiene punta")] },
];

const mayuscula = (texto: string): string => texto.charAt(0).toUpperCase() + texto.slice(1);

export const familiaDePalabras: Generador = (rng, dificultad) => {
  const familia = elegir(rng, FAMILIAS);
  const { base } = familia;
  const plantilla = `${SUB}#${base}#${dificultad}`;
  const pista = `Piensa en lo que significa cada palabra. ¿Tiene que ver con «${base}»?`;
  const comun = { subhabilidad: SUB, dificultad, plantilla, pista };

  if (dificultad === 3) {
    const intruso = elegir(rng, familia.falsos);
    return pregunta(rng, {
      ...comun,
      enunciado: `Tres de estas palabras son de la familia de «${base}». ¿Cuál NO lo es?`,
      enunciadoFacil: `Tres palabras vienen de «${base}». Una no. ¿Cuál NO viene de «${base}»?`,
      respuesta: { tipo: "opcion", correcta: intruso.palabra, distractores: familia.miembros.slice(0, 3).map((m) => m.palabra) },
      explicacion: `«${mayuscula(intruso.palabra)}» se parece por las letras, pero es ${intruso.sentido}. No tiene que ver con «${base}».`,
    });
  }

  const miembro = elegir(rng, familia.miembros);
  const explicacion = `«${mayuscula(miembro.palabra)}» viene de «${base}»: es ${miembro.sentido}.`;
  if (dificultad === 2) {
    return pregunta(rng, {
      ...comun,
      enunciado: `¿Qué palabra es de la familia de «${base}»? Cuidado: algunas solo se parecen por las letras.`,
      enunciadoFacil: `Una palabra viene de «${base}». Las otras solo se parecen. ¿Cuál viene de «${base}»?`,
      respuesta: { tipo: "opcion", correcta: miembro.palabra, distractores: barajar(rng, familia.falsos).map((f) => f.palabra) },
      explicacion,
    });
  }

  const otras = FAMILIAS.filter((f) => f.base !== base).map((f) => f.base);
  return pregunta(rng, {
    ...comun,
    enunciado: `¿Qué palabra es de la familia de «${base}»?`,
    enunciadoFacil: `Una palabra viene de «${base}». ¿Cuál es?`,
    respuesta: { tipo: "opcion", correcta: miembro.palabra, distractores: muestra(rng, otras, 2) },
    explicacion,
  });
};
