import fs from 'fs'
import { app, ipcMain } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { IPC_CHANNELS } from '@/models/IpcChannels'
import WinUtil from './win-util'
import { CommonError } from '@/models/CommonError'
import { BuResult, execBusiness } from '@/models/BuResult'
import { loadPluginConfig, PluginOptions, ValidatedPluginConfig } from '@/plugins/plugin-config'
import { Plugin } from './plugins'
import { Mutex } from 'async-mutex'
import { InstalledSoftware } from '@/models/Software'
import BaseUtil from '@/utils/base-util'
import nLogger from './log4js'
import BrowserWindow = Electron.BrowserWindow

// 初始化互斥锁
const initMutex = new Mutex()
// 已初始化
let initialized = false
// 初始化加载的插件配置
const loadedPluginConfigs: ValidatedPluginConfig[] = []
// 启用的插件
const activePlugins = new Map<string, Plugin>()
// 终止信号
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
  ipcMain.handle(IPC_CHANNELS.EXEC_PLUGIN, async (event, id: string, options: PluginOptions) => {
    return execBusiness(async () => {
      return await execPlugin(id, options, mainWindow)
    })
  })
  // IPC 事件监听【停止执行插件】
  ipcMain.handle(IPC_CHANNELS.STOP_EXEC_PLUGIN, async (event, id: string) => {
    const abortController = abortSignals.get(id)
    if (abortController) {
      abortController.abort('取消任务')
      // 清空临时资源
      clearOnPluginStop(id)
    }
  })
  // 先在主进程初始化一次
  initPlugins().then((r) => {})
}

// 获取插件文件
function getPluginFiles(...paths: string[]): string[] {
  const pluginFiles = []
  const rootDir = process.env.VITE_DEV_SERVER_URL ? 'dist/' : 'resources/'
  for (const item of paths) {
    const pluginsDir = path.join(path.dirname(app.getPath('exe')), rootDir, item)
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
      nLogger.info('加载插件', filePath)
      // 动态导入插件模块
      const module = await import(pathToFileURL(filePath).href)
      const config = module.default as Record<string, unknown>
      const cTime = BaseUtil.getFormatedDateTime(fs.statSync(filePath).birthtime)
      // 实例化插件配置
      const pluginConfig = loadPluginConfig(config, cTime)
      // 实例化插件
      const plugin = new Plugin(pluginConfig, cTime)
      // 覆盖插件方法
      Object.assign(plugin, config)
      const validatedPluginConfig: ValidatedPluginConfig = {
        ...pluginConfig,
      }
      if (softList) {
        Object.assign(validatedPluginConfig, getValidatedFields(plugin.detect(softList, env)))
      }
      activePlugins.set(pluginConfig.id, plugin)
      loadedPluginConfigs.push(validatedPluginConfig)
      console.log(`插件加载成功: ${config.id}`)
    } catch (error) {
      console.error(`加载插件 ${path.basename(filePath, '.js')} 失败:`, error)
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
function clearOnPluginStop(pluginOrId: Plugin | string) {
  if (!pluginOrId) return
  if (typeof pluginOrId === 'string') {
    if (abortSignals.has(pluginOrId)) {
      abortSignals.delete(pluginOrId)
    }
  } else if (abortSignals.has(pluginOrId.id)) {
    abortSignals.delete(pluginOrId.id)
  }
}

// 执行插件
async function execPlugin(id: string, options: PluginOptions, mainWindow: Electron.BrowserWindow) {
  const plugin = activePlugins.get(id)
  if (!plugin) {
    nLogger.info('插件id错误', id)
    throw new CommonError('插件id错误')
  }
  const abortController = new AbortController()
  abortSignals.set(id, abortController)

  nLogger.info(`开始执行插件[${id}]：${options}`)
  const backupResults = await plugin.execPlugin(
    options,
    WinUtil.getEnv(),
    {
      progress(log: string, curr: number, total: number): void {
        nLogger.info(`插件[${id}]执行进度：${curr}/${total} ${log}`)
        // 通知渲染进程该插件的执行进度
        mainWindow?.webContents.send(IPC_CHANNELS.GET_PLUGIN_PROGRESS, id, log, curr, total)
      },
    },
    abortController.signal,
  )
  nLogger.info(`插件[${id}]执行完成：${backupResults}`)
  clearOnPluginStop(id)
  return backupResults
}

export { initPluginSystem }
