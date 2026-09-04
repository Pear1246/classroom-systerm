import { defineStore } from "pinia";
import { getTeachingClasses } from "../api/teacher";

const LOCAL_COURSE_KEY = "localTeachingClasses";
const PINNED_COURSE_KEY = "pinnedTeachingClassMap";
const DELETED_COURSE_KEY = "deletedTeachingClassIds";

function loadLocalTeachingClasses() {
  try {
    const data = localStorage.getItem(LOCAL_COURSE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("读取本地新增课程失败：", error);
    return [];
  }
}

function saveLocalTeachingClasses(list) {
  localStorage.setItem(LOCAL_COURSE_KEY, JSON.stringify(list));
}

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

function loadDeletedTeachingClassIds() {
  try {
    const data = localStorage.getItem(DELETED_COURSE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("读取已删除课程失败：", error);
    return [];
  }
}

function saveDeletedTeachingClassIds(list) {
  localStorage.setItem(DELETED_COURSE_KEY, JSON.stringify(list));
}

const mockTeachingClasses = [
  {
    id: 101,
    courseId: 101,
    classId: 101,
    courseName: "数据结构",
    className: "24计算机科学与技术1班",
    semester: "2025-2026 第二学期",
    studentCount: 20,
    code: "DS101",
    teacherId: 1,
    teacherName: "张老师",
    isPinned: true,
    isLocal: false,
  },
  {
    id: 102,
    courseId: 102,
    classId: 102,
    courseName: "数据库原理及应用",
    className: "24软件工程1班",
    semester: "2025-2026 第二学期",
    studentCount: 20,
    code: "DB102",
    teacherId: 1,
    teacherName: "张老师",
    isPinned: true,
    isLocal: false,
  },
  {
    id: 103,
    courseId: 103,
    classId: 103,
    courseName: "数字逻辑电路",
    className: "24人工智能1班",
    semester: "2025-2026 第二学期",
    studentCount: 20,
    code: "DL103",
    teacherId: 2,
    teacherName: "李老师",
    isPinned: false,
    isLocal: false,
  },
];

export const useCourseStore = defineStore("course", {
  state: () => {
    const localTeachingClasses = loadLocalTeachingClasses();
    const pinnedTeachingClassMap = loadPinnedTeachingClassMap();
    const deletedTeachingClassIds = loadDeletedTeachingClassIds();

    const deletedIdSet = new Set(
      deletedTeachingClassIds.map((item) => Number(item))
    );

    const allCourses = [...mockTeachingClasses, ...localTeachingClasses]
      .filter((item) => !deletedIdSet.has(Number(item.id)))
      .map((item) => {
        const key = String(item.id);

        if (key in pinnedTeachingClassMap) {
          return {
            ...item,
            isPinned: pinnedTeachingClassMap[key],
          };
        }

        return item;
      });

    return {
      currentCourseId: null,
      currentTeachingClassId: null,

      localTeachingClasses,
      pinnedTeachingClassMap,
      deletedTeachingClassIds,

      teachingClasses: allCourses,
    };
  },

  getters: {
    currentTeachingClass(state) {
      return (
        state.teachingClasses.find(
          (item) => Number(item.id) === Number(state.currentTeachingClassId)
        ) || null
      );
    },
  },

  actions: {
    isDeleted(id) {
      return this.deletedTeachingClassIds.some(
        (item) => Number(item) === Number(id)
      );
    },

    applyDeletedFilter(list) {
      return list.filter((item) => !this.isDeleted(item.id));
    },

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

    loadAllTeachingClasses() {
      this.localTeachingClasses = loadLocalTeachingClasses();
      this.deletedTeachingClassIds = loadDeletedTeachingClassIds();
      this.pinnedTeachingClassMap = loadPinnedTeachingClassMap();

      this.teachingClasses = this.applyPinnedMap(
        this.applyDeletedFilter([
          ...mockTeachingClasses,
          ...this.localTeachingClasses,
        ])
      );
    },

    switchCourse(id) {
      this.currentCourseId = Number(id);
    },

    switchTeachingClass(id) {
      const teachingClassId = Number(id);

      const target = this.teachingClasses.find(
        (item) => Number(item.id) === teachingClassId
      );

      if (!target) return null;

      this.currentTeachingClassId = target.id;
      this.currentCourseId = target.courseId;

      return target;
    },

    getTeachingClassesByTeacher(teacherId) {
      return this.teachingClasses.filter((item) => {
        return Number(item.teacherId) === Number(teacherId);
      });
    },

    async fetchTeachingClasses(teacherId) {
      try {
        const res = await getTeachingClasses(teacherId);

        const list = Array.isArray(res) ? res : [];

        const backendTeachingClasses = list.map((item, index) => {
          return {
            id: Number(item.id),
            courseId: Number(item.id),
            classId: Number(item.id),

            courseName: item.courseName || item.course_name || "未设置课程",

            className: item.name || item.className || "未命名班级",

            semester: item.semester || "未设置学期",

            studentCount: item.studentCount || 0,

            code: item.courseCode || item.course_code || `TC${item.id}`,

            teacherId: Number(item.teacherId || item.teacher_id || teacherId),
            teacherName: item.teacherName || item.teacher_name || "张老师",

            isPinned: item.isPinned ?? index < 2,

            isLocal: false,
          };
        });

        const currentTeacherLocalCourses = this.localTeachingClasses.filter(
          (item) => Number(item.teacherId) === Number(teacherId)
        );

        this.teachingClasses = this.applyPinnedMap(
          this.applyDeletedFilter([
            ...backendTeachingClasses,
            ...currentTeacherLocalCourses,
          ])
        );
      } catch (error) {
        console.warn("获取后端课程失败，使用本地课程空间数据：", error);

        this.loadAllTeachingClasses();
      }
    },

    addTeachingClass(formData) {
      const id = Date.now();

      const newTeachingClass = {
        id,
        courseId: id,
        classId: id,

        courseName: formData.courseName.trim(),
        className: formData.className.trim(),
        semester: formData.semester.trim(),
        studentCount: Number(formData.studentCount) || 0,
        code: formData.code.trim() || `TC${id}`,

        teacherId: Number(formData.teacherId || 1),
        teacherName: formData.teacherName || "张老师",

        isPinned: formData.isPinned || false,
        isLocal: true,
      };

      this.localTeachingClasses.push(newTeachingClass);
      saveLocalTeachingClasses(this.localTeachingClasses);

      this.teachingClasses.push(newTeachingClass);

      return newTeachingClass;
    },

    toggleTeachingClassPinned(id) {
      const teachingClassId = Number(id);

      const target = this.teachingClasses.find(
        (item) => Number(item.id) === teachingClassId
      );

      if (!target) return;

      target.isPinned = !target.isPinned;

      this.pinnedTeachingClassMap[String(teachingClassId)] = target.isPinned;
      savePinnedTeachingClassMap(this.pinnedTeachingClassMap);

      this.localTeachingClasses = this.localTeachingClasses.map((item) => {
        if (Number(item.id) === teachingClassId) {
          return {
            ...item,
            isPinned: target.isPinned,
          };
        }

        return item;
      });

      saveLocalTeachingClasses(this.localTeachingClasses);
    },

    deleteTeachingClass(id) {
      const teachingClassId = Number(id);

      const target = this.teachingClasses.find(
        (item) => Number(item.id) === teachingClassId
      );

      if (!target) return;

      this.localTeachingClasses = this.localTeachingClasses.filter(
        (item) => Number(item.id) !== teachingClassId
      );

      saveLocalTeachingClasses(this.localTeachingClasses);

      if (!target.isLocal) {
        const alreadyDeleted = this.deletedTeachingClassIds.some(
          (item) => Number(item) === teachingClassId
        );

        if (!alreadyDeleted) {
          this.deletedTeachingClassIds.push(teachingClassId);
          saveDeletedTeachingClassIds(this.deletedTeachingClassIds);
        }
      }

      this.teachingClasses = this.teachingClasses.filter(
        (item) => Number(item.id) !== teachingClassId
      );

      delete this.pinnedTeachingClassMap[String(teachingClassId)];
      savePinnedTeachingClassMap(this.pinnedTeachingClassMap);

      if (Number(this.currentTeachingClassId) === teachingClassId) {
        this.currentTeachingClassId = null;
        this.currentCourseId = null;
      }
    },

    deleteLocalTeachingClass(id) {
      this.deleteTeachingClass(id);
    },
  },
});
