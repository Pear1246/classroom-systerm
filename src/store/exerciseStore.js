import { defineStore } from "pinia";
import {
  createExerciseMockData,
  createSubjectiveGradingTestExercise,
} from "../mock/exerciseBank";

const STORAGE_KEY = "zhike-exercise-bank-v2";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadStoredExercises() {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.warn("练习 Mock 数据读取失败：", error);
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

function createExerciseId() {
  return `exercise-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createExerciseQuestionId(index = 0) {
  return `exercise-question-${Date.now()}-${index}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function hasValidExerciseScore(questions = []) {
  let total = 0;

  for (const question of questions) {
    const score = Number(question?.score);
    if (!Number.isFinite(score) || score < 1 || score > 100) return false;
    total += score;
  }

  return total <= 100;
}

export const useExerciseStore = defineStore("exerciseBank", {
  state: () => ({
    teachingClassExercises: loadStoredExercises(),
  }),

  actions: {
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(this.teachingClassExercises)
      );
    },

    ensureTeachingClass(teachingClassId) {
      const key = String(teachingClassId || "");

      if (!key) {
        return [];
      }

      if (!Array.isArray(this.teachingClassExercises[key])) {
        this.teachingClassExercises[key] = createExerciseMockData(key);
        this.persist();
      } else {
        const hasSubjectiveFixture = this.teachingClassExercises[key].some(
          (item) => item.fixtureKey === "subjective-grading-test-v1"
        );

        if (!hasSubjectiveFixture) {
          this.teachingClassExercises[key].unshift(
            createSubjectiveGradingTestExercise(key)
          );
          this.persist();
        }
      }

      return this.teachingClassExercises[key];
    },

    getExercises(teachingClassId) {
      return this.ensureTeachingClass(teachingClassId);
    },

    getExercise(teachingClassId, exerciseId) {
      const exercises = this.ensureTeachingClass(teachingClassId);

      return (
        exercises.find((item) => String(item.id) === String(exerciseId)) || null
      );
    },

    saveExercise(teachingClassId, payload) {
      const classId = String(teachingClassId || "");
      const exercises = this.ensureTeachingClass(classId);
      const now = formatDateTime();
      const questions = clone(payload.questions || []);

      if (!hasValidExerciseScore(questions)) {
        return null;
      }

      if (payload.id) {
        const index = exercises.findIndex(
          (item) => String(item.id) === String(payload.id)
        );

        if (index < 0) {
          return null;
        }

        const previous = exercises[index];
        const nextExercise = {
          ...previous,
          ...payload,
          id: String(payload.id),
          teachingClassId: classId,
          questions,
          questionCount: questions.length,
          updatedAt: now,
        };

        exercises.splice(index, 1, nextExercise);
        this.persist();
        return clone(nextExercise);
      }

      const id = createExerciseId();
      const nextExercise = {
        ...payload,
        id,
        teachingClassId: classId,
        questions,
        questionCount: questions.length,
        submittedCount: payload.submittedCount ?? 0,
        expectedCount: payload.expectedCount ?? 0,
        createdAt: now,
        updatedAt: now,
      };

      exercises.unshift(nextExercise);
      this.persist();

      return clone(nextExercise);
    },

    linkQuestionToBank(
      teachingClassId,
      exerciseId,
      exerciseQuestionId,
      sourceQuestionId,
      source = "MANUAL"
    ) {
      const exercise = this.getExercise(teachingClassId, exerciseId);

      if (!exercise) {
        return null;
      }

      const question = (exercise.questions || []).find(
        (item) => String(item.id) === String(exerciseQuestionId)
      );

      if (!question) {
        return null;
      }

      question.sourceQuestionId = String(sourceQuestionId || "");
      question.source = source || "MANUAL";
      exercise.updatedAt = formatDateTime();
      this.persist();

      return clone(question);
    },

    endActiveExercises(teachingClassId) {
      const exercises = this.ensureTeachingClass(teachingClassId);
      const now = formatDateTime();
      let changedCount = 0;

      exercises.forEach((exercise, index) => {
        if (exercise.status !== "ACTIVE") {
          return;
        }

        exercises[index] = {
          ...exercise,
          status: "ENDED",
          endedAt: now,
          updatedAt: now,
        };
        changedCount += 1;
      });

      if (changedCount > 0) {
        this.persist();
      }

      return changedCount;
    },

    endExercise(teachingClassId, exerciseId) {
      const exercises = this.ensureTeachingClass(teachingClassId);
      const index = exercises.findIndex(
        (item) => String(item.id) === String(exerciseId)
      );

      if (index < 0 || exercises[index].status !== "ACTIVE") {
        return null;
      }

      const now = formatDateTime();
      exercises[index] = {
        ...exercises[index],
        status: "ENDED",
        endedAt: now,
        updatedAt: now,
      };
      this.persist();

      return clone(exercises[index]);
    },

    duplicateExerciseAsDraft(teachingClassId, exerciseId) {
      const exercises = this.ensureTeachingClass(teachingClassId);
      const source = exercises.find(
        (item) => String(item.id) === String(exerciseId)
      );

      if (!source) {
        return null;
      }

      const now = formatDateTime();
      const id = createExerciseId();
      const questions = clone(source.questions || []).map(
        (question, index) => ({
          ...question,
          id: createExerciseQuestionId(index),
        })
      );

      const nextExercise = {
        ...clone(source),
        id,
        teachingClassId: String(teachingClassId || ""),
        name: `${source.name}（副本）`,
        status: "DRAFT",
        questions,
        questionCount: questions.length,
        submittedCount: 0,
        expectedCount: 0,
        deadline: source.type === "HOMEWORK" ? "" : source.deadline || "",
        createdAt: now,
        updatedAt: now,
        endedAt: "",
        reusedFromExerciseId: String(source.id),
      };

      exercises.unshift(nextExercise);
      this.persist();

      return clone(nextExercise);
    },

    duplicateExerciseToTeachingClass(
      sourceTeachingClassId,
      exerciseId,
      targetTeachingClassId
    ) {
      const sourceExercises = this.ensureTeachingClass(sourceTeachingClassId);
      const source = sourceExercises.find(
        (item) => String(item.id) === String(exerciseId)
      );

      if (!source) {
        return null;
      }

      const targetClassId = String(targetTeachingClassId || "");
      if (
        !targetClassId ||
        targetClassId === String(sourceTeachingClassId || "")
      ) {
        return null;
      }

      const targetExercises = this.ensureTeachingClass(targetClassId);
      const now = formatDateTime();
      const id = createExerciseId();
      const questions = clone(source.questions || []).map(
        (question, index) => ({
          ...question,
          id: createExerciseQuestionId(index),
        })
      );

      const nextExercise = {
        ...clone(source),
        id,
        teachingClassId: targetClassId,
        name: source.name,
        status: "DRAFT",
        questions,
        questionCount: questions.length,
        submittedCount: 0,
        expectedCount: 0,
        deadline: source.type === "HOMEWORK" ? "" : source.deadline || "",
        createdAt: now,
        updatedAt: now,
        endedAt: "",
        copiedFromExerciseId: String(source.id),
        copiedFromTeachingClassId: String(sourceTeachingClassId || ""),
      };

      targetExercises.unshift(nextExercise);
      this.persist();

      return clone(nextExercise);
    },

    deleteExercise(teachingClassId, exerciseId) {
      const exercises = this.ensureTeachingClass(teachingClassId);
      const index = exercises.findIndex(
        (item) => String(item.id) === String(exerciseId)
      );

      if (index < 0 || exercises[index].status !== "DRAFT") {
        return null;
      }

      const [removed] = exercises.splice(index, 1);
      this.persist();

      return removed;
    },
  },
});
