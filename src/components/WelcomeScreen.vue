<template>
  <div class="welcome-screen">
    <div class="welcome-content">
      <h2>欢迎使用 DeepSeek AI</h2>
      <p>您可以询问任何问题，或开始一个新对话</p>
      <div class="sample-questions">
        <div 
          v-for="(question, index) in questions" 
          :key="index" 
          class="sample-question" 
          @click="$emit('select-question', question)"
        >
          <el-icon><ChatLineRound /></el-icon>
          <span>{{ question }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ChatLineRound } from '@element-plus/icons-vue';

defineProps({
  questions: {
    type: Array,
    default: () => []
  }
});

defineEmits(['select-question']);
</script>

<style scoped>
.welcome-screen {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.welcome-content {
  max-width: 600px;
  text-align: center;
}

.welcome-content h2 {
  margin-bottom: 10px;
  color: #303133;
}

.welcome-content p {
  margin-bottom: 30px;
  color: #606266;
}

.sample-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
}

.sample-question {
  background-color: #f5f7fa;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.sample-question:hover {
  background-color: #ecf5ff;
}
</style> 