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
          <!-- 优先使用fullZoneInfo的编号和名称，兜底用activeZone -->
          <h3>区域{{ fullZoneInfo.number || activeZone.number }}：{{ fullZoneInfo.name || activeZone.name }}</h3>
          <p class="zone-desc">
            <!-- 负责人：优先fullZoneInfo.manager，其次activeZone.manager，兜底"未设置" -->
            负责人：{{ fullZoneInfo.manager || activeZone.manager || '未设置' }} | 
            <!-- 品种：优先fullZoneInfo.type，其次activeZone.type，兜底"-" -->
            品种：{{ fullZoneInfo.type || activeZone.type || '-' }} | 
            <!-- 核心优化：果树总数优先用实际列表长度，其次用表单/区域的数值 -->
            果树总数：{{ sortedTreeList.length || fullZoneInfo.size || fullZoneInfo.fruitCount || activeZone.size || 0 }}
          </p>
        </div>
      </div>
      
      <!-- 果树表格 -->
      <el-table 
        :data="sortedTreeList" 
        border 
        stripe 
        style="width: 100%; margin-top: 20px"
        :header-cell-style="{ backgroundColor: '#f8f9fa' }"
        :empty-text="`该区域暂无果树数据（无ID）`"
      >
        <!-- 果树编号 -->
        <el-table-column 
          label="果树编号" 
          width="180" 
        >
          <template #default="scope">
            {{ scope.row.id }}
          </template>
        </el-table-column>
        <el-table-column 
          label="成熟度" 
          width="120"
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
          width="120"
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
          width="120"
        >
          <template #default="scope">
            <div class="qrcode-container" v-if="scope.row.qrCodeUrl">
              <!-- 二维码点击事件：查看大图+下载 -->
              <el-image 
                :src="scope.row.qrCodeUrl"
                fit="contain"
                class="qrcode-img"
                @click="handleQRCodeClick(scope.row.qrCodeUrl)"
                :preview-src-list="[scope.row.qrCodeUrl]"
              >
                <template #error>
                  <div class="image-slot">图片加载失败</div>
                </template>
              </el-image>
              <!-- 下载按钮 -->
              <el-button 
                size="mini" 
                icon="el-icon-download" 
                class="qrcode-download-btn"
                @click.stop="downloadQRCode(scope.row.qrCodeUrl, scope.row.id)"
                type="text"
              ></el-button>
            </div>
            <span class="no-qrcode" v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column 
          label="操作" 
          width="180"
        >
          <template #default="scope">
            <el-button 
              size="small" 
              type="text"
              @click="showTreeDetail(scope.row)"
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
      </el-table>

      <!-- 批量生成二维码按钮（增加加载状态） -->
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
            <!-- 果树详情中也优先使用区域的品种信息 -->
            {{ currentTree.type || fullZoneInfo.type || activeZone.type || '-' }}
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
          <el-descriptions-item label="果实数量">
            {{ currentTree.countNum || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="成熟果实数量">
            {{ currentTree.ripeNum || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="二维码">
            <div v-if="currentTree.qrCodeUrl" style="display: flex; align-items: center; gap: 10px">
              <el-image 
                :src="currentTree.qrCodeUrl"
                style="width: 80px; height: 80px"
                fit="contain"
                @click="handleQRCodeClick(currentTree.qrCodeUrl)"
                :preview-src-list="[currentTree.qrCodeUrl]"
              />
              <div>
                <el-button 
                  size="mini" 
                  type="primary"
                  @click.stop="downloadQRCode(currentTree.qrCodeUrl, currentTree.id)"
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
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox, ElImageViewer } from 'element-plus'
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
  // 允许父组件更新果树列表
  treeList: {
    type: Array,
    required: true,
    default: () => []
  },
  // 父组件传递的完整区域表单数据
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
      size: 0, // 新增：适配父组件的size字段
      orchardId: '',
      number: ''
    })
  }
})

// 定义emit事件
const emit = defineEmits([
  'tree-delete',    // 删除果树
  'tree-list-update' // 通知更新果树列表
])

