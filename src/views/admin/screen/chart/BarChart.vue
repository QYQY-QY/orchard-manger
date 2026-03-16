<template>
  <div ref="chartRef" :style="{ height }" class="chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'
import { useUserStore } from '@/stores/modules/user'

const props = defineProps({
  height: { type: String, default: '200px' }
})

const chartRef = ref(null)
let chart = null
const userStore = useUserStore()
const orchardId = computed(() => userStore.user?.orchardId)

// 获取数据并处理
const fetchData = async () => {
  if (!orchardId.value) {
    console.warn('orchardId 无效')
    updateChart([])
    return
  }
  try {
    const response = await axios.get(`/api/disaster/statisticsDisaster/${orchardId.value}`)
    const res = response.data
    if (res.code === 200 && Array.isArray(res.data)) {
      // 统计各病虫害类型的总数
      const countMap = new Map()
      res.data.forEach(item => {
        if (item.typeCount && Array.isArray(item.typeCount)) {
          item.typeCount.forEach(tc => {
            // 处理 typeName 为 null 的情况
            const name = tc.typeName || '未知类型'
            const count = tc.count || 0
            countMap.set(name, (countMap.get(name) || 0) + count)
          })
        }
      })
      // 转换为图表需要的格式
      const chartData = Array.from(countMap.entries()).map(([name, value]) => ({
        name,
        value
      }))
      updateChart(chartData)
    } else {
      updateChart([])
    }
  } catch (error) {
    console.error('获取病虫害统计数据失败', error)
    updateChart([])
  }
}

// 更新图表
const updateChart = (data) => {
  if (!chart) return
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '10%', right: '5%', top: 20, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisLabel: { color: '#ccc' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#ccc' },
      splitLine: { lineStyle: { color: '#334' } }
    },
    series: [{
      data: data.map(item => item.value),
      type: 'bar',
      barWidth: '60%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#bfd1b1' },
          { offset: 1, color: '#6b8c31' }
        ])
      }
    }]
  }
  chart.setOption(option)
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  fetchData()
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