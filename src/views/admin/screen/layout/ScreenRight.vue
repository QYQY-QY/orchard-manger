<template>
  <div class="screen-right">
    <!-- 背景层（渐变 + 网格线 + 扫描线） -->
    <div class="right-bg"></div>

    <!-- 内容层 -->
    <div class="right-content">
      <!-- 实时预警卡片 - 缩小空间 -->
      <div class="info-card alert-card">
        <div class="card-title">实时预警</div>
        <div class="alert-items">
          <div class="alert-item">
            <div class="alert-icon warning-icon">⚠️</div>
            <div class="alert-content">
              <div class="alert-name">黄龙病确诊</div>
              <div class="alert-value">{{ alertData.huanglongbing }}<span class="unit">株</span></div>
            </div>
          </div>
          <div class="alert-item">
            <div class="alert-icon danger-icon">🕷️</div>
            <div class="alert-content">
              <div class="alert-name">红蜘蛛数量</div>
              <div class="alert-value">{{ alertData.redSpider }}<span class="unit">只</span></div>
            </div>
          </div>
          <div class="alert-item">
            <div class="alert-icon task-icon">📋</div>
            <div class="alert-content">
              <div class="alert-name">待处理任务</div>
              <div class="alert-value">{{ alertData.pendingTasks }}<span class="unit">个</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 任务统计卡片 - 扩大空间 -->
      <div class="info-card audit-card">
        <div class="card-title">任务统计</div>
        <div class="audit-distribution-content">
          <!-- 3D环形图容器 - 增大高度 -->
          <div ref="pieChartRef" class="pie-chart-container"></div>
          <!-- 图例说明 - 优化布局 -->
          <div class="legend-container">
            <div class="legend-item" v-for="item in auditData" :key="item.name">
              <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
              <span class="legend-name">{{ item.name }}</span>
              <span class="legend-value">{{ item.value }}<span class="unit">{{ item.unit }}</span></span>
              <span class="legend-percent">{{ item.percent }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const props = defineProps({
  overviewData: {
    type: Object,
    default: null
  }
})

// 实时预警数据
const alertData = ref({
  huanglongbing: 0,
  redSpider: 0,
  pendingTasks: 0
})

// 任务统计数据
const taskStats = ref({
  pendingDispatchCount: 0,
  pendingExecuteCount: 0,
  pendingExecuteRemainingRate: 0,
  completedCount: 0,
  completionRate: 0,
  overdueCount: 0
})

// 任务统计状态数据（用于环形图）
const auditData = ref([
  { name: '待派发', value: 0, unit: '个', percent: 0, color: '#6c8b7c', gradientStart: '#5a6e62', gradientEnd: '#3e4e44' },
  { name: '待执行', value: 0, unit: '个', percent: 0, color: '#e5b85b', gradientStart: '#f5c542', gradientEnd: '#c49a2c' },
  { name: '已完成', value: 0, unit: '个', percent: 0, color: '#7bc5a0', gradientStart: '#8ed5ae', gradientEnd: '#5ca87f' },
  { name: '已逾期', value: 0, unit: '个', percent: 0, color: '#e87c6c', gradientStart: '#f28b7a', gradientEnd: '#c95a48' }
])

// 环形图实例
let pieChart = null
const pieChartRef = ref(null)

// 计算百分比
const calculatePercentages = (pendingDispatch, pendingExecute, completed, overdue) => {
  const total = pendingDispatch + pendingExecute + completed + overdue
  if (total === 0) return { pendingDispatch: 0, pendingExecute: 0, completed: 0, overdue: 0 }
  return {
    pendingDispatch: Number(((pendingDispatch / total) * 100).toFixed(1)),
    pendingExecute: Number(((pendingExecute / total) * 100).toFixed(1)),
    completed: Number(((completed / total) * 100).toFixed(1)),
    overdue: Number(((overdue / total) * 100).toFixed(1))
  }
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
    
    // 尝试多种响应格式
    if (response.data && response.data.code === 200 && response.data.data) {
      disasterMap = response.data.data
    } else if (response.data && typeof response.data === 'object' && !response.data.code) {
      disasterMap = response.data
    } else if (response.data && response.data.data) {
      disasterMap = response.data.data
    }
    
    if (disasterMap && typeof disasterMap === 'object') {
      // 获取黄龙病和红蜘蛛的数量
      const huanglongbingCount = disasterMap['黄龙病'] || 0
      const redSpiderCount = disasterMap['红蜘蛛'] || 0
      
      alertData.value.huanglongbing = huanglongbingCount
      alertData.value.redSpider = redSpiderCount
      
      console.log('病虫害数据加载成功:', {
        黄龙病: huanglongbingCount,
        红蜘蛛: redSpiderCount,
        完整数据: disasterMap
      })
    } else {
      throw new Error('数据格式错误')
    }
  } catch (error) {
    console.error('获取病虫害数据失败:', error)
    setDefaultDisasterData()
    
  }
}

