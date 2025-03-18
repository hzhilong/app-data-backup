import type { ValidatedPluginConfig } from '@/plugins/plugin-config.ts'
import { useAppSettingsStore } from '@/stores/app-settings.ts'
import dayjs from 'dayjs'
import type { BackupRecord, BackupRecordRunType, BackupRecordState } from '@/models/BackupRecord.ts'
import { reactive, ref } from 'vue'
import { CommonError } from '@/models/CommonError.ts'
import PluginUtil from '@/plugins/plugin-util.ts'
import BaseUtil from '@/utils/base-util.ts'
import { storeToRefs } from 'pinia'
import { useBackupRecordsStore } from '@/stores/backup-record.ts'
import { logger } from '@/utils/logger.ts'

function getCurrDateTime() {
  return dayjs().format('YYYY-MM-DD_HH-mm-ss')
}

/**
 * 获取备份目录
 */
const getBackupDir = (rootDir: string, softName: string, cTime?: string) => {
  if (cTime) {
    return `${rootDir}/${softName}/${cTime}/`
  } else {
    return `${rootDir}/${softName}/${getCurrDateTime()}/`
  }
}

const createBackupRecord = (
  runType: BackupRecordRunType,
  state: BackupRecordState,
  config: Omit<ValidatedPluginConfig, 'softBase64Icon'>,
  cTime: string,
  success?: boolean,
  msg?: string,
  backupPath?: string,
): BackupRecord => {
  return reactive({
    runType: runType,
    state: state,
    success: success,
    message: msg,
    config: reactive({ ...config }),
    currProgress: 0,
    totalProgress: config.totalItemNum,
    progressText: '',
    cTime: cTime,
    backupPath: backupPath,
    pluginId: config.id,
    pluginName: config.name,
    softInstallDir: config.softInstallDir!,
  } satisfies BackupRecord)
}
const createFailedRecord = (
  runType: BackupRecordRunType,
  pluginConfigWithoutIcon: Omit<ValidatedPluginConfig, 'softBase64Icon'>,
  cTime: string,
  msg?: string,
): BackupRecord => {
  return createBackupRecord(runType, 'finished', pluginConfigWithoutIcon, cTime, false, msg)
}

const createRunningRecord = (
  runType: BackupRecordRunType,
  pluginConfigWithoutIcon: Omit<ValidatedPluginConfig, 'softBase64Icon'>,
  cTime: string,
  backupPath?: string,
): BackupRecord => {
  return createBackupRecord(runType, 'running', pluginConfigWithoutIcon, cTime, undefined, undefined, backupPath)
}

async function execConfig(
  runType: BackupRecordRunType,
  execType: 'backup' | 'restore',
  rootDir: string,
  pluginConfig: ValidatedPluginConfig,
  cTime: string,
  configWithoutIcon: Omit<ValidatedPluginConfig, 'softBase64Icon'>,
) {
  const backupPath = getBackupDir(rootDir, pluginConfig.softName!, cTime)
  const backupRecord = createRunningRecord(runType, configWithoutIcon, cTime, backupPath)
  try {
    const backupResults = await PluginUtil.execPlugin(
      pluginConfig,
      execType,
      {
        progress: (log: string, curr: number, total: number) => {
          logger.debug(`${pluginConfig.name} 备份进度 ${curr}/${total} ${log}`)
          if (curr >= total) {
            backupRecord.state = 'finished'
          }
          backupRecord.currProgress = curr
          backupRecord.progressText = log
        },
      },
      backupPath,
    )
    backupRecord.backupResults = reactive(backupResults)
    backupRecord.state = 'finished'

    if (backupResults.some((result) => !result.success)) {
      backupRecord.message = '操作失败'
      backupRecord.success = false
    } else {
      backupRecord.success = true
      backupRecord.message = '操作成功'
    }
    return backupRecord
  } catch (e) {
    return createFailedRecord(runType, pluginConfig, cTime, BaseUtil.getErrorMessage(e))
  }
}

export default class BackupUtil {
  static async backupData(runType: BackupRecordRunType, pluginConfigs: ValidatedPluginConfig[]) {
    if (!pluginConfigs || pluginConfigs.length === 0) {
      throw new CommonError('备份配置为空')
    }
    const rootDir = useAppSettingsStore().backupRootDir
    const { backupRecords } = storeToRefs(useBackupRecordsStore())
    const cTime = getCurrDateTime()
    for (const pluginConfig of pluginConfigs) {
      const { softBase64Icon, ...configWithoutIcon } = pluginConfig
      if (!pluginConfig.softName) {
        backupRecords.value.push(createFailedRecord(runType, configWithoutIcon, cTime, `配置缺少参数 softName`))
      } else {
        backupRecords.value.push(await execConfig(runType, 'backup', rootDir, pluginConfig, cTime, configWithoutIcon))
      }
    }
    return {
      backupRecords,
    }
  }
}
