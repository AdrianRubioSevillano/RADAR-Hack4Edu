// Lengua en la que se escribe una pregunta. Los generadores son síncronos: `conLengua`
// la fija solo mientras se genera, y `tx` elige el texto. La lógica y el azar no cambian.
export type Lengua = "es" | "fr";

let actual: Lengua = "es";

export function conLengua<T>(lengua: Lengua, generar: () => T): T {
  const anterior = actual;
  actual = lengua;
  try {
    return generar();
  } finally {
    actual = anterior;
  }
}

export function tx<T>(es: T, fr: T): T {
  return actual === "fr" ? fr : es;
}
