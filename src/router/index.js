import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'Login', component: () => import('../views/common/Login.vue') },

    // 普通管理员路由
    {
      path: '/Adminindex',
      name: 'AdminIndex',
      component: () => import('../views/admin/Index.vue')
    },
    {
      path: '/adminMission',
      name: 'AdminMission',
      component: () => import('../views/admin/Mission.vue')
    },
    {
      path: '/adminReport',
      name: 'AdminReport',
      component: () => import('../views/admin/Report.vue')
    },
    {
      path: '/adminarea',
      name: 'AdminArea',
      component: () => import('../views/admin/Area.vue')
    },
    {
      path: '/adminaccount',
      name: 'AdminAccount',
      component: () => import('../views/admin/Account.vue')
    },
    {
      path: '/adminrecruitment',
      name: 'AdminRecruitment',
      component: () => import('../views/admin/Recruitment.vue')
    },
    {
      path: '/adminreview',
      name: 'AdminReview',
      component: () => import('../views/admin/RecritReview.vue')
    },
    {
      path: '/AiChat',
      name: 'Aichat',
      component: () => import('../views/admin/AI.vue')
    },
    {
      path: '/weather-alert',
      name: 'WeatherAlert',
      component: () => import('../views/admin/WeatherAlert.vue')
    },

    // 超级管理员路由
    {
      path: '/superadminindex',
      name: 'SuperAdminIndex',
      component: () => import('../views/super-admin/Index.vue')
    },
    {
      path: '/superOrchard',
      name: 'SuperOrchard',
      component: () => import('@/views/super-admin/Orchard.vue')
    },
    {
      path: '/SuperAccount',
      name: 'SuperAccount',
      component: () => import('@/views/super-admin/SuperAccount.vue')
    },
    {
      path: '/SuperNotice',
      name: 'SuperNotice',
      component: () => import('@/views/super-admin/notice.vue')
    },
    {
      path: '/SuperAi',
      name: 'SuperAi',
      component: () => import('@/views/super-admin/AI.vue')
    },
    {
      path: '/sys',
      name: 'sys',
      component: () => import('../views/super-admin/sys.vue')
    },

    // ========== 大屏跳转页面路由（修正后的路径） ==========
    // 注意：所有大屏组件都在 src/views/screen/pages/ 目录下

    // 果园数据大屏
    {
      path: '/OrchardScene',
      name: 'OrchardScene',
      // 修正：使用 @/views 而不是 @views
      component: () => import('@/views/admin/screen/OrchardScene.vue')
    },

    // 总体数据大屏
    {
      path: '/TotalScreen',
      name: 'TotalScreen',
      // 修正：使用 @/views 而不是 @views
      component: () => import('@/views/admin/screen/pages/TotalScreen.vue')
    },

    // 病虫害专项防控监测大屏
    {
      path: '/PestControl',
      name: 'PestControl',
      // 修正：使用 @/views 而不是 @views
      component: () => import('@/views/admin/screen/pages/PestControl.vue')
    },

    // 多端协同与溯源管理大屏
    {
      path: '/MultiCooperation',
      name: 'MultiCooperation',
      component: () => import('@/views/admin/screen/pages/MultiCooperation.vue')
    },

    // 历史数据趋势分析大屏
    {
      path: '/HistoricalTrend',
      name: 'HistoricalTrend',
      component: () => import('@/views/admin/screen/pages/HistoricalTrend.vue')
    },

    // 农事任务调度管理大屏
    {
      path: '/TaskDispatch',
      name: 'TaskDispatch',
      component: () => import('@/views/admin/screen/pages/TaskDispatch.vue')
    },

    // 水肥精准管控决策大屏
    {
      path: '/WaterFertilizer',
      name: 'WaterFertilizer',
      component: () => import('@/views/admin/screen/pages/WaterFertilizer.vue')
    },

    // 宏观总览大屏
    {
      path: '/Overview',
      name: 'Overview',
      component: () => import('@/views/admin/screen/pages/Overview.vue')
    },

    // 404 重定向到登录页
    { path: '/:pathMatch(.*)*', redirect: '/login' }
  ],
})

// 路由守卫：登录校验 + 角色跳转
router.beforeEach((to, from) => {
  console.log('========== 路由守卫 ==========');
  console.log('目标路径 to.path:', to.path);
  console.log('来源路径 from.path:', from.path);


  const token = localStorage.getItem('token')
  const userStore = useUserStore()

  // 定义不需要登录验证的页面路径
  const screenPages = [
    // '/login',
    '/OrchardScene',
    '/TotalScreen',
    '/PestControl',
    '/MultiCooperation',
    '/HistoricalTrend',
    '/TaskDispatch',
    '/WaterFertilizer',
    '/Overview'
  ]

  // 如果是大屏页面，直接放行
  if (screenPages.includes(to.path)) {
    return true
  }

  // 放行所有以 /screen 开头的路径（大屏相关页面）
  if (to.path.startsWith('/screen')) {
    console.log('大屏页面，直接放行')
    return true
  }

  // 登录页直接放行
  if (to.path === '/login') {
    return true
  }

  // 无用户信息跳登录
  if (!userStore.user.id) {
    ElMessage.error('请先登录')
    return '/login'
  }

  // 根路径根据角色跳转
  if (to.path === '/') {
    const isAdmin = userStore.user.isAdmin
    if (isAdmin === undefined) {
      ElMessage.error('用户角色异常，请重新登录')
      return '/login'
    }
    const targetPath = isAdmin === 1 ? '/superadminindex' : '/adminindex'
    return targetPath
  }

  return true
})

export default router