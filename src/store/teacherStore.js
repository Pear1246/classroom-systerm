import { defineStore } from "pinia";
import { login as loginApi } from "../api/login";

export const useTeacherStore = defineStore("teacher", {
  state: () => ({
    isLogin:
      !!localStorage.getItem("token") &&
      localStorage.getItem("role") === "TEACHER",

    teacher:
      localStorage.getItem("teacherId") &&
      localStorage.getItem("role") === "TEACHER"
        ? {
            id: Number(localStorage.getItem("teacherId")),
            username: localStorage.getItem("teacherUsername") || "",
            name: localStorage.getItem("teacherName") || "教师",
          }
        : null,

    token:
      localStorage.getItem("role") === "TEACHER"
        ? localStorage.getItem("token") || ""
        : "",

    loading: false,
    errorMessage: "",
  }),

  actions: {
    async login(username, password) {
      this.loading = true;
      this.errorMessage = "";

      try {
        const res = await loginApi({
          username,
          password,
        });

        if (!res) {
          this.errorMessage = "登录失败";
          return false;
        }

        if (res.role && res.role !== "TEACHER") {
          this.errorMessage = "当前账号不是教师账号";
          return false;
        }

        if (!res.token) {
          this.errorMessage = "登录返回中缺少 token";
          return false;
        }

        if (!res.teacherId) {
          this.errorMessage = "登录返回中缺少 teacherId";
          return false;
        }

        this.isLogin = true;

        this.teacher = {
          id: Number(res.teacherId),
          username,
          name: res.userName || username,
        };

        this.token = res.token;

        const expireTime = Date.now() + 2 * 60 * 60 * 1000;

        localStorage.setItem("isLogin", "true");
        localStorage.setItem("token", res.token);
        localStorage.setItem("teacherId", String(res.teacherId));
        localStorage.setItem("teacherUsername", username);
        localStorage.setItem("teacherName", res.userName || username);
        localStorage.setItem("role", "TEACHER");
        localStorage.setItem("loginExpireTime", String(expireTime));

        return true;
      } catch (error) {
        console.error("教师登录失败：", error);

        this.errorMessage =
          error?.message || "教师登录失败，请检查账号、密码或网络连接";

        return false;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.isLogin = false;
      this.teacher = null;
      this.token = "";
      this.errorMessage = "";

      localStorage.removeItem("isLogin");
      localStorage.removeItem("token");
      localStorage.removeItem("teacherId");
      localStorage.removeItem("teacherUsername");
      localStorage.removeItem("teacherName");
      localStorage.removeItem("role");
      localStorage.removeItem("loginExpireTime");
    },
  },
});
