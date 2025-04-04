<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <h2>注册 DeepSeek</h2>
        <p>创建您的账号，开始AI对话之旅</p>
      </div>

      <el-steps :active="currentStep" finish-status="success" simple class="register-steps">
        <el-step title="验证邮箱" />
        <el-step title="填写信息" />
        <el-step title="注册完成" />
      </el-steps>

      <!-- 步骤1：验证邮箱 -->
      <div v-show="currentStep === 0">
        <el-form ref="emailForm" :model="registerForm" :rules="emailRules">
          <el-form-item prop="email">
            <el-input v-model="registerForm.email" placeholder="请输入邮箱">
              <template #prefix>
                <el-icon><Message /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="code">
            <el-input v-model="registerForm.code" placeholder="验证码">
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
            <el-button type="primary" :loading="loading" class="register-button" @click="verifyEmailCode">下一步</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤2：填写信息 -->
      <div v-show="currentStep === 1">
        <el-form ref="userForm" :model="registerForm" :rules="userRules">
          <el-form-item prop="username">
            <el-input v-model="registerForm.username" placeholder="用户名">
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="registerForm.password" type="password" placeholder="密码" show-password>
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码" show-password>
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" class="register-button" @click="handleRegister">注册</el-button>
            <el-button class="register-button" @click="currentStep = 0">上一步</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤3：注册完成 -->
      <div v-show="currentStep === 2" class="success-step">
        <el-result icon="success" title="注册成功" sub-title="您已成功注册 DeepSeek 账号">
          <template #extra>
            <el-button type="primary" @click="goToHome">开始使用</el-button>
          </template>
        </el-result>
      </div>

      <div class="register-footer" v-show="currentStep < 2">
        <p>已有账号？<router-link to="/login">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { Message, Lock, Key, User } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();

// 注册步骤
const currentStep = ref(0);

// 加载状态
const loading = computed(() => authStore.loading);

// 注册表单
const registerForm = reactive({
  email: '',
  code: '',
  username: '',
  password: '',
  confirmPassword: ''
});

// 验证码发送状态
const isSending = ref(false);
const countdown = ref(0);
const sendButtonText = computed(() => {
  return isSending.value ? `重新发送(${countdown.value}s)` : '获取验证码';
});

// 验证邮箱的校验规则
const emailRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度应为6位', trigger: 'blur' }
  ]
};

// 用户信息的校验规则
const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 30, message: '用户名长度在3到30个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 发送验证码
const sendVerificationCode = async () => {
  if (isSending.value) return;
  
  if (!registerForm.email) {
    ElMessage.warning('请先输入邮箱');
    return;
  }
  
  try {
    isSending.value = true;
    await authStore.sendVerificationCode({
      email: registerForm.email,
      type: 'register'
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

// 验证邮箱验证码
const verifyEmailCode = async () => {
  if (!registerForm.email || !registerForm.code) {
    ElMessage.warning('请填写邮箱和验证码');
    return;
  }
  
  // 这里可以进行验证码预验证，但为了简化流程，直接进入下一步
  currentStep.value = 1;
};

// 提交注册
const handleRegister = async () => {
  try {
    await authStore.register(registerForm);
    currentStep.value = 2; // 注册成功，进入成功步骤
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '注册失败');
  }
};

// 去首页
const goToHome = () => {
  router.push('/');
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.register-box {
  width: 450px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 20px;
}

.register-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.register-header p {
  color: #909399;
  font-size: 14px;
}

.register-steps {
  margin-bottom: 30px;
}

.register-button {
  width: 100%;
  margin-top: 10px;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #606266;
}

.register-footer a {
  color: #409eff;
  text-decoration: none;
}

.success-step {
  padding: 20px 0;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .register-box {
    width: 90%;
    padding: 20px;
  }
}
</style>
