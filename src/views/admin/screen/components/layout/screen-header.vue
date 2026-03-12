<!-- src/views/screen/components/layout/screen-header.vue -->
<template>
  <div class="screen-header">
    <div class="header-left">
      <h1 class="title">
        <span class="icon">🍊</span>
        {{ title }}
        <span class="icon">🍊</span>
      </h1>
    </div>
    <div class="header-right">
      <div class="time-display">
        <span class="label">更新时间：</span>
        <span class="value">{{ updateTime }}</span>
      </div>
      <button class="refresh-btn" @click="handleRefresh" :disabled="loading">
        <span class="btn-icon" :class="{ rotating: loading }">↻</span>
        刷新
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  updateTime: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const handleRefresh = () => {
  emit('refresh')
}
</script>

<style scoped>
.screen-header {
  height: 70px;
  background: linear-gradient(90deg, #0a1a2a 0%, #1a2a3a 100%);
  border-bottom: 2px solid #ff8c00;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  color: white;
  box-shadow: 0 5px 20px rgba(0,0,0,0.5);
  position: relative;
  z-index: 10;
}

.title {
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 2px;
  text-shadow: 0 0 15px rgba(255,140,0,0.5);
}

.icon {
  margin: 0 12px;
  color: #ffaa00;
  filter: drop-shadow(0 0 8px #ffaa00);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 30px;
}

.time-display {
  background: rgba(0,0,0,0.4);
  padding: 8px 18px;
  border-radius: 40px;
  border: 1px solid #ff8c0044;
  font-size: 15px;
  backdrop-filter: blur(5px);
}

.time-display .label {
  color: #aaa;
}

.time-display .value {
  color: #ffaa00;
  font-weight: 500;
  margin-left: 5px;
}

.refresh-btn {
  background: rgba(255,140,0,0.15);
  border: 1px solid #ff8c00;
  color: white;
  padding: 8px 22px;
  border-radius: 40px;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  backdrop-filter: blur(5px);
}

.refresh-btn:hover {
  background: #ff8c00;
  box-shadow: 0 0 20px #ff8c00;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  display: inline-block;
  font-size: 18px;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>