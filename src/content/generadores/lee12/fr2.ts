// LEE de Ciclo II en francés. No es una traducción: el vocabulario se ha creado de nuevo
// y los textos, carteles y etiquetas son originales, con la misma dificultad que en español.
import type { Rng } from "../../../core/rng.ts";
import { elegir, entero, muestra, nombres, pregunta } from "../../ayuda.ts";
import { generadorDeSituaciones, generadorDeTextos, type Situacion, type TextoEscrito } from "../../plantillas.ts";
import type { Dificultad, Generador, Imagen, MapaGeneradores, ObjetoId, Pregunta } from "../../tipos.ts";
import { mayuscula, porDificultad } from "./base.ts";
import { q } from "./textos1.ts";

type Par = readonly [string, string, readonly [string, string]];
type EnFrase = readonly [string, string, string, readonly [string, string]];

// ---------- LEE2-T1-a : mots proches ----------
const SINONIMO = "LEE2-T1-a";

const SINONIMOS: Readonly<Record<1 | 2, readonly Par[]>> = {
  1: [
    ["content", "joyeux", ["haut", "froid"]], ["beau", "joli", ["mouillé", "lent"]], ["commencer", "débuter", ["dormir", "chanter"]],
    ["facile", "simple", ["bleu", "bruyant"]], ["revenir", "retourner", ["manger", "peindre"]], ["vélo", "bicyclette", ["table", "soupe"]], ["voiture", "auto", ["pomme", "lune"]],
  ],
  2: [
    ["finir", "terminer", ["commencer", "tirer"]], ["visage", "figure", ["visite", "pied"]], ["regarder", "observer", ["écouter", "garder"]], ["fâché", "en colère", ["calme", "fâcheux"]],
    ["sauter", "bondir", ["s'asseoir", "saluer"]], ["enfant", "gamin", ["adulte", "enfin"]], ["maison", "logis", ["rue", "raison"]], ["élève", "écolier", ["maître", "élevage"]],
  ],
};

const SINONIMOS_FRASE: readonly EnFrase[] = [
  ["{F1} est très fatiguée après la course.", "fatiguée", "épuisée", ["reposée", "propre"]],
  ["Nous marchons sur un sentier dans la forêt.", "sentier", "chemin", ["fleuve", "arbre"]],
  ["Les nuages cachent le soleil.", "cachent", "couvrent", ["regardent", "ouvrent"]],
  ["Ce conte est très amusant.", "amusant", "drôle", ["ennuyeux", "triste"]],
  ["La maîtresse nous a donné un cadeau.", "cadeau", "présent", ["devoir", "message"]],
  ["Le bébé dort dans son petit lit.", "dort", "sommeille", ["pleure", "mange"]],
];

const SITUACIONES_SINONIMOS: readonly Situacion[] = [
  ...([1, 2] as const).flatMap((d) =>
    SINONIMOS[d].map(([palabra, correcta, distractores]): Situacion => ({
      id: `${SINONIMO}/${palabra}`, sub: SINONIMO, dificultad: d,
      enunciado: `Quel mot veut dire presque la même chose que « ${palabra} » ?`,
      enunciadoFacil: `Lis : ${palabra}. Quel mot dit presque la même chose ?`,
      correcta, distractores,
      pista: d === 1 ? "Pense à une phrase avec ce mot. Essaie de le remplacer par chaque choix." : "Attention aux mots qui disent le contraire ou qui s'écrivent seulement de la même façon.",
      explicacion: `« ${mayuscula(correcta)} » veut dire presque la même chose que « ${palabra} ».`,
    })),
  ),
  ...SINONIMOS_FRASE.map(([frase, palabra, correcta, distractores]): Situacion => ({
    id: `${SINONIMO}/frase/${palabra}`, sub: SINONIMO, dificultad: 3,
    enunciado: `Lis la phrase : « ${frase} » Quel mot peut remplacer « ${palabra} » sans changer le sens ?`,
    enunciadoFacil: `Lis : ${frase} Change le mot « ${palabra} ». La phrase doit dire la même chose. Quel mot prends-tu ?`,
    correcta, distractores,
    pista: "Lis la phrase avec chaque choix. Cherche celle qui dit la même chose.",
    explicacion: `« ${mayuscula(correcta)} » veut dire presque la même chose que « ${palabra} ». La phrase garde son sens.`,
  })),
];

// ---------- LEE2-T1-b : contraires ----------
const CONTRARIO = "LEE2-T1-b";

const CONTRARIOS: Readonly<Record<1 | 2, readonly Par[]>> = {
  1: [
    ["grand", "petit", ["vert", "doux"]], ["haut", "bas", ["rouge", "propre"]], ["chaud", "froid", ["long", "neuf"]], ["jour", "nuit", ["table", "pluie"]],
    ["ouvrir", "fermer", ["manger", "sauter"]], ["monter", "descendre", ["lire", "peindre"]], ["propre", "sale", ["rond", "haut"]], ["rapide", "lent", ["bleu", "mouillé"]],
  ],
  2: [
    ["plein", "vide", ["rempli", "petit"]], ["triste", "joyeux", ["malheureux", "fatigué"]], ["neuf", "vieux", ["récent", "propre"]], ["près", "loin", ["à côté", "dessous"]],
    ["fort", "faible", ["costaud", "grand"]], ["sombre", "clair", ["noir", "froid"]], ["mouillé", "sec", ["humide", "sale"]], ["entrer", "sortir", ["passer", "venir"]],
  ],
};

// Le mot est dans une phrase : le contraire doit s'accorder avec elle.
const CONTRARIOS_FRASE: readonly EnFrase[] = [
  ["La soupe est chaude.", "chaude", "froide", ["froid", "tiède"]],
  ["La porte est ouverte.", "ouverte", "fermée", ["fermé", "cassée"]],
  ["Les caisses sont lourdes.", "lourdes", "légères", ["grandes", "légère"]],
  ["{F1} a allumé la lumière.", "allumé", "éteint", ["regardé", "réparé"]],
  ["Ma grand-mère a acheté une poule.", "acheté", "vendu", ["payé", "apporté"]],
  ["{M1} a gagné la course.", "gagné", "perdu", ["couru", "terminé"]],
  ["Le chemin est long.", "long", "court", ["courte", "large"]],
];

const SITUACIONES_CONTRARIOS: readonly Situacion[] = [
  ...([1, 2] as const).flatMap((d) =>
    CONTRARIOS[d].map(([palabra, correcta, distractores]): Situacion => ({
      id: `${CONTRARIO}/${palabra}`, sub: CONTRARIO, dificultad: d,
      enunciado: `Quel est le contraire de « ${palabra} » ?`,
      enunciadoFacil: `Lis : ${palabra}. Quel mot dit le contraire ?`,
      correcta, distractores,
      pista: d === 1 ? "Le contraire dit juste l'opposé." : "Attention : un choix veut dire presque la même chose, pas le contraire.",
      explicacion: `Le contraire de « ${palabra} » est « ${correcta} ».`,
    })),
  ),
  ...CONTRARIOS_FRASE.map(([frase, palabra, correcta, distractores]): Situacion => ({
    id: `${CONTRARIO}/frase/${palabra}`, sub: CONTRARIO, dificultad: 3,
    enunciado: `Lis la phrase : « ${frase} » Quel mot dit le contraire de « ${palabra} » et va bien dans la phrase ?`,
    enunciadoFacil: `Lis : ${frase} Cherche le contraire de « ${palabra} ». Il doit aller dans la phrase.`,
    correcta, distractores,
    pista: "Lis la phrase avec chaque choix. Elle doit bien sonner et dire l'opposé.",
    explicacion: `Ici, le contraire de « ${palabra} » est « ${correcta} », et il va bien dans la phrase.`,
  })),
];

