<template>
  <div class="login-container">
    <div class="login-box">
      <h2>果树单株精准管理平台</h2>

      <!-- 账号输入框 + 自动消失的错误提示 -->
      <div class="form-item">
        <label>账号</label>
        <input v-model="form.username" link placeholder="请输入账号" :class="{ 'input-error': !!error.username }" />
        <!-- 错误提示：2秒后自动消失 -->
        <div v-if="error.username" class="error-tip" :class="{ 'fade-out': isUsernameTipFade }">{{ error.username }}
        </div>
      </div>

      <!-- 密码输入框 + 自动消失的错误提示 -->
      <div class="form-item">
        <div class="pwd-label-wrap">
          <label>密码</label>
          <a href="javascript:;" class="forget-pwd">忘记密码？</a>
        </div>
        <input v-model="form.password" type="password" placeholder="请输入密码"
          :class="{ 'input-error': !!error.password }" />
        <!-- 错误提示：2秒后自动消失 -->
        <div v-if="error.password" class="error-tip" :class="{ 'fade-out': isPasswordTipFade }">{{ error.password }}
        </div>
      </div>

      <button class="login-btn" @click="login" :disabled="loading">
        <span v-if="loading">登录中...</span>
        <span v-else>登录</span>
      </button>
    </div>
  </div>
</template>

<script setup>
// 1. 导入所有必需依赖
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import service from '@/utils/request'
import { useUserStore } from '@/stores/modules/user'
import { ElMessage } from 'element-plus'

// 2. 初始化路由和Pinia用户仓库
const router = useRouter()
const userStore = useUserStore()

// 3. 登录表单数据（账号/密码）
const form = reactive({
  // code: null,
  username: "",
  password: ""
})

// 4. 表单错误提示（账号/密码为空）
const error = reactive({
  username: "",
  password: ""
})

// 5. 错误提示消失的动画状态
const isUsernameTipFade = ref(false)
const isPasswordTipFade = ref(false)

// 6. 登录按钮加载状态
const loading = ref(false)

// 7. 重置错误提示
const resetError = () => {
  error.username = ""
  error.password = ""
  isUsernameTipFade.value = false
  isPasswordTipFade.value = false
}

// 8. 错误提示自动消失（2秒后渐隐）
const autoHideTip = (type) => {
  setTimeout(() => {
    if (type === 'username') {
      isUsernameTipFade.value = true
      setTimeout(() => { error.username = "" }, 500)
    } else {
      isPasswordTipFade.value = true
      setTimeout(() => { error.password = "" }, 500)
    }
  }, 2000)
}

// 9. 核心登录逻辑：登录后跳对应角色首页
// 9. 核心登录逻辑：改用拦截器封装的service
const login = async () => {
  resetError()
  if (!form.username) {
    error.username = "请输入账号"
    autoHideTip('username')
    return
  }
  if (!form.password) {
    error.password = "请输入密码"
    autoHideTip('password')
    return
  }

  loading.value = true

  try {
    // 核心修改：用service.post替代axios.post
    // 拦截器会自动处理空数据、code≠200的情况，这里直接拿到resData=data
    const userInfo = await service.post('/api/employee/login', form)

    // 能走到这里，说明：
    // 1. 后端返回了 {code:200, data: Employee对象}
    // 2. 拦截器已经过滤了空数据、业务错误
    //数据jsoN
    console.log('✅ 登录成功，用户信息：', userInfo)

    // 存储用户信息到Pinia
    const userStore = useUserStore()
    userStore.setUser(userInfo)

    // 提示+跳转
    ElMessage.success(`登录成功！欢迎回来，${userInfo.name || userInfo.username}`)
    const targetPath = userInfo.isAdmin === 1
      ? '/superadminindex'
      : '/adminindex'
    await router.push(targetPath)

  } catch (err) {
    // 所有错误（空数据、code≠200、网络错误）都会走到这里
    console.error('❌ 登录失败：', err)
    // 拦截器已经自动弹了错误提示，这里无需重复弹
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 整体布局 */
.login-container {
  width: 100vw;
  height: 100vh;
  background: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "Microsoft YaHei", sans-serif;
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 8px;
  width: 360px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.login-box h2 {
  text-align: center;
  margin: 0 0 30px 0;
  color: #333;
}

.form-item {
  margin-bottom: 20px;
  position: relative;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
}

/* 密码标签+忘记密码链接的容器 */
.pwd-label-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

/* 忘记密码链接样式 */
.forget-pwd {
  font-size: 12px;
  color: #164831;
  text-decoration: none;
  cursor: pointer;
}

.forget-pwd:hover {
  color: #205b40;
  text-decoration: underline;
}

.form-item input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

/* 错误边框 */
.input-error {
  border-color: #f56c6c !important;
}

/* 错误提示基础样式 */
.error-tip {
  margin-top: 6px;
  color: #f56c6c;
  background: #fef0f0;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 2px;
  border-left: 2px solid #f56c6c;
  transition: opacity 0.5s ease, height 0.5s ease, margin 0.5s ease;
  opacity: 1;
  height: auto;
  margin-top: 6px;
}

/* 消失动画：渐隐 + 收缩 */
.fade-out {
  opacity: 0;
  height: 0;
  margin-top: 0;
  padding: 0 8px;
  overflow: hidden;
}

.login-btn {
  width: 100%;
  height: 44px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.login-btn:disabled {
  background: #66bca1;
  cursor: not-allowed;
}

.login-btn:hover:not(:disabled) {
  background: #2c7b5d;
}
</style>