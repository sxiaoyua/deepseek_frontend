<template>
  <div class="app-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 使用导航栏组件 -->
    <Navbar v-if="showNavbar" />
    
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <!-- 全局加载指示器 -->
    <LoadingOverlay :visible="loading" :message="loadingMessage" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import Navbar from './components/Navbar.vue';
import LoadingOverlay from './components/LoadingOverlay.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 加载状态
const loading = ref(false);
const loadingMessage = ref('加载中...');

// 全局事件总线 - 用于控制加载状态
window.eventBus = window.eventBus || {
  showLoading: (message = '加载中...') => {
    loading.value = true;
    loadingMessage.value = message;
  },
  hideLoading: () => {
    loading.value = false;
  }
};

// 从用户设置中获取暗黑模式状态
const isDarkMode = computed(() => {
  return authStore.currentUser?.settings?.theme === 'dark';
});

// 判断是否显示导航栏（在特定路由下不显示）
const showNavbar = computed(() => {
  const noNavbarRoutes = ['/', '/login', '/register', '/forgot-password'];
  return !noNavbarRoutes.includes(route.path);
});

// 组件挂载时尝试获取当前用户信息
onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await authStore.fetchCurrentUser();
    } catch (error) {
      console.error('获取用户信息失败:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    }
  }
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  background-color: #f5f7fa;
}

.app-container {
  min-height: 100vh;
  transition: background-color 0.3s, color 0.3s;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  width: 100%;
  flex-direction: column;
}

.app-container.dark-mode {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