// ---------- LEE2-T1-c : catégories ----------
const CATEGORIA = "LEE2-T1-c";

// Sans mots à deux sens qui passent d'un groupe à l'autre (orange est un fruit et une couleur).
const CATEGORIAS: readonly { readonly id: string; readonly uno: string; readonly son: string; readonly grupo: string; readonly cerca: readonly [string, string]; readonly palabras: readonly string[] }[] = [
  { id: "animaux", uno: "un animal", son: "des animaux", grupo: "animaux", cerca: ["plantes", "personnes"], palabras: ["chien", "vache", "canard", "grenouille", "ours", "poule"] },
  { id: "fruits", uno: "un fruit", son: "des fruits", grupo: "fruits", cerca: ["légumes", "boissons"], palabras: ["pomme", "poire", "raisin", "mangue", "banane", "citron"] },
  { id: "vetements", uno: "un vêtement", son: "des vêtements", grupo: "vêtements", cerca: ["jouets", "meubles"], palabras: ["chemise", "pantalon", "bonnet", "jupe", "manteau"] },
  { id: "meubles", uno: "un meuble", son: "des meubles", grupo: "meubles", cerca: ["vêtements", "outils"], palabras: ["table", "chaise", "lit", "armoire"] },
  { id: "corps", uno: "une partie du corps", son: "des parties du corps", grupo: "parties du corps", cerca: ["vêtements", "animaux"], palabras: ["main", "pied", "genou", "oreille", "nez"] },
  { id: "transport", uno: "un moyen de transport", son: "des moyens de transport", grupo: "moyens de transport", cerca: ["meubles", "jouets"], palabras: ["train", "bateau", "avion", "bus", "vélo"] },
  { id: "couleurs", uno: "une couleur", son: "des couleurs", grupo: "couleurs", cerca: ["nombres", "formes"], palabras: ["rouge", "bleu", "vert", "jaune", "violet"] },
  { id: "jours", uno: "un jour de la semaine", son: "des jours de la semaine", grupo: "jours de la semaine", cerca: ["mois de l'année", "heures du jour"], palabras: ["lundi", "mardi", "jeudi", "vendredi", "dimanche"] },
];

type Categoria = (typeof CATEGORIAS)[number];

function otrasCategorias(c: Categoria): readonly Categoria[] {
  return CATEGORIAS.filter((x) => x.id !== c.id);
}

const categoriaFacil: Generador = (rng, d) => {
  const c = elegir(rng, CATEGORIAS);
  const correcta = elegir(rng, c.palabras);
  const distractores = muestra(rng, otrasCategorias(c), 2).map((x) => elegir(rng, x.palabras));
  return pregunta(rng, {
    subhabilidad: CATEGORIA, dificultad: d,
    enunciado: `Quel mot nomme ${c.uno} ?`,
    enunciadoFacil: `Cherche ${c.uno}. Quel mot est-ce ?`,
    respuesta: { tipo: "opcion", correcta, distractores },
    pista: "Lis les trois mots. Pense à ce qu'est chaque chose.",
    explicacion: `« ${mayuscula(correcta)} », c'est ${c.uno}. Les autres mots, non.`,
    plantilla: `${CATEGORIA}/uno/${correcta}`,
  });
};

const categoriaMedia: Generador = (rng, d) => {
  const c = elegir(rng, CATEGORIAS);
  const trio = muestra(rng, c.palabras, 3);
  const correcta = elegir(rng, elegir(rng, otrasCategorias(c)).palabras);
  return pregunta(rng, {
    subhabilidad: CATEGORIA, dificultad: d,
    enunciado: "Trois mots sont du même groupe. Quel mot ne va pas avec les autres ?",
    enunciadoFacil: "Trois mots vont ensemble. Un mot, non. Lequel ne va pas ?",
    respuesta: { tipo: "opcion", correcta, distractores: trio },
    pista: "Cherche d'abord ce que trois des mots ont en commun.",
    explicacion: `« ${mayuscula(trio[0] ?? "")} », « ${trio[1] ?? ""} » et « ${trio[2] ?? ""} », ce sont ${c.son}. « ${mayuscula(correcta)} », non.`,
    plantilla: `${CATEGORIA}/intruso/${c.id}/${correcta}`,
  });
};

const categoriaDificil: Generador = (rng, d) => {
  const c = elegir(rng, CATEGORIAS);
  const trio = muestra(rng, c.palabras, 3);
  const lista = `${trio[0] ?? ""}, ${trio[1] ?? ""}, ${trio[2] ?? ""}`;
  return pregunta(rng, {
    subhabilidad: CATEGORIA, dificultad: d,
    enunciado: `Regarde ces mots : ${lista}. Comment s'appelle leur groupe ?`,
    enunciadoFacil: `Lis : ${lista}. Quel est le nom de leur groupe ?`,
    respuesta: { tipo: "opcion", correcta: mayuscula(c.grupo), distractores: c.cerca.map(mayuscula) },
    pista: "Pense à ce que sont les trois choses. Cherche un mot qui les nomme toutes.",
    explicacion: `${mayuscula(lista)} : les trois mots nomment ${c.son}.`,
    plantilla: `${CATEGORIA}/grupo/${c.id}/${[...trio].sort().join("-")}`,
  });
};

// ---------- LEE2-T2-a : compléter la phrase ----------
const COMPLETAR = "LEE2-T2-a";

type Hueco = readonly [string, string, string, readonly [string, string], string];

const HUECOS: Readonly<Record<Dificultad, readonly Hueco[]>> = {
  1: [
    ["lune", "La nuit, dans le ciel, on voit la ___.", "lune", ["chaise", "balle"], "La nuit, dans le ciel, on voit la lune. Une chaise ou une balle ne sont pas dans le ciel."],
    ["savon", "Je me lave les mains avec de l'eau et du ___.", "savon", ["pain", "crayon"], "On se lave les mains avec de l'eau et du savon."],
    ["crayon", "J'écris dans mon cahier avec un ___.", "crayon", ["verre", "bonnet"], "Pour écrire, on utilise un crayon."],
    ["poisson", "Le poisson vit dans l'___.", "eau", ["air", "herbe"], "Les poissons vivent dans l'eau."],
    ["parapluie", "Il pleut beaucoup. J'ouvre mon ___.", "parapluie", ["cahier", "soulier"], "Le parapluie nous protège de la pluie."],
    ["soif", "J'ai soif. Je bois de l'___.", "eau", ["herbe", "encre"], "Quand on a soif, on boit de l'eau."],
  ],
  2: [
    ["jouent", "Les filles ___ dans la cour.", "jouent", ["joue", "jouer"], "« Les filles », elles sont plusieurs : on dit « jouent »."],
    ["vont", "{M1} et {F1} ___ au marché.", "vont", ["va", "vais"], "Ce sont deux personnes : on dit « vont »."],
    ["alu", "Hier, {N1} ___ une histoire.", "a lu", ["lit", "lira"], "Le mot « hier » parle du passé : on dit « a lu »."],
    ["ira", "Demain, {N1} ___ à la rivière.", "ira", ["allait", "était"], "Le mot « demain » parle du futur : on dit « ira »."],
    ["jolie", "La maison de {N1} est très ___.", "jolie", ["joli", "jolis"], "« Maison » est féminin et singulier : on dit « jolie »."],
    ["fatigues", "Les chiens sont ___.", "fatigués", ["fatigué", "fatiguée"], "« Les chiens », ils sont plusieurs : on dit « fatigués »."],
    ["cahiers", "J'ai deux ___ neufs.", "cahiers", ["cahier", "trousses"], "« Deux » demande le pluriel et « neufs » est masculin : on dit « cahiers »."],
  ],
  3: [
    ["froid", "{M1} a mis son manteau parce qu'il avait ___.", "froid", ["chaud", "soif"], "On met un manteau quand on a froid."],
    ["seche", "Nous arrosons les plantes parce que la terre est ___.", "sèche", ["mouillée", "propre"], "On arrose quand la terre n'a pas d'eau, quand elle est sèche."],
    ["nuages", "J'ai pris mon parapluie parce que le ciel avait beaucoup de ___.", "nuages", ["étoiles", "fleurs"], "Les nuages apportent la pluie : on prend son parapluie."],
    ["lumiere", "{F1} n'a pas pu lire parce qu'il n'y avait pas de ___.", "lumière", ["bruit", "soif"], "Sans lumière, on ne peut pas voir les lettres."],
    ["lit", "{M1} a très sommeil, alors ___.", "il va au lit", ["il court dans la cour", "il se lève du lit"], "Quand on a sommeil, on va dormir."],
    ["sale", "L'eau est sale, alors ___.", "nous ne la buvons pas", ["nous la buvons", "nous la gardons pour boire"], "L'eau sale n'est pas sûre. Il ne faut pas la boire."],
    ["dormir", "Le soir, nous éteignons la lumière pour ___.", "dormir", ["lire", "dessiner"], "Pour lire ou dessiner, il faut de la lumière. Pour dormir, non."],
  ],
};

