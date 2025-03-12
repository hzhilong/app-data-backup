import { DBUtil, type QueryParams } from '@/db/db.ts'
import TableColumn from 'element-plus/es/components/table/src/tableColumn'
import { ref, type Ref } from 'vue'
import { cloneDeep, merge } from 'lodash'
import { type EntityTable } from 'dexie'
import { DbInitStore } from '@/stores/db-init.ts'
import {
  type LocationQuery,
  type NavigationGuardNext,
  onBeforeRouteUpdate,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded,
  useRoute,
} from 'vue-router'

export interface TableConfig<T, Q extends Record<string, QueryParam>> {
  entityTable: EntityTable<T>
  tableColumns: Partial<typeof TableColumn>
  queryParams: QueryParams<Q>
  initDBFn: () => Promise<T[]>
  // 持久化？默认 false，每次打开APP第一次查看数据都会自动调用 initDBFn 进行初始化
  persist: boolean
}

/**
 * 初始化表格，返回各种响应式数据
 * @param config 表格配置
 * @param loading 加载状态
 * @param routeQueryKeys 路由查询参数（首次加载组件和路由更新时会进行判断）
 */
export function initTable<T, Q extends Record<string, QueryParam>>(config: TableConfig<T, Q>, loading: Ref<boolean> = ref(false), routeQueryKeys?: string[]) {
  const defaultQueryParams = config.queryParams
  const tableColumns = ref(cloneDeep(config.tableColumns))
  const queryParams = ref(cloneDeep(config.queryParams))
  const tableData = ref([])
  const tableDB = config.entityTable
  const { isInit, initialized } = DbInitStore()
  const needInit: boolean = !isInit(config)

  const loadTableData = async (getData: () => Promise<T[]>) => {
    try {
      loading && (loading.value = true)
      const data = await getData()
      tableData.value = data
      return data
    } finally {
      loading && (loading.value = false)
    }
  }
  const setDefaultQueryParams = () => {
    merge(queryParams.value, defaultQueryParams)
  }
  const refreshDB = async () => {
    const data = await loadTableData(config.initDBFn)
    DBUtil.reset(tableDB, data)
    initialized(config, true)
    return data
  }
  const searchData = async () => {
    return await loadTableData(() => DBUtil.query(tableDB, queryParams.value))
  }
  const refreshData = async () => {
    setDefaultQueryParams()
    return searchData()
  }
  // 初始化路由参数
  if (routeQueryKeys) {
    const route = useRoute()
    initRouteQuery(config, route, routeQueryKeys)
    onBeforeRouteUpdate(
      (to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded, next: NavigationGuardNext) => {
        // 路由更新时参数改变就搜索
        if (initRouteQuery(config, route, 'regeditGroupKey')) {
          searchData().then((r) => {})
        }
      },
    )
  }
  if (needInit) {
    refreshDB().then((r) => {})
  } else {
    refreshData().then((r) => {})
  }
  return {
    tableColumns,
    queryParams,
    tableData,
    loading,
    loadTableData,
    setDefaultQueryParams,
    refreshDB,
    searchData,
    refreshData,
  }
}

/**
 * 根据路由参数初始化表格查询参数，有变化则返回true
 */
export function initRouteQuery<T>(
  config: TableConfig<T>,
  route: RouteLocationNormalizedLoaded<string | symbol> | RouteLocationNormalized,
  ...keys: string[]
) {
  let updated = false
  for (let key of keys) {
    if (key in route.query && key in config.queryParams && config.queryParams[key].value !== route.query[key]) {
      config.queryParams[key].value = route.query[key]
      updated = true
    }
  }
  return updated
}
