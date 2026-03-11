<template>
  <el-dialog 
    :visible="visible" 
    @update:visible="$emit('update:visible', $event)"
    :title="editAccount.id ? '编辑管理员账号' : '创建管理员账号'" 
    width="650px"
    :close-on-click-modal="false"
    :modal-style="{ backdropFilter: 'blur(2px)', backgroundColor: 'rgba(0,0,0,0.1)' }"
    border-radius="12px"
    shadow="none"
    class="account-dialog"
  >
    <el-form 
      :model="accountForm" 
      :rules="accountRules" 
      ref="accountFormRef" 
      label-width="110px"
      class="dialog-form"
      size="default"
    >
      <el-form-item label="账号名称" prop="name">
        <el-input v-model="accountForm.name" placeholder="请输入账号名称" />
      </el-form-item>
      <!-- 修复：给密码项增加prop的校验规则动态适配 -->
      <el-form-item label="账号密码" prop="password" v-if="!editAccount.id">
        <el-input v-model="accountForm.password" type="password" placeholder="请输入账号密码" />
      </el-form-item>
      <el-form-item label="账号状态" prop="status">
        <el-radio-group v-model="accountForm.status">
          <el-radio label="1">启用</el-radio>
          <el-radio label="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="用户类型" prop="role">
        <el-select v-model="accountForm.role" placeholder="请选择用户类型">
          <el-option label="管理员" value="admin" />
          <el-option label="工作人员" value="staff" />
        </el-select>
      </el-form-item>
      <el-form-item label="实名信息" prop="realName">
        <el-input v-model="accountForm.realName" placeholder="请输入实名信息" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="$emit('update:visible', false)" class="cancel-btn">取消</el-button>
        <el-button type="primary" @click="handleSave" class="save-btn">确认保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  editAccount: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'save-success'])

const accountFormRef = ref()

const accountForm = reactive({
  name: '',
  password: '',
  status: '1',
  role: '',
  realName: '',
  orchardId: ''
})

// 修复：动态生成校验规则，编辑态移除password校验
const accountRules = reactive({
  name: [{ required: true, message: '请输入账号名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择账号状态', trigger: 'change' }],
  role: [{ required: true, message: '请选择用户类型', trigger: 'change' }],
  realName: [{ required: true, message: '请输入实名信息', trigger: 'blur' }]
})

// 监听编辑状态，动态添加/移除password校验规则
watch(
  () => props.editAccount,
  (val) => {
    if (val.id) {
      // 编辑态：移除密码校验
      delete accountRules.password
      accountForm.name = val.name || ''
      accountForm.status = val.status + '' || '1'
      accountForm.role = val.role || ''
      accountForm.realName = val.realName || ''
      accountForm.orchardId = val.orchardId || ''
    } else {
      // 创建态：添加密码校验
      accountRules.password = [{ required: true, message: '请输入账号密码', trigger: 'blur' }]
      // 重置表单
      Object.keys(accountForm).forEach(key => {
        accountForm[key] = key === 'status' ? '1' : ''
      })
    }
  },
  { immediate: true }
)

// 保存账号（修复无效的orchardId逻辑）
const handleSave = async () => {
  try {
    // 先校验表单
    await accountFormRef.value.validate()
    
    const submitData = {
      ...accountForm,
      status: Number(accountForm.status),
      // 修复：移除无效的orchardId判断（原逻辑role没有orchard值）
      orchardId: accountForm.orchardId
    }

    let res
    if (props.editAccount.id) {
      delete submitData.password
      res = await axios.put(`/api/super/account/${props.editAccount.id}`, submitData)
    } else {
      res = await axios.post('/api/super/account/create', submitData)
    }

    if (res.data.code === 200) {
      emit('save-success')
      emit('update:visible', false)
      ElMessage.success(props.editAccount.id ? '编辑成功' : '创建成功')
    } else {
      ElMessage.error('保存失败：' + res.data.msg)
    }
  } catch (err) {
    // 校验失败时给出提示
    if (err.name === 'ValidationError') {
      ElMessage.warning('请完善表单必填项后重试')
      return
    }
    ElMessage.error('保存账号失败：' + (err.message || '未知错误'))
    console.error(err)
  }
}
</script>

<!-- 样式部分不变，保留原有代码 -->
<style scoped>
/* 弹窗整体美化 */
:deep(.account-dialog .el-dialog__header) {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f2f5;
}
:deep(.account-dialog .el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}
:deep(.account-dialog .el-dialog__body) {
  padding: 24px;
}

/* 表单样式 */
.dialog-form {
  padding: 0;
}
:deep(.dialog-form .el-form-item) {
  margin-bottom: 20px;
}
:deep(.dialog-form .el-form-item__label) {
  font-weight: 500;
  color: #374151;
}
:deep(.dialog-form .el-input) {
  --el-input-border-radius: 6px;
}

/* 底部按钮区 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f2f5;
}
.cancel-btn {
  padding: 8px 20px;
  border-radius: 6px;
}
.save-btn {
  padding: 8px 20px;
  border-radius: 6px;
  background: #409eff;
  border-color: #409eff;
}

/* 单选框美化 */
:deep(.el-radio) {
  margin-right: 24px;
}
</style>