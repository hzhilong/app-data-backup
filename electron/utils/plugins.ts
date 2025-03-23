// 插件接口定义
import { AbortedError } from '@/models/common-error'
import { formatSize, type InstalledSoftware } from '@/models/software'
import BaseUtil from '@/utils/base-util'
import WinUtil from './win-util'
import path from 'path'
import { BackupConfig, BackupPluginTypeKey, PluginConfig } from '@/plugins/plugin-config'
import { getPluginExecName, PluginExecTask, TaskItemResult, TaskMonitor } from '@/plugins/plugin-task'
import nLogger from './log4js'

/** 插件 */
export class Plugin implements PluginConfig {
  id: string
  name: string
  type: BackupPluginTypeKey
  backupConfigs: BackupConfig[]
  totalItemNum: number
  cTime: string

  constructor(config: PluginConfig, module: Record<string, unknown>) {
    const { id, name, type, backupConfigs, totalItemNum, cTime } = config
    this.id = id
    this.name = name
    this.type = type
    this.backupConfigs = backupConfigs
    this.totalItemNum = totalItemNum
    this.cTime = cTime!
    // 覆盖插件方法
    Object.assign(this, module)
  }

  /**
   * 验证插件支持的软件源
   * [安装程序]需返回 InstalledSoftware
   * [免安装的、自定义]需返回 软件路径
   */
  public detect(
    list: InstalledSoftware[],
    env: {
      [key: string]: string | undefined
    },
  ): InstalledSoftware | string | undefined {
    if (this.type === 'INSTALLER') {
      return this.detectOfInstaller(list, env)
    } else if (this.type === 'PORTABLE') {
      return this.detectOfPortable(env)
    } else if (this.type === 'CUSTOM') {
      return this.detectOfCustom(env)
    }
  }

