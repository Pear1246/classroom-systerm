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
    // mock 数据：后端未启动或接口失败时备用
    initStudents() {
      if (this.students.length > 0) return;

      const classList = [
        {
          id: 101,
          className: "24计算机科学与技术1班",
        },
        {
          id: 102,
          className: "24软件工程1班",
        },
        {
          id: 103,
          className: "24人工智能1班",
        },
      ];

      const names = [
        "张明",
        "李华",
        "王悦",
        "赵磊",
        "刘洋",
        "陈晨",
        "杨帆",
        "黄琳",
        "周宇",
        "吴昊",
        "徐静",
        "孙宁",
        "马超",
        "朱婷",
        "胡杰",
        "郭佳",
        "何雨",
        "林森",
        "罗欣",
        "梁爽",
      ];

      classList.forEach((cls) => {
        for (let i = 1; i <= 20; i++) {
          this.students.push({
            id: `${cls.id}${String(i).padStart(3, "0")}`,
            studentNo: `${cls.id}${String(i).padStart(3, "0")}`,
            name: names[i - 1],
            classId: cls.id,
            className: cls.className,
            count: 0,
            totalCalled: 0,
            score: 0,
            totalScore: 0,
            average: 0,
            avgScore: 0,
          });
        }
      });
    },

    formatStudent(item, classId = null) {
      const totalCalled = item.totalCalled ?? item.count ?? 0;
      const totalScore = item.totalScore ?? item.score ?? 0;

      const avgScore =
        item.avgScore ??
        item.average ??
        (totalCalled > 0 ? (totalScore / totalCalled).toFixed(1) : 0);

      return {
        id: item.id,
        studentNo: item.studentNo || item.student_no || item.number || "",
        name: item.name || item.studentName || "未命名学生",

        classId: item.classId || item.class_id || classId,
        className: item.className || item.class_name || "",

        // 兼容我们前端原来组件使用的字段
        count: totalCalled,
        score: totalScore,
        average: avgScore,

        // 保留后端语义字段
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
          this.formatStudent(item, Number(teachingClassId))
        );
      } catch (error) {
        console.error("获取学生名单失败，继续使用前端 mock 数据：", error);

        if (this.students.length === 0) {
          this.initStudents();
        }
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

        // 如果后端 performance 返回了全部学生表现，就同步给 students
        if (this.performances.length > 0) {
          this.students = this.performances;
        }
      } catch (error) {
        console.error("获取课堂表现失败：", error);
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
        console.error("获取排行榜失败：", error);

        // 接口失败时，使用当前学生数据本地排序
        this.ranking = [...this.students]
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
      }
    },

    async drawStudent(teachingClassId) {
      const res = await drawStudent(teachingClassId);

      const studentData = res.student || res;

      const student = this.formatStudent(studentData, Number(teachingClassId));

      return {
        drawRecordId: res.drawRecordId || res.recordId,
        student,
      };
    },

    async submitDrawScore(drawRecordId, score) {
      return await submitDrawScore(drawRecordId, score);
    },
  },
});