// 设置默认病虫害数据
const setDefaultDisasterData = () => {
  alertData.value.huanglongbing = 6
  alertData.value.redSpider = 5
  console.log('使用默认病虫害数据: 黄龙病=6, 红蜘蛛=5')
}

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
      
      console.log('任务统计数据加载成功:', taskStats.value)
      
      // 更新实时预警中的待处理任务数（待派发 + 待执行）
      alertData.value.pendingTasks = (taskStats.value.pendingDispatchCount + taskStats.value.pendingExecuteCount)
      
      // 计算百分比并更新环形图数据
      const percentages = calculatePercentages(
        taskStats.value.pendingDispatchCount,
        taskStats.value.pendingExecuteCount,
        taskStats.value.completedCount,
        taskStats.value.overdueCount
      )
      
      auditData.value = [
        { 
          name: '待派发', 
          value: taskStats.value.pendingDispatchCount, 
          unit: '个', 
          percent: percentages.pendingDispatch, 
          color: '#6c8b7c', 
          gradientStart: '#7e9a88', 
          gradientEnd: '#527060' 
        },
        { 
          name: '待执行', 
          value: taskStats.value.pendingExecuteCount, 
          unit: '个', 
          percent: percentages.pendingExecute, 
          color: '#e5b85b', 
          gradientStart: '#f7d06a', 
          gradientEnd: '#c49e3c' 
        },
        { 
          name: '已完成', 
          value: taskStats.value.completedCount, 
          unit: '个', 
          percent: percentages.completed, 
          color: '#7bc5a0', 
          gradientStart: '#9be0b8', 
          gradientEnd: '#5aa87c' 
        },
        { 
          name: '已逾期', 
          value: taskStats.value.overdueCount, 
          unit: '个', 
          percent: percentages.overdue, 
          color: '#e87c6c', 
          gradientStart: '#ff9a88', 
          gradientEnd: '#c85a48' 
        }
      ]
      
      // 更新环形图
      updatePieChart()
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
  const defaultStats = {
    pendingDispatchCount: 8,
    pendingExecuteCount: 12,
    completedCount: 156,
    overdueCount: 5
  }
  
  taskStats.value = {
    pendingDispatchCount: defaultStats.pendingDispatchCount,
    pendingExecuteCount: defaultStats.pendingExecuteCount,
    pendingExecuteRemainingRate: 0,
    completedCount: defaultStats.completedCount,
    completionRate: 0,
    overdueCount: defaultStats.overdueCount
  }
  
  alertData.value.pendingTasks = defaultStats.pendingDispatchCount + defaultStats.pendingExecuteCount
  
  const percentages = calculatePercentages(
    defaultStats.pendingDispatchCount,
    defaultStats.pendingExecuteCount,
    defaultStats.completedCount,
    defaultStats.overdueCount
  )
  
  auditData.value = [
    { name: '待派发', value: defaultStats.pendingDispatchCount, unit: '个', percent: percentages.pendingDispatch, color: '#6c8b7c', gradientStart: '#7e9a88', gradientEnd: '#527060' },
    { name: '待执行', value: defaultStats.pendingExecuteCount, unit: '个', percent: percentages.pendingExecute, color: '#e5b85b', gradientStart: '#f7d06a', gradientEnd: '#c49e3c' },
    { name: '已完成', value: defaultStats.completedCount, unit: '个', percent: percentages.completed, color: '#7bc5a0', gradientStart: '#9be0b8', gradientEnd: '#5aa87c' },
    { name: '已逾期', value: defaultStats.overdueCount, unit: '个', percent: percentages.overdue, color: '#e87c6c', gradientStart: '#ff9a88', gradientEnd: '#c85a48' }
  ]
  
  updatePieChart()
  console.log('使用默认任务统计数据')
}

