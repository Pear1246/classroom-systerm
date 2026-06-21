import axios from "axios";

const request = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

// 请求拦截器：自动携带 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method === "post") {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理后端 Result 包装
request.interceptors.response.use(
  (response) => {
    const res = response.data;

    // 兼容后端返回：{ code: 200, message: "success", data: ... }
    if (res && typeof res === "object" && "code" in res) {
      if (res.code === 200) {
        return res.data ?? res;
      }

      return Promise.reject(new Error(res.message || "接口请求失败"));
    }

    // 兼容后端直接返回数据
    return res;
  },
  (error) => {
    console.error("接口请求失败：", error);
    return Promise.reject(error);
  }
);

export default request;
