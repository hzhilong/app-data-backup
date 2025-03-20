import { defineStore } from 'pinia'

export const AppSessionStore = defineStore('AppSessionStore', {
  state: () => {
    return {
      initializing: false,
      initialized: false,
      maxWindow: false,
      runTasking: false
    }
  },
  getters: {
    isMaxWindow(state) {
      return state.maxWindow
    },
  },
  actions: {
    setMaxWindow(flag: boolean) {
      this.maxWindow = flag
    },
    setInitializing(flag: boolean) {
      this.initializing = flag
    },
    setInitialized(flag: boolean) {
      this.initialized = flag
    },
    setRunTasking(flag: boolean) {
      this.runTasking = flag
    },
  },
  persist: false,
})
