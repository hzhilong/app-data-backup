import { defineStore } from 'pinia'
import { ref } from 'vue'
import { BuResult } from '@/models/BuResult.ts'
import { IPC_CHANNELS } from '@/models/IpcChannels.ts'
import { logger } from '@/utils/logger.ts'

export const useAppSettingsStore = defineStore(
  'AppSettings',
  () => {
    const backupRootDir = ref('')
    const confirmBeforeRestore = ref(true)
    const autoBackupBeforeRestore = ref(true)
    const initData = async () => {
      logger.debug('initData', backupRootDir.value)
      if (!backupRootDir.value) {
        BuResult.getPromise(
          (await window.electronAPI?.ipcInvoke(IPC_CHANNELS.CREATE_BACKUP_DIR)) as BuResult<string>,
        ).then((r) => {
          logger.debug('创建默认备份目录', r)
          backupRootDir.value = r
        })
      }
    }
    return { backupRootDir, confirmBeforeRestore, autoBackupBeforeRestore, initData }
  },
  {
    persist: true,
  },
)
