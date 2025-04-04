import { defineStore } from 'pinia';
import axios from 'axios';

// 设置基础URL
const API_URL = 'https://deepseek-backend-5u48.onrender.com/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user
  },
  
  actions: {
    // 设置请求头中的认证令牌
    setAuthHeader() {
      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      } else {
        delete axios.defaults.headers.common['Authorization'];
      }
    },
    
    // 保存令牌到本地存储和状态
    saveToken(token) {
      this.token = token;
      localStorage.setItem('token', token);
      this.setAuthHeader();
    },
    
    // 清除令牌和用户信息
    clearAuth() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    },
    
    // 注册新用户
    async register(userData) {
      window.eventBus.showLoading('正在处理请求...');
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_URL}/auth/register`, userData);
        this.saveToken(response.data.token);
        this.user = response.data.user;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '注册失败';
        throw error;
      } finally {
        this.loading = false;
        window.eventBus.hideLoading();
      }
    },
    
    // 用户登录
    async login(credentials) {
      window.eventBus.showLoading('登录中...');
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        this.saveToken(response.data.token);
        this.user = response.data.user;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '登录失败';
        throw error;
      } finally {
        this.loading = false;
        window.eventBus.hideLoading();
      }
    },
    
    // 邮箱验证码登录
    async loginWithCode(data) {
      window.eventBus.showLoading('正在处理请求...');
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_URL}/auth/login-with-code`, data);
        this.saveToken(response.data.token);
        this.user = response.data.user;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '验证码登录失败';
        throw error;
      } finally {
        this.loading = false;
        window.eventBus.hideLoading();
      }
    },
    
    // 发送验证码
    async sendVerificationCode(data) {
      window.eventBus.showLoading('正在处理请求...');
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_URL}/auth/send-verification`, data);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '发送验证码失败';
        throw error;
      } finally {
        this.loading = false;
        window.eventBus.hideLoading();
      }
    },
    
    // 忘记密码
    async forgotPassword(data) {
      window.eventBus.showLoading('正在处理请求...');
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_URL}/auth/forgot-password`, data);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '重置密码请求失败';
        throw error;
      } finally {
        this.loading = false;
        window.eventBus.hideLoading();
      }
    },
    
    // 重置密码
    async resetPassword(data) {
      window.eventBus.showLoading('正在处理请求...');
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_URL}/auth/reset-password`, data);
        this.saveToken(response.data.token);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '重置密码失败';
        throw error;
      } finally {
        this.loading = false;
        window.eventBus.hideLoading();
      }
    },
    
    // 获取当前用户信息
    async fetchCurrentUser() {
      // 如果没有令牌，不进行请求
      if (!this.token) return;
      
      window.eventBus.showLoading('正在获取用户信息...');
      this.loading = true;
      this.error = null;
      this.setAuthHeader();
      
      try {
        const response = await axios.get(`${API_URL}/auth/me`);
        this.user = response.data.user;
        return response.data;
      } catch (error) {
        // 如果令牌无效，清除认证状态
        if (error.response?.status === 401) {
          this.clearAuth();
        }
        this.error = error.response?.data?.message || '获取用户信息失败';
        throw error;
      } finally {
        this.loading = false;
        window.eventBus.hideLoading();
      }
    },
    
    // 用户登出
    logout() {
      this.clearAuth();
    }
  }
});
