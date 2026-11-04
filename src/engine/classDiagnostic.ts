import { assertValidStateStructure } from './answers.ts';
import { assertInferenceGraph, marginals, masteryProbability } from './bayes.ts';
import { InferenceError, SKILL_ORDER } from './dina.ts';
import { binaryEntropy } from './entropy.ts';
import { ancestors } from './graph.ts';
import { isBelowThreshold, isStrictlyBetween } from './thresholds.ts';
import type {
  ClassDiagnostic,
  ClassDiagnosticConfig,
  ClassEvidenceStatus,
  ClassWarning,
  DiagnosticState,
  EffectiveClassDiagnosticConfig,
  KnowledgeGraph,
  SkillClassSummary,
  SkillId,
  StudentClassSummary,
} from './types.ts';

const DEFAULT_CONFIG: EffectiveClassDiagnosticConfig = { tau: 0.5, lowerUncertainty: 0.3, upperUncertainty: 0.7 };

const DISCLAIMER =
  'Son estimaciones de un modelo con parámetros no calibrados, no diagnósticos confirmados. ' +
  'El número esperado de refuerzo no es un recuento de alumnos observados con dificultad. ' +
  'El número de respuestas no indica cuántas competencias se han medido.';

// Motivo por el que los umbrales no son válidos; null si lo son.
export function classThresholdProblem(config: EffectiveClassDiagnosticConfig): string | null {
  const { tau, lowerUncertainty, upperUncertainty } = config;
  for (const value of [tau, lowerUncertainty, upperUncertainty]) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
      return 'Los umbrales deben ser finitos en [0, 1]';
    }
  }
  return lowerUncertainty >= upperUncertainty ? 'lowerUncertainty debe ser menor que upperUncertainty' : null;
}

function effectiveConfig(config: ClassDiagnosticConfig): EffectiveClassDiagnosticConfig {
  const {
    tau = DEFAULT_CONFIG.tau,
    lowerUncertainty = DEFAULT_CONFIG.lowerUncertainty,
    upperUncertainty = DEFAULT_CONFIG.upperUncertainty,
  } = config;
  const effective = { tau, lowerUncertainty, upperUncertainty };
  const problem = classThresholdProblem(effective);
  if (problem !== null) {
    throw new InferenceError('INVALID_CLASS_CONFIG', problem);
  }
  return effective;
}

function assertValidStudentStates(studentStates: readonly DiagnosticState[]): void {
  if (!Array.isArray(studentStates)) {
    throw new InferenceError('INVALID_STATE', 'studentStates debe ser una lista');
  }
  const ids = new Set<string>();
  for (const state of studentStates) {
    assertValidStateStructure(state);
    if (ids.has(state.studentId)) {
      throw new InferenceError('DUPLICATE_STUDENT', `Alumno duplicado: ${state.studentId}`);
    }
    ids.add(state.studentId);
  }
}

function summarizeStudent(
  state: DiagnosticState,
  prerequisites: ReadonlyMap<SkillId, readonly SkillId[]>,
): StudentClassSummary {
  const mastery = marginals(state.joint);
  return {
    studentId: state.studentId,
    responseCount: state.responses.length,
    skills: SKILL_ORDER.map((skill) => {
      const masteryProbabilityOfSkill = mastery[skill] ?? Number.NaN;
      return {
        skill,
        masteryProbability: masteryProbabilityOfSkill,
        entropy: binaryEntropy(masteryProbabilityOfSkill),
        prerequisiteProbability: masteryProbability(state.joint, prerequisites.get(skill) ?? []),
      };
    }),
  };
}

export function summarizeSkill(
  skill: SkillId,
  students: readonly StudentClassSummary[],
  config: EffectiveClassDiagnosticConfig,
): SkillClassSummary {
  const rows = students.flatMap((student) => student.skills.filter((item) => item.skill === skill));
  const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);
  const mean = (values: readonly number[]): number | null => (values.length === 0 ? null : sum(values) / values.length);
  const probabilities = rows.map((row) => row.masteryProbability);

  return {
    skill,
    meanMastery: mean(probabilities),
    expectedReinforcementCount: sum(probabilities.map((probability) => 1 - probability)),
    belowTauCount: probabilities.filter((probability) => isBelowThreshold(probability, config.tau)).length,
    uncertainCount: probabilities.filter((probability) =>
      isStrictlyBetween(probability, config.lowerUncertainty, config.upperUncertainty),
    ).length,
    meanEntropy: mean(rows.map((row) => row.entropy)),
    meanPrerequisiteProbability: mean(rows.map((row) => row.prerequisiteProbability)),
  };
}

function evidenceStatus(studentCount: number, studentsWithResponses: number): ClassEvidenceStatus {
  if (studentCount === 0) return 'emptyClass';
  if (studentsWithResponses === 0) return 'priorsOnly';
  return studentsWithResponses === studentCount ? 'allWithResponses' : 'mixed';
}

function warningsFor(status: ClassEvidenceStatus, studentCount: number, studentsWithResponses: number): readonly ClassWarning[] {
  if (status === 'emptyClass') {
    return [{ code: 'INSUFFICIENT_DATA', message: 'No hay alumnos: no hay datos suficientes para el diagnóstico.' }];
  }
  if (status === 'priorsOnly') {
    return [{ code: 'PRIOR_ONLY_ESTIMATES', message: 'Ningún alumno tiene respuestas: todas las estimaciones proceden únicamente del prior.' }];
  }
  if (status === 'mixed') {
    const withoutResponses = studentCount - studentsWithResponses;
    return [
      {
        code: 'PRIOR_ONLY_ESTIMATES',
        message: `${withoutResponses} de ${studentCount} alumnos no tienen respuestas: sus estimaciones proceden únicamente del prior.`,
      },
    ];
  }
  return [];
}

export function getClassDiagnostic(
  studentStates: readonly DiagnosticState[],
  knowledgeGraph: KnowledgeGraph,
  config: ClassDiagnosticConfig = {},
): ClassDiagnostic {
  const effective = effectiveConfig(config);
  assertInferenceGraph(knowledgeGraph);
  assertValidStudentStates(studentStates);

  const prerequisites = new Map(SKILL_ORDER.map((skill) => [skill, ancestors(knowledgeGraph, skill)]));
  const students = [...studentStates]
    .sort((a, b) => (a.studentId < b.studentId ? -1 : 1))
    .map((state) => summarizeStudent(state, prerequisites));

  const studentCount = students.length;
  const studentsWithResponses = students.filter((student) => student.responseCount > 0).length;
  const status = evidenceStatus(studentCount, studentsWithResponses);

  return {
    config: effective,
    studentCount,
    studentsWithResponses,
    totalResponseCount: students.reduce((total, student) => total + student.responseCount, 0),
    evidenceStatus: status,
    insufficientData: studentCount === 0,
    warnings: warningsFor(status, studentCount, studentsWithResponses),
    disclaimer: DISCLAIMER,
    skills: SKILL_ORDER.map((skill) => summarizeSkill(skill, students, effective)),
    students,
  };
}
