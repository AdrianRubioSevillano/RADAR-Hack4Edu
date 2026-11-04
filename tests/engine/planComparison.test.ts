import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_GRAPH,
  compareInterventionPlans,
  createInitialDiagnosticState,
  getClassDiagnostic,
  rankInterventions,
  submitAnswer,
} from '../../src/engine/index.ts';
import type {
  ClassDiagnostic,
  ComparedPlan,
  DiagnosticState,
  InterventionConfig,
  InterventionPlanComparison,
  KnowledgeGraph,
  StudentClassSummary,
  StudentPendingNeed,
  StudentSkillSummary,
} from '../../src/engine/index.ts';
import { bankOf, choiceQuestion, deepFreeze } from './support/bank.ts';
import { ORDER, binaryBits, expectClose, expectInferenceError, serializedCopy } from './support/inference.ts';

// Ancestros escritos a mano, sin importar las funciones del grafo.
const ANCESTORS: Readonly<Record<string, readonly string[]>> = {
  OPS: [],
  NEG: ['OPS'],
  FRA: ['OPS'],
  JER: ['OPS', 'NEG'],
  ALG: ['OPS', 'NEG', 'FRA', 'JER'],
  ECU: ['OPS', 'NEG', 'FRA', 'JER', 'ALG'],
};

const NO_IMPORTANCE = Object.fromEntries(ORDER.map((skill) => [skill, 0]));

interface StudentInput {
  readonly id: string;
  // n_ik por competencia; las que falten valen 0.
  readonly needs?: Readonly<Record<string, number>>;
  readonly responses?: number;
}

