// PEN4-T4 y PEN4-T5 · Riesgos y trabajo en equipo.
import type { Rng } from "../../../core/rng.ts";
import { barajar, elegir, entero, monedas, muestra, nombres } from "../../ayuda.ts";
import { generadorDeSituaciones } from "../../plantillas.ts";
import type { Generador } from "../../tipos.ts";
import { buscar, en, enumerar, generadorDePlantillas, minutos, situaciones, type Contenido, type Plantilla } from "./comun.ts";

const RIESGO = situaciones("PEN4-T4-a", [
  { d: 1, e: "¿Cuál de estas situaciones es peligrosa?", f: "¿Cuál es peligrosa?", c: "Jugar cerca de un pozo sin tapa", x: ["Leer sentado en un banco", "Regar las plantas del patio", "Dibujar en un cuaderno"], p: "Piensa dónde alguien podría caerse.", ex: "Un niño podría caerse a un pozo sin tapa. Las otras actividades no tienen ese peligro." },
  { d: 1, e: "{M1} va a cruzar una calle con muchos coches y motos. ¿Qué sería un riesgo?", f: "{M1} va a cruzar una calle con muchos coches. ¿Qué sería un riesgo?", c: "Cruzar corriendo sin mirar", x: ["Parar en la acera y mirar", "Esperar a que no pase nadie", "Cruzar por el paso de peatones mirando"], p: "¿Qué opción no comprueba si viene alguien?", ex: "Si cruza sin mirar, un coche o una moto pueden atropellarle." },
  { d: 1, e: "{F1} encuentra una botella sin etiqueta con un líquido dentro. ¿Qué sería peligroso?", f: "{F1} encuentra una botella sin etiqueta. ¿Qué sería peligroso?", c: "Probar el líquido para saber qué es", x: ["No tocarla y avisar a un adulto", "Dejarla donde estaba", "Alejarse de la botella"], p: "No sabemos qué hay dentro.", ex: "Podría ser un veneno o un producto de limpieza. Nunca se prueba." },
  { d: 1, e: "Hay un cable caído en el suelo después de la tormenta. ¿Qué sería peligroso?", f: "Hay un cable caído en el suelo. ¿Qué sería peligroso?", c: "Tocarlo con la mano", x: ["Alejarse de él", "Avisar a un adulto", "Rodearlo desde lejos"], p: "Un cable puede tener electricidad.", ex: "Un cable caído puede dar una descarga muy fuerte. No se toca nunca." },
  { d: 1, e: "Una hoguera sigue encendida en el campo. ¿Qué sería peligroso?", f: "Hay una hoguera encendida. ¿Qué sería peligroso?", c: "Jugar a saltarla", x: ["Quedarse lejos", "Avisar a un adulto", "Ir por otro camino"], p: "El fuego quema aunque parezca pequeño.", ex: "Saltar una hoguera puede causar quemaduras graves." },
  { d: 1, e: "¿Cuál de estas cosas es un riesgo en casa?", f: "¿Cuál es un riesgo en casa?", c: "Dejar un cuchillo al alcance de un bebé", x: ["Guardar los cuchillos en un lugar alto", "Poner los zapatos junto a la puerta", "Barrer el suelo de la cocina"], p: "Piensa en quién podría hacerse daño.", ex: "Un bebé no sabe que el cuchillo corta y puede herirse." },
  { d: 2, e: "El río baja con mucha agua después de la lluvia. {M1} quiere cruzarlo por donde siempre. ¿Cuál es el riesgo?", f: "El río baja con mucha agua. {M1} quiere cruzar. ¿Cuál es el riesgo?", c: "Que la corriente lo arrastre", x: ["Que se le mojen los cordones", "Que tarde un poco más en llegar", "Que el agua esté muy fría al tocarla"], p: "Busca lo que podría hacerle más daño.", ex: "Con mucha agua, la corriente es fuerte y puede arrastrar a una persona." },
  { d: 2, e: "Una persona desconocida le dice a {F1} que suba a su coche para llevarla a casa. ¿Cuál es el riesgo?", f: "Una persona desconocida le dice a {F1} que suba a su coche. ¿Cuál es el riesgo?", c: "No saber quién es ni adónde la llevaría", x: ["Que el coche vaya demasiado despacio", "Que el asiento esté un poco sucio", "Llegar antes de la hora a casa"], p: "¿Qué sabe {F1} de esa persona?", ex: "No se sube con desconocidos: nadie sabe qué intenciones tienen." },
  { d: 2, e: "{M1} bebe agua de un charco porque tiene sed. ¿Cuál es el riesgo?", f: "{M1} bebe agua de un charco. ¿Cuál es el riesgo?", c: "Ponerse enfermo por el agua sucia", x: ["Quedarse con más sed", "Que el charco se seque", "Mojarse las manos"], p: "¿Qué puede haber en esa agua?", ex: "El agua de un charco puede tener microbios que causan enfermedades." },
  { d: 2, e: "Hay tormenta con rayos y {F1} está en el campo. Quiere ponerse debajo del árbol más alto. ¿Cuál es el riesgo?", f: "Hay tormenta con rayos. {F1} quiere ponerse bajo un árbol alto. ¿Cuál es el riesgo?", c: "Que un rayo caiga en el árbol", x: ["Que se le mojen los zapatos", "Que las hojas la despeinen", "Que el árbol tenga pocas hojas"], p: "Los rayos suelen caer en lo más alto.", ex: "Los rayos suelen caer en lugares altos, así que un árbol alto es un mal refugio." },
  { d: 2, e: "{M1} encuentra unas pastillas de colores en un cajón y cree que son caramelos. ¿Cuál es el riesgo?", f: "{M1} encuentra pastillas de colores. Cree que son caramelos. ¿Cuál es el riesgo?", c: "Tomar una medicina que le haga daño", x: ["Que no le guste el sabor", "Que el cajón se quede vacío", "Que se le caigan al suelo"], p: "Las medicinas no son golosinas.", ex: "Una medicina tomada sin que la dé un adulto puede ser muy peligrosa." },
  { d: 2, e: "{F1} sube a una escalera con un peldaño roto para bajar una caja. ¿Cuál es el riesgo?", f: "{F1} sube a una escalera con un peldaño roto. ¿Cuál es el riesgo?", c: "Caerse y hacerse daño", x: ["Tardar mucho en subir", "Mancharse las manos de polvo", "Bajar la caja que no era"], p: "¿Qué puede pasar si el peldaño cede?", ex: "Si el peldaño cede, se caerá desde lo alto y puede lesionarse." },
  { d: 3, e: "{M1} está en el mercado y un adulto desconocido le pregunta dónde vive y a qué hora está solo en casa. ¿Qué riesgo hay en responder?", f: "Un desconocido pregunta a {M1} dónde vive. También pregunta cuándo está solo. ¿Qué riesgo hay en responder?", c: "Dar datos privados a quien puede usarlos para mal", x: ["Tardar más en hacer la compra", "Olvidar lo que iba a comprar", "Hablar demasiado bajo"], p: "¿Por qué querría saber eso un desconocido?", ex: "Esos datos son privados. A un desconocido no se le dan nunca." },
  { d: 3, e: "{F1} se ha cortado con una lata oxidada y dice que no pasa nada. No lava la herida ni lo cuenta. ¿Cuál es el riesgo mayor?", f: "{F1} se corta con una lata oxidada. No lava la herida. No lo cuenta. ¿Cuál es el riesgo mayor?", c: "Que la herida se infecte", x: ["Que se manche la ropa", "Que la lata se pierda", "Que le dé vergüenza la venda"], p: "Piensa en lo que puede pasar con la herida en unos días.", ex: "Una herida sucia puede infectarse. Hay que lavarla y contárselo a un adulto." },
  { d: 3, e: "En una cocina, una olla hierve con el mango hacia fuera y un niño pequeño corre cerca. ¿Cuál es el riesgo?", f: "Una olla hierve con el mango hacia fuera. Un niño pequeño corre cerca. ¿Cuál es el riesgo?", c: "Que tire de la olla y se queme", x: ["Que el agua se enfríe", "Que la comida tarde más", "Que la olla se ensucie"], p: "Imagina hasta dónde llega la mano del niño.", ex: "El niño puede agarrar el mango y volcarse encima el agua hirviendo." },
  { d: 3, e: "{M1} y sus amigos quieren bañarse en una charca que no conocen. No hay ningún adulto cerca. ¿Por qué es arriesgado?", f: "{M1} y sus amigos quieren bañarse en una charca que no conocen. No hay adultos. ¿Por qué es arriesgado?", c: "No saben su profundidad y nadie podría ayudarlos", x: ["Porque se les mojaría el pelo", "Porque el agua siempre está caliente", "Porque tendrían que secarse al salir"], p: "Hay dos peligros en la situación. Busca la opción que los nombra.", ex: "No saben si cubre ni qué hay en el fondo, y sin adultos nadie podría ayudarlos." },
  { d: 3, e: "{F1} ve que sale humo por debajo de una puerta del edificio de la escuela. Sus amigos dicen que será una broma. ¿Qué riesgo hay en no hacer nada?", f: "{F1} ve humo bajo una puerta de la escuela. Sus amigos dicen que es una broma. ¿Qué riesgo hay en no hacer nada?", c: "Que un incendio crezca sin que nadie avise", x: ["Que se le olvide la tarea", "Que llegue tarde al recreo", "Que la puerta se quede abierta"], p: "Donde hay humo puede haber fuego.", ex: "Si hay fuego y nadie avisa, puede crecer y poner en peligro a todos." },
  { d: 3, e: "{M1} carga en la bicicleta un saco que le tapa la vista del camino. ¿Cuál es el riesgo?", f: "{M1} lleva en la bicicleta un saco. El saco le tapa la vista. ¿Cuál es el riesgo?", c: "Chocar por no ver lo que viene", x: ["Que el saco se ensucie un poco", "Llegar con las manos cansadas", "Que le pregunten qué lleva"], p: "¿Qué pasa si no ves el camino?", ex: "Sin ver el camino puede chocar con alguien o caerse." },
]);

