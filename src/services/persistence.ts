// Persistencia local mínima. Solo la sesión observable y las preferencias.
import { RADAR_QUESTION_BANK, selectNextQuestion } from "./engine.ts";
import { SESSION_VERSION, type ClassSession } from "./session.ts";
import type { DemoClassHandle } from "./demoClass.ts";

export const SESSION_KEY = "radar.session.v1";

export type KeyValueStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

export type LoadedSession =
  | { readonly status: "empty" }
  | { readonly status: "restored"; readonly session: ClassSession }
  | { readonly status: "discarded"; readonly reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Lo guardado debe corresponder a la clase de la semilla y pasar la validación
// del motor. Si no, se descarta entero: nunca se repara a medias.
function validateStored(
  value: unknown,
  handle: DemoClassHandle,
): ClassSession | string {
  if (!isRecord(value)) return "formato no reconocido";
  if (value.version !== SESSION_VERSION) return "versión distinta";
  if (value.seed !== handle.seed) return "semilla distinta";
  const { students, states, origins, practice } = value;
  if (!Array.isArray(students) || !isRecord(states) || !isRecord(origins))
    return "campos ausentes";
  if (!isRecord(practice)) return "práctica no válida";
  if (students.length !== handle.students.length) return "otra clase";
  if (
    typeof value.availableMinutes !== "number" ||
    !Number.isFinite(value.availableMinutes)
  )
    return "presupuesto no válido";
  if (value.activePlan !== "collective" && value.activePlan !== "pendingNeed")
    return "plan activo no válido";
  const session = value as unknown as ClassSession;
  for (const [index, expected] of handle.students.entries()) {
    const stored = session.students[index];
    if (
      stored?.studentId !== expected.studentId ||
      stored.displayName !== expected.displayName
    )
      return "otra clase";
    const state = session.states[expected.studentId];
    const origin = session.origins[expected.studentId];
    if (state === undefined || origin === undefined) return "falta un alumno";
    if (state.studentId !== expected.studentId) return "alumno cambiado";
    try {
      // Valida conjunta e historial contra el banco actual.
      selectNextQuestion(state, RADAR_QUESTION_BANK);
    } catch {
      return "diagnóstico no válido";
    }
  }
  return session;
}

export function loadSession(
  storage: KeyValueStorage | null,
  handle: DemoClassHandle,
): LoadedSession {
  if (storage === null) return { status: "empty" };
  let text: string | null;
  try {
    text = storage.getItem(SESSION_KEY);
  } catch {
    return { status: "empty" };
  }
  if (text === null) return { status: "empty" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { status: "discarded", reason: "JSON no válido" };
  }
  const result = validateStored(parsed, handle);
  return typeof result === "string"
    ? { status: "discarded", reason: result }
    : { status: "restored", session: result };
}

// false si el navegador no deja guardar: la demo sigue funcionando en memoria.
export function saveSession(
  storage: KeyValueStorage | null,
  session: ClassSession,
): boolean {
  if (storage === null) return false;
  try {
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function clearSession(storage: KeyValueStorage | null): void {
  try {
    storage?.removeItem(SESSION_KEY);
  } catch {
    // Nada que limpiar si el almacenamiento no está disponible.
  }
}

export function browserStorage(): KeyValueStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
