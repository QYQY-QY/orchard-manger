<!-- WaterFertilizer.vue - 水肥精准管控决策大屏（带返回功能 + 分析结果弹窗 + 地块区块） -->
<template>
  <div class="water-dashboard">
    <!-- 头部角色 - 添加返回按钮 -->
    <div class="header">
      <div class="title-section">
        <div class="title-with-back">
          <button class="back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i> 返回
          </button>
          <h1>
            <i class="fas fa-droplet"></i> 水肥精准管控决策
            <span class="region-badge" v-if="regionInfo.regionId">
              汤村
            </span>
          </h1>
        </div>
      </div>
      <div class="header-actions">
        <!-- 文件上传输入框（隐藏）- 支持多种图片格式 -->
        <input 
          type="file" 
          ref="fileInput" 
          class="file-input" 
          multiple 
          accept=".tif,.tiff,.jpg,.jpeg,.png,.bmp,image/tiff,image/tif,image/jpeg,image/jpg,image/png,image/bmp" 
          @change="handleFileSelect"
        >
        <button class="analyze-btn" @click="handleDataUpdate" :disabled="isAnalyzing">
          <span class="btn-icon">{{ isAnalyzing ? '⏳' : '📊' }}</span>
          {{ isAnalyzing ? '更新中...' : '数据更新' }}
        </button>
        
        <!-- 图片预览区域（可选） -->
        <div v-if="previewImages.length > 0" class="image-preview-container">
          <div class="image-preview-trigger" @mouseenter="showPreview = true" @mouseleave="showPreview = false">
            <i class="fas fa-images"></i>
            <span>{{ previewImages.length }}张图片</span>
          </div>
          <div v-if="showPreview" class="image-preview-popup">
            <div v-for="(img, idx) in previewImages" :key="idx" class="preview-item">
              <img :src="img" :alt="'预览' + idx" />
            </div>
          </div>
        </div>
        
        <div class="update-time">
          <i class="fas fa-calendar-alt"></i> 上次数据更新：{{ analysisDate }}
        </div>
      </div>
    </div>

    <!-- 第一行：水肥缺失诊断 KPI -->
    <div class="deficit-row">
      <div v-for="(item, index) in deficitData" :key="index" class="deficit-card" :class="item.type">
        <div class="deficit-title"><i :class="item.icon"></i> {{ item.label }}</div>
        <div class="deficit-number">{{ item.count }} <span class="deficit-unit">{{ item.unit }}</span></div>
        <div>{{ item.percentage }}</div>
      </div>
    </div>

    <!-- 两列核心区域 -->
    <div class="two-col">
      <!-- 左侧大列: 诊断柱状 + 精准建议 -->
      <div>
        <!-- 地块分布柱状图 -->
        <div class="diagnostic-card">
          <div class="section-title"><i class="fas fa-chart-bar"></i> 植被指数分布 · 多光谱反演</div>
          <div class="vi-bar-chart">
            <div v-for="(item, index) in viChartData" :key="index" class="bar-item">
              <div class="bar-label">{{ item.label }}</div>
              <div class="bar">
                <div class="bar-fill" :class="item.colorClass" :style="{ height: item.height + '%' }"></div>
              </div>
              <span class="bar-value">{{ item.value.toFixed(2) }}</span>
            </div>
          </div>
          <div class="plot-tag">
            <span><i class="fas fa-map"></i> 营养状态统计：</span>
            <span class="status-badge" v-for="(status, index) in nutrientStats" :key="index">
              {{ status.label }}: {{ status.count }}
            </span>
            <span class="heat-badge">🌡️ {{ totalSamples }}个采样点</span>
          </div>
        </div>

        <!-- 精准施肥建议卡片 -->
        <div class="advice-card">
          <div class="section-title"><i class="fas fa-clipboard-check"></i> 精准施肥建议</div>
          <div v-for="(advice, index) in adviceData" :key="index" class="advice-item">
            <span><i class="fas fa-map-pin"></i> {{ advice.location }}</span>
            <span>{{ advice.suggestion }}</span>
            <span class="advice-badge" :style="{ background: advice.badgeColor }">{{ advice.status }}</span>
          </div>
          <div class="advice-footer">
            <i class="fas fa-clock"></i> 执行时间窗口: 今日18:00前 / 明日05:00-09:00
          </div>
        </div>
      </div>

      <!-- 右侧列: 地块区块 + 养分趋势 + 相关性散点 -->
      <div>
        <!-- 地块区块卡片 -->
        <div class="plot-grid-card">
          <div class="section-title">
            <i class="fas fa-th"></i> 地块分布 · 汤村
            <span class="plot-count">{{ plotBlocks.length }}个地块</span>
          </div>
          
          <div class="plot-grid grid-2x6">
            <div 
              v-for="(block, index) in plotBlocks" 
              :key="index" 
              class="plot-block"
              :class="{
                'plot-executed': block.status === 'executed',
                'plot-pending': block.status === 'pending',
                'plot-warning': block.status === 'warning'
              }"
              @click="handlePlotClick(block)"
            >
              <div class="plot-content">
                <span class="plot-id">{{ block.id }}</span>
                <span class="plot-status-icon">
                  <i :class="getStatusIcon(block.status)"></i>
                </span>
              </div>
            </div>
          </div>
          
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
          
          <div class="plot-stats">
            <div class="stat-item">
              <i class="fas fa-check-circle" style="color:#2a8b54;"></i>
              <span>已执行: {{ getPlotCountByStatus('executed') }}</span>
            </div>
            <div class="stat-item">
              <i class="fas fa-clock" style="color:#e68a3a;"></i>
              <span>待执行: {{ getPlotCountByStatus('pending') }}</span>
            </div>
            <div class="stat-item">
              <i class="fas fa-exclamation-triangle" style="color:#c45d32;"></i>
              <span>异常: {{ getPlotCountByStatus('warning') }}</span>
            </div>
          </div>
        </div>

        <!-- 植被指数趋势分析 -->
        <div class="trend-card">
          <div class="section-title"><i class="fas fa-chart-line"></i> 植被指数分析</div>
          <div>NDVI (归一化植被指数) 分布</div>
          <div class="stats-box">
            <div class="stat-item" v-for="(stat, index) in viStats" :key="index">
              <span class="stat-label">{{ stat.label }}:</span>
              <span class="stat-value">{{ stat.value }}</span>
            </div>
          </div>
          <div class="correlation-box">
            <i class="fas fa-chart-scatter"></i> NDVI与各指数相关性:
            <span v-for="(corr, idx) in correlations" :key="idx" class="corr-tag">
              {{ corr.name }}: r={{ corr.value }}
            </span>
          </div>
        </div>

        <!-- 相关性散点图模拟 -->
        <div class="correl-card">
          <div class="section-title"><i class="fas fa-project-diagram"></i> 植被指数分布特征</div>
          <div class="correl-scatter">
            <span v-for="n in 7" :key="n" class="scatter-dot" :style="{ background: scatterColors[n - 1] }"></span>
          </div>
          <div class="correl-stats">
            <span>🌿 NDVI μ={{viStats.find(s => s.label === '均值')?.value}}</span>
            <span>📊 NDRE μ={{ ndreStats.mean.toFixed(2) }}</span>
            <span>💧 NDWI μ={{ ndwiStats.mean.toFixed(2) }}</span>
          </div>
          <div class="correl-footer">
            多光谱反演精度 94% · 采样点 {{ totalSamples }}个
          </div>
        </div>
      </div>
    </div>

    <!-- 底部联动 -->
    <div class="drill-footer">
      <span><i class="fas fa-link"></i> 跨屏联动: 点击缺失株/地块可跳转至病虫害/农事调度</span>
      <span><i class="fas fa-clock"></i> 基于多光谱 {{ analysisDate }} 更新</span>
    </div>

    <!-- 微型数据清单 -->
    <div class="micro-data">
      <span>🌱 缺氮{{ nutrientCounts.n }} 缺磷{{ nutrientCounts.p }} 缺钾{{ nutrientCounts.k }} 缺水{{ nutrientCounts.water }}
        其他{{ nutrientCounts.other }}</span>
      <span>📊 NDVI: {{viStats.find(s => s.label === '均值')?.value}} ±{{viStats.find(s => s.label === '标准差')?.value}}</span>
      <span>🧾 采样点: {{ totalSamples }}个</span>
      <span>📈 NDRE: {{ ndreStats.mean.toFixed(2) }}</span>
      <span>📉 NDWI: {{ ndwiStats.mean.toFixed(2) }}</span>
      <span>💰 节本增效 ¥{{ saveCost }}</span>
      <span>📎 NDVI-NDRE r={{(Number(correlations.find(c => c.name === 'NDRE')?.value) || 0.68).toFixed(2)}}</span>
    </div>

    <!-- 水肥分析结果弹窗 -->
    <AnalysisResultModal 
      :show="showResultModal"
      :analysis-data="currentAnalysisData"
      :images="analysisImages"
      :region-info="currentRegionInfo"
      :modal-title="modalTitle"
      @close="handleCloseModal"
      @apply="handleApplySuggestion"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import AnalysisResultModal from './AnalysisResultModal.vue'

