<template>
  <div class="zone-main">
    <!-- 未选择区域提示 -->
    <div class="map-container" v-if="!activeAreaId">
      <div class="map-tips">请先选择或添加区域</div>
    </div>

    <!-- 选中区域后显示表格 -->
    <div class="tree-list-container" v-if="activeAreaId">
      <div class="zone-info">
        <div>
          <h3>
            区域{{ fullZoneInfo.number || activeZone.number }}：{{
              fullZoneInfo.name || activeZone.name
            }}
          </h3>
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
      </div>

      <!-- 果树表格（已修复闭合标签） -->
      <el-table
        :data="sortedTreeList"
        border
        stripe
        style="width: 100%; margin-top: 20px"
        :header-cell-style="{ backgroundColor: '#f8f9fa' }"
        :empty-text="`该区域暂无果树数据`"
      >
        <!-- 果树编号 -->
        <el-table-column label="果树编号" min-width="120">
          <template #default="scope">
            {{ scope.row.id }}
          </template>
        </el-table-column>
        <!-- 新增：果树品种列 -->
        <!-- 新增：果实数量列 -->
        <el-table-column label="果实总数" min-width="100">
          <template #default="scope">
            {{ scope.row.countNum || 0 }}
          </template>
        </el-table-column>
        <!-- 新增：成熟果实数量列 -->
        <el-table-column label="行" min-width="60">
          <template #default="scope">
            {{ getLocationRowAndColumn(scope.row.location).row }}
          </template>
        </el-table-column>
        <el-table-column label="列" min-width="60">
          <template #default="scope">
            {{ getLocationRowAndColumn(scope.row.location).col }}
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
            <!-- 核心修复：使用后端返回的url字段 -->
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
            <el-button size="small" link @click="showTreeDetail(scope.row)">
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
      <!-- 这里是修复的闭合标签 -->

      <!-- 批量生成二维码按钮 -->
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

    <!-- 果树详情弹窗 -->
    <!-- 果树日志详情弹窗 -->
    <el-dialog
      v-model="showTreeDetailDialog"
      title="果树操作日志"
      width="800px"
      center
      :close-on-click-modal="false"
    >
      <div class="tree-log-content">
        <!-- 果树基本信息简洁显示 -->
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

        <!-- 日志统计卡片 -->
        <el-row :gutter="20" style="margin-bottom: 20px">
          <el-col :span="8">
            <el-card shadow="hover" style="text-align: center">
              <h3 style="margin: 0; color: #409eff">
                {{ currentTree.logs?.length || 0 }}
              </h3>
              <div style="font-size: 12px; color: #666">总日志数</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" style="text-align: center">
              <h3 style="margin: 0; color: #67c23a">
                {{
                  currentTree.logs?.filter((log) => log.type === "1").length ||
                  0
                }}
              </h3>
              <div style="font-size: 12px; color: #666">浇水次数</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" style="text-align: center">
              <h3 style="margin: 0; color: #e6a23c">
                {{
                  currentTree.logs?.filter((log) => log.type === "2").length ||
                  0
                }}
              </h3>
              <div style="font-size: 12px; color: #666">施肥次数</div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 日志列表 -->
        <el-timeline v-if="currentTree.logs && currentTree.logs.length > 0">
          <el-timeline-item
            v-for="log in sortedLogs"
            :key="log.id"
            :timestamp="log.createTime"
            placement="top"
            :type="
              log.type === '1'
                ? 'primary'
                : log.type === '2'
                ? 'success'
                : 'info'
            "
            :color="
              log.type === '1'
                ? '#409eff'
                : log.type === '2'
                ? '#67c23a'
                : '#909399'
            "
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
                  {{
                    log.type === "1"
                      ? "浇水"
                      : log.type === "2"
                      ? "施肥"
                      : "其他操作"
                  }}
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

        <!-- 无日志时的提示 -->
        <el-empty
          v-else
          description="暂无操作日志"
          :image-size="100"
        ></el-empty>
      </div>
      <template #footer>
        <el-button @click="showTreeDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 二维码预览弹窗 -->
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

const downloadQRLoading = ref(false); // 加这一行

// 定义props
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

// 状态定义
const generateQRLoading = ref(false);
const showQRViewer = ref(false);
const qrViewerUrl = ref("");
const showTreeDetailDialog = ref(false);
const currentTree = reactive({});

