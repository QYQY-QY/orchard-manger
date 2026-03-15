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
          <i class="fas fa-user-md"></i> 植保专员 · 防控负责人 · 全流程监控
        </div>
      </div>
      <div class="update-time">
        <i class="fas fa-sync-alt"></i> 最后更新: 2025-04-07 11:15 · 实时
      </div>
    </div>

    <!-- 第一行 KPI 卡片 -->
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
            <span class="trap-value">{{ trapValue }}</span> <span>头/日 · 超阈值42%</span>
          </div>

          <!-- 预警分布热力地块标注 -->
          <div class="heatmap-container">
            <div class="heatmap-header">
              <span class="section-title" style="font-size:1.1rem;"><i class="fas fa-fire"></i> 预警分布热力 & 重灾地块</span>
              <span class="badge">🔴重灾 3个</span>
            </div>
            <div class="heatmap-grid">
              <div v-for="(cell, index) in heatmapData" :key="index" 
                   class="plot-pest" :class="cell.class" :title="cell.title">
                {{ cell.label }}
              </div>
            </div>
            <div class="plot-label">
              <span><i class="fas fa-map-marker-alt" style="color:#bf4f2e;"></i> 重灾地块: A3-A4 (红蜘蛛) · B2-B3 (黄龙病) · C6 (红蜘蛛) </span>
              <span class="click-hint">点击格子钻取详情</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧: 防治任务 + 药剂使用 + 效果反馈 -->
      <div class="right-panel">
        <!-- 防治任务卡片 -->
        <div class="task-card">
          <div class="task-header"><i class="fas fa-clipboard-list"></i> 今日防治任务</div>
          <div class="task-progress">
            <div v-for="(task, index) in taskData" :key="index" class="progress-item">
              <span>{{ task.name }}</span><span>{{ task.value }}</span>
              <div class="bar-bg"><div class="bar-fill" :style="{ width: task.percentage, background: task.color }"></div></div>
            </div>
          </div>
          <div class="coverage-badge">
            <i class="fas fa-check-circle" style="color:#2c9c5e;"></i> 防控覆盖率 91% · 已覆盖12个地块
          </div>
        </div>

        <!-- 药剂使用分析卡片 -->
        <div class="chemical-card">
          <div class="chemical-title"><i class="fas fa-flask"></i> 药剂使用分析</div>
          <div v-for="(chemical, index) in chemicalData" :key="index" class="chemical-row">
            <span class="chemical-name">{{ chemical.name }}</span>
            <span class="chemical-quantity">{{ chemical.quantity }}</span>
          </div>
          <div class="chemical-footer"><i class="fas fa-chart-pie"></i> 按病害配比 · 红蜘蛛用药占比 46%</div>
        </div>

        <!-- 防治效果反馈卡片 -->
        <div class="feedback-card">
          <div class="feedback-title"><i class="fas fa-chart-simple"></i> 防治效果反馈</div>
          <div class="feedback-stats">
            <div v-for="(stat, index) in feedbackStats" :key="index" class="stat-item">
              <span class="feedback-value">{{ stat.value }}</span><br>{{ stat.label }}
            </div>
          </div>
          <div class="feedback-footer">
            <i class="fas fa-thumbs-up"></i> 防治效果达标率 88% (目标85%)
          </div>
        </div>
      </div>
    </div>

    <!-- 底部 明日预警 + 跨屏联动 -->
    <div class="footer-warning">
      <div class="tomorrow-risk">
        <i class="fas fa-cloud-moon"></i> 明日预警: 蚜虫风险中 (地块D3, D7, E5) · 建议巡查
      </div>
      <div class="drill-link">
        <i class="fas fa-expand-arrows-alt"></i> 点击钻取至单株详情
      </div>
    </div>

    <!-- 跨屏联动/数据同源提示 -->
    <div class="drill-footer">
      <span><i class="fas fa-link"></i> 跨屏联动: 从宏观总览点击异常株可直达本屏 · 预警每5min更新</span>
      <span><i class="fas fa-database"></i> 数据底层同源 · 植保专项全流程</span>
      <span><i class="fas fa-chart-pie"></i> 满足文档: 监测/热力/任务/药剂/效果</span>
    </div>

    <!-- 微型数据标注 -->
    <div class="micro-data">
      <span>🐞 红蜘蛛35株 黄龙病12株 炭疽21株</span>
      <span>🌡️ 诱捕器186头/日</span>
      <span>⚠️ 重灾地块3个</span>
      <span>📋 防治任务8/5/3</span>
      <span>🧪 矿物油32L 阿维菌素12L 苯醚甲环唑8L</span>
      <span>📉 减退率78% 砍除9株</span>
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
  { icon: 'fas fa-biohazard', label: '当前染病株数', value: '87', unit: '株', trend: '较昨日-12', cardClass: '' },
  { icon: 'fas fa-skull-crosswalk', label: '高危预警株', value: '23', unit: '株', trend: '黄龙病/红蜘蛛', cardClass: 'pest2' },
  { icon: 'fas fa-spray-can', label: '今日防治完成率', value: '68%', unit: '', trend: '8/12 地块', cardClass: 'pest3' },
  { icon: 'fas fa-chart-line', label: '诱捕器头均密度', value: '186', unit: '头/日', trend: '↑上周+12%', cardClass: 'pest4' }
])

