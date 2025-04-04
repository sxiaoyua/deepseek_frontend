<template>
  <div class="forgot-password-container">
    <div class="forgot-password-box">
      <div class="forgot-password-header">
        <h2>重置密码</h2>
        <p>请输入您的邮箱，我们将发送验证码帮助您重置密码</p>
      </div>

      <el-steps :active="currentStep" finish-status="success" simple class="forgot-password-steps">
        <el-step title="验证邮箱" />
        <el-step title="重置密码" />
        <el-step title="完成" />
      </el-steps>

      <!-- 步骤1：验证邮箱 -->
      <div v-show="currentStep === 0">
        <el-form ref="emailForm" :model="resetForm" :rules="emailRules">
          <el-form-item prop="email">
            <el-input v-model="resetForm.email" placeholder="请输入邮箱">
              <template #prefix>
                <el-icon><Message /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="code">
            <el-input v-model="resetForm.code" placeholder="验证码">
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
            <el-button type="primary" :loading="loading" class="form-button" @click="verifyEmailCode">下一步</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤2：重置密码 -->
      <div v-show="currentStep === 1">
        <el-form ref="passwordForm" :model="resetForm" :rules="passwordRules">
          <el-form-item prop="newPassword">
            <el-input v-model="resetForm.newPassword" type="password" placeholder="请输入新密码" show-password>
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input v-model="resetForm.confirmPassword" type="password" placeholder="请确认新密码" show-password>
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" class="form-button" @click="resetPassword">确认重置</el-button>
            <el-button class="form-button" @click="currentStep = 0">上一步</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤3：完成 -->
      <div v-show="currentStep === 2" class="success-step">
        <el-result icon="success" title="密码重置成功" sub-title="您已成功重置密码，现在可以使用新密码登录">
          <template #extra>
            <el-button type="primary" @click="goToLogin">去登录</el-button>
          </template>
        </el-result>
      </div>

      <div class="forgot-password-footer" v-show="currentStep < 2">
        <p>记起密码了？<router-link to="/login">返回登录</router-link></p>
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

// 重置密码步骤
const currentStep = ref(0);

// 加载状态
const loading = computed(() => authStore.loading);

// 重置密码表单
const resetForm = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
});

// 验证码发送状态
const isSending = ref(false);
const countdown = ref(0);
const sendButtonText = computed(() => {
  return isSending.value ? `重新发送(${countdown.value}s)` : '获取验证码';
});

// 验证规则
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

const passwordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetForm.newPassword) {
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
  
  if (!resetForm.email) {
    ElMessage.warning('请先输入邮箱');
    return;
  }
  
  try {
    isSending.value = true;
    await authStore.sendVerificationCode({
      email: resetForm.email,
      type: 'password_reset'
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
  if (!resetForm.email || !resetForm.code) {
    ElMessage.warning('请填写邮箱和验证码');
    return;
  }
  
  try {
    // 在这里可以添加验证码预验证的API调用
    // 为了简化流程，这里直接进入下一步
    
    // 验证成功，进入下一步
    currentStep.value = 1;
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '验证码验证失败');
  }
};

// 重置密码
const resetPassword = async () => {
  try {
    await authStore.forgotPassword({
      email: resetForm.email,
      code: resetForm.code,
      newPassword: resetForm.newPassword
    });
    
    // 重置成功，进入完成步骤
    currentStep.value = 2;
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '重置密码失败');
  }
};

// 跳转到登录页
const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.forgot-password-box {
  width: 400px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.forgot-password-header {
  text-align: center;
  margin-bottom: 20px;
}

.forgot-password-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.forgot-password-header p {
  color: #909399;
  font-size: 14px;
}

.forgot-password-steps {
  margin-bottom: 30px;
}

.form-button {
  width: 100%;
  margin-top: 10px;
}

.success-step {
  padding: 20px 0;
}

.forgot-password-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #606266;
}

.forgot-password-footer a {
  color: #409eff;
  text-decoration: none;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .forgot-password-box {
    width: 90%;
    padding: 20px;
  }
}
</style>
