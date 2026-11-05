// Lengua en la que se escribe una pregunta. Los generadores son síncronos: `conLengua`
// la fija solo mientras se genera, y `tx` elige el texto. La lógica y el azar no cambian.
export type Lengua = "es" | "fr" | "gn";

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

export function lengua(): Lengua {
  return actual;
}

// Sin texto en guaraní, sale en español: solo NUM2 se genera en esa lengua.
export function tx<T>(es: T, fr: T, gn?: T): T {
  if (actual === "fr") return fr;
  return actual === "gn" && gn !== undefined ? gn : es;
}