const AYUDA = situaciones("PEN4-T4-b", [
  { d: 1, e: "{F1} se pierde en el mercado y no encuentra a su familia. ¿A quién es mejor pedir ayuda?", f: "{F1} se pierde en el mercado. ¿A quién pide ayuda?", c: "A una persona que trabaja en un puesto", x: ["A un niño más pequeño que ella", "A quien la invite a irse de allí con él", "A nadie: se marcha sola por la calle"], p: "Busca a un adulto que esté trabajando en ese lugar.", ex: "Quien trabaja en un puesto se queda allí y puede ayudarla a buscar a su familia." },
  { d: 1, e: "{M1} se cae en el patio y le sangra mucho la rodilla. ¿A quién debe avisar?", f: "{M1} se cae en el patio. Le sangra la rodilla. ¿A quién avisa?", c: "A la maestra", x: ["A un compañero de su edad", "A nadie", "A una persona que pasa por la calle"], p: "¿Qué adulto está cerca en la escuela?", ex: "En la escuela, la maestra es el adulto que puede curarle o buscar ayuda." },
  { d: 1, e: "{F1} tiene mucha fiebre en casa. ¿A quién debe decírselo?", f: "{F1} tiene mucha fiebre en casa. ¿A quién se lo dice?", c: "A un adulto de su familia", x: ["A su gato", "A un amigo por la ventana", "A nadie, para no molestar"], p: "¿Quién la cuida en casa?", ex: "Un adulto de la familia puede cuidarla y llevarla al centro de salud." },
  { d: 1, e: "Unos compañeros le quitan la merienda a {M1} todos los días. ¿A quién debería contárselo?", f: "Unos compañeros le quitan la merienda a {M1}. ¿A quién se lo cuenta?", c: "A su maestra o a su familia", x: ["A los compañeros que se la quitan", "A nadie, y aguantarse", "A un desconocido de la calle"], p: "Busca adultos de confianza.", ex: "La maestra y la familia son adultos de confianza que pueden pararlo." },
  { d: 1, e: "Se rompe un vaso en el aula y hay cristales en el suelo. ¿Qué debe hacer {F1}?", f: "Se rompe un vaso en el aula. Hay cristales. ¿Qué hace {F1}?", c: "Avisar a la maestra sin tocar los cristales", x: ["Recoger los cristales con las manos", "Esconderlos debajo de una mesa", "Seguir jugando por encima"], p: "Los cristales cortan. ¿Quién puede recogerlos bien?", ex: "Un adulto puede recogerlos de forma segura. Con las manos se cortaría." },
  { d: 1, e: "{M1} ve que un niño pequeño se ha quedado solo y llora en la parada del autobús. ¿Qué es lo mejor?", f: "Un niño pequeño llora solo en la parada. ¿Qué hace {M1}?", c: "Avisar a un adulto de confianza cercano", x: ["Marcharse sin decir nada", "Reírse de él", "Decirle que se vaya solo a casa"], p: "{M1} también es un niño. ¿Quién puede resolverlo?", ex: "Un adulto de confianza puede cuidar al niño y buscar a su familia." },
  { d: 2, e: "Alguien que {F1} no conoce la sigue al volver de la escuela. ¿Qué es lo mejor que puede hacer?", f: "Un desconocido sigue a {F1} al volver de la escuela. ¿Qué es lo mejor?", c: "Ir a un lugar con gente y pedir ayuda a un adulto", x: ["Meterse por un camino solitario", "Parar y hablar a solas con él", "No contárselo a nadie"], p: "Busca un sitio donde haya gente.", ex: "Con gente alrededor está más segura, y un adulto puede ayudarla." },
  { d: 2, e: "{M1} tiene un dolor de barriga muy fuerte en la escuela. La maestra está en el aula de al lado. ¿Qué debe hacer?", f: "{M1} tiene un dolor muy fuerte en la escuela. La maestra está al lado. ¿Qué debe hacer?", c: "Ir a decírselo a la maestra o pedir a alguien que la llame", x: ["Esperar en silencio a que pase", "Tomarse una pastilla de la mochila de un amigo", "Irse solo a casa sin avisar"], p: "No se toman medicinas por tu cuenta.", ex: "La maestra sabrá qué hacer. Nunca se toman medicinas sin un adulto responsable." },
  { d: 2, e: "{F1} ve que en su calle sale mucho humo de una casa y no hay nadie mirando. ¿Qué es lo mejor?", f: "Sale mucho humo de una casa. {F1} lo ve. ¿Qué es lo mejor?", c: "Alejarse y avisar enseguida a un adulto", x: ["Entrar a ver qué pasa", "Tirarle un vaso de agua desde la puerta", "Seguir su camino sin decir nada"], p: "Primero estar segura. Después avisar.", ex: "Un niño no debe entrar. Un adulto puede pedir ayuda a quien sabe apagar fuegos." },
  { d: 2, e: "{M1} está triste desde hace semanas porque se burlan de él. No sabe a quién contarlo. ¿Quién puede ayudarle mejor?", f: "{M1} está triste. Se burlan de él desde hace semanas. ¿Quién puede ayudarle mejor?", c: "Un adulto en quien confíe", x: ["Quienes se burlan de él", "Nadie: debe aguantar solo", "Una persona que acaba de conocer"], p: "Piensa en alguien que le cuida.", ex: "Un adulto de confianza puede escucharle y ayudar a parar las burlas." },
  { d: 2, e: "En el camino a casa, {F1} ve a una anciana caída que no puede levantarse. ¿Qué es lo mejor?", f: "{F1} ve a una anciana caída. No puede levantarse. ¿Qué es lo mejor?", c: "Buscar a un adulto cercano para que la ayude", x: ["Intentar levantarla sola tirando de ella", "Seguir andando sin decir nada", "Quedarse mirando sin avisar"], p: "{F1} no tiene fuerza para eso. ¿Quién sí?", ex: "Un adulto puede atenderla bien y pedir ayuda médica." },
  { d: 2, e: "A {M1} le ha mordido un perro que no conoce. Le duele poco. ¿Qué debe hacer?", f: "Un perro desconocido muerde a {M1}. Duele poco. ¿Qué debe hacer?", c: "Contárselo a un adulto para que le curen", x: ["Callarse porque duele poco", "Buscar otra vez al perro para jugar", "Taparse la herida y esperar una semana"], p: "Aunque duela poco, una mordedura debe verse.", ex: "Una mordedura puede infectarse. Un adulto le llevará a que se la curen." },
  { d: 3, e: "Un adulto conocido le pide a {F1} que guarde un secreto que la hace sentir mal y le dice que no se lo cuente a nadie. ¿Qué es lo mejor?", f: "Un adulto conocido pide a {F1} guardar un secreto. El secreto la hace sentir mal. ¿Qué es lo mejor?", c: "Contárselo a otro adulto de confianza", x: ["Guardarlo porque se lo ha pedido un adulto", "Tratar de olvidarlo sin decir nada", "Contárselo solo a un niño pequeño"], p: "Un secreto que hace sentir mal no se guarda.", ex: "Los secretos que hacen sentir mal se cuentan. Un adulto de confianza puede ayudarla." },
  { d: 3, e: "{M1} ha roto sin querer el grifo del patio y sale mucha agua. Tiene miedo de que le riñan. ¿Qué es lo mejor?", f: "{M1} rompe sin querer el grifo del patio. Sale mucha agua. Tiene miedo. ¿Qué es lo mejor?", c: "Avisar ya a un adulto de la escuela", x: ["Irse corriendo y no decir nada", "Echarle la culpa a otro niño", "Tapar el grifo con un papel y marcharse"], p: "Cada minuto se pierde más agua.", ex: "Aunque tenga miedo, avisar evita más daño, y un adulto puede cerrar el agua." },
  { d: 3, e: "{F1} ve que un amigo ha bebido de una botella de limpieza por error y se encuentra mal. ¿Qué debe hacer?", f: "Un amigo de {F1} bebe de una botella de limpieza. Se encuentra mal. ¿Qué debe hacer?", c: "Avisar ya a un adulto y enseñarle la botella", x: ["Esperar a ver si se le pasa", "Darle cualquier pastilla", "Esconder la botella para que no se enfaden"], p: "El adulto necesita saber qué ha bebido.", ex: "Es urgente. Un adulto debe saber qué bebió para buscar ayuda médica." },
  { d: 3, e: "A {M1} le falta el dinero que traía para comprar y cree que lo ha perdido en la tienda. Un hombre que no conoce le ofrece dinero si le acompaña a su casa. ¿Qué es lo mejor?", f: "{M1} perdió su dinero en la tienda. Un desconocido le ofrece dinero si va a su casa. ¿Qué es lo mejor?", c: "Decir que no y hablar con la persona que atiende la tienda", x: ["Acompañar al hombre a su casa", "Aceptar el dinero y no contarlo", "Irse con él solo un momento"], p: "Nunca se va con desconocidos, aunque ofrezcan algo.", ex: "No se va con desconocidos. Quien atiende la tienda puede ayudarle a buscar el dinero." },
  { d: 3, e: "{F1} va al centro de salud con su tío y no entiende lo que le dice la enfermera sobre una medicina. ¿Qué es lo mejor?", f: "{F1} está en el centro de salud. No entiende lo que dice la enfermera sobre una medicina. ¿Qué es lo mejor?", c: "Decirle que no lo entiende y pedir que lo repita", x: ["Tomar la medicina como le parezca", "Preguntárselo a un niño de la sala", "Tirar la medicina al salir"], p: "¿Quién sabe más de esa medicina?", ex: "La enfermera puede explicarlo otra vez. Con las medicinas no se adivina." },
  { d: 3, e: "{M1} ve que unos chicos mayores obligan a un niño pequeño a darles sus cosas. Si {M1} se mete solo, también puede salir mal. ¿Qué es lo mejor?", f: "Unos chicos mayores obligan a un niño pequeño a darles sus cosas. {M1} lo ve. ¿Qué es lo mejor?", c: "Ir a buscar a un adulto cuanto antes", x: ["Meterse solo a pelear con ellos", "Unirse a los chicos mayores", "Hacer como que no ha visto nada"], p: "Ayudar no es ponerse en peligro.", ex: "Buscar a un adulto ayuda al niño sin que {M1} corra peligro." },
]);

