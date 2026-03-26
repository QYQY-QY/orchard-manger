<template>
  <CommonLayout>
    <div class="weather-alert-container">
      <el-card class="alert-card" v-if="alertData">
        <template #header>
          <div class="card-header">
            <span class="title">
              <el-icon :size="20" color="#f56c6c">
                <WarningFilled />
              </el-icon>
              {{ alertData.disaster_type || "天气预警" }}
            </span>
            <span class="time">{{ formatTime(alertData.findTime) }}</span>
          </div>
        </template>

        <div class="alert-content">
          <div class="alert-info">
            <div class="info-item">
              <span class="label">预警类型：</span>
              <span class="value">{{ alertData.disaster_type || "暂无" }}</span>
            </div>
            <div class="info-item">
              <span class="label">发现时间：</span>
              <span class="value">{{ formatTime(alertData.findTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间：</span>
              <span class="value">{{ formatTime(alertData.createTime) }}</span>
            </div>
          </div>

          <div class="alert-suggestion">
            <div class="suggestion-title">管理建议：</div>
            <div class="suggestion-content">{{ alertData.content }}</div>
          </div>
        </div>
        <div class="ai-solution-section">
          <el-button
            type="primary"
            size="large"
            @click="handleAISolution"
            :icon="ChatDotRound"
          >
            AI 解决预警
          </el-button>
        </div>
      </el-card>

      <el-empty v-else description="暂无天气预警" :image-size="120" />
    </div>
  </CommonLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { WarningFilled } from "@element-plus/icons-vue";
import axios from "axios";
import { useUserStore } from "@/stores/modules/user";

const router = useRouter();
const userStore = useUserStore();
const alertData = ref(null);

// 获取天气预警
const getWeatherAlert = async () => {
  try {
    const orchardId = userStore.user?.orchardId;
    if (!orchardId) {
      ElMessage.warning("未获取到果园ID");
      return;
    }

    const response = await axios.get("/api/AI/weather-alert", {
      params: { orchardId },
    });

    if (response.data && response.data.code === 200 && response.data.data) {
      alertData.value = response.data.data;
    } else {
      alertData.value = null;
    }
  } catch (error) {
    console.error("获取天气预警失败：", error);
    ElMessage.error("获取天气预警失败");
    alertData.value = null;
  }
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return "-";
  const date = new Date(time);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
// 处理 AI 解决预警
const handleAISolution = () => {
  if (!alertData.value || !alertData.value.disaster_type) {
    ElMessage.warning("没有可用的预警信息");
    return;
  }

  // 构建要发送给 AI 的消息内容
  const disasterType = alertData.value.disaster_type;
  const content = alertData.value.content || "";

  // 构造问题：预警类型 + 要怎么做
  const aiMessage = `当前遭遇${disasterType}天气预警，${
    content ? `管理建议：${content}。` : ""
  }请问我该如何应对？请提供详细的解决方案和措施。`;

  // 跳转到 AI 助手页面（AiChat），通过 query 参数传递消息
  router.push({
    path: "/AiChat",
    query: {
      autoSend: "true",
      message: encodeURIComponent(aiMessage),
    },
  });
};

onMounted(() => {
  getWeatherAlert();
});
</script>

<style scoped>
.weather-alert-container {
  padding: 20px;
}

.alert-card {
  max-width: 800px;
  margin: 0 auto;
  border-left: 4px solid #f56c6c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 8px;
}

.time {
  color: #999;
  font-size: 14px;
}

.alert-content {
  padding: 10px 0;
}

.alert-info {
  background-color: #fef0f0;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-item {
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
  font-weight: 500;
  display: inline-block;
  width: 80px;
}

.value {
  color: #333;
}

.alert-suggestion {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
}

.suggestion-title {
  font-weight: bold;
  color: #409eff;
  margin-bottom: 10px;
  font-size: 14px;
}

.suggestion-content {
  color: #666;
  line-height: 1.8;
  white-space: pre-wrap;
  font-size: 14px;
}

.ai-solution-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}

.ai-solution-section .el-button {
  min-width: 200px;
  font-size: 16px;
}
</style>