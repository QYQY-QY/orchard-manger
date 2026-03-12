<template>
  <div class="screen-right">
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
</template>

<script setup>
import { ref } from 'vue'
import LineChart from '../chart/LineChart.vue'
// import AreaChart from '../charts/AreaChart.vue'

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
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.chart-card,
.table-card {
  background: rgba(20, 30, 45, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 140, 0, 0.3);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-card {
  padding: 10px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #ffaa00;
  margin-bottom: 12px;
  padding-left: 10px;
  position: relative;
}

.card-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: linear-gradient(to bottom, #ff8c00, #ffaa00);
  border-radius: 2px;
}

/* 表格样式覆盖 */
:deep(.el-table) {
  background-color: transparent;
  color: #fff;
}

:deep(.el-table th) {
  background-color: rgba(255, 140, 0, 0.2);
  color: #ffaa00;
  border: none;
}

:deep(.el-table tr) {
  background-color: transparent;
}

:deep(.el-table td) {
  background-color: transparent;
  border-bottom: 1px solid rgba(255, 140, 0, 0.2);
}

:deep(.el-table--striped .el-table__row--striped td) {
  background-color: rgba(255, 140, 0, 0.05);
}

:deep(.el-table__row:hover > td) {
  background-color: rgba(255, 140, 0, 0.1) !important;
}
</style>