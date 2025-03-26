import type { DexieTable, QueryParam, QueryParams } from '@/db/db'
import type { InsertType } from 'dexie'
import TableColumn from 'element-plus/es/components/table/src/tableColumn'
import type { Ref } from 'vue'

/**
 * 表格配置
 */
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

/**
 * 初始化选项
 */
export interface InitTableOptions {
  // 加载状态
  loading?: Ref<boolean>
  // 路由参数，为空则知道根据查询参数创建
  routeQueryKeys?: string[]
  // 尝试初始化（db.count=0>调用表格配置的initData）
  isTryInit?: boolean
}

/**
 * 标签
 */
export interface Tag<T> {
  text: string
  onClick?: (row: T, e?: MouseEvent) => void
}

/**
 * 操作按钮
 */
export interface OptionButton<T> {
  text: string
  onClick: (row: T, e?: MouseEvent) => void
  confirmContent?: (row: T) => string
}
