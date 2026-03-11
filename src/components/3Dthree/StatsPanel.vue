<template>
  <div class="stats-panel">
    <div class="title">📊 种植区数据 (随机生成)</div>
    <div class="item">
      <span class="label">种植区数量 :</span>
      <span class="value highlight">{{ 种植区数量 }}</span>
    </div>
    <div class="item">
      <span class="label">总面积 (亩) :</span>
      <span class="value highlight">{{ 总面积 }}</span>
    </div>
    <div class="item">
      <span class="label">果树总数 :</span>
      <span class="value highlight">{{ 果树总数 }}</span>
    </div>
    <div class="item">
      <span class="label">预估年产量 :</span>
      <span class="value highlight">{{ 年产量 }} 吨</span>
    </div>
    <div class="note">
      🍊 不规则地面拼块 <br> 🍎 鼠标悬停凸起 <br> 👆 点击查看详情
    </div>
  </div>
</template>

<script setup>
defineProps({
  种植区数量: Number,
  总面积: Number,
  果树总数: Number,
  年产量: Number
})
</script>

<style scoped>
.stats-panel {
  position: absolute;
  bottom: 30px;
  right: 30px;
  background: rgba(50, 30, 20, 0.85);
  color: #eee;
  padding: 18px 25px;
  border-radius: 16px;
  backdrop-filter: blur(8px);
  border: 1px solid #ffaa00;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  z-index: 100;
  pointer-events: none;
  line-height: 1.8;
  font-size: 1rem;
  border-right: 4px solid #ff6b4a;
}

.stats-panel .title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffaa00;
  margin-bottom: 8px;
  border-bottom: 1px solid #b37b5b;
  padding-bottom: 5px;
}

.stats-panel .item {
  display: flex;
  justify-content: space-between;
  gap: 40px;
}

.stats-panel .item .label {
  color: #ccc;
}

.stats-panel .item .value {
  font-weight: 600;
  color: #ffaa00;
}

.stats-panel .highlight {
  color: #ffaa00;
  font-weight: 700;
}

.stats-panel .note {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #ccc;
  border-top: 1px solid #b37b5b;
  padding-top: 8px;
}
</style>