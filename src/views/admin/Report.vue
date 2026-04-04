<template>
  <CommonLayout>
    <div class="report-page">
      <!-- 筛选区域 -->
      <div class="filter-bar">
        <div class="filter-group">
          <div class="filter-item">
            <label class="filter-label">上报类型：</label>
            <el-select v-model="filterParams.typeId" placeholder="请选择上报类型" class="filter-select" clearable>
              <el-option label="全部类型" value="" />
              <el-option label="水" :value="1" />
              <el-option label="肥" :value="2" />
              <el-option label="病害" :value="3" />
              <el-option label="虫害" :value="4" />
              <el-option label="杂草" :value="5" />
              <el-option label="任务汇报" :value="6" />
              <el-option label="成熟度" :value="7" />
            </el-select>
          </div>
          <div class="filter-item">
            <label class="filter-label">处理状态：</label>
            <el-select v-model="filterParams.status" placeholder="请选择处理状态" class="filter-select" clearable>
              <el-option label="全部状态" :value="undefined" />
              <el-option label="未处理" :value="0" />
              <el-option label="已处理" :value="1" />
            </el-select>
          </div>
          <div class="filter-item">
            <label class="filter-label">时间范围：</label>
            <el-date-picker v-model="filterParams.dateRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" class="filter-select" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" style="width: 240px" />
          </div>
          <el-button type="primary" @click="handleFilter" class="filter-btn">
            筛选
          </el-button>
          <el-button @click="resetFilter" class="reset-btn">重置</el-button>
        </div>
      </div>

      <!-- 上报表格 -->
      <div class="table-wrapper">
        <el-table :data="filteredReportList" border stripe style="width: 100%" v-loading="loading">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="status" label="处理状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'warning'">
                {{ row.status === 1 ? "已处理" : "未处理" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="typeId" label="上报类型" width="120">
            <template #default="{ row }">
              {{ getReportTypeName(row.typeId) }}
            </template>
          </el-table-column>
          <el-table-column prop="content" label="报告内容" min-width="200" show-overflow-tooltip />
          <el-table-column prop="urlList" label="图片" width="100">
            <template #default="{ row }">
              <el-image v-if="row.urlList && row.urlList.length > 0" :src="row.urlList[0]"
                :preview-src-list="row.urlList" fit="cover" style="width: 50px; height: 50px; cursor: pointer" />
            </template>
          </el-table-column>
          <el-table-column prop="userName" label="上报人" width="100" />
          <el-table-column prop="createTime" label="上报时间" width="160" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleDetail(row)">
                详情
              </el-button>
              <el-button type="success" size="small" @click="handlePublishTask(row)">
                发布任务
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 详情对话框 -->
      <el-dialog v-model="detailVisible" title="上报详情" width="600px">
        <el-descriptions :column="1" border v-if="currentReport">
          <el-descriptions-item label="上报类型">
            {{ getReportTypeName(currentReport.typeId) }}
          </el-descriptions-item>
          <el-descriptions-item label="报告内容">
            {{ currentReport.content }}
          </el-descriptions-item>
          <el-descriptions-item label="上报人">
            {{ currentReport.userName }}
          </el-descriptions-item>
          <el-descriptions-item label="上报时间">
            {{ currentReport.createTime }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ currentReport.updateTime }}
          </el-descriptions-item>
          <el-descriptions-item label="图片" :span="2">
            <div v-if="currentReport.urlList && currentReport.urlList.length > 0">
              <div class="image-list">
                <div v-for="(img, index) in currentReport.urlList" :key="index" class="image-item">
                  <el-image :src="img" :preview-src-list="currentReport.urlList" :initial-index="index" fit="cover"
                    class="report-image">
                    <template #error>
                      <div class="image-error">
                        <el-icon>
                          <Picture />
                        </el-icon>
                        <span>图片加载失败</span>
                      </div>
                    </template>
                  </el-image>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无图片" :image-size="80" />
          </el-descriptions-item>
        </el-descriptions>
      </el-dialog>
    </div>
  </CommonLayout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useUserStore } from "@/stores/modules/user";
