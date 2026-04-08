<template>
  <CommonLayout>
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">自动训练系统-训练</h1>
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

      <!-- 模型训练卡片 -->
      <div class="train-card" v-if="showTrainCard">
        <div class="train-header">
          <div class="train-title">
            <el-icon>
              <Cpu />
            </el-icon>
            <span>模型自动训练</span>
          </div>
          <el-button type="primary" @click="startTraining" :loading="trainingActive" :disabled="trainingActive">
            {{ trainingActive ? '训练中...' : '启动训练' }}
          </el-button>
        </div>

        <div class="train-stats">
          <div class="stat-item">
            <span class="stat-label">训练数据量：</span>
            <span class="stat-value">{{ trainStats.totalData }} 张</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">训练进度：</span>
            <span class="stat-value">{{ trainStats.progress }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">标注进度：</span>
            <span class="stat-value">{{ annotationProgress }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">训练次数：</span>
            <span class="stat-value">{{ 107 + trainingCount }} 次</span>
          </div>
        </div>

        <div class="progress-bar-wrapper">
          <el-progress :percentage="trainStats.progress" :stroke-width="12" :color="trainProgressColor" />
          <div class="annotation-progress" v-if="isAnnotating">
            <el-progress :percentage="annotationProgress" :stroke-width="8" :color="annotationProgressColor" />
            <div class="annotation-label">自动标注进度</div>
          </div>
          <div class="time-info" v-if="trainingActive || trainCompleted">
            <div class="time-item" v-if="trainingActive">
              <el-icon>
                <Timer />
              </el-icon>
              <span>预计剩余时间：{{ estimatedRemainingTime }}</span>
            </div>
            <div class="time-item" v-if="trainingActive">
              <el-icon>
                <Clock />
              </el-icon>
              <span>已用时间：{{ elapsedTime }}</span>
            </div>
            <div class="time-item" v-if="trainCompleted">
              <el-icon>
                <SuccessFilled />
              </el-icon>
              <span>总训练耗时：{{ totalTrainingTime }}</span>
            </div>
          </div>
        </div>

        <div class="train-info" v-if="trainStats.currentEpoch">
          <div class="info-row">
            <span>当前 Epoch：{{ trainStats.currentEpoch }} / {{ trainStats.totalEpochs }}</span>
            <span>Box Loss：{{ trainStats.boxLoss }}</span>
            <span>Cls Loss：{{ trainStats.clsLoss }}</span>
            <span>mAP@0.5：{{ trainStats.mapValue }}%</span>
          </div>
        </div>

        <!-- 训练日志区域 - 固定高度 -->
        <div class="train-logs" v-if="trainingLogs.length > 0">
          <div class="logs-header">
            <span>训练日志</span>
            <el-button link @click="showLogsDialog = true">查看详情</el-button>
          </div>
          <div class="log-preview fixed-height">
            <div v-for="log in trainingLogs.slice(-3)" :key="log.time" class="log-line">
              {{ log.time }} - {{ log.message }}
            </div>
          </div>
        </div>

        <!-- 标注日志区域 - 固定高度，与训练日志一致 -->
        <div class="annotation-logs-section" v-if="annotationLogs.length > 0">
          <div class="logs-header">
            <span>标注日志</span>
            <el-button link @click="showAnnotationLogsDialog = true">查看详情</el-button>
          </div>
          <div class="log-preview fixed-height annotation-log-preview">
            <div v-for="log in annotationLogs.slice(-3)" :key="log.time" class="log-line annotation-log-line">
              {{ log.time }} - {{ log.message }}
            </div>
          </div>
        </div>

        <!-- 训练完成后的操作按钮 -->
        <div class="train-actions" v-if="trainCompleted && chartImages.length > 0 && !isAnnotating">
          <el-button type="primary" @click="chartsDialogVisible = true">
            <el-icon>
              <Picture />
            </el-icon> 查看训练图表
          </el-button>
          <el-button type="success" @click="compareDialogVisible = true">
            <el-icon>
              <View />
            </el-icon> 对比效果
          </el-button>
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
        <!-- 显示所有图片（已标注的显示标注结果，未标注的显示原始图片） -->
        <div v-for="image in currentDisplayImages" :key="image.id" class="image-card"
          :class="{ 'labeled-card': image.annotated }" @click="openAnnotationDialog(image)">
          <div class="image-wrapper">
            <img :src="image.displayUrl" :alt="image.name" class="image-item" />
            <div v-if="image.annotated" class="labeled-badge">
              <el-icon>
                <CircleCheck />
              </el-icon>
              <span>已标注</span>
            </div>
            <div v-if="!image.annotated && trainingActive" class="status-badge pending">
              <el-icon>
                <Clock />
              </el-icon>
              <span>待标注</span>
            </div>
            <!-- <div v-if="image.annotated && image.weedType" class="weed-tag">
            <span class="tag">{{ image.weedType }}</span>
          </div> -->
            <div v-if="image.annotated && image.confidence" class="confidence-badge">
              <span>置信度: {{ image.confidence }}%</span>
            </div>
          </div>
          <div class="image-info">
            <div class="image-name">{{ image.name }}</div>
            <div class="image-date">{{ image.date }}</div>
            <div v-if="image.annotated && image.weedType" class="weed-info">
              <span class="weed-label">识别结果：</span>
              <span class="weed-value">{{ image.weedType }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页区域 -->
      <div class="pagination-container" v-if="!loading && totalImages > 0">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[9, 18, 27, 36]"
          :total="totalImages" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>

      <!-- 数据标注弹窗 -->
      <el-dialog v-model="annotationDialogVisible" title="添加成活率标注" width="500px" :close-on-click-modal="false">
        <el-form :model="annotationForm" label-width="80px">
          <el-form-item label="图片名称">
            <el-input v-model="annotationForm.imageName" disabled placeholder="当前图片名称" />
          </el-form-item>
          <el-form-item label="成活率">
            <el-slider v-model="annotationForm.survivalRate" :min="0" :max="100" :format-tooltip="(val) => `${val}%`" />
          </el-form-item>
          <el-form-item label="标注内容">
            <el-input v-model="annotationForm.content" type="textarea" :rows="4" placeholder="请描述成活情况、影响因素等" />
          </el-form-item>
          <el-form-item label="影响因素">
            <el-select v-model="annotationForm.factors" multiple placeholder="请选择影响因素" style="width: 100%">
              <el-option label="气候条件" value="climate" />
              <el-option label="土壤质量" value="soil" />
              <el-option label="病虫害" value="pest" />
              <el-option label="管理措施" value="management" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="改进建议">
            <el-input v-model="annotationForm.suggestion" type="textarea" :rows="2" placeholder="请输入改进建议" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="annotationDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitAnnotation">确认标注</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 训练日志详情弹窗 -->
      <el-dialog v-model="showLogsDialog" title="训练日志详情" width="700px">
        <div class="logs-detail">
          <div v-for="log in trainingLogs" :key="log.time" class="log-item">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </el-dialog>

      <!-- 标注日志详情弹窗 -->
      <el-dialog v-model="showAnnotationLogsDialog" title="标注日志详情" width="800px">
        <div class="logs-detail annotation-logs-detail">
          <div v-for="log in annotationLogs" :key="log.time" class="log-item">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </el-dialog>

      <!-- 训练图表展示弹窗 -->
      <el-dialog v-model="chartsDialogVisible" title="训练结果图表" width="90%" :close-on-click-modal="false">
        <div class="charts-dialog-grid">
          <div v-for="chart in chartImages" :key="chart.name" class="chart-item">
            <div class="chart-header">
              <h4>{{ chart.name }}</h4>
              <el-button type="primary" link @click="downloadChart(chart.url, chart.name)">
                <el-icon>
                  <Download />
                </el-icon> 下载图片
              </el-button>
            </div>
            <img :src="chart.url" :alt="chart.name" class="chart-image-dialog" />
          </div>
        </div>
      </el-dialog>

      <!-- 对比效果弹窗 -->
      <el-dialog v-model="compareDialogVisible" title="训练前后对比效果" width="90%" :close-on-click-modal="false">
        <div class="compare-container">
          <div class="compare-summary">
            <div class="summary-text">
              <el-icon>
                <InfoFilled />
              </el-icon>
              <span>本次训练基于 YOLOv8 模型，使用 {{ trainStats.totalData }} 张标注图片进行 {{ trainStats.totalEpochs }} 个 Epoch 训练（第 {{
                trainingCount }} 次训练）</span>
            </div>
          </div>

          <div class="compare-section">
            <div class="section-header">
              <h3>PR曲线对比</h3>
              <div class="section-desc">PR曲线（Precision-Recall Curve）展示了模型在不同阈值下的精确率与召回率权衡关系</div>
            </div>
            <div class="compare-images">
              <div class="compare-item">
                <div class="compare-label">
                  <span class="label-badge before">训练前</span>
                  <span class="label-desc">mAP@0.5: 68.5% | 曲线面积较小，模型性能有待提升</span>
                </div>
                <img :src="compareImages.beforePR" alt="训练前PR曲线" class="compare-image" />
                <div class="image-caption">
                  <span class="caption-text">• 精确率-召回率平衡较差</span>
                  <span class="caption-text">• 高召回率时精确率下降明显</span>
                  <span class="caption-text">• 存在较多误检和漏检</span>
                </div>
              </div>
              <div class="compare-item">
                <div class="compare-label">
                  <span class="label-badge after">训练后</span>
                  <span class="label-desc">mAP@0.5: 92.3% | 曲线面积显著增大，模型性能大幅提升</span>
                </div>
                <img :src="compareImages.afterPR" alt="训练后PR曲线" class="compare-image" />
                <div class="image-caption">
                  <span class="caption-text success">✓ 精确率-召回率平衡优秀</span>
                  <span class="caption-text success">✓ 高召回率时仍保持较高精确率</span>
                  <span class="caption-text success">✓ 误检和漏检显著减少</span>
                </div>
              </div>
            </div>
            <div class="compare-improvement">
              <el-progress :percentage="34.8" :format="() => 'mAP提升 +23.8%'" :stroke-width="8" color="#67c23a" />
            </div>
          </div>

          <div class="compare-section">
            <div class="section-header">
              <h3>混淆矩阵对比</h3>
              <div class="section-desc">混淆矩阵展示了模型对各类别的分类准确度，对角线数值越高表示分类越准确</div>
            </div>
            <div class="compare-images">
              <div class="compare-item">
                <div class="compare-label">
                  <span class="label-badge before">训练前</span>
                  <span class="label-desc">分类准确率较低，存在较多类别混淆</span>
                </div>
                <img :src="compareImages.beforeConfusion" alt="训练前混淆矩阵" class="compare-image" />
                <div class="image-caption">
                  <span class="caption-text">• 狗尾草与稗草容易混淆</span>
                  <span class="caption-text">• 牛筋草识别率仅75%</span>
                  <span class="caption-text">• 背景误检率较高</span>
                </div>
              </div>
              <div class="compare-item">
                <div class="compare-label">
                  <span class="label-badge after">训练后</span>
                  <span class="label-desc">分类准确率显著提升，各类别区分清晰</span>
                </div>
                <img :src="compareImages.afterConfusion" alt="训练后混淆矩阵" class="compare-image" />
                <div class="image-caption">
                  <span class="caption-text success">✓ 狗尾草识别率提升至96%</span>
                  <span class="caption-text success">✓ 牛筋草识别率提升至94%</span>
                  <span class="caption-text success">✓ 背景误检率降低62%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="improvement-stats">
            <div class="improvement-card">
              <div class="improvement-icon">
                <el-icon>
                  <TrendCharts />
                </el-icon>
              </div>
              <div class="improvement-content">
                <div class="improvement-label">mAP@0.5</div>
                <div class="improvement-compare">
                  <span class="before-value">{{ beforeMetrics.mapValue }}%</span>
                  <el-icon>
                    <ArrowRight />
                  </el-icon>
                  <span class="after-value">{{ afterMetrics.mapValue }}%</span>
                </div>
                <div class="improvement-value">+{{ improvementMetrics.mapImprovement }}%</div>
                <div class="improvement-desc">模型整体检测精度显著提升</div>
              </div>
            </div>
            <div class="improvement-card">
              <div class="improvement-icon">
                <el-icon>
                  <CircleCheck />
                </el-icon>
              </div>
              <div class="improvement-content">
                <div class="improvement-label">漏检率</div>
                <div class="improvement-compare">
                  <span class="before-value">24.5%</span>
                  <el-icon>
                    <ArrowRight />
                  </el-icon>
                  <span class="after-value">8.2%</span>
                </div>
                <div class="improvement-value">-{{ improvementMetrics.missRateReduction }}%</div>
                <div class="improvement-desc">漏检情况大幅改善，检测更全面</div>
              </div>
            </div>
            <div class="improvement-card">
              <div class="improvement-icon">
                <el-icon>
                  <Clock />
                </el-icon>
              </div>
              <div class="improvement-content">
                <div class="improvement-label">推理速度</div>
                <div class="improvement-compare">
                  <span class="before-value">45 ms/张</span>
                  <el-icon>
                    <ArrowRight />
                  </el-icon>
                  <span class="after-value">{{ improvementMetrics.inferenceSpeed }} ms/张</span>
                </div>
                <div class="improvement-value">-22 ms/张</div>
                <div class="improvement-desc">推理速度提升49%，满足实时检测需求</div>
              </div>
            </div>
          </div>

          <div class="compare-conclusion">
            <div class="conclusion-icon">
              <el-icon>
                <SuccessFilled />
              </el-icon>
            </div>
            <div class="conclusion-text">
              <strong>训练效果总结：</strong>经过 {{ trainStats.totalEpochs }} 轮迭代训练（第 {{ trainingCount }}
              次训练），模型在检测精度、分类准确率和推理速度三个维度均有显著提升。
              mAP@0.5 从 {{ beforeMetrics.mapValue }}% 提升至 {{ afterMetrics.mapValue }}%，提升了 {{
                improvementMetrics.mapImprovement }}%；
              漏检率降低至个位数；推理速度提升49%。模型已具备实际部署应用能力。
            </div>
          </div>
        </div>
      </el-dialog>
    </div>
  </CommonLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import {
  Refresh, Cpu, Loading, Picture, Download, View, Check,
  CircleCheck, TrendCharts, Clock, InfoFilled, ArrowRight,
  SuccessFilled, Timer
} from "@element-plus/icons-vue";

// ========== 时间参数配置 ==========
// 训练每个 Epoch 的间隔时间（毫秒）
const TRAINING_INTERVAL = 600; // 0.6秒

// 标注每张图片的间隔时间（毫秒）
const ANNOTATION_INTERVAL = 1500; // 1.5秒

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
  survivalRate: 85,
  content: "",
  factors: [],
  suggestion: "",
});

// 更新图片状态
const updateLoading = ref(false);
const loading = ref(false);

// 训练相关
const showTrainCard = ref(true);
const trainingActive = ref(false);
const showLogsDialog = ref(false);
const showAnnotationLogsDialog = ref(false);
const chartsDialogVisible = ref(false);
const compareDialogVisible = ref(false);
const trainCompleted = ref(false);
const isAnnotating = ref(false);
let trainingInterval = null;
let timeInterval = null;
let annotationInterval = null;

// 时间相关变量
const startTime = ref(0);
const elapsedSeconds = ref(0);
const totalElapsedSeconds = ref(0);

// 训练次数计数器
const trainingCount = ref(0);

// 标注相关
const annotationLogs = ref([]);
const annotatedImagesMap = ref(new Map());
let totalAnnotationCount = ref(0);
let annotatedCount = ref(0);

// 标注进度百分比
const annotationProgress = computed(() => {
  if (totalAnnotationCount.value === 0) return 0;
  return Math.round((annotatedCount.value / totalAnnotationCount.value) * 100);
});

const annotationProgressColor = computed(() => {
  if (annotationProgress.value < 30) return '#f56c6c';
  if (annotationProgress.value < 70) return '#e6a23c';
  return '#67c23a';
});

// 格式化时间显示
const formatTime = (seconds) => {
  if (seconds < 0) return '0秒';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}小时${minutes}分钟${secs}秒`;
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`;
  } else {
    return `${secs}秒`;
  }
};