function studentOf({ id, needs = {}, responses = 2 }: StudentInput): StudentClassSummary {
  const probability = (skill: string): number => 1 - (needs[skill] ?? 0);
  return {
    studentId: id,
    responseCount: responses,
    skills: ORDER.map((skill) => ({
      skill,
      masteryProbability: probability(skill),
      entropy: binaryBits(probability(skill)),
      // Independencia: una conjunta válida, dentro de las cotas de los ancestros.
      prerequisiteProbability: (ANCESTORS[skill] ?? []).reduce((product, item) => product * probability(item), 1),
    })),
  };
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

// Diagnóstico sintético con agregados calculados aquí, sin funciones de producción.
function diagnosticOf(inputs: readonly StudentInput[]): ClassDiagnostic {
  const students = inputs.map(studentOf);
  const count = students.length;
  const withResponses = students.filter((student) => student.responseCount > 0).length;
  const rowsOf = (skill: string): readonly StudentSkillSummary[] =>
    students.flatMap((student) => student.skills.filter((row) => row.skill === skill));
  const statuses = { none: 'emptyClass', prior: 'priorsOnly', mixed: 'mixed', all: 'allWithResponses' } as const;
  const key = count === 0 ? 'none' : withResponses === 0 ? 'prior' : withResponses < count ? 'mixed' : 'all';

  return {
    config: { tau: 0.5, lowerUncertainty: 0.3, upperUncertainty: 0.7 },
    studentCount: count,
    studentsWithResponses: withResponses,
    totalResponseCount: sum(students.map((student) => student.responseCount)),
    evidenceStatus: statuses[key],
    insufficientData: count === 0,
    warnings: [],
    disclaimer: 'Diagnóstico sintético.',
    skills: ORDER.map((skill) => {
      const rows = rowsOf(skill);
      const probabilities = rows.map((row) => row.masteryProbability);
      const mean = (values: readonly number[]): number | null => (count === 0 ? null : sum(values) / count);
      return {
        skill,
        meanMastery: mean(probabilities),
        expectedReinforcementCount: sum(probabilities.map((probability) => 1 - probability)),
        belowTauCount: probabilities.filter((probability) => probability < 0.5 - 1e-12).length,
        uncertainCount: probabilities.filter((probability) => probability > 0.3 + 1e-12 && probability < 0.7 - 1e-12).length,
        meanEntropy: mean(rows.map((row) => row.entropy)),
        meanPrerequisiteProbability: mean(rows.map((row) => row.prerequisiteProbability)),
      };
    }),
    students,
  };
}

function compare(
  inputs: readonly StudentInput[],
  minutes = 15,
  config?: InterventionConfig,
): InterventionPlanComparison {
  return compareInterventionPlans(diagnosticOf(inputs), KNOWLEDGE_GRAPH, minutes, config);
}

function skillsOf(compared: ComparedPlan): readonly string[] {
  return compared.plan.interventions.map((item) => item.skill);
}

function studentIn(compared: ComparedPlan, id: string): StudentPendingNeed {
  const found = compared.analysis.students.find((item) => item.studentId === id);
  if (found === undefined) throw new Error(`Falta ${id}`);
  return found;
}

function rowIn(compared: ComparedPlan, id: string, skill: string): StudentPendingNeed['skills'][number] {
  const found = studentIn(compared, id).skills.find((item) => item.skill === skill);
  if (found === undefined) throw new Error(`Falta ${skill}`);
  return found;
}

function codesOf(result: InterventionPlanComparison): readonly string[] {
  return result.warnings.map((item) => item.code);
}

// S1 concentra su necesidad en ECU; S2 y S3, en OPS.
const TRADE_OFF: readonly StudentInput[] = [
  { id: 'S1', needs: { ECU: 0.8 } },
  { id: 'S2', needs: { OPS: 0.6 } },
  { id: 'S3', needs: { OPS: 0.6 } },
];

describe('necesidad pendiente calculada a mano', () => {
  it('pondera por importancia y normaliza por D', () => {
    const importance = { OPS: 1, NEG: 0.5, FRA: 0.5, JER: 0.5, ALG: 0.5, ECU: 1 };
    const result = compare([{ id: 'S1', needs: { OPS: 0.4, NEG: 0.2, ECU: 0.8 } }], 15, { importance });
    const plan = result.pendingNeedPlan;

    // D = 4; baseline = (1·0.4 + 0.5·0.2 + 1·0.8)/4 = 0.325.
    expect(skillsOf(plan)).toEqual(['ECU']);
    expect(plan.analysis.scheduledSkills).toEqual(['ECU']);
    const student = studentIn(plan, 'S1');
    expectClose(student.baseline ?? Number.NaN, 0.325);
    expectClose(student.pending ?? Number.NaN, 0.125);
    expectClose(student.scheduled ?? Number.NaN, 0.2);

    const ecu = rowIn(plan, 'S1', 'ECU');
    expect(ecu.isScheduled).toBe(true);
    expectClose(ecu.need, 0.8);
    expect(ecu.importance).toBe(1);
    expectClose(ecu.baseline ?? Number.NaN, 0.2);
    expectClose(ecu.scheduled ?? Number.NaN, 0.2);
    expect(ecu.pending).toBe(0);

    const neg = rowIn(plan, 'S1', 'NEG');
    expect(neg.isScheduled).toBe(false);
    expect(neg.importance).toBe(0.5);
    expectClose(neg.baseline ?? Number.NaN, 0.025);
    expect(neg.scheduled).toBe(0);
    expectClose(neg.pending ?? Number.NaN, 0.025);
  });

  it('no atribuye a los descendientes lo programado en un ancestro', () => {
    const result = compare([{ id: 'S1', needs: { OPS: 0.8, NEG: 0.5, ECU: 0.5 } }]);

    for (const compared of [result.collectivePlan, result.pendingNeedPlan]) {
      expect(skillsOf(compared)).toEqual(['OPS']);
      const student = studentIn(compared, 'S1');
      // baseline = 1.8/6; pendiente = (0.5 + 0.5)/6, aunque NEG y ECU dependan de OPS.
      expectClose(student.baseline ?? Number.NaN, 0.3);
      expectClose(student.pending ?? Number.NaN, 1 / 6);
      expectClose(student.scheduled ?? Number.NaN, 0.8 / 6);
      expectClose(rowIn(compared, 'S1', 'NEG').pending ?? Number.NaN, 0.5 / 6);
      expectClose(rowIn(compared, 'S1', 'ECU').pending ?? Number.NaN, 0.5 / 6);
    }
  });

  it('el desglose suma los índices del alumno, en el orden de las competencias', () => {
    const plan = compare([{ id: 'S1', needs: { OPS: 0.3, FRA: 0.7, ALG: 0.2 } }], 30).pendingNeedPlan;
    const student = studentIn(plan, 'S1');

    expect(student.skills.map((item) => item.skill)).toEqual(ORDER);
    expectClose(sum(student.skills.map((item) => item.baseline ?? Number.NaN)), student.baseline ?? Number.NaN);
    expectClose(sum(student.skills.map((item) => item.scheduled ?? Number.NaN)), student.scheduled ?? Number.NaN);
    expectClose(sum(student.skills.map((item) => item.pending ?? Number.NaN)), student.pending ?? Number.NaN);
  });

  it('calcula la media y el máximo pendientes del plan', () => {
    const { pendingNeedPlan } = compare([
      { id: 'S1', needs: { JER: 0.6 } },
      { id: 'S2', needs: { ECU: 0.6 } },
      { id: 'S3', needs: { ECU: 0.5 } },
    ]);

    // Con ECU programada solo queda JER en S1.
    expectClose(pendingNeedPlan.analysis.maxPending ?? Number.NaN, 0.1);
    expectClose(pendingNeedPlan.analysis.meanPending ?? Number.NaN, 0.1 / 3);
  });
});

describe('los planes pueden diferir o coincidir', () => {
  it('difieren y muestran su compromiso', () => {
    const result = compare(TRADE_OFF);
    const { collectivePlan, pendingNeedPlan } = result;

    expect(result.plansCoincide).toBe(false);
    expect(skillsOf(collectivePlan)).toEqual(['OPS']);
    expect(skillsOf(pendingNeedPlan)).toEqual(['ECU']);

    // A deja a S1 con 0.8/6 y a los demás en 0; B deja a S2 y S3 con 0.6/6.
    expectClose(collectivePlan.analysis.maxPending ?? Number.NaN, 0.8 / 6);
    expectClose(collectivePlan.analysis.meanPending ?? Number.NaN, 0.8 / 18);
    expectClose(pendingNeedPlan.analysis.maxPending ?? Number.NaN, 0.1);
    expectClose(pendingNeedPlan.analysis.meanPending ?? Number.NaN, 1.2 / 18);

    // B: n = 0.8/3, preparación (1 + 0.4 + 0.4)/3, confianza 1 - H(0.2)/3, coste 0.05, sin cobertura.
    const need = 0.8 / 3;
    const confidence = 1 - binaryBits(0.2) / 3;
    expectClose(pendingNeedPlan.plan.netValue, need * (0.3 * 0.6 + 0.2 * confidence + 0.3) - 0.05);
    expect(pendingNeedPlan.plan.coverage).toBe(0);
    expect(pendingNeedPlan.plan.netValue).toBeLessThan(collectivePlan.plan.netValue);
  });

  it('coinciden sin forzar una diferencia', () => {
    const result = compare([{ id: 'S1', needs: { OPS: 0.9 } }]);

    expect(result.plansCoincide).toBe(true);
    expect(skillsOf(result.collectivePlan)).toEqual(['OPS']);
    expect(result.pendingNeedPlan).toEqual(result.collectivePlan);
  });

  it('el plan A es exactamente el de rankInterventions', () => {
    const diagnostic = diagnosticOf(TRADE_OFF);
    const reference = rankInterventions(diagnostic, KNOWLEDGE_GRAPH, 45);
    const result = compareInterventionPlans(diagnostic, KNOWLEDGE_GRAPH, 45);

    expect(result.collectivePlan.plan).toEqual(reference.plan);
    expect(result.config).toEqual(reference.config);
    expect(result.evidence).toEqual(reference.evidence);
    expect(result.warnings.slice(0, reference.warnings.length)).toEqual(reference.warnings);
  });

  it('no añade competencias que no reducen ninguna necesidad', () => {
    expect(skillsOf(compare([{ id: 'S1', needs: { OPS: 0.9 } }], 90).pendingNeedPlan)).toEqual(['OPS']);
  });

  it('sin necesidad estimada, el plan B queda vacío', () => {
    const { pendingNeedPlan } = compare([{ id: 'S1' }], 90);

    expect(skillsOf(pendingNeedPlan)).toEqual([]);
    expect(pendingNeedPlan.analysis.maxPending).toBe(0);
  });
});

describe('presupuesto', () => {
  it.each([
    ['cero', 0],
    ['insuficiente', 14],
  ])('%s: ambos planes vacíos y nada programado', (_, minutes) => {
    const result = compare(TRADE_OFF, minutes);

    for (const compared of [result.collectivePlan, result.pendingNeedPlan]) {
      expect(skillsOf(compared)).toEqual([]);
      expect(compared.plan.totalMinutes).toBe(0);
      for (const student of compared.analysis.students) {
        expect(student.pending).toBe(student.baseline);
        expect(student.scheduled).toBe(0);
      }
    }
    expect(result.plansCoincide).toBe(true);
  });

  it('justo: cabe una competencia', () => {
    expect(compare(TRADE_OFF, 15).pendingNeedPlan.plan.totalMinutes).toBe(15);
  });

  it('suficiente: programa todo lo que reduce el máximo', () => {
    const { pendingNeedPlan } = compare(TRADE_OFF, 30);

    expect(skillsOf(pendingNeedPlan)).toEqual(['ECU', 'OPS']);
    expect(pendingNeedPlan.plan.totalMinutes).toBe(30);
    expect(pendingNeedPlan.analysis.maxPending).toBe(0);
    expect(pendingNeedPlan.analysis.meanPending).toBe(0);
  });

  it('ignora el coste salvo en el tercer criterio', () => {
    const { collectivePlan, pendingNeedPlan } = compare(TRADE_OFF, 30, { lambda: 100 });

    expect(skillsOf(collectivePlan)).toEqual([]);
    expect(skillsOf(pendingNeedPlan)).toEqual(['ECU', 'OPS']);
    expect(pendingNeedPlan.plan.netValue).toBeLessThan(0);
  });

  it('suma los tiempos en segundos enteros: 0.1 + 0.2 minutos caben en 0.3', () => {
    const durations = { NEG: 0.1, FRA: 0.2 };
    const { pendingNeedPlan } = compare([{ id: 'S1', needs: { NEG: 0.5, FRA: 0.5 } }], 0.3, { durations });

    expect(skillsOf(pendingNeedPlan)).toEqual(['FRA', 'NEG']);
    expect(pendingNeedPlan.plan.totalMinutes).toBe(0.3);
  });

  it.each([
    ['menos de un segundo', 0.01],
    ['negativo', -1],
    ['no finito', Number.NaN],
  ])('rechaza un presupuesto %s', (_, minutes) => {
    expectInferenceError(() => compare(TRADE_OFF, minutes), 'INVALID_BUDGET');
  });

  it('rechaza duraciones sin resolución de un segundo', () => {
    expectInferenceError(() => compare(TRADE_OFF, 15, { durations: { OPS: 0.01 } }), 'INVALID_INTERVENTION_CONFIG');
  });
});

describe('criterios y empates del plan B', () => {
  const NO_RELEVANCE = { preparation: 0.5, confidence: 0.2, priority: 0.3, relevance: 0 };
  const SYMMETRIC: readonly StudentInput[] = [
    { id: 'S1', needs: { NEG: 0.6 } },
    { id: 'S2', needs: { FRA: 0.6 } },
  ];

  it('1: menor máximo aunque otro subconjunto tenga mejor media', () => {
    // {ECU}: máximo 0.6/6, media 0.8/18. {OPS}: máximo 0.7/6, media 0.7/18.
    const inputs: readonly StudentInput[] = [
      { id: 'S1', needs: { ECU: 0.7 } },
      { id: 'S2', needs: { OPS: 0.6 } },
      { id: 'S3', needs: { OPS: 0.6 } },
    ];
    const { pendingNeedPlan } = compare(inputs);

    expect(skillsOf(pendingNeedPlan)).toEqual(['ECU']);
    expectClose(pendingNeedPlan.analysis.maxPending ?? Number.NaN, 0.1);
  });

  it('2: a igual máximo, menor media', () => {
    const inputs: readonly StudentInput[] = [
      { id: 'S1', needs: { JER: 0.6 } },
      { id: 'S2', needs: { ECU: 0.6 } },
      { id: 'S3', needs: { ECU: 0.5 } },
    ];

    expect(skillsOf(compare(inputs).pendingNeedPlan)).toEqual(['ECU']);
  });

  it('3: a igual máximo y media, mayor valor neto', () => {
    // JER tiene más preparación y relevancia que ECU.
    const inputs: readonly StudentInput[] = [
      { id: 'S1', needs: { JER: 0.6 } },
      { id: 'S2', needs: { ECU: 0.6 } },
    ];

    expect(skillsOf(compare(inputs).pendingNeedPlan)).toEqual(['JER']);
  });

  it('4: a igual valor, menor duración antes que la lista de ids', () => {
    const config = { weights: NO_RELEVANCE, lambda: 0, durations: { NEG: 10 } };

    expect(skillsOf(compare(SYMMETRIC, 15, config).pendingNeedPlan)).toEqual(['NEG']);
  });

  it('5: a igual duración, la lista de ids ordenada', () => {
    const config = { weights: NO_RELEVANCE, lambda: 0 };

    expect(skillsOf(compare(SYMMETRIC, 15, config).pendingNeedPlan)).toEqual(['FRA']);
  });

  it.each([
    // Diferencia de 2e-13 en el máximo: empate, y decide la duración.
    ['dentro de la tolerancia', 1.2e-12, 'NEG'],
    // Diferencia de 2e-12 en el máximo: decide el primer criterio.
    ['fuera de la tolerancia', 12e-12, 'FRA'],
  ])('máximo %s', (_, excess, expected) => {
    const weights = { preparation: 1, confidence: 0, priority: 0, relevance: 0 };
    const inputs: readonly StudentInput[] = [
      { id: 'S1', needs: { NEG: 0.6 } },
      { id: 'S2', needs: { FRA: 0.6 + excess } },
    ];

    expect(skillsOf(compare(inputs, 15, { weights, lambda: 0, durations: { NEG: 10 } }).pendingNeedPlan)).toEqual([expected]);
  });

  it('filtra respecto al mejor global, no por pares', () => {
    // Cadena JER, NEG, FRA con pasos de 8e-13: FRA dista 1.6e-12 del mejor.
    const step = 6 * 8e-13;
    const inputs: readonly StudentInput[] = [{ id: 'S1', needs: { FRA: 0.3, NEG: 0.3 + step, JER: 0.3 + 2 * step } }];
    const config = { weights: NO_RELEVANCE, durations: { FRA: 9, NEG: 10, JER: 11 } };

    // FRA sería la de más valor si encadenara empates; JER ganaría sin tolerancia.
    expect(skillsOf(compare(inputs, 11, config).pendingNeedPlan)).toEqual(['NEG']);
  });
});

describe('permutación de entradas', () => {
  const inputs: readonly StudentInput[] = [
    { id: 'S3', needs: { OPS: 0.3, ECU: 0.2 } },
    { id: 'S1', needs: { FRA: 0.7, JER: 0.1 } },
    { id: 'S2', needs: { NEG: 0.45, ALG: 0.35 } },
  ];

  it('el orden de alumnos, competencias y claves no cambia el resultado', () => {
    const diagnostic = diagnosticOf(inputs);
    const reference = compareInterventionPlans(diagnostic, KNOWLEDGE_GRAPH, 30, { durations: { OPS: 10, FRA: 20 } });
    const shuffled: ClassDiagnostic = {
      ...diagnostic,
      skills: [...diagnostic.skills].reverse(),
      students: [...diagnostic.students].reverse().map((student) => ({ ...student, skills: [...student.skills].reverse() })),
    };

    const result = compareInterventionPlans(shuffled, KNOWLEDGE_GRAPH, 30, { durations: { FRA: 20, OPS: 10 } });

    expect(result).toEqual(reference);
  });

  it('devuelve los alumnos por id', () => {
    const ids = compare(inputs).pendingNeedPlan.analysis.students.map((student) => student.studentId);

    expect(ids).toEqual(['S1', 'S2', 'S3']);
  });

  it('es determinista', () => {
    expect(compare(inputs, 30)).toEqual(compare(inputs, 30));
  });
});

describe('importancias nulas', () => {
  const result = compare(TRADE_OFF, 15, { importance: NO_IMPORTANCE });

  it('los índices son null y hay aviso, sin afirmar ausencia de necesidad', () => {
    const { analysis } = result.pendingNeedPlan;

    expect(analysis.meanPending).toBeNull();
    expect(analysis.maxPending).toBeNull();
    expect(codesOf(result)).toContain('ZERO_TOTAL_IMPORTANCE');
    expect(result.warnings.find((item) => item.code === 'ZERO_TOTAL_IMPORTANCE')?.message).toContain('No significa que no haya necesidad');

    const student = studentIn(result.pendingNeedPlan, 'S1');
    expect([student.baseline, student.scheduled, student.pending]).toEqual([null, null, null]);
    const ecu = rowIn(result.pendingNeedPlan, 'S1', 'ECU');
    expect([ecu.baseline, ecu.scheduled, ecu.pending]).toEqual([null, null, null]);
    expectClose(ecu.need, 0.8);
  });

  it('el plan B queda vacío', () => {
    expect(skillsOf(result.pendingNeedPlan)).toEqual([]);
    expect(result.pendingNeedPlan.plan.netValue).toBe(0);
  });

  it('el plan A conserva el comportamiento de rankInterventions', () => {
    const reference = rankInterventions(diagnosticOf(TRADE_OFF), KNOWLEDGE_GRAPH, 15, { importance: NO_IMPORTANCE });

    expect(reference.plan.interventions.length).toBeGreaterThan(0);
    expect(result.collectivePlan.plan).toEqual(reference.plan);
    expect(result.collectivePlan.analysis.scheduledSkills).toEqual(reference.plan.interventions.map((item) => item.skill));
    expect(result.collectivePlan.analysis.maxPending).toBeNull();
  });

  it('JSON conserva los null', () => {
    expect(serializedCopy(result)).toEqual(result);
    expect(JSON.stringify(result.pendingNeedPlan.analysis)).toContain('"maxPending":null');
  });
});

describe('evidencia', () => {
  const question = choiceQuestion('Q1', ['OPS']);
  const bank = bankOf(question);

  function answered(id: string): DiagnosticState {
    const result = submitAnswer(createInitialDiagnosticState(id), 'Q1', 'c', bank);
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  }

  it('clase vacía: planes y alumnos vacíos e índices agregados null', () => {
    const result = compareInterventionPlans(getClassDiagnostic([], KNOWLEDGE_GRAPH), KNOWLEDGE_GRAPH, 60);

    expect(result.basis).toBe('noStudents');
    for (const compared of [result.collectivePlan, result.pendingNeedPlan]) {
      expect(compared.plan.interventions).toEqual([]);
      expect(compared.plan.netValue).toBe(0);
      expect(compared.analysis).toEqual({ scheduledSkills: [], students: [], meanPending: null, maxPending: null });
    }
    expect(result.plansCoincide).toBe(true);
    expect(codesOf(result)).toEqual(['NO_STUDENTS']);
    expect(serializedCopy(result)).toEqual(result);
  });

  it('clase vacía con importancias nulas: ambos avisos', () => {
    const diagnostic = getClassDiagnostic([], KNOWLEDGE_GRAPH);
    const result = compareInterventionPlans(diagnostic, KNOWLEDGE_GRAPH, 60, { importance: NO_IMPORTANCE });

    expect(codesOf(result)).toEqual(['NO_STUDENTS', 'ZERO_TOTAL_IMPORTANCE']);
  });

  it('priorsOnly: planes vacíos y análisis hipotético', () => {
    const states = [createInitialDiagnosticState('S1'), createInitialDiagnosticState('S2')];
    const result = compareInterventionPlans(getClassDiagnostic(states, KNOWLEDGE_GRAPH), KNOWLEDGE_GRAPH, 1000);

    expect(result.basis).toBe('hypotheticalPriorsOnly');
    expect(codesOf(result)).toContain('COLLECT_RESPONSES');
    expect(codesOf(result)).toContain('HYPOTHETICAL_ANALYSIS');
    expect(result.warnings.find((item) => item.code === 'HYPOTHETICAL_ANALYSIS')?.message).toContain('hipotético');
    expect(result.evidence.warnings.map((item) => item.code)).toEqual(['PRIOR_ONLY_ESTIMATES']);

    for (const compared of [result.collectivePlan, result.pendingNeedPlan]) {
      expect(compared.plan.interventions).toEqual([]);
      expect(compared.analysis.scheduledSkills).toEqual([]);
      expectClose(compared.analysis.meanPending ?? Number.NaN, 0.5);
      expectClose(compared.analysis.maxPending ?? Number.NaN, 0.5);
      for (const student of compared.analysis.students) {
        expect(student.basedOnPriorOnly).toBe(true);
        expect(student.scheduled).toBe(0);
      }
    }
  });

  it('mixed: incluye a todos y conserva los avisos', () => {
    const states = [answered('S1'), answered('S2'), createInitialDiagnosticState('S3'), createInitialDiagnosticState('S4')];
    const result = compareInterventionPlans(getClassDiagnostic(states, KNOWLEDGE_GRAPH), KNOWLEDGE_GRAPH, 15);

    expect(result.basis).toBe('withResponses');
    expect(result.evidence.status).toBe('mixed');
    expect(result.evidence.proportionWithoutResponses).toBe(0.5);
    expect(result.evidence.warnings.map((item) => item.code)).toEqual(['PRIOR_ONLY_ESTIMATES']);
    expect(result.warnings.find((item) => item.code === 'PRIOR_ONLY_STUDENTS')?.message).toContain('2 de 4');

    const { students } = result.pendingNeedPlan.analysis;
    expect(students.map((student) => [student.studentId, student.basedOnPriorOnly])).toEqual([
      ['S1', false],
      ['S2', false],
      ['S3', true],
      ['S4', true],
    ]);
  });

  it('mixed: un alumno sin respuestas también cuenta para el máximo', () => {
    const result = compare([
      { id: 'S1', needs: { OPS: 0.2 } },
      { id: 'S2', needs: { ECU: 0.9 }, responses: 0 },
    ]);

    expect(skillsOf(result.pendingNeedPlan)).toEqual(['ECU']);
    expect(studentIn(result.pendingNeedPlan, 'S2').basedOnPriorOnly).toBe(true);
  });

  it('allWithResponses: sin avisos de priors', () => {
    expect(codesOf(compare([{ id: 'S1', needs: { OPS: 0.9 } }]))).not.toContain('PRIOR_ONLY_STUDENTS');
  });

  it.each<[string, DiagnosticState[]]>([
    ['prior compatible', [createInitialDiagnosticState('S1', { compatibility: { epsilon: 0.1 } }, KNOWLEDGE_GRAPH)]],
    [
      'priors extremos',
      [createInitialDiagnosticState('S1', { marginals: { OPS: 0, NEG: 1, FRA: 1e-12, JER: 1 - 1e-12 } })],
    ],
  ])('acepta el diagnóstico real con %s, también serializado', (_, states) => {
    const diagnostic = getClassDiagnostic(states, KNOWLEDGE_GRAPH);
    const reference = compareInterventionPlans(diagnostic, KNOWLEDGE_GRAPH, 60);

    expect(compareInterventionPlans(serializedCopy(diagnostic) as ClassDiagnostic, KNOWLEDGE_GRAPH, 60)).toEqual(reference);
  });

  it('acepta el diagnóstico real con respuestas', () => {
    const diagnostic = getClassDiagnostic([answered('S1'), answered('S2')], KNOWLEDGE_GRAPH);

    expect(compareInterventionPlans(diagnostic, KNOWLEDGE_GRAPH, 60).evidence.status).toBe('allWithResponses');
  });
});

describe('validación del detalle por alumno', () => {
  const valid = diagnosticOf(TRADE_OFF);
  const [first, second] = valid.students as [StudentClassSummary, StudentClassSummary, StudentClassSummary];

  const withStudent = (change: unknown): ClassDiagnostic =>
    ({ ...valid, students: [change, ...valid.students.slice(1)] }) as ClassDiagnostic;
  const withRow = (skill: string, change: Readonly<Record<string, unknown>>): ClassDiagnostic =>
    withStudent({
      ...first,
      skills: first.skills.map((row) => (row.skill === skill ? { ...row, ...change } : row)),
    });
  const withSummary = (skill: string, change: Readonly<Record<string, unknown>>): ClassDiagnostic =>
    ({
      ...valid,
      skills: valid.skills.map((item) => (item.skill === skill ? { ...item, ...change } : item)),
    }) as ClassDiagnostic;

  it('acepta el diagnóstico sin alterar', () => {
    expect(compareInterventionPlans(valid, KNOWLEDGE_GRAPH, 15).evidence.studentCount).toBe(3);
  });

  it.each<[string, ClassDiagnostic]>([
    ['alumno nulo', withStudent(null)],
    ['id repetido', withStudent({ ...first, studentId: second.studentId })],
    ['id vacío', withStudent({ ...first, studentId: '  ' })],
    ['id que no es texto', withStudent({ ...first, studentId: 7 })],
    ['responseCount negativo', withStudent({ ...first, responseCount: -1 })],
    ['responseCount decimal', withStudent({ ...first, responseCount: 1.5 })],
    ['responseCount que no es número', withStudent({ ...first, responseCount: '2' })],
    ['competencias que no son una lista', withStudent({ ...first, skills: null })],
    ['sin competencias', withStudent({ ...first, skills: [] })],
    ['cinco competencias', withStudent({ ...first, skills: first.skills.slice(1) })],
    ['competencia repetida', withStudent({ ...first, skills: [...first.skills.slice(1), first.skills[1]] })],
    ['competencia desconocida', withRow('OPS', { skill: 'XXX' })],
    ['fila nula', withStudent({ ...first, skills: [null, ...first.skills.slice(1)] })],
    ['probabilidad NaN', withRow('NEG', { masteryProbability: Number.NaN })],
    ['probabilidad mayor que 1', withRow('NEG', { masteryProbability: 1.5 })],
    ['probabilidad negativa', withRow('NEG', { masteryProbability: -0.1 })],
    ['probabilidad nula', withRow('NEG', { masteryProbability: null })],
    ['probabilidad de texto', withRow('NEG', { masteryProbability: '1' })],
    ['entropía NaN', withRow('NEG', { entropy: Number.NaN })],
    ['entropía nula', withRow('NEG', { entropy: null })],
    ['entropía mayor que 1', withRow('NEG', { entropy: 1.5 })],
    ['entropía incoherente con la probabilidad', withRow('NEG', { entropy: 0.5 })],
    ['preparación infinita', withRow('NEG', { prerequisiteProbability: Number.POSITIVE_INFINITY })],
    ['preparación mayor que 1', withRow('NEG', { prerequisiteProbability: 1.5 })],
    ['preparación nula', withRow('NEG', { prerequisiteProbability: null })],
    ['raíz con preparación distinta de 1', withRow('OPS', { prerequisiteProbability: 0.5 })],
    ['preparación por debajo de la cota de sus ancestros', withRow('NEG', { prerequisiteProbability: 0.5 })],
    ['preparación por encima de un ancestro', withStudent({
      ...second,
      studentId: 'S9',
      skills: second.skills.map((row) => (row.skill === 'NEG' ? { ...row, prerequisiteProbability: 0.9 } : row)),
    })],
  ])('rechaza %s', (_, diagnostic) => {
    expectInferenceError(() => compareInterventionPlans(diagnostic, KNOWLEDGE_GRAPH, 15), 'INVALID_DIAGNOSTIC');
  });

  it.each<[string, ClassDiagnostic]>([
    ['una respuesta de más', withStudent({ ...first, responseCount: 3 })],
    ['alumnos con respuestas distintos', { ...valid, students: [{ ...first, responseCount: 0 }, { ...second, responseCount: 4 }, ...valid.students.slice(2)] }],
    ['un alumno cambiado con su fila coherente', withRow('NEG', { masteryProbability: 0.5, entropy: 1 })],
    ['dominio medio y refuerzo cambiados a la vez', withSummary('ECU', { meanMastery: 0.8, expectedReinforcementCount: 0.6 })],
    ['entropía media cambiada', withSummary('ECU', { meanEntropy: 0.5 })],
    ['preparación media cambiada', withSummary('ECU', { meanPrerequisiteProbability: 0.2 })],
    ['alumnos por debajo de tau cambiados', withSummary('OPS', { belowTauCount: 0 })],
    ['alumnos inciertos cambiados', withSummary('OPS', { uncertainCount: 0 })],
  ])('rechaza la incoherencia con el agregado: %s', (_, diagnostic) => {
    expectInferenceError(() => compareInterventionPlans(diagnostic, KNOWLEDGE_GRAPH, 15), 'INVALID_DIAGNOSTIC');
  });

  it.each<[string, number, number]>([
    ['por debajo de la cota inferior', 1, 0.5],
    ['por encima de un ancestro', 0.4, 0.9],
  ])('rechaza una preparación %s aunque el agregado la refleje', (_, original, preparation) => {
    const student = original === 1 ? first : second;
    const summary = valid.skills.find((item) => item.skill === 'NEG');
    const changed = {
      ...student,
      skills: student.skills.map((row) => (row.skill === 'NEG' ? { ...row, prerequisiteProbability: preparation } : row)),
    };
    const diagnostic: ClassDiagnostic = {
      ...valid,
      skills: valid.skills.map((item) =>
        item.skill === 'NEG'
          ? { ...item, meanPrerequisiteProbability: (summary?.meanPrerequisiteProbability ?? Number.NaN) + (preparation - original) / 3 }
          : item,
      ),
      students: valid.students.map((item) => (item.studentId === student.studentId ? changed : item)),
    };

    expect(() => compareInterventionPlans(diagnostic, KNOWLEDGE_GRAPH, 15)).toThrow(/no es compatible con las probabilidades/);
  });

  it.each<[string, number, boolean]>([
    ['dentro de la tolerancia', 5e-10, true],
    ['fuera de la tolerancia', 2e-9, false],
  ])('reconcilia las medias %s', (_, shift, accepted) => {
    const summary = valid.skills.find((item) => item.skill === 'ECU');
    const diagnostic = withSummary('ECU', { meanEntropy: (summary?.meanEntropy ?? Number.NaN) + shift });
    const action = (): unknown => compareInterventionPlans(diagnostic, KNOWLEDGE_GRAPH, 15);

    if (accepted) {
      expect(action).not.toThrow();
    } else {
      expectInferenceError(action, 'INVALID_DIAGNOSTIC');
    }
  });

  it.each<[string, unknown]>([
    ['ausentes', undefined],
    ['fuera de rango', { tau: 1.5, lowerUncertainty: 0.3, upperUncertainty: 0.7 }],
    ['invertidos', { tau: 0.5, lowerUncertainty: 0.7, upperUncertainty: 0.3 }],
  ])('rechaza umbrales del diagnóstico %s', (_, config) => {
    const diagnostic = { ...valid, config } as ClassDiagnostic;

    expectInferenceError(() => compareInterventionPlans(diagnostic, KNOWLEDGE_GRAPH, 15), 'INVALID_DIAGNOSTIC');
  });

  it('rankInterventions sigue sin exigir el detalle por alumno', () => {
    const diagnostic = withStudent({ ...first, skills: [] });

    expect(rankInterventions(diagnostic, KNOWLEDGE_GRAPH, 15).plan.interventions.length).toBeGreaterThan(0);
  });

  it('reutiliza la validación de 4B', () => {
    expectInferenceError(() => compareInterventionPlans(null as unknown as ClassDiagnostic, KNOWLEDGE_GRAPH, 15), 'INVALID_DIAGNOSTIC');
    expectInferenceError(() => compareInterventionPlans(valid, { nodes: [] } as KnowledgeGraph, 15), 'INVALID_GRAPH');
    expectInferenceError(
      () => compareInterventionPlans(valid, KNOWLEDGE_GRAPH, 15, { weights: { preparation: 2 } }),
      'INVALID_INTERVENTION_CONFIG',
    );
  });
});

describe('contrato de la salida', () => {
  it('no muta entradas congeladas', () => {
    const diagnostic = deepFreeze(diagnosticOf(TRADE_OFF));
    const graph = deepFreeze(structuredClone(KNOWLEDGE_GRAPH));
    const config = deepFreeze({ durations: { OPS: 10 }, importance: { ECU: 0.5 } });

    expect(compareInterventionPlans(diagnostic, graph, 30, config).plansCoincide).toBeTypeOf('boolean');
  });

  it('se serializa sin perder nada', () => {
    const result = compare(TRADE_OFF, 30);

    expect(serializedCopy(result)).toEqual(result);
  });

  it('declara los límites del análisis sin hablar de necesidades resueltas', () => {
    const result = compare(TRADE_OFF);

    expect(result.disclaimer).toContain('no son probabilidades de mejora');
    expect(result.disclaimer).toContain('no significa que se haya aprendido');
    expect(result.disclaimer).toContain('no se afirma superioridad ni equidad educativa demostrada');
    expect(JSON.stringify(result)).not.toMatch(/resuelt|beneficiad/i);
  });

  it('mantiene la configuración efectiva y el presupuesto', () => {
    const result = compare(TRADE_OFF, 45, { lambda: 0.2 });

    expect(result.availableMinutes).toBe(45);
    expect(result.config.lambda).toBe(0.2);
    expect(result.config.importance).toEqual(Object.fromEntries(ORDER.map((skill) => [skill, 1])));
    expect(result.assumptions.length).toBeGreaterThan(3);
  });
});
