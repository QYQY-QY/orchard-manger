<template>
  <CommonLayout>
    <div class="ai-chat-fullscreen">
      <!-- 聊天内容区域（拉高） -->
      <div class="chat-content" ref="chatContent">
        <!-- 欢迎语 -->
        <div class="message-item ai-message" v-if="messages.length === 0">
          <div class="message-bubble">
            你好！我是果园管理AI助手，有任何问题都可以问我～
          </div>
        </div>

        <!-- 聊天消息列表 -->
        <div
          class="message-item"
          :class="{
            'user-message': item.type === 'user',
            'ai-message': item.type === 'ai',
          }"
          v-for="(item, index) in messages"
          :key="index"
        >
          <div class="message-bubble">
            {{ item.content }}
          </div>
        </div>

        <!-- 加载中状态 -->
        <div class="message-item ai-message" v-if="loading">
          <div class="message-bubble loading-bubble">
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-wrapper">
        <div class="chat-input-area">
          <!-- 四个功能按钮 -->
          <div class="function-grid">
            <div
              class="function-btn"
              @click="handleWeedDetection"
              title="YOLOv11目标检测"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                  fill="#666"
                />
                <circle cx="12" cy="12" r="3" fill="#666" />
              </svg>
              <span>目标检测</span>
            </div>

            <div
              class="function-btn"
              @click="handleDiseaseDetection"
              title="病虫害分析"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  fill="#f56c6c"
                />
              </svg>
              <span>病虫害</span>
            </div>

            <div
              class="function-btn"
              @click="handleMaturityDetection"
              title="成熟度分析"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 7.5c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                  fill="#e6a23c"
                />
              </svg>
              <span>成熟度</span>
            </div>

            <div
              class="function-btn"
              @click="handleWaterFertilizer"
              title="水肥需求分析"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 4v16H6V8.83L10.83 4H18m0-2h-8L4 8v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
                  fill="#67c23a"
                />
              </svg>
              <span>水肥需求</span>
            </div>
          </div>

          <!-- 原有的上传文件按钮和图像生成按钮 -->
          <div class="function-bar">
            <label class="function-btn" title="上传文件/图片">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM14 8V2L20 8H14Z"
                  fill="#666"
                />
              </svg>
              <input
                type="file"
                multiple
                style="display: none"
                @change="handleFileUpload"
                ref="fileInput"
              />
            </label>
            <span class="divider"></span>
            <div
              class="function-btn"
              title="图像生成"
              @click="handleImageGenerate"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.5L14.5 12L19 18H5L8.5 13.5Z"
                  fill="#666"
                />
              </svg>
              <span>图像生成</span>
            </div>
          </div>

          <!-- 输入框 + 内嵌发送按钮 -->
          <div class="input-with-send">
            <textarea
              v-model="inputContent"
              class="chat-input"
              placeholder="请输入您的问题..."
              @keydown.enter.exact="handleSendMessage"
              @keydown.ctrl.enter="handleNewLine"
              rows="1"
            ></textarea>

            <!-- 发送按钮 -->
            <button
              class="send-btn-inner"
              @click="handleSendMessage"
              :disabled="!inputContent.trim()"
              title="发送"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
                  fill="white"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </CommonLayout>
</template>

<script setup>
import CommonLayout from "@/views/common/CommonLayout.vue";
import { ref, watch, nextTick, onUnmounted } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
onUnmounted(() => {
  if (typingTimer) clearTimeout(typingTimer);
});
// 打字机效果相关
const typingSpeed = 10; // 每个字的间隔（毫秒）
let typingTimer = null;
// AI聊天功能逻辑
const messages = ref([]);
const inputContent = ref("");
const loading = ref(false);
const chatContent = ref(null);
const fileInput = ref(null);
// 固定回复内容
const FIXED_REPLY =
  "非常感谢您的提问！果园管理系统致力于为您提供高效、便捷的果园管理解决方案，如需详细帮助，请联系人工客服。";
const typewriter = (text, index = 0) => {
  if (index < text.length) {
    const lastMessage = messages.value[messages.value.length - 1];
    if (lastMessage && lastMessage.type === "ai") {
      lastMessage.content = text.substring(0, index + 1);
    }
    typingTimer = setTimeout(() => {
      typewriter(text, index + 1);
    }, typingSpeed);
  } else {
    if (typingTimer) clearTimeout(typingTimer);
  }
};
// 发送消息
const handleSendMessage = async (e) => {
  if (e) e.preventDefault();
  const content = inputContent.value.trim();
  if (!content) return;

  messages.value.push({ type: "user", content });
  inputContent.value = "";
  loading.value = true;

  try {
    const res = await axios.post("/api/AI/chat", content, {
      headers: {
        "Content-Type": "text/plain", // 指定为纯文本
      },
    });
    if (res.data.code === 200) {
      // 先添加空消息
      messages.value.push({ type: "ai", content: "" });
      // 开始打字机效果
      typewriter(res.data.data);
    } else {
      messages.value.push({ type: "ai", content: "服务异常，请稍后重试" });
    }
  } catch (error) {
    messages.value.push({ type: "ai", content: "网络错误，请检查连接" });
    console.error("聊天接口错误:", error);
  } finally {
    loading.value = false;
  }
};

