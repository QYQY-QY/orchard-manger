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
        @zone-info-change="handleZoneInfoChange"
      />
      <!-- 第二个组件：果树列表（areaTree.vue） -->
      <AreaTree 
        :active-area-id="activeAreaId"
        :active-zone="activeZone"
        :tree-list="activeZone.trees"
        :full-zone-info="currentZoneForm" 
        @tree-delete="handleTreeDelete"
        @zone-detail="showZoneDetail"
        @tree-list-update="handTreeUpdate" 
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useUserStore } from '@/stores/modules/user.js'

// 3. 定义响应式数据
const loading = ref(false); // 加载状态
const zoneList = ref([]);   // 区域列表数据
const activeAreaId = ref(''); // 当前选中的区域ID

// 核心修复1：改用 reactive 定义（对象响应式更稳定）
const currentZoneForm = reactive({
  id: '',
  name: '',
  description: '',
  manager: '',
  type: '',
  fruitCount: '',
  size: 0, // 新增：和areaTree的size字段对齐
  orchardId: '',
  number: ''
});

// 筛选初始化数据（保留，如需筛选功能可使用）
const initFilterData = reactive({
  areaName: '',
  areaCode: '',
  status: ''
});

// 当前激活的区域（计算属性）
const activeZone = computed(() => {
  const foundZone = zoneList.value.find(zone => zone.id === activeAreaId.value)
  // 核心修复2：合并currentZoneForm的最新数据（优先级更高）
  const baseZone = foundZone || { 
    id: '',
    trees: [], 
    number: '', 
    name: '', 
    type: '', 
    size: 0,
    manager: '' // 补充默认值
  };
  // 优先用currentZoneForm的最新数据，兜底用zoneList中的数据
  return {
    ...baseZone,
    manager: currentZoneForm.manager || baseZone.manager,
    type: currentZoneForm.type || baseZone.type,
    size: currentZoneForm.size || currentZoneForm.fruitCount || baseZone.size,
    number: currentZoneForm.number || baseZone.number
  };
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

// 核心修复3：修改数据接收逻辑（不替换对象，只更新属性）
const handleZoneInfoChange = (zoneFormData) => {
  console.log('接收子组件zoneForm数据：', zoneFormData);
  if (!zoneFormData || !zoneFormData.id) {
    // 清空数据（如删除区域后）
    Object.assign(currentZoneForm, {
      id: '',
      name: '',
      description: '',
      manager: '',
      type: '',
      fruitCount: '',
      size: 0,
      orchardId: '',
      number: ''
    });
    return;
  }

  // 关键：逐个更新属性（保持响应式关联）
  currentZoneForm.id = zoneFormData.id || '';
  currentZoneForm.name = zoneFormData.name || '';
  currentZoneForm.description = zoneFormData.description || '';
  currentZoneForm.manager = zoneFormData.manager || '';
  currentZoneForm.type = zoneFormData.type || '';
  currentZoneForm.fruitCount = zoneFormData.fruitCount || zoneFormData.size || '';
  currentZoneForm.size = Number(zoneFormData.size || zoneFormData.fruitCount || 0); // 转为数字
  currentZoneForm.orchardId = zoneFormData.orchardId || '';
  
  // 修复：number字段兜底逻辑
  const zoneInList = zoneList.value.find(zone => zone.id === zoneFormData.id);
  currentZoneForm.number = zoneFormData.number || zoneInList?.number || '';

  console.log('更新后的currentZoneForm：', currentZoneForm); // 调试日志
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
        // 核心修复4：编辑后同步更新currentZoneForm
        handleZoneInfoChange(zoneList.value[editIndex]);
        await getTreeList(action.data.id)
      }
      break
    case 'delete':
      zoneList.value = zoneList.value.filter(zone => zone.id !== action.id)
      if (activeAreaId.value === action.id) {
        activeAreaId.value = ''
        // 删除后清空当前区域表单数据
        handleZoneInfoChange({}); // 调用统一的清空逻辑
      }
      break
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
        console.log('果树列表加载成功：', zoneList.value[index].trees)
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
  }
}

// 获取所有区域列表
const getZoneList = async () => {
  try {
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

// 处理果树删除
const handleTreeDelete = (treeId) => {
  const zoneIndex = zoneList.value.findIndex(zone => zone.id === activeAreaId.value)
  if (zoneIndex > -1) {
    zoneList.value[zoneIndex].trees = zoneList.value[zoneIndex].trees.filter(tree => tree.id !== treeId)
    // 同步更新currentZoneForm的果树数量
    currentZoneForm.size = zoneList.value[zoneIndex].trees.length;
    
    // 额外：删除后同步到后端（可选，确保持久化）
    saveTreeListToBackend(activeAreaId.value, zoneList.value[zoneIndex].trees);
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

// 新增：保存果树列表到后端（二维码持久化核心）
const saveTreeListToBackend = async (areaId, treeList) => {
  try {
    await axios.post('/api/fruitTree/saveTreeList', {
      areaId: areaId,
      trees: treeList
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('果树列表（含二维码）已同步到后端');
  } catch (error) {
    console.error('保存果树列表到后端失败：', error);
    ElMessage.warning('二维码已本地更新，但同步到服务器失败，请稍后重试');
  }
};

// 处理子组件传来的果树列表更新（二维码生成后）
// 保留你原来的拼写：handTreeUpdate（不修改）
const handTreeUpdate = async (areaId, newTreeList) => { 
  console.log('收到子组件的果树列表更新：', areaId, newTreeList) // 调试用
  
  // 找到当前区域在zoneList中的索引
  const zoneIndex = zoneList.value.findIndex(zone => zone.id === areaId)
  if (zoneIndex > -1) {
    // 关键：替换该区域的trees数组，触发Vue响应式更新
    zoneList.value[zoneIndex].trees = [...newTreeList]
    // 同步更新currentZoneForm的果树数量
    currentZoneForm.size = newTreeList.length;
    
    // 核心新增：将更新后的列表（含二维码）保存到后端，实现持久化
    await saveTreeListToBackend(areaId, newTreeList);
    
    ElMessage.success('果树二维码已更新并保存！')
  } else {
    ElMessage.warning('未找到对应区域，更新失败')
  }
}

// 删除操作（兼容原有方法名，可根据需求扩展）
const handleDelete = (id) => {
  console.log('删除区域ID：', id);
  // 可对接编辑逻辑
};

// 核心修复5：监听activeAreaId变化，自动同步currentZoneForm
watch(
  () => activeAreaId.value,
  (newId) => {
    if (newId) {
      const zoneInList = zoneList.value.find(zone => zone.id === newId);
      if (zoneInList) {
        handleZoneInfoChange(zoneInList); // 复用接收逻辑
      }
    } else {
      handleZoneInfoChange({}); // 清空
    }
  },
  { immediate: true }
);

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
</style>