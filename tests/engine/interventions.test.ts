import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_GRAPH,
  createInitialDiagnosticState,
  getClassDiagnostic,
  rankInterventions,
  submitAnswer,
} from '../../src/engine/index.ts';
import type {
  ClassDiagnostic,
  DiagnosticState,
  InterventionConfig,
  InterventionRanking,
  InterventionScore,
  KnowledgeGraph,
  SkillClassSummary,
} from '../../src/engine/index.ts';
import { rankWithTies } from '../../src/engine/interventions.ts';
import { bankOf, choiceQuestion, deepFreeze } from './support/bank.ts';
import { ORDER, expectClose, expectInferenceError, serializedCopy } from './support/inference.ts';

interface Row {
  readonly need?: number;
  readonly preparation?: number;
  readonly confidence?: number;
}

const STUDENTS = 10;
const NO_IMPORTANCE = Object.fromEntries(ORDER.map((skill) => [skill, 0]));

// Diagnóstico sintético: fija n_k, preparación y confianza sin funciones de producción.
function diagnosticOf(rows: Readonly<Record<string, Row>> = {}): ClassDiagnostic {
  return {
    config: { tau: 0.5, lowerUncertainty: 0.3, upperUncertainty: 0.7 },
    studentCount: STUDENTS,
    studentsWithResponses: STUDENTS,
    totalResponseCount: 2 * STUDENTS,
    evidenceStatus: 'allWithResponses',
    insufficientData: false,
    warnings: [],
    disclaimer: 'Diagnóstico sintético.',
    skills: ORDER.map((skill) => {
      const { need = 0, preparation = 1, confidence = 1 } = rows[skill] ?? {};
      return {
        skill,
        meanMastery: 1 - need,
        expectedReinforcementCount: need * STUDENTS,
        belowTauCount: 0,
        uncertainCount: 0,
        meanEntropy: 1 - confidence,
        meanPrerequisiteProbability: preparation,
      };
    }),
    students: Array.from({ length: STUDENTS }, (_, index) => ({
      studentId: `S${index}`,
      responseCount: 2,
      skills: [],
    })),
  };
}

function rank(
  rows: Readonly<Record<string, Row>>,
  minutes = 1000,
  config?: InterventionConfig,
): InterventionRanking {
  return rankInterventions(diagnosticOf(rows), KNOWLEDGE_GRAPH, minutes, config);
}

function scoreOf(result: InterventionRanking, skill: string): InterventionScore {
  const found = result.ranking.find((item) => item.skill === skill);
  if (found === undefined) throw new Error(`Falta ${skill}`);
  return found;
}

function planSkills(result: InterventionRanking): readonly string[] {
  return result.plan.interventions.map((item) => item.skill);
}

function rankedSkills(result: InterventionRanking): readonly string[] {
  return result.ranking.map((item) => item.skill);
}

function warningsOf(result: InterventionRanking, code: string): readonly string[] {
  return result.warnings.filter((item) => item.code === code).map((item) => item.skill ?? '');
}

