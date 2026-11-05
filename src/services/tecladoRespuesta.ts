// Teclado físico en las preguntas numéricas, como función pura.
export const LARGO_RESPUESTA = 12;

export type AccionTecla = { readonly tipo: "escribir"; readonly valor: string } | { readonly tipo: "enviar" } | null;

function escribir(valor: string, caracter: string): AccionTecla {
  return { tipo: "escribir", valor: valor.length < LARGO_RESPUESTA ? valor + caracter : valor };
}

// La coma y la barra solo valen si la pregunta las usa. El punto del teclado numérico es la coma.
export function teclaRespuesta(valor: string, tecla: string, extras: readonly string[]): AccionTecla {
  if (/^\d$/.test(tecla)) return escribir(valor, tecla);
  if (tecla === "Backspace") return { tipo: "escribir", valor: valor.slice(0, -1) };
  if (tecla === "Enter") return valor.trim() === "" ? null : { tipo: "enviar" };
  const caracter = tecla === "." ? "," : tecla;
  return extras.includes(caracter) ? escribir(valor, caracter) : null;
}

// Enter sobre un enlace o botón lo activa a él. Las teclas en pantalla son la excepción:
// tras pulsar una, Enter debe comprobar, no repetir el número.
export function enterEsDelControl(objetivo: Pick<Element, "closest"> | null): boolean {
  return objetivo?.closest("a, button:not(.tecla)") != null;
}
