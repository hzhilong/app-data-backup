import { useAppSettingsStore } from '@/stores/app-settings'
import dayjs from 'dayjs'
import { type Reactive, reactive } from 'vue'
import { CommonError } from '@/models/common-error'
import BaseUtil from '@/utils/base-util'
import { storeToRefs } from 'pinia'
import { useBackupTasksStore } from '@/stores/backup-task'
import { logger } from '@/utils/logger'
import {
  type PluginExecTask,
  type PluginExecType,
  type TaskItemResult,
  type TaskResult,
  type TaskRunType,
} from '@/plugins/plugin-task'
import type { BackupItemConfig, MyPluginConfig, ValidatedPluginConfig } from '@/plugins/plugin-config'
import PluginUtil from '@/plugins/plugin-util'
import { cloneDeep } from 'lodash'
import { useRestoreTasksStore } from '@/stores/restore-task'
import AppUtil from '@/utils/app-util'
import { GPluginConfigModal } from '@/components/modal/global-modal'
import { db } from '@/db/db'

function getFileDateName(data?: Date) {
  return dayjs(data).format('YYYY-MM-DD_HH-mm-ss')
}

/**
 * 获取备份目录
 */
const getBackupDir = (rootPath: string, softName: string, configId: string, fileDateName?: string) => {
  const dateStr = fileDateName ? fileDateName : getFileDateName()
  if (useAppSettingsStore().backupPathType === 'name/date') {
    return `${rootPath}\\${softName}\\${configId}_${dateStr}\\`
  } else {
    return `${rootPath}\\${dateStr}\\${softName}\\`
  }
}

/**
 * 构建任务的选项
 */
interface BuildTaskDataOptions {
  runType: TaskRunType
  execType: PluginExecType
  configWithoutIcon?: Omit<ValidatedPluginConfig, 'softBase64Icon'>
  backupPath: string
  success?: boolean
  cTime: string
  message: string
  backupTask?: PluginExecTask
}

/**
 * 构建任务
 * @param options 选项
 */
const buildTask = (options: BuildTaskDataOptions): PluginExecTask => {
  if (!options.backupTask) {
    if (!options.configWithoutIcon) {
      throw new CommonError('内部错误，缺少 configWithoutIcon')
    }
    // 备份
    const taskResults = options.configWithoutIcon.backupConfigs.map((config) => {
      return {
        configName: config.name,
        configItems: config.items.map((item) => ({ ...item, finished: false }) as TaskItemResult),
      } satisfies TaskResult
    })
    return {
      id: BaseUtil.generateId(),
      runType: options.runType,
      state: options.success === false ? 'finished' : 'pending',
      pluginExecType: options.execType,
      success: options.success,
      message: options.message,
      taskResults: taskResults,
      backupPath: options.backupPath,
      currProgress: 0,
      totalProgress: options.configWithoutIcon.totalItemNum,
      progressText: '',
      cTime: options.cTime,
      pluginType: options.configWithoutIcon.type,
      pluginId: options.configWithoutIcon.id,
      pluginName: options.configWithoutIcon.name,
      softInstallDir: options.configWithoutIcon.softInstallDir,
    } satisfies PluginExecTask
  } else {
    // 还原/自动备份
    // 重置任务结果
    const taskResults = cloneDeep(options.backupTask.taskResults)
    taskResults.forEach((result) => {
      result.configItems = result.configItems.map((item) => {
        const { finished, success, message, error, size, sizeStr, skipped, meta, ...restFields } = item
        return { finished: false, ...restFields }
      })
    })
    return {
      id: BaseUtil.generateId(),
      runType: options.runType,
      state: options.success === false ? 'finished' : 'pending',
      pluginExecType: options.execType,
      success: options.success,
      message: options.message,
      taskResults: taskResults,
      backupPath: options.backupPath,
      currProgress: 0,
      totalProgress: options.backupTask.totalProgress,
      progressText: '',
      cTime: options.cTime,
      pluginType: options.backupTask.pluginType,
      pluginId: options.backupTask.pluginId,
      pluginName: options.backupTask.pluginName,
      softInstallDir: options.backupTask.softInstallDir,
    } satisfies PluginExecTask
  }
}

/**
 * 构建失败的任务
 * @param options
 */
const buildFailedTask = (options: BuildTaskDataOptions): PluginExecTask => {
  return buildTask({ ...options, success: false })
}

/**
 * 异步执行任务 出现异常会直接结束任务，不会抛出错误
 * @param task 任务
 */