describe('componentes y valor individual', () => {
  it('OPS: calcula componentes, aportaciones y valor', () => {
    const score = scoreOf(rank({ OPS: { need: 0.5, confidence: 0.8 } }), 'OPS');

    expect(score.id).toBe('reinforce-OPS');
    expect(score.title).toBe('Reforzar Operaciones básicas');
    expect(score.durationMinutes).toBe(15);
    expectClose(score.components.need, 0.5);
    expectClose(score.components.relevance, 5 / 6);
    expectClose(score.components.preparation, 1);
    expectClose(score.components.confidence, 0.8);
    expectClose(score.components.priority, 1);

    // b = 0.5·(0.3·1 + 0.2·0.8 + 0.3·1) = 0.38
    expectClose(score.contributions.preparation, 0.15);
    expectClose(score.contributions.confidence, 0.08);
    expectClose(score.contributions.priority, 0.15);
    // 0.2·cobertura({OPS}) = 0.2·(5·1·0.5)/6
    expectClose(score.contributions.coverage, 1 / 12);

    expectClose(score.benefit, 0.38 + 1 / 12);
    // 0.1·15/30
    expectClose(score.cost, 0.05);
    expectClose(score.netValue, 0.33 + 1 / 12);
    expectClose(score.valuePerMinute, (0.33 + 1 / 12) / 15);
  });

  it('NEG: la preparación y la confianza reducen el beneficio', () => {
    const score = scoreOf(rank({ NEG: { need: 0.4, preparation: 0.6, confidence: 0.5 } }), 'NEG');

    // b = 0.4·(0.3·0.6 + 0.2·0.5 + 0.3·1) = 0.232; cobertura({NEG}) = 3·0.4/6 = 0.2
    expectClose(score.components.relevance, 0.5);
    expectClose(score.contributions.preparation, 0.072);
    expectClose(score.contributions.confidence, 0.04);
    expectClose(score.contributions.priority, 0.12);
    expectClose(score.contributions.coverage, 0.04);
    expectClose(score.benefit, 0.272);
    expectClose(score.netValue, 0.222);
  });

  it('ECU no tiene descendientes: relevancia y cobertura nulas', () => {
    const score = scoreOf(rank({ ECU: { need: 0.5 } }), 'ECU');

    expect(score.components.relevance).toBe(0);
    expect(score.contributions.coverage).toBe(0);
  });

  it('la suma de aportaciones es el beneficio', () => {
    const { contributions, benefit } = scoreOf(rank({ JER: { need: 0.7, preparation: 0.4, confidence: 0.3 } }), 'JER');

    expectClose(contributions.preparation + contributions.confidence + contributions.priority + contributions.coverage, benefit);
  });

  it('usa importancias y duraciones por competencia', () => {
    const config: InterventionConfig = { importance: { ECU: 0.5, ALG: 0 }, durations: { OPS: 45 } };
    const score = scoreOf(rank({ OPS: { need: 0.5 } }, 1000, config), 'OPS');

    // D = 4.5; descendientes de OPS: FRA, NEG, JER, ALG(0), ECU(0.5) = 3.5
    expectClose(score.components.relevance, 3.5 / 4.5);
    expect(score.durationMinutes).toBe(45);
    expectClose(score.cost, 0.15);
    expectClose(score.valuePerMinute, score.netValue / 45);
  });

  it('usa pesos, lambda y t_ref propios', () => {
    const config: InterventionConfig = {
      weights: { preparation: 0, confidence: 0, priority: 1, relevance: 0 },
      lambda: 0.2,
      referenceMinutes: 60,
    };
    const score = scoreOf(rank({ ECU: { need: 0.5 } }, 1000, config), 'ECU');

    expectClose(score.benefit, 0.5);
    expectClose(score.cost, 0.05);
  });
});

describe('cobertura', () => {
  it('no cuenta dos veces los descendientes compartidos', () => {
    const { plan } = rank({ OPS: { need: 0.5 }, NEG: { need: 0.25 } }, 30);

    // Descendientes: FRA, NEG, JER, ALG y ECU, cada uno con max(0.5, 0.25) = 0.5.
    expectClose(plan.coverage, 5 / 12);
    // Sumar coberturas individuales daría 5/12 + 1/8.
    expectClose(plan.benefit, 0.4 + 0.2 + 0.2 * (5 / 12));
    expectClose(plan.cost, 0.1);
    expectClose(plan.netValue, 0.5 + 1 / 12);
  });

  it('cada descendiente usa la mayor necesidad de las competencias de las que depende', () => {
    const { plan } = rank({ OPS: { need: 0.25 }, NEG: { need: 0.5 } }, 30);

    // FRA 0.25, NEG 0.25, JER 0.5, ALG 0.5, ECU 0.5; dividido entre 6.
    expectClose(plan.coverage, 2 / 6);
  });

  it('el plan completo cubre todos los descendientes una vez', () => {
    const all = Object.fromEntries(ORDER.map((skill) => [skill, { need: 1 }]));

    expectClose(rank(all, 90).plan.coverage, 5 / 6);
  });
});

