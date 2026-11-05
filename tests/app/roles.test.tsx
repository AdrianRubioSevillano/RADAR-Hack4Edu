import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { comprobarPin, hashPin, hashPinSinCrypto, pinValido } from "../../src/services/pin.ts";
import { crearDemo } from "../../src/services/demo.ts";
import { esRutaProfesor, leerRuta, rutaPermitida } from "../../src/services/rutas.ts";
import { pintar, texto } from "./apoyo.tsx";

const demo = crearDemo();

beforeEach(() => vi.unstubAllGlobals());

describe("rutas y PIN", () => {
  it.each(["#/profesor", "#/profesor/ajustes", "#/profesor/alumno/A01"])("sin PIN, %s lleva a la pantalla del PIN", (hash) => {
    const ruta = leerRuta(hash);
    expect(esRutaProfesor(ruta)).toBe(true);
    expect(rutaPermitida(ruta, false, hash)).toEqual({ nombre: "pin", destino: hash });
    expect(rutaPermitida(ruta, true, hash)).toEqual(ruta);
    const html = texto(pintar(hash, demo));
    expect(html).toContain("Crea tu PIN");
    expect(html).not.toContain("Mañana explica primero");
    expect(html).not.toContain("Alumnos y ayudas");
  });

  it("con PIN creado se pide el PIN, no se crea otro", () => {
    expect(texto(pintar("#/profesor", { ...demo, pinHash: "abc" }))).toContain("Escribe tu PIN");
  });

  it("desbloqueado sí abre Mi clase y Ajustes", () => {
    expect(texto(pintar("#/profesor", demo, true))).toContain("Mañana explica primero");
    expect(texto(pintar("#/profesor/ajustes", demo, true))).toContain("Alumnos y ayudas");
  });

  it("las rutas del alumno no necesitan PIN y una ruta desconocida vuelve al inicio", () => {
    expect(texto(pintar("#/alumno", demo))).toContain("¿Quién eres?");
    expect(leerRuta("#/loquesea")).toEqual({ nombre: "inicio" });
  });

  it("el PIN se guarda con SHA-256, nunca en claro", async () => {
    const esperado = createHash("sha256").update("radar-pin:1234").digest("hex");
    const hash = await hashPin("1234");
    expect(hash).toBe(esperado);
    expect(hash).not.toContain("1234");
    expect(hashPinSinCrypto("1234")).toBe(esperado);
    expect(await comprobarPin("1234", hash)).toBe(true);
    expect(await comprobarPin("1235", hash)).toBe(false);
    expect(await comprobarPin("1234", null)).toBe(false);
  });

  it("el PIN son 4 dígitos", () => {
    expect(pinValido("0042")).toBe(true);
    expect(pinValido("123")).toBe(false);
    expect(pinValido("12a4")).toBe(false);
  });
});
