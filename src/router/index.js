import { createRouter, createWebHistory } from 'vue-router';

// 组件懒加载
const Home = () => import('../views/Home.vue');
const Login = () => import('../views/Login.vue');
const Register = () => import('../views/Register.vue');
const Chat = () => import('../views/Chat.vue');
const Profile = () => import('../views/Profile.vue');
const ForgotPassword = () => import('../views/ForgotPassword.vue');

// 路由守卫 - 检查本地存储中是否有token
const requireAuth = (to, from, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    next();
  } else {
    next('/login');
  }
};

// 已登录用户的路由守卫 - 如果已登录则跳转到首页
const redirectIfLoggedIn = (to, from, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    next('/chat');  // 已登录用户跳转到聊天页面
  } else {
    next();
  }
};

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    beforeEnter: redirectIfLoggedIn
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    beforeEnter: redirectIfLoggedIn
  },
  {
    path: '/forgot-password',
    name: 'forgotPassword',
    component: ForgotPassword,
    beforeEnter: redirectIfLoggedIn
  },
  {
    path: '/chat',
    name: 'chat',
    component: Chat,
    beforeEnter: requireAuth
  },
  {
    path: '/chat/:id',
    name: 'chatDetail',
    component: Chat,
    beforeEnter: requireAuth
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    beforeEnter: requireAuth
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局导航守卫，确保每次路由变化时检查认证状态
router.beforeEach(async (to, from, next) => {
  // 显示加载指示器
  if (window.eventBus) {
    window.eventBus.showLoading('页面加载中...');
  }
  
  // 这里可以添加全局路由逻辑，比如加载用户信息等
  next();
});

// 添加全局后置钩子，在路由导航完成后隐藏加载指示器
router.afterEach(() => {
  // 延迟一点以确保组件已经渲染，体验更好
  setTimeout(() => {
    if (window.eventBus) {
      window.eventBus.hideLoading();
    }
  }, 300);
});

export default router;
