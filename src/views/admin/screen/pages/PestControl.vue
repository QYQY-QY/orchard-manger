<!-- PestControl.vue - 病虫害专项防控监测大屏（带返回功能） -->
<template>
  <div class="pest-dashboard">
    <!-- 头部 - 添加返回按钮 -->
    <div class="header">
      <div class="title-section">
        <div class="title-with-back">
          <button class="back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i> 返回
          </button>
          <h1>
            <i class="fas fa-bug"></i> 病虫害专项防控监测
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

    <!-- 第一行 KPI 卡片 - 动态数据 -->
    <div class="kpi-row">
      <div v-for="(kpi, index) in kpiData" :key="index" class="kpi-card" :class="kpi.cardClass">
        <div class="kpi-label"><i :class="kpi.icon"></i> {{ kpi.label }}</div>
        <div class="kpi-value">{{ kpi.value }} <span class="sub-value">{{ kpi.unit }}</span></div>
        <div class="trend-badge">{{ kpi.trend }}</div>
      </div>
    </div>

    <!-- 两列核心区 -->
    <div class="two-col">
      <!-- 左侧 -->
      <div>
        <!-- 实时监测卡片 -->
        <div class="monitor-card">
          <div class="section-title"><i class="fas fa-microscope"></i> 实时病虫害监测</div>
          <div class="pest-tag-list">
            <div v-for="(pest, index) in pestData" :key="index" class="pest-tag" :class="pest.colorClass">
              <i :class="pest.icon" :style="{ color: pest.iconColor }"></i>
              <span class="pest-name">{{ pest.name }}</span>
              <span class="pest-count">{{ pest.count }}</span><span style="font-size:0.9rem;">株</span>
            </div>
          </div>
          <div class="trap-card">
            <span style="font-weight:600; font-size:1.1rem;"><i class="fas fa-trap"></i> 诱捕器峰值 (今日)</span>
            <span class="trap-value">{{ trapValue }}</span> <span>头/日 · 超阈值{{ trapThreshold }}%</span>
          </div>

          <!-- 预警分布热力地块标注 -->
          <div class="heatmap-container">
            <div class="heatmap-header">
              <span class="section-title" style="font-size:1.1rem;"><i class="fas fa-fire"></i> 预警分布热力 & 重灾地块</span>
              <span class="badge">🔴重灾 {{ severeAreas.length }}个</span>
            </div>
            <div class="heatmap-grid">
              <div v-for="(cell, index) in heatmapData" :key="index" 
                   class="plot-pest" :class="cell.class" :title="cell.title">
                {{ cell.label }}
              </div>
            </div>
            <div class="plot-label">
              <span><i class="fas fa-map-marker-alt" style="color:#bf4f2e;"></i> 重灾地块: {{ severeAreas.join(' · ') }} </span>
              <span class="click-hint">点击格子钻取详情</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧: 防治任务 + 药剂使用 + 效果反馈 -->
      <div class="right-panel">
        <!-- 防治任务卡片 -->
        <div class="task-card">
          <div class="task-header"><i class="fas fa-clipboard-list"></i> 今日防治任务 ({{ currentTime }})</div>
          <div class="task-progress">
            <div v-for="(task, index) in taskData" :key="index" class="progress-item">
              <span>{{ task.name }}</span><span>{{ task.value }}</span>
              <div class="bar-bg"><div class="bar-fill" :style="{ width: task.percentage, background: task.color }"></div></div>
            </div>
          </div>
          <div class="coverage-badge">
            <i class="fas fa-check-circle" style="color:#2c9c5e;"></i> 防控覆盖率 {{ controlCoverage }}% · 已覆盖{{ coveredAreas }}个地块
          </div>
        </div>

        <!-- 药剂使用分析卡片 -->
        <div class="chemical-card">
          <div class="chemical-title"><i class="fas fa-flask"></i> 药剂使用分析 ({{ currentTime }})</div>
          <div v-for="(chemical, index) in chemicalData" :key="index" class="chemical-row">
            <span class="chemical-name">{{ chemical.name }}</span>
            <span class="chemical-quantity">{{ chemical.quantity }}</span>
          </div>
          <div class="chemical-footer"><i class="fas fa-chart-pie"></i> 按病害配比 · 红蜘蛛用药占比 {{ redSpiderChemicalPercent }}%</div>
        </div>

        <!-- 防治效果反馈卡片 -->
        <div class="feedback-card">
          <div class="feedback-title"><i class="fas fa-chart-simple"></i> 防治效果反馈 ({{ currentTime }})</div>
          <div class="feedback-stats">
            <div v-for="(stat, index) in feedbackStats" :key="index" class="stat-item">
              <span class="feedback-value">{{ stat.value }}</span><br>{{ stat.label }}
            </div>
          </div>
          <div class="feedback-footer">
            <i class="fas fa-thumbs-up"></i> 防治效果达标率 {{ effectRate }}% (目标85%)
          </div>
        </div>
      </div>
    </div>

    <!-- 跨屏联动/数据同源提示 -->
    <div class="drill-footer">
      <span><i class="fas fa-link"></i> 跨屏联动: 从宏观总览点击异常株可直达本屏 · 预警每5min更新</span>
      <span><i class="fas fa-database"></i> 数据底层同源 · 植保专项全流程</span>
      <span><i class="fas fa-clock"></i> 当前时间: {{ currentTime }}</span>
    </div>

    <!-- 微型数据标注 -->
    <div class="micro-data">
      <span> 红蜘蛛{{ redSpiderCount }}株 黄龙病{{ huanglongbingCount }}株 炭疽{{ anthracnoseCount }}株</span>
      <span> 诱捕器{{ trapValue }}头/日</span>
      <span> 重灾地块{{ severeAreas.length }}个</span>
      <span>防治任务{{ taskDispatched }}/{{ taskCompleted }}/{{ taskRemaining }}</span>
      <span>{{ chemicalSummary }}</span>
      <span>减退率{{ reductionRate }}% 砍除{{ removedTrees }}株</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

