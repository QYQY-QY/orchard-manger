import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  //routes里面写path和component的结构即可，
  routes: [
    //默认进入登录页
    { path: '/', redirect: '/login' },
    //登录页
    { path: '/login', name: 'Login', component: () => import('../views/common/Login.vue') },

    //试用的可复用页面
    { path: '/commonlayout', name: 'CommonLayout', component: () => import('../views/common/CommonLayout.vue') },

    //管理员
    //数据可视化页面
    { path: '/adminindex', name: 'Index', component: () => import('../views/admin/Index.vue') },
    //果园管理
    // { path: '', name: '', component: '' },
    //果树管理
    //任务管理
    //账号管理
    //个人中心

    //超级管理员
    //超级管理员数据可视化页面
    { path: '/superadminindex', name: 'SperIndex', component: () => import('../views/super-admin/Index.vue') },
    //超级管理员果园管理页面
    { path: '/superadmin-orchardmanage', name: 'SuperAdmin-O', component: () => import('../views/super-admin/Index.vue') }
    //
  ],
})

export default router