async function runTask(task: Reactive<PluginExecTask>): Promise<Reactive<PluginExecTask>> {
  try {
    // 获取缓存key
    const getCacheKey = (configName: string, configItemResult: TaskItemResult) => {
      return `${configName}-${configItemResult.sourcePath}`
    }
    // 结果项缓存
    const resultItemCache = new Map<string, TaskItemResult>()
    // 构建缓存
    task.taskResults.forEach((taskResult) => {
      const configName = taskResult.configName
      taskResult.configItems.forEach((item) => {
        resultItemCache.set(getCacheKey(configName, item), item)
      })
    })
    // 执行插件任务
    task.state = 'running'
    const ranTask = await PluginUtil.execPlugin(cloneDeep(task), {
      progress: (log: string, curr: number, total: number) => {
        logger.debug(`任务[${task.id}]进度 ${curr}/${total} ${log}`)
        if (curr >= total) {
          task.state = 'finished'
        }
        task.currProgress = curr
        task.progressText = log
      },
      onItemFinished: (configName: string, result: TaskItemResult) => {
        logger.debug(`任务[${task.id}] onItemFinished`, configName)
        const cache = resultItemCache.get(getCacheKey(configName, result))
        if (!cache) return
        cache.success = result.success
        cache.message = result.message
        cache.error = result.error
        cache.size = result.size
        cache.sizeStr = result.sizeStr
        cache.skipped = result.skipped
        cache.meta = result.meta
        cache.finished = true
      },
    })
    // 赋值新的状态，可能为暂停
    task.state = ranTask.state
    task.success = ranTask.success
    task.message = ranTask.message
  } catch (e) {
    task.state = 'finished'
    task.success = false
    task.message = BaseUtil.getErrorMessage(e)
  }
  return task
}

/**
 * 备份工具
 */
export default class BackupUtil {
  /**
   * 开始备份数据
   * @param runType 任务运行类型 手动/自动
   * @param pluginConfigs 插件配置，可一次执行多个
   * @param showMsg
   */
  static async startBackupData(runType: TaskRunType, pluginConfigs: ValidatedPluginConfig[], showMsg: boolean = false) {
    if (!pluginConfigs || pluginConfigs.length === 0) {
      throw new CommonError('备份配置为空')
    }
    const execType: PluginExecType = 'backup'
    // 数据保存的路径
    const rootPath = useAppSettingsStore().backupRootDir
    // 已有的插件任务
    const { tasks: backupTasks } = storeToRefs(useBackupTasksStore())
    const date = new Date()
    const cTime = BaseUtil.getFormatedDateTime(date)
    const fileDateName = getFileDateName(date)
    const currTasks: Reactive<PluginExecTask[]> = reactive([])

    // 任务执行完成的监听
    let onTaskFinishedListener: (task: PluginExecTask) => void
    const onTaskFinished = (listener: (task: PluginExecTask) => void) => {
      onTaskFinishedListener = listener
    }

    for (const pluginConfig of pluginConfigs) {
      const { softBase64Icon, ...configWithoutIcon } = pluginConfig
      const task: Reactive<PluginExecTask> = reactive(
        buildTask({
          runType,
          execType,
          configWithoutIcon,
          cTime,
          backupPath: getBackupDir(rootPath, pluginConfig.name, pluginConfig.id, fileDateName),
          message: '任务创建成功，等待执行',
        }),
      )
      // 异步执行任务
      runTask(task)
        .then((r) => {
          if (onTaskFinishedListener) {
            onTaskFinishedListener(r)
          }
          showMsg && AppUtil.showTaskMessage(task)
        })
        .catch((err) => {
          showMsg && AppUtil.showTaskMessage(task, err)
        })
      currTasks.unshift(task)
    }
    backupTasks.value.unshift(...currTasks)
    return {
      currTasks,
      backupTasks,
      onTaskFinished,
    }
  }

  /**
   * 继续任务
   * @param task
   * @param showMsg
   */
  static async resumedTask(task: Reactive<PluginExecTask>, showMsg: boolean = false) {
    // 任务执行完成的监听
    let onTaskFinishedListener: (task: PluginExecTask) => void
    const onTaskFinished = (listener: (task: PluginExecTask) => void) => {
      onTaskFinishedListener = listener
    }
    // 异步执行任务
    task.message = '正在继续执行'
    if (showMsg) {
      AppUtil.message('继续执行')
    }
    runTask(task)
      .then((r) => {
        if (onTaskFinishedListener) {
          onTaskFinishedListener(r)
        }
        showMsg && AppUtil.showTaskMessage(task)
      })
      .catch((err) => {
        showMsg && AppUtil.showTaskMessage(task, err)
      })
    return {
      currTask: task,
      onTaskFinished,
    }
  }

  /**
   * 停止任务
   * @param task
   * @param showMsg
   */
  static async stopTask(task: Reactive<PluginExecTask>, showMsg: boolean = false) {
    PluginUtil.stopExecPlugin(cloneDeep(task))
      .then(() => {
        showMsg && AppUtil.showTaskMessage(task)
      })
      .catch((err) => {
        showMsg && AppUtil.showTaskMessage(task, err)
        task.state = 'stopped'
      })
  }

