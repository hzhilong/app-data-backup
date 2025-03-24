import fs from 'fs'
import { ipcMain } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { IPC_CHANNELS } from '@/models/ipc-channels'
import WinUtil from './win-util'
import { CommonError } from '@/models/common-error'
import { BuResult, execBusiness } from '@/models/bu-result'
import { Plugin } from './plugins'
import { Mutex } from 'async-mutex'
import { InstalledSoftware } from '@/models/software'
import BaseUtil from '@/utils/base-util'
import nLogger from './log4js'
import { getAppBasePath } from './app-path'
import {
  OpenPluginConfigSourcePathOptions,
  OpenTaskConfigPathOptions,
  PluginExecTask,
  TaskItemResult,
} from '@/plugins/plugin-task'
import { loadPluginConfig, ValidatedPluginConfig } from '@/plugins/plugin-config'
import BrowserWindow = Electron.BrowserWindow
import { throws } from 'assert'

// 初始化互斥锁
const initMutex = new Mutex()
// 已初始化
let initialized = false
// 初始化加载的插件配置
const loadedPluginConfigs: ValidatedPluginConfig[] = []
// 启用的插件 插件id->
const activePlugins = new Map<string, Plugin>()
// 终止信号 任务id->
const abortSignals = new Map<string, AbortController>()

// 初始化插件系统
function initPluginSystem(mainWindow: BrowserWindow) {
  // IPC 事件监听【获取插件】
  ipcMain.handle(IPC_CHANNELS.GET_PLUGINS, async (_event, softList: InstalledSoftware[]) => {
    // 🔒 获取锁（等待其他初始化操作完成）
    const release = await initMutex.acquire()
    try {
      if (initialized) {
        // 已初始化
        return BuResult.createSuccess(loadedPluginConfigs)
      }
      return execBusiness(() => {
        return initPlugins(softList)
      })
    } finally {
      release()
    }
  })
  // IPC 事件监听【刷新插件】
  ipcMain.handle(IPC_CHANNELS.REFRESH_PLUGINS, async (_event, softList: InstalledSoftware[]) => {
    const release = await initMutex.acquire()
    try {
      return execBusiness(() => {
        initialized = false
        return initPlugins(softList)
      })
    } finally {
      release()
    }
  })
  // IPC 事件监听【执行插件】
  ipcMain.handle(IPC_CHANNELS.EXEC_PLUGIN, async (event, task: PluginExecTask) => {
    return execBusiness(async () => {
      return await execPlugin(task, mainWindow)
    })
  })
  // IPC 事件监听【停止执行插件】
  ipcMain.handle(IPC_CHANNELS.STOP_EXEC_PLUGIN, async (event, task: PluginExecTask) => {
    return execBusiness(async () => {
      const abortController = abortSignals.get(task.id)
      if (abortController) {
        abortController.abort('取消任务')
        // 清空临时资源
        clearOnPluginStop(task.id)
      } else {
        throw new CommonError('该任务未执行')
      }
    })
  })
  // IPC 事件监听【打开插件备份配置源路径】
  ipcMain.handle(IPC_CHANNELS.OPEN_PLUGIN_CONFIG_SOURCE_PATH, async (event, options: OpenPluginConfigSourcePathOptions) => {
    return execBusiness(async () => {
      return await openPluginConfigSourcePath(options)
    })
  })
  // IPC 事件监听【打开任务备份配置路径】
  ipcMain.handle(IPC_CHANNELS.OPEN_TASK_CONFIG_PATH, async (event, options: OpenTaskConfigPathOptions) => {
    return execBusiness(async () => {
      return await openTaskConfigPath(options)
    })
  })
  // 先在主进程初始化一次
  initPlugins().then((r) => {})
}

// 获取插件文件
function getPluginFiles(...paths: string[]): string[] {
  nLogger.info(`准备加载插件目录`, paths)
  const pluginFiles = []
  const rootDir = process.env.VITE_DEV_SERVER_URL ? 'dist/' : 'resources/'
  const rootPath = path.join(getAppBasePath(), rootDir)
  for (const item of paths) {
    const pluginsDir = path.join(rootPath, item)
    nLogger.info(`正在加载插件目录 ${pluginsDir}`)
    if (fs.existsSync(pluginsDir)) {
      pluginFiles.push(
        ...fs
          .readdirSync(pluginsDir)
          .filter((file) => file.endsWith('.js'))
          .map((file) => path.join(pluginsDir, file)),
      )
    } else {
      nLogger.info(`插件目录为空 ${pluginsDir}`)
    }
  }
  return pluginFiles
}

