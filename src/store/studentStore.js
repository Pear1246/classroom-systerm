import { defineStore } from "pinia";
import { getStudents, getPerformance, getRanking } from "../api/student";
import { drawStudent, submitDrawScore } from "../api/draw";

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

    async fetchStudents(teachingClassId) {
      try {
        const res = await getStudents(teachingClassId);

        const list = Array.isArray(res) ? res : [];

        this.students = list.map((item) =>
          this.formatStudent(item, teachingClassId)
        );

        return this.students;
      } catch (error) {
        console.error("获取学生名单失败：", error);

        this.students = [];
        return [];
      }
    },

    async fetchPerformance(teachingClassId) {
      try {
        const res = await getPerformance(teachingClassId);

        const performances = res?.performances || [];

        const ranking = res?.ranking || [];

        this.performances = performances.map((item) =>
          this.formatStudent(item, teachingClassId)
        );

        this.ranking = ranking.map((item) =>
          this.formatStudent(item, teachingClassId)
        );

        if (this.performances.length > 0) {
          this.students = this.performances;
        }

        return {
          performances: this.performances,
          ranking: this.ranking,
        };
      } catch (error) {
        console.error("获取课堂表现失败：", error);

        this.performances = [];
        this.ranking = [];

        return {
          performances: [],
          ranking: [],
        };
      }
    },

    async fetchRanking(teachingClassId) {
      try {
        const res = await getRanking(teachingClassId);

        const list = Array.isArray(res) ? res : [];

        this.ranking = list.map((item) =>
          this.formatStudent(item, teachingClassId)
        );

        return this.ranking;
      } catch (error) {
        console.error("获取排行榜失败：", error);

        this.ranking = [];
        return [];
      }
    },

    async drawStudent(teachingClassId) {
      const res = await drawStudent(teachingClassId);

      const studentData = res.student || res;

      const student = this.formatStudent(studentData, teachingClassId);

      return {
        drawRecordId: res.drawRecordId || res.recordId,
        student,
      };
    },

    async submitDrawScore(drawRecordId, score) {
      return submitDrawScore(drawRecordId, score);
    },

    updateLocalScore(studentId, score) {
      const updateTarget = (list) => {
        const target = list.find(
          (item) => String(item.id) === String(studentId)
        );

        if (!target) {
          return;
        }

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
