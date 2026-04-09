<template>
  <CommonLayout>
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">自动训练系统-杂草</h1>
        <div class="page-subtitle">杂草识别与标注管理</div>
        <!-- 按钮，跳转到自动训练页面 -->
        <el-button type="primary" size="large" @click="handleTrainClick" class="train-btn">
          <el-icon>
            <VideoPlay />
          </el-icon>
          点击训练
        </el-button>

      </div>
      <!-- 顶部筛选区域 -->
      <div class="filter-container">
        <div class="filter-left">
          <div class="filter-item">
            <label class="filter-label">果园选择：</label>
            <el-select v-model="filterParams.orchardId" placeholder="请选择果园" class="filter-select" style="width: 180px"
              @change="handleOrchardChange">
              <el-option v-for="orchard in orchardList" :key="orchard.id" :label="orchard.name" :value="orchard.id" />
            </el-select>
          </div>
          <div class="filter-item">
            <label class="filter-label">时间范围：</label>
            <el-date-picker v-model="filterParams.deadlineRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" class="filter-select" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" style="width: 240px" />
          </div>
          <el-button type="primary" @click="handleFilter" class="filter-btn">筛选</el-button>
          <el-button @click="resetFilter" class="filter-btn">重置</el-button>
        </div>
        <div class="filter-right">
          <span class="orchard-info" v-if="selectedOrchardName">
            <el-icon>
              <HomeFilled />
            </el-icon>
            当前果园：{{ selectedOrchardName }}
          </span>
          <span class="total-count">共 {{ 167 }} 张图片</span>
          <el-button type="success" @click="handleUpdateImages" class="update-btn" :loading="updateLoading">
            <el-icon>
              <Refresh />
            </el-icon>
            更新图片
          </el-button>
        </div>
      </div>

      <!-- 系统概览卡片 -->
      <div class="overview-cards">
        <div class="overview-card">
          <div class="card-icon upload-icon">
            <el-icon>
              <Upload />
            </el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ 167 }}</div>
            <div class="card-label">已采集图片</div>
          </div>
        </div>
        <div class="overview-card">
          <div class="card-icon label-icon">
            <el-icon>
              <Document />
            </el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ 0 }}</div>
            <div class="card-label">已标注数据</div>
          </div>
        </div>
        <div class="overview-card">
          <div class="card-icon model-icon">
            <el-icon>
              <DataAnalysis />
            </el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ stats.modelAccuracy }}%</div>
            <div class="card-label">当前模型精度</div>
          </div>
        </div>
        <div class="overview-card">
          <div class="card-icon train-icon">
            <el-icon>
              <TrendCharts />
            </el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ stats.trainCount }}</div>
            <div class="card-label">累计训练次数</div>
          </div>
        </div>
      </div>

      <!-- 工作流程步骤 -->
      <div class="workflow-steps">
        <div class="step-item" v-for="(step, index) in workflowSteps" :key="index">
          <div class="step-number" :class="{ active: step.active, completed: step.completed }">
            {{ index + 1 }}
          </div>
          <div class="step-content">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-desc">{{ step.desc }}</div>
          </div>
          <div class="step-line" v-if="index < workflowSteps.length - 1"></div>
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
            <div class="weed-tag" v-if="image.weedType">
              <span class="tag">{{ image.weedType }}</span>
            </div>
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
      <el-dialog v-model="annotationDialogVisible" title="添加杂草标注" width="500px" :close-on-click-modal="false">
        <el-form :model="annotationForm" label-width="80px">
          <el-form-item label="图片名称">
            <el-input v-model="annotationForm.imageName" disabled placeholder="当前图片名称" />
          </el-form-item>
          <el-form-item label="杂草识别">
            <div class="recognition-result" v-if="recognitionResult">
              <div class="result-crop">
                <span class="label">作物：</span>
                <span class="value">{{ recognitionResult.crop }}</span>
              </div>
              <div class="result-weeds">
                <span class="label">杂草：</span>
                <span class="value">{{ recognitionResult.weeds.join('、') }}</span>
              </div>
              <div class="result-accuracy">
                <span class="label">识别准确率：</span>
                <span class="value">{{ recognitionResult.accuracy }}%</span>
              </div>
            </div>
            <el-button v-else type="primary" @click="startRecognition" :loading="recognitionLoading">
              开始识别
            </el-button>
          </el-form-item>
          <el-form-item label="标注内容">
            <el-input v-model="annotationForm.content" type="textarea" :rows="4" placeholder="请输入标注内容" />
          </el-form-item>
          <el-form-item label="标注类型">
            <el-select v-model="annotationForm.type" placeholder="请选择标注类型" style="width: 100%">
              <el-option label="杂草识别" value="weed" />
              <el-option label="杂草分类" value="weed_classification" />
              <el-option label="杂草密度" value="weed_density" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="严重程度">
            <el-rate v-model="annotationForm.severity" :max="5" />
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
import { HomeFilled, Refresh, Upload, Document, DataAnalysis, TrendCharts, Loading, VideoPlay } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/modules/user";
import request from "@/utils/request";
import { useRouter } from "vue-router";
const router = useRouter();
//跳转
const handleTrainClick = () => {
  router.push('/survival')
}
const userStore = useUserStore();

