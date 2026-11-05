// Recorrido real en Chrome sobre el build de producción.
// Uso: npm run build && npm run preview, y en otra terminal: npm run e2e
import { writeFileSync } from "node:fs";
import { ejerciciosDe, miniTestDe, practicasPendientes, recomendacionDe, type Clase } from "../src/services/clase.ts";
import { CLAVE_CLASE } from "../src/services/almacen.ts";
import { clase, entrarProfesor, hacerTest, ir, PIN, pulsar, responderPantalla, siguiente } from "./apoyo-chrome.ts";
import { withChrome, type Page } from "./cdp.ts";

const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const resultados: { nombre: string; ok: boolean; detalle?: string }[] = [];

function comprobar(nombre: string, ok: boolean, detalle?: unknown) {
  const info = String(detalle).slice(0, 300);
  resultados.push({ nombre, ok, ...(ok ? {} : { detalle: info }) });
  console.log(`${ok ? "ok   " : "FALLA"} ${nombre}${ok ? "" : ` -> ${info}`}`);
}

const idDe = (c: Clase, nombre: string) => c.alumnos.find((a) => a.nombre === nombre)?.id as string;

await withChrome(async (page: Page) => {
  page.base = BASE;
  const texto = async () => String(await page.evaluate("document.body.innerText"));
  const atributo = async (nombre: string) => String(await page.evaluate(`document.documentElement.getAttribute(${JSON.stringify(nombre)})`));
  const celda = async (alumno: string, columna: number) => String(await page.evaluate(`(() => {
    const fila = [...document.querySelectorAll('.cuadricula tbody tr')].find((f) => f.querySelector('th').innerText.includes(${JSON.stringify(alumno)}));
    return fila.querySelectorAll('td')[${columna}].innerText.trim().replace(/\\s+/g, ' ');
  })()`));

  const errores: string[] = [];
  const peticiones: string[] = [];
  page.onEvent((metodo, datos) => {
    if (metodo === "Runtime.exceptionThrown") errores.push(JSON.stringify(datos).slice(0, 240));
    if (metodo === "Runtime.consoleAPICalled" && (datos as { type?: string }).type === "error") errores.push(JSON.stringify(datos).slice(0, 240));
    if (metodo === "Network.requestWillBeSent") peticiones.push((datos as { request: { url: string } }).request.url);
  });
  await page.send("Network.enable");

  await page.viewport(1280, 800, false);
  await page.go("");
  await page.evaluate("localStorage.clear()");
  await page.go("");
  await page.wait(600);

  // --- Inicio y roles ---
  comprobar("inicio: Soy alumno y Soy profesor", (await texto()).includes("Soy alumno") && (await texto()).includes("Soy profesor"));
  await ir(page, "#/profesor/ajustes");
  comprobar("sin PIN no se abren los ajustes", (await texto()).includes("Crea tu PIN") && !(await texto()).includes("Alumnos y ayudas"));

  // --- Profesor crea el PIN y asigna un test ---
  await entrarProfesor(page);
  comprobar("el profesor crea el PIN y entra", (await texto()).includes("Mañana explica primero"));
  const pinHash = (await clase(page)).pinHash ?? "";
  comprobar("el PIN se guarda con hash", pinHash.length === 64 && !pinHash.includes(PIN), pinHash);
  const inicial = recomendacionDe(await clase(page));
  comprobar("demo: recomienda Cambio sencillo", (await texto()).includes("Cambio sencillo"), inicial.subhabilidad);
  await ir(page, "#/profesor/ajustes");
  await pulsar(page, ".casilla", "Multiplicar como suma repetida");
  await page.wait(200);
  comprobar("el profesor asigna un test", (await clase(page)).asignados.includes("NUM2-T5"));
  await pulsar(page, ".barra-salir");
  await page.wait(300);

  // --- Lucía hace el test asignado fallando una subhabilidad ---
  const c0 = await clase(page);
  const lucia = idDe(c0, "Lucía");
  await ir(page, "#/alumno");
  await pulsar(page, "a.nombre", "Lucía");
  await page.wait(300);
  comprobar("Lucía ve sus tests asignados", (await texto()).includes("Multiplicar como suma repetida"));
  await pulsar(page, "a.tarjeta", "Multiplicar como suma repetida");
  await page.wait(400);
  const hechas = await hacerTest(page, lucia, "NUM2-T5", (p) => p.subhabilidad !== "NUM2-T5-c");
  comprobar("el test tiene 10 preguntas", hechas === 10, hechas);
  comprobar("mensaje final sin nota", (await texto()).includes("¡Has terminado") && !/\d+\s*(de|\/)\s*10/.test(await texto()), await texto());
  comprobar("ofrece practicar", (await texto()).includes("Practicar"));

  // --- Amina (dislexia) falla Cambio sencillo ---
  const amina = idDe(c0, "Amina");
  await ir(page, `#/alumno/${amina}`);
  comprobar("dislexia: letra grande", (await atributo("data-letra")) === "grande");
  await pulsar(page, "a.tarjeta", "Dinero");
  await page.wait(400);
  let facilOk = true;
  await hacerTest(page, amina, "NUM2-T3", (p) => p.subhabilidad !== "NUM2-T3-c", async (p) => {
    if (!(await texto()).includes(p.enunciadoFacil)) facilOk = false;
  });
  comprobar("dislexia: todas las preguntas con enunciadoFacil", facilOk);

  // --- Omar (baja visión) ---
  const omar = idDe(c0, "Omar");
  await ir(page, `#/alumno/${omar}`);
  comprobar("baja visión: alto contraste y letra al 150 %", (await atributo("data-contraste")) === "alto" && (await atributo("data-letra")) === "muyGrande");
  const tamano = Number(await page.evaluate("parseFloat(getComputedStyle(document.documentElement).fontSize)"));
  comprobar("baja visión: la letra base es 1,5 veces la normal", Math.abs(tamano / 18 - 1.5) < 0.01, tamano);
  await pulsar(page, "a.tarjeta", "Dinero");
  await page.wait(400);
  await hacerTest(page, omar, "NUM2-T3", (p) => p.subhabilidad !== "NUM2-T3-b");
  await ir(page, "#/");
  await page.wait(150);
  comprobar("al salir del alumno se retiran sus ayudas", (await atributo("data-contraste")) === "normal");

  // --- El profesor ve el rojo y la recomendación, entrando con el teclado físico ---
  await ir(page, "#/profesor");
  for (const d of PIN) {
    await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: d, text: d, code: `Digit${d}`, windowsVirtualKeyCode: 48 + Number(d) });
    await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: d, code: `Digit${d}`, windowsVirtualKeyCode: 48 + Number(d) });
    await page.wait(80);
  }
  await page.wait(500);
  const tras = recomendacionDe(await clase(page));
  comprobar("el profesor vuelve a entrar con su PIN", (await texto()).includes("Mañana explica primero"));
  comprobar("la recomendación sigue a la subhabilidad con más rojos", tras.subhabilidad === "NUM2-T3-c" && tras.rojos > inicial.rojos && (await texto()).includes(`${tras.rojos} de los ${tras.evaluados}`), JSON.stringify(tras).slice(0, 200));
  comprobar("Amina aparece en rojo en Cambio sencillo", (await celda("Amina", 2)).includes("Necesita refuerzo"), await celda("Amina", 2));
  comprobar("Amina en verde en Contar monedas", (await celda("Amina", 0)).includes("Lo domina"), await celda("Amina", 0));
  await pulsar(page, ".cuadricula tbody a", "Amina");
  await page.wait(300);
  comprobar("el detalle del alumno muestra sus ayudas", (await texto()).includes("Dislexia") && (await texto()).includes("Necesita refuerzo"));
  await pulsar(page, ".barra-salir");
  await page.wait(300);

  // --- Amina practica y hace el reto ---
  await ir(page, `#/alumno/${amina}`);
  comprobar("Amina ve sus ejercicios", (await texto()).includes("Tus ejercicios para practicar") && (await texto()).includes("Cambio sencillo"));
  await pulsar(page, "a.tarjeta-practica", "Cambio sencillo");
  await page.wait(400);
  const antes = await clase(page);
  const ejercicios = ejerciciosDe(antes, amina, "NUM2-T3", "NUM2-T3-c");
  comprobar("6 ejercicios de fácil a difícil", ejercicios.map((e) => e.dificultad).join() === "1,1,2,2,3,3");
  await pulsar(page, "button.boton-suave", "Necesito una pista");
  comprobar("la pista aparece", (await texto()).includes(ejercicios[0]?.pista ?? "§"));
  for (const e of ejercicios) {
    await responderPantalla(page, e, true);
    await siguiente(page);
  }
  comprobar("tras los ejercicios viene el reto", (await texto()).includes("reto de 3 preguntas"));
  await pulsar(page, "button.boton-principal", "Empezar el reto");
  await page.wait(300);
  for (const p of miniTestDe(antes, amina, "NUM2-T3", "NUM2-T3-c")) {
    await responderPantalla(page, p, true);
    await siguiente(page);
  }
  comprobar("mensaje de logro al superar el reto", (await texto()).includes("¡Lo has conseguido!"));
  comprobar("ya no tiene esa práctica pendiente", practicasPendientes(await clase(page), amina).length === 0);
  await ir(page, "#/");

  // --- El semáforo se ha actualizado ---
  await entrarProfesor(page);
  comprobar("el semáforo de Amina ya no está en rojo", !(await celda("Amina", 2)).includes("Necesita refuerzo"), await celda("Amina", 2));
  const final = recomendacionDe(await clase(page));
  comprobar("la recomendación descuenta a Amina", final.rojos === tras.rojos - 1 || final.subhabilidad !== tras.subhabilidad, JSON.stringify(final).slice(0, 200));

  // --- Restablecer demo ---
  await ir(page, "#/profesor/ajustes");
  await pulsar(page, ".boton-suave", "Restablecer demo");
  await pulsar(page, ".boton-suave", "Sí, restablecer");
  await page.wait(500);
  const restablecida = await clase(page);
  comprobar("Restablecer demo conserva el PIN y limpia lo demás", restablecida.pinHash === pinHash && restablecida.intentos[amina] === undefined);
  await pulsar(page, ".barra-salir");
  await page.wait(300);

  // --- Teclado ---
  const pulsarTecla = async (key: string, code: string, vk: number, text?: string) => {
    await page.send("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, ...(text === undefined ? {} : { text }) });
    await page.send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    await page.wait(60);
  };
  const tab = () => pulsarTecla("Tab", "Tab", 9);
  const enter = () => pulsarTecla("Enter", "Enter", 13, "\r");
  const activo = async () => String(await page.evaluate("(document.activeElement?.innerText || document.activeElement?.getAttribute('aria-label') || '').trim().slice(0, 40)"));
  const tabHasta = async (buscado: string) => {
    for (let i = 0; i < 60; i += 1) {
      await tab();
      if ((await activo()).includes(buscado)) return true;
    }
    return false;
  };
  await page.go("");
  await page.wait(500);
  comprobar("teclado: se llega a Soy alumno", await tabHasta("Soy alumno"));
  await enter();
  await page.wait(350);
  comprobar("teclado: el foco va al título", String(await page.evaluate("document.activeElement?.id")) === "titulo");
  comprobar("teclado: se elige un nombre", await tabHasta("Lucía"));
  await enter();
  await page.wait(350);
  comprobar("teclado: se abre un test", await tabHasta("Dinero"));
  await enter();
  await page.wait(500);
  const esOpcion = Number(await page.evaluate("document.querySelectorAll('button.opcion').length")) > 0;
  if (esOpcion) {
    comprobar("teclado: se llega a una opción", await (async () => {
      for (let i = 0; i < 12; i += 1) {
        await tab();
        if (String(await page.evaluate("document.activeElement?.className ?? ''")).includes("opcion")) return true;
      }
      return false;
    })());
  } else {
    comprobar("teclado: se escribe el número", await tabHasta("1"));
    await enter();
    await tabHasta("Comprobar");
  }
  await enter();
  await page.wait(350);
  comprobar("teclado: la respuesta recibe el foco", String(await page.evaluate("document.activeElement?.tagName")) === "H2", await page.evaluate("document.activeElement?.tagName"));
  comprobar("teclado: se llega a Siguiente", await tabHasta("Siguiente"));
  const anilloFoco = String(await page.evaluate("getComputedStyle(document.activeElement).outlineStyle"));
  comprobar("teclado: foco visible", anilloFoco !== "none", anilloFoco);

  // --- Red ---
  const externas = peticiones.filter((u) => !u.startsWith(BASE) && !u.startsWith("data:") && !u.startsWith("blob:"));
  comprobar("ninguna petición fuera de la propia app", externas.length === 0, externas.join(" "));
  peticiones.length = 0;
  await ir(page, "#/alumno");
  await pulsar(page, "a.nombre", "Bruno");
  await page.wait(500);
  comprobar("en ejecución no se hace ninguna petición de red", peticiones.filter((u) => !u.startsWith("data:")).length === 0, peticiones.join(" "));

  // --- Sin conexión ---
  await page.wait(800);
  await page.evaluate("navigator.serviceWorker.ready.then(() => true)");
  await page.send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await page.go("");
  await page.wait(800);
  comprobar("sin conexión la app sigue funcionando", (await texto()).includes("Soy alumno"), await texto());
  await page.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  comprobar("sin errores en la consola", errores.filter((e) => !e.includes("ERR_INTERNET_DISCONNECTED")).length === 0, errores.join("\n"));
  await page.evaluate(`localStorage.removeItem(${JSON.stringify(CLAVE_CLASE)})`);
});

writeFileSync("docs/E2E_V2.json", `${JSON.stringify(resultados, null, 1)}\n`);
const fallos = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - fallos.length} de ${resultados.length} comprobaciones superadas`);
if (fallos.length > 0) process.exitCode = 1;
