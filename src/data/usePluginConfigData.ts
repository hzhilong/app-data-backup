import { type AppDataConfig, AppDataType, getAppData } from '@/data/app-data.ts'
import type { ValidatedPluginConfig } from '@/plugins/plugin-config.ts'
import { db } from '@/db/db.ts'
import { BuResult } from '@/models/BuResult.ts'
import { IPC_CHANNELS } from '@/models/IpcChannels.ts'
import { useInstalledSoftwareData } from '@/data/useInstalledSoftwareData.ts'
import { ref, type Ref } from 'vue'

export function usePluginConfigData(loading: Ref<boolean> = ref(false), isParseData: boolean = true) {
  const config: AppDataConfig<ValidatedPluginConfig[]> = {
    async initData(): Promise<ValidatedPluginConfig[]> {
      return BuResult.getPromise(
        (await window.electronAPI?.ipcInvoke(
          IPC_CHANNELS.REFRESH_PLUGINS,
          await useInstalledSoftwareData().getList(),
        )) as BuResult<ValidatedPluginConfig[]>,
      )
    },
    parseData(list: ValidatedPluginConfig[]): Promise<ValidatedPluginConfig[]> {
      return Promise.resolve(list)
    },
    cache: true,
    persist: true,
    getPersistData(): Promise<ValidatedPluginConfig[]> {
      return db.pluginConfig.toArray()
    },
    setPersistData(data: ValidatedPluginConfig[]): Promise<void> {
      return db.pluginConfig.bulkPut(data)
    },
  }
  return getAppData(AppDataType.PluginConfig, config, loading, isParseData)
}