// 生成3D环形图配置
const get3DPieOption = () => {
  const pieData = auditData.value.map(item => ({
    name: item.name,
    value: item.percent,
    itemStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: item.gradientStart || item.color },
          { offset: 0.5, color: item.color },
          { offset: 1, color: item.gradientEnd || item.color }
        ]
      },
      borderRadius: 12,
      borderColor: 'rgba(0, 28, 12, 0.6)',
      borderWidth: 2,
      shadowBlur: 20,
      shadowOffsetX: 4,
      shadowOffsetY: 4,
      shadowColor: 'rgba(0, 0, 0, 0.5)'
    }
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const item = auditData.value.find(d => d.name === params.name)
        return `
          <div style="font-family: 'PingFang SC', 'Microsoft YaHei';">
            <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${params.color};margin-right:8px;"></span>
            <span style="font-weight:bold;">${params.name}</span><br/>
            <span style="color:#aaa;">数量：</span><span style="color:#fff;">${item?.value || 0}个</span><br/>
            <span style="color:#aaa;">占比：</span><span style="color:#7bc5a0;">${params.percent}%</span>
          </div>
        `
      },
      backgroundColor: 'rgba(10, 30, 20, 0.95)',
      borderColor: '#7bc5a0',
      borderWidth: 1,
      borderRadius: 8,
      textStyle: { color: '#e0ffe0', fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.5); backdrop-filter: blur(4px);'
    },
    series: [
      {
        name: '任务统计',
        type: 'pie',
        radius: ['50%', '78%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        selectedMode: 'single',
        selectedOffset: 12,
        itemStyle: {
          borderRadius: 10,
          borderColor: 'rgba(0, 28, 12, 0.8)',
          borderWidth: 2,
          shadowBlur: 25,
          shadowOffsetX: 5,
          shadowOffsetY: 8,
          shadowColor: 'rgba(0, 0, 0, 0.6)',
          emphasis: {
            scale: true,
            scaleSize: 8,
            shadowBlur: 30,
            shadowOffsetX: 8,
            shadowOffsetY: 12,
            shadowColor: 'rgba(0, 0, 0, 0.8)'
          }
        },
        label: {
          show: true,
          position: 'outside',
          formatter: (params) => {
            return `{percent|${params.percent}%}`
          },
          rich: {
            percent: {
              fontSize: 12,
              fontWeight: 'bold',
              color: '#d0ffd0',
              textShadowBlur: 8,
              textShadowColor: '#3fb896',
              fontFamily: 'DIN, Quicksand, monospace'
            }
          },
          lineHeight: 20,
          lineStyle: {
            color: '#7bc5a0',
            width: 1.5,
            type: 'solid',
            shadowBlur: 4,
            shadowColor: '#7bc5a0'
          }
        },
        labelLine: {
          length: 12,
          length2: 18,
          smooth: 0.3,
          showAbove: true
        },
        emphasis: {
          scale: true,
          label: {
            show: true,
            fontWeight: 'bold',
            fontSize: 14,
            color: '#fff',
            textShadowBlur: 12,
            textShadowColor: '#7bc5a0'
          }
        },
        data: pieData,
        startAngle: 90,
        clockwise: true,
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      }
    ],
    graphic: [
      {
        type: 'group',
        left: 'center',
        top: 'center',
        children: [{
          type: 'circle',
          shape: { cx: 0, cy: 0, r: 70 },
          style: {
            fill: 'rgba(0, 0, 0, 0)',
            stroke: 'rgba(100, 255, 180, 0.25)',
            lineWidth: 1.5,
            shadowBlur: 15,
            shadowColor: '#7bc5a0'
          },
          invisible: true
        }]
      },
      {
        type: 'ring',
        left: 'center',
        top: 'center',
        shape: { cx: 0, cy: 0, r: 42, r0: 32 },
        style: {
          fill: {
            type: 'radial',
            x: 0.5, y: 0.5, r: 0.8,
            colorStops: [
              { offset: 0, color: 'rgba(100, 255, 180, 0.15)' },
              { offset: 0.6, color: 'rgba(60, 180, 120, 0.08)' },
              { offset: 1, color: 'rgba(30, 100, 60, 0)' }
            ]
          },
          stroke: 'rgba(100, 255, 180, 0.4)',
          lineWidth: 1
        },
        z: 100
      },
      {
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: '任务\n统计',
          fill: '#c0ffc0',
          fontSize: 14,
          fontWeight: '600',
          fontFamily: 'PingFang SC, Microsoft YaHei',
          textAlign: 'center',
          lineHeight: 20,
          textShadowBlur: 8,
          textShadowColor: '#3fb896'
        },
        z: 101
      }
    ],
    backgroundColor: 'transparent',
    aria: { show: false }
  }
}

