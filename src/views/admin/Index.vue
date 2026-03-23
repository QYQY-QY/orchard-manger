<template>
  <div class="dashboard-container">
    <Bg3D @region-click="handleRegionClick" />
    <ScreenHeader />
    <div class="dashboard-main">
      <div class="panel-left">
        <ScreenLeft />
      </div>
      <div class="panel-center"></div>
      <div class="panel-right">
        <ScreenRight />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Bg3D from '@/views/admin/screen/OrchardScene.vue'
import ScreenHeader from '@/views/admin/screen/layout/ScreenHeader.vue'
import ScreenLeft from '@/views/admin/screen/layout/ScreenLeft.vue'
import ScreenRight from '@/views/admin/screen/layout/ScreenRight.vue'

const router = useRouter()

// 处理区域点击事件 - 修改为直接跳转到 WaterFertilizer
const handleRegionClick = (region) => {
  console.log('点击了区域:', region)
  
  // 暂停自动旋转（如果需要）
  // 这里可以添加其他逻辑，比如显示加载状态等
  
  // 直接跳转到 WaterFertilizer 水肥管控决策页面
  router.push({
    path: '/WaterFertilizer',
    query: { region: region.toString() }
  }).catch(err => {
    console.error('路由跳转失败:', err)
  })
}
</script>

<style scoped>
.dashboard-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  color: #fff;
}

.dashboard-main {
  position: absolute;
  top: 80px;
  left: 0;
  right: 0;
  bottom: 0;
  /* 紧贴底部 */
  display: flex;
  gap: 20px;
  pointer-events: none;
}

.panel-left,
.panel-right {
  width: 310px;
  height: 100%;
  pointer-events: auto;
  z-index: 2;
  background: linear-gradient(to right, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);
  border-radius: 0;
}

.panel-right {
  background: linear-gradient(to left, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);
}

.panel-center {
  flex: 1;
  height: 100%;
  pointer-events: none;
  background: transparent;
  z-index: 2;
}

.bg-3d {
  z-index: 0;
}

/* 响应式设计 */
@media screen and (max-width: 1600px) {
  .panel-left,
  .panel-right {
    width: 280px;
  }
}

@media screen and (max-width: 1366px) {
  .panel-left,
  .panel-right {
    width: 260px;
  }
  
  .dashboard-main {
    top: 70px;
    gap: 15px;
  }
}

@media screen and (max-width: 1280px) {
  .panel-left,
  .panel-right {
    width: 240px;
  }
}

/* 添加动画效果 */
.dashboard-container {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 面板进入动画 */
.panel-left {
  animation: slideInLeft 0.6s ease-out;
}

.panel-right {
  animation: slideInRight 0.6s ease-out;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 美化滚动条（如果需要） */
.panel-left::-webkit-scrollbar,
.panel-right::-webkit-scrollbar {
  width: 6px;
}

.panel-left::-webkit-scrollbar-track,
.panel-right::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.panel-left::-webkit-scrollbar-thumb,
.panel-right::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.panel-left::-webkit-scrollbar-thumb:hover,
.panel-right::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>