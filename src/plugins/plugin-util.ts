import { IPC_CHANNELS } from '@/models/IpcChannels'
import {
  BACKUP_PLUGIN_TYPE,
  type BackupPluginGroup,
  type BackupPluginTypeKey,
  type BackupResult,
  type PluginConfig,
  type TaskMonitor,
  type ValidatedPluginConfig,
} from '@/plugins/plugin-config'
import { CommonError } from '@/models/CommonError'
import { BuResult } from '@/models/BuResult'

export default class PluginUtil {
  // 执行插件
  static async execPlugin(
    validatedPluginConfig: ValidatedPluginConfig,
    execType: 'backup' | 'restore',
    monitor: TaskMonitor,
    backupPath: string,
  ) {
    if (!validatedPluginConfig.softInstallDir) {
      throw new CommonError('执行失败，缺少参数[安装目录]')
    }
    if (!backupPath) {
      throw new CommonError('执行失败，缺少参数[备份目录]')
    }
    let progressListener
    if (monitor) {
      progressListener = (event: unknown, id: string, log: string, curr: number, total: number) => {
        if (id === validatedPluginConfig.id) {
          monitor.progress(log, curr, total)
        }
      }
      window.electronAPI?.ipcOn(IPC_CHANNELS.GET_PLUGIN_PROGRESS, progressListener)
    }
    const buResult = (await window.electronAPI?.ipcInvoke(IPC_CHANNELS.EXEC_PLUGIN, validatedPluginConfig.id, {
      execType: execType,
      installDir: validatedPluginConfig.softInstallDir,
      dataDir: backupPath,
    })) as BuResult<BackupResult[]>
    // 移除进度监听
    if (progressListener) {
      window.electronAPI?.ipcOff(IPC_CHANNELS.GET_PLUGIN_PROGRESS, progressListener)
    }
    return BuResult.getPromise(buResult)
  }

  static parsePluginConfigGroup(list: PluginConfig[]): BackupPluginGroup {
    const groupData: BackupPluginGroup = {
      ...BACKUP_PLUGIN_TYPE,
    }
    for (const key in groupData) {
      const type = key as BackupPluginTypeKey
      groupData[type].list = []
    }
    list.reduce((group, curr) => {
      groupData[curr.type].list?.push(curr)
      return groupData
    }, groupData)
    return groupData
  }
}
