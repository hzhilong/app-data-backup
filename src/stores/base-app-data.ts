import { defineStore } from 'pinia'
import type { ComputedRef } from 'vue'

type DataType = any

export type AppDataState<T = DataType> = {
  data: T | undefined
  lastUpdated: string | undefined
}

export const AppDataStore = defineStore('AppDataStore', {
  state: (): AppDataState => {
    return {
      data: undefined,
      lastUpdated: undefined,
    }
  },
  actions: {
    updateData(data: DataType) {
      this.data = data
    },
    clearData() {
      this.data = undefined
    },
  },
  persist: true,
})

export type DataStoreActions<T = DataType> = {
  updateData: (data: T) => void
  clearData: () => void
}

/**
 * APP 数据配置
 */
export type AppDataConfig<T> = {
  // 初始化数据
  initData?: () => Promise<T>
  // 额外解析数据
  parseData?: (list: T) => Promise<T>
  // 数据数据状态的方法
  getDataStoreActions: DataStoreActions,
  // 获取响应式数据
  getData: ComputedRef<T>
}
