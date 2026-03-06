<template>
  <CommonLayout>
    <div class="task-page">
      <!-- 筛选区域 - 增加任务类型筛选 -->
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
              <el-option label="日常任务" value="daily" />
              <el-option label="紧急任务" value="urgent" />
            </el-select>
          </div>
          <div class="filter-item">
            <label class="filter-label">任务状态：</label>
            <el-select 
              v-model="filterParams.taskStatus" 
              placeholder="请选择任务状态"
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
        <el-button type="primary" class="publish-btn" @click="showPublishDialog = true">发布任务</el-button>
      </div>

      <!-- 任务列表 - 新增任务类型列 + 删除按钮 -->
      <div class="task-list-wrapper">
        <el-table :data="filteredTaskList" stripe style="width: 100%">
          <el-table-column prop="content" label="任务内容" min-width="200px" />
          <el-table-column prop="area" label="任务区域" width="150px" />
          <el-table-column label="任务类型" width="120px">
            <template #default="{ row }">
              <el-tag :type="row.taskType === 'urgent' ? 'danger' : 'info'">
                {{ row.taskType === 'daily' ? '日常任务' : '紧急任务' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="任务状态" width="120px">
            <template #default="{ row }">
              <el-tag 
                :type="row.status === '已完成' ? 'success' : (row.status === '进行中' ? 'primary' : 'warning')"
              >
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assignee" label="任务负责人" width="120px" />
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

      <!-- 发布任务弹框 - 新增任务类型选择 -->
      <el-dialog v-model="showPublishDialog" title="发布新任务" width="500px">
        <el-form :model="publishForm" label-width="80px">
          <el-form-item label="任务类型" prop="taskType">
            <el-select v-model="publishForm.taskType" placeholder="请选择任务类型">
              <el-option label="日常任务" value="daily" />
              <el-option label="紧急任务" value="urgent" />
            </el-select>
          </el-form-item>
          <el-form-item label="任务内容" prop="content">
            <el-input 
              v-model="publishForm.content" 
              placeholder="请输入任务内容"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="任务区域" prop="area">
            <el-input 
              v-model="publishForm.area" 
              placeholder="请输入任务区域"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="负责人" prop="assignee">
            <el-input 
              v-model="publishForm.assignee" 
              placeholder="请输入负责人姓名"
              maxlength="20"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="任务状态" prop="status">
            <el-select v-model="publishForm.status" placeholder="请选择初始状态">
              <el-option label="未完成" value="未完成" />
              <el-option label="进行中" value="进行中" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showPublishDialog = false">取消</el-button>
          <el-button type="primary" @click="handlePublish">确认发布</el-button>
        </template>
      </el-dialog>

      <!-- 任务详情弹框 -->
      <el-dialog 
        v-model="showDetailDialog" 
        title="任务详情" 
        width="800px"
        center
      >
        <div class="task-detail">
          <!-- 基本信息 -->
          <div class="detail-base-info">
            <el-descriptions :column="2" border style="margin-bottom: 20px">
              <el-descriptions-item label="任务内容">{{ currentTask.content }}</el-descriptions-item>
              <el-descriptions-item label="任务区域">{{ currentTask.area }}</el-descriptions-item>
              <el-descriptions-item label="任务类型">
                <el-tag :type="currentTask.taskType === 'urgent' ? 'danger' : 'info'">
                  {{ currentTask.taskType === 'daily' ? '日常任务' : '紧急任务' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="任务状态">
                <el-tag 
                  :type="currentTask.status === '已完成' ? 'success' : (currentTask.status === '进行中' ? 'primary' : 'warning')"
                >
                  {{ currentTask.status }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="任务负责人">{{ currentTask.assignee }}</el-descriptions-item>
              <el-descriptions-item label="任务发布时间">{{ currentTask.publishTime }}</el-descriptions-item>
              <el-descriptions-item label="任务完成时间">
                {{ currentTask.completeTime || '暂未完成' }}
              </el-descriptions-item>
              <el-descriptions-item label="备注信息">{{ currentTask.remark || '无' }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 上传图片展示 -->
          <div class="detail-images" v-if="currentTask.images && currentTask.images.length > 0">
            <h4 style="margin-bottom: 10px; color: #333">任务相关图片：</h4>
            <div class="image-grid">
              <div 
                class="image-item" 
                v-for="(img, index) in currentTask.images" 
                :key="index"
              >
                <el-image 
                  :src="img" 
                  :preview-src-list="currentTask.images"
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

const userStore = useUserStore()
const userName = computed(() => userStore.user.name || userStore.user.username)
const roleName = computed(() => '普通管理员')

// 筛选参数
const filterParams = ref({
  taskType: '', // 任务类型筛选：''-全部, daily-日常, urgent-紧急
  taskStatus: '' // 任务状态筛选：''-全部, unfinished-未完成, processing-进行中, finished-已完成
})

// 发布弹框控制
const showPublishDialog = ref(false)
const publishForm = ref({
  taskType: '', // 新增任务类型字段
  content: '',
  area: '',
  assignee: '',
  status: '未完成'
})

// 详情弹框控制
const showDetailDialog = ref(false)
const currentTask = ref({}) // 当前选中的任务详情

// 原始任务列表数据
const taskList = ref([])

// 筛选后的任务列表（计算属性）
const filteredTaskList = computed(() => {
  let list = [...taskList.value]
  
  // 任务类型筛选
  if (filterParams.value.taskType) {
    list = list.filter(item => item.taskType === filterParams.value.taskType)
  }
  
  // 任务状态筛选（映射状态值）
  if (filterParams.value.taskStatus) {
    const statusMap = {
      'unfinished': '未完成',
      'processing': '进行中',
      'finished': '已完成'
    }
    const targetStatus = statusMap[filterParams.value.taskStatus]
    list = list.filter(item => item.status === targetStatus)
  }
  
  return list
})

// 模拟从后端获取任务列表
const fetchTaskList = async () => {
  // 这里替换为你的真实接口请求
  // const res = await api.getTaskList(filterParams.value)
  // taskList.value = res.data

  // 模拟数据
  taskList.value = [
    {
      id: 1,
      content: '检查果树生长情况',
      area: '东区果园',
      status: '已完成',
      assignee: '张三',
      publishTime: '2026-03-01 09:00:00',
      completeTime: '2026-03-01 16:30:00',
      taskType: 'daily',
      remark: '重点检查苹果树的病虫害情况',
      images: [
        'https://picsum.photos/800/600?random=1',
        'https://picsum.photos/800/600?random=2'
      ]
    },
    {
      id: 2,
      content: '施肥作业',
      area: '西区果园',
      status: '进行中',
      assignee: '李四',
      publishTime: '2026-03-02 10:15:00',
      completeTime: '',
      taskType: 'daily',
      remark: '使用有机肥，按照每亩50公斤的标准施肥',
      images: [
        'https://picsum.photos/800/600?random=3'
      ]
    },
    {
      id: 3,
      content: '修剪树枝',
      area: '北区果园',
      status: '未完成',
      assignee: '王五',
      publishTime: '2026-03-01 08:30:00',
      completeTime: '',
      taskType: 'urgent',
      remark: '及时修剪病枝、枯枝，防止病害扩散',
      images: []
    },
    {
      id: 4,
      content: '喷洒农药',
      area: '南区果园',
      status: '进行中',
      assignee: '赵六',
      publishTime: '2026-03-01 14:00:00',
      completeTime: '',
      taskType: 'urgent',
      remark: '针对蚜虫虫害进行专项防治',
      images: [
        'https://picsum.photos/800/600?random=4'
      ]
    }
  ]
}

// 筛选
const handleFilter = () => {
  ElMessage.success('筛选完成')
}

// 重置筛选
const resetFilter = () => {
  filterParams.value = {
    taskType: '',
    taskStatus: ''
  }
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
    // 显示确认弹窗
    await ElMessageBox.confirm(
      '此操作将永久删除该任务, 是否继续?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里替换为真实的删除接口请求
    // await api.deleteTask(taskId)
    
    // 前端删除数据
    taskList.value = taskList.value.filter(item => item.id !== taskId)
    ElMessage.success('任务删除成功!')
  } catch (error) {
    ElMessage.info('已取消删除')
  }
}

// 发布任务
const handlePublish = async () => {
  if (!publishForm.value.taskType || !publishForm.value.content || !publishForm.value.area || !publishForm.value.assignee) {
    ElMessage.warning('请填写完整任务信息')
    return
  }

  // 这里替换为你的真实接口请求
  // await api.publishTask(publishForm.value)
  ElMessage.success('任务发布成功')
  showPublishDialog.value = false
  
  // 生成新任务数据（模拟）
  const newTask = {
    id: taskList.value.length + 1,
    content: publishForm.value.content,
    area: publishForm.value.area,
    status: publishForm.value.status,
    assignee: publishForm.value.assignee,
    publishTime: new Date().toLocaleString('zh-CN'),
    completeTime: '',
    taskType: publishForm.value.taskType,
    remark: '',
    images: []
  }
  
  // 添加到列表
  taskList.value.push(newTask)
  
  // 重置表单
  publishForm.value = {
    taskType: '',
    content: '',
    area: '',
    assignee: '',
    status: '未完成'
  }
}

onMounted(() => {
  fetchTaskList()
})
</script>

<style scoped>
/* 移除所有灰色背景，改为纯白色 */
.task-page {
  padding: 20px;
  background-color: #ffffff; /* 原#f5f7fa 改为纯白 */
  min-height: calc(100vh - 120px);
}

/* 筛选区域样式 */
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

/* 任务列表样式 */
.task-list-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

:deep(.el-table) {
  --el-table-header-text-color: #303133;
  --el-table-row-hover-bg-color: #ffffff; /* 移除hover灰色背景 */
  --el-table-row-stripe-bg-color: #ffffff; /* 移除斑马纹灰色背景 */
}

:deep(.el-tag) {
  padding: 2px 8px;
}

/* 详情弹框样式 */
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
  background: #ffffff; /* 原#f9f9f9 改为纯白 */
}

:deep(.image-error) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #ffffff; /* 原#f5f5f5 改为纯白 */
  color: #999;
  border: 1px dashed #ddd;
}

.no-image {
  padding: 20px 0;
  text-align: center;
}
</style>