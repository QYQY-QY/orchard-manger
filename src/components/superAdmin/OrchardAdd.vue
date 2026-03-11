<template>
  <div class="orchard-add">
    <div class="header">
      <span>添加果园</span>
      <el-button 
        type="primary" 
        text 
        @click="showAddDialog"
        class="add-btn"
      >+</el-button>
    </div>

    <div class="orchard-list">
      <div
        v-for="orchard in orchardList"
        :key="orchard.id"
        class="orchard-item"
        :class="{ active: orchard.id === activeOrchardId }"
        @click="$emit('orchard-select', orchard.id)"
      >
        <div class="item-title">
          果园{{ orchard.id }}：{{ orchard.name }}
        </div>
        <div class="item-info">
          果园负责人：{{ orchard.manager }}
        </div>
        <div class="item-actions">
          <el-button type="primary" text size="small" @click.stop="showEditDialog(orchard)">查看详情</el-button>
          <el-button type="danger" text size="small" @click.stop="handleDelete(orchard.id)">删除果园</el-button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑对话框（圆角美化） -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogType === 'add' ? '添加果园' : '编辑果园'" 
      width="500px"
      border-radius="12px" 
    >
      <el-form 
        :model="form" 
        label-width="80px"
        class="form-container"
      >
        <el-form-item label="果园名称">
          <el-input 
            v-model="form.name" 
            placeholder="请输入果园名称"
            border-radius="6px" 
          />
        </el-form-item>
        <el-form-item label="果园地点">
          <el-input 
            v-model="form.location" 
            placeholder="请输入果园地点"
            border-radius="6px"
          />
        </el-form-item>
        <el-form-item label="果园管理员">
          <el-select 
            v-model="form.managerId" 
            placeholder="请选择管理员"
            border-radius="6px"
          >
            <el-option
              v-for="admin in adminList"
              :key="admin.id"
              :label="admin.name"
              :value="admin.id"
            />
          </el-select>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const props = defineProps({
  orchardList: { type: Array, default: () => [] },
  activeOrchardId: { type: String, default: '' }
})

const emit = defineEmits(['orchard-select', 'orchard-update'])

// 对话框
const dialogVisible = ref(false)
const dialogType = ref('add')
const adminList = ref([])

const form = reactive({
  id: '',
  name: '',
  location: '',
  managerId: ''
})

// 显示添加对话框
const showAddDialog = () => {
  dialogType.value = 'add'
  Object.assign(form, { id: '', name: '', location: '', managerId: '' })
  dialogVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (orchard) => {
  dialogType.value = 'edit'
  Object.assign(form, orchard)
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  try {
    const url = dialogType.value === 'add' ? '/api/orchard/add' : '/api/orchard/update'
    const res = await axios.post(url, form)
    if (res.data?.code === 200) {
      ElMessage.success(dialogType.value === 'add' ? '添加成功' : '编辑成功')
      dialogVisible.value = false
      emit('orchard-update', {
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

// 删除果园
const handleDelete = async (id) => {
  try {
    const res = await axios.post('/api/orchard/delete', { id })
    if (res.data?.code === 200) {
      ElMessage.success('删除成功')
      emit('orchard-update', { type: 'delete', id })
    } else {
      ElMessage.error('删除失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('网络错误')
  }
}

// 获取管理员列表（isAdmin=2）
const getAdminList = async () => {
  try {
    const res = await axios.get('/api/user/listByRole', { params: { isAdmin: 2 } })
    if (res.data?.code === 200) {
      adminList.value = res.data.data || []
    }
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  getAdminList()
})
</script>

<style scoped>
.orchard-add {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px; /* 组件容器圆角 */
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 50px;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}

/* 加号按钮圆角美化 */
.add-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%; /* 圆形按钮 */
  background: #a4caf1;
  color: #fff !important;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #a3cdfa;
  transform: scale(1.05);
}

.orchard-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* 列表项圆角 */
.orchard-item {
  padding: 12px;
  border-radius: 6px; /* 列表项圆角 */
  margin-bottom: 8px; /* 列表项间距 */
  cursor: pointer;
  transition: background 0.2s;
  border: 1px solid transparent; /* 避免hover抖动 */
}

.orchard-item:hover {
  background-color: #f5f7fa;
  border-color: #e8e8e8;
}

.orchard-item.active {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.item-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.item-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.item-actions {
  display: flex;
  gap: 8px;
}

/* 表单容器美化 */
.form-container {
  padding: 8px 0;
}

/* 滚动条美化 */
.orchard-list::-webkit-scrollbar {
  width: 6px;
}
.orchard-list::-webkit-scrollbar-thumb {
  background: #dcdcdc;
  border-radius: 3px;
}
.orchard-list::-webkit-scrollbar-track {
  background: #f5f5f5;
}
</style>