<!-- src/views/screen/components/card/status-card.vue -->
<template>
  <div class="status-card" :class="statusClass">
    <div class="status-header">
      <span class="card-title">{{ title }}</span>
      <span class="status-badge" :class="statusClass">
        {{ statusText }}
      </span>
    </div>
    <div class="status-value">
      <span class="value">{{ value }}</span>
      <span class="unit">{{ unit }}</span>
    </div>
    <div class="status-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: value + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: number
  unit: string
  status: 'success' | 'warning' | 'danger'
}>()

const statusText = computed(() => {
  const map = {
    success: '正常',
    warning: '注意',
    danger: '预警'
  }
  return map[props.status]
})

const statusClass = computed(() => `status-${props.status}`)
</script>

<style scoped>
.status-card {
  background: rgba(20, 30, 45, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 140, 0, 0.2);
  border-radius: 12px;
  padding: 18px 20px;
  color: white;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-title {
  color: #ccc;
  font-size: 15px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
}

.status-success {
  background: rgba(0, 255, 0, 0.15);
  color: #6fff6f;
  border: 1px solid #00aa00;
}

.status-warning {
  background: rgba(255, 165, 0, 0.15);
  color: #ffb347;
  border: 1px solid #ff8c00;
}

.status-danger {
  background: rgba(255, 0, 0, 0.15);
  color: #ff6b6b;
  border: 1px solid #ff0000;
}

.status-value {
  margin-bottom: 15px;
}

.value {
  font-size: 28px;
  font-weight: 600;
  color: white;
}

.unit {
  font-size: 14px;
  color: #aaa;
  margin-left: 5px;
}

.progress-bar {
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff8c00, #ffaa00);
  border-radius: 3px;
  transition: width 0.3s;
}

.status-success .progress-fill {
  background: linear-gradient(90deg, #00aa00, #6fff6f);
}

.status-warning .progress-fill {
  background: linear-gradient(90deg, #ff8c00, #ffb347);
}

.status-danger .progress-fill {
  background: linear-gradient(90deg, #ff0000, #ff6b6b);
}
</style>