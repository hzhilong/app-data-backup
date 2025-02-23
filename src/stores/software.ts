import { defineStore } from 'pinia'
import {
  type AllInstalledSoftware,
  type InstalledSoftware, SOFTWARE_REGEDIT_GROUP,
  type SoftwareRegeditGroupKey,
  SoftwareUtil
} from '@/models/Software.ts'

type SoftwareStoreState = {
  allInstalledSoftware: AllInstalledSoftware
}

export const SoftwareStore = defineStore('SoftwareStore', {
  state: (): SoftwareStoreState => {
    return {
      allInstalledSoftware: {} as AllInstalledSoftware,
    }
  },
  getters: {
    getAllInstalledSoftware: (state: SoftwareStoreState): AllInstalledSoftware =>
      state.allInstalledSoftware,
  },
  actions: {
    setInstalledSoftware(
      groupKey: SoftwareRegeditGroupKey,
      list: InstalledSoftware[],
    ) {
      const totalSize = list
        ? list.reduce((sum, item) => {
            if (item.size) {
              return sum + item.size
            } else {
              return sum
            }
          }, 0)
        : 0

      this.allInstalledSoftware[groupKey] = {
        title: SOFTWARE_REGEDIT_GROUP[groupKey].title,
        list: list,
        totalNumber: list ? list.length : 0,
        totalSize: SoftwareUtil.formatSize(totalSize),
      }
    },
  },
  persist: false,
})