// ---------- Repartir tareas ----------
const REPARTIR = situaciones("PEN4-T5-a", [
  { d: 1, e: "El grupo debe hacer un mural. {F1} dibuja muy bien y {M1} escribe con letra muy clara. ¿Qué reparto aprovecha mejor lo que sabe cada uno?", f: "El grupo hace un mural. {F1} dibuja muy bien. {M1} escribe muy claro. ¿Qué reparto es mejor?", c: "{F1} dibuja y {M1} escribe los textos", x: ["{F1} escribe y {M1} dibuja", "Los dos miran mientras otro lo hace todo"], p: "Fíjate en qué hace bien cada uno.", ex: "Cada uno hace lo que mejor sabe hacer, y el mural sale mejor." },
  { d: 1, e: "Hay que limpiar el aula entre cuatro. ¿Qué reparto es justo?", f: "Cuatro personas limpian el aula. ¿Qué reparto es justo?", c: "Cada persona limpia una parte parecida", x: ["Una persona lo limpia todo", "Limpian dos y los otros dos descansan", "Se quedan todos mirando"], p: "Justo significa que nadie carga con mucho más.", ex: "Si cada uno hace una parte parecida, el trabajo es igual para todos." },
  { d: 2, e: "{M1} se ha roto un brazo y no puede cargar cubos. El grupo debe regar el huerto. ¿Qué reparto es mejor?", f: "{M1} tiene un brazo roto. El grupo riega el huerto. ¿Qué reparto es mejor?", c: "{M1} apunta qué filas están regadas y los demás cargan", x: ["{M1} carga el cubo más grande", "{M1} se queda fuera y no hace nada del grupo"], p: "Todos pueden aportar algo, cada uno a su manera.", ex: "Apuntar no necesita el brazo, y así {M1} también ayuda." },
  { d: 2, e: "En un grupo de tres hay que leer, resumir y presentar. {F1} ya ha hecho dos trabajos y {M1} ninguno. {F2} ha hecho uno. Queda una tarea más. ¿Quién debería hacerla?", f: "{F1} ha hecho dos trabajos. {F2} ha hecho uno. {M1} no ha hecho ninguno. Queda otro. ¿Quién debe hacerlo?", c: "{M1}", x: ["{F1}", "{F2}"], p: "Cuenta cuánto ha hecho ya cada persona.", ex: "{M1} es quien menos ha hecho, y así el trabajo queda más igualado." },
  { d: 2, e: "En el grupo, {F1} barre siempre y {M1} no barre nunca. A ninguno de los dos le gusta barrer. ¿Qué es lo más justo?", f: "{F1} barre siempre. {M1} no barre nunca. A los dos les disgusta barrer. ¿Qué es lo más justo?", c: "Turnarse cada semana para barrer", x: ["Que {F1} siga barriendo siempre", "Que nadie vuelva a barrer"], p: "Si una tarea no gusta a nadie, ¿cómo se reparte con justicia?", ex: "Al turnarse, los dos hacen la tarea que no les gusta el mismo número de veces." },
  { d: 2, e: "Hay que llevar dos cajas pesadas y cuatro ligeras. {F1} es alta y fuerte. {M1} es más pequeño. Los dos quieren ayudar. ¿Qué reparto es mejor?", f: "Hay dos cajas pesadas y cuatro ligeras. {F1} es fuerte. {M1} es más pequeño. ¿Qué reparto es mejor?", c: "{F1} lleva las pesadas y {M1} las ligeras", x: ["{M1} lleva las pesadas y {F1} las ligeras", "{M1} lo lleva todo y {F1} mira"], p: "Piensa en lo que puede hacer cada uno sin hacerse daño.", ex: "Así los dos ayudan y cada uno carga lo que puede sin hacerse daño." },
  { d: 3, e: "Un compañero del grupo no hace su parte porque no la entiende. Queda poco tiempo. ¿Qué es lo mejor?", f: "Un compañero no hace su parte. No la entiende. Queda poco tiempo. ¿Qué es lo mejor?", c: "Explicársela y ayudarle a terminarla", x: ["Decirle a toda la clase que no sirve", "Quitar su nombre del trabajo sin hablar con él"], p: "¿Cuál es la causa del problema?", ex: "El problema es que no la entiende. Si se la explican, puede hacerla." },
  { d: 3, e: "El grupo debe entregar un cartel mañana y {F1} faltará a clase hoy porque está enferma. Tenía que hacer el título. ¿Qué es lo mejor?", f: "El cartel es para mañana. {F1} está enferma. Tenía que hacer el título. ¿Qué es lo mejor?", c: "Otra persona del grupo hace el título", x: ["Entregar el cartel sin título", "Enfadarse con {F1} por estar enferma"], p: "El trabajo debe terminarse sin culpar a nadie.", ex: "En un equipo se ayudan: otro hace el título y el cartel se entrega completo." },
]);

