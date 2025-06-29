<script setup lang="ts">
import { useAppSettingsStore } from '@/stores/app-settings'
import { storeToRefs } from 'pinia'
import { ipcInvoke } from '@/utils/electron-api'
import { IPC_CHANNELS } from '@/types/IpcChannels'
import { db, DBUtil } from '@/db/db'
import { cloneDeep } from 'lodash'
import AppUtil from '@/utils/app-util'
import FileUtil from '@/utils/file-util'
import type { EntityTable } from 'dexie'
import ThemeUtil from '@/utils/theme-util'
import { useBackupTasksStore } from '@/stores/backup-task'
import { useRestoreTasksStore } from '@/stores/restore-task'

const appSettingsStore = useAppSettingsStore()
const { backupRootDir } = storeToRefs(appSettingsStore)

const getAppData = async () => {
  return {
    AppSettings: window.localStorage.getItem('AppSettings') || '',
    AppThemeStore: window.localStorage.getItem('AppThemeStore') || '',
    installedSoftware: cloneDeep(await db.installedSoftware.toArray()),
    iconCache: cloneDeep(await db.iconCache.toArray()),
    pluginConfig: cloneDeep(await db.pluginConfig.toArray()),
    myConfig: cloneDeep(await db.myConfig.toArray()),
    backupTask: cloneDeep(await db.backupTask.toArray()),
    restoreTask: cloneDeep(await db.restoreTask.toArray()),
  }
}

const dataFile = '软件数据备份 Settings.json'

const importLocalStorage = (name: string, data: any) => {
  window.localStorage.setItem(name, JSON.stringify(data))
}

const importData = () => {
  FileUtil.chooseFile({ title: `请选择导出的【${dataFile}】` }).then((res) => {
    if (res.filePaths?.length > 0) {
      ipcInvoke(IPC_CHANNELS.READ_JSON_FILE, res.filePaths[0]).then(async (data: any) => {
        if (!data || !data.AppSettings) {
          AppUtil.showFailedMessage('文件内容出错')
        } else {
          importLocalStorage('AppSettings', data.AppSettings)
          importLocalStorage('AppThemeStore', data.AppThemeStore)

          DBUtil.reset(db.installedSoftware, data.installedSoftware)
          DBUtil.reset(db.iconCache, data.iconCache)
          DBUtil.reset(db.pluginConfig, data.pluginConfig)
          DBUtil.reset(db.myConfig, data.myConfig)
          DBUtil.reset(db.backupTask, data.backupTask)
          DBUtil.reset(db.restoreTask, data.restoreTask)

          await ThemeUtil.initAppTheme()
          await useBackupTasksStore().initData()
          await useRestoreTasksStore().initData()
          await useAppSettingsStore().initData()
          AppUtil.message('导入成功，请重启软件')
        }
      })
    }
  })
  // TODO 根据新环境的软件目录，进行还原
}
const exportData = async () => {
  ipcInvoke(IPC_CHANNELS.WRITE_JSON_FILE, dataFile, await getAppData()).then((res) => {
    ipcInvoke(IPC_CHANNELS.OPEN_PATH, dataFile)
    AppUtil.message('导出成功')
  })
}
</script>

<template>
  <el-button type="primary" @click="importData()">导入</el-button>
  <el-button type="primary" @click="exportData()">导出</el-button>
</template>

<style scoped lang="scss"></style>
