import { defineStore } from 'pinia'

export const AppSessionStore = defineStore('AppSessionStore', {
  state: () => {
    return {
      initializing: false,
      initialized: false,
    }
  },
  actions: {
    setInitializing(flag: boolean) {
      this.initializing = flag
    },
    setInitialized(flag: boolean) {
      this.initialized = flag
    },
  },
  persist: false,
})
