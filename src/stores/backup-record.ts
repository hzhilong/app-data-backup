import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'
import { debounce } from '@/utils/base-util.ts'
import { db } from '@/db/db.ts'
import type { BackupRecord } from '@/models/BackupRecord.ts'
import { logger } from '@/utils/logger.ts'
import { cloneDeep } from 'lodash'

export const useBackupRecordsStore = defineStore(
  'BackupRecordsStore',
  () => {
    const backupRecords = reactive<BackupRecord[]>([])

    // 从数据库加载数据
    const initData = async () => {
      const oldList = await db.backupRecord.toArray()
      logger.debug(`初始化 加载${oldList.length}条备份记录`)
      oldList.forEach((item) => {
        backupRecords.push(reactive(item))
      })
    }

    // 带防抖的持久化方法
    const persistData = debounce(async () => {
      logger.debug(`持久化${backupRecords.length}条备份记录`, backupRecords)
      db.transaction('rw', db.backupRecord.name, async () => {
        await db.backupRecord.bulkPut(cloneDeep(backupRecords))
      })
    }, 500)

    // 监听内存数据变化自动持久化
    watch(
      () => backupRecords,
      () => persistData(),
      { deep: true },
    )

    return { backupRecords, initData }
  },
  {
    persist: false,
  },
)
