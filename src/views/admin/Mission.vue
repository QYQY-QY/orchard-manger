<template>
  <CommonLayout>
    <div class="task-page">
      <!-- 筛选区域 - 适配接口的筛选参数 -->
      <div class="filter-bar">
        <div class="filter-group">
          <div class="filter-item">
            <label class="filter-label">任务类型：</label>
            <el-select 
              v-model="filterParams.taskType" 
              placeholder="请选择任务类型"
              class="filter-select"
            >
              <el-option label="全部类型" value="" />
              <el-option label="日常任务" value="0" />
              <el-option label="紧急任务" value="1" />
            </el-select>
          </div>
          <div class="filter-item">
            <label class="filter-label">任务状态：</label>
            <el-select 
              v-model="filterParams.status" 
              placeholder="请选择任务状态"
              class="filter-select"
            >
              <el-option label="全部状态" value="" />
              <el-option label="未完成" value="0" />
              <el-option label="进行中" value="1" />
              <el-option label="已完成" value="2" />
            </el-select>
          </div>
          <div class="filter-item">
            <label class="filter-label">任务范围：</label>
            <el-select 
              v-model="filterParams.taskScope" 
              placeholder="请选择任务范围"
              class="filter-select"
            >
              <el-option label="全部范围" value="" />
              <el-option label="全园" value="0" />
              <el-option label="分区" value="1" />
            </el-select>
          </div>
          <el-button type="primary" @click="handleFilter" class="filter-btn">筛选</el-button>
          <el-button @click="resetFilter" class="reset-btn">重置</el-button>
        </div>
        <el-button type="primary" class="publish-btn" @click="showPublishDialog = true">发布任务</el-button>
      </div>

      <!-- 任务列表 - 匹配接口返回字段 -->
      <div class="task-list-wrapper">
        <el-table :data="filteredTaskList" stripe style="width: 100%">
          <el-table-column prop="taskTitle" label="任务标题" min-width="150px" />
          <el-table-column prop="taskInfo" label="任务内容" min-width="200px" />
          <el-table-column prop="orchardName" label="所属果园" width="150px" />
          <el-table-column label="任务类型" width="120px">
            <template #default="{ row }">
              <el-tag :type="row.taskType === 1 ? 'danger' : 'info'">
                {{ row.taskType === 0 ? '日常任务' : '紧急任务' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="任务状态" width="120px">
            <template #default="{ row }">
              <el-tag 
                :type="row.status === 2 ? 'success' : (row.status === 1 ? 'primary' : 'warning')"
              >
                {{ row.status === 0 ? '未完成' : (row.status === 1 ? '进行中' : '已完成') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="deadline" label="截止时间" width="180px">
            <template #default="{ row }">
              {{ formatIsoTime(row.deadline) }}
            </template>
          </el-table-column>
          <el-table-column prop="username" label="发布人" width="120px" />
          <el-table-column label="操作" width="180px">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleViewDetail(row)">
                查看详情
              </el-button>
              <el-button link type="danger" @click="handleDeleteTask(row.id)">
                删除任务
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 发布任务弹框 - 简化表单：员工选择、自动生成字段 -->
      <el-dialog v-model="showPublishDialog" title="发布新任务" width="700px">
        <el-form :model="publishForm" label-width="100px" ref="publishFormRef" :rules="publishRules">
          <el-form-item label="任务标题" prop="taskTitle">
            <el-input 
              v-model="publishForm.taskTitle" 
              placeholder="请输入任务标题"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="任务内容" prop="taskInfo">
            <el-input 
              v-model="publishForm.taskInfo" 
              type="textarea"
              placeholder="请输入任务内容"
              rows="3"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="任务类型" prop="taskType">
            <el-select v-model="publishForm.taskType" placeholder="请选择任务类型">
              <el-option label="日常任务" value="0" />
              <el-option label="紧急任务" value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="任务范围" prop="taskScope">
            <el-select v-model="publishForm.taskScope" placeholder="请选择任务范围">
              <el-option label="全园" value="0" />
              <el-option label="分区" value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="截止时间" prop="deadline">
            <el-date-picker
              v-model="publishForm.deadline"
              type="datetime"
              placeholder="请选择截止时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DDTHH:mm:ss.000Z"
            />
          </el-form-item>
          <el-form-item label="完成时间" prop="completionTime">
            <el-date-picker
              v-model="publishForm.completionTime"
              type="datetime"
              placeholder="请选择完成时间（可选）"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DDTHH:mm:ss.000Z"
            />
          </el-form-item>
          <!-- 替换：任务负责人改为下拉选择（果园员工列表） -->
          <el-form-item label="任务负责人" prop="empIds">
            <el-select 
              v-model="publishForm.empIds" 
              placeholder="请选择任务负责人"
              filterable
              clearable
            >
              <el-option 
                v-for="emp in employeeList" 
                :key="emp.id" 
                :label="emp.name" 
                :value="emp.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="任务图片URL" prop="imgsURL">
            <el-input 
              v-model="publishForm.imgsURL" 
              type="textarea"
              placeholder="请输入图片URL（多个用逗号分隔）"
              rows="2"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          <!-- 隐藏字段：仅存储不展示 -->
          <el-form-item label="所属果园ID" v-show="false">
            <el-input v-model="publishForm.orchardId" />
          </el-form-item>
          <el-form-item label="任务组ID" v-show="false">
            <el-input v-model="publishForm.empgroupId" />
          </el-form-item>
          <el-form-item label="任务状态" v-show="false">
            <el-input v-model="publishForm.status" />
          </el-form-item>
          <el-form-item label="发布人" v-show="false">
            <el-input v-model="publishForm.username" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showPublishDialog = false">取消</el-button>
          <el-button type="primary" @click="handlePublish">确认发布</el-button>
        </template>
      </el-dialog>

      <!-- 任务详情弹框 - 匹配接口返回字段 -->
      <el-dialog 
        v-model="showDetailDialog" 
        title="任务详情" 
        width="800px"
        center
      >
        <div class="task-detail">
          <div class="detail-base-info">
            <el-descriptions :column="2" border style="margin-bottom: 20px">
              <el-descriptions-item label="任务ID">{{ currentTask.id || '-' }}</el-descriptions-item>
              <el-descriptions-item label="任务标题">{{ currentTask.taskTitle || '-' }}</el-descriptions-item>
              <el-descriptions-item label="任务内容">{{ currentTask.taskInfo || '-' }}</el-descriptions-item>
              <el-descriptions-item label="所属果园">{{ currentTask.orchardName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="任务类型">
                <el-tag :type="currentTask.taskType === 1 ? 'danger' : 'info'">
                  {{ currentTask.taskType === 0 ? '日常任务' : '紧急任务' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="任务状态">
                <el-tag 
                  :type="currentTask.status === 2 ? 'success' : (currentTask.status === 1 ? 'primary' : 'warning')"
                >
                  {{ currentTask.status === 0 ? '未完成' : (currentTask.status === 1 ? '进行中' : '已完成') }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="发布人">{{ currentTask.username || '-' }}</el-descriptions-item>
              <el-descriptions-item label="发布时间">{{ formatIsoTime(currentTask.postTime) }}</el-descriptions-item>
              <el-descriptions-item label="截止时间">{{ formatIsoTime(currentTask.deadline) }}</el-descriptions-item>
              <el-descriptions-item label="完成时间">{{ formatIsoTime(currentTask.completionTime) || '暂未完成' }}</el-descriptions-item>
              <el-descriptions-item label="任务范围">{{ currentTask.taskScope === 0 ? '全园' : '分区' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatIsoTime(currentTask.createTime) }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 上传图片展示 -->
          <div class="detail-images" v-if="currentTask.imgsURL && currentTask.imgsURL.length > 0">
            <h4 style="margin-bottom: 10px; color: #333">任务相关图片：</h4>
            <div class="image-grid">
              <div 
                class="image-item" 
                v-for="(img, index) in currentTask.imgsURL" 
                :key="index"
              >
                <el-image 
                  :src="img" 
                  :preview-src-list="currentTask.imgsURL"
                  fit="cover"
                  style="width: 200px; height: 150px; border-radius: 4px"
                >
                  <template #error>
                    <div class="image-error">图片加载失败</div>
                  </template>
                </el-image>
              </div>
            </div>
          </div>

          <!-- 无图片提示 -->
          <div v-else class="no-image">
            <el-empty description="暂无相关图片"></el-empty>
          </div>
        </div>

        <template #footer>
          <el-button @click="showDetailDialog = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </CommonLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CommonLayout from '@/views/common/CommonLayout.vue'
import { useUserStore } from '@/stores/modules/user'
import axios from 'axios'

const userStore = useUserStore()
// 从用户仓库提取核心信息
const creatorId = computed(() => userStore.user?.id || 0) 
const username = computed(() => userStore.user?.name || userStore.user?.username || '') 
const orchardId = computed(() => userStore.user?.orchardId || 0) 

// 果园员工列表（下拉选择用）
const employeeList = ref([])

// 表单校验规则（简化：移除状态/任务组ID校验）
const publishRules = ref({
  taskTitle: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
  taskInfo: [{ required: true, message: '请输入任务内容', trigger: 'blur' }],
  taskType: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  taskScope: [{ required: true, message: '请选择任务范围', trigger: 'change' }],
  deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
  empIds: [{ required: true, message: '请选择任务负责人', trigger: 'change' }],
})

// 筛选参数
const filterParams = ref({
  taskType: '',
  status: '',
  taskScope: '',
  orchardId: orchardId.value,
  creatorId: creatorId.value,
})

// 发布弹框控制 + 表单初始化（简化字段）
const showPublishDialog = ref(false)
const publishFormRef = ref(null)
const publishForm = ref({
  taskTitle: '',
  taskInfo: '',
  taskType: '',
  taskScope: '',
  deadline: '',
  completionTime: '',
  empIds: '', // 存储员工ID（下拉选择值）
  imgsURL: '',
  // 自动填充/生成的字段（不展示）
  orchardId: orchardId.value,
  username: username.value,
  creatorId: creatorId.value,
  postTime: new Date().toISOString(),
  status: 0, // 固定未完成
  empgroupId: 0, // 初始值，发布时自动生成
})

// 详情弹框控制
const showDetailDialog = ref(false)
const currentTask = ref({}) 

// 原始任务列表数据
const taskList = ref([])

// 筛选后的任务列表
const filteredTaskList = computed(() => {
  let list = [...taskList.value]
  
  if (filterParams.value.taskType) {
    list = list.filter(item => item.taskType === Number(filterParams.value.taskType))
  }
  
  if (filterParams.value.status) {
    list = list.filter(item => item.status === Number(filterParams.value.status))
  }
  
  if (filterParams.value.taskScope) {
    list = list.filter(item => item.taskScope === Number(filterParams.value.taskScope))
  }
  
  return list
})

// 格式化ISO时间
const formatIsoTime = (isoTime) => {
  if (!isoTime) return '-'
  const date = new Date(isoTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取果园员工列表（最终适配版）
const fetchEmployeeList = async () => {
  try {
    // 1. 从userStore获取果园ID并转为数字（兼容字符串/数字类型）
    const currentOrchardId = Number(userStore.user.orchardId)
    console.log('当前果园ID：', currentOrchardId, '类型：', typeof currentOrchardId)
    
    // 2. 校验果园ID有效性
    if (!currentOrchardId || currentOrchardId <= 0) {
      ElMessage.warning('当前用户未绑定有效果园ID（需大于0），无法获取员工列表')
      employeeList.value = []
      return
    }

    // 3. 改用GET请求，参数拼在URL上（后端要求的方式）
    const response = await axios.get('/api/employee/getEmpNameByOrchardIds', {
      params: { 
        orchardId: currentOrchardId // 单个数字，参数名orchardId（后端要求）
      },
      headers: { 'Content-Type': 'application/json' }
    })

    // 4. 处理后端返回数据（兼容单个对象/数组两种情况）
    let empData = response.data || []
    // 如果返回单个对象，转为数组
    if (!Array.isArray(empData)) {
      empData = [empData]
    }

    // 5. 提取下拉选择需要的id和name（适配后端返回字段）
    employeeList.value = empData.map(item => ({
      id: item.id, // 员工ID（传给后端用）
      name: item.name || item.username // 优先name，兜底username
    })).filter(item => item.id && item.name) // 过滤无效数据

    // 6. 友好提示
    if (employeeList.value.length === 0) {
      ElMessage.info('当前果园暂无有效员工信息')
    } else {
      ElMessage.success(`成功加载 ${employeeList.value.length} 名员工`)
    }

  } catch (error) {
    console.error('获取员工列表失败详情：', {
      url: error.config?.url,
      params: error.config?.params,
      status: error.response?.status,
      responseData: error.response?.data
    })

    // 精准错误提示
    if (error.response?.status === 405) {
      ElMessage.error('获取员工列表失败：接口仅支持GET请求（当前用了POST）')
    } else if (error.response?.status === 404) {
      ElMessage.error('获取员工列表失败：接口地址不存在，请检查路径')
    } else if (error.response?.status === 500) {
      ElMessage.error('获取员工列表失败：后端服务器错误，请联系管理员')
    } else {
      ElMessage.error('获取员工列表失败，请稍后重试')
    }
    employeeList.value = []
  }
}

// 获取任务列表
const fetchTaskList = async () => {
  try {
    const response = await axios.post('/api/task/query', filterParams.value)
    if (response.data && response.data.code === 200) {
      taskList.value = (response.data.data || []).map(item => ({
        ...item,
        imgsURL: item.imgsURL ? (Array.isArray(item.imgsURL) ? item.imgsURL : item.imgsURL.split(',')) : []
      }))
      ElMessage.success('任务列表加载成功')
    } else {
      ElMessage.error(`获取任务列表失败：${response.data?.msg || '未知错误'}`)
    }
  } catch (error) {
    console.error('获取任务列表失败：', error)
    ElMessage.error(`获取任务列表失败（${error.response?.status || '网络错误'}）`)
  }
}

// 筛选
const handleFilter = () => {
  fetchTaskList()
  ElMessage.success('筛选完成')
}

// 重置筛选
const resetFilter = () => {
  filterParams.value = {
    taskType: '',
    status: '',
    taskScope: '',
    orchardId: orchardId.value,
    creatorId: creatorId.value,
  }
  fetchTaskList()
  ElMessage.info('筛选条件已重置')
}

// 查看详情
const handleViewDetail = (row) => {
  currentTask.value = { ...row }
  showDetailDialog.value = true
}

// 删除任务
const handleDeleteTask = async (taskId) => {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除该任务, 是否继续?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 真实删除接口（按需补充）
    // await axios.delete(`/api/task/delete/${taskId}`)
    
    taskList.value = taskList.value.filter(item => item.id !== taskId)
    ElMessage.success('任务删除成功!')
  } catch (error) {
    ElMessage.info('已取消删除')
  }
}

// 生成随机任务组ID（示例：可替换为后端生成逻辑）
const generateEmpGroupId = () => {
  // 简单生成规则：时间戳后6位 + 随机数
  return Number(`${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`)
}

// 发布任务（自动生成字段、简化参数）
const handlePublish = async () => {
  try {
    // 表单校验
    await publishFormRef.value.validate()

    // 处理参数：自动生成任务组ID、固定状态
    const submitData = {
      ...publishForm.value,
      imgsURL: publishForm.value.imgsURL ? publishForm.value.imgsURL.split(',') : [],
      taskType: Number(publishForm.value.taskType),
      taskScope: Number(publishForm.value.taskScope),
      status: 0, // 固定未完成
      empgroupId: generateEmpGroupId(), // 自动生成任务组ID
      creatorId: Number(publishForm.value.creatorId),
      orchardId: Number(publishForm.value.orchardId),
      empIds: publishForm.value.empIds, // 员工ID（下拉选择的值）
    }

    // 调用发布任务接口
    const response = await axios.post('/api/task/add', submitData)
    if (response.data && response.data.code === 200) {
      ElMessage.success('任务发布成功！')
      showPublishDialog.value = false
      
      // 重置表单
      publishForm.value = {
        taskTitle: '',
        taskInfo: '',
        taskType: '',
        taskScope: '',
        deadline: '',
        completionTime: '',
        empIds: '',
        imgsURL: '',
        orchardId: orchardId.value,
        username: username.value,
        creatorId: creatorId.value,
        postTime: new Date().toISOString(),
        status: 0,
        empgroupId: 0,
      }
      publishFormRef.value.resetFields()
      
      // 重新拉取任务列表
      fetchTaskList()
    } else {
      ElMessage.error(`发布失败：${response.data?.msg || '未知错误'}`)
    }
  } catch (error) {
    console.error('发布任务失败：', error)
    if (error.name === 'ValidationError') {
      ElMessage.warning('请填写完整并正确的任务信息')
    } else {
      ElMessage.error(`发布失败（${error.response?.status || '网络错误'}）`)
    }
  }
}

// 初始化加载
onMounted(() => {
  fetchEmployeeList() // 先加载员工列表
  fetchTaskList()
})
</script>

<style scoped>
.task-page {
  padding: 20px;
  background-color: #ffffff;
  min-height: calc(100vh - 120px);
}

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

.task-list-wrapper {
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

.task-detail {
  padding: 10px 0;
}

.detail-base-info :deep(.el-descriptions) {
  --el-descriptions-label-color: #606266;
  --el-descriptions-content-color: #303133;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.image-item {
  border: 1px solid #eee;
  padding: 5px;
  border-radius: 6px;
  background: #ffffff;
}

:deep(.image-error) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #ffffff;
  color: #999;
  border: 1px dashed #ddd;
}

.no-image {
  padding: 20px 0;
  text-align: center;
}
</style>