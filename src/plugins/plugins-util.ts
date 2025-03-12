import { IPC_CHANNELS } from '@/models/IpcChannels'
import { type BackupResult, getBackupDir, MyPluginConfig, type TaskMonitor } from '@/plugins/plugin-config'
import { CommonError } from '@/models/CommonError'
import { BuResult } from '@/models/BuResult'

async function execPlugin(myConfig: MyPluginConfig, execType: 'backup' | 'restore', monitor: TaskMonitor, dataDir?: string) {
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

export { execPlugin }
