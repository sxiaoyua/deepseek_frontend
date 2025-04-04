<template>
  <div class="header-bar">
    <template v-if="sidebarCollapsed">
      <el-tooltip content="展开侧边栏" placement="right">
        <el-button circle @click="$emit('toggle-sidebar')">
          <el-icon><Expand /></el-icon>
        </el-button>
      </el-tooltip>
    </template>
    <h3 class="current-conversation-title">{{ title || '新对话' }}</h3>
    <div class="header-actions">
      <el-tooltip content="导出对话" placement="bottom" :disabled="!hasConversation">
        <div>
          <el-button circle :disabled="!hasConversation" @click="$emit('export')">
            <el-icon><Download /></el-icon>
          </el-button>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { Expand, Download } from '@element-plus/icons-vue';

defineProps({
  sidebarCollapsed: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  hasConversation: {
    type: Boolean,
    default: false
  }
});

defineEmits(['toggle-sidebar', 'export']);
</script>

<style scoped>
.header-bar {
  padding: 15px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  gap: 15px;
}

.current-conversation-title {
  flex: 1;
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style> 