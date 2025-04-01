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
import PluginUtil from '@/utils/plugin-util'

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

export interface UsePluginConfigTableOptions<T extends boolean = false> {
  // 获取我的配置
  isGetMyPluginConfig: T
  isGetCustom?: boolean
  // 单选、多选
  selection?: boolean
}

export function usePluginConfigTable<T extends boolean = false>(options: UsePluginConfigTableOptions<T>) {
  const { selection, isGetMyPluginConfig, isGetCustom } = options
  type DataType = T extends true ? MyPluginConfig : ValidatedPluginConfig
  const { maxWindow } = storeToRefs(AppSessionStore())
  const cTimeWidth = computed(() => {
    return maxWindow.value ? 140 : 90
  })
  let tableColumns = []
  if (selection) {
    tableColumns.push({
      type: 'selection',
      width: '40',
      minWidth: '40',
      selectable: (row: DataType, index: number) => row.softInstallDir,
    })
  }
  tableColumns.push(
    ...[
      { label: '软件名称', prop: 'name', minWidth: '60', showOverflowTooltip: true, sortable: true },
      { label: '备份配置', prop: 'id', minWidth: '80', showOverflowTooltip: true, sortable: true },
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
          if (isGetMyPluginConfig && row.type === 'CUSTOM') {
            list.push({
              text: '编辑',
              onClick: () => {
                GlobalModal.editMyPluginConfig(row).then(() => {})
              },
            })
          }
          if (isGetMyPluginConfig) {
            if (row.type === 'CUSTOM') {
              list.push({
                text: '删除',
                confirmContent: (row: DataType) => {
                  return `确定删除？`
                },
                onClick: () => {
                  PluginUtil.deleteCustomPlugin(row).then(() => {})
                },
              })
            } else {
              list.push({
                text: '移除',
                confirmContent: (row: DataType) => {
                  return `确定移除？`
                },
                onClick: () => {
                  db.myConfig.delete(row.id)
                },
              })
            }
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
            if (!isGetMyPluginConfig) {
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
  if (isGetMyPluginConfig) {
    return {
      tableColumns: tableColumns,
      queryParams: queryParams,
      table: db.myConfig,
    } as TableConfig<MyPluginConfig, 'id'>
  } else {
    const initData = async (): Promise<DataType[]> => {
      return await ipcInvoke<DataType[]>(IPC_CHANNELS.REFRESH_PLUGINS, await db.installedSoftware.toArray())
    }
    const parseData = async (list: ValidatedPluginConfig[]): Promise<ValidatedPluginConfig[]> => {
      return list.filter((item) => isGetCustom || item.type !== 'CUSTOM')
    }
    const newQueryParams = cloneDeep(queryParams)
    newQueryParams.type.options.CUSTOM = ''
    return {
      tableColumns: tableColumns,
      queryParams: newQueryParams,
      initData: initData,
      parseData: parseData,
      table: db.pluginConfig,
    } as TableConfig<ValidatedPluginConfig, 'id'>
  }
}
