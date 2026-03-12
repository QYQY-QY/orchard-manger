<template>
  <div class="dashboard-container">
    <!-- 3D 背景（可选，如果需要全局星空效果） -->
    <Bg3D />
    
    <!-- 头部 -->
    <ScreenHeader />
    
    <!-- 主要内容区：左面板 + 中间地图 + 右面板 -->
    <div class="dashboard-main">
      <ScreenLeft class="panel-left" />
      
      <!-- 中间3D地图区域 -->
      <div class="panel-center">
        <OrchardScene />
      </div>
      
      <ScreenRight class="panel-right" />
    </div>
  </div>
</template>

<script setup>
import Bg3D from './screen/OrchardScene.vue'
import ScreenHeader from './screen/layout/ScreenHeader.vue'
import ScreenLeft from './screen/layout/ScreenLeft.vue'
import ScreenRight from './screen/layout/ScreenRight.vue'
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
  pointer-events: none; /* 允许背景点击，但内部面板需要恢复 */
}

.panel-left,
.panel-right {
  width: 280px;              /* 固定宽度 */
  height: 100%;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 2;
}

.panel-center {
  flex: 1;                   /* 占据剩余空间 */
  height: 100%;
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.2);  /* 临时背景，可删除 */
  border-radius: 16px;
  overflow: hidden;           /* 确保地图圆角裁剪 */
  z-index: 2;
}

/* 如果 Bg3D 作为背景，确保它在最底层 */
.bg-3d {
  z-index: 0;
}
</style>