import { defineStore } from 'pinia'
import {
  type AllInstalledSoftware,
  Software,
  SOFTWARE_REGEDIT_DESC,
  SOFTWARE_REGEDIT_PATH,
  type SoftwareRegeditPath,
  type SoftwareRegeditPathKey,
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
    setInstalledSoftware(pathKey: SoftwareRegeditPathKey, list: Software[]) {
      const totalSize = list
        ? list.reduce((sum, item) => {
            if (item.size) {
              return sum + item.size
            } else {
              return sum
            }
          }, 0)
        : 0

      this.allInstalledSoftware[pathKey] = {
        title: SOFTWARE_REGEDIT_DESC[pathKey],
        list: list,
        totalNumber: list ? list.length : 0,
        totalSize: Software.formatSize(totalSize),
      }
    },
  },
  persist: true,
})
