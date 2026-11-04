import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_GRAPH,
  KnowledgeGraphError,
  QuestionBankError,
  RADAR_QUESTION_BANK,
  ancestors,
  isCanonicalRational,
  validateQuestionBank,
} from '../../src/engine/index.ts';
import type {
  KnowledgeGraph,
  MultipleChoiceQuestion,
  NumericQuestion,
  Question,
  QuestionBank,
  QuestionBankErrorCode,
  QuestionOption,
} from '../../src/engine/index.ts';

const { questions } = RADAR_QUESTION_BANK;
const multipleChoice = questions.filter((question) => question.format === 'multipleChoice');
const numeric = questions.filter((question) => question.format === 'numeric');

const validOptions: readonly QuestionOption[] = [
  { id: 'a', text: '1', value: '1/1', misconception: null },
  { id: 'b', text: '2', value: '2/1', misconception: 'Error A.' },
  { id: 'c', text: 'dos más uno', value: '3/1', misconception: 'Error B.' },
  { id: 'd', text: 'x', value: null, misconception: 'Error C.' },
];

const validChoice: MultipleChoiceQuestion = {
  id: 'Q1',
  format: 'multipleChoice',
  statement: 'Enunciado.',
  primarySkill: 'OPS',
  secondarySkills: [],
  difficulty: 1,
  slip: 0.1,
  guess: 0.25,
  options: validOptions,
  correctAnswer: 'a',
  explanation: 'Explicación.',
  assumptionNote: 'Nota.',
};

const validNumeric: NumericQuestion = {
  id: 'Q2',
  format: 'numeric',
  statement: 'Enunciado.',
  primarySkill: 'NEG',
  secondarySkills: ['OPS'],
  difficulty: 2,
  slip: 0.1,
  guess: 0.02,
  correctAnswer: '-1/2',
  explanation: 'Explicación.',
  assumptionNote: 'Nota.',
};

function bankOf(...items: readonly unknown[]): QuestionBank {
  return { questions: items as readonly Question[] };
}

function withOption(index: number, change: Partial<QuestionOption>): MultipleChoiceQuestion {
  return {
    ...validChoice,
    options: validOptions.map((option, position) => (position === index ? { ...option, ...change } : option)),
  };
}

function expectBankError(
  bank: QuestionBank,
  code: QuestionBankErrorCode,
  questionId: string | null = 'Q1',
): void {
  let caught: unknown;
  try {
    validateQuestionBank(bank, KNOWLEDGE_GRAPH);
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(QuestionBankError);
  expect(caught).toMatchObject({ name: 'QuestionBankError', code, questionId });
}

function secondarySkillsOf(id: string): readonly string[] | undefined {
  return questions.find((question) => question.id === id)?.secondarySkills;
}

function isDeepFrozen(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return true;
  return Object.isFrozen(value) && Object.values(value).every(isDeepFrozen);
}

function deepFrozen<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFrozen);
    Object.freeze(value);
  }
  return value;
}

