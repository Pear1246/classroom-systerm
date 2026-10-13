import { defineStore } from "pinia";
import { getSemesterLifecycleStatus } from "../utils/semester";

const STORAGE_KEY = "teachingClassLifecycleMap";

function loadLifecycleMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error("读取课程生命周期状态失败：", error);
    return {};
  }
}

function saveLifecycleMap(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function normalizeExplicitStatus(value) {
  const status = String(value || "").toUpperCase();

  if (["UPCOMING", "ACTIVE", "ENDED"].includes(status)) {
    return status;
  }

  return "";
}

export const useCourseLifecycleStore = defineStore("courseLifecycle", {
  state: () => ({
    lifecycleMap: loadLifecycleMap(),
  }),

  actions: {
    getLifecycle(teachingClass, date = new Date()) {
      const id =
        typeof teachingClass === "object" && teachingClass !== null
          ? teachingClass.id
          : teachingClass;

      const key = String(id || "");
      const localLifecycle = key ? this.lifecycleMap[key] : null;
      const localStatus = normalizeExplicitStatus(localLifecycle?.status);

      // 手动结课的结果优先级最高。
      if (localStatus === "ENDED") {
        return {
          status: "ENDED",
          endedAt: localLifecycle?.endedAt || null,
        };
      }

      const course =
        typeof teachingClass === "object" && teachingClass !== null
          ? teachingClass
          : null;

      const backendStatus = normalizeExplicitStatus(course?.status);

      // 后端若已经明确记录结课，也应保持为已结课。
      if (backendStatus === "ENDED") {
        return {
          status: "ENDED",
          endedAt: course?.endedAt || course?.ended_at || null,
        };
      }

      const semester = course?.semester || "";
      const semesterStatus = semester
        ? getSemesterLifecycleStatus(semester, date)
        : "";

      // 第一版由学期时间推导未开始 / 进行中 / 已结课。
      // 将来后端提供真实学期起止日期后，只需替换这一层判断来源。
      const status = semesterStatus || backendStatus || "ACTIVE";

      return {
        status,
        endedAt: course?.endedAt || course?.ended_at || null,
      };
    },

    getStatus(teachingClass, date = new Date()) {
      return this.getLifecycle(teachingClass, date).status;
    },

    isUpcoming(teachingClass, date = new Date()) {
      return this.getStatus(teachingClass, date) === "UPCOMING";
    },

    isActive(teachingClass, date = new Date()) {
      return this.getStatus(teachingClass, date) === "ACTIVE";
    },

    isEnded(teachingClass, date = new Date()) {
      return this.getStatus(teachingClass, date) === "ENDED";
    },

    endCourse(teachingClassId) {
      const key = String(teachingClassId || "");

      if (!key) {
        throw new Error("缺少教学班 ID，无法结束课程");
      }

      const lifecycle = {
        status: "ENDED",
        endedAt: new Date().toISOString(),
      };

      this.lifecycleMap = {
        ...this.lifecycleMap,
        [key]: lifecycle,
      };

      saveLifecycleMap(this.lifecycleMap);

      return lifecycle;
    },
  },
});
