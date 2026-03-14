<template>
  <div ref="chartRef" :style="{ height }" class="chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios' // 引入 axios
import { useUserStore } from '@/stores/modules/user' // 根据实际路径调整

const props = defineProps({
  height: { type: String, default: '200px' }
})

const chartRef = ref(null)
let chart = null
const userStore = useUserStore()
const orchardId = computed(() => userStore.user?.orchardId) // 从 pinia 获取 orchardId

// 获取数据并更新图表
const fetchData = async () => {
  if (!orchardId.value || orchardId.value === 0) {
    console.warn('orchardId 无效，无法获取数据');
    updateChart([]);
    return;
  }
  try {
    const response = await axios.get(`/api/fruitTree/statisticsTreeType/${orchardId.value}`)
    const res = response.data // axios 自动将响应解析为 JSON，数据在 response.data 中
    console.log('种类：' + res)
    if (res.code === 200 && res.data) {
      const list = res.data
      // 计算总数
      const total = list.reduce((sum, item) => sum + item.count, 0)
      // 转换为饼图数据格式：{ name, value }，value 为百分比
      const chartData = list.map(item => ({
        name: item.typeName,
        value: total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0
      }))
      updateChart(chartData)
    } else {
      // 处理无数据或接口返回错误
      updateChart([])
    }
  } catch (error) {
    console.error('获取果树品种统计数据失败', error)
    updateChart([])
  }
}

// 更新图表配置
const updateChart = (data) => {
  if (!chart) return
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    legend: { orient: 'vertical', right: 10, top: 20, textStyle: { color: '#ccc' } },
    series: [{
      type: 'pie',
      radius: ['40%', '76%'],          // ⬅️ 增大饼图半径
      center: ['40%', '50%'],
      data: data,
      label: { show: false },
      itemStyle: {
        borderRadius: 8,
        borderColor: '#0a1a2a',
        borderWidth: 2,
        // 阴影，制造3D效果
        shadowBlur: 10,
        shadowOffsetX: 3,
        shadowOffsetY: 3,
        shadowColor: 'rgba(0, 0, 0, 0.3)'
      },
      color: ['#f8f2c7', '#93a957', '#5a7e34', '#9faf4f', '#f3de62', '#ddec9b', '#feda8c']
    }]
  }
  chart.setOption(option, { notMerge: false })
}
// 初始化图表
const initChart = () => {
  chart = echarts.init(chartRef.value)
  fetchData() // 首次加载数据
}

// 监听 orchardId 变化
watch(() => orchardId.value, () => {
  fetchData()
}, { immediate: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => chart?.resize())
})

onUnmounted(() => {
  chart?.dispose()
})
</script>

<style scoped>
.chart {
  width: 100%;
}
</style>