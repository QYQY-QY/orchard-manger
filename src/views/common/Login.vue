<template>
  <div class="login-container">
    <div class="login-box">
      <h2>果园管理系统</h2>

      <!-- 账号输入框 + 自动消失的错误提示 -->
      <div class="form-item">
        <label>账号</label>
        <input
          v-model="form.username"
          type="text"
          placeholder="请输入账号"
          :class="{ 'input-error': !!error.username }"
        />
        <!-- 错误提示：2秒后自动消失 -->
        <div v-if="error.username" class="error-tip" :class="{ 'fade-out': isUsernameTipFade }">{{ error.username }}</div>
      </div>

      <!-- 密码输入框 + 自动消失的错误提示 -->
      <div class="form-item">
        <div class="pwd-label-wrap">
          <label>密码</label>
          <a href="javascript:;" class="forget-pwd">忘记密码？</a>
        </div>
        <input
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
          :class="{ 'input-error': !!error.password }"
        />
        <!-- 错误提示：2秒后自动消失 -->
        <div v-if="error.password" class="error-tip" :class="{ 'fade-out': isPasswordTipFade }">{{ error.password }}</div>
      </div>

      <button class="login-btn" @click="login" :disabled="loading">
        <span v-if="loading">登录中...</span>
        <span v-else>登录</span>
      </button>
    </div>
  </div>
</template>

<script setup>
// 1. 导入依赖（去重 + 补全）
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '@/stores/modules/user'
import { ElMessage } from 'element-plus'

// 2. 初始化仓库和路由
const userStore = useUserStore()
const router = useRouter()

// 3. 登录表单数据
const form = reactive({
  username: "",
  password: ""
})

// 4. 错误提示（用户名/密码）
const error = reactive({
  username: "",
  password: ""
})

// 5. 提示消失的动画状态
const isUsernameTipFade = ref(false)
const isPasswordTipFade = ref(false)

// 6. 登录加载状态
const loading = ref(false)

// 7. 重置错误提示
const resetError = () => {
  error.username = ""
  error.password = ""
  isUsernameTipFade.value = false
  isPasswordTipFade.value = false
}

// 8. 提示自动消失方法
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

// 9. 核心登录逻辑（完整适配后端所有字段）
const login = async () => {
  resetError()

  // 第一步：空值校验
  if (!form.username) {
    error.username = "账号不能为空"
    autoHideTip('username')
    return
  }
  if (!form.password) {
    error.password = "密码不能为空"
    autoHideTip('password')
    return
  }

  loading.value = true

  try {
    // 第二步：调用登录接口
    const res = await axios.post('/api/employee/login', form)
    const resData = res.data
    
    // 调试：打印后端返回的所有数据（方便你核对字段）
    console.log('✅ 后端返回完整数据：', JSON.stringify(resData, null, 2))

    // 第三步：判断接口返回是否成功
    if (resData.code === 200) {
      // 1. 提取后端返回的核心数据（全覆盖你提到的字段）
      const userInfo = resData.data || {}
      const token = resData.token || ''

      // 2. 存储 Token 到 Pinia（供后续接口请求使用）
      if (token) {
        userStore.setToken(token)
        // 可选：把token存入localStorage（双重保障）
        localStorage.setItem('token', token)
      }

      // 3. 存储所有用户信息到 Pinia（后端返回的字段全存，后续想用就用）
      userStore.setUser({
        // 核心身份字段
        username: userInfo.username || '',    // 用户名（如zzc）
        isAdmin: userInfo.isAdmin || 0,       // 角色：0=普通管理员，1=超级管理员
        id: userInfo.id || 0,                 // 用户ID
        status: userInfo.status || 0,         // 账号状态
        
        // 个人信息字段
        name: userInfo.name || '',            // 真实姓名
        phone: userInfo.phone || '',          // 手机号
        sex: userInfo.sex || 0,               // 性别：0/1
        id_card: userInfo.id_card || '',      // 身份证号
        headImg: userInfo.headImg || '',      // 头像地址
        openId: userInfo.openId || '',        // 第三方ID
        
        // 业务相关字段
        orchardId: userInfo.orchardId || 0,   // 果园ID
        createTime: userInfo.createTime || '',// 创建时间
        updateTime: userInfo.updateTime || '',// 更新时间
        createUser: userInfo.createUser || 0, // 创建人
        updateUser: userInfo.updateUser || 0  // 更新人
      })

      // 4. 提示登录成功
      ElMessage.success('登录成功！欢迎回来，' + (userInfo.username || '管理员'))

      // 5. 根据角色跳转（优先用后端的isAdmin，兜底用1）
      const isAdmin = userInfo.isAdmin ?? 1
      // 先跳转到布局页面（让布局页读取Pinia数据），而非直接跳功能页
      router.push('/superindex').catch(err => {
        ElMessage.error('页面跳转失败：' + err.message)
        console.error('跳转错误：', err)
        // 兜底跳转：如果布局页跳失败，直接跳功能页
        router.push(isAdmin === 1 ? '/superadminindex' : '/adminindex')
      })

    } else {
      // 后端返回失败（如账号密码错误）
      ElMessage.error(resData.msg || '登录失败，请检查账号密码')
    }

  } catch (err) {
    // 网络错误/接口报错处理
    console.error('❌ 登录请求失败：', err)
    // 分场景提示错误
    if (err.response) {
      // 后端返回错误（如401/500）
      ElMessage.error('登录失败：' + (err.response.data?.msg || '账号或密码错误'))
    } else if (err.request) {
      // 网络错误（没连到后端）
      ElMessage.error('网络错误，请检查服务器连接')
    } else {
      // 其他错误
      ElMessage.error('登录失败：' + err.message)
    }
  } finally {
    // 无论成功失败，都停止加载
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
  color: #42b983; /* 和登录按钮同色系 */
  text-decoration: none;
  cursor: pointer;
}
.forget-pwd:hover {
  color: #359469; /* hover加深颜色 */
  text-decoration: underline; /* 下划线提示可点击 */
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
  /* 红边框保留，不消失 */
  transition: border-color 0.2s;
}

/* 错误边框（保留，不消失） */
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
  /* 消失动画过渡 */
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
  background: #a0d9b8;
  cursor: not-allowed;
}

.login-btn:hover:not(:disabled) {
  background: #359469;
}
</style>