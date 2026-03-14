<template>
  <div class="screen-right">
    <!-- 背景层（渐变 + 网格线 + 扫描线） -->
    <div class="right-bg"></div>

    <!-- 内容层 -->
    <div class="right-content">
      <!-- 折线图 -->
      <div class="chart-card">
        <div class="card-title">周采摘趋势</div>
        <LineChart :data="lineData" height="160px" />
      </div>

      <!-- 表格卡片 -->
      <div class="table-card">
        <div class="card-title">主产县产量排行</div>
        <el-table :data="tableData" style="width: 100%" :show-header="true" stripe>
          <el-table-column prop="county" label="县区" />
          <el-table-column prop="output" label="产量(吨)" />
          <el-table-column prop="rank" label="排名" width="60" />
        </el-table>
      </div>

      <!-- 面积图/迷你图 -->
      <div class="chart-card">
        <div class="card-title">近七日采摘量</div>
        <AreaChart :data="areaData" height="140px" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LineChart from '../chart/LineChart.vue'
// import AreaChart from '../chart/AreaChart.vue'

const lineData = ref([
  { name: '周一', value: 320 },
  { name: '周二', value: 332 },
  { name: '周三', value: 301 },
  { name: '周四', value: 334 },
  { name: '周五', value: 390 },
  { name: '周六', value: 410 },
  { name: '周日', value: 380 }
])

const tableData = ref([
  { county: '临海', output: 1250, rank: 1 },
  { county: '象山', output: 1180, rank: 2 },
  { county: '常山', output: 1120, rank: 3 },
  { county: '瑞安', output: 980, rank: 4 },
  { county: '黄岩', output: 950, rank: 5 }
])

const areaData = ref([
  { name: '周一', value: 120 },
  { name: '周二', value: 132 },
  { name: '周三', value: 101 },
  { name: '周四', value: 134 },
  { name: '周五', value: 190 },
  { name: '周六', value: 210 },
  { name: '周日', value: 180 }
])
</script>

<style scoped>
.screen-right {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  /* 左深黑 → 右暗绿透明渐变（方向与左侧相反） */
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

/* 暗绿色网格线 */
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

/* 流动扫描线（极淡的暗绿光带） */
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
  0% {
    left: -100%;
  }

  100% {
    left: 100%;
  }
}

.right-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.chart-card,
.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
  border: none;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 80, 0, 0.2) inset;
  backdrop-filter: blur(4px);
  border-radius: 16px;
  padding: 15px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.chart-card:hover,
.table-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(186, 240, 224, 0.142) inset;
}

.table-card {
  padding: 10px;
}

.card-title {
  font-size: 18px;
  font-weight: 500;
  color: #c0ffc0;
  margin-bottom: 16px;
  padding-left: 12px;
  position: relative;
  text-shadow: none;
}

.card-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: linear-gradient(to bottom, #3fb896, #235640);
  border-radius: 2px;
}

/* 表格样式覆盖 - 适配深绿主题 */
:deep(.el-table) {
  background-color: transparent;
  color: #d0ffd0;
}

:deep(.el-table th) {
  background-color: rgba(0, 80, 0, 0.3);
  color: #c0ffc0;
  border: none;
}

:deep(.el-table tr) {
  background-color: transparent;
}

:deep(.el-table td) {
  background-color: transparent;
  border-bottom: 1px solid rgba(0, 100, 0, 0.3);
  color: #bee7d6;
}

:deep(.el-table--striped .el-table__row--striped td) {
  background-color: rgba(0, 60, 0, 0.2);
}

:deep(.el-table__row:hover > td) {
  background-color: rgba(0, 100, 0, 0.3) !important;
}
</style>