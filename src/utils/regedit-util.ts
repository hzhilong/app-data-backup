import BaseUtil from '@/utils/base-util'
import { IPC_CHANNELS } from '../models/IpcChannels.ts'
import {
  AllInstalledSoftware,
  Software,
  SOFTWARE_REGEDIT_DESC,
  SOFTWARE_REGEDIT_PATH,
} from '@/models/Software.ts'
import { SoftwareStore } from '@/stores/software.ts'

export default class RegeditUtil {
  public static async initAllInstalledSoftware(): Promise<AllInstalledSoftware> {
    return new Promise(async (resolve, reject) => {
      try {
        for (const key in SOFTWARE_REGEDIT_PATH) {
          const path = SOFTWARE_REGEDIT_PATH[key]
          const list = await window.electronAPI?.ipcInvoke(IPC_CHANNELS.FIND_ALL_SOFTWARE, path)
          SoftwareStore().setInstalledSoftware(path, SOFTWARE_REGEDIT_DESC[key], list)
        }
        resolve(SoftwareStore().getAllInstalledSoftware)
      } catch (error: unknown) {
        reject(BaseUtil.convertToCommonError(error, '读取注册表失败：'))
      }
    })
  }
}
