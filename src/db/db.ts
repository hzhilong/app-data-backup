import Dexie, { type EntityTable } from 'dexie'
import {
  type AllInstalledSoftware,
  type InstalledSoftware, parseInstalledSoftwareGroup,
  SOFTWARE_REGEDIT_GROUP_KEY,
  type SoftwareRegeditGroupKey
} from '@/models/Software.ts'
import BaseUtil from '@/utils/base-util.ts'

export type IconCache = {
  path: string,
  base64: string
}

const db = new Dexie('appDataBackupDatabase') as Dexie & {
  installedSoftware: EntityTable<InstalledSoftware>,
  iconCache: EntityTable<IconCache>,
}

db.version(3).stores({
  installedSoftware: '[regeditDir+regeditName], regeditGroupKey,name', // regeditDir+regeditName作为主键,同时也是复合索引。
  iconCache: 'path', // regeditDir+regeditName作为主键,同时也是复合索引。
})

const DBUtil = {
  getAllInstalledSoftware: async (): Promise<AllInstalledSoftware> => {
    return new Promise(async (resolve, reject) => {
      try {
        const allInstalledSoftware: AllInstalledSoftware = {} as AllInstalledSoftware
        for (const key in SOFTWARE_REGEDIT_GROUP_KEY) {
          const groupKey = key as SoftwareRegeditGroupKey
          const list: InstalledSoftware[] = await db.installedSoftware.where({ regeditGroupKey: groupKey }).toArray()
          allInstalledSoftware[groupKey] = parseInstalledSoftwareGroup(groupKey, list)
        }
        resolve(allInstalledSoftware)
      } catch (error: unknown) {
        reject(BaseUtil.convertToCommonError(error, '读取数据库失败：'))
      }
    })
  },
}

export { db, DBUtil }
