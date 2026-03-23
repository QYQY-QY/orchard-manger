<template>
  <CommonLayout>
    <div class="ai-chat-fullscreen">
      <!-- 聊天内容区域（固定高度，可滚动） -->
      <div class="chat-content" ref="chatContent">
        <!-- 欢迎语 -->
        <div class="message-item ai-message" v-if="messages.length === 0">
          <div class="message-bubble">
            你好！我是果园管理AI助手，有任何问题都可以问我～
          </div>
        </div>

        <!-- 聊天消息列表（无头像） -->
        <div class="message-item" :class="{ 'user-message': item.type === 'user', 'ai-message': item.type === 'ai' }"
          v-for="(item, index) in messages" :key="index">
          <div class="message-bubble">
            <!-- 如果是用户消息且包含图片，显示图片预览 -->
            <div v-if="item.type === 'user' && item.imageUrl" class="image-preview"
              @click="previewImage(item.imageUrl)">
              <img :src="item.imageUrl" alt="用户上传" @load="() => console.log('用户图片加载成功:', item.imageUrl)"
                @error="(e) => console.error('用户图片加载失败:', item.imageUrl, e)">
            </div>

            <!-- AI消息逐行显示 -->
            <div v-if="item.type === 'ai' && item.lines && item.lines.length > 0">
              <div v-for="(line, lineIndex) in item.lines" :key="lineIndex" class="ai-line"
                :class="{ 'line-visible': line.visible }">
                <span v-html="formatMessage(line.text)"></span>
              </div>
            </div>

            <!-- 普通消息显示 -->
            <div v-else-if="item.content" v-html="formatMessage(item.content)"></div>

            <!-- AI返回的图片 -->
            <div v-if="item.type === 'ai' && item.imageUrl" class="ai-image-container">
              <div class="ai-image-preview" @click="previewImage(item.imageUrl)">
                <img :src="item.imageUrl" alt="AI生成图片" @load="handleImageLoad(item)" @error="handleImageError(item)" />
              </div>
              <div v-if="item.imageError" class="image-error-tip">
                图片加载失败，请重试
              </div>
            </div>
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

        <!-- 底部占位元素，用于滚动定位 -->
        <div ref="bottomAnchor"></div>
      </div>

      <!-- 输入区域（固定在底部） -->
      <div class="chat-input-wrapper">
        <div class="chat-input-area">
          <!-- 功能按钮栏 -->
          <div class="function-bar">
            <!-- 图片识别上传按钮 -->
            <label class="function-btn" title="上传图片进行识别">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM14 8V2L20 8H14Z"
                  fill="#666" />
              </svg>
              <input type="file" accept="image/*" style="display: none" @change="handleImageSelect" ref="imageInput" />
              <span>图片识别</span>
            </label>

            <!-- 图片识别选项（当选中图片后显示） -->
            <div class="image-options" v-if="selectedImage">
              <button class="option-btn" @click="identifyDisease">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm3 12h-6v-2c0-2 4-2 4-2s4 0 4 2v2z"
                    fill="#409eff" />
                </svg>
                病虫害识别
              </button>
              <button class="option-btn" @click="identifyMaturity">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 22c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"
                    fill="#67c23a" />
                </svg>
                成熟度分析
              </button>
              <button class="option-btn cancel" @click="clearSelectedImage">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                    fill="#f56c6c" />
                </svg>
                取消
              </button>
            </div>
          </div>

          <!-- 选中的图片预览 -->
          <div class="selected-image-preview" v-if="selectedImage">
            <img :src="selectedImage.preview" alt="预览">
            <span class="file-name">{{ selectedImage.file.name }}</span>
          </div>

          <!-- 输入框 + 内嵌发送按钮 -->
          <div class="input-with-send">
            <textarea v-model="inputContent" class="chat-input" placeholder="请输入您的问题..."
              @keydown.enter.exact="handleSendMessage" @keydown.ctrl.enter="handleNewLine" rows="1"
              :disabled="loading"></textarea>

            <!-- 发送按钮 -->
            <button class="send-btn-inner" @click="handleSendMessage" :disabled="!inputContent.trim() || loading"
              title="发送">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="white" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 图片预览弹窗 -->
      <el-dialog v-model="previewVisible" title="图片预览" width="50%" destroy-on-close>
        <img :src="previewImageUrl" style="width: 100%;" alt="预览" @error="handlePreviewError">
      </el-dialog>
    </div>
  </CommonLayout>