  static async autoBackupData(backupTasks: PluginExecTask[]) {
    const { tasks } = storeToRefs(useBackupTasksStore())
    const currTasks: Reactive<PluginExecTask[]> = reactive([])
    const rootPath = useAppSettingsStore().backupRootDir
    const date = new Date()
    const cTime = BaseUtil.getFormatedDateTime(date)
    const fileDateName = getFileDateName(date)
    for (const task of backupTasks) {
      const refTask: Reactive<PluginExecTask> = reactive(
        buildTask({
          runType: 'auto',
          execType: 'backup',
          backupTask: task,
          cTime,
          backupPath: getBackupDir(rootPath, task.pluginName, task.pluginId, fileDateName),
          message: '自动备份任务，等待执行',
        }),
      )
      // 异步执行任务，需等待
      await runTask(refTask)
        .then((r) => {})
        .catch((err) => {})
      currTasks.unshift(refTask)
    }
    tasks.value.unshift(...currTasks)
    return
  }

  /**
   * 开始还原数据
   * @param runType 任务运行类型 手动/自动
   * @param backupTasks 备份记录
   * @param showMsg
   */
  static async restoreBackupData(runType: TaskRunType, backupTasks: PluginExecTask[], showMsg: boolean = false) {
    if (!backupTasks || backupTasks.length === 0) {
      throw new CommonError('备份记录为空')
    }
    if (backupTasks.some((task) => task.state !== 'finished')) {
      throw new CommonError('存在未备份结束的任务')
    }
    if (backupTasks.some((task) => task.success === false)) {
      throw new CommonError('存在未备份成功的任务')
    }

    const settingsStore = useAppSettingsStore()
    if (settingsStore.confirmBeforeRestore) {
      const ret = await GPluginConfigModal.showTask(backupTasks, {
        title: '是否还原以下项目？',
        showCancel: true,
      })
      if (ret === 'cancel') {
        throw new CommonError('已取消')
      }
    }

    if (settingsStore.autoBackupBeforeRestore) {
      showMsg && AppUtil.message('等待自动备份完成...')
      await this.autoBackupData(backupTasks)
    }

    const execType: PluginExecType = 'restore'
    // 数据保存的路径
    const { tasks: restoreTasks } = storeToRefs(useRestoreTasksStore())
    const date = new Date()
    const cTime = BaseUtil.getFormatedDateTime(date)
    const currTasks: Reactive<PluginExecTask[]> = reactive([])

    // 任务执行完成的监听
    let onTaskFinishedListener: (task: PluginExecTask) => void
    const onTaskFinished = (listener: (task: PluginExecTask) => void) => {
      onTaskFinishedListener = listener
    }

    for (const task of backupTasks) {
      const refTask: Reactive<PluginExecTask> = reactive(
        buildTask({
          runType,
          execType,
          backupTask: task,
          cTime,
          backupPath: task.backupPath,
          message: '任务创建成功，等待执行',
        }),
      )
      // 异步执行任务
      runTask(refTask)
        .then((r) => {
          if (onTaskFinishedListener) {
            onTaskFinishedListener(r)
          }
          showMsg && AppUtil.showTaskMessage(refTask)
        })
        .catch((err) => {
          showMsg && AppUtil.showTaskMessage(refTask, err)
        })
      currTasks.unshift(refTask)
    }
    restoreTasks.value.unshift(...currTasks)
    return {
      currTasks,
      restoreTasks,
      onTaskFinished,
    }
  }

  /**
   * 移除任务
   * @param task
   * @param showMsg
   */
  static removeTask(task: Reactive<PluginExecTask>, showMsg: boolean = false) {
    if (task.state === 'running') {
      if (showMsg) {
        showMsg && AppUtil.showTaskMessage(task, '任务正在运行，不支持移除')
      }
      throw new CommonError('任务正在运行，不支持移除')
    }
    const removeFn = (): boolean => {
      if (task.pluginExecType === 'backup') {
        return useBackupTasksStore().removeTask(task)
      } else {
        return useRestoreTasksStore().removeTask(task)
      }
    }
    const ret = removeFn()
    if (showMsg) {
      AppUtil.message({
        message: ret ? '成功移除' : '移除失败',
        type: ret ? 'success' : 'error',
      })
    }
    return ret
  }

  static async bulkRestoreRecent(runType: TaskRunType, pluginConfigs: MyPluginConfig[], showMsg: boolean = false) {
    const pluginIds = pluginConfigs.map((pluginConfig) => pluginConfig.id)
    const records = await db.backupTask
      .orderBy('[pluginId+cTime]')
      .filter((task) => (task.success === true && task.state === 'finished' && pluginIds.includes(task.pluginId)))
      .reverse()
      .toArray()
    console.log('查询结果：', records)
    const latestMap = new Map<string, PluginExecTask>()
    for (const record of records) {
      if (!latestMap.has(record.pluginId)) {
        latestMap.set(record.pluginId, record)
      }
    }
    console.log('过滤结果：', Array.from(latestMap.values()))
    return this.restoreBackupData(runType, Array.from(latestMap.values()), showMsg)
  }
}
