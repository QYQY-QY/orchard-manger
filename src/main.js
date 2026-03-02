import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
// 全局注册布局组件
import CommonLayout from '@/views/common/CommonLayout.vue'

// 创建Pinia
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

// 全局注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// 全局注册布局组件
app.component('CommonLayout', CommonLayout)

// 注册插件
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 挂载
app.mount('#app')