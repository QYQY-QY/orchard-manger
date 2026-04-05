<!--
  水肥精准管控决策页面
  1. 顶部5个卡片：水肥缺失统计，独立接口 /api/water/deficit
  2. 中间多光谱图表：植被指数数据，独立接口 /api/water/spectral
  3. 两个接口分开请求，不合并
  4. 纯文字展示，无图标
-->
<template>
  <div class="water-dashboard">
    <!-- 页面头部：标题 + 返回按钮 + 操作按钮 -->
    <div class="header">
      <div class="title-section">
        <div class="title-with-back">
          <!-- 返回上一页按钮 -->
          <button class="back-btn" @click="goBack">返回</button>
          <h1>水肥精准管控决策
            <span class="region-badge" v-if="regionInfo.regionId">汤村</span>
          </h1>
        </div>
      </div>

      <!-- 右侧功能按钮区 -->
      <div class="header-actions">
        <!-- 数据更新按钮 -->
        <button class="analyze-btn" @click="handleDataUpdate" :disabled="isAnalyzing">
          {{ isAnalyzing ? '更新中...' : '数据更新' }}
        </button>

        <!-- 隐藏的文件夹选择框 -->
        <input type="file" ref="folderInput" class="file-input" multiple webkitdirectory directory
          @change="handleFolderSelect">

        <!-- 上传进度条显示 -->
        <div v-if="uploadProgress.show" class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: uploadProgress.percentage + '%' }"></div>
          </div>
          <span class="progress-text">{{ uploadProgress.message }}</span>
        </div>

        <!-- 图片预览区域 -->
        <div v-if="previewImages.length > 0" class="image-preview-container">
          <div class="image-preview-trigger" @mouseenter="showPreview = true" @mouseleave="showPreview = false">
            <span>{{ previewImages.length }}张图片</span>
          </div>
          <!-- 预览弹窗 -->
          <div v-if="showPreview" class="image-preview-popup">
            <div v-for="(img, idx) in previewImages.slice(0, 9)" :key="idx" class="preview-item">
              <img :src="img" />
            </div>
            <div v-if="previewImages.length > 9" class="preview-more">
              +{{ previewImages.length - 9 }}张
            </div>
          </div>
        </div>

        <!-- 最后一次数据更新时间 -->
        <div class="update-time">
          上次数据更新：{{ analysisDate }}
        </div>
      </div>
    </div>

    <!-- 顶部5个统计卡片：缺氮、缺磷、缺钾、缺水、其他 -->
    <div class="deficit-row">
      <div v-for="(item, index) in deficitData" :key="index" class="deficit-card" :class="item.type">
        <div class="deficit-title">{{ item.label }}</div>
        <div class="deficit-number">
          {{ item.count }}
          <span class="deficit-unit">{{ item.unit }}</span>
        </div>
        <div>{{ item.percentage }}</div>
      </div>
    </div>

    <!-- 主体双栏布局 -->
    <div class="two-col">
      <!-- 左侧栏：多光谱图表 + 施肥建议 -->
      <div>
        <!-- 多光谱植被指数图表 -->
        <div class="diagnostic-card">
          <div class="section-title">植被指数分布 · 多光谱反演</div>
          <div class="vi-bar-chart">
            <div v-for="(item, index) in viChartData" :key="index" class="bar-item">
              <div class="bar-label">{{ item.label }}</div>
              <div class="bar">
                <div class="bar-fill" :class="item.colorClass" :style="{ height: item.height + '%' }"></div>
              </div>
              <span class="bar-value">{{ item.value.toFixed(2) }}</span>
            </div>
          </div>
          <!-- 营养状态标签 -->
          <div class="plot-tag">
            <span>营养状态统计：</span>
            <span class="status-badge" v-for="(status, index) in nutrientStats" :key="index">
              {{ status.label }}: {{ status.count }}
            </span>
            <span class="heat-badge">{{ totalSamples }}个采样点</span>
          </div>
        </div>

        <!-- 精准施肥建议列表 -->
        <div class="advice-card">
          <div class="section-title">精准施肥建议</div>
          <div v-for="(advice, index) in adviceData" :key="index" class="advice-item">
            <span>{{ advice.location }}</span>
            <span>{{ advice.suggestion }}</span>
            <span class="advice-badge" :style="{ background: advice.badgeColor }">
              {{ advice.status }}
            </span>
          </div>
          <div class="advice-footer">
            执行时间窗口: 今日18:00前 / 明日05:00-09:00
          </div>
        </div>
      </div>

      <!-- 右侧栏：地块分布 + 指数分析 -->
      <div>
        <!-- 地块网格卡片 -->
        <div class="plot-grid-card">
          <div class="section-title">
            地块分布 · 汤村
            <span class="plot-count">{{ plotBlocks.length }}个地块</span>
          </div>

          <!-- 地块网格 -->
          <div class="plot-grid grid-2x6">
            <div v-for="(block, index) in plotBlocks" :key="index" class="plot-block" :class="{
              'plot-executed': block.status === 'executed',
              'plot-pending': block.status === 'pending',
              'plot-warning': block.status === 'warning'
            }" @click="handlePlotClick(block)">
              <div class="plot-content">
                <span class="plot-id">{{ block.id }}</span>
              </div>
            </div>
          </div>

          <!-- 地块状态图例 -->
          <div class="plot-legend">
            <div class="legend-item">
              <span class="legend-color executed"></span>
              <span>已执行</span>
            </div>
            <div class="legend-item">
              <span class="legend-color pending"></span>
              <span>待执行</span>
            </div>
            <div class="legend-item">
              <span class="legend-color warning"></span>
              <span>异常</span>
            </div>
          </div>

          <!-- 地块数量统计 -->
          <div class="plot-stats">
            <div class="stat-item">
              <span>已执行: {{ getPlotCountByStatus('executed') }}</span>
            </div>
            <div class="stat-item">
              <span>待执行: {{ getPlotCountByStatus('pending') }}</span>
            </div>
            <div class="stat-item">
              <span>异常: {{ getPlotCountByStatus('warning') }}</span>
            </div>
          </div>
        </div>

        <!-- 植被指数分析卡片 -->
        <div class="trend-card">
          <div class="section-title">植被指数分析</div>
          <div>NDVI (归一化植被指数) 分布</div>
          <div class="stats-box">
            <div class="stat-item" v-for="(stat, index) in viStats" :key="index">
              <span class="stat-label">{{ stat.label }}:</span>
              <span class="stat-value">{{ stat.value }}</span>
            </div>
          </div>
          <!-- 指数相关性 -->
          <div class="correlation-box">
            NDVI与各指数相关性:
            <span class="corr-tag" v-for="(corr, idx) in correlations" :key="idx">
              {{ corr.name }}: r={{ corr.value }}
            </span>
          </div>
        </div>

        <!-- 指数分布特征 -->
        <div class="correl-card">
          <div class="section-title">植被指数分布特征</div>
          <div class="correl-scatter">
            <span v-for="n in 7" :key="n" class="scatter-dot" :style="{ background: scatterColors[n - 1] }"></span>
          </div>
          <!-- 均值展示 -->
          <div class="correl-stats">
            <span>NDVI μ={{viStats.find(s => s.label === '均值')?.value}}</span>
            <span>NDRE μ={{ ndreStats.mean.toFixed(2) }}</span>
            <span>NDWI μ={{ ndwiStats.mean.toFixed(2) }}</span>
          </div>
          <div class="correl-footer">
            多光谱反演精度 94% · 采样点 {{ totalSamples }}个
          </div>
        </div>
      </div>
    </div>

    <!-- 底部提示信息 -->
    <div class="drill-footer">
      <span>跨屏联动: 点击缺失株/地块可跳转至病虫害/农事调度</span>
      <span>基于多光谱 {{ analysisDate }} 更新</span>
    </div>

    <!-- 底部微数据概览 -->
    <div class="micro-data">
      <span>缺氮{{ nutrientCounts.n }} 缺磷{{ nutrientCounts.p }} 缺钾{{ nutrientCounts.k }}
        缺水{{ nutrientCounts.water }} 其他{{ nutrientCounts.other }}</span>
      <span>NDVI: {{viStats.find(s => s.label === '均值')?.value}} ±{{viStats.find(s => s.label === '标准差')?.value}}</span>
      <span>采样点: {{ totalSamples }}个</span>
      <span>NDRE: {{ ndreStats.mean.toFixed(2) }}</span>
      <span>NDWI: {{ ndwiStats.mean.toFixed(2) }}</span>
      <span>节本增效 ¥{{ saveCost }}</span>
      <span>NDVI-NDRE r={{(Number(correlations.find(c => c.name === 'NDRE')?.value) || 0.68).toFixed(2)}}</span>
    </div>

    <!-- 分析结果弹窗组件 -->
    <AnalysisResultModal :show="showResultModal" :analysis-data="currentAnalysisData" :images="analysisImages"
      :region-info="currentRegionInfo" :modal-title="modalTitle" @close="handleCloseModal"
      @apply="handleApplySuggestion" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import AnalysisResultModal from './AnalysisResultModal.vue'

