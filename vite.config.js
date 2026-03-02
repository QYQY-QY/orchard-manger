import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // 仅保留/完善跨域代理配置，不修改其他原有逻辑
  server: {
    proxy: {
      // 匹配所有以 /api 开头的请求，转发到后端
      '/api': {
        target: 'https://120.27.205.171:3388', // 你的后端接口地址（协议+IP+端口）
        changeOrigin: true, // 核心：开启跨域代理（伪装请求来源）
        secure: false, // 关键：忽略HTTPS自签名证书错误
        rewrite: (path) => path.replace(/^\/api/, ''), // 移除/api前缀，适配后端真实接口路径
        // 可选：增加超时时间，避免请求超时
        timeout: 5000
      }
    }
  }
})