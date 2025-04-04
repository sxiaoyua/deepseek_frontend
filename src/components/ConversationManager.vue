<template>
  <div class="conversation-manager">
    <!-- 重命名对话弹窗 -->
    <el-dialog
      v-model="renameDialogVisible"
      title="重命名对话"
      width="420px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form :model="renameForm" @submit.prevent="confirmRename">
        <el-form-item>
          <el-input
            v-model="renameForm.title"
            placeholder="请输入对话标题"
            maxlength="50"
            show-word-limit
            autofocus
            @keyup.enter="confirmRename"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="renameDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmRename">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 确认删除对话弹窗 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="删除对话"
      width="420px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <p>确定要删除这个对话吗？此操作不可恢复。</p>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">删除</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导出对话弹窗 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出对话"
      width="420px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div class="export-options">
        <p>选择导出格式：</p>
        <el-radio-group v-model="exportFormat">
          <el-radio :value="'txt'">纯文本 (.txt)</el-radio>
          <el-radio :value="'json'">JSON文件 (.json)</el-radio>
          <el-radio :value="'markdown'">Markdown (.md)</el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmExport">导出</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';

// 定义组件事件
const emit = defineEmits(['rename', 'delete', 'export']);

// 重命名相关状态
const renameDialogVisible = ref(false);
const renameForm = ref({ 
  title: '',
  conversationId: null
});

// 删除相关状态
const deleteDialogVisible = ref(false);
const deleteConversationId = ref(null);

// 导出相关状态
const exportDialogVisible = ref(false);
const exportFormat = ref('markdown');
const exportConversationId = ref(null);

// 打开重命名对话框
const openRenameDialog = (conversation) => {
  renameForm.value.title = conversation.title || '';
  renameForm.value.conversationId = conversation._id;
  renameDialogVisible.value = true;
};

// 确认重命名
const confirmRename = () => {
  if (!renameForm.value.title.trim()) {
    return;
  }
  
  emit('rename', {
    id: renameForm.value.conversationId,
    title: renameForm.value.title.trim()
  });
  
  renameDialogVisible.value = false;
};

// 打开删除确认对话框
const openDeleteDialog = (conversationId) => {
  deleteConversationId.value = conversationId;
  deleteDialogVisible.value = true;
};

// 确认删除
const confirmDelete = () => {
  emit('delete', deleteConversationId.value);
  deleteDialogVisible.value = false;
};

// 打开导出对话框
const openExportDialog = (conversationId) => {
  exportConversationId.value = conversationId;
  exportDialogVisible.value = true;
};

// 确认导出
const confirmExport = () => {
  emit('export', {
    id: exportConversationId.value,
    format: exportFormat.value
  });
  exportDialogVisible.value = false;
};

// 对外暴露方法
defineExpose({
  openRenameDialog,
  openDeleteDialog,
  openExportDialog
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.export-options p {
  margin: 0;
  margin-bottom: 5px;
}
</style>
