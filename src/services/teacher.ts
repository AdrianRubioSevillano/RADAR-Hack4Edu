// Coordinación de la vista docente. Toda la matemática la hace el motor: aquí solo
// se llama a sus funciones y se preparan textos deterministas a partir de sus métricas.
import {
  KNOWLEDGE_GRAPH,
  compareInterventionPlans,
  getClassDiagnostic,
  rankInterventions,
  type ClassDiagnostic,
  type ComparedPlan,
  type DiagnosticState,
  type InterventionPlanComparison,
  type InterventionRanking,
  type InterventionScore,
  type SkillId,
  type StudentPendingNeed,
} from "./engine.ts";
import { describeEngineError } from "./errors.ts";
import { decimal, percent } from "./format.ts";
import type { DemoStudent } from "./demoClass.ts";
import type { ActivePlan } from "./session.ts";

export function skillName(id: SkillId): string {
  return KNOWLEDGE_GRAPH.nodes.find((node) => node.id === id)?.name ?? id;
}

export function classDiagnosticOf(
  states: readonly DiagnosticState[],
): ClassDiagnostic {
  return getClassDiagnostic(states, KNOWLEDGE_GRAPH);
}

export type PlanAnalysis =
  | {
      readonly ok: true;
      readonly ranking: InterventionRanking;
      readonly comparison: InterventionPlanComparison;
    }
  | { readonly ok: false; readonly message: string };

// Un presupuesto no representable es una entrada del docente, no un fallo.
export function analyzePlans(
  diagnostic: ClassDiagnostic,
  availableMinutes: number,
): PlanAnalysis {
  try {
    return {
      ok: true,
      ranking: rankInterventions(diagnostic, KNOWLEDGE_GRAPH, availableMinutes),
      comparison: compareInterventionPlans(
        diagnostic,
        KNOWLEDGE_GRAPH,
        availableMinutes,
      ),
    };
  } catch (error) {
    return { ok: false, message: describeEngineError(error) };
  }
}