const router = useRouter()
const route = useRoute()

// 从路由获取区域信息
const regionInfo = computed(() => {
  const region = route.query.region || '1'
  let regionId = route.query.regionId || '1'
  
  const chineseToNumber = {
    '一': '1', '二': '2', '三': '3', '四': '4', '五': '5'
  }
  
  if (chineseToNumber[regionId]) {
    regionId = chineseToNumber[regionId]
  }
  
  return { region, regionId }
})

// 果园ID
const orchardId = computed(() => {
  return route.query.orchardId || '1'
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 分析状态
const isAnalyzing = ref(false)
const fileInput = ref(null)
const selectedFiles = ref([])

// 图片预览相关
const previewImages = ref([])
const showPreview = ref(false)

// 弹窗相关
const showResultModal = ref(false)
const analysisImages = ref([])
//当前地块分析数据
const currentAnalysisData = ref({})
const selectedBlockId = ref('')
const modalTitle = ref('多光谱分析结果')
const currentRegionInfo = ref({ regionId: '1', region: '1' })

// 统计数据
const totalSamples = 989
const analysisDate = ref('')
const saveCost = ref(4260)

// 获取当前时间
const getCurrentTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 处理文件选择
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  
  const supportedFormats = ['tiff', 'tif', 'jpg', 'jpeg', 'png', 'bmp', 'gif']
  
  const imageFiles = files.filter(file => {
    const fileType = file.type.toLowerCase()
    const fileName = file.name.toLowerCase()
    if (fileType.includes('tiff') || fileType.includes('tif')) return true
    if (fileType.includes('jpeg') || fileType.includes('jpg')) return true
    if (fileType.includes('png')) return true
    if (fileType.includes('bmp')) return true
    if (fileType.includes('gif')) return true
    return supportedFormats.some(format => fileName.endsWith('.' + format))
  })
  
  if (imageFiles.length === 0) {
    alert('请选择支持的图片格式：TIFF、JPG、PNG、BMP、GIF等')
    return
  }
  
  console.log(`选择了 ${imageFiles.length} 个图片文件`)
  
  previewImages.value = []
  imageFiles.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImages.value.push(e.target.result)
    }
    reader.readAsDataURL(file)
  })
  
  selectedFiles.value = imageFiles
  handleDataUpdate()
  event.target.value = ''
}

