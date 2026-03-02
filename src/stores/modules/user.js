import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore(
    'user',
    () => {
        // 定义所有用户字段（覆盖后端返回的全部字段）
        const token = ref('')
        const user = ref({
            // 原有字段（兼容）
            nickname: '管理员',
            user_pic: 'https://via.placeholder.com/40x40?text=头像',
            username: '',
            // 后端返回的新字段
            isAdmin: 0,
            headImg: '',
            name: '',
            phone: '',
            id_card: '',
            orchardId: 0,
            sex: 0,
            status: 0,
            id: 0,
            openId: '',
            createTime: '',
            updateTime: '',
            createUser: 0,
            updateUser: 0
        })

        // 设置Token
        const setToken = (newToken) => {
            token.value = newToken
        }

        // 设置用户信息（合并新旧数据）
        const setUser = (newUser) => {
            user.value = {
                ...user.value,
                ...newUser,
                // 兼容原有字段
                nickname: newUser.username || newUser.name || user.value.nickname,
                user_pic: newUser.headImg || user.value.user_pic
            }
        }

        // 清空用户信息（退出登录用）
        const clearUser = () => {
            token.value = ''
            user.value = {
                nickname: '管理员',
                user_pic: 'https://via.placeholder.com/40x40?text=头像',
                username: '',
                isAdmin: 0,
                headImg: '',
                name: '',
                phone: '',
                id_card: '',
                orchardId: 0,
                sex: 0,
                status: 0,
                id: 0,
                openId: '',
                createTime: '',
                updateTime: '',
                createUser: 0,
                updateUser: 0
            }
        }

        return { token, user, setToken, setUser, clearUser }
    },
    {
        persist: true // 持久化存储
    }
)