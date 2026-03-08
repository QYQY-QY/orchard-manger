<template>
  <div>
    <!-- 顶部筛选与操作区 -->
    <div class="top-bar">
      <div class="filter-group">
        <span class="filter-label">筛选</span>
        <el-select
          v-model="filterType"
          placeholder="账号类型"
          size="default"
          style="width: 180px"
        >
          <el-option label="全部类型" value="" />
          <el-option label="临时工" value="temp" />
          <el-option label="巡逻员" value="patrol" />
        </el-select>
        <el-select
          v-model="filterStatus"
          placeholder="账号状态"
          size="default"
          style="width: 150px"
        >
          <el-option label="全部状态" value="" />
          <el-option label="未激活" value="inactive" />
          <el-option label="已激活" value="active" />
          <el-option label="已禁用" value="disabled" />
        </el-select>
        <el-button type="primary" size="default" @click="handleFilter">筛选</el-button>
        <el-button size="default" @click="resetFilter">重置</el-button>
      </div>
      <el-button type="primary" size="default" @click="showApplyDialog = true">申请账号</el-button>
    </div>

    <!-- 申请账号弹窗 -->
    <el-dialog
      v-model="showApplyDialog"
      title="申请账号"
      width="500px"
      center
      @close="resetApplyForm"
    >
      <el-form
        :model="applyForm"
        :rules="applyRules"
        ref="applyFormRef"
        label-width="100px"
      >
        <el-form-item label="账号类型" prop="type">
          <el-radio-group v-model="applyForm.type">
            <el-radio label="temp">临时工</el-radio>
            <el-radio label="patrol">巡逻员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="申请数量" prop="count">
          <el-input
            v-model.number="applyForm.count"
            type="number"
            min="1"
            max="10"
            placeholder="请输入申请数量（1-10）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApplyDialog = false">取消</el-button>
        <el-button type="primary" @click="submitApplyForm">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const emit = defineEmits(['filter-change', 'apply-success'])

// 筛选条件
const filterType = ref('')
const filterStatus = ref('')

// 申请账号弹窗相关
const showApplyDialog = ref(false)
const applyFormRef = ref(null)
const applyForm = reactive({
  type: '',
  count: 1
})
const applyRules = reactive({
  type: [{ required: true, message: '请选择账号类型', trigger: 'change' }],
  count: [
    { required: true, message: '请输入申请数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 10, message: '数量需在1-10之间', trigger: 'blur' }
  ]
})

// 筛选功能
const handleFilter = () => {
  emit('filter-change', { type: filterType.value, status: filterStatus.value })
  ElMessage.success(`筛选条件：类型=${filterType.value || '全部'}, 状态=${filterStatus.value || '全部'}`)
}

// 重置筛选
const resetFilter = () => {
  filterType.value = ''
  filterStatus.value = ''
  emit('filter-change', { type: '', status: '' })
}

// 重置申请表单
const resetApplyForm = () => {
  applyForm.type = ''
  applyForm.count = 1
  applyFormRef.value?.resetFields()
}

// 提交申请
const submitApplyForm = async () => {
  try {
    await applyFormRef.value.validate()
    const res = await axios.post('api/employee/add', {
      type: applyForm.type,
      count: applyForm.count
    })

    if (res.code === 200) {
      ElMessage.success('账号申请成功！')
      showApplyDialog.value = false
      resetApplyForm()

      // 生成新账号数据并通知父组件
      const newAccounts = []
      for (let i = 0; i < applyForm.count; i++) {
        const newId = '888' + Math.floor(Math.random() * 1000)
        newAccounts.push({
          id: newId,
          type: applyForm.type,
          status: 'inactive',
          realName: '',
          avatar: '',
          createTime: new Date().toLocaleString(),
          updateTime: new Date().toLocaleString()
        })
      }
      emit('apply-success', newAccounts)
    } else {
      ElMessage.error(res.msg || '账号申请失败')
    }
  } catch (err) {
    console.error('申请账号失败：', err)
    ElMessage.error('账号申请失败，请稍后重试')
  }
}
</script>

<style scoped>
/* 顶部筛选与按钮区 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

/* 统一按钮和组件样式 */
:deep(.el-button) {
  border-radius: 4px;
}

:deep(.el-select),
:deep(.el-input) {
  --el-input-border-color: #e5e7eb;
  --el-input-hover-border-color: #409eff;
}
</style>