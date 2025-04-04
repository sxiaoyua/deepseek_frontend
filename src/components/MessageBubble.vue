<template>
  <div class="message" :class="role">
    <div class="message-avatar">
      <el-avatar :size="40" :src="avatarSrc">
        {{ avatarText }}
      </el-avatar>
    </div>
    <div class="message-content">
      <div class="message-sender">{{ senderName }}</div>
      
      <!-- 用户文本消息 -->
      <div class="message-text" v-if="!loading && role === 'user' && !hasImage">{{ content }}</div>
      
      <!-- 用户图像消息 -->
      <div v-if="!loading && role === 'user' && hasImage" class="message-content-wrapper">
        <div class="message-text" v-if="textContent">{{ textContent }}</div>
        <div class="message-image">
          <img :src="imageUrl" alt="用户上传的图片" />
        </div>
      </div>
      
      <!-- AI回复 -->
      <div class="message-text markdown-content" v-if="!loading && role === 'assistant'" v-html="renderedContent"></div>
      
      <!-- 加载指示器 -->
      <div class="typing-indicator" v-if="loading">
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      <div class="message-time">{{ formattedTime }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { marked } from 'marked';

const props = defineProps({
  role: {
    type: String,
    required: true,
    validator: (value) => ['user', 'assistant'].includes(value)
  },
  content: {
    type: [String, Array, Object],
    default: ''
  },
  timestamp: {
    type: [Number, String, Date],
    default: () => new Date()
  },
  avatarSrc: {
    type: String,
    default: ''
  },
  senderName: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// 检查是否有图像
const hasImage = computed(() => {
  if (!props.content) return false;
  
  // 处理数组格式的消息内容 (多模态消息)
  if (Array.isArray(props.content)) {
    return props.content.some(item => item.type === 'image_url');
  }
  
  // 处理对象格式的消息内容 (带有hasImage标志)
  if (typeof props.content === 'object' && props.content.hasImage) {
    return true;
  }
  
  return false;
});

// 提取文本内容
const textContent = computed(() => {
  if (!props.content) return '';
  
  // 处理数组格式的消息内容
  if (Array.isArray(props.content)) {
    const textItem = props.content.find(item => item.type === 'text');
    return textItem ? textItem.text : '';
  }
  
  // 如果是字符串，直接返回
  if (typeof props.content === 'string') {
    return props.content;
  }
  
  // 处理对象格式的消息内容
  if (typeof props.content === 'object') {
    if (Array.isArray(props.content.content)) {
      const textItem = props.content.content.find(item => item.type === 'text');
      return textItem ? textItem.text : '';
    }
    return props.content.text || '';
  }
  
  return '';
});

// 提取图像URL
const imageUrl = computed(() => {
  if (!props.content) return '';
  
  // 处理数组格式的消息内容
  if (Array.isArray(props.content)) {
    const imageItem = props.content.find(item => item.type === 'image_url');
    return imageItem ? imageItem.image_url.url : '';
  }
  
  // 处理对象格式的消息内容
  if (typeof props.content === 'object') {
    if (Array.isArray(props.content.content)) {
      const imageItem = props.content.content.find(item => item.type === 'image_url');
      return imageItem ? imageItem.image_url.url : '';
    }
    return props.content.imageUrl || '';
  }
  
  return '';
});

// 头像文本（如果没有提供头像URL）
const avatarText = computed(() => {
  if (props.role === 'user') {
    return props.senderName ? props.senderName.charAt(0).toUpperCase() : 'U';
  } else {
    return 'AI';
  }
});

// 格式化时间
const formattedTime = computed(() => {
  if (!props.timestamp) return '';
  
  const date = new Date(props.timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
});

// 渲染Markdown内容
const renderedContent = computed(() => {
  if (props.role === 'assistant' && props.content) {
    try {
      if (typeof props.content === 'string') {
        return marked(props.content);
      }
      return marked(textContent.value);
    } catch (error) {
      return textContent.value;
    }
  }
  return textContent.value;
});

// 配置marked选项
onMounted(() => {
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false,
    // smartypants: false
  });
});
</script>

<style scoped>
.message {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  width: 100%;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

/* AI头像样式 - 透明背景 */
.message.assistant .message-avatar :deep(.el-avatar) {
  background-color: transparent !important;
}

.message-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  overflow-wrap: break-word;
  word-break: break-word;
}

.message.user .message-content {
  background-color: #ecf5ff;
  text-align: right;
  /* width: 40%; */
  max-width: 50%;
  /* min-width: 200px; */
  margin-right: 10px;
}

.message.assistant .message-content {
  background-color: #f5f7fa;
  text-align: left;
  /* width: 60%; */
  max-width: 50%;
  /* min-width: 300px; */
  margin-left: 10px;
}

.message-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message-image {
  max-width: 100%;
  text-align: center;
}

.message-image img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  border: 1px solid #e6e6e6;
}

.message-sender {
  font-weight: 500;
  margin-bottom: 5px;
  font-size: 14px;
  color: #606266;
}

.message-text {
  line-height: 1.6;
  word-break: break-word;
  width: 100%;
}

.message.user .message-text {
  white-space: pre-wrap;
  text-align: left;
}

.message.assistant .message-text {
  text-align: left;
}

.markdown-content {
  text-align: left;
}

.markdown-content :deep(pre) {
  background-color: #f0f0f0;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
  font-family: "Courier New", Courier, monospace;
  line-height: 1.5;
}

.markdown-content :deep(code) {
  font-family: "Courier New", Courier, monospace;
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.9em;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding: 8px 16px;
  margin: 12px 0;
  background-color: #ecf5ff;
  color: #606266;
  border-radius: 0 4px 4px 0;
}

.markdown-content :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(p) {
  margin: 10px 0;
  line-height: 1.8;
}

/* 优化诗歌展示 */
.markdown-content :deep(p:empty) {
  margin: 0;
  line-height: 0.8;
}

.markdown-content :deep(ul), 
.markdown-content :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: #f2f2f2;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  text-align: right;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
}

.message.user .typing-indicator {
  justify-content: flex-end;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: #409eff;
  border-radius: 50%;
  animation: typing 1s infinite;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .message.user .message-content,
  .message.assistant .message-content {
    max-width: 85%;
    width: auto;
  }
  
  .message-image img {
    max-height: 200px;
  }
}
</style>
