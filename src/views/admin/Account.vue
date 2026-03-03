<template>
  <CommonLayout>
    <div class="account-management">
      <!-- 顶部筛选与操作区 -->
      <div class="top-bar">
        <div class="filter-group">
          <span class="filter-label">筛选</span>
          <el-select
            v-model="filterType"
            placeholder="账号类型"
            size="default"
            style="width: 180px"
          >
            <el-option label="全部类型" value="" />
            <el-option label="临时工" value="temp" />
            <el-option label="巡逻员" value="patrol" />
          </el-select>
          <el-select
            v-model="filterStatus"
            placeholder="账号状态"
            size="default"
            style="width: 150px"
          >
            <el-option label="全部状态" value="" />
            <el-option label="未激活" value="inactive" />
            <el-option label="已激活" value="active" />
            <el-option label="已禁用" value="disabled" />
          </el-select>
          <el-button type="primary" size="default" @click="handleFilter">筛选</el-button>
          <el-button size="default" @click="resetFilter">重置</el-button>
        </div>
        <el-button type="primary" size="default" @click="showApplyDialog = true">申请账号</el-button>
      </div>

      <!-- 账号列表表格 -->
      <div class="table-container">
        <el-table
          :data="filteredTableData"
          style="width: 100%"
          :header-cell-style="{ backgroundColor: '#f5f7fa', color: '#333' }"
          :cell-style="{ color: '#666' }"
          border
          stripe
        >
          <el-table-column prop="id" label="账号ID" width="120" />
          <el-table-column prop="type" label="用户类型" width="120">
            <template #default="{ row }">
              <el-tag size="small" :type="row.type === 'temp' ? 'primary' : 'success'">
                {{ row.type === 'temp' ? '临时工' : '巡逻员' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="账号状态" width="120">
            <template #default="{ row }">
              <el-tag
                size="small"
                :type="
                  row.status === 'active' ? 'success' : row.status === 'inactive' ? 'warning' : 'danger'
                "
              >
                {{
                  row.status === 'active' ? '已激活' : row.status === 'inactive' ? '未激活' : '已禁用'
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="realName" label="实名信息" min-width="150">
            <template #default="{ row }">
              {{ row.realName || '未实名' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleDetail(row)">查看详情</el-button>
              <el-button 
                link 
                type="success" 
                @click="handleActivate(row)"
                v-if="row.realName && row.status === 'inactive'"
              >
                激活账号
              </el-button>
              <el-button 
                link 
                type="danger" 
                @click="handleDisable(row)"
                v-if="row.status !== 'disabled'"
              >
                禁用账号
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 1. 申请账号弹窗 -->
    <el-dialog
      v-model="showApplyDialog"
      title="申请账号"
      width="500px"
      center
      @close="resetApplyForm"
    >
      <el-form
        :model="applyForm"
        :rules="applyRules"
        ref="applyFormRef"
        label-width="100px"
      >
        <el-form-item label="账号类型" prop="type">
          <el-radio-group v-model="applyForm.type">
            <el-radio label="temp">临时工</el-radio>
            <el-radio label="patrol">巡逻员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="申请数量" prop="count">
          <el-input
            v-model.number="applyForm.count"
            type="number"
            min="1"
            max="10"
            placeholder="请输入申请数量（1-10）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApplyDialog = false">取消</el-button>
        <el-button type="primary" @click="submitApplyForm">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 2. 账号详情弹窗（名片式横版） -->
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

    <!-- 3. 头像上传弹窗（隐藏） -->
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
  </CommonLayout>
</template>

<script setup>
import CommonLayout from '@/views/common/CommonLayout.vue'
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

// 筛选条件
const filterType = ref('')
const filterStatus = ref('')

// 申请账号弹窗相关
const showApplyDialog = ref(false)
const applyFormRef = ref(null)
const applyForm = reactive({
  type: '', // temp:临时工, patrol:巡逻员
  count: 1  // 申请数量
})
const applyRules = reactive({
  type: [{ required: true, message: '请选择账号类型', trigger: 'change' }],
  count: [
    { required: true, message: '请输入申请数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 10, message: '数量需在1-10之间', trigger: 'blur' }
  ]
})

// 详情弹窗相关
const showDetailDialog = ref(false)
const currentAccount = ref(null)
const uploadAvatar = ref(false)

// 模拟表格数据（实际项目从接口获取）
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
    // 类型筛选
    const typeMatch = filterType.value ? item.type === filterType.value : true
    // 状态筛选
    const statusMatch = filterStatus.value ? item.status === filterStatus.value : true
    return typeMatch && statusMatch
  })
})

// 1. 筛选功能
const handleFilter = () => {
  ElMessage.success(`筛选条件：类型=${filterType.value || '全部'}, 状态=${filterStatus.value || '全部'}`)
}

// 重置筛选
const resetFilter = () => {
  filterType.value = ''
  filterStatus.value = ''
}

// 2. 申请账号 - 重置表单
const resetApplyForm = () => {
  applyForm.type = ''
  applyForm.count = 1
  applyFormRef.value?.resetFields()
}

// 申请账号 - 提交表单
const submitApplyForm = async () => {
  try {
    // 表单校验
    await applyFormRef.value.validate()
    
    // 调用后端接口
    const res = await axios.post('api/employee/add', {
      type: applyForm.type,
      count: applyForm.count
    })

    // 接口成功处理
    if (res.code === 200) {
      ElMessage.success('账号申请成功！')
      showApplyDialog.value = false
      resetApplyForm()
      
      // 模拟新增数据（实际项目需重新请求列表）
      for (let i = 0; i < applyForm.count; i++) {
        const newId = '888' + Math.floor(Math.random() * 1000)
        tableData.value.push({
          id: newId,
          type: applyForm.type,
          status: 'inactive',
          realName: '',
          avatar: '',
          createTime: new Date().toLocaleString(),
          updateTime: new Date().toLocaleString()
        })
      }
    } else {
      ElMessage.error(res.msg || '账号申请失败')
    }
  } catch (err) {
    console.error('申请账号失败：', err)
    ElMessage.error('账号申请失败，请稍后重试')
  }
}

// 3. 查看详情
const handleDetail = (row) => {
  currentAccount.value = { ...row } // 深拷贝避免直接修改原数据
  showDetailDialog.value = true
}

// 4. 保存实名信息
const saveRealName = () => {
  if (!currentAccount.value.realName) {
    ElMessage.warning('请输入实名认证信息')
    return
  }

  // 找到原数据并更新
  const target = tableData.value.find(item => item.id === currentAccount.value.id)
  if (target) {
    target.realName = currentAccount.value.realName
    target.updateTime = new Date().toLocaleString()
  }
  ElMessage.success('实名信息保存成功！')
}

// 5. 激活账号
const handleActivate = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要激活该账号吗？',
      '激活账号',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 调用激活接口（示例）
    // await axios.post('/employee/activate', { id: row.id })
    
    row.status = 'active'
    row.updateTime = new Date().toLocaleString()
    ElMessage.success('账号激活成功！')
  } catch (err) {
    ElMessage.info('已取消激活')
  }
}

// 6. 禁用账号
const handleDisable = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要禁用该账号吗？',
      '禁用账号',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }
    )

    // 调用禁用接口（示例）
    // await axios.post('/employee/disable', { id: row.id })
    
    row.status = 'disabled'
    row.updateTime = new Date().toLocaleString()
    ElMessage.success('账号禁用成功！')
  } catch (err) {
    ElMessage.info('已取消禁用')
  }
}

// 7. 头像上传成功
const handleAvatarSuccess = (res) => {
  if (currentAccount.value) {
    currentAccount.value.avatar = res.data.url
    // 更新原数据
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

  if (!isJPG) {
    ElMessage.error('只能上传JPG/PNG格式的图片！')
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB！')
  }
  return isJPG && isLt2M
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
}

/* 顶部筛选与按钮区 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #fff;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

/* 表格容器 */
.table-container {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background-color: #fff;
  overflow: auto;
}

/* 详情弹窗样式（名片式） */
.detail-dialog .el-dialog__body {
  padding: 0 !important;
}

.account-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
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
  border: 1px solid #eee;
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
}

.upload-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}
</style>