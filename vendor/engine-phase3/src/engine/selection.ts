import { assertValidBank, assertValidDiagnosticState } from './answers.ts';
import { marginals, updatePosterior } from './bayes.ts';
import { InferenceError, SKILL_ORDER, masteryFromStateIndex, requiredSkills, responseProbability } from './dina.ts';
import { binaryEntropy } from './entropy.ts';
import { topologicalOrder } from './graph.ts';
import { validateQuestionBank } from './questionBank.ts';
import type {
  CandidateExplanation,
  DiagnosticState,
  Difficulty,
  JointDistribution,
  KnowledgeGraph,
  Question,
  QuestionBank,
  QuestionId,
  QuestionSelection,
  SkillId,
} from './types.ts';

// Distancia al máximo global dentro de la cual dos EIG se consideran empatadas (§2.4).
const EIG_TIE_TOLERANCE = 1e-12;

// Residuo negativo admitido por redondeo. Más allá hay un error, no un redondeo.
const EIG_RESIDUAL_TOLERANCE = 1e-12;

const DIFFICULTY_RANK: Readonly<Record<Difficulty, number>> = { 2: 0, 1: 1, 3: 2 };

function compareIds(a: QuestionId, b: QuestionId): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

// H_b de dos probabilidades complementarias. H_b es simétrica: usar la menor
// reduce la pérdida de precisión cuando la otra está muy cerca de 1.
export function pairEntropy(a: number, b: number): number {
  return binaryEntropy(Math.min(a, b));
}

// La EIG no puede ser negativa: solo se corrige un residuo de redondeo.
export function checkedEig(raw: number): number {
  if (!Number.isFinite(raw) || raw < -EIG_RESIDUAL_TOLERANCE) {
    throw new InferenceError('INVALID_EIG', `EIG inválida: ${raw}`);
  }
  return Math.max(raw, 0);
}

function explainCandidate(
  joint: JointDistribution,
  question: Question,
  current: Readonly<Record<SkillId, number>>,
): CandidateExplanation {
  const required = requiredSkills(question);
  const { slip, guess } = question;

  let total = 0;
  let correctMass = 0;
  let incorrectMass = 0;
  let conditionalEntropy = 0;
  joint.forEach((mass, index) => {
    const alpha = masteryFromStateIndex(index);
    const correct = responseProbability(alpha, required, slip, guess, true);
    const incorrect = responseProbability(alpha, required, slip, guess, false);
    total += mass;
    correctMass += mass * correct;
    incorrectMass += mass * incorrect;
    conditionalEntropy += mass * pairEntropy(correct, incorrect);
  });

  const observed = correctMass + incorrectMass;
  const correctProbability = correctMass / observed;
  const incorrectProbability = incorrectMass / observed;

  const posteriorIfCorrect = updatePosterior(joint, question, true);
  const posteriorIfIncorrect = updatePosterior(joint, question, false);
  const marginalsIfCorrect = marginals(posteriorIfCorrect);
  const marginalsIfIncorrect = marginals(posteriorIfIncorrect);

  const entropyOf = (probabilities: Readonly<Record<SkillId, number>>, skill: SkillId): number =>
    binaryEntropy(probabilities[skill] ?? Number.NaN);

  return {
    questionId: question.id,
    correctProbability,
    incorrectProbability,
    eig: checkedEig(pairEntropy(correctProbability, incorrectProbability) - conditionalEntropy / total),
    posteriorIfCorrect,
    posteriorIfIncorrect,
    marginalsIfCorrect,
    marginalsIfIncorrect,
    expectedEntropyReduction: Object.fromEntries(
      SKILL_ORDER.map((skill) => [
        skill,
        entropyOf(current, skill) -
          correctProbability * entropyOf(marginalsIfCorrect, skill) -
          incorrectProbability * entropyOf(marginalsIfIncorrect, skill),
      ]),
    ),
  };
}

// Máximo global de EIG; entre las candidatas a distancia ≤ 1e-12 de ese máximo,
// el menor id. Comparar contra el máximo evita los empates encadenados.
export function bestCandidateId(candidates: readonly Pick<CandidateExplanation, 'questionId' | 'eig'>[]): QuestionId | null {
  const best = Math.max(...candidates.map((candidate) => candidate.eig));
  const tied = candidates
    .filter((candidate) => best - candidate.eig <= EIG_TIE_TOLERANCE)
    .map((candidate) => candidate.questionId)
    .sort(compareIds);
  return tied[0] ?? null;
}

export function selectNextQuestion(state: DiagnosticState, questionBank: QuestionBank): QuestionSelection | null {
  assertValidBank(questionBank);
  assertValidDiagnosticState(state, questionBank);

  const answered = new Set(state.responses.map((record) => record.questionId));
  const current = marginals(state.joint);
  const candidates = questionBank.questions
    .filter((question) => !answered.has(question.id))
    .map((question) => explainCandidate(state.joint, question, current))
    .sort((a, b) => compareIds(a.questionId, b.questionId));

  const selectedId = bestCandidateId(candidates);
  const question = questionBank.questions.find((candidate) => candidate.id === selectedId);
  return question === undefined ? null : { question, candidates };
}

// Orden del método A (§2.9), compartido por simulación y benchmarks: rondas por
// competencia principal en orden topológico; dentro de cada una, dificultad
// 2, 1, 3 y después id. Cada ronda toma el siguiente ítem de cada competencia.
export function fixedQuestionOrder(questionBank: QuestionBank, knowledgeGraph: KnowledgeGraph): readonly QuestionId[] {
  validateQuestionBank(questionBank, knowledgeGraph);

  const queues = topologicalOrder(knowledgeGraph).map((skill) =>
    questionBank.questions
      .filter((question) => question.primarySkill === skill)
      .sort((a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] || compareIds(a.id, b.id))
      .map((question) => question.id),
  );

  const rounds = Math.max(0, ...queues.map((queue) => queue.length));
  return Array.from({ length: rounds }).flatMap((_, round) =>
    queues.flatMap((queue) => queue.slice(round, round + 1)),
  );
}
