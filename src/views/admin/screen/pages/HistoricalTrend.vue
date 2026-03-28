<!-- HistoricalTrend.vue - 历史数据趋势分析大屏（带返回功能） -->
<template>
  <div class="trend-dashboard">
    <!-- 头部 - 添加返回按钮 -->
    <div class="header">
      <div class="title-section">
        <div class="title-with-back">
          <button class="back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i> 返回
          </button>
          <h1>
            <i class="fas fa-chart-line"></i> 历史数据趋势分析
          </h1>
        </div>
        <div class="role-tag">
          <i class="fas fa-user-cog"></i> {{ regionManager }}
        </div>
      </div>
      <div class="update-time">
        <i class="fas fa-calendar-alt"></i> 数据统计周期：{{ currentYear }}年 1 月 -3 月
      </div>
    </div>

    <!-- KPI 行 -->
    <div class="kpi-row">
      <div v-for="(kpi, index) in kpiData" :key="index" class="kpi-card" :class="'kpi' + (index + 1)">
        <div class="kpi-label"><i :class="kpi.icon"></i> {{ kpi.label }}</div>
        <div class="kpi-value">{{ kpi.value }} <span style="font-size:1rem;">{{ kpi.unit }}</span></div>
        <div class="trend-badge">{{ kpi.trend }}</div>
      </div>
    </div>

    <!-- 两列核心区 -->
    <div class="two-col">
      <!-- 左侧大列：NDVI 长期趋势 + 健康株占比趋势 -->
      <div>
        <!-- NDVI 长期趋势 -->
        <div class="card">
          <div class="section-title"><i class="fas fa-chart-line"></i> NDVI 趋势 · {{ currentYear }}年 1 月 -3 月变化</div>
          <div class="line-chart">
            <div class="chart-grid">
              <!-- Y 轴刻度 -->
              <div class="y-axis">
                <span class="y-label">0.80</span>
                <span class="y-label">0.75</span>
                <span class="y-label">0.70</span>
                <span class="y-label">0.65</span>
                <span class="y-label">0.60</span>
              </div>
              
              <!-- 网格线 -->
              <div class="grid-lines">
                <div class="grid-line"></div>
                <div class="grid-line"></div>
                <div class="grid-line"></div>
                <div class="grid-line"></div>
                <div class="grid-line"></div>
              </div>
              
              <!-- 折线图内容 -->
              <svg class="line-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
                <!-- 渐变填充 -->
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#4794b3;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#4794b3;stop-opacity:0" />
                  </linearGradient>
                </defs>
                
                <!-- 填充区域 -->
                <polygon 
                  :points="`0,200 ${linePoints} 400,200`" 
                  fill="url(#lineGradient)"
                />
                
                <!-- 折线 -->
                <polyline 
                  :points="linePoints" 
                  fill="none" 
                  stroke="#4794b3" 
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                
                <!-- 数据点 -->
                <circle v-for="(point, index) in lineDataPoints" :key="index"
                  :cx="point.x" 
                  :cy="point.y" 
                  r="6" 
                  fill="#4794b3"
                  stroke="white"
                  stroke-width="2"
                />
                
                <!-- 数据标签 -->
                <text v-for="(point, index) in lineDataPoints" :key="index"
                  :x="point.x" 
                  :y="point.y - 15" 
                  text-anchor="middle"
                  fill="#1f6d40"
                  font-size="14"
                  font-weight="bold"
                >
                  {{ ndviValues[index] }}
                </text>
              </svg>
            </div>
            <div class="month-label">1月&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2 月&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3 月</div>
            <div class="legend-line">
              <span><span class="legend-dot" style="background:#4794b3;"></span> {{ currentYear }} NDVI</span>
              <span>📈 较年初提升 +0.05</span>
            </div>
          </div>
          <div class="ndvi-hint">
            <i class="fas fa-map-marker-alt"></i> 地块 C7 NDVI 增幅最大 (+0.11) · 点击钻取详情
          </div>
        </div>

        <!-- 健康株占比趋势 -->
        <div class="card">
          <div class="section-title"><i class="fas fa-chart-area"></i> 健康株占比趋势 (堆叠面积) · 预测</div>
          <div class="stacked-area">
            <div class="year-labels">
              <span>1 月</span><span>2 月</span><span>3 月</span><span>4 月 (预测)</span>
            </div>
            <div v-for="(year, index) in healthData" :key="index" class="area-row">
              <div class="area-segment healthy" :style="{ width: year.healthy + '%' }">健康{{ year.healthy }}%</div>
              <div class="area-segment subhealthy" :style="{ width: year.subhealthy + '%' }">亚{{ year.subhealthy }}%</div>
              <div class="area-segment abnormal" :style="{ width: year.abnormal + '%' }">异{{ year.abnormal }}%</div>
            </div>
            <div class="trend-prediction">
              📊 趋势预测：4 月健康株占比预计 95.5%
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧列：产量品质相关 + 异常株时序 -->
      <div>
        <!-- 产量/品质趋势卡片 -->
        <div class="metrics-card">
          <div class="section-title"><i class="fas fa-chart-bar"></i> 产量 & 品质趋势</div>
          <div v-for="(item, index) in qualityData" :key="index" class="metric-item">
            <span>{{ item.label }}</span> <span v-html="item.value"></span>
          </div>
          <div class="scatter-mock">
            <div class="dot-group"><span class="scatter-dot"></span><span>1 月</span></div>
            <div class="dot-group"><span class="scatter-dot" style="background:#e09f3e;"></span><span>3 月</span></div>
            <span>果径分布↗️</span>
          </div>
        </div>

        <!-- 异常株时序 -->
        <div class="metrics-card">
          <div class="section-title"><i class="fas fa-bug"></i> 异常株时序 · 病虫害周期</div>
          <div class="abnormal-timeline">
            <div v-for="(item, index) in abnormalData" :key="index" class="timeline-item">
              <span style="font-weight:800;">{{ item.count }}</span><br>{{ item.label }}
            </div>
          </div>
          <div class="abnormal-badges">
            <span class="trend-badge">红蜘蛛周期减弱 ↓62%</span>
            <span class="trend-badge">黄龙病新发 3 例</span>
          </div>
          <div class="trend-indicator">
            <span>📉 异常株下降趋势明显</span> <i class="fas fa-arrow-down" style="color:#cf5f4a;"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部联动 -->
    <div class="drill-footer">
      <span><i class="fas fa-link"></i> 跨屏联动：点击图表点可钻取至病虫害/水肥历史明细</span>
      <span><i class="fas fa-clock"></i> 数据统计周期：{{ currentYear }}年 1 月 -3 月 · 历史趋势数据每日 02:00 更新</span>
    </div>

    <!-- 微型数据清单 -->
    <div class="micro-data">
      <span>🌿 NDVI 1 月：0.68 → 3 月：0.73 (+0.05)</span>
      <span>📊 健康占比 91% → 94% (健康/亚/异常)</span>
      <span>🍎 单果重 +7% · 糖度 13.2°Bx</span>
      <span>📉 异常株峰值 107 → 当前 62</span>
      <span>📈 趋势预测 4 月 95.5%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 区域负责人（直接设置示例数据）
