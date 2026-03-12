<template>
  <CommonLayout>
    <div class="orchard-manage">
      <!-- 子组件1：添加果园 & 果园列表 -->
      <OrchardAdd
        :orchard-list="orchardList"
        :active-orchard-id="activeOrchardId"
        @orchard-select="handleOrchardSelect"
        @orchard-update="handleOrchardUpdate"
      />

      <!-- 子组件2：果园区域列表 -->
      <OrchardArea
        :orchard-id="activeOrchardId"
        :active-orchard="activeOrchard"
        :area-list="activeOrchard.areas"
        :active-area-id="activeAreaId"
        @area-select="handleAreaSelect"
        @area-update="handleAreaUpdate"
      />

      <!-- 子组件3：区域果树详情 -->
      <OrchardTree
        :area-id="activeAreaId"
        :active-area="activeArea"
        :tree-list="activeArea.trees"
        @tree-detail="showTreeDetail"
      />
    </div>
  </CommonLayout>
</template>

<script setup>
import { default as CommonLayout } from '@/views/common/CommonLayout.vue'
import { default as OrchardAdd } from '@/components/superAdmin/OrchardAdd.vue'
import { default as OrchardArea } from '@/components/superAdmin/OrchardArea.vue'
import { default as OrchardTree } from '@/components/superAdmin/OrchardTree.vue'

import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useUserStore } from '@/stores/modules/user.js'

// 响应式数据
const loading = ref(false)
const orchardList = ref([])
const activeOrchardId = ref('')
const activeAreaId = ref('')

// 当前激活的果园（计算属性）
const activeOrchard = computed(() => {
  return orchardList.value.find(o => o.id === activeOrchardId.value) || {
    id: '',
    name: '',
    address: '',
    manager: '',
    areas: []
  }
})

// 当前激活的区域（计算属性）
const activeArea = computed(() => {
  return activeOrchard.value.areas.find(a => a.id === activeAreaId.value) || {
    id: '',
    name: '',
    manager: '',
    cropType: '',
    totalTrees: 0,
    trees: []
  }
})

// 初始化用户仓库
const userStore = useUserStore()

// 选择果园
const handleOrchardSelect = async (orchardId) => {
  activeOrchardId.value = orchardId
  activeAreaId.value = ''
  await getAreaList(orchardId)
}

// 选择区域
const handleAreaSelect = (areaId) => {
  activeAreaId.value = areaId
  getTreeList(areaId)
}

// 果园更新（增/改/删）
const handleOrchardUpdate = async (action) => {
  switch (action.type) {
    case 'add':
      await getOrchardList()  // 👈 添加这行
      if (orchardList.value.length > 0) {
        const newId = orchardList.value[orchardList.value.length - 1].id
        activeOrchardId.value = newId
        await getAreaList(newId)
      }
      break
    case 'edit':
      await getOrchardList()  // 👈 添加这行
      const editIdx = orchardList.value.findIndex(o => o.id === action.data.id)
      if (editIdx > -1) {
        orchardList.value[editIdx] = { ...orchardList.value[editIdx], ...action.data }
      }
      break
    case 'delete':
      await getOrchardList()  // 👈 添加这行
      orchardList.value = orchardList.value.filter(o => o.id !== action.id)
      if (activeOrchardId.value === action.id) {
        activeOrchardId.value = ''
        activeAreaId.value = ''
      }
      break
  }
}

// 区域更新（增/改/删）
const handleAreaUpdate = async (action) => {
  const orchardIdx = orchardList.value.findIndex(o => o.id === activeOrchardId.value)
  if (orchardIdx === -1) return

  switch (action.type) {
    case 'add':
      await getAreaList(activeOrchardId.value)
      if (orchardList.value[orchardIdx].areas.length > 0) {
        const newAreaId = orchardList.value[orchardIdx].areas[orchardList.value[orchardIdx].areas.length - 1].id
        activeAreaId.value = newAreaId
        await getTreeList(newAreaId)
      }
      break
    case 'edit':
      const editIdx = orchardList.value[orchardIdx].areas.findIndex(a => a.id === action.data.id)
      if (editIdx > -1) {
        orchardList.value[orchardIdx].areas[editIdx] = { ...orchardList.value[orchardIdx].areas[editIdx], ...action.data }
      }
      break
    case 'delete':
      orchardList.value[orchardIdx].areas = orchardList.value[orchardIdx].areas.filter(a => a.id !== action.id)
      if (activeAreaId.value === action.id) {
        activeAreaId.value = ''
      }
      break
  }
}

