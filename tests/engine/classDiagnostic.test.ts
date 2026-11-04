import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_GRAPH,
  KnowledgeGraphError,
  RADAR_QUESTION_BANK,
  createInitialDiagnosticState,
  fixedQuestionOrder,
  getClassDiagnostic,
  requiredSkills,
  submitAnswer,
} from '../../src/engine/index.ts';
import type {
  AnswerRecord,
  ClassDiagnostic,
  ClassDiagnosticConfig,
  DiagnosticState,
  JointDistribution,
  KnowledgeGraph,
  SkillClassSummary,
  StudentSkillSummary,
} from '../../src/engine/index.ts';
import { bankOf, choiceQuestion, deepFreeze } from './support/bank.ts';
import { ORDER, binaryBits, expectClose, expectInferenceError, masteredSkills, serializedCopy } from './support/inference.ts';

const template = createInitialDiagnosticState('T');

function stateOf(studentId: string, joint: JointDistribution, responses: readonly AnswerRecord[] = []): DiagnosticState {
  return { ...template, studentId, joint, responses };
}

// Conjunta de marginales independientes, calculada sin funciones de producción.
function productJoint(probabilities: Readonly<Record<string, number>>): JointDistribution {
  return Array.from({ length: 64 }, (_, index) => {
    const mastered = masteredSkills(index);
    return ORDER.reduce((mass, skill) => {
      const probability = probabilities[skill] ?? 0.5;
      return mass * (mastered.includes(skill) ? probability : 1 - probability);
    }, 1);
  });
}

// Solo OPS con probabilidad p: dos masas, para obtener p de forma exacta.
function opsOnly(probability: number): JointDistribution {
  return Array.from({ length: 64 }, (_, index) => {
    if (index === 0) return 1 - probability;
    return index === 1 ? probability : 0;
  });
}

function massesAt(masses: Readonly<Record<number, number>>): JointDistribution {
  return Array.from({ length: 64 }, (_, index) => masses[index] ?? 0);
}

function skillOf(diagnostic: ClassDiagnostic, skill: string): SkillClassSummary {
  const found = diagnostic.skills.find((item) => item.skill === skill);
  if (found === undefined) throw new Error(`Falta la competencia ${skill}`);
  return found;
}

function studentSkill(diagnostic: ClassDiagnostic, studentId: string, skill: string): StudentSkillSummary {
  const found = diagnostic.students
    .find((student) => student.studentId === studentId)
    ?.skills.find((item) => item.skill === skill);
  if (found === undefined) throw new Error(`Falta ${studentId}/${skill}`);
  return found;
}

function diagnose(states: readonly DiagnosticState[], config?: ClassDiagnosticConfig): ClassDiagnostic {
  return getClassDiagnostic(states, KNOWLEDGE_GRAPH, config);
}

const RECORD: AnswerRecord = { questionId: 'Q1', answer: 'c', normalizedAnswer: 'c', isCorrect: true };

describe('agregación por competencia', () => {
  const diagnostic = diagnose([
    stateOf('S1', productJoint({ OPS: 0.2 })),
    stateOf('S2', productJoint({ OPS: 0.6 })),
    stateOf('S3', productJoint({ OPS: 0.9 })),
  ]);
  const ops = skillOf(diagnostic, 'OPS');

  it('calcula la media de probabilidad de dominio', () => {
    expectClose(ops.meanMastery ?? Number.NaN, (0.2 + 0.6 + 0.9) / 3);
  });

  it('calcula el número esperado que necesita refuerzo', () => {
    expectClose(ops.expectedReinforcementCount, 0.8 + 0.4 + 0.1);
  });

  it('cuenta alumnos bajo tau y con estimación incierta', () => {
    expect(ops.belowTauCount).toBe(1);
    expect(ops.uncertainCount).toBe(1);
  });

  it('calcula la entropía binaria media', () => {
    expectClose(ops.meanEntropy ?? Number.NaN, (binaryBits(0.2) + binaryBits(0.6) + binaryBits(0.9)) / 3);
  });

  it('da las competencias en el orden de codificación y los alumnos por id', () => {
    expect(diagnostic.skills.map((item) => item.skill)).toEqual(ORDER);
    expect(diagnostic.students.map((student) => student.studentId)).toEqual(['S1', 'S2', 'S3']);
    for (const student of diagnostic.students) {
      expect(student.skills.map((item) => item.skill)).toEqual(ORDER);
    }
  });

  it('detalla la probabilidad y la entropía por alumno', () => {
    const row = studentSkill(diagnostic, 'S1', 'OPS');

    expectClose(row.masteryProbability, 0.2);
    expectClose(row.entropy, binaryBits(0.2));
  });
});

