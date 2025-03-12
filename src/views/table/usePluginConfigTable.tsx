import { h } from 'vue'
import { createParamOptions, db, type ParamOptions, type QueryParam } from '@/db/db.ts'
import { BACKUP_PLUGIN_TYPE, type BackupPluginTypeKey, ValidatedPluginConfig } from '@/plugins/plugin-config.ts'
import { BuResult } from '@/models/BuResult.ts'
import { IPC_CHANNELS } from '@/models/IpcChannels.ts'
import type { TableConfig } from '@/views/table/table.tsx'
import defaultIcon from '@/assets/image/software-icon-default.png'

export function usePluginConfigTable() {
  const tableColumns = [
    { label: '序号', type: 'index', width: '60', align: 'center' },
    { label: '名称', prop: 'name', minWidth: '80', showOverflowTooltip: true, sortable: true, align: 'center' },
    {
      label: '类型',
      prop: 'type',
      align: 'center',
      width: '80',
      formatter: (row: ValidatedPluginConfig) => {
        return row.type ? BACKUP_PLUGIN_TYPE[row.type].title : '-'
      },
      sortable: true,
    },
    { label: '添加时间', prop: 'cTime', width: '140', showOverflowTooltip: true, sortable: true, align: 'center' },
    {
      label: '备份项目和数量',
      prop: 'type',
      align: 'center',
      minWidth: '120',
      formatter: (row: ValidatedPluginConfig) => {
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
    },
    {
      label: '关联的软件',
      prop: 'installDir',
      align: 'center',
      minWidth: '100',
      formatter: (row: ValidatedPluginConfig) => {
        if (row.type === 'INSTALLER') {
          if (row.softInstallDir) {
            return (
              <div style={{ color: 'blue', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                <img src={row.softBase64Icon ?? defaultIcon} class="soft-icon" alt="" />
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
    async initDBFn(): Promise<ValidatedPluginConfig[]> {
      return BuResult.getPromise(
        (await window.electronAPI?.ipcInvoke(
          IPC_CHANNELS.REFRESH_PLUGINS,
          await db.installedSoftware.toArray(),
        )) as BuResult<ValidatedPluginConfig[]>,
      )
    },
    persist: import.meta.env.DEV,
  } as TableConfig<ValidatedPluginConfig, typeof queryParams>
}
