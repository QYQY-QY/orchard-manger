<template>
  <CommonLayout>
    <!-- 这里的内容会渲染到 CommonLayout 的 <slot /> 位置 -->
    <div class="admin-index">
      <h3>普通管理员数据可视化页面</h3>
      <div class="content">
        <p>欢迎使用果园管理系统 - 普通管理员端</p>
        <p>当前用户：{{ userName }}</p>
        <p>用户角色：{{ roleName }}</p>
      </div>
    </div>
  </CommonLayout>
</template>

<script setup>
import CommonLayout from '@/views/common/CommonLayout.vue'
import { useUserStore } from '@/stores/modules/user'
import { computed } from 'vue'

const userStore = useUserStore()
const userName = computed(() => userStore.user.name || userStore.user.username)
const roleName = computed(() => '普通管理员')
</script>

<style scoped>
.admin-index {
  padding: 20px;
}
.admin-index h3 {
  color: #333;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
.admin-index .content {
  color: #666;
  line-height: 1.8;
}
</style>