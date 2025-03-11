import { defineStore } from 'pinia'
import { type EntityTable } from 'dexie'
import { CommonError } from '@/models/CommonError.ts'
import { type TableConfig } from '@/views/table/table.tsx'

export type DbInitInfo = {
  lastTime: Date
}

export type DbInitState = {
  persist: {
    [dbName: string]: DbInitInfo
  }
  session: {
    [dbName: string]: DbInitInfo
  }
}

export const DbInitStore = defineStore('DbInitStore', {
  state: (): DbInitState => {
    return {
      // 持久化 只自动初始化一次
      persist: {},
      // 会话级别，每次打开APP查看都会自动初始化一次
      session: {},
    }
  },
  actions: {
    isInit<T>(config: TableConfig<T>) {
      if (config.persist) {
        return config.entityTable.name in this.persist
      } else {
        return config.entityTable.name in this.session
      }
    },
    noInit<T>(config: TableConfig<T>) {
      if (config.persist) {
        delete this.persist[config.entityTable.name]
      } else {
        delete this.session[config.entityTable.name]
      }
    },
    initialized<T>(config: TableConfig<T>, flag = true) {
      let table = config.entityTable
      const name = table.name
      if (flag) {
        const info: DbInitInfo = {
          lastTime: new Date(),
        }
        if (config.persist) {
          this.persist[name] = info
        } else {
          this.session[name] = info
        }
      } else {
        this.noInit(config)
      }
    },
  },
  persist: {
    pick: ['persist'],
  },
})
