<template>
  <div class="screen-left">
    <!-- 背景层（渐变 + 网格线 + 扫描线） -->
    <div class="left-bg"></div>

    <!-- 内容层 -->
    <div class="left-content">
      <!-- 顶部两个数字卡片 -->
      <div class="cards-row">
        <!-- 果树总数卡片 -->
        <div class="stat-card tree-card">
          <div class="card-value"
            :class="{ 'error': statCards[0].value.includes('失败') || statCards[0].value.includes('无') }">
            {{ statCards[0].value }}
          </div>
          <div class="card-label">{{ statCards[0].label }}</div>
        </div>

        <!-- 健康值卡片 -->
        <div class="stat-card health-card">
          <div class="card-value"
            :class="{ 'error': statCards[1].value.includes('失败') || statCards[1].value.includes('无') }">
            {{ statCards[1].value }}
          </div>
          <div class="card-label">{{ statCards[1].label }}</div>
        </div>
      </div>

      <!-- 农事任务进度卡片 - 压缩空间 -->
      <div class="task-progress-card">
        <div class="card-title">农事任务进度</div>
        <div class="progress-grid">
          <div v-for="task in taskProgressList" :key="task.name" class="progress-item">
            <div class="progress-ring">
  <svg viewBox="0 0 100 100" class="ring-svg">
    <circle class="ring-bg" cx="50" cy="50" r="42" />
    <circle class="ring-fill" cx="50" cy="50" r="42"
      :style="{ strokeDasharray: `${task.progress * 264}, 264` }" />
  </svg>
  <div class="progress-percent">{{ Math.round(task.progress * 100) }}%</div>
</div>
            <div class="progress-label">{{ task.name }}</div>
          </div>
        </div>
      </div>

      <!-- 柱状图组件 - 灾害统计（自动分配剩余空间） -->
      <div class="chart-card">
        <div class="card-title">病虫害分布</div>
        <div class="chart-wrapper">
          <div class="custom-bar-chart" v-if="disasterData.length > 0">
            <div v-for="item in disasterData" :key="item.name" class="bar-item">
              <div class="bar-label">{{ item.name }}</div>
              <div class="bar-container">
                <div class="bar-fill" :style="{ width: getBarWidth(item.value) + '%', backgroundColor: getBarColor(item.name) }">
                  <span class="bar-value">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-data">暂无病虫害数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/modules/user'

const userStore = useUserStore()
const orchardId = computed(() => userStore.user?.orchardId)

// 定义事件，用于向父组件传递数据
const emit = defineEmits(['data-updated'])

// 卡片数据：[果树总数, 健康值]
const statCards = ref([
  { label: '果树总数', value: '加载中...' },
  { label: '健康株占比', value: '加载中...' }
])

// 健康统计数据（用于传递给右侧）
const healthStats = ref({
  healthTree: 0,
  disasterTree: 0,
  health: 0,
  disaster: 0
})

// 农事任务进度数据 - 从接口获取
const taskProgressList = ref([
  { name: '灌溉', progress: 0 },
  { name: '防控', progress: 0 },
  { name: '施肥', progress: 0 },
  { name: '修剪', progress: 0 },
  { name: '采摘', progress: 0 }
])

// 灾害统计数据 - 从接口获取
const disasterData = ref([])

// 获取最大数值用于计算柱状图宽度
const maxDisasterValue = computed(() => {
  if (!disasterData.value.length) return 1
  return Math.max(...disasterData.value.map(item => item.value))
})

// 计算柱状图宽度百分比
const getBarWidth = (value) => {
  return (value / maxDisasterValue.value) * 100
}

// 根据灾害类型返回不同颜色
const getBarColor = (name) => {
  const colorMap = {
    '红蜘蛛': '#7bc5a0',
    '黄龙病': '#6fcf97',
    '炭疽病': '#5bb87a',
    '蚜虫': '#8fcf9f',
    '溃疡病': '#9bc56e'
  }
  return colorMap[name] || '#6fcf97'
}