// 核心修复：适配后端返回的字段结构
const sortedTreeList = computed(() => {
  // 1. 过滤掉无效数据
  const validTrees = (props.treeList || []).filter((tree) => {
    return tree && tree.id !== undefined && tree.id !== null && tree.id !== "";
  });

  // 2. 打印完整数据，方便排查
  console.log("原始treeList数据：", props.treeList);
  console.log("过滤后有效数据：", validTrees);

  // 3. 适配后端返回的字段，保留所有原始数据
  return validTrees.map((tree) => ({
    ...tree, // 保留所有原始字段
    // 字段适配：确保数据格式统一
    id: tree.id || "",
    type: tree.type || "",
    countNum: tree.countNum || "0",
    ripeNum: tree.ripeNum || "0",
    ripeDegree: tree.ripeDegree || null,
    healthCondition: tree.healthCondition || null,
    url: tree.url || null, // 二维码地址使用后端返回的url字段
    areaId: tree.areaId || "",
    typeId: tree.typeId || "",
    location: tree.location || null,
  }));
});
// 获取位置的行和列
const getLocationRowAndColumn = (location) => {
  // 如果位置为空，返回默认值
  if (!location) return { row: "-", col: "-" };

  // 如果已经是"行-列"格式，直接拆分
  if (typeof location === "string" && location.includes("-")) {
    const [row, col] = location.split("-");
    return { row: row || "-", col: col || "-" };
  }

  // 如果是其他格式，尝试处理
  try {
    // 如果location是对象格式 {row: 1, col: 2}
    if (typeof location === "object" && location !== null) {
      return {
        row: location.row || "-",
        col: location.col || "-",
      };
    }
  } catch {
    // 忽略错误
  }

  // 默认返回
  return { row: "-", col: "-" };
};
// 计算成熟度（基于countNum和ripeNum）
const calculateRipeDegree = (countNum, ripeNum) => {
  // 将字符串转为数字
  const total = Number(countNum) || 0;
  const ripe = Number(ripeNum) || 0;

  // 如果总数为0，返回0
  if (total === 0) return 0;

  // 计算成熟度百分比 (成熟数量 / 总数量) * 100
  const degree = Math.round((ripe / total) * 100);

  // 确保不超过100%
  return Math.min(degree, 100);
};

// 格式化成熟度显示
const formatRipeDegree = (countNum, ripeNum) => {
  const calculatedDegree = calculateRipeDegree(countNum, ripeNum);

  if (calculatedDegree === 0) return "0";
  if (calculatedDegree > 0 && calculatedDegree < 100)
    return `${calculatedDegree}%`;
  if (calculatedDegree >= 100) return "已成熟";
  return "0";
};

// 获取成熟度标签类型
const getRipeDegreeTagType = (countNum, ripeNum) => {
  const calculatedDegree = calculateRipeDegree(countNum, ripeNum);

  if (calculatedDegree === 0) return "info";
  if (calculatedDegree > 0 && calculatedDegree < 100) return "primary";
  if (calculatedDegree >= 100) return "success";
  return "warning";
};
const formatHealthStatus = (healthCondition) => {
  // 如果为空，返回"未添加"
  if (
    healthCondition === null ||
    healthCondition === undefined ||
    healthCondition === ""
  ) {
    return "未添加";
  }

  // 转换为字符串进行比较
  const status = String(healthCondition);

  if (status === "1") return "健康";
  if (status === "0") return "不健康";

  return "未知";
};

