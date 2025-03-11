// 插件接口定义
import { CommonError } from '@/models/CommonError'
import { formatSize, type InstalledSoftware } from '@/models/Software'
import BaseUtil from '@/utils/base-util'
import {
  PluginConfig,
  type BackupItem,
  type BackupItemConfig,
  type BackupResult,
  type PluginOptions,
  type TaskMonitor,
} from '@/plugins/plugin-config'
import WinUtil from './win-util'

/** 插件 */
export class Plugin extends PluginConfig {
  constructor(config: Record<string, unknown>, cTime: string) {
    super(config, cTime)
    // 覆盖方法
    Object.assign(this, config)
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
   * 验证插件支持的软件源（免安装的）
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
   * 构建进度监听函数
   */
  protected buildMonitorProgressFn(monitor?: TaskMonitor) {
    return (log: string, curr: number) => {
      if (monitor && monitor.progress) {
        monitor.progress(log, curr, this.totalItemNum)
      }
    }
  }

  /**
   * 执行插件
   */
  public async execPlugin(
    options: PluginOptions,
    env: { [key: string]: string | undefined },
    monitor?: TaskMonitor,
    signal?: AbortSignal,
  ): Promise<BackupResult[]> {
    const progress: (log: string, curr: number) => void = this.buildMonitorProgressFn(monitor)

    let successCount = 0
    progress(`开始备份软件【${this.name}】`, successCount)
    const configLength = this.backupConfigs.length
    const results: BackupResult[] = []
    for (let i = 0; i < configLength; i++) {
      const backupConfig = this.backupConfigs[i]
      progress(`${i + 1}/${configLength} 开始备份软件配置[${backupConfig.name}]`, successCount)
      const result: BackupResult = {
        name: backupConfig.name,
        success: true,
        message: '操作成功',
        backedUpItems: [],
      }
      for (const item of backupConfig.items) {
        this.handleSignal(signal)
        try {
          const itemResult: BackupItem = await this.operateData(options, env, item, progress, successCount, signal)
          result.backedUpItems.push(itemResult)
          successCount++
        } catch (e) {
          result.error = BaseUtil.convertToCommonError(e)
          result.message = `备份失败：${result.error.message}`
          result.success = false
          break
        }
      }
      results.push(result)
    }
    progress(`软件【${this.name}】备份完成`, successCount)
    return results
  }

  /**
   * 操作数据
   */
  protected async operateData(
    options: PluginOptions,
    env: { [key: string]: string | undefined },
    item: BackupItemConfig,
    progress: (log: string, curr: number) => void,
    curr: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signal?: AbortSignal,
  ): Promise<BackupItem> {
    const execType = options.execType
    const [src, des] = [item.sourcePath, item.targetRelativePath]

    progress(`开始处理配置项[${des}]`, curr)
    let size = -1
    try {
      if (item.type === 'registry') {
        if (execType === 'backup') {
          size = await WinUtil.exportRegedit(src, options.dataDir + this.resolvePath(des, env, options.installDir))
        } else {
          size = await WinUtil.importRegedit(this.resolvePath(src, env, options.installDir), options.dataDir + des)
        }
      } else {
        size = await WinUtil.copyFile(
          execType === 'backup' ? this.resolvePath(src, env, options.installDir) : options.dataDir + des,
          execType === 'backup' ? options.dataDir + des : this.resolvePath(src, env, options.installDir),
        )
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
    return path.replace(/%installDir%/gi, installDir).replace(/%(\w+)%/gi, (_: string, key: string): string => {
      const value = env[key]
      return value !== undefined ? value : `%${key}%`
    })
  }
}