const SITUACIONES_COMPLETAR: readonly Situacion[] = ([1, 2, 3] as const).flatMap((d) =>
  HUECOS[d].map(([id, frase, correcta, distractores, explicacion]): Situacion => ({
    id: `${COMPLETAR}/${id}`, sub: COMPLETAR, dificultad: d,
    enunciado: `Lis la phrase : « ${frase} » Qu'est-ce qui va dans le trou ?`,
    enunciadoFacil: `Lis : ${frase} Qu'est-ce qui manque ?`,
    correcta, distractores,
    pista: d === 2 ? "Lis la phrase avec chaque choix. Regarde avec quel mot il faut accorder." : "Lis la phrase avec chaque choix. Cherche celui qui a du sens.",
    explicacion,
  })),
);

// ---------- LEE2-T2-b : choisir la phrase de l'image ----------
const FRASE_IMAGEN = "LEE2-T2-b";

interface Nombre {
  readonly id: ObjetoId;
  readonly sg: string;
  readonly pl: string;
  readonly f: boolean;
}

const n = (id: ObjetoId, sg: string, pl: string, f = false): Nombre => ({ id, sg, pl, f });

const SERES: readonly Nombre[] = [
  n("manzana", "pomme", "pommes", true), n("pera", "poire", "poires", true), n("naranja", "orange", "oranges", true), n("lapiz", "crayon", "crayons"), n("libro", "livre", "livres"),
  n("pelota", "ballon", "ballons"), n("flor", "fleur", "fleurs", true), n("estrella", "étoile", "étoiles", true), n("pez", "poisson", "poissons"), n("pajaro", "oiseau", "oiseaux"),
  n("mariposa", "papillon", "papillons"), n("vaso", "verre", "verres"), n("botella", "bouteille", "bouteilles", true), n("huevo", "œuf", "œufs"),
  n("gato", "chat", "chats"), n("perro", "chien", "chiens"), n("pato", "canard", "canards"), n("rana", "grenouille", "grenouilles", true), n("vaca", "vache", "vaches", true),
];

const CIFRAS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"] as const;
const vocal = (t: string): boolean => /^[aeiouéœ]/i.test(t);
const grupo = (k: number, c: Nombre): string => (k === 1 ? `${c.f ? "une" : "un"} ${c.sg}` : `${CIFRAS[k] ?? String(k)} ${c.pl}`);
const le = (c: Nombre): string => (vocal(c.sg) ? `l'${c.sg}` : `${c.f ? "la" : "le"} ${c.sg}`);
const dePl = (c: Nombre): string => (vocal(c.pl) ? `d'${c.pl}` : `de ${c.pl}`);
const objetos = (...lista: readonly (readonly [Nombre, number])[]): Imagen => ({ tipo: "objetos", grupos: lista.map(([c, cantidad]) => ({ objeto: c.id, cantidad })) });

function fraseDe(rng: Rng, d: Dificultad, imagen: Imagen, correcta: string, distractores: readonly string[], explicacion: string, plantilla: string, pista: string): Pregunta {
  return pregunta(rng, {
    subhabilidad: FRASE_IMAGEN, dificultad: d,
    enunciado: "Regarde le dessin. Quelle phrase dit ce que tu vois ?",
    enunciadoFacil: "Regarde le dessin. Quelle phrase est la bonne ?",
    imagen,
    respuesta: { tipo: "opcion", correcta, distractores },
    pista,
    explicacion,
    plantilla: `${FRASE_IMAGEN}/${plantilla}`,
  });
}

const imagenFacil: Generador = (rng, d) => {
  const [c, otra] = muestra(rng, SERES, 2) as [Nombre, Nombre];
  const k = entero(rng, 2, 8);
  return fraseDe(rng, d, objetos([c, k]), `Il y a ${grupo(k, c)}.`, [`Il y a ${grupo(k + 1, c)}.`, `Il y a ${grupo(k - 1, c)}.`, `Il y a ${grupo(k, otra)}.`], `Sur le dessin, il y a ${grupo(k, c)}.`, `${c.id}/${k}`, "Compte ce que tu vois et regarde de quoi il s'agit.");
};

const imagenMedia: Generador = (rng, d) => {
  const [a, b] = muestra(rng, SERES, 2) as [Nombre, Nombre];
  const k = entero(rng, 2, 5);
  const m = entero(rng, 1, k - 1);
  const dice = (x: number, y: number) => `Il y a ${grupo(x, a)} et ${grupo(y, b)}.`;
  return fraseDe(rng, d, objetos([a, k], [b, m]), dice(k, m), [dice(m, k), dice(k, k), dice(k + 1, m)], `Sur le dessin, il y a ${grupo(k, a)} et ${grupo(m, b)}.`, `${a.id}/${b.id}/${k}/${m}`, "Compte chaque groupe séparément.");
};

const PESADOS: readonly Nombre[] = SERES.filter((c) => ["manzana", "pera", "naranja", "libro", "pelota", "botella"].includes(c.id));

