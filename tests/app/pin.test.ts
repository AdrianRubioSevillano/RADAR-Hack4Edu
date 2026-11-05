import { describe, expect, it } from "vitest";
import { estadoInicialPin, eventoDeTecla, pasoPin, type EstadoPin, type EventoPin } from "../../src/services/pinFlujo.ts";

function teclear(estado: EstadoPin, pin: string) {
  let actual = estado;
  let accion = null as ReturnType<typeof pasoPin>["accion"];
  for (const digito of pin) {
    const paso = pasoPin(actual, { tipo: "digito", digito });
    actual = paso.estado;
    accion = paso.accion;
  }
  return { estado: actual, accion };
}

describe("flujo del PIN", () => {
  it("crear: al repetir, los círculos se van rellenando y si coincide se guarda", () => {
    const primero = teclear(estadoInicialPin(false), "1234");
    expect(primero.estado).toMatchObject({ primero: "1234", digitos: "" });
    expect(primero.accion).toBeNull();
    expect(teclear(primero.estado, "12").estado.digitos).toBe("12");
    expect(teclear(primero.estado, "1234").accion).toEqual({ tipo: "guardar", pin: "1234" });
  });

  it("crear: si no coincide, avisa y vuelve a empezar", () => {
    const { estado, accion } = teclear(teclear(estadoInicialPin(false), "1234").estado, "9999");
    expect(accion).toBeNull();
    expect(estado).toMatchObject({ primero: null, digitos: "", mensaje: "pin.noCoinciden" });
    expect(teclear(estado, "1").estado.mensaje).toBeNull();
  });

  it("escribir: comprueba el PIN y, si es incorrecto, avisa y limpia", () => {
    const { estado, accion } = teclear(estadoInicialPin(true), "4321");
    expect(accion).toEqual({ tipo: "comprobar", pin: "4321" });
    expect(pasoPin(estado, { tipo: "incorrecto" }).estado).toMatchObject({ digitos: "", mensaje: "pin.incorrecto" });
  });

  it("borrar quita el último dígito y no pasa de 4", () => {
    const tres = teclear(estadoInicialPin(true), "123").estado;
    expect(pasoPin(tres, { tipo: "borrar" }).estado.digitos).toBe("12");
    const cuatro = teclear(estadoInicialPin(true), "1234").estado;
    expect(pasoPin(cuatro, { tipo: "digito", digito: "5" }).estado.digitos).toBe("1234");
    expect(pasoPin(estadoInicialPin(true), { tipo: "borrar" }).estado.digitos).toBe("");
  });

  it("el teclado físico produce los mismos eventos: números y Retroceso", () => {
    const esperado: EventoPin = { tipo: "digito", digito: "7" };
    expect(eventoDeTecla("7")).toEqual(esperado);
    expect(eventoDeTecla("Backspace")).toEqual({ tipo: "borrar" });
    expect(eventoDeTecla("a")).toBeNull();
    expect(eventoDeTecla("Enter")).toBeNull();
    expect(eventoDeTecla("Tab")).toBeNull();
  });
});
