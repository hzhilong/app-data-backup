import { type QueryParams, type QueryParam } from '@/db/db.ts'
import TableColumn from 'element-plus/es/components/table/src/tableColumn'
import { h, onMounted, ref, type Ref } from 'vue'
import { cloneDeep } from 'lodash'
import {
  type NavigationGuardNext,
  onBeforeRouteUpdate,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded,
  useRoute,
} from 'vue-router'
import type { AppData } from '@/data/app-data.ts'

export interface TableConfig<T, Q extends Record<string, QueryParam> = Record<string, QueryParam>> {
  tableColumns: Partial<typeof TableColumn>
  queryParams: QueryParams<Q>
  appData: AppData<T[]>
  // 额外解析数据
  parseData?: (list: T[]) => Promise<T[]>
}

/**
 * 初始化表格，返回各种响应式数据
 * @param config 表格配置
 * @param loading 加载状态
 * @param routeQueryKeys 路由查询参数（首次加载组件和路由更新时会进行判断）
 */
export function initTable<T, Q extends Record<string, QueryParam>>(
  config: TableConfig<T, Q>,
  loading: Ref<boolean> = ref(false),
  routeQueryKeys?: string[],
) {
  const defaultQueryParams = config.queryParams
  const tableColumns = ref(cloneDeep(config.tableColumns))
  const queryParams = ref(cloneDeep(config.queryParams))
  const tableData: Ref<T[]> = ref([])
  let appData = config.appData

  const loadTableData = async (getData: () => Promise<T[]>) => {
    console.log('load tableData')
    try {
      loading && (loading.value = true)
      const data = await getData()
      if (config.parseData) {
        tableData.value = await config.parseData(data)
      } else {
        tableData.value = data
      }
      return data
    } finally {
      loading && (loading.value = false)
    }
  }
  const setDefaultQueryParams = () => {
    Object.assign(queryParams.value, cloneDeep(defaultQueryParams))
  }
  const refreshDB = async () => {
    setDefaultQueryParams()
    return await loadTableData(appData.refreshList)
  }
  const searchData = async () => {
    return await loadTableData(appData.getList)
  }
  const refreshData = async () => {
    setDefaultQueryParams()
    return searchData()
  }
  // 初始化路由参数
  if (routeQueryKeys) {
    const route = useRoute()
    initRouteQuery(config, route, ...routeQueryKeys)
    onBeforeRouteUpdate(
      (to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded, next: NavigationGuardNext) => {
        // 路由更新时参数改变就搜索
        if (initRouteQuery(config, route, 'regeditGroupKey')) {
          searchData().then((r) => {})
        }
      },
    )
  }
  onMounted(() => {
    searchData().then((r) => {})
  })
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

/**
 * 表格操作按钮
 */
export interface TableOptionBtn<T> {
  text: string
  onClick: (row: T) => void
}

export function createOptionList<T>(row: T, list: TableOptionBtn<T>[]) {
  return (
    <div class="table-option-list">
      {list.map((item) => {
        return (
          <span
            class="table-option-btn"
            onClick={(e) => {
              item.onClick(row)
            }}
          >
            {item.text}
          </span>
        )
      })}
    </div>
  )
}

export interface TableTag<T> {
  text: string
  onClick?: (row: T) => void
}

export function createTags<T>(row: T, tags: TableTag<T>[] | undefined, color?: string) {
  if (!tags) {
    return <></>
  }
  return (
    <div class="table-tag-list">
      {tags.map((tag) => {
        return (
          <el-tag
            type="primary"
            style={{ cursor: tag.onClick ? 'pointer' : 'unset' }}
            onClick={() => {
              if (tag.onClick) {
                tag.onClick(row)
              }
            }}
          >
            {tag.text}
          </el-tag>
        )
      })}
    </div>
  )
}
