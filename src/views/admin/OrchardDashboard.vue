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
  font-family: 'Microsoft YaHei', sans-serif;
}

.fixed-title {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(145deg, #6b4f3c, #8b5e3c);
  color: #ffd966;
  padding: 16px 48px;
  border-radius: 60px;
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: 8px;
  text-shadow: 0 4px 15px rgba(0,0,0,0.7), 0 0 20px #ffb347;
  border: 2px solid #ff8c42;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  z-index: 200;
  backdrop-filter: blur(4px);
  white-space: nowrap;
  pointer-events: none;
}

.fixed-title::before {
  content: "🍎";
  margin-right: 20px;
  font-size: 2.2rem;
  filter: drop-shadow(0 2px 5px #ff6b6b);
}

.fixed-title::after {
  content: "🍊";
  margin-left: 20px;
  font-size: 2.2rem;
  filter: drop-shadow(0 2px 5px #ffaa00);
}
</style>