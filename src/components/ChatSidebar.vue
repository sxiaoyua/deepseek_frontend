<template>
  <div class="sidebar" :class="{ 'sidebar-collapsed': collapsed }">
    <div class="sidebar-header">
      <div class="logo-container">
        <h2 class="logo">DeepSeek</h2>
      </div>
      <el-button type="primary" plain @click="$emit('create')">
        <el-icon><Plus /></el-icon> 新对话
      </el-button>
    </div>

    <div class="conversation-list">
      <ConversationList
        :conversations="conversations"
        :active-id="activeId"
        @select="$emit('select', $event)"
        @action="(command, id) => $emit('action', command, id)"
        @create="$emit('create')"
      />
    </div>

    <div class="sidebar-footer">
      <div class="user-info" @click="$emit('profile')">
        <el-avatar :src="userAvatar" :size="32">{{ userInitials }}</el-avatar>
        <span class="username">{{ username }}</span>
      </div>
      <el-tooltip content="收起侧边栏" placement="right">
        <el-button circle @click="$emit('toggle')">
          <el-icon><Fold /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { Plus, Fold } from '@element-plus/icons-vue';
import ConversationList from './ConversationList.vue';

defineProps({
  collapsed: {
    type: Boolean,
    default: false
  },
  conversations: {
    type: Array,
    default: () => []
  },
  activeId: {
    type: String,
    default: null
  },
  username: {
    type: String,
    default: ''
  },
  userAvatar: {
    type: String,
    default: ''
  },
  userInitials: {
    type: String,
    default: ''
  }
});

defineEmits(['toggle', 'select', 'action', 'create', 'profile']);
</script>

<style scoped>
.sidebar {
  width: 280px;
  background-color: #f5f7fa;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  overflow: hidden;
}

.sidebar-collapsed {
  width: 0;
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  color: #409eff;
  margin: 0;
  font-size: 22px;
}

.conversation-list {
  flex: 1;
  overflow: hidden;
}

.sidebar-footer {
  padding: 15px;
  border-top: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    width: 250px;
  }

  .sidebar-collapsed {
    width: 0;
  }
}
</style> 