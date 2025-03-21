import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'
import { debounce } from '@/utils/base-util'
import { db } from '@/db/db'
import { logger } from '@/utils/logger'
import { cloneDeep } from 'lodash'
import type { PluginExecTask } from '@/plugins/plugin-task'

/**
 * 处理初始化的数据
 * @param list
 */
const handleInitData = (list: PluginExecTask[]) => {
  if (!list) return
  logger.debug(`初始化 备份任务 ${list.length}`)
  // 将正在运行的任务设置为已暂停
  list.forEach((item) => {
    if (item.state === 'running') {
      item.state = 'stopped'
      item.message = '任务已暂停'
    }
  })
}

export const useBackupTasksStore = defineStore(
  'BackupTasksStore',
  () => {
    const backupTasks = reactive<PluginExecTask[]>([])

    // 从数据库加载数据
    const initData = async () => {
      const oldList = await db.backupTask.toArray()
      logger.debug(`初始化 加载${oldList.length}条备份任务`)
      handleInitData(oldList)
      oldList.forEach((item) => {
        backupTasks.push(reactive(item))
      })
    }

    // 带防抖的持久化方法
    const persistData = debounce(async () => {
      logger.debug(`持久化${backupTasks.length}条备份任务`, backupTasks)
      db.transaction('rw', db.backupTask.name, async () => {
        await db.backupTask.bulkPut(cloneDeep(backupTasks))
      })
    }, 500)

    // 监听内存数据变化自动持久化
    watch(
      () => backupTasks,
      () => persistData(),
      { deep: true },
    )

    return { backupTasks, initData }
  },
  {
    persist: false,
  },
)
