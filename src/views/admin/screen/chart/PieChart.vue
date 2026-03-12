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
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    legend: { orient: 'vertical', right: 10, top: 20, textStyle: { color: '#ccc' } },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['40%', '50%'],
      data: props.data,
      label: { show: false },
      itemStyle: { borderRadius: 8, borderColor: '#0a1a2a', borderWidth: 2 },
      color: ['#ff8c00', '#ffaa33', '#ffbb66', '#ffcc99']
    }]
  }
  chart.setOption(option)
}

watch(() => props.data, () => {
  chart?.setOption({ series: [{ data: props.data }] })
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