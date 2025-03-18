import { type BackupResult, type ValidatedPluginConfig } from '@/plugins/plugin-config.ts'

export type BackupRecordState = 'running' | 'stopped' | 'finished'
export type BackupRecordRunType = 'auto' | 'manual'

export interface BackupRecord {
  id?: number
  runType: BackupRecordRunType
  state: BackupRecordState
  success?: boolean
  message?: string
  config: Omit<ValidatedPluginConfig, 'softBase64Icon'>
  backupResults?: BackupResult[]
  backupPath?: string
  currProgress: number
  totalProgress: number
  progressText: string
  cTime: string
  // 后面都是从config拷贝出来的属性，方便IndexedDB索引
  pluginId: string
  pluginName: string
  softInstallDir: string
}