describe('ranking', () => {
  it('ordena por valor neto descendente e incluye las seis competencias', () => {
    const result = rank({ ECU: { need: 0.9 }, FRA: { need: 0.2 }, ALG: { need: 0.5 } });

    expect(rankedSkills(result)).toEqual(['ECU', 'ALG', 'FRA', 'JER', 'NEG', 'OPS']);
  });

  it('los empates se ordenan por duración y después por id', () => {
    const all = Object.fromEntries(ORDER.map((skill) => [skill, { need: 0.5 }]));
    const result = rank(all, 1000, { importance: NO_IMPORTANCE, lambda: 0, durations: { NEG: 10 } });

    expect(rankedSkills(result)).toEqual(['NEG', 'ALG', 'ECU', 'FRA', 'JER', 'OPS']);
  });

  it('incluye los valores no positivos', () => {
    const result = rank({ ECU: { need: 0.5 } });

    expect(result.ranking).toHaveLength(6);
    expect(scoreOf(result, 'OPS').netValue).toBeLessThan(0);
  });

  it('añade todo el grupo empatado con el máximo actual, sin recalcularlo', () => {
    const top = 0.5;
    const ranked = rankWithTies([
      { id: 'C', durationMinutes: 10, netValue: top - 1.6e-12 },
      { id: 'B', durationMinutes: 15, netValue: top - 0.8e-12 },
      { id: 'A', durationMinutes: 15, netValue: top },
    ]);

    // Recalcular el grupo tras colocar A pondría C (más corta) antes que B.
    expect(ranked.map((item) => item.id)).toEqual(['A', 'B', 'C']);
  });

  it('dentro de un grupo manda la duración aunque el valor sea algo menor', () => {
    const ranked = rankWithTies([
      { id: 'A', durationMinutes: 15, netValue: 0.5 },
      { id: 'B', durationMinutes: 10, netValue: 0.5 - 0.5e-12 },
    ]);

    expect(ranked.map((item) => item.id)).toEqual(['B', 'A']);
  });

  it('incluye el límite de distancia exacta y separa lo que queda fuera', () => {
    const ranked = rankWithTies([
      { id: 'B', durationMinutes: 15, netValue: 1e-12 },
      { id: 'A', durationMinutes: 15, netValue: 0 },
      { id: 'C', durationMinutes: 15, netValue: 3e-12 },
    ]);

    expect(ranked.map((item) => item.id)).toEqual(['C', 'A', 'B']);
  });

  it('no altera la lista recibida', () => {
    const scores = deepFreeze([
      { id: 'B', durationMinutes: 15, netValue: 0 },
      { id: 'A', durationMinutes: 15, netValue: 1 },
    ]);

    expect(rankWithTies(scores).map((item) => item.id)).toEqual(['A', 'B']);
  });
});

describe('plan óptimo', () => {
  it('no es un prefijo del ranking', () => {
    // Sin importancias ni coste: valor = n·(0.3·prep + 0.2·conf) = 0.5·n.
    const rows = { OPS: { need: 1 }, NEG: { need: 0.8 }, FRA: { need: 0.8 } };
    const config: InterventionConfig = { importance: NO_IMPORTANCE, lambda: 0, durations: { OPS: 30 } };
    const result = rank(rows, 30, config);

    expect(result.ranking[0]?.skill).toBe('OPS');
    expectClose(scoreOf(result, 'OPS').netValue, 0.5);
    // {NEG, FRA} vale 0.8 y dura 30; el primero del ranking solo vale 0.5.
    expect(planSkills(result)).toEqual(['FRA', 'NEG']);
    expectClose(result.plan.netValue, 0.8);
  });

  it('respeta el presupuesto', () => {
    const all = Object.fromEntries(ORDER.map((skill) => [skill, { need: 1 }]));

    for (const minutes of [0, 10, 15, 29, 30, 44, 45, 60, 75, 89, 90, 500]) {
      expect(rank(all, minutes).plan.totalMinutes).toBeLessThanOrEqual(minutes);
    }
  });

  it('con presupuesto 0 calcula el ranking y deja el plan vacío', () => {
    const result = rank({ OPS: { need: 1 } }, 0);

    expect(result.ranking).toHaveLength(6);
    expect(result.plan).toEqual({ interventions: [], totalMinutes: 0, coverage: 0, benefit: 0, cost: 0, netValue: 0 });
  });

  it('con presupuesto insuficiente para cualquier intervención el plan queda vacío', () => {
    const result = rank({ OPS: { need: 1 } }, 14.9);

    expect(planSkills(result)).toEqual([]);
    expect(result.ranking).toHaveLength(6);
  });

  it('el presupuesto exacto es válido', () => {
    expect(planSkills(rank({ OPS: { need: 1 } }, 15))).toEqual(['OPS']);
  });

  it('con presupuesto suficiente incluye todo lo que compensa', () => {
    const all = Object.fromEntries(ORDER.map((skill) => [skill, { need: 1 }]));
    const { plan } = rank(all, 1000);

    // Beneficio: 6·0.8 + 0.2·(5/6). Coste: 0.1·90/30.
    expect(plan.interventions.map((item) => item.id)).toEqual(
      ['ALG', 'ECU', 'FRA', 'JER', 'NEG', 'OPS'].map((skill) => `reinforce-${skill}`),
    );
    expect(plan.totalMinutes).toBe(90);
    expectClose(plan.benefit, 4.8 + 1 / 6);
    expectClose(plan.cost, 0.3);
    expectClose(plan.netValue, 4.5 + 1 / 6);
  });

  it('queda vacío si ninguna incorporación compensa el coste', () => {
    const all = Object.fromEntries(ORDER.map((skill) => [skill, { need: 0.01 }]));
    const result = rank(all);

    expect(planSkills(result)).toEqual([]);
    expect(result.plan.netValue).toBe(0);
    for (const score of result.ranking) {
      expect(score.netValue).toBeLessThan(0);
    }
  });

  it('no usa todo el presupuesto si no compensa', () => {
    const { plan } = rank({ ECU: { need: 0.5 } }, 1000);

    expect(plan.totalMinutes).toBe(15);
  });

  it('una competencia con necesidad cero no se selecciona por su relevancia', () => {
    const result = rank({ OPS: { need: 0 }, ECU: { need: 0.5 } });

    expectClose(scoreOf(result, 'OPS').components.relevance, 5 / 6);
    expectClose(scoreOf(result, 'OPS').netValue, -0.05);
    expect(planSkills(result)).toEqual(['ECU']);
  });

  it('entre subconjuntos empatados elige la menor duración', () => {
    const rows = { FRA: { need: 0.5 }, ECU: { need: 0.5 } };
    const config: InterventionConfig = { importance: NO_IMPORTANCE, lambda: 0, durations: { ECU: 10 } };

    expect(planSkills(rank(rows, 15, config))).toEqual(['ECU']);
  });

  it('con igual valor y duración elige la lista de ids menor', () => {
    const rows = { FRA: { need: 0.5 }, ECU: { need: 0.5 }, JER: { need: 0.5 } };
    const config: InterventionConfig = { importance: NO_IMPORTANCE, lambda: 0 };

    expect(planSkills(rank(rows, 15, config))).toEqual(['ECU']);
    expect(planSkills(rank(rows, 30, config))).toEqual(['ECU', 'FRA']);
  });
});

