import { BACKUP_PLUGIN_TYPE_KEY, type BackupConfig, BasePlugin } from '../plugins.ts'
// ================== 插件配置 start ==================
const typeKey = BACKUP_PLUGIN_TYPE_KEY.INSTALLER
const id = 'WinRAR'
const name = 'WinRAR'
const backupConfigs: BackupConfig[] = [
  {
    name: '设置',
    items: [
      {
        type: 'registry',
        sourcePath: 'HKEY_CURRENT_USER\\SOFTWARE\\WinRAR',
        targetRelativePath: 'Settings.reg',
        skipIfMissing: false,
        exclude: [],
      },
    ],
  },
]
// ================== 插件配置 end ==================

export const plugin = new (class extends BasePlugin {
  constructor() {
    super(typeKey, id, name, backupConfigs)
  }
})()