const imagenDificil: Generador = (rng, d) => {
  const tipo = elegir(rng, [0, 1, 2]);
  if (tipo === 0) {
    const [a, b] = muestra(rng, PESADOS, 2) as [Nombre, Nombre];
    const baja = elegir(rng, ["izquierda", "derecha", "ninguna"] as const);
    const masA = `${mayuscula(le(a))} pèse plus que ${le(b)}.`;
    const masB = `${mayuscula(le(b))} pèse plus que ${le(a)}.`;
    const igual = `${mayuscula(le(a))} et ${le(b)} pèsent la même chose.`;
    const [correcta, distractores] = baja === "izquierda" ? [masA, [masB, igual]] : baja === "derecha" ? [masB, [masA, igual]] : [igual, [masA, masB]];
    const explicacion = baja === "ninguna" ? "Les deux plateaux de la balance sont à la même hauteur : ils pèsent la même chose." : `Le plateau qui descend est le plus lourd. C'est celui avec ${le(baja === "izquierda" ? a : b)}.`;
    return fraseDe(rng, d, { tipo: "balanza", izquierda: a.id, derecha: b.id, baja }, correcta, distractores, explicacion, `balanza/${a.id}/${b.id}/${baja}`, "Sur une balance, le plateau le plus lourd descend.");
  }
  if (tipo === 1) {
    const [n1, n2] = nombres(rng, 2) as [string, string];
    const largo1 = entero(rng, 3, 9);
    const largo2 = entero(rng, 3, 9);
    const mas1 = `La corde de ${n1} est plus longue que celle de ${n2}.`;
    const mas2 = `La corde de ${n2} est plus longue que celle de ${n1}.`;
    const igual = "Les deux cordes ont la même longueur.";
    const [correcta, distractores] = largo1 > largo2 ? [mas1, [mas2, igual]] : largo2 > largo1 ? [mas2, [mas1, igual]] : [igual, [mas1, mas2]];
    const explicacion = largo1 === largo2 ? "Les deux bandes s'arrêtent au même endroit : elles ont la même longueur." : `La bande de ${largo1 > largo2 ? n1 : n2} va plus loin : c'est la plus longue.`;
    return fraseDe(rng, d, { tipo: "tiras", tiras: [{ etiqueta: `Corde de ${n1}`, largo: largo1 }, { etiqueta: `Corde de ${n2}`, largo: largo2 }] }, correcta, distractores, explicacion, `tiras/${n1}/${largo1}/${largo2}`, "Compare où finit chaque bande.");
  }
  const [a, b] = muestra(rng, SERES, 2) as [Nombre, Nombre];
  const k = entero(rng, 2, 6);
  const m = entero(rng, 2, 6);
  const masA = `Il y a plus ${dePl(a)} que ${dePl(b)}.`;
  const masB = `Il y a plus ${dePl(b)} que ${dePl(a)}.`;
  const igual = `Il y a autant ${dePl(a)} que ${dePl(b)}.`;
  const [correcta, distractores] = k > m ? [masA, [masB, igual]] : m > k ? [masB, [masA, igual]] : [igual, [masA, masB]];
  return fraseDe(rng, d, objetos([a, k], [b, m]), correcta, distractores, `Il y a ${grupo(k, a)} et ${grupo(m, b)}.`, `comparar/${a.id}/${b.id}/${k}/${m}`, "Compte chaque groupe et compare.");
};

// ---------- LEE2-T3 : chercher une information ----------
const T = "LEE2-T3-a";
const P_QUI = "Cherche dans le texte le nom de la personne.";
const P_QUAND = "Cherche dans le texte les mots qui disent quand ça se passe.";
const P_OU = "Cherche dans le texte les mots qui disent le lieu.";

const TEXTOS_BUSCAR: readonly TextoEscrito[] = [
  {
    id: "fr-LEE2-T3-tx1", titulo: "Le panier de {F1}",
    texto: "Jeudi matin, {F1} part à la ferme avec son oncle. Ils remplissent un panier de haricots près de la grange. L'après-midi, {F1} rapporte le panier à la maison et le pose sur la table.",
    preguntas: [
      q(T, 1, "Avec qui {F1} part-elle à la ferme ?", "Avec son oncle", ["Avec sa sœur", "Avec son voisin"], P_QUI, "Le texte dit que {F1} part avec son oncle."),
      q(T, 1, "Quel jour vont-ils à la ferme ?", "Jeudi", ["Lundi", "Samedi"], P_QUAND, "La première phrase dit « jeudi matin »."),
      q(T, 2, "Où remplissent-ils le panier ?", "Près de la grange", ["Près de l'école", "Sur la table"], P_OU, "Le texte dit qu'ils le remplissent près de la grange."),
      q(T, 2, "Quand {F1} rapporte-t-elle le panier ?", "L'après-midi", ["Le matin", "La nuit"], P_QUAND, "Le matin, ils vont à la ferme. L'après-midi, elle rapporte le panier."),
      q(T, 3, "À la fin de l'histoire, où est le panier ?", "Sur la table", ["À la ferme", "Près de la grange"], "Il était d'abord à un endroit. Regarde où on le met ensuite.", "Ils remplissent le panier près de la grange, mais à la fin {F1} le pose sur la table.", "Où est le panier à la fin ?"),
    ],
  },
  {
    id: "fr-LEE2-T3-tx2", titulo: "Sept heures et midi",
    texto: "{M1} et sa sœur {F1} quittent la maison à sept heures. Lui va au stade et elle va chez sa tante. À midi, ils rentrent tous les deux pour déjeuner avec leur père.",
    preguntas: [
      q(T, 1, "Comment s'appelle la sœur de {M1} ?", "{F1}", ["{F2}", "{F3}"], P_QUI, "Le texte dit « sa sœur {F1} »."),
      q(T, 1, "À quelle heure quittent-ils la maison ?", "À sept heures", ["À midi", "À dix heures"], P_QUAND, "La première phrase dit qu'ils partent à sept heures."),
      q(T, 2, "À quelle heure rentrent-ils ?", "À midi", ["À sept heures", "À deux heures"], P_QUAND, "Ils partent à sept heures et rentrent à midi."),
      q(T, 3, "Où va {F1} quand elle quitte la maison ?", "Chez sa tante", ["Au stade", "Au marché"], "Regarde qui sont « lui » et « elle ».", "Le texte dit « elle va chez sa tante ». « Elle », c'est {F1}.", "{F1} quitte la maison. Où va-t-elle ?"),
      q(T, 3, "Qui va au stade ?", "{M1}", ["{F1}", "Leur père"], "Regarde qui sont « lui » et « elle ».", "Le texte dit « lui va au stade ». « Lui », c'est {M1}."),
    ],
  },
  {
    id: "fr-LEE2-T3-tx3", titulo: "Le vent de lundi",
    texto: "Lundi soir, le vent a soufflé très fort sur le village. {F1} et {F2} n'ont pas pu rentrer à pied : elles sont restées dans la salle de l'école. Quand le vent s'est calmé, le gardien {M1} les a raccompagnées.",
    preguntas: [
      q(T, 1, "Qui a raccompagné les filles ?", "Le gardien {M1}", ["La mère de {F1}", "Le grand-père de {F2}"], P_QUI, "Le texte dit que le gardien {M1} les a raccompagnées."),
      q(T, 2, "Quand le vent a-t-il soufflé très fort ?", "Lundi soir", ["Lundi matin", "Mardi soir"], P_QUAND, "La première phrase dit « lundi soir »."),
      q(T, 2, "Où sont restées {F1} et {F2} ?", "Dans la salle de l'école", ["Dans la rue", "Chez elles"], P_OU, "Le texte dit qu'elles sont restées dans la salle de l'école."),
      q(T, 3, "Quand les filles sont-elles rentrées ?", "Quand le vent s'est calmé", ["Avant le début du vent", "Pendant le vent très fort"], "Lis la dernière phrase.", "La dernière phrase dit que le gardien les a raccompagnées quand le vent s'est calmé."),
    ],
  },
  {
    id: "fr-LEE2-T3-tx4", titulo: "Les chèvres du dimanche",
    texto: "Tous les dimanches, {M1} garde les chèvres avec sa grand-mère. Aujourd'hui, il est arrivé très tôt, avant le lever du soleil. Son cousin {M2} est venu plus tard, avec une corde neuve.",
    preguntas: [
      q(T, 1, "Avec qui {M1} garde-t-il les chèvres ?", "Avec sa grand-mère", ["Avec sa tante", "Avec son frère"], P_QUI, "La première phrase dit « avec sa grand-mère »."),
      q(T, 1, "Quel jour {M1} garde-t-il les chèvres ?", "Le dimanche", ["Le lundi", "Le mercredi"], P_QUAND, "Le texte dit « tous les dimanches »."),
      q(T, 2, "Qui a apporté la corde ?", "{M2}", ["{M1}", "La grand-mère"], P_QUI, "Le texte dit que {M2} est venu avec une corde neuve."),
      q(T, 3, "Aujourd'hui, qui est arrivé le premier, {M1} ou {M2} ?", "{M1}", ["{M2}", "Ils sont arrivés ensemble"], "Compare « très tôt » et « plus tard ».", "{M1} est arrivé très tôt et {M2} est venu plus tard.", "Qui est arrivé d'abord : {M1} ou {M2} ?"),
      q(T, 3, "Quand {M1} est-il arrivé aujourd'hui ?", "Avant le lever du soleil", ["Quand {M2} est venu", "La nuit, après le dîner"], "Lis la deuxième phrase.", "Le texte dit qu'il est arrivé avant le lever du soleil."),
    ],
  },
  {
    id: "fr-LEE2-T3-tx5", titulo: "La sortie au moulin",
    texto: "Mercredi, la classe de {F1} a visité un vieux moulin. La meunière, {F2}, leur a montré les sacs de farine dans la réserve. À midi, tout le monde a mangé au bord de la rivière, puis le car les a ramenés à l'école.",
    preguntas: [
      q(T, 1, "Qui est la meunière ?", "{F2}", ["{F1}", "{F3}"], P_QUI, "Le texte dit « la meunière, {F2} »."),
      q(T, 1, "Quel jour a eu lieu la visite ?", "Mercredi", ["Mardi", "Dimanche"], P_QUAND, "Le premier mot du texte le dit : mercredi."),
      q(T, 2, "Où étaient les sacs de farine ?", "Dans la réserve", ["Au bord de la rivière", "Dans le car"], P_OU, "La meunière leur a montré les sacs dans la réserve."),
      q(T, 2, "Quand ont-ils mangé ?", "À midi", ["Le soir", "En arrivant à l'école"], P_QUAND, "Le texte dit qu'ils ont mangé à midi."),
      q(T, 3, "Où était la classe à midi ?", "Au bord de la rivière", ["Dans la réserve", "Dans le car"], "Cherche le mot « midi » dans le texte.", "À midi, tout le monde a mangé au bord de la rivière."),
    ],
  },
  {
    id: "fr-LEE2-T3-tx6", titulo: "La clé retrouvée",
    texto: "Samedi, {M1} a perdu sa clé sur le chemin du puits. Dimanche matin, avant le petit déjeuner, {F1} la lui a rendue. Elle l'avait trouvée près du grand arbre, en allant chercher de l'eau avec sa mère.",
    preguntas: [
      q(T, 1, "Qui a perdu la clé ?", "{M1}", ["{F1}", "La mère de {F1}"], P_QUI, "La première phrase dit que {M1} a perdu sa clé."),
      q(T, 2, "Quel jour {M1} a-t-il perdu sa clé ?", "Samedi", ["Dimanche", "Vendredi"], P_QUAND, "Il l'a perdue samedi. Dimanche, on la lui a rendue."),
      q(T, 3, "Qui a trouvé la clé ?", "{F1}", ["{M1}", "Le maître"], "« Elle » parle de quelqu'un qui est déjà dans le texte.", "« Elle l'avait trouvée » : « elle », c'est {F1}, celle qui a rendu la clé."),
      q(T, 3, "Où était la clé quand on l'a trouvée ?", "Près du grand arbre", ["À la maison", "Dans le puits"], "Lis la dernière phrase.", "Le texte dit que {F1} l'a trouvée près du grand arbre.", "On a trouvé la clé. Où était-elle ?"),
      q(T, 3, "Quand {M1} a-t-il récupéré sa clé ?", "Dimanche, avant le petit déjeuner", ["Samedi, sur le chemin", "Dimanche, après le déjeuner"], "Cherche quand on la lui a rendue.", "{F1} la lui a rendue dimanche matin, avant le petit déjeuner."),
    ],
  },
];