describe('D = 0 y lambda = 0', () => {
  it('D = 0: relevancia y cobertura nulas, sin NaN', () => {
    const result = rank({ OPS: { need: 0.5 } }, 15, { importance: NO_IMPORTANCE });
    const score = scoreOf(result, 'OPS');

    expect(score.components.relevance).toBe(0);
    expect(score.contributions.coverage).toBe(0);
    expect(score.components.priority).toBe(0);
    expectClose(score.benefit, 0.25);
    expect(result.plan.coverage).toBe(0);
    expect(Number.isNaN(result.plan.netValue)).toBe(false);
  });

  it('lambda = 0: coste nulo, y una competencia sin necesidad no entra por empate', () => {
    const result = rank({ ECU: { need: 0.5 } }, 1000, { lambda: 0 });

    expect(scoreOf(result, 'ECU').cost).toBe(0);
    expect(result.plan.cost).toBe(0);
    expect(planSkills(result)).toEqual(['ECU']);
  });

  it('lambda = 0: sin necesidad, el plan queda vacío', () => {
    expect(planSkills(rank({}, 1000, { lambda: 0 }))).toEqual([]);
  });
});

describe('evidencia', () => {
  const bank = bankOf(choiceQuestion('Q1', ['OPS']));

  function answered(studentId: string): DiagnosticState {
    const result = submitAnswer(createInitialDiagnosticState(studentId), 'Q1', 'a', bank);
    if (!result.ok) throw new Error(result.error.code);
    return result.value;
  }

  it('clase vacía: ranking y plan vacíos, totales a 0 y aviso', () => {
    const result = rankInterventions(getClassDiagnostic([], KNOWLEDGE_GRAPH), KNOWLEDGE_GRAPH, 60);

    expect(result.ranking).toEqual([]);
    expect(result.plan).toEqual({ interventions: [], totalMinutes: 0, coverage: 0, benefit: 0, cost: 0, netValue: 0 });
    expect(result.basis).toBe('noStudents');
    expect(result.warnings).toEqual([
      { code: 'NO_STUDENTS', message: 'No hay alumnos para calcular recomendaciones', skill: null, ancestor: null },
    ]);
    expect(result.evidence.proportionWithoutResponses).toBeNull();
    expect(result.evidence.warnings.map((item) => item.code)).toEqual(['INSUFFICIENT_DATA']);
  });

  it('priorsOnly: ranking hipotético, plan vacío y aviso de recoger respuestas', () => {
    const states = [createInitialDiagnosticState('S1'), createInitialDiagnosticState('S2')];
    const result = rankInterventions(getClassDiagnostic(states, KNOWLEDGE_GRAPH), KNOWLEDGE_GRAPH, 1000);

    expect(result.basis).toBe('hypotheticalPriorsOnly');
    expect(result.ranking).toHaveLength(6);
    expect(result.plan.interventions).toEqual([]);
    expect(result.plan.netValue).toBe(0);
    expect(result.warnings.map((item) => item.code)).toContain('COLLECT_RESPONSES');
    expect(result.evidence.proportionWithoutResponses).toBe(1);
    expect(result.evidence.warnings.map((item) => item.code)).toEqual(['PRIOR_ONLY_ESTIMATES']);

    // n = 0.5, confianza 0: b = 0.5·(0.3 + 0.3); 0.2·cobertura = 0.2·0.5·5/6; coste 0.05.
    expectClose(scoreOf(result, 'OPS').netValue, 0.25 + 1 / 12);
  });

  it('priorsOnly: no presenta el ranking como respaldado por observaciones', () => {
    const states = [createInitialDiagnosticState('S1')];
    const result = rankInterventions(getClassDiagnostic(states, KNOWLEDGE_GRAPH), KNOWLEDGE_GRAPH, 1000);
    const warning = result.warnings.find((item) => item.code === 'COLLECT_RESPONSES');

    expect(warning?.message).toContain('hipotético');
    expect(warning?.message).toContain('recoger respuestas');
  });

  it('mixed: hay plan, y se mantienen los avisos y la proporción sin respuestas', () => {
    const states = [answered('S1'), answered('S2'), createInitialDiagnosticState('S3'), createInitialDiagnosticState('S4')];
    const result = rankInterventions(getClassDiagnostic(states, KNOWLEDGE_GRAPH), KNOWLEDGE_GRAPH, 15);

    expect(result.basis).toBe('withResponses');
    expect(result.evidence.status).toBe('mixed');
    expect(result.evidence.proportionWithoutResponses).toBe(0.5);
    expect(result.evidence.studentsWithResponses).toBe(2);
    expect(result.evidence.warnings.map((item) => item.code)).toEqual(['PRIOR_ONLY_ESTIMATES']);
    expect(result.evidence.warnings[0]?.message).toContain('2 de 4');
    expect(result.plan.interventions.length).toBeGreaterThan(0);
    expect(result.warnings.map((item) => item.code)).not.toContain('COLLECT_RESPONSES');
  });

  it('todos con respuestas: proporción 0', () => {
    expect(rank({}).evidence.proportionWithoutResponses).toBe(0);
  });
});