/**
 * 提取图片URL - 优先使用PNG格式，避免TIFF浏览器不支持问题
 */
const extractImageUrls = (analysisItem) => {
  const urls = []
  
  // 优先添加 PNG 格式的 analysisImage（浏览器友好）
  if (analysisItem.analysisImage && typeof analysisItem.analysisImage === 'string') {
    const url = analysisItem.analysisImage.trim()
    if (url.startsWith('http://') || url.startsWith('https://')) {
      urls.push(url)
      console.log('✅ 添加PNG图片，长度:', url.length)
    }
  }
  
  // 如果没有PNG，尝试添加其他格式
  if (urls.length === 0 && analysisItem.mergeImage && typeof analysisItem.mergeImage === 'string') {
    const url = analysisItem.mergeImage.trim()
    if (url.startsWith('http://') || url.startsWith('https://')) {
      urls.push(url)
      console.log('⚠️ 添加TIFF图片（可能不被浏览器支持），长度:', url.length)
    }
  }
  
  // 如果还是没有图片，使用默认图片
  if (urls.length === 0) {
    console.warn('没有找到可显示的图片，使用默认图片')
    urls.push('https://picsum.photos/id/104/800/450')
    urls.push('https://picsum.photos/id/10/800/450')
  }
  
  return urls
}

/**
 * ————————————————————————————
 * 从接口获取地块详细水肥分析数据
 * ————————————————————————————
 */