</template>

<script setup>
import CommonLayout from '@/views/common/CommonLayout.vue'
import { ref, watch, nextTick, onUnmounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElDialog } from 'element-plus'

// AI聊天功能逻辑
const messages = ref([])
const inputContent = ref('')
const loading = ref(false)
const chatContent = ref(null)
const bottomAnchor = ref(null)
const fileInput = ref(null)
const imageInput = ref(null)

// 会话ID
const sessionId = ref('')

// 图片识别相关
const selectedImage = ref(null)
const previewVisible = ref(false)
const previewImageUrl = ref('')

// 存储所有生成的Blob URL，用于统一清理
const blobUrls = ref(new Set())

// 格式化消息
const formatMessage = (content) => {
  if (!content) return ''
  return content.replace(/\n/g, '<br>')
}

// 图片预览
const previewImage = (url) => {
  previewImageUrl.value = url
  previewVisible.value = true
}

// 添加调试代码 - 监控消息中的图片URL
watch(messages, (newMsgs) => {
  newMsgs.forEach((msg, index) => {
    if (msg.type === 'user' && msg.imageUrl) {
      console.log(`用户消息 ${index} 的图片URL:`, msg.imageUrl)
    }
  })
}, { deep: true })

// 处理图片加载成功
const handleImageLoad = (item) => {
  console.log('图片加载成功:', item.imageUrl)
  item.imageError = false
}

// 处理图片加载错误
const handleImageError = (item) => {
  console.error('图片加载失败:', item.imageUrl)
  item.imageError = true

  // 如果Blob URL加载失败，立即尝试转换为Data URL
  if (item.imageUrl && item.imageUrl.startsWith('blob:')) {
    console.log('尝试使用Data URL备选方案...')
    if (item.hexData) {
      const dataUrl = hexToDataUrl(item.hexData)
      if (dataUrl) {
        console.log('切换到Data URL成功')
        item.imageUrl = dataUrl
        item.imageError = false
      } else {
        console.error('Data URL转换失败')
      }
    }
  }
}

// 处理预览图片错误
const handlePreviewError = () => {
  ElMessage.error('图片加载失败')
  previewVisible.value = false
}

/**
 * 十六进制字符串转Data URL（备选方案）
 */
const hexToDataUrl = (hexString, mimeType = 'image/jpeg') => {
  if (!hexString) return ''

  try {
    // 清理十六进制字符串
    const cleanHex = hexString.replace(/\s/g, '').replace(/^0x/, '')

    // 确保长度为偶数
    const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex

    // 转换为字节数组
    const bytes = []
    for (let i = 0; i < paddedHex.length; i += 2) {
      bytes.push(parseInt(paddedHex.substring(i, i + 2), 16))
    }

    // 转换为二进制字符串
    const byteArray = new Uint8Array(bytes)
    let binary = ''
    for (let i = 0; i < byteArray.length; i++) {
      binary += String.fromCharCode(byteArray[i])
    }

    // 转换为base64
    const base64 = btoa(binary)

    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error('转换为Data URL失败:', error)
    return ''
  }
}

/**
 * 将16进制字符串转换为Blob URL
 */
