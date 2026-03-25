<template>
  <div class="orchard-tree">
    <!-- 头部：标题 + 右侧小字 -->
    <div class="header">
      <span class="main-title">{{ activeArea.name || "未选择区域" }}</span>
      <!-- 第二行文字移到标题右侧 -->
      <span class="sub-title">
        负责人：{{ activeArea.areaManagerName || "未设置" }} | 品种：{{
          formattedArea.cropType || "-"
        }}
        | 果树总数：{{ formattedArea.totalTrees || 0 }}
      </span>
    </div>

    <div class="tree-container">
      <div v-if="treeList.length === 0" class="empty-tip">
        请先选择或添加区域
      </div>
      <div v-else>
        <!-- 表格头部（圆角） -->
        <div class="tree-table-header">
          <div class="table-cell">果树编号</div>
          <div class="table-cell">行列</div>
          <div class="table-cell">果实总数</div>
          <div class="table-cell">成熟实数</div>
          <div class="table-cell">成熟度</div>
          <div class="table-cell">健康状态</div>
          <div class="table-cell">操作</div>
        </div>
        <!-- 表格内容 -->
        <div class="tree-table-body">
          <div class="tree-table-row" v-for="tree in treeList" :key="tree.id">
            <div class="table-cell">{{ tree.id || "-" }}</div>
            <div class="table-cell">{{ tree.location || "-" }}</div>
            <div class="table-cell">{{ tree.countNum || 0 }}</div>
            <div class="table-cell">{{ tree.ripeNum || 0 }}</div>
            <div class="table-cell">
              {{ formatRipeDegree(tree.countNum, tree.ripeNum) }}
            </div>
            <div class="table-cell">
              {{ formatHealthStatus(tree.healthCondition) }}
            </div>
            <div class="table-cell">
              <div class="action-buttons">
                <el-button link size="small" @click="$emit('tree-detail', tree)"
                  >详情</el-button
                >
                <el-button
                  link
                  size="small"
                  type="danger"
                  @click="handleDelete(tree)"
                  >删除</el-button
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";

const props = defineProps({
  areaId: { type: String, default: "" },
  activeArea: { type: Object, default: () => ({}) },
  treeList: { type: Array, default: () => [] },
});

const emit = defineEmits(["tree-detail", "tree-delete"]);

// 计算成熟度百分比
const calculateRipeDegree = (countNum, ripeNum) => {
  const total = Number(countNum) || 0;
  const ripe = Number(ripeNum) || 0;
  if (total === 0) return 0;
  const degree = Math.round((ripe / total) * 100);
  return Math.min(degree, 100);
};

// 格式化成熟度显示
const formatRipeDegree = (countNum, ripeNum) => {
  const degree = calculateRipeDegree(countNum, ripeNum);
  if (degree === 0) return "0%";
  if (degree >= 100) return "已成熟";
  return `${degree}%`;
};

// 格式化健康状态
const formatHealthStatus = (healthCondition) => {
  if (!healthCondition) return "未添加";
  const status = String(healthCondition);
  if (status === "1") return "健康";
  if (status === "0") return "不健康";
  return "未知";
};

const formattedArea = computed(() => {
  const firstTree = props.treeList[0];
  const cropType = firstTree?.type || props.activeArea.cropType || "-";
  const totalTrees = props.treeList.length || props.activeArea.totalTrees || 0;

  return {
    ...props.activeArea,
    cropType,
    totalTrees,
  };
});

const handleDelete = (tree) => {
  console.log("删除果树:", tree);
  ElMessageBox.confirm("确定要删除这棵果树吗？", "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      emit("tree-delete", tree.id);
      ElMessage.success("删除成功");
    })
    .catch(() => {
      ElMessage.info("已取消删除");
    });
};
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
  min-width: 0;
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
  max-width: 500px; /* 适配右侧宽度 */
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

.table-cell:nth-child(1) {
  flex: 0.8;
}
.table-cell:nth-child(2) {
  flex: 0.8;
}
.table-cell:nth-child(3) {
  flex: 0.8;
}
.table-cell:nth-child(4) {
  flex: 0.8;
}
.table-cell:nth-child(5) {
  flex: 0.8;
}
.table-cell:nth-child(6) {
  flex: 0.8;
}
.table-cell:nth-child(7) {
  flex: 1;
}

.action-buttons {
  display: flex;
  /* gap: 2px; */
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