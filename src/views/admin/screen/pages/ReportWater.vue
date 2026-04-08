<!--
  水肥精准管控决策页面
  1. 接口1：/api/water/deficit  获取水肥缺失统计 → 渲染顶部5个卡片
  2. 接口2：/api/water/spectral 获取多光谱数据 → 渲染NDVI图表、地块列表、状态
  3. 接口3：/AI/analyzePlus/{id} 获取单地块水肥报告 → 点击地块弹窗渲染
  4. 两个接口分开请求，按顺序加载，不合并
  5. 纯文字展示，无图标
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

    <!-- ====================== 顶部5个统计卡片：水肥缺失株数 ====================== -->
    <!-- 数据来源：接口1 /api/water/deficit -->
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
        <!-- NDVI 植被指数图表 数据来源：接口2 -->
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

        <!-- 精准施肥建议 -->
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
        <!-- 地块网格卡片 数据来源：接口2 -->
        <div class="plot-grid-card">
          <div class="section-title">
            地块分布 · 汤村
            <span class="plot-count">{{ plotBlocks.length }}个地块</span>
          </div>

          <!-- 地块网格（完全从后端渲染） -->
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

        <!-- NDVI 统计分析 -->
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
      <span>NDVI-NDVI r={{(Number(correlations.find(c => c.name === 'NDRE')?.value) || 0.68).toFixed(2)}}</span>
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

// 路由工具
const router = useRouter()
const route = useRoute()

// 从路由获取合作社、地块参数
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
const isAnalyzing = ref(false)
const isLoadingPlot = ref(false)

// 文件上传相关
const folderInput = ref(null)
const previewImages = ref([])
const showPreview = ref(false)
const uploadProgress = ref({ show: false, percentage: 0, message: '' })

// 弹窗数据
const showResultModal = ref(false)
const analysisImages = ref([])
const currentAnalysisData = ref({})
const selectedBlockId = ref('')
const modalTitle = ref('多光谱分析结果')
const currentRegionInfo = ref({ regionId: '1', region: '1' })

// 页面展示基础数据
const totalSamples = ref(0)
const analysisDate = ref('')
const saveCost = ref(0)

// ====================== 页面渲染数据 ======================
// 顶部水肥缺失卡片数据
const deficitData = ref([])
// 营养状态统计
const nutrientStats = ref([])
// 缺氮磷钾等数量
const nutrientCounts = ref({ n: 0, p: 0, k: 0, water: 0, other: 0 })
// 多光谱柱状图数据
const viChartData = ref([])
// NDVI统计数据
const viStats = ref([])
// NDRE数据
const ndreStats = ref({ mean: 0, std: 0, min: 0, max: 0 })
// NDWI数据
const ndwiStats = ref({ mean: 0, std: 0, min: 0, max: 0 })
// 相关性数据
const correlations = ref([])
// 施肥建议
const adviceData = ref([])
// 地块列表（核心！从后端获取）
const plotBlocks = ref([])

// 散点图颜色
const scatterColors = ['#1b7b44', '#3ba363', '#308254', '#56a06b', '#71ba83', '#c45d32', '#7ac48a']

