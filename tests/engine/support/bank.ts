import type { MultipleChoiceQuestion, NumericQuestion, Question, QuestionBank } from '../../../src/engine/index.ts';

export function choiceQuestion(
  id: string,
  skills: readonly string[],
  overrides: Partial<MultipleChoiceQuestion> = {},
): MultipleChoiceQuestion {
  const [primarySkill = '', ...secondarySkills] = skills;
  return {
    id,
    format: 'multipleChoice',
    statement: `Enunciado ${id}.`,
    primarySkill,
    secondarySkills,
    difficulty: 2,
    slip: 0.1,
    guess: 0.25,
    options: [
      { id: 'a', text: 'Uno', value: null, misconception: 'Error A.' },
      { id: 'b', text: 'Dos', value: null, misconception: 'Error B.' },
      { id: 'c', text: 'Tres', value: null, misconception: null },
      { id: 'd', text: 'Cuatro', value: null, misconception: 'Error D.' },
    ],
    correctAnswer: 'c',
    explanation: 'Explicación.',
    assumptionNote: 'Nota.',
    ...overrides,
  };
}

export function numericQuestion(
  id: string,
  skills: readonly string[],
  correctAnswer: string,
  overrides: Partial<NumericQuestion> = {},
): NumericQuestion {
  const [primarySkill = '', ...secondarySkills] = skills;
  return {
    id,
    format: 'numeric',
    statement: `Enunciado ${id}.`,
    primarySkill,
    secondarySkills,
    difficulty: 2,
    slip: 0.1,
    guess: 0.25,
    correctAnswer,
    explanation: 'Explicación.',
    assumptionNote: 'Nota.',
    ...overrides,
  };
}

export function bankOf(...questions: readonly Question[]): QuestionBank {
  return { questions };
}

export function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
