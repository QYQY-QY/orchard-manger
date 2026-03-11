<template>
  <CommonLayout>
    <div class="recruit-page">
      <!-- 筛选与发布组件 -->
      <re-add
        @publish-success="handlePublishSuccess"
        @filter-change="handleFilterChange"
        @reset-filter="handleResetFilter"
      />

      <!-- 招聘列表组件 -->
      <re-list
        :filtered-list="filteredRecruitList"
        @view-detail="handleViewDetail"
        @delete-recruit="handleDeleteRecruit"
        @list-loaded="handleListLoaded"
      />

      <!-- 任务详情弹框组件 -->
      <re-ing
        v-model:visible="showDetailDialog"
        :current-recruit="currentRecruit"
        @update-success="handleUpdateSuccess"
      />
    </div>
  </CommonLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CommonLayout from '@/views/common/CommonLayout.vue'
import ReAdd from '@/components/re/reAdd.vue'
import ReList from '@/components/re/reList.vue'
import ReIng from '@/components/re/reIng.vue'
import { useUserStore } from '@/stores/modules/user'
import axios from 'axios'

const userStore = useUserStore()

// 筛选参数（改为后端实际存在的字段）
const filterParams = ref({
  empId: '',    // 员工ID筛选
  title: '',    // 标题筛选
  // 注释无效的筛选字段
  // taskType: '',
  // recruitStatus: ''
})
// 详情弹框控制
const showDetailDialog = ref(false)
const currentRecruit = ref({})

// 原始招聘列表
const recruitList = ref([])

// 筛选后的列表
const filteredRecruitList = computed(() => {
  let list = [...recruitList.value]

  // 注释无效筛选（后端返回数据无taskType/status字段）
  // // 任务类型筛选
  // if (filterParams.value.taskType) {
  //   list = list.filter(item => item.taskType === filterParams.value.taskType)
  // }

  // // 招聘状态筛选
  // if (filterParams.value.recruitStatus) {
  //   const statusMap = {
  //     'unfinished': 0,
  //     'processing': 1,
  //     'finished': 2
  //   }
  //   const targetStatus = statusMap[filterParams.value.recruitStatus]
  //   list = list.filter(item => item.status === targetStatus)
  // }

  // 可选：添加后端实际存在的筛选字段（比如按empId/title筛选）
  if (filterParams.value.empId) {
    list = list.filter(item => item.empId === filterParams.value.empId)
  }
  if (filterParams.value.title) {
    list = list.filter(item => item.title.includes(filterParams.value.title))
  }

  return list
})
// 定义默认请求参数（与后端要求对齐）
const DEFAULT_PARAMS = {
  page: 1,
  pageSize: 10,
  title: '',        // 标题搜索默认空
  empId: '',        // 员工ID默认空
  senderId: '',     // 发送者ID默认空
  orchardId: 1,     // 果园ID默认值
  isFinish: undefined, // 布尔值默认undefined（后端不接收空布尔）
  isRead: undefined   // 布尔值默认undefined
}

// 获取招聘列表
const fetchRecruitList = async (customParams = {}) => {
  try {
    const requestParams = {
      ...DEFAULT_PARAMS,
      orchardId: userStore.user?.orchardId || DEFAULT_PARAMS.orchardId,
      ...customParams
    }

    const res = await axios.post('/api/announceInfo/list', requestParams)

    if (res.data?.code === 200) {
      // 核心修改：取records数组（后端分页返回的列表数据）
      recruitList.value = res.data.data?.records || []
    } else {
      ElMessage.error(res.data?.msg || '获取招聘列表失败')
    }
  } catch (err) {
    // 错误处理保持不变
    if (axios.isCancel(err)) {
      console.log('请求已取消：', err.message)
    } else if (err.response) {
      const status = err.response.status
      const msg = err.response.data?.msg || `请求失败（${status}）`
      ElMessage.error(`获取招聘列表失败：${msg}`)
      console.error('接口请求错误：', err)
    } else if (err.request) {
      ElMessage.error('网络异常，请检查网络连接后重试')
      console.error('网络请求异常：', err)
    } else {
      ElMessage.error('请求配置错误，获取招聘列表失败')
      console.error('请求配置错误：', err)
    }
  }
}

// 发布成功后刷新列表
const handlePublishSuccess = () => {
  fetchRecruitList()
}

// 筛选条件变化（适配新的筛选参数）
const handleFilterChange = (params) => {
  filterParams.value = {
    empId: params.empId || '',
    title: params.title || ''
    // 注释无效字段
    // taskType: params.taskType || '',
    // recruitStatus: params.recruitStatus || ''
  }
}

// 重置筛选
const handleResetFilter = () => {
  filterParams.value = {
    taskType: '',
    recruitStatus: ''
  }
}

// 查看任务详情
const handleViewDetail = (row) => {
  currentRecruit.value = { ...row }
  showDetailDialog.value = true
}

// 删除招聘任务
const handleDeleteRecruit = async (id) => {
  try {
    const res = await axios.delete(`/api/announceInfo/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchRecruitList()
    } else {
      ElMessage.error(res.data.msg || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除失败')
    console.error(err)
  }
}

// 列表加载完成（可选）
const handleListLoaded = (list) => {
  recruitList.value = list
}

// 更新成功后刷新列表
const handleUpdateSuccess = () => {
  fetchRecruitList()
}

onMounted(() => {
  fetchRecruitList()
})
</script>

<style scoped>
.recruit-page {
  padding: 20px;
  background-color: #ffffff;
  min-height: calc(100vh - 120px);
}
</style>