// Lectura del campo de presupuesto. Devuelve null si no es un número de minutos.
export function parseMinutes(text: string): number | null {
  const normalized = text.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function evidenceLabel(diagnostic: ClassDiagnostic): string {
  switch (diagnostic.evidenceStatus) {
    case "emptyClass":
      return "Clase vacía";
    case "priorsOnly":
      return "Sin respuestas: solo prior del modelo";
    case "mixed":
      return "Evidencia parcial: hay alumnos sin respuestas";
    case "allWithResponses":
      return "Todos los alumnos tienen alguna respuesta";
  }
}

export function classSkillRows(diagnostic: ClassDiagnostic) {
  return diagnostic.skills.map((summary) => ({
    ...summary,
    name: skillName(summary.skill),
    prerequisites:
      KNOWLEDGE_GRAPH.nodes.find((node) => node.id === summary.skill)
        ?.prerequisites ?? [],
  }));
}

// Por qué ocupa su posición: solo cita las métricas del propio motor.
export function explainScore(score: InterventionScore): string {
  const { need, preparation, confidence, relevance } = score.components;
  return (
    `Necesidad estimada ${percent(need)}, preparación ${percent(preparation)}, ` +
    `confianza ${percent(confidence)} y relevancia para lo posterior ${percent(relevance)}. ` +
    `Valor neto ${decimal(score.netValue)} tras un coste de ${decimal(score.cost)}.`
  );
}

export const PLAN_LABELS: Readonly<Record<ActivePlan, string>> = {
  collective: "Plan colectivo",
  pendingNeed: "Plan por necesidad pendiente",
};

export function comparedPlan(
  comparison: InterventionPlanComparison,
  plan: ActivePlan,
): ComparedPlan {
  return plan === "collective"
    ? comparison.collectivePlan
    : comparison.pendingNeedPlan;
}

function highestPending(plan: ComparedPlan): StudentPendingNeed | null {
  let best: StudentPendingNeed | null = null;
  for (const student of plan.analysis.students) {
    if (student.pending === null) continue;
    if (best === null || student.pending > (best.pending ?? 0)) best = student;
  }
  return best;
}

export function planSummary(
  plan: ComparedPlan,
  students: readonly DemoStudent[],
) {
  const highest = highestPending(plan);
  return {
    skills: plan.analysis.scheduledSkills.map((id) => ({
      id,
      name: skillName(id),
    })),
    totalMinutes: plan.plan.totalMinutes,
    netValue: plan.plan.netValue,
    meanPending: plan.analysis.meanPending,
    maxPending: plan.analysis.maxPending,
    highestPendingStudent:
      highest === null
        ? null
        : (students.find((s) => s.studentId === highest.studentId)
            ?.displayName ?? highest.studentId),
  };
}

// Texto de la comparación. Nunca dice cuál es mejor: describe en qué difieren.
export function comparisonNarrative(
  comparison: InterventionPlanComparison,
): string {
  if (comparison.basis === "noStudents")
    return "No hay alumnos: no hay planes que comparar.";
  if (comparison.basis === "hypotheticalPriorsOnly")
    return "No hay respuestas: ambos planes quedan vacíos hasta recoger evidencia.";
  const a = comparison.collectivePlan.analysis;
  const b = comparison.pendingNeedPlan.analysis;
  if (comparison.plansCoincide)
    return "Con este presupuesto, los dos criterios eligen las mismas competencias. No se fuerza ninguna diferencia.";
  const onlyA = a.scheduledSkills.filter(
    (id) => !b.scheduledSkills.includes(id),
  );
  const onlyB = b.scheduledSkills.filter(
    (id) => !a.scheduledSkills.includes(id),
  );
  const list = (ids: readonly SkillId[]) =>
    ids.length === 0 ? "ninguna" : ids.map(skillName).join(", ");
  return (
    `Solo en el plan colectivo: ${list(onlyA)}. Solo en el plan por necesidad pendiente: ${list(onlyB)}. ` +
    `Mayor necesidad estimada pendiente de un alumno: ${decimal(a.maxPending)} frente a ${decimal(b.maxPending)}. ` +
    `Son criterios distintos: ninguno se presenta como el mejor ni como el más justo.`
  );
}

export interface PendingRow {
  readonly studentId: string;
  readonly displayName: string;
  readonly responseCount: number;
  readonly basedOnPriorOnly: boolean;
  readonly baseline: number | null;
  readonly pendingCollective: number | null;
  readonly pendingNeed: number | null;
  readonly detail: readonly {
    readonly skill: SkillId;
    readonly name: string;
    readonly need: number;
    readonly collective: "scheduled" | "pending";
    readonly pendingNeed: "scheduled" | "pending";
  }[];
}

// Necesidad pendiente por alumno en los dos planes, de mayor a menor en el plan activo.
export function pendingRows(
  comparison: InterventionPlanComparison,
  students: readonly DemoStudent[],
  activePlan: ActivePlan,
): PendingRow[] {
  const byId = (plan: ComparedPlan) =>
    new Map(plan.analysis.students.map((s) => [s.studentId, s] as const));
  const collective = byId(comparison.collectivePlan);
  const pendingNeed = byId(comparison.pendingNeedPlan);
  const rows = students.flatMap((student): PendingRow[] => {
    const a = collective.get(student.studentId);
    const b = pendingNeed.get(student.studentId);
    if (a === undefined || b === undefined) return [];
    return [
      {
        studentId: student.studentId,
        displayName: student.displayName,
        responseCount: a.responseCount,
        basedOnPriorOnly: a.basedOnPriorOnly,
        baseline: a.baseline,
        pendingCollective: a.pending,
        pendingNeed: b.pending,
        detail: a.skills.map((skill) => ({
          skill: skill.skill,
          name: skillName(skill.skill),
          need: skill.need,
          collective: skill.isScheduled ? "scheduled" : "pending",
          pendingNeed: b.skills.find((item) => item.skill === skill.skill)
            ?.isScheduled
            ? "scheduled"
            : "pending",
        })),
      },
    ];
  });
  const key = (row: PendingRow) =>
    activePlan === "collective" ? row.pendingCollective : row.pendingNeed;
  return rows.sort(
    (x, y) =>
      (key(y) ?? -1) - (key(x) ?? -1) ||
      (x.studentId < y.studentId ? -1 : x.studentId > y.studentId ? 1 : 0),
  );
}
