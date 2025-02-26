import BaseUtil from '@/utils/base-util'
import { IPC_CHANNELS } from '../models/IpcChannels'
import {
  type AllInstalledSoftware,
  type InstalledSoftware,
  type SoftwareRegeditGroupKey,
  SOFTWARE_REGEDIT_GROUP,
  parseInstalledSoftwareGroup,
} from '@/models/Software.ts'
import { db } from '@/db/db.ts'

export default class RegeditUtil {

  public static openRegedit(path: string) {
    window.electronAPI?.ipcInvoke(IPC_CHANNELS.OPEN_REGEDIT, path)
  }

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
          for (const installedSoftware of list) {
            const iconPath = installedSoftware.iconPath
            if (iconPath) {
              const first = await db.iconCache.where('path').equals(iconPath).first()
              if (first) {
                installedSoftware.base64Icon = first.base64
              } else {
                const base64 = (await window.electronAPI?.ipcInvoke(IPC_CHANNELS.GET_ICON, iconPath)) as string
                if (base64) {
                  installedSoftware.base64Icon = base64
                  db.iconCache.add({
                    path: iconPath,
                    base64: base64,
                  })
                }
              }
            }
          }
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