// 路由实例
const router = useRouter()
const route = useRoute()

// 从路由获取区域、地块参数，并处理中文数字转阿拉伯数字
const regionInfo = computed(() => {
  const region = route.query.region || '1'
  let regionId = route.query.regionId || '1'
  const chineseToNumber = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5' }
  if (chineseToNumber[regionId]) regionId = chineseToNumber[regionId]
  return { region, regionId }
})

// 果园ID
const orchardId = computed(() => route.query.orchardId || '1')

// 页面加载状态
const isAnalyzing = ref(false)           // 全局加载中
const isLoadingPlot = ref(false)         // 地块详情加载中
const folderInput = ref(null)            // 文件选择框DOM引用
const previewImages = ref([])            // 图片预览地址数组
const showPreview = ref(false)           // 是否显示预览弹窗

// 上传进度对象
const uploadProgress = ref({
  show: false,
  percentage: 0,
  message: ''
})

// 弹窗相关数据
const showResultModal = ref(false)        // 控制分析弹窗显示
const analysisImages = ref([])            // 弹窗图片
const currentAnalysisData = ref({})       // 当前地块分析数据
const selectedBlockId = ref('')           // 当前选中地块ID
const modalTitle = ref('多光谱分析结果')   // 弹窗标题
const currentRegionInfo = ref({ regionId: '1', region: '1' })

