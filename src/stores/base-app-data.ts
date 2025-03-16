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
