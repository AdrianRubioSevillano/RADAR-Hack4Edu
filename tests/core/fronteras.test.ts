import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function archivos(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe("reglas de código", () => {
  it("sin Math.random ni Date en motor y contenido", () => {
    for (const ruta of [...archivos("src/core"), ...archivos("src/content")]) {
      const texto = readFileSync(ruta, "utf8");
      expect(texto, ruta).not.toMatch(/Math\.random\s*\(/);
      expect(texto, ruta).not.toMatch(/\bDate\.now\s*\(|new Date\s*\(/);
    }
  });

  it("el motor no importa contenido ni interfaz", () => {
    for (const ruta of archivos("src/core")) {
      expect(readFileSync(ruta, "utf8"), ruta).not.toMatch(/from "\.\.\/(content|components|screens|services)/);
    }
  });
});
