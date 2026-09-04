import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],

  server: {
    proxy: {
      "/api": {
        target: "http://115.159.51.227:8080",
        changeOrigin: true,
      },
    },
  },
});
