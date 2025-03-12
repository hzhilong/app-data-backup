import { h } from 'vue'
import { db, type QueryParams } from '@/db/db.ts'
import { BACKUP_PLUGIN_TYPE, type BackupPluginTypeKey, PluginConfig } from '@/plugins/plugin-config.ts'
import { BuResult } from '@/models/BuResult.ts'
import { IPC_CHANNELS } from '@/models/IpcChannels.ts'

export function usePluginConfigTable() {
  const tableColumns = [
    { label: '序号', type: 'index', width: '90' },
    { label: '名称', prop: 'name', minWidth: '200', showOverflowTooltip: true, sortable: true },
    {
      label: '类型',
      prop: 'type',
      align: 'center',
      width: '100',
      formatter: (row: PluginConfig) => {
        return row.type ? BACKUP_PLUGIN_TYPE[row.type].title : '-'
      },
      sortable: true,
    },
    { label: '添加时间', prop: 'cTime', minWidth: '200', showOverflowTooltip: true, sortable: true },
    {
      label: '备份项目',
      prop: 'type',
      align: 'center',
      width: '200',
      formatter: (row: PluginConfig) => {
        const configs = row.backupConfigs
        return (
          <>
            {configs.map(({ name, items }) => {
              return (
                <el-tooltip
                  placement="top"
                  v-slots={{
                    content: () => <>{items.map((item) => item.sourcePath).join('<br/>')}</>,
                  }}
                >
                  <span class="">
                    {name}({items.length})
                  </span>
                </el-tooltip>
              )
            })}
          </>
        )
      },
    },
  ]

  const queryParams = {
    name: {
      connector: 'like',
      value: '',
    },
    type: {
      connector: 'eq',
      value: undefined as BackupPluginTypeKey | undefined,
    },
  } as QueryParams
  return {
    entityTable: db.pluginConfig,
    tableColumns: tableColumns,
    queryParams: queryParams,
    async initDBFn(): Promise<PluginConfig[]> {
      return BuResult.getPromise(
        (await window.electronAPI?.ipcInvoke(IPC_CHANNELS.GET_PLUGINS)) as BuResult<PluginConfig[]>,
      )
    },
    persist: false,
  }
}
