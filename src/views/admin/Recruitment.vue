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

// 筛选参数
const filterParams = ref({
  taskType: '',
  recruitStatus: ''
})

// 详情弹框控制
const showDetailDialog = ref(false)
const currentRecruit = ref({})

// 原始招聘列表
const recruitList = ref([])

// 筛选后的列表
const filteredRecruitList = computed(() => {
  let list = [...recruitList.value]

  // 任务类型筛选
  if (filterParams.value.taskType) {
    list = list.filter(item => item.taskType === filterParams.value.taskType)
  }

  // 招聘状态筛选
  if (filterParams.value.recruitStatus) {
    const statusMap = {
      'unfinished': 0,
      'processing': 1,
      'finished': 2
    }
    const targetStatus = statusMap[filterParams.value.recruitStatus]
    list = list.filter(item => item.status === targetStatus)
  }

  return list
})

// 获取招聘列表
const fetchRecruitList = async () => {
  try {
    const res = await axios.get('/api/announceInfo/list', {
      params: {
        orchardId: userStore.user.orchardId || 1,
        page: 1,
        pageSize: 100
      }
    })
    if (res.data.code === 200) {
      recruitList.value = res.data.data || []
    } else {
      ElMessage.error(res.data.msg || '获取招聘列表失败')
    }
  } catch (err) {
    ElMessage.error('网络异常，获取招聘列表失败')
    console.error(err)
  }
}

// 发布成功后刷新列表
const handlePublishSuccess = () => {
  fetchRecruitList()
}

// 筛选条件变化
const handleFilterChange = (params) => {
  filterParams.value = params
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