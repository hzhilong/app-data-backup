import { IPC_CHANNELS } from '@/types/IpcChannels'
import { type InstalledSoftware, SOFTWARE_REGEDIT_GROUP, type SoftwareRegeditGroupKey } from '@/types/Software'
import { db } from '@/db/db'
import { CommonError } from '@/types/CommonError'
import { logger } from '@/utils/logger-util'
import { ipcInvoke } from '@/utils/electron-api'

export default class RegeditUtil {
  static openRegedit(path?: string) {
    if (path) {
      return ipcInvoke<string>(IPC_CHANNELS.OPEN_REGEDIT, path)
    }
    throw new CommonError('注册表路径为空')
  }

  static async getInstalledSoftwareByGroup(path: SoftwareRegeditGroupKey): Promise<InstalledSoftware[]> {
    const list = await ipcInvoke<InstalledSoftware[]>(IPC_CHANNELS.GET_INSTALLED_SOFTWARE, path)
    if (!list || list.length === 0) {
      return []
    }
    for (const soft of list) {
      const iconPath = soft.iconPath
      if (iconPath) {
        // loggerUtil.debug(`软件[${soft.name}]图标路径：${iconPath}`)
        const first = await db.iconCache.where('path').equals(iconPath).first()
        if (first) {
          // loggerUtil.debug(`软件[${soft.name}] 从数据获取到的图标大小：${first.base64.length}`)
          soft.base64Icon = first.base64
        } else {
          try {
            const base64 = await ipcInvoke<string>(IPC_CHANNELS.GET_ICON, iconPath)
            // loggerUtil.debug(`软件[${soft.name}] 获取到的图标大小：${base64?.length}`)
            if (base64) {
              soft.base64Icon = base64
              db.iconCache.put({
                path: iconPath,
                base64: base64,
              })
            }
          } catch (e) {
            logger.error(e)
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
    logger.debug(`结果：RegeditUtil.getInstalledSoftwareList`, all)
    return all
  }
}