// 筛选参数
const filterParams = ref({
  orchardId: null,
  deadlineRange: [],
});

// 果园列表
const orchardList = ref([
  { id: 1, name: "东区果园" },
  { id: 2, name: "西区果园" },
  { id: 3, name: "南区果园" },
  { id: 4, name: "北区果园" },
]);

// 当前选中的果园名称
const selectedOrchardName = computed(() => {
  const selected = orchardList.value.find(o => o.id === filterParams.value.orchardId);
  return selected ? selected.name : "";
});

// 系统统计数据
const stats = ref({
  collectedImages: 0,
  labeledImages: 0,
  modelAccuracy: 92.8,
  trainCount: 6
});

// 工作流程步骤
const workflowSteps = ref([
  { title: "数据采集", desc: "上传农田杂草图片", active: true, completed: true },
  { title: "自动标注", desc: "YOLO自动完成标注", active: true, completed: false },
  { title: "自动训练", desc: "数据达标后自动训练", active: false, completed: false },
  { title: "模型更新", desc: "自动替换最新模型", active: false, completed: false },
  { title: "实时识别", desc: "高精度杂草检测", active: false, completed: false }
]);

// 分页参数
const currentPage = ref(1);
const pageSize = ref(9);

// 标注弹窗
const annotationDialogVisible = ref(false);
const currentImage = ref(null);
const recognitionResult = ref(null);
const recognitionLoading = ref(false);
const loading = ref(false);

const annotationForm = ref({
  imageName: "",
  content: "",
  type: "weed",
  severity: 3,
});

// 更新图片状态
const updateLoading = ref(false);

// 按果园分组的图片数据
const imagesDataByOrchard = ref({});
const allImagesData = ref([]);
const filteredData = ref([]);
const totalImages = computed(() => filteredData.value.length);
const currentImages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});


// 获取原始图片数据
const fetchRawImages = async () => {
  loading.value = true;
  try {
    // const response = await request({
    //   url: "/Image/getRawImage",
    //   method: "get"
    // });

    if (response && Array.isArray(response)) {
      // 按果园分组存储图片
      const orchardCount = orchardList.value.length;
      const imagesPerOrchard = Math.ceil(response.length / orchardCount);

      orchardList.value.forEach((orchard, orchardIndex) => {
        const startIdx = orchardIndex * imagesPerOrchard;
        const endIdx = Math.min(startIdx + imagesPerOrchard, response.length);
        const orchardImages = response.slice(startIdx, endIdx);

        imagesDataByOrchard.value[orchard.id] = orchardImages.map((url, idx) => ({
          id: `${orchard.id}_${idx + 1}`,
          name: `杂草识别_${orchard.name}_${String(idx + 1).padStart(3, '0')}`,
          url: url,
          date: new Date().toLocaleDateString(),
          orchardId: orchard.id,
          weedType: weedTypesList[Math.floor(Math.random() * weedTypesList.length)]
        }));
      });

      // 更新统计数据
      stats.value.collectedImages = response.length;
      stats.value.labeledImages = Math.floor(response.length * 0.7);

      // 初始化所有图片数据
      allImagesData.value = Object.values(imagesDataByOrchard.value).flat();
    } else {
      useMockData();
    }
  } catch (error) {
    console.error("获取图片失败:", error);
    // ElMessage.error("获取图片失败，使用模拟数据");
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

    if (response && Array.isArray(response)) {
      // 更新已处理图片的标注状态
      response.forEach((url, index) => {
        for (const orchardId in imagesDataByOrchard.value) {
          const image = imagesDataByOrchard.value[orchardId].find(img => img.url === url);
          if (image) {
            image.weedType = weedTypesList[index % weedTypesList.length];
            break;
          }
        }
      });
    }
  } catch (error) {
    console.error("获取已处理图片失败:", error);
  }
};

