import { h } from 'vue'
import { createParamOptions, db, type ParamOptions, type QueryParam } from '@/db/db.ts'
import { BACKUP_PLUGIN_TYPE, type BackupPluginTypeKey, PluginConfig } from '@/plugins/plugin-config.ts'
import { BuResult } from '@/models/BuResult.ts'
import { IPC_CHANNELS } from '@/models/IpcChannels.ts'
import type { TableConfig } from '@/views/table/table.tsx'

export function usePluginConfigTable<V extends Record<string, any>>() {
  const tableColumns = [
    { label: '序号', type: 'index', width: '60', align: 'center' },
    { label: '名称', prop: 'name', minWidth: '200', showOverflowTooltip: true, sortable: true, align: 'center' },
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
    { label: '添加时间', prop: 'cTime', minWidth: '140', showOverflowTooltip: true, sortable: true, align: 'center' },
    {
      label: '备份项目和数量',
      prop: 'type',
      align: 'center',
      minWidth: '200',
      formatter: (row: PluginConfig) => {
        const configs = row.backupConfigs
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} key={row.id}>
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
    },{
      label: '关联的软件',
      prop: 'type',
      align: 'center',
      minWidth: '200',
      formatter: (row: PluginConfig) =>{

      }
  }
  ]

  const queryParams = {
    name: {
      connector: 'like' as const,
      value: '',
    },
    type: {
      connector: 'eq' as const,
      value: undefined as BackupPluginTypeKey | undefined,
      options: createParamOptions(BACKUP_PLUGIN_TYPE, 'title'),
    },
  }
  return {
    entityTable: db.pluginConfig,
    tableColumns: tableColumns,
    queryParams: queryParams,
    async initDBFn(): Promise<PluginConfig[]> {
      return BuResult.getPromise(
        (await window.electronAPI?.ipcInvoke(IPC_CHANNELS.REFRESH_PLUGINS)) as BuResult<PluginConfig[]>,
      )
    },
    persist: false,
  } as TableConfig<PluginConfig, typeof queryParams>
}
