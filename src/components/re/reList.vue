<template>
  <div class="recruit-list-wrapper">
    <el-table :data="filteredList" stripe style="width: 100%">
      <el-table-column prop="title" label="招聘标题" min-width="200px" />
      <el-table-column prop="orchardName" label="招聘地点" width="150px" />
      <el-table-column prop="createTime" label="发布时间" width="180px" />
      <el-table-column label="招聘状态" width="120px">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 2 ? 'success' : (row.status === 1 ? 'primary' : 'warning')"
          >
            {{ row.status === 2 ? '已完成' : (row.status === 1 ? '进行中' : '未完成') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180px">
        <template #default="{ row }">
          <el-button link type="primary" @click="emit('view-detail', row)">
            任务详情
          </el-button>
          <el-button link type="danger" @click="handleDelete(row.id)">
            删除招聘
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  filteredList: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['view-detail', 'delete-recruit', 'list-loaded'])

// 删除招聘任务
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除该招聘任务, 是否继续?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('delete-recruit', id)
  } catch (error) {
    ElMessage.info('已取消删除')
  }
}
</script>

<style scoped>
.recruit-list-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

:deep(.el-table) {
  --el-table-header-text-color: #303133;
  --el-table-row-hover-bg-color: #ffffff;
  --el-table-row-stripe-bg-color: #ffffff;
}

:deep(.el-tag) {
  padding: 2px 8px;
}
</style>