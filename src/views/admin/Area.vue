<template>
  <!-- 公共布局组件 -->
  <CommonLayout>
    <!-- 布局内部嵌入业务组件 -->
    <div class="area-container">
      <!-- 第一个组件：区域管理（areaAdd.vue） -->
      <AreaAdd 
        :zone-list="zoneList"
        :active-area-id="activeAreaId"
        @zone-select="handleZoneSelect"
        @zone-update="handleZoneUpdate"
        @zone-detail="showZoneDetail"
      />
      <!-- 第二个组件：果树列表（areaTree.vue） -->
      <AreaTree 
        :active-area-id="activeAreaId"
        :active-zone="activeZone"
        :tree-list="activeZone.trees"
        :fullZoneInfo="activeZone" 
        @tree-delete="handleTreeDelete"
        @zone-detail="showZoneDetail"
        @tree-list-update="handleTreeListUpdate"  
      />
    </div>
  </CommonLayout>
</template>

<script setup>
// 1. 引入需要的组件（修复默认导出问题的写法）
import { default as CommonLayout } from '@/views/common/CommonLayout.vue'
import { default as AreaAdd } from '@/components/admin/areaAdd.vue'
import { default as AreaTree } from '@/components/admin/areaTree.vue'

// 2. 引入Vue相关API
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useUserStore } from '@/stores/modules/user.js'

// 3. 定义响应式数据
const loading = ref(false); // 加载状态
const zoneList = ref([]);   // 区域列表数据
const activeAreaId = ref(''); // 当前选中的区域ID

// 筛选初始化数据（保留，如需筛选功能可使用）
const initFilterData = reactive({
  areaName: '',
  areaCode: '',
  status: ''
});

// 当前激活的区域（计算属性）
const activeZone = computed(() => {
  return zoneList.value.find(zone => zone.id === activeAreaId.value) || { 
    id: '',
    trees: [], 
    number: '', 
    name: '', 
    type: '', 
    size: 0,
    manager: '',
    fruitCount: ''
  }
});

// 初始化用户仓库
const userStore = useUserStore()

// 4. 定义方法
// 筛选搜索（保留，可根据实际需求对接接口）
const handleSearch = (params) => {
  loading.value = true;
  // 模拟接口请求
  setTimeout(() => {
    // 替换为真实接口逻辑
    loading.value = false;
  }, 500);
};

// 选择区域
const handleZoneSelect = (areaId) => {
  activeAreaId.value = areaId
  getTreeList(areaId)
}

// 处理区域更新（添加/编辑/删除）
const handleZoneUpdate = async (action) => {
  switch (action.type) {
    case 'add':
      await getZoneList()
      // 选中新增区域
      if (zoneList.value.length > 0) {
        const newZoneId = zoneList.value[zoneList.value.length - 1].id
        activeAreaId.value = newZoneId
        await getTreeList(newZoneId)
      }
      break
    case 'edit':
      const editIndex = zoneList.value.findIndex(zone => zone.id === action.data.id)
      if (editIndex > -1) {
        zoneList.value[editIndex] = {
          ...zoneList.value[editIndex],
          ...action.data
        }
        await getTreeList(action.data.id)
      }
      break
    case 'delete':
      zoneList.value = zoneList.value.filter(zone => zone.id !== action.id)
      if (activeAreaId.value === action.id) {
        activeAreaId.value = ''
      }
      break
  }
}

// 核心修复：处理子组件传递的果树列表更新（适配url字段）
const handleTreeListUpdate = async (areaId, newTreeList) => {
  try {
    console.log('★ 接收子组件果树列表更新 ★', {
      areaId,
      newTreeList,
      // 修正：检查url字段
      二维码字段检查: newTreeList.map(t => ({ id: t.id, url: t.url }))
    })

    // 1. 找到对应区域的索引
    const zoneIndex = zoneList.value.findIndex(zone => zone.id === areaId)
    if (zoneIndex === -1) {
      ElMessage.warning('未找到对应区域，更新失败')
      return
    }

    // 2. 完整替换果树列表，保留所有字段（核心：不要过滤/解构字段）
    zoneList.value[zoneIndex].trees = [...newTreeList]
    
    // 3. 强制触发响应式更新，确保子组件能实时获取最新数据
    await nextTick()
    
    // 4. 可选：持久化更新到后端（如需保存到数据库）
    // await axios.post('/api/fruitTree/saveTreeList', { areaId, trees: newTreeList })
    
    console.log('✅ 果树列表更新成功', zoneList.value[zoneIndex].trees)
    ElMessage.success(`成功更新 ${newTreeList.length} 条果树数据`)
  } catch (error) {
    console.error('❌ 果树列表更新失败', error)
    ElMessage.error('果树列表更新失败：' + error.message)
  }
}

