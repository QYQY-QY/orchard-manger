<template>
  <el-dialog
      :model-value="visible"
      @update:model-value="emit('update:visible', $event)"
      title="账号详情"
      width="800px"
      center
      class="detail-dialog"
      @close="handleClose"
  >
    <div class="account-card" v-if="currentAccount">
      <!-- 头像区域 -->
      <div class="avatar-section">
        <img 
          :src="currentAccount.realNamePhoto || currentAccount.avatar || 'https://picsum.photos/100/100?text=默认头像'" 
          alt="实名照片/头像"
          class="account-avatar"
        />
        <el-button 
          link 
          type="primary" 
          @click="uploadAvatar = true"
          v-if="!currentAccount.realNamePhoto"
        >
          上传实名照片
        </el-button>
        <div class="sex-text mt-2">
          {{ Number(currentAccount.sex) === 1 ? '男' : Number(currentAccount.sex) === 0 ? '女' : '未填写' }}
        </div>
      </div>

      <!-- 信息区域 -->
      <div class="info-section">
        <div style="margin-bottom: 20px; text-align: right;">
          <el-button 
            type="primary" 
            size="small" 
            @click="isEditing = !isEditing"
            v-if="!isEditing"
          >
            编辑账号
          </el-button>
          <el-button 
            type="success" 
            size="small" 
            @click="submitEditForm"
            v-if="isEditing"
          >
            保存修改
          </el-button>
          <el-button 
            type="default" 
            size="small" 
            @click="cancelEdit"
            v-if="isEditing"
            style="margin-left: 8px;"
          >
            取消
          </el-button>
        </div>

        <!-- 非编辑状态 -->
        <div v-if="!isEditing">
          <div class="info-row">
            <span class="label">账号ID：</span>
            <span class="value">{{ currentAccount.id }}</span>
            <span class="label ml-4">账号类型：</span>
            <span class="value">{{ Number(currentAccount.isAdmin) === 3 ? '农户' : '临时工' }}</span>
          </div>
          <div class="info-row">
            <span class="label">所属果园：</span>
            <span class="value">{{ currentAccount.orchardName || currentAccount.orchardId || '-' }}</span>
            <span class="label ml-4">所属果园区域：</span>
            <span class="value">{{ currentAccount.orchardArea || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">真实姓名：</span>
            <span class="value">{{ currentAccount.realName || '未实名' }}</span>
            <span class="label ml-4">身份证号：</span>
            <span class="value">{{ formatIdCard(currentAccount.id_card) || '未实名' }}</span>
          </div>
          <div class="info-row">
            <span class="label">账号状态：</span>
            <span class="value">
              <el-tag :type="Number(currentAccount.status) === 0 ? 'danger' : 'success'">
                {{ Number(currentAccount.status) === 0 ? '禁用' : '启用' }}
              </el-tag>
            </span>
            <span class="label ml-4">性别：</span>
            <span class="value">{{ Number(currentAccount.sex) === 1 ? '男' : Number(currentAccount.sex) === 0 ? '女' : '未填写' }}</span>
          </div>
          <div class="info-row">
            <span class="label">创建日期：</span>
            <span class="value">{{ formatTime(currentAccount.createTime) }}</span>
            <span class="label ml-4">最近使用时间：</span>
            <span class="value">{{ formatTime(currentAccount.lastUseTime) || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">账号工作天数：</span>
            <span class="value">{{ calcWorkDays(currentAccount.activateTime) }} 天</span>
          </div>

          <!-- 实名认证表单 -->
          <div class="real-name-form" v-if="!currentAccount.realName">
            <el-divider content-position="left">实名认证</el-divider>
            <el-form :model="realNameForm" inline @submit.prevent="submitRealName">
              <el-form-item label="真实姓名" prop="realName">
                <el-input v-model="realNameForm.name" placeholder="请输入真实姓名" size="small" />
              </el-form-item>
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="realNameForm.phone" placeholder="请输入手机号" size="small" />
              </el-form-item>
              <el-form-item label="身份证号" prop="idCard">
                <el-input v-model="realNameForm.idCard" placeholder="请输入身份证号" size="small" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" size="small" @click="submitRealName">提交实名</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 编辑状态 -->
        <el-form 
          v-if="isEditing"
          :model="editForm"
          :rules="editRules"
          ref="editFormRef"
          label-width="80px"
          style="width: 100%;"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="真实姓名" prop="name">
                <el-input v-model="editForm.name" placeholder="请输入真实姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="editForm.phone" placeholder="请输入手机号" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="性别" prop="sex">
                <el-select v-model="editForm.sex" placeholder="请选择性别">
                  <el-option label="男" value="1" />
                  <el-option label="女" value="0" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="身份证号" prop="id_card" v-if="!currentAccount.id_card">
            <el-input v-model="editForm.id_card" placeholder="请输入身份证号（仅未实名账号可填）" />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 头像上传弹窗 -->
    <el-dialog v-model="uploadAvatar" title="上传实名照片" width="400px">
      <el-upload
        class="avatar-uploader"
        action="/api/upload/realNamePhoto"
        :show-file-list="false"
        :on-success="handleAvatarSuccess"
        :before-upload="beforeAvatarUpload"
      >
        <img 
          :src="currentAccount.realNamePhoto || currentAccount.avatar || 'https://picsum.photos/100/100?text=默认头像'" 
          class="avatar"
          alt="实名照片"
        />
        <template #tip>
          <div class="upload-tip">只能上传jpg/png文件，且不超过2MB</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="uploadAvatar = false">取消</el-button>
      </template>
    </el-dialog>

    <template #footer>
      <el-button @click="emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import dayjs from 'dayjs'

// 接收props
const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  account: {
    type: Object,
    required: true,
    default: () => null
  }
})

// 定义事件
const emit = defineEmits([
  'close', 'edit-success', 'realname-success', 'avatar-success', 'update:visible'
])

// ========== 统一变量定义 ==========
const currentAccount = ref(null)
const isEditing = ref(false)
const uploadAvatar = ref(false)
const editFormRef = ref(null)

// 编辑表单（统一类型）
const editForm = ref({
  id: '',
  name: '',
  phone: '',
  sex: '',
  id_card: ''
})

// 编辑规则
const editRules = ref({
  name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [{ 
    required: true, 
    pattern: /^1[3-9]\d{9}$/, 
    message: '请输入正确的手机号', 
    trigger: 'blur' 
  }],
  sex: [{ required: true, message: '请选择性别', trigger: 'change' }],
  id_card: [{ 
    pattern: /^\d{18}|\d{17}X$/i, 
    message: '请输入正确的身份证号', 
    trigger: 'blur',
    required: false 
  }]
})

// 实名认证表单
const realNameForm = ref({
  name: '',
  phone: '',
  idCard: ''
})

// ========== 监听与初始化 ==========
watch(() => props.account, (newVal) => {
  if (newVal) {
    currentAccount.value = { ...newVal }
    // 初始化编辑表单（统一类型转换）
    editForm.value = {
      id: String(newVal.id),
      name: newVal.name || newVal.name || '',
      phone: newVal.phone || '',
      sex: String(Number(newVal.sex) || ''), // 统一转String
      id_card: newVal.id_card || ''
    }
    realNameForm.value = {
      name: newVal.name || '',
      phone: newVal.phone || '',
      idCard: newVal.id_card || ''
    }
    isEditing.value = false
  }
}, { immediate: true })

// ========== 方法 ==========
// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  editForm.value = {
    id: String(currentAccount.value.id),
    name: currentAccount.value.name || currentAccount.value.name || '',
    phone: currentAccount.value.phone || '',
    sex: String(Number(currentAccount.value.sex) || ''),
    id_card: currentAccount.value.id_card || ''
  }
}

