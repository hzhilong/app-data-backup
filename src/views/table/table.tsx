import { DBUtil, type QueryParams } from '@/db/db.ts'
import TableColumn from 'element-plus/es/components/table/src/tableColumn'
import { ref, type Ref } from 'vue'
import { cloneDeep, merge } from 'lodash'
import { type EntityTable } from 'dexie'
import { DbInitStore } from '@/stores/db-init.ts'
import type { LocationQuery, RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router'

export interface TableConfig<T> {
  entityTable: EntityTable<T>
  tableColumns: Partial<typeof TableColumn>
  queryParams: QueryParams
  initDBFn: () => Promise<T[]>
  // 持久化？默认 false，每次打开APP第一次查看数据都会自动调用 initDBFn 进行初始化
  persist: boolean
}

export function initTableView<T>(config: TableConfig<T>, loading: Ref<boolean> = ref(false)) {
  const defaultQueryParams = config.queryParams
  const tableColumns = ref(config.tableColumns)
  const queryParams: Ref<QueryParams> = ref(cloneDeep(config.queryParams))
  const tableData: Ref<T[]> = ref([])
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
