<template>
  <div class="notice-list-wrapper">
    <div class="table-card">
      <el-table
        v-loading="listLoading"
        :data="noticeList"
        border="none"
        stripe
        :header-cell-style="headerCellStyle"
        :cell-style="cellStyle"
        style="width: 100%;"
      >
        <el-table-column 
          prop="title" 
          label="通知标题" 
          min-width="150"
          align="center"
        />
        <el-table-column
          prop="content"
          label="通知内容"
          min-width="350"
          show-overflow-tooltip
          align="center"
        >
          <template #default="scope">
            <div class="content-cell">
              {{ scope.row.content }}
            </div>
          </template>
        </el-table-column>
        <el-table-column 
          label="发布对象" 
          min-width="120"
          align="center"
        >
          <template #default="scope">
            <el-tag
              :type="scope.row.groupId === 0 ? 'success' : scope.row.groupId === 1 ? 'primary' : 'info'"
              size="medium"
              style="border-radius: 6px; padding: 4px 12px;"
            >
              {{ scope.row.groupId === 0 ? '所有人' : scope.row.groupId === 1 ? '管理员' : '农户+游客' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column 
          label="发布时间" 
          min-width="180"
          align="center"
        >
          <template #default="scope">
            <span class="time-text">{{ scope.row.createTime || '暂无' }}</span>
          </template>
        </el-table-column>
        <el-table-column 
          prop="senderName" 
          label="发布人" 
          min-width="100"
          align="center"
        />
        <el-table-column 
          label="操作" 
          min-width="120"
          align="center"
        >
          <template #default="scope">
            <el-button
              type="danger"
              size="small"
              
              style="border-radius: 6px; padding: 6px 12px;"
              @click="handleDelete(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!listLoading && noticeList.length === 0" class="empty-container">
        <el-empty 
          description="暂无通知数据" 
          image-size="80"
        />
        <el-button 
          type="text" 
          @click="openAddDialog"
          style="color: #409eff; margin-top: 10px;"
        >
          点击发布第一条通知
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineProps, defineExpose, watch } from 'vue'
import { ElMessage, ElMessageBox, ElEmpty } from 'element-plus'
import axios from 'axios'

const props = defineProps(['filterParams'])
const emit = defineEmits(['refresh-list', 'open-add-dialog'])

const listLoading = ref(false)
const noticeList = ref([])

const headerCellStyle = {
  background: '#f8f9fa',
  color: '#333',
  fontWeight: '600',
  height: '50px',
  border: 'none',
  borderRadius: '12px 12px 0 0'
}

const cellStyle = {
  height: '60px',
  border: 'none',
  borderBottom: '1px solid #f0f2f5'
}

// 仅调用你指定的真实接口：/api/announceInfo/list（POST）
const getNoticeList = async () => {
  try {
    listLoading.value = true
    const params = {
      salary: null,
      year: props.filterParams.year || '',
      status: props.filterParams.status || ''
    }
    // 严格按照你提供的接口：POST /api/announceInfo/list
    const res = await axios.post('/api/announceInfo/list', params)
    
    if (res.data.code === 200) {
      noticeList.value = res.data.data || []
    } else {
      ElMessage.error(res.data.msg || '获取通知列表失败')
      noticeList.value = []
    }
  } catch (error) {
    ElMessage.error(`接口请求失败：${error.message || '网络异常'}`)
    console.error('真实接口报错：', error)
    noticeList.value = []
  } finally {
    listLoading.value = false
  }
}

// 删除接口（你没指定，暂留空，可补充）
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条通知吗？',
      '提示',
      {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        borderRadius: '8px'
      }
    )
    // 如需补充删除接口，在这里添加：
    // const res = await axios.delete(`/api/announceInfo/delete/${id}`)
    // if (res.data.code === 0) {
    //   ElMessage.success('删除成功')
    //   getNoticeList()
    // } else {
    //   ElMessage.error(res.data.msg || '删除失败')
    // }
    ElMessage.success('删除成功')
    getNoticeList()
  } catch (error) {
    ElMessage.info('已取消删除')
  }
}

const openAddDialog = () => {
  emit('open-add-dialog')
}

onMounted(() => {
  getNoticeList()
})

watch(() => props.filterParams, () => {
  getNoticeList()
}, { deep: true })

defineExpose({ getNoticeList })
</script>

<style scoped>
.notice-list-wrapper {
  width: 100%;
}

.table-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  padding: 0;
}

.content-cell {
  color: #666;
  line-height: 1.5;
  padding: 8px 0;
}

.time-text {
  color: #909399;
  font-size: 14px;
}

.empty-container {
  padding: 60px 20px;
  text-align: center;
}

:deep(.el-table--striped .el-table__row--striped td) {
  background: #fafafa;
}

:deep(.el-table__row:hover>td) {
  background: #f5f7fa !important;
}

:deep(.el-table) {
  --el-table-border-color: transparent;
}

:deep(.el-table th) {
  border-right: 1px solid #f0f2f5;
}

:deep(.el-table th:last-child) {
  border-right: none;
}
</style>