describe('preparación: todos los ancestros', () => {
  const p = 0.8;
  const all = Object.fromEntries(ORDER.map((skill) => [skill, p]));
  const diagnostic = diagnose([stateOf('S1', productJoint(all))]);

  it.each([
    ['OPS', 1],
    ['NEG', p],
    ['FRA', p],
    ['JER', p ** 2],
    ['ALG', p ** 4],
    ['ECU', p ** 5],
  ])('%s con marginales independientes', (skill, expected) => {
    expectClose(studentSkill(diagnostic, 'S1', skill).prerequisiteProbability, expected);
    expectClose(skillOf(diagnostic, skill).meanPrerequisiteProbability ?? Number.NaN, expected);
  });

  it('sin ancestros vale 1 exactamente', () => {
    expect(studentSkill(diagnostic, 'S1', 'OPS').prerequisiteProbability).toBe(1);
  });

  it('distingue dos conjuntas con iguales marginales y distinta dependencia', () => {
    const correlated = stateOf('S1', massesAt({ 0: 0.5, 3: 0.5 }));
    const independent = stateOf('S2', massesAt({ 0: 0.25, 1: 0.25, 2: 0.25, 3: 0.25 }));
    const result = diagnose([correlated, independent]);

    expect(studentSkill(result, 'S1', 'OPS').masteryProbability).toBe(0.5);
    expect(studentSkill(result, 'S2', 'OPS').masteryProbability).toBe(0.5);
    expect(studentSkill(result, 'S1', 'NEG').masteryProbability).toBe(0.5);
    expect(studentSkill(result, 'S2', 'NEG').masteryProbability).toBe(0.5);

    expect(studentSkill(result, 'S1', 'JER').prerequisiteProbability).toBe(0.5);
    expect(studentSkill(result, 'S2', 'JER').prerequisiteProbability).toBe(0.25);
    expect(skillOf(result, 'JER').meanPrerequisiteProbability).toBe(0.375);
  });

  it('usa los ancestros, no solo los prerrequisitos directos', () => {
    // ECU tiene ALG como único prerrequisito directo; aquí se domina ALG sin OPS.
    const result = diagnose([stateOf('S1', massesAt({ 16: 1 }))]);

    expect(studentSkill(result, 'S1', 'ECU').prerequisiteProbability).toBe(0);
  });
});

