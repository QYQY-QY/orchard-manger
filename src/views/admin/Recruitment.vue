<template>
  <CommonLayout>
    <div class="recruit-page">
      <!-- 筛选区域 -->
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
              <el-option label="日常招聘" value="daily" />
              <el-option label="紧急招聘" value="urgent" />
            </el-select>
          </div>
          <div class="filter-item">
            <label class="filter-label">招聘状态：</label>
            <el-select 
              v-model="filterParams.recruitStatus" 
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
      </div>

      <!-- 招聘任务列表 -->
      <div class="recruit-list-wrapper">
        <el-table :data="filteredRecruitList" stripe style="width: 100%">
          <el-table-column prop="content" label="招聘内容" min-width="200px" />
          <el-table-column prop="area" label="招聘地点" width="150px" />
          <el-table-column prop="publishTime" label="招聘时间" width="180px" />
          <el-table-column prop="post" label="招聘岗位" width="120px" />
          <el-table-column prop="status" label="招聘状态" width="120px">
            <template #default="{ row }">
              <el-tag 
                :type="row.status === '已完成' ? 'success' : (row.status === '进行中' ? 'primary' : 'warning')"
              >
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180px">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleViewProgress(row)">
                任务进度
              </el-button>
              <el-button link type="danger" @click="handleDeleteRecruit(row.id)">
                删除招聘
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 发布招聘任务弹框 -->
      <el-dialog v-model="showPublishDialog" title="发布新招聘任务" width="500px">
        <el-form :model="publishForm" label-width="100px">
          <el-form-item label="任务类型" prop="taskType">
            <el-select v-model="publishForm.taskType" placeholder="请选择任务类型">
              <el-option label="日常招聘" value="daily" />
              <el-option label="紧急招聘" value="urgent" />
            </el-select>
          </el-form-item>
          <el-form-item label="招聘内容" prop="content">
            <el-input 
              v-model="publishForm.content" 
              placeholder="请输入招聘内容"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="招聘地点" prop="area">
            <el-input 
              v-model="publishForm.area" 
              placeholder="请输入招聘地点"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="招聘岗位" prop="post">
            <el-input 
              v-model="publishForm.post" 
              placeholder="请输入招聘岗位"
              maxlength="30"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="招聘状态" prop="status">
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

      <!-- 任务进度弹框 -->
      <el-dialog 
        v-model="showProgressDialog" 
        title="招聘任务进度" 
        width="800px"
        center
      >
        <div class="recruit-progress">
          <el-descriptions :column="2" border style="margin-bottom: 20px">
            <el-descriptions-item label="招聘内容">{{ currentRecruit.content }}</el-descriptions-item>
            <el-descriptions-item label="招聘地点">{{ currentRecruit.area }}</el-descriptions-item>
            <el-descriptions-item label="招聘岗位">{{ currentRecruit.post }}</el-descriptions-item>
            <el-descriptions-item label="招聘状态">
              <el-tag 
                :type="currentRecruit.status === '已完成' ? 'success' : (currentRecruit.status === '进行中' ? 'primary' : 'warning')"
              >
                {{ currentRecruit.status }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="发布时间">{{ currentRecruit.publishTime }}</el-descriptions-item>
            <el-descriptions-item label="完成时间">
              {{ currentRecruit.completeTime || '暂未完成' }}
            </el-descriptions-item>
            <el-descriptions-item label="备注信息">{{ currentRecruit.remark || '无' }}</el-descriptions-item>
          </el-descriptions>

          <!-- 进度条展示 -->
          <div class="progress-section">
            <h4 style="margin-bottom: 15px; color: #333">招聘进度</h4>
            <el-progress 
              :percentage="currentRecruit.progress || 0" 
              :color="currentRecruit.progress === 100 ? '#67c23a' : '#409eff'"
              :stroke-width="16"
            />
            <p style="margin-top: 10px; color: #666; text-align: center;">
              当前进度：{{ currentRecruit.progress || 0 }}%
            </p>
          </div>
        </div>

        <template #footer>
          <el-button @click="showProgressDialog = false">关闭</el-button>
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
  taskType: '',
  recruitStatus: ''
})

// 发布弹框控制
const showPublishDialog = ref(false)
const publishForm = ref({
  taskType: '',
  content: '',
  area: '',
  post: '',
  status: '未完成'
})

