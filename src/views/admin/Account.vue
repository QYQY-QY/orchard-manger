<template>
  <CommonLayout>
    <div class="account-management">
      <!-- 筛选与申请账号组件 -->
      <account-add
        @apply-success="handleApplySuccess"
        @filter-change="handleFilterChange"
      />

      <!-- 账号列表组件 -->
      <account-list
        :filtered-table-data="filteredTableData"
        @detail="handleDetail"
        @activate="handleActivate"
        @disable="handleDisable"
        @real-name-saved="handleRealNameSaved"
      />

      <!-- 账号详情弹窗（逻辑移到父组件，方便数据管理） -->
      <el-dialog
        v-model="showDetailDialog"
        title="账号详情"
        width="800px"
        center
        class="detail-dialog"
      >
        <div class="account-card" v-if="currentAccount">
          <div class="avatar-section">
            <img 
              :src="currentAccount.avatar || 'https://picsum.photos/100/100?text=默认头像'" 
              alt="用户头像"
              class="account-avatar"
            />
            <el-button 
              link 
              type="primary" 
              @click="uploadAvatar = true"
              v-if="!currentAccount.realName"
            >
              上传实名照片
            </el-button>
          </div>
          <div class="info-section">
            <div class="info-row">
              <span class="label">账号ID：</span>
              <span class="value">{{ currentAccount.id }}</span>
              <span class="label ml-4">账号类型：</span>
              <span class="value">{{ currentAccount.type === 'temp' ? '临时工' : '巡逻员' }}</span>
            </div>
            <div class="info-row">
              <span class="label">实名信息：</span>
              <span class="value">
                <el-input
                  v-model="currentAccount.realName"
                  placeholder="请输入实名认证信息"
                  size="small"
                  v-if="!currentAccount.realName"
                  style="width: 200px"
                />
                {{ currentAccount.realName || '未实名' }}
              </span>
              <span class="label ml-4">账号状态：</span>
              <span class="value">
                <el-tag
                  :type="
                    currentAccount.status === 'active' ? 'success' : 
                    currentAccount.status === 'inactive' ? 'warning' : 'danger'
                  "
                >
                  {{
                    currentAccount.status === 'active' ? '已激活' : 
                    currentAccount.status === 'inactive' ? '未激活' : '已禁用'
                  }}
                </el-tag>
              </span>
            </div>
            <div class="info-row">
              <span class="label">创建日期：</span>
              <span class="value">{{ currentAccount.createTime }}</span>
              <span class="label ml-4">最后操作时间：</span>
              <span class="value">{{ currentAccount.updateTime }}</span>
            </div>
            <div class="info-row" v-if="!currentAccount.realName">
              <el-button 
                size="small" 
                type="primary" 
                @click="saveRealName"
              >
                保存实名信息
              </el-button>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="showDetailDialog = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 头像上传弹窗 -->
      <el-dialog v-model="uploadAvatar" title="上传实名照片" width="400px">
        <el-upload
          class="avatar-uploader"
          action="/api/upload/avatar"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload"
        >
          <img 
            :src="currentAccount.avatar || 'https://picsum.photos/100/100?text=默认头像'" 
            class="avatar"
            alt="头像"
          />
          <template #tip>
            <div class="upload-tip">只能上传jpg/png文件，且不超过2MB</div>
          </template>
        </el-upload>
        <template #footer>
          <el-button @click="uploadAvatar = false">取消</el-button>
        </template>
      </el-dialog>
    </div>
  </CommonLayout>
</template>

<script setup>
import CommonLayout from '@/views/common/CommonLayout.vue'
import accountAdd from '@/components/admin/accountAdd.vue'
import accountList from '@/components/admin/accountList.vue'
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

// 筛选条件
const filterType = ref('')
const filterStatus = ref('')

// 详情弹窗相关
const showDetailDialog = ref(false)
const currentAccount = ref(null)
const uploadAvatar = ref(false)

