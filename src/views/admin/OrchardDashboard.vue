<template>
  <div class="dashboard-screen">
    <!-- 大屏布局组件：头部 -->
    <screen-header
      :title="headerTitle"
      :update-time="updateTime"
      @refresh="handleRefresh"
    />

    <!-- 核心内容区域：地图 + 卡片 + 图表 -->
    <div class="dashboard-main">
      <!-- 左侧卡片/图表区域（column） -->
      <div class="left-panel">
        <!-- 核心指标卡片 -->
        <number-card
          title="今日采摘量"
          :value="todayHarvest"
          unit="吨"
          :trend="+5.2"
        />
        <number-card
          title="累计产量"
          :value="totalYield"
          unit="万吨"
          :trend="+3.1"
        />
        <!-- 饼图组件：品类占比 -->
        <pie-chart
          :data="categoryData"
          :loading="chartLoading"
          height="220px"
        />
      </div>

      <!-- 中间核心地图区域：立体平面地图，仅保留基础光影 -->
      <div class="map-wrapper">
        <map-chart
          ref="mapChartRef"
          :county-data="citrusCounties"
          :loading="mapLoading"
          @map-ready="onMapReady"
        />
        <!-- 浮动的状态卡片可叠加在地图上，但为了简洁，独立在右侧 -->
      </div>

      <!-- 右侧面板：柱状图 + 折线图 -->
      <div class="right-panel">
        <status-card
          title="设备在线率"
          :value="deviceOnlineRate"
          unit="%"
          :status="onlineStatus"
        />
        <bar-chart
          title="主产县产量对比"
          :data="barData"
          :loading="chartLoading"
          height="220px"
        />
        <line-chart
          title="周采摘趋势"
          :data="lineData"
          :loading="chartLoading"
          height="180px"
        />
      </div>
    </div>

    <!-- 大屏底部 -->
    <screen-footer :copyright="footerCopyright" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
// import InfoPanel from '@/components/3Dthree/infoPanel.vue'
// import StatsPanel from '@/components/3Dthree/StatsPanel.vue'
// import ZoneDetailModal from '@/components/3Dthree/ZoneDetailModal.vue'
// import OrchardScene from '@/components/3Dthree/orchardScene.vue'
// import SceneControls from '@/components/3Dthree/SceneControls.vue'

// 大屏专属子组件按结构引入
import ScreenHeader from '@/views/admin/screen/components/layout/screen-header.vue'
import ScreenFooter from '@/views/admin/screen/components/layout/screen-footer.vue'
import NumberCard from '@/views/admin/screen/components/card/number-card.vue'
import StatusCard from '@/views/admin/screen/components/card/status-card.vue'
import PieChart from '@/views/admin/screen/components/chart/pie-chart.vue'
import BarChart from '@/views/admin/screen/components/chart/bar-chart.vue'
import LineChart from '@/views/admin/screen/components/chart/line-chart.vue'
import MapChart from '@/views/admin/screen/components/chart/map-chart.vue'

// 模拟数据/API请求（实际可使用useRequest hook）
import { useFormat } from '@/views/admin/screen/hooks/use-format'

// 屏幕适配逻辑（分辨率）
import { useScreenAdapt } from '@/views/admin/screen/hooks/use-screen-adapt'

// 屏幕适配逻辑 (分辨率)
useScreenAdapt()

// 标题与版权
const headerTitle = '浙江省桔园分布 · 产业大屏'
const footerCopyright = '© 2025 桔园管理 数据可视化平台'
const updateTime = ref('2025-03-11 14:30')

// 模拟指标数据
const todayHarvest = ref(1250.8)
const totalYield = ref(328.4)
const deviceOnlineRate = ref(98.5)
const onlineStatus = ref('success') // success / warning / danger

// 图表加载状态
const chartLoading = ref(false)
const mapLoading = ref(false)

// 饼图数据：品类占比
const categoryData = ref([
  { name: '温州蜜柑', value: 45 },
  { name: '椪柑', value: 28 },
  { name: '脐橙', value: 18 },
  { name: '其他', value: 9 }
])

// 柱状图数据：主产县产量
const barData = ref([
  { name: '临海', value: 60 },
  { name: '象山', value: 50 },
  { name: '常山', value: 55 },
  { name: '瑞安', value: 50 },
  { name: '黄岩', value: 55 }
])

