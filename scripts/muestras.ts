// Genera docs/MUESTRA_PREGUNTAS.md: 2 ejemplos por subhabilidad, para revisión humana.
// Uso: npm run muestras, o npm run muestras -- --idioma=fr --ciclo=2
import { writeFileSync } from "node:fs";
import { flujo } from "../src/core/rng.ts";
import { generarPregunta } from "../src/content/bancos.ts";
import { describirImagen } from "../src/content/imagenes.ts";
import { textoRespuesta } from "../src/content/respuestas.ts";
import { BLOQUES, CURSOS, temasDe } from "../src/content/temario.ts";
import type { Dificultad, Pregunta } from "../src/content/tipos.ts";
import { crearT } from "../src/i18n/index.ts";
import { nombreSub, nombreTema } from "../src/i18n/nombres.ts";

const SEMILLA = 2026;

// `--idioma=fr --ciclo=2` da la muestra en francés de ese ciclo.
const argumento = (nombre: string): string | undefined => process.argv.find((a) => a.startsWith(`--${nombre}=`))?.split("=")[1];
const idioma = argumento("idioma") === "fr" ? "fr" : "es";
const ciclo = argumento("ciclo");
const cursos = ciclo === undefined ? CURSOS : CURSOS.filter((c) => String(c) === ciclo);
const t = crearT(idioma);
const FR = idioma === "fr";
const E = FR
  ? { ejemplo: "Exemple", dificultad: "difficulté", formato: "format", imagen: "Image", enunciado: "Énoncé", facil: "Facile", opciones: "Choix", respuesta: "Réponse", pista: "Indice", explicacion: "Explication" }
  : { ejemplo: "Ejemplo", dificultad: "dificultad", formato: "formato", imagen: "Imagen", enunciado: "Enunciado", facil: "Fácil", opciones: "Opciones", respuesta: "Respuesta", pista: "Pista", explicacion: "Explicación" };

function bloqueDe(p: Pregunta, n: number): string {
  const lineas = [`**${E.ejemplo} ${n}** · ${E.dificultad} ${p.dificultad} · ${E.formato} ${p.formato}`, ""];
  if (p.texto !== undefined) lineas.push(`> ${p.titulo === undefined ? "" : `**${p.titulo}.** `}${p.texto.replace(/\n/g, "\n> ")}`, "");
  if (p.imagen !== undefined) lineas.push(`- ${E.imagen}: ${describirImagen(p.imagen, idioma)}`);
  lineas.push(`- ${E.enunciado}: ${p.enunciado}`, `- ${E.facil}: ${p.enunciadoFacil}`);
  if (p.opciones !== undefined) {
    lineas.push(`- ${E.opciones}: ${p.opciones.map((o) => (o.id === p.respuestaCorrecta ? `**${o.texto}** ✓` : o.texto)).join(" · ")}`);
    for (const o of p.opciones) if (o.imagen !== undefined) lineas.push(`  - ${o.texto}: ${describirImagen(o.imagen, idioma)}`);
  } else {
    lineas.push(`- ${E.respuesta}: **${textoRespuesta(p)}**`);
  }
  lineas.push(`- ${E.pista}: ${p.pista}`, `- ${E.explicacion}: ${p.explicacion}`, "");
  return lineas.join("\n");
}

const salida: string[] = FR
  ? ["# Échantillon de questions RADAR (français)", "", `Généré avec \`npm run muestras -- --idioma=fr --ciclo=${ciclo ?? ""}\`, avec une graine fixe. 2 exemples par sous-compétence (un facile et un difficile), pour une relecture humaine.`, ""]
  : ["# Muestra de preguntas de RADAR", "", "Generado con `npm run muestras`, con semilla fija. Son 2 ejemplos por subhabilidad (uno fácil y uno difícil), para que una persona los revise.", ""];

for (const curso of cursos) {
  salida.push(`## ${t(`nivel.${curso}`)}`, "");
  for (const bloque of BLOQUES) {
    salida.push(`### ${t(`bloque.${bloque}`)}`, "");
    for (const tema of temasDe(curso, bloque)) {
      salida.push(`#### ${tema.id} · ${nombreTema(t, tema.id)}`, "");
      for (const sub of tema.subhabilidades) {
        salida.push(`##### ${sub.id} · ${nombreSub(t, sub.id)}`, "");
        ([1, 3] as readonly Dificultad[]).forEach((d, i) => {
          salida.push(bloqueDe(generarPregunta(sub.id, flujo(SEMILLA, `muestra/${sub.id}/${d}`), d, idioma), i + 1));
        });
      }
    }
  }
}

const archivo = FR ? `docs/MUESTRA_FR_CICLO${ciclo ?? ""}.md` : "docs/MUESTRA_PREGUNTAS.md";
writeFileSync(archivo, salida.join("\n"));
console.log(`${archivo} escrito: ${salida.filter((l) => l.startsWith("#####")).length} subhabilidades`);
