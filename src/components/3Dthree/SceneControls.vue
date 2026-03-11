<template>
  <div class="hover-hint" :style="{ opacity: showDetail ? 0 : 0.7 }">
    👆 鼠标悬停区域会凸起 | 点击查看详情
  </div>
  <div class="controls-note">🖱️ 鼠标拖动旋转 | 滚轮缩放 | 悬停凸起效果</div>
</template>

<script setup>
// 可以从父组件接收 showDetail 来控制提示透明度
defineProps({
  showDetail: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.hover-hint {
  position: absolute;
  top: 180px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 140, 0, 0.9);
  color: white;
  padding: 8px 20px;
  border-radius: 40px;
  font-size: 1rem;
  font-weight: bold;
  z-index: 150;
  pointer-events: none;
  animation: pulse 2s infinite;
  backdrop-filter: blur(4px);
  border: 1px solid #ffd966;
  transition: opacity 1s;
}

@keyframes pulse {
  0% { opacity: 0.7; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.05); background: rgba(255, 120, 0, 0.9); }
  100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
}

.controls-note {
  position: absolute;
  bottom: 20px;
  left: 20px;
  color: rgba(255,255,255,0.5);
  font-size: 0.8rem;
  background: rgba(0,0,0,0.3);
  padding: 4px 12px;
  border-radius: 20px;
  pointer-events: none;
  z-index: 100;
}
</style>