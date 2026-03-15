<template>
  <div class="screen-left">
    <!-- 背景层（渐变 + 网格线 + 扫描线） -->
    <div class="left-bg"></div>

    <!-- 内容层 -->
    <div class="left-content">
      <!-- 顶部两个数字卡片 -->
      <div class="cards-row">
        <!-- 工作人员总数卡片 -->
        <div class="stat-card staff-card">
          <div class="card-value"
            :class="{ 'error': statCards[0].value.includes('失败') || statCards[0].value.includes('无') }">
            {{ statCards[0].value }}
          </div>
          <div class="card-label">{{ statCards[0].label }}</div>
        </div>

        <!-- 果树总数卡片（加宽） -->
        <div class="stat-card tree-card">
          <div class="card-value"
            :class="{ 'error': statCards[1].value.includes('失败') || statCards[1].value.includes('无') }">
            {{ statCards[1].value }}
          </div>
          <div class="card-label">{{ statCards[1].label }}</div>
          <!-- 二维码覆盖率副标题 -->
          <div class="card-subvalue" :class="{ 'error': coverageText.includes('失败') || coverageText.includes('无') }">
            {{ coverageText }}
          </div>
        </div>
      </div>

      <!-- 饼图组件 -->
      <div class="chart-card">
        <div class="card-title">种类占比</div>
        <PieChart :data="pieData" height="180px" />
      </div>

      <!-- 柱状图组件 -->
      <div class="chart-card">
        <div class="card-title">灾害类型及数量</div>
        <BarChart :data="barData" height="180px" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/modules/user'
import PieChart from '../chart/PieChart.vue'
import BarChart from '../chart/BarChart.vue'

const userStore = useUserStore()

// 从userStore中获取orchardId
const orchardId = computed(() => userStore.user.orchardId)

const statCards = ref([
  { label: '工作人员总数', value: '加载中...' },
  { label: '果树总数', value: '加载中...' }
])

// 二维码覆盖率文本
const coverageText = ref('二维码覆盖率: 加载中...')

// 饼图数据
const pieData = ref([])

// 柱状图数据
const barData = ref([
  { name: '病害', value: 25 },
  { name: '虫害', value: 40 },
  { name: '冻害', value: 15 },
  { name: '风害', value: 10 }
])

// 计算二维码覆盖率
const calculateQRCodeCoverage = (totalTrees) => {
  // 这里需要根据实际业务逻辑来计算二维码覆盖率
  // 示例：假设已绑定二维码的果树数量，这里先返回一个模拟值
  // 实际项目中可能需要从另一个接口获取已绑定二维码的果树数量
  const boundTrees = Math.floor(totalTrees * 0.85) // 假设85%的果树已绑定二维码
  const coverage = totalTrees > 0 ? ((boundTrees / totalTrees) * 100).toFixed(1) : 0
  return `二维码覆盖率: ${coverage}%`
}

const fetchStats = async () => {
  try {
    // 获取当前果园ID
    const currentOrchardId = orchardId.value

    if (!currentOrchardId) {
      console.warn('未获取到果园ID')
      statCards.value[0].value = '无果园信息'
      statCards.value[1].value = '无果园信息'
      coverageText.value = '二维码覆盖率: 无果园信息'
      return
    }

    // 并行请求工作人员总数和果树品种数据
    const [staffRes, treeTypesRes] = await Promise.allSettled([
      axios.get(`/api/employee/statisticsEmployee/${currentOrchardId}`),
      axios.get(`/api/fruitTree/statisticsTreeType/${currentOrchardId}`)
    ])

    // 处理工作人员总数
    if (staffRes.status === 'fulfilled' && staffRes.value.data?.code === 200) {
      statCards.value[0].value = staffRes.value.data.data + ' 人'
    } else {
      console.error('获取工作人员总数失败', staffRes.reason || staffRes.value)
      statCards.value[0].value = '获取失败'
    }

    // 处理果树品种数据
    if (treeTypesRes.status === 'fulfilled' && treeTypesRes.value.data?.code === 200) {
      const treeData = treeTypesRes.value.data.data || []

      // 计算果树总数
      const totalTrees = treeData.reduce((sum, item) => sum + (item.count || 0), 0)
      statCards.value[1].value = totalTrees + ' 棵'

      // 计算二维码覆盖率
      coverageText.value = calculateQRCodeCoverage(totalTrees)

      // 更新饼图数据
      pieData.value = treeData.map(item => ({
        name: item.typeName,
        value: item.count
      }))

      // 如果饼图数据为空，显示提示
      if (pieData.value.length === 0) {
        pieData.value = [{ name: '暂无数据', value: 1 }]
      }
    } else {
      console.error('获取果树品种数据失败', treeTypesRes.reason || treeTypesRes.value)
      statCards.value[1].value = '获取失败'
      coverageText.value = '二维码覆盖率: 获取失败'
      pieData.value = [{ name: '获取失败', value: 1 }]
    }

  } catch (error) {
    console.error('获取统计数据失败', error)
    statCards.value[0].value = '获取失败'
    statCards.value[1].value = '获取失败'
    coverageText.value = '二维码覆盖率: 获取失败'
  }
}

onMounted(() => {
  fetchStats()
})

// 可选：监听果园ID变化，当用户切换果园时重新获取数据
// 如果用户可能在同一个会话中切换果园，可以取消下面的注释
// import { watch } from 'vue'
// watch(orchardId, (newId, oldId) => {
//   if (newId && newId !== oldId) {
//     fetchStats()
//   }
// })
</script>

<style scoped>
.screen-left {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  /* 左深黑 → 右暗绿透明渐变 */
  background: linear-gradient(to right,
      rgba(0, 23, 9, 0.884) 0%,
      rgba(0, 30, 0, 0.452) 40%,
      rgba(1, 31, 1, 0.066) 75%,
      rgba(1, 31, 1, 0) 100%);
  backdrop-filter: blur(2px);
  /* 轻微模糊，增强融合感 */
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
  0% {
    left: -100%;
  }

  100% {
    left: 100%;
  }
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

/* 卡片行等宽布局调整为不等宽 */
.cards-row {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: stretch;
  /* 确保子元素高度相等 */
}

/* 基础卡片样式 */
.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 18px 12px;
  backdrop-filter: blur(4px);
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 80, 0, 0.2) inset;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(186, 240, 224, 0.142) inset;
}

/* 工作人员总数卡片 - 比例 1 */
.staff-card {
  flex: 1;
}

/* 果树总数卡片 - 比例 1.5 (加宽50%) */
.tree-card {
  flex: 1.5;
}

.card-value {
  font-size: 36px;
  font-weight: 700;
  color: #d0ffd0;
  line-height: 1.2;
  margin-bottom: 8px;
  white-space: nowrap;
  /* 防止数字换行 */
}

/* 卡片副标题（二维码覆盖率） */
.card-subvalue {
  font-size: 16px;
  color: #a0d0a0;
  margin-top: 4px;
  opacity: 0.9;
  font-weight: 400;
  line-height: 1.4;
  white-space: nowrap;
  /* 防止文字换行 */
}

/* 获取失败时字体样式 */
.card-value.error,
.card-subvalue.error {
  font-size: 20px;
  color: #ffaaaa;
  white-space: normal;
  /* 错误信息允许换行 */
}

.card-subvalue.error {
  font-size: 14px;
  /* 错误信息字体稍小 */
}

.card-label {
  font-size: 16px;
  color: #bee7d6;
  opacity: 0.9;
  margin-bottom: 2px;
  white-space: nowrap;
  /* 防止标签换行 */
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