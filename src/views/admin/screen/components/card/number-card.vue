<!-- src/views/screen/components/card/number-card.vue -->
<template>
  <div class="number-card">
    <div class="card-header">
      <span class="card-title">{{ title }}</span>
      <span class="trend" :class="trendClass">
        {{ trend > 0 ? '▲' : '▼' }} {{ Math.abs(trend) }}%
      </span>
    </div>
    <div class="card-value">
      <span class="value">{{ formatNumber(value) }}</span>
      <span class="unit">{{ unit }}</span>
    </div>
    <div class="card-footer">
      <span class="compare">较昨日</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: number
  unit: string
  trend?: number
}>()

const trendClass = computed(() => {
  if (!props.trend) return ''
  return props.trend > 0 ? 'trend-up' : 'trend-down'
})

const formatNumber = (num: number) => {
  return num.toLocaleString(undefined, { maximumFractionDigits: 1 })
}
</script>

<style scoped>
.number-card {
  background: rgba(20, 30, 45, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 140, 0, 0.2);
  border-left: 4px solid #ff8c00;
  border-radius: 12px;
  padding: 18px 20px;
  color: white;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  transition: all 0.3s;
}

.number-card:hover {
  border-color: #ffaa00;
  box-shadow: 0 0 20px rgba(255,140,0,0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  color: #ccc;
  font-size: 15px;
}

.trend {
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 20px;
  background: rgba(0,0,0,0.3);
}

.trend-up {
  color: #ff6b6b;
}

.trend-down {
  color: #6bff6b;
}

.card-value {
  margin-bottom: 8px;
}

.value {
  font-size: 32px;
  font-weight: 600;
  color: #ffaa00;
  text-shadow: 0 0 15px rgba(255,170,0,0.5);
}

.unit {
  font-size: 14px;
  color: #aaa;
  margin-left: 5px;
}

.card-footer {
  color: #888;
  font-size: 13px;
}
</style>