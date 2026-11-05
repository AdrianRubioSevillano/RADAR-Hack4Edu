// Capturas de todas las pantallas y auditoría axe en Chrome real.
// Uso: npm run build && npm run preview, y en otra terminal: npm run capturas
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CLAVE_CLASE } from "../src/services/almacen.ts";
import { alternarAyuda, empezarTest, preguntaActual, registrarRespuesta, type Clase } from "../src/services/clase.ts";
import { crearDemo } from "../src/services/demo.ts";
import { entrarProfesor, hacerTest, ir, pulsar, responderPantalla } from "./apoyo-chrome.ts";
import { withChrome, type Page } from "./cdp.ts";

const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const SALIDA = "docs/capturas-v2";
const AXE = readFileSync("node_modules/axe-core/axe.min.js", "utf8");

interface Informe {
  readonly pantalla: string;
  readonly superadas: number;
  readonly incumplidas: readonly { readonly id: string; readonly impacto: string; readonly nodos: number; readonly ejemplo: string }[];
}

async function foto(page: Page, nombre: string): Promise<void> {
  const out = await page.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(SALIDA, `${nombre}.png`), Buffer.from(String(out.data), "base64"));
}

async function axe(page: Page, nombre: string, informe: Informe[]): Promise<void> {
  await page.evaluate(`(window.axe || eval(${JSON.stringify(AXE)}), 0)`);
  const r = (await page.evaluate(`axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] }).then((x) => ({
    superadas: x.passes.length,
    incumplidas: x.violations.map((v) => ({ id: v.id, impacto: v.impact, nodos: v.nodes.length, ejemplo: v.nodes[0].target.join(' ') + ' :: ' + (v.nodes[0].failureSummary || '').split('\\n').slice(1, 2).join('').trim().slice(0, 120) })),
  }))`)) as Omit<Informe, "pantalla">;
  informe.push({ pantalla: nombre, ...r });
  console.log(`axe ${nombre}: ${r.incumplidas.length} incumplidas, ${r.superadas} superadas`);
  for (const v of r.incumplidas) console.log(`   [${v.impacto}] ${v.id} x${v.nodos}: ${v.ejemplo}`);
}

const id = (c: Clase, nombre: string) => c.alumnos.find((a) => a.nombre === nombre)?.id as string;

// Avanza un test hasta encontrar una pregunta del formato pedido.
function hastaFormato(c: Clase, alumno: string, testId: string, cumple: (p: NonNullable<ReturnType<typeof preguntaActual>>) => boolean): Clase {
  let actual = empezarTest(c, alumno, testId);
  for (let i = 0; i < 9; i += 1) {
    const p = preguntaActual(actual, alumno, testId);
    if (p === null || cumple(p)) return actual;
    actual = registrarRespuesta(actual, alumno, testId, p, true);
  }
  return actual;
}

