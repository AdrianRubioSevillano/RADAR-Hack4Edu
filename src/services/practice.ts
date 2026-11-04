// Práctica individual. Separada del diagnóstico: aquí no se llama a submitAnswer
// ni se toca DiagnosticState. Elegir ejercicios corresponde a la aplicación; el
// motor solo informa de la necesidad pendiente.
import { bankQuestion, observedBySkill } from "./diagnostic.ts";
import {
  KNOWLEDGE_GRAPH,
  normalizeRational,
  type DiagnosticState,
  type Difficulty,
  type SkillId,
  type StudentPendingNeed,
} from "./engine.ts";
import {
  PRACTICE_TEMPLATES,
  SKILL_HINTS,
  type TemplateExercise,
} from "./practiceBank.ts";
import type { PracticeRecord } from "./session.ts";
import { skillName } from "./teacher.ts";

// SUPUESTOS no calibrados de la selección de práctica.
export const PRACTICE_PER_STUDENT = 4;
export const PRACTICE_NEED_THRESHOLD = 0.3;

export type PracticeSource = "diagnosticRepeat" | "template";

export interface PublicExercise {
  readonly id: string;
  readonly skill: SkillId;
  readonly skillName: string;
  readonly source: PracticeSource;
  readonly difficulty: Difficulty;
  readonly statement: string;
  readonly format: "multipleChoice" | "numeric";
  readonly options: readonly { id: string; text: string }[];
  readonly hints: readonly string[];
}

export interface PracticeSolution {
  readonly answerText: string;
  readonly explanation: string;
}

function templateExercise(template: TemplateExercise): PublicExercise {
  return {
    id: template.id,
    skill: template.skill,
    skillName: skillName(template.skill),
    source: "template",
    difficulty: template.difficulty,
    statement: template.statement,
    format: "numeric",
    options: [],
    hints: SKILL_HINTS[template.skill] ?? [],
  };
}

function repeatExercise(questionId: string): PublicExercise | null {
  const question = bankQuestion(questionId);
  if (question === undefined) return null;
  return {
    id: question.id,
    skill: question.primarySkill,
    skillName: skillName(question.primarySkill),
    source: "diagnosticRepeat",
    difficulty: question.difficulty,
    statement: question.statement,
    format: question.format,
    options:
      question.format === "multipleChoice"
        ? question.options.map(({ id, text }) => ({ id, text }))
        : [],
    hints: SKILL_HINTS[question.primarySkill] ?? [],
  };
}

// Candidatas de una competencia. Primero las preguntas que el alumno ya falló y
// después plantillas, de fácil a difícil. Las preguntas del banco que el alumno
// aún no ha visto no se usan: quedan reservadas para que el diagnóstico siga valiendo.
function candidatesFor(
  skill: SkillId,
  state: DiagnosticState,
  log: Readonly<Record<string, PracticeRecord>>,
): PublicExercise[] {
  const repeats = state.responses.flatMap((response) => {
    if (response.isCorrect) return [];
    const exercise = repeatExercise(response.questionId);
    return exercise !== null && exercise.skill === skill ? [exercise] : [];
  });
  const templates = PRACTICE_TEMPLATES.filter((t) => t.skill === skill)
    .slice()
    .sort((a, b) => a.difficulty - b.difficulty || (a.id < b.id ? -1 : 1))
    .map(templateExercise);
  return [...repeats, ...templates].filter(
    (exercise) => log[exercise.id]?.solved !== true,
  );
}

export type PracticeReason = "pendingAfterPlan" | "scheduledInPlan";

export interface PracticeSkillTarget {
  readonly skill: SkillId;
  readonly name: string;
  readonly need: number;
  readonly pending: number | null;
  readonly reason: PracticeReason;
}

export type PracticeSelection =
  | { readonly status: "needsDiagnostic"; readonly message: string }
  | { readonly status: "unavailable"; readonly message: string }
  | {
      readonly status: "ready";
      readonly targets: readonly PracticeSkillTarget[];
      readonly exercises: readonly PublicExercise[];
      readonly requested: number;
      // Competencias que no se eligen porque el alumno no tiene evidencia en ellas.
      readonly unmeasured: readonly { id: SkillId; name: string }[];
      readonly shortage: string | null;
      readonly message: string | null;
    };

