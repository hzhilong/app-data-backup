import { computed, h } from 'vue'
import { createParamOptions, db } from '@/db/db'
import {
  BACKUP_PLUGIN_TYPE,
  type BackupPluginTypeKey,
  type MyPluginConfig,
  type ValidatedPluginConfig,
} from '@/types/PluginConfig'
import defaultIcon from '@/assets/image/software-icon-default.png'
import { AppSessionStore } from '@/stores/app-session'
import { storeToRefs } from 'pinia'
import { RouterUtil } from '@/utils/router-util'
import AppUtil from '@/utils/app-util'
import { logger } from '@/utils/logger-util'
import { cloneDeep } from 'lodash'
import { IPC_CHANNELS } from '@/types/IpcChannels'
import BaseUtil from '@/utils/base-util'
import { eventBus } from '@/utils/event-bus'
import BackupUtil from '@/utils/backup-util'
import { GlobalModal } from '@/components/modal/global-modal'
import type { IDType } from 'dexie'
import { ipcInvoke } from '@/utils/electron-api'
import TableUtil from '@/utils/table-util'
import type { OptionButton, TableConfig } from '@/types/Table'

const queryParams = {
  id: {
    title: '名称',
    connector: 'like' as const,
    value: '',
  },
  type: {
    title: '类型',
    connector: 'eq' as const,
    value: undefined as BackupPluginTypeKey | undefined,
    options: createParamOptions(BACKUP_PLUGIN_TYPE, 'title'),
  },
}

export type PluginConfigQueryParams = {
  [P in keyof typeof queryParams]?: (typeof queryParams)[P]['value']
}

export function usePluginConfigTable<T extends boolean = false>(selection: boolean, getMyPluginConfig: T) {
  type DataType = T extends true ? MyPluginConfig : ValidatedPluginConfig
  const { maxWindow } = storeToRefs(AppSessionStore())
  const cTimeWidth = computed(() => {
    return maxWindow.value ? 140 : 90
  })
  let tableColumns = []
  if (selection) {
    tableColumns.push({
      type: 'selection',
      fixed: true,
      width: '40',
      minWidth: '40',
      selectable: (row: DataType, index: number) => row.softInstallDir,
    })
  }
  tableColumns.push(
    ...[
      { label: '配置', fixed: !selection, prop: 'id', minWidth: '80', showOverflowTooltip: true, sortable: true },
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
                  class="bind-installed-soft"
                  onClick={() => {
                    RouterUtil.gotoSoft({ name: row.softName })
                  }}
                >
                  <img src={row.softBase64Icon || defaultIcon} class="bind-installed-soft__icon" alt="" />
                  {row.softName}
                </div>
              )
            } else {
              return '-'
            }
          } else {
            return (
              <div
                class="bind-soft-path"
                onClick={() => {
                  AppUtil.openPath(row.softInstallDir).then()
                }}
              >
                {row.softInstallDir}
              </div>
            )
          }
        },
      },
      {
        label: '操作',
        minWidth: '100',
        formatter: (row: DataType) => {
          const list: OptionButton<DataType>[] = []
          list.push({
            text: '查看',
            onClick: () => {
              GlobalModal.showPluginConfig([row], {
                showCancel: false,
              }).then((r) => {})
            },
          })
          if (getMyPluginConfig) {
            list.push({
              text: '移除',
              confirmContent: (row: DataType) => {
                return `是否从我的配置中移除[${row.id}]？`
              },
              onClick: () => {
                db.myConfig.delete(row.id as IDType<MyPluginConfig, never>)
              },
            })
          }
          if (row.softInstallDir) {
            list.push({
              text: '备份',
              onClick: (data: MyPluginConfig, e?: MouseEvent) => {
                AppUtil.message('已添加备份任务')
                eventBus.emit('exec-backup', {
                  clientX: e!.clientX,
                  clientY: e!.clientY,
                })
                BackupUtil.startBackupData('manual', [data], true).then((r) => {})
              },
            })
            if (!getMyPluginConfig) {
              list.push({
                text: '添加到我的配置',
                onClick: () => {
                  const data = cloneDeep(row as MyPluginConfig)
                  data.cTime = BaseUtil.getFormatedDateTime()
                  logger.debug('添加到我的配置', data)
                  db.myConfig
                    .bulkPut([data])
                    .then(() => {
                      AppUtil.message('添加成功')
                    })
                    .catch((e) => {
                      logger.debug(e)
                    })
                },
              })
            }
          }
          return TableUtil.createOptions(row, list)
        },
      },
    ],
  )
  if (getMyPluginConfig) {
    return {
      tableColumns: tableColumns,
      queryParams: queryParams,
      table: db.myConfig,
    } as TableConfig<MyPluginConfig, 'id'>
  } else {
    const initData = async (): Promise<DataType[]> => {
      return ipcInvoke<DataType[]>(IPC_CHANNELS.REFRESH_PLUGINS, await db.installedSoftware.toArray())
    }
    return {
      tableColumns: tableColumns,
      queryParams: queryParams,
      initData: initData,
      table: db.pluginConfig,
    } as TableConfig<ValidatedPluginConfig, 'id'>
  }
}