// 页面展示基础数据
const totalSamples = ref(989)            // 采样点总数
const analysisDate = ref('')             // 分析时间
const saveCost = ref(4260)               // 节本增效金额

// 顶部5个水肥缺失卡片数据
const deficitData = ref([])

// 多光谱图表相关数据
const nutrientStats = ref([])             // 营养状态统计
const nutrientCounts = ref({ n: 0, p: 0, k: 0, water: 0, other: 0 })
const viChartData = ref([])               // 柱状图数据
const viStats = ref([])                   // NDVI统计
const ndreStats = ref({ mean: 0, std: 0, min: 0, max: 0 })
const ndwiStats = ref({ mean: 0, std: 0, min: 0, max: 0 })
const correlations = ref([])              // 相关性数据

// 施肥建议与地块数据
const adviceData = ref([])
const plotBlocks = ref([])
// 散点图颜色数组
const scatterColors = ['#1b7b44', '#3ba363', '#308254', '#56a06b', '#71ba83', '#c45d32', '#7ac48a']

// 页面挂载后执行
onMounted(() => {
  // 初始化当前时间
  analysisDate.value = getCurrentTime()
  // 分别加载两个接口数据
  loadDeficitData()
  loadSpectralData()
  // 点击外部关闭菜单
  document.addEventListener('click', handleClickOutside)
})

// 页面卸载时清除事件
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 获取格式化当前时间：YYYY-MM-DD HH:mm:ss
const getCurrentTime = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