import axios from "axios";
import { ElMessage } from "element-plus";
import CommonLayout from "@/views/common/CommonLayout.vue";
import { useRouter } from "vue-router";

const userStore = useUserStore();
const router = useRouter();
const loading = ref(false);
const reportList = ref([]);
const detailVisible = ref(false);
const currentReport = ref(null);

const filterParams = ref({
  typeId: null,
  status: null, // 新增：状态筛选
  dateRange: [],
});

// 上报类型映射
const reportTypeMap = {
  1: "水",
  2: "肥",
  3: "病害",
  4: "虫害",
  5: "杂草",
  6: "任务汇报",
  7: "成熟度",
};
const reportToTaskTypeMap = {
  1: "灌溉",    // 水 → 灌溉
  2: "施肥",    // 肥 → 施肥
  3: "防治",    // 病害 → 防治
  4: "防治",    // 虫害 → 防治
  5: "除草",    // 杂草 → 除草
  6: "修剪",    // 任务汇报 → 修剪
  7: "采摘",        // 成熟度 → 采摘
};
const getReportTypeName = (typeId) => {
  return reportTypeMap[typeId] || "未知";
};

// 1、获取农户上报列表
const getReportList = async () => {
  loading.value = true;
  try {
    const orchardId = userStore.user?.orchardId;
    if (!orchardId) {
      ElMessage.error("未获取到果园 ID");
      return;
    }

    //2、调用 AI 接口，对上报的图片与文字进行智能分析
    const response = await axios.get(
      `/api/report/getOrchardReport/${orchardId}`
    );

    if (response.data && response.data.code === 200) {
      reportList.value = response.data.data || [];
      console.log("获取到的上报列表:", reportList.value.length, "条");
    } else {
      ElMessage.error(response.data?.msg || "获取上报列表失败");
    }
  } catch (error) {
    console.error("获取上报列表失败:", error);
    ElMessage.error("获取上报列表失败");
  } finally {
    loading.value = false;
  }
};
// 前端筛选后的数据
const filteredReportList = computed(() => {
  let list = [...reportList.value];

  // 3、自动识别病虫害类型、判断异常原因，并自动填充任务标题、处理建议、紧急等级
  if (
    filterParams.value.typeId !== null &&
    filterParams.value.typeId !== undefined &&
    filterParams.value.typeId !== ""
  ) {
    const filterTypeId = Number(filterParams.value.typeId);
    list = list.filter((item) => {
      const itemTypeId = Number(item.typeId);
      return itemTypeId === filterTypeId;
    });
  }

  // 处理状态筛选 - 新增
  if (
    filterParams.value.status !== null &&
    filterParams.value.status !== undefined &&
    filterParams.value.status !== ""
  ) {
    const filterStatus = Number(filterParams.value.status);
    list = list.filter((item) => {
      const itemStatus = item.status !== undefined ? Number(item.status) : null;
      console.log(
        "状态比较：item.status =",
        item.status,
        "(",
        itemStatus,
        ") vs 筛选值 =",
        filterStatus,
        "结果:",
        itemStatus === filterStatus
      );
      return itemStatus === filterStatus;
    });
  }

  // 时间范围筛选
  if (
    filterParams.value.dateRange &&
    filterParams.value.dateRange.length === 2
  ) {
    const startDate = filterParams.value.dateRange[0];
    const endDate = filterParams.value.dateRange[1];

    list = list.filter((item) => {
      if (!item.createTime) return false;
      // 提取日期部分（YYYY-MM-DD）
      const itemDate = item.createTime.split(" ")[0];
      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  return list;
});
// 筛选
const handleFilter = () => {
  getReportList();
};

// 重置筛选
const resetFilter = () => {
  filterParams.value = {
    typeId: null,
    dateRange: [],
  };
  getReportList();
};

// 查看详情
const handleDetail = (row) => {
  currentReport.value = { ...row };
  detailVisible.value = true;
};
// 发布任务（根据上报类型自动填充任务类型）
const handlePublishTask = async (row) => {
  // 根据上报类型获取对应的任务类型
  const taskType = reportToTaskTypeMap[row.typeId] || "";

  // 准备路由参数
  const query = {
    action: "publish",
    taskType: '施肥' || taskType,
    content: "请巡检果园，为果园果树施肥" || row.content,
    reportId: row.id, // 传递上报 ID，用于后续更新状态
  };

  // 如果有 treeId，先获取果树信息得到 areaId
  if (row.treeId) {
    try {
      const response = await axios.get(`/api/fruitTree/treeInfo/${row.treeId}`);

      if (response.data && response.data.code === 200 && response.data.data) {
        const treeInfo = response.data.data;

        // 将 areaId 添加到路由参数中
        if (treeInfo.areaId) {
          query.areaId = treeInfo.areaId;
        }

        // 可选：如果有区域名称，也可以传递过去用于显示
        if (treeInfo.areaName) {
          query.areaName = treeInfo.areaName;
        }
      }
    } catch (error) {
      console.error("获取果树信息失败:", error);
      // 即使获取失败也继续跳转，只是不填充区域
    }
  }

  // 跳转到任务管理页面，并传递参数
  router.push({
    path: "/adminMission",
    query,
  });
};

// 更新上报状态为已处理
const updateReportStatus = async (reportId) => {
  try {
    if (!reportId) {
      console.warn("缺少 reportId，无法更新状态");
      return false;
    }

    console.log("正在更新上报状态，reportId:", reportId);

    const submitData = {
      id: Number(reportId),
      status: 1, // 设置为已处理
    };

    const response = await axios.post("/api/report/update", submitData);

    if (response.data && response.data.code === 200) {
      console.log("上报状态更新成功:", reportId);

      // 更新本地列表中的状态
      const report = reportList.value.find(
        (item) => item.id === Number(reportId)
      );
      if (report) {
        report.status = 1;
        console.log("本地列表状态已更新");
      }

      return true;
    } else {
      console.error("上报状态更新失败:", response.data?.msg);
      ElMessage.warning("任务发布成功，但上报状态更新失败");
      return false;
    }
  } catch (error) {
    console.error("更新上报状态失败:", error);
    console.error("错误详情:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    ElMessage.warning("任务发布成功，但上报状态更新失败");
    return false;
  }
};
onMounted(() => {
  getReportList();
});
</script>

<style lang="scss" scoped>
.report-page {
  .filter-bar {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
    margin-bottom: 20px;

    .filter-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;

      .filter-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .filter-label {
          font-size: 14px;
          color: #606266;
          white-space: nowrap;
        }

        .filter-select {
          width: 200px;
        }
      }

      .filter-btn,
      .reset-btn {
        margin-left: 10px;
      }
    }
  }

  .table-wrapper {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
  }
}

.report-page {
  .filter-bar {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
    margin-bottom: 20px;

    .filter-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;

      .filter-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .filter-label {
          font-size: 14px;
          color: #606266;
          white-space: nowrap;
        }

        .filter-select {
          width: 200px;
        }
      }

      .filter-btn,
      .reset-btn {
        margin-left: 10px;
      }
    }
  }

  .table-wrapper {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
  }
}

// 详情对话框图片样式
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 0;
}

.image-item {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.report-image {
  display: block;
  width: 150px;
  height: 150px;
  background-color: #f5f7fa;

  :deep(.el-image__inner) {
    transition: transform 0.3s ease;
  }

  &:hover {
    :deep(.el-image__inner) {
      transform: scale(1.05);
    }
  }
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 150px;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 13px;

  .el-icon {
    font-size: 40px;
    margin-bottom: 8px;
  }
}
</style>