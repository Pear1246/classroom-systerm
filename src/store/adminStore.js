import { defineStore } from "pinia";
import { login as loginApi } from "../api/login";
import { getAdminTeachers } from "../api/admin";

export const useAdminStore = defineStore("admin", {
  state: () => ({
    isAdminLogin:
      !!localStorage.getItem("token") &&
      localStorage.getItem("role") === "ADMIN",

    admin:
      localStorage.getItem("role") === "ADMIN"
        ? {
            userId: Number(localStorage.getItem("userId")) || null,
            username: localStorage.getItem("username") || "",
            name: localStorage.getItem("userName") || "系统管理员",
            role: "ADMIN",
          }
        : null,

    token: localStorage.getItem("token") || "",

    teachers: [],

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

        if (!res || res.role !== "ADMIN") {
          this.errorMessage = "当前账号不是管理员账号";
          return false;
        }

        this.isAdminLogin = true;

        this.admin = {
          userId: res.userId,
          username,
          name: res.userName || "系统管理员",
          role: res.role,
        };

        this.token = res.token;

        localStorage.setItem("token", res.token);
        localStorage.setItem("adminToken", res.token);

        localStorage.setItem("userId", String(res.userId));
        localStorage.setItem("username", username);
        localStorage.setItem("userName", res.userName || "系统管理员");
        localStorage.setItem("adminName", res.userName || "系统管理员");
        localStorage.setItem("role", res.role);

        await this.fetchTeachers();

        return true;
      } catch (error) {
        console.error("管理员登录失败：", error);
        this.errorMessage = error.message || "管理员登录失败";
        return false;
      } finally {
        this.loading = false;
      }
    },

    async fetchTeachers() {
      try {
        const list = await getAdminTeachers();

        this.teachers = Array.isArray(list)
          ? list.map((item) => {
              return {
                id: item.id,
                userId: item.id,
                username: item.username,
                name: item.realName || item.username,
                realName: item.realName || item.username,
                role: item.role,
                createdAt: item.createdAt,
              };
            })
          : [];

        return this.teachers;
      } catch (error) {
        console.error("获取教师列表失败：", error);
        this.teachers = [];
        return [];
      }
    },

    logout() {
      this.isAdminLogin = false;
      this.admin = null;
      this.token = "";
      this.teachers = [];
      this.errorMessage = "";

      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");

      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("userName");
      localStorage.removeItem("adminName");
      localStorage.removeItem("role");
    },
  },
});