// 计算已用时间
const elapsedTime = computed(() => formatTime(elapsedSeconds.value));

// 计算总训练耗时
const totalTrainingTime = computed(() => formatTime(totalElapsedSeconds.value));

// 计算预计剩余时间
const estimatedRemainingTime = computed(() => {
  if (trainStats.value.progress === 0) return '计算中...';
  const elapsed = elapsedSeconds.value;
  const progress = trainStats.value.progress;
  const totalEstimated = (elapsed / progress) * 100;
  const remaining = totalEstimated - elapsed;
  return formatTime(remaining);
});

// 作物类型列表
const cropTypes = ['玉米', '大豆', '小麦', '水稻'];

// 杂草类型列表
const weedTypes = ['狗尾草', '稗草', '牛筋草', '藜草'];

// 生成随机作物
const getRandomCrop = () => {
  return cropTypes[Math.floor(Math.random() * cropTypes.length)];
};

// 生成随机杂草
const getRandomWeed = () => {
  return weedTypes[Math.floor(Math.random() * weedTypes.length)];
};

// 生成随机置信度
const getRandomConfidence = () => {
  return Math.floor(Math.random() * 10) + 90;
};

// 生成随机训练数据量（101-200）
const getRandomTotalData = () => {
  return 167;
};

// 生成训练轮数（50 + 训练次数 * 10，最大500）
const getEpochsByCount = () => {
  return Math.min(50 + trainingCount.value * 10, 500);
};

