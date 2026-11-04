import { validateKnowledgeGraph } from './graph.ts';
import { isCanonicalRational, normalizeRational } from './rational.ts';
import type {
  CanonicalRational,
  KnowledgeGraph,
  MultipleChoiceQuestion,
  OptionId,
  Question,
  QuestionBank,
  QuestionBankErrorCode,
  QuestionId,
  QuestionOption,
  SkillId,
} from './types.ts';

export class QuestionBankError extends Error {
  readonly code: QuestionBankErrorCode;
  readonly questionId: QuestionId | null;

  constructor(code: QuestionBankErrorCode, message: string, questionId: QuestionId | null) {
    super(message);
    this.name = 'QuestionBankError';
    this.code = code;
    this.questionId = questionId;
  }
}

function isBlank(text: string): boolean {
  return text.trim() === '';
}

function assertValidOptions(question: MultipleChoiceQuestion): void {
  const { id, options, correctAnswer } = question;
  if (options.length !== 4) {
    throw new QuestionBankError('INVALID_OPTION_COUNT', `${id} debe tener cuatro opciones`, id);
  }

  const ids = new Set<OptionId>();
  const texts = new Set<string>();
  const values = new Set<CanonicalRational>();
  for (const option of options) {
    if (isBlank(option.id)) {
      throw new QuestionBankError('INVALID_OPTION_ID', `${id} tiene una opción sin id`, id);
    }
    if (ids.has(option.id)) {
      throw new QuestionBankError('DUPLICATE_OPTION_ID', `${id} repite la opción ${option.id}`, id);
    }
    ids.add(option.id);

    if (isBlank(option.text)) {
      throw new QuestionBankError('EMPTY_TEXT', `${id} tiene una opción sin texto`, id);
    }
    if (option.value !== null && !isCanonicalRational(option.value)) {
      throw new QuestionBankError('INVALID_OPTION_VALUE', `${id} tiene un valor no canónico: ${option.value}`, id);
    }

    const parsedText = normalizeRational(option.text);
    if (parsedText.ok && parsedText.value !== option.value) {
      throw new QuestionBankError('OPTION_VALUE_MISMATCH', `${id}: el texto ${option.text} no coincide con su valor`, id);
    }

    const text = option.text.trim();
    if (texts.has(text) || (option.value !== null && values.has(option.value))) {
      throw new QuestionBankError('DUPLICATE_OPTION', `${id} tiene opciones equivalentes: ${option.text}`, id);
    }
    texts.add(text);
    if (option.value !== null) {
      values.add(option.value);
    }
  }

  if (!ids.has(correctAnswer)) {
    throw new QuestionBankError('UNKNOWN_CORRECT_OPTION', `${id}: la opción correcta no existe`, id);
  }
  for (const option of options) {
    const explained = option.misconception !== null && !isBlank(option.misconception);
    if (option.id === correctAnswer ? option.misconception !== null : !explained) {
      throw new QuestionBankError('INVALID_MISCONCEPTION', `${id}: error de la opción ${option.id} mal descrito`, id);
    }
  }
}

