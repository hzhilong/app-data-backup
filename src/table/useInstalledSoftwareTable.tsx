import { h, type VNode } from 'vue'
import type { SoftwareRegeditGroupKey } from '@/models/Software.ts'
import { SOFTWARE_REGEDIT_GROUP } from '@/models/Software.ts'
import defaultIcon from '@/assets/image/software-icon-default.png'
import { createParamOptions } from '@/db/db.ts'
import { createTags, type TableConfig, type TableTag } from '@/table/table.tsx'
import { type ExtendedInstalledSoftware, useInstalledSoftwareData } from '@/data/useInstalledSoftwareData.ts'

export function useInstalledSoftwareTable() {
  const tableColumns = [
    {
      label: '图标',
      prop: 'iconPath',
      width: '50',
      align: 'center',
      formatter: (row: ExtendedInstalledSoftware): VNode | string => {
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
      formatter: (row: ExtendedInstalledSoftware) => {
        return row.regeditGroupKey ? SOFTWARE_REGEDIT_GROUP[row.regeditGroupKey].title : '-'
      },
      sortable: true,
    },
    { label: '版本', prop: 'version', minWidth: '80', showOverflowTooltip: true },
    {
      label: '关联的配置',
      prop: 'supportPlugins',
      minWidth: '100',
      showOverflowTooltip: true,
      formatter: (row: ExtendedInstalledSoftware) => {
        return createTags(
          row,
          row?.supportPlugins?.map((item) => {
            return {
              text: item.id,
              onClick: (row: ExtendedInstalledSoftware) => {
                console.log('点击了tag', item)
              },
            } as TableTag<ExtendedInstalledSoftware>
          }),
        )
      },
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
  return {
    tableColumns: tableColumns,
    queryParams: queryParams,
    appData: useInstalledSoftwareData(),
  } as TableConfig<ExtendedInstalledSoftware, typeof queryParams>
}
