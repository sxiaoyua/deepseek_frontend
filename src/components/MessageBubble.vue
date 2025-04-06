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
import { computed, onMounted, nextTick, watch } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css'; // 导入一个漂亮的暗色主题
import { ElMessage } from 'element-plus';

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
      // 获取原始内容
      const rawContent = typeof props.content === 'string' ? props.content : textContent.value;
      
      // 先使用marked处理基本的markdown
      let html = marked.parse(rawContent);
      
      // 手动替换所有代码块，使用正则表达式
      html = html.replace(/<pre><code\s*(?:class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/g, (match, language, code) => {
        // 如果没有指定语言，使用plaintext
        language = language || 'plaintext';
        
        // 解码HTML实体，获取原始代码
        const decodedCode = code
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        
        // 使用highlight.js高亮代码
        let highlightedCode = '';
        try {
          if (hljs.getLanguage(language)) {
            highlightedCode = hljs.highlight(decodedCode, { language }).value;
          } else {
            highlightedCode = hljs.highlightAuto(decodedCode).value;
          }
        } catch (e) {
          console.error('代码高亮失败:', e);
          highlightedCode = decodedCode; // 高亮失败时使用原始代码
        }
        
        // 生成带高亮的HTML
        return `<pre><code class="hljs language-${language}" data-language="${language}">${highlightedCode}</code></pre>`;
      });
      
      return html;
    } catch (error) {
      console.error('Markdown渲染错误:', error);
      return textContent.value;
    }
  }
  return textContent.value;
});

// 为代码块添加复制功能
const setupCodeCopy = () => {
  nextTick(() => {
    // 获取所有代码块
    const codeBlocks = document.querySelectorAll('.markdown-content pre');
    
    codeBlocks.forEach(block => {
      // 检查是否已添加复制按钮
      if (block.querySelector('.code-copy-btn')) {
        // 如果已存在按钮，先移除它以避免重复
        const existingBtn = block.querySelector('.code-copy-btn');
        existingBtn.remove();
      }
      
      // 创建复制按钮
      const copyBtn = document.createElement('button');
      copyBtn.className = 'code-copy-btn';
      copyBtn.innerText = '复制';
      
      // 使用一次性事件监听器，确保只触发一次
      const handleClick = (e) => {
        e.stopPropagation(); // 阻止冒泡
        e.preventDefault(); // 阻止默认行为
        
        // 获取代码内容
        const code = block.querySelector('code')?.innerText || '';
        
        if (code) {
          // 复制到剪贴板
          navigator.clipboard.writeText(code)
            .then(() => {
              ElMessage.success('代码已复制到剪贴板');
              // 临时改变按钮文本
              copyBtn.innerText = '已复制!';
              setTimeout(() => {
                copyBtn.innerText = '复制';
              }, 2000);
            })
            .catch(() => {
              ElMessage.error('复制失败，请手动复制');
            });
        }
      };
      
      // 添加点击事件
      copyBtn.addEventListener('click', handleClick);
      
      // 添加按钮到代码块
      block.appendChild(copyBtn);
    });
  });
};

// 配置marked选项
onMounted(() => {
  // 简化marked配置，关闭内置的高亮功能
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false,
    langPrefix: 'language-'
  });
  
  // 在内容渲染后设置代码复制功能
  setupCodeCopy();
});

