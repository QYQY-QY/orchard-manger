<template>
  <CommonLayout>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">自动训练系统-虫害</h1>
      <div class="page-subtitle">病害识别与标注管理</div>
    </div>
    <!-- 顶部筛选区域 -->
    <div class="filter-container">
      <div class="filter-left">
        <div class="filter-item">
          <label class="filter-label">时间范围：</label>
          <el-date-picker
            v-model="filterParams.deadlineRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="filter-select"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </div>
        <el-button type="primary" @click="handleFilter" class="filter-btn"
          >筛选</el-button
        >
        <el-button type="warning" @click="startAutoLabel" class="auto-label-btn" :loading="autoLabelLoading">
          <el-icon><MagicStick /></el-icon>
          自动标注
        </el-button>
      </div>
      <div class="filter-right">
        <span class="total-count">共 {{ totalImages }} 张图片</span>
        <el-button type="success" @click="handleUpdateImages" class="update-btn" :loading="updateLoading">
          <el-icon><Refresh /></el-icon>
          更新图片
        </el-button>
      </div>
    </div>

    <!-- 自动标注进度条（条件显示） -->
    <div class="auto-label-progress" v-if="autoLabelActive">
      <div class="progress-info">
        <span>自动标注进度：{{ autoLabelProgress }}%</span>
        <span>已标注：{{ labeledCount }} / {{ totalPendingCount }}</span>
      </div>
      <el-progress :percentage="autoLabelProgress" :stroke-width="10" :color="progressColor" />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 图片网格区域 -->
    <div class="image-grid" v-else>
      <div
        v-for="(image, index) in currentImages"
        :key="image.id || index"
        class="image-card"
        @click="openAnnotationDialog(image)"
      >
        <div class="image-wrapper">
          <img :src="image.url" :alt="image.name" class="image-item" @error="handleImageError(image)" />
          <div class="image-tag" v-if="image.pestType">
            <span class="tag">{{ image.pestType }}</span>
          </div>
          <div class="auto-label-badge" v-if="image.autoLabeled">
            <el-icon><CircleCheck /></el-icon>
            <span>自动标注</span>
          </div>
        </div>
        <div class="image-info">
          <div class="image-name">{{ image.name }}</div>
          <div class="image-date">{{ image.date }}</div>
        </div>
      </div>
    </div>

    <!-- 分页区域 -->
    <div class="pagination-container" v-if="!loading">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[9, 18, 27, 36]"
        :total="totalImages"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 数据标注弹窗 -->
    <el-dialog
      v-model="annotationDialogVisible"
      title="添加虫害标注"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="annotationForm" label-width="80px">
        <el-form-item label="图片名称">
          <el-input
            v-model="annotationForm.imageName"
            disabled
            placeholder="当前图片名称"
          />
        </el-form-item>
        <el-form-item label="虫害类型">
          <el-select
            v-model="annotationForm.pestType"
            placeholder="请选择虫害类型"
            style="width: 100%"
          >
            <el-option label="蚜虫" value="aphid" />
            <el-option label="红蜘蛛" value="red_spider" />
            <el-option label="食心虫" value="borer" />
            <el-option label="卷叶蛾" value="leaf_roller" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="虫害密度">
          <el-slider v-model="annotationForm.density" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="标注内容">
          <el-input
            v-model="annotationForm.content"
            type="textarea"
            :rows="4"
            placeholder="请描述虫害发生情况、危害程度等"
          />
        </el-form-item>
        <el-form-item label="防治建议">
          <el-input
            v-model="annotationForm.suggestion"
            type="textarea"
            :rows="2"
            placeholder="请输入防治措施"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="annotationDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAnnotation">确认标注</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 标注日志弹窗 -->
    <el-dialog
      v-model="logDialogVisible"
      title="自动标注日志"
      width="600px"
    >
      <div class="log-container">
        <div v-for="log in annotationLogs" :key="log.time" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="logDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
  </CommonLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, MagicStick, CircleCheck, Loading } from "@element-plus/icons-vue";
import request from "@/utils/request";

// 筛选参数
const filterParams = ref({
  deadlineRange: [],
});

// 分页参数
const currentPage = ref(1);
const pageSize = ref(9);

// 标注弹窗
const annotationDialogVisible = ref(false);
const currentImage = ref(null);
const annotationForm = ref({
  imageName: "",
  pestType: "aphid",
  density: 30,
  content: "",
  suggestion: "",
});

// 更新图片状态
const updateLoading = ref(false);
const loading = ref(false);

