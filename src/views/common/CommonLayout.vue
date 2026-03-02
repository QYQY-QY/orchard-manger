<template>
  <!-- 外层布局容器 -->
  <el-container class="layout-container">
    <!-- 左侧侧边栏 -->
    <el-aside width="200px">
      <div class="el-aside__logo"></div>
      <!-- 核心修改：default-active 绑定 activeMenuPath -->
      <el-menu
        active-text-color="#ffd04b"
        background-color="#232323"
        :default-active="activeMenuPath"
        text-color="#fff"
        router
      >
        <!-- 🌟 根据真实角色显示不同菜单（改用realRole） -->
        <!-- 普通管理员 (admin) 菜单 -->
        <template v-if="realRole === 'admin'">
          <el-menu-item index="/adminindex">
            <el-icon><Promotion /></el-icon>
            <span>果园数据可视化</span>
          </el-menu-item>

          <!-- 果园管理（普通管理员版） -->
          <el-sub-menu index="/orchard">
            <template #title>
              <el-icon><Management /></el-icon>
              <span>果园管理</span>
            </template>
            <el-menu-item index="/orchard/detail">
              <el-icon><User /></el-icon>
              <span>果园详情</span>
            </el-menu-item>
            <el-menu-item index="/orchard/tree">
              <el-icon><Crop /></el-icon>
              <span>果树详情</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item index="/task">
            <el-icon><Promotion /></el-icon>
            <span>任务管理</span>
          </el-menu-item>

          <el-menu-item index="/account">
            <el-icon><Promotion /></el-icon>
            <span>账号管理</span>
          </el-menu-item>

          <el-menu-item index="/recruitment">
            <el-icon><Promotion /></el-icon>
            <span>人员招聘</span>
          </el-menu-item>
        </template>

        <!-- 超级管理员 (superAdmin) 菜单 -->
        <template v-else-if="realRole === 'superAdmin'">
          <el-menu-item index="/superadminindex">
            <el-icon><Promotion /></el-icon>
            <span>果园数据可视化（超级管理员）</span>
          </el-menu-item>

          <!-- 果园管理（超级管理员版，新增专属子菜单） -->
          <el-sub-menu index="/superadmin-orchardmanage">
            <template #title>
              <el-icon><Management /></el-icon>
              <span>果园管理（超级管理员）</span>
            </template>
            <el-menu-item index="/superadmin-orchardmanage/detail">
              <el-icon><User /></el-icon>
              <span>果园详情</span>
            </el-menu-item>
            <el-menu-item index="/superadmin-orchardmanage/tree">
              <el-icon><Crop /></el-icon>
              <span>果树详情</span>
            </el-menu-item>
            <el-menu-item index="/superadmin-orchardmanage/config">
              <el-icon><Setting /></el-icon>
              <span>果园配置（专属）</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item index="/superadmin-task">
            <el-icon><Promotion /></el-icon>
            <span>任务管理（超级管理员）</span>
          </el-menu-item>

          <el-menu-item index="/superadmin-account">
            <el-icon><Promotion /></el-icon>
            <span>账号管理（超级管理员）</span>
          </el-menu-item>

          <el-menu-item index="/superadmin-recruitment">
            <el-icon><Promotion /></el-icon>
            <span>人员招聘（超级管理员）</span>
          </el-menu-item>

          <!-- 超级管理员专属菜单 -->
          <el-menu-item index="/superadmin-system">
            <el-icon><Setting /></el-icon>
            <span>系统设置（专属）</span>
          </el-menu-item>
        </template>

        <!-- 👇 个人中心（所有角色都显示，保留原有） -->
        <el-sub-menu index="/user">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>个人中心</span>
          </template>
          <el-menu-item index="/user/profile">
            <el-icon><User /></el-icon>
            <span>基本资料</span>
          </el-menu-item>
          <el-menu-item index="/user/avatar">
            <el-icon><Crop /></el-icon>
            <span>更换头像</span>
          </el-menu-item>
          <el-menu-item index="/user/password">
            <el-icon><EditPen /></el-icon>
            <span>重置密码</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 右侧内容区域 -->
    <el-container>
      <!-- 顶部栏：显示真实用户名 + 角色 -->
      <el-header>
        <div>你好！{{ realRoleName }}:{{ realUserName }}</div>
        <el-dropdown placement="bottom-end" @command="handleCommand">
          <span class="el-dropdown__box">
            <el-avatar :src="realUserAvatar">
              <!-- 头像加载失败时，显示用户名的第一个字（比如zzc显示“z”） -->
              {{ realUserName.substring(0, 1) }}
            </el-avatar>
            <el-icon><CaretBottom /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile" :icon="User">基本资料</el-dropdown-item>
              <el-dropdown-item command="avatar" :icon="Crop">更换头像</el-dropdown-item>
              <el-dropdown-item command="password" :icon="EditPen">重置密码</el-dropdown-item>
              <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <!-- 主体内容区域（slot预留占位，保留原有） -->
      <el-main>
        <div class="main-placeholder">
          <slot />
        </div>
      </el-main>

      <!-- 底部栏 -->
      <el-footer>果园管理系统 ©2026 Created by 大数据工作室</el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