describe('avisos', () => {
  it.each([
    ['en el umbral', 0.5, false],
    ['a redondeo del umbral', 0.5 - 5e-13, false],
    ['fuera de la tolerancia', 0.5 - 2e-12, true],
    ['por encima', 0.6, false],
  ])('preparación %s', (_, preparation, warned) => {
    const result = rank({ JER: { need: 0.5, preparation } });

    expect(warningsOf(result, 'LOW_PREPARATION').includes('JER')).toBe(warned);
  });

  it.each([
    ['en el umbral', 0.5, false],
    ['a redondeo del umbral', 0.5 - 5e-13, false],
    ['fuera de la tolerancia', 0.5 - 2e-12, true],
    ['por encima', 0.6, false],
  ])('confianza %s', (_, confidence, warned) => {
    const result = rank({ JER: { need: 0.5, confidence } });

    expect(warningsOf(result, 'LOW_CONFIDENCE').includes('JER')).toBe(warned);
  });

  it('identifica el ancestro con menor dominio medio', () => {
    const result = rank({ OPS: { need: 0.2 }, NEG: { need: 0.7 }, JER: { preparation: 0.2 } });
    const warning = result.warnings.find((item) => item.skill === 'JER' && item.code === 'LOW_PREPARATION');

    expect(warning?.ancestor).toBe('NEG');
    expect(warning?.message).toContain('conviene reforzar antes el prerrequisito NEG');
  });

  it('considera todos los ancestros, no solo los directos', () => {
    const result = rank({ OPS: { need: 0.9 }, ECU: { preparation: 0.1 } });

    expect(result.warnings.find((item) => item.skill === 'ECU' && item.code === 'LOW_PREPARATION')?.ancestor).toBe('OPS');
  });

  it('desempata por id, también a distancia de redondeo', () => {
    const exact = rank({ OPS: { need: 0.5 }, NEG: { need: 0.5 }, JER: { preparation: 0.2 } });
    const rounded = rank({ OPS: { need: 0.5 + 5e-13 }, NEG: { need: 0.5 }, JER: { preparation: 0.2 } });
    const ancestorOf = (result: InterventionRanking): string | null | undefined =>
      result.warnings.find((item) => item.skill === 'JER' && item.code === 'LOW_PREPARATION')?.ancestor;

    expect(ancestorOf(exact)).toBe('NEG');
    expect(ancestorOf(rounded)).toBe('NEG');
  });

  it('avisa de la confianza baja con su mensaje', () => {
    const warning = rank({ ALG: { confidence: 0.2 } }).warnings.find((item) => item.code === 'LOW_CONFIDENCE');

    expect(warning?.skill).toBe('ALG');
    expect(warning?.message).toContain('considerar más evaluación antes de intervenir');
  });

  it('usa los umbrales configurados', () => {
    const rows = { JER: { preparation: 0.6, confidence: 0.6 } };
    const config: InterventionConfig = { lowPreparationThreshold: 0.7, lowConfidenceThreshold: 0.7 };

    expect(warningsOf(rank(rows), 'LOW_PREPARATION')).toEqual([]);
    expect(warningsOf(rank(rows, 1000, config), 'LOW_PREPARATION')).toEqual(['JER']);
    expect(warningsOf(rank(rows, 1000, config), 'LOW_CONFIDENCE')).toEqual(['JER']);
  });

  it('los avisos no cambian la puntuación', () => {
    const quiet = scoreOf(rank({ JER: { need: 0.5, preparation: 0.4 } }), 'JER');
    const loud = scoreOf(
      rank({ JER: { need: 0.5, preparation: 0.4 } }, 1000, { lowPreparationThreshold: 0 }),
      'JER',
    );

    expect(quiet).toEqual(loud);
  });
});

