import { type AppDataConfig, AppDataType, getAppData } from '@/data/app-data.ts'
import type { InstalledSoftware } from '@/models/Software.ts'
import type { ValidatedPluginConfig } from '@/plugins/plugin-config.ts'
import { db } from '@/db/db.ts'
import RegeditUtil from '@/utils/regedit-util.ts'
import { ref, type Ref } from 'vue'
import { usePluginConfigData } from '@/data/usePluginConfigData.ts'

export type ExtendedInstalledSoftware = InstalledSoftware & {
  supportPlugins?: ValidatedPluginConfig[]
}

export function useInstalledSoftwareData(loading: Ref<boolean> = ref(false), isParseData: boolean = true) {
  const config: AppDataConfig<ExtendedInstalledSoftware[]> = {
    async initData() {
      return await RegeditUtil.getInstalledSoftwareList()
    },
    async parseData(list: ExtendedInstalledSoftware[]): Promise<ExtendedInstalledSoftware[]> {
      const configs = await usePluginConfigData(loading).getList()
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
      console.log('mapConfig', mapConfig)
      return list.map((item): ExtendedInstalledSoftware => {
        return { ...item, supportPlugins: mapConfig[item.regeditDir] }
      })
    },
    cache: false,
    persist: true,
    getPersistData(): Promise<ExtendedInstalledSoftware[]> {
      return db.installedSoftware.toArray()
    },
    setPersistData(data: ExtendedInstalledSoftware[]): Promise<void> {
      return db.installedSoftware.bulkPut(data)
    },
  }
  return getAppData(AppDataType.InstalledSoftware, config, loading, isParseData)
}