// 更新环形图
const updatePieChart = () => {
  if (!pieChartRef.value) return
  
  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value)
  }
  
  const option = get3DPieOption()
  pieChart.setOption(option, true)
  
  const container = pieChartRef.value
  if (container) {
    container.style.transform = 'perspective(800px) rotateX(2deg) rotateY(0deg)'
    container.style.transition = 'transform 0.3s ease'
    container.style.transformStyle = 'preserve-3d'
  }
}

// 监听父组件传递的数据（不再需要，因为现在从接口直接获取）
// watch(() => props.overviewData, (newData) => {
//   if (newData) {
//     alertData.value.huanglongbing = newData.suspectedHuanglongbing || 0
//     alertData.value.redSpiderAreas = newData.redSpiderOutbreakAreas || 0
//   }
// }, { immediate: true })

// 窗口大小变化时调整图表
const handleResize = () => {
  if (pieChart) {
    pieChart.resize()
    if (pieChartRef.value) {
      pieChartRef.value.style.transform = 'perspective(800px) rotateX(2deg) rotateY(0deg)'
    }
  }
}

// 定时刷新数据
let intervalId = null

const startAutoRefresh = () => {
  intervalId = setInterval(() => {
    console.log('========== 定时刷新数据 ==========')
    fetchDisasterCount()
    fetchTaskStats()
  }, 30000)
}

onMounted(() => {
  // 获取病虫害数据
  fetchDisasterCount()
  // 获取任务统计数据
  fetchTaskStats()
  
  window.addEventListener('resize', handleResize)
  startAutoRefresh()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (intervalId) clearInterval(intervalId)
  if (pieChart) {
    pieChart.dispose()
    pieChart = null
  }
})
</script>

<style scoped>
/* 样式保持不变 */
.screen-right {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(to left,
      rgba(0, 23, 9, 0.884) 0%,
      rgba(0, 30, 0, 0.452) 40%,
      rgba(1, 31, 1, 0.066) 75%,
      rgba(1, 31, 1, 0) 100%);
  backdrop-filter: blur(2px);
}

