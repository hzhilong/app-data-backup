// app 数据
// 部分需要缓存到数据库，在这里统一管理
export type AppDataConfig<T> = {
  // 是否持久化，默认 false
  persist: boolean
  // 额外解析数据
  parseData?: (list: T) => Promise<T>
  initData: () => Promise<T>
}

export type AppData<T> = {
  // 获取列表数据，有缓存就读缓存，没缓存读数据库(persist=true)，数据库没有就初始化
  getList: () => Promise<T>
  // 初始化列表数据
  initList: () => Promise<T>
}

const allAppData = new Map<AppDataConfig<any>, any>
