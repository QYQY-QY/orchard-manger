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

        <!-- 果树总数卡片 -->
        <div class="stat-card tree-card">
          <div class="card-value"
            :class="{ 'error': statCards[1].value.includes('失败') || statCards[1].value.includes('无') }">
            {{ statCards[1].value }}
          </div>
          <div class="card-label">{{ statCards[1].label }}</div>
        </div>
      </div>

      <!-- 饼图组件 -->
      <div class="chart-card">
        <div class="card-title">种类占比</div>
        <div class="chart-wrapper">
          <PieChart :data="pieData" height="100%" />
        </div>
      </div>

      <!-- 柱状图组件 -->
      <div class="chart-card">
        <div class="card-title">灾害类型及数量</div>
        <div class="chart-wrapper">
          <BarChart :data="barData" height="100%" />
        </div>
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

// 饼图数据
const pieData = ref([])

// 柱状图数据
const barData = ref([
  { name: '病害', value: 25 },
  { name: '虫害', value: 40 },
  { name: '冻害', value: 15 },
  { name: '风害', value: 10 }
])

const fetchStats = async () => {
  try {
    // 获取当前果园ID
    const currentOrchardId = orchardId.value

    if (!currentOrchardId) {
      console.warn('未获取到果园ID')
      statCards.value[0].value = '无果园信息'
      statCards.value[1].value = '无果园信息'
      return
    }

    // 并行请求工作人员总数和区域果树数据
    const [staffRes, areaTreeRes] = await Promise.allSettled([
      axios.get(`/api/employee/statisticsEmployee/${currentOrchardId}`),
      axios.get(`/api/fruitTree/statisticsAreaTreeType/${currentOrchardId}`)
    ])

    // 处理工作人员总数
    if (staffRes.status === 'fulfilled' && staffRes.value.data?.code === 200) {
      statCards.value[0].value = staffRes.value.data.data + ' 人'
    } else {
      console.error('获取工作人员总数失败', staffRes.reason || staffRes.value)
      statCards.value[0].value = '获取失败'
    }

    // 处理区域果树数据
    if (areaTreeRes.status === 'fulfilled' && areaTreeRes.value.data?.code === 200) {
      const areaData = areaTreeRes.value.data.data || []

      // 计算所有区域所有品种的果树总数
      let totalTrees = 0
      const typeMap = new Map()

      areaData.forEach(area => {
        if (area.typeCount && Array.isArray(area.typeCount)) {
          area.typeCount.forEach(tc => {
            if (tc.typeName && tc.count > 0) {
              totalTrees += tc.count
              const currentCount = typeMap.get(tc.typeName) || 0
              typeMap.set(tc.typeName, currentCount + tc.count)
            }
          })
        }
      })

      // 更新果树总数
      statCards.value[1].value = totalTrees + ' 棵'

      // 更新饼图数据
      pieData.value = Array.from(typeMap.entries()).map(([name, value]) => ({
        name,
        value
      }))

      if (pieData.value.length === 0) {
        pieData.value = [{ name: '暂无数据', value: 1 }]
      }

      console.log('总计果树数量:', totalTrees)
    } else {
      console.error('获取区域果树数据失败', areaTreeRes.reason || areaTreeRes.value)
      statCards.value[1].value = '获取失败'
      pieData.value = [{ name: '获取失败', value: 1 }]
    }

  } catch (error) {
    console.error('获取统计数据失败', error)
    statCards.value[0].value = '获取失败'
    statCards.value[1].value = '获取失败'
  }
}

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
  background: linear-gradient(to right,
      rgba(0, 23, 9, 0.884) 0%,
      rgba(0, 30, 0, 0.452) 40%,
      rgba(1, 31, 1, 0.066) 75%,
      rgba(1, 31, 1, 0) 100%);
  backdrop-filter: blur(2px);
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

/* 流动扫描线 */
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
  gap: 16px;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

/* 卡片行 - 保持卡片宽度 */
.cards-row {
  display: flex;
  gap: 12px;
  width: 100%;
  flex-shrink: 0;
}

/* 工作人员卡片 */
.staff-card {
  width: 30%;
  /* 调整为30% */
  flex-shrink: 0;
}

/* 果树卡片 */
.tree-card {
  width: 70%;
  /* 调整为70% */
  flex-shrink: 0;
}

/* 基础卡片样式 */
.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 16px 8px;
  backdrop-filter: blur(4px);
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 80, 0, 0.2) inset;
  box-sizing: border-box;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(186, 240, 224, 0.142) inset;
}

/* 数值样式 */
.card-value {
  font-size: 32px;
  font-weight: 700;
  color: #d0ffd0;
  line-height: 1.2;
  margin-bottom: 4px;
  white-space: nowrap;
  width: 100%;
  text-align: center;
}

/* 标签样式 */
.card-label {
  font-size: 14px;
  color: #bee7d6;
  opacity: 0.9;
  white-space: nowrap;
  width: 100%;
  text-align: center;
}

/* 错误状态 */
.card-value.error {
  font-size: 18px;
  color: #ffaaaa;
  white-space: normal;
  word-break: break-word;
}

/* 图表卡片 - 使用flex:1自动分配剩余空间 */
.chart-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
  border: none;
  box-shadow: none;
  min-height: 0;
  /* 防止flex溢出 */
  width: 100%;
}

/* 图表包装器 - 占满剩余空间 */
.chart-wrapper {
  flex: 1;
  width: 100%;
  min-height: 0;
  /* 防止flex溢出 */
  position: relative;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #c0ffc0;
  margin-bottom: 8px;
  padding-left: 10px;
  position: relative;
  text-shadow: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.card-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background: linear-gradient(to bottom, #3fb896, #235640);
  border-radius: 2px;
}

/* 确保饼图和柱状图容器填满 */
:deep(.pie-chart-container),
:deep(.bar-chart-container) {
  width: 100% !important;
  height: 100% !important;
  position: relative;
}

:deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain;
}

/* 小屏幕适配 */
@media screen and (max-width: 768px) {
  .left-content {
    padding: 12px;
    gap: 12px;
  }

  .staff-card {
    width: 28%;
  }

  .tree-card {
    width: 72%;
  }

  .card-value {
    font-size: 28px;
  }

  .card-label {
    font-size: 13px;
  }

  .card-title {
    font-size: 15px;
  }
}

/* 极小屏幕 */
@media screen and (max-width: 480px) {
  .cards-row {
    flex-direction: column;
    gap: 8px;
  }

  .staff-card,
  .tree-card {
    width: 100%;
  }
}
</style>