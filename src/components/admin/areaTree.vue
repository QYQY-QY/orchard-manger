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
          <h3>区域{{ activeZone.number }}：{{ activeZone.name }}</h3>
          <p class="zone-desc">
            负责人：{{ activeZone.manager || '未设置' }} | 品种：{{ activeZone.type }} | 果树总数：{{ activeZone.size }}
          </p>
        </div>
        <!-- 详情按钮 -->
        <div class="zone-info-actions">
          <el-button size="small" @click="handleZoneDetail(activeZone)">查看详情</el-button>
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
          width="100"
        >
          <template #default="scope">
            <div class="qrcode-container" v-if="scope.row.img">
              <el-image 
                :src="`/api/minio/preview/${scope.row.img}`"
                fit="contain"
                class="qrcode-img"
                preview-src-list="[]"
              >
                <template #error>
                  <div class="image-slot">图片加载失败</div>
                </template>
              </el-image>
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
            {{ currentTree.type || activeZone.type || '-' }}
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
            <div v-if="currentTree.img" style="display: flex; align-items: center">
              <el-image 
                :src="`/api/minio/preview/${currentTree.img}`"
                style="width: 80px; height: 80px"
                fit="contain"
              />
              <span style="margin-left: 10px">点击查看大图</span>
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showTreeDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
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
  // 允许父组件更新果树列表
  treeList: {
    type: Array,
    required: true,
    default: () => []
  }
})

// 定义emit事件
const emit = defineEmits([
  'tree-delete',    // 删除果树
  'zone-detail',    // 查看区域详情（透传）
  'tree-list-update' // 通知更新果树列表
])

// 新增：批量生成二维码加载状态
const generateQRLoading = ref(false)

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
      img: tree.img ?? null,
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

// 查看区域详情（透传）
const handleZoneDetail = (zone) => {
  emit('zone-detail', zone)
}

// 核心修改：批量生成二维码（适配后端@RequestParam传递Long类型ID集合）
// 核心修改：批量生成二维码（适配后端@RequestBody List<Long> ids）
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

    // 3. 调用接口：POST请求 + JSON请求体（适配@RequestBody List<Long> ids）
    // 关键修改：将ID数组作为请求体传递，不再使用URL查询参数
    const response = await axios.post('/api/fruitTree/createTreeQRList', treeIds, {
      headers: {
        'Content-Type': 'application/json' // 确保是JSON格式
      }
    })

    // 5. 处理接口返回结果（逻辑完全不变）
    if (response.data && response.data.code === 0) {
      const qrImgList = response.data.data || [] // 后端返回的图片路径数组
      
      // 校验：二维码数量与果树数量匹配
      if (qrImgList.length !== treeIds.length) {
        ElMessage.warning(`生成异常：二维码数量(${qrImgList.length})与果树数量(${treeIds.length})不匹配！`)
        return
      }

      // 6. 给每个果树分配对应的二维码路径
      const updatedTreeList = sortedTreeList.value.map((tree, index) => ({
        ...tree,
        img: qrImgList[index] // 绑定二维码路径
      }))

      // 7. 通知父组件更新果树列表，让二维码显示在表格中
      emit('tree-list-update', props.activeAreaId, updatedTreeList)
      ElMessage.success('批量生成二维码成功！')
    } else {
      ElMessage.error(`生成失败：${response.data?.msg || '接口返回异常'}`)
    }
  } catch (error) {
    // 详细日志便于排查问题
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

// 监听激活区域变化，重新加载果树列表
watch(
  () => props.activeAreaId,
  async (newVal) => {
    if (newVal) {
      emit('tree-list-update', newVal)
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
}

.qrcode-img {
  width: 60px;
  height: 60px;
  border-radius: 4px;
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