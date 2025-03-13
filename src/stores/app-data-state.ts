import { defineStore } from 'pinia'

export type AppDataInfo = {
  lastTime: Date
}

export type AppDataState = {
  persisted: {
    [dbName: string]: AppDataInfo
  }
}
/**
 * APP 数据状态
 */
export const AppDataStore = defineStore('AppDataStore', {
  state: (): AppDataState => {
    return {
      // 已持久化的数据
      persisted: {},
    }
  },
  actions: {
    isInitialized(key: string) {
      return key in this.persisted
    },
    initialized(key: string, flag = true) {
      if (flag) {
        this.persisted[key] = {
          lastTime: new Date(),
        }
      } else {
        delete this.persisted[key]
      }
    },
  },
  persist: true,
})
