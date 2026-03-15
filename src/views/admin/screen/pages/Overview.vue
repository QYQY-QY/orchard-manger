<!-- MacroOverview.vue - 果园宏观监控总览（带返回功能） -->
<template>
  <div class="macro-dashboard">
    <!-- 头部角色与时间 - 添加返回按钮 -->
    <div class="header">
      <div class="title-section">
        <div class="title-with-back">
          <button class="back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i> 返回
          </button>
          <h1>
            <i class="fas fa-leaf"></i> 果园宏观监控总览
          </h1>
        </div>
        <div class="role-tag">
          <i class="fas fa-user-tie"></i> 园区负责人 · 运营总监 · 全局态势
        </div>
      </div>
      <div class="time-weather">
        <i class="fas fa-sun"></i> 2025-04-07 10:28 晴 24℃ | 东南风2级
      </div>
    </div>

    <!-- KPI 核心卡片 -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label"><i class="fas fa-tree"></i> 果园总株数</div>
        <div class="kpi-value">12,850 <span class="sub-value">株</span></div>
        <div class="trend up"><i class="fas fa-arrow-up"></i> +2.1% 同比</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label"><i class="fas fa-qrcode"></i> 一树一码覆盖率</div>
        <div class="kpi-value">98.6%</div>
        <div class="trend up"><i class="fas fa-arrow-up"></i> +1.8%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label"><i class="fas fa-heartbeat"></i> 健康株占比</div>
        <div class="kpi-value">94.2%</div>
        <div class="trend up"><i class="fas fa-arrow-up"></i> +0.7%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label"><i class="fas fa-exclamation-triangle"></i> 实时异常株数</div>
        <div class="kpi-value">87 <span class="sub-value">株</span></div>
        <div class="trend down"><i class="fas fa-arrow-down"></i> -12 昨日</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label"><i class="fas fa-bell"></i> 当日预警数</div>
        <div class="kpi-value">23</div>
        <div class="trend up"><i class="fas fa-chart-line"></i> 周均0.7%</div>
      </div>
    </div>

    <!-- 核心主区域: 热力图 + 右侧预警/农事/设备 -->
    <div class="main-panel">
      <!-- 左侧：全园NDVI健康度可视化 -->
      <div class="heatmap-card">
        <div class="heatmap-header">
          <h3><i class="fas fa-map"></i> NDVI植被指数 · 健康度热力图</h3>
          <div class="legend">
            <span><span class="legend-color high"></span> 茂盛(>0.75)</span>
            <span><span class="legend-color mid"></span> 中等(0.5-0.75)</span>
            <span><span class="legend-color low"></span> 低值(<0.5)</span>
            <span><span class="legend-color" :style="{ background: '#cf5f4a' }"></span> 异常株</span>
          </div>
        </div>
        <!-- 模拟地块网格 -->
        <div class="orchard-map">
          <div v-for="n in 100" :key="n" class="plot-cell" :class="getNdviClass(n)">{{ getPlotLabel(n) }}</div>
        </div>
        <!-- 地块标注与钻取 -->
        <div class="plot-label">
          <span><i class="fas fa-map-pin"></i> 当前地块: 东区 A1~J10 (点击格子钻取详情)</span>
          <span class="drill-hint"><i class="fas fa-mouse-pointer"></i> 支持钻取至病虫害/水肥屏</span>
        </div>
        <div class="stats-row">
          <span>🌿 平均NDVI: 0.72</span>
          <span>📊 健康分区: 优78% · 良15% · 差7%</span>
        </div>
      </div>

      <!-- 右侧: 预警 + 农事 + 设备在线 -->
      <div class="right-stats">
        <!-- 实时预警卡片 -->
        <div class="alert-card">
          <div class="alert-header"><i class="fas fa-exclamation-circle"></i> 高危预警 · 待处理</div>
          <div class="alert-list">
            <div v-for="(alert, index) in alerts" :key="index" class="alert-item" :style="{ borderLeftColor: alert.color }">
              <span class="blink-dot" :style="{ background: alert.dotColor }"></span>
              <span style="font-weight:600;">{{ alert.title }}</span>
              <span>{{ alert.locations }}</span>
              <span class="alert-tag" :style="{ background: alert.tagColor }">{{ alert.level }}</span>
            </div>
          </div>
          <div class="alert-footer">
            <i class="fas fa-clock"></i> 待处理状态: 18株未处置 · 更新于10:25
          </div>
        </div>

        <!-- 核心农事概览 -->
        <div class="farm-progress">
          <div class="farm-title"><i class="fas fa-tractor"></i> 农事进度</div>
          <div v-for="(task, index) in farmTasks" :key="index" class="progress-item">
            <span>{{ task.name }}</span>
            <span>{{ task.progress }} ({{ task.completed }}/{{ task.total }})</span>
            <div class="bar-bg"><div class="bar-fill" :style="{ width: task.percentage + '%' }"></div></div>
          </div>
          <div class="progress-footer">
            <i class="fas fa-clipboard-check"></i> 异常株处理进度: 69株已完成 (79%)
          </div>
        </div>

        <!-- 设备在线状态 -->
        <div class="device-card">
          <div class="device-header">
            <i class="fas fa-wifi"></i>
            <span>物联网设备在线</span>
          </div>
          <div class="device-stats">
            <span><span class="online-led"></span>在线率 97.3%</span>
            <span><i class="fas fa-microchip"></i> 238/245</span>
          </div>
          <div class="device-stats">
            <span><i class="fas fa-database"></i> 最后采集: 10:28</span>
            <span><i class="fas fa-clock"></i> 延迟 2s</span>
          </div>
          <div class="device-footer">
            <i class="fas fa-check-circle"></i> 气象站 · 土壤墒情 · 虫情测报 均在运行
          </div>
        </div>
      </div>
    </div>

    <!-- 底部跨屏钻取联动提示 -->
    <div class="drill-footer">
      <span><i class="fas fa-bezier-curve"></i> 跨屏联动: 点击异常株/地块可钻取至病虫害专项 / 水肥决策大屏</span>
      <span class="footer-note"><i class="fas fa-sync-alt"></i> 实时预警每5分钟更新 · 数据同源</span>
    </div>

    <!-- 微标注 -->
    <div class="data-footer">
      <i class="fas fa-clipboard-list"></i> 数据依据: 总株12850 · 覆盖率98.6% · 健康94.2% · 异常87 · 预警23 · 周均0.7% · NDVI热力·预警闪烁·农事完成率·设备在线
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

