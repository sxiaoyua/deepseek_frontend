<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择AI模型"
    width="500px"
  >
    <div class="model-selection">
      <p class="model-description">请选择适合您需求的AI模型：</p>
      
      <h4>文本模型</h4>
      <el-radio-group v-model="selectedModelValue" class="model-group">
        <el-radio 
          v-for="model in textModels" 
          :key="model.id" 
          :value="model.id"
          class="model-radio"
        >
          {{ model.name }} 
          <span class="model-info">{{ model.description }}</span>
        </el-radio>
      </el-radio-group>
      
      <h4>多模态模型（支持图像）</h4>
      <el-radio-group v-model="selectedModelValue" class="model-group">
        <el-radio 
          v-for="model in imageModels" 
          :key="model.id" 
          :value="model.id"
          class="model-radio"
        >
          {{ model.name }}
          <span class="model-info">{{ model.description }}</span>
        </el-radio>
      </el-radio-group>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="confirm" :loading="loading">
          确认
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  selected: {
    type: String,
    default: ''
  },
  textModels: {
    type: Array,
    default: () => []
  },
  imageModels: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'update:selected', 'confirm', 'load']);

// 对话框可见状态的本地副本
const dialogVisible = ref(props.visible);

// 被选中模型的本地副本
const selectedModelValue = ref(props.selected);

// 当props.visible变化时，更新本地状态
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
});

// 当dialogVisible变化时，向父组件发送更新事件
watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
});

// 当props.selected变化时，更新本地状态
watch(() => props.selected, (newValue) => {
  selectedModelValue.value = newValue;
});

// 当selectedModelValue变化时，向父组件发送更新事件
watch(selectedModelValue, (newValue) => {
  emit('update:selected', newValue);
});

// 关闭对话框
const close = () => {
  dialogVisible.value = false;
};

// 确认选择
const confirm = () => {
  emit('confirm');
};

// 当对话框打开时，如果模型列表为空，则加载模型
watch(dialogVisible, (newValue) => {
  if (newValue && props.textModels.length === 0 && props.imageModels.length === 0) {
    emit('load');
  }
});
</script>

<style scoped>
.model-selection {
  padding: 10px 0;
}

.model-description {
  margin-bottom: 20px;
  color: #606266;
}

.model-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.model-radio {
  display: block;
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.model-radio:hover {
  background-color: #f5f7fa;
}

.model-info {
  display: block;
  margin-left: 24px;
  color: #909399;
  font-size: 0.9em;
  margin-top: 3px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 