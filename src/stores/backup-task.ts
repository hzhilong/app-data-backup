import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'
import { debounce } from '@/utils/base-util'
import { db } from '@/db/db'
import { logger } from '@/utils/logger'
import { cloneDeep } from 'lodash'
import type { PluginExecTask } from '@/plugins/plugin-task'
import type { IDType } from 'dexie'

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
    // 测试
    if (item.id === 'rhxaMRrc10U9c_VyKUHym') {
      item.success = undefined
      item.currProgress = 0
      item.taskResults.forEach((taskResult) => {
        taskResult.configItems.forEach((taskItemResult) => {
          taskItemResult.finished = false
          taskItemResult.success = undefined
        })
      })
      item.state = 'stopped'
      item.message =
        '1任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停任务已暂停'
    }
  })
}

export const useBackupTasksStore = defineStore(
  'BackupTasksStore',
  () => {
    const tasks = reactive<PluginExecTask[]>([])

    // 从数据库加载数据
    const initData = async () => {
      const oldList = await db.backupTask.orderBy('cTime').reverse().toArray()
      logger.debug(`初始化 加载${oldList.length}条备份任务`)
      handleInitData(oldList)
      oldList.forEach((item) => {
        tasks.push(reactive(item))
      })
    }

    // 带防抖的持久化方法
    const persistData = debounce(async () => {
      logger.debug(`持久化${tasks.length}条备份任务`, tasks)
      db.transaction('rw', db.backupTask.name, async () => {
        await db.backupTask.bulkPut(cloneDeep(tasks))
      })
    }, 500)

    // 监听内存数据变化自动持久化
    watch(
      () => tasks,
      () => persistData(),
      { deep: true },
    )

    const removeTask = (task: PluginExecTask) => {
      const index = tasks.findIndex((i) => i.id === task.id)
      if (index !== -1) {
        tasks.splice(index, 1)
        db.backupTask.delete(task.id as IDType<PluginExecTask, never>)
        return true
      }
      return false
    }

    return { tasks, initData, removeTask }
  },
  {
    persist: false,
  },
)
