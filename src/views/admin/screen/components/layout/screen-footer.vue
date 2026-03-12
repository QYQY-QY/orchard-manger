<!-- src/views/screen/components/layout/screen-footer.vue -->
<template>
  <div class="screen-footer">
    <div class="footer-content">
      <span class="copyright">{{ copyright }}</span>
      <span class="separator">|</span>
      <span class="version">数据大屏 v2.0</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  copyright: string
}>()
</script>

<style scoped>
.screen-footer {
  height: 40px;
  background: rgba(10, 26, 42, 0.8);
  border-top: 1px solid #ff8c0044;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 13px;
  backdrop-filter: blur(5px);
  z-index: 10;
}

.footer-content {
  display: flex;
  gap: 20px;
  letter-spacing: 0.5px;
}

.separator {
  color: #ff8c00;
}

.version {
  color: #ffaa00;
}
</style>