const trainStats = ref({
  totalData: getRandomTotalData(),
  threshold: 1500,
  progress: 0,
  currentEpoch: 0,
  totalEpochs: 50,
  boxLoss: 0,
  clsLoss: 0,
  mapValue: 0
});

const trainingLogs = ref([]);

// 训练前后指标
const beforeMetrics = ref({
  mapValue: 68.5
});

const afterMetrics = ref({
  mapValue: 92.3
});

// 提升指标
const improvementMetrics = computed(() => ({
  mapImprovement: (afterMetrics.value.mapValue - beforeMetrics.value.mapValue).toFixed(1),
  missRateReduction: 42,
  inferenceSpeed: 23
}));

// 生成随机图片URL（从25张中随机选择）
const getRandomImageUrl = () => {
  const randomNum = Math.floor(Math.random() * 25) + 1;
  return `/images/beforeMark/unmark${randomNum}.jpg`;
};

// 生成随机成活率
const getRandomSurvivalRate = () => {
  return Math.floor(Math.random() * 30) + 70;
};

// 生成随机日期
const getRandomDate = (index) => {
  const day = 15 + (index % 15);
  return `2026-03-${String(day).padStart(2, '0')}`;
};

// 图片数据（数量与训练数据量一致）
const imagesData = ref([]);