export function selectPractice(
  state: DiagnosticState,
  need: StudentPendingNeed | null,
  log: Readonly<Record<string, PracticeRecord>>,
  requested: number = PRACTICE_PER_STUDENT,
): PracticeSelection {
  if (state.responses.length === 0)
    return {
      status: "needsDiagnostic",
      message:
        "Este alumno aún no tiene respuestas. Su estimación es solo el prior del modelo: primero hace falta el diagnóstico.",
    };
  if (need === null || need.pending === null)
    return {
      status: "unavailable",
      message:
        "No hay índice de necesidad pendiente para este alumno, así que no se eligen ejercicios.",
    };

  const observed = observedBySkill(state);
  const measured = need.skills.filter(
    (skill) => (observed[skill.skill] ?? 0) > 0,
  );
  const unmeasured = need.skills
    .filter((skill) => (observed[skill.skill] ?? 0) === 0)
    .map((skill) => ({ id: skill.skill, name: skillName(skill.skill) }));
  const order = new Map(KNOWLEDGE_GRAPH.nodes.map((n, i) => [n.id, i] as const));
  const position = (skill: SkillId) => order.get(skill) ?? 0;

  const relevant = measured.filter(
    (skill) => skill.need >= PRACTICE_NEED_THRESHOLD,
  );
  const pending = relevant
    .filter((skill) => !skill.isScheduled)
    .sort(
      (a, b) =>
        (b.pending ?? 0) - (a.pending ?? 0) ||
        position(a.skill) - position(b.skill),
    );
  const scheduled = relevant
    .filter((skill) => skill.isScheduled)
    .sort((a, b) => b.need - a.need || position(a.skill) - position(b.skill));

  // Lo programado ya se trabaja en grupo: solo se usa para completar la práctica.
  const targets: PracticeSkillTarget[] = [
    ...pending.map((skill) => ({
      skill: skill.skill,
      name: skillName(skill.skill),
      need: skill.need,
      pending: skill.pending,
      reason: "pendingAfterPlan" as const,
    })),
    ...scheduled.map((skill) => ({
      skill: skill.skill,
      name: skillName(skill.skill),
      need: skill.need,
      pending: skill.pending,
      reason: "scheduledInPlan" as const,
    })),
  ];

  if (targets.length === 0)
    return {
      status: "ready",
      targets,
      exercises: [],
      requested,
      unmeasured,
      shortage: null,
      message:
        "Con las respuestas actuales, ninguna competencia medida supera el umbral de necesidad estimada. No se asignan ejercicios.",
    };

  // Reparto por turnos, de mayor a menor necesidad pendiente.
  const queues = targets.map((target) =>
    candidatesFor(target.skill, state, log),
  );
  const exercises: PublicExercise[] = [];
  while (
    exercises.length < requested &&
    queues.some((queue) => queue.length > 0)
  ) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next !== undefined && exercises.length < requested)
        exercises.push(next);
    }
  }

  return {
    status: "ready",
    targets,
    exercises,
    requested,
    unmeasured,
    shortage:
      exercises.length < requested
        ? `Solo hay ${exercises.length} de ${requested} ejercicios adecuados sin resolver para estas competencias.`
        : null,
    message: null,
  };
}

function solutionOf(exerciseId: string): PracticeSolution & {
  readonly format: "multipleChoice" | "numeric";
  readonly correct: string;
} {
  const template = PRACTICE_TEMPLATES.find((t) => t.id === exerciseId);
  if (template !== undefined)
    return {
      format: "numeric",
      correct: template.answer,
      answerText: template.answer,
      explanation: template.method,
    };
  const question = bankQuestion(exerciseId);
  if (question === undefined)
    throw new Error(`Ejercicio desconocido: ${exerciseId}`);
  if (question.format === "numeric")
    return {
      format: "numeric",
      correct: question.correctAnswer,
      answerText: question.correctAnswer.replace(/\/1$/, ""),
      explanation: question.explanation,
    };
  const option = question.options.find((o) => o.id === question.correctAnswer);
  return {
    format: "multipleChoice",
    correct: question.correctAnswer,
    answerText: option?.text ?? question.correctAnswer,
    explanation: question.explanation,
  };
}

export type PracticeCheckResult =
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "incorrect" }
  | ({ readonly status: "correct" } & PracticeSolution);

// Corrección de la práctica. No genera evidencia para el modelo.
export function checkPracticeAnswer(
  exerciseId: string,
  answer: string,
): PracticeCheckResult {
  const solution = solutionOf(exerciseId);
  if (solution.format === "multipleChoice") {
    if (answer.trim() === "")
      return { status: "invalid", message: "Elige una opción." };
    return answer === solution.correct
      ? {
          status: "correct",
          answerText: solution.answerText,
          explanation: solution.explanation,
        }
      : { status: "incorrect" };
  }
  const given = normalizeRational(answer);
  if (!given.ok)
    return {
      status: "invalid",
      message:
        given.error === "ZERO_DENOMINATOR"
          ? "El denominador no puede ser 0."
          : "Escribe un entero o una fracción, por ejemplo 5 o 3/4.",
    };
  const expected = normalizeRational(solution.correct);
  return expected.ok && given.value === expected.value
    ? {
        status: "correct",
        answerText: solution.answerText,
        explanation: solution.explanation,
      }
    : { status: "incorrect" };
}

// Solo tras pedirla expresamente.
export function revealPracticeSolution(exerciseId: string): PracticeSolution {
  const { answerText, explanation } = solutionOf(exerciseId);
  return { answerText, explanation };
}