const fetchPlotAnalysisData = async (blockId) => {
  try {
    const areaId = blockId.split('-')[0] || regionInfo.value.regionId
    const currentOrchardId = orchardId.value
    
    //调用地块水肥分析报告接口，将报告渲染到水肥页面中
    const apiUrl = `/api/AI/getAnalyze/${currentOrchardId}/${areaId}`
    
    //发送请求，超时实践设置为30s
    const response = await axios.get(apiUrl, {
      timeout: 30000
    })
    
    if (response.status === 200) {
      if (!response.data) {
        throw new Error('返回数据为空')
      }
      
      let resultData = response.data
      // 如果返回的是字符串格式，尝试解析为JSON
      if (typeof resultData === 'string') {
        try {
          resultData = JSON.parse(resultData)
        } catch (e) {
          throw new Error('JSON解析失败')
        }
      }
      
      if (resultData.code === 200) {
        const dataList = resultData.data
        
        if (!dataList || (Array.isArray(dataList) && dataList.length === 0)) {
          console.warn('没有找到数据')
          return generateDefaultAnalysisData(blockId)
        }
        
        // 打印原始图片URL信息用于调试
        const firstData = Array.isArray(dataList) ? dataList[0] : dataList
        console.log('========== 原始图片URL信息 ==========')
        console.log('analysisImage 存在:', !!firstData.analysisImage)
        console.log('analysisImage 前100字符:', firstData.analysisImage?.substring(0, 100))
        console.log('mergeImage 存在:', !!firstData.mergeImage)
        console.log('=====================================')
        
        return formatAnalysisData(dataList, blockId)
      } else {
        throw new Error(resultData.msg || '获取数据失败')
      }
    } else {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
  } catch (error) {
    console.error('获取分析数据失败:', error)
    return generateDefaultAnalysisData(blockId)
  }
}

/**
 * 格式化接口返回的数据
 */
const formatAnalysisData = (apiData, blockId) => {
  console.log('开始格式化数据')
  
  if (!apiData) {
    //无返回则使用默认数据：没有数据
    return generateDefaultAnalysisData(blockId)
  }
  
  let analysisItem = apiData
  
  if (Array.isArray(apiData)) {
    if (apiData.length === 0) {
      return generateDefaultAnalysisData(blockId)
    }
    analysisItem = apiData[0]
  }
  
  if (apiData.data && Array.isArray(apiData.data)) {
    if (apiData.data.length === 0) {
      return generateDefaultAnalysisData(blockId)
    }
    analysisItem = apiData.data[0]
  }
  
  // 取出光谱指数（没有则为空对象）
  const spectralIndices = analysisItem.spectralIndices || {}
  
  // 提取图片URL
  const imageUrls = extractImageUrls(analysisItem)
  
  // 处理建议内容
  let suggestion = analysisItem.analyzeSuggestion || ''
  // 如果建议为空、或是图片路径/网址 → 自动根据营养状态生成标准建议
  if (!suggestion || suggestion.trim() === '' || 
      suggestion.includes('.png') || suggestion.includes('.jpg') || 
      suggestion.includes('http://') || suggestion.includes('https://')) {
    suggestion = generateSuggestionByStatus(analysisItem.nutritionStatus, blockId)
  }
  
  // 按照默认的数据格式组装最终前端展示的水肥数据
  const formattedData = {
    nutritionStatus: analysisItem.nutritionStatus || 'normal',
    spectralIndices: {
      ndvi: spectralIndices.ndvi ?? 0.45,
      ndre: spectralIndices.ndre ?? 0.25,
      ndwi: spectralIndices.ndwi ?? -0.08,
      osavi: spectralIndices.osavi ?? 0.40,
      kvi: spectralIndices.kvi ?? 0.02,
      caVI: spectralIndices.caVI ?? -0.01,
      wi: spectralIndices.wi ?? 322676,
      sipi: spectralIndices.sipi ?? -2136.4
    },
    analyzeSuggestion: suggestion,
    analysisTime: analysisItem.createTime || getCurrentTime(),
    totalSamples: 989,
    imageUrls: imageUrls
  }
  
  // 调试输出：格式化完成，打印图片数量
  console.log(`格式化完成，图片数量: ${imageUrls.length}`)
  if (imageUrls.length > 0) {
    console.log('第一张图片URL前100字符:', imageUrls[0]?.substring(0, 100))
  }
  
  return formattedData
}

/**
 * 根据营养状态生成建议
 */
const generateSuggestionByStatus = (nutritionStatus, blockId) => {
  const block = plotBlocks.value.find(b => b.id === blockId)
  const status = block?.status || 'executed'
  
  const suggestions = {
    'executed': `💡 水肥建议：
  水分管理：正常，土壤湿度65%
  氮素管理：保持当前水平
  磷钾管理：维持现有方案
  综合措施：观察生长状况，预计3天后追肥
  - 每亩施用复合肥15kg
  - 保持土壤湿度60-70%
  - 分2次施用效果更佳`,
    
    'pending': `💡 水肥建议：
  水分管理：需增加灌溉，当前湿度52%
  氮素管理：建议补充尿素
  磷钾管理：适量增加磷钾肥
  综合措施：促进施肥，尽快补充
  - 每亩补施尿素8-10kg
  - 增加滴灌频次至每天2次
  - 3天后复测指数`,
    
    'warning': `💡 水肥建议：
  水分管理：严重缺水，当前湿度38%
  氮素管理：明显缺氮
  磷钾管理：需紧急补充
  综合措施：紧急处理，立即执行
  - 立即补水30m³/亩
  - 增施速效氮肥12kg/亩
  - 叶面喷施磷酸二氢钾
  - 24小时后重新检测`
  }
  
  return suggestions[status] || suggestions.executed
}

/**
 * 生成默认分析数据
 */
const generateDefaultAnalysisData = (blockId) => {
  const block = plotBlocks.value.find(b => b.id === blockId)
  const suggestion = generateSuggestionByStatus(block?.status || 'normal', blockId)
  
  return {
    nutritionStatus: block?.status === 'warning' ? 'deficiency' : 'normal',
    spectralIndices: {
      ndvi: 0.45, ndre: 0.25, ndwi: -0.08, osavi: 0.40,
      kvi: 0.02, caVI: -0.01, wi: 322676, sipi: -2136.4
    },
    analyzeSuggestion: suggestion,
    analysisTime: getCurrentTime(),
    totalSamples: 989,
    imageUrls: [
      'https://picsum.photos/id/104/800/450',
      'https://picsum.photos/id/10/800/450'
    ]
  }
}

// 处理地块点击
const handlePlotClick = async (block) => {
  console.log('========== 点击地块 ==========')
  console.log('地块信息:', block)
  
  isAnalyzing.value = true
  
  try {
    selectedBlockId.value = block.id
    
    const areaId = block.id.split('-')[0] || regionInfo.value.regionId
    currentRegionInfo.value = {
      regionId: areaId,
      region: areaId,
      regionName: `区域${areaId}`
    }
    
    modalTitle.value = `${block.id} 多光谱分析结果`
    
    const analysisData = await fetchPlotAnalysisData(block.id)
    
    console.log('分析数据图片URLs:', analysisData.imageUrls)
    
    currentAnalysisData.value = analysisData
    
    // 设置弹窗图片
    if (analysisData.imageUrls && analysisData.imageUrls.length > 0) {
      analysisImages.value = [...analysisData.imageUrls]
      console.log('设置弹窗图片，数量:', analysisImages.value.length)
    } else if (previewImages.value.length > 0) {
      analysisImages.value = [...previewImages.value]
    } else {
      analysisImages.value = [
        'https://picsum.photos/id/104/800/450',
        'https://picsum.photos/id/10/800/450'
      ]
    }
    
    showResultModal.value = true
    
  } catch (error) {
    console.error('处理地块点击失败:', error)
    alert('获取分析数据失败，请稍后重试')
  } finally {
    isAnalyzing.value = false
  }
}

// 关闭弹窗
const handleCloseModal = () => {
  showResultModal.value = false
}

// 生成健康随机数
const generateHealthyRandom = (min, max, decimals = 2) => {
  const value = min + Math.random() * (max - min)
  return Number(value.toFixed(decimals))
}

// 生成健康光谱指数
const generateHealthySpectralIndices = () => {
  return {
    ndvi: generateHealthyRandom(0.45, 0.75, 3),
    ndre: generateHealthyRandom(0.15, 0.35, 3),
    osavi: generateHealthyRandom(0.4, 0.7, 3),
    ndpi: generateHealthyRandom(0.08, 0.2, 3),
    kvi: generateHealthyRandom(-0.1, 0.1, 3),
    caVI: generateHealthyRandom(-0.05, 0.05, 3),
    ndwi: generateHealthyRandom(-0.1, 0.2, 3),
    wi: generateHealthyRandom(322500, 323500, 0),
    sipi: generateHealthyRandom(-2150, -2120, 1)
  }
}

// 主数据更新函数
const handleDataUpdate = () => {
  if (isAnalyzing.value) return
  
  isAnalyzing.value = true
  
  setTimeout(() => {
    try {
      analysisDate.value = getCurrentTime()
      const healthyIndices = generateHealthySpectralIndices()
      
      viChartData.value = [
        { label: 'NDVI', value: healthyIndices.ndvi, height: healthyIndices.ndvi * 100, colorClass: 'n' },
        { label: 'NDRE', value: healthyIndices.ndre, height: healthyIndices.ndre * 100, colorClass: 'p' },
        { label: 'OSAVI', value: healthyIndices.osavi, height: healthyIndices.osavi * 100, colorClass: 'k' },
        { label: 'NDPI', value: healthyIndices.ndpi, height: healthyIndices.ndpi * 100, colorClass: 'water' },
        { label: 'KVI', value: Math.abs(healthyIndices.kvi), height: Math.abs(healthyIndices.kvi) * 100, colorClass: 'other' },
        { label: 'CaVI', value: Math.abs(healthyIndices.caVI), height: Math.abs(healthyIndices.caVI) * 100, colorClass: 'n' },
        { label: 'NDWI', value: healthyIndices.ndwi, height: healthyIndices.ndwi * 100, colorClass: 'water' }
      ]
      
      viStats.value = [
        { label: '均值', value: healthyIndices.ndvi.toFixed(2) },
        { label: '中位数', value: (healthyIndices.ndvi - 0.02 + Math.random() * 0.04).toFixed(2) },
        { label: '标准差', value: generateHealthyRandom(0.08, 0.15, 2).toFixed(2) },
        { label: '最小值', value: (healthyIndices.ndvi - 0.15).toFixed(2) },
        { label: '最大值', value: (healthyIndices.ndvi + 0.15).toFixed(2) }
      ]
      
      ndreStats.value = {
        mean: healthyIndices.ndre,
        std: generateHealthyRandom(0.03, 0.07, 3),
        min: (healthyIndices.ndre - 0.1).toFixed(2),
        max: (healthyIndices.ndre + 0.1).toFixed(2)
      }
      
      ndwiStats.value = {
        mean: healthyIndices.ndwi,
        std: generateHealthyRandom(0.04, 0.08, 3),
        min: (healthyIndices.ndwi - 0.12).toFixed(2),
        max: (healthyIndices.ndwi + 0.12).toFixed(2)
      }
      
      correlations.value = [
        { name: 'NDRE', value: generateHealthyRandom(0.65, 0.85, 2) },
        { name: 'OSAVI', value: generateHealthyRandom(0.88, 0.96, 2) },
        { name: 'NDPI', value: generateHealthyRandom(0.55, 0.7, 2) },
        { name: 'NDWI', value: generateHealthyRandom(-0.3, -0.1, 2) }
      ]
      
      const healthyCounts = {
        n: Math.floor(Math.random() * 20) + 5,
        p: Math.floor(Math.random() * 15) + 3,
        k: Math.floor(Math.random() * 18) + 4,
        water: Math.floor(Math.random() * 12) + 2,
        other: Math.floor(Math.random() * 8) + 1
      }
      
      nutrientCounts.n = healthyCounts.n
      nutrientCounts.p = healthyCounts.p
      nutrientCounts.k = healthyCounts.k
      nutrientCounts.water = healthyCounts.water
      nutrientCounts.other = healthyCounts.other
      
      deficitData.value = [
        { type: 'n', icon: 'fas fa-flask', label: '缺氮株数', count: healthyCounts.n, unit: '株', percentage: `占比 ${((healthyCounts.n / totalSamples) * 100).toFixed(1)}%` },
        { type: 'p', icon: 'fas fa-flask', label: '缺磷株数', count: healthyCounts.p, unit: '株', percentage: `占比 ${((healthyCounts.p / totalSamples) * 100).toFixed(1)}%` },
        { type: 'k', icon: 'fas fa-flask', label: '缺钾株数', count: healthyCounts.k, unit: '株', percentage: `占比 ${((healthyCounts.k / totalSamples) * 100).toFixed(1)}%` },
        { type: 'water', icon: 'fas fa-tint', label: '缺水株数', count: healthyCounts.water, unit: '株', percentage: `占比 ${((healthyCounts.water / totalSamples) * 100).toFixed(1)}%` },
        { type: 'other', icon: 'fas fa-seedling', label: '其他缺失', count: healthyCounts.other, unit: '株', percentage: '缺硼/锌/钙' }
      ]
      
      const remainingSamples = totalSamples - (healthyCounts.n + healthyCounts.p + healthyCounts.k + healthyCounts.water + healthyCounts.other)
      const healthySamples = Math.floor(remainingSamples * 0.85)
      
      nutrientStats.value = [
        { label: '严重缺乏', count: Math.floor(healthyCounts.n * 0.2), color: '#c45d32' },
        { label: '缺乏', count: Math.floor(healthyCounts.n * 0.3 + healthyCounts.p * 0.3), color: '#e1ad5d' },
        { label: '偏少', count: Math.floor(healthyCounts.p * 0.3 + healthyCounts.k * 0.3), color: '#5f9ea0' },
        { label: '适中', count: Math.floor(healthySamples * 0.6), color: '#4794b3' },
        { label: '充足', count: Math.floor(healthySamples * 0.4), color: '#328f55' }
      ]
      
      const adviceLocations = ['地块 1-A', '地块 2-C', '地块 3-B', '地块 4-D', '地块 5-E']
      const adviceTypes = [
        { suggestion: '平衡水溶肥 3kg/亩 · 促生长', status: '推荐执行', color: '#256f45' },
        { suggestion: '叶面喷施磷酸二氢钾 · 壮秆', status: '建议执行', color: '#e68a3a' },
        { suggestion: '滴灌补充水分 · 20m³/亩', status: '今日执行', color: '#256f45' }
      ]
      
      adviceData.value = []
      for (let i = 0; i < 3; i++) {
        adviceData.value.push({
          location: adviceLocations[i % adviceLocations.length],
          suggestion: adviceTypes[i % adviceTypes.length].suggestion,
          status: adviceTypes[i % adviceTypes.length].status,
          badgeColor: adviceTypes[i % adviceTypes.length].color
        })
      }
      
      for (let i = 0; i < plotBlocks.value.length; i++) {
        const rand = Math.random()
        let status = rand < 0.6 ? 'executed' : (rand < 0.9 ? 'pending' : 'warning')
        plotBlocks.value[i].status = status
      }
      
      saveCost.value = 4260 + Math.floor(Math.random() * 500) + 200
      
    } catch (error) {
      console.error('数据更新出错:', error)
    } finally {
      isAnalyzing.value = false
      selectedFiles.value = []
    }
  }, 800)
}

// VI指数统计表数据
const viStatsData = {
  ndvi: { mean: 0.158, std: 0.201, min: -0.502, median: 0.166, max: 0.632 },
  ndre: { mean: 0.034, std: 0.098, min: -0.419, median: 0.050, max: 0.291 },
  osavi: { mean: 0.130, std: 0.173, min: -0.505, median: 0.127, max: 0.529 },
  ndpi: { mean: 0.080, std: 0.089, min: -0.150, median: 0.064, max: 0.362 },
  kvi: { mean: -0.158, std: 0.201, min: -0.632, median: -0.166, max: 0.502 },
  cavi: { mean: -0.018, std: 0.051, min: -0.270, median: -0.018, max: 0.127 },
  ndwi: { mean: -0.100, std: 0.187, min: -0.623, median: -0.124, max: 0.611 }
}

// 响应式数据
const nutrientStats = ref([
  { label: '严重缺乏', count: 245, color: '#c45d32' },
  { label: '缺乏', count: 312, color: '#e1ad5d' },
  { label: '偏少', count: 187, color: '#5f9ea0' },
  { label: '适中', count: 178, color: '#4794b3' },
  { label: '充足', count: 67, color: '#328f55' }
])

const nutrientCounts = { n: 44, p: 16, k: 31, water: 19, other: 8 }

const deficitData = ref([
  { type: 'n', icon: 'fas fa-flask', label: '缺氮株数', count: 44, unit: '株', percentage: '占比 5.3%' },
  { type: 'p', icon: 'fas fa-flask', label: '缺磷株数', count: 16, unit: '株', percentage: '占比 1.9%' },
  { type: 'k', icon: 'fas fa-flask', label: '缺钾株数', count: 31, unit: '株', percentage: '占比 3.7%' },
  { type: 'water', icon: 'fas fa-tint', label: '缺水株数', count: 19, unit: '株', percentage: '占比 2.3%' },
  { type: 'other', icon: 'fas fa-seedling', label: '其他缺失', count: 8, unit: '株', percentage: '缺硼/锌/钙' }
])

const viChartData = ref([
  { label: 'NDVI', value: 0.158, height: 15.8, colorClass: 'n' },
  { label: 'NDRE', value: 0.034, height: 3.4, colorClass: 'p' },
  { label: 'OSAVI', value: 0.130, height: 13.0, colorClass: 'k' },
  { label: 'NDPI', value: 0.080, height: 8.0, colorClass: 'water' },
  { label: 'KVI', value: 0.158, height: 15.8, colorClass: 'other' },
  { label: 'CaVI', value: 0.018, height: 1.8, colorClass: 'n' },
  { label: 'NDWI', value: -0.100, height: 10.0, colorClass: 'water' }
])

const viStats = ref([
  { label: '均值', value: '0.16' },
  { label: '中位数', value: '0.17' },
  { label: '标准差', value: '0.20' },
  { label: '最小值', value: '-0.50' },
  { label: '最大值', value: '0.63' }
])

const ndreStats = ref({ mean: 0.034, std: 0.098, min: '-0.42', max: '0.29' })
const ndwiStats = ref({ mean: -0.100, std: 0.187, min: '-0.62', max: '0.61' })
const correlations = ref([
  { name: 'NDRE', value: 0.76 },
  { name: 'OSAVI', value: 0.92 },
  { name: 'NDPI', value: 0.58 },
  { name: 'NDWI', value: -0.43 }
])

const adviceData = ref([
  { location: '地块 1-A (缺氮)', suggestion: '高氮水溶肥 5kg/亩 · NDVI=0.037', status: '今日执行', badgeColor: '#256f45' },
  { location: '地块 1-C (缺钾)', suggestion: '硫酸钾 3.2kg/亩 · KVI=-0.301', status: '明日窗口', badgeColor: '#e68a3a' },
  { location: '地块 1-E (缺水)', suggestion: '滴灌补水 30m³/亩 · NDWI=-0.081', status: '今日执行', badgeColor: '#256f45' }
])

const plotBlocks = ref([
  { id: '1-A', status: 'executed' }, { id: '1-B', status: 'executed' },
  { id: '1-C', status: 'pending' }, { id: '1-D', status: 'warning' },
  { id: '1-E', status: 'executed' }, { id: '1-F', status: 'pending' },
  { id: '1-G', status: 'executed' }, { id: '1-H', status: 'pending' },
  { id: '1-I', status: 'warning' }, { id: '1-J', status: 'executed' },
  { id: '1-K', status: 'pending' }, { id: '1-L', status: 'executed' }
])

const getStatusIcon = (status) => {
  switch(status) {
    case 'executed': return 'fas fa-check-circle'
    case 'pending': return 'fas fa-clock'
    case 'warning': return 'fas fa-exclamation-triangle'
    default: return 'fas fa-circle'
  }
}

const getPlotCountByStatus = (status) => {
  return plotBlocks.value.filter(block => block.status === status).length
}

const handleApplySuggestion = (data) => {
  console.log('应用分析建议:', data)
  showResultModal.value = false
}

const scatterColors = ['#1b7b44', '#3ba363', '#308254', '#56a06b', '#71ba83', '#c45d32', '#7ac48a']

onMounted(() => {
  analysisDate.value = getCurrentTime()
  console.log('组件已挂载，地块数量:', plotBlocks.value.length)
})
</script>

<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; }

