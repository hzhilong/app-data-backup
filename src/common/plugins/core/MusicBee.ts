import { BACKUP_PLUGIN_TYPE_KEY, type BackupConfig, BasePlugin } from '../plugins.ts'
// ================== 插件配置 start ==================
const typeKey = BACKUP_PLUGIN_TYPE_KEY.INSTALLER
const id = 'MusicBee'
const name = 'MusicBee'
const backupConfigs: BackupConfig[] = [
  {
    name: '插件',
    items: [
      {
        type: 'directory',
        sourcePath: '%installDir%/Plugins',
        targetRelativePath: 'Plugins',
      },
    ],
  },
  {
    name: '设置',
    items: [
      {
        type: 'file',
        sourcePath: '%APPDATA%/MusicBee/MusicBee3Settings.ini',
        targetRelativePath: 'MusicBee3Settings.ini',
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
