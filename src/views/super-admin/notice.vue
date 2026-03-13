<template>
  <CommonLayout>
    <div class="notice-management-page">
      <div class="search-bar">
        <el-form :inline="true" :model="filterForm" class="search-form">
          <el-form-item label="通知标题">
            <el-input
              v-model="filterForm.title"
              placeholder="标题搜索"
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="完成状态">
            <el-select
              v-model="filterForm.isFinish"
              placeholder="全部"
              style="width: 120px"
            >
              <el-option label="全部" value="" />
              <el-option label="未完成" :value="0" />
              <el-option label="已完成" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="接收人ID">
            <el-input
              v-model="filterForm.empId"
              placeholder="接收人ID"
              style="width: 150px"
            />
          </el-form-item>
          <el-form-item label="果园ID">
            <el-input
              v-model="filterForm.orchardId"
              placeholder="果园ID"
              style="width: 150px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getNoticeList">筛选</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>

        <el-button type="primary" class="publish-btn" @click="openAddDialog">
          发布通知
        </el-button>
      </div>

      <NoticeList
        ref="noticeListRef"
        :filterParams="filterForm"
        @refresh-list="getNoticeList"
        @open-add-dialog="openAddDialog"
      />

      <el-dialog
        v-model="addDialogVisible"
        title="发布通知"
        width="60%"
        destroy-on-close
        append-to-body
      >
        <NoticeAdd
          v-if="addDialogVisible"
          @publish-success="handlePublishSuccess"
        />
      </el-dialog>
    </div>
  </CommonLayout>
</template>

<script setup>
import CommonLayout from "@/views/common/CommonLayout.vue";
import NoticeList from "./NoticeList.vue";
import NoticeAdd from "./NoticeAdd.vue";
import { ref, reactive, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";

const addDialogVisible = ref(false);
const filterForm = reactive({
  title: "",
  isFinish: "",
  empId: "",
  orchardId: "",
});
const yearOptions = ref([]);
const noticeListRef = ref(null);

const openAddDialog = () => {
  addDialogVisible.value = true;
};

const handlePublishSuccess = () => {
  addDialogVisible.value = false;
  ElMessage.success("通知发布成功！");
  noticeListRef.value?.getNoticeList();
};

const resetFilter = () => {
  filterForm.title = "";
  filterForm.isFinish = "";
  filterForm.empId = "";
  filterForm.orchardId = "";
  getNoticeList();
};

const getNoticeList = () => {
  if (noticeListRef.value) {
    noticeListRef.value.getNoticeList();
  }
};

const getYearOptions = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  yearOptions.value = [];
  for (let i = currentYear; i >= currentYear - 5; i--) {
    yearOptions.value.push(i);
  }
};

onMounted(() => {
  getYearOptions();
  getNoticeList();
});

// watch([() => filterForm.year, () => filterForm.status], () => {
//   getNoticeList()
// }, { immediate: true })
</script>

<style scoped>
.notice-management-page {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.notice-management-page h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

/* 关键修改：删除 max-width，调整 margin 为 0 auto 并和列表容器对齐 */
.search-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  width: 100%;
  /* 移除 max-width: 1000px; */
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box; /* 新增：确保 padding 不影响宽度 */
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  flex: 1;
}

.publish-btn {
  padding: 8px 20px;
  border-radius: 8px;
  margin: 0 0 0 20px;
  flex-shrink: 0;
}
@media (max-width: 1200px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-form {
    margin-right: 0;
    margin-bottom: 16px;
  }

  .publish-btn {
    margin-left: 0;
    width: 100%;
  }
}

:deep(.el-form-item) {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  min-width: 200px;
}
:deep(.el-input),
:deep(.el-select) {
  width: 100% !important; /* 让输入框占满表单项 */
}
</style>