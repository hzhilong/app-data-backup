import { h, type VNode } from 'vue'
import { type InstalledSoftware, SOFTWARE_REGEDIT_GROUP } from '@/models/Software.ts'
import defaultIcon from '@/assets/image/software-icon-default.png'
import RegeditUtil from '@/utils/regedit-util.ts'
import type { SoftwareRegeditGroupKey } from '@/models/Software.ts'
import type { QueryParams } from '@/db/db.ts'
import type { TableConfig } from '@/views/table/table.tsx'
import { db } from '@/db/db.ts'

export function useInstalledSoftwareTable() {
  const tableColumns = [
    {
      label: '图标',
      prop: 'iconPath',
      width: '50',
      align: 'center',
      formatter: (row: InstalledSoftware): VNode | string => {
        return <img src={row.base64Icon ? row.base64Icon : defaultIcon} class="soft-icon" alt="" />
      },
    },
    { label: '软件名', prop: 'name', minWidth: '200', showOverflowTooltip: true, sortable: true },
    { label: '安装日期', prop: 'installDate', width: '90', align: 'center', sortable: true },
    { label: '大小', prop: 'formatSize', align: 'center', width: '70', sortable: true, sortBy: 'size' },
    {
      label: '类型',
      prop: 'regeditGroupKey',
      align: 'center',
      width: '100',
      formatter: (row: InstalledSoftware) => {
        return row.regeditGroupKey ? SOFTWARE_REGEDIT_GROUP[row.regeditGroupKey].title : '-'
      },
      sortable: true,
    },
    { label: '版本', prop: 'version', width: '80', showOverflowTooltip: true },
    {
      label: '操作',
      prop: 'iconPath',
      minWidth: '100',
      align: 'center',
      formatter: (row: InstalledSoftware): VNode | string => {
        return (
          <div class="table-opt-btns">
            <span
              class="table-opt-btn"
              onClick={() => {
                RegeditUtil.openRegedit(row.regeditDir)
              }}
            >
              测试
            </span>
          </div>
        )
      },
    },
  ]

  const queryParams = {
    name: {
      connector: 'like',
      value: '',
    },
    regeditGroupKey: {
      connector: 'eq',
      value: undefined as SoftwareRegeditGroupKey | undefined,
    },
  }
  return {
    entityTable: db.installedSoftware,
    tableColumns: tableColumns,
    queryParams: queryParams,
    async initDBFn(): Promise<InstalledSoftware[]> {
      return RegeditUtil.getInstalledSoftwareList()
    },
    persist: false,
  } as TableConfig<InstalledSoftware, typeof queryParams>
}