// 区域负责人映射
const REGION_MANAGERS = { 1: '**', 2: '**', 3: '**' }
const REGION_NAMES = { 1: '汤村', 2: '莲村', 3: '桂村' }

// const regionManager = ref('汤村负责人 - 张齐')

// 实时时间
const currentTime = ref('')
let timeInterval = null

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

// 病虫害统计数据
const redSpiderCount = ref(0)
const huanglongbingCount = ref(0)
const anthracnoseCount = ref(0)
const aphidCount = ref(0)
const cankerCount = ref(0)

// 计算总染病株数
const totalDiseased = computed(() => {
  return redSpiderCount.value + huanglongbingCount.value + anthracnoseCount.value + aphidCount.value + cankerCount.value
})

// KPI数据
const kpiData = ref([
  { icon: 'fas fa-biohazard', label: '当前染病株数', value: '0', unit: '株', trend: '加载中...', cardClass: '' },
  { icon: 'fas fa-skull-crosswalk', label: '高危预警株', value: '0', unit: '株', trend: '黄龙病/红蜘蛛', cardClass: 'pest2' },
  { icon: 'fas fa-spray-can', label: '今日防治完成率', value: '68%', unit: '', trend: '8/12 地块', cardClass: 'pest3' },
  { icon: 'fas fa-chart-line', label: '诱捕器头均密度', value: '186', unit: '头/日', trend: '↑上周+12%', cardClass: 'pest4' }
])

// 病虫害数据（用于显示）
const pestData = computed(() => [
  { name: '红蜘蛛', count: redSpiderCount.value, icon: 'fas fa-bug', iconColor: '#b34343', colorClass: 'red' },
  { name: '黄龙病', count: huanglongbingCount.value, icon: 'fas fa-leaf', iconColor: '#cb7b3a', colorClass: 'orange' },
  { name: '炭疽病', count: anthracnoseCount.value, icon: 'fas fa-seedling', iconColor: '#9b643b', colorClass: 'brown' }
])

const trapValue = ref(186)
const trapThreshold = computed(() => ((trapValue.value - 150) / 150 * 100).toFixed(0))

// 重灾地块
const severeAreas = ref(['A3-A4', 'B2-B3', 'C6'])

// 防治任务
const taskDispatched = ref(8)
const taskCompleted = ref(5)
const taskRemaining = ref(3)
const controlCoverage = ref(91)
const coveredAreas = ref(12)

const taskData = computed(() => [
  { name: '已派发', value: `${taskDispatched.value} 单`, percentage: '100%', color: '#369561' },
  { name: '已完成', value: `${taskCompleted.value} 单`, percentage: `${(taskCompleted.value / taskDispatched.value * 100).toFixed(0)}%`, color: '#c45d32' },
  { name: '剩余未执行', value: `${taskRemaining.value} 单`, percentage: `${(taskRemaining.value / taskDispatched.value * 100).toFixed(0)}%`, color: '#e68a3a' }
])

