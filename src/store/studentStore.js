import { defineStore } from "pinia";
import { getStudents, getPerformance, getRanking } from "../api/student";
import { drawStudent, submitDrawScore } from "../api/draw";
import { useCourseStore } from "./courseStore";
import { useStudentAccountStore } from "./studentAccountStore";

export const useStudentStore = defineStore("student", {
  state: () => ({
    students: [],
    ranking: [],
    performances: [],
  }),

  actions: {
    formatStudent(item, classId = null, className = "") {
      const totalCalled = item.totalCalled ?? item.count ?? 0;
      const totalScore = item.totalScore ?? item.score ?? 0;

      const avgScore =
        item.avgScore ??
        item.average ??
        (totalCalled > 0 ? (totalScore / totalCalled).toFixed(1) : 0);

      return {
        id: item.id || item.studentNo,
        studentNo: item.studentNo || item.student_no || item.number || "",
        name: item.name || item.studentName || "未命名学生",

        grade: item.grade || "",
        classId: item.classId || item.class_id || classId,
        className: item.className || item.class_name || className || "",

        count: totalCalled,
        score: totalScore,
        average: avgScore,

        totalCalled,
        totalScore,
        avgScore,
      };
    },

    getLocalStudentsForClass(teachingClassId) {
      const courseStore = useCourseStore();
      const studentAccountStore = useStudentAccountStore();

      const course = courseStore.teachingClasses.find(
        (item) => Number(item.id) === Number(teachingClassId)
      );

      if (!course) return [];

      const joinedStudents =
        studentAccountStore.getJoinedStudentsByCourse(course);

      return joinedStudents.map((item) =>
        this.formatStudent(item, Number(teachingClassId), course.className)
      );
    },

    async fetchStudents(teachingClassId) {
      try {
        const res = await getStudents(teachingClassId);

        const list = Array.isArray(res) ? res : [];

        this.students = list.map((item) =>
          this.formatStudent(item, Number(teachingClassId))
        );
      } catch (error) {
        console.warn("获取学生名单失败，使用已加入课程的模拟学生：", error);

        this.students = this.getLocalStudentsForClass(teachingClassId);
      }
    },

    async fetchPerformance(teachingClassId) {
      try {
        const res = await getPerformance(teachingClassId);

        const performances = res.performances || [];
        const ranking = res.ranking || [];

        this.performances = performances.map((item) =>
          this.formatStudent(item, Number(teachingClassId))
        );

        this.ranking = ranking.map((item) =>
          this.formatStudent(item, Number(teachingClassId))
        );

        if (this.performances.length > 0) {
          this.students = this.performances;
        }
      } catch (error) {
        console.warn("获取课堂表现失败，使用本地课堂数据：", error);

        if (this.students.length === 0) {
          this.students = this.getLocalStudentsForClass(teachingClassId);
        }

        this.performances = this.students;

        this.ranking = [...this.students]
          .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
          .slice(0, 5);
      }
    },

    async fetchRanking(teachingClassId) {
      try {
        const res = await getRanking(teachingClassId);

        const list = Array.isArray(res) ? res : [];

        this.ranking = list.map((item) =>
          this.formatStudent(item, Number(teachingClassId))
        );
      } catch (error) {
        console.warn("获取排行榜失败，使用本地排序：", error);

        if (this.students.length === 0) {
          this.students = this.getLocalStudentsForClass(teachingClassId);
        }

        this.ranking = [...this.students]
          .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
          .slice(0, 5);
      }
    },

    async drawStudent(teachingClassId) {
      try {
        const res = await drawStudent(teachingClassId);

        const studentData = res.student || res;

        const student = this.formatStudent(
          studentData,
          Number(teachingClassId)
        );

        return {
          drawRecordId: res.drawRecordId || res.recordId,
          student,
          isMock: false,
        };
      } catch (error) {
        console.warn("后端点名失败，使用本地已加入学生随机点名：", error);

        const currentStudents = this.getLocalStudentsForClass(teachingClassId);

        if (currentStudents.length === 0) {
          throw new Error("当前课程暂无已加入学生");
        }

        this.students = currentStudents;

        const randomIndex = Math.floor(Math.random() * currentStudents.length);
        const student = currentStudents[randomIndex];

        return {
          drawRecordId: `mock-${Date.now()}`,
          student,
          isMock: true,
        };
      }
    },

    async submitDrawScore(drawRecordId, score) {
      if (String(drawRecordId).startsWith("mock-")) {
        return {
          code: 200,
          message: "mock success",
        };
      }

      return await submitDrawScore(drawRecordId, score);
    },

    updateLocalScore(studentId, score) {
      const updateTarget = (list) => {
        const target = list.find(
          (item) => String(item.id) === String(studentId)
        );

        if (!target) return;

        target.count = Number(target.count || 0) + 1;
        target.totalCalled = Number(target.totalCalled || 0) + 1;

        target.score = Number(target.score || 0) + Number(score);
        target.totalScore = Number(target.totalScore || 0) + Number(score);

        target.average =
          target.count > 0 ? (target.score / target.count).toFixed(1) : 0;

        target.avgScore = target.average;
      };

      updateTarget(this.students);
      updateTarget(this.performances);

      this.ranking = [...this.students]
        .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
        .slice(0, 5);

      this.performances = this.students;
    },
  },
});
