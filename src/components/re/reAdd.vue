<template>
  <div class="filter-bar">
    <div class="filter-group">
      <div class="filter-item">
        <label class="filter-label">任务类型：</label>
        <el-select
          v-model="localFilterParams.taskType"
          placeholder="请选择任务类型"
          class="filter-select"
        >
          <el-option label="全部类型" value="" />
          <el-option label="日常招聘" value="daily" />
          <el-option label="紧急招聘" value="urgent" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">招聘状态：</label>
        <el-select
          v-model="localFilterParams.recruitStatus"
          placeholder="请选择招聘状态"
          class="filter-select"
        >
          <el-option label="全部状态" value="" />
          <el-option label="未完成" value="unfinished" />
          <el-option label="进行中" value="processing" />
          <el-option label="已完成" value="finished" />
        </el-select>
      </div>
      <el-button type="primary" @click="handleFilter" class="filter-btn">筛选</el-button>
      <el-button @click="resetFilter" class="reset-btn">重置</el-button>
    </div>
    <el-button type="primary" class="publish-btn" @click="showPublishDialog = true">发布招聘任务</el-button>

    <!-- 发布招聘任务弹框 -->
    <el-dialog v-model="showPublishDialog" title="发布新招聘任务" width="600px">
      <el-form :model="publishForm" :rules="publishRules" ref="publishFormRef" label-width="120px">
        <el-form-item label="招聘标题" prop="title">
          <el-input v-model="publishForm.title" placeholder="请输入招聘标题" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="招聘内容" prop="content">
          <el-input
            v-model="publishForm.content"
            placeholder="请输入招聘内容（如：岗位要求、工作内容等）"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <!-- 新增：招聘地点（果园区域选择） -->
        <el-form-item label="招聘地点" prop="areaId">
          <el-select
            v-model="publishForm.areaId"
            placeholder="请选择招聘地点（果园区域）"
            filterable
            @change="handleAreaChange"
          >
            <el-option
              v-for="area in areaList"
              :key="area.id"
              :label="`${area.name}`"
              :value="area.id"
            />
          </el-select>
        </el-form-item>
        <!-- 优化：招聘人数（对应列表的 recruitNum） -->
        <el-form-item label="招聘人数" prop="recruitNum">
          <el-input-number v-model="publishForm.recruitNum" :min="1" placeholder="请输入招聘人数" />
        </el-form-item>
        <!-- 新增：已招人数（发布时默认0，不可改） -->
        <el-form-item label="已招人数" prop="recruitedNum">
          <el-input-number v-model="publishForm.recruitedNum" :min="0" disabled />
        </el-form-item>
        <!-- 优化：日薪（对应列表的 dailyWage） -->
        <el-form-item label="日薪（元）" prop="dailyWage">
          <el-input-number v-model="publishForm.dailyWage" :min="0" placeholder="请输入日薪" precision="0" />
        </el-form-item>
        <el-form-item label="任务类型" prop="taskType">
          <el-select v-model="publishForm.taskType" placeholder="请选择任务类型">
            <el-option label="日常招聘" value="daily" />
            <el-option label="紧急招聘" value="urgent" />
          </el-select>
        </el-form-item>
        <!-- 优化：初始状态（绑定后端 isFinish 状态码） -->
        <el-form-item label="初始状态" prop="isFinish">
          <el-select v-model="publishForm.isFinish" placeholder="请选择初始状态">
            <el-option label="未完成" :value="0" />
            <el-option label="进行中" :value="1" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPublishDialog = false">取消</el-button>
        <el-button type="primary" @click="handlePublish">确认发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// 修复：补充缺失的 watch 导入
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/modules/user'
import axios from 'axios'

const emit = defineEmits(['publish-success', 'filter-change', 'reset-filter'])
const userStore = useUserStore()

// 本地筛选参数
const localFilterParams = ref({
  taskType: '',
  recruitStatus: ''
})

// 发布弹框
const showPublishDialog = ref(false)
const publishFormRef = ref(null)

// 新增：果园区域列表（招聘地点选项）
const areaList = ref([])

// 发布表单（完全对齐列表字段 + 后端接口）
const publishForm = reactive({
  title: '', // 招聘标题
  content: '', // 招聘内容
  areaId: '', // 招聘地点（区域ID）
  areaName: '', // 招聘地点名称（后端存储用）
  recruitNum: 0, // 招聘人数（需招人数）
  recruitedNum: 0, // 已招人数（发布时默认0）
  dailyWage: 0, // 日薪
  taskType: '', // 任务类型
  isFinish: 0, // 招聘状态（0=未完成、1=进行中、2=已完成）
  orchardId: userStore.user.orchardId || 1, // 果园ID
  orchardName: userStore.user.orchardName || '', // 果园名称
  createUser: userStore.user.id || 0, // 创建人ID
  senderId: userStore.user.id || 0, // 发送人ID
  senderName: userStore.user.name || userStore.user.username || '', // 发送人姓名
  empId: userStore.user.empId || 0, // 员工ID（当前发布人）
  empName: userStore.user.name || '' // 员工姓名（当前发布人）
})

