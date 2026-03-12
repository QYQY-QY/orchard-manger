<template>
  <!-- 嵌套CommonLayout，内容会渲染到插槽 -->
  <CommonLayout>
    <div class="super-admin-index">
      <h3>超级管理员界面</h3>
      <div class="content">
        <p>欢迎使用果园管理系统 - 超级管理员端</p>
        <p>当前用户：{{ userName }}</p>
        <p>用户角色：{{ roleName }}</p>
        <p class="exclusive">✅ 拥有系统设置、果园配置等专属权限</p>
      </div>
    </div>
  </CommonLayout>
</template>

<script setup>
// 导入布局组件（全局注册过也可省略，但建议显式导入）
import CommonLayout from '@/views/common/CommonLayout.vue'
import { useUserStore } from '@/stores/modules/user'
import { computed } from 'vue'

const userStore = useUserStore()
const userName = computed(() => userStore.user.name || userStore.user.username)
const roleName = computed(() => '超级管理员')
</script>

<style scoped>
.super-admin-index {
  padding: 20px;
}

.super-admin-index h3 {
  color: #333;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.super-admin-index .content {
  color: #666;
  line-height: 1.8;
}

.super-admin-index .exclusive {
  color: #409eff;
  font-weight: bold;
  margin-top: 10px;
}
</style>