// ---------- LEE2-T4 : ordre des faits ----------
const A = "LEE2-T4-a";
const B = "LEE2-T4-b";
const P_ORDRE = "Relis le texte et pense à ce qui s'est passé avant et après.";
const P_MOTS = "Regarde les mots comme « d'abord », « ensuite », « puis » et « enfin ».";
const P_AVANT = "Attention : le texte ne raconte pas tout dans l'ordre. Cherche le mot « avant » ou « avait ».";

const TEXTOS_ORDEN: readonly TextoEscrito[] = [
  {
    id: "fr-LEE2-T4-tx1", titulo: "Le pain du matin",
    texto: "D'abord, {F1} a mélangé la farine et l'eau. Ensuite, elle a laissé reposer la pâte avec sa tante. Puis elles ont mis le pain au four. Enfin, elles ont porté le pain chaud aux voisins.",
    preguntas: [
      q(A, 1, "Qu'a fait {F1} juste après avoir mélangé la farine et l'eau ?", "Elle a laissé reposer la pâte", ["Elle a mis le pain au four", "Elle est allée chez les voisins"], P_MOTS, "D'abord elle a mélangé, ensuite elle a laissé reposer la pâte.", "{F1} a mélangé. Qu'a-t-elle fait juste après ?"),
      q(A, 2, "Qu'ont-elles fait juste avant d'aller chez les voisins ?", "Elles ont mis le pain au four", ["Elles ont laissé reposer la pâte", "Elles ont mélangé la farine"], P_MOTS, "Après la pâte, le pain est allé au four, et enfin chez les voisins.", "Elles vont chez les voisins. Qu'ont-elles fait juste avant ?"),
      q(B, 1, "Que s'est-il passé en premier ?", "{F1} a mélangé la farine et l'eau", ["{F1} a laissé reposer la pâte", "Elles ont porté le pain"], P_MOTS, "Le texte commence par « d'abord, {F1} a mélangé »."),
      q(B, 2, "Que s'est-il passé à la fin ?", "Elles ont porté le pain aux voisins", ["Elles ont mis le pain au four", "Elles ont laissé reposer la pâte"], P_MOTS, "La dernière phrase dit qu'enfin elles ont porté le pain aux voisins."),
    ],
  },
  {
    id: "fr-LEE2-T4-tx2", titulo: "Le dessin pour Papi",
    texto: "Le matin, {M1} a dessiné une maison pour son grand-père. À midi, il a plié le dessin. L'après-midi, il l'a donné au facteur. Quatre jours plus tard, son grand-père l'a accroché au mur.",
    preguntas: [
      q(A, 1, "Qu'a fait {M1} avant de plier le dessin ?", "Il a dessiné une maison", ["Il a vu le facteur", "Il a accroché le dessin"], P_ORDRE, "Le matin il a dessiné, et à midi il a plié le dessin.", "{M1} a plié le dessin. Qu'a-t-il fait avant ?"),
      q(A, 2, "Que s'est-il passé après la rencontre avec le facteur ?", "Le grand-père a accroché le dessin", ["{M1} a dessiné une maison", "{M1} a plié le dessin"], P_ORDRE, "Quatre jours plus tard, le grand-père l'a accroché au mur.", "{M1} a donné le dessin au facteur. Que se passe-t-il après ?"),
      q(B, 1, "Qu'a fait {M1} en premier ?", "Il a dessiné une maison", ["Il a vu le facteur", "Il a plié le dessin"], P_ORDRE, "La première chose, le matin, c'est le dessin."),
      q(B, 2, "Que s'est-il passé en dernier ?", "Le grand-père a accroché le dessin", ["{M1} a donné le dessin au facteur", "{M1} a plié le dessin"], P_ORDRE, "La dernière chose arrive quatre jours plus tard : le dessin va au mur."),
    ],
  },
  {
    id: "fr-LEE2-T4-tx3", titulo: "Les chaussures pleines de boue",
    texto: "{F1} est arrivée à l'école avec des chaussures pleines de boue. Avant, sur la route, elle avait aidé une dame à pousser une charrette. Elle a nettoyé ses chaussures, puis elle est entrée en classe.",
    preguntas: [
      q(A, 2, "Qu'a fait {F1} juste avant d'entrer en classe ?", "Elle a nettoyé ses chaussures", ["Elle a aidé une dame", "Elle est arrivée à l'école"], "Lis la dernière phrase.", "Le texte dit qu'elle a nettoyé ses chaussures, puis qu'elle est entrée en classe.", "{F1} entre en classe. Qu'a-t-elle fait juste avant ?"),
      q(A, 3, "Qu'a fait {F1} avant d'arriver à l'école ?", "Elle a aidé une dame avec une charrette", ["Elle a nettoyé ses chaussures", "Elle est entrée en classe"], P_AVANT, "Le texte dit « avant, sur la route » : elle a aidé la dame avant d'arriver.", "{F1} arrive à l'école. Qu'a-t-elle fait avant ?"),
      q(B, 3, "Que s'est-il passé en premier ?", "{F1} a aidé une dame", ["{F1} est arrivée à l'école", "{F1} a nettoyé ses chaussures"], P_AVANT, "Même si c'est raconté après, aider la dame s'est passé avant d'arriver à l'école."),
      q(B, 3, "Quel est l'ordre de ce qui s'est passé ?", "Elle a aidé une dame, elle est arrivée à l'école et elle a nettoyé ses chaussures.", ["Elle est arrivée à l'école, elle a aidé une dame et elle a nettoyé ses chaussures.", "Elle a nettoyé ses chaussures, elle a aidé une dame et elle est arrivée à l'école."], P_AVANT, "Elle a aidé sur la route, puis elle est arrivée à l'école et là, elle a nettoyé ses chaussures."),
    ],
  },
  {
    id: "fr-LEE2-T4-tx4", titulo: "Le lapin dans le jardin",
    texto: "Un lapin est sorti de la cage de {F1}. {F1} et {M1} l'ont cherché dans toute la cour. Ils l'ont trouvé derrière le puits, en train de manger de l'herbe. Ils l'ont ramené dans sa cage et ils ont bien fermé la porte.",
    preguntas: [
      q(A, 1, "Qu'ont-ils fait juste après avoir trouvé le lapin ?", "Ils l'ont ramené dans sa cage", ["Ils l'ont cherché dans la cour", "Ils sont allés au puits"], P_ORDRE, "Ils l'ont trouvé, puis ils l'ont ramené dans sa cage.", "Ils trouvent le lapin. Que font-ils juste après ?"),
      q(A, 2, "Que s'est-il passé avant que {F1} et {M1} cherchent dans la cour ?", "Le lapin est sorti de la cage", ["Ils ont trouvé le lapin", "Ils ont fermé la porte"], P_ORDRE, "Ils l'ont cherché parce qu'il était sorti avant.", "{F1} et {M1} cherchent. Que s'est-il passé avant ?"),
      q(B, 1, "Que s'est-il passé en premier ?", "Le lapin est sorti de la cage", ["Ils ont trouvé le lapin", "Ils ont fermé la porte"], P_ORDRE, "Tout commence quand le lapin sort de la cage."),
      q(B, 2, "Que s'est-il passé à la fin ?", "Ils ont bien fermé la porte", ["Ils ont cherché dans la cour", "Ils ont trouvé le lapin"], P_ORDRE, "La dernière chose est de bien fermer la porte de la cage."),
      q(B, 3, "Quel est l'ordre de l'histoire ?", "Il est sorti, ils l'ont cherché et ils l'ont trouvé.", ["Ils l'ont cherché, il est sorti et ils l'ont trouvé.", "Ils l'ont trouvé, ils l'ont cherché et il est sorti."], P_ORDRE, "D'abord le lapin sort, ensuite ils le cherchent et enfin ils le trouvent."),
    ],
  },
  {
    id: "fr-LEE2-T4-tx5", titulo: "Le cartable prêt",
    texto: "Avant d'aller au lit, {M1} a rangé ses cahiers dans son cartable. Ce soir-là, il avait fini ses devoirs avec sa sœur. Le matin, il s'est levé tôt, il a pris son cartable et il est parti à l'école.",
    preguntas: [
      q(A, 2, "Qu'a fait {M1} juste après s'être levé ?", "Il a pris son cartable", ["Il a rangé ses cahiers", "Il a fini ses devoirs"], "Lis la dernière phrase.", "Le matin, il s'est levé et il a pris son cartable.", "{M1} se lève. Que fait-il juste après ?"),
      q(A, 3, "Qu'a fait {M1} avant de ranger ses cahiers ?", "Il a fini ses devoirs", ["Il s'est levé tôt", "Il est parti à l'école"], P_AVANT, "Il a fini ses devoirs, puis il a rangé ses cahiers avant de dormir.", "{M1} range ses cahiers. Qu'a-t-il fait avant ?"),
      q(B, 1, "Qu'a fait {M1} à la fin ?", "Il est parti à l'école", ["Il a fini ses devoirs", "Il a rangé ses cahiers"], "Lis la dernière phrase.", "La dernière chose racontée, c'est qu'il part à l'école."),
      q(B, 3, "Qu'a fait {M1} en premier ?", "Il a fini ses devoirs avec sa sœur", ["Il a rangé ses cahiers", "Il s'est levé tôt"], P_AVANT, "D'abord il a fini ses devoirs. Ensuite, il a rangé ses cahiers et il a dormi."),
    ],
  },
];

