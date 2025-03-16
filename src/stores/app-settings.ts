import { defineStore } from 'pinia'

export type AppSettingsState = {
  backupRootDir?: string
}

export const AppSettingsStore = defineStore('AppSettingsStore', {
  state: (): AppSettingsState => {
    return {}
  },
  actions: {},
  persist: true,
})
