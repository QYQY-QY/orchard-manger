<template>
  <div class="orchard-area">
    <!-- 头部：标题 + 右侧小字 -->
    <div class="header">
      <span class="main-title">{{ activeOrchard.name || '未选择果园' }}</span>
      <!-- 第二行文字移到标题右侧，小字展示 -->
      <span class="sub-title">
        负责人：{{ activeOrchard.manager || '未设置' }} | 位置：{{ activeOrchard.address || '-' }}
      </span>
    </div>

    <div class="area-list">
      <div
        v-for="area in areaList"
        :key="area.id"
        class="area-item"
        :class="{ active: area.id === activeAreaId }"
        @click="$emit('area-select', area.id)"
      >
        <div class="area-name">区域{{ area.id }}：{{ area.name }}</div>
        <div class="area-desc">{{ area.cropType || '-' }}</div>
        <el-button type="text" size="small" @click.stop="showEditDialog(area)">区域详情</el-button>
      </div>
    </div>

    <!-- 添加/编辑对话框（圆角） -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogType === 'add' ? '添加区域' : '编辑区域'" 
      width="500px"
      border-radius="12px"
    >
      <el-form :model="form" label-width="80px" class="form-container">
        <el-form-item label="区域名称">
          <el-input v-model="form.name" placeholder="请输入区域名称" border-radius="6px" />
        </el-form-item>
        <el-form-item label="区域负责人">
          <el-input v-model="form.manager" placeholder="请输入区域负责人" border-radius="6px" />
        </el-form-item>
        <el-form-item label="种植品种">
          <el-input v-model="form.cropType" placeholder="请输入种植品种" border-radius="6px" />
        </el-form-item>
        <el-form-item label="果树总数">
          <el-input-number v-model="form.totalTrees" :min="0" placeholder="请输入果树总数" border-radius="6px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button border-radius="6px">取消</el-button>
        <el-button type="primary" border-radius="6px" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const props = defineProps({
  orchardId: { type: String, default: '' },
  activeOrchard: { type: Object, default: () => ({}) },
  areaList: { type: Array, default: () => [] },
  activeAreaId: { type: String, default: '' }
})

const emit = defineEmits(['area-select', 'area-update'])

const dialogVisible = ref(false)
const dialogType = ref('add')

const form = reactive({
  id: '',
  name: '',
  manager: '',
  cropType: '',
  totalTrees: 0,
  orchardId: props.orchardId
})

const showAddDialog = () => {
  dialogType.value = 'add'
  Object.assign(form, { id: '', name: '', manager: '', cropType: '', totalTrees: 0, orchardId: props.orchardId })
  dialogVisible.value = true
}

const showEditDialog = (area) => {
  dialogType.value = 'edit'
  Object.assign(form, area)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    const url = dialogType.value === 'add' ? '/api/area/add' : '/api/area/update'
    const res = await axios.post(url, { ...form, orchardId: props.orchardId })
    if (res.data?.code === 200) {
      ElMessage.success(dialogType.value === 'add' ? '添加成功' : '编辑成功')
      dialogVisible.value = false
      emit('area-update', {
        type: dialogType.value,
        data: res.data.data
      })
    } else {
      ElMessage.error('操作失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('网络错误')
  }
}

const handleDelete = async (id) => {
  try {
    const res = await axios.post('/api/area/delete', { id })
    if (res.data?.code === 200) {
      ElMessage.success('删除成功')
      emit('area-update', { type: 'delete', id })
    } else {
      ElMessage.error('删除失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('网络错误')
  }
}
</script>

<style scoped>
.orchard-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px; /* 组件容器圆角 */
  overflow: hidden;
}

/* 头部：标题+右侧小字布局 */
.header {
  display: flex;
  justify-content: space-between; /* 标题左，小字右 */
  align-items: center;
  padding: 0 16px;
  height: 50px;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}

/* 主标题 */
.main-title {
  font-weight: 600;
  color: #333;
}

/* 右侧小字 */
.sub-title {
  font-size: 12px;
  color: #666;
  white-space: nowrap; /* 防止换行 */
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px; /* 限制宽度，避免挤压标题 */
}

.area-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* 列表项圆角 */
.area-item {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.area-item:hover {
  background-color: #f8f9fa;
  border-color: #e8e8e8;
}

.area-item.active {
  background-color: #e6f7ff;
  border-color: #409eff;
}

.area-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
  font-weight: 500;
}

.area-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.area-item .el-button {
  font-size: 12px;
  padding: 0;
  color: #409eff;
}

/* 表单容器 */
.form-container {
  padding: 8px 0;
}

/* 滚动条美化 */
.area-list::-webkit-scrollbar {
  width: 6px;
}
.area-list::-webkit-scrollbar-thumb {
  background: #dcdcdc;
  border-radius: 3px;
}
.area-list::-webkit-scrollbar-track {
  background: #f5f5f5;
}
</style>