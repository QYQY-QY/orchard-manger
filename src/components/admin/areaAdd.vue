<template>
  <div class="zone-sidebar">
    <div class="add-zone" @click="showAddZoneDialog = true">
      <span>添加区域</span>
      <el-icon><Plus /></el-icon>
    </div>
    <div class="zone-list" v-if="zoneList.length > 0">
      <div 
        class="zone-item" 
        v-for="zone in zoneList" 
        :key="zone.id"
        :class="{ active: activeAreaId === zone.id }"
        @click="handleZoneSelect(zone.id)"
      >
        <div class="zone-name">区域{{ zone.number }}：{{ zone.name }}</div>
        <div class="zone-remark">{{ zone.description || '无备注' }}</div>
        <!-- 详情/删除按钮 -->
        <div class="zone-actions">
          <el-button size="mini" type="text" @click.stop="handleZoneDetail(zone)">详情</el-button>
          <el-button size="mini" type="text" text-color="danger" @click.stop="handleZoneDelete(zone.id)">删除</el-button>
        </div>
      </div>
    </div>
    <div class="empty-zone" v-else>
      <el-empty description="暂无区域，请先添加"></el-empty>
    </div>

    <!-- 添加区域弹窗 -->
    <el-dialog 
      v-model="showAddZoneDialog" 
      title="添加果园区域" 
      width="800px"
      center
    >
      <el-form 
        :model="zoneForm" 
        :rules="zoneRules" 
        ref="zoneFormRef" 
        label-width="100px"
        style="margin-top: 30px"
      >
        <el-form-item label="区域名称" prop="name">
          <el-input 
            v-model="zoneForm.name" 
            placeholder="请输入区域名称" 
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="区域描述" prop="description">
          <el-input 
            v-model="zoneForm.description" 
            type="textarea" 
            placeholder="请输入区域描述" 
            rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="区域负责人">
          <el-input 
            v-model="zoneForm.manager" 
            placeholder="请输入负责人姓名（选填）" 
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="果树品种" prop="type">
          <el-select 
            v-model="zoneForm.type" 
            placeholder="请选择果树品种"
          >
            <el-option label="沙糖桔" value="沙糖桔" />
            <el-option label="沃柑" value="沃柑" />
            <el-option label="温州蜜柑" value="温州蜜柑" />
            <el-option label="红美人" value="红美人" />
          </el-select>
        </el-form-item>
        <el-form-item label="果树数量" prop="fruitCount">
          <el-input 
            v-model="zoneForm.fruitCount" 
            placeholder="请输入果树数量" 
            type="number"
            min="1"
          />
        </el-form-item>
        <el-form-item label="果园ID" prop="orchardId">
          <el-input 
            v-model="zoneForm.orchardId" 
            placeholder="请输入果园ID" 
            type="number"
            min="1"
            :disabled="userStore.user?.orchardId > 0"
            :value="userStore.user?.orchardId || zoneForm.orchardId"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelAddZone">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmAddZone"
        >
          确认添加
        </el-button>
      </template>
    </el-dialog>

    <!-- 区域详情弹窗 -->
    <el-dialog 
      v-model="showDetailDialog" 
      title="区域详情" 
      width="800px"
      center
      :close-on-click-modal="false"
    >
      <div class="zone-detail-content">
        <el-descriptions 
          title="基础信息" 
          :column="2" 
          border 
          style="margin-bottom: 20px"
        >
          <el-descriptions-item label="区域ID">
            {{ currentZone.id }}
          </el-descriptions-item>
          <el-descriptions-item label="区域名称">
            {{ currentZone.name }}
          </el-descriptions-item>
          <el-descriptions-item label="果园ID">
            {{ currentZone.orchardId }}
          </el-descriptions-item>
          <el-descriptions-item label="果树品种">
            {{ currentZone.type }}
          </el-descriptions-item>
          <el-descriptions-item label="果树总数">
            {{ currentZone.size }}
          </el-descriptions-item>
          <el-descriptions-item label="管理员ID">
            {{ currentZone.empId }}
          </el-descriptions-item>
          <el-descriptions-item label="区域负责人">
            {{ currentZone.manager || '未设置' }}
          </el-descriptions-item>
          <el-descriptions-item label="区域描述">
            {{ currentZone.description || '无' }}
          </el-descriptions-item>
        </el-descriptions>
        
        <el-descriptions title="果树列表预览" border>
          <el-descriptions-item label="果树数量">{{ currentZone.trees.length }} 棵</el-descriptions-item>
          <el-descriptions-item label="主要品种">{{ currentZone.type }}</el-descriptions-item>
          <el-descriptions-item label="健康率">
            {{ currentZone.trees.length > 0 ? Math.round((currentZone.trees.filter(t => t.healthCondition === '健康').length / currentZone.trees.length) * 100) : 0 }}%
          </el-descriptions-item>
          <el-descriptions-item label="成熟率">
            {{ currentZone.trees.length > 0 ? Math.round((currentZone.trees.filter(t => t.ripeDegree !== 'NaN' && Number(t.ripeDegree) > 0).length / currentZone.trees.length) * 100) : 0 }}%
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleZoneEdit(currentZone)">编辑信息</el-button>
      </template>
    </el-dialog>

    <!-- 编辑区域弹窗 -->
    <el-dialog 
      v-model="showEditDialog" 
      title="编辑区域信息" 
      width="800px"
      center
      :close-on-click-modal="false"
    >
      <el-form 
        :model="editForm" 
        :rules="zoneRules" 
        ref="editFormRef" 
        label-width="100px"
        style="margin-top: 30px"
      >
        <el-form-item label="区域名称" prop="name">
          <el-input 
            v-model="editForm.name" 
            placeholder="请输入区域名称" 
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="区域描述" prop="description">
          <el-input 
            v-model="editForm.description" 
            type="textarea" 
            placeholder="请输入区域描述" 
            rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="区域负责人">
          <el-input 
            v-model="editForm.manager" 
            placeholder="请输入负责人姓名（选填）" 
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="果树品种" prop="type">
          <el-select 
            v-model="editForm.type" 
            placeholder="请选择果树品种"
          >
            <el-option label="沙糖桔" value="沙糖桔" />
            <el-option label="沃柑" value="沃柑" />
            <el-option label="温州蜜柑" value="温州蜜柑" />
            <el-option label="红美人" value="红美人" />
          </el-select>
        </el-form-item>
        <el-form-item label="果树数量" prop="fruitCount">
          <el-input 
            v-model="editForm.fruitCount" 
            placeholder="请输入果树数量" 
            type="number"
            min="1"
          />
        </el-form-item>
        <el-form-item label="果园ID" prop="orchardId">
          <el-input 
            v-model="editForm.orchardId" 
            placeholder="请输入果园ID" 
            type="number"
            min="1"
            disabled
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelEditZone">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmEditZone"
        >
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { useUserStore } from '@/stores/modules/user.js'

