<!-- AnalysisResultModal.vue - 水肥分析结果弹窗（图片展示） -->
<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container" :class="{ 'modal-enter': show }">
        <!-- 弹窗头部 -->
        <div class="modal-header">
          <div class="modal-title">
            <i class="fas fa-image"></i> 
            {{ modalTitle || (regionInfo.regionId ? `${regionInfo.regionId}-3 多光谱分析结果` : '多光谱分析结果') }}
          </div>
          <button class="modal-close" @click="handleClose">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 弹窗内容：图片展示区 + 缩略信息 -->
        <div class="modal-body">
          <!-- 主图区 (支持多图轮播或单图展示) -->
          <div class="image-gallery">
            <div class="main-image-container">
              <img 
                v-if="currentImage" 
                :src="currentImage" 
                :alt="'光谱分析图'" 
                class="main-image"
                @load="handleImageLoadSuccess"
                @error="handleImageError"
                crossorigin="anonymous"
              />
              <div v-else class="image-placeholder">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>暂无分析图片</p>
              </div>
              
              <!-- 图片加载中 -->
              <div v-if="imageLoading" class="image-loader">
                <i class="fas fa-spinner fa-spin"></i> 加载中...
              </div>

              <!-- 图片加载失败提示 -->
              <div v-if="imageError" class="image-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>图片加载失败</p>
                <button class="retry-btn" @click="retryLoadImage">重试</button>
              </div>

              <!-- 左右切换箭头 (多于一张图时显示) -->
              <template v-if="imageList.length > 1 && !imageError">
                <button class="gallery-nav prev" @click="prevImage" :disabled="imageLoading">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button class="gallery-nav next" @click="nextImage" :disabled="imageLoading">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </template>
            </div>

            <!-- 缩略图导航 (多于一张图时显示) -->
            <div v-if="imageList.length > 1" class="thumbnail-strip">
              <div 
                v-for="(img, idx) in imageList" 
                :key="idx"
                class="thumbnail-item"
                :class="{ 'active': currentIndex === idx }"
                @click="setCurrentImage(idx)"
              >
                <img :src="img" :alt="'缩略图 ' + (idx+1)" @error="handleThumbnailError" />
                <span class="thumbnail-index">{{ idx + 1 }}</span>
              </div>
            </div>
          </div>

          <!-- 右侧信息面板 (分析摘要) -->
          <div class="info-panel">
            <div class="info-header">
              <i class="fas fa-chart-pie"></i>
              <span>分析结果摘要</span>
            </div>
            
            <div class="info-content">
              <!-- 添加区域信息显示 -->
              <div class="info-item" v-if="regionInfo.regionId">
                <span class="info-label"><i class="fas fa-map-marker-alt"></i> 区域位置：</span>
                <span class="info-value region-info">
                  区域{{ regionInfo.regionId }}
                </span>
              </div>

              <!-- 营养状态 -->
              <div class="info-item">
                <span class="info-label">营养状态：</span>
                <span class="info-value" :class="nutritionStatusClass">
                  {{ nutritionStatusText }}
                </span>
              </div>
              
              <!-- 关键指数 -->
              <div class="info-grid">
                <div class="grid-item">
                  <div class="grid-label">NDVI</div>
                  <div class="grid-value">{{ formatNumber(spectralIndices.ndvi) }}</div>
                </div>
                <div class="grid-item">
                  <div class="grid-label">NDRE</div>
                  <div class="grid-value">{{ formatNumber(spectralIndices.ndre) }}</div>
                </div>
                <div class="grid-item">
                  <div class="grid-label">NDWI</div>
                  <div class="grid-value">{{ formatNumber(spectralIndices.ndwi) }}</div>
                </div>
                <div class="grid-item">
                  <div class="grid-label">OSAVI</div>
                  <div class="grid-value">{{ formatNumber(spectralIndices.osavi) }}</div>
                </div>
                <div class="grid-item">
                  <div class="grid-label">KVI</div>
                  <div class="grid-value">{{ formatNumber(spectralIndices.kvi) }}</div>
                </div>
                <div class="grid-item">
                  <div class="grid-label">CaVI</div>
                  <div class="grid-value">{{ formatNumber(spectralIndices.caVI) }}</div>
                </div>
                <div class="grid-item">
                  <div class="grid-label">WI</div>
                  <div class="grid-value">{{ formatNumber(spectralIndices.wi) }}</div>
                </div>
                <div class="grid-item">
                  <div class="grid-label">SIPI</div>
                  <div class="grid-value">{{ formatNumber(spectralIndices.sipi) }}</div>
                </div>
              </div>

              <!-- 采样信息 -->
              <div class="info-stats">
                <div><i class="fas fa-map-marker-alt"></i> 采样点：{{ totalSamples }} 个</div>
                <div><i class="fas fa-calendar-alt"></i> 分析时间：{{ analysisTime }}</div>
              </div>

              <!-- 水肥建议 -->
              <div class="info-advice-section">
                <div class="info-advice-header">
                  <i class="fas fa-clipboard-list"></i>
                  <span>水肥管理建议</span>
                </div>
                
                <div class="info-advice-content" v-if="filteredAdvice.length > 0">
                  <div v-for="(line, index) in filteredAdvice" :key="index" 
                       class="advice-line"
                       :class="getLineClass(line)">
                    <span v-if="line.trim().startsWith('-') || line.trim().startsWith('•')" class="advice-bullet">•</span>
                    <span class="advice-text">{{ line.trim() }}</span>
                  </div>
                </div>
                
                <div v-else class="info-advice">
                  <i class="fas fa-clipboard-list"></i>
                  <span>{{ diagnosisAdvice || '根据光谱指数，建议调整水肥配比。' }}</span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="info-actions">
                <button class="action-btn primary" @click="downloadImage">
                  <i class="fas fa-download"></i> 下载图片
                </button>
                <button class="action-btn secondary" @click="applySuggestion">
                  <i class="fas fa-check-circle"></i> 应用建议
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props 定义
const props = defineProps({
  show: { type: Boolean, default: false },
  analysisData: { type: Object, default: () => ({}) },
  images: { type: [String, Array], default: '' },
  regionInfo: { type: Object, default: () => ({ regionId: '1', regionName: '婺城', region: '1' }) },
  modalTitle: { type: String, default: '' }
})

