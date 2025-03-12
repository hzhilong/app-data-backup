import Dexie, { type Collection, type EntityTable, type IDType, type InsertType, type Table } from 'dexie'
import {
  type AllInstalledSoftware,
  type InstalledSoftware,
  parseInstalledSoftwareGroup,
  SOFTWARE_REGEDIT_GROUP_KEY,
  type SoftwareRegeditGroupKey,
} from '@/models/Software'
import BaseUtil from '@/utils/base-util'
import { type PluginConfig } from '@/plugins/plugin-config'

export type DexieTable<T, TKeyPropName extends keyof T = never, TInsertType = InsertType<T, TKeyPropName>> = Table<
  T,
  IDType<T, TKeyPropName>,
  TInsertType
>
export type DexieQuery<T, TKeyPropName extends keyof T = never, TInsertType = InsertType<T, TKeyPropName>> =
  | Collection<T, IDType<T, TKeyPropName>, TInsertType>
  | Table<T, IDType<T, TKeyPropName>, TInsertType>

export type IconCache = {
  path: string
  base64: string
}

export interface MyConfig extends PluginConfig {
  installDir: string
  // type为'INSTALLER'需要关联软件的注册表位置
  regeditDir?: string
}

export const db = new Dexie('appDataBackupDatabase') as Dexie & {
  installedSoftware: EntityTable<InstalledSoftware>
  iconCache: EntityTable<IconCache>
  pluginConfig: EntityTable<PluginConfig>
  myConfig: EntityTable<MyConfig>
}

db.version(4).stores({
  installedSoftware: 'regeditDir, regeditGroupKey,name', // regeditDir作为主键,同时也是复合索引。
  iconCache: 'path',
  pluginConfig: 'id',
  myConfig: 'id',
})

export type QueryParam = {
  value: any
  connector: 'eq' | 'like'
}

export type QueryParams<T extends Record<string, QueryParam>> = {
  [K in keyof T]: T[K]
}

export class DBUtil {
  static async getAllInstalledSoftware(): Promise<AllInstalledSoftware> {
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
  }

  static query<T>(table: DexieTable<T>, queryParams: QueryParams): Promise<Array<T>> {
    return new Promise<Array<T>>((resolve, reject) => {
      let query: DexieQuery<T> = table
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
            const obj = item as Record<string, unknown>
            if (!obj[key] || !(obj[key] as string).toLowerCase().includes((<string>likeObj[key]).toLowerCase())) {
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

  static reset<T, Key extends keyof T>(table: EntityTable<T, Key>, list: readonly T[]) {
    table.clear()
    if (!list) return
    table.bulkAdd(list).catch((e) => {
      throw BaseUtil.convertToCommonError(e, '写入数据库失败：')
    })
  }
}
