<template>
  <div class="conversation-list-container">
    <div class="list-header" v-if="showHeader">
      <h3>{{ title }}</h3>
      <el-button v-if="showCreateButton" type="primary" size="small" @click="$emit('create')">
        <el-icon><Plus /></el-icon>
        新对话
      </el-button>
    </div>
    
    <el-scrollbar height="100%">
      <div 
        v-for="conversation in conversations" 
        :key="conversation._id" 
        class="conversation-item"
        :class="{ 'active': activeId === conversation._id }"
        @click="$emit('select', conversation._id)"
      >
        <div class="conversation-title">
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ conversation.title }}</span>
        </div>
        <div class="conversation-time">
          {{ formatTime(conversation.updatedAt) }}
        </div>
        <div class="conversation-actions" v-if="showActions">
          <el-dropdown trigger="click" @command="(command) => $emit('action', command, conversation._id)">
            <span class="el-dropdown-link">
              <el-icon><More /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">重命名</el-dropdown-item>
                <el-dropdown-item command="export">导出</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div v-if="conversations.length === 0" class="empty-list">
        <el-empty description="暂无对话记录" />
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ChatDotRound, Plus, More } from '@element-plus/icons-vue';

const props = defineProps({
  conversations: {
    type: Array,
    default() {
      return [];
    }
  },
  activeId: {
    type: String,
    default: null
  },
  title: {
    type: String,
    default: '对话列表'
  },
  showHeader: {
    type: Boolean,
    default: false
  },
  showCreateButton: {
    type: Boolean,
    default: false
  },
  showActions: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['select', 'action', 'create']);

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // 今天以内显示时间
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // 7天以内显示星期几
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekdays[date.getDay()];
  }
  
  // 其他显示日期
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};
</script>

<style scoped>
.conversation-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #e6e6e6;
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.conversation-item {
  position: relative;
  padding: 12px 15px;
  cursor: pointer;
  border-radius: 4px;
  margin: 5px 10px;
  transition: background-color 0.2s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.conversation-item:hover {
  background-color: #f0f2f5;
}

.conversation-item.active {
  background-color: #ecf5ff;
  color: #409eff;
}

.conversation-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-time {
  font-size: 12px;
  color: #909399;
}

.conversation-actions {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s;
}

.conversation-item:hover .conversation-actions {
  opacity: 1;
}

.empty-list {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  color: #909399;
}
</style>
