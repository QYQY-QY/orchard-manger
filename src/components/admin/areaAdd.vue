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
          <el-button size="mini" link @click.stop="handleZoneDetail(zone)">详情</el-button>
          <el-button size="mini" link text-color="danger" @click.stop="handleZoneDelete(zone.id)">删除</el-button>
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
        
        <el-form-item label="区域负责人" prop="empId">
          <el-select 
            v-model="zoneForm.empId" 
            placeholder="请选择区域负责人"
            :loading="farmerLoading"
            @change="zoneForm.empName = farmerList.find(item => item.id === zoneForm.empId)?.name || ''"
          >
            <el-option 
              v-for="farmer in farmerList" 
              :key="farmer.id" 
              :label="farmer.name" 
              :value="farmer.id"
            />
          </el-select>
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
            {{ currentZone.empName || currentZone.manager || '未设置' }}
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

        <el-form-item label="区域负责人" prop="empId">
          <el-select 
            v-model="editForm.empId" 
            placeholder="请选择区域负责人"
            :loading="farmerLoading"
            @change="editForm.empName = farmerList.find(item => item.id === editForm.empId)?.name || ''"
          >
            <el-option 
              v-for="farmer in farmerList" 
              :key="farmer.id" 
              :label="farmer.name" 
              :value="farmer.id"
            />
          </el-select>
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

// 新增：农户列表（isAdmin=3）
const farmerList = ref([])
// 新增：加载状态
const farmerLoading = ref(false)

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

// 新增：生成不带时区的ISO格式时间（去掉Z标识）
const formatTimeWithoutZone = () => {
  return new Date().toISOString().replace('Z', '').replace('T', ' ')
}

// 新增：获取果园下的农户列表（isAdmin=3）
const getFarmerList = async (orchardId) => {
  if (!orchardId) return
  try {
    farmerLoading.value = true
    const response = await axios.get('/api/employee/getEmpNameByOrchardIds', {
      params: { orchardId } // 传递果园ID参数
    })
    if (response.data.code === 200) {
      // 筛选出isAdmin=3的农户
      farmerList.value = response.data.data.filter(item => item.isAdmin === 3)
      console.log('获取到的农户列表：', farmerList.value)
    } else {
      ElMessage.error('获取农户列表失败：' + response.data.msg)
    }
  } catch (error) {
    console.error('获取农户列表出错：', error)
    ElMessage.error('获取农户列表失败，请稍后重试')
  } finally {
    farmerLoading.value = false
  }
}

