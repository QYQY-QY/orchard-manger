<!-- TrendAnalysis.vue - 历史数据趋势分析大屏（带返回功能） -->
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
          <i class="fas fa-user-cog"></i> 技术人员 · 数据分析师 · 长期对比/效果评估
        </div>
      </div>
      <div class="update-time">
        <i class="fas fa-calendar-alt"></i> 数据截至 2025-Q1 · 每日更新
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
      <!-- 左侧大列: NDVI长期趋势 + 健康株占比趋势 -->
      <div>
        <!-- NDVI长期趋势 -->
        <div class="card">
          <div class="section-title"><i class="fas fa-chart-line"></i> NDVI长期趋势 · 月度/季度变化 (2024-2025对比)</div>
          <div class="line-chart">
            <div class="chart-grid">
              <div v-for="(month, index) in months" :key="index" class="month-group">
                <div class="bar2025" :style="{ height: month.height2025 + 'px' }"></div>
                <div class="bar2024" :style="{ height: month.height2024 + 'px' }"></div>
              </div>
            </div>
            <div class="month-label">1月  2月  3月  4月  5月  6月</div>
            <div class="legend-line">
              <span><span class="legend-dot" style="background:#4794b3;"></span> 2025 NDVI</span>
              <span><span class="legend-dot" style="background:#b0c9b5;"></span> 2024 NDVI</span>
              <span>📈 2025较2024平均提升 +0.05</span>
            </div>
          </div>
          <div class="ndvi-hint">
            <i class="fas fa-map-marker-alt"></i> 地块C7 NDVI增幅最大 (+0.11) · 点击钻取详情
          </div>
        </div>

        <!-- 健康株占比趋势 -->
        <div class="card">
          <div class="section-title"><i class="fas fa-chart-area"></i> 健康株占比趋势 (堆叠面积) · 预测</div>
          <div class="stacked-area">
            <div class="year-labels">
              <span>2023</span><span>2024</span><span>2025</span><span>2026(预测)</span>
            </div>
            <div v-for="(year, index) in healthData" :key="index" class="area-row">
              <div class="area-segment healthy" :style="{ width: year.healthy + '%' }">健康{{ year.healthy }}%</div>
              <div class="area-segment subhealthy" :style="{ width: year.subhealthy + '%' }">亚{{ year.subhealthy }}%</div>
              <div class="area-segment abnormal" :style="{ width: year.abnormal + '%' }">异{{ year.abnormal }}%</div>
            </div>
            <div class="trend-prediction">
              📊 趋势预测: 2025 Q3 健康株占比预计 95.5%
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧列: 产量品质相关 + 异常株时序 + 年度对比 -->
      <div>
        <!-- 产量/品质趋势卡片 -->
        <div class="metrics-card">
          <div class="section-title"><i class="fas fa-chart-bar"></i> 产量 & 品质趋势</div>
          <div v-for="(item, index) in qualityData" :key="index" class="metric-item">
            <span>{{ item.label }}</span> <span v-html="item.value"></span>
          </div>
          <div class="scatter-mock">
            <div class="dot-group"><span class="scatter-dot"></span><span>2024</span></div>
            <div class="dot-group"><span class="scatter-dot" style="background:#e09f3e;"></span><span>2025</span></div>
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
            <span class="trend-badge">黄龙病新发 3例</span>
          </div>
          <div class="trend-indicator">
            <span>📉 异常株下降趋势明显</span> <i class="fas fa-arrow-down" style="color:#cf5f4a;"></i>
          </div>
        </div>

        <!-- 年度对比卡片 -->
        <div class="metrics-card">
          <div class="section-title"><i class="fas fa-calendar-alt"></i> 年度对比</div>
          <div class="year-compact">
            <div v-for="(item, index) in yearCompareData" :key="index" class="compare-item">
              <span style="font-weight:800;">{{ item.label }}</span><br>
              <span>2024: {{ item.year2024 }}</span><br>
              <span>2025: {{ item.year2025 }}</span>
            </div>
          </div>
          <div class="compare-footer">
            <i class="fas fa-check-circle" style="color:#308a59;"></i> 综合管理效果提升显著
          </div>
        </div>
      </div>
    </div>

    <!-- 底部联动 -->
    <div class="drill-footer">
      <span><i class="fas fa-link"></i> 跨屏联动: 点击图表点可钻取至病虫害/水肥历史明细</span>
      <span><i class="fas fa-clock"></i> 历史趋势数据每日02:00更新 · 长期存储</span>
    </div>

    <!-- 微型数据清单 -->
    <div class="micro-data">
      <span>🌿 NDVI 2025: 0.73 ( +0.05 )</span>
      <span>📊 健康占比 94.2% (堆叠面积: 健康/亚/异常)</span>
      <span>🍎 单果重 +7% · 糖度 13.2°Bx</span>
      <span>📉 异常株峰值107 → 当前62</span>
      <span>📆 年度对比: NDVI 0.68→0.73, 健康度88%→94%</span>
      <span>📈 趋势预测 Q3 95.5%</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 返回上一页功能
