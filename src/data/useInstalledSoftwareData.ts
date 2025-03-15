import { type AppDataConfig, AppDataType, getAppData } from '@/data/app-data.ts'
import type { InstalledSoftware } from '@/models/Software.ts'
import type { ValidatedPluginConfig } from '@/plugins/plugin-config.ts'
import { db, DBUtil, type QueryParam, type QueryParams } from '@/db/db.ts'
import RegeditUtil from '@/utils/regedit-util.ts'
import { ref, type Ref } from 'vue'
import { usePluginConfigData } from '@/data/usePluginConfigData.ts'

export type ExtendedInstalledSoftware = InstalledSoftware & {
  supportPlugins?: ValidatedPluginConfig[]
}

type DataType = ExtendedInstalledSoftware

export function useInstalledSoftwareData(loading: Ref<boolean> = ref(false), isParseData: boolean = true) {
  const config: AppDataConfig<DataType[]> = {
    async initData() {
      return await RegeditUtil.getInstalledSoftwareList()
    },
    async parseData(list: DataType[]): Promise<DataType[]> {
      const configs = await usePluginConfigData(loading, false).getList()
      const mapConfig = configs.reduce(
        (map, item) => {
          if (item.softRegeditDir) {
            if (map[item.softRegeditDir]) {
              map[item.softRegeditDir].push(item)
            } else {
              map[item.softRegeditDir] = [item]
            }
          }
          return map
        },
        {} as Record<string, ValidatedPluginConfig[]>,
      )
      return list.map((item): DataType => {
        return { ...item, supportPlugins: mapConfig[item.regeditDir] }
      })
    },
    cache: false,
    persist: true,
    getPersistData<Q extends Record<string, QueryParam> = Record<string, QueryParam>>(
      queryParams?: QueryParams<Q>,
    ): Promise<DataType[]> {
      return DBUtil.query(db.installedSoftware, queryParams)
    },
    setPersistData(data: DataType[]): Promise<void> {
      return db.installedSoftware.bulkPut(data)
    },
  }
  return getAppData(AppDataType.InstalledSoftware, config, loading, isParseData)
}