// 预警数据
const alerts = ref([
  {
    title: '黄龙病疑似',
    locations: 'A5, C4, E7, H6 等12株',
    level: '高危',
    color: '#cc5f36',
    dotColor: '#e8604a',
    tagColor: '#ca623b'
  },
  {
    title: '红蜘蛛爆发',
    locations: 'B6, J3 等8株',
    level: '中危',
    color: '#e68a2e',
    dotColor: '#e68a2e',
    tagColor: '#ca8b3a'
  },
  {
    title: '缺水胁迫',
    locations: 'F2,G4 等3株',
    level: '轻微',
    color: '#e68a2e',
    dotColor: '#e68a2e',
    tagColor: '#3b8f5c'
  }
])

// 农事任务数据
const farmTasks = ref([
  { name: '灌溉任务', completed: 41, total: 50, progress: '82%', percentage: 82 },
  { name: '施肥任务', completed: 22, total: 35, progress: '63%', percentage: 63 },
  { name: '防控任务', completed: 17, total: 24, progress: '71%', percentage: 71 }
])

// NDVI颜色类
const ndviClasses = [
  'ndvi-high', 'ndvi-high', 'ndvi-high', 'ndvi-mid', 'ndvi-warning',
  'ndvi-high', 'ndvi-high', 'ndvi-mid', 'ndvi-mid', 'ndvi-high',
  'ndvi-high', 'ndvi-high', 'ndvi-mid', 'ndvi-mid', 'ndvi-mid',
  'ndvi-low', 'ndvi-high', 'ndvi-high', 'ndvi-high', 'ndvi-mid',
  'ndvi-high', 'ndvi-high', 'ndvi-high', 'ndvi-warning', 'ndvi-mid',
  'ndvi-mid', 'ndvi-low', 'ndvi-low', 'ndvi-mid', 'ndvi-high',
  'ndvi-mid', 'ndvi-mid', 'ndvi-high', 'ndvi-high', 'ndvi-high',
  'ndvi-high', 'ndvi-mid', 'ndvi-mid', 'ndvi-high', 'ndvi-high',
  'ndvi-high', 'ndvi-high', 'ndvi-high', 'ndvi-high', 'ndvi-mid',
  'ndvi-mid', 'ndvi-warning', 'ndvi-mid', 'ndvi-low', 'ndvi-low',
  'ndvi-high', 'ndvi-mid', 'ndvi-mid', 'ndvi-high', 'ndvi-high',
  'ndvi-high', 'ndvi-high', 'ndvi-high', 'ndvi-mid', 'ndvi-high',
  'ndvi-high', 'ndvi-high', 'ndvi-mid', 'ndvi-low', 'ndvi-low',
  'ndvi-mid', 'ndvi-high', 'ndvi-high', 'ndvi-high', 'ndvi-high',
  'ndvi-mid', 'ndvi-mid', 'ndvi-high', 'ndvi-high', 'ndvi-high',
  'ndvi-warning', 'ndvi-high', 'ndvi-high', 'ndvi-mid', 'ndvi-high',
  'ndvi-high', 'ndvi-high', 'ndvi-high', 'ndvi-mid', 'ndvi-mid',
  'ndvi-mid', 'ndvi-high', 'ndvi-high', 'ndvi-high', 'ndvi-high',
  'ndvi-mid', 'ndvi-mid', 'ndvi-low', 'ndvi-low', 'ndvi-mid',
  'ndvi-high', 'ndvi-high', 'ndvi-high', 'ndvi-high', 'ndvi-high'
]

