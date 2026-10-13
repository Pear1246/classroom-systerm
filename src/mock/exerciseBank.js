import { createQuestionMockData } from "./questionBank";
import { normalizeQuestion } from "../utils/questionModel";

const exerciseTemplates = [
  {
    name: "第一章基础知识课堂练习",
    description: "用于检查绪论与算法复杂度基础知识掌握情况。",
    type: "CLASSROOM",
    status: "ENDED",
    questionIndexes: [8, 6, 0, 3, 2],
    submittedCount: 38,
    expectedCount: 40,
    durationMinutes: 8,
    deadline: "",
    updatedAt: "2026-09-03 10:18",
  },
  {
    name: "第二章线性表课后作业",
    description: "复习顺序表、链表及常见基本操作。",
    type: "HOMEWORK",
    status: "ENDED",
    questionIndexes: [1, 2, 4, 6, 9, 11],
    submittedCount: 39,
    expectedCount: 40,
    durationMinutes: null,
    deadline: "2026-09-10 23:59",
    updatedAt: "2026-09-10 23:59",
  },
  {
    name: "链表插入与删除课堂练习",
    description: "围绕单链表插入、删除与指针关系进行即时练习。",
    type: "CLASSROOM",
    status: "ENDED",
    questionIndexes: [1, 4, 9, 11],
    submittedCount: 40,
    expectedCount: 40,
    durationMinutes: 6,
    deadline: "",
    updatedAt: "2026-09-15 11:02",
  },
  {
    name: "第二章综合巩固作业",
    description: "覆盖线性表常见存储结构与复杂度分析。",
    type: "HOMEWORK",
    status: "ENDED",
    questionIndexes: [1, 2, 4, 6, 9, 11, 8],
    submittedCount: 37,
    expectedCount: 40,
    durationMinutes: null,
    deadline: "2026-09-20 23:59",
    updatedAt: "2026-09-20 23:59",
  },
  {
    name: "栈的基本概念课堂练习",
    description: "检查栈的特点、基本操作与典型应用。",
    type: "CLASSROOM",
    status: "ENDED",
    questionIndexes: [0, 5, 10, 3],
    submittedCount: 39,
    expectedCount: 40,
    durationMinutes: 7,
    deadline: "",
    updatedAt: "2026-09-24 09:52",
  },
  {
    name: "第三章栈与队列课后作业",
    description: "覆盖栈、队列、循环队列与一道简答题。",
    type: "HOMEWORK",
    status: "ENDED",
    questionIndexes: [0, 3, 5, 7, 10, 12],
    submittedCount: 40,
    expectedCount: 40,
    durationMinutes: null,
    deadline: "2026-09-30 23:59",
    updatedAt: "2026-09-30 23:59",
  },
  {
    name: "循环队列随堂检测",
    description: "课堂结束前进行一次短时检测。",
    type: "CLASSROOM",
    status: "ACTIVE",
    questionIndexes: [3, 7, 0, 5, 10],
    submittedCount: 32,
    expectedCount: 40,
    durationMinutes: 5,
    deadline: "",
    updatedAt: "2026-10-06 10:36",
  },
  {
    name: "第三章综合复习作业",
    description: "用于课后继续巩固栈与队列相关知识。",
    type: "HOMEWORK",
    status: "ACTIVE",
    questionIndexes: [0, 3, 5, 7, 10, 8, 12],
    submittedCount: 26,
    expectedCount: 40,
    durationMinutes: null,
    deadline: "2026-10-10 23:59",
    updatedAt: "2026-10-05 18:20",
  },
  {
    name: "数组基础课堂练习",
    description: "下一节课使用的数组基础随堂题。",
    type: "CLASSROOM",
    status: "DRAFT",
    questionIndexes: [6, 8, 2, 1, 7],
    submittedCount: 0,
    expectedCount: 40,
    durationMinutes: 8,
    deadline: "",
    updatedAt: "2026-10-05 21:10",
  },
  {
    name: "第四章预习作业",
    description: "面向串、数组和广义表的课前预习。",
    type: "HOMEWORK",
    status: "DRAFT",
    questionIndexes: [6, 8, 2, 1, 11, 4],
    submittedCount: 0,
    expectedCount: 40,
    durationMinutes: null,
    deadline: "2026-10-15 23:59",
    updatedAt: "2026-10-05 20:42",
  },
  {
    name: "串的基本操作课堂练习",
    description: "课堂练习草稿，后续继续补充题目。",
    type: "CLASSROOM",
    status: "DRAFT",
    questionIndexes: [8, 6, 1, 2],
    submittedCount: 0,
    expectedCount: 40,
    durationMinutes: 5,
    deadline: "",
    updatedAt: "2026-10-04 16:30",
  },
  {
    name: "数组与矩阵课后作业",
    description: "课后作业草稿，暂未发布。",
    type: "HOMEWORK",
    status: "DRAFT",
    questionIndexes: [6, 8, 1, 2, 4],
    submittedCount: 0,
    expectedCount: 40,
    durationMinutes: null,
    deadline: "2026-10-18 23:59",
    updatedAt: "2026-10-03 19:12",
  },
  {
    name: "算法复杂度补充练习",
    description: "针对前期易错知识点补充练习。",
    type: "CLASSROOM",
    status: "ACTIVE",
    questionIndexes: [8, 6, 11, 1],
    submittedCount: 21,
    expectedCount: 40,
    durationMinutes: 6,
    deadline: "",
    updatedAt: "2026-10-02 14:26",
  },
  {
    name: "阶段一综合复习作业",
    description: "覆盖第一至第三章的阶段性复习。",
    type: "HOMEWORK",
    status: "ACTIVE",
    questionIndexes: [8, 1, 2, 4, 6, 9, 0, 3, 5, 13],
    submittedCount: 18,
    expectedCount: 40,
    durationMinutes: null,
    deadline: "2026-10-12 23:59",
    updatedAt: "2026-10-01 22:08",
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toExerciseQuestionSnapshot(question, exerciseId, order) {
  const normalized = normalizeQuestion(question);

  return {
    ...clone(normalized),
    id: `${exerciseId}-question-${String(order + 1).padStart(2, "0")}`,
    sourceQuestionId: String(question.id),
    score: 10,
  };
}

export function createSubjectiveGradingTestExercise(teachingClassId) {
  const classId = String(teachingClassId || "");
  const bankQuestions = createQuestionMockData(classId);
  const id = `${classId || "class"}-exercise-subjective-grading-test-v1`;
  const questionIndexes = [0, 7, 12, 13];
  const scores = [10, 10, 15, 15];

  const questions = questionIndexes
    .map((questionIndex, questionOrder) => {
      const sourceQuestion = bankQuestions[questionIndex];
      if (!sourceQuestion) return null;
      return {
        ...toExerciseQuestionSnapshot(sourceQuestion, id, questionOrder),
        score: scores[questionOrder] || 10,
      };
    })
    .filter(Boolean);

  return {
    id,
    fixtureKey: "subjective-grading-test-v1",
    teachingClassId: classId,
    name: "简答题批改测试",
    description: "用于验证客观题自动判分与简答题人工批改流程。",
    type: "HOMEWORK",
    status: "ACTIVE",
    questions,
    questionCount: questions.length,
    submittedCount: 8,
    expectedCount: 10,
    durationMinutes: null,
    deadline: "2026-10-20 23:59",
    createdAt: "2026-10-06 20:30",
    updatedAt: "2026-10-06 20:30",
  };
}

export function createExerciseMockData(teachingClassId) {
  const classId = String(teachingClassId || "");
  const bankQuestions = createQuestionMockData(classId);

  const exercises = clone(exerciseTemplates).map((item, index) => {
    const id = `${classId || "class"}-exercise-${String(index + 1).padStart(
      2,
      "0"
    )}`;

    const questions = item.questionIndexes
      .map((questionIndex, questionOrder) => {
        const sourceQuestion = bankQuestions[questionIndex];
        if (!sourceQuestion) return null;
        return toExerciseQuestionSnapshot(sourceQuestion, id, questionOrder);
      })
      .filter(Boolean);

    const { questionIndexes, ...exercise } = item;

    return {
      ...exercise,
      id,
      teachingClassId: classId,
      questions,
      questionCount: questions.length,
      createdAt: item.updatedAt,
    };
  });

  exercises.unshift(createSubjectiveGradingTestExercise(classId));
  return exercises;
}