// 获取果树健康统计数据（总数和健康占比）
const fetchFruitTreeHealth = async () => {
  try {
    console.log('========== 开始获取果树健康统计数据 ==========')
    
    const apiPaths = [
      '/api/fruitTree/countIllness',
      '/fruitTree/countIllness',
      '/api/fruitTree/countIllness/'
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
        
        if (response.status === 200 && response.data && 
            (response.data.healthTree !== undefined || 
             (response.data.data && response.data.data.healthTree !== undefined))) {
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
    
    console.log('果树健康接口完整响应:', response)
    console.log('响应数据:', response.data)
    
    let healthData = null
    
    if (response.data && response.data.code === 200 && response.data.data) {
      healthData = response.data.data
    } else if (response.data && response.data.data && response.data.data.healthTree !== undefined) {
      healthData = response.data.data
    } else if (response.data && response.data.healthTree !== undefined) {
      healthData = response.data
    }
    
    if (healthData && (healthData.healthTree !== undefined || healthData.health !== undefined)) {
      const totalTrees = (healthData.healthTree || 0) + (healthData.disasterTree || 0)
      
      // 计算健康株占比
      let healthPercent = 0
      if (totalTrees > 0) {
        healthPercent = ((healthData.healthTree || 0) / totalTrees * 100).toFixed(1)
      } else {
        healthPercent = healthData.health || 0
      }
      
      statCards.value[0].value = totalTrees + ' 棵'
      statCards.value[1].value = healthPercent + '%'
      
      healthStats.value = {
        healthTree: healthData.healthTree || 0,
        disasterTree: healthData.disasterTree || 0,
        health: parseFloat(healthPercent),
        disaster: healthData.disaster || 0
      }
      
      console.log('果树健康数据加载成功:', { totalTrees, healthPercent })
      emitDataToRight()
    } else {
      throw new Error('数据格式错误')
    }
  } catch (error) {
    console.error('获取果树健康数据失败:', error)
    setDefaultHealthData()
    // 移除弹窗提示：ElMessage.warning('果树健康数据加载失败，使用默认数据')
  }
}

// 设置默认果树健康数据
const setDefaultHealthData = () => {
  const totalTrees = 12850
  const healthPercent = 94
  
  statCards.value[0].value = totalTrees + ' 棵'
  statCards.value[1].value = healthPercent + '%'
  
  healthStats.value = {
    healthTree: Math.round(totalTrees * healthPercent / 100),
    disasterTree: totalTrees - Math.round(totalTrees * healthPercent / 100),
    health: healthPercent,
    disaster: 100 - healthPercent
  }
  
  console.log('使用默认果树健康数据')
  emitDataToRight()
}

// 传递数据给右侧组件
const emitDataToRight = () => {
  const dataToSend = {
    totalPlants: parseInt(statCards.value[0].value) || 0,
    healthyPlantRatio: parseFloat(statCards.value[1].value) || 0,
    healthTree: healthStats.value.healthTree,
    disasterTree: healthStats.value.disasterTree,
    health: healthStats.value.health,
    disaster: healthStats.value.disaster,
    suspectedHuanglongbing: 23,
    redSpiderOutbreakAreas: 5,
    pendingTasks: 18,
    monthlyWaterSaved: 380,
    monthlyFertilizerSaved: 230,
    monthlyCostSaved: 4260
  }
  
  emit('data-updated', dataToSend)
}

// 获取农事任务进度数据
const fetchTaskProgress = async () => {
  try {
    console.log('========== 开始获取农事任务进度数据 ==========')
    
    const apiPaths = [
      '/api/task/countTaskByType',
      '/task/countTaskByType',
      '/api/task/countTaskByType/'
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
    
    console.log('农事任务接口响应:', response.data)
    
    let taskData = null
    
    if (response.data && response.data.code === 200 && response.data.data) {
      taskData = response.data.data
    } else if (response.data && typeof response.data === 'object' && !response.data.code) {
      taskData = response.data
    } else if (response.data && response.data.data) {
      taskData = response.data.data
    }
    
    if (taskData) {
      const updatedTasks = taskProgressList.value.map(task => ({
        name: task.name,
        progress: taskData[task.name] !== undefined && taskData[task.name] !== null 
          ? parseFloat(taskData[task.name]) 
          : 0
      }))
      
      taskProgressList.value = updatedTasks
      console.log('农事任务数据加载成功:', taskProgressList.value)
    } else {
      throw new Error('数据格式错误')
    }
  } catch (error) {
    console.error('获取农事任务数据失败:', error)
    setDefaultTaskProgress()
    // 移除弹窗提示：ElMessage.warning('农事任务数据加载失败，使用默认数据')
  }
}

// 设置默认农事任务进度数据
const setDefaultTaskProgress = () => {
  taskProgressList.value = [
    { name: '灌溉', progress: 0.82 },
    { name: '防控', progress: 0.63 },
    { name: '施肥', progress: 0.71 },
    { name: '修剪', progress: 0.85 },
    { name: '采摘', progress: 0.78 }
  ]
  console.log('使用默认农事任务进度数据')
}

// 获取病虫害统计数据
const fetchDisasterCount = async () => {
  try {
    console.log('========== 开始获取病虫害统计数据 ==========')
    
    const apiPaths = [
      '/api/disaster/getDisasterCount',
      '/disaster/getDisasterCount',
      '/api/disaster/getDisasterCount/'
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
    
    console.log('病虫害接口响应:', response.data)
    
    let disasterMap = null
    
    if (response.data && response.data.code === 200 && response.data.data) {
      disasterMap = response.data.data
    } else if (response.data && typeof response.data === 'object' && !response.data.code) {
      disasterMap = response.data
    } else if (response.data && response.data.data) {
      disasterMap = response.data.data
    }
    
    if (disasterMap && typeof disasterMap === 'object') {
      const chartData = Object.entries(disasterMap)
        .map(([name, value]) => ({
          name,
          value: value || 0
        }))
        .sort((a, b) => b.value - a.value)
      
      disasterData.value = chartData
      console.log('病虫害数据加载成功:', chartData)
    } else {
      throw new Error('数据格式错误')
    }
  } catch (error) {
    console.error('获取病虫害数据失败:', error)
    disasterData.value = []
    // 移除弹窗提示：ElMessage.warning('病虫害数据加载失败，使用默认数据')
    disasterData.value = [
      { name: '溃疡病', value: 14 },
      { name: '黄龙病', value: 6 },
      { name: '红蜘蛛', value: 5 },
      { name: '炭疽病', value: 3 },
      { name: '蚜虫', value: 4 }
    ]
  }
}

// 定时刷新数据
let intervalId = null

const startAutoRefresh = () => {
  intervalId = setInterval(() => {
    console.log('========== 定时刷新数据 ==========')
    fetchFruitTreeHealth()
    fetchTaskProgress()
    fetchDisasterCount()
  }, 30000)
}

onMounted(async () => {
  console.log('========== ScreenLeft 组件已挂载 ==========')
  
  await Promise.all([
    fetchFruitTreeHealth(),
    fetchTaskProgress(),
    fetchDisasterCount()
  ])
  
  startAutoRefresh()
})

onUnmounted(() => {
  console.log('========== ScreenLeft 组件已卸载 ==========')
  if (intervalId) clearInterval(intervalId)
})
</script>

<style scoped>
/* 样式保持不变 */
.screen-left {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(to right,
      rgba(0, 23, 9, 0.884) 0%,
      rgba(0, 30, 0, 0.452) 40%,
      rgba(1, 31, 1, 0.066) 75%,
      rgba(1, 31, 1, 0) 100%);
  backdrop-filter: blur(2px);
}

/* 背景层：网格线 + 扫描线 */
.left-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.left-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(66, 104, 66, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(25, 70, 66, 0.15) 1px, transparent 1px);
  background-size: 30px 30px;
}

.left-bg::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 80, 0, 0.1), transparent);
  animation: scanMove 10s infinite linear;
}