// 模拟表格数据
const tableData = ref([
  { 
    id: '123456', 
    type: 'temp', 
    status: 'inactive', 
    realName: '', 
    avatar: '',
    createTime: '2026-03-01 10:00:00',
    updateTime: '2026-03-01 10:00:00'
  },
  { 
    id: '123457', 
    type: 'patrol', 
    status: 'active', 
    realName: '张三', 
    avatar: 'https://picsum.photos/100/100?text=张三',
    createTime: '2026-03-01 11:00:00',
    updateTime: '2026-03-01 12:00:00'
  },
  { 
    id: '123458', 
    type: 'temp', 
    status: 'disabled', 
    realName: '李四', 
    avatar: 'https://picsum.photos/100/100?text=李四',
    createTime: '2026-03-01 09:00:00',
    updateTime: '2026-03-01 15:00:00'
  }
])

// 筛选后的数据
const filteredTableData = computed(() => {
  return tableData.value.filter(item => {
    const typeMatch = filterType.value ? item.type === filterType.value : true
    const statusMatch = filterStatus.value ? item.status === filterStatus.value : true
    return typeMatch && statusMatch
  })
})

// 接收筛选条件变化
const handleFilterChange = ({ type, status }) => {
  filterType.value = type
  filterStatus.value = status
}

// 接收申请成功事件，更新列表
const handleApplySuccess = (newAccounts) => {
  tableData.value.push(...newAccounts)
}

// 查看详情
const handleDetail = (row) => {
  currentAccount.value = { ...row }
  showDetailDialog.value = true
}

// 保存实名信息
const saveRealName = () => {
  if (!currentAccount.value.realName) {
    ElMessage.warning('请输入实名认证信息')
    return
  }
  const target = tableData.value.find(item => item.id === currentAccount.value.id)
  if (target) {
    target.realName = currentAccount.value.realName
    target.updateTime = new Date().toLocaleString()
  }
  ElMessage.success('实名信息保存成功！')
}

// 激活账号
const handleActivate = async (row) => {
  try {
    await ElMessageBox.confirm('确定要激活该账号吗？', '激活账号', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    row.status = 'active'
    row.updateTime = new Date().toLocaleString()
    ElMessage.success('账号激活成功！')
  } catch (err) {
    ElMessage.info('已取消激活')
  }
}

// 禁用账号
const handleDisable = async (row) => {
  try {
    await ElMessageBox.confirm('确定要禁用该账号吗？', '禁用账号', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    })
    row.status = 'disabled'
    row.updateTime = new Date().toLocaleString()
    ElMessage.success('账号禁用成功！')
  } catch (err) {
    ElMessage.info('已取消禁用')
  }
}

// 头像上传成功
const handleAvatarSuccess = (res) => {
  if (currentAccount.value) {
    currentAccount.value.avatar = res.data.url
    const target = tableData.value.find(item => item.id === currentAccount.value.id)
    if (target) {
      target.avatar = res.data.url
      target.updateTime = new Date().toLocaleString()
    }
  }
  uploadAvatar.value = false
  ElMessage.success('头像上传成功！')
}

// 头像上传前校验
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isJPG) ElMessage.error('只能上传JPG/PNG格式的图片！')
  if (!isLt2M) ElMessage.error('图片大小不能超过2MB！')
  return isJPG && isLt2M
}

// 接收实名信息保存事件（可选，用于刷新）
const handleRealNameSaved = () => {
  // 可在此处刷新列表或做其他操作
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

/* 详情弹窗样式（名片式） */
.detail-dialog .el-dialog__body {
  padding: 20px !important;
}

.account-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.04);
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 30px;
}

.account-avatar {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.1);
}

.info-section {
  flex: 1;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  margin-left: 8px;
}

.ml-4 {
  margin-left: 16px;
}

/* 头像上传样式 */
.avatar-uploader {
  text-align: center;
}

.avatar-uploader .avatar {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.1);
}

.upload-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}

/* 统一按钮和组件样式 */
:deep(.el-button) {
  border-radius: 4px;
}

:deep(.el-select),
:deep(.el-input) {
  --el-input-border-color: #e5e7eb;
  --el-input-hover-border-color: #409eff;
}
</style>