const COSAS_REPARTO = ["sillas", "libros", "mesas", "cubos", "carteles"] as const;

function partesIguales(rng: Rng): Contenido {
  const k = entero(rng, 2, 6);
  const cada = entero(rng, 3, 9);
  const cosa = elegir(rng, COSAS_REPARTO);
  const total = k * cada;
  const femenino = cosa === "sillas" || cosa === "mesas";
  return {
    enunciado: `El grupo tiene ${k} personas y debe colocar ${total} ${cosa}. Para que el reparto sea justo, todas colocan lo mismo. ¿${femenino ? "Cuántas" : "Cuántos"} ${cosa} coloca cada persona?`,
    enunciadoFacil: `Son ${k} personas. Hay ${total} ${cosa}. Todas colocan lo mismo. ¿${femenino ? "Cuántas" : "Cuántos"} coloca cada persona?`,
    respuesta: { tipo: "numero", valor: cada },
    pista: "Reparte el total a partes iguales.",
    explicacion: `${total} entre ${k} son ${cada}.`,
  };
}

const TAREAS = ["barrer", "regar", "ordenar", "pintar", "limpiar la pizarra"] as const;

// Dos personas, tareas con minutos: se enumeran todos los repartos y solo uno iguala el tiempo.
function repartoTiempo(rng: Rng, n: number): Contenido {
  const [x, y] = nombres(rng, 2) as [string, string];
  return buscar(() => {
    const tareas = muestra(rng, TAREAS, n);
    const tiempos = tareas.map(() => entero(rng, 2, 9) * 5);
    const total = tiempos.reduce((a, b) => a + b, 0);
    if (total % 2 !== 0 || new Set(tiempos).size !== n) return null;
    const mascaras = Array.from({ length: 2 ** (n - 1) }, (_, m) => m); // la última tarea siempre es de y
    const suma = (m: number): number => tiempos.reduce((t, v, i) => t + ((m >> i) & 1 ? v : 0), 0);
    const iguales = mascaras.filter((m) => m !== 0 && suma(m) === total / 2);
    if (iguales.length !== 1) return null;
    const buena = en(iguales, 0);
    const texto = (m: number): string => {
      const de = (b: boolean): string => enumerar(tareas.filter((_, i) => (((m >> i) & 1) === 1) === b));
      return `${x}: ${de(true)}. ${y}: ${de(false)}.`;
    };
    const malas = barajar(rng, mascaras.filter((m) => m !== 0 && m !== buena)).slice(0, 3);
    if (malas.length < 2) return null;
    const lista = tareas.map((t, i) => `${t} (${minutos(en(tiempos, i))})`).join(", ");
    return {
      enunciado: `${x} y ${y} se reparten estas tareas: ${lista}. Quieren trabajar el mismo tiempo. ¿Qué reparto lo consigue?`,
      enunciadoFacil: `Tareas: ${lista}. ${x} y ${y} quieren trabajar el mismo tiempo. ¿Qué reparto lo consigue?`,
      respuesta: { tipo: "opcion", correcta: texto(buena), distractores: malas.map(texto) },
      pista: `Suma todos los minutos. Cada persona debe hacer la mitad.`,
      explicacion: `En total son ${minutos(total)}. Con ese reparto, cada persona trabaja ${minutos(total / 2)}.`,
    };
  });
}