// 折线图数据：周采摘趋势
const lineData = ref([
  { name: '周一', value: 320 },
  { name: '周二', value: 332 },
  { name: '周三', value: 301 },
  { name: '周四', value: 334 },
  { name: '周五', value: 390 },
  { name: '周六', value: 410 },
  { name: '周日', value: 380 }
])

// 地图数据：基于原html中的主产县列表 (经纬度 + 产量count)
const citrusCounties = ref([
  // 台州
  { name: '临海', lng: 121.12, lat: 28.85, count: 60 },
  { name: '黄岩', lng: 121.27, lat: 28.65, count: 55 },
  { name: '温岭', lng: 121.37, lat: 28.37, count: 45 },
  { name: '三门', lng: 121.38, lat: 29.12, count: 35 },
  { name: '天台', lng: 121.03, lat: 29.13, count: 30 },
  { name: '仙居', lng: 120.73, lat: 28.87, count: 30 },
  { name: '玉环', lng: 121.23, lat: 28.13, count: 25 },
  // 宁波
  { name: '象山', lng: 121.87, lat: 29.48, count: 50 },
  { name: '宁海', lng: 121.43, lat: 29.28, count: 45 },
  { name: '奉化', lng: 121.40, lat: 29.65, count: 40 },
  { name: '余姚', lng: 121.15, lat: 30.03, count: 25 },
  { name: '慈溪', lng: 121.23, lat: 30.17, count: 20 },
  // 温州
  { name: '永嘉', lng: 120.68, lat: 28.15, count: 45 },
  { name: '平阳', lng: 120.57, lat: 27.67, count: 40 },
  { name: '苍南', lng: 120.42, lat: 27.52, count: 45 },
  { name: '瑞安', lng: 120.65, lat: 27.78, count: 50 },
  { name: '乐清', lng: 120.95, lat: 28.12, count: 55 },
  { name: '文成', lng: 120.08, lat: 27.78, count: 20 },
  { name: '泰顺', lng: 119.72, lat: 27.57, count: 15 },
  // 衢州
  { name: '常山', lng: 118.52, lat: 28.90, count: 55 },
  { name: '衢江', lng: 118.95, lat: 28.98, count: 50 },
  { name: '江山', lng: 118.62, lat: 28.75, count: 45 },
  { name: '开化', lng: 118.42, lat: 29.13, count: 40 },
  { name: '龙游', lng: 119.17, lat: 29.03, count: 45 }
  // 其余略，保持简洁但足够呈现
])

const mapChartRef = ref<InstanceType<typeof MapChart>>()

// 刷新事件
const handleRefresh = () => {
  updateTime.value = useFormat().formatDate(new Date(), 'yyyy-MM-dd HH:mm')
  chartLoading.value = true
  mapLoading.value = true
  // 模拟请求延迟
  setTimeout(() => {
    chartLoading.value = false
    mapLoading.value = false
  }, 600)
}

const onMapReady = () => {
  console.log('立体地图已加载，仅保留平面与光电')
}

// 大屏分辨率适配逻辑在 hook 中执行
onMounted(() => {
  // 可触发一次数据加载
  handleRefresh()
})
</script>

<style scoped>
.dashboard-screen {
  width: 100vw;
  height: 100vh;
  background: #0a1a2a;  /* 深空背景，与html保持统一 */
  color: #e0e0e0;
  font-family: 'Microsoft YaHei', sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.dashboard-main {
  flex: 1;
  display: flex;
  padding: 16px 20px;
  gap: 20px;
  min-height: 0; /* 防止flex溢出 */
}

/* 左右面板固定宽度，中间地图自适应 */
.left-panel,
.right-panel {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #ff8c0044 #0a1a2a;
}

.left-panel::-webkit-scrollbar,
.right-panel::-webkit-scrollbar {
  width: 4px;
}
.left-panel::-webkit-scrollbar-thumb,
.right-panel::-webkit-scrollbar-thumb {
  background: #ff8c0066;
  border-radius: 4px;
}

.map-wrapper {
  flex: 1;
  min-width: 0; /* 防止flex撑开 */
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  border: 1px solid rgba(255, 140, 0, 0.2);
  box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(2px);
  overflow: hidden;
  position: relative;
}

/* 确保map-chart组件内部canvas/three容器占满 */
.map-wrapper :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}
</style>