const regionManager = ref('汤村负责人- 张齐')

// 获取当前年份
const today = new Date()
const currentYear = today.getFullYear()

// 返回上一页功能
const goBack = () => {
  router.back()
}

// KPI 数据
const kpiData = ref([
  { icon: 'fas fa-leaf', label: `NDVI (3 月)`, value: '0.73', unit: `vs 1 月 0.68`, trend: '+0.05 提升' },
  { icon: 'fas fa-heartbeat', label: '健康株占比', value: '94.2%', unit: `vs 1 月 91%`, trend: '+3.2%' },
  { icon: 'fas fa-apple-alt', label: '平均糖度', value: '13.2', unit: '°Bx', trend: '+0.7 °Bx' },
  { icon: 'fas fa-exclamation-triangle', label: '异常株峰值', value: '107', unit: '株 (1 月)', trend: '↓ 42% 较峰值' }
])

// 月份数据 - 只有 1-3 月
const months = ref([
  { heightCurrent: 88 },   // 1 月
  { heightCurrent: 108 },  // 2 月
  { heightCurrent: 132 }   // 3 月
])

// NDVI 数值（用于显示）
const ndviValues = ref(['0.68', '0.71', '0.73'])

// 计算折线图数据点
const lineDataPoints = computed(() => {
  const padding = 40 // 左右边距
  const chartWidth = 320 // 图表宽度
  const chartHeight = 180 // 图表高度
  const pointSpacing = chartWidth / (months.value.length - 1)
  
  // NDVI 值映射到 Y 坐标 (NDVI 范围 0.60-0.80)
  const mapToY = (value) => {
    const minNdvi = 0.60
    const maxNdvi = 0.80
    const normalized = (parseFloat(value) - minNdvi) / (maxNdvi - minNdvi)
    return chartHeight - (normalized * chartHeight)
  }
  
  return months.value.map((_, index) => ({
    x: padding + (index * pointSpacing),
    y: mapToY(ndviValues.value[index])
  }))
})

