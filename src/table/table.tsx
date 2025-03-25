import { db, DBUtil, type DexieTable, type QueryParam, type QueryParams } from '@/db/db'
import TableColumn from 'element-plus/es/components/table/src/tableColumn'
import { h, onMounted, ref, type Ref, watch, nextTick, onUnmounted } from 'vue'
import { cloneDeep } from 'lodash'
import { type RouteLocationNormalized, type RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router'
import { logger } from '@/utils/logger'
import type { Subscription as DexieSubscription } from 'dexie'
import { type InsertType, liveQuery } from 'dexie'
import BaseUtil from '@/utils/base-util'
import { CommonError } from '@/models/common-error'
import { Subscription } from 'rxjs'
import AppUtil from '@/utils/app-util'

export interface TableConfig<
  T,
  Q extends Record<string, QueryParam> = Record<string, QueryParam>,
  TKeyPropName extends keyof T = never,
  TInsertType = InsertType<T, TKeyPropName>,
> {
  initData?: () => Promise<T[]>
  tableColumns: Partial<typeof TableColumn>
  queryParams: QueryParams<Q>
  table: DexieTable<T, TKeyPropName>
  parseData?: (list: T[]) => Promise<T[]>
}

export interface InitTableOptions {
  // 加载状态
  loading?: Ref<boolean>
  // 路由参数，为空则知道根据查询参数创建
  routeQueryKeys?: string[]
  // 尝试初始化（db.count=0>调用表格配置的initData）
  isTryInit?: boolean
}

/**
 * 初始化表格，返回各种响应式数据
 * @param config 表格配置
 * @param options
 */
export function initTable<
  T,
  Q extends Record<string, QueryParam>,
  TKeyPropName extends keyof T = never,
  TInsertType = InsertType<T, TKeyPropName>,
>(config: TableConfig<T, Q, TKeyPropName>, options?: InitTableOptions) {
  // 获取参数
  let loading = options?.loading
  let routeQueryKeys = options?.routeQueryKeys
  const isTryInit = options?.isTryInit
  // loading为空的话则新建
  if (loading === undefined) {
    loading = ref(false)
  }
  // 构建解析数据的方法，避免后续频繁判断
  const parseData = (list: T[]): Promise<T[]> => {
    if (config.parseData) {
      return config.parseData(list)
    }
    return Promise.resolve(list)
  }
  // 准备表格相关的数据
  const table = config.table
  // 表格列
  const tableColumns = ref(cloneDeep(config.tableColumns))
  // 默认查询参数
  const defaultQueryParams: QueryParams<Q> = cloneDeep(config.queryParams)
  // 查询参数
  const queryParams = ref(cloneDeep(config.queryParams))
  // 路由参数
  if (routeQueryKeys === undefined) {
    routeQueryKeys = Object.keys(config.queryParams)
  }
  // 表格响应式数据
  const tableData: Ref<T[]> = ref([])
  // 创建自动实时查询
  const createLiveQuery = () => {
    // 初始化数据库实时查询并赋值给tableData
    return liveQuery<T[]>(async () => {
      logger.debug(`[${table.name}] liveQuery start`, queryParams.value)
      try {
        loading.value = true
        let data = await parseData(await DBUtil.query(table, queryParams.value))
        afterTableRefresh?.(queryParams.value)
        logger.debug(`[${table.name}] liveQuery result`, data)
        tableData.value.length = 0
        tableData.value.push(...data)
        return data
      } finally {
        loading.value = false
        logger.debug(`[${table.name}] liveQuery end`, queryParams.value)
      }
    })
  }
  let subscription: DexieSubscription | null = null
  // 开始查询
  const startQuery = () => {
    if (subscription) return
    const observable = createLiveQuery()
    subscription = observable.subscribe({
      next: (data) => {
        tableData.value = data
      },
      error: (err) => {
        AppUtil.showErrorMessage(err)
      },
    })
  }
  // 结束查询
  const stopQuery = () => {
    subscription?.unsubscribe()
    subscription = null
  }

  // 表格刷新后监听，参数queryParams声明可以使用 typeof queryParams.value
  type AfterTableRefreshListener = (queryParams: typeof config.queryParams) => void
  let afterTableRefresh: AfterTableRefreshListener | undefined = undefined
  const onAfterTableRefresh = (fn: AfterTableRefreshListener) => {
    afterTableRefresh = fn
  }
  // 设置默认参数
  const setDefaultQueryParams = () => {
    Object.assign(queryParams.value, cloneDeep(defaultQueryParams))
  }
  // 查询数据
  const searchData = async () => {
    try {
      logger.debug(`[${table.name}] searchData start`, queryParams.value)
      loading.value = true
      let data = await parseData(await DBUtil.query(table, queryParams.value))
      if (tableData && tableData.value) {
        tableData.value = data
      }
      afterTableRefresh?.(queryParams.value)
      return data
    } catch (e) {
      throw BaseUtil.convertToCommonError(e, `加载[${table.name}]数据失败：`)
    } finally {
      loading.value = false
      logger.debug(`[${table.name}] searchData end`, queryParams.value)
    }
  }
  // 刷新数据
  const refreshData = async () => {
    setDefaultQueryParams()
    searchData().then((data) => {})
  }
  // 刷新数据库
  const refreshDB = async () => {
    if (!config.initData) {
      throw new CommonError(`内部错误，[${table.name}]无法重置`)
    }
    try {
      logger.debug(`[${table.name}] refreshDB start`)
      loading.value = true
      setDefaultQueryParams()
      let items = await config.initData()
      await db.transaction('rw', table, async () => {
        table.clear()
        table.bulkPut(items)
      })
      return items
    } catch (e) {
      throw BaseUtil.convertToCommonError(e, `加载[${table.name}]数据失败：`)
    } finally {
      loading.value = false
      logger.debug(`[${table.name}] refreshDB end`)
    }
  }
  // 初始化路由查询参数
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

  if (isTryInit) {
    onMounted(async () => {
      try {
        if (tableData.value === undefined || tableData.value.length === 0) {
          if ((await table.count()) === 0) {
            logger.debug(`即将初始化表格数据 ${table.name}`)
            await refreshDB()
          }
        }
      } catch (e) {
        throw BaseUtil.convertToCommonError(e, `加载[${table.name}]数据失败：`)
      } finally {
        startQuery()
      }
    })
  } else {
    startQuery()
  }

  onUnmounted(() => {
    stopQuery()
  })

  return {
    tableColumns,
    queryParams,
    tableData,
    loading,
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
  onClick: (row: T, e?: MouseEvent) => void
  confirmContent?: (row: T) => string
}

export function createOptionList<T>(row: T, list: TableOptionBtn<T>[]) {
  return (
    <div class="table-option-list">
      {list.map((item) => {
        if (item.confirmContent) {
          return (
            <el-popconfirm
              title={item.confirmContent(row)}
              confirmButtonText="Yes"
              cancelButtonText="No"
              hideIcon
              onConfirm={(e: MouseEvent) => {
                item.onClick(row, e)
              }}
              v-slots={{
                reference: () => <span class="table-option-btn">{item.text}</span>,
              }}
            ></el-popconfirm>
          )
        } else {
          return (
            <span
              class="table-option-btn"
              onClick={(e) => {
                item.onClick(row, e)
              }}
            >
              {item.text}
            </span>
          )
        }
      })}
    </div>
  )
}

export interface TableTag<T> {
  text: string
  onClick?: (row: T, e?: MouseEvent) => void
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
              onClick={(e: MouseEvent) => {
                if (tag.onClick) {
                  tag.onClick(row, e)
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
