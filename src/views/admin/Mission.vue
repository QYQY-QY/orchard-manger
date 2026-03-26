<template>
  <CommonLayout>
    <div class="task-page">
      <!-- 筛选区域 - 适配任务范围多选 -->
      <div class="filter-bar">
        <div class="filter-group">
          <div class="filter-item">
            <label class="filter-label">任务类型：</label>
            <el-select
              v-model="filterParams.taskType"
              placeholder="请选择任务类型"
              class="filter-select"
            >
              <el-option label="全部状态" value="" />
              <el-option label="浇水" value="浇水" />
              <el-option label="施肥" value="施肥" />
              <el-option label="除草" value="除草" />
              <el-option label="治虫" value="治虫" />
              <el-option label="治病" value="治病" />
              <el-option label="采摘" value="采摘" />
            </el-select>
          </div>
          <div class="filter-item">
            <label class="filter-label">任务状态：</label>
            <el-select
              v-model="filterParams.status"
              placeholder="请选择任务状态"
              class="filter-select"
            >
              <el-option label="全部状态" value="" />
              <el-option label="待审核" value="0" />
              <el-option label="未完成" value="1" />
              <el-option label="已完成" value="3" />
              <el-option label="拒绝任务" value="4" />
              <el-option label="未通过" value="5" />
            </el-select>
          </div>
          <div class="filter-item">
            <label class="filter-label">负责人：</label>
            <el-select
              v-model="filterParams.receiverName"
              placeholder="请选择负责人"
              class="filter-select"
            >
              <el-option label="全部负责人" value="" />
              <el-option
                v-for="emp in employeeList"
                :key="emp.id"
                :label="emp.name"
                :value="emp.name"
              />
            </el-select>
          </div>
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
          <el-button @click="resetFilter" class="reset-btn">重置</el-button>
          <div class="salary-statistics">
            <span class="statistics-label">薪资统计：</span>
            <span class="statistics-value">¥ {{ totalSalary.toFixed(2) }}</span>
          </div>
        </div>
        <el-button
          type="primary"
          class="publish-btn"
          @click="showPublishDialog = true"
          >发布任务</el-button
        >
        <el-button
          type="success"
          class="batch-btn"
          @click="handleBatchApprove"
          :disabled="selectedTaskIds.length === 0"
          >批量审核通过</el-button
        >
        <el-button
          type="danger"
          class="batch-btn"
          @click="handleBatchReject"
          :disabled="selectedTaskIds.length === 0"
          >批量审核不通过</el-button
        >
      </div>

      <!-- 任务列表 - 保持不变 -->
      <div class="task-list-wrapper">
        <el-table
          :data="filteredTaskList"
          stripe
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <!-- <el-table-column
            prop="taskTitle"
            label="任务标题"
            min-width="150px"
          /> -->

          <el-table-column type="selection" width="55" />
          <el-table-column label="任务内容" min-width="200px">
            <template #default="{ row }">
              <template v-if="row.areaName"> 区域 {{ row.areaName }} </template>
              {{ row.taskInfo }}。截止时间：
              {{ formatIsoTime(row.deadline) }}
              <template v-if="row.areaName">
                。薪资：{{ row.salary }}元
              </template>
            </template>
          </el-table-column>
          <el-table-column label="任务类型" width="120px">
            <template #default="{ row }">
              {{ row.taskType }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="任务状态" width="120px">
            <template #default="{ row }">
              <el-tag
                :type="
                  row.status === 0
                    ? 'primary'
                    : row.status === 1
                    ? 'warning'
                    : row.status === 3
                    ? 'success'
                    : 'danger'
                "
              >
                {{
                  row.status === 0
                    ? "待审核"
                    : row.status === 1
                    ? "未完成"
                    : row.status === 3
                    ? "已完成"
                    : row.status === 5
                    ? "未通过"
                    : "拒绝任务"
                }}
              </el-tag>
            </template>
          </el-table-column>
          <!-- <el-table-column prop="deadline" label="截止时间" width="180px">
            <template #default="{ row }">
              {{ formatIsoTime(row.deadline) }}
            </template>
          </el-table-column> -->
          <el-table-column label="负责人" width="100px">
            <template #default="{ row }">
              {{ row.receiverName }}
            </template>
          </el-table-column>
          <el-table-column label="薪资" width="100px">
            <template #default="{ row }">
              {{ row.salary }}
            </template>
          </el-table-column>
          <el-table-column prop="username" label="发布人" width="120px" />
          <el-table-column label="操作" width="180px">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleViewDetail(row)">
                查看详情
              </el-button>
              <el-button link type="danger" @click="handleDeleteTask(row.id)">
                删除任务
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 发布任务弹框 - 核心改造 -->
      <el-dialog v-model="showPublishDialog" title="发布新任务" width="700px">
        <el-form
          :model="publishForm"
          label-width="100px"
          ref="publishFormRef"
          :rules="publishRules"
        >
          <el-form-item label="任务标题" prop="taskTitle">
            <el-input
              v-model="publishForm.taskTitle"
              placeholder="请输入任务标题"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="任务内容" prop="taskInfo">
            <el-input
              v-model="publishForm.taskInfo"
              type="textarea"
              placeholder="请输入任务内容"
              rows="3"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="任务类型" prop="taskType">
            <el-select
              v-model="publishForm.taskType"
              placeholder="请选择任务类型"
            >
              <el-option label="全部状态" value="" />
              <el-option label="浇水" value="浇水" />
              <el-option label="施肥" value="施肥" />
              <el-option label="除草" value="除草" />
              <el-option label="治虫" value="治虫" />
              <el-option label="治病" value="治病" />
              <el-option label="采摘" value="采摘" />
            </el-select>
          </el-form-item>
          <!-- 改造1：任务范围 - 全园 + 区域多选 -->
          <el-form-item label="任务范围" prop="taskScope">
            <el-select
              v-model="publishForm.taskScope"
              placeholder="请选择任务范围"
              multiple
              collapse-tags
              style="width: 100%"
            >
              <el-option label="全园" value="0" />
              <el-option
                v-for="area in areaList"
                :key="area.id"
                :label="area.name"
                :value="area.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="截止时间" prop="deadline">
            <el-date-picker
              v-model="publishForm.deadline"
              type="datetime"
              placeholder="请选择截止时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <!-- 改造3：任务负责人 - 多选 -->
          <el-form-item label="任务负责人" prop="empIds">
            <el-select
              v-model="publishForm.empIds"
              placeholder="请选择任务负责人"
              filterable
              clearable
              multiple
              collapse-tags
              style="width: 100%"
            >
              <el-option
                v-for="emp in employeeList"
                :key="emp.id"
                :label="emp.name"
                :value="Number(emp.id)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="任务薪资" prop="salary">
            <el-input-number
              v-model="publishForm.salary"
              :min="0"
              :precision="2"
              placeholder="请输入任务薪资"
              style="width: 40%"
            />
            <span style="margin-left: 8px; color: #999">元</span>
          </el-form-item>
          <!-- 隐藏字段 - 自动填充 -->
          <el-form-item label="所属果园ID" v-show="false">
            <el-input v-model="publishForm.orchardId" />
          </el-form-item>
          <el-form-item label="发布人ID" v-show="false">
            <el-input v-model="publishForm.creatorId" />
          </el-form-item>
          <el-form-item label="发布时间" v-show="false">
            <el-input v-model="publishForm.postTime" />
          </el-form-item>
          <el-form-item label="任务状态" v-show="false">
            <el-input v-model="publishForm.status" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showPublishDialog = false">取消</el-button>
          <el-button type="primary" @click="handlePublish">确认发布</el-button>
        </template>
      </el-dialog>

      <!-- 任务详情弹框 - 保持不变 -->
      <el-dialog
        v-model="showDetailDialog"
        title="任务详情"
        width="800px"
        center
      >
        <div class="task-detail">
          <div class="detail-base-info">
            <el-descriptions :column="2" border style="margin-bottom: 20px">
              <el-descriptions-item label="任务ID">{{
                currentTask.id || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="任务标题">{{
                currentTask.taskTitle || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="任务内容">{{
                currentTask.taskInfo || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="所属果园">{{
                currentTask.orchardName || "-"
              }}</el-descriptions-item>
              <!-- <el-descriptions-item label="任务类型">
                <el-tag
                  :type="currentTask.taskType === '1' ? 'danger' : 'info'"
                >
                  {{ currentTask.taskType === "0" ? "日常任务" : "紧急任务" }}
                </el-tag>
              </el-descriptions-item> -->
              <el-descriptions-item label="任务状态">
                <el-tag
                  :type="
                    currentTask.status === 0
                      ? 'primary'
                      : currentTask.status === 1
                      ? 'warning'
                      : currentTask.status === 3
                      ? 'success'
                      : 'danger'
                  "
                >
                  {{
                    currentTask.status === 0
                      ? "待审核"
                      : currentTask.status === 1
                      ? "未完成"
                      : currentTask.status === 3
                      ? "已完成"
                      : "拒绝任务"
                  }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="发布人">{{
                currentTask.username || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="发布时间">{{
                formatIsoTime(currentTask.postTime)
              }}</el-descriptions-item>
              <el-descriptions-item label="任务截止时间">{{
                formatIsoTime(currentTask.deadline)
              }}</el-descriptions-item>
              <el-descriptions-item label="完成时间">{{
                formatIsoTime(currentTask.completionTime) || "暂未完成"
              }}</el-descriptions-item>
              <el-descriptions-item label="任务范围">{{
                currentTask.taskScope === 0 ? "全园" : "分区"
              }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{
                formatIsoTime(currentTask.createTime)
              }}</el-descriptions-item>
              <el-descriptions-item
                label="不通过原因"
                v-if="currentTask.failure"
              >
                {{ currentTask.failure }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div
            class="detail-images"
            v-if="currentTask.imgsURL && currentTask.imgsURL.length > 0"
          >
            <h4 style="margin-bottom: 10px; color: #333">任务相关图片：</h4>
            <div class="image-grid">
              <div
                class="image-item"
                v-for="(img, index) in currentTask.imgsURL"
                :key="index"
              >
                <el-image
                  :src="img"
                  :preview-src-list="currentTask.imgsURL"
                  fit="cover"
                  style="width: 200px; height: 150px; border-radius: 4px"
                >
                  <template #error>
                    <div class="image-error">图片加载失败</div>
                  </template>
                </el-image>
              </div>
            </div>
          </div>

          <div v-else class="no-image">
            <el-empty description="暂无相关图片"></el-empty>
          </div>
        </div>

        <template #footer>
          <div v-if="currentTask.status === 0" style="display: flex; gap: 10px">
            <el-button
              type="success"
              @click="handleApproveTask(currentTask.id)"
              size="default"
            >
              审核通过
            </el-button>
            <el-button
              type="danger"
              @click="handleRejectTask(currentTask.id)"
              size="default"
            >
              审核不通过
            </el-button>
          </div>
          <el-button @click="showDetailDialog = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </CommonLayout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import CommonLayout from "@/views/common/CommonLayout.vue";
import { useUserStore } from "@/stores/modules/user";
import axios from "axios";

const userStore = useUserStore();
// 从用户仓库提取核心信息
const creatorId = computed(() => Number(userStore.user?.id || 0));
const username = computed(
  () => userStore.user?.name || userStore.user?.username || ""
);
const orchardId = computed(() => Number(userStore.user?.orchardId || 0));
// 批量选中的任务 ID 列表
const selectedTaskIds = ref([]);
// 新增：果园区域列表（任务范围用）
const areaList = ref([]);
// 果园员工列表（任务负责人用）
const employeeList = ref([]);

// 表单校验规则 - 适配多选
const publishRules = ref({
  taskTitle: [{ required: true, message: "请输入任务标题", trigger: "blur" }],
  taskInfo: [{ required: true, message: "请输入任务内容", trigger: "blur" }],
  taskType: [{ required: true, message: "请选择任务类型", trigger: "change" }],
  taskScope: [{ required: true, message: "请选择任务范围", trigger: "change" }],
  deadline: [{ required: true, message: "请选择截止时间", trigger: "change" }],
  empIds: [
    {
      required: true,
      message: "请选择至少一位任务负责人",
      trigger: "change",
      type: "array", // 适配多选数组
    },
  ],
});

// 发布弹框控制 + 表单初始化
const showPublishDialog = ref(false);
const publishFormRef = ref(null);
const publishForm = ref({
  taskTitle: "",
  taskInfo: "",
  taskType: "", // 字符串格式
  taskScope: [], // 多选数组
  deadline: "", // 无时区格式
  empIds: [], // 多选数组
  salary: null,
  // 自动填充字段
  orchardId: orchardId.value,
  creatorId: creatorId.value,
  postTime: "", // 无时区格式，发布时生成
  status: 1, // 固定未完成
  // 预留groupid存储（后端返回后赋值）
  groupId: "",
});
const filterParams = ref({
  taskType: "",
  status: "",
  taskScope: "",
  receiverName: "",
  deadlineRange: [], // 新增时间筛选字段
  orchardId: orchardId.value,
  creatorId: creatorId.value,
  username: username.value,
});
// 详情弹框控制
const showDetailDialog = ref(false);
const currentTask = ref({});

// 原始任务列表数据
const taskList = ref([]);

// 筛选后的任务列表
const filteredTaskList = computed(() => {
  let list = [...taskList.value];

  // 任务类型筛选
  if (filterParams.value.taskType) {
    list = list.filter((item) => item.taskType === filterParams.value.taskType);
  }

  // 任务状态筛选
  if (filterParams.value.status) {
    list = list.filter(
      (item) => item.status === Number(filterParams.value.status)
    );
  }

  // 时间范围筛选（修改）
  if (
    filterParams.value.deadlineRange &&
    filterParams.value.deadlineRange.length === 2
  ) {
    const startDate = filterParams.value.deadlineRange[0];
    const endDate = filterParams.value.deadlineRange[1];

    list = list.filter((item) => {
      if (!item.deadline) return false;
      const taskDeadline = item.deadline.slice(0, 10);
      return taskDeadline >= startDate && taskDeadline <= endDate;
    });
  }

  // 任务范围筛选
  if (filterParams.value.taskScope) {
    list = list.filter(
      (item) => item.taskScope === Number(filterParams.value.taskScope)
    );
  }

  // 负责人筛选
  if (filterParams.value.receiverName) {
    list = list.filter((item) => {
      return item.receiverName === filterParams.value.receiverName;
    });
  }

  return list;
});
const resetFilter = () => {
  filterParams.value = {
    taskType: "",
    status: "",
    taskScope: "",
    receiverName: "",
    deadlineRange: [], // 新增：重置时间字段
    orchardId: orchardId.value,
    creatorId: creatorId.value,
  };
  fetchTaskList();
  ElMessage.info("筛选条件已重置");
};
// 格式化时间（兼容有无时区）
const formatIsoTime = (isoTime) => {
  if (!isoTime) return "-";
  const date = new Date(isoTime);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 获取果园所有区域（修改为新接口 + 适配新返回格式）
const fetchAreaList = async () => {
  try {
    const currentOrchardId = orchardId.value;
    if (!currentOrchardId || currentOrchardId <= 0) {
      ElMessage.warning(
        "当前用户未绑定有效果园ID（需大于0），无法获取区域列表"
      );
      areaList.value = [];
      return;
    }

    // 调用新的GET接口 /api/area/selectByOrchardId
    const response = await axios.get("/api/area/selectByOrchardId", {
      params: {
        orchardId: currentOrchardId, // 传递果园ID参数
      },
      // 移除多余的Content-Type请求头（GET请求不需要）
    });

    // 适配新的后端返回格式：code=200 表示成功，数据在data数组中
    if (response.data && response.data.code === 200) {
      // 从data中提取区域数据，映射为前端需要的格式
      const areaData = response.data.data || [];
      areaList.value = areaData
        .map((item) => ({
          id: item.id, // 区域ID（字符串转数字，避免类型问题）
          name: item.name || "未命名区域", // 区域名称
        }))
        .filter((item) => item.id && item.name); // 过滤无效数据
    } else {
      ElMessage.error(`获取区域列表失败：${response.data?.msg || "未知错误"}`);
      areaList.value = [];
    }
  } catch (error) {
    console.error("获取区域列表失败详情：", {
      url: error.config?.url,
      params: error.config?.params,
      status: error.response?.status,
      responseData: error.response?.data,
    });

    // 精准提示错误原因
    if (error.response?.status === 400) {
      ElMessage.error(
        `获取区域列表失败（400）：参数错误，请确认orchardId=${orchardId.value} 是否有效`
      );
    } else if (error.response?.status === 404) {
      ElMessage.error(
        `获取区域列表失败（404）：接口路径/api/area/selectByOrchardId 不存在，请检查后端接口`
      );
    } else if (error.response?.status === 500) {
      ElMessage.error(`获取区域列表失败（500）：后端接口报错，请查看后端日志`);
    } else {
      ElMessage.error(
        `获取区域列表失败（${error.response?.status || "网络错误"}）`
      );
    }
    areaList.value = [];
  }
};

// 获取果园员工列表（修复：使用正确的ID字段 + 增加调试日志）
const fetchEmployeeList = async () => {
  try {
    const currentOrchardId = orchardId.value;
    if (!currentOrchardId || currentOrchardId <= 0) {
      ElMessage.warning(
        "当前用户未绑定有效果园ID（需大于0），无法获取员工列表"
      );
      employeeList.value = [];
      return;
    }

    const response = await axios.get("/api/employee/getEmpNameByOrchardIds", {
      params: { orchardId: currentOrchardId },
    });

    // 新增：打印原始返回数据，便于调试
    console.log("员工接口返回数据：", response.data);

    let empData = response.data?.data || [];
    if (!Array.isArray(empData)) {
      empData = [empData];
    }

    // 修正核心问题：使用后端返回的id字段（而非不存在的empId）
    const uniqueEmps = {};
    empData.forEach((item) => {
      const empId = item.id; // 改用后端实际返回的id字段
      if (empId && item.name) {
        uniqueEmps[empId] = {
          id: Number(empId), // 转数字避免字符串ID的问题
          name: item.name,
        };
      }
    });
    employeeList.value = Object.values(uniqueEmps);
  } catch (error) {
    console.error("获取员工列表失败详情：", {
      url: error.config?.url,
      params: error.config?.params,
      status: error.response?.status,
      responseData: error.response?.data,
    });
    ElMessage.error("获取员工列表失败，请稍后重试");
    employeeList.value = [];
  }
};

// 获取任务列表（适配新的query接口）
const fetchTaskList = async () => {
  try {
    // 增加果园ID有效性校验
    if (!orchardId.value || orchardId.value <= 0) {
      ElMessage.warning("当前用户未绑定有效果园ID，无法获取任务列表");
      taskList.value = [];
      return;
    }

    // 构造查询参数（确保status/taskScope/taskType为字符串传给后端）
    const queryParams = {
      orchardId: orchardId.value, // 必传果园ID
      creatorId: creatorId.value, // 发布者ID
      status: filterParams.value.status || "", // 字符串格式
      taskScope: filterParams.value.taskScope || "", // 字符串格式
      taskType: filterParams.value.taskType || "", // 字符串格式
      receiverId: filterParams.value.receiverName || "",
    };

    console.log("查询任务参数：", queryParams);

    const response = await axios.post("/api/task/queryCreaterId", queryParams);
    if (response.data && response.data.code === 200) {
      // 处理后端返回的数据，补充前端需要的字段
      taskList.value = (response.data.data || []).map((item) => ({
        ...item,
        // 补充前端表格需要的字段
        username: username.value, // 发布人名称
        orchardName: `果园${item.orchardId}`, // 可根据实际接口返回的果园名称替换
        taskTitle: item.taskTitle || "",
        taskInfo: item.taskInfo || "",
        deadline: item.deadline || "",
        imgsURL: item.imgsURL
          ? Array.isArray(item.imgsURL)
            ? item.imgsURL
            : item.imgsURL.split(",")
          : [],
        postTime: item.createTime, // 用创建时间作为发布时间
      }));
      ElMessage.success("任务列表加载成功");
    } else {
      ElMessage.error(`获取任务列表失败：${response.data?.msg || "未知错误"}`);
    }
  } catch (error) {
    console.error("获取任务列表失败：", {
      url: error.config?.url,
      data: error.config?.data,
      status: error.response?.status,
      responseData: error.response?.data,
    });
    ElMessage.error(
      `获取任务列表失败（${error.response?.status || "网络错误"}）`
    );
  }
};

// 筛选
const handleFilter = () => {
  fetchTaskList();
  ElMessage.success("筛选完成");
};

// 查看详情
const handleViewDetail = (row) => {
  currentTask.value = { ...row };
  showDetailDialog.value = true;
};

// 删除任务
const handleDeleteTask = async (taskId) => {
  try {
    await ElMessageBox.confirm("此操作将永久删除该任务, 是否继续?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    taskList.value = taskList.value.filter((item) => item.id !== taskId);
    ElMessage.success("任务删除成功!");
  } catch (error) {
    ElMessage.info("已取消删除");
  }
};

const formatTime = (time) => {
  if (!time) return "未设置";

  // 步骤1：解析时间为本地时间戳
  const localTime = new Date(time).getTime();
  // 步骤2：加上8小时时区偏移（抵消toISOString的UTC转换）
  const utc8Time = new Date(localTime + 8 * 60 * 60 * 1000);
  // 步骤3：删除T/Z，去掉毫秒，补全格式
  const iso = utc8Time.toISOString();
  const noTZ = iso.replace(/T|Z/g, "");
  const noMs = noTZ.split(".")[0];

  return noMs.slice(0, 10) + " " + noMs.slice(10);
};

/**
 * 时间格式化工具：将任意时间格式解析为中国时区（UTC+8）的 YYYY-MM-DD HH:mm:ss 格式（无T/Z）
 * @param {string|number|Date} time - 输入时间（支持字符串/时间戳/Date对象）
 * @param {string} fallback - 空值兜底文本，默认'未设置'
 * @returns {string} 格式化后的时间字符串（YYYY-MM-DD HH:mm:ss）
 */
const formatTimeToCST = (time, fallback = "未设置") => {
  // 1. 空值兜底
  if (!time) return fallback;

  try {
    // 2. 解析时间为Date对象（兼容所有输入类型）
    const date = new Date(time);
    // 校验是否为有效时间（Invalid Date 处理）
    if (isNaN(date.getTime())) return fallback;

    // 3. 计算中国时区（UTC+8）时间戳（抵消toISOString的UTC偏移）
    const localTimeStamp = date.getTime();
    const cstTimeStamp = localTimeStamp + 8 * 60 * 60 * 1000; // +8小时时区偏移
    const cstDate = new Date(cstTimeStamp);

    // 4. 生成ISO字符串并处理格式（保留三位毫秒，删除T/Z，拼接为目标格式）
    const isoStr = cstDate.toISOString(); // 格式：2026-03-09T12:00:00.000Z
    // 步骤1：删除T和Z → 2026-03-0912:00:00.000
    const noTZStr = isoStr.replace(/T|Z/g, "");
    // 步骤2：拆分日期、时间+毫秒 → 日期：2026-03-09，时间+毫秒：12:00:00.000
    const datePart = noTZStr.slice(0, 10); // 日期部分：YYYY-MM-DD
    const timeWithMsPart = noTZStr.slice(10); // 时间+毫秒：HH:mm:ss.SSS

    // 步骤3：拼接为 yyyy-MM-dd HH:mm:ss.SSS
    return `${datePart} ${timeWithMsPart}`;
    // 最终输出示例：2026-03-09 12:00:00.000
  } catch (error) {
    // 异常兜底（如输入非法时间字符串）
    console.warn("时间格式化失败：", error, "输入值：", time);
    return fallback;
  }
};
const totalSalary = computed(() => {
  return filteredTaskList.value.reduce((sum, task) => {
    const salary = Number(task.salary) || 0;
    return sum + salary;
  }, 0);
});
// 核心改造：发布任务（完全匹配后端add接口参数要求）
const handlePublish = async () => {
  try {
    // 先校验果园ID有效性
    if (!orchardId.value || orchardId.value <= 0) {
      ElMessage.error("当前用户未绑定有效果园，无法发布任务");
      return;
    }

    // 表单校验
    await publishFormRef.value.validate();

    // 确定区域ID：如果选择了全园则areaId为0，否则取第一个选中的区域ID
    let areaId = 0;
    if (
      publishForm.value.taskScope.length > 0 &&
      !publishForm.value.taskScope.includes(0)
    ) {
      areaId = publishForm.value.taskScope[0] || 0;
    }

    // 构造后端要求的完整提交数据
    const submitData = {
      areaId: areaId, // 区域id
      completionTime: "", // 完成时间为空
      creatorId: publishForm.value.creatorId, // 发布者id
      deadline: formatTimeToCST(publishForm.value.deadline), // 截止时间转ISO格式
      empIds: publishForm.value.empIds, // 发送的人数组
      groupContent: publishForm.value.taskTitle, // 组内容
      groupDescription: publishForm.value.taskInfo, // 组描述
      groupName: publishForm.value.taskTitle, // 组名
      imgsURL: [], // 图片URL空数组
      orchardId: publishForm.value.orchardId, // 果园id
      postTime: formatTimeToCST(new Date()), // 发布时间转ISO格式
      status: publishForm.value.status, // 状态（数字）
      taskInfo: publishForm.value.taskInfo, // 任务信息
      taskTitle: publishForm.value.taskTitle, // 任务标题
      taskType: publishForm.value.taskType, // 任务类型（数字）
      salary: publishForm.value.salary || null,
    };

    console.log("发布任务提交参数：", submitData);

    // 调用发布任务接口
    const response = await axios.post("/api/task/add", submitData);
    if (response.data && response.data.code === 200) {
      ElMessage.success("任务发布成功！");
      showPublishDialog.value = false;

      // 重置表单
      publishForm.value = {
        taskTitle: "",
        taskInfo: "",
        taskType: "",
        taskScope: [],
        deadline: "",
        empIds: [],
        orchardId: orchardId.value,
        creatorId: creatorId.value,
        postTime: "",
        status: 1,
        groupId: "",
      };
      publishFormRef.value.resetFields();

      // 重新拉取任务列表
      fetchTaskList();
    } else {
      ElMessage.error(`发布失败：${response.data?.msg || "未知错误"}`);
    }
  } catch (error) {
    console.error("发布任务失败：", {
      url: error.config?.url,
      data: error.config?.data,
      status: error.response?.status,
      responseData: error.response?.data,
    });
    if (error.name === "ValidationError") {
      ElMessage.warning("请填写完整并正确的任务信息");
    } else {
      ElMessage.error(`发布失败（${error.response?.status || "网络错误"}）`);
    }
  }
};
const handleSelectionChange = (selection) => {
  selectedTaskIds.value = selection.map((item) => item.id);
};

// 批量审核通过
const handleBatchApprove = async () => {
  if (selectedTaskIds.value.length === 0) {
    ElMessage.warning("请至少选择一个任务");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要审核通过选中的 ${selectedTaskIds.value.length} 个任务吗？`,
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const response = await axios.post(
      "/api/task/reviewOk",
      selectedTaskIds.value
    );

    if (response.data && response.data.code === 200) {
      ElMessage.success("批量审核通过成功！");
      selectedTaskIds.value = [];
      fetchTaskList(); // 刷新列表
    } else {
      ElMessage.error(`审核失败：${response.data?.msg || "未知错误"}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量审核失败：", error);
      ElMessage.error(`审核失败（${error.response?.status || "网络错误"}）`);
    }
  }
};
const handleApproveTask = async (taskId) => {
  try {
    await ElMessageBox.confirm("确定要审核通过该任务吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 调用审核通过接口
    const response = await axios.post("/api/task/reviewOk", [taskId]);

    if (response.data && response.data.code === 200) {
      ElMessage.success("审核通过成功！");
      showDetailDialog.value = false;
      fetchTaskList(); // 刷新列表
    } else {
      ElMessage.error(`审核失败：${response.data?.msg || "未知错误"}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("审核失败：", error);
      ElMessage.error(`审核失败（${error.response?.status || "网络错误"}）`);
    }
  }
};

// 批量审核不通过
const handleBatchReject = async () => {
  if (selectedTaskIds.value.length === 0) {
    ElMessage.warning("请至少选择一个任务");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要审核不通过选中的 ${selectedTaskIds.value.length} 个任务吗？`,
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const response = await axios.post(
      "/api/task/reviewFaile",
      selectedTaskIds.value
    );

    if (response.data && response.data.code === 200) {
      ElMessage.success("批量审核不通过成功！");
      selectedTaskIds.value = [];
      fetchTaskList(); // 刷新列表
    } else {
      ElMessage.error(`审核失败：${response.data?.msg || "未知错误"}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量审核失败：", error);
      ElMessage.error(`审核失败（${error.response?.status || "网络错误"}）`);
    }
  }
};
const handleRejectTask = async (taskId) => {
  // 使用 ElMessageBox.prompt 让用户输入不通过原因
  try {
    const { value: failureReason } = await ElMessageBox.prompt(
      "请输入审核不通过的原因",
      "审核不通过",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /.+/,
        inputErrorMessage: "请填写不通过原因",
        inputType: "textarea",
        inputPlaceholder: "请详细说明不通过的理由...",
      }
    );

    // 构造提交数据，包含 failure 字段
    const rejectData = {
      ids: [taskId],
      failure: failureReason,
    };

    // 调用审核不通过接口
    const response = await axios.post("/api/task/reviewFaile", rejectData);

    if (response.data && response.data.code === 200) {
      ElMessage.success("审核不通过成功！");
      showDetailDialog.value = false;
      fetchTaskList(); // 刷新列表
    } else {
      ElMessage.error(`审核失败：${response.data?.msg || "未知错误"}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("审核失败：", error);
      ElMessage.error(`审核失败（${error.response?.status || "网络错误"}）`);
    }
  }
};
// 初始化加载
onMounted(() => {
  fetchAreaList(); // 先加载区域列表
  fetchEmployeeList(); // 加载员工列表
  fetchTaskList(); // 加载任务列表
});
</script>

<style scoped>
.task-page {
  padding: 20px;
  background-color: #ffffff;
  min-height: calc(100vh - 120px);
}

.filter-bar {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
}

.filter-select {
  width: 180px;
}

.filter-btn,
.reset-btn,
.publish-btn {
  white-space: nowrap;
}

.reset-btn {
  color: #606266;
}

.task-list-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

:deep(.el-table) {
  --el-table-header-text-color: #303133;
  --el-table-row-hover-bg-color: #ffffff;
  --el-table-row-stripe-bg-color: #ffffff;
}

:deep(.el-tag) {
  padding: 2px 8px;
}

.task-detail {
  padding: 10px 0;
}

.detail-base-info :deep(.el-descriptions) {
  --el-descriptions-label-color: #606266;
  --el-descriptions-content-color: #303133;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.image-item {
  border: 1px solid #eee;
  padding: 5px;
  border-radius: 6px;
  background: #ffffff;
}

:deep(.image-error) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #ffffff;
  color: #999;
  border: 1px dashed #ddd;
}

.no-image {
  padding: 20px 0;
  text-align: center;
}

/* 多选下拉框样式优化 */
:deep(.el-select__tags) {
  flex-wrap: wrap;
}
.batch-btn {
  margin-left: 10px;
  white-space: nowrap;
}
.salary-statistics {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px; /* 与 el-select 高度一致 */
  padding: 0 16px; /* 只保留水平方向 padding */
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
  border-radius: 6px;
  color: #303133;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.statistics-label {
  font-size: 14px;
  line-height: 1;
}

.statistics-value {
  /* padding-top: 5px; */
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
}
</style>