// Estado de la clase y sus transiciones. Funciones puras: cada una devuelve una clase
// nueva. Las pantallas no calculan nada: leen de aquí.
import { aplicarMiniTest, iniciarTest, responder, resultado, siguienteItem, testTerminado, type EstadoTest, type ResultadoHabilidad } from "../core/test.ts";
import { recomendar, type EstadoAlumno, type EstadoSubhabilidad, type Recomendacion } from "../core/recomendacion.ts";
import { derivarSemilla } from "../core/rng.ts";
import type { Color } from "../core/tipos.ts";
import { bancoDeTest, indiceHabilidad, itemDe, miniTest, paqueteDePractica, subhabilidadDe } from "../content/bancos.ts";
import { SUBHABILIDADES, subhabilidadPorId } from "../content/temario.ts";
import { testPorId, testsDe, type DefinicionTest } from "../content/tests.ts";
import type { Lengua } from "../content/lengua.ts";
import type { Curso, Pregunta } from "../content/tipos.ts";

export const VERSION_CLASE = 2;

export const AYUDAS = ["dislexia", "tdah", "bajaVision", "auditiva"] as const;
export type Ayuda = (typeof AYUDAS)[number];

export interface Alumno {
  readonly id: string;
  readonly nombre: string;
  readonly avatar: number;
  readonly ayudas: readonly Ayuda[];
}

export interface Refuerzo {
  readonly subhabilidad: string;
  readonly habilidad: number;
  readonly ronda: number; // cada ronda trae ejercicios nuevos
  readonly hechos: number; // ejercicios del paquete ya terminados
  readonly superado: boolean; // el mini-test lo ha sacado del rojo
}

export interface Intento {
  readonly testId: string;
  readonly semilla: number;
  readonly estado: EstadoTest;
  readonly terminado: boolean;
  readonly secuencia: number; // orden entre intentos: el más reciente manda
  readonly refuerzos: Readonly<Record<string, Refuerzo>>;
  // Lengua en que se empezó: un test no cambia a medias, porque las respuestas guardadas
  // apuntan a sus preguntas. Sin este campo, en español.
  readonly idioma?: Lengua;
}

export interface Clase {
  readonly version: number;
  readonly semilla: number;
  readonly curso: Curso;
  readonly alumnos: readonly Alumno[];
  readonly asignados: readonly string[];
  readonly intentos: Readonly<Record<string, Readonly<Record<string, Intento>>>>;
  readonly secuencia: number;
  readonly pinHash: string | null;
}

export function claseVacia(semilla: number, curso: Curso): Clase {
  return { version: VERSION_CLASE, semilla, curso, alumnos: [], asignados: [], intentos: {}, secuencia: 0, pinHash: null };
}

export function alumnoPorId(clase: Clase, id: string): Alumno | undefined {
  return clase.alumnos.find((a) => a.id === id);
}

function intentoDe(clase: Clase, alumnoId: string, testId: string): Intento | undefined {
  return clase.intentos[alumnoId]?.[testId];
}

function conIntento(clase: Clase, alumnoId: string, intento: Intento): Clase {
  return {
    ...clase,
    secuencia: Math.max(clase.secuencia, intento.secuencia),
    intentos: { ...clase.intentos, [alumnoId]: { ...clase.intentos[alumnoId], [intento.testId]: intento } },
  };
}

function definicion(testId: string): DefinicionTest {
  const test = testPorId(testId);
  if (test === undefined) throw new Error(`Test desconocido: ${testId}`);
  return test;
}

// ---------- Tests del alumno ----------
export type EstadoAsignacion = "pendiente" | "enCurso" | "hecho";

export interface TestAsignado {
  readonly test: DefinicionTest;
  readonly estado: EstadoAsignacion;
  readonly respondidas: number;
}

export function testsDeAlumno(clase: Clase, alumnoId: string): readonly TestAsignado[] {
  return clase.asignados.flatMap((testId) => {
    const test = testPorId(testId);
    if (test === undefined || test.curso !== clase.curso) return [];
    const intento = intentoDe(clase, alumnoId, testId);
    const estado: EstadoAsignacion = intento === undefined ? "pendiente" : intento.terminado ? "hecho" : "enCurso";
    return [{ test, estado, respondidas: intento?.estado.respuestas.length ?? 0 }];
  });
}