// 病虫害数据
const pestData = ref([
  { name: '红蜘蛛', count: 35, icon: 'fas fa-bug fa-2x', iconColor: '#b34343', colorClass: 'red' },
  { name: '黄龙病', count: 12, icon: 'fas fa-leaf', iconColor: '#cb7b3a', colorClass: 'orange' },
  { name: '炭疽病', count: 21, icon: 'fas fa-seedling', iconColor: '#9b643b', colorClass: 'brown' }
])

const trapValue = ref(186)

// 热力图数据
const heatmapData = ref([
  { label: 'A1', class: 'pest-green', title: '健康' },
  { label: 'A2', class: 'pest-green', title: '健康' },
  { label: 'A3⚠️', class: 'pest-red', title: '红蜘蛛' },
  { label: 'A4⚠️', class: 'pest-red', title: '红蜘蛛' },
  { label: 'A5', class: 'pest-orange', title: '' },
  { label: 'A6', class: 'pest-green', title: '健康' },
  { label: 'A7', class: 'pest-green', title: '健康' },
  { label: 'A8', class: 'pest-yellow', title: '' },
  { label: 'B1', class: 'pest-green', title: '健康' },
  { label: 'B2🔶', class: 'pest-orange', title: '黄龙病' },
  { label: 'B3🔶', class: 'pest-orange', title: '黄龙病' },
  { label: 'B4⚠️', class: 'pest-red', title: '' },
  { label: 'B5', class: 'pest-green', title: '健康' },
  { label: 'B6', class: 'pest-green', title: '健康' },
  { label: 'B7', class: 'pest-yellow', title: '' },
  { label: 'B8', class: 'pest-yellow', title: '' },
  { label: 'C1', class: 'pest-green', title: '健康' },
  { label: 'C2', class: 'pest-green', title: '健康' },
  { label: 'C3', class: 'pest-green', title: '健康' },
  { label: 'C4🔶', class: 'pest-orange', title: '' },
  { label: 'C5🔶', class: 'pest-orange', title: '' },
  { label: 'C6⚠️', class: 'pest-red', title: '红蜘蛛' },
  { label: 'C7', class: 'pest-green', title: '健康' },
  { label: 'C8', class: 'pest-green', title: '健康' },
  { label: 'D1⚠️', class: 'pest-red', title: '' },
  { label: 'D2⚠️', class: 'pest-red', title: '' },
  { label: 'D3', class: 'pest-yellow', title: '' },
  { label: 'D4', class: 'pest-green', title: '健康' },
  { label: 'D5', class: 'pest-green', title: '健康' },
  { label: 'D6🔶', class: 'pest-orange', title: '' },
  { label: 'D7🔶', class: 'pest-orange', title: '' },
  { label: 'D8', class: 'pest-green', title: '健康' }
])

// 任务数据
const taskData = ref([
  { name: '已派发', value: '8 单', percentage: '100%', color: '#369561' },
  { name: '已完成', value: '5 单', percentage: '62.5%', color: '#c45d32' },
  { name: '剩余未执行', value: '3 单', percentage: '37.5%', color: '#e68a3a' }
])

// 药剂数据
const chemicalData = ref([
  { name: '矿物油', quantity: '32 L' },
  { name: '阿维菌素', quantity: '12 L' },
  { name: '苯醚甲环唑', quantity: '8 L' },
  { name: '吡虫啉', quantity: '5.5 L' }
])

