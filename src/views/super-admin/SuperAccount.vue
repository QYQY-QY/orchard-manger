<template>
  <CommonLayout>
    <div class="super-admin-page">
      <div class="page-header">
        <h3>超级管理员 - 账号管理系统</h3>
        <!-- 修复：增加click.stop阻止事件冒泡，确保触发 -->
        <el-button type="primary" @click.stop="showAddDialog = true">创建管理员账号</el-button>
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
import { useUserStore } from '@/stores/modules/user'
import axios from 'axios'

const userStore = useUserStore()

const showAddDialog = ref(false)
const currentEditAccount = ref({})

const fetchAccountList = async () => {
  try {
    const res = await axios.get('/api/super/account/list')
    if (res.data.code === 200) {
      // 子组件自行请求，此处保留原有逻辑
    } else {
      ElMessage.error('获取账号列表失败：' + res.data.msg)
    }
  } catch (err) {
    ElMessage.error('获取账号列表失败，请检查网络')
    console.error(err)
  }
}

const handleEditAccount = (account) => {
  currentEditAccount.value = { ...account }
  showAddDialog.value = true
}

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

const handleSaveSuccess = () => {
  showAddDialog.value = false
  currentEditAccount.value = {}
  fetchAccountList()
  // 修复：移除重复的success提示（SuperAdd中已提示）
  // ElMessage.success('账号操作成功')
}

onMounted(() => {
  fetchAccountList()
})
</script>

<!-- 样式部分不变 -->
<style scoped>
.super-admin-page {
  padding: 20px;
  background-color: transparent;
  min-height: auto;
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
  background-color: transparent;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
}
</style>