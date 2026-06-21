import { createRouter, createWebHistory } from "vue-router";

import LoginView from "../views/LoginView.vue";
import CourseHomeView from "../views/CourseHomeView.vue";
import RollView from "../views/RollView.vue";
import PerformanceView from "../views/PerformanceView.vue";
import StudentsView from "../views/StudentsView.vue";

const routes = [
  {
    path: "/",
    redirect: "/courses",
  },
  {
    path: "/login",
    component: LoginView,
  },
  {
    path: "/courses",
    component: CourseHomeView,
  },
  {
    path: "/course/:teachingClassId",
    redirect: (to) => {
      return `/course/${to.params.teachingClassId}/roll`;
    },
  },
  {
    path: "/course/:teachingClassId/roll",
    component: RollView,
  },
  {
    path: "/course/:teachingClassId/performance",
    component: PerformanceView,
  },
  {
    path: "/course/:teachingClassId/students",
    component: StudentsView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  const expireTime = localStorage.getItem("loginExpireTime");

  const isExpired = expireTime && Date.now() > Number(expireTime);

  if (isExpired) {
    localStorage.removeItem("isLogin");
    localStorage.removeItem("token");
    localStorage.removeItem("teacherId");
    localStorage.removeItem("teacherName");
    localStorage.removeItem("loginExpireTime");

    next("/login");
    return;
  }

  if (to.path !== "/login" && !token) {
    next("/login");
    return;
  }

  if (to.path === "/login" && token) {
    next("/courses");
    return;
  }

  next();
});

export default router;
