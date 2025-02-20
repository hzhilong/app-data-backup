import BaseUtil from '@/utils/base-util'
import { IPC_CHANNELS } from '../models/IpcChannels.ts'
import {
  type AllInstalledSoftware, Software,
  SOFTWARE_REGEDIT_DESC,
  SOFTWARE_REGEDIT_PATH
} from '@/models/Software.ts'
import { SoftwareStore } from '@/stores/software.ts'

export default class RegeditUtil {
  public static async initAllInstalledSoftware(): Promise<AllInstalledSoftware> {
    return new Promise(async (resolve, reject) => {
      try {
        for (const key in SOFTWARE_REGEDIT_PATH) {
          const typedKey = key as keyof typeof SOFTWARE_REGEDIT_PATH;
          const path = SOFTWARE_REGEDIT_PATH[typedKey]
          const list = await window.electronAPI?.ipcInvoke(IPC_CHANNELS.GET_INSTALLED_SOFTWARE, path) as Software[]
          SoftwareStore().setInstalledSoftware(path, SOFTWARE_REGEDIT_DESC[typedKey], list)
        }
        resolve(SoftwareStore().getAllInstalledSoftware)
      } catch (error: unknown) {
        reject(BaseUtil.convertToCommonError(error, '读取注册表失败：'))
      }
    })
  }
}
