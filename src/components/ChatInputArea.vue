<template>
  <div class="input-container">
    <el-input
      v-model="messageValue"
      type="textarea"
      :rows="3"
      placeholder="输入您的问题..."
      resize="none"
      @keydown.enter.prevent="$emit('send')"
    />
    <div class="input-actions">
      <!-- 图片上传按钮，仅当模型支持图像时显示 -->
      <el-tooltip content="上传图片" placement="top" v-if="supportsImages">
        <template #default>
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            accept="image/*"
          >
            <el-button type="primary" plain>
              <el-icon><Picture /></el-icon>
            </el-button>
          </el-upload>
        </template>
      </el-tooltip>
      
      <!-- 模型选择按钮 -->
      <el-tooltip content="选择AI模型" placement="top">
        <template #default>
          <el-button type="primary" plain @click="$emit('model-select')">
            <el-icon><Connection /></el-icon>
          </el-button>
        </template>
      </el-tooltip>
      
      <el-button 
        type="primary" 
        :disabled="isDisabled || sending" 
        @click="$emit('send')"
      >
        <el-icon v-if="sending"><Loading /></el-icon>
        <span>发送</span>
      </el-button>
    </div>
    
    <ImagePreview 
      v-if="imageAttached" 
      :url="imageUrl"
      :uploading="isUploading"
      :progress="uploadProgress"
      @remove="$emit('remove-image')"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Picture, Connection, Loading } from '@element-plus/icons-vue';
import ImagePreview from './ImagePreview.vue';

const props = defineProps({
  message: {
    type: String,
    default: ''
  },
  sending: {
    type: Boolean,
    default: false
  },
  imageAttached: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: ''
  },
  isUploading: {
    type: Boolean,
    default: false
  },
  uploadProgress: {
    type: Number,
    default: 0
  },
  supportsImages: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:message', 'send', 'image-change', 'remove-image', 'model-select']);

// 创建本地变量并实现双向绑定
const messageValue = ref(props.message);

// 监听props变化，更新本地变量
watch(() => props.message, (newValue) => {
  messageValue.value = newValue;
});

// 监听本地变量变化，向父组件发送更新事件
watch(messageValue, (newValue) => {
  emit('update:message', newValue);
});

// 计算发送按钮是否禁用
const isDisabled = computed(() => {
  return !messageValue.value.trim() && !props.imageAttached;
});

// 处理文件上传
const handleFileChange = (file) => {
  emit('image-change', file);
};
</script>

<style scoped>
.input-container {
  padding: 15px;
  border-top: 1px solid #e6e6e6;
  background-color: #fff;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  gap: 10px;
}
</style> 