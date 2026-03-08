<template>
  <div class="filter-bar">
    <div class="filter-group">
      <div class="filter-item">
        <label class="filter-label">任务类型：</label>
        <el-select
          v-model="localFilterParams.taskType"
          placeholder="请选择任务类型"
          class="filter-select"
        >
          <el-option label="全部类型" value="" />
          <el-option label="日常招聘" value="daily" />
          <el-option label="紧急招聘" value="urgent" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">招聘状态：</label>
        <el-select
          v-model="localFilterParams.recruitStatus"
          placeholder="请选择招聘状态"
          class="filter-select"
        >
          <el-option label="全部状态" value="" />
          <el-option label="未完成" value="unfinished" />
          <el-option label="进行中" value="processing" />
          <el-option label="已完成" value="finished" />
        </el-select>
      </div>
      <el-button type="primary" @click="handleFilter" class="filter-btn">筛选</el-button>
      <el-button @click="resetFilter" class="reset-btn">重置</el-button>
    </div>
    <el-button type="primary" class="publish-btn" @click="showPublishDialog = true">发布招聘任务</el-button>

    <!-- 发布招聘任务弹框 -->
    <el-dialog v-model="showPublishDialog" title="发布新招聘任务" width="500px">
      <el-form :model="publishForm" :rules="publishRules" ref="publishFormRef" label-width="120px">
        <el-form-item label="招聘标题" prop="title">
          <el-input v-model="publishForm.title" placeholder="请输入招聘标题" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="招聘内容" prop="content">
          <el-input
            v-model="publishForm.content"
            placeholder="请输入招聘内容（如：招多少人，哪里招人，招什么岗位，工资多少一天等）"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="招聘人数" prop="needNumber">
          <el-input-number v-model="publishForm.needNumber" :min="1" placeholder="请输入招聘人数" />
        </el-form-item>
        <el-form-item label="日薪（元）" prop="salary">
          <el-input-number v-model="publishForm.salary" :min="0" placeholder="请输入日薪" />
        </el-form-item>
        <el-form-item label="任务类型" prop="taskType">
          <el-select v-model="publishForm.taskType" placeholder="请选择任务类型">
            <el-option label="日常招聘" value="daily" />
            <el-option label="紧急招聘" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="初始状态" prop="status">
          <el-select v-model="publishForm.status" placeholder="请选择初始状态">
            <el-option label="未完成" :value="0" />
            <el-option label="进行中" :value="1" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPublishDialog = false">取消</el-button>
        <el-button type="primary" @click="handlePublish">确认发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/modules/user'
import axios from 'axios'

const emit = defineEmits(['publish-success', 'filter-change', 'reset-filter'])
const userStore = useUserStore()

// 本地筛选参数
const localFilterParams = ref({
  taskType: '',
  recruitStatus: ''
})

// 发布弹框
const showPublishDialog = ref(false)
const publishFormRef = ref(null)

// 发布表单（适配后端 /api/announceInfo/publish 接口）
const publishForm = reactive({
  title: '',
  content: '',
  needNumber: 0,
  salary: 0,
  taskType: '',
  status: 0,
  orchardId: userStore.user.orchardId || 1,
  orchardName: userStore.user.orchardName || '',
  createUser: userStore.user.id || 0,
  senderId: userStore.user.id || 0,
  senderName: userStore.user.name || userStore.user.username || ''
})

// 校验规则
const publishRules = reactive({
  title: [{ required: true, message: '请输入招聘标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入招聘内容', trigger: 'blur' }],
  needNumber: [{ required: true, message: '请输入招聘人数', trigger: 'blur' }],
  salary: [{ required: true, message: '请输入日薪', trigger: 'blur' }],
  taskType: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择初始状态', trigger: 'change' }]
})

// 筛选
const handleFilter = () => {
  emit('filter-change', localFilterParams.value)
  ElMessage.success('筛选完成')
}

// 重置筛选
const resetFilter = () => {
  localFilterParams.value = {
    taskType: '',
    recruitStatus: ''
  }
  emit('reset-filter')
  ElMessage.info('筛选条件已重置')
}

// 发布招聘任务
const handlePublish = async () => {
  try {
    await publishFormRef.value.validate()

    const res = await axios.post('/api/announceInfo/publish', {
      ...publishForm,
      id: 0,
      isFinish: publishForm.status === 2,
      isRead: false,
      empId: 0,
      empName: '',
      groupId: 0,
      groupName: '',
      updateUser: userStore.user.id || 0
    })

    if (res.data.code === 200) {
      ElMessage.success('招聘任务发布成功')
      showPublishDialog.value = false
      emit('publish-success')

      // 重置表单
      publishForm.title = ''
      publishForm.content = ''
      publishForm.needNumber = 0
      publishForm.salary = 0
      publishForm.taskType = ''
      publishForm.status = 0
      publishFormRef.value?.resetFields()
    } else {
      ElMessage.error(res.data.msg || '发布失败')
    }
  } catch (err) {
    if (err.name !== 'ValidationError') {
      ElMessage.error('发布失败')
      console.error(err)
    }
  }
}
</script>

<style scoped>
.filter-bar {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 20px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
}

.filter-select {
  width: 180px;
}

.filter-btn, .reset-btn, .publish-btn {
  white-space: nowrap;
}

.reset-btn {
  color: #606266;
}
</style>