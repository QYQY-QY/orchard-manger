<!-- src/views/screen/components/chart/line-chart.vue -->
<template>
  <div class="chart-card">
    <div class="chart-header">
      <span class="chart-title">{{ title || '趋势分析' }}</span>
      <span class="chart-unit">单位: 吨</span>
    </div>
    <div class="chart-container" :style="{ height }" ref="chartRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  data: Array<{ name: string; value: number }>
  title?: string
  height?: string
  loading?: boolean
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '10%', right: '5%', top: 20, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.name),
      axisLabel: { color: '#aaa' },
      axisLine: { lineStyle: { color: '#444' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#aaa' },
      splitLine: { lineStyle: { color: '#333', type: 'dashed' } }
    },
    series: [{
      name: '采摘量',
      type: 'line',
      data: props.data.map(item => item.value),
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#ffaa00', width: 3 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#ffaa0033' },
          { offset: 1, color: '#ffaa0000' }
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

watch(() => props.loading, (loading) => {
  if (loading) {
    chart?.showLoading()
  } else {
    chart?.hideLoading()
  }
})

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => chart?.resize())
})

onUnmounted(() => {
  chart?.dispose()
})
</script>