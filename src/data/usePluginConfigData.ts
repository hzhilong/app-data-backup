import { type AppDataConfig, AppDataType, getAppData } from '@/data/app-data.ts'
import type { ValidatedPluginConfig } from '@/plugins/plugin-config.ts'
import { db, DBUtil, type QueryParam, type QueryParams } from '@/db/db.ts'
import { BuResult } from '@/models/BuResult.ts'
import { IPC_CHANNELS } from '@/models/IpcChannels.ts'
import { useInstalledSoftwareData } from '@/data/useInstalledSoftwareData.ts'
import { ref, type Ref } from 'vue'

export function usePluginConfigData<Q extends Record<string, QueryParam> = Record<string, QueryParam>>(
  loading: Ref<boolean> = ref(false),
  isParseData: boolean = true,
  queryParams?: Ref<QueryParams<Q>>,
) {
  const config: AppDataConfig<ValidatedPluginConfig[]> = {
    async initData(): Promise<ValidatedPluginConfig[]> {
      return BuResult.getPromise(
        (await window.electronAPI?.ipcInvoke(
          IPC_CHANNELS.REFRESH_PLUGINS,
          await useInstalledSoftwareData(undefined, false).getList(),
        )) as BuResult<ValidatedPluginConfig[]>,
      )
    },
    parseData(list: ValidatedPluginConfig[]): Promise<ValidatedPluginConfig[]> {
      return Promise.resolve(list)
    },
    cache: false,
    persist: true,
    getPersistData<Q extends Record<string, QueryParam> = Record<string, QueryParam>>(
      queryParams?: QueryParams<Q>,
    ): Promise<ValidatedPluginConfig[]> {
      return DBUtil.query(db.pluginConfig, queryParams)
    },
    setPersistData(data: ValidatedPluginConfig[]): Promise<void> {
      return db.pluginConfig.bulkPut(data)
    },
  }
  return getAppData(AppDataType.PluginConfig, config, loading, isParseData)
}
