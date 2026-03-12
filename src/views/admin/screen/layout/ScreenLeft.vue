<template>
  <div class="screen-left">
    <!-- 背景层（渐变 + 网格线 + 扫描线） -->
    <div class="left-bg"></div>

    <!-- 内容层 -->
    <div class="left-content">
      <!-- 顶部两个数字卡片 -->
      <div class="cards-row">
        <div class="stat-card" v-for="item in statCards" :key="item.label">
          <div class="card-value">{{ item.value }}</div>
          <div class="card-label">{{ item.label }}</div>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import PieChart from '../chart/PieChart.vue'
import BarChart from '../chart/BarChart.vue'

const statCards = ref([
  { label: '工作人员总数', value: '加载中...' },
  { label: '果树总数', value: '加载中...' }
])

const fetchStats = async () => {
  try {
    const [staffRes, treeRes] = await Promise.all([
      axios.get('/api/staff/count'),
      axios.get('/api/tree/count')
    ])
    statCards.value[0].value = staffRes.data.data + ' 人'
    statCards.value[1].value = treeRes.data.data + ' 棵'
  } catch (error) {
    console.error('获取统计数据失败', error)
    statCards.value[0].value = '获取失败'
    statCards.value[1].value = '获取失败'
  }
}

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

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.screen-left {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  /* 左深黑 → 右暗绿透明渐变 */
  background: linear-gradient(
    to right,
    rgba(0, 23, 9, 0.884) 0%,
    rgba(0, 30, 0, 0.452) 40%,
    rgba(1, 31, 1, 0.066) 75%,
    rgba(1, 31, 1, 0) 100%
  );
  backdrop-filter: blur(2px); /* 轻微模糊，增强融合感 */
}

/* 背景层：网格线 + 扫描线 */
.left-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* 暗绿色网格线 */
.left-bg::before {
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
.left-bg::after {
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
  0% { left: -100%; }
  100% { left: 100%; }
}

.left-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

/* 卡片行等宽布局 */
.cards-row {
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

/* 悬浮式卡片（无边框，半透明，阴影） */
.stat-card {
  flex: 1;
  text-align: center;
  padding: 18px 12px;
  /* background: rgba(0, 15, 0, 0.4); */
  backdrop-filter: blur(4px);
  border: none; /* 无边框 */
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 80, 0, 0.2) inset;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(186, 240, 224, 0.142) inset;
}

.card-value {
  font-size: 36px;
  font-weight: 700;
  color: #d0ffd0;
  line-height: 1.2;
  margin-bottom: 8px;
}

/* 获取失败时字体缩小 */
.card-value.error {
  font-size: 20px;
  color: #ffaaaa;
}

.card-label {
  font-size: 16px;
  color: #bee7d6;
  opacity: 0.9;
}

/* 图表卡片完全透明，与背景融合 */
.chart-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
  border: none;
  box-shadow: none;
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
</style>