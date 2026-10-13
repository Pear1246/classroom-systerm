import { QUESTION_TYPES } from "../utils/questionModel";
import { questionScore } from "../utils/exerciseGrading";

const STUDENTS = [
  "陈一诺",
  "李晨曦",
  "周子涵",
  "黄思远",
  "梁嘉怡",
  "林浩然",
  "吴雨桐",
  "何俊宇",
  "罗可欣",
  "蒋文轩",
  "谢欣怡",
  "郑宇航",
  "唐诗涵",
  "冯嘉乐",
  "彭梓轩",
  "苏语彤",
  "钟睿",
  "陆思琪",
  "邓子墨",
  "许佳宁",
  "郭昊",
  "马欣然",
  "曾嘉豪",
  "叶雨欣",
  "谭博文",
  "廖可晴",
  "魏子轩",
  "莫欣妍",
  "袁浩宇",
  "石雅雯",
  "方俊杰",
  "江若琳",
  "韩子谦",
  "邱诗雨",
  "蔡泽宇",
  "余佳怡",
  "沈嘉诚",
  "杜心悦",
  "范宇辰",
  "韦思涵",
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatSubmitTime(studentIndex, exerciseIndex = 0) {
  const base = new Date("2026-10-06T10:10:00");
  const minutes = studentIndex * 3 + exerciseIndex * 2;
  base.setMinutes(base.getMinutes() + minutes);

  const pad = (value) => String(value).padStart(2, "0");
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(
    base.getDate()
  )} ${pad(base.getHours())}:${pad(base.getMinutes())}`;
}

function buildWrongAnswer(question) {
  if (question.type === QUESTION_TYPES.JUDGMENT) {
    return question.answer?.[0] === "true" ? ["false"] : ["true"];
  }

  if (question.type === QUESTION_TYPES.SINGLE) {
    const correct = String(question.answer?.[0] || "");
    const candidate = (question.options || []).find(
      (option) => String(option.key) !== correct
    );
    return candidate ? [String(candidate.key)] : [];
  }

  if (question.type === QUESTION_TYPES.MULTIPLE) {
    const correct = Array.isArray(question.answer) ? question.answer : [];
    const candidate = (question.options || []).find(
      (option) => !correct.includes(String(option.key))
    );

    if (candidate) {
      return [String(candidate.key)];
    }

    return correct.length > 1 ? [String(correct[0])] : [];
  }

  return [];
}

function buildStudentAnswer(question, studentIndex, questionIndex) {
  const correct = (studentIndex * 7 + questionIndex * 3) % 5 !== 0;

  if (question.type === QUESTION_TYPES.SHORT_ANSWER) {
    return {
      answerText:
        studentIndex % 3 === 0
          ? `我认为本题的关键是：${
              question.knowledgePoint || "结合题目条件进行分析"
            }，并说明主要过程。`
          : `根据课堂内容，${
              question.referenceAnswer || "需要围绕题目要求说明核心概念和理由"
            }`,
      answer: [],
      correct: null,
    };
  }

  return {
    answer: correct ? clone(question.answer || []) : buildWrongAnswer(question),
    answerText: "",
    correct,
  };
}

export function createExerciseSubmissionMockData(exercise, exerciseIndex = 0) {
  const expectedCount = Math.max(
    0,
    Number(exercise?.expectedCount || STUDENTS.length)
  );
  const submittedCount = Math.min(
    expectedCount,
    Math.max(0, Number(exercise?.submittedCount || 0))
  );
  const questions = Array.isArray(exercise?.questions)
    ? exercise.questions
    : [];

  return Array.from({ length: expectedCount }, (_, studentIndex) => {
    const submitted = studentIndex < submittedCount;
    const studentId = `2024${String(studentIndex + 1).padStart(4, "0")}`;

    if (!submitted) {
      return {
        id: `${exercise.id}-submission-${studentId}`,
        exerciseId: String(exercise.id),
        studentId,
        studentName: STUDENTS[studentIndex % STUDENTS.length],
        submitted: false,
        submittedAt: "",
        answers: [],
      };
    }

    const answers = questions.map((question, questionIndex) => {
      const studentAnswer = buildStudentAnswer(
        question,
        studentIndex,
        questionIndex
      );
      const record = {
        questionId: String(question.id),
        answer: studentAnswer.answer,
        answerText: studentAnswer.answerText,
        teacherScore: null,
        teacherComment: "",
      };

      if (question.type === QUESTION_TYPES.SHORT_ANSWER) {
        const shouldBeGraded = (studentIndex + questionIndex) % 4 !== 0;
        if (shouldBeGraded) {
          const maxScore = questionScore(question);
          const ratio = 0.7 + ((studentIndex + questionIndex) % 4) * 0.1;
          record.teacherScore = Number(
            (maxScore * Math.min(ratio, 1)).toFixed(1)
          );
          record.teacherComment =
            ratio >= 0.9 ? "要点较完整。" : "基本正确，可补充关键过程。";
        }
      }

      return record;
    });

    return {
      id: `${exercise.id}-submission-${studentId}`,
      exerciseId: String(exercise.id),
      studentId,
      studentName: STUDENTS[studentIndex % STUDENTS.length],
      submitted: true,
      submittedAt: formatSubmitTime(studentIndex, exerciseIndex),
      answers,
    };
  });
}
