<template>
  <div class="info-panel">
    <div class="panel-header">
      <span class="icon">🏡</span>
      <h2>智慧果园 · 种植基地</h2>
      <span class="manager-tag">负责人: {{ 负责人 }}</span>
    </div>
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-label">总面积</span>
        <span class="stat-value">{{ 总面积 }}<span class="unit">亩</span></span>
      </div>
      <div class="divider"></div>
      <div class="stat-item">
        <span class="stat-label">果树</span>
        <span class="stat-value">{{ 果树总数 }}<span class="unit">棵</span></span>
      </div>
      <div class="divider"></div>
      <div class="stat-item">
        <span class="stat-label">年产量</span>
        <span class="stat-value">{{ 年产量 }}<span class="unit">吨</span></span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  负责人: String,
  总面积: Number,
  果树总数: Number,
  年产量: Number
})
</script>

<style scoped>
.info-panel {
  position: absolute;
  top: 24px;
  left: 24px;
  background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,248,0.92) 100%);
  color: #2d3748;
  padding: 20px 28px;
  border-radius: 20px;
  pointer-events: none;
  z-index: 100;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid rgba(45, 90, 39, 0.1);
  backdrop-filter: blur(20px);
  min-width: 420px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-header .icon {
  font-size: 1.6rem;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #2d5a27;
  letter-spacing: 1px;
}

.manager-tag {
  margin-left: auto;
  background: linear-gradient(135deg, #4a8c3f, #2d5a27);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(45, 90, 39, 0.3);
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 0;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 0 12px;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #718096;
  margin-bottom: 4px;
  font-weight: 500;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #2d5a27;
  line-height: 1;
}

.stat-value .unit {
  font-size: 0.9rem;
  font-weight: 500;
  color: #4a8c3f;
  margin-left: 2px;
}

.divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, #e2e8f0, transparent);
}
</style>