// 生成 SVG 折线点字符串
const linePoints = computed(() => {
  return lineDataPoints.value.map(point => `${point.x},${point.y}`).join(' ')
})

// 健康数据 - 月份顺序：1 月，2 月，3 月，4 月 (预测)
const healthData = ref([
  { healthy: 91, subhealthy: 6, abnormal: 3 },    // 1 月
  { healthy: 92.5, subhealthy: 5, abnormal: 2.5 }, // 2 月
  { healthy: 94, subhealthy: 4, abnormal: 2 },     // 3 月
  { healthy: 95.5, subhealthy: 3, abnormal: 1.5 }  // 4 月预测
])

// 品质数据
const qualityData = ref([
  { label: '🍎 单果重趋势', value: '1 月：221g → 3 月：236g <span style="color:#308a59;">(+7%)</span>' },
  { label: '🍬 糖度趋势', value: '1 月：12.5 → 3 月：13.2 °Bx' },
  { label: '📦 商品果率', value: '1 月：88% → 3 月：92%' },
  { label: '🌿 叶绿素含量', value: '1 月：38.8 → 3 月：42 SPAD (+3.2)' }
])

// 异常数据 - 显示当月最可能发生病虫害的日期
const abnormalData = ref([
  { label: '1 月 15-20 日\n炭疽病高发期', count: 107 },
  { label: '2 月 10-15 日\n红蜘蛛活跃期', count: 62 },
  { label: '3 月 5-12 日\n蚜虫爆发期', count: 48 }
])
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

