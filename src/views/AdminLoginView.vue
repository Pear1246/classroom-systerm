<template>
  <div class="admin-login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="small-title">管理员端</div>
        <h1>智课云伴</h1>
        <p>请登录系统管理端</p>
      </div>

      <div class="form-item">
        <label>管理员账号</label>
        <input v-model="username" type="text" placeholder="请输入管理员账号" />
      </div>

      <div class="form-item">
        <label>密码</label>
        <input
          v-model="password"
          type="password"
          placeholder="请输入密码"
          @keyup.enter="handleLogin"
        />
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>

      <button class="login-btn" @click="handleLogin">登录管理员端</button>

      <button class="teacher-btn" @click="goTeacherLogin">返回教师登录</button>

      <div class="tip">测试账号：admin ｜ 密码：123456</div>
    </div>
  </div>
</template>

<script>
import { useAdminStore } from "../store/adminStore";

export default {
  data() {
    return {
      username: "",
      password: "",
      error: "",
    };
  },

  methods: {
    handleLogin() {
      const adminStore = useAdminStore();

      const success = adminStore.login(this.username, this.password);

      if (success) {
        this.$router.push("/admin");
      } else {
        this.error = "管理员账号或密码错误";
      }
    },

    goTeacherLogin() {
      this.$router.push("/login");
    },
  },
};
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  background: #f5f6f8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.login-card {
  width: 420px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 26px;
  padding: 34px;
  box-sizing: border-box;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.06);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.small-title {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 12px;
}

.login-header h1 {
  margin: 0;
  font-size: 34px;
  color: #111827;
}

.login-header p {
  margin: 10px 0 0;
  color: #6b7280;
  font-size: 15px;
}

.form-item {
  margin-bottom: 18px;
}

.form-item label {
  display: block;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.form-item input {
  width: 100%;
  height: 46px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  outline: none;
  padding: 0 14px;
  box-sizing: border-box;
  font-size: 15px;
}

.form-item input:focus {
  border-color: #111827;
}

.error-text {
  margin: 0 0 14px;
  color: #dc2626;
  font-size: 14px;
}

.login-btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 14px;
  background: #111827;
  color: #ffffff;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
}

.teacher-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 14px;
  background: #f3f4f6;
  color: #111827;
  cursor: pointer;
  font-size: 14px;
  margin-top: 12px;
}

.tip {
  margin-top: 18px;
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
}
</style>
