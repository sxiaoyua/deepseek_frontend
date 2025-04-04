<template>
  <div class="profile-container">
    <div class="profile-header">
      <h2>个人中心</h2>
      <p>管理您的个人资料和账户设置</p>
    </div>

    <div class="profile-content">
      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="个人资料" name="profile">
          <el-card class="profile-card">
            <template #header>
              <div class="card-header">
                <h3>基本信息</h3>
              </div>
            </template>
            
            <el-form ref="profileForm" :model="profileData" :rules="profileRules" label-width="100px">
              <el-form-item label="用户名" prop="username">
                <el-input v-model="profileData.username" placeholder="请输入用户名" />
              </el-form-item>
              <el-form-item label="电子邮箱" prop="email">
                <div class="email-display">
                  <el-tag size="large">{{ profileData.email }}</el-tag>
                  <el-button type="primary" @click="showEmailModal">修改邮箱</el-button>
                </div>
              </el-form-item>
              <el-form-item label="头像">
                <div class="avatar-uploader">
                  <el-avatar :size="100" :src="avatarUrl || defaultAvatar">
                    {{ profileData.username ? profileData.username.charAt(0).toUpperCase() : 'U' }}
                  </el-avatar>
                  <el-upload
                    class="avatar-upload"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="handleAvatarChange"
                    accept="image/*"
                  >
                    <el-button class="avatar-upload-btn" type="primary">
                      上传头像
                    </el-button>
                  </el-upload>
                  <div v-if="isUploading" class="upload-progress">
                    <el-progress :percentage="uploadProgress" />
                  </div>
                </div>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="updating" @click="updateProfile">保存修改</el-button>
                <el-button @click="resetForm('profileForm')">重置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="安全设置" name="security">
          <el-card class="profile-card">
            <template #header>
              <div class="card-header">
                <h3>修改密码</h3>
              </div>
            </template>
            
            <el-form ref="passwordForm" :model="passwordData" :rules="passwordRules" label-width="120px">
              <el-form-item label="当前密码" prop="currentPassword">
                <el-input v-model="passwordData.currentPassword" type="password" show-password />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="passwordData.newPassword" type="password" show-password />
              </el-form-item>
              <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input v-model="passwordData.confirmPassword" type="password" show-password />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="updating" @click="updatePassword">更新密码</el-button>
                <el-button @click="resetForm('passwordForm')">重置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 修改邮箱的对话框 -->
    <el-dialog v-model="emailDialogVisible" title="修改邮箱" width="30%">
      <el-form ref="emailForm" :model="emailData" :rules="emailRules" label-width="80px">
        <el-form-item label="新邮箱" prop="newEmail">
          <el-input v-model="emailData.newEmail" placeholder="请输入新邮箱地址" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="verification-code-container">
            <el-input v-model="emailData.code" placeholder="请输入验证码" />
            <el-button type="primary" :disabled="isSending" @click="sendEmailVerificationCode">
              {{ sendButtonText }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="emailDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="updating" @click="updateEmail">确认修改</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// 标签页状态
const activeTab = ref('profile');

// 用户数据
const profileData = reactive({
  username: '',
  email: '',
  avatar: '',
  bio: ''
});

// 头像上传相关
const avatarUrl = ref('');
const WORKER_URL = import.meta.env.VITE_WORKER_URL; // 使用环境变量
const isUploading = ref(false);
const uploadProgress = ref(0);

// 表单引用
const profileForm = ref(null);
const passwordForm = ref(null);
const emailForm = ref(null);

// 密码数据
const passwordData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 邮箱数据
const emailData = reactive({
  newEmail: '',
  code: ''
});

// 加载和更新状态
const updating = ref(false);
const loading = ref(false);
const emailDialogVisible = ref(false);

// 验证码发送状态
const isSending = ref(false);
const countdown = ref(0);
const sendButtonText = computed(() => {
  return isSending.value ? `重新发送(${countdown.value}s)` : '获取验证码';
});

// 表单验证规则
const profileRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 30, message: '用户名长度在3到30个字符之间', trigger: 'blur' }
  ]
};

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordData.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

const emailRules = {
  newEmail: [
    { required: true, message: '请输入新邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度应为6位', trigger: 'blur' }
  ]
};

// 在组件挂载时获取用户信息
onMounted(async () => {
  loading.value = true;
  try {
    // 如果用户未登录，跳转到登录页
    if (!authStore.isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // 获取用户信息
    const response = await axios.get('/auth/me');
    const user = response.data.user || {};
    
    // 填充表单数据
    profileData.username = user.username || '';
    profileData.email = user.email || '';
    profileData.avatar = user.avatar || '';
    avatarUrl.value = user.avatar || '';
  } catch (error) {
    console.error('获取用户信息失败:', error);
    ElMessage.error('获取用户信息失败');
  } finally {
    loading.value = false;
  }
});

// 重置表单
const resetForm = (formName) => {
  if (formName === 'profileForm') {
    // 重置为初始值
    profileData.username = authStore.currentUser?.username || '';
    profileData.bio = authStore.currentUser?.bio || '';
    avatarUrl.value = authStore.currentUser?.avatar || '';
  } else if (formName === 'passwordForm') {
    passwordData.currentPassword = '';
    passwordData.newPassword = '';
    passwordData.confirmPassword = '';
  }
};

// 处理头像上传
const handleAvatarChange = (file) => {
  if (!file) return;
  
  // 检查文件类型
  const isImage = file.raw.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('请上传图片文件');
    return;
  }
  
  // 检查文件格式
  const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const isAllowedFormat = allowedFormats.includes(file.raw.type);
  if (!isAllowedFormat) {
    ElMessage.error('只支持JPG、PNG和WEBP格式的图片');
    return;
  }
  
  // 检查文件大小（限制为2MB）
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过2MB');
    return;
  }
  
  // 读取图片并显示预览
  const reader = new FileReader();
  reader.onload = (e) => {
    avatarUrl.value = e.target.result;
  };
  reader.readAsDataURL(file.raw);
  
  // 上传图片到服务器
  uploadAvatar(file.raw);
};

