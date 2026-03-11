<template>
  <div class="controls-container">
    <div class="hover-hint" :style="{ opacity: showDetail ? 0 : 1 }">
      <span class="hint-icon">👆</span>
      <span class="hint-text">鼠标悬停区域会凸起 · 点击查看详情</span>
    </div>
    
    <div class="controls-note">
      <div class="control-item">
        <span class="control-icon">🖱️</span>
        <span class="control-text">拖动旋转</span>
      </div>
      <div class="control-divider"></div>
      <div class="control-item">
        <span class="control-icon">🔍</span>
        <span class="control-text">滚轮缩放</span>
      </div>
      <div class="control-divider"></div>
      <div class="control-item">
        <span class="control-icon">✨</span>
        <span class="control-text">悬停凸起</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  showDetail: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.controls-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 150;
}

.hover-hint {
  position: absolute;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  padding: 12px 28px;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(72, 187, 120, 0.4);
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation: float 3s ease-in-out infinite;
  border: 1px solid rgba(255,255,255,0.2);
}

@keyframes float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-6px); }
}

.hint-icon {
  font-size: 1.2rem;
}

.hint-text {
  letter-spacing: 0.5px;
}

.controls-note {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(20px);
  color: #4a5568;
  padding: 12px 28px;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid rgba(45, 90, 39, 0.1);
}

.control-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
}

.control-icon {
  font-size: 1rem;
}

.control-text {
  color: #718096;
}

.control-divider {
  width: 1px;
  height: 20px;
  background: linear-gradient(to bottom, transparent, #e2e8f0, transparent);
  margin: 0 12px;
}
</style>