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
          <el-option label="农户" value="3" />
          <el-option label="临时工" value="6" />
        </el-select>
        <el-select
          v-model="filterStatus"
          placeholder="账号状态"
          size="default"
          style="width: 150px"
        >
          <el-option label="全部状态" value="" />
          <el-option label="启用" value="1" />
          <el-option label="禁用" value="0" />
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
        <el-form-item label="账号类型" prop="isAdmin">
          <el-radio-group v-model="applyForm.isAdmin">
            <el-radio label="3">农户</el-radio>
            <el-radio label="6">临时工</el-radio>
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
import dayjs from 'dayjs'
// 从Pinia获取用户信息
import { useUserStore } from '@/stores/modules/user.js'
const userStore = useUserStore()

// 定义事件
const emit = defineEmits(['filter-change', 'apply-success', 'get-orchard-id'])

// ========== 统一变量定义 ==========
// 筛选条件（统一String类型）
const filterType = ref('')
const filterStatus = ref('')

// 申请弹窗
const showApplyDialog = ref(false)
const applyFormRef = ref(null)

// 申请表单（统一默认值）
const applyForm = reactive({
  isAdmin: '',      // 3=农户，6=临时工
  count: 1          // 默认申请1个
})

// 校验规则
const applyRules = reactive({
  isAdmin: [{ required: true, message: '请选择账号类型', trigger: 'change' }],
  count: [
    { required: true, message: '请输入申请数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 10, message: '数量需在1-10之间', trigger: 'blur' }
  ]
})

// ========== 工具方法：格式化后端要求的时间格式 ==========
const formatBackendTime = () => {
  // 生成符合后端@JsonFormat的格式：yyyy-MM-dd'T'HH:mm:ss.SSS
  return dayjs().format('YYYY-MM-DD HH:mm:ss.SSS')
}

// ========== 方法 ==========
// 筛选（统一传递String类型）
const handleFilter = () => {
  emit('filter-change', { 
    type: filterType.value,
    status: filterStatus.value 
  })
  const typeText = filterType.value === '3' ? '农户' : filterType.value === '6' ? '临时工' : '全部'
  const statusText = filterStatus.value === '1' ? '启用' : filterStatus.value === '0' ? '禁用' : '全部'
  ElMessage.success(`筛选条件：类型=${typeText}, 状态=${statusText}`)
}

// 重置筛选
const resetFilter = () => {
  filterType.value = ''
  filterStatus.value = ''
  emit('filter-change', { type: '', status: '' })
}

// 重置申请表单
const resetApplyForm = () => {
  applyForm.isAdmin = ''
  applyForm.count = 1
  applyFormRef.value?.resetFields()
}

// 提交申请（适配后端标准格式）
const submitApplyForm = async () => {
  try {
    await applyFormRef.value.validate()

    // 统一从Pinia获取果园ID和创建人ID
    const orchardId = userStore.user?.orchardId || 1 // 确保是数字类型
    const createUser = userStore.user?.id || 0
    if (!orchardId || !createUser) {
      ElMessage.error('无法获取果园ID或创建人ID，请先登录！')
      return
    }

    // 构造请求
    const requestPromises = []
    const newAccounts = []
    const now = formatBackendTime() // 后端要求的时间格式

    for (let i = 0; i < applyForm.count; i++) {
      // 严格匹配后端/api/employee/add的标准格式
      const accountParams = {
        createTime: now,                // 格式：2026-03-08T12:02:27.957
        createUser: Number(createUser), // 数字类型
        headImg: '',                    // 字符串类型
        id: 0,                          // 数字类型
        idCard: '',                     // 修正字段名：id_card → idCard
        isAdmin: Number(applyForm.isAdmin), // 3=农户/6=临时工
        name: '新账号',                 // 默认用户名
        openId: '',                     // 字符串类型
        orchardId: Number(orchardId),   // 数字类型
        password: 123456,               // 数字类型
        phone: '',                      // 字符串类型
        sex: 0,                         // 默认女（数字类型）
        status: 0,                      // 默认禁用（数字类型）
        updateTime: now,                // 格式：2026-03-08T12:02:27.957
        updateUser: 0,                  // 数字类型
        username: `zzc_${Date.now()}_${i}` // 唯一用户名
      }

      requestPromises.push(axios.post('/api/employee/add', accountParams))

      // 构造返回给父组件的新账号（前端展示用）
      newAccounts.push({
        id: `temp_${Date.now()}_${i}`,
        isAdmin: String(applyForm.isAdmin),
        status: 0, // 默认禁用
        realName: '',
        idCard: '', // 同步字段名
        name: '新账号',
        avatar: '',
        headImg: '',
        createTime: dayjs(now).format('YYYY-MM-DD HH:mm:ss'), // 前端展示格式
        updateTime: dayjs(now).format('YYYY-MM-DD HH:mm:ss'),
        orchardId: String(orchardId),
        createUser: String(createUser),
        sex: 0
      })
    }

    // 批量提交
    const responses = await Promise.all(requestPromises)
    const allSuccess = responses.every(res => res.data.code === 200)
    
    if (allSuccess) {
      ElMessage.success(`成功申请${applyForm.count}个账号！`)
      showApplyDialog.value = false
      resetApplyForm()
      emit('apply-success', newAccounts)
      emit('get-orchard-id', String(orchardId))
    } else {
      ElMessage.error('部分账号申请失败，请检查！')
    }
  } catch (err) {
    console.error('申请账号失败：', err)
    ElMessage.error('账号申请失败，请稍后重试')
  }
}
</script>

<style scoped>
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

:deep(.el-button) {
  border-radius: 4px;
}

:deep(.el-select),
:deep(.el-input) {
  --el-input-border-color: #e5e7eb;
  --el-input-hover-border-color: #409eff;
}
</style>