// Vista móvil: recorre todas las pantallas en Chrome real, en los tres idiomas y con letra
// al 150 %, y falla si algo se sale. No basta con mirar scrollWidth: un contenedor con
// overflow: hidden puede cortar el texto sin crear scroll, y por eso se mide también cada
// texto y cada control. Lo que está dentro de un contenedor con scroll propio no cuenta.
// Uso: npm run preview, y en otra terminal: npm run movil [-- http://127.0.0.1:5173/]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { esCorrecta } from "../src/content/respuestas.ts";
import { testsDe } from "../src/content/tests.ts";
import type { Curso, Pregunta } from "../src/content/tipos.ts";
import type { Idioma } from "../src/i18n/index.ts";
import { CLAVE_CLASE } from "../src/services/almacen.ts";
import { alternarAyuda, empezarTest, marcarEjercicioHecho, miniTestDe, preguntaActual, registrarRespuesta, type Clase } from "../src/services/clase.ts";
import { crearDemo } from "../src/services/demo.ts";
import { CLAVE_IDIOMA } from "../src/services/idioma.ts";
import { PIN, pulsar, ir } from "./apoyo-chrome.ts";
import { withChrome, type Page } from "./cdp.ts";

const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const SALIDA = "docs/capturas-movil";
const PANTALLAS = [[320, 568], [375, 667], [430, 932], [393, 852]] as const;
const IDIOMAS: readonly Idioma[] = ["es", "fr", "gn"];
// Además del español, se guardan estas capturas en los otros idiomas.
const FOTO_EN_TODOS = new Set(["01-inicio", "06-pregunta-opciones", "21-mi-clase"]);

const MEDIR = `((ancho) => {
  const fallos = [];
  const raiz = document.documentElement;
  if (raiz.scrollWidth > ancho || raiz.scrollWidth > window.innerWidth) fallos.push('scrollWidth ' + raiz.scrollWidth);
  const fuera = '.sr-only, .ilu-solo-lector, .saltar, .chispas, option, script, style';
  const enScroll = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === 'auto' || o === 'scroll') return true;
    }
    return false;
  };
  const nombre = (el) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/)[0] : '');
  const paseFuera = (r) => r.width > 0 && (r.right > ancho + 1 || r.left < -1);
  const textos = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = textos.nextNode(); n; n = textos.nextNode()) {
    const el = n.parentElement;
    if (!n.textContent.trim() || el.closest(fuera) || enScroll(el)) continue;
    const rango = document.createRange();
    rango.selectNodeContents(n);
    const r = rango.getBoundingClientRect();
    const trozo = n.textContent.trim().slice(0, 28);
    if (paseFuera(r)) fallos.push('texto fuera: ' + trozo + ' (' + Math.round(r.right) + ')');
    const caja = el.closest('.boton, .opcion, .puerta, .tarjeta, .tecla, .nombre, .grupo, .ajuste, .manana, .barra-nombre');
    if (caja && r.width > 0 && r.right > caja.getBoundingClientRect().right + 1) fallos.push('texto sale de ' + nombre(caja) + ': ' + trozo);
    if (el.matches('.puerta-texto') && rango.getClientRects().length > 1) fallos.push('se parte: ' + trozo);
  }
  for (const el of document.querySelectorAll('a, button, input, select, img, svg, table, .cuadricula-marco')) {
    if (el.closest(fuera) || enScroll(el)) continue;
    const r = el.getBoundingClientRect();
    if (paseFuera(r)) fallos.push('control fuera: ' + nombre(el) + ' (' + Math.round(r.right) + ')');
  }
  return [...new Set(fallos)].slice(0, 5);
})`;

interface Hallado { readonly clase: Clase; readonly testId: string; readonly pregunta: Pregunta }

const fallos: string[] = [];
let revisiones = 0;

