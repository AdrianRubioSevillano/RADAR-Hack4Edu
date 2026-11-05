// Rutas por hash. Las del profesor no se abren sin PIN.
export type Ruta =
  | { readonly nombre: "inicio" }
  | { readonly nombre: "acerca" }
  | { readonly nombre: "alumnos" }
  | { readonly nombre: "alumno"; readonly alumnoId: string }
  | { readonly nombre: "test"; readonly alumnoId: string; readonly testId: string }
  | { readonly nombre: "practica"; readonly alumnoId: string; readonly testId: string; readonly subId: string }
  | { readonly nombre: "profesor" }
  | { readonly nombre: "ajustes" }
  | { readonly nombre: "detalle"; readonly alumnoId: string }
  | { readonly nombre: "pin"; readonly destino: string };

const INICIO: Ruta = { nombre: "inicio" };

export function leerRuta(hash: string): Ruta {
  const partes = hash.replace(/^#\/?/, "").split("/").filter((p) => p !== "").map(decodeURIComponent);
  const [a, b, c, d, e] = partes;
  if (a === undefined) return INICIO;
  if (a === "acerca") return { nombre: "acerca" };
  if (a === "alumno") {
    if (b === undefined) return { nombre: "alumnos" };
    if (c === undefined) return { nombre: "alumno", alumnoId: b };
    if (c === "test" && d !== undefined) return { nombre: "test", alumnoId: b, testId: d };
    if (c === "practica" && d !== undefined && e !== undefined) return { nombre: "practica", alumnoId: b, testId: d, subId: e };
    return INICIO;
  }
  if (a === "profesor") {
    if (b === undefined) return { nombre: "profesor" };
    if (b === "ajustes") return { nombre: "ajustes" };
    if (b === "alumno" && c !== undefined) return { nombre: "detalle", alumnoId: c };
    return INICIO;
  }
  return INICIO;
}

export function esRutaProfesor(ruta: Ruta): boolean {
  return ruta.nombre === "profesor" || ruta.nombre === "ajustes" || ruta.nombre === "detalle";
}

// Entrar como alumno cierra la sesión del profesor: la tablet pasa a manos del alumno.
export function cierraSesionProfesor(ruta: Ruta): boolean {
  return ruta.nombre === "alumnos" || ruta.nombre === "alumno" || ruta.nombre === "test" || ruta.nombre === "practica";
}

// Sin PIN, una ruta de profesor siempre se convierte en la pantalla del PIN.
export function rutaPermitida(ruta: Ruta, profesorDesbloqueado: boolean, hash: string): Ruta {
  return esRutaProfesor(ruta) && !profesorDesbloqueado ? { nombre: "pin", destino: hash } : ruta;
}

export function enlace(...partes: readonly string[]): string {
  return `#/${partes.map(encodeURIComponent).join("/")}`;
}
