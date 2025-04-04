<template>
  <header class="navbar">
    <div class="navbar-container">
      <div class="logo" @click="navigateTo('/')">
        <h1>DeepSeek</h1>
      </div>

      <div class="nav-links">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/chat" class="nav-link" v-if="isAuthenticated">聊天</router-link>
      </div>

      <div class="nav-actions">
        <template v-if="!isAuthenticated">
          <el-button type="primary" @click="navigateTo('/login')">登录</el-button>
          <el-button @click="navigateTo('/register')">注册</el-button>
        </template>
        <template v-else>
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-dropdown-link">
              <el-avatar :size="32" :src="user?.avatar">{{ userInitials }}</el-avatar>
              <span>{{ user?.username }}</span>
              <el-icon class="el-icon--right"><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="chat">开始聊天</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { CaretBottom } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();

// 用户信息
const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => authStore.currentUser);
const userInitials = computed(() => {
  return user.value?.username ? user.value.username.charAt(0).toUpperCase() : '';
});

// 导航和下拉菜单处理
const handleCommand = (command) => {
  if (command === 'profile') {
    router.push('/profile');
  } else if (command === 'chat') {
    router.push('/chat');
  } else if (command === 'logout') {
    authStore.logout();
    ElMessage.success('已成功退出登录');
    router.push('/');
  }
};

// 页面导航
const navigateTo = (path) => {
  router.push(path);
};
</script>

<style scoped>
.navbar {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 15px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo h1 {
  color: #409eff;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-link {
  color: #606266;
  text-decoration: none;
  font-size: 16px;
  transition: color 0.2s;
  padding: 5px 0;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #409eff;
}

.nav-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.user-dropdown-link {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-dropdown-link:hover {
  background-color: #f5f7fa;
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  
  .user-dropdown-link span {
    display: none;
  }
}
</style>