export function empezarTest(clase: Clase, alumnoId: string, testId: string, idioma: string = "es"): Clase {
  if (intentoDe(clase, alumnoId, testId) !== undefined) return clase;
  const test = definicion(testId);
  const intento: Intento = {
    testId,
    semilla: derivarSemilla(clase.semilla, `intento/${alumnoId}/${testId}`),
    estado: iniciarTest({ k: test.habilidades.length, totalPreguntas: test.preguntas }),
    terminado: false,
    secuencia: clase.secuencia + 1,
    refuerzos: {},
    ...(idioma === "fr" || idioma === "gn" ? { idioma } : {}),
  };
  return conIntento(clase, alumnoId, intento);
}

// El banco se reconstruye desde la semilla; se guarda en memoria para no repetir trabajo.
const CACHE_BANCOS = new Map<string, readonly Pregunta[]>();

function bancoDe(test: DefinicionTest, semilla: number, idioma: Lengua = "es"): readonly Pregunta[] {
  const clave = `${test.id}/${semilla}/${idioma}`;
  const guardado = CACHE_BANCOS.get(clave);
  if (guardado !== undefined) return guardado;
  const banco = bancoDeTest(test, semilla, idioma);
  if (CACHE_BANCOS.size > 40) CACHE_BANCOS.clear();
  CACHE_BANCOS.set(clave, banco);
  return banco;
}

export function preguntaActual(clase: Clase, alumnoId: string, testId: string): Pregunta | null {
  const intento = intentoDe(clase, alumnoId, testId);
  if (intento === undefined || intento.terminado) return null;
  const test = definicion(testId);
  const items = bancoDe(test, intento.semilla, intento.idioma).map((p) => itemDe(test, p));
  return siguienteItem(intento.estado, items)?.pregunta ?? null;
}

// Refuerzos que nacen del resultado: en un test de tema, cada subhabilidad en rojo; en
// uno mezclado, en cada tema en rojo, la subhabilidad con menos aciertos (la anterior si empatan).
function subhabilidadMasDebil(intento: Intento, test: DefinicionTest, habilidad: number): string {
  const subs = test.habilidades[habilidad]?.subhabilidades ?? [];
  const proporcion = (sub: string): number => {
    const propias = intento.estado.respuestas.filter((r) => subhabilidadDe(r.itemId) === sub);
    return propias.length === 0 ? 1 : propias.filter((r) => r.acierto).length / propias.length;
  };
  return [...subs].sort((a, b) => proporcion(a) - proporcion(b))[0] ?? (subs[0] as string);
}

function refuerzosDe(intento: Intento, test: DefinicionTest): Readonly<Record<string, Refuerzo>> {
  const entradas = resultado(intento.estado)
    .filter((r) => r.color === "rojo")
    .map((r): [string, Refuerzo] => {
      const subhabilidad = subhabilidadMasDebil(intento, test, r.habilidad);
      return [subhabilidad, { subhabilidad, habilidad: r.habilidad, ronda: 0, hechos: 0, superado: false }];
    });
  return Object.fromEntries(entradas);
}

export function registrarRespuesta(clase: Clase, alumnoId: string, testId: string, pregunta: Pregunta, acierto: boolean): Clase {
  const intento = intentoDe(clase, alumnoId, testId);
  if (intento === undefined) throw new Error("Test sin empezar");
  const test = definicion(testId);
  const estado = responder(intento.estado, itemDe(test, pregunta), acierto);
  const terminado = testTerminado(estado);
  const actualizado: Intento = { ...intento, estado, terminado, secuencia: terminado ? clase.secuencia + 1 : intento.secuencia };
  return conIntento(clase, alumnoId, terminado ? { ...actualizado, refuerzos: refuerzosDe(actualizado, test) } : actualizado);
}

// ---------- Práctica ----------
export interface PracticaPendiente {
  readonly testId: string;
  readonly subhabilidad: string;
  readonly nombre: string;
  readonly hechos: number;
}

export function practicasPendientes(clase: Clase, alumnoId: string): readonly PracticaPendiente[] {
  return Object.values(clase.intentos[alumnoId] ?? {})
    .filter((i) => i.terminado)
    .sort((a, b) => b.secuencia - a.secuencia)
    .flatMap((i) =>
      Object.values(i.refuerzos)
        .filter((r) => !r.superado)
        .map((r) => ({ testId: i.testId, subhabilidad: r.subhabilidad, nombre: subhabilidadPorId(r.subhabilidad)?.nombre ?? r.subhabilidad, hechos: r.hechos })),
    );
}

function refuerzoDe(clase: Clase, alumnoId: string, testId: string, subId: string): { intento: Intento; refuerzo: Refuerzo } {
  const intento = intentoDe(clase, alumnoId, testId);
  const refuerzo = intento?.refuerzos[subId];
  if (intento === undefined || refuerzo === undefined) throw new Error("Refuerzo desconocido");
  return { intento, refuerzo };
}

