// Datos del radar de clase. Solo reordena valores que ya calcula el motor: la
// geometría es presentación, y un alumno sin respuestas no se dibuja, porque su
// posición sería el prior y no una observación.
import { observedBySkill } from "./diagnostic.ts";
import {
  KNOWLEDGE_GRAPH,
  marginals,
  type ClassDiagnostic,
  type SkillId,
} from "./engine.ts";
import type { DemoStudent } from "./demoClass.ts";
import { stateOf, type ClassSession } from "./session.ts";

export interface RadarBlip {
  readonly studentId: string;
  readonly displayName: string;
  readonly skill: SkillId;
  // Necesidad estimada en la competencia de su sector.
  readonly need: number;
  // Media de 1 − p en las competencias con evidencia: fija la distancia al centro.
  readonly meanNeed: number;
  readonly responseCount: number;
  // Posición en porcentaje del cuadro del radar.
  readonly x: number;
  readonly y: number;
  // Ángulo en grados desde las 12, en sentido horario: sincroniza el destello.
  readonly angle: number;
}

export interface RadarSector {
  readonly skill: SkillId;
  readonly name: string;
  readonly midAngle: number;
  readonly meanNeed: number | null;
  readonly blips: readonly RadarBlip[];
}

export interface ClassRadarView {
  readonly sectors: readonly RadarSector[];
  readonly blips: readonly RadarBlip[];
  readonly withoutEvidence: readonly DemoStudent[];
}

const SECTOR_SPAN = 360 / KNOWLEDGE_GRAPH.nodes.length;
export const RADAR_RADIUS = 44;

export function polarPoint(angle: number, fraction: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: 50 + RADAR_RADIUS * fraction * Math.cos(radians),
    y: 50 + RADAR_RADIUS * fraction * Math.sin(radians),
  };
}

// Más lejos del centro, mayor necesidad media medida. El mínimo evita el solape central.
export function needRadius(need: number): number {
  return 0.14 + 0.82 * need;
}

export function classRadarView(
  session: ClassSession,
  diagnostic: ClassDiagnostic,
): ClassRadarView {
  const withoutEvidence: DemoStudent[] = [];
  const placed = new Map<SkillId, Omit<RadarBlip, "x" | "y" | "angle">[]>();
  for (const student of session.students) {
    const state = stateOf(session, student.studentId);
    if (state.responses.length === 0) {
      withoutEvidence.push(student);
      continue;
    }
    const probabilities = marginals(state.joint);
    const observed = observedBySkill(state);
    let focus: { skill: SkillId; need: number } | null = null;
    let total = 0;
    let measured = 0;
    for (const { id } of KNOWLEDGE_GRAPH.nodes) {
      const probability = probabilities[id];
      if ((observed[id] ?? 0) === 0 || probability === undefined) continue;
      const need = 1 - probability;
      total += need;
      measured += 1;
      if (focus === null || need > focus.need) focus = { skill: id, need };
    }
    if (focus === null) continue;
    const list = placed.get(focus.skill) ?? [];
    list.push({
      studentId: student.studentId,
      displayName: student.displayName,
      skill: focus.skill,
      need: focus.need,
      meanNeed: total / measured,
      responseCount: state.responses.length,
    });
    placed.set(focus.skill, list);
  }
  const sectors = KNOWLEDGE_GRAPH.nodes.map((node, index): RadarSector => {
    const start = index * SECTOR_SPAN;
    const list = placed.get(node.id) ?? [];
    const blips = list.map((blip, slot): RadarBlip => {
      const angle = start + (SECTOR_SPAN * (slot + 1)) / (list.length + 1);
      return { ...blip, angle, ...polarPoint(angle, needRadius(blip.meanNeed)) };
    });
    const mean = diagnostic.skills.find((s) => s.skill === node.id)?.meanMastery;
    return {
      skill: node.id,
      name: node.name,
      midAngle: start + SECTOR_SPAN / 2,
      meanNeed: mean === null || mean === undefined ? null : 1 - mean,
      blips,
    };
  });
  return {
    sectors,
    blips: sectors.flatMap((sector) => sector.blips),
    withoutEvidence,
  };
}

// Titular determinista: cita la competencia con menor dominio medio estimado.
export function classHeadline(diagnostic: ClassDiagnostic): {
  readonly skill: SkillId;
  readonly name: string;
  readonly meanMastery: number;
} | null {
  if (diagnostic.totalResponseCount === 0) return null;
  let lowest: { skill: SkillId; meanMastery: number } | null = null;
  for (const summary of diagnostic.skills) {
    if (summary.meanMastery === null) continue;
    if (lowest === null || summary.meanMastery < lowest.meanMastery)
      lowest = { skill: summary.skill, meanMastery: summary.meanMastery };
  }
  if (lowest === null) return null;
  const name =
    KNOWLEDGE_GRAPH.nodes.find((node) => node.id === lowest.skill)?.name ??
    lowest.skill;
  return { ...lowest, name };
}