  /**
   * 验证插件（安装程序）支持的软件源，默认使用nameWithoutVersion进行判断
   */
  public detectOfInstaller(
    list: InstalledSoftware[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    env: {
      [key: string]: string | undefined
    },
  ): InstalledSoftware | undefined {
    if (list?.length > 0) {
      for (const soft of list) {
        if (soft.nameWithoutVersion === this.name) {
          return soft
        }
      }
    }
  }

  /**
   * 验证插件支持的软件源（免安装的）
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public detectOfPortable(env: { [key: string]: string | undefined }): string | undefined {
    return undefined
  }

  /**
   * 验证插件支持的软件源（自定义的）
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public detectOfCustom(env: { [key: string]: string | undefined }): string | undefined {
    return undefined
  }

  /**
   * 验证插件支持的软件源（通过安装路径的文件夹名）
   * @param list
   * @param env
   */
  public detectByInstallLocationDir(list: InstalledSoftware[]) {
    for (const soft of list) {
      if (new RegExp(`[/\\\\]${this.name}\$`).test(soft.installLocation)) {
        return soft
      }
    }
  }

  /** 判断可支持的软件版本 */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public supportableVersion(version: string): boolean {
    return true
  }

  /**
   * 构建进度监听函数
   */
  protected buildProgressFn(monitor?: TaskMonitor) {
    return (log: string, curr: number) => {
      if (monitor && monitor.progress) {
        monitor.progress(log, curr, this.totalItemNum)
      }
    }
  }

  /**
   * 构建子项执行结束监听函数
   */
  protected buildOnItemFinishedFn(monitor?: TaskMonitor) {
    return (configName: string, configItemResult: TaskItemResult) => {
      if (monitor && monitor.onItemFinished) {
        monitor.onItemFinished(configName, configItemResult)
      }
    }
  }

  /**
   * 执行插件
   */
  public async execPlugin(
    task: PluginExecTask,
    env: { [key: string]: string | undefined },
    monitor?: TaskMonitor,
    signal?: AbortSignal,
  ): Promise<PluginExecTask> {
    const execTypeName = getPluginExecName(task.pluginExecType)
    // 监听函数
    const progress: (log: string, curr: number) => void = this.buildProgressFn(monitor)
    const onItemFinished: (configName: string, configItemResult: TaskItemResult) => void =
      this.buildOnItemFinishedFn(monitor)

    // 已完成的进度
    let processedCount = task.taskResults.reduce(
      (count, result) => count + result.configItems.filter((item: TaskItemResult) => item.finished).length,
      0,
    )
    // 已成功的个数
    let successCount = task.taskResults.reduce(
      (count, result) => count + result.configItems.filter((item: TaskItemResult) => item.success).length,
      0,
    )
    if (processedCount > 0) {
      progress(`继续${execTypeName}`, processedCount)
    } else {
      progress(`开始${execTypeName}`, processedCount)
    }

    // 未完成的配置

    // 遍历未完成的配置
    const configLength = task.taskResults.length
    for (let i = 0; i < configLength; i++) {
      const taskResult = task.taskResults[i]
      progress(`${i + 1}/${configLength} 开始${execTypeName}软件配置[${taskResult.configName}]`, processedCount)
      for (const taskItemResult of taskResult.configItems) {
        try {
          if (taskItemResult.finished) {
            continue
          }
          const size = await this.operateData(task, env, taskItemResult, progress, processedCount, signal)
          nLogger.debug('size', size)
          taskItemResult.finished = true
          taskItemResult.success = true
          successCount++
          taskItemResult.size = size
          taskItemResult.sizeStr = formatSize(size)
          taskItemResult.message = `${execTypeName}成功`
          onItemFinished(taskResult.configName, taskItemResult)
        } catch (e) {
          if (e instanceof AbortedError) {
            // 中断任务
            progress(e.message, processedCount)
            task.state = 'stopped'
            task.message = e.message
            return task
          }
          if (taskItemResult.skipIfMissing) {
            taskItemResult.finished = true
            taskItemResult.success = true
            successCount++
            taskItemResult.skipIfMissing = true
            taskItemResult.message = `已跳过缺失项`
            onItemFinished(taskResult.configName, taskItemResult)
          } else {
            nLogger.error('执行错误', e)
            const ce = BaseUtil.convertToCommonError(e)
            taskItemResult.finished = true
            taskItemResult.success = false
            taskItemResult.error = ce
            taskItemResult.message = ce.message
            progress(ce.message, processedCount)
            onItemFinished(taskResult.configName, taskItemResult)
            // 结果当前备份任务
            task.state = 'finished'
            task.message = `${execTypeName}失败`
            task.success = false
            return task
          }
        } finally {
          processedCount++
        }
      }
    }

    task.state = 'finished'
    if (successCount === this.totalItemNum) {
      task.success = true
      task.message = `${execTypeName}成功`
    } else if (successCount > 0) {
      task.message = `操作完成，但部分配置${execTypeName}失败`
      task.success = false
    } else {
      task.message = `${execTypeName}失败`
      task.success = false
    }
    progress(`${execTypeName}完成`, processedCount)
    return task
  }

  /**
   * 操作数据
   * @param task
   * @param env
   * @param item
   * @param progress
   * @param processedCount
   * @param signal
   * @protected 操作的文件大小
   */
  protected async operateData(
    task: PluginExecTask,
    env: { [key: string]: string | undefined },
    item: TaskItemResult,
    progress: (log: string, curr: number) => void,
    processedCount: number,
    signal?: AbortSignal,
  ): Promise<number> {
    return new Promise(async (resolve, reject) => {
      // 前置检查：如果 signal 已终止，直接拒绝
      if (signal?.aborted) {
        reject(new AbortedError())
      }
      // 监听 signal.abort
      const abortHandler = () => {
        reject(new AbortedError())
      }
      try {
        progress(`处理配置项[${item.targetRelativePath}]`, processedCount)
        signal?.addEventListener('abort', abortHandler)
        const execType = task.pluginExecType
        const [src, des] = [
          Plugin.resolvePath(item.sourcePath, env, task.softInstallDir),
          Plugin.resolvePath(item.targetRelativePath, env),
        ]
        const filePath = path.join(task.backupPath, des)
        const operations = {
          registry: {
            backup: (): Promise<number> => WinUtil.exportRegedit(src, filePath),
            restore: (): Promise<number> => WinUtil.importRegedit(src, filePath),
          },
          file: {
            backup: (): Promise<number> => WinUtil.copyFile(src, filePath, signal),
            restore: (): Promise<number> => WinUtil.copyFile(filePath, src, signal),
          },
        }
        const size = await operations[item.type][execType]()
        console.log('size', size)
        resolve(size)
      } catch (e) {
        reject(e)
      } finally {
        signal?.removeEventListener('abort', abortHandler)
      }
    })
  }

  public static resolvePath(path: string, env: { [key: string]: string | undefined }, installDir?: string) {
    let newList = path
    if (installDir) {
      newList = path.replace(/%installDir%/gi, installDir)
    }
    return newList.replace(/%(\w+)%/gi, (_: string, key: string): string => {
      const value = env[key]
      return value !== undefined ? value : `%${key}%`
    })
  }
}
