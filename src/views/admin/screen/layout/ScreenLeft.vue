<template>
  <div class="screen-left">
    <!-- 顶部三个数字卡片 -->
    <div class="cards-row">
      <div class="stat-card" v-for="item in statCards" :key="item.label">
        <div class="card-value">{{ item.value }}</div>
        <div class="card-label">{{ item.label }}</div>
        <div class="card-trend" :class="{ up: item.trend > 0 }">
          {{ item.trend > 0 ? '+' : '' }}{{ item.trend }}%
        </div>
      </div>
    </div>

    <!-- 饼图组件 -->
    <div class="chart-card">
      <div class="card-title">品类占比</div>
      <PieChart :data="pieData" height="180px" />
    </div>

    <!-- 柱状图组件 -->
    <div class="chart-card">
      <div class="card-title">主产县产量对比</div>
      <BarChart :data="barData" height="180px" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PieChart from '../chart/PieChart.vue'
import BarChart from '../chart/BarChart.vue'

// 模拟数据
const statCards = ref([
  { label: '今日采摘量', value: '1250.8 吨', trend: 5.2 },
  { label: '累计产量', value: '328.4 万吨', trend: 3.1 },
  { label: '设备在线率', value: '98.5%', trend: 0.5 }
])

const pieData = ref([
  { name: '温州蜜柑', value: 45 },
  { name: '椪柑', value: 28 },
  { name: '脐橙', value: 18 },
  { name: '其他', value: 9 }
])

const barData = ref([
  { name: '临海', value: 60 },
  { name: '象山', value: 50 },
  { name: '常山', value: 55 },
  { name: '瑞安', value: 50 },
  { name: '黄岩', value: 55 }
])
</script>

<style scoped>
.screen-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.cards-row {
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.stat-card {
  flex: 1;
  background: rgba(20, 30, 45, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 140, 0, 0.3);
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: #ff8c00;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  color: #ffaa00;
  margin-bottom: 5px;
}

.card-label {
  font-size: 14px;
  color: #ccc;
  margin-bottom: 8px;
}

.card-trend {
  font-size: 12px;
  color: #f56c6c;
}

.card-trend.up {
  color: #67c23a;
}

.chart-card {
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
</style>