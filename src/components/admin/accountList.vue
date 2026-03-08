<template>
  <div class="table-container">
    <el-table
      :data="filteredTableData"
      style="width: 100%"
      :header-cell-style="{ backgroundColor: '#ffffff', color: '#333' }"
      :cell-style="{ color: '#666' }"
      stripe
      :show-header-overflow="false"
      :show-column-overflow="false"
    >
      <el-table-column prop="id" label="账号ID" width="120" />
      <el-table-column prop="type" label="用户类型" width="120">
        <template #default="{ row }">
          <el-tag size="small" :type="row.type === 'temp' ? 'primary' : 'success'">
            {{ row.type === 'temp' ? '临时工' : '巡逻员' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="账号状态" width="120">
        <template #default="{ row }">
          <el-tag
            size="small"
            :type="
              row.status === 'active' ? 'success' : row.status === 'inactive' ? 'warning' : 'danger'
            "
          >
            {{
              row.status === 'active' ? '已激活' : row.status === 'inactive' ? '未激活' : '已禁用'
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="realName" label="实名信息" min-width="150">
        <template #default="{ row }">
          {{ row.realName || '未实名' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="emit('detail', row)">查看详情</el-button>
          <el-button 
            link 
            type="success" 
            @click="emit('activate', row)"
            v-if="row.realName && row.status === 'inactive'"
          >
            激活账号
          </el-button>
          <el-button 
            link 
            type="danger" 
            @click="emit('disable', row)"
            v-if="row.status !== 'disabled'"
          >
            禁用账号
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
const props = defineProps({
  filteredTableData: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['detail', 'activate', 'disable', 'real-name-saved'])
</script>

<style scoped>
/* 表格容器 */
.table-container {
  flex: 1;
  border-radius: 8px;
  padding: 16px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: auto;
}

/* 表格样式调整 */
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
</style>