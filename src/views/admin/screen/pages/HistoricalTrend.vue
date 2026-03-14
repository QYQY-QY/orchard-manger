<!-- TrendAnalysis.vue - 历史数据趋势分析大屏 -->
<template>
  <div class="trend-dashboard">
    <!-- 头部 -->
    <div class="header">
      <div class="title-section">
        <h1>
          <i class="fas fa-chart-line"></i> 历史数据趋势分析
        </h1>
        <div class="role-tag">
          <i class="fas fa-user-cog"></i> 技术人员 · 数据分析师 · 长期对比/效果评估
        </div>
      </div>
      <div class="update-time">
        <i class="fas fa-calendar-alt"></i> 数据截至 2025-Q1 · 每日更新
      </div>
    </div>

    <!-- KPI 行 (长期对比关键数字) -->
    <div class="kpi-row">
      <div class="kpi-card kpi1">
        <div class="kpi-label"><i class="fas fa-leaf"></i> NDVI (2025 Q1)</div>
        <div class="kpi-value">0.73 <span style="font-size:1rem;">vs 0.68</span></div>
        <div class="trend-badge"><i class="fas fa-arrow-up"></i> +0.05 同比</div>
      </div>
      <div class="kpi-card kpi2">
        <div class="kpi-label"><i class="fas fa-heartbeat"></i> 健康株占比</div>
        <div class="kpi-value">94.2% <span style="font-size:1rem;">vs 88%</span></div>
        <div class="trend-badge"><i class="fas fa-arrow-up"></i> +6.2%</div>
      </div>
      <div class="kpi-card kpi3">
        <div class="kpi-label"><i class="fas fa-apple-alt"></i> 平均糖度</div>
        <div class="kpi-value">13.2 <span style="font-size:1rem;">°Bx</span></div>
        <div class="trend-badge">+0.7 °Bx</div>
      </div>
      <div class="kpi-card kpi4">
        <div class="kpi-label"><i class="fas fa-exclamation-triangle"></i> 异常株峰值</div>
        <div class="kpi-value">107 <span style="font-size:1rem;">株 (3月)</span></div>
        <div class="trend-badge">↓ 42% 较峰值</div>
      </div>
    </div>

    <!-- 两列核心区 -->
    <div class="two-col">
      <!-- 左侧大列: NDVI长期趋势 + 健康株占比趋势(堆叠面积) -->
      <div>
        <!-- NDVI长期趋势 (多系列折线模拟 + 年度对比) -->
        <div class="card">
          <div class="section-title"><i class="fas fa-chart-line"></i> NDVI长期趋势 · 月度/季度变化 (2024-2025对比)</div>
          <div class="line-chart">
            <div class="chart-grid">
              <div class="month-group"><div class="bar2025 jan" style="height:102px;"></div><div class="bar2024 jan" style="height:88px;"></div></div>
              <div class="month-group"><div class="bar2025 feb" style="height:108px;"></div><div class="bar2024 feb" style="height:92px;"></div></div>
              <div class="month-group"><div class="bar2025 mar" style="height:118px;"></div><div class="bar2024 mar" style="height:98px;"></div></div>
              <div class="month-group"><div class="bar2025 apr" style="height:124px;"></div><div class="bar2024 apr" style="height:104px;"></div></div>
              <div class="month-group"><div class="bar2025 may" style="height:132px;"></div><div class="bar2024 may" style="height:110px;"></div></div>
              <div class="month-group"><div class="bar2025 jun" style="height:128px;"></div><div class="bar2024 jun" style="height:108px;"></div></div>
            </div>
            <div class="month-label">1月  2月  3月  4月  5月  6月</div>
            <div class="legend-line">
              <span><span class="legend-dot" style="background:#4794b3;"></span> 2025 NDVI</span>
              <span><span class="legend-dot" style="background:#b0c9b5;"></span> 2024 NDVI</span>
              <span>📈 2025较2024平均提升 +0.05</span>
            </div>
          </div>
          <!-- 额外：地块NDVI钻取提示 -->
          <div style="margin-top:16px; background:#e6f3ea; border-radius:40px; padding:12px 20px;">
            <i class="fas fa-map-marker-alt"></i> 地块C7 NDVI增幅最大 (+0.11) · 点击钻取详情
          </div>
        </div>

        <!-- 健康株占比趋势 (堆叠面积图模拟 + 趋势预测) 完全符合文档 -->
        <div class="card">
          <div class="section-title"><i class="fas fa-chart-area"></i> 健康株占比趋势 (堆叠面积) · 预测</div>
          <div class="stacked-area">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <span>2023</span><span>2024</span><span>2025</span><span>2026(预测)</span>
            </div>
            <!-- 堆叠条模拟 -->
            <div class="area-row">
              <div class="area-segment healthy" style="width:78%;">健康78%</div>
              <div class="area-segment subhealthy" style="width:15%;">亚15%</div>
              <div class="area-segment abnormal" style="width:7%;">异7%</div>
            </div>
            <div class="area-row">
              <div class="area-segment healthy" style="width:84%;">健康84%</div>
              <div class="area-segment subhealthy" style="width:11%;">亚11%</div>
              <div class="area-segment abnormal" style="width:5%;">异5%</div>
            </div>
            <div class="area-row">
              <div class="area-segment healthy" style="width:91%;">健康91%</div>
              <div class="area-segment subhealthy" style="width:6%;">亚6%</div>
              <div class="area-segment abnormal" style="width:3%;">异3%</div>
            </div>
            <div class="area-row" style="opacity:0.8;">
              <div class="area-segment healthy" style="width:94%;">健康94%</div>
              <div class="area-segment subhealthy" style="width:4%;">亚4%</div>
              <div class="area-segment abnormal" style="width:2%;">异2%</div>
            </div>
            <div style="margin-top:16px; background:#d7eedf; border-radius:30px; padding:8px 16px; text-align:center;">
              📊 趋势预测: 2025 Q3 健康株占比预计 95.5%
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧列: 产量品质相关 + 异常株时序 + 年度对比 -->
      <div>
        <!-- 产量/品质趋势卡片 (文档要求) -->
        <div class="metrics-card">
          <div class="section-title"><i class="fas fa-chart-bar"></i> 产量 & 品质趋势</div>
          <div class="metric-item"><span>🍎 单果重年均</span> <span>236g <span style="color:#308a59;">(+7%)</span></span></div>
          <div class="metric-item"><span>🍬 糖度趋势</span> <span>12.5 → 13.2 °Bx</span></div>
          <div class="metric-item"><span>📦 商品果率</span> <span>88% → 92%</span></div>
          <div class="metric-item"><span>🌿 叶绿素含量</span> <span>42 SPAD (+3.2)</span></div>
          <div class="scatter-mock" style="margin-top:12px;">
            <div class="dot-group"><span class="scatter-dot"></span><span>2024</span></div>
            <div class="dot-group"><span class="scatter-dot" style="background:#e09f3e;"></span><span>2025</span></div>
            <span>果径分布↗️</span>
          </div>
        </div>

        <!-- 异常株时序 (红蜘蛛周期等) -->
        <div class="metrics-card">
          <div class="section-title"><i class="fas fa-bug"></i> 异常株时序 · 病虫害周期</div>
          <div style="display:flex; justify-content:space-between; background:#f0f9f0; border-radius:40px; padding:20px;">
            <div style="text-align:center;"><span style="font-weight:800;">107</span><br>3月峰值</div>
            <div style="text-align:center;"><span style="font-weight:800;">62</span><br>4月</div>
            <div style="text-align:center;"><span style="font-weight:800;">48</span><br>5月</div>
            <div style="text-align:center;"><span style="font-weight:800;">41</span><br>6月(至今)</div>
          </div>
          <div style="margin-top:12px; display: flex; gap: 8px;">
            <span class="trend-badge">红蜘蛛周期减弱 ↓62%</span>
            <span class="trend-badge">黄龙病新发 3例</span>
          </div>
          <!-- 迷你折线占位 -->
          <div style="height:40px; background:#daeede; border-radius:30px; margin-top:14px; display:flex; align-items:center; justify-content:space-around; padding:0 12px;">
            <span>📉 异常株下降趋势明显</span> <i class="fas fa-arrow-down" style="color:#cf5f4a;"></i>
          </div>
        </div>

        <!-- 年度对比卡片 (NDVI年度对比+健康度) -->
        <div class="metrics-card">
          <div class="section-title"><i class="fas fa-calendar-alt"></i> 年度对比</div>
          <div class="year-compact">
            <div><span style="font-weight:800;">NDVI</span><br>2024: 0.68 <br>2025: 0.73</div>
            <div><span style="font-weight:800;">健康度</span><br>2024: 88% <br>2025: 94%</div>
            <div><span style="font-weight:800;">异常株</span><br>2024: 142 <br>2025: 87</div>
          </div>
          <div style="background:#e2f1e6; border-radius:40px; padding:12px; margin-top:16px;">
            <i class="fas fa-check-circle" style="color:#308a59;"></i> 综合管理效果提升显著
          </div>
        </div>
      </div>
    </div>

    <!-- 底部联动/更新频率/数据说明 (完全按照文档实施建议) -->
    <div class="drill-footer">
      <span><i class="fas fa-link"></i> 跨屏联动: 点击图表点可钻取至病虫害/水肥历史明细</span>
      <span><i class="fas fa-clock"></i> 历史趋势数据每日02:00更新 · 长期存储</span>
    </div>

    <!-- 微型数据清单满足文档所有项: NDVI长期, 健康占比趋势, 产量品质, 异常时序, 年度对比 -->
    <div style="margin-top:20px; font-size:0.8rem; color:#2f704a; border-top:1px dashed #a2cfb2; padding-top:12px; display: flex; flex-wrap: wrap; gap: 24px;">
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
// 如果需要动态数据，可以在这里添加ref
import { ref } from 'vue'

// 示例：如果需要动态更新数据，可以这样写
// const ndviValue = ref(0.73)
// const healthRatio = ref(94.2)
// ...
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

.trend-dashboard {
  max-width: 1440px;
  width: 100%;
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

.stacked-area {
  background: #e9f3ec;
  border-radius: 40px;
  padding: 24px;
  margin-top: 18px;
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

.year-compact {
  background: #f2fcf5;
  border-radius: 32px;
  padding: 18px;
  display: flex;
  gap: 20px;
  justify-content: space-around;
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
</style>