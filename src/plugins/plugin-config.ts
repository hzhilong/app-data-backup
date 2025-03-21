import { CommonError } from '@/models/common-error'

/**
 * 备份配置 可根据该配置快速进行备份还原 也可自己实现备份还原方法
 */
export interface BackupConfig {
  /** 备份的配置名 比如【备份设置】 */
  name: string
  /** 备份的操作项目 */
  items: BackupItemConfig[]
}

/**
 * 备份操作项配置
 */
export interface BackupItemConfig {
  /** 备份项目的类型：文件 文件夹 注册表 */
  type: 'file' | 'registry'
  /**
   * 源路径 支持以下环境变量和：
   * %installDir% 软件安装路径 不带/
   */
  sourcePath: string
  /** 目标相对路径，不用关心父文件夹。 比如 /.backup/WinRAR/2022-09-19_00-52-09/填写这后面的就行 */
  targetRelativePath: string
  /** 排除的文件名(正则) */
  exclude?: string[]
  /** 如果缺失或失败则跳过 */
  skipIfMissing?: boolean
}

/**
 * 插件类型key
 */
export const BACKUP_PLUGIN_TYPE_KEY = {
  // 安装的
  INSTALLER: 'INSTALLER',
  // 免安装的
  PORTABLE: 'PORTABLE',
  // 自定义的
  CUSTOM: 'CUSTOM',
} as const

/**
 * 插件类型key
 */
export type BackupPluginTypeKey = keyof typeof BACKUP_PLUGIN_TYPE_KEY

/**
 * 插件类型
 */
export type BackupPluginType = {
  [typeKey in BackupPluginTypeKey]: {
    title: string
    desc: string
  }
}

/**
 * 插件类型
 */
export const BACKUP_PLUGIN_TYPE: BackupPluginType = {
  [BACKUP_PLUGIN_TYPE_KEY.INSTALLER]: {
    title: '安装程序',
    desc: '从注册表读取的已安装软件',
  },
  [BACKUP_PLUGIN_TYPE_KEY.PORTABLE]: {
    title: '便捷软件',
    desc: '免安装、绿色软件',
  },
  [BACKUP_PLUGIN_TYPE_KEY.CUSTOM]: {
    title: '自定义',
    desc: '自定义',
  },
} as const

/**
 * 插件配置
 */
export interface PluginConfig {
  /** 类型：内置|自定义*/
  type: BackupPluginTypeKey
  /** 插件唯一标识符 为空则取文件名 建议设置为【MusicBee设置和插件】这种格式*/
  id: string
  /** 显示名称 为空则取文件名 不建议为空 建议设置为软件名称*/
  name: string
  /** 备份配置 */
  backupConfigs: BackupConfig[]
  /** 总配置数 */
  totalItemNum: number
  /** 创建时间 */
  cTime?: string
}

/**
 * 插件配置组
 */
export type PluginConfigGroup = {
  [P in BackupPluginTypeKey]: {
    [K in keyof (typeof BACKUP_PLUGIN_TYPE)[P]]: (typeof BACKUP_PLUGIN_TYPE)[P][K]
  } & { list?: PluginConfig[] }
}

/**
 * 已验证过的插件配置
 */
export interface ValidatedPluginConfig extends PluginConfig {
  // type为'INSTALLER'需要关联软件的名称
  softName?: string
  // type为'INSTALLER'需要关联软件的图标
  softBase64Icon?: string
  softIconPath?: string
  // 所有类型都需要绑定软件安装路径
  softInstallDir: string
  // type为'INSTALLER'需要关联软件的注册表位置
  softRegeditDir?: string
}

/**
 * 我的配置
 */
export interface MyPluginConfig extends ValidatedPluginConfig {
  softInstallDir: string
}

/**
 * 配置属性校验逻辑
 */
const validateConfig = (condition: unknown, message: string): void => {
  if (!condition) throw new CommonError(`插件配置错误，${message}`)
}

/**
 * 加载插件配置
 * @param config 模块配置
 * @param cTime 创建时间
 * @param fileName 文件名
 */
export function loadPluginConfig(config: Record<string, unknown>, cTime: string, fileName: string): PluginConfig {
  const { id, type, name, backupConfigs } = config

  validateConfig(typeof type === 'string' && type in BACKUP_PLUGIN_TYPE_KEY, '缺少有效的 type')
  validateConfig(Array.isArray(backupConfigs), '缺少 backupConfigs')
  let configs = config.backupConfigs as BackupConfig[]
  const total = configs.reduce((sum, c) => sum + c.items.length, 0)

  return {
    type: type as BackupPluginTypeKey,
    id: id || fileName,
    name: name || fileName,
    backupConfigs: configs,
    totalItemNum: total,
    cTime: cTime,
  } as PluginConfig
}
