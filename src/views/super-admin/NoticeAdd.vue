<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    class="add-form"
    style="padding: 20px; background: #f8f9fa; border-radius: 12px"
  >
    <!-- 通知标题 -->
    <el-form-item label="通知标题" prop="title" class="form-item-custom">
      <el-input
        v-model="form.title"
        placeholder="请输入通知标题"
        style="width: 100%; border-radius: 8px"
        size="large"
      />
    </el-form-item>

    <!-- 发送对象 -->
    <el-form-item label="发送对象" prop="groupId" class="form-item-custom">
      <el-select
        v-model="form.groupId"
        placeholder="请选择发送对象"
        style="width: 100%; border-radius: 8px"
        @change="handleGroupChange"
        size="large"
      >
        <el-option label="所有人" value="0" />
        <el-option label="管理员" value="1" />
        <el-option label="农户+游客" value="2" />
      </el-select>
    </el-form-item>

    <!-- 管理员选择（仅选择管理员时显示） -->
    <el-form-item
      label="指定管理员"
      prop="empId"
      v-if="form.groupId === '1'"
      class="form-item-custom"
    >
      <el-select
        v-model="form.empId"
        placeholder="请选择管理员"
        filterable
        style="width: 100%; border-radius: 8px"
        size="large"
      >
        <el-option
          v-for="item in adminList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>

    <!-- 通知内容 -->
    <el-form-item label="通知内容" prop="content" class="form-item-custom">
      <el-input
        v-model="form.content"
        type="textarea"
        placeholder="请输入通知内容"
        rows="8"
        style="width: 100%; border-radius: 8px"
        size="large"
      />
    </el-form-item>

    <!-- 提交按钮 -->
    <el-form-item class="btn-group">
      <el-button
        type="primary"
        @click="submitForm"
        :loading="loading"
        style="border-radius: 8px; padding: 10px 40px; font-size: 16px"
        size="large"
      >
        确认发布
      </el-button>
      <el-button
        @click="resetForm"
        style="
          border-radius: 8px;
          padding: 10px 40px;
          font-size: 16px;
          margin-left: 20px;
        "
        size="large"
      >
        重置
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/modules/user";
import axios from "axios";
import dayjs from "dayjs";
const emit = defineEmits(["publish-success"]);

// 表单引用
const formRef = ref(null);
// 加载状态
const loading = ref(false);
// 管理员列表
const adminList = ref([]);

// 用户信息
const userStore = useUserStore();
const senderId = userStore.user.id || 0;
const senderName =
  userStore.user.name || userStore.user.username || "超级管理员";

// 表单数据
const form = reactive({
  title: "",
  groupId: "",
  empId: "",
  empName: "",
  content: "",
  // 默认值
  createUser: 0,
  haveNumber: 0,
  id: 1,
  isFinish: 0,
  isRead: 0,
  needNumber: 0,
  orchardId: 0,
  orchardName: "",
  page: 0,
  pageSize: 0,
  salary: null,
  senderId: senderId,
  senderName: senderName,
  status: 0,
  updateUser: 0,
});

// 校验规则
const rules = reactive({
  title: [{ required: true, message: "请输入通知标题", trigger: "blur" }],
  groupId: [{ required: true, message: "请选择发送对象", trigger: "change" }],
  // empId: [
  //   {
  //     required: () => form.groupId === '1',
  //     message: '请选择管理员',
  //     trigger: 'change'
  //   }
  // ],
  content: [{ required: true, message: "请输入通知内容", trigger: "blur" }],
});

// 获取管理员列表（替换为真实接口，删除模拟数据）
const getAdminList = async () => {
  try {
    // 真实接口：GET /api/emloyee/getAllEmployee
    const res = await axios.get("/api/employee/getAllEmployees");
    if (res.data.code === 200) {
      adminList.value = res.data.data.filter((item) => item.isAdmin === 2);
    } else {
      ElMessage.error("获取管理员列表失败");
      adminList.value = [];
    }
  } catch (error) {
    ElMessage.error(`获取管理员接口失败：${error.message}`);
    console.error("接口报错：", error);
    adminList.value = [];
  }
};

// 切换发送对象
const handleGroupChange = (val) => {
  if (val !== "1") {
    form.empId = "";
    form.empName = "";
  }
};

// 选择管理员后赋值姓名
watch(
  () => form.empId,
  (val) => {
    if (!val) return;
    const emp = adminList.value.find((item) => item.id == val);
    if (emp) {
      form.empName = emp.name;
    }
  },
  { immediate: true }
);

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
    form.empId = "";
    form.empName = "";
  }
};

// 提交表单（替换为真实接口，删除模拟数据）
const submitForm = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    const now = dayjs().format("YYYY-MM-DD HH:mm:ss").substring(0, 19);
    console.log("生成的时间:", now);
    const submitData = {
      ...form,
      createTime: now,
      updateTime: now,
    };
    console.log("提交数据：", submitData);
    // 虚假接口：POST /api/announceInfo/publish
    const res = await axios.post("/api/announceInfo/publish", submitData);
    if (res.data.code === 200) {
      emit("publish-success");
      ElMessage.success("通知发布成功");
    } else {
      ElMessage.error(res.data.msg || "发布失败");
    }
  } catch (error) {
    ElMessage.error(`发布接口请求失败：${error.message || "表单校验失败"}`);
    console.error("接口报错：", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  getAdminList();
});
</script>


<style scoped>
.add-form {
  padding: 25px;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.form-item-custom {
  margin-bottom: 20px;
}

.btn-group {
  text-align: center;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

/* 统一表单元素样式 */
:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  border: 1px solid #e9ecef;
}

:deep(.el-form-item__label) {
  color: #495057;
  font-weight: 600;
  font-size: 14px;
}

:deep(.el-textarea__inner) {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  border: 1px solid #e9ecef;
}
</style>