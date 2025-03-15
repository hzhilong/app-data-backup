import { type AppDataConfig, AppDataType, getAppData } from '@/data/app-data.ts'
import { db, DBUtil, type QueryParam, type QueryParams } from '@/db/db.ts'
import { BuResult } from '@/models/BuResult.ts'
import { IPC_CHANNELS } from '@/models/IpcChannels.ts'
import { useInstalledSoftwareData } from '@/data/useInstalledSoftwareData.ts'
import { ref, type Ref } from 'vue'
import type { ValidatedPluginConfig as DataType } from '@/plugins/plugin-config.ts'

export function usePluginConfigData<Q extends Record<string, QueryParam> = Record<string, QueryParam>>(
  loading: Ref<boolean> = ref(false),
  isParseData: boolean = true,
  queryParams?: Ref<QueryParams<Q>>,
) {
  const config: AppDataConfig<DataType[]> = {
    async initData(): Promise<DataType[]> {
      return BuResult.getPromise(
        (await window.electronAPI?.ipcInvoke(
          IPC_CHANNELS.REFRESH_PLUGINS,
          await useInstalledSoftwareData(undefined, false).getList(),
        )) as BuResult<DataType[]>,
      )
    },
    parseData(list: DataType[]): Promise<DataType[]> {
      return Promise.resolve(list)
    },
    cache: false,
    persist: true,
    getPersistData<Q extends Record<string, QueryParam> = Record<string, QueryParam>>(
      queryParams?: QueryParams<Q>,
    ): Promise<DataType[]> {
      return DBUtil.query(db.pluginConfig, queryParams)
    },
    setPersistData(data: DataType[]): Promise<void> {
      return db.pluginConfig.bulkPut(data)
    },
  }
  return getAppData(AppDataType.PluginConfig, config, loading, isParseData)
}
