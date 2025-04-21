<template>
  <div class="chat-container">
    <!-- 侧边栏 -->
    <ChatSidebar
      :collapsed="sidebarCollapsed"
      :conversations="conversationList"
      :active-id="currentConversation?._id"
      :username="user?.username"
      :user-avatar="userAvatar"
      :user-initials="userInitials"
      @toggle="toggleSidebar"
      @select="selectConversation"
      @action="handleAction"
      @create="createNewConversation"
      @profile="goToProfile"
    />

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部导航栏 -->
      <ChatHeader
        :sidebar-collapsed="sidebarCollapsed"
        :title="currentConversation?.title"
        :has-conversation="!!currentConversation"
        @toggle-sidebar="toggleSidebar"
        @export="openExportDialog"
      />

      <!-- 消息区域 -->
      <div class="message-container" ref="messageContainer">
        <ChatMessageList
          :messages="currentMessages"
          :is-empty="!currentConversation || currentMessages.length === 0"
          :typing-indicator="typingIndicator && !conversationStore.isStreaming"
          :sample-questions="sampleQuestions"
          :user="user"
          :user-avatar="userAvatar"
          :ai-avatar="aiAvatar"
          :streaming-message="conversationStore.streamingMessage"
          ref="messageList"
          @select-question="sendSampleQuestion"
        />
      </div>

      <!-- 输入区域 -->
      <ChatInputArea
        :message="messageInput"
        @update:message="messageInput = $event"
        :sending="sending"
        :image-attached="imageAttached"
        :image-url="imageUrl"
        :is-uploading="isUploading"
        :upload-progress="uploadProgress"
        :supports-images="supportsImages"
        @send="sendMessage"
        @image-change="handleImageChange"
        @remove-image="removeImage"
        @model-select="openModelSelect"
      />
    </div>

    <!-- 对话管理组件 -->
    <ConversationManager
      ref="conversationManager"
      @rename="handleRename"
      @delete="confirmDeleteConversation"
      @export="exportConversation"
    />
    
    <!-- 模型选择对话框 -->
    <ModelSelector
      :visible="modelSelectVisible"
      @update:visible="modelSelectVisible = $event"
      :selected="selectedModel"
      @update:selected="selectedModel = $event"
      :text-models="textModels"
      :image-models="imageModels"
      :loading="changingModel"
      @confirm="confirmModelSelect"
      @load="loadModels"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useConversationStore } from '../stores/conversation';
import { ElMessage } from 'element-plus';
import { exportAndDownload } from '../utils/exportUtils';

// 导入组件
import ConversationManager from '../components/ConversationManager.vue';
import ChatSidebar from '../components/ChatSidebar.vue';
import ChatHeader from '../components/ChatHeader.vue';
import ChatMessageList from '../components/ChatMessageList.vue';
import ChatInputArea from '../components/ChatInputArea.vue';
import ModelSelector from '../components/ModelSelector.vue';
import MessageBubble from '../components/MessageBubble.vue';

const router = useRouter();
const authStore = useAuthStore();
const conversationStore = useConversationStore();
const messageList = ref(null);

// 用户信息
const user = computed(() => authStore.currentUser);
const userAvatar = computed(() => user.value?.avatar || '');
const userInitials = computed(() => {
  return user.value?.username ? user.value.username.charAt(0).toUpperCase() : '';
});

// 侧边栏状态
const sidebarCollapsed = ref(false);
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

// 消息输入和发送
const messageInput = ref('');
const sending = ref(false);
const typingIndicator = ref(false);
const messageContainer = ref(null);

// 图像上传状态
const imageAttached = ref(false);
const imageUrl = ref('');
const imageFile = ref(null);
const uploadProgress = ref(0);
const isUploading = ref(false);
const WORKER_URL = import.meta.env.VITE_WORKER_URL; // 使用环境变量

// 模型选择状态
const modelSelectVisible = ref(false);
const selectedModel = ref('');
const changingModel = ref(false);
const supportsImages = computed(() => conversationStore.supportsImages);

// 模型分类 - 这些数据会在初始化时从后端加载
const textModels = ref([]);
const imageModels = ref([]);

// 对话数据
const conversationList = computed(() => conversationStore.conversations);
const currentConversation = computed(() => conversationStore.currentConversation);
const currentMessages = computed(() => currentConversation.value?.messages || []);

// 对话管理组件引用
const conversationManager = ref(null);

