import { h, type VNode } from 'vue'
import type { InstalledSoftware, SoftwareRegeditGroupKey } from '@/types/Software'
import { SOFTWARE_REGEDIT_GROUP } from '@/types/Software'
import defaultIcon from '@/assets/image/software-icon-default.png'
import { createParamOptions, db } from '@/db/db'
import { RouterUtil } from '@/utils/router-util'
import RegeditUtil from '@/utils/regedit-util'
import type { ValidatedPluginConfig } from '@/types/PluginConfig'
import TableUtil from '@/utils/table-util'
import type { TableConfig, Tag } from '@/types/Table'

export type ExtendedInstalledSoftware = InstalledSoftware & {
  supportPlugins?: ValidatedPluginConfig[]
}

type DataType = ExtendedInstalledSoftware

const queryParams = {
  name: {
    title: '名称',
    connector: 'like' as const,
    value: '',
  },
  regeditGroupKey: {
    title: '类型',
    connector: 'eq' as const,
    value: undefined as SoftwareRegeditGroupKey | undefined,
    options: createParamOptions(SOFTWARE_REGEDIT_GROUP, 'title'),
  },
}

export type SoftwareQueryParams = {
  [P in keyof typeof queryParams]?: (typeof queryParams)[P]['value']
}

export function useInstalledSoftwareTable(isExtendData: boolean = true) {
  const tableColumns = [
    {
      label: '图标',
      prop: 'size',
      width: '50',
      align: 'center',
      showOverflowTooltip: true,
      formatter: (row: DataType): VNode | string => {
        return <img src={row.base64Icon ? row.base64Icon : defaultIcon} class="soft-icon" alt="" />
      },
    },
    { label: '软件名', prop: 'name', minWidth: '100', showOverflowTooltip: true, sortable: true },
    { label: '安装日期', prop: 'installDate', width: '90', sortable: true },
    { label: '大小', prop: 'formatSize', width: '70', sortable: true, sortBy: 'size' },
    {
      label: '类型',
      prop: 'regeditGroupKey',
      width: '100',
      formatter: (row: DataType) => {
        return row.regeditGroupKey ? SOFTWARE_REGEDIT_GROUP[row.regeditGroupKey].title : '-'
      },
      sortable: true,
    },
    { label: '版本', prop: 'version', width: '130', showOverflowTooltip: true },
    {
      label: '可备份的内容',
      minWidth: '100',
      showOverflowTooltip: true,
      formatter: (row: DataType) => {
        return TableUtil.createTags(
          row,
          row?.supportPlugins?.map((item) => {
            return {
              text: item.id,
              onClick: (row: DataType) => {
                RouterUtil.gotoPluginConfig({ id: item.id })
              },
            } as Tag<DataType>
          }),
        )
      },
    },
  ]

  const initData = async () => {
    return await RegeditUtil.getInstalledSoftwareList()
  }
  const parseData = async (list: DataType[]): Promise<DataType[]> => {
    if (!isExtendData) {
      return Promise.resolve(list)
    }
    const configs = await db.pluginConfig.toArray()
    const mapConfig = configs.reduce(
      (map, item) => {
        if (item.softRegeditDir) {
          if (map[item.softRegeditDir]) {
            map[item.softRegeditDir].push(item)
          } else {
            map[item.softRegeditDir] = [item]
          }
        }
        return map
      },
      {} as Record<string, ValidatedPluginConfig[]>,
    )
    return list.map((item): DataType => {
      return { ...item, supportPlugins: mapConfig[item.regeditDir] }
    })
  }
  return {
    tableColumns: tableColumns,
    queryParams: queryParams,
    initData: initData,
    table: db.installedSoftware,
    parseData: parseData,
  } as TableConfig<DataType, 'regeditDir'>
}
