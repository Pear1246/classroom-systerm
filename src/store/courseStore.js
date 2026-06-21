import { defineStore } from "pinia";
import { getTeachingClasses } from "../api/teacher";

export const useCourseStore = defineStore("course", {
  state: () => ({
    currentCourseId: null,
    currentTeachingClassId: null,

    // 当前为前端测试用 mock 数据，后端接口请求成功后会被真实数据覆盖
    teachingClasses: [
      {
        id: 101,
        courseId: 101,
        classId: 101,
        courseName: "数据结构",
        className: "24计算机科学与技术1班",
        semester: "2025-2026 第二学期",
        studentCount: 20,
        code: "DS101",
        isPinned: true,
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
        isPinned: true,
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
        isPinned: false,
      },
    ],
  }),

  getters: {
    currentTeachingClass(state) {
      return (
        state.teachingClasses.find(
          (item) => item.id === state.currentTeachingClassId
        ) || null
      );
    },
  },

  actions: {
    switchCourse(id) {
      this.currentCourseId = Number(id);
    },

    switchTeachingClass(id) {
      const teachingClassId = Number(id);

      const target = this.teachingClasses.find(
        (item) => item.id === teachingClassId
      );

      if (!target) return null;

      this.currentTeachingClassId = target.id;
      this.currentCourseId = target.courseId;

      return target;
    },

    async fetchTeachingClasses(teacherId) {
      try {
        const res = await getTeachingClasses(teacherId);

        const list = Array.isArray(res) ? res : [];

        this.teachingClasses = list.map((item, index) => {
          return {
            // 后端 class 表 id，就是我们的 teachingClassId
            id: Number(item.id),

            // 这里为了兼容前端原有结构，courseId 和 classId 都用后端 class.id
            courseId: Number(item.id),
            classId: Number(item.id),

            // 后端字段：courseName
            courseName: item.courseName || item.course_name || "未设置课程",

            // 后端字段：name，代表教学班/班级名称
            className: item.name || item.className || "未命名班级",

            semester: item.semester || "未设置学期",

            studentCount: item.studentCount || 0,

            // 后端字段：courseCode
            code: item.courseCode || item.course_code || `TC${item.id}`,

            // 前两个默认置顶，后端以后也可以返回 isPinned
            isPinned: item.isPinned ?? index < 2,
          };
        });
      } catch (error) {
        console.error("获取课程空间失败，继续使用前端 mock 数据：", error);
      }
    },
  },
});
