<template>
  <div class="zone-main">
    <!-- 未选择区域提示 -->
    <div class="map-container" v-if="!activeAreaId">
      <div class="map-tips">请先选择或添加区域</div>
    </div>
    
    <!-- 选中区域后显示表格 -->
    <div class="tree-list-container" v-if="activeAreaId">
      <div class="zone-info">
        <div>
          <h3>区域{{ fullZoneInfo.number || activeZone.number }}：{{ fullZoneInfo.name || activeZone.name }}</h3>
          <p class="zone-desc">
            负责人：{{ fullZoneInfo.manager || activeZone.manager || '未设置' }} | 
            品种：{{ fullZoneInfo.type || activeZone.type || '-' }} | 
            果树总数：{{ sortedTreeList.length || fullZoneInfo.size || fullZoneInfo.fruitCount || activeZone.size || 0 }}
          </p>
        </div>
      </div>
      
      <!-- 果树表格（已修复闭合标签） -->
      <el-table 
        :data="sortedTreeList" 
        border 
        stripe 
        style="width: 100%; margin-top: 20px"
        :header-cell-style="{ backgroundColor: '#f8f9fa' }"
        :empty-text="`该区域暂无果树数据`"
      >
        <!-- 果树编号 -->
        <el-table-column 
          label="果树编号" 
          min-width="120"  
        >
          <template #default="scope">
            {{ scope.row.id }}
          </template>
        </el-table-column>
        <!-- 新增：果树品种列 -->
        <el-table-column 
          label="果树品种" 
          min-width="100"  
        >
          <template #default="scope">
            {{ scope.row.type || '-' }}
          </template>
        </el-table-column>
        <!-- 新增：果实数量列 -->
        <el-table-column 
          label="果实总数" 
          min-width="100"  
        >
          <template #default="scope">
            {{ scope.row.countNum || 0 }}
          </template>
        </el-table-column>
        <!-- 新增：成熟果实数量列 -->
        <el-table-column 
          label="成熟果实数" 
          min-width="100"  
        >
          <template #default="scope">
            {{ scope.row.ripeNum || 0 }}
          </template>
        </el-table-column>
        <el-table-column 
          label="成熟度" 
          min-width="100"  
        >
          <template #default="scope">
            <el-tag 
              size="small" 
              :type="getRipeDegreeTagType(scope.row.ripeDegree)"
            >
              {{ formatRipeDegree(scope.row.ripeDegree) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column 
          label="健康状态" 
          min-width="100"  
        >
          <template #default="scope">
            <el-tag 
              size="small" 
              :type="scope.row.healthCondition === '健康' ? 'success' : (scope.row.healthCondition === '异常' ? 'danger' : 'warning')"
            >
              {{ scope.row.healthCondition || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column 
          label="二维码" 
          min-width="100" 
        >
          <template #default="scope">
            <!-- 核心修复：使用后端返回的url字段 -->
            <div class="qrcode-container" v-if="scope.row.url">
              <el-image 
                :src="scope.row.url"
                fit="contain"
                class="qrcode-img"
                @click="handleQRCodeClick(scope.row.url)"
                :preview-src-list="[scope.row.url]"
              >
                <template #error>
                  <div class="image-slot">图片加载失败</div>
                </template>
              </el-image>
              <el-button 
                size="mini" 
                icon="el-icon-download" 
                class="qrcode-download-btn"
                @click.stop="downloadQRCode(scope.row.url, scope.row.id)"
                type="text"
              ></el-button>
            </div>
            <span class="no-qrcode" v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column 
          label="操作" 
          width="auto"  
        >
          <template #default="scope">
            <el-button 
              size="small" 
              type="text"
              @click="showTreeDetail(scope.row)"
              disabled  
            >
              查看详情
            </el-button>
            <el-button 
              size="small" 
              type="text"
              text-color="danger"
              @click="handleDeleteTree(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table> <!-- 这里是修复的闭合标签 -->

      <!-- 批量生成二维码按钮 -->
      <div style="margin-top: 20px; text-align: right">
        <el-button 
          type="primary"
          @click="batchGenerateQRCode"
          :loading="generateQRLoading"
        >
          批量生成二维码
        </el-button>
      </div>
    </div>

    <!-- 果树详情弹窗 -->
    <el-dialog 
      v-model="showTreeDetailDialog" 
      title="果树详情" 
      width="600px"
      center
      :close-on-click-modal="false"
    >
      <div class="tree-detail-content">
        <el-descriptions 
          title="果树基础信息" 
          :column="1" 
          border 
        >
          <el-descriptions-item label="果树ID">
            {{ currentTree.id }}
          </el-descriptions-item>
          <el-descriptions-item label="果树品种">
            {{ currentTree.type || fullZoneInfo.type || activeZone.type || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="果实总数">
            {{ currentTree.countNum || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="成熟果实数量">
            {{ currentTree.ripeNum || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="成熟度">
            <el-tag :type="getRipeDegreeTagType(currentTree.ripeDegree)">
              {{ formatRipeDegree(currentTree.ripeDegree) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="健康状态">
            <el-tag :type="currentTree.healthCondition === '健康' ? 'success' : (currentTree.healthCondition === '异常' ? 'danger' : 'warning')">
              {{ currentTree.healthCondition || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="二维码">
            <div v-if="currentTree.url" style="display: flex; align-items: center; gap: 10px">
              <el-image 
                :src="currentTree.url"
                style="width: 80px; height: 80px"
                fit="contain"
                @click="handleQRCodeClick(currentTree.url)"
                :preview-src-list="[currentTree.url]"
              />
              <div>
                <el-button 
                  size="mini" 
                  type="primary"
                  @click.stop="downloadQRCode(currentTree.url, currentTree.id)"
                >
                  下载二维码
                </el-button>
              </div>
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showTreeDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 二维码预览弹窗 -->
    <el-dialog
      v-model="showQRViewer"
      title="二维码预览"
      width="400px"
      center
      :close-on-click-modal="true"
    >
      <div style="text-align: center; padding: 20px">
        <el-image
          :src="qrViewerUrl"
          style="width: 300px; height: 300px"
          fit="contain"
        >
          <template #error>
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999">
              图片加载失败
            </div>
          </template>
        </el-image>
        <el-button
          type="primary"
          size="mini"
          style="margin-top: 20px"
          @click="downloadQRCode(qrViewerUrl, '预览二维码')"
        >
          下载二维码
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

// 定义props
const props = defineProps({
  activeAreaId: {
    type: [String, Number],
    required: true,
    default: ''
  },
  activeZone: {
    type: Object,
    required: true,
    default: () => ({ trees: [], number: '', name: '', type: '', size: 0 })
  },
  treeList: {
    type: Array,
    required: true,
    default: () => []
  },
  fullZoneInfo: {
    type: Object,
    required: false,
    default: () => ({
      id: '',
      name: '',
      description: '',
      manager: '',
      type: '',
      fruitCount: '',
      size: 0,
      orchardId: '',
      number: ''
    })
  }
})

const emit = defineEmits(['tree-delete', 'tree-list-update'])

// 状态定义
const generateQRLoading = ref(false)
const showQRViewer = ref(false)
const qrViewerUrl = ref('')
const showTreeDetailDialog = ref(false)
const currentTree = reactive({})

// 核心修复：适配后端返回的字段结构
const sortedTreeList = computed(() => {
  // 1. 过滤掉无效数据
  const validTrees = (props.treeList || []).filter(tree => {
    return tree && tree.id !== undefined && tree.id !== null && tree.id !== ''
  })
  
  // 2. 打印完整数据，方便排查
  console.log('原始treeList数据：', props.treeList)
  console.log('过滤后有效数据：', validTrees)
  
  // 3. 适配后端返回的字段，保留所有原始数据
  return validTrees.map(tree => ({
    ...tree, // 保留所有原始字段
    // 字段适配：确保数据格式统一
    id: tree.id || '',
    type: tree.type || '',
    countNum: tree.countNum || '0',
    ripeNum: tree.ripeNum || '0',
    ripeDegree: tree.ripeDegree || null,
    healthCondition: tree.healthCondition || null,
    url: tree.url || null, // 二维码地址使用后端返回的url字段
    areaId: tree.areaId || '',
    typeId: tree.typeId || ''
  }))
})

// 格式化成熟度
const formatRipeDegree = (degree) => {
  if (degree === 'NaN' || !degree || degree === null) return '-'
  const numDegree = Number(degree)
  if (numDegree === 0) return '未成熟'
  if (numDegree > 0 && numDegree < 100) return `${numDegree}%`
  if (numDegree >= 100) return '已成熟'
  return '-'
}

// 获取成熟度标签类型
const getRipeDegreeTagType = (degree) => {
  if (degree === 'NaN' || !degree || degree === null) return 'warning'
  const numDegree = Number(degree)
  if (numDegree === 0) return 'info'
  if (numDegree > 0 && numDegree < 100) return 'primary'
  if (numDegree >= 100) return 'success'
  return 'warning'
}

// 查看果树详情
const showTreeDetail = (tree) => {
  Object.assign(currentTree, JSON.parse(JSON.stringify(tree)))
  showTreeDetailDialog.value = true
}

// 删除果树
const handleDeleteTree = (treeId) => {
  ElMessageBox.confirm(
    '确定要删除该果树吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    emit('tree-delete', treeId)
    ElMessage.success('果树删除成功！')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 批量生成二维码（适配新的字段结构）
const batchGenerateQRCode = async () => {
  const treeIds = sortedTreeList.value.map(tree => Number(tree.id))
  console.log('待生成二维码的果树ID：', treeIds)

  if (treeIds.length === 0) {
    ElMessage.warning('当前区域暂无有效果树ID，无法生成二维码！')
    return
  }

  try {
    generateQRLoading.value = true

    // 调用接口
    const generateResponse = await axios.post('/api/fruitTree/createTreeQRList', treeIds, {
      headers: { 'Content-Type': 'application/json' }
    })
    console.log('接口返回数据：', generateResponse.data)

    if (generateResponse.data && generateResponse.data.code === 200) { 
      const qrImgList = generateResponse.data.data || [] 
      console.log('后端返回的二维码URL：', qrImgList)

      // 校验数量
      if (qrImgList.length !== treeIds.length) {
        ElMessage.warning(`生成异常：二维码数量(${qrImgList.length})与果树数量(${treeIds.length})不匹配！`)
        return
      }

      // 修复：更新url字段（后端返回的字段名）
      const newTreeList = sortedTreeList.value.map((tree, index) => {
        let qrUrl = qrImgList[index]
        if (qrUrl && !qrUrl.startsWith('http')) {
          qrUrl = import.meta.env.VITE_API_BASE_URL + (qrUrl.startsWith('/') ? '' : '/') + qrUrl
        }
        return {
          ...tree,
          url: qrUrl // 使用url字段存储二维码地址
        }
      })
      console.log('待更新的果树列表：', newTreeList)

      // 通知父组件更新
      emit('tree-list-update', props.activeAreaId, newTreeList)
      
      // 强制触发响应式更新
      await nextTick()
      console.log('更新后表格数据：', sortedTreeList.value.map(t => ({
        id: t.id,
        url: t.url
      })))

      ElMessage.success(`成功生成 ${qrImgList.filter(Boolean).length} 个二维码！`)
    } else {
      ElMessage.error(`生成失败：${generateResponse.data?.msg || '接口返回异常'}`)
    }
  } catch (error) {
    console.error('批量生成二维码失败：', error)
    ElMessage.error(`生成失败：${error.response?.data?.msg || error.message || '网络异常，请稍后重试'}`)
  } finally {
    generateQRLoading.value = false
  }
}

// 二维码点击事件
const handleQRCodeClick = (imgUrl) => {
  qrViewerUrl.value = imgUrl
  showQRViewer.value = true
}

// 下载二维码
const downloadQRCode = async (imgUrl, treeId) => {
  try {
    // 修复：处理URL为空的情况
    if (!imgUrl) {
      ElMessage.warning('二维码URL为空，无法下载！')
      return
    }
    const link = document.createElement('a')
    link.href = imgUrl
    link.download = `果树${treeId}_二维码.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('二维码下载成功！')
  } catch (error) {
    console.error('二维码下载失败：', error)
    ElMessage.error('二维码下载失败，请稍后重试！')
  }
}

// 监听activeAreaId变化
watch(
  () => props.activeAreaId,
  (newVal) => {
    if (!newVal) {
      showTreeDetailDialog.value = false
      Object.assign(currentTree, {})
      showQRViewer.value = false
    }
  },
  { immediate: true }
)

// 监听treeList变化，实时打印字段信息
watch(() => props.treeList, (newList) => {
  console.log('★ treeList更新通知 ★')
  console.log('新数据：', newList)
  console.log('二维码字段(url)：', newList.map(t => ({
    id: t?.id,
    url: t?.url
  })))
}, { deep: true, immediate: true })
</script>

<style scoped>
.zone-main {
  flex: 1;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  background-color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.map-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.map-tips {
  color: #999;
  font-size: 16px;
}

.tree-list-container {
  flex: 1;
  overflow: auto;
  width: 100%; /* 新增：确保容器占满父元素宽度 */
}

.zone-info {
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zone-info h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.zone-desc {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 14px;
}

/* 果树详情样式 */
.tree-detail-content {
  padding: 10px 0;
}

/* 核心修复：强制表格单元格高度，确保二维码显示 */
:deep(.el-table-cell) {
  height: 80px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 二维码样式 */
.qrcode-container {
  width: 60px !important;
  height: 60px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.qrcode-img {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  cursor: pointer;
}

.qrcode-download-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0,0,0,0.5);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.no-qrcode {
  color: #999;
  font-size: 12px;
}

.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  color: #999;
  font-size: 10px;
  background-color: #f5f7fa;
}
</style>