// 获取果园列表 - 通用版本
const getOrchardList = async () => {
  try {
    loading.value = true
    const empId = userStore.user?.id || userStore.user?.empId
    
    console.log('请求参数:', { empId })
    
    const res = await axios.post('/api/orchard/list' , {})
    
    console.log('完整响应:', res)
    console.log('响应数据:', res.data)
    
    if (res.data?.code === 200) {
      const responseData = res.data.data
      let dataArray = []
      
      // 判断数据结构并提取数组
      if (responseData) {
        if (Array.isArray(responseData)) {
          // 直接是数组
          dataArray = responseData
        } else if (responseData.records && Array.isArray(responseData.records)) {
          // 分页对象：{ records: [], total: 0, ... }
          dataArray = responseData.records
          console.log('分页信息:', {
            total: responseData.total,
            size: responseData.size,
            current: responseData.current,
            pages: responseData.pages
          })
        } else if (responseData.list && Array.isArray(responseData.list)) {
          // 另一种分页格式：{ list: [], total: 0 }
          dataArray = responseData.list
        } else if (responseData.data && Array.isArray(responseData.data)) {
          // 嵌套数据：{ data: [] }
          dataArray = responseData.data
        } else if (typeof responseData === 'object') {
          // 如果是单个对象，转换为数组
          console.warn('返回的是单个对象，将包装为数组')
          dataArray = [responseData]
        }
      }
      
      // 处理数据，确保每个果园都有 areas 数组
      orchardList.value = dataArray.map(o => ({
        ...o,
        areas: o.areas || [] // 如果已有areas则保留，否则初始化为空数组
      }))
      
      ElMessage.success(`加载了 ${orchardList.value.length} 个果园`)
      
      // 如果列表不为空，默认选中第一个
      if (orchardList.value.length > 0 && !activeOrchardId.value) {
        activeOrchardId.value = orchardList.value[0].id
      }
      
    } else {
      ElMessage.error(res.data?.msg || '获取果园列表失败')
    }
  } catch (err) {
    console.error('获取果园列表错误:', err)
    if (err.response) {
      ElMessage.error(`服务器错误: ${err.response.status}`)
    } else if (err.request) {
      ElMessage.error('服务器无响应，请检查后端服务')
    } else {
      ElMessage.error('请求失败: ' + err.message)
    }
  } finally {
    loading.value = false
  }
}
// 新增：获取果园区域列表
const getAreaList = async () => {
  try {
    const orchardId = userStore.user.orchardId || 1
    const res = await axios.get('/api/area/selectByOrchardId', {
      params: { orchardId: orchardId }
    })
    if (res.data.code === 200) {
      const orchardIdx = orchardList.value.findIndex(o => o.id === activeOrchardId.value)
      if (orchardIdx > -1) {
        orchardList.value[orchardIdx].areas = res.data.data || []
      }
    } else {
      ElMessage.error('获取招聘地点列表失败：' + res.data.msg)
    }
  } catch (err) {
    ElMessage.error('获取招聘地点列表失败，请检查网络')
    console.error(err)
  }
}

// 获取区域下的果树列表
const getTreeList = async (areaId) => {
  try {
    loading.value = true
    const res = await axios.get(`/api/fruitTree/area/${areaId}`)
    if (res.data?.code === 200) {
      const orchardIdx = orchardList.value.findIndex(o => o.id === activeOrchardId.value)
      if (orchardIdx > -1) {
        const areaIdx = orchardList.value[orchardIdx].areas.findIndex(a => a.id === areaId)
        if (areaIdx > -1) {
          orchardList.value[orchardIdx].areas[areaIdx].trees = res.data.data || []
        }
      }
    } else {
      ElMessage.error('获取果树列表失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

// 查看果树详情
const showTreeDetail = (tree) => {
  console.log('查看果树详情：', tree)
}

onMounted(() => {
  getOrchardList()
})
</script>
<!-- 父组件 Orchard.vue 的 style 部分新增 -->
<style scoped>
/* 原有样式保留，新增全局圆角变量和基础美化 */
.orchard-manage {
  display: flex;
  gap: 0;
  padding: 16px;
  height: calc(100vh - 140px);
  box-sizing: border-box;
  background: #ffffff;
}

.orchard-manage > div {
  height: 100%;
  border-radius: 8px; /* 统一圆角，更圆润 */
  box-shadow: 0 1px 3px rgba(0,0,0,0.05); /* 轻微阴影，提升层次感 */
  overflow: hidden;
  border: none;
  display: flex;
  flex-direction: column;
  margin: 0 4px; /* 细微间距，避免阴影重叠 */
}

/* 子组件1：添加果园（左侧） */
.orchard-manage > div:nth-child(1) {
  width: 20%;
  border-right: none; /* 去掉分隔线，用间距+阴影区分 */
}

/* 子组件2：果园区域（中间） */
.orchard-manage > div:nth-child(2) {
  width: 25%;
  border-right: none;
}

/* 子组件3：区域果树（右侧） */
.orchard-manage > div:nth-child(3) {
  flex: 1;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .orchard-manage {
    flex-direction: column;
    height: auto;
  }
  .orchard-manage > div {
    width: 100%;
    height: 400px;
    border-right: none;
    border-bottom: none;
    margin-bottom: 16px;
  }
}
</style>