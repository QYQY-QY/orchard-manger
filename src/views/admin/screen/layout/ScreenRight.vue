<!-- ScreenRight.vue - 右侧快捷操作面板 -->
<template>
  <div class="screen-right">
    <!-- 用户信息 -->
    <div class="user-section">
      <div class="avatar">
        <i class="fas fa-user-circle"></i>
      </div>
      <div class="user-info">
        <div class="user-name">张主任</div>
        <div class="user-role">园区负责人</div>
      </div>
    </div>

    <!-- 快捷导航 - 常用页面 -->
    <div class="quick-nav-section">
      <div class="section-header">
        <i class="fas fa-bolt"></i>
        <span class="section-title">快捷导航</span>
      </div>
      <div class="quick-nav-grid">
        <div 
          class="quick-nav-item" 
          :class="{ active: currentRoute === 'Overview' }"
          @click="navigateTo('Overview')"
        >
          <i class="fas fa-chart-pie"></i>
          <span>宏观总览</span>
        </div>
        <div 
          class="quick-nav-item" 
          :class="{ active: currentRoute === 'PestControl' }"
          @click="navigateTo('PestControl')"
        >
          <i class="fas fa-bug"></i>
          <span>病虫害</span>
        </div>
        <div 
          class="quick-nav-item" 
          :class="{ active: currentRoute === 'WaterFertilizer' }"
          @click="navigateTo('WaterFertilizer')"
        >
          <i class="fas fa-droplet"></i>
          <span>水肥</span>
        </div>
        <div 
          class="quick-nav-item" 
          :class="{ active: currentRoute === 'TaskDispatch' }"
          @click="navigateTo('TaskDispatch')"
        >
          <i class="fas fa-tasks"></i>
          <span>任务</span>
        </div>
        <div 
          class="quick-nav-item" 
          :class="{ active: currentRoute === 'HistoricalTrend' }"
          @click="navigateTo('HistoricalTrend')"
        >
          <i class="fas fa-chart-line"></i>
          <span>趋势</span>
        </div>
        <div 
          class="quick-nav-item" 
          :class="{ active: currentRoute === 'MultiCooperation' }"
          @click="navigateTo('MultiCooperation')"
        >
          <i class="fas fa-handshake"></i>
          <span>协同</span>
        </div>
        <div 
          class="quick-nav-item" 
          :class="{ active: currentRoute === 'OrchardScene' }"
          @click="navigateTo('OrchardScene')"
        >
          <i class="fas fa-tree"></i>
          <span>实景</span>
        </div>
      </div>
    </div>

    <!-- 最近访问 -->
    <div class="recent-section">
      <div class="section-header">
        <i class="fas fa-history"></i>
        <span class="section-title">最近访问</span>
      </div>
      <div 
        v-for="(item, index) in recentPages" 
        :key="index"
        class="recent-item"
        @click="navigateTo(item.route)"
      >
        <i :class="item.icon"></i>
        <span>{{ item.name }}</span>
        <span class="visit-time">{{ item.time }}</span>
      </div>
    </div>

    <!-- 系统状态 -->
    <div class="system-status">
      <div class="status-item">
        <i class="fas fa-circle" style="color: #4cd964;"></i>
        <span>数据同步正常</span>
      </div>
      <div class="status-item">
        <i class="fas fa-circle" style="color: #4cd964;"></i>
        <span>设备在线 238/245</span>
      </div>
      <div class="status-item">
        <i class="fas fa-exclamation-triangle" style="color: #ff9500;"></i>
        <span>3条预警待处理</span>
      </div>
    </div>

    <!-- 快捷操作按钮 -->
    <div class="action-buttons">
      <button class="action-btn refresh-btn" @click="handleRefresh">
        <i class="fas fa-sync-alt"></i>
        <span>刷新数据</span>
      </button>
      <button class="action-btn export-btn" @click="handleExport">
        <i class="fas fa-download"></i>
        <span>导出报告</span>
      </button>
    </div>

    <!-- 底部更新时间 -->
    <div class="update-footer">
      <i class="fas fa-clock"></i>
      <span>最后更新: {{ lastUpdateTime }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const currentRoute = ref('Overview')
const lastUpdateTime = ref('')

// 最近访问数据
const recentPages = ref([
  { name: '病虫害防控', route: 'PestControl', icon: 'fas fa-bug', time: '10:25' },
  { name: '宏观总览', route: 'Overview', icon: 'fas fa-chart-pie', time: '09:58' },
  { name: '水肥管控', route: 'WaterFertilizer', icon: 'fas fa-droplet', time: '09:32' }
])

onMounted(() => {
  updateCurrentRoute()
  updateLastUpdateTime()
})

const updateCurrentRoute = () => {
  const routeName = route.name
  if (routeName) {
    currentRoute.value = routeName
  }
}

const updateLastUpdateTime = () => {
  const now = new Date()
  lastUpdateTime.value = now.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 导航方法
const navigateTo = (pageName) => {
  currentRoute.value = pageName
  
  // 更新最近访问记录
  const page = getPageInfo(pageName)
  if (page) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    
    // 检查是否已存在
    const existingIndex = recentPages.value.findIndex(item => item.route === pageName)
    if (existingIndex !== -1) {
      recentPages.value.splice(existingIndex, 1)
    }
    
    // 添加到开头
    recentPages.value.unshift({
      name: page.name,
      route: pageName,
      icon: page.icon,
      time: timeStr
    })
    
    // 只保留最近5条
    if (recentPages.value.length > 5) {
      recentPages.value = recentPages.value.slice(0, 5)
    }
  }
  
  router.push({ name: pageName })
}

// 获取页面信息
const getPageInfo = (pageName) => {
  const pageMap = {
    'Overview': { name: '宏观总览', icon: 'fas fa-chart-pie' },
    'PestControl': { name: '病虫害防控', icon: 'fas fa-bug' },
    'WaterFertilizer': { name: '水肥管控', icon: 'fas fa-droplet' },
    'TaskDispatch': { name: '任务调度', icon: 'fas fa-tasks' },
    'HistoricalTrend': { name: '历史趋势', icon: 'fas fa-chart-line' },
    'MultiCooperation': { name: '多端协同', icon: 'fas fa-handshake' },
    'OrchardScene': { name: '果园实景', icon: 'fas fa-tree' }
  }
  return pageMap[pageName]
}

// 刷新数据
const handleRefresh = () => {
  updateLastUpdateTime()
  // 这里可以触发全局数据刷新事件
  alert('数据已刷新')
}

// 导出报告
const handleExport = () => {
  alert('开始导出报告...')
}
</script>

<style scoped>
.screen-right {
  width: 280px;
  height: 100%;
  background: linear-gradient(180deg, #f0f9f0 0%, #e0f0e0 100%);
  color: #1a4a2a;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  border-left: 2px solid #a0d0b0;
}

/* 用户信息 */
.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 2px solid #b8e0c5;
  margin-bottom: 20px;
}

.avatar i {
  font-size: 3rem;
  color: #2d8b55;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1a4a2a;
}

.user-role {
  font-size: 0.85rem;
  color: #3a8b5a;
  margin-top: 4px;
}

/* 快捷导航 */
.quick-nav-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #1a4a2a;
}

