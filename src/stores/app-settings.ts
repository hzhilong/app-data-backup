import { defineStore } from 'pinia'
import { type Ref, ref } from 'vue'

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
