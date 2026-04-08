<!-- TaskSchedule.vue - 农事任务调度管理大屏（带返回功能） -->
<template>
  <div class="task-dashboard">
    <!-- 头部 - 添加返回按钮 -->
    <div class="header">
      <div class="title-section">
        <div class="title-with-back">
          <button class="back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i> 返回
          </button>
          <h1>
            <i class="fas fa-tasks"></i> 农事任务调度管理
          </h1>
        </div>
        <div class="role-tag">
          <i class="fas fa-user-cog"></i> {{ regionManager }}
        </div>
      </div>
      <div class="update-time">
        <i class="fas fa-sync-alt"></i> 当前时间：{{ currentTime }}
      </div>
    </div>

    <!-- 任务总览 KPI 卡片 - 动态数据 -->
    <div class="kpi-row">
      <div v-for="(kpi, index) in kpiData" :key="index" class="kpi-card" :class="'card' + (index + 1)">
        <div class="kpi-label"><i :class="kpi.icon"></i> {{ kpi.label }}</div>
        <div class="kpi-value">{{ kpi.value }} <span style="font-size:1rem;">{{ kpi.unit }}</span></div>
        <div class="progress-ring">{{ kpi.trend }}</div>
      </div>
    </div>

    <!-- 两列核心区 -->
    <div class="two-col">
      <!-- 左侧: 任务分布统计 + 人员绩效排行 -->
      <div>
        <!-- 任务分布统计 -->
        <div class="distrib-card">
          <div class="section-title"><i class="fas fa-chart-pie"></i> 任务分布统计 · 地块热力 ({{ currentTime }})</div>
          <div class="pie-sim">
            <div class="pie"></div>
            <div class="pie-labels">
              <div v-for="(item, index) in taskDistribution" :key="index" class="pie-item">
                <span class="color-dot" :style="{ background: item.color }"></span> {{ item.label }}
              </div>
            </div>
          </div>
          <!-- 地块任务热力模拟 -->
          <div class="heatmock">
            <span><i class="fas fa-fire"></i> 任务热力地块: A区(灌溉) · C区(防控) · D区(修剪) </span>
            <span class="heat-badge">🌡️ 高密集度</span>
          </div>
        </div>

        <!-- 人员绩效排行 -->
        <div class="rank-card">
          <div class="section-title"><i class="fas fa-medal"></i> 人员绩效排行 ({{ currentTime }})</div>
          <div v-for="(person, index) in rankData" :key="index" class="rank-item">
            <span class="rank-number">{{ index + 1 }}</span> {{ person.name }}
            <span>{{ person.tasks }}任务 {{ person.rate }}</span>
            <span :style="{ color: person.timeColor }">{{ person.time }}</span>
          </div>
          <div class="rank-footer">
            <i class="fas fa-chart-line"></i> 今日人均效率 ↑6% · 最快 王*海
          </div>
        </div>
      </div>

      <!-- 右侧: 任务执行进度 + 逾期预警 + 历史趋势 -->
      <div>
        <!-- 任务执行进度 -->
        <div class="progress-card">
          <div class="section-title"><i class="fas fa-map-marked-alt"></i> 任务执行进度 · 实时位置 ({{ currentTime }})</div>
          <div v-for="(task, index) in progressData" :key="index" class="plot-item">
            <span>{{ task.name }}</span><span>{{ task.progress }}%</span>
            <div class="bar-bg"><div class="bar-fill" :style="{ width: task.progress + '%' }"></div></div>
          </div>

          <!-- 模拟地图点位 -->
          <div class="map-mock">
            <span><i class="fas fa-map-pin" style="color:#c44242;"></i> 王*海 @A1</span>
            <span><i class="fas fa-map-pin" style="color:#4290c4;"></i> 李*英 @C2</span>
            <span><i class="fas fa-camera"></i> 照片 42张</span>
          </div>
          <div class="photo-feedback">📸 最新反馈: A1灌溉完成图 · C2防控喷药图</div>
        </div>

        <!-- 逾期任务预警 -->
        <div class="overdue-card">
          <div class="section-title"><i class="fas fa-bell"></i> 逾期任务预警 ({{ currentTime }})</div>
          <div v-for="(task, index) in overdueData" :key="index" class="overdue-item">
            <span><i class="fas fa-clock" style="color:#cf5f4a;"></i> {{ task.name }}</span>
            <span>{{ task.desc }}</span>
            <span class="overdue-badge" :style="{ background: task.badgeColor }">{{ task.level }}</span>
          </div>
          <div class="overdue-suggestion">
            处理建议: 优先采摘B3, 已催办
          </div>
        </div>

        <!-- 任务历史趋势 -->
        <div class="trend-card">
          <div class="section-title"><i class="fas fa-chart-line"></i> 任务历史趋势 (近7天) 当前时间: {{ currentTime }}</div>
          <div class="trend-line">
            <span v-for="n in 7" :key="n" :class="'line' + n"></span>
          </div>
          <div class="date-labels">
            <span>04/01</span><span>02</span><span>03</span><span>04</span><span>05</span><span>06</span><span>07</span>
          </div>
          <div class="trend-stats">
            <span>📊 周完成趋势 ↑12%</span>
            <span>⚡ 防控效率 +8%</span>
            <span>⏱️ 平均耗时 3.2h</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部联动 -->
    <div class="drill-footer">
      <span><i class="fas fa-link"></i> 跨屏联动: 点击地块/人员可跳转至病虫害/水肥/历史分析屏</span>
      <span><i class="fas fa-clock"></i> 当前时间: {{ currentTime }} · 实时任务每2分钟更新</span>
    </div>

    <!-- 数据清单 -->
    <div class="micro-data">
      <span>📋 待派发{{ taskStats.pendingDispatchCount }} 待执行{{ taskStats.pendingExecuteCount }} 已完成{{ taskStats.completedCount }} 逾期{{ taskStats.overdueCount }} 完成率{{ taskStats.completionRate }}%</span>
      <span>🥧 灌溉28% 施肥22% 防控18% 修剪20% 采摘12%</span>
      <span>🏆 绩效: 王*海32 李*英29 赵*柱27</span>
      <span>📍 实时作业: A1, C2, 照片42张</span>
      <span>⚠️ 逾期: B3(2天) E5(1天) F2(6h)</span>
      <span>📈 近7天↑12% 防控效率+8%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 返回上一页功能
