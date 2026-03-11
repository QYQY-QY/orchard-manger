<template>
  <div class="recruit-list-wrapper">
    <el-table :data="filteredList" stripe style="width: 100%">
      <el-table-column prop="title" label="招聘标题" min-width="200px" />
      <!-- 新增：招聘人数（需招人数） -->
      <el-table-column label="招聘人数" width="120px">
        <template #default="{ row }">
          {{ row.recruitNum || 0 }} 人
        </template>
      </el-table-column>
      <!-- 新增：已招人数 -->
      <el-table-column label="已招人数" width="120px">
        <template #default="{ row }">
          {{ row.recruitedNum || 0 }} 人
        </template>
      </el-table-column>
      <!-- 新增：日薪 -->
      <el-table-column label="日薪（元）" width="120px">
        <template #default="{ row }">
          {{ row.dailyWage || 0 }}
        </template>
      </el-table-column>
      <!-- 优化：招聘地点（空值兜底） -->
      <el-table-column label="招聘地点" width="150px">
        <template #default="{ row }">
          {{ row.orchardName || `果园${row.orchardId}` }}
        </template>
      </el-table-column>
      <!-- 优化：发布时间（格式化 + 空值兜底） -->
      <el-table-column label="发布时间" width="180px">
        <template #default="{ row }">
          {{ row.createTime ? formatTime(row.createTime) : '未设置' }}
        </template>
      </el-table-column>
      <!-- 核心优化：招聘状态（绑定后端 isFinish 字段，0/1/2 对应状态） -->
      <el-table-column label="招聘状态" width="120px">
        <template #default="{ row }">
          <el-tag
            :type="getStatusTagType(row.isFinish)"
          >
            {{ getStatusText(row.isFinish) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180px">
        <template #default="{ row }">
          <el-button link type="primary" @click="emit('view-detail', row)">
            详情
          </el-button>
          <el-button link type="danger" @click="handleDelete(row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 新增：时间格式化工具（统一格式，兼容后端返回的两种时间格式）
// reList.vue 中的 formatTime 函数
const formatTime = (time) => {
  if (!time) return '未设置'
  
  // 步骤1：解析时间为本地时间戳
  const localTime = new Date(time).getTime()
  // 步骤2：加上8小时时区偏移（抵消toISOString的UTC转换）
  const utc8Time = new Date(localTime + 8 * 60 * 60 * 1000)
  // 步骤3：删除T/Z，去掉毫秒，补全格式
  const iso = utc8Time.toISOString()
  const noTZ = iso.replace(/T|Z/g, '')
  const noMs = noTZ.split('.')[0]
  
  return noMs.slice(0, 10) + ' ' + noMs.slice(10)
}
// 新增：根据后端 isFinish 状态码获取标签类型
const getStatusTagType = (isFinish) => {
  // 0:未完成, 1:进行中, 2:已完成
  switch (Number(isFinish)) {
    case 0: return 'warning'
    case 1: return 'primary'
    case 2: return 'success'
    default: return 'warning' // 兜底
  }
}

// 新增：根据后端 isFinish 状态码获取文字描述
const getStatusText = (isFinish) => {
  switch (Number(isFinish)) {
    case 0: return '未完成'
    case 1: return '进行中'
    case 2: return '已完成'
    default: return '未完成'
  }
}

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