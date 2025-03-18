import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppSettingsStore = defineStore(
  'AppSettings',
  () => {
    const backupRootDir = ref('')

    return { backupRootDir }
  },
  {
    persist: true,
  },
)
