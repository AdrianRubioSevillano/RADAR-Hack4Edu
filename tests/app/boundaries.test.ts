import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function filesIn(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return filesIn(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

const APP = [...filesIn("src/services"), ...filesIn("src/components"), ...filesIn("src/screens"), "src/App.tsx", "src/main.tsx"];
const VIEWS = APP.filter((file) => !file.startsWith("src/services"));
const read = (file: string) => readFileSync(file, "utf8");

describe("fronteras de la aplicación", () => {
  it("solo demoClass.ts importa la simulación", () => {
    const importers = APP.filter((file) => /from\s+["'][^"']*simulation\//.test(read(file)));
    expect(importers).toEqual(["src/services/demoClass.ts"]);
  });

  it("del benchmark solo se importan tipos: nunca se ejecuta", () => {
    for (const file of APP) {
      const text = read(file);
      expect(text, file).not.toMatch(/\brunBenchmark\b/);
      for (const [statement, source] of text.matchAll(/import\b[^;]*?from\s+["']([^"']+)["']/g))
        if (source?.includes("benchmarks/")) expect(statement, file).toMatch(/^import type/);
    }
  });

  it("la verdad simulada no aparece fuera de la frontera", () => {
    for (const file of APP)
      expect(read(file), file).not.toMatch(/trueMastery|groupId|ResponseUniformTable|realParameters|postClass/);
  });

  it("sin aleatoriedad ni servicios externos", () => {
    for (const file of APP) {
      const text = read(file);
      expect(text, file).not.toMatch(/Math\.random/);
      expect(text, file).not.toMatch(/https?:\/\//);
    }
  });

  it("las pantallas no llaman al motor directamente", () => {
    const engineCalls = /\b(rankInterventions|compareInterventionPlans|getClassDiagnostic|selectNextQuestion|submitAnswer|marginals|binaryEntropy)\(/;
    for (const file of VIEWS) expect(read(file), file).not.toMatch(engineCalls);
    for (const file of VIEWS)
      expect(read(file), file).not.toMatch(/from\s+["'][^"']*\/engine\//);
  });

  it("no hay un segundo motor ni restos del provisional", () => {
    const pkg = read("package.json");
    expect(pkg).not.toContain("pnpm");
    expect(() => statSync("vendor")).toThrow();
  });

  it("no usa etiquetas clínicas ni promete eficacia", () => {
    for (const file of APP) {
      const text = read(file).toLowerCase();
      expect(text, file).not.toMatch(/tdah|dislexia/);
      expect(text, file).not.toMatch(/necesidades resueltas|alumnos beneficiados|aprendizaje conseguido/);
    }
  });
});