// 模拟数据
const useMockData = () => {
  imagesDataByOrchard.value = {
    1: [
      { id: "1_1", name: "杂草识别101", url: "images/beforeMark/unmark1.jpg", date: "2026-03-15", orchardId: 1 },
      { id: "1_2", name: "杂草识别102", url: "images/beforeMark/unmark2.jpg", date: "2026-03-15", orchardId: 1 },
      { id: "1_3", name: "杂草识别103", url: "images/beforeMark/unmark3.jpg", date: "2026-03-16", orchardId: 1 },
      { id: "1_4", name: "杂草识别104", url: "images/beforeMark/unmark4.jpg", date: "2026-03-16", orchardId: 1 },
      { id: "1_5", name: "杂草识别105", url: "images/beforeMark/unmark5.jpg", date: "2026-03-17", orchardId: 1 },
    ],
    2: [
      { id: "2_1", name: "杂草识别201", url: "images/beforeMark/unmark6.jpg", date: "2026-03-15", orchardId: 2 },
      { id: "2_2", name: "杂草识别202", url: "images/beforeMark/unmark7.jpg", date: "2026-03-16", orchardId: 2 },
      { id: "2_3", name: "杂草识别203", url: "images/beforeMark/unmark8.jpg", date: "2026-03-17", orchardId: 2 },
      { id: "2_4", name: "杂草识别204", url: "images/beforeMark/unmark9.jpg", date: "2026-03-18", orchardId: 2 },
    ],
    3: [
      { id: "3_1", name: "杂草识别301", url: "images/beforeMark/unmark10.jpg", date: "2026-03-15", orchardId: 3 },
      { id: "3_2", name: "杂草识别302", url: "images/beforeMark/unmark11.jpg", date: "2026-03-16", orchardId: 3 },
      { id: "3_3", name: "杂草识别303", url: "images/beforeMark/unmark12.jpg", date: "2026-03-17", orchardId: 3 },
      { id: "3_4", name: "杂草识别304", url: "images/beforeMark/unmark13.jpg", date: "2026-03-18", orchardId: 3 },
      { id: "3_5", name: "杂草识别305", url: "images/beforeMark/unmark14.jpg", date: "2026-03-19", orchardId: 3 },
    ],
    4: [
      { id: "4_1", name: "杂草识别401", url: "images/beforeMark/unmark15.jpg", date: "2026-03-15", orchardId: 4 },
      { id: "4_2", name: "杂草识别402", url: "images/beforeMark/unmark16.jpg", date: "2026-03-16", orchardId: 4 },
      { id: "4_3", name: "杂草识别403", url: "images/beforeMark/unmark17.jpg", date: "2026-03-17", orchardId: 4 },
    ],
  };

  // 更新统计数据
  stats.value.collectedImages = Object.values(imagesDataByOrchard.value).flat().length;
  stats.value.labeledImages = Math.floor(stats.value.collectedImages * 0.7);

  allImagesData.value = Object.values(imagesDataByOrchard.value).flat();
};

// 果园切换
const handleOrchardChange = () => {
  if (filterParams.value.orchardId) {
    allImagesData.value = [...(imagesDataByOrchard.value[filterParams.value.orchardId] || [])];
  } else {
    allImagesData.value = Object.values(imagesDataByOrchard.value).flat();
  }
  handleFilter();
};

// 筛选
const handleFilter = () => {
  let filtered = [...allImagesData.value];

  if (filterParams.value.deadlineRange && filterParams.value.deadlineRange.length === 2) {
    const [startDate, endDate] = filterParams.value.deadlineRange;
    filtered = filtered.filter((item) => {
      return item.date >= startDate && item.date <= endDate;
    });
  }

  filteredData.value = filtered;
  currentPage.value = 1;

  const orchardText = selectedOrchardName.value ? `果园"${selectedOrchardName.value}"中` : "";
  ElMessage.success(`筛选完成，${orchardText}共找到 ${filtered.length} 张图片`);
};

// 重置筛选
const resetFilter = () => {
  filterParams.value = {
    orchardId: null,
    deadlineRange: [],
  };
  allImagesData.value = Object.values(imagesDataByOrchard.value).flat();
  handleFilter();
};

