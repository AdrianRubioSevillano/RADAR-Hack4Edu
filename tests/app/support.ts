import { createDemoClass } from "../../src/services/demoClass.ts";
import {
  createSession,
  recordManualAnswer,
  simulateStudentUpTo,
  type ClassSession,
} from "../../src/services/session.ts";

export const handle = createDemoClass();

export function simulatedSession(target = 9, count = 30): ClassSession {
  let session = createSession(handle);
  for (const { studentId } of handle.students.slice(0, count))
    session = simulateStudentUpTo(session, handle, studentId, target);
  return session;
}

export function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

export { recordManualAnswer };