const emit = defineEmits(['close', 'apply'])

// 内部状态
const currentIndex = ref(0)
const imageLoading = ref(false)
const imageError = ref(false)

// 光谱指数
const spectralIndices = computed(() => {
  if (props.analysisData?.spectralIndices) {
    return props.analysisData.spectralIndices
  }
  if (props.analysisData) {
    return {
      ndvi: props.analysisData.ndvi ?? -0.05,
      ndre: props.analysisData.ndre ?? -0.18,
      ndwi: props.analysisData.ndwi ?? 0.11,
      osavi: props.analysisData.osavi ?? -0.06,
      kvi: props.analysisData.kvi ?? 0.05,
      caVI: props.analysisData.caVI ?? -0.03,
      wi: props.analysisData.wi ?? 322676,
      sipi: props.analysisData.sipi ?? -2136.4
    }
  }
  return { ndvi: -0.05, ndre: -0.18, ndwi: 0.11, osavi: -0.06, kvi: 0.05, caVI: -0.03, wi: 322676, sipi: -2136.4 }
})

// 过滤建议内容
const filteredAdvice = computed(() => {
  const advice = props.analysisData?.analyzeSuggestion || ''
  if (!advice) return []
  const lines = advice.split('\n').filter(line => line.trim() !== '')
  const suggestionStartIndex = lines.findIndex(line => line.includes('💡 水肥建议：'))
  if (suggestionStartIndex === -1) return lines.map(line => line.trim())
  return lines.slice(suggestionStartIndex + 1).map(line => line.trim())
})

