import { DBUtil, type DexieTable, type QueryParam, type QueryParams } from '@/db/db.ts'
import TableColumn from 'element-plus/es/components/table/src/tableColumn'
import { h, ref, type Ref, watch } from 'vue'
import { cloneDeep } from 'lodash'
import { type RouteLocationNormalized, type RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router'
import { logger } from '@/utils/logger.ts'
import { from, useObservable } from '@vueuse/rxjs'
import { type InsertType, liveQuery } from 'dexie'
import BaseUtil from '@/utils/base-util.ts'
import { CommonError } from '@/models/CommonError.ts'

export interface TableConfig<T, Q extends Record<string, QueryParam> = Record<string, QueryParam>> {
  initData?: () => Promise<T[]>
  tableColumns: Partial<typeof TableColumn>
  queryParams: QueryParams<Q>
  table: DexieTable<T>
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
  loading?: Ref<boolean>,
  routeQueryKeys?: string[],
) {
  if (!loading) {
    loading = ref(false)
  }

  const parseData = (list: T[]): Promise<T[]> => {
    if (config.parseData) {
      return config.parseData(list)
    }
    return Promise.resolve(list)
  }

  const table = config.table
  const tableColumns = ref(cloneDeep(config.tableColumns))
  const defaultQueryParams: QueryParams<Q> = cloneDeep(config.queryParams)
  const queryParams = ref(cloneDeep(config.queryParams))
  if (routeQueryKeys === undefined) {
    routeQueryKeys = Object.keys(config.queryParams)
  }

  const tableData = useObservable<T[]>(
    from(
      liveQuery<T[]>(async () => {
        logger.debug(`[${table.name}] liveQuery`, queryParams.value)
        return await loadTableData(
          () => {
            return DBUtil.query(table, queryParams.value)
          },
          loading,
          false,
        )
      }),
    ),
  )

  const loadTableData = async (getData: () => Promise<T[]>, tempLoading?: Ref<boolean>, updateData: boolean = true) => {
    try {
      logger.debug(`[${table.name}] loadTableData s`, queryParams.value)
      tempLoading && (tempLoading.value = true)
      let data = await parseData(await getData())
      if(data.length === 0 && config.initData){
        logger.debug(`[${table.name}] loadTableData 数据为空，尝试初始化`, queryParams.value)
        data = await config.initData()
        table.bulkPut(data as InsertType<T, never>[])
      }else{
        if (updateData && tableData && tableData.value) {
          tableData.value.length = 0
          tableData.value.push(...data)
        }
      }
      afterTableRefresh?.(queryParams.value)
      return data
    } catch (e) {
      throw BaseUtil.convertToCommonError(e, `加载[${table.name}]数据失败：`)
    } finally {
      tempLoading && (tempLoading.value = false)
      logger.debug(`[${table.name}] loadTableData e`, queryParams.value)
    }
  }

  // 表格刷新后监听，参数queryParams声明可以使用 typeof queryParams.value
  type AfterTableRefreshListener = (queryParams: typeof config.queryParams) => void
  let afterTableRefresh: AfterTableRefreshListener | undefined = undefined
  const onAfterTableRefresh = (fn: AfterTableRefreshListener) => {
    afterTableRefresh = fn
  }
  const setDefaultQueryParams = () => {
    Object.assign(queryParams.value, cloneDeep(defaultQueryParams))
  }
  const searchData = () => {
    logger.debug(`[${table.name}] searchData`, queryParams.value)
    return loadTableData(
      () => {
        return DBUtil.query(table, queryParams.value)
      },
      loading,
      true,
    )
  }
  const refreshDB = async () => {
    if (!config.initData) {
      throw new CommonError(`内部错误，[${table.name}]无法重置`)
    }
    try {
      logger.debug(`[${table.name}] refreshDB s`, queryParams.value)
      loading && (loading.value = true)
      setDefaultQueryParams()
      table.bulkPut((await config.initData()) as InsertType<T, never>[])
    } finally {
      loading && (loading.value = false)
      logger.debug(`[${table.name}] refreshDB e`, queryParams.value)
    }
  }
  const refreshData = async () => {
    setDefaultQueryParams()
  }
  const initRouteQuery = (
    route: RouteLocationNormalizedLoaded<string | symbol> | RouteLocationNormalized,
    ...keys: string[]
  ): boolean => {
    logger.debug(`[${table.name}] initRouteQuery`, route.query, queryParams.value)
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
          logger.debug(`[${table.name}] 当前组件路由变化`, currRoutePath, router.currentRoute.value.query)
          if (initRouteQuery(router.currentRoute.value, ...routeQueryKeys)) {
            logger.debug(`[${table.name}] 当前组件路由变化参数变更，重新搜索数据`)
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