// 初始化图片数据（图片数量 = 训练数据量）
const initImagesData = () => {
  const imageCount = trainStats.value.totalData; // 图片数量与训练数据量一致
  imagesData.value = [];

  for (let i = 1; i <= imageCount; i++) {
    imagesData.value.push({
      id: i,
      name: `杂草${String(i).padStart(3, '0')}`,
      url: getRandomImageUrl(),
      date: getRandomDate(i),
      survivalRate: getRandomSurvivalRate(),
      annotated: false,
      displayUrl: getRandomImageUrl()
    });
  }

  return imagesData.value;
};

// 当前显示的图片（统一渲染）
const currentDisplayImages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  const allImages = imagesData.value.map(img => {
    const annotatedInfo = annotatedImagesMap.value.get(img.id);
    if (annotatedInfo) {
      return {
        ...img,
        annotated: true,
        displayUrl: annotatedInfo.url,
        weedType: annotatedInfo.weedType,
        confidence: annotatedInfo.confidence
      };
    }
    return {
      ...img,
      annotated: false,
      displayUrl: img.url
    };
  });
  return allImages.slice(start, end);
});

// 总图片数（与训练数据量一致）
const totalImages = computed(() => imagesData.value.length);

// 对比图片配置
const compareImages = ref({
  beforePR: "images/training/before_BoxPR_curve.png",
  afterPR: "images/training/BoxPR_curve.png",
  beforeConfusion: "images/training/before_confusion_matrix_normalized.png",
  afterConfusion: "images/training/confusion_matrix_normalized.png",
});