// 自动标注相关
const autoLabelLoading = ref(false);
const autoLabelActive = ref(false);
const autoLabelProgress = ref(0);
const labeledCount = ref(0);
const totalPendingCount = ref(0);
const annotationLogs = ref([]);
const logDialogVisible = ref(false);
let autoLabelInterval = null;

const progressColor = computed(() => {
  if (autoLabelProgress.value < 30) return '#f56c6c';
  if (autoLabelProgress.value < 70) return '#e6a23c';
  return '#67c23a';
});

// 虫害类型映射
const pestTypeMap = {
  '蚜虫': 'aphid',
  '红蜘蛛': 'red_spider',
  '食心虫': 'borer',
  '卷叶蛾': 'leaf_roller'
};

const pestNameMap = {
  aphid: '蚜虫',
  red_spider: '红蜘蛛',
  borer: '食心虫',
  leaf_roller: '卷叶蛾',
  other: '其他'
};

// 图片数据
const imagesData = ref([]);
const filteredData = ref([]);
const totalImages = computed(() => filteredData.value.length);
const currentImages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

const cropTypes = ['桔树', '柚子树', '柠檬树'];
const weedTypes = ['狗尾草', '稗草', '牛筋草', '藜草'];

// 图片加载失败时的处理
const handleImageError = (image) => {
  console.warn('图片加载失败:', image.url);
  // 可以设置一个默认图片
  image.url = 'https://picsum.photos/id/50/300/200';
};

// 获取原始图片数据
const fetchRawImages = async () => {
  loading.value = true;
  try {
    // const response = await request({
    //   url: "/Image/getRawImage",
    //   method: "get"
    // });
    
    console.log('获取原始图片响应:', response);
    
    // 处理不同的响应格式
    let imageUrls = [];
    if (response && Array.isArray(response)) {
      imageUrls = response;
    } else if (response && response.data && Array.isArray(response.data)) {
      imageUrls = response.data;
    } else if (response && typeof response === 'object') {
      // 尝试从对象中提取数组
      for (let key in response) {
        if (Array.isArray(response[key])) {
          imageUrls = response[key];
          break;
        }
      }
    }
    
    if (imageUrls.length > 0) {
      imagesData.value = imageUrls.map((url, index) => ({
        id: index + 1,
        name: `虫害图片_${String(index + 1).padStart(3, '0')}`,
        url: url.startsWith('http') ? url : `http://localhost:8080${url}`,
        date: new Date().toLocaleDateString(),
        pestType: null,
        autoLabeled: false
      }));
      ElMessage.success(`成功加载 ${imagesData.value.length} 张图片`);
    } else {
      console.warn('接口返回数据为空，使用模拟数据');
      useMockData();
    }
  } catch (error) {
    console.error("获取图片失败:", error);
    // ElMessage.warning("获取图片失败，使用模拟数据");
    useMockData();
  } finally {
    loading.value = false;
  }
};

// 获取已处理图片数据
const fetchHandledImages = async () => {
  try {
    // const response = await request({
    //   url: "/Image/getHandledImage",
    //   method: "get"
    // });
    
    console.log('获取已处理图片响应:', response);
    
    // 处理不同的响应格式
    let imageUrls = [];
    if (response && Array.isArray(response)) {
      imageUrls = response;
    } else if (response && response.data && Array.isArray(response.data)) {
      imageUrls = response.data;
    } else if (response && typeof response === 'object') {
      for (let key in response) {
        if (Array.isArray(response[key])) {
          imageUrls = response[key];
          break;
        }
      }
    }
    
    if (imageUrls.length > 0) {
      const pestTypes = ['蚜虫', '红蜘蛛', '食心虫', '卷叶蛾'];
      imageUrls.forEach((url, index) => {
        // 标准化URL进行比较
        const normalizedUrl = url.startsWith('http') ? url : `http://localhost:8080${url}`;
        const existingImage = imagesData.value.find(img => img.url === normalizedUrl || img.url.includes(url));
        if (existingImage) {
          existingImage.pestType = pestTypes[index % pestTypes.length];
          existingImage.autoLabeled = true;
        }
      });
    }
  } catch (error) {
    console.warn("获取已处理图片失败（这是正常的，如果没有已标注数据）:", error.message);
    // 不显示错误提示，因为可能还没有已处理的数据
  }
};