const hexToImageUrl = (hexString) => {
  if (!hexString || typeof hexString !== 'string') {
    console.error('无效的图片数据')
    return ''
  }

  try {
    console.log('原始图片数据长度:', hexString.length)
    console.log('图片数据开头:', hexString.substring(0, 20))

    // 检查是否已经是Data URL
    if (hexString.startsWith('data:image')) {
      console.log('已经是Data URL格式')
      return hexString
    }

    // 检查是否是Base64格式的JPEG
    if (hexString.startsWith('/9j/')) {
      console.log('检测到Base64格式JPEG')
      return `data:image/jpeg;base64,${hexString}`
    }

    // 清理十六进制字符串
    const cleanHex = hexString.replace(/\s/g, '').replace(/^0x/, '')

    // 确保长度为偶数
    const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex

    // 将16进制字符串转换为字节数组
    const bytes = []
    for (let i = 0; i < paddedHex.length; i += 2) {
      const byte = parseInt(paddedHex.substring(i, i + 2), 16)
      if (isNaN(byte)) {
        console.error(`在第 ${i} 位置解析16进制失败: ${paddedHex.substring(i, i + 2)}`)
        continue
      }
      bytes.push(byte)
    }

    if (bytes.length === 0) {
      console.error('没有有效的字节数据')
      return ''
    }

    console.log('解析后的字节数:', bytes.length)
    console.log('前20个字节:', bytes.slice(0, 20))

    // 检查JPEG文件头
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
      console.log('检测到有效的JPEG文件头')
    } else {
      console.warn('不是标准的JPEG文件头:', bytes[0].toString(16), bytes[1].toString(16))
    }

    // 创建Blob对象
    const uint8Array = new Uint8Array(bytes)
    const blob = new Blob([uint8Array], { type: 'image/jpeg' })

    // 创建Blob URL
    const url = URL.createObjectURL(blob)

    // 记录这个URL以便后续清理
    blobUrls.value.add(url)

    console.log('生成的Blob URL:', url)

    return url
  } catch (error) {
    console.error('图片数据转换失败:', error)
    return ''
  }
}

/**
 * 清理单个Blob URL
 */
const revokeBlobUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
    blobUrls.value.delete(url)
  }
}

/**
 * 清理所有Blob URL
 */
const revokeAllBlobUrls = () => {
  blobUrls.value.forEach(url => {
    URL.revokeObjectURL(url)
  })
  blobUrls.value.clear()
}

// 选择图片
const handleImageSelect = (e) => {
  const file = e.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB')
    return
  }

  // 创建预览URL
  const preview = URL.createObjectURL(file)
  console.log('生成的预览URL:', preview) // 添加日志

  selectedImage.value = {
    file,
    preview,
    name: file.name
  }

  ElMessage.success('图片已选择，请选择识别类型')
}

// 清除选中的图片
const clearSelectedImage = () => {
  console.log('清除选中的图片:', selectedImage.value)
  // if (selectedImage.value?.preview) {
  //   // ⚠️ 注意：这里释放了预览URL，但这个消息已经在 messages 中了
  //   // 所以需要在消息中也保存一份
  //   console.log('释放预览URL:', selectedImage.value.preview)
  //   URL.revokeObjectURL(selectedImage.value.preview)
  // }
  selectedImage.value = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

// 病虫害识别
const identifyDisease = async () => {
  if (!selectedImage.value) return
  await handleImageRecognition('disease')
}

// 成熟度分析
const identifyMaturity = async () => {
  if (!selectedImage.value) return
  await handleImageRecognition('maturity')
}

// 统一的图片识别处理
const handleImageRecognition = async (type) => {
  const formData = new FormData()

  let url = ''
  let paramName = ''
  let displayType = ''

  switch (type) {
    case 'disease':
      url = '/api/AI/identify-disease'
      paramName = 'diseaseFile'
      displayType = '病虫害识别'
      break
    case 'maturity':
      url = '/api/AI/identify-maturity'
      paramName = 'maturityFile'
      displayType = '成熟度分析'
      break
  }

  formData.append(paramName, selectedImage.value.file)

  // 保存预览URL到消息，稍后不要清理这个URL
  const previewUrl = selectedImage.value.preview
  console.log('用户图片预览URL:', previewUrl) // 添加日志
  messages.value.push({
    type: 'user',
    content: `[${displayType}]`,
    imageUrl: previewUrl,  // 使用选中的图片预览URL
    // 添加一个标记，表示这是用户上传的图片
    isUserUpload: true,
    // 保存原始文件信息，便于调试
    fileName: selectedImage.value.file.name
  })

  loading.value = true

  try {
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data.code === 200) {
      const data = response.data.data

      let aiContent = data.answer || '识别完成'

      // 如果返回了 ripe_stats 数据，格式化显示
      if (type === 'maturity' && data.ripe_stats) {
        const stats = data.ripe_stats
        aiContent += `\n\n📊 详细统计：\n`
        aiContent += `总果实数量：${stats.total_fruits} 个\n`
        if (stats.maturity_distribution) {
          aiContent += `未成熟期：${stats.maturity_distribution['未成熟期（膨果期/青果期）'] || 0} 个\n`
          aiContent += `转色期：${stats.maturity_distribution['转色期（着色期）'] || 0} 个\n`
          aiContent += `成熟期：${stats.maturity_distribution['成熟期（商品采收期）'] || 0} 个\n`
        }

        // 保留小数点后两位
        const ripeRate = stats.ripe_rate ? stats.ripe_rate.toFixed(2) : '0.00'
        aiContent += `熟果率：${ripeRate}%`
      }

      // 创建AI回复消息对象
      const aiMessage = {
        type: 'ai',
        content: aiContent,
        imageError: false
      }

      // 如果有图片数据，添加到消息中
      if (data.image_data) {
        console.log('收到图片数据，长度:', data.image_data.length)
        console.log('图片数据开头:', data.image_data.substring(0, 50))

        // 保存原始十六进制数据，用于备选方案
        aiMessage.hexData = data.image_data

        // 生成图片URL
        const imageUrl = hexToImageUrl(data.image_data)
        if (imageUrl) {
          aiMessage.imageUrl = imageUrl
          console.log('图片URL已生成:', imageUrl)
        } else {
          console.error('图片URL生成失败')
          aiMessage.imageError = true
        }
      }

      messages.value.push(aiMessage)
    } else {
      ElMessage.error(response.data.msg || '识别失败')
      messages.value.push({
        type: 'ai',
        content: `❌ ${displayType}失败：${response.data.msg || '服务器错误'}`
      })
    }
  } catch (error) {
    console.error('图片识别失败：', error)
    ElMessage.error('识别请求失败，请稍后重试')
    messages.value.push({
      type: 'ai',
      content: `❌ ${displayType}失败：网络错误，请稍后重试`
    })
  } finally {
    loading.value = false
    clearSelectedImage()
  }
}