// 初始化插件
async function initPlugins(softList?: InstalledSoftware[]): Promise<ValidatedPluginConfig[]> {
  loadedPluginConfigs.length = 0
  activePlugins.clear()
  abortSignals.clear()

  // 获取这两个目录下的插件
  const pluginFiles = getPluginFiles('plugins/core', 'plugins/custom')
  // 环境变量
  let env = WinUtil.getEnv()

  for (const filePath of pluginFiles) {
    try {
      const fileName = path.parse(filePath).name
      nLogger.info('开始加载插件', fileName)
      // 动态导入插件模块
      const module = await import(pathToFileURL(filePath).href)
      // 模块配置
      const moduleConfig = module.default as Record<string, unknown>
      // 插件创建时间
      const cTime = BaseUtil.getFormatedDateTime(fs.statSync(filePath).birthtime)
      // 实例化插件配置
      const pluginConfig = loadPluginConfig(moduleConfig, cTime, fileName)
      // 实例化插件
      const plugin = new Plugin(pluginConfig, moduleConfig)
      // 已验证的插件
      const validatedPluginConfig: ValidatedPluginConfig = {
        ...pluginConfig,
        softInstallDir: '', // 初始化时的配置不进行验证
      }
      // 如果传递已安装的软件信息，则进行插件验证
      if (softList) {
        Object.assign(validatedPluginConfig, getValidatedFields(plugin.detect(softList, env)))
      }
      // 初始化换成
      activePlugins.set(pluginConfig.id, plugin)
      loadedPluginConfigs.push(validatedPluginConfig)
      nLogger.info(`插件加载成功: ${fileName}`)
    } catch (error) {
      nLogger.error(`加载插件 ${path.basename(filePath, '.js')} 失败:`, error)
    }
  }
  initialized = true
  nLogger.info('插件系统初始化成功', activePlugins)
  return loadedPluginConfigs
}

// 获取验证后的字段
function getValidatedFields(detectResult: InstalledSoftware | string | undefined) {
  if (!detectResult) {
    return {}
  } else if (typeof detectResult === 'string') {
    return {
      softInstallDir: detectResult,
    }
  } else {
    return {
      softName: detectResult.name,
      softBase64Icon: detectResult.base64Icon,
      softIconPath: detectResult.iconPath,
      softInstallDir: detectResult.installDir,
      softRegeditDir: detectResult.regeditDir,
    }
  }
}

// 停止执行插件后清空临时的资源
function clearOnPluginStop(taskOrId: PluginExecTask | string) {
  if (!taskOrId) return
  if (typeof taskOrId === 'string') {
    if (abortSignals.has(taskOrId)) {
      abortSignals.delete(taskOrId)
    }
  } else if (abortSignals.has(taskOrId.id)) {
    abortSignals.delete(taskOrId.id)
  }
}

// 执行插件
async function execPlugin(task: PluginExecTask, mainWindow: Electron.BrowserWindow) {
  const pluginId = task.pluginId
  nLogger.info(`准备执行插件[${pluginId}] 任务：`, task)
  const taskId = task.id
  const plugin = activePlugins.get(pluginId)
  if (!plugin) {
    nLogger.info(`未找到插件[${pluginId}]，可能已被删除`)
    throw new CommonError(`未找到插件[${pluginId}]，可能已被删除`)
  }
  const abortController = new AbortController()
  abortSignals.set(taskId, abortController)

  nLogger.info(`开始执行插件[${pluginId}] 任务 ${taskId}`)
  const ranTask = await plugin.execPlugin(
    task,
    WinUtil.getEnv(),
    {
      progress(log: string, curr: number, total: number): void {
        nLogger.info(`插件[${pluginId}] 任务 ${taskId} 执行进度：${curr}/${total} ${log}`)
        // 通知渲染进程该插件的执行进度
        mainWindow?.webContents.send(IPC_CHANNELS.GET_PLUGIN_PROGRESS, taskId, log, curr, total)
      },
      onItemFinished(configName: string, configItemResult: TaskItemResult): void {
        nLogger.info(
          `插件[${pluginId}] 任务 ${taskId} 配置[${configName}]子项[${configItemResult.sourcePath}]执行结束：`,
          configItemResult,
        )
        mainWindow?.webContents.send(IPC_CHANNELS.ON_PLUGIN_ITEM_FINISHED, taskId, configName, configItemResult)
      },
    },
    abortController.signal,
  )
  nLogger.info(`插件[${pluginId}] 任务 ${taskId} 执行完成：`, ranTask)
  clearOnPluginStop(task)
  return ranTask
}

/**
 * 打开插件备份配置源路径
 * @param options
 */
async function openPluginConfigSourcePath(options: OpenPluginConfigSourcePathOptions) {
  if (options.itemConfig.type === 'registry') {
    return WinUtil.openRegedit(options.itemConfig.sourcePath)
  } else {
    if (!options.softInstallDir) {
      throw new CommonError('无关联的软件目录')
    }
    const resolvePath = Plugin.resolvePath(options.itemConfig.sourcePath, WinUtil.getEnv(), options.softInstallDir)
    return WinUtil.openPath(resolvePath)
  }
}

/**
 * 打开任务备份配置路径
 * @param options
 */
async function openTaskConfigPath(options: OpenTaskConfigPathOptions) {
  const optPath = options.type === 'source' ? options.itemConfig.sourcePath : options.itemConfig.targetRelativePath
  if (options.itemConfig.type === 'registry' && options.type === 'source') {
    return WinUtil.openRegedit(optPath)
  } else {
    const resolvePath = Plugin.resolvePath(optPath, WinUtil.getEnv(), options.softInstallDir)
    if (options.type === 'source') {
      return WinUtil.openPath(resolvePath)
    } else {
      return WinUtil.openPath(path.join(options.backupPath, resolvePath))
    }
  }
}

export { initPluginSystem }
