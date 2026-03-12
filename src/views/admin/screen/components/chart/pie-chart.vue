<!-- src/views/admin/screen/components/chart/pie-chart.vue -->
<template>
  <div class="chart-card">
    <div class="chart-header">
      <span class="chart-title">{{ title || '品类占比' }}</span>
      <span class="chart-unit">单位: %</span>
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
    tooltip: { 
      trigger: 'item', 
      formatter: '{b}: {c}%' 
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 20,
      textStyle: { color: '#ccc' },
      itemGap: 10,
      itemWidth: 8,
      itemHeight: 8
    },
    series: [{
      name: '占比',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#0a1a2a',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: { scale: false },
      data: props.data,
      color: ['#ff8c00', '#ffaa33', '#ffbb66', '#ffcc99']
    }]
  }
  
  chart.setOption(option)
}

watch(() => props.data, () => {
  chart?.setOption({ series: [{ data: props.data }] })
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

<style scoped>
.chart-card {
  background: rgba(20, 30, 45, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 140, 0, 0.2);
  border-radius: 12px;
  padding: 15px;
  color: white;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #ccc;
  font-size: 14px;
}

.chart-title {
  color: #ffaa00;
  font-weight: 500;
}

.chart-unit {
  color: #888;
}

.chart-container {
  width: 100%;
  min-height: 200px;
}
</style>