// ---------- LEE2-T5 : panneaux, horaires et étiquettes ----------
const CARTEL = "LEE2-T5-a";
const HORARIO = "LEE2-T5-b";
const ETIQUETA = "LEE2-T5-c";

type Fila = readonly [Dificultad, string, string, string, readonly [string, string], string, string];

function serie(sub: string, id: string, imagen: Imagen, filas: readonly Fila[]): readonly Situacion[] {
  return filas.map(([dificultad, enunciado, enunciadoFacil, correcta, distractores, pista, explicacion], i): Situacion => ({
    id: `fr/${sub}/${id}/${i}`, sub, dificultad, enunciado, enunciadoFacil, correcta, distractores, pista, explicacion, imagen,
  }));
}

const cartel = (estilo: "aviso" | "horario" | "etiqueta", titulo: string, ...lineas: readonly string[]): Imagen => ({ tipo: "cartel", estilo, titulo, lineas });
const P_LIS = "Lis le panneau ligne par ligne.";

const CARTELES: readonly Situacion[] = [
  ...serie(CARTEL, "escalier", cartel("aviso", "ATTENTION", "Escalier glissant.", "Tiens la rampe."), [
    [1, "Que faut-il tenir ici ?", "Lis le panneau. Que tiens-tu ?", "La rampe", ["Un ballon", "La main du voisin"], P_LIS, "Le panneau dit « Tiens la rampe »."],
    [2, "D'après le panneau, pourquoi faut-il faire attention ?", "Pourquoi faut-il faire attention ?", "Parce que l'escalier est glissant", ["Parce qu'il y a un chien", "Parce que l'escalier est cassé"], P_LIS, "Le panneau dit « Escalier glissant ». Tu peux tomber."],
    [3, "D'après le panneau, que ne dois-tu PAS faire ici ?", "Que ne dois-tu PAS faire ici ?", "Lâcher la rampe", ["Tenir la rampe", "Regarder les marches"], "Pense au contraire de ce que demande le panneau.", "Le panneau demande de tenir la rampe parce que l'escalier est glissant."],
  ]),
  ...serie(CARTEL, "pharmacie", cartel("aviso", "BOUTIQUE DU VILLAGE", "Fermée le mercredi.", "Ouvre le jeudi à 8 heures."), [
    [1, "Quel jour la boutique est-elle fermée ?", "Quel jour est-elle fermée ?", "Le mercredi", ["Le jeudi", "Le samedi"], P_LIS, "Le panneau dit « Fermée le mercredi »."],
    [2, "À quelle heure la boutique ouvre-t-elle le jeudi ?", "À quelle heure ouvre-t-elle le jeudi ?", "À 8 heures", ["À 10 heures", "À midi"], "Cherche la ligne qui parle du jeudi.", "Le panneau dit « Ouvre le jeudi à 8 heures »."],
    [3, "{F1} veut du sel et c'est mercredi. D'après le panneau, que doit-elle faire ?", "{F1} veut du sel. C'est mercredi. Que doit-elle faire ?", "Revenir le jeudi", ["Entrer aujourd'hui", "Entrer aujourd'hui à 8 heures"], "Regarde ce que dit le panneau sur le mercredi.", "Le mercredi, c'est fermé. Ça ouvre le jeudi, donc {F1} doit revenir ce jour-là."],
  ]),
  ...serie(CARTEL, "chien", cartel("aviso", "CHIEN PERDU", "Il est marron, avec une oreille blanche.", "Si tu le vois, préviens {F1}.", "Elle habite la maison verte."), [
    [1, "Quel animal est perdu ?", "Quel animal cherche-t-on ?", "Un chien", ["Un chat", "Un oiseau"], "Lis le titre du panneau.", "Le titre dit « Chien perdu »."],
    [2, "Comment est l'animal perdu ?", "Comment est le chien ?", "Marron, avec une oreille blanche", ["Blanc, avec une oreille marron", "Tout marron"], "Cherche la ligne qui dit sa couleur.", "Le panneau dit « Il est marron, avec une oreille blanche »."],
    [3, "Tu vois ce chien dans la rue. D'après le panneau, que dois-tu faire ?", "Tu vois le chien. Que dois-tu faire ?", "Prévenir {F1}", ["L'emmener à l'école", "Le garder chez toi"], "Cherche la ligne qui commence par « Si tu le vois ».", "Le panneau dit « Si tu le vois, préviens {F1} »."],
  ]),
  ...serie(CARTEL, "eau", cartel("aviso", "EAU DANGEREUSE", "Ne pas boire.", "Eau pour boire : fontaine de l'école."), [
    [1, "Peut-on boire l'eau à côté de ce panneau ?", "Peut-on boire cette eau ?", "Non", ["Oui", "Seulement le matin"], P_LIS, "Le panneau dit « Ne pas boire »."],
    [2, "Où y a-t-il de l'eau pour boire ?", "Où y a-t-il de la bonne eau ?", "À la fontaine de l'école", ["À côté de ce panneau", "Au marché"], "Cherche la ligne qui dit « Eau pour boire ».", "Le panneau dit « Eau pour boire : fontaine de l'école »."],
    [3, "{M1} a soif et il est à côté de ce panneau. Que doit-il faire ?", "{M1} a soif. Il est à côté du panneau. Que doit-il faire ?", "Aller boire à la fontaine de l'école", ["Boire l'eau d'ici", "Boire ici juste un peu"], "Pense à l'eau qui est sûre d'après le panneau.", "L'eau d'ici ne se boit pas, même un peu. L'eau sûre est à la fontaine de l'école."],
  ]),
];