function vistasDe(intento: Intento, subId: string): readonly Pregunta[] {
  const respondidas = new Set(intento.estado.respuestas.map((r) => r.itemId));
  const test = definicion(intento.testId);
  return bancoDe(test, intento.semilla, intento.idioma).filter((p) => respondidas.has(p.id) && p.subhabilidad === subId);
}

// La práctica sí sigue el idioma actual: no hay respuestas guardadas que dependan de él.
export function ejerciciosDe(clase: Clase, alumnoId: string, testId: string, subId: string, idioma: string = "es"): readonly Pregunta[] {
  const { intento, refuerzo } = refuerzoDe(clase, alumnoId, testId, subId);
  return paqueteDePractica(subId, derivarSemilla(intento.semilla, `practica/${subId}/${refuerzo.ronda}`), vistasDe(intento, subId), idioma);
}

export function miniTestDe(clase: Clase, alumnoId: string, testId: string, subId: string, idioma: string = "es"): readonly Pregunta[] {
  const { intento, refuerzo } = refuerzoDe(clase, alumnoId, testId, subId);
  const vistas = [...vistasDe(intento, subId), ...ejerciciosDe(clase, alumnoId, testId, subId, idioma)];
  return miniTest(subId, derivarSemilla(intento.semilla, `minitest/${subId}/${refuerzo.ronda}`), vistas, idioma);
}

function conRefuerzo(clase: Clase, alumnoId: string, intento: Intento, refuerzo: Refuerzo, extra: Partial<Intento> = {}): Clase {
  return conIntento(clase, alumnoId, { ...intento, ...extra, refuerzos: { ...intento.refuerzos, [refuerzo.subhabilidad]: refuerzo } });
}

export function marcarEjercicioHecho(clase: Clase, alumnoId: string, testId: string, subId: string): Clase {
  const { intento, refuerzo } = refuerzoDe(clase, alumnoId, testId, subId);
  return conRefuerzo(clase, alumnoId, intento, { ...refuerzo, hechos: refuerzo.hechos + 1 });
}

// El mini-test actualiza el semáforo. Si sigue en rojo, habrá otra ronda de ejercicios.
export function registrarMiniTest(clase: Clase, alumnoId: string, testId: string, subId: string, respuestas: readonly { readonly pregunta: Pregunta; readonly acierto: boolean }[]): { clase: Clase; superado: boolean } {
  const { intento, refuerzo } = refuerzoDe(clase, alumnoId, testId, subId);
  const test = definicion(testId);
  const estado = aplicarMiniTest(
    intento.estado,
    refuerzo.habilidad,
    respuestas.map(({ pregunta, acierto }) => ({ item: itemDe(test, pregunta), acierto })),
  );
  const superado = resultado(estado)[refuerzo.habilidad]?.color !== "rojo";
  const nuevo: Refuerzo = superado ? { ...refuerzo, superado: true } : { ...refuerzo, ronda: refuerzo.ronda + 1, hechos: 0 };
  return { clase: conRefuerzo(clase, alumnoId, intento, nuevo, { estado, secuencia: clase.secuencia + 1 }), superado };
}

// ---------- Vista del profesor ----------
const ORDEN_SUB = new Map(SUBHABILIDADES.map((s, i) => [s.id, i]));

function intentosTerminados(clase: Clase, alumnoId: string): readonly Intento[] {
  return Object.values(clase.intentos[alumnoId] ?? {})
    .filter((i) => i.terminado && definicion(i.testId).curso === clase.curso)
    .sort((a, b) => a.secuencia - b.secuencia);
}

// Estado de cada subhabilidad según los intentos terminados; el más reciente manda.
export function estadoDeAlumno(clase: Clase, alumnoId: string): EstadoAlumno {
  const porSub = new Map<string, EstadoSubhabilidad>();
  const intentos = intentosTerminados(clase, alumnoId);
  for (const intento of intentos) {
    const test = definicion(intento.testId);
    for (const r of resultado(intento.estado)) {
      const subs = test.tipo === "tema" ? (test.habilidades[r.habilidad]?.subhabilidades ?? []) : r.color === "rojo" ? [subhabilidadMasDebil(intento, test, r.habilidad)] : [];
      for (const sub of subs) porSub.set(sub, { subhabilidad: sub, orden: ORDEN_SUB.get(sub) ?? 0, p: r.p, color: r.color });
    }
  }
  return { alumnoId, respuestas: intentos.reduce((n, i) => n + i.estado.respuestas.length, 0), subhabilidades: [...porSub.values()] };
}

