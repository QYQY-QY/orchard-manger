<template>
  <div ref="chartRef" :style="{ height }" class="chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: Array,
  height: { type: String, default: '200px' }
})

const chartRef = ref(null)
let chart = null

const initChart = () => {
  chart = echarts.init(chartRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '10%', right: '5%', top: 20, bottom: 20 },
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
      type: 'line',
      smooth: true,
      lineStyle: { color: '#ff8c00', width: 3 },
      areaStyle: { color: 'rgba(255,140,0,0.1)' },
      symbol: 'circle',
      symbolSize: 6
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