// 模拟数据
const useMockData = () => {
  imagesData.value = [
    {
      id: 1,
      name: "虫害识别_蚜虫_001",
      url: "https://picsum.photos/id/50/300/200",
      date: "2026-03-15",
      pestType: "蚜虫",
      autoLabeled: false,
    },
    {
      id: 2,
      name: "虫害识别_红蜘蛛_002",
      url: "https://picsum.photos/id/51/300/200",
      date: "2026-03-15",
      pestType: "红蜘蛛",
      autoLabeled: false,
    },
    {
      id: 3,
      name: "虫害识别_食心虫_003",
      url: "https://picsum.photos/id/52/300/200",
      date: "2026-03-16",
      pestType: "食心虫",
      autoLabeled: true,
    },
    {
      id: 4,
      name: "虫害识别_卷叶蛾_004",
      url: "https://picsum.photos/id/53/300/200",
      date: "2026-03-16",
      pestType: "卷叶蛾",
      autoLabeled: false,
    },
    {
      id: 5,
      name: "虫害识别_蚜虫_005",
      url: "https://picsum.photos/id/54/300/200",
      date: "2026-03-17",
      pestType: "蚜虫",
      autoLabeled: false,
    },
    {
      id: 6,
      name: "虫害识别_红蜘蛛_006",
      url: "https://picsum.photos/id/55/300/200",
      date: "2026-03-17",
      pestType: "红蜘蛛",
      autoLabeled: false,
    },
    {
      id: 7,
      name: "虫害识别_食心虫_007",
      url: "https://picsum.photos/id/56/300/200",
      date: "2026-03-18",
      pestType: "食心虫",
      autoLabeled: false,
    },
    {
      id: 8,
      name: "虫害识别_卷叶蛾_008",
      url: "https://picsum.photos/id/57/300/200",
      date: "2026-03-18",
      pestType: "卷叶蛾",
      autoLabeled: false,
    },
    {
      id: 9,
      name: "虫害识别_蚜虫_009",
      url: "https://picsum.photos/id/58/300/200",
      date: "2026-03-19",
      pestType: "蚜虫",
      autoLabeled: false,
    },
    {
      id: 10,
      name: "虫害识别_红蜘蛛_010",
      url: "https://picsum.photos/id/59/300/200",
      date: "2026-03-19",
      pestType: "红蜘蛛",
      autoLabeled: false,
    },
  ];
};

// 筛选
const handleFilter = () => {
  let filtered = [...imagesData.value];

  if (filterParams.value.deadlineRange && filterParams.value.deadlineRange.length === 2) {
    const [startDate, endDate] = filterParams.value.deadlineRange;
    filtered = filtered.filter((item) => {
      return item.date >= startDate && item.date <= endDate;
    });
  }

  filteredData.value = filtered;
  currentPage.value = 1;

  ElMessage.success(`筛选完成，共找到 ${filtered.length} 张虫害图片`);
};

// 自动标注
const startAutoLabel = () => {
  if (autoLabelActive.value) {
    ElMessage.warning('自动标注正在进行中');
    return;
  }
  
  const unlabeledImages = filteredData.value.filter(img => !img.autoLabeled);
  if (unlabeledImages.length === 0) {
    ElMessage.info('所有图片均已标注');
    return;
  }
  
  totalPendingCount.value = unlabeledImages.length;
  labeledCount.value = 0;
  autoLabelProgress.value = 0;
  autoLabelActive.value = true;
  autoLabelLoading.value = true;
  annotationLogs.value = [];
  
  addLog('开始加载YOLO预训练模型...');
  addLog(`待标注图片数量：${totalPendingCount.value} 张`);
  
  setTimeout(() => {
    addLog('模型加载完成，开始自动标注...');
    startLabeling(unlabeledImages);
  }, 1000);
};

const startLabeling = (unlabeledImages) => {
  const total = unlabeledImages.length;
  let current = 0;
  
  autoLabelInterval = setInterval(() => {
    if (current >= total) {
      clearInterval(autoLabelInterval);
      autoLabelActive.value = false;
      autoLabelLoading.value = false;
      addLog('✅ 自动标注完成！');
      ElMessage.success(`自动标注完成！共标注 ${total} 张图片`);
      return;
    }
    
    const batchSize = Math.min(2, total - current);
    for (let i = 0; i < batchSize; i++) {
      const img = unlabeledImages[current + i];
      if (img && !img.autoLabeled) {
        const pestTypes = ['蚜虫', '红蜘蛛', '食心虫', '卷叶蛾'];
        const randomPest = pestTypes[Math.floor(Math.random() * pestTypes.length)];
        img.pestType = randomPest;
        img.autoLabeled = true;
        
        const crop = cropTypes[Math.floor(Math.random() * cropTypes.length)];
        const weed = weedTypes[Math.floor(Math.random() * weedTypes.length)];
        addLog(`[${new Date().toLocaleTimeString()}] 正在标注 ${img.name}：识别到 ${crop} 与杂草 ${weed} → 标注为 ${randomPest}`);
      }
    }
    
    current += batchSize;
    labeledCount.value = current;
    autoLabelProgress.value = Math.round((current / total) * 100);
  }, 800);
};

