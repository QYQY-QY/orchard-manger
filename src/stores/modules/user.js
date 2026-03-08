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
            user_pic: 'https://picsum.photos/40/40',
            username: '',
            // 后端返回的新字段
            isAdmin: undefined,
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

        // 设置Token（如果后端返回token，保留此方法）
        const setToken = (newToken) => {
            token.value = newToken
        }

        // 设置用户信息（合并新旧数据 + 类型转换）
        const setUser = (newUser) => {
            // 类型转换：后端返回的数字字段可能是字符串，转成Number
            const formatUser = {
                ...newUser,
                isAdmin: newUser.isAdmin !== undefined ? Number(newUser.isAdmin) : undefined,
                sex: newUser.sex !== undefined ? Number(newUser.sex) : 0,
                status: newUser.status !== undefined ? Number(newUser.status) : 0,
                id: newUser.id !== undefined ? Number(newUser.id) : 0,
                orchardId: newUser.orchardId !== undefined ? Number(newUser.orchardId) : 0,
                createUser: newUser.createUser !== undefined ? Number(newUser.createUser) : 0,
                updateUser: newUser.updateUser !== undefined ? Number(newUser.updateUser) : 0,
            }

            user.value = {
                ...user.value,
                ...formatUser,
                // 兼容原有字段
                nickname: formatUser.username || formatUser.name || user.value.nickname,
                user_pic: formatUser.headImg || user.value.user_pic
            }
        }

        // 清空用户信息（退出登录用）
        const clearUser = () => {
            token.value = ''
            user.value = {
                nickname: '管理员',
                user_pic: 'https://picsum.photos/40/40',
                username: '',
                isAdmin: undefined,
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