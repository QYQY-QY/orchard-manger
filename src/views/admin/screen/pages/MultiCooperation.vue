<!-- MultiCooperation.vue - 多端协同与溯源管理大屏（带返回功能） -->
<template>
  <div class="trace-dashboard">
    <!-- 头部角色 - 添加返回按钮 -->
    <div class="header">
      <div class="title-section">
        <div class="title-with-back">
          <button class="back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i> 返回
          </button>
          <h1>
            <i class="fas fa-handshake"></i> 多端协同与溯源管理
          </h1>
        </div>
        <div class="role-tag">
          <i class="fas fa-user-cog"></i> {{ regionManager }}
        </div>
      </div>
      <div class="update-time">
        <i class="fas fa-sync-alt"></i> 数据统计周期：{{ currentYear }}年{{ currentMonth }}月
      </div>
    </div>

    <!-- 第一行 KPI 卡片 - 动态数据 -->
    <div class="kpi-row">
      <div v-for="(kpi, index) in kpiData" :key="index" class="kpi-card" :class="kpi.cardClass">
        <div class="kpi-label"><i :class="kpi.icon"></i> {{ kpi.label }}</div>
        <div class="kpi-value">{{ kpi.value }} <span style="font-size:1rem;">{{ kpi.unit }}</span></div>
        <div class="trend-badge">{{ kpi.trend }}</div>
      </div>
    </div>

    <!-- 两列核心区 -->
    <div class="two-col">
      <!-- 左侧列: 多端访问统计 + 溯源信息轮播 + 用户反馈统计 -->
      <div>
        <!-- 多端访问统计 -->
        <div class="card">
          <div class="section-title"><i class="fas fa-chart-pie"></i> 多端访问统计 · 趋势</div>
          <div class="pie-container">
            <div class="pie-simple" :style="{ background: pieGradient }"></div>
            <div class="pie-labels">
              <div v-for="(item, index) in accessStats" :key="index" class="label-item">
                <span class="color-dot" :style="{ background: item.color }"></span> {{ item.label }}
              </div>
            </div>
          </div>
          <div class="trend-mini">
            <span><i class="fas fa-chart-line"></i> 近7日访问趋势</span>
            <div class="trend-bars">
              <span v-for="n in 5" :key="n" :class="'bar' + n"></span>
            </div>
            <span>↑{{ trendIncrease }}%</span>
          </div>
        </div>

        <!-- 溯源信息展示 (轮播卡片) -->
        <div class="trace-carousel">
          <div class="section-title"><i class="fas fa-rotate"></i> 溯源信息轮播 · 果品详情</div>
          <div class="trace-item">
            <div class="qr-sim"></div>
            <div class="trace-detail">
              <p><strong>🍊 果品 {{ currentFruitCode }}</strong> (单株编号: {{ currentTreeCode }})</p>
              <p>🌱 生长记录: {{ growthRecords }}</p>
              <p>🧪 检测报告: 农残未检出 · 糖度{{ sugarContent }}°Bx · {{ fruitGrade }}</p>
              <p style="color:#1f6e43;"><i class="fas fa-check-circle"></i> 溯源完整率{{ traceCompleteRate }}%</p>
            </div>
          </div>
          <div class="carousel-nav">
            <span>← 滑动查看更多 →</span>
          </div>
        </div>

        <!-- 用户反馈统计 -->
        <div class="card">
          <div class="section-title"><i class="fas fa-comment"></i> 用户反馈统计</div>
          <div class="feedback-pie">
            <div class="pie-small" :style="{ background: feedbackPieGradient }"></div>
            <div>
              <div v-for="(item, index) in feedbackStats" :key="index">🌱 {{ item.label }} {{ item.percentage }}</div>
            </div>
          </div>
          <div class="feedback-metrics">
            <span><i class="fas fa-check-circle" style="color:#308a59;"></i> 处理率 {{ feedbackProcessRate }}%</span>
            <span><i class="fas fa-star" style="color:#f5b342;"></i> 满意度 {{ satisfactionScore }} / 5</span>
            <span>📈 趋势 +{{ satisfactionTrend }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧列: 溯源数据概览 + 同步状态 + 溯源渠道分析 + 地域分布 -->
      <div>
        <!-- 数据同步状态卡片 -->
        <div class="right-card">
          <div class="section-title"><i class="fas fa-cloud-upload-alt"></i> 数据同步状态</div>
          <div class="sync-status">
            <span class="led-green"></span>
            <span style="font-weight:600;">多端同步成功率 {{ syncSuccessRate }}%</span>
            <span>最新同步 {{ currentTimeStr }}</span>
          </div>
          <div class="sync-details">
            <div v-for="(item, index) in syncData" :key="index" class="data-row">
              <span>{{ item.platform }}</span>
              <span>{{ item.status }} {{ currentTimeStr }}</span>
            </div>
            <div class="sync-warning">
              <i class="fas fa-exclamation-circle"></i> 异常同步记录: {{ syncErrorCount }} (最近24h)
            </div>
          </div>
        </div>

        <!-- 溯源渠道分析 + 用户地域分布 -->
        <div class="right-card">
          <div class="section-title"><i class="fas fa-chart-bar"></i> 溯源渠道 & 地域分析</div>
          <div class="channel-map">
            <div v-for="(item, index) in channelData" :key="index" class="channel-item">
              <span class="color-dot" :style="{ background: item.color }"></span> {{ item.label }}
            </div>
          </div>
          <div class="region-stats">
            <i class="fas fa-map-marker-alt"></i> 用户地域分布: 
            <strong v-for="(region, idx) in regionDistribution" :key="idx">
              {{ region.name }} {{ region.percentage }}%{{ idx < regionDistribution.length - 1 ? ' · ' : '' }}
            </strong>
          </div>
          <div class="hot-cities">
            <span>热门扫码城市: {{ hotCities.join('、') }}</span>
          </div>
        </div>

        <!-- 最新同步日志 -->
        <div class="log-card">
          <div class="section-title" style="font-size:1.1rem;"><i class="fas fa-history"></i> 最新同步日志 (更新于 {{ currentTimeStr }})</div>
          <div v-for="(log, index) in syncLogs" :key="index" :style="{ color: log.color }">{{ log.message }}</div>
        </div>
      </div>
    </div>

    <!-- 底部联动/更新频率说明 -->
    <div class="drill-footer">
      <span><i class="fas fa-link"></i> 跨屏联动: 点击溯源卡片可查看单株全生命周期数据</span>
      <span><i class="fas fa-clock"></i> 数据统计周期: {{ currentYear }}年{{ currentMonth }}月 · 同步状态每日更新</span>
    </div>

    <!-- 微型数据清单 -->
    <div class="micro-data">
      <span>📱 小程序{{ miniProgramPercent }}% APP{{ appPercent }}% PC{{ pcPercent }}% 大屏{{ screenPercent }}% 活跃{{ activeUsers }}</span>
      <span>📦 溯源码{{ traceCodeCount }} 扫码{{ scanCount }} 完整率{{ traceCompleteRate }}%</span>
      <span>🍊 溯源详情: {{ currentFruitCode }} (生长/农事/检测)</span>
      <span>💬 反馈{{ feedbackCount }}条 处理率{{ feedbackProcessRate }}% 满意度{{ satisfactionScore }}</span>
      <span>📡 同步成功率{{ syncSuccessRate }}% 最新{{ currentTimeStr }}</span>
      <span>📊 渠道: {{ channelSummary }}</span>
      <span>🌍 地域: {{ regionSummary }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

// 区域负责人映射
const REGION_MANAGERS = { 1: '张*齐', 2: '李*昀', 3: '王*钿' }
const REGION_NAMES = { 1: '汤村', 2: '莲村', 3: '桂村' }

const regionManager = ref('汤村负责人 : 张*齐')

// 获取当前日期时间
const today = new Date()
const currentYear = today.getFullYear()
const currentMonth = String(today.getMonth() + 1).padStart(2, '0')
const currentDay = String(today.getDate()).padStart(2, '0')
const currentHour = String(today.getHours()).padStart(2, '0')
const currentMinute = String(today.getMinutes()).padStart(2, '0')
const currentTimeStr = `${currentYear}-${currentMonth}-${currentDay} ${currentHour}:${currentMinute}`

// 动态数据
const traceCodeCount = ref(2340)
const scanCount = ref(1872)
const traceCompleteRate = ref(96)
const activeUsers = ref(187)
const feedbackCount = ref(23)
const feedbackProcessRate = ref(91)
const satisfactionScore = ref(4.6)
const satisfactionTrend = ref(0.2)
const syncSuccessRate = ref(99.8)
const syncErrorCount = ref(0)
const trendIncrease = ref(12)

// 多端访问统计
const miniProgramPercent = ref(46)
const appPercent = ref(28)
const pcPercent = ref(18)
const screenPercent = ref(8)

const accessStats = computed(() => [
  { label: `微信小程序 ${miniProgramPercent.value}%`, color: '#369561' },
  { label: `APP ${appPercent.value}%`, color: '#e09f3e' },
  { label: `PC管理端 ${pcPercent.value}%`, color: '#cf5f4a' },
  { label: `大屏端 ${screenPercent.value}%`, color: '#4794b3' }
])

const pieGradient = computed(() => {
  let start = 0
  const colors = [
    { color: '#369561', percent: miniProgramPercent.value },
    { color: '#e09f3e', percent: appPercent.value },
    { color: '#cf5f4a', percent: pcPercent.value },
    { color: '#4794b3', percent: screenPercent.value }
  ]
  const stops = colors.map(c => `${c.color} ${start}deg ${start + c.percent * 3.6}deg`).join(', ')
  return `conic-gradient(${stops})`
})

// KPI 数据
const kpiData = ref([
  { icon: 'fas fa-qrcode', label: '溯源码生成量', value: '2,340', unit: '个', trend: '+428 本周', cardClass: '' },
  { icon: 'fas fa-search', label: '扫码查询量', value: '1,872', unit: '次', trend: '占比 80%', cardClass: 'blue' },
  { icon: 'fas fa-check-circle', label: '溯源信息完整率', value: '96%', unit: '', trend: '+2% 较上月', cardClass: 'orange' },
  { icon: 'fas fa-users', label: '活跃用户数', value: '187', unit: '人', trend: '多端日活', cardClass: 'purple' }
])

// 溯源信息
const currentFruitCode = ref('A2-69')
const currentTreeCode = ref('YT-2341')
const growthRecords = ref(`${currentYear}-03-18 施肥 · ${currentYear}-03-25 修剪 · ${currentYear}-04-02 病虫害防控`)
const sugarContent = ref('13.1')
const fruitGrade = ref('一级果')

// 反馈统计
const feedbackStats = ref([
  { label: '农事咨询', percentage: '42%' },
  { label: '异常上报', percentage: '28%' },
  { label: '建议反馈', percentage: '18%' },
  { label: '操作问题', percentage: '12%' }
])

const feedbackPieGradient = computed(() => {
  return 'conic-gradient(#369561 0deg 151deg, #e09f3e 151deg 252deg, #cf5f4a 252deg 317deg, #b58f5a 317deg 360deg)'
})

// 同步数据
const syncData = ref([
  { platform: '微信小程序', status: '✅ 已同步' },
  { platform: 'APP端', status: '✅ 已同步' },
  { platform: 'PC管理端', status: '✅ 已同步' },
  { platform: '大屏端', status: '✅ 实时' }
])

// 渠道数据
const channelData = ref([
  { label: '电商扫码 54%', color: '#369561' },
  { label: '批发市场 22%', color: '#e09f3e' },
  { label: '门店/商超 24%', color: '#cf5f4a' }
])

const channelSummary = computed(() => channelData.value.map(c => c.label).join(' · '))

// 地域分布
const regionDistribution = ref([
  { name: '华南', percentage: 48 },
  { name: '华东', percentage: 26 },
  { name: '华北', percentage: 14 },
  { name: '其他', percentage: 12 }
])

const regionSummary = computed(() => regionDistribution.value.map(r => `${r.name}${r.percentage}%`).join(' · '))

const hotCities = ref(['广州', '深圳', '厦门', '上海'])

// 同步日志
const syncLogs = ref([
  { message: '全端同步成功 (增量23条)', color: 'inherit' },
  { message: 'APP端同步成功', color: 'inherit' },
  { message: '小程序端同步成功', color: 'inherit' },
  { message: 'PC端批次同步完成', color: 'inherit' },
  { message: '⚠️ 重试一次 · 已恢复', color: '#cf5f4a' }
])

// 获取任务统计数据（用于活跃用户等）
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
        console.log('任务统计数据加载成功:', { pendingTasks })
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

onMounted(() => {
  getRegionInfo()
  fetchTaskStats()
})
</script>

<style scoped>
/* 样式保持不变，与原来完全一致 */
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; }
body { background: linear-gradient(145deg, #c9dbc9 0%, #b5d2be 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
.trace-dashboard { max-width: 1440px; width: 100%; margin: 0 auto; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px); border-radius: 56px; box-shadow: 0 40px 60px -20px #245a39, 0 20px 30px -10px #1b4029; padding: 32px 36px 40px 36px; border: 2px solid rgba(140, 190, 150, 0.6); }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 20px; }
.title-section { flex: 1; }
.title-with-back { display: flex; align-items: center; gap: 20px; margin-bottom: 8px; }
.back-btn { display: flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.9); border: 1px solid #60b282; color: #1d5433; font-size: 1rem; font-weight: 500; padding: 10px 20px; border-radius: 40px; cursor: pointer; transition: all 0.2s ease; }
.back-btn:hover { background: #60b282; color: white; transform: translateX(-3px); }
.title-section h1 { font-size: 2.3rem; font-weight: 600; color: #1d5433; display: flex; align-items: center; gap: 18px; }
.title-section h1 i { font-size: 2.8rem; color: #6f9c6d; background: #e4f5e4; padding: 12px; border-radius: 50%; }
.role-tag { background: #5f8b6f; color: white; font-weight: 500; font-size: 1rem; padding: 8px 26px; border-radius: 60px; display: inline-block; margin-top: 6px; }
.update-time { background: #effaf2; border-radius: 100px; padding: 10px 26px; font-weight: 500; color: #1f6d40; border: 1px solid #abd8b8; font-size: 1rem; white-space: nowrap; }
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; margin-bottom: 30px; }
.kpi-card { background: white; border-radius: 32px; padding: 22px 20px; box-shadow: 0 12px 20px -12px #2b5e3d; border: 1px solid #bfe0cd; border-bottom: 8px solid #7fbf8f; }
.kpi-card.blue { border-bottom-color: #4794b3; }
.kpi-card.orange { border-bottom-color: #e09f3e; }
.kpi-card.purple { border-bottom-color: #b58f8c; }
.kpi-label { font-size: 0.9rem; text-transform: uppercase; color: #3e6e4f; margin-bottom: 8px; }
.kpi-value { font-size: 2.2rem; font-weight: 800; color: #194f30; display: flex; align-items: baseline; gap: 10px; }
.trend-badge { background: #e7f5ea; border-radius: 40px; padding: 4px 16px; font-size: 0.8rem; }
.two-col { display: grid; grid-template-columns: 1.5fr 1fr; gap: 26px; margin-bottom: 32px; }
.card { background: white; border-radius: 38px; padding: 26px; border: 1px solid #c2e6d5; box-shadow: 0 12px 24px -16px #255a39; margin-bottom: 22px; }
.section-title { font-size: 1.3rem; font-weight: 700; color: #175a34; margin-bottom: 18px; display: flex; align-items: center; gap: 10px; }
.pie-container { display: flex; align-items: center; gap: 30px; background: #f0f9f0; border-radius: 48px; padding: 22px 26px; }
.pie-simple { width: 120px; height: 120px; border-radius: 50%; border: 5px solid white; box-shadow: 0 6px 16px #9cc0aa; }
.pie-labels { display: flex; flex-direction: column; gap: 8px; }
.label-item { display: flex; align-items: center; gap: 8px; }
.color-dot { width: 18px; height: 18px; border-radius: 6px; }
.trend-mini { background: #e1f0e4; border-radius: 40px; padding: 16px 20px; margin-top: 16px; display: flex; align-items: center; justify-content: space-between; }
.trend-bars { display: flex; gap: 12px; align-items: flex-end; height: 40px; }
.trend-bars span { width: 20px; background: #4794b3; border-radius: 8px 8px 4px 4px; }
.bar1 { height: 24px; } .bar2 { height: 36px; } .bar3 { height: 30px; } .bar4 { height: 42px; } .bar5 { height: 38px; }
.trace-carousel { background: #f6fff6; border-radius: 38px; padding: 22px; border: 1px solid #bde0cc; margin: 20px 0; }
.trace-item { background: #ecf9f0; border-radius: 32px; padding: 22px; display: flex; gap: 24px; align-items: center; border-left: 12px solid #4794b3; }
.qr-sim { width: 70px; height: 70px; background: #1e1e1e; background-image: linear-gradient(45deg, white 25%, transparent 25%), linear-gradient(-45deg, white 25%, transparent 25%); background-size: 20px 20px; border-radius: 16px; }
.trace-detail p { margin: 5px 0; font-weight: 500; }
.carousel-nav { display: flex; justify-content: center; gap: 20px; margin-top: 16px; }
.carousel-nav span { background: #d1efdb; padding: 6px 20px; border-radius: 40px; }
.feedback-pie { display: flex; gap: 24px; align-items: center; }
.pie-small { width: 100px; height: 100px; border-radius: 50%; }
.feedback-metrics { display: flex; justify-content: space-between; background: #e4f5e9; border-radius: 40px; padding: 14px 18px; margin-top: 16px; }
.right-card { background: white; border-radius: 34px; padding: 24px; border: 1px solid #c6e3d4; margin-bottom: 22px; }
.data-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #bddac8; padding: 14px 0; font-size: 1.1rem; }
.sync-status { display: flex; align-items: center; gap: 20px; background: #e9f5ec; border-radius: 60px; padding: 18px 24px; }
.led-green { width: 18px; height: 18px; background: #3fbb6f; border-radius: 50%; box-shadow: 0 0 12px #56dd89; }
.sync-details { margin-top: 16px; background: #f0f7f0; border-radius: 32px; padding: 16px; }
.sync-warning { color: #cf5f4a; background: #fff0e8; border-radius: 30px; padding: 8px; margin-top: 10px; }
.channel-map { background: #f1f9f2; border-radius: 36px; padding: 20px; display: flex; flex-wrap: wrap; gap: 24px; }
.channel-item { flex: 1 0 40%; display: flex; align-items: center; gap: 8px; }
.region-stats { background: #e5f2e8; border-radius: 36px; padding: 18px; margin-top: 12px; }
.hot-cities { margin-top: 14px; display: flex; gap: 8px; align-items: center; }
.log-card { background: #ecf6ef; border-radius: 34px; padding: 20px; }
.log-card > div { margin: 5px 0; }
.drill-footer { margin-top: 24px; background: #e3f3e6; border-radius: 60px; padding: 16px 28px; display: flex; justify-content: space-between; color: #165f36; border: 1px solid #a0cfb0; }
.micro-data { margin-top: 20px; font-size: 0.8rem; color: #2f704a; border-top: 1px dashed #a2cfb2; padding-top: 12px; display: flex; flex-wrap: wrap; gap: 24px; }
@media (max-width: 1200px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } .two-col { grid-template-columns: 1fr; } .title-with-back { flex-direction: column; align-items: flex-start; } }
@media (max-width: 768px) { .kpi-row { grid-template-columns: 1fr; } .header { flex-direction: column; align-items: flex-start; } .update-time { align-self: flex-start; } }
</style>