// 处理换行（Ctrl+Enter）
const handleNewLine = (e) => {
  e.preventDefault();
  inputContent.value += "\n";
};

// 处理文件上传
const handleFileUpload = async (e) => {
  const files = e.target.files;
  if (!files.length) return;

  const file = files[0];
  const formData = new FormData();

  // 根据文件类型选择接口
  let url = "/AI/YOLOv11Weed";
  let fieldName = "weedFile";

  if (file.type.includes("image")) {
    // 可以在这里根据需求选择病虫害或成熟度接口
    url = "/AI/identify-disease";
    fieldName = "diseaseFile";
  }

  formData.append(fieldName, file);

  loading.value = true;
  messages.value.push({ type: "user", content: `[文件] ${file.name}` });

  try {
    const res = await axios.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.code === 200) {
      // 先添加空消息
      messages.value.push({ type: "ai", content: "" });
      // 开始打字机效果
      typewriter(res.data.data);
    } else {
      messages.value.push({ type: "ai", content: "文件分析失败" });
    }
  } catch (error) {
    messages.value.push({ type: "ai", content: "文件上传失败" });
    console.error("上传错误:", error);
  } finally {
    loading.value = false;
    e.target.value = ""; // 清空文件选择
  }
};

// 自动滚动到底部
watch(
  messages,
  async () => {
    await nextTick();
    if (chatContent.value) {
      chatContent.value.scrollTop = chatContent.value.scrollHeight;
    }
  },
  { deep: true }
);
</script>

<style scoped>
/* 核心：占满整个布局区域，无任何背景、边距 */
.ai-chat-fullscreen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
  overflow: hidden;
}

/* 聊天内容区域：大幅拉高，占满更多空间 */
.chat-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: transparent;
  scrollbar-width: thin;
  scrollbar-color: #e4e7ed transparent;
  /* 关键：拉高对话区，设置最小高度 */
  min-height: calc(100vh - 390px); /* 占满屏幕高度，仅留输入框空间 */
}

.chat-content::-webkit-scrollbar {
  width: 6px;
}

.chat-content::-webkit-scrollbar-thumb {
  background-color: #e4e7ed;
  border-radius: 3px;
}

/* 消息项样式（无头像） */
.message-item {
  display: flex;
  margin-bottom: 20px;
  max-width: 75%;
}

.user-message {
  flex-direction: row;
  margin-left: auto;
  justify-content: flex-end;
}

.ai-message {
  margin-right: auto;
}

.message-bubble {
  padding: 12px 18px;
  border-radius: 20px;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.user-message .message-bubble {
  background-color: #409eff;
  color: white;
  border-bottom-right-radius: 6px;
}

.ai-message .message-bubble {
  background-color: white;
  color: #303133;
  border: 1px solid #e4e7ed;
  border-bottom-left-radius: 6px;
}

/* 加载中样式 */
.loading-bubble {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
}

.loading-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #409eff;
  animation: loading 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loading {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 输入区域容器（保持原有样式不变） */
.chat-input-wrapper {
  padding: 16px 24px;
  border-top: 1px solid #e4e7ed;
  background: white;
}

.chat-input-area {
  border: 1px solid #e4e7ed;
  border-radius: 24px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  /* 输入框高度保持不变 */
  min-height: 80px;
}

/* 精简后的功能按钮栏 */
.function-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.function-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: background 0.2s;
}

.function-btn:hover {
  background-color: #f5f5f5;
}

.divider {
  width: 1px;
  height: 20px;
  background-color: #e4e7ed;
}

/* 输入框 + 内嵌发送按钮容器 */
.input-with-send {
  position: relative;
  width: 90%;
}

.chat-input {
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  min-height: 40px; /* 输入框高度保持不变 */
  max-height: 120px;
  overflow-y: auto;
  background: transparent;
  padding-right: 60px;
  width: 100%;
  box-sizing: border-box;
}

.chat-input::placeholder {
  color: #999;
}

/* 内嵌发送按钮样式 */
.send-btn-inner {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #409eff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn-inner:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
}

.send-btn-inner:not(:disabled):hover {
  background-color: #66b1ff;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .chat-content {
    padding: 16px;
    min-height: calc(100vh - 290px);
  }
  .message-item {
    max-width: 85%;
  }
  .chat-input-wrapper {
    padding: 12px 16px;
  }
  .function-btn span {
    display: none;
  }
}
.function-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 4px;
}

.function-grid .function-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 8px;
  background-color: #f8f9fa;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.2s;
}

.function-grid .function-btn:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.function-grid .function-btn span {
  font-size: 12px;
  color: #666;
}

.function-grid .function-btn:hover span {
  color: #409eff;
}

.function-grid .function-btn svg {
  width: 24px;
  height: 24px;
}

/* 原有的功能栏调整 */
.function-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  border-top: 1px solid #f0f2f5;
  padding-top: 8px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .function-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>