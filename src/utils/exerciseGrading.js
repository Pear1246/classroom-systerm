import { QUESTION_TYPES } from "./questionModel";

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function questionScore(question) {
  const score = toNumber(question?.score, 10);
  return score > 0 ? score : 10;
}

export function isSubjectiveQuestion(question) {
  return question?.type === QUESTION_TYPES.SHORT_ANSWER;
}

export function normalizeAnswer(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).sort();
  }

  if (value === null || value === undefined || value === "") {
    return [];
  }

  return [String(value)];
}

export function answersEqual(left, right) {
  const a = normalizeAnswer(left);
  const b = normalizeAnswer(right);

  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

export function gradeObjectiveAnswer(question, answerRecord) {
  if (isSubjectiveQuestion(question)) {
    return null;
  }

  if (!answerRecord) {
    return {
      correct: false,
      score: 0,
      maxScore: questionScore(question),
    };
  }

  const correct = answersEqual(answerRecord.answer, question.answer);
  const maxScore = questionScore(question);

  return {
    correct,
    score: correct ? maxScore : 0,
    maxScore,
  };
}

export function calculateSubmissionResult(exercise, submission) {
  const questions = Array.isArray(exercise?.questions)
    ? exercise.questions
    : [];
  const answerMap = new Map(
    (submission?.answers || []).map((item) => [String(item.questionId), item])
  );

  let maxScore = 0;
  let objectiveScore = 0;
  let subjectiveScore = 0;
  let subjectiveMaxScore = 0;
  let objectiveMaxScore = 0;
  let pendingSubjectiveCount = 0;

  const details = questions.map((question) => {
    const answerRecord = answerMap.get(String(question.id)) || null;
    const max = questionScore(question);
    maxScore += max;

    if (isSubjectiveQuestion(question)) {
      subjectiveMaxScore += max;
      const rawTeacherScore = answerRecord?.teacherScore;
      const hasTeacherScore =
        rawTeacherScore !== null &&
        rawTeacherScore !== undefined &&
        rawTeacherScore !== "" &&
        Number.isFinite(Number(rawTeacherScore));
      const score = hasTeacherScore
        ? Math.min(max, Math.max(0, Number(rawTeacherScore)))
        : null;

      if (score === null) {
        pendingSubjectiveCount += 1;
      } else {
        subjectiveScore += score;
      }

      return {
        question,
        answerRecord,
        subjective: true,
        score,
        maxScore: max,
        correct: null,
      };
    }

    objectiveMaxScore += max;
    const objective = gradeObjectiveAnswer(question, answerRecord);
    objectiveScore += objective.score;

    return {
      question,
      answerRecord,
      subjective: false,
      score: objective.score,
      maxScore: objective.maxScore,
      correct: objective.correct,
    };
  });

  const fullyGraded = pendingSubjectiveCount === 0;
  const finalScore = fullyGraded ? objectiveScore + subjectiveScore : null;

  return {
    details,
    maxScore,
    objectiveScore,
    objectiveMaxScore,
    subjectiveScore,
    subjectiveMaxScore,
    pendingSubjectiveCount,
    fullyGraded,
    finalScore,
  };
}