// 示例问题
const sampleQuestions = [
  '介绍一下中国的四大发明',
  '帮我写一首关于春天的诗',
  '解释一下量子计算原理',
  '如何使用Python实现快速排序?'
];

// AI头像
const aiAvatar = ref('/favicon.svg'); // 使用项目的favicon.svg作为AI头像

// 滚动到底部
const scrollToBottom = () => {
  if (messageList.value) {
    messageList.value.scrollToBottom();
  }
};

// 创建新对话
const createNewConversation = async () => {
  try {
    await conversationStore.createConversation();
    ElMessage.success('新对话创建成功');
  } catch (error) {
    console.error('创建新对话失败:', error);
    ElMessage.error('创建新对话失败，请重试');
  }
};

// 选择对话
const selectConversation = async (id) => {
  try {
    await conversationStore.getConversation(id);
    scrollToBottom();
  } catch (error) {
    console.error('获取对话详情失败:', error);
    ElMessage.error('加载对话失败，请重试');
  }
};

// 发送示例问题
const sendSampleQuestion = (question) => {
  messageInput.value = question;
  if (!currentConversation.value) {
    // 如果没有当前对话，先创建一个新对话，然后等待创建完成后再发送消息
    createNewConversation().then(() => {
      // 确保对话创建成功后再发送
      sendMessage();
    }).catch(error => {
      console.error('创建新对话失败:', error);
      ElMessage.error('创建新对话失败，请重试');
    });
  } else {
    // 如果已有当前对话，直接发送
    sendMessage();
  }
};

// 发送消息
const sendMessage = async () => {
  if ((!messageInput.value.trim() && !imageAttached.value) || sending.value) return;
  
  // 如果正在上传图片，提示等待上传完成
  if (isUploading.value) {
    ElMessage.warning('请等待图片上传完成');
    return;
  }
  
  const message = messageInput.value.trim();
  messageInput.value = '';
  
  // 检查是否需要创建新对话
  const isNewConversation = !currentConversation.value;
  
  // 如果是新对话且没有图片附件，先创建新对话
  if (isNewConversation && !imageAttached.value) {
    try {
      await createNewConversation();
    } catch (error) {
      console.error('创建新对话失败:', error);
      ElMessage.error('创建对话失败，请重试');
      return; // 如果创建失败，中止发送
    }
  }
  
  sending.value = true;
  typingIndicator.value = true;
  
  // 构建用户消息对象
  const userMessage = {
    role: 'user',
    content: imageAttached.value ? (message ? [
      { type: 'text', text: message },
      { type: 'image_url', image_url: { url: imageUrl.value } }
    ] : [
      { type: 'image_url', image_url: { url: imageUrl.value } }
    ]) : message,
    timestamp: new Date()
  };
  
  // 提前将用户消息添加到对话中，立即更新UI
  if (currentConversation.value) {
    // 如果没有messages数组，创建一个
    if (!currentConversation.value.messages) {
      currentConversation.value.messages = [];
    }
    
    // 添加用户消息到当前对话
    currentConversation.value.messages.push(userMessage);
    
    // 立即滚动到底部显示新消息
    nextTick(() => {
      scrollToBottom();
    });
  }
  
  try {
    const options = {
      content: message
    };
    
    // 如果有图片附件，添加到选项中
    if (imageAttached.value && imageUrl.value) {
      options.imageUrl = imageUrl.value;
      
      // 图片发送后清除
      removeImage();
    }
    
    const response = await conversationStore.sendMessage(options);
    
    // 如果不是流式响应，执行传统更新流程
    if (!conversationStore.isStreaming) {
      // 获取会话ID，无论是新建还是已有的
      if (response?.data && response.data.conversationId) {
        const conversationId = response.data.conversationId;
        
        try {
          // 确保获取最新的对话信息
          await conversationStore.getConversation(conversationId);
          
          // 如果对话只有两条消息（用户发送的第一条和AI的回复），则更新标题
          if (currentConversation.value && currentConversation.value.messages && 
              currentConversation.value.messages.length <= 2) {
            
            // 将消息内容截断为合适长度作为标题
            let titleFromContent = message.trim() || '图片对话';
            if (titleFromContent.length > 30) {
              titleFromContent = titleFromContent.substring(0, 30) + '...';
            }
            
            if (titleFromContent) {
              try {
                await conversationStore.updateConversation(conversationId, { 
                  title: titleFromContent 
                });
              } catch (titleError) {
                console.error('更新标题失败:', titleError);
              }
            }
          }
        } catch (convError) {
          console.error('获取对话信息失败:', convError);
        }
      }
    } else {
      // 流式响应 - 只处理标题更新，不额外获取对话详情
      console.log('流式响应中，跳过对话详情刷新');
      // 如果是新建的对话（消息只有一条用户输入），设置标题
      if (currentConversation.value && currentConversation.value.messages && 
          currentConversation.value.messages.length === 1) {
        
        const conversationId = currentConversation.value._id;
        let titleFromContent = message.trim() || '图片对话';
        if (titleFromContent.length > 30) {
          titleFromContent = titleFromContent.substring(0, 30) + '...';
        }
        
        if (titleFromContent && conversationId) {
          try {
            await conversationStore.updateConversation(conversationId, { 
              title: titleFromContent 
            });
          } catch (titleError) {
            console.error('更新标题失败:', titleError);
          }
        }
      }
    }
    
    scrollToBottom();
  } catch (error) {
    console.error('发送消息失败:', error);
    ElMessage.error(error.response?.data?.message || '发送消息失败，请重试');
    
    // 如果发送失败，可以考虑从对话中移除之前添加的用户消息
    // 或者添加一个标记，表示发送失败
  } finally {
    // 只有在非流式响应时才设置这些状态
    if (!conversationStore.isStreaming) {
      sending.value = false;
      typingIndicator.value = false;
    }
  }
};

