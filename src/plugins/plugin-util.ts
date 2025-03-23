import { IPC_CHANNELS } from '@/models/ipc-channels'
import {
  BACKUP_PLUGIN_TYPE,
  type BackupItemConfig,
  type BackupPluginTypeKey,
  type PluginConfig,
  type PluginConfigGroup,
} from '@/plugins/plugin-config'
import { CommonError } from '@/models/common-error'
import { BuResult } from '@/models/bu-result'
import type { OpenTaskConfigPathOptions, PluginExecTask, TaskItemResult, TaskMonitor } from '@/plugins/plugin-task'

/**
 * 插件工具
 */
export default class PluginUtil {
  static async execPlugin(task: PluginExecTask, monitor: TaskMonitor): Promise<PluginExecTask> {
    if (!task.softInstallDir) {
      throw new CommonError('执行失败，缺少参数[安装目录]')
    }
    if (!task.backupPath) {
      throw new CommonError('执行失败，缺少参数[备份目录]')
    }
    // 进度监听
    let progressListener
    if (task) {
      progressListener = (event: unknown, id: string, log: string, curr: number, total: number) => {
        if (id === task.id) {
          monitor.progress(log, curr, total)
        }
      }
      window.electronAPI?.ipcOn(IPC_CHANNELS.GET_PLUGIN_PROGRESS, progressListener)
    }
    // 子项结束监听
    let onItemFinishedListener
    if (task) {
      onItemFinishedListener = (event: unknown, id: string, configName: string, configItemResult: TaskItemResult) => {
        if (id === task.id) {
          monitor.onItemFinished(configName, configItemResult)
        }
      }
      window.electronAPI?.ipcOn(IPC_CHANNELS.ON_PLUGIN_ITEM_FINISHED, onItemFinishedListener)
    }

    // 通知主进程执行任务
    const ranTaskResult = (await window.electronAPI?.ipcInvoke(
      IPC_CHANNELS.EXEC_PLUGIN,
      task,
    )) as BuResult<PluginExecTask>

    // 移除监听
    if (progressListener) {
      window.electronAPI?.ipcOff(IPC_CHANNELS.GET_PLUGIN_PROGRESS, progressListener)
    }
    if (onItemFinishedListener) {
      window.electronAPI?.ipcOff(IPC_CHANNELS.ON_PLUGIN_ITEM_FINISHED, onItemFinishedListener)
    }

    return BuResult.getPromise(ranTaskResult)
  }

  static async stopExecPlugin(task: PluginExecTask) {
    return BuResult.getPromise(
      (await window.electronAPI?.ipcInvoke(IPC_CHANNELS.STOP_EXEC_PLUGIN, task)) as BuResult<void>,
    )
  }

  /**
   * 插件配置分组
   * @param list 插件配置
   */
  static parsePluginConfigGroup(list: PluginConfig[]): PluginConfigGroup {
    const groupData: PluginConfigGroup = { ...BACKUP_PLUGIN_TYPE }
    for (const key in groupData) {
      groupData[key as BackupPluginTypeKey].list = []
    }

    list.forEach((curr) => groupData[curr.type].list?.push(curr))

    return groupData
  }

  static async openTaskConfigPath(task: PluginExecTask, config: BackupItemConfig, isSource: boolean) {
    return BuResult.getPromise(
      (await window.electronAPI?.ipcInvoke(IPC_CHANNELS.OPEN_TASK_CONFIG_PATH, {
        softName: task.pluginName,
        softInstallDir: task.softInstallDir,
        config: config,
        type: isSource ? 'source' : 'target',
        backupPath: task.backupPath,
      } satisfies OpenTaskConfigPathOptions)) as BuResult<void>,
    )
  }
}