const goBack = () => {
  router.back()
}

// 区域负责人
// const regionManager = ref('汤村负责人 : 张齐')

// 实时时间
const currentTime = ref('')

// 任务统计数据
const taskStats = ref({
  pendingDispatchCount: 0,
  pendingExecuteCount: 0,
  pendingExecuteRemainingRate: 0,
  completedCount: 0,
  completionRate: 0,
  overdueCount: 0
})

// KPI数据 - 动态从接口获取
const kpiData = ref([
  { icon: 'fas fa-paper-plane', label: '待派发任务', value: '0', unit: '单', trend: '加载中...' },
  { icon: 'fas fa-play-circle', label: '待执行任务', value: '0', unit: '单', trend: '加载中...' },
  { icon: 'fas fa-check-circle', label: '已完成', value: '0', unit: '单', trend: '加载中...' },
  { icon: 'fas fa-exclamation-triangle', label: '逾期任务数', value: '0', unit: '单', trend: '加载中...' }
])

// 获取任务统计数据
const fetchTaskStats = async () => {
  try {
    console.log('========== 开始获取任务统计数据 ==========')
    
    const apiPaths = [
      '/api/task/countByStatus',
      '/task/countByStatus',
      '/api/task/countByStatus/'
    ]
    
    let response = null
    let successPath = null
    
    for (const path of apiPaths) {
      try {
        console.log(`尝试路径: ${path}`)
        response = await axios.get(path, {
          params: { _t: Date.now() },
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
          timeout: 10000
        })
        
        if (response.status === 200 && response.data) {
          if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
            console.log(`路径 ${path} 返回HTML，跳过`)
            continue
          }
          successPath = path
          console.log(`✅ 成功路径: ${path}`)
          break
        }
      } catch (e) {
        console.log(`路径 ${path} 失败:`, e.message)
        continue
      }
    }
    
    if (!response || !successPath) {
      throw new Error('所有路径都失败')
    }
    
    console.log('任务统计接口响应:', response.data)
    
    let statsData = null
    
    // 尝试多种响应格式
    if (response.data && response.data.code === 200 && response.data.data) {
      statsData = response.data.data
    } else if (response.data && typeof response.data === 'object' && !response.data.code) {
      statsData = response.data
    } else if (response.data && response.data.data) {
      statsData = response.data.data
    }
    
    if (statsData) {
      taskStats.value = {
        pendingDispatchCount: statsData.pendingDispatchCount || 0,
        pendingExecuteCount: statsData.pendingExecuteCount || 0,
        pendingExecuteRemainingRate: statsData.pendingExecuteRemainingRate || 0,
        completedCount: statsData.completedCount || 0,
        completionRate: statsData.completionRate || 0,
        overdueCount: statsData.overdueCount || 0
      }
      
      // 更新 KPI 卡片数据
      kpiData.value[0].value = taskStats.value.pendingDispatchCount
      kpiData.value[0].trend = `待派发 ${taskStats.value.pendingDispatchCount}单`
      
      kpiData.value[1].value = taskStats.value.pendingExecuteCount
      kpiData.value[1].trend = `剩余 ${taskStats.value.pendingExecuteRemainingRate}%`
      
      kpiData.value[2].value = taskStats.value.completedCount
      kpiData.value[2].trend = `完成率 ${taskStats.value.completionRate}%`
      
      kpiData.value[3].value = taskStats.value.overdueCount
      kpiData.value[3].trend = `逾期 ${taskStats.value.overdueCount}单`
      
      console.log('任务统计数据加载成功:', taskStats.value)
    } else {
      throw new Error('数据格式错误')
    }
  } catch (error) {
    console.error('获取任务统计数据失败:', error)
    setDefaultTaskStats()
    
  }
}