export function recomendacionDe(clase: Clase): Recomendacion {
  return recomendar(clase.alumnos.map((a) => estadoDeAlumno(clase, a.id)));
}

export interface ColumnaCuadricula {
  readonly testId: string;
  readonly habilidad: number;
  readonly nombre: string;
}

export interface GrupoColumnas {
  readonly testId: string;
  readonly nombre: string;
  readonly columnas: readonly ColumnaCuadricula[];
}

export interface FilaCuadricula {
  readonly alumno: Alumno;
  readonly celdas: readonly (Color | null)[]; // null: aún no lo ha hecho
}

export interface Cuadricula {
  readonly grupos: readonly GrupoColumnas[];
  readonly filas: readonly FilaCuadricula[];
}

export function cuadriculaDe(clase: Clase): Cuadricula {
  const conDatos = new Set(clase.alumnos.flatMap((a) => intentosTerminados(clase, a.id).map((i) => i.testId)));
  const grupos: GrupoColumnas[] = testsDe(clase.curso)
    .filter((t) => conDatos.has(t.id))
    .map((t) => ({
      testId: t.id,
      nombre: t.nombre,
      columnas: t.habilidades.map((h, habilidad) => ({ testId: t.id, habilidad, nombre: h.nombre })),
    }));
  const filas = clase.alumnos.map((alumno) => ({
    alumno,
    celdas: grupos.flatMap((g) =>
      g.columnas.map((c) => {
        const intento = intentoDe(clase, alumno.id, c.testId);
        return intento?.terminado === true ? (resultado(intento.estado)[c.habilidad]?.color ?? null) : null;
      }),
    ),
  }));
  return { grupos, filas };
}

export interface DetalleTest {
  readonly test: DefinicionTest;
  readonly habilidades: readonly (ResultadoHabilidad & { readonly nombre: string })[];
}

export interface DetalleAlumno {
  readonly alumno: Alumno;
  readonly tests: readonly DetalleTest[];
  readonly pendientes: readonly TestAsignado[];
  readonly practicas: readonly PracticaPendiente[];
}

export function detalleDeAlumno(clase: Clase, alumnoId: string): DetalleAlumno | null {
  const alumno = alumnoPorId(clase, alumnoId);
  if (alumno === undefined) return null;
  const tests = [...intentosTerminados(clase, alumnoId)].reverse().map((i) => {
    const test = definicion(i.testId);
    return { test, habilidades: resultado(i.estado).map((r) => ({ ...r, nombre: test.habilidades[r.habilidad]?.nombre ?? "" })) };
  });
  return {
    alumno,
    tests,
    pendientes: testsDeAlumno(clase, alumnoId).filter((t) => t.estado !== "hecho"),
    practicas: practicasPendientes(clase, alumnoId),
  };
}

// ---------- Ajustes ----------
export function cambiarCurso(clase: Clase, curso: Curso): Clase {
  return { ...clase, curso, asignados: clase.asignados.filter((id) => testPorId(id)?.curso === curso) };
}

export function alternarAsignacion(clase: Clase, testId: string): Clase {
  const asignados = clase.asignados.includes(testId) ? clase.asignados.filter((id) => id !== testId) : [...clase.asignados, testId];
  return { ...clase, asignados };
}

export function anadirAlumno(clase: Clase, nombre: string): Clase {
  const limpio = nombre.trim();
  if (limpio === "") return clase;
  const siguiente = clase.alumnos.reduce((m, a) => Math.max(m, Number(a.id.slice(1)) || 0), 0) + 1;
  const id = `A${String(siguiente).padStart(2, "0")}`;
  return { ...clase, alumnos: [...clase.alumnos, { id, nombre: limpio, avatar: siguiente, ayudas: [] }] };
}

export function quitarAlumno(clase: Clase, alumnoId: string): Clase {
  const intentos = Object.fromEntries(Object.entries(clase.intentos).filter(([id]) => id !== alumnoId));
  return { ...clase, alumnos: clase.alumnos.filter((a) => a.id !== alumnoId), intentos };
}

export function alternarAyuda(clase: Clase, alumnoId: string, ayuda: Ayuda): Clase {
  return {
    ...clase,
    alumnos: clase.alumnos.map((a) =>
      a.id !== alumnoId ? a : { ...a, ayudas: a.ayudas.includes(ayuda) ? a.ayudas.filter((x) => x !== ayuda) : AYUDAS.filter((x) => x === ayuda || a.ayudas.includes(x)) },
    ),
  };
}
export { indiceHabilidad };
