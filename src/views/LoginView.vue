<template>
  <div class="login-page">
    <div class="login-card">
      <h1>课堂互动系统</h1>

      <p>教师登录</p>

      <input v-model="username" placeholder="请输入账号" />

      <input v-model="password" type="password" placeholder="请输入密码" />

      <button @click="handleLogin">登录</button>

      <div class="error" v-if="error">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import { useTeacherStore } from "../store/teacherStore";

export default {
  data() {
    return {
      username: "",

      password: "",

      error: "",
    };
  },

  methods: {
    async handleLogin() {
      const store = useTeacherStore();

      const success = await store.login(this.username, this.password);

      if (success) {
        this.$router.push("/courses");
      } else {
        this.error = "账号或密码错误";
      }
    },
  },
};
</script>

<style scoped>
.login-page {
  height: 100vh;

  display: flex;

  justify-content: center;

  align-items: center;

  background: #f5f5f5;
}

.login-card {
  width: 360px;

  background: white;

  padding: 40px;

  border-radius: 20px;

  border: 1px solid #eee;

  display: flex;

  flex-direction: column;

  gap: 16px;
}

.login-card h1 {
  margin: 0;

  text-align: center;
}

.login-card p {
  text-align: center;

  color: #666;
}

input {
  padding: 12px;

  border: 1px solid #ddd;

  border-radius: 10px;
}

button {
  padding: 12px;

  background: #111;

  color: white;

  border: none;

  border-radius: 10px;

  cursor: pointer;
}

.error {
  color: red;

  text-align: center;
}
</style>