const P_HORAIRE = "Cherche dans l'horaire le jour ou la ligne dont parle la question.";

const HORARIOS: readonly Situacion[] = [
  ...serie(HORARIO, "car", cartel("horario", "CAR POUR LA VILLE", "Premier car : 7 heures du matin", "Deuxième car : 1 heure de l'après-midi", "Dernier car : 5 heures du soir"), [
    [1, "À quelle heure part le premier car ?", "Quand part le premier ?", "À 7 heures du matin", ["À 1 heure de l'après-midi", "À 5 heures du soir"], P_HORAIRE, "L'horaire dit « Premier car : 7 heures du matin »."],
    [2, "À quelle heure part le dernier car ?", "Quand part le dernier ?", "À 5 heures du soir", ["À 7 heures du matin", "À 1 heure de l'après-midi"], P_HORAIRE, "L'horaire dit « Dernier car : 5 heures du soir »."],
    [3, "{F1} arrive à l'arrêt à 9 heures du matin. Quel est le prochain car ?", "{F1} arrive à 9 heures du matin. Quel est le car suivant ?", "Celui de 1 heure de l'après-midi", ["Celui de 7 heures du matin", "Celui de 5 heures du soir"], "Celui de 7 heures est déjà parti. Regarde celui qui vient après.", "À 9 heures, le car de 7 heures est parti. Le suivant est celui de 1 heure de l'après-midi."],
  ]),
  ...serie(HORARIO, "classes", { tipo: "tabla", titulo: "Cours de la semaine", cabeceras: ["Jour", "Premier cours", "Deuxième cours"], filas: [["Lundi", "Calcul", "Lecture"], ["Mardi", "Lecture", "Sport"], ["Mercredi", "Calcul", "Jardin"], ["Jeudi", "Chant", "Lecture"], ["Vendredi", "Sport", "Calcul"]] }, [
    [1, "Quel est le premier cours du lundi ?", "Regarde lundi. Quel cours vient d'abord ?", "Calcul", ["Lecture", "Chant"], "Cherche la ligne du lundi.", "Sur la ligne du lundi, le premier cours est Calcul."],
    [2, "Quel jour y a-t-il le cours de Jardin ?", "Quel jour y a-t-il Jardin ?", "Le mercredi", ["Le lundi", "Le vendredi"], "Cherche le mot « Jardin » dans le tableau et regarde sa ligne.", "« Jardin » est sur la ligne du mercredi."],
    [3, "Combien de jours par semaine y a-t-il Calcul ?", "Combien de jours y a-t-il Calcul ?", "3 jours", ["2 jours", "4 jours"], "Cherche « Calcul » sur toutes les lignes et compte.", "Il y a Calcul le lundi, le mercredi et le vendredi : 3 jours."],
  ]),
  ...serie(HORARIO, "marche", cartel("horario", "MARCHÉ DU VILLAGE", "Lundi : de 7 à 1", "Mercredi : de 7 à 1", "Samedi : de 7 à 11"), [
    [1, "À quelle heure commence le marché le lundi ?", "Quand commence-t-il le lundi ?", "À 7 heures", ["À 1 heure", "À 11 heures"], P_HORAIRE, "Le lundi, le marché est de 7 à 1 : il commence à 7 heures."],
    [2, "Combien de jours par semaine y a-t-il marché ?", "Combien de jours y a-t-il marché ?", "3 jours", ["2 jours", "7 jours"], "Compte les lignes de l'horaire.", "Il y a marché le lundi, le mercredi et le samedi : 3 jours."],
    [3, "Quel jour le marché finit-il le plus tôt ?", "Quel jour finit-il le plus tôt ?", "Le samedi", ["Le lundi", "Le mercredi"], "Compare l'heure de fin de chaque jour.", "Le samedi, il finit à 11 heures. Le lundi et le mercredi, il finit à 1 heure."],
  ]),
  ...serie(HORARIO, "tours", { tipo: "tabla", titulo: "Tâches de la classe", cabeceras: ["Jour", "Arrose le jardin", "Balaie la classe"], filas: [["Lundi", "{F1}", "{M1}"], ["Mardi", "{M2}", "{F2}"], ["Mercredi", "{F3}", "{M3}"]] }, [
    [1, "Qui arrose le jardin le lundi ?", "Regarde lundi. Qui arrose ?", "{F1}", ["{M1}", "{M2}"], "Cherche la ligne du lundi et la colonne pour arroser.", "Sur la ligne du lundi, c'est {F1} qui arrose le jardin."],
    [2, "Quel jour {F2} balaie-t-elle la classe ?", "Quel jour {F2} balaie-t-elle ?", "Le mardi", ["Le lundi", "Le mercredi"], "Cherche le nom dans le tableau et regarde sa ligne.", "{F2} est sur la ligne du mardi, dans la colonne pour balayer."],
    [3, "Quelle tâche a {M3}, et quel jour ?", "Que fait {M3} ? Quel jour ?", "Balayer la classe le mercredi", ["Arroser le jardin le mercredi", "Balayer la classe le mardi"], "Regarde la ligne et aussi la colonne.", "{M3} est sur la ligne du mercredi, dans la colonne « Balaie la classe »."],
  ]),
];