// 提交编辑
const submitEditForm = async () => {
  try {
    await editFormRef.value.validate()
    const res = await axios.put('/api/employee/update', {
      ...editForm.value,
      id: Number(editForm.value.id),
      sex: Number(editForm.value.sex),
      id_card: editForm.value.id_card || ''
    })
    if (res.data.code === 200) {
      const updatedAccount = {
        ...currentAccount.value,
        name: editForm.value.name,
        phone: editForm.value.phone,
        sex: Number(editForm.value.sex),
        id_card: editForm.value.id_card || currentAccount.value.id_card,
        name: editForm.value.name,
        updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss') // 无时区
      }
      currentAccount.value = updatedAccount
      emit('edit-success', updatedAccount)
      ElMessage.success('账号编辑成功！')
      isEditing.value = false
    } else {
      ElMessage.error(res.data.msg || '账号编辑失败')
    }
  } catch (err) {
    if (err.name !== 'ValidationError') {
      ElMessage.error('账号编辑失败：' + err.message)
    }
  }
}

// 提交实名认证（修正接口地址）
const submitRealName = async () => {
  try {
    if (!realNameForm.value.name || !realNameForm.value.phone || !realNameForm.value.idCard) {
      return ElMessage.warning('请填写完整实名信息')
    }
    // 身份证校验
    if (!validateIdCard(realNameForm.value.idCard)) {
      return ElMessage.error('请输入正确的18位身份证号')
    }
    console.log('currentAccount.value:', currentAccount.value)
    console.log('currentAccount.value.id:', currentAccount.value?.id)
    // 正确接口地址：/api/employee/auth
    const res = await axios.post('/api/employee/auth', {
      name: realNameForm.value.name,
      phone: realNameForm.value.phone,
      idCard: realNameForm.value.idCard,
      id: Number(currentAccount.value.id)
    })
    if (res.data.code === 200) {
      const updatedAccount = {
        ...currentAccount.value,
        name: realNameForm.value.name,
        phone: realNameForm.value.phone,
        id_card: realNameForm.value.idCard,
        updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      currentAccount.value = updatedAccount
      emit('realname-success', updatedAccount)
      realNameForm.value = { name: '', phone: '', idCard: '' }
      ElMessage.success('实名认证成功！')
    } else {
      ElMessage.error(res.data.msg || '实名认证失败')
    }
  } catch (err) {
    ElMessage.error('实名认证失败：' + err.message)
  }
}

// 头像上传成功
const handleAvatarSuccess = (res, file) => {
  if (res.code === 200) {
    const updatedAccount = {
      ...currentAccount.value,
      realNamePhoto: res.data.url,
      updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    currentAccount.value = updatedAccount
    emit('avatar-success', updatedAccount)
    ElMessage.success('实名照片上传成功！')
    uploadAvatar.value = false
  } else {
    ElMessage.error('实名照片上传失败：' + res.msg)
  }
}

// 头像上传前校验
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isJPG) ElMessage.error('只能上传jpg/png文件！')
  if (!isLt2M) ElMessage.error('图片大小不能超过2MB！')
  return isJPG && isLt2M
}

