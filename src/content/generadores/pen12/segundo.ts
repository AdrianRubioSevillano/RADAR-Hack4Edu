// Situaciones de 2.º: PEN2-T2 a PEN2-T5. Es la clase de la demo: solo casos indiscutibles,
// con frases de niños de 7 y 8 años.
import { elegir, entero, monedas, muestra, pregunta } from "../../ayuda.ts";
import type { Dificultad, Generador, Imagen, ObjetoId, Pregunta } from "../../tipos.ts";
import type { Rng } from "../../../core/rng.ts";
import { conArticulo, lista, nombreObjeto, objeto, opcionDibujo, porDificultad, situaciones, type Fila } from "./comun.ts";

// ---------- PEN2-T2-a: qué pasa si… ----------
const QUE_PASA: readonly Fila[] = [
  [1, "Si sueltas una pelota en el aire, ¿qué pasa?", "Sueltas una pelota. ¿Qué pasa?", "Cae al suelo", ["Se queda quieta en el aire", "Sube hasta las nubes"], "Piensa en lo que pasa con las cosas cuando las sueltas.", "Las cosas que sueltas caen al suelo. Por eso la pelota cae.", objeto("pelota")],
  [1, "Si dejas un trozo de hielo al sol, ¿qué pasa?", "Pones hielo al sol. ¿Qué pasa?", "Se derrite", ["Se hace más grande", "Se vuelve más duro"], "El sol da calor.", "El calor del sol convierte el hielo en agua.", objeto("sol")],
  [1, "Si nadie riega una planta durante muchos días y no llueve, ¿qué pasa?", "Una planta no recibe agua en muchos días. ¿Qué pasa?", "Se seca", ["Crece más rápido", "Le salen más flores"], "Las plantas necesitan agua para vivir.", "Sin agua, la planta no puede vivir y se seca.", objeto("flor")],
  [1, "Si soplas fuerte una vela encendida, ¿qué pasa?", "Soplas fuerte una vela. ¿Qué pasa?", "Se apaga", ["Da más luz", "Cambia de color"], "El aire mueve la llama.", "El soplido apaga la llama de la vela."],
  [1, "Si caminas bajo la lluvia sin paraguas, ¿qué le pasa a tu ropa?", "Llueve. No tienes paraguas. ¿Qué le pasa a tu ropa?", "Se moja", ["Sigue seca", "Cambia de color"], "La lluvia es agua que cae.", "Sin paraguas, la lluvia cae sobre ti y moja tu ropa.", objeto("paraguas")],
  [1, "Si un vaso está lleno y sigues echando agua, ¿qué pasa?", "El vaso está lleno. Echas más agua. ¿Qué pasa?", "El agua se sale", ["El vaso se hace más grande", "El agua desaparece"], "En el vaso ya no cabe más.", "Si el vaso está lleno, ya no cabe más agua y se sale.", objeto("vaso")],

  [2, "{F1} deja abierta la puerta del corral. ¿Qué puede pasar?", "La puerta del corral está abierta. ¿Qué puede pasar?", "Las gallinas pueden salir", ["Las gallinas se quedan encerradas", "La puerta se cierra con llave"], "Piensa para qué sirve la puerta del corral.", "Con la puerta abierta, nada impide que las gallinas salgan.", objeto("puerta")],
  [2, "{M1} no ha dormido en toda la noche. ¿Cómo estará por la mañana?", "{M1} no duerme en toda la noche. ¿Cómo está por la mañana?", "Con mucho sueño", ["Con ganas de dormir menos", "Más descansado que nunca"], "Piensa para qué sirve dormir.", "Dormir nos hace descansar. Si {M1} no ha dormido, tendrá sueño.", objeto("cama")],
  [2, "{F1} llega a la parada cuando el autobús ya se ha ido. ¿Qué pasa?", "{F1} llega tarde. El autobús ya no está. ¿Qué pasa?", "No puede subir a ese autobús", ["Llega antes que los demás", "Se sienta en el autobús"], "El autobús ya no está en la parada.", "El autobús se ha ido, así que {F1} no puede subir a él."],
  [2, "{M1} deja su cuaderno fuera y llueve toda la noche. ¿Cómo estará el cuaderno?", "El cuaderno pasa la noche bajo la lluvia. ¿Cómo está?", "Mojado", ["Seco", "Con más hojas"], "El papel absorbe el agua.", "La lluvia ha caído sobre el cuaderno toda la noche. Por eso estará mojado.", objeto("cuaderno")],
  [2, "Hay moscas y {N1} deja la comida destapada. ¿Qué puede pasar?", "Hay moscas. La comida está sin tapar. ¿Qué puede pasar?", "Las moscas se posan en la comida", ["Las moscas se van de la casa", "La comida se limpia sola"], "Nada protege la comida.", "Sin tapa, las moscas pueden llegar a la comida y ensuciarla."],
  [2, "{F1} guarda 2 monedas cada semana y no gasta ninguna. ¿Qué pasa con sus monedas?", "{F1} guarda 2 monedas cada semana. No gasta. ¿Qué pasa?", "Tiene cada vez más", ["Tiene cada vez menos", "Tiene siempre las mismas"], "Piensa en lo que pasa si añades y no quitas.", "Si cada semana añade 2 monedas y no gasta, el total sube.", objeto("moneda")],

  [3, "Hace muchos días que no llueve y nadie riega el huerto. ¿Qué pasará con las verduras?", "No llueve. Nadie riega el huerto. ¿Qué pasa con las verduras?", "Habrá menos verduras para comer", ["Crecerán más grandes que nunca", "Crecerán igual que siempre"], "Piensa paso a paso: sin agua, ¿qué le pasa a la planta? ¿Y a lo que da?", "Sin agua las plantas se secan. Si se secan, dan menos verduras."],
  [3, "{M1} no cierra su botella de agua y la mete tumbada en la mochila. ¿Qué pasará?", "La botella no tiene tapa. Va tumbada en la mochila. ¿Qué pasa?", "Se mojarán sus cuadernos", ["Tendrá más agua para beber", "La botella se cerrará sola"], "Piensa adónde va el agua cuando la botella está tumbada.", "El agua se sale de la botella abierta y moja lo que hay en la mochila.", objeto("mochila")],
  [3, "Se rompe el único puente del camino a la escuela. ¿Qué pasará?", "El puente se rompe. Es el único camino. ¿Qué pasa?", "Tendrán que buscar otra forma de llegar", ["Podrán pasar por el puente igual", "El camino será más corto"], "¿Se puede cruzar por un puente roto?", "Por un puente roto no se puede pasar. Hay que buscar otra forma de llegar."],
  [3, "Todos tiran papeles al suelo del patio y nadie los recoge. ¿Qué pasará?", "Todos tiran papeles al patio. Nadie los recoge. ¿Qué pasa?", "El patio estará cada vez más sucio", ["El patio estará cada vez más limpio", "Los papeles se irán a la basura solos"], "¿Los papeles se quitan solos?", "Cada día hay más papeles y nadie los quita. Por eso el patio se ensucia más."],
  [3, "{F1} deja sin tapa el recipiente del agua de beber y entran insectos. ¿Qué pasa con esa agua?", "El agua está sin tapa. Entran insectos. ¿Qué pasa?", "Ya no es segura para beber", ["Es más limpia que antes", "Se convierte en agua hervida"], "Los insectos llevan suciedad.", "Los insectos ensucian el agua. Por eso ya no es segura para beber.", objeto("vaso")],
  [3, "{M1} presta su único lápiz y no se lo devuelven. Hoy hay que escribir en clase. ¿Qué le pasará?", "{M1} presta su único lápiz. No se lo devuelven. Hoy hay que escribir. ¿Qué pasa?", "No tendrá con qué escribir", ["Escribirá más rápido que nadie", "Tendrá dos lápices"], "¿Cuántos lápices le quedan a {M1}?", "Era su único lápiz. Sin él, {M1} no tiene con qué escribir.", objeto("lapiz")],
];