describe('umbrales', () => {
  it.each([
    [0.5, 0, 1],
    [0.3, 1, 0],
    [0.7, 0, 0],
    [0.29, 1, 0],
    [0.31, 1, 1],
    [0.49, 1, 1],
    [0.51, 0, 1],
    [0.69, 0, 1],
    [0.71, 0, 0],
    [0, 1, 0],
    [1, 0, 0],
  ])('con p = %d: bajo tau %i, incierta %i', (probability, below, uncertain) => {
    const diagnostic = diagnose([stateOf('S1', opsOnly(probability))]);
    const ops = skillOf(diagnostic, 'OPS');

    expect(studentSkill(diagnostic, 'S1', 'OPS').masteryProbability).toBe(probability);
    expect(ops.belowTauCount).toBe(below);
    expect(ops.uncertainCount).toBe(uncertain);
  });

  it('el límite de 0.5 cuenta como incierto y no bajo tau', () => {
    const ops = skillOf(diagnose([stateOf('S1', opsOnly(0.5))]), 'OPS');

    expect(ops.belowTauCount).toBe(0);
    expect(ops.uncertainCount).toBe(1);
  });

  it.each([
    ['a redondeo de tau', 0.5 - 5e-13, 0, 1],
    ['fuera de la tolerancia de tau', 0.5 - 2e-12, 1, 1],
    ['a redondeo del límite inferior', 0.3 + 5e-13, 1, 0],
    ['fuera de la tolerancia del límite inferior', 0.3 + 2e-12, 1, 1],
    ['a redondeo del límite superior', 0.7 - 5e-13, 0, 0],
    ['fuera de la tolerancia del límite superior', 0.7 - 2e-12, 0, 1],
  ])('un valor %s se cuenta según corresponda', (_, probability, below, uncertain) => {
    const ops = skillOf(diagnose([stateOf('S1', opsOnly(probability))]), 'OPS');

    expect(ops.belowTauCount).toBe(below);
    expect(ops.uncertainCount).toBe(uncertain);
  });

  it('el redondeo no cuenta como bajo tau las competencias sin evidencia', () => {
    const order = fixedQuestionOrder(RADAR_QUESTION_BANK, KNOWLEDGE_GRAPH);
    const questionById = new Map(RADAR_QUESTION_BANK.questions.map((question) => [question.id, question]));
    let checked = 0;
    let offThreshold = 0;

    for (let start = 0; start < 30; start += 1) {
      for (const count of [1, 2, 3]) {
        let state = createInitialDiagnosticState('S1');
        const touched = new Set<string>();
        for (let step = 0; step < count; step += 1) {
          const question = questionById.get(order[(start + step * 7) % 30] ?? '');
          if (question === undefined) throw new Error('Pregunta inexistente');
          const result = submitAnswer(state, question.id, question.correctAnswer, RADAR_QUESTION_BANK);
          if (!result.ok) throw new Error(result.error.code);
          state = result.value;
          requiredSkills(question).forEach((skill) => touched.add(skill));
        }

        const diagnostic = diagnose([state]);
        for (const skill of ORDER.filter((item) => !touched.has(item))) {
          checked += 1;
          if (studentSkill(diagnostic, 'S1', skill).masteryProbability !== 0.5) offThreshold += 1;
          expect(skillOf(diagnostic, skill).belowTauCount).toBe(0);
          expect(skillOf(diagnostic, skill).uncertainCount).toBe(1);
        }
      }
    }

    expect(checked).toBeGreaterThan(0);
    expect(offThreshold).toBeGreaterThan(0);
  });

  it('respeta una configuración propia, con comparaciones estrictas', () => {
    const config = { tau: 0.25, lowerUncertainty: 0.25, upperUncertainty: 0.75 };
    const at = (probability: number): SkillClassSummary =>
      skillOf(diagnose([stateOf('S1', opsOnly(probability))], config), 'OPS');

    expect(at(0.25).belowTauCount).toBe(0);
    expect(at(0.25).uncertainCount).toBe(0);
    expect(at(0.75).uncertainCount).toBe(0);
    expect(at(0.5).uncertainCount).toBe(1);
  });

  it('documenta los valores efectivos', () => {
    const expected = { tau: 0.5, lowerUncertainty: 0.3, upperUncertainty: 0.7 };

    expect(diagnose([]).config).toEqual(expected);
    expect(diagnose([], { tau: 0.4 }).config).toEqual({ ...expected, tau: 0.4 });
  });

  it('no copia claves desconocidas al resultado', () => {
    const config = { tau: 0.4, extra: 1 } as ClassDiagnosticConfig;

    expect(Object.keys(diagnose([], config).config).sort()).toEqual(['lowerUncertainty', 'tau', 'upperUncertainty']);
  });

  it('acepta los extremos del intervalo', () => {
    expect(() => diagnose([], { tau: 0, lowerUncertainty: 0, upperUncertainty: 1 })).not.toThrow();
    expect(() => diagnose([], { tau: 1 })).not.toThrow();
  });

  it.each([
    [{ tau: -0.1 }],
    [{ tau: 1.1 }],
    [{ tau: Number.NaN }],
    [{ lowerUncertainty: Number.POSITIVE_INFINITY }],
    [{ upperUncertainty: 2 }],
    [{ tau: '0.5' }],
    [{ tau: null }],
    [{ lowerUncertainty: 0.7, upperUncertainty: 0.3 }],
    [{ lowerUncertainty: 0.5, upperUncertainty: 0.5 }],
    [{ lowerUncertainty: 0.8 }],
  ])('rechaza la configuración %j', (config) => {
    expectInferenceError(() => diagnose([], config as unknown as ClassDiagnosticConfig), 'INVALID_CLASS_CONFIG');
  });
});

