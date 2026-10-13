import { defineStore } from "pinia";
import { createQuestionMockData } from "../mock/questionBank";
import { QUESTION_SOURCES, normalizeQuestion } from "../utils/questionModel";

const STORAGE_KEY = "zhike-question-bank-v1";

function loadStoredQuestions() {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.warn("题库本地数据读取失败：", error);
    return {};
  }
}

function formatDateTime() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function createQuestionId() {
  return `question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useQuestionStore = defineStore("questionBank", {
  state: () => ({
    // 这里按“课程题库作用域”存放。当前后端 courseId 与教学班 id 暂时相同，
    // 以后后端返回稳定 Course ID 后，调用方只需把 courseId 传进来即可共享题库。
    courseQuestions: loadStoredQuestions(),
  }),

  actions: {
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.courseQuestions));
    },

    ensureCourse(courseId) {
      const key = String(courseId || "");

      if (!key) {
        return [];
      }

      if (!Array.isArray(this.courseQuestions[key])) {
        this.courseQuestions[key] = createQuestionMockData(key);
        this.persist();
        return this.courseQuestions[key];
      }

      // 对旧 Mock 数据做一次无感升级，为简答题与未来 AI 题目补齐统一字段。
      this.courseQuestions[key] = this.courseQuestions[key].map((question) =>
        normalizeQuestion({
          ...question,
          id: String(question.id),
          courseId: key,
          source: question.source || QUESTION_SOURCES.MANUAL,
        })
      );
      this.persist();

      return this.courseQuestions[key];
    },

    getQuestions(courseId) {
      return this.ensureCourse(courseId);
    },

    getQuestion(courseId, questionId) {
      const questions = this.ensureCourse(courseId);

      return (
        questions.find((item) => String(item.id) === String(questionId)) || null
      );
    },

    saveQuestion(courseId, payload) {
      const scopeId = String(courseId || "");
      const questions = this.ensureCourse(scopeId);
      const now = formatDateTime();

      if (payload.id) {
        const index = questions.findIndex(
          (item) => String(item.id) === String(payload.id)
        );

        if (index < 0) {
          return null;
        }

        const nextQuestion = normalizeQuestion({
          ...questions[index],
          ...payload,
          id: String(payload.id),
          courseId: scopeId,
          updatedAt: now,
        });

        questions.splice(index, 1, nextQuestion);
        this.persist();

        return nextQuestion;
      }

      const nextQuestion = normalizeQuestion({
        ...payload,
        id: createQuestionId(),
        courseId: scopeId,
        source: payload.source || QUESTION_SOURCES.MANUAL,
        aiMeta: payload.aiMeta ?? null,
        createdAt: now,
        updatedAt: now,
      });

      questions.unshift(nextQuestion);
      this.persist();

      return nextQuestion;
    },

    deleteQuestion(courseId, questionId) {
      const questions = this.ensureCourse(courseId);
      const index = questions.findIndex(
        (item) => String(item.id) === String(questionId)
      );

      if (index < 0) {
        return null;
      }

      const [removed] = questions.splice(index, 1);
      this.persist();

      return removed;
    },
  },
});