// 定义props
const props = defineProps({
  zoneList: {
    type: Array,
    required: true,
    default: () => []
  },
  activeAreaId: {
    type: [String, Number],
    required: true,
    default: ''
  }
})

// 定义emit事件
const emit = defineEmits([
  'zone-select',    // 选择区域
  'zone-update',    // 区域数据更新（添加/编辑/删除）
  'zone-detail',    // 查看区域详情（透传）
  'zone-info-change'// 区域详情同步
])

// 初始化用户仓库
const userStore = useUserStore()

// 添加区域相关
const showAddZoneDialog = ref(false)
const zoneFormRef = ref(null)
const zoneForm = reactive({
  name: '',
  description: '',
  manager: '',
  type: '',
  fruitCount: '',
  orchardId: userStore.user?.orchardId ? Number(userStore.user.orchardId) : ''
})

// 详情/编辑相关
const showDetailDialog = ref(false)
const showEditDialog = ref(false)
const currentZone = reactive({})
const editFormRef = ref(null)
const editForm = reactive({
  name: '',
  description: '',
  manager: '',
  type: '',
  fruitCount: '',
  orchardId: ''
})

// 表单校验规则
const zoneRules = reactive({
  name: [
    { required: true, message: '请输入区域名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入区域描述', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择果树品种', trigger: 'change' }
  ],
  fruitCount: [
    { required: true, message: '请输入果树数量', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        const num = Number(value)
        if (isNaN(num) || num <= 0) {
          callback(new Error('果树数量需大于0'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  orchardId: [
    { required: true, message: '请输入果园ID', trigger: 'blur' },
    { type: 'number', min: 1, message: '果园ID需大于0', trigger: 'blur' }
  ]
})

// 核心修复1：统一数据格式，封装传递函数
const emitZoneInfo = (zone) => {
  if (!zone) return
  // 统一字段映射：把表单的fruitCount映射为size，补充所有areaTree需要的字段
  const zoneInfo = {
    id: zone.id || '',
    name: zone.name || '',
    description: zone.description || '',
    manager: zone.manager || '',
    type: zone.type || '',
    fruitCount: zone.fruitCount || zone.size || '', // 兼容表单和列表字段
    size: zone.size || zone.fruitCount || 0, // 果树总数（areaTree优先用size）
    orchardId: zone.orchardId || '',
    number: zone.number || '', // 区域编号
    trees: zone.trees || [] // 果树列表
  }
  emit('zone-info-change', zoneInfo)
}

// 选择区域
const handleZoneSelect = (areaId) => {
  emit('zone-select', areaId)
  
  // 找到选中的区域并传递完整数据
  const selectedZone = props.zoneList.find(zone => zone.id === areaId)
  if (selectedZone) {
    emitZoneInfo(selectedZone) // 调用封装函数
  }
}

// 查看区域详情
const handleZoneDetail = (zone) => {
  Object.assign(currentZone, JSON.parse(JSON.stringify(zone)))
  showDetailDialog.value = true
  emit('zone-detail', zone)
  emitZoneInfo(zone) // 新增：查看详情时也同步数据
}

// 显示编辑弹窗
const handleZoneEdit = (zone) => {
  Object.assign(currentZone, JSON.parse(JSON.stringify(zone)))
  editForm.name = zone.name
  editForm.description = zone.description || ''
  editForm.manager = zone.manager || ''
  editForm.type = zone.type
  editForm.fruitCount = zone.size || ''
  editForm.orchardId = zone.orchardId
  showEditDialog.value = true
  showDetailDialog.value = false
}

// 取消编辑
const cancelEditZone = () => {
  showEditDialog.value = false
  Object.assign(editForm, {
    name: '',
    description: '',
    manager: '',
    type: '',
    fruitCount: '',
    orchardId: ''
  })
  editFormRef.value?.resetFields()
}

// 确认修改区域
const confirmEditZone = async () => {
  try {
    await editFormRef.value.validate()

    const submitData = {
      id: currentZone.id,
      description: editForm.description,
      empId: userStore.user?.id ? Number(userStore.user.id) : 0,
      size: Number(editForm.fruitCount),
      name: editForm.name,
      orchardId: currentZone.orchardId,
      type: editForm.type,
      manager: editForm.manager // 新增：传递负责人
    }

    // 模拟接口调用（实际项目解开注释）
    // const response = await axios.put('/api/area/edit', submitData)
    // if (response.data.code === 200) {
      ElMessage.success('区域信息修改成功！')
      showEditDialog.value = false
      
      // 传递编辑后的完整数据
      const updatedZone = {
        ...currentZone,
        ...submitData,
        fruitCount: editForm.fruitCount,
        number: props.zoneList.find(z => z.id === currentZone.id)?.number || ''
      }
      emitZoneInfo(updatedZone)
      
      // 通知父组件更新数据
      emit('zone-update', {
        type: 'edit',
        data: updatedZone
      })
    // } else {
    //   ElMessage.error('修改失败：' + response.data.msg)
    // }
  } catch (error) {
    console.error(error)
    ElMessage.error('修改失败，请检查表单')
  }
}

// 取消添加区域
const cancelAddZone = () => {
  showAddZoneDialog.value = false
  resetAddZoneForm()
}

// 重置添加区域表单
const resetAddZoneForm = () => {
  const currentOrchardId = userStore.user?.orchardId ? Number(userStore.user.orchardId) : ''
  Object.assign(zoneForm, {
    name: '',
    description: '',
    manager: '',
    type: '',
    fruitCount: '',
    orchardId: currentOrchardId
  })
  zoneFormRef.value?.resetFields()
}

// 确认添加区域
const confirmAddZone = async () => {
  try {
    await zoneFormRef.value.validate()

    const submitData = {
      description: zoneForm.description,
      empId: userStore.user?.id ? Number(userStore.user.id) : 0,
      size: Number(zoneForm.fruitCount), // 统一用size字段
      name: zoneForm.name,
      orchardId: Number(zoneForm.orchardId),
      type: zoneForm.type,
      manager: zoneForm.manager // 传递负责人
    }

    const response = await axios.post('/api/area', submitData)
    
    if (response.data && response.data.code === 200) {
      ElMessage.success('区域添加成功！')
      showAddZoneDialog.value = false
      resetAddZoneForm()
      
      // 传递新增的完整数据（包含接口返回的ID）
      const newZone = {
        ...submitData,
        id: response.data.data?.id || '', // 补充接口返回的ID
        number: props.zoneList.length + 1, // 补充区域编号
        trees: []
      }
      emitZoneInfo(newZone)
      
      // 通知父组件更新数据
      emit('zone-update', { type: 'add' })
    } else {
      console.log('后端返回数据：', response.data)
      ElMessage.error('添加失败：' + (response.data?.msg || '未知错误，可以重新登录'))
    }
  } catch (error) {
    console.error('添加区域失败：', error)
    ElMessage.error('添加失败，请检查表单或网络')
  }
}

// 删除区域
const handleZoneDelete = (zoneId) => {
  ElMessageBox.confirm(
    '确定要删除该区域吗？删除后该区域下的所有果树数据也会被删除',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(async () => {
    try {
      // 模拟接口调用（实际项目解开注释）
      // const response = await axios.delete(`/api/area/${zoneId}`)
      // if (response.data.code === 200) {
        ElMessage.success('区域删除成功！')
        // 通知父组件更新数据
        emit('zone-update', { type: 'delete', id: zoneId })
        // 新增：删除后清空同步数据
        emitZoneInfo({})
      // } else {
      //   ElMessage.error('删除失败：' + response.data.msg)
      // }
    } catch (error) {
      console.error('删除区域失败：', error)
      ElMessage.error('删除失败，请稍后重试')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 核心修复2：监听activeAreaId变化，自动同步当前选中区域数据
watch(
  () => props.activeAreaId,
  (newVal) => {
    if (newVal) {
      const selectedZone = props.zoneList.find(zone => zone.id === newVal)
      emitZoneInfo(selectedZone)
    } else {
      emitZoneInfo({}) // 无选中区域时清空
    }
  },
  { immediate: true } // 初始化时立即执行
)

// 核心修复3：监听zoneList变化，确保数据同步
watch(
  () => props.zoneList,
  (newList) => {
    if (props.activeAreaId && newList.length) {
      const selectedZone = newList.find(zone => zone.id === props.activeAreaId)
      emitZoneInfo(selectedZone)
    }
  },
  { deep: true } // 深度监听数组变化
)

// 监听用户果园ID变化重置表单
watch(
  () => userStore.user?.orchardId,
  (newVal) => {
    zoneForm.orchardId = newVal ? Number(newVal) : ''
  },
  { immediate: true }
)

// 初始化时同步当前选中区域数据
onMounted(() => {
  if (props.activeAreaId) {
    const selectedZone = props.zoneList.find(zone => zone.id === props.activeAreaId)
    emitZoneInfo(selectedZone)
  }
})
</script>

<style scoped>
.zone-sidebar {
  width: 260px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  background-color: #fff;
}

.add-zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  font-size: 15px;
  color: #333;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.add-zone:hover {
  background-color: #f8f9fa;
}

.zone-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.zone-item {
  padding: 12px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  position: relative;
}

.zone-item.active {
  background-color: #e8f4ff;
  border-left-color: #409eff;
}

.zone-item:hover:not(.active) {
  background-color: #f8f9fa;
}

.zone-name {
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.zone-remark {
  color: #999;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.zone-actions {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: none;
}

.zone-item:hover .zone-actions {
  display: flex;
  gap: 5px;
}

.empty-zone {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.zone-detail-content {
  padding: 10px 0;
}
</style>