describe('banco RADAR incluido', () => {
  it('pasa la validación contra el grafo real', () => {
    expect(() => validateQuestionBank(RADAR_QUESTION_BANK, KNOWLEDGE_GRAPH)).not.toThrow();
  });

  it('tiene 30 preguntas y exactamente cinco por competencia principal', () => {
    expect(questions).toHaveLength(30);
    for (const node of KNOWLEDGE_GRAPH.nodes) {
      expect(questions.filter((question) => question.primarySkill === node.id)).toHaveLength(5);
    }
  });

  it('tiene ids estables y únicos', () => {
    const expected = ['OPS', 'NEG', 'FRA', 'JER', 'ALG', 'ECU'].flatMap((skill) =>
      [1, 2, 3, 4, 5].map((number) => `${skill}-0${number}`),
    );

    expect(questions.map((question) => question.id)).toEqual(expected);
    expect(new Set(expected).size).toBe(30);
  });

  it('tiene al menos seis preguntas multicompetencia', () => {
    const multiSkill = questions.filter((question) => question.secondarySkills.length > 0);

    expect(multiSkill.length).toBeGreaterThanOrEqual(6);
    expect(multiSkill.map((question) => question.id)).toEqual([
      'FRA-04',
      'JER-04',
      'JER-05',
      'ALG-04',
      'ALG-05',
      'ECU-04',
      'ECU-05',
    ]);
  });

  it('fija las competencias supuestas de ECU-03 y ECU-04', () => {
    expect(secondarySkillsOf('ECU-03')).toEqual([]);
    expect(secondarySkillsOf('ECU-04')).toEqual(['NEG', 'ALG']);
  });

  it('asigna las secundarias ítem a ítem, sin derivarlas de los ancestros', () => {
    expect(ancestors(KNOWLEDGE_GRAPH, 'ECU')).toContain('ALG');
    expect(secondarySkillsOf('ECU-01')).toEqual([]);

    expect(ancestors(KNOWLEDGE_GRAPH, 'ALG')).toEqual(['OPS', 'FRA', 'NEG', 'JER']);
    expect(secondarySkillsOf('ALG-04')).toEqual(['NEG']);

    expect(ancestors(KNOWLEDGE_GRAPH, 'JER')).not.toContain('FRA');
    expect(secondarySkillsOf('JER-05')).toEqual(['FRA']);
  });

  it('cubre las tres dificultades en cada competencia', () => {
    for (const node of KNOWLEDGE_GRAPH.nodes) {
      const levels = questions
        .filter((question) => question.primarySkill === node.id)
        .map((question) => question.difficulty);
      expect(new Set(levels)).toEqual(new Set([1, 2, 3]));
    }
  });

  it('mantiene slip en el rango supuesto de §2.2', () => {
    for (const question of questions) {
      expect(question.slip).toBeGreaterThanOrEqual(0.05);
      expect(question.slip).toBeLessThanOrEqual(0.2);
    }
  });

  it('declara en cada pregunta que los parámetros son SUPUESTOS y el nivel está sin revisar', () => {
    for (const question of questions) {
      expect(question.assumptionNote).toContain('SUPUESTOS no calibrados');
      expect(question.assumptionNote).toContain('pendiente de revisión docente');
    }
  });

  it('identifica R_q como hipótesis no validada en todas las notas', () => {
    for (const question of questions) {
      expect(question.assumptionNote).toContain('R_q es una hipótesis de modelado no validada');
      expect(question.assumptionNote).toContain('reduce la probabilidad de acierto a guess');
      expect(question.assumptionNote).toContain('estrategias alternativas');
      expect(question.assumptionNote).toContain('No hay validación con alumnos ni revisión docente');
    }
  });

  it('razona las secundarias como supuestos, no como requisitos demostrados', () => {
    for (const question of questions.filter((item) => item.secondarySkills.length > 0)) {
      expect(question.assumptionNote).toMatch(/SUPUESTO razonado:|Hipótesis no validada:/);
      expect(question.assumptionNote).not.toContain('es secundaria porque');
    }
    expect(questions.find((question) => question.id === 'ECU-04')?.assumptionNote).toContain('Hipótesis no validada:');
  });

  it('incluye los dos formatos', () => {
    expect(multipleChoice.length + numeric.length).toBe(30);
    expect(multipleChoice.length).toBeGreaterThan(0);
    expect(numeric.length).toBeGreaterThan(0);
  });

  it('no coloca sistemáticamente la correcta en la misma posición', () => {
    const positions = multipleChoice.map((question) =>
      question.options.findIndex((option) => option.id === question.correctAnswer),
    );
    const counts = [0, 1, 2, 3].map((position) => positions.filter((item) => item === position).length);

    expect(Math.min(...counts)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...counts)).toBeLessThanOrEqual(multipleChoice.length / 2);
  });

  it('usa respuestas numéricas canónicas', () => {
    for (const question of numeric) {
      expect(isCanonicalRational(question.correctAnswer)).toBe(true);
    }
  });

  it('conserva un valor racional en las opciones que representan números', () => {
    const ids = multipleChoice.flatMap((question) =>
      question.options.filter((option) => /^-?\d/.test(option.text) && !/[a-z]/.test(option.text) && option.value === null),
    );

    expect(ids).toEqual([]);
  });

  it('describe el error de cada distractor', () => {
    for (const question of multipleChoice) {
      for (const option of question.options) {
        if (option.id === question.correctAnswer) {
          expect(option.misconception).toBeNull();
        } else {
          expect(option.misconception).toEqual(expect.stringMatching(/\S/));
        }
      }
    }
  });

  it('está congelado y se serializa como JSON sin pérdidas', () => {
    expect(isDeepFrozen(RADAR_QUESTION_BANK)).toBe(true);
    expect(JSON.parse(JSON.stringify(RADAR_QUESTION_BANK))).toEqual(RADAR_QUESTION_BANK);
  });

  it('coincide con la tabla de docs/engine/BANCO.md', () => {
    const document = readFileSync(new URL('../../docs/engine/BANCO.md', import.meta.url), 'utf8');

    for (const question of questions) {
      const row = document.split('\n').find((line) => line.startsWith(`| ${question.id} |`));
      expect(row).toBeDefined();
      const solution =
        question.format === 'numeric'
          ? question.correctAnswer
          : question.options.find((option) => option.id === question.correctAnswer)?.text;
      expect(row).toContain(`\`${solution}\``);
      expect(row).toContain(`| ${question.primarySkill} | ${question.secondarySkills.join(', ') || '—'} |`);
    }
  });
});

