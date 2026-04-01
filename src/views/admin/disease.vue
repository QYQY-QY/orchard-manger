<template>
  <CommonLayout>
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">自动训练系统-病害</h1>
        <div class="page-subtitle">病害识别与标注管理</div>
      </div>
      <!-- 顶部筛选区域 -->
      <div class="filter-container">
        <div class="filter-left">
          <div class="filter-item">
            <label class="filter-label">时间范围：</label>
            <el-date-picker v-model="filterParams.deadlineRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" class="filter-select" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" style="width: 240px" />
          </div>
          <el-button type="primary" @click="handleFilter" class="filter-btn">筛选</el-button>
        </div>
        <div class="filter-right">
          <span class="total-count">共 {{ totalImages }} 张图片</span>
          <el-button type="success" @click="handleUpdateImages" class="update-btn" :loading="updateLoading">
            <el-icon>
              <Refresh />
            </el-icon>
            更新图片
          </el-button>
        </div>
      </div>

      <!-- 系统状态卡片 -->
      <div class="status-cards">
        <div class="status-card">
          <div class="card-icon disease-icon">
            <el-icon>
              <Warning />
            </el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ diseaseStats.total }}</div>
            <div class="card-label">病害总数</div>
          </div>
        </div>
        <div class="status-card">
          <div class="card-icon untreated-icon">
            <el-icon>
              <CircleClose />
            </el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ diseaseStats.untreated }}</div>
            <div class="card-label">待处理病害</div>
          </div>
        </div>
        <div class="status-card">
          <div class="card-icon treated-icon">
            <el-icon>
              <CircleCheck />
            </el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ diseaseStats.treated }}</div>
            <div class="card-label">已处理病害</div>
          </div>
        </div>
        <div class="status-card">
          <div class="card-icon severity-icon">
            <el-icon>
              <DataLine />
            </el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ diseaseStats.avgSeverity }}</div>
            <div class="card-label">平均严重程度</div>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <span>加载中...</span>
      </div>

      <!-- 图片网格区域 -->
      <div class="image-grid" v-else>
        <div v-for="(image, index) in currentImages" :key="image.id || index" class="image-card"
          @click="openAnnotationDialog(image)">
          <div class="image-wrapper">
            <img :src="image.url" :alt="image.name" class="image-item" />
            <div class="image-overlay" v-if="image.hasAnnotation">
              <el-icon>
                <Check />
              </el-icon>
              <span>已标注</span>
            </div>
            <div class="severity-badge" v-if="image.severity" :class="getSeverityClass(image.severity)">
              <span>严重程度: {{ image.severity }}</span>
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
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[9, 18, 27, 36]"
          :total="totalImages" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>

      <!-- 数据标注弹窗 -->
      <el-dialog v-model="annotationDialogVisible" title="添加病害标注" width="550px" :close-on-click-modal="false">
        <el-form :model="annotationForm" label-width="100px">
          <el-form-item label="图片名称">
            <el-input v-model="annotationForm.imageName" disabled placeholder="当前图片名称" />
          </el-form-item>
          <el-form-item label="病害类型">
            <el-select v-model="annotationForm.diseaseType" placeholder="请选择病害类型" style="width: 100%">
              <el-option label="锈病" value="rust" />
              <el-option label="白粉病" value="powdery_mildew" />
              <el-option label="炭疽病" value="anthracnose" />
              <el-option label="叶斑病" value="leaf_spot" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="标注内容">
            <el-input v-model="annotationForm.content" type="textarea" :rows="4" placeholder="请输入病害描述、发生位置、严重程度等信息" />
          </el-form-item>
          <el-form-item label="严重程度">
            <div class="severity-rate">
              <el-rate v-model="annotationForm.severity" :max="5" />
              <span class="severity-text">{{ getSeverityText(annotationForm.severity) }}</span>
            </div>
          </el-form-item>
          <el-form-item label="建议措施">
            <el-input v-model="annotationForm.suggestion" type="textarea" :rows="2" placeholder="请输入防治建议" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="annotationDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitAnnotation">确认标注</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </CommonLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Check, Refresh, Warning, CircleClose, CircleCheck, DataLine, Loading } from "@element-plus/icons-vue";
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
  diseaseType: "rust",
  content: "",
  severity: 3,
  suggestion: "",
});