.section-header i {
  font-size: 1.1rem;
  color: #2d8b55;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quick-nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.quick-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #d0e8d8;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.quick-nav-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 120, 80, 0.2);
  border-color: #2d8b55;
}

.quick-nav-item.active {
  background: #2d8b55;
  color: white;
  border-color: #1a5a35;
}

.quick-nav-item i {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.quick-nav-item span {
  font-size: 0.75rem;
  font-weight: 500;
}

/* 最近访问 */
.recent-section {
  margin-bottom: 24px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin: 4px 0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.recent-item:hover {
  background: #e0f5e5;
  border-color: #2d8b55;
  transform: translateX(4px);
}

.recent-item i {
  width: 20px;
  color: #2d8b55;
  font-size: 1rem;
}

.recent-item span {
  flex: 1;
  font-size: 0.9rem;
}

.visit-time {
  font-size: 0.75rem;
  color: #6a9a7a;
}

/* 系统状态 */
.system-status {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #d0e8d8;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 0.9rem;
}

.status-item i {
  width: 20px;
  font-size: 0.8rem;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: auto;
  margin-bottom: 16px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn {
  background: #2d8b55;
  color: white;
}

.refresh-btn:hover {
  background: #1e6b3e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(45, 139, 85, 0.3);
}

.export-btn {
  background: white;
  color: #1a4a2a;
  border: 1px solid #2d8b55;
}

.export-btn:hover {
  background: #e0f5e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 底部更新时间 */
.update-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid #c0e0d0;
  font-size: 0.8rem;
  color: #3a8b5a;
}

.update-footer i {
  font-size: 0.8rem;
}
</style>