// 上传头像到服务器
const uploadAvatar = (file) => {
  isUploading.value = true;
  uploadProgress.value = 0;
  
  const formData = new FormData();
  formData.append('file', file);
  
  const xhr = new XMLHttpRequest();
  
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      uploadProgress.value = Math.round((e.loaded / e.total) * 100);
    }
  };
  
  xhr.onload = () => {
    isUploading.value = false;
    
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText);
        // 存储代理URL
        avatarUrl.value = response.url;
        profileData.avatar = response.url;
        ElMessage.success('头像上传成功，请点击"保存修改"按钮完成更新');
      } catch (error) {
        ElMessage.error('解析响应失败');
        console.error('上传响应解析失败:', error);
      }
    } else {
      ElMessage.error('头像上传失败');
      console.error('上传失败:', xhr.statusText);
    }
  };
  
  xhr.onerror = () => {
    isUploading.value = false;
    ElMessage.error('上传过程中发生错误');
    console.error('上传错误');
  };
  
  xhr.open('POST', WORKER_URL, true);
  xhr.send(formData);
};

// 更新个人资料
const updateProfile = async () => {
  updating.value = true;
  
  try {
    // 验证表单
    await profileForm.value.validate();
    
    const response = await axios.put('/users/profile', {
      username: profileData.username,
      avatar: profileData.avatar
    });
    
    // 更新store中的用户信息
    if (response.data.success) {
      // 直接更新authStore中的user对象
      authStore.user = response.data.data;
      
      // 如果头像已更改，提示用户可能需要重新登录或刷新页面以查看所有更改
      if (profileData.avatar !== authStore.user.avatar) {
        ElMessage.success('个人资料更新成功，您可能需要刷新页面以查看所有更改');
      } else {
        ElMessage.success('个人资料更新成功');
      }
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      ElMessage.warning('请检查输入信息是否正确');
    } else {
      console.error('更新个人资料失败:', error);
      ElMessage.error(error.response?.data?.message || '更新个人资料失败');
    }
  } finally {
    updating.value = false;
  }
};

// 更新密码
const updatePassword = async () => {
  updating.value = true;
  
  try {
    await axios.put('/users/password', {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
    
    ElMessage.success('密码更新成功');
    
    // 清空密码表单
    passwordData.currentPassword = '';
    passwordData.newPassword = '';
    passwordData.confirmPassword = '';
  } catch (error) {
    console.error('更新密码失败:', error);
    ElMessage.error(error.response?.data?.message || '更新密码失败');
  } finally {
    updating.value = false;
  }
};

// 显示修改邮箱对话框
const showEmailModal = () => {
  emailData.newEmail = '';
  emailData.code = '';
  emailDialogVisible.value = true;
};

// 发送邮箱验证码
const sendEmailVerificationCode = async () => {
  if (isSending.value) return;
  
  if (!emailData.newEmail) {
    ElMessage.warning('请先输入新邮箱');
    return;
  }
  
  try {
    isSending.value = true;
    await axios.post('/auth/send-verification', {
      email: emailData.newEmail,
      type: 'email_change'
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

// 更新邮箱
const updateEmail = async () => {
  updating.value = true;
  
  try {
    const response = await axios.put('/users/email', {
      email: emailData.newEmail,
      code: emailData.code
    });
    
    // 更新store中的用户信息
    if (response.data.success) {
      authStore.user = response.data.data;
      profileData.email = emailData.newEmail;
      
      ElMessage.success('邮箱更新成功');
      emailDialogVisible.value = false;
    }
  } catch (error) {
    console.error('更新邮箱失败:', error);
    ElMessage.error(error.response?.data?.message || '更新邮箱失败');
  } finally {
    updating.value = false;
  }
};
</script>

<style scoped>
.profile-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 30px 20px;
}

.profile-header {
  text-align: center;
  margin-bottom: 30px;
}

.profile-header h2 {
  font-size: 28px;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
}

.profile-header p {
  color: var(--el-text-color-secondary);
  font-size: 16px;
}

.profile-content {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  overflow: hidden;
}

.profile-tabs {
  width: 100%;
}

.profile-card {
  margin-bottom: 20px;
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.email-display {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar-upload-btn {
  width: 120px;
}

.upload-progress {
  width: 200px;
  margin-top: 8px;
}

.verification-code-container {
  display: flex;
  gap: 10px;
}

.verification-code-container .el-input {
  flex: 1;
}

.verification-code-container .el-button {
  width: 110px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .profile-container {
    padding: 20px 10px;
  }
  
  :deep(.el-form-item__label) {
    float: none;
    display: block;
    text-align: left;
    padding: 0 0 10px;
  }
  
  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
  
  .email-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .verification-code-container {
    flex-direction: column;
  }
  
  .verification-code-container .el-button {
    width: 100%;
  }
}
</style>
