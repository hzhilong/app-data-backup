import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedState from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'

import ElementPlus from 'element-plus'
import './assets/scss/main.scss'

const app = createApp(App)
// 挂载到全局属性
// app.config.globalProperties.$env = import.meta.env;
app.use(ElementPlus, { size: 'small', zIndex: 3000 })

let pinia = createPinia()
pinia.use(piniaPluginPersistedState)
app.use(pinia)
app.use(router)
app.config.errorHandler = (err) => {
  /* 处理错误 */
  console.log(err)
}
app.mount('#app')
