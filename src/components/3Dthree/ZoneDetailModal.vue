<template>
  <div class="detail-modal" :class="{ show }">
    <div class="close-btn" @click="$emit('close')">×</div>
    <div class="zone-name">{{ zoneData?.name || '🍑 水蜜桃种植区' }}</div>
    <div class="detail-item">
      <span class="label">种植面积</span>
      <span class="value">{{ zoneData?.area || 120 }} <span class="highlight-number">亩</span></span>
    </div>
    <div class="detail-item">
      <span class="label">果树数量</span>
      <span class="value">{{ zoneData?.trees || 3200 }} <span class="highlight-number">棵</span></span>
    </div>
    <div class="detail-item">
      <span class="label">预估年产量</span>
      <span class="value">{{ zoneData?.yield || 85 }} <span class="highlight-number">吨</span></span>
    </div>
    <div class="detail-item">
      <span class="label">主要品种</span>
      <span class="value">{{ zoneData?.variety || '水蜜桃' }}</span>
    </div>
    <div class="detail-item">
      <span class="label">种植密度</span>
      <span class="value">{{ zoneData?.density || 27 }} <span class="highlight-number">棵/亩</span></span>
    </div>
    <div class="modal-footer">—— 悬停凸起，点击查看详情 ——</div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  zoneData: Object
})

defineEmits(['close'])
</script>

<style scoped>
.detail-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(60, 40, 20, 0.95);
  backdrop-filter: blur(10px);
  color: white;
  padding: 30px 40px;
  border-radius: 30px;
  border: 2px solid #ffaa00;
  box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255, 170, 0, 0.5);
  z-index: 1000;
  min-width: 350px;
  text-align: left;
  transition: all 0.3s ease;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
}

.detail-modal.show {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.detail-modal .zone-name {
  font-size: 2.2rem;
  font-weight: 800;
  color: #ffaa00;
  margin-bottom: 15px;
  border-bottom: 2px solid #ff8c42;
  padding-bottom: 10px;
  text-shadow: 0 2px 10px rgba(255,140,0,0.5);
}

.detail-modal .detail-item {
  display: flex;
  justify-content: space-between;
  margin: 15px 0;
  font-size: 1.3rem;
  padding: 8px 15px;
  background: rgba(255,255,255,0.1);
  border-radius: 40px;
  border-left: 4px solid #ffaa00;
}

.detail-modal .detail-item .label {
  color: #ddd;
  font-weight: 400;
}

.detail-modal .detail-item .value {
  font-weight: 700;
  color: #ffaa00;
}

.detail-modal .close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 2rem;
  cursor: pointer;
  color: #ffaa00;
  background: rgba(0,0,0,0.5);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  pointer-events: auto;
}

.detail-modal .close-btn:hover {
  background: #ffaa00;
  color: black;
  transform: scale(1.1);
}

.detail-modal .highlight-number {
  font-size: 1.6rem;
  color: #ffaa00;
  margin-left: 5px;
}

.detail-modal .modal-footer {
  text-align: center;
  margin-top: 20px;
  color: #aaa;
  font-size: 0.9rem;
}
</style>