describe('clase vacía', () => {
  const diagnostic = diagnose([]);

  it('da recuentos y sumas a cero', () => {
    expect(diagnostic.studentCount).toBe(0);
    expect(diagnostic.studentsWithResponses).toBe(0);
    expect(diagnostic.totalResponseCount).toBe(0);
    expect(diagnostic.students).toEqual([]);
  });

  it('da null en medias y preparación, para las seis competencias', () => {
    expect(diagnostic.skills.map((item) => item.skill)).toEqual(ORDER);
    for (const skill of diagnostic.skills) {
      expect(skill).toEqual({
        skill: skill.skill,
        meanMastery: null,
        expectedReinforcementCount: 0,
        belowTauCount: 0,
        uncertainCount: 0,
        meanEntropy: null,
        meanPrerequisiteProbability: null,
      });
    }
  });

  it('avisa de que no hay datos suficientes', () => {
    expect(diagnostic.insufficientData).toBe(true);
    expect(diagnostic.evidenceStatus).toBe('emptyClass');
    expect(diagnostic.warnings.map((warning) => warning.code)).toEqual(['INSUFFICIENT_DATA']);
  });

  it('se serializa conservando null y sin NaN', () => {
    const text = JSON.stringify(diagnostic);

    expect(serializedCopy(diagnostic)).toEqual(diagnostic);
    expect(text).toContain('"meanMastery":null');
    expect(text).not.toContain('NaN');
  });
});

describe('cobertura de evidencia', () => {
  const bank = bankOf(choiceQuestion('Q1', ['OPS']), choiceQuestion('Q2', ['NEG']));

  function answered(studentId: string, ...ids: readonly string[]): DiagnosticState {
    return ids.reduce<DiagnosticState>((state, id) => {
      const result = submitAnswer(state, id, 'c', bank);
      if (!result.ok) throw new Error(result.error.code);
      return result.value;
    }, createInitialDiagnosticState(studentId));
  }

  it('una clase de un alumno sin respuestas', () => {
    const diagnostic = diagnose([createInitialDiagnosticState('S1')]);

    expect(diagnostic.studentCount).toBe(1);
    expect(diagnostic.evidenceStatus).toBe('priorsOnly');
    expect(diagnostic.insufficientData).toBe(false);
    expect(skillOf(diagnostic, 'OPS').meanMastery).toBe(0.5);
    expect(skillOf(diagnostic, 'OPS').expectedReinforcementCount).toBe(0.5);
    expect(skillOf(diagnostic, 'OPS').meanEntropy).toBe(1);
  });

  it('solo priors: avisa de que todas las estimaciones proceden del prior', () => {
    const diagnostic = diagnose([createInitialDiagnosticState('S1'), createInitialDiagnosticState('S2')]);

    expect(diagnostic.evidenceStatus).toBe('priorsOnly');
    expect(diagnostic.studentsWithResponses).toBe(0);
    expect(diagnostic.totalResponseCount).toBe(0);
    expect(diagnostic.warnings.map((warning) => warning.code)).toEqual(['PRIOR_ONLY_ESTIMATES']);
    expect(diagnostic.warnings[0]?.message).toContain('Ningún alumno');
  });

  it('mezcla: todos participan y se avisa de cuántos solo tienen prior', () => {
    const diagnostic = diagnose([answered('S1', 'Q1', 'Q2'), createInitialDiagnosticState('S2')]);

    expect(diagnostic.evidenceStatus).toBe('mixed');
    expect(diagnostic.studentCount).toBe(2);
    expect(diagnostic.studentsWithResponses).toBe(1);
    expect(diagnostic.totalResponseCount).toBe(2);
    expect(diagnostic.warnings.map((warning) => warning.code)).toEqual(['PRIOR_ONLY_ESTIMATES']);
    expect(diagnostic.warnings[0]?.message).toContain('1 de 2');
    expectClose(skillOf(diagnostic, 'OPS').meanMastery ?? Number.NaN, (18 / 23 + 0.5) / 2);
  });

  it('todos con respuestas: sin aviso de prior', () => {
    const diagnostic = diagnose([answered('S1', 'Q1'), answered('S2', 'Q1', 'Q2')]);

    expect(diagnostic.evidenceStatus).toBe('allWithResponses');
    expect(diagnostic.studentsWithResponses).toBe(2);
    expect(diagnostic.totalResponseCount).toBe(3);
    expect(diagnostic.warnings).toEqual([]);
  });

  it('cuenta las respuestas de cada alumno', () => {
    const diagnostic = diagnose([answered('S1', 'Q1', 'Q2'), createInitialDiagnosticState('S2')]);

    expect(diagnostic.students.map((student) => student.responseCount)).toEqual([2, 0]);
  });

  it('avisa de que las cifras no son diagnósticos confirmados', () => {
    const { disclaimer } = diagnose([]);

    expect(disclaimer).toContain('no diagnósticos confirmados');
    expect(disclaimer).toContain('no es un recuento de alumnos observados con dificultad');
    expect(disclaimer).toContain('no indica cuántas competencias se han medido');
  });
});

