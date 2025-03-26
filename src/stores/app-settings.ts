import { defineStore } from 'pinia'
import { ref } from 'vue'
import { IPC_CHANNELS } from '@/types/IpcChannels'
import { logger } from '@/utils/logger-util'
import { ipcInvoke } from '@/utils/electron-api'

export type BackupPathType = 'name/date' | 'date/name'

export const useAppSettingsStore = defineStore(
  'AppSettings',
  () => {
    const backupRootDir = ref('')
    const confirmBeforeRestore = ref(true)
    const autoBackupBeforeRestore = ref(true)
    const bulkBackupShowMsg = ref(false)
    const backupPathType = ref<BackupPathType>('name/date')
    const initData = async () => {
      if (!backupRootDir.value) {
        ipcInvoke<string>(IPC_CHANNELS.CREATE_BACKUP_DIR).then((dir) => {
          logger.debug('创建默认备份目录', dir)
        })
      }
    }
    return { backupRootDir, confirmBeforeRestore, autoBackupBeforeRestore, bulkBackupShowMsg, backupPathType, initData }
  },
  {
    persist: true,
  },
)