.water-dashboard {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 56px;
  box-shadow: 0 40px 60px -20px #1b4f31, 0 20px 30px -10px #1f4028;
  padding: 32px 36px 40px 36px;
  border: 2px solid rgba(90, 170, 130, 0.6);
}

.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 20px; }
.title-section { flex: 1; }
.title-with-back { display: flex; align-items: center; gap: 20px; margin-bottom: 8px; flex-wrap: wrap; }
.back-btn { display: flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.9); border: 1px solid #60b282; color: #11532f; font-size: 1rem; font-weight: 500; padding: 10px 20px; border-radius: 40px; cursor: pointer; transition: all 0.2s ease; }
.back-btn:hover { background: #60b282; color: white; transform: translateX(-3px); }
.title-section h1 { font-size: 2.3rem; font-weight: 600; color: #11532f; display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.title-section h1 i { font-size: 2.8rem; color: #2783b3; background: #e0f2fc; padding: 12px; border-radius: 50%; }
.region-badge { font-size: 1.4rem; background: linear-gradient(135deg, #2a8b54, #1d6b40); color: white; padding: 6px 18px; border-radius: 40px; }
.header-actions { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
.file-input { display: none; }
.analyze-btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: #2a8b54; border: none; color: white; font-size: 1rem; font-weight: 500; padding: 10px 24px; border-radius: 40px; cursor: pointer; transition: all 0.2s ease; min-width: 120px; }
.analyze-btn:hover:not(:disabled) { background: #1d6b40; transform: translateY(-2px); }
.analyze-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.update-time { background: #effaf2; border-radius: 100px; padding: 10px 26px; font-weight: 500; color: #1f6d40; border: 1px solid #abd8b8; white-space: nowrap; }
.image-preview-container { position: relative; display: inline-block; }
.image-preview-trigger { background: #e8f5e9; border-radius: 30px; padding: 8px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #1d6b40; border: 1px solid #9ccc9c; }
.image-preview-popup { position: absolute; top: 100%; right: 0; margin-top: 10px; background: white; border-radius: 16px; padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); border: 1px solid #c8e6c9; z-index: 100; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; min-width: 300px; }
.preview-item { width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid #e0f2e0; }
.preview-item img { width: 100%; height: 100%; object-fit: cover; }
.deficit-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; margin-bottom: 28px; }
.deficit-card { background: white; border-radius: 28px; padding: 18px 16px; box-shadow: 0 10px 20px -12px #1e5438; border: 1px solid #b9e0cc; border-bottom: 6px solid; }
.deficit-card.n { border-bottom-color: #5f9ea0; }
.deficit-card.p { border-bottom-color: #e1ad5d; }
.deficit-card.k { border-bottom-color: #c45d32; }
.deficit-card.water { border-bottom-color: #4794b3; }
.deficit-card.other { border-bottom-color: #7fbf8f; }
.deficit-title { font-size: 0.85rem; color: #3c6d50; margin-bottom: 6px; text-transform: uppercase; }
.deficit-number { font-size: 2.2rem; font-weight: 800; color: #1d4f31; line-height: 1; }
.two-col { display: grid; grid-template-columns: 1.4fr 1fr; gap: 26px; margin-bottom: 32px; }
.diagnostic-card { background: #f5fff9; border-radius: 38px; padding: 26px; border: 1px solid #c2e6d5; margin-bottom: 20px; }
.section-title { font-size: 1.3rem; font-weight: 700; color: #175a34; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
.plot-count { font-size: 0.9rem; background: #e0f2e0; padding: 4px 12px; border-radius: 30px; color: #1d6b40; margin-left: 10px; }
.vi-bar-chart { display: flex; justify-content: space-around; margin: 20px 0; background: #e2f3e8; border-radius: 60px; padding: 22px 12px; flex-wrap: wrap; }
.bar-item { text-align: center; width: 60px; }
.bar-label { font-weight: 600; color: #1a5b37; margin-bottom: 6px; }
.bar { height: 100px; width: 36px; background: #b8dcca; margin: 0 auto; border-radius: 30px; position: relative; overflow: hidden; }
.bar-fill { position: absolute; bottom: 0; width: 100%; background: #328f55; border-radius: 30px; }
.bar-fill.n { background: #5f9ea0; }
.bar-fill.p { background: #e1ad5d; }
.bar-fill.k { background: #c45d32; }
.bar-fill.water { background: #4794b3; }
.bar-fill.other { background: #b58f5a; }
.bar-value { margin-top: 6px; font-weight: 700; }
.plot-tag { background: #e1f0e4; border-radius: 30px; padding: 16px; margin: 16px 0 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.status-badge { background: #b7dfc2; padding: 4px 12px; border-radius: 30px; }
.heat-badge { background: #b7dfc2; padding: 6px 18px; border-radius: 30px; }
.advice-card { background: white; border-radius: 32px; padding: 22px; margin-bottom: 20px; border: 1px solid #d0ebdd; }
.advice-item { display: flex; background: #ecf9f0; border-radius: 50px; padding: 14px 22px; align-items: center; justify-content: space-between; margin: 12px 0; border-left: 10px solid #3d9c6e; flex-wrap: wrap; gap: 10px; }
.advice-badge { color: white; padding: 4px 15px; border-radius: 40px; }
.advice-footer { margin-top: 10px; background: #ecf9f0; border-radius: 30px; padding: 8px 16px; }
.plot-grid-card { background: white; border-radius: 34px; padding: 24px; border: 1px solid #c6e3d4; margin-bottom: 20px; }
.grid-2x6 { display: grid; grid-template-columns: repeat(6, minmax(70px, 1fr)); gap: 15px; margin: 20px 0; justify-items: center; }
.plot-block { width: 100%; max-width: 70px; height: 70px; background: #f0f9f2; border-radius: 12px; border: 2px solid #c8e6c9; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
.plot-block:hover { transform: translateY(-3px); box-shadow: 0 6px 12px rgba(0,0,0,0.1); }
.plot-block.plot-executed { border-left: 6px solid #2a8b54; background: #e8f5e9; }
.plot-block.plot-pending { border-left: 6px solid #e68a3a; background: #fff8e7; }
.plot-block.plot-warning { border-left: 6px solid #c45d32; background: #ffeee8; }
.plot-content { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.plot-id { font-weight: 700; font-size: 1rem; color: #1d5f3a; }
.plot-status-icon { font-size: 0.9rem; color: #2a8b54; }
.plot-block.plot-pending .plot-status-icon { color: #e68a3a; }
.plot-block.plot-warning .plot-status-icon { color: #c45d32; }
.plot-legend { display: flex; gap: 20px; margin: 16px 0; padding: 12px; background: #ecf9ef; border-radius: 30px; justify-content: center; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-color { width: 16px; height: 16px; border-radius: 4px; }
.legend-color.executed { background: #2a8b54; }
.legend-color.pending { background: #e68a3a; }
.legend-color.warning { background: #c45d32; }
.plot-stats { display: flex; justify-content: space-around; margin-top: 16px; padding-top: 16px; border-top: 1px dashed #b8dfca; flex-wrap: wrap; gap: 10px; }
.plot-stats .stat-item { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; color: #1d5f3a; }
.trend-card, .correl-card { background: white; border-radius: 34px; padding: 24px; border: 1px solid #c6e3d4; margin-bottom: 20px; }
.stats-box { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; background: #ecf9ef; border-radius: 24px; padding: 16px; }
.stats-box .stat-item { text-align: center; }
.stat-label { font-size: 0.85rem; color: #4a7a60; display: block; }
.stat-value { font-size: 1.3rem; font-weight: 700; color: #1d5f3a; }
.correlation-box { margin-top: 20px; background: #ecf9ef; border-radius: 40px; padding: 14px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.corr-tag { background: #4794b3; color: white; padding: 4px 12px; border-radius: 30px; font-size: 0.9rem; }
.correl-scatter { background: #f6fdf8; border-radius: 28px; padding: 18px; display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
.scatter-dot { width: 24px; height: 24px; border-radius: 50%; }
.correl-stats { display: flex; justify-content: center; gap: 30px; margin: 12px 0; flex-wrap: wrap; }
.correl-footer { background: #e0efe3; border-radius: 30px; padding: 12px; text-align: center; }
.drill-footer { margin-top: 24px; background: #e3f3e6; border-radius: 60px; padding: 16px 28px; display: flex; justify-content: space-between; color: #165f36; border: 1px solid #a0cfb0; flex-wrap: wrap; gap: 15px; }
.micro-data { margin-top: 20px; font-size: 0.8rem; color: #2f704a; border-top: 1px dashed #a2cfb2; padding-top: 12px; display: flex; flex-wrap: wrap; gap: 24px; }
@media (max-width: 1200px) { .grid-2x6 { grid-template-columns: repeat(6, minmax(60px, 1fr)); } .plot-block { height: 60px; } }
@media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } .grid-2x6 { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 600px) { .grid-2x6 { grid-template-columns: repeat(2, 1fr); } }
</style>