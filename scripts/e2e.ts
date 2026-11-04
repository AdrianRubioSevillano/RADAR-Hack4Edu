// Prueba extremo a extremo en Chrome real, sobre el build de producción.
// Uso: npm run build && npm run preview, y en otra terminal: npm run e2e
import { writeFileSync } from "node:fs";
import { RADAR_QUESTION_BANK } from "../src/services/engine.ts";
import { withChrome, type Page } from "./cdp.ts";

const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const results: { name: string; ok: boolean; detail?: string }[] = [];

function check(name: string, ok: boolean, detail?: unknown) {
  const info = String(detail).slice(0, 300);
  results.push({ name, ok, ...(ok ? {} : { detail: info }) });
  console.log(`${ok ? "ok  " : "FALLA"} ${name}${ok ? "" : ` -> ${info}`}`);
}

const SET_VALUE = `(el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el, v); el.dispatchEvent(new Event('input',{bubbles:true})); }`;

await withChrome(async (page: Page) => {
  page.base = BASE;
  const text = async () => String(await page.evaluate("document.querySelector('main').innerText"));
  const q = async (selector: string) => Number(await page.evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`));
  const clickText = async (selector: string, label: string) =>
    page.evaluate(`(() => { const el=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.innerText.includes(${JSON.stringify(label)})); if(!el) throw new Error('sin ' + ${JSON.stringify(label)}); el.click(); })()`);
  const nav = async (hash: string) => {
    await page.evaluate(`location.hash = '#/${hash}'`);
    await page.wait(500);
  };
  const stored = async () => JSON.parse(String(await page.evaluate("localStorage.getItem('radar.session.v1')"))) as {
    states: Record<string, { responses: unknown[] }>;
    origins: Record<string, { manual: number; simulated: number }>;
    practice: Record<string, unknown>;
  };
  const press = async (key: string, code = key, vk = 0, text?: string) => {
    await page.send("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, ...(text === undefined ? {} : { text }) });
    await page.send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    await page.wait(70);
  };
  const tab = () => press("Tab", "Tab", 9);
  const enter = () => press("Enter", "Enter", 13, "\r");
  const space = () => press(" ", "Space", 32, " ");
  const active = async () => String(await page.evaluate("(document.activeElement?.tagName||'') + '|' + (document.activeElement?.className||'') + '|' + (document.activeElement?.innerText||'').slice(0,40)"));

  const errors: string[] = [];
  page.onEvent((method, params) => {
    if (method === "Runtime.exceptionThrown") errors.push(JSON.stringify(params).slice(0, 200));
    if (method === "Runtime.consoleAPICalled" && (params as { type?: string }).type === "error") errors.push(JSON.stringify(params).slice(0, 200));
  });

  await page.viewport(1440, 900, false);
  await page.go("clase");
  await page.evaluate("localStorage.clear()");
  await page.go("clase");

  // --- Sin respuestas ---
  check("arranque: 30 pupitres sintéticos", (await q(".seat")) === 30);
  check("arranque: marca de datos sintéticos visible", (await text()).includes("Todos los datos son sintéticos"));
  await nav("docente");
  check("sin respuestas: el radar no muestra el prior", (await text()).includes("Aún no hay evidencia") && !(await text()).includes("50 %"));
  await nav("planes");
  check("sin respuestas: ranking hipotético y planes vacíos", (await text()).includes("Cálculo hipotético") && (await text()).includes("Ninguna competencia programada"));
  await nav("actividades");
  check("sin respuestas: no hay actividades", (await text()).includes("no tiene competencias"));
  await nav("practica");
  check("sin respuestas: la práctica pide diagnóstico", (await text()).includes("primero hace falta el diagnóstico"));
  check("el informe del benchmark no se ha descargado todavía", !(await page.evaluate("performance.getEntriesByType('resource').some(r=>r.name.includes('RESULTADOS'))")));

  // --- Simulación ---
  await nav("clase");
  await clickText("button", "Simular respuestas");
  await page.wait(120);
  const responsive = await page.evaluate("new Promise(r => { const t=performance.now(); setTimeout(()=>r(performance.now()-t), 0); })");
  check("simulación: la interfaz sigue respondiendo", Number(responsive) < 400, responsive);
  for (let i = 0; i < 60 && (await q("progress")) > 0; i++) await page.wait(200);
  const afterSim = await stored();
  check("simulación: 30 alumnos con 9 respuestas", Object.values(afterSim.states).every((s) => s.responses.length === 9));

  // --- Radar y teclado ---
  await nav("docente");
  check("radar: 30 alumnos dibujados", (await q(".blip")) === 30);
  check("radar: seis sectores manejables", (await q("button.sector-tag")) === 6);
  check("radar: los puntos no atrapan el tabulador", (await q('.blip[tabindex="-1"]')) === 30);
  const firstHeading = String(await page.evaluate("document.querySelector('.radar-side h3').innerText"));
  await page.evaluate("[...document.querySelectorAll('button.sector-tag')].find(b=>!b.classList.contains('active')).focus()");
  await enter();
  await page.wait(120);
  check("radar: un sector se selecciona con teclado", String(await page.evaluate("document.querySelector('.radar-side h3').innerText")) !== firstHeading);

  // --- Planes ---
  await nav("planes");
  const planText = await text();
  check("planes: ambos planes y la matriz por alumno", planText.includes("Plan colectivo") && planText.includes("Plan por necesidad pendiente") && (await q(".matrix tbody tr")) === 30);
  const seen = new Set<string>();
  for (const minutes of ["15", "30", "45", "60", "90"]) {
    await clickText("button.preset", minutes);
    await page.wait(160);
    const relation = String(await page.evaluate("document.querySelector('.route-relation').innerText"));
    seen.add(relation);
  }
  check("planes: hay presupuestos con planes distintos e iguales", seen.has("≠") && seen.has("="), [...seen]);
  await clickText("button.preset", "30");
  await page.wait(160);
  const colBefore = String(await page.evaluate("[...document.querySelectorAll('.matrix thead th.col-on')].map(t=>t.title).join()"));
  await page.evaluate("document.querySelectorAll('input[name=active-plan]')[1].click()");
  await page.wait(200);
  check("planes: cambiar el plan activo cambia lo pendiente", String(await page.evaluate("[...document.querySelectorAll('.matrix thead th.col-on')].map(t=>t.title).join()")) !== colBefore);
  check("planes: el plan B queda guardado", String(await page.evaluate("JSON.parse(localStorage.getItem('radar.session.v1')).activePlan")) === "pendingNeed");
  await page.evaluate(`(${SET_VALUE})(document.querySelector('.budget-number input'), 'abc')`);
  await page.wait(120);
  check("planes: un presupuesto que no es un número se explica", (await text()).includes("Escribe los minutos disponibles"));
  await page.evaluate(`(${SET_VALUE})(document.querySelector('.budget-number input'), '0.01')`);
  await page.wait(200);
  check("planes: un presupuesto no representable se explica sin romper", (await text()).includes("No se puede calcular"));
  await page.evaluate(`(${SET_VALUE})(document.querySelector('.budget-number input'), '30')`);
  await page.wait(200);
  check("planes: se recupera al corregir el presupuesto", (await q(".route-card")) === 2);

  // --- Actividades ---
  await nav("actividades");
  check("actividades: dos bloques con 30 minutos", (await q(".agenda > li")) === 2);
  check("actividades: avisa de la falta de revisión docente", (await text()).includes("sin revisión docente"));

  // --- Diagnóstico manual ---
  await page.evaluate("location.hash='#/clase'");
  await page.wait(400);
  await page.evaluate("document.querySelector('.seat').click()");
  await page.wait(700);
  await clickText("button", "Reiniciar");
  await page.wait(60);
  await page.evaluate("[...document.querySelectorAll('button')].find(b=>b.innerText.includes('Seguro')).click()");
  await page.wait(300);
  check("diagnóstico: reiniciar deja al alumno sin respuestas", (await stored()).states.S01?.responses.length === 0);
  const bankText = (id: string) => RADAR_QUESTION_BANK.questions.find((item) => item.statement === id);
  let leak = false;
  let invalidShown = false;
  let keyboardRound = false;
  for (let i = 0; i < 8; i++) {
    const statement = String(await page.evaluate("document.querySelector('.statement').innerText"));
    const item = bankText(statement);
    if (item === undefined) throw new Error(`Enunciado desconocido: ${statement}`);
    const html = String(await page.evaluate("document.querySelector('main').innerHTML"));
    if (html.includes(item.explanation)) leak = true;
    if (item.format === "numeric") {
      await page.evaluate("document.querySelector('#numeric-answer').focus()");
      if (!invalidShown) {
        for (const ch of "1,5") await press(ch, ch, 0, ch);
        await enter();
        await page.wait(100);
        invalidShown = (await text()).includes("Escribe un entero o una fracción");
        check("diagnóstico: entrada no válida con mensaje y sin perder estado", invalidShown && (await stored()).states.S01?.responses.length === i);
        await page.evaluate(`(${SET_VALUE})(document.querySelector('#numeric-answer'), '')`);
      }
      const answer = item.correctAnswer.replace(/\/1$/, "");
      for (const ch of answer) await press(ch, ch, 0, ch);
      await enter();
    } else if (!keyboardRound) {
      // Recorrido completo solo con teclado: foco en la opción, espacio y enviar.
      await page.evaluate("document.querySelector('.statement').focus()");
      await tab();
      const first = await active();
      await space();
      await page.wait(80);
      const chosen = await q(".choice.on");
      await tab();
      const onSend = await active();
      await enter();
      await page.wait(200);
      keyboardRound = true;
      check("teclado: opción con tabulador y espacio", first.startsWith("INPUT") && chosen === 1, `${first} ${chosen}`);
      check("teclado: el envío es el siguiente foco", onSend.includes("Enviar"), onSend);
    } else {
      await page.evaluate("document.querySelector('.choice input').click()");
      await page.wait(50);
      await page.evaluate("document.querySelector('form button.btn-primary').click()");
    }
    await page.wait(220);
    const feedback = await active();
    if (i === 0 || feedback.includes("Siguiente") === false) check(`corrección ${i}: el botón siguiente recibe el foco`, feedback.includes("Siguiente"), feedback);
    await enter();
    await page.wait(180);
    const focused = await active();
    if (!focused.includes("statement")) check(`siguiente ${i}: el foco va a la pregunta`, false, focused);
  }
  check("diagnóstico: no hay explicación visible antes de responder", !leak);
  const manual = await stored();
  check("diagnóstico: 8 respuestas manuales sin repetición", manual.origins.S01?.manual === 8 && manual.states.S01?.responses.length === 8);

  // --- Práctica ---
  await nav("practica");
  check("práctica: sin necesidad medida no se inventan ejercicios", (await text()).includes("No se asignan ejercicios"));
  const practiceStudent = await page.evaluate(`(async () => {
    const select = document.querySelector('.field select');
    for (const option of [...select.options].slice(1)) {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(select, option.value);
      select.dispatchEvent(new Event('change',{bubbles:true}));
      await new Promise(r => setTimeout(r, 120));
      if (document.querySelector('form .statement')) return option.value;
    }
    return null;
  })()`);
  const statesBefore = JSON.stringify((await stored()).states);
  check("práctica: propone un ejercicio a quien lo necesita", practiceStudent !== null);
  await clickText("button", "Pedir pista");
  await page.wait(120);
  check("práctica: la pista aparece", (await q(".hints li")) === 1);
  const practiceStatement = String(await page.evaluate("document.querySelector('.statement').innerText"));
  await clickText("button", "Ver solución");
  await page.wait(150);
  check("práctica: la solución solo sale a petición", (await text()).includes("Solución:"));
  await clickText("button", "Siguiente ejercicio");
  await page.wait(250);
  check("práctica: pistas y soluciones no tocan el diagnóstico", JSON.stringify((await stored()).states) === statesBefore);
  check("práctica: queda registro separado", (await stored()).practice[String(practiceStudent)] !== undefined, practiceStatement);

  // --- Banco agotado ---
  await nav("clase");
  await page.evaluate(`(() => { const s=document.querySelector('select'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'30'); s.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  await page.wait(100);
  await clickText("button", "Simular respuestas");
  await page.wait(300);
  for (let i = 0; i < 150 && (await q("progress")) > 0; i++) await page.wait(200);
  await nav("diagnostico");
  check("banco agotado: fin sin error ni pregunta", (await text()).includes("Ya no quedan preguntas") && (await q("form .statement")) === 0);
  await nav("benchmark");
  await page.wait(900);

  // --- Benchmark ---
  check("benchmark: se descarga solo al entrar", Boolean(await page.evaluate("performance.getEntriesByType('resource').some(r=>r.name.includes('RESULTADOS_BENCHMARK'))")));
  check("benchmark: tres escenarios en el mosaico", (await q(".mosaic")) === 3);
  check("benchmark: pérdidas y empates visibles", (await q(".mosaic .cell-favorsA")) > 0 && (await q(".mosaic .cell-includesZero")) > 0);
  const bench = await text();
  check("benchmark: procedencia y límites", bench.includes("docs/engine/RESULTADOS_BENCHMARK.json") && bench.includes("no demuestra equivalencia") && bench.includes("No valida planes"));

  // --- Persistencia y datos corruptos ---
  await page.go("diagnostico");
  check("persistencia: recargar conserva las respuestas", (await text()).includes("Ya no quedan preguntas"));
  await page.evaluate("localStorage.setItem('radar.session.v1','{roto')");
  await page.go("clase");
  check("datos corruptos: aviso y demo limpia", (await text()).includes("no eran válidos") && (await stored()).states.S01?.responses.length === 0);

  // --- Clase vacía ---
  await clickText("button", "Probar con clase vacía");
  await page.wait(200);
  for (const route of ["docente", "planes", "actividades", "diagnostico", "practica"]) {
    await nav(route);
    check(`clase vacía: ${route} lo explica`, (await text()).includes("No hay alumnos"), await text());
  }
  await nav("clase");
  await clickText("button", "Restaurar los 30 alumnos");
  await page.wait(200);
  check("clase vacía: se restaura", (await q(".seat")) === 30);

  // --- Preferencias ---
  await page.evaluate("document.querySelector('.top-actions .btn').focus()");
  await enter();
  await page.wait(200);
  check("preferencias: se abren con teclado como diálogo modal", Boolean(await page.evaluate("document.querySelector('dialog').open")));
  await page.evaluate("[...document.querySelectorAll('dialog label')].find(l=>l.innerText.includes('Muy grande')).querySelector('input').click()");
  await page.evaluate("[...document.querySelectorAll('dialog label')].find(l=>l.innerText==='Alto').querySelector('input').click()");
  await page.evaluate("[...document.querySelectorAll('dialog label')].find(l=>l.innerText.includes('Una pregunta por pantalla')).querySelector('input').click()");
  await page.evaluate("[...document.querySelectorAll('dialog label')].find(l=>l.innerText.includes('Reducir distracciones')).querySelector('input').click()");
  await page.evaluate("[...document.querySelectorAll('dialog label')].find(l=>l.innerText.includes('Lectura en voz alta')).querySelector('input').click()");
  await page.wait(150);
  check("preferencias: tamaño y contraste se aplican", String(await page.evaluate("document.documentElement.dataset.text + document.documentElement.dataset.contrast")) === "xlargehigh");
  await press("Escape", "Escape", 27);
  await page.wait(200);
  check("preferencias: Escape cierra y el foco vuelve al botón", !(await page.evaluate("document.querySelector('dialog').open")) && (await active()).includes("btn"), await active());
  await page.evaluate("document.querySelector('.seat').click()");
  await page.wait(700);
  check("una pregunta por pantalla: sin paneles alrededor", (await q(".teacher-peek")) === 0 && (await q(".quest-stage")) === 1);
  check("reducir distracciones: sin mascota", String(await page.evaluate("getComputedStyle(document.querySelector('.mascot')).display")) === "none");
  await page.evaluate("Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true}); 0");
  await clickText("button", "Leer en voz alta");
  await page.wait(150);
  check("voz: sin síntesis hay alternativa y el texto sigue", (await text()).includes("no está disponible"));
  await page.evaluate("localStorage.removeItem('radar.preferences.v1')");

  // --- Reinicio total ---
  await page.go("clase");
  await clickText("button", "Reiniciar la demo");
  await page.wait(60);
  await page.evaluate("[...document.querySelectorAll('button')].find(b=>b.innerText.includes('Seguro')).click()");
  await page.wait(300);
  check("reinicio: la demo vuelve al inicio", Object.values((await stored()).states).every((s) => s.responses.length === 0));

  // --- Adaptación ---
  const seed = String(await page.evaluate("localStorage.getItem('radar.session.v1')"));
  await clickText("button", "Simular respuestas");
  await page.wait(300);
  for (let i = 0; i < 60 && (await q("progress")) > 0; i++) await page.wait(200);
  void seed;
  for (const [label, width, height, mobile] of [["móvil 390", 390, 844, true], ["móvil 320", 320, 640, true], ["tableta 768", 768, 1024, true]] as const) {
    await page.viewport(width, height, mobile);
    for (const route of ["clase", "docente", "planes", "actividades", "benchmark", "diagnostico", "practica"]) {
      await page.go(route);
      const overflow = Number(await page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth"));
      check(`${label}: ${route} sin desbordamiento horizontal`, overflow <= 0, overflow);
    }
    check(`${label}: barra inferior visible`, String(await page.evaluate("getComputedStyle(document.querySelector('.tabbar')).display")) !== "none");
    const small = String(await page.evaluate("[...document.querySelectorAll('.tabbar a,.btn,.preset')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height<44).map(e=>e.innerText).join('|')"));
    check(`${label}: controles de al menos 44 px`, small === "", small);
  }
  await page.viewport(1280, 800, false);
  await page.evaluate("localStorage.setItem('radar.preferences.v1', JSON.stringify({textSize:'xlarge',spacing:'wide',contrast:'standard',legibleFont:true,onePerScreen:false,reduceDistractions:false,readAloud:false}))");
  for (const route of ["clase", "docente", "planes", "diagnostico"]) {
    await page.go(route);
    const overflow = Number(await page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth"));
    check(`texto muy grande y espaciado: ${route} sin desbordar`, overflow <= 0, overflow);
  }
  await page.evaluate("localStorage.clear()");
  check("sin errores en la consola durante toda la prueba", errors.length === 0, errors.slice(0, 3).join(" || "));
});

const failed = results.filter((r) => !r.ok);
writeFileSync("docs/app/E2E.json", `${JSON.stringify({ total: results.length, failed: failed.length, results }, null, 2)}\n`);
console.log(`\n${results.length - failed.length} de ${results.length} comprobaciones superadas`);
process.exit(failed.length === 0 ? 0 : 1);