// 设置默认任务统计数据
const setDefaultTaskStats = () => {
  taskStats.value = {
    pendingDispatchCount: 24,
    pendingExecuteCount: 42,
    pendingExecuteRemainingRate: 32,
    completedCount: 38,
    completionRate: 68,
    overdueCount: 7
  }
  
  kpiData.value[0].value = taskStats.value.pendingDispatchCount
  kpiData.value[0].trend = `待派发 ${taskStats.value.pendingDispatchCount}单`
  
  kpiData.value[1].value = taskStats.value.pendingExecuteCount
  kpiData.value[1].trend = `剩余 ${taskStats.value.pendingExecuteRemainingRate}%`
  
  kpiData.value[2].value = taskStats.value.completedCount
  kpiData.value[2].trend = `完成率 ${taskStats.value.completionRate}%`
  
  kpiData.value[3].value = taskStats.value.overdueCount
  kpiData.value[3].trend = `逾期 ${taskStats.value.overdueCount}单`
  
  console.log('使用默认任务统计数据')
}

// 更新时间定时器
let timeInterval = null

// 更新时间的函数
const updateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  currentTime.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 定时刷新数据
let refreshInterval = null

const startAutoRefresh = () => {
  refreshInterval = setInterval(() => {
    console.log('========== 定时刷新任务统计数据 ==========')
    fetchTaskStats()
  }, 30000) // 每30秒刷新一次
}

// 任务分布
const taskDistribution = ref([
  { label: '灌溉 28%', color: '#369561' },
  { label: '施肥 22%', color: '#e09f3e' },
  { label: '防控 18%', color: '#cf5f4a' },
  { label: '修剪 20%', color: '#4794b3' },
  { label: '采摘 12%', color: '#b58f5a' }
])