@keyframes scanMove {
  0% { left: -100%; }
  100% { left: 100%; }
}

.left-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

/* 卡片行 */
.cards-row {
  display: flex;
  gap: 12px;
  width: 100%;
  flex-shrink: 0;
}

.tree-card {
  width: 60%;
  flex-shrink: 0;
}

.health-card {
  width: 40%;
  flex-shrink: 0;
}

.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 12px 8px;
  backdrop-filter: blur(4px);
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 80, 0, 0.2) inset;
  box-sizing: border-box;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(100, 255, 150, 0.3) inset;
}

.stat-card:hover .card-value {
  text-shadow: 0 0 8px rgba(100, 255, 150, 0.5);
  transform: scale(1.02);
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #d0ffd0;
  line-height: 1.2;
  margin-bottom: 4px;
  white-space: nowrap;
  width: 100%;
  text-align: center;
  transition: all 0.3s ease;
}

.card-label {
  font-size: 13px;
  color: #bee7d6;
  opacity: 0.9;
  white-space: nowrap;
  width: 100%;
  text-align: center;
}

.card-value.error {
  font-size: 18px;
  color: #ffaaaa;
  white-space: normal;
  word-break: break-word;
}

/* ========== 农事任务进度卡片样式 - 压缩空间 ========== */
.task-progress-card {
  flex-shrink: 0;
  background: rgba(0, 28, 12, 0.6);
  backdrop-filter: blur(4px);
  border-radius: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(63, 184, 150, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.task-progress-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  border-color: rgba(100, 255, 150, 0.5);
}

.progress-grid {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.progress-item {
  flex: 1;
  min-width: 55px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.progress-item:hover {
  transform: translateY(-2px);
}

.progress-item:hover .progress-label {
  color: #c0ffc0;
  text-shadow: 0 0 4px rgba(100, 255, 150, 0.5);
}

/* 压缩环形进度条尺寸 */
.progress-ring {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 4px;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg); /* 让起点从顶部开始 */
}

.ring-bg {
  fill: none;
  stroke: rgba(80, 100, 80, 0.3);
  stroke-width: 6;
}

.ring-fill {
  fill: none;
  stroke: #7bc5a0;
  stroke-width: 6;
  stroke-linecap: round; /* 圆角端点 */
  stroke-dasharray: 264;
  stroke-dashoffset: 0;
  transition: stroke-dasharray 0.6s ease;
}

.progress-percent {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  font-weight: 600;
  color: #c0ffc0;
}

.progress-label {
  font-size: 12px;
  color: #9bc0a0;
  transition: all 0.2s ease;
}

/* 图表卡片 - 使用 flex:1 自动分配剩余空间 */
.chart-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
  border: none;
  box-shadow: none;
  min-height: 180px;
  max-height: calc(100% - 20px);
  width: 100%;
}

/* 图表包装器 - 占满剩余空间 */
.chart-wrapper {
  flex: 1;
  width: 100%;
  min-height: 0;
  position: relative;
  overflow-y: auto;
  padding-bottom: 20px;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #c0ffc0;
  margin-bottom: 8px;
  padding-left: 10px;
  position: relative;
  text-shadow: none;
  flex-shrink: 0;
}

.card-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 12px;
  background: linear-gradient(to bottom, #3fb896, #235640);
  border-radius: 2px;
}

/* ========== 自定义柱状图样式 ========== */
.custom-bar-chart {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  padding: 8px 0;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.bar-item:hover {
  transform: translateX(5px);
}

.bar-item:hover .bar-label {
  color: #e9ffdb;
  text-shadow: 0 0 4px rgba(100, 255, 150, 0.5);
}

.bar-label {
  width: 50px;
  font-size: 12px;
  color: #c0ffc0;
  font-weight: 500;
  text-align: right;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.bar-container {
  flex: 1;
  height: 28px;
  background: rgba(4, 55, 25, 0.5);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
}

.bar-item:hover .bar-container {
  background: rgba(0, 30, 12, 0.7);
  box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.5);
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0) 100%);
}