// 反馈统计
const feedbackStats = ref([
  { label: '红蜘蛛减退率', value: '78%' },
  { label: '黄龙病砍除株', value: '9' },
  { label: '天敌数量', value: '↑21%' }
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
  background: linear-gradient(145deg, #d1e6d1 0%, #bbd9c4 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.pest-dashboard {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 56px;
  box-shadow: 0 40px 60px -20px #264d2e, 0 20px 30px -10px #1e3f28;
  padding: 32px 36px 40px 36px;
  border: 2px solid rgba(160, 200, 150, 0.6);
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
  color: #174d31;
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
  color: #174d31;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 18px;
}

.title-section h1 i {
  font-size: 2.8rem;
  color: #bf4f2e;
  background: #fef0e0;
  padding: 12px;
  border-radius: 50%;
  box-shadow: 0 4px 12px #cf8b6b;
}

.role-tag {
  background: #c45d32;
  color: white;
  font-weight: 500;
  font-size: 1rem;
  padding: 8px 26px;
  border-radius: 60px;
  display: inline-block;
  margin-top: 6px;
  box-shadow: 0 6px 14px #ac6f4e;
}

.update-time {
  background: #f2fcf2;
  border-radius: 100px;
  padding: 10px 26px;
  font-weight: 500;
  color: #216b40;
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
  box-shadow: 0 12px 24px -12px #2c573b;
  border: 1px solid #c0e0cb;
  transition: 0.15s;
  border-left: 8px solid #d97335;
}

.kpi-card.pest2 { border-left-color: #c45d32; }
.kpi-card.pest3 { border-left-color: #e6a345; }
.kpi-card.pest4 { border-left-color: #aa4e2c; }

.kpi-label {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #3e6e4f;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.kpi-value {
  font-size: 2.2rem;
  font-weight: 800;
  color: #194f30;
  line-height: 1.1;
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.sub-value { font-size: 1rem; color: #558566; }

.trend-badge {
  background: #e6f3e6;
  border-radius: 40px;
  padding: 5px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #21663e;
}

.two-col {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 26px;
  margin-bottom: 30px;
}

.monitor-card {
  background: #f4fff8;
  border-radius: 38px;
  padding: 26px;
  border: 1px solid #c6e6d3;
  box-shadow: 0 12px 26px -16px #1c4e30;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1f5938;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pest-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}
.pest-tag {
  background: white;
  border-radius: 60px;
  padding: 14px 24px;
  box-shadow: 0 4px 10px #aacbb8;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 0 auto;
  border-left: 6px solid;
}
.pest-tag.red { border-left-color: #d14b4b; }
.pest-tag.orange { border-left-color: #e68a3a; }
.pest-tag.brown { border-left-color: #b0724a; }
.pest-tag .pest-name { font-weight: 700; font-size: 1.1rem; }
.pest-tag .pest-count { font-size: 1.8rem; font-weight: 800; color: #203d2b; margin-left: auto; }

.trap-card {
  background: #e3efe5;
  border-radius: 32px;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.trap-value {
  font-size: 2.3rem;
  font-weight: 800;
  color: #235f37;
}

.heatmap-container {
  margin-top: 24px;
}
.heatmap-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.badge {
  background: #d9f0dd;
  padding: 4px 16px;
  border-radius: 40px;
}
.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  margin: 12px 0 10px;
}
.plot-pest {
  aspect-ratio: 1/1;
  border-radius: 12px;
  background: #b1d3b5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: #1d3d26;
  border: 1px solid #89b696;
}
.pest-red { background: #cf5f4a; color: white; }
.pest-orange { background: #e09f5e; }
.pest-yellow { background: #edd188; }
.pest-green { background: #7fbf8f; }

.plot-label {
  display: flex;
  justify-content: space-between;
  background: #e4f4e9;
  padding: 12px 20px;
  border-radius: 40px;
  font-weight: 600;
  color: #1c613b;
}
.click-hint {
  background: #ebcba0;
  padding: 4px 12px;
  border-radius: 30px;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.task-card {
  background: white;
  border-radius: 36px;
  padding: 24px;
  border: 1px solid #cee6d8;
}

.task-header {
  font-size: 1.2rem;
  font-weight: 700;
  color: #174f30;
}
.task-progress {
  margin: 16px 0;
}
.progress-item {
  display: flex;
  justify-content: space-between;
  margin: 12px 0;
}
.bar-bg {
  width: 60%;
  height: 14px;
  background: #deefdf;
  border-radius: 40px;
}
.bar-fill {
  height: 14px;
  background: #c45d32;
  border-radius: 40px;
}
.coverage-badge {
  background: #eff9f0;
  border-radius: 30px;
  padding: 12px;
  margin-top: 10px;
}

.chemical-card {
  background: #f5fcf5;
  border-radius: 30px;
  padding: 20px;
}
.chemical-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 12px;
}
.chemical-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed #b0d1bb;
  padding: 12px 0;
}
.chemical-name { font-weight: 600; color: #204f32; }
.chemical-quantity { font-weight: 700; color: #194d2e; }
.chemical-footer {
  margin-top: 12px;
}

.feedback-card {
  background: #e8f3e8;
  border-radius: 30px;
  padding: 22px;
  border-left: 8px solid #63a37b;
}
.feedback-title {
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  gap: 10px;
}
.feedback-stats {
  display: flex;
  gap: 30px;
  margin-top: 18px;
  flex-wrap: wrap;
}
.feedback-value {
  font-size: 2rem;
  font-weight: 800;
  color: #1c683e;
}
.stat-item {
  text-align: center;
}
.feedback-footer {
  margin-top: 16px;
  background: #cfeede;
  border-radius: 30px;
  padding: 10px 16px;
}

.footer-warning {
  margin-top: 30px;
  background: #ffefe3;
  border-radius: 40px;
  padding: 18px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2px solid #e6a345;
}
.tomorrow-risk {
  font-size: 1.2rem;
  font-weight: 700;
  color: #b15723;
}
.drill-link {
  background: #297a48;
  color: white;
  padding: 12px 28px;
  border-radius: 40px;
  font-size: 0.95rem;
}

.drill-footer {
  margin-top: 24px;
  background: #e4f2e4;
  border-radius: 60px;
  padding: 16px 26px;
  display: flex;
  gap: 30px;
  color: #1a633b;
  border: 1px solid #9fcfb1;
}

.micro-data {
  margin-top: 18px;
  font-size: 0.75rem;
  color: #397d56;
  border-top: 1px dashed #a8d5b5;
  padding-top: 12px;
  display: flex;
  gap: 30px;
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