// 药剂数据
const chemicalData = ref([
  { name: '矿物油', quantity: '32 L' },
  { name: '阿维菌素', quantity: '12 L' },
  { name: '苯醚甲环唑', quantity: '8 L' },
  { name: '吡虫啉', quantity: '5.5 L' }
])

const redSpiderChemicalPercent = ref(46)
const chemicalSummary = computed(() => chemicalData.value.map(c => `${c.name}${c.quantity}`).join(' · '))

// 反馈统计
const reductionRate = ref(78)
const removedTrees = ref(9)
const effectRate = ref(88)

const feedbackStats = computed(() => [
  { label: '红蜘蛛减退率', value: `${reductionRate.value}%` },
  { label: '黄龙病砍除株', value: removedTrees.value },
  { label: '天敌数量', value: `↑21%` }
])

// 热力图数据（保持静态）
const heatmapData = ref([
  { label: 'A1', class: 'pest-green', title: '健康' }, { label: 'A2', class: 'pest-green', title: '健康' },
  { label: 'A3', class: 'pest-red', title: '红蜘蛛' }, { label: 'A4', class: 'pest-red', title: '红蜘蛛' },
  { label: 'A5', class: 'pest-orange', title: '' }, { label: 'A6', class: 'pest-green', title: '健康' },
  { label: 'A7', class: 'pest-green', title: '健康' }, { label: 'A8', class: 'pest-yellow', title: '' },
  { label: 'B1', class: 'pest-green', title: '健康' }, { label: 'B2', class: 'pest-orange', title: '黄龙病' },
  { label: 'B3', class: 'pest-orange', title: '黄龙病' }, { label: 'B4', class: 'pest-red', title: '' },
  { label: 'B5', class: 'pest-green', title: '健康' }, { label: 'B6', class: 'pest-green', title: '健康' },
  { label: 'B7', class: 'pest-yellow', title: '' }, { label: 'B8', class: 'pest-yellow', title: '' },
  { label: 'C1', class: 'pest-green', title: '健康' }, { label: 'C2', class: 'pest-green', title: '健康' },
  { label: 'C3', class: 'pest-green', title: '健康' }, { label: 'C', class: 'pest-orange', title: '' },
  { label: 'C5', class: 'pest-orange', title: '' }, { label: 'C6', class: 'pest-red', title: '红蜘蛛' },
  { label: 'C7', class: 'pest-green', title: '健康' }, { label: 'C8', class: 'pest-green', title: '健康' },
  { label: 'D1', class: 'pest-red', title: '' }, { label: 'D', class: 'pest-red', title: '' },
  { label: 'D3', class: 'pest-yellow', title: '' }, { label: 'D4', class: 'pest-green', title: '健康' }
])

// 获取病虫害统计数据
const fetchDisasterCount = async () => {
  try {
    console.log('========== 开始获取病虫害统计数据 ==========')
    
    const apiPaths = ['/api/disaster/getDisasterCount', '/disaster/getDisasterCount']
    let response = null
    
    for (const path of apiPaths) {
      try {
        response = await axios.get(path, { params: { _t: Date.now() }, timeout: 10000 })
        if (response.status === 200 && response.data) {
          if (typeof response.data !== 'string' || !response.data.includes('<!DOCTYPE html>')) {
            break
          }
        }
      } catch (e) { continue }
    }
    
    if (response && response.data) {
      let disasterMap = null
      if (response.data.code === 200 && response.data.data) {
        disasterMap = response.data.data
      } else if (typeof response.data === 'object' && !response.data.code) {
        disasterMap = response.data
      }
      
      if (disasterMap) {
        redSpiderCount.value = disasterMap['红蜘蛛'] || 0
        huanglongbingCount.value = disasterMap['黄龙病'] || 0
        anthracnoseCount.value = disasterMap['炭疽病'] || 0
        aphidCount.value = disasterMap['蚜虫'] || 0
        cankerCount.value = disasterMap['溃疡病'] || 0
        
        // 更新 KPI 数据
        kpiData.value[0].value = totalDiseased.value
        kpiData.value[1].value = (huanglongbingCount.value + redSpiderCount.value)
        kpiData.value[1].trend = `黄龙病${huanglongbingCount.value}/红蜘蛛${redSpiderCount.value}`
        
        console.log('病虫害数据加载成功:', { redSpiderCount: redSpiderCount.value, huanglongbingCount: huanglongbingCount.value })
      }
    }
  } catch (error) {
    console.error('获取病虫害数据失败:', error)
    // 使用默认数据
    redSpiderCount.value = 35
    huanglongbingCount.value = 12
    anthracnoseCount.value = 21
    kpiData.value[0].value = totalDiseased.value
    kpiData.value[1].value = 47
    ElMessage.warning('病虫害数据加载失败，使用默认数据')
  }
}

