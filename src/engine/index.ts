export {
  createInitialDiagnosticState,
  createPriorDistribution,
  marginals,
  masteryProbability,
  updatePosterior,
} from './bayes.ts';
export {
  InferenceError,
  SKILL_ORDER,
  STATE_COUNT,
  correctProbability,
  masteryFromStateIndex,
  requiredSkills,
  stateIndexFromMastery,
} from './dina.ts';
export { binaryEntropy, jointEntropy } from './entropy.ts';
export {
  KNOWLEDGE_GRAPH,
  KnowledgeGraphError,
  ancestors,
  descendants,
  topologicalOrder,
  validateKnowledgeGraph,
} from './graph.ts';
export { QuestionBankError, RADAR_QUESTION_BANK, validateQuestionBank } from './questionBank.ts';
export { isCanonicalRational, normalizeRational } from './rational.ts';
export type {
  CanonicalRational,
  CompatiblePriorConfig,
  DiagnosticState,
  Difficulty,
  DinaQuestion,
  EffectivePriorConfig,
  InferenceErrorCode,
  JointDistribution,
  KnowledgeGraph,
  KnowledgeGraphErrorCode,
  MasteryVector,
  MultipleChoiceQuestion,
  NumericQuestion,
  OptionId,
  PriorConfig,
  Question,
  QuestionBank,
  QuestionBankErrorCode,
  QuestionId,
  QuestionOption,
  RationalErrorCode,
  Result,
  SkillId,
  SkillNode,
} from './types.ts';