// 生命周期：页面加载后执行
onMounted(() => {
  // 初始化时间
  analysisDate.value = getCurrentTime()
  // 按顺序加载：
  // 第一步：先加载水肥缺失数据 → 渲染顶部卡片
  // 第二步：再加载多光谱数据 → 渲染图表、地块
  loadAllData()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

//工具函数
// 获取当前时间
function getCurrentTime() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

// 点击外部关闭菜单
const handleClickOutside = (e) => {
  if (!e.target.closest('.upload-dropdown')) return
}

// 返回上一页
const goBack = () => {
  router.back()
}

async function loadAllData() {
  // 1. 先加载水肥缺失数据
  await loadDeficitData()
  // 2. 再加载多光谱、地块数据
  await loadSpectralData()
} 

// ==============================================
// 作用：获取水肥缺失株数 → 渲染顶部5个卡片
// 参数：regionId 合作社ID、orchardId 果园ID
// ==============================================
const loadDeficitData = async () => {
  try {
    isAnalyzing.value = true
    
    // 发起请求
    const res = await axios.get('/api', {
      params: {  }
    })

    // 请求成功，赋值渲染
    if (res.data.code === 200) {
      deficitData.value = res.data.data
    }
  } catch (err) {
    console.error('水肥缺失数据加载失败', err)
  } finally {
    isAnalyzing.value = false
  }
}

// ==============================================
// 作用：获取多光谱数据 → 渲染NDVI图表、地块的状态和颜色
// 参数：regionId 合作社ID、orchardId 果园ID
// ==============================================
const loadSpectralData = async () => {
  try {
    isAnalyzing.value = true

    // 发起请求
    const res = await axios.get('/api/AI/water/spectral', {
      params: { regionid:regionInfo.value }
    })

    //数据格式化，对可能为空值的数据进行默认处理，防止空值报错
    if (res.data.code === 200) {
      const data = res.data.data
      // 接收有图表、地块、统计数据，并格式化
      viChartData.value = data.viChartData || []
      viStats.value = data.viStats || []
      ndreStats.value = data.ndreStats || { mean: 0, std: 0, min: 0, max: 0 }
      ndwiStats.value = data.ndwiStats || { mean: 0, std: 0, min: 0, max: 0 }
      correlations.value = data.correlations || []
      nutrientStats.value = data.nutrientStats || []
      nutrientCounts.value = data.nutrientCounts || { n: 0, p: 0, k: 0, water: 0, other: 0 }
      adviceData.value = data.adviceData || []
      // 从后端获取地块列表：id、status
      plotBlocks.value = data.plotBlocks || []
      totalSamples.value = data.totalSamples || 0
      saveCost.value = data.saveCost || 0
      //通过 Vue 模板语法，把这些处理好的数据统一渲染到提前搭建好的页面当中
    }
  } catch (err) {
    console.error('多光谱数据加载失败', err)
  } finally {
    isAnalyzing.value = false
  }
}

// ==============================================
// 作用：点击地块 → 获取该地块水肥分析报告 → 弹窗渲染
// 参数：地块ID
// ==============================================
const handlePlotClick = async (block) => {
  isLoadingPlot.value = true
  try {
    // 保存当前点击的地块ID
    selectedBlockId.value = block.id

    // 解析区域ID
    const areaId = block.id.split('-')[0] || regionInfo.value.regionId
    currentRegionInfo.value = {
      regionId: areaId,
      region: areaId,
      regionName: `区域${areaId}`
    }

    // 设置弹窗标题
    modalTitle.value = `${block.id} 多光谱分析结果`

    // 请求后端接口获取地块分析数据
    const res = await axios.get(`/api/AI/getAnalyzeRegion/${block.id}`)

    if (res.data.code === 200) {
      const data = res.data.data

      // 数据格式化
      currentAnalysisData.value = {
        blockId: block.id,
        location: block.id,
        ndvi: data.ndvi ?? 0,
        ndre: data.ndre ?? 0,
        ndwi: data.ndwi ?? 0,
        analyzeSuggestion: data.suggestion || '暂无建议',
        nutrientStatus: data.nutrientStatus || '正常',
        growthStatus: data.growthStatus || '良好',
      }

      // 图片处理
      if (data.imageUrls && data.imageUrls.length > 0) {
        analysisImages.value = [...data.imageUrls]
      } else if (previewImages.value.length > 0) {
        analysisImages.value = [...previewImages.value]
      } else {
        // 无图片时使用两张占位图
        analysisImages.value = [
          'https://picsum.photos/id/104/800/450',
          'https://picsum.photos/id/10/800/450'
        ]
      }

      // 打开弹窗 → 页面渲染
      showResultModal.value = true
    }
  } catch (err) {
    console.error('获取地块报告失败', err)
  } finally {
    isLoadingPlot.value = false
  }
}

// 关闭弹窗
const handleCloseModal = () => {
  showResultModal.value = false
}

// 应用建议 → 自动发布任务
const handleApplySuggestion = (analysisData) => {
  // 1. 通过字符串分割提取每条建议里的【操作】部分
  const lines = suggestion.split('\n').map(line => line.trim());

  // 拆分建议并筛选含“建议，需，应”的操作语句
  const actions = lines
    .filter(line => /建议|需|应/.test(line))       // 只留含操作指令的行
    .map(line =>
      line
        .replace(/^[•\-]\s*/, '')                 // 去掉 • - 等符号
        .replace(/水分管理|氮素管理|磷钾管理|综合措施：?/g, '') // 去掉标题
        .trim()
    )
    .filter(line => line.length > 0);

  // 拼接成干净任务内容
  const taskContent = actions.join(' ');

  //判断任务类型
  let taskType = /浇水|水分/.test(taskContent) ? '浇水' : '施肥'

  //自动填充任务内容+路由跳转
  router.push({
    path: '/adminMission',
    query: {
      action: 'publish',
      taskType,
      content: taskContent,
      areaId: regionInfo.value.regionId,
      areaName: selectedBlockId.value
    }
  })
}

// 点击数据更新
const handleDataUpdate = () => {
  if (isAnalyzing.value) return
  folderInput.value.click()
}

// 选择图片文件夹
const handleFolderSelect = async (e) => {
  const files = Array.from(e.target.files)
  if (files.length === 0) return
  isAnalyzing.value = true
  try {
    await processImageFiles(files.filter(f => f.type.includes('image')))
    // 重新按顺序加载数据
    await loadAllData()
    analysisDate.value = getCurrentTime()
  } catch (err) {
    console.error(err)
  } finally {
    isAnalyzing.value = false
    e.target.value = ''
  }
}

// 处理图片上传
const processImageFiles = async (files) => {
  uploadProgress.value = { show: true, percentage: 30, message: '处理图片...' }
  previewImages.value = files.map(f => URL.createObjectURL(f))
  const form = new FormData()
  files.forEach(f => form.append('images', f))
  uploadProgress.value = { show: true, percentage: 60, message: '上传中...' }
  await axios.post('/api/water/upload-images', form, {
    params: { regionId: regionInfo.value.regionId, orchardId: orchardId.value }
  })
  uploadProgress.value = { show: true, percentage: 100, message: '上传完成' }
  setTimeout(() => uploadProgress.value.show = false, 2000)
}

// 根据状态统计地块数量
const getPlotCountByStatus = (status) => {
  return plotBlocks.value.filter(b => b.status === status).length
}
</script>

<style scoped>
/* 样式完全保留，和你原来一模一样 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', sans-serif;
}

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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 20px;
}

.title-with-back {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

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

.title-section h1 {
  font-size: 2.3rem;
  color: #11532f;
  display: flex;
  align-items: center;
  gap: 18px;
}

.region-badge {
  background: #2a8b54;
  color: white;
  padding: 6px 18px;
  border-radius: 40px;
  font-size: 1.4rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.file-input {
  display: none;
}

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

.update-time {
  background: #effaf2;
  border-radius: 100px;
  padding: 10px 26px;
  color: #1f6d40;
  border: 1px solid #abd8b8;
}

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

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #2a8b54;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.8rem;
  color: #1d5f3a;
}

.image-preview-trigger {
  background: #e8f5e9;
  border-radius: 30px;
  padding: 8px 16px;
  cursor: pointer;
  color: #1d6b40;
  border: 1px solid #9ccc9c;
}

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

.deficit-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 18px;
  margin-bottom: 28px;
}

.deficit-card {
  background: white;
  border-radius: 28px;
  padding: 18px 16px;
  box-shadow: 0 10px 20px -12px #1e5438;
  border: 1px solid #b9e0cc;
  border-bottom: 6px solid;
}

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

.deficit-title {
  font-size: 0.85rem;
  color: #3c6d50;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.deficit-number {
  font-size: 2.2rem;
  font-weight: 800;
  color: #1d4f31;
  line-height: 1;
}

.two-col {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 26px;
  margin-bottom: 32px;
}

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

.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #175a34;
  margin-bottom: 16px;
}

.plot-count {
  font-size: 0.9rem;
  background: #e0f2e0;
  padding: 4px 12px;
  border-radius: 30px;
  color: #1d6b40;
  margin-left: 10px;
}

.vi-bar-chart {
  display: flex;
  justify-content: space-around;
  margin: 20px 0;
  background: #e2f3e8;
  border-radius: 60px;
  padding: 22px 12px;
}

.bar-item {
  text-align: center;
  width: 60px;
}

.bar-label {
  font-weight: 600;
  color: #1a5b37;
  margin-bottom: 6px;
}

.bar {
  height: 100px;
  width: 36px;
  background: #b8dcca;
  margin: 0 auto;
  border-radius: 30px;
  position: relative;
  overflow: hidden;
}

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

.grid-2x6 {
  display: grid;
  grid-template-columns: repeat(6, minmax(70px, 1fr));
  gap: 15px;
  margin: 20px 0;
  justify-items: center;
}

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

.correl-scatter {
  background: #f6fdf8;
  border-radius: 28px;
  padding: 18px;
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

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