await withChrome(async (page) => {
  mkdirSync(SALIDA, { recursive: true });
  page.base = BASE;
  await page.viewport(393, 852, true);
  await page.go("");

  const abrir = async (c: Clase, hash: string): Promise<void> => {
    // Sin hashchange: la app aún viva guardaría su clase encima de la sembrada.
    await page.evaluate(`localStorage.setItem(${JSON.stringify(CLAVE_CLASE)}, ${JSON.stringify(JSON.stringify(c))}); history.replaceState(null, '', ${JSON.stringify(hash)})`);
    await page.send("Page.reload");
    await page.wait(250);
    for (let i = 0; i < 40; i += 1) {
      if (await page.evaluate("!!document.querySelector('.marco') && document.fonts.status === 'loaded'")) break;
      await page.wait(100);
    }
    await page.wait(350);
  };

  const medir = async (etiqueta: string, ancho: number, alto: number): Promise<void> => {
    await page.viewport(ancho, alto, true);
    await page.wait(90);
    const lista = (await page.evaluate(`${MEDIR}(${ancho})`)) as readonly string[];
    revisiones += 1;
    for (const f of lista) fallos.push(`${etiqueta} @${ancho}: ${f}`);
  };

  const foto = async (archivo: string): Promise<void> => {
    const out = await page.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    writeFileSync(join(SALIDA, `${archivo}.png`), Buffer.from(String(out.data), "base64"));
  };

  for (const idioma of IDIOMAS) {
    await page.evaluate(`localStorage.setItem(${JSON.stringify(CLAVE_IDIOMA)}, ${JSON.stringify(idioma)})`);

    const paso = async (nombre: string): Promise<void> => {
      const etiqueta = `${idioma}/${nombre}`;
      for (const [ancho, alto] of PANTALLAS) await medir(etiqueta, ancho, alto);
      if (idioma === "es") await foto(nombre);
      else if (FOTO_EN_TODOS.has(nombre)) await foto(`${nombre}-${idioma}`);
      // Letra al 150 % y alto contraste en todas las pantallas, también las del profesor.
      await page.evaluate("window.__previo = [document.documentElement.dataset.letra, document.documentElement.dataset.contraste]; document.documentElement.dataset.letra = 'muyGrande'; document.documentElement.dataset.contraste = 'alto'");
      for (const [ancho, alto] of PANTALLAS) await medir(`${etiqueta}+150%`, ancho, alto);
      await page.evaluate("document.documentElement.dataset.letra = window.__previo[0]; document.documentElement.dataset.contraste = window.__previo[1]");
    };

    const demo = crearDemo();
    const id = (nombre: string): string => {
      const a = demo.alumnos.find((x) => x.nombre === nombre);
      if (a === undefined) throw new Error(`Falta ${nombre}`);
      return a.id;
    };
    const lucia = id("Lucía");
    const omar = id("Omar");
    const amina = id("Amina");

    // Avanza por los tests de un curso hasta dar con una pregunta como la pedida.
    const buscar = (alumno: string, cursos: readonly Curso[], cumple: (p: Pregunta) => boolean): Hallado | null => {
      for (const curso of cursos) {
        for (const test of testsDe(curso).filter((x) => x.tipo === "tema")) {
          let c = empezarTest({ ...demo, curso }, alumno, test.id, idioma);
          for (let i = 0; i < 9; i += 1) {
            const p = preguntaActual(c, alumno, test.id);
            if (p === null) break;
            if (cumple(p)) return { clase: c, testId: test.id, pregunta: p };
            c = registrarRespuesta(c, alumno, test.id, p, true);
          }
        }
      }
      return null;
    };

    const responder = async (p: Pregunta, acertar: boolean): Promise<void> => {
      if (p.formato === "numero") {
        const valor = acertar ? p.respuestaCorrecta : p.respuestaCorrecta === "7" ? "8" : "7";
        for (const d of valor) {
          await page.evaluate(`[...document.querySelectorAll('.tecla')].find((b) => b.textContent.trim() === ${JSON.stringify(d)}).click()`);
        }
        await pulsar(page, "form.numero button[type=submit]");
      } else {
        const i = (p.opciones ?? []).findIndex((o) => esCorrecta(p, o.id) === acertar);
        await page.evaluate(`document.querySelectorAll('button.opcion')[${i}].click()`);
      }
      await page.wait(150);
    };

    const verPregunta = async (nombre: string, h: Hallado | null, alumno = lucia): Promise<void> => {
      if (h === null) {
        fallos.push(`${idioma}/${nombre}: no hay ninguna pregunta de esa forma`);
        return;
      }
      await abrir(h.clase, `#/alumno/${alumno}/test/${h.testId}`);
      await paso(nombre);
    };

    // Portada y entrada.
    await abrir(demo, "#/");
    await paso("01-inicio");
    await ir(page, "#/acerca");
    await paso("02-acerca");
    await ir(page, "#/alumno");
    await paso("03-elegir-alumno");
    await ir(page, `#/alumno/${lucia}`);
    await paso("04-mis-tests");
    await ir(page, `#/alumno/${omar}`);
    await paso("05-mis-tests-baja-vision");

    // Formatos de pregunta.
    const opcion = buscar(lucia, [2], (p) => p.formato === "opcion");
    if (opcion === null) throw new Error("Sin preguntas de opciones");
    await verPregunta("06-pregunta-opciones", opcion);
    await verPregunta("07-pregunta-teclado", buscar(lucia, [2], (p) => p.formato === "numero"));
    await verPregunta("08-pregunta-imagenes", buscar(lucia, [2, 1, 3], (p) => p.formato === "imagen"));
    await verPregunta("09-pregunta-lectura", buscar(lucia, [5], (p) => p.texto !== undefined));
    await verPregunta("10-pregunta-tabla", buscar(lucia, [4, 5, 6, 3], (p) => p.imagen?.tipo === "tabla"));
    await verPregunta("11-pregunta-cartel", buscar(lucia, [4, 5, 6, 3], (p) => p.imagen?.tipo === "cartel"));
    await verPregunta("12-baja-vision-opciones", buscar(omar, [2], (p) => p.formato === "opcion"), omar);
    await verPregunta("13-baja-vision-teclado", buscar(omar, [2], (p) => p.formato === "numero"), omar);
    await verPregunta("14-dislexia", buscar(amina, [2], () => true), amina);

    // Feedback.
    await abrir(opcion.clase, `#/alumno/${lucia}/test/${opcion.testId}`);
    await responder(opcion.pregunta, true);
    await page.wait(800);
    await paso("15-feedback-acierto");
    await abrir(opcion.clase, `#/alumno/${lucia}/test/${opcion.testId}`);
    await responder(opcion.pregunta, false);
    await page.wait(400);
    await paso("16-feedback-fallo");

    // Pausas TDAH: el descanso sale tras 5 respuestas y el corte a mitad de un test largo.
    const conTdah = alternarAyuda(demo, lucia, "tdah");
    const pausa = async (nombre: string, testId: string, antes: number): Promise<void> => {
      let c = empezarTest(conTdah, lucia, testId, idioma);
      for (let i = 0; i < antes; i += 1) {
        const p = preguntaActual(c, lucia, testId);
        if (p === null) throw new Error("Test corto");
        c = registrarRespuesta(c, lucia, testId, p, true);
      }
      const ultima = preguntaActual(c, lucia, testId);
      if (ultima === null) throw new Error("Test corto");
      await abrir(c, `#/alumno/${lucia}/test/${testId}`);
      await responder(ultima, true);
      await pulsar(page, ".respuesta .boton");
      await page.wait(300);
      await paso(nombre);
    };
    const repaso = testsDe(2).find((x) => x.tipo === "repaso");
    if (repaso === undefined) throw new Error("Sin test de repaso");
    await pausa("17-pausa-tdah", opcion.testId, 4);
    await pausa("18-pausa-tdah-parte", repaso.id, 5);

    // Fin de test, práctica y reto.
    const test = "NUM2-T3";
    let fin = empezarTest(demo, lucia, test, idioma);
    for (let p = preguntaActual(fin, lucia, test); p !== null; p = preguntaActual(fin, lucia, test)) fin = registrarRespuesta(fin, lucia, test, p, false);
    const sub = Object.keys(fin.intentos[lucia]?.[test]?.refuerzos ?? {})[0];
    if (sub === undefined) throw new Error("Sin refuerzo");
    await abrir(fin, `#/alumno/${lucia}/test/${test}`);
    await paso("19-fin-test");
    await abrir(fin, `#/alumno/${lucia}/practica/${test}/${sub}`);
    await pulsar(page, ".pregunta-accion > button.boton-suave");
    await page.wait(200);
    await paso("20-practica-pista");
    await ir(page, `#/alumno/${lucia}`);
    await paso("20b-tus-ejercicios");
    let reto = fin;
    for (let i = 0; i < 6; i += 1) reto = marcarEjercicioHecho(reto, lucia, test, sub);
    await abrir(reto, `#/alumno/${lucia}/practica/${test}/${sub}`);
    await paso("20c-reto");
    await pulsar(page, ".boton-grande");
    await page.wait(250);
    await paso("20d-reto-pregunta");
    for (const p of miniTestDe(reto, lucia, test, sub, idioma)) {
      await responder(p, true);
      await pulsar(page, ".respuesta .boton");
      await page.wait(200);
    }
    await paso("20e-reto-superado");

    // Profesor. El desbloqueo vive en memoria: estos pasos van seguidos, sin recargar.
    await abrir(demo, "#/profesor");
    await paso("20f-pin");
    for (let vez = 0; vez < 2; vez += 1) {
      for (const d of PIN) await pulsar(page, ".tecla", d);
      await page.wait(250);
    }
    await page.wait(350);
    await paso("21-mi-clase");
    await ir(page, "#/profesor/alumno/A04");
    await paso("22-detalle-alumno");
    await ir(page, "#/profesor/ajustes");
    await paso("23-ajustes");
    await pulsar(page, ".alumnos-ayudas .boton");
    await page.wait(120);
    await paso("24-ajustes-confirmar");
    await pulsar(page, ".barra-salir");
    await page.wait(250);
    await ir(page, "#/profesor");
    await paso("25-pin-escribir");
    console.log(`${idioma}: hecho (${fallos.length} fallos acumulados)`);
  }
});

console.log(`\n${revisiones} comprobaciones de anchura, ${fallos.length} fallos`);
for (const f of fallos) console.log(`  ${f}`);
if (fallos.length > 0) process.exitCode = 1;