function costeGrupo(rng: Rng): Contenido {
  const k = entero(rng, 3, 6);
  const cada = entero(rng, 2, 8);
  const total = k * cada;
  return {
    enunciado: `El grupo de ${k} personas compra material por ${monedas(total)}. Pagan todas lo mismo. ¿Cuántas monedas paga cada persona?`,
    enunciadoFacil: `Son ${k} personas. El material cuesta ${monedas(total)}. Pagan igual. ¿Cuántas monedas paga cada una?`,
    respuesta: { tipo: "numero", valor: cada },
    pista: "Divide el precio entre las personas.",
    explicacion: `${total} entre ${k} son ${cada}.`,
  };
}

const PLANTILLAS_REPARTO: readonly Plantilla[] = [
  { clave: "partes-iguales", dificultades: [1], crear: partesIguales },
  { clave: "coste", dificultades: [1], crear: costeGrupo },
  { clave: "tiempo-3", dificultades: [2], crear: (rng) => repartoTiempo(rng, 3) },
  { clave: "tiempo-4", dificultades: [3], crear: (rng) => repartoTiempo(rng, 4) },
  { clave: "tiempo-5", dificultades: [3], crear: (rng) => repartoTiempo(rng, 5) },
];

// ---------- Decisión del grupo ----------
const DECIDIR = situaciones("PEN4-T5-b", [
  { d: 1, e: "Un grupo no se pone de acuerdo sobre qué juego elegir. ¿Cuál es una forma justa de decidir?", f: "El grupo no se pone de acuerdo sobre el juego. ¿Qué forma es justa?", c: "Votar y aceptar lo que elija la mayoría", x: ["Que decida siempre quien grita más fuerte de todos", "Que decida el que tiene la pelota", "Que cada uno se vaya sin jugar"], p: "Justo es que todos cuenten igual.", ex: "Al votar, cada persona cuenta lo mismo." },
  { d: 1, e: "En la votación del grupo ha ganado la idea de {F1} y no la de {M1}. ¿Qué debe hacer {M1}?", f: "Ganó la idea de {F1}. No ganó la de {M1}. ¿Qué debe hacer {M1}?", c: "Aceptar el resultado y ayudar al grupo", x: ["Enfadarse y dejar el grupo", "Decir que la votación no vale porque no ganó su idea", "Hacer su idea a escondidas"], p: "Votar significa aceptar lo que salga.", ex: "El grupo ya decidió. Aceptar y ayudar es parte de trabajar en equipo." },
  { d: 1, e: "Antes de decidir en grupo, ¿qué es lo mejor?", f: "El grupo va a decidir. ¿Qué es lo mejor antes?", c: "Escuchar la idea de cada persona", x: ["Escuchar solo a los amigos", "Decidir sin preguntar a nadie para terminar antes", "Hablar todos a la vez"], p: "Una buena decisión tiene en cuenta a todos.", ex: "Si todos dan su idea, el grupo tiene más opciones para elegir." },
  { d: 2, e: "En un grupo de seis, la votación queda empatada: 3 a 3. ¿Qué es lo mejor?", f: "Son seis. La votación empata: 3 a 3. ¿Qué es lo mejor?", c: "Hablar de las dos ideas y volver a votar", x: ["Dejar que gane la idea de quien se enfade más que nadie", "Elegir la idea del más alto", "Abandonar el trabajo"], p: "Un empate no se resuelve con enfados.", ex: "Si hablan de las ideas, alguien puede cambiar de opinión y deshacer el empate." },
  { d: 2, e: "El grupo debe elegir entre dos paseos. {F1} no puede caminar mucho porque se ha hecho daño en un pie. ¿Qué debe tener en cuenta el grupo?", f: "El grupo elige un paseo. {F1} no puede caminar mucho. ¿Qué debe tener en cuenta?", c: "Elegir un paseo al que pueda ir {F1}", x: ["Elegir el paseo más largo", "Ir sin avisar a {F1}", "Decirle a {F1} que se aguante y camine como los demás"], p: "En un equipo se piensa en todos.", ex: "Una buena decisión de grupo no deja a nadie fuera." },
  { d: 3, e: "Un grupo vota y gana la idea de ir al río, pero después alguien avisa de que el río baja muy crecido. ¿Qué es lo mejor?", f: "El grupo votó ir al río. Ahora el río baja muy crecido. ¿Qué es lo mejor?", c: "Cambiar el plan porque hay peligro", x: ["Ir igual porque ya se votó", "Ir solo los que sepan nadar y no decir nada a los demás"], p: "Una votación no hace seguro lo que es peligroso.", ex: "Si aparece un peligro, hay que volver a decidir. La seguridad va primero." },
  { d: 3, e: "En un grupo, tres personas quieren decidir ya y {M1} dice que le falta un dato importante para el trabajo. ¿Qué es lo mejor?", f: "Tres personas quieren decidir ya. {M1} dice que falta un dato importante. ¿Qué es lo mejor?", c: "Escuchar qué dato falta antes de decidir", x: ["Hacerle callar porque son más", "Decidir sin oírle y terminar antes para poder irse a jugar"], p: "Ser menos no significa no tener razón.", ex: "Ese dato puede cambiar la decisión, así que conviene oírlo antes." },
]);