describe('validación', () => {
  const valid = stateOf('S1', template.joint);

  it('rechaza alumnos duplicados', () => {
    expectInferenceError(() => diagnose([valid, stateOf('S1', opsOnly(0.2))]), 'DUPLICATE_STUDENT');
  });

  it.each([
    ['studentId vacío', { studentId: '  ' }, 'INVALID_STATE'],
    ['skillOrder permutado', { skillOrder: ['NEG', 'OPS', 'FRA', 'JER', 'ALG', 'ECU'] }, 'INVALID_STATE'],
    ['skillOrder corto', { skillOrder: ['OPS'] }, 'INVALID_STATE'],
    ['distribución corta', { joint: [1] }, 'INVALID_DISTRIBUTION'],
    ['distribución sin normalizar', { joint: template.joint.map((mass) => mass * 2) }, 'INVALID_DISTRIBUTION'],
    ['priorConfig ausente', { priorConfig: undefined }, 'INVALID_PRIOR'],
    ['priorConfig incompleta', { priorConfig: { marginals: {}, compatibility: null } }, 'INVALID_PRIOR'],
    ['historial que no es una lista', { responses: 'Q1' }, 'INVALID_HISTORY'],
    ['pregunta repetida', { responses: [RECORD, RECORD] }, 'INVALID_HISTORY'],
    ['registro nulo', { responses: [null] }, 'INVALID_HISTORY'],
    ['id de pregunta vacío', { responses: [{ ...RECORD, questionId: ' ' }] }, 'INVALID_HISTORY'],
    ['isCorrect sin tipo correcto', { responses: [{ ...RECORD, isCorrect: 'true' }] }, 'INVALID_HISTORY'],
    ['respuesta sin tipo correcto', { responses: [{ ...RECORD, answer: 3 }] }, 'INVALID_HISTORY'],
    ['respuesta normalizada ausente', { responses: [{ ...RECORD, normalizedAnswer: undefined }] }, 'INVALID_HISTORY'],
  ] as const)('rechaza un estado con %s', (_, change, code) => {
    const state = { ...valid, ...change } as unknown as DiagnosticState;

    expectInferenceError(() => diagnose([state]), code);
  });

  it('rechaza entradas que no son estados', () => {
    expectInferenceError(() => diagnose([null as unknown as DiagnosticState]), 'INVALID_STATE');
    expectInferenceError(() => diagnose('S1' as unknown as DiagnosticState[]), 'INVALID_STATE');
  });

  it('sin banco no puede verificar la pregunta ni la corrección de una respuesta', () => {
    const record: AnswerRecord = { questionId: 'NO-EXISTE', answer: 'x', normalizedAnswer: 'y', isCorrect: true };

    expect(() => diagnose([stateOf('S1', template.joint, [record])])).not.toThrow();
  });

  it('no compara el posterior con el prior', () => {
    expect(() => diagnose([stateOf('S1', opsOnly(0.9))])).not.toThrow();
  });

  it('exige un grafo con exactamente las seis competencias', () => {
    const extra = { id: 'XXX', name: 'X', description: 'X', prerequisites: [] };
    const without = KNOWLEDGE_GRAPH.nodes.filter((node) => node.id !== 'ECU');

    expectInferenceError(() => getClassDiagnostic([], { nodes: without }), 'INVALID_GRAPH');
    expectInferenceError(() => getClassDiagnostic([], { nodes: [...without, extra] }), 'INVALID_GRAPH');
    expectInferenceError(() => getClassDiagnostic([], { nodes: [...KNOWLEDGE_GRAPH.nodes, extra] }), 'INVALID_GRAPH');
    expectInferenceError(() => getClassDiagnostic([], { nodes: [] }), 'INVALID_GRAPH');
    expectInferenceError(() => getClassDiagnostic([], null as unknown as KnowledgeGraph), 'INVALID_GRAPH');
  });

  it('propaga el error de un grafo con estructura inválida', () => {
    const cyclic: KnowledgeGraph = {
      nodes: KNOWLEDGE_GRAPH.nodes.map((node) => (node.id === 'OPS' ? { ...node, prerequisites: ['ECU'] } : node)),
    };

    expect(() => getClassDiagnostic([], cyclic)).toThrow(KnowledgeGraphError);
  });
});

