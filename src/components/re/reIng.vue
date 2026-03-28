<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="handleVisibleChange"
    title="招聘任务详情"
    width="800px"
    @close="handleClose"
  >
    <div class="recruit-detail">
      <el-descriptions :column="2" border style="margin-bottom: 20px">
        <el-descriptions-item label="招聘标题">{{
          currentRecruit.title
        }}</el-descriptions-item>
        <el-descriptions-item label="招聘地点">{{
          currentRecruit.orchardName
        }}</el-descriptions-item>
        <el-descriptions-item label="招聘人数"
          >{{ currentRecruit.needNumber || 0 }} 人</el-descriptions-item
        >
        <el-descriptions-item label="日薪"
          >{{ currentRecruit.salary || 0 }} 元/天</el-descriptions-item
        >
        <el-descriptions-item label="招聘状态">
          <el-tag
            :type="
              displayRecruit.status === 2
                ? 'success'
                : displayRecruit.status === 1
                ? 'primary'
                : 'warning'
            "
          >
            {{
              displayRecruit.status === 2
                ? "已完成"
                : displayRecruit.status === 1
                ? "进行中"
                : "未完成"
            }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布时间">{{
          formatTime(currentRecruit.createTime)
        }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">
          {{
            currentRecruit.updateTime
              ? formatTime(currentRecruit.updateTime)
              : "暂未完成"
          }}
        </el-descriptions-item>
        <el-descriptions-item label="发布人">{{
          currentRecruit.senderName || "未知"
        }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">招聘内容</el-divider>
      <div class="content-box">
        {{ currentRecruit.content || "无" }}
      </div>

      <el-divider content-position="left">招聘进度</el-divider>
      <div class="progress-section">
        <el-progress
          :percentage="currentRecruit.progress || 0"
          :color="currentRecruit.progress === 100 ? '#67c23a' : '#409eff'"
          :stroke-width="16"
        />
        <p style="margin-top: 10px; color: #666; text-align: center">
          当前进度：{{ currentRecruit.progress || 0 }}%
        </p>
      </div>

      <el-divider content-position="left">修改任务状态</el-divider>
      <el-form :model="updateForm" label-width="120px">
        <el-form-item label="任务状态">
          <el-select v-model="updateForm.status" placeholder="请选择新状态">
            <el-option label="未完成" :value="1" />
            <el-option label="进行中" :value="2" />
            <el-option label="已完成" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleUpdate">确认修改</el-button>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/modules/user";
import axios from "axios";
import dayjs from "dayjs";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  currentRecruit: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

const emit = defineEmits(["update:visible", "update-success"]);

// 新增：处理弹窗显隐变化
const handleVisibleChange = (newVal) => {
  emit("update:visible", newVal);
};

const userStore = useUserStore();

// 更新表单（适配后端 /api/announceInfo/change 接口）
const updateForm = ref({
  id: 0,
  status: 0,
});

// 监听当前任务变化，初始化表单
watch(
  () => props.currentRecruit,
  (newVal) => {
    console.log("currentRecruit 变化:", newVal);
    console.log(
      "status 原始值:",
      newVal?.status,
      "类型:",
      typeof newVal?.status
    );
    console.log("转换后:", Number(newVal?.status));

    if (newVal && Object.keys(newVal).length > 0) {
      updateForm.value = {
        id: newVal.id || 0,
        status: Number(newVal.status) || 0,
      };
    } else {
      // 空对象时设置默认值
      updateForm.value = {
        id: 0,
        status: 0,
      };
    }
  },
  { immediate: true, deep: true }
);

// 时间格式化
const formatTime = (time) => {
  if (!time) return "-";
  return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
};
const displayRecruit = computed(() => {
  // 如果 currentRecruit 是空对象，返回默认值
  if (!props.currentRecruit || Object.keys(props.currentRecruit).length === 0) {
    return {
      status: 0, // 默认状态为0
    };
  }

  // 返回转换后的数据，确保 status 是数字
  return {
    ...props.currentRecruit,
    status: Number(props.currentRecruit.status) || 0,
  };
});
// 修改任务状态
const handleUpdate = async () => {
  try {
    const res = await axios.post("/api/announceInfo/change", {
      ...props.currentRecruit,
      status: updateForm.value.status,
      isFinish: updateForm.value.status === 2 ? 1 : 0,
      updateUser: userStore.user.id || 0,
    });

    if (res.data.code === 200) {
      ElMessage.success("任务状态修改成功");
      emit("update-success");
      emit("update:visible", false);
    } else {
      ElMessage.error(res.data.msg || "修改失败");
    }
  } catch (err) {
    ElMessage.error("修改失败");
    console.error(err);
  }
};

// 关闭弹框
const handleClose = () => {
  emit("update:visible", false);
};
</script>

<style scoped>
.recruit-detail {
  padding: 10px 0;
}

.content-box {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  line-height: 1.6;
  color: #333;
}

.progress-section {
  margin-top: 20px;
  padding: 20px;
  background: #fafafa;
  border-radius: 6px;
}
</style>