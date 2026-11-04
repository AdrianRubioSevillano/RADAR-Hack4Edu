import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEMO_SEED,
  DEMO_STUDENT_COUNT,
  createDemoClass,
  type DemoClassHandle,
} from "../services/demoClass.ts";
import { describeEngineError } from "../services/errors.ts";
import {
  browserStorage,
  clearSession,
  loadSession,
  saveSession,
} from "../services/persistence.ts";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  preferenceAttributes,
  savePreferences,
  type Preferences,
} from "../services/preferences.ts";
import {
  createSession,
  orderedStates,
  recordManualAnswer,
  resetStudent as resetStudentState,
  selectStudent as selectStudentState,
  setActivePlan as setActivePlanState,
  setAvailableMinutes,
  simulateStudentUpTo,
  updatePractice,
  type ActivePlan,
  type ClassSession,
  type PracticeRecord,
} from "../services/session.ts";
import {
  analyzePlans,
  classDiagnosticOf,
  type PlanAnalysis,
} from "../services/teacher.ts";
import type { AnswerFailure } from "../services/diagnostic.ts";
import type { ClassDiagnostic, Result } from "../services/engine.ts";

export interface SimulationProgress {
  readonly done: number;
  readonly total: number;
}

interface RadarValue {
  readonly session: ClassSession;
  readonly isEmptyClass: boolean;
  readonly notice: string | null;
  readonly canPersist: boolean;
  readonly progress: SimulationProgress | null;
  readonly simulationError: string | null;
  readonly diagnostic: ClassDiagnostic;
  readonly plans: PlanAnalysis;
  answer(
    studentId: string,
    questionId: string,
    answer: string,
  ): Result<ClassSession, AnswerFailure>;
  simulate(target: number, studentCount: number): void;
  cancelSimulation(): void;
  resetStudent(studentId: string): void;
  resetAll(): void;
  setEmptyClass(empty: boolean): void;
  selectStudent(studentId: string): void;
  setMinutes(minutes: number): void;
  setActivePlan(plan: ActivePlan): void;
  recordPractice(
    studentId: string,
    exerciseId: string,
    change: (record: PracticeRecord) => PracticeRecord,
  ): void;
  dismissNotice(): void;
}

const RadarContext = createContext<RadarValue | null>(null);

export function useRadar(): RadarValue {
  const value = useContext(RadarContext);
  if (value === null) throw new Error("Falta RadarProvider");
  return value;
}

const fullClass: DemoClassHandle = createDemoClass(
  DEMO_SEED,
  DEMO_STUDENT_COUNT,
);
const emptyClass: DemoClassHandle = createDemoClass(DEMO_SEED, 0);

function initialSession(): { session: ClassSession; notice: string | null } {
  const loaded = loadSession(browserStorage(), fullClass);
  if (loaded.status === "restored")
    return { session: loaded.session, notice: null };
  return {
    session: createSession(fullClass),
    notice:
      loaded.status === "discarded"
        ? `Los datos guardados no eran válidos (${loaded.reason}) y se han descartado. La demo empieza de nuevo.`
        : null,
  };
}

