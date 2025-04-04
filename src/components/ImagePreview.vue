<template>
  <div class="image-preview">
    <img :src="url" alt="预览图片" />
    <el-button type="danger" size="small" circle class="remove-image" @click="$emit('remove')">
      <el-icon><Delete /></el-icon>
    </el-button>
    
    <div v-if="uploading" class="upload-progress">
      <el-progress :percentage="progress" :show-text="false" />
      <span class="progress-text">{{ progress }}%</span>
    </div>
  </div>
</template>

<script setup>
import { Delete } from '@element-plus/icons-vue';

defineProps({
  url: {
    type: String,
    required: true
  },
  uploading: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  }
});

defineEmits(['remove']);
</script>

<style scoped>
.image-preview {
  margin-top: 10px;
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.image-preview img {
  max-width: 300px;
  max-height: 200px;
  border-radius: 4px;
  border: 1px solid #e6e6e6;
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 1;
}

/* 上传进度条样式 */
.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 5px 10px;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

.progress-text {
  color: #fff;
  font-size: 12px;
  text-align: center;
  display: block;
  margin-top: 2px;
}

@media (max-width: 768px) {
  .image-preview img {
    max-width: 200px;
    max-height: 150px;
  }
}
</style> 