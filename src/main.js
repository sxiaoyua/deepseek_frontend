import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import zh from 'element-plus/es/locale/lang/zh-cn'
import router from './router'
import App from './App.vue'
import axios from 'axios'
import './style.css'

// 配置axios默认设置
axios.defaults.baseURL = 'https://deepseek-backend-5u48.onrender.com/api'

// 从本地存储中获取token并设置到请求头
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// 创建应用实例
const app = createApp(App)

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zh
})

// 挂载应用
app.mount('#app')
