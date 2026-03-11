<template>
  <div class="info-panel">
    <h1>🍎 智慧果园 · 种植基地 <span>{{ 负责人 }}</span></h1>
    <p>负责人: {{ 负责人 }} | 总面积: {{ 总面积 }} 亩 | 果树: {{ 果树总数 }} 棵 | 年产量: {{ 年产量 }} 吨</p>
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
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
  pointer-events: none;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  border-left: 5px solid #ffaa00;
  backdrop-filter: blur(5px);
}

.info-panel h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: 2px;
}

.info-panel h1 span {
  font-weight: 700;
  color: #ffaa00;
  margin-left: 10px;
}

.info-panel p {
  margin: 5px 0 0;
  font-size: 0.9rem;
  opacity: 0.8;
}
</style>