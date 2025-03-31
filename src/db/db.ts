import Dexie, { type Collection, type EntityTable, type IDType, type InsertType, type Table } from 'dexie'
import { type InstalledSoftware } from '@/types/Software'
import BaseUtil from '@/utils/base-util'
import { logger } from '@/utils/logger-util'
import type { PluginExecTask } from '@/types/PluginTask'
import type { MyPluginConfig, ValidatedPluginConfig } from '@/types/PluginConfig'

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

export const db = new Dexie('appDataBackupDatabase') as Dexie & {
  installedSoftware: EntityTable<InstalledSoftware, 'regeditDir'>
  iconCache: EntityTable<IconCache, 'path'>
  pluginConfig: EntityTable<ValidatedPluginConfig, 'id'>
  myConfig: EntityTable<MyPluginConfig, 'id'>
  backupTask: EntityTable<PluginExecTask, 'id'>
  restoreTask: EntityTable<PluginExecTask, 'id'>
}

db.version(11).stores({
  installedSoftware: 'regeditDir, regeditGroupKey,name', // regeditDir作为主键,同时也是复合索引。
  iconCache: 'path',
  pluginConfig: 'id,type,name',
  myConfig: 'id,type,name',
  backupTask: '++id,[pluginId+cTime],runType,state,finished,success,pluginId,pluginName,softInstallDir,cTime',
  restoreTask: '++id,[pluginId+cTime],runType,state,finished,success,pluginId,pluginName,softInstallDir,cTime',
})

export type QueryParam = {
  title: string
  value: any
  connector: 'eq' | 'like'
  options?: Record<string, any>
}

export function createParamOptions<O extends Record<string, any>, OVK extends string = never>(
  data: O,
  vKey: OVK,
): ParamOptions<O, OVK> {
  if (!vKey) {
    return data
  }
  const ret: ParamOptions<O, OVK> = {} as ParamOptions<O, OVK>
  for (let key in data) {
    const value = data[key]
    if (vKey in value) {
      ret[key] = value[vKey]
    } else {
      ret[key] = value
    }
  }
  return ret
}

export type QueryParams = {
  [K: string]: QueryParam
}

export type ParamOptions<O extends Record<string, any>, OVK extends string = never> = {
  [P in keyof O]: OVK extends never // 如果没有传入 OVK
    ? O[P] // 原样返回字段类型
    : O[P] extends Record<string, any> // 如果传入了 OVK 并且 O[P] 是对象
      ? O[P][OVK] // 提取对象中 OVK 字段的值
      : O[P] // 如果字段不是对象，原样返回
}

export class DBUtil {
  static query<
    T,
    TKeyPropName extends keyof T = never,
    TInsertType = InsertType<T, TKeyPropName>,
  >(table: DexieTable<T, TKeyPropName>, queryParams?: QueryParams): Promise<Array<T>> {
    logger.debug('DBUtil query', table.name, queryParams)
    if (!queryParams) {
      return table.toArray()
    }
    let query: DexieQuery<T, TKeyPropName> = table
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
    return query.toArray()
  }

  static reset<T, Key extends keyof T>(table: EntityTable<T, Key>, list: readonly T[]) {
    return db.transaction('rw', table, () => {
      table.clear()
      if (!list) return
      table.bulkAdd(list).catch((e) => {
        throw BaseUtil.convertToCommonError(e, '写入数据库失败：')
      })
    })
  }
}
