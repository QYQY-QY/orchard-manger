<template>
  <header class="screen-header">
    <div class="header-title">果园可视化大屏</div>
    <div class="header-right">
      <span class="update-time">更新时间：{{ updateTime }}</span>
      <el-button class="exit-btn" @click="handleExit">退出</el-button>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const updateTime = ref(new Date().toLocaleString())

const handleExit = () => {
  // 跳转到其他页面，例如登录页或首页
  router.push('/')
}
</script>

<style scoped>
.screen-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(20, 30, 45, 0.6);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 140, 0, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 10;
  color: #fff;
}

.header-title {
    font-size: 22px;
    font-weight: 600;
    background: linear-gradient(135deg, #ffaa00, #ff8c00);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent; /* 备选 */
    letter-spacing: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.update-time {
  font-size: 14px;
  color: #ccc;
}

.exit-btn {
  background: rgba(255, 140, 0, 0.2);
  border: 1px solid #ff8c00;
  color: #ffaa00;
  border-radius: 20px;
  padding: 8px 20px;
  transition: all 0.3s;
}

.exit-btn:hover {
  background: #ff8c00;
  color: #fff;
  border-color: #ff8c00;
}
</style>