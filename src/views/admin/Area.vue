<template>
  <CommonLayout>
    <div class="orchard-zone">
      <!-- 左侧区域列表 -->
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
            @click="selectZone(zone.id)"
          >
            <div class="zone-name">区域{{ zone.number }}：{{ zone.name }}</div>
            <div class="zone-remark">{{ zone.description || '无备注' }}</div>
            <!-- 详情/编辑按钮 -->
            <div class="zone-actions">
              <el-button size="mini" type="text" @click.stop="showZoneDetail(zone)">详情</el-button>
              <el-button size="mini" type="text" @click.stop="showEditZoneDialog(zone)">编辑</el-button>
            </div>
          </div>
        </div>
        <div class="empty-zone" v-else>
          <el-empty description="暂无区域，请先添加"></el-empty>
        </div>
      </div>

      <!-- 右侧操作与展示区 -->
      <div class="zone-main">
        <!-- 未选择区域提示 -->
        <div class="map-container" v-if="!activeAreaId">
          <div class="map-tips">请先选择或添加区域</div>
        </div>
        
        <!-- 选中区域后的果树列表 -->
        <div class="tree-list-container" v-else>
          <div class="zone-info">
            <h3>区域{{ activeZone.number }}：{{ activeZone.name }}</h3>
            <p class="zone-desc">
              负责人：{{ activeZone.manager || '未设置' }} | 品种：{{ activeZone.type }} | 果树总数：{{ activeZone.size }}
            </p>
            <!-- 详情/编辑按钮 -->
            <div class="zone-info-actions">
              <el-button size="small" @click="showZoneDetail(activeZone)">查看详情</el-button>
              <el-button size="small" type="primary" @click="showEditZoneDialog(activeZone)">编辑信息</el-button>
            </div>
          </div>
          
          <el-table 
            :data="sortedTreeList" 
            border 
            stripe 
            style="width: 100%; margin-top: 20px"
            :header-cell-style="{ backgroundColor: '#f8f9fa' }"
          >
            <el-table-column 
              label="果树编号" 
              width="120" 
            >
              <template #default="scope">
                {{ scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column 
              label="成熟度" 
              width="120"
            >
              <template #default="scope">
                <el-tag 
                  size="small" 
                  :type="getRipeDegreeTagType(scope.row.ripeDegree)"
                >
                  {{ formatRipeDegree(scope.row.ripeDegree) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column 
              label="健康状态" 
              width="120"
            >
              <template #default="scope">
                <el-tag 
                  size="small" 
                  :type="scope.row.healthCondition === '健康' ? 'success' : (scope.row.healthCondition === '异常' ? 'danger' : 'warning')"
                >
                  {{ scope.row.healthCondition || '未知' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column 
              label="二维码" 
              width="100"
            >
              <template #default="scope">
                <div class="qrcode-container" v-if="scope.row.img">
                  <el-image 
                    :src="`/minio/preview/${scope.row.img}`" 
                    fit="contain"
                    class="qrcode-img"
                    preview-src-list="[]"
                  >
                    <template #error>
                      <div class="image-slot">图片加载失败</div>
                    </template>
                  </el-image>
                </div>
                <span class="no-qrcode" v-else>暂无</span>
              </template>
            </el-table-column>
            <el-table-column 
              label="操作" 
              width="180"
            >
              <template #default="scope">
                <el-button 
                  size="small" 
                  type="text"
                  @click="showTreeDetail(scope.row)"
                >
                  查看详情
                </el-button>
                <el-button 
                  size="small" 
                  type="text"
                  text-color="danger"
                  @click="handleDeleteTree(scope.row.id)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 批量生成二维码按钮 -->
          <div style="margin-top: 20px; text-align: right">
            <el-button 
              type="primary"
            >
              批量生成二维码
            </el-button>
          </div>
        </div>
      </div>
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
        <el-button type="primary" @click="showEditZoneDialog(currentZone)">编辑信息</el-button>
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

    <!-- 果树详情弹窗 -->
    <el-dialog 
      v-model="showTreeDetailDialog" 
      title="果树详情" 
      width="600px"
      center
      :close-on-click-modal="false"
    >
      <div class="tree-detail-content">
        <el-descriptions 
          title="果树基础信息" 
          :column="1" 
          border 
        >
          <el-descriptions-item label="果树ID">
            {{ currentTree.id }}
          </el-descriptions-item>
          <el-descriptions-item label="果树品种">
            {{ currentTree.type || activeZone.type }}
          </el-descriptions-item>
          <el-descriptions-item label="成熟度">
            <el-tag :type="getRipeDegreeTagType(currentTree.ripeDegree)">
              {{ formatRipeDegree(currentTree.ripeDegree) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="健康状态">
            <el-tag :type="currentTree.healthCondition === '健康' ? 'success' : (currentTree.healthCondition === '异常' ? 'danger' : 'warning')">
              {{ currentTree.healthCondition || '未知' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="果实数量">
            {{ currentTree.countNum || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="成熟果实数量">
            {{ currentTree.ripeNum || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="二维码">
            <div v-if="currentTree.img" style="display: flex; align-items: center">
              <el-image 
                :src="`/minio/preview/${currentTree.img}`" 
                style="width: 80px; height: 80px"
                fit="contain"
              />
              <span style="margin-left: 10px">点击查看大图</span>
            </div>
            <span v-else>暂无二维码</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showTreeDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </CommonLayout>
</template>

<script setup>
import CommonLayout from '@/views/common/CommonLayout.vue'
import { Plus } from '@element-plus/icons-vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
// 正确导入Pinia用户仓库
import { useUserStore } from '@/stores/modules/user.js'

// 初始化用户仓库
const userStore = useUserStore()

// 区域列表数据
const zoneList = ref([])
// 当前激活的区域ID
const activeAreaId = ref('')

// 添加区域相关
const showAddZoneDialog = ref(false)
const zoneFormRef = ref(null)
const zoneForm = reactive({
  name: '',
  description: '',
  manager: '',
  type: '',
  fruitCount: '',
  // 强制转为数字类型，避免字符串传参
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

// 果树详情相关
const showTreeDetailDialog = ref(false)
const currentTree = reactive({})

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

// 当前激活的区域
const activeZone = computed(() => {
  return zoneList.value.find(zone => zone.id === activeAreaId.value) || { trees: [], number: '', name: '', type: '', size: 0 }
})

// 排序后的果树列表
const sortedTreeList = computed(() => {
  return [...(activeZone.trees || [])]
})

// 格式化成熟度显示
const formatRipeDegree = (degree) => {
  if (degree === 'NaN' || !degree) return '未知'
  const numDegree = Number(degree)
  if (numDegree === 0) return '未成熟'
  if (numDegree > 0 && numDegree < 100) return `${numDegree}%`
  if (numDegree >= 100) return '已成熟'
  return '未知'
}

// 获取成熟度标签类型
const getRipeDegreeTagType = (degree) => {
  if (degree === 'NaN' || !degree) return 'warning'
  const numDegree = Number(degree)
  if (numDegree === 0) return 'info'
  if (numDegree > 0 && numDegree < 100) return 'primary'
  if (numDegree >= 100) return 'success'
  return 'warning'
}

// 初始化：获取所有区域列表（核心修复：参数类型+错误日志）
const getZoneList = async () => {
  try {
    // 1. 校验并转换果园ID为数字
    const currentOrchardId = userStore.user?.orchardId ? Number(userStore.user.orchardId) : 0
    console.log('获取区域列表 - 果园ID：', currentOrchardId, '类型：', typeof currentOrchardId)
    
    if (currentOrchardId <= 0) {
      ElMessage.warning('当前用户未绑定有效果园ID（需大于0），请先配置')
      zoneList.value = []
      return
    }

    // 2. 发送请求（确保参数是数字类型）
    const response = await axios.get('/api/area/selectByOrchardId', {
      params: { 
        orchardId: currentOrchardId  // 强制数字类型
      },
      // 显式指定请求头，避免后端解析异常
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 3. 处理响应
    if (response.data && response.data.code === 200) {
      zoneList.value = (response.data.data || []).map((zone, index) => ({
        ...zone,
        number: index + 1,
        trees: []
      }))
      ElMessage.success('区域列表加载成功')
    } else {
      ElMessage.error(`获取区域列表失败：${response.data?.msg || '后端返回非200状态码'}`)
      zoneList.value = []
    }
  } catch (error) {
    // 4. 详细错误日志，方便排查
    console.error('获取区域列表失败详情：', {
      url: error.config?.url,
      params: error.config?.params,
      status: error.response?.status,
      responseData: error.response?.data
    })
    ElMessage.error(`获取区域列表失败（${error.response?.status || '网络错误'}）：${error.response?.data?.msg || '请检查参数或后端接口'}`)
    zoneList.value = []
  }
}

// 获取指定区域的果树列表
const getTreeList = async (areaId) => {
  try {
    const response = await axios.get(`/api/fruitTree/area/${areaId}`)
    if (response.data && response.data.code === 200) {
      const index = zoneList.value.findIndex(zone => zone.id === areaId)
      if (index > -1) {
        zoneList.value[index].trees = response.data.data || []
      }
    } else {
      ElMessage.error('获取果树列表失败：' + (response.data?.msg || '未知错误'))
    }
  } catch (error) {
    console.error('获取果树列表失败：', error)
    ElMessage.error('获取果树列表失败，请稍后重试')
  }
}

// 选择区域
const selectZone = (areaId) => {
  activeAreaId.value = areaId
  getTreeList(areaId)
}

// 查看区域详情
const showZoneDetail = (zone) => {
  Object.assign(currentZone, JSON.parse(JSON.stringify(zone)))
  showDetailDialog.value = true
}

// 显示编辑弹窗
const showEditZoneDialog = (zone) => {
  Object.assign(currentZone, JSON.parse(JSON.stringify(zone)))
  editForm.name = zone.name
  editForm.description = zone.description || ''
  editForm.manager = zone.manager || ''
  editForm.type = zone.type
  editForm.fruitCount = zone.size || ''
  editForm.orchardId = zone.orchardId
  showEditDialog.value = true
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
      type: editForm.type
    }

    // 注释掉的接口调用需根据实际后端接口开启
    // const response = await axios.put('/api/area/edit', submitData)
    // if (response.data.code === 200) {
      const index = zoneList.value.findIndex(zone => zone.id === currentZone.id)
      if (index > -1) {
        zoneList.value[index] = {
          ...zoneList.value[index],
          name: editForm.name,
          description: editForm.description,
          manager: editForm.manager,
          type: editForm.type,
          size: Number(editForm.fruitCount)
        }
        getTreeList(currentZone.id)
      }

      ElMessage.success('区域信息修改成功！')
      showEditDialog.value = false
      activeAreaId.value = currentZone.id
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

// 确认添加区域（修复：添加成功后强制传数字ID重新获取列表）
const confirmAddZone = async () => {
  try {
    await zoneFormRef.value.validate()

    const submitData = {
      description: zoneForm.description,
      empId: userStore.user?.id ? Number(userStore.user.id) : 0,
      fruitCount: Number(zoneForm.fruitCount),
      name: zoneForm.name,
      orchardId: Number(zoneForm.orchardId), // 强制数字
      type: zoneForm.type
    }

    const response = await axios.post('/api/area', submitData)
    
    if (response.data && response.data.code === 200) {
      ElMessage.success('区域添加成功！')
      showAddZoneDialog.value = false
      resetAddZoneForm()
      
      // 修复：添加成功后，强制用数字类型的果园ID重新获取列表
      await getZoneList()
      
      if (zoneList.value.length > 0) {
        activeAreaId.value = zoneList.value[zoneList.value.length - 1].id
        getTreeList(activeAreaId.value)
      }
    } else {
      console.log('后端返回数据：', response.data)
      ElMessage.error('添加失败：' + (response.data?.msg || '未知错误'))
    }
  } catch (error) {
    console.error('添加区域失败：', error)
    ElMessage.error('添加失败，请检查表单或网络')
  }
}

// 查看果树详情
const showTreeDetail = (tree) => {
  Object.assign(currentTree, JSON.parse(JSON.stringify(tree)))
  showTreeDetailDialog.value = true
}

// 删除果树
const handleDeleteTree = (treeId) => {
  ElMessageBox.confirm(
    '确定要删除该果树吗？删除后编号会自动重新排序',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    const zoneIndex = zoneList.value.findIndex(zone => zone.id === activeAreaId.value)
    if (zoneIndex > -1) {
      zoneList.value[zoneIndex].trees = zoneList.value[zoneIndex].trees.filter(tree => tree.id !== treeId)
      ElMessage.success('果树删除成功！')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 初始化
onMounted(() => {
  try {
    console.log('初始化 - 用户信息：', userStore.user)
    console.log('初始化 - 果园ID（原始）：', userStore.user?.orchardId, '类型：', typeof userStore.user?.orchardId)
    getZoneList()
  } catch (error) {
    console.error('初始化失败：', error)
    zoneList.value = []
  }
})
</script>

<style scoped>
.orchard-zone {
  display: flex;
  gap: 20px;
  padding: 20px;
  height: calc(100vh - 140px);
  box-sizing: border-box;
  background-color: #ffffff;
}

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

.zone-main {
  flex: 1;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  background-color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.map-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.map-tips {
  color: #999;
  font-size: 16px;
}

.tree-list-container {
  flex: 1;
  overflow: auto;
}

.zone-info {
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zone-info h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.zone-desc {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 14px;
}

.zone-detail-content {
  padding: 10px 0;
}

/* 果树详情样式 */
.tree-detail-content {
  padding: 10px 0;
}

/* 二维码样式 */
.qrcode-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.qrcode-img {
  width: 60px;
  height: 60px;
  border-radius: 4px;
}

.no-qrcode {
  color: #999;
  font-size: 12px;
}

.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  color: #999;
  font-size: 10px;
  background-color: #f5f7fa;
}
</style>