const OPCIONES_VOTO = [
  { titulo: "Votos para elegir el juego", cosas: ["Cuerda", "Pelota", "Escondite", "Carreras"] },
  { titulo: "Votos para el color del mural", cosas: ["Azul", "Verde", "Rojo", "Amarillo"] },
  { titulo: "Votos para la excursión", cosas: ["Río", "Bosque", "Mercado", "Biblioteca"] },
  { titulo: "Votos para plantar en el patio", cosas: ["Flores", "Árboles", "Hierbas", "Arbustos"] },
] as const;

function votosMayoria(rng: Rng): Contenido {
  const o = elegir(rng, OPCIONES_VOTO);
  const cosas = muestra(rng, o.cosas, 3);
  const valores = muestra(rng, [2, 3, 4, 5, 6, 7, 8, 9], 3);
  const maximo = Math.max(...valores);
  const correcta = en(cosas, valores.indexOf(maximo));
  return {
    enunciado: "Mira el gráfico. Gana la opción con más votos. ¿Qué ha elegido el grupo?",
    enunciadoFacil: "Mira el gráfico. Gana la que tiene más votos. ¿Cuál gana?",
    imagen: { tipo: "barras", titulo: o.titulo, etiquetas: cosas, valores },
    respuesta: { tipo: "opcion", correcta, distractores: cosas.filter((c) => c !== correcta) },
    pista: "Busca la barra más alta.",
    explicacion: `${correcta} tiene ${maximo} votos, más que las otras opciones.`,
  };
}

