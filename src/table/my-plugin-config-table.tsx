import { computed, h } from 'vue'
import { createParamOptions, db } from '@/db/db'
import {
  BACKUP_PLUGIN_TYPE,
  type BackupPluginTypeKey,
  type MyPluginConfig,
  type MyPluginConfig as DataType,
} from '@/plugins/plugin-config'
import { createOptionList, type TableConfig, type TableOptionBtn } from '@/table/table'
import defaultIcon from '@/assets/image/software-icon-default.png'
import { AppSessionStore } from '@/stores/app-session'
import { storeToRefs } from 'pinia'
import { RouterUtil } from '@/router/router-util'
import type { IDType } from 'dexie'
import { logger } from '@/utils/logger'
import { emitter } from '@/utils/emitter'
import AppUtil from '@/utils/app-util'
import BackupUtil from '@/utils/backup-util'

const queryParams = {
  id: {
    connector: 'like' as const,
    value: '',
  },
  type: {
    connector: 'eq' as const,
    value: undefined as BackupPluginTypeKey | undefined,
    options: createParamOptions(BACKUP_PLUGIN_TYPE, 'title'),
  },
}

export type MyPluginConfigQueryParams = {
  [P in keyof typeof queryParams]?: (typeof queryParams)[P]['value']
}

export function useMyPluginConfigTable() {
  const { maxWindow } = storeToRefs(AppSessionStore())
  const cTimeWidth = computed(() => {
    return maxWindow.value ? 140 : 90
  })
  const tableColumns = [
    { label: '配置', fixed: true, prop: 'id', minWidth: '80', showOverflowTooltip: true, sortable: true },
    {
      label: '类型',
      prop: 'type',
      width: '80',
      formatter: (row: DataType) => {
        return row.type ? BACKUP_PLUGIN_TYPE[row.type].title : '-'
      },
      sortable: true,
    },
    {
      label: '添加时间',
      prop: 'cTime',
      width: cTimeWidth,
      sortable: true,
      formatter: (row: DataType) => {
        return (
          <el-tooltip
            placement="top"
            v-slots={{
              content: () => <>{row.cTime}</>,
            }}
          >
            {maxWindow.value ? row.cTime : row.cTime?.split(' ')[0]}
          </el-tooltip>
        )
      },
    },
    {
      label: '备份项目和数量',
      prop: 'type',
      formatter: (row: DataType) => {
        const configs = row.backupConfigs
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} key={row.id}>
            {configs.map(({ name, items }) => {
              return (
                <el-tooltip
                  placement="top"
                  v-slots={{
                    content: () => (
                      <>
                        {items.map((item, index) => (
                          <div key={index}>{item.sourcePath}</div>
                        ))}
                      </>
                    ),
                  }}
                >
                  <span class="">
                    {name}({items.length})
                  </span>
                </el-tooltip>
              )
            })}
          </div>
        )
      },
    },
    {
      label: '关联的软件',
      prop: 'softName',
      showOverflowTooltip: true,
      minWidth: '100',
      formatter: (row: DataType) => {
        if (row.type === 'INSTALLER') {
          if (row.softInstallDir) {
            return (
              <div
                class="bind-soft"
                onClick={() => {
                  RouterUtil.gotoSoft({ name: row.softName })
                }}
              >
                <img src={row.softBase64Icon || defaultIcon} class="soft-icon" alt="" />
                {row.softName}
              </div>
            )
          } else {
            return '-'
          }
        } else {
          return <div style={{ color: 'red' }}>{row.softInstallDir}</div>
        }
      },
    },
    {
      label: '操作',
      minWidth: '100',
      formatter: (row: DataType) => {
        const list: TableOptionBtn<DataType>[] = []
        list.push({
          text: '移除',
          confirmContent: (row: DataType) => {
            return `是否从我的配置中移除[${row.id}]？`
          },
          onClick: () => {
            db.myConfig.delete(row.id as IDType<MyPluginConfig, never>)
          },
        })
        if(row.softInstallDir){
          list.push({
            text: '备份',
            onClick: (data: MyPluginConfig, e?: MouseEvent) => {
              AppUtil.message('已添加备份任务')
              emitter.emit('exec-backup', {
                clientX: e!.clientX,
                clientY: e!.clientY,
              })
              BackupUtil.startBackupData('manual', [data]).then((r) => {})
            },
          })
        }
        return createOptionList(row, list)
      },
    },
  ]

  return {
    tableColumns: tableColumns,
    queryParams: queryParams,
    table: db.myConfig,
  } as TableConfig<DataType, typeof queryParams>
}
