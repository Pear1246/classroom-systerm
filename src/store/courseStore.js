import { defineStore } from "pinia";
import { getTeachingClasses } from "../api/teacher";

const PINNED_COURSE_KEY = "pinnedTeachingClassMap";

function loadPinnedTeachingClassMap() {
  try {
    const data = localStorage.getItem(PINNED_COURSE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("读取课程置顶状态失败：", error);
    return {};
  }
}

function savePinnedTeachingClassMap(map) {
  localStorage.setItem(PINNED_COURSE_KEY, JSON.stringify(map));
}

function clearLegacyCourseMockCache() {
  localStorage.removeItem("localTeachingClasses");
  localStorage.removeItem("deletedTeachingClassIds");
}

export const useCourseStore = defineStore("course", {
  state: () => {
    clearLegacyCourseMockCache();

    return {
      currentCourseId: null,
      currentTeachingClassId: null,

      pinnedTeachingClassMap: loadPinnedTeachingClassMap(),

      teachingClasses: [],
    };
  },

  getters: {
    currentTeachingClass(state) {
      return (
        state.teachingClasses.find(
          (item) => String(item.id) === String(state.currentTeachingClassId)
        ) || null
      );
    },
  },

  actions: {
    applyPinnedMap(list) {
      return list.map((item) => {
        const key = String(item.id);

        if (key in this.pinnedTeachingClassMap) {
          return {
            ...item,
            isPinned: this.pinnedTeachingClassMap[key],
          };
        }

        return item;
      });
    },

    switchCourse(id) {
      this.currentCourseId = id;
    },

    switchTeachingClass(id) {
      const target = this.teachingClasses.find(
        (item) => String(item.id) === String(id)
      );

      if (!target) {
        return null;
      }

      this.currentTeachingClassId = target.id;
      this.currentCourseId = target.courseId;

      return target;
    },

    getTeachingClassesByTeacher(teacherId) {
      return this.teachingClasses.filter(
        (item) => String(item.teacherId) === String(teacherId)
      );
    },

    async fetchTeachingClasses(teacherId) {
      try {
        const res = await getTeachingClasses(teacherId);

        const list = Array.isArray(res) ? res : [];

        const backendTeachingClasses = list.map((item, index) => ({
          id: item.id,
          courseId: item.id,
          classId: item.id,

          courseName: item.courseName || item.course_name || "未设置课程",

          className: item.name || item.className || "未命名班级",

          semester: item.semester || "未设置学期",

          studentCount: item.studentCount || 0,

          code: item.courseCode || item.course_code || `TC${item.id}`,

          teacherId: item.teacherId ?? item.teacher_id ?? teacherId,

          teacherName: item.teacherName || item.teacher_name || "教师",

          isPinned: item.isPinned ?? index < 2,
        }));

        this.teachingClasses = this.applyPinnedMap(backendTeachingClasses);

        return this.teachingClasses;
      } catch (error) {
        console.error("获取教师课程空间失败：", error);

        this.teachingClasses = [];
        return [];
      }
    },

    toggleTeachingClassPinned(id) {
      const target = this.teachingClasses.find(
        (item) => String(item.id) === String(id)
      );

      if (!target) {
        return;
      }

      target.isPinned = !target.isPinned;

      const key = String(target.id);

      this.pinnedTeachingClassMap[key] = target.isPinned;

      savePinnedTeachingClassMap(this.pinnedTeachingClassMap);
    },
  },
});