// 进度弹框控制
const showProgressDialog = ref(false)
const currentRecruit = ref({})

// 原始招聘列表数据
const recruitList = ref([])

// 筛选后的招聘列表（计算属性）
const filteredRecruitList = computed(() => {
  let list = [...recruitList.value]
  
  // 任务类型筛选
  if (filterParams.value.taskType) {
    list = list.filter(item => item.taskType === filterParams.value.taskType)
  }
  
  // 招聘状态筛选
  if (filterParams.value.recruitStatus) {
    const statusMap = {
      'unfinished': '未完成',
      'processing': '进行中',
      'finished': '已完成'
    }
    const targetStatus = statusMap[filterParams.value.recruitStatus]
    list = list.filter(item => item.status === targetStatus)
  }
  
  return list
})

// 模拟从后端获取招聘列表
const fetchRecruitList = async () => {
  // 这里替换为你的真实接口请求
  // const res = await api.getRecruitList(filterParams.value)
  // recruitList.value = res.data

  // 模拟数据
  recruitList.value = [
    {
      id: 1,
      content: '招聘果园技术专员',
      area: '东区果园',
      post: '技术专员',
      status: '已完成',
      publishTime: '2026-03-01 09:00:00',
      completeTime: '2026-03-05 16:30:00',
      taskType: 'daily',
      progress: 100,
      remark: '已完成招聘，共录用2人'
    },
    {
      id: 2,
      content: '紧急招聘果园采摘工',
      area: '西区果园',
      post: '采摘工',
      status: '进行中',
      publishTime: '2026-03-02 10:15:00',
      completeTime: '',
      taskType: 'urgent',
      progress: 65,
      remark: '目前已收到15份简历，正在面试中'
    },
    {
      id: 3,
      content: '招聘果园管理员',
      area: '北区果园',
      post: '管理员',
      status: '未完成',
      publishTime: '2026-03-03 08:30:00',
      completeTime: '',
      taskType: 'daily',
      progress: 0,
      remark: '尚未开始招聘'
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
    recruitStatus: ''
  }
  ElMessage.info('筛选条件已重置')
}

// 查看任务进度
const handleViewProgress = (row) => {
  currentRecruit.value = { ...row }
  showProgressDialog.value = true
}

// 删除招聘任务
const handleDeleteRecruit = async (recruitId) => {
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
    
    // 这里替换为真实的删除接口请求
    // await api.deleteRecruit(recruitId)
    
    recruitList.value = recruitList.value.filter(item => item.id !== recruitId)
    ElMessage.success('招聘任务删除成功!')
  } catch (error) {
    ElMessage.info('已取消删除')
  }
}

// 发布招聘任务
const handlePublish = async () => {
  if (!publishForm.value.taskType || !publishForm.value.content || !publishForm.value.area || !publishForm.value.post) {
    ElMessage.warning('请填写完整招聘信息')
    return
  }

  // 这里替换为你的真实接口请求
  // await api.publishRecruit(publishForm.value)
  ElMessage.success('招聘任务发布成功')
  showPublishDialog.value = false
  
  // 生成新招聘任务数据（模拟）
  const newRecruit = {
    id: recruitList.value.length + 1,
    content: publishForm.value.content,
    area: publishForm.value.area,
    post: publishForm.value.post,
    status: publishForm.value.status,
    publishTime: new Date().toLocaleString('zh-CN'),
    completeTime: '',
    taskType: publishForm.value.taskType,
    progress: publishForm.value.status === '已完成' ? 100 : 0,
    remark: ''
  }
  
  recruitList.value.push(newRecruit)
  
  // 重置表单
  publishForm.value = {
    taskType: '',
    content: '',
    area: '',
    post: '',
    status: '未完成'
  }
}

onMounted(() => {
  fetchRecruitList()
})
</script>

<style scoped>
/* 页面容器 */
.recruit-page {
  padding: 20px;
  background-color: #ffffff;
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

/* 招聘列表样式 */
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

/* 进度弹框样式 */
.recruit-progress {
  padding: 10px 0;
}

.progress-section {
  margin-top: 20px;
  padding: 20px;
  background: #fafafa;
  border-radius: 6px;
}
</style>