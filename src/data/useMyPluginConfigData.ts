import { type AppDataConfig, AppDataType, getAppData } from '@/data/app-data.ts'
import { db, DBUtil, type QueryParam, type QueryParams } from '@/db/db.ts'
import { ref, type Ref } from 'vue'
import type { MyPluginConfig as DataType } from '@/plugins/plugin-config.ts'

export function useMyPluginConfigData<Q extends Record<string, QueryParam> = Record<string, QueryParam>>(
  loading: Ref<boolean> = ref(false),
  isParseData: boolean = true,
  queryParams?: Ref<QueryParams<Q>>,
) {
  const config: AppDataConfig<DataType[]> = {
    cache: false,
    persist: true,
    getPersistData<Q extends Record<string, QueryParam> = Record<string, QueryParam>>(
      queryParams?: QueryParams<Q>,
    ): Promise<DataType[]> {
      return DBUtil.query(db.myConfig, queryParams)
    },
    setPersistData(data: DataType[]): Promise<void> {
      return db.pluginConfig.bulkPut(data)
    },
  }
  return getAppData(AppDataType.PluginConfig, config, loading, isParseData)
}
