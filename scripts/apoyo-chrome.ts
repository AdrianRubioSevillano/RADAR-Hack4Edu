// Ayudas comunes para conducir la app de verdad en Chrome.
import { preguntaActual, type Clase } from "../src/services/clase.ts";
import { CLAVE_CLASE } from "../src/services/almacen.ts";
import { esCorrecta } from "../src/content/respuestas.ts";
import type { Pregunta } from "../src/content/tipos.ts";
import type { Page } from "./cdp.ts";

export const PIN = "1234";

export async function clase(page: Page): Promise<Clase> {
  return JSON.parse(String(await page.evaluate(`localStorage.getItem(${JSON.stringify(CLAVE_CLASE)})`))) as Clase;
}

export async function ir(page: Page, hash: string): Promise<void> {
  await page.evaluate(`location.hash = ${JSON.stringify(hash)}`);
  await page.wait(350);
}

export async function pulsar(page: Page, selector: string, texto?: string): Promise<void> {
  await page.evaluate(`(() => {
    const lista = [...document.querySelectorAll(${JSON.stringify(selector)})];
    const el = ${texto === undefined ? "lista[0]" : `lista.find((e) => (e.innerText || e.textContent || '').trim().includes(${JSON.stringify(texto)}) || (e.getAttribute('aria-label') || '') === ${JSON.stringify(texto)})`};
    if (!el) throw new Error('No encuentro ' + ${JSON.stringify(`${selector} ${texto ?? ""}`)});
    el.click();
  })()`);
  await page.wait(120);
}

export async function entrarProfesor(page: Page): Promise<void> {
  await ir(page, "#/profesor");
  const creando = String(await page.evaluate("document.querySelector('h1').innerText")).includes("Crea");
  for (let vez = 0; vez < (creando ? 2 : 1); vez += 1) {
    for (const d of PIN) await pulsar(page, ".tecla", d);
    await page.wait(250);
  }
  await page.wait(350);
}

// Responde a la pregunta en pantalla, acertando o fallando a propósito.
export async function responderPantalla(page: Page, p: Pregunta, acertar: boolean): Promise<void> {
  if (p.formato === "numero") {
    const valor = acertar ? p.respuestaCorrecta : String((Number(p.respuestaCorrecta.replace(",", ".").split("/")[0]) || 0) + 1);
    for (const c of valor) await pulsar(page, ".tecla", c === "," ? "Coma" : c === "/" ? "Barra de fracción" : c);
    await pulsar(page, "form.numero button[type=submit]");
  } else {
    const o = (p.opciones ?? []).find((x) => esCorrecta(p, x.id) === acertar);
    if (o === undefined) throw new Error("Sin opción");
    await pulsar(page, "button.opcion", o.texto);
  }
  await page.wait(120);
}

export async function siguiente(page: Page): Promise<void> {
  await pulsar(page, ".respuesta .boton");
  await page.wait(200);
}

// Hace un test entero desde la pantalla; `acierta` decide por subhabilidad.
export async function hacerTest(page: Page, alumnoId: string, testId: string, acierta: (p: Pregunta) => boolean, alCadaPregunta?: (p: Pregunta) => Promise<void>): Promise<number> {
  let vistas = 0;
  for (;;) {
    const hayPausa = String(await page.evaluate("document.querySelector('.tarea') ? '' : (document.querySelector('h1')?.innerText ?? '')"));
    if (hayPausa.includes("terminado")) return vistas;
    if (hayPausa.includes("descansar") || hayPausa.includes("primera parte")) {
      await pulsar(page, "button.boton-principal", "Seguir");
      continue;
    }
    const c = await clase(page);
    const p = preguntaActual(c, alumnoId, testId);
    if (p === null) return vistas;
    await alCadaPregunta?.(p);
    await responderPantalla(page, p, acierta(p));
    await siguiente(page);
    vistas += 1;
  }
}