// ---------- PEN2-T2-b: por qué pasó ----------
const POR_QUE: readonly Fila[] = [
  [1, "Empezó a llover. {F1} estaba en el patio sin paraguas. Ahora tiene la ropa mojada. ¿Por qué?", "Llovió. {F1} no tenía paraguas. Su ropa está mojada. ¿Por qué?", "Porque le cayó la lluvia", ["Porque se puso un gorro rojo", "Porque fue a la escuela ayer"], "Busca en el texto qué pasó antes.", "{F1} estaba fuera sin paraguas y la lluvia le mojó la ropa.", objeto("paraguas")],
  [1, "El vaso estaba en el borde de la mesa. El gato saltó y lo tocó. Ahora el vaso está en el suelo. ¿Por qué se cayó?", "El gato tocó el vaso. El vaso se cayó. ¿Por qué se cayó?", "Porque el gato lo empujó", ["Porque el vaso estaba limpio", "Porque la mesa es de madera"], "Mira qué pasó justo antes de caer.", "El gato tocó el vaso, que estaba en el borde, y por eso se cayó.", objeto("gato")],
  [1, "Hacía mucho viento. Ahora la ropa que estaba tendida está en el suelo. ¿Por qué se cayó?", "Hacía viento. La ropa está en el suelo. ¿Por qué se cayó?", "Porque el viento la tiró", ["Porque la ropa estaba limpia", "Porque era de día"], "Busca qué cosa pudo mover la ropa.", "El viento fuerte movió la ropa y la tiró al suelo."],
  [1, "{M1} corrió toda la tarde. Ahora está muy cansado. ¿Por qué?", "{M1} corrió toda la tarde. Está cansado. ¿Por qué?", "Porque corrió mucho", ["Porque durmió mucho", "Porque leyó un libro"], "Busca lo que hizo {M1} toda la tarde.", "Correr mucho cansa. Por eso {M1} está cansado."],
  [1, "{F1} no ha comido nada desde la mañana. Ahora tiene mucha hambre. ¿Por qué?", "{F1} no come desde la mañana. Tiene hambre. ¿Por qué?", "Porque lleva horas sin comer", ["Porque comió demasiado", "Porque se lavó las manos con jabón"], "Busca lo que no ha hecho {F1}.", "Si pasas muchas horas sin comer, te entra hambre."],
  [1, "{M1} riega su planta cada día y le da el sol. La planta crece bien. ¿Por qué?", "{M1} riega su planta. Le da el sol. Crece bien. ¿Por qué?", "Porque tiene agua y sol", ["Porque nadie la cuida", "Porque está siempre a oscuras"], "Busca lo que recibe la planta.", "Las plantas crecen bien si tienen agua y sol, y esta los tiene.", objeto("flor")],

  [2, "La vela se apagó de repente. La ventana estaba abierta y hacía viento. ¿Por qué se apagó?", "La vela se apagó. Hacía viento. La ventana estaba abierta. ¿Por qué?", "Porque entró el viento", ["Porque la vela era blanca", "Porque la mesa era pequeña"], "¿Qué cosa puede apagar una llama?", "El viento entró por la ventana y apagó la llama.", objeto("ventana")],
  [2, "El suelo limpio de la clase ahora tiene barro. Fuera ha llovido. ¿Qué ha pasado?", "El suelo tiene barro. Fuera ha llovido. ¿Qué ha pasado?", "Alguien entró con los zapatos sucios", ["Alguien abrió un libro en la clase", "Alguien cantó una canción muy larga en clase"], "¿Cómo pudo entrar el barro en la clase?", "Con la lluvia hay barro fuera, y los zapatos sucios lo meten en la clase.", objeto("zapato")],
  [2, "La planta de la ventana está seca y sus hojas se caen. ¿Cuál es la causa?", "La planta está seca. ¿Por qué?", "Nadie la regó", ["Alguien leyó a su lado", "La ventana es cuadrada"], "¿Qué necesita una planta para no secarse?", "Una planta sin agua se seca. Nadie la regó.", objeto("hoja")],
  [2, "{F1} llegó a su casa y no pudo abrir la puerta. Su llave no estaba en la mochila. ¿Por qué no pudo abrir?", "{F1} no abrió la puerta. No tenía la llave. ¿Por qué no pudo?", "Porque no llevaba la llave", ["Porque tenía mucha hambre y sed", "Porque ya era de día"], "¿Qué hace falta para abrir esa puerta?", "Sin la llave, {F1} no puede abrir la puerta.", objeto("llave")],
  [2, "Los lápices están por todo el suelo y su caja está tirada y abierta. ¿Qué ha pasado?", "Los lápices están en el suelo. La caja está tirada. ¿Qué ha pasado?", "La caja se cayó y se abrió", ["Los lápices se pintaron solos", "La caja se llenó de lápices"], "Mira dónde está la caja.", "Al caerse la caja se abrió, y los lápices salieron por el suelo.", objeto("caja")],
  [2, "El agua del vaso estaba limpia. {M1} metió las manos llenas de tierra. Ahora el agua está marrón. ¿Por qué?", "{M1} metió manos con tierra en el vaso. El agua está marrón. ¿Por qué?", "Porque la tierra ensució el agua", ["Porque el vaso es de cristal transparente", "Porque {M1} tenía sed"], "¿Qué llevaban las manos de {M1}?", "La tierra de las manos pasó al agua y la puso marrón.", objeto("vaso")],

  [3, "{F1} dejó comida en un plato. Al volver, el plato está vacío en el suelo y su perro se relame. ¿Qué ha pasado?", "El plato está vacío. El perro se relame. ¿Qué ha pasado?", "El perro se comió la comida", ["El plato se limpió solo", "La comida se fue andando por la puerta"], "Mira las pistas: el plato en el suelo y el perro.", "El perro se relame y el plato está en el suelo: se comió la comida.", objeto("perro")],
  [3, "Por la mañana la calle está mojada y hay charcos por todas partes. Por la noche se oía caer agua. ¿Qué pasó?", "La calle está mojada. Hay charcos. Se oía caer agua. ¿Qué pasó?", "Llovió por la noche", ["Hizo mucho sol por la noche", "Alguien regó una planta"], "¿Qué puede mojar toda una calle?", "Solo la lluvia moja toda la calle y deja charcos en todas partes.", objeto("nube")],
  [3, "Hay huellas de zapatos con barro desde la puerta hasta la mesa. Los zapatos de {M1} están llenos de barro. ¿Qué pasó?", "Hay huellas de barro. Los zapatos de {M1} tienen barro. ¿Qué pasó?", "{M1} entró con los zapatos sucios", ["El gato entró por la ventana", "Alguien limpió el suelo con agua y jabón"], "Compara las huellas con los zapatos.", "Las huellas son de zapatos y los de {M1} tienen barro: fue él.", objeto("zapato")],
  [3, "Las hojas del huerto están mordidas y encima de ellas hay muchas orugas. ¿Qué ha pasado?", "Las hojas están mordidas. Hay orugas encima. ¿Qué ha pasado?", "Las orugas se han comido las hojas", ["El sol ha mordido todas las hojas del huerto", "Las hojas se han mojado"], "¿Quién está encima de las hojas?", "Las orugas comen hojas. Por eso las hojas están mordidas.", objeto("hoja")],
  [3, "De repente se apagó la luz en casa de {F1}. Miró por la ventana y todas las casas de la calle estaban a oscuras. ¿Qué pasó?", "Se apagó la luz en casa de {F1}. Toda la calle está a oscuras. ¿Qué pasó?", "Se fue la luz en toda la calle", ["Se rompió solo una lámpara de su casa", "{F1} apagó la luz de su cuarto"], "Fíjate en las otras casas.", "Si todas las casas están a oscuras, el problema no es solo de una casa.", objeto("ventana")],
  [3, "Hoy todos los niños que viven al otro lado del río llegan tarde. El puente está cerrado. ¿Por qué llegan tarde?", "Los niños del otro lado del río llegan tarde. El puente está cerrado. ¿Por qué?", "Porque tuvieron que ir por otro camino", ["Porque se despertaron antes", "Porque el puente es más corto que el camino"], "¿Por dónde pasan normalmente esos niños?", "Con el puente cerrado tienen que ir por otro camino, y tardan más."],
];

// ---------- PEN2-T3-a: necesidad o capricho ----------
const SUB_NECESIDAD = "PEN2-T3-a";

interface Cosa {
  readonly texto: string;
  readonly motivo: string;
}

const NECESIDADES: readonly Cosa[] = [
  { texto: "Agua limpia para beber", motivo: "sin agua no podemos vivir" },
  { texto: "Comida para hoy", motivo: "sin comida no podemos estar sanos" },
  { texto: "Un lugar seguro para dormir", motivo: "todos necesitamos descansar protegidos" },
  { texto: "Ropa para no pasar frío", motivo: "la ropa protege el cuerpo" },
  { texto: "Medicina para una enfermedad", motivo: "la medicina ayuda a curarse" },
  { texto: "Jabón para lavarse", motivo: "el jabón nos ayuda a no enfermar" },
];

const CAPRICHOS: readonly Cosa[] = [
  { texto: "Un juguete más", motivo: "es divertido, pero se puede vivir bien sin él" },
  { texto: "Un globo de colores", motivo: "es bonito, pero se puede vivir bien sin él" },
  { texto: "Una pulsera brillante", motivo: "es bonita, pero se puede vivir bien sin ella" },
  { texto: "Muchos caramelos", motivo: "son ricos, pero se puede vivir bien sin ellos" },
  { texto: "Una gorra de otro color", motivo: "es bonita, pero se puede vivir bien sin ella" },
  { texto: "Un segundo balón", motivo: "es divertido, pero se puede vivir bien sin él" },
];