// 开始识别
const startRecognition = async () => {
  recognitionLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const cropTypes = ['桔树', '柚子树', '柠檬树'];
    const randomCrop = cropTypes[Math.floor(Math.random() * cropTypes.length)];
    const randomWeeds = [
      weedTypes[Math.floor(Math.random() * weedTypes.length)],
      weedTypes[Math.floor(Math.random() * weedTypes.length)]
    ].filter((v, i, a) => a.indexOf(v) === i);

    recognitionResult.value = {
      crop: randomCrop,
      weeds: randomWeeds,
      accuracy: (90 + Math.random() * 8).toFixed(1)
    };
    ElMessage.success('识别完成！');
  } catch (error) {
    console.error('识别失败:', error);
    ElMessage.error('识别失败，请重试');
  } finally {
    recognitionLoading.value = false;
  }
};

// 更新图片方法
const handleUpdateImages = async () => {
  updateLoading.value = true;
  try {
    await fetchRawImages();
    await fetchHandledImages();

    if (filterParams.value.orchardId) {
      allImagesData.value = [...(imagesDataByOrchard.value[filterParams.value.orchardId] || [])];
    } else {
      allImagesData.value = Object.values(imagesDataByOrchard.value).flat();
    }
    handleFilter();

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
  recognitionResult.value = null;
  annotationForm.value = {
    imageName: image.name,
    content: "",
    type: "weed",
    severity: 3,
  };
  annotationDialogVisible.value = true;
};

// 提交标注
const submitAnnotation = async () => {
  if (!annotationForm.value.content.trim()) {
    ElMessage.warning("请输入标注内容");
    return;
  }

  // 可以在这里调用后端接口保存标注数据
  // await request.post("/Image/saveAnnotation", {
  //   imageId: currentImage.value?.id,
  //   orchardId: filterParams.value.orchardId,
  //   recognitionResult: recognitionResult.value,
  //   ...annotationForm.value,
  // });

  console.log("提交标注：", {
    imageId: currentImage.value?.id,
    orchardId: filterParams.value.orchardId,
    recognitionResult: recognitionResult.value,
    ...annotationForm.value,
    timestamp: new Date().toISOString(),
  });

  ElMessage.success("标注提交成功！");
  annotationDialogVisible.value = false;
};

// 初始化数据
onMounted(async () => {
  if (userStore.user?.orchardId) {
    filterParams.value.orchardId = userStore.user.orchardId;
  }
  await fetchRawImages();
  await fetchHandledImages();
  allImagesData.value = Object.values(imagesDataByOrchard.value).flat();
  filteredData.value = [...allImagesData.value];
});
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100%;
}

/* 加载样式 */
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

.filter-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  gap: 10px;

  .filter-left {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;
  }

  .filter-right {
    display: flex;
    align-items: center;
    gap: 20px;

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

    .update-btn {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;

  .overview-card {
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

      &.upload-icon {
        background-color: #e8f4f8;
        color: #409eff;
      }

      &.label-icon {
        background-color: #e8f8f0;
        color: #67c23a;
      }

      &.model-icon {
        background-color: #fdf6ec;
        color: #e6a23c;
      }

      &.train-icon {
        background-color: #f4e8f8;
        color: #b37feb;
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

.workflow-steps {
  background-color: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .step-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;

    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #999;
      margin-bottom: 12px;

      &.active {
        background-color: #409eff;
        color: #fff;
        box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
      }

      &.completed {
        background-color: #67c23a;
        color: #fff;
      }
    }

    .step-content {
      text-align: center;

      .step-title {
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .step-desc {
        font-size: 12px;
        color: #999;
      }
    }

    .step-line {
      position: absolute;
      top: 18px;
      left: 50%;
      width: 100%;
      height: 2px;
      background-color: #e0e0e0;
      z-index: 0;
    }

    &:last-child .step-line {
      display: none;
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
    width: 180px;
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

      .weed-tag {
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

.recognition-result {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 8px;

  .result-crop,
  .result-weeds,
  .result-accuracy {
    margin-bottom: 8px;

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      color: #333;
    }
  }

  .result-weeds .value {
    color: #e6a23c;
  }

  .result-accuracy .value {
    color: #67c23a;
    font-weight: 500;
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

  .update-btn {
    background-color: #6EBEB1;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* 改成 center，不要用 flex-end */
  position: relative;
  z-index: 99;
  /* 提高层级，保证能点到 */

  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin: 0;
    background: linear-gradient(135deg, #000003 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .train-btn {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    border: none;
    pointer-events: auto !important;
    /* 强制开启点击 */
    cursor: pointer !important;
  }

  .page-subtitle {
    font-size: 14px;
    color: #999;
    margin-top: 4px;
  }
}
</style>