// 逐行显示AI回复
const displayAIMessageLineByLine = async (fullContent) => {
  // 按行分割文本
  const lines = fullContent.split('\n').filter(line => line.trim() !== '' || line === '\n')

  // 创建新的消息对象，包含行数组
  const newMessage = {
    type: 'ai',
    lines: lines.map(text => ({
      text,
      visible: false
    }))
  }

  messages.value.push(newMessage)

  // 逐行显示
  for (let i = 0; i < newMessage.lines.length; i++) {
    await new Promise(resolve => {
      setTimeout(() => {
        newMessage.lines[i].visible = true
        scrollToBottom() // 每显示一行就滚动到底部
        resolve()
      }, 80)
    })
  }
}

// 发送消息
const handleSendMessage = async (e) => {
  if (e) e.preventDefault()

  const content = inputContent.value.trim()
  if (!content) return

  messages.value.push({ type: 'user', content })
  inputContent.value = ''
  loading.value = true

  try {
    const response = await axios.post('/api/AI/chat', content, {
      headers: {
        'Content-Type': 'text/plain'
      }
    })

    if (response.data.code === 200) {
      if (response.data.data?.sessionId) {
        sessionId.value = response.data.data.sessionId
      }

      const reply = response.data.data?.reply || response.data.data || '抱歉，我现在无法回答这个问题。'

      // 使用逐行显示
      await displayAIMessageLineByLine(reply)
    } else {
      ElMessage.error(response.data.message || '请求失败')
      messages.value.push({
        type: 'ai',
        content: '抱歉，服务器响应异常，请稍后重试。'
      })
    }
  } catch (error) {
    console.error('AI聊天请求失败：', error)
    ElMessage.error('网络错误，请检查您的网络连接')
    messages.value.push({
      type: 'ai',
      content: '网络连接失败，请稍后重试。'
    })
  } finally {
    loading.value = false
  }
}

// 处理图像生成
const handleImageGeneration = () => {
  inputContent.value = '/image '
  const textarea = document.querySelector('.chat-input')
  if (textarea) {
    textarea.focus()
    setTimeout(() => {
      textarea.setSelectionRange(7, 7)
    }, 0)
  }
}

// 处理换行
const handleNewLine = (e) => {
  e.preventDefault()
  inputContent.value += '\n'
}

// 处理文件上传
const handleFileUpload = async (e) => {
  const files = e.target.files
  if (!files.length) return

  ElMessage.info('正在上传文件...')

  try {
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }

    const response = await axios.post('/api/AI/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data.code === 200) {
      ElMessage.success('文件上传成功')
      const fileNames = Array.from(files).map(f => f.name).join('、')
      messages.value.push({
        type: 'user',
        content: `[上传文件]：${fileNames}`
      })
    } else {
      ElMessage.error(response.data.message || '上传失败')
    }
  } catch (error) {
    console.error('文件上传失败：', error)
    ElMessage.error('文件上传失败')
  } finally {
    e.target.value = ''
  }
}