const P_ETIQUETTE = "Lis l'étiquette ligne par ligne.";

const ETIQUETAS: readonly Situacion[] = [
  ...serie(ETIQUETA, "sucre", cartel("etiqueta", "SUCRE", "Sac de 1 kilo", "Prix : 6 pièces", "Garder au sec"), [
    [1, "Combien coûte le sac de sucre ?", "Combien coûte le sucre ?", "6 pièces", ["1 pièce", "10 pièces"], P_ETIQUETTE, "L'étiquette dit « Prix : 6 pièces »."],
    [2, "Où faut-il garder le sucre ?", "Où le garde-t-on ?", "Au sec", ["Dans un endroit mouillé", "Dans l'eau"], P_ETIQUETTE, "L'étiquette dit « Garder au sec »."],
    [3, "{F1} a 4 pièces. Peut-elle acheter le sac de sucre ?", "{F1} a 4 pièces. Peut-elle acheter le sucre ?", "Non, il lui manque 2 pièces", ["Oui, et il lui reste 2 pièces", "Oui, elle a juste ce qu'il faut"], "Compare ce qu'elle a avec le prix.", "Le sac coûte 6 pièces et {F1} a 4 pièces : il lui manque 2 pièces."],
  ]),
  ...serie(ETIQUETA, "lessive", cartel("etiqueta", "SAVON POUR LE LINGE", "Ne pas boire.", "Garder loin des enfants.", "Utiliser avec de l'eau."), [
    [1, "À quoi sert ce produit ?", "À quoi sert-il ?", "À laver le linge", ["À boire", "À laver les fruits"], "Lis le titre de l'étiquette.", "Le titre dit « Savon pour le linge »."],
    [2, "Où faut-il garder ce savon ?", "Où le garde-t-on ?", "Loin des enfants", ["À côté de la nourriture", "Dans le lit"], P_ETIQUETTE, "L'étiquette dit « Garder loin des enfants »."],
    [3, "Un petit enfant veut jouer avec ce savon. Que dois-tu faire ?", "Un petit enfant veut ce savon. Que fais-tu ?", "Prévenir un adulte", ["Le laisser jouer", "Le lui donner pour qu'il l'ouvre"], "Pense à ce que dit l'étiquette sur les enfants.", "L'étiquette dit qu'il faut le garder loin des enfants. Il faut prévenir un adulte."],
  ]),
  ...serie(ETIQUETA, "graines", cartel("etiqueta", "GRAINES DE HARICOT", "Semer en avril", "Arroser tous les 3 jours", "Haricots en 2 mois"), [
    [1, "Ces graines sont des graines de quoi ?", "Quelles graines est-ce ?", "De haricot", ["De fleur", "De pomme"], "Lis le titre de l'étiquette.", "Le titre dit « Graines de haricot »."],
    [2, "En quel mois sème-t-on ces graines ?", "En quel mois les sème-t-on ?", "En avril", ["En mai", "En janvier"], P_ETIQUETTE, "L'étiquette dit « Semer en avril »."],
    [3, "{M1} a arrosé les graines aujourd'hui. Quand doit-il les arroser à nouveau ?", "{M1} a arrosé aujourd'hui. Quand arrose-t-il encore ?", "Dans 3 jours", ["Dans 2 mois", "Encore aujourd'hui"], "Cherche la ligne qui parle d'arroser.", "L'étiquette dit « Arroser tous les 3 jours » : il faut arroser à nouveau dans 3 jours."],
  ]),
  ...serie(ETIQUETA, "sirop", cartel("etiqueta", "SIROP POUR LA TOUX", "Seulement avec un adulte", "1 cuillère le soir", "Ne pas prendre plus"), [
    [1, "À quoi sert ce sirop ?", "À quoi sert-il ?", "Pour la toux", ["Pour les cheveux", "Pour la soif"], "Lis le titre de l'étiquette.", "Le titre dit « Sirop pour la toux »."],
    [2, "Combien de sirop prend-on et quand ?", "Combien en prend-on ? Quand ?", "1 cuillère le soir", ["2 cuillères le soir", "1 cuillère le matin"], P_ETIQUETTE, "L'étiquette dit « 1 cuillère le soir »."],
    [3, "{F1} tousse et il n'y a aucun adulte à la maison. D'après l'étiquette, que doit-elle faire ?", "{F1} tousse. Il n'y a pas d'adulte. Que doit-elle faire ?", "Attendre un adulte", ["Prendre le sirop seule", "Prendre deux cuillères"], "Cherche la ligne qui parle d'un adulte.", "L'étiquette dit « Seulement avec un adulte ». {F1} doit attendre."],
  ]),
];

export const GENERADORES_LEE2_FR: MapaGeneradores = {
  [SINONIMO]: [generadorDeSituaciones(SINONIMO, SITUACIONES_SINONIMOS)],
  [CONTRARIO]: [generadorDeSituaciones(CONTRARIO, SITUACIONES_CONTRARIOS)],
  [CATEGORIA]: [porDificultad({ 1: categoriaFacil, 2: categoriaMedia, 3: categoriaDificil })],
  [COMPLETAR]: [generadorDeSituaciones(COMPLETAR, SITUACIONES_COMPLETAR)],
  [FRASE_IMAGEN]: [porDificultad({ 1: imagenFacil, 2: imagenMedia, 3: imagenDificil })],
  [T]: [generadorDeTextos(T, TEXTOS_BUSCAR)],
  [A]: [generadorDeTextos(A, TEXTOS_ORDEN)],
  [B]: [generadorDeTextos(B, TEXTOS_ORDEN)],
  [CARTEL]: [generadorDeSituaciones(CARTEL, CARTELES)],
  [HORARIO]: [generadorDeSituaciones(HORARIO, HORARIOS)],
  [ETIQUETA]: [generadorDeSituaciones(ETIQUETA, ETIQUETAS)],
};
