import BaseUtil from '@/utils/base-util'
import { IPC_CHANNELS } from '@/models/IpcChannels'
import {
  type AllInstalledSoftware,
  type InstalledSoftware,
  type SoftwareRegeditGroupKey,
  SOFTWARE_REGEDIT_GROUP,
  parseInstalledSoftwareGroup,
} from '@/models/Software'
import { db } from '@/db/db'

export default class RegeditUtil {
  static openRegedit(path?: string) {
    if (path) {
      window.electronAPI?.ipcInvoke(IPC_CHANNELS.OPEN_REGEDIT, path)
    }
  }

  static async getInstalledSoftwareByGroup(path: SoftwareRegeditGroupKey): Promise<InstalledSoftware[]> {
    let list = undefined
    try {
      list = (await window.electronAPI?.ipcInvoke(IPC_CHANNELS.GET_INSTALLED_SOFTWARE, path)) as InstalledSoftware[]
    } catch (error: unknown) {
      throw BaseUtil.convertToCommonError(error, '读取注册表失败：')
    }
    if (!list || list.length === 0) {
      return []
    }
    for (const soft of list) {
      const iconPath = soft.iconPath
      if (iconPath) {
        const first = await db.iconCache.where('path').equals(iconPath).first()
        if (first) {
          soft.base64Icon = first.base64
        } else {
          const base64 = (await window.electronAPI?.ipcInvoke(IPC_CHANNELS.GET_ICON, iconPath)) as string
          if (base64) {
            soft.base64Icon = base64
            db.iconCache.put({
              path: iconPath,
              base64: base64,
            })
          }
        }
      }
    }
    return list
  }

  static async getInstalledSoftwareList(): Promise<InstalledSoftware[]> {
    const all = []
    for (const key in SOFTWARE_REGEDIT_GROUP) {
      const groupKey = key as SoftwareRegeditGroupKey
      const list = await this.getInstalledSoftwareByGroup(groupKey)
      if (list && list.length > 0) {
        all.push(...list)
      }
    }
    return all
  }
}
