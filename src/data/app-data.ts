// app 数据
// 部分需要缓存到数据库，在这里统一管理
import { AppDataStore } from '@/stores/app-data-state.ts'
import { ref, type Ref } from 'vue'

// 所有的数据类型
export enum AppDataType {
  InstalledSoftware = 'InstalledSoftware',
  PluginConfig = 'PluginConfig',
}

export type AppDataConfig<T> = {
  // 初始化数据
  initData: () => Promise<T>
  // 额外解析数据
  parseData?: (list: T) => Promise<T>
  // 全局缓存
  cache: boolean
  // 是否持久化，默认 false
  persist: boolean
  // 获取持久化数据
  getPersistData: () => Promise<T>
  // 设置持久化数据
  setPersistData: (data: T) => Promise<void>
}

export type AppData<T> = {
  // 获取列表数据，有缓存就读缓存(cache=true)，没缓存读数据库(persist=true)，数据库没有就初始化(initData)
  getList: () => Promise<T>
  // 刷新列表数据（重写初始化并更新数据库和缓存）
  refreshList: () => Promise<T>
}

const allAppData = new Map<AppDataType, any>()

export function getAppData<T>(
  type: AppDataType,
  config: AppDataConfig<T>,
  loading: Ref<boolean> = ref(false),
  isParseData: boolean = false
): AppData<T> {
  const { isInitialized, initialized } = AppDataStore()
  // 更新缓存
  const updateCache = (data: T) => {
    if (config.cache) {
      allAppData.set(type, data)
    }
    return data
  }
  const parseData = async (data: T) => {
    if (isParseData && config.parseData) {
      return await config.parseData(data)
    }
    return Promise.resolve(data)
  }
  const refreshList = async (updateLoading: boolean = true) => {
    try {
      if (updateLoading) loading.value = true
      // 初始化
      let data = await config.initData()
      // 持久化
      if (config.persist) {
        await config.setPersistData(data)
        initialized(type, true)
      }
      // 解析后缓存
      return updateCache(await parseData(data))
    } finally {
      if (updateLoading) loading.value = false
    }
  }
  const getList = async (): Promise<T> => {
    try {
      loading.value = true
      if (config.cache && allAppData.has(type)) {
        // 有缓存
        return allAppData.get(type)
      } else if (config.persist) {
        // 需要持久化
        if (isInitialized(type)) {
          // 已持久化，直接获取接着解析，最后更新缓存
          return updateCache(await parseData(await config.getPersistData()))
        } else {
          // 未持久化，刷新
          return await refreshList(false)
        }
      } else {
        // 没有缓存，刷新
        return await refreshList(false)
      }
    } finally {
      loading.value = false
    }
  }
  return {
    refreshList,
    getList,
  }
}