describe('validateQuestionBank acepta', () => {
  it('un banco vacío', () => {
    expect(() => validateQuestionBank({ questions: [] }, KNOWLEDGE_GRAPH)).not.toThrow();
    expect(() => validateQuestionBank({ questions: [] }, { nodes: [] })).not.toThrow();
  });

  it('bancos genéricos sin las exigencias de tamaño del banco RADAR', () => {
    expect(() => validateQuestionBank(bankOf(validChoice, validNumeric), KNOWLEDGE_GRAPH)).not.toThrow();
  });

  it('opciones sin valor numérico y valores con texto no numérico', () => {
    const question = withOption(3, { text: 'tres cuartos', value: '3/4' });

    expect(() => validateQuestionBank(bankOf(question), KNOWLEDGE_GRAPH)).not.toThrow();
  });

  it('un ítem que declara todos sus ancestros como secundarias', () => {
    const secondarySkills = ancestors(KNOWLEDGE_GRAPH, 'ALG');
    const question = { ...validChoice, primarySkill: 'ALG', secondarySkills };

    expect(() => validateQuestionBank(bankOf(question), KNOWLEDGE_GRAPH)).not.toThrow();
  });

  it('las secundarias tal como están, sin completarlas ni recortarlas', () => {
    const none = { ...validChoice, id: 'Q3', primarySkill: 'ECU', secondarySkills: [] };
    const some = { ...validChoice, id: 'Q4', primarySkill: 'ECU', secondarySkills: ['FRA'] };
    const bank = bankOf(none, some);

    validateQuestionBank(bank, KNOWLEDGE_GRAPH);

    expect(bank.questions.map((question) => question.secondarySkills)).toEqual([[], ['FRA']]);
  });

  it('parámetros extremos que cumplen la restricción, sin modificarlos', () => {
    const question = { ...validChoice, slip: 1e-12, guess: 1e-12 };

    expect(() => validateQuestionBank(bankOf(question), KNOWLEDGE_GRAPH)).not.toThrow();
    expect(question.slip).toBe(1e-12);
  });

  it('entradas congeladas sin alterarlas', () => {
    const bank = deepFrozen(structuredClone(bankOf(validChoice, validNumeric)));
    const graph: KnowledgeGraph = deepFrozen(structuredClone(KNOWLEDGE_GRAPH));
    const before = structuredClone(bank);

    expect(() => validateQuestionBank(bank, graph)).not.toThrow();
    expect(bank).toEqual(before);
  });
});

