// Genera docs/MUESTRA_PREGUNTAS.md: 2 ejemplos por subhabilidad, para revisión humana.
// Uso: npm run muestras
import { writeFileSync } from "node:fs";
import { flujo } from "../src/core/rng.ts";
import { generarPregunta } from "../src/content/bancos.ts";
import { describirImagen } from "../src/content/imagenes.ts";
import { textoRespuesta } from "../src/content/respuestas.ts";
import { BLOQUES, CURSOS, NOMBRE_BLOQUE, NOMBRE_NIVEL, temasDe } from "../src/content/temario.ts";
import type { Dificultad, Pregunta } from "../src/content/tipos.ts";

const SEMILLA = 2026;

function bloqueDe(p: Pregunta, n: number): string {
  const lineas = [`**Ejemplo ${n}** · dificultad ${p.dificultad} · formato ${p.formato}`, ""];
  if (p.texto !== undefined) lineas.push(`> ${p.titulo === undefined ? "" : `**${p.titulo}.** `}${p.texto.replace(/\n/g, "\n> ")}`, "");
  if (p.imagen !== undefined) lineas.push(`- Imagen: ${describirImagen(p.imagen)}`);
  lineas.push(`- Enunciado: ${p.enunciado}`, `- Fácil: ${p.enunciadoFacil}`);
  if (p.opciones !== undefined) {
    lineas.push(`- Opciones: ${p.opciones.map((o) => (o.id === p.respuestaCorrecta ? `**${o.texto}** ✓` : o.texto)).join(" · ")}`);
    for (const o of p.opciones) if (o.imagen !== undefined) lineas.push(`  - ${o.texto}: ${describirImagen(o.imagen)}`);
  } else {
    lineas.push(`- Respuesta: **${textoRespuesta(p)}**`);
  }
  lineas.push(`- Pista: ${p.pista}`, `- Explicación: ${p.explicacion}`, "");
  return lineas.join("\n");
}

const salida: string[] = [
  "# Muestra de preguntas de RADAR",
  "",
  "Generado con `npm run muestras`, con semilla fija. Son 2 ejemplos por subhabilidad (uno fácil y uno difícil), para que una persona los revise.",
  "",
];

for (const curso of CURSOS) {
  salida.push(`## ${NOMBRE_NIVEL[curso]}`, "");
  for (const bloque of BLOQUES) {
    salida.push(`### ${NOMBRE_BLOQUE[bloque]}`, "");
    for (const tema of temasDe(curso, bloque)) {
      salida.push(`#### ${tema.id} · ${tema.nombre}`, "");
      for (const sub of tema.subhabilidades) {
        salida.push(`##### ${sub.id} · ${sub.nombre}`, "");
        ([1, 3] as readonly Dificultad[]).forEach((d, i) => {
          salida.push(bloqueDe(generarPregunta(sub.id, flujo(SEMILLA, `muestra/${sub.id}/${d}`), d), i + 1));
        });
      }
    }
  }
}

writeFileSync("docs/MUESTRA_PREGUNTAS.md", salida.join("\n"));
console.log(`docs/MUESTRA_PREGUNTAS.md escrito: ${salida.filter((l) => l.startsWith("#####")).length} subhabilidades`);