// 获取任务统计数据
const fetchTaskStats = async () => {
  try {
    const apiPaths = ['/api/task/countByStatus', '/task/countByStatus']
    let response = null
    
    for (const path of apiPaths) {
      try {
        response = await axios.get(path, { params: { _t: Date.now() }, timeout: 10000 })
        if (response.status === 200 && response.data && (!response.data.includes || !response.data.includes('<!DOCTYPE html>'))) {
          break
        }
      } catch (e) { continue }
    }
    
    if (response && response.data) {
      let statsData = null
      if (response.data.code === 200 && response.data.data) {
        statsData = response.data.data
      } else if (typeof response.data === 'object' && !response.data.code) {
        statsData = response.data
      }
      
      if (statsData) {
        const pendingTasks = (statsData.pendingDispatchCount || 0) + (statsData.pendingExecuteCount || 0)
        const completedCount = statsData.completedCount || 0
        const completionRate = statsData.completionRate || 0
        
        taskDispatched.value = pendingTasks + completedCount
        taskCompleted.value = completedCount
        taskRemaining.value = pendingTasks
        kpiData.value[2].value = completionRate + '%'
        
        console.log('任务统计数据加载成功:', { pendingTasks, completedCount })
      }
    }
  } catch (error) {
    console.error('获取任务统计数据失败:', error)
  }
}

// 获取区域负责人信息
const getRegionInfo = () => {
  const region = route.query.region
  if (region && REGION_MANAGERS[region]) {
    regionManager.value = `${REGION_NAMES[region]}负责人 - ${REGION_MANAGERS[region]}`
  }
}

const goBack = () => router.back()

// 定时刷新
let refreshInterval = null

const startAutoRefresh = () => {
  refreshInterval = setInterval(() => {
    fetchDisasterCount()
    fetchTaskStats()
  }, 30000)
}