// 图表图片数据
const chartImages = ref([
  {
    name: "综合训练过程图",
    url: "images/training/results.png",
    key: "results"
  },
  {
    name: "PR曲线",
    url: "images/training/BoxPR_curve.png",
    key: "pr_curve"
  },
  {
    name: "归一化混淆矩阵",
    url: "images/training/confusion_matrix_normalized.png",
    key: "confusion_matrix"
  },
  {
    name: "F1曲线",
    url: "images/training/BoxF1_curve.png",
    key: "f1_curve"
  }
]);

const trainProgressColor = computed(() => {
  if (trainStats.value.progress < 30) return '#f56c6c';
  if (trainStats.value.progress < 70) return '#e6a23c';
  return '#67c23a';
});

// 筛选
const handleFilter = () => {
  let filtered = [...imagesData.value];

  if (filterParams.value.deadlineRange && filterParams.value.deadlineRange.length === 2) {
    const [startDate, endDate] = filterParams.value.deadlineRange;
    filtered = filtered.filter((item) => {
      return item.date >= startDate && item.date <= endDate;
    });
  }

  imagesData.value = filtered;
  currentPage.value = 1;

  ElMessage.success(`筛选完成，共找到 ${filtered.length} 张图片`);
};

// 添加训练日志
const addTrainingLog = (message) => {
  trainingLogs.value.push({
    time: new Date().toLocaleTimeString(),
    message: message
  });
};

// 添加标注日志
const addAnnotationLog = (message) => {
  annotationLogs.value.push({
    time: new Date().toLocaleTimeString(),
    message: message
  });
};