// 处理对话操作
const handleAction = (command, conversationId) => {
  if (command === 'rename') {
    // 打开重命名对话框
    if (conversationManager.value) {
      const conversation = conversationList.value.find(c => c._id === conversationId);
      conversationManager.value.openRenameDialog(conversation);
    }
  } else if (command === 'delete') {
    // 打开删除确认对话框
    if (conversationManager.value) {
      conversationManager.value.openDeleteDialog(conversationId);
    }
  } else if (command === 'export') {
    // 打开导出对话框
    if (conversationManager.value) {
      conversationManager.value.openExportDialog(conversationId);
    }
  }
};

// 重命名对话
const handleRename = async ({ id, title }) => {
  try {
    await conversationStore.updateConversation(id, { title });
    ElMessage.success('对话重命名成功');
  } catch (error) {
    console.error('重命名对话失败:', error);
    ElMessage.error('重命名对话失败，请重试');
  }
};

// 确认删除对话
const confirmDeleteConversation = async (id) => {
  try {
    await conversationStore.deleteConversation(id);
    ElMessage.success('对话已删除');
    
    // 如果删除的是当前对话，创建一个新对话
    if (currentConversation.value && currentConversation.value._id === id) {
      if (conversationList.value.length > 0) {
        await selectConversation(conversationList.value[0]._id);
      } else {
        await createNewConversation();
      }
    }
  } catch (error) {
    console.error('删除对话失败:', error);
    ElMessage.error('删除对话失败，请重试');
  }
};

// 导出对话
const exportConversation = async ({ id, format }) => {
  try {
    // 如果不是当前对话，需要先获取完整对话
    let conversation = currentConversation.value;
    if (id !== currentConversation.value?._id) {
      conversation = await conversationStore.getFullConversation(id);
    }
    
    if (!conversation) {
      throw new Error('对话不存在');
    }
    
    const success = exportAndDownload(conversation, format);
    if (success) {
      ElMessage.success('对话导出成功');
    } else {
      throw new Error('导出失败');
    }
  } catch (error) {
    console.error('导出对话失败:', error);
    ElMessage.error('导出对话失败，请重试');
  }
};

// 打开导出对话框
const openExportDialog = () => {
  if (!currentConversation.value) {
    ElMessage.warning('请先创建或选择一个对话');
    return;
  }
  
  if (conversationManager.value) {
    conversationManager.value.openExportDialog(currentConversation.value._id);
  }
};

// 前往个人资料页
const goToProfile = () => {
  router.push('/profile');
};

// 处理图片上传
const handleImageChange = (file) => {
  if (!file) return;
  
  // 检查文件类型
  const isImage = file.raw.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('请上传图片文件');
    return;
  }
  
  // 检查文件格式
  const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const isAllowedFormat = allowedFormats.includes(file.raw.type);
  if (!isAllowedFormat) {
    ElMessage.error('只支持JPG、PNG和WEBP格式的图片');
    return;
  }
  
  // 检查文件大小（限制为5MB）
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB');
    return;
  }
  
  // 读取图片并显示预览
  const reader = new FileReader();
  reader.onload = (e) => {
    imageUrl.value = e.target.result;
    imageAttached.value = true;
    imageFile.value = file.raw;
  };
  reader.readAsDataURL(file.raw);
  
  // 上传图片到服务器
  uploadImage(file.raw);
};

