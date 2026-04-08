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
  // 新增：前后端联调的代理配置（解决跨域+HTTPS证书问题）
  server: {
    proxy: {
      // 用 /api 前缀代理后端接口
      '/api': {
        // target: 'http://192.168.123.93:3388', // 后端接口地址
        target: 'http://192.168.100.2:3388', // 局域网+主机
        // target: 'http://47.99.217.195:3388',//阿里云
        changeOrigin: true, // 开启跨域伪装（核心解决跨域）
        secure: false, // 忽略HTTPS证书错误（解决证书拦截）
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})