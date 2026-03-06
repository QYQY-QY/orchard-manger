import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

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
  server: {
    proxy: {
      '/api': {
        target: 'https://192.168.123.93:3388',
        changeOrigin: true,
        secure: false, // 强制忽略 HTTPS 证书错误（核心）
        rewrite: (path) => path,
        timeout: 10000,
        // 关键：关闭 axios 跟随重定向，避免被重定向到 index.html
        followRedirects: false,
        configure: (proxy, options) => {
          // 代理层拦截重定向，直接返回后端原始响应
          proxy.on('proxyRes', (proxyRes, req, res) => {
            if (proxyRes.statusCode === 302) {
              proxyRes.statusCode = 200; // 把 302 改成 200，避免前端报错
              res.setHeader('Location', ''); // 清空重定向头
            }
          });
          proxy.on('error', (err) => console.log('代理错误：', err));
          proxy.on('proxyReq', (proxyReq) => {
            // 强制告诉后端这是 API 请求，不要返回页面
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Content-Type', 'application/json');
          });
        }
      }
    }
  }
})