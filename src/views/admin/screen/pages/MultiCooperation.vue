<!-- TraceManagement.vue - 多端协同与溯源管理大屏（带返回功能） -->
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
          <i class="fas fa-qrcode"></i> 运营人员 · 溯源管理员 · 多端互通
        </div>
      </div>
      <div class="update-time">
        <i class="fas fa-sync-alt"></i> 最后同步: 2025-04-07 15:10 · 实时
      </div>
    </div>

    <!-- 第一行 KPI 卡片 -->
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
            <div class="pie-simple"></div>
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
            <span>↑12%</span>
          </div>
        </div>

        <!-- 溯源信息展示 (轮播卡片) -->
        <div class="trace-carousel">
          <div class="section-title"><i class="fas fa-rotate"></i> 溯源信息轮播 · 果品详情</div>
          <div class="trace-item">
            <div class="qr-sim"></div>
            <div class="trace-detail">
              <p><strong>🍊 果品 A2-69</strong> (单株编号: YT-2341)</p>
              <p>🌱 生长记录: 2025-03-18 施肥 · 2025-03-25 灌溉 · 2025-04-02 病虫害防控</p>
              <p>🧪 检测报告: 农残未检出 · 糖度13.1°Bx · 一级果</p>
              <p style="color:#1f6e43;"><i class="fas fa-check-circle"></i> 溯源完整率100%</p>
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
            <div class="pie-small"></div>
            <div>
              <div v-for="(item, index) in feedbackStats" :key="index">🌱 {{ item.label }} {{ item.percentage }}</div>
            </div>
          </div>
          <div class="feedback-metrics">
            <span><i class="fas fa-check-circle" style="color:#308a59;"></i> 处理率 91%</span>
            <span><i class="fas fa-star" style="color:#f5b342;"></i> 满意度 4.6 / 5</span>
            <span>📈 趋势 +0.2</span>
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
            <span style="font-weight:600;">多端同步成功率 99.8%</span>
            <span>最新同步 15:10</span>
          </div>
          <div class="sync-details">
            <div v-for="(item, index) in syncData" :key="index" class="data-row">
              <span>{{ item.platform }}</span>
              <span>{{ item.status }}</span>
            </div>
            <div class="sync-warning">
              <i class="fas fa-exclamation-circle"></i> 异常同步记录: 0 (最近24h)
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
            <i class="fas fa-map-marker-alt"></i> 用户地域分布: <strong>华南 48%</strong> · 华东 26% · 华北 14% · 其他 12%
          </div>
          <div class="hot-cities">
            <span>热门扫码城市: 广州、深圳、厦门、上海</span>
          </div>
        </div>

        <!-- 最新同步日志 -->
        <div class="log-card">
          <div class="section-title" style="font-size:1.1rem;"><i class="fas fa-history"></i> 最新同步日志</div>
          <div v-for="(log, index) in syncLogs" :key="index" :style="{ color: log.color }">{{ log.message }}</div>
        </div>
      </div>
    </div>

    <!-- 底部联动/更新频率说明 -->
    <div class="drill-footer">
      <span><i class="fas fa-link"></i> 跨屏联动: 点击溯源卡片可查看单株全生命周期数据</span>
      <span><i class="fas fa-clock"></i> 同步状态实时刷新 · 溯源信息每日更新</span>
    </div>

    <!-- 微型数据清单 -->
    <div class="micro-data">
      <span>📱 小程序46% APP28% PC18% 大屏8% 活跃187</span>
      <span>📦 溯源码2340 扫码1872 完整率96%</span>
      <span>🍊 溯源详情: A2-69 (生长/农事/检测)</span>
      <span>💬 反馈23条 处理率91% 满意度4.6</span>
      <span>📡 同步成功率99.8% 最新15:10</span>
      <span>📊 渠道: 电商54% 批发22% 门店24%</span>
      <span>🌍 地域: 华南48% 华东26%</span>
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
  { icon: 'fas fa-qrcode', label: '溯源码生成量', value: '2,340', unit: '个', trend: '+428 本周', cardClass: '' },
  { icon: 'fas fa-search', label: '扫码查询量', value: '1,872', unit: '次', trend: '占比 80%', cardClass: 'blue' },
  { icon: 'fas fa-check-circle', label: '溯源信息完整率', value: '96%', unit: '', trend: '+2% 较上月', cardClass: 'orange' },
  { icon: 'fas fa-users', label: '活跃用户数', value: '187', unit: '人', trend: '多端日活', cardClass: 'purple' }
])

// 访问统计
const accessStats = ref([
  { label: '微信小程序 46%', color: '#369561' },
  { label: 'APP 28%', color: '#e09f3e' },
  { label: 'PC管理端 18%', color: '#cf5f4a' },
  { label: '大屏端 8%', color: '#4794b3' }
])

// 反馈统计
const feedbackStats = ref([
  { label: '农事咨询', percentage: '42%' },
  { label: '异常上报', percentage: '28%' },
  { label: '建议反馈', percentage: '18%' },
  { label: '操作问题', percentage: '12%' }
])

// 同步数据
const syncData = ref([
  { platform: '微信小程序', status: '✅ 已同步 15:08' },
  { platform: 'APP端', status: '✅ 已同步 15:09' },
  { platform: 'PC管理端', status: '✅ 已同步 15:10' },
  { platform: '大屏端', status: '✅ 实时' }
])

// 渠道数据
const channelData = ref([
  { label: '电商扫码 54%', color: '#369561' },
  { label: '批发市场 22%', color: '#e09f3e' },
  { label: '门店/商超 24%', color: '#cf5f4a' },
  { label: '出口贸易 6%', color: '#4794b3' }
])