// 点击外部区域关闭下拉菜单
const handleClickOutside = (e) => {
  if (!e.target.closest('.upload-dropdown')) showUploadMenu.value = false
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 请求顶部水肥缺失统计数据
const loadDeficitData = async () => {
  try {
    isAnalyzing.value = true
    // 请求水肥缺失数据
    const res = await axios.get('/api/water/deficit', {
      params: {
        regionId: regionInfo.value.regionId,
        orchardId: orchardId.value
      }
    })
    if (res.data.code === 200) {
      deficitData.value = res.data.data
    }
  } catch (err) {
    console.error('加载水肥缺失数据失败', err)
  } finally {
    isAnalyzing.value = false
  }
}

// 请求多光谱图表数据+格式化+渲染
//————————————————————
const loadSpectralData = async () => {
  try {
    isAnalyzing.value = true

    // 正确获取参数
    const oId = orchardId.value
    const aId = regionInfo.value.regionId

    // 真实接口
    const res = await axios.get(`/AI/getAnalyze/${oId}/${aId}`)

    if (res.data.code === 200) {
      const data = res.data.data

      // ========== 多光谱图表数据 ==========
      viChartData.value = data.viChartData || []
      viStats.value = data.viStats || []
      ndreStats.value = data.ndreStats || { mean: 0, std: 0, min: 0, max: 0 }
      ndwiStats.value = data.ndwiStats || { mean: 0, std: 0, min: 0, max: 0 }
      correlations.value = data.correlations || []

      // ========== 营养与施肥 ==========
      nutrientStats.value = data.nutrientStats || []
      nutrientCounts.value = data.nutrientCounts || { n: 0, p: 0, k: 0, water: 0, other: 0 }
      adviceData.value = data.adviceData || []

      // ========== 地块 ==========
      plotBlocks.value = data.plotBlocks || []
      totalSamples.value = data.totalSamples || 0
      saveCost.value = data.saveCost || 0
    }
  } catch (err) {
    console.error('多光谱分析数据获取失败', err)
  } finally {
    isAnalyzing.value = false
  }
}

// 点击单个地块，查看该地块详细分析
const handlePlotClick = async (block) => {
  isLoadingPlot.value = true
  try {
    //定义传参
    const rId = block.id

    // axios获取地块多光谱数据
    const res = await axios.get(`/AI/analyzePlus/${rId}`)

    if (res.data.code === 200) {
      const data = res.data.data

      // 把后端数据结构 适配弹窗
      currentAnalysisData.value = {
        blockId: block.id,
        location: block.location || block.id,

        // 把多光谱指数放进去
        ndvi: data.ndvi ?? 0,
        ndre: data.ndre ?? 0,
        ndwi: data.ndwi ?? 0,

        // 建议内容（
        analyzeSuggestion: data.suggestion || data.analyzeSuggestion || '暂无建议',

        // 弹窗可能需要的字段
        nutrientStatus: data.nutrientStatus || '正常',
        growthStatus: data.growthStatus || '良好',
      }

      // 图片
      analysisImages.value = data.imageUrls || []
    }

    // 调用弹窗
    showResultModal.value = true
  } catch (err) {
    console.error('获取地块详情失败', err)
  } finally {
    isLoadingPlot.value = false
  }
}

// 关闭分析结果弹窗
const handleCloseModal = () => {
  showResultModal.value = false
}

// 应用水肥建议，跳转发布任务页面
const handleApplySuggestion = (analysisData) => {
  const taskContent = analysisData.analyzeSuggestion || ''
  // 根据内容判断任务类型：浇水/施肥
  let taskType = '施肥'
  if (/浇水|水分/.test(taskContent)) taskType = '浇水'

  // 跳转到任务管理页面并携带参数
  router.push({
    path: '/adminMission',
    query: {
      action: 'publish',
      taskType,
      content: taskContent,
      areaId: currentRegionInfo.value.regionId,
      areaName: selectedBlockId.value
    }
  })
}

// 点击“数据更新”，触发文件选择框
const handleDataUpdate = () => {
  if (isAnalyzing.value) return
  folderInput.value.click()
}

// 选择图片文件夹后触发
const handleFolderSelect = async (e) => {
  const files = Array.from(e.target.files)
  if (files.length === 0) return
  isAnalyzing.value = true

  try {
    // 过滤图片并上传
    await processImageFiles(files.filter(f => f.type.includes('image')))
    // 上传完成后重新拉取数据
    await loadDeficitData()
    await loadSpectralData()
    // 更新时间
    analysisDate.value = getCurrentTime()
  } catch (err) {
    console.error(err)
  } finally {
    isAnalyzing.value = false
    // 清空input，防止重复选择同一文件夹不触发
    e.target.value = ''
  }
}

// 处理图片预览与上传
const processImageFiles = async (files) => {
  // 显示上传中进度
  uploadProgress.value = { show: true, percentage: 30, message: '正在处理图片...' }

  // 生成本地预览URL
  previewImages.value = []
  for (const f of files) {
    const url = URL.createObjectURL(f)
    previewImages.value.push(url)
  }

  // 构造formData上传
  const form = new FormData()
  files.forEach(f => form.append('images', f))
  uploadProgress.value = { show: true, percentage: 60, message: '正在上传...' }

  // 上传图片到后端
  await axios.post('/api/water/upload-images', form, {
    params: { regionId: regionInfo.value.regionId, orchardId: orchardId.value }
  })

  // 上传完成
  uploadProgress.value = { show: true, percentage: 100, message: '上传完成' }
  setTimeout(() => uploadProgress.value.show = false, 2000)
}


// 根据状态统计地块数量
const getPlotCountByStatus = (status) => {
  return plotBlocks.value.filter(b => b.status === status).length
}
</script>

<style scoped>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', sans-serif;
}