function primeraMinuscula(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

const elegirNecesidad: Generador = (rng, dificultad) => {
  const pideNecesidad = rng() < 0.6;
  const [buena, malas] = pideNecesidad
    ? [elegir(rng, NECESIDADES), muestra(rng, CAPRICHOS, 2)]
    : [elegir(rng, CAPRICHOS), muestra(rng, NECESIDADES, 2)];
  const palabra = pideNecesidad ? "una necesidad" : "un capricho";
  const definicion = pideNecesidad ? "Una necesidad es algo sin lo que no puedes vivir bien." : "Un capricho es algo que te gusta, pero que no te hace falta.";
  return pregunta(rng, {
    subhabilidad: SUB_NECESIDAD,
    dificultad,
    enunciado: `¿Cuál de estas cosas es ${palabra}?`,
    enunciadoFacil: `¿Cuál es ${palabra}?`,
    respuesta: { tipo: "opcion", correcta: buena.texto, distractores: malas.map((c) => c.texto) },
    pista: definicion,
    explicacion: `${buena.texto}: ${buena.motivo}. Por eso es ${palabra}.`,
    plantilla: `${SUB_NECESIDAD}#${pideNecesidad ? "n" : "c"}#${primeraMinuscula(buena.texto)}`,
  });
};

const NECESIDAD_MEDIA: readonly Fila[] = [
  [2, "{F1} ya tiene una pelota que funciona bien. Quiere otra de otro color. ¿Qué frase es verdad?", "{F1} tiene una pelota buena. Quiere otra de otro color. ¿Qué es verdad?", "La quiere, pero no le hace falta", ["Sin esa pelota no puede vivir", "Sin esa pelota enfermará"], "Piensa: ¿qué le pasaría a {F1} sin la pelota nueva?", "{F1} ya tiene una pelota que funciona. La otra es un capricho.", objeto("pelota")],
  [2, "{M1} ha caminado mucho, hace calor y tiene mucha sed. ¿Qué necesita?", "{M1} tiene mucha sed. ¿Qué necesita?", "Beber agua", ["Comprar un juguete", "Ponerse una gorra de otro color"], "Piensa en lo que quita la sed.", "Cuando tienes mucha sed, tu cuerpo necesita agua.", objeto("vaso")],
  [2, "A {F1} se le ha acabado el cuaderno de la escuela. ¿Qué necesita de verdad?", "{F1} ya no tiene hojas en su cuaderno. ¿Qué necesita?", "Un cuaderno nuevo", ["Una pulsera nueva", "Un globo de colores"], "Piensa en lo que usa cada día en clase.", "{F1} necesita un cuaderno para trabajar en clase.", objeto("cuaderno")],
  [2, "{M1} tiene fiebre y el médico le ha dado una receta. ¿Qué necesita?", "{M1} tiene fiebre. El médico le da una receta. ¿Qué necesita?", "La medicina de la receta", ["Una bolsa de caramelos", "Un balón nuevo"], "Piensa en lo que le ayuda a curarse.", "La medicina ayuda a {M1} a curarse. Por eso es una necesidad."],
  [2, "En el mercado, {F1} ve una gorra brillante. Ya tiene una gorra buena en casa. ¿Qué es esa gorra brillante para ella?", "{F1} ya tiene una gorra buena. Ve otra brillante. ¿Qué es esa gorra?", "Un capricho", ["Una necesidad", "Una medicina"], "¿Le pasa algo malo si no la compra?", "{F1} ya tiene una gorra buena. La brillante le gusta, pero no le hace falta.", objeto("gorro")],
  [2, "Hace mucho frío y {M1} no tiene ninguna ropa de abrigo. ¿Qué es para él un abrigo?", "Hace frío. {M1} no tiene abrigo. ¿Qué es un abrigo para él?", "Una necesidad", ["Un capricho", "Un juguete"], "¿Qué le pasa a {M1} si sigue sin abrigo?", "Con mucho frío y sin ropa de abrigo, {M1} puede enfermar. Lo necesita."],
];

const NECESIDAD_DIFICIL: readonly Fila[] = [
  [3, "Los zapatos de {F1} están rotos y le hacen daño al caminar. {M1} tiene unos zapatos buenos, pero quiere otros de otro color. ¿Quién necesita zapatos de verdad?", "{F1} tiene los zapatos rotos. Le hacen daño. {M1} tiene zapatos buenos. ¿Quién necesita zapatos?", "{F1}", ["{M1}", "Ninguno de los dos"], "Fíjate en cómo están los zapatos de cada uno.", "{F1} no puede caminar bien con sus zapatos. Para {M1}, unos nuevos son un capricho.", objeto("zapato")],
  [3, "{M1} no ha comido nada en todo el día. {F1} acaba de comer y quiere caramelos. ¿Para quién es la comida una necesidad en este momento?", "{M1} no ha comido hoy. {F1} acaba de comer. ¿Quién necesita comer?", "Para {M1}", ["Para {F1}", "Para ninguno de los dos"], "Piensa en quién tiene el cuerpo sin comida.", "{M1} lleva todo el día sin comer y lo necesita. Lo de {F1} es un capricho."],
  [3, "{F1} está enferma y debe tomar una medicina. {M1} está sano y quiere probarla por curiosidad. ¿Quién la necesita?", "{F1} está enferma. {M1} está sano. ¿Quién necesita la medicina?", "{F1}", ["{M1}", "Los dos"], "La medicina es para quien está enfermo.", "{F1} necesita la medicina para curarse. {M1} no, porque está sano."],
  [3, "{M1} tiene un cuaderno con muchas hojas en blanco y quiere otro con dibujos. {F1} ha gastado todo su cuaderno. ¿Quién necesita un cuaderno?", "{M1} tiene hojas en blanco. {F1} no tiene ninguna. ¿Quién necesita un cuaderno?", "{F1}", ["{M1}", "Ninguno de los dos"], "¿A quién le quedan hojas para escribir?", "{F1} ya no tiene hojas. {M1} tiene muchas: el cuaderno con dibujos es un capricho.", objeto("cuaderno")],
  [3, "¿Qué diferencia hay entre una necesidad y un capricho?", "¿En qué se diferencian una necesidad y un capricho?", "Sin una necesidad no puedes vivir bien, y sin un capricho sí", ["Una necesidad siempre cuesta más monedas", "Un capricho es lo que quiere tu familia"], "Piensa qué pasa si te quedas sin una cosa o sin la otra.", "Lo que hace falta para vivir bien es una necesidad. Lo que solo te gusta es un capricho."],
  [3, "{F1} vive en un lugar muy frío y no tiene abrigo. {M1} tiene dos abrigos y quiere un tercero. ¿Quién necesita un abrigo?", "{F1} tiene frío y no tiene abrigo. {M1} tiene dos abrigos. ¿Quién necesita uno?", "{F1}", ["{M1}", "Los dos"], "Cuenta los abrigos que tiene cada uno.", "{F1} no tiene ninguno y hace frío. {M1} ya tiene dos: un tercero es un capricho."],
];

// ---------- PEN2-T3-b: elegir lo importante ----------
const SUB_IMPORTANTE = "PEN2-T3-b";

const IMPORTANTE: readonly Fila[] = [
  [1, "{F1} tiene monedas solo para una cosa. Necesita un cuaderno para la escuela. También le gusta un globo. ¿Qué debe comprar?", "{F1} solo puede comprar una cosa. Necesita un cuaderno. Le gusta un globo. ¿Qué compra?", "El cuaderno", ["El globo", "Un caramelo"], "Piensa en lo que le hace falta de verdad.", "{F1} necesita el cuaderno para la escuela. El globo solo le gusta.", objeto("cuaderno")],
  [1, "{M1} solo puede llevar una cosa en la mano. Llueve mucho y tiene que ir a la escuela. ¿Qué lleva?", "Llueve. {M1} va a la escuela. Solo lleva una cosa. ¿Qué lleva?", "El paraguas", ["Una pelota", "Un dado"], "¿Qué le ayuda con la lluvia?", "Con mucha lluvia, lo importante es el paraguas.", objeto("paraguas")],
  [1, "En casa no hay nada para cenar y {F1} tiene monedas para una sola cosa. ¿Qué es lo importante?", "No hay cena en casa. {F1} solo puede comprar una cosa. ¿Qué compra?", "Comida para la cena", ["Un juguete", "Una pulsera"], "Sin esto, nadie podrá cenar.", "Lo importante es la comida: en casa no hay nada para cenar.", objeto("moneda")],
  [1, "{M1} tiene mucha sed y solo puede elegir una cosa. ¿Qué elige?", "{M1} tiene sed. Solo elige una cosa. ¿Qué elige?", "Un vaso de agua limpia", ["Un libro de dibujos", "Una caja vacía"], "¿Qué quita la sed?", "Lo importante cuando tienes sed es beber agua limpia.", objeto("vaso")],
  [1, "A {F1} se le acabó el jabón y le gustan unos globos. Solo puede comprar una cosa. ¿Qué es lo importante?", "No hay jabón. A {F1} le gustan unos globos. Solo compra una cosa. ¿Qué compra?", "El jabón", ["Los globos", "Unos caramelos"], "¿Qué ayuda a no enfermar?", "El jabón ayuda a estar limpios y sanos. Los globos solo le gustan.", objeto("jabon")],

  [2, "{M1} debe entregar una tarea mañana. Sus amigos lo llaman para jugar, pero solo tiene tiempo para una cosa. ¿Qué es lo importante?", "{M1} debe entregar una tarea mañana. Sus amigos lo llaman. Solo tiene tiempo para una cosa. ¿Qué hace?", "Hacer la tarea", ["Jugar toda la tarde", "Ver pasar a la gente"], "¿Qué tiene fecha para mañana?", "La tarea hay que entregarla mañana. Puede jugar otro día.", objeto("cuaderno")],
  [2, "Solo queda agua limpia para un vaso. ¿Para qué es lo más importante usarla?", "Queda un solo vaso de agua limpia. ¿Para qué lo usas?", "Para beber", ["Para lavar una bicicleta", "Para regar el suelo del patio"], "Piensa en lo que el cuerpo no puede dejar de tener.", "El agua limpia es para beber. Las otras cosas pueden esperar.", objeto("vaso")],
  [2, "{F1} está jugando y ve que su hermano pequeño se ha hecho una herida que sangra. ¿Qué es lo importante?", "{F1} juega. Su hermano sangra. ¿Qué hace?", "Avisar a un adulto", ["Terminar la partida", "Buscar su pelota"], "¿Qué no puede esperar?", "Una herida que sangra no puede esperar. Lo primero es avisar a un adulto."],
  [2, "Tu mochila solo tiene sitio para una cosa más. Mañana hay clase de lectura. ¿Qué metes?", "Solo cabe una cosa más. Mañana hay lectura. ¿Qué metes?", "El libro de lectura", ["Un segundo balón", "Unos caramelos"], "Piensa en lo que usarás mañana en clase.", "Para la clase de lectura, lo importante es llevar el libro.", objeto("mochila")],
  [2, "Empieza a llover y {M1} ve la ropa limpia tendida fuera. También estaba mirando un libro de dibujos. ¿Qué hace primero?", "Llueve. La ropa limpia está fuera. {M1} mira un libro. ¿Qué hace primero?", "Recoger la ropa", ["Acabar de mirar el libro", "Sentarse a mirar la lluvia"], "¿Qué se estropea si espera?", "El libro puede esperar. La ropa se moja si no la recoge ya.", objeto("nube")],
  [2, "{F1} encuentra la puerta del corral abierta. Iba a jugar con una amiga. ¿Qué hace primero?", "La puerta del corral está abierta. {F1} iba a jugar. ¿Qué hace primero?", "Cerrar la puerta del corral", ["Ir a jugar y volver por la noche", "Dejarla abierta para que entre el aire"], "¿Qué puede pasar si espera?", "Si no cierra, los animales pueden escaparse. Jugar puede esperar un momento.", objeto("puerta")],
];

interface Compra {
  readonly nombre: string; // "un cuaderno"
  readonly para: string; // "para la escuela"
}

const COMPRAS_NECESARIAS: readonly (readonly [Compra, Compra])[] = [
  [{ nombre: "un cuaderno", para: "para la escuela" }, { nombre: "un lápiz", para: "para escribir" }],
  [{ nombre: "jabón", para: "para lavarte" }, { nombre: "comida", para: "para la cena" }],
  [{ nombre: "comida", para: "para la cena" }, { nombre: "una medicina", para: "para tu abuela enferma" }],
  [{ nombre: "un cuaderno", para: "para la escuela" }, { nombre: "comida", para: "para la cena" }],
];

const CAPRICHOS_COMPRA: readonly string[] = ["un globo", "una pulsera", "una bolsa de caramelos", "un juguete"];

// Hay monedas justas para lo necesario. El capricho no cabe con ambas cosas.
const presupuestoImportante: Generador = (rng, dificultad): Pregunta => {
  const [a, b] = elegir(rng, COMPRAS_NECESARIAS);
  const capricho = elegir(rng, CAPRICHOS_COMPRA);
  const precioA = entero(rng, 3, 8);
  const precioB = entero(rng, 3, 8);
  const precioC = entero(rng, 3, 8);
  const total = precioA + precioB;
  return pregunta(rng, {
    subhabilidad: SUB_IMPORTANTE,
    dificultad,
    enunciado: `Tienes ${monedas(total)}. Necesitas ${a.nombre} ${a.para}, que cuesta ${monedas(precioA)}, y ${b.nombre} ${b.para}, que cuesta ${monedas(precioB)}. También te gusta ${capricho}, que cuesta ${monedas(precioC)}. ¿Qué compras?`,
    enunciadoFacil: `Tienes ${monedas(total)}. Necesitas ${a.nombre}: ${monedas(precioA)}. Necesitas ${b.nombre}: ${monedas(precioB)}. Te gusta ${capricho}: ${monedas(precioC)}. ¿Qué compras?`,
    respuesta: {
      tipo: "opcion",
      correcta: `${primeraMayuscula(a.nombre)} y ${b.nombre}`,
      distractores: [`${primeraMayuscula(a.nombre)} y ${capricho}`, `${primeraMayuscula(b.nombre)} y ${capricho}`, `Solo ${capricho}`],
    },
    pista: "Primero compra lo que necesitas. Después mira si te quedan monedas.",
    explicacion: `Lo necesario cuesta ${precioA} + ${precioB} = ${total}, justo lo que tienes. Te quedas sin monedas para ${capricho}.`,
    plantilla: `${SUB_IMPORTANTE}#monedas#${a.nombre}#${b.nombre}`,
  });
};

function primeraMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const IMPORTANTE_DIFICIL: readonly Fila[] = [
  [3, "{F1} tiene que ir al médico por la mañana y, a la misma hora, la invitan a jugar. Está enferma. ¿Qué es lo importante?", "{F1} está enferma. A la misma hora tiene médico y juego. ¿Qué elige?", "Ir al médico", ["Ir a jugar", "Quedarse a mirar por la ventana"], "¿Qué puede hacerse otro día y qué no?", "{F1} está enferma, y su salud va primero. Puede jugar otro día."],
  [3, "El techo de la clase gotea encima de los libros y la maestra pide ayuda. {M1} estaba dibujando. ¿Qué es lo importante ahora?", "Cae agua sobre los libros. {M1} dibuja. ¿Qué hace?", "Ayudar a apartar los libros", ["Terminar el dibujo", "Pintar el dibujo de otro color"], "¿Qué se estropea si esperan?", "Los libros se mojan y se estropean. El dibujo puede esperar.", objeto("libro")],
  [3, "{F1} solo tiene tiempo para una cosa antes del autobús. Su mochila está sin preparar y hoy necesita sus libros. ¿Qué hace?", "Viene el autobús. La mochila no está lista. ¿Qué hace {F1}?", "Preparar la mochila", ["Jugar un momento con el gato", "Cambiarse de gorra"], "¿Qué necesitará en la escuela?", "Sin la mochila, {F1} no tendrá sus libros en la escuela.", objeto("mochila")],
];

// ---------- PEN2-T4-a: qué hago primero ----------
const PRIMERO: readonly Fila[] = [
  [1, "Quieres pintar un dibujo. ¿Qué haces primero?", "Vas a pintar. ¿Qué haces primero?", "Preparar el papel y las pinturas", ["Enseñar el dibujo terminado", "Guardar las pinturas en la caja"], "Sin materiales no puedes empezar.", "Primero hay que preparar el material. Después se pinta y al final se recoge."],
  [1, "Quieres beber agua hervida. ¿Qué pasa primero?", "Quieres agua hervida. ¿Qué pasa primero?", "Se hierve el agua", ["Se bebe el agua", "Se guarda el vaso en su sitio"], "No se puede beber algo que aún no está listo.", "Primero se hierve el agua, se deja enfriar y después se bebe.", objeto("vaso")],
  [1, "Vas a sembrar en el huerto. ¿Qué haces primero?", "Vas a sembrar. ¿Qué haces primero?", "Hacer un hoyo en la tierra", ["Recoger las verduras", "Tapar la semilla con tierra"], "¿Dónde va la semilla?", "Primero se hace el hoyo. Después se pone la semilla y se tapa.", objeto("flor")],
  [1, "Vas a escribir una carta. ¿Qué haces primero?", "Vas a escribir una carta. ¿Qué haces primero?", "Buscar papel y lápiz", ["Meter la carta en el sobre", "Entregar la carta"], "¿Con qué vas a escribir?", "Sin papel y lápiz no puedes escribir. Por eso se buscan primero.", objeto("lapiz")],
  [1, "Vas a lavar un plato sucio. ¿Qué haces primero?", "Vas a lavar un plato. ¿Qué haces primero?", "Mojar el plato", ["Secar el plato", "Guardar el plato"], "No se seca lo que aún no está lavado.", "Primero se moja y se lava. Secar y guardar van después.", objeto("jabon")],
  [1, "Vas a abrir una puerta cerrada con llave. ¿Qué haces primero?", "La puerta tiene llave. ¿Qué haces primero?", "Meter la llave", ["Entrar en la casa", "Cerrar la puerta otra vez"], "La puerta está cerrada.", "Primero hay que meter la llave y girarla. Después se abre y se entra.", objeto("llave")],

  [2, "{F1} tiene que barrer el suelo y lavarlo con agua. ¿Qué hace primero?", "{F1} debe barrer y lavar el suelo. ¿Qué hace primero?", "Barrer el suelo", ["Lavar el suelo con agua", "Secar el suelo con un trapo"], "Si hay polvo y echas agua, ¿qué se forma?", "Primero se barre, porque con agua la suciedad se haría barro."],
  [2, "{M1} tiene que lavar la ropa y tenderla. ¿Qué hace primero?", "{M1} debe lavar y tender la ropa. ¿Qué hace primero?", "Lavar la ropa", ["Tender la ropa", "Doblar la ropa seca"], "Se tiende la ropa que ya está limpia.", "Primero se lava. Después se tiende para que se seque."],
  [2, "{F1} tiene que poner la mesa y servir la comida. ¿Qué hace primero?", "{F1} debe poner la mesa y servir. ¿Qué hace primero?", "Poner la mesa", ["Servir la comida", "Recoger los platos"], "¿Dónde se pone la comida?", "Hay que poner primero los platos. Después se sirve la comida en ellos.", objeto("mesa")],
  [2, "{M1} quiere enviar una carta. Tiene que escribirla y meterla en un sobre. ¿Qué hace primero?", "{M1} debe escribir la carta y meterla en un sobre. ¿Qué hace primero?", "Escribir la carta", ["Meterla en el sobre", "Cerrar el sobre vacío"], "¿Qué hay que meter en el sobre?", "Primero se escribe. Si cierras antes el sobre, la carta no está dentro."],
  [2, "{F1} va a hervir agua, dejarla enfriar y beberla. ¿Qué hace justo después de hervirla?", "{F1} hierve agua. ¿Qué hace justo después?", "Dejarla enfriar", ["Beberla enseguida", "Volver a llenar el recipiente"], "¿Cómo está el agua recién hervida?", "El agua recién hervida quema. Primero hay que dejarla enfriar.", objeto("vaso")],
  [2, "{M1} quiere pintar una pared que está llena de polvo. ¿Qué hace primero?", "La pared tiene polvo. {M1} quiere pintarla. ¿Qué hace primero?", "Limpiar la pared", ["Pintar la pared", "Guardar la pintura"], "La pintura no agarra bien sobre el polvo.", "Primero se limpia, para que la pintura se quede bien en la pared."],

  [3, "{F1} quiere dibujar, pero su lápiz no tiene punta y el sacapuntas está en la mochila, en otra habitación. ¿Qué hace primero?", "El lápiz no tiene punta. El sacapuntas está en la mochila. ¿Qué hace primero {F1}?", "Ir a buscar el sacapuntas", ["Sacar punta al lápiz", "Empezar a dibujar"], "¿Qué necesita para sacar punta?", "No puede sacar punta sin el sacapuntas. Primero tiene que ir a buscarlo.", objeto("lapiz")],
  [3, "{M1} va a traer agua para beber. El recipiente está sucio. ¿Qué hace primero?", "{M1} va a traer agua para beber. El recipiente está sucio. ¿Qué hace primero?", "Lavar el recipiente", ["Llenar el recipiente", "Beber del recipiente"], "¿Qué le pasaría al agua en un recipiente sucio?", "En un recipiente sucio, el agua se ensucia. Primero hay que lavarlo.", objeto("botella")],
  [3, "Es la hora de comer y la mesa está llena de cuadernos. {F1} debe poner los vasos. ¿Qué hace primero?", "La mesa tiene cuadernos. {F1} debe poner los vasos. ¿Qué hace primero?", "Quitar los cuadernos", ["Poner los vasos", "Sentarse a comer"], "¿Hay sitio para los vasos?", "Primero hay que dejar sitio en la mesa. Después se ponen los vasos.", objeto("mesa")],
  [3, "{M1} quiere sembrar, pero la tierra del huerto está llena de piedras. ¿Qué hace primero?", "La tierra tiene piedras. {M1} quiere sembrar. ¿Qué hace primero?", "Quitar las piedras", ["Poner las semillas", "Recoger las verduras"], "¿Puede hacer un hoyo entre tantas piedras?", "Las piedras no dejan sembrar. Primero hay que quitarlas.", objeto("flor")],
  [3, "{F1} debe comprar cuatro cosas en el mercado y siempre se le olvida alguna. ¿Qué hace antes de salir?", "{F1} debe comprar cuatro cosas. Siempre olvida alguna. ¿Qué hace antes de salir?", "Escribir una lista", ["Volver a casa", "Pagar en la tienda"], "¿Cómo puede acordarse de todo?", "Con una lista no se le olvida nada. Por eso se escribe antes de salir.", objeto("lapiz")],
  [3, "{M1} va a leer de noche. La lámpara no funciona porque no tiene pilas. Las pilas están en un cajón. ¿Qué hace primero?", "Es de noche. La lámpara no tiene pilas. Están en un cajón. ¿Qué hace primero {M1}?", "Buscar las pilas", ["Encender la lámpara", "Empezar a leer"], "¿Qué necesita la lámpara para funcionar?", "Sin pilas la lámpara no enciende. Primero hay que buscarlas y ponerlas.", objeto("libro")],
];

// ---------- PEN2-T4-b: qué necesito ----------
const SUB_NECESITO = "PEN2-T4-b";

interface Tarea {
  readonly frase: string; // "Vas a lavarte las manos."
  readonly util: ObjetoId;
  readonly motivo: string;
}

const TAREAS: readonly Tarea[] = [
  { frase: "Vas a lavarte las manos.", util: "jabon", motivo: "El jabón quita la suciedad de las manos." },
  { frase: "Quieres abrir una puerta cerrada con llave.", util: "llave", motivo: "Una puerta cerrada se abre con su llave." },
  { frase: "Vas a escribir tu nombre.", util: "lapiz", motivo: "Con el lápiz puedes escribir." },
  { frase: "Vas a salir y está lloviendo.", util: "paraguas", motivo: "El paraguas te protege de la lluvia." },
  { frase: "Vas a cortar un papel.", util: "tijeras", motivo: "Las tijeras sirven para cortar." },
  { frase: "Quieres ver de cerca una hormiga muy pequeña.", util: "lupa", motivo: "La lupa hace que las cosas se vean más grandes." },
  { frase: "Quieres saber qué hora es.", util: "reloj", motivo: "El reloj marca la hora." },
  { frase: "Vas a llevar los libros a la escuela.", util: "mochila", motivo: "En la mochila puedes llevar los libros." },
  { frase: "Vas a cepillarte los dientes.", util: "cepillo", motivo: "Los dientes se limpian con un cepillo." },
  { frase: "Vas a cruzar un lago.", util: "barco", motivo: "Para ir por el agua hace falta un barco." },
];

// Nada de esto sirve para ninguna de las tareas.
const OBJETOS_INUTILES: readonly ObjetoId[] = ["pelota", "flor", "gato", "dado", "pera", "hoja", "pato", "luna", "uva", "sol"];

const queObjeto: Generador = (rng, dificultad) => {
  const t = elegir(rng, TAREAS);
  const otros = muestra(rng, OBJETOS_INUTILES, 3);
  const opcion = (o: ObjetoId) => opcionDibujo({ objeto: o });
  return pregunta(rng, {
    subhabilidad: SUB_NECESITO,
    dificultad,
    enunciado: `${t.frase} ¿Qué necesitas?`,
    enunciadoFacil: `${t.frase} ¿Qué necesitas?`,
    respuesta: { tipo: "imagen", correcta: opcion(t.util), distractores: otros.map(opcion) },
    pista: "Imagina que lo haces. ¿Qué tienes en la mano?",
    explicacion: t.motivo,
    plantilla: `${SUB_NECESITO}#${t.util}`,
  });
};

const NECESITO_ESCRITAS: readonly Fila[] = [
  [2, "Para plantar una flor necesitas semillas, tierra y agua. Ya tienes tierra y agua. ¿Qué te falta?", "Necesitas semillas, tierra y agua. Tienes tierra y agua. ¿Qué falta?", "Semillas", ["Tierra", "Agua", "Una pelota"], "Compara lo que necesitas con lo que tienes.", "Ya tienes tierra y agua. De las tres cosas, solo te faltan las semillas.", objeto("flor")],
  [2, "Para lavarte las manos necesitas agua, jabón y una toalla. Ya tienes agua y una toalla. ¿Qué te falta?", "Necesitas agua, jabón y una toalla. Tienes agua y toalla. ¿Qué falta?", "Jabón", ["Agua", "Una toalla", "Un lápiz"], "Compara lo que necesitas con lo que tienes.", "Tienes agua y toalla. Te falta el jabón.", objeto("jabon")],
  [2, "Para escribir una carta necesitas papel, lápiz y un sobre. Ya tienes papel y un sobre. ¿Qué te falta?", "Necesitas papel, lápiz y sobre. Tienes papel y sobre. ¿Qué falta?", "Un lápiz", ["Papel", "Un sobre", "Una taza"], "Compara lo que necesitas con lo que tienes.", "Tienes papel y sobre. Te falta el lápiz.", objeto("lapiz")],
  [2, "Vas a dibujar un mapa de tu barrio en papel. ¿Qué objeto NO necesitas?", "Vas a dibujar en papel. ¿Qué NO necesitas?", "Un vaso", ["Un lápiz", "Un papel"], "Piensa en lo que usas para dibujar.", "Para dibujar usas papel y lápiz. El vaso no hace falta.", objeto("lapiz")],
  [2, "Vas a regar el huerto. ¿Qué objeto NO necesitas?", "Vas a regar el huerto. ¿Qué NO necesitas?", "Un libro", ["Agua", "Una botella o regadera"], "Piensa en lo que usas para regar.", "Para regar necesitas agua y algo para llevarla. El libro no hace falta.", objeto("botella")],
  [2, "Vas a jugar a la pelota con tus amigos. ¿Qué es lo que no puede faltar?", "Vas a jugar a la pelota. ¿Qué no puede faltar?", "Una pelota", ["Una cama", "Una llave"], "Mira el nombre del juego.", "Sin pelota no se puede jugar a la pelota."],

  [3, "Vas a plantar un árbol. ¿Qué lista tiene todo lo que necesitas?", "Vas a plantar un árbol. ¿Qué lista es la buena?", "Árbol pequeño, tierra y agua", ["Árbol pequeño y un libro", "Agua, sillas y un lápiz"], "Piensa en cada paso y en qué usas.", "Para plantar hace falta el árbol pequeño, tierra donde ponerlo y agua para regarlo.", objeto("arbol")],
  [3, "Vas a lavar la ropa a mano. ¿Qué lista tiene todo lo que necesitas?", "Vas a lavar ropa. ¿Qué lista es la buena?", "Ropa sucia, agua y jabón", ["Ropa sucia y un lápiz", "Agua, un dado y una pelota"], "Piensa en cada paso y en qué usas.", "Para lavar ropa hacen falta la ropa, agua y jabón.", objeto("jabon")],
  [3, "Vas a escribir y enviar una carta. ¿Qué lista tiene todo lo que necesitas?", "Vas a enviar una carta. ¿Qué lista es la buena?", "Papel, lápiz y sobre", ["Papel y una pelota", "Sobre, tijeras y un gato"], "Piensa en cada paso y en qué usas.", "Escribes con lápiz en el papel y lo metes en el sobre."],
];

interface Reparto {
  readonly objeto: ObjetoId;
  readonly plural: string;
  readonly quienes: string;
  readonly femenino: boolean;
}

const REPARTOS: readonly Reparto[] = [
  { objeto: "silla", plural: "sillas", quienes: "niños van a sentarse, uno en cada silla", femenino: true },
  { objeto: "vaso", plural: "vasos", quienes: "niños van a beber, cada uno en su vaso", femenino: false },
  { objeto: "lapiz", plural: "lápices", quienes: "niños van a escribir, cada uno con su lápiz", femenino: false },
  { objeto: "libro", plural: "libros", quienes: "niños van a leer, cada uno con su libro", femenino: false },
  { objeto: "cuaderno", plural: "cuadernos", quienes: "niños van a dibujar, cada uno en su cuaderno", femenino: false },
];

// Cuántos faltan: necesarios menos los que ya hay.
const cuantosFaltan: Generador = (rng, dificultad) => {
  const r = elegir(rng, REPARTOS);
  const hay = entero(rng, 2, 6);
  const faltan = entero(rng, 1, 4);
  const ninos = hay + faltan;
  const cuantos = r.femenino ? "Cuántas" : "Cuántos";
  const mas = `¿${cuantos} ${r.plural} más hacen falta?`;
  return pregunta(rng, {
    subhabilidad: SUB_NECESITO,
    dificultad,
    enunciado: `${ninos} ${r.quienes}. Hay ${hay} ${r.plural}. ${mas}`,
    enunciadoFacil: `Hay ${ninos} niños. Hay ${hay} ${r.plural}. Cada niño necesita uno. ${mas}`.replace("necesita uno", r.femenino ? "necesita una" : "necesita uno"),
    imagen: { tipo: "objetos", grupos: [{ objeto: r.objeto, cantidad: hay }] },
    respuesta: { tipo: "numero", valor: faltan },
    pista: `Piensa ${cuantos.toLowerCase()} hacen falta en total y ${cuantos.toLowerCase()} hay ya.`,
    explicacion: `Hacen falta ${ninos} y hay ${hay}. Faltan ${ninos} − ${hay} = ${faltan}.`,
  });
};

// ---------- PEN2-T5-a: agua segura ----------
const AGUA: readonly Fila[] = [
  [1, "¿Qué agua puedes beber sin peligro?", "¿Qué agua es segura?", "Agua hervida", ["Agua de un charco", "Agua sucia del río"], "Piensa en cuál no tiene microbios.", "Al hervir el agua mueren los microbios. Por eso es segura.", objeto("vaso")],
  [1, "Tienes sed y solo ves un charco cerca. ¿Qué haces?", "Tienes sed. Ves un charco. ¿Qué haces?", "Buscar agua segura", ["Beber del charco", "Mojar los labios en el charco"], "El agua del charco está en el suelo.", "El agua de un charco está sucia y puede enfermarte. Hay que buscar agua segura."],
  [1, "¿Dónde se guarda el agua de beber?", "¿Dónde guardas el agua de beber?", "En un recipiente limpio y tapado", ["En un recipiente sucio y abierto", "En una caja de cartón abierta"], "Piensa cómo evitar que entre suciedad.", "Limpio y tapado: así no entra suciedad ni insectos en el agua.", objeto("botella")],
  [1, "El agua de la botella está marrón. ¿Qué haces?", "El agua está marrón. ¿Qué haces?", "No beberla y avisar a un adulto", ["Beberla deprisa", "Dársela a un amigo"], "El agua segura no tiene ese color.", "El agua marrón tiene suciedad. No se bebe, y hay que avisar a un adulto.", objeto("botella")],
  [1, "Vas a beber agua. ¿Cómo debe estar el vaso?", "Vas a beber. ¿Cómo está el vaso?", "Limpio", ["Sucio", "Lleno de tierra"], "El agua toca el vaso antes de llegar a tu boca.", "Un vaso sucio ensucia el agua. El vaso debe estar limpio.", objeto("vaso")],
  [1, "¿Para qué se hierve el agua?", "¿Por qué se hierve el agua?", "Para matar los microbios", ["Para que cambie de color", "Para que haya más agua"], "Piensa en lo que nos hace enfermar.", "Al hervir el agua, los microbios mueren y es más segura para beber."],

  [2, "{F1} ve agua transparente en un río. ¿Puede beberla sin peligro?", "El agua del río parece limpia. ¿{F1} puede beberla?", "No, puede tener microbios que no se ven", ["Sí, porque es transparente", "Sí, si hace mucho calor"], "¿Todo lo que hay en el agua se ve?", "Los microbios no se ven. Un agua transparente también puede enfermarte."],
  [2, "¿Cómo sacas agua del recipiente de beber de tu casa?", "¿Cómo sacas el agua de beber?", "Con un cucharón limpio", ["Metiendo las manos", "Metiendo un vaso sucio"], "Lo que entra en el agua debe estar limpio.", "Las manos y los vasos sucios ensucian toda el agua. Se usa un cucharón limpio."],
  [2, "¿Por qué hay que tapar el recipiente del agua?", "¿Por qué tapas el agua?", "Para que no entren insectos ni suciedad", ["Para que el agua pese menos", "Para que el agua cambie de color"], "Piensa en lo que puede caer dentro.", "La tapa impide que caigan insectos y suciedad en el agua.", objeto("botella")],
  [2, "{M1} va a llenar un recipiente sucio con agua de beber. ¿Qué debe hacer antes?", "El recipiente está sucio. {M1} va a llenarlo. ¿Qué hace antes?", "Lavar el recipiente", ["Dejarlo al sol sin lavar", "Llenarlo sin mirar"], "El agua limpia no sigue limpia en un recipiente sucio.", "Si el recipiente está sucio, ensucia el agua. Hay que lavarlo antes."],
  [2, "Un adulto ha hervido agua. ¿Qué hay que esperar antes de beberla?", "El agua está recién hervida. ¿Qué esperas?", "A que se enfríe", ["A que se ensucie", "A que entren moscas"], "¿Cómo está el agua recién hervida?", "El agua recién hervida quema. Hay que esperar a que se enfríe.", objeto("vaso")],
  [2, "Las vacas beben y se meten en una charca. ¿Es segura esa agua para las personas?", "Las vacas se meten en una charca. ¿Es segura esa agua?", "No, porque está sucia", ["Sí, porque las vacas la beben", "Sí, si la bebes deprisa"], "Piensa en lo que dejan los animales en el agua.", "Los animales ensucian el agua. No es segura para las personas.", objeto("vaca")],

  [3, "{F1} guarda el agua en un recipiente limpio y tapado. {M1} la guarda en uno abierto. ¿Qué agua está mejor protegida?", "{F1} tapa su agua. {M1} no. ¿Cuál está mejor protegida?", "La de {F1}", ["La de {M1}", "Las dos por igual"], "¿En cuál puede caer algo?", "El agua de {F1} está tapada: no entra suciedad. En la de {M1} sí puede entrar."],
  [3, "Ayer hirvieron agua, pero hoy está sin tapa y hay moscas encima. ¿Es segura?", "Ayer hirvieron el agua. Hoy está sin tapa. Tiene moscas. ¿Es segura?", "No, se ha podido ensuciar", ["Sí, porque ya estaba hervida", "Sí, porque las moscas son pequeñas"], "¿Qué pasa con el agua después de hervirla, si no se protege?", "Hervir no protege para siempre. Las moscas pueden ensuciar el agua otra vez."],
  [3, "{M1} va a lavar una fruta para comerla. ¿Con qué agua debe lavarla?", "{M1} va a lavar una fruta. ¿Con qué agua?", "Con agua segura", ["Con agua de un charco", "Con agua de lavar los platos"], "El agua que moja la fruta llega a tu boca.", "Si lavas la fruta con agua sucia, la fruta se ensucia. Hay que usar agua segura.", objeto("manzana")],
  [3, "El baño de una casa está justo al lado del pozo de agua. ¿Por qué es peligroso?", "El baño está al lado del pozo. ¿Por qué es peligroso?", "Porque la suciedad puede llegar al agua", ["Porque el pozo se hace más hondo", "Porque el agua se pone fría"], "El agua y la suciedad pueden moverse por debajo de la tierra.", "La suciedad del baño puede pasar por la tierra hasta el agua del pozo."],
  [3, "A tu vaso de agua segura le cae tierra. ¿Qué haces?", "Cae tierra en tu vaso de agua. ¿Qué haces?", "No la bebo y lavo el vaso", ["La bebo, porque era agua segura", "Quito la tierra con un dedo y bebo"], "¿Sigue siendo segura esa agua?", "La tierra ensucia el agua. Ya no es segura, aunque antes lo fuera.", objeto("vaso")],
  [3, "¿Cuál de estas frases es verdad?", "¿Qué frase es verdad?", "El agua transparente también puede enfermarte", ["El agua transparente siempre es segura", "El agua marrón es buena para beber"], "Recuerda: los microbios no se ven.", "Los microbios no se ven, así que el agua puede parecer limpia y no serlo."],
];

// ---------- PEN2-T5-b: higiene ----------
const HIGIENE: readonly Fila[] = [
  [1, "¿Cuándo es bueno cepillarse los dientes?", "¿Cuándo te cepillas los dientes?", "Después de comer", ["Mientras juegas", "Mientras caminas a la escuela"], "Piensa en lo que se queda entre los dientes.", "Después de comer quedan restos en los dientes. Por eso se cepillan entonces.", objeto("cepillo")],
  [1, "Has jugado y tienes el cuerpo sudado y sucio. ¿Qué haces?", "Has jugado. Tienes el cuerpo sucio. ¿Qué haces?", "Lavarme el cuerpo", ["Dormir así", "Ponerme encima ropa limpia"], "El sudor y la suciedad se quitan con agua y jabón.", "Lavarse el cuerpo quita el sudor y la suciedad.", objeto("jabon")],
  [1, "Tu ropa está muy sucia. ¿Qué haces con ella?", "Tu ropa está sucia. ¿Qué haces?", "Lavarla", ["Ponérmela otra vez", "Esconderla debajo de la cama"], "La ropa también se limpia.", "La ropa sucia se lava para quitar la suciedad y los microbios."],
  [1, "Tienes las uñas largas y sucias. ¿Qué haces?", "Tus uñas están largas y sucias. ¿Qué haces?", "Limpiarlas y cortarlas", ["Morderlas", "Dejarlas crecer más"], "Bajo las uñas se queda la suciedad.", "La suciedad se esconde en las uñas. Por eso se limpian y se cortan.", objeto("dedo")],
  [1, "Vas a toser. ¿Cómo lo haces?", "Vas a toser. ¿Cómo lo haces?", "Tapándome con el codo", ["Tosiendo encima de un amigo", "Tosiendo sobre la comida"], "Al toser salen microbios por la boca.", "Si te tapas con el codo, los microbios no llegan a los demás."],
  [1, "¿De quién debe ser tu cepillo de dientes?", "¿De quién es tu cepillo?", "Solo mío", ["De toda la clase", "De cualquier amigo"], "El cepillo entra en tu boca.", "Cada persona usa su propio cepillo, para no pasarse microbios.", objeto("cepillo")],

  [2, "¿Por qué hay que cepillarse los dientes?", "¿Por qué te cepillas los dientes?", "Para quitar restos y cuidar los dientes", ["Para que los dientes crezcan más", "Para no tener que comer"], "Piensa en lo que le pasa a un diente que no se limpia.", "Los restos de comida dañan los dientes. El cepillo los quita.", objeto("cepillo")],
  [2, "{F1} va a estornudar y no tiene pañuelo. ¿Qué es lo mejor?", "{F1} va a estornudar. No tiene pañuelo. ¿Qué hace?", "Taparse con el codo", ["Estornudar sobre la mesa", "Estornudar mirando a sus amigas"], "Busca algo que no use luego para tocar cosas.", "Con el codo tapa los microbios, y no quedan en las manos."],
  [2, "{M1} se ha sonado la nariz con un pañuelo de papel. ¿Qué hace con el pañuelo?", "{M1} usa un pañuelo de papel. ¿Qué hace con él?", "Tirarlo a la basura", ["Dejarlo en la mesa", "Prestárselo a un amigo"], "El pañuelo usado tiene microbios.", "Un pañuelo usado tiene microbios. Va a la basura, y después hay que lavarse las manos."],
  [2, "A {F1} le pica mucho la cabeza y sus compañeros le piden el peine. ¿Qué debe hacer con su peine?", "A {F1} le pica la cabeza. Le piden su peine. ¿Qué hace?", "No prestarlo", ["Prestarlo a toda la clase", "Peinar a sus amigas con él"], "Por el peine pueden pasar los piojos.", "Los piojos pueden pasar de una cabeza a otra por el peine. No se presta."],
  [2, "{M1} ha ido al baño. ¿Qué debe hacer antes de salir?", "{M1} usa el baño. ¿Qué hace antes de salir?", "Lavarse las manos", ["Peinarse", "Atarse los zapatos"], "Piensa en lo que han tocado sus manos.", "Después del baño hay que lavarse las manos para quitar los microbios.", objeto("jabon")],
  [2, "¿Dónde se tira la basura en la escuela?", "¿Dónde va la basura?", "En el basurero", ["En el suelo del patio", "Debajo de la mesa"], "La basura en el suelo atrae moscas.", "En el basurero, la basura no ensucia ni atrae moscas ni ratones."],

  [3, "{F1} se cepilla los dientes cada día. {M1} solo una vez a la semana. ¿Quién cuida mejor sus dientes?", "{F1} se cepilla cada día. {M1} una vez a la semana. ¿Quién lo hace mejor?", "{F1}", ["{M1}", "Los dos igual"], "Piensa en cuántos días quedan restos en los dientes.", "Cepillarse cada día limpia los restos. {M1} los deja casi toda la semana.", objeto("cepillo")],
  [3, "¿Por qué es mejor taparse con el codo que con la mano al toser?", "¿Por qué el codo es mejor que la mano al toser?", "Porque con la mano tocas luego muchas cosas", ["Porque el codo es más grande", "Porque la mano no tapa nada"], "Piensa en lo que tocas después con la mano.", "Los microbios se quedan en la mano y pasan a lo que tocas. Con el codo no tocas cosas."],
  [3, "{M1} se pone ropa limpia sin lavarse después de jugar en el barro. ¿Qué le falta hacer antes?", "{M1} tiene barro. Se pone ropa limpia. ¿Qué debe hacer antes?", "Lavarse el cuerpo", ["Ponerse más ropa", "Peinarse el pelo"], "La suciedad sigue en su piel.", "El barro sigue en su cuerpo y ensucia la ropa limpia. Primero debe lavarse."],
  [3, "Hay moscas sobre la basura de la clase. ¿Qué es lo mejor?", "Hay moscas en la basura. ¿Qué es lo mejor?", "Tapar el basurero y sacar la basura", ["Dejar la basura junto a la comida", "Espantar las moscas y dejarlo igual"], "Las moscas llevan suciedad a otros sitios.", "Si la basura se tapa y se saca, las moscas no llevan suciedad a la comida."],
  [3, "¿Cuál de estas frases es verdad?", "¿Qué frase es verdad?", "La limpieza ayuda a no enfermar", ["Lavarse hace enfermar", "Los microbios se van solos de las manos"], "Piensa para qué sirve lavarse.", "Lavarse quita microbios. Por eso la limpieza ayuda a no enfermar."],
  [3, "{F1} comparte su vaso con una amiga que tiene tos. ¿Qué es lo mejor?", "Una amiga de {F1} tiene tos. Comparten vaso. ¿Qué es lo mejor?", "Que cada una use su vaso", ["Que beban las dos a la vez", "Que usen el mismo vaso sin lavarlo"], "Piensa en lo que pasa de una boca a la otra.", "Los microbios pasan de una boca a otra por el vaso. Cada una debe usar el suyo.", objeto("vaso")],
];

// ---------- PEN2-T5-c: comida variada ----------
const SUB_COMIDA = "PEN2-T5-c";
const FRUTAS: readonly ObjetoId[] = ["manzana", "pera", "naranja", "uva"];

function platoVariado(fruta: ObjetoId): { readonly texto: string; readonly imagen: Imagen } {
  const objetos: readonly ObjetoId[] = [fruta, "pan", "huevo"];
  return {
    texto: lista(objetos.map(nombreObjeto)),
    imagen: { tipo: "objetos", grupos: objetos.map((o) => ({ objeto: o, cantidad: 1 })) },
  };
}

function platoIgual(o: ObjetoId, plural: string): { readonly texto: string; readonly imagen: Imagen } {
  return { texto: `3 ${plural}`, imagen: { tipo: "objetos", grupos: [{ objeto: o, cantidad: 3 }] } };
}

const PLURAL_FRUTA: Readonly<Partial<Record<ObjetoId, string>>> = { manzana: "manzanas", pera: "peras", naranja: "naranjas", uva: "uvas" };

const platoMasVariado: Generador = (rng, dificultad) => {
  const fruta = elegir(rng, FRUTAS);
  return pregunta(rng, {
    subhabilidad: SUB_COMIDA,
    dificultad,
    enunciado: "¿Qué plato tiene comida más variada?",
    enunciadoFacil: "¿Qué plato tiene comidas distintas?",
    respuesta: {
      tipo: "imagen",
      correcta: platoVariado(fruta),
      distractores: [platoIgual("pan", "panes"), platoIgual("huevo", "huevos"), platoIgual(fruta, PLURAL_FRUTA[fruta] ?? "")],
    },
    pista: "Busca el plato donde hay cosas diferentes.",
    explicacion: `En ese plato hay tres comidas distintas: ${conArticulo(fruta)}, el pan y el huevo. Los demás platos repiten una sola comida.`,
    plantilla: `${SUB_COMIDA}#plato#${fruta}`,
  });
};

const COMIDA: readonly Fila[] = [
  [1, "¿Qué es más sano para comer cada día?", "¿Qué es más sano cada día?", "Fruta", ["Caramelos", "Refresco con mucho azúcar"], "Piensa en lo que ayuda a tu cuerpo a crecer.", "La fruta da al cuerpo cosas buenas. Los dulces solo se comen de vez en cuando.", objeto("manzana")],
  [1, "¿Por qué es bueno comer alimentos distintos?", "¿Por qué comes alimentos distintos?", "Porque cada uno da algo al cuerpo", ["Porque así comes menos veces", "Porque así no hace falta beber"], "No todos los alimentos dan lo mismo.", "Cada alimento ayuda de una forma. Por eso conviene comer variado."],
  [1, "¿Qué le pasa a tu cuerpo si comes solo dulces?", "Comes solo dulces. ¿Qué pasa?", "Le faltan cosas que necesita", ["Crece mejor que nunca", "Se hace más fuerte"], "Los dulces tienen mucho azúcar.", "Los dulces no dan al cuerpo todo lo que necesita. Además, dañan los dientes."],

  [2, "{F1} come todos los días solo pan. ¿Qué debería añadir?", "{F1} come solo pan. ¿Qué debe añadir?", "Fruta y verdura", ["Más pan", "Caramelos"], "Busca comidas distintas del pan.", "Comer solo pan no es variado. La fruta y la verdura le dan lo que le falta.", objeto("pan")],
  [2, "{M1} ha comido arroz con verduras. ¿Qué postre hace su comida más sana?", "{M1} comió arroz y verduras. ¿Qué postre es más sano?", "Una fruta", ["Una bolsa de caramelos", "Un vaso de refresco"], "Busca lo que no tiene azúcar añadido.", "La fruta es el postre más sano: da cosas buenas sin azúcar añadido.", objeto("naranja")],
  [2, "Tu cuerpo necesita alimentos distintos. ¿Qué grupo de comidas es el más variado?", "¿Qué comida es más variada?", "Arroz, huevo, verdura y fruta", ["Arroz, arroz y más arroz", "Caramelos, galletas y refresco"], "Cuenta cuántas comidas diferentes hay.", "Ese grupo tiene cuatro comidas distintas. Los otros repiten lo mismo o solo tienen dulces."],
  [2, "{F1} no quiere comer nunca verdura. ¿Qué le falta a su comida?", "{F1} no come verdura. ¿Qué le falta?", "Variedad", ["Más dulces", "Más azúcar"], "Piensa en lo que tiene que tener una buena comida.", "Si deja fuera la verdura, su comida es menos variada y el cuerpo pierde lo que esta le da."],
  [2, "¿Qué debes beber más a menudo?", "¿Qué bebes más a menudo?", "Agua segura", ["Refresco con azúcar", "Agua de un charco"], "Tu cuerpo la necesita cada día.", "El agua segura es la mejor bebida. El refresco tiene mucho azúcar.", objeto("vaso")],

  [3, "Para comer, {F1} tiene arroz, verduras y huevo. {M1} tiene solo galletas. ¿Quién tiene la comida más variada?", "{F1} come arroz, verduras y huevo. {M1} come solo galletas. ¿Quién come más variado?", "{F1}", ["{M1}", "Los dos igual"], "Cuenta las comidas distintas de cada uno.", "{F1} tiene tres comidas distintas y {M1} solo una."],
  [3, "Mira lo que comieron ayer. ¿Quién comió más variado?", "Mira la tabla. ¿Quién comió más variado?", "{M1}", ["{F1}", "{N1}"], "Cuenta las comidas distintas de cada fila.", "{M1} comió cuatro comidas distintas. {F1} repitió una sola y {N1} comió solo dulces.", { tipo: "tabla", titulo: "La comida de ayer", cabeceras: ["Nombre", "Comida"], filas: [["{F1}", "pan, pan y pan"], ["{M1}", "arroz, huevo, verdura y fruta"], ["{N1}", "caramelos y galletas"]] }],
  [3, "La comida de {F1} tiene arroz y huevo. ¿Qué le añadirías para que sea más variada?", "{F1} come arroz y huevo. ¿Qué añades para más variedad?", "Verdura", ["Más arroz", "Otro huevo"], "Busca una comida que aún no tenga.", "La verdura es una comida distinta. Más arroz u otro huevo repiten lo que ya tiene."],
  [3, "{M1} dice: «Si como mucho de lo mismo, ya estoy bien alimentado». ¿Tiene razón?", "{M1} dice: como mucho de lo mismo y ya está. ¿Tiene razón?", "No, el cuerpo necesita comidas distintas", ["Sí, solo importa comer mucho", "Sí, si es algo dulce"], "¿Importa solo cuánto comes, o también qué comes?", "No basta con comer mucho. El cuerpo necesita comidas distintas."],
  [3, "¿Cuál de estas frases es verdad?", "¿Qué frase es verdad?", "Comer variado ayuda a crecer sano", ["Los dulces deben ser la comida principal", "Comer una sola cosa es lo mejor"], "Piensa en todo lo que hemos visto sobre comer bien.", "El cuerpo necesita muchas cosas distintas. Por eso comer variado ayuda a crecer sano."],
  [3, "{F1} tiene monedas para una merienda. ¿Qué elige si quiere comer sano?", "{F1} quiere una merienda sana. ¿Qué elige?", "Una fruta", ["Una bolsa de caramelos", "Un refresco con azúcar"], "Busca lo que tiene menos azúcar añadido.", "La fruta es sana y no lleva azúcar añadido. Los caramelos y el refresco, sí.", objeto("moneda")],
];

function comoGeneradorMezcla(g1: Generador, g2: Generador): Generador {
  return (rng: Rng, dificultad: Dificultad) => (rng() < 0.5 ? g1 : g2)(rng, dificultad);
}

export const GENERADORES_SEGUNDO = {
  "PEN2-T2-a": [situaciones("PEN2-T2-a", QUE_PASA)],
  "PEN2-T2-b": [situaciones("PEN2-T2-b", POR_QUE)],
  "PEN2-T3-a": [porDificultad({ 1: [elegirNecesidad], 2: [situaciones(SUB_NECESIDAD, NECESIDAD_MEDIA)], 3: [situaciones(SUB_NECESIDAD, NECESIDAD_DIFICIL)] })],
  "PEN2-T3-b": [porDificultad({
    1: [situaciones(SUB_IMPORTANTE, IMPORTANTE)],
    2: [situaciones(SUB_IMPORTANTE, IMPORTANTE)],
    3: [comoGeneradorMezcla(presupuestoImportante, situaciones(SUB_IMPORTANTE, IMPORTANTE_DIFICIL))],
  })],
  "PEN2-T4-a": [situaciones("PEN2-T4-a", PRIMERO)],
  "PEN2-T4-b": [porDificultad({ 1: [queObjeto], 2: [situaciones(SUB_NECESITO, NECESITO_ESCRITAS)], 3: [comoGeneradorMezcla(cuantosFaltan, situaciones(SUB_NECESITO, NECESITO_ESCRITAS))] })],
  "PEN2-T5-a": [situaciones("PEN2-T5-a", AGUA)],
  "PEN2-T5-b": [situaciones("PEN2-T5-b", HIGIENE)],
  "PEN2-T5-c": [porDificultad({ 1: [comoGeneradorMezcla(platoMasVariado, situaciones(SUB_COMIDA, COMIDA))], 2: [situaciones(SUB_COMIDA, COMIDA)], 3: [situaciones(SUB_COMIDA, COMIDA)] })],
} as const;
