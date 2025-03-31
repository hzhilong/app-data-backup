import { IPC_CHANNELS } from '@/types/IpcChannels'
import { type ValidatedPluginConfig } from '@/types/PluginConfig'
import { CommonError } from '@/types/CommonError'
import {
  type OpenPluginConfigSourcePathOptions,
  type OpenPluginConfigTargetPathOptions,
  type PluginExecTask,
  type TaskItemResult,
  type TaskMonitor,
} from '@/types/PluginTask'
import { cloneDeep } from 'lodash'
import AppUtil from '@/utils/app-util'
import { ipcInvoke, ipcOff, ipcOn } from '@/utils/electron-api'

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
      ipcOn(IPC_CHANNELS.GET_PLUGIN_PROGRESS, progressListener)
    }
    // 子项结束监听
    let onItemFinishedListener
    if (task) {
      onItemFinishedListener = (event: unknown, id: string, configName: string, configItemResult: TaskItemResult) => {
        if (id === task.id) {
          monitor.onItemFinished(configName, configItemResult)
        }
      }
      ipcOn(IPC_CHANNELS.ON_PLUGIN_ITEM_FINISHED, onItemFinishedListener)
    }

    // 通知主进程执行任务
    const ranTaskResult = await ipcInvoke<PluginExecTask>(IPC_CHANNELS.EXEC_PLUGIN, task)

    // 移除监听
    if (progressListener) {
      ipcOff(IPC_CHANNELS.GET_PLUGIN_PROGRESS, progressListener)
    }
    if (onItemFinishedListener) {
      ipcOff(IPC_CHANNELS.ON_PLUGIN_ITEM_FINISHED, onItemFinishedListener)
    }

    return ranTaskResult
  }

  static async stopExecPlugin(task: PluginExecTask) {
    return ipcInvoke(IPC_CHANNELS.EXEC_PLUGIN, task)
  }

  static async openPluginConfigSourcePath(options: OpenPluginConfigSourcePathOptions, showFailedMsg: boolean = true) {
    ipcInvoke(IPC_CHANNELS.OPEN_PLUGIN_CONFIG_SOURCE_PATH, cloneDeep(options)).catch((err) => {
      showFailedMsg && AppUtil.handleError(err)
    })
  }

  static async openPluginConfigTargetPath(options: OpenPluginConfigTargetPathOptions, showFailedMsg: boolean = true) {
    ipcInvoke(IPC_CHANNELS.OPEN_PLUGIN_CONFIG_TARGET_PATH, cloneDeep(options)).catch((err) => {
      showFailedMsg && AppUtil.handleError(err)
    })
  }

  /**
   * 更新本地插件
   */
  static async updateLocalPlugins() {
    return ipcInvoke<ValidatedPluginConfig[]>(IPC_CHANNELS.UPDATE_LOCAL_PLUGINS)
  }
}
