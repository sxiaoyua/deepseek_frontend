<template>
  <div class="home-container">
    <header class="home-header">
      <div class="logo-container">
        <h1 class="logo">DeepSeek</h1>
      </div>
      <div class="header-actions" v-if="!isAuthenticated">
        <el-button type="primary" @click="goToLogin">登录</el-button>
        <el-button @click="goToRegister">注册</el-button>
      </div>
      <div class="user-info" v-else>
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="user-dropdown-link">
            <el-avatar :size="32" :src="user?.avatar">{{ userInitials }}</el-avatar>
            <span>{{ user?.username }}</span>
            <el-icon><CaretBottom /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="chat">开始聊天</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="home-content">
      <div class="hero-section">
        <div class="hero-text">
          <h1>体验 DeepSeek AI</h1>
          <h2>专为中文用户打造的智能聊天体验</h2>
          <p>DeepSeek 是一款基于先进大语言模型的AI聊天应用，可以回答您的问题、提供创意灵感、解决复杂问题，更好地满足您的需求。</p>
          <div class="hero-actions">
            <el-button type="primary" size="large" class="start-button" @click="goToChat">开始聊天</el-button>
            <el-button size="large" @click="scrollToFeatures">了解更多</el-button>
          </div>
        </div>
        <div class="hero-image">
          <img src="../assets/hero-image.svg" alt="DeepSeek AI" />
        </div>
      </div>

      <div class="features-section" ref="featuresSection">
        <h2>DeepSeek 的核心功能</h2>
        <div class="features-grid">
          <div class="feature-card">
            <el-icon class="feature-icon"><ChatLineRound /></el-icon>
            <h3>智能对话</h3>
            <p>通过自然语言与 AI 进行流畅对话，获得有见解的回答和建议。</p>
          </div>
          <div class="feature-card">
            <el-icon class="feature-icon"><Document /></el-icon>
            <h3>知识查询</h3>
            <p>快速查询、总结和获取各种领域的专业知识和信息。</p>
          </div>
          <div class="feature-card">
            <el-icon class="feature-icon"><Edit /></el-icon>
            <h3>创意写作</h3>
            <p>获取写作灵感、内容创作帮助、文本优化和翻译等。</p>
          </div>
          <div class="feature-card">
            <el-icon class="feature-icon"><Notification /></el-icon>
            <h3>个性化体验</h3>
            <p>根据您的偏好调整 AI 助手，创建专属于您的智能体验。</p>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>体验 DeepSeek 的强大能力</h2>
        <div class="demo-content">
          <div class="demo-examples">
            <div class="example-card">
              <h3>问答能力</h3>
              <div class="example-item">
                <div class="example-question">什么是量子计算？</div>
                <div class="example-answer">量子计算是利用量子力学原理进行信息处理的计算方式。与传统计算机使用比特（0或1）不同，量子计算机使用量子比特，可以同时处于多种状态，这使得它们能够以指数级的速度解决特定问题。</div>
              </div>
            </div>
            <div class="example-card">
              <h3>创意写作</h3>
              <div class="example-item">
                <div class="example-question">写一首关于春天的短诗</div>
                <div class="example-answer">春风轻抚面，<br>花香满园间。<br>新绿染山野，<br>生机遍人间。</div>
              </div>
            </div>
            <div class="example-card">
              <h3>专业知识</h3>
              <div class="example-item">
                <div class="example-question">解释一下区块链技术的基本原理</div>
                <div class="example-answer">区块链是一种分布式账本技术，通过密码学原理保证数据安全。它将交易数据打包成区块，并通过哈希算法链接形成不可篡改的链式结构。共识机制确保网络中的所有节点就账本状态达成一致，无需中央权威。</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="home-footer">
      <div class="footer-content">
        <div class="footer-logo">
          <h2>DeepSeek</h2>
          <p>智能对话，无限可能</p>
        </div>
        <div class="footer-links">
          <div class="footer-column">
            <h3>产品</h3>
            <ul>
              <li><a href="#features">功能</a></li>
              <li><a href="#demo">演示</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h3>资源</h3>
            <ul>
              <li><a href="#">博客</a></li>
              <li><a href="#">文档</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h3>关于我们</h3>
            <ul>
              <li><a href="#">团队</a></li>
              <li><a href="#">联系我们</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; {{ new Date().getFullYear() }} DeepSeek AI. 保留所有权利。</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { 
  CaretBottom, 
  ChatLineRound, 
  Document, 
  Edit, 
  Notification 
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();
const featuresSection = ref(null);

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
const goToLogin = () => {
  router.push('/login');
};

const goToRegister = () => {
  router.push('/register');
};

const goToChat = () => {
  if (isAuthenticated.value) {
    router.push('/chat');
  } else {
    router.push('/login');
  }
};

// 滚动到功能区域
const scrollToFeatures = () => {
  if (featuresSection.value) {
    featuresSection.value.scrollIntoView({ behavior: 'smooth' });
  }
};
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.home-header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 15px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  color: #409eff;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.user-dropdown-link {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

/* 主内容区域样式 */
.home-content {
  flex: 1;
}

/* 英雄区域样式 */
.hero-section {
  display: flex;
  padding: 80px 40px;
  max-width: 1200px;
  margin: 0 auto;
  align-items: center;
  gap: 40px;
}

.hero-text {
  flex: 1;
}

.hero-text h1 {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.hero-text h2 {
  font-size: 32px;
  font-weight: normal;
  margin-bottom: 20px;
  color: #606266;
}

.hero-text p {
  font-size: 18px;
  line-height: 1.6;
  color: #606266;
  margin-bottom: 30px;
}

.hero-actions {
  display: flex;
  gap: 20px;
}

.start-button {
  padding: 16px 32px;
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-image img {
  max-width: 100%;
  height: auto;
}

/* 功能区域样式 */
.features-section {
  background-color: #f5f7fa;
  padding: 80px 40px;
  text-align: center;
}

.features-section h2 {
  font-size: 36px;
  margin-bottom: 40px;
  color: #303133;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 20px;
  color: #409eff;
}

.feature-card h3 {
  font-size: 20px;
  margin-bottom: 15px;
  color: #303133;
}

.feature-card p {
  color: #606266;
  line-height: 1.6;
}

/* 演示区域样式 */
.demo-section {
  padding: 80px 40px;
  text-align: center;
}

.demo-section h2 {
  font-size: 36px;
  margin-bottom: 40px;
  color: #303133;
}

.demo-content {
  max-width: 1200px;
  margin: 0 auto;
}

.demo-examples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.example-card {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 30px;
  text-align: left;
}

.example-card h3 {
  font-size: 20px;
  margin-bottom: 20px;
  color: #303133;
  text-align: center;
}

.example-item {
  margin-bottom: 20px;
}

.example-question {
  background-color: #ecf5ff;
  padding: 15px;
  border-radius: 8px 8px 0 0;
  color: #409eff;
  font-weight: bold;
}

.example-answer {
  background-color: #fff;
  padding: 15px;
  border-radius: 0 0 8px 8px;
  color: #606266;
  line-height: 1.6;
}

/* 页脚样式 */
.home-footer {
  background-color: #303133;
  color: #fff;
  padding-top: 60px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  padding: 0 40px 40px;
}

.footer-logo h2 {
  font-size: 24px;
  margin: 0 0 10px;
}

.footer-logo p {
  color: #c0c4cc;
}

.footer-links {
  display: flex;
  gap: 60px;
}

.footer-column h3 {
  font-size: 16px;
  margin-bottom: 20px;
}

.footer-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-column li {
  margin-bottom: 10px;
}

.footer-column a {
  color: #c0c4cc;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-column a:hover {
  color: #fff;
}

.footer-bottom {
  border-top: 1px solid #606266;
  padding: 20px 40px;
  text-align: center;
}

.footer-bottom p {
  margin: 0;
  color: #c0c4cc;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .hero-section {
    flex-direction: column;
    padding: 40px 20px;
  }
  
  .hero-text h1 {
    font-size: 36px;
  }
  
  .hero-text h2 {
    font-size: 24px;
  }
  
  .features-section,
  .demo-section {
    padding: 60px 20px;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 40px;
  }
  
  .footer-links {
    flex-wrap: wrap;
    gap: 30px;
  }
}

@media (max-width: 576px) {
  .home-header {
    padding: 15px 20px;
  }
  
  .hero-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .example-card {
    padding: 20px;
  }
}
</style>
