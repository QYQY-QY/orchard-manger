<template>
  <div class="orchard-area">
    <!-- 头部：标题 + 右侧小字 -->
    <div class="header">
      <span class="main-title">{{ activeOrchard.name || "未选择果园" }}</span>
      <!-- 第二行文字移到标题右侧，小字展示 -->
      <span class="sub-title">
        负责人：{{ activeOrchard.areaManagerName || "未设置" }} | 位置：{{
          activeOrchard.address || "-"
        }}
      </span>
    </div>

    <div class="area-list">
      <div
        v-for="area in areaList"
        :key="area.id"
        class="area-item"
        :class="{ active: area.id === activeAreaId }"
        @click="$emit('area-select', area.id)"
      >
        <div class="area-name">区域{{ area.id }}：{{ area.name }}</div>
        <div class="area-desc">品种ID：{{ area.typeId || "-" }}</div>
        <el-button link size="small" @click.stop="showEditDialog(area)"
          >区域详情</el-button
        >
      </div>
    </div>

    <!-- 添加/编辑对话框（圆角） -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加区域' : '编辑区域'"
      width="500px"
      border-radius="12px"
    >
      <el-form :model="form" label-width="100px" class="form-container">
        <el-form-item label="区域名称">
          <el-input
            v-model="form.name"
            placeholder="请输入区域名称"
            border-radius="6px"
          />
        </el-form-item>
        <el-form-item label="区域负责人">
          <el-input
            v-model="form.manager"
            placeholder="请输入区域负责人"
            border-radius="6px"
          />
        </el-form-item>
        <el-form-item label="种植品种">
          <el-input
            v-model="form.cropType"
            placeholder="请输入种植品种"
            border-radius="6px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button border-radius="6px" @click="dialogVisible = false"
          >取消</el-button
        >
        <el-button type="primary" border-radius="6px" @click="handleSubmit"
          >确定</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import axios from "axios";

const props = defineProps({
  orchardId: { type: String, default: "" },
  activeOrchard: { type: Object, default: () => ({}) },
  areaList: { type: Array, default: () => [] },
  activeAreaId: { type: String, default: "" },
});

const emit = defineEmits(["area-select", "area-update"]);

const dialogVisible = ref(false);
const dialogType = ref("add");

const form = reactive({
  id: "",
  name: "",
  manager: "",
  cropType: "",
  orchardId: props.orchardId,
});
const handleSubmit = async () => {
  try {
    // 构建提交数据 - 严格按照后端 Area 对象的字段名
    const submitData = {
      id: form.id,
      name: form.name,
      empId: form.manager, // 负责人ID
      typeId: form.cropType, // 品种ID
      orchardId: props.orchardId,
      description: form.description || "", // 如果有描述字段
    };

    // 如果是编辑模式且没有 id，说明是新增
    if (dialogType.value === "add") {
      delete submitData.id; // 新增时不要传 id
      const res = await axios.post("/api/area", submitData);
      if (res.data?.code === 200) {
        ElMessage.success("添加成功");
        dialogVisible.value = false;
        emit("area-update", { type: "add", data: res.data.data });
      } else {
        ElMessage.error(res.data?.msg || "添加失败");
      }
    } else {
      // 编辑 - PUT 请求
      const res = await axios.put("/api/area", submitData);
      if (res.data?.code === 200) {
        ElMessage.success("修改成功");
        dialogVisible.value = false;
        emit("area-update", { type: "edit", data: submitData });
      } else {
        ElMessage.error(res.data?.msg || "修改失败");
      }
    }
  } catch (err) {
    console.error("提交失败:", err);
    ElMessage.error("操作失败: " + (err.response?.data?.msg || err.message));
  }
};
const showAddDialog = () => {
  dialogType.value = "add";
  Object.assign(form, {
    id: "",
    name: "",
    manager: "",
    cropType: "",
    orchardId: props.orchardId,
  });
  dialogVisible.value = true;
};

