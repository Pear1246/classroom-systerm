import { createRouter, createWebHistory } from "vue-router";

import LoginView from "../views/LoginView.vue";
import CourseHomeView from "../views/CourseHomeView.vue";

import SignView from "../views/SignView.vue";
import RollView from "../views/RollView.vue";
import PerformanceView from "../views/PerformanceView.vue";
import StudentsView from "../views/StudentsView.vue";
import SignRecordsView from "../views/SignRecordsView.vue";
import SignRecordDetailView from "../views/SignRecordDetailView.vue";

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
    (!to.params.teachingClassId ||
      Number.isNaN(Number(to.params.teachingClassId)))
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
