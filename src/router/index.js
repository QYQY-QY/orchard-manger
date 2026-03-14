import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'Login', component: () => import('../views/common/Login.vue') },
    // 普通管理员路由
    //数据可视化
    {
      path: '/adminindex',
      name: 'AdminIndex',
      component: () => import('../views/admin/Index.vue')
    },
    //任务管理Mission
    {
      path: '/adminMission',
      name: 'AdminMission',
      component: () => import('../views/admin/Mission.vue')
    },
    //地区划分Area
    {
      path: '/adminarea',
      name: 'AdminArea',
      component: () => import('../views/admin/Area.vue')
    },
    // //果树详情Tree
    // {
    //   path: '/admintree',
    //   name: 'AdminTree',
    //   component: () => import('../views/admin/Tree.vue')
    // },
    //账号管理
    {
      path: '/adminaccount',
      name: 'AdminAccount',
      component: () => import('../views/admin/Account.vue')
    },
    //人员招聘
    {
      path: '/adminrecruitment',
      name: 'AdminRecruitment',
      component: () => import('../views/admin/Recruitment.vue')
    },
    //人员招聘审核
    {
      path: '/adminreview',
      name: 'AdminReview',
      component: () => import('../views/admin/RecritReview.vue')
    },
    //ai聊天
    {
      path: '/AiChat',
      name: 'Aichat',
      component: () => import('../views/admin/AI.vue')
    },


    // 超级管理员路由
    {
      path: '/superadminindex',
      name: 'SuperAdminIndex',
      component: () => import('../views/super-admin/Index.vue')
    },

    //果园数据（果园/区域/果树）
    {
      path: '/superOrchard',
      name: 'SuperOrchard',
      component: () => import('@/views/super-admin/Orchard.vue')
    },
    //账号管理
    {
      path: '/SuperAccount',
      name: 'SuperAccount',
      component: () => import('@/views/super-admin/SuperAccount.vue')
    },
    //账号管理
    {
      path: '/SuperNotice',
      name: 'SuperNotice',
      component: () => import('@/views/super-admin/notice.vue')
    },
    //超管ai
    {
      path: '/SuperAi',
      name: 'SuperAi',
      component: () => import('@/views/super-admin/AI.vue')
    },
    //其他
    {
      path: '/sys',
      name: 'sys',
      component: () => import('../views/super-admin/sys.vue')
    },

    // ========== 新增：大屏跳转页面路由 ==========
    // 果园数据大屏（图2）- 如果还没有
    {
      path: '/orchard-scene',
      name: 'OrchardScene',
      component: () => import('@/views/screen/OrchardScene.vue')
    },
    // 病虫害专项防控监测大屏（图3）
    {
      path: '/pest-control',
      name: 'PestControl',
      component: () => import('@/views/screen/pages/PestControl.vue')
    },
    // 多端协同与溯源管理大屏
    {
      path: '/multi-cooperation',
      name: 'MultiCooperation',
      component: () => import('@/views/screen/pages/MultiCooperation.vue')
    },
    // 历史数据趋势分析大屏
    {
      path: '/historical-trend',
      name: 'HistoricalTrend',
      component: () => import('@/views/screen/pages/HistoricalTrend.vue')
    },
    // 农事任务调度管理大屏
    {
      path: '/task-dispatch',
      name: 'TaskDispatch',
      component: () => import('@/views/screen/pages/TaskDispatch.vue')
    },
    // 水肥精准管控决策大屏
    {
      path: '/water-fertilizer',
      name: 'WaterFertilizer',
      component: () => import('@/views/screen/pages/WaterFertilizer.vue')
    },
    // 总览图（如果需要）
    {
      path: '/overview',
      name: 'Overview',
      component: () => import('@/views/screen/pages/Overview.vue')
    },

    // 404 重定向到登录页
    { path: '/:pathMatch(.*)*', redirect: '/login' }
  ],
})

// 路由守卫：登录校验 + 角色跳转（适配新版 Vue Router）
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  const userStore = useUserStore()

  // 登录页直接放行
  if (to.path === '/login') {
    return true // 替代原来的 next()
  }

  // 无用户信息跳登录
  if (!userStore.user.id) {
    ElMessage.error('请先登录')
    return '/login' // 替代原来的 next('/login')
  }

  // 根路径根据角色跳转
  if (to.path === '/') {
    const isAdmin = userStore.user.isAdmin
    if (isAdmin === undefined) {
      ElMessage.error('用户角色异常，请重新登录')
      return '/login' // 替代原来的 next('/login')
    }
    const targetPath = isAdmin === 1 ? '/superadminindex' : '/adminindex'
    return targetPath // 替代原来的 next(targetPath)
  }

  // 其他情况正常放行
  return true
})

export default router