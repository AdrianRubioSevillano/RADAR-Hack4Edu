// Actividades colectivas para las competencias de un plan. Contenido propio de la
// aplicación, SIN REVISIÓN DOCENTE. El motor prioriza; no genera ni evalúa actividades.
import {
  RADAR_QUESTION_BANK,
  type ClassDiagnostic,
  type InterventionPlan,
  type InterventionRanking,
  type SkillId,
} from "./engine.ts";
import { PRACTICE_TEMPLATES } from "./practiceBank.ts";
import { skillName } from "./teacher.ts";

export const COLLECTIVE_EXERCISES = 3;

interface ActivityTemplate {
  readonly title: string;
  readonly goal: string;
  readonly steps: readonly string[];
}

export const ACTIVITY_TEMPLATES: Readonly<
  Record<SkillId, ActivityTemplate | undefined>
> = {
  OPS: {
    title: "Cálculo por partes en la pizarra",
    goal: "Explicar en voz alta cómo se descompone una operación.",
    steps: [
      "Resolver una operación en común, descomponiéndola por partes.",
      "Por parejas, resolver los ejercicios y comprobar con la operación inversa.",
      "Poner en común dos procedimientos distintos para el mismo cálculo.",
    ],
  },
  NEG: {
    title: "Recta numérica colectiva",
    goal: "Relacionar las operaciones con enteros con desplazamientos en la recta.",
    steps: [
      "Dibujar una recta numérica y representar una suma y una resta con negativos.",
      "Por parejas, predecir el signo del resultado antes de calcular.",
      "Comentar por qué restar un negativo equivale a sumar su opuesto.",
    ],
  },
  FRA: {
    title: "Fracciones equivalentes en común",
    goal: "Justificar cuándo hace falta un denominador común.",
    steps: [
      "Representar dos fracciones con un dibujo y buscar una forma equivalente.",
      "Por parejas, resolver los ejercicios y simplificar el resultado.",
      "Comparar las estrategias de suma y de producto de fracciones.",
    ],
  },
  JER: {
    title: "¿Qué operación va primero?",
    goal: "Decidir el orden de las operaciones antes de calcular.",
    steps: [
      "Marcar en común la primera operación de una expresión.",
      "Por parejas, escribir el orden de los pasos antes de calcular.",
      "Comparar el resultado con el de operar de izquierda a derecha.",
    ],
  },
  ALG: {
    title: "Agrupar términos semejantes",
    goal: "Distinguir qué términos se pueden agrupar y por qué.",
    steps: [
      "Clasificar en común términos en x y números sueltos.",
      "Por parejas, simplificar los ejercicios explicando cada paso.",
      "Comprobar una simplificación dando un valor a x en las dos expresiones.",
    ],
  },
  ECU: {
    title: "La balanza de la ecuación",
    goal: "Mantener la igualdad al transformar una ecuación.",
    steps: [
      "Representar una ecuación como balanza y resolverla en común.",
      "Por parejas, resolver los ejercicios anotando la operación de cada paso.",
      "Sustituir la solución en la ecuación para comprobarla.",
    ],
  },
};

// Errores típicos declarados en el banco. Son hipótesis del banco, no errores observados.
function typicalErrors(skill: SkillId): string[] {
  const found = RADAR_QUESTION_BANK.questions.flatMap((question) =>
    question.primarySkill === skill && question.format === "multipleChoice"
      ? question.options.flatMap((option) =>
          option.misconception === null ? [] : [option.misconception],
        )
      : [],
  );
  return [...new Set(found)].slice(0, 3);
}

export interface CollectiveActivity {
  readonly skill: SkillId;
  readonly skillName: string;
  readonly durationMinutes: number;
  readonly activity: ActivityTemplate | null;
  readonly exercises: readonly {
    readonly id: string;
    readonly statement: string;
    readonly answer: string;
  }[];
  readonly typicalErrors: readonly string[];
  readonly belowThresholdCount: number | null;
  readonly warnings: readonly string[];
  readonly shortage: string | null;
}

export function collectiveActivities(
  plan: InterventionPlan,
  diagnostic: ClassDiagnostic,
  ranking: InterventionRanking,
): CollectiveActivity[] {
  return plan.interventions.map((item) => {
    const activity = ACTIVITY_TEMPLATES[item.skill] ?? null;
    const exercises = PRACTICE_TEMPLATES.filter((t) => t.skill === item.skill)
      .slice()
      .sort((a, b) => b.difficulty - a.difficulty || (a.id < b.id ? -1 : 1))
      .slice(0, COLLECTIVE_EXERCISES)
      .reverse()
      .map(({ id, statement, answer }) => ({ id, statement, answer }));
    const shortage =
      activity === null
        ? `No hay actividad preparada para ${skillName(item.skill)}.`
        : exercises.length < COLLECTIVE_EXERCISES
          ? `Solo hay ${exercises.length} de ${COLLECTIVE_EXERCISES} ejercicios para esta actividad.`
          : null;
    return {
      skill: item.skill,
      skillName: skillName(item.skill),
      durationMinutes: item.durationMinutes,
      activity,
      exercises,
      typicalErrors: typicalErrors(item.skill),
      belowThresholdCount:
        diagnostic.skills.find((s) => s.skill === item.skill)?.belowTauCount ??
        null,
      warnings: ranking.warnings
        .filter((warning) => warning.skill === item.skill)
        .map((warning) => warning.message),
      shortage,
    };
  });
}