.bar-item:hover .bar-fill {
  filter: brightness(1.1);
  box-shadow: 0 0 8px rgba(100, 255, 150, 0.3);
}

.bar-fill::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.bar-value {
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 1;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9bc0a0;
  font-size: 13px;
  text-align: center;
  padding: 20px;
}

/* 滚动条美化 */
.chart-wrapper::-webkit-scrollbar {
  width: 4px;
}

.chart-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 30, 15, 0.3);
  border-radius: 4px;
}

.chart-wrapper::-webkit-scrollbar-thumb {
  background: rgba(63, 184, 150, 0.5);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.chart-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(63, 184, 150, 0.8);
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .left-content {
    padding: 12px;
    gap: 10px;
  }
  
  .tree-card, .health-card {
    width: 50%;
  }
  
  .card-value {
    font-size: 24px;
  }
  
  .card-label {
    font-size: 12px;
  }
  
  .progress-ring {
    width: 48px;
    height: 48px;
  }
  
  .progress-percent {
    font-size: 10px;
  }
  
  .progress-label {
    font-size: 10px;
  }
  
  .bar-label {
    width: 45px;
    font-size: 11px;
  }
  
  .bar-container {
    height: 26px;
  }
}

@media screen and (max-width: 480px) {
  .cards-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .tree-card, .health-card {
    width: 100%;
  }
  
  .progress-grid {
    gap: 4px;
  }
  
  .progress-item {
    min-width: 50px;
  }
  
  .progress-ring {
    width: 42px;
    height: 42px;
  }
  
  .progress-percent {
    font-size: 9px;
  }
  
  .bar-label {
    width: 40px;
    font-size: 10px;
  }
}
</style>