function assertValidQuestion(question: Question, skills: ReadonlySet<SkillId>): void {
  const { id } = question;

  for (const skill of [question.primarySkill, ...question.secondarySkills]) {
    if (!skills.has(skill)) {
      throw new QuestionBankError('UNKNOWN_SKILL', `${id} usa una competencia inexistente: ${skill}`, id);
    }
  }
  if (question.secondarySkills.includes(question.primarySkill)) {
    throw new QuestionBankError('SECONDARY_REPEATS_PRIMARY', `${id} repite la competencia principal`, id);
  }
  if (new Set(question.secondarySkills).size !== question.secondarySkills.length) {
    throw new QuestionBankError('DUPLICATE_SECONDARY_SKILL', `${id} repite una competencia secundaria`, id);
  }

  if (![1, 2, 3].includes(question.difficulty)) {
    throw new QuestionBankError('INVALID_DIFFICULTY', `${id} tiene una dificultad inválida`, id);
  }

  const { slip, guess } = question;
  if (!Number.isFinite(slip) || !Number.isFinite(guess) || !(0 < guess && guess < 1 - slip && 1 - slip < 1)) {
    throw new QuestionBankError('INVALID_PARAMETERS', `${id} incumple 0 < guess < 1 - slip < 1`, id);
  }

  for (const text of [question.statement, question.explanation, question.assumptionNote]) {
    if (isBlank(text)) {
      throw new QuestionBankError('EMPTY_TEXT', `${id} tiene un texto vacío`, id);
    }
  }

  if (question.format === 'multipleChoice') {
    assertValidOptions(question);
  } else if (question.format === 'numeric') {
    if ('options' in question) {
      throw new QuestionBankError('UNEXPECTED_OPTIONS', `${id} es numérica y no admite opciones`, id);
    }
    if (!isCanonicalRational(question.correctAnswer)) {
      throw new QuestionBankError('NON_CANONICAL_ANSWER', `${id} no tiene una respuesta canónica`, id);
    }
  } else {
    throw new QuestionBankError('UNKNOWN_FORMAT', `${id} tiene un formato desconocido`, id);
  }
}

// Validación estructural de cualquier banco: un banco vacío es válido. Las
// exigencias de tamaño (§4) son del banco RADAR y se comprueban en sus tests.
export function validateQuestionBank(bank: QuestionBank, graph: KnowledgeGraph): void {
  validateKnowledgeGraph(graph);
  const skills = new Set(graph.nodes.map((node) => node.id));
  const ids = new Set<QuestionId>();

  for (const question of bank.questions) {
    if (isBlank(question.id)) {
      throw new QuestionBankError('INVALID_QUESTION_ID', 'Hay una pregunta sin id', null);
    }
    if (ids.has(question.id)) {
      throw new QuestionBankError('DUPLICATE_QUESTION_ID', `Pregunta duplicada: ${question.id}`, question.id);
    }
    ids.add(question.id);
    assertValidQuestion(question, skills);
  }
}

function freezeDeep<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

function correct(id: OptionId, text: string, value: CanonicalRational | null): QuestionOption {
  return { id, text, value, misconception: null };
}

function wrong(id: OptionId, text: string, value: CanonicalRational | null, misconception: string): QuestionOption {
  return { id, text, value, misconception };
}

// slip y guess son SUPUESTOS no calibrados: slip 0.05, 0.10 o 0.20 según la
// dificultad; guess 0.25 en opción múltiple (0.30 con un distractor débil) y
// bajo y explícito en respuesta numérica. Ver docs/engine/BANCO.md.
const NOT_CALIBRATED = [
  'Nivel previsto 1.º–2.º ESO, pendiente de revisión docente. slip y guess son SUPUESTOS no calibrados.',
  'R_q es una hipótesis de modelado no validada: DINA supone que no dominar cualquiera de las competencias requeridas reduce la probabilidad de acierto a guess.',
  'La asignación puede fallar si existen estrategias alternativas.',
  'No hay validación con alumnos ni revisión docente.',
].join(' ');

