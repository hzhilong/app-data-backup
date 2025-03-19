// 插件接口定义
import { AbortedError } from '@/models/CommonError'
import { formatSize, type InstalledSoftware } from '@/models/Software'
import BaseUtil from '@/utils/base-util'
import {
  BackupConfig,
  type BackupItem,
  type BackupItemConfig,
  BackupPluginTypeKey,
  type BackupResult,
  PluginConfig,
  type PluginOptions,
  type TaskMonitor
} from '@/plugins/plugin-config'
import WinUtil from './win-util'
import path from 'path'

/** 插件 */
export class Plugin implements PluginConfig {
  id: string
  name: string
  type: BackupPluginTypeKey
  backupConfigs: BackupConfig[]
  totalItemNum: number
  cTime: string

  constructor(config: PluginConfig, cTime: string) {
    const { id, name, type, backupConfigs, totalItemNum } = config
    this.id = id
    this.name = name
    this.type = type
    this.backupConfigs = backupConfigs
    this.totalItemNum = totalItemNum
    this.cTime = cTime
  }

  /**
   * 验证插件支持的软件源
   * [安装程序]需返回 InstalledSoftware
   * [免安装的、自定义]需返回 软件路径
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
    } else if (this.type === 'CUSTOM') {
      return this.detectOfCustom(env)
    }
  }

  /**
   * 验证插件（安装程序）支持的软件源，默认使用nameWithoutVersion进行判断
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

  /**
   * 验证插件支持的软件源（自定义的）
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public detectOfCustom(env: { [key: string]: string | undefined }): string | undefined {
    return undefined
  }

  /**
   * 验证插件支持的软件源（通过安装路径的文件夹名）
   * @param list
   * @param env
   */
  public detectByInstallLocationDir(list: InstalledSoftware[]) {
    for (const soft of list) {
      if (new RegExp(`[/\\\\]${this.name}\$`).test(soft.installLocation)) {
        return soft
      }
    }
  }

  /** 判断可支持的软件版本 */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public supportableVersion(version: string): boolean {
    return true
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

    let processedCount = 0
    progress(`开始备份软件【${this.name}】`, processedCount)
    const configLength = this.backupConfigs.length
    const results: BackupResult[] = []
    for (let i = 0; i < configLength; i++) {
      const backupConfig = this.backupConfigs[i]
      progress(`${i + 1}/${configLength} 开始备份软件配置[${backupConfig.name}]`, processedCount)
      const result: BackupResult = {
        success: true,
        message: '操作成功',
        backedUpItems: [],
      }
      for (const item of backupConfig.items) {
        try {
          const itemResult: BackupItem = await this.operateData(options, env, item, progress, processedCount, signal)
          result.backedUpItems!.push(itemResult)
        } catch (e) {
          if (e instanceof AbortedError) {
            progress(e.message, processedCount)
            results.push({
              success: false,
              message: e.message,
            })
            return results
          }
          if (item.skipIfMissing) {
            result.message = `已跳过缺失项`
          } else {
            result.error = BaseUtil.convertToCommonError(e)
            result.message = `备份失败：${result.error.message}`
            result.success = false
          }
        } finally {
          processedCount++
        }
      }
      results.push(result)
    }
    progress(`软件【${this.name}】备份完成`, processedCount)
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
    processedCount: number,
    signal?: AbortSignal,
  ): Promise<BackupItem> {
    return new Promise(async (resolve, reject) => {
      // 前置检查：如果 signal 已终止，直接拒绝
      if (signal?.aborted) {
        reject(new AbortedError())
        return
      }
      // 监听 signal.abort
      const abortHandler = () => {
        reject(new AbortedError())
      }
      try {
        progress(`开始处理配置项[${item.targetRelativePath}]`, processedCount)
        signal?.addEventListener('abort', abortHandler)
        const execType = options.execType
        const [src, des] = [
          this.resolvePath(item.sourcePath, env, options.installDir),
          this.resolvePath(item.targetRelativePath, env),
        ]
        const filePath = path.join(options.dataDir, des)
        const operations = {
          registry: {
            backup: () => WinUtil.exportRegedit(src, filePath),
            restore: () => WinUtil.importRegedit(src, filePath),
          },
          file: {
            backup: () => WinUtil.copyFile(src, filePath, signal),
            restore: () => WinUtil.copyFile(filePath, src, signal),
          },
        }
        const size = await operations[item.type][execType]()
        resolve({
          ...item,
          size,
          sizeStr: formatSize(size),
        })
      } catch (e) {
        throw e
      } finally {
        signal?.removeEventListener('abort', abortHandler)
      }
    })
  }

  protected resolvePath(path: string, env: { [key: string]: string | undefined }, installDir?: string) {
    let newList = path
    if (installDir) {
      newList = path.replace(/%installDir%/gi, installDir)
    }
    return newList.replace(/%(\w+)%/gi, (_: string, key: string): string => {
      const value = env[key]
      return value !== undefined ? value : `%${key}%`
    })
  }
}
