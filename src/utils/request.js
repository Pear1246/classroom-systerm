import axios from "axios";

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000,
});

// 请求拦截器：自动携带 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = (config.method || "").toLowerCase();
    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;

    if (["post", "put", "patch"].includes(method) && !isFormData) {
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

    if (res && typeof res === "object" && "code" in res) {
      if (res.code === 200) {
        return res.data ?? res;
      }

      const errorMessage =
        typeof res.data === "string" ? res.data : res.message || "接口请求失败";

      return Promise.reject(new Error(errorMessage));
    }

    return res;
  },
  (error) => {
    console.error("接口请求失败：", error);
    return Promise.reject(error);
  }
);

export default request;