// 校验规则（同步表单字段）
const publishRules = reactive({
  title: [{ required: true, message: '请输入招聘标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入招聘内容', trigger: 'blur' }],
  areaId: [{ required: true, message: '请选择招聘地点', trigger: 'change' }],
  recruitNum: [{ required: true, message: '请输入招聘人数', trigger: 'blur' }],
  dailyWage: [{ required: true, message: '请输入日薪', trigger: 'blur' }],
  taskType: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  isFinish: [{ required: true, message: '请选择初始状态', trigger: 'change' }]
})

// 新增：获取果园区域列表（招聘地点）
// 新增：获取果园区域列表（招聘地点）
const getAreaList = async () => {
  try {
    // 1. 转为数字类型（后端要求Long类型，前端数字兼容）
    const orchardId = Number(userStore.user.orchardId) || 1
    // 2. 核心修改：参数式传参（params），而非路径式
    const res = await axios.get('/api/area/selectByOrchardId', {
      params: { orchardId: orchardId } // 后端接收的参数名：orchardId
    })
    if (res.data.code === 200) {
      areaList.value = res.data.data || []
    } else {
      ElMessage.error('获取招聘地点列表失败：' + res.data.msg)
    }
  } catch (err) {
    ElMessage.error('获取招聘地点列表失败，请检查网络或接口配置')
    console.error('获取区域列表报错：', err)
  }
}

// 筛选
const handleFilter = () => {
  emit('filter-change', localFilterParams.value)
  ElMessage.success('筛选完成')
}

// 重置筛选
const resetFilter = () => {
  localFilterParams.value = {
    taskType: '',
    recruitStatus: ''
  }
  emit('reset-filter')
  ElMessage.info('筛选条件已重置')
}

// 发布招聘任务（适配新表单字段 + 后端接口）
const handlePublish = async () => {
  try {
    await publishFormRef.value.validate()

    // 修复：单独定义 createTime，避免语法错误
const createTime = () => {
  const iso = new Date().toISOString() // 2026-03-09T12:00:00.1Z
  const noTZ = iso.replace(/T|Z/g, '') // 2026-03-0912:00:00.1
  const [dateTime, ms] = noTZ.split('.') // 拆分：["2026-03-0912:00:00", "1"]
  
  // 补全三位毫秒（不足补0，超过截三位）
  const fixedMs = (ms || '000').padEnd(3, '0').slice(0, 3)
  
  const datePart = dateTime.slice(0, 10)   // 2026-03-09
  const timePart = dateTime.slice(10)      // 12:00:00
  return `${datePart} ${timePart}.${fixedMs}` // 2026-03-09 12:00:00.100
}

    // 提交给后端的完整参数（对齐列表渲染字段）
    const submitData = {
      ...publishForm,
      id: null, // 新增任务ID默认0
      isRead: 0, // 是否已读（默认false）0未读，1已读
      groupId: 0, // 分组ID（默认0）
      groupName: '', // 分组名称（默认空）
      updateUser: userStore.user.id || 0, // 更新人ID
      createTime: createTime(), // 调用时间格式化函数
      orchardName: publishForm.orchardName || `果园${publishForm.orchardId}`,
      recruitAddress: publishForm.areaName || `区域${publishForm.areaId}` // 招聘地点名称
    }

    // 调试：打印提交的数据，确认 createTime 无T/Z
    console.log('提交给后端的数据：', submitData)

    const res = await axios.post('/api/announceInfo/publish', submitData)

    if (res.data.code === 200) {
      ElMessage.success('招聘任务发布成功')
      showPublishDialog.value = false
      emit('publish-success')

      // 重置表单
      Object.assign(publishForm, {
        title: '',
        content: '',
        areaId: '',
        areaName: '',
        recruitNum: 0,
        recruitedNum: 0,
        dailyWage: 0,
        taskType: '',
        isFinish: 0
      })
      publishFormRef.value?.resetFields()
    } else {
      ElMessage.error(res.data.msg || '发布失败')
    }
  } catch (err) {
    if (err.name !== 'ValidationError') {
      ElMessage.error('发布失败：' + (err.message || '未知错误'))
      console.error(err)
    }
  }
}

// 初始化：打开弹框前先获取果园区域列表
onMounted(() => {
  // 监听弹框打开事件，提前加载区域列表
  watch(showPublishDialog, (val) => {
    if (val) {
      getAreaList()
    }
  })
})
</script>

<style scoped>
.filter-bar {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 20px;
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
  width: 180px;
}

.filter-btn, .reset-btn, .publish-btn {
  white-space: nowrap;
}

.reset-btn {
  color: #606266;
}
</style>