<template>
  <el-scrollbar ref="scrollbar">
    <WelcomeScreen 
      v-if="isEmpty"
      :questions="sampleQuestions"
      @select-question="$emit('select-question', $event)"
    />

    <div v-else class="messages">
      <MessageBubble 
        v-for="(message, index) in messages" 
        :key="index"
        :role="message.role"
        :content="message.content"
        :timestamp="message.timestamp"
        :sender-name="getSenderName(message)"
        :avatar-src="getAvatarSrc(message)"
        :has-reasoning="message.hasReasoning"
        :reasoning="message.reasoning"
      />
      
      <!-- 流式响应消息 -->
      <MessageBubble 
        v-if="streamingMessage"
        role="assistant"
        :content="streamingMessage.content"
        :timestamp="new Date()"
        sender-name="DeepSeek AI"
        :avatar-src="aiAvatar"
        :has-reasoning="streamingMessage.hasReasoning"
        :reasoning="streamingMessage.reasoning"
        :is-streaming="true"
      />
      
      <!-- 加载指示器 -->
      <MessageBubble 
        v-else-if="typingIndicator"
        role="assistant"
        content=""
        sender-name="DeepSeek AI"
        :avatar-src="aiAvatar"
        :loading="true"
      />
    </div>
  </el-scrollbar>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import MessageBubble from './MessageBubble.vue';
import WelcomeScreen from './WelcomeScreen.vue';

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  isEmpty: {
    type: Boolean,
    default: true
  },
  typingIndicator: {
    type: Boolean,
    default: false
  },
  sampleQuestions: {
    type: Array,
    default: () => []
  },
  user: {
    type: Object,
    default: () => ({})
  },
  userAvatar: {
    type: String,
    default: ''
  },
  aiAvatar: {
    type: String,
    default: ''
  },
  // 新增：流式响应的消息
  streamingMessage: {
    type: Object,
    default: null
  }
});

defineEmits(['select-question']);

const scrollbar = ref(null);

// 获取消息发送者名称
const getSenderName = (message) => {
  return message.role === 'user' ? props.user?.username : 'DeepSeek AI';
};

// 获取消息头像
const getAvatarSrc = (message) => {
  return message.role === 'user' ? props.userAvatar : props.aiAvatar;
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (scrollbar.value) {
      const scrollbarRef = scrollbar.value.$el.querySelector('.el-scrollbar__wrap');
      scrollbarRef.scrollTop = scrollbarRef.scrollHeight;
    }
  });
};

// 暴露方法给父组件调用
defineExpose({
  scrollToBottom
});
</script>

<style scoped>
.messages {
  padding: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .message-container {
    padding-bottom: 100px;
  }
}
</style> 