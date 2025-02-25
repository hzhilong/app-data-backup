import BaseUtil from '@/utils/base-util'
import { IPC_CHANNELS } from '../models/IpcChannels.ts'
import {
  type AllInstalledSoftware,
  type InstalledSoftware,
  type SoftwareRegeditGroupKey,
  SOFTWARE_REGEDIT_GROUP,
  parseInstalledSoftwareGroup,
} from '@/models/Software.ts'

export default class RegeditUtil {
  public static async getAllInstalledSoftware(): Promise<AllInstalledSoftware> {
    return new Promise(async (resolve, reject) => {
      const allInstalledSoftware: AllInstalledSoftware = {} as AllInstalledSoftware
      for (const key in SOFTWARE_REGEDIT_GROUP) {
        const groupKey = key as SoftwareRegeditGroupKey
        try {
          const list = (await window.electronAPI?.ipcInvoke(
            IPC_CHANNELS.GET_INSTALLED_SOFTWARE,
            groupKey,
          )) as InstalledSoftware[]
          allInstalledSoftware[groupKey] = parseInstalledSoftwareGroup(groupKey, list)
        } catch (error: unknown) {
          reject(BaseUtil.convertToCommonError(error, '读取注册表失败：'))
          return
        }
      }
      resolve(allInstalledSoftware)
    })
  }
}
