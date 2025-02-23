// db.js
import Dexie, { type EntityTable } from 'dexie'
import {
  type AllInstalledSoftware,
  type InstalledSoftware,
  SOFTWARE_REGEDIT_GROUP_KEY,
  type SoftwareRegeditGroupKey,
  SoftwareUtil,
} from '@/models/Software.ts'
import BaseUtil from '@/utils/base-util.ts'

const db = new Dexie('appDataBackupDatabase') as Dexie & {
  installedSoftware: EntityTable<InstalledSoftware>
}

db.version(1).stores({
  installedSoftware: '[regeditDir+regeditName], regeditGroupKey', // regeditDir+regeditName作为主键,同时也是复合索引。
})

const DBUtil = {
  getAllInstalledSoftware: async (): Promise<AllInstalledSoftware> => {
    return new Promise(async (resolve, reject) => {
      try {
        const allInstalledSoftware: AllInstalledSoftware = {} as AllInstalledSoftware
        for (const key in SOFTWARE_REGEDIT_GROUP_KEY) {
          const groupKey = key as SoftwareRegeditGroupKey
          const list: InstalledSoftware[] = await db.installedSoftware.where({ regeditGroupKey: groupKey }).toArray()
          allInstalledSoftware[groupKey] = SoftwareUtil.parseInstalledSoftwareGroup(groupKey, list)
        }
        resolve(allInstalledSoftware)
      } catch (error: unknown) {
        reject(BaseUtil.convertToCommonError(error, '读取数据库失败：'))
      }
    })
  },
}

export { db, DBUtil }