describe('validateQuestionBank rechaza', () => {
  it.each([[''], ['   ']])('un id de pregunta vacío: %j', (id) => {
    expectBankError(bankOf({ ...validChoice, id }), 'INVALID_QUESTION_ID', null);
  });

  it('ids de pregunta duplicados', () => {
    expectBankError(bankOf(validChoice, validChoice), 'DUPLICATE_QUESTION_ID');
  });

  it('una competencia principal inexistente', () => {
    expectBankError(bankOf({ ...validChoice, primarySkill: 'XXX' }), 'UNKNOWN_SKILL');
  });

  it('una competencia secundaria inexistente', () => {
    expectBankError(bankOf({ ...validChoice, secondarySkills: ['XXX'] }), 'UNKNOWN_SKILL');
  });

  it('una competencia que no existe en el grafo recibido', () => {
    expect(() => validateQuestionBank(bankOf(validChoice), { nodes: [] })).toThrow(
      expect.objectContaining({ code: 'UNKNOWN_SKILL', questionId: 'Q1' }),
    );
  });

  it('un grafo inválido', () => {
    const cyclic: KnowledgeGraph = {
      nodes: [
        { id: 'A', name: 'A', description: 'A', prerequisites: ['B'] },
        { id: 'B', name: 'B', description: 'B', prerequisites: ['A'] },
      ],
    };

    expect(() => validateQuestionBank({ questions: [] }, cyclic)).toThrow(KnowledgeGraphError);
  });

  it('secundarias duplicadas', () => {
    expectBankError(bankOf({ ...validChoice, secondarySkills: ['NEG', 'NEG'] }), 'DUPLICATE_SECONDARY_SKILL');
  });

  it('una secundaria que repite la principal', () => {
    expectBankError(bankOf({ ...validChoice, secondarySkills: ['OPS'] }), 'SECONDARY_REPEATS_PRIMARY');
  });

  it.each([[0], [4], [1.5], ['2'], [null]])('la dificultad %j', (difficulty) => {
    expectBankError(bankOf({ ...validChoice, difficulty }), 'INVALID_DIFFICULTY');
  });

  it.each([
    [Number.NaN, 0.25],
    [0.1, Number.NaN],
    [Number.POSITIVE_INFINITY, 0.25],
    [0.1, Number.NEGATIVE_INFINITY],
    [0, 0.25],
    [-0.1, 0.25],
    [1, 0.25],
    [0.1, 0],
    [0.1, -0.1],
    [0.5, 0.5],
    [0.6, 0.5],
    [0.1, 1],
    ['0.1', 0.25],
  ])('los parámetros slip %j y guess %j', (slip, guess) => {
    expectBankError(bankOf({ ...validChoice, slip, guess }), 'INVALID_PARAMETERS');
  });

  it.each([['statement'], ['explanation'], ['assumptionNote']])('%s vacío', (field) => {
    expectBankError(bankOf({ ...validChoice, [field]: '  ' }), 'EMPTY_TEXT');
  });

  it('un formato desconocido', () => {
    expectBankError(bankOf({ ...validChoice, format: 'essay' }), 'UNKNOWN_FORMAT');
  });

  it.each([[3], [5]])('%i opciones', (count) => {
    const options = [...validOptions, { id: 'e', text: 'y', value: null, misconception: 'Error D.' }].slice(0, count);

    expectBankError(bankOf({ ...validChoice, options }), 'INVALID_OPTION_COUNT');
  });

  it.each([[''], ['  ']])('un id de opción vacío: %j', (id) => {
    expectBankError(bankOf(withOption(1, { id })), 'INVALID_OPTION_ID');
  });

  it('ids de opción duplicados', () => {
    expectBankError(bankOf(withOption(1, { id: 'a' })), 'DUPLICATE_OPTION_ID');
  });

  it('un texto de opción vacío', () => {
    expectBankError(bankOf(withOption(3, { text: ' ' })), 'EMPTY_TEXT');
  });

  it.each([['2/4'], ['5'], ['1/0'], ['abc']])('un valor de opción no canónico: %s', (value) => {
    expectBankError(bankOf(withOption(3, { text: 'texto', value })), 'INVALID_OPTION_VALUE');
  });

  it('una opción numérica sin valor racional', () => {
    expectBankError(bankOf(withOption(3, { text: '4', value: null })), 'OPTION_VALUE_MISMATCH');
  });

  it('una opción cuyo texto no coincide con su valor', () => {
    expectBankError(bankOf(withOption(3, { text: '4', value: '5/1' })), 'OPTION_VALUE_MISMATCH');
  });

  it('opciones numéricas equivalentes con textos distintos', () => {
    const question = {
      ...validChoice,
      options: [
        { id: 'a', text: '1/2', value: '1/2', misconception: null },
        { id: 'b', text: '2/4', value: '1/2', misconception: 'Error A.' },
        { id: 'c', text: '3', value: '3/1', misconception: 'Error B.' },
        { id: 'd', text: '4', value: '4/1', misconception: 'Error C.' },
      ],
    };

    expectBankError(bankOf(question), 'DUPLICATE_OPTION');
  });

  it('opciones equivalentes con textos no numéricos', () => {
    expectBankError(bankOf(withOption(2, { text: 'dos', value: '2/1' })), 'DUPLICATE_OPTION');
  });

  it('opciones con el mismo texto', () => {
    const question = {
      ...validChoice,
      options: validOptions.map((option) => (option.id === 'c' ? { ...option, text: 'x', value: null } : option)),
    };

    expectBankError(bankOf(question), 'DUPLICATE_OPTION');
  });

  it('una opción correcta inexistente', () => {
    expectBankError(bankOf({ ...validChoice, correctAnswer: 'z' }), 'UNKNOWN_CORRECT_OPTION');
  });

  it('un distractor sin error descrito', () => {
    expectBankError(bankOf(withOption(1, { misconception: null })), 'INVALID_MISCONCEPTION');
    expectBankError(bankOf(withOption(1, { misconception: ' ' })), 'INVALID_MISCONCEPTION');
  });

  it('una opción correcta con error descrito', () => {
    expectBankError(bankOf(withOption(0, { misconception: 'Error.' })), 'INVALID_MISCONCEPTION');
  });

  it.each([['5'], ['2/4'], ['1/-2'], ['1/0'], ['abc'], [' 1/2'], ['']])(
    'una respuesta numérica no canónica: %j',
    (correctAnswer) => {
      expectBankError(bankOf({ ...validNumeric, correctAnswer }), 'NON_CANONICAL_ANSWER', 'Q2');
    },
  );

  it('opciones en una pregunta numérica', () => {
    expectBankError(bankOf({ ...validNumeric, options: validOptions }), 'UNEXPECTED_OPTIONS', 'Q2');
  });
});
