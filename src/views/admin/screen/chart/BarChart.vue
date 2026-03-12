<template>
  <div ref="chartRef" :style="{ height }" class="chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { 
    type: Array, 
    default: () => []  // 提供默认空数组，避免 undefined
  },
  height: { 
    type: String, 
    default: '200px' 
  }
})

const chartRef = ref(null)
let chart = null

const initChart = () => {
    if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  // 确保数据是数组，防止意外
  const safeData = Array.isArray(props.data) ? props.data : []
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '10%', right: '5%', top: 20, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.name),
      axisLabel: { color: '#ccc' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#ccc' },
      splitLine: { lineStyle: { color: '#334' } }
    },
    series: [{
      data: props.data.map(item => item.value),
      type: 'bar',
      barWidth: '60%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#ffaa00' },
          { offset: 1, color: '#ff8c00' }
        ])
      }
    }]
  }
  chart.setOption(option)
}

watch(() => props.data, () => {
  chart?.setOption({
    xAxis: { data: props.data.map(item => item.name) },
    series: [{ data: props.data.map(item => item.value) }]
  })
}, { deep: true })

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