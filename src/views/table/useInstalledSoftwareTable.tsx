import { h, type VNode } from 'vue'
import { type InstalledSoftware, SOFTWARE_REGEDIT_GROUP } from '@/models/Software.ts'
import defaultIcon from '@/assets/image/software-icon-default.png'
import RegeditUtil from '@/utils/regedit-util.ts'
import type { SoftwareRegeditGroupKey } from '@/models/Software.ts'
import { createParamOptions, type QueryParams } from '@/db/db.ts'
import { createOptionList, initTable, type TableConfig } from '@/views/table/table.tsx'
import { db } from '@/db/db.ts'
import { usePluginConfigTable } from '@/views/table/usePluginConfigTable.tsx'

export type ExtendedInstalledSoftware = InstalledSoftware & {
  supportPlugins?: ValidatedPluginConfig[]
}

export function useInstalledSoftwareTable<T = ExtendedInstalledSoftware, TE = ExtendedInstalledSoftware>() {
  const tableColumns = [
    {
      label: '图标',
      prop: 'iconPath',
      width: '50',
      align: 'center',
      formatter: (row: T): VNode | string => {
        return <img src={row.base64Icon ? row.base64Icon : defaultIcon} class="soft-icon" alt="" />
      },
    },
    { label: '软件名', prop: 'name', minWidth: '200', showOverflowTooltip: true, sortable: true },
    { label: '安装日期', prop: 'installDate', width: '90', sortable: true },
    { label: '大小', prop: 'formatSize', width: '70', sortable: true, sortBy: 'size' },
    {
      label: '类型',
      prop: 'regeditGroupKey',
      width: '100',
      formatter: (row: T) => {
        return row.regeditGroupKey ? SOFTWARE_REGEDIT_GROUP[row.regeditGroupKey].title : '-'
      },
      sortable: true,
    },
    { label: '版本', prop: 'version', minWidth: '80', showOverflowTooltip: true },
    {
      label: '关联的配置',
      prop: 'supportPlugins',
      minWidth: '100',
    },
  ]

  const queryParams = {
    name: {
      connector: 'like' as const,
      value: '',
    },
    regeditGroupKey: {
      connector: 'eq' as const,
      value: undefined as SoftwareRegeditGroupKey | undefined,
      options: createParamOptions(SOFTWARE_REGEDIT_GROUP, 'title'),
    },
  }
  const parseData = async (list: TE[]): TE => {
    let table = initTable(usePluginConfigTable())
    const configs = await table.refreshDB()
    const mapConfig = configs.reduce((map, item) => {
      if (map[item.softRegeditDir]) {
        map[item.softRegeditDir].push(item)
      } else {
        map[item.softRegeditDir] = [item]
      }
      return map
    }, {})
    console.log(mapConfig)
    return list.map((item): ExtendedInstalledSoftware => {
      return { ...item, supportPlugins: mapConfig[item.regeditDir] }
    })
  }
  return {
    entityTable: db.installedSoftware,
    tableColumns: tableColumns,
    queryParams: queryParams,
    async initDBFn(): Promise<T[]> {
      return RegeditUtil.getInstalledSoftwareList()
    },
    parseData: parseData,
    persist: import.meta.env.DEV,
  } as TableConfig<TE, typeof queryParams>
}