// 1. 导入Pinia用户仓库（核心：对接后端返回的用户信息）
import { useUserStore } from '@/stores/modules/user'
import { computed } from 'vue'
const userStore = useUserStore()

// 2. 定义 props：role（保留，兼容手动传参）
const props = defineProps({
  role: {
    type: String,
    default: 'admin',
    validator: (value) => {
      return ['admin', 'superAdmin'].includes(value)
    }
  }
})

// 3. 核心：从Pinia解析真实角色（对接后端isAdmin字段：0=管理员，1=超级管理员）
const realRole = computed(() => {
  // 优先用Pinia里的isAdmin，没有则用props
  if (userStore.user?.isAdmin !== undefined) {
    return userStore.user.isAdmin === 1 ? 'superAdmin' : 'admin'
  }
  return props.role
})

// 4. 角色名称（显示用：管理员/超级管理员）
const realRoleName = computed(() => {
  return realRole.value === 'superAdmin' ? '超级管理员' : '管理员'
})

// 5. 真实用户名（对接后端返回的username，比如"zzc"）
const realUserName = computed(() => {
  return userStore.user?.name || (realRole.value === 'superAdmin' ? '超级管理员' : '管理员')
})

// 6. 真实用户头像（兼容后端headImg + Pinia里的user_pic + 默认图）
const realUserAvatar = computed(() => {
  // 优先级：后端返回的headImg > Pinia里的user_pic > 本地默认图
  return userStore.user?.headImg || userStore.user?.user_pic || '@/assets/default.png'
})

// 7. 新增：当前激活菜单路径（核心解决高亮问题）
const activeMenuPath = computed(() => {
  // 获取当前完整路由路径（如 /commonlayout/adminindex）
  const fullPath = $route.path
  // 截取最后一段路径并拼接（如 adminindex → /adminindex）
  const pathArr = fullPath.split('/')
  let activePath = '/' + pathArr[pathArr.length - 1]

  // 适配嵌套子菜单的父菜单高亮
  if (fullPath.includes('superadmin-orchardmanage')) {
    activePath = '/superadmin-orchardmanage'
  } else if (fullPath.includes('orchard')) {
    activePath = '/orchard'
  }

  return activePath
})

// 8. 导入所有用到的图标
import {
  Management,
  Promotion,
  UserFilled,
  User,
  Crop,
  EditPen,
  SwitchButton,
  CaretBottom,
  Setting
} from '@element-plus/icons-vue'

// 9. 下拉菜单命令处理（根据角色来区分不同的导航栏路径跳转）
import { useRouter } from 'vue-router'
const router = useRouter()

const handleCommand = (command) => {
  if (command === 'logout') {
    // 优化：调用clearUser方法，清空更彻底
    userStore.clearUser()
    router.push('/login')
  } else {
    // 适配角色的跳转路径：普通管理员/超级管理员对应不同路径
    const rolePrefix = realRole.value === 'superAdmin' ? '/superadmin' : '/admin'
    router.push(`${rolePrefix}/user/${command}`)
  }
}
</script>

<style lang="scss" scoped>
/* 保留你所有原有样式，新增高亮样式 */
.layout-container {
  height: 100vh;

  .el-aside {
    background-color: #232323;

    &__logo {
      height: 120px;
      background: url('@/assets/logo.png') no-repeat center / 120px auto;
    }

    .el-menu {
      border-right: none;
      // 新增：激活菜单的背景色+文字色强化
      &-item.is-active {
        background-color: #409eff !important;
        color: #fff !important;
      }
      // 子菜单激活样式
      &-submenu.is-active > .el-menu-item {
        color: #ffd04b !important;
      }
    }
  }

  .el-header {
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .el-dropdown__box {
      display: flex;
      align-items: center;
      cursor: pointer;

      .el-icon {
        color: #999;
        margin-left: 10px;
      }
    }
  }

  .el-main {
    background-color: #f5f5f5;
    padding: 20px;

    .main-placeholder {
      width: 100%;
      min-height: calc(100vh - 180px);
      background-color: #fff;
      border-radius: 4px;
      padding: 20px;
    }
  }

  .el-footer {
    text-align: center;
    font-size: 14px;
    color: #666;
    padding: 10px 0;
    background-color: #fff;
  }
}
</style>