export function RadarProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(initialSession);
  const [session, setSession] = useState(initial.session);
  const [notice, setNotice] = useState(initial.notice);
  const [isEmptyClass, setIsEmptyClass] = useState(false);
  const [canPersist, setCanPersist] = useState(true);
  const [progress, setProgress] = useState<SimulationProgress | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const run = useRef(0);

  // La clase vacía es una prueba transitoria: no sustituye a lo guardado.
  useEffect(() => {
    if (!isEmptyClass) setCanPersist(saveSession(browserStorage(), session));
  }, [session, isEmptyClass]);

  const handle = isEmptyClass ? emptyClass : fullClass;

  const answer = useCallback(
    (studentId: string, questionId: string, value: string) => {
      const result = recordManualAnswer(
        sessionRef.current,
        studentId,
        questionId,
        value,
      );
      if (result.ok) {
        sessionRef.current = result.value;
        setSession(result.value);
      }
      return result;
    },
    [],
  );

  // Por turnos, cediendo el hilo entre alumnos para no bloquear la interfaz.
  const simulate = useCallback(
    (target: number, studentCount: number) => {
      const id = ++run.current;
      const students = sessionRef.current.students.slice(0, studentCount);
      setSimulationError(null);
      setProgress({ done: 0, total: students.length });
      const step = (index: number) => {
        if (run.current !== id) return;
        const student = students[index];
        if (student === undefined) {
          setProgress(null);
          return;
        }
        try {
          const next = simulateStudentUpTo(
            sessionRef.current,
            handle,
            student.studentId,
            target,
          );
          sessionRef.current = next;
          setSession(next);
          setProgress({ done: index + 1, total: students.length });
          setTimeout(() => step(index + 1), 0);
        } catch (error) {
          setProgress(null);
          setSimulationError(describeEngineError(error));
        }
      };
      setTimeout(() => step(0), 0);
    },
    [handle],
  );

  const cancelSimulation = useCallback(() => {
    run.current += 1;
    setProgress(null);
  }, []);

  const replace = useCallback((next: ClassSession) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const resetAll = useCallback(() => {
    run.current += 1;
    setProgress(null);
    setSimulationError(null);
    clearSession(browserStorage());
    setIsEmptyClass(false);
    replace(createSession(fullClass));
  }, [replace]);

  const setEmptyClass = useCallback(
    (empty: boolean) => {
      run.current += 1;
      setProgress(null);
      setIsEmptyClass(empty);
      replace(
        empty
          ? createSession(emptyClass)
          : (() => {
              const loaded = loadSession(browserStorage(), fullClass);
              return loaded.status === "restored"
                ? loaded.session
                : createSession(fullClass);
            })(),
      );
    },
    [replace],
  );

  const states = useMemo(() => orderedStates(session), [session]);
  const diagnostic = useMemo(() => classDiagnosticOf(states), [states]);
  const plans = useMemo(
    () => analyzePlans(diagnostic, session.availableMinutes),
    [diagnostic, session.availableMinutes],
  );

  const value: RadarValue = {
    session,
    isEmptyClass,
    notice,
    canPersist,
    progress,
    simulationError,
    diagnostic,
    plans,
    answer,
    simulate,
    cancelSimulation,
    resetStudent: (id) => replace(resetStudentState(sessionRef.current, id)),
    resetAll,
    setEmptyClass,
    selectStudent: (id) => replace(selectStudentState(sessionRef.current, id)),
    setMinutes: (m) => replace(setAvailableMinutes(sessionRef.current, m)),
    setActivePlan: (p) => replace(setActivePlanState(sessionRef.current, p)),
    recordPractice: (studentId, exerciseId, change) =>
      replace(updatePractice(sessionRef.current, studentId, exerciseId, change)),
    dismissNotice: () => setNotice(null),
  };

  return (
    <RadarContext.Provider value={value}>{children}</RadarContext.Provider>
  );
}

interface PreferencesValue {
  readonly preferences: Preferences;
  update(change: Partial<Preferences>): void;
  reset(): void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function usePreferences(): PreferencesValue {
  const value = useContext(PreferencesContext);
  if (value === null) throw new Error("Falta PreferencesProvider");
  return value;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(() =>
    loadPreferences(browserStorage()),
  );
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(
      preferenceAttributes(preferences),
    ))
      root.setAttribute(name, value);
    savePreferences(browserStorage(), preferences);
  }, [preferences]);
  const value = useMemo<PreferencesValue>(
    () => ({
      preferences,
      update: (change) => setPreferences((p) => ({ ...p, ...change })),
      reset: () => setPreferences(DEFAULT_PREFERENCES),
    }),
    [preferences],
  );
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
