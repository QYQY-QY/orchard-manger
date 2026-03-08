<template>
  <CommonLayout>
    <div class="account-management">
      <!-- 筛选与申请账号组件 -->
      <account-add
        @apply-success="handleApplySuccess"
        @filter-change="handleFilterChange"
        @get-orchard-id="handleGetOrchardId"
      />

      <!-- 账号列表组件 -->
      <account-list
        :filtered-table-data="filteredTableData"
        :orchardId="currentOrchardId"  
        :filterType="filterType"
        :filterStatus="filterStatus"
        @detail="handleDetail"
        @changeStatus="handleChangeStatus" 
        @list-loaded="handleListLoaded"  
        @to-realname="handleToRealName"
      />

      <!-- 账号详情弹窗组件 -->
      <AccountDetail
        v-model:visible="showDetail"
        :account="currentAccount"
        @edit-success="handleDetailUpdate"
        @realname-success="handleDetailUpdate"
        @avatar-success="handleDetailUpdate"
        @close="showDetail = false"
      />
    </div>
  </CommonLayout>
</template>

<script setup>
import CommonLayout from '@/views/common/CommonLayout.vue'
import accountAdd from '@/components/admin/accountAdd.vue'
import accountList from '@/components/admin/accountList.vue'
import AccountDetail from '@/components/admin/accountDetail.vue'
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import dayjs from 'dayjs'
// 从Pinia获取用户/果园信息（修正：router无用户数据，应为Pinia）
import { useUserStore } from '@/stores/modules/user.js'
const userStore = useUserStore()

// ========== 统一变量定义 ==========
// 筛选条件（统一转String）
const filterType = ref('')
const filterStatus = ref('')

// 详情弹窗（统一变量名：showDetail）
const showDetail = ref(false)
const currentAccount = ref(null)

// 果园ID（统一从Pinia获取）
const currentOrchardId = ref('')

// 账号列表数据
const tableData = ref([])

// ========== 计算属性 ==========
// 筛选后的数据（统一类型转换）
const filteredTableData = computed(() => {
  return tableData.value.filter(item => {
    const itemIsAdmin = Number(item.isAdmin)
    const itemStatus = Number(item.status)
    // 仅保留农户(3)/临时工(6)
    const isAdminValid = [3, 6].includes(itemIsAdmin)
    // 类型匹配（空=全部，统一转Number比较）
    const typeMatch = filterType.value ? itemIsAdmin === Number(filterType.value) : true
    // 状态匹配（空=全部，统一转Number比较）
    const statusMatch = filterStatus.value ? itemStatus === Number(filterStatus.value) : true
    return isAdminValid && typeMatch && statusMatch
  })
})

// ========== 生命周期 ==========
onMounted(() => {
  // 统一从Pinia获取果园ID
  if (userStore?.user?.orchardId) {
    currentOrchardId.value = String(userStore.user.orchardId)
  } else {
    ElMessage.warning('未获取到果园ID，默认使用ID:1')
    currentOrchardId.value = '1'
  }
})

// ========== 事件处理 ==========
// 接收筛选条件变化
const handleFilterChange = ({ type, status }) => {
  filterType.value = String(type)
  filterStatus.value = String(status)
}

// 接收申请账号成功
const handleApplySuccess = (newAccounts) => {
  tableData.value.push(...newAccounts)
  ElMessage.success(`新增${newAccounts.length}个账号`)
}

// 接收果园ID更新
const handleGetOrchardId = (orchardId) => {
  currentOrchardId.value = String(orchardId)
}

// 接收列表加载完成
const handleListLoaded = (list) => {
  tableData.value = list
  ElMessage.success('账号列表加载成功！')
}

// 处理去实名
const handleToRealName = (row) => {
  currentAccount.value = { ...row }
  showDetail.value = true
}

// 处理查看详情
const handleDetail = (row) => {
  currentAccount.value = { ...row }
  showDetail.value = true
}

// 处理详情弹窗更新
const handleDetailUpdate = (updatedAccount) => {
  const targetIndex = tableData.value.findIndex(item => Number(item.id) === Number(updatedAccount.id))
  if (targetIndex > -1) {
    tableData.value.splice(targetIndex, 1, { ...updatedAccount })
    ElMessage.success('账号信息更新成功！')
  }
}

// 账号状态切换（统一规则：0=禁用，1=启用；仅传empId）
const handleChangeStatus = async (row, targetStatus) => {
  const targetStatusNum = Number(targetStatus)
  const actionText = targetStatusNum === 0 ? '禁用' : '启用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${actionText}该账号吗？`, 
      `${actionText}账号`, 
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: targetStatusNum === 0 ? 'danger' : 'warning'
      }
    )
    
    // 仅传递empId（按要求）
    // 核心修复：满足后端「纯数字请求体 + JSON请求头」要求
    const res = await axios.put(
      '/api/employee/status',
      String(row.id), // 转为数字字符串（纯文本），也可直接传 Number(row.id)
      {
        headers: {
          'Content-Type': 'application/json' // 强制指定JSON请求头
        },
        // 关键：禁用Axios默认的JSON序列化（避免自动包裹成对象）
        transformRequest: [(data) => data]
      }
    )
    
      if (res.data.code === 200) {
        const targetIndex = tableData.value.findIndex(item => Number(item.id) === Number(row.id))
        if (targetIndex > -1) {
          const updatedItem = { 
            ...tableData.value[targetIndex],
            status: targetStatusNum,
            // 修复：移除字符串中的 { }，修正 dayjs 格式化语法
            updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss.SSS') 
          }
          tableData.value.splice(targetIndex, 1, updatedItem)
        }
        ElMessage.success(`账号${actionText}成功！`)
  } else {
      ElMessage.error(res.data.msg || `账号${actionText}失败`)
    }
  } catch (err) {
    if (err !== 'cancel' && err.name !== 'CanceledError') {
      ElMessage.error(`账号${actionText}失败：${err.message || '请求异常'}`)
    }
  }
}
</script>

<style scoped>
.account-management {
  padding: 20px;
  height: calc(100vh - 140px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: #ffffff;
}

:deep(.el-button) {
  border-radius: 4px;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-table) {
  --el-table-header-text-color: #303133;
  --el-table-row-hover-bg-color: #f8f9fa;
}
</style>