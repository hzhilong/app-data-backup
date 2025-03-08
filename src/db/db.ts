import Dexie, { type Collection, type EntityTable, type InsertType } from 'dexie'
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

db.version(4).stores({
  installedSoftware: 'regeditDir, regeditGroupKey,name', // regeditDir作为主键,同时也是复合索引。
  iconCache: 'path',
})

export type QueryParam = {
  value: unknown
  connector: 'eq' | 'like'
}

export type QueryParams = {
  [key: string]: QueryParam
}

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

  query<T extends Record<string, unknown>>(table: EntityTable<T>, queryParams: QueryParams): Promise<Array<T>> {
  return new Promise<Array<T>>((resolve, reject) => {
    let query: Collection<T, never, InsertType<T, never>> | EntityTable<T> = table
    const eqObj: Record<string, unknown> = {}
    const likeObj: Record<string, unknown> = {}
    if (queryParams) {
      for (const key in queryParams) {
        const queryParam = queryParams[key]
        if (queryParam.value) {
          if (queryParam.connector === 'eq') {
            eqObj[key] = queryParam.value
          } else if (queryParam.connector === 'like') {
            likeObj[key] = queryParam.value
          }
        }
      }
    }
    if (Object.keys(eqObj).length > 0) {
      query = query.where(eqObj)
    }
    if (Object.keys(likeObj).length > 0) {
      query = query.filter((item) => {
        for (const key in likeObj) {
          if (!item[key] || !(item[key] as string).toLowerCase().includes((<string>likeObj[key]).toLowerCase())) {
            return false
          }
        }
        return true
      })
    }
    query
      .toArray()
      .then((results) => {
        resolve(results)
      })
      .catch((reason) => {
        reject(reason)
      })
  })
}
}

export { db, DBUtil }
