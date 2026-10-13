export const QUESTION_TYPES = Object.freeze({
  SINGLE: "single",
  MULTIPLE: "multiple",
  JUDGMENT: "judgment",
  SHORT_ANSWER: "short-answer",
});

export const QUESTION_SOURCES = Object.freeze({
  MANUAL: "MANUAL",
  AI: "AI",
  IMPORT: "IMPORT",
});

const OPTION_KEYS = ["A", "B", "C", "D", "E", "F"];

export function createDefaultOptions(count = 4) {
  return OPTION_KEYS.slice(0, count).map((key) => ({
    key,
    text: "",
  }));
}

export function isChoiceQuestion(type) {
  return type === QUESTION_TYPES.SINGLE || type === QUESTION_TYPES.MULTIPLE;
}

export function isSubjectiveQuestion(type) {
  return type === QUESTION_TYPES.SHORT_ANSWER;
}

export function normalizeScoringPoints(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeQuestion(question = {}) {
  const type = question.type || QUESTION_TYPES.SINGLE;
  const choiceQuestion = isChoiceQuestion(type);
  const subjectiveQuestion = isSubjectiveQuestion(type);

  return {
    ...question,
    type,
    stem: String(question.stem || ""),
    options: choiceQuestion
      ? (Array.isArray(question.options) && question.options.length
          ? question.options
          : createDefaultOptions()
        ).map((option, index) => ({
          key: option.key || OPTION_KEYS[index] || String(index + 1),
          text: String(option.text || ""),
        }))
      : [],
    answer: subjectiveQuestion
      ? []
      : Array.isArray(question.answer)
      ? [...question.answer]
      : [],
    referenceAnswer: subjectiveQuestion
      ? String(question.referenceAnswer || "")
      : "",
    scoringPoints: subjectiveQuestion
      ? normalizeScoringPoints(question.scoringPoints)
      : [],
    explanation: String(question.explanation || ""),
    difficulty: question.difficulty || "medium",
    chapter: String(question.chapter || ""),
    knowledgePoint: String(question.knowledgePoint || ""),
    source: Object.values(QUESTION_SOURCES).includes(question.source)
      ? question.source
      : QUESTION_SOURCES.MANUAL,
    aiMeta: question.aiMeta ?? null,
    schemaVersion: 2,
  };
}

export function questionTypeLabel(type) {
  return (
    {
      [QUESTION_TYPES.SINGLE]: "单选题",
      [QUESTION_TYPES.MULTIPLE]: "多选题",
      [QUESTION_TYPES.JUDGMENT]: "判断题",
      [QUESTION_TYPES.SHORT_ANSWER]: "简答题",
    }[type] || "题目"
  );
}

export function questionTypeIcon(type) {
  return (
    {
      [QUESTION_TYPES.SINGLE]: "single-choice",
      [QUESTION_TYPES.MULTIPLE]: "multiple-choice",
      [QUESTION_TYPES.JUDGMENT]: "judgment",
      [QUESTION_TYPES.SHORT_ANSWER]: "short-answer",
    }[type] || "question-bank"
  );
}

export function buildQuestionContent(question = {}) {
  const normalized = normalizeQuestion(question);

  return {
    type: normalized.type,
    stem: normalized.stem.trim(),
    options: normalized.options.map((option) => ({
      key: option.key,
      text: option.text.trim(),
    })),
    answer: [...normalized.answer],
    referenceAnswer: normalized.referenceAnswer.trim(),
    scoringPoints: [...normalized.scoringPoints],
    explanation: normalized.explanation.trim(),
    difficulty: normalized.difficulty,
    chapter: normalized.chapter,
    knowledgePoint: normalized.knowledgePoint.trim(),
    source: normalized.source,
    aiMeta: normalized.aiMeta,
    schemaVersion: 2,
  };
}

export { OPTION_KEYS };
