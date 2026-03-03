<template>
  <CommonLayout>
    <!-- AI聊天界面核心内容 -->
    <div class="ai-chat-container">
      <!-- 聊天标题栏 -->
      <div class="chat-header">
        <h3>果园智能助手</h3>
        <el-button size="small" type="primary" @click="clearChat">清空对话</el-button>
      </div>

      <!-- 聊天消息列表 -->
      <div class="chat-messages" ref="chatContainer">
        <!-- 系统欢迎消息 -->
        <div v-if="messages.length === 0" class="system-message">
          <p>您好！我是果园管理智能助手，有任何问题都可以问我～</p>
        </div>

        <!-- 用户消息 -->
        <div class="message-item user-message" v-for="(msg, index) in messages" :key="index">
          <div class="avatar">
            <img :src="userAvatar" alt="用户头像" />
          </div>
          <div class="message-content">{{ msg.content }}</div>
        </div>

        <!-- AI消息 -->
        <div class="message-item ai-message" v-for="(msg, index) in messages" :key="index + 'ai'">
          <div class="avatar">
            <img src="https://picsum.photos/40/40?text=AI" alt="AI头像" />
          </div>
          <div class="message-content">
            <span v-if="msg.loading">AI正在思考中...</span>
            <span v-else>{{ msg.aiReply }}</span>
          </div>
        </div>
      </div>

      <!-- 输入发送区域 -->
      <div class="chat-input-area">
        <el-input
          v-model="inputContent"
          type="textarea"
          placeholder="请输入您的问题（例如：果园施肥注意事项、果树病虫害防治...）"
          :rows="3"
          @keyup.enter="handleSend"
        ></el-input>
        <el-button type="primary" @click="handleSend" :disabled="!inputContent.trim()">发送</el-button>
      </div>
    </div>
  </CommonLayout>
</template>

<script setup>
import CommonLayout from '@/views/common/CommonLayout.vue'
import { useUserStore } from '@/stores/modules/user'
import { computed, ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// 获取用户信息
const userStore = useUserStore()
const userName = computed(() => userStore.user.name || userStore.user.username)
// 用户头像（优先用用户自身头像，无则用默认）
const userAvatar = computed(() => {
  return userStore.user?.headImg || userStore.user?.user_pic || 'https://picsum.photos/40/40?text=用户'
})

// 聊天相关响应式数据
const inputContent = ref('') // 输入框内容
const messages = ref([]) // 聊天消息列表
const chatContainer = ref(null) // 聊天容器ref，用于滚动到底部

// 清空对话
const clearChat = () => {
  messages.value = []
  ElMessage.success('已清空所有对话')
}

// 发送消息
const handleSend = () => {
  const content = inputContent.value.trim()
  if (!content) return

  // 添加用户消息
  const newMsg = {
    content,
    aiReply: '',
    loading: true
  }
  messages.value.push(newMsg)
  inputContent.value = ''

  // 滚动到底部
  nextTick(() => {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  })

  // 模拟AI回复（实际项目可替换为真实接口请求）
  setTimeout(() => {
    newMsg.loading = false
    // 模拟不同问题的回复（可根据实际需求扩展）
    if (content.includes('施肥') || content.includes('肥料')) {
      newMsg.aiReply = '果园施肥建议：春季以氮肥为主，促进枝叶生长；秋季以磷钾肥为主，增强果树抗寒能力，施肥后及时浇水。'
    } else if (content.includes('病虫害') || content.includes('防治')) {
      newMsg.aiReply = '果树病虫害防治：优先采用生物防治（如引入天敌），化学防治需选择低毒农药，严格按照安全间隔期使用。'
    } else {
      newMsg.aiReply = `您的问题是：${content}，建议结合果园实际情况，参考当地农技站指导方案执行。`
    }
    // 再次滚动到底部
    nextTick(() => {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    })
  }, 1500)
}
</script>

<style scoped>
/* 整体容器 */
.ai-chat-container {
  width: 100%;
  height: calc(100vh - 140px);
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 聊天标题栏 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.chat-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

/* 聊天消息列表 */
.chat-messages {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  background-color: #f9fafb;
}

/* 系统欢迎消息 */
.system-message {
  text-align: center;
  color: #666;
  padding: 20px 0;
  font-size: 14px;
}

/* 消息项通用样式 */
.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  max-width: 80%;
}

/* 用户消息（靠右） */
.user-message {
  margin-left: auto;
  flex-direction: row-reverse;
}

/* AI消息（靠左） */
.ai-message {
  margin-right: auto;
}

/* 头像样式 */
.avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

/* 消息内容 */
.message-content {
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.user-message .message-content {
  background-color: #409eff;
  color: white;
}

.ai-message .message-content {
  background-color: white;
  color: #333;
  border: 1px solid #e5e7eb;
}

/* 输入区域 */
.chat-input-area {
  display: flex;
  gap: 12px;
}

.chat-input-area el-input {
  flex: 1;
}

.chat-input-area el-button {
  white-space: nowrap;
}
</style>