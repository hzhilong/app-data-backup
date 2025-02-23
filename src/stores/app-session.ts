import { defineStore } from 'pinia'
import AppUtil from '@/utils/app-util.ts'

export const AppSessionStore = defineStore('AppSessionStore', {
  state: () => {
    return {
      initializing: false,
      initialized: false,
    }
  },
  getters: {
    // 正在初始化？
    isInitializing: (state) => state.initializing,
    // 已初始化？
    isInitialized: (state) => state.initialized,
  },
  actions: {
    setInitializing(flag: boolean) {
      this.initializing = flag
    },
    setInitialized(flag: boolean) {
      this.initialized = flag
      if(flag){
        AppUtil.message('初始化成功')
        ElMessageBox.confirm(
          'proxy will permanently delete the file. Continue?',
          'Warning',
          {
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            type: 'warning',
          }
        )
          .then(() => {
            ElMessage({
              type: 'success',
              message: 'Delete completed',
            })
          })
          .catch(() => {
            ElMessage({
              type: 'info',
              message: 'Delete canceled',
            })
          })
      }
    },
  },
  persist: false,
})
