<template>
  <div class="account-list-wrapper">
    <!-- 筛选栏 - 保留原有样式和逻辑 -->
    <div class="filter-bar">
      <div class="filter-item">
        <label class="filter-label">账号类型：</label>
        <el-select 
          v-model="filterParams.accountType" 
          placeholder="请选择账号类型" 
          class="filter-select"
        >
          <el-option label="全部类型" value="" />
          <el-option label="工作人员小程序账号" value="staff" />
          <el-option label="管理员账号" value="admin" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">账号状态：</label>
        <el-select 
          v-model="filterParams.accountStatus" 
          placeholder="请选择账号状态" 
          class="filter-select"
        >
          <el-option label="全部状态" value="" />
          <el-option label="未激活" value="inactive" />
          <el-option label="已激活" value="active" />
          <el-option label="已禁用" value="disabled" />
        </el-select>
      </div>
      <el-button type="primary" @click="handleFilter">筛选</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 账号列表表格 - 保留原有样式和逻辑，移除分页 -->
    <div class="table-wrapper">
      <el-table 
        :data="accountList" 
        border 
        stripe 
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="账号id" width="120" align="center" />
        <el-table-column prop="userType" label="用户类型" min-width="150" />
        <el-table-column prop="accountStatus" label="账号状态" min-width="120" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.accountStatus === 'active' ? 'success' : scope.row.accountStatus === 'inactive' ? 'warning' : 'danger'">
              {{ scope.row.accountStatus === 'active' ? '已激活' : scope.row.accountStatus === 'inactive' ? '未激活' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="realName" label="实名信息" min-width="150" />
        <el-table-column label="操作" min-width="120" align="center">
          <template #default="scope">
            <span class="table-actions" @click="handleViewDetail(scope.row)">查看详情</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 保留原有事件派发
const emit = defineEmits(['view-detail', 'edit-account', 'delete-account', 'refresh-list'])

// 筛选参数 - 保留原有
const filterParams = reactive({
  accountType: '',
  accountStatus: ''
})

// 列表数据 - 保留原有
const accountList = ref([])
const loading = ref(false)

// 获取管理员列表（调用指定接口，无分页）
const fetchAccountList = async () => {
  loading.value = true
  try {
    // 调用目标接口：GET /api/employee/getAllEmployees
    const res = await axios.get('/api/employee/getAllEmployees')
    
    if (res.data.code === 200) {
      // 筛选管理员数据（isAdmin === 2）并映射表格字段
      const adminData = res.data.data.filter(item => item.isAdmin === 2)
      accountList.value = adminData.map(item => ({
        id: item.id, // 管理员ID
        userType: '管理员账号', // 固定为管理员类型
        accountStatus: 'active', // 默认已激活（可根据实际接口字段调整）
        name: item.name || '未填写' // 管理员姓名
      }))
      
      // 可选：适配筛选参数（保留原有筛选逻辑）
      if (filterParams.accountType) {
        accountList.value = accountList.value.filter(item => item.userType.includes(filterParams.accountType))
      }
      if (filterParams.accountStatus) {
        accountList.value = accountList.value.filter(item => item.accountStatus === filterParams.accountStatus)
      }
    } else {
      ElMessage.error('获取管理员列表失败：' + res.data.msg)
      accountList.value = []
    }
  } catch (err) {
    ElMessage.error('获取管理员列表失败，请检查网络')
    console.error('接口请求异常：', err)
    accountList.value = []
  } finally {
    loading.value = false
  }
}

// 筛选逻辑 - 保留原有（无分页重置）
const handleFilter = () => {
  fetchAccountList()
}

// 重置筛选 - 保留原有（无分页重置）
const handleReset = () => {
  filterParams.accountType = ''
  filterParams.accountStatus = ''
  fetchAccountList()
}

// 查看详情 - 保留原有
const handleViewDetail = (row) => {
  emit('view-detail', row)
}

// 初始化加载数据 - 保留原有
onMounted(() => {
  fetchAccountList()
})
</script>

<style scoped>
/* 保留所有原有样式，无分页相关样式 */
.account-list-wrapper {
  width: 100%;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  background: none;
  padding: 0;
}

.filter-bar::-webkit-scrollbar {
  display: none;
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
  width: 200px;
}

.table-wrapper {
  border: none;
  border-radius: 0;
  overflow: visible;
  background: none;
}

.table-actions {
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
}

.table-actions:hover {
  color: #66b1ff;
}
</style>