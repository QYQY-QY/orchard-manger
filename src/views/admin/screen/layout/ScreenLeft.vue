<!-- ScreenLeft.vue - 左侧导航菜单 -->
<template>
  <div class="screen-left">
    <!-- 一级导航 - 宏观总览 -->
    <div class="nav-section">
      <div 
        class="nav-item macro-item" 
        :class="{ active: currentRoute === 'Overview' }"
        @click="navigateTo('Overview')"
      >
        <i class="fas fa-chart-pie"></i>
        <span class="nav-label">宏观总览</span>
      </div>
    </div>

    <!-- 二级导航 - 专项管理 -->
    <div class="nav-section">
      <div class="section-title">专项管理</div>
      <div 
        class="nav-item" 
        :class="{ active: currentRoute === 'PestControl' }"
        @click="navigateTo('PestControl')"
      >
        <i class="fas fa-bug"></i>
        <span class="nav-label">病虫害防控</span>
      </div>
      <div 
        class="nav-item" 
        :class="{ active: currentRoute === 'WaterFertilizer' }"
        @click="navigateTo('WaterFertilizer')"
      >
        <i class="fas fa-droplet"></i>
        <span class="nav-label">水肥管控</span>
      </div>
      <div 
        class="nav-item" 
        :class="{ active: currentRoute === 'TaskDispatch' }"
        @click="navigateTo('TaskDispatch')"
      >
        <i class="fas fa-tasks"></i>
        <span class="nav-label">任务调度</span>
      </div>
    </div>

    <!-- 三级导航 - 分析与协同 -->
    <div class="nav-section">
      <div class="section-title">分析与协同</div>
      <div 
        class="nav-item" 
        :class="{ active: currentRoute === 'HistoricalTrend' }"
        @click="navigateTo('HistoricalTrend')"
      >
        <i class="fas fa-chart-line"></i>
        <span class="nav-label">历史趋势</span>
      </div>
      <div 
        class="nav-item" 
        :class="{ active: currentRoute === 'MultiCooperation' }"
        @click="navigateTo('MultiCooperation')"
      >
        <i class="fas fa-handshake"></i>
        <span class="nav-label">多端协同</span>
      </div>
    </div>

    <!-- 四级导航 - 场景可视化 -->
    <div class="nav-section">
      <div class="section-title">场景可视化</div>
      <div 
        class="nav-item" 
        :class="{ active: currentRoute === 'OrchardScene' }"
        @click="navigateTo('OrchardScene')"
      >
        <i class="fas fa-tree"></i>
        <span class="nav-label">果园实景</span>
      </div>
    </div>

    <!-- 底部系统信息 -->
    <div class="system-info">
      <div class="info-item">
        <i class="fas fa-database"></i>
        <span>数据实时同步</span>
      </div>
      <div class="info-item">
        <i class="fas fa-clock"></i>
        <span>{{ currentTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const currentTime = ref('')

// 获取当前路由名称
const currentRoute = ref('Overview')

// 定时更新时间
let timer = null

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  updateCurrentRoute()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const updateCurrentRoute = () => {
  const routeName = route.name
  if (routeName) {
    currentRoute.value = routeName
  }
}

// 导航方法
const navigateTo = (pageName) => {
  currentRoute.value = pageName
  router.push({ name: pageName })
}
</script>

<style scoped>
.screen-left {
  width: 260px;
  height: 100%;
  background: linear-gradient(180deg, #1a3f2a 0%, #0f2b1c 100%);
  color: #e0f0e0;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
  border-right: 2px solid #3a6b4a;
}

.nav-section {
  margin-bottom: 24px;
  padding: 0 16px;
}

.section-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #8fc9a8;
  margin-bottom: 12px;
  padding-left: 8px;
  font-weight: 500;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin: 4px 0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #c0e0d0;
  position: relative;
  overflow: hidden;
}

.nav-item:hover {
  background: rgba(80, 160, 120, 0.2);
  color: #ffffff;
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(90deg, #2d8b55 0%, #1e6b3e 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 80, 40, 0.4);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: #ffd966;
  box-shadow: 0 0 8px #ffd966;
}

.nav-item i {
  width: 24px;
  font-size: 1.2rem;
  margin-right: 12px;
  text-align: center;
}

.nav-item.macro-item i {
  color: #ffb347;
}

.nav-label {
  font-size: 1rem;
  font-weight: 500;
}

.system-info {
  margin-top: auto;
  padding: 20px 16px 12px;
  border-top: 1px solid #3a6b4a;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 0.9rem;
  color: #a0d0b0;
}

.info-item i {
  width: 20px;
  font-size: 1rem;
}
</style>