/* 背景层：网格线 + 扫描线 */
.right-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.right-bg::before {
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

.right-bg::after {
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

.right-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.info-card {
  background: rgba(0, 28, 12, 0.6);
  backdrop-filter: blur(4px);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(63, 184, 150, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  border-color: rgba(100, 255, 150, 0.5);
}

/* 实时预警卡片 - 缩小空间 */
.alert-card {
  flex: 0.4;
  min-height: 0;
}

/* 任务统计卡片 - 扩大空间 */
.audit-card {
  flex: 0.74;
  min-height: 0;
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
  letter-spacing: 1px;
}

.card-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
  background: linear-gradient(to bottom, #3fb896, #235640);
  border-radius: 2px;
}

/* 实时预警卡片样式 - 压缩内容 */
.alert-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  justify-content: space-around;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  background: rgba(0, 20, 8, 0.5);
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.alert-item:hover {
  background: rgba(0, 40, 16, 0.7);
  transform: translateX(4px);
}

.alert-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.warning-icon {
  background: rgba(255, 170, 100, 0.2);
  box-shadow: 0 0 6px rgba(255, 170, 100, 0.3);
}

.danger-icon {
  background: rgba(255, 100, 100, 0.2);
  box-shadow: 0 0 6px rgba(255, 100, 100, 0.3);
}

.task-icon {
  background: rgba(100, 200, 255, 0.2);
  box-shadow: 0 0 6px rgba(100, 200, 255, 0.3);
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-name {
  font-size: 11px;
  color: #9bc0a0;
  margin-bottom: 2px;
}

.alert-value {
  font-size: 18px;
  font-weight: 700;
  color: #d0ffd0;
  line-height: 1.2;
}

.alert-value .unit {
  font-size: 9px;
  font-weight: 400;
  color: #9bc0a0;
  margin-left: 2px;
}

/* 任务统计卡片样式 - 扩大空间 */
.audit-distribution-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 10px;
  min-height: 0;
}

/* 3D环形图容器 - 增大高度 */
.pie-chart-container {
  width: 100%;
  height: 180px;
  flex-shrink: 0;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
  transition: all 0.3s ease;
}

.pie-chart-container:hover {
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.5));
}

/* 图例容器 - 优化显示 */
.legend-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(0, 40, 20, 0.3) 0%, rgba(0, 20, 10, 0.1) 100%);
  border-radius: 12px;
  backdrop-filter: blur(2px);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  border-radius: 8px;
}

.legend-item:hover {
  transform: translateX(4px);
  background: rgba(100, 255, 150, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
  box-shadow: 0 0 4px currentColor;
}

.legend-name {
  font-size: 12px;
  color: #c0e0c0;
  width: 55px;
  flex-shrink: 0;
  font-weight: 500;
}

.legend-value {
  font-size: 14px;
  font-weight: 600;
  color: #d0ffd0;
  flex: 1;
  text-align: right;
  font-family: 'DIN', 'Quicksand', monospace;
  letter-spacing: 0.5px;
}

.legend-value .unit {
  font-size: 10px;
  font-weight: 400;
  color: #9bc0a0;
  margin-left: 2px;
}

.legend-percent {
  font-size: 13px;
  font-weight: 600;
  color: #7bc5a0;
  width: 45px;
  text-align: right;
  font-family: 'DIN', monospace;
  text-shadow: 0 0 4px rgba(123, 197, 160, 0.5);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .right-content {
    padding: 12px;
    gap: 10px;
  }
  
  .info-card {
    padding: 10px;
  }
  
  .card-title {
    font-size: 13px;
    margin-bottom: 6px;
  }
  
  .alert-card {
    flex: 0.35;
  }
  
  .alert-item {
    padding: 3px 5px;
    gap: 6px;
  }
  
  .alert-icon {
    width: 24px;
    height: 24px;
    font-size: 14px;
  }
  
  .alert-value {
    font-size: 16px;
  }
  
  .pie-chart-container {
    height: 160px;
  }
  
  .legend-name {
    width: 50px;
    font-size: 11px;
  }
  
  .legend-value {
    font-size: 12px;
  }
  
  .legend-percent {
    font-size: 11px;
    width: 40px;
  }
  
  .legend-container {
    gap: 6px;
    padding: 6px 10px;
  }
  
  .legend-item {
    padding: 4px 6px;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .right-content {
    padding: 10px;
    gap: 8px;
  }
  
  .info-card {
    padding: 8px;
  }
  
  .card-title {
    font-size: 12px;
    margin-bottom: 5px;
  }
  
  .alert-card {
    flex: 0.3;
  }
  
  .alert-item {
    padding: 2px 4px;
  }
  
  .alert-icon {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }
  
  .alert-value {
    font-size: 14px;
  }
  
  .alert-name {
    font-size: 10px;
  }
  
  .pie-chart-container {
    height: 140px;
  }
  
  .legend-container {
    gap: 4px;
    padding: 4px 8px;
  }
  
  .legend-name {
    width: 45px;
    font-size: 10px;
  }
  
  .legend-value {
    font-size: 11px;
  }
  
  .legend-percent {
    font-size: 10px;
    width: 35px;
  }
  
  .legend-color {
    width: 10px;
    height: 10px;
  }
  
  .legend-item {
    padding: 3px 5px;
    gap: 6px;
  }
}
</style>