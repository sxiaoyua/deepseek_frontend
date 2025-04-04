<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>登录 DeepSeek</h2>
        <p>欢迎回来！请登录您的账号</p>
      </div>

      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="密码登录" name="password">
          <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" @submit.prevent="handlePasswordLogin">
            <el-form-item prop="email">
              <el-input v-model="passwordForm.email" placeholder="邮箱" prefix-icon="el-icon-message">
                <template #prefix>
                  <el-icon><Message /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="passwordForm.password" type="password" placeholder="密码" show-password>
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <div class="forgot-password">
              <router-link to="/forgot-password">忘记密码？</router-link>
            </div>
            <el-form-item>
              <el-button type="primary" :loading="loading" class="login-button" @click="handlePasswordLogin">登录</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="验证码登录" name="code">
          <el-form ref="codeFormRef" :model="codeForm" :rules="codeRules" @submit.prevent="handleCodeLogin">
            <el-form-item prop="email">
              <el-input v-model="codeForm.email" placeholder="邮箱" prefix-icon="el-icon-message">
                <template #prefix>
                  <el-icon><Message /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="code">
              <el-input v-model="codeForm.code" placeholder="验证码">
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
                <template #append>
                  <el-button :disabled="isSending" @click="sendVerificationCode">
                    {{ sendButtonText }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" class="login-button" @click="handleCodeLogin">登录</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="login-footer">
        <p>还没有账号？<router-link to="/register">立即注册</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { Message, Lock, Key } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();

// 标签页状态
const activeTab = ref('password');

// 加载状态
const loading = computed(() => authStore.loading);

// 表单引用
const passwordFormRef = ref(null);
const codeFormRef = ref(null);

// 密码登录表单
const passwordForm = reactive({
  email: '',
  password: ''
});

// 验证码登录表单
const codeForm = reactive({
  email: '',
  code: ''
});

// 验证规则
const passwordRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ]
};

const codeRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度应为6位', trigger: 'blur' }
  ]
};

// 验证码发送状态
const isSending = ref(false);
const countdown = ref(0);
const sendButtonText = computed(() => {
  return isSending.value ? `重新发送(${countdown.value}s)` : '获取验证码';
});

// 发送验证码
const sendVerificationCode = async () => {
  if (isSending.value) return;
  
  if (!codeForm.email) {
    ElMessage.warning('请先输入邮箱');
    return;
  }
  
  try {
    isSending.value = true;
    await authStore.sendVerificationCode({
      email: codeForm.email,
      type: 'login'
    });
    
    ElMessage.success('验证码已发送，请查收邮件');
    
    // 倒计时
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
        isSending.value = false;
      }
    }, 1000);
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '发送验证码失败');
    isSending.value = false;
  }
};

// 密码登录
const handlePasswordLogin = async () => {
  if (!passwordFormRef.value) return;
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await authStore.login(passwordForm);
        ElMessage.success('登录成功');
        router.push('/');
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '登录失败');
      }
    }
  });
};

// 验证码登录
const handleCodeLogin = async () => {
  if (!codeFormRef.value) return;
  
  await codeFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await authStore.loginWithCode(codeForm);
        ElMessage.success('登录成功');
        router.push('/');
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '登录失败');
      }
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.login-box {
  width: 400px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.login-header p {
  color: #909399;
  font-size: 14px;
}

.login-tabs {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
}

.forgot-password {
  text-align: right;
  margin-bottom: 20px;
  font-size: 14px;
}

.forgot-password a {
  color: #409eff;
  text-decoration: none;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #606266;
}

.login-footer a {
  color: #409eff;
  text-decoration: none;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .login-box {
    width: 90%;
    padding: 20px;
  }
}
</style>
