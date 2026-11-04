// Capturas y auditoría axe en Chrome real. Uso: node scripts/capturas.ts [url-base]
// Requiere el servidor en marcha (npm run preview).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createDemoClass } from "../src/services/demoClass.ts";
import { createSession, simulateStudentUpTo } from "../src/services/session.ts";
import { withChrome, type Page } from "./cdp.ts";

const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const OUT = "docs/capturas";
const AXE = readFileSync("node_modules/axe-core/axe.min.js", "utf8");

function seeded(target: number): string {
  const handle = createDemoClass();
  let session = createSession(handle);
  for (const { studentId } of handle.students)
    session = simulateStudentUpTo(session, handle, studentId, target);
  return JSON.stringify({ ...session, activeStudentId: "S07" });
}

async function shot(page: Page, name: string, full = false) {
  const out = await page.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: full });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(String(out.data), "base64"));
}

async function axe(page: Page, name: string, report: unknown[]) {
  await page.evaluate(`window.axe || eval(${JSON.stringify(AXE)})`);
  const value = (await page.evaluate(
    `axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] }).then(r => ({
      passes: r.passes.length,
      incomplete: r.incomplete.map(v => v.id),
      violations: r.violations.map(v => ({ id: v.id, impact: v.impact, count: v.nodes.length, sample: v.nodes.slice(0,3).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary||'').split('\\n').slice(1,2).join('').trim().slice(0,110)) }))
    }))`,
  )) as { passes: number; incomplete: string[]; violations: { id: string; impact: string; count: number; sample: string[] }[] };
  report.push({ screen: name, ...value });
  console.log(`axe ${name}: ${value.violations.length} incumplidas, ${value.passes} superadas`);
  for (const v of value.violations) console.log(`  [${v.impact}] ${v.id} x${v.count}: ${v.sample[0]}`);
}

await withChrome(async (page) => {
  mkdirSync(OUT, { recursive: true });
  page.base = BASE;
  const report: unknown[] = [];
  const session = seeded(12);
  const seed = () => page.evaluate(`localStorage.clear(); localStorage.setItem('radar.session.v1', ${JSON.stringify(session)})`);
  const pick = (id: string) => `[...document.querySelectorAll('.choice input')][${id}]?.click()`;

  for (const device of [
    { tag: "escritorio", width: 1440, height: 900, mobile: false },
    { tag: "movil", width: 390, height: 844, mobile: true },
  ]) {
    await page.viewport(device.width, device.height, device.mobile);
    await page.go("clase");
    await page.evaluate("localStorage.clear()");
    await page.go("clase");
    await shot(page, `${device.tag}-01-clase-sin-respuestas`);
    await axe(page, `${device.tag}/clase-vacia-de-respuestas`, report);
    await seed();
    for (const [index, route, full] of [
      ["02", "clase", false],
      ["03", "docente", false],
      ["04", "planes", false],
      ["05", "actividades", false],
      ["06", "benchmark", false],
      ["07", "diagnostico", false],
      ["08", "practica", false],
    ] as const) {
      await page.go(route);
      await shot(page, `${device.tag}-${index}-${route}`, full);
      await axe(page, `${device.tag}/${route}`, report);
    }
    // Corrección tras responder.
    await page.go("diagnostico");
    await page.evaluate(`${pick("0")}; const n=document.querySelector('#numeric-answer'); if(n){const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; s.call(n,'1'); n.dispatchEvent(new Event('input',{bubbles:true}));} `);
    await page.wait(150);
    await shot(page, `${device.tag}-09-pregunta-elegida`);
    await page.evaluate(`document.querySelector('form button.btn-primary').click()`);
    await page.wait(500);
    await shot(page, `${device.tag}-10-correccion`);
    await axe(page, `${device.tag}/correccion`, report);
    // Preferencias y alto contraste.
    await page.go("planes");
    await page.evaluate(`document.querySelector('.top-actions .btn').click()`);
    await page.wait(300);
    await shot(page, `${device.tag}-11-preferencias`);
    await axe(page, `${device.tag}/preferencias`, report);
    await page.evaluate(`localStorage.setItem('radar.preferences.v1', JSON.stringify({textSize:'large',spacing:'normal',contrast:'high',legibleFont:true,onePerScreen:false,reduceDistractions:false,readAloud:true}))`);
    await page.go("docente");
    await shot(page, `${device.tag}-12-alto-contraste`);
    await axe(page, `${device.tag}/alto-contraste`, report);
    await page.evaluate(`localStorage.removeItem('radar.preferences.v1')`);
    await seed();
  }
  // Páginas completas para revisar el recorrido entero.
  await page.viewport(1440, 900, false);
  for (const route of ["docente", "planes", "benchmark"]) {
    await page.go(route);
    await shot(page, `completa-${route}`, true);
  }
  writeFileSync("docs/app/AXE.json", `${JSON.stringify(report, null, 2)}\n`);
});
process.exit(0);