describe('salida', () => {
  const result = rank({ OPS: { need: 0.5 } }, 30);

  it('incluye la configuración efectiva con los valores por defecto', () => {
    expect(result.config).toEqual({
      weights: { preparation: 0.3, confidence: 0.2, priority: 0.3, relevance: 0.2 },
      lambda: 0.1,
      referenceMinutes: 30,
      durations: Object.fromEntries(ORDER.map((skill) => [skill, 15])),
      importance: Object.fromEntries(ORDER.map((skill) => [skill, 1])),
      lowPreparationThreshold: 0.5,
      lowConfidenceThreshold: 0.5,
    });
    expect(result.availableMinutes).toBe(30);
  });

  it('declara los SUPUESTOS y el disclaimer de heurística no causal', () => {
    expect(result.assumptions.join(' ')).toContain('SUPUESTOS no calibrados');
    expect(result.disclaimer).toContain('Heurística de priorización');
    expect(result.disclaimer).toContain('no es una estimación de efecto causal');
    expect(result.disclaimer).toContain('no genera actividades');
  });

  it('los ids son estables y los títulos salen del nombre de la competencia', () => {
    expect(ORDER.map((skill) => scoreOf(result, skill).id)).toEqual(ORDER.map((skill) => `reinforce-${skill}`));
    expect(scoreOf(result, 'ECU').title).toBe('Reforzar Ecuaciones de primer grado');
  });
});

