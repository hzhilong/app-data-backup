import { type QueryParam, type QueryParams } from '@/db/db.ts'
import TableColumn from 'element-plus/es/components/table/src/tableColumn'
import { h, ref, type Ref, watch } from 'vue'
import { cloneDeep } from 'lodash'
import { type RouteLocationNormalized, type RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router'
import type { AppData } from '@/data/app-data.ts'
import { logger } from '@/utils/logger.ts'

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
  const tableColumns = ref(cloneDeep(config.tableColumns))
  const defaultQueryParams: QueryParams<Q> = cloneDeep(config.queryParams)
  const queryParams = ref(cloneDeep(config.queryParams))
  const tableData: Ref<T[]> = ref([])
  const appData = config.appData
  if (routeQueryKeys === undefined) {
    routeQueryKeys = Object.keys(config.queryParams)
  }

  // 表格刷新前监听，返回false则不刷新。参数queryParams声明可以使用 typeof queryParams.value
  type BeforeTableRefreshListener = (queryParams: typeof config.queryParams) => boolean | void
  let beforeTableRefresh: BeforeTableRefreshListener | undefined = undefined
  const onBeforeTableRefresh = (fn: BeforeTableRefreshListener) => {
    beforeTableRefresh = fn
  }
  // 表格刷新后监听，参数queryParams声明可以使用 typeof queryParams.value
  type AfterTableRefreshListener = (queryParams: typeof config.queryParams) => void
  let afterTableRefresh: AfterTableRefreshListener | undefined = undefined
  const onAfterTableRefresh = (fn: AfterTableRefreshListener) => {
    afterTableRefresh = fn
  }
  const loadTableData = async (getData: () => Promise<T[]>) => {
    if (beforeTableRefresh?.(queryParams.value) === false) {
      return tableData.value
    }
    try {
      loading && (loading.value = true)
      const data = await getData()
      if (config.parseData) {
        tableData.value = await config.parseData(data)
      } else {
        tableData.value = data
      }
      afterTableRefresh?.(queryParams.value)
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
    return await loadTableData(() => {
      return appData.refreshList(queryParams.value)
    })
  }
  const searchData = async () => {
    return await loadTableData(() => {
      return appData.getList(queryParams.value)
    })
  }
  const refreshData = async () => {
    setDefaultQueryParams()
    return searchData()
  }
  const initRouteQuery = (
    route: RouteLocationNormalizedLoaded<string | symbol> | RouteLocationNormalized,
    ...keys: string[]
  ): boolean => {
    logger.debug('initRouteQuery', route.query)
    if (!keys || keys.length === 0) return false
    if ('__refresh' in route.query && route.query['__refresh'] === 'false') {
      return false
    }
    let updated = false
    let emptyQuery = true
    for (let key of keys) {
      if (key in route.query) {
        emptyQuery = false
        if (key in queryParams.value && queryParams.value[key].value !== route.query[key]) {
          queryParams.value[key].value = route.query[key]
          updated = true
        }
      }
    }
    // 路由参数已更新
    if (updated) {
      // 重置其他属性为默认值
      for (let key of keys) {
        if (!(key in route.query) && key in queryParams.value) {
          queryParams.value[key].value = defaultQueryParams[key].value
        }
      }
      return true
      // 路由参数为空
    } else if (emptyQuery) {
      // 判断当前路由参数是否为默认值
      for (let key of keys) {
        if (queryParams.value[key].value !== defaultQueryParams[key].value) {
          queryParams.value[key].value = defaultQueryParams[key].value
          updated = true
        }
      }
      return updated
    }
    return false
  }
  // 初始化路由参数
  if (routeQueryKeys) {
    const router = useRouter()
    const route = useRoute()
    const currRoutePath = route.path
    initRouteQuery(route, ...routeQueryKeys)
    watch(
      () => router.currentRoute.value.path,
      async (query) => {
        if (router.currentRoute.value.path === currRoutePath) {
          logger.debug('当前组件路由变化', currRoutePath, router.currentRoute.value.query)
          if (initRouteQuery(router.currentRoute.value, ...routeQueryKeys)) {
            logger.debug('参数变更，重新搜索数据')
            searchData().then((r) => {})
          }
        }
      },
    )
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
    onBeforeTableRefresh,
    onAfterTableRefresh,
  }
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

export function createTags<T>(row: T, tags: TableTag<T>[] | string[] | undefined, color?: string) {
  if (!tags) {
    return <></>
  }
  if (tags.every((tag) => typeof tag === 'string')) {
    return (
      <div class="table-tag-list">
        {tags.map((tag) => {
          return <el-tag type="primary">{tag}</el-tag>
        })}
      </div>
    )
  } else {
    return (
      <div class="table-tag-list">
        {tags.map((tag) => {
          return (
            <el-tag
              type="primary"
              disable-transitions
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
}
