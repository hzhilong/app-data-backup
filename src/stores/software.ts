import { defineStore } from 'pinia'
import { AllInstalledSoftware, type SoftwareRegeditPath } from '@/models/Software.ts'

export const SoftwareStore = defineStore('SoftwareStore', {
  state: () => {
    return {
      allInstalledSoftware: {} as AllInstalledSoftware,
    }
  },
  getters: {
    getAllInstalledSoftware: (state) => state.allInstalledSoftware,
  },
  actions: {
    setInstalledSoftware(path: SoftwareRegeditPath, typeName: string, list: Software[]) {
      this.allInstalledSoftware[path] = {
        title: typeName,
        list: list,
      }
    },
  },
  persist: true,
})