const goBack = () => {
  router.back()
}

// KPI数据
const kpiData = ref([
  { icon: 'fas fa-leaf', label: 'NDVI (2025 Q1)', value: '0.73', unit: 'vs 0.68', trend: '+0.05 同比' },
  { icon: 'fas fa-heartbeat', label: '健康株占比', value: '94.2%', unit: 'vs 88%', trend: '+6.2%' },
  { icon: 'fas fa-apple-alt', label: '平均糖度', value: '13.2', unit: '°Bx', trend: '+0.7 °Bx' },
  { icon: 'fas fa-exclamation-triangle', label: '异常株峰值', value: '107', unit: '株 (3月)', trend: '↓ 42% 较峰值' }
])

// 月份数据
const months = ref([
  { height2025: 102, height2024: 88 },
  { height2025: 108, height2024: 92 },
  { height2025: 118, height2024: 98 },
  { height2025: 124, height2024: 104 },
  { height2025: 132, height2024: 110 },
  { height2025: 128, height2024: 108 }
])

// 健康数据
const healthData = ref([
  { healthy: 78, subhealthy: 15, abnormal: 7 },
  { healthy: 84, subhealthy: 11, abnormal: 5 },
  { healthy: 91, subhealthy: 6, abnormal: 3 },
  { healthy: 94, subhealthy: 4, abnormal: 2 }
])

// 品质数据
const qualityData = ref([
  { label: '🍎 单果重年均', value: '236g <span style="color:#308a59;">(+7%)</span>' },
  { label: '🍬 糖度趋势', value: '12.5 → 13.2 °Bx' },
  { label: '📦 商品果率', value: '88% → 92%' },
  { label: '🌿 叶绿素含量', value: '42 SPAD (+3.2)' }
])

// 异常数据
const abnormalData = ref([
  { label: '3月峰值', count: 107 },
  { label: '4月', count: 62 },
  { label: '5月', count: 48 },
  { label: '6月(至今)', count: 41 }
])

// 年度对比数据
const yearCompareData = ref([
  { label: 'NDVI', year2024: '0.68', year2025: '0.73' },
  { label: '健康度', year2024: '88%', year2025: '94%' },
  { label: '异常株', year2024: '142', year2025: '87' }
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
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 180px;
  margin-bottom: 12px;
}
.month-group {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  width: 60px;
  justify-content: center;
}
.bar2025 {
  width: 20px;
  background: #4794b3;
  border-radius: 12px 12px 6px 6px;
}
.bar2024 {
  width: 20px;
  background: #b0c9b5;
  border-radius: 12px 12px 6px 6px;
}
.month-label {
  text-align: center;
  margin-top: 8px;
  font-weight: 600;
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

.year-compact {
  background: #f2fcf5;
  border-radius: 32px;
  padding: 18px;
  display: flex;
  gap: 20px;
  justify-content: space-around;
}
.compare-item {
  text-align: center;
}
.compare-footer {
  background: #e2f1e6;
  border-radius: 40px;
  padding: 12px;
  margin-top: 16px;
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