// 上传图片到服务器
const uploadImage = (file) => {
  isUploading.value = true;
  uploadProgress.value = 0;
  
  const formData = new FormData();
  formData.append('file', file);
  
  const xhr = new XMLHttpRequest();
  
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      uploadProgress.value = Math.round((e.loaded / e.total) * 100);
    }
  };
  
  xhr.onload = () => {
    isUploading.value = false;
    
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText);
        // 使用代理URL而不是原始URL
        imageUrl.value = response.url;
        ElMessage.success('图片上传成功');
      } catch (error) {
        ElMessage.error('解析响应失败');
        console.error('上传响应解析失败:', error);
      }
    } else {
      ElMessage.error('图片上传失败');
      console.error('上传失败:', xhr.statusText);
    }
  };
  
  xhr.onerror = () => {
    isUploading.value = false;
    ElMessage.error('上传过程中发生错误');
    console.error('上传错误');
  };
  
  xhr.open('POST', WORKER_URL, true);
  xhr.send(formData);
};

// 移除已上传的图片
const removeImage = () => {
  imageAttached.value = false;
  imageUrl.value = '';
  imageFile.value = null;
  uploadProgress.value = 0;
  isUploading.value = false;
};

// 打开模型选择对话框
const openModelSelect = async () => {
  modelSelectVisible.value = true;
  selectedModel.value = conversationStore.currentModel || '';
};

// 加载模型列表
const loadModels = async () => {
  try {
    const response = await conversationStore.getModels();
    const { available, capabilities } = response.data;
    
    // 将模型分为文本模型和图像模型
    textModels.value = [];
    imageModels.value = [];
    
    // 处理后端返回的模型数据
    if (available) {
      if (available.textModels && Array.isArray(available.textModels)) {
        textModels.value = available.textModels;
      }
      
      if (available.multimodalModels && Array.isArray(available.multimodalModels)) {
        imageModels.value = available.multimodalModels;
      }
    }
    
    // 如果当前没有选择模型，使用第一个文本模型
    if (!selectedModel.value && textModels.value.length > 0) {
      selectedModel.value = textModels.value[0].id;
    }
  } catch (error) {
    console.error('加载模型列表失败:', error);
    throw error;
  }
};

// 确认选择的模型
const confirmModelSelect = async () => {
  if (!selectedModel.value) {
    ElMessage.warning('请选择一个模型');
    return;
  }
  
  changingModel.value = true;
  
  try {
    await conversationStore.setModel(selectedModel.value);
    ElMessage.success('模型设置成功');
    modelSelectVisible.value = false;
  } catch (error) {
    console.error('设置模型失败:', error);
    ElMessage.error('设置模型失败，请重试');
  } finally {
    changingModel.value = false;
  }
};

// 组件挂载时获取对话列表和模型
onMounted(async () => {
  try {
    await conversationStore.getConversations();
    await loadModels();
    
    // 如果有对话，选择第一个
    if (conversationList.value.length > 0) {
      await selectConversation(conversationList.value[0]._id);
    }
  } catch (error) {
    console.error('初始化失败:', error);
    ElMessage.error('加载数据失败，请刷新页面重试');
  }
});

// 监听对话变化，自动滚动到底部
watch(currentMessages, () => {
  scrollToBottom();
});

// 监听流式消息变化，自动滚动到底部
watch(() => conversationStore.streamingMessage, () => {
  scrollToBottom();
}, { deep: true });

// 监听流式状态变化，当流结束时重置加载指示器
watch(() => conversationStore.isStreaming, (isStreaming) => {
  // 当流式响应结束时
  if (!isStreaming && typingIndicator.value) {
    // 重置加载指示器和发送状态
    sending.value = false;
    typingIndicator.value = false;
  }
}, { immediate: true });

// 在组件卸载时取消可能存在的流式响应
onUnmounted(() => {
  if (conversationStore.isStreaming) {
    conversationStore.cancelStreamResponse();
  }
});
</script>

<style scoped>
.chat-container {
  display: flex;
  height: calc(100vh - 72px); /* 减去导航栏高度 */
  width: 100%;
  position: relative;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 消息区域样式 */
.message-container {
  flex: 1;
  overflow: hidden;
  background-color: #fff;
  display: flex;
  justify-content: center;
}
</style>