/* 页面主容器 */
.water-dashboard {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 56px;
  box-shadow: 0 40px 60px -20px #1b4f31;
  padding: 32px 36px 40px 36px;
  border: 2px solid rgba(90, 170, 130, 0.6);
}

/* 头部布局 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 20px;
}

/* 标题+返回按钮容器 */
.title-with-back {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

/* 返回按钮 */
.back-btn {
  background: #fff;
  border: 1px solid #60b282;
  color: #11532f;
  padding: 10px 20px;
  border-radius: 40px;
  cursor: pointer;
}

.back-btn:hover {
  background: #60b282;
  color: #fff;
}

/* 主标题 */
.title-section h1 {
  font-size: 2.3rem;
  color: #11532f;
  display: flex;
  align-items: center;
  gap: 18px;
}

/* 区域标签 */
.region-badge {
  background: #2a8b54;
  color: white;
  padding: 6px 18px;
  border-radius: 40px;
  font-size: 1.4rem;
}

/* 右侧按钮组 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

/* 隐藏原生文件选择框 */
.file-input {
  display: none;
}

/* 数据更新按钮 */
.analyze-btn {
  background: #2a8b54;
  color: white;
  padding: 10px 24px;
  border-radius: 40px;
  border: none;
  cursor: pointer;
}

.analyze-btn:disabled {
  opacity: 0.6;
}

/* 更新时间标签 */
.update-time {
  background: #effaf2;
  border-radius: 100px;
  padding: 10px 26px;
  color: #1f6d40;
  border: 1px solid #abd8b8;
}

/* 上传进度条浮层 */
.upload-progress {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 250px;
}

/* 进度条外框 */
.progress-bar {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

/* 进度条填充 */
.progress-fill {
  height: 100%;
  background: #2a8b54;
  transition: width 0.3s;
}

/* 进度文字 */
.progress-text {
  font-size: 0.8rem;
  color: #1d5f3a;
}

/* 图片预览触发按钮 */
.image-preview-trigger {
  background: #e8f5e9;
  border-radius: 30px;
  padding: 8px 16px;
  cursor: pointer;
  color: #1d6b40;
  border: 1px solid #9ccc9c;
}

/* 图片预览弹窗 */
.image-preview-popup {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 100;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

/* 单个预览图容器 */
.preview-item {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e0f2e0;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 顶部5个卡片布局 */
.deficit-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 18px;
  margin-bottom: 28px;
}

/* 单个水肥缺失卡片 */
.deficit-card {
  background: white;
  border-radius: 28px;
  padding: 18px 16px;
  box-shadow: 0 10px 20px -12px #1e5438;
  border: 1px solid #b9e0cc;
  border-bottom: 6px solid;
}

/* 不同类型卡片底部颜色 */
.deficit-card.n {
  border-bottom-color: #5f9ea0;
}

.deficit-card.p {
  border-bottom-color: #e1ad5d;
}

.deficit-card.k {
  border-bottom-color: #c45d32;
}

.deficit-card.water {
  border-bottom-color: #4794b3;
}

.deficit-card.other {
  border-bottom-color: #7fbf8f;
}

/* 卡片标题 */
.deficit-title {
  font-size: 0.85rem;
  color: #3c6d50;
  margin-bottom: 6px;
  text-transform: uppercase;
}

/* 卡片数字 */
.deficit-number {
  font-size: 2.2rem;
  font-weight: 800;
  color: #1d4f31;
  line-height: 1;
}

/* 主体双栏布局 */
.two-col {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 26px;
  margin-bottom: 32px;
}

/* 公共卡片样式 */
.diagnostic-card,
.advice-card,
.plot-grid-card,
.trend-card,
.correl-card {
  background: #f5fff9;
  border-radius: 38px;
  padding: 26px;
  border: 1px solid #c2e6d5;
  margin-bottom: 20px;
}

/* 区块标题 */
.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #175a34;
  margin-bottom: 16px;
}

/* 地块数量标签 */
.plot-count {
  font-size: 0.9rem;
  background: #e0f2e0;
  padding: 4px 12px;
  border-radius: 30px;
  color: #1d6b40;
  margin-left: 10px;
}

/* 多光谱柱状图容器 */
.vi-bar-chart {
  display: flex;
  justify-content: space-around;
  margin: 20px 0;
  background: #e2f3e8;
  border-radius: 60px;
  padding: 22px 12px;
}

/* 单个柱状图项 */
.bar-item {
  text-align: center;
  width: 60px;
}

.bar-label {
  font-weight: 600;
  color: #1a5b37;
  margin-bottom: 6px;
}

/* 柱状图外框 */
.bar {
  height: 100px;
  width: 36px;
  background: #b8dcca;
  margin: 0 auto;
  border-radius: 30px;
  position: relative;
  overflow: hidden;
}

/* 柱状图填充 */
.bar-fill {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: #328f55;
  border-radius: 30px;
}

.bar-value {
  margin-top: 6px;
  font-weight: 700;
}

/* 标签组容器 */
.plot-tag {
  background: #e1f0e4;
  border-radius: 30px;
  padding: 16px;
  margin: 16px 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

/* 状态标签 */
.status-badge {
  background: #b7dfc2;
  padding: 4px 12px;
  border-radius: 30px;
}

.heat-badge {
  background: #b7dfc2;
  padding: 6px 18px;
  border-radius: 30px;
}

/* 施肥建议项 */
.advice-item {
  display: flex;
  background: #ecf9f0;
  border-radius: 50px;
  padding: 14px 22px;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0;
  border-left: 10px solid #3d9c6e;
  flex-wrap: wrap;
  gap: 10px;
}

/* 建议状态徽章 */
.advice-badge {
  color: white;
  padding: 4px 15px;
  border-radius: 40px;
}

.advice-footer {
  margin-top: 10px;
  background: #ecf9f0;
  border-radius: 30px;
  padding: 8px 16px;
}

/* 地块网格布局 2行6列 */
.grid-2x6 {
  display: grid;
  grid-template-columns: repeat(6, minmax(70px, 1fr));
  gap: 15px;
  margin: 20px 0;
  justify-items: center;
}

/* 单个地块块 */
.plot-block {
  width: 100%;
  max-width: 70px;
  height: 70px;
  background: #f0f9f2;
  border-radius: 12px;
  border: 2px solid #c8e6c9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plot-block:hover {
  transform: translateY(-3px);
}

/* 地块三种状态样式 */
.plot-executed {
  border-left: 6px solid #2a8b54;
  background: #e8f5e9;
}

.plot-pending {
  border-left: 6px solid #e68a3a;
  background: #fff8e7;
}

.plot-warning {
  border-left: 6px solid #c45d32;
  background: #ffeee8;
}

.plot-id {
  font-weight: 700;
  font-size: 1rem;
  color: #1d5f3a;
}

/* 图例行 */
.plot-legend {
  display: flex;
  gap: 20px;
  margin: 16px 0;
  padding: 12px;
  background: #ecf9ef;
  border-radius: 30px;
  justify-content: center;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 图例颜色块 */
.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.executed {
  background: #2a8b54;
}

.legend-color.pending {
  background: #e68a3a;
}

.legend-color.warning {
  background: #c45d32;
}

/* 统计行公共样式 */
.plot-stats,
.stats-box {
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #b8dfca;
  flex-wrap: wrap;
  gap: 10px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.85rem;
  color: #4a7a60;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1d5f3a;
}

/* 相关性标签组 */
.correlation-box {
  margin-top: 20px;
  background: #ecf9ef;
  border-radius: 40px;
  padding: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.corr-tag {
  background: #4794b3;
  color: white;
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 0.9rem;
}

/* 散点图容器 */
.correl-scatter {
  background: #f6fdf8;
  border-radius: 28px;
  padding: 18px;
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* 散点圆点 */
.scatter-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.correl-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 12px 0;
  flex-wrap: wrap;
}

.correl-footer {
  background: #e0efe3;
  border-radius: 30px;
  padding: 12px;
  text-align: center;
}

/* 底部提示栏 */
.drill-footer {
  margin-top: 24px;
  background: #e3f3e6;
  border-radius: 60px;
  padding: 16px 28px;
  display: flex;
  justify-content: space-between;
  color: #165f36;
  border: 1px solid #a0cfb0;
  flex-wrap: wrap;
  gap: 15px;
}

/* 底部微数据行 */
.micro-data {
  margin-top: 20px;
  font-size: 0.8rem;
  color: #2f704a;
  border-top: 1px dashed #a2cfb2;
  padding-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .grid-2x6 {
    grid-template-columns: repeat(6, minmax(60px, 1fr));
  }

  .plot-block {
    height: 60px;
  }
}

@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }

  .grid-2x6 {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .grid-2x6 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>