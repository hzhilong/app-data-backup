import BaseUtil from '@/utils/base-util'
import { IPC_CHANNELS } from '@/models/ipc-channels'
import { type InstalledSoftware, SOFTWARE_REGEDIT_GROUP, type SoftwareRegeditGroupKey } from '@/models/software'
import { db } from '@/db/db'
import { BuResult } from '@/models/bu-result'
import { CommonError } from '@/models/common-error'

export default class RegeditUtil {
  static openRegedit(path?: string) {
    if (path) {
      return BuResult.getPromise(window.electronAPI?.ipcInvoke(IPC_CHANNELS.OPEN_REGEDIT, path) as BuResult<string>)
    }
    throw new CommonError('注册表路径为空')
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
          const base64 = ((await window.electronAPI?.ipcInvoke(IPC_CHANNELS.GET_ICON, iconPath)) as BuResult<string>)
            .data
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
