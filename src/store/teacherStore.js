import { defineStore } from "pinia";
import { login as loginApi } from "../api/login";

export const useTeacherStore = defineStore("teacher", {
  state: () => ({
    isLogin: !!localStorage.getItem("token"),

    teacher: localStorage.getItem("teacherId")
      ? {
          id: Number(localStorage.getItem("teacherId")),
          name: localStorage.getItem("teacherName") || "张老师",
        }
      : null,

    token: localStorage.getItem("token") || "",
  }),

  actions: {
    async login(username, password) {
      try {
        const res = await loginApi({
          username,
          password,
        });

        this.isLogin = true;

        this.teacher = {
          id: res.teacherId,
          name: res.userName,
        };

        this.token = res.token;

        const expireTime = Date.now() + 2 * 60 * 60 * 1000;

        localStorage.setItem("isLogin", "true");
        localStorage.setItem("token", res.token);
        localStorage.setItem("teacherId", res.teacherId);
        localStorage.setItem("teacherName", res.userName);
        localStorage.setItem("loginExpireTime", expireTime);

        return true;
      } catch (error) {
        console.error("登录失败：", error);
        return false;
      }
    },

    logout() {
      this.isLogin = false;
      this.teacher = null;
      this.token = "";

      localStorage.removeItem("isLogin");
      localStorage.removeItem("token");
      localStorage.removeItem("teacherId");
      localStorage.removeItem("teacherName");
      localStorage.removeItem("loginExpireTime");
    },
  },
});