// 更新图片状态
const updateLoading = ref(false);
const loading = ref(false);

// 病害统计数据
const diseaseStats = ref({
  total: 0,
  untreated: 0,
  treated: 0,
  avgSeverity: 0
});

// 图片数据
const imagesData = ref([]);
const filteredData = ref([]);
const totalImages = computed(() => filteredData.value.length);
const currentImages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

// // 获取原始图片数据
// const fetchRawImages = async () => {
//   loading.value = true;
//   try {
//     const response = await request({
//       url: "/Image/getRawImage",
//       method: "get"
//     });

//     if (response && Array.isArray(response)) {
//       // 将后端返回的图片路径转换为图片对象
//       imagesData.value = response.map((url, index) => ({
//         id: index + 1,
//         name: `病害图片_${index + 1}`,
//         url: url,
//         date: new Date().toLocaleDateString(),
//         hasAnnotation: false,
//         severity: null,
//         diseaseType: null
//       }));
//     } else {
//       // // 如果接口返回数据格式不对，使用模拟数据
//       // useMockData();
//     }
//   } catch (error) {
//     // console.error("获取图片失败:", error);
//     // // ElMessage.error("获取图片失败，使用模拟数据");
//     useMockData();
//   } finally {
//     // loading.value = false;
//   }
// };

// // 获取已处理图片数据
// const fetchHandledImages = async () => {
//   try {
//     const response = await request({
//       url: "/Image/getHandledImage",
//       method: "get"
//     });

//     if (response && Array.isArray(response)) {
//       // 更新已标注的图片信息
//       response.forEach((url, index) => {
//         const existingImage = imagesData.value.find(img => img.url === url);
//         if (existingImage) {
//           existingImage.hasAnnotation = true;
//           existingImage.severity = Math.floor(Math.random() * 5) + 1;
//           existingImage.diseaseType = ["rust", "powdery_mildew", "anthracnose", "leaf_spot"][Math.floor(Math.random() * 4)];
//         }
//       });
//     }
//   } catch (error) {
//     // console.error("获取已处理图片失败:", error);
//   }
// };

// 模拟数据（接口失败时使用）
const useMockData = () => {
  imagesData.value = [
    {
      id: 1,
      name: "病害识别_锈病_001",
      url: "https://picsum.photos/id/30/300/200",
      date: "2026-03-15",
      hasAnnotation: false,
      severity: null,
      diseaseType: null
    },
    {
      id: 2,
      name: "病害识别_白粉病_002",
      url: "https://picsum.photos/id/31/300/200",
      date: "2026-03-15",
      hasAnnotation: false,
      severity: null,
      diseaseType: null
    },
    {
      id: 3,
      name: "病害识别_炭疽病_003",
      url: "https://picsum.photos/id/32/300/200",
      date: "2026-03-16",
      hasAnnotation: true,
      severity: 4,
      diseaseType: "anthracnose"
    },
    {
      id: 4,
      name: "病害识别_叶斑病_004",
      url: "https://picsum.photos/id/33/300/200",
      date: "2026-03-16",
      hasAnnotation: false,
      severity: null,
      diseaseType: null
    },
    {
      id: 5,
      name: "病害识别_锈病_005",
      url: "https://picsum.photos/id/34/300/200",
      date: "2026-03-17",
      hasAnnotation: false,
      severity: null,
      diseaseType: null
    },
    {
      id: 6,
      name: "病害识别_白粉病_006",
      url: "https://picsum.photos/id/35/300/200",
      date: "2026-03-17",
      hasAnnotation: false,
      severity: null,
      diseaseType: null
    },
    {
      id: 7,
      name: "病害识别_炭疽病_007",
      url: "https://picsum.photos/id/36/300/200",
      date: "2026-03-18",
      hasAnnotation: false,
      severity: null,
      diseaseType: null
    },
    {
      id: 8,
      name: "病害识别_叶斑病_008",
      url: "https://picsum.photos/id/37/300/200",
      date: "2026-03-18",
      hasAnnotation: false,
      severity: null,
      diseaseType: null
    },
    {
      id: 9,
      name: "病害识别_锈病_009",
      url: "https://picsum.photos/id/38/300/200",
      date: "2026-03-19",
      hasAnnotation: false,
      severity: null,
      diseaseType: null
    },
    {
      id: 10,
      name: "病害识别_白粉病_010",
      url: "https://picsum.photos/id/39/300/200",
      date: "2026-03-19",
      hasAnnotation: false,
      severity: null,
      diseaseType: null
    },
  ];
};

