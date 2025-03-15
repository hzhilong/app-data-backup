import { CommonError } from '@/models/CommonError'
import dayjs from 'dayjs'
import { type InstalledSoftware } from '@/models/Software'

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
  type: 'file' | 'directory' | 'registry'
  /**
   * 源路径 支持以下环境变量和：
   * %installDir% 软件安装路径 不带/
   */
  sourcePath: string
  /** 目标相对路径 不用关心父文件夹，会自动补全 比如 /.backup/WinRAR/2022-09-19_00-52-09/填写这后面的就行 */
  targetRelativePath: string
  /** 排除的文件名(正则) */
  exclude?: string[]
  /** 如果缺失或失败则跳过 */
  skipIfMissing?: boolean
}

/**
 * 备份的结果
 */
export interface BackupResult {
  /** 备份的配置名 比如【备份设置】 */
  name: string
  success: boolean
  message?: string
  error?: CommonError
  backedUpItems: BackupItem[]
}

/**
 * 备份的操作项
 */
export interface BackupItem extends BackupItemConfig {
  size: number
  sizeStr: string
  meta?: Record<string, unknown>
}

/**
 * 插件类型key
 */
export const BACKUP_PLUGIN_TYPE_KEY = {
  INSTALLER: 'INSTALLER',
  PORTABLE: 'PORTABLE',
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

export type BackupPluginGroup = {
  [P in BackupPluginTypeKey]: {
    [K in keyof (typeof BACKUP_PLUGIN_TYPE)[P]]: (typeof BACKUP_PLUGIN_TYPE)[P][K]
  } & { list?: PluginConfig[] }
}

/**
 * 插件选项
 */
export interface PluginOptions {
  /** 插件执行类型 */
  execType: 'backup' | 'restore'
  /** 软件安装目录，绝对路径 不带/ */
  installDir: string
  /** 数据备份目录 /结尾 */
  dataDir: string
}

/**
 * 任务监听
 */
export interface TaskMonitor {
  /** 进度 */
  progress: (log: string, curr: number, total: number) => void
}

/**
 * 配置属性校验逻辑
 */
const validateConfig = (condition: unknown, message: string): void => {
  if (!condition) throw new CommonError(`插件配置错误，${message}`)
}

/** 插件配置 */
export class PluginConfig {
  /** 类型：内置|自定义*/
  type: BackupPluginTypeKey
  /** 插件唯一标识符 (如：'Everything') */
  id: string
  /** 显示名称 为空则取id */
  name: string
  /** 备份配置 */
  backupConfigs: BackupConfig[]
  /** 总配置数 */
  totalItemNum: number
  /** 创建时间 */
  cTime?: string

  constructor(config: Record<string, unknown>, cTime: string) {
    const { type, id, name, backupConfigs } = config
    validateConfig(typeof type === 'string' && type in BACKUP_PLUGIN_TYPE_KEY, '缺少有效的 type')
    validateConfig(typeof id === 'string', '缺少 id')
    validateConfig(Array.isArray(backupConfigs), '缺少 backupConfigs')
    this.type = type as BackupPluginTypeKey
    this.id = id as string
    this.name = (name ? name : id) as string
    this.backupConfigs = config.backupConfigs as BackupConfig[]
    this.backupConfigs = backupConfigs as BackupConfig[]
    this.totalItemNum = this.backupConfigs.reduce((sum, c) => sum + c.items.length, 0)
    this.cTime = cTime
  }
}

export const DEFAULT_ROOT_DIR = '.backup-data'
/**
 * 获取备份目录
 */
export const getBackupDir = (softName: string, rootDir: string = DEFAULT_ROOT_DIR) =>
  `${rootDir}/${softName}/${dayjs().format('YYYY-MM-DD_HH-mm-ss')}/`

/**
 * 已验证过的插件配置
 */
export class ValidatedPluginConfig extends PluginConfig {
  // type为'INSTALLER'需要关联软件的名称
  softName?: string
  // type为'INSTALLER'需要关联软件的图标
  softBase64Icon?: string
  softInstallDir?: string
  // type为'INSTALLER'需要关联软件的注册表位置
  softRegeditDir?: string

  constructor(config: Record<string, unknown>, cTime: string, soft: InstalledSoftware | string | undefined) {
    super(config, cTime)
    if (!soft) {
    } else if (typeof soft === 'string') {
      this.softInstallDir = soft
    } else {
      this.softName = soft.name
      this.softBase64Icon = soft.base64Icon
      this.softInstallDir = soft.installDir
      this.softRegeditDir = soft.regeditDir
    }
  }
}

/**
 * 我的配置
 */
export class MyPluginConfig extends ValidatedPluginConfig {
  installDir: string

  constructor(
    config: Record<string, unknown>,
    cTime: string,
    soft: InstalledSoftware | string | undefined,
    installDir: string,
  ) {
    super(config, cTime, soft)
    this.installDir = installDir
  }
}