describe('validación', () => {
  it.each([
    [{ weights: { preparation: -0.1, confidence: 0.3, priority: 0.6, relevance: 0.2 } }],
    [{ weights: { preparation: 0.5 } }],
    [{ weights: { preparation: Number.NaN } }],
    [{ weights: { preparation: '0.3' } }],
    [{ lambda: -0.1 }],
    [{ lambda: Number.POSITIVE_INFINITY }],
    [{ referenceMinutes: 0 }],
    [{ referenceMinutes: -30 }],
    [{ referenceMinutes: Number.NaN }],
    [{ durations: { OPS: 0 } }],
    [{ durations: { OPS: -15 } }],
    [{ durations: { OPS: Number.POSITIVE_INFINITY } }],
    [{ durations: { XXX: 15 } }],
    [{ importance: { OPS: -0.1 } }],
    [{ importance: { OPS: 1.1 } }],
    [{ importance: { OPS: Number.NaN } }],
    [{ importance: { XXX: 1 } }],
    [{ lowPreparationThreshold: 1.1 }],
    [{ lowConfidenceThreshold: -0.1 }],
  ])('rechaza la configuración %j', (config) => {
    expectInferenceError(() => rank({}, 60, config as unknown as InterventionConfig), 'INVALID_INTERVENTION_CONFIG');
  });

  it('acepta pesos que suman 1 dentro de la tolerancia', () => {
    const weights = { preparation: 0.3 + 5e-10, confidence: 0.2, priority: 0.3, relevance: 0.2 };

    expect(() => rank({}, 60, { weights })).not.toThrow();
  });

  it.each([[-1], [Number.NaN], [Number.POSITIVE_INFINITY], ['60']])('rechaza el presupuesto %j', (minutes) => {
    expectInferenceError(() => rank({}, minutes as unknown as number), 'INVALID_BUDGET');
  });

  it('valida la configuración y el presupuesto también con la clase vacía', () => {
    const empty = getClassDiagnostic([], KNOWLEDGE_GRAPH);

    expectInferenceError(() => rankInterventions(empty, KNOWLEDGE_GRAPH, -1), 'INVALID_BUDGET');
    expectInferenceError(() => rankInterventions(empty, KNOWLEDGE_GRAPH, 60, { lambda: -1 }), 'INVALID_INTERVENTION_CONFIG');
  });

  it('exige un grafo con las seis competencias', () => {
    const without = { nodes: KNOWLEDGE_GRAPH.nodes.filter((node) => node.id !== 'ECU') };

    expectInferenceError(() => rankInterventions(diagnosticOf(), without, 60), 'INVALID_GRAPH');
    expectInferenceError(() => rankInterventions(diagnosticOf(), null as unknown as KnowledgeGraph, 60), 'INVALID_GRAPH');
  });

  const valid = diagnosticOf({ OPS: { need: 0.5 } });
  const withSkill = (change: Partial<Record<keyof SkillClassSummary, unknown>>): ClassDiagnostic =>
    ({
      ...valid,
      skills: valid.skills.map((item) => (item.skill === 'NEG' ? { ...item, ...change } : item)),
    }) as ClassDiagnostic;

  it.each<[string, unknown]>([
    ['nulo', null],
    ['sin competencias', { ...valid, skills: undefined }],
    ['una competencia repetida', { ...valid, skills: [...valid.skills.slice(1), valid.skills[1]] }],
    ['una competencia desconocida', { ...valid, skills: valid.skills.map((item) => ({ ...item, skill: 'XXX' })) }],
    ['cinco competencias', { ...valid, skills: valid.skills.slice(1) }],
    ['studentCount negativo', { ...valid, studentCount: -1 }],
    ['studentCount decimal', { ...valid, studentCount: 1.5 }],
    ['studentCount sin coincidir con los alumnos', { ...valid, studentCount: 9, studentsWithResponses: 9 }],
    ['más alumnos con respuestas que alumnos', { ...valid, studentsWithResponses: 11 }],
    ['menos respuestas que alumnos con respuestas', { ...valid, totalResponseCount: 3 }],
    ['estado de evidencia incoherente', { ...valid, evidenceStatus: 'priorsOnly' }],
    ['insufficientData incoherente', { ...valid, insufficientData: true }],
    ['avisos que no son una lista', { ...valid, warnings: 'ninguno' }],
    ['media nula con alumnos', withSkill({ meanMastery: null })],
    ['entropía nula con alumnos', withSkill({ meanEntropy: null })],
    ['preparación nula con alumnos', withSkill({ meanPrerequisiteProbability: null })],
    ['media NaN', withSkill({ meanMastery: Number.NaN })],
    ['media mayor que 1', withSkill({ meanMastery: 1.5 })],
    ['entropía mayor que 1', withSkill({ meanEntropy: 1 + 2e-12 })],
    ['preparación negativa', withSkill({ meanPrerequisiteProbability: -0.1 })],
    ['refuerzo mayor que el número de alumnos', withSkill({ expectedReinforcementCount: 11 })],
    ['refuerzo infinito', withSkill({ expectedReinforcementCount: Number.POSITIVE_INFINITY })],
    ['dominio y necesidad incoherentes', withSkill({ meanMastery: 0.9, expectedReinforcementCount: 5 })],
    ['recuento decimal', withSkill({ belowTauCount: 1.5 })],
    ['recuento mayor que el número de alumnos', withSkill({ uncertainCount: 11 })],
  ])('rechaza un diagnóstico con %s', (_, diagnostic) => {
    expectInferenceError(
      () => rankInterventions(diagnostic as ClassDiagnostic, KNOWLEDGE_GRAPH, 60),
      'INVALID_DIAGNOSTIC',
    );
  });

  it('rechaza una competencia sin ancestros con preparación distinta de 1', () => {
    const diagnostic = {
      ...valid,
      skills: valid.skills.map((item) => (item.skill === 'OPS' ? { ...item, meanPrerequisiteProbability: 0.9 } : item)),
    };

    expectInferenceError(() => rankInterventions(diagnostic, KNOWLEDGE_GRAPH, 60), 'INVALID_DIAGNOSTIC');
  });

  it('rechaza una clase vacía con magnitudes', () => {
    const empty = getClassDiagnostic([], KNOWLEDGE_GRAPH);
    const change = (patch: object): ClassDiagnostic => ({
      ...empty,
      skills: empty.skills.map((item) => (item.skill === 'OPS' ? { ...item, ...patch } : item)),
    });

    expectInferenceError(() => rankInterventions(change({ meanMastery: 0 }), KNOWLEDGE_GRAPH, 60), 'INVALID_DIAGNOSTIC');
    expectInferenceError(
      () => rankInterventions(change({ expectedReinforcementCount: 1 }), KNOWLEDGE_GRAPH, 60),
      'INVALID_DIAGNOSTIC',
    );
  });

  it('ajusta al extremo una confianza derivada que se desvía por redondeo', () => {
    const diagnostic = withSkill({ meanEntropy: 1 + 5e-13 });
    const score = scoreOf(rankInterventions(diagnostic, KNOWLEDGE_GRAPH, 60), 'NEG');

    expect(score.components.confidence).toBe(0);
  });
});