// 监听内容变化，设置代码复制功能
watch(() => renderedContent.value, () => {
  // 等待DOM更新后设置复制按钮
  nextTick(() => {
    setupCodeCopy();
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
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  padding-top: 25px; /* 为了留出语言标签的空间 */
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
  font-family: 'Fira Code', Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  line-height: 1.6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid #2d2d2d;
  position: relative;
}

/* 复制按钮样式 */
.markdown-content :deep(.code-copy-btn) {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #2d2d2d;
  color: #abb2bf;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.markdown-content :deep(.code-copy-btn:hover) {
  background-color: #3e3e3e;
  color: #ffffff;
}

.markdown-content :deep(.code-copy-btn:active) {
  transform: scale(0.95);
}

.markdown-content :deep(pre)::before {
  content: '';
  display: block;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background-color: #ff5f56;
  position: absolute;
  top: 10px;
  left: 10px;
  box-shadow: 20px 0 0 #ffbd2e, 40px 0 0 #27c93f;
}

/* 语言标签 */
.markdown-content :deep(pre) code::before {
  content: attr(data-language);
  position: absolute;
  top: 0;
  right: 0;
  color: #abb2bf;
  font-size: 0.75rem;
  background: #282c34;
  padding: 0 10px;
  border-radius: 0 8px 0 8px;
  font-weight: 600;
  text-transform: uppercase;
}

.markdown-content :deep(pre) code {
  background-color: transparent;
  padding: 0;
  display: block;
  margin-top: 8px;
  font-size: 14px;
}

/* 行号样式 - 可选 */
.markdown-content :deep(pre) code {
  counter-reset: line;
}

.markdown-content :deep(pre) code .line {
  position: relative;
  padding-left: 1.5em;
}

.markdown-content :deep(pre) code .line:before {
  counter-increment: line;
  content: counter(line);
  position: absolute;
  left: 0;
  color: #636d83;
  width: 1em;
  text-align: right;
}

.markdown-content :deep(code) {
  font-family: 'Fira Code', Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

/* 代码块中的关键字颜色 */
.markdown-content :deep(.hljs-keyword),
.markdown-content :deep(.hljs-selector-tag) {
  color: #c678dd;
}

.markdown-content :deep(.hljs-string),
.markdown-content :deep(.hljs-attribute),
.markdown-content :deep(.hljs-symbol),
.markdown-content :deep(.hljs-bullet) {
  color: #98c379;
}

.markdown-content :deep(.hljs-function),
.markdown-content :deep(.hljs-title) {
  color: #61afef;
}

.markdown-content :deep(.hljs-number),
.markdown-content :deep(.hljs-literal) {
  color: #d19a66;
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

/* 代码块中的语法高亮增强 */
.markdown-content :deep(.hljs-comment),
.markdown-content :deep(.hljs-quote) {
  color: #7f848e;
  font-style: italic;
}

.markdown-content :deep(.hljs-doctag),
.markdown-content :deep(.hljs-keyword),
.markdown-content :deep(.hljs-formula),
.markdown-content :deep(.hljs-section),
.markdown-content :deep(.hljs-name),
.markdown-content :deep(.hljs-selector-tag),
.markdown-content :deep(.hljs-deletion),
.markdown-content :deep(.hljs-subst) {
  color: #c678dd;
}

.markdown-content :deep(.hljs-literal),
.markdown-content :deep(.hljs-number),
.markdown-content :deep(.hljs-link) {
  color: #d19a66;
}

.markdown-content :deep(.hljs-built_in),
.markdown-content :deep(.hljs-type),
.markdown-content :deep(.hljs-class) {
  color: #e6c07b;
}

.markdown-content :deep(.hljs-attribute),
.markdown-content :deep(.hljs-string),
.markdown-content :deep(.hljs-symbol),
.markdown-content :deep(.hljs-bullet),
.markdown-content :deep(.hljs-addition),
.markdown-content :deep(.hljs-template-tag),
.markdown-content :deep(.hljs-template-variable),
.markdown-content :deep(.hljs-meta-string) {
  color: #98c379;
}

.markdown-content :deep(.hljs-title),
.markdown-content :deep(.hljs-function) {
  color: #61afef;
}

.markdown-content :deep(.hljs-meta),
.markdown-content :deep(.hljs-selector-attr),
.markdown-content :deep(.hljs-selector-pseudo),
.markdown-content :deep(.hljs-selector-class),
.markdown-content :deep(.hljs-selector-id) {
  color: #56b6c2;
}

.markdown-content :deep(.hljs-attr) {
  color: #d19a66;
}

.markdown-content :deep(.hljs-variable),
.markdown-content :deep(.hljs-tag),
.markdown-content :deep(.hljs-regexp),
.markdown-content :deep(.hljs-name) {
  color: #e06c75;
}

.markdown-content :deep(.hljs-emphasis) {
  font-style: italic;
}

.markdown-content :deep(.hljs-strong) {
  font-weight: bold;
}
</style>
