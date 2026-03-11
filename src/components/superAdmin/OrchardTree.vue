<template>
  <div class="orchard-tree">
    <!-- 头部：标题 + 右侧小字 -->
    <div class="header">
      <span class="main-title">{{ activeArea.name || '未选择区域' }}</span>
      <!-- 第二行文字移到标题右侧 -->
      <span class="sub-title">
        负责人：{{ activeArea.manager || '未设置' }} | 品种：{{ activeArea.cropType || '-' }} | 果树总数：{{ activeArea.totalTrees || 0 }}
      </span>
    </div>

    <div class="tree-container">
      <div v-if="treeList.length === 0" class="empty-tip">请先选择或添加区域</div>
      <div v-else>
        <!-- 表格头部（圆角） -->
        <div class="tree-table-header">
          <div class="table-cell">果树编号</div>
          <div class="table-cell">果树品种</div>
          <div class="table-cell">果实总数</div>
          <div class="table-cell">成熟实数</div>
          <div class="table-cell">成熟度</div>
          <div class="table-cell">健康状态</div>
          <div class="table-cell">二维码</div>
          <div class="table-cell">操作</div>
        </div>
        <!-- 表格内容 -->
        <div class="tree-table-body">
          <div class="tree-table-row" v-for="tree in treeList" :key="tree.id">
            <div class="table-cell">{{ tree.id || '-' }}</div>
            <div class="table-cell">{{ tree.cropType || '沃柑' }}</div>
            <div class="table-cell">{{ tree.fruitTotal || 0 }}</div>
            <div class="table-cell">{{ tree.ripeFruit || 0 }}</div>
            <div class="table-cell">{{ tree.ripenessRate || 0 }}%</div>
            <div class="table-cell">{{ tree.healthStatus || '-' }}</div>
            <div class="table-cell">
              <!-- 二维码占位（圆角） -->
              <div class="qrcode-placeholder">
                <img v-if="tree.qrcode" :src="tree.qrcode" alt="二维码" width="40" height="40" />
                <div v-else class="qrcode-empty"></div>
              </div>
            </div>
            <div class="table-cell">
              <div class="action-buttons">
                <el-button type="text" size="small" @click="$emit('tree-detail', tree)">查看详情</el-button>
                <el-button type="text" size="small" color="red">删除</el-button>
              </div>
            </div>
          </div>
        </div>
        <!-- 底部按钮（圆角） -->
        <div class="tree-table-footer">
          <el-button type="primary" size="small" border-radius="6px">批量生成二维码</el-button>
          <el-button type="success" size="small" style="margin-left: 8px;" border-radius="6px">批量下载二维码</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  areaId: { type: String, default: '' },
  activeArea: { type: Object, default: () => ({}) },
  treeList: { type: Array, default: () => [] }
})

defineEmits(['tree-detail'])
</script>

<style scoped>
.orchard-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px; /* 组件容器圆角 */
  overflow: hidden;
}

/* 头部：标题+右侧小字 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 50px;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}

.main-title {
  font-weight: 600;
  color: #333;
}

.sub-title {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px; /* 适配右侧宽度 */
}

.tree-container {
  flex: 1;
  overflow: auto;
  padding: 8px 16px;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 60px 0;
  font-size: 14px;
}

/* 表格头部圆角 */
.tree-table-header {
  display: flex;
  background: #f5f7fa;
  border-radius: 6px 6px 0 0; /* 上圆角 */
  border-bottom: 1px solid #e8e8e8;
  font-weight: 600;
  font-size: 12px;
  color: #333;
  overflow: hidden;
}

.tree-table-body {
  flex: 1;
  overflow-y: auto;
}

/* 表格行圆角 */
.tree-table-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  color: #666;
  transition: background 0.2s;
}

.tree-table-row:last-child {
  border-bottom: none;
}

.tree-table-row:hover {
  background: #f8f9fa;
}

/* 表格单元格 */
.table-cell {
  padding: 12px 8px;
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-cell:nth-child(1) { flex: 0.8; }
.table-cell:nth-child(2) { flex: 0.8; }
.table-cell:nth-child(3) { flex: 0.8; }
.table-cell:nth-child(4) { flex: 0.8; }
.table-cell:nth-child(5) { flex: 0.8; }
.table-cell:nth-child(6) { flex: 0.8; }
.table-cell:nth-child(7) { flex: 1; }
.table-cell:nth-child(8) { flex: 1; }

/* 二维码占位圆角 */
.qrcode-placeholder {
  width: 40px;
  height: 40px;
  background: #f5f5f5;
  border-radius: 8px; /* 二维码圆角 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.qrcode-empty {
  width: 40px;
  height: 40px;
  background: #eee;
  border-radius: 8px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-buttons .el-button {
  padding: 0;
  font-size: 11px;
}

.tree-table-footer {
  padding: 16px 0;
  display: flex;
  justify-content: flex-end;
}

/* 滚动条美化 */
.tree-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.tree-container::-webkit-scrollbar-thumb {
  background: #dcdcdc;
  border-radius: 3px;
}
.tree-container::-webkit-scrollbar-track {
  background: #f5f5f5;
}
</style>