body {
  background: linear-gradient(145deg, #c2d9c0 0%, #adc9b5 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.trend-dashboard {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 56px;
  box-shadow: 0 40px 60px -20px #1f4f32, 0 20px 30px -10px #1b4029;
  padding: 32px 36px 40px 36px;
  border: 2px solid rgba(100, 170, 130, 0.6);
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
  color: #1d5433;
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
  color: #1d5433;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 18px;
}

.title-section h1 i {
  font-size: 2.8rem;
  color: #4f7aa6;
  background: #e2edf9;
  padding: 12px;
  border-radius: 50%;
  box-shadow: 0 4px 12px #96b1cf;
}

.role-tag {
  background: #4a6f8c;
  color: white;
  font-weight: 500;
  font-size: 1rem;
  padding: 8px 26px;
  border-radius: 60px;
  display: inline-block;
  margin-top: 6px;
  box-shadow: 0 6px 14px #65809c;
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
  margin-bottom: 32px;
}

.kpi-card {
  background: white;
  border-radius: 32px;
  padding: 22px 20px;
  box-shadow: 0 12px 20px -12px #2b5e3d;
  border: 1px solid #bfe0cd;
  border-bottom: 8px solid;
}
.kpi1 { border-bottom-color: #4794b3; }
.kpi2 { border-bottom-color: #369561; }
.kpi3 { border-bottom-color: #e09f3e; }
.kpi4 { border-bottom-color: #b58f5a; }

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
  gap: 10px;
}
.trend-badge {
  background: #e7f5ea;
  border-radius: 40px;
  padding: 4px 16px;
  font-size: 0.8rem;
}

.two-col {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 26px;
  margin-bottom: 32px;
}

.card {
  background: white;
  border-radius: 38px;
  padding: 26px;
  border: 1px solid #c2e6d5;
  box-shadow: 0 12px 24px -16px #255a39;
  margin-bottom: 22px;
}
.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #175a34;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.line-chart {
  background: #f0f9f2;
  border-radius: 42px;
  padding: 28px 20px;
  position: relative;
}

.chart-grid {
  position: relative;
  height: 200px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

/* Y 轴样式 */
.y-axis {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 45px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 8px;
  z-index: 2;
}

.y-label {
  font-size: 0.75rem;
  color: #6b8e7a;
  text-align: right;
  font-weight: 600;
}

/* 网格线样式 */
.grid-lines {
  position: absolute;
  left: 45px;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.grid-line {
  height: 1px;
  background: linear-gradient(to right, rgba(107, 142, 122, 0.3), rgba(107, 142, 122, 0.1));
  margin-left: 10px;
}

/* SVG 折线图样式 */
.line-svg {
  position: absolute;
  left: 45px;
  right: 20px;
  top: 10px;
  bottom: 10px;
  width: calc(100% - 65px);
  height: calc(100% - 20px);
  overflow: visible;
}

/* 动画效果 */
.line-svg polyline {
  animation: drawLine 1.5s ease-out;
}

/* .line-svg circle {
  animation: pulseDot 2s ease-in-out infinite;
} */

@keyframes drawLine {
  from {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dasharray: 1000;
    stroke-dashoffset: 0;
  }
}

/* @keyframes pulseDot {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
} */

.month-label {
  text-align: center;
  margin-top: 8px;
  font-weight: 600;
  color: #1f6d40;
}

.legend-line {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-top: 16px;
}

.legend-dot {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  margin-right: 6px;
}

.ndvi-hint {
  margin-top: 16px;
  background: #e6f3ea;
  border-radius: 40px;
  padding: 12px 20px;
}

.stacked-area {
  background: #e9f3ec;
  border-radius: 40px;
  padding: 24px;
  margin-top: 18px;
}
.year-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.area-row {
  display: flex;
  align-items: center;
  height: 50px;
  background: #c2e0cd;
  border-radius: 40px;
  margin: 8px 0;
  overflow: hidden;
}
.area-segment {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 3px black;
}
.healthy { background: #369561; }
.subhealthy { background: #e09f3e; }
.abnormal { background: #cf5f4a; }
.trend-prediction {
  margin-top: 16px;
  background: #d7eedf;
  border-radius: 30px;
  padding: 8px 16px;
  text-align: center;
}

.metrics-card {
  background: white;
  border-radius: 34px;
  padding: 24px;
  border: 1px solid #c6e3d4;
  margin-bottom: 22px;
}
.metric-item {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed #b8dac6;
  padding: 14px 0;
  font-size: 1.1rem;
}
.scatter-mock {
  background: #f2faf2;
  border-radius: 32px;
  padding: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  justify-content: center;
  margin-top: 12px;
}
.dot-group {
  display: flex;
  gap: 6px;
  align-items: center;
}
.scatter-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #3f9d6b;
  opacity: 0.7;
}

.abnormal-timeline {
  display: flex;
  justify-content: space-between;
  background: #f0f9f0;
  border-radius: 40px;
  padding: 20px;
}
.timeline-item {
  text-align: center;
  font-size: 0.9rem;
  line-height: 1.6;
}
.abnormal-badges {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
.trend-indicator {
  height: 40px;
  background: #daeede;
  border-radius: 30px;
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 12px;
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