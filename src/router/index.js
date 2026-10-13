import { createRouter, createWebHistory } from "vue-router";

import LoginView from "../views/LoginView.vue";
import CourseHomeView from "../views/CourseHomeView.vue";

import SignView from "../views/SignView.vue";
import RollView from "../views/RollView.vue";
import PerformanceView from "../views/PerformanceView.vue";
import CourseMaterialsView from "../views/CourseMaterialsView.vue";
import MaterialDetailView from "../views/MaterialDetailView.vue";
import NoteEditorView from "../views/NoteEditorView.vue";
import NoteViewerView from "../views/NoteViewerView.vue";
import StudentsView from "../views/StudentsView.vue";
import SignRecordsView from "../views/SignRecordsView.vue";
import SignRecordDetailView from "../views/SignRecordDetailView.vue";
import CourseSummaryView from "../views/CourseSummaryView.vue";
import QuestionBankView from "../views/QuestionBankView.vue";
import QuestionEditorView from "../views/QuestionEditorView.vue";
import ExerciseEditorView from "../views/ExerciseEditorView.vue";
import ExerciseResultsView from "../views/ExerciseResultsView.vue";
import SubmissionAnswerView from "../views/SubmissionAnswerView.vue";

import AdminHomeView from "../views/AdminHomeView.vue";
import AdminStudentAccountView from "../views/AdminStudentAccountView.vue";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },

  {
    path: "/login",
    component: LoginView,
  },

  {
    path: "/admin/login",
    redirect: "/login?role=admin",
  },

  // 教师课程首页

  {
    path: "/courses",
    component: CourseHomeView,
    meta: {
      requiresTeacher: true,
    },
  },

  // 课堂签到
  {
    path: "/course/:teachingClassId/sign",
    component: SignView,
    meta: {
      requiresTeacher: true,
    },
  },

  // 随机点名
  {
    path: "/course/:teachingClassId/roll",
    component: RollView,
    meta: {
      requiresTeacher: true,
    },
  },

  // 课堂表现
  {
    path: "/course/:teachingClassId/performance",
    component: PerformanceView,
    meta: {
      requiresTeacher: true,
    },
  },

  // 课程知识库
  {
    path: "/course/:teachingClassId/materials",
    component: CourseMaterialsView,
    meta: {
      requiresTeacher: true,
    },
  },

  // 课程知识库 - 文件详情（专注模式）
  {
    path: "/course/:teachingClassId/materials/file/:materialId",
    component: MaterialDetailView,
    meta: {
      requiresTeacher: true,
      focusMode: true,
    },
  },

  // 课程知识库 - 新建在线笔记
  {
    path: "/course/:teachingClassId/materials/note/new",
    component: NoteEditorView,
    meta: {
      requiresTeacher: true,
      noteMode: "new",
      focusMode: true,
    },
  },

  // 课程知识库 - 在线笔记阅读模式
  {
    path: "/course/:teachingClassId/materials/note/:noteId",
    component: NoteViewerView,
    meta: {
      requiresTeacher: true,
      noteMode: "view",
      focusMode: true,
    },
  },

  // 课程知识库 - 在线笔记编辑模式
  {
    path: "/course/:teachingClassId/materials/note/:noteId/edit",
    component: NoteEditorView,
    meta: {
      requiresTeacher: true,
      noteMode: "edit",
      focusMode: true,
    },
  },

  // 课程题库
  {
    path: "/course/:teachingClassId/questions",
    component: QuestionBankView,
    meta: {
      requiresTeacher: true,
    },
  },

  // 课程题库 - 新建练习（专注模式）
  {
    path: "/course/:teachingClassId/questions/exercises/new",
    component: ExerciseEditorView,
    meta: {
      requiresTeacher: true,
      exerciseMode: "new",
      focusMode: true,
    },
  },

  // 课程题库 - 编辑练习（专注模式）
  {
    path: "/course/:teachingClassId/questions/exercises/:exerciseId/edit",
    component: ExerciseEditorView,
    meta: {
      requiresTeacher: true,
      exerciseMode: "edit",
      focusMode: true,
    },
  },

  // 课程题库 - 练习结果（专注模式）
  {
    path: "/course/:teachingClassId/questions/exercises/:exerciseId/results",
    component: ExerciseResultsView,
    meta: {
      requiresTeacher: true,
      focusMode: true,
    },
  },

  // 课程题库 - 学生作答详情（专注模式）
  {
    path: "/course/:teachingClassId/questions/exercises/:exerciseId/results/:studentId",
    component: SubmissionAnswerView,
    meta: {
      requiresTeacher: true,
      focusMode: true,
    },
  },

  // 课程题库 - 新建题目
  {
    path: "/course/:teachingClassId/questions/new",
    component: QuestionEditorView,
    meta: {
      requiresTeacher: true,
      questionMode: "new",
      focusMode: true,
    },
  },

  // 课程题库 - 编辑题目
  {
    path: "/course/:teachingClassId/questions/:questionId/edit",
    component: QuestionEditorView,
    meta: {
      requiresTeacher: true,
      questionMode: "edit",
      focusMode: true,
    },
  },

  // 学生名单
  {
    path: "/course/:teachingClassId/students",
    component: StudentsView,
    meta: {
      requiresTeacher: true,
    },
  },

  // 签到记录
  {
    path: "/course/:teachingClassId/sign-records",
    component: SignRecordsView,
    meta: {
      requiresTeacher: true,
    },
  },

  // 单次签到详情
  {
    path: "/course/:teachingClassId/sign-records/:activityId",
    component: SignRecordDetailView,
    meta: {
      requiresTeacher: true,
      focusMode: true,
    },
  },

  // 课程总结（仅已结课课程开放）
  {
    path: "/course/:teachingClassId/summary",
    component: CourseSummaryView,
    meta: {
      requiresTeacher: true,
    },
  },

  // 管理员

  {
    path: "/admin",
    component: AdminHomeView,
    meta: {
      requiresAdmin: true,
    },
  },

  {
    path: "/admin/courses",
    redirect: "/admin",
  },

  {
    path: "/admin/students",
    component: AdminStudentAccountView,
    meta: {
      requiresAdmin: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = localStorage.getItem("token");

  const role = localStorage.getItem("role");

  const teacherId = localStorage.getItem("teacherId");

  const adminToken = localStorage.getItem("adminToken");

  const loginExpireTime = Number(localStorage.getItem("loginExpireTime") || 0);

  const requiresTeacher = to.matched.some((record) => {
    return record.meta.requiresTeacher;
  });

  const requiresAdmin = to.matched.some((record) => {
    return record.meta.requiresAdmin;
  });

  const isExpired = loginExpireTime > 0 && Date.now() >= loginExpireTime;

  if (isExpired) {
    localStorage.removeItem("isLogin");

    localStorage.removeItem("token");

    localStorage.removeItem("teacherId");

    localStorage.removeItem("teacherUsername");

    localStorage.removeItem("teacherName");

    localStorage.removeItem("role");

    localStorage.removeItem("loginExpireTime");
  }

  const currentToken = isExpired ? null : token;

  const currentRole = isExpired ? null : role;

  const currentTeacherId = isExpired ? null : teacherId;

  const hasAdminLogin = Boolean(
    (currentToken && currentRole === "ADMIN") || adminToken
  );

  const hasTeacherLogin = Boolean(
    currentToken &&
      (currentRole === "TEACHER" || (!currentRole && currentTeacherId))
  );

  if (requiresAdmin && !hasAdminLogin) {
    return {
      path: "/login",
      query: {
        role: "admin",
      },
    };
  }

  if (requiresTeacher && !hasTeacherLogin) {
    return "/login";
  }

  if (
    to.path.startsWith("/course/") &&
    !String(to.params.teachingClassId || "").trim()
  ) {
    return "/courses";
  }

  if (to.path === "/login") {
    if (to.query.role === "admin") {
      return true;
    }

    if (hasTeacherLogin) {
      return "/courses";
    }

    if (hasAdminLogin) {
      return "/admin";
    }
  }

  return true;
});

export default router;