// 样式类
const getLineClass = (line) => {
  const lowerLine = line.toLowerCase()
  if (lowerLine.includes('水分管理：') || lowerLine.includes('水分')) return 'advice-water'
  if (lowerLine.includes('氮素管理：') || lowerLine.includes('氮')) return 'advice-nitrogen'
  if (lowerLine.includes('磷钾管理：') || lowerLine.includes('磷') || lowerLine.includes('钾')) return 'advice-phosphorus'
  if (lowerLine.includes('综合措施：')) return 'advice-comprehensive'
  if (lowerLine.includes('观察')) return 'advice-observation'
  if (lowerLine.includes('尿素')) return 'advice-nitrogen-detail'
  if (lowerLine.includes('磷钾正常')) return 'advice-phosphorus-detail'
  if (lowerLine.includes('施肥')) return 'advice-observation'
  if (lowerLine.includes('分2次施用')) return 'advice-nitrogen-detail'
  if (lowerLine.includes('维持当前')) return 'advice-phosphorus-detail'
  if (lowerLine.includes('每亩')) return 'advice-nitrogen-detail'
  if (lowerLine.includes('适量')) return 'advice-phosphorus-detail'
  return 'advice-bullet-item'
}

// 图片列表
const imageList = computed(() => {
  if (!props.images) return []
  const urls = Array.isArray(props.images) ? props.images : [props.images]
  return urls.filter(url => url && typeof url === 'string' && url.trim() !== '')
})

// 当前图片
const currentImage = computed(() => {
  const img = imageList.value[currentIndex.value] || null
  return img
})

// 营养状态映射
const nutritionStatusMap = {
  'deficiency': { text: '缺乏', class: 'status-deficiency' },
  'normal': { text: '适中', class: 'status-normal' },
  'excess': { text: '充足', class: 'status-excess' }
}

const nutritionStatusText = computed(() => {
  const status = props.analysisData?.nutritionStatus
  return nutritionStatusMap[status]?.text || status || '未知'
})

const nutritionStatusClass = computed(() => {
  const status = props.analysisData?.nutritionStatus
  return nutritionStatusMap[status]?.class || ''
})

const analysisTime = computed(() => {
  return props.analysisData?.analysisTime || new Date().toLocaleString('zh-CN', { hour12: false })
})

const diagnosisAdvice = computed(() => props.analysisData?.advice || '')
const totalSamples = computed(() => props.analysisData?.totalSamples || 989)

// 格式化数字
const formatNumber = (num) => {
  if (num === undefined || num === null) return '—'
  if (Math.abs(num) > 10000) return num.toExponential(2)
  return Number(num).toFixed(2)
}

// 图片加载成功
const handleImageLoadSuccess = (event) => {
  console.log('✅ 图片加载成功')
  imageLoading.value = false
  imageError.value = false
}

// 图片加载失败
const handleImageError = (event) => {
  console.error('❌ 图片加载失败:', currentImage.value?.substring(0, 100))
  imageError.value = true
  imageLoading.value = false
}

// 缩略图加载失败
const handleThumbnailError = (event) => {
  console.warn('缩略图加载失败')
}

// 重试加载
const retryLoadImage = () => {
  if (!currentImage.value) return
  console.log('重试加载图片')
  imageError.value = false
  imageLoading.value = true
  
  const img = new Image()
  img.onload = () => {
    imageLoading.value = false
    imageError.value = false
    const actualImg = document.querySelector('.main-image')
    if (actualImg) actualImg.src = currentImage.value
  }
  img.onerror = () => {
    imageLoading.value = false
    imageError.value = true
    if (currentIndex.value < imageList.value.length - 1) {
      setTimeout(() => nextImage(), 500)
    }
  }
  img.src = currentImage.value + '?t=' + Date.now()
}

// 切换图片
const prevImage = () => {
  if (imageList.value.length === 0) return
  imageLoading.value = true
  imageError.value = false
  currentIndex.value = (currentIndex.value - 1 + imageList.value.length) % imageList.value.length
}

const nextImage = () => {
  if (imageList.value.length === 0) return
  imageLoading.value = true
  imageError.value = false
  currentIndex.value = (currentIndex.value + 1) % imageList.value.length
}

const setCurrentImage = (index) => {
  if (index === currentIndex.value) return
  imageLoading.value = true
  imageError.value = false
  currentIndex.value = index
}