describe('distribuciones aceptadas dentro de la tolerancia', () => {
  it.each([[1 + 5e-10], [1 - 5e-10]])('dan los mismos resultados al escalar por %d', (factor) => {
    const joints = [productJoint({ OPS: 0.2, NEG: 0.8 }), productJoint({ OPS: 0.6, ALG: 0.3 }), opsOnly(0.9)];
    const expected = diagnose(joints.map((joint, index) => stateOf(`S${index}`, joint)));
    const scaled = diagnose(
      joints.map((joint, index) => stateOf(`S${index}`, joint.map((mass) => mass * factor))),
    );

    scaled.skills.forEach((skill, index) => {
      const reference = expected.skills[index];
      expectClose(skill.meanMastery ?? Number.NaN, reference?.meanMastery ?? Number.NaN);
      expectClose(skill.expectedReinforcementCount, reference?.expectedReinforcementCount ?? Number.NaN);
      expectClose(skill.meanEntropy ?? Number.NaN, reference?.meanEntropy ?? Number.NaN);
      expectClose(skill.meanPrerequisiteProbability ?? Number.NaN, reference?.meanPrerequisiteProbability ?? Number.NaN);
      expect(skill.belowTauCount).toBe(reference?.belowTauCount);
      expect(skill.uncertainCount).toBe(reference?.uncertainCount);
    });
  });
});

describe('determinismo y pureza', () => {
  const states = [
    stateOf('S10', productJoint({ OPS: 0.2 })),
    stateOf('S2', productJoint({ NEG: 0.7 })),
    stateOf('a', productJoint({ ALG: 0.9 }), [RECORD]),
    stateOf('B', productJoint({ ECU: 0.1 })),
  ];

  it('ordena los alumnos por id lexicográfico', () => {
    expect(diagnose(states).students.map((student) => student.studentId)).toEqual(['B', 'S10', 'S2', 'a']);
  });

  it('permutar los alumnos no altera el resultado', () => {
    const expected = diagnose(states);

    expect(diagnose([...states].reverse())).toEqual(expected);
    expect(diagnose([states[2], states[0], states[3], states[1]] as DiagnosticState[])).toEqual(expected);
  });

  it('permutar los nodos del grafo no altera el resultado', () => {
    const reversed: KnowledgeGraph = { nodes: [...KNOWLEDGE_GRAPH.nodes].reverse() };

    expect(getClassDiagnostic(states, reversed)).toEqual(diagnose(states));
  });

  it('funciona con entradas congeladas y no las altera', () => {
    const frozen = deepFreeze(structuredClone(states));
    const graph = deepFreeze(structuredClone(KNOWLEDGE_GRAPH));
    const config = deepFreeze({ tau: 0.4 });
    const before = structuredClone(frozen);

    expect(() => getClassDiagnostic(frozen, graph, config)).not.toThrow();
    expect(frozen).toEqual(before);
  });

  it('se serializa como JSON sin pérdidas', () => {
    const diagnostic = diagnose(states);

    expect(serializedCopy(diagnostic)).toEqual(diagnostic);
  });

  it('un estado serializado sigue siendo aceptado', () => {
    const copy = serializedCopy(states) as DiagnosticState[];

    expect(diagnose(copy)).toEqual(diagnose(states));
  });
});
