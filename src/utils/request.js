import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/modules/user' // 保留引入（若后续无其他用途可删，不影响当前逻辑）
import router from '@/router'

// 创建axios实例（统一配置基础路径、超时等）
const service = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '', // 可选：通过.env文件配置接口前缀
    timeout: 30000, // 超时时间：10秒
    headers: {
        'Content-Type': 'application/json;charset=utf-8' // 统一请求头
    }
})

// 1. 请求拦截器：仅删除token相关，其他逻辑保留
service.interceptors.request.use(
    (config) => {
        // 【已删除】token相关逻辑：获取token、加请求头
        // 打印请求信息（开发环境调试用）—— 保留
        console.log(`📤 请求：${config.method.toUpperCase()} ${config.url}`, config.data || config.params)
        return config
    },
    (error) => {
        // 请求发送失败（比如网络问题）—— 保留
        console.error('📤 请求发送失败：', error)
        ElMessage.error('请求发送失败，请检查网络')
        return Promise.reject(error)
    }
)

// 2. 响应拦截器：仅删除401 token过期相关，其他逻辑保留
service.interceptors.response.use(
    (response) => {
        const res = response.data
        const requestUrl = response.config.url


        // 打印响应信息（开发环境调试用）—— 保留
        console.log(`📥 响应：${requestUrl}`, res)

        // 核心：统一处理后端的R格式返回 —— 保留
        // 情况1：返回空数据
        if (!res) {
            ElMessage.error(`接口返回空数据 → ${requestUrl}`)
            return Promise.reject(new Error('接口返回空数据'))
        }

        // 情况2：后端返回R格式，但code不是200（业务失败）
        if (res.code !== 200) {
            // 【已删除】401 token过期相关逻辑
            // 普通业务错误：显示后端返回的msg —— 保留
            ElMessage.error(res.msg || '接口请求失败')
            return Promise.reject(new Error(res.msg || '接口请求失败'))
        }

        // 情况3：成功（code=200），返回真正的data数据 —— 保留
        return res.data
    },
    (error) => {
        // HTTP状态码错误（404/500/302等）—— 保留
        console.error(`📥 响应错误：${error.message}`, error)
        const errMsg = error.message || '接口响应失败'
        // 区分不同错误类型 —— 保留
        if (errMsg.includes('timeout')) {
            ElMessage.error('接口请求超时，请稍后重试')
        } else if (errMsg.includes('404')) {
            ElMessage.error('接口地址不存在 → ' + error.config.url)
        } else if (errMsg.includes('500')) {
            ElMessage.error('服务器内部错误，请联系后端排查')
        } else {
            ElMessage.error(`接口响应失败：${errMsg}`)
        }
        return Promise.reject(error)
    }
)

// 导出封装后的axios实例 —— 保留
export default service