// 排名数据
const rankData = ref([
  { name: '王*海', tasks: '32', rate: '100%', time: '2.8h/单', timeColor: '#1f7a48' },
  { name: '李*英', tasks: '29', rate: '96%', time: '3.1h/单', timeColor: '#1f7a48' },
  { name: '赵*柱', tasks: '27', rate: '93%', time: '3.5h/单', timeColor: '#cf5f4a' },
  { name: '周*华', tasks: '25', rate: '92%', time: '2.9h/单', timeColor: '#1f7a48' },
  { name: '吴*才', tasks: '22', rate: '88%', time: '3.3h/单', timeColor: '#1f7a48' }
])

// 进度数据
const progressData = ref([
  { name: '地块 A1灌溉', progress: 37 },
  { name: '地块 B3施肥', progress: 45 },
  { name: '地块 C2防控', progress: 78 },
  { name: '地块 D7修剪', progress: 62 }
])

// 逾期数据
const overdueData = ref([
  { name: '采摘 B3', desc: '逾期2天 · 责任人张*茂', level: '高亮', badgeColor: '#cf5f4a' },
  { name: '防控 E5', desc: '逾期1天 · 责任人赵*欣', level: '中', badgeColor: '#e68a3a' },
  { name: '施肥 F2', desc: '逾期6h · 责任人李*国', level: '中', badgeColor: '#e68a3a' }
])

onMounted(() => {
  // 立即更新一次时间
  updateTime()
  
  // 每秒更新一次时间
  timeInterval = setInterval(updateTime, 1000)
  
  // 获取任务统计数据
  fetchTaskStats()
  
  // 启动自动刷新
  startAutoRefresh()
  
  console.log('农事任务调度管理页面加载')
})

