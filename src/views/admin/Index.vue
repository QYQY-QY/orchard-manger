<template>
  <div class="dashboard-container">
    <Bg3D />
    <ScreenHeader />
    <div class="dashboard-main">
      <div class="panel-left">
        <ScreenLeft />
      </div>
      <div class="panel-center"></div>
      <div class="panel-right">
        <ScreenRight />
      </div>
    </div>
  </div>
</template>

<script setup>
import Bg3D from '@/views/admin/screen/OrchardScene.vue'
import ScreenHeader from '@/views/admin/screen/layout/ScreenHeader.vue'
import ScreenLeft from '@/views/admin/screen/layout/ScreenLeft.vue'
import ScreenRight from '@/views/admin/screen/layout/ScreenRight.vue'
</script>

<style scoped>
.dashboard-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  color: #fff;
}

.dashboard-main {
  position: absolute;
  top: 80px;
  left: 0;
  right: 0;
  bottom: 0;
  /* 紧贴底部 */
  display: flex;
  gap: 20px;
  pointer-events: none;
}

.panel-left,
.panel-right {
  width: 310px;
  height: 100%;
  pointer-events: auto;
  z-index: 2;
  background: linear-gradient(to right, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);
  border-radius: 0;
}

.panel-right {
  background: linear-gradient(to left, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);
}

.panel-center {
  flex: 1;
  height: 100%;
  pointer-events: none;
  background: transparent;
  z-index: 2;
}

.bg-3d {
  z-index: 0;
}
</style>