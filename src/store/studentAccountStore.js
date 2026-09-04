import { defineStore } from "pinia";

const STUDENT_ACCOUNT_KEY = "platformStudentAccounts";
const COURSE_JOIN_RECORD_KEY = "courseJoinRecords";

function loadLocalData(key, defaultValue) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`读取 ${key} 失败：`, error);
    return defaultValue;
  }
}

function saveLocalData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function createMockStudents() {
  const classList = [
    {
      grade: "2024级",
      className: "24计算机科学与技术1班",
      prefix: "202401",
    },
    {
      grade: "2024级",
      className: "24软件工程1班",
      prefix: "202402",
    },
    {
      grade: "2024级",
      className: "24人工智能1班",
      prefix: "202403",
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

  const result = [];

  classList.forEach((cls) => {
    names.forEach((name, index) => {
      const number = String(index + 1).padStart(3, "0");

      result.push({
        id: `${cls.prefix}${number}`,
        studentNo: `${cls.prefix}${number}`,
        name,
        grade: cls.grade,
        className: cls.className,
        password: "123456",
        status: "正常",
      });
    });
  });

  return result;
}

export const useStudentAccountStore = defineStore("studentAccount", {
  state: () => {
    const localStudents = loadLocalData(STUDENT_ACCOUNT_KEY, null);

    return {
      students: localStudents || createMockStudents(),
      joinRecords: loadLocalData(COURSE_JOIN_RECORD_KEY, {}),
    };
  },

  getters: {
    totalStudentCount(state) {
      return state.students.length;
    },

    totalClassCount(state) {
      return new Set(state.students.map((item) => item.className)).size;
    },
  },

  actions: {
    saveStudents() {
      saveLocalData(STUDENT_ACCOUNT_KEY, this.students);
    },

    saveJoinRecords() {
      saveLocalData(COURSE_JOIN_RECORD_KEY, this.joinRecords);
    },

    formatStudent(item) {
      const studentNo = String(
        item.studentNo || item.student_no || item.number || item.account || ""
      ).trim();

      const name = String(item.name || item.studentName || "").trim();

      const grade = String(item.grade || item.year || "2024级").trim();

      const className = String(
        item.className || item.class_name || item.class || ""
      ).trim();

      const password = String(item.password || "123456").trim();

      return {
        id: studentNo,
        studentNo,
        name,
        grade,
        className,
        password,
        status: item.status || "正常",
      };
    },

    importStudents(rows, options = {}) {
      const replace = options.replace || false;

      const normalizedRows = rows
        .map((item) => this.formatStudent(item))
        .filter((item) => item.studentNo && item.name && item.className);

      if (replace) {
        this.students = normalizedRows;
        this.cleanInvalidJoinRecords();
        this.saveStudents();
        this.saveJoinRecords();

        return {
          added: normalizedRows.length,
          updated: 0,
          total: normalizedRows.length,
        };
      }

      const map = new Map();

      this.students.forEach((item) => {
        map.set(String(item.studentNo), item);
      });

      let added = 0;
      let updated = 0;

      normalizedRows.forEach((item) => {
        if (map.has(String(item.studentNo))) {
          map.set(String(item.studentNo), {
            ...map.get(String(item.studentNo)),
            ...item,
          });

          updated++;
        } else {
          map.set(String(item.studentNo), item);
          added++;
        }
      });

      this.students = Array.from(map.values());

      this.cleanInvalidJoinRecords();
      this.saveStudents();
      this.saveJoinRecords();

      return {
        added,
        updated,
        total: normalizedRows.length,
      };
    },

    addOneStudent(student) {
      return this.importStudents([student], {
        replace: false,
      });
    },

    deleteStudent(studentNo) {
      const targetNo = String(studentNo);

      this.students = this.students.filter(
        (item) => String(item.studentNo) !== targetNo
      );

      Object.keys(this.joinRecords).forEach((key) => {
        if (String(this.joinRecords[key].studentNo) === targetNo) {
          delete this.joinRecords[key];
        }
      });

      this.saveStudents();
      this.saveJoinRecords();
    },

    clearAllStudents() {
      this.students = [];
      this.joinRecords = {};

      this.saveStudents();
      this.saveJoinRecords();
    },

    cleanInvalidJoinRecords() {
      const validStudentNos = new Set(
        this.students.map((item) => String(item.studentNo))
      );

      Object.keys(this.joinRecords).forEach((key) => {
        if (!validStudentNos.has(String(this.joinRecords[key].studentNo))) {
          delete this.joinRecords[key];
        }
      });
    },

    getExpectedStudentsByClassName(className) {
      return this.students.filter((item) => item.className === className);
    },

    getExpectedStudentsByCourse(course) {
      if (!course) return [];

      return this.getExpectedStudentsByClassName(course.className);
    },

    getJoinRecordKey(teachingClassId, studentNo) {
      return `${teachingClassId}_${studentNo}`;
    },

    ensureJoinRecordsForCourse(course) {
      if (!course) return;

      const expectedStudents = this.getExpectedStudentsByCourse(course);

      expectedStudents.forEach((student, index) => {
        const key = this.getJoinRecordKey(course.id, student.studentNo);

        if (!this.joinRecords[key]) {
          const joined = index % 4 !== 0;

          this.joinRecords[key] = {
            teachingClassId: course.id,
            studentNo: student.studentNo,
            status: joined ? "joined" : "not_joined",
            joinTime: joined ? new Date().toISOString() : "",
          };
        }
      });

      this.saveJoinRecords();
    },

    getJoinStatus(course, studentNo) {
      if (!course) return "not_joined";

      this.ensureJoinRecordsForCourse(course);

      const key = this.getJoinRecordKey(course.id, studentNo);
      const record = this.joinRecords[key];

      return record?.status || "not_joined";
    },

    setJoinStatus(course, studentNo, status) {
      if (!course) return;

      const key = this.getJoinRecordKey(course.id, studentNo);

      this.joinRecords[key] = {
        teachingClassId: course.id,
        studentNo,
        status,
        joinTime: status === "joined" ? new Date().toISOString() : "",
      };

      this.saveJoinRecords();
    },

    getStudentsWithJoinStatus(course) {
      if (!course) return [];

      this.ensureJoinRecordsForCourse(course);

      return this.getExpectedStudentsByCourse(course).map((student) => {
        const key = this.getJoinRecordKey(course.id, student.studentNo);
        const record = this.joinRecords[key];

        return {
          ...student,
          joinStatus: record?.status || "not_joined",
          joinTime: record?.joinTime || "",
        };
      });
    },

    getJoinedStudentsByCourse(course) {
      return this.getStudentsWithJoinStatus(course).filter(
        (item) => item.joinStatus === "joined"
      );
    },

    getNotJoinedStudentsByCourse(course) {
      return this.getStudentsWithJoinStatus(course).filter(
        (item) => item.joinStatus !== "joined"
      );
    },

    getCourseJoinStats(course) {
      if (!course) {
        return {
          expected: 0,
          joined: 0,
          notJoined: 0,
        };
      }

      const all = this.getStudentsWithJoinStatus(course);
      const joined = all.filter((item) => item.joinStatus === "joined");

      return {
        expected: all.length,
        joined: joined.length,
        notJoined: all.length - joined.length,
      };
    },
  },
});
