<template>
  <CommonLayout>
    <div class="task-page">
      <!-- 筛选区域 - 适配任务范围多选 -->
      <div class="filter-bar">
        <div class="filter-group">
          <div class="filter-item">
            <label class="filter-label">任务类型：</label>
            <el-select v-model="filterParams.taskType" placeholder="请选择任务类型" class="filter-select">
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
            <el-select v-model="filterParams.status" placeholder="请选择任务状态" class="filter-select">
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
            <el-select v-model="filterParams.receiverName" placeholder="请选择负责人" class="filter-select">
              <el-option label="全部负责人" value="" />
              <el-option v-for="emp in employeeList" :key="emp.id" :label="emp.name" :value="emp.name" />
            </el-select>
          </div>
          <div class="filter-item">
            <label class="filter-label">时间范围：</label>
            <el-date-picker v-model="filterParams.deadlineRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" class="filter-select" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" style="width: 240px" />
          </div>
          <el-button type="primary" @click="handleFilter" class="filter-btn">筛选</el-button>
          <el-button @click="resetFilter" class="reset-btn">重置</el-button>
          <div class="salary-statistics">
            <span class="statistics-label">薪资统计：</span>
            <span class="statistics-value">¥ {{ totalSalary.toFixed(2) }}</span>
          </div>
        </div>
        <el-button type="primary" class="publish-btn" @click="showPublishDialog = true">发布任务</el-button>
        <el-button type="success" class="batch-btn" @click="handleBatchApprove"
          :disabled="selectedTaskIds.length === 0">批量审核通过</el-button>
        <el-button type="danger" class="batch-btn" @click="handleBatchReject"
          :disabled="selectedTaskIds.length === 0">批量审核不通过</el-button>
      </div>

      <!-- 任务列表 - 保持不变 -->
      <div class="task-list-wrapper">
        <el-table :data="filteredTaskList" stripe style="width: 100%" @selection-change="handleSelectionChange">
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
              <el-tag :type="row.status === 0
                  ? 'primary'
                  : row.status === 1
                    ? 'warning'
                    : row.status === 3
                      ? 'success'
                      : 'danger'
                ">
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
        <el-form :model="publishForm" label-width="100px" ref="publishFormRef" :rules="publishRules">
          <el-form-item label="任务标题" prop="taskTitle">
            <el-input v-model="publishForm.taskTitle" placeholder="请输入任务标题" maxlength="50" show-word-limit />
          </el-form-item>
          <el-form-item label="任务内容" prop="taskInfo">
            <el-input v-model="publishForm.taskInfo" type="textarea" placeholder="请输入任务内容" rows="3" maxlength="200"
              show-word-limit />
          </el-form-item>
          <el-form-item label="任务类型" prop="taskType">
            <el-select v-model="publishForm.taskType" placeholder="请选择任务类型">
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
            <el-select v-model="publishForm.taskScope" placeholder="请选择任务范围" multiple collapse-tags style="width: 100%">
              <el-option label="全合作社" value="0" />
              <el-option v-for="area in areaList" :key="area.id" :label="area.name" :value="area.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="截止时间" prop="deadline">
            <el-date-picker v-model="publishForm.deadline" type="datetime" placeholder="请选择截止时间"
              format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <!-- 改造3：任务负责人 - 多选 -->
          <el-form-item label="任务负责人" prop="empIds">
            <el-select v-model="publishForm.empIds" placeholder="请选择任务负责人" filterable clearable multiple collapse-tags
              style="width: 100%">
              <el-option v-for="emp in employeeList" :key="emp.id" :label="emp.name" :value="Number(emp.id)" />
            </el-select>
          </el-form-item>
          <el-form-item label="任务薪资" prop="salary">
            <el-input-number v-model="publishForm.salary" :min="0" :precision="2" placeholder="请输入任务薪资"
              style="width: 40%" />
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
      <el-dialog v-model="showDetailDialog" title="任务详情" width="800px" center>
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
                <el-tag :type="currentTask.status === 0
                    ? 'primary'
                    : currentTask.status === 1
                      ? 'warning'
                      : currentTask.status === 3
                        ? 'success'
                        : 'danger'
                  ">
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
              <el-descriptions-item label="不通过原因" v-if="currentTask.failure">
                {{ currentTask.failure }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="detail-images" v-if="currentTask.imgsURL && currentTask.imgsURL.length > 0">
            <h4 style="margin-bottom: 10px; color: #333">任务相关图片：</h4>
            <div class="image-grid">
              <div class="image-item" v-for="(img, index) in currentTask.imgsURL" :key="index">
                <el-image :src="img" :preview-src-list="currentTask.imgsURL" fit="cover"
                  style="width: 200px; height: 150px; border-radius: 4px">
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
            <el-button type="success" @click="handleApproveTask(currentTask.id)" size="default">
              审核通过
            </el-button>
            <el-button type="danger" @click="handleRejectTask(currentTask.id)" size="default">
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
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/stores/modules/user";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import CommonLayout from "@/views/common/CommonLayout.vue";
import { useRouter, useRoute } from "vue-router";
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const username = computed(() => userStore.user.username || "");
const orchardId = computed(() => userStore.user.orchardId || 0);
const creatorId = computed(() => userStore.user.id || 0);
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

  // 任务倒序（最新的在最上面）
  list.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

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
      console.log("【区域列表】原始数据:", areaData);
      areaList.value = areaData
        .map((item) => ({
          id: Number(item.id), // 区域ID（字符串转数字，避免类型问题）
          name: item.name || "未命名区域", // 区域名称
        }))
        .filter((item) => item.id && item.name); // 过滤无效数据
      console.log(
        "【区域列表】处理后的数据:",
        JSON.parse(JSON.stringify(areaList.value))
      );
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
      const empId = item.id; // 改用后端实际返回的 id 字段
      if (empId && item.name) {
        uniqueEmps[empId] = {
          id: Number(empId), // 转数字避免字符串 ID 的问题
          name: item.name,
          areaId: item.areaId ? Number(item.areaId) : null, // 保存 areaId 用于匹配区域负责人
          username: item.username,
          phone: item.phone,
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
// 发布任务
const handlePublish = async () => {
  try {
    // 先校验果园 ID 有效性
    if (!orchardId.value || orchardId.value <= 0) {
      ElMessage.error("当前用户未绑定有效果园，无法发布任务");
      return;
    }

    // 表单校验
    await publishFormRef.value.validate();

    // 确定区域 ID：如果选择了全园则 areaId 为 0，否则取第一个选中的区域 ID
    let areaId = 0;
    if (
      publishForm.value.taskScope.length > 0 &&
      !publishForm.value.taskScope.includes(0)
    ) {
      areaId = publishForm.value.taskScope[0] || 0;
    }

    // 从缓存获取 reportId
    const reportIdStr = sessionStorage.getItem("pendingReportId");
    const reportId = reportIdStr ? Number(reportIdStr) : null;

    // 构造后端要求的完整提交数据
    const submitData = {
      areaId: areaId,
      completionTime: "",
      creatorId: publishForm.value.creatorId,
      deadline: formatTimeToCST(publishForm.value.deadline),
      empIds: publishForm.value.empIds,
      groupContent: publishForm.value.taskTitle,
      groupDescription: publishForm.value.taskInfo,
      groupName: publishForm.value.taskTitle,
      imgsURL: [],
      orchardId: publishForm.value.orchardId,
      postTime: formatTimeToCST(new Date()),
      status: publishForm.value.status,
      taskInfo: publishForm.value.taskInfo,
      taskTitle: publishForm.value.taskTitle,
      taskType: publishForm.value.taskType,
      salary: publishForm.value.salary || null,

      //有ID才传，避免传入null
      ...(reportId && { reportVo: { id: reportId } }),
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

      // ✅ 核心修改：从 sessionStorage 读取 reportId（而不是 route.query）
      const pendingReportId = sessionStorage.getItem("pendingReportId");
      console.log(
        "🔍 检查 sessionStorage 中的 pendingReportId:",
        pendingReportId
      );

      if (pendingReportId) {
        console.log(
          "✅ 检测到待更新的上报 ID:",
          pendingReportId,
          "准备更新上报状态"
        );
        // 清除存储，避免重复更新
        sessionStorage.removeItem("pendingReportId");

        // 延迟一点执行，确保任务已经发布成功
        setTimeout(async () => {
          try {
            const updateData = {
              id: Number(pendingReportId),
              status: 1,
            };

            console.log("正在调用更新接口，参数:", updateData);
            const updateResponse = await axios.post(
              "/api/report/update",
              updateData
            );

            console.log("更新接口返回:", updateResponse.data);

            if (updateResponse.data && updateResponse.data.code === 200) {
              console.log("✅ 上报状态更新成功:", pendingReportId);
              ElMessage.success("任务发布成功，上报状态已更新为已处理");

              // 通知 Report.vue 更新本地数据（可选）
              window.dispatchEvent(
                new CustomEvent("reportStatusUpdated", {
                  detail: { reportId: pendingReportId },
                })
              );
            } else {
              console.warn("上报状态更新失败:", updateResponse.data?.msg);
              ElMessage.warning("任务发布成功，但上报状态更新失败");
            }
          } catch (error) {
            console.error("更新上报状态失败:", error);
            console.error("错误详情:", {
              message: error.message,
              status: error.response?.status,
              data: error.response?.data,
            });
            ElMessage.warning("任务发布成功，但上报状态更新失败");
          }
        }, 500);
      } else {
        console.log("⚠️ sessionStorage 中没有待处理的 reportId");
      }
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
    const rejectData = [taskId];

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
// 检查路由参数并处理（从上报管理跳转过来的自动填充）
const checkRouteParams = () => {
  const { action, taskType, content, areaId, areaName, reportId } = route.query;

  console.log("=== checkRouteParams 被调用 ===");
  console.log("路由参数:", route.query);
  console.log("提取的 reportId:", reportId);

  // ✅ 核心修改：立即保存 reportId 到 sessionStorage，避免被清空
  if (reportId) {
    console.log("✅ 检测到 reportId:", reportId, "保存到 sessionStorage");
    sessionStorage.setItem("pendingReportId", reportId);
  } else {
    console.log("⚠️ 未检测到 reportId");
  }

  if (action === "publish") {
    console.log("检测到 action=publish，准备打开发布对话框");

    // 打开发布任务对话框
    setTimeout(() => {
      showPublishDialog.value = true;

      // 自动填充任务类型
      if (taskType) {
        publishForm.value.taskType = taskType;
      }

      // 自动填充任务内容（如果上报中有内容）
      if (content) {
        publishForm.value.taskInfo = content;
      }

      // 生成默认任务标题
      if (taskType) {
        if (areaName) {
          publishForm.value.taskTitle = `${taskType}任务（${areaName}区 - 来自上报）`;
        } else {
          publishForm.value.taskTitle = `${taskType}任务（来自上报）`;
        }
      }

      // 设置默认截止时间为明天的现在
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const deadlineStr = formatTimeToCST(tomorrow);
      publishForm.value.deadline = deadlineStr;
      console.log("✅ 自动设置截止时间:", deadlineStr);

      // 自动填充任务范围（区域）- 核心修改
      if (areaId) {
        console.log("需要填充的 areaId:", areaId, "类型:", typeof areaId);

        // 等待 areaList 加载完成后再设置 - 增加延迟时间
        setTimeout(() => {
          console.log("=== 开始填充区域和负责人 ===");
          console.log("此时 areaList 长度:", areaList.value.length);
          console.log("此时 employeeList 长度:", employeeList.value.length);
          console.log(
            "此时 areaList 内容:",
            JSON.parse(JSON.stringify(areaList.value))
          );
          console.log(
            "此时 employeeList 内容:",
            JSON.parse(JSON.stringify(employeeList.value))
          );

          const numericAreaId = Number(areaId);
          console.log(
            "转换后的 numericAreaId:",
            numericAreaId,
            "类型:",
            typeof numericAreaId
          );

          // 检查该 areaId 是否在 areaList 中存在
          const foundArea = areaList.value.find((area) => {
            const areaIdNum = Number(area.id);
            console.log(
              "比较：area.id =",
              area.id,
              "(",
              areaIdNum,
              ") vs 查找值 =",
              numericAreaId,
              "结果:",
              areaIdNum === numericAreaId
            );
            return areaIdNum === numericAreaId;
          });

          console.log("是否找到匹配的区域:", foundArea);

          if (foundArea) {
            publishForm.value.taskScope = [Number(numericAreaId)];
            console.log("✅ 自动填充区域成功:", numericAreaId);
            console.log("当前表单的 taskScope:", publishForm.value.taskScope);

            // 根据 areaId 查找对应的负责人
            const areaManager = employeeList.value.find((emp) => {
              const empAreaId = emp.areaId ? Number(emp.areaId) : null;
              console.log(
                "比较员工 areaId: emp.areaId =",
                emp.areaId,
                "(",
                empAreaId,
                ") vs 区域 ID =",
                numericAreaId,
                "结果:",
                empAreaId === numericAreaId
              );
              return empAreaId === numericAreaId;
            });

            console.log("是否找到匹配的负责人:", areaManager);

            if (areaManager) {
              publishForm.value.empIds = [areaManager.id];
              console.log(
                "✅ 自动填充负责人成功:",
                areaManager.name,
                "ID:",
                areaManager.id
              );
              console.log("当前表单的 empIds:", publishForm.value.empIds);
            } else {
              console.warn("⚠️ 未找到该区域的负责人，areaId:", numericAreaId);
              console.warn(
                "可用员工列表:",
                JSON.parse(JSON.stringify(employeeList.value))
              );
            }
          } else {
            console.warn("❌ 区域 ID 不存在于列表中:");
            console.warn("查找的 ID:", numericAreaId);
            console.warn(
              "可用区域列表:",
              JSON.parse(JSON.stringify(areaList.value))
            );
          }
        }, 500);
      }

      // ✅ 延迟清空路由参数（确保已经保存 reportId）
      setTimeout(() => {
        console.log("清空路由参数");
        // router.replace({ query: {} });
      }, 100);
    }, 200);
  }
};
// 初始化加载
onMounted(() => {
  fetchAreaList(); // 先加载区域列表
  fetchEmployeeList(); // 加载员工列表
  fetchTaskList(); // 加载任务列表

  // 检查路由参数，判断是否需要打开发布任务对话框
  checkRouteParams();
});
watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.action === "publish") {
      checkRouteParams();
    }
  }
);
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
  height: 32px;
  /* 与 el-select 高度一致 */
  padding: 0 16px;
  /* 只保留水平方向 padding */
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