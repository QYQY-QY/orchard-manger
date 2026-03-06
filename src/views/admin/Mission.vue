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

      <!-- 发布任务弹框 - 匹配接口参数 -->
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
          <el-form-item label="任务负责人ID" prop="empIds">
            <el-input 
              v-model="publishForm.empIds" 
              placeholder="请输入负责人ID（多个用逗号分隔）"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="任务组ID" prop="empgroupId">
            <el-input 
              v-model="publishForm.empgroupId" 
              placeholder="请输入任务组ID"
              type="number"
              min="0"
            />
          </el-form-item>
          <el-form-item label="任务状态" prop="status">
            <el-select v-model="publishForm.status" placeholder="请选择初始状态">
              <el-option label="未完成" value="0" />
              <el-option label="进行中" value="1" />
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
          <!-- 果园ID/发布人等从用户信息自动填充，不可编辑 -->
          <el-form-item label="所属果园ID">
            <el-input 
              v-model="publishForm.orchardId" 
              disabled
              placeholder="自动填充当前用户果园ID"
            />
          </el-form-item>
          <el-form-item label="发布人">
            <el-input 
              v-model="publishForm.username" 
              disabled
              placeholder="自动填充当前用户名"
            />
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
import axios from 'axios' // 新增：导入axios发请求

const userStore = useUserStore()
// 从用户仓库提取核心信息（优先复用）
const creatorId = computed(() => userStore.user?.id || 0) // 创建者ID
const username = computed(() => userStore.user?.name || userStore.user?.username || '') // 发布人名称
const orchardId = computed(() => userStore.user?.orchardId || 0) // 果园ID

// 表单校验规则
const publishRules = ref({
  taskTitle: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
  taskInfo: [{ required: true, message: '请输入任务内容', trigger: 'blur' }],
  taskType: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  taskScope: [{ required: true, message: '请选择任务范围', trigger: 'change' }],
  deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
  empIds: [{ required: true, message: '请输入负责人ID', trigger: 'blur' }],
  status: [{ required: true, message: '请选择任务状态', trigger: 'change' }],
})

// 筛选参数（匹配/api/task/query接口）
const filterParams = ref({
  taskType: '', // 0-日常,1-紧急
  status: '', // 0-未完成,1-进行中,2-已完成
  taskScope: '', // 0-全园,1-分区
  orchardId: orchardId.value, // 自动填充果园ID
  creatorId: creatorId.value, // 自动填充创建者ID
})

// 发布弹框控制 + 表单初始化（优先填充用户信息）
const showPublishDialog = ref(false)
const publishFormRef = ref(null)
const publishForm = ref({
  taskTitle: '',
  taskInfo: '',
  taskType: '',
  taskScope: '',
  deadline: '',
  completionTime: '',
  empIds: '',
  empgroupId: 0,
  imgsURL: '',
  orchardId: orchardId.value, // 自动填充果园ID
  username: username.value, // 自动填充发布人
  creatorId: creatorId.value, // 自动填充创建者ID
  postTime: new Date().toISOString(), // 自动生成发布时间（ISO格式）
  status: '0', // 默认未完成
})

// 详情弹框控制
const showDetailDialog = ref(false)
const currentTask = ref({}) 

// 原始任务列表数据
const taskList = ref([])

// 筛选后的任务列表
const filteredTaskList = computed(() => {
  let list = [...taskList.value]
  
  // 任务类型筛选
  if (filterParams.value.taskType) {
    list = list.filter(item => item.taskType === Number(filterParams.value.taskType))
  }
  
  // 任务状态筛选
  if (filterParams.value.status) {
    list = list.filter(item => item.status === Number(filterParams.value.status))
  }
  
  // 任务范围筛选
  if (filterParams.value.taskScope) {
    list = list.filter(item => item.taskScope === Number(filterParams.value.taskScope))
  }
  
  return list
})

// 格式化ISO时间为易读格式
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

// 调用/api/task/query获取任务列表（替换模拟数据）
const fetchTaskList = async () => {
  try {
    const response = await axios.post('/api/task/query', filterParams.value)
    if (response.data && response.data.code === 200) {
      // 处理返回数据（imgsURL转数组）
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

// 筛选（重新拉取列表）
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

// 删除任务（示例：如需真实删除需补充后端接口）
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
    
    // 如需真实删除，补充删除接口调用
    // await axios.delete(`/api/task/delete/${taskId}`)
    
    taskList.value = taskList.value.filter(item => item.id !== taskId)
    ElMessage.success('任务删除成功!')
  } catch (error) {
    ElMessage.info('已取消删除')
  }
}

// 发布任务：调用/api/task/add接口
const handlePublish = async () => {
  try {
    // 表单校验
    await publishFormRef.value.validate()

    // 处理参数：imgsURL转数组
    const submitData = {
      ...publishForm.value,
      // 字符串转数组（多个URL用逗号分隔）
      imgsURL: publishForm.value.imgsURL ? publishForm.value.imgsURL.split(',') : [],
      // 数字类型转换
      taskType: Number(publishForm.value.taskType),
      taskScope: Number(publishForm.value.taskScope),
      status: Number(publishForm.value.status),
      empgroupId: Number(publishForm.value.empgroupId),
      creatorId: Number(publishForm.value.creatorId),
      orchardId: Number(publishForm.value.orchardId),
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
        empgroupId: 0,
        imgsURL: '',
        orchardId: orchardId.value,
        username: username.value,
        creatorId: creatorId.value,
        postTime: new Date().toISOString(),
        status: '0',
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

// 初始化加载任务列表
onMounted(() => {
  fetchTaskList()
})
</script>

<style scoped>
/* 保留原有样式，仅适配新字段展示 */
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