// 获取健康状态标签类型
const getHealthStatusType = (healthCondition) => {
  // 如果为空，返回灰色标签
  if (
    healthCondition === null ||
    healthCondition === undefined ||
    healthCondition === ""
  ) {
    return "info";
  }

  // 转换为字符串进行比较
  const status = String(healthCondition);

  if (status === "1") return "success"; // 健康 - 绿色
  if (status === "0") return "danger"; // 不健康 - 红色

  return "warning"; // 未知 - 黄色
};
// 查看果树详情
const showTreeDetail = async (tree) => {
  try {
    // 显示加载中
    ElMessage.info("加载果树详情中...");

    // 调用新接口获取详情
    const response = await axios.get(`/api/fruitTree/treeInfo/${tree.id}`);

    if (response.data && response.data.code === 200) {
      const treeDetail = response.data.data;

      // 将详情数据赋值给 currentTree
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

// 删除果树
const handleDeleteTree = (treeId) => {
  ElMessageBox.confirm("确定要删除该果树吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      emit("tree-delete", treeId);
      ElMessage.success("果树删除成功！");
    })
    .catch(() => {
      ElMessage.info("已取消删除");
    });
};

// 批量生成二维码（适配新的字段结构）
const batchGenerateQRCode = async () => {
  const treeIds = sortedTreeList.value.map((tree) => Number(tree.id));
  console.log("待生成二维码的果树ID：", treeIds);

  if (treeIds.length === 0) {
    ElMessage.warning("当前区域暂无有效果树ID，无法生成二维码！");
    return;
  }

  try {
    generateQRLoading.value = true;

    // 调用接口(该接口)
    const generateResponse = await axios.post(
      "/api/fruitTree/createTreeQRList",
      treeIds,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    console.log("接口返回数据：", generateResponse.data);

    if (generateResponse.data && generateResponse.data.code === 200) {
      const qrImgList = generateResponse.data.data || [];
      console.log("后端返回的二维码URL：", qrImgList);

      // 校验数量
      if (qrImgList.length !== treeIds.length) {
        ElMessage.warning(
          `生成异常：二维码数量(${qrImgList.length})与果树数量(${treeIds.length})不匹配！`
        );
        return;
      }

      // 修复：更新url字段（后端返回的字段名）
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
          url: qrUrl, // 使用url字段存储二维码地址
        };
      });
      console.log("待更新的果树列表：", newTreeList);

      // 通知父组件更新
      emit("tree-list-update", props.activeAreaId, newTreeList);

      // 强制触发响应式更新
      await nextTick();
      console.log(
        "更新后表格数据：",
        sortedTreeList.value.map((t) => ({
          id: t.id,
          url: t.url,
        }))
      );

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
// 按创建时间倒序排序的日志
const sortedLogs = computed(() => {
  if (!currentTree.logs) return [];
  return [...currentTree.logs].sort((a, b) => {
    return new Date(b.createTime) - new Date(a.createTime);
  });
});
// 批量下载二维码（极简修复版，优先保证能执行）
const batchDownloadQRCode = async () => {
  console.log("=== 开始批量下载 ===");
  const trees = sortedTreeList.value.filter((t) => t.url);
  console.log("可下载的果树列表：", trees);

  if (trees.length === 0) {
    ElMessage.warning("暂无二维码可下载");
    return;
  }

  // 先手动创建一个空ZIP（排除JSZip初始化问题）
  let zip;
  try {
    zip = new JSZip();
    console.log("✅ JSZip初始化成功");
  } catch (e) {
    console.error("❌ JSZip初始化失败：", e);
    ElMessage.error("压缩包创建失败，请检查依赖是否安装");
    return;
  }

  // 逐个处理二维码（改用Promise.all，避免循环阻塞）
  const downloadPromises = trees.map(async (tree) => {
    try {
      // 1. 修复URL（必做）
      let qrUrl = tree.url;
      if (qrUrl && !qrUrl.startsWith("http")) {
        qrUrl =
          import.meta.env.VITE_API_BASE_URL +
          (qrUrl.startsWith("/") ? "" : "/") +
          qrUrl;
      }
      console.log(`📥 下载果树${tree.id}：${qrUrl}`);

      // 2. 修复fetch跨域（必做）
      const res = await fetch(qrUrl, {
        mode: "cors",
        credentials: "include",
        headers: {
          Accept: "image/png,image/jpeg,*/*", // 指定接收图片格式
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      zip.file(`果树${tree.id}_二维码.png`, blob);
      console.log(`✅ 果树${tree.id}下载成功`);
      return true;
    } catch (e) {
      console.error(`❌ 果树${tree.id}下载失败：`, e.message);
      return false;
    }
  });

  try {
    downloadQRLoading.value = true;
    // 等待所有下载完成
    const results = await Promise.all(downloadPromises);
    const successCount = results.filter(Boolean).length;
    console.log(`📊 下载完成：成功${successCount}/${trees.length}`);

    // 生成ZIP并下载（改用原生API，放弃file-saver）
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `区域${props.activeAreaId}_二维码_${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(downloadUrl); // 释放内存

    ElMessage.success(
      `批量下载完成！成功${successCount}个，失败${
        trees.length - successCount
      }个`
    );
  } catch (err) {
    console.error("❌ 压缩包生成/下载失败：", err);
    ElMessage.error("批量下载失败：" + err.message);
  } finally {
    downloadQRLoading.value = false;
  }
};

// 二维码点击事件
const handleQRCodeClick = (imgUrl) => {
  qrViewerUrl.value = imgUrl;
  showQRViewer.value = true;
};

// 下载二维码
const downloadQRCode = async (imgUrl, treeId) => {
  try {
    // 修复：处理URL为空的情况
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

// 监听activeAreaId变化
watch(
  () => props.activeAreaId,
  (newVal) => {
    if (!newVal) {
      showTreeDetailDialog.value = false;
      Object.assign(currentTree, {});
      showQRViewer.value = false;
    }
  },
  { immediate: true }
);

// 监听treeList变化，实时打印字段信息
watch(
  () => props.treeList,
  (newList) => {
    console.log("★ treeList更新通知 ★");
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
  width: 100%; /* 新增：确保容器占满父元素宽度 */
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

/* 果树详情样式 */
.tree-detail-content {
  padding: 10px 0;
}

/* 核心修复：强制表格单元格高度，确保二维码显示 */
:deep(.el-table-cell) {
  height: 80px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 二维码样式 */
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
</style>