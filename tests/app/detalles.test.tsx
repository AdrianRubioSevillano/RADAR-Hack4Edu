import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CLAVE_CLASE, claseTrasCambio } from "../../src/services/almacen.ts";
import { empezarTest, type Clase } from "../../src/services/clase.ts";
import { crearDemo } from "../../src/services/demo.ts";
import { cierraSesionProfesor, leerRuta, rutaPermitida } from "../../src/services/rutas.ts";
import { enterEsDelControl, teclaRespuesta } from "../../src/services/tecladoRespuesta.ts";
import { tituloPestana } from "../../src/services/titulos.ts";
import { almacenEnMemoria, pintar, texto } from "./apoyo.tsx";

const demo = crearDemo();
const alumno = demo.alumnos[0]?.id as string;
const TEST = "NUM2-T3";

beforeEach(() => vi.unstubAllGlobals());

describe("sesión del profesor", () => {
  it.each(["#/alumno", "#/alumno/A01", "#/alumno/A01/test/NUM2-T3", "#/alumno/A01/practica/NUM2-T3/NUM2-T3-a"])("%s cierra la sesión", (hash) => {
    expect(cierraSesionProfesor(leerRuta(hash))).toBe(true);
  });

  it.each(["#/", "#/acerca", "#/profesor", "#/profesor/ajustes", "#/profesor/alumno/A01"])("%s no la cierra", (hash) => {
    expect(cierraSesionProfesor(leerRuta(hash))).toBe(false);
  });

  it("tras cerrarla, volver al panel pide el PIN", () => {
    expect(rutaPermitida(leerRuta("#/profesor"), false, "#/profesor")).toEqual({ nombre: "pin", destino: "#/profesor" });
  });
});

describe("teclado físico en preguntas numéricas", () => {
  it("escribe números y borra con Retroceso", () => {
    expect(teclaRespuesta("1", "2", [])).toEqual({ tipo: "escribir", valor: "12" });
    expect(teclaRespuesta("12", "Backspace", [])).toEqual({ tipo: "escribir", valor: "1" });
    expect(teclaRespuesta("", "Backspace", [])).toEqual({ tipo: "escribir", valor: "" });
  });

  it("Enter comprueba solo si hay respuesta", () => {
    expect(teclaRespuesta("12", "Enter", [])).toEqual({ tipo: "enviar" });
    expect(teclaRespuesta("", "Enter", [])).toBeNull();
  });

  it("no pasa de 12 caracteres e ignora otras teclas", () => {
    expect(teclaRespuesta("123456789012", "3", [])).toEqual({ tipo: "escribir", valor: "123456789012" });
    expect(teclaRespuesta("1", "a", [])).toBeNull();
    expect(teclaRespuesta("1", "Tab", [])).toBeNull();
  });

  it("coma y barra solo si la pregunta las usa; el punto es la coma", () => {
    expect(teclaRespuesta("1", ",", [])).toBeNull();
    expect(teclaRespuesta("1", ".", [","])).toEqual({ tipo: "escribir", valor: "1," });
    expect(teclaRespuesta("1", "/", ["/"])).toEqual({ tipo: "escribir", valor: "1/" });
  });

  it("Enter sobre un botón o enlace es suyo, salvo en las teclas en pantalla", () => {
    expect(enterEsDelControl({ closest: () => ({}) as Element })).toBe(true);
    expect(enterEsDelControl({ closest: () => null })).toBe(false);
    expect(enterEsDelControl(null)).toBe(false);
  });
});

describe("cambios desde otra pestaña", () => {
  const otra: Clase = { ...demo, curso: 3 };
  const almacen = almacenEnMemoria({ [CLAVE_CLASE]: JSON.stringify(otra) });

  it("se recarga la clase si cambia su clave", () => {
    expect(claseTrasCambio(CLAVE_CLASE, almacen)?.curso).toBe(3);
  });

  it("otras claves, o datos no válidos, no cambian nada", () => {
    expect(claseTrasCambio("otra", almacen)).toBeNull();
    expect(claseTrasCambio(null, almacen)).toBeNull();
    expect(claseTrasCambio(CLAVE_CLASE, almacenEnMemoria({ [CLAVE_CLASE]: "{roto" }))).toBeNull();
  });
});

describe("títulos de pestaña", () => {
  const hash = `#/alumno/${alumno}/test/${TEST}`;

  it("durante el test: Pregunta N y nombre del test", () => {
    const limpia: Clase = { ...demo, intentos: {} };
    const titulo = tituloPestana(leerRuta(hash), empezarTest(limpia, alumno, TEST));
    expect(titulo).toMatch(/^Pregunta 1 · .+/);
  });

  it("antes de empezar nunca dice Preparando", () => {
    expect(tituloPestana(leerRuta(hash), { ...demo, intentos: {} })).not.toContain("Preparando");
  });

  it("el panel es Mi clase, y el PIN solo sale en su pantalla", () => {
    expect(tituloPestana(leerRuta("#/profesor"), demo)).toBe("Mi clase · RADAR");
    expect(tituloPestana({ nombre: "pin", destino: "#/profesor" }, { ...demo, pinHash: null })).toBe("Crea tu PIN · RADAR");
    expect(tituloPestana({ nombre: "pin", destino: "#/profesor" }, { ...demo, pinHash: "abc" })).toBe("Escribe tu PIN · RADAR");
  });
});

describe("detalles de interfaz", () => {
  it("Mi clase explica cómo se forman los grupos", () => {
    expect(texto(pintar("#/profesor", demo, true))).toContain("Cada alumno aparece en el grupo de lo que más necesita.");
  });

  it("en alto contraste, Escuchar tiene borde y texto negros", () => {
    const css = readFileSync("src/styles.css", "utf8");
    expect(css).toMatch(/:root\[data-contraste="alto"\] \.boton-voz \{[^}]*color: #000;[^}]*border-color: #000;/);
  });
});
