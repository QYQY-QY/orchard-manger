<template>
  <div class="dashboard-container">
    <!-- 3D 背景 -->
    <Bg3D />
    
    <!-- 头部 -->
    <ScreenHeader />
    
    <!-- 主要内容区：左面板 + 中间占位 + 右面板 -->
    <div class="dashboard-main">
      <ScreenLeft class="panel-left" />
      
      <!-- 中间占位区域：透明、不阻挡交互，仅用于维持左右面板位置 -->
      <div class="panel-center"></div>
      
      <ScreenRight class="panel-right" />
    </div>
  </div>
</template>

<script setup>
import Bg3D from './screen/OrchardScene.vue'
import ScreenHeader from './screen/layout/ScreenHeader.vue'
import ScreenLeft from './screen/layout/ScreenLeft.vue'
import ScreenRight from './screen/layout/ScreenRight.vue'
// import useStore from 'element-plus/es/components/table/src/store';
</script>

<style scoped>
.dashboard-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  color: #fff;
  font-family: 'Microsoft YaHei', sans-serif;
}

.dashboard-main {
  position: absolute;
  top: 80px;        /* 头部高度 */
  left: 20px;
  right: 20px;
  bottom: 20px;
  display: flex;
  gap: 20px;
  pointer-events: none; /* 允许背景点击，内部面板需恢复 */
}

.panel-left,
.panel-right {
  width: 280px;              /* 固定宽度 */
  height: 100%;
  pointer-events: auto;      /* 恢复面板内交互 */
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 2;
}

.panel-center {
  flex: 1;                   /* 占据剩余空间，维持左右面板间距 */
  height: 100%;
  pointer-events: none;      /* 鼠标事件穿透，让背景可交互 */
  background: transparent;   /* 完全透明 */
  border-radius: 16px;
  overflow: hidden;
  z-index: 2;
}

/* Bg3D 作为背景，确保在最底层 */
.bg-3d {
  z-index: 0;
}
</style>