const showEditDialog = (area) => {
  dialogType.value = "edit";
  Object.assign(form, {
    id: area.id,
    name: area.name || "",
    manager: area.empId || "", // 注意：后端返回的是 empId（负责人ID）
    cropType: area.typeId || "", // 注意：后端返回的是 typeId（品种ID）
    orchardId: props.orchardId,
  });
  dialogVisible.value = true;
};

// 区域更新（增/改/删）
const handleAreaUpdate = async (action) => {
  const orchardIdx = orchardList.value.findIndex(
    (o) => o.id === activeOrchardId.value
  );
  if (orchardIdx === -1) return;

  switch (action.type) {
    case "add":
      await getAreaList(activeOrchardId.value);
      if (orchardList.value[orchardIdx].areas.length > 0) {
        const newAreaId =
          orchardList.value[orchardIdx].areas[
            orchardList.value[orchardIdx].areas.length - 1
          ].id;
        activeAreaId.value = newAreaId;
        await getTreeList(newAreaId);
      }
      break;
    case "edit":
      try {
        // 调用后端更新接口
        const res = await axios.put("/api/area", action.data); // PUT 请求，直接传 area 对象

        if (res.data?.code === 200) {
          ElMessage.success("区域修改成功");

          // 更新本地数据
          const editIdx = orchardList.value[orchardIdx].areas.findIndex(
            (a) => a.id === action.data.id
          );
          if (editIdx > -1) {
            orchardList.value[orchardIdx].areas[editIdx] = {
              ...orchardList.value[orchardIdx].areas[editIdx],
              ...action.data,
            };
          }
        } else {
          ElMessage.error(res.data?.msg || "修改失败");
        }
      } catch (err) {
        console.error("修改区域失败:", err);
        ElMessage.error("网络错误，修改失败");
      }
      break;
    case "delete":
      orchardList.value[orchardIdx].areas = orchardList.value[
        orchardIdx
      ].areas.filter((a) => a.id !== action.id);
      if (activeAreaId.value === action.id) {
        activeAreaId.value = "";
      }
      break;
  }
};

const handleDelete = async (id) => {
  try {
    const res = await axios.post("/api/area/delete", { id });
    if (res.data?.code === 200) {
      ElMessage.success("删除成功");
      emit("area-update", { type: "delete", id });
    } else {
      ElMessage.error("删除失败");
    }
  } catch (err) {
    console.error(err);
    ElMessage.error("网络错误");
  }
};
</script>

<style scoped>
.orchard-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px; /* 组件容器圆角 */
  overflow: hidden;
}

/* 头部：标题+右侧小字布局 */
.header {
  display: flex;
  justify-content: space-between; /* 标题左，小字右 */
  align-items: center;
  padding: 0 16px;
  height: 50px;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}

/* 主标题 */
.main-title {
  font-weight: 600;
  color: #333;
}

/* 右侧小字 */
.sub-title {
  font-size: 12px;
  color: #666;
  white-space: nowrap; /* 防止换行 */
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px; /* 限制宽度，避免挤压标题 */
}

.area-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* 列表项圆角 */
.area-item {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.area-item:hover {
  background-color: #f8f9fa;
  border-color: #e8e8e8;
}

.area-item.active {
  background-color: #e6f7ff;
  border-color: #409eff;
}

.area-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
  font-weight: 500;
}

.area-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.area-item .el-button {
  font-size: 12px;
  padding: 0;
  color: #409eff;
}

/* 表单容器 */
.form-container {
  padding: 8px 20px;
}

/* 滚动条美化 */
.area-list::-webkit-scrollbar {
  width: 6px;
}
.area-list::-webkit-scrollbar-thumb {
  background: #dcdcdc;
  border-radius: 3px;
}
.area-list::-webkit-scrollbar-track {
  background: #f5f5f5;
}
</style>