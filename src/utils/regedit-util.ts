import BaseUtil from '@/utils/base-util'
import { IPC_CHANNELS } from '../models/IpcChannels.ts'
import {
  type AllInstalledSoftware,
  type InstalledSoftware,
  type SoftwareRegeditGroupKey,
  SOFTWARE_REGEDIT_GROUP,
} from '@/models/Software.ts'
import { SoftwareStore } from '@/stores/software.ts'

export default class RegeditUtil {
  public static async initAllInstalledSoftware(): Promise<AllInstalledSoftware> {
    return new Promise(async (resolve, reject) => {
      try {
        for (const key in SOFTWARE_REGEDIT_GROUP) {
          const groupKey = key as SoftwareRegeditGroupKey
          const list = (await window.electronAPI?.ipcInvoke(
            IPC_CHANNELS.GET_INSTALLED_SOFTWARE,
            groupKey,
          )) as InstalledSoftware[]
          SoftwareStore().setInstalledSoftware(groupKey, list)
        }
        resolve(SoftwareStore().getAllInstalledSoftware)
      } catch (error: unknown) {
        reject(BaseUtil.convertToCommonError(error, '读取注册表失败：'))
      }
    })
  }
}
