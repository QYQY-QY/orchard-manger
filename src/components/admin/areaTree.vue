<template>
  <div class="zone-main">
    <div class="map-container" v-if="!activeAreaId">
      <div class="map-tips">请先选择或</div>
    </div>

    <div class="tree-list-container" v-if="activeAreaId">
      <div class="zone-info">
        <div>
          <h3>区域：{{ fullZoneInfo.name || activeZone.name }}</h3>
          <p class="zone-desc">
            负责人：{{ fullZoneInfo.areaManagerName || "未设置" }} | 品种：{{
              fullZoneInfo.type || activeZone.type || "-"
            }}
            | 果树总数：{{
              sortedTreeList.length ||
              fullZoneInfo.size ||
              fullZoneInfo.fruitCount ||
              activeZone.size ||
              0
            }}
          </p>
        </div>
        <div
          style="
            margin-top: 20px;
            text-align: right;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          "
        >
          <el-button
            type="primary"
            @click="batchGenerateQRCode"
            :loading="generateQRLoading"
          >
            批量生成二维码
          </el-button>
          <el-button
            type="success"
            @click="batchDownloadQRCode"
            :loading="downloadQRLoading"
            :disabled="!sortedTreeList.some((item) => item.url)"
          >
            批量下载二维码
          </el-button>
        </div>
      </div>

      <el-table
        :data="sortedTreeList"
        border
        stripe
        style="width: 100%; margin-top: 20px"
        :header-cell-style="{ backgroundColor: '#f8f9fa' }"
        :empty-text="`该区域暂无果树数据`"
        row-class-name="tree-row"
      >
        <el-table-column label="果树编号" min-width="120">
          <template #default="scope">
            {{ fullZoneInfo.name || activeZone.name }}-{{
              scope.row.location || "-"
            }}
          </template>
        </el-table-column>
        <el-table-column label="果实总数" min-width="100">
          <template #default="scope">
            {{ scope.row.countNum || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="成熟果实数" min-width="100">
          <template #default="scope">
            {{ scope.row.ripeNum || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="成熟度" min-width="100">
          <template #default="scope">
            <el-tag
              size="small"
              :type="
                getRipeDegreeTagType(scope.row.countNum, scope.row.ripeNum)
              "
            >
              {{ formatRipeDegree(scope.row.countNum, scope.row.ripeNum) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="健康状态" min-width="100">
          <template #default="scope">
            <el-tag
              size="small"
              :type="getHealthStatusType(scope.row.healthCondition)"
            >
              {{ formatHealthStatus(scope.row.healthCondition) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="二维码" min-width="100">
          <template #default="scope">
            <div class="qrcode-container" v-if="scope.row.url">
              <el-image
                :src="scope.row.url"
                fit="contain"
                class="qrcode-img"
                @click="handleQRCodeClick(scope.row.url)"
                :preview-src-list="[scope.row.url]"
              >
                <template #error>
                  <div class="image-slot">图片加载失败</div>
                </template>
              </el-image>
              <el-button
                size="mini"
                icon="el-icon-download"
                class="qrcode-download-btn"
                @click.stop="downloadQRCode(scope.row.url, scope.row.id)"
                link
              ></el-button>
            </div>
            <span class="no-qrcode" v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="auto">
          <template #default="scope">
            <el-button
              size="small"
              link
              @click="handleShowTreeDetail(scope.row)"
            >
              查看详情
            </el-button>
            <el-button
              size="small"
              link
              text-color="danger"
              @click="handleDeleteTree(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </div>

    <el-dialog
      v-model="showTreeDetailDialog"
      title="果树详情"
      width="800px"
      center
      :close-on-click-modal="false"
    >
      <div class="tree-log-content">
        <div
          style="
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f5f7fa;
            border-radius: 4px;
          "
        >
          <el-row :gutter="20">
            <el-col :span="8"
              ><strong>果树ID：</strong>{{ currentTree.id }}</el-col
            >
            <el-col :span="8"
              ><strong>品种：</strong>{{ currentTree.type || "-" }}</el-col
            >
            <el-col :span="8"
              ><strong>所属区域：</strong
              >{{ currentTree.areaName || currentTree.areaId || "-" }}</el-col
            >
          </el-row>
        </div>

        <!-- 总任务数、浇水、施肥、防治、修剪 -->
        <el-row :gutter="20" style="margin-bottom: 20px">
          <el-col :span="4">
            <el-card shadow="hover" style="text-align: center">
              <h3 style="margin: 0; color: #000">
                {{ taskList.length || 0 }}
              </h3>
              <div style="font-size: 12px; color: #666">总任务数</div>
            </el-card>
          </el-col>
          <el-col :span="5">
            <el-card shadow="hover" style="text-align: center">
              <h3 style="margin: 0; color: #409eff">
                {{
                  taskList?.filter(
                    (task) => task.taskType === "灌溉"
                  ).length || 0
                }}
              </h3>
              <div style="font-size: 12px; color: #666">浇水任务</div>
            </el-card>
          </el-col>
          <el-col :span="5">
            <el-card shadow="hover" style="text-align: center">
              <h3 style="margin: 0; color: #e6a23c">
                {{
                  taskList?.filter(
                    (task) => task.taskType === "施肥"
                  ).length || 0
                }}
              </h3>
              <div style="font-size: 12px; color: #666">施肥任务</div>
            </el-card>
          </el-col>
          <el-col :span="5">
            <el-card shadow="hover" style="text-align: center">
              <h3 style="margin: 0; color: #f56c6c">
                {{
                  taskList?.filter(
                    (task) => task.taskType === "防治"
                  ).length || 0
                }}
              </h3>
              <div style="font-size: 12px; color: #666">防治任务</div>
            </el-card>
          </el-col>
          <el-col :span="5">
            <el-card shadow="hover" style="text-align: center">
              <h3 style="margin: 0; color: #67c23a">
                {{
                  taskList?.filter(
                    (task) => task.taskType === "修剪"
                  ).length || 0
                }}
              </h3>
              <div style="font-size: 12px; color: #666">修剪任务</div>
            </el-card>
          </el-col>
        </el-row>

        <h4 style="margin: 20px 0 10px; color: #333; border-left: 4px solid #f56c6c; padding-left: 12px;">
          任务执行记录
          <el-badge :value="taskList.length" :hidden="taskList.length === 0" style="margin-left: 10px" />
        </h4>

        <el-timeline v-if="taskList.length > 0">
          <el-timeline-item
            v-for="task in taskList"
            :key="task.id"
            :timestamp="task.createTime"
            placement="top"
            :type="getTaskTypeTag(task.taskType)"
            :color="getTaskColor(task.taskType)"
          >
            <el-card shadow="hover" style="margin-bottom: 10px">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <el-tag :type="getTaskTypeTag(task.taskType)" size="small">
                  {{ task.taskType || "未知任务" }}
                </el-tag>
                <span style="font-size:12px;color:#999">状态：{{ getTaskStatus(task.status) }}</span>
              </div>

              <div style="margin-top:10px; font-weight:bold; font-size:14px;">
                {{ task.taskTitle || "无标题任务" }}
              </div>

              <el-descriptions :column="2" size="small" style="margin-top:10px">
                <el-descriptions-item label="负责人">{{ task.receiverName || "未分配" }}</el-descriptions-item>
                <el-descriptions-item label="优先级">{{ task.priority || "普通" }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ task.createTime }}</el-descriptions-item>
                <el-descriptions-item label="截止时间">{{ task.deadline || "无" }}</el-descriptions-item>
              </el-descriptions>

              <div v-if="task.taskInfo" style="margin-top:8px; padding:8px; background:#f8f9fa; border-radius:4px;">
                <strong>任务说明：</strong>{{ task.taskInfo }}
              </div>

              <div v-if="task.imgsURL && task.imgsURL.length > 0" style="margin-top:10px; display:flex; gap:8px;">
                <el-image
                  v-for="(img, idx) in task.imgsURL"
                  :key="idx"
                  :src="img"
                  fit="cover"
                  style="width:60px; height:60px; border-radius:4px;"
                  :preview-src-list="task.imgsURL"
                />
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>

        <el-empty v-else description="暂无任务记录" :image-size="100" />

        <el-timeline v-if="sortedLogs.length > 0">
          <el-timeline-item
            v-for="log in sortedLogs"
            :key="log.id"
            :timestamp="log.createTime"
            placement="top"
            :type="getLogTypeTag(log.type)"
            :color="getLogColor(log.type)"
          >
            <el-card shadow="hover" style="margin-bottom: 10px">
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                "
              >
                <el-tag
                  :type="
                    log.type === '1'
                      ? 'primary'
                      : log.type === '2'
                      ? 'success'
                      : 'info'
                  "
                  size="small"
                >
                  {{ formatLogType(log.type) }}
                </el-tag>
                <span style="font-size: 12px; color: #999"
                  >日志ID: {{ log.id }}</span
                >
              </div>

              <el-descriptions
                :column="2"
                size="small"
                style="margin-top: 10px"
              >
                <el-descriptions-item label="施用量">
                  {{ log.num || 0 }} {{ log.unit || "-" }}
                </el-descriptions-item>
                <el-descriptions-item label="操作方式">
                  {{ log.operationMethod || "-" }}
                </el-descriptions-item>
                <el-descriptions-item label="操作时间">
                  {{ log.operationTime || "-" }}
                </el-descriptions-item>
                <el-descriptions-item label="更新时间">
                  {{ log.updateTime || "-" }}
                </el-descriptions-item>
                <el-descriptions-item label="创建用户">
                  {{ log.createUser || "-" }}
                </el-descriptions-item>
                <el-descriptions-item label="更新用户">
                  {{ log.updateUser || "-" }}
                </el-descriptions-item>
              </el-descriptions>

              <div
                v-if="log.content"
                style="
                  margin-top: 8px;
                  padding: 8px;
                  background-color: #f8f9fa;
                  border-radius: 4px;
                "
              >
                <strong>备注内容：</strong>{{ log.content }}
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>

      </div>
      <div class="comment-section" style="margin-top: 30px">
        <h4
          style="
            margin-bottom: 15px;
            color: #333;
            border-left: 4px solid #409eff;
            padding-left: 12px;
          "
        >
          果树评论
          <el-badge
            :value="commentList.length"
            :hidden="commentList.length === 0"
            style="margin-left: 10px"
          />
        </h4>

        <div v-if="commentList.length > 0" class="comment-list">
          <div
            v-for="comment in commentList"
            :key="comment.id"
            class="comment-item"
          >
            <div class="comment-header">
              <div class="comment-user">
                <el-avatar
                  :src="
                    comment.createUserImg ||
                    'https://avatars.dicebear.com/api/pixel-art/avatar1.svg'
                  "
                  :size="40"
                />
                <div class="user-info">
                  <span class="user-name">{{
                    comment.createUserName || "匿名用户"
                  }}</span>
                  <span class="comment-time">{{
                    formatTime(comment.createTime)
                  }}</span>
                </div>
              </div>
              <el-rate
                :model-value="getRateValue(comment.choice)"
                disabled
                show-score
                :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
                :texts="['很差', '较差', '一般', '较好', '很好']"
                :size="14"
              />
            </div>
            <div class="comment-content">{{ comment.content }}</div>
            <div
              v-if="comment.multipleImgs && comment.multipleImgs.length > 0"
              class="comment-imgs"
            >
              <el-image
                v-for="(img, idx) in comment.multipleImgs"
                :key="idx"
                :src="img"
                fit="cover"
                style="
                  width: 80px;
                  height: 80px;
                  margin-right: 10px;
                  border-radius: 4px;
                "
                :preview-src-list="comment.multipleImgs"
              />
            </div>
          </div>
        </div>

        <el-empty v-else description="暂无评论" :image-size="80" />
      </div>
      <template #footer>
        <el-button @click="showTreeDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showQRViewer"
      title="二维码预览"
      width="400px"
      center
      :close-on-click-modal="true"
    >
      <div style="text-align: center; padding: 20px">
        <el-image
          :src="qrViewerUrl"
          style="width: 300px; height: 300px"
          fit="contain"
        >
          <template #error>
            <div
              style="
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #999;
              "
            >
              图片加载失败
            </div>
          </template>
        </el-image>
        <el-button
          type="primary"
          size="mini"
          style="margin-top: 20px"
          @click="downloadQRCode(qrViewerUrl, '预览二维码')"
        >
          下载二维码
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const downloadQRLoading = ref(false);
const commentList = ref([]);
const commentLoading = ref(false);
const taskList = ref([]);

const props = defineProps({
  activeAreaId: {
    type: [String, Number],
    required: true,
    default: "",
  },
  activeZone: {
    type: Object,
    required: true,
    default: () => ({ trees: [], number: "", name: "", type: "", size: 0 }),
  },
  treeList: {
    type: Array,
    required: true,
    default: () => [],
  },
  fullZoneInfo: {
    type: Object,
    required: false,
    default: () => ({
      id: "",
      name: "",
      description: "",
      empId: "",
      areaManagerName: "",
      type: "",
      fruitCount: "",
      size: 0,
      orchardId: "",
      number: "",
    }),
  },
});

const emit = defineEmits(["tree-delete", "tree-list-update"]);

const generateQRLoading = ref(false);
const showQRViewer = ref(false);
const qrViewerUrl = ref("");
const showTreeDetailDialog = ref(false);
const currentTree = reactive({});
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const sortedTreeList = computed(() => {
  const validTrees = (props.treeList || []).filter((tree) => {
    return tree && tree.id !== undefined && tree.id !== null && tree.id !== "";
  });

  const adaptedTrees = validTrees.map((tree) => ({
    ...tree,
    id: tree.id || "",
    type: tree.type || "",
    countNum: tree.countNum || "0",
    ripeNum: tree.ripeNum || "0",
    url: tree.url || null,
    areaId: tree.areaId || "",
    location: tree.location || null,
  }));
  return adaptedTrees;
});

const sortedLogs = computed(() => {
  if (!currentTree || !currentTree.logs || !Array.isArray(currentTree.logs)) {
    return [];
  }
  return [...currentTree.logs].sort((a, b) => {
    return new Date(b.createTime) - new Date(a.createTime);
  });
});

const handlePageChange = (page) => {
  currentPage.value = page;
  showTreeDetail();
};

const handlePageSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  showTreeDetail();
};

const formatRipeDegree = (countNum, ripeNum) => {
  const calculatedDegree = calculateRipeDegree(countNum, ripeNum);
  if (calculatedDegree === 0) return "0";
  if (calculatedDegree > 0 && calculatedDegree < 100)
    return `${calculatedDegree}%`;
  if (calculatedDegree >= 100) return "已成熟";
  return "0";
};

const getRipeDegreeTagType = (countNum, ripeNum) => {
  const calculatedDegree = calculateRipeDegree(countNum, ripeNum);
  if (calculatedDegree === 0) return "info";
  if (calculatedDegree > 0 && calculatedDegree < 100) return "primary";
  if (calculatedDegree >= 100) return "success";
  return "warning";
};

const showTreeDetail = async () => {
  try {
    if (!props.activeAreaId) {
      ElMessage.warning("请先选择区域");
      return;
    }

    const response = await axios.get("/api/fruitTree", {
      params: {
        areaId: props.activeAreaId,
        page: currentPage.value,
        pageSize: pageSize.value,
      },
    });

    if (response.data && response.data.code === 200) {
      const pageData = response.data.data;
      total.value = pageData.total || 0;
      const treeDataList = pageData.records || [];
      emit("tree-list-update", props.activeAreaId, treeDataList);
    } else {
      ElMessage.error(
        "获取果树列表失败：" + (response.data?.msg || "未知错误")
      );
    }
  } catch (error) {
    console.error("获取果树列表失败:", error);
    ElMessage.error("获取果树列表失败，请稍后重试");
  }
};

const handleShowTreeDetail = async (tree) => {
  try {
    const response = await axios.get(`/api/fruitTree/treeInfo/${tree.id}`);

    if (response.data && response.data.code === 200) {
      const treeDetail = response.data.data;

      Object.assign(currentTree, {
        id: treeDetail.id,
        type: treeDetail.type,
        countNum: treeDetail.countNum,
        ripeNum: treeDetail.ripeNum,
        ripeDegree: treeDetail.ripeDegree,
        healthCondition: treeDetail.healthCondition,
        url: treeDetail.url,
        areaId: treeDetail.areaId,
        areaName: treeDetail.areaName,
        orchardName: treeDetail.orchardName,
        areaManagerName: treeDetail.areaManagerName,
        img: treeDetail.img,
        logs: treeDetail.logs || [],
        tasks: treeDetail.tasks || [],
        createTime: treeDetail.createTime,
        updateTime: treeDetail.updateTime,
      });

      await getTreeComments(tree.id);
      await getTreeTasks(tree.id);
      showTreeDetailDialog.value = true;
    } else {
      ElMessage.error(
        "获取果树详情失败：" + (response.data?.msg || "未知错误")
      );
    }
  } catch (error) {
    console.error("获取果树详情失败:", error);
    ElMessage.error("获取果树详情失败，请稍后重试");
  }
};

const handleDeleteTree = async (treeId) => {
  try {
    await ElMessageBox.confirm("确定要删除该果树吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    emit("tree-delete", treeId);
  } catch {
    ElMessage.info("已取消删除");
  }
};

const batchGenerateQRCode = async () => {
  const treeIds = sortedTreeList.value.map((tree) => Number(tree.id));

  if (treeIds.length === 0) {
    ElMessage.warning("当前区域暂无有效果树ID，无法生成二维码！");
    return;
  }

  try {
    generateQRLoading.value = true;

    const generateResponse = await axios.post(
      "/api/fruitTree/createTreeQRList",
      treeIds,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (generateResponse.data && generateResponse.data.code === 200) {
      const qrImgList = generateResponse.data.data || [];

      if (qrImgList.length !== treeIds.length) {
        ElMessage.warning(
          `生成异常：二维码数量(${qrImgList.length})与果树数量(${treeIds.length})不匹配！`
        );
        return;
      }

      const newTreeList = sortedTreeList.value.map((tree, index) => {
        let qrUrl = qrImgList[index];
        if (qrUrl && !qrUrl.startsWith("http")) {
          qrUrl =
            import.meta.env.VITE_API_BASE_URL +
            (qrUrl.startsWith("/") ? "" : "/") +
            qrUrl;
        }
        return {
          ...tree,
          url: qrUrl,
        };
      });

      emit("tree-list-update", props.activeAreaId, newTreeList);
      await nextTick();

      ElMessage.success(
        `成功生成 ${qrImgList.filter(Boolean).length} 个二维码！`
      );
    } else {
      ElMessage.error(
        `生成失败：${generateResponse.data?.msg || "接口返回异常"}`
      );
    }
  } catch (error) {
    console.error("批量生成二维码失败：", error);
    ElMessage.error(
      `生成失败：${
        error.response?.data?.msg || error.message || "网络异常，请稍后重试"
      }`
    );
  } finally {
    generateQRLoading.value = false;
  }
};

const batchDownloadQRCode = async () => {
  const trees = sortedTreeList.value.filter((t) => t.url);

  if (trees.length === 0) {
    ElMessage.warning("暂无二维码可下载");
    return;
  }

  let zip;
  try {
    zip = new JSZip();
  } catch (e) {
    console.error("JSZip初始化失败：", e);
    ElMessage.error("压缩包创建失败，请检查依赖是否安装");
    return;
  }

  const downloadPromises = trees.map(async (tree) => {
    try {
      let qrUrl = tree.url;
      if (qrUrl && !qrUrl.startsWith("http")) {
        qrUrl =
          import.meta.env.VITE_API_BASE_URL +
          (qrUrl.startsWith("/") ? "" : "/") +
          qrUrl;
      }

      const res = await fetch(qrUrl, {
        mode: "cors",
        credentials: "include",
        headers: {
          Accept: "image/png,image/jpeg,*/*",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      zip.file(`果树${tree.id}_二维码.png`, blob);
      return true;
    } catch (e) {
      console.error(`果树${tree.id}下载失败：`, e.message);
      return false;
    }
  });

  try {
    downloadQRLoading.value = true;
    const results = await Promise.all(downloadPromises);
    const successCount = results.filter(Boolean).length;

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `区域${props.activeAreaId}_二维码_${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(downloadUrl);

    ElMessage.success(
      `批量下载完成！成功${successCount}个，失败${
        trees.length - successCount
      }个`
    );
  } catch (err) {
    console.error("压缩包生成/下载失败：", err);
    ElMessage.error("批量下载失败：" + err.message);
  } finally {
    downloadQRLoading.value = false;
  }
};

const handleQRCodeClick = (imgUrl) => {
  qrViewerUrl.value = imgUrl;
  showQRViewer.value = true;
};

const downloadQRCode = async (imgUrl, treeId) => {
  try {
    if (!imgUrl) {
      ElMessage.warning("二维码URL为空，无法下载！");
      return;
    }
    const link = document.createElement("a");
    link.href = imgUrl;
    link.download = `果树${treeId}_二维码.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ElMessage.success("二维码下载成功！");
  } catch (error) {
    console.error("二维码下载失败：", error);
    ElMessage.error("二维码下载失败，请稍后重试！");
  }
};

const getLogTypeCode = (type) => {
  if (!type) return null;
  const typeStr = String(type);
  for (let i = 0; i < typeStr.length; i++) {
    const char = typeStr[i];
    if (char !== "\u0000" && char !== "\0" && char !== "") {
      return char;
    }
  }
  return null;
};

const formatLogType = (type) => {
  const typeCode = getLogTypeCode(type);
  if (typeCode === "1") return "浇水";
  if (typeCode === "2") return "施肥";
  if (typeCode === "3") return "农药";
  return "其他操作";
};

const getLogTypeTag = (type) => {
  const typeCode = getLogTypeCode(type);
  if (typeCode === "1") return "primary";
  if (typeCode === "2") return "success";
  if (typeCode === "3") return "danger";
  return "info";
};

const getLogColor = (type) => {
  const typeCode = getLogTypeCode(type);
  if (typeCode === "1") return "409eff";
  if (typeCode === "2") return "#e6a23c";
  if (typeCode === "3") return "#f56c6c";
  return "#909399";
};

const getTreeComments = async (treeId) => {
  try {
    commentLoading.value = true;
    const response = await axios.get(`api/comment/query/${treeId}`);

    if (response.data && response.data.code === 200) {
      commentList.value = response.data.data || [];
    } else {
      commentList.value = [];
    }
  } catch (error) {
    console.error("获取评论失败：", error);
    commentList.value = [];
  } finally {
    commentLoading.value = false;
  }
};

const getTreeTasks = async (treeId) => {
  try {
    const res = await axios.get(`/api/task/getTreeTask/${treeId}`);
    if (res.data.code === 200) {
      taskList.value = res.data.data || [];
    } else {
      taskList.value = [];
    }
  } catch (err) {
    console.error("获取任务失败：", err);
    taskList.value = [];
  }
};

const getTaskStatus = (status) => {
  if (status === 0) return "待接收";
  if (status === 1) return "待执行";
  if (status === 2) return "执行中";
  if (status === 3) return "已完成";
  return "未知状态";
};

const getTaskColor = (type) => {
  const t = (type || "").trim();
  if (t === "施肥") return "#e6a23c";    // 黄色
  if (t === "灌溉") return "#409eff";     // 蓝色
  if (t === "防治") return "#f56c6c";     // 红色
  if (t === "修剪") return "#67c23a";     // 绿色
  return "#909399";
};

const getTaskTypeTag = (type) => {
  const t = (type || "").trim();
  if (t === "施肥") return "warning";    // 黄色标签
  if (t === "灌溉") return "primary";    // 蓝色标签
  if (t === "防治") return "danger";     // 红色标签
  if (t === "修剪") return "success";    // 绿色标签
  return "info";
};

const formatTime = (time) => {
  if (!time) return "-";
  const date = new Date(time);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calculateRipeDegree = (countNum, ripeNum) => {
  const total = Number(countNum) || 0;
  const ripe = Number(ripeNum) || 0;
  if (total === 0) return 0;
  const degree = Math.round((ripe / total) * 100);
  return Math.min(degree, 100);
};

const formatHealthStatus = (healthCondition) => {
  if (
    healthCondition === null ||
    healthCondition === undefined ||
    healthCondition === ""
  ) {
    return "未添加";
  }
  const status = String(healthCondition);
  if (status === "1") return "健康";
  if (status === "0") return "不健康";
  return "未知";
};

const getHealthStatusType = (healthCondition) => {
  if (
    healthCondition === null ||
    healthCondition === undefined ||
    healthCondition === ""
  ) {
    return "info";
  }
  const status = String(healthCondition);
  if (status === "1") return "success";
  if (status === "0") return "danger";
  return "warning";
};

const getRateValue = (score) => {
  if (!score && score !== 0) return 0;
  return Number((score / 6).toFixed(1));
};

watch(
  () => props.activeAreaId,
  (newVal) => {
    if (!newVal) {
      showTreeDetailDialog.value = false;
      Object.assign(currentTree, {});
      showQRViewer.value = false;
      commentList.value = [];
      taskList.value = [];
    }
    currentPage.value = 1;
    total.value = 0;
    if (newVal) {
      showTreeDetail();
    }
  },
  { immediate: true }
);

watch(
  () => props.treeList,
  (newList) => {
    console.log("treeList更新通知");
    console.log("新数据：", newList);
    console.log(
      "二维码字段(url)：",
      newList.map((t) => ({
        id: t?.id,
        url: t?.url,
      }))
    );
  },
  { deep: true, immediate: true }
);
</script>

<style scoped>
:deep(.tree-row.highlight) {
  animation: flash 1s infinite !important;
}

@keyframes flash {
  0% {
    background: #f7eece;
  }

  50% {
    background: #fff29f;
  }

  100% {
    background: #f5efd7;
  }
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
  width: 100%;
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

.tree-detail-content {
  padding: 10px 0;
}

:deep(.el-table-cell) {
  height: 80px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.qrcode-container {
  width: 60px !important;
  height: 60px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.qrcode-img {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  cursor: pointer;
}

.qrcode-download-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
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
.tree-log-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 10px;
}

.tree-log-content::-webkit-scrollbar {
  width: 6px;
}
.tree-log-content::-webkit-scrollbar-thumb {
  background: #dcdcdc;
  border-radius: 3px;
}
.tree-log-content::-webkit-scrollbar-track {
  background: #f5f5f5;
}

:deep(.el-timeline-item__timestamp) {
  color: #666;
  font-size: 12px;
}
.comment-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.comment-list {
  max-height: 400px;
  overflow-y: auto;
}

.comment-item {
  padding: 15px;
  background-color: #fafafa;
  border-radius: 8px;
  margin-bottom: 15px;
  transition: all 0.3s;
}

.comment-item:hover {
  background-color: #f5f7fa;
  box-shadow: 0 2px 8 rgba(0, 0, 0, 0.05);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.comment-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.comment-content {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin: 10px 0;
  padding-left: 52px;
}

.comment-imgs {
  padding-left: 52px;
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.comment-imgs :deep(.el-image) {
  cursor: pointer;
  transition: transform 0.2s;
}

.comment-imgs :deep(.el-image:hover) {
  transform: scale(1.05);
}
</style>