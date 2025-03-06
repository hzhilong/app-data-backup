// 插件接口定义
import { CommonError } from '@/common/types/CommonError.ts'
import { formatSize, type InstalledSoftware } from '@/common/types/Software.ts'
import BaseUtil from '@/common/utils/base-util.ts'
import { IPC_CHANNELS } from '@/common/models/IpcChannels.ts'
import { logger } from '@/utils/logger.ts'

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
  exclude: string[]
  /** 如果缺失或失败则跳过 */
  skipIfMissing: boolean
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
    title: '免安装、绿色软件',
    desc: '免安装的绿色软件',
  },
  [BACKUP_PLUGIN_TYPE_KEY.CUSTOM]: {
    title: '自定义',
    desc: '自定义',
  },
} as const

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
 * 线程监听
 */
export type WorkerMonitor = {
  progress?: (curr: number, total: number) => void
  log?: (msg: string) => void
}

/** 基础的插件配置 */
export abstract class BasePlugin {
  /** 类型：内置|自定义*/
  type: BackupPluginTypeKey
  /** 插件唯一标识符 (如：'Everything') */
  id: string
  /** 显示名称 */
  name: string
  /** 备份配置 */
  backupConfigs: BackupConfig[]
  /** 总配置数 */
  totalItemNum: number

  protected constructor(type: BackupPluginTypeKey, id: string, name: string, backupConfigs: BackupConfig[]) {
    this.type = type
    this.id = id
    this.name = name
    this.backupConfigs = backupConfigs
    this.totalItemNum = backupConfigs.reduce((sum, config) => sum + config.items.length, 0)
  }

  /**
   * 验证插件支持的软件源
   * [安装程序]需返回 InstalledSoftware
   * [免安装的]需返回 软件路径
   * [自定义]不调用该方法
   */
  public detect(
    list: InstalledSoftware[],
    env: {
      [key: string]: string | undefined
    },
  ): InstalledSoftware | string | undefined {
    if (this.type === 'INSTALLER') {
      return this.detectOfInstaller(list, env)
    } else if (this.type === 'PORTABLE') {
      return this.detectOfPortable(env)
    }
  }

  /**
   * 验证插件支持的软件源（安装程序）
   */
  public detectOfInstaller(
    list: InstalledSoftware[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    env: {
      [key: string]: string | undefined
    },
  ): InstalledSoftware | undefined {
    if (list?.length > 0) {
      for (const soft of list) {
        if (soft.nameWithoutVersion === this.name) {
          return soft
        }
      }
    }
  }

  /**
   * 验证插件支持的软件源（免安装的） 子类需自己实现
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public detectOfPortable(env: { [key: string]: string | undefined }): string | undefined {
    return undefined
  }

  /** 判断可支持的软件版本 */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public supportableVersion(version: string): boolean {
    return true
  }

  /**
   * 处理中止信号
   */
  protected handleSignal(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw new CommonError('备份操作已被取消')
    }
  }

  /**
   * 构建进度函数
   */
  protected buildProgressFn(monitor?: WorkerMonitor) {
    return (curr: number) => {
      if (monitor && monitor.progress) {
        monitor.progress(curr, this.totalItemNum)
      }
    }
  }

  /**
   * 构建日志函数
   */
  protected buildLogFn(monitor?: WorkerMonitor) {
    return (msg: string) => {
      if (monitor && monitor.log) {
        monitor.log(msg)
      } else {
        logger.debug(msg)
      }
    }
  }

  /**
   * 执行插件
   */
  public async execPlugin(
    options: PluginOptions,
    env: { [key: string]: string | undefined },
    monitor?: WorkerMonitor,
    signal?: AbortSignal,
  ): Promise<BackupResult[]> {
    const log: (msg: string) => void = this.buildLogFn(monitor)
    const progress: (curr: number) => void = this.buildProgressFn(monitor)

    log(`开始备份软件【${this.name}】`)
    const configLength = this.backupConfigs.length
    const results: BackupResult[] = []
    for (let i = 0; i < configLength; i++) {
      const backupConfig = this.backupConfigs[i]
      log(`${i + 1}/${configLength}开始备份软件配置[${backupConfig.name}]`)
      const result: BackupResult = {
        name: backupConfig.name,
        success: true,
        message: '操作成功',
        backedUpItems: [],
      }
      for (const item of backupConfig.items) {
        this.handleSignal(signal)
        try {
          const itemResult: BackupItem = await this.operateData(options, env, item, progress, log, signal)
          result.backedUpItems.push(itemResult)
        } catch (e) {
          result.error = BaseUtil.convertToCommonError(e)
          result.message = `备份失败：${result.error.message}`
          result.success = false
          break
        }
      }
      results.push(result)
    }
    return results
  }

  /**
   * 操作数据
   */
  protected async operateData(
    options: PluginOptions,
    env: { [key: string]: string | undefined },
    item: BackupItemConfig,
    progress: (curr: number) => void,
    log: (msg: string) => void,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signal?: AbortSignal,
  ): Promise<BackupItem> {
    const execType = options.execType
    const [src, des] = [item.sourcePath, item.targetRelativePath]

    log(`开始处理配置项[${src}]`)
    logger.debug(options)
    logger.debug(item)
    let size = -1
    try {
      if (item.type === 'registry') {
        if (execType === 'backup') {
          size = (await window.electronAPI?.ipcInvoke(
            IPC_CHANNELS.EXPORT_REGEDIT,
            src,
            options.dataDir + this.resolvePath(des, env, options.installDir),
          )) as number
        }
      } else {
        size = (await window.electronAPI?.ipcInvoke(
          IPC_CHANNELS.COPY_FILE,
          execType === 'backup' ? this.resolvePath(src, env, options.installDir) : options.dataDir + des,
          execType === 'backup' ? options.dataDir + des : this.resolvePath(src, env, options.installDir),
        )) as number
      }
    } catch (e) {
      if (!item.skipIfMissing) {
        throw e
      }
    }
    if (size < 0) {
      throw new CommonError('暂未支持该配置项')
    }
    return {
      size: size,
      sizeStr: formatSize(size),
      ...item,
    }
  }

  protected resolvePath(path: string, env: { [key: string]: string | undefined }, installDir: string) {
    return path.replace(/%installDir%/g, installDir).replace(/%(\w+)%/g, (_: string, key: string): string => {
      const value = env[key]
      return value !== undefined ? value : `%${key}%`
    })
  }
}