describe('determinismo y pureza', () => {
  const rows = { OPS: { need: 0.4 }, FRA: { need: 0.6, preparation: 0.4 }, ECU: { need: 0.3, confidence: 0.2 } };

  it('no depende del orden de las competencias del diagnóstico', () => {
    const diagnostic = diagnosticOf(rows);
    const reversed = { ...diagnostic, skills: [...diagnostic.skills].reverse() };

    expect(rankInterventions(reversed, KNOWLEDGE_GRAPH, 45)).toEqual(rankInterventions(diagnostic, KNOWLEDGE_GRAPH, 45));
  });

  it('no depende del orden de los nodos del grafo', () => {
    const graph: KnowledgeGraph = { nodes: [...KNOWLEDGE_GRAPH.nodes].reverse() };

    expect(rankInterventions(diagnosticOf(rows), graph, 45)).toEqual(rank(rows, 45));
  });

  it('no depende del orden de las claves de la configuración', () => {
    const a: InterventionConfig = { durations: { OPS: 20, ECU: 10 } };
    const b: InterventionConfig = { durations: { ECU: 10, OPS: 20 } };

    expect(rank(rows, 45, a)).toEqual(rank(rows, 45, b));
  });

  it('funciona con entradas congeladas y no las altera', () => {
    const diagnostic = deepFreeze(diagnosticOf(rows));
    const graph = deepFreeze(structuredClone(KNOWLEDGE_GRAPH));
    const config = deepFreeze<InterventionConfig>({ weights: { preparation: 0.3 }, durations: { OPS: 20 } });
    const before = structuredClone(diagnostic);

    expect(() => rankInterventions(diagnostic, graph, 45, config)).not.toThrow();
    expect(diagnostic).toEqual(before);
  });

  it('las salidas no comparten objetos entre llamadas', () => {
    const empty = getClassDiagnostic([], KNOWLEDGE_GRAPH);
    const first = rankInterventions(empty, KNOWLEDGE_GRAPH, 60);
    const second = rankInterventions(empty, KNOWLEDGE_GRAPH, 60);

    expect(first.plan).not.toBe(second.plan);
    expect(first.assumptions).not.toBe(second.assumptions);
    expect(first.evidence.warnings).not.toBe(empty.warnings);
  });

  it('se serializa como JSON sin pérdidas', () => {
    const result = rank(rows, 45);

    expect(serializedCopy(result)).toEqual(result);
    expect(serializedCopy(rankInterventions(getClassDiagnostic([], KNOWLEDGE_GRAPH), KNOWLEDGE_GRAPH, 0))).toEqual(
      rankInterventions(getClassDiagnostic([], KNOWLEDGE_GRAPH), KNOWLEDGE_GRAPH, 0),
    );
  });

  it('acepta un diagnóstico serializado', () => {
    const diagnostic = serializedCopy(diagnosticOf(rows)) as ClassDiagnostic;

    expect(rankInterventions(diagnostic, KNOWLEDGE_GRAPH, 45)).toEqual(rank(rows, 45));
  });
});
