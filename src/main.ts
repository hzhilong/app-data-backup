import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedState from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'

import ElementPlus from 'element-plus'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/assets/scss/main.scss'
import '@/assets/scss/element/light-var.css'
import '@/assets/scss/element/dark-var.css'
import AppUtil from '@/utils/app-util'
import ThemeUtil from '@/utils/theme-util'
import { useAppSettingsStore } from '@/stores/app-settings'
import { useBackupTasksStore } from '@/stores/backup-task'

const app = createApp(App)
// 挂载到全局属性
// app.config.globalProperties.$env = import.meta.env;

app.use(ElementPlus, { size: 'small', zIndex: 3000 })

async function bootstrapApp() {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedState)
  app.use(pinia)

  await ThemeUtil.initAppTheme()
  await useBackupTasksStore().initData()
  await useAppSettingsStore().initData()

  app.use(router)
  app.config.errorHandler = (err) => {
    AppUtil.handleError(err)
  }
  window.addEventListener('unhandledrejection', (event) => {
    AppUtil.handleError(event.reason)
  })
  app.mount('#app')
}

bootstrapApp().then((r) => {})