// 自动滚动到底部（当新消息到来时）
const scrollToBottom = () => {
  if (bottomAnchor.value) {
    bottomAnchor.value.scrollIntoView({ behavior: 'smooth' })
  }
}

// 监听消息变化，自动滚动到底部
watch(messages, async () => {
  await nextTick()
  scrollToBottom()
}, { deep: true })

// // 清理预览URL - 只清理选中的图片预览
// watch(selectedImage, (newVal, oldVal) => {
//   if (oldVal?.preview && oldVal.preview.startsWith('blob:')) {
//     URL.revokeObjectURL(oldVal.preview)
//   }
// })

// 组件卸载时清理所有Blob URL
onUnmounted(() => {
  revokeAllBlobUrls()
})
</script>

<style scoped>
/* 样式保持不变，和原来一样 */
.ai-chat-fullscreen {
  width: 100%;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  background: transparent;
  overflow: hidden;
  position: relative;
}

.chat-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: transparent;
  scrollbar-width: thin;
  scrollbar-color: #c0c4cc transparent;
}

.chat-content::-webkit-scrollbar {
  width: 2px;
}

.chat-content::-webkit-scrollbar-track {
  background: transparent;
}

.chat-content::-webkit-scrollbar-thumb {
  background-color: #c0c4cc;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.chat-content::-webkit-scrollbar-thumb:hover {
  background-color: #909399;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  max-width: 75%;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  background-color: #7bbfd8;
  color: white;
  border-bottom-right-radius: 6px;
}

.ai-message .message-bubble {
  background-color: white;
  color: #303133;
  border: 1px solid #e4e7ed;
  border-bottom-left-radius: 6px;
}

.ai-line {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.ai-line.line-visible {
  opacity: 1;
  transform: translateY(0);
}

.ai-image-container {
  margin-top: 12px;
  max-width: 100%;
}

.ai-image-preview {
  max-width: 300px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #e4e7ed;
  transition: transform 0.2s;
}

.ai-image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.ai-image-preview:hover {
  transform: scale(1.02);
}

.image-error-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #f56c6c;
}

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
  background-color: #75d9b9;
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

.chat-input-wrapper {
  padding: 14px 10px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
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
}

.function-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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
  transition: all 0.2s;
}

.function-btn:hover {
  background-color: #f5f5f5;
}

.image-preview {
  margin-bottom: 8px;
  max-width: 200px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #e4e7ed;
  transition: transform 0.2s;
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.image-preview:hover {
  transform: scale(1.02);
}

.image-options {
  display: flex;
  gap: 8px;
  margin-left: 4px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: background 0.2s;
}

.option-btn:hover {
  background-color: #f5f5f5;
}

.option-btn.cancel:hover {
  background-color: #fef0f0;
}

.selected-image-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin: 4px 0;
}

.selected-image-preview img {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
}

.selected-image-preview .file-name {
  font-size: 13px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.input-with-send {
  position: relative;
  width: 100%;
}

.chat-input {
  border: none;
  outline: none;
  resize: none;
  font-size: 15px;
  line-height: 1.5;
  min-height: 40px;
  max-height: 120px;
  overflow-y: auto;
  background: transparent;
  padding-right: 60px;
  width: 100%;
  box-sizing: border-box;
}

.chat-input:disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.chat-input::placeholder {
  color: #999;
}

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
  transition: all 0.2s;
}

.send-btn-inner:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
}

.send-btn-inner:not(:disabled):hover {
  background-color: #66b1ff;
  transform: scale(1.05);
}

:deep(.el-dialog__body) {
  padding: 20px;
  text-align: center;
}

:deep(.el-dialog__body img) {
  max-width: 100%;
  max-height: 70vh;
}

@media (max-width: 768px) {
  .chat-content {
    padding: 16px;
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

  .image-options {
    flex-wrap: wrap;
  }

  .option-btn span {
    display: none;
  }

  .ai-image-preview {
    max-width: 250px;
  }
}
</style>