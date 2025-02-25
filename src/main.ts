import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedState from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'

import ElementPlus from 'element-plus'
import './assets/scss/main.scss'
import AppUtil from '@/utils/app-util'

const app = createApp(App)
// 挂载到全局属性
// app.config.globalProperties.$env = import.meta.env;
app.config.globalProperties.$appUtil = AppUtil

app.use(ElementPlus, { size: 'small', zIndex: 3000 })

const pinia = createPinia()
pinia.use(piniaPluginPersistedState)
app.use(pinia)
app.use(router)
app.config.errorHandler = (err) => {
  AppUtil.handleError(err)
}
window.addEventListener('unhandledrejection', (event) => {
  AppUtil.handleError(event.reason)
})
app.mount('#app')


