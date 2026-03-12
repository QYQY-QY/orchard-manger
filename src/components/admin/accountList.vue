<template>
  <div class="table-container">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <el-icon size="20"><Loading /></el-icon>
      <span class="loading-text">正在加载账号列表...</span>
    </div>

    <!-- 空数据 -->
    <div v-else-if="filteredTableData.length === 0" class="empty-container">
      <el-empty description="暂无账号数据" />
    </div>

    <!-- 账号列表 -->
    <el-table
      v-else
      :data="filteredTableData"
      style="width: 100%"
      :header-cell-style="{ backgroundColor: '#ffffff', color: '#333' }"
      :cell-style="{ color: '#666' }"
      stripe
      :show-header-overflow="false"
      :show-column-overflow="false"
      v-loading="loading"
    >
      <el-table-column prop="id" label="账号ID" width="220" />
      <el-table-column prop="name" label="用户名" width="150">
        <template #default="{ row }">
          {{ row.username || '未设置' }}
        </template>
      </el-table-column>
      <el-table-column prop="isAdmin" label="账号类型" width="120">
        <template #default="{ row }">
          <el-tag size="small" :type="getTypeTagType(row.isAdmin)">
            {{ getTypeText(row.isAdmin) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sex" label="性别" width="100">
        <template #default="{ row }">
          <span>{{ Number(row.sex) === 1 ? '男' : Number(row.sex) === 0 ? '女' : '未填写' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="账号状态" width="120">
        <template #default="{ row }">
          <el-tag
            size="small"
            :type="Number(row.status) === 0 ? 'danger' : 'success'"
          >
            {{ Number(row.status) === 0 ? '禁用' : '启用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="实名信息" min-width="180">
        <template #default="{ row }">
          <span v-if="row.id_card && validateIdCard(row.id_card)" class="name-yes">{{ formatIdCard(row.id_card) }}</span>
          <el-button 
            v-else 
            link 
            type="primary" 
            size="small" 
            @click="emit('to-realname', row)"
          >
            去实名
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240">
        <template #default="scope">
          <el-button link type="primary" @click="emit('detail', scope.row)">查看详情</el-button>
          <el-button 
            v-if="Number(scope.row.status) !== 1" 
            type="primary" 
            size="small" 
            style="margin-left: 8px;"
            @click="handleChangeStatus(scope.row, 1)"
          >
            启用
          </el-button>
          <el-button 
            v-if="Number(scope.row.status) !== 0" 
            type="danger" 
            size="small" 
            style="margin-left: 8px;"
            @click="handleChangeStatus(scope.row, 0)"
          >
            禁用
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted, watch,defineExpose } from 'vue'
import { ElMessage, ElIcon, ElEmpty } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import axios from 'axios'
import dayjs from 'dayjs'

// 接收props（统一类型）
const props = defineProps({
  filteredTableData: {
    type: Array,
    required: true,
    default: () => []
  },
  orchardId: {
    type: [String, Number],
    required: true
  },
  filterType: {
    type: [String, Number],
    default: ''
  },
  filterStatus: {
    type: [String, Number],
    default: ''
  }
})

// 定义事件
const emit = defineEmits(['detail', 'changeStatus', 'real-name-saved', 'to-realname', 'list-loaded'])

// 加载状态
const loading = ref(false)

// ========== 方法 ==========
// 状态切换（统一转Number）
const handleChangeStatus = (row, targetStatus) => {
  emit('changeStatus', row, Number(targetStatus))
}

// 获取账号列表
const getAccountList = async () => {
  try {
    loading.value = true
    const orchardId = Number(props.orchardId)
    const res = await axios.get(`/api/employee/getAll/?orchardId=${orchardId}`)
    
    if (res.data.code === 200) {
      const formatList = res.data.data
        .filter(item => [3, 6].includes(Number(item.isAdmin)))
        .map(item => ({
          id: String(item.id),
          orchardId: String(item.orchardId),
          orchardName: item.orchardName || '',
          username: item.username || '',
          name: item.name || '新账号',
          phone: item.phone || '',
          sex: Number(item.sex) || 0,
          id_card: item.id_card || '',
          status: Number(item.status) || 0, // 统一默认禁用
          createTime: dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss'), // 无时区
          updateTime: dayjs(item.updateTime).format('YYYY-MM-DD HH:mm:ss'),
          headImg: item.headImg || '',
          isAdmin: String(item.isAdmin),
          openId: item.openId || '',
          areaId: item.areaId || ''
        }))
      emit('list-loaded', formatList)
    } else {
      ElMessage.error(res.data.msg || '获取账号列表失败')
    }
  } catch (err) {
    console.error('获取账号列表失败：', err)
    ElMessage.error('网络异常，获取账号列表失败')
  } finally {
    loading.value = false
  }
}

// 身份证校验（18位）
const validateIdCard = (idCard) => {
  if (!idCard) return false
  const idStr = String(idCard)
  const reg = /^\d{18}|\d{17}X$/i
  return reg.test(idStr)
}

// 身份证加密（仅对有效身份证加密）
const formatIdCard = (idCard) => {
  if (!validateIdCard(idCard)) return '未实名'
  const idStr = String(idCard)
  return idStr.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
}

// 时间格式化（无时区）
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  try {
    // 处理带毫秒的时间字符串（如 "2025-01-01 12:00:00.123"）
    const cleanedTimeStr = timeStr.split('.')[0] // 截断毫秒部分
    const date = new Date(cleanedTimeStr)
    // 兼容Invalid Date情况
    if (isNaN(date.getTime())) {
      return timeStr
    }
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
  } catch (e) {
    return timeStr // 解析失败时返回原始值
  }
}

// 账号类型文字
const getTypeText = (isAdmin) => {
  switch (Number(isAdmin)) {
    case 3: return '农户'
    case 6: return '临时工'
    default: return '未知类型'
  }
}

// 账号类型标签样式
const getTypeTagType = (isAdmin) => {
  switch (Number(isAdmin)) {
    case 3: return 'primary'
    case 6: return 'success'
    default: return 'info'
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  if (props.orchardId) {
    getAccountList()
  }
})

watch(() => props.orchardId, (newVal) => {
  if (newVal) {
    getAccountList()
  }
})
</script>

<style scoped>
.table-container {
  flex: 1;
  border-radius: 8px;
  padding: 16px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: auto;
  position: relative;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 8px;
  color: #666;
}

.empty-container {
  padding: 40px 0;
  text-align: center;
}

.name-yes {
  color: #67c23a;
  font-weight: 500;
}

:deep(.el-table) {
  --el-table-header-text-color: #303133;
  --el-table-row-hover-bg-color: #ffffff;
  --el-table-row-stripe-bg-color: #ffffff;
  --el-table-border-color: transparent;
}

:deep(.el-table th),
:deep(.el-table td) {
  border: none !important;
}

:deep(.el-button--link) {
  padding: 0;
  margin-right: 8px;
}
</style>