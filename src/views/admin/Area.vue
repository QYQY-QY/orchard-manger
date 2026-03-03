<template>
  <CommonLayout>
    <!-- 这里的内容会渲染到 CommonLayout 的 <slot /> 位置 -->
    <div class="orchard-zone">
      <!-- 左侧区域列表 -->
      <div class="zone-sidebar">
        <div class="add-zone">
          <span>添加区域</span>
          <el-icon><Plus /></el-icon>
        </div>
        <div class="zone-list">
          <div class="zone-item active">区域A</div>
          <!-- 可继续添加更多区域 -->
          <!-- <div class="zone-item">区域B</div> -->
        </div>
      </div>

      <!-- 右侧操作与展示区 -->
      <div class="zone-main">
        <div class="zone-input">
          <span>区域果树数量：</span>
          <el-input placeholder="请输入" style="width: 150px" />
        </div>
        <div class="zone-display">
          <p>区域列表</p>
        </div>
      </div>
    </div>
  </CommonLayout>
</template>

<script setup>
import CommonLayout from '@/views/common/CommonLayout.vue'
import { Plus } from '@element-plus/icons-vue'
</script>

<style scoped>
.orchard-zone {
  display: flex;
  gap: 20px;
  padding: 20px;
  height: calc(100vh - 140px);
  box-sizing: border-box;
}

/* 左侧区域列表 */
.zone-sidebar {
  width: 200px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.add-zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
}

.zone-list {
  flex: 1;
  overflow-y: auto;
}

.zone-item {
  padding: 12px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.zone-item.active {
  background-color: #fecaca; /* 浅红高亮 */
  color: #991b1b;
  font-weight: 500;
}

.zone-item:hover {
  background-color: #f3f4f6;
}

/* 右侧操作与展示区 */
.zone-main {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.zone-input {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.zone-display {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
}
</style>