// 更新统计数据
const updateStats = () => {
  const allData = filteredData.value;
  const annotated = allData.filter(img => img.hasAnnotation);
  const totalSeverity = annotated.reduce((sum, img) => sum + (img.severity || 0), 0);

  diseaseStats.value = {
    total: allData.length,
    untreated: allData.filter(img => !img.hasAnnotation).length,
    treated: annotated.length,
    avgSeverity: annotated.length > 0 ? (totalSeverity / annotated.length).toFixed(1) : 0
  };
};

// 根据严重程度返回样式
const getSeverityClass = (severity) => {
  if (severity >= 4) return "severe";
  if (severity >= 2) return "moderate";
  return "mild";
};

const getSeverityText = (severity) => {
  const texts = { 1: "轻微", 2: "较轻", 3: "中等", 4: "严重", 5: "非常严重" };
  return texts[severity] || "";
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
  updateStats();

  ElMessage.success(`筛选完成，共找到 ${filtered.length} 张病害图片`);
};

// 更新图片方法
const handleUpdateImages = async () => {
  updateLoading.value = true;
  try {
    await fetchRawImages();
    await fetchHandledImages();
    filteredData.value = [...imagesData.value];
    updateStats();
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
    diseaseType: image.diseaseType || "rust",
    content: "",
    severity: image.severity || 3,
    suggestion: "",
  };
  annotationDialogVisible.value = true;
};

// 提交标注
const submitAnnotation = async () => {
  if (!annotationForm.value.content.trim()) {
    ElMessage.warning("请输入病害描述内容");
    return;
  }

  if (currentImage.value) {
    currentImage.value.hasAnnotation = true;
    currentImage.value.severity = annotationForm.value.severity;
    currentImage.value.diseaseType = annotationForm.value.diseaseType;
  }

  // 可以在这里调用后端接口保存标注数据
  // await request.post("/Image/saveAnnotation", {
  //   imageId: currentImage.value?.id,
  //   ...annotationForm.value,
  // });

  updateStats();
  ElMessage.success("病害标注提交成功！");
  annotationDialogVisible.value = false;
};

// 初始化数据
onMounted(async () => {
  await fetchRawImages();
  await fetchHandledImages();
  filteredData.value = [...imagesData.value];
  updateStats();
});
</script>

<style lang="scss" scoped>
/* 保持原有样式不变，添加加载样式 */
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

/* 其他样式保持不变 */
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

.status-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;

  .status-card {
    background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s;

    &:hover {
      transform: translateY(-2px);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;

      &.disease-icon {
        background-color: #fef0f0;
        color: #f56c6c;
      }

      &.untreated-icon {
        background-color: #fdf6ec;
        color: #e6a23c;
      }

      &.treated-icon {
        background-color: #e8f8f0;
        color: #67c23a;
      }

      &.severity-icon {
        background-color: #e8f4f8;
        color: #409eff;
      }
    }

    .card-info {
      .card-value {
        font-size: 28px;
        font-weight: bold;
        color: #333;
      }

      .card-label {
        font-size: 13px;
        color: #999;
        margin-top: 4px;
      }
    }
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

      .image-overlay {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: rgba(76, 175, 80, 0.9);
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
        backdrop-filter: blur(4px);
      }

      .severity-badge {
        position: absolute;
        bottom: 10px;
        left: 10px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;

        &.severe {
          background-color: rgba(245, 108, 108, 0.9);
          color: #fff;
        }

        &.moderate {
          background-color: rgba(230, 162, 60, 0.9);
          color: #fff;
        }

        &.mild {
          background-color: rgba(103, 194, 58, 0.9);
          color: #fff;
        }
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

.severity-rate {
  display: flex;
  align-items: center;
  gap: 12px;

  .severity-text {
    font-size: 13px;
    color: #e6a23c;
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