onMounted(() => {
  getRegionInfo()
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  
  Promise.all([fetchDisasterCount(), fetchTaskStats()])
  startAutoRefresh()
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
/* 样式保持不变，与原来完全一致 */
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; }
body { background: linear-gradient(145deg, #d1e6d1 0%, #bbd9c4 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
.pest-dashboard { max-width: 1440px; width: 100%; margin: 0 auto; background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(8px); border-radius: 56px; box-shadow: 0 40px 60px -20px #264d2e, 0 20px 30px -10px #1e3f28; padding: 32px 36px 40px 36px; border: 2px solid rgba(160, 200, 150, 0.6); }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 20px; }
.title-section { flex: 1; }
.title-with-back { display: flex; align-items: center; gap: 20px; margin-bottom: 8px; }
.back-btn { display: flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.9); border: 1px solid #60b282; color: #174d31; font-size: 1rem; font-weight: 500; padding: 10px 20px; border-radius: 40px; cursor: pointer; transition: all 0.2s ease; }
.back-btn:hover { background: #60b282; color: white; transform: translateX(-3px); }
.title-section h1 { font-size: 2.3rem; font-weight: 600; color: #174d31; display: flex; align-items: center; gap: 18px; }
.title-section h1 i { font-size: 2.8rem; color: #bf4f2e; background: #fef0e0; padding: 12px; border-radius: 50%; }
.role-tag { background: #c45d32; color: white; font-weight: 500; font-size: 1rem; padding: 8px 26px; border-radius: 60px; display: inline-block; margin-top: 6px; }
.update-time { background: #f2fcf2; border-radius: 100px; padding: 10px 26px; font-weight: 500; color: #216b40; border: 1px solid #abd8b8; font-size: 1rem; white-space: nowrap; }
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; margin-bottom: 30px; }
.kpi-card { background: white; border-radius: 32px; padding: 22px 20px; box-shadow: 0 12px 24px -12px #2c573b; border: 1px solid #c0e0cb; border-left: 8px solid #d97335; }
.kpi-card.pest2 { border-left-color: #c45d32; }
.kpi-card.pest3 { border-left-color: #e6a345; }
.kpi-card.pest4 { border-left-color: #aa4e2c; }
.kpi-label { font-size: 0.9rem; text-transform: uppercase; color: #3e6e4f; margin-bottom: 8px; display: flex; align-items: center; gap: 5px; }
.kpi-value { font-size: 2.2rem; font-weight: 800; color: #194f30; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.sub-value { font-size: 1rem; color: #558566; }
.trend-badge { background: #e6f3e6; border-radius: 40px; padding: 5px 14px; font-size: 0.8rem; font-weight: 600; color: #21663e; }
.two-col { display: grid; grid-template-columns: 1.5fr 1fr; gap: 26px; margin-bottom: 30px; }
.monitor-card { background: #f4fff8; border-radius: 38px; padding: 26px; border: 1px solid #c6e6d3; box-shadow: 0 12px 26px -16px #1c4e30; }
.section-title { font-size: 1.3rem; font-weight: 700; color: #1f5938; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.pest-tag-list { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
.pest-tag { background: white; border-radius: 60px; padding: 14px 24px; box-shadow: 0 4px 10px #aacbb8; display: flex; align-items: center; gap: 12px; flex: 1 0 auto; border-left: 6px solid; }
.pest-tag.red { border-left-color: #d14b4b; }
.pest-tag.orange { border-left-color: #e68a3a; }
.pest-tag.brown { border-left-color: #b0724a; }
.pest-tag .pest-name { font-weight: 700; font-size: 1.1rem; }
.pest-tag .pest-count { font-size: 1.8rem; font-weight: 800; color: #203d2b; margin-left: auto; }
.trap-card { background: #e3efe5; border-radius: 32px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; }
.trap-value { font-size: 2.3rem; font-weight: 800; color: #235f37; }
.heatmap-container { margin-top: 24px; }
.heatmap-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
.badge { background: #d9f0dd; padding: 4px 16px; border-radius: 40px; }
.heatmap-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; margin: 12px 0 10px; }
.plot-pest { aspect-ratio: 1/1; border-radius: 12px; background: #b1d3b5; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 600; color: #1d3d26; border: 1px solid #89b696; }
.pest-red { background: #cf5f4a; color: white; }
.pest-orange { background: #e09f5e; }
.pest-yellow { background: #edd188; }
.pest-green { background: #7fbf8f; }
.plot-label { display: flex; justify-content: space-between; background: #e4f4e9; padding: 12px 20px; border-radius: 40px; font-weight: 600; color: #1c613b; }
.click-hint { background: #ebcba0; padding: 4px 12px; border-radius: 30px; }
.right-panel { display: flex; flex-direction: column; gap: 24px; }
.task-card { background: white; border-radius: 36px; padding: 24px; border: 1px solid #cee6d8; }
.task-header { font-size: 1.2rem; font-weight: 700; color: #174f30; }
.task-progress { margin: 16px 0; }
.progress-item { display: flex; justify-content: space-between; margin: 12px 0; }
.bar-bg { width: 60%; height: 14px; background: #deefdf; border-radius: 40px; }
.bar-fill { height: 14px; border-radius: 40px; }
.coverage-badge { background: #eff9f0; border-radius: 30px; padding: 12px; margin-top: 10px; }
.chemical-card { background: #f5fcf5; border-radius: 30px; padding: 20px; }
.chemical-title { font-size: 1.2rem; font-weight: 700; margin-bottom: 12px; }
.chemical-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #b0d1bb; padding: 12px 0; }
.chemical-name { font-weight: 600; color: #204f32; }
.chemical-quantity { font-weight: 700; color: #194d2e; }
.chemical-footer { margin-top: 12px; }
.feedback-card { background: #e8f3e8; border-radius: 30px; padding: 22px; border-left: 8px solid #63a37b; }
.feedback-title { font-size: 1.2rem; font-weight: 700; display: flex; gap: 10px; }
.feedback-stats { display: flex; gap: 30px; margin-top: 18px; flex-wrap: wrap; }
.feedback-value { font-size: 2rem; font-weight: 800; color: #1c683e; }
.stat-item { text-align: center; }
.feedback-footer { margin-top: 16px; background: #cfeede; border-radius: 30px; padding: 10px 16px; }
.drill-footer { margin-top: 24px; background: #e4f2e4; border-radius: 60px; padding: 16px 26px; display: flex; gap: 30px; color: #1a633b; border: 1px solid #9fcfb1; }
.micro-data { margin-top: 18px; font-size: 0.75rem; color: #397d56; border-top: 1px dashed #a8d5b5; padding-top: 12px; display: flex; gap: 30px; flex-wrap: wrap; }
@media (max-width: 1200px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } .two-col { grid-template-columns: 1fr; } .title-with-back { flex-direction: column; align-items: flex-start; } }
@media (max-width: 768px) { .kpi-row { grid-template-columns: 1fr; } .header { flex-direction: column; align-items: flex-start; } .update-time { align-self: flex-start; } }
</style>