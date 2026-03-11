<template>
  <div class="detail-modal" :class="{ show }">
    <div class="modal-backdrop" @click="$emit('close')"></div>
    <div class="modal-content">
      <div class="close-btn" @click="$emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      
      <div class="modal-header">
        <span class="zone-emoji">{{ getFruitEmoji(zoneData?.name) }}</span>
        <div class="header-text">
          <h2 class="zone-name">{{ zoneData?.name || '🍑 水蜜桃种植区' }}</h2>
          <p class="zone-variety">主要品种: {{ zoneData?.variety || '水蜜桃' }}</p>
        </div>
      </div>
      
      <div class="details-grid">
        <div class="detail-card">
          <div class="detail-icon">📏</div>
          <div class="detail-info">
            <div class="detail-label">种植面积</div>
            <div class="detail-value">{{ zoneData?.area || 120 }}<span class="unit">亩</span></div>
          </div>
        </div>
        
        <div class="detail-card">
          <div class="detail-icon">🌳</div>
          <div class="detail-info">
            <div class="detail-label">果树数量</div>
            <div class="detail-value">{{ zoneData?.trees || 3200 }}<span class="unit">棵</span></div>
          </div>
        </div>
        
        <div class="detail-card">
          <div class="detail-icon">📦</div>
          <div class="detail-info">
            <div class="detail-label">预估年产量</div>
            <div class="detail-value">{{ zoneData?.yield || 85 }}<span class="unit">吨</span></div>
          </div>
        </div>
        
        <div class="detail-card">
          <div class="detail-icon">📊</div>
          <div class="detail-info">
            <div class="detail-label">种植密度</div>
            <div class="detail-value">{{ zoneData?.density || 27 }}<span class="unit">棵/亩</span></div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <span class="footer-icon">💡</span>
        <span>悬停凸起，点击查看详情</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  zoneData: Object
})

defineEmits(['close'])

const getFruitEmoji = (name) => {
  if (!name) return '🍑'
  const emojiMatch = name.match(/^[^\s]+/)
  return emojiMatch ? emojiMatch[0] : '🍑'
}
</script>

<style scoped>
.detail-modal {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.detail-modal.show {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #f8faf8 100%);
  border-radius: 24px;
  padding: 36px 40px;
  min-width: 420px;
  max-width: 480px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.8) inset;
  transform: scale(0.9) translateY(20px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(45, 90, 39, 0.1);
}

.detail-modal.show .modal-content {
  transform: scale(1) translateY(0);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f7faf7, #edf2ed);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #718096;
  border: 1px solid rgba(45, 90, 39, 0.1);
}

.close-btn:hover {
  background: linear-gradient(135deg, #fc8181, #f56565);
  color: white;
  transform: rotate(90deg);
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4);
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f4f0;
}

.zone-emoji {
  font-size: 3rem;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
}

.header-text {
  flex: 1;
}

.zone-name {
  margin: 0 0 6px 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #2d5a27;
  line-height: 1.2;
}

.zone-variety {
  margin: 0;
  font-size: 0.95rem;
  color: #718096;
  font-weight: 500;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #f7faf7, #f0f7f0);
  padding: 18px 16px;
  border-radius: 16px;
  border: 1px solid rgba(74, 140, 63, 0.15);
  transition: all 0.3s ease;
}

.detail-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(74, 140, 63, 0.2);
  border-color: rgba(74, 140, 63, 0.3);
}

.detail-icon {
  font-size: 2rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.detail-info {
  flex: 1;
}

.detail-label {
  font-size: 0.85rem;
  color: #718096;
  margin-bottom: 4px;
  font-weight: 500;
}

.detail-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #2d5a27;
  line-height: 1;
}

.detail-value .unit {
  font-size: 0.9rem;
  font-weight: 500;
  color: #4a8c3f;
  margin-left: 3px;
}

.modal-footer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #f0f4f0;
  color: #a0aec0;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.footer-icon {
  font-size: 1rem;
}
</style>