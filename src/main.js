// 引入创建应用的方法，不再是new Vue()
import { createApp } from 'vue'
import { createPinia } from 'pinia'
// 引入 Pinia 持久化插件（可选，刷新用户信息不丢失）
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 引入根组件
import App from './App.vue'
// 引入路由
import router from './router'

// 1. 引入 Element Plus 核心
import ElementPlus from 'element-plus'
// 2. 引入 Element Plus 样式
import 'element-plus/dist/index.css'

//导入布局组件
import CommonLayout from '@/views/common/CommonLayout.vue'

// 创建 Pinia 实例并配置插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate) // 注册持久化插件

const app = createApp(App)

//全局注册布局组件
app.component('CommonLayout', CommonLayout)

// 注册插件（顺序不影响，保持清晰即可）
app.use(pinia) // 注册 Pinia（带持久化）
app.use(router) // 注册路由
app.use(ElementPlus) // 注册 Element Plus

// 挂载应用
app.mount('#app')