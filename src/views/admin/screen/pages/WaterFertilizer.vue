<!-- WaterFertilizer.vue - 水肥精准管控决策大屏 -->
<template>
  <div class="water-dashboard">
    <!-- 头部角色 -->
    <div class="header">
      <div class="title-section">
        <h1>
          <i class="fas fa-droplet"></i> 水肥精准管控决策
        </h1>
        <div class="role-tag">
          <i class="fas fa-leaf"></i> 农艺师 · 水肥管理专员 · 节本增效
        </div>
      </div>
      <div class="update-time">
        <i class="fas fa-sync-alt"></i> 基于多光谱 2025-04-07 11:40
      </div>
    </div>

    <!-- 第一行：水肥缺失诊断 KPI -->
    <div class="deficit-row">
      <div v-for="(item, index) in deficitData" :key="index" class="deficit-card" :class="item.type">
        <div class="deficit-title"><i :class="item.icon"></i> {{ item.label }}</div>
        <div class="deficit-number">{{ item.count }} <span class="deficit-unit">{{ item.unit }}</span></div>
        <div>{{ item.percentage }}</div>
      </div>
    </div>

    <!-- 两列核心区域 -->
    <div class="two-col">
      <!-- 左侧大列: 诊断柱状 + 精准建议 + 成本统计 -->
      <div>
        <!-- 地块分布柱状图 -->
        <div class="diagnostic-card">
          <div class="section-title"><i class="fas fa-chart-bar"></i> 水肥缺失诊断 · 地块分布</div>
          <!-- 柱状图模拟 -->
          <div class="deficit-bar-chart">
            <div v-for="(item, index) in deficitChart" :key="index" class="bar-item">
              <div class="bar-label">{{ item.label }}</div>
              <div class="bar"><div class="bar-fill" :class="item.type" :style="{ height: item.height + '%' }"></div></div>
              <span class="bar-value">{{ item.count }}</span>
            </div>
          </div>
          <!-- 地块热力图 -->
          <div class="plot-tag">
            <span><i class="fas fa-map"></i> 地块热力图：A2(缺氮) · B5(缺钾) · C7(缺水) · D3(缺磷)</span>
            <span class="heat-badge">🌡️ 多光谱反演</span>
          </div>
        </div>

        <!-- 精准施肥建议卡片 -->
        <div class="advice-card">
          <div class="section-title"><i class="fas fa-clipboard-check"></i> 精准施肥建议</div>
          <div v-for="(advice, index) in adviceData" :key="index" class="advice-item">
            <span><i class="fas fa-map-pin"></i> {{ advice.location }}</span>
            <span>{{ advice.suggestion }}</span>
            <span class="advice-badge" :style="{ background: advice.badgeColor }">{{ advice.status }}</span>
          </div>
          <div class="advice-footer">
            <i class="fas fa-clock"></i> 执行时间窗口: 今日18:00前 / 明日05:00-09:00
          </div>
        </div>

        <!-- 水肥成本统计 -->
        <div class="cost-card">
          <div class="section-title" style="font-size:1.2rem;"><i class="fas fa-coins"></i> 水肥成本统计 · 节本增效</div>
          <div v-for="(cost, index) in costData" :key="index" class="cost-row" :class="{ 'no-border': index === costData.length - 1 }">
            <span>{{ cost.label }}</span> <span v-html="cost.value"></span>
          </div>
        </div>
      </div>

      <!-- 右侧列: 水肥任务进度 + 养分趋势 + 相关性散点 -->
      <div>
        <!-- 水肥任务进度卡片 -->
        <div class="task-card">
          <div class="section-title"><i class="fas fa-tasks"></i> 水肥任务进度</div>
          <div v-for="(task, index) in taskProgress" :key="index" class="progress-item">
            <span>{{ task.name }}</span><span>{{ task.value }}</span>
            <div class="bar-bg"><div class="bar-fill-green" :style="{ width: task.percentage + '%' }"></div></div>
          </div>
          <div class="task-footer">
            <i class="fas fa-check-circle" style="color:#2a8b54;"></i> 执行效果反馈: 良好率92% · 3条待反馈
          </div>
        </div>

        <!-- 养分趋势分析 -->
        <div class="trend-card">
          <div class="section-title"><i class="fas fa-chart-line"></i> 养分趋势分析</div>
          <div>全园叶片氮含量 (月度)</div>
          <div class="trend-line">
            <span v-for="(height, index) in nutrientTrend" :key="index" 
                  class="trend-bar" :style="{ height: height + 'px', background: '#378f5a' }"></span>
          </div>
          <div class="month-labels">
            <span>2月</span><span>3月</span><span>4月</span><span>5月</span><span>6月</span>
          </div>
          <div class="correlation-box">
            <i class="fas fa-chart-scatter"></i> NDVI与水肥含量相关性: r = 0.81 <span style="color:#2e6d45;">(强正相关)</span>
          </div>
        </div>

        <!-- 相关性散点图模拟 -->
        <div class="correl-card">
          <div class="section-title"><i class="fas fa-project-diagram"></i> NDVI vs 水肥含量</div>
          <div class="correl-scatter">
            <span v-for="n in 7" :key="n" class="scatter-dot" :style="{ background: scatterColors[n-1] }"></span>
          </div>
          <div class="correl-stats">
            <span>🌿 NDVI 0.72</span> <span>💧 叶片含水率 68%</span> <span>🧪 全氮 2.1%</span>
          </div>
          <div class="correl-footer">
            多光谱反演精度 94% · 推荐增施钾肥
          </div>
        </div>
      </div>
    </div>

    <!-- 底部联动 -->
    <div class="drill-footer">
      <span><i class="fas fa-link"></i> 跨屏联动: 点击缺失株/地块可跳转至病虫害/农事调度</span>
      <span><i class="fas fa-clock"></i> 水肥缺失实时诊断 每30min更新 · 成本统计每日更新</span>
    </div>

    <!-- 微型数据清单 -->
    <div class="micro-data">
      <span>🌱 缺氮44 缺磷16 缺钾31 缺水19 其他8</span>
      <span>📊 地块柱状图+热力图</span>
      <span>🧾 施肥建议: A2/B5/C7</span>
      <span>📈 任务进度: 灌溉79% 施肥63%</span>
      <span>📉 养分趋势: 叶片氮含量2.1→2.3</span>
      <span>💰 节本增效 ¥4260</span>
      <span>📎 NDVI与水肥 r=0.81</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 缺失数据
