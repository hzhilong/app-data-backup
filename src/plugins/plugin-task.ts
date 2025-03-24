import type { BackupItemConfig, BackupPluginTypeKey } from '@/plugins/plugin-config'
import { CommonError } from '@/models/common-error'

/**
 * 任务运行类型 手动/自动
 */
export type TaskRunType = 'auto' | 'manual'

/**
 * 任务状态
 */
export type TaskState = 'pending' | 'running' | 'stopped' | 'finished'

export const getTaskStateText = (state: TaskState) => {
  switch (state) {
    case 'pending':
      return '待运行'
    case 'running':
      return '运行中'
    case 'stopped':
      return '已暂停'
    case 'finished':
      return '已结束'
  }
}

/**
 * 插件执行类型
 */
export type PluginExecType = 'backup' | 'restore'

export const getPluginExecName = (type: PluginExecType) => {
  return type === 'backup' ? '备份' : '还原'
}

/**
 * 任务监听
 */
export interface TaskMonitor {
  /**
   * 总体进度
   * @param log 进度文本
   * @param curr 当前进度
   * @param total 总的进度
   */
  progress: (log: string, curr: number, total: number) => void
  /**
   * 子项执行结束
   * @param configName 备份配置名称
   * @param configItemResult  备份配置子项结果
   */
  onItemFinished: (configName: string, configItemResult: TaskItemResult) => void
}

/**
 * 任务操作项的结果
 */
export type TaskItemResult = BackupItemConfig & {
  /** 是否已结束 */
  finished: boolean
  /** 是否成功 */
  success?: boolean
  /** 结果信息 */
  message?: string
  /** 错误 */
  error?: CommonError
  /** 操作的文件大小 */
  size?: number
  /** 操作的文件大小描述 */
  sizeStr?: string
  /** 是否已跳过 */
  skipped?: boolean
  /** 其他元数据 */
  meta?: Record<string, unknown>
}

/**
 * 任务执行结果 根据插件配置分类，一个插件可以有多个配置，配置可以有多个配置子项
 */
export interface TaskResult {
  /** 插件配置名称 */
  configName: string
  /** 插件配置操作项结果 */
  configItems: TaskItemResult[]
}

/**
 * 插件执行任务
 */
export interface PluginExecTask {
  /** 任务 */
  id: string
  /** 任务运行类型 手动/自动 */
  runType: TaskRunType
  /** 任务状态 */
  state: TaskState
  /** 插件执行类型 */
  pluginExecType: PluginExecType
  /** 所有项目都备份成功？ */
  success?: boolean
  /** 任务信息 */
  message: string
  /** 任务结果 */
  taskResults: TaskResult[]
  /** 数据目录/备份数据保存的目录 */
  backupPath: string
  /** 当前进度 */
  currProgress: number
  /** 总的进度 */
  totalProgress: number
  /** 进度文本 */
  progressText: string
  /** 创建时间 */
  cTime: string
  /** 后面都是从ValidatedPluginConfig拷贝出来的属性，方便IndexedDB索引 */
  /** 插件类型 */
  pluginType: BackupPluginTypeKey
  /** 插件id（文件名） */
  pluginId: string
  /** 插件名称（软件名） */
  pluginName: string
  /** 软件安装目录 */
  softInstallDir: string
}

/**
 * 打开插件备份配置路径的选项
 */
export interface OpenPluginConfigSourcePathOptions {
  itemConfig: BackupItemConfig
  softName: string
  softInstallDir?: string
}

/**
 * 打开任务备份配置路径的选项
 */
export interface OpenTaskConfigPathOptions extends OpenPluginConfigSourcePathOptions{
  type: 'source' | 'target'
  softInstallDir: string
  backupPath: string
}