await withChrome(async (page) => {
  mkdirSync(SALIDA, { recursive: true });
  page.base = BASE;
  const informe: Informe[] = [];
  const sembrar = async (c: Clase) => {
    await page.evaluate(`localStorage.setItem(${JSON.stringify(CLAVE_CLASE)}, ${JSON.stringify(JSON.stringify(c))})`);
  };
  const abrir = async (c: Clase, hash: string) => {
    await page.go("");
    await sembrar(c);
    await page.go(hash.replace(/^#\//, ""));
    await page.wait(350);
  };

  for (const d of [{ tag: "1280", width: 1280, height: 800 }, { tag: "768", width: 768, height: 1024 }]) {
    await page.viewport(d.width, d.height, false);
    const paso = async (nombre: string) => {
      await foto(page, `${d.tag}-${nombre}`);
      await axe(page, `${d.tag}/${nombre}`, informe);
      const desborda = Number(await page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth"));
      if (desborda > 0) console.log(`   DESBORDA ${desborda}px en ${d.tag}/${nombre}`);
    };
    const demo = crearDemo();
    const amina = id(demo, "Amina");
    const omar = id(demo, "Omar");
    const lucia = id(demo, "Lucía");

    await abrir(demo, "#/");
    await paso("01-inicio");
    await ir(page, "#/acerca");
    await paso("02-acerca");
    await ir(page, "#/alumno");
    await paso("03-quien-eres");
    await ir(page, `#/alumno/${lucia}`);
    await paso("04-mis-tests");

    await ir(page, "#/profesor");
    await paso("05-pin-crear");
    await entrarProfesor(page);
    await paso("06-mi-clase");
    await ir(page, "#/profesor/alumno/A04");
    await paso("07-detalle-alumno");
    await ir(page, "#/profesor/ajustes");
    await paso("08-ajustes");
    await pulsar(page, ".barra-salir");
    await page.wait(250);
    await ir(page, "#/profesor");
    await paso("09-pin-escribir");

    // Formatos de pregunta.
    await abrir(hastaFormato(demo, lucia, "NUM2-T3", (p) => p.formato === "opcion"), `#/alumno/${lucia}/test/NUM2-T3`);
    await paso("10-pregunta-opciones");
    await abrir(hastaFormato(demo, lucia, "NUM2-T2", (p) => p.formato === "numero"), `#/alumno/${lucia}/test/NUM2-T2`);
    await paso("11-pregunta-numero");
    const lectura = { ...demo, curso: 5 as const };
    await abrir(hastaFormato(lectura, lucia, "LEE5-T1", () => true), `#/alumno/${lucia}/test/LEE5-T1`);
    await paso("12-pregunta-lectura");

    // Feedback.
    const conFeedback = hastaFormato(demo, lucia, "NUM2-T3", (p) => p.formato !== "numero");
    const pf = preguntaActual(conFeedback, lucia, "NUM2-T3");
    if (pf === null) throw new Error("sin pregunta");
    await abrir(conFeedback, `#/alumno/${lucia}/test/NUM2-T3`);
    await responderPantalla(page, pf, true);
    await page.wait(800);
    await paso("13-feedback-acierto");
    await abrir(conFeedback, `#/alumno/${lucia}/test/NUM2-T3`);
    await responderPantalla(page, pf, false);
    await page.wait(500);
    await paso("14-feedback-fallo");

    // Perfiles.
    await abrir(hastaFormato(demo, amina, "NUM2-T3", () => true), `#/alumno/${amina}/test/NUM2-T3`);
    await paso("15-perfil-dislexia");
    await abrir(hastaFormato(demo, omar, "NUM2-T3", () => true), `#/alumno/${omar}/test/NUM2-T3`);
    await paso("16-perfil-baja-vision");
    await ir(page, `#/alumno/${omar}`);
    await paso("17-baja-vision-mis-tests");
    const tdah = alternarAyuda(demo, lucia, "tdah");
    await abrir(hastaFormato(tdah, lucia, "NUM2-T3", () => true), `#/alumno/${lucia}/test/NUM2-T3`);
    await paso("18-perfil-tdah");

    // Fin de test, práctica y reto.
    await abrir(demo, `#/alumno/${amina}/test/NUM2-T3`);
    await hacerTest(page, amina, "NUM2-T3", (p) => p.subhabilidad !== "NUM2-T3-c");
    await page.wait(300);
    await paso("19-fin-test");
    await pulsar(page, "a.boton-principal", "Practicar");
    await page.wait(400);
    await pulsar(page, "button.boton-suave", "Necesito una pista");
    await page.wait(200);
    await paso("20-practica-pista");
    await ir(page, `#/alumno/${amina}`);
    await paso("21-tus-ejercicios");
    console.log(`fin ${d.tag}`);
  }

  writeFileSync("docs/AXE_V2.json", `${JSON.stringify(informe, null, 1)}\n`);
  const total = informe.reduce((n, i) => n + i.incumplidas.length, 0);
  console.log(`\n${informe.length} pantallas auditadas, ${total} incumplimientos`);
  if (total > 0) process.exitCode = 1;
});
