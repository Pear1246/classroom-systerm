import { defineStore } from "pinia";
import { createExerciseSubmissionMockData } from "../mock/exerciseSubmissions";

const STORAGE_KEY = "zhike-exercise-submissions-v1";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadStoredSubmissions() {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.warn("练习提交记录读取失败：", error);
    return {};
  }
}

function ensureAnswerRecords(submissions, exercise) {
  const questions = Array.isArray(exercise?.questions)
    ? exercise.questions
    : [];

  return submissions.map((submission) => {
    if (!submission.submitted) return submission;

    const answerMap = new Map(
      (submission.answers || []).map((item) => [String(item.questionId), item])
    );

    return {
      ...submission,
      answers: questions.map((question) => {
        const existing = answerMap.get(String(question.id));
        if (existing) return existing;

        return {
          questionId: String(question.id),
          answer: [],
          answerText: "",
          teacherScore: null,
          teacherComment: "",
        };
      }),
    };
  });
}

export const useExerciseSubmissionStore = defineStore("exerciseSubmissions", {
  state: () => ({
    byTeachingClass: loadStoredSubmissions(),
  }),

  actions: {
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.byTeachingClass));
    },

    ensureExercise(teachingClassId, exercise) {
      const classId = String(teachingClassId || "");
      const exerciseId = String(exercise?.id || "");
      if (!classId || !exerciseId) return [];

      if (!this.byTeachingClass[classId]) {
        this.byTeachingClass[classId] = {};
      }

      if (!Array.isArray(this.byTeachingClass[classId][exerciseId])) {
        this.byTeachingClass[classId][exerciseId] =
          createExerciseSubmissionMockData(exercise);
        this.persist();
      } else {
        const synced = ensureAnswerRecords(
          this.byTeachingClass[classId][exerciseId],
          exercise
        );
        this.byTeachingClass[classId][exerciseId] = synced;
        this.persist();
      }

      return this.byTeachingClass[classId][exerciseId];
    },

    getSubmissions(teachingClassId, exercise) {
      return this.ensureExercise(teachingClassId, exercise);
    },

    getSubmission(teachingClassId, exercise, studentId) {
      const submissions = this.ensureExercise(teachingClassId, exercise);
      return (
        submissions.find(
          (item) => String(item.studentId) === String(studentId)
        ) || null
      );
    },

    saveSubjectiveGrade(
      teachingClassId,
      exerciseId,
      studentId,
      questionId,
      payload
    ) {
      const classId = String(teachingClassId || "");
      const currentExerciseId = String(exerciseId || "");
      const submissions = this.byTeachingClass[classId]?.[currentExerciseId];
      if (!Array.isArray(submissions)) return null;

      const submission = submissions.find(
        (item) => String(item.studentId) === String(studentId)
      );
      if (!submission) return null;

      const answer = (submission.answers || []).find(
        (item) => String(item.questionId) === String(questionId)
      );
      if (!answer) return null;

      answer.teacherScore =
        payload.teacherScore === null || payload.teacherScore === ""
          ? null
          : Number(payload.teacherScore);
      answer.teacherComment = String(payload.teacherComment || "");
      this.persist();

      return clone(answer);
    },
  },
});