// 关闭弹窗
const handleClose = () => {
  emit('close')
  currentIndex.value = 0
  imageLoading.value = false
  imageError.value = false
}

// 下载图片
const downloadImage = () => {
  if (!currentImage.value) {
    alert('没有可下载的图片')
    return
  }
  const link = document.createElement('a')
  link.href = currentImage.value
  link.download = `光谱分析_${new Date().getTime()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 应用建议
const applySuggestion = () => {
  emit('apply', props.analysisData)
}

// 监听图片变化
watch(() => props.images, () => {
  currentIndex.value = 0
  imageLoading.value = imageList.value.length > 0
  imageError.value = false
}, { immediate: true })

// 监听显示状态
watch(() => props.show, (newVal) => {
  if (newVal) {
    imageLoading.value = imageList.value.length > 0
    imageError.value = false
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 20, 10, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

.modal-container {
  width: 90%;
  max-width: 1300px;
  max-height: 90vh;
  background: #f5fff9;
  border-radius: 48px;
  box-shadow: 0 40px 60px rgba(0, 40, 20, 0.5);
  border: 2px solid #8fcaaa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: scale(0.95);
  opacity: 0;
  transition: all 0.2s ease;
}

.modal-enter {
  transform: scale(1);
  opacity: 1;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  background: #e5f5ea;
  border-bottom: 2px solid #b8dfca;
}

.modal-title {
  font-size: 1.6rem;
  font-weight: 600;
  color: #11532f;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title i {
  font-size: 2rem;
  color: #2783b3;
  background: white;
  padding: 10px;
  border-radius: 50%;
}

.modal-close {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: 2px solid #60b282;
  color: #11532f;
  font-size: 1.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #60b282;
  color: white;
  transform: rotate(90deg);
}

.modal-body {
  display: flex;
  flex: 1;
  overflow: auto;
  padding: 24px;
  gap: 24px;
  min-height: 500px;
}

.image-gallery {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.main-image-container {
  position: relative;
  background: #d9ecdf;
  border-radius: 36px;
  overflow: hidden;
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #bfe5d0;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #1a2e24;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #4f8066;
  font-size: 1.2rem;
  background: #e0f0e5;
  width: 100%;
  height: 100%;
}

.image-placeholder i {
  font-size: 5rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.image-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  backdrop-filter: blur(3px);
  z-index: 2;
}

.image-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  backdrop-filter: blur(3px);
  z-index: 2;
  gap: 16px;
}

.image-error i {
  font-size: 3rem;
  color: #ff6b6b;
}

.retry-btn {
  background: #2a8b54;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 30px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #1d6b40;
  transform: scale(1.05);
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #2a8b54;
  color: #11532f;
  font-size: 1.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 3;
}

.gallery-nav:hover:not(:disabled) {
  background: #2a8b54;
  color: white;
}

.gallery-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.gallery-nav.prev { left: 20px; }
.gallery-nav.next { right: 20px; }

.thumbnail-strip {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 4px;
  min-height: 80px;
}

.thumbnail-strip::-webkit-scrollbar { height: 6px; }
.thumbnail-strip::-webkit-scrollbar-thumb { background: #60b282; border-radius: 10px; }

.thumbnail-item {
  flex: 0 0 auto;
  width: 100px;
  height: 70px;
  border-radius: 16px;
  overflow: hidden;
  border: 3px solid transparent;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-item.active {
  border-color: #2a8b54;
  transform: scale(1.05);
}

.thumbnail-index {
  position: absolute;
  bottom: 2px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
}

.info-panel {
  flex: 1;
  background: white;
  border-radius: 36px;
  padding: 24px;
  border: 2px solid #bfe5d0;
  box-shadow: 0 8px 20px rgba(0, 40, 20, 0.1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-width: 260px;
}

.info-header {
  font-size: 1.3rem;
  font-weight: 600;
  color: #11532f;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 2px dashed #b0dac0;
  margin-bottom: 20px;
}

.info-header i { font-size: 1.6rem; color: #2783b3; }

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #e9f7ef;
  padding: 12px 16px;
  border-radius: 30px;
  font-size: 1.1rem;
}

.info-label {
  color: #21633e;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-value {
  font-weight: 700;
  padding: 4px 16px;
  border-radius: 30px;
}

.region-info {
  background: #2a8b54;
  color: white;
  padding: 4px 16px;
  border-radius: 30px;
  font-size: 1rem;
}

.status-deficiency { background: #c45d32; color: white; }
.status-normal { background: #4794b3; color: white; }
.status-excess { background: #328f55; color: white; }

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  background: #ecf9f0;
  border-radius: 24px;
  padding: 14px;
  margin: 12px 0;
}

.grid-item {
  text-align: center;
  background: white;
  border-radius: 16px;
  padding: 8px 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.grid-label {
  font-size: 0.8rem;
  color: #2b734b;
  margin-bottom: 4px;
  font-weight: 600;
}

.grid-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1d5f3a;
  background: #f5f5f5;
  padding: 4px 6px;
  border-radius: 20px;
  border: 1px solid #c8e6c9;
}

.info-stats {
  background: #deefe6;
  border-radius: 30px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #1f5f3d;
  font-size: 1rem;
}

.info-stats i { margin-right: 8px; color: #4794b3; }

.info-advice-section {
  background: #f8fdf9;
  border-radius: 24px;
  padding: 16px;
  margin: 12px 0;
  border: 1px solid #c8e6c9;
  max-height: 300px;
  overflow-y: auto;
}

.info-advice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1d6b40;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px dashed #a5d6a7;
  position: sticky;
  top: 0;
  background: #f8fdf9;
  z-index: 1;
}

.info-advice-header i { font-size: 1.3rem; color: #2a8b54; }

.info-advice-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.advice-line {
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.advice-bullet {
  color: #2a8b54;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
  font-size: 1.2rem;
}

.advice-text { flex: 1; }

.advice-water { background: #e3f2fd; border-left: 4px solid #4794b3; margin-bottom: 4px; }
.advice-nitrogen { background: #e0f2e0; border-left: 4px solid #5f9ea0; margin-bottom: 4px; }
.advice-phosphorus { background: #fff3e0; border-left: 4px solid #e1ad5d; margin-bottom: 4px; }
.advice-comprehensive { background: #e8f5e9; border-left: 4px solid #2a8b54; margin-bottom: 4px; }
.advice-bullet-item { background: #ffffff; border-left: 3px solid #bdbdbd; margin-left: 8px; }

.info-advice {
  background: #fff6e0;
  border-radius: 30px;
  padding: 16px;
  border-left: 8px solid #e1ad5d;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: #5d3f1a;
  line-height: 1.5;
}

.info-advice i { font-size: 1.4rem; color: #e1ad5d; flex-shrink: 0; }

.info-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 16px;
}

.action-btn {
  flex: 1;
  padding: 12px 0;
  border-radius: 40px;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #2a8b54;
  color: white;
  border: 2px solid #1d6b40;
}

.action-btn.primary:hover {
  background: #1d6b40;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(42, 139, 84, 0.4);
}

.action-btn.secondary {
  background: white;
  color: #11532f;
  border: 2px solid #60b282;
}

.action-btn.secondary:hover {
  background: #e2f3e8;
  transform: translateY(-2px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 900px) {
  .modal-body { flex-direction: column; }
  .info-panel { max-height: 600px; }
  .info-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 600px) {
  .modal-container { width: 95%; border-radius: 32px; }
  .modal-header { padding: 16px; }
  .modal-title { font-size: 1.3rem; }
  .info-grid { grid-template-columns: repeat(2, 1fr); }
  .advice-line { font-size: 0.85rem; padding: 6px 8px; }
}

.advice-nitrogen-detail {
  background: #e8f5e9;
  border-left: 4px solid #81c784;
  margin-left: 20px;
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.advice-phosphorus-detail {
  background: #fff8e1;
  border-left: 4px solid #ffb74d;
  margin-left: 20px;
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.advice-observation {
  background: #f3e5f5;
  border-left: 4px solid #ba68c8;
  margin-left: 20px;
  margin-bottom: 4px;
  font-size: 0.9rem;
}
</style>