const deficitData = ref([
  { type: 'n', icon: 'fas fa-flask', label: '缺氮株数', count: '44', unit: '株', percentage: '占比 5.3%' },
  { type: 'p', icon: 'fas fa-flask', label: '缺磷株数', count: '16', unit: '株', percentage: '占比 1.9%' },
  { type: 'k', icon: 'fas fa-flask', label: '缺钾株数', count: '31', unit: '株', percentage: '占比 3.7%' },
  { type: 'water', icon: 'fas fa-tint', label: '缺水株数', count: '19', unit: '株', percentage: '占比 2.3%' },
  { type: 'other', icon: 'fas fa-seedling', label: '其他缺失', count: '8', unit: '株', percentage: '缺硼/锌' }
])

// 柱状图数据
const deficitChart = ref([
  { label: '缺氮', type: 'n', height: 78, count: 44 },
  { label: '缺磷', type: 'p', height: 45, count: 16 },
  { label: '缺钾', type: 'k', height: 62, count: 31 },
  { label: '缺水', type: 'water', height: 38, count: 19 },
  { label: '其他', type: 'other', height: 30, count: 8 }
])

// 建议数据
const adviceData = ref([
  { location: '地块 A2 (缺氮)', suggestion: '高氮水溶肥 5kg/亩 · 灌溉25m³', status: '今日执行', badgeColor: '#256f45' },
  { location: '地块 B5 (缺钾)', suggestion: '硫酸钾 3.2kg/亩 · 灌溉18m³', status: '明日窗口', badgeColor: '#e68a3a' },
  { location: '地块 C7 (缺水)', suggestion: '滴灌补水 30m³/亩 · 建议22:00后', status: '今日执行', badgeColor: '#256f45' }
])

// 成本数据
const costData = ref([
  { label: '🚿 总用水量', value: '2,380 m³ <span style="color:#308a59;">(同比-11%)</span>' },
  { label: '🧪 总施肥量', value: '1,640 kg <span style="color:#308a59;">(同比-8%)</span>' },
  { label: '💰 成本对比', value: 'B区 ¥3,420 &nbsp;&nbsp; C区 ¥2,980' },
  { label: '<i class="fas fa-leaf"></i> 节本增效金额', value: '<span style="font-size:2rem; color:#1d7342;">¥4,260</span>' }
])

// 任务进度
const taskProgress = ref([
  { name: '灌溉任务派发量', value: '22/28 地块', percentage: 79 },
  { name: '施肥任务完成率', value: '63%', percentage: 63 },
  { name: '未执行地块', value: 'B2, C4, D9', percentage: 0 }
])

// 养分趋势
const nutrientTrend = ref([60, 72, 54, 68, 46])

// 散点颜色
const scatterColors = ['#1b7b44', '#3ba363', '#308254', '#56a06b', '#71ba83', '#c45d32', '#7ac48a']
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

.water-dashboard {
  max-width: 1440px;
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 56px;
  box-shadow: 0 40px 60px -20px #1b4f31, 0 20px 30px -10px #1f4028;
  padding: 32px 36px 40px 36px;
  border: 2px solid rgba(90, 170, 130, 0.6);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 20px;
}

.title-section h1 {
  font-size: 2.3rem;
  font-weight: 600;
  color: #11532f;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 18px;
}

.title-section h1 i {
  font-size: 2.8rem;
  color: #2783b3;
  background: #e0f2fc;
  padding: 12px;
  border-radius: 50%;
  box-shadow: 0 4px 12px #7fb9d4;
}