// 获取指定区域的果树列表
const getTreeList = async (areaId) => {
  try {
    loading.value = true
    const response = await axios.get(`/api/fruitTree/area/${areaId}`)
    if (response.data && response.data.code === 200) {
      const index = zoneList.value.findIndex(zone => zone.id === areaId)
      if (index > -1) {
        // 保留原始返回的所有字段，重点：二维码字段是url
        zoneList.value[index].trees = response.data.data || []
        console.log('果树列表加载成功：', {
          areaId,
          数据: zoneList.value[index].trees,
          // 修正：打印url字段（后端返回的二维码地址）
          二维码字段: zoneList.value[index].trees.map(t => ({ id: t.id, url: t.url }))
        })
      }
    } else {
      const index = zoneList.value.findIndex(zone => zone.id === areaId)
      if (index > -1) {
        zoneList.value[index].trees = []
      }
      ElMessage.error('获取果树列表失败：' + (response.data?.msg || '未知错误'))
    }
  } catch (error) {
    const index = zoneList.value.findIndex(zone => zone.id === areaId)
    if (index > -1) {
      zoneList.value[index].trees = []
    }
    console.error('获取果树列表失败：', error)
    ElMessage.error('获取果树列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
// 获取所有区域列表
const getZoneList = async () => {
  try {
    loading.value = true
    const currentOrchardId = userStore.user?.orchardId ? Number(userStore.user.orchardId) : 0
    console.log('获取区域列表 - 果园ID：', currentOrchardId, '类型：', typeof currentOrchardId)
    
    if (currentOrchardId <= 0) {
      ElMessage.warning('当前用户未绑定有效果园ID（需大于0），请先配置')
      zoneList.value = []
      return
    }

    const response = await axios.get('/api/area/selectByOrchardId', {
      params: { orchardId: currentOrchardId },
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.data && response.data.code === 200) {
      // 保留原始区域数据，补充默认字段，避免解构丢失
      zoneList.value = (response.data.data || []).map((zone, index) => ({
        ...zone, // 保留所有原始字段
        number: index + 1,
        trees: [], // 初始化果树列表
        size: zone.size || 0,
        manager: zone.manager || '',
        fruitCount: zone.fruitCount || ''
      }))
      console.log('区域列表加载成功：', zoneList.value)
      ElMessage.success('区域列表加载成功')
    } else {
      ElMessage.error(`获取区域列表失败：${response.data?.msg || '后端返回非200状态码'}`)
      zoneList.value = []
    }
  } catch (error) {
    console.error('获取区域列表失败详情：', {
      url: error.config?.url,
      params: error.config?.params,
      status: error.response?.status,
      responseData: error.response?.data
    })
    ElMessage.error(`获取区域列表失败（${error.response?.status || '网络错误'}）：${error.response?.data?.msg || '请检查参数或后端接口'}`)
    zoneList.value = []
  } finally {
    loading.value = false
  }
}

// 处理果树删除
const handleTreeDelete = (treeId) => {
  try {
    const zoneIndex = zoneList.value.findIndex(zone => zone.id === activeAreaId.value)
    if (zoneIndex > -1) {
      // 过滤删除指定果树，保留其他字段
      zoneList.value[zoneIndex].trees = zoneList.value[zoneIndex].trees.filter(tree => tree.id !== treeId)
      console.log('删除果树成功', { treeId, 剩余果树: zoneList.value[zoneIndex].trees })
    }
  } catch (error) {
    console.error('删除果树失败', error)
    ElMessage.error('删除果树失败：' + error.message)
  }
}

// 查看区域详情
const showZoneDetail = (zone) => {
  console.log('查看区域详情：', zone)
}

// 编辑操作（兼容原有方法名，可根据需求扩展）
const handleEdit = (row) => {
  console.log('编辑区域：', row);
  // 可对接编辑逻辑
};

// 删除操作（兼容原有方法名，可根据需求扩展）
const handleDelete = (id) => {
  console.log('删除区域ID：', id);
  // 可对接删除逻辑
};

// 5. 生命周期：页面初始化加载数据
onMounted(() => {
  try {
    console.log('初始化 - 用户信息：', userStore.user)
    console.log('初始化 - 果园ID（原始）：', userStore.user?.orchardId, '类型：', typeof userStore.user?.orchardId)
    getZoneList() // 初始化加载区域列表
    handleSearch(initFilterData); // 初始化筛选（如需）
  } catch (error) {
    console.error('初始化失败：', error)
    zoneList.value = []
  }
});
</script>

<style scoped>
.area-container {
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  gap: 20px;
  height: calc(100vh - 140px);
  box-sizing: border-box;
  background-color: #ffffff;
}

.area-container :deep(.area-filter) {
  margin-bottom: 20px;
}

/* 核心修改：拆分两个组件的宽度，替换原有flex:1的统一样式 */
/* 左侧添加区域：窄栏（28%宽度 + 红框） */
.area-container > div:first-child {
  width: 24%; /* 可微调：25%/30%，匹配你要的红框宽度 */
  overflow: auto;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  padding: 10px;
  
}

/* 右侧果树列表：宽栏（占剩余所有宽度 + 红框） */
.area-container > div:last-child {
  flex: 1; /* 自动占剩余宽度 */
  overflow: auto;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  padding: 10px;
  
}
</style>