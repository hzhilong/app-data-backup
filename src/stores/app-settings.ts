import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppSettingsStore = defineStore(
  'AppSettings',
  () => {
    const backupRootDir = ref('')
    const confirmBeforeRestore = ref(true)
    const autoBackupBeforeRestore = ref(true)
    return { backupRootDir, confirmBeforeRestore, autoBackupBeforeRestore }
  },
  {
    persist: true,
  },
)
