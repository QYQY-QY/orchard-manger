<template>
  <CommonLayout>
    <div class="super-admin-page">
      <div class="page-header">
        <h3>超级管理员 - 账号管理系统</h3>
        <!-- 恢复最基础的点击事件，移除stop修饰符（大概率是stop导致事件被拦截） -->
        <el-button type="primary" @click="() => {
            showAddDialog = true;
            console.log('点击按钮后showAddDialog:', showAddDialog); // 关键打印
            }">创建管理员账号</el-button>
      </div>

      <div class="page-content">
        <SuperList 
          @edit-account="handleEditAccount"
          @delete-account="handleDeleteAccount"
          @refresh-list="fetchAccountList"
        />
      </div>

      <SuperAdd 
        v-model:visible="showAddDialog"
        :edit-account="currentEditAccount"
        @save-success="handleSaveSuccess"
      />
    </div>
  </CommonLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CommonLayout from '@/views/common/CommonLayout.vue'
import SuperList from '@/components/superAdmin/SuperList.vue'
import SuperAdd from '@/components/superAdmin/SuperAdd.vue'
import axios from 'axios'

// 恢复最基础的响应式变量（删除无关的userStore，避免干扰）
const showAddDialog = ref(false)
const currentEditAccount = ref({})

// 简化列表请求（仅保留基础逻辑，不影响按钮）
const fetchAccountList = async () => {
  try {
    const res = await axios.get('/api/employee/getAllEmployees')
    if (res.data.code !== 200) {
      ElMessage.error('获取账号列表失败：' + res.data.msg)
    }
  } catch (err) {
    ElMessage.error('获取账号列表失败，请检查网络')
    console.error(err)
  }
}

// 编辑账号逻辑（和创建按钮无关，保留原样）
const handleEditAccount = (account) => {
  currentEditAccount.value = { ...account }
  showAddDialog.value = true
}

// 删除账号逻辑（和创建按钮无关，保留原样）
const handleDeleteAccount = async (id) => {
  try {
    const res = await axios.delete(`/api/super/account/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除账号成功')
      fetchAccountList()
    } else {
      ElMessage.error('删除失败：' + res.data.msg)
    }
  } catch (err) {
    ElMessage.error('删除账号失败')
    console.error(err)
  }
}

// 保存成功回调（保留原样）
const handleSaveSuccess = () => {
  showAddDialog.value = false
  currentEditAccount.value = {}
  fetchAccountList()
}

// 初始化请求（保留原样）
onMounted(() => {
  fetchAccountList()
})
</script>

<!-- 样式恢复最基础版本，无任何干扰 -->
<style scoped>
.super-admin-page {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 80px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.page-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.page-content {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
}
</style>