export const RADAR_QUESTION_BANK: QuestionBank = freezeDeep({
  questions: [
    {
      id: 'OPS-01',
      format: 'multipleChoice',
      statement: 'Calcula: 47 + 38.',
      primarySkill: 'OPS',
      secondarySkills: [],
      difficulty: 1,
      slip: 0.05,
      guess: 0.25,
      options: [
        wrong('a', '75', '75/1', 'Olvida la llevada de las unidades a las decenas.'),
        wrong('b', '715', '715/1', 'Escribe la suma de cada columna sin llevar: 4 + 3 y 7 + 8.'),
        correct('c', '85', '85/1'),
        wrong('d', '9', '9/1', 'Resta en lugar de sumar.'),
      ],
      correctAnswer: 'c',
      explanation: '7 + 8 = 15: se escribe 5 y se lleva 1. Después, 4 + 3 + 1 = 8. El resultado es 85.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'OPS-02',
      format: 'numeric',
      statement: 'Calcula: 9·8.',
      primarySkill: 'OPS',
      secondarySkills: [],
      difficulty: 1,
      slip: 0.05,
      guess: 0.02,
      correctAnswer: '72/1',
      explanation: 'Es un resultado de la tabla del 9: 9·8 = 72.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'OPS-03',
      format: 'multipleChoice',
      statement: 'Calcula: 304 - 178.',
      primarySkill: 'OPS',
      secondarySkills: [],
      difficulty: 2,
      slip: 0.1,
      guess: 0.25,
      options: [
        wrong('a', '226', '226/1', 'Pide prestado a las centenas sin descontarlo después.'),
        wrong('b', '136', '136/1', 'Trata el cero de las decenas como 10 y no como 9 tras prestar.'),
        wrong('c', '274', '274/1', 'Resta en cada columna la cifra menor de la mayor.'),
        correct('d', '126', '126/1'),
      ],
      correctAnswer: 'd',
      explanation: 'Se pide prestado a las centenas a través de las decenas: 14 - 8 = 6, 9 - 7 = 2 y 2 - 1 = 1.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'OPS-04',
      format: 'numeric',
      statement: 'Se reparten 144 cromos a partes iguales entre 6 amigos. ¿Cuántos cromos recibe cada uno?',
      primarySkill: 'OPS',
      secondarySkills: [],
      difficulty: 2,
      slip: 0.1,
      guess: 0.02,
      correctAnswer: '24/1',
      explanation: 'Repartir a partes iguales es dividir: 144 : 6 = 24.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'OPS-05',
      format: 'multipleChoice',
      statement: 'Una caja tiene 24 filas con 15 lápices en cada fila. ¿Cuántos lápices hay en 3 cajas?',
      primarySkill: 'OPS',
      secondarySkills: [],
      difficulty: 3,
      slip: 0.2,
      guess: 0.25,
      options: [
        wrong('a', '432', '432/1', 'No desplaza el producto parcial de las decenas: 24·15 da 144.'),
        correct('b', '1080', '1080/1'),
        wrong('c', '360', '360/1', 'Calcula una sola caja y olvida multiplicar por 3.'),
        wrong('d', '42', '42/1', 'Suma los datos en lugar de multiplicarlos.'),
      ],
      correctAnswer: 'b',
      explanation: 'Cada caja tiene 24·15 = 360 lápices, y tres cajas tienen 360·3 = 1080.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'NEG-01',
      format: 'multipleChoice',
      statement: 'Calcula: -5 + 8.',
      primarySkill: 'NEG',
      secondarySkills: [],
      difficulty: 1,
      slip: 0.05,
      guess: 0.25,
      options: [
        correct('a', '3', '3/1'),
        wrong('b', '-3', '-3/1', 'Conserva el signo del primer número.'),
        wrong('c', '-13', '-13/1', 'Suma los valores absolutos y pone signo negativo.'),
        wrong('d', '13', '13/1', 'Ignora el signo y suma los valores absolutos.'),
      ],
      correctAnswer: 'a',
      explanation: 'Con signos distintos se restan los valores absolutos y se toma el signo del mayor: 8 - 5 = 3.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'NEG-02',
      format: 'numeric',
      statement: 'Calcula: (-3)·(-4).',
      primarySkill: 'NEG',
      secondarySkills: [],
      difficulty: 1,
      slip: 0.05,
      guess: 0.02,
      correctAnswer: '12/1',
      explanation: 'El producto de dos números negativos es positivo: 3·4 = 12.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'NEG-03',
      format: 'multipleChoice',
      statement: 'Calcula: 4 - (-6).',
      primarySkill: 'NEG',
      secondarySkills: [],
      difficulty: 2,
      slip: 0.1,
      guess: 0.25,
      options: [
        wrong('a', '-2', '-2/1', 'Trata - (-6) como - 6.'),
        wrong('b', '2', '2/1', 'Ignora los signos y calcula la diferencia de valores absolutos.'),
        correct('c', '10', '10/1'),
        wrong('d', '-10', '-10/1', 'Suma bien los valores absolutos y da signo negativo al resultado.'),
      ],
      correctAnswer: 'c',
      explanation: 'Restar un número negativo equivale a sumar su opuesto: 4 + 6 = 10.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'NEG-04',
      format: 'numeric',
      statement: 'Un termómetro marca -4 °C por la mañana. Al mediodía la temperatura ha subido 9 °C. ¿Qué temperatura marca, en °C?',
      primarySkill: 'NEG',
      secondarySkills: [],
      difficulty: 2,
      slip: 0.1,
      guess: 0.02,
      correctAnswer: '5/1',
      explanation: 'Subir 9 grados es sumar: -4 + 9 = 5.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'NEG-05',
      format: 'multipleChoice',
      statement: 'Calcula: (-2)·(-3)·(-4).',
      primarySkill: 'NEG',
      secondarySkills: [],
      difficulty: 3,
      slip: 0.2,
      guess: 0.3,
      options: [
        wrong('a', '24', '24/1', 'Cree que el producto de números negativos siempre es positivo.'),
        wrong('b', '-9', '-9/1', 'Suma los factores en lugar de multiplicarlos.'),
        wrong('c', '9', '9/1', 'Suma los valores absolutos y descarta los signos.'),
        correct('d', '-24', '-24/1'),
      ],
      correctAnswer: 'd',
      explanation: 'Con tres factores negativos el producto es negativo: (-2)·(-3) = 6 y 6·(-4) = -24.',
      assumptionNote: `${NOT_CALIBRATED} guess elevado a 0.30 porque los distractores 9 y -9 son débiles.`,
    },
    {
      id: 'FRA-01',
      format: 'multipleChoice',
      statement: 'Simplifica la fracción 18/24 hasta hacerla irreducible.',
      primarySkill: 'FRA',
      secondarySkills: [],
      difficulty: 1,
      slip: 0.05,
      guess: 0.25,
      options: [
        wrong('a', '9/24', '3/8', 'Divide solo el numerador entre 2.'),
        correct('b', '3/4', '3/4'),
        wrong('c', '12/18', '2/3', 'Resta 6 al numerador y al denominador en lugar de dividir.'),
        wrong('d', '4/3', '4/3', 'Invierte la fracción al simplificar.'),
      ],
      correctAnswer: 'b',
      explanation: 'El máximo común divisor de 18 y 24 es 6: 18/24 = 3/4.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'FRA-02',
      format: 'numeric',
      statement: 'Calcula: 2/3 · 9/4.',
      primarySkill: 'FRA',
      secondarySkills: [],
      difficulty: 2,
      slip: 0.1,
      guess: 0.02,
      correctAnswer: '3/2',
      explanation: 'Se multiplican numeradores y denominadores: 18/12, que simplificado es 3/2.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'FRA-03',
      format: 'multipleChoice',
      statement: 'Calcula: 1/2 + 1/3.',
      primarySkill: 'FRA',
      secondarySkills: [],
      difficulty: 2,
      slip: 0.1,
      guess: 0.25,
      options: [
        correct('a', '5/6', '5/6'),
        wrong('b', '2/5', '2/5', 'Suma numeradores entre sí y denominadores entre sí.'),
        wrong('c', '2/6', '1/3', 'Suma los numeradores y multiplica los denominadores sin ajustar.'),
        wrong('d', '1/6', '1/6', 'Multiplica las fracciones en lugar de sumarlas.'),
      ],
      correctAnswer: 'a',
      explanation: 'Con denominador común 6: 3/6 + 2/6 = 5/6.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'FRA-04',
      format: 'numeric',
      statement: 'Calcula: 1/4 - 5/6.',
      primarySkill: 'FRA',
      secondarySkills: ['NEG'],
      difficulty: 3,
      slip: 0.2,
      guess: 0.02,
      correctAnswer: '-7/12',
      explanation: 'Con denominador común 12: 3/12 - 10/12 = -7/12.',
      assumptionNote: `${NOT_CALIBRATED} SUPUESTO razonado: se incluye NEG porque se supone que hay que obtener un resultado negativo.`,
    },
    {
      id: 'FRA-05',
      format: 'multipleChoice',
      statement: 'Calcula: 3/4 : 5/8.',
      primarySkill: 'FRA',
      secondarySkills: [],
      difficulty: 3,
      slip: 0.2,
      guess: 0.25,
      options: [
        wrong('a', '15/32', '15/32', 'Multiplica las fracciones sin invertir la segunda.'),
        wrong('b', '5/6', '5/6', 'Invierte la primera fracción en lugar de la segunda.'),
        wrong('c', '32/15', '32/15', 'Invierte las dos fracciones.'),
        correct('d', '6/5', '6/5'),
      ],
      correctAnswer: 'd',
      explanation: 'Dividir es multiplicar por la fracción inversa: 3/4 · 8/5 = 24/20 = 6/5.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'JER-01',
      format: 'multipleChoice',
      statement: 'Calcula: 7 + 3·2.',
      primarySkill: 'JER',
      secondarySkills: [],
      difficulty: 1,
      slip: 0.05,
      guess: 0.25,
      options: [
        wrong('a', '20', '20/1', 'Opera de izquierda a derecha: (7 + 3)·2.'),
        wrong('b', '12', '12/1', 'Suma todos los números.'),
        correct('c', '13', '13/1'),
        wrong('d', '42', '42/1', 'Multiplica todos los números.'),
      ],
      correctAnswer: 'c',
      explanation: 'La multiplicación va antes que la suma: 3·2 = 6 y 7 + 6 = 13.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'JER-02',
      format: 'numeric',
      statement: 'Calcula: 20 - 12 : 4.',
      primarySkill: 'JER',
      secondarySkills: [],
      difficulty: 1,
      slip: 0.05,
      guess: 0.02,
      correctAnswer: '17/1',
      explanation: 'La división va antes que la resta: 12 : 4 = 3 y 20 - 3 = 17.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'JER-03',
      format: 'multipleChoice',
      statement: 'Calcula: 2·(5 + 3) - 4.',
      primarySkill: 'JER',
      secondarySkills: [],
      difficulty: 2,
      slip: 0.1,
      guess: 0.25,
      options: [
        correct('a', '12', '12/1'),
        wrong('b', '9', '9/1', 'Ignora el paréntesis: 2·5 + 3 - 4.'),
        wrong('c', '8', '8/1', 'Extiende el paréntesis hasta el final: 2·(5 + 3 - 4).'),
        wrong('d', '16', '16/1', 'Omite la resta final.'),
      ],
      correctAnswer: 'a',
      explanation: 'Primero el paréntesis: 5 + 3 = 8. Después 2·8 = 16 y 16 - 4 = 12.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'JER-04',
      format: 'numeric',
      statement: 'Calcula: -2 + 3·(-4).',
      primarySkill: 'JER',
      secondarySkills: ['NEG'],
      difficulty: 2,
      slip: 0.1,
      guess: 0.02,
      correctAnswer: '-14/1',
      explanation: 'La multiplicación va primero: 3·(-4) = -12 y -2 + (-12) = -14.',
      assumptionNote: `${NOT_CALIBRATED} SUPUESTO razonado: se incluye NEG porque se supone que hay que operar con enteros negativos.`,
    },
    {
      id: 'JER-05',
      format: 'multipleChoice',
      statement: 'Calcula: 1/2 + 1/3 · 3/4.',
      primarySkill: 'JER',
      secondarySkills: ['FRA'],
      difficulty: 3,
      slip: 0.2,
      guess: 0.25,
      options: [
        wrong('a', '5/8', '5/8', 'Opera de izquierda a derecha: (1/2 + 1/3) · 3/4.'),
        correct('b', '3/4', '3/4'),
        wrong('c', '3/10', '3/10', 'Opera de izquierda a derecha y suma numeradores y denominadores.'),
        wrong('d', '1/4', '1/4', 'Hace la multiplicación y olvida sumar 1/2.'),
      ],
      correctAnswer: 'b',
      explanation: 'La multiplicación va primero: 1/3 · 3/4 = 1/4 y 1/2 + 1/4 = 3/4.',
      assumptionNote: `${NOT_CALIBRATED} SUPUESTO razonado: se incluye FRA porque se supone que hay que operar con fracciones, aunque FRA no sea ancestro de JER.`,
    },
    {
      id: 'ALG-01',
      format: 'multipleChoice',
      statement: 'Simplifica: 3x + 2x.',
      primarySkill: 'ALG',
      secondarySkills: [],
      difficulty: 1,
      slip: 0.05,
      guess: 0.25,
      options: [
        correct('a', '5x', null),
        wrong('b', '5x²', null, 'Suma los coeficientes y también los exponentes.'),
        wrong('c', '6x', null, 'Multiplica los coeficientes en lugar de sumarlos.'),
        wrong('d', '5', '5/1', 'Suma los coeficientes y elimina la x.'),
      ],
      correctAnswer: 'a',
      explanation: 'Son términos semejantes, así que se suman los coeficientes: 3 + 2 = 5.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'ALG-02',
      format: 'numeric',
      statement: 'Simplifica 4x + 3 - x + 2 y escribe el coeficiente de x del resultado.',
      primarySkill: 'ALG',
      secondarySkills: [],
      difficulty: 1,
      slip: 0.05,
      guess: 0.05,
      correctAnswer: '3/1',
      explanation: 'Se agrupan los términos en x: 4x - x = 3x. El resultado es 3x + 5.',
      assumptionNote: `${NOT_CALIBRATED} guess algo mayor porque el coeficiente es un entero pequeño.`,
    },
    {
      id: 'ALG-03',
      format: 'multipleChoice',
      statement: 'Simplifica: 2(x + 3) + x.',
      primarySkill: 'ALG',
      secondarySkills: [],
      difficulty: 2,
      slip: 0.1,
      guess: 0.25,
      options: [
        wrong('a', '3x + 3', null, 'Multiplica solo el primer término del paréntesis.'),
        correct('b', '3x + 6', null),
        wrong('c', '3x + 5', null, 'Suma 2 + 3 en lugar de multiplicar 2·3.'),
        wrong('d', '9x', null, 'Junta términos que no son semejantes.'),
      ],
      correctAnswer: 'b',
      explanation: 'Propiedad distributiva: 2x + 6 + x. Agrupando, 3x + 6.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'ALG-04',
      format: 'multipleChoice',
      statement: 'Simplifica: 3x - (x - 4).',
      primarySkill: 'ALG',
      secondarySkills: ['NEG'],
      difficulty: 2,
      slip: 0.1,
      guess: 0.25,
      options: [
        wrong('a', '2x - 4', null, 'No cambia el signo del segundo término del paréntesis.'),
        wrong('b', '4x + 4', null, 'No cambia el signo del primer término del paréntesis.'),
        wrong('c', '6x', null, 'Junta términos que no son semejantes.'),
        correct('d', '2x + 4', null),
      ],
      correctAnswer: 'd',
      explanation: 'El signo menos cambia el signo de cada término: 3x - x + 4 = 2x + 4.',
      assumptionNote: `${NOT_CALIBRATED} SUPUESTO razonado: se incluye NEG porque se supone que hay que restar un término negativo.`,
    },
    {
      id: 'ALG-05',
      format: 'numeric',
      statement: 'Simplifica x/2 + x/3 y escribe el coeficiente de x del resultado.',
      primarySkill: 'ALG',
      secondarySkills: ['FRA'],
      difficulty: 3,
      slip: 0.2,
      guess: 0.02,
      correctAnswer: '5/6',
      explanation: 'Los coeficientes son 1/2 y 1/3, y su suma es 5/6.',
      assumptionNote: `${NOT_CALIBRATED} SUPUESTO razonado: se incluye FRA porque se supone que hay que sumar fracciones.`,
    },
    {
      id: 'ECU-01',
      format: 'multipleChoice',
      statement: 'Resuelve: 2x + 3 = 11.',
      primarySkill: 'ECU',
      secondarySkills: [],
      difficulty: 1,
      slip: 0.05,
      guess: 0.25,
      options: [
        wrong('a', '7', '7/1', 'Pasa el 3 sumando: 2x = 14.'),
        wrong('b', '8', '8/1', 'Resta 3 y olvida dividir entre 2.'),
        correct('c', '4', '4/1'),
        wrong('d', '14', '14/1', 'Pasa el 3 sumando y olvida dividir entre 2.'),
      ],
      correctAnswer: 'c',
      explanation: 'Se resta 3 en los dos miembros: 2x = 8. Al dividir entre 2, x = 4.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'ECU-02',
      format: 'numeric',
      statement: 'Resuelve: 3x - 4 = 17.',
      primarySkill: 'ECU',
      secondarySkills: [],
      difficulty: 1,
      slip: 0.05,
      guess: 0.02,
      correctAnswer: '7/1',
      explanation: 'Se suma 4 en los dos miembros: 3x = 21. Al dividir entre 3, x = 7.',
      assumptionNote: NOT_CALIBRATED,
    },
    {
      id: 'ECU-03',
      format: 'multipleChoice',
      statement: 'Resuelve: 3(x - 2) = 12.',
      primarySkill: 'ECU',
      secondarySkills: [],
      difficulty: 2,
      slip: 0.1,
      guess: 0.25,
      options: [
        correct('a', '6', '6/1'),
        wrong('b', '14/3', '14/3', 'Multiplica solo el primer término: 3x - 2 = 12.'),
        wrong('c', '2', '2/1', 'Pasa el 6 restando: 3x = 12 - 6.'),
        wrong('d', '18', '18/1', 'Llega a 3x = 18 y olvida dividir entre 3.'),
      ],
      correctAnswer: 'a',
      explanation: 'Una solución posible usa la propiedad distributiva: 3x - 6 = 12. Entonces 3x = 18 y x = 6.',
      assumptionNote: `${NOT_CALIBRATED} SUPUESTO razonado: no se incluye ALG porque puede resolverse dividiendo ambos miembros entre 3 y despejando después, así que desarrollar el paréntesis no se considera imprescindible.`,
    },
    {
      id: 'ECU-04',
      format: 'numeric',
      statement: 'Resuelve: 5x + 3 = 2x - 9.',
      primarySkill: 'ECU',
      secondarySkills: ['NEG', 'ALG'],
      difficulty: 2,
      slip: 0.1,
      guess: 0.02,
      correctAnswer: '-4/1',
      explanation: 'Se agrupan términos: 3x = -12. Al dividir entre 3, x = -4.',
      assumptionNote: `${NOT_CALIBRATED} Hipótesis no validada: se incluyen NEG y ALG porque se supone necesario operar con negativos y reducir términos semejantes al reunir las incógnitas.`,
    },
    {
      id: 'ECU-05',
      format: 'multipleChoice',
      statement: 'Resuelve: x/2 + 1/3 = 5/6.',
      primarySkill: 'ECU',
      secondarySkills: ['FRA'],
      difficulty: 3,
      slip: 0.2,
      guess: 0.25,
      options: [
        wrong('a', '1/4', '1/4', 'Llega a x/2 = 1/2 y divide entre 2 en lugar de multiplicar.'),
        wrong('b', '7/3', '7/3', 'Pasa 1/3 sumando: x/2 = 7/6.'),
        wrong('c', '1/2', '1/2', 'Llega a x/2 = 1/2 y olvida despejar la x.'),
        correct('d', '1', '1/1'),
      ],
      correctAnswer: 'd',
      explanation: 'Se resta 1/3: x/2 = 5/6 - 2/6 = 1/2. Al multiplicar por 2, x = 1.',
      assumptionNote: `${NOT_CALIBRATED} SUPUESTO razonado: se incluye FRA porque se supone que hay que operar con fracciones.`,
    },
  ],
});