.role-tag {
  background: #1d789b;
  color: white;
  font-weight: 500;
  font-size: 1rem;
  padding: 8px 26px;
  border-radius: 60px;
  display: inline-block;
  margin-top: 6px;
  box-shadow: 0 6px 14px #3580a3;
}

.update-time {
  background: #effaf2;
  border-radius: 100px;
  padding: 10px 26px;
  font-weight: 500;
  color: #1f6d40;
  border: 1px solid #abd8b8;
  font-size: 1rem;
}

.deficit-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 18px;
  margin-bottom: 28px;
}

.deficit-card {
  background: white;
  border-radius: 28px;
  padding: 18px 16px;
  box-shadow: 0 10px 20px -12px #1e5438;
  border: 1px solid #b9e0cc;
  border-bottom: 6px solid;
}
.deficit-card.n { border-bottom-color: #5f9ea0; }
.deficit-card.p { border-bottom-color: #e1ad5d; }
.deficit-card.k { border-bottom-color: #c45d32; }
.deficit-card.water { border-bottom-color: #4794b3; }
.deficit-card.other { border-bottom-color: #7fbf8f; }

.deficit-title {
  font-size: 0.85rem;
  color: #3c6d50;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.deficit-number {
  font-size: 2.2rem;
  font-weight: 800;
  color: #1d4f31;
  line-height: 1;
}
.deficit-unit { font-size: 0.9rem; color: #578b6c; }

.two-col {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 26px;
  margin-bottom: 32px;
}

.diagnostic-card {
  background: #f5fff9;
  border-radius: 38px;
  padding: 26px;
  border: 1px solid #c2e6d5;
  box-shadow: 0 12px 24px -16px #225537;
  margin-bottom: 20px;
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

.deficit-bar-chart {
  display: flex;
  justify-content: space-around;
  margin: 20px 0 20px;
  background: #e2f3e8;
  border-radius: 60px;
  padding: 22px 12px;
}
.bar-item {
  text-align: center;
  width: 60px;
}
.bar-label {
  font-weight: 600;
  color: #1a5b37;
  margin-bottom: 6px;
}
.bar {
  height: 100px;
  width: 36px;
  background: #b8dcca;
  margin: 0 auto;
  border-radius: 30px;
  position: relative;
  overflow: hidden;
}
.bar-fill {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: #328f55;
  border-radius: 30px;
}
.bar-fill.n { background: #5f9ea0; }
.bar-fill.p { background: #e1ad5d; }
.bar-fill.k { background: #c45d32; }
.bar-fill.water { background: #4794b3; }
.bar-fill.other { background: #b58f5a; }
.bar-value {
  margin-top: 6px;
  font-weight: 700;
}

.plot-tag {
  background: #e1f0e4;
  border-radius: 30px;
  padding: 16px;
  margin: 16px 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.heat-badge {
  background: #b7dfc2;
  padding: 6px 18px;
  border-radius: 30px;
}

.advice-card {
  background: white;
  border-radius: 32px;
  padding: 22px;
  margin-bottom: 20px;
  border: 1px solid #d0ebdd;
}
.advice-item {
  display: flex;
  background: #ecf9f0;
  border-radius: 50px;
  padding: 14px 22px;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0;
  border-left: 10px solid #3d9c6e;
}
.advice-badge {
  color: white;
  padding: 4px 15px;
  border-radius: 40px;
}
.advice-footer {
  margin-top: 10px;
  background: #ecf9f0;
  border-radius: 30px;
  padding: 8px 16px;
}

.cost-card {
  background: #deefe2;
  border-radius: 34px;
  padding: 22px;
  border: 1px solid #a3cfb2;
}
.cost-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed #90bb9f;
  padding: 12px 0;
  font-size: 1.1rem;
}
.no-border {
  border-bottom: none;
}

.task-card, .trend-card, .correl-card {
  background: white;
  border-radius: 34px;
  padding: 24px;
  border: 1px solid #c6e3d4;
  margin-bottom: 20px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  margin: 16px 0;
  align-items: center;
}
.bar-bg {
  width: 60%;
  height: 14px;
  background: #deecdf;
  border-radius: 40px;
}
.bar-fill-green {
  height: 14px;
  background: #369561;
  border-radius: 40px;
}
.task-footer {
  background: #e1f1e5;
  border-radius: 30px;
  padding: 12px;
  margin-top: 14px;
}

.trend-line {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 18px;
  height: 80px;
  margin: 20px 0;
}
.trend-bar {
  width: 30px;
  background: #4794b3;
  border-radius: 20px 20px 6px 6px;
}
.month-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
}
.correlation-box {
  margin-top: 20px;
  background: #ecf9ef;
  border-radius: 40px;
  padding: 14px;
}

.correl-scatter {
  background: #f6fdf8;
  border-radius: 28px;
  padding: 18px;
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}
.scatter-dot {
  width: 24px; height: 24px;
  border-radius: 50%;
}
.correl-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 12px 0;
}
.correl-footer {
  background: #e0efe3;
  border-radius: 30px;
  padding: 12px;
  text-align: center;
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
</style>