function votosMitad(rng: Rng): Contenido {
  const o = elegir(rng, OPCIONES_VOTO);
  const cosas = muestra(rng, o.cosas, 3);
  return buscar(() => {
    const valores = [entero(rng, 2, 12), entero(rng, 2, 12), entero(rng, 2, 12)];
    const total = valores.reduce((a, b) => a + b, 0);
    const maximo = Math.max(...valores);
    if (valores.filter((v) => v === maximo).length !== 1 || maximo * 2 === total) return null;
    const gana = maximo * 2 > total;
    const nadie = "Ninguna";
    const lider = en(cosas, valores.indexOf(maximo));
    const correcta = gana ? lider : nadie;
    return {
      enunciado: `Mira el gráfico. Votan ${total} personas. Una opción solo gana si tiene más de la mitad de los votos. ¿Qué opción gana?`,
      enunciadoFacil: `Mira el gráfico. Votan ${total} personas. Para ganar hace falta más de la mitad. ¿Qué opción gana?`,
      imagen: { tipo: "barras", titulo: o.titulo, etiquetas: cosas, valores },
      respuesta: { tipo: "opcion", correcta, distractores: [...cosas, nadie].filter((c) => c !== correcta) },
      pista: `Calcula la mitad de ${total} y mira si la barra más alta la supera.`,
      explicacion: `La opción con más votos es ${lider}, con ${maximo}. La mitad de ${total} es ${total % 2 === 0 ? total / 2 : `${(total - 1) / 2} y media`}, así que ${gana ? "la supera y gana" : "no la supera y nadie gana"}.`,
    };
  });
}

