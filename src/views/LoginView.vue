<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">智课云伴</div>

      <h1>{{ roleMode === "teacher" ? "教师端登录" : "管理员登录" }}</h1>

      <p class="subtitle">
        {{
          roleMode === "teacher"
            ? "登录后进入课程空间，开展课堂互动管理"
            : "登录后进入管理后台，维护平台基础数据"
        }}
      </p>

      <div class="role-tabs">
        <button
          class="role-tab"
          :class="{ active: roleMode === 'teacher' }"
          @click="switchRole('teacher')"
        >
          教师登录
        </button>

        <button
          class="role-tab"
          :class="{ active: roleMode === 'admin' }"
          @click="switchRole('admin')"
        >
          管理员登录
        </button>
      </div>

      <div class="form">
        <label>
          <span>{{ roleMode === "teacher" ? "教师账号" : "管理员账号" }}</span>
          <input
            v-model="username"
            type="text"
            :placeholder="
              roleMode === 'teacher' ? '请输入教师账号' : '请输入管理员账号'
            "
            @keyup.enter="handleLogin"
          />
        </label>

        <label>
          <span>密码</span>

          <div class="password-field">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              @keyup.enter="handleLogin"
            />

            <button
              class="password-toggle"
              type="button"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              @click="showPassword = !showPassword"
            >
              <AppIcon :name="showPassword ? 'eye-open' : 'eye-off'" />
            </button>
          </div>
        </label>

        <p v-if="errorMessage" class="error-text">
          {{ errorMessage }}
        </p>

        <button class="login-btn" :disabled="loading" @click="handleLogin">
          {{
            loading
              ? "登录中..."
              : roleMode === "teacher"
              ? "登录教师端"
              : "登录管理员端"
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useTeacherStore } from "../store/teacherStore";
import { useAdminStore } from "../store/adminStore";
import AppIcon from "../components/AppIcon.vue";

export default {
  components: {
    AppIcon,
  },

  data() {
    return {
      roleMode: "teacher",
      username: "",
      password: "",
      showPassword: false,
      loading: false,
      errorMessage: "",
    };
  },

  watch: {
    "$route.query.role": {
      immediate: true,
      handler(value) {
        if (value === "admin") {
          this.roleMode = "admin";
        } else {
          this.roleMode = "teacher";
        }
      },
    },
  },

  methods: {
    switchRole(role) {
      this.roleMode = role;
      this.username = "";
      this.password = "";
      this.showPassword = false;
      this.errorMessage = "";

      if (role === "admin") {
        this.$router.replace({
          path: "/login",
          query: {
            role: "admin",
          },
        });
      } else {
        this.$router.replace("/login");
      }
    },

    async handleLogin() {
      if (!this.username.trim()) {
        this.errorMessage =
          this.roleMode === "teacher" ? "请输入教师账号" : "请输入管理员账号";
        return;
      }

      if (!this.password.trim()) {
        this.errorMessage = "请输入密码";
        return;
      }

      this.loading = true;
      this.errorMessage = "";

      try {
        if (this.roleMode === "admin") {
          const adminStore = useAdminStore();

          const success = await adminStore.login(
            this.username.trim(),
            this.password.trim()
          );

          if (!success) {
            this.errorMessage =
              adminStore.errorMessage || "管理员账号或密码错误";
            return;
          }

          this.$router.push("/admin");
          return;
        }

        const teacherStore = useTeacherStore();

        const success = await teacherStore.login(
          this.username.trim(),
          this.password.trim()
        );

        if (!success) {
          this.errorMessage = "教师账号或密码错误";
          return;
        }

        this.$router.push("/courses");
      } catch (error) {
        console.error("登录失败：", error);
        this.errorMessage = error.message || "登录失败，请稍后重试";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f5f6f8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 520px;
  background: #ffffff;
  border-radius: 28px;
  padding: 42px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
  box-sizing: border-box;
}

.brand {
  width: fit-content;
  margin: 0 auto 18px;
  padding: 8px 16px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 14px;
}

h1 {
  text-align: center;
  color: #111827;
  font-size: 34px;
  line-height: 1.25;
  margin: 0;
}

.subtitle {
  text-align: center;
  color: #6b7280;
  font-size: 16px;
  margin: 18px 0 30px;
}

.role-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background: #f3f4f6;
  border-radius: 18px;
  padding: 8px;
  margin-bottom: 28px;
}

.role-tab {
  height: 50px;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: #6b7280;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.role-tab.active {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

label span {
  display: block;
  color: #374151;
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 10px;
}

input {
  width: 100%;
  height: 54px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 0 16px;
  box-sizing: border-box;
  color: #111827;
  font-size: 15px;
  outline: none;
}

input:focus {
  border-color: #111827;
}

.password-field {
  position: relative;
}

.password-field input {
  padding-right: 52px;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 14px;

  width: 32px;
  height: 32px;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0;

  border: none;
  background: transparent;

  color: #6b7280;
  font-size: 20px;

  cursor: pointer;

  transform: translateY(-50%);
}

.password-toggle:hover {
  color: #111827;
}

.password-toggle:focus-visible {
  outline: 2px solid #d1d5db;
  outline-offset: 2px;
  border-radius: 8px;
}

.error-text {
  color: #dc2626;
  font-size: 14px;
  margin: -4px 0 0;
}

.login-btn {
  height: 56px;
  border: none;
  border-radius: 14px;
  background: #111827;
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  margin-top: 6px;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