// 获取NDVI类
const getNdviClass = (index) => {
  return ndviClasses[(index - 1) % ndviClasses.length] || 'ndvi-mid'
}

// 获取地块标签
const getPlotLabel = (index) => {
  const row = String.fromCharCode(65 + Math.floor((index - 1) / 10))
  const col = ((index - 1) % 10) + 1
  return `${row}${col}`
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

/* 确保整个页面内容居中 */
body {
  background: linear-gradient(145deg, #d4e9d4 0%, #c0dfc5 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.macro-dashboard {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto; /* 水平居中 */
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 56px;
  box-shadow: 0 40px 60px -20px #1f4d2e, 0 20px 30px -10px #00000030;
  padding: 32px 36px 40px 36px;
  border: 2px solid rgba(120, 180, 130, 0.5);
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
  color: #1a5837;
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
  font-size: 2.4rem;
  font-weight: 600;
  color: #1b4e33;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-section h1 i {
  font-size: 2.8rem;
  color: #328f55;
  background: #e2f7e2;
  padding: 12px;
  border-radius: 50%;
  box-shadow: 0 4px 10px #94c9a5;
}

.role-tag {
  background: #1c623c;
  color: white;
  font-weight: 500;
  font-size: 1rem;
  padding: 8px 24px;
  border-radius: 60px;
  display: inline-block;
  margin-top: 8px;
  box-shadow: 0 6px 14px #3f8d5e60;
}

.time-weather {
  background: #ecf9f0;
  border-radius: 100px;
  padding: 12px 30px;
  font-weight: 500;
  color: #1e6641;
  border: 1px solid #abd8b8;
  font-size: 1.1rem;
  white-space: nowrap;
}

.time-weather i {
  margin-right: 8px;
  color: #f5b342;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.kpi-card {
  background: white;
  border-radius: 32px;
  padding: 22px 18px;
  box-shadow: 0 12px 24px -12px #2b5b3d;
  border: 1px solid #b8e0c5;
  transition: all 0.2s;
}

.kpi-card:hover {
  transform: translateY(-6px);
  border-color: #60b282;
  box-shadow: 0 20px 28px -10px #21663e;
}

.kpi-label {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #487a5b;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.kpi-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1a5837;
  line-height: 1.1;
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.trend {
  font-size: 0.9rem;
  font-weight: 500;
  background: #e4f7e8;
  padding: 5px 12px;
  border-radius: 60px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.trend.up { color: #2f9e5a; }
.trend.down { color: #c95b3f; }

.sub-value {
  font-size: 1rem;
  font-weight: 400;
  color: #578b6c;
}

.main-panel {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 26px;
  margin-bottom: 32px;
}

.heatmap-card {
  background: #f6fff8;
  border-radius: 42px;
  padding: 24px;
  box-shadow: inset 0 2px 10px #ffffff, 0 12px 24px -16px #163f23;
  border: 1px solid #cae8d3;
}

.heatmap-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.heatmap-header h3 {
  font-size: 1.4rem;
  font-weight: 600;
  color: #195f36;
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend {
  display: flex;
  gap: 15px;
  font-size: 0.8rem;
  align-items: center;
  background: #e3f3e6;
  padding: 0 16px;
  border-radius: 40px;
}

.legend-color {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: #348c5c;
}

.legend-color.low { background: #d47b48; }
.legend-color.mid { background: #e9b35f; }
.legend-color.high { background: #359f6d; }

.orchard-map {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
  margin: 16px 0 10px;
}

.plot-cell {
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background: #8fc6a7;
  transition: 0.1s;
  border: 1px solid rgba(255,255,255,0.2);
  font-size: 0.55rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #002d16;
  font-weight: 600;
  text-shadow: 0 0 4px white;
}

.ndvi-high { background: #2b864e; }
.ndvi-mid { background: #b5c96b; }
.ndvi-low { background: #cb8b52; }
.ndvi-water { background: #4794b3; }
.ndvi-warning { background: #cf5f4a; }

.plot-label {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-weight: 600;
  color: #1f643e;
  background: #e6f5e9;
  padding: 14px 20px;
  border-radius: 50px;
  font-size: 0.9rem;
}

.drill-hint {
  color: #358354;
  font-size: 0.8rem;
  background: #daf1de;
  padding: 5px 15px;
  border-radius: 60px;
  cursor: default;
}

.stats-row {
  margin-top: 14px;
  font-size: 0.9rem;
  background: #eaf9ed;
  border-radius: 36px;
  padding: 10px 20px;
  display: flex;
  gap: 20px;
}

.right-stats {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.alert-card {
  background: #fff7ed;
  border-radius: 38px;
  padding: 22px 24px;
  border: 2px solid #f3c8a2;
  box-shadow: 0 12px 22px -12px #bc7643;
}

.alert-header {
  font-size: 1.2rem;
  font-weight: 700;
  color: #aa4d27;
  margin-bottom: 14px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #ffffffc2;
  padding: 12px 18px;
  border-radius: 80px;
  border-left: 6px solid;
}

.alert-tag {
  color: white;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 60px;
  font-size: 0.7rem;
}

.blink-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 0 8px #ff6a4b;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%{opacity:1;}
  50%{opacity:0.3;}
  100%{opacity:1;}
}

.alert-footer {
  margin-top: 12px;
  background: #ffffffb0;
  border-radius: 40px;
  padding: 8px 16px;
  font-size: 0.85rem;
}

.farm-progress, .device-card {
  background: white;
  border-radius: 32px;
  padding: 20px 24px;
  border: 1px solid #cae0cf;
}

.farm-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1b5935;
  margin-bottom: 10px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
}

.bar-bg {
  width: 60%;
  height: 12px;
  background: #ddeee2;
  border-radius: 40px;
}

.bar-fill {
  height: 12px;
  background: #369561;
  border-radius: 40px;
}

.progress-footer {
  background: #e2f1e6;
  border-radius: 40px;
  padding: 10px;
  margin-top: 12px;
}

.device-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.device-header i {
  font-size: 1.8rem;
  color: #298049;
}

.device-header span {
  font-size: 1.2rem;
  font-weight: 600;
}

.device-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.online-led {
  display: inline-block;
  width: 16px;
  height: 16px;
  background: #3fbb6f;
  border-radius: 50%;
  margin-right: 8px;
  box-shadow: 0 0 8px #44dd88;
}

.device-footer {
  margin-top: 16px;
  background: #eff9f0;
  border-radius: 40px;
  padding: 10px 16px;
  color: #256d46;
}

.drill-footer {
  margin-top: 30px;
  background: #e4f4e4;
  border-radius: 60px;
  padding: 18px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  border: 1px solid #acd7b8;
  color: #1a5c37;
}

.drill-footer i {
  background: #328353;
  color: white;
  border-radius: 50%;
  padding: 8px;
  margin-right: 8px;
}

.footer-note {
  color: #2f764d;
}

.data-footer {
  margin-top: 18px;
  font-size: 0.8rem;
  color: #387a54;
  text-align: right;
  border-top: 1px dashed #9dcfae;
  padding-top: 12px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .kpi-row {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .main-panel {
    grid-template-columns: 1fr;
  }
  
  .title-with-back {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .time-weather {
    align-self: flex-start;
  }
}
</style>