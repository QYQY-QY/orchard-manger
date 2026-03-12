<script setup></script>

<template>
 <router-view />
</template>

<style>
/* 清空默认样式，避免干扰 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: sans-serif;
}

/* ========== 1. 全局主按钮（type="primary"）- 如申请账号/确认按钮 ========== */
/* 完整覆盖 Element Plus 主按钮所有状态的 CSS 变量（优先级拉满） */
:root {
  --el-button-primary-bg-color: #6ebeb1 !important;
  --el-button-primary-border-color: #6ebeb1 !important;
  --el-button-primary-text-color: #fff !important;
  --el-button-primary-hover-bg-color: #5aa89d !important;
  --el-button-primary-hover-border-color: #5aa89d !important;
  --el-button-primary-active-bg-color: #4b948a !important;
  --el-button-primary-active-border-color: #4b948a !important;
}
/* 兜底：直接覆盖主按钮样式（防止变量不生效） */
.el-button--primary {
  background-color: #6ebeb1 !important;
  border-color: #6ebeb1 !important;
  color: #fff !important;
}
.el-button--primary:hover {
  background-color: #5aa89d !important;
  border-color: #5aa89d !important;
}
.el-button--primary:active {
  background-color: #4b948a !important;
  border-color: #4b948a !important;
}

/* ========== 2. 全局文本按钮（去实名/查看详情/禁用）- 仅文字色，无背景/边框 ========== */
/* 核心：覆盖所有 type="text" 的按钮，强制清空背景/边框，仅保留文字色 */
.el-button--text {
  color: #6ebeb1 !important; /* 基础文字色（和主按钮同绿色） */
  background-color: transparent !important; /* 强制清空背景色 */
  border: none !important; /* 强制去掉边框 */
  padding: 0 2px !important; /* 微调内边距，避免文字挤压 */
}
/* 文本按钮hover状态：仅文字加深，仍无背景 */
.el-button--text:hover {
  color: #5aa89d !important; /* hover文字加深 */
  background-color: transparent !important; /* 保持无背景 */
  border: none !important; /* 保持无边框 */
}

/* ========== 3. 精准匹配：区域划分-查看详情按钮（兼容旧样式） ========== */
.zone-actions .el-button--text:first-child {
  color: #6ebeb1 !important; /* 查看详情文字色（绿色） */
}
.zone-actions .el-button--text:first-child:hover {
  color: #5aa89d !important;
}

/* ========== 4. 精准匹配：删除按钮（仅红色文字，无背景） ========== */
.zone-actions .el-button--text[text-color="danger"],
/* 全局其他模块的删除文本按钮（如账号管理） */
.el-button--text[text-color="danger"] {
  color: #f56c6c !important; /* 删除按钮文字红 */
  background-color: transparent !important; /* 清空背景 */
  border: none !important; /* 清空边框 */
}
.zone-actions .el-button--text[text-color="danger"]:hover,
.el-button--text[text-color="danger"]:hover {
  color: #dc6060 !important; /* hover文字加深 */
  background-color: transparent !important;
}

/* ========== 5. 可选：禁用按钮（仅灰色文字，无背景） ========== */
.el-button--text.is-disabled,
.el-button--text[disabled] {
  color: #999 !important; /* 禁用文字色（灰色） */
  background-color: transparent !important;
  border: none !important;
  cursor: not-allowed !important;
}
</style>