onUnmounted(() => {
  // 组件卸载时清除定时器，防止内存泄漏
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
/* 样式保持不变，与原来完全一致 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

body {
  background: linear-gradient(145deg, #cfdec7 0%, #b8d2bc 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.task-dashboard {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 56px;
  box-shadow: 0 40px 60px -20px #254f30, 0 20px 30px -10px #1f4028;
  padding: 32px 36px 40px 36px;
  border: 2px solid rgba(130, 180, 140, 0.6);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 20px;
}

.title-section {
  flex: 1;
}

.title-with-back {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 8px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #60b282;
  color: #1e5834;
  font-size: 1rem;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.back-btn:hover {
  background: #60b282;
  color: white;
  transform: translateX(-3px);
  box-shadow: 0 6px 12px rgba(96, 178, 130, 0.3);
}

.back-btn i {
  font-size: 1rem;
}

.title-section h1 {
  font-size: 2.3rem;
  font-weight: 600;
  color: #1e5834;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 18px;
}

.title-section h1 i {
  font-size: 2.8rem;
  color: #e09f3e;
  background: #fef2dd;
  padding: 12px;
  border-radius: 50%;
  box-shadow: 0 4px 12px #dbb079;
}

.role-tag {
  background: #b47d44;
  color: white;
  font-weight: 500;
  font-size: 1rem;
  padding: 8px 26px;
  border-radius: 60px;
  display: inline-block;
  margin-top: 6px;
  box-shadow: 0 6px 14px #a57a4b;
}

.update-time {
  background: #effaf2;
  border-radius: 100px;
  padding: 10px 26px;
  font-weight: 500;
  color: #1f6d40;
  border: 1px solid #abd8b8;
  font-size: 1rem;
  white-space: nowrap;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
  margin-bottom: 28px;
}

.kpi-card {
  background: white;
  border-radius: 32px;
  padding: 22px 20px;
  box-shadow: 0 12px 20px -12px #2a5a3b;
  border: 1px solid #c0e0cb;
  border-left: 10px solid;
}
.card1 { border-left-color: #5b8c7b; }
.card2 { border-left-color: #e68a3a; }
.card3 { border-left-color: #369561; }
.card4 { border-left-color: #cf5f4a; }

.kpi-label {
  font-size: 0.9rem;
  text-transform: uppercase;
  color: #3e6e4f;
  margin-bottom: 8px;
}
.kpi-value {
  font-size: 2.2rem;
  font-weight: 800;
  color: #194f30;
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.progress-ring {
  font-size: 0.9rem;
  background: #ecf9ec;
  border-radius: 40px;
  padding: 4px 14px;
}

.two-col {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 26px;
  margin-bottom: 32px;
}

.distrib-card {
  background: #f6fff8;
  border-radius: 38px;
  padding: 26px;
  border: 1px solid #c2e6d5;
  margin-bottom: 22px;
}
.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #175a34;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pie-sim {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  background: #e2f3e8;
  border-radius: 60px;
  padding: 24px;
  margin-bottom: 16px;
}
.pie {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: conic-gradient(#369561 0deg 100deg, #e09f3e 100deg 160deg, #cf5f4a 160deg 220deg, #4794b3 220deg 280deg, #b58f5a 280deg 360deg);
  border: 4px solid white;
}
.pie-labels {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pie-item { display: flex; align-items: center; gap: 8px; }
.color-dot { width: 16px; height: 16px; border-radius: 4px; }

.heatmock {
  background: #deefe2;
  border-radius: 40px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.heat-badge {
  background: #b7dfc2;
  padding: 6px 18px;
  border-radius: 30px;
}

.rank-card {
  background: white;
  border-radius: 34px;
  padding: 22px;
  border: 1px solid #cee6d8;
}
.rank-item {
  display: flex;
  align-items: center;
  background: #f2fcf5;
  border-radius: 50px;
  padding: 12px 22px;
  margin: 8px 0;
  justify-content: space-between;
  font-weight: 600;
}
.rank-number { background: #c9e6d2; border-radius: 30px; padding: 4px 14px; }
.rank-footer {
  margin-top: 12px;
  background: #eaf6ee;
  border-radius: 30px;
  padding: 10px 16px;
}

.progress-card, .overdue-card, .trend-card {
  background: white;
  border-radius: 34px;
  padding: 24px;
  border: 1px solid #c6e3d4;
  margin-bottom: 20px;
}

.plot-item {
  display: flex;
  justify-content: space-between;
  margin: 14px 0;
  align-items: center;
}
.bar-bg {
  width: 60%;
  height: 14px;
  background: #deecdf;
  border-radius: 40px;
}
.bar-fill {
  height: 14px;
  background: #369561;
  border-radius: 40px;
}

.map-mock {
  background: #d5ecdb;
  height: 70px;
  border-radius: 36px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 16px 0;
  background-image: radial-gradient(circle at 30px 25px, #9fcbae 3px, transparent 3px);
}
.photo-feedback {
  font-size: 0.9rem;
}

.overdue-item {
  background: #fff2e5;
  border-left: 8px solid #cf5f4a;
  border-radius: 30px;
  padding: 16px 22px;
  margin: 12px 0;
  display: flex;
  justify-content: space-between;
}
.overdue-badge {
  color: white;
  padding: 4px 12px;
  border-radius: 30px;
}
.overdue-suggestion {
  margin-top: 8px;
  background: #fff4e5;
  padding: 8px;
  border-radius: 30px;
}

.trend-line {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  height: 80px;
  margin: 20px 0;
  justify-content: center;
}
.trend-line span {
  width: 40px;
  background: #3f9d6b;
  border-radius: 20px 20px 6px 6px;
}
.line1 { height: 48px; }
.line2 { height: 66px; }
.line3 { height: 54px; }
.line4 { height: 70px; }
.line5 { height: 62px; }
.line6 { height: 56px; }
.line7 { height: 72px; }

.date-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 8px;
}
.trend-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 18px;
}

.drill-footer {
  margin-top: 24px;
  background: #e3f3e6;
  border-radius: 60px;
  padding: 16px 28px;
  display: flex;
  justify-content: space-between;
  color: #165f36;
  border: 1px solid #a0cfb0;
}

.micro-data {
  margin-top: 20px;
  font-size: 0.8rem;
  color: #2f704a;
  border-top: 1px dashed #a2cfb2;
  padding-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

@media (max-width: 1200px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .two-col {
    grid-template-columns: 1fr;
  }
  
  .title-with-back {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .kpi-row {
    grid-template-columns: 1fr;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .update-time {
    align-self: flex-start;
  }
}
</style>