// 同步日志
const syncLogs = ref([
  { message: '15:10 全端同步成功 (增量23条)', color: 'inherit' },
  { message: '15:05 APP端同步成功', color: 'inherit' },
  { message: '14:58 小程序端同步成功', color: 'inherit' },
  { message: '14:45 PC端批次同步完成', color: 'inherit' },
  { message: '⚠️ 14:20 重试一次 · 已恢复', color: '#cf5f4a' }
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
  background: linear-gradient(145deg, #c9dbc9 0%, #b5d2be 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.trace-dashboard {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 56px;
  box-shadow: 0 40px 60px -20px #245a39, 0 20px 30px -10px #1b4029;
  padding: 32px 36px 40px 36px;
  border: 2px solid rgba(140, 190, 150, 0.6);
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
  color: #6f9c6d;
  background: #e4f5e4;
  padding: 12px;
  border-radius: 50%;
  box-shadow: 0 4px 12px #a1c7a1;
}

.role-tag {
  background: #5f8b6f;
  color: white;
  font-weight: 500;
  font-size: 1rem;
  padding: 8px 26px;
  border-radius: 60px;
  display: inline-block;
  margin-top: 6px;
  box-shadow: 0 6px 14px #6d9a7c;
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
  margin-bottom: 30px;
}

.kpi-card {
  background: white;
  border-radius: 32px;
  padding: 22px 20px;
  box-shadow: 0 12px 20px -12px #2b5e3d;
  border: 1px solid #bfe0cd;
  border-bottom: 8px solid #7fbf8f;
}
.kpi-card.blue { border-bottom-color: #4794b3; }
.kpi-card.orange { border-bottom-color: #e09f3e; }
.kpi-card.purple { border-bottom-color: #b58f8c; }

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
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pie-container {
  display: flex;
  align-items: center;
  gap: 30px;
  background: #f0f9f0;
  border-radius: 48px;
  padding: 22px 26px;
}
.pie-simple {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(#369561 0deg 166deg, #e09f3e 166deg 236deg, #cf5f4a 236deg 296deg, #4794b3 296deg 346deg, #b0b86b 346deg 360deg);
  border: 5px solid white;
  box-shadow: 0 6px 16px #9cc0aa;
}
.pie-labels {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.label-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.color-dot {
  width: 18px;
  height: 18px;
  border-radius: 6px;
}

.trend-mini {
  background: #e1f0e4;
  border-radius: 40px;
  padding: 16px 20px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.trend-bars {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  height: 40px;
}
.trend-bars span {
  width: 20px;
  background: #4794b3;
  border-radius: 8px 8px 4px 4px;
}
.bar1 { height: 24px; }
.bar2 { height: 36px; }
.bar3 { height: 30px; }
.bar4 { height: 42px; }
.bar5 { height: 38px; }

.trace-carousel {
  background: #f6fff6;
  border-radius: 38px;
  padding: 22px;
  border: 1px solid #bde0cc;
  margin: 20px 0;
}
.trace-item {
  background: #ecf9f0;
  border-radius: 32px;
  padding: 22px;
  display: flex;
  gap: 24px;
  align-items: center;
  border-left: 12px solid #4794b3;
}
.qr-sim {
  width: 70px;
  height: 70px;
  background: #1e1e1e;
  background-image: linear-gradient(45deg, white 25%, transparent 25%),
                    linear-gradient(-45deg, white 25%, transparent 25%);
  background-size: 20px 20px;
  border-radius: 16px;
}
.trace-detail p { margin: 5px 0; font-weight: 500; }
.carousel-nav {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 16px;
}
.carousel-nav span {
  background: #d1efdb;
  padding: 6px 20px;
  border-radius: 40px;
}

.feedback-pie {
  display: flex;
  gap: 24px;
  align-items: center;
}
.pie-small {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: conic-gradient(#369561 0 144deg, #e09f3e 144deg 252deg, #cf5f4a 252deg 324deg, #b58f5a 324deg 360deg);
}
.feedback-metrics {
  display: flex;
  justify-content: space-between;
  background: #e4f5e9;
  border-radius: 40px;
  padding: 14px 18px;
  margin-top: 16px;
}

.right-card {
  background: white;
  border-radius: 34px;
  padding: 24px;
  border: 1px solid #c6e3d4;
  margin-bottom: 22px;
}

.data-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed #bddac8;
  padding: 14px 0;
  font-size: 1.1rem;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 20px;
  background: #e9f5ec;
  border-radius: 60px;
  padding: 18px 24px;
}
.led-green {
  width: 18px;
  height: 18px;
  background: #3fbb6f;
  border-radius: 50%;
  box-shadow: 0 0 12px #56dd89;
}
.sync-details {
  margin-top: 16px;
  background: #f0f7f0;
  border-radius: 32px;
  padding: 16px;
}
.sync-warning {
  color: #cf5f4a;
  background: #fff0e8;
  border-radius: 30px;
  padding: 8px;
  margin-top: 10px;
}

.channel-map {
  background: #f1f9f2;
  border-radius: 36px;
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}
.channel-item {
  flex: 1 0 40%;
  display: flex;
  align-items: center;
  gap: 8px;
}
.region-stats {
  background: #e5f2e8;
  border-radius: 36px;
  padding: 18px;
  margin-top: 12px;
}
.hot-cities {
  margin-top: 14px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.log-card {
  background: #ecf6ef;
  border-radius: 34px;
  padding: 20px;
}
.log-card > div {
  margin: 5px 0;
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