// 关闭弹窗
const handleClose = () => {
  emit('close')
  emit('update:visible', false)
  isEditing.value = false
  uploadAvatar.value = false
}

// 身份证校验
const validateIdCard = (idCard) => {
  if (!idCard) return false
  const idStr = String(idCard)
  const reg = /^\d{18}|\d{17}X$/i
  return reg.test(idStr)
}

// 身份证加密
const formatIdCard = (idCard) => {
  if (!validateIdCard(idCard)) return ''
  const idStr = String(idCard)
  return idStr.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
}

// 时间格式化（无时区）
const formatTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 计算工作天数
const calcWorkDays = (activateTime) => {
  if (!activateTime) return 0
  return dayjs().diff(dayjs(activateTime), 'day')
}
</script>

<style scoped>
.detail-dialog .el-dialog__body {
  padding: 20px !important;
  background-color: #f8f9fa;
}

.account-card {
  display: flex;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.avatar-section {
  width: 140px;
  padding: 20px;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.account-avatar {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sex-text {
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}

.mt-2 {
  margin-top: 8px;
}

.info-section {
  flex: 1;
  padding: 24px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
}

.label {
  color: #666;
  font-weight: 500;
  width: 80px;
  text-align: right;
}

.value {
  color: #333;
  margin-left: 12px;
  flex: 1;
}

.ml-4 {
  margin-left: 24px;
}

.real-name-form {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #e5e7eb;
}

.avatar-uploader {
  text-align: center;
}

.avatar-uploader .avatar {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.upload-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>