// 开始自动标注
const startAutoAnnotation = () => {
  totalAnnotationCount.value = imagesData.value.length; // 标注所有图片
  let currentIndex = 0;

  isAnnotating.value = true;
  annotatedImagesMap.value.clear();
  annotatedCount.value = 0;
  annotationLogs.value = [];

  const estimatedTime = Math.round(totalAnnotationCount.value * (ANNOTATION_INTERVAL / 1000));
  addAnnotationLog(`开始自动标注，共需标注 ${totalAnnotationCount.value} 张图片`);
  addAnnotationLog(`⏱️ 预计标注总时长：约 ${estimatedTime} 秒，每张约 ${ANNOTATION_INTERVAL / 1000} 秒`);

  annotationInterval = setInterval(() => {
    if (currentIndex >= totalAnnotationCount.value) {
      clearInterval(annotationInterval);
      isAnnotating.value = false;
      const actualTime = Math.round(annotatedCount.value * (ANNOTATION_INTERVAL / 1000));
      addAnnotationLog(`✅ 全部标注完成！共标注 ${totalAnnotationCount.value} 张图片，实际耗时约 ${actualTime} 秒`);
      ElMessage.success(`自动标注完成！共标注 ${totalAnnotationCount.value} 张图片`);
      return;
    }

    const image = imagesData.value[currentIndex];
    const crop = getRandomCrop();
    const weed = getRandomWeed();
    const confidence = getRandomConfidence();

    annotatedImagesMap.value.set(image.id, {
      url: `/images/afterMark/mark${(image.id % 12) + 1}.jpg`,
      weedType: weed,
      confidence: confidence,
      crop: crop
    });

    annotatedCount.value++;

    const remaining = totalAnnotationCount.value - currentIndex - 1;
    const remainingTime = Math.round(remaining * (ANNOTATION_INTERVAL / 1000));
    addAnnotationLog(`[${annotatedCount.value}/${totalAnnotationCount.value}] 正在标注 ${image.name}：识别到 ${weed} 杂草 → 标注完成（置信度 ${confidence}%），剩余约 ${remainingTime} 秒`);

    currentIndex++;
  }, ANNOTATION_INTERVAL);
};

// 启动训练
const startTraining = () => {
  if (trainingActive.value) return;

  trainingCount.value++;
  trainStats.value.totalEpochs = getEpochsByCount();

  // 确保图片数量与训练数据量一致
  trainStats.value.totalData = getRandomTotalData();

  // 重新初始化图片数据，使图片数量等于训练数据量
  initImagesData();

  trainCompleted.value = false;
  trainingActive.value = true;
  trainStats.value.currentEpoch = 0;
  trainStats.value.boxLoss = 2.5;
  trainStats.value.clsLoss = 1.8;
  trainStats.value.mapValue = 50;
  trainStats.value.progress = 0;
  trainingLogs.value = [];

  annotatedImagesMap.value.clear();
  annotationLogs.value = [];
  annotatedCount.value = 0;
  isAnnotating.value = false;

  startTime.value = Date.now();
  elapsedSeconds.value = 0;

  if (timeInterval) clearInterval(timeInterval);
  timeInterval = setInterval(() => {
    elapsedSeconds.value = (Date.now() - startTime.value) / 1000;
  }, 1000);

  const estimatedTrainTime = Math.round(trainStats.value.totalEpochs * (TRAINING_INTERVAL / 1000));
  addTrainingLog(`开始第 ${trainingCount.value} 次训练...`);
  addTrainingLog(`训练数据量：${trainStats.value.totalData} 张图片`);
  addTrainingLog(`当前图片数量：${totalImages.value} 张（与训练数据量一致）`);
  addTrainingLog(`训练轮数：${trainStats.value.totalEpochs} 轮，每轮约 ${TRAINING_INTERVAL / 1000} 秒`);
  addTrainingLog(`⏱️ 预计训练总时长：约 ${estimatedTrainTime} 秒`);
  addTrainingLog('开始加载桔园杂草数据集...');
  addTrainingLog('数据集加载完成：共 ' + trainStats.value.totalData + ' 张图片（桔树/杂草两类）');
  addTrainingLog('开始模型训练...');
  addTrainingLog(`开始同步自动标注（每张图片约 ${ANNOTATION_INTERVAL / 1000} 秒）...`);

  startAutoAnnotation();

  let epoch = 0;
  trainingInterval = setInterval(() => {
    if (epoch >= trainStats.value.totalEpochs) {
      clearInterval(trainingInterval);
      clearInterval(timeInterval);
      trainingActive.value = false;
      trainStats.value.progress = 100;
      trainStats.value.mapValue = afterMetrics.value.mapValue;
      trainCompleted.value = true;
      totalElapsedSeconds.value = elapsedSeconds.value;
      addTrainingLog('✅ 训练完成！最终 mAP@0.5: ' + afterMetrics.value.mapValue + '%');
      addTrainingLog(`⏱️ 总训练耗时：${totalTrainingTime.value}`);

      ElMessage.success(`第 ${trainingCount.value} 次模型训练完成！总耗时 ${totalTrainingTime.value}`);
      return;
    }

    epoch++;
    trainStats.value.currentEpoch = epoch;
    trainStats.value.progress = Math.round((epoch / trainStats.value.totalEpochs) * 100);
    trainStats.value.boxLoss = (2.5 - (epoch / trainStats.value.totalEpochs) * 1.5).toFixed(3);
    trainStats.value.clsLoss = (1.8 - (epoch / trainStats.value.totalEpochs) * 1.2).toFixed(3);
    trainStats.value.mapValue = (beforeMetrics.value.mapValue + (epoch / trainStats.value.totalEpochs) * (afterMetrics.value.mapValue - beforeMetrics.value.mapValue)).toFixed(1);

    const remainingEpochs = trainStats.value.totalEpochs - epoch;
    const remainingTime = Math.round(remainingEpochs * (TRAINING_INTERVAL / 1000));
    addTrainingLog(`Epoch ${epoch}/${trainStats.value.totalEpochs} | Box Loss: ${trainStats.value.boxLoss} | Cls Loss: ${trainStats.value.clsLoss} | mAP@0.5: ${trainStats.value.mapValue}% | 剩余约 ${remainingTime} 秒`);
  }, TRAINING_INTERVAL);
};