// 添加区域相关
const showAddZoneDialog = ref(false)
const zoneFormRef = ref(null)
const zoneForm = reactive({
  name: '',
  description: '',
  empId: '', 
  empName: '', 
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
  empId: '', // 修改为 empId
  empName: '', // 新增 empName
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
  ],
  empId: [ // 新增：农户ID校验
    { required: true, message: '请选择区域负责人', trigger: 'change' }
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
    empId: zone.empId || '', // 新增：农户ID
    empName: zone.empName || '', // 新增：农户姓名
    type: zone.type || '', // 确保传递品种名称字符串
    fruitCount: zone.fruitCount || zone.size || '', // 兼容表单和列表字段
    size: zone.size || zone.fruitCount || 0, // 果树总数（areaTree优先用size）
    orchardId: zone.orchardId || '',
    number: zone.number || '', // 区域编号
    trees: zone.trees || [], // 果树列表
    // 移除 manager 字段
    fruitType: zone.type || '', // 新增：对应后端的fruitType
    createTime: zone.createTime || '',
    updateTime: zone.updateTime || '',
    createUser: zone.createUser || 0,
    updateUser: zone.updateUser || 0
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
  editForm.empId = zone.empId || '' // 新增：赋值农户ID
  editForm.empName = zone.empName || '' // 新增：赋值农户姓名
  editForm.type = zone.type // 确保回显品种名称
  editForm.fruitCount = zone.size || ''
  editForm.orchardId = zone.orchardId
  showEditDialog.value = true
  showDetailDialog.value = false
  // 新增：获取农户列表
  getFarmerList(zone.orchardId)
}

// 取消编辑
const cancelEditZone = () => {
  showEditDialog.value = false
  Object.assign(editForm, {
    name: '',
    description: '',
    empId: '', // 新增
    empName: '', // 新增
    type: '',
    fruitCount: '',
    orchardId: ''
  })
  editFormRef.value?.resetFields()
}

// 确认修改区域（适配PUT /api/area接口）
const confirmEditZone = async () => {
  try {
    await editFormRef.value.validate()

    const submitData = {
      createTime: currentZone.createTime || formatTimeWithoutZone(),
      createUser: currentZone.createUser || userStore.user?.id || 0,
      createUserName: currentZone.createUserName || userStore.user?.name || '',
      description: editForm.description,
      empId: Number(editForm.empId), // 确保是数字
      empName: editForm.empName,
      id: currentZone.id,
      name: editForm.name,
      orchardId: currentZone.orchardId,
      fruitCount: Number(editForm.fruitCount),
      type: editForm.type,
      fruitType: editForm.type,
      size: Number(editForm.fruitCount),
      updateTime: formatTimeWithoutZone(),
      updateUser: userStore.user?.id || 0,
      updateUserName: userStore.user?.name || '',
      orchardName: ''
    }

    const response = await axios.put('/api/area', submitData)
    
    if (response.data && response.data.code === 200) {
      ElMessage.success('区域信息修改成功！')
      showEditDialog.value = false
      
      const updatedZone = {
        ...currentZone,
        ...submitData,
        fruitCount: editForm.fruitCount,
        number: props.zoneList.find(z => z.id === currentZone.id)?.number || '',
        // manager: editForm.manager, // 移除这一行
        type: editForm.type
      }
      emitZoneInfo(updatedZone)
      emit('zone-update', {
        type: 'edit',
        data: updatedZone
      })
    } else {
      ElMessage.error('修改失败：' + (response.data?.msg || '未知错误'))
    }
  } catch (error) {
    // ... 错误处理保持不变
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
    empId: '', // 新增
    empName: '', // 新增
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
      createUser: userStore.user?.id ? Number(userStore.user.id) : 0,
      description: zoneForm.description,
      empId: Number(zoneForm.empId), // 新增：农户ID
      empName: zoneForm.empName, // 新增：农户姓名
      id: 0,
      name: zoneForm.name,
      orchardId: Number(zoneForm.orchardId),
      fruitCount: Number(zoneForm.fruitCount),
      type: zoneForm.type,
      updateUser: userStore.user?.id ? Number(userStore.user.id) : 0,
      // 移除 manager 字段
      fruitType: zoneForm.type, // 新增：对应后端的fruitType
      size: Number(zoneForm.fruitCount), // 新增：对应后端的size
      createTime: formatTimeWithoutZone(), // 新增：创建时间（去掉时区）
      updateTime: formatTimeWithoutZone(), // 新增：更新时间（去掉时区）
      createUserName: userStore.user?.name || '', // 新增：创建人姓名
      updateUserName: userStore.user?.name || '', // 新增：更新人姓名
      orchardName: '' // 可根据需要补充
    }

    const response = await axios.post('/api/area', submitData)
    
    // 核心修复：判断code为200（后端实际返回的成功码）
    if (response.data && response.data.code === 200) {
      ElMessage.success('区域添加成功！')
      showAddZoneDialog.value = false
      resetAddZoneForm()
      
      const newZone = {
        ...submitData,
        id: response.data.data?.id || '',
        number: props.zoneList.length + 1,
        trees: [],
        type: zoneForm.type,
        empId: zoneForm.empId, // 新增
        empName: zoneForm.empName // 新增
      }
      emitZoneInfo(newZone)
      emit('zone-update', { type: 'add', data: newZone })
    } else {
      console.log('后端返回数据：', response.data)
      ElMessage.error('添加失败：' + (response.data?.msg || '未知错误'))
    }
  } catch (error) {
    console.error('添加区域失败：', error)
    if (error.response) {
      ElMessage.error(`添加失败（${error.response.status}）：${error.response.data?.msg || '接口调用失败'}`)
    } else {
      ElMessage.error('添加失败，请检查表单或网络')
    }
  }
}

// 删除区域（适配DELETE /api/area/{id}接口）
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
      const response = await axios.delete(`/api/area/${zoneId}`)
      
      // 核心修复：判断code为200
      if (response.data && response.data.code === 200) {
        ElMessage.success('区域删除成功！')
        emit('zone-update', { type: 'delete', id: zoneId })
        emitZoneInfo({})
      } else {
        ElMessage.error('删除失败：' + (response.data?.msg || '未知错误'))
      }
    } catch (error) {
      console.error('删除区域失败详情：', error)
      if (error.response) {
        ElMessage.error(`删除失败（${error.response.status}）：${error.response.data?.msg || '接口调用失败'}`)
      } else {
        ElMessage.error('删除失败，请稍后重试')
      }
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

// 新增：监听果园ID变化，获取农户列表
watch(
  () => zoneForm.orchardId,
  (newVal) => {
    if (newVal) {
      getFarmerList(newVal)
    } else {
      farmerList.value = []
    }
  },
  { immediate: true }
)

// 初始化时同步当前选中区域数据
onMounted(() => {
  if (props.activeAreaId) {
    const selectedZone = props.zoneList.find(zone => zone.id === props.activeAreaId)
    emitZoneInfo(selectedZone)
    // 新增：获取农户列表
    if (selectedZone?.orchardId) {
      getFarmerList(selectedZone.orchardId)
    }
  }
  // 新增：如果有默认果园ID，初始化获取农户列表
  if (zoneForm.orchardId) {
    getFarmerList(zoneForm.orchardId)
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
  background-color: #e1f7ec8c;
  border-left-color: #6ebeb1;
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