function votosCuantos(rng: Rng): Contenido {
  const o = elegir(rng, OPCIONES_VOTO);
  const cosas = muestra(rng, o.cosas, 3);
  const valores = muestra(rng, [2, 3, 4, 5, 6, 7, 8, 9], 3);
  const maximo = Math.max(...valores);
  const segundo = [...valores].sort((a, b) => b - a)[1] ?? 0;
  return {
    enunciado: "Mira el gráfico. ¿Cuántos votos más que la segunda opción tiene la opción ganadora?",
    enunciadoFacil: "Mira el gráfico. La ganadora tiene más votos que la segunda. ¿Cuántos más?",
    imagen: { tipo: "barras", titulo: o.titulo, etiquetas: cosas, valores },
    respuesta: { tipo: "numero", valor: maximo - segundo },
    pista: "Busca las dos barras más altas y resta.",
    explicacion: `La ganadora tiene ${maximo} votos y la segunda ${segundo}. La diferencia es ${maximo - segundo}.`,
  };
}

function segundaVuelta(rng: Rng): Contenido {
  const o = elegir(rng, OPCIONES_VOTO);
  const cosas = muestra(rng, o.cosas, 3);
  return buscar(() => {
    const valores = muestra(rng, [2, 3, 4, 5, 6, 7, 8, 9], 3);
    const orden = [0, 1, 2].sort((a, b) => en(valores, b) - en(valores, a));
    const [a, b, c] = orden as [number, number, number];
    // Los votos de la última opción pasan a la segunda.
    const finalB = en(valores, b) + en(valores, c);
    if (finalB === en(valores, a)) return null;
    const correcta = finalB > en(valores, a) ? en(cosas, b) : en(cosas, a);
    return {
      enunciado: `Mira el gráfico. Se elimina la opción con menos votos, ${en(cosas, c)}, y quienes la votaron votan ahora por ${en(cosas, b)}. ¿Qué opción gana?`,
      enunciadoFacil: `Mira el gráfico. Se quita ${en(cosas, c)}. Sus votos pasan a ${en(cosas, b)}. ¿Qué opción gana?`,
      imagen: { tipo: "barras", titulo: o.titulo, etiquetas: cosas, valores },
      respuesta: { tipo: "opcion", correcta, distractores: cosas.filter((x) => x !== correcta) },
      pista: "Suma esos votos a la opción que los recibe y compara.",
      explicacion: `${en(cosas, b)} se queda con ${en(valores, b)} más ${en(valores, c)}, que son ${finalB}. ${en(cosas, a)} sigue con ${en(valores, a)}.`,
    };
  });
}

const PLANTILLAS_DECIDIR: readonly Plantilla[] = [
  { clave: "mayoria", dificultades: [1], crear: votosMayoria },
  { clave: "cuantos", dificultades: [2], crear: votosCuantos },
  { clave: "mitad", dificultades: [2, 3], crear: votosMitad },
  { clave: "segunda-vuelta", dificultades: [3], crear: segundaVuelta },
];

export const GENERADORES_EQUIPO4: Readonly<Record<string, readonly Generador[]>> = {
  "PEN4-T4-a": [generadorDeSituaciones("PEN4-T4-a", RIESGO)],
  "PEN4-T4-b": [generadorDeSituaciones("PEN4-T4-b", AYUDA)],
  "PEN4-T5-a": [generadorDeSituaciones("PEN4-T5-a", REPARTIR), generadorDePlantillas("PEN4-T5-a", PLANTILLAS_REPARTO)],
  "PEN4-T5-b": [generadorDeSituaciones("PEN4-T5-b", DECIDIR), generadorDePlantillas("PEN4-T5-b", PLANTILLAS_DECIDIR)],
};
