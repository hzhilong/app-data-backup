import { IPC_CHANNELS } from '@/models/IpcChannels'
import {
  BACKUP_PLUGIN_TYPE,
  type BackupPluginGroup,
  type BackupPluginTypeKey,
  type BackupResult,
  getBackupDir,
  MyPluginConfig,
  PluginConfig,
  type TaskMonitor,
} from '@/plugins/plugin-config'
import { CommonError } from '@/models/CommonError'
import { BuResult } from '@/models/BuResult'

async function execPlugin(
  myConfig: MyPluginConfig,
  execType: 'backup' | 'restore',
  monitor: TaskMonitor,
  dataDir?: string,
) {
  if (!dataDir) {
    if (execType === 'restore') {
      throw new CommonError('执行失败，缺少参数[备份目录]')
    } else {
      dataDir = getBackupDir('MusicBee')
    }
  }
  let progressListener
  if (monitor) {
    progressListener = (event: unknown, id: string, log: string, curr: number, total: number) => {
      if (id === myConfig.id) {
        monitor.progress(log, curr, total)
      }
    }
    window.electronAPI?.ipcOn(IPC_CHANNELS.GET_PLUGIN_PROGRESS, progressListener)
  }
  const buResult = (await window.electronAPI?.ipcInvoke(IPC_CHANNELS.EXEC_PLUGIN, myConfig.id, {
    execType: execType,
    installDir: myConfig.installDir,
    dataDir: dataDir,
  })) as BuResult<BackupResult[]>
  // 移除进度监听
  if (progressListener) {
    window.electronAPI?.ipcOff(IPC_CHANNELS.GET_PLUGIN_PROGRESS, progressListener)
  }
  return BuResult.getPromise(buResult)
}

function parsePluginConfigGroup(list: PluginConfig[]): BackupPluginGroup {
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

export { execPlugin, parsePluginConfigGroup }
