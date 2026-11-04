// Frontera con la simulación. Es el ÚNICO módulo de la aplicación que importa
// src/simulation. La clase sintética y sus uniformes quedan en este cierre léxico:
// hacia fuera solo salen ids, nombres ficticios y respuestas observables.
import {
  createResponseUniforms,
  createSyntheticClass,
  observableStudents,
  simulateResponse,
} from "../simulation/index.ts";
import {
  KNOWLEDGE_GRAPH,
  RADAR_QUESTION_BANK,
  selectNextQuestion,
} from "./engine.ts";
import type { DiagnosticState } from "./engine.ts";

// Semilla fija de la demo: misma clase en cada carga.
export const DEMO_SEED = 42;
export const DEMO_STUDENT_COUNT = 30;

export interface DemoStudent {
  readonly studentId: string;
  readonly displayName: string;
}

export interface DemoClassHandle {
  readonly seed: number;
  readonly students: readonly DemoStudent[];
  // Siguiente pregunta adaptativa y su respuesta sintética; null si no quedan.
  nextSimulatedAnswer(
    state: DiagnosticState,
  ): { readonly questionId: string; readonly answer: string } | null;
}

export function createDemoClass(
  seed: number = DEMO_SEED,
  studentCount: number = DEMO_STUDENT_COUNT,
): DemoClassHandle {
  const syntheticClass = createSyntheticClass(
    seed,
    studentCount,
    KNOWLEDGE_GRAPH,
  );
  const students = observableStudents(syntheticClass);
  const uniforms = createResponseUniforms(
    syntheticClass.seed,
    students.map((student) => student.studentId),
    RADAR_QUESTION_BANK.questions.map((question) => question.id),
    "pretest",
  );
  return {
    seed,
    students,
    nextSimulatedAnswer(state) {
      const selection = selectNextQuestion(state, RADAR_QUESTION_BANK);
      if (selection === null) return null;
      return {
        questionId: selection.question.id,
        answer: simulateResponse(
          syntheticClass,
          state.studentId,
          selection.question,
          uniforms,
        ),
      };
    },
  };
}