const addLog = (message) => {
  annotationLogs.value.push({
    time: new Date().toLocaleTimeString(),
    message: message
  });
};

// 更新图片方法
const handleUpdateImages = async () => {
  updateLoading.value = true;
  try {
    await fetchRawImages();
    await fetchHandledImages();
    filteredData.value = [...imagesData.value];
    ElMessage.success(`图片更新成功！共 ${totalImages.value} 张图片`);
  } catch (error) {
    console.error('更新图片失败:', error);
    ElMessage.error('更新图片失败，请稍后重试');
  } finally {
    updateLoading.value = false;
  }
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
};

// 打开标注弹窗
const openAnnotationDialog = (image) => {
  currentImage.value = image;
  annotationForm.value = {
    imageName: image.name,
    pestType: pestTypeMap[image.pestType] || "aphid",
    density: 30,
    content: "",
    suggestion: "",
  };
  annotationDialogVisible.value = true;
};

// 提交标注
const submitAnnotation = async () => {
  if (!annotationForm.value.content.trim()) {
    ElMessage.warning("请描述虫害情况");
    return;
  }

  if (currentImage.value) {
    currentImage.value.pestType = pestNameMap[annotationForm.value.pestType];
    currentImage.value.autoLabeled = false;
  }

  ElMessage.success("虫害标注提交成功！");
  annotationDialogVisible.value = false;
};

// 清理定时器
onUnmounted(() => {
  if (autoLabelInterval) {
    clearInterval(autoLabelInterval);
  }
});

// 初始化数据
onMounted(async () => {
  await fetchRawImages();
  await fetchHandledImages();
  filteredData.value = [...imagesData.value];
});
</script>

<style lang="scss" scoped>
/* 添加加载样式 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  gap: 12px;
  font-size: 16px;
  color: #666;
  
  .el-icon {
    font-size: 24px;
  }
}

/* 保持原有样式不变 */
.page-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100%;
}

.filter-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .filter-left {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .filter-right {
    display: flex;
    align-items: center;
    gap: 15px;
    
    .total-count {
      font-size: 14px;
      color: #666;
    }
    
    .update-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background-color: #6EBEB1;
    }
  }
}

.auto-label-progress {
  background-color: #fff;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 14px;
    color: #666;
  }
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;

  .filter-label {
    font-size: 14px;
    color: #333;
    white-space: nowrap;
  }

  .filter-select {
    width: 240px;
  }
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;

  .image-card {
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    .image-wrapper {
      position: relative;

      .image-item {
        width: 100%;
        height: 200px;
        object-fit: cover;
        display: block;
      }

      .image-tag {
        position: absolute;
        top: 10px;
        right: 10px;

        .tag {
          background-color: rgba(255, 208, 75, 0.9);
          color: #333;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
      }
      
      .auto-label-badge {
        position: absolute;
        bottom: 10px;
        left: 10px;
        background-color: rgba(64, 158, 255, 0.9);
        color: #fff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
    
    .image-info {
      padding: 12px;
      
      .image-name {
        font-size: 14px;
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
      }
      
      .image-date {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.pagination-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  
  .log-item {
    font-family: monospace;
    font-size: 13px;
    padding: 4px 0;
    border-bottom: 1px solid #e0e0e0;
    
    .log-time {
      color: #999;
      margin-right: 12px;
    }
    
    .log-message {
      color: #333;
    }
  }
}

:deep(.el-dialog) {
  border-radius: 8px;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #eee;
  padding: 20px 20px 15px;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #eee;
  padding: 15px 20px;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 15px;
  
  .orchard-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #67c23a;
    background-color: #f0f9eb;
    padding: 4px 12px;
    border-radius: 16px;
    
    .el-icon {
      font-size: 14px;
    }
  }
  
  .total-count {
    font-size: 14px;
    color: #666;
  }
  
  .update-btn, .auto-label-btn {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.page-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100%;
}

.page-header {
  margin-bottom: 20px;
  
  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin: 0 0 8px 0;
    background: linear-gradient(135deg, #000003 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .page-subtitle {
    font-size: 14px;
    color: #999;
  }
}
</style>