// 新增：批量生成二维码加载状态
const generateQRLoading = ref(false)
// 二维码预览相关
const showQRViewer = ref(false)
const qrViewerUrl = ref('')

// 果树详情相关
const showTreeDetailDialog = ref(false)
const currentTree = reactive({})

// 排序后的果树列表
const sortedTreeList = computed(() => {
  return (props.treeList || []).filter(tree => {
    return tree.id !== undefined && tree.id !== null && tree.id !== '' && !isNaN(tree.id)
  }).map(tree => {
    return {
      id: tree.id,
      ripeDegree: tree.ripeDegree ?? null,
      healthCondition: tree.healthCondition ?? null,
      qrCodeUrl: tree.qrCodeUrl ?? tree.img ?? null, // 兼容旧img字段，优先用新的qrCodeUrl
      type: tree.type ?? null,
      countNum: tree.countNum ?? null,
      ripeNum: tree.ripeNum ?? null
    }
  })
})

// 格式化成熟度显示
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

// 批量生成二维码（修复核心逻辑）
const batchGenerateQRCode = async () => {
  // 1. 提取果树ID，转为Long类型（Number在JS中兼容Long）
  const treeIds = sortedTreeList.value.map(tree => Number(tree.id))
  
  // 2. 前置校验：无果树ID时提示
  if (treeIds.length === 0) {
    ElMessage.warning('当前区域暂无有效果树ID，无法生成二维码！')
    return
  }

  try {
    generateQRLoading.value = true // 开启加载状态

    // 3. 调用批量生成二维码接口
    const generateResponse = await axios.post('/api/fruitTree/createTreeQRList', treeIds, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 4. 处理生成接口返回结果
    if (generateResponse.data && generateResponse.data.code === 200) { 
      const qrImgList = generateResponse.data.data || [] 
      
      // 校验：二维码数量与果树数量匹配
      if (qrImgList.length !== treeIds.length) {
        ElMessage.warning(`生成异常：二维码数量(${qrImgList.length})与果树数量(${treeIds.length})不匹配！`)
        return
      }

      // 5. 构建新的果树列表（关联二维码URL）
      const newTreeList = sortedTreeList.value.map((tree, index) => ({
        ...tree,
        qrCodeUrl: qrImgList[index] // 使用后端返回的完整URL
      }))

      // 6. 通知父组件更新列表（持久化二维码数据）
      emit('tree-list-update', props.activeAreaId, newTreeList)

      ElMessage.success(`成功生成 ${qrImgList.length} 个二维码！`)
    } else {
      ElMessage.error(`生成失败：${generateResponse.data?.msg || '接口返回异常'}`)
    }
  } catch (error) {
    console.error('批量生成二维码失败：', error)
    if (error.response) {
      console.error('后端返回错误详情：', error.response.data)
      console.error('请求状态码：', error.response.status)
    }
    ElMessage.error(`生成失败：${error.response?.data?.msg || error.message || '网络异常，请稍后重试'}`)
  } finally {
    generateQRLoading.value = false // 关闭加载状态
  }
}

// 二维码点击事件：查看大图
const handleQRCodeClick = (imgUrl) => {
  qrViewerUrl.value = imgUrl
  showQRViewer.value = true
}

// 下载二维码（修复URL拼接问题）
const downloadQRCode = async (imgUrl, treeId) => {
  try {
    // 创建下载链接（直接使用完整URL）
    const link = document.createElement('a')
    link.href = imgUrl
    link.download = `果树${treeId}_二维码.png` // 设置下载文件名
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('二维码下载成功！')
  } catch (error) {
    console.error('二维码下载失败：', error)
    ElMessage.error('二维码下载失败，请稍后重试！')
  }
}

// 优化：监听activeAreaId变化，仅清空详情弹窗（移除无意义的emit）
watch(
  () => props.activeAreaId,
  (newVal) => {
    if (!newVal) {
      showTreeDetailDialog.value = false // 切换区域时关闭详情弹窗
      Object.assign(currentTree, {}) // 清空当前果树详情
      showQRViewer.value = false // 关闭二维码预览
    }
  },
  { immediate: true }
)
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

/* 二维码样式 */
.qrcode-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
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