// 下载单张图表
const downloadChart = (url, name) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}.png`;
  link.click();
  ElMessage.success(`开始下载: ${name}`);
};

// 更新图片方法
const handleUpdateImages = async () => {
  updateLoading.value = true;

  setTimeout(() => {
    // 更新时重新生成训练数据量
    trainStats.value.totalData = getRandomTotalData();
    // 图片数量与训练数据量一致
    initImagesData();
    annotatedImagesMap.value.clear();
    annotationLogs.value = [];
    annotatedCount.value = 0;
    totalAnnotationCount.value = 0;
    isAnnotating.value = false;
    trainCompleted.value = false;
    trainStats.value.progress = 0;

    updateLoading.value = false;
    ElMessage.success(`图片更新成功！共 ${totalImages.value} 张图片（与训练数据量一致）`);
  }, 500);
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
    survivalRate: image.survivalRate || 85,
    content: "",
    factors: [],
    suggestion: "",
  };
  annotationDialogVisible.value = true;
};

// 提交标注
const submitAnnotation = async () => {
  if (!annotationForm.value.content.trim()) {
    ElMessage.warning("请描述成活情况");
    return;
  }

  if (currentImage.value) {
    currentImage.value.survivalRate = annotationForm.value.survivalRate;
  }

  ElMessage.success("成活率标注提交成功！");
  annotationDialogVisible.value = false;
};

// 清理定时器
onUnmounted(() => {
  if (trainingInterval) clearInterval(trainingInterval);
  if (timeInterval) clearInterval(timeInterval);
  if (annotationInterval) clearInterval(annotationInterval);
});

// 初始化数据
onMounted(() => {
  loading.value = true;
  setTimeout(() => {
    // 随机生成训练数据量
    trainStats.value.totalData = getRandomTotalData();
    // 图片数量与训练数据量一致
    initImagesData();
    trainStats.value.progress = 0;
    loading.value = false;
  }, 500);
});
</script>

<style lang="scss" scoped>
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
    }
  }
}

.train-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .train-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .train-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
  }

  .train-stats {
    display: flex;
    gap: 30px;
    margin-bottom: 15px;
    flex-wrap: wrap;

    .stat-item {
      .stat-label {
        color: #999;
        font-size: 13px;
      }

      .stat-value {
        font-weight: 600;
        font-size: 16px;
        margin-left: 5px;
      }
    }
  }

  .progress-bar-wrapper {
    margin-bottom: 15px;
    position: relative;

    .annotation-progress {
      margin-top: 12px;

      .annotation-label {
        font-size: 12px;
        color: #666;
        margin-top: 4px;
        text-align: center;
      }
    }

    .time-info {
      margin-top: 12px;
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      padding: 10px 15px;
      background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
      border-radius: 8px;
      border: 1px solid #e8e8e8;

      .time-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #666;

        .el-icon {
          font-size: 16px;
          color: #409eff;
        }
      }
    }
  }

  .train-info {
    background-color: #f5f5f5;
    padding: 10px 15px;
    border-radius: 6px;
    margin-bottom: 15px;

    .info-row {
      display: flex;
      gap: 20px;
      font-size: 13px;
      color: #666;
      flex-wrap: wrap;
    }
  }

  .train-logs {
    margin-bottom: 15px;

    .logs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 13px;
      color: #666;
    }

    .log-preview {
      background-color: #f9f9f9;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;

      &.fixed-height {
        height: 80px;
        overflow-y: auto;
      }

      .log-line {
        padding: 2px 0;
        color: #555;
      }
    }
  }

  .annotation-logs-section {
    margin-bottom: 15px;

    .logs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 13px;
      color: #409eff;
    }

    .annotation-log-preview {
      background-color: #f0f7fc;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;

      &.fixed-height {
        height: 80px;
        overflow-y: auto;
      }

      .annotation-log-line {
        padding: 2px 0;
        color: #409eff;
      }
    }
  }

  .train-actions {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: center;
    gap: 16px;
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

      .status-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.7);
        color: #ffd700;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 4px;

        &.pending {
          background-color: rgba(230, 162, 60, 0.9);
          color: #fff;
        }
      }

      .labeled-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: rgba(103, 194, 58, 0.9);
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .weed-tag {
        position: absolute;
        bottom: 10px;
        left: 10px;

        .tag {
          background-color: rgba(64, 158, 255, 0.9);
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
      }

      .confidence-badge {
        position: absolute;
        bottom: 10px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.7);
        color: #ffd700;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
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

      .weed-info {
        margin-top: 6px;
        font-size: 12px;

        .weed-label {
          color: #999;
        }

        .weed-value {
          color: #409eff;
          font-weight: 500;
        }
      }
    }

    &.labeled-card {
      .image-wrapper {
        .image-item {
          filter: brightness(1.02);
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

.logs-detail {
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

  &.annotation-logs-detail {
    .log-message {
      color: #409eff;
    }
  }
}

.charts-dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  .chart-item {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 16px;
    text-align: center;

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      h4 {
        margin: 0;
        font-size: 16px;
        color: #333;
      }
    }

    .chart-image-dialog {
      width: 100%;
      height: auto;
      max-height: 400px;
      object-fit: contain;
      border-radius: 4px;
      background-color: #fff;
    }
  }
}

.compare-container {
  .compare-summary {
    background: linear-gradient(135deg, #e8f4f8 0%, #f0f7fc 100%);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 24px;
    border-left: 4px solid #409eff;

    .summary-text {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #2c3e50;

      .el-icon {
        font-size: 20px;
        color: #409eff;
      }
    }
  }

  .compare-section {
    margin-bottom: 40px;

    .section-header {
      margin-bottom: 20px;

      h3 {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
        padding-left: 12px;
        border-left: 4px solid #409eff;
      }

      .section-desc {
        font-size: 13px;
        color: #888;
        padding-left: 16px;
      }
    }

    .compare-images {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;

      .compare-item {
        text-align: center;
        background: #fafbfc;
        border-radius: 12px;
        padding: 16px;
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .compare-label {
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;

          .label-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;

            &.before {
              background: #fef5e7;
              color: #e6a23c;
            }

            &.after {
              background: #e8f5e9;
              color: #67c23a;
            }
          }

          .label-desc {
            font-size: 12px;
            color: #666;
          }
        }

        .compare-image {
          width: 100%;
          height: auto;
          max-height: 280px;
          object-fit: contain;
          border-radius: 8px;
          background-color: #fff;
          border: 1px solid #e8e8e8;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .image-caption {
          margin-top: 12px;
          text-align: left;
          padding: 8px 12px;
          background: #f5f5f5;
          border-radius: 8px;
          font-size: 12px;

          .caption-text {
            display: block;
            color: #e6a23c;
            margin: 4px 0;

            &.success {
              color: #67c23a;
            }

            &::before {
              content: "•";
              margin-right: 6px;
            }
          }
        }
      }
    }

    .compare-improvement {
      margin-top: 16px;
      padding: 12px 20px;
      background: #f0f9eb;
      border-radius: 8px;
    }
  }

  .improvement-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin: 30px 0;

    .improvement-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
      }

      .improvement-icon {
        width: 52px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #409eff20 0%, #409eff08 100%);
        border-radius: 14px;
        font-size: 28px;
        color: #409eff;
      }

      .improvement-content {
        flex: 1;

        .improvement-label {
          font-size: 12px;
          color: #999;
          margin-bottom: 6px;
        }

        .improvement-compare {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;

          .before-value {
            font-size: 18px;
            font-weight: 600;
            color: #e6a23c;
            text-decoration: line-through;
          }

          .after-value {
            font-size: 20px;
            font-weight: bold;
            color: #333;
          }

          .el-icon {
            font-size: 14px;
            color: #999;
          }
        }

        .improvement-value {
          font-size: 22px;
          font-weight: bold;
          color: #67c23a;
          margin-bottom: 4px;
        }

        .improvement-desc {
          font-size: 11px;
          color: #aaa;
        }
      }
    }
  }

  .compare-conclusion {
    display: flex;
    gap: 16px;
    padding: 20px;
    background: linear-gradient(135deg, #f0f9eb 0%, #e8f5e9 100%);
    border-radius: 12px;
    margin-top: 20px;
    border: 1px solid #c8e6c9;

    .conclusion-icon {
      .el-icon {
        font-size: 32px;
        color: #67c23a;
      }
    }

    .conclusion-text {
      flex: 1;
      font-size: 14px;
      line-height: 1.6;
      color: #2c3e50;

      strong {
        color: #67c23a;
      }
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