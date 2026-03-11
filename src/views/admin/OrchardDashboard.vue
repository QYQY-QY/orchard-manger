<template>
  <div class="orchard-dashboard">
    <!-- 左侧信息面板 -->
    <InfoPanel 
      :负责人="负责人"
      :总面积="总面积"
      :果树总数="果树总数"
      :年产量="年产量"
    />

    <!-- 固定在页面中上部的标题 -->
    <div class="fixed-title">智慧果园</div>

    <!-- 右侧统计面板 -->
    <StatsPanel 
      :种植区数量="种植区数量"
      :总面积="总面积"
      :果树总数="果树总数"
      :年产量="年产量"
    />

    <!-- 种植区详情弹窗 -->
    <ZoneDetailModal 
      :show="showDetail"
      :zone-data="selectedZone"
      @close="hideDetail"
    />

    <!-- 3D场景组件 -->
    <OrchardScene 
      ref="sceneRef"
      v-model:show-detail="showDetail"
      v-model:selected-zone="selectedZone"
      @update:stats="updateStats"
    />

    <!-- 控制提示 -->
    <SceneControls />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import InfoPanel from '@/components/3Dthree/InfoPanel.vue'
import StatsPanel from '@/components/3Dthree/StatsPanel.vue'
import ZoneDetailModal from '@/components/3Dthree/ZoneDetailModal.vue'
import OrchardScene from '@/components/3Dthree/OrchardScene.vue'
import SceneControls from '@/components/3Dthree/SceneControls.vue'

// 响应式数据
const 负责人 = ref('杨某某')
const 种植区数量 = ref(0)
const 总面积 = ref(0)
const 果树总数 = ref(0)
const 年产量 = ref(0)
const showDetail = ref(false)
const selectedZone = ref(null)
const sceneRef = ref(null)

// 更新统计数据
const updateStats = (stats) => {
  种植区数量.value = stats.zoneCount
  总面积.value = stats.totalArea
  果树总数.value = stats.totalTrees
  年产量.value = stats.totalYield
}

// 隐藏详情
const hideDetail = () => {
  showDetail.value = false
  selectedZone.value = null
}
</script>

<style scoped>
.orchard-dashboard {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.fixed-title {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #2d5a27 0%, #4a8c3f 50%, #2d5a27 100%);
  color: #fff;
  padding: 18px 60px;
  border-radius: 50px;
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: 6px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
  box-shadow: 0 8px 32px rgba(45, 90, 39, 0.4), inset 0 1px 0 rgba(255,255,255,0.2);
  z-index: 200;
  backdrop-filter: blur(10px);
  white-space: nowrap;
  pointer-events: none;
  border: 1px solid rgba(255,255,255,0.1);
}

.fixed-title::before {
  content: "🌳";
  margin-right: 16px;
  font-size: 2rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.fixed-title